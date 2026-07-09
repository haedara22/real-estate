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

  // ============================================
  // 1. ✅ السماح للملفات الثابتة والـ API
  // ============================================
  
  // ✅ السماح لـ API و static files
  if (path.startsWith("/api") || 
      path.startsWith("/_next") || 
      path.startsWith("/images") ||
      path.startsWith("/uploads") ||
      path.includes(".")) {
    return NextResponse.next();
  }

  // ============================================
  // 2. 🏠 التوجيه حسب الدور عند الصفحة الرئيسية
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
  // 3. 📄 الصفحات العامة (لا تحتاج مصادقة)
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
    "/terms",
    "/auth/error", // ✅ أضف هذه الصفحة
  ];
  
  // ✅ إذا كان المسار عام، مرره
  if (publicPaths.some(p => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // ============================================
  // 4. 🔒 التحقق من المصادقة
  // ============================================

  if (!isLoggedIn) {
    console.log("🔒 [Proxy] غير مسجل، توجيه إلى login");
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // ============================================
  // 5. 🛡️ التحقق من الصلاحيات حسب الدور
  // ============================================

  // ✅ لوحة التحكم (Admin)
  if (path.startsWith("/admin")) {
    if (role !== "admin") {
      console.log("🚫 [Proxy] محاولة وصول غير مصرح به إلى /admin");
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ✅ لوحة الوكالة
  if (path.startsWith("/agency")) {
    if (!["admin", "agency_owner", "agency_staff"].includes(role)) {
      console.log("🚫 [Proxy] محاولة وصول غير مصرح به إلى /agency");
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ✅ صفحة إضافة عقار
  if (path.startsWith("/properties/new") || path.startsWith("/properties/edit")) {
    if (!["admin", "agency_owner", "agency_staff"].includes(role)) {
      console.log("🚫 [Proxy] محاولة إضافة عقار بدون صلاحية");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ✅ الملف الشخصي والمفضلة والاشتراكات
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
    // ✅ استثناء API و static files
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};