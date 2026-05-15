"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuth) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
