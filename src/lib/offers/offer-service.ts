export interface Offer {
  id: string;
  propertyId: string;
  listingId: string;
  buyerId: string;
  buyerAgentId: string;
  sellerAgentId: string;
  amount: number;
  earnestMoney: number;
  downPayment: number;
  financingType: "cash" | "conventional" | "fha" | "va" | "usda";
  contingencies: string[];
  closingDate: string;
  inspectionDate?: string;
  appraisalDate?: string;
  expiresAt: string;
  status: "pending" | "accepted" | "rejected" | "countered" | "withdrawn" | "expired";
  counterOffer?: {
    amount: number;
    terms: string[];
    expiresAt: string;
  };
  notes?: string;
  responseNotes?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferCreateInput {
  propertyId: string;
  listingId: string;
  buyerId: string;
  buyerAgentId: string;
  sellerAgentId: string;
  amount: number;
  earnestMoney: number;
  downPayment: number;
  financingType: Offer["financingType"];
  contingencies?: string[];
  closingDate: string;
  inspectionDate?: string;
  appraisalDate?: string;
  expiresAt: string;
  notes?: string;
}

export interface OfferUpdateInput {
  status?: Offer["status"];
  responseNotes?: string;
  counterOffer?: Offer["counterOffer"];
}

export interface OfferFilter {
  propertyId?: string;
  listingId?: string;
  buyerId?: string;
  buyerAgentId?: string;
  sellerAgentId?: string;
  status?: Offer["status"][];
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "amount" | "createdAt" | "closingDate";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

const offers: Map<string, Offer> = new Map();

export class OfferService {
  async create(input: OfferCreateInput): Promise<Offer> {
    const id = `ofr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    const offer: Offer = {
      id,
      propertyId: input.propertyId,
      listingId: input.listingId,
      buyerId: input.buyerId,
      buyerAgentId: input.buyerAgentId,
      sellerAgentId: input.sellerAgentId,
      amount: input.amount,
      earnestMoney: input.earnestMoney,
      downPayment: input.downPayment,
      financingType: input.financingType,
      contingencies: input.contingencies || [],
      closingDate: input.closingDate,
      inspectionDate: input.inspectionDate,
      appraisalDate: input.appraisalDate,
      expiresAt: input.expiresAt,
      status: "pending",
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    offers.set(id, offer);
    return offer;
  }

  async getById(id: string): Promise<Offer | null> {
    return offers.get(id) || null;
  }

  async update(id: string, input: OfferUpdateInput): Promise<Offer | null> {
    const existing = offers.get(id);
    if (!existing) return null;

    const updated: Offer = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    if (input.status && input.status !== "pending") {
      updated.respondedAt = new Date().toISOString();
    }

    offers.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return offers.delete(id);
  }

  async list(filter: OfferFilter = {}): Promise<{ items: Offer[]; total: number; page: number; limit: number }> {
    let results = Array.from(offers.values());

    if (filter.propertyId) {
      results = results.filter((o) => o.propertyId === filter.propertyId);
    }
    if (filter.listingId) {
      results = results.filter((o) => o.listingId === filter.listingId);
    }
    if (filter.buyerId) {
      results = results.filter((o) => o.buyerId === filter.buyerId);
    }
    if (filter.buyerAgentId) {
      results = results.filter((o) => o.buyerAgentId === filter.buyerAgentId);
    }
    if (filter.sellerAgentId) {
      results = results.filter((o) => o.sellerAgentId === filter.sellerAgentId);
    }
    if (filter.status && filter.status.length > 0) {
      results = results.filter((o) => filter.status!.includes(o.status));
    }
    if (filter.minAmount !== undefined) {
      results = results.filter((o) => o.amount >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      results = results.filter((o) => o.amount <= filter.maxAmount!);
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

  async accept(id: string, notes?: string): Promise<Offer | null> {
    return this.update(id, { status: "accepted", responseNotes: notes });
  }

  async reject(id: string, notes?: string): Promise<Offer | null> {
    return this.update(id, { status: "rejected", responseNotes: notes });
  }

  async counter(
    id: string,
    counterAmount: number,
    terms: string[],
    expiresAt: string
  ): Promise<Offer | null> {
    return this.update(id, {
      status: "countered",
      counterOffer: {
        amount: counterAmount,
        terms,
        expiresAt,
      },
    });
  }

  async withdraw(id: string, notes?: string): Promise<Offer | null> {
    return this.update(id, { status: "withdrawn", responseNotes: notes });
  }

  async getExpiredOffers(): Promise<Offer[]> {
    const now = new Date();
    return Array.from(offers.values()).filter(
      (o) =>
        o.status === "pending" &&
        new Date(o.expiresAt) < now
    );
  }

  async getOffersForProperty(propertyId: string): Promise<Offer[]> {
    return Array.from(offers.values())
      .filter((o) => o.propertyId === propertyId)
      .sort((a, b) => b.amount - a.amount);
  }

  async getBestOffer(propertyId: string): Promise<Offer | null> {
    const propertyOffers = await this.getOffersForProperty(propertyId);
    const pending = propertyOffers.filter((o) => o.status === "pending");
    return pending.length > 0 ? pending[0] : null;
  }

  async calculateOfferScore(offer: Offer, listingPrice: number): Promise<{
    score: number;
    factors: Array<{ name: string; score: number; weight: number }>;
  }> {
    const factors: Array<{ name: string; score: number; weight: number }> = [];

    const priceScore = Math.min(offer.amount / listingPrice, 1.5);
    factors.push({ name: "price", score: priceScore, weight: 0.4 });

    const cashScore = offer.financingType === "cash" ? 1.0 : 0.5;
    factors.push({ name: "financing", score: cashScore, weight: 0.2 });

    const earnestScore = Math.min(offer.earnestMoney / (offer.amount * 0.03), 1.0);
    factors.push({ name: "earnestMoney", score: earnestScore, weight: 0.15 });

    const daysToClose =
      (new Date(offer.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    const closingScore = Math.max(0, 1 - daysToClose / 60);
    factors.push({ name: "closingTimeline", score: closingScore, weight: 0.15 });

    const contingencyScore = Math.max(0, 1 - offer.contingencies.length * 0.2);
    factors.push({ name: "contingencies", score: contingencyScore, weight: 0.1 });

    const totalScore = factors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    );

    return {
      score: Math.round(totalScore * 100) / 100,
      factors,
    };
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    countered: number;
    averageAmount: number;
    totalValue: number;
  }> {
    const all = Array.from(offers.values());
    return {
      total: all.length,
      pending: all.filter((o) => o.status === "pending").length,
      accepted: all.filter((o) => o.status === "accepted").length,
      rejected: all.filter((o) => o.status === "rejected").length,
      countered: all.filter((o) => o.status === "countered").length,
      averageAmount: all.length > 0 ? all.reduce((s, o) => s + o.amount, 0) / all.length : 0,
      totalValue: all.reduce((s, o) => s + o.amount, 0),
    };
  }

  clear(): void {
    offers.clear();
  }
}

export const offerService = new OfferService();
