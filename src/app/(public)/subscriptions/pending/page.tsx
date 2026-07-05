"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle
} from "lucide-react";

interface SubscriptionRequest {
  id: string;
  status: string;
  amount: string;
  currency: string;
  planName: string;
  planNameAr: string;
  createdAt: string;
  paymentProof: string | null;
}

export default function PendingSubscriptionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // جلب طلبات الاشتراك
  useEffect(() => {
    async function fetchRequests() {
      try {
        const response = await fetch("/api/subscriptions/my-requests");
        const data = await response.json();
        
        if (response.ok) {
          setRequests(data);
        } else {
          setError(data.error || "فشل في جلب الطلبات");
        }
      } catch (err) {
        setError("حدث خطأ في جلب الطلبات");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchRequests();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscriptions/pending");
    }
  }, [status, router]);

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string; icon: any }> = {
      pending: { 
        label: "⏳ قيد المراجعة", 
        color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
        icon: Clock
      },
      approved: { 
        label: "✅ تم الموافقة", 
        color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300",
        icon: CheckCircle
      },
      rejected: { 
        label: "❌ مرفوض", 
        color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300",
        icon: XCircle
      },
      expired: { 
        label: "⏰ منتهي", 
        color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
        icon: Clock
      },
    };
    return statuses[status] || statuses.pending;
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* زر العودة */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة للرئيسية
        </Link>

        {/* العنوان */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📋 طلبات الاشتراك
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            حالة طلبات الاشتراك الخاصة بك
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingCount}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">قيد المراجعة</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {approvedCount}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">تم الموافقة</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {rejectedCount}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">مرفوض</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* قائمة الطلبات */}
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              لا توجد طلبات اشتراك
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              لم تقم بإرسال أي طلب اشتراك حتى الآن
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              استعراض الخطط
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const statusBadge = getStatusBadge(req.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {req.planNameAr}
                        </h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${statusBadge.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${req.amount} {req.currency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                    {req.paymentProof && (
                      <a
                        href={req.paymentProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        عرض الإيصال
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* رسالة للمستخدم */}
        {pendingCount > 0 && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  ⏳ طلباتك قيد المراجعة
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  سيتم مراجعة طلبك من قبل الإدارة خلال ٢٤ ساعة. ستتلقى إشعاراً عند الموافقة.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}