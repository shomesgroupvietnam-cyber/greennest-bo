"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { getPermittedNavItems } from "@/components/layout/app-sidebar";
import { getClientSessionSnapshot } from "@/lib/auth/client-session";
import type { PermissionUser } from "@/lib/permissions/can";

type HeaderSession = {
  user: PermissionUser & {
    fullName?: string;
  };
  defaultScreen: {
    label: string;
    href: string;
  };
};

export function AppHeader({ logoutSlot, session }: { logoutSlot?: ReactNode; session?: HeaderSession }) {
  const resolvedSession = session ?? getClientSessionSnapshot();
  const navItems = getPermittedNavItems(resolvedSession.user);

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="flex min-h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-slate-950">GreenNest BuildFlow</p>
          <p className="text-xs text-slate-500">{resolvedSession.defaultScreen.label}</p>
        </div>
        <div className="flex items-center gap-3 text-right text-sm text-slate-600">
          <div>
            <p>{resolvedSession.user.fullName ?? resolvedSession.user.id}</p>
            <p className="text-xs text-slate-500">{resolvedSession.user.role}</p>
          </div>
          {logoutSlot}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden" aria-label="Điều hướng di động">
        {navItems.map((item) => (
          <Link
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
