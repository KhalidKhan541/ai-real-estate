/**
 * Multi-provider AI client supporting OpenAI, Anthropic, and Gemini.
 * Unified interface for LLM interactions with retry logic, rate limiting, and fallbacks.
 */

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: { type: 'text' | 'json_object' };
  stopSequences?: string[];
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

export interface AIEmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface AIEmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: string;
  dimensions: number;
  usage: { totalTokens: number };
}

export interface AIVisionRequest {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface AIVisionResponse {
  content: string;
  model: string;
  provider: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
}

interface ProviderDefaults {
  model: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  openai: {
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    maxTokens: 4096,
    temperature: 0.7,
  },
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    baseUrl: 'https://api.anthropic.com',
    maxTokens: 4096,
    temperature: 0.7,
  },
  gemini: {
    model: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: 4096,
    temperature: 0.7,
  },
};

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-opus-4-20250514': { input: 15, output: 75 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-2.0-pro': { input: 1.25, output: 10 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
};

class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);
    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0];
      const waitTime = this.windowMs - (now - oldest) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    this.requests.push(now);
  }
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode: number,
    public retryable: boolean,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AIProvider {
  private config: AIProviderConfig;
  private defaults: ProviderDefaults;
  private rateLimiter: RateLimiter;
  private requestCount = 0;
  private totalTokensUsed = 0;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: PROVIDER_DEFAULTS[config.provider]?.temperature ?? 0.7,
      maxTokens: PROVIDER_DEFAULTS[config.provider]?.maxTokens ?? 4096,
      ...config,
    };
    this.defaults = PROVIDER_DEFAULTS[config.provider];
    this.rateLimiter = new RateLimiter(60, 60_000);
  }

  get provider(): string {
    return this.config.provider;
  }

  get stats() {
    return {
      provider: this.config.provider,
      requestCount: this.requestCount,
      totalTokensUsed: this.totalTokensUsed,
    };
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();
    const model = request.model ?? this.config.model ?? this.defaults.model;

    try {
      let response: AICompletionResponse;

      switch (this.config.provider) {
        case 'openai':
          response = await this.openaiComplete(request, model);
          break;
        case 'anthropic':
          response = await this.anthropicComplete(request, model);
          break;
        case 'gemini':
          response = await this.geminiComplete(request, model);
          break;
        default:
          throw new AIProviderError(
            `Unsupported provider: ${this.config.provider}`,
            this.config.provider,
            0,
            false
          );
      }

      response.latencyMs = Date.now() - startTime;
      this.requestCount++;
      this.totalTokensUsed += response.usage.totalTokens;
      return response;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        `Completion failed: ${(error as Error).message}`,
        this.config.provider,
        500,
        true,
        error as Error
      );
    }
  }

  async embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    await this.rateLimiter.acquire();
    const model = request.model ?? this.getEmbeddingModel();

    try {
      switch (this.config.provider) {
        case 'openai':
          return this.openaiEmbed(request, model);
        case 'anthropic':
          throw new AIProviderError(
            'Anthropic does not support embeddings',
            'anthropic',
            400,
            false
          );
        case 'gemini':
          return this.geminiEmbed(request, model);
        default:
          throw new AIProviderError(
            `Unsupported provider: ${this.config.provider}`,
            this.config.provider,
            0,
            false
          );
      }
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        `Embedding failed: ${(error as Error).message}`,
        this.config.provider,
        500,
        true,
        error as Error
      );
    }
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    await this.rateLimiter.acquire();
    const startTime = Date.now();
    const model = request.model ?? this.defaults.model;

    try {
      let response: AIVisionResponse;

      switch (this.config.provider) {
        case 'openai':
          response = await this.openaiVision(request, model);
          break;
        case 'anthropic':
          response = await this.anthropicVision(request, model);
          break;
        case 'gemini':
          response = await this.geminiVision(request, model);
          break;
        default:
          throw new AIProviderError(
            `Unsupported provider: ${this.config.provider}`,
            this.config.provider,
            0,
            false
          );
      }

      response.latencyMs = Date.now() - startTime;
      this.requestCount++;
      this.totalTokensUsed += response.usage.totalTokens;
      return response;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        `Vision failed: ${(error as Error).message}`,
        this.config.provider,
        500,
        true,
        error as Error
      );
    }
  }

  estimateCost(usage: { promptTokens: number; completionTokens: number }): number {
    const model = this.config.model ?? this.defaults.model;
    const pricing = MODEL_PRICING[model];
    if (!pricing) return 0;
    return (
      (usage.promptTokens / 1_000_000) * pricing.input +
      (usage.completionTokens / 1_000_000) * pricing.output
    );
  }

  private getEmbeddingModel(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'text-embedding-3-small';
      case 'gemini':
        return 'text-embedding-004';
      default:
        return '';
    }
  }

  // ─── OpenAI ──────────────────────────────────────────────────────

  private async openaiComplete(
    request: AICompletionRequest,
    model: string
  ): Promise<AICompletionResponse> {
    const body: Record<string, unknown> = {
      model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
    };
    if (request.responseFormat) body.response_format = request.responseFormat;
    if (request.stopSequences) body.stop = request.stopSequences;

    const res = await fetch(`${this.defaults.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `OpenAI API error (${res.status}): ${err}`,
        'openai',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? '',
      model: data.model,
      provider: 'openai',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: choice?.finish_reason ?? 'unknown',
      latencyMs: 0,
    };
  }

  private async openaiEmbed(
    request: AIEmbeddingRequest,
    model: string
  ): Promise<AIEmbeddingResponse> {
    const input = Array.isArray(request.input) ? request.input : [request.input];
    const res = await fetch(`${this.defaults.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ model, input }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `OpenAI embedding error (${res.status}): ${err}`,
        'openai',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    return {
      embeddings: data.data.map((d: { embedding: number[] }) => d.embedding),
      model: data.model,
      provider: 'openai',
      dimensions: data.data[0]?.embedding?.length ?? 0,
      usage: { totalTokens: data.usage?.total_tokens ?? 0 },
    };
  }

  private async openaiVision(
    request: AIVisionRequest,
    model: string
  ): Promise<AIVisionResponse> {
    const imageContent: Record<string, unknown>[] = [];
    if (request.imageUrl) {
      imageContent.push({ type: 'image_url', image_url: { url: request.imageUrl } });
    }
    if (request.imageBase64) {
      imageContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${request.imageBase64}` },
      });
    }

    const body = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: request.prompt },
          ],
        },
      ],
      max_tokens: request.maxTokens ?? this.config.maxTokens,
    };

    const res = await fetch(`${this.defaults.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `OpenAI vision error (${res.status}): ${err}`,
        'openai',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? '',
      model: data.model,
      provider: 'openai',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      latencyMs: 0,
    };
  }

  // ─── Anthropic ───────────────────────────────────────────────────

  private async anthropicComplete(
    request: AICompletionRequest,
    model: string
  ): Promise<AICompletionResponse> {
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model,
      messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
    };
    if (systemMsg) body.system = systemMsg.content;
    if (request.stopSequences) body.stop_sequences = request.stopSequences;

    const res = await fetch(`${this.defaults.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `Anthropic API error (${res.status}): ${err}`,
        'anthropic',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');

    return {
      content: textBlock?.text ?? '',
      model: data.model,
      provider: 'anthropic',
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens:
          (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: data.stop_reason ?? 'unknown',
      latencyMs: 0,
    };
  }

  private async anthropicVision(
    request: AIVisionRequest,
    model: string
  ): Promise<AIVisionResponse> {
    const content: Record<string, unknown>[] = [];

    if (request.imageUrl) {
      content.push({
        type: 'image',
        source: { type: 'url', url: request.imageUrl },
      });
    }
    if (request.imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: request.imageBase64,
        },
      });
    }

    content.push({ type: 'text', text: request.prompt });

    const body = {
      model,
      messages: [{ role: 'user', content }],
      max_tokens: request.maxTokens ?? this.config.maxTokens,
    };

    const res = await fetch(`${this.defaults.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `Anthropic vision error (${res.status}): ${err}`,
        'anthropic',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');

    return {
      content: textBlock?.text ?? '',
      model: data.model,
      provider: 'anthropic',
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens:
          (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      latencyMs: 0,
    };
  }

  // ─── Gemini ──────────────────────────────────────────────────────

  private async geminiComplete(
    request: AICompletionRequest,
    model: string
  ): Promise<AICompletionResponse> {
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    const contents = nonSystemMsgs.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? this.config.temperature,
        maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }
    if (request.responseFormat?.type === 'json_object') {
      (body.generationConfig as Record<string, unknown>).responseMimeType =
        'application/json';
    }

    const url = `${this.defaults.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `Gemini API error (${res.status}): ${err}`,
        'gemini',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data.usageMetadata ?? {};

    return {
      content: text,
      model,
      provider: 'gemini',
      usage: {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      },
      finishReason: data.candidates?.[0]?.finishReason ?? 'unknown',
      latencyMs: 0,
    };
  }

  private async geminiEmbed(
    request: AIEmbeddingRequest,
    model: string
  ): Promise<AIEmbeddingResponse> {
    const inputs = Array.isArray(request.input)
      ? request.input.map((text) => ({ content: { parts: [{ text }] } }))
      : [{ content: { parts: [{ text: request.input }] } }];

    const url = `${this.defaults.baseUrl}/models/${model}:embedContents?key=${this.config.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: inputs.map((req) => ({
          model: `models/${model}`,
          content: req.content,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `Gemini embedding error (${res.status}): ${err}`,
        'gemini',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const embeddings = data.embeddings?.map(
      (e: { values: number[] }) => e.values
    ) ?? [];

    return {
      embeddings,
      model,
      provider: 'gemini',
      dimensions: embeddings[0]?.length ?? 0,
      usage: { totalTokens: 0 },
    };
  }

  private async geminiVision(
    request: AIVisionRequest,
    model: string
  ): Promise<AIVisionResponse> {
    const parts: Record<string, unknown>[] = [];

    if (request.imageUrl) {
      parts.push({
        fileData: {
          mimeType: 'image/jpeg',
          fileUri: request.imageUrl,
        },
      });
    }
    if (request.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: request.imageBase64,
        },
      });
    }

    parts.push({ text: request.prompt });

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
      },
    };

    const url = `${this.defaults.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new AIProviderError(
        `Gemini vision error (${res.status}): ${err}`,
        'gemini',
        res.status,
        res.status >= 500 || res.status === 429
      );
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const usage = data.usageMetadata ?? {};

    return {
      content: text,
      model,
      provider: 'gemini',
      usage: {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      },
      latencyMs: 0,
    };
  }
}

// ─── Multi-Provider Manager ────────────────────────────────────────

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private fallbackOrder: string[] = [];

  registerProvider(config: AIProviderConfig): AIProvider {
    const provider = new AIProvider(config);
    this.providers.set(config.provider, provider);
    if (!this.fallbackOrder.includes(config.provider)) {
      this.fallbackOrder.push(config.provider);
    }
    return provider;
  }

  setFallbackOrder(order: string[]): void {
    this.fallbackOrder = order;
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  getPrimaryProvider(): AIProvider | undefined {
    for (const name of this.fallbackOrder) {
      if (this.providers.has(name)) return this.providers.get(name);
    }
    return undefined;
  }

  async completeWithFallback(
    request: AICompletionRequest,
    preferredProvider?: string
  ): Promise<AICompletionResponse> {
    const order = preferredProvider
      ? [preferredProvider, ...this.fallbackOrder.filter((p) => p !== preferredProvider)]
      : this.fallbackOrder;

    let lastError: AIProviderError | undefined;

    for (const providerName of order) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        return await provider.complete(request);
      } catch (error) {
        lastError = error instanceof AIProviderError ? error : undefined;
        if (lastError && !lastError.retryable) throw lastError;
      }
    }

    throw (
      lastError ??
      new AIProviderError('No providers available', 'none', 0, false)
    );
  }

  async embedWithFallback(
    request: AIEmbeddingRequest,
    preferredProvider?: string
  ): Promise<AIEmbeddingResponse> {
    const order = preferredProvider
      ? [preferredProvider, ...this.fallbackOrder.filter((p) => p !== preferredProvider)]
      : this.fallbackOrder;

    let lastError: AIProviderError | undefined;

    for (const providerName of order) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        return await provider.embed(request);
      } catch (error) {
        lastError = error instanceof AIProviderError ? error : undefined;
        if (lastError && !lastError.retryable) throw lastError;
      }
    }

    throw (
      lastError ??
      new AIProviderError('No providers available for embeddings', 'none', 0, false)
    );
  }

  getStats(): Array<{ provider: string; requestCount: number; totalTokensUsed: number }> {
    return Array.from(this.providers.values()).map((p) => p.stats);
  }

  getTotalCostEstimate(): number {
    let total = 0;
    for (const provider of this.providers.values()) {
      const stats = provider.stats;
      const model = (provider as unknown as { config: AIProviderConfig }).config?.model ?? '';
      const pricing = MODEL_PRICING[model];
      if (pricing) {
        total += (stats.totalTokensUsed * pricing.input) / 1_000_000 * 0.5 +
                 (stats.totalTokensUsed * pricing.output) / 1_000_000 * 0.5;
      }
    }
    return total;
  }
}

// Singleton
let defaultManager: AIProviderManager | null = null;

export function getAIProviderManager(): AIProviderManager {
  if (!defaultManager) {
    defaultManager = new AIProviderManager();
  }
  return defaultManager;
}

export function resetAIProviderManager(): void {
  defaultManager = null;
}
