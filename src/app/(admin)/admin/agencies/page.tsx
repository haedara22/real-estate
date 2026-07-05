import { db } from "@/lib/db";
import { agencies, users, properties } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  Users,
  Home,
  Clock,
  Star
} from "lucide-react";

async function getAgencies(search?: string) {
  try {
    let results;
    
    if (search) {
      // ✅ مع البحث
      results = await db
        .select({
          id: agencies.id,
          name: agencies.name,
          slug: agencies.slug,
          logo: agencies.logo,
          coverImage: agencies.coverImage,
          isVerified: agencies.isVerified,
          isActive: agencies.isActive,
          rating: agencies.rating,
          reviewCount: agencies.reviewCount,
          address: agencies.address,
          phone: agencies.phone,
          email: agencies.email,
          createdAt: agencies.createdAt,
          ownerId: agencies.ownerId,
        })
        .from(agencies)
        .where(
          sql`${agencies.name} ILIKE ${'%' + search + '%'}`
        )
        .orderBy(desc(agencies.createdAt));
    } else {
      // ✅ بدون بحث
      results = await db
        .select({
          id: agencies.id,
          name: agencies.name,
          slug: agencies.slug,
          logo: agencies.logo,
          coverImage: agencies.coverImage,
          isVerified: agencies.isVerified,
          isActive: agencies.isActive,
          rating: agencies.rating,
          reviewCount: agencies.reviewCount,
          address: agencies.address,
          phone: agencies.phone,
          email: agencies.email,
          createdAt: agencies.createdAt,
          ownerId: agencies.ownerId,
        })
        .from(agencies)
        .orderBy(desc(agencies.createdAt));
    }

    // جلب تفاصيل إضافية
    const agenciesWithDetails = await Promise.all(
      results.map(async (agency) => {
        const owner = agency.ownerId ? await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, agency.ownerId))
          .limit(1) : null;

        const propertiesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(properties)
          .where(eq(properties.agencyId, agency.id));

        return {
          ...agency,
          owner: owner?.[0] || null,
          propertiesCount: Number(propertiesCount[0]?.count || 0),
        };
      })
    );

    return agenciesWithDetails;
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return [];
  }
}

export default async function AdminAgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const agenciesList = await getAgencies(search);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏢 إدارة الوكالات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {agenciesList.length} وكالة مسجلة
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form className="flex-1 sm:flex-none">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="بحث عن وكالة..."
                className="w-full sm:w-64 pr-9 pl-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </form>
          <Link
            href="/agency/register"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            وكالة جديدة
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agenciesList.map((agency) => (
          <div key={agency.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
            {/* صورة الغلاف */}
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
              {agency.coverImage && (
                <Image
                  src={agency.coverImage}
                  alt={agency.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                {agency.isVerified && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    موثقة
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  agency.isActive 
                    ? "bg-green-500 text-white" 
                    : "bg-red-500 text-white"
                }`}>
                  {agency.isActive ? "نشطة" : "غير نشطة"}
                </span>
              </div>
              <div className="absolute -bottom-6 right-4">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-900 shadow-lg border-2 border-white dark:border-gray-800 overflow-hidden flex items-center justify-center">
                  {agency.logo ? (
                    <Image
                      src={agency.logo}
                      alt={agency.name}
                      width={48}
                      height={48}
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Building className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* المحتوى */}
            <div className="p-4 pt-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {agency.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {agency.address || "موقع غير محدد"}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {agency.rating || "0.0"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  {agency.propertiesCount} عقار
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {agency.reviewCount} تقييم
                </span>
              </div>

              {agency.owner && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  المالك: {agency.owner.name}
                </p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href={`/agencies/${agency.slug}`}
                  className="flex-1 text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <Eye className="w-4 h-4 inline ml-1" />
                  عرض
                </Link>
                <button className="flex-1 text-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
                  <Edit className="w-4 h-4 inline ml-1" />
                  تعديل
                </button>
                <button className="flex-1 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                  <Trash2 className="w-4 h-4 inline ml-1" />
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}