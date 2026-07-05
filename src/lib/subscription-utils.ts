import { db } from "./db";
import { users, properties, propertyImages, subscriptionPlans } from "./db/schema";
import { eq, sql } from "drizzle-orm";

// جلب خطة المستخدم الحالية
export async function getUserPlan(userId: string) {
  try {
    const user = await db
      .select({
        id: users.id,
        planId: users.planId,
        planStatus: users.planStatus,
        planExpiresAt: users.planExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) return null;
    return user[0];
  } catch (error) {
    console.error("Error getting user plan:", error);
    return null;
  }
}

// التحقق من صلاحية الخطة
export function isPlanActive(userPlan: any): boolean {
  if (!userPlan || !userPlan.planId) return false;
  if (userPlan.planStatus !== "active") return false;
  if (userPlan.planExpiresAt && new Date() > new Date(userPlan.planExpiresAt)) {
    return false;
  }
  return true;
}

// عدد عقارات المستخدم
export async function getUserPropertiesCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(eq(properties.userId, userId));
    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error("Error getting properties count:", error);
    return 0;
  }
}

// عدد صور العقار
export async function getPropertyImagesCount(propertyId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId));
    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error("Error getting images count:", error);
    return 0;
  }
}

// جلب تفاصيل الخطة
export async function getPlanDetails(planId: string) {
  try {
    const plan = await db
      .select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        nameAr: subscriptionPlans.nameAr,
        maxProperties: subscriptionPlans.maxProperties,
        maxImagesPerProperty: subscriptionPlans.maxImagesPerProperty,
        price: subscriptionPlans.price,
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    return plan[0] || null;
  } catch (error) {
    console.error("Error getting plan details:", error);
    return null;
  }
}

// التحقق من إمكانية إضافة عقار جديد
export async function canAddProperty(userId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const userPlan = await getUserPlan(userId);
    
    if (!userPlan || !userPlan.planId) {
      return { 
        allowed: false, 
        message: "ليس لديك خطة اشتراك نشطة. يرجى اختيار خطة أولاً." 
      };
    }

    // التحقق من صلاحية الخطة
    if (!isPlanActive(userPlan)) {
      return { 
        allowed: false, 
        message: "انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك لإضافة عقار جديد." 
      };
    }

    // جلب تفاصيل الخطة
    const plan = await getPlanDetails(userPlan.planId);
    
    if (!plan) {
      return { 
        allowed: false, 
        message: "الخطة غير موجودة. يرجى التواصل مع الدعم." 
      };
    }

    const maxProperties = plan.maxProperties || 3;
    const currentCount = await getUserPropertiesCount(userId);

    if (currentCount >= maxProperties) {
      return { 
        allowed: false, 
        message: `لقد وصلت للحد الأقصى (${maxProperties} عقار). يرجى ترقية خطتك لإضافة المزيد.` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in canAddProperty:", error);
    return { 
      allowed: false, 
      message: "حدث خطأ في التحقق من صلاحية الاشتراك." 
    };
  }
}

// التحقق من إمكانية إضافة صورة
export async function canAddImage(propertyId: string, userId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const userPlan = await getUserPlan(userId);
    
    if (!userPlan || !userPlan.planId) {
      return { 
        allowed: false, 
        message: "ليس لديك خطة اشتراك نشطة." 
      };
    }

    if (!isPlanActive(userPlan)) {
      return { 
        allowed: false, 
        message: "انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك لإضافة صور." 
      };
    }

    // جلب تفاصيل الخطة
    const plan = await getPlanDetails(userPlan.planId);
    
    if (!plan) {
      return { 
        allowed: false, 
        message: "الخطة غير موجودة." 
      };
    }

    const maxImages = plan.maxImagesPerProperty || 5;
    const currentCount = await getPropertyImagesCount(propertyId);

    if (currentCount >= maxImages) {
      return { 
        allowed: false, 
        message: `لقد وصلت للحد الأقصى (${maxImages} صورة). يرجى ترقية خطتك لإضافة المزيد.` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in canAddImage:", error);
    return { 
      allowed: false, 
      message: "حدث خطأ في التحقق من صلاحية الاشتراك." 
    };
  }
}

// جلب خطة المستخدم مع التفاصيل
export async function getUserPlanDetails(userId: string) {
  try {
    const userPlan = await getUserPlan(userId);
    
    if (!userPlan || !userPlan.planId) {
      return null;
    }

    const plan = await getPlanDetails(userPlan.planId);

    return {
      plan,
      status: userPlan.planStatus,
      expiresAt: userPlan.planExpiresAt,
      isActive: isPlanActive(userPlan),
    };
  } catch (error) {
    console.error("Error getting user plan details:", error);
    return null;
  }
}