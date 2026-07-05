import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          العقار غير موجود
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          عذراً، لم نتمكن من العثور على العقار الذي تبحث عنه
        </p>
        <Link
          href="/properties"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          العودة إلى العقارات
        </Link>
      </div>
    </div>
  );
}