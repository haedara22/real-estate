"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminApproveButton({ requestId, userId, planId }: { requestId: string; userId: string; planId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApprove = async () => {
    if (!confirm("هل أنت متأكد من الموافقة على هذا الطلب؟")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/subscriptions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, userId, planId }),
      });

      if (!response.ok) {
        throw new Error("فشل في الموافقة");
      }

      router.refresh();
    } catch (error) {
      alert("حدث خطأ في الموافقة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 transition disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
    </button>
  );
}

export function AdminRejectButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReject = async () => {
    const reason = prompt("سبب الرفض (اختياري):");
    if (!confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/subscriptions/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, reason }),
      });

      if (!response.ok) {
        throw new Error("فشل في الرفض");
      }

      router.refresh();
    } catch (error) {
      alert("حدث خطأ في الرفض");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 transition disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
    </button>
  );
}