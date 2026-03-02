"use client";

import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/providers/admin-guard";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminGuard>
      <Sidebar />
      <MobileSidebar />
      <main className="min-h-screen p-6 pt-20 md:ml-56 md:pt-6">
        {children}
      </main>
    </AdminGuard>
  );
}
