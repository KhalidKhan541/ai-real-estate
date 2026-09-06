export interface MarketData {
  id: string;
  city: string;
  state: string;
  zip?: string;
  period: string;
  medianPrice: number;
  averagePrice: number;
  pricePerSqft: number;
  totalSales: number;
  inventory: number;
  daysOnMarket: number;
  newListings: number;
  closedSales: number;
  priceReduced: number;
  monthsOfSupply: number;
  saleToListRatio: number;
  yearOverYearChange: number;
  monthOverMonthChange: number;
  generatedAt: string;
}

export interface MarketPrediction {
  city: string;
  state: string;
  predictedPrice: number;
  confidenceInterval: { low: number; high: number };
  trend: "appreciating" | "depreciating" | "stable";
  predictedChange: number;
  timeframe: "3months" | "6months" | "1year";
  factors: Array<{
    name: string;
    impact: "high" | "medium" | "low";
    direction: "positive" | "negative";
    description: string;
  }>;
  generatedAt: string;
}

export interface NeighborhoodInsight {
  neighborhood: string;
  city: string;
  state: string;
  safetyScore: number;
  schoolRating: number;
  walkabilityScore: number;
  transitScore: number;
  avgIncome: number;
  populationGrowth: number;
  crimeRate: number;
  amenities: Array<{
    type: string;
    count: number;
    averageRating: number;
  }>;
  growthProjection: "high" | "medium" | "low" | "declining";
  investmentPotential: "excellent" | "good" | "fair" | "poor";
}

const marketDataStore: Map<string, MarketData> = new Map();
const predictions: Map<string, MarketPrediction> = new Map();
const neighborhoodInsights: Map<string, NeighborhoodInsight> = new Map();

export class MarketAnalyzer {
  async analyzeMarket(city: string, state: string): Promise<MarketData> {
    const key = `${city.toLowerCase()}_${state.toLowerCase()}`;
    const basePrice = this.getBasePrice(city, state);
    const variance = (Math.random() - 0.5) * 0.1;

    const data: MarketData = {
      id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      city,
      state,
      period: new Date().toISOString().slice(0, 7),
      medianPrice: Math.round(basePrice * (1 + variance)),
      averagePrice: Math.round(basePrice * 1.05 * (1 + variance)),
      pricePerSqft: Math.round(basePrice / 1800),
      totalSales: Math.floor(Math.random() * 500) + 100,
      inventory: Math.floor(Math.random() * 300) + 50,
      daysOnMarket: Math.floor(Math.random() * 30) + 15,
      newListings: Math.floor(Math.random() * 200) + 50,
      closedSales: Math.floor(Math.random() * 150) + 30,
      priceReduced: Math.floor(Math.random() * 50) + 10,
      monthsOfSupply: Math.round((Math.random() * 3 + 1) * 10) / 10,
      saleToListRatio: Math.round((0.9 + Math.random() * 0.1) * 100) / 100,
      yearOverYearChange: Math.round((Math.random() * 10 - 3) * 100) / 100,
      monthOverMonthChange: Math.round((Math.random() * 3 - 1) * 100) / 100,
      generatedAt: new Date().toISOString(),
    };

    marketDataStore.set(key, data);
    return data;
  }

  async getMarketData(city: string, state: string): Promise<MarketData | null> {
    const key = `${city.toLowerCase()}_${state.toLowerCase()}`;
    return marketDataStore.get(key) || null;
  }

  async predictMarket(
    city: string,
    state: string,
    timeframe: MarketPrediction["timeframe"] = "6months"
  ): Promise<MarketPrediction> {
    const current = await this.analyzeMarket(city, state);
    const monthlyGrowthRate = current.monthOverMonthChange / 100;
    const months = timeframe === "3months" ? 3 : timeframe === "6months" ? 6 : 12;
    const predictedGrowth = monthlyGrowthRate * months;
    const predictedPrice = Math.round(current.medianPrice * (1 + predictedGrowth));
    const confidenceRange = Math.abs(predictedGrowth) * 0.5;

    const prediction: MarketPrediction = {
      city,
      state,
      predictedPrice,
      confidenceInterval: {
        low: Math.round(predictedPrice * (1 - confidenceRange)),
        high: Math.round(predictedPrice * (1 + confidenceRange)),
      },
      trend: predictedGrowth > 0.02 ? "appreciating" : predictedGrowth < -0.02 ? "depreciating" : "stable",
      predictedChange: Math.round(predictedGrowth * 100 * 100) / 100,
      timeframe,
      factors: [
        {
          name: "Interest Rates",
          impact: "high",
          direction: current.monthOverMonthChange > 0 ? "positive" : "negative",
          description: "Mortgage rates influence buyer demand",
        },
        {
          name: "Inventory Levels",
          impact: "medium",
          direction: current.monthsOfSupply < 3 ? "positive" : "negative",
          description: "Low inventory drives prices up",
        },
        {
          name: "Economic Growth",
          impact: "medium",
          direction: "positive",
          description: "Local economic indicators support growth",
        },
        {
          name: "Population Growth",
          impact: "low",
          direction: "positive",
          description: "Continued migration to the area",
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    predictions.set(`${city}_${state}_${timeframe}`, prediction);
    return prediction;
  }

  async getNeighborhoodInsights(
    city: string,
    state: string,
    neighborhood: string
  ): Promise<NeighborhoodInsight> {
    const key = `${neighborhood.toLowerCase()}_${city.toLowerCase()}_${state.toLowerCase()}`;

    const insight: NeighborhoodInsight = {
      neighborhood,
      city,
      state,
      safetyScore: Math.floor(Math.random() * 40) + 60,
      schoolRating: Math.floor(Math.random() * 3) + 7,
      walkabilityScore: Math.floor(Math.random() * 40) + 60,
      transitScore: Math.floor(Math.random() * 50) + 50,
      avgIncome: Math.floor(Math.random() * 50000) + 50000,
      populationGrowth: Math.round((Math.random() * 5 - 1) * 100) / 100,
      crimeRate: Math.round(Math.random() * 5 * 100) / 100,
      amenities: [
        { type: "restaurants", count: Math.floor(Math.random() * 20) + 5, averageRating: 4.0 + Math.random() * 0.5 },
        { type: "parks", count: Math.floor(Math.random() * 10) + 1, averageRating: 4.0 + Math.random() * 0.5 },
        { type: "shopping", count: Math.floor(Math.random() * 15) + 3, averageRating: 3.5 + Math.random() * 1 },
        { type: "schools", count: Math.floor(Math.random() * 8) + 2, averageRating: 3.5 + Math.random() * 1.5 },
      ],
      growthProjection: populationGrowthToProjection(Math.random() * 5 - 1),
      investmentPotential: scoreToPotential(Math.floor(Math.random() * 40) + 60),
    };

    neighborhoodInsights.set(key, insight);
    return insight;
  }

  async compareMarkets(
    markets: Array<{ city: string; state: string }>
  ): Promise<{
    markets: MarketData[];
    bestValue: { city: string; state: string; pricePerSqft: number };
    fastestGrowing: { city: string; state: string; changePercent: number };
    mostAffordable: { city: string; state: string; medianPrice: number };
  }> {
    const data = await Promise.all(
      markets.map((m) => this.analyzeMarket(m.city, m.state))
    );

    const bestValue = data.reduce((best, current) =>
      current.pricePerSqft < best.pricePerSqft ? current : best
    );
    const fastestGrowing = data.reduce((best, current) =>
      current.yearOverYearChange > best.yearOverYearChange ? current : best
    );
    const mostAffordable = data.reduce((best, current) =>
      current.medianPrice < best.medianPrice ? current : best
    );

    return {
      markets: data,
      bestValue: { city: bestValue.city, state: bestValue.state, pricePerSqft: bestValue.pricePerSqft },
      fastestGrowing: { city: fastestGrowing.city, state: fastestGrowing.state, changePercent: fastestGrowing.yearOverYearChange },
      mostAffordable: { city: mostAffordable.city, state: mostAffordable.state, medianPrice: mostAffordable.medianPrice },
    };
  }

  async getInvestmentScore(
    city: string,
    state: string
  ): Promise<{
    score: number;
    breakdown: Array<{ category: string; score: number; weight: number }>;
    recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  }> {
    const data = await this.analyzeMarket(city, state);
    const breakdown = [
      { category: "Appreciation Potential", score: Math.min(100, Math.max(0, 50 + data.yearOverYearChange * 5)), weight: 0.3 },
      { category: "Rental Yield", score: Math.floor(Math.random() * 30) + 50, weight: 0.25 },
      { category: "Market Liquidity", score: Math.min(100, Math.max(0, 100 - data.daysOnMarket)), weight: 0.2 },
      { category: "Supply-Demand", score: Math.min(100, Math.max(0, 100 - data.monthsOfSupply * 20)), weight: 0.15 },
      { category: "Economic Fundamentals", score: Math.floor(Math.random() * 20) + 70, weight: 0.1 },
    ];

    const score = Math.round(
      breakdown.reduce((sum, b) => sum + b.score * b.weight, 0)
    );

    let recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
    if (score >= 80) recommendation = "strong_buy";
    else if (score >= 65) recommendation = "buy";
    else if (score >= 50) recommendation = "hold";
    else if (score >= 35) recommendation = "sell";
    else recommendation = "strong_sell";

    return { score, breakdown, recommendation };
  }

  async getHistoricalData(
    city: string,
    state: string,
    months: number = 12
  ): Promise<MarketData[]> {
    const data: MarketData[] = [];
    const basePrice = this.getBasePrice(city, state);

    for (let i = months; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const variance = (Math.random() - 0.5) * 0.1;
      const growthFactor = 1 + (months - i) * 0.005;

      data.push({
        id: `hist_${i}`,
        city,
        state,
        period: date.toISOString().slice(0, 7),
        medianPrice: Math.round(basePrice * growthFactor * (1 + variance)),
        averagePrice: Math.round(basePrice * 1.05 * growthFactor * (1 + variance)),
        pricePerSqft: Math.round((basePrice * growthFactor) / 1800),
        totalSales: Math.floor(Math.random() * 500) + 100,
        inventory: Math.floor(Math.random() * 300) + 50,
        daysOnMarket: Math.floor(Math.random() * 30) + 15,
        newListings: Math.floor(Math.random() * 200) + 50,
        closedSales: Math.floor(Math.random() * 150) + 30,
        priceReduced: Math.floor(Math.random() * 50) + 10,
        monthsOfSupply: Math.round((Math.random() * 3 + 1) * 10) / 10,
        saleToListRatio: Math.round((0.9 + Math.random() * 0.1) * 100) / 100,
        yearOverYearChange: Math.round((Math.random() * 10 - 3) * 100) / 100,
        monthOverMonthChange: Math.round((Math.random() * 3 - 1) * 100) / 100,
        generatedAt: date.toISOString(),
      });
    }
    return data;
  }

  private getBasePrice(city: string, state: string): number {
    const cityState = `${city.toLowerCase()}, ${state.toLowerCase()}`;
    const priceMap: Record<string, number> = {
      "new york, ny": 850000,
      "los angeles, ca": 750000,
      "chicago, il": 350000,
      "houston, tx": 300000,
      "miami, fl": 550000,
      "san francisco, ca": 1200000,
      "seattle, wa": 700000,
      "boston, ma": 750000,
      "austin, tx": 500000,
      "denver, co": 550000,
    };
    return priceMap[cityState] || 350000;
  }

  clear(): void {
    marketDataStore.clear();
    predictions.clear();
    neighborhoodInsights.clear();
  }
}

function populationGrowthToProjection(growth: number): "high" | "medium" | "low" | "declining" {
  if (growth > 3) return "high";
  if (growth > 1) return "medium";
  if (growth > 0) return "low";
  return "declining";
}

function scoreToPotential(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

export const marketAnalyzer = new MarketAnalyzer();
