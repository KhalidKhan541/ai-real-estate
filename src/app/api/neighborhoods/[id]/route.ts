import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { cache } from "@/lib/cache";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const cacheKey = `neighborhood:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        schools: { orderBy: { rating: "desc" } },
        properties: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            listings: { where: { status: "ACTIVE" }, take: 1, select: { price: true } },
            reviews: { select: { rating: true } },
          },
          take: 10,
          orderBy: { updatedAt: "desc" },
        },
        _count: { select: { properties: true } },
      },
    });

    if (!neighborhood) {
      return NextResponse.json(
        { success: false, error: "Neighborhood not found" },
        { status: 404 }
      );
    }

    const priceStats = await prisma.listing.aggregate({
      where: {
        status: "ACTIVE",
        property: {
          neighborhoods: { some: { id } },
        },
      },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: true,
    });

    const result = {
      success: true,
      data: {
        ...neighborhood,
        propertyCount: neighborhood._count.properties,
        _count: undefined,
        priceStats: {
          avg: priceStats._avg.price ? Math.round(priceStats._avg.price) : null,
          min: priceStats._min.price,
          max: priceStats._max.price,
          listingCount: priceStats._count,
        },
        properties: neighborhood.properties.map((p) => ({
          ...p,
          avgRating:
            p.reviews.length > 0
              ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
              : null,
          reviews: undefined,
          activePrice: p.listings[0]?.price || p.price,
          listings: undefined,
        })),
        avgSchoolRating:
          neighborhood.schools.length > 0
            ? neighborhood.schools.reduce((sum, s) => sum + (s.rating || 0), 0) / neighborhood.schools.length
            : null,
      },
    };

    cache.set(cacheKey, result, 15 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Neighborhood fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch neighborhood" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const updateSchema = z.object({
      description: z.string().max(2000).optional(),
      avgPrice: z.number().optional(),
      walkScore: z.number().min(0).max(100).optional(),
      transitScore: z.number().min(0).max(100).optional(),
      crimeScore: z.number().min(0).max(100).optional(),
      schools: z.array(
        z.object({
          name: z.string().min(1),
          type: z.string().min(1),
          rating: z.number().min(0).max(10).optional(),
          address: z.string().optional(),
        })
      ).optional(),
    });

    const validatedData = updateSchema.parse(body);

    const existing = await prisma.neighborhood.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Neighborhood not found" },
        { status: 404 }
      );
    }

    const { schools, ...updateData } = validatedData;

    const neighborhood = await prisma.neighborhood.update({
      where: { id },
      data: updateData,
      include: { schools: true },
    });

    if (schools) {
      await prisma.school.deleteMany({ where: { neighborhoodId: id } });
      await prisma.school.createMany({
        data: schools.map((s) => ({
          neighborhoodId: id,
          name: s.name,
          type: s.type,
          rating: s.rating,
          address: s.address,
        })),
      });
    }

    cache.delete(`neighborhood:${id}`);
    cache.invalidatePattern("neighborhoods:*");

    const updated = await prisma.neighborhood.findUnique({
      where: { id },
      include: { schools: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Neighborhood updated",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Neighborhood update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update neighborhood" },
      { status: 500 }
    );
  }
}
