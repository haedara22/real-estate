"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Crown, 
  Star, 
  Calendar,
  CreditCard,
  ArrowUpCircle,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface UserPlan {
  id: string;
  name: string;
  nameAr: string;
  price: string;
  maxProperties: number;
  features: string[];
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<UserPlan[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // جلب خطة المستخدم والخطط المتاحة
  useEffect(() => {
    async function fetchPlans() {
      try {
        // جلب خطة المستخدم
        const userRes = await fetch("/api/users/plan");
        const userData = await userRes.json();
        if (userRes.ok) {
          setUserPlan(userData.plan);
        }

        // جلب جميع الخطط
        const plansRes = await fetch("/api/subscriptions/plans");
        const plansData = await plansRes.json();
        if (plansRes.ok) {
          setAvailablePlans(plansData);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    }
    fetchPlans();
  }, []);

  // ✅ ترقية الخطة - إصلاح مشكلة window.location
  const upgradePlan = async (planId: string) => {
    setUpgrading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في الترقية");
      }

      setMessage({ type: 'success', text: '✅ تم ترقية الخطة بنجاح!' });
      await update(); // تحديث الجلسة
      
      // ✅ استخدام router.refresh() بدلاً من window.location.reload()
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      });
    } finally {
      setUpgrading(false);
    }
  };

  // ✅ التحقق من الجلسة
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              👤 الملف الشخصي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة معلوماتك واشتراكاتك
            </p>
          </div>
          <Link
            href="/settings"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
          >
            تعديل الملف
          </Link>
        </div>

        {/* معلومات المستخدم */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {session.user?.name?.[0] || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {session.user?.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {session.user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  {session.user?.role === "admin" ? "مدير" :
                   session.user?.role === "agency_owner" ? "مالك وكالة" :
                   session.user?.role === "agency_staff" ? "موظف وكالة" :
                   "مستخدم"}
                </span>
                {userPlan && (
                  <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {userPlan.nameAr}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* حالة الاشتراك */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            حالة الاشتراك
          </h3>

          {userPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">الخطة الحالية</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {userPlan.nameAr}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${userPlan.price}/شهر
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">العقارات المسموحة</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {userPlan.maxProperties === 999999 ? "♾️" : userPlan.maxProperties}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">الحالة</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  نشط
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">ليس لديك اشتراك نشط</p>
          )}
        </div>

        {/* ترقية الخطة */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-blue-600" />
            ترقية الخطة
          </h3>

          {message && (
            <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                message.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans
              .filter(plan => plan.id !== userPlan?.id)
              .map((plan) => (
                <div 
                  key={plan.id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-500 transition"
                >
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {plan.nameAr}
                  </h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/شهر</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {plan.maxProperties === 999999 ? "♾️" : plan.maxProperties} عقار
                  </p>
                  <button
                    onClick={() => upgradePlan(plan.id)}
                    disabled={upgrading}
                    className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري...
                      </>
                    ) : (
                      "ترقية"
                    )}
                  </button>
                </div>
              ))}
          </div>

          {availablePlans.filter(p => p.id !== userPlan?.id).length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              🎉 أنت مشترك في أفضل خطة متاحة!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}