import { transactionService, TransactionService } from "@/lib/transactions/transaction-service";

const service = new TransactionService();

beforeEach(() => {
  service.clear();
});

const mockTransaction = {
  propertyId: "prop_123",
  listingId: "lst_456",
  offerId: "ofr_789",
  buyerId: "user_buyer",
  sellerId: "user_seller",
  buyerAgentId: "agt_buyer",
  sellerAgentId: "agt_seller",
  purchasePrice: 450000,
  earnestMoney: 10000,
  downPayment: 90000,
  loanAmount: 360000,
  closingCosts: 9000,
  agentCommission: 27000,
  closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

describe("TransactionService", () => {
  describe("create", () => {
    it("should create a new transaction", async () => {
      const txn = await service.create(mockTransaction);

      expect(txn).toBeDefined();
      expect(txn.id).toMatch(/^txn_/);
      expect(txn.propertyId).toBe("prop_123");
      expect(txn.purchasePrice).toBe(450000);
      expect(txn.earnestMoney).toBe(10000);
      expect(txn.downPayment).toBe(90000);
      expect(txn.loanAmount).toBe(360000);
      expect(txn.closingCosts).toBe(9000);
      expect(txn.agentCommission).toBe(27000);
      expect(txn.status).toBe("pending");
      expect(txn.timeline).toHaveLength(1);
      expect(txn.timeline[0].status).toBe("pending");
      expect(txn.documents).toEqual([]);
    });

    it("should set optional fields", async () => {
      const txn = await service.create({
        ...mockTransaction,
        lenderId: "lender_123",
        titleCompanyId: "title_456",
      });

      expect(txn.lenderId).toBe("lender_123");
      expect(txn.titleCompanyId).toBe("title_456");
    });
  });

  describe("getById", () => {
    it("should return transaction by id", async () => {
      const created = await service.create(mockTransaction);
      const found = await service.getById(created.id);

      expect(found).toEqual(created);
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non_existent");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update transaction status", async () => {
      const created = await service.create(mockTransaction);
      const updated = await service.update(created.id, {
        status: "under-contract",
      });

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe("under-contract");
      expect(updated!.timeline).toHaveLength(2);
      expect(updated!.timeline[1].status).toBe("under-contract");
    });

    it("should set actual closing date on completion", async () => {
      const created = await service.create(mockTransaction);
      const completed = await service.update(created.id, {
        status: "completed",
      });

      expect(completed!.actualClosingDate).toBeDefined();
    });

    it("should update inspection results", async () => {
      const created = await service.create(mockTransaction);
      const updated = await service.update(created.id, {
        status: "inspection",
        inspectionResults: {
          passed: true,
          issues: [],
          inspectedAt: new Date().toISOString(),
        },
      });

      expect(updated!.inspectionResults).toBeDefined();
      expect(updated!.inspectionResults!.passed).toBe(true);
    });

    it("should update appraisal result", async () => {
      const created = await service.create(mockTransaction);
      const updated = await service.update(created.id, {
        status: "appraisal",
        appraisalResult: {
          value: 460000,
          passed: true,
          appraisedAt: new Date().toISOString(),
        },
      });

      expect(updated!.appraisalResult).toBeDefined();
      expect(updated!.appraisalResult!.value).toBe(460000);
    });

    it("should return null for non-existent transaction", async () => {
      const updated = await service.update("non_existent", {
        status: "under-contract",
      });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a transaction", async () => {
      const created = await service.create(mockTransaction);
      const deleted = await service.delete(created.id);

      expect(deleted).toBe(true);
      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("should return false for non-existent transaction", async () => {
      const deleted = await service.delete("non_existent");

      expect(deleted).toBe(false);
    });
  });

  describe("advanceStatus", () => {
    it("should advance through status pipeline", async () => {
      const created = await service.create(mockTransaction);

      let txn = await service.advanceStatus(created.id);
      expect(txn!.status).toBe("under-contract");

      txn = await service.advanceStatus(txn!.id);
      expect(txn!.status).toBe("inspection");

      txn = await service.advanceStatus(txn!.id);
      expect(txn!.status).toBe("appraisal");

      txn = await service.advanceStatus(txn!.id);
      expect(txn!.status).toBe("financing");

      txn = await service.advanceStatus(txn!.id);
      expect(txn!.status).toBe("title");

      txn = await service.advanceStatus(txn!.id);
      expect(txn!.status).toBe("closing");

      txn = await service.advanceStatus(txn!.id);
      expect(txn!.status).toBe("completed");
    });

    it("should return null if already completed", async () => {
      const created = await service.create(mockTransaction);
      let txn = created;
      for (let i = 0; i < 7; i++) {
        txn = (await service.advanceStatus(txn!.id))!;
      }

      const result = await service.advanceStatus(txn!.id);

      expect(result).toBeNull();
    });

    it("should return null for non-existent transaction", async () => {
      const result = await service.advanceStatus("non_existent");

      expect(result).toBeNull();
    });
  });

  describe("cancel", () => {
    it("should cancel a transaction", async () => {
      const created = await service.create(mockTransaction);
      const cancelled = await service.cancel(created.id);

      expect(cancelled!.status).toBe("cancelled");
    });
  });

  describe("addDocument", () => {
    it("should add a document", async () => {
      const created = await service.create(mockTransaction);
      const updated = await service.addDocument(created.id, {
        name: "Purchase Agreement",
        type: "contract",
        url: "https://example.com/doc.pdf",
        uploadedBy: "user_buyer",
      });

      expect(updated!.documents).toHaveLength(1);
      expect(updated!.documents[0].name).toBe("Purchase Agreement");
      expect(updated!.documents[0].uploadedAt).toBeDefined();
    });

    it("should return null for non-existent transaction", async () => {
      const result = await service.addDocument("non_existent", {
        name: "Doc",
        type: "contract",
        url: "https://example.com/doc.pdf",
        uploadedBy: "user",
      });

      expect(result).toBeNull();
    });
  });

  describe("removeDocument", () => {
    it("should remove a document", async () => {
      const created = await service.create(mockTransaction);
      const withDoc = await service.addDocument(created.id, {
        name: "Doc",
        type: "contract",
        url: "https://example.com/doc.pdf",
        uploadedBy: "user",
      });

      const docId = withDoc!.documents[0].id;
      const updated = await service.removeDocument(created.id, docId);

      expect(updated!.documents).toHaveLength(0);
    });
  });

  describe("getTimeline", () => {
    it("should return transaction timeline", async () => {
      const created = await service.create(mockTransaction);
      await service.advanceStatus(created.id);

      const timeline = await service.getTimeline(created.id);

      expect(timeline).toHaveLength(2);
    });

    it("should return empty for non-existent transaction", async () => {
      const timeline = await service.getTimeline("non_existent");

      expect(timeline).toEqual([]);
    });
  });

  describe("getDaysUntilClosing", () => {
    it("should return days until closing", async () => {
      const created = await service.create(mockTransaction);

      const days = await service.getDaysUntilClosing(created.id);

      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it("should return null for non-existent transaction", async () => {
      const days = await service.getDaysUntilClosing("non_existent");

      expect(days).toBeNull();
    });
  });

  describe("getAgentCommission", () => {
    it("should calculate agent commission", async () => {
      const txn1 = await service.create(mockTransaction);
      const txn2 = await service.create({
        ...mockTransaction,
        purchasePrice: 300000,
        agentCommission: 18000,
      });
      await service.update(txn1.id, { status: "completed" });
      await service.update(txn2.id, { status: "completed" });

      const result = await service.getAgentCommission("agt_buyer");

      expect(result.totalCommission).toBe(45000);
      expect(result.transactionCount).toBe(2);
      expect(result.averageCommission).toBe(22500);
    });
  });

  describe("list", () => {
    it("should return all transactions", async () => {
      await service.create(mockTransaction);
      await service.create({ ...mockTransaction, purchasePrice: 300000 });

      const result = await service.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter by status", async () => {
      const t1 = await service.create(mockTransaction);
      await service.create({ ...mockTransaction, purchasePrice: 300000 });
      await service.update(t1.id, { status: "completed" });

      const result = await service.list({ status: ["pending"] });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by buyer", async () => {
      await service.create(mockTransaction);
      await service.create({ ...mockTransaction, buyerId: "user_other" });

      const result = await service.list({ buyerId: "user_buyer" });

      expect(result.items).toHaveLength(1);
    });

    it("should filter by agent", async () => {
      await service.create(mockTransaction);
      await service.create({
        ...mockTransaction,
        buyerAgentId: "agt_other",
        sellerAgentId: "agt_other",
      });

      const result = await service.list({ agentId: "agt_buyer" });

      expect(result.items).toHaveLength(1);
    });

    it("should sort by purchase price", async () => {
      await service.create({ ...mockTransaction, purchasePrice: 600000 });
      await service.create({ ...mockTransaction, purchasePrice: 300000 });

      const result = await service.list({
        sortBy: "purchasePrice",
        sortOrder: "asc",
      });

      expect(result.items[0].purchasePrice).toBe(300000);
      expect(result.items[1].purchasePrice).toBe(600000);
    });
  });

  describe("getStats", () => {
    it("should return transaction statistics", async () => {
      const t1 = await service.create(mockTransaction);
      const t2 = await service.create({
        ...mockTransaction,
        purchasePrice: 300000,
      });
      await service.update(t1.id, { status: "completed" });
      await service.cancel(t2.id);

      const stats = await service.getStats();

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.active).toBe(0);
      expect(stats.totalValue).toBe(750000);
      expect(stats.averagePrice).toBe(375000);
    });
  });
});
