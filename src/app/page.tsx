// src/app/page.tsx

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { properties, propertyImages, cities, agencies } from "@/lib/db/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

// ============================================
// أنواع البيانات
// ============================================
interface PropertyWithImage {
  id: string;
  title: string;
  slug: string;
  price: string | null;
  purpose: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  isFeatured: boolean;
  viewsCount: number;
  createdAt: Date;
  image: string;
  cityName: string | null;
  agencyName: string | null;
}

// ============================================
// دوال جلب البيانات
// ============================================

/**
 * جلب العقارات مع الصور والمدن والوكالات
 */
async function getProperties(): Promise<PropertyWithImage[]> {
  try {
    // ✅ 1. جلب العقارات
    const allProperties = await db
      .select()
      .from(properties)
      .orderBy(desc(properties.createdAt))
      .limit(12);

    if (allProperties.length === 0) return [];

    // ✅ 2. جلب الصور دفعة واحدة
    const propertyIds = allProperties.map((p) => p.id);
    const allImages = await db
      .select({
        propertyId: propertyImages.propertyId,
        url: propertyImages.url,
        isMain: propertyImages.isMain,
      })
      .from(propertyImages)
      .where(inArray(propertyImages.propertyId, propertyIds));

    // ✅ 3. تجميع الصور في Map
    const imagesMap: Record<string, string> = {};
    allImages.forEach((img) => {
      if (img.propertyId) {
        if (img.isMain || !imagesMap[img.propertyId]) {
          imagesMap[img.propertyId] = img.url;
        }
      }
    });

    // ✅ 4. جلب المدن دفعة واحدة
    const cityIds = allProperties
      .map((p) => p.cityId)
      .filter((id): id is string => id !== null);

    let citiesMap: Record<string, string> = {};
    if (cityIds.length > 0) {
      const allCities = await db
        .select({
          id: cities.id,
          nameAr: cities.nameAr,
        })
        .from(cities)
        .where(inArray(cities.id, cityIds));

      citiesMap = {};
      allCities.forEach((c) => {
        if (c.id) {
          citiesMap[c.id] = c.nameAr;
        }
      });
    }

    // ✅ 5. جلب الوكالات دفعة واحدة
    const agencyIds = allProperties
      .map((p) => p.agencyId)
      .filter((id): id is string => id !== null);

    let agenciesMap: Record<string, string> = {};
    if (agencyIds.length > 0) {
      const allAgencies = await db
        .select({
          id: agencies.id,
          name: agencies.name,
        })
        .from(agencies)
        .where(inArray(agencies.id, agencyIds));

      agenciesMap = {};
      allAgencies.forEach((a) => {
        if (a.id) {
          agenciesMap[a.id] = a.name;
        }
      });
    }

    // ✅ 6. دمج البيانات مع تحويل القيم null
    return allProperties.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      purpose: p.purpose,
      type: p.type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      isFeatured: p.isFeatured ?? false,     // ✅ تحويل null إلى false
      viewsCount: p.viewsCount ?? 0,          // ✅ تحويل null إلى 0
      createdAt: p.createdAt,
      image: imagesMap[p.id] || "/images/placeholder.jpg",
      cityName: p.cityId ? citiesMap[p.cityId] || null : null,
      agencyName: p.agencyId ? agenciesMap[p.agencyId] || null : null,
    }));
  } catch (error) {
    console.error("❌ Error fetching properties:", error);
    return [];
  }
}

/**
 * جلب إحصائيات الموقع
 */
async function getStats() {
  try {
    const [propertiesCount, agenciesCount] = await Promise.all([
      db.select({ count: count() }).from(properties),
      db.select({ count: count() }).from(agencies).where(eq(agencies.isActive, true)),
    ]);

    return {
      properties: Number(propertiesCount[0]?.count || 0),
      agencies: Number(agenciesCount[0]?.count || 0),
    };
  } catch {
    return { properties: 0, agencies: 0 };
  }
}

// ============================================
// المكونات
// ============================================

/**
 * مكون بطاقة العقار
 */
function PropertyCard({ property }: { property: PropertyWithImage }) {
  const price = property.price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(property.price))
    : "السعر غير محدد";

  const purposeLabel = property.purpose === "sale" ? "للبيع" : "للإيجار";
  const purposeColor = property.purpose === "sale" ? "bg-green-500" : "bg-blue-500";

  return (
    <Link href={`/properties/${property.slug}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
          <Image
            src={property.image}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {property.isFeatured && (
            <span className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              ⭐ مميز
            </span>
          )}

          <span
            className={`absolute bottom-3 right-3 ${purposeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}
          >
            {purposeLabel}
          </span>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1 group-hover:text-blue-600 transition">
            {property.title}
          </h3>

          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
            {property.bedrooms && (
              <span className="flex items-center gap-0.5">🛏️ {property.bedrooms}</span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-0.5">🚿 {property.bathrooms}</span>
            )}
            {property.area && (
              <span className="flex items-center gap-0.5">📐 {Number(property.area)}م²</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {price}
            </span>
            {property.cityName && (
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                📍 {property.cityName}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * مكون شبكة العقارات
 */
function PropertyGrid({ properties }: { properties: PropertyWithImage[] }) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">
          لا توجد عقارات
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          كن أول من يضيف عقاراً على المنصة
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

/**
 * مكون Skeleton للتحميل
 */
function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse">
      <div className="h-48 bg-gray-300 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  );
}

/**
 * مكون الإحصائيات
 */
function StatsSection({
  stats,
}: {
  stats: { properties: number; agencies: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
        <div className="text-3xl font-bold text-blue-600">{stats.properties}+</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">عقار</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
        <div className="text-3xl font-bold text-green-600">{stats.agencies}+</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">وكالة</div>
      </div>
    </div>
  );
}

// ============================================
// الصفحة الرئيسية
// ============================================

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAgency =
    session?.user?.role === "agency_owner" ||
    session?.user?.role === "agency_staff";
  const userName = session?.user?.name || "";

  const [properties, stats] = await Promise.all([getProperties(), getStats()]);

  const featured = properties.filter((p) => p.isFeatured);
  const regular = properties.filter((p) => !p.isFeatured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ✅ الهيدر الرئيسي */}
      <header className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isLoggedIn ? `👋 مرحباً ${userName}` : "🏠 سوريا للعقارات"}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            {isLoggedIn
              ? "استكشف أو أضف عقارك الجديد اليوم"
              : "ابحث عن منزلك المثالي في سوريا"}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link
              href="/properties"
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              🔍 استعراض العقارات
            </Link>
            {isLoggedIn && (
              <Link
                href="/properties/new"
                className="bg-blue-700/80 backdrop-blur text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition border border-white/20"
              >
                ➕ إضافة عقار
              </Link>
            )}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="bg-blue-700/80 backdrop-blur text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition border border-white/20"
              >
                🔑 تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ✅ إحصائيات سريعة */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <StatsSection stats={stats} />
      </div>

      {/* ✅ العقارات المميزة */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ⭐ مميزة
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                أفضل العقارات المختارة
              </p>
            </div>
            <Link
              href="/properties?featured=true"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              عرض الكل ←
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 4).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </Suspense>
        </section>
      )}

      {/* ✅ جميع العقارات */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🏠 جميع العقارات
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {properties.length} عقار متاح
            </p>
          </div>
          <Link
            href="/properties"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            عرض الكل ←
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <PropertyGrid properties={regular.slice(0, 8)} />
        </Suspense>
      </section>

      {/* ✅ دعوة للانضمام */}
      {(!isLoggedIn || !isAgency) && (
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">🏢 انضم كـ وكالة عقارية</h2>
            <p className="text-blue-100 mb-4">
              {!isLoggedIn
                ? "سجل حسابك الآن وابدأ في إدارة عقاراتك"
                : "قم بترقية حسابك إلى وكالة عقارية"}
            </p>
            <Link
              href={!isLoggedIn ? "/register" : "/agency/register"}
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg"
            >
              {!isLoggedIn ? "إنشاء حساب جديد" : "سجل وكالتك الآن"}
            </Link>
          </div>
        </section>
      )}

      {/* ✅ رسالة للوكلاء */}
      {isLoggedIn && isAgency && (
        <section className="bg-gradient-to-r from-green-600 to-teal-600 py-12">
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">
              🏢 مرحباً بك في لوحة الوكالة
            </h2>
            <p className="text-green-100 mb-4">
              يمكنك إدارة عقاراتك وفريقك من خلال لوحة التحكم
            </p>
            <Link
              href="/agency/dashboard"
              className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition shadow-lg"
            >
              📊 الذهاب إلى لوحة التحكم
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}