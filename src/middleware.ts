import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const path = request.nextUrl.pathname;

  // ✅ إذا كان المستخدم مديراً وذهب للصفحة الرئيسية
  if (path === "/" && token?.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // ✅ إذا كان المستخدم مالك وكالة وذهب للصفحة الرئيسية
  if (path === "/" && (token?.role === "agency_owner" || token?.role === "agency_staff")) {
    return NextResponse.redirect(new URL("/agency/dashboard", request.url));
  }

  // ✅ إذا كان المستخدم مديراً وحاول الوصول لصفحة غير مسموحة
  if (token?.role === "admin" && !path.startsWith("/admin") && !path.startsWith("/api") && !path.startsWith("/_next")) {
    const publicPaths = ["/login", "/register", "/api/auth", "/"];
    if (!publicPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // ✅ إذا كان المستخدم وكالة وحاول الوصول لصفحة غير مسموحة
  if ((token?.role === "agency_owner" || token?.role === "agency_staff") && 
      !path.startsWith("/agency") && 
      !path.startsWith("/properties") && 
      !path.startsWith("/api") && 
      !path.startsWith("/_next")) {
    const publicPaths = ["/", "/login", "/register", "/api/auth", "/pricing", "/agencies", "/contact"];
    if (!publicPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/agency/dashboard", request.url));
    }
  }

  // ... باقي الكود كما هو (التحقق من المصادقة والصلاحيات)

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$).*)",
  ],
};