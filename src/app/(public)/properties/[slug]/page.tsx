// src/app/(public)/properties/[slug]/page.tsx

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { properties, propertyImages, cities, districts, agencies, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { 
  Bed, Bath, Ruler, MapPin, DollarSign, Home, Building,
  Calendar, Eye, Heart, Share2, Phone, Mail,
  Star, Users, ArrowLeft
} from "lucide-react";

export const revalidate = 60;

async function getProperty(slug: string) {
  try {
    const cleanSlug = decodeURIComponent(slug);
    console.log("🔍 Searching for property with slug:", cleanSlug);

    const property = await db
      .select({
        id: properties.id,
        code: properties.code,
        slug: properties.slug,
        title: properties.title,
        description: properties.description,
        price: properties.price,
        purpose: properties.purpose,
        type: properties.type,
        status: properties.status,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        area: properties.area,
        address: properties.address,
        isFeatured: properties.isFeatured,
        viewsCount: properties.viewsCount,
        favoritesCount: properties.favoritesCount,
        createdAt: properties.createdAt,
        publishedAt: properties.publishedAt,
        cityId: properties.cityId,
        districtId: properties.districtId,
        agencyId: properties.agencyId,
        userId: properties.userId,
      })
      .from(properties)
      .where(eq(properties.slug, cleanSlug))
      .limit(1);

    if (!property || property.length === 0) {
      console.log("❌ Property not found with slug:", cleanSlug);
      return null;
    }

    const propertyData = property[0];
    console.log("✅ Property found:", propertyData.title);

    // جلب المدينة
    let cityName = null;
    if (propertyData.cityId) {
      const city = await db
        .select({ name: cities.nameAr })
        .from(cities)
        .where(eq(cities.id, propertyData.cityId))
        .limit(1);
      cityName = city[0]?.name || null;
    }

    // جلب الحي
    let districtName = null;
    if (propertyData.districtId) {
      const district = await db
        .select({ name: districts.nameAr })
        .from(districts)
        .where(eq(districts.id, propertyData.districtId))
        .limit(1);
      districtName = district[0]?.name || null;
    }

    // جلب الوكالة
    let agencyData = null;
    if (propertyData.agencyId) {
      const agency = await db
        .select({
          name: agencies.name,
          logo: agencies.logo,
          phone: agencies.phone,
          email: agencies.email,
          rating: agencies.rating,
          slug: agencies.slug,
        })
        .from(agencies)
        .where(eq(agencies.id, propertyData.agencyId))
        .limit(1);
      agencyData = agency[0] || null;
    }

    // جلب المالك
    let userData = null;
    if (propertyData.userId) {
      const user = await db
        .select({
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, propertyData.userId))
        .limit(1);
      userData = user[0] || null;
    }

    // جلب صور العقار
    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyData.id))
      .orderBy(propertyImages.order);

    // زيادة عدد المشاهدات
    await db
      .update(properties)
      .set({ viewsCount: (propertyData.viewsCount || 0) + 1 })
      .where(eq(properties.id, propertyData.id));

    return {
      ...propertyData,
      cityName,
      districtName,
      agency: agencyData,
      user: userData,
      images: images,
    };
  } catch (error) {
    console.error("❌ Error fetching property:", error);
    return null;
  }
}

// ✅ الصفحة الرئيسية - استخدم await params
export default async function PropertyPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  // ✅ انتظر params قبل استخدامها
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            العقار غير موجود
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            عذراً، لم نتمكن من العثور على العقار الذي تبحث عنه.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى العقارات
          </Link>
        </div>
      </div>
    );
  }

  // تنسيق السعر بالدولار
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(property.price) || 0);

  const mainImage = property.images?.find(img => img.isMain) || property.images?.[0];
  const otherImages = property.images?.filter(img => img.id !== mainImage?.id) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return { label: '✅ منشور', color: 'bg-green-500' };
      case 'pending': return { label: '⏳ قيد المراجعة', color: 'bg-yellow-500' };
      case 'sold': return { label: '❌ تم البيع', color: 'bg-red-500' };
      default: return { label: status, color: 'bg-gray-500' };
    }
  };

  const statusBadge = getStatusBadge(property.status);

  const getPropertyType = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'شقة',
      villa: 'فيلا',
      house: 'منزل',
      land: 'أرض',
      commercial: 'تجاري',
      office: 'مكتب',
    };
    return types[type] || type;
  };

  const getPurpose = (purpose: string) => {
    const purposes: Record<string, string> = {
      sale: 'للبيع',
      rent: 'للإيجار',
    };
    return purposes[purpose] || purpose;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition">🏠 الرئيسية</Link>
          <span>›</span>
          <Link href="/properties" className="hover:text-blue-600 transition">العقارات</Link>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
            {property.title}
          </span>
        </nav>

        {/* صورة رئيسية */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px] w-full">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={property.title || 'صورة العقار'}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Home className="w-20 h-20 text-gray-400" />
              </div>
            )}
            
            <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
              <span className={`${statusBadge.color} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
                {statusBadge.label}
              </span>
              {property.isFeatured && (
                <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  مميز
                </span>
              )}
            </div>
          </div>
        </div>

        {/* معلومات العقار */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {/* العنوان والسعر */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {property.districtName && `${property.districtName}، `}
                      {property.cityName || 'مدينة غير محددة'}
                    </span>
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formattedPrice}
                </div>
              </div>
            </div>

            {/* تفاصيل العقار */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📋 تفاصيل العقار
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <Home className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">نوع العقار</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getPropertyType(property.type)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">الغرض</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getPurpose(property.purpose)}
                  </p>
                </div>
                {property.bedrooms && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <Bed className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">غرف النوم</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.bedrooms}
                    </p>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <Bath className="w-6 h-6 mx-auto text-indigo-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">الحمامات</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.bathrooms}
                    </p>
                  </div>
                )}
                {property.area && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <Ruler className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">المساحة</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.area} م²
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto text-cyan-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ النشر</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(property.createdAt).toLocaleDateString('ar-SY')}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <Eye className="w-6 h-6 mx-auto text-pink-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">المشاهدات</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {property.viewsCount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                  <Heart className="w-6 h-6 mx-auto text-red-500 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">المفضلة</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {property.favoritesCount || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* الوصف */}
            {property.description && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📝 وصف العقار
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* صور إضافية */}
            {otherImages.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🖼️ صور إضافية
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {otherImages.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={property.title || 'صورة العقار'}
                        fill
                        className="object-cover hover:scale-105 transition duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* العمود الجانبي */}
          <div className="space-y-6">
            {/* معلومات الوكالة */}
            {property.agency && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  الوكالة
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  {property.agency.logo ? (
                    <Image
                      src={property.agency.logo}
                      alt={property.agency.name}
                      width={60}
                      height={60}
                      className="rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {property.agency.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {property.agency.name}
                    </h4>
                    {property.agency.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {Number(property.agency.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {property.agency.phone && (
                    <a href={`tel:${property.agency.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition">
                      <Phone className="w-4 h-4" />
                      {property.agency.phone}
                    </a>
                  )}
                  {property.agency.email && (
                    <a href={`mailto:${property.agency.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition">
                      <Mail className="w-4 h-4" />
                      {property.agency.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* معلومات المالك */}
            {property.user && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  المالك
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  {property.user.image ? (
                    <Image src={property.user.image} alt={property.user.name || 'مستخدم'} width={48} height={48} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {property.user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.user.name || 'مستخدم'}
                    </p>
                    {property.user.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {property.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {property.user.email && (
                    <a href={`mailto:${property.user.email}`} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      راسل
                    </a>
                  )}
                  <a href={`tel:${property.agency?.phone || property.user.email}`} className="flex-1 bg-green-600 text-white text-center py-2 rounded-xl hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    اتصل
                  </a>
                </div>
              </div>
            )}

            {/* موقع العقار */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {property.address && (
                  <p className="flex items-start gap-2">
                    <span className="mt-0.5">📍</span>
                    {property.address}
                  </p>
                )}
                {property.districtName && (
                  <p>الحي: {property.districtName}</p>
                )}
                {property.cityName && (
                  <p>المدينة: {property.cityName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}