import { db } from "@/lib/db";
import { users, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX,
  Shield,
  Crown,
  Star,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2
} from "lucide-react";

async function getUsers(search?: string) {
  try {
    let results;
    
    if (search) {
      // ✅ مع البحث
      results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          phone: users.phone,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
          planId: users.planId,
          planStatus: users.planStatus,
        })
        .from(users)
        .where(
          sql`${users.name} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'}`
        )
        .orderBy(desc(users.createdAt));
    } else {
      // ✅ بدون بحث
      results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          phone: users.phone,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
          planId: users.planId,
          planStatus: users.planStatus,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
    }

    // جلب أسماء الخطط لكل مستخدم
    const usersWithPlans = await Promise.all(
      results.map(async (user) => {
        let planName = null;
        if (user.planId) {
          const plan = await db
            .select({ nameAr: subscriptionPlans.nameAr })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, user.planId))
            .limit(1);
          planName = plan[0]?.nameAr || null;
        }
        return { ...user, planName };
      })
    );

    return usersWithPlans;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const usersList = await getUsers(search);

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      admin: { label: "مدير", color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
      agency_owner: { label: "مالك وكالة", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
      agency_staff: { label: "موظف", color: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
      user: { label: "مستخدم", color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
    };
    return roles[role] || roles.user;
  };

  const getStatusBadge = (status: string | null) => {
    const statuses: Record<string, { label: string; color: string }> = {
      active: { label: "نشط", color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
      free: { label: "مجاني", color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
      expired: { label: "منتهي", color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
      cancelled: { label: "ملغي", color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" },
    };
    return statuses[status || "free"] || statuses.free;
  };

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            👤 إدارة المستخدمين
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {usersList.length} مستخدم مسجل
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
                placeholder="بحث عن مستخدم..."
                className="w-full sm:w-64 pr-9 pl-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </form>
        </div>
      </div>

      {/* جدول المستخدمين */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  المستخدم
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الدور
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الخطة
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  تاريخ التسجيل
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {usersList.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                const statusBadge = getStatusBadge(user.planStatus);
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {user.planName || "مجاني"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {user.isActive ? (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            نشط
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <UserX className="w-3 h-3" />
                            غير نشط
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}