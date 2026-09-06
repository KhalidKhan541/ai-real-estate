import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProviderManager } from "@/lib/ai/provider";
import { cache } from "@/lib/cache";

const descriptionSchema = z.object({
  propertyId: z.string().optional(),
  title: z.string().optional(),
  propertyType: z.string().min(1),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  squareFeet: z.number().positive(),
  yearBuilt: z.number().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  features: z.array(z.string()).default([]),
  style: z.enum(["professional", "casual", "luxury", "investor"]).default("professional"),
  maxLength: z.number().min(100).max(5000).default(1000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = descriptionSchema.parse(body);

    if (validatedData.propertyId) {
      const cacheKey = `ai-desc:${validatedData.propertyId}:${validatedData.style}`;
      const cached = cache.get(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    let description: string;
    let metadata: Record<string, unknown> = {};

    try {
      const manager = getAIProviderManager();
      const provider = manager.getPrimaryProvider();

      if (provider) {
        const styleInstructions: Record<string, string> = {
          professional: "Write in a professional, informative tone suitable for MLS listings. Focus on facts and key selling points.",
          casual: "Write in a friendly, approachable tone. Make potential buyers feel welcome and excited about the property.",
          luxury: "Write in an elegant, sophisticated tone emphasizing exclusivity, premium features, and lifestyle. Use evocative language.",
          investor: "Write in a data-driven tone emphasizing ROI potential, rental income estimates, appreciation trends, and investment value.",
        };

        const prompt = `Generate a compelling real estate listing description.

Property Details:
- Type: ${validatedData.propertyType}
- Bedrooms: ${validatedData.bedrooms}
- Bathrooms: ${validatedData.bathrooms}
- Square Feet: ${validatedData.squareFeet}
- Year Built: ${validatedData.yearBuilt || "N/A"}
- Location: ${validatedData.address}, ${validatedData.city}, ${validatedData.state}
- Features: ${validatedData.features.join(", ")}

Style: ${styleInstructions[validatedData.style]}

Requirements:
- Maximum ${validatedData.maxLength} characters
- Include a catchy opening line
- Highlight 3-5 key features
- End with a call to action
- No clichés or overused phrases
- Be specific and vivid

Provide the description only, no labels or formatting.`;

        const response = await provider.complete({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          maxTokens: Math.min(validatedData.maxLength / 3, 1000),
        });

        description = response.content.trim();
        metadata = {
          model: response.model,
          provider: response.provider,
          usage: response.usage,
          latencyMs: response.latencyMs,
          style: validatedData.style,
        };
      } else {
        description = generateFallbackDescription(validatedData);
        metadata = { source: "fallback", style: validatedData.style };
      }
    } catch {
      description = generateFallbackDescription(validatedData);
      metadata = { source: "fallback", reason: "ai_error", style: validatedData.style };
    }

    const wordCount = description.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const result = {
      success: true,
      data: {
        description,
        wordCount,
        readingTimeSeconds: readingTime * 60,
        charCount: description.length,
        withinLimit: description.length <= validatedData.maxLength,
        style: validatedData.style,
      },
      metadata,
    };

    if (validatedData.propertyId) {
      const cacheKey = `ai-desc:${validatedData.propertyId}:${validatedData.style}`;
      cache.set(cacheKey, result, 60 * 60 * 1000);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Description generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate description" },
      { status: 500 }
    );
  }
}

function generateFallbackDescription(data: z.infer<typeof descriptionSchema>): string {
  const features = data.features.length > 0 ? data.features.slice(0, 3).join(", ") : "quality finishes";
  const yearText = data.yearBuilt ? ` Built in ${data.yearBuilt},` : "";

  return `Welcome to this charming ${data.propertyType.toLowerCase()} in ${data.city}, ${data.state}. Featuring ${data.bedrooms} bedrooms and ${data.bathrooms} bathrooms across ${data.squareFeet.toLocaleString()} square feet of thoughtfully designed living space.${yearText} This property offers ${features} and is perfectly situated in a desirable neighborhood. Don't miss the opportunity to make this your new home. Contact us today to schedule a showing.`;
}
