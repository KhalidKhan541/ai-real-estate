export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  source?: string;
}

export interface PageViewEvent {
  page: string;
  referrer?: string;
  title?: string;
  loadTime?: number;
}

export interface PropertyViewEvent {
  propertyId: string;
  propertyType?: string;
  price?: number;
  location?: string;
  source?: string;
}

export interface SearchEvent {
  query: string;
  filters?: Record<string, unknown>;
  resultCount: number;
  duration: number;
}

export interface UserActionEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export interface ConversionEvent {
  type: "lead" | "offer" | "appointment" | "signup";
  propertyId?: string;
  value?: number;
  source?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  endpoint?: string;
  flushInterval?: number;
  maxBatchSize?: number;
}

class Analytics {
  private config: AnalyticsConfig;
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private flushInterval: number;
  private maxBatchSize: number;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.flushInterval = config.flushInterval || 5000;
    this.maxBatchSize = config.maxBatchSize || 50;

    if (config.enabled) {
      this.startFlushTimer();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.queue.push(analyticsEvent);

    if (this.config.debug) {
      console.log("[Analytics]", event, properties);
    }

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (this.config.endpoint) {
      try {
        await fetch(this.config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
        });
      } catch (error) {
        console.error("[Analytics] Failed to flush events:", error);
        this.queue.unshift(...events);
      }
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.userId = userId;
    this.track("identify", { userId, ...traits });
  }

  page(page: string, properties?: Record<string, unknown>): void {
    this.track("page_view", { page, ...properties });
  }

  trackPageView(event: PageViewEvent): void {
    this.track("page_view", {
      page: event.page,
      referrer: event.referrer,
      title: event.title,
      loadTime: event.loadTime,
    });
  }

  trackPropertyView(event: PropertyViewEvent): void {
    this.track("property_view", {
      propertyId: event.propertyId,
      propertyType: event.propertyType,
      price: event.price,
      location: event.location,
      source: event.source,
    });
  }

  trackSearch(event: SearchEvent): void {
    this.track("search", {
      query: event.query,
      filters: event.filters,
      resultCount: event.resultCount,
      duration: event.duration,
    });
  }

  trackUserAction(event: UserActionEvent): void {
    this.track("user_action", {
      action: event.action,
      category: event.category,
      label: event.label,
      value: event.value,
    });
  }

  trackConversion(event: ConversionEvent): void {
    this.track("conversion", {
      type: event.type,
      propertyId: event.propertyId,
      value: event.value,
      source: event.source,
    });
  }

  trackPerformance(metric: PerformanceMetric): void {
    this.track("performance", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track("error", {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  trackTiming(name: string, duration: number): void {
    this.track("timing", { name, duration });
  }

  setSource(source: string): void {
    this.track("set_source", { source });
  }

  reset(): void {
    this.queue = [];
    this.sessionId = this.generateSessionId();
    this.userId = undefined;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) return 0;

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) return 0;

    const duration = end - start;
    this.recordMetric(name, duration);
    return duration;
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sorted.reduce((a, b) => a + b, 0) / count;

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      count,
      min,
      max,
      avg,
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
  }
}

let analyticsInstance: Analytics | null = null;

export function getAnalytics(config?: AnalyticsConfig): Analytics {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics(
      config || {
        enabled: process.env.NODE_ENV === "production",
        debug: process.env.NODE_ENV === "development",
        endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
      }
    );
  }
  return analyticsInstance;
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  getAnalytics().track(event, properties);
}

export function trackPageView(page: string): void {
  getAnalytics().trackPageView({ page });
}

export const performanceTracker = new PerformanceTracker();
export const analytics = getAnalytics();
export default analytics;
