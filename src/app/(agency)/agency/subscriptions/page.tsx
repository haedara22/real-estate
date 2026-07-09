// src/app/agency/subscriptions/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface SubscriptionData {
  subscriptions: any[];
  activeSubscription: any;
  currentUsage: {
    totalProperties: number;
    totalImages: number;
    featuredProperties: number;
  };
  pendingRequests: any[];
  availablePlans: any[];
  agencyId: string | null;
}

export default function AgencySubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // ✅ دالة جلب البيانات مع منع الكاش
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setUpdating(true);
    }
    
    try {
      setError(null);
      const response = await fetch('/api/agency/subscriptions?_=' + Date.now());
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ فشل جلب البيانات:', error);
      setError('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, []);

  // ✅ جلب البيانات الأولية
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData(true);
    }
  }, [status, fetchData]);

  // ✅ تحديث عند العودة للصفحة
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, fetchData]);

  // ✅ التحقق من إمكانية إضافة عقار
  const canAddProperty = () => {
    if (!data?.activeSubscription) return false;
    const max = data.activeSubscription.planMaxProperties;
    const used = data.currentUsage.totalProperties;
    if (max === 0 || max === null) return true;
    return used < max;
  };

  // ✅ التحقق من إمكانية إضافة صورة
  const canAddImage = () => {
    if (!data?.activeSubscription) return false;
    const max = data.activeSubscription.planMaxImages;
    const used = data.currentUsage.totalImages;
    if (max === 0 || max === null) return true;
    return used < max;
  };

  // ✅ التحقق من إمكانية تمييز عقار
  const canFeatureProperty = () => {
    if (!data?.activeSubscription) return false;
    const max = data.activeSubscription.planMaxFeatured;
    const used = data.currentUsage.featuredProperties;
    if (max === 0 || max === null) return true;
    return used < max;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الاشتراكات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-2xl">🔒 يرجى تسجيل الدخول</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="text-2xl">❌ لا توجد بيانات</div>
      </div>
    );
  }

  const { activeSubscription, currentUsage, pendingRequests, subscriptions, availablePlans } = data;

  // ✅ حساب النسبة المئوية
  const calculatePercentage = (used: number, max: number | null | undefined) => {
    if (!max || max === 0) return 0;
    return Math.min(Math.round((used / max) * 100), 100);
  };

  const getMaxValue = (value: number | null | undefined): number => {
    return value ?? 0;
  };

  const getRemainingText = (used: number, max: number | null | undefined, label: string) => {
    if (!max || max === 0) return 'غير محدود';
    const remaining = max - used;
    if (remaining <= 0) return '⚠️ تم الوصول للحد الأقصى';
    return `المتبقي: ${remaining} ${label}`;
  };

  // ✅ حساب نسبة الاستخدام الكلية
  const totalUsed = currentUsage.totalProperties + currentUsage.totalImages + currentUsage.featuredProperties;
  const totalMax = (activeSubscription?.planMaxProperties || 1) + 
                   (activeSubscription?.planMaxImages || 1) + 
                   (activeSubscription?.planMaxFeatured || 1);
  const overallPercentage = Math.min(Math.round((totalUsed / totalMax) * 100), 100);

  // ✅ تحديد لون شريط التقدم
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* ✅ رأس الصفحة المحترف */}
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span>💳</span> اشتراكات الوكالة
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${updating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
              {updating ? 'جاري التحديث...' : `آخر تحديث: ${format(lastUpdated, 'hh:mm:ss a', { locale: ar })}`}
              {error && <span className="text-red-500">⚠️ {error}</span>}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => fetchData(false)}
              disabled={updating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <span className={updating ? 'animate-spin' : ''}>🔄</span> 
              {updating ? 'جاري التحديث...' : 'تحديث'}
            </button>
            <a
              href="/subscription/plans"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              🚀 عرض الخطط
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* ✅ طلبات معلقة */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">⏳ طلبات اشتراك معلقة</h3>
          <p className="text-yellow-700 text-sm">
            لديك {pendingRequests.length} طلب قيد المراجعة
          </p>
        </div>
      )}

      {/* ✅ الاشتراك النشط */}
      {activeSubscription ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-green-800 flex items-center gap-2">
                <span>✅</span> اشتراك نشط
              </h2>
              <p className="text-sm text-green-700">
                {activeSubscription.planName} • {activeSubscription.planPrice} شام كاش / {activeSubscription.interval}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              activeSubscription.autoRenew 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {activeSubscription.autoRenew ? '🔄 تجديد تلقائي' : '⏸️ بدون تجديد'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-600 text-xs">تاريخ البدء</p>
              <p className="font-medium">
                {format(new Date(activeSubscription.startDate), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">تاريخ الانتهاء</p>
              <p className="font-medium">
                {activeSubscription.endDate 
                  ? format(new Date(activeSubscription.endDate), 'dd/MM/yyyy')
                  : 'غير محدد'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">المدة المتبقية</p>
              <p className="font-medium text-green-600">
                {activeSubscription.endDate 
                  ? `${Math.max(0, Math.ceil((new Date(activeSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} يوم`
                  : 'غير محدد'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">نسبة الاستخدام</p>
              <p className="font-medium text-blue-600">{overallPercentage}%</p>
            </div>
          </div>

          {/* ✅ الاستخدام والمتبقي */}
          <div className="mt-6 pt-6 border-t border-green-200">
            <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
              <span>📊</span> استخدام الباقة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* العقارات */}
              <div className={`bg-white rounded-xl p-4 shadow-sm transition ${canAddProperty() ? '' : 'border-2 border-red-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm text-gray-600">🏠 العقارات</p>
                    <p className="text-xs text-gray-400">الحد الأقصى</p>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${canAddProperty() ? 'text-blue-600' : 'text-red-600'}`}>
                      {currentUsage.totalProperties}
                      <span className="text-sm font-normal text-gray-400"> / {activeSubscription.planMaxProperties || '∞'}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ${
                      canAddProperty() ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${calculatePercentage(
                        currentUsage.totalProperties, 
                        activeSubscription.planMaxProperties
                      )}%` 
                    }}
                  ></div>
                </div>
                <p className={`text-xs mt-2 text-center ${canAddProperty() ? 'text-gray-500' : 'text-red-600 font-semibold'}`}>
                  {canAddProperty() 
                    ? getRemainingText(currentUsage.totalProperties, activeSubscription.planMaxProperties, 'عقار')
                    : '🚫 تم الوصول للحد الأقصى للعقارات'
                  }
                </p>
              </div>

              {/* الصور */}
              <div className={`bg-white rounded-xl p-4 shadow-sm transition ${canAddImage() ? '' : 'border-2 border-red-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm text-gray-600">🖼️ الصور</p>
                    <p className="text-xs text-gray-400">الحد الأقصى</p>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${canAddImage() ? 'text-blue-600' : 'text-red-600'}`}>
                      {currentUsage.totalImages}
                      <span className="text-sm font-normal text-gray-400"> / {activeSubscription.planMaxImages}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ${
                      canAddImage() ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${calculatePercentage(
                        currentUsage.totalImages, 
                        activeSubscription.planMaxImages
                      )}%` 
                    }}
                  ></div>
                </div>
                <p className={`text-xs mt-2 text-center ${canAddImage() ? 'text-gray-500' : 'text-red-600 font-semibold'}`}>
                  {canAddImage() 
                    ? getRemainingText(currentUsage.totalImages, activeSubscription.planMaxImages, 'صورة')
                    : '🚫 تم الوصول للحد الأقصى للصور'
                  }
                </p>
              </div>

              {/* العقارات المميزة */}
              <div className={`bg-white rounded-xl p-4 shadow-sm transition ${canFeatureProperty() ? '' : 'border-2 border-red-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm text-gray-600">⭐ عقارات مميزة</p>
                    <p className="text-xs text-gray-400">الحد الأقصى</p>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-bold ${canFeatureProperty() ? 'text-blue-600' : 'text-red-600'}`}>
                      {currentUsage.featuredProperties}
                      <span className="text-sm font-normal text-gray-400"> / {activeSubscription.planMaxFeatured}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ${
                      canFeatureProperty() ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${calculatePercentage(
                        currentUsage.featuredProperties, 
                        activeSubscription.planMaxFeatured
                      )}%` 
                    }}
                  ></div>
                </div>
                <p className={`text-xs mt-2 text-center ${canFeatureProperty() ? 'text-gray-500' : 'text-red-600 font-semibold'}`}>
                  {canFeatureProperty() 
                    ? getRemainingText(currentUsage.featuredProperties, activeSubscription.planMaxFeatured, 'عقار مميز')
                    : '🚫 تم الوصول للحد الأقصى للعقارات المميزة'
                  }
                </p>
              </div>
            </div>

            {/* ✅ شريط التقدم الكلي */}
            <div className="mt-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">📈 نسبة استخدام الباقة الإجمالية</span>
                <span className="text-sm font-bold">{overallPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(overallPercentage)}`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-2 text-center ${
                overallPercentage >= 90 ? 'text-red-600' :
                overallPercentage >= 70 ? 'text-yellow-600' :
                'text-gray-400'
              }`}>
                {overallPercentage >= 90 ? '⚠️ الباقة قاربت على الانتهاء، فكر في الترقية' :
                 overallPercentage >= 70 ? '⚡ استخدام مرتفع، قد تحتاج للترقية قريباً' :
                 '✅ استخدام جيد، استمر في إضافة عقاراتك'}
              </p>
            </div>

            {/* ✅ تحذير إذا تم تجاوز الحد */}
            {(!canAddProperty() || !canAddImage() || !canFeatureProperty()) && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <h4 className="font-bold text-red-700">لقد تجاوزت حدود باقاتك!</h4>
                    <p className="text-sm text-red-600">
                      {!canAddProperty() && '🚫 لا يمكنك إضافة عقارات جديدة. '}
                      {!canAddImage() && '🚫 لا يمكنك إضافة صور جديدة. '}
                      {!canFeatureProperty() && '🚫 لا يمكنك تمييز عقارات جديدة. '}
                      <br />
                      <span className="font-semibold">يرجى ترقية خطتك أو الانتظار حتى تجديد الاشتراك.</span>
                    </p>
                    <a
                      href="/subscription/plans"
                      className="inline-block mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      🚀 ترقية الخطة الآن
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* مميزات الخطة */}
          {activeSubscription.planFeatures && activeSubscription.planFeatures.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-gray-600 mb-2">✨ مميزات الخطة:</p>
              <ul className="flex flex-wrap gap-2">
                {activeSubscription.planFeatures.map((feature: string, index: number) => (
                  <li key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600">ليس لديك اشتراك نشط</p>
          <p className="text-sm text-gray-400 mt-2">لا يمكنك إضافة عقارات بدون اشتراك نشط</p>
          <a
            href="/subscription/plans"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            اختر خطة الآن
          </a>
        </div>
      )}

      {/* جدول الاشتراكات السابقة */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">📜 سجل الاشتراكات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الخطة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ البداية</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ النهاية</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التجديد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{sub.planName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' :
                        sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status === 'active' ? 'نشط' :
                         sub.status === 'pending' ? 'قيد المراجعة' :
                         sub.status === 'expired' ? 'منتهي' : 'ملغي'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(sub.startDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sub.endDate ? format(new Date(sub.endDate), 'dd/MM/yyyy') : '---'}
                    </td>
                    <td className="px-4 py-3">{sub.planPrice} شام كاش</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${sub.autoRenew ? 'text-green-600' : 'text-gray-500'}`}>
                        {sub.autoRenew ? '✅ مفعل' : '❌ غير مفعل'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* خطط الترقية - تظهر فقط إذا كان هناك اشتراك نشط أو لا */}
      {availablePlans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">🚀 خطط الترقية المتاحة</h2>
            <p className="text-sm text-gray-500">اختر الخطة المناسبة لاحتياجاتك</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.map((plan: any) => {
              const isCurrentPlan = activeSubscription?.planId === plan.id;
              return (
                <div 
                  key={plan.id} 
                  className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition ${
                    isCurrentPlan ? 'border-green-500 ring-2 ring-green-200 bg-green-50' :
                    plan.isFeatured ? 'border-blue-500 ring-2 ring-blue-200' : ''
                  }`}
                >
                  {isCurrentPlan && (
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full inline-block mb-2">
                      ✅ خطتك الحالية
                    </span>
                  )}
                  {plan.isFeatured && !isCurrentPlan && (
                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full inline-block mb-2">
                      ★ الأكثر طلباً
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{plan.nameAr}</h3>
                  <p className="text-3xl font-bold text-blue-600 my-4">
                    {plan.price} 
                    <span className="text-sm font-normal text-gray-500"> / {plan.interval}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">{plan.descriptionAr}</p>
                  
                  <ul className="space-y-2 text-sm mb-6">
                    <li>📋 {plan.maxProperties || 'غير محدود'} عقار</li>
                    <li>🖼️ {plan.maxImagesPerProperty} صورة لكل عقار</li>
                    <li>⭐ {plan.maxFeaturedProperties} عقار مميز</li>
                    {plan.hasAnalytics && <li>📊 تقارير تحليلية</li>}
                    {plan.hasPrioritySupport && <li>🎯 دعم مميز</li>}
                    {plan.hasMarketingBoost && <li>📈 ترويج تسويقي</li>}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                      ✅ خطة نشطة
                    </button>
                  ) : (
                    <form action="/api/subscriptions/request" method="POST">
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="amount" value={plan.price} />
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        اشترك الآن
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}