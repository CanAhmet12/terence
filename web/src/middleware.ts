import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";

/**
 * Next.js Middleware for server-side authentication protection
 * Protects routes before they render on the server
 * Prevents bypassing client-side AuthGuard
 */
export async function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token");
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const protectedPrefixes = ["/ogrenci", "/ogretmen", "/admin", "/veli"];
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  const hasValidToken = refreshToken?.value && refreshToken.value.length > 20;

  if (isProtectedRoute && !hasValidToken) {
    const url = new URL("/giris", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Bakım modu: yönetici paneli ve giriş/bakım sayfaları hariç yönlendir
  const maintenanceBypass =
    pathname === "/bakim" ||
    pathname.startsWith("/bakim/") ||
    pathname === "/giris" ||
    pathname.startsWith("/giris/") ||
    pathname.startsWith("/admin");

  if (!maintenanceBypass) {
    try {
      const base = getPublicApiBaseUrl();
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(`${base}/v1/system/public-status`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(t);
      if (res.ok) {
        const body = (await res.json()) as { maintenance_mode?: boolean };
        if (body.maintenance_mode === true) {
          const url = new URL("/bakim", request.url);
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // API erişilemezse siteyi kilitleme
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
