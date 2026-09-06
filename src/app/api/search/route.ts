import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { cache } from "@/lib/cache";

const searchSchema = z.object({
  query: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  propertyType: z.string().optional(),
  minBedrooms: z.coerce.number().min(0).optional(),
  maxBedrooms: z.coerce.number().min(0).optional(),
  minBathrooms: z.coerce.number().min(0).optional(),
  maxBathrooms: z.coerce.number().min(0).optional(),
  minSquareFeet: z.coerce.number().min(0).optional(),
  maxSquareFeet: z.coerce.number().min(0).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  features: z.string().optional(),
  sort: z.enum(["relevance", "price", "createdAt", "squareFeet", "distance"]).default("relevance"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = searchSchema.parse(params);

    const cacheKey = `search:${JSON.stringify(validatedParams)}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const { sort, order, page, limit, features, query, ...filters } = validatedParams;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const orderBy: Record<string, string> = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ];
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice && { gte: filters.minPrice }),
        ...(filters.maxPrice && { lte: filters.maxPrice }),
      };
    }

    if (filters.propertyType) {
      where.propertyType = filters.propertyType;
    }

    if (filters.minBedrooms || filters.maxBedrooms) {
      where.bedrooms = {
        ...(filters.minBedrooms && { gte: filters.minBedrooms }),
        ...(filters.maxBedrooms && { lte: filters.maxBedrooms }),
      };
    }

    if (filters.minBathrooms || filters.maxBathrooms) {
      where.bathrooms = {
        ...(filters.minBathrooms && { gte: filters.minBathrooms }),
        ...(filters.maxBathrooms && { lte: filters.maxBathrooms }),
      };
    }

    if (filters.minSquareFeet || filters.maxSquareFeet) {
      where.squareFeet = {
        ...(filters.minSquareFeet && { gte: filters.minSquareFeet }),
        ...(filters.maxSquareFeet && { lte: filters.maxSquareFeet }),
      };
    }

    if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
    if (filters.state) where.state = { contains: filters.state, mode: "insensitive" };
    if (filters.zipCode) where.zipCode = filters.zipCode;

    if (features) {
      const featureArray = features.split(",");
      where.features = { hasSome: featureArray };
    }

    where.listings = { some: { status: "ACTIVE" } };

    switch (sort) {
      case "price":
        orderBy.price = order;
        break;
      case "createdAt":
        orderBy.createdAt = order;
        break;
      case "squareFeet":
        orderBy.squareFeet = order;
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          listings: { where: { status: "ACTIVE" }, take: 1, select: { id: true, price: true } },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    const results = properties.map((p) => {
      let distance: number | undefined;
      if (validatedParams.latitude && validatedParams.longitude && p.latitude && p.longitude) {
        const R = 3959;
        const dLat = ((p.latitude - validatedParams.latitude) * Math.PI) / 180;
        const dLon = ((p.longitude - validatedParams.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((validatedParams.latitude * Math.PI) / 180) *
            Math.cos((p.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      return {
        ...p,
        distance,
        avgRating:
          p.reviews.length > 0
            ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
            : null,
        reviewCount: p.reviews.length,
        reviews: undefined,
        activePrice: p.listings[0]?.price || p.price,
      };
    });

    if (sort === "distance" && validatedParams.latitude && validatedParams.longitude) {
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    const result = {
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      meta: {
        query,
        filters: Object.entries(filters).filter(([, v]) => v !== undefined).length,
      },
    };

    cache.set(cacheKey, result, 3 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid search parameters", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
