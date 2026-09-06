import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!offer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    if (offer.listing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the seller can make counter offers" },
        { status: 403 }
      );
    }

    if (!["PENDING", "COUNTERED"].includes(offer.status)) {
      return NextResponse.json(
        { success: false, error: "Can only counter pending or countered offers" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const counterSchema = z.object({
      amount: z.number().positive(),
      conditions: z.array(z.string()).optional(),
      financingType: z.string().optional(),
      inspectionPeriod: z.number().min(0).max(30).optional(),
      closingDate: z.string().optional(),
      message: z.string().max(2000).optional(),
      expiresAt: z.string().optional(),
    });

    const validatedData = counterSchema.parse(body);

    await prisma.offer.update({
      where: { id },
      data: { status: "COUNTERED" },
    });

    const counterOffer = await prisma.offer.create({
      data: {
        listingId: offer.listingId,
        userId: offer.userId,
        amount: validatedData.amount,
        conditions: validatedData.conditions || offer.conditions,
        financingType: validatedData.financingType || offer.financingType,
        inspectionPeriod: validatedData.inspectionPeriod || offer.inspectionPeriod,
        closingDate: validatedData.closingDate ? new Date(validatedData.closingDate) : offer.closingDate,
        message: validatedData.message,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        listing: {
          include: {
            property: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          originalOffer: { id: offer.id, status: "COUNTERED" },
          counterOffer,
        },
        message: "Counter offer submitted",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Counter offer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create counter offer" },
      { status: 500 }
    );
  }
}
