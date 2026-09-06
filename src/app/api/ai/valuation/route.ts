import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getAIProviderManager } from "@/lib/ai/provider";
import { cache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const valuationSchema = z.object({
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zipCode: z.string().min(1),
      propertyType: z.string().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      squareFeet: z.number().optional(),
      yearBuilt: z.number().optional(),
      propertyId: z.string().optional(),
    });

    const validatedData = valuationSchema.parse(body);

    if (validatedData.propertyId) {
      const cachedValuation = await prisma.aIValuation.findUnique({
        where: { propertyId: validatedData.propertyId },
      });

      if (cachedValuation) {
        const hoursSinceCreated = (Date.now() - cachedValuation.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreated < 24) {
          return NextResponse.json({
            success: true,
            data: cachedValuation,
            source: "cache",
          });
        }
      }
    }

    const comparableProperties = await prisma.property.findMany({
      where: {
        city: validatedData.city,
        state: validatedData.state,
        ...(validatedData.propertyType && { propertyType: validatedData.propertyType as never }),
        ...(validatedData.bedrooms && {
          bedrooms: { gte: validatedData.bedrooms - 1, lte: validatedData.bedrooms + 1 },
        }),
        ...(validatedData.squareFeet && {
          squareFeet: {
            gte: validatedData.squareFeet * 0.7,
            lte: validatedData.squareFeet * 1.3,
          },
        }),
      },
      include: {
        listings: {
          where: { status: "SOLD" },
          select: { price: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        reviews: { select: { rating: true } },
      },
      take: 20,
    });

    const comparablePrices = comparableProperties
      .flatMap((p) => p.listings.map((l) => l.price))
      .filter((price) => price > 0);

    let aiValuation: {
      estimate: number;
      lowRange: number;
      highRange: number;
      confidence: number;
      factors: Record<string, unknown>;
    };

    if (comparablePrices.length >= 3) {
      const avgPrice = comparablePrices.reduce((sum, p) => sum + p, 0) / comparablePrices.length;
      const minPrice = Math.min(...comparablePrices);
      const maxPrice = Math.max(...comparablePrices);
      const stdDev = Math.sqrt(
        comparablePrices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / comparablePrices.length
      );

      aiValuation = {
        estimate: Math.round(avgPrice),
        lowRange: Math.round(avgPrice - stdDev),
        highRange: Math.round(avgPrice + stdDev),
        confidence: Math.min(0.95, 0.5 + comparablePrices.length * 0.05),
        factors: {
          comparableCount: comparablePrices.length,
          avgPrice: Math.round(avgPrice),
          priceRange: { min: minPrice, max: maxPrice },
          stdDeviation: Math.round(stdDev),
          source: "comparable_analysis",
        },
      };
    } else {
      try {
        const manager = getAIProviderManager();
        const provider = manager.getPrimaryProvider();

        if (provider) {
          const prompt = `You are a real estate valuation expert. Analyze the following property and provide a market valuation.

Property Details:
- Address: ${validatedData.address}, ${validatedData.city}, ${validatedData.state} ${validatedData.zipCode}
- Type: ${validatedData.propertyType || "Residential"}
- Bedrooms: ${validatedData.bedrooms || "N/A"}
- Bathrooms: ${validatedData.bathrooms || "N/A"}
- Square Feet: ${validatedData.squareFeet || "N/A"}
- Year Built: ${validatedData.yearBuilt || "N/A"}

Provide a JSON response with:
{
  "estimate": number (estimated value in USD),
  "lowRange": number (conservative estimate),
  "highRange": number (optimistic estimate),
  "confidence": number (0-1),
  "factors": { "key": "value" } (valuation factors)
}`;

          const response = await provider.complete({
            messages: [{ role: "user", content: prompt }],
            responseFormat: { type: "json_object" },
            temperature: 0.3,
          });

          const parsed = JSON.parse(response.content) as {
            estimate: number;
            lowRange: number;
            highRange: number;
            confidence: number;
            factors: Record<string, unknown>;
          };

          aiValuation = {
            estimate: parsed.estimate || 350000,
            lowRange: parsed.lowRange || 300000,
            highRange: parsed.highRange || 400000,
            confidence: parsed.confidence || 0.6,
            factors: {
              ...parsed.factors,
              source: "ai_analysis",
              model: response.model,
              latencyMs: response.latencyMs,
            },
          };
        } else {
          aiValuation = {
            estimate: 350000,
            lowRange: 280000,
            highRange: 420000,
            confidence: 0.3,
            factors: { source: "fallback_estimate", reason: "no_ai_provider" },
          };
        }
      } catch {
        aiValuation = {
          estimate: 350000,
          lowRange: 280000,
          highRange: 420000,
          confidence: 0.3,
          factors: { source: "fallback_estimate", reason: "ai_error" },
        };
      }
    }

    if (validatedData.propertyId) {
      await prisma.aIValuation.upsert({
        where: { propertyId: validatedData.propertyId },
        create: {
          propertyId: validatedData.propertyId,
          estimate: aiValuation.estimate,
          lowRange: aiValuation.lowRange,
          highRange: aiValuation.highRange,
          confidence: aiValuation.confidence,
          factors: aiValuation.factors,
        },
        update: {
          estimate: aiValuation.estimate,
          lowRange: aiValuation.lowRange,
          highRange: aiValuation.highRange,
          confidence: aiValuation.confidence,
          factors: aiValuation.factors,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: aiValuation,
      comparableCount: comparablePrices.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Valuation error:", error);
    return NextResponse.json(
      { success: false, error: "Valuation failed" },
      { status: 500 }
    );
  }
}
