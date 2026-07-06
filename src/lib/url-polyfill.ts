// src/lib/url-polyfill.ts
// هذا الملف يحل مشكلة URL في بيئة البناء

if (typeof window === 'undefined') {
  // حفظ الـ URL الأصلي
  const OriginalURL = globalThis.URL;
  
  // إعادة تعريف URL بشكل آمن
  (globalThis as any).URL = class SafeURL extends OriginalURL {
    constructor(url: string, base?: string | URL) {
      try {
        // إذا كان url ليس نصاً، حوله إلى نص
        const urlStr = typeof url === 'string' ? url : String(url);
        super(urlStr, base);
      } catch (error) {
        // إذا فشل، استخدم base افتراضي
        const baseStr = base ? String(base) : 'http://localhost:3000';
        super(url, baseStr);
      }
    }
  };
}