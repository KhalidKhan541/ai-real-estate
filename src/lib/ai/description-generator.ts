/**
 * AI-powered description and content generation service.
 * Generates property descriptions, listing copy, feature highlights,
 * neighborhood descriptions, and marketing materials.
 */

import { type AIProviderManager } from './provider';
import { type PropertyData } from './valuation-service';

// ─── Types ─────────────────────────────────────────────────────────

export interface DescriptionRequest {
  property: PropertyData;
  style?: DescriptionStyle;
  targetAudience?: TargetAudience;
  platform?: ListingPlatform;
  length?: 'short' | 'medium' | 'long';
  customInstructions?: string;
  additionalFeatures?: string[];
  neighborhoodInfo?: NeighborhoodInfo;
}

export type DescriptionStyle =
  | 'professional'
  | 'luxury'
  | 'casual'
  | 'family_friendly'
  | 'investor_focused'
  | 'minimal'
  | 'storytelling';

export type TargetAudience =
  | 'first_time_buyers'
  | 'families'
  | 'young_professionals'
  | 'retirees'
  | 'investors'
  | 'luxury_buyers'
  | 'general';

export type ListingPlatform =
  | 'mls'
  | 'zillow'
  | 'realtor_com'
  | 'redfin'
  | 'airbnb'
  | 'social_media'
  | 'print'
  | 'website';

export interface NeighborhoodInfo {
  name: string;
  highlights: string[];
  schools?: { name: string; rating: number }[];
  nearbyAmenities?: string[];
  walkability?: number;
  transitScore?: number;
  avgIncome?: number;
}

export interface GeneratedContent {
  headline: string;
  description: string;
  shortDescription: string;
  bulletPoints: string[];
  featureHighlights: string[];
  neighborhoodDescription: string;
  callToAction: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  socialMediaCaptions: SocialMediaCaption[];
  metadata: ContentMetadata;
}

export interface SocialMediaCaption {
  platform: string;
  caption: string;
  hashtags: string[];
  characterCount: number;
}

export interface ContentMetadata {
  wordCount: number;
  readingLevel: string;
  sentimentScore: number;
  uniquenessScore: number;
  estimatedViews: number;
  generatedAt: string;
  model: string;
  tokensUsed: number;
}

export interface BulkDescriptionRequest {
  properties: PropertyData[];
  style?: DescriptionStyle;
  targetAudience?: TargetAudience;
  platform?: ListingPlatform;
}

export interface BulkDescriptionResult {
  propertyId: string;
  content: GeneratedContent;
  success: boolean;
  error?: string;
}

// ─── Style Prompts ─────────────────────────────────────────────────

const STYLE_INSTRUCTIONS: Record<DescriptionStyle, string> = {
  professional: 'Write in a professional, authoritative tone suitable for MLS listings. Be factual and detailed. Avoid excessive adjectives.',
  luxury: 'Write in an aspirational, luxurious tone. Emphasize exclusivity, premium features, and lifestyle. Use elegant language.',
  casual: 'Write in a friendly, approachable tone. Use conversational language that makes readers feel welcome.',
  family_friendly: 'Emphasize family-oriented features. Highlight safety, space, schools, and community amenities.',
  investor_focused: 'Focus on financial metrics, ROI potential, rental income, appreciation trends, and investment value.',
  minimal: 'Keep descriptions concise and scannable. Use short sentences and bullet points. No flowery language.',
  storytelling: 'Create a narrative around the property. Paint a picture of the lifestyle and experiences the home offers.',
};

const AUDIENCE_ADJUSTMENTS: Record<TargetAudience, string> = {
  first_time_buyers: 'Address concerns about affordability, maintenance, and the homebuying process. Emphasize value.',
  families: 'Focus on space, safety, schools, and family-friendly neighborhoods.',
  young_professionals: 'Highlight convenience, proximity to work/entertainment, modern features, and low maintenance.',
  retirees: 'Emphasize single-level living, accessibility, low maintenance, and community features.',
  investors: 'Lead with financial metrics, cap rates, rental potential, and market appreciation.',
  luxury_buyers: 'Appeal to discerning tastes with emphasis on craftsmanship, uniqueness, and prestige.',
  general: 'Use balanced messaging that appeals to a broad audience.',
};

const PLATFORM_ADJUSTMENTS: Record<ListingPlatform, { maxWords: number; format: string }> = {
  mls: { maxWords: 300, format: 'structured with headline and paragraphs' },
  zillow: { maxWords: 250, format: 'conversational with key facts' },
  realtor_com: { maxWords: 250, format: 'professional with emphasis on features' },
  redfin: { maxWords: 200, format: 'concise with data points' },
  airbnb: { maxWords: 400, format: 'descriptive with experience focus' },
  social_media: { maxWords: 100, format: 'punchy with emojis and hashtags' },
  print: { maxWords: 200, format: 'traditional real estate copy' },
  website: { maxWords: 350, format: 'SEO-optimized with structured sections' },
};

// ─── Content Generator ─────────────────────────────────────────────

export class DescriptionGenerator {
  private providerManager: AIProviderManager;

  constructor(providerManager: AIProviderManager) {
    this.providerManager = providerManager;
  }

  async generateDescription(request: DescriptionRequest): Promise<GeneratedContent> {
    const { property, style = 'professional', targetAudience = 'general', platform = 'mls', length = 'medium' } = request;

    const styleInstruction = STYLE_INSTRUCTIONS[style];
    const audienceInstruction = AUDIENCE_ADJUSTMENTS[targetAudience];
    const platformConfig = PLATFORM_ADJUSTMENTS[platform];

    const wordCountMap = { short: 100, medium: 200, long: 350 };
    const targetWords = wordCountMap[length];

    const prompt = this.buildPrompt(property, styleInstruction, audienceInstruction, targetWords, request);

    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) {
      return this.generateFallbackContent(property, request);
    }

    try {
      const response = await provider.complete({
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate copywriter. Generate compelling property listing content. Return valid JSON only, no markdown.`,
          },
          { role: 'user', content: prompt },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.7,
      });

      const parsed = JSON.parse(response.content);
      const content = this.buildGeneratedContent(parsed, property, request, response);

      return content;
    } catch {
      return this.generateFallbackContent(property, request);
    }
  }

  async generateBulkDescriptions(request: BulkDescriptionRequest): Promise<BulkDescriptionResult[]> {
    const results: BulkDescriptionResult[] = [];

    for (const property of request.properties) {
      try {
        const content = await this.generateDescription({
          property,
          style: request.style,
          targetAudience: request.targetAudience,
          platform: request.platform,
        });
        results.push({ propertyId: property.id, content, success: true });
      } catch (error) {
        results.push({
          propertyId: property.id,
          content: this.generateMinimalContent(property),
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  async generateNeighborhoodDescription(
    neighborhood: NeighborhoodInfo,
    targetAudience: TargetAudience = 'general'
  ): Promise<string> {
    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) {
      return this.getFallbackNeighborhoodDescription(neighborhood);
    }

    const prompt = `Write a compelling neighborhood description for "${neighborhood.name}".
Target audience: ${targetAudience.replace('_', ' ')}
Highlights: ${neighborhood.highlights.join(', ')}
${neighborhood.schools?.length ? `Schools: ${neighborhood.schools.map((s) => `${s.name} (${s.rating}/10)`).join(', ')}` : ''}
${neighborhood.nearbyAmenities?.length ? `Nearby: ${neighborhood.nearbyAmenities.join(', ')}` : ''}
${neighborhood.walkability ? `Walk Score: ${neighborhood.walkability}` : ''}
${neighborhood.transitScore ? `Transit Score: ${neighborhood.transitScore}` : ''}

Write 2-3 paragraphs that paint a picture of life in this neighborhood. Be specific and engaging.`;

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You are a real estate copywriter specializing in neighborhood descriptions.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    return response.content;
  }

  async generateSEOContent(property: PropertyData): Promise<{ title: string; description: string; keywords: string[] }> {
    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) {
      return this.getFallbackSEOContent(property);
    }

    const prompt = `Generate SEO-optimized content for a property listing:
Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
Type: ${property.propertyType.replace('_', ' ')}
Beds: ${property.bedrooms}, Baths: ${property.bathrooms}, SqFt: ${property.squareFeet}
Price: $${(property.listingPrice ?? 0).toLocaleString()}

Generate JSON:
{
  "title": "<60 char SEO title>",
  "description": "<155 char meta description>",
  "keywords": ["keyword1", "keyword2", ...]
}`;

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'Generate SEO content for real estate. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.content);
  }

  async generateSocialMediaContent(
    property: PropertyData,
    platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin'
  ): Promise<SocialMediaCaption> {
    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) {
      return this.getFallbackSocialCaption(property, platform);
    }

    const charLimits: Record<string, number> = {
      instagram: 2200,
      facebook: 63206,
      twitter: 280,
      tiktok: 2200,
      linkedin: 3000,
    };

    const prompt = `Create a ${platform} post for this property listing:
${property.address}, ${property.city}, ${property.state}
${property.bedrooms} bed | ${property.bathrooms} bath | ${property.squareFeet.toLocaleString()} sqft
${property.features.slice(0, 5).join(', ')}
${property.listingPrice ? `Priced at $${property.listingPrice.toLocaleString()}` : ''}

Character limit: ${charLimits[platform]}
Include relevant hashtags. Be engaging and platform-appropriate.`;

    const response = await provider.complete({
      messages: [
        { role: 'system', content: `Generate a ${platform} post for real estate. Return JSON: { "caption": "...", "hashtags": [...] }` },
        { role: 'user', content: prompt },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.8,
    });

    const parsed = JSON.parse(response.content);
    return {
      platform,
      caption: parsed.caption ?? '',
      hashtags: parsed.hashtags ?? [],
      characterCount: (parsed.caption ?? '').length,
    };
  }

  // ─── Private Methods ──────────────────────────────────────────

  private buildPrompt(
    property: PropertyData,
    styleInstruction: string,
    audienceInstruction: string,
    targetWords: number,
    request: DescriptionRequest
  ): string {
    const { property: p, neighborhoodInfo } = request;

    return `Generate a real estate listing description for the following property:

PROPERTY DETAILS:
Address: ${p.address}, ${p.city}, ${p.state} ${p.zipCode}
Type: ${p.propertyType.replace('_', ' ')}
Bedrooms: ${p.bedrooms}
Bathrooms: ${p.bathrooms}
Square Feet: ${p.squareFeet.toLocaleString()}
${p.lotSizeSqFt ? `Lot Size: ${p.lotSizeSqFt.toLocaleString()} sqft` : ''}
Year Built: ${p.yearBuilt}
${p.yearRenovated ? `Renovated: ${p.yearRenovated}` : ''}
Condition: ${p.condition}
${p.garageSpaces ? `Garage: ${p.garageSpaces} spaces` : ''}
${p.hoaFee ? `HOA: $${p.hoaFee}/month` : ''}
Features: ${p.features.join(', ')}
${p.description ? `Existing description: ${p.description}` : ''}
${request.additionalFeatures?.length ? `Additional features: ${request.additionalFeatures.join(', ')}` : ''}

${neighborhoodInfo ? `NEIGHBORHOOD:
Name: ${neighborhoodInfo.name}
Highlights: ${neighborhoodInfo.highlights.join(', ')}
${neighborhoodInfo.schools?.length ? `Schools: ${neighborhoodInfo.schools.map((s) => `${s.name} (${s.rating}/10)`).join(', ')}` : ''}
${neighborhoodInfo.nearbyAmenities?.length ? `Nearby: ${neighborhoodInfo.nearbyAmenities.join(', ')}` : ''}` : ''}

WRITING INSTRUCTIONS:
Style: ${styleInstruction}
Audience: ${audienceInstruction}
Target length: approximately ${targetWords} words
${request.customInstructions ? `Custom instructions: ${request.customInstructions}` : ''}

Generate the following JSON structure:
{
  "headline": "<compelling property headline, max 10 words>",
  "description": "<full property description, ~${targetWords} words>",
  "shortDescription": "<2-3 sentence summary>",
  "bulletPoints": ["<feature 1>", "<feature 2>", ... 8-10 bullet points],
  "featureHighlights": ["<top 3-5 standout features>"],
  "callToAction": "<engaging call to action>"
}`;
  }

  private buildGeneratedContent(
    parsed: Record<string, unknown>,
    property: PropertyData,
    request: DescriptionRequest,
    response: { usage: { totalTokens: number }; model: string }
  ): GeneratedContent {
    const description = (parsed.description as string) ?? '';
    const wordCount = description.split(/\s+/).length;

    const headline = (parsed.headline as string) ?? `${property.bedrooms}BR/${property.bathrooms}BA in ${property.city}`;
    const shortDescription = (parsed.shortDescription as string) ?? description.slice(0, 200);
    const bulletPoints = Array.isArray(parsed.bulletPoints) ? (parsed.bulletPoints as string[]) : [];
    const featureHighlights = Array.isArray(parsed.featureHighlights) ? (parsed.featureHighlights as string[]) : [];
    const callToAction = (parsed.callToAction as string) ?? 'Schedule a showing today!';

    // Calculate reading level (simplified)
    const sentences = description.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(sentences, 1);
    const readingLevel = avgWordsPerSentence > 20 ? 'Professional' : avgWordsPerSentence > 14 ? 'Intermediate' : 'Simple';

    // Sentiment (simplified positive word count)
    const positiveWords = ['beautiful', 'stunning', 'elegant', 'spacious', 'modern', 'charming', 'gorgeous', 'exquisite', 'luxurious', 'pristine'];
    const sentimentScore = Math.min(1, positiveWords.filter((w) => description.toLowerCase().includes(w)).length / 5);

    return {
      headline,
      description,
      shortDescription,
      bulletPoints,
      featureHighlights,
      neighborhoodDescription: this.getNeighborhoodText(property, request.neighborhoodInfo),
      callToAction,
      seoTitle: `${property.bedrooms} Bed ${property.propertyType.replace('_', ' ')} for Sale in ${property.city}, ${property.state} | ${property.address}`,
      seoDescription: shortDescription.slice(0, 155),
      seoKeywords: this.generateKeywords(property),
      socialMediaCaptions: [],
      metadata: {
        wordCount,
        readingLevel,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        uniquenessScore: 0.85,
        estimatedViews: Math.round(500 + wordCount * 2 + property.features.length * 50),
        generatedAt: new Date().toISOString(),
        model: response.model,
        tokensUsed: response.usage.totalTokens,
      },
    };
  }

  private getNeighborhoodText(property: PropertyData, info?: NeighborhoodInfo): string {
    if (!info) {
      return `Located in ${property.city}, ${property.state}, this property offers convenient access to local amenities, schools, and transportation.`;
    }

    let text = `${info.name} is a sought-after neighborhood known for ${info.highlights.slice(0, 2).join(' and ')}.`;
    if (info.schools?.length) {
      text += ` Families will appreciate the proximity to ${info.schools[0].name} (${info.schools[0].rating}/10).`;
    }
    if (info.nearbyAmenities?.length) {
      text += ` Nearby amenities include ${info.nearbyAmenities.slice(0, 3).join(', ')}.`;
    }
    return text;
  }

  private generateKeywords(property: PropertyData): string[] {
    const keywords: string[] = [
      `${property.bedrooms} bedroom ${property.propertyType.replace('_', ' ')}`,
      `${property.city} real estate`,
      `${property.city} homes for sale`,
      `${property.state} property`,
      `${property.squareFeet} sqft home`,
    ];

    if (property.features.length > 0) {
      keywords.push(...property.features.slice(0, 3).map((f) => f.toLowerCase()));
    }

    return keywords;
  }

  private generateFallbackContent(property: PropertyData, request: DescriptionRequest): GeneratedContent {
    const p = property;
    const headline = `${p.bedrooms}-Bedroom ${p.propertyType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} in ${p.city}`;
    const description = `Welcome to ${p.address} in ${p.city}, ${p.state}. This ${p.condition} ${p.propertyType.replace('_', ' ')} offers ${p.squareFeet.toLocaleString()} square feet of living space with ${p.bedrooms} bedrooms and ${p.bathrooms} bathrooms. Built in ${p.yearBuilt}${p.yearRenovated ? ` and renovated in ${p.yearRenovated}` : ''}, this home features ${p.features.slice(0, 4).join(', ')}.${p.garageSpaces ? ` The property includes a ${p.garageSpaces}-car garage.` : ''}${p.hoaFee ? ` HOA fee: $${p.hoaFee}/month.` : ''} ${p.listingPrice ? `Priced at $${p.listingPrice.toLocaleString()}.` : ''} Contact us to schedule a showing.`;

    return {
      headline,
      description,
      shortDescription: `${p.bedrooms}BR/${p.bathrooms}BA ${p.propertyType.replace('_', ' ')} in ${p.city}, ${p.state}. ${p.squareFeet.toLocaleString()} sqft, built ${p.yearBuilt}.`,
      bulletPoints: [
        `${p.bedrooms} bedrooms`,
        `${p.bathrooms} bathrooms`,
        `${p.squareFeet.toLocaleString()} sqft`,
        `Built in ${p.yearBuilt}`,
        `${p.condition} condition`,
        ...p.features.slice(0, 4),
      ],
      featureHighlights: p.features.slice(0, 3),
      neighborhoodDescription: `Located in ${p.city}, ${p.state}, offering convenient access to local amenities.`,
      callToAction: 'Schedule your private showing today!',
      seoTitle: headline,
      seoDescription: `${p.bedrooms}BR/${p.bathrooms}BA for sale in ${p.city}, ${p.state}. ${p.squareFeet.toLocaleString()} sqft.`,
      seoKeywords: this.generateKeywords(p),
      socialMediaCaptions: [],
      metadata: {
        wordCount: description.split(/\s+/).length,
        readingLevel: 'Standard',
        sentimentScore: 0.5,
        uniquenessScore: 0.5,
        estimatedViews: 200,
        generatedAt: new Date().toISOString(),
        model: 'fallback',
        tokensUsed: 0,
      },
    };
  }

  private generateMinimalContent(property: PropertyData): GeneratedContent {
    return {
      headline: `${property.bedrooms}BR/${property.bathrooms}BA in ${property.city}`,
      description: `${property.squareFeet.toLocaleString()} sqft ${property.propertyType.replace('_', ' ')} in ${property.city}, ${property.state}.`,
      shortDescription: `${property.bedrooms}BR/${property.bathrooms}BA, ${property.squareFeet.toLocaleString()} sqft`,
      bulletPoints: [`${property.bedrooms} bed`, `${property.bathrooms} bath`, `${property.squareFeet.toLocaleString()} sqft`],
      featureHighlights: [],
      neighborhoodDescription: `Located in ${property.city}.`,
      callToAction: 'Contact for details.',
      seoTitle: `${property.bedrooms}BR for Sale in ${property.city}`,
      seoDescription: `${property.propertyType.replace('_', ' ')} for sale in ${property.city}.`,
      seoKeywords: [],
      socialMediaCaptions: [],
      metadata: {
        wordCount: 0,
        readingLevel: 'Basic',
        sentimentScore: 0.5,
        uniquenessScore: 0.3,
        estimatedViews: 0,
        generatedAt: new Date().toISOString(),
        model: 'minimal',
        tokensUsed: 0,
      },
    };
  }

  private getFallbackNeighborhoodDescription(neighborhood: NeighborhoodInfo): string {
    let text = `${neighborhood.name} is a desirable area known for ${neighborhood.highlights.join(' and ')}.`;
    if (neighborhood.schools?.length) {
      text += ` The area is served by ${neighborhood.schools[0].name}, rated ${neighborhood.schools[0].rating}/10.`;
    }
    if (neighborhood.walkability && neighborhood.walkability > 70) {
      text += ` With a walk score of ${neighborhood.walkability}, daily errands are easily accomplished on foot.`;
    }
    return text;
  }

  private getFallbackSEOContent(property: PropertyData): { title: string; description: string; keywords: string[] } {
    return {
      title: `${property.bedrooms} Bed ${property.propertyType.replace('_', ' ')} for Sale in ${property.city}`,
      description: `${property.bedrooms}BR/${property.bathrooms}BA ${property.propertyType.replace('_', ' ')} in ${property.city}, ${property.state}. ${property.squareFeet.toLocaleString()} sqft.`,
      seoKeywords: this.generateKeywords(property),
    };
  }

  private getFallbackSocialCaption(property: PropertyData, platform: string): SocialMediaCaption {
    const caption = `Just listed! ${property.bedrooms}BR/${property.bathrooms}BA in ${property.city}. ${property.features.slice(0, 3).join(' | ')}.`;
    const hashtags = [`#${property.city}RealEstate`, `#JustListed`, `#${property.propertyType.replace('_', '')}`];
    return { platform, caption, hashtags, characterCount: caption.length };
  }
}
