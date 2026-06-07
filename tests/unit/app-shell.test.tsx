import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/layout/app-header";
import type { NavigationItem, ShellContext } from "@/lib/permissions/navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/command-center",
  useRouter: () => ({ push: vi.fn() }),
}));

const navItems: NavigationItem[] = [
  {
    href: "/command-center",
    icon: "dashboard",
    label: "Tong quan Truc 1",
  },
  {
    href: "/command-center?view=executive-dashboard",
    icon: "briefcase",
    label: "Lanh dao",
  },
  {
    href: "/admin",
    icon: "users",
    label: "Quan tri he thong",
  },
];

const shellContext: ShellContext = {
  currentScopeLabel: "Scope project-a",
  currentWorkspaceLabel: "Lanh dao",
  scopeOptions: [
    { href: "/command-center?scopeId=scope-a", id: "scope-a", label: "Scope project-a" },
    { href: "/command-center?scopeId=scope-b", id: "scope-b", label: "Scope project-b" },
  ],
  workspaceOptions: navItems.map((item) => ({
    href: item.href,
    label: item.label,
  })),
};

describe("PermissionAwareShell header", () => {
  it("renders current workspace, scope and selectors without hiding identity", () => {
    render(
      <AppHeader
        navItems={navItems}
        session={{
          defaultScreen: {
            href: "/command-center?view=executive-dashboard",
            label: "Lanh dao",
          },
          user: {
            fullName: "Tran Quan Tri He Thong",
            id: "super-admin-01",
            role: "super_admin",
          },
        }}
        shellContext={shellContext}
      />,
    );

    expect(screen.getAllByText("Lanh dao").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Scope project-a").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Không gian làm việc")).toBeInTheDocument();
    expect(screen.getByLabelText("Phạm vi")).toBeInTheDocument();
    expect(screen.getByText("Tran Quan Tri He Thong")).toBeInTheDocument();
  });
});
