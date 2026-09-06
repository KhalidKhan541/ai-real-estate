import { offerService } from "@/lib/offers/offer-service";
import { propertyService } from "@/lib/properties/property-service";
import { listingService } from "@/lib/listings/listing-service";

beforeEach(() => {
  offerService.clear();
  propertyService.clear();
  listingService.clear();
});

describe("API Integration: Offers", () => {
  const baseOffer = {
    propertyId: "prop_1",
    listingId: "lst_1",
    buyerId: "buyer_1",
    buyerAgentId: "agt_buyer",
    sellerAgentId: "agt_seller",
    amount: 425000,
    earnestMoney: 10000,
    downPayment: 85000,
    financingType: "conventional" as const,
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it("should create offer and track for property", async () => {
    const offer1 = await offerService.create(baseOffer);
    const offer2 = await offerService.create({
      ...baseOffer,
      amount: 440000,
      buyerId: "buyer_2",
    });

    const propertyOffers = await offerService.getOffersForProperty("prop_1");
    expect(propertyOffers).toHaveLength(2);
    expect(propertyOffers[0].amount).toBe(440000);
    expect(propertyOffers[1].amount).toBe(425000);
  });

  it("should accept offer and reject others", async () => {
    const offer1 = await offerService.create(baseOffer);
    const offer2 = await offerService.create({
      ...baseOffer,
      amount: 440000,
      buyerId: "buyer_2",
    });

    await offerService.accept(offer1.id);
    await offerService.reject(offer2.id, "Higher offer accepted");

    const stats = await offerService.getStats();
    expect(stats.accepted).toBe(1);
    expect(stats.rejected).toBe(1);
  });

  it("should handle counter-offer flow", async () => {
    const offer = await offerService.create(baseOffer);
    const countered = await offerService.counter(
      offer.id,
      440000,
      ["Remove inspection contingency"],
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    );

    expect(countered!.status).toBe("countered");
    expect(countered!.counterOffer!.amount).toBe(440000);
    expect(countered!.counterOffer!.terms).toContain("Remove inspection contingency");
  });

  it("should calculate best offer score", async () => {
    const cashOffer = await offerService.create({
      ...baseOffer,
      amount: 420000,
      financingType: "cash",
    });
    const financedOffer = await offerService.create({
      ...baseOffer,
      amount: 430000,
      financingType: "conventional",
    });

    const cashScore = await offerService.calculateOfferScore(cashOffer, 450000);
    const financedScore = await offerService.calculateOfferScore(financedOffer, 450000);

    expect(cashScore.score).toBeGreaterThan(0);
    expect(financedScore.score).toBeGreaterThan(0);
  });

  it("should find best offer for property", async () => {
    await offerService.create({ ...baseOffer, amount: 400000 });
    const best = await offerService.create({ ...baseOffer, amount: 450000 });
    await offerService.create({ ...baseOffer, amount: 425000 });

    const bestOffer = await offerService.getBestOffer("prop_1");
    expect(bestOffer!.id).toBe(best.id);
  });

  it("should find expired offers", async () => {
    const expired = await offerService.create({
      ...baseOffer,
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await offerService.create({
      ...baseOffer,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const expiredOffers = await offerService.getExpiredOffers();
    expect(expiredOffers).toHaveLength(1);
    expect(expiredOffers[0].id).toBe(expired.id);
  });

  it("should complete full offer lifecycle", async () => {
    const property = await propertyService.create({
      title: "Home",
      description: "A beautiful home for sale with modern amenities.",
      price: 450000,
      address: {
        street: "123 Main",
        city: "Austin",
        state: "TX",
        zip: "78701",
        country: "USA",
      },
      type: "house",
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2500,
      yearBuilt: 2015,
      agentId: "agt_123",
      ownerId: "user_456",
    });

    const listing = await listingService.create({
      propertyId: property.id,
      agentId: "agt_123",
      type: "sale",
      price: 450000,
      description: "Beautiful home available for sale in Austin.",
      scheduledStartDate: new Date().toISOString(),
    });
    await listingService.publish(listing.id);

    const offer = await offerService.create({
      ...baseOffer,
      propertyId: property.id,
      listingId: listing.id,
    });

    expect(offer.status).toBe("pending");

    const countered = await offerService.counter(
      offer.id,
      435000,
      ["Remove financing contingency"],
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    );
    expect(countered!.status).toBe("countered");

    const finalOffer = await offerService.accept(offer.id);
    expect(finalOffer!.status).toBe("accepted");

    await propertyService.updateStatus(property.id, "pending");

    const updatedProperty = await propertyService.getById(property.id);
    expect(updatedProperty!.status).toBe("pending");
  });

  it("should track offer statistics", async () => {
    await offerService.create(baseOffer);
    await offerService.create({ ...baseOffer, amount: 500000 });
    const o3 = await offerService.create({ ...baseOffer, amount: 475000 });

    await offerService.accept(o3.id);

    const stats = await offerService.getStats();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(2);
    expect(stats.accepted).toBe(1);
    expect(stats.averageAmount).toBe(466667);
    expect(stats.totalValue).toBe(1400000);
  });
});
