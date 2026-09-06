import { agentService, AgentService } from "@/lib/agents/agent-service";

const service = new AgentService();

beforeEach(() => {
  service.clear();
});

const mockAgent = {
  userId: "user_123",
  name: "John Smith",
  email: "john@realty.com",
  phone: "(512) 555-1234",
  licenseNumber: "TX-123456",
  licenseState: "TX",
  licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  brokerage: "Austin Realty Group",
  specializations: ["luxury", "first-time-buyers"],
  serviceAreas: ["Austin", "Round Rock"],
  experience: 5,
  bio: "John Smith is an experienced real estate agent with over 5 years of expertise in the Austin market. He specializes in luxury homes and helping first-time buyers find their dream homes.",
  languages: ["English", "Spanish"],
  certifications: ["ABR", "SRS"],
};

describe("AgentService", () => {
  describe("create", () => {
    it("should create a new agent", async () => {
      const agent = await service.create(mockAgent);

      expect(agent).toBeDefined();
      expect(agent.id).toMatch(/^agt_/);
      expect(agent.name).toBe("John Smith");
      expect(agent.email).toBe("john@realty.com");
      expect(agent.phone).toBe("(512) 555-1234");
      expect(agent.licenseNumber).toBe("TX-123456");
      expect(agent.brokerage).toBe("Austin Realty Group");
      expect(agent.rating).toBe(0);
      expect(agent.reviewCount).toBe(0);
      expect(agent.totalSales).toBe(0);
      expect(agent.totalRevenue).toBe(0);
      expect(agent.availability).toBe("available");
      expect(agent.isVerified).toBe(false);
      expect(agent.isPremium).toBe(false);
    });

    it("should set default values", async () => {
      const agent = await service.create({
        ...mockAgent,
        specializations: undefined,
        serviceAreas: undefined,
        experience: undefined,
        languages: undefined,
        certifications: undefined,
      });

      expect(agent.specializations).toEqual([]);
      expect(agent.serviceAreas).toEqual([]);
      expect(agent.experience).toBe(0);
      expect(agent.languages).toEqual(["English"]);
      expect(agent.certifications).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return agent by id", async () => {
      const created = await service.create(mockAgent);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("getByUserId", () => {
    it("should return agent by user id", async () => {
      const created = await service.create(mockAgent);
      const found = await service.getByUserId("user_123");

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("should return null for non-existent user", async () => {
      const found = await service.getByUserId("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update agent fields", async () => {
      const created = await service.create(mockAgent);
      const updated = await service.update(created.id, {
        name: "John Updated",
        phone: "(512) 555-9999",
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("John Updated");
      expect(updated!.phone).toBe("(512) 555-9999");
      expect(updated!.updatedAt).not.toBe(created.updatedAt);
    });

    it("should update availability", async () => {
      const created = await service.create(mockAgent);
      const updated = await service.update(created.id, { availability: "busy" });

      expect(updated!.availability).toBe("busy");
    });

    it("should return null for non-existent agent", async () => {
      const updated = await service.update("non_existent", { name: "New" });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete an agent", async () => {
      const created = await service.create(mockAgent);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);
      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent agent", async () => {
      const deleted = await service.delete("non_existent");

      expect(deleted).toBe(false);
    });
  });

  describe("updateRating", () => {
    it("should update agent rating", async () => {
      const created = await service.create(mockAgent);

      await service.updateRating(created.id, 5);
      await service.updateRating(created.id, 4);
      const updated = await service.updateRating(created.id, 3);

      expect(updated!.rating).toBe(4);
      expect(updated!.reviewCount).toBe(3);
    });

    it("should return null for non-existent agent", async () => {
      const result = await service.updateRating("non_existent", 5);

      expect(result).toBeNull();
    });
  });

  describe("incrementSales", () => {
    it("should increment sales and revenue", async () => {
      const created = await service.create(mockAgent);

      await service.incrementSales(created.id, 450000);
      await service.incrementSales(created.id, 300000);
      const updated = await service.incrementSales(created.id, 500000);

      expect(updated!.totalSales).toBe(3);
      expect(updated!.totalRevenue).toBe(1250000);
    });
  });

  describe("setAvailability", () => {
    it("should update availability", async () => {
      const created = await service.create(mockAgent);
      const updated = await service.setAvailability(created.id, "offline");

      expect(updated!.availability).toBe("offline");
    });
  });

  describe("verifyAgent", () => {
    it("should mark agent as verified", async () => {
      const created = await service.create(mockAgent);
      const verified = await service.verifyAgent(created.id);

      expect(verified!.isVerified).toBe(true);
    });
  });

  describe("promoteToPremium", () => {
    it("should mark agent as premium", async () => {
      const created = await service.create(mockAgent);
      const promoted = await service.promoteToPremium(created.id);

      expect(promoted!.isPremium).toBe(true);
    });
  });

  describe("list", () => {
    it("should return all agents", async () => {
      await service.create(mockAgent);
      await service.create({ ...mockAgent, name: "Jane Doe" });

      const result = await service.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by specializations", async () => {
      await service.create(mockAgent);
      await service.create({
        ...mockAgent,
        name: "Jane",
        specializations: ["commercial"],
      });

      const result = await service.list({ specializations: ["luxury"] });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].specializations).toContain("luxury");
    });

    it("should filter by service areas", async () => {
      await service.create(mockAgent);
      await service.create({
        ...mockAgent,
        name: "Jane",
        serviceAreas: ["Houston"],
      });

      const result = await service.list({ serviceAreas: ["Austin"] });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by rating", async () => {
      const a1 = await service.create(mockAgent);
      const a2 = await service.create({ ...mockAgent, name: "Jane" });

      await service.updateRating(a1.id, 5);
      await service.updateRating(a2.id, 3);

      const result = await service.list({ minRating: 4 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("John Smith");
    });

    it("should filter by availability", async () => {
      await service.create(mockAgent);
      await service.create({
        ...mockAgent,
        name: "Jane",
        availability: "busy",
      });

      const result = await service.list({ availability: "available" });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by languages", async () => {
      await service.create(mockAgent);
      await service.create({
        ...mockAgent,
        name: "Jane",
        languages: ["French"],
      });

      const result = await service.list({ languages: ["Spanish"] });

      expect(result.items).toHaveLength(1);
    });

    it("should sort by rating", async () => {
      const a1 = await service.create(mockAgent);
      const a2 = await service.create({ ...mockAgent, name: "Jane" });
      await service.updateRating(a1.id, 5);
      await service.updateRating(a2.id, 3);

      const result = await service.list({ sortBy: "rating", sortOrder: "desc" });

      expect(result.items[0].rating).toBeGreaterThanOrEqual(result.items[1].rating);
    });
  });

  describe("getTopAgents", () => {
    it("should return top agents by rating and review count", async () => {
      const a1 = await service.create(mockAgent);
      const a2 = await service.create({ ...mockAgent, name: "Jane" });
      await service.updateRating(a1.id, 5);
      await service.updateRating(a1.id, 5);
      await service.updateRating(a2.id, 4);

      const top = await service.getTopAgents(5);

      expect(top.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("searchByName", () => {
    it("should find agents by name", async () => {
      await service.create(mockAgent);
      await service.create({ ...mockAgent, name: "Jane Doe" });

      const results = await service.searchByName("John");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("John Smith");
    });

    it("should be case insensitive", async () => {
      await service.create(mockAgent);

      const results = await service.searchByName("john");

      expect(results).toHaveLength(1);
    });
  });

  describe("isLicenseValid", () => {
    it("should return true for valid license", async () => {
      const created = await service.create(mockAgent);

      const valid = await service.isLicenseValid(created.id);

      expect(valid).toBe(true);
    });

    it("should return false for expired license", async () => {
      const created = await service.create({
        ...mockAgent,
        licenseExpiry: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const valid = await service.isLicenseValid(created.id);

      expect(valid).toBe(false);
    });

    it("should return false for non-existent agent", async () => {
      const valid = await service.isLicenseValid("non_existent");

      expect(valid).toBe(false);
    });
  });
});
