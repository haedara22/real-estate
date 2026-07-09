"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Calendar,
  User,
  FileText,
  X
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  price: string;
  descriptionAr: string;
  maxProperties: number;
  featuresAr: string[];
}

// ============================================
// المكون الداخلي (يستخدم useSearchParams)
// ============================================
function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const { data: session, status } = useSession();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [qrError, setQrError] = useState(false);

  // ✅ رقم شام كاش
  const shamCashNumber = "0991234567";

  // جلب الخطة
  useEffect(() => {
    async function fetchPlan() {
      if (!planId) {
        setError("معرف الخطة مطلوب");
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 جلب الخطة:", planId);
        const response = await fetch(`/api/subscriptions/plan/${planId}`);
        const data = await response.json();
        
        if (response.ok && data) {
          console.log("✅ تم جلب الخطة:", data);
          setPlan(data);
        } else {
          console.error("❌ الخطة غير موجودة:", data);
          setError("الخطة غير موجودة");
        }
      } catch (err) {
        console.error("❌ خطأ في جلب الخطة:", err);
        setError("حدث خطأ في تحميل الخطة");
      } finally {
        setLoading(false);
      }
    }

    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.push(`/login?callbackUrl=/subscribe?plan=${planId}`);
      } else {
        fetchPlan();
      }
    }
  }, [planId, status, router]);

  // معالجة رفع الإيصال
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // إرسال طلب الاشتراك
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!paymentProof) {
      setError("يرجى رفع صورة إيصال الدفع");
      setSubmitting(false);
      return;
    }

    try {
      // رفع الصورة
      const formData = new FormData();
      formData.append("paymentProof", paymentProof);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("فشل في رفع الإيصال");
      }

      const { urls } = await uploadResponse.json();

      // إرسال طلب الاشتراك
      const response = await fetch("/api/subscriptions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          paymentProof: urls[0],
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في إرسال الطلب");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/subscriptions/pending");
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  // خطة مجانية - تفعيل مباشر
  const handleFreeSubscription = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/subscriptions/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في تفعيل الخطة المجانية");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  // شاشة التحميل
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            الرابط الذي استخدمته قد يكون غير صحيح أو الخطة غير موجودة
          </p>
          <Link href="/pricing" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
            العودة للخطط
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الخطة غير موجودة</h2>
          <Link href="/pricing" className="text-blue-600 hover:underline mt-4 inline-block">
            العودة للخطط
          </Link>
        </div>
      </div>
    );
  }

  // الخطة المجانية
  if (plan.price === "0") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              تفعيل الخطة المجانية
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              أنت على وشك تفعيل خطة {plan.nameAr}
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-right">
              <h3 className="font-bold text-gray-900 dark:text-white">مميزات الخطة:</h3>
              <ul className="mt-2 space-y-1">
                {plan.featuresAr?.map((feature: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            {success ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-800 dark:text-green-200 font-semibold">
                  ✅ تم تفعيل الخطة المجانية بنجاح!
                </p>
              </div>
            ) : (
              <button
                onClick={handleFreeSubscription}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التفعيل...
                  </>
                ) : (
                  "تفعيل الخطة المجانية"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ الخطة المدفوعة - مع QR Code
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة للخطط
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-2xl font-bold">💳 تأكيد الاشتراك</h1>
            <p className="text-blue-100 mt-1">أكمل عملية الاشتراك لتفعيل خطتك</p>
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white">{plan.nameAr}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{plan.descriptionAr}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${plan.price}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/شهر</span>
              </div>
            </div>

            {/* ✅ قسم الدفع بشام كاش مع QR Code */}
            <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                📱 ادفع عبر شام كاش
              </h3>
              <div className="flex flex-col items-center">
                {/* ✅ عرض QR Code */}
                <div className="relative w-48 h-48 bg-white p-2 rounded-xl shadow-lg mx-auto">
                  {!qrError ? (
                    <Image
                      src="/qr.png"
                      alt="QR Code شام كاش"
                      fill
                      className="object-contain p-2"
                      onError={() => setQrError(true)}
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">QR Code غير متوفر</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  رقم شام كاش: <span className="font-bold text-blue-600">{shamCashNumber}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  المبلغ: <span className="font-bold">${plan.price}</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  ⚠️ بعد الدفع، قم برفع صورة الإيصال أدناه
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
                      ✅ تم إرسال طلب الاشتراك بنجاح!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      سيتم مراجعة طلبك من قبل الإدارة
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ رفع إيصال الدفع */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  صورة إيصال الدفع *
                </label>
                {paymentProofPreview ? (
                  <div className="relative">
                    <img
                      src={paymentProofPreview}
                      alt="إيصال الدفع"
                      className="w-full max-h-64 object-contain rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof(null);
                        setPaymentProofPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition text-center">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      انقر لرفع صورة الإيصال (jpg, png, pdf)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      required
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !paymentProof}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    إرسال طلب الاشتراك
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// الصفحة الرئيسية مع Suspense
// ============================================
export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}