import {
  SearchFilters,
  SearchSortOptions,
  PaginationOptions,
  SearchResult,
  SearchFacets,
  FacetCount,
  PropertySummary,
  SavedSearch,
  CreateSavedSearchInput,
  PropertyType,
  ListingType,
  ListingStatus,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class SearchService {
  private static instance: SearchService;

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async search(
    filters: SearchFilters = {},
    sort: SearchSortOptions = { field: 'relevance', order: 'desc' },
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<SearchResult> {
    const where = this.buildSearchWhere(filters);
    const orderBy = this.buildSearchOrderBy(sort, filters.query);
    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = pagination.pageSize;

    const [properties, total, facets, suggestions] = await Promise.all([
      this.searchProperties(where, orderBy, skip, take),
      prisma.property.count({ where }),
      this.buildSearchFacets(where),
      filters.query ? this.getSearchSuggestions(filters.query) : [],
    ]);

    return {
      properties,
      total,
      facets,
      suggestions,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  private async searchProperties(
    where: Prisma.PropertyWhereInput,
    orderBy: Prisma.PropertyOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<PropertySummary[]> {
    const properties = await prisma.property.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            headshot: true,
            averageRating: true,
            totalReviews: true,
            brokerage: true,
            isFeatured: true,
          },
        },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { favorites: true } },
      },
    });

    return properties.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      propertyType: p.propertyType as PropertyType,
      listingType: p.listingType as ListingType,
      status: p.status as ListingStatus,
      address: p.address,
      city: p.city,
      state: p.state,
      price: Number(p.price),
      bedrooms: p.bedrooms,
      bathrooms: Number(p.bathrooms),
      sqft: p.sqft,
      yearBuilt: p.yearBuilt,
      primaryImage: p.images[0]?.url,
      agent: p.agent ? {
        id: p.agent.id,
        firstName: p.agent.firstName,
        lastName: p.agent.lastName,
        email: '',
        headshot: p.agent.headshot,
        brokerage: p.agent.brokerage,
        averageRating: Number(p.agent.averageRating),
        totalReviews: p.agent.totalReviews,
        totalSales: 0,
        isFeatured: p.agent.isFeatured,
        isVerified: true,
      } : undefined,
      viewCount: p.viewCount || 0,
      createdAt: p.createdAt,
    }));
  }

  async autocomplete(query: string, limit = 10): Promise<Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    image?: string;
    city: string;
    type: string;
  }>> {
    if (!query || query.length < 2) return [];

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
        status: { in: [ListingStatus.ACTIVE, ListingStatus.PENDING] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        city: true,
        propertyType: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return properties.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: Number(p.price),
      image: p.images[0]?.url,
      city: p.city,
      type: p.propertyType,
    }));
  }

  async getSearchSuggestions(query: string, limit = 10): Promise<string[]> {
    const [properties, neighborhoods, tags] = await Promise.all([
      prisma.property.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
          status: { in: [ListingStatus.ACTIVE] },
        },
        select: { title: true, city: true },
        take: limit,
      }),
      prisma.neighborhood.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        select: { name: true },
        take: Math.ceil(limit / 2),
      }),
      prisma.property.findMany({
        where: { tags: { hasSome: query.split(' ') }, status: ListingStatus.ACTIVE },
        select: { tags: true },
        take: 50,
      }),
    ]);

    const suggestions = new Set<string>();
    properties.forEach(p => {
      suggestions.add(p.title);
      suggestions.add(p.city);
    });
    neighborhoods.forEach(n => suggestions.add(n.name));
    tags.forEach(p => p.tags.forEach(t => suggestions.add(t)));

    return Array.from(suggestions).slice(0, limit);
  }

  async getMapSearchResults(
    bounds: {
      northEast: { latitude: number; longitude: number };
      southWest: { latitude: number; longitude: number };
    },
    filters: SearchFilters = {}
  ): Promise<PropertySummary[]> {
    const where: Prisma.PropertyWhereInput = {
      latitude: { gte: bounds.southWest.latitude, lte: bounds.northEast.latitude },
      longitude: { gte: bounds.southWest.longitude, lte: bounds.northEast.longitude },
      status: ListingStatus.ACTIVE,
    };

    if (filters.minPrice !== undefined) where.price = { gte: filters.minPrice };
    if (filters.maxPrice !== undefined) where.price = { ...where.price as any, lte: filters.maxPrice };
    if (filters.propertyTypes?.length) where.propertyType = { in: filters.propertyTypes };
    if (filters.minBedrooms !== undefined) where.bedrooms = { gte: filters.minBedrooms };

    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        propertyType: true,
        listingType: true,
        status: true,
        address: true,
        city: true,
        state: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        sqft: true,
        yearBuilt: true,
        latitude: true,
        longitude: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      take: 100,
    });

    return properties.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      propertyType: p.propertyType as PropertyType,
      listingType: p.listingType as ListingType,
      status: p.status as ListingStatus,
      address: p.address,
      city: p.city,
      state: p.state,
      price: Number(p.price),
      bedrooms: p.bedrooms,
      bathrooms: Number(p.bathrooms),
      sqft: p.sqft,
      yearBuilt: p.yearBuilt,
      primaryImage: p.images[0]?.url,
      viewCount: 0,
      createdAt: new Date(),
    }));
  }

  async getClusteredResults(
    lat: number,
    lng: number,
    radiusMiles: number,
    zoom: number
  ): Promise<Array<{
    latitude: number;
    longitude: number;
    count: number;
    avgPrice: number;
    properties: PropertySummary[];
  }>> {
    const radiusDeg = radiusMiles / 69.0;

    const properties = await prisma.property.findMany({
      where: {
        latitude: { gte: lat - radiusDeg, lte: lat + radiusDeg },
        longitude: { gte: lng - radiusDeg, lte: lng + radiusDeg },
        status: ListingStatus.ACTIVE,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        propertyType: true,
        listingType: true,
        status: true,
        address: true,
        city: true,
        state: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        sqft: true,
        yearBuilt: true,
        latitude: true,
        longitude: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      take: 500,
    });

    const gridSize = this.getGridSize(zoom);
    const clusters = new Map<string, typeof properties>();

    properties.forEach(p => {
      if (!p.latitude || !p.longitude) return;
      const gridLat = Math.floor(p.latitude / gridSize) * gridSize;
      const gridLng = Math.floor(p.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(p);
    });

    return Array.from(clusters.values()).map(group => {
      const avgLat = group.reduce((s, p) => s + (p.latitude || 0), 0) / group.length;
      const avgLng = group.reduce((s, p) => s + (p.longitude || 0), 0) / group.length;
      const avgPrice = group.reduce((s, p) => s + Number(p.price), 0) / group.length;

      return {
        latitude: avgLat,
        longitude: avgLng,
        count: group.length,
        avgPrice: Math.round(avgPrice),
        properties: group.slice(0, 5).map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          propertyType: p.propertyType as PropertyType,
          listingType: p.listingType as ListingType,
          status: p.status as ListingStatus,
          address: p.address,
          city: p.city,
          state: p.state,
          price: Number(p.price),
          bedrooms: p.bedrooms,
          bathrooms: Number(p.bathrooms),
          sqft: p.sqft,
          yearBuilt: p.yearBuilt,
          primaryImage: p.images[0]?.url,
          viewCount: 0,
          createdAt: new Date(),
        })),
      };
    });
  }

  private getGridSize(zoom: number): number {
    if (zoom >= 14) return 0.002;
    if (zoom >= 12) return 0.005;
    if (zoom >= 10) return 0.01;
    if (zoom >= 8) return 0.05;
    return 0.1;
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return searches.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      filters: s.filters as SearchFilters,
      sort: s.sort as SearchSortOptions,
      alertEnabled: s.alertEnabled,
      alertFrequency: s.alertFrequency as 'daily' | 'weekly' | 'instant' | undefined,
      lastAlertedAt: s.lastAlertedAt,
      matchCount: s.matchCount,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async createSavedSearch(userId: string, input: CreateSavedSearchInput): Promise<SavedSearch> {
    const matchCount = await this.countMatchingProperties(input.filters);

    const search = await prisma.savedSearch.create({
      data: {
        userId,
        name: input.name,
        filters: input.filters as Prisma.InputJsonValue,
        sort: (input.sort || { field: 'newest', order: 'desc' }) as Prisma.InputJsonValue,
        alertEnabled: input.alertEnabled ?? true,
        alertFrequency: input.alertFrequency || 'daily',
        matchCount,
      },
    });

    return {
      id: search.id,
      userId: search.userId,
      name: search.name,
      filters: search.filters as SearchFilters,
      sort: search.sort as SearchSortOptions,
      alertEnabled: search.alertEnabled,
      alertFrequency: search.alertFrequency as 'daily' | 'weekly' | 'instant',
      lastAlertedAt: search.lastAlertedAt,
      matchCount: search.matchCount,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  }

  async updateSavedSearch(id: string, userId: string, updates: Partial<CreateSavedSearchInput>): Promise<SavedSearch> {
    const matchCount = updates.filters
      ? await this.countMatchingProperties(updates.filters)
      : undefined;

    const search = await prisma.savedSearch.update({
      where: { id, userId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.filters && { filters: updates.filters as Prisma.InputJsonValue }),
        ...(updates.sort && { sort: updates.sort as Prisma.InputJsonValue }),
        ...(updates.alertEnabled !== undefined && { alertEnabled: updates.alertEnabled }),
        ...(updates.alertFrequency && { alertFrequency: updates.alertFrequency }),
        ...(matchCount !== undefined && { matchCount }),
      },
    });

    return {
      id: search.id,
      userId: search.userId,
      name: search.name,
      filters: search.filters as SearchFilters,
      sort: search.sort as SearchSortOptions,
      alertEnabled: search.alertEnabled,
      alertFrequency: search.alertFrequency as 'daily' | 'weekly' | 'instant',
      lastAlertedAt: search.lastAlertedAt,
      matchCount: search.matchCount,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  }

  async deleteSavedSearch(id: string, userId: string): Promise<void> {
    await prisma.savedSearch.delete({ where: { id, userId } });
  }

  async updateSavedSearchMatchCounts(): Promise<number> {
    const searches = await prisma.savedSearch.findMany({
      where: { alertEnabled: true },
    });

    let updated = 0;
    for (const search of searches) {
      const matchCount = await this.countMatchingProperties(search.filters as SearchFilters);
      if (matchCount !== search.matchCount) {
        await prisma.savedSearch.update({
          where: { id: search.id },
          data: { matchCount },
        });
        updated++;
      }
    }

    return updated;
  }

  private async countMatchingProperties(filters: SearchFilters): Promise<number> {
    const where = this.buildSearchWhere(filters);
    return prisma.property.count({ where });
  }

  async getPropertySearchImpressions(propertyId: string, days = 30): Promise<{
    totalImpressions: number;
    impressionsByDay: Array<{ date: string; impressions: number }>;
    topSearchQueries: Array<{ query: string; count: number }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, byDay, topQueries] = await Promise.all([
      prisma.searchImpression.count({
        where: { propertyId, createdAt: { gte: since } },
      }),
      prisma.searchImpression.groupBy({
        by: ['createdAt'],
        where: { propertyId, createdAt: { gte: since } },
        _count: true,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.searchImpression.groupBy({
        by: ['query'],
        where: { propertyId, createdAt: { gte: since }, query: { not: null } },
        _count: true,
        orderBy: { _count: { query: 'desc' } },
        take: 10,
      }),
    ]);

    const impressionsByDay = byDay.map(d => ({
      date: d.createdAt.toISOString().split('T')[0],
      impressions: d._count,
    }));

    const topSearchQueries = topQueries.map(q => ({
      query: q.query || '',
      count: q._count,
    })).filter(q => q.query);

    return { totalImpressions: total, impressionsByDay, topSearchQueries };
  }

  private buildSearchWhere(filters: SearchFilters): Prisma.PropertyWhereInput {
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

    if (filters.centerLat !== undefined && filters.centerLng !== undefined && filters.radiusMiles) {
      const radiusDeg = filters.radiusMiles / 69.0;
      where.latitude = { gte: filters.centerLat - radiusDeg, lte: filters.centerLat + radiusDeg };
      where.longitude = { gte: filters.centerLng - radiusDeg, lte: filters.centerLng + radiusDeg };
    }

    if (filters.excludeIds?.length) {
      where.id = { notIn: filters.excludeIds };
    }

    return where;
  }

  private buildSearchOrderBy(sort: SearchSortOptions, query?: string): Prisma.PropertyOrderByWithRelationInput {
    switch (sort.field) {
      case 'price': return { price: sort.order };
      case 'beds': return { bedrooms: sort.order };
      case 'baths': return { bathrooms: sort.order };
      case 'sqft': return { sqft: sort.order };
      case 'popular': return { viewCount: sort.order };
      case 'daysOnMarket': return { publishedAt: sort.order };
      case 'relevance':
      default:
        if (query) {
          return { _relevance: { fields: ['title', 'description', 'address'], search: query, sort: sort.order } };
        }
        return { createdAt: sort.order };
    }
  }

  private async buildSearchFacets(where: Prisma.PropertyWhereInput): Promise<SearchFacets> {
    const [propertyTypes, listingTypes, cities, states, neighborhoods] = await Promise.all([
      this.getFieldFacets(where, 'propertyType'),
      this.getFieldFacets(where, 'listingType'),
      this.getStringFacets(where, 'city'),
      this.getStringFacets(where, 'state'),
      this.getNeighborhoodFacets(where),
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

  private async getFieldFacets(where: Prisma.PropertyWhereInput, field: string): Promise<FacetCount[]> {
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

  private async getStringFacets(where: Prisma.PropertyWhereInput, field: string): Promise<FacetCount[]> {
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

  private async getNeighborhoodFacets(where: Prisma.PropertyWhereInput): Promise<FacetCount[]> {
    const results = await prisma.property.groupBy({
      by: ['neighborhoodId'],
      where: { ...where, neighborhoodId: { not: null } },
      _count: true,
      orderBy: { _count: { neighborhoodId: 'desc' } },
      take: 20,
    });

    const ids = results.map(r => r.neighborhoodId).filter(Boolean) as string[];
    if (ids.length === 0) return [];

    const neighborhoods = await prisma.neighborhood.findMany({
      where: { id: { in: ids } },
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
          price: { gte: range.min, ...(range.max ? { lte: range.max } : {}) },
        },
      });
      if (count > 0) {
        facets.push({ value: `${range.min}-${range.max || 'inf'}`, label: range.label, count, min: range.min, max: range.max || undefined });
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
          bedrooms: { gte: range.min, ...(range.max ? { lte: range.max } : {}) },
        },
      });
      if (count > 0) {
        facets.push({ value: `${range.min}`, label: range.label, count });
      }
    }
    return facets;
  }

  async getRecentSearches(userId: string, limit = 10): Promise<string[]> {
    const searches = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { query: true },
    });

    return searches.map(s => s.query).filter(Boolean) as string[];
  }

  async recordSearch(userId: string | null, query: string, filters: SearchFilters, resultsCount: number): Promise<void> {
    await prisma.searchHistory.create({
      data: {
        userId,
        query,
        filters: filters as Prisma.InputJsonValue,
        resultsCount,
      },
    });
  }
}

export const searchService = SearchService.getInstance();
