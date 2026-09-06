import { listingService, ListingService } from "@/lib/listings/listing-service";

const service = new ListingService();

beforeEach(() => {
  service.clear();
});

const mockListing = {
  propertyId: "prop_123",
  agentId: "agt_456",
  type: "sale" as const,
  price: 450000,
  description: "Beautiful family home with modern amenities and a spacious backyard perfect for entertaining guests.",
  highlights: ["Pool", "Garage", "Updated Kitchen"],
  scheduledStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

describe("ListingService", () => {
  describe("create", () => {
    it("should create a new listing", async () => {
      const listing = await service.create(mockListing);

      expect(listing).toBeDefined();
      expect(listing.id).toMatch(/^lst_/);
      expect(listing.propertyId).toBe("prop_123");
      expect(listing.agentId).toBe("agt_456");
      expect(listing.type).toBe("sale");
      expect(listing.price).toBe(450000);
      expect(listing.status).toBe("draft");
      expect(listing.currency).toBe("USD");
      expect(listing.views).toBe(0);
      expect(listing.saves).toBe(0);
      expect(listing.inquiries).toBe(0);
    });

    it("should set optional fields", async () => {
      const listing = await service.create({
        ...mockListing,
        originalPrice: 500000,
        currency: "EUR",
        openHouseDate: new Date().toISOString(),
        virtualTourUrl: "https://example.com/tour/123",
        showingInstructions: "Contact agent before showing",
      });

      expect(listing.originalPrice).toBe(500000);
      expect(listing.currency).toBe("EUR");
      expect(listing.openHouseDate).toBeDefined();
      expect(listing.virtualTourUrl).toBe("https://example.com/tour/123");
      expect(listing.showingInstructions).toBe("Contact agent before showing");
    });
  });

  describe("getById", () => {
    it("should return listing by id", async () => {
      const created = await service.create(mockListing);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update listing fields", async () => {
      const created = await service.create(mockListing);
      const updated = await service.update(created.id, {
        price: 500000,
        description: "Updated description",
      });

      expect(updated).not.toBeNull();
      expect(updated!.price).toBe(500000);
      expect(updated!.description).toBe("Updated description");
    });

    it("should set publishedAt when activating", async () => {
      const created = await service.create(mockListing);
      const updated = await service.update(created.id, { status: "active" });

      expect(updated!.status).toBe("active");
      expect(updated!.publishedAt).toBeDefined();
    });

    it("should set closedAt when closing", async () => {
      const created = await service.create(mockListing);
      await service.update(created.id, { status: "active" });
      const closed = await service.update(created.id, { status: "closed" });

      expect(closed!.status).toBe("closed");
      expect(closed!.closedAt).toBeDefined();
    });

    it("should return null for non-existent listing", async () => {
      const updated = await service.update("non_existent", { price: 100 });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a listing", async () => {
      const created = await service.create(mockListing);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);
      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent listing", async () => {
      const deleted = await service.delete("non_existent");

      expect(deleted).toBe(false);
    });
  });

  describe("publish", () => {
    it("should set listing to active status", async () => {
      const created = await service.create(mockListing);
      const published = await service.publish(created.id);

      expect(published!.status).toBe("active");
      expect(published!.publishedAt).toBeDefined();
    });
  });

  describe("close", () => {
    it("should set listing to closed status", async () => {
      const created = await service.create(mockListing);
      const closed = await service.close(created.id);

      expect(closed!.status).toBe("closed");
      expect(closed!.closedAt).toBeDefined();
    });
  });

  describe("recordView", () => {
    it("should increment view count", async () => {
      const created = await service.create(mockListing);

      await service.recordView(created.id);
      await service.recordView(created.id);
      const updated = await service.recordView(created.id);

      expect(updated!.views).toBe(3);
    });

    it("should return null for non-existent listing", async () => {
      const result = await service.recordView("non_existent");

      expect(result).toBeNull();
    });
  });

  describe("recordSave", () => {
    it("should increment save count", async () => {
      const created = await service.create(mockListing);

      await service.recordSave(created.id);
      const updated = await service.recordSave(created.id);

      expect(updated!.saves).toBe(2);
    });
  });

  describe("recordInquiry", () => {
    it("should increment inquiry count", async () => {
      const created = await service.create(mockListing);

      await service.recordInquiry(created.id);
      const updated = await service.recordInquiry(created.id);

      expect(updated!.inquiries).toBe(2);
    });
  });

  describe("list", () => {
    it("should return all listings", async () => {
      await service.create(mockListing);
      await service.create({ ...mockListing, price: 300000 });

      const result = await service.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by type", async () => {
      await service.create({ ...mockListing, type: "sale" });
      await service.create({ ...mockListing, type: "rent" });

      const result = await service.list({ type: ["sale"] });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("sale");
    });

    it("should filter by status", async () => {
      const l1 = await service.create(mockListing);
      await service.create({ ...mockListing, price: 300000 });
      await service.update(l1.id, { status: "active" });

      const result = await service.list({ status: ["active"] });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by agent", async () => {
      await service.create(mockListing);
      await service.create({ ...mockListing, agentId: "agt_other" });

      const result = await service.list({ agentId: "agt_456" });

      expect(result.items).toHaveLength(1);
    });

    it("should sort by price", async () => {
      await service.create({ ...mockListing, price: 600000 });
      await service.create({ ...mockListing, price: 200000 });

      const result = await service.list({ sortBy: "price", sortOrder: "asc" });

      expect(result.items[0].price).toBe(200000);
      expect(result.items[1].price).toBe(600000);
    });
  });

  describe("getActiveByAgent", () => {
    it("should return active listings for agent", async () => {
      const l1 = await service.create(mockListing);
      const l2 = await service.create({ ...mockListing, agentId: "agt_other" });
      await service.publish(l1.id);
      await service.publish(l2.id);

      const result = await service.getActiveByAgent("agt_456");

      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe("agt_456");
    });
  });

  describe("getExpiringSoon", () => {
    it("should return listings expiring within days", async () => {
      const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const l1 = await service.create({
        ...mockListing,
        scheduledEndDate: soon,
      });
      await service.create({
        ...mockListing,
        scheduledEndDate: far,
      });
      await service.publish(l1.id);

      const result = await service.getExpiringSoon(7);

      expect(result).toHaveLength(1);
    });
  });

  describe("getStats", () => {
    it("should return listing statistics", async () => {
      const l1 = await service.create(mockListing);
      const l2 = await service.create({ ...mockListing, price: 300000 });
      await service.publish(l1.id);

      const stats = await service.getStats();

      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.pending).toBe(0);
      expect(stats.averagePrice).toBe(375000);
    });
  });
});
