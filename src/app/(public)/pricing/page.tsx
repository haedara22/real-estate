import { db } from "@/lib/db";
import { subscriptionPlans, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { 
  Check, 
  Crown, 
  Star, 
  Sparkles, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  CreditCard,
  Building,
  Users,
  Infinity
} from "lucide-react";
import { desc, eq } from "drizzle-orm";

// ============================================
// جلب خطط الاشتراك من قاعدة البيانات
// ============================================
async function getPlans() {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.displayOrder);
    
    return plans;
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
}

// ============================================
// جلب خطة المستخدم الحالي
// ============================================
async function getUserPlan(userId: string) {
  try {
    const user = await db
      .select({
        planId: users.planId,
        planStatus: users.planStatus,
        planExpiresAt: users.planExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0 || !user[0].planId) {
      return null;
    }

    return user[0];
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return null;
  }
}

// ============================================
// مكونات الصفحة
// ============================================

// بطاقة الخطة
function PlanCard({ plan, isCurrent = false, isLoggedIn = false }: { 
  plan: any; 
  isCurrent?: boolean;
  isLoggedIn?: boolean;
}) {
  const price = new Intl.NumberFormat('ar-SY').format(Number(plan.price));
  const isFree = plan.price === "0";
  
  const getIcon = (name: string) => {
    const icons: Record<string, any> = {
      Free: <Shield className="w-8 h-8 text-gray-400" />,
      Basic: <Star className="w-8 h-8 text-blue-500" />,
      Premium: <Crown className="w-8 h-8 text-yellow-500" />,
      Enterprise: <Zap className="w-8 h-8 text-purple-500" />,
    };
    return icons[name] || <Shield className="w-8 h-8 text-gray-400" />;
  };

  const getColor = (name: string) => {
    const colors: Record<string, string> = {
      Free: "from-gray-400 to-gray-500",
      Basic: "from-blue-500 to-blue-600",
      Premium: "from-yellow-500 to-orange-500",
      Enterprise: "from-purple-500 to-pink-500",
    };
    return colors[name] || "from-gray-400 to-gray-500";
  };

  const getBadge = (name: string) => {
    const badges: Record<string, string> = {
      Free: "🆓 مجانية",
      Basic: "الأكثر مبيعاً",
      Premium: "الأكثر شعبية",
      Enterprise: "أفضل قيمة",
    };
    return badges[name] || "";
  };

  const features = plan.featuresAr || plan.features || [];

  const getSubscribeLink = () => {
    if (isFree) return "#";
    if (isCurrent) return "#";
    if (!isLoggedIn) return `/login?callbackUrl=/subscribe?plan=${plan.id}`;
    return `/subscribe?plan=${plan.id}`;
  };

  const getButtonText = () => {
    if (isFree) return "✅ مفعلة";
    if (isCurrent) return "✅ اشتراك حالي";
    if (!isLoggedIn) return "سجل دخول للاشتراك";
    return "اشتراك";
  };

  const getButtonStyle = () => {
    if (isFree || isCurrent) {
      return "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-default";
    }
    if (plan.name === "Premium") {
      return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg";
    }
    return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        plan.isFeatured ? "ring-2 ring-yellow-500" : ""
      } ${isCurrent ? "ring-2 ring-green-500" : ""}`}
    >
      {isFree && !isCurrent && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs font-bold py-1 text-center">
          🆓 مفعلة تلقائياً - لا تحتاج دفع
        </div>
      )}

      {getBadge(plan.name) && !isFree && !isCurrent && (
        <div className={`absolute top-0 left-0 right-0 text-white text-xs font-bold py-1 text-center ${
          plan.name === "Basic" ? "bg-blue-500" :
          plan.name === "Premium" ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
          plan.name === "Enterprise" ? "bg-gradient-to-r from-purple-500 to-pink-500" :
          "bg-gray-400"
        }`}>
          {getBadge(plan.name)}
        </div>
      )}

      {isCurrent && !isFree && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs font-bold py-1 text-center">
          ✅ خطتك الحالية
        </div>
      )}

      <div className={`p-6 ${
        (getBadge(plan.name) || isCurrent || isFree) ? "pt-8" : ""
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`bg-gradient-to-r ${getColor(plan.name)} rounded-xl p-2 text-white`}>
            {getIcon(plan.name)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {plan.nameAr}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {plan.descriptionAr}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              ${price}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/ شهرياً</span>
          </div>
          {isFree ? (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              🆓 مجاني مدى الحياة
            </p>
          ) : (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              وفر 20% مع الاشتراك السنوي
            </p>
          )}
        </div>

        <div className="space-y-2.5 mb-6">
          {features.map((feature: string, index: number) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        <Link
          href={getSubscribeLink()}
          className={`block w-full text-center py-3 rounded-lg font-semibold transition ${getButtonStyle()}`}
        >
          {getButtonText()}
        </Link>

        {isFree && !isCurrent && (
          <p className="text-xs text-center text-blue-500 dark:text-blue-400 mt-3">
            🔓 مفعلة بشكل افتراضي - لا تحتاج إلى تفعيل
          </p>
        )}
        {!isFree && !isCurrent && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
            يمكنك الإلغاء في أي وقت
          </p>
        )}
        {isCurrent && !isFree && (
          <p className="text-xs text-center text-green-500 dark:text-green-400 mt-3">
            ✅ اشتراكك نشط حتى {new Date().toLocaleDateString('ar-SA')}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// الصفحة الرئيسية
// ============================================
export default async function PricingPage() {
  const session = await auth();
  const plans = await getPlans();
  
  let userPlan = null;
  let isLoggedIn = false;
  
  if (session?.user?.id) {
    isLoggedIn = true;
    userPlan = await getUserPlan(session.user.id);
  }

  const currentPlanId = userPlan?.planId || null;

  const freePlan = plans.find(p => p.name === "Free");
  const paidPlans = plans.filter(p => p.name !== "Free").sort((a, b) => Number(a.price) - Number(b.price));
  
  const sortedPlans = [
    ...(freePlan ? [freePlan] : []),
    ...paidPlans,
  ];

  // ✅ تعريف الميزات مع أنواع صحيحة
  const featureConfigs = [
    { 
      key: "maxProperties" as const, 
      label: "عدد العقارات",
      format: (v: unknown) => {
        const num = Number(v);
        return num >= 999999 ? "♾️ غير محدود" : num;
      }
    },
    { 
      key: "maxImagesPerProperty" as const, 
      label: "الصور لكل عقار",
      format: (v: unknown) => {
        const num = Number(v);
        return num >= 999 ? "♾️ غير محدود" : num;
      }
    },
    { 
      key: "maxFeaturedProperties" as const, 
      label: "عقارات مميزة",
      format: (v: unknown) => Number(v)
    },
    { 
      key: "hasAnalytics" as const, 
      label: "تحليلات أساسية",
      format: (v: unknown) => v ? "✅" : "❌"
    },
    { 
      key: "hasPrioritySupport" as const, 
      label: "دعم أولوية",
      format: (v: unknown) => v ? "✅" : "❌"
    },
    { 
      key: "hasAdvancedAnalytics" as const, 
      label: "تحليلات متقدمة",
      format: (v: unknown) => v ? "✅" : "❌"
    },
    { 
      key: "hasDedicatedSupport" as const, 
      label: "دعم مخصص",
      format: (v: unknown) => v ? "✅" : "❌"
    },
    { 
      key: "hasMarketingBoost" as const, 
      label: "تسويق مميز",
      format: (v: unknown) => v ? "✅" : "❌"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            خطط تناسب احتياجاتك
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            اختر الخطة المناسبة لك
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            خطط مرنة تناسب الأفراد والوكالات العقارية مع مزايا حصرية
          </p>
          {isLoggedIn && userPlan && (
            <div className="mt-4 inline-block bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg text-sm">
              ✅ خطتك الحالية: <span className="font-bold">{userPlan.planStatus === "active" ? "نشطة" : "منتهية"}</span>
              {userPlan.planExpiresAt && (
                <span className="mr-2">
                  - تنتهي في {new Date(userPlan.planExpiresAt).toLocaleDateString('ar-SA')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* بطاقات الخطط */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {sortedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlanId}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>

        {/* جدول المقارنة */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 مقارنة الميزات
            </h2>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    الميزة
                  </th>
                  {sortedPlans.map((plan) => (
                    <th key={plan.id} className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      <div>{plan.nameAr}</div>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        ${plan.price}/شهر
                      </div>
                      {plan.id === currentPlanId && (
                        <span className="text-xs text-green-500">✓ نشط</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureConfigs.map((feature) => (
                  <tr key={feature.key} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="text-right py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {feature.label}
                    </td>
                    {sortedPlans.map((plan) => {
                      const value = plan[feature.key];
                      return (
                        <td key={plan.id} className="text-center py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                          {feature.format(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            ❓ أسئلة شائعة عن الخطط
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: "هل يمكنني تغيير خطتي في أي وقت؟",
                a: "نعم، يمكنك تغيير خطتك في أي وقت من خلال لوحة التحكم. سيتم تطبيق التغييرات في بداية الشهر التالي.",
              },
              {
                q: "هل الخطة المجانية تتطلب تفعيل؟",
                a: "لا، الخطة المجانية مفعلة تلقائياً عند إنشاء الحساب، ولا تحتاج إلى أي إجراء إضافي.",
              },
              {
                q: "ما هي طرق الدفع المتاحة؟",
                a: "نقبل جميع بطاقات الائتمان والدفع الإلكتروني، بالإضافة إلى التحويل البنكي للوكالات.",
              },
              {
                q: "كيف يمكنني ترقية خطتي؟",
                a: "يمكنك ترقية خطتك من خلال صفحة الخطط أو من لوحة التحكم، ببساطة اختر الخطة المناسبة واتبع التعليمات.",
              },
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {item.q}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              🚀 ابدأ رحلتك العقارية اليوم
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              انضم إلى آلاف المستخدمين والوكالات الذين يثقون بمنصتنا
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={isLoggedIn ? "/subscribe" : "/register"}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                {isLoggedIn ? "اشترك الآن" : "ابدأ الآن مجاناً"}
              </Link>
              <Link
                href="/contact"
                className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
              >
                تواصل مع المبيعات
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}