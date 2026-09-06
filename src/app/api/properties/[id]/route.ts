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
    const cacheKey = `property:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        virtualTour: true,
        listings: {
          where: { status: "ACTIVE" },
          include: { agent: { include: { user: { select: { name: true, email: true, avatar: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        neighborhoods: true,
        aiValuation: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const avgRating =
      property.reviews.length > 0
        ? property.reviews.reduce((sum, r) => sum + r.rating, 0) / property.reviews.length
        : null;

    const result = {
      success: true,
      data: {
        ...property,
        avgRating,
        reviewCount: property.reviews.length,
      },
    };

    cache.set(cacheKey, result, 10 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Property fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch property" },
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
    const existingProperty = await prisma.property.findUnique({ where: { id } });

    if (!existingProperty) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(10).max(5000).optional(),
      price: z.number().positive().optional(),
      propertyType: z.enum(["HOUSE", "CONDO", "TOWNHOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"]).optional(),
      bedrooms: z.number().min(0).max(50).optional(),
      bathrooms: z.number().min(0).max(50).optional(),
      squareFeet: z.number().positive().optional(),
      lotSize: z.number().positive().optional(),
      yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 5).optional(),
      address: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      zipCode: z.string().min(1).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      features: z.array(z.string()).optional(),
    });

    const validatedData = updateSchema.parse(body);

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...validatedData,
        propertyType: validatedData.propertyType as never,
        features: validatedData.features as never[],
      },
      include: { images: true },
    });

    cache.delete(`property:${id}`);
    cache.invalidatePattern("properties:*");

    return NextResponse.json({
      success: true,
      data: property,
      message: "Property updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Property update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update property" },
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
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    await prisma.property.delete({ where: { id } });

    cache.delete(`property:${id}`);
    cache.invalidatePattern("properties:*");

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Property deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
