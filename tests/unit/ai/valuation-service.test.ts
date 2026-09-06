import { valuationService, ValuationService } from "@/lib/ai/valuation-service";

const service = new ValuationService();

beforeEach(() => {
  service.clear();
});

const mockRequest = {
  address: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  propertyType: "house",
  bedrooms: 4,
  bathrooms: 3,
  squareFeet: 2500,
  yearBuilt: 2015,
  condition: "good" as const,
  features: ["pool", "garage"],
  recentRenovations: ["kitchen"],
};

describe("ValuationService", () => {
  describe("generateValuation", () => {
    it("should generate a valuation", async () => {
      const result = await service.generateValuation(mockRequest);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^val_/);
      expect(result.estimatedValue).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
      expect(result.valueRange.low).toBeLessThanOrEqual(result.estimatedValue);
      expect(result.valueRange.high).toBeGreaterThanOrEqual(result.estimatedValue);
      expect(result.methodology).toBe("hybrid");
      expect(result.comparables).toHaveLength(3);
      expect(result.adjustments).toBeDefined();
      expect(result.marketFactors).toHaveLength(3);
      expect(result.generatedAt).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.modelVersion).toBe("1.0.0");
    });

    it("should include propertyId when provided", async () => {
      const result = await service.generateValuation({
        ...mockRequest,
        propertyId: "prop_123",
      });

      expect(result.propertyId).toBe("prop_123");
    });

    it("should calculate confidence based on input completeness", async () => {
      const minimal = await service.generateValuation({
        city: "Austin",
        state: "TX",
        zip: "78701",
        address: "123 Main St",
        propertyType: "house",
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1000,
        yearBuilt: 2000,
      });

      const full = await service.generateValuation({
        ...mockRequest,
        lotSize: 0.25,
        comparables: ["comp1", "comp2"],
      });

      expect(full.confidenceScore).toBeGreaterThanOrEqual(minimal.confidenceScore);
    });

    it("should adjust value based on condition", async () => {
      const excellent = await service.generateValuation({
        ...mockRequest,
        condition: "excellent",
      });

      const poor = await service.generateValuation({
        ...mockRequest,
        condition: "poor",
      });

      expect(excellent.estimatedValue).toBeGreaterThan(poor.estimatedValue);
    });

    it("should adjust value for features", async () => {
      const withPool = await service.generateValuation({
        ...mockRequest,
        features: ["pool", "garage", "smart home"],
      });

      const noFeatures = await service.generateValuation({
        ...mockRequest,
        features: [],
      });

      expect(withPool.estimatedValue).toBeGreaterThan(noFeatures.estimatedValue);
    });

    it("should adjust value for renovations", async () => {
      const renovated = await service.generateValuation({
        ...mockRequest,
        recentRenovations: ["kitchen", "bathroom"],
      });

      const notRenovated = await service.generateValuation({
        ...mockRequest,
        recentRenovations: [],
      });

      expect(renovated.estimatedValue).toBeGreaterThan(notRenovated.estimatedValue);
    });

    it("should generate comparables", async () => {
      const result = await service.generateValuation(mockRequest);

      expect(result.comparables).toHaveLength(3);
      for (const comp of result.comparables) {
        expect(comp.address).toBeDefined();
        expect(comp.price).toBeGreaterThan(0);
        expect(comp.squareFeet).toBeGreaterThan(0);
        expect(comp.pricePerSqft).toBeGreaterThan(0);
        expect(comp.similarity).toBeGreaterThan(0);
        expect(comp.similarity).toBeLessThanOrEqual(1);
      }
    });

    it("should generate market factors", async () => {
      const result = await service.generateValuation(mockRequest);

      expect(result.marketFactors.length).toBeGreaterThanOrEqual(1);
      for (const factor of result.marketFactors) {
        expect(factor.factor).toBeDefined();
        expect(["positive", "negative", "neutral"]).toContain(factor.impact);
        expect(factor.description).toBeDefined();
      }
    });
  });

  describe("getById", () => {
    it("should return valuation by id", async () => {
      const created = await service.generateValuation(mockRequest);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("getValuationHistory", () => {
    it("should return valuation history for a property", async () => {
      await service.generateValuation({ ...mockRequest, propertyId: "prop_1" });
      await service.generateValuation({ ...mockRequest, propertyId: "prop_1" });
      await service.generateValuation({ ...mockRequest, propertyId: "prop_2" });

      const history = await service.getValuationHistory("prop_1");

      expect(history).toHaveLength(2);
    });

    it("should return empty for property with no valuations", async () => {
      const history = await service.getValuationHistory("non_existent");

      expect(history).toEqual([]);
    });
  });

  describe("compareValuations", () => {
    it("should compare multiple valuations", async () => {
      const v1 = await service.generateValuation(mockRequest);
      const v2 = await service.generateValuation({ ...mockRequest, condition: "excellent" });
      const v3 = await service.generateValuation({ ...mockRequest, condition: "poor" });

      const comparison = await service.compareValuations([v1.id, v2.id, v3.id]);

      expect(comparison.valuations).toHaveLength(3);
      expect(comparison.averageValue).toBeGreaterThan(0);
      expect(comparison.valueRange.min).toBeLessThanOrEqual(comparison.valueRange.max);
      expect(comparison.consensusConfidence).toBeGreaterThan(0);
    });

    it("should handle empty valuations", async () => {
      const comparison = await service.compareValuations([]);

      expect(comparison.valuations).toHaveLength(0);
      expect(comparison.averageValue).toBe(0);
    });
  });

  describe("getMarketTrend", () => {
    it("should return market trend data", async () => {
      const trend = await service.getMarketTrend("Austin", "TX", 12);

      expect(trend.trend).toBeDefined();
      expect(["appreciating", "depreciating", "stable"]).toContain(trend.trend);
      expect(trend.changePercent).toBeDefined();
      expect(trend.averagePrice).toBeGreaterThan(0);
      expect(trend.medianPrice).toBeGreaterThan(0);
      expect(trend.pricePerSqft).toBeGreaterThan(0);
      expect(trend.inventory).toBeGreaterThanOrEqual(0);
      expect(trend.daysOnMarket).toBeGreaterThanOrEqual(0);
    });

    it("should handle different timeframes", async () => {
      const short = await service.getMarketTrend("Austin", "TX", 3);
      const long = await service.getMarketTrend("Austin", "TX", 24);

      expect(short).toBeDefined();
      expect(long).toBeDefined();
    });
  });
});
