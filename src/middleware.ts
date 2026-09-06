import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (process.env.NODE_ENV === "production") {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
    }

    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }

    const protectedRoutes = [
      "/api/listings",
      "/api/offers",
      "/api/transactions",
      "/api/settings",
      "/api/dashboard",
      "/api/ai/recommendations",
      "/api/search/saved",
    ];

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    const isCreateRoute =
      request.method === "POST" &&
      (pathname.startsWith("/api/properties") ||
        pathname.startsWith("/api/reviews") ||
        pathname.startsWith("/api/neighborhoods"));

    if (isProtected || isCreateRoute) {
      const sessionToken =
        request.cookies.get("next-auth.session-token")?.value ||
        request.cookies.get("__Secure-next-auth.session-token")?.value;

      if (!sessionToken) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 100;

    const rateLimitKey = `${ip}:${pathname.split("/").slice(0, 4).join("/")}`;
    const rateLimit = rateLimitMap.get(rateLimitKey);

    if (rateLimit) {
      if (now - rateLimit.resetTime > windowMs) {
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now });
      } else if (rateLimit.count >= maxRequests) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil((windowMs - (now - rateLimit.resetTime)) / 1000)),
              "X-RateLimit-Limit": String(maxRequests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil((rateLimit.resetTime + windowMs) / 1000)),
            },
          }
        );
      } else {
        rateLimit.count++;
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now });
    }

    response.headers.set("X-RateLimit-Limit", String(maxRequests));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(maxRequests - (rateLimitMap.get(rateLimitKey)?.count || 1))
    );

    const startTime = Date.now();
    response.headers.set("X-Request-Start", String(startTime));

    response.headers.set("X-Response-Time", "${Date.now() - startTime}ms");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
