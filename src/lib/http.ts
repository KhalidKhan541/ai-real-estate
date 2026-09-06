export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: HttpError) => boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
}

export class HttpError extends Error {
  status: number;
  statusText: string;
  data?: unknown;
  headers: Record<string, string>;

  constructor(
    message: string,
    status: number,
    statusText: string,
    data?: unknown,
    headers: Record<string, string> = {}
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.headers = headers;
  }
}

class HttpClient {
  private config: HttpClientConfig;
  private interceptors: {
    request: Array<(config: RequestOptions) => RequestOptions | Promise<RequestOptions>>;
    response: Array<(response: HttpResponse) => HttpResponse | Promise<HttpResponse>>;
    error: Array<(error: HttpError) => HttpError | Promise<HttpError>>;
  };

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  useRequestInterceptor(
    interceptor: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>
  ): () => void {
    this.interceptors.request.push(interceptor);
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index > -1) this.interceptors.request.splice(index, 1);
    };
  }

  useResponseInterceptor(
    interceptor: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>
  ): () => void {
    this.interceptors.response.push(interceptor);
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index > -1) this.interceptors.response.splice(index, 1);
    };
  }

  useErrorInterceptor(
    interceptor: (error: HttpError) => HttpError | Promise<HttpError>
  ): () => void {
    this.interceptors.error.push(interceptor);
    return () => {
      const index = this.interceptors.error.indexOf(interceptor);
      if (index > -1) this.interceptors.error.splice(index, 1);
    };
  }

  private async processRequest(options: RequestOptions): Promise<RequestOptions> {
    let config = { ...options };

    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    return config;
  }

  private async processResponse<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let result = response as HttpResponse;

    for (const interceptor of this.interceptors.response) {
      result = await interceptor(result);
    }

    return result as HttpResponse<T>;
  }

  private async processError(error: HttpError): Promise<HttpError> {
    let processedError = error;

    for (const interceptor of this.interceptors.error) {
      processedError = await interceptor(processedError);
    }

    return processedError;
  }

  private buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
    const baseUrl = this.config.baseURL || "";
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    if (!params) return fullUrl;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number,
    retryDelay: number
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.signal ? 30000 : this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new HttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            errorData,
            Object.fromEntries(response.headers.entries())
          );
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof HttpError) {
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
          }
        }

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError || new Error("Request failed");
  }

  async request<T = unknown>(
    method: string,
    url: string,
    options: RequestOptions & { body?: unknown } = {}
  ): Promise<HttpResponse<T>> {
    let config = await this.processRequest(options);

    const fullUrl = this.buildUrl(url, config.params);

    const headers: Record<string, string> = {
      ...this.config.headers,
      ...config.headers,
    };

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await this.fetchWithRetry(
        fullUrl,
        fetchOptions,
        this.config.retries || 0,
        this.config.retryDelay || 1000
      );

      const data = await response.json();
      const responseHeaders = Object.fromEntries(response.headers.entries());

      let result: HttpResponse<T> = {
        data: data as T,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        config,
      };

      result = await this.processResponse(result);
      return result;
    } catch (error) {
      if (error instanceof HttpError) {
        throw await this.processError(error);
      }
      throw error;
    }
  }

  async get<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("GET", url, options);
  }

  async post<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("POST", url, { ...options, body });
  }

  async put<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PUT", url, { ...options, body });
  }

  async patch<T = unknown>(url: string, body?: unknown, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PATCH", url, { ...options, body });
  }

  async delete<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("DELETE", url, options);
  }

  async head<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("HEAD", url, options);
  }

  async options<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("OPTIONS", url, options);
  }

  async upload<T = unknown>(
    url: string,
    file: File | Blob | Buffer,
    fieldName: string = "file",
    options?: RequestOptions & { onProgress?: (progress: number) => void }
  ): Promise<HttpResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>("POST", url, {
      ...options,
      body: formData,
    });
  }

  setHeader(name: string, value: string): void {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[name] = value;
  }

  removeHeader(name: string): void {
    if (this.config.headers) {
      delete this.config.headers[name];
    }
  }
}

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

export const apiClient = createHttpClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 30000,
  retries: 3,
});

apiClient.useRequestInterceptor((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});

apiClient.useResponseInterceptor((response) => {
  return response;
});

apiClient.useErrorInterceptor(async (error) => {
  if (error.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
  }
  return error;
});

export default HttpClient;
