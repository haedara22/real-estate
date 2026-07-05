import { db } from "@/lib/db";
import { properties, propertyImages, cities, agencies } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  MapPin, 
  Bed, 
  Bath, 
  DollarSign,
  Home,
  Building,
  ChevronDown,
  X
} from "lucide-react";

// ============================================
// جلب العقارات مع التصفية
// ============================================
async function getProperties(searchParams: {
  search?: string;
  type?: string;
  purpose?: string;
  cityId?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  featured?: string;
  sort?: string;
}) {
  try {
    // بناء شروط البحث
    const conditions = [];
    
    // فقط العقارات النشطة
    conditions.push(eq(properties.status, "active"));
    
    // البحث بالنص
    if (searchParams.search) {
      const searchTerm = `%${searchParams.search}%`;
      conditions.push(
        sql`(${properties.title} ILIKE ${searchTerm} OR ${properties.description} ILIKE ${searchTerm})`
      );
    }
    
    // نوع العقار
    if (searchParams.type && searchParams.type !== "all") {
      conditions.push(eq(properties.type, searchParams.type));
    }
    
    // الغرض (بيع/إيجار)
    if (searchParams.purpose && searchParams.purpose !== "all") {
      conditions.push(eq(properties.purpose, searchParams.purpose));
    }
    
    // المدينة
    if (searchParams.cityId && searchParams.cityId !== "all") {
      conditions.push(eq(properties.cityId, searchParams.cityId));
    }
    
    // السعر الأدنى
    if (searchParams.minPrice) {
      conditions.push(sql`${properties.price} >= ${parseFloat(searchParams.minPrice)}`);
    }
    
    // السعر الأقصى
    if (searchParams.maxPrice) {
      conditions.push(sql`${properties.price} <= ${parseFloat(searchParams.maxPrice)}`);
    }
    
    // عدد الغرف
    if (searchParams.bedrooms) {
      conditions.push(eq(properties.bedrooms, parseInt(searchParams.bedrooms)));
    }
    
    // مميز
    if (searchParams.featured === "true") {
      conditions.push(eq(properties.isFeatured, true));
    }
    
    // ترتيب النتائج
    let orderBy: any = desc(properties.createdAt);
    if (searchParams.sort === "price-asc") {
      orderBy = sql`${properties.price} ASC NULLS LAST`;
    } else if (searchParams.sort === "price-desc") {
      orderBy = sql`${properties.price} DESC NULLS LAST`;
    } else if (searchParams.sort === "views") {
      orderBy = desc(properties.viewsCount);
    } else if (searchParams.sort === "latest") {
      orderBy = desc(properties.createdAt);
    }
    
    // جلب العقارات
    const results = await db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(20);
    
    // جلب الصور والمدن والوكالات لكل عقار
    const propertiesWithDetails = await Promise.all(
      results.map(async (property) => {
        const images = await db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, property.id))
          .orderBy(desc(propertyImages.isMain))
          .limit(5);
        
        const city = property.cityId ? await db
          .select()
          .from(cities)
          .where(eq(cities.id, property.cityId))
          .limit(1) : null;
        
        const agency = property.agencyId ? await db
          .select()
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
    
    return propertiesWithDetails;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

// ============================================
// جلب المدن للفلاتر
// ============================================
async function getCities() {
  try {
    return await db.select().from(cities).orderBy(cities.nameAr);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

// ============================================
// مكونات الصفحة
// ============================================

// بطاقة العقار
function PropertyCard({ property }: { property: any }) {
  const mainImage = property.images?.[0]?.url || "/images/placeholder.jpg";
  const price = property.price 
    ? new Intl.NumberFormat('ar-SY').format(Number(property.price))
    : "غير محدد";
  
  const purposeLabels = {
    sale: { label: "للبيع", color: "bg-green-500" },
    rent: { label: "للإيجار", color: "bg-blue-500" },
    both: { label: "للبيع والإيجار", color: "bg-purple-500" },
  };
  
  const purpose = purposeLabels[property.purpose as keyof typeof purposeLabels] || 
                   { label: property.purpose, color: "bg-gray-500" };

  return (
    <Link href={`/properties/${property.slug}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* صورة العقار */}
        <div className="relative h-56 overflow-hidden bg-gray-200 dark:bg-gray-700">
          <Image
            src={mainImage}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized
          />
          
          {/* شارة مميز */}
          {property.isFeatured && (
            <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ⭐ مميز
            </span>
          )}
          
          {/* شارة الغرض */}
          <span className={`absolute bottom-3 right-3 ${purpose.color} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg`}>
            {purpose.label}
          </span>
        </div>
        
        {/* معلومات العقار */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
            {property.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <MapPin className="w-3 h-3" />
            <span>{property.city?.nameAr || "موقع غير محدد"}</span>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" /> {property.bathrooms}
              </span>
            )}
            {property.area && (
              <span className="flex items-center gap-1">
                <Home className="w-4 h-4" /> {property.area} م²
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {price} ل.س
            </span>
            {property.agency && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Building className="w-3 h-3" />
                {property.agency.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// الصفحة الرئيسية
// ============================================
export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    type?: string;
    purpose?: string;
    cityId?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    featured?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const [properties, cities] = await Promise.all([
    getProperties(params),
    getCities(),
  ]);

  // أنواع العقارات
  const propertyTypes = [
    { value: "all", label: "الكل" },
    { value: "apartment", label: "شقة" },
    { value: "villa", label: "فيلا" },
    { value: "land", label: "أرض" },
    { value: "shop", label: "محل تجاري" },
    { value: "office", label: "مكتب" },
    { value: "building", label: "بناء" },
    { value: "warehouse", label: "مستودع" },
  ];

  const purposes = [
    { value: "all", label: "الكل" },
    { value: "sale", label: "للبيع" },
    { value: "rent", label: "للإيجار" },
    { value: "both", label: "كلاهما" },
  ];

  const sortOptions = [
    { value: "latest", label: "الأحدث" },
    { value: "price-asc", label: "السعر: من الأقل" },
    { value: "price-desc", label: "السعر: من الأعلى" },
    { value: "views", label: "الأكثر مشاهدة" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🏠 جميع العقارات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {properties.length} عقار متاح
            </p>
          </div>
          <Link
            href="/properties/new"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>➕</span> إضافة عقار
          </Link>
        </div>

        {/* فلاتر البحث */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* بحث */}
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={params.search || ""}
                placeholder="ابحث عن عقار..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* نوع العقار */}
            <select
              name="type"
              defaultValue={params.type || "all"}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* الغرض */}
            <select
              name="purpose"
              defaultValue={params.purpose || "all"}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {purposes.map((purpose) => (
                <option key={purpose.value} value={purpose.value}>
                  {purpose.label}
                </option>
              ))}
            </select>

            {/* المدينة */}
            <select
              name="cityId"
              defaultValue={params.cityId || "all"}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع المدن</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.nameAr}
                </option>
              ))}
            </select>

            {/* السعر الأدنى */}
            <input
              type="number"
              name="minPrice"
              defaultValue={params.minPrice || ""}
              placeholder="السعر من"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />

            {/* السعر الأقصى */}
            <input
              type="number"
              name="maxPrice"
              defaultValue={params.maxPrice || ""}
              placeholder="السعر إلى"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />

            {/* عدد الغرف */}
            <select
              name="bedrooms"
              defaultValue={params.bedrooms || ""}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">كل الغرف</option>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} غرف
                </option>
              ))}
            </select>

            {/* ترتيب */}
            <select
              name="sort"
              defaultValue={params.sort || "latest"}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* أزرار */}
            <div className="flex gap-2 md:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                بحث
              </button>
              <Link
                href="/properties"
                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                إلغاء
              </Link>
            </div>
          </form>
        </div>

        {/* قائمة العقارات */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد عقارات
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              لم نتمكن من العثور على عقارات تطابق معايير البحث
            </p>
            <Link
              href="/properties"
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              إلغاء الفلاتر
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}