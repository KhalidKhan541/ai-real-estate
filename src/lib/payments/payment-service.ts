import { nanoid } from 'nanoid';

// ─── Types & Enums ───────────────────────────────────────────────────────────

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum PaymentMethod {
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  ACH = 'ACH',
  CHECK = 'CHECK',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  ESCROW = 'ESCROW',
  CASH = 'CASH',
  MONEY_ORDER = 'MONEY_ORDER',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
}

export enum PaymentType {
  EARNEST_MONEY = 'EARNEST_MONEY',
  DOWN_PAYMENT = 'DOWN_PAYMENT',
  CLOSING_COSTS = 'CLOSING_COSTS',
  COMMISSION = 'COMMISSION',
  AGENT_FEE = 'AGENT_FEE',
  INSPECTION_FEE = 'INSPECTION_FEE',
  APPRAISAL_FEE = 'APPRAISAL_FEE',
  TITLE_FEE = 'TITLE_FEE',
  ESCROW_FEE = 'ESCROW_FEE',
  HOME_INSPECTION = 'HOME_INSPECTION',
  HOMEOWNERS_INSURANCE = 'HOMEOWNERS_INSURANCE',
  PROPERTY_TAX = 'PROPERTY_TAX',
  HOA_FEES = 'HOA_FEES',
  HOME_WARRANTY = 'HOME_WARRANTY',
  REPAIR_COST = 'REPAIR_COST',
  DEPOSIT_RETURN = 'DEPOSIT_RETURN',
  RENT = 'RENT',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT',
  LATE_FEE = 'LATE_FEE',
  PENALTY = 'PENALTY',
  OTHER = 'OTHER',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentFrequency {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  BI_WEEKLY = 'BI_WEEKLY',
}

export interface Payment {
  id: string;
  transactionId?: string;
  propertyId?: string;
  invoiceId?: string;
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  reference?: string;
  wireReference?: string;
  checkNumber?: string;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  notes: string[];
}

export interface Invoice {
  id: string;
  transactionId?: string;
  propertyId?: string;
  issuerId: string;
  issuerName: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  paymentTerms: string;
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  payments: string[];
  notes?: string;
  terms?: string;
  isRecurring: boolean;
  recurringFrequency?: PaymentFrequency;
  recurringEndDate?: Date;
  nextInvoiceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category?: PaymentType;
  taxRate?: number;
  discount?: number;
}

export interface CommissionPayment {
  id: string;
  transactionId: string;
  agentId: string;
  agentName: string;
  brokerId: string;
  brokerName: string;
  role: 'LISTING_AGENT' | 'SELLING_AGENT';
  purchasePrice: number;
  commissionRate: number;
  commissionAmount: number;
  agentShare: number;
  brokerShare: number;
  totalPaid: number;
  status: PaymentStatus;
  payments: string[];
  paidAt?: Date;
}

export interface CreatePaymentInput {
  transactionId?: string;
  propertyId?: string;
  invoiceId?: string;
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  currency?: string;
  type: PaymentType;
  method: PaymentMethod;
  description: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
}

export interface CreateInvoiceInput {
  transactionId?: string;
  propertyId?: string;
  issuerId: string;
  issuerName: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  items: Omit<InvoiceItem, 'id' | 'amount'>[];
  taxRate?: number;
  discountAmount?: number;
  paymentTerms?: string;
  dueDate: Date;
  notes?: string;
  terms?: string;
  isRecurring?: boolean;
  recurringFrequency?: PaymentFrequency;
  recurringEndDate?: Date;
}

export interface PaymentFilter {
  status?: PaymentStatus[];
  type?: PaymentType[];
  method?: PaymentMethod[];
  transactionId?: string;
  propertyId?: string;
  payerId?: string;
  payeeId?: string;
  minAmount?: number;
  maxAmount?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  refundedAmount: number;
  byType: Record<PaymentType, { count: number; amount: number }>;
  byMethod: Record<PaymentMethod, { count: number; amount: number }>;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidInvoices: number;
  paidAmount: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
}

// ─── Service Implementation ──────────────────────────────────────────────────

export class PaymentService {
  private payments: Map<string, Payment> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private commissionPayments: Map<string, CommissionPayment> = new Map();

  // ── Payment Processing ───────────────────────────────────────────────

  createPayment(input: CreatePaymentInput): Payment {
    this.validatePaymentInput(input);

    const id = `pay_${nanoid(12)}`;
    const now = new Date();

    const payment: Payment = {
      id,
      transactionId: input.transactionId,
      propertyId: input.propertyId,
      invoiceId: input.invoiceId,
      payerId: input.payerId,
      payerName: input.payerName,
      payeeId: input.payeeId,
      payeeName: input.payeeName,
      amount: input.amount,
      currency: input.currency || 'USD',
      type: input.type,
      method: input.method,
      status: PaymentStatus.PENDING,
      description: input.description,
      reference: input.reference,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      notes: [],
    };

    this.payments.set(id, payment);
    return payment;
  }

  processPayment(paymentId: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error(`Cannot process payment in status ${payment.status}`);
    }

    payment.status = PaymentStatus.PROCESSING;
    payment.updatedAt = new Date();

    return payment;
  }

  completePayment(paymentId: string, reference?: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new Error(`Cannot complete payment in status ${payment.status}`);
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.completedAt = new Date();
    payment.processedAt = new Date();
    if (reference) payment.reference = reference;
    payment.updatedAt = new Date();

    if (payment.invoiceId) {
      this.updateInvoicePayment(payment.invoiceId, payment.amount);
    }

    return payment;
  }

  failPayment(paymentId: string, reason: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    payment.status = PaymentStatus.FAILED;
    payment.failedAt = new Date();
    payment.failureReason = reason;
    payment.updatedAt = new Date();

    return payment;
  }

  refundPayment(
    paymentId: string,
    amount: number,
    reason: string
  ): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only refund completed payments');
    }

    if (amount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    if (payment.refundAmount && payment.refundAmount + amount > payment.amount) {
      throw new Error('Total refund amount cannot exceed original payment');
    }

    payment.refundAmount = (payment.refundAmount || 0) + amount;
    payment.refundReason = reason;
    payment.refundDate = new Date();

    if (payment.refundAmount === payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    payment.updatedAt = new Date();
    return payment;
  }

  cancelPayment(paymentId: string): Payment {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new Error('Cannot cancel completed payment');
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.updatedAt = new Date();
    return payment;
  }

  // ── Earnest Money ────────────────────────────────────────────────────

  createEarnestMoneyPayment(
    transactionId: string,
    payerId: string,
    payerName: string,
    payeeId: string,
    payeeName: string,
    amount: number,
    escrowAgentId: string
  ): Payment {
    const payment = this.createPayment({
      transactionId,
      payerId,
      payerName,
      payeeId,
      payeeName,
      amount,
      type: PaymentType.EARNEST_MONEY,
      method: PaymentMethod.WIRE_TRANSFER,
      description: `Earnest money deposit for transaction ${transactionId}`,
      metadata: { escrowAgentId, isEarnestMoney: true },
      createdBy: payerId,
    });

    return payment;
  }

  returnEarnestMoney(
    paymentId: string,
    recipientId: string,
    recipientName: string,
    amount: number,
    reason: string
  ): Payment {
    const originalPayment = this.payments.get(paymentId);
    if (!originalPayment) throw new Error(`Payment ${paymentId} not found`);

    const refundPayment = this.createPayment({
      transactionId: originalPayment.transactionId,
      payerId: originalPayment.payeeId,
      payerName: originalPayment.payeeName,
      payeeId: recipientId,
      payeeName: recipientName,
      amount,
      type: PaymentType.DEPOSIT_RETURN,
      method: PaymentMethod.WIRE_TRANSFER,
      description: `Earnest money return: ${reason}`,
      metadata: { originalPaymentId: paymentId, reason },
      createdBy: 'system',
    });

    refundPayment.status = PaymentStatus.COMPLETED;
    refundPayment.completedAt = new Date();
    this.payments.set(refundPayment.id, refundPayment);

    return refundPayment;
  }

  // ── Commission Payments ──────────────────────────────────────────────

  calculateCommissionPayments(
    transactionId: string,
    purchasePrice: number,
    commissionRate: number,
    listingAgentId: string,
    listingAgentName: string,
    sellingAgentId: string,
    sellingAgentName: string,
    listingBrokerId: string,
    listingBrokerName: string,
    sellingBrokerId: string,
    sellingBrokerName: string,
    listingAgentSplit: number = 70,
    sellingAgentSplit: number = 70
  ): CommissionPayment[] {
    const totalCommission = purchasePrice * (commissionRate / 100);
    const splitCommission = totalCommission / 2;

    const listingAgentAmount = splitCommission * (listingAgentSplit / 100);
    const listingBrokerAmount = splitCommission * (1 - listingAgentSplit / 100);
    const sellingAgentAmount = splitCommission * (sellingAgentSplit / 100);
    const sellingBrokerAmount = splitCommission * (1 - sellingAgentSplit / 100);

    const payments: CommissionPayment[] = [];

    const listingAgentPayment: CommissionPayment = {
      id: `comm_${nanoid(10)}`,
      transactionId,
      agentId: listingAgentId,
      agentName: listingAgentName,
      brokerId: listingBrokerId,
      brokerName: listingBrokerName,
      role: 'LISTING_AGENT',
      purchasePrice,
      commissionRate,
      commissionAmount: splitCommission,
      agentShare: listingAgentAmount,
      brokerShare: listingBrokerAmount,
      totalPaid: 0,
      status: PaymentStatus.PENDING,
      payments: [],
    };

    const sellingAgentPayment: CommissionPayment = {
      id: `comm_${nanoid(10)}`,
      transactionId,
      agentId: sellingAgentId,
      agentName: sellingAgentName,
      brokerId: sellingBrokerId,
      brokerName: sellingBrokerName,
      role: 'SELLING_AGENT',
      purchasePrice,
      commissionRate,
      commissionAmount: splitCommission,
      agentShare: sellingAgentAmount,
      brokerShare: sellingBrokerAmount,
      totalPaid: 0,
      status: PaymentStatus.PENDING,
      payments: [],
    };

    this.commissionPayments.set(listingAgentPayment.id, listingAgentPayment);
    this.commissionPayments.set(sellingAgentPayment.id, sellingAgentPayment);

    payments.push(listingAgentPayment, sellingAgentPayment);
    return payments;
  }

  payCommission(commissionPaymentId: string): Payment {
    const commPayment = this.commissionPayments.get(commissionPaymentId);
    if (!commPayment) throw new Error(`Commission payment ${commissionPaymentId} not found`);

    if (commPayment.status === PaymentStatus.COMPLETED) {
      throw new Error('Commission already paid');
    }

    const payment = this.createPayment({
      transactionId: commPayment.transactionId,
      payerId: commPayment.brokerId,
      payerName: commPayment.brokerName,
      payeeId: commPayment.agentId,
      payeeName: commPayment.agentName,
      amount: commPayment.agentShare,
      type: PaymentType.COMMISSION,
      method: PaymentMethod.WIRE_TRANSFER,
      description: `Commission payment for ${commPayment.role} - Transaction ${commPayment.transactionId}`,
      metadata: { commissionPaymentId: commPayment.id },
      createdBy: commPayment.brokerId,
    });

    payment.status = PaymentStatus.COMPLETED;
    payment.completedAt = new Date();
    this.payments.set(payment.id, payment);

    commPayment.totalPaid += commPayment.agentShare;
    commPayment.payments.push(payment.id);
    commPayment.status = PaymentStatus.COMPLETED;
    commPayment.paidAt = new Date();

    return payment;
  }

  // ── Fee Collection ───────────────────────────────────────────────────

  collectInspectionFee(
    transactionId: string,
    inspectorId: string,
    inspectorName: string,
    payerId: string,
    payerName: string,
    amount: number
  ): Payment {
    return this.createPayment({
      transactionId,
      payerId,
      payerName,
      payeeId: inspectorId,
      payeeName: inspectorName,
      amount,
      type: PaymentType.INSPECTION_FEE,
      method: PaymentMethod.CREDIT_CARD,
      description: 'Home inspection fee',
      createdBy: payerId,
    });
  }

  collectAppraisalFee(
    transactionId: string,
    appraiserId: string,
    appraiserName: string,
    payerId: string,
    payerName: string,
    amount: number
  ): Payment {
    return this.createPayment({
      transactionId,
      payerId,
      payerName,
      payeeId: appraiserId,
      payeeName: appraiserName,
      amount,
      type: PaymentType.APPRAISAL_FEE,
      method: PaymentMethod.CREDIT_CARD,
      description: 'Property appraisal fee',
      createdBy: payerId,
    });
  }

  collectTitleFee(
    transactionId: string,
    titleCompanyId: string,
    titleCompanyName: string,
    payerId: string,
    payerName: string,
    amount: number
  ): Payment {
    return this.createPayment({
      transactionId,
      payerId,
      payerName,
      payeeId: titleCompanyId,
      payeeName: titleCompanyName,
      amount,
      type: PaymentType.TITLE_FEE,
      method: PaymentMethod.WIRE_TRANSFER,
      description: 'Title insurance and search fee',
      createdBy: payerId,
    });
  }

  // ── Invoice Management ───────────────────────────────────────────────

  createInvoice(input: CreateInvoiceInput): Invoice {
    const id = `inv_${nanoid(10)}`;
    const now = new Date();

    const items: InvoiceItem[] = input.items.map((item) => ({
      ...item,
      id: `item_${nanoid(6)}`,
      amount: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * ((input.taxRate || 0) / 100);
    const discountAmount = input.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice: Invoice = {
      id,
      transactionId: input.transactionId,
      propertyId: input.propertyId,
      issuerId: input.issuerId,
      issuerName: input.issuerName,
      recipientId: input.recipientId,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      amountDue: totalAmount,
      status: InvoiceStatus.DRAFT,
      paymentTerms: input.paymentTerms || 'Net 30',
      dueDate: input.dueDate,
      issuedDate: now,
      payments: [],
      notes: input.notes,
      terms: input.terms,
      isRecurring: input.isRecurring || false,
      recurringFrequency: input.recurringFrequency,
      recurringEndDate: input.recurringEndDate,
      createdAt: now,
      updatedAt: now,
    };

    this.invoices.set(id, invoice);
    return invoice;
  }

  sendInvoice(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Cannot send invoice in status ${invoice.status}`);
    }

    invoice.status = InvoiceStatus.SENT;
    invoice.issuedDate = new Date();
    invoice.updatedAt = new Date();

    return invoice;
  }

  recordInvoicePayment(invoiceId: string, paymentId: string, amount: number): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.REFUNDED) {
      throw new Error(`Cannot record payment for invoice in status ${invoice.status}`);
    }

    invoice.payments.push(paymentId);
    invoice.amountPaid += amount;
    invoice.amountDue = invoice.totalAmount - invoice.amountPaid;

    if (invoice.amountDue <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidDate = new Date();
    } else {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    invoice.updatedAt = new Date();
    return invoice;
  }

  cancelInvoice(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel paid invoice');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.updatedAt = new Date();
    return invoice;
  }

  checkOverdueInvoices(): Invoice[] {
    const now = new Date();
    const overdue: Invoice[] = [];

    for (const invoice of this.invoices.values()) {
      if (
        (invoice.status === InvoiceStatus.SENT ||
          invoice.status === InvoiceStatus.VIEWED ||
          invoice.status === InvoiceStatus.PARTIALLY_PAID) &&
        invoice.dueDate < now
      ) {
        invoice.status = InvoiceStatus.OVERDUE;
        invoice.updatedAt = now;
        overdue.push(invoice);
      }
    }

    return overdue;
  }

  private updateInvoicePayment(invoiceId: string, amount: number): void {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return;

    invoice.amountPaid += amount;
    invoice.amountDue = invoice.totalAmount - invoice.amountPaid;

    if (invoice.amountDue <= 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidDate = new Date();
    } else if (invoice.amountPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    invoice.updatedAt = new Date();
  }

  // ── Queries & Analytics ──────────────────────────────────────────────

  getPayment(paymentId: string): Payment | undefined {
    return this.payments.get(paymentId);
  }

  getPaymentsByTransaction(transactionId: string): Payment[] {
    return Array.from(this.payments.values()).filter(
      (p) => p.transactionId === transactionId
    );
  }

  getPaymentsByProperty(propertyId: string): Payment[] {
    return Array.from(this.payments.values()).filter(
      (p) => p.propertyId === propertyId
    );
  }

  searchPayments(filter: PaymentFilter): Payment[] {
    let results = Array.from(this.payments.values());

    if (filter.status && filter.status.length > 0) {
      results = results.filter((p) => filter.status!.includes(p.status));
    }

    if (filter.type && filter.type.length > 0) {
      results = results.filter((p) => filter.type!.includes(p.type));
    }

    if (filter.method && filter.method.length > 0) {
      results = results.filter((p) => filter.method!.includes(p.method));
    }

    if (filter.transactionId) {
      results = results.filter((p) => p.transactionId === filter.transactionId);
    }

    if (filter.propertyId) {
      results = results.filter((p) => p.propertyId === filter.propertyId);
    }

    if (filter.payerId) {
      results = results.filter((p) => p.payerId === filter.payerId);
    }

    if (filter.payeeId) {
      results = results.filter((p) => p.payeeId === filter.payeeId);
    }

    if (filter.minAmount !== undefined) {
      results = results.filter((p) => p.amount >= filter.minAmount!);
    }

    if (filter.maxAmount !== undefined) {
      results = results.filter((p) => p.amount <= filter.maxAmount!);
    }

    if (filter.createdAfter) {
      results = results.filter((p) => p.createdAt >= filter.createdAfter!);
    }

    if (filter.createdBefore) {
      results = results.filter((p) => p.createdAt <= filter.createdBefore!);
    }

    return results;
  }

  getInvoice(invoiceId: string): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  getInvoicesByTransaction(transactionId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter(
      (i) => i.transactionId === transactionId
    );
  }

  getPaymentSummary(): PaymentSummary {
    const payments = Array.from(this.payments.values());

    const byType = {} as Record<PaymentType, { count: number; amount: number }>;
    const byMethod = {} as Record<PaymentMethod, { count: number; amount: number }>;

    for (const type of Object.values(PaymentType)) {
      byType[type] = { count: 0, amount: 0 };
    }
    for (const method of Object.values(PaymentMethod)) {
      byMethod[method] = { count: 0, amount: 0 };
    }

    let totalPayments = 0;
    let totalAmount = 0;
    let completedPayments = 0;
    let completedAmount = 0;
    let pendingPayments = 0;
    let pendingAmount = 0;
    let failedPayments = 0;
    let refundedAmount = 0;

    for (const payment of payments) {
      totalPayments++;
      totalAmount += payment.amount;
      byType[payment.type].count++;
      byType[payment.type].amount += payment.amount;
      byMethod[payment.method].count++;
      byMethod[payment.method].amount += payment.amount;

      if (payment.status === PaymentStatus.COMPLETED) {
        completedPayments++;
        completedAmount += payment.amount;
      } else if (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PROCESSING) {
        pendingPayments++;
        pendingAmount += payment.amount;
      } else if (payment.status === PaymentStatus.FAILED) {
        failedPayments++;
      }

      if (payment.refundAmount) {
        refundedAmount += payment.refundAmount;
      }
    }

    return {
      totalPayments,
      totalAmount,
      completedPayments,
      completedAmount,
      pendingPayments,
      pendingAmount,
      failedPayments,
      refundedAmount,
      byType,
      byMethod,
    };
  }

  getInvoiceSummary(): InvoiceSummary {
    const invoices = Array.from(this.invoices.values());

    let totalInvoices = 0;
    let totalAmount = 0;
    let paidInvoices = 0;
    let paidAmount = 0;
    let outstandingInvoices = 0;
    let outstandingAmount = 0;
    let overdueInvoices = 0;
    let overdueAmount = 0;

    for (const invoice of invoices) {
      totalInvoices++;
      totalAmount += invoice.totalAmount;

      if (invoice.status === InvoiceStatus.PAID) {
        paidInvoices++;
        paidAmount += invoice.totalAmount;
      } else if (invoice.status === InvoiceStatus.OVERDUE) {
        overdueInvoices++;
        overdueAmount += invoice.amountDue;
      } else if (
        invoice.status === InvoiceStatus.SENT ||
        invoice.status === InvoiceStatus.VIEWED ||
        invoice.status === InvoiceStatus.PARTIALLY_PAID
      ) {
        outstandingInvoices++;
        outstandingAmount += invoice.amountDue;
      }
    }

    return {
      totalInvoices,
      totalAmount,
      paidInvoices,
      paidAmount,
      outstandingInvoices,
      outstandingAmount,
      overdueInvoices,
      overdueAmount,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private validatePaymentInput(input: CreatePaymentInput): void {
    if (!input.payerId) throw new Error('Payer ID is required');
    if (!input.payeeId) throw new Error('Payee ID is required');
    if (input.amount <= 0) throw new Error('Payment amount must be positive');
    if (input.amount > 10_000_000) throw new Error('Payment amount exceeds maximum');
    if (!input.description) throw new Error('Payment description is required');
  }
}

// ── Export singleton ──────────────────────────────────────────────────────

export const paymentService = new PaymentService();
