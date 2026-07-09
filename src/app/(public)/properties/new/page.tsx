// src/app/(user)/properties/new/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  X,
  Plus,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Upload,
  MapPin,
  Home,
  Bath,
  Bed,
  Ruler,
  DollarSign,
  Tag,
  Building,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock,
  Star,
} from "lucide-react";

// ✅ واجهات TypeScript
interface City {
  id: string;
  nameAr: string;
}

interface District {
  id: string;
  nameAr: string;
}

interface FormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  purpose: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  cityId: string;
  districtId: string;
  address: string;
  isFeatured: boolean;
}

interface CanAddResponse {
  allowed: boolean;
  message: string;
  remaining: number | string;
  maxProperties: number;
  planName: string;
  maxFeatured: number;
  currentFeatured: number;
  canFeature: boolean;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ✅ صلاحية الإضافة
  const [canAdd, setCanAdd] = useState<CanAddResponse>({
    allowed: true,
    message: '',
    remaining: 0,
    maxProperties: 0,
    planName: '',
    maxFeatured: 0,
    currentFeatured: 0,
    canFeature: true,
  });
  const [featuredWarning, setFeaturedWarning] = useState<string | null>(null);

  // المدن والأحياء
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  // الصور
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // بيانات النموذج
  const [formData, setFormData] = useState<FormData>({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    purpose: "sale",
    type: "apartment",
    bedrooms: "",
    bathrooms: "",
    area: "",
    cityId: "",
    districtId: "",
    address: "",
    isFeatured: false,
  });

  // ✅ التحقق من الصلاحية
  const checkPermission = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/check-property?_=' + Date.now());
      const result = await response.json();

      setCanAdd({
        ...result,
        canFeature: result.canFeature !== undefined ? result.canFeature : (result.currentFeatured < result.maxFeatured),
      });

      if (result.currentFeatured >= result.maxFeatured) {
        setFormData(prev => ({ ...prev, isFeatured: false }));
        setFeaturedWarning(`⚠️ لقد وصلت للحد الأقصى للعقارات المميزة (${result.maxFeatured}). لا يمكنك تمييز عقارات جديدة.`);
      }

      if (!result.allowed) {
        toast.error(result.message || 'لا يمكنك إضافة عقار');
        setTimeout(() => router.push('/agency/subscriptions'), 2000);
      }
    } catch (error) {
      console.error('❌ فشل التحقق:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ✅ التحقق من المصادقة
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/properties/new");
    } else if (status === "authenticated") {
      checkPermission();
    }
  }, [status, router, checkPermission]);

  // ✅ جلب المدن
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch("/api/cities");
        const data = await response.json();
        if (response.ok) {
          setCities(data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoadingCities(false);
      }
    }
    fetchCities();
  }, []);

  // ✅ جلب الأحياء
  useEffect(() => {
    async function fetchDistricts() {
      if (!formData.cityId) {
        setDistricts([]);
        return;
      }
      try {
        const response = await fetch(`/api/cities/${formData.cityId}/districts`);
        const data = await response.json();
        if (response.ok) {
          setDistricts(data);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    }
    fetchDistricts();
  }, [formData.cityId]);

  // ✅ معالجة الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast.error("يمكن رفع 10 صور كحد أقصى");
      return;
    }

    // ✅ التحقق من أنواع الملفات
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('أنواع الملفات غير مدعومة. استخدم JPEG, PNG, WEBP, GIF أو SVG');
      return;
    }

    // ✅ التحقق من حجم الملف
    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (mainImageIndex >= images.length - 1) {
      setMainImageIndex(Math.max(0, images.length - 2));
    }
  };

  // ✅ معالجة تغييرات النموذج
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // ✅ منع تمييز العقار إذا كان غير مسموح
    if (name === "isFeatured" && checked) {
      if (!canAdd.canFeature || canAdd.currentFeatured >= canAdd.maxFeatured) {
        setFeaturedWarning(`⚠️ لقد وصلت للحد الأقصى للعقارات المميزة (${canAdd.maxFeatured}).`);
        toast.error(`لا يمكن تمييز المزيد من العقارات. الحد الأقصى: ${canAdd.maxFeatured}`);
        return;
      } else {
        setFeaturedWarning(null);
      }
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ✅ إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    setFeaturedWarning(null);

    // ✅ التحقق من الصلاحية
    if (!canAdd.allowed) {
      toast.error(canAdd.message || 'لا يمكنك إضافة عقار');
      setSubmitting(false);
      return;
    }

    // ✅ التحقق من الحقول المطلوبة
    if (!formData.titleAr || !formData.price || !formData.cityId) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      setSubmitting(false);
      return;
    }

    if (images.length === 0) {
      setError("يرجى رفع صورة واحدة على الأقل");
      toast.error("يرجى رفع صورة واحدة على الأقل");
      setSubmitting(false);
      return;
    }

    // ✅ التحقق من تمييز العقار
    let isFeatured = formData.isFeatured;
    if (isFeatured && !canAdd.canFeature) {
      setFeaturedWarning(`⚠️ لا يمكنك تمييز هذا العقار. الحد الأقصى للعقارات المميزة (${canAdd.maxFeatured}) تم الوصول إليه.`);
      toast.error('لا يمكن تمييز العقار. لقد وصلت للحد الأقصى.');
      setSubmitting(false);
      return;
    }

    try {
      // ✅ 1️⃣ إنشاء العقار
      const propertyData = {
        ...formData,
        isFeatured,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area: formData.area ? parseFloat(formData.area) : null,
      };

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في إضافة العقار");
      }

      const propertyId = data.id;

      // ✅ عرض رسالة حسب حالة التمييز
      if (isFeatured) {
        toast.success('✅ تم إضافة العقار وتمييزه بنجاح!');
      } else if (formData.isFeatured && !isFeatured) {
        // ✅ استخدم toast.error بدلاً من toast.warning (لأن react-hot-toast لا يدعم warning)
        toast.error('⚠️ تم إضافة العقار بدون تمييز (وصلت للحد الأقصى)');
      } else {
        toast.success('تم إضافة العقار بنجاح');
      }

      // ✅ 2️⃣ رفع الصور
      setUploading(true);
      const formDataImages = new FormData();
      images.forEach((image) => {
        formDataImages.append("images", image);
      });
      formDataImages.append("propertyId", propertyId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formDataImages,
      });

      if (!uploadResponse.ok) {
        throw new Error("فشل في رفع الصور");
      }

      const uploadData = await uploadResponse.json();
      setUploading(false);

      if (uploadData.count > 0) {
        toast.success(`تم رفع ${uploadData.count} صورة بنجاح`);
      }

      // ✅ 3️⃣ تحديث العقار بالصور
      if (uploadData.urls && uploadData.urls.length > 0) {
        await fetch(`/api/properties/${propertyId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: uploadData.urls.map((url: string, index: number) => ({
              url,
              isMain: index === 0,
              order: index,
            })),
          }),
        });
      }

      setSuccess(true);
      toast.success('🎉 تم إضافة العقار بنجاح!');

      setTimeout(() => {
        router.push(`/properties/${data.slug || data.id}`);
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // ✅ عرض شاشة التحميل
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من صلاحياتك...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !canAdd.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">لا يمكنك إضافة عقار</h2>
          <p className="text-red-600 dark:text-red-300 mt-2">{canAdd.message || "ليس لديك صلاحية"}</p>
          {canAdd.maxProperties > 0 && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-2">
              الحد الأقصى: {canAdd.maxProperties} عقار • المتبقي: {canAdd.remaining} عقار
            </p>
          )}
          <div className="flex flex-col gap-3 mt-6">
            <a
              href="/agency/subscriptions"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              📊 عرض اشتراكاتي
            </a>
            <a
              href="/subscription/plans"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              🚀 ترقية الخطة
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* ✅ العنوان مع معلومات الاشتراك */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                ➕ إضافة عقار جديد
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  📋 خطة {canAdd.planName || 'غير محددة'}
                </span>
                {canAdd.remaining !== undefined && canAdd.remaining !== 'غير محدود' ? (
                  <span className={`text-sm ${Number(canAdd.remaining) <= 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    المتبقي: {canAdd.remaining} عقار
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">♾️ غير محدود</span>
                )}
                <span className={`text-sm ${!canAdd.canFeature ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  ⭐ {canAdd.currentFeatured} / {canAdd.maxFeatured} مميز
                  {!canAdd.canFeature && ' (مكتمل)'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ✕ إلغاء
            </button>
          </div>

          {/* ✅ تحذير التمييز */}
          {featuredWarning && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-semibold">تنبيه</p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">{featuredWarning}</p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ تحذير باقي العقارات */}
          {canAdd.remaining !== undefined && canAdd.remaining !== 'غير محدود' && Number(canAdd.remaining) <= 2 && Number(canAdd.remaining) > 0 && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <p className="text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ⚠️ تبقى لك {canAdd.remaining} عقار فقط في هذه الخطة. قد تحتاج إلى ترقية خطتك قريباً.
              </p>
            </div>
          )}
        </div>

        {/* ✅ نموذج إضافة العقار */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ✅ رسائل الحالة */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ تم إضافة العقار بنجاح! جاري التحويل...
              </p>
            </div>
          )}

          {/* ✅ الصور */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              صور العقار <span className="text-red-500">*</span>
              <span className="text-sm font-normal text-gray-500">({images.length}/10)</span>
            </h2>

            <div className="mb-4">
              <label className="block w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition">
                <div className="text-center">
                  <Upload className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    انقر لرفع الصور (الحد الأقصى 10 صور)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPEG, PNG, WEBP, GIF, SVG • حتى 5 ميجابايت لكل صورة
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={preview}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainImageIndex(index)}
                        className={`p-1.5 rounded-full transition ${
                          mainImageIndex === index
                            ? "bg-green-500"
                            : "bg-gray-500 hover:bg-gray-600"
                        }`}
                      >
                        <Star className={`w-4 h-4 text-white ${mainImageIndex === index ? 'fill-white' : ''}`} />
                      </button>
                    </div>
                    {mainImageIndex === index && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                        رئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ معلومات العقار */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              معلومات العقار
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  العنوان (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titleAr"
                  value={formData.titleAr}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: شقة فاخرة في وسط دمشق"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  العنوان (English)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Example: Luxury Apartment in Damascus"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الوصف (عربي) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف مفصل للعقار..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الوصف (English)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed property description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  السعر (شام كاش) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="250000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الغرض <span className="text-red-500">*</span>
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sale">للبيع</option>
                  <option value="rent">للإيجار</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  نوع العقار <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartment">شقة</option>
                  <option value="villa">فيلا</option>
                  <option value="house">منزل</option>
                  <option value="land">أرض</option>
                  <option value="commercial">تجاري</option>
                  <option value="office">مكتب</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  غرف النوم
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  الحمامات
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  المساحة (م²)
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="120"
                />
              </div>
            </div>
          </div>

          {/* ✅ الموقع */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              الموقع
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  المدينة <span className="text-red-500">*</span>
                </label>
                <select
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الحي <span className="text-red-500">*</span>
                </label>
                <select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.cityId}
                >
                  <option value="">اختر الحي</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  العنوان التفصيلي
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: شارع الثورة، مقابل البنك المركزي"
                />
              </div>
            </div>
          </div>

          {/* ✅ خيارات إضافية */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              خيارات إضافية
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  disabled={!canAdd.canFeature}
                  className={`w-5 h-5 rounded focus:ring-2 focus:ring-blue-500 transition ${
                    !canAdd.canFeature ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <label htmlFor="isFeatured" className={`text-sm ${!canAdd.canFeature ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  ⭐ تمييز العقار (ظهور مميز في نتائج البحث)
                  {!canAdd.canFeature && (
                    <span className="text-red-500 block text-xs font-semibold">
                      🚫 لقد وصلت للحد الأقصى للعقارات المميزة ({canAdd.maxFeatured})
                    </span>
                  )}
                  {canAdd.canFeature && canAdd.maxFeatured > 0 && (
                    <span className="text-gray-400 block text-xs">
                      المتبقي: {canAdd.maxFeatured - canAdd.currentFeatured} عقار مميز
                    </span>
                  )}
                </label>
              </div>

              {!canAdd.canFeature && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    لا يمكنك تمييز عقارات جديدة. قم بترقية خطتك أو إلغاء تمييز عقار موجود.
                    <a href="/agency/subscriptions" className="text-blue-600 hover:underline font-semibold">
                      عرض الاشتراكات
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ أزرار الإجراء */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || !canAdd.allowed}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? "جاري رفع الصور..." : "جاري النشر..."}
                </>
              ) : (
                "🏠 نشر العقار"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}