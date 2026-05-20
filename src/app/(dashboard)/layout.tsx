import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LogoutForm } from "@/components/layout/logout-form";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session.isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar session={session} />
      <div className="min-h-screen lg:pl-64">
        <AppHeader logoutSlot={<LogoutForm />} session={session} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
