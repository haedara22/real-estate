// src/lib/subscription-utils.ts

import { db } from "./db";
import { properties, propertyImages, subscriptionPlans, userSubscriptions } from "./db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";

// ============================================
// أنواع البيانات
// ============================================
interface UserPlan {
  id: string;
  planId: string | null;
  planStatus: string;
  planExpiresAt: string | null;
}

interface CanAddPropertyResult {
  allowed: boolean;
  message?: string;
  currentCount?: number;
  maxProperties?: number;
  planName?: string;
}

interface CanAddImageResult {
  allowed: boolean;
  message?: string;
  currentCount?: number;
  maxImages?: number;
  planName?: string;
  remaining?: number;
  warning?: boolean;
}

// ============================================
// 1️⃣ جلب خطة المستخدم الحالية (من جدول users)
// ============================================
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  try {
    const result = await db.execute(
      sql`
        SELECT 
          id,
          plan_id as "planId",
          plan_status as "planStatus",
          plan_expires_at as "planExpiresAt"
        FROM users 
        WHERE id = ${userId}
        LIMIT 1
      `
    );

    if (!result || result.rows.length === 0) return null;
    
    const row = result.rows[0] as any;
    return {
      id: row.id as string,
      planId: row.planId as string | null,
      planStatus: row.planStatus as string || 'free',
      planExpiresAt: row.planExpiresAt as string | null,
    };
  } catch (error) {
    console.error("❌ Error getting user plan:", error);
    return {
      id: userId,
      planId: null,
      planStatus: 'free',
      planExpiresAt: null,
    };
  }
}

// ============================================
// 2️⃣ جلب الاشتراك النشط من جدول userSubscriptions
// ============================================
export async function getActiveSubscription(userId: string) {
  try {
    const subscription = await db
      .select({
        id: userSubscriptions.id,
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        autoRenew: userSubscriptions.autoRenew,
      })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      )
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    return subscription[0] || null;
  } catch (error) {
    console.error("❌ Error getting active subscription:", error);
    return null;
  }
}

// ============================================
// 3️⃣ التحقق من صلاحية الخطة (من users)
// ============================================
export function isPlanActive(userPlan: UserPlan | null): boolean {
  if (!userPlan) return false;
  
  // ✅ الخطة المجانية تعتبر نشطة دائماً
  if (!userPlan.planId && userPlan.planStatus === 'free') {
    return true;
  }
  
  if (!userPlan.planId) return false;
  if (userPlan.planStatus !== "active" && userPlan.planStatus !== "free") return false;
  if (userPlan.planExpiresAt && new Date() > new Date(userPlan.planExpiresAt)) {
    return false;
  }
  return true;
}

// ============================================
// 4️⃣ التحقق من صلاحية الاشتراك (من userSubscriptions)
// ============================================
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
    return false;
  }
  return true;
}

// ============================================
// 5️⃣ عدد عقارات المستخدم
// ============================================
export async function getUserPropertiesCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.userId, userId));
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error("❌ Error getting properties count:", error);
    return 0;
  }
}

// ============================================
// 6️⃣ عدد صور العقار
// ============================================
export async function getPropertyImagesCount(propertyId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId));
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error("❌ Error getting images count:", error);
    return 0;
  }
}

// ============================================
// 7️⃣ جلب تفاصيل الخطة من subscriptionPlans
// ============================================
export async function getPlanDetails(planId: string) {
  try {
    if (!planId) {
      console.warn("⚠️ planId is null or undefined");
      return null;
    }

    const plan = await db
      .select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        nameAr: subscriptionPlans.nameAr,
        maxProperties: subscriptionPlans.maxProperties,
        maxImagesPerProperty: subscriptionPlans.maxImagesPerProperty,
        maxFeaturedProperties: subscriptionPlans.maxFeaturedProperties,
        price: subscriptionPlans.price,
        interval: subscriptionPlans.interval,
        featuresAr: subscriptionPlans.featuresAr,
        isActive: subscriptionPlans.isActive,
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    return plan[0] || null;
  } catch (error) {
    console.error("❌ Error getting plan details:", error);
    return null;
  }
}

// ============================================
// 8️⃣ التحقق من إمكانية إضافة عقار جديد
// ============================================
export async function canAddProperty(userId: string): Promise<CanAddPropertyResult> {
  try {
    console.log("🔍 canAddProperty - بدء التحقق للمستخدم:", userId);

    const userPlan = await getUserPlan(userId);
    console.log("📊 userPlan:", userPlan);

    // ✅ التحقق من الخطة المجانية (بدون planId)
    if (!userPlan || !userPlan.planId) {
      // ✅ إذا كان المستخدم في الخطة المجانية
      if (userPlan?.planStatus === 'free') {
        console.log("📊 المستخدم في الخطة المجانية، الحد الافتراضي: 3 عقارات");
        const maxProperties = 3;
        const currentCount = await getUserPropertiesCount(userId);
        
        if (currentCount >= maxProperties) {
          return {
            allowed: false,
            message: `لقد وصلت للحد الأقصى للعقارات المجانية (${maxProperties} عقار). يرجى الاشتراك في إحدى الباقات.`,
            currentCount,
            maxProperties,
            planName: 'مجاني',
          };
        }
        
        return {
          allowed: true,
          currentCount,
          maxProperties: maxProperties,
          planName: 'مجاني',
        };
      }
      
      return { 
        allowed: false, 
        message: "ليس لديك خطة اشتراك نشطة. يرجى اختيار خطة أولاً." 
      };
    }

    // ✅ التحقق من صلاحية الخطة
    if (!isPlanActive(userPlan)) {
      return { 
        allowed: false, 
        message: "انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك لإضافة عقار جديد." 
      };
    }

    const plan = await getPlanDetails(userPlan.planId);
    console.log("📊 plan:", plan);

    if (!plan) {
      return { 
        allowed: false, 
        message: "الخطة غير موجودة. يرجى التواصل مع الدعم." 
      };
    }

    const maxProperties = plan.maxProperties ?? 3;
    const currentCount = await getUserPropertiesCount(userId);

    console.log(`📊 currentCount: ${currentCount}, maxProperties: ${maxProperties}`);

    if (currentCount >= maxProperties) {
      return { 
        allowed: false, 
        message: `لقد وصلت للحد الأقصى (${maxProperties} عقار). يرجى ترقية خطتك لإضافة المزيد.`,
        currentCount,
        maxProperties,
        planName: plan.nameAr,
      };
    }

    return { 
      allowed: true,
      currentCount,
      maxProperties,
      planName: plan.nameAr,
    };
  } catch (error) {
    console.error("❌ Error in canAddProperty:", error);
    return { 
      allowed: false, 
      message: "حدث خطأ في التحقق من صلاحية الاشتراك." 
    };
  }
}

// ============================================
// 9️⃣ التحقق من إمكانية إضافة صورة
// ============================================
export async function canAddImage(
  propertyId: string, 
  userId: string
): Promise<CanAddImageResult> {
  try {
    console.log("🔍 canAddImage - بدء التحقق:", { propertyId, userId });

    // ✅ 1. التحقق من وجود العقار
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property || property.length === 0) {
      console.log("❌ العقار غير موجود:", propertyId);
      return { 
        allowed: false, 
        message: "العقار غير موجود" 
      };
    }

    console.log("✅ العقار موجود:", property[0].id);

    // ✅ 2. جلب خطة المستخدم
    const userPlan = await getUserPlan(userId);
    console.log("📊 userPlan:", userPlan);

    // ✅ 3. التحقق من الخطة المجانية (بدون planId)
    if (!userPlan || !userPlan.planId) {
      // ✅ إذا كان المستخدم في الخطة المجانية
      if (userPlan?.planStatus === 'free') {
        console.log("📊 المستخدم في الخطة المجانية، الحد الافتراضي: 5 صور");
        const maxImages = 5;
        const currentCount = await getPropertyImagesCount(propertyId);
        
        if (currentCount >= maxImages) {
          return {
            allowed: false,
            message: `لقد وصلت للحد الأقصى للصور في الخطة المجانية (${maxImages} صورة)`,
            currentCount,
            maxImages,
            planName: 'مجاني',
            remaining: 0,
          };
        }
        
        return {
          allowed: true,
          message: `يمكنك إضافة ${maxImages - currentCount} صور أخرى (الحد الأقصى: ${maxImages})`,
          currentCount,
          maxImages,
          planName: 'مجاني',
          remaining: maxImages - currentCount,
        };
      }
      
      return { 
        allowed: false, 
        message: "ليس لديك خطة اشتراك نشطة." 
      };
    }

    // ✅ 4. التحقق من صلاحية الخطة
    if (!isPlanActive(userPlan)) {
      // ✅ إذا كانت الخطة منتهية ولكن status = 'free'
      if (userPlan.planStatus === 'free') {
        const maxImages = 5;
        const currentCount = await getPropertyImagesCount(propertyId);
        
        if (currentCount >= maxImages) {
          return {
            allowed: false,
            message: `لقد وصلت للحد الأقصى للصور في الخطة المجانية (${maxImages} صورة)`,
            currentCount,
            maxImages,
            planName: 'مجاني',
            remaining: 0,
          };
        }
        
        return {
          allowed: true,
          message: `يمكنك إضافة ${maxImages - currentCount} صور أخرى (الحد الأقصى: ${maxImages})`,
          currentCount,
          maxImages,
          planName: 'مجاني',
          remaining: maxImages - currentCount,
        };
      }
      
      return { 
        allowed: false, 
        message: "انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك لإضافة صور." 
      };
    }

    // ✅ 5. جلب تفاصيل الخطة
    const plan = await getPlanDetails(userPlan.planId);
    console.log("📊 plan:", plan);

    if (!plan) {
      return { 
        allowed: false, 
        message: "الخطة غير موجودة." 
      };
    }

    const maxImages = plan.maxImagesPerProperty ?? 5;
    const currentCount = await getPropertyImagesCount(propertyId);

    console.log(`📸 currentCount: ${currentCount}, maxImages: ${maxImages}`);

    if (currentCount >= maxImages) {
      return { 
        allowed: false, 
        message: `لقد وصلت للحد الأقصى (${maxImages} صورة). يرجى ترقية خطتك لإضافة المزيد.`,
        currentCount,
        maxImages,
        planName: plan.nameAr,
        remaining: 0,
      };
    }

    const remaining = maxImages - currentCount;

    return { 
      allowed: true,
      message: `يمكنك إضافة ${remaining} صور أخرى (الحد الأقصى: ${maxImages})`,
      currentCount,
      maxImages,
      planName: plan.nameAr,
      remaining,
    };

  } catch (error) {
    console.error("❌ Error in canAddImage:", error);
    return { 
      allowed: true, 
      message: "تم السماح برفع الصور (تجاوز التحقق بسبب خطأ في النظام)",
      warning: true,
    };
  }
}

// ============================================
// 🔟 جلب تفاصيل خطة المستخدم الكاملة
// ============================================
export async function getUserPlanDetails(userId: string) {
  try {
    const userPlan = await getUserPlan(userId);
    
    if (!userPlan || !userPlan.planId) {
      // ✅ إذا كان المستخدم في الخطة المجانية
      if (userPlan?.planStatus === 'free') {
        return {
          plan: null,
          status: 'free',
          expiresAt: null,
          isActive: true,
          subscription: null,
          isSubscriptionActive: false,
        };
      }
      return null;
    }

    const plan = await getPlanDetails(userPlan.planId);
    const subscription = await getActiveSubscription(userId);

    return {
      plan,
      status: userPlan.planStatus,
      expiresAt: userPlan.planExpiresAt,
      isActive: isPlanActive(userPlan),
      subscription: subscription,
      isSubscriptionActive: isSubscriptionActive(subscription),
    };
  } catch (error) {
    console.error("❌ Error getting user plan details:", error);
    return null;
  }
}

// ============================================
// 1️⃣1️⃣ الحصول على إحصائيات استخدام المستخدم
// ============================================
export async function getUserUsage(userId: string) {
  try {
    const userPlan = await getUserPlan(userId);
    const plan = userPlan?.planId ? await getPlanDetails(userPlan.planId) : null;
    
    const propertiesCount = await getUserPropertiesCount(userId);
    
    const userProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.userId, userId));

    let totalImages = 0;
    for (const prop of userProperties) {
      const count = await getPropertyImagesCount(prop.id);
      totalImages += count;
    }

    const maxProperties = plan?.maxProperties ?? 3;
    const maxImagesPerProperty = plan?.maxImagesPerProperty ?? 5;
    const planName = plan?.nameAr || (userPlan?.planStatus === 'free' ? 'مجاني' : 'بدون خطة');

    // ✅ إصلاح الخطأ: استخدام isPlanActive بشكل صحيح
    const isActive = userPlan ? isPlanActive(userPlan) : false;

    return {
      propertiesCount,
      totalImages,
      maxProperties,
      maxImagesPerProperty,
      planName,
      planId: userPlan?.planId || null,
      isActive: isActive,
      remainingProperties: Math.max(0, maxProperties - propertiesCount),
    };
  } catch (error) {
    console.error("❌ Error getting user usage:", error);
    return null;
  }
}