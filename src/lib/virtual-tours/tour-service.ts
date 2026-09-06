export interface VirtualTour {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  type: "3d" | "panorama" | "video" | "slideshow";
  status: "processing" | "ready" | "failed";
  scenes: TourScene[];
  thumbnails: string[];
  totalViews: number;
  totalDuration: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface TourScene {
  id: string;
  name: string;
  type: "room" | "exterior" | "aerial" | "detail";
  mediaUrl: string;
  thumbnailUrl?: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  hotspots: TourHotspot[];
  notes?: string;
  order: number;
}

export interface TourHotspot {
  id: string;
  type: "navigation" | "info" | "measurement" | "annotation";
  position: { x: number; y: number; z: number };
  targetSceneId?: string;
  label?: string;
  description?: string;
  icon?: string;
}

export interface TourSession {
  id: string;
  tourId: string;
  userId?: string;
  startedAt: string;
  lastActiveAt: string;
  viewedScenes: string[];
  duration: number;
  device: string;
  browser: string;
}

export interface VirtualTourCreateInput {
  propertyId: string;
  title: string;
  description?: string;
  type: VirtualTour["type"];
  scenes?: TourScene[];
  createdById: string;
}

export interface TourFilter {
  propertyId?: string;
  type?: VirtualTour["type"];
  status?: VirtualTour["status"][];
  createdById?: string;
  sortBy?: "createdAt" | "totalViews" | "totalDuration";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

const virtualTours: Map<string, VirtualTour> = new Map();
const tourSessions: Map<string, TourSession> = new Map();

export class TourService {
  async create(input: VirtualTourCreateInput): Promise<VirtualTour> {
    const id = `tour_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    const tour: VirtualTour = {
      id,
      propertyId: input.propertyId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: "processing",
      scenes: input.scenes || [],
      thumbnails: [],
      totalViews: 0,
      totalDuration: 0,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
    };

    virtualTours.set(id, tour);
    return tour;
  }

  async getById(id: string): Promise<VirtualTour | null> {
    return virtualTours.get(id) || null;
  }

  async update(
    id: string,
    input: Partial<Omit<VirtualTourCreateInput, "createdById">>
  ): Promise<VirtualTour | null> {
    const existing = virtualTours.get(id);
    if (!existing) return null;

    const updated: VirtualTour = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    if (input.scenes) {
      updated.totalDuration = input.scenes.length * 30;
    }

    virtualTours.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return virtualTours.delete(id);
  }

  async publish(id: string): Promise<VirtualTour | null> {
    const tour = virtualTours.get(id);
    if (!tour) return null;

    tour.status = "ready";
    tour.publishedAt = new Date().toISOString();
    tour.updatedAt = new Date().toISOString();
    return tour;
  }

  async list(filter: TourFilter = {}): Promise<{ items: VirtualTour[]; total: number; page: number; limit: number }> {
    let results = Array.from(virtualTours.values());

    if (filter.propertyId) {
      results = results.filter((t) => t.propertyId === filter.propertyId);
    }
    if (filter.type) {
      results = results.filter((t) => t.type === filter.type);
    }
    if (filter.status && filter.status.length > 0) {
      results = results.filter((t) => filter.status!.includes(t.status));
    }
    if (filter.createdById) {
      results = results.filter((t) => t.createdById === filter.createdById);
    }

    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = filter.sortOrder || "desc";
    results.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const start = (page - 1) * limit;
    const paginated = results.slice(start, start + limit);

    return {
      items: paginated,
      total: results.length,
      page,
      limit,
    };
  }

  async addScene(
    tourId: string,
    scene: Omit<TourScene, "id">
  ): Promise<TourScene | null> {
    const tour = virtualTours.get(tourId);
    if (!tour) return null;

    const newScene: TourScene = {
      id: `scene_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...scene,
    };

    tour.scenes.push(newScene);
    tour.scenes.sort((a, b) => a.order - b.order);
    tour.totalDuration = tour.scenes.length * 30;
    tour.updatedAt = new Date().toISOString();
    return newScene;
  }

  async removeScene(tourId: string, sceneId: string): Promise<boolean> {
    const tour = virtualTours.get(tourId);
    if (!tour) return false;

    const initialLength = tour.scenes.length;
    tour.scenes = tour.scenes.filter((s) => s.id !== sceneId);
    if (tour.scenes.length < initialLength) {
      tour.totalDuration = tour.scenes.length * 30;
      tour.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  async addHotspot(
    tourId: string,
    sceneId: string,
    hotspot: Omit<TourHotspot, "id">
  ): Promise<TourHotspot | null> {
    const tour = virtualTours.get(tourId);
    if (!tour) return null;

    const scene = tour.scenes.find((s) => s.id === sceneId);
    if (!scene) return null;

    const newHotspot: TourHotspot = {
      id: `hs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...hotspot,
    };

    scene.hotspots.push(newHotspot);
    tour.updatedAt = new Date().toISOString();
    return newHotspot;
  }

  async recordView(id: string): Promise<VirtualTour | null> {
    const tour = virtualTours.get(id);
    if (!tour) return null;

    tour.totalViews += 1;
    tour.updatedAt = new Date().toISOString();
    return tour;
  }

  async startSession(
    tourId: string,
    userId: string | undefined,
    device: string,
    browser: string
  ): Promise<TourSession> {
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    const session: TourSession = {
      id,
      tourId,
      userId,
      startedAt: now,
      lastActiveAt: now,
      viewedScenes: [],
      duration: 0,
      device,
      browser,
    };

    tourSessions.set(id, session);
    return session;
  }

  async updateSession(
    sessionId: string,
    sceneId: string
  ): Promise<TourSession | null> {
    const session = tourSessions.get(sessionId);
    if (!session) return null;

    if (!session.viewedScenes.includes(sceneId)) {
      session.viewedScenes.push(sceneId);
    }
    session.lastActiveAt = new Date().toISOString();
    session.duration =
      (new Date(session.lastActiveAt).getTime() - new Date(session.startedAt).getTime()) / 1000;

    return session;
  }

  async endSession(sessionId: string): Promise<TourSession | null> {
    const session = tourSessions.get(sessionId);
    if (!session) return null;

    session.lastActiveAt = new Date().toISOString();
    session.duration =
      (new Date(session.lastActiveAt).getTime() - new Date(session.startedAt).getTime()) / 1000;

    return session;
  }

  async getTourStats(tourId: string): Promise<{
    totalViews: number;
    totalSessions: number;
    averageDuration: number;
    completionRate: number;
    popularScenes: Array<{ sceneId: string; views: number }>;
  }> {
    const tour = virtualTours.get(tourId);
    if (!tour) {
      return {
        totalViews: 0,
        totalSessions: 0,
        averageDuration: 0,
        completionRate: 0,
        popularScenes: [],
      };
    }

    const sessions = Array.from(tourSessions.values()).filter(
      (s) => s.tourId === tourId
    );

    const totalSessions = sessions.length;
    const averageDuration =
      totalSessions > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions
        : 0;

    const completedSessions = sessions.filter(
      (s) => s.viewedScenes.length >= tour.scenes.length
    ).length;
    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const sceneViewCounts: Record<string, number> = {};
    for (const session of sessions) {
      for (const sceneId of session.viewedScenes) {
        sceneViewCounts[sceneId] = (sceneViewCounts[sceneId] || 0) + 1;
      }
    }

    const popularScenes = Object.entries(sceneViewCounts)
      .map(([sceneId, views]) => ({ sceneId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalViews: tour.totalViews,
      totalSessions,
      averageDuration: Math.round(averageDuration * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      popularScenes,
    };
  }

  async getByPropertyId(propertyId: string): Promise<VirtualTour[]> {
    return Array.from(virtualTours.values()).filter(
      (t) => t.propertyId === propertyId
    );
  }

  async getRecentTours(limit: number = 10): Promise<VirtualTour[]> {
    return Array.from(virtualTours.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  clear(): void {
    virtualTours.clear();
    tourSessions.clear();
  }
}

export const tourService = new TourService();
