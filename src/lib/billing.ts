export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  metadata?: Record<string, string>;
}

export interface Subscription {
  id: string;
  customerId: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  planId: string;
  cancelAtPeriodEnd: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface Price {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    intervalCount: number;
  };
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  automaticPaymentMethods?: boolean;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

class StripeService {
  private secretKey: string;
  private webhookSecret: string;

  constructor(config: StripeConfig) {
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `https://api.stripe.com/v1${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Stripe API error");
    }

    return response.json();
  }

  private encodeParams(params: Record<string, unknown>, prefix?: string): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === null || value === undefined) continue;

      if (typeof value === "object" && !Array.isArray(value)) {
        parts.push(this.encodeParams(value as Record<string, unknown>, fullKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object") {
            parts.push(this.encodeParams(item, `${fullKey}[${index}]`));
          } else {
            parts.push(`${fullKey}[${index}]=${encodeURIComponent(String(item))}`);
          }
        });
      } else {
        parts.push(`${fullKey}=${encodeURIComponent(String(value))}`);
      }
    }

    return parts.filter(Boolean).join("&");
  }

  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntent> {
    const body = this.encodeParams({
      amount: params.amount,
      currency: params.currency || "usd",
      ...(params.customerId && { customer: params.customerId }),
      ...(params.metadata && { metadata: params.metadata }),
      automatic_payment_methods: {
        enabled: params.automaticPaymentMethods ?? true,
      },
    });

    return this.request<PaymentIntent>("/payment_intents", {
      method: "POST",
      body,
    });
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(`/payment_intents/${id}`);
  }

  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(`/payment_intents/${id}/cancel`, {
      method: "POST",
    });
  }

  async createCustomer(params: CreateCustomerParams): Promise<Customer> {
    const body = this.encodeParams({
      email: params.email,
      ...(params.name && { name: params.name }),
      ...(params.phone && { phone: params.phone }),
      ...(params.metadata && { metadata: params.metadata }),
    });

    return this.request<Customer>("/customers", {
      method: "POST",
      body,
    });
  }

  async retrieveCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async updateCustomer(
    id: string,
    params: Partial<CreateCustomerParams>
  ): Promise<Customer> {
    const body = this.encodeParams({
      ...(params.email && { email: params.email }),
      ...(params.name && { name: params.name }),
      ...(params.phone && { phone: params.phone }),
      ...(params.metadata && { metadata: params.metadata }),
    });

    return this.request<Customer>(`/customers/${id}`, {
      method: "POST",
      body,
    });
  }

  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<Subscription> {
    const body = this.encodeParams({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      ...(params.trialDays && { trial_period_days: params.trialDays }),
      ...(params.metadata && { metadata: params.metadata }),
    });

    return this.request<Subscription>("/subscriptions", {
      method: "POST",
      body,
    });
  }

  async retrieveSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}`);
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}`, {
      method: "DELETE",
    });
  }

  async updateSubscription(
    id: string,
    params: { priceId?: string; metadata?: Record<string, string> }
  ): Promise<Subscription> {
    const body = this.encodeParams({
      ...(params.priceId && {
        items: [{ price: params.priceId }],
        proration: "always_invoice",
      }),
      ...(params.metadata && { metadata: params.metadata }),
    });

    return this.request<Subscription>(`/subscriptions/${id}`, {
      method: "POST",
      body,
    });
  }

  async listPrices(productId?: string): Promise<Price[]> {
    const params = productId ? `?product=${productId}` : "";
    const response = await this.request<{ data: Price[] }>(`/prices${params}`);
    return response.data;
  }

  verifyWebhookSignature(
    payload: string,
    signature: string
  ): WebhookEvent {
    const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    }, {});

    const timestamp = parseInt(parts.t || "0", 10);
    const v1 = parts.v1;

    if (!v1) {
      throw new Error("Invalid webhook signature");
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      throw new Error("Webhook signature timestamp too old");
    }

    return JSON.parse(payload) as WebhookEvent;
  }

  formatAmount(amount: number, currency: string = "usd"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  calculateMortgagePayment(
    principal: number,
    annualRate: number,
    years: number
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;

    if (monthlyRate === 0) {
      return principal / numPayments;
    }

    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return Math.round(payment * 100) / 100;
  }
}

let stripeInstance: StripeService | null = null;

export function getStripeService(config?: StripeConfig): StripeService {
  if (!stripeInstance && config) {
    stripeInstance = new StripeService(config);
  }
  if (!stripeInstance) {
    stripeInstance = new StripeService({
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    });
  }
  return stripeInstance;
}

export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    price: 0,
    features: ["5 listings", "Basic analytics", "Email support"],
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    price: 2999,
    features: ["25 listings", "Advanced analytics", "Priority support", "AI insights"],
  },
  PROFESSIONAL: {
    id: "professional",
    name: "Professional",
    price: 7999,
    features: ["100 listings", "Full analytics", "24/7 support", "AI insights", "Team collaboration"],
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    price: 19999,
    features: ["Unlimited listings", "Custom analytics", "Dedicated support", "Custom AI models", "API access"],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const stripe = getStripeService();
export default stripe;
