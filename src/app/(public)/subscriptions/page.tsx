"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock,
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  Crown,
  Star,
  Shield,
  Zap
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  planName: string;
  planNameAr: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: {
    name: string;
    nameAr: string;
    price: string;
    maxProperties: number;
    features: string[];
  };
}

export default function MySubscriptionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // جلب الاشتراكات
  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const response = await fetch("/api/subscriptions/my");
        const data = await response.json();
        
        if (response.ok) {
          setSubscriptions(data);
        } else {
          setError(data.error || "فشل في جلب الاشتراكات");
        }
      } catch (err) {
        setError("حدث خطأ في جلب الاشتراكات");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchSubscriptions();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscriptions");
    }
  }, [status, router]);

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string; icon: any }> = {
      active: { 
        label: "✅ نشط", 
        color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300",
        icon: CheckCircle
      },
      inactive: { 
        label: "⏸️ غير نشط", 
        color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
        icon: Clock
      },
      expired: { 
        label: "⏰ منتهي", 
        color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300",
        icon: XCircle
      },
      cancelled: { 
        label: "❌ ملغي", 
        color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
        icon: XCircle
      },
      pending: { 
        label: "⏳ قيد المراجعة", 
        color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
        icon: Clock
      },
    };
    return statuses[status] || statuses.inactive;
  };

 const getPlanIcon = (name: string) => {
  const icons: Record<string, any> = {
    Free: Shield,
    Basic: Star,
    Premium: Crown,
    Enterprise: Zap,
  };
  const Icon = icons[name] || CreditCard;
  return <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />;
};

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeSubscription = subscriptions.find(s => s.status === "active");
  const pendingSubscriptions = subscriptions.filter(s => s.status === "pending");
  const expiredSubscriptions = subscriptions.filter(s => s.status === "expired" || s.status === "cancelled");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* زر العودة */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة للرئيسية
        </Link>

        {/* العنوان */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            💳 اشتراكاتي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة اشتراكاتك وعرض تفاصيلها
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* الاشتراك النشط */}
        {activeSubscription && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-500 dark:border-green-400">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    {getPlanIcon(activeSubscription.plan?.name || "")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {activeSubscription.planNameAr}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      اشتراك نشط
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">السعر</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${activeSubscription.amount} / شهر
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ الانتهاء</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(activeSubscription.endDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">التجديد التلقائي</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {activeSubscription.autoRenew ? "مفعل" : "غير مفعل"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">عدد العقارات</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {activeSubscription.plan?.maxProperties === 999999 ? "♾️" : activeSubscription.plan?.maxProperties || 0}
                    </p>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold whitespace-nowrap">
                ✅ نشط
              </span>
            </div>
          </div>
        )}

        {/* طلبات قيد المراجعة */}
        {pendingSubscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              ⏳ طلبات قيد المراجعة
            </h3>
            <div className="space-y-3">
              {pendingSubscriptions.map((sub) => (
                <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-2 border-yellow-500 dark:border-yellow-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {sub.planNameAr}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ${sub.amount} / شهر
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-semibold">
                      ⏳ قيد المراجعة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الاشتراكات المنتهية */}
        {expiredSubscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              ⏰ الاشتراكات المنتهية
            </h3>
            <div className="space-y-3">
              {expiredSubscriptions.map((sub) => (
                <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border-2 border-gray-300 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {sub.planNameAr}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ${sub.amount} / شهر
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold">
                      ⏰ منتهي
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* لا يوجد اشتراكات */}
        {subscriptions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              لا يوجد اشتراكات
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              لم تقم بالاشتراك في أي خطة حتى الآن
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              استعراض الخطط
            </Link>
          </div>
        )}

        {/* زر الاشتراك في خطة جديدة */}
        {activeSubscription && (
          <div className="mt-6 text-center">
            <Link
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              🔄 تغيير الخطة
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}