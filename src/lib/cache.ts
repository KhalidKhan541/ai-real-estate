export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  serialize?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  expires: number;
  createdAt: number;
}

type CacheStore = Map<string, CacheEntry<unknown>>;

const DEFAULT_TTL = 5 * 60 * 1000;
const DEFAULT_PREFIX = "are";

class MemoryCache {
  private store: CacheStore = new Map();
  private prefix: string;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || DEFAULT_PREFIX;
    this.defaultTTL = options.ttl || DEFAULT_TTL;
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expires <= now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  get<T>(key: string): T | null {
    const fullKey = this.getKey(key);
    const entry = this.store.get(fullKey);

    if (!entry) return null;

    if (entry.expires <= Date.now()) {
      this.store.delete(fullKey);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const fullKey = this.getKey(key);
    const expiry = ttl || this.defaultTTL;

    this.store.set(fullKey, {
      data: value,
      expires: Date.now() + expiry,
      createdAt: Date.now(),
    });
  }

  delete(key: string): boolean {
    const fullKey = this.getKey(key);
    return this.store.delete(fullKey);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    const keys: string[] = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(`${this.prefix}:`)) {
        keys.push(key.replace(`${this.prefix}:`, ""));
      }
    }
    return keys;
  }

  getOrSet<T>(key: string, factory: () => T | Promise<T>, ttl?: number): T | Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = factory();
    if (value instanceof Promise) {
      return value.then((v) => {
        this.set(key, v, ttl);
        return v;
      });
    }

    this.set(key, value, ttl);
    return value;
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern.replace("*", ".*"));
    for (const key of this.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): {
    size: number;
    keys: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.store.values()) {
      if (oldestEntry === null || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (newestEntry === null || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    return {
      size: this.store.size,
      keys: this.keys().length,
      oldestEntry,
      newestEntry,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

let defaultCache: MemoryCache | null = null;

export function getCache(options?: CacheOptions): MemoryCache {
  if (!defaultCache) {
    defaultCache = new MemoryCache(options);
  }
  return defaultCache;
}

export function createCache(options?: CacheOptions): MemoryCache {
  return new MemoryCache(options);
}

export function cacheMiddleware<T>(
  cache: MemoryCache,
  key: string,
  ttl?: number
): (fn: () => Promise<T>) => Promise<T> {
  return async (fn: () => Promise<T>): Promise<T> => {
    const cached = cache.get<T>(key);
    if (cached !== null) return cached;

    const result = await fn();
    cache.set(key, result, ttl);
    return result;
  };
}

export function cacheAside<T>(
  cache: MemoryCache,
  key: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return cache.getOrSet(key, factory, ttl) as Promise<T>;
}

export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

export function cacheResult<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    key?: (...args: Parameters<T>) => string;
    ttl?: number;
    cache?: MemoryCache;
  } = {}
): T {
  const cache = options.cache || getCache();
  const { ttl, key: keyFn } = options;

  return (async (...args: Parameters<T>) => {
    const cacheKey = keyFn
      ? keyFn(...args)
      : `fn:${fn.name}:${JSON.stringify(args)}`;

    return cache.getOrSet(cacheKey, () => fn(...args), ttl);
  }) as T;
}

export const cache = getCache();

export default cache;
