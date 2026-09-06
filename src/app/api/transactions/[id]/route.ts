import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

const statusFlow: Record<string, string[]> = {
  PENDING: ["INSPECTION", "CANCELLED"],
  INSPECTION: ["APPRAISAL", "CANCELLED"],
  APPRAISAL: ["FINANCING", "CANCELLED"],
  FINANCING: ["CLOSING", "CANCELLED"],
  CLOSING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        seller: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        documents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const validTransitions = statusFlow[transaction.status] || [];
    const now = new Date();
    const daysUntilClosing = transaction.closingDate
      ? Math.ceil((new Date(transaction.closingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        role: isBuyer ? "buyer" : "seller",
        validTransitions,
        daysUntilClosing,
        isOverdue: transaction.closingDate && new Date(transaction.closingDate) < now && transaction.status !== "COMPLETED",
        timeline: [
          { status: "PENDING", label: "Offer Accepted", completed: true },
          { status: "INSPECTION", label: "Home Inspection", completed: ["INSPECTION", "APPRAISAL", "FINANCING", "CLOSING", "COMPLETED"].includes(transaction.status) },
          { status: "APPRAISAL", label: "Appraisal", completed: ["APPRAISAL", "FINANCING", "CLOSING", "COMPLETED"].includes(transaction.status) },
          { status: "FINANCING", label: "Financing", completed: ["FINANCING", "CLOSING", "COMPLETED"].includes(transaction.status) },
          { status: "CLOSING", label: "Closing", completed: ["CLOSING", "COMPLETED"].includes(transaction.status) },
          { status: "COMPLETED", label: "Completed", completed: transaction.status === "COMPLETED" },
        ],
      },
    });
  } catch (error) {
    console.error("Transaction fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const isBuyer = transaction.buyerId === session.user.id;
    const isSeller = transaction.sellerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      status: z.enum(["INSPECTION", "APPRAISAL", "FINANCING", "CLOSING", "COMPLETED", "CANCELLED"]).optional(),
      closingDate: z.string().optional(),
      actualClosing: z.string().optional(),
      notes: z.string().max(2000).optional(),
    });

    const validatedData = updateSchema.parse(body);

    if (validatedData.status) {
      const allowedTransitions = statusFlow[transaction.status] || [];
      if (!allowedTransitions.includes(validatedData.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from ${transaction.status} to ${validatedData.status}`,
            allowedTransitions,
          },
          { status: 400 }
        );
      }

      if (validatedData.status === "CANCELLED" && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Only admins can cancel transactions" },
          { status: 403 }
        );
      }
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(validatedData.status && { status: validatedData.status as never }),
        ...(validatedData.closingDate && { closingDate: new Date(validatedData.closingDate) }),
        ...(validatedData.actualClosing && { actualClosing: new Date(validatedData.actualClosing) }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: `Transaction updated to ${validatedData.status || "updated"}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Transaction update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}
