import { NextResponse, type NextRequest } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/rate-limit-config";

export async function proxy(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";

  try {
    if (await isRateLimited("globalApi", ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(RATE_LIMITS.globalApi.windowMs / 1000)),
          },
        },
      );
    }
  } catch (error) {
    console.error("[api-rate-limit] check failed", {
      path: request.nextUrl.pathname,
      error,
    });
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
