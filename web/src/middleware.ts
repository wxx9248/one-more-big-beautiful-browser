import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthToken } from "@/lib/auth-helpers";

// Define an array of protected routes
const protectedRoutes = ["/dashboard"];

// Define public routes that authenticated users shouldn't access
const authRoutes = ["/login", "/signup"];

// Helper function to check if a path is protected
function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some((route) => path.startsWith(route));
}

// Helper function to check if a path is an auth route
function isAuthRoute(path: string): boolean {
  return authRoutes.some((route) => path.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const token = await getAuthToken();
  const currentPath = request.nextUrl.pathname;
  const isAuthenticated = !!token;

  // Redirect authenticated users away from login/signup pages
  if (isAuthenticated && isAuthRoute(currentPath)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute(currentPath) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Optimize performance by only running middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
