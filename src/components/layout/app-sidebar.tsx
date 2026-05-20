"use client";

import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Construction,
  FileText,
  Gavel,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Video
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { getClientSessionSnapshot } from "@/lib/auth/client-session";
import type { PermissionUser } from "@/lib/permissions/can";
import {
  getPermittedNavItems as resolvePermittedNavItems,
  NAV_ITEMS,
  type NavigationIconKey
} from "@/lib/permissions/navigation";
import { cn } from "@/lib/utils";

type NavigationSession = {
  user: PermissionUser;
  defaultScreen: {
    label: string;
    href: string;
  };
};

const ICONS: Record<NavigationIconKey, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>> = {
  audit: ShieldCheck,
  briefcase: BriefcaseBusiness,
  building: Building2,
  clipboard: ClipboardList,
  construction: Construction,
  dashboard: LayoutDashboard,
  file: FileText,
  gavel: Gavel,
  shield: ShieldCheck,
  settings: Settings,
  sparkles: Sparkles,
  users: Users,
  video: Video
};

export { NAV_ITEMS };

export function getPermittedNavItems(user: PermissionUser) {
  return resolvePermittedNavItems(user);
}

export function AppSidebar({ session }: { session?: NavigationSession }) {
  const pathname = usePathname();
  const resolvedSession = session ?? getClientSessionSnapshot();
  const navItems = getPermittedNavItems(resolvedSession.user);

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white lg:block">
      <div className="border-b px-5 py-4">
        <p className="text-sm font-semibold text-slate-950">GreenNest BuildFlow</p>
        <p className="text-xs text-slate-500">{resolvedSession.defaultScreen.label}</p>
      </div>
      <nav className="space-y-1 p-3" aria-label="Điều hướng chính">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100",
                isActive && "bg-emerald-50 text-emerald-700"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
