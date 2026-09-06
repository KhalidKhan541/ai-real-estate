import { tourService, TourService } from "@/lib/virtual-tours/tour-service";

const service = new TourService();

beforeEach(() => {
  service.clear();
});

const mockTour = {
  propertyId: "prop_123",
  title: "Luxury Home Virtual Tour",
  description: "360-degree virtual tour of a stunning luxury property.",
  type: "3d" as const,
  createdById: "user_123",
};

const mockScene = {
  name: "Living Room",
  type: "room" as const,
  mediaUrl: "https://example.com/scene1.jpg",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  hotspots: [],
  order: 1,
};

describe("TourService", () => {
  describe("create", () => {
    it("should create a new virtual tour", async () => {
      const tour = await service.create(mockTour);

      expect(tour).toBeDefined();
      expect(tour.id).toMatch(/^tour_/);
      expect(tour.propertyId).toBe("prop_123");
      expect(tour.title).toBe("Luxury Home Virtual Tour");
      expect(tour.type).toBe("3d");
      expect(tour.status).toBe("processing");
      expect(tour.scenes).toEqual([]);
      expect(tour.totalViews).toBe(0);
      expect(tour.totalDuration).toBe(0);
    });

    it("should accept initial scenes", async () => {
      const tour = await service.create({
        ...mockTour,
        scenes: [
          {
            id: "scene_1",
            ...mockScene,
          },
        ],
      });

      expect(tour.scenes).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("should return tour by id", async () => {
      const created = await service.create(mockTour);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update tour fields", async () => {
      const created = await service.create(mockTour);
      const updated = await service.update(created.id, {
        title: "Updated Tour Title",
        description: "Updated description for the virtual tour.",
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated Tour Title");
    });

    it("should return null for non-existent tour", async () => {
      const updated = await service.update("non_existent", { title: "New" });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a tour", async () => {
      const created = await service.create(mockTour);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);
      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent tour", async () => {
      const deleted = await service.delete("non_existent");

      expect(deleted).toBe(false);
    });
  });

  describe("publish", () => {
    it("should set tour to ready status", async () => {
      const created = await service.create(mockTour);
      const published = await service.publish(created.id);

      expect(published!.status).toBe("ready");
      expect(published!.publishedAt).toBeDefined();
    });
  });

  describe("addScene", () => {
    it("should add a scene to tour", async () => {
      const tour = await service.create(mockTour);
      const scene = await service.addScene(tour.id, mockScene);

      expect(scene).not.toBeNull();
      expect(scene!.id).toMatch(/^scene_/);
      expect(scene!.name).toBe("Living Room");
      expect(scene!.type).toBe("room");

      const updated = await service.getById(tour.id);
      expect(updated!.scenes).toHaveLength(1);
      expect(updated!.totalDuration).toBe(30);
    });

    it("should return null for non-existent tour", async () => {
      const scene = await service.addScene("non_existent", mockScene);

      expect(scene).toBeNull();
    });
  });

  describe("removeScene", () => {
    it("should remove a scene from tour", async () => {
      const tour = await service.create(mockTour);
      const scene = await service.addScene(tour.id, mockScene);

      const removed = await service.removeScene(tour.id, scene!.id);

      expect(removed).toBe(true);
      const updated = await service.getById(tour.id);
      expect(updated!.scenes).toHaveLength(0);
    });

    it("should return false for non-existent scene", async () => {
      const tour = await service.create(mockTour);
      const removed = await service.removeScene(tour.id, "non_existent");

      expect(removed).toBe(false);
    });
  });

  describe("addHotspot", () => {
    it("should add a hotspot to a scene", async () => {
      const tour = await service.create(mockTour);
      const scene = await service.addScene(tour.id, mockScene);

      const hotspot = await service.addHotspot(tour.id, scene!.id, {
        type: "navigation",
        position: { x: 1, y: 0, z: 0 },
        targetSceneId: "scene_2",
        label: "Go to Kitchen",
      });

      expect(hotspot).not.toBeNull();
      expect(hotspot!.id).toMatch(/^hs_/);
      expect(hotspot!.type).toBe("navigation");
      expect(hotspot!.label).toBe("Go to Kitchen");
    });

    it("should return null for non-existent tour", async () => {
      const hotspot = await service.addHotspot("non_existent", "scene_1", {
        type: "info",
        position: { x: 0, y: 0, z: 0 },
      });

      expect(hotspot).toBeNull();
    });

    it("should return null for non-existent scene", async () => {
      const tour = await service.create(mockTour);
      const hotspot = await service.addHotspot(tour.id, "non_existent", {
        type: "info",
        position: { x: 0, y: 0, z: 0 },
      });

      expect(hotspot).toBeNull();
    });
  });

  describe("recordView", () => {
    it("should increment view count", async () => {
      const tour = await service.create(mockTour);

      await service.recordView(tour.id);
      await service.recordView(tour.id);
      const updated = await service.recordView(tour.id);

      expect(updated!.totalViews).toBe(3);
    });

    it("should return null for non-existent tour", async () => {
      const result = await service.recordView("non_existent");

      expect(result).toBeNull();
    });
  });

  describe("session management", () => {
    it("should start a session", async () => {
      const tour = await service.create(mockTour);
      const session = await service.startSession(tour.id, "user_123", "Desktop", "Chrome");

      expect(session).toBeDefined();
      expect(session.id).toMatch(/^sess_/);
      expect(session.tourId).toBe(tour.id);
      expect(session.userId).toBe("user_123");
      expect(session.device).toBe("Desktop");
      expect(session.browser).toBe("Chrome");
      expect(session.viewedScenes).toEqual([]);
      expect(session.duration).toBe(0);
    });

    it("should update session with viewed scenes", async () => {
      const tour = await service.create(mockTour);
      const scene = await service.addScene(tour.id, mockScene);
      const session = await service.startSession(tour.id, "user_123", "Desktop", "Chrome");

      const updated = await service.updateSession(session.id, scene!.id);

      expect(updated).not.toBeNull();
      expect(updated!.viewedScenes).toContain(scene!.id);
    });

    it("should not duplicate viewed scenes", async () => {
      const tour = await service.create(mockTour);
      const scene = await service.addScene(tour.id, mockScene);
      const session = await service.startSession(tour.id, "user_123", "Desktop", "Chrome");

      await service.updateSession(session.id, scene!.id);
      const updated = await service.updateSession(session.id, scene!.id);

      expect(updated!.viewedScenes).toHaveLength(1);
    });

    it("should end session and calculate duration", async () => {
      const tour = await service.create(mockTour);
      const session = await service.startSession(tour.id, "user_123", "Desktop", "Chrome");

      const ended = await service.endSession(session.id);

      expect(ended).not.toBeNull();
      expect(ended!.duration).toBeGreaterThanOrEqual(0);
    });

    it("should return null for non-existent session", async () => {
      const result = await service.updateSession("non_existent", "scene_1");

      expect(result).toBeNull();
    });
  });

  describe("getTourStats", () => {
    it("should return tour statistics", async () => {
      const tour = await service.create(mockTour);
      const scene1 = await service.addScene(tour.id, { ...mockScene, order: 1 });
      const scene2 = await service.addScene(tour.id, { ...mockScene, name: "Kitchen", order: 2 });

      await service.recordView(tour.id);
      await service.recordView(tour.id);

      const session = await service.startSession(tour.id, "user_1", "Desktop", "Chrome");
      await service.updateSession(session.id, scene1!.id);
      await service.updateSession(session.id, scene2!.id);
      await service.endSession(session.id);

      const stats = await service.getTourStats(tour.id);

      expect(stats.totalViews).toBe(2);
      expect(stats.totalSessions).toBe(1);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
      expect(stats.completionRate).toBe(100);
      expect(stats.popularScenes).toHaveLength(2);
    });

    it("should handle empty tour", async () => {
      const stats = await service.getTourStats("non_existent");

      expect(stats.totalViews).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe("getByPropertyId", () => {
    it("should return tours for a property", async () => {
      await service.create(mockTour);
      await service.create({ ...mockTour, propertyId: "prop_other" });
      await service.create({ ...mockTour, propertyId: "prop_123" });

      const tours = await service.getByPropertyId("prop_123");

      expect(tours).toHaveLength(2);
    });
  });

  describe("getRecentTours", () => {
    it("should return recent tours", async () => {
      await service.create(mockTour);
      await service.create({ ...mockTour, title: "Tour 2" });
      await service.create({ ...mockTour, title: "Tour 3" });

      const tours = await service.getRecentTours(2);

      expect(tours).toHaveLength(2);
    });
  });

  describe("list", () => {
    it("should list tours with filters", async () => {
      await service.create(mockTour);
      await service.create({ ...mockTour, type: "panorama" });

      const result = await service.list({ type: "3d" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("3d");
    });

    it("should filter by status", async () => {
      const t1 = await service.create(mockTour);
      await service.create({ ...mockTour, title: "Tour 2" });
      await service.publish(t1.id);

      const result = await service.list({ status: ["ready"] });

      expect(result.items).toHaveLength(1);
    });
  });
});
