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

  console.log("🔍 [Proxy] Path:", path);
  console.log("🔍 [Proxy] IsLoggedIn:", isLoggedIn);
  console.log("🔍 [Proxy] Role:", role);

  // ✅ السماح للملفات الثابتة والـ API
  if (path.startsWith("/api") || 
      path.startsWith("/_next") || 
      path.startsWith("/images") ||
      path.startsWith("/uploads") ||
      path.includes(".")) {
    return NextResponse.next();
  }

  // ✅ الصفحات العامة (لا تحتاج مصادقة)
  const publicPaths = [
    "/login", 
    "/register", 
    "/forgot-password", 
    "/reset-password",
    "/auth/error",
    "/properties",
    "/agencies",
    "/pricing",
    "/contact",
  ];
  
  // ✅ إذا كان المسار عام، مرره
  if (publicPaths.some(p => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // ✅ التحقق من المصادقة
  if (!isLoggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // ✅ منع التوجيه التلقائي - كل المستخدمين يذهبون للصفحة الرئيسية
  // ❌ لا توجيه حسب الدور

  // ✅ التحقق من الصلاحيات للمسارات المحمية
  if (path.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/agency")) {
    if (!["admin", "agency_owner", "agency_staff"].includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ✅ صفحة إضافة عقار
  if (path.startsWith("/properties/new") || path.startsWith("/properties/edit")) {
    if (!["admin", "agency_owner", "agency_staff"].includes(role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ✅ الملف الشخصي والمفضلة
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
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};