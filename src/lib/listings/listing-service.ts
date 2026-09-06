import {
  ListingWithRelations,
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
  ListingType,
  PriceHistoryEntry,
  OpenHouseEvent,
  ListingAnalytics,
  PropertySummary,
  SearchFilters,
  SearchSortOptions,
  PaginationOptions,
  SearchResult,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export class ListingService {
  private static instance: ListingService;

  static getInstance(): ListingService {
    if (!ListingService.instance) {
      ListingService.instance = new ListingService();
    }
    return ListingService.instance;
  }

  async createListing(input: CreateListingInput, userId: string): Promise<ListingWithRelations> {
    const slug = await this.generateUniqueSlug(input.title);

    const listing = await prisma.property.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        shortDescription: input.shortDescription,
        propertyType: input.propertyType,
        listingType: input.listingType,
        status: input.status || ListingStatus.DRAFT,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        country: input.country || 'US',
        latitude: input.latitude,
        longitude: input.longitude,
        neighborhoodId: input.neighborhoodId,
        price: input.price,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        sqft: input.sqft,
        lotSize: input.lotSize,
        yearBuilt: input.yearBuilt,
        garage: input.garage,
        parkingSpaces: input.parkingSpaces,
        stories: input.stories,
        floors: input.floors,
        agentId: input.agentId,
        userId,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        tags: input.tags || [],
        featured: input.featured || false,
        featuredAt: input.featured ? new Date() : undefined,
        featuredExpiresAt: input.featured
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : undefined,
        pricePerSqft: input.sqft > 0 ? Math.round(input.price / input.sqft) : null,
        images: input.images?.length
          ? {
              create: input.images.map((img, index) => ({
                url: img.url,
                alt: img.alt,
                caption: img.caption,
                sortOrder: img.sortOrder ?? index,
                isPrimary: img.isPrimary ?? index === 0,
              })),
            }
          : undefined,
        openHouseEvents: input.openHouseEvents?.length
          ? {
              create: input.openHouseEvents.map(event => ({
                startDateTime: event.startDateTime,
                endDateTime: event.endDateTime,
                description: event.description,
                isVirtual: event.isVirtual || false,
                virtualLink: event.virtualLink,
              })),
            }
          : undefined,
      },
      include: this.getListingInclude(),
    });

    await this.recordPriceHistory(listing.id, input.price, 'ORIGINAL', userId);

    return this.formatListing(listing);
  }

  async updateListing(input: UpdateListingInput, userId: string): Promise<ListingWithRelations> {
    const { id, priceChange, ...data } = input;

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { price: true, status: true },
    });
    if (!existing) throw new Error('Listing not found');

    if (priceChange) {
      const changeType = priceChange.newPrice > Number(existing.price) ? 'PRICE_INCREASE' : 'PRICE_DECREASE';
      const changePercent =
        ((priceChange.newPrice - Number(existing.price)) / Number(existing.price)) * 100;

      await this.recordPriceHistory(id, priceChange.newPrice, changeType, userId, {
        previousPrice: Number(existing.price),
        changePercent: Math.round(changePercent * 100) / 100,
        reason: priceChange.reason,
      });

      data.price = priceChange.newPrice;
    }

    if (data.status && data.status !== existing.status) {
      await this.recordStatusChange(id, existing.status, data.status, userId);
    }

    const listing = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        pricePerSqft: data.sqft && data.price
          ? Math.round(data.price / data.sqft)
          : data.price
            ? Math.round(data.price / (existing as any).sqft)
            : undefined,
        publishedAt: data.status === ListingStatus.ACTIVE && existing.status !== ListingStatus.ACTIVE
          ? new Date()
          : undefined,
        soldAt: data.status === ListingStatus.SOLD ? new Date() : undefined,
        featuredAt: data.featured === true && !existing.status
          ? new Date()
          : data.featured === true
            ? new Date()
            : undefined,
        featuredExpiresAt: data.featured === true
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : data.featured === false
            ? null
            : undefined,
      },
      include: this.getListingInclude(),
    });

    return this.formatListing(listing);
  }

  async deleteListing(id: string): Promise<void> {
    const listing = await prisma.property.findUnique({ where: { id }, select: { status: true } });
    if (!listing) throw new Error('Listing not found');

    if (listing.status === ListingStatus.ACTIVE) {
      throw new Error('Cannot delete an active listing. Withdraw it first.');
    }

    await prisma.property.delete({ where: { id } });
  }

  async getListingById(id: string): Promise<ListingWithRelations | null> {
    const listing = await prisma.property.findUnique({
      where: { id },
      include: this.getListingInclude(),
    });
    return listing ? this.formatListing(listing) : null;
  }

  async getListingBySlug(slug: string): Promise<ListingWithRelations | null> {
    const listing = await prisma.property.findUnique({
      where: { slug },
      include: this.getListingInclude(),
    });
    return listing ? this.formatListing(listing) : null;
  }

  async getListings(
    filters: SearchFilters = {},
    sort: SearchSortOptions = { field: 'newest', order: 'desc' },
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<SearchResult> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(sort);
    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = pagination.pageSize;

    const [listings, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take,
        include: this.getListingSummaryInclude(),
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties: listings.map(this.formatListingSummary),
      total,
      facets: await this.buildFacets(where),
      suggestions: [],
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async getFeaturedListings(limit = 10): Promise<ListingWithRelations[]> {
    const listings = await prisma.property.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        featured: true,
        OR: [
          { featuredExpiresAt: null },
          { featuredExpiresAt: { gte: new Date() } },
        ],
      },
      orderBy: { featuredAt: 'desc' },
      take: limit,
      include: this.getListingInclude(),
    });
    return listings.map(this.formatListing);
  }

  async markAsSold(id: string, salePrice: number, userId: string): Promise<ListingWithRelations> {
    const listing = await prisma.property.findUnique({ where: { id }, select: { price: true } });
    if (!listing) throw new Error('Listing not found');

    await this.recordPriceHistory(id, salePrice, 'SALE_PRICE', userId, {
      originalPrice: Number(listing.price),
      salePrice,
    });

    return this.updateListing({
      id,
      status: ListingStatus.SOLD,
      price: salePrice,
    }, userId);
  }

  async extendListing(id: string, days: number, userId: string): Promise<ListingWithRelations> {
    const listing = await prisma.property.findUnique({
      where: { id },
      select: { expiresAt: true },
    });
    if (!listing) throw new Error('Listing not found');

    const newExpiry = listing.expiresAt
      ? new Date(Math.max(listing.expiresAt.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.updateListing({ id, expiresAt: newExpiry } as any, userId);
  }

  async toggleFeatured(id: string, featured: boolean, userId: string): Promise<ListingWithRelations> {
    return this.updateListing({ id, featured }, userId);
  }

  async getPriceHistory(listingId: string): Promise<PriceHistoryEntry[]> {
    const history = await prisma.priceHistory.findMany({
      where: { listingId },
      orderBy: { date: 'desc' },
    });

    return history.map(h => ({
      id: h.id,
      price: Number(h.price),
      changeType: h.changeType,
      changePercent: h.changePercent ? Number(h.changePercent) : undefined,
      date: h.date,
      notes: h.notes ?? undefined,
    }));
  }

  async getPriceReductions(
    minReductionPercent = 5,
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<{ listings: ListingWithRelations[]; total: number }> {
    const listings = await prisma.property.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        priceHistory: {
          some: {
            changeType: 'PRICE_DECREASE',
            changePercent: { gte: minReductionPercent },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      include: this.getListingInclude(),
    });

    const total = await prisma.property.count({
      where: {
        status: ListingStatus.ACTIVE,
        priceHistory: {
          some: {
            changeType: 'PRICE_DECREASE',
            changePercent: { gte: minReductionPercent },
          },
        },
      },
    });

    return {
      listings: listings.map(this.formatListing),
      total,
    };
  }

  async addOpenHouseEvent(
    listingId: string,
    event: Omit<OpenHouseEvent, 'id' | 'listingId' | 'currentAttendees' | 'status'>
  ): Promise<OpenHouseEvent> {
    const created = await prisma.openHouseEvent.create({
      data: {
        listingId,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        description: event.description,
        hostAgentId: event.hostAgentId,
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink,
        maxAttendees: event.maxAttendees,
      },
    });

    await prisma.property.update({
      where: { id: listingId },
      data: { openHouse: true },
    });

    return this.formatOpenHouseEvent(created);
  }

  async cancelOpenHouseEvent(eventId: string): Promise<void> {
    await prisma.openHouseEvent.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });
  }

  async getOpenHouseEvents(listingId: string): Promise<OpenHouseEvent[]> {
    const events = await prisma.openHouseEvent.findMany({
      where: {
        listingId,
        status: { not: 'CANCELLED' },
        startDateTime: { gte: new Date() },
      },
      orderBy: { startDateTime: 'asc' },
    });

    return events.map(this.formatOpenHouseEvent);
  }

  async getListingAnalytics(listingId: string, days = 30): Promise<ListingAnalytics> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalViews, uniqueVisitors, inquiryCount, tourCount, saveCount, shareCount, viewsByDay] =
      await Promise.all([
        prisma.propertyView.count({ where: { propertyId: listingId, viewedAt: { gte: since } } }),
        prisma.propertyView.groupBy({
          by: ['visitorId'],
          where: { propertyId: listingId, viewedAt: { gte: since } },
        }).then(r => r.length),
        prisma.propertyInquiry.count({ where: { propertyId: listingId, createdAt: { gte: since } } }),
        prisma.appointment.count({
          where: {
            propertyId: listingId,
            type: { in: ['SHOWING', 'VIRTUAL_TOUR'] },
            createdAt: { gte: since },
          },
        }),
        prisma.propertyFavorite.count({ where: { propertyId: listingId, createdAt: { gte: since } } }),
        prisma.propertyShare.count({ where: { propertyId: listingId, createdAt: { gte: since } } }),
        this.getViewsByDay(listingId, since),
      ]);

    const listing = await prisma.property.findUnique({
      where: { id: listingId },
      select: { viewCount: true },
    });

    const totalImpressions = await prisma.searchImpression.count({
      where: { propertyId: listingId, createdAt: { gte: since } },
    });

    return {
      listingId,
      totalViews,
      viewsByDay,
      uniqueVisitors,
      averageTimeOnPage: 0,
      inquiryCount,
      tourCount,
      saveCount,
      shareCount,
      comparisonCount: 0,
      searchImpressions: totalImpressions,
      clickThroughRate: totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0,
    };
  }

  async getExpiringListings(daysAhead = 7): Promise<ListingWithRelations[]> {
    const deadline = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const listings = await prisma.property.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        expiresAt: { lte: deadline, gte: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
      include: this.getListingInclude(),
    });

    return listings.map(this.formatListing);
  }

  async bulkExpireListings(): Promise<number> {
    const result = await prisma.property.updateMany({
      where: {
        status: ListingStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: ListingStatus.EXPIRED },
    });

    return result.count;
  }

  async getRecentlySold(limit = 10, days = 90): Promise<ListingWithRelations[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const listings = await prisma.property.findMany({
      where: {
        status: ListingStatus.SOLD,
        soldAt: { gte: since },
      },
      orderBy: { soldAt: 'desc' },
      take: limit,
      include: this.getListingInclude(),
    });

    return listings.map(this.formatListing);
  }

  private async recordPriceHistory(
    listingId: string,
    price: number,
    changeType: string,
    userId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const lastPrice = await prisma.priceHistory.findFirst({
      where: { listingId },
      orderBy: { date: 'desc' },
      select: { price: true },
    });

    const changePercent = lastPrice
      ? ((price - Number(lastPrice.price)) / Number(lastPrice.price)) * 100
      : null;

    await prisma.priceHistory.create({
      data: {
        listingId,
        price,
        changeType,
        changePercent: changePercent ? Math.round(changePercent * 100) / 100 : null,
        notes: details?.reason as string,
      },
    });
  }

  private async recordStatusChange(
    listingId: string,
    oldStatus: ListingStatus,
    newStatus: ListingStatus,
    userId: string
  ): Promise<void> {
    await prisma.listingStatusHistory.create({
      data: {
        listingId,
        oldStatus,
        newStatus,
        changedBy: userId,
      },
    });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = base;
    let counter = 1;
    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${base}-${counter++}`;
    }
    return slug;
  }

  private async getViewsByDay(propertyId: string, since: Date): Promise<Array<{ date: string; views: number }>> {
    const views = await prisma.propertyView.groupBy({
      by: ['viewedAt'],
      where: { propertyId, viewedAt: { gte: since } },
      _count: true,
      orderBy: { viewedAt: 'asc' },
    });

    const viewMap = new Map<string, number>();
    views.forEach(v => {
      const date = v.viewedAt.toISOString().split('T')[0];
      viewMap.set(date, (viewMap.get(date) || 0) + v._count);
    });

    const result: Array<{ date: string; views: number }> = [];
    const current = new Date(since);
    const now = new Date();

    while (current <= now) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({ date: dateStr, views: viewMap.get(dateStr) || 0 });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private getListingInclude() {
    return {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          headshot: true,
          averageRating: true,
          totalReviews: true,
          brokerage: true,
          brokerageLogo: true,
          isFeatured: true,
          isVerified: true,
        },
      },
      images: { orderBy: { sortOrder: 'asc' } as any },
      features: { include: { feature: true } },
      amenities: { include: { amenity: true } },
      priceHistory: { orderBy: { date: 'desc' as any } },
      openHouseEvents: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { startDateTime: 'asc' as any },
      },
      neighborhood: true,
      _count: {
        select: {
          favorites: true,
          inquiries: true,
          appointments: true,
        },
      },
    };
  }

  private getListingSummaryInclude() {
    return {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          headshot: true,
          averageRating: true,
          brokerage: true,
          isFeatured: true,
        },
      },
      images: { where: { isPrimary: true }, take: 1 },
      priceHistory: { orderBy: { date: 'desc' as any }, take: 1 },
      _count: { select: { favorites: true, inquiries: true } },
    };
  }

  private formatListing(listing: any): ListingWithRelations {
    const now = new Date();
    const publishedAt = listing.publishedAt;
    const daysOnMarket = publishedAt
      ? Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      ...listing,
      price: Number(listing.price),
      pricePerSqft: listing.pricePerSqft ? Number(listing.pricePerSqft) : null,
      lotSize: listing.lotSize ? Number(listing.lotSize) : undefined,
      bathrooms: Number(listing.bathrooms),
      features: listing.features?.map((f: any) => ({
        id: f.feature.id,
        name: f.feature.name,
        category: f.feature.category,
        value: f.value,
      })) || [],
      amenities: listing.amenities?.map((a: any) => ({
        id: a.amenity.id,
        name: a.amenity.name,
        category: a.amenity.category,
        description: a.amenity.description,
      })) || [],
      images: listing.images?.map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        caption: img.caption,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
        width: img.width,
        height: img.height,
        createdAt: img.createdAt,
      })) || [],
      priceHistory: listing.priceHistory?.map((h: any) => ({
        id: h.id,
        price: Number(h.price),
        changeType: h.changeType,
        changePercent: h.changePercent ? Number(h.changePercent) : undefined,
        date: h.date,
        notes: h.notes,
      })) || [],
      openHouseEvents: listing.openHouseEvents?.map((e: any) => ({
        id: e.id,
        listingId: e.listingId,
        startDateTime: e.startDateTime,
        endDateTime: e.endDateTime,
        description: e.description,
        hostAgentId: e.hostAgentId,
        isVirtual: e.isVirtual,
        virtualLink: e.virtualLink,
        maxAttendees: e.maxAttendees,
        currentAttendees: e.currentAttendees || 0,
        status: e.status,
      })) || [],
      agent: listing.agent ? {
        id: listing.agent.id,
        firstName: listing.agent.firstName,
        lastName: listing.agent.lastName,
        email: listing.agent.email,
        phone: listing.agent.phone,
        title: listing.agent.title,
        headshot: listing.agent.headshot,
        brokerage: listing.agent.brokerage,
        brokerageLogo: listing.agent.brokerageLogo,
        averageRating: Number(listing.agent.averageRating),
        totalReviews: listing.agent.totalReviews,
        totalSales: 0,
        isFeatured: listing.agent.isFeatured,
        isVerified: listing.agent.isVerified,
      } : undefined,
      favoriteCount: listing._count?.favorites || 0,
      inquiryCount: listing._count?.inquiries || 0,
      tourCount: listing._count?.appointments || 0,
      daysOnMarket,
      viewsLast24h: 0,
      viewsLast7d: 0,
      viewsLast30d: 0,
      saveCount: listing._count?.favorites || 0,
    };
  }

  private formatListingSummary(listing: any): PropertySummary {
    return {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      propertyType: listing.propertyType,
      listingType: listing.listingType,
      status: listing.status,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      price: Number(listing.price),
      bedrooms: listing.bedrooms,
      bathrooms: Number(listing.bathrooms),
      sqft: listing.sqft,
      yearBuilt: listing.yearBuilt,
      primaryImage: listing.images?.[0]?.url,
      agent: listing.agent ? {
        id: listing.agent.id,
        firstName: listing.agent.firstName,
        lastName: listing.agent.lastName,
        email: '',
        headshot: listing.agent.headshot,
        brokerage: listing.agent.brokerage,
        averageRating: Number(listing.agent.averageRating),
        totalReviews: 0,
        totalSales: 0,
        isFeatured: listing.agent.isFeatured,
        isVerified: true,
      } : undefined,
      viewCount: listing.viewCount || 0,
      createdAt: listing.createdAt,
    };
  }

  private formatOpenHouseEvent(event: any): OpenHouseEvent {
    return {
      id: event.id,
      listingId: event.listingId,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      description: event.description,
      hostAgentId: event.hostAgentId,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees || 0,
      status: event.status,
    };
  }

  private buildWhereClause(filters: SearchFilters): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = {};

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.propertyTypes?.length) where.propertyType = { in: filters.propertyTypes };
    if (filters.listingTypes?.length) where.listingType = { in: filters.listingTypes };
    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    } else {
      where.status = { in: [ListingStatus.ACTIVE, ListingStatus.PENDING] };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters.minBedrooms !== undefined) where.bedrooms = { gte: filters.minBedrooms };
    if (filters.maxBedrooms !== undefined) where.bedrooms = { ...where.bedrooms as any, lte: filters.maxBedrooms };
    if (filters.minBathrooms !== undefined) where.bathrooms = { gte: filters.minBathrooms };
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };
    if (filters.neighborhoodId) where.neighborhoodId = filters.neighborhoodId;
    if (filters.agentId) where.agentId = filters.agentId;

    return where;
  }

  private buildOrderBy(sort: SearchSortOptions): Prisma.PropertyOrderByWithRelationInput {
    switch (sort.field) {
      case 'price': return { price: sort.order };
      case 'popular': return { viewCount: sort.order };
      case 'daysOnMarket': return { publishedAt: sort.order };
      default: return { createdAt: sort.order };
    }
  }

  private async buildFacets(where: Prisma.PropertyWhereInput): Promise<any> {
    return {};
  }
}

export const listingService = ListingService.getInstance();
