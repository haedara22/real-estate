// src/app/(user)/properties/add/page.tsx

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// ✅ واجهات TypeScript
interface FormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  propertyType: string;
  transactionType: string;
  cityId: string;
  districtId: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
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

export default function AddPropertyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ✅ حالة النموذج
  const [formData, setFormData] = useState<FormData>({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    propertyType: 'apartment',
    transactionType: 'sale',
    cityId: '',
    districtId: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    isFeatured: false,
  });

  // ✅ التحقق من إمكانية إضافة عقار
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
      }
    } catch (error) {
      console.error('❌ فشل التحقق:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ جلب المدن
  const fetchCities = useCallback(async () => {
    try {
      const response = await fetch('/api/cities');
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('❌ فشل جلب المدن:', error);
    }
  }, []);

  // ✅ جلب الأحياء
  const fetchDistricts = useCallback(async () => {
    if (!formData.cityId) {
      setDistricts([]);
      return;
    }
    try {
      const response = await fetch(`/api/cities/${formData.cityId}/districts`);
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error('❌ فشل جلب الأحياء:', error);
    }
  }, [formData.cityId]);

  // ✅ تأثيرات الـ useEffect
  useEffect(() => {
    if (status === 'authenticated') {
      checkPermission();
      fetchCities();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, checkPermission, fetchCities]);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  // ✅ معالجة تغيير الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'isFeatured' && checked) {
      if (!canAdd.canFeature || canAdd.currentFeatured >= canAdd.maxFeatured) {
        setFeaturedWarning(`⚠️ لقد وصلت للحد الأقصى للعقارات المميزة (${canAdd.maxFeatured}). قم بترقية خطتك أو إلغاء تمييز عقار آخر.`);
        toast.error(`لا يمكن تمييز المزيد من العقارات. الحد الأقصى: ${canAdd.maxFeatured}`);
        return;
      } else {
        setFeaturedWarning(null);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ✅ معالجة رفع الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const maxImages = 10;
    if (images.length + files.length > maxImages) {
      toast.error(`يمكن رفع ${maxImages} صور كحد أقصى`);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('أنواع الملفات غير مدعومة. استخدم JPEG, PNG, WEBP, GIF أو SVG');
      return;
    }

    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setImages(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ حذف صورة
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ✅ إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeaturedWarning(null);

    try {
      if (!canAdd.allowed) {
        toast.error(canAdd.message || 'لا يمكنك إضافة عقار');
        setSubmitting(false);
        return;
      }

      if (!formData.titleAr || !formData.price || !formData.cityId || !formData.districtId) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        setSubmitting(false);
        return;
      }

      let isFeatured = formData.isFeatured;
      if (isFeatured && !canAdd.canFeature) {
        setFeaturedWarning(`⚠️ لا يمكنك تمييز هذا العقار. الحد الأقصى للعقارات المميزة (${canAdd.maxFeatured}) تم الوصول إليه.`);
        toast.error('لا يمكن تمييز العقار. لقد وصلت للحد الأقصى.');
        setSubmitting(false);
        return;
      }

      // 1️⃣ إضافة العقار
      const propertyResponse = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isFeatured,
          price: parseFloat(formData.price),
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          area: parseFloat(formData.area) || 0,
        }),
      });

      const propertyResult = await propertyResponse.json();

      if (!propertyResponse.ok) {
        throw new Error(propertyResult.error || 'فشل في إضافة العقار');
      }

      const propertyId = propertyResult.id;

      if (isFeatured) {
        toast.success('✅ تم إضافة العقار وتمييزه بنجاح!');
      } else {
        toast.success('تم إضافة العقار بنجاح');
      }

      // 2️⃣ رفع الصور
      if (images.length > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('propertyId', propertyId);

        images.forEach((image) => {
          uploadFormData.append('images', image);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          console.error('❌ فشل رفع الصور:', uploadResult);
          // ✅ استخدم toast.error بدلاً من toast.warning
          toast.error('⚠️ تم إضافة العقار ولكن فشل رفع بعض الصور');
        } else {
          toast.success(`تم رفع ${uploadResult.count} صورة بنجاح`);
        }
      }

      router.push(`/properties/${propertyId}`);

    } catch (error) {
      console.error('❌ خطأ:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ عرض التحميل
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحقق من صلاحياتك...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ عرض رسالة المنع
  if (!canAdd.allowed) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-700">لا يمكنك إضافة عقار</h2>
          <p className="text-red-600 mt-2 text-lg">{canAdd.message}</p>
          {canAdd.maxProperties > 0 && (
            <p className="text-sm text-red-500 mt-1">
              الحد الأقصى: {canAdd.maxProperties} عقار • المتبقي: {canAdd.remaining} عقار
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <a href="/agency/subscriptions" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              📊 عرض اشتراكاتي
            </a>
            <a href="/subscription/plans" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              🚀 ترقية الخطة
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ✅ النموذج الكامل
  return (
    <div className="container mx-auto p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* ✅ رأس الصفحة */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">🏠 إضافة عقار جديد</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {canAdd.planName && (
                <p className="text-sm text-gray-500">📋 خطة {canAdd.planName}</p>
              )}
              {canAdd.remaining !== undefined && canAdd.remaining !== 'غير محدود' ? (
                <p className={`text-sm ${Number(canAdd.remaining) <= 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  المتبقي: {canAdd.remaining} عقار
                </p>
              ) : (
                <p className="text-sm text-gray-500">♾️ غير محدود</p>
              )}
              <p className={`text-sm ${!canAdd.canFeature ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                ⭐ {canAdd.currentFeatured} / {canAdd.maxFeatured} مميز
                {!canAdd.canFeature && ' (مكتمل)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 transition px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ✕ إلغاء
          </button>
        </div>

        {/* ✅ تحذير التمييز */}
        {featuredWarning && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-yellow-800 font-semibold">تنبيه</p>
                <p className="text-yellow-700 text-sm">{featuredWarning}</p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ تحذير باقي العقارات */}
        {canAdd.remaining !== undefined && canAdd.remaining !== 'غير محدود' && Number(canAdd.remaining) <= 2 && Number(canAdd.remaining) > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-700 text-sm">
              ⚠️ تبقى لك {canAdd.remaining} عقار فقط في هذه الخطة. قد تحتاج إلى ترقية خطتك قريباً.
            </p>
          </div>
        )}

        {/* ✅ النموذج */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* ✅ معلومات أساسية */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">📝 معلومات العقار</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titleAr"
                  value={formData.titleAr}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="مثال: شقة فاخرة للبيع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان (English)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Example: Luxury Apartment for Sale"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (عربي) <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="وصف مفصل للعقار..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (English)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Detailed property description..."
                />
              </div>
            </div>
          </div>

          {/* ✅ تفاصيل العقار */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">🏷️ تفاصيل العقار</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعر (شام كاش) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع العقار <span className="text-red-500">*</span>
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع العملية <span className="text-red-500">*</span>
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="sale">بيع</option>
                  <option value="rent">إيجار</option>
                  <option value="exchange">مبادلة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد الغرف
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد الحمامات
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المساحة (م²)
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ✅ الموقع */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">📍 الموقع</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المدينة <span className="text-red-500">*</span>
                </label>
                <select
                  name="cityId"
                  value={formData.cityId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحي <span className="text-red-500">*</span>
                </label>
                <select
                  name="districtId"
                  value={formData.districtId}
                  onChange={handleChange}
                  required
                  disabled={!formData.cityId}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان التفصيلي
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="مثال: شارع الرئيسي، مقابل البنك..."
                />
              </div>
            </div>
          </div>

          {/* ✅ رفع الصور */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">🖼️ صور العقار</h2>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                📤 اختر صور
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="text-sm text-gray-500">
                {images.length} / 10 صور
              </span>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={preview}
                      alt={`صورة ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ✅ خيارات إضافية */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">⚙️ خيارات إضافية</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  disabled={!canAdd.canFeature}
                  className={`w-5 h-5 rounded focus:ring-2 focus:ring-blue-500 transition ${
                    !canAdd.canFeature ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <label htmlFor="isFeatured" className={`text-sm ${!canAdd.canFeature ? 'text-gray-400' : 'text-gray-700'}`}>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <span>🚫</span>
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
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري الإضافة...
                </>
              ) : (
                '🏠 إضافة العقار'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}