import { searchService } from "@/lib/search/search-service";
import { propertyService } from "@/lib/properties/property-service";

beforeEach(() => {
  searchService.clear();
  propertyService.clear();
});

describe("API Integration: Search", () => {
  it("should index and search properties", async () => {
    await searchService.indexDocument({
      id: "prop_1",
      type: "property",
      data: {
        title: "Beautiful Home",
        city: "Austin",
        state: "TX",
        price: 450000,
        bedrooms: 4,
        type: "house",
      },
    });

    await searchService.indexDocument({
      id: "prop_2",
      type: "property",
      data: {
        title: "Modern Condo",
        city: "Miami",
        state: "FL",
        price: 350000,
        bedrooms: 2,
        type: "condo",
      },
    });

    const results = await searchService.search({ query: "Beautiful" });
    expect(results.items).toHaveLength(1);
    expect(results.items[0].title).toBe("Beautiful Home");
  });

  it("should filter search by price", async () => {
    await searchService.indexDocument({
      id: "p1",
      type: "property",
      data: { title: "Home", price: 200000, city: "Austin" },
    });
    await searchService.indexDocument({
      id: "p2",
      type: "property",
      data: { title: "Home", price: 400000, city: "Austin" },
    });
    await searchService.indexDocument({
      id: "p3",
      type: "property",
      data: { title: "Home", price: 600000, city: "Austin" },
    });

    const results = await searchService.search({
      query: "Home",
      filters: { price: { min: 300000, max: 500000 } },
    });

    expect(results.items).toHaveLength(1);
    expect(results.items[0].price).toBe(400000);
  });

  it("should provide search suggestions", async () => {
    await searchService.indexDocument({
      id: "d1",
      type: "property",
      data: { title: "Luxury Villa", city: "Miami" },
    });

    const suggestions = await searchService.getSuggestions("lux");
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].text).toBeDefined();
  });

  it("should track search analytics", async () => {
    await searchService.search({ query: "house" });
    await searchService.search({ query: "house" });
    await searchService.search({ query: "condo" });

    const analytics = await searchService.getSearchAnalytics();
    expect(analytics.totalSearches).toBe(3);
    expect(analytics.uniqueQueries).toBe(2);
    expect(analytics.topQueries[0].query).toBe("house");
    expect(analytics.topQueries[0].count).toBe(2);
  });

  it("should handle location-based search", async () => {
    await searchService.indexDocument({
      id: "d1",
      type: "property",
      data: { title: "Home", lat: 30.2672, lng: -97.7431, city: "Austin" },
    });
    await searchService.indexDocument({
      id: "d2",
      type: "property",
      data: { title: "Home", lat: 40.7128, lng: -74.006, city: "New York" },
    });

    const results = await searchService.search({
      query: "Home",
      location: { lat: 30.2672, lng: -97.7431, radius: 50 },
    });

    expect(results.items).toHaveLength(1);
    expect(results.items[0].city).toBe("Austin");
  });

  it("should paginate search results", async () => {
    for (let i = 0; i < 25; i++) {
      await searchService.indexDocument({
        id: `p${i}`,
        type: "property",
        data: { title: `Property ${i}`, city: "Austin" },
      });
    }

    const page1 = await searchService.search({ query: "Property", page: 1, limit: 10 });
    const page2 = await searchService.search({ query: "Property", page: 2, limit: 10 });

    expect(page1.items).toHaveLength(10);
    expect(page2.items).toHaveLength(10);
    expect(page1.total).toBe(25);
  });

  it("should autocomplete search terms", async () => {
    await searchService.indexDocument({
      id: "d1",
      type: "property",
      data: { title: "Family Home", city: "Austin" },
    });

    const completions = await searchService.autocomplete("fam");
    expect(completions.length).toBeGreaterThanOrEqual(1);
  });
});
