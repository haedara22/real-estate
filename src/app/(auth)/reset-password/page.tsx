"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Lock, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

// ============================================
// المكون الداخلي (يستخدم useSearchParams)
// ============================================
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  const [token, setToken] = useState(tokenFromUrl || "");
  const [email, setEmail] = useState(emailFromUrl || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);

  // ✅ التحقق من صحة الرمز
  useEffect(() => {
    async function validateToken() {
      if (!token || !email) {
        setTokenValid(false);
        setCheckingToken(false);
        setError("الرمز والبريد الإلكتروني مطلوبان");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/validate-reset-token?token=${token}&email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.error || "الرمز غير صالح أو منتهي الصلاحية");
        }
      } catch (err) {
        setTokenValid(false);
        setError("حدث خطأ في التحقق من الرمز");
      } finally {
        setCheckingToken(false);
      }
    }

    if (token && email) {
      validateToken();
    } else {
      setCheckingToken(false);
    }
  }, [token, email]);

  // ✅ إعادة تعيين كلمة المرور
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ شاشة التحقق من الرمز
  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ❌ الرمز غير صالح
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            الرقم غير صالح
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "رمز إعادة التعيين غير صالح أو منتهي الصلاحية"}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            طلب رمز جديد
          </Link>
        </div>
      </div>
    );
  }

  // ✅ تم إعادة التعيين بنجاح
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ✅ تم إعادة تعيين كلمة المرور
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // 📝 نموذج إعادة التعيين
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة لتسجيل الدخول
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              أدخل كلمة مرور جديدة لحسابك
            </p>
            {email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                🔑 البريد: <span className="font-medium">{email}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* كلمة المرور الجديدة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                8 أحرف على الأقل
              </p>
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
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

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري إعادة التعيين...
                </>
              ) : (
                "إعادة تعيين كلمة المرور"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================
// الصفحة الرئيسية مع Suspense
// ============================================
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}