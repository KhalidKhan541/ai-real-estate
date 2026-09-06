import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const cacheKey = `listings:${JSON.stringify({ page, limit, status, sortBy, order, minPrice, maxPrice })}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      };
    }

    const offset = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          property: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              reviews: { select: { rating: true } },
            },
          },
          agent: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
          user: { select: { id: true, name: true } },
          _count: { select: { offers: true } },
        },
        orderBy: { [sortBy]: order },
        skip: offset,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const enrichedListings = listings.map((listing) => ({
      ...listing,
      offerCount: listing._count.offers,
      _count: undefined,
      property: {
        ...listing.property,
        avgRating:
          listing.property.reviews.length > 0
            ? listing.property.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.property.reviews.length
            : null,
        reviews: undefined,
      },
    }));

    const result = {
      success: true,
      data: enrichedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    cache.set(cacheKey, result, 2 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Listings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const createSchema = z.object({
      propertyId: z.string(),
      price: z.number().positive(),
      description: z.string().max(2000).optional(),
      openHouse: z.string().datetime().optional(),
      expiresAt: z.string().datetime().optional(),
    });

    const validatedData = createSchema.parse(body);

    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const existingActiveListing = await prisma.listing.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        status: { in: ["ACTIVE", "PENDING"] },
      },
    });

    if (existingActiveListing) {
      return NextResponse.json(
        { success: false, error: "Property already has an active listing" },
        { status: 409 }
      );
    }

    let agentId: string | undefined;
    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
    });
    if (agent) agentId = agent.id;

    const listing = await prisma.listing.create({
      data: {
        propertyId: validatedData.propertyId,
        userId: session.user.id,
        agentId,
        price: validatedData.price,
        description: validatedData.description,
        openHouse: validatedData.openHouse ? new Date(validatedData.openHouse) : null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        status: "ACTIVE",
      },
      include: {
        property: { include: { images: true } },
      },
    });

    cache.invalidatePattern("listings:*");

    return NextResponse.json(
      { success: true, data: listing, message: "Listing created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Listing creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
