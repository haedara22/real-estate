"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Heart, Share2, MessageCircle, Copy
} from "lucide-react";

// استيراد أيقونات التواصل من react-icons
import { FaWhatsapp, FaFacebook, FaTwitter } from "react-icons/fa";

interface ActionButtonsProps {
  property: {
    id: string;
    title: string;
    agencyId: string | null;
  };
}

export function ActionButtons({ property }: ActionButtonsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // التحقق من حالة المفضلة
  useEffect(() => {
    async function checkFavorite() {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/favorites/check?propertyId=${property.id}`);
        const data = await response.json();
        setIsFavorite(data.isFavorite);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    }
    checkFavorite();
  }, [property.id, session]);

  // دالة إضافة/إزالة من المفضلة
  const toggleFavorite = async () => {
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        showToast(isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة إلى المفضلة");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة المشاركة
  const shareProperty = async (platform?: string) => {
    const url = window.location.href;
    const text = `🏠 شاهد هذا العقار الرائع: ${property.title}`;

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        showToast("تم نسخ الرابط!");
        return;
      } catch (error) {
        showToast("فشل في نسخ الرابط");
        return;
      }
    }

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };

    if (platform && shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank");
    } else if (navigator.share) {
      try {
        await navigator.share({ title: property.title, text, url });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast("تم نسخ الرابط!");
      } catch (error) {
        showToast("فشل في نسخ الرابط");
      }
    }
    setShowShareMenu(false);
  };

  // دالة التواصل مع الوكالة
  const sendMessage = async () => {
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!message.trim()) {
      showToast("يرجى كتابة رسالة");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          agencyId: property.agencyId,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        showToast("تم إرسال رسالتك بنجاح!");
        setMessage("");
        setShowContactModal(false);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  // عرض رسالة Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <>
      {/* Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* نموذج التواصل */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              تواصل مع الوكالة
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              أرسل استفسارك حول عقار: <strong>{property.title}</strong>
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="اكتب رسالتك هنا..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                إلغاء
              </button>
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-3">
        {/* زر التواصل */}
        <button
          onClick={() => {
            if (!session) {
              router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
            } else {
              setShowContactModal(true);
            }
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 group"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition" />
          تواصل مع الوكالة
        </button>

        {/* زر المفضلة */}
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 group ${
            isFavorite
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          <Heart className={`w-5 h-5 transition ${isFavorite ? "fill-white" : ""}`} />
          {isLoading ? "جاري..." : isFavorite ? "تمت الإضافة" : "إضافة إلى المفضلة"}
        </button>

        {/* زر المشاركة */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 group"
          >
            <Share2 className="w-5 h-5 group-hover:rotate-12 transition" />
            مشاركة العقار
          </button>

          {/* قائمة المشاركة */}
          {showShareMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-10 animate-fade-in-up">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => shareProperty("whatsapp")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition group"
                >
                  <FaWhatsapp className="w-8 h-8 text-green-500 group-hover:scale-110 transition" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">واتساب</span>
                </button>
                <button
                  onClick={() => shareProperty("facebook")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                >
                  <FaFacebook className="w-8 h-8 text-blue-600 group-hover:scale-110 transition" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">فيسبوك</span>
                </button>
                <button
                  onClick={() => shareProperty("twitter")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition group"
                >
                  <FaTwitter className="w-8 h-8 text-sky-500 group-hover:scale-110 transition" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">تويتر</span>
                </button>
                <button
                  onClick={() => shareProperty("copy")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                >
                  <Copy className="w-8 h-8 text-gray-500 group-hover:scale-110 transition" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">نسخ الرابط</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}