import { db } from "@/lib/db";
import { properties, propertyImages, cities, agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  Home, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  Ruler,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

async function getAgencyProperties(userId: string) {
  try {
    // ✅ جلب الوكالة التابعة للمستخدم
    const agency = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.ownerId, userId))
      .limit(1);

    // ✅ إذا لم يكن للمستخدم وكالة، أرجع مصفوفة فارغة
    if (!agency || agency.length === 0) {
      return [];
    }

    const agencyId = agency[0].id;

    // ✅ جلب عقارات الوكالة فقط
    const propertiesList = await db
      .select()
      .from(properties)
      .where(eq(properties.agencyId, agencyId))
      .orderBy(desc(properties.createdAt));

    // ✅ جلب الصور لكل عقار
    const propertiesWithImages = await Promise.all(
      propertiesList.map(async (property) => {
        const images = await db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, property.id))
          .limit(1);

        const city = property.cityId ? await db
          .select({ nameAr: cities.nameAr })
          .from(cities)
          .where(eq(cities.id, property.cityId))
          .limit(1) : null;

        return {
          ...property,
          mainImage: images[0]?.url || null,
          city: city?.[0] || null,
        };
      })
    );

    return propertiesWithImages;
  } catch (error) {
    console.error("Error fetching agency properties:", error);
    return [];
  }
}

export default async function AgencyPropertiesPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  const propertiesList = await getAgencyProperties(session.user.id);

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string; icon: any }> = {
      active: { label: "نشط", color: "bg-green-100 text-green-600", icon: CheckCircle },
      pending: { label: "قيد المراجعة", color: "bg-yellow-100 text-yellow-600", icon: Clock },
      sold: { label: "مباع", color: "bg-red-100 text-red-600", icon: XCircle },
      rented: { label: "مؤجر", color: "bg-blue-100 text-blue-600", icon: Home },
      inactive: { label: "غير نشط", color: "bg-gray-100 text-gray-600", icon: XCircle },
    };
    return statuses[status] || statuses.pending;
  };

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏠 عقاراتي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {propertiesList.length} عقار مسجل
          </p>
        </div>
        <Link
          href="/properties/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          إضافة عقار
        </Link>
      </div>

      {/* قائمة العقارات */}
      {propertiesList.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            لا توجد عقارات
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            أضف عقارك الأول الآن
          </p>
          <Link
            href="/properties/new"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ➕ إضافة عقار
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertiesList.map((property) => {
            const statusBadge = getStatusBadge(property.status);
            const StatusIcon = statusBadge.icon;
            
            return (
              <div key={property.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* الصورة */}
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
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
                      <Home className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {property.isFeatured && (
                    <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      ⭐ مميز
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {property.purpose === "sale" ? "للبيع" : "للإيجار"}
                  </span>
                </div>

                {/* المحتوى */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{new Intl.NumberFormat('ar-SY').format(Number(property.price))} ل.س</span>
                  </div>

                  {property.city && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {property.city.nameAr}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {property.bedrooms && <span>🛏️ {property.bedrooms}</span>}
                    {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
                    {property.area && <span>📐 {property.area} م²</span>}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.color} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/properties/${property.slug}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </Link>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}