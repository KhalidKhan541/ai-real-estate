export interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number;
  refillInterval?: number;
}

export interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter?: number;
}

export class TokenBucket {
  private maxTokens: number;
  private refillRate: number;
  private refillInterval: number;
  private buckets: Map<string, TokenBucketState> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxTokens;
    this.refillRate = options.refillRate;
    this.refillInterval = options.refillInterval || 1000;

    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, state] of this.buckets.entries()) {
      if (now - state.lastRefill > 60000) {
        this.buckets.delete(key);
      }
    }
  }

  private getBucket(key: string): TokenBucketState {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.maxTokens,
        lastRefill: Date.now(),
      });
    }

    const bucket = this.buckets.get(key)!;
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed > this.refillInterval) {
      const refillAmount = Math.floor(elapsed / this.refillInterval) * this.refillRate;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }

    return bucket;
  }

  consume(key: string, tokens: number = 1): RateLimitResult {
    const bucket = this.getBucket(key);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      this.buckets.set(key, bucket);

      return {
        allowed: true,
        remaining: bucket.tokens,
        resetIn: this.refillInterval,
      };
    }

    const tokensNeeded = tokens - bucket.tokens;
    const timeToRefill = Math.ceil(tokensNeeded / this.refillRate) * this.refillInterval;

    return {
      allowed: false,
      remaining: bucket.tokens,
      resetIn: this.refillInterval,
      retryAfter: timeToRefill,
    };
  }

  peek(key: string): TokenBucketState {
    return this.getBucket(key);
  }

  reset(key: string): void {
    this.buckets.set(key, {
      tokens: this.maxTokens,
      lastRefill: Date.now(),
    });
  }

  remove(key: string): boolean {
    return this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }

  size(): number {
    return this.buckets.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export interface SlidingWindowOptions {
  windowSize: number;
  maxRequests: number;
}

export class SlidingWindowRateLimiter {
  private windowSize: number;
  private maxRequests: number;
  private requests: Map<string, number[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: SlidingWindowOptions) {
    this.windowSize = options.windowSize;
    this.maxRequests = options.maxRequests;

    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        (t) => now - t < this.windowSize
      );
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  consume(key: string, count: number = 1): RateLimitResult {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(
      (t) => now - t < this.windowSize
    );

    if (validTimestamps.length + count <= this.maxRequests) {
      for (let i = 0; i < count; i++) {
        validTimestamps.push(now);
      }
      this.requests.set(key, validTimestamps);

      return {
        allowed: true,
        remaining: this.maxRequests - validTimestamps.length,
        resetIn: this.windowSize,
      };
    }

    const oldestTimestamp = validTimestamps[0];
    const retryAfter = oldestTimestamp
      ? this.windowSize - (now - oldestTimestamp)
      : this.windowSize;

    return {
      allowed: false,
      remaining: this.maxRequests - validTimestamps.length,
      resetIn: this.windowSize,
      retryAfter,
    };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  clear(): void {
    this.requests.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export interface RateLimiterConfig {
  type: "token-bucket" | "sliding-window";
  maxTokens?: number;
  refillRate?: number;
  refillInterval?: number;
  windowSize?: number;
  maxRequests?: number;
}

export function createRateLimiter(config: RateLimiterConfig): TokenBucket | SlidingWindowRateLimiter {
  if (config.type === "token-bucket") {
    return new TokenBucket({
      maxTokens: config.maxTokens || 100,
      refillRate: config.refillRate || 10,
      refillInterval: config.refillInterval || 1000,
    });
  }

  return new SlidingWindowRateLimiter({
    windowSize: config.windowSize || 60000,
    maxRequests: config.maxRequests || 100,
  });
}

export const apiRateLimiter = createRateLimiter({
  type: "token-bucket",
  maxTokens: 100,
  refillRate: 10,
  refillInterval: 1000,
});

export const authRateLimiter = createRateLimiter({
  type: "sliding-window",
  windowSize: 900000,
  maxRequests: 5,
});

export const searchRateLimiter = createRateLimiter({
  type: "token-bucket",
  maxTokens: 30,
  refillRate: 5,
  refillInterval: 1000,
});

export default {
  TokenBucket,
  SlidingWindowRateLimiter,
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  searchRateLimiter,
};
