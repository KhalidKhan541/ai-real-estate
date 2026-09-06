import { searchService, SearchService } from "@/lib/search/search-service";

const service = new SearchService();

beforeEach(() => {
  service.clear();
});

const mockDocument = {
  id: "doc_1",
  type: "property" as const,
  data: {
    title: "Beautiful Family Home",
    city: "Austin",
    state: "TX",
    price: 450000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    lat: 30.2672,
    lng: -97.7431,
  },
};

describe("SearchService", () => {
  describe("indexDocument", () => {
    it("should index a document", async () => {
      const doc = await service.indexDocument(mockDocument);

      expect(doc).toBeDefined();
      expect(doc.id).toBe("doc_1");
      expect(doc.type).toBe("property");
      expect(doc.createdAt).toBeDefined();
      expect(doc.updatedAt).toBeDefined();
    });
  });

  describe("search", () => {
    it("should find documents by text query", async () => {
      await service.indexDocument(mockDocument);
      await service.indexDocument({
        ...mockDocument,
        id: "doc_2",
        data: { ...mockDocument.data, title: "Modern Apartment" },
      });

      const result = await service.search({ query: "Family" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Beautiful Family Home");
      expect(result.total).toBe(1);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should filter by price range", async () => {
      await service.indexDocument({ ...mockDocument, id: "d1", data: { ...mockDocument.data, price: 200000 } });
      await service.indexDocument({ ...mockDocument, id: "d2", data: { ...mockDocument.data, price: 400000 } });
      await service.indexDocument({ ...mockDocument, id: "d3", data: { ...mockDocument.data, price: 600000 } });

      const result = await service.search({
        query: "Home",
        filters: { price: { min: 300000, max: 500000 } },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].price).toBe(400000);
    });

    it("should filter by type", async () => {
      await service.indexDocument({ ...mockDocument, id: "d1", data: { ...mockDocument.data, type: "house" } });
      await service.indexDocument({ ...mockDocument, id: "d2", data: { ...mockDocument.data, type: "condo" } });

      const result = await service.search({
        query: "Home",
        filters: { type: ["house"] },
      });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by location radius", async () => {
      await service.indexDocument({
        ...mockDocument,
        id: "d1",
        data: { ...mockDocument.data, lat: 30.2672, lng: -97.7431 },
      });
      await service.indexDocument({
        ...mockDocument,
        id: "d2",
        data: { ...mockDocument.data, lat: 40.7128, lng: -74.006 },
      });

      const result = await service.search({
        query: "Home",
        location: { lat: 30.2672, lng: -97.7431, radius: 10 },
      });

      expect(result.items).toHaveLength(1);
    });

    it("should sort results", async () => {
      await service.indexDocument({ ...mockDocument, id: "d1", data: { ...mockDocument.data, price: 600000 } });
      await service.indexDocument({ ...mockDocument, id: "d2", data: { ...mockDocument.data, price: 200000 } });
      await service.indexDocument({ ...mockDocument, id: "d3", data: { ...mockDocument.data, price: 400000 } });

      const result = await service.search({
        query: "Home",
        sortBy: "price",
        sortOrder: "asc",
      });

      expect(result.items[0].price).toBe(200000);
      expect(result.items[2].price).toBe(600000);
    });

    it("should paginate results", async () => {
      for (let i = 0; i < 15; i++) {
        await service.indexDocument({
          ...mockDocument,
          id: `d${i}`,
          data: { ...mockDocument.data, title: `Property ${i}` },
        });
      }

      const page1 = await service.search({ query: "Property", page: 1, limit: 5 });
      const page2 = await service.search({ query: "Property", page: 2, limit: 5 });

      expect(page1.items).toHaveLength(5);
      expect(page2.items).toHaveLength(5);
      expect(page1.total).toBe(15);
    });

    it("should return suggestions", async () => {
      await service.indexDocument(mockDocument);

      const result = await service.search({ query: "luxury" });

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("should track search history", async () => {
      await service.search({ query: "House in Austin" });
      await service.search({ query: "Condo in Miami" });

      const analytics = await service.getSearchAnalytics();

      expect(analytics.totalSearches).toBe(2);
      expect(analytics.uniqueQueries).toBe(2);
    });
  });

  describe("getSuggestions", () => {
    it("should return matching suggestions", async () => {
      await service.indexDocument(mockDocument);

      const suggestions = await service.getSuggestions("family");

      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0].text).toBeDefined();
      expect(suggestions[0].score).toBeGreaterThan(0);
    });

    it("should return empty for empty query", async () => {
      const suggestions = await service.getSuggestions("");

      expect(suggestions).toEqual([]);
    });

    it("should limit results", async () => {
      for (let i = 0; i < 20; i++) {
        await service.indexDocument({
          ...mockDocument,
          id: `d${i}`,
          data: { ...mockDocument.data, title: `Property ${i}` },
        });
      }

      const suggestions = await service.getSuggestions("Property", 3);

      expect(suggestions).toHaveLength(3);
    });
  });

  describe("autocomplete", () => {
    it("should return completions", async () => {
      await service.indexDocument(mockDocument);

      const completions = await service.autocomplete("fam");

      expect(completions.length).toBeGreaterThanOrEqual(1);
    });

    it("should deduplicate results", async () => {
      await service.indexDocument({ ...mockDocument, id: "d1", data: { ...mockDocument.data, city: "Austin" } });
      await service.indexDocument({ ...mockDocument, id: "d2", data: { ...mockDocument.data, city: "Austin" } });

      const completions = await service.autocomplete("Austin");

      const uniqueCompletions = [...new Set(completions)];
      expect(completions.length).toBe(uniqueCompletions.length);
    });
  });

  describe("removeDocument", () => {
    it("should remove a document", async () => {
      await service.indexDocument(mockDocument);
      const removed = await service.removeDocument("doc_1");

      expect(removed).toBe(true);
    });

    it("should return false for non-existent document", async () => {
      const removed = await service.removeDocument("non_existent");

      expect(removed).toBe(false);
    });
  });

  describe("getSearchAnalytics", () => {
    it("should return search analytics", async () => {
      await service.search({ query: "House" });
      await service.search({ query: "House" });
      await service.search({ query: "Condo" });

      const analytics = await service.getSearchAnalytics();

      expect(analytics.totalSearches).toBe(3);
      expect(analytics.uniqueQueries).toBe(2);
      expect(analytics.topQueries).toHaveLength(2);
      expect(analytics.topQueries[0].query).toBe("house");
      expect(analytics.topQueries[0].count).toBe(2);
      expect(analytics.averageQueryLength).toBeGreaterThan(0);
    });
  });

  describe("reindexAll", () => {
    it("should reindex all documents", async () => {
      await service.indexDocument(mockDocument);
      await service.indexDocument({ ...mockDocument, id: "doc_2" });

      const result = await service.reindexAll();

      expect(result.indexed).toBe(2);
      expect(result.removed).toBe(0);
    });
  });
});
