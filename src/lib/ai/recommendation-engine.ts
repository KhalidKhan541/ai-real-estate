/**
 * AI-powered property recommendation engine.
 * Matches buyers to properties, finds similar listings,
 * generates investment recommendations, and performs neighborhood matching.
 */

import { type AIProviderManager } from './provider';
import { type PropertyData } from './valuation-service';

// ─── Types ─────────────────────────────────────────────────────────

export interface BuyerProfile {
  id: string;
  name?: string;
  budget: { min: number; max: number };
  preferences: BuyerPreferences;
  history?: BuyerHistory;
  location?: { city: string; state: string; latitude?: number; longitude?: number };
  timeline: 'immediate' | '3_months' | '6_months' | '1_year' | 'flexible';
  financingType: 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
}

export interface BuyerPreferences {
  propertyTypes: PropertyData['propertyType'][];
  minBedrooms: number;
  maxBedrooms?: number;
  minBathrooms: number;
  maxBathrooms?: number;
  minSqFt: number;
  maxSqFt?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  maxLotSize?: number;
  minGarageSpaces?: number;
  mustHaveFeatures: string[];
  niceToHaveFeatures: string[];
  dealBreakers: string[];
  preferredCondition: PropertyData['condition'][];
  maxHOAFee?: number;
  maxDistanceMiles?: number;
  schoolDistrict?: string;
  walkability?: 'high' | 'medium' | 'low' | 'any';
  commute?: { destination: string; maxMinutes: number };
}

export interface BuyerHistory {
  viewedProperties: string[];
  savedProperties: string[];
  rejectedProperties: string[];
  inquiries: string[];
  tourProperties: string[];
  feedbackScores: Record<string, number>;
}

export interface RecommendationResult {
  property: PropertyData;
  score: number;
  matchReasons: MatchReason[];
  warnings: string[];
  priceAnalysis: PriceAnalysis;
  similarToViewed?: string[];
}

export interface MatchReason {
  category: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface PriceAnalysis {
  estimatedFairValue: number;
  marketValue: number;
  isUnderpriced: boolean;
  isOverpriced: boolean;
  valueScore: number;
  pricePerSqFt: number;
  areaAvgPricePerSqFt: number;
  pricePercentile: number;
}

export interface SimilarPropertyResult {
  property: PropertyData;
  similarityScore: number;
  similarityFactors: SimilarityFactor[];
  priceDifference: number;
  priceDifferencePercent: number;
}

export interface SimilarityFactor {
  feature: string;
  weight: number;
  similarity: number;
}

export interface InvestmentRecommendation {
  property: PropertyData;
  investmentScore: number;
  strategy: InvestmentStrategy;
  projectedReturns: ProjectedReturns;
  riskFactors: string[];
  comparableInvestments: string[];
}

export interface InvestmentStrategy {
  type: 'buy_and_hold' | 'fix_and_flip' | 'rental' | 'short_term_rental' | 'commercial';
  description: string;
  expectedHoldPeriod: string;
  requiredCapital: number;
  renovationBudget?: number;
}

export interface ProjectedReturns {
  annualCashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  totalROI5Year: number;
  appreciation5Year: number;
  rentalIncome5Year: number;
  exitStrategy: string;
}

export interface NeighborhoodMatch {
  neighborhood: string;
  score: number;
  matchFactors: NeighborhoodFactor[];
  avgPrice: number;
  priceRange: { min: number; max: number };
  demographics: NeighborhoodDemographics;
}

export interface NeighborhoodFactor {
  feature: string;
  score: number;
  weight: number;
  description: string;
}

export interface NeighborhoodDemographics {
  medianAge: number;
  medianIncome: number;
  familyFriendly: number;
  safetyScore: number;
  schoolRating: number;
  walkabilityScore: number;
  transitScore: number;
}

export interface RecommendationRequest {
  buyer: BuyerProfile;
  availableProperties: PropertyData[];
  options?: {
    maxResults?: number;
    minScore?: number;
    includeSimilar?: boolean;
    includeInvestment?: boolean;
    includeNeighborhood?: boolean;
    diversifyResults?: boolean;
  };
}

export interface RecommendationResponse {
  recommendations: RecommendationResult[];
  similarProperties: SimilarPropertyResult[];
  investmentPicks: InvestmentRecommendation[];
  neighborhoodMatches: NeighborhoodMatch[];
  summary: string;
  generatedAt: string;
}

// ─── Recommendation Engine ─────────────────────────────────────────

export class RecommendationEngine {
  private providerManager: AIProviderManager;

  constructor(providerManager: AIProviderManager) {
    this.providerManager = providerManager;
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const { buyer, availableProperties, options = {} } = request;
    const maxResults = options.maxResults ?? 10;
    const minScore = options.minScore ?? 30;

    // Score all properties against buyer profile
    const scored = availableProperties.map((property) =>
      this.scoreProperty(buyer, property)
    );

    // Filter and sort
    const filtered = scored
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score);

    // Diversify if requested
    const recommendations = options.diversifyResults
      ? this.diversifyResults(filtered, maxResults)
      : filtered.slice(0, maxResults);

    // Find similar properties to top picks
    let similarProperties: SimilarPropertyResult[] = [];
    if (options.includeSimilar !== false && recommendations.length > 0) {
      similarProperties = this.findSimilarProperties(
        recommendations[0].property,
        availableProperties.filter(
          (p) => !recommendations.some((r) => r.property.id === p.id)
        ),
        5
      );
    }

    // Investment recommendations
    let investmentPicks: InvestmentRecommendation[] = [];
    if (options.includeInvestment) {
      investmentPicks = this.generateInvestmentRecommendations(
        availableProperties,
        buyer
      );
    }

    // Neighborhood matches
    let neighborhoodMatches: NeighborhoodMatch[] = [];
    if (options.includeNeighborhood) {
      neighborhoodMatches = this.matchNeighborhoods(buyer);
    }

    // Generate AI summary
    const summary = await this.generateSummary(buyer, recommendations, investmentPicks);

    return {
      recommendations,
      similarProperties,
      investmentPicks,
      neighborhoodMatches,
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  async findSimilarProperties(
    target: PropertyData,
    candidates: PropertyData[],
    limit: number = 5
  ): Promise<SimilarPropertyResult[]> {
    return candidates
      .map((candidate) => ({
        property: candidate,
        ...this.calculateSimilarity(target, candidate),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  async getBuyerPreferences(buyerId: string): Promise<BuyerPreferences | null> {
    // In production, fetch from database
    return null;
  }

  // ─── Scoring Methods ──────────────────────────────────────────

  private scoreProperty(
    buyer: BuyerProfile,
    property: PropertyData
  ): RecommendationResult {
    const matchReasons: MatchReason[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Budget match (weight: 25)
    const budgetScore = this.scoreBudget(buyer.budget, property);
    matchReasons.push({
      category: 'Budget',
      score: budgetScore,
      weight: 25,
      explanation: this.getBudgetExplanation(buyer.budget, property),
    });
    totalScore += budgetScore * 25;
    totalWeight += 25;

    // Location match (weight: 20)
    const locationScore = this.scoreLocation(buyer, property);
    matchReasons.push({
      category: 'Location',
      score: locationScore,
      weight: 20,
      explanation: `Property is in ${property.city}, ${property.state}`,
    });
    totalScore += locationScore * 20;
    totalWeight += 20;

    // Size match (weight: 15)
    const sizeScore = this.scoreSize(buyer.preferences, property);
    matchReasons.push({
      category: 'Size',
      score: sizeScore,
      weight: 15,
      explanation: `${property.squareFeet.toLocaleString()} sqft, ${property.bedrooms} bed, ${property.bathrooms} bath`,
    });
    totalScore += sizeScore * 15;
    totalWeight += 15;

    // Feature match (weight: 15)
    const featureScore = this.scoreFeatures(buyer.preferences, property);
    matchReasons.push({
      category: 'Features',
      score: featureScore,
      weight: 15,
      explanation: this.getFeatureExplanation(buyer.preferences, property),
    });
    totalScore += featureScore * 15;
    totalWeight += 15;

    // Property type match (weight: 10)
    const typeScore = this.scorePropertyType(buyer.preferences, property);
    matchReasons.push({
      category: 'Property Type',
      score: typeScore,
      weight: 10,
      explanation: `Property type: ${property.propertyType.replace('_', ' ')}`,
    });
    totalScore += typeScore * 10;
    totalWeight += 10;

    // Condition match (weight: 5)
    const conditionScore = this.scoreCondition(buyer.preferences, property);
    matchReasons.push({
      category: 'Condition',
      score: conditionScore,
      weight: 5,
      explanation: `Property condition: ${property.condition}`,
    });
    totalScore += conditionScore * 5;
    totalWeight += 5;

    // Year built match (weight: 5)
    const yearScore = this.scoreYearBuilt(buyer.preferences, property);
    matchReasons.push({
      category: 'Age',
      score: yearScore,
      weight: 5,
      explanation: `Built in ${property.yearBuilt}`,
    });
    totalScore += yearScore * 5;
    totalWeight += 5;

    // HOA match (weight: 5)
    const hoaScore = this.scoreHOA(buyer.preferences, property);
    matchReasons.push({
      category: 'HOA',
      score: hoaScore,
      weight: 5,
      explanation: property.hoaFee
        ? `HOA fee: $${property.hoaFee}/month`
        : 'No HOA fee',
    });
    totalScore += hoaScore * 5;
    totalWeight += 5;

    // Calculate final score
    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Price analysis
    const priceAnalysis = this.analyzePrice(property);

    // Deal breaker check
    const warnings = this.checkDealBreakers(buyer.preferences, property);

    return {
      property,
      score: finalScore,
      matchReasons,
      warnings,
      priceAnalysis,
    };
  }

  private scoreBudget(budget: BuyerProfile['budget'], property: PropertyData): number {
    const price = property.listingPrice ?? property.lastSalePrice ?? 0;
    if (price === 0) return 50;
    if (price >= budget.min && price <= budget.max) return 100;
    if (price < budget.min) {
      const ratio = price / budget.min;
      return Math.max(60, ratio * 100);
    }
    const overRatio = (price - budget.max) / budget.max;
    return Math.max(0, 100 - overRatio * 200);
  }

  private getBudgetExplanation(budget: BuyerProfile['budget'], property: PropertyData): string {
    const price = property.listingPrice ?? property.lastSalePrice ?? 0;
    if (price >= budget.min && price <= budget.max) return 'Within budget';
    if (price < budget.min) return `$${(budget.min - price).toLocaleString()} below budget`;
    return `$${(price - budget.max).toLocaleString()} above budget`;
  }

  private scoreLocation(buyer: BuyerProfile, property: PropertyData): number {
    if (!buyer.location) return 70;
    if (buyer.location.city === property.city && buyer.location.state === property.state) return 100;
    if (buyer.location.state === property.state) return 70;
    return 40;
  }

  private scoreSize(prefs: BuyerPreferences, property: PropertyData): number {
    let score = 100;

    // Bedrooms
    if (property.bedrooms < prefs.minBedrooms) score -= 30;
    if (prefs.maxBedrooms && property.bedrooms > prefs.maxBedrooms) score -= 15;

    // Bathrooms
    if (property.bathrooms < prefs.minBathrooms) score -= 25;
    if (prefs.maxBathrooms && property.bathrooms > prefs.maxBathrooms) score -= 10;

    // Square footage
    if (property.squareFeet < prefs.minSqFt) {
      const deficit = (prefs.minSqFt - property.squareFeet) / prefs.minSqFt;
      score -= Math.min(30, deficit * 100);
    }
    if (prefs.maxSqFt && property.squareFeet > prefs.maxSqFt) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreFeatures(prefs: BuyerPreferences, property: PropertyData): number {
    const propertyFeatures = property.features.map((f) => f.toLowerCase());
    let score = 60; // Base score

    // Must-have features (critical)
    const mustHaves = prefs.mustHaveFeatures.map((f) => f.toLowerCase());
    const missingMustHaves = mustHaves.filter(
      (f) => !propertyFeatures.some((pf) => pf.includes(f))
    );
    if (mustHaves.length > 0) {
      const mustHaveScore = ((mustHaves.length - missingMustHaves.length) / mustHaves.length) * 40;
      score = mustHaveScore;
    }

    // Nice-to-have features (bonus)
    const niceToHaves = prefs.niceToHaveFeatures.map((f) => f.toLowerCase());
    const matchingNiceToHaves = niceToHaves.filter(
      (f) => propertyFeatures.some((pf) => pf.includes(f))
    );
    if (niceToHaves.length > 0) {
      score += (matchingNiceToHaves.length / niceToHaves.length) * 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  private getFeatureExplanation(prefs: BuyerPreferences, property: PropertyData): string {
    const propertyFeatures = property.features.map((f) => f.toLowerCase());
    const mustHaves = prefs.mustHaveFeatures.map((f) => f.toLowerCase());
    const matching = mustHaves.filter((f) => propertyFeatures.some((pf) => pf.includes(f)));
    const missing = mustHaves.filter((f) => !propertyFeatures.some((pf) => pf.includes(f)));

    if (missing.length === 0 && mustHaves.length > 0) return 'All must-have features present';
    if (matching.length > 0) return `Has ${matching.join(', ')}`;
    return 'Feature match pending review';
  }

  private scorePropertyType(prefs: BuyerPreferences, property: PropertyData): number {
    return prefs.propertyTypes.includes(property.propertyType) ? 100 : 30;
  }

  private scoreCondition(prefs: BuyerPreferences, property: PropertyData): number {
    return prefs.preferredCondition.includes(property.condition) ? 100 : 50;
  }

  private scoreYearBuilt(prefs: BuyerPreferences, property: PropertyData): number {
    if (prefs.minYearBuilt && property.yearBuilt < prefs.minYearBuilt) return 50;
    if (prefs.maxYearBuilt && property.yearBuilt > prefs.maxYearBuilt) return 70;
    return 90;
  }

  private scoreHOA(prefs: BuyerPreferences, property: PropertyData): number {
    if (!property.hoaFee) return 90;
    if (prefs.maxHOAFee === undefined) return 80;
    if (property.hoaFee <= prefs.maxHOAFee) return 100;
    const overRatio = (property.hoaFee - prefs.maxHOAFee) / prefs.maxHOAFee;
    return Math.max(0, 100 - overRatio * 200);
  }

  private checkDealBreakers(prefs: BuyerPreferences, property: PropertyData): string[] {
    const warnings: string[] = [];
    const propertyFeatures = property.features.map((f) => f.toLowerCase());

    for (const breaker of prefs.dealBreakers) {
      if (propertyFeatures.some((f) => f.includes(breaker.toLowerCase()))) {
        warnings.push(`Deal breaker: Property has "${breaker}"`);
      }
    }

    if (property.hoaFee && prefs.maxHOAFee !== undefined && property.hoaFee > prefs.maxHOAFee) {
      warnings.push(`HOA fee ($${property.hoaFee}/mo) exceeds maximum ($${prefs.maxHOAFee}/mo)`);
    }

    return warnings;
  }

  private analyzePrice(property: PropertyData): PriceAnalysis {
    const price = property.listingPrice ?? property.lastSalePrice ?? 0;
    const pricePerSqFt = price > 0 ? Math.round(price / property.squareFeet) : 0;
    const areaAvgPricePerSqFt = pricePerSqFt * (0.9 + Math.random() * 0.2);

    const estimatedFairValue = Math.round(areaAvgPricePerSqFt * property.squareFeet);
    const marketValue = price;

    const isUnderpriced = price < estimatedFairValue * 0.95;
    const isOverpriced = price > estimatedFairValue * 1.05;
    const valueScore = isUnderpriced ? 90 : isOverpriced ? 40 : 70;

    return {
      estimatedFairValue,
      marketValue,
      isUnderpriced,
      isOverpriced,
      valueScore,
      pricePerSqFt,
      areaAvgPricePerSqFt: Math.round(areaAvgPricePerSqFt),
      pricePercentile: Math.round(50 + (pricePerSqFt - areaAvgPricePerSqFt) / areaAvgPricePerSqFt * 30),
    };
  }

  // ─── Similarity ───────────────────────────────────────────────

  private calculateSimilarity(
    target: PropertyData,
    candidate: PropertyData
  ): { similarityScore: number; similarityFactors: SimilarityFactor[]; priceDifference: number; priceDifferencePercent: number } {
    const factors: SimilarityFactor[] = [];

    // Square footage similarity
    const sqFtDiff = Math.abs(target.squareFeet - candidate.squareFeet) / Math.max(target.squareFeet, 1);
    const sqFtSim = Math.max(0, 1 - sqFtDiff);
    factors.push({ feature: 'Square Footage', weight: 0.25, similarity: sqFtSim });

    // Bedroom similarity
    const bedSim = 1 - Math.abs(target.bedrooms - candidate.bedrooms) / Math.max(target.bedrooms, 1) * 0.5;
    factors.push({ feature: 'Bedrooms', weight: 0.15, similarity: bedSim });

    // Bathroom similarity
    const bathSim = 1 - Math.abs(target.bathrooms - candidate.bathrooms) / Math.max(target.bathrooms, 1) * 0.5;
    factors.push({ feature: 'Bathrooms', weight: 0.15, similarity: bathSim });

    // Type match
    const typeSim = target.propertyType === candidate.propertyType ? 1 : 0.3;
    factors.push({ feature: 'Property Type', weight: 0.15, similarity: typeSim });

    // Year built similarity
    const yearDiff = Math.abs(target.yearBuilt - candidate.yearBuilt);
    const yearSim = Math.max(0, 1 - yearDiff / 50);
    factors.push({ feature: 'Age', weight: 0.1, similarity: yearSim });

    // Feature overlap
    const targetFeatures = new Set(target.features.map((f) => f.toLowerCase()));
    const candidateFeatures = new Set(candidate.features.map((f) => f.toLowerCase()));
    const intersection = new Set([...targetFeatures].filter((f) => candidateFeatures.has(f)));
    const union = new Set([...targetFeatures, ...candidateFeatures]);
    const featureSim = union.size > 0 ? intersection.size / union.size : 0;
    factors.push({ feature: 'Features', weight: 0.1, similarity: featureSim });

    // Location proximity (if available)
    const locationSim = target.city === candidate.city ? 1 : target.state === candidate.state ? 0.5 : 0.2;
    factors.push({ feature: 'Location', weight: 0.1, similarity: locationSim });

    // Calculate weighted similarity
    const similarityScore = factors.reduce((sum, f) => sum + f.similarity * f.weight, 0);

    // Price difference
    const targetPrice = target.listingPrice ?? target.lastSalePrice ?? 0;
    const candidatePrice = candidate.listingPrice ?? candidate.lastSalePrice ?? 0;
    const priceDifference = candidatePrice - targetPrice;
    const priceDifferencePercent = targetPrice > 0 ? (priceDifference / targetPrice) * 100 : 0;

    return {
      similarityScore: Math.round(similarityScore * 1000) / 1000,
      similarityFactors: factors,
      priceDifference,
      priceDifferencePercent: Math.round(priceDifferencePercent * 10) / 10,
    };
  }

  // ─── Investment Recommendations ──────────────────────────────

  private generateInvestmentRecommendations(
    properties: PropertyData[],
    buyer: BuyerProfile
  ): InvestmentRecommendation[] {
    return properties
      .map((property) => this.scoreInvestment(property, buyer))
      .filter((rec) => rec.investmentScore >= 50)
      .sort((a, b) => b.investmentScore - a.investmentScore)
      .slice(0, 5);
  }

  private scoreInvestment(property: PropertyData, buyer: BuyerProfile): InvestmentRecommendation {
    const price = property.listingPrice ?? property.lastSalePrice ?? 0;
    const pricePerSqFt = price / Math.max(property.squareFeet, 1);

    // Estimate rental income (simplified)
    const monthlyRent = price * 0.008;
    const annualRent = monthlyRent * 12;

    // Expenses
    const propertyTax = price * 0.012;
    const insurance = price * 0.005;
    const maintenance = price * 0.01;
    const vacancy = annualRent * 0.05;
    const totalExpenses = propertyTax + insurance + maintenance + vacancy;

    const annualCashFlow = annualRent - totalExpenses;
    const cashOnCashReturn = buyer.financingType === 'cash'
      ? (annualCashFlow / price) * 100
      : (annualCashFlow / (price * 0.25)) * 100;
    const capRate = ((annualRent - totalExpenses) / price) * 100;

    // 5-year projections
    const annualAppreciation = 0.035;
    const appreciation5Year = price * Math.pow(1 + annualAppreciation, 5) - price;
    const rentalIncome5Year = annualRent * 5;
    const totalROI5Year = ((appreciation5Year + rentalIncome5Year - totalExpenses * 5) / price) * 100;

    let strategy: InvestmentStrategy;
    const score = this.calculateInvestmentScore(cashOnCashReturn, capRate, totalROI5Year);

    if (property.condition === 'poor' || property.condition === 'fair') {
      strategy = {
        type: 'fix_and_flip',
        description: 'Purchase, renovate, and sell for profit',
        expectedHoldPeriod: '3-6 months',
        requiredCapital: price * 0.25,
        renovationBudget: price * 0.15,
      };
    } else if (property.propertyType === 'condo' || property.propertyType === 'townhouse') {
      strategy = {
        type: 'short_term_rental',
        description: 'Short-term rental via Airbnb/VRBO for higher yields',
        expectedHoldPeriod: '1-2 years',
        requiredCapital: price * 0.25,
      };
    } else {
      strategy = {
        type: 'rental',
        description: 'Long-term rental for steady cash flow',
        expectedHoldPeriod: '5+ years',
        requiredCapital: price * 0.25,
      };
    }

    const riskFactors: string[] = [];
    if (capRate < 4) riskFactors.push('Low cap rate may indicate overpriced market');
    if (property.yearBuilt < 1980) riskFactors.push('Older property may have maintenance issues');
    if (property.hoaFee && property.hoaFee > 300) riskFactors.push('High HOA fees reduce cash flow');

    return {
      property,
      investmentScore: Math.round(score),
      strategy,
      projectedReturns: {
        annualCashFlow: Math.round(annualCashFlow),
        cashOnCashReturn: Math.round(cashOnCashReturn * 10) / 10,
        capRate: Math.round(capRate * 10) / 10,
        totalROI5Year: Math.round(totalROI5Year * 10) / 10,
        appreciation5Year: Math.round(appreciation5Year),
        rentalIncome5Year: Math.round(rentalIncome5Year),
        exitStrategy: strategy.type === 'fix_and_flip' ? 'Sale after renovation' : 'Hold and rent',
      },
      riskFactors,
      comparableInvestments: [],
    };
  }

  private calculateInvestmentScore(
    cashOnCash: number,
    capRate: number,
    totalROI: number
  ): number {
    let score = 0;
    score += Math.min(30, Math.max(0, cashOnCash * 3));
    score += Math.min(30, Math.max(0, capRate * 3));
    score += Math.min(40, Math.max(0, totalROI / 3));
    return Math.min(100, Math.max(0, score));
  }

  // ─── Neighborhood Matching ────────────────────────────────────

  private matchNeighborhoods(buyer: BuyerProfile): NeighborhoodMatch[] {
    const neighborhoods = this.getNeighborhoodData(buyer);

    return neighborhoods
      .map((n) => ({
        ...n,
        score: this.calculateNeighborhoodScore(buyer, n),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private calculateNeighborhoodScore(
    buyer: BuyerPreferences,
    neighborhood: NeighborhoodMatch
  ): number {
    let score = 0;

    // Price affordability
    const avgPrice = neighborhood.avgPrice;
    const budgetMid = (buyer.budget.min + buyer.budget.max) / 2;
    const priceFit = 1 - Math.abs(avgPrice - budgetMid) / budgetMid;
    score += Math.max(0, priceFit) * 30;

    // Safety
    score += (neighborhood.demographics.safetyScore / 100) * 20;

    // Schools
    score += (neighborhood.demographics.schoolRating / 10) * 15;

    // Walkability
    const walkPref = buyer.preferences.walkability ?? 'any';
    if (walkPref !== 'any') {
      const walkScore = neighborhood.demographics.walkabilityScore;
      if (walkPref === 'high' && walkScore > 70) score += 15;
      else if (walkPref === 'medium' && walkScore > 40) score += 10;
      else if (walkPref === 'low') score += 10;
    } else {
      score += 10;
    }

    // Family friendliness
    score += (neighborhood.demographics.familyFriendly / 100) * 10;

    // Transit
    score += (neighborhood.demographics.transitScore / 100) * 10;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private getNeighborhoodData(buyer: BuyerProfile): NeighborhoodMatch[] {
    // In production, query neighborhood database
    const city = buyer.location?.city ?? 'Unknown';
    return [
      {
        neighborhood: `${city} Downtown`,
        score: 0,
        matchFactors: [],
        avgPrice: 450000,
        priceRange: { min: 250000, max: 800000 },
        demographics: { medianAge: 32, medianIncome: 75000, familyFriendly: 60, safetyScore: 75, schoolRating: 7, walkabilityScore: 85, transitScore: 70 },
      },
      {
        neighborhood: `${city} Suburbs`,
        score: 0,
        matchFactors: [],
        avgPrice: 380000,
        priceRange: { min: 280000, max: 550000 },
        demographics: { medianAge: 38, medianIncome: 95000, familyFriendly: 90, safetyScore: 85, schoolRating: 8, walkabilityScore: 40, transitScore: 30 },
      },
      {
        neighborhood: `${city} Midtown`,
        score: 0,
        matchFactors: [],
        avgPrice: 420000,
        priceRange: { min: 200000, max: 700000 },
        demographics: { medianAge: 35, medianIncome: 80000, familyFriendly: 65, safetyScore: 70, schoolRating: 6, walkabilityScore: 75, transitScore: 60 },
      },
    ];
  }

  // ─── Diversification ──────────────────────────────────────────

  private diversifyResults(
    results: RecommendationResult[],
    maxResults: number
  ): RecommendationResult[] {
    if (results.length <= maxResults) return results;

    const diversified: RecommendationResult[] = [];
    const usedTypes = new Set<string>();
    const usedPriceBuckets = new Set<string>();

    // First pass: ensure variety
    for (const result of results) {
      if (diversified.length >= maxResults) break;

      const priceBucket = this.getPriceBucket(result.property.listingPrice ?? 0);
      const type = result.property.propertyType;

      if (!usedTypes.has(type) || !usedPriceBuckets.has(priceBucket)) {
        diversified.push(result);
        usedTypes.add(type);
        usedPriceBuckets.add(priceBucket);
      }
    }

    // Fill remaining with top scores
    for (const result of results) {
      if (diversified.length >= maxResults) break;
      if (!diversified.includes(result)) {
        diversified.push(result);
      }
    }

    return diversified;
  }

  private getPriceBucket(price: number): string {
    if (price < 200000) return 'budget';
    if (price < 400000) return 'mid';
    if (price < 700000) return 'upper';
    return 'luxury';
  }

  // ─── AI Summary ───────────────────────────────────────────────

  private async generateSummary(
    buyer: BuyerProfile,
    recommendations: RecommendationResult[],
    investmentPicks: InvestmentRecommendation[]
  ): Promise<string> {
    if (recommendations.length === 0) {
      return 'No properties currently match your criteria. Consider adjusting your budget or preferences.';
    }

    const topPick = recommendations[0];
    const budgetRange = `$${buyer.budget.min.toLocaleString()} - $${buyer.budget.max.toLocaleString()}`;

    let summary = `Found ${recommendations.length} properties matching your criteria (budget: ${budgetRange}). `;
    summary += `Top recommendation: ${topPick.property.address} (${topPick.score}% match). `;

    if (topPick.priceAnalysis.isUnderpriced) {
      summary += 'This property appears to be underpriced relative to the market. ';
    }

    if (investmentPicks.length > 0) {
      summary += `${investmentPicks.length} investment opportunities identified.`;
    }

    return summary;
  }
}
