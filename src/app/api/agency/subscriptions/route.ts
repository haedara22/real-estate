// src/app/api/agency/subscriptions/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  userSubscriptions, 
  subscriptionPlans, 
  subscriptionRequests, 
  properties, 
  propertyImages,
  agencies
} from "@/lib/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!userId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // ✅ جلب الوكالة الخاصة بالمستخدم
    let agencyId = session?.user?.agencyId;

    // ✅ إذا كان المستخدم صاحب وكالة، جلب agencyId من جدول الوكالات
    if (!agencyId && userRole === 'agency_owner') {
      const agency = await db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.ownerId, userId))
        .limit(1);
      
      agencyId = agency[0]?.id || null;
    }

    console.log("🔍 Agency ID:", agencyId);

    // ✅ جلب الاشتراكات
    const subscriptions = await db
      .select({
        id: userSubscriptions.id,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        autoRenew: userSubscriptions.autoRenew,
        createdAt: userSubscriptions.createdAt,
        planName: subscriptionPlans.nameAr,
        planPrice: subscriptionPlans.price,
        planMaxProperties: subscriptionPlans.maxProperties,
        planMaxImages: subscriptionPlans.maxImagesPerProperty,
        planMaxFeatured: subscriptionPlans.maxFeaturedProperties,
        planFeatures: subscriptionPlans.featuresAr,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));

    const activeSubscription = subscriptions.find(s => s.status === 'active');

    // ✅ حساب الاستخدام الحقيقي
    let currentUsage = {
      totalProperties: 0,
      totalImages: 0,
      featuredProperties: 0,
    };

    if (agencyId) {
      // ✅ عدد العقارات في الوكالة
      const propertiesResult = await db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.agencyId, agencyId));

      // ✅ عدد الصور لكل عقار في الوكالة
      const imagesResult = await db
        .select({ count: count() })
        .from(propertyImages)
        .innerJoin(properties, eq(propertyImages.propertyId, properties.id))
        .where(eq(properties.agencyId, agencyId));

      // ✅ عدد العقارات المميزة
      const featuredResult = await db
        .select({ count: count() })
        .from(properties)
        .where(
          and(
            eq(properties.agencyId, agencyId),
            eq(properties.isFeatured, true)
          )
        );

      currentUsage = {
        totalProperties: Number(propertiesResult[0]?.count || 0),
        totalImages: Number(imagesResult[0]?.count || 0),
        featuredProperties: Number(featuredResult[0]?.count || 0),
      };

      console.log("📊 Current Usage:", currentUsage);
    }

    // ✅ طلبات معلقة
    const pendingRequests = await db
      .select({
        id: subscriptionRequests.id,
        planId: subscriptionRequests.planId,
        status: subscriptionRequests.status,
        amount: subscriptionRequests.amount,
        createdAt: subscriptionRequests.createdAt,
        planName: subscriptionPlans.nameAr,
      })
      .from(subscriptionRequests)
      .innerJoin(subscriptionPlans, eq(subscriptionRequests.planId, subscriptionPlans.id))
      .where(
        and(
          eq(subscriptionRequests.userId, userId),
          eq(subscriptionRequests.status, 'pending')
        )
      )
      .orderBy(desc(subscriptionRequests.createdAt));

    // ✅ الخطط المتاحة
    const availablePlans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.displayOrder);

    return NextResponse.json({
      subscriptions,
      activeSubscription,
      currentUsage,
      pendingRequests,
      availablePlans,
      agencyId,
    });

  } catch (error) {
    console.error("❌ Error fetching subscription data:", error);
    return NextResponse.json(
      { error: "فشل في جلب البيانات" },
      { status: 500 }
    );
  }
}