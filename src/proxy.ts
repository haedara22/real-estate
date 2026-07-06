// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const path = request.nextUrl.pathname;
  const isLoggedIn = !!token;
  const role = token?.role as string || '';

  // ============================================
  // 1. التوجيه حسب الدور عند الصفحة الرئيسية
  // ============================================
  
  if (path === "/") {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "agency_owner" || role === "agency_staff") {
      return NextResponse.redirect(new URL("/agency/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ============================================
  // 2. الصفحات العامة
  // ============================================

  const publicPaths = [
    "/login", 
    "/register", 
    "/forgot-password", 
    "/reset-password",
    "/properties",
    "/agencies",
    "/pricing",
    "/contact",
    "/about",
    "/privacy",
    "/terms"
  ];
  
  if (publicPaths.some(p => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // ============================================
  // 3. التحقق من المصادقة
  // ============================================

  if (!isLoggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // ============================================
  // 4. التحقق من الصلاحيات حسب الدور
  // ============================================

  // لوحة التحكم (Admin)
  if (path.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // لوحة الوكالة
  if (path.startsWith("/agency")) {
    if (!["admin", "agency_owner", "agency_staff"].includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // صفحة إضافة عقار
  if (path.startsWith("/properties/new") || path.startsWith("/properties/edit")) {
    if (!["admin", "agency_owner", "agency_staff"].includes(role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // الملف الشخصي والمفضلة والاشتراكات
  if (path.startsWith("/profile") || path.startsWith("/favorites") || path.startsWith("/subscriptions")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ============================================
// تكوين المسارات
// ============================================

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};