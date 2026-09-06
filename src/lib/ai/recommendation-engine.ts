export interface UserPreferences {
  userId: string;
  budget: { min: number; max: number };
  propertyTypes: string[];
  preferredAreas: Array<{ city: string; state: string; zip?: string }>;
  bedrooms: { min: number; max: number };
  bathrooms: { min: number; max: number };
  squareFeet: { min: number; max: number };
  mustHaveFeatures: string[];
  niceToHaveFeatures: string[];
  dealBreakers: string[];
  commuteAddress?: string;
  maxCommuteMinutes?: number;
  schoolDistrict?: string;
  petFriendly?: boolean;
  parkingRequired?: boolean;
  yearBuilt?: { min?: number; max?: number };
}

export interface PropertyRecommendation {
  propertyId: string;
  score: number;
  matchPercentage: number;
  reasons: Array<{
    category: string;
    score: number;
    explanation: string;
  }>;
  warnings: string[];
  priceAnalysis: {
    isUnderpriced: boolean;
    isOverpriced: boolean;
    marketComparison: string;
  };
}

export interface RecommendationRequest {
  userId: string;
  preferences: UserPreferences;
  excludePropertyIds?: string[];
  limit?: number;
  minScore?: number;
}

const userPreferencesStore: Map<string, UserPreferences> = new Map();

export class RecommendationEngine {
  async getRecommendations(
    request: RecommendationRequest,
    properties: Array<{
      id: string;
      price: number;
      type: string;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
      features: string[];
      address: { city: string; state: string; zip?: string };
      yearBuilt: number;
    }>
  ): Promise<PropertyRecommendation[]> {
    const { preferences, excludePropertyIds = [], limit = 10, minScore = 0.5 } = request;

    const candidates = properties.filter(
      (p) => !excludePropertyIds.includes(p.id)
    );

    const scored = candidates.map((property) =>
      this.scoreProperty(property, preferences)
    );

    return scored
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async savePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    userPreferencesStore.set(preferences.userId, preferences);
    return preferences;
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    return userPreferencesStore.get(userId) || null;
  }

  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences | null> {
    const existing = userPreferencesStore.get(userId);
    if (!existing) return null;

    const updated = { ...existing, ...updates, userId };
    userPreferencesStore.set(userId, updated);
    return updated;
  }

  async analyzeSearchBehavior(
    userId: string,
    searches: Array<{
      query: string;
      filters: Record<string, unknown>;
      viewedProperties: string[];
      savedProperties: string[];
      contactedProperties: string[];
    }>
  ): Promise<Partial<UserPreferences>> {
    const priceRanges = searches
      .map((s) => s.filters.price as { min?: number; max?: number } | undefined)
      .filter(Boolean) as Array<{ min?: number; max?: number }>;

    const avgMin =
      priceRanges.reduce((sum, r) => sum + (r.min || 0), 0) / (priceRanges.length || 1);
    const avgMax =
      priceRanges.reduce((sum, r) => sum + (r.max || Infinity), 0) / (priceRanges.length || 1);

    const propertyTypes = searches
      .map((s) => s.filters.type as string | undefined)
      .filter(Boolean) as string[];

    const cities = searches
      .map((s) => s.filters.city as string | undefined)
      .filter(Boolean) as string[];

    return {
      budget: {
        min: Math.round(avgMin * 0.9),
        max: Math.round(avgMax * 1.1),
      },
      propertyTypes: [...new Set(propertyTypes)],
      preferredAreas: [...new Set(cities)].map((city) => ({
        city,
        state: "",
      })),
    };
  }

  async calculateMatchScore(
    property: {
      price: number;
      type: string;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
      features: string[];
      address: { city: string; state: string };
      yearBuilt: number;
    },
    preferences: UserPreferences
  ): Promise<{
    totalScore: number;
    breakdown: Array<{ category: string; score: number; weight: number }>;
  }> {
    const breakdown = [
      {
        category: "Budget",
        score: this.calculateBudgetScore(property.price, preferences.budget),
        weight: 0.3,
      },
      {
        category: "Property Type",
        score: this.calculateTypeScore(property.type, preferences.propertyTypes),
        weight: 0.15,
      },
      {
        category: "Size",
        score: this.calculateSizeScore(
          property.bedrooms,
          property.bathrooms,
          property.squareFeet,
          preferences
        ),
        weight: 0.2,
      },
      {
        category: "Location",
        score: this.calculateLocationScore(property.address, preferences.preferredAreas),
        weight: 0.2,
      },
      {
        category: "Features",
        score: this.calculateFeatureScore(property.features, preferences),
        weight: 0.15,
      },
    ];

    const totalScore = breakdown.reduce(
      (sum, b) => sum + b.score * b.weight,
      0
    );

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown,
    };
  }

  private scoreProperty(
    property: {
      id: string;
      price: number;
      type: string;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
      features: string[];
      address: { city: string; state: string; zip?: string };
      yearBuilt: number;
    },
    preferences: UserPreferences
  ): PropertyRecommendation {
    const budgetScore = this.calculateBudgetScore(property.price, preferences.budget);
    const typeScore = this.calculateTypeScore(property.type, preferences.propertyTypes);
    const sizeScore = this.calculateSizeScore(
      property.bedrooms,
      property.bathrooms,
      property.squareFeet,
      preferences
    );
    const locationScore = this.calculateLocationScore(property.address, preferences.preferredAreas);
    const featureScore = this.calculateFeatureScore(property.features, preferences);

    const score =
      budgetScore * 0.3 +
      typeScore * 0.15 +
      sizeScore * 0.2 +
      locationScore * 0.2 +
      featureScore * 0.15;

    const reasons: PropertyRecommendation["reasons"] = [];
    if (budgetScore > 0.8)
      reasons.push({ category: "Price", score: budgetScore, explanation: "Within budget" });
    if (typeScore > 0.8)
      reasons.push({ category: "Type", score: typeScore, explanation: "Matches preferred property type" });
    if (sizeScore > 0.8)
      reasons.push({ category: "Size", score: sizeScore, explanation: "Meets size requirements" });
    if (locationScore > 0.8)
      reasons.push({ category: "Location", score: locationScore, explanation: "In preferred area" });
    if (featureScore > 0.8)
      reasons.push({ category: "Features", score: featureScore, explanation: "Has desired features" });

    const warnings: string[] = [];
    const hasDealBreaker = preferences.dealBreakers.some(
      (db) => property.features.includes(db)
    );
    if (hasDealBreaker) warnings.push("Contains a deal-breaker feature");

    if (property.price > preferences.budget.max * 1.1)
      warnings.push("Over budget by more than 10%");

    if (property.yearBuilt < (preferences.yearBuilt?.min || 0))
      warnings.push("Older than preferred");

    const avgMarketPrice = property.price * 1.05;
    const priceAnalysis = {
      isUnderpriced: property.price < avgMarketPrice * 0.9,
      isOverpriced: property.price > avgMarketPrice * 1.1,
      marketComparison:
        property.price < avgMarketPrice * 0.9
          ? "Priced below market average"
          : property.price > avgMarketPrice * 1.1
          ? "Priced above market average"
          : "Priced at market average",
    };

    return {
      propertyId: property.id,
      score: Math.round(score * 100) / 100,
      matchPercentage: Math.round(score * 100),
      reasons,
      warnings,
      priceAnalysis,
    };
  }

  private calculateBudgetScore(price: number, budget: { min: number; max: number }): number {
    if (price < budget.min) {
      const diff = budget.min - price;
      return Math.max(0.5, 1 - diff / budget.min);
    }
    if (price > budget.max) {
      const diff = price - budget.max;
      return Math.max(0, 1 - diff / budget.max);
    }
    return 1.0;
  }

  private calculateTypeScore(propertyType: string, preferredTypes: string[]): number {
    if (preferredTypes.length === 0) return 1.0;
    return preferredTypes.includes(propertyType) ? 1.0 : 0.2;
  }

  private calculateSizeScore(
    bedrooms: number,
    bathrooms: number,
    squareFeet: number,
    preferences: UserPreferences
  ): number {
    let score = 0;
    if (bedrooms >= preferences.bedrooms.min && bedrooms <= preferences.bedrooms.max) {
      score += 0.4;
    } else {
      score += 0.1;
    }
    if (bathrooms >= preferences.bathrooms.min && bathrooms <= preferences.bathrooms.max) {
      score += 0.3;
    } else {
      score += 0.1;
    }
    if (squareFeet >= preferences.squareFeet.min && squareFeet <= preferences.squareFeet.max) {
      score += 0.3;
    } else {
      score += 0.1;
    }
    return score;
  }

  private calculateLocationScore(
    address: { city: string; state: string },
    preferredAreas: Array<{ city: string; state: string; zip?: string }>
  ): number {
    if (preferredAreas.length === 0) return 1.0;
    const match = preferredAreas.some(
      (area) =>
        area.city.toLowerCase() === address.city.toLowerCase() &&
        (!area.state || area.state.toLowerCase() === address.state.toLowerCase())
    );
    return match ? 1.0 : 0.3;
  }

  private calculateFeatureScore(
    features: string[],
    preferences: UserPreferences
  ): number {
    const mustHave = preferences.mustHaveFeatures;
    if (mustHave.length === 0) return 1.0;

    const matched = mustHave.filter((f) =>
      features.some((pf) => pf.toLowerCase() === f.toLowerCase())
    );
    return matched.length / mustHave.length;
  }

  clear(): void {
    userPreferencesStore.clear();
  }
}

export const recommendationEngine = new RecommendationEngine();
