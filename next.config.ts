import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ❌ احذف output: export
  // output: 'export',
  
  // ✅ الإعدادات الصحيحة
  typescript: {
    ignoreBuildErrors: true,
  },
  // ❌ احذف eslint من هنا
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  
  // ✅ بدلاً من ذلك، استخدم هذا
  experimental: {
    // أي إعدادات تجريبية
  },
};

export default nextConfig;