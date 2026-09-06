import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { cache } from "@/lib/cache";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const cacheKey = `listing:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: { orderBy: { order: "asc" } },
            virtualTour: true,
            neighborhoods: true,
            aiValuation: true,
            reviews: {
              include: { user: { select: { id: true, name: true, avatar: true } } },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
        agent: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        offers: {
          where: { status: { not: "WITHDRAWN" } },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { amount: "desc" },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const avgRating =
      listing.property.reviews.length > 0
        ? listing.property.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.property.reviews.length
        : null;

    const result = {
      success: true,
      data: {
        ...listing,
        property: {
          ...listing.property,
          avgRating,
          reviewCount: listing.property.reviews.length,
        },
        views: listing.views + 1,
      },
    };

    cache.set(cacheKey, result, 5 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Listing fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing" },
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
    const updateSchema = z.object({
      price: z.number().positive().optional(),
      description: z.string().max(2000).optional(),
      openHouse: z.string().datetime().optional().nullable(),
      expiresAt: z.string().datetime().optional().nullable(),
    });

    const validatedData = updateSchema.parse(body);

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...validatedData,
        openHouse: validatedData.openHouse ? new Date(validatedData.openHouse) : validatedData.openHouse === null ? null : undefined,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : validatedData.expiresAt === null ? null : undefined,
      },
      include: {
        property: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      },
    });

    cache.delete(`listing:${id}`);
    cache.invalidatePattern("listings:*");

    return NextResponse.json({
      success: true,
      data: updatedListing,
      message: "Listing updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Listing update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const hasAcceptedOffers = await prisma.offer.findFirst({
      where: { listingId: id, status: "ACCEPTED" },
    });

    if (hasAcceptedOffers) {
      return NextResponse.json(
        { success: false, error: "Cannot delete listing with accepted offers" },
        { status: 400 }
      );
    }

    await prisma.listing.delete({ where: { id } });

    cache.delete(`listing:${id}`);
    cache.invalidatePattern("listings:*");

    return NextResponse.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("Listing deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
