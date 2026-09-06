export interface Transaction {
  id: string;
  propertyId: string;
  listingId: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  buyerAgentId: string;
  sellerAgentId: string;
  lenderId?: string;
  titleCompanyId?: string;
  status:
    | "pending"
    | "under-contract"
    | "inspection"
    | "appraisal"
    | "financing"
    | "title"
    | "closing"
    | "completed"
    | "cancelled"
    | "disputed";
  purchasePrice: number;
  earnestMoney: number;
  downPayment: number;
  loanAmount: number;
  closingCosts: number;
  agentCommission: number;
  closingDate: string;
  actualClosingDate?: string;
  timeline: Array<{
    status: Transaction["status"];
    date: string;
    notes?: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  inspectionResults?: {
    passed: boolean;
    issues: string[];
    reportUrl?: string;
    inspectedAt: string;
  };
  appraisalResult?: {
    value: number;
    passed: boolean;
    appraisedAt: string;
    reportUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreateInput {
  propertyId: string;
  listingId: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  buyerAgentId: string;
  sellerAgentId: string;
  lenderId?: string;
  titleCompanyId?: string;
  purchasePrice: number;
  earnestMoney: number;
  downPayment: number;
  loanAmount: number;
  closingCosts: number;
  agentCommission: number;
  closingDate: string;
}

export interface TransactionUpdateInput {
  status?: Transaction["status"];
  actualClosingDate?: string;
  inspectionResults?: Transaction["inspectionResults"];
  appraisalResult?: Transaction["appraisalResult"];
}

export interface TransactionFilter {
  propertyId?: string;
  buyerId?: string;
  sellerId?: string;
  agentId?: string;
  status?: Transaction["status"][];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "purchasePrice" | "closingDate" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

const transactions: Map<string, Transaction> = new Map();

export class TransactionService {
  async create(input: TransactionCreateInput): Promise<Transaction> {
    const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id,
      propertyId: input.propertyId,
      listingId: input.listingId,
      offerId: input.offerId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      buyerAgentId: input.buyerAgentId,
      sellerAgentId: input.sellerAgentId,
      lenderId: input.lenderId,
      titleCompanyId: input.titleCompanyId,
      status: "pending",
      purchasePrice: input.purchasePrice,
      earnestMoney: input.earnestMoney,
      downPayment: input.downPayment,
      loanAmount: input.loanAmount,
      closingCosts: input.closingCosts,
      agentCommission: input.agentCommission,
      closingDate: input.closingDate,
      timeline: [
        { status: "pending", date: now, notes: "Transaction created" },
      ],
      documents: [],
      createdAt: now,
      updatedAt: now,
    };

    transactions.set(id, transaction);
    return transaction;
  }

  async getById(id: string): Promise<Transaction | null> {
    return transactions.get(id) || null;
  }

  async update(id: string, input: TransactionUpdateInput): Promise<Transaction | null> {
    const existing = transactions.get(id);
    if (!existing) return null;

    const updated: Transaction = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    if (input.status && input.status !== existing.status) {
      updated.timeline = [
        ...existing.timeline,
        {
          status: input.status,
          date: new Date().toISOString(),
          notes: `Status changed to ${input.status}`,
        },
      ];
    }

    if (input.status === "completed" && !existing.actualClosingDate) {
      updated.actualClosingDate = new Date().toISOString();
    }

    transactions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return transactions.delete(id);
  }

  async list(filter: TransactionFilter = {}): Promise<{ items: Transaction[]; total: number; page: number; limit: number }> {
    let results = Array.from(transactions.values());

    if (filter.propertyId) {
      results = results.filter((t) => t.propertyId === filter.propertyId);
    }
    if (filter.buyerId) {
      results = results.filter((t) => t.buyerId === filter.buyerId);
    }
    if (filter.sellerId) {
      results = results.filter((t) => t.sellerId === filter.sellerId);
    }
    if (filter.agentId) {
      results = results.filter(
        (t) => t.buyerAgentId === filter.agentId || t.sellerAgentId === filter.agentId
      );
    }
    if (filter.status && filter.status.length > 0) {
      results = results.filter((t) => filter.status!.includes(t.status));
    }
    if (filter.minPrice !== undefined) {
      results = results.filter((t) => t.purchasePrice >= filter.minPrice!);
    }
    if (filter.maxPrice !== undefined) {
      results = results.filter((t) => t.purchasePrice <= filter.maxPrice!);
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

  async advanceStatus(id: string, notes?: string): Promise<Transaction | null> {
    const transaction = transactions.get(id);
    if (!transaction) return null;

    const statusOrder: Transaction["status"][] = [
      "pending",
      "under-contract",
      "inspection",
      "appraisal",
      "financing",
      "title",
      "closing",
      "completed",
    ];

    const currentIndex = statusOrder.indexOf(transaction.status);
    if (currentIndex === -1 || currentIndex >= statusOrder.length - 1) return null;

    return this.update(id, {
      status: statusOrder[currentIndex + 1],
    });
  }

  async cancel(id: string, reason?: string): Promise<Transaction | null> {
    return this.update(id, { status: "cancelled" });
  }

  async addDocument(
    id: string,
    doc: Omit<Transaction["documents"][0], "id" | "uploadedAt">
  ): Promise<Transaction | null> {
    const transaction = transactions.get(id);
    if (!transaction) return null;

    const newDoc = {
      id: `doc_${Date.now()}`,
      ...doc,
      uploadedAt: new Date().toISOString(),
    };

    transaction.documents.push(newDoc);
    transaction.updatedAt = new Date().toISOString();
    return transaction;
  }

  async removeDocument(id: string, docId: string): Promise<Transaction | null> {
    const transaction = transactions.get(id);
    if (!transaction) return null;

    transaction.documents = transaction.documents.filter((d) => d.id !== docId);
    transaction.updatedAt = new Date().toISOString();
    return transaction;
  }

  async getTimeline(id: string): Promise<Transaction["timeline"]> {
    const transaction = transactions.get(id);
    return transaction?.timeline || [];
  }

  async getDaysUntilClosing(id: string): Promise<number | null> {
    const transaction = transactions.get(id);
    if (!transaction) return null;

    const closing = new Date(transaction.closingDate);
    const now = new Date();
    const diff = closing.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  async getAgentCommission(agentId: string): Promise<{
    totalCommission: number;
    transactionCount: number;
    averageCommission: number;
  }> {
    const agentTransactions = Array.from(transactions.values()).filter(
      (t) =>
        (t.buyerAgentId === agentId || t.sellerAgentId === agentId) &&
        t.status === "completed"
    );

    const totalCommission = agentTransactions.reduce(
      (sum, t) => sum + t.agentCommission,
      0
    );

    return {
      totalCommission,
      transactionCount: agentTransactions.length,
      averageCommission:
        agentTransactions.length > 0 ? totalCommission / agentTransactions.length : 0,
    };
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    totalValue: number;
    averagePrice: number;
    averageDaysToClose: number;
  }> {
    const all = Array.from(transactions.values());
    const completed = all.filter((t) => t.status === "completed");
    const cancelled = all.filter((t) => t.status === "cancelled");
    const active = all.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled"
    );

    const daysToClose = completed
      .filter((t) => t.actualClosingDate)
      .map((t) => {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.actualClosingDate!).getTime();
        return (end - start) / (1000 * 60 * 60 * 24);
      });

    return {
      total: all.length,
      active: active.length,
      completed: completed.length,
      cancelled: cancelled.length,
      totalValue: all.reduce((sum, t) => sum + t.purchasePrice, 0),
      averagePrice:
        all.length > 0
          ? all.reduce((sum, t) => sum + t.purchasePrice, 0) / all.length
          : 0,
      averageDaysToClose:
        daysToClose.length > 0
          ? daysToClose.reduce((s, d) => s + d, 0) / daysToClose.length
          : 0,
    };
  }

  clear(): void {
    transactions.clear();
  }
}

export const transactionService = new TransactionService();
