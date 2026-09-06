// ─────────────────────────────────────────────────────────────────────────────
// Structured Logging - AI Real Estate Platform
// ─────────────────────────────────────────────────────────────────────────────

import { env } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// Log Levels
// ─────────────────────────────────────────────────────────────────────────────

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL,
};

// ─────────────────────────────────────────────────────────────────────────────
// Logger Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath: string;
  maxFileSize: string;
  maxFiles: number;
  enableJsonFormat: boolean;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableRequestId: boolean;
  redactFields: string[];
}

const defaultConfig: LoggerConfig = {
  level: LOG_LEVEL_MAP[env.LOG_LEVEL ?? "info"] ?? LogLevel.INFO,
  enableConsole: env.NODE_ENV !== "test",
  enableFile: env.NODE_ENV === "production",
  filePath: "logs",
  maxFileSize: "10m",
  maxFiles: 5,
  enableJsonFormat: env.NODE_ENV === "production",
  enableColors: env.NODE_ENV === "development",
  enableTimestamp: true,
  enableRequestId: true,
  redactFields: [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "authorization",
    "creditCard",
    "ssn",
    "bankAccount",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Log Context
// ─────────────────────────────────────────────────────────────────────────────

export interface LogContext {
  requestId?: string;
  userId?: string;
  userRole?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  data?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Codes
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  reset: "\x1b[0m",
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m",  // Green
  warn: "\x1b[33m",  // Yellow
  error: "\x1b[31m", // Red
  fatal: "\x1b[35m", // Magenta
  timestamp: "\x1b[90m", // Gray
  context: "\x1b[34m", // Blue
  message: "\x1b[0m",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

function redactSensitiveData(
  data: Record<string, unknown>,
  redactFields: string[]
): Record<string, unknown> {
  const redacted = { ...data };

  for (const key of Object.keys(redacted)) {
    if (redactFields.includes(key.toLowerCase())) {
      if (typeof redacted[key] === "string") {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = "[REDACTED]";
      }
    }
  }

  return redacted;
}

function formatTimestamp(date: Date): string {
  return date.toISOString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function formatLevel(level: LogLevel, useColors: boolean): string {
  const levelName = LogLevel[level].padEnd(5);
  if (!useColors) return levelName;

  const colorKey = LogLevel[level].toLowerCase() as keyof typeof COLORS;
  const color = COLORS[colorKey] ?? COLORS.reset;
  return `${color}${levelName}${COLORS.reset}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logger Class
// ─────────────────────────────────────────────────────────────────────────────

class Logger {
  private config: LoggerConfig;
  private context: LogContext;

  constructor(config: Partial<LoggerConfig> = {}, context: LogContext = {}) {
    this.config = { ...defaultConfig, ...config };
    this.context = context;
  }

  // ─── Child Logger ─────────────────────────────────────────────────────────

  child(context: LogContext): Logger {
    return new Logger(this.config, { ...this.context, ...context });
  }

  // ─── Core Logging Methods ────────────────────────────────────────────────

  debug(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  info(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  warn(message: string, data?: unknown, context?: LogContext): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.ERROR, message, errorData, context);
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorData = this.formatError(error);
    this.log(LogLevel.FATAL, message, errorData, context);
  }

  // ─── HTTP Request Logging ────────────────────────────────────────────────

  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level =
      statusCode >= 500
        ? LogLevel.ERROR
        : statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;

    const message = `${method} ${path} ${statusCode} ${formatDuration(duration)}`;

    this.log(level, message, undefined, {
      ...context,
      method,
      path,
      statusCode,
      duration,
    });
  }

  // ─── Database Logging ────────────────────────────────────────────────────

  database(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext
  ): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `DB ${operation} on ${table} took ${formatDuration(duration)}`;

    this.log(level, message, undefined, {
      ...context,
      action: operation,
      resource: table,
      duration,
    });
  }

  // ─── Performance Logging ─────────────────────────────────────────────────

  performance(
    operation: string,
    duration: number,
    context?: LogContext
  ): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `Performance: ${operation} took ${formatDuration(duration)}`;

    this.log(level, message, undefined, {
      ...context,
      action: operation,
      duration,
    });
  }

  // ─── Audit Logging ───────────────────────────────────────────────────────

  audit(
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>,
    context?: LogContext
  ): void {
    const message = `AUDIT: ${action} on ${resource} (${resourceId})`;
    const data = details
      ? redactSensitiveData(details, this.config.redactFields)
      : undefined;

    this.log(LogLevel.INFO, message, data, {
      ...context,
      action,
      resource,
      resourceId,
    });
  }

  // ─── Security Logging ────────────────────────────────────────────────────

  security(
    event: string,
    details?: Record<string, unknown>,
    context?: LogContext
  ): void {
    const message = `SECURITY: ${event}`;
    const data = details
      ? redactSensitiveData(details, this.config.redactFields)
      : undefined;

    this.log(LogLevel.WARN, message, data, {
      ...context,
      action: event,
    });
  }

  // ─── Business Event Logging ──────────────────────────────────────────────

  business(
    event: string,
    details?: Record<string, unknown>,
    context?: LogContext
  ): void {
    const message = `BUSINESS: ${event}`;
    const data = details
      ? redactSensitiveData(details, this.config.redactFields)
      : undefined;

    this.log(LogLevel.INFO, message, data, context);
  }

  // ─── Core Log Method ─────────────────────────────────────────────────────

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: LogContext
  ): void {
    if (level < this.config.level) return;

    const timestamp = formatTimestamp(new Date());
    const fullContext = { ...this.context, ...context };

    if (this.config.enableJsonFormat) {
      this.logJson(level, timestamp, message, data, fullContext);
    } else {
      this.logPretty(level, timestamp, message, data, fullContext);
    }
  }

  // ─── JSON Format ─────────────────────────────────────────────────────────

  private logJson(
    level: LogLevel,
    timestamp: string,
    message: string,
    data?: unknown,
    context?: LogContext
  ): void {
    const entry: LogEntry = {
      timestamp,
      level: LogLevel[level],
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = redactSensitiveData(
        context as Record<string, unknown>,
        this.config.redactFields
      ) as LogContext;
    }

    if (data !== undefined) {
      entry.data = data;
    }

    const output = JSON.stringify(entry);

    switch (level) {
      case LogLevel.FATAL:
        console.error(output);
        // In production, you might want to process.exit(1) here
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  // ─── Pretty Format ──────────────────────────────────────────────────────

  private logPretty(
    level: LogLevel,
    timestamp: string,
    message: string,
    data?: unknown,
    context?: LogContext
  ): void {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      const ts = `${COLORS.timestamp}${timestamp}${COLORS.reset}`;
      parts.push(ts);
    }

    parts.push(formatLevel(level, this.config.enableColors));
    parts.push(message);

    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(
        redactSensitiveData(
          context as Record<string, unknown>,
          this.config.redactFields
        ),
        null,
        2
      );
      if (this.config.enableColors) {
        parts.push(`${COLORS.context}${contextStr}${COLORS.reset}`);
      } else {
        parts.push(contextStr);
      }
    }

    if (data !== undefined) {
      const dataStr = JSON.stringify(data, null, 2);
      parts.push(dataStr);
    }

    const output = parts.join("\n");

    switch (level) {
      case LogLevel.FATAL:
        console.error(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  // ─── Error Formatting ────────────────────────────────────────────────────

  private formatError(error: Error | unknown): LogEntry["error"] {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
        code: (error as Error & { code?: string }).code,
      };
    }

    if (typeof error === "string") {
      return {
        name: "Error",
        message: error,
      };
    }

    return {
      name: "UnknownError",
      message: "An unknown error occurred",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Logger Instance
// ─────────────────────────────────────────────────────────────────────────────

export const logger = new Logger();

export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

export function getLogger(context?: LogContext): Logger {
  if (context) {
    return logger.child(context);
  }
  return logger;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Logger Middleware
// ─────────────────────────────────────────────────────────────────────────────

export interface RequestLogData {
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  ip?: string;
  userAgent?: string;
  userId?: string;
  userRole?: string;
  requestId?: string;
}

export function logRequest(data: RequestLogData): void {
  const { method, path, query, body, ip, userAgent, userId, userRole, requestId } = data;

  logger.info(
    `Incoming request: ${method} ${path}`,
    {
      query,
      body: body ? "[present]" : undefined,
    },
    {
      method,
      path,
      ip,
      userAgent,
      userId,
      userRole,
      requestId,
    }
  );
}

export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestId?: string
): void {
  logger.request(method, path, statusCode, duration, { requestId });
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Logger
// ─────────────────────────────────────────────────────────────────────────────

export function logError(
  error: Error | unknown,
  context?: LogContext
): void {
  if (error instanceof Error) {
    logger.error(error.message, error, context);
  } else {
    logger.error("An unknown error occurred", error, context);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Performance Timer
// ─────────────────────────────────────────────────────────────────────────────

export class PerformanceTimer {
  private start: number;
  private label: string;
  private logger: Logger;

  constructor(label: string, logger?: Logger) {
    this.start = Date.now();
    this.label = label;
    this.logger = logger ?? getLogger();
  }

  end(context?: LogContext): number {
    const duration = Date.now() - this.start;
    this.logger.performance(this.label, duration, context);
    return duration;
  }

  stop(context?: LogContext): number {
    return this.end(context);
  }
}

export function startTimer(label: string, loggerInstance?: Logger): PerformanceTimer {
  return new PerformanceTimer(label, loggerInstance);
}

// ─────────────────────────────────────────────────────────────────────────────
// Conditional Logger (for testing)
// ─────────────────────────────────────────────────────────────────────────────

export function createSilentLogger(): Logger {
  return new Logger({
    level: LogLevel.FATAL,
    enableConsole: false,
    enableFile: false,
  });
}

export { Logger };
