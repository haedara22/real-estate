import { db } from "@/lib/db";
import { subscriptionRequests, subscriptionPlans, users, userSubscriptions } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Download,
  User,
  Calendar,
  DollarSign,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Shield,
  Star,
  Crown,
  Zap
} from "lucide-react";
import { AdminApproveButton, AdminRejectButton } from "./approve-button";

// ============================================
// جلب خطط الاشتراك
// ============================================
async function getSubscriptions() {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.displayOrder);

    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(userSubscriptions)
          .where(eq(userSubscriptions.planId, plan.id));

        return {
          ...plan,
          subscribers: Number(count[0]?.count || 0),
        };
      })
    );

    return plansWithCounts;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}

// ============================================
// جلب طلبات الاشتراك
// ============================================
async function getSubscriptionRequests() {
  try {
    const requests = await db
      .select({
        id: subscriptionRequests.id,
        status: subscriptionRequests.status,
        amount: subscriptionRequests.amount,
        currency: subscriptionRequests.currency,
        paymentProof: subscriptionRequests.paymentProof,
        notes: subscriptionRequests.notes,
        createdAt: subscriptionRequests.createdAt,
        userId: subscriptionRequests.userId,
        planId: subscriptionRequests.planId,
      })
      .from(subscriptionRequests)
      .orderBy(desc(subscriptionRequests.createdAt));

    const requestsWithDetails = await Promise.all(
      requests.map(async (req) => {
        // ✅ التحقق من userId قبل استخدام eq
        let user = null;
        if (req.userId) {
          const userResult = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, req.userId))
            .limit(1);
          user = userResult[0] || null;
        }

        let plan = null;
        if (req.planId) {
          const planResult = await db
            .select({ name: subscriptionPlans.name, nameAr: subscriptionPlans.nameAr })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, req.planId))
            .limit(1);
          plan = planResult[0] || null;
        }

        return {
          ...req,
          user: user,
          plan: plan,
        };
      })
    );

    return requestsWithDetails;
  } catch (error) {
    console.error("Error fetching subscription requests:", error);
    return [];
  }
}

// ============================================
// مكونات الصفحة
// ============================================

function getIcon(name: string) {
  const icons: Record<string, any> = {
    Free: Shield,
    Basic: Star,
    Premium: Crown,
    Enterprise: Zap,
  };
  return icons[name] || CreditCard;
}

function getColor(name: string) {
  const colors: Record<string, string> = {
    Free: "from-gray-400 to-gray-500",
    Basic: "from-blue-500 to-blue-600",
    Premium: "from-yellow-500 to-orange-500",
    Enterprise: "from-purple-500 to-pink-500",
  };
  return colors[name] || "from-gray-400 to-gray-500";
}

// ============================================
// الصفحة الرئيسية
// ============================================
export default async function AdminSubscriptionsPage() {
  const plans = await getSubscriptions();
  const requests = await getSubscriptionRequests();

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      pending: { label: "⏳ قيد المراجعة", color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" },
      approved: { label: "✅ موافق", color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300" },
      rejected: { label: "❌ مرفوض", color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300" },
      expired: { label: "⏰ منتهي", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" },
    };
    return statuses[status] || statuses.pending;
  };

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            💳 إدارة الاشتراكات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {plans.length} خطة اشتراك متاحة
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          خطة جديدة
        </button>
      </div>

      {/* بطاقات الخطط */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan) => {
          const Icon = getIcon(plan.name);
          
          return (
            <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className={`bg-gradient-to-r ${getColor(plan.name)} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <Icon className="w-8 h-8" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {plan.subscribers} مشترك
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-2">{plan.nameAr}</h3>
                <p className="text-sm text-white/80">{plan.descriptionAr}</p>
              </div>

              <div className="p-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/شهر</span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>الحد الأقصى للعقارات</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {plan.maxProperties === 999999 ? "♾️" : plan.maxProperties}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>الصور لكل عقار</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {plan.maxImagesPerProperty || 5}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تحليلات</span>
                    <span>{plan.hasAnalytics ? "✅" : "❌"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>دعم أولوية</span>
                    <span>{plan.hasPrioritySupport ? "✅" : "❌"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button className="flex-1 text-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                    <Edit className="w-4 h-4 inline ml-1" />
                    تعديل
                  </button>
                  <button className="flex-1 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                    <Trash2 className="w-4 h-4 inline ml-1" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* طلبات الاشتراك */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📋 طلبات الاشتراك
        </h2>
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600 dark:text-gray-400">لا توجد طلبات اشتراك حالياً</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المستخدم</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الخطة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">المبلغ</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">الحالة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">التاريخ</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((req) => {
                    const statusBadge = getStatusBadge(req.status);
                    
                    return (
                      <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {req.user?.name || "غير معروف"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {req.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {req.plan?.nameAr || "غير معروف"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${req.amount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {req.paymentProof && (
                              <a
                                href={req.paymentProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              >
                                <Eye className="w-4 h-4 text-gray-500" />
                              </a>
                            )}
                            {req.status === "pending" && req.userId && req.planId && (
                              <>
                                <AdminApproveButton 
                                  requestId={req.id} 
                                  userId={req.userId} 
                                  planId={req.planId} 
                                />
                                <AdminRejectButton requestId={req.id} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}