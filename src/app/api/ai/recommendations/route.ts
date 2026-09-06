import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getAIProviderManager } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const recsSchema = z.object({
      limit: z.number().min(1).max(20).default(6),
      style: z.enum(["budget", "luxury", "family", "investment", "commute"]).optional(),
    });

    const validatedData = recsSchema.parse(body);

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          select: {
            propertyType: true,
            price: true,
            bedrooms: true,
            bathrooms: true,
            squareFeet: true,
            city: true,
            state: true,
            features: true,
          },
        },
      },
      take: 20,
    });

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    let preferences: Record<string, unknown> = {};

    if (favorites.length >= 3) {
      const avgPrice = favorites.reduce((sum, f) => sum + f.property.price, 0) / favorites.length;
      const typeCounts = favorites.reduce((acc, f) => {
        acc[f.property.propertyType] = (acc[f.property.propertyType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const avgBedrooms = favorites.reduce((sum, f) => sum + f.property.bedrooms, 0) / favorites.length;
      const avgBathrooms = favorites.reduce((sum, f) => sum + f.property.bathrooms, 0) / favorites.length;
      const avgSqft = favorites.reduce((sum, f) => sum + f.property.squareFeet, 0) / favorites.length;

      const allFeatures = favorites.flatMap((f) => f.property.features);
      const featureCounts = allFeatures.reduce((acc, f) => {
        acc[f] = (acc[f] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topFeatures = Object.entries(featureCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([f]) => f);

      preferences = {
        avgPrice: Math.round(avgPrice),
        priceRange: {
          min: Math.round(avgPrice * 0.7),
          max: Math.round(avgPrice * 1.3),
        },
        dominantType,
        avgBedrooms: Math.round(avgBedrooms),
        avgBathrooms: Math.round(avgBathrooms * 2) / 2,
        avgSquareFeet: Math.round(avgSqft),
        topFeatures,
        cities: [...new Set(favorites.map((f) => f.property.city))],
      };
    }

    let where: Record<string, unknown> = {
      listings: { some: { status: "ACTIVE" } },
      id: { notIn: favorites.map((f) => f.propertyId) },
    };

    if (validatedData.style) {
      switch (validatedData.style) {
        case "budget":
          where.price = { lte: 250000 };
          break;
        case "luxury":
          where.price = { gte: 500000 };
          break;
        case "family":
          where.bedrooms = { gte: 3 };
          where.bathrooms = { gte: 2 };
          break;
        case "investment":
          where.price = { lte: 300000 };
          break;
      }
    } else if (preferences.avgPrice) {
      where.price = {
        gte: (preferences.priceRange as { min: number }).min,
        lte: (preferences.priceRange as { max: number }).max,
      };

      if (preferences.dominantType) {
        where.propertyType = preferences.dominantType;
      }
    }

    const existingRecs = await prisma.property.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        listings: { where: { status: "ACTIVE" }, take: 1, select: { price: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: validatedData.limit * 2,
    });

    let recommendations = existingRecs.map((p) => {
      let score = 0;

      if (preferences.avgPrice) {
        const priceDiff = Math.abs(p.price - (preferences.avgPrice as number)) / (preferences.avgPrice as number);
        score += (1 - Math.min(priceDiff, 1)) * 30;
      }

      if (preferences.dominantType && p.propertyType === preferences.dominantType) {
        score += 20;
      }

      if (preferences.topFeatures) {
        const sharedFeatures = p.features.filter((f) =>
          (preferences.topFeatures as string[]).includes(f)
        );
        score += sharedFeatures.length * 5;
      }

      if (p.reviews.length > 0) {
        const avgRating = p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length;
        score += avgRating * 5;
      }

      return {
        ...p,
        matchScore: Math.min(100, Math.round(score)),
        avgRating:
          p.reviews.length > 0
            ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
            : null,
        reviewCount: p.reviews.length,
        reviews: undefined,
        activePrice: p.listings[0]?.price || p.price,
      };
    });

    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    recommendations = recommendations.slice(0, validatedData.limit);

    return NextResponse.json({
      success: true,
      data: recommendations,
      preferences,
      meta: {
        basedOnFavorites: favorites.length,
        basedOnSearches: savedSearches.length,
        totalCandidates: existingRecs.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
