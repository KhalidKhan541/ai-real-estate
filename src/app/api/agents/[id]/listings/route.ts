import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cache } from "@/lib/cache";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");

    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    const cacheKey = `agent:${id}:listings:${JSON.stringify({ page, limit, status })}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = { agentId: id };
    if (status) where.status = status;

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
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: "desc" },
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
        reviewCount: listing.property.reviews.length,
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

    cache.set(cacheKey, result, 3 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent listings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent listings" },
      { status: 500 }
    );
  }
}
