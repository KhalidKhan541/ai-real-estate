export interface ValuationRequest {
  propertyId?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt: number;
  condition?: "excellent" | "good" | "fair" | "poor";
  features?: string[];
  recentRenovations?: string[];
  comparables?: string[];
}

export interface ValuationResult {
  id: string;
  propertyId?: string;
  estimatedValue: number;
  confidenceScore: number;
  valueRange: { low: number; high: number };
  methodology: "comparable" | "income" | "cost" | "hybrid";
  comparables: Array<{
    address: string;
    price: number;
    squareFeet: number;
    pricePerSqft: number;
    similarity: number;
  }>;
  adjustments: Array<{
    factor: string;
    amount: number;
    reason: string;
  }>;
  marketFactors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
  generatedAt: string;
  expiresAt: string;
  modelVersion: string;
}

const valuations: Map<string, ValuationResult> = new Map();

export class ValuationService {
  async generateValuation(request: ValuationRequest): Promise<ValuationResult> {
    const id = `val_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const basePricePerSqft = this.getBasePricePerSqft(request.city, request.state);
    let baseValue = request.squareFeet * basePricePerSqft;

    if (request.lotSize && request.lotSize > 0) {
      baseValue += request.lotSize * 5;
    }

    const ageFactor = this.getAgeFactor(request.yearBuilt);
    baseValue *= ageFactor;

    const conditionMultiplier = this.getConditionMultiplier(request.condition || "good");
    baseValue *= conditionMultiplier;

    const bedroomBonus = request.bedrooms * 5000;
    const bathroomBonus = request.bathrooms * 8000;
    baseValue += bedroomBonus + bathroomBonus;

    const featureAdjustments = (request.features || []).reduce((sum, feature) => {
      return sum + this.getFeatureAdjustment(feature);
    }, 0);
    baseValue += featureAdjustments;

    const renovationAdjustment = (request.recentRenovations || []).reduce((sum, renovation) => {
      return sum + this.getRenovationAdjustment(renovation);
    }, 0);
    baseValue += renovationAdjustment;

    const confidence = this.calculateConfidence(request);
    const rangePercentage = (1 - confidence) * 0.3;
    const low = Math.round(baseValue * (1 - rangePercentage));
    const high = Math.round(baseValue * (1 + rangePercentage));

    const comparables = this.generateComparables(request, baseValue);
    const adjustments = this.generateAdjustments(request, featureAdjustments, renovationAdjustment);
    const marketFactors = this.generateMarketFactors(request);

    const result: ValuationResult = {
      id,
      propertyId: request.propertyId,
      estimatedValue: Math.round(baseValue),
      confidenceScore: confidence,
      valueRange: { low, high },
      methodology: "hybrid",
      comparables,
      adjustments,
      marketFactors,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      modelVersion: "1.0.0",
    };

    valuations.set(id, result);
    return result;
  }

  async getById(id: string): Promise<ValuationResult | null> {
    return valuations.get(id) || null;
  }

  async getValuationHistory(propertyId: string): Promise<ValuationResult[]> {
    return Array.from(valuations.values())
      .filter((v) => v.propertyId === propertyId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  async compareValuations(ids: string[]): Promise<{
    valuations: ValuationResult[];
    averageValue: number;
    valueRange: { min: number; max: number };
    consensusConfidence: number;
  }> {
    const results = ids
      .map((id) => valuations.get(id))
      .filter((v): v is ValuationResult => v !== undefined);

    if (results.length === 0) {
      return { valuations: [], averageValue: 0, valueRange: { min: 0, max: 0 }, consensusConfidence: 0 };
    }

    const values = results.map((v) => v.estimatedValue);
    const averageValue = values.reduce((s, v) => s + v, 0) / values.length;
    const consensusConfidence =
      results.reduce((s, v) => s + v.confidenceScore, 0) / results.length;

    return {
      valuations: results,
      averageValue: Math.round(averageValue),
      valueRange: { min: Math.min(...values), max: Math.max(...values) },
      consensusConfidence: Math.round(consensusConfidence * 100) / 100,
    };
  }

  async getMarketTrend(
    city: string,
    state: string,
    months: number = 12
  ): Promise<{
    trend: "appreciating" | "depreciating" | "stable";
    changePercent: number;
    averagePrice: number;
    medianPrice: number;
    pricePerSqft: number;
    inventory: number;
    daysOnMarket: number;
  }> {
    const basePrice = this.getBasePricePerSqft(city, state) * 1800;
    const monthlyChange = (Math.random() - 0.4) * 0.02;
    const totalChange = monthlyChange * months;

    return {
      trend: totalChange > 0.02 ? "appreciating" : totalChange < -0.02 ? "depreciating" : "stable",
      changePercent: Math.round(totalChange * 100 * 100) / 100,
      averagePrice: Math.round(basePrice * (1 + totalChange)),
      medianPrice: Math.round(basePrice * 0.95 * (1 + totalChange)),
      pricePerSqft: this.getBasePricePerSqft(city, state),
      inventory: Math.floor(Math.random() * 200) + 50,
      daysOnMarket: Math.floor(Math.random() * 30) + 15,
    };
  }

  private getBasePricePerSqft(city: string, state: string): number {
    const cityState = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    const priceMap: Record<string, number> = {
      "new york, ny": 1200,
      "los angeles, ca": 800,
      "chicago, il": 350,
      "houston, tx": 250,
      "miami, fl": 600,
      "san francisco, ca": 1100,
      "seattle, wa": 750,
      "boston, ma": 900,
      "austin, tx": 450,
      "denver, co": 500,
    };
    return priceMap[cityState] || 300;
  }

  private getAgeFactor(yearBuilt: number): number {
    const age = new Date().getFullYear() - yearBuilt;
    if (age <= 5) return 1.05;
    if (age <= 10) return 1.0;
    if (age <= 20) return 0.95;
    if (age <= 30) return 0.9;
    if (age <= 50) return 0.85;
    return 0.8;
  }

  private getConditionMultiplier(condition: string): number {
    const multipliers: Record<string, number> = {
      excellent: 1.1,
      good: 1.0,
      fair: 0.9,
      poor: 0.75,
    };
    return multipliers[condition] || 1.0;
  }

  private getFeatureAdjustment(feature: string): number {
    const adjustments: Record<string, number> = {
      pool: 25000,
      garage: 15000,
      fireplace: 10000,
      "hardwood floors": 8000,
      "granite countertops": 5000,
      "stainless steel appliances": 3000,
      "central air": 7000,
      "smart home": 12000,
      "solar panels": 20000,
      "wine cellar": 15000,
      elevator: 30000,
      "home theater": 20000,
    };
    return adjustments[feature.toLowerCase()] || 2000;
  }

  private getRenovationAdjustment(renovation: string): number {
    const adjustments: Record<string, number> = {
      kitchen: 35000,
      bathroom: 20000,
      roof: 15000,
      hvac: 10000,
      flooring: 12000,
      landscaping: 8000,
      addition: 50000,
      basement: 30000,
    };
    return adjustments[renovation.toLowerCase()] || 10000;
  }

  private calculateConfidence(request: ValuationRequest): number {
    let confidence = 0.7;
    if (request.squareFeet > 0) confidence += 0.05;
    if (request.yearBuilt > 0) confidence += 0.05;
    if (request.condition) confidence += 0.05;
    if (request.features && request.features.length > 0) confidence += 0.05;
    if (request.comparables && request.comparables.length > 0) confidence += 0.1;
    return Math.min(confidence, 0.95);
  }

  private generateComparables(
    request: ValuationRequest,
    baseValue: number
  ): ValuationResult["comparables"] {
    const count = 3;
    const comparables = [];
    for (let i = 0; i < count; i++) {
      const variance = (Math.random() - 0.5) * 0.2;
      const price = Math.round(baseValue * (1 + variance));
      const sqft = request.squareFeet + Math.round((Math.random() - 0.5) * 400);
      comparables.push({
        address: `${100 + i} Nearby St, ${request.city}, ${request.state}`,
        price,
        squareFeet: sqft,
        pricePerSqft: Math.round(price / sqft),
        similarity: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
      });
    }
    return comparables;
  }

  private generateAdjustments(
    request: ValuationRequest,
    featureAdj: number,
    renovationAdj: number
  ): ValuationResult["adjustments"] {
    const adjustments: ValuationResult["adjustments"] = [];
    if (featureAdj !== 0) {
      adjustments.push({
        factor: "Features",
        amount: featureAdj,
        reason: `${request.features?.length || 0} features considered`,
      });
    }
    if (renovationAdj !== 0) {
      adjustments.push({
        factor: "Renovations",
        amount: renovationAdj,
        reason: `${request.recentRenovations?.length || 0} recent renovations`,
      });
    }
    return adjustments;
  }

  private generateMarketFactors(
    request: ValuationRequest
  ): ValuationResult["marketFactors"] {
    return [
      {
        factor: "Market Conditions",
        impact: "positive",
        description: "Current market is favorable for sellers",
      },
      {
        factor: "Interest Rates",
        impact: Math.random() > 0.5 ? "positive" : "negative",
        description: "Interest rates affect buyer purchasing power",
      },
      {
        factor: "Local Inventory",
        impact: "neutral",
        description: "Supply and demand balance in the area",
      },
    ];
  }

  clear(): void {
    valuations.clear();
  }
}

export const valuationService = new ValuationService();
