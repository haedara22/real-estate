"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Mail, 
  Lock, 
  User,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Languages,
  Database,
  Cloud,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // الملف الشخصي
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // كلمة المرور
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // إعدادات التطبيق
  const [appSettings, setAppSettings] = useState({
    siteName: "سوريا للعقارات",
    siteDescription: "منصة العقارات الرائدة في سوريا",
    siteLanguage: "ar",
    siteTheme: "system",
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    maintenanceMode: false,
  });

  // تحميل الإعدادات
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setAppSettings({
            siteName: data.site_name || "سوريا للعقارات",
            siteDescription: data.site_description || "منصة العقارات الرائدة في سوريا",
            siteLanguage: data.site_language || "ar",
            siteTheme: data.site_theme || "system",
            notificationsEnabled: data.notifications_enabled !== false,
            emailNotificationsEnabled: data.email_notifications_enabled !== false,
            maintenanceMode: data.maintenance_mode === true,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  // تحميل بيانات المستخدم
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [session]);

  // تحديث الملف الشخصي
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في تحديث الملف");
      }

      setSuccess("✅ تم تحديث الملف الشخصي بنجاح!");
      await update();
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // تغيير كلمة المرور
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("كلمة المرور الجديدة غير متطابقة");
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في تغيير كلمة المرور");
      }

      setSuccess("✅ تم تغيير كلمة المرور بنجاح!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // حفظ إعدادات التطبيق
  const handleAppSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const settingsToSave = {
        site_name: appSettings.siteName,
        site_description: appSettings.siteDescription,
        site_language: appSettings.siteLanguage,
        site_theme: appSettings.siteTheme,
        notifications_enabled: appSettings.notificationsEnabled,
        email_notifications_enabled: appSettings.emailNotificationsEnabled,
        maintenance_mode: appSettings.maintenanceMode,
      };

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في حفظ الإعدادات");
      }

      setSuccess("✅ تم حفظ الإعدادات بنجاح!");
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // ✅ إعادة ضبط الإعدادات - إصلاح مشكلة window.location
  const handleResetSettings = async () => {
    if (!confirm("هل أنت متأكد من إعادة ضبط جميع الإعدادات؟")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings/reset", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("فشل في إعادة ضبط الإعدادات");
      }

      setSuccess("✅ تم إعادة ضبط الإعدادات بنجاح!");
      
      // ✅ استخدام router.refresh() بدلاً من window.location.reload()
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⚙️ الإعدادات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة إعدادات حسابك والمنصة
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* الملف الشخصي */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">الملف الشخصي</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">تحديث معلومات حساب المدير</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={profile.email}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="+963 11 1234567"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </form>
        </div>

        {/* تغيير كلمة المرور */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">تغيير كلمة المرور</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">تحديث كلمة المرور الخاصة بحساب المدير</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </button>
          </form>
        </div>

        {/* إعدادات التطبيق */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">إعدادات التطبيق</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">التحكم في إعدادات المنصة العامة</p>
            </div>
          </div>

          <form onSubmit={handleAppSettingsSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الموقع</label>
                <input
                  type="text"
                  value={appSettings.siteName}
                  onChange={(e) => setAppSettings({ ...appSettings, siteName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف الموقع</label>
                <input
                  type="text"
                  value={appSettings.siteDescription}
                  onChange={(e) => setAppSettings({ ...appSettings, siteDescription: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اللغة</label>
                <select
                  value={appSettings.siteLanguage}
                  onChange={(e) => setAppSettings({ ...appSettings, siteLanguage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المظهر</label>
                <select
                  value={appSettings.siteTheme}
                  onChange={(e) => setAppSettings({ ...appSettings, siteTheme: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">فاتح</option>
                  <option value="dark">داكن</option>
                  <option value="system">حسب النظام</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={appSettings.notificationsEnabled}
                  onChange={(e) => setAppSettings({ ...appSettings, notificationsEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">تفعيل الإشعارات</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={appSettings.emailNotificationsEnabled}
                  onChange={(e) => setAppSettings({ ...appSettings, emailNotificationsEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">إشعارات البريد الإلكتروني</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={appSettings.maintenanceMode}
                  onChange={(e) => setAppSettings({ ...appSettings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <label className="text-sm text-red-600 dark:text-red-400 font-medium">وضع الصيانة</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </form>
        </div>

        {/* منطقة خطرة */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400">منطقة خطرة</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجراءات لا يمكن التراجع عنها</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleResetSettings}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة ضبط الإعدادات
            </button>
            <button
              onClick={() => {
                if (confirm("⚠️ هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!")) {
                  alert("هذه الميزة قيد التطوير");
                }
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              حذف جميع البيانات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}