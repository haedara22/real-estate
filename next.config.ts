// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ تجاهل أخطاء ESLint أثناء البناء (لـ Netlify)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ✅ تجاهل أخطاء TypeScript أثناء البناء
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ إعدادات الصور
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // ✅ تحسين الأداء
  experimental: {
    optimizeCss: true,
  },
  // ✅ إعدادات إضافية
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;