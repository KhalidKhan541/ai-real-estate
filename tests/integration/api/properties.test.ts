import { propertyService } from "@/lib/properties/property-service";
import { listingService } from "@/lib/listings/listing-service";
import { offerService } from "@/lib/offers/offer-service";

beforeEach(() => {
  propertyService.clear();
  listingService.clear();
  offerService.clear();
});

describe("API Integration: Properties", () => {
  const mockProperty = {
    title: "Beautiful Family Home",
    description: "A stunning 4-bedroom family home in Austin with modern amenities and great location.",
    price: 450000,
    address: {
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "USA",
    },
    type: "house" as const,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    yearBuilt: 2015,
    features: ["pool", "garage"],
    agentId: "agt_123",
    ownerId: "user_456",
  };

  it("should create and retrieve a property", async () => {
    const created = await propertyService.create(mockProperty);
    const found = await propertyService.getById(created.id);

    expect(found).not.toBeNull();
    expect(found!.title).toBe(mockProperty.title);
    expect(found!.price).toBe(mockProperty.price);
    expect(found!.status).toBe("active");
  });

  it("should update property price", async () => {
    const created = await propertyService.create(mockProperty);
    const updated = await propertyService.update(created.id, { price: 500000 });

    expect(updated!.price).toBe(500000);
  });

  it("should list properties with filters", async () => {
    await propertyService.create({ ...mockProperty, price: 300000 });
    await propertyService.create({ ...mockProperty, price: 500000 });
    await propertyService.create({ ...mockProperty, price: 700000 });

    const result = await propertyService.list({ minPrice: 400000, maxPrice: 600000 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].price).toBe(500000);
  });

  it("should delete a property", async () => {
    const created = await propertyService.create(mockProperty);
    const deleted = await propertyService.delete(created.id);

    expect(deleted).toBe(true);
    const found = await propertyService.getById(created.id);
    expect(found).toBeNull();
  });
});

describe("API Integration: Listings", () => {
  const mockListing = {
    propertyId: "prop_123",
    agentId: "agt_456",
    type: "sale" as const,
    price: 450000,
    description: "Beautiful home for sale in Austin with modern amenities and great location.",
    scheduledStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it("should create and publish a listing", async () => {
    const created = await listingService.create(mockListing);
    expect(created.status).toBe("draft");

    const published = await listingService.publish(created.id);
    expect(published!.status).toBe("active");
    expect(published!.publishedAt).toBeDefined();
  });

  it("should record views and inquiries", async () => {
    const created = await listingService.create(mockListing);
    await listingService.recordView(created.id);
    await listingService.recordView(created.id);
    await listingService.recordInquiry(created.id);

    const listing = await listingService.getById(created.id);
    expect(listing!.views).toBe(2);
    expect(listing!.inquiries).toBe(1);
  });

  it("should get listing stats", async () => {
    const l1 = await listingService.create(mockListing);
    const l2 = await listingService.create({ ...mockListing, price: 300000 });
    await listingService.publish(l1.id);

    const stats = await listingService.getStats();

    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.averagePrice).toBe(375000);
  });
});

describe("API Integration: Offers", () => {
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
    closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it("should create and accept an offer", async () => {
    const created = await offerService.create(mockOffer);
    expect(created.status).toBe("pending");

    const accepted = await offerService.accept(created.id, "Great offer!");
    expect(accepted!.status).toBe("accepted");
    expect(accepted!.responseNotes).toBe("Great offer!");
  });

  it("should counter an offer", async () => {
    const created = await offerService.create(mockOffer);
    const countered = await offerService.counter(
      created.id,
      430000,
      ["Remove inspection contingency"],
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    );

    expect(countered!.status).toBe("countered");
    expect(countered!.counterOffer!.amount).toBe(430000);
  });

  it("should get best offer for property", async () => {
    await offerService.create({ ...mockOffer, amount: 400000 });
    const best = await offerService.create({ ...mockOffer, amount: 450000 });
    await offerService.create({ ...mockOffer, amount: 425000 });

    const result = await offerService.getBestOffer("prop_123");

    expect(result!.id).toBe(best.id);
  });

  it("should calculate offer score", async () => {
    const offer = await offerService.create(mockOffer);
    const score = await offerService.calculateOfferScore(offer, 450000);

    expect(score.score).toBeGreaterThan(0);
    expect(score.score).toBeLessThanOrEqual(1);
    expect(score.factors).toHaveLength(5);
  });
});

describe("API Integration: Full Transaction Flow", () => {
  it("should complete property → listing → offer flow", async () => {
    const property = await propertyService.create({
      title: "Family Home",
      description: "Beautiful 4-bedroom home perfect for families with great amenities.",
      price: 450000,
      address: {
        street: "123 Main St",
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
      description: "Beautiful 4-bedroom home for sale with pool and garage.",
      scheduledStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await listingService.publish(listing.id);

    const offer = await offerService.create({
      propertyId: property.id,
      listingId: listing.id,
      buyerId: "user_buyer",
      buyerAgentId: "agt_buyer",
      sellerAgentId: "agt_123",
      amount: 425000,
      earnestMoney: 10000,
      downPayment: 85000,
      financingType: "conventional",
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(property.id).toBeDefined();
    expect(listing.status).toBe("active");
    expect(offer.status).toBe("pending");

    const accepted = await offerService.accept(offer.id);
    expect(accepted!.status).toBe("accepted");

    const updatedProperty = await propertyService.updateStatus(property.id, "pending");
    expect(updatedProperty!.status).toBe("pending");
  });
});
