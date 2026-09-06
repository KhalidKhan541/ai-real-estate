// ─────────────────────────────────────────────────────────────────────────────
// Custom Error Classes - AI Real Estate Platform
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Base Error
// ─────────────────────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.requestId = requestId;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      details: this.details,
      requestId: this.requestId,
      stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Errors
// ─────────────────────────────────────────────────────────────────────────────

export class AuthenticationError extends AppError {
  constructor(
    message: string = "Authentication required",
    details?: Record<string, unknown>
  ) {
    super(message, 401, "AUTHENTICATION_ERROR", true, details);
    this.name = "AuthenticationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "You are not authorized to perform this action",
    details?: Record<string, unknown>
  ) {
    super(message, 403, "UNAUTHORIZED", true, details);
    this.name = "UnauthorizedError";
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, 401, "TOKEN_EXPIRED", true);
    this.name = "TokenExpiredError";
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, 401, "INVALID_TOKEN", true);
    this.name = "InvalidTokenError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Errors
// ─────────────────────────────────────────────────────────────────────────────

export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[];

  constructor(
    message: string = "Validation failed",
    errors: ValidationErrorDetail[] = []
  ) {
    super(message, 400, "VALIDATION_ERROR", true, { errors });
    this.name = "ValidationError";
    this.errors = errors;
  }

  static fromZodError(zodError: { issues: Array<{ path: (string | number)[]; message: string }> }): ValidationError {
    const errors = zodError.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return new ValidationError("Validation failed", errors);
  }
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Errors
// ─────────────────────────────────────────────────────────────────────────────

export class DatabaseError extends AppError {
  constructor(
    message: string = "Database operation failed",
    details?: Record<string, unknown>
  ) {
    super(message, 500, "DATABASE_ERROR", true, details);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly resourceId?: string;

  constructor(
    resource: string = "Resource",
    resourceId?: string,
    message?: string
  ) {
    const msg = message ?? `${resource} not found${resourceId ? ` with ID: ${resourceId}` : ""}`;
    super(msg, 404, "NOT_FOUND", true, { resource, resourceId });
    this.name = "NotFoundError";
    this.resource = resource;
    this.resourceId = resourceId;
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource already exists",
    details?: Record<string, unknown>
  ) {
    super(message, 409, "CONFLICT", true, details);
    this.name = "ConflictError";
  }
}

export class DuplicateError extends ConflictError {
  constructor(
    field: string,
    value: string | number
  ) {
    super(`A record with ${field} '${value}' already exists`, { field, value });
    this.name = "DuplicateError";
    this.code = "DUPLICATE_ERROR";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Logic Errors
// ─────────────────────────────────────────────────────────────────────────────

export class PropertyError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "PROPERTY_ERROR", true, details);
    this.name = "PropertyError";
  }
}

export class ListingError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "LISTING_ERROR", true, details);
    this.name = "ListingError";
  }
}

export class OfferError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "OFFER_ERROR", true, details);
    this.name = "OfferError";
  }
}

export class TransactionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "TRANSACTION_ERROR", true, details);
    this.name = "TransactionError";
  }
}

export class AppointmentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "APPOINTMENT_ERROR", true, details);
    this.name = "AppointmentError";
  }
}

export class ClientError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "CLIENT_ERROR", true, details);
    this.name = "ClientError";
  }
}

export class AgentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "AGENT_ERROR", true, details);
    this.name = "AgentError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Errors
// ─────────────────────────────────────────────────────────────────────────────

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "PAYMENT_ERROR", true, details);
    this.name = "PaymentError";
  }
}

export class PaymentFailedError extends PaymentError {
  constructor(message: string = "Payment processing failed", details?: Record<string, unknown>) {
    super(message, { ...details, stage: "processing" });
    this.name = "PaymentFailedError";
    this.code = "PAYMENT_FAILED";
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(message: string = "Insufficient funds") {
    super(message);
    this.name = "InsufficientFundsError";
    this.code = "INSUFFICIENT_FUNDS";
  }
}

export class RefundError extends PaymentError {
  constructor(message: string = "Refund failed", details?: Record<string, unknown>) {
    super(message, details);
    this.name = "RefundError";
    this.code = "REFUND_ERROR";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// File & Upload Errors
// ─────────────────────────────────────────────────────────────────────────────

export class FileError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "FILE_ERROR", true, details);
    this.name = "FileError";
  }
}

export class FileSizeError extends FileError {
  constructor(maxSize: number, actualSize: number) {
    super(`File size ${actualSize} exceeds maximum allowed size of ${maxSize}`, {
      maxSize,
      actualSize,
    });
    this.name = "FileSizeError";
    this.code = "FILE_SIZE_EXCEEDED";
  }
}

export class FileTypeInvalidError extends FileError {
  constructor(allowedTypes: string[], actualType: string) {
    super(`File type '${actualType}' is not allowed. Allowed types: ${allowedTypes.join(", ")}`, {
      allowedTypes,
      actualType,
    });
    this.name = "FileTypeInvalidError";
    this.code = "FILE_TYPE_INVALID";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting Errors
// ─────────────────────────────────────────────────────────────────────────────

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(
    message: string = "Too many requests",
    retryAfter: number = 60
  ) {
    super(message, 429, "RATE_LIMITED", true, { retryAfter });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// External Service Errors
// ─────────────────────────────────────────────────────────────────────────────

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string = "External service error",
    details?: Record<string, unknown>
  ) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", true, { service, ...details });
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

export class EmailServiceError extends ExternalServiceError {
  constructor(message: string = "Email service error", details?: Record<string, unknown>) {
    super("email", message, details);
    this.name = "EmailServiceError";
  }
}

export class SMSServiceError extends ExternalServiceError {
  constructor(message: string = "SMS service error", details?: Record<string, unknown>) {
    super("sms", message, details);
    this.name = "SMSServiceError";
  }
}

export class MapServiceError extends ExternalServiceError {
  constructor(message: string = "Map service error", details?: Record<string, unknown>) {
    super("map", message, details);
    this.name = "MapServiceError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Service Errors
// ─────────────────────────────────────────────────────────────────────────────

export class AIServiceError extends ExternalServiceError {
  constructor(message: string = "AI service error", details?: Record<string, unknown>) {
    super("ai", message, details);
    this.name = "AIServiceError";
  }
}

export class AIServiceUnavailableError extends AIServiceError {
  constructor(message: string = "AI service is currently unavailable") {
    super(message);
    this.name = "AIServiceUnavailableError";
    this.code = "AI_SERVICE_UNAVAILABLE";
  }
}

export class AIQuotaExceededError extends AIServiceError {
  constructor(message: string = "AI service quota exceeded") {
    super(message);
    this.name = "AIQuotaExceededError";
    this.code = "AI_QUOTA_EXCEEDED";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Errors
// ─────────────────────────────────────────────────────────────────────────────

export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, "CONFIGURATION_ERROR", false, details);
    this.name = "ConfigurationError";
  }
}

export class EnvironmentError extends ConfigurationError {
  constructor(variable: string) {
    super(`Missing required environment variable: ${variable}`, {
      variable,
    });
    this.name = "EnvironmentError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Handler Utilities
//�────────────────────────────────────────────────────────────────────────────

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  return "INTERNAL_ERROR";
}

export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

export function formatErrorResponse(error: unknown, requestId?: string) {
  if (isAppError(error)) {
    return {
      success: false as const,
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
      requestId: requestId ?? error.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  if (error instanceof Error) {
    return {
      success: false as const,
      error:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false as const,
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
    statusCode: 500,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  code: string = "ERROR",
  details?: Record<string, unknown>,
  requestId?: string
) {
  return {
    success: false as const,
    error: message,
    code,
    details,
    statusCode,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Class Map (for i18n)
// ─────────────────────────────────────────────────────────────────────────────

export const ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_ERROR: "Please log in to continue",
  UNAUTHORIZED: "You don't have permission to do this",
  TOKEN_EXPIRED: "Your session has expired. Please log in again",
  INVALID_TOKEN: "Invalid authentication token",
  VALIDATION_ERROR: "Please check your input",
  DATABASE_ERROR: "A database error occurred. Please try again",
  NOT_FOUND: "The requested resource was not found",
  CONFLICT: "This resource already exists",
  PROPERTY_ERROR: "There was an issue with the property",
  LISTING_ERROR: "There was an issue with the listing",
  OFFER_ERROR: "There was an issue with the offer",
  TRANSACTION_ERROR: "There was an issue with the transaction",
  PAYMENT_ERROR: "There was an issue processing your payment",
  FILE_ERROR: "There was an issue with the file",
  RATE_LIMITED: "Too many requests. Please wait a moment",
  EXTERNAL_SERVICE_ERROR: "A service is temporarily unavailable",
  AI_SERVICE_ERROR: "The AI service is temporarily unavailable",
  CONFIGURATION_ERROR: "A configuration error occurred",
};
