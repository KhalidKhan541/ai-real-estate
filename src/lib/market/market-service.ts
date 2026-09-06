/**
 * Market data service for real estate analytics.
 * Provides market statistics, price trends, days on market,
 * and sale-to-list ratio calculations.
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface MarketDataConfig {
  cacheTimeout: number;
  defaultRegion: string;
  historicalDepth: number;
}

export interface MarketQuery {
  region: string;
  propertyType?: string;
  priceRange?: { min: number; max: number };
  startDate?: string;
  endDate?: string;
  granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface MarketDataPoint {
  date: string;
  medianPrice: number;
  meanPrice: number;
  pricePerSqFt: number;
  salesCount: number;
  newListings: number;
  activeListings: number;
  pendingSales: number;
  daysOnMarket: number;
  saleToListRatio: number;
  inventoryMonths: number;
  priceReductions: number;
}

export interface MarketStatisticsResponse {
  region: string;
  period: string;
  summary: MarketSummary;
  trends: MarketTrendData;
  distribution: PriceDistribution;
  competitiveMetrics: CompetitiveMetrics;
  generatedAt: string;
}

export interface MarketSummary {
  medianPrice: number;
  meanPrice: number;
  pricePerSqFt: number;
  totalSales: number;
  totalVolume: number;
  activeListings: number;
  newListings: number;
  pendingSales: number;
  averageDaysOnMarket: number;
  medianDaysOnMarket: number;
  saleToListRatio: number;
  monthsOfSupply: number;
  absorptionRate: number;
}

export interface MarketTrendData {
  priceTrend: TrendLine;
  volumeTrend: TrendLine;
  domTrend: TrendLine;
  inventoryTrend: TrendLine;
  momentum: MomentumIndicator;
  seasonality: SeasonalityPattern;
}

export interface TrendLine {
  direction: 'rising' | 'falling' | 'stable';
  slope: number;
  rSquared: number;
  percentChange1M: number;
  percentChange3M: number;
  percentChange6M: number;
  percentChange1Y: number;
  percentChange3Y: number;
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MomentumIndicator {
  score: number;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  macd: number;
  signalLine: number;
  histogram: number;
  description: string;
}

export interface SeasonalityPattern {
  monthlyPattern: MonthPattern[];
  peakMonth: string;
  troughMonth: string;
  currentSeason: 'peak' | 'off_peak' | 'transition';
  seasonalAdjustment: number;
}

export interface MonthPattern {
  month: string;
  adjustmentFactor: number;
  averageSales: number;
  averagePrice: number;
}

export interface PriceDistribution {
  brackets: PriceBracket[];
  skewness: number;
  concentrationIndex: number;
}

export interface PriceBracket {
  range: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface CompetitiveMetrics {
  competitionIndex: number;
  averageOffersPerListing: number;
  listPriceVariance: number;
  sellerConcessions: number;
  contingencyWaivers: number;
  escalationCluses: number;
  timeToOffer: number;
}

export interface PriceTrendRequest {
  region: string;
  propertyType?: string;
  periods: number;
  granularity: 'monthly' | 'quarterly' | 'yearly';
}

export interface PriceTrendResponse {
  region: string;
  data: PriceTrendDataPoint[];
  statistics: PriceTrendStatistics;
  forecast: PriceTrendForecast[];
}

export interface PriceTrendDataPoint {
  period: string;
  medianPrice: number;
  volume: number;
  pricePerSqFt: number;
  yearOverYearChange: number;
  monthOverMonthChange: number;
}

export interface PriceTrendStatistics {
  averagePrice: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  maxPrice: number;
  minPrice: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
}

export interface PriceTrendForecast {
  period: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface DaysOnMarketRequest {
  region: string;
  propertyType?: string;
  priceRange?: { min: number; max: number };
  periods?: number;
}

export interface DaysOnMarketResponse {
  region: string;
  current: DOMCurrentMetrics;
  historical: DOMHistoricalData[];
  percentiles: DOMPercentile[];
  insights: string[];
}

export interface DOMCurrentMetrics {
  average: number;
  median: number;
  mode: number;
  standardDeviation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  currentVsHistorical: number;
}

export interface DOMHistoricalData {
  period: string;
  average: number;
  median: number;
  salesCount: number;
}

export interface DOMPercentile {
  percentile: number;
  days: number;
  description: string;
}

export interface SaleToListRequest {
  region: string;
  propertyType?: string;
  periods?: number;
}

export interface SaleToListResponse {
  region: string;
  current: SaleToListCurrentMetrics;
  historical: SaleToListHistoricalData[];
  byPriceRange: SaleToListByPrice[];
  byPropertyType: SaleToListByType[];
  insights: string[];
}

export interface SaleToListCurrentMetrics {
  average: number;
  median: number;
  standardDeviation: number;
  overAskingPercentage: number;
  underAskingPercentage: number;
  atAskingPercentage: number;
  averageConcession: number;
}

export interface SaleToListHistoricalData {
  period: string;
  average: number;
  median: number;
  salesCount: number;
}

export interface SaleToListByPrice {
  range: string;
  saleToListRatio: number;
  sampleSize: number;
}

export interface SaleToListByType {
  type: string;
  saleToListRatio: number;
  sampleSize: number;
}

// ─── Market Service ────────────────────────────────────────────────

export class MarketService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: MarketDataConfig;

  constructor(config: Partial<MarketDataConfig> = {}) {
    this.config = {
      cacheTimeout: config.cacheTimeout ?? 30 * 60 * 1000,
      defaultRegion: config.defaultRegion ?? 'national',
      historicalDepth: config.historicalDepth ?? 36,
    };
  }

  async getMarketStatistics(query: MarketQuery): Promise<MarketStatisticsResponse> {
    const cacheKey = `stats-${query.region}-${query.propertyType ?? 'all'}-${query.granularity ?? 'monthly'}`;
    const cached = this.getFromCache<MarketStatisticsResponse>(cacheKey);
    if (cached) return cached;

    const dataPoints = this.generateHistoricalData(query);
    const summary = this.computeSummary(dataPoints, query);
    const trends = this.computeTrends(dataPoints);
    const distribution = this.computeDistribution(dataPoints, query);
    const competitiveMetrics = this.computeCompetitiveMetrics(query);

    const result: MarketStatisticsResponse = {
      region: query.region,
      period: new Date().toISOString().slice(0, 7),
      summary,
      trends,
      distribution,
      competitiveMetrics,
      generatedAt: new Date().toISOString(),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getPriceTrends(request: PriceTrendRequest): Promise<PriceTrendResponse> {
    const cacheKey = `trends-${request.region}-${request.granularity}-${request.periods}`;
    const cached = this.getFromCache<PriceTrendResponse>(cacheKey);
    if (cached) return cached;

    const dataPoints = this.generatePriceTrendData(request);
    const statistics = this.computePriceTrendStatistics(dataPoints);
    const forecast = this.generatePriceForecast(dataPoints, 6);

    const result: PriceTrendResponse = {
      region: request.region,
      data: dataPoints,
      statistics,
      forecast,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getDaysOnMarket(request: DaysOnMarketRequest): Promise<DaysOnMarketResponse> {
    const cacheKey = `dom-${request.region}-${request.propertyType ?? 'all'}`;
    const cached = this.getFromCache<DaysOnMarketResponse>(cacheKey);
    if (cached) return cached;

    const historical = this.generateDOMHistoricalData(request);
    const current = this.computeCurrentDOM(historical);
    const percentiles = this.computeDOMPercentiles(request);
    const insights = this.generateDOMInsights(current, historical);

    const result: DaysOnMarketResponse = {
      region: request.region,
      current,
      historical,
      percentiles,
      insights,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getSaleToListRatio(request: SaleToListRequest): Promise<SaleToListResponse> {
    const cacheKey = `stlr-${request.region}-${request.propertyType ?? 'all'}`;
    const cached = this.getFromCache<SaleToListResponse>(cacheKey);
    if (cached) return cached;

    const historical = this.generateSTLHistoricalData(request);
    const current = this.computeCurrentSTL(historical);
    const byPriceRange = this.computeSTLByPriceRange(request);
    const byPropertyType = this.computeSTLByPropertyType(request);
    const insights = this.generateSTLInsights(current);

    const result: SaleToListResponse = {
      region: request.region,
      current,
      historical,
      byPriceRange,
      byPropertyType,
      insights,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getMarketHealthScore(region: string): Promise<{
    score: number;
    grade: string;
    components: Array<{ name: string; score: number; weight: number; description: string }>;
    recommendation: string;
  }> {
    const stats = await this.getMarketStatistics({ region });
    const dom = await this.getDaysOnMarket({ region });
    const stl = await this.getSaleToListRatio({ region });

    const components = [
      {
        name: 'Inventory Health',
        score: Math.min(100, Math.max(0, (1 - stats.summary.monthsOfSupply / 12) * 100)),
        weight: 0.25,
        description: `${stats.summary.monthsOfSupply} months of supply`,
      },
      {
        name: 'Price Stability',
        score: Math.min(100, Math.max(0, 100 - Math.abs(stats.trends.priceTrend.percentChange1Y) * 5)),
        weight: 0.2,
        description: `${stats.trends.priceTrend.percentChange1Y > 0 ? '+' : ''}${stats.trends.priceTrend.percentChange1Y}% year-over-year`,
      },
      {
        name: 'Market Velocity',
        score: Math.min(100, Math.max(0, (1 - dom.current.average / 90) * 100)),
        weight: 0.2,
        description: `${dom.current.average} average days on market`,
      },
      {
        name: 'Competition Level',
        score: Math.min(100, Math.max(0, stl.current.average * 100)),
        weight: 0.15,
        description: `${(stl.current.average * 100).toFixed(1)}% sale-to-list ratio`,
      },
      {
        name: 'Transaction Volume',
        score: Math.min(100, Math.max(0, (stats.summary.totalSales / 100) * 100)),
        weight: 0.1,
        description: `${stats.summary.totalSales} sales in period`,
      },
      {
        name: 'Absorption Rate',
        score: Math.min(100, Math.max(0, stats.summary.absorptionRate * 100)),
        weight: 0.1,
        description: `${(stats.summary.absorptionRate * 100).toFixed(1)}% absorption rate`,
      },
    ];

    const totalScore = Math.round(
      components.reduce((sum, c) => sum + c.score * c.weight, 0)
    );

    let grade: string;
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 80) grade = 'A-';
    else if (totalScore >= 75) grade = 'B+';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 65) grade = 'B-';
    else if (totalScore >= 60) grade = 'C+';
    else if (totalScore >= 55) grade = 'C';
    else if (totalScore >= 50) grade = 'C-';
    else grade = 'D';

    const recommendation = totalScore >= 80
      ? 'Strong market conditions favorable for sellers. Buyers should act quickly.'
      : totalScore >= 60
        ? 'Balanced market conditions. Good time for both buyers and sellers.'
        : 'Weak market conditions favoring buyers. Sellers should price competitively.';

    return { score: totalScore, grade, components, recommendation };
  }

  // ─── Data Generation ──────────────────────────────────────────

  private generateHistoricalData(query: MarketQuery): MarketDataPoint[] {
    const seed = this.hashString(query.region + (query.propertyType ?? ''));
    const basePrice = 350000 + (seed % 400000);
    const months = this.config.historicalDepth;
    const dataPoints: MarketDataPoint[] = [];

    let currentPrice = basePrice * 0.92;
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));
      const period = date.toISOString().slice(0, 7);

      // Simulate price trend with seasonality
      const monthIdx = date.getMonth();
      const seasonalFactor = [0.98, 0.99, 1.01, 1.03, 1.04, 1.03, 1.02, 1.01, 1.02, 1.01, 0.99, 0.97][monthIdx];
      const trendFactor = 1 + 0.003 + (seed % 100 - 50) / 10000;
      currentPrice = currentPrice * trendFactor * seasonalFactor;

      const salesVolume = 20 + (seed % 40) + Math.round(Math.sin(i * 0.5) * 10);
      const dom = 20 + (seed % 30) + Math.round(Math.cos(i * 0.3) * 5);
      const stlr = 0.96 + (seed % 50) / 1000 + Math.sin(i * 0.4) * 0.02;

      dataPoints.push({
        date: period,
        medianPrice: Math.round(currentPrice),
        meanPrice: Math.round(currentPrice * 1.08),
        pricePerSqFt: Math.round(currentPrice / (1800 + (seed % 600))),
        salesCount: Math.max(5, salesVolume),
        newListings: Math.round(salesVolume * 1.3),
        activeListings: Math.round(salesVolume * 3.5),
        pendingSales: Math.round(salesVolume * 0.6),
        daysOnMarket: Math.max(5, dom),
        saleToListRatio: Math.round(stlr * 1000) / 1000,
        inventoryMonths: Math.round((salesVolume * 3.5 / salesVolume) * 10) / 10,
        priceReductions: Math.round(salesVolume * 0.15),
      });
    }

    return dataPoints;
  }

  private computeSummary(dataPoints: MarketDataPoint[], query: MarketQuery): MarketSummary {
    const latest = dataPoints[dataPoints.length - 1];
    const totalSales = dataPoints.reduce((sum, d) => sum + d.salesCount, 0);
    const totalVolume = dataPoints.reduce((sum, d) => sum + d.salesCount * d.medianPrice, 0);
    const avgDom = Math.round(dataPoints.reduce((sum, d) => sum + d.daysOnMarket, 0) / dataPoints.length);
    const medianDom = this.getMedian(dataPoints.map((d) => d.daysOnMarket));

    return {
      medianPrice: latest.medianPrice,
      meanPrice: latest.meanPrice,
      pricePerSqFt: latest.pricePerSqFt,
      totalSales,
      totalVolume,
      activeListings: latest.activeListings,
      newListings: latest.newListings,
      pendingSales: latest.pendingSales,
      averageDaysOnMarket: avgDom,
      medianDaysOnMarket: medianDom,
      saleToListRatio: latest.saleToListRatio,
      monthsOfSupply: latest.inventoryMonths,
      absorptionRate: Math.round((latest.salesCount / Math.max(latest.activeListings, 1)) * 1000) / 1000,
    };
  }

  private computeTrends(dataPoints: MarketDataPoint[]): MarketTrendData {
    const prices = dataPoints.map((d) => d.medianPrice);
    const volumes = dataPoints.map((d) => d.salesCount);
    const doms = dataPoints.map((d) => d.daysOnMarket);
    const inventories = dataPoints.map((d) => d.inventoryMonths);

    return {
      priceTrend: this.computeTrendLine(prices, 'price'),
      volumeTrend: this.computeTrendLine(volumes, 'volume'),
      domTrend: this.computeTrendLine(doms, 'dom'),
      inventoryTrend: this.computeTrendLine(inventories, 'inventory'),
      momentum: this.computeMomentum(prices),
      seasonality: this.computeSeasonality(dataPoints),
    };
  }

  private computeTrendLine(data: number[], _type: string): TrendLine {
    const n = data.length;
    if (n < 2) {
      return { direction: 'stable', slope: 0, rSquared: 0, percentChange1M: 0, percentChange3M: 0, percentChange6M: 0, percentChange1Y: 0, percentChange3Y: 0, dataPoints: [] };
    }

    // Linear regression
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (data[i] - yMean);
      den += (i - xMean) * (i - xMean);
    }
    const slope = den !== 0 ? num / den : 0;

    // R-squared
    const predicted = data.map((_, i) => yMean + slope * (i - xMean));
    const ssRes = data.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    const ssTot = data.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // Direction
    const normalizedSlope = yMean !== 0 ? slope / yMean : 0;
    let direction: TrendLine['direction'];
    if (Math.abs(normalizedSlope) < 0.001) direction = 'stable';
    else if (normalizedSlope > 0) direction = 'rising';
    else direction = 'falling';

    // Period changes
    const pctChange = (periods: number) => {
      if (n <= periods) return 0;
      return ((data[n - 1] - data[n - 1 - periods]) / Math.max(data[n - 1 - periods], 1)) * 100;
    };

    // Data points for chart
    const last12 = data.slice(-12);
    const dataPoints: TrendDataPoint[] = last12.map((value, i) => {
      const prev = i > 0 ? last12[i - 1] : value;
      const change = value - prev;
      const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
      return {
        period: `T-${last12.length - i}`,
        value,
        change: Math.round(change),
        changePercent: Math.round(changePercent * 100) / 100,
      };
    });

    return {
      direction,
      slope: Math.round(slope * 100) / 100,
      rSquared: Math.round(rSquared * 1000) / 1000,
      percentChange1M: Math.round(pctChange(1) * 100) / 100,
      percentChange3M: Math.round(pctChange(3) * 100) / 100,
      percentChange6M: Math.round(pctChange(6) * 100) / 100,
      percentChange1Y: Math.round(pctChange(12) * 100) / 100,
      percentChange3Y: Math.round(pctChange(36) * 100) / 100,
      dataPoints,
    };
  }

  private computeMomentum(prices: number[]): MomentumIndicator {
    if (prices.length < 26) {
      return { score: 50, signal: 'neutral', macd: 0, signalLine: 0, histogram: 0, description: 'Insufficient data for momentum analysis' };
    }

    // Simplified MACD calculation
    const ema12 = this.computeEMA(prices, 12);
    const ema26 = this.computeEMA(prices, 26);
    const macd = ema12 - ema26;
    const signalLine = macd * 0.8;
    const histogram = macd - signalLine;

    const score = Math.min(100, Math.max(0, 50 + histogram / Math.max(Math.abs(ema26), 1) * 500));

    let signal: MomentumIndicator['signal'];
    if (score >= 80) signal = 'strong_buy';
    else if (score >= 60) signal = 'buy';
    else if (score >= 40) signal = 'neutral';
    else if (score >= 20) signal = 'sell';
    else signal = 'strong_sell';

    return {
      score: Math.round(score),
      signal,
      macd: Math.round(macd * 100) / 100,
      signalLine: Math.round(signalLine * 100) / 100,
      histogram: Math.round(histogram * 100) / 100,
      description: `MACD ${histogram > 0 ? 'above' : 'below'} signal line indicating ${histogram > 0 ? 'bullish' : 'bearish'} momentum`,
    };
  }

  private computeEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  private computeSeasonality(dataPoints: MarketDataPoint[]): SeasonalityPattern {
    const monthlyData: Record<number, { sales: number[]; prices: number[] }> = {};

    for (const dp of dataPoints) {
      const month = new Date(dp.date + '-01').getMonth();
      if (!monthlyData[month]) monthlyData[month] = { sales: [], prices: [] };
      monthlyData[month].sales.push(dp.salesCount);
      monthlyData[month].prices.push(dp.medianPrice);
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyPattern: MonthPattern[] = months.map((month, i) => {
      const data = monthlyData[i];
      const avgSales = data ? data.sales.reduce((a, b) => a + b, 0) / data.sales.length : 0;
      const avgPrice = data ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length : 0;
      return { month, adjustmentFactor: 1, averageSales: Math.round(avgSales), averagePrice: Math.round(avgPrice) };
    });

    // Normalize adjustment factors
    const overallAvgSales = monthlyPattern.reduce((s, p) => s + p.averageSales, 0) / 12;
    for (const p of monthlyPattern) {
      p.adjustmentFactor = overallAvgSales > 0 ? Math.round((p.averageSales / overallAvgSales) * 100) / 100 : 1;
    }

    const peakIdx = monthlyPattern.reduce((max, p, i, arr) => p.averageSales > arr[max].averageSales ? i : max, 0);
    const troughIdx = monthlyPattern.reduce((min, p, i, arr) => p.averageSales < arr[min].averageSales ? i : min, 0);

    const currentMonth = new Date().getMonth();
    const currentFactor = monthlyPattern[currentMonth].adjustmentFactor;
    let currentSeason: SeasonalityPattern['currentSeason'];
    if (currentFactor > 1.1) currentSeason = 'peak';
    else if (currentFactor < 0.9) currentSeason = 'off_peak';
    else currentSeason = 'transition';

    return {
      monthlyPattern,
      peakMonth: months[peakIdx],
      troughMonth: months[troughIdx],
      currentSeason,
      seasonalAdjustment: currentFactor,
    };
  }

  private computeDistribution(dataPoints: MarketDataPoint[], _query: MarketQuery): PriceDistribution {
    const latest = dataPoints[dataPoints.length - 1];
    const basePrice = latest.medianPrice;

    const brackets: PriceBracket[] = [
      { range: '< $200K', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '$200K-$300K', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '$300K-$400K', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '$400K-$500K', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '$500K-$750K', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '$750K-$1M', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '$1M-$2M', count: 0, percentage: 0, cumulativePercentage: 0 },
      { range: '>$2M', count: 0, percentage: 0, cumulativePercentage: 0 },
    ];

    // Simulate distribution centered around median
    const values = [0.08, 0.15, 0.25, 0.2, 0.15, 0.1, 0.05, 0.02];
    let cumulative = 0;

    for (let i = 0; i < brackets.length; i++) {
      const count = Math.round(latest.salesCount * values[i]);
      brackets[i].count = count;
      brackets[i].percentage = Math.round(values[i] * 100);
      cumulative += values[i];
      brackets[i].cumulativePercentage = Math.round(cumulative * 100);
    }

    return {
      brackets,
      skewness: 0.5,
      concentrationIndex: 0.65,
    };
  }

  private computeCompetitiveMetrics(_query: MarketQuery): CompetitiveMetrics {
    return {
      competitionIndex: 65,
      averageOffersPerListing: 2.3,
      listPriceVariance: 3.5,
      sellerConcessions: 2.1,
      contingencyWaivers: 18,
      escalationCluses: 8,
      timeToOffer: 12,
    };
  }

  private generatePriceTrendData(request: PriceTrendRequest): PriceTrendDataPoint[] {
    const seed = this.hashString(request.region);
    const basePrice = 350000 + (seed % 400000);
    const data: PriceTrendDataPoint[] = [];
    let currentPrice = basePrice * 0.9;

    for (let i = 0; i < request.periods; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (request.periods - i - 1));
      const period = date.toISOString().slice(0, 7);

      const growth = 0.002 + (seed % 60 - 30) / 10000;
      currentPrice = currentPrice * (1 + growth);

      const prevPrice = i > 0 ? data[i - 1].medianPrice : currentPrice;
      const yoyChange = prevPrice !== 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

      data.push({
        period,
        medianPrice: Math.round(currentPrice),
        volume: 15 + (seed % 30),
        pricePerSqFt: Math.round(currentPrice / (1800 + (seed % 600))),
        yearOverYearChange: Math.round(yoyChange * 100) / 100,
        monthOverMonthChange: Math.round(growth * 10000) / 100,
      });
    }

    return data;
  }

  private computePriceTrendStatistics(dataPoints: PriceTrendDataPoint[]): PriceTrendStatistics {
    const prices = dataPoints.map((d) => d.medianPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Max drawdown
    let peak = prices[0];
    let maxDrawdown = 0;
    for (const price of prices) {
      if (price > peak) peak = price;
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Returns for Sharpe ratio
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / Math.max(returns.length, 1);
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / Math.max(returns.length, 1);
    const returnStdDev = Math.sqrt(returnVariance);
    const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(12) : 0;

    return {
      averagePrice: Math.round(avg),
      standardDeviation: Math.round(stdDev),
      coefficientOfVariation: Math.round((stdDev / avg) * 1000) / 1000,
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices),
      maxDrawdown: Math.round(maxDrawdown * 1000) / 1000,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      volatility: Math.round(returnStdDev * Math.sqrt(12) * 1000) / 1000,
    };
  }

  private generatePriceForecast(dataPoints: PriceTrendDataPoint[], months: number): PriceTrendForecast[] {
    const prices = dataPoints.map((d) => d.medianPrice);
    const n = prices.length;
    const xMean = (n - 1) / 2;
    const yMean = prices.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (prices[i] - yMean);
      den += (i - xMean) * (i - xMean);
    }
    const slope = den !== 0 ? num / den : 0;

    const forecast: PriceTrendForecast[] = [];
    let lastPrice = prices[n - 1];

    for (let m = 1; m <= months; m++) {
      const predicted = lastPrice + slope;
      const uncertainty = 1 + m * 0.02;

      forecast.push({
        period: new Date(Date.now() + m * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        predicted: Math.round(predicted),
        lowerBound: Math.round(predicted / uncertainty),
        upperBound: Math.round(predicted * uncertainty),
        confidence: Math.max(30, 85 - m * 5),
      });

      lastPrice = predicted;
    }

    return forecast;
  }

  private generateDOMHistoricalData(request: DaysOnMarketRequest): DOMHistoricalData[] {
    const seed = this.hashString(request.region);
    const baseDom = 20 + (seed % 30);
    const data: DOMHistoricalData[] = [];

    for (let i = 0; i < (request.periods ?? 12); i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.unshift({
        period: date.toISOString().slice(0, 7),
        average: Math.round(baseDom + Math.sin(i * 0.5) * 8),
        median: Math.round(baseDom * 0.85 + Math.sin(i * 0.5) * 5),
        salesCount: 15 + (seed % 20),
      });
    }

    return data;
  }

  private computeCurrentDOM(historical: DOMHistoricalData[]): DOMCurrentMetrics {
    const latest = historical[historical.length - 1];
    const previous = historical.length > 1 ? historical[historical.length - 2] : latest;
    const avgDom = historical.reduce((s, h) => s + h.average, 0) / historical.length;

    let trend: DOMCurrentMetrics['trend'];
    if (latest.average < previous.average - 2) trend = 'decreasing';
    else if (latest.average > previous.average + 2) trend = 'increasing';
    else trend = 'stable';

    return {
      average: latest.average,
      median: latest.median,
      mode: Math.round(latest.average * 0.9),
      standardDeviation: Math.round(latest.average * 0.3),
      trend,
      currentVsHistorical: Math.round(((latest.average - avgDom) / avgDom) * 100),
    };
  }

  private computeDOMPercentiles(_request: DaysOnMarketRequest): DOMPercentile[] {
    return [
      { percentile: 10, days: 5, description: 'Top 10% sell within 5 days' },
      { percentile: 25, days: 12, description: '25% sell within 12 days' },
      { percentile: 50, days: 25, description: 'Median days on market' },
      { percentile: 75, days: 45, description: '75th percentile' },
      { percentile: 90, days: 75, description: '90th percentile' },
    ];
  }

  private generateDOMInsights(current: DOMCurrentMetrics, historical: DOMHistoricalData[]): string[] {
    const insights: string[] = [];

    if (current.trend === 'decreasing') {
      insights.push('Days on market are decreasing, indicating a strengthening market.');
    } else if (current.trend === 'increasing') {
      insights.push('Days on market are increasing, suggesting a cooling market.');
    }

    if (current.currentVsHistorical > 20) {
      insights.push(`Current DOM is ${current.currentVsHistorical}% above historical average.`);
    } else if (current.currentVsHistorical < -20) {
      insights.push(`Current DOM is ${Math.abs(current.currentVsHistorical)}% below historical average.`);
    }

    return insights;
  }

  private generateSTLHistoricalData(request: SaleToListRequest): SaleToListHistoricalData[] {
    const seed = this.hashString(request.region);
    const baseRatio = 0.96 + (seed % 50) / 1000;
    const data: SaleToListHistoricalData[] = [];

    for (let i = 0; i < (request.periods ?? 12); i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.unshift({
        period: date.toISOString().slice(0, 7),
        average: Math.round((baseRatio + Math.sin(i * 0.4) * 0.03) * 1000) / 1000,
        median: Math.round((baseRatio * 0.99 + Math.sin(i * 0.4) * 0.02) * 1000) / 1000,
        salesCount: 15 + (seed % 20),
      });
    }

    return data;
  }

  private computeCurrentSTL(historical: SaleToListHistoricalData[]): SaleToListCurrentMetrics {
    const latest = historical[historical.length - 1];
    const overAsking = latest.average > 1 ? 25 : latest.average > 0.98 ? 15 : 8;
    const underAsking = latest.average < 0.96 ? 40 : latest.average < 0.98 ? 30 : 20;

    return {
      average: latest.average,
      median: latest.median,
      standardDeviation: 0.03,
      overAskingPercentage: overAsking,
      underAskingPercentage: underAsking,
      atAskingPercentage: 100 - overAsking - underAsking,
      averageConcession: Math.max(0, (1 - latest.average) * 100),
    };
  }

  private computeSTLByPriceRange(_request: SaleToListRequest): SaleToListByPrice[] {
    return [
      { range: '< $300K', saleToListRatio: 1.01, sampleSize: 45 },
      { range: '$300K-$500K', saleToListRatio: 0.99, sampleSize: 60 },
      { range: '$500K-$750K', saleToListRatio: 0.97, sampleSize: 35 },
      { range: '$750K-$1M', saleToListRatio: 0.96, sampleSize: 20 },
      { range: '$1M-$2M', saleToListRatio: 0.95, sampleSize: 10 },
      { range: '>$2M', saleToListRatio: 0.93, sampleSize: 5 },
    ];
  }

  private computeSTLByPropertyType(_request: SaleToListRequest): SaleToListByType[] {
    return [
      { type: 'Single Family', saleToListRatio: 0.99, sampleSize: 80 },
      { type: 'Condo', saleToListRatio: 0.97, sampleSize: 40 },
      { type: 'Townhouse', saleToListRatio: 0.98, sampleSize: 30 },
      { type: 'Multi-Family', saleToListRatio: 0.96, sampleSize: 15 },
    ];
  }

  private generateSTLInsights(current: SaleToListCurrentMetrics): string[] {
    const insights: string[] = [];

    if (current.average > 1.02) {
      insights.push(`Homes selling at ${(current.average * 100 - 100).toFixed(1)}% above asking on average. Strong seller's market.`);
    } else if (current.average < 0.97) {
      insights.push(`Homes selling at ${(100 - current.average * 100).toFixed(1)}% below asking. Buyers have negotiating leverage.`);
    } else {
      insights.push('Sale-to-list ratios indicate a balanced market.');
    }

    if (current.overAskingPercentage > 30) {
      insights.push(`${current.overAskingPercentage}% of homes sell above asking price.`);
    }

    return insights;
  }

  // ─── Utilities ────────────────────────────────────────────────

  private getMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.config.cacheTimeout) {
      return entry.data as T;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}
