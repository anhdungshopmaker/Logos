import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Brand Wall Vietnam - Khám phá thương hiệu Việt",
  description: "Khám phá hàng nghìn thương hiệu doanh nghiệp Việt Nam. Tìm kiếm, lọc theo tỉnh thành và ngành nghề.",
  keywords: "thương hiệu Việt Nam, doanh nghiệp, logo, brand wall",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={outfit.variable}>{children}</body>
    </html>
  );
}
