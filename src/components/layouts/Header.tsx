"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Building,
  User,
  Settings,
  LogOut,
  Heart,
  PlusCircle,
  CreditCard,
  Shield,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  Phone,
  Mail,
  MapPin,
  Award,
  BarChart3,
  Users,
  Store,
  FileText,
  HelpCircle,
} from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // التحقق من حالة التمرير
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // التحقق من الوضع الليلي
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const navigation = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "العقارات", href: "/properties", icon: Building },
    { name: "الوكالات", href: "/agencies", icon: Store },
    { name: "الخطط والتسعير", href: "/pricing", icon: CreditCard },
  ];

  const userNavigation = [
    { name: "الملف الشخصي", href: "/profile", icon: User },
    { name: "المفضلة", href: "/favorites", icon: Heart },
    { name: "عقاراتي", href: "/my-properties", icon: Building },
    { name: "إضافة عقار", href: "/properties/new", icon: PlusCircle },
    { name: "الاشتراكات", href: "/subscriptions", icon: CreditCard },
    { name: "الإعدادات", href: "/settings", icon: Settings },
  ];

  const agencyNavigation = [
    { name: "لوحة التحكم", href: "/agency/dashboard", icon: BarChart3 },
    { name: "عقاراتي", href: "/agency/properties", icon: Building },
    { name: "إضافة عقار", href: "/properties/new", icon: PlusCircle },
    { name: "فريق العمل", href: "/agency/staff", icon: Users },
    { name: "الاشتراكات", href: "/agency/subscriptions", icon: CreditCard },
    { name: "الإعدادات", href: "/agency/settings", icon: Settings },
  ];

  const adminNavigation = [
    { name: "لوحة التحكم", href: "/admin/dashboard", icon: BarChart3 },
    { name: "المستخدمين", href: "/admin/users", icon: Users },
    { name: "الوكالات", href: "/admin/agencies", icon: Store },
    { name: "العقارات", href: "/admin/properties", icon: Building },
    { name: "الاشتراكات", href: "/admin/subscriptions", icon: CreditCard },
    { name: "الإعدادات", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === path;
    return pathname?.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
          : "bg-white dark:bg-gray-900 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:scale-105 transition">
              <span className="text-white text-xl font-bold">🏠</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                سوريا للعقارات
              </span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 -mt-1">
                SYRIA REAL ESTATE
              </span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive(item.href)
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {/* زر الوضع الليلي */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* زر الاتصال */}
            <Link
              href="/contact"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Phone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>

            {session ? (
              // المستخدم مسجل الدخول
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {session.user?.name?.[0] || "U"}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* القائمة المنسدلة */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {/* معلومات المستخدم */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {session.user?.name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {session.user?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {session.user?.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            {session.user?.role === "admin"
                              ? "مدير النظام"
                              : session.user?.role === "agency_owner"
                              ? "مالك وكالة"
                              : "مستخدم"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* روابط المستخدم */}
                    <div className="p-2">
                      {session.user?.role === "admin" ? (
                        // روابط المدير
                        adminNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <Icon className="w-4 h-4" />
                              {item.name}
                            </Link>
                          );
                        })
                      ) : session.user?.role === "agency_owner" ||
                        session.user?.role === "agency_staff" ? (
                        // روابط الوكالة
                        agencyNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <Icon className="w-4 h-4" />
                              {item.name}
                            </Link>
                          );
                        })
                      ) : (
                        // روابط المستخدم العادي
                        userNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <Icon className="w-4 h-4" />
                              {item.name}
                            </Link>
                          );
                        })
                      )}
                    </div>
{session?.user?.role === "admin" && (
  <Link
    href="/admin/dashboard"
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
  >
    <Shield className="w-4 h-4" />
    لوحة التحكم
  </Link>
)}
                    {/* زر تسجيل الخروج */}
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // المستخدم غير مسجل
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition"
                >
                  حساب جديد
                </Link>
              </div>
            )}
          </div>

          {/* زر القائمة - Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* القائمة المتنقلة - Mobile */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isActive(item.href)
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {session ? (
                <div className="space-y-2">
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {session.user?.name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {session.user?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {session.user?.role === "admin" ? (
                    adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })
                  ) : session.user?.role === "agency_owner" ||
                    session.user?.role === "agency_staff" ? (
                    agencyNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })
                  ) : (
                    userNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition"
                  >
                    حساب جديد
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}