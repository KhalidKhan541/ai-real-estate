import { listingService } from "@/lib/listings/listing-service";
import { propertyService } from "@/lib/properties/property-service";

beforeEach(() => {
  listingService.clear();
  propertyService.clear();
});

describe("API Integration: Listings", () => {
  const mockProperty = {
    title: "Test Property",
    description: "A test property for integration testing with all required fields.",
    price: 400000,
    address: {
      street: "456 Oak Ave",
      city: "Austin",
      state: "TX",
      zip: "78702",
      country: "USA",
    },
    type: "house" as const,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2000,
    yearBuilt: 2010,
    agentId: "agt_001",
    ownerId: "user_001",
  };

  const mockListing = {
    propertyId: "",
    agentId: "agt_001",
    type: "sale" as const,
    price: 400000,
    description: "Beautiful property available for sale with modern features and great location.",
    highlights: ["Pool", "Garage"],
    scheduledStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  it("should create listing linked to property", async () => {
    const property = await propertyService.create(mockProperty);
    const listing = await listingService.create({
      ...mockListing,
      propertyId: property.id,
    });

    expect(listing.propertyId).toBe(property.id);
    expect(listing.price).toBe(property.price);
  });

  it("should update listing and track views", async () => {
    const property = await propertyService.create(mockProperty);
    const listing = await listingService.create({
      ...mockListing,
      propertyId: property.id,
    });

    await listingService.publish(listing.id);
    await listingService.recordView(listing.id);
    await listingService.recordView(listing.id);
    await listingService.recordSave(listing.id);

    const updated = await listingService.getById(listing.id);
    expect(updated!.status).toBe("active");
    expect(updated!.views).toBe(2);
    expect(updated!.saves).toBe(1);
  });

  it("should list active listings by agent", async () => {
    const property = await propertyService.create(mockProperty);
    const l1 = await listingService.create({
      ...mockListing,
      propertyId: property.id,
      agentId: "agt_001",
    });
    const l2 = await listingService.create({
      ...mockListing,
      propertyId: property.id,
      agentId: "agt_002",
    });

    await listingService.publish(l1.id);
    await listingService.publish(l2.id);

    const agentListings = await listingService.getActiveByAgent("agt_001");
    expect(agentListings).toHaveLength(1);
    expect(agentListings[0].agentId).toBe("agt_001");
  });

  it("should filter listings by price range", async () => {
    const p1 = await propertyService.create({ ...mockProperty, price: 200000 });
    const p2 = await propertyService.create({ ...mockProperty, price: 400000 });
    const p3 = await propertyService.create({ ...mockProperty, price: 600000 });

    await listingService.create({ ...mockListing, propertyId: p1.id, price: 200000 });
    await listingService.create({ ...mockListing, propertyId: p2.id, price: 400000 });
    await listingService.create({ ...mockListing, propertyId: p3.id, price: 600000 });

    const result = await listingService.list({ minPrice: 300000, maxPrice: 500000 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].price).toBe(400000);
  });

  it("should close listing and track statistics", async () => {
    const property = await propertyService.create(mockProperty);
    const listing = await listingService.create({
      ...mockListing,
      propertyId: property.id,
    });

    await listingService.publish(listing.id);
    await listingService.recordView(listing.id);
    await listingService.close(listing.id);

    const stats = await listingService.getStats();
    expect(stats.closed).toBe(1);
    expect(stats.active).toBe(0);
    expect(stats.totalViews).toBe(1);
  });

  it("should find expiring listings", async () => {
    const property = await propertyService.create(mockProperty);
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const far = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const l1 = await listingService.create({
      ...mockListing,
      propertyId: property.id,
      scheduledEndDate: soon,
    });
    await listingService.create({
      ...mockListing,
      propertyId: property.id,
      scheduledEndDate: far,
    });

    await listingService.publish(l1.id);
    const expiring = await listingService.getExpiringSoon(7);

    expect(expiring).toHaveLength(1);
  });
});
