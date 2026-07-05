import { db } from "@/lib/db";
import { properties, propertyImages, cities, agencies, users } from "@/lib/db/schema";
import { eq, desc, sql, and, isNotNull, count } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

// ============================================
// أنواع البيانات
// ============================================
interface PropertyWithRelations {
  id: string;
  code: string;
  title: string;
  slug: string;
  description: string | null;
  price: string | null;
  purpose: string;
  type: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: string | null;
  isFeatured: boolean;
  viewsCount: number;
  favoritesCount: number;
  createdAt: Date;
  images: { url: string; isMain: boolean }[];
  city: { nameAr: string } | null;
  agency: { name: string; slug: string; logo: string | null } | null;
}

// ============================================
// دوال جلب البيانات المحسّنة
// ============================================

/**
 * جلب العقارات المميزة مع جميع العلاقات
 */
async function getFeaturedProperties(): Promise<PropertyWithRelations[]> {
  try {
    const result = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.isFeatured, true),
          eq(properties.status, 'active')
        )
      )
      .limit(8)
      .orderBy(desc(properties.createdAt));
    
    return await enrichPropertiesWithRelations(result);
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    return [];
  }
}

/**
 * جلب أحدث العقارات
 */
async function getLatestProperties(): Promise<PropertyWithRelations[]> {
  try {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.status, 'active'))
      .limit(8)
      .orderBy(desc(properties.createdAt));
    
    return await enrichPropertiesWithRelations(result);
  } catch (error) {
    console.error("Error fetching latest properties:", error);
    return [];
  }
}

/**
 * جلب العقارات الأكثر مشاهدة
 */
async function getMostViewedProperties(): Promise<PropertyWithRelations[]> {
  try {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.status, 'active'))
      .limit(6)
      .orderBy(desc(properties.viewsCount));
    
    return await enrichPropertiesWithRelations(result);
  } catch (error) {
    console.error("Error fetching most viewed properties:", error);
    return [];
  }
}

/**
 * إثراء العقارات بالعلاقات (الصور، المدينة، الوكالة)
 */
async function enrichPropertiesWithRelations(
  propertiesList: any[]
): Promise<PropertyWithRelations[]> {
  return await Promise.all(
    propertiesList.map(async (property) => {
      // جلب الصور
      const images = await db
        .select({ url: propertyImages.url, isMain: propertyImages.isMain })
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, property.id))
        .orderBy(desc(propertyImages.isMain))
        .limit(5);
      
      // جلب المدينة
      const city = property.cityId ? await db
        .select({ nameAr: cities.nameAr })
        .from(cities)
        .where(eq(cities.id, property.cityId))
        .limit(1) : null;
      
      // جلب الوكالة
      const agency = property.agencyId ? await db
        .select({ name: agencies.name, slug: agencies.slug, logo: agencies.logo })
        .from(agencies)
        .where(eq(agencies.id, property.agencyId))
        .limit(1) : null;
      
      return {
        ...property,
        images,
        city: city?.[0] || null,
        agency: agency?.[0] || null,
      };
    })
  );
}

/**
 * جلب إحصائيات الموقع
 */
async function getStats() {
  try {
    const [propertiesCount, agenciesCount, usersCount, featuredCount] = await Promise.all([
      db.select({ count: count() }).from(properties).where(eq(properties.status, 'active')),
      db.select({ count: count() }).from(agencies).where(eq(agencies.isActive, true)),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(properties).where(
        and(
          eq(properties.isFeatured, true),
          eq(properties.status, 'active')
        )
      ),
    ]);
    
    return {
      properties: Number(propertiesCount[0]?.count || 0),
      agencies: Number(agenciesCount[0]?.count || 0),
      users: Number(usersCount[0]?.count || 0),
      featured: Number(featuredCount[0]?.count || 0),
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { properties: 0, agencies: 0, users: 0, featured: 0 };
  }
}

// ============================================
// المكونات
// ============================================

/**
 * مكون بطاقة العقار الاحترافية
 */
function PropertyCard({ property }: { property: PropertyWithRelations }) {
  const mainImage = property.images.find(img => img.isMain)?.url || 
                     property.images[0]?.url || 
                     "/images/placeholder.jpg";
  
  const price = property.price 
    ? new Intl.NumberFormat('ar-SY', { 
        style: 'currency', 
        currency: 'SYP',
        maximumFractionDigits: 0 
      }).format(Number(property.price))
    : "السعر غير محدد";
  
  const purposeLabels = {
    sale: { label: "للبيع", color: "bg-green-500" },
    rent: { label: "للإيجار", color: "bg-blue-500" },
    both: { label: "للبيع والإيجار", color: "bg-purple-500" },
  };
  
  const purpose = purposeLabels[property.purpose as keyof typeof purposeLabels] || 
                   { label: property.purpose, color: "bg-gray-500" };

  return (
    <Link href={`/properties/${property.slug}`} className="block group">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
        {/* صورة العقار */}
        <div className="relative h-64 overflow-hidden bg-gray-200 dark:bg-gray-700">
          <Image
            src={mainImage}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Overlay للتدرج */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* شارة "مميز" */}
          {property.isFeatured && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <span>⭐</span> مميز
            </div>
          )}
          
          {/* شارة الحالة */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <span className={`${purpose.color} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm bg-opacity-90`}>
              {purpose.label}
            </span>
            {property.area && (
              <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                {Number(property.area)} م²
              </span>
            )}
          </div>
          
          {/* عدد المشاهدات */}
          <div className="absolute bottom-4 left-4 text-white/80 text-xs flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span>👁️</span> {property.viewsCount}
          </div>
        </div>
        
        {/* معلومات العقار */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">
              {property.title}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap mr-2">
              {new Date(property.createdAt).toLocaleDateString('ar-SA')}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {property.description || "لا يوجد وصف"}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <span>🛏️</span> {property.bedrooms}
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <span>🚿</span> {property.bathrooms}
              </span>
            )}
            {property.city && (
              <span className="flex items-center gap-1">
                <span>📍</span> {property.city.nameAr}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {price}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                {property.purpose === "rent" ? "/ شهرياً" : ""}
              </span>
            </div>
            
            {property.agency && (
              <div className="flex items-center gap-2">
                {property.agency.logo && (
                  <Image
                    src={property.agency.logo}
                    alt={property.agency.name}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {property.agency.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * مكون تحميل (Skeleton)
 */
function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse">
      <div className="h-64 bg-gray-300 dark:bg-gray-700" />
      <div className="p-5 space-y-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * مكون قسم العقارات
 */
function PropertySection({
  title,
  subtitle,
  properties,
  viewAllLink,
}: {
  title: string;
  subtitle?: string;
  properties: PropertyWithRelations[];
  viewAllLink?: string;
}) {
  if (properties.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* رأس القسم */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="mt-2 md:mt-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group"
            >
              عرض الكل
              <span className="group-hover:translate-x-1 transition-transform">←</span>
            </Link>
          )}
        </div>

        {/* شبكة العقارات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * مكون الإحصائيات
 */
function StatsSection({ stats }: { stats: Awaited<ReturnType<typeof getStats>> }) {
  const statItems = [
    {
      label: "عقار نشط",
      value: stats.properties,
      icon: "🏠",
      color: "blue",
    },
    {
      label: "وكالة معتمدة",
      value: stats.agencies,
      icon: "🏢",
      color: "green",
    },
    {
      label: "مستخدم نشط",
      value: stats.users,
      icon: "👤",
      color: "purple",
    },
    {
      label: "عقار مميز",
      value: stats.featured,
      icon: "⭐",
      color: "yellow",
    },
  ];

  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            إحصائيات الموقع
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            أرقام تعكس نجاح منصتنا وثقة المستخدمين
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-300"
            >
              <div className={`text-4xl mb-3 ${colors[item.color as keyof typeof colors]} rounded-full w-16 h-16 flex items-center justify-center mx-auto`}>
                {item.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {item.value.toLocaleString('ar-SA')}+
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * مكون قسم البحث السريع
 */
function QuickSearchSection() {
  const propertyTypes = [
    { label: "جميع العقارات", value: "" },
    { label: "شقة", value: "apartment" },
    { label: "فيلا", value: "villa" },
    { label: "أرض", value: "land" },
    { label: "محل تجاري", value: "shop" },
    { label: "مكتب", value: "office" },
  ];

  return (
    <section className="py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            🔍 ابحث عن عقارك المثالي
          </h2>
          
          <form className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="ابحث بالكلمة المفتاحية..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              بحث
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// ============================================
// الصفحة الرئيسية
// ============================================

export default async function HomePage() {
  // جلب جميع البيانات بالتوازي
  const [featured, latest, mostViewed, stats] = await Promise.all([
    getFeaturedProperties(),
    getLatestProperties(),
    getMostViewedProperties(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* قسم الترحيب */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              ✨ منصة العقارات الرائدة في سوريا
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              سوريا للعقارات
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              ابحث عن منزلك المثالي أو استثمر في عقارك القادم مع أكبر منصة عقارية في سوريا
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/properties"
                className="bg-white text-blue-600 px-8 py-3.5 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg hover:shadow-xl"
              >
                استعراض العقارات
              </Link>
              <Link
                href="/properties/new"
                className="bg-blue-700/80 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition border border-white/20"
              >
                إضافة عقار
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* البحث السريع */}
      <QuickSearchSection />

      {/* الإحصائيات */}
      <StatsSection stats={stats} />

      {/* العقارات المميزة */}
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-12">
          {[...Array(8)].map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      }>
        <PropertySection
          title="🔥 عقارات مميزة"
          subtitle="أفضل العقارات المختارة بعناية"
          properties={featured}
          viewAllLink="/properties?featured=true"
        />
      </Suspense>

      {/* أحدث العقارات */}
      <Suspense fallback={null}>
        <div className="bg-white dark:bg-gray-800 py-4">
          <PropertySection
            title="🆕 أحدث العقارات"
            subtitle="آخر العقارات المضافة إلى المنصة"
            properties={latest}
            viewAllLink="/properties?sort=latest"
          />
        </div>
      </Suspense>

      {/* الأكثر مشاهدة */}
      <Suspense fallback={null}>
        <PropertySection
          title="👁️ الأكثر مشاهدة"
          subtitle="العقارات الأكثر اهتماماً من المستخدمين"
          properties={mostViewed}
          viewAllLink="/properties?sort=views"
        />
      </Suspense>

      {/* قسم دعوة للعمل */}
<section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
  <div className="container mx-auto px-4 text-center">
    <h2 className="text-3xl font-bold mb-4">
      🏢 انضم إلى منصتنا كـ وكالة عقارية
    </h2>
    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
      وسّع نطاق عملك وتواصل مع آلاف المشترين والبائعين يومياً
    </p>
    <Link
      href="/agency/register"  // ✅ هذا هو الرابط الصحيح
      className="inline-block bg-white text-blue-600 px-10 py-4 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg hover:shadow-xl text-lg"
    >
      سجل وكالتك الآن
    </Link>
  </div>
</section>
    </div>
  );
}