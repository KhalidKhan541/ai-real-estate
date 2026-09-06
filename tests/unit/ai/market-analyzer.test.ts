import { marketAnalyzer, MarketAnalyzer } from "@/lib/ai/market-analyzer";

const analyzer = new MarketAnalyzer();

beforeEach(() => {
  analyzer.clear();
});

describe("MarketAnalyzer", () => {
  describe("analyzeMarket", () => {
    it("should analyze market data", async () => {
      const data = await analyzer.analyzeMarket("Austin", "TX");

      expect(data).toBeDefined();
      expect(data.id).toMatch(/^mkt_/);
      expect(data.city).toBe("Austin");
      expect(data.state).toBe("TX");
      expect(data.medianPrice).toBeGreaterThan(0);
      expect(data.averagePrice).toBeGreaterThan(0);
      expect(data.pricePerSqft).toBeGreaterThan(0);
      expect(data.totalSales).toBeGreaterThanOrEqual(0);
      expect(data.inventory).toBeGreaterThanOrEqual(0);
      expect(data.daysOnMarket).toBeGreaterThanOrEqual(0);
      expect(data.monthsOfSupply).toBeGreaterThanOrEqual(0);
      expect(data.saleToListRatio).toBeGreaterThan(0);
      expect(data.saleToListRatio).toBeLessThanOrEqual(2);
    });

    it("should cache results", async () => {
      const data1 = await analyzer.analyzeMarket("Austin", "TX");
      const data2 = await analyzer.analyzeMarket("Austin", "TX");

      expect(data1.id).toBe(data2.id);
    });

    it("should handle different cities", async () => {
      const austin = await analyzer.analyzeMarket("Austin", "TX");
      const miami = await analyzer.analyzeMarket("Miami", "FL");

      expect(austin.city).toBe("Austin");
      expect(miami.city).toBe("Miami");
    });
  });

  describe("getMarketData", () => {
    it("should return cached market data", async () => {
      await analyzer.analyzeMarket("Austin", "TX");
      const data = await analyzer.getMarketData("Austin", "TX");

      expect(data).not.toBeNull();
      expect(data!.city).toBe("Austin");
    });

    it("should return null for unknown market", async () => {
      const data = await analyzer.getMarketData("Unknown", "XX");

      expect(data).toBeNull();
    });
  });

  describe("predictMarket", () => {
    it("should predict market trends", async () => {
      const prediction = await analyzer.predictMarket("Austin", "TX", "6months");

      expect(prediction).toBeDefined();
      expect(prediction.predictedPrice).toBeGreaterThan(0);
      expect(prediction.confidenceInterval.low).toBeLessThanOrEqual(prediction.predictedPrice);
      expect(prediction.confidenceInterval.high).toBeGreaterThanOrEqual(prediction.predictedPrice);
      expect(["appreciating", "depreciating", "stable"]).toContain(prediction.trend);
      expect(prediction.factors).toHaveLength(4);
      expect(prediction.generatedAt).toBeDefined();
    });

    it("should support different timeframes", async () => {
      const three = await analyzer.predictMarket("Austin", "TX", "3months");
      const six = await analyzer.predictMarket("Austin", "TX", "6months");
      const one = await analyzer.predictMarket("Austin", "TX", "1year");

      expect(three.timeframe).toBe("3months");
      expect(six.timeframe).toBe("6months");
      expect(one.timeframe).toBe("1year");
    });

    it("should include market factors", async () => {
      const prediction = await analyzer.predictMarket("Austin", "TX");

      for (const factor of prediction.factors) {
        expect(factor.name).toBeDefined();
        expect(["high", "medium", "low"]).toContain(factor.impact);
        expect(["positive", "negative"]).toContain(factor.direction);
        expect(factor.description).toBeDefined();
      }
    });
  });

  describe("getNeighborhoodInsights", () => {
    it("should return neighborhood insights", async () => {
      const insights = await analyzer.getNeighborhoodInsights("Austin", "TX", "Downtown");

      expect(insights).toBeDefined();
      expect(insights.neighborhood).toBe("Downtown");
      expect(insights.city).toBe("Austin");
      expect(insights.state).toBe("TX");
      expect(insights.safetyScore).toBeGreaterThanOrEqual(0);
      expect(insights.safetyScore).toBeLessThanOrEqual(100);
      expect(insights.schoolRating).toBeGreaterThanOrEqual(0);
      expect(insights.schoolRating).toBeLessThanOrEqual(10);
      expect(insights.walkabilityScore).toBeGreaterThanOrEqual(0);
      expect(insights.walkabilityScore).toBeLessThanOrEqual(100);
      expect(insights.amenities).toHaveLength(4);
      expect(insights.growthProjection).toBeDefined();
      expect(insights.investmentPotential).toBeDefined();
    });

    it("should include amenities with ratings", async () => {
      const insights = await analyzer.getNeighborhoodInsights("Austin", "TX", "Downtown");

      for (const amenity of insights.amenities) {
        expect(amenity.type).toBeDefined();
        expect(amenity.count).toBeGreaterThanOrEqual(0);
        expect(amenity.averageRating).toBeGreaterThan(0);
        expect(amenity.averageRating).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("compareMarkets", () => {
    it("should compare multiple markets", async () => {
      const result = await analyzer.compareMarkets([
        { city: "Austin", state: "TX" },
        { city: "Miami", state: "FL" },
        { city: "Denver", state: "CO" },
      ]);

      expect(result.markets).toHaveLength(3);
      expect(result.bestValue).toBeDefined();
      expect(result.fastestGrowing).toBeDefined();
      expect(result.mostAffordable).toBeDefined();
      expect(result.bestValue.city).toBeDefined();
      expect(result.bestValue.pricePerSqft).toBeGreaterThan(0);
    });
  });

  describe("getInvestmentScore", () => {
    it("should calculate investment score", async () => {
      const result = await analyzer.getInvestmentScore("Austin", "TX");

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toHaveLength(5);
      expect(["strong_buy", "buy", "hold", "sell", "strong_sell"]).toContain(
        result.recommendation
      );

      for (const item of result.breakdown) {
        expect(item.category).toBeDefined();
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThanOrEqual(100);
        expect(item.weight).toBeGreaterThan(0);
        expect(item.weight).toBeLessThanOrEqual(1);
      }
    });

    it("should correlate score with recommendation", async () => {
      const result = await analyzer.getInvestmentScore("Austin", "TX");

      if (result.score >= 80) {
        expect(result.recommendation).toBe("strong_buy");
      } else if (result.score >= 65) {
        expect(result.recommendation).toBe("buy");
      } else if (result.score >= 50) {
        expect(result.recommendation).toBe("hold");
      }
    });
  });

  describe("getHistoricalData", () => {
    it("should return historical market data", async () => {
      const data = await analyzer.getHistoricalData("Austin", "TX", 12);

      expect(data).toHaveLength(13);
      for (const entry of data) {
        expect(entry.city).toBe("Austin");
        expect(entry.state).toBe("TX");
        expect(entry.medianPrice).toBeGreaterThan(0);
        expect(entry.period).toBeDefined();
      }
    });

    it("should sort by period ascending", async () => {
      const data = await analyzer.getHistoricalData("Austin", "TX", 6);

      for (let i = 1; i < data.length; i++) {
        expect(data[i].period >= data[i - 1].period).toBe(true);
      }
    });

    it("should handle different timeframes", async () => {
      const three = await analyzer.getHistoricalData("Austin", "TX", 3);
      const six = await analyzer.getHistoricalData("Austin", "TX", 6);

      expect(three).toHaveLength(4);
      expect(six).toHaveLength(7);
    });
  });
});
