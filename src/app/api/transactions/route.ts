import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (session.user.role === "ADMIN") {
    } else {
      where.OR = [
        { buyerId: session.user.id },
        { sellerId: session.user.id },
      ];
    }

    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, email: true, avatar: true } },
          seller: { select: { id: true, name: true, email: true, avatar: true } },
          documents: true,
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    const enrichedTransactions = transactions.map((t) => {
      const now = new Date();
      const daysUntilClosing = t.closingDate
        ? Math.ceil((new Date(t.closingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...t,
        daysUntilClosing,
        isOverdue: t.closingDate && new Date(t.closingDate) < now && t.status !== "COMPLETED",
        role: t.buyerId === session.user.id ? "buyer" : "seller",
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
