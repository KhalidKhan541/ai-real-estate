import { propertyService, PropertyService } from "@/lib/properties/property-service";

const service = new PropertyService();

beforeEach(() => {
  service.clear();
});

const mockProperty = {
  title: "Beautiful Family Home",
  description: "A stunning 4-bedroom family home in the heart of the city with modern amenities and a spacious backyard.",
  price: 450000,
  address: {
    street: "123 Main Street",
    city: "Austin",
    state: "TX",
    zip: "78701",
    country: "USA",
    lat: 30.2672,
    lng: -97.7431,
  },
  type: "house" as const,
  bedrooms: 4,
  bathrooms: 3,
  squareFeet: 2500,
  lotSize: 0.25,
  yearBuilt: 2015,
  features: ["pool", "garage", "hardwood floors"],
  agentId: "agt_123",
  ownerId: "user_456",
};

describe("PropertyService", () => {
  describe("create", () => {
    it("should create a new property with generated id", async () => {
      const property = await service.create(mockProperty);

      expect(property).toBeDefined();
      expect(property.id).toMatch(/^prop_/);
      expect(property.title).toBe(mockProperty.title);
      expect(property.description).toBe(mockProperty.description);
      expect(property.price).toBe(mockProperty.price);
      expect(property.address).toEqual(mockProperty.address);
      expect(property.type).toBe("house");
      expect(property.status).toBe("active");
      expect(property.bedrooms).toBe(4);
      expect(property.bathrooms).toBe(3);
      expect(property.squareFeet).toBe(2500);
      expect(property.lotSize).toBe(0.25);
      expect(property.yearBuilt).toBe(2015);
      expect(property.features).toEqual(["pool", "garage", "hardwood floors"]);
      expect(property.agentId).toBe("agt_123");
      expect(property.ownerId).toBe("user_456");
      expect(property.createdAt).toBeDefined();
      expect(property.updatedAt).toBeDefined();
    });

    it("should set default values for optional fields", async () => {
      const property = await service.create({
        ...mockProperty,
        images: undefined,
        features: undefined,
        lotSize: undefined,
      });

      expect(property.images).toEqual([]);
      expect(property.features).toEqual([]);
      expect(property.lotSize).toBeUndefined();
    });

    it("should generate unique ids for each property", async () => {
      const p1 = await service.create(mockProperty);
      const p2 = await service.create(mockProperty);

      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe("getById", () => {
    it("should return property by id", async () => {
      const created = await service.create(mockProperty);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent_id");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update property fields", async () => {
      const created = await service.create(mockProperty);
      const updated = await service.update(created.id, {
        price: 500000,
        title: "Updated Title",
      });

      expect(updated).not.toBeNull();
      expect(updated!.price).toBe(500000);
      expect(updated!.title).toBe("Updated Title");
      expect(updated!.updatedAt).not.toBe(created.updatedAt);
    });

    it("should update nested address fields", async () => {
      const created = await service.create(mockProperty);
      const updated = await service.update(created.id, {
        address: { ...created.address, city: "San Francisco" },
      });

      expect(updated!.address.city).toBe("San Francisco");
      expect(updated!.address.street).toBe("123 Main Street");
    });

    it("should return null for non-existent property", async () => {
      const updated = await service.update("non_existent", { price: 100 });

      expect(updated).toBeNull();
    });

    it("should update status", async () => {
      const created = await service.create(mockProperty);
      const updated = await service.updateStatus(created.id, "sold");

      expect(updated!.status).toBe("sold");
    });
  });

  describe("delete", () => {
    it("should delete a property", async () => {
      const created = await service.create(mockProperty);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);
      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent property", async () => {
      const deleted = await service.delete("non_existent");

      expect(deleted).toBe(false);
    });
  });

  describe("list", () => {
    it("should return all properties with pagination", async () => {
      await service.create(mockProperty);
      await service.create({ ...mockProperty, title: "Second Property" });
      await service.create({ ...mockProperty, title: "Third Property" });

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should filter by price range", async () => {
      await service.create({ ...mockProperty, price: 200000 });
      await service.create({ ...mockProperty, price: 400000 });
      await service.create({ ...mockProperty, price: 600000 });

      const result = await service.list({
        minPrice: 300000,
        maxPrice: 500000,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].price).toBe(400000);
    });

    it("should filter by property type", async () => {
      await service.create({ ...mockProperty, type: "house" });
      await service.create({ ...mockProperty, type: "condo" });
      await service.create({ ...mockProperty, type: "apartment" });

      const result = await service.list({ type: ["house", "condo"] });

      expect(result.items).toHaveLength(2);
    });

    it("should filter by status", async () => {
      const p1 = await service.create(mockProperty);
      await service.create({ ...mockProperty, title: "Second" });
      await service.updateStatus(p1.id, "sold");

      const result = await service.list({ status: ["active"] });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by bedrooms", async () => {
      await service.create({ ...mockProperty, bedrooms: 2 });
      await service.create({ ...mockProperty, bedrooms: 4 });
      await service.create({ ...mockProperty, bedrooms: 6 });

      const result = await service.list({
        minBedrooms: 3,
        maxBedrooms: 5,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].bedrooms).toBe(4);
    });

    it("should filter by city", async () => {
      await service.create(mockProperty);
      await service.create({
        ...mockProperty,
        address: { ...mockProperty.address, city: "Houston" },
      });

      const result = await service.list({ city: "Austin" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].address.city).toBe("Austin");
    });

    it("should sort by price ascending", async () => {
      await service.create({ ...mockProperty, price: 600000 });
      await service.create({ ...mockProperty, price: 200000 });
      await service.create({ ...mockProperty, price: 400000 });

      const result = await service.list({ sortBy: "price", sortOrder: "asc" });

      expect(result.items[0].price).toBe(200000);
      expect(result.items[1].price).toBe(400000);
      expect(result.items[2].price).toBe(600000);
    });

    it("should paginate results", async () => {
      for (let i = 0; i < 25; i++) {
        await service.create({ ...mockProperty, title: `Property ${i}` });
      }

      const page1 = await service.list({ page: 1, limit: 10 });
      const page2 = await service.list({ page: 2, limit: 10 });
      const page3 = await service.list({ page: 3, limit: 10 });

      expect(page1.items).toHaveLength(10);
      expect(page2.items).toHaveLength(10);
      expect(page3.items).toHaveLength(5);
      expect(page1.total).toBe(25);
    });
  });

  describe("getByAgentId", () => {
    it("should return properties for a specific agent", async () => {
      await service.create(mockProperty);
      await service.create({ ...mockProperty, agentId: "agt_other" });
      await service.create({ ...mockProperty, agentId: "agt_123" });

      const result = await service.getByAgentId("agt_123");

      expect(result).toHaveLength(2);
    });
  });

  describe("getByOwnerId", () => {
    it("should return properties for a specific owner", async () => {
      await service.create(mockProperty);
      await service.create({ ...mockProperty, ownerId: "user_other" });

      const result = await service.getByOwnerId("user_456");

      expect(result).toHaveLength(1);
    });
  });

  describe("getSimilar", () => {
    it("should return similar properties", async () => {
      const base = await service.create(mockProperty);
      await service.create({
        ...mockProperty,
        title: "Similar House",
        type: "house",
        price: 470000,
        bedrooms: 4,
        address: { ...mockProperty.address, city: "Austin" },
      });
      await service.create({
        ...mockProperty,
        title: "Different Condo",
        type: "condo",
        price: 200000,
        bedrooms: 1,
        address: { ...mockProperty.address, city: "Houston" },
      });

      const similar = await service.getSimilar(base.id, 5);

      expect(similar.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty for non-existent property", async () => {
      const similar = await service.getSimilar("non_existent");

      expect(similar).toEqual([]);
    });
  });

  describe("getStatistics", () => {
    it("should return correct statistics", async () => {
      await service.create({ ...mockProperty, price: 300000, type: "house" });
      await service.create({ ...mockProperty, price: 500000, type: "condo" });
      await service.create({ ...mockProperty, price: 400000, type: "house" });

      const stats = await service.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.averagePrice).toBe(400000);
      expect(stats.medianPrice).toBe(400000);
      expect(stats.priceRange.min).toBe(300000);
      expect(stats.priceRange.max).toBe(500000);
      expect(stats.byType["house"]).toBe(2);
      expect(stats.byType["condo"]).toBe(1);
    });

    it("should filter statistics by city", async () => {
      await service.create(mockProperty);
      await service.create({
        ...mockProperty,
        address: { ...mockProperty.address, city: "Houston" },
      });

      const stats = await service.getStatistics("Austin");

      expect(stats.total).toBe(1);
    });

    it("should handle empty data", async () => {
      const stats = await service.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.averagePrice).toBe(0);
      expect(stats.medianPrice).toBe(0);
    });
  });
});
