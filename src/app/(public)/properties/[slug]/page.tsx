import { db } from "@/lib/db";
import { properties, propertyImages, cities, districts, agencies, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, Bed, Bath, Ruler, DollarSign, Eye, 
  Phone, Mail, Building, CheckCircle, XCircle, 
  Clock, Home, ArrowLeft
} from "lucide-react";
import { ActionButtons } from "./ActionButtons";
import { PublisherCard } from "./PublisherCard";

// ============================================
// جلب بيانات العقار
// ============================================
async function getProperty(slug: string) {
  try {
    console.log("🔍 جلب العقار بـ slug:", slug);
    
    // 1. جلب العقار
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.slug, slug))
      .limit(1);

    if (!property || property.length === 0) {
      return null;
    }

    const propertyData = property[0];

    // 2. جلب الصور
    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyData.id))
      .orderBy(desc(propertyImages.isMain), desc(propertyImages.order));

    // 3. جلب المدينة
    let city = null;
    if (propertyData.cityId) {
      const cityResult = await db
        .select()
        .from(cities)
        .where(eq(cities.id, propertyData.cityId))
        .limit(1);
      city = cityResult[0] || null;
    }

    // 4. جلب الحي
    let district = null;
    if (propertyData.districtId) {
      const districtResult = await db
        .select()
        .from(districts)
        .where(eq(districts.id, propertyData.districtId))
        .limit(1);
      district = districtResult[0] || null;
    }

    // 5. جلب الوكالة
    let agency = null;
    if (propertyData.agencyId) {
      const agencyResult = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, propertyData.agencyId))
        .limit(1);
      agency = agencyResult[0] || null;
    }

    // 6. ✅ جلب المالك (مع تحويل isVerified من null إلى false)
    let owner = null;
    if (propertyData.userId) {
      const ownerResult = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          image: users.image,
          role: users.role,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, propertyData.userId))
        .limit(1);
      
      if (ownerResult && ownerResult.length > 0) {
        owner = {
          ...ownerResult[0],
          isVerified: ownerResult[0].isVerified ?? false, // ✅ تحويل null إلى false
        };
      }
    }

    // 7. جلب عقارات مشابهة
    const similarProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.cityId, propertyData.cityId || ""))
      .limit(4)
      .orderBy(desc(properties.createdAt));

    const similarWithImages = await Promise.all(
      similarProperties.map(async (prop) => {
        const propImages = await db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, prop.id))
          .limit(1);
        return {
          ...prop,
          images: propImages,
        };
      })
    );

    return {
      property: {
        ...propertyData,
        images,
        city,
        district,
        agency,
        owner,
      },
      similarProperties: similarWithImages.filter(p => p.id !== propertyData.id),
    };
  } catch (error) {
    console.error("❌ خطأ في جلب العقار:", error);
    return null;
  }
}

// ============================================
// الصفحة الرئيسية
// ============================================
export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  console.log("📄 صفحة تفاصيل العقار - Slug:", slug);
  
  const data = await getProperty(slug);
  
  if (!data) {
    notFound();
  }

  const { property, similarProperties } = data;
  
  const formattedPrice = property.price 
    ? new Intl.NumberFormat('ar-SY').format(Number(property.price))
    : "غير محدد";
  
  const formattedDate = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(property.createdAt));

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: "نشط", color: "bg-green-500", icon: CheckCircle },
    pending: { label: "قيد المراجعة", color: "bg-yellow-500", icon: Clock },
    sold: { label: "مباع", color: "bg-red-500", icon: XCircle },
    rented: { label: "مؤجر", color: "bg-blue-500", icon: Home },
    inactive: { label: "غير نشط", color: "bg-gray-500", icon: XCircle },
  };

  const status = statusConfig[property.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* زر العودة */}
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة إلى العقارات
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {/* معرض الصور */}
            {property.images && property.images.length > 0 ? (
              <div className="relative h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <Image
                  src={property.images[0]?.url || "/images/placeholder.jpg"}
                  alt={property.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="relative h-[400px] md:h-[500px] bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden flex items-center justify-center">
                <span className="text-gray-500">لا توجد صور</span>
              </div>
            )}

            {/* معلومات العقار */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {property.title}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                    <span>كود: {property.code}</span>
                    <span>•</span>
                    <span>{formattedDate}</span>
                  </p>
                </div>
                <div className={`${status.color} text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </div>
              </div>

              {/* السعر والموقع */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formattedPrice} ل.س
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {property.city?.nameAr || "موقع غير محدد"}
                    {property.district && `، ${property.district.nameAr}`}
                  </span>
                </div>
              </div>

              {/* المواصفات */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.bedrooms && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">غرف النوم</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{property.bedrooms}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <Bath className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">الحمامات</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{property.bathrooms}</p>
                    </div>
                  </div>
                )}
                {property.area && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">المساحة</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{property.area} م²</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">المشاهدات</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{property.viewsCount}</p>
                  </div>
                </div>
              </div>

              {/* الوصف */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">الوصف</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {property.description || "لا يوجد وصف"}
                </p>
              </div>
            </div>
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            {/* معلومات الوكالة */}
            {property.agency && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  الوكالة العقارية
                </h3>
                
                <div className="space-y-4">
                  <h4 className="text-center font-bold text-gray-900 dark:text-white text-lg">
                    {property.agency.name}
                  </h4>
                  
                  {property.agency.isVerified && (
                    <p className="text-center text-green-600 dark:text-green-400 text-sm flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      وكالة موثقة
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {property.agency.phone && (
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        {property.agency.phone}
                      </p>
                    )}
                    {property.agency.email && (
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        {property.agency.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* معلومات الناشر */}
            <PublisherCard owner={property.owner} propertyId={property.id} />

            {/* أزرار الإجراء */}
            <ActionButtons property={property} />
          </div>
        </div>

        {/* عقارات مشابهة */}
        {similarProperties && similarProperties.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🏠 عقارات مشابهة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((similarProperty: any) => (
                <Link key={similarProperty.id} href={`/properties/${similarProperty.slug}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <Image
                        src={similarProperty.images?.[0]?.url || "/images/placeholder.jpg"}
                        alt={similarProperty.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {similarProperty.title}
                      </h4>
                      <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
                        {new Intl.NumberFormat('ar-SY').format(Number(similarProperty.price))} ل.س
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}