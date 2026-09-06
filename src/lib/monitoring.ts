interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  status: "ok" | "error";
}

class MonitoringService {
  private metrics: Metric[] = [];
  private logs: LogEntry[] = [];
  private spans: Span[] = [];
  private readonly maxEntries = 10000;

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries);
    }
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const existing = this.metrics.find(
      (m) => m.name === name && JSON.stringify(m.labels) === JSON.stringify(labels)
    );
    if (existing) {
      existing.value += 1;
      existing.timestamp = Date.now();
    } else {
      this.recordMetric(name, 1, labels);
    }
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(`${name}_sum`, value, labels);
    this.recordMetric(`${name}_count`, 1, labels);
    this.recordMetric(`${name}_bucket`, value, { ...labels, le: String(value) });
  }

  log(entry: Omit<LogEntry, "timestamp">): void {
    this.logs.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    if (this.logs.length > this.maxEntries) {
      this.logs = this.logs.slice(-this.maxEntries);
    }
  }

  info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({ level: "info", message, context, requestId });
  }

  warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({ level: "warn", message, context, requestId });
  }

  error(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({ level: "error", message, context, requestId });
  }

  debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.log({ level: "debug", message, context, requestId });
  }

  startSpan(name: string, traceId?: string, attributes?: Record<string, string | number | boolean>): Span {
    const span: Span = {
      traceId: traceId || `trace_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      spanId: `span_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      startTime: Date.now(),
      attributes: attributes || {},
      status: "ok",
    };
    this.spans.push(span);
    return span;
  }

  endSpan(span: Span, error?: Error): void {
    span.endTime = Date.now();
    if (error) {
      span.status = "error";
      span.attributes.error = error.message;
    }
  }

  trackRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.incrementCounter("http_requests_total", { method, path, status: String(statusCode) });
    this.recordHistogram("http_request_duration_ms", durationMs, { method, path });
  }

  trackPageView(page: string, userId?: string): void {
    this.incrementCounter("page_views", { page, userId: userId || "anonymous" });
  }

  trackAIUsage(provider: string, model: string, tokens: number, latencyMs: number): void {
    this.incrementCounter("ai_requests_total", { provider, model });
    this.recordHistogram("ai_tokens_total", tokens, { provider, model });
    this.recordHistogram("ai_latency_ms", latencyMs, { provider, model });
  }

  trackPropertyView(propertyId: string, userId?: string): void {
    this.incrementCounter("property_views", { propertyId, userId: userId || "anonymous" });
  }

  trackSearch(query: string, resultCount: number, latencyMs: number): void {
    this.incrementCounter("search_queries_total", { query_length: String(query.length) });
    this.recordHistogram("search_results_count", resultCount);
    this.recordHistogram("search_latency_ms", latencyMs);
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  getLogs(level?: LogEntry["level"], limit: number = 100): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter((l) => l.level === level);
    }
    return filtered.slice(-limit);
  }

  getActiveSpans(): Span[] {
    return this.spans.filter((s) => !s.endTime);
  }

  getCompletedSpans(limit: number = 100): Span[] {
    return this.spans
      .filter((s) => s.endTime)
      .slice(-limit);
  }

  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<string, { status: string; message: string }>;
  } {
    const recentErrors = this.logs.filter(
      (l) =>
        l.level === "error" &&
        new Date(l.timestamp).getTime() > Date.now() - 5 * 60 * 1000
    ).length;

    const activeSpans = this.spans.filter((s) => !s.endTime).length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (recentErrors > 10) status = "unhealthy";
    else if (recentErrors > 5) status = "degraded";

    return {
      status,
      checks: {
        errors: {
          status: recentErrors > 10 ? "fail" : recentErrors > 5 ? "warn" : "pass",
          message: `${recentErrors} errors in last 5 minutes`,
        },
        activeSpans: {
          status: activeSpans > 100 ? "warn" : "pass",
          message: `${activeSpans} active spans`,
        },
      },
    };
  }

  flush(): void {
    this.metrics = [];
    this.logs = [];
    this.spans = [];
  }
}

export const monitoring = new MonitoringService();
export default monitoring;
