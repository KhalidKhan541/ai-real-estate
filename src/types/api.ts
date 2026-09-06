export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: ResponseMeta;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  description?: string;
}

export interface ApiHealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  timestamp: string;
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded";
  latency?: number;
  lastChecked: string;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  sender?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRange {
  start: string;
  end: string;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface BatchOperation<T> {
  operations: Array<{
    method: "create" | "update" | "delete";
    id?: string;
    data?: T;
  }>;
  results: BatchResult[];
}

export interface BatchResult {
  success: boolean;
  id?: string;
  error?: ApiError;
}

export interface WebhookPayload {
  id: string;
  event: string;
  data: unknown;
  timestamp: string;
  signature?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  sunsetDate?: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestInterceptor {
  (config: ApiRequestConfig): ApiRequestConfig | Promise<ApiRequestConfig>;
}

export interface ResponseInterceptor {
  (response: ApiResponse): ApiResponse | Promise<ApiResponse>;
}

export interface ErrorInterceptor {
  (error: ErrorResponse): ErrorResponse | Promise<ErrorResponse>;
}

export default ApiResponse;
