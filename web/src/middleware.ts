import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for server-side authentication protection
 * Protects routes before they render on the server
 * Prevents bypassing client-side AuthGuard
 */
export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token');
  const { pathname } = request.nextUrl;
  
  // Protected route prefixes that require authentication
  const protectedPrefixes = ['/ogrenci', '/ogretmen', '/admin', '/veli'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));
  
  // Public routes that don't require authentication
  const publicRoutes = ['/giris', '/kayit', '/sifremi-unuttum', '/'];
  const isPublicRoute = publicRoutes.includes(pathname) || 
                        pathname.startsWith('/_next') || 
                        pathname.startsWith('/api') ||
                        pathname === '/favicon.ico';
  
  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !refreshToken) {
    const url = new URL('/giris', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // Redirect authenticated users away from login/register pages
  // Only redirect if we have a valid refresh token
  if ((pathname === '/giris' || pathname === '/kayit') && refreshToken && refreshToken.value) {
    // Can't decode JWT here without JWT_SECRET, so redirect to a default
    // Client-side will handle routing to correct dashboard based on role
    return NextResponse.redirect(new URL('/ogrenci', request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
