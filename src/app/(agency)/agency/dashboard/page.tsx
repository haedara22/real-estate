import { db } from "@/lib/db";
import { properties, agencies, agencyStaff, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq, sql, count } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  Building, 
  Home, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Eye,
  PlusCircle,
  ArrowUpRight,
  Calendar,
  Clock
} from "lucide-react";

async function getAgencyData(userId: string) {
  try {
    // ✅ جلب الوكالة
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

    // ✅ عدد العقارات
    const propertiesCount = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.agencyId, agencyData.id));

    // ✅ عدد الموظفين
    const staffCount = await db
      .select({ count: count() })
      .from(agencyStaff)
      .where(eq(agencyStaff.agencyId, agencyData.id));

    // ✅ عدد المشاهدات
    const viewsCount = await db
      .select({ total: sql<number>`COALESCE(SUM(${properties.viewsCount}), 0)` })
      .from(properties)
      .where(eq(properties.agencyId, agencyData.id));

    // ✅ جلب الاشتراك النشط
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
        
        // ✅ التحقق من صلاحية الاشتراك
        isSubscriptionActive = subscription.status === "active" && 
          (!subscription.endDate || new Date() < new Date(subscription.endDate));
        
        // ✅ جلب اسم الخطة
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

    // ✅ آخر العقارات
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

export default async function AgencyDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  const data = await getAgencyData(session.user.id);

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏢</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ليس لديك وكالة مسجلة
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          قم بتسجيل وكالتك الآن للبدء في إدارة عقاراتك
        </p>
        <Link
          href="/agency/register"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          تسجيل وكالة
        </Link>
      </div>
    );
  }

  const { 
    agency, 
    propertiesCount, 
    staffCount, 
    viewsCount, 
    isSubscriptionActive,
    planName,
    recentProperties 
  } = data;

  // ✅ إحصائيات البطاقات
  const stats = [
    {
      title: "العقارات",
      value: propertiesCount,
      icon: Home,
      color: "bg-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "الموظفين",
      value: staffCount,
      icon: Users,
      color: "bg-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-600 dark:text-green-400",
    },
    {
      title: "المشاهدات",
      value: viewsCount,
      icon: Eye,
      color: "bg-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "الاشتراك",
      value: isSubscriptionActive ? `✅ ${planName}` : "❌ غير نشط",
      icon: CreditCard,
      color: isSubscriptionActive ? "bg-green-500" : "bg-red-500",
      bg: isSubscriptionActive ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
      text: isSubscriptionActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div>
      {/* ✅ العنوان */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 لوحة تحكم الوكالة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {agency.name} - مرحباً بعودتك
          </p>
          {isSubscriptionActive && (
            <span className="inline-block mt-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
              ✅ اشتراك {planName} نشط
            </span>
          )}
        </div>
        <Link
          href="/properties/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة عقار
        </Link>
      </div>

      {/* ✅ بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ معلومات الوكالة */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {agency.logo ? (
              <Image
                src={agency.logo}
                alt={agency.name}
                width={64}
                height={64}
                className="rounded-2xl object-cover"
                unoptimized
              />
            ) : (
              <Building className="w-8 h-8" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{agency.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{agency.address || "لا يوجد عنوان"}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${agency.isVerified ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                {agency.isVerified ? "✅ موثقة" : "⏳ قيد المراجعة"}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${agency.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {agency.isActive ? "نشطة" : "غير نشطة"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ آخر العقارات */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            🏠 آخر العقارات
          </h3>
          <Link
            href="/agency/properties"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            عرض الكل →
          </Link>
        </div>
        {recentProperties.length > 0 ? (
          <div className="space-y-3">
            {recentProperties.map((property) => (
              <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{property.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Intl.NumberFormat('ar-SY').format(Number(property.price))} ل.س
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${property.status === "active" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                    {property.status === "active" ? "نشط" : "قيد المراجعة"}
                  </span>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    عرض
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            لا توجد عقارات مضافة بعد
          </p>
        )}
      </div>
    </div>
  );
}