// src/app/api/subscription/check-property/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { properties, userSubscriptions, subscriptionPlans, agencies, users } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";

export async function GET() {
  try {
    console.log("🔍 check-property API called");
    
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    console.log("👤 User ID:", userId);
    console.log("👤 User Role:", userRole);

    if (!userId) {
      return NextResponse.json({
        allowed: false,
        message: "يرجى تسجيل الدخول",
        maxProperties: 0,
        maxFeatured: 0,
        currentFeatured: 0,
        planName: '',
        remaining: 0,
        canFeature: false,
        isAgency: false,
      }, { status: 401 });
    }

    // ✅ 1. جلب معلومات المستخدم
    const user = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({
        allowed: false,
        message: "المستخدم غير موجود",
        maxProperties: 0,
        maxFeatured: 0,
        currentFeatured: 0,
        planName: '',
        remaining: 0,
        canFeature: false,
        isAgency: false,
      });
    }

    const userData = user[0];
    const isAgency = userData.role === 'agency_owner' || userData.role === 'agency_staff';
    
    // ✅ 2. جلب الوكالة (إذا كان مستخدم وكالة)
    let agencyId: string | null = null;

    if (isAgency) {
      const agency = await db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.ownerId, userId))
        .limit(1);
      
      agencyId = agency[0]?.id || null;
    }

    console.log("🏢 Is Agency:", isAgency);
    console.log("🏢 Agency ID:", agencyId);

    // ✅ 3. جلب الاشتراك النشط
    const subscription = await db
      .select({
        id: userSubscriptions.id,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        planMaxProperties: subscriptionPlans.maxProperties,
        planMaxFeatured: subscriptionPlans.maxFeaturedProperties,
        planName: subscriptionPlans.nameAr,
        planMaxImages: subscriptionPlans.maxImagesPerProperty,
        price: subscriptionPlans.price,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      )
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    console.log("📊 Subscription found:", subscription?.length > 0 ? "Yes" : "No");

    // ✅ 4. إذا لم يكن هناك اشتراك، تحقق من العقارات المجانية (3 عقارات)
    if (!subscription || subscription.length === 0) {
      console.log("⚠️ No subscription, checking free properties limit...");
      
      // ✅ حساب عدد العقارات الحالية
      let currentCount = 0;
      if (agencyId) {
        const countResult = await db
          .select({ count: count() })
          .from(properties)
          .where(eq(properties.agencyId, agencyId));
        currentCount = countResult[0]?.count || 0;
      } else {
        const countResult = await db
          .select({ count: count() })
          .from(properties)
          .where(eq(properties.userId, userId));
        currentCount = countResult[0]?.count || 0;
      }

      const FREE_PROPERTIES_LIMIT = 3;

      if (currentCount >= FREE_PROPERTIES_LIMIT) {
        console.log("❌ Free properties limit reached:", currentCount);
        return NextResponse.json({
          allowed: false,
          message: `لقد وصلت للحد الأقصى للعقارات المجانية (${FREE_PROPERTIES_LIMIT} عقار). يرجى الاشتراك في إحدى الباقات لإضافة المزيد.`,
          maxProperties: FREE_PROPERTIES_LIMIT,
          maxFeatured: 0,
          currentFeatured: 0,
          planName: 'مجاني (مكتمل)',
          remaining: 0,
          canFeature: false,
          isAgency,
          isFreePlan: true,
        });
      }

      console.log("✅ Free properties available:", currentCount, "/", FREE_PROPERTIES_LIMIT);
      
      return NextResponse.json({
        allowed: true,
        maxProperties: FREE_PROPERTIES_LIMIT,
        maxFeatured: 0,
        currentFeatured: 0,
        planName: 'مجاني',
        remaining: FREE_PROPERTIES_LIMIT - currentCount,
        canFeature: false,
        isAgency,
        isFreePlan: true,
        maxImages: 5,
        currentImages: 0,
      });
    }

    // ✅ 5. اشتراك موجود
    const sub = subscription[0];
    const maxProperties = sub.planMaxProperties || 0;
    const maxFeatured = sub.planMaxFeatured || 0;
    const planName = sub.planName || 'أساسي';
    const maxImages = sub.planMaxImages || 5;

    // ✅ حساب عدد العقارات الحالية
    let currentCount = 0;
    if (agencyId) {
      const countResult = await db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.agencyId, agencyId));
      currentCount = countResult[0]?.count || 0;
    } else {
      const countResult = await db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.userId, userId));
      currentCount = countResult[0]?.count || 0;
    }

    // ✅ حساب عدد العقارات المميزة الحالية
    let currentFeatured = 0;
    if (agencyId) {
      const featuredResult = await db
        .select({ count: count() })
        .from(properties)
        .where(
          and(
            eq(properties.agencyId, agencyId),
            eq(properties.isFeatured, true)
          )
        );
      currentFeatured = featuredResult[0]?.count || 0;
    } else {
      const featuredResult = await db
        .select({ count: count() })
        .from(properties)
        .where(
          and(
            eq(properties.userId, userId),
            eq(properties.isFeatured, true)
          )
        );
      currentFeatured = featuredResult[0]?.count || 0;
    }

    console.log("📊 Current Properties:", currentCount);
    console.log("📊 Current Featured:", currentFeatured);

    const remaining = maxProperties > 0 ? Math.max(0, maxProperties - currentCount) : 'غير محدود';
    const canFeature = currentFeatured < maxFeatured;

    // ✅ التحقق من الحد الأقصى
    if (maxProperties > 0 && currentCount >= maxProperties) {
      console.log("❌ Max properties reached");
      return NextResponse.json({
        allowed: false,
        message: `لقد وصلت للحد الأقصى (${maxProperties} عقار). يرجى ترقية خطتك.`,
        maxProperties,
        maxFeatured,
        currentFeatured,
        planName,
        remaining: 0,
        canFeature: false,
        isAgency,
        isFreePlan: false,
        maxImages,
        currentImages: 0,
      });
    }

    console.log("✅ Allowed to add property");
    
    return NextResponse.json({
      allowed: true,
      maxProperties: maxProperties === 0 ? 0 : maxProperties,
      maxFeatured,
      currentFeatured,
      planName,
      remaining: remaining,
      canFeature,
      isAgency,
      isFreePlan: false,
      maxImages,
      currentImages: 0,
    });

  } catch (error) {
    console.error("❌ Error checking property permission:", error);
    return NextResponse.json({
      allowed: false,
      message: "حدث خطأ في التحقق من الصلاحية",
      maxProperties: 0,
      maxFeatured: 0,
      currentFeatured: 0,
      planName: '',
      remaining: 0,
      canFeature: false,
      isAgency: false,
      isFreePlan: false,
    });
  }
}