import {
  Neighborhood,
  NeighborhoodWithRelations,
  SchoolData,
  CrimeStat,
  DemographicData,
  GeoBoundary,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class NeighborhoodService {
  private static instance: NeighborhoodService;

  static getInstance(): NeighborhoodService {
    if (!NeighborhoodService.instance) {
      NeighborhoodService.instance = new NeighborhoodService();
    }
    return NeighborhoodService.instance;
  }

  async createNeighborhood(data: {
    name: string;
    city: string;
    state: string;
    zipCode?: string;
    description?: string;
    boundaries?: GeoBoundary;
    latitude?: number;
    longitude?: number;
    tags?: string[];
    highlights?: string[];
  }): Promise<Neighborhood> {
    const slug = await this.generateUniqueSlug(data.name, data.city);

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name: data.name,
        slug,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        description: data.description,
        boundaries: data.boundaries as Prisma.InputJsonValue,
        latitude: data.latitude,
        longitude: data.longitude,
        tags: data.tags || [],
        highlights: data.highlights || [],
      },
    });

    return this.formatNeighborhood(neighborhood);
  }

  async updateNeighborhood(id: string, data: Partial<{
    name: string;
    description: string;
    boundaries: GeoBoundary;
    latitude: number;
    longitude: number;
    tags: string[];
    highlights: string[];
  }>): Promise<Neighborhood> {
    const neighborhood = await prisma.neighborhood.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.boundaries && { boundaries: data.boundaries as Prisma.InputJsonValue }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.tags && { tags: data.tags }),
        ...(data.highlights && { highlights: data.highlights }),
      },
    });

    return this.formatNeighborhood(neighborhood);
  }

  async deleteNeighborhood(id: string): Promise<void> {
    const propertyCount = await prisma.property.count({ where: { neighborhoodId: id } });
    if (propertyCount > 0) {
      throw new Error(`Cannot delete neighborhood with ${propertyCount} properties`);
    }
    await prisma.neighborhood.delete({ where: { id } });
  }

  async getNeighborhoodById(id: string): Promise<NeighborhoodWithRelations | null> {
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        schools: { orderBy: { rating: 'desc' } },
        crimeStats: { orderBy: [{ year: 'desc' }, { month: 'desc' as any }] },
        demographics: { orderBy: { year: 'desc' }, take: 1 },
        properties: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    });

    return neighborhood ? this.formatNeighborhoodWithRelations(neighborhood) : null;
  }

  async getNeighborhoodBySlug(slug: string): Promise<NeighborhoodWithRelations | null> {
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { slug },
      include: {
        schools: { orderBy: { rating: 'desc' } },
        crimeStats: { orderBy: [{ year: 'desc' }, { month: 'desc' as any }] },
        demographics: { orderBy: { year: 'desc' }, take: 1 },
        properties: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    });

    return neighborhood ? this.formatNeighborhoodWithRelations(neighborhood) : null;
  }

  async searchNeighborhoods(query: string, limit = 20): Promise<Neighborhood[]> {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: query.split(' ') } },
        ],
      },
      orderBy: { totalActiveListings: 'desc' },
      take: limit,
    });

    return neighborhoods.map(this.formatNeighborhood);
  }

  async getNeighborhoodsByCity(city: string, state: string): Promise<Neighborhood[]> {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        city: { contains: city, mode: 'insensitive' },
        state: { contains: state, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
    });

    return neighborhoods.map(this.formatNeighborhood);
  }

  async getNearbyNeighborhoods(
    latitude: number,
    longitude: number,
    radiusMiles = 5,
    limit = 10
  ): Promise<Array<Neighborhood & { distance: number }>> {
    const radiusDeg = radiusMiles / 69.0;

    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        latitude: { gte: latitude - radiusDeg, lte: latitude + radiusDeg },
        longitude: { gte: longitude - radiusDeg, lte: longitude + radiusDeg },
      },
    });

    return neighborhoods
      .map(n => ({
        ...this.formatNeighborhood(n),
        distance: this.calculateDistance(latitude, longitude, n.latitude!, n.longitude!),
      }))
      .filter(n => n.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  async updateSchoolData(neighborhoodId: string, schools: SchoolData[]): Promise<void> {
    await prisma.school.deleteMany({ where: { neighborhoodId } });

    await prisma.school.createMany({
      data: schools.map(s => ({
        neighborhoodId,
        name: s.name,
        type: s.type,
        rating: s.rating,
        enrollment: s.enrollment,
        distance: s.distance,
        address: s.address,
        phone: s.phone,
        website: s.website,
        grades: s.grades,
        studentTeacherRatio: s.studentTeacherRatio,
        reviewCount: s.reviewCount,
      })),
    });

    const avgRating = schools.length > 0
      ? schools.reduce((sum, s) => sum + s.rating, 0) / schools.length
      : null;

    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        schoolRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        schoolCount: schools.length,
      },
    });
  }

  async updateCrimeStats(neighborhoodId: string, stats: CrimeStat[]): Promise<void> {
    await prisma.crimeStat.deleteMany({ where: { neighborhoodId } });

    await prisma.crimeStat.createMany({
      data: stats.map(s => ({
        neighborhoodId,
        year: s.year,
        month: s.month,
        category: s.category,
        count: s.count,
        rate: s.rate,
        cityAverage: s.comparison?.cityAverage,
        stateAverage: s.comparison?.stateAverage,
        nationalAverage: s.comparison?.nationalAverage,
      })),
    });

    const totalRate = stats.reduce((sum, s) => sum + s.rate, 0);
    const avgRate = stats.length > 0 ? totalRate / stats.length : 0;

    let safetyRating = 'Unknown';
    if (avgRate < 10) safetyRating = 'Very Low Crime';
    else if (avgRate < 20) safetyRating = 'Low Crime';
    else if (avgRate < 30) safetyRating = 'Moderate Crime';
    else if (avgRate < 40) safetyRating = 'Above Average Crime';
    else safetyRating = 'High Crime';

    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        crimeIndex: Math.round(avgRate * 10) / 10,
        safetyRating,
      },
    });
  }

  async updateDemographics(neighborhoodId: string, demographics: DemographicData): Promise<void> {
    await prisma.demographicData.upsert({
      where: {
        neighborhoodId_year: { neighborhoodId, year: demographics.year },
      },
      create: {
        neighborhoodId,
        year: demographics.year,
        population: demographics.population,
        medianAge: demographics.medianAge,
        medianHouseholdIncome: demographics.medianHouseholdIncome,
        povertyRate: demographics.povertyRate,
        educationHighSchool: demographics.education.highSchoolOrHigher,
        educationBachelors: demographics.education.bachelorsOrHigher,
        educationGraduate: demographics.education.graduateOrHigher,
        housingOwnerOccupied: demographics.housing.ownerOccupied,
        housingRenterOccupied: demographics.housing.renterOccupied,
        medianHomeValue: demographics.housing.medianHomeValue,
        medianRent: demographics.housing.medianRent,
        diversity: demographics.diversity as Prisma.InputJsonValue,
      },
      update: {
        population: demographics.population,
        medianAge: demographics.medianAge,
        medianHouseholdIncome: demographics.medianHouseholdIncome,
        povertyRate: demographics.povertyRate,
        educationHighSchool: demographics.education.highSchoolOrHigher,
        educationBachelors: demographics.education.bachelorsOrHigher,
        educationGraduate: demographics.education.graduateOrHigher,
        housingOwnerOccupied: demographics.housing.ownerOccupied,
        housingRenterOccupied: demographics.housing.renterOccupied,
        medianHomeValue: demographics.housing.medianHomeValue,
        medianRent: demographics.housing.medianRent,
        diversity: demographics.diversity as Prisma.InputJsonValue,
      },
    });

    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        population: demographics.population,
        medianAge: demographics.medianAge,
        medianHouseholdIncome: demographics.medianHouseholdIncome,
      },
    });
  }

  async updateWalkabilityScores(
    neighborhoodId: string,
    scores: { walkability?: number; transit?: number; bike?: number }
  ): Promise<void> {
    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        ...(scores.walkability !== undefined && { walkabilityScore: scores.walkability }),
        ...(scores.transit !== undefined && { transitScore: scores.transit }),
        ...(scores.bike !== undefined && { bikeScore: scores.bike }),
      },
    });
  }

  async getNeighborhoodStats(neighborhoodId: string): Promise<{
    activeListings: number;
    avgPrice: number;
    medianPrice: number;
    avgDaysOnMarket: number;
    pricePerSqft: number;
    soldLast12m: number;
    newListingsLast30d: number;
    priceChangesLast30d: number;
  }> {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activeListings, priceStats, soldCount, newListings, priceChanges] = await Promise.all([
      prisma.property.count({
        where: { neighborhoodId, status: 'ACTIVE' },
      }),
      prisma.property.aggregate({
        where: { neighborhoodId, status: 'ACTIVE' },
        _avg: { price: true, pricePerSqft: true },
        _count: true,
      }),
      prisma.property.count({
        where: {
          neighborhoodId,
          status: 'SOLD',
          soldAt: { gte: twelveMonthsAgo },
        },
      }),
      prisma.property.count({
        where: {
          neighborhoodId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.priceHistory.count({
        where: {
          listing: { neighborhoodId },
          date: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const medianProperty = await prisma.property.findFirst({
      where: { neighborhoodId, status: 'ACTIVE' },
      orderBy: { price: 'asc' },
      skip: Math.floor(activeListings / 2),
      select: { price: true },
    });

    const avgDaysResult = await prisma.property.aggregate({
      where: {
        neighborhoodId,
        status: 'SOLD',
        soldAt: { gte: twelveMonthsAgo },
      },
      _avg: { daysOnMarket: true },
    });

    return {
      activeListings,
      avgPrice: priceStats._avg.price ? Math.round(Number(priceStats._avg.price)) : 0,
      medianPrice: medianProperty ? Number(medianProperty.price) : 0,
      avgDaysOnMarket: avgDaysResult._avg.daysOnMarket ? Math.round(avgDaysResult._avg.daysOnMarket) : 0,
      pricePerSqft: priceStats._avg.pricePerSqft ? Math.round(Number(priceStats._avg.pricePerSqft)) : 0,
      soldLast12m: soldCount,
      newListingsLast30d: newListings,
      priceChangesLast30d: priceChanges,
    };
  }

  async getTopNeighborhoods(city: string, limit = 10): Promise<Neighborhood[]> {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        city: { contains: city, mode: 'insensitive' },
        totalActiveListings: { gt: 0 },
      },
      orderBy: { totalActiveListings: 'desc' },
      take: limit,
    });

    return neighborhoods.map(this.formatNeighborhood);
  }

  async getNeighborhoodsByTag(tag: string, limit = 20): Promise<Neighborhood[]> {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { tags: { has: tag } },
      orderBy: { totalActiveListings: 'desc' },
      take: limit,
    });

    return neighborhoods.map(this.formatNeighborhood);
  }

  async compareNeighborhoods(ids: string[]): Promise<{
    neighborhoods: NeighborhoodWithRelations[];
    comparison: Record<string, Record<string, string | number>>;
  }> {
    if (ids.length < 2) throw new Error('At least 2 neighborhoods required');
    if (ids.length > 4) throw new Error('Maximum 4 neighborhoods for comparison');

    const neighborhoods = await prisma.neighborhood.findMany({
      where: { id: { in: ids } },
      include: {
        schools: true,
        crimeStats: { orderBy: { year: 'desc' }, take: 12 },
        demographics: { orderBy: { year: 'desc' }, take: 1 },
      },
    });

    const ordered = ids.map(id => neighborhoods.find(n => n.id === id)!).filter(Boolean);

    const comparison: Record<string, Record<string, string | number>> = {};
    for (const n of ordered) {
      const latestDemo = n.demographics?.[0];
      const totalCrime = n.crimeStats.reduce((sum, c) => sum + c.count, 0);

      comparison[n.id] = {
        'Median Home Price': n.medianHomePrice ? `$${n.medianHomePrice.toLocaleString()}` : 'N/A',
        'Walk Score': n.walkabilityScore ?? 'N/A',
        'Transit Score': n.transitScore ?? 'N/A',
        'Bike Score': n.bikeScore ?? 'N/A',
        'School Rating': n.schoolRating ?? 'N/A',
        'Crime Index': n.crimeIndex ?? 'N/A',
        'Population': n.population?.toLocaleString() ?? 'N/A',
        'Median Age': n.medianAge ?? 'N/A',
        'Median Income': n.medianHouseholdIncome ? `$${n.medianHouseholdIncome.toLocaleString()}` : 'N/A',
        'Active Listings': n.totalActiveListings ?? 0,
        'Avg Price/Sqft': n.avgPricePerSqft ? `$${n.avgPricePerSqft}` : 'N/A',
        'Avg Days on Market': n.avgDaysOnMarket ?? 'N/A',
      };
    }

    return {
      neighborhoods: ordered.map(n => this.formatNeighborhoodWithRelations(n)),
      comparison,
    };
  }

  async refreshNeighborhoodStats(neighborhoodId: string): Promise<void> {
    const stats = await this.getNeighborhoodStats(neighborhoodId);

    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        medianHomePrice: stats.medianPrice,
        avgPricePerSqft: stats.pricePerSqft,
        totalActiveListings: stats.activeListings,
        avgDaysOnMarket: stats.avgDaysOnMarket,
      },
    });
  }

  async refreshAllNeighborhoodStats(): Promise<number> {
    const neighborhoods = await prisma.neighborhood.findMany({ select: { id: true } });

    for (const n of neighborhoods) {
      await this.refreshNeighborhoodStats(n.id);
    }

    return neighborhoods.length;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async generateUniqueSlug(name: string, city: string): Promise<string> {
    const base = `${name}-${city}`
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = base;
    let counter = 1;
    while (await prisma.neighborhood.findUnique({ where: { slug } })) {
      slug = `${base}-${counter++}`;
    }
    return slug;
  }

  private formatNeighborhood(n: any): Neighborhood {
    return {
      id: n.id,
      name: n.name,
      slug: n.slug,
      city: n.city,
      state: n.state,
      zipCode: n.zipCode,
      description: n.description,
      boundaries: n.boundaries as GeoBoundary,
      latitude: n.latitude,
      longitude: n.longitude,
      walkabilityScore: n.walkabilityScore,
      transitScore: n.transitScore,
      bikeScore: n.bikeScore,
      medianHomePrice: n.medianHomePrice ? Number(n.medianHomePrice) : undefined,
      medianHouseholdIncome: n.medianHouseholdIncome ? Number(n.medianHouseholdIncome) : undefined,
      medianAge: n.medianAge,
      population: n.population,
      schoolRating: n.schoolRating ? Number(n.schoolRating) : undefined,
      schoolCount: n.schoolCount,
      crimeIndex: n.crimeIndex ? Number(n.crimeIndex) : undefined,
      safetyRating: n.safetyRating,
      avgDaysOnMarket: n.avgDaysOnMarket,
      avgPricePerSqft: n.avgPricePerSqft ? Number(n.avgPricePerSqft) : undefined,
      totalActiveListings: n.totalActiveListings,
      totalSoldLast12m: n.totalSoldLast12m,
      tags: n.tags || [],
      highlights: n.highlights || [],
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }

  private formatNeighborhoodWithRelations(n: any): NeighborhoodWithRelations {
    const base = this.formatNeighborhood(n);

    return {
      ...base,
      schools: n.schools?.map((s: any) => ({
        id: s.id,
        neighborhoodId: s.neighborhoodId,
        name: s.name,
        type: s.type,
        rating: s.rating,
        enrollment: s.enrollment,
        distance: Number(s.distance),
        address: s.address,
        phone: s.phone,
        website: s.website,
        grades: s.grades,
        studentTeacherRatio: s.studentTeacherRatio,
        reviewCount: s.reviewCount,
      })) || [],
      crimeStats: n.crimeStats?.map((c: any) => ({
        id: c.id,
        neighborhoodId: c.neighborhoodId,
        year: c.year,
        month: c.month,
        category: c.category,
        count: c.count,
        rate: Number(c.rate),
        comparison: c.cityAverage !== null ? {
          cityAverage: Number(c.cityAverage),
          stateAverage: Number(c.stateAverage),
          nationalAverage: Number(c.nationalAverage),
        } : undefined,
      })) || [],
      demographics: n.demographics?.[0] ? {
        id: n.demographics[0].id,
        neighborhoodId: n.demographics[0].neighborhoodId,
        year: n.demographics[0].year,
        population: n.demographics[0].population,
        medianAge: n.demographics[0].medianAge,
        medianHouseholdIncome: Number(n.demographics[0].medianHouseholdIncome),
        povertyRate: Number(n.demographics[0].povertyRate),
        education: {
          highSchoolOrHigher: Number(n.demographics[0].educationHighSchool),
          bachelorsOrHigher: Number(n.demographics[0].educationBachelors),
          graduateOrHigher: Number(n.demographics[0].educationGraduate),
        },
        housing: {
          ownerOccupied: Number(n.demographics[0].housingOwnerOccupied),
          renterOccupied: Number(n.demographics[0].housingRenterOccupied),
          medianHomeValue: Number(n.demographics[0].medianHomeValue),
          medianRent: Number(n.demographics[0].medianRent),
        },
        diversity: (n.demographics[0].diversity as Record<string, number>) || {},
      } : undefined,
    };
  }
}

export const neighborhoodService = NeighborhoodService.getInstance();
