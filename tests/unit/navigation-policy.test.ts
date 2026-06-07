import { describe, expect, it } from "vitest";

import { ROLE_DEFAULT_SCREENS, ROLES, type Role } from "@/constants/roles";
import {
  BO_POLICY_HREFS,
  canOpenBoRoute,
  canOpenCommandCenter,
  getDefaultNavigationHref,
  getCommandCenterLandingHref,
  getNavigationPolicyForRole,
  NAVIGATION_POLICY_BY_ROLE,
  type PolicyWorkspaceHref,
} from "@/lib/permissions/navigation-policy";
import {
  buildDelegatedPermissionsForPolicy,
  buildDelegatedScopeAssignmentsForPolicy,
} from "@/lib/permissions/navigation-policy-context";
import { getPermittedNavItems } from "@/lib/permissions/navigation";
import type { PermissionUser } from "@/lib/permissions/can";
import type {
  LeadershipDelegation,
  ScopeAssignment,
} from "@/modules/settings/types";

function user(role: Role, id = `${role}-user`): PermissionUser {
  return { id, role };
}

function workspaceHrefsFor(role: Role, context?: Parameters<typeof getPermittedNavItems>[1]) {
  return getPermittedNavItems(user(role), context)
    .map((item) => item.href)
    .filter((href): href is PolicyWorkspaceHref =>
      getNavigationPolicyForRole(role).allPolicyWorkspaceHrefs.includes(
        href as PolicyWorkspaceHref,
      ),
    );
}

describe("navigation policy matrix", () => {
  it("separates chairman leadership navigation from super admin BO navigation", () => {
    const chairmanNav = getPermittedNavItems(user("chu_tich")).map(
      (item) => item.href,
    );
    const superAdminNav = getPermittedNavItems(user("super_admin")).map(
      (item) => item.href,
    );

    expect(chairmanNav).toContain("/command-center");
    expect(chairmanNav).toContain("/command-center?view=executive-dashboard");
    expect(chairmanNav).not.toContain("/admin");
    expect(chairmanNav).not.toContain("/settings");
    expect(chairmanNav).not.toContain("/users");
    expect(canOpenBoRoute(user("chu_tich"), "/admin")).toBe(false);
    expect(canOpenBoRoute(user("chu_tich"), "/settings")).toBe(false);
    expect(canOpenBoRoute(user("chu_tich"), "/users")).toBe(false);
    expect(canOpenCommandCenter(user("chu_tich"), "executive-dashboard")).toBe(
      true,
    );
    expect(canOpenCommandCenter(user("chu_tich"), "operations-dashboard")).toBe(
      true,
    );

    expect(superAdminNav).toContain("/command-center");
    expect(superAdminNav).toContain("/command-center?view=executive-dashboard");
    expect(superAdminNav).toEqual(expect.arrayContaining(chairmanNav));

    for (const href of BO_POLICY_HREFS) {
      expect(superAdminNav).toContain(href);
      expect(canOpenBoRoute(user("super_admin"), href)).toBe(true);
    }
  });

  it("does not let chairman scoped or delegated BO grants leak BO navigation", () => {
    const chairmanNav = getPermittedNavItems(user("chu_tich"), {
      delegatedPermissions: ["delegation.manage", "user.view"],
      scopedPermissions: ["settings.manage", "user.view"],
    }).map((item) => item.href);

    expect(chairmanNav).toContain("/command-center");
    expect(chairmanNav).toContain("/command-center?view=executive-dashboard");
    expect(chairmanNav).not.toContain("/admin");
    expect(chairmanNav).not.toContain("/settings");
    expect(chairmanNav).not.toContain("/users");
  });

  it("does not let chairman replacement permissions open BO navigation", () => {
    const privilegedChairman: PermissionUser = {
      ...user("chu_tich"),
      permissions: [
        "settings.manage",
        "delegation.manage",
        "user.view",
        "user.invite",
        "user.update_role",
      ],
      permissionsMode: "replace",
    };
    const chairmanNav = getPermittedNavItems(privilegedChairman).map(
      (item) => item.href,
    );

    for (const href of BO_POLICY_HREFS) {
      expect(canOpenBoRoute(privilegedChairman, href)).toBe(false);
      expect(chairmanNav).not.toContain(href);
    }
  });

  it("has an intentional policy row for every role", () => {
    expect(Object.keys(NAVIGATION_POLICY_BY_ROLE).sort()).toEqual(
      Object.keys(ROLES).sort(),
    );

    for (const role of Object.keys(ROLES) as Role[]) {
      expect(getNavigationPolicyForRole(role).defaultHref).toBeTruthy();
      expect(getNavigationPolicyForRole(role).allowedWorkspaceHrefs).toContain(
        ROLE_DEFAULT_SCREENS[role].href === "/pending-access"
          ? "/pending-access"
          : getNavigationPolicyForRole(role).defaultHref,
      );
    }
  });

  it("drives static workspace/sidebar entries from the policy matrix", () => {
    for (const role of Object.keys(ROLES) as Role[]) {
      const policy = getNavigationPolicyForRole(role);

      if (role === "pending") {
        expect(workspaceHrefsFor(role)).toEqual([]);
        continue;
      }

      expect(workspaceHrefsFor(role)).toEqual(policy.allowedWorkspaceHrefs);
    }
  });

  it("blocks command center exposure from broad read permissions", () => {
    for (const role of [
      "viewer",
      "thu_ky_tro_ly",
      "phap_ly",
      "thiet_ke",
      "ky_thuat",
    ] as const) {
      const navHrefs = getPermittedNavItems(user(role)).map((item) => item.href);

      expect(navHrefs).not.toContain("/command-center");
      expect(navHrefs).not.toContain("/command-center?view=executive-dashboard");
      expect(canOpenCommandCenter(user(role))).toBe(false);
      expect(getDefaultNavigationHref(user(role))).toBe(
        ROLE_DEFAULT_SCREENS[role].href,
      );
    }
  });

  it("routes Axis 1 overview roles to the Axis 1 command-center view", () => {
    const projectDirectorNav = getPermittedNavItems(user("giam_doc_du_an"));
    const axisOneOverview = projectDirectorNav.find(
      (item) => item.label === "Tổng quan Trục 1",
    );

    expect(axisOneOverview?.href).toBe(
      "/command-center?view=axis1-search-development",
    );
    expect(canOpenCommandCenter(user("giam_doc_du_an"))).toBe(true);
    expect(
      canOpenCommandCenter(user("giam_doc_du_an"), "axis1-search-development"),
    ).toBe(true);
    expect(
      canOpenCommandCenter(user("giam_doc_du_an"), "operations-dashboard"),
    ).toBe(false);
    expect(
      canOpenCommandCenter(user("tong_giam_doc"), "operations-dashboard"),
    ).toBe(true);
    expect(
      canOpenCommandCenter(user("tong_giam_doc"), "executive-history"),
    ).toBe(true);
    expect(canOpenCommandCenter(user("tong_giam_doc"), "unknown-view")).toBe(
      false,
    );
    expect(
      canOpenCommandCenter({ ...user("giam_doc_du_an"), roleActive: false }),
    ).toBe(false);
  });

  it("keeps delegated command-center grants scoped to the selected assignment", () => {
    const delegation: LeadershipDelegation = {
      actionKeys: ["axis1.view"],
      active: true,
      createdAt: "",
      delegateUserId: "assistant-01",
      id: "delegation-riverside",
      principalUserId: "mock-founder",
      projectId: "demo-project-riverside",
      updatedAt: "",
    };
    const selectedAssignment: ScopeAssignment = {
      active: true,
      createdAt: "",
      id: "scope-garden",
      permissionKeys: ["axis1.view"],
      projectId: "demo-project-garden",
      roleKey: "giam_doc_du_an",
      scopeType: "scoped",
      updatedAt: "",
      userId: "assistant-01",
    };

    expect(
      buildDelegatedPermissionsForPolicy(
        [delegation],
        [selectedAssignment],
        "scope-garden",
      ),
    ).toEqual([]);
    expect(buildDelegatedPermissionsForPolicy([delegation], [], undefined)).toEqual([
      "axis1.view",
    ]);
    expect(
      buildDelegatedScopeAssignmentsForPolicy(user("thu_ky_tro_ly", "assistant-01"), [
        delegation,
      ])[0],
    ).toMatchObject({
      id: "delegation-delegation-riverside",
      permissionKeys: ["axis1.view"],
      projectId: "demo-project-riverside",
      userId: "assistant-01",
    });
  });

  it("uses delegated permissions for scoped navigation without broad external nav", () => {
    const delegatedViewerNav = getPermittedNavItems(user("viewer"), {
      delegatedPermissions: ["axis1.view"],
    }).map((item) => item.href);
    const externalNav = getPermittedNavItems(user("nha_thau"), {
      scopedPermissions: ["axis1.view"],
    }).map((item) => item.href);

    expect(delegatedViewerNav).toContain(
      "/command-center?view=axis1-search-development",
    );
    expect(delegatedViewerNav).toContain("/axis-1");
    expect(externalNav).not.toContain("/axis-1");
    expect(externalNav).not.toContain("/tasks");
    expect(externalNav).not.toContain("/documents");
  });

  it("allows scoped Axis 1 command-center overview without broad executive dashboard access", () => {
    const scopedViewerNav = getPermittedNavItems(user("viewer"), {
      scopedPermissions: ["axis1.view"],
    }).map((item) => item.href);

    expect(scopedViewerNav).toContain(
      "/command-center?view=axis1-search-development",
    );
    expect(scopedViewerNav).toContain("/axis-1");
    expect(scopedViewerNav).not.toContain(
      "/command-center?view=executive-dashboard",
    );
    expect(
      canOpenCommandCenter(user("viewer"), undefined, {
        scopedPermissions: ["axis1.view"],
      }),
    ).toBe(true);
    expect(
      canOpenCommandCenter(user("viewer"), "executive-dashboard", {
        scopedPermissions: ["axis1.view"],
      }),
    ).toBe(false);
    expect(
      canOpenCommandCenter(user("viewer"), "operations-dashboard", {
        scopedPermissions: ["axis1.view"],
      }),
    ).toBe(false);
  });

  it("allows scoped proposal approvers into Approval Center without executive dashboard access", () => {
    const context = {
      scopedPermissions: ["proposal.review" as const],
    };
    const scopedViewerNav = getPermittedNavItems(user("viewer"), context).map(
      (item) => item.href,
    );

    expect(scopedViewerNav).toContain(
      "/command-center?view=executive-approvals",
    );
    expect(scopedViewerNav).not.toContain(
      "/command-center?view=executive-dashboard",
    );
    expect(canOpenCommandCenter(user("viewer"), undefined, context)).toBe(true);
    expect(
      canOpenCommandCenter(user("viewer"), "executive-approvals", context),
    ).toBe(true);
    expect(
      canOpenCommandCenter(user("viewer"), "executive-dashboard", context),
    ).toBe(false);
    expect(getCommandCenterLandingHref(user("viewer"), context)).toBe(
      "/command-center?view=executive-approvals",
    );
  });

  it("keeps external roles out of command center even with scoped executive or Axis 1 grants", () => {
    for (const role of ["nha_thau", "tu_van"] as const) {
      const navHrefs = getPermittedNavItems(user(role), {
        scopedPermissions: ["axis1.view"],
        scopedWorkspaceRoutes: ["/executive"],
      }).map((item) => item.href);

      expect(navHrefs).not.toContain("/command-center");
      expect(navHrefs).not.toContain(
        "/command-center?view=executive-dashboard",
      );
      expect(
        canOpenCommandCenter(user(role), undefined, {
          scopedPermissions: ["axis1.view"],
          scopedWorkspaceRoutes: ["/executive"],
        }),
      ).toBe(false);
    }
  });

  it("keeps viewer private workspace explicit without allowing top-level command center", () => {
    expect(canOpenCommandCenter(user("viewer"))).toBe(false);
    expect(
      canOpenCommandCenter(user("viewer"), "executive-private-workspace"),
    ).toBe(true);
  });
});
