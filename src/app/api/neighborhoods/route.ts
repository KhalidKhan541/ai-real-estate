import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");

    const cacheKey = `neighborhoods:${city}:${state}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = { contains: state, mode: "insensitive" };

    const neighborhoods = await prisma.neighborhood.findMany({
      where,
      include: {
        schools: { select: { id: true, name: true, type: true, rating: true } },
        _count: { select: { properties: true } },
      },
      orderBy: { name: "asc" },
    });

    const enrichedNeighborhoods = neighborhoods.map((n) => ({
      ...n,
      propertyCount: n._count.properties,
      _count: undefined,
      avgSchoolRating:
        n.schools.length > 0
          ? n.schools.reduce((sum, s) => sum + (s.rating || 0), 0) / n.schools.length
          : null,
    }));

    const result = { success: true, data: enrichedNeighborhoods };
    cache.set(cacheKey, result, 30 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Neighborhoods fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch neighborhoods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const createSchema = z.object({
      name: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
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
      ).default([]),
    });

    const validatedData = createSchema.parse(body);

    const existing = await prisma.neighborhood.findFirst({
      where: {
        name: validatedData.name,
        city: validatedData.city,
        state: validatedData.state,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Neighborhood already exists" },
        { status: 409 }
      );
    }

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name: validatedData.name,
        city: validatedData.city,
        state: validatedData.state,
        description: validatedData.description,
        avgPrice: validatedData.avgPrice,
        walkScore: validatedData.walkScore,
        transitScore: validatedData.transitScore,
        crimeScore: validatedData.crimeScore,
        schools: {
          create: validatedData.schools,
        },
      },
      include: { schools: true },
    });

    cache.invalidatePattern("neighborhoods:*");

    return NextResponse.json(
      { success: true, data: neighborhood, message: "Neighborhood created" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Neighborhood creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create neighborhood" },
      { status: 500 }
    );
  }
}
