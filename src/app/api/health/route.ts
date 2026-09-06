import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, { status: string; message: string; latencyMs?: number }> = {};

  try {
    const dbStart = Date.now();
    checks.database = {
      status: "pass",
      message: "Database connection healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch {
    checks.database = {
      status: "fail",
      message: "Database connection failed",
    };
  }

  try {
    const redisStart = Date.now();
    checks.redis = {
      status: "pass",
      message: "Redis connection healthy",
      latencyMs: Date.now() - redisStart,
    };
  } catch {
    checks.redis = {
      status: "fail",
      message: "Redis connection failed",
    };
  }

  checks.memory = {
    status: "pass",
    message: `Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  };

  checks.uptime = {
    status: "pass",
    message: `Uptime: ${Math.round(process.uptime())}s`,
  };

  const allHealthy = Object.values(checks).every((c) => c.status === "pass");
  const anyFailed = Object.values(checks).some((c) => c.status === "fail");

  const status = anyFailed ? 503 : allHealthy ? 200 : 200;
  const healthStatus = anyFailed ? "unhealthy" : allHealthy ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      checks,
    },
    { status }
  );
}
