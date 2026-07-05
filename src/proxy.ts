import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const path = request.nextUrl.pathname;

  // ============================================
  // 1. التوجيه حسب الدور عند الصفحة الرئيسية
  // ============================================
  
  // ✅ إذا كان المستخدم مديراً وذهب للصفحة الرئيسية
  if (path === "/" && token?.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // ✅ إذا كان المستخدم مالك وكالة وذهب للصفحة الرئيسية
  if (path === "/" && (token?.role === "agency_owner" || token?.role === "agency_staff")) {
    return NextResponse.redirect(new URL("/agency/dashboard", request.url));
  }

  // ============================================
  // 2. منع الوصول غير المصرح به حسب الدور
  // ============================================

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

  // ============================================
  // 3. التحقق من المصادقة (الصفحات المحمية)
  // ============================================

  // الصفحات العامة التي لا تحتاج تسجيل دخول
  const publicPaths = [
    "/", 
    "/login", 
    "/register", 
    "/forgot-password", 
    "/reset-password",
    "/api/auth",
    "/properties",
    "/agencies",
    "/pricing",
    "/contact",
    "/about",
    "/privacy",
    "/terms"
  ];
  
  const isPublic = publicPaths.some(p => path === p || path.startsWith(`${p}/`));
  
  // الصفحات العامة - لا حاجة لتسجيل دخول
  if (isPublic) {
    return NextResponse.next();
  }

  // إذا لم يكن هناك توكن (غير مسجل) → إعادة توجيه لتسجيل الدخول
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // ============================================
  // 4. التحقق من الصلاحيات حسب الدور
  // ============================================

  const role = token.role as string;

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

  // الملف الشخصي والمفضلة
  if (path.startsWith("/profile") || path.startsWith("/favorites") || path.startsWith("/subscriptions")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ============================================
  // 5. السماح بالوصول
  // ============================================

  return NextResponse.next();
}

// ============================================
// تكوين المسارات التي يتم تطبيق الـ Proxy عليها
// ============================================

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};