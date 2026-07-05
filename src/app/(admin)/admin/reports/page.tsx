import { db } from "@/lib/db";
import { users, agencies, properties, propertyViews, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { desc, eq, sql, and, count } from "drizzle-orm";
import Link from "next/link";
import { 
  FileText, 
  Users, 
  Building, 
  Home, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Printer,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

// ============================================
// جلب إحصائيات التقارير
// ============================================
async function getReportsData() {
  try {
    // 1. إحصائيات عامة
    const [usersCount, agenciesCount, propertiesCount, viewsCount, subscriptionsCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(agencies),
      db.select({ count: count() }).from(properties),
      db.select({ count: count() }).from(propertyViews),
      db.select({ count: count() }).from(userSubscriptions).where(eq(userSubscriptions.status, "active")),
    ]);

    // 2. المستخدمين الجدد (آخر 30 يوم)
    const newUsersLast30Days = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} > NOW() - INTERVAL '30 days'`);

    // 3. العقارات الجديدة (آخر 30 يوم)
    const newPropertiesLast30Days = await db
      .select({ count: count() })
      .from(properties)
      .where(sql`${properties.createdAt} > NOW() - INTERVAL '30 days'`);

    // 4. المستخدمين حسب الدور
    const usersByRole = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.role);

    // 5. العقارات حسب الحالة
    const propertiesByStatus = await db
      .select({
        status: properties.status,
        count: sql<number>`count(*)`,
      })
      .from(properties)
      .groupBy(properties.status);

    // 6. العقارات حسب الغرض (بيع/إيجار)
    const propertiesByPurpose = await db
      .select({
        purpose: properties.purpose,
        count: sql<number>`count(*)`,
      })
      .from(properties)
      .groupBy(properties.purpose);

    // 7. الاشتراكات حسب الخطة (مع التحقق من null)
    const subscriptionsByPlan = await db
      .select({
        planId: userSubscriptions.planId,
        count: sql<number>`count(*)`,
      })
      .from(userSubscriptions)
      .groupBy(userSubscriptions.planId);

    // جلب أسماء الخطط
    const plans = await db.select().from(subscriptionPlans);
    const planMap = new Map(plans.map(p => [p.id, p.nameAr]));

    // ✅ تصفية القيم null قبل استخدام planMap
   // ✅ بعد (مع تحويل آمن)
const subscriptionsByPlanWithNames = subscriptionsByPlan
  .filter((item): item is { planId: string; count: number } => 
    item.planId !== null && item.planId !== undefined
  )
  .map(item => ({
    planName: planMap.get(item.planId) || "غير معروف",
    count: item.count,
  }));
    // 8. النشاط اليومي (آخر 7 أيام)
    const dailyActivity = await db
      .select({
        date: sql<string>`DATE(${properties.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(properties)
      .where(sql`${properties.createdAt} > NOW() - INTERVAL '7 days'`)
      .groupBy(sql`DATE(${properties.createdAt})`)
      .orderBy(sql`DATE(${properties.createdAt})`);

    return {
      totalUsers: Number(usersCount[0]?.count || 0),
      totalAgencies: Number(agenciesCount[0]?.count || 0),
      totalProperties: Number(propertiesCount[0]?.count || 0),
      totalViews: Number(viewsCount[0]?.count || 0),
      activeSubscriptions: Number(subscriptionsCount[0]?.count || 0),
      newUsers: Number(newUsersLast30Days[0]?.count || 0),
      newProperties: Number(newPropertiesLast30Days[0]?.count || 0),
      usersByRole,
      propertiesByStatus,
      propertiesByPurpose,
      subscriptionsByPlan: subscriptionsByPlanWithNames,
      dailyActivity,
    };
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return {
      totalUsers: 0,
      totalAgencies: 0,
      totalProperties: 0,
      totalViews: 0,
      activeSubscriptions: 0,
      newUsers: 0,
      newProperties: 0,
      usersByRole: [],
      propertiesByStatus: [],
      propertiesByPurpose: [],
      subscriptionsByPlan: [],
      dailyActivity: [],
    };
  }
}

// ============================================
// مكونات الصفحة
// ============================================

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  change, 
  changeType 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string; 
  change?: string; 
  changeType?: 'up' | 'down'; 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value.toLocaleString()}
          </p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              changeType === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BarChart({ data, label }: { data: any[]; label: string }) {
  if (data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد بيانات</p>;
  }

  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400 w-24 truncate">
            {item[label] || item.date || "غير محدد"}
          </span>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12 text-left">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieChartCard({ data, label }: { data: any[]; label: string }) {
  if (data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد بيانات</p>;
  }

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ];

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`} />
          <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">
            {item[label] || item.purpose || item.status || "غير محدد"}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {item.count}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
            {((item.count / total) * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// الصفحة الرئيسية
// ============================================
export default async function ReportsPage() {
  const data = await getReportsData();

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 التقارير والإحصائيات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            نظرة تحليلية شاملة لأداء المنصة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <Printer className="w-4 h-4" />
            طباعة
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي المستخدمين"
          value={data.totalUsers}
          icon={Users}
          color="bg-blue-500"
          change={`+${data.newUsers} جديد`}
          changeType="up"
        />
        <StatCard
          title="الوكالات"
          value={data.totalAgencies}
          icon={Building}
          color="bg-green-500"
        />
        <StatCard
          title="العقارات"
          value={data.totalProperties}
          icon={Home}
          color="bg-purple-500"
          change={`+${data.newProperties} جديدة`}
          changeType="up"
        />
        <StatCard
          title="الاشتراكات النشطة"
          value={data.activeSubscriptions}
          icon={CreditCard}
          color="bg-yellow-500"
        />
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المشاهدات</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {data.totalViews.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">معدل النمو</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +{data.totalUsers > 0 ? ((data.newUsers / data.totalUsers) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">نسبة التحويل</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {data.totalUsers > 0 ? ((data.activeSubscriptions / data.totalUsers) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المستخدمين حسب الدور */}
        <ChartCard title="👤 المستخدمين حسب الدور">
          <PieChartCard data={data.usersByRole} label="role" />
        </ChartCard>

        {/* العقارات حسب الحالة */}
        <ChartCard title="🏠 العقارات حسب الحالة">
          <PieChartCard data={data.propertiesByStatus} label="status" />
        </ChartCard>

        {/* العقارات حسب الغرض */}
        <ChartCard title="📋 العقارات حسب الغرض">
          <PieChartCard data={data.propertiesByPurpose} label="purpose" />
        </ChartCard>

        {/* الاشتراكات حسب الخطة */}
        <ChartCard title="💳 الاشتراكات حسب الخطة">
          <PieChartCard data={data.subscriptionsByPlan} label="planName" />
        </ChartCard>
      </div>

      {/* النشاط اليومي */}
      <div className="mt-6">
        <ChartCard title="📈 النشاط اليومي (آخر 7 أيام)">
          <BarChart data={data.dailyActivity} label="date" />
        </ChartCard>
      </div>

      {/* ملاحظة */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              📌 ملاحظة
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              يتم تحديث هذه الإحصائيات تلقائياً من قاعدة البيانات. جميع الأرقام حية وفعلية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}