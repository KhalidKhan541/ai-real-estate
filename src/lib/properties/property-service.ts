import {
  PropertyWithRelations,
  PropertySummary,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyType,
  ListingStatus,
  ListingType,
  PropertyHistory,
  PropertyFeature,
  PropertyAmenity,
  SearchFilters,
  SearchSortOptions,
  PaginationOptions,
  SearchResult,
  SearchFacets,
  FacetCount,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export class PropertyService {
  private static instance: PropertyService;

  static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  async createProperty(input: CreatePropertyInput, userId: string): Promise<PropertyWithRelations> {
    const slug = await this.ensureUniqueSlug(this.generateSlug(input.title));

    const property = await prisma.property.create({
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
        features: input.featureIds?.length
          ? { create: input.featureIds.map(id => ({ featureId: id })) }
          : undefined,
        amenities: input.amenityIds?.length
          ? { create: input.amenityIds.map(id => ({ amenityId: id })) }
          : undefined,
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
        pricePerSqft: input.sqft > 0 ? Math.round(input.price / input.sqft) : null,
      },
      include: this.getPropertyInclude(),
    });

    await this.recordPropertyHistory(property.id, 'CREATED', input.price, userId);

    return this.formatProperty(property);
  }

  async updateProperty(input: UpdatePropertyInput, userId: string): Promise<PropertyWithRelations> {
    const { id, featureIds, amenityIds, images, ...data } = input;

    const existing = await prisma.property.findUnique({ where: { id }, select: { price: true } });
    if (!existing) throw new Error('Property not found');

    if (data.price !== undefined && data.price !== existing.price) {
      const changeType = data.price > existing.price ? 'PRICE_INCREASE' : 'PRICE_DECREASE';
      const changePercent = ((data.price - existing.price) / existing.price) * 100;
      await this.recordPropertyHistory(id, changeType, data.price, userId, {
        previousPrice: existing.price,
        changePercent: Math.round(changePercent * 100) / 100,
      });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        pricePerSqft: data.sqft && data.price
          ? Math.round(data.price / data.sqft)
          : data.price
            ? Math.round(data.price / (existing as any).sqft)
            : undefined,
        features: featureIds
          ? { deleteMany: {}, create: featureIds.map(fid => ({ featureId: fid })) }
          : undefined,
        amenities: amenityIds
          ? { deleteMany: {}, create: amenityIds.map(aid => ({ amenityId: aid })) }
          : undefined,
        images: images
          ? {
              deleteMany: {},
              create: images.map((img, index) => ({
                url: img.url,
                alt: img.alt,
                caption: img.caption,
                sortOrder: img.sortOrder ?? index,
                isPrimary: img.isPrimary ?? index === 0,
              })),
            }
          : undefined,
      },
      include: this.getPropertyInclude(),
    });

    return this.formatProperty(property);
  }

  async deleteProperty(id: string): Promise<void> {
    const property = await prisma.property.findUnique({ where: { id }, select: { status: true } });
    if (!property) throw new Error('Property not found');

    if (property.status === ListingStatus.ACTIVE) {
      throw new Error('Cannot delete an active listing. Withdraw it first.');
    }

    await prisma.property.delete({ where: { id } });
  }

  async getPropertyById(id: string): Promise<PropertyWithRelations | null> {
    const property = await prisma.property.findUnique({
      where: { id },
      include: this.getPropertyInclude(),
    });
    return property ? this.formatProperty(property) : null;
  }

  async getPropertyBySlug(slug: string): Promise<PropertyWithRelations | null> {
    const property = await prisma.property.findUnique({
      where: { slug },
      include: this.getPropertyInclude(),
    });
    return property ? this.formatProperty(property) : null;
  }

  async getProperties(
    filters: SearchFilters = {},
    sort: SearchSortOptions = { field: 'newest', order: 'desc' },
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<SearchResult> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(sort);
    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = pagination.pageSize;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take,
        include: this.getPropertySummaryInclude(),
      }),
      prisma.property.count({ where }),
    ]);

    const facets = await this.buildFacets(where);
    const suggestions = filters.query ? await this.getSearchSuggestions(filters.query) : [];

    return {
      properties: properties.map(this.formatPropertySummary),
      total,
      facets,
      suggestions,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async getFeaturedProperties(limit = 10): Promise<PropertySummary[]> {
    const properties = await prisma.property.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        featured: true,
        featuredExpiresAt: { gte: new Date() },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: this.getPropertySummaryInclude(),
    });
    return properties.map(this.formatPropertySummary);
  }

  async getPropertiesByAgent(agentId: string, pagination: PaginationOptions = { page: 1, pageSize: 20 }): Promise<SearchResult> {
    return this.getProperties({ agentId }, { field: 'newest', order: 'desc' }, pagination);
  }

  async getSimilarProperties(propertyId: string, limit = 8): Promise<PropertySummary[]> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        propertyType: true,
        listingType: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        sqft: true,
        city: true,
        neighborhoodId: true,
        tags: true,
      },
    });

    if (!property) return [];

    const priceMin = property.price * 0.7;
    const priceMax = property.price * 1.3;

    const similar = await prisma.property.findMany({
      where: {
        id: { not: propertyId },
        status: ListingStatus.ACTIVE,
        OR: [
          { neighborhoodId: property.neighborhoodId },
          { propertyType: property.propertyType },
          {
            price: { gte: priceMin, lte: priceMax },
            bedrooms: property.bedrooms,
          },
          { tags: { hasSome: property.tags } },
        ],
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: this.getPropertySummaryInclude(),
    });

    return similar.map(this.formatPropertySummary);
  }

  async incrementViewCount(propertyId: string): Promise<void> {
    await prisma.property.update({
      where: { id: propertyId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async recordFavorite(propertyId: string): Promise<void> {
    await prisma.property.update({
      where: { id: propertyId },
      data: { favoriteCount: { increment: 1 } },
    });
  }

  async recordInquiry(propertyId: string): Promise<void> {
    await prisma.property.update({
      where: { id: propertyId },
      data: { inquiryCount: { increment: 1 } },
    });
  }

  async getPropertyHistory(propertyId: string): Promise<PropertyHistory[]> {
    const history = await prisma.propertyHistory.findMany({
      where: { propertyId },
      orderBy: { date: 'desc' },
      include: {
        agent: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return history.map(h => ({
      id: h.id,
      eventType: h.eventType,
      price: h.price ? Number(h.price) : undefined,
      date: h.date,
      agentId: h.agentId ?? undefined,
      agentName: h.agent ? `${h.agent.firstName} ${h.agent.lastName}` : undefined,
      details: h.details as Record<string, unknown> ?? undefined,
    }));
  }

  async compareProperties(propertyIds: string[]): Promise<{
    properties: PropertyWithRelations[];
    attributes: Array<{ name: string; values: Record<string, string> }>;
    priceComparison: { min: number; max: number; average: number };
  }> {
    if (propertyIds.length < 2) throw new Error('At least 2 properties required for comparison');
    if (propertyIds.length > 4) throw new Error('Maximum 4 properties can be compared');

    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      include: this.getPropertyInclude(),
    });

    if (properties.length !== propertyIds.length) {
      throw new Error('One or more properties not found');
    }

    const ordered = propertyIds.map(id => properties.find(p => p.id === id)!);
    const prices = ordered.map(p => Number(p.price));

    const attributes = this.buildComparisonAttributes(ordered);

    return {
      properties: ordered.map(this.formatProperty),
      attributes,
      priceComparison: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      },
    };
  }

  async bulkUpdateStatus(ids: string[], status: ListingStatus, userId: string): Promise<number> {
    const result = await prisma.property.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        publishedAt: status === ListingStatus.ACTIVE ? new Date() : undefined,
        soldAt: status === ListingStatus.SOLD ? new Date() : undefined,
      },
    });

    for (const id of ids) {
      await this.recordPropertyHistory(id, `STATUS_CHANGED_TO_${status}`, undefined, userId, { newStatus: status });
    }

    return result.count;
  }

  async getPropertyStats(propertyId: string): Promise<{
    viewsLast7d: number;
    viewsLast30d: number;
    favorites: number;
    inquiries: number;
    daysOnMarket: number;
  }> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { createdAt: true, publishedAt: true, favoriteCount: true, inquiryCount: true },
    });

    if (!property) throw new Error('Property not found');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [views7d, views30d] = await Promise.all([
      prisma.propertyView.count({
        where: { propertyId, viewedAt: { gte: sevenDaysAgo } },
      }),
      prisma.propertyView.count({
        where: { propertyId, viewedAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const daysOnMarket = property.publishedAt
      ? Math.floor((now.getTime() - property.publishedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      viewsLast7d: views7d,
      viewsLast30d: views30d,
      favorites: property.favoriteCount,
      inquiries: property.inquiryCount,
      daysOnMarket,
    };
  }

  private async recordPropertyHistory(
    propertyId: string,
    eventType: string,
    price: number | undefined,
    userId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const agent = await prisma.agentProfile.findFirst({ where: { userId } });
    await prisma.propertyHistory.create({
      data: {
        propertyId,
        eventType,
        price,
        agentId: agent?.id,
        details: details as Prisma.InputJsonValue,
      },
    });
  }

  private async generateSlug(title: string): Promise<string> {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async ensureUniqueSlug(slug: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.property.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter++}`;
    }
    return uniqueSlug;
  }

  private buildComparisonAttributes(properties: any[]): Array<{ name: string; values: Record<string, string> }> {
    const attributeDefinitions = [
      { key: 'price', label: 'Price', format: (v: number) => `$${v.toLocaleString()}` },
      { key: 'bedrooms', label: 'Bedrooms', format: (v: number) => v.toString() },
      { key: 'bathrooms', label: 'Bathrooms', format: (v: number) => v.toString() },
      { key: 'sqft', label: 'Square Feet', format: (v: number) => v.toLocaleString() },
      { key: 'yearBuilt', label: 'Year Built', format: (v: number) => v.toString() },
      { key: 'lotSize', label: 'Lot Size', format: (v: number | null) => v ? `${v.toLocaleString()} sqft` : 'N/A' },
      { key: 'garage', label: 'Garage', format: (v: number | null) => v ? `${v} car${v > 1 ? 's' : ''}` : 'None' },
      { key: 'stories', label: 'Stories', format: (v: number | null) => v?.toString() || 'N/A' },
      { key: 'propertyType', label: 'Property Type', format: (v: string) => v.replace('_', ' ') },
      { key: 'address', label: 'Address', format: (v: string) => v },
      { key: 'city', label: 'City', format: (v: string) => v },
      { key: 'state', label: 'State', format: (v: string) => v },
    ];

    return attributeDefinitions.map(def => ({
      name: def.label,
      values: Object.fromEntries(
        properties.map(p => [p.id, def.format(p[def.key])])
      ),
    }));
  }

  private getPropertyInclude() {
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
        },
      },
      images: { orderBy: { sortOrder: 'asc' } as any },
      features: { include: { feature: true } },
      amenities: { include: { amenity: true } },
      history: { orderBy: { date: 'desc' as any }, take: 20 },
      neighborhood: true,
      _count: { select: { favorites: true, inquiries: true } },
    };
  }

  private getPropertySummaryInclude() {
    return {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          headshot: true,
          averageRating: true,
          totalReviews: true,
          brokerage: true,
        },
      },
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { favorites: true, inquiries: true } },
    };
  }

  private formatProperty(property: any): PropertyWithRelations {
    return {
      ...property,
      price: Number(property.price),
      pricePerSqft: property.pricePerSqft ? Number(property.pricePerSqft) : null,
      mortgageEstimate: property.mortgageEstimate ? Number(property.mortgageEstimate) : null,
      lotSize: property.lotSize ? Number(property.lotSize) : undefined,
      features: property.features?.map((f: any) => ({
        id: f.feature.id,
        name: f.feature.name,
        category: f.feature.category,
        value: f.value,
      })) || [],
      amenities: property.amenities?.map((a: any) => ({
        id: a.amenity.id,
        name: a.amenity.name,
        category: a.amenity.category,
        description: a.amenity.description,
      })) || [],
      images: property.images?.map((img: any) => ({
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
      history: property.history?.map((h: any) => ({
        id: h.id,
        eventType: h.eventType,
        price: h.price ? Number(h.price) : undefined,
        date: h.date,
        agentId: h.agentId,
        agentName: h.agent ? `${h.agent.firstName} ${h.agent.lastName}` : undefined,
        details: h.details,
      })) || [],
      agent: property.agent ? {
        id: property.agent.id,
        firstName: property.agent.firstName,
        lastName: property.agent.lastName,
        email: property.agent.email,
        phone: property.agent.phone,
        title: property.agent.title,
        headshot: property.agent.headshot,
        brokerage: property.agent.brokerage,
        averageRating: Number(property.agent.averageRating),
        totalReviews: property.agent.totalReviews,
        totalSales: 0,
        isFeatured: false,
        isVerified: true,
      } : undefined,
      favoriteCount: property._count?.favorites || 0,
      inquiryCount: property._count?.inquiries || 0,
    };
  }

  private formatPropertySummary(property: any): PropertySummary {
    return {
      id: property.id,
      title: property.title,
      slug: property.slug,
      propertyType: property.propertyType,
      listingType: property.listingType,
      status: property.status,
      address: property.address,
      city: property.city,
      state: property.state,
      price: Number(property.price),
      bedrooms: property.bedrooms,
      bathrooms: Number(property.bathrooms),
      sqft: property.sqft,
      yearBuilt: property.yearBuilt,
      primaryImage: property.images?.[0]?.url,
      agent: property.agent ? {
        id: property.agent.id,
        firstName: property.agent.firstName,
        lastName: property.agent.lastName,
        email: '',
        headshot: property.agent.headshot,
        brokerage: property.agent.brokerage,
        averageRating: Number(property.agent.averageRating),
        totalReviews: property.agent.totalReviews,
        totalSales: 0,
        isFeatured: false,
        isVerified: true,
      } : undefined,
      viewCount: property.viewCount || 0,
      createdAt: property.createdAt,
    };
  }

  private buildWhereClause(filters: SearchFilters): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = {};

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
        { city: { contains: filters.query, mode: 'insensitive' } },
        { tags: { hasSome: filters.query.split(' ') } },
      ];
    }

    if (filters.propertyTypes?.length) {
      where.propertyType = { in: filters.propertyTypes };
    }

    if (filters.listingTypes?.length) {
      where.listingType = { in: filters.listingTypes };
    }

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    } else {
      where.status = { not: ListingStatus.DRAFT };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters.minBedrooms !== undefined || filters.maxBedrooms !== undefined) {
      where.bedrooms = {};
      if (filters.minBedrooms !== undefined) where.bedrooms.gte = filters.minBedrooms;
      if (filters.maxBedrooms !== undefined) where.bedrooms.lte = filters.maxBedrooms;
    }

    if (filters.minBathrooms !== undefined || filters.maxBathrooms !== undefined) {
      where.bathrooms = {};
      if (filters.minBathrooms !== undefined) where.bathrooms.gte = filters.minBathrooms;
      if (filters.maxBathrooms !== undefined) where.bathrooms.lte = filters.maxBathrooms;
    }

    if (filters.minSqft !== undefined || filters.maxSqft !== undefined) {
      where.sqft = {};
      if (filters.minSqft !== undefined) where.sqft.gte = filters.minSqft;
      if (filters.maxSqft !== undefined) where.sqft.lte = filters.maxSqft;
    }

    if (filters.minYearBuilt !== undefined || filters.maxYearBuilt !== undefined) {
      where.yearBuilt = {};
      if (filters.minYearBuilt !== undefined) where.yearBuilt.gte = filters.minYearBuilt;
      if (filters.maxYearBuilt !== undefined) where.yearBuilt.lte = filters.maxYearBuilt;
    }

    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };
    if (filters.zipCode) where.zipCode = filters.zipCode;
    if (filters.neighborhoodId) where.neighborhoodId = filters.neighborhoodId;
    if (filters.agentId) where.agentId = filters.agentId;

    if (filters.features?.length) {
      where.features = { some: { featureId: { in: filters.features } } };
    }

    if (filters.amenities?.length) {
      where.amenities = { some: { amenityId: { in: filters.amenities } } };
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.hasOpenHouse !== undefined) {
      where.openHouse = filters.hasOpenHouse;
    }

    if (filters.hasVirtualTour !== undefined) {
      where.virtualTourUrl = filters.hasVirtualTour ? { not: null } : null;
    }

    if (filters.excludeIds?.length) {
      where.id = { notIn: filters.excludeIds };
    }

    return where;
  }

  private buildOrderBy(sort: SearchSortOptions): Prisma.PropertyOrderByWithRelationInput {
    switch (sort.field) {
      case 'price':
        return { price: sort.order };
      case 'beds':
        return { bedrooms: sort.order };
      case 'baths':
        return { bathrooms: sort.order };
      case 'sqft':
        return { sqft: sort.order };
      case 'popular':
        return { viewCount: sort.order };
      case 'daysOnMarket':
        return { publishedAt: sort.order };
      case 'newest':
      default:
        return { createdAt: sort.order };
    }
  }

  private async buildFacets(where: Prisma.PropertyWhereInput): Promise<SearchFacets> {
    const [propertyTypes, listingTypes, cities, states, neighborhoods] = await Promise.all([
      this.getFacetCounts(where, 'propertyType'),
      this.getFacetCounts(where, 'listingType'),
      this.getStringFacetCounts(where, 'city'),
      this.getStringFacetCounts(where, 'state'),
      this.getRelationFacetCounts(where, 'neighborhood'),
    ]);

    const priceRanges = await this.getPriceRangeFacets(where);
    const bedroomRanges = await this.getBedroomRangeFacets(where);

    return {
      propertyTypes,
      listingTypes,
      priceRanges,
      bedroomRanges,
      bathroomRanges: [],
      cities,
      states,
      neighborhoods,
      features: [],
      amenities: [],
    };
  }

  private async getFacetCounts(where: Prisma.PropertyWhereInput, field: string): Promise<FacetCount[]> {
    const results = await prisma.property.groupBy({
      by: [field as any],
      where,
      _count: true,
    });

    return results.map(r => ({
      value: String(r[field as keyof typeof r]),
      label: String(r[field as keyof typeof r]).replace('_', ' '),
      count: r._count,
    }));
  }

  private async getStringFacetCounts(where: Prisma.PropertyWhereInput, field: string): Promise<FacetCount[]> {
    const results = await prisma.property.groupBy({
      by: [field as any],
      where,
      _count: true,
      orderBy: { _count: { [field]: 'desc' } },
      take: 20,
    });

    return results.map(r => ({
      value: String(r[field as keyof typeof r]),
      label: String(r[field as keyof typeof r]),
      count: r._count,
    }));
  }

  private async getRelationFacetCounts(where: Prisma.PropertyWhereInput, field: string): Promise<FacetCount[]> {
    const results = await prisma.property.groupBy({
      by: ['neighborhoodId'],
      where: { ...where, neighborhoodId: { not: null } },
      _count: true,
      orderBy: { _count: { neighborhoodId: 'desc' } },
      take: 20,
    });

    const neighborhoodIds = results.map(r => r.neighborhoodId).filter(Boolean) as string[];
    if (neighborhoodIds.length === 0) return [];

    const neighborhoods = await prisma.neighborhood.findMany({
      where: { id: { in: neighborhoodIds } },
      select: { id: true, name: true },
    });

    const nameMap = new Map(neighborhoods.map(n => [n.id, n.name]));

    return results
      .filter(r => r.neighborhoodId && nameMap.has(r.neighborhoodId))
      .map(r => ({
        value: r.neighborhoodId!,
        label: nameMap.get(r.neighborhoodId!) || r.neighborhoodId!,
        count: r._count,
      }));
  }

  private async getPriceRangeFacets(where: Prisma.PropertyWhereInput): Promise<FacetCount[]> {
    const ranges = [
      { min: 0, max: 100000, label: 'Under $100K' },
      { min: 100000, max: 200000, label: '$100K - $200K' },
      { min: 200000, max: 300000, label: '$200K - $300K' },
      { min: 300000, max: 500000, label: '$300K - $500K' },
      { min: 500000, max: 750000, label: '$500K - $750K' },
      { min: 750000, max: 1000000, label: '$750K - $1M' },
      { min: 1000000, max: null, label: '$1M+' },
    ];

    const facets: FacetCount[] = [];
    for (const range of ranges) {
      const count = await prisma.property.count({
        where: {
          ...where,
          price: {
            gte: range.min,
            ...(range.max ? { lte: range.max } : {}),
          },
        },
      });
      if (count > 0) {
        facets.push({
          value: `${range.min}-${range.max || 'inf'}`,
          label: range.label,
          count,
          min: range.min,
          max: range.max || undefined,
        });
      }
    }
    return facets;
  }

  private async getBedroomRangeFacets(where: Prisma.PropertyWhereInput): Promise<FacetCount[]> {
    const ranges = [
      { min: 0, max: 0, label: 'Studio' },
      { min: 1, max: 1, label: '1 Bed' },
      { min: 2, max: 2, label: '2 Beds' },
      { min: 3, max: 3, label: '3 Beds' },
      { min: 4, max: 4, label: '4 Beds' },
      { min: 5, max: null, label: '5+ Beds' },
    ];

    const facets: FacetCount[] = [];
    for (const range of ranges) {
      const count = await prisma.property.count({
        where: {
          ...where,
          bedrooms: {
            gte: range.min,
            ...(range.max ? { lte: range.max } : {}),
          },
        },
      });
      if (count > 0) {
        facets.push({ value: `${range.min}`, label: range.label, count });
      }
    }
    return facets;
  }

  private async getSearchSuggestions(query: string): Promise<string[]> {
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: query.split(' ') } },
        ],
      },
      select: { title: true, city: true, tags: true },
      take: 20,
    });

    const suggestions = new Set<string>();
    properties.forEach(p => {
      suggestions.add(p.title);
      suggestions.add(p.city);
      p.tags.forEach(t => suggestions.add(t));
    });

    return Array.from(suggestions).slice(0, 10);
  }
}

export const propertyService = PropertyService.getInstance();
