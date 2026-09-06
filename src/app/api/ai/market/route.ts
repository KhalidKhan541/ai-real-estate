import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getAIProviderManager } from "@/lib/ai/provider";
import { cache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const marketSchema = z.object({
      city: z.string().min(1),
      state: z.string().min(1),
      propertyType: z.string().optional(),
      timeframe: z.enum(["1month", "3months", "6months", "1year"]).default("3months"),
    });

    const validatedData = marketSchema.parse(body);

    const cacheKey = `market:${validatedData.city}:${validatedData.state}:${validatedData.propertyType}:${validatedData.timeframe}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const listings = await prisma.listing.findMany({
      where: {
        createdAt: { gte: threeMonthsAgo },
        property: {
          city: validatedData.city,
          state: validatedData.state,
          ...(validatedData.propertyType && { propertyType: validatedData.propertyType as never }),
        },
      },
      select: {
        price: true,
        status: true,
        createdAt: true,
        property: { select: { squareFeet: true, bedrooms: true, bathrooms: true } },
      },
    });

    const soldListings = listings.filter((l) => l.status === "SOLD");
    const activeListings = listings.filter((l) => l.status === "ACTIVE");

    const prices = listings.map((l) => l.price);
    const soldPrices = soldListings.map((l) => l.price);

    let marketAnalysis: Record<string, unknown>;

    if (prices.length >= 5) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const medianPrice = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)];
      const avgSqft = listings
        .filter((l) => l.property.squareFeet)
        .reduce((sum, l, _, arr) => sum + (l.property.squareFeet || 0) / arr.length, 0);

      const pricePerSqft = avgSqft > 0 ? avgPrice / avgSqft : 0;
      const daysOnMarket = activeListings.length > 0
        ? activeListings.reduce((sum, l) => {
            const days = Math.floor((Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / activeListings.length
        : 0;

      const soldPricesOnly = soldPrices.length > 0 ? soldPrices : prices;
      const avgSoldPrice = soldPricesOnly.reduce((sum, p) => sum + p, 0) / soldPricesOnly.length;

      marketAnalysis = {
        summary: {
          averagePrice: Math.round(avgPrice),
          medianPrice: Math.round(medianPrice),
          pricePerSqft: Math.round(pricePerSqft),
          totalListings: listings.length,
          activeListings: activeListings.length,
          soldListings: soldListings.length,
          avgDaysOnMarket: Math.round(daysOnMarket),
        },
        trends: {
          priceDirection: avgSoldPrice > avgPrice ? "increasing" : avgSoldPrice < avgPrice * 0.95 ? "decreasing" : "stable",
          inventoryLevel: activeListings.length > 50 ? "high" : activeListings.length > 20 ? "moderate" : "low",
          marketType: daysOnMarket < 30 ? "seller" : daysOnMarket > 60 ? "buyer" : "balanced",
        },
        insights: {
          absorptionRate: soldListings.length / 3,
          listToSaleRatio: soldPrices.length > 0 && prices.length > 0
            ? Math.round((avgSoldPrice / avgPrice) * 100) / 100
            : null,
          newListingRate: listings.length / 3,
        },
        period: validatedData.timeframe,
        generatedAt: new Date().toISOString(),
      };
    } else {
      marketAnalysis = {
        summary: {
          averagePrice: 0,
          medianPrice: 0,
          pricePerSqft: 0,
          totalListings: listings.length,
          activeListings: activeListings.length,
          soldListings: soldListings.length,
          avgDaysOnMarket: 0,
        },
        trends: {
          priceDirection: "insufficient_data",
          inventoryLevel: "unknown",
          marketType: "unknown",
        },
        insights: {
          absorptionRate: 0,
          listToSaleRatio: null,
          newListingRate: 0,
        },
        message: "Insufficient data for comprehensive analysis",
        period: validatedData.timeframe,
        generatedAt: new Date().toISOString(),
      };
    }

    try {
      const manager = getAIProviderManager();
      const provider = manager.getPrimaryProvider();

      if (provider) {
        const prompt = `Analyze the real estate market for ${validatedData.city}, ${validatedData.state}.

Data:
- Average Price: $${marketAnalysis.summary.averagePrice}
- Median Price: $${marketAnalysis.summary.medianPrice}
- Active Listings: ${marketAnalysis.summary.activeListings}
- Sold Listings: ${marketAnalysis.summary.soldListings}
- Avg Days on Market: ${marketAnalysis.summary.avgDaysOnMarket}
- Price Trend: ${marketAnalysis.trends.priceDirection}
- Market Type: ${marketAnalysis.trends.marketType}

Provide 3-5 actionable insights in JSON format:
{ "insights": ["insight1", "insight2", ...], "outlook": "bullish|bearish|neutral", "summary": "brief summary" }`;

        const response = await provider.complete({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
          temperature: 0.3,
          maxTokens: 500,
        });

        const aiInsights = JSON.parse(response.content) as {
          insights?: string[];
          outlook?: string;
          summary?: string;
        };

        marketAnalysis.aiInsights = {
          insights: aiInsights.insights || [],
          outlook: aiInsights.outlook || "neutral",
          summary: aiInsights.summary || "",
        };
      }
    } catch {
      // AI insights are optional
    }

    cache.set(cacheKey, marketAnalysis, 30 * 60 * 1000);

    return NextResponse.json({ success: true, data: marketAnalysis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Market analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Market analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const state = searchParams.get("state");

    if (!city || !state) {
      return NextResponse.json(
        { success: false, error: "City and state are required" },
        { status: 400 }
      );
    }

    const cacheKey = `market:trending:${city}:${state}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await prisma.property.findMany({
      where: {
        city,
        state,
        listings: {
          some: {
            status: "ACTIVE",
            views: { gte: 100 },
          },
        },
      },
      include: {
        listings: {
          where: { status: "ACTIVE" },
          select: { views: true, price: true, inquiries: true },
        },
        images: { where: { isPrimary: true }, take: 1 },
        reviews: { select: { rating: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const result = {
      success: true,
      data: trending.map((p) => ({
        ...p,
        totalViews: p.listings.reduce((sum, l) => sum + l.views, 0),
        avgRating:
          p.reviews.length > 0
            ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
            : null,
        reviews: undefined,
        listings: undefined,
      })),
    };

    cache.set(cacheKey, result, 15 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trending properties" },
      { status: 500 }
    );
  }
}
