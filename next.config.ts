import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <- أضف هذا السطر

  // اختياري: إذا كنت تريد مسارات مثل /about/ بدلاً من /about.html
  // trailingSlash: true,

  // اختياري: تغيير مجلد الإخراج من 'out' إلى اسم آخر
  // distDir: 'dist',
};

export default nextConfig;