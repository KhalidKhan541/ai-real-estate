// ─────────────────────────────────────────────────────────────────────────────
// Environment Configuration - AI Real Estate Platform
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Environment Schema
// ─────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ─── Core ────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("AI Real Estate"),

  // ─── Database ────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url(),
  DATABASE_DIRECT_URL: z.string().url().optional(),

  // ─── Authentication ──────────────────────────────────────────────────────
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),

  // OAuth Providers
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // ─── API Keys ────────────────────────────────────────────────────────────
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // ─── Email (SMTP) ────────────────────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // ─── File Storage ────────────────────────────────────────────────────────
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.coerce.number().int().default(10 * 1024 * 1024), // 10MB

  // ─── S3 / R2 Storage ────────────────────────────────────────────────────
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // ─── Redis ───────────────────────────────────────────────────────────────
  REDIS_URL: z.string().optional(),

  // ─── Maps ────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),

  // ─── Search ──────────────────────────────────────────────────────────────
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_API_KEY: z.string().optional(),
  MEILISEARCH_HOST: z.string().optional(),
  MEILISEARCH_KEY: z.string().optional(),

  // ─── Payments ────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ─── Logging ─────────────────────────────────────────────────────────────
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "fatal"])
    .default("info"),
  LOG_DIR: z.string().default("logs"),

  // ─── Rate Limiting ───────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(100),

  // ─── CORS ────────────────────────────────────────────────────────────────
  CORS_ORIGIN: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Parse & Validate Environment
// ─────────────────────────────────────────────────────────────────────────────

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => {
          const path = issue.path.join(".");
          return `  ${path}: ${issue.message}`;
        })
        .join("\n");

      throw new Error(
        `\n❌ Invalid environment variables:\n${missingVars}\n\n` +
          `Please check your .env file or environment variables.\n`
      );
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Validated Environment
// ─────────────────────────────────────────────────────────────────────────────

export const env = validateEnv();

// ─────────────────────────────────────────────────────────────────────────────
// Type-Safe Environment Access
// ─────────────────────────────────────────────────────────────────────────────

export type Env = z.infer<typeof envSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Getters
// ─────────────────────────────────────────────────────────────────────────────

export function isDevelopment(): boolean {
  return env.NODE_ENV === "development";
}

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

export function isTest(): boolean {
  return env.NODE_ENV === "test";
}

export function getAppUrl(): string {
  return env.NEXT_PUBLIC_APP_URL;
}

export function getApiUrl(): string {
  return `${env.NEXT_PUBLIC_APP_URL}/api`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags
// ─────────────────────────────────────────────────────────────────────────────

export const features = {
  aiInsights: !!env.OPENAI_API_KEY || !!env.ANTHROPIC_API_KEY,
  maps: !!env.NEXT_PUBLIC_MAPBOX_TOKEN,
  search: !!(env.ALGOLIA_APP_ID || env.MEILISEARCH_HOST),
  payments: !!env.STRIPE_SECRET_KEY,
  email: !!(env.SMTP_HOST && env.SMTP_FROM),
  redis: !!env.REDIS_URL,
  s3: !!(env.S3_BUCKET && env.S3_ACCESS_KEY_ID),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Storage Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const storage = {
  uploadDir: env.UPLOAD_DIR,
  maxFileSize: env.MAX_FILE_SIZE,
  s3: {
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limit Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const rateLimit = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helper
// ─────────────────────────────────────────────────────────────────────────────

export function validateRequiredEnvVars(
  vars: (keyof Env)[]
): { missing: string[]; isValid: boolean } {
  const missing: string[] = [];

  for (const varName of vars) {
    const value = env[varName];
    if (value === undefined || value === null || value === "") {
      missing.push(varName);
    }
  }

  return {
    missing,
    isValid: missing.length === 0,
  };
}

export function requireEnvVar(name: keyof Env): string {
  const value = env[name];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return String(value);
}
