import { db } from "@/lib/db";
import { agencies, users, agencyStaff, properties, propertyImages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Users,
  CheckCircle,
  ArrowLeft,
  Bed,
  Bath,
  DollarSign,
  Eye,
  Clock,
  Award,
  TrendingUp,
  Calendar
} from "lucide-react";

// ============================================
// جلب بيانات الوكالة
// ============================================
async function getAgency(slug: string) {
  try {
    // جلب الوكالة
    const agency = await db
      .select()
      .from(agencies)
      .where(eq(agencies.slug, slug))
      .limit(1);

    if (!agency || agency.length === 0) {
      return null;
    }

    const agencyData = agency[0];

    // جلب المالك
    const owner = agencyData.ownerId ? await db
      .select()
      .from(users)
      .where(eq(users.id, agencyData.ownerId))
      .limit(1) : null;

    // جلب الموظفين
    const staff = await db
      .select()
      .from(agencyStaff)
      .where(eq(agencyStaff.agencyId, agencyData.id))
      .limit(10);

    // ✅ جلب الموظفين مع معلومات المستخدم (مع التحقق من null)
    const staffWithUsers = await Promise.all(
      staff.map(async (member) => {
        let user = null;
        if (member.userId) {
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, member.userId))
            .limit(1);
          user = userResult[0] || null;
        }
        return {
          ...member,
          user: user,
        };
      })
    );

    // جلب عقارات الوكالة
    const propertiesList = await db
      .select()
      .from(properties)
      .where(eq(properties.agencyId, agencyData.id))
      .orderBy(desc(properties.createdAt))
      .limit(10);

    // جلب الصور الرئيسية للعقارات
    const propertiesWithImages = await Promise.all(
      propertiesList.map(async (property) => {
        const images = await db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, property.id))
          .limit(1);
        return {
          ...property,
          mainImage: images[0]?.url || null,
        };
      })
    );

    return {
      agency: agencyData,
      owner: owner?.[0] || null,
      staff: staffWithUsers,
      properties: propertiesWithImages,
    };
  } catch (error) {
    console.error("Error fetching agency:", error);
    return null;
  }
}

// ============================================
// مكونات الصفحة
// ============================================

// بطاقة العقار
function PropertyCard({ property }: { property: any }) {
  const price = new Intl.NumberFormat('ar-SY').format(Number(property.price));
  
  return (
    <Link href={`/properties/${property.slug}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
          {property.mainImage ? (
            <Image
              src={property.mainImage}
              alt={property.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {property.purpose === "sale" ? "للبيع" : "للإيجار"}
          </span>
        </div>
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
            {property.title}
          </h4>
          <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">
            {price} ل.س
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2">
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <Bed className="w-3 h-3" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="w-3 h-3" /> {property.bathrooms}
              </span>
            )}
            {property.area && (
              <span className="flex items-center gap-1">
                <span>📐</span> {property.area} م²
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
export default async function AgencyDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAgency(slug);
  
  if (!data) {
    notFound();
  }

  const { agency, owner, staff, properties } = data;

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      owner: "مالك",
      manager: "مدير",
      staff: "موظف",
    };
    return roles[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* صورة الغلاف */}
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-blue-600 to-purple-600">
        {agency.coverImage ? (
          <Image
            src={agency.coverImage}
            alt={agency.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building className="w-24 h-24 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          <Link
            href="/agencies"
            className="absolute top-4 right-4 text-white/80 hover:text-white transition flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة
          </Link>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* رأس الوكالة */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* الشعار */}
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 shadow-lg overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-800 flex-shrink-0">
              {agency.logo ? (
                <Image
                  src={agency.logo}
                  alt={agency.name}
                  width={96}
                  height={96}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Building className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {agency.name}
                </h1>
                {agency.isVerified && (
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    موثقة
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {agency.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {agency.address}
                  </span>
                )}
                {agency.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {agency.phone}
                  </span>
                )}
                {agency.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {agency.email}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {agency.rating || "0.0"}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({agency.reviewCount} تقييم)
                </span>
              </div>
            </div>
          </div>

          {/* الوصف */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              عن الوكالة
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {agency.description || "لا يوجد وصف"}
            </p>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {properties.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">عقار</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {staff.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">موظف</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {agency.reviewCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">تقييم</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {agency.isVerified ? "✅" : "⏳"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {agency.isVerified ? "موثقة" : "قيد المراجعة"}
              </div>
            </div>
          </div>

          {/* المالك */}
          {owner && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                المالك
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {owner.name?.[0] || "U"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {owner.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {owner.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* فريق العمل */}
          {staff.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                فريق العمل ({staff.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      {member.user?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user?.name || "موظف"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getRoleLabel(member.role)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* عقارات الوكالة */}
          {properties.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  عقارات الوكالة ({properties.length})
                </h2>
                <Link
                  href={`/properties?agency=${agency.id}`}
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  عرض الكل →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          )}

          {/* أزرار الإجراء */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4">
            <Link
              href={`/contact?agency=${agency.id}`}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
            >
              تواصل مع الوكالة
            </Link>
            <button
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              إضافة إلى المفضلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}