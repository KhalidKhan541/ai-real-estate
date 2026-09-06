import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

const statusTransitions: Record<string, string[]> = {
  DRAFT: ["ACTIVE", "WITHDRAWN"],
  ACTIVE: ["PENDING", "EXPIRED", "WITHDRAWN"],
  PENDING: ["ACTIVE", "SOLD", "WITHDRAWN"],
  SOLD: [],
  EXPIRED: ["ACTIVE", "WITHDRAWN"],
  WITHDRAWN: ["DRAFT"],
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        _count: { select: { offers: true } },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const validTransitions = statusTransitions[listing.status] || [];

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        validTransitions,
        offerCount: listing._count.offers,
        _count: undefined,
        isExpired: listing.expiresAt ? new Date(listing.expiresAt) < new Date() : false,
      },
    });
  } catch (error) {
    console.error("Listing status fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing status" },
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
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const statusSchema = z.object({
      status: z.enum(["DRAFT", "ACTIVE", "PENDING", "SOLD", "EXPIRED", "WITHDRAWN"]),
    });

    const validatedData = statusSchema.parse(body);

    const allowedTransitions = statusTransitions[listing.status] || [];
    if (!allowedTransitions.includes(validatedData.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${listing.status} to ${validatedData.status}`,
          allowedTransitions,
        },
        { status: 400 }
      );
    }

    if (validatedData.status === "SOLD") {
      const acceptedOffer = await prisma.offer.findFirst({
        where: { listingId: id, status: "ACCEPTED" },
      });

      if (!acceptedOffer) {
        return NextResponse.json(
          { success: false, error: "Cannot mark as sold without an accepted offer" },
          { status: 400 }
        );
      }

      await prisma.transaction.create({
        data: {
          listingId: id,
          offerId: acceptedOffer.id,
          buyerId: acceptedOffer.userId,
          sellerId: listing.userId,
          salePrice: acceptedOffer.amount,
          status: "PENDING",
        },
      });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { status: validatedData.status as never },
    });

    return NextResponse.json({
      success: true,
      data: updatedListing,
      message: `Listing status updated to ${validatedData.status}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Listing status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update listing status" },
      { status: 500 }
    );
  }
}
