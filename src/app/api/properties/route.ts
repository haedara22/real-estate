// src/app/api/properties/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { properties, subscriptionPlans, userSubscriptions, agencies, users } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      title, titleAr, description, descriptionAr, price, 
      purpose, type, cityId, districtId, 
      address, bedrooms, bathrooms, area, isFeatured = false 
    } = body;

    const userId = session.user.id;
    const userRole = session.user.role;

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
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
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
        planMaxProperties: subscriptionPlans.maxProperties,
        planMaxFeatured: subscriptionPlans.maxFeaturedProperties,
        planName: subscriptionPlans.nameAr,
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

    let maxProperties = 0;
    let maxFeatured = 0;
    let planName = 'مجاني';

    // ✅ 4. إذا كان هناك اشتراك، استخدم حدوده
    if (subscription && subscription.length > 0) {
      maxProperties = subscription[0].planMaxProperties || 0;
      maxFeatured = subscription[0].planMaxFeatured || 0;
      planName = subscription[0].planName || 'أساسي';
      console.log("📊 Active subscription found:", planName);
    } else {
      // ✅ 5. لا يوجد اشتراك، تحقق من الحد المجاني (3 عقارات)
      console.log("⚠️ No subscription, checking free limit...");
      
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
        return NextResponse.json(
          { error: `لقد وصلت للحد الأقصى للعقارات المجانية (${FREE_PROPERTIES_LIMIT} عقار). يرجى الاشتراك في إحدى الباقات.` },
          { status: 403 }
        );
      }

      maxProperties = FREE_PROPERTIES_LIMIT;
      maxFeatured = 0;
      planName = 'مجاني';
      console.log("📊 Free plan:", currentCount, "/", FREE_PROPERTIES_LIMIT);
    }

    // ✅ 6. حساب عدد العقارات الحالية
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

    // ✅ 7. التحقق من الحد الأقصى للعقارات
    if (maxProperties > 0 && currentCount >= maxProperties) {
      return NextResponse.json(
        { error: `لقد وصلت للحد الأقصى (${maxProperties} عقار). يرجى ترقية خطتك.` },
        { status: 403 }
      );
    }

    // ✅ 8. التحقق من إمكانية تمييز العقار
    let canFeature = false;
    let featuredError = null;

    if (isFeatured) {
      if (maxFeatured === 0) {
        featuredError = "خطتك الحالية لا تدعم تمييز العقارات. قم بترقية خطتك.";
        canFeature = false;
      } else {
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

        if (currentFeatured >= maxFeatured) {
          featuredError = `لقد وصلت للحد الأقصى (${maxFeatured} عقار مميز). قم بترقية خطتك.`;
          canFeature = false;
        } else {
          canFeature = true;
        }
      }
    }

    // ✅ 9. إنشاء الـ slug الفريد (مع التحقق من التكرار)
    const generateSlug = async (text: string) => {
      if (!text) return `property-${Date.now()}`;
      
      let slug = text
        .trim()
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      if (!slug) {
        slug = `property-${Date.now()}`;
      }

      // ✅ التحقق من وجود slug مكرر
      const existing = await db
        .select({ slug: properties.slug })
        .from(properties)
        .where(eq(properties.slug, slug))
        .limit(1);

      if (existing && existing.length > 0) {
        slug = `${slug}-${Date.now().toString().slice(-6)}`;
      }

      return slug;
    };

    const slug = await generateSlug(titleAr || title);
    const code = `PRP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // ✅ 10. إنشاء كائن العقار
    const propertyData = {
      code: code,
      slug: slug,
      title: title || titleAr,
      userId: userId,
      agencyId: agencyId,
      description: description || descriptionAr,
      price: price ? String(price) : null,
      purpose: purpose,
      type: type,
      status: 'published',
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area: area ? parseFloat(area) : null,
      cityId: cityId || null,
      districtId: districtId || null,
      address: address || null,
      isFeatured: isFeatured && canFeature,
      viewsCount: 0,
      favoritesCount: 0,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📝 Creating property:", {
      title: propertyData.title,
      slug: propertyData.slug,
      price: propertyData.price,
      isFeatured: propertyData.isFeatured,
    });

    // ✅ 11. إضافة العقار
    const newProperty = await db
      .insert(properties)
      .values(propertyData as any)
      .returning();

    const property = newProperty[0];

    console.log("✅ Property created:", {
      id: property.id,
      slug: property.slug,
      title: property.title,
    });

    // ✅ 12. إنشاء إشعار للمالك
    await createNotification({
      userId: userId,
      type: 'property_new',
      title: '✅ تم إضافة عقار جديد',
      titleAr: '✅ تم إضافة عقار جديد',
      message: `تم إضافة عقار "${property.title}" ونشره على المنصة`,
      messageAr: `تم إضافة عقار "${property.title}" ونشره على المنصة`,
      link: `/properties/${property.slug}`,
      metadata: {
        propertyId: property.id,
        isFeatured: property.isFeatured,
      },
    });

    // ✅ 13. إشعار للأدمن (للإطلاع فقط)
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'system',
        title: '📢 عقار جديد تم نشره',
        titleAr: '📢 عقار جديد تم نشره',
        message: `تم نشر عقار جديد "${property.title}" بواسطة ${session.user.name || 'مستخدم'}`,
        messageAr: `تم نشر عقار جديد "${property.title}" بواسطة ${session.user.name || 'مستخدم'}`,
        link: `/properties/${property.slug}`,
        metadata: {
          propertyId: property.id,
          userId: userId,
          action: 'new_property_notification',
        },
      });
    }

    // ✅ 14. إذا كان التمييز مطلوباً ولكن غير مسموح
    if (isFeatured && !canFeature) {
      return NextResponse.json({
        ...property,
        warning: featuredError,
        featuredAdded: false,
      }, { status: 201 });
    }

    return NextResponse.json(property, { status: 201 });

  } catch (error) {
    console.error("❌ Error adding property:", error);
    return NextResponse.json(
      { error: "فشل في إضافة العقار" },
      { status: 500 }
    );
  }
}