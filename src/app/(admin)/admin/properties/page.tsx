import { db } from "@/lib/db";
import { properties, propertyImages, agencies } from "@/lib/db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  Home, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  Building
} from "lucide-react";

async function getProperties(search?: string) {
  try {
    // ✅ طريقة صحيحة 100% لـ Drizzle
    let results;
    
    if (search) {
      // مع البحث
      results = await db
        .select({
          id: properties.id,
          title: properties.title,
          slug: properties.slug,
          price: properties.price,
          purpose: properties.purpose,
          status: properties.status,
          isFeatured: properties.isFeatured,
          viewsCount: properties.viewsCount,
          createdAt: properties.createdAt,
          agencyId: properties.agencyId,
          cityId: properties.cityId,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          area: properties.area,
        })
        .from(properties)
        .where(
          sql`${properties.title} ILIKE ${'%' + search + '%'}`
        )
        .orderBy(desc(properties.createdAt));
    } else {
      // بدون بحث
      results = await db
        .select({
          id: properties.id,
          title: properties.title,
          slug: properties.slug,
          price: properties.price,
          purpose: properties.purpose,
          status: properties.status,
          isFeatured: properties.isFeatured,
          viewsCount: properties.viewsCount,
          createdAt: properties.createdAt,
          agencyId: properties.agencyId,
          cityId: properties.cityId,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          area: properties.area,
        })
        .from(properties)
        .orderBy(desc(properties.createdAt));
    }

    // جلب الصور والتفاصيل
    const propertiesWithDetails = await Promise.all(
      results.map(async (property) => {
        const images = await db
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, property.id))
          .limit(1);

        let agency = null;
        if (property.agencyId) {
          const agencyResult = await db
            .select({ name: agencies.name })
            .from(agencies)
            .where(eq(agencies.id, property.agencyId))
            .limit(1);
          agency = agencyResult[0] || null;
        }

        return {
          ...property,
          mainImage: images[0]?.url || null,
          agency: agency,
        };
      })
    );

    return propertiesWithDetails;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const propertiesList = await getProperties(search);

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      active: { label: "نشط", color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
      pending: { label: "قيد المراجعة", color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" },
      sold: { label: "مباع", color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
      rented: { label: "مؤجر", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
      inactive: { label: "غير نشط", color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
    };
    return statuses[status] || statuses.pending;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏠 إدارة العقارات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {propertiesList.length} عقار مسجل
          </p>
        </div>
        <form className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="بحث عن عقار..."
              className="w-full sm:w-64 pr-9 pl-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propertiesList.map((property) => {
          const statusBadge = getStatusBadge(property.status);
          
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

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {property.bedrooms && <span>🛏️ {property.bedrooms}</span>}
                  {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
                  {property.area && <span>📐 {property.area} م²</span>}
                </div>

                {property.agency && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {property.agency.name}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
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
    </div>
  );
}