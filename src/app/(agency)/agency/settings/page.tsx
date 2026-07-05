"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  X,
  Shield,
  CreditCard,
  LogOut,
  Home,
  Store
} from "lucide-react";

interface AgencyData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  isActive: boolean;
}

export default function AgencySettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // بيانات الوكالة
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });
  
  // الصور
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // جلب بيانات الوكالة
  useEffect(() => {
    async function fetchAgency() {
      try {
        const response = await fetch("/api/agency/settings");
        const data = await response.json();
        
        if (response.ok && data.agency) {
          setAgency(data.agency);
          setFormData({
            name: data.agency.name || "",
            description: data.agency.description || "",
            address: data.agency.address || "",
            phone: data.agency.phone || "",
            email: data.agency.email || "",
            website: data.agency.website || "",
          });
          if (data.agency.logo) setLogoPreview(data.agency.logo);
          if (data.agency.coverImage) setCoverPreview(data.agency.coverImage);
        } else {
          setError(data.error || "فشل في جلب بيانات الوكالة");
        }
      } catch (err) {
        setError("حدث خطأ في جلب بيانات الوكالة");
      } finally {
        setFetching(false);
      }
    }
    
    fetchAgency();
  }, []);

  // معالجة تغييرات النموذج
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // معالجة رفع الشعار
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("حجم الشعار يجب أن يكون أقل من 2 ميجابايت");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // معالجة رفع صورة الغلاف
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("حجم صورة الغلاف يجب أن يكون أقل من 5 ميجابايت");
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // حفظ الإعدادات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. رفع الشعار إذا تم تغييره
      let logoUrl = agency?.logo || null;
      if (logoFile) {
        const formDataImages = new FormData();
        formDataImages.append("images", logoFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataImages,
        });
        if (uploadResponse.ok) {
          const { urls } = await uploadResponse.json();
          logoUrl = urls[0];
        }
      }

      // 2. رفع صورة الغلاف إذا تم تغييرها
      let coverUrl = agency?.coverImage || null;
      if (coverFile) {
        const formDataImages = new FormData();
        formDataImages.append("images", coverFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataImages,
        });
        if (uploadResponse.ok) {
          const { urls } = await uploadResponse.json();
          coverUrl = urls[0];
        }
      }

      // 3. تحديث بيانات الوكالة
      const response = await fetch("/api/agency/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logo: logoUrl,
          coverImage: coverUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في تحديث الإعدادات");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // تحديث الجلسة
      await update();
      
      // تحديث البيانات المحلية
      if (data.agency) {
        setAgency(data.agency);
        setLogoPreview(data.agency.logo || null);
        setCoverPreview(data.agency.coverImage || null);
        setLogoFile(null);
        setCoverFile(null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* العنوان */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⚙️ إعدادات الوكالة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            تحديث معلومات وكالتك
          </p>
        </div>
        {agency?.isVerified && (
          <span className="flex items-center gap-1 text-sm bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">
            <Shield className="w-4 h-4" />
            موثقة
          </span>
        )}
      </div>

      {/* رسائل الحالة */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-200">✅ تم تحديث الإعدادات بنجاح!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* الصور */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🖼️ الصور
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* الشعار */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شعار الوكالة
              </label>
              <div className="relative">
                {logoPreview ? (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <Image
                      src={logoPreview}
                      alt="شعار الوكالة"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-blue-500 transition">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      رفع الشعار
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                الحد الأقصى: 2 ميجابايت
              </p>
            </div>

            {/* صورة الغلاف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                صورة الغلاف
              </label>
              <div className="relative">
                {coverPreview ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <Image
                      src={coverPreview}
                      alt="صورة الغلاف"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setCoverFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-blue-500 transition">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      رفع صورة الغلاف
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                الحد الأقصى: 5 ميجابايت
              </p>
            </div>
          </div>
        </div>

        {/* معلومات الوكالة */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            <Building className="w-5 h-5 inline ml-2" />
            معلومات الوكالة
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم الوكالة *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الوصف
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="وصف الوكالة وخدماتها..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                العنوان
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="دمشق، سوريا"
              />
            </div>
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📞 معلومات الاتصال
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="+963 11 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="info@agency.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Globe className="w-4 h-4" />
                الموقع الإلكتروني
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.agency.com"
              />
            </div>
          </div>
        </div>

        {/* أزرار الإجراء */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </>
            )}
          </button>
          <Link
            href="/agency/dashboard"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}