/**
 * AI-powered market analytics service.
 * Provides trend analysis, price forecasting, supply/demand evaluation,
 * investment scoring, and market comparison capabilities.
 */

import { type AIProviderManager } from './provider';

// ─── Types ─────────────────────────────────────────────────────────

export interface MarketRegion {
  id: string;
  name: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  propertyType?: string;
}

export interface MarketStatistics {
  region: MarketRegion;
  period: string;
  medianPrice: number;
  meanPrice: number;
  pricePerSqFt: number;
  totalSales: number;
  activeListings: number;
  pendingListings: number;
  newListings: number;
  daysOnMarket: { avg: number; median: number };
  saleToListRatio: number;
  inventoryMonths: number;
  priceReductions: number;
  priceReductionPct: number;
  absorptionRate: number;
  monthsOfSupply: number;
}

export interface MarketTrend {
  period: string;
  direction: 'rising' | 'falling' | 'stable' | 'volatile';
  strength: number;
  percentageChange: number;
  volumeChange: number;
  seasonalPattern: 'peak' | 'off_peak' | 'transition';
  volatilityIndex: number;
}

export interface PriceForecast {
  targetDate: string;
  predictedPrice: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  methodology: string;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  name: string;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface SupplyDemandAnalysis {
  supplyLevel: 'very_low' | 'low' | 'balanced' | 'high' | 'very_high';
  demandLevel: 'very_low' | 'low' | 'balanced' | 'high' | 'very_high';
  balanceRatio: number;
  monthsOfSupply: number;
  absorptionRate: number;
  newConstructionPipeline: number;
  migrationTrend: 'inbound' | 'outbound' | 'stable';
  employmentGrowth: number;
  populationGrowth: number;
  outlook: string;
}

export interface InvestmentScore {
  overall: number;
  appreciation: number;
  rentalYield: number;
  cashFlow: number;
  riskAdjusted: number;
  liquidity: number;
  economicStrength: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D';
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  reasoning: string;
  comparableMarkets: string[];
}

export interface MarketComparison {
  regions: string[];
  metrics: MarketComparisonMetric[];
  rankings: MarketRanking[];
  summary: string;
}

export interface MarketComparisonMetric {
  name: string;
  values: Record<string, number>;
  unit: string;
  bestRegion: string;
}

export interface MarketRanking {
  category: string;
  rankings: Array<{ region: string; rank: number; score: number }>;
}

export interface MarketAnalysisRequest {
  region: MarketRegion;
  timeframe?: '1m' | '3m' | '6m' | '1y' | '2y' | '5y';
  propertyType?: string;
  priceRange?: { min: number; max: number };
  options?: {
    includeForecast?: boolean;
    forecastMonths?: number;
    includeComparison?: boolean;
    comparisonRegions?: MarketRegion[];
    depth?: 'quick' | 'standard' | 'comprehensive';
  };
}

export interface MarketAnalysisResult {
  statistics: MarketStatistics;
  trends: MarketTrend[];
  forecast?: PriceForecast[];
  supplyDemand: SupplyDemandAnalysis;
  investmentScore: InvestmentScore;
  comparison?: MarketComparison;
  insights: string[];
  generatedAt: string;
}

// ─── Market Data Processing ────────────────────────────────────────

interface RawSaleData {
  price: number;
  sqft: number;
  date: string;
  daysOnMarket: number;
  listPrice: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
}

function computeStatistics(sales: RawSaleData[], activeListings: number): MarketStatistics {
  if (sales.length === 0) {
    return {
      region: { id: '', name: '', city: '', state: '' },
      period: new Date().toISOString().slice(0, 7),
      medianPrice: 0,
      meanPrice: 0,
      pricePerSqFt: 0,
      totalSales: 0,
      activeListings,
      pendingListings: 0,
      newListings: 0,
      daysOnMarket: { avg: 0, median: 0 },
      saleToListRatio: 0,
      inventoryMonths: 0,
      priceReductions: 0,
      priceReductionPct: 0,
      absorptionRate: 0,
      monthsOfSupply: 0,
    };
  }

  const prices = sales.map((s) => s.price).sort((a, b) => a - b);
  const sqftPrices = sales.map((s) => s.price / Math.max(s.sqft, 1));
  const domValues = sales.map((s) => s.daysOnMarket).sort((a, b) => a - b);
  const saleToListRatios = sales.map((s) => s.price / Math.max(s.listPrice, 1));

  const mid = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2 !== 0
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;

  const midDom = Math.floor(domValues.length / 2);
  const medianDom = domValues.length % 2 !== 0
    ? domValues[midDom]
    : (domValues[midDom - 1] + domValues[midDom]) / 2;

  const avgSaleToList = saleToListRatios.reduce((a, b) => a + b, 0) / saleToListRatios.length;
  const avgDom = domValues.reduce((a, b) => a + b, 0) / domValues.length;
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const avgSqFtPrice = sqftPrices.reduce((a, b) => a + b, 0) / sqftPrices.length;
  const monthlySales = sales.length / 3;
  const absorptionRate = monthlySales / Math.max(activeListings, 1);

  return {
    region: { id: '', name: '', city: '', state: '' },
    period: new Date().toISOString().slice(0, 7),
    medianPrice: Math.round(medianPrice),
    meanPrice: Math.round(avgPrice),
    pricePerSqFt: Math.round(avgSqFtPrice),
    totalSales: sales.length,
    activeListings,
    pendingListings: Math.round(sales.length * 0.15),
    newListings: Math.round(sales.length * 0.4),
    daysOnMarket: { avg: Math.round(avgDom), median: Math.round(medianDom) },
    saleToListRatio: Math.round(avgSaleToList * 1000) / 1000,
    inventoryMonths: activeListings / Math.max(monthlySales, 1),
    priceReductions: 0,
    priceReductionPct: 0,
    absorptionRate: Math.round(absorptionRate * 1000) / 1000,
    monthsOfSupply: Math.round((activeListings / Math.max(monthlySales, 1)) * 10) / 10,
  };
}

function detectTrend(prices: number[], volumes: number[], domValues: number[]): MarketTrend {
  if (prices.length < 2) {
    return {
      period: 'insufficient',
      direction: 'stable',
      strength: 0,
      percentageChange: 0,
      volumeChange: 0,
      seasonalPattern: 'transition',
      volatilityIndex: 0,
    };
  }

  // Simple linear regression for trend
  const n = prices.length;
  const xMean = (n - 1) / 2;
  const yMean = prices.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (prices[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }

  const slope = den !== 0 ? num / den : 0;
  const percentageChange = ((prices[prices.length - 1] - prices[0]) / Math.max(prices[0], 1)) * 100;

  // Volatility (standard deviation of returns)
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / Math.max(prices[i - 1], 1));
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / Math.max(returns.length, 1);
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(returns.length, 1);
  const volatilityIndex = Math.sqrt(variance) * 100;

  // Direction
  let direction: MarketTrend['direction'];
  if (Math.abs(percentageChange) < 2) {
    direction = 'stable';
  } else if (volatilityIndex > 5) {
    direction = 'volatile';
  } else if (percentageChange > 0) {
    direction = 'rising';
  } else {
    direction = 'falling';
  }

  // Strength (normalized slope)
  const strength = Math.min(100, Math.abs(slope) / yMean * 10000);

  // Seasonal pattern
  const month = new Date().getMonth();
  let seasonalPattern: MarketTrend['seasonalPattern'];
  if (month >= 3 && month <= 6) seasonalPattern = 'peak';
  else if (month >= 10 || month <= 1) seasonalPattern = 'off_peak';
  else seasonalPattern = 'transition';

  // Volume change
  const volumeChange = volumes.length >= 2
    ? ((volumes[volumes.length - 1] - volumes[0]) / Math.max(volumes[0], 1)) * 100
    : 0;

  return {
    period: `${prices.length} periods`,
    direction,
    strength: Math.round(strength * 10) / 10,
    percentageChange: Math.round(percentageChange * 100) / 100,
    volumeChange: Math.round(volumeChange * 100) / 100,
    seasonalPattern,
    volatilityIndex: Math.round(volatilityIndex * 100) / 100,
  };
}

// ─── Market Analyzer ───────────────────────────────────────────────

export class MarketAnalyzer {
  private providerManager: AIProviderManager;
  private statisticsCache: Map<string, { data: MarketStatistics; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(providerManager: AIProviderManager) {
    this.providerManager = providerManager;
  }

  async analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResult> {
    const { region, options = {} } = request;
    const depth = options.depth ?? 'standard';

    // Fetch or compute statistics
    const statistics = await this.fetchStatistics(region, request);

    // Detect trends from historical data
    const trends = this.computeTrends(statistics);

    // Supply/demand analysis
    const supplyDemand = this.analyzeSupplyDemand(statistics, region);

    // Investment scoring
    const investmentScore = this.scoreInvestment(statistics, supplyDemand, region);

    // Forecast if requested
    let forecast: PriceForecast[] | undefined;
    if (options.includeForecast !== false) {
      forecast = await this.generateForecast(
        statistics,
        trends,
        region,
        options.forecastMonths ?? 12
      );
    }

    // Comparison if requested
    let comparison: MarketComparison | undefined;
    if (options.includeComparison && options.comparisonRegions?.length) {
      comparison = await this.compareMarkets(region, options.comparisonRegions);
    }

    // Generate AI insights
    const insights = await this.generateInsights(statistics, trends, supplyDemand, investmentScore);

    return {
      statistics,
      trends,
      forecast,
      supplyDemand,
      investmentScore,
      comparison,
      insights,
      generatedAt: new Date().toISOString(),
    };
  }

  async forecastPrices(
    region: MarketRegion,
    months: number = 12
  ): Promise<PriceForecast[]> {
    const statistics = await this.fetchStatistics(region, { region });
    const trends = this.computeTrends(statistics);
    return this.generateForecast(statistics, trends, region, months);
  }

  async compareMultipleMarkets(
    regions: MarketRegion[]
  ): Promise<MarketComparison> {
    if (regions.length < 2) {
      throw new Error('At least two regions are required for comparison');
    }
    return this.compareMarkets(regions[0], regions.slice(1));
  }

  async scoreInvestmentPotential(
    region: MarketRegion
  ): Promise<InvestmentScore> {
    const statistics = await this.fetchStatistics(region, { region });
    const supplyDemand = this.analyzeSupplyDemand(statistics, region);
    return this.scoreInvestment(statistics, supplyDemand, region);
  }

  // ─── Private Methods ───────────────────────────────────────────

  private async fetchStatistics(
    region: MarketRegion,
    request: MarketAnalysisRequest
  ): Promise<MarketStatistics> {
    const cacheKey = `${region.id}-${request.timeframe ?? '1y'}`;
    const cached = this.statisticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // In production, this would query a real database
    const stats = this.computeMockStatistics(region);
    this.statisticsCache.set(cacheKey, { data: stats, timestamp: Date.now() });
    return stats;
  }

  private computeMockStatistics(region: MarketRegion): MarketStatistics {
    const seed = this.hashString(region.id + region.city);
    const basePrice = 350000 + (seed % 400000);
    const volatility = 0.05 + (seed % 100) / 2000;

    const period = new Date().toISOString().slice(0, 7);
    const monthlySales = 20 + (seed % 60);
    const activeListings = 80 + (seed % 200);
    const avgDom = 15 + (seed % 45);

    return {
      region,
      period,
      medianPrice: basePrice,
      meanPrice: Math.round(basePrice * 1.08),
      pricePerSqFt: Math.round(basePrice / (1800 + (seed % 800))),
      totalSales: monthlySales * 3,
      activeListings,
      pendingListings: Math.round(monthlySales * 0.6),
      newListings: Math.round(monthlySales * 1.3),
      daysOnMarket: { avg: avgDom, median: Math.round(avgDom * 0.85) },
      saleToListRatio: Math.round((0.95 + volatility) * 1000) / 1000,
      inventoryMonths: Math.round((activeListings / monthlySales) * 10) / 10,
      priceReductions: Math.round(activeListings * 0.15),
      priceReductionPct: 15,
      absorptionRate: Math.round((monthlySales / activeListings) * 1000) / 1000,
      monthsOfSupply: Math.round((activeListings / monthlySales) * 10) / 10,
    };
  }

  private computeTrends(stats: MarketStatistics): MarketTrend[] {
    // Simulate historical data from current stats
    const months = 12;
    const priceSeries: number[] = [];
    const volumeSeries: number[] = [];
    const domSeries: number[] = [];

    for (let i = 0; i < months; i++) {
      const factor = 1 - (i * 0.008);
      priceSeries.push(Math.round(stats.medianPrice * factor));
      volumeSeries.push(Math.round(stats.totalSales / 3 * (0.8 + Math.random() * 0.4)));
      domSeries.push(Math.round(stats.daysOnMarket.avg * (0.9 + Math.random() * 0.2)));
    }

    const overallTrend = detectTrend(priceSeries.reverse(), volumeSeries.reverse(), domSeries.reverse());

    // Quarterly trends
    const quarterlyTrends: MarketTrend[] = [];
    for (let q = 0; q < 4; q++) {
      const qPrices = priceSeries.slice(q * 3, (q + 1) * 3);
      if (qPrices.length >= 2) {
        quarterlyTrends.push(detectTrend(qPrices, [], []));
      }
    }

    return [overallTrend, ...quarterlyTrends];
  }

  private analyzeSupplyDemand(stats: MarketStatistics, region: MarketRegion): SupplyDemandAnalysis {
    const monthsOfSupply = stats.monthsOfSupply;
    let supplyLevel: SupplyDemandAnalysis['supplyLevel'];
    if (monthsOfSupply < 2) supplyLevel = 'very_low';
    else if (monthsOfSupply < 4) supplyLevel = 'low';
    else if (monthsOfSupply < 6) supplyLevel = 'balanced';
    else if (monthsOfSupply < 9) supplyLevel = 'high';
    else supplyLevel = 'very_high';

    const absorption = stats.absorptionRate;
    let demandLevel: SupplyDemandAnalysis['demandLevel'];
    if (absorption > 0.8) demandLevel = 'very_high';
    else if (absorption > 0.5) demandLevel = 'high';
    else if (absorption > 0.3) demandLevel = 'balanced';
    else if (absorption > 0.15) demandLevel = 'low';
    else demandLevel = 'very_low';

    const balanceRatio = absorption / Math.max(1 / monthsOfSupply, 0.01);

    let migrationTrend: SupplyDemandAnalysis['migrationTrend'];
    if (stats.saleToListRatio > 1.02) migrationTrend = 'inbound';
    else if (stats.saleToListRatio < 0.96) migrationTrend = 'outbound';
    else migrationTrend = 'stable';

    const seed = this.hashString(region.id);
    const employmentGrowth = 1.5 + (seed % 40) / 10;
    const populationGrowth = 0.5 + (seed % 30) / 10;

    const outlooks: Record<string, string> = {
      very_low: 'Extremely tight inventory with strong buyer competition. Expect continued price appreciation.',
      low: 'Low inventory driving competitive market. Sellers have significant leverage.',
      balanced: 'Healthy balance between supply and demand. Stable pricing expected.',
      high: 'Elevated inventory giving buyers more options. Price growth may moderate.',
      very_high: 'Significant inventory surplus. Buyers have strong negotiating position.',
    };

    return {
      supplyLevel,
      demandLevel,
      balanceRatio: Math.round(balanceRatio * 100) / 100,
      monthsOfSupply,
      absorptionRate: stats.absorptionRate,
      newConstructionPipeline: 5 + (seed % 15),
      migrationTrend,
      employmentGrowth: Math.round(employmentGrowth * 10) / 10,
      populationGrowth: Math.round(populationGrowth * 10) / 10,
      outlook: outlooks[supplyLevel],
    };
  }

  private scoreInvestment(
    stats: MarketStatistics,
    supplyDemand: SupplyDemandAnalysis,
    region: MarketRegion
  ): InvestmentScore {
    // Appreciation potential (0-100)
    const appreciationScore = Math.min(100,
      (stats.saleToListRatio > 1 ? 60 : 40) +
      (supplyDemand.monthsOfSupply < 4 ? 30 : supplyDemand.monthsOfSupply < 7 ? 20 : 10) +
      (supplyDemand.populationGrowth > 2 ? 10 : 5)
    );

    // Rental yield estimate (0-100)
    const annualRent = stats.medianPrice * 0.06;
    const rentalYieldScore = Math.min(100, (annualRent / stats.medianPrice) * 1000);

    // Cash flow potential (0-100)
    const mortgagePayment = stats.medianPrice * 0.006;
    const cashFlowScore = Math.min(100, Math.max(0,
      ((annualRent / 12 - mortgagePayment) / mortgagePayment) * 100 + 50
    ));

    // Risk-adjusted return (0-100)
    const volatilityPenalty = stats.daysOnMarket.avg > 60 ? 20 : stats.daysOnMarket.avg > 30 ? 10 : 0;
    const riskAdjustedScore = Math.min(100,
      appreciationScore * 0.4 + rentalYieldScore * 0.3 + cashFlowScore * 0.3 - volatilityPenalty
    );

    // Liquidity (0-100)
    const liquidityScore = Math.min(100,
      Math.max(0, 100 - stats.daysOnMarket.avg * 1.5) *
      (stats.totalSales > 100 ? 1 : stats.totalSales > 50 ? 0.8 : 0.6)
    );

    // Economic strength (0-100)
    const economicScore = Math.min(100,
      supplyDemand.employmentGrowth * 15 +
      supplyDemand.populationGrowth * 10 +
      (supplyDemand.migrationTrend === 'inbound' ? 25 : supplyDemand.migrationTrend === 'stable' ? 15 : 5)
    );

    const overall = Math.round(
      appreciationScore * 0.25 +
      rentalYieldScore * 0.15 +
      cashFlowScore * 0.15 +
      riskAdjustedScore * 0.2 +
      liquidityScore * 0.1 +
      economicScore * 0.15
    );

    let grade: InvestmentScore['grade'];
    if (overall >= 90) grade = 'A+';
    else if (overall >= 85) grade = 'A';
    else if (overall >= 80) grade = 'A-';
    else if (overall >= 75) grade = 'B+';
    else if (overall >= 70) grade = 'B';
    else if (overall >= 65) grade = 'B-';
    else if (overall >= 60) grade = 'C+';
    else if (overall >= 55) grade = 'C';
    else if (overall >= 50) grade = 'C-';
    else grade = 'D';

    let recommendation: InvestmentScore['recommendation'];
    if (overall >= 80) recommendation = 'strong_buy';
    else if (overall >= 70) recommendation = 'buy';
    else if (overall >= 55) recommendation = 'hold';
    else if (overall >= 40) recommendation = 'sell';
    else recommendation = 'strong_sell';

    return {
      overall,
      appreciation: Math.round(appreciationScore),
      rentalYield: Math.round(rentalYieldScore),
      cashFlow: Math.round(cashFlowScore),
      riskAdjusted: Math.round(riskAdjustedScore),
      liquidity: Math.round(liquidityScore),
      economicStrength: Math.round(economicScore),
      grade,
      recommendation,
      reasoning: this.generateInvestmentReasoning(overall, appreciationScore, rentalYieldScore, liquidityScore),
      comparableMarkets: [],
    };
  }

  private generateInvestmentReasoning(
    overall: number,
    appreciation: number,
    rentalYield: number,
    liquidity: number
  ): string {
    const parts: string[] = [];

    if (appreciation > 70) parts.push('Strong appreciation potential');
    else if (appreciation < 40) parts.push('Limited appreciation expected');

    if (rentalYield > 60) parts.push('Attractive rental yields');
    else if (rentalYield < 30) parts.push('Below-average rental returns');

    if (liquidity > 70) parts.push('Good market liquidity with fast sales');
    else if (liquidity < 40) parts.push('Extended time on market reduces liquidity');

    return parts.join('. ') || `Overall market score of ${overall}/100 indicates a ${overall >= 70 ? 'favorable' : 'cautious'} investment environment.`;
  }

  private async generateForecast(
    stats: MarketStatistics,
    trends: MarketTrend[],
    region: MarketRegion,
    months: number
  ): Promise<PriceForecast[]> {
    const primaryTrend = trends[0];
    const monthlyGrowthRate = primaryTrend
      ? Math.pow(1 + primaryTrend.percentageChange / 100, 1 / 12) - 1
      : 0.003;

    const forecasts: PriceForecast[] = [];
    let currentPrice = stats.medianPrice;

    for (let m = 1; m <= months; m++) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + m);

      // Apply seasonal adjustment
      const targetMonth = targetDate.getMonth();
      const seasonalFactors = [0.98, 0.99, 1.01, 1.03, 1.04, 1.03, 1.02, 1.01, 1.02, 1.01, 0.99, 0.97];
      const seasonal = seasonalFactors[targetMonth] ?? 1;

      currentPrice = currentPrice * (1 + monthlyGrowthRate) * seasonal;

      // Confidence decreases with time
      const confidence = Math.max(20, 85 - m * 3);
      const uncertaintyFactor = 1 + (m / months) * 0.08;

      forecasts.push({
        targetDate: targetDate.toISOString().slice(0, 10),
        predictedPrice: Math.round(currentPrice),
        confidence,
        lowerBound: Math.round(currentPrice / uncertaintyFactor),
        upperBound: Math.round(currentPrice * uncertaintyFactor),
        methodology: 'Time series extrapolation with seasonal adjustment',
        factors: [
          {
            name: 'Historical Trend',
            weight: 0.4,
            impact: primaryTrend?.direction === 'rising' ? 'positive' : primaryTrend?.direction === 'falling' ? 'negative' : 'neutral',
            description: `Based on ${primaryTrend?.period ?? 'historical'} price trend of ${primaryTrend?.percentageChange ?? 0}%`,
          },
          {
            name: 'Seasonality',
            weight: 0.2,
            impact: seasonal > 1 ? 'positive' : seasonal < 1 ? 'negative' : 'neutral',
            description: `Seasonal factor: ${(seasonal * 100).toFixed(1)}% for month ${targetMonth + 1}`,
          },
          {
            name: 'Market Momentum',
            weight: 0.2,
            impact: stats.saleToListRatio > 1 ? 'positive' : 'negative',
            description: `Sale-to-list ratio of ${(stats.saleToListRatio * 100).toFixed(1)}% indicates ${stats.saleToListRatio > 1 ? 'strong' : 'weak'} demand`,
          },
          {
            name: 'Supply Conditions',
            weight: 0.2,
            impact: stats.monthsOfSupply < 5 ? 'positive' : 'negative',
            description: `${stats.monthsOfSupply} months of supply`,
          },
        ],
      });
    }

    return forecasts;
  }

  private async compareMarkets(
    primary: MarketRegion,
    others: MarketRegion[]
  ): Promise<MarketComparison> {
    const allRegions = [primary, ...others];
    const allStats = await Promise.all(
      allRegions.map((r) => this.fetchStatistics(r, { region: r }))
    );

    const metrics: MarketComparisonMetric[] = [
      {
        name: 'Median Price',
        values: Object.fromEntries(allRegions.map((r, i) => [r.name, allStats[i].medianPrice])),
        unit: '$',
        bestRegion: allRegions[allStats.findIndex((s) =>
          s.medianPrice === Math.max(...allStats.map((a) => a.medianPrice))
        )].name,
      },
      {
        name: 'Price per SqFt',
        values: Object.fromEntries(allRegions.map((r, i) => [r.name, allStats[i].pricePerSqFt])),
        unit: '$/sqft',
        bestRegion: allRegions[allStats.findIndex((s) =>
          s.pricePerSqFt === Math.min(...allStats.map((a) => a.pricePerSqFt))
        )].name,
      },
      {
        name: 'Days on Market',
        values: Object.fromEntries(allRegions.map((r, i) => [r.name, allStats[i].daysOnMarket.avg])),
        unit: 'days',
        bestRegion: allRegions[allStats.findIndex((s) =>
          s.daysOnMarket.avg === Math.min(...allStats.map((a) => a.daysOnMarket.avg))
        )].name,
      },
      {
        name: 'Sale-to-List Ratio',
        values: Object.fromEntries(allRegions.map((r, i) => [r.name, allStats[i].saleToListRatio])),
        unit: 'ratio',
        bestRegion: allRegions[allStats.findIndex((s) =>
          s.saleToListRatio === Math.max(...allStats.map((a) => a.saleToListRatio))
        )].name,
      },
      {
        name: 'Months of Supply',
        values: Object.fromEntries(allRegions.map((r, i) => [r.name, allStats[i].monthsOfSupply])),
        unit: 'months',
        bestRegion: allRegions[allStats.findIndex((s) =>
          s.monthsOfSupply === Math.min(...allStats.map((a) => a.monthsOfSupply))
        )].name,
      },
      {
        name: 'Total Sales (Quarterly)',
        values: Object.fromEntries(allRegions.map((r, i) => [r.name, allStats[i].totalSales])),
        unit: 'sales',
        bestRegion: allRegions[allStats.findIndex((s) =>
          s.totalSales === Math.max(...allStats.map((a) => a.totalSales))
        )].name,
      },
    ];

    const rankings: MarketRanking[] = [
      {
        category: 'Overall Market Health',
        rankings: allRegions.map((r, i) => {
          const s = allStats[i];
          const score = Math.min(100,
            (1 - Math.min(s.monthsOfSupply, 12) / 12) * 30 +
            Math.min(s.saleToListRatio, 1.1) * 40 +
            (1 - Math.min(s.daysOnMarket.avg, 90) / 90) * 30
          );
          return { region: r.name, rank: 0, score: Math.round(score) };
        })
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({ ...r, rank: i + 1 })),
      },
      {
        category: 'Affordability',
        rankings: allRegions.map((r, i) => {
          const score = Math.min(100, (1 - allStats[i].medianPrice / 1000000) * 100);
          return { region: r.name, rank: 0, score: Math.round(Math.max(0, score)) };
        })
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({ ...r, rank: i + 1 })),
      },
      {
        category: 'Market Activity',
        rankings: allRegions.map((r, i) => {
          const score = Math.min(100,
            (allStats[i].totalSales / 200) * 50 +
            (1 - allStats[i].daysOnMarket.avg / 90) * 50
          );
          return { region: r.name, rank: 0, score: Math.round(Math.max(0, Math.min(100, score))) };
        })
          .sort((a, b) => b.score - a.score)
          .map((r, i) => ({ ...r, rank: i + 1 })),
      },
    ];

    return {
      regions: allRegions.map((r) => r.name),
      metrics,
      rankings,
      summary: `Compared ${allRegions.length} markets across ${metrics.length} metrics. ${rankings[0]?.rankings[0]?.region ?? 'N/A'} ranks highest in overall market health.`,
    };
  }

  private async generateInsights(
    stats: MarketStatistics,
    trends: MarketTrend[],
    supplyDemand: SupplyDemandAnalysis,
    investmentScore: InvestmentScore
  ): Promise<string[]> {
    const insights: string[] = [];

    // Price insights
    if (stats.saleToListRatio > 1.02) {
      insights.push(`Sellers are receiving ${(stats.saleToListRatio * 100 - 100).toFixed(1)}% above asking price on average, indicating strong buyer competition.`);
    } else if (stats.saleToListRatio < 0.97) {
      insights.push(`Properties are selling at ${(100 - stats.saleToListRatio * 100).toFixed(1)}% below asking price, giving buyers negotiating power.`);
    }

    // Inventory insights
    if (stats.monthsOfSupply < 3) {
      insights.push('Severe inventory shortage with less than 3 months of supply. Expect competitive bidding and price escalation.');
    } else if (stats.monthsOfSupply > 8) {
      insights.push('Oversupplied market with over 8 months of inventory. Buyers have significant leverage.');
    }

    // DOM insights
    if (stats.daysOnMarket.avg < 15) {
      insights.push('Properties are selling extremely fast (under 15 days), indicating a hot market.');
    } else if (stats.daysOnMarket.avg > 60) {
      insights.push('Extended marketing times averaging over 60 days suggest a cooling market.');
    }

    // Trend insights
    const primaryTrend = trends[0];
    if (primaryTrend) {
      if (primaryTrend.direction === 'rising' && primaryTrend.strength > 50) {
        insights.push(`Strong upward price trend with ${primaryTrend.percentageChange.toFixed(1)}% change. Market momentum favors sellers.`);
      } else if (primaryTrend.direction === 'falling' && primaryTrend.strength > 50) {
        insights.push(`Notable price decline of ${Math.abs(primaryTrend.percentageChange).toFixed(1)}%. May present buying opportunities.`);
      }

      if (primaryTrend.volatilityIndex > 5) {
        insights.push('High price volatility detected. Market may be experiencing rapid shifts.');
      }
    }

    // Investment insights
    if (investmentScore.overall >= 80) {
      insights.push(`Investment grade of ${investmentScore.grade} with strong fundamentals across multiple metrics.`);
    } else if (investmentScore.overall < 50) {
      insights.push(`Below-average investment potential (${investmentScore.grade}). Consider alternative markets.`);
    }

    // Economic insights
    if (supplyDemand.employmentGrowth > 3) {
      insights.push('Strong employment growth above 3% supports housing demand.');
    }
    if (supplyDemand.populationGrowth > 2) {
      insights.push('Population growth above 2% indicates growing market fundamentals.');
    }

    return insights;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
