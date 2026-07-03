import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin and /admin/api/* except the auth endpoint.
  const isAdmin = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/admin/api/auth";

  if (!isAdmin || isAuthRoute) {
    return NextResponse.next();
  }

  // Create a Supabase client that reads/writes cookies via the request/response.
  let supabaseResponse = NextResponse.next({ request: req });

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (pathname.startsWith("/admin/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For page navigations, let them through — the page will show login.
    return NextResponse.next();
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
