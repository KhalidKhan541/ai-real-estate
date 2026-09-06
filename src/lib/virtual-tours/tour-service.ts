import {
  VirtualTour,
  TourStop,
  TourHotspot,
  TourAnalytics,
  CreateVirtualTourInput,
  CreateTourStopInput,
  CreateTourHotspotInput,
  TourMeasurement,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class TourService {
  private static instance: TourService;

  static getInstance(): TourService {
    if (!TourService.instance) {
      TourService.instance = new TourService();
    }
    return TourService.instance;
  }

  async createTour(input: CreateVirtualTourInput, userId: string): Promise<VirtualTour> {
    const tour = await prisma.virtualTour.create({
      data: {
        title: input.title,
        description: input.description,
        propertyId: input.propertyId,
        tourType: input.tourType,
        coverImage: input.coverImage,
        status: 'DRAFT',
        isPublished: input.isPublished ?? false,
        createdBy: userId,
      },
    });

    return this.formatTour(tour);
  }

  async updateTour(id: string, updates: Partial<CreateVirtualTourInput>): Promise<VirtualTour> {
    const tour = await prisma.virtualTour.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.tourType && { tourType: updates.tourType }),
        ...(updates.coverImage !== undefined && { coverImage: updates.coverImage }),
        ...(updates.isPublished !== undefined && {
          isPublished: updates.isPublished,
          status: updates.isPublished ? 'ACTIVE' : 'DRAFT',
        }),
      },
    });

    return this.formatTour(tour);
  }

  async deleteTour(id: string): Promise<void> {
    await prisma.virtualTour.delete({ where: { id } });
  }

  async getTourById(id: string): Promise<VirtualTour | null> {
    const tour = await prisma.virtualTour.findUnique({ where: { id } });
    return tour ? this.formatTour(tour) : null;
  }

  async getTourWithStops(id: string): Promise<(VirtualTour & { stops: TourStop[] }) | null> {
    const tour = await prisma.virtualTour.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { sortOrder: 'asc' },
          include: {
            hotspots: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!tour) return null;

    return {
      ...this.formatTour(tour),
      stops: tour.stops.map(s => this.formatStop(s)),
    };
  }

  async getToursByProperty(propertyId: string): Promise<VirtualTour[]> {
    const tours = await prisma.virtualTour.findMany({
      where: { propertyId, status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
    });

    return tours.map(this.formatTour);
  }

  async publishTour(id: string): Promise<VirtualTour> {
    const tour = await prisma.virtualTour.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!tour) throw new Error('Tour not found');
    if (tour.stops.length === 0) throw new Error('Tour must have at least one stop');

    const updated = await prisma.virtualTour.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        isPublished: true,
      },
    });

    return this.formatTour(updated);
  }

  async unpublishTour(id: string): Promise<VirtualTour> {
    const updated = await prisma.virtualTour.update({
      where: { id },
      data: {
        status: 'DRAFT',
        isPublished: false,
      },
    });

    return this.formatTour(updated);
  }

  async addStop(tourId: string, input: CreateTourStopInput): Promise<TourStop> {
    const maxOrder = await prisma.tourStop.findFirst({
      where: { tourId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const stop = await prisma.tourStop.create({
      data: {
        tourId,
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        panoramicUrl: input.panoramicUrl,
        videoUrl: input.videoUrl,
        sortOrder: input.sortOrder ?? ((maxOrder?.sortOrder ?? -1) + 1),
        floorLevel: input.floorLevel,
        roomType: input.roomType,
        positionX: input.positionX,
        positionY: input.positionY,
        positionZ: input.positionZ,
      },
      include: { hotspots: true },
    });

    return this.formatStop(stop);
  }

  async updateStop(id: string, updates: Partial<CreateTourStopInput>): Promise<TourStop> {
    const stop = await prisma.tourStop.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
        ...(updates.panoramicUrl !== undefined && { panoramicUrl: updates.panoramicUrl }),
        ...(updates.videoUrl !== undefined && { videoUrl: updates.videoUrl }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        ...(updates.floorLevel !== undefined && { floorLevel: updates.floorLevel }),
        ...(updates.roomType !== undefined && { roomType: updates.roomType }),
        ...(updates.positionX !== undefined && { positionX: updates.positionX }),
        ...(updates.positionY !== undefined && { positionY: updates.positionY }),
        ...(updates.positionZ !== undefined && { positionZ: updates.positionZ }),
      },
      include: { hotspots: true },
    });

    return this.formatStop(stop);
  }

  async deleteStop(id: string): Promise<void> {
    await prisma.tourStop.delete({ where: { id } });
  }

  async reorderStops(tourId: string, stopIds: string[]): Promise<void> {
    const updates = stopIds.map((stopId, index) =>
      prisma.tourStop.update({
        where: { id: stopId },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);
  }

  async addHotspot(stopId: string, input: CreateTourHotspotInput): Promise<TourHotspot> {
    const hotspot = await prisma.tourHotspot.create({
      data: {
        stopId,
        type: input.type,
        title: input.title,
        description: input.description,
        icon: input.icon,
        positionX: input.positionX,
        positionY: input.positionY,
        targetStopId: input.targetStopId,
        targetUrl: input.targetUrl,
        mediaUrl: input.mediaUrl,
        linkedPropertyId: input.linkedPropertyId,
      },
    });

    return this.formatHotspot(hotspot);
  }

  async updateHotspot(id: string, updates: Partial<CreateTourHotspotInput>): Promise<TourHotspot> {
    const hotspot = await prisma.tourHotspot.update({
      where: { id },
      data: {
        ...(updates.type && { type: updates.type }),
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(updates.positionX !== undefined && { positionX: updates.positionX }),
        ...(updates.positionY !== undefined && { positionY: updates.positionY }),
        ...(updates.targetStopId !== undefined && { targetStopId: updates.targetStopId }),
        ...(updates.targetUrl !== undefined && { targetUrl: updates.targetUrl }),
        ...(updates.mediaUrl !== undefined && { mediaUrl: updates.mediaUrl }),
        ...(updates.linkedPropertyId !== undefined && { linkedPropertyId: updates.linkedPropertyId }),
      },
    });

    return this.formatHotspot(hotspot);
  }

  async deleteHotspot(id: string): Promise<void> {
    await prisma.tourHotspot.delete({ where: { id } });
  }

  async addMeasurement(hotspotId: string, measurement: Omit<TourMeasurement, 'id' | 'hotspotId'>): Promise<TourMeasurement> {
    const created = await prisma.tourMeasurement.create({
      data: {
        hotspotId,
        value: measurement.value,
        unit: measurement.unit,
        startX: measurement.startX,
        startY: measurement.startY,
        endX: measurement.endX,
        endY: measurement.endY,
      },
    });

    return {
      id: created.id,
      hotspotId: created.hotspotId,
      value: Number(created.value),
      unit: created.unit as TourMeasurement['unit'],
      startX: Number(created.startX),
      startY: Number(created.startY),
      endX: Number(created.endX),
      endY: Number(created.endY),
    };
  }

  async recordTourView(tourId: string, visitorId: string, duration: number, completed: boolean): Promise<void> {
    await prisma.tourView.create({
      data: {
        tourId,
        visitorId,
        duration,
        completed,
        deviceType: 'unknown',
        browser: 'unknown',
      },
    });

    await prisma.virtualTour.update({
      where: { id: tourId },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async recordStopVisit(stopId: string, tourId: string, visitorId: string, timeSpent: number): Promise<void> {
    await prisma.tourStopVisit.create({
      data: {
        stopId,
        tourId,
        visitorId,
        timeSpent,
      },
    });
  }

  async recordHotspotClick(hotspotId: string, visitorId: string): Promise<void> {
    await prisma.tourHotspotClick.create({
      data: {
        hotspotId,
        visitorId,
      },
    });
  }

  async getTourAnalytics(tourId: string, days = 30): Promise<TourAnalytics> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [tour, views, stopVisits, hotspotClicks, deviceBreakdown, browserBreakdown] = await Promise.all([
      prisma.virtualTour.findUnique({ where: { id: tourId } }),
      prisma.tourView.findMany({
        where: { tourId, createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.tourStopVisit.findMany({
        where: { tourId, createdAt: { gte: since } },
        include: { stop: { select: { id: true, name: true } } },
      }),
      prisma.tourHotspotClick.findMany({
        where: { stop: { tourId } },
        include: { hotspot: { select: { id: true, stopId: true } } },
      }),
      prisma.tourView.groupBy({
        by: ['deviceType'],
        where: { tourId, createdAt: { gte: since } },
        _count: true,
      }),
      prisma.tourView.groupBy({
        by: ['browser'],
        where: { tourId, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    if (!tour) throw new Error('Tour not found');

    const totalViews = views.length;
    const uniqueViewers = new Set(views.map(v => v.visitorId)).size;
    const averageDuration = totalViews > 0
      ? views.reduce((sum, v) => sum + v.duration, 0) / totalViews
      : 0;
    const completedViews = views.filter(v => v.completed).length;
    const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

    const stopStats = new Map<string, { name: string; visits: number; totalTime: number; clicks: number }>();
    stopVisits.forEach(sv => {
      const existing = stopStats.get(sv.stopId) || { name: sv.stop.name, visits: 0, totalTime: 0, clicks: 0 };
      existing.visits++;
      existing.totalTime += sv.timeSpent;
      stopStats.set(sv.stopId, existing);
    });

    const hotspotClickMap = new Map<string, number>();
    hotspotClicks.forEach(hc => {
      hotspotClickMap.set(hc.hotspotId, (hotspotClickMap.get(hc.hotspotId) || 0) + 1);
    });

    const stopVisitsArray = Array.from(stopStats.entries()).map(([stopId, stats]) => ({
      stopId,
      stopName: stats.name,
      visits: stats.visits,
      averageTimeSpent: stats.visits > 0 ? stats.totalTime / stats.visits : 0,
      hotspotClicks: 0,
    }));

    const totalStopVisits = stopVisitsArray.reduce((sum, sv) => sum + sv.visits, 0);
    const dropOffPoints = stopVisitsArray.map(sv => ({
      stopId: sv.stopId,
      stopName: sv.stopName,
      dropOffRate: totalStopVisits > 0 ? ((totalStopVisits - sv.visits) / totalStopVisits) * 100 : 0,
    }));

    const peakHours = new Map<number, number>();
    views.forEach(v => {
      const hour = v.createdAt.getHours();
      peakHours.set(hour, (peakHours.get(hour) || 0) + 1);
    });

    return {
      tourId,
      totalViews,
      uniqueViewers,
      averageDuration,
      completionRate,
      stopVisits: stopVisitsArray,
      dropOffPoints,
      deviceBreakdown: Object.fromEntries(deviceBreakdown.map(d => [d.deviceType || 'unknown', d._count])),
      browserBreakdown: Object.fromEntries(browserBreakdown.map(b => [b.browser || 'unknown', b._count])),
      peakViewingHours: Array.from(peakHours.entries())
        .map(([hour, views]) => ({ hour, views }))
        .sort((a, b) => b.views - a.views),
    };
  }

  async getPopularTours(limit = 10): Promise<VirtualTour[]> {
    const tours = await prisma.virtualTour.findMany({
      where: { status: 'ACTIVE', isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return tours.map(this.formatTour);
  }

  async duplicateTour(id: string, newTitle: string, userId: string): Promise<VirtualTour> {
    const original = await prisma.virtualTour.findUnique({
      where: { id },
      include: {
        stops: {
          include: { hotspots: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!original) throw new Error('Tour not found');

    const newTour = await prisma.virtualTour.create({
      data: {
        title: newTitle,
        description: original.description,
        propertyId: original.propertyId,
        tourType: original.tourType,
        coverImage: original.coverImage,
        status: 'DRAFT',
        isPublished: false,
        createdBy: userId,
        stops: {
          create: original.stops.map(stop => ({
            name: stop.name,
            description: stop.description,
            imageUrl: stop.imageUrl,
            panoramicUrl: stop.panoramicUrl,
            videoUrl: stop.videoUrl,
            sortOrder: stop.sortOrder,
            floorLevel: stop.floorLevel,
            roomType: stop.roomType,
            positionX: Number(stop.positionX),
            positionY: Number(stop.positionY),
            positionZ: stop.positionZ ? Number(stop.positionZ) : undefined,
            hotspots: {
              create: stop.hotspots.map(hotspot => ({
                type: hotspot.type,
                title: hotspot.title,
                description: hotspot.description,
                icon: hotspot.icon,
                positionX: Number(hotspot.positionX),
                positionY: Number(hotspot.positionY),
                targetStopId: hotspot.targetStopId,
                targetUrl: hotspot.targetUrl,
                mediaUrl: hotspot.mediaUrl,
                linkedPropertyId: hotspot.linkedPropertyId,
              })),
            },
          })),
        },
      },
      include: { stops: true },
    });

    return this.formatTour(newTour);
  }

  private formatTour(tour: any): VirtualTour {
    return {
      id: tour.id,
      title: tour.title,
      description: tour.description,
      propertyId: tour.propertyId,
      coverImage: tour.coverImage,
      tourType: tour.tourType,
      status: tour.status,
      url: tour.url,
      embedCode: tour.embedCode,
      thumbnailUrl: tour.thumbnailUrl,
      duration: tour.duration,
      fileSize: tour.fileSize,
      resolution: tour.resolution,
      isPublished: tour.isPublished,
      viewCount: tour.viewCount || 0,
      completionRate: tour.completionRate ? Number(tour.completionRate) : 0,
      averageViewDuration: tour.averageViewDuration ? Number(tour.averageViewDuration) : 0,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
    };
  }

  private formatStop(stop: any): TourStop {
    return {
      id: stop.id,
      tourId: stop.tourId,
      name: stop.name,
      description: stop.description,
      imageUrl: stop.imageUrl,
      panoramicUrl: stop.panoramicUrl,
      videoUrl: stop.videoUrl,
      sortOrder: stop.sortOrder,
      hotspots: stop.hotspots?.map((h: any) => this.formatHotspot(h)) || [],
      floorLevel: stop.floorLevel,
      roomType: stop.roomType,
      positionX: Number(stop.positionX),
      positionY: Number(stop.positionY),
      positionZ: stop.positionZ ? Number(stop.positionZ) : undefined,
      lookAtX: stop.lookAtX ? Number(stop.lookAtX) : undefined,
      lookAtY: stop.lookAtY ? Number(stop.lookAtY) : undefined,
      lookAtZ: stop.lookAtZ ? Number(stop.lookAtZ) : undefined,
      fov: stop.fov,
      createdAt: stop.createdAt,
      updatedAt: stop.updatedAt,
    };
  }

  private formatHotspot(hotspot: any): TourHotspot {
    return {
      id: hotspot.id,
      stopId: hotspot.stopId,
      type: hotspot.type,
      title: hotspot.title,
      description: hotspot.description,
      icon: hotspot.icon,
      positionX: Number(hotspot.positionX),
      positionY: Number(hotspot.positionY),
      targetStopId: hotspot.targetStopId,
      targetUrl: hotspot.targetUrl,
      mediaUrl: hotspot.mediaUrl,
      linkedPropertyId: hotspot.linkedPropertyId,
      measurements: hotspot.measurements?.map((m: any) => ({
        id: m.id,
        hotspotId: m.hotspotId,
        value: Number(m.value),
        unit: m.unit,
        startX: Number(m.startX),
        startY: Number(m.startY),
        endX: Number(m.endX),
        endY: Number(m.endY),
      })) || [],
      createdAt: hotspot.createdAt,
    };
  }
}

export const tourService = TourService.getInstance();
