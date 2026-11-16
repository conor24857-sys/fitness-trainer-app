import { NextResponse, type NextRequest } from "next/server";

// Local-only guard.
// 1. Reject requests whose Host is not this PC (blocks DNS-rebinding attacks), unless LAN mode is on.
// 2. Reject state-changing requests from other origins (blocks other websites posting to this app).
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function middleware(req: NextRequest) {
  const lan = process.env.ALLOW_LAN === "1";
  const hostHeader = req.headers.get("host") || "";
  const hostname = hostHeader.replace(/:\d+$/, "");

  if (!lan && !LOCAL_HOSTS.has(hostname)) {
    return new NextResponse("Forbidden: this dashboard only answers on 127.0.0.1", { status: 403 });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {}
      if (originHost !== hostHeader) {
        return new NextResponse("Forbidden: cross-origin request", { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = { runtime: "nodejs", matcher: "/:path*" };
