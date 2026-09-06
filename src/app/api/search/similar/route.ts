import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { cache } from "@/lib/cache";

const similarSchema = z.object({
  propertyId: z.string(),
  limit: z.coerce.number().min(1).max(20).default(6),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = similarSchema.parse(params);

    const cacheKey = `similar:${validatedParams.propertyId}:${validatedParams.limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const property = await prisma.property.findUnique({
      where: { id: validatedParams.propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const similarProperties = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        OR: [
          { propertyType: property.propertyType },
          { city: property.city },
          {
            price: {
              gte: property.price * 0.7,
              lte: property.price * 1.3,
            },
          },
          {
            bedrooms: {
              gte: property.bedrooms - 1,
              lte: property.bedrooms + 1,
            },
          },
        ],
        listings: { some: { status: "ACTIVE" } },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        listings: { where: { status: "ACTIVE" }, take: 1, select: { price: true } },
        reviews: { select: { rating: true } },
      },
      take: validatedParams.limit,
    });

    const scoredProperties = similarProperties
      .map((p) => {
        let score = 0;
        if (p.propertyType === property.propertyType) score += 3;
        if (p.city === property.city) score += 2;
        if (p.bedrooms === property.bedrooms) score += 1;
        if (p.bathrooms === property.bathrooms) score += 1;

        const priceRatio = p.price / property.price;
        if (priceRatio >= 0.8 && priceRatio <= 1.2) score += 2;

        const sqftDiff = Math.abs(p.squareFeet - property.squareFeet) / property.squareFeet;
        if (sqftDiff < 0.2) score += 1;

        const sharedFeatures = p.features.filter((f) => property.features.includes(f));
        score += sharedFeatures.length * 0.5;

        return {
          ...p,
          similarityScore: score,
          avgRating:
            p.reviews.length > 0
              ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
              : null,
          reviewCount: p.reviews.length,
          reviews: undefined,
          activePrice: p.listings[0]?.price || p.price,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore);

    const result = {
      success: true,
      data: scoredProperties,
      meta: {
        basedOn: property.id,
        propertyType: property.propertyType,
        city: property.city,
        price: property.price,
      },
    };

    cache.set(cacheKey, result, 10 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters" },
        { status: 400 }
      );
    }
    console.error("Similar properties error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to find similar properties" },
      { status: 500 }
    );
  }
}
