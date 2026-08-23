import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Hard ceiling for the auth check inside middleware.
 *
 * Why: when a session cookie exists but its access token is inside the 90s
 * expiry window, `getSession()` performs a NETWORK token refresh, and
 * supabase-js retries a stalled/failing endpoint with backoff for up to 30s
 * (AUTO_REFRESH_TICK_DURATION_MS) with no fetch timeout. Vercel kills
 * middleware invocations at ~25s, which surfaced as 504
 * MIDDLEWARE_INVOCATION_TIMEOUT on /admin.
 *
 * This middleware is a convenience gate, not the security boundary — every
 * /admin/api route and the admin page validate the session themselves — so
 * on timeout or error we fail OPEN and let those do the real check.
 */
const AUTH_BUDGET_MS = 2_500;

/** True if any Supabase auth cookie is present (incl. chunked `.0`, `.1`…). */
function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin and /admin/api/* except the auth endpoint.
  const isAdmin = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/admin/api/auth";

  if (!isAdmin || isAuthRoute) {
    return NextResponse.next();
  }

  // Behavior for a request we know (or believe) is signed out: API gets a
  // clean 401; page navigations pass through so the page can render login.
  const unauthenticated = () => {
    if (pathname.startsWith("/admin/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For page navigations, let them through — the page will show login.
    return NextResponse.next();
  };

  // No auth cookie at all → definitely signed out. Skip Supabase entirely:
  // zero network, so the refresh path can never stall the request here.
  if (!hasSessionCookie(req)) {
    return unauthenticated();
  }

  // Create a Supabase client that reads/writes cookies via the request/response.
  const supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), AUTH_BUDGET_MS);
      }),
    ]);
    clearTimeout(timer);

    if (result === "timeout") {
      // Auth endpoint stalled — don't hold the request hostage. The page and
      // API routes re-validate the session server-side.
      return NextResponse.next();
    }

    if (!result.data.session) {
      return unauthenticated();
    }

    // Session OK — return the response carrying any refreshed auth cookies.
    return supabaseResponse;
  } catch {
    // Malformed cookie, storage error, etc. Fail open; routes re-check.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
