"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  AlertCircle
} from "lucide-react";

// أنواع البيانات
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
  description: string;
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

export default function NewPropertyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // المدن والأحياء
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  
  // الصور
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  // بيانات النموذج
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
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

  // التحقق من المصادقة وإعادة التوجيه
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/properties/new");
    }
  }, [status, router]);

  // جلب المدن
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

  // جلب الأحياء عند اختيار مدينة
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

  // معالجة الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      setError("يمكن رفع 10 صور كحد أقصى");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // إنشاء معاينات
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
    if (mainImageIndex >= newImages.length) {
      setMainImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  // معالجة تغييرات النموذج
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // إرسال النموذج
 // إرسال النموذج
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess(false);

  // التحقق من البيانات
  if (!formData.title || !formData.price || !formData.cityId) {
    setError("يرجى ملء جميع الحقول المطلوبة");
    setLoading(false);
    return;
  }

  if (images.length === 0) {
    setError("يرجى رفع صورة واحدة على الأقل");
    setLoading(false);
    return;
  }

  try {
    // ✅ الخطوة 1: إنشاء العقار أولاً (بدون صور)
    const propertyData = {
      ...formData,
      price: parseFloat(formData.price),
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      area: formData.area ? parseFloat(formData.area) : null,
      images: [], // ✅ لا نرسل صور هنا
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

    // ✅ الخطوة 2: رفع الصور باستخدام ID العقار الجديد
    setUploading(true);
    const formDataImages = new FormData();
    images.forEach((image) => {
      formDataImages.append("images", image);
    });
    formDataImages.append("propertyId", data.id); // ✅ الآن لدينا ID حقيقي

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formDataImages,
    });

    if (!uploadResponse.ok) {
      throw new Error("فشل في رفع الصور");
    }

    const uploadData = await uploadResponse.json();
    setUploading(false);

    // ✅ الخطوة 3: تحديث العقار بالصور (اختياري - إذا كنت تريد حفظ الصور في قاعدة البيانات)
    if (uploadData.urls && uploadData.urls.length > 0) {
      await fetch(`/api/properties/${data.id}/images`, {
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
    setTimeout(() => {
      router.push(`/properties/${data.slug}`);
    }, 2000);

  } catch (err) {
    setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
  } finally {
    setLoading(false);
    setUploading(false);
  }
};

  // عرض شاشة التحميل
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // إذا كان المستخدم غير مسجل، لا نعرض أي شيء (useEffect سيعيد التوجيه)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* العنوان */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ➕ إضافة عقار جديد
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            أضف عقارك وسيظهر للمشترين والمستأجرين في جميع أنحاء سوريا
          </p>
        </div>

        {/* نموذج إضافة العقار */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* رسائل الحالة */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
              <div className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5">✅</div>
              <p className="text-sm text-green-800 dark:text-green-200">
                تم إضافة العقار بنجاح! جاري التحويل...
              </p>
            </div>
          )}

          {/* الصور */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              صور العقار
            </h2>

            {/* رفع الصور */}
            <div className="mb-4">
              <label className="block w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition">
                <div className="text-center">
                  <Upload className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    انقر لرفع الصور (الحد الأقصى 10 صور)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* معاينة الصور */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
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
                        onClick={() => setMainImage(index)}
                        className={`p-1.5 rounded-full transition ${
                          mainImageIndex === index
                            ? "bg-green-500"
                            : "bg-gray-500 hover:bg-gray-600"
                        }`}
                      >
                        <span className="text-white text-xs">
                          {mainImageIndex === index ? "⭐" : "★"}
                        </span>
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

          {/* معلومات العقار */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              معلومات العقار
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* عنوان العقار */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  عنوان العقار *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: شقة فاخرة في وسط دمشق"
                  required
                />
              </div>

              {/* الوصف */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  وصف العقار
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="صف عقارك بالتفصيل..."
                />
              </div>

              {/* السعر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  السعر *
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

              {/* الغرض */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الغرض *
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sale">للبيع</option>
                  <option value="rent">للإيجار</option>
                  <option value="both">للبيع والإيجار</option>
                </select>
              </div>

              {/* نوع العقار */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  نوع العقار *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartment">شقة</option>
                  <option value="villa">فيلا</option>
                  <option value="land">أرض</option>
                  <option value="shop">محل تجاري</option>
                  <option value="office">مكتب</option>
                  <option value="building">بناء</option>
                  <option value="warehouse">مستودع</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              {/* غرف النوم */}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="3"
                />
              </div>

              {/* الحمامات */}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="2"
                />
              </div>

              {/* المساحة */}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="120"
                />
              </div>
            </div>
          </div>

          {/* الموقع */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              الموقع
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* المدينة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  المدينة *
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

              {/* الحي */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الحي
                </label>
                <select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر الحي</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* العنوان التفصيلي */}
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

          {/* خيارات إضافية */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              خيارات إضافية
            </h2>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                عقار مميز (يظهر في الصفحة الرئيسية)
              </label>
            </div>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading || uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading ? "جاري رفع الصور..." : "جاري النشر..."}
                </>
              ) : (
                "نشر العقار"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}