export interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  brokerage: string;
  specializations: string[];
  serviceAreas: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalRevenue: number;
  bio: string;
  avatar?: string;
  languages: string[];
  certifications: string[];
  availability: "available" | "busy" | "offline";
  isVerified: boolean;
  isPremium: boolean;
  joinedAt: string;
  updatedAt: string;
}

export interface AgentCreateInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  brokerage: string;
  specializations?: string[];
  serviceAreas?: string[];
  experience?: number;
  bio: string;
  avatar?: string;
  languages?: string[];
  certifications?: string[];
}

export interface AgentUpdateInput extends Partial<AgentCreateInput> {
  availability?: Agent["availability"];
  isVerified?: boolean;
  isPremium?: boolean;
}

export interface AgentFilter {
  specializations?: string[];
  serviceAreas?: string[];
  minRating?: number;
  minExperience?: number;
  availability?: Agent["availability"];
  isVerified?: boolean;
  isPremium?: boolean;
  languages?: string[];
  sortBy?: "rating" | "experience" | "totalSales" | "joinedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

const agents: Map<string, Agent> = new Map();

export class AgentService {
  async create(input: AgentCreateInput): Promise<Agent> {
    const id = `agt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    const agent: Agent = {
      id,
      userId: input.userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      licenseNumber: input.licenseNumber,
      licenseState: input.licenseState,
      licenseExpiry: input.licenseExpiry,
      brokerage: input.brokerage,
      specializations: input.specializations || [],
      serviceAreas: input.serviceAreas || [],
      experience: input.experience || 0,
      rating: 0,
      reviewCount: 0,
      totalSales: 0,
      totalRevenue: 0,
      bio: input.bio,
      avatar: input.avatar,
      languages: input.languages || ["English"],
      certifications: input.certifications || [],
      availability: "available",
      isVerified: false,
      isPremium: false,
      joinedAt: now,
      updatedAt: now,
    };

    agents.set(id, agent);
    return agent;
  }

  async getById(id: string): Promise<Agent | null> {
    return agents.get(id) || null;
  }

  async getByUserId(userId: string): Promise<Agent | null> {
    return Array.from(agents.values()).find((a) => a.userId === userId) || null;
  }

  async update(id: string, input: AgentUpdateInput): Promise<Agent | null> {
    const existing = agents.get(id);
    if (!existing) return null;

    const updated: Agent = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    agents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return agents.delete(id);
  }

  async list(filter: AgentFilter = {}): Promise<{ items: Agent[]; total: number; page: number; limit: number }> {
    let results = Array.from(agents.values());

    if (filter.specializations && filter.specializations.length > 0) {
      results = results.filter((a) =>
        filter.specializations!.some((s) => a.specializations.includes(s))
      );
    }
    if (filter.serviceAreas && filter.serviceAreas.length > 0) {
      results = results.filter((a) =>
        filter.serviceAreas!.some((area) => a.serviceAreas.includes(area))
      );
    }
    if (filter.minRating !== undefined) {
      results = results.filter((a) => a.rating >= filter.minRating!);
    }
    if (filter.minExperience !== undefined) {
      results = results.filter((a) => a.experience >= filter.minExperience!);
    }
    if (filter.availability) {
      results = results.filter((a) => a.availability === filter.availability);
    }
    if (filter.isVerified !== undefined) {
      results = results.filter((a) => a.isVerified === filter.isVerified);
    }
    if (filter.isPremium !== undefined) {
      results = results.filter((a) => a.isPremium === filter.isPremium);
    }
    if (filter.languages && filter.languages.length > 0) {
      results = results.filter((a) =>
        filter.languages!.some((lang) => a.languages.includes(lang))
      );
    }

    const sortBy = filter.sortBy || "rating";
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

  async updateRating(id: string, newRating: number): Promise<Agent | null> {
    const agent = agents.get(id);
    if (!agent) return null;

    const totalRating = agent.rating * agent.reviewCount + newRating;
    agent.reviewCount += 1;
    agent.rating = Math.round((totalRating / agent.reviewCount) * 10) / 10;
    agent.updatedAt = new Date().toISOString();
    return agent;
  }

  async incrementSales(id: string, revenue: number): Promise<Agent | null> {
    const agent = agents.get(id);
    if (!agent) return null;

    agent.totalSales += 1;
    agent.totalRevenue += revenue;
    agent.updatedAt = new Date().toISOString();
    return agent;
  }

  async setAvailability(
    id: string,
    availability: Agent["availability"]
  ): Promise<Agent | null> {
    return this.update(id, { availability });
  }

  async verifyAgent(id: string): Promise<Agent | null> {
    return this.update(id, { isVerified: true });
  }

  async promoteToPremium(id: string): Promise<Agent | null> {
    return this.update(id, { isPremium: true });
  }

  async getTopAgents(limit: number = 10): Promise<Agent[]> {
    return Array.from(agents.values())
      .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
      .slice(0, limit);
  }

  async searchByName(name: string): Promise<Agent[]> {
    const term = name.toLowerCase();
    return Array.from(agents.values()).filter(
      (a) => a.name.toLowerCase().includes(term)
    );
  }

  async isLicenseValid(id: string): Promise<boolean> {
    const agent = agents.get(id);
    if (!agent) return false;
    return new Date(agent.licenseExpiry) > new Date();
  }

  clear(): void {
    agents.clear();
  }
}

export const agentService = new AgentService();
