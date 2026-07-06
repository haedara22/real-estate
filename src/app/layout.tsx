import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layouts/Header";
import "@/lib/browser"; // ✅ أضف هذا السطر في البداية
import "@/lib/url-polyfill"; // ✅ أضف هذا السطر في البداية

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "سوريا للعقارات",
  description: "منصة العقارات الرائدة في سوريا",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}