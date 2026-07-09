// src/app/(agency)/agency/dashboard/DashboardClient.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Building, 
  Home, 
  Users, 
  CreditCard, 
  Eye,
  PlusCircle,
  ChevronRight,
  Star,
  CheckCircle,
  Settings
} from "lucide-react";

interface DashboardClientProps {
  initialData: any;
}

// ✅ دالة تنسيق السعر بالدولار
const formatPrice = (price: number | string | null): string => {
  if (!price) return 'السعر غير محدد';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(price));
};

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data] = useState(initialData);

  const { agency, propertiesCount, staffCount, viewsCount, isSubscriptionActive, planName, recentProperties } = data;

  const stats = [
    {
      title: "العقارات",
      value: propertiesCount,
      icon: Home,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      trend: "+12%",
    },
    {
      title: "المشاهدات",
      value: viewsCount,
      icon: Eye,
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400",
      trend: "+23%",
    },
    {
      title: "الاشتراك",
      value: isSubscriptionActive ? `${planName}` : "غير نشط",
      icon: CreditCard,
      color: isSubscriptionActive ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
      bg: isSubscriptionActive ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20",
      text: isSubscriptionActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      trend: isSubscriptionActive ? "✅ نشط" : "❌ غير نشط",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ✅ رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            📊 لوحة تحكم الوكالة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{agency.name}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>مرحباً بعودتك</span>
            {isSubscriptionActive && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                اشتراك {planName} نشط
              </span>
            )}
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-sm whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة عقار
        </Link>
      </div>

      {/* ✅ بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-5 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.trend}
                  </p>
                </div>
                <div className={`${stat.bg} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.text}`} />
                </div>
              </div>
              <div className={`mt-3 h-1 w-full rounded-full bg-gradient-to-r ${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
            </div>
          );
        })}
      </div>

      {/* ✅ معلومات الوكالة */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6 transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
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
              agency.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {agency.name}
              </h2>
              {agency.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  موثقة
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {agency.address || "لا يوجد عنوان"}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {agency.rating && (
                <span className="inline-flex items-center gap-1 text-sm text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  {Number(agency.rating).toFixed(1)}
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                agency.isActive ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}>
                {agency.isActive ? "🟢 نشطة" : "🔴 غير نشطة"}
              </span>
            </div>
          </div>
          <Link
            href="/agency/settings"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 whitespace-nowrap"
          >
            تعديل
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ✅ آخر العقارات - مع العملة بالدولار */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🏠 آخر العقارات
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                {recentProperties.length}
              </span>
            </h3>
          </div>
          <Link
            href="/agency/properties"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 whitespace-nowrap"
          >
            عرض الكل
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentProperties.map((property: any) => (
              <Link
                key={property.id}
                href={`/properties/${property.slug}`}
                className="group block p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {property.title}
                    </p>
                    {/* ✅ السعر بالدولار */}
                    <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                      {formatPrice(property.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        property.status === "active" 
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" 
                          : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                      }`}>
                        {property.status === "active" ? "✅ نشط" : "⏳ قيد المراجعة"}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(property.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🏗️</div>
            <p className="text-gray-500 dark:text-gray-400">
              لا توجد عقارات مضافة بعد
            </p>
            <Link
              href="/properties/new"
              className="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
            >
              أضف عقارك الأول
            </Link>
          </div>
        )}
      </div>

      {/* ✅ شريط الإجراءات السريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          icon={Home}
          label="عقاراتي"
          href="/agency/properties"
          color="blue"
        />
        <QuickAction
          icon={CreditCard}
          label="الاشتراكات"
          href="/agency/subscriptions"
          color="purple"
        />
        <QuickAction
          icon={Settings}
          label="الإعدادات"
          href="/agency/settings"
          color="gray"
        />
      </div>
    </div>
  );
}

// ✅ مكون الإجراءات السريعة
function QuickAction({ icon: Icon, label, href, color }: any) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30",
    gray: "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${colors[color as keyof typeof colors]}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}