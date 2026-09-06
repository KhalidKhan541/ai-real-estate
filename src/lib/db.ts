import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Client Singleton
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
    errorFormat: "pretty",
  });

  return client;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;

// ─────────────────────────────────────────────────────────────────────────────
// Soft Delete Middleware
// ─────────────────────────────────────────────────────────────────────────────

export function applySoftDeleteMiddleware() {
  const softDeleteModels = ["User", "Property"];

  db.$use(async (params, next) => {
    const { model, action, args } = params;

    if (!softDeleteModels.includes(model ?? "")) {
      return next(params);
    }

    // Intercept findUnique/findFirst/findMany to exclude soft-deleted records
    if (action === "findUnique" || action === "findFirst" || action === "findMany") {
      if (!args.where) {
        args.where = {};
      }

      if (args.where.deletedAt === undefined) {
        args.where.deletedAt = null;
      }
    }

    // Convert delete to soft delete
    if (action === "delete") {
      params.action = "update";
      args.data = { deletedAt: new Date() };
    }

    // Convert deleteMany to soft deleteMany
    if (action === "deleteMany") {
      params.action = "updateMany";
      if (!args.data) {
        args.data = {};
      }
      args.data.deletedAt = new Date();
    }

    return next(params);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export function getDefaultPagination(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export async function paginate<T>(
  model: {
    findMany: (args: Prisma.Args<T, "findMany">) => Promise<T[]>;
    count: (args?: Prisma.Args<T, "count">) => Promise<number>;
  },
  args: Prisma.Args<T, "findMany"> & PaginationParams
): Promise<PaginatedResult<T>> {
  const { page, limit, skip } = getDefaultPagination(args);

  const [data, total] = await Promise.all([
    model.findMany({
      ...args,
      skip,
      take: limit,
    } as Prisma.Args<T, "findMany">),
    model.count({
      where: args.where,
    } as Prisma.Args<T, "count">),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function cursorPaginate<T extends { id: string }>(
  findMany: (args: { where?: unknown; take: number; skip: number; cursor?: { id: string }; orderBy: { id: "asc" } }) => Promise<T[]>,
  count: (args?: { where?: unknown }) => Promise<number>,
  args: {
    where?: unknown;
    cursor?: string;
    limit?: number;
  }
): Promise<CursorPaginatedResult<T>> {
  const limit = Math.min(100, Math.max(1, args.limit ?? 20));

  const items = await findMany({
    where: args.where,
    take: limit + 1,
    skip: args.cursor ? 1 : 0,
    cursor: args.cursor ? { id: args.cursor } : undefined,
    orderBy: { id: "asc" as const },
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  const total = await count({ where: args.where });

  return {
    data,
    pagination: {
      cursor: args.cursor ?? null,
      nextCursor,
      hasMore,
      limit,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Helper
// ─────────────────────────────────────────────────────────────────────────────

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    try {
      return await fn(tx);
    } catch (error) {
      throw error;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function batchCreate<T>(
  model: { createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<Prisma.BatchPayload> },
  data: T[],
  batchSize = 100
): Promise<Prisma.BatchPayload> {
  let total = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const result = await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
    total += result.count;
  }

  return { count: total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function buildSearchWhere<T extends Record<string, unknown>>(
  filters: Record<string, unknown>,
  fieldMap: Record<string, keyof T>
): Prisma.WhereInput {
  const conditions: Prisma.WhereInput[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;

    const field = fieldMap[key];
    if (!field) continue;

    if (Array.isArray(value)) {
      conditions.push({
        [field]: { in: value } as T[keyof T],
      });
    } else if (typeof value === "object" && value !== null && "min" in value && "max" in value) {
      const range = value as { min?: number; max?: number };
      const rangeFilter: Prisma.FloatFilter = {};
      if (range.min !== undefined) rangeFilter.gte = range.min;
      if (range.max !== undefined) rangeFilter.lte = range.max;
      conditions.push({ [field]: rangeFilter });
    } else if (typeof value === "string" && value.includes("*")) {
      const pattern = value.replace(/\*/g, "%");
      conditions.push({
        [field]: { contains: pattern, mode: "insensitive" } as T[keyof T],
      });
    } else {
      conditions.push({
        [field]: value,
      });
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────────────────

export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: "healthy",
      latency,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────────

export async function disconnect(): Promise<void> {
  await db.$disconnect();
}

// Apply middleware on import
applySoftDeleteMiddleware();
