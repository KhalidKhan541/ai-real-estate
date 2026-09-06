/**
 * AI-powered property valuation service.
 * Performs comparable analysis, market trend evaluation, price prediction,
 * confidence scoring, and generates comprehensive valuation reports.
 */

import { AIProvider, type AIProviderManager, type AICompletionResponse } from './provider';

// ─── Types ─────────────────────────────────────────────────────────

export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSizeSqFt?: number;
  yearBuilt: number;
  yearRenovated?: number;
  garageSpaces?: number;
  stories?: number;
  hoaFee?: number;
  features: string[];
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  listingPrice?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  description?: string;
}

export interface ComparableProperty extends PropertyData {
  distance: number;
  similarityScore: number;
  adjustedPrice: number;
  pricePerSqFt: number;
  daysOnMarket: number;
  status: 'sold' | 'active' | 'pending' | 'expired';
  saleDate?: string;
  salePrice?: number;
  adjustments: Adjustment[];
}

export interface Adjustment {
  feature: string;
  description: string;
  amount: number;
  direction: 'positive' | 'negative';
}

export interface ValuationResult {
  estimatedValue: number;
  valueRange: { low: number; high: number };
  confidence: number;
  confidenceFactors: ConfidenceFactor[];
  comparableAnalysis: ComparableAnalysis;
  marketTrend: MarketTrendAnalysis;
  pricePrediction: PricePrediction;
  adjustments: Adjustment[];
  methodology: string;
  warnings: string[];
  generatedAt: string;
}

export interface ComparableAnalysis {
  comparables: ComparableProperty[];
  averageAdjustedPrice: number;
  medianAdjustedPrice: number;
  priceRange: { min: number; max: number };
  averageDaysOnMarket: number;
  averageSimilarityScore: number;
  weightings: Record<string, number>;
}

export interface MarketTrendAnalysis {
  direction: 'appreciating' | 'depreciating' | 'stable';
  annualAppreciationRate: number;
  monthlyTrend: TrendDataPoint[];
  quarterlyTrend: TrendDataPoint[];
  yearOverYearChange: number;
  marketCondition: 'seller' | 'buyer' | 'balanced';
  inventoryLevel: 'low' | 'normal' | 'high';
  avgDaysOnMarket: number;
  saleToListRatio: number;
}

export interface TrendDataPoint {
  period: string;
  medianPrice: number;
  volume: number;
  avgDaysOnMarket: number;
}

export interface PricePrediction {
  currentEstimate: number;
  sixMonthEstimate: number;
  twelveMonthEstimate: number;
  twentyFourMonthEstimate: number;
  monthlyGrowthRate: number;
  annualGrowthRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  predictionConfidence: number;
  seasonalFactor: number;
}

export interface ConfidenceFactor {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface ValuationRequest {
  property: PropertyData;
  comparables?: ComparableProperty[];
  marketData?: MarketTrendAnalysis;
  options?: {
    depth?: 'quick' | 'standard' | 'comprehensive';
    includePrediction?: boolean;
    adjustmentTolerance?: number;
    maxComparables?: number;
  };
}

export interface ValuationReport {
  summary: string;
  executiveSummary: string;
  propertyOverview: string;
  comparableAnalysisReport: string;
  marketAnalysisReport: string;
  pricePredictionReport: string;
  riskAssessment: string;
  recommendation: string;
  disclaimers: string[];
}

// ─── Confidence Scoring ────────────────────────────────────────────

function calculateConfidenceScore(
  comparables: ComparableProperty[],
  property: PropertyData,
  marketTrend: MarketTrendAnalysis
): { score: number; factors: ConfidenceFactor[] } {
  const factors: ConfidenceFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Factor 1: Number of comparables
  const compCount = comparables.length;
  const compScore = Math.min(compCount / 10, 1) * 100;
  const compWeight = 25;
  factors.push({
    factor: 'Comparable Data Availability',
    impact: compScore,
    direction: compScore >= 70 ? 'positive' : compScore >= 40 ? 'neutral' : 'negative',
    explanation: `Found ${compCount} comparable properties (higher count increases confidence)`,
  });
  totalScore += compScore * compWeight;
  totalWeight += compWeight;

  // Factor 2: Average similarity score
  const avgSimilarity =
    comparables.reduce((sum, c) => sum + c.similarityScore, 0) / Math.max(compCount, 1);
  const similarityScore = avgSimilarity * 100;
  const similarityWeight = 30;
  factors.push({
    factor: 'Property Similarity',
    impact: similarityScore,
    direction: similarityScore >= 75 ? 'positive' : similarityScore >= 50 ? 'neutral' : 'negative',
    explanation: `Average similarity to comparables: ${(avgSimilarity * 100).toFixed(1)}%`,
  });
  totalScore += similarityScore * similarityWeight;
  totalWeight += similarityWeight;

  // Factor 3: Recency of comparables
  const avgDaysSinceSale =
    comparables
      .filter((c) => c.saleDate)
      .reduce((sum, c) => {
        const days = Math.abs(
          (Date.now() - new Date(c.saleDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / Math.max(compCount, 1);

  const recencyScore = Math.max(0, 100 - avgDaysSinceSale / 3.65);
  const recencyWeight = 20;
  factors.push({
    factor: 'Data Recency',
    impact: recencyScore,
    direction: recencyScore >= 70 ? 'positive' : recencyScore >= 40 ? 'neutral' : 'negative',
    explanation: `Average comparable sale age: ${Math.round(avgDaysSinceSale)} days`,
  });
  totalScore += recencyScore * recencyWeight;
  totalWeight += recencyWeight;

  // Factor 4: Price consistency
  const prices = comparables.map((c) => c.adjustedPrice);
  const mean = prices.reduce((a, b) => a + b, 0) / Math.max(prices.length, 1);
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / Math.max(prices.length, 1);
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / Math.max(mean, 1);
  const consistencyScore = Math.max(0, (1 - coefficientOfVariation) * 100);
  const consistencyWeight = 15;
  factors.push({
    factor: 'Price Consistency',
    impact: consistencyScore,
    direction: consistencyScore >= 80 ? 'positive' : consistencyScore >= 50 ? 'neutral' : 'negative',
    explanation: `Coefficient of variation: ${(coefficientOfVariation * 100).toFixed(1)}% (lower = more consistent)`,
  });
  totalScore += consistencyScore * consistencyWeight;
  totalWeight += consistencyWeight;

  // Factor 5: Market stability
  const marketScore =
    marketTrend.marketCondition === 'balanced'
      ? 85
      : marketTrend.inventoryLevel === 'normal'
        ? 70
        : 50;
  const marketWeight = 10;
  factors.push({
    factor: 'Market Stability',
    impact: marketScore,
    direction: marketScore >= 70 ? 'positive' : marketScore >= 50 ? 'neutral' : 'negative',
    explanation: `Market is ${marketTrend.marketCondition} with ${marketTrend.inventoryLevel} inventory`,
  });
  totalScore += marketScore * marketWeight;
  totalWeight += marketWeight;

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  return { score: Math.round(Math.min(100, Math.max(0, finalScore))), factors };
}

// ─── Price Adjustment Calculation ──────────────────────────────────

function calculateAdjustments(
  subject: PropertyData,
  comparable: ComparableProperty
): Adjustment[] {
  const adjustments: Adjustment[] = [];

  // Square footage adjustment
  const sqFtDiff = subject.squareFeet - comparable.squareFeet;
  const pricePerSqFt = comparable.pricePerSqFt;
  if (Math.abs(sqFtDiff) > 50) {
    const amount = sqFtDiff * pricePerSqFt * 0.6;
    adjustments.push({
      feature: 'Square Footage',
      description: `Subject is ${Math.abs(sqFtDiff)} sqft ${sqFtDiff > 0 ? 'larger' : 'smaller'}`,
      amount,
      direction: sqFtDiff > 0 ? 'positive' : 'negative',
    });
  }

  // Bedroom adjustment
  const bedDiff = subject.bedrooms - comparable.bedrooms;
  if (bedDiff !== 0) {
    const bedroomValue = 8000;
    const amount = bedDiff * bedroomValue;
    adjustments.push({
      feature: 'Bedrooms',
      description: `Subject has ${Math.abs(bedDiff)} more ${bedDiff > 0 ? 'bedrooms' : 'fewer bedrooms'}`,
      amount,
      direction: bedDiff > 0 ? 'positive' : 'negative',
    });
  }

  // Bathroom adjustment
  const bathDiff = subject.bathrooms - comparable.bathrooms;
  if (bathDiff !== 0) {
    const bathValue = 6000;
    const amount = bathDiff * bathValue;
    adjustments.push({
      feature: 'Bathrooms',
      description: `Subject has ${Math.abs(bathDiff)} more ${bathDiff > 0 ? 'bathrooms' : 'fewer bathrooms'}`,
      amount,
      direction: bathDiff > 0 ? 'positive' : 'negative',
    });
  }

  // Lot size adjustment
  if (subject.lotSizeSqFt && comparable.lotSizeSqFt) {
    const lotDiff = subject.lotSizeSqFt - comparable.lotSizeSqFt;
    if (Math.abs(lotDiff) > 100) {
      const lotValuePerSqFt = 5;
      const amount = lotDiff * lotValuePerSqFt;
      adjustments.push({
        feature: 'Lot Size',
        description: `Subject lot is ${Math.abs(lotDiff)} sqft ${lotDiff > 0 ? 'larger' : 'smaller'}`,
        amount,
        direction: lotDiff > 0 ? 'positive' : 'negative',
      });
    }
  }

  // Year built adjustment
  const yearDiff = subject.yearBuilt - comparable.yearBuilt;
  if (Math.abs(yearDiff) > 3) {
    const yearValue = 1500;
    const amount = yearDiff * yearValue;
    adjustments.push({
      feature: 'Age',
      description: `Subject is ${Math.abs(yearDiff)} years ${yearDiff > 0 ? 'newer' : 'older'}`,
      amount,
      direction: yearDiff > 0 ? 'positive' : 'negative',
    });
  }

  // Garage adjustment
  if (subject.garageSpaces !== undefined && comparable.garageSpaces !== undefined) {
    const garageDiff = subject.garageSpaces - comparable.garageSpaces;
    if (garageDiff !== 0) {
      const garageValue = 5000;
      const amount = garageDiff * garageValue;
      adjustments.push({
        feature: 'Garage',
        description: `Subject has ${Math.abs(garageDiff)} more ${garageDiff > 0 ? 'garage spaces' : 'fewer garage spaces'}`,
        amount,
        direction: garageDiff > 0 ? 'positive' : 'negative',
      });
    }
  }

  // Condition adjustment
  const conditionOrder: Record<string, number> = { excellent: 4, good: 3, fair: 2, poor: 1 };
  const condDiff = (conditionOrder[subject.condition] ?? 3) - (conditionOrder[comparable.condition] ?? 3);
  if (condDiff !== 0) {
    const condValue = 10000;
    const amount = condDiff * condValue;
    adjustments.push({
      feature: 'Condition',
      description: `Subject condition is ${condDiff > 0 ? 'better' : 'worse'} than comparable`,
      amount,
      direction: condDiff > 0 ? 'positive' : 'negative',
    });
  }

  // HOA adjustment
  if (subject.hoaFee !== undefined && comparable.hoaFee !== undefined) {
    const hoaDiff = subject.hoaFee - comparable.hoaFee;
    if (Math.abs(hoaDiff) > 20) {
      const amount = -hoaDiff * 12 * 10;
      adjustments.push({
        feature: 'HOA Fees',
        description: `Subject HOA is $${Math.abs(hoaDiff)}/mo ${hoaDiff > 0 ? 'higher' : 'lower'}`,
        amount,
        direction: hoaDiff < 0 ? 'positive' : 'negative',
      });
    }
  }

  return adjustments;
}

function applyAdjustments(basePrice: number, adjustments: Adjustment[]): number {
  const totalAdjustment = adjustments.reduce((sum, a) => sum + a.amount, 0);
  return basePrice + totalAdjustment;
}

// ─── AI-Powered Analysis Prompt Builder ────────────────────────────

function buildValuationPrompt(
  property: PropertyData,
  comparables: ComparableProperty[],
  marketTrend: MarketTrendAnalysis
): string {
  return `You are an expert real estate appraiser. Analyze the following property and provide a detailed valuation.

SUBJECT PROPERTY:
Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
Type: ${property.propertyType}
Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
Square Feet: ${property.squareFeet}
Year Built: ${property.yearBuilt}
${property.yearRenovated ? `Renovated: ${property.yearRenovated}` : ''}
${property.lotSizeSqFt ? `Lot Size: ${property.lotSizeSqFt} sqft` : ''}
${property.garageSpaces ? `Garage: ${property.garageSpaces} spaces` : ''}
Condition: ${property.condition}
Features: ${property.features.join(', ')}
${property.hoaFee ? `HOA Fee: $${property.hoaFee}/month` : ''}
${property.listingPrice ? `Current Listing Price: $${property.listingPrice.toLocaleString()}` : ''}
${property.lastSalePrice ? `Last Sale: $${property.lastSalePrice.toLocaleString()} on ${property.lastSaleDate}` : ''}

COMPARABLE PROPERTIES (${comparables.length} found):
${comparables
  .slice(0, 5)
  .map(
    (c, i) => `
${i + 1}. ${c.address}, ${c.city}, ${c.state}
   - Price: $${(c.salePrice || c.adjustedPrice).toLocaleString()}
   - SqFt: ${c.squareFeet} | Beds: ${c.bedrooms} | Baths: ${c.bathrooms}
   - Distance: ${c.distance.toFixed(1)} mi | Similarity: ${(c.similarityScore * 100).toFixed(0)}%
   - ${c.status === 'sold' ? `Sold ${c.saleDate}` : `Listed at $${c.listingPrice?.toLocaleString()}`}
   - Adjusted Price: $${c.adjustedPrice.toLocaleString()}
`
  )
  .join('')}

MARKET CONDITIONS:
- Trend: ${marketTrend.direction} (${marketTrend.annualAppreciationRate.toFixed(1)}% annual)
- Market Type: ${marketTrend.marketCondition}
- Avg Days on Market: ${marketTrend.avgDaysOnMarket}
- Sale-to-List Ratio: ${(marketTrend.saleToListRatio * 100).toFixed(1)}%
- Inventory Level: ${marketTrend.inventoryLevel}

Provide your analysis in the following JSON format:
{
  "estimatedValue": <number>,
  "valueRange": { "low": <number>, "high": <number> },
  "reasoning": "<detailed explanation>",
  "keyFactors": ["<factor1>", "<factor2>", ...],
  "adjustments": [
    { "feature": "<name>", "description": "<desc>", "amount": <number>, "direction": "positive|negative" }
  ],
  "warnings": ["<warning1>", ...],
  "recommendation": "<brief recommendation>"
}`;
}

// ─── Valuation Service ─────────────────────────────────────────────

export class ValuationService {
  private providerManager: AIProviderManager;

  constructor(providerManager: AIProviderManager) {
    this.providerManager = providerManager;
  }

  async generateValuation(request: ValuationRequest): Promise<ValuationResult> {
    const { property, comparables = [], marketData, options = {} } = request;
    const depth = options.depth ?? 'standard';
    const maxComparables = options.maxComparables ?? 10;

    // Sort comparables by similarity and limit
    const sortedComparables = [...comparables]
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, maxComparables);

    // Calculate adjustments for each comparable
    const comparablesWithAdjustments = sortedComparables.map((comp) => ({
      ...comp,
      adjustments: calculateAdjustments(property, comp),
      adjustedPrice: applyAdjustments(
        comp.salePrice ?? comp.listingPrice ?? comp.adjustedPrice,
        calculateAdjustments(property, comp)
      ),
    }));

    // Calculate weighted average from comparables
    const comparableAnalysis = this.analyzeComparables(comparablesWithAdjustments);

    // Use market trend or generate placeholder
    const marketTrend = marketData ?? this.generateDefaultMarketTrend();

    // Calculate confidence
    const { score: confidence, factors: confidenceFactors } = calculateConfidenceScore(
      comparablesWithAdjustments,
      property,
      marketTrend
    );

    // Generate AI-powered analysis for comprehensive depth
    let aiValuation: Partial<ValuationResult> = {};
    if (depth === 'comprehensive' || depth === 'standard') {
      try {
        aiValuation = await this.generateAIValuation(
          property,
          comparablesWithAdjustments,
          marketTrend
        );
      } catch {
        // Fall back to statistical analysis if AI fails
      }
    }

    // Generate price prediction
    const pricePrediction = options.includePrediction !== false
      ? this.generatePricePrediction(
          comparableAnalysis.averageAdjustedPrice,
          marketTrend,
          property
        )
      : this.getDefaultPricePrediction(comparableAnalysis.averageAdjustedPrice);

    // Combine AI and statistical estimates
    const statisticalEstimate = comparableAnalysis.averageAdjustedPrice;
    const aiEstimate = aiValuation.estimatedValue ?? statisticalEstimate;
    const estimatedValue = Math.round(
      depth === 'comprehensive'
        ? aiEstimate * 0.6 + statisticalEstimate * 0.4
        : statisticalEstimate * 0.7 + aiEstimate * 0.3
    );

    // Calculate value range
    const valueRange = aiValuation.valueRange ?? {
      low: Math.round(estimatedValue * 0.92),
      high: Math.round(estimatedValue * 1.08),
    };

    // Collect warnings
    const warnings = [
      ...(aiValuation.warnings ?? []),
      ...this.generateWarnings(property, comparablesWithAdjustments, marketTrend),
    ];

    return {
      estimatedValue,
      valueRange,
      confidence,
      confidenceFactors,
      comparableAnalysis,
      marketTrend,
      pricePrediction,
      adjustments: aiValuation.adjustments ?? this.getMostImpactfulAdjustments(comparablesWithAdjustments),
      methodology: this.getMethodologyDescription(depth),
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateValuationReport(result: ValuationResult, property: PropertyData): Promise<ValuationReport> {
    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) {
      return this.generateFallbackReport(result, property);
    }

    try {
      const prompt = `Generate a professional real estate valuation report for the following property:

Property: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
Estimated Value: $${result.estimatedValue.toLocaleString()}
Value Range: $${result.valueRange.low.toLocaleString()} - $${result.valueRange.high.toLocaleString()}
Confidence: ${result.confidence}%
Comparables Analyzed: ${result.comparableAnalysis.comparables.length}
Market Trend: ${result.marketTrend.direction} (${result.marketTrend.annualAppreciationRate.toFixed(1)}% annual)

Generate the following sections as a JSON object:
{
  "summary": "<1-2 sentence summary>",
  "executiveSummary": "<3-4 paragraph executive summary>",
  "propertyOverview": "<detailed property description>",
  "comparableAnalysisReport": "<analysis of comparable sales>",
  "marketAnalysisReport": "<local market conditions analysis>",
  "pricePredictionReport": "<future price outlook>",
  "riskAssessment": "<risks and considerations>",
  "recommendation": "<overall recommendation>",
  "disclaimers": ["<disclaimer1>", "<disclaimer2>"]
}`;

      const response = await provider.complete({
        messages: [
          { role: 'system', content: 'You are an expert real estate appraiser producing professional valuation reports. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        responseFormat: { type: 'json_object' },
        temperature: 0.3,
      });

      const report = JSON.parse(response.content);
      return {
        summary: report.summary ?? '',
        executiveSummary: report.executiveSummary ?? '',
        propertyOverview: report.propertyOverview ?? '',
        comparableAnalysisReport: report.comparableAnalysisReport ?? '',
        marketAnalysisReport: report.marketAnalysisReport ?? '',
        pricePredictionReport: report.pricePredictionReport ?? '',
        riskAssessment: report.riskAssessment ?? '',
        recommendation: report.recommendation ?? '',
        disclaimers: report.disclaimers ?? this.getDefaultDisclaimers(),
      };
    } catch {
      return this.generateFallbackReport(result, property);
    }
  }

  private async generateAIValuation(
    property: PropertyData,
    comparables: ComparableProperty[],
    marketTrend: MarketTrendAnalysis
  ): Promise<Partial<ValuationResult>> {
    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) return {};

    const prompt = buildValuationPrompt(property, comparables, marketTrend);
    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You are an expert real estate appraiser. Return valid JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
      responseFormat: { type: 'json_object' },
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.content);
    return {
      estimatedValue: parsed.estimatedValue,
      valueRange: parsed.valueRange,
      adjustments: parsed.adjustments,
      warnings: parsed.warnings,
    };
  }

  private analyzeComparables(comparables: ComparableProperty[]): ComparableAnalysis {
    if (comparables.length === 0) {
      return {
        comparables: [],
        averageAdjustedPrice: 0,
        medianAdjustedPrice: 0,
        priceRange: { min: 0, max: 0 },
        averageDaysOnMarket: 0,
        averageSimilarityScore: 0,
        weightings: {},
      };
    }

    const prices = comparables.map((c) => c.adjustedPrice).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 !== 0
      ? prices[mid]
      : (prices[mid - 1] + prices[mid]) / 2;

    return {
      comparables,
      averageAdjustedPrice: Math.round(
        prices.reduce((a, b) => a + b, 0) / prices.length
      ),
      medianAdjustedPrice: Math.round(median),
      priceRange: { min: prices[0], max: prices[prices.length - 1] },
      averageDaysOnMarket: Math.round(
        comparables.reduce((sum, c) => sum + c.daysOnMarket, 0) / comparables.length
      ),
      averageSimilarityScore:
        comparables.reduce((sum, c) => sum + c.similarityScore, 0) / comparables.length,
      weightings: {
        location: 0.3,
        size: 0.25,
        condition: 0.2,
        features: 0.15,
        age: 0.1,
      },
    };
  }

  private generatePricePrediction(
    currentValue: number,
    marketTrend: MarketTrendAnalysis,
    property: PropertyData
  ): PricePrediction {
    const annualRate = marketTrend.annualAppreciationRate / 100;
    const monthlyRate = annualRate / 12;

    // Seasonal adjustment based on month
    const month = new Date().getMonth();
    const seasonalFactors = [0.98, 0.99, 1.01, 1.03, 1.04, 1.03, 1.02, 1.01, 1.02, 1.01, 0.99, 0.97];
    const seasonalFactor = seasonalFactors[month] ?? 1;

    const sixMonth = currentValue * Math.pow(1 + monthlyRate, 6) * seasonalFactor;
    const twelveMonth = currentValue * Math.pow(1 + annualRate, 1);
    const twentyFourMonth = currentValue * Math.pow(1 + annualRate, 2);

    const riskLevel =
      Math.abs(annualRate) > 0.1 ? 'high' : Math.abs(annualRate) > 0.04 ? 'medium' : 'low';

    return {
      currentEstimate: Math.round(currentValue),
      sixMonthEstimate: Math.round(sixMonth),
      twelveMonthEstimate: Math.round(twelveMonth),
      twentyFourMonthEstimate: Math.round(twentyFourMonth),
      monthlyGrowthRate: Math.round(monthlyRate * 10000) / 100,
      annualGrowthRate: Math.round(annualRate * 10000) / 100,
      riskLevel,
      predictionConfidence: Math.max(30, 80 - Math.abs(annualRate) * 200),
      seasonalFactor: Math.round(seasonalFactor * 100) / 100,
    };
  }

  private getDefaultPricePrediction(currentValue: number): PricePrediction {
    return {
      currentEstimate: Math.round(currentValue),
      sixMonthEstimate: Math.round(currentValue * 1.02),
      twelveMonthEstimate: Math.round(currentValue * 1.04),
      twentyFourMonthEstimate: Math.round(currentValue * 1.08),
      monthlyGrowthRate: 0.33,
      annualGrowthRate: 4,
      riskLevel: 'medium',
      predictionConfidence: 50,
      seasonalFactor: 1,
    };
  }

  private generateDefaultMarketTrend(): MarketTrendAnalysis {
    return {
      direction: 'stable',
      annualAppreciationRate: 3.5,
      monthlyTrend: [],
      quarterlyTrend: [],
      yearOverYearChange: 3.5,
      marketCondition: 'balanced',
      inventoryLevel: 'normal',
      avgDaysOnMarket: 30,
      saleToListRatio: 0.98,
    };
  }

  private generateWarnings(
    property: PropertyData,
    comparables: ComparableProperty[],
    marketTrend: MarketTrendAnalysis
  ): string[] {
    const warnings: string[] = [];

    if (comparables.length < 3) {
      warnings.push('Limited comparable data available. Valuation may be less accurate.');
    }

    if (marketTrend.marketCondition === 'seller') {
      warnings.push('Strong seller market may inflate prices above long-term value.');
    }

    if (property.yearBuilt < 1970) {
      warnings.push('Older property may have deferred maintenance not reflected in condition rating.');
    }

    if (property.hoaFee && property.hoaFee > 500) {
      warnings.push('High HOA fees may affect long-term appreciation potential.');
    }

    const avgSimilarity = comparables.reduce((s, c) => s + c.similarityScore, 0) / Math.max(comparables.length, 1);
    if (avgSimilarity < 0.6) {
      warnings.push('Comparables have low similarity scores. Consider adjusting for unique features.');
    }

    if (property.condition === 'poor') {
      warnings.push('Property in poor condition. Valuation assumes repairs are needed.');
    }

    return warnings;
  }

  private getMostImpactfulAdjustments(comparables: ComparableProperty[]): Adjustment[] {
    const allAdjustments = comparables.flatMap((c) => c.adjustments);
    const grouped = new Map<string, Adjustment[]>();

    for (const adj of allAdjustments) {
      if (!grouped.has(adj.feature)) grouped.set(adj.feature, []);
      grouped.get(adj.feature)!.push(adj);
    }

    return Array.from(grouped.entries())
      .map(([feature, adjs]) => ({
        feature,
        description: `Average adjustment across comparables`,
        amount: Math.round(adjs.reduce((s, a) => s + a.amount, 0) / adjs.length),
        direction: (adjs.reduce((s, a) => s + a.amount, 0) / adjs.length > 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);
  }

  private getMethodologyDescription(depth: string): string {
    switch (depth) {
      case 'comprehensive':
        return 'Comprehensive valuation combining AI-powered analysis with statistical comparable sales approach, market trend analysis, and predictive modeling.';
      case 'standard':
        return 'Standard valuation using comparable sales analysis with AI enhancement and market trend consideration.';
      case 'quick':
        return 'Quick estimate based on comparable sales data and basic market metrics.';
      default:
        return 'Valuation using comparable sales analysis and market data.';
    }
  }

  private generateFallbackReport(result: ValuationResult, property: PropertyData): ValuationReport {
    return {
      summary: `Estimated value for ${property.address} is $${result.estimatedValue.toLocaleString()} (range: $${result.valueRange.low.toLocaleString()} - $${result.valueRange.high.toLocaleString()}).`,
      executiveSummary: `This valuation is based on ${result.comparableAnalysis.comparables.length} comparable properties with an average similarity score of ${(result.comparableAnalysis.averageSimilarityScore * 100).toFixed(0)}%. The local market is ${result.marketTrend.marketCondition} with ${result.marketTrend.direction} price trends at ${result.marketTrend.annualAppreciationRate.toFixed(1)}% annual appreciation.`,
      propertyOverview: `${property.bedrooms}-bedroom, ${property.bathrooms}-bath ${property.propertyType.replace('_', ' ')} built in ${property.yearBuilt} with ${property.squareFeet.toLocaleString()} sqft of living space. Property is in ${property.condition} condition.`,
      comparableAnalysisReport: `Analyzed ${result.comparableAnalysis.comparables.length} comparable sales. Adjusted price range: $${result.comparableAnalysis.priceRange.min.toLocaleString()} - $${result.comparableAnalysis.priceRange.max.toLocaleString()}. Average days on market: ${result.comparableAnalysis.averageDaysOnMarket}.`,
      marketAnalysisReport: `The local market is ${result.marketTrend.marketCondition} with ${result.marketTrend.inventoryLevel} inventory levels. Sale-to-list ratio: ${(result.marketTrend.saleToListRatio * 100).toFixed(1)}%.`,
      pricePredictionReport: `Projected 12-month value: $${result.pricePrediction.twelveMonthEstimate.toLocaleString()} (${result.pricePrediction.annualGrowthRate}% annual growth). Risk level: ${result.pricePrediction.riskLevel}.`,
      riskAssessment: result.warnings.length > 0
        ? `Key risks: ${result.warnings.join('; ')}`
        : 'No significant risk factors identified.',
      recommendation: `Based on the analysis, the estimated market value of $${result.estimatedValue.toLocaleString()} appears ${result.confidence >= 70 ? 'well-supported' : 'reasonable given available data'}.`,
      disclaimers: this.getDefaultDisclaimers(),
    };
  }

  private getDefaultDisclaimers(): string[] {
    return [
      'This valuation is an estimate and should not be considered a formal appraisal.',
      'Actual market value may vary based on factors not captured in available data.',
      'Property condition details are based on provided information and may not reflect current state.',
      'Market conditions are subject to change and may affect property values.',
      'Consult a licensed appraiser for official valuations.',
    ];
  }
}
