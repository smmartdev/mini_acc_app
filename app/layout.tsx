import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "نظام المحاسبة",
  description: "تطبيق محاسبة بسيط",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body suppressHydrationWarning>
        <nav className="navbar">
          <Link href="/" className="navbar-brand">💰 نظام المحاسبة</Link>
          <Link href="/entities">الجهات المالية</Link>
          <Link href="/transactions/new">إضافة عملية</Link>
          <Link href="/transactions">العمليات</Link>
          <Link href="/transfers">التحويلات</Link>
          <Link href="/categories">الفئات</Link>
          <Link href="/report">التقرير الشهري</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}