import { recommendationEngine, RecommendationEngine } from "@/lib/ai/recommendation-engine";

const engine = new RecommendationEngine();

beforeEach(() => {
  engine.clear();
});

const mockPreferences = {
  userId: "user_123",
  budget: { min: 300000, max: 500000 },
  propertyTypes: ["house"],
  preferredAreas: [{ city: "Austin", state: "TX" }],
  bedrooms: { min: 3, max: 5 },
  bathrooms: { min: 2, max: 4 },
  squareFeet: { min: 1500, max: 3500 },
  mustHaveFeatures: ["pool"],
  niceToHaveFeatures: ["garage"],
  dealBreakers: [],
};

const mockProperties = [
  {
    id: "prop_1",
    price: 450000,
    type: "house",
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    features: ["pool", "garage"],
    address: { city: "Austin", state: "TX" },
    yearBuilt: 2015,
  },
  {
    id: "prop_2",
    price: 350000,
    type: "house",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    features: ["garage"],
    address: { city: "Austin", state: "TX" },
    yearBuilt: 2010,
  },
  {
    id: "prop_3",
    price: 600000,
    type: "condo",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    features: ["pool"],
    address: { city: "Houston", state: "TX" },
    yearBuilt: 2020,
  },
];

describe("RecommendationEngine", () => {
  describe("getRecommendations", () => {
    it("should return scored recommendations", async () => {
      const results = await engine.getRecommendations(
        { userId: "user_123", preferences: mockPreferences },
        mockProperties
      );

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      for (const rec of results) {
        expect(rec.propertyId).toBeDefined();
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(1);
        expect(rec.matchPercentage).toBeGreaterThanOrEqual(0);
        expect(rec.matchPercentage).toBeLessThanOrEqual(100);
        expect(rec.reasons).toBeDefined();
        expect(rec.warnings).toBeDefined();
        expect(rec.priceAnalysis).toBeDefined();
      }
    });

    it("should rank matching properties higher", async () => {
      const results = await engine.getRecommendations(
        { userId: "user_123", preferences: mockPreferences },
        mockProperties
      );

      const prop1 = results.find((r) => r.propertyId === "prop_1");
      const prop3 = results.find((r) => r.propertyId === "prop_3");

      if (prop1 && prop3) {
        expect(prop1.score).toBeGreaterThanOrEqual(prop3.score);
      }
    });

    it("should exclude specified properties", async () => {
      const results = await engine.getRecommendations(
        {
          userId: "user_123",
          preferences: mockPreferences,
          excludePropertyIds: ["prop_1"],
        },
        mockProperties
      );

      expect(results.find((r) => r.propertyId === "prop_1")).toBeUndefined();
    });

    it("should respect limit parameter", async () => {
      const results = await engine.getRecommendations(
        { userId: "user_123", preferences: mockPreferences, limit: 2 },
        mockProperties
      );

      expect(results).toHaveLength(2);
    });

    it("should respect minScore parameter", async () => {
      const results = await engine.getRecommendations(
        { userId: "user_123", preferences: mockPreferences, minScore: 0.8 },
        mockProperties
      );

      for (const rec of results) {
        expect(rec.score).toBeGreaterThanOrEqual(0.8);
      }
    });

    it("should generate reasons for high scores", async () => {
      const results = await engine.getRecommendations(
        { userId: "user_123", preferences: mockPreferences },
        mockProperties
      );

      const highScore = results.find((r) => r.score >= 0.7);
      if (highScore) {
        expect(highScore.reasons.length).toBeGreaterThan(0);
      }
    });

    it("should warn about deal breakers", async () => {
      const prefsWithDealBreaker = {
        ...mockPreferences,
        dealBreakers: ["pool"],
      };

      const results = await engine.getRecommendations(
        { userId: "user_123", preferences: prefsWithDealBreaker },
        mockProperties
      );

      const withWarning = results.find((r) => r.warnings.length > 0);
      expect(withWarning).toBeDefined();
    });
  });

  describe("savePreferences", () => {
    it("should save user preferences", async () => {
      const saved = await engine.savePreferences(mockPreferences);

      expect(saved).toEqual(mockPreferences);
    });
  });

  describe("getPreferences", () => {
    it("should return saved preferences", async () => {
      await engine.savePreferences(mockPreferences);
      const found = await engine.getPreferences("user_123");

      expect(found).toEqual(mockPreferences);
    });

    it("should return null for unknown user", async () => {
      const found = await engine.getPreferences("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("updatePreferences", () => {
    it("should update existing preferences", async () => {
      await engine.savePreferences(mockPreferences);
      const updated = await engine.updatePreferences("user_123", {
        budget: { min: 400000, max: 600000 },
      });

      expect(updated).not.toBeNull();
      expect(updated!.budget.min).toBe(400000);
      expect(updated!.budget.max).toBe(600000);
      expect(updated!.userId).toBe("user_123");
    });

    it("should return null for unknown user", async () => {
      const updated = await engine.updatePreferences("non_existent", {
        budget: { min: 400000, max: 600000 },
      });

      expect(updated).toBeNull();
    });
  });

  describe("analyzeSearchBehavior", () => {
    it("should analyze search behavior to suggest preferences", async () => {
      const searches = [
        {
          query: "house in Austin",
          filters: { price: { min: 300000, max: 500000 }, type: "house", city: "Austin" },
          viewedProperties: ["prop_1"],
          savedProperties: ["prop_1"],
          contactedProperties: [],
        },
        {
          query: "house in Austin",
          filters: { price: { min: 350000, max: 550000 }, type: "house", city: "Austin" },
          viewedProperties: ["prop_2"],
          savedProperties: [],
          contactedProperties: ["prop_2"],
        },
      ];

      const suggested = await engine.analyzeSearchBehavior("user_123", searches);

      expect(suggested.budget).toBeDefined();
      expect(suggested.propertyTypes).toContain("house");
      expect(suggested.preferredAreas).toBeDefined();
    });

    it("should handle empty searches", async () => {
      const suggested = await engine.analyzeSearchBehavior("user_123", []);

      expect(suggested.budget).toBeDefined();
    });
  });

  describe("calculateMatchScore", () => {
    it("should calculate match score breakdown", async () => {
      const result = await engine.calculateMatchScore(mockProperties[0], mockPreferences);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(1);
      expect(result.breakdown).toHaveLength(5);

      const budgetBreakdown = result.breakdown.find((b) => b.category === "Budget");
      expect(budgetBreakdown).toBeDefined();
      expect(budgetBreakdown!.weight).toBe(0.3);

      const typeBreakdown = result.breakdown.find((b) => b.category === "Property Type");
      expect(typeBreakdown).toBeDefined();
      expect(typeBreakdown!.weight).toBe(0.15);
    });

    it("should give high score for matching property", async () => {
      const result = await engine.calculateMatchScore(mockProperties[0], mockPreferences);

      expect(result.totalScore).toBeGreaterThan(0.5);
    });

    it("should give low score for non-matching property", async () => {
      const result = await engine.calculateMatchScore(mockProperties[2], mockPreferences);

      expect(result.totalScore).toBeLessThan(0.7);
    });

    it("should handle empty preferences", async () => {
      const emptyPrefs = {
        ...mockPreferences,
        mustHaveFeatures: [],
        preferredAreas: [],
        propertyTypes: [],
      };

      const result = await engine.calculateMatchScore(mockProperties[0], emptyPrefs);

      expect(result.totalScore).toBeGreaterThan(0.5);
    });
  });
});
