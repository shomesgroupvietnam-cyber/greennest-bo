"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { type ReactNode } from "react";

import { getClientSessionSnapshot } from "@/lib/auth/client-session";
import type { PermissionUser } from "@/lib/permissions/can";
import {
  getPermittedNavItems,
  type NavigationItem,
  type ShellContext,
} from "@/lib/permissions/navigation";

type HeaderSession = {
  user: PermissionUser & {
    fullName?: string;
  };
  defaultScreen: {
    label: string;
    href: string;
  };
};

export function AppHeader({
  logoutSlot,
  navItems,
  session,
  shellContext,
}: {
  logoutSlot?: ReactNode;
  navItems?: NavigationItem[];
  session?: HeaderSession;
  shellContext?: ShellContext;
}) {
  const router = useRouter();
  const resolvedSession = session ?? getClientSessionSnapshot();
  const resolvedNavItems = navItems ?? getPermittedNavItems(resolvedSession.user);
  const workspaceLabel =
    shellContext?.currentWorkspaceLabel ?? resolvedSession.defaultScreen.label;
  const scopeLabel = shellContext?.currentScopeLabel ?? "Tất cả phạm vi được cấp";
  const workspaceOptions = shellContext?.workspaceOptions ?? [];
  const scopeOptions = shellContext?.scopeOptions ?? [];
  const selectedWorkspaceHref =
    workspaceOptions.find((option) => option.label === workspaceLabel)?.href ?? "";
  const selectedScopeHref =
    scopeOptions.find((option) => option.label === scopeLabel)?.href ?? "";

  function navigateTo(href: string) {
    if (href) {
      router.push(href);
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">GreenNest BuildFlow</p>
          <p className="truncate text-xs font-medium text-slate-600">{workspaceLabel}</p>
          <p className="truncate text-xs text-slate-500">{scopeLabel}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 text-right text-sm text-slate-600">
          {workspaceOptions.length > 1 ? (
            <label className="flex min-w-[150px] max-w-[220px] flex-col gap-1 text-left text-[11px] font-semibold uppercase text-slate-400">
              Không gian làm việc
              <select
                aria-label="Không gian làm việc"
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium normal-case text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                onChange={(event) => navigateTo(event.target.value)}
                value={selectedWorkspaceHref}
              >
                {workspaceOptions.map((option) => (
                  <option key={option.href} value={option.href}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {scopeOptions.length > 1 ? (
            <label className="flex min-w-[170px] max-w-[260px] flex-col gap-1 text-left text-[11px] font-semibold uppercase text-slate-400">
              Phạm vi
              <select
                aria-label="Phạm vi"
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium normal-case text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                onChange={(event) => navigateTo(event.target.value)}
                value={selectedScopeHref}
              >
                {scopeOptions.map((option) => (
                  <option key={option.id ?? option.href} value={option.href}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div>
            <p>{resolvedSession.user.fullName ?? resolvedSession.user.id}</p>
            <p className="text-xs text-slate-500">{resolvedSession.user.role}</p>
          </div>
          {logoutSlot}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden" aria-label="Điều hướng di động">
        {resolvedNavItems.map((item) => (
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
