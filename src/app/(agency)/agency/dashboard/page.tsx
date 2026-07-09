// src/app/(agency)/agency/dashboard/page.tsx

import { db } from "@/lib/db";
import { properties, agencies, agencyStaff, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, sql, count } from "drizzle-orm";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { DashboardClient } from "./DashboardClient";

// ✅ دالة جلب البيانات
async function getAgencyData(userId: string) {
  try {
    const agency = await db
      .select({
        id: agencies.id,
        ownerId: agencies.ownerId,
        name: agencies.name,
        slug: agencies.slug,
        description: agencies.description,
        logo: agencies.logo,
        coverImage: agencies.coverImage,
        address: agencies.address,
        phone: agencies.phone,
        email: agencies.email,
        website: agencies.website,
        isVerified: agencies.isVerified,
        isActive: agencies.isActive,
        rating: agencies.rating,
        reviewCount: agencies.reviewCount,
        metadata: agencies.metadata,
        createdAt: agencies.createdAt,
        updatedAt: agencies.updatedAt,
      })
      .from(agencies)
      .where(eq(agencies.ownerId, userId))
      .limit(1);

    if (!agency || agency.length === 0) {
      return null;
    }

    const agencyData = agency[0];

    const [propertiesCount, staffCount, viewsCount] = await Promise.all([
      db.select({ count: count() }).from(properties).where(eq(properties.agencyId, agencyData.id)),
      db.select({ count: count() }).from(agencyStaff).where(eq(agencyStaff.agencyId, agencyData.id)),
      db.select({ total: sql<number>`COALESCE(SUM(${properties.viewsCount}), 0)` })
        .from(properties)
        .where(eq(properties.agencyId, agencyData.id)),
    ]);

    let subscription = null;
    let isSubscriptionActive = false;
    let planName = "لا يوجد";

    try {
      const subResult = await db
        .select({
          id: userSubscriptions.id,
          status: userSubscriptions.status,
          startDate: userSubscriptions.startDate,
          endDate: userSubscriptions.endDate,
          planId: userSubscriptions.planId,
        })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.agencyId, agencyData.id))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);

      if (subResult && subResult.length > 0) {
        subscription = subResult[0];
        isSubscriptionActive = subscription.status === "active" && 
          (!subscription.endDate || new Date() < new Date(subscription.endDate));
        
        if (subscription.planId) {
          const planResult = await db
            .select({ nameAr: subscriptionPlans.nameAr })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId))
            .limit(1);
          
          if (planResult && planResult.length > 0) {
            planName = planResult[0].nameAr;
          }
        }
      }
    } catch (err) {
      console.log("⚠️ No subscription found for agency");
    }

    const recentProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.agencyId, agencyData.id))
      .orderBy(desc(properties.createdAt))
      .limit(5);

    return {
      agency: agencyData,
      propertiesCount: Number(propertiesCount[0]?.count || 0),
      staffCount: Number(staffCount[0]?.count || 0),
      viewsCount: Number(viewsCount[0]?.total || 0),
      subscription,
      isSubscriptionActive,
      planName,
      recentProperties,
    };
  } catch (error) {
    console.error("❌ Error fetching agency data:", error);
    return null;
  }
}

// ✅ الصفحة الرئيسية (Server Component)
export default async function AgencyDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  const data = await getAgencyData(session.user.id);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ليس لديك وكالة مسجلة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            قم بتسجيل وكالتك الآن للبدء في إدارة عقاراتك
          </p>
          <Link
            href="/agency/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            <PlusCircle className="w-5 h-5" />
            تسجيل وكالة
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardClient initialData={data} />;
}