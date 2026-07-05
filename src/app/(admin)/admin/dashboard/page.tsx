import { db } from "@/lib/db";
import { users, agencies, properties, subscriptionPlans, userSubscriptions } from "@/lib/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import Link from "next/link";
import { 
  Users, 
  Building, 
  Home, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// ============================================
// جلب الإحصائيات
// ============================================
async function getStats() {
  try {
    // عدد المستخدمين
    const usersCount = await db.select({ count: count() }).from(users);
    
    // عدد الوكالات
    const agenciesCount = await db.select({ count: count() }).from(agencies);
    
    // عدد العقارات
    const propertiesCount = await db.select({ count: count() }).from(properties);
    
    // عدد الاشتراكات النشطة
    const activeSubscriptions = await db
      .select({ count: count() })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.status, "active"));
    
    // المستخدمين الجدد (آخر 7 أيام)
    const newUsers = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} > NOW() - INTERVAL '7 days'`);
    
    // العقارات الجديدة (آخر 7 أيام)
    const newProperties = await db
      .select({ count: count() })
      .from(properties)
      .where(sql`${properties.createdAt} > NOW() - INTERVAL '7 days'`);
    
    // إجمالي الإيرادات (تقديرية)
    const totalRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${subscriptionPlans.price} AS DECIMAL)), 0)` })
      .from(subscriptionPlans)
      .innerJoin(userSubscriptions, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.status, "active"));
    
    return {
      users: Number(usersCount[0]?.count || 0),
      agencies: Number(agenciesCount[0]?.count || 0),
      properties: Number(propertiesCount[0]?.count || 0),
      activeSubscriptions: Number(activeSubscriptions[0]?.count || 0),
      newUsers: Number(newUsers[0]?.count || 0),
      newProperties: Number(newProperties[0]?.count || 0),
      totalRevenue: Number(totalRevenue[0]?.total || 0),
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      users: 0,
      agencies: 0,
      properties: 0,
      activeSubscriptions: 0,
      newUsers: 0,
      newProperties: 0,
      totalRevenue: 0,
    };
  }
}

// ============================================
// جلب آخر المستخدمين
// ============================================
async function getRecentUsers() {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

// ============================================
// جلب آخر العقارات
// ============================================
async function getRecentProperties() {
  try {
    return await db
      .select({
        id: properties.id,
        title: properties.title,
        price: properties.price,
        status: properties.status,
        createdAt: properties.createdAt,
      })
      .from(properties)
      .orderBy(desc(properties.createdAt))
      .limit(5);
  } catch (error) {
    return [];
  }
}

// ============================================
// الصفحة الرئيسية
// ============================================
export default async function AdminDashboardPage() {
  const stats = await getStats();
  const recentUsers = await getRecentUsers();
  const recentProperties = await getRecentProperties();

  const statCards = [
    {
      title: "المستخدمين",
      value: stats.users,
      icon: Users,
      color: "bg-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      change: `+${stats.newUsers} جديد`,
    },
    {
      title: "الوكالات",
      value: stats.agencies,
      icon: Building,
      color: "bg-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-600 dark:text-green-400",
      change: "نشطة",
    },
    {
      title: "العقارات",
      value: stats.properties,
      icon: Home,
      color: "bg-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400",
      change: `+${stats.newProperties} جديدة`,
    },
    {
      title: "الاشتراكات النشطة",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "bg-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      text: "text-yellow-600 dark:text-yellow-400",
      change: `$${stats.totalRevenue}`,
    },
  ];

  return (
    <div>
      {/* العنوان */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 لوحة التحكم
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            نظرة عامة على أداء المنصة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            آخر تحديث: {new Date().toLocaleString('ar-SA')}
          </span>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {card.change}
                  </p>
                </div>
                <div className={`${card.bg} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${card.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* آخر المستخدمين */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              👤 آخر المستخدمين
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              عرض الكل →
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.[0] || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === "admin" 
                        ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        : user.role === "agency_owner"
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}>
                      {user.role === "admin" ? "مدير" :
                       user.role === "agency_owner" ? "مالك وكالة" :
                       user.role === "agency_staff" ? "موظف" : "مستخدم"}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                لا يوجد مستخدمين
              </p>
            )}
          </div>
        </div>

        {/* آخر العقارات */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              🏠 آخر العقارات
            </h2>
            <Link
              href="/admin/properties"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              عرض الكل →
            </Link>
          </div>
          <div className="space-y-3">
            {recentProperties.length > 0 ? (
              recentProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {property.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Intl.NumberFormat('ar-SY').format(Number(property.price))} ل.س
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      property.status === "active"
                        ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        : property.status === "pending"
                        ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                        : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    }`}>
                      {property.status === "active" ? "نشط" :
                       property.status === "pending" ? "قيد المراجعة" :
                       property.status === "sold" ? "مباع" :
                       property.status === "rented" ? "مؤجر" : "غير نشط"}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(property.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                لا يوجد عقارات
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}