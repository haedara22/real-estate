import { db } from "@/lib/db";
import { agencies, users, agencyStaff, properties } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { 
  Building, 
  MapPin, 
  Star, 
  Users,
  CheckCircle,
  Search,
  X
} from "lucide-react";

// ============================================
// جلب الوكالات مع التصفية
// ============================================
async function getAgencies(searchParams: {
  search?: string;
  verified?: string;
  sort?: string;
}) {
  try {
    // ✅ حدد الأعمدة المطلوبة فقط - بدون subscription_id
    const results = await db
      .select({
        id: agencies.id,
        ownerId: agencies.ownerId,
        name: agencies.name,
        slug: agencies.slug,
        description: agencies.description,
        logo: agencies.logo,
        coverImage: agencies.coverImage,
        address: agencies.address,
        phone: agencies.phone,
        email: agencies.email,
        website: agencies.website,
        isVerified: agencies.isVerified,
        isActive: agencies.isActive,
        rating: agencies.rating,
        reviewCount: agencies.reviewCount,
        metadata: agencies.metadata,
        createdAt: agencies.createdAt,
        updatedAt: agencies.updatedAt,
      })
      .from(agencies)
      .where(eq(agencies.isActive, true))
      .orderBy(desc(agencies.createdAt))
      .limit(20);
    
    // إذا كانت النتائج فارغة، أرجع مصفوفة فارغة
    if (!results || results.length === 0) {
      return [];
    }
    
    // جلب تفاصيل إضافية لكل وكالة
    const agenciesWithDetails = await Promise.all(
      results.map(async (agency: any) => {
        try {
          // عدد العقارات
          const propertiesCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(properties)
            .where(eq(properties.agencyId, agency.id));
          
          // عدد الموظفين
          const staffCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(agencyStaff)
            .where(eq(agencyStaff.agencyId, agency.id));
          
          // جلب المالك
          const owner = agency.ownerId ? await db
            .select()
            .from(users)
            .where(eq(users.id, agency.ownerId))
            .limit(1) : null;
          
          return {
            ...agency,
            propertiesCount: Number(propertiesCount[0]?.count || 0),
            staffCount: Number(staffCount[0]?.count || 0),
            owner: owner?.[0] || null,
          };
        } catch (err) {
          console.error("❌ Error fetching details for agency:", agency.id);
          return {
            ...agency,
            propertiesCount: 0,
            staffCount: 0,
            owner: null,
          };
        }
      })
    );
    
    return agenciesWithDetails;
  } catch (error) {
    console.error("❌ Error fetching agencies:", error);
    return [];
  }
}

// ============================================
// بطاقة الوكالة
// ============================================
function AgencyCard({ agency }: { agency: any }) {
  return (
    <Link href={`/agencies/${agency.slug}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* صورة الغلاف */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500">
          {agency.coverImage ? (
            <Image
              src={agency.coverImage}
              alt={agency.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building className="w-20 h-20 text-white/30" />
            </div>
          )}
          
          {/* شارة موثقة */}
          {agency.isVerified && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              موثقة
            </div>
          )}
          
          {/* الشعار */}
          <div className="absolute -bottom-6 right-6">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 shadow-lg border-4 border-white dark:border-gray-800 overflow-hidden flex items-center justify-center">
              {agency.logo ? (
                <Image
                  src={agency.logo}
                  alt={agency.name}
                  width={56}
                  height={56}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Building className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {/* معلومات الوكالة */}
        <div className="p-5 pt-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {agency.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{agency.address || "موقع غير محدد"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {agency.rating || "0.0"}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
            {agency.description || "وكالة عقارية متخصصة في تقديم خدمات متميزة"}
          </p>
          
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Building className="w-4 h-4" />
              <span>{agency.propertiesCount} عقار</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{agency.staffCount} موظف</span>
            </div>
            {agency.owner && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <span>👤</span>
                <span>{agency.owner.name}</span>
              </div>
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
export default async function AgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    verified?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const agenciesList = await getAgencies(params);

  const sortOptions = [
    { value: "latest", label: "الأحدث" },
    { value: "rating", label: "الأعلى تقييماً" },
    { value: "properties", label: "الأكثر عقارات" },
    { value: "name", label: "حسب الاسم" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🏢 الوكالات العقارية
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {agenciesList.length} وكالة عقارية
            </p>
          </div>
          <Link
            href="/agency/register"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>➕</span> تسجيل وكالة
          </Link>
        </div>

        {/* فلاتر البحث */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* بحث */}
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={params.search || ""}
                placeholder="ابحث عن وكالة..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
            <div className="flex gap-2 md:col-span-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                بحث
              </button>
              <Link
                href="/agencies"
                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                إلغاء
              </Link>
            </div>
          </form>
        </div>

        {/* قائمة الوكالات */}
        {agenciesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agenciesList.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد وكالات
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              لم يتم العثور على وكالات. يمكنك تسجيل وكالتك الآن!
            </p>
            <Link
              href="/agency/register"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              تسجيل وكالة جديدة
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}