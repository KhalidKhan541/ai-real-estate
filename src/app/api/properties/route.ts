import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { cache } from "@/lib/cache";

const propertyFilterSchema = z.object({
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
  sort: z.enum(["price", "createdAt", "squareFeet", "yearBuilt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = propertyFilterSchema.parse(params);

    const cacheKey = `properties:list:${JSON.stringify(validatedParams)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { sort, order, page, limit, features, ...filters } = validatedParams;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

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

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          listings: { where: { status: "ACTIVE" }, take: 1 },
          reviews: { select: { rating: true } },
        },
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    const propertiesWithAvg = properties.map((p) => ({
      ...p,
      avgRating:
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : null,
      reviewCount: p.reviews.length,
      reviews: undefined,
    }));

    const result = {
      success: true,
      data: propertiesWithAvg,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    cache.set(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Properties fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch properties" },
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
      title: z.string().min(1).max(200),
      description: z.string().min(10).max(5000),
      price: z.number().positive(),
      propertyType: z.enum(["HOUSE", "CONDO", "TOWNHOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"]),
      bedrooms: z.number().min(0).max(50),
      bathrooms: z.number().min(0).max(50),
      squareFeet: z.number().positive(),
      lotSize: z.number().positive().optional(),
      yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 5).optional(),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zipCode: z.string().min(1),
      country: z.string().default("US"),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      features: z.array(z.string()).default([]),
      images: z.array(z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        isPrimary: z.boolean().default(false),
      })).default([]),
    });

    const validatedData = createSchema.parse(body);

    const property = await prisma.property.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        propertyType: validatedData.propertyType as never,
        bedrooms: validatedData.bedrooms,
        bathrooms: validatedData.bathrooms,
        squareFeet: validatedData.squareFeet,
        lotSize: validatedData.lotSize,
        yearBuilt: validatedData.yearBuilt,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zipCode: validatedData.zipCode,
        country: validatedData.country,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        features: validatedData.features as never[],
        images: {
          create: validatedData.images.map((img, index) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary || index === 0,
            order: index,
          })),
        },
      },
      include: { images: true },
    });

    cache.invalidatePattern("properties:*");

    return NextResponse.json(
      { success: true, data: property, message: "Property created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Property creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create property" },
      { status: 500 }
    );
  }
}
