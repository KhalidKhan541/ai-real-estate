import { offerService, OfferService } from "@/lib/offers/offer-service";

const service = new OfferService();

beforeEach(() => {
  service.clear();
});

const mockOffer = {
  propertyId: "prop_123",
  listingId: "lst_456",
  buyerId: "user_buyer",
  buyerAgentId: "agt_buyer",
  sellerAgentId: "agt_seller",
  amount: 425000,
  earnestMoney: 10000,
  downPayment: 85000,
  financingType: "conventional" as const,
  contingencies: ["inspection", "financing", "appraisal"],
  closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  notes: "Looking forward to closing quickly.",
};

describe("OfferService", () => {
  describe("create", () => {
    it("should create a new offer", async () => {
      const offer = await service.create(mockOffer);

      expect(offer).toBeDefined();
      expect(offer.id).toMatch(/^ofr_/);
      expect(offer.propertyId).toBe("prop_123");
      expect(offer.listingId).toBe("lst_456");
      expect(offer.buyerId).toBe("user_buyer");
      expect(offer.amount).toBe(425000);
      expect(offer.earnestMoney).toBe(10000);
      expect(offer.downPayment).toBe(85000);
      expect(offer.financingType).toBe("conventional");
      expect(offer.contingencies).toEqual(["inspection", "financing", "appraisal"]);
      expect(offer.status).toBe("pending");
    });

    it("should set optional defaults", async () => {
      const offer = await service.create({
        ...mockOffer,
        contingencies: undefined,
        notes: undefined,
      });

      expect(offer.contingencies).toEqual([]);
      expect(offer.notes).toBeUndefined();
    });
  });

  describe("getById", () => {
    it("should return offer by id", async () => {
      const created = await service.create(mockOffer);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update offer fields", async () => {
      const created = await service.create(mockOffer);
      const updated = await service.update(created.id, {
        status: "accepted",
        responseNotes: "Great offer!",
      });

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe("accepted");
      expect(updated!.responseNotes).toBe("Great offer!");
      expect(updated!.respondedAt).toBeDefined();
    });

    it("should set counter offer", async () => {
      const created = await service.create(mockOffer);
      const updated = await service.update(created.id, {
        status: "countered",
        counterOffer: {
          amount: 430000,
          terms: ["Remove financing contingency"],
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      expect(updated!.status).toBe("countered");
      expect(updated!.counterOffer).toBeDefined();
      expect(updated!.counterOffer!.amount).toBe(430000);
    });

    it("should return null for non-existent offer", async () => {
      const updated = await service.update("non_existent", { status: "accepted" });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an offer", async () => {
      const created = await service.create(mockOffer);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);
      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent offer", async () => {
      const deleted = await service.delete("non_existent");

      expect(deleted).toBe(false);
    });
  });

  describe("accept", () => {
    it("should accept an offer", async () => {
      const created = await service.create(mockOffer);
      const accepted = await service.accept(created.id, "Looks good!");

      expect(accepted!.status).toBe("accepted");
      expect(accepted!.responseNotes).toBe("Looks good!");
    });
  });

  describe("reject", () => {
    it("should reject an offer", async () => {
      const created = await service.create(mockOffer);
      const rejected = await service.reject(created.id, "Too low");

      expect(rejected!.status).toBe("rejected");
      expect(rejected!.responseNotes).toBe("Too low");
    });
  });

  describe("counter", () => {
    it("should create a counter offer", async () => {
      const created = await service.create(mockOffer);
      const countered = await service.counter(
        created.id,
        430000,
        ["Remove inspection contingency"],
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      );

      expect(countered!.status).toBe("countered");
      expect(countered!.counterOffer).toBeDefined();
      expect(countered!.counterOffer!.amount).toBe(430000);
      expect(countered!.counterOffer!.terms).toEqual(["Remove inspection contingency"]);
    });
  });

  describe("withdraw", () => {
    it("should withdraw an offer", async () => {
      const created = await service.create(mockOffer);
      const withdrawn = await service.withdraw(created.id, "Changed my mind");

      expect(withdrawn!.status).toBe("withdrawn");
    });
  });

  describe("getExpiredOffers", () => {
    it("should return expired offers", async () => {
      const expired = await service.create({
        ...mockOffer,
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await service.create({
        ...mockOffer,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const results = await service.getExpiredOffers();

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(expired.id);
    });
  });

  describe("getOffersForProperty", () => {
    it("should return offers for a property sorted by amount", async () => {
      await service.create({ ...mockOffer, amount: 400000 });
      await service.create({ ...mockOffer, amount: 450000 });
      await service.create({ ...mockOffer, amount: 425000 });

      const results = await service.getOffersForProperty("prop_123");

      expect(results).toHaveLength(3);
      expect(results[0].amount).toBe(450000);
      expect(results[1].amount).toBe(425000);
      expect(results[2].amount).toBe(400000);
    });
  });

  describe("getBestOffer", () => {
    it("should return the highest pending offer", async () => {
      await service.create({ ...mockOffer, amount: 400000 });
      const best = await service.create({ ...mockOffer, amount: 450000 });
      await service.create({ ...mockOffer, amount: 425000 });

      const result = await service.getBestOffer("prop_123");

      expect(result).not.toBeNull();
      expect(result!.id).toBe(best.id);
    });

    it("should return null if no pending offers", async () => {
      const offer = await service.create(mockOffer);
      await service.accept(offer.id);

      const result = await service.getBestOffer("prop_123");

      expect(result).toBeNull();
    });
  });

  describe("calculateOfferScore", () => {
    it("should calculate offer score", async () => {
      const offer = await service.create(mockOffer);
      const listingPrice = 450000;

      const result = await service.calculateOfferScore(offer, listingPrice);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.factors).toHaveLength(5);
      expect(result.factors.find((f) => f.name === "price")).toBeDefined();
      expect(result.factors.find((f) => f.name === "financing")).toBeDefined();
    });

    it("should give higher score for cash offers", async () => {
      const cashOffer = await service.create({ ...mockOffer, financingType: "cash" });
      const financedOffer = await service.create({
        ...mockOffer,
        financingType: "conventional",
        amount: 425000,
      });

      const cashResult = await service.calculateOfferScore(cashOffer, 450000);
      const financedResult = await service.calculateOfferScore(financedOffer, 450000);

      expect(cashResult.score).toBeGreaterThanOrEqual(financedResult.score);
    });
  });

  describe("list", () => {
    it("should return all offers", async () => {
      await service.create(mockOffer);
      await service.create({ ...mockOffer, amount: 400000 });

      const result = await service.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by status", async () => {
      const o1 = await service.create(mockOffer);
      await service.create({ ...mockOffer, amount: 400000 });
      await service.accept(o1.id);

      const result = await service.list({ status: ["pending"] });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by buyer", async () => {
      await service.create(mockOffer);
      await service.create({ ...mockOffer, buyerId: "user_other" });

      const result = await service.list({ buyerId: "user_buyer" });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by amount range", async () => {
      await service.create({ ...mockOffer, amount: 300000 });
      await service.create({ ...mockOffer, amount: 450000 });
      await service.create({ ...mockOffer, amount: 600000 });

      const result = await service.list({ minAmount: 400000, maxAmount: 500000 });

      expect(result.items).toHaveLength(1);
    });

    it("should sort by amount", async () => {
      await service.create({ ...mockOffer, amount: 600000 });
      await service.create({ ...mockOffer, amount: 200000 });

      const result = await service.list({ sortBy: "amount", sortOrder: "asc" });

      expect(result.items[0].amount).toBe(200000);
      expect(result.items[1].amount).toBe(600000);
    });
  });

  describe("getStats", () => {
    it("should return offer statistics", async () => {
      const o1 = await service.create(mockOffer);
      const o2 = await service.create({ ...mockOffer, amount: 500000 });
      await service.accept(o1.id);
      await service.reject(o2.id);

      const stats = await service.getStats();

      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(0);
      expect(stats.accepted).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.averageAmount).toBe(462500);
      expect(stats.totalValue).toBe(925000);
    });
  });
});
