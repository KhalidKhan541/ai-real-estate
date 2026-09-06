import {
  AgentProfile,
  AgentSummary,
  AgentPerformance,
  AgentAvailability,
  AgentReview,
  CreateAgentProfileInput,
  UpdateAgentProfileInput,
  AgentStatus,
  SearchFilters,
  PaginationOptions,
  SearchResult,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentService {
  private static instance: AgentService;

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  async createAgentProfile(input: CreateAgentProfileInput, userId: string): Promise<AgentProfile> {
    const existing = await prisma.agentProfile.findUnique({ where: { userId } });
    if (existing) throw new Error('Agent profile already exists for this user');

    const agent = await prisma.agentProfile.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        licenseNumber: input.licenseNumber,
        licenseState: input.licenseState,
        title: input.title,
        bio: input.bio,
        headshot: input.headshot,
        website: input.webite,
        brokerage: input.brokerage,
        specializations: input.specializations || [],
        serviceAreas: input.serviceAreas || [],
        languages: input.languages || ['English'],
        yearsExperience: input.yearsExperience,
        status: AgentStatus.PENDING,
      },
    });

    return this.formatAgentProfile(agent);
  }

  async updateAgentProfile(input: UpdateAgentProfileInput): Promise<AgentProfile> {
    const { id, ...data } = input;

    const agent = await prisma.agentProfile.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.licenseState !== undefined && { licenseState: data.licenseState }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.headshot !== undefined && { headshot: data.headshot }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.brokerage !== undefined && { brokerage: data.brokerage }),
        ...(data.specializations && { specializations: data.specializations }),
        ...(data.serviceAreas && { serviceAreas: data.serviceAreas }),
        ...(data.languages && { languages: data.languages }),
        ...(data.yearsExperience !== undefined && { yearsExperience: data.yearsExperience }),
      },
    });

    return this.formatAgentProfile(agent);
  }

  async getAgentById(id: string): Promise<AgentProfile | null> {
    const agent = await prisma.agentProfile.findUnique({
      where: { id },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    return agent ? this.formatAgentProfile(agent) : null;
  }

  async getAgentByUserId(userId: string): Promise<AgentProfile | null> {
    const agent = await prisma.agentProfile.findUnique({
      where: { userId },
      include: {
        listings: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    return agent ? this.formatAgentProfile(agent) : null;
  }

  async searchAgents(
    filters: {
      query?: string;
      specializations?: string[];
      serviceAreas?: string[];
      languages?: string[];
      minRating?: number;
      status?: AgentStatus;
    } = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<{ agents: AgentProfile[]; total: number }> {
    const where: Prisma.AgentProfileWhereInput = {};

    if (filters.query) {
      where.OR = [
        { firstName: { contains: filters.query, mode: 'insensitive' } },
        { lastName: { contains: filters.query, mode: 'insensitive' } },
        { brokerage: { contains: filters.query, mode: 'insensitive' } },
        { specializations: { hasSome: filters.query.split(' ') } },
      ];
    }

    if (filters.specializations?.length) {
      where.specializations = { hasSome: filters.specializations };
    }

    if (filters.serviceAreas?.length) {
      where.serviceAreas = { hasSome: filters.serviceAreas };
    }

    if (filters.languages?.length) {
      where.languages = { hasSome: filters.languages };
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = AgentStatus.ACTIVE;
    }

    if (filters.minRating) {
      where.averageRating = { gte: filters.minRating };
    }

    const [agents, total] = await Promise.all([
      prisma.agentProfile.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { averageRating: 'desc' },
          { totalSales: 'desc' },
        ],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: {
          listings: { where: { status: 'ACTIVE' }, select: { id: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.agentProfile.count({ where }),
    ]);

    return {
      agents: agents.map(a => this.formatAgentProfile(a)),
      total,
    };
  }

  async getFeaturedAgents(limit = 10): Promise<AgentProfile[]> {
    const agents = await prisma.agentProfile.findMany({
      where: {
        status: AgentStatus.ACTIVE,
        isFeatured: true,
      },
      orderBy: { averageRating: 'desc' },
      take: limit,
      include: {
        listings: { where: { status: 'ACTIVE' }, select: { id: true } },
        reviews: { select: { rating: true } },
      },
    });

    return agents.map(a => this.formatAgentProfile(a));
  }

  async getTopAgentsBySales(limit = 10): Promise<AgentProfile[]> {
    const agents = await prisma.agentProfile.findMany({
      where: { status: AgentStatus.ACTIVE },
      orderBy: { totalSales: 'desc' },
      take: limit,
      include: {
        listings: { where: { status: 'ACTIVE' }, select: { id: true } },
        reviews: { select: { rating: true } },
      },
    });

    return agents.map(a => this.formatAgentProfile(a));
  }

  async getAgentListings(
    agentId: string,
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ): Promise<SearchResult> {
    const where: Prisma.PropertyWhereInput = {
      agentId,
      status: { in: ['ACTIVE', 'PENDING', 'SOLD'] },
    };

    const [listings, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          agent: { select: { id: true, firstName: true, lastName: true, headshot: true } },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties: listings.map(l => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        propertyType: l.propertyType as any,
        listingType: l.listingType as any,
        status: l.status as any,
        address: l.address,
        city: l.city,
        state: l.state,
        price: Number(l.price),
        bedrooms: l.bedrooms,
        bathrooms: Number(l.bathrooms),
        sqft: l.sqft,
        yearBuilt: l.yearBuilt,
        primaryImage: l.images[0]?.url,
        agent: l.agent ? {
          id: l.agent.id,
          firstName: l.agent.firstName,
          lastName: l.agent.lastName,
          email: '',
          headshot: l.agent.headshot,
          brokerage: '',
          averageRating: 0,
          totalReviews: 0,
          totalSales: 0,
          isFeatured: false,
          isVerified: true,
        } : undefined,
        viewCount: l.viewCount || 0,
        createdAt: l.createdAt,
      })),
      total,
      facets: {} as any,
      suggestions: [],
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async getAgentPerformance(
    agentId: string,
    period: 'month' | 'quarter' | 'year' = 'year'
  ): Promise<AgentPerformance> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [activeListings, newListings, soldListings, appointments, reviews] = await Promise.all([
      prisma.property.count({
        where: { agentId, status: 'ACTIVE' },
      }),
      prisma.property.count({
        where: {
          agentId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.property.findMany({
        where: {
          agentId,
          status: 'SOLD',
          soldAt: { gte: startDate },
        },
        select: { price: true, publishedAt: true, soldAt: true },
      }),
      prisma.appointment.findMany({
        where: {
          agentId,
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
      }),
      prisma.agentReview.findMany({
        where: {
          agentId,
          createdAt: { gte: startDate },
        },
        select: { rating: true },
      }),
    ]);

    const totalRevenue = soldListings.reduce((sum, l) => sum + Number(l.price), 0);
    const averageSalePrice = soldListings.length > 0 ? totalRevenue / soldListings.length : 0;

    const daysOnMarket = soldListings
      .filter(l => l.publishedAt && l.soldAt)
      .map(l => {
        const diff = l.soldAt!.getTime() - l.publishedAt!.getTime();
        return diff / (1000 * 60 * 60 * 24);
      });
    const medianDaysOnMarket = daysOnMarket.length > 0
      ? daysOnMarket.sort((a, b) => a - b)[Math.floor(daysOnMarket.length / 2)]
      : 0;

    const listToSaleRatio = soldListings.length > 0
      ? soldListings.reduce((sum, l) => {
          const listing = l as any;
          return sum + (listing.price / (listing.originalPrice || listing.price));
        }, 0) / soldListings.length
      : 0;

    const showings = appointments.filter(a => a.type === 'SHOWING').length;
    const inquiries = appointments.length;

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      agentId,
      period,
      startDate,
      endDate: now,
      activeListings,
      newListings,
      soldListings: soldListings.length,
      totalRevenue,
      averageSalePrice: Math.round(averageSalePrice),
      medianDaysOnMarket: Math.round(medianDaysOnMarket),
      listToSaleRatio: Math.round(listToSaleRatio * 100) / 100,
      inquiries,
      showings,
      conversionRate: inquiries > 0 ? (showings / inquiries) * 100 : 0,
      clientSatisfaction: Math.round(avgRating * 10) / 10,
      repeatClientRate: 0,
      referralRate: 0,
    };
  }

  async setAgentAvailability(
    agentId: string,
    availability: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      notes?: string;
    }>
  ): Promise<void> {
    await prisma.agentAvailability.deleteMany({ where: { agentId } });

    await prisma.agentAvailability.createMany({
      data: availability.map(a => ({
        agentId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable,
        notes: a.notes,
      })),
    });
  }

  async getAgentAvailability(agentId: string): Promise<AgentAvailability[]> {
    const availability = await prisma.agentAvailability.findMany({
      where: { agentId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availability.map(a => ({
      id: a.id,
      agentId: a.agentId,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isAvailable: a.isAvailable,
      notes: a.notes,
    }));
  }

  async addReview(
    agentId: string,
    userId: string,
    rating: number,
    title?: string,
    content?: string
  ): Promise<AgentReview> {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    const existingReview = await prisma.agentReview.findFirst({
      where: { agentId, userId },
    });

    if (existingReview) throw new Error('You have already reviewed this agent');

    const review = await prisma.agentReview.create({
      data: {
        agentId,
        userId,
        rating,
        title,
        content,
        isVerified: true,
      },
    });

    await this.updateAgentRating(agentId);

    return {
      id: review.id,
      agentId: review.agentId,
      userId: review.userId,
      rating: review.rating,
      title: review.title,
      content: review.content,
      response: review.response,
      responseAt: review.responseAt,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
    };
  }

  async respondToReview(reviewId: string, agentId: string, response: string): Promise<void> {
    const review = await prisma.agentReview.findUnique({ where: { id: reviewId } });
    if (!review || review.agentId !== agentId) throw new Error('Review not found');

    await prisma.agentReview.update({
      where: { id: reviewId },
      data: {
        response,
        responseAt: new Date(),
      },
    });
  }

  async getAgentReviews(agentId: string): Promise<AgentReview[]> {
    const reviews = await prisma.agentReview.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
    });

    return reviews.map(r => ({
      id: r.id,
      agentId: r.agentId,
      userId: r.userId,
      userName: r.user.name,
      userAvatar: r.user.image,
      rating: r.rating,
      title: r.title,
      content: r.content,
      response: r.response,
      responseAt: r.responseAt,
      isVerified: r.isVerified,
      createdAt: r.createdAt,
    }));
  }

  async updateAgentRating(agentId: string): Promise<void> {
    const stats = await prisma.agentReview.aggregate({
      where: { agentId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.agentProfile.update({
      where: { id: agentId },
      data: {
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
        totalReviews: stats._count,
      },
    });
  }

  async updateAgentStats(agentId: string): Promise<void> {
    const [activeListings, totalSales] = await Promise.all([
      prisma.property.count({
        where: { agentId, status: 'ACTIVE' },
      }),
      prisma.property.count({
        where: { agentId, status: 'SOLD' },
      }),
    ]);

    const totalVolume = await prisma.property.aggregate({
      where: { agentId, status: 'SOLD' },
      _sum: { price: true },
    });

    const avgDays = await prisma.property.aggregate({
      where: { agentId, status: 'SOLD', daysOnMarket: { not: null } },
      _avg: { daysOnMarket: true },
    });

    await prisma.agentProfile.update({
      where: { id: agentId },
      data: {
        activeListings,
        totalSales,
        totalVolume: totalVolume._sum.price ? Number(totalVolume._sum.price) : 0,
        avgDaysOnMarket: avgDays._avg.daysOnMarket ? Math.round(avgDays._avg.daysOnMarket) : null,
      },
    });
  }

  async toggleAgentStatus(agentId: string, status: AgentStatus): Promise<AgentProfile> {
    const agent = await prisma.agentProfile.update({
      where: { id: agentId },
      data: { status },
    });

    return this.formatAgentProfile(agent);
  }

  async toggleFeatured(agentId: string, featured: boolean): Promise<AgentProfile> {
    const agent = await prisma.agentProfile.update({
      where: { id: agentId },
      data: { isFeatured: featured },
    });

    return this.formatAgentProfile(agent);
  }

  async getAgentAvailabilityForDate(agentId: string, date: Date): Promise<{
    available: boolean;
    slots: Array<{ start: string; end: string }>;
  }> {
    const dayOfWeek = date.getDay();

    const availability = await prisma.agentAvailability.findFirst({
      where: {
        agentId,
        dayOfWeek,
        isAvailable: true,
      },
    });

    if (!availability) {
      return { available: false, slots: [] };
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        agentId,
        startDateTime: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      select: { startDateTime: true, endDateTime: true },
    });

    const slots = this.generateTimeSlots(
      availability.startTime,
      availability.endTime,
      existingAppointments.map(a => ({
        start: a.startDateTime,
        end: a.endDateTime,
      }))
    );

    return { available: true, slots };
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    existingSlots: Array<{ start: Date; end: Date }>
  ): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + 60 <= endMinutes) {
      const slotStart = new Date();
      slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      const isOccupied = existingSlots.some(slot =>
        slotStart < slot.end && slotEnd > slot.start
      );

      if (!isOccupied) {
        slots.push({
          start: `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`,
          end: `${String(Math.floor((currentMinutes + 60) / 60)).padStart(2, '0')}:${String((currentMinutes + 60) % 60).padStart(2, '0')}`,
        });
      }

      currentMinutes += 60;
    }

    return slots;
  }

  private formatAgentProfile(agent: any): AgentProfile {
    return {
      id: agent.id,
      userId: agent.userId,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      phone: agent.phone,
      licenseNumber: agent.licenseNumber,
      licenseState: agent.licenseState,
      licenseExpiry: agent.licenseExpiry,
      title: agent.title,
      bio: agent.bio,
      headshot: agent.headshot,
      website: agent.website,
      brokerage: agent.brokerage,
      brokerageLogo: agent.brokerageLogo,
      specializations: agent.specializations || [],
      serviceAreas: agent.serviceAreas || [],
      languages: agent.languages || [],
      yearsExperience: agent.yearsExperience,
      activeListings: agent.activeListings || agent._count?.listings || 0,
      totalSales: agent.totalSales || 0,
      totalVolume: Number(agent.totalVolume || 0),
      avgDaysOnMarket: agent.avgDaysOnMarket,
      listToSalePriceRatio: agent.listToSalePriceRatio ? Number(agent.listToSalePriceRatio) : undefined,
      averageRating: Number(agent.averageRating || 0),
      totalReviews: agent.totalReviews || agent._count?.reviews || 0,
      responseTimeMinutes: agent.responseTimeMinutes,
      socialMedia: agent.socialMedia,
      status: agent.status,
      isFeatured: agent.isFeatured || false,
      isVerified: agent.isVerified || false,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}

export const agentService = AgentService.getInstance();
