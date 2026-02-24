import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AdminGuard } from "@/components/providers/admin-guard";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HiTCF Admin",
  description: "HiTCF Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AdminGuard>
            <Sidebar />
            <MobileSidebar />
            <main className="min-h-screen p-6 pt-20 md:ml-56 md:pt-6">{children}</main>
          </AdminGuard>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
