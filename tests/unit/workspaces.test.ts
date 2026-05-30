import { describe, expect, it } from "vitest";

import { ROLE_DEFAULT_SCREENS, type Role } from "@/constants/roles";
import { getPermittedNavItems } from "@/lib/permissions/navigation";
import { selectScopeAssignmentsForUser } from "@/lib/permissions/navigation-context";
import type { PermissionUser } from "@/lib/permissions/can";
import {
  canAccessWorkspaceRoute,
  WORKSPACE_DEFINITIONS,
  type WorkspaceRoute,
} from "@/modules/workspaces/config";
import { applyWorkspaceScope, buildDelegationSummary } from "@/modules/workspaces/services/workspace-service";
import type { WorkspaceScopedData } from "@/modules/workspaces/types";
import type { LeadershipDelegation, ScopeAssignment } from "@/modules/settings/types";

function user(role: Role, id = `${role}-user`): PermissionUser {
  return { id, role };
}

describe("role workspaces", () => {
  it("maps every role to a concrete workspace route", () => {
    const expectedRoutes: Record<Role, string> = {
      super_admin: "/command-center",
      admin: "/admin",
      tong_giam_doc: "/command-center?view=executive-dashboard",
      pho_tong_giam_doc: "/command-center?view=executive-dashboard",
      giam_doc_du_an: "/project-workbench",
      quan_ly_du_an: "/project-workbench",
      to_truong: "/team-workbench",
      phap_ly: "/legal-workspace",
      ke_toan: "/finance-workspace",
      thiet_ke: "/design-workspace",
      ky_thuat: "/technical-workspace",
      thi_cong: "/construction-workspace",
      mua_hang: "/project-workbench",
      dau_tu_phat_trien: "/investment-workspace",
      quan_ly_tai_chinh: "/finance-management-workspace",
      hanh_chinh_nhan_su: "/hr-workspace",
      qa_qc_chat_luong: "/quality-workspace",
      an_toan_lao_dong: "/safety-workspace",
      kiem_toan_noi_bo: "/audit-workspace",
      quan_ly_hop_dong: "/contract-workspace",
      thu_ky_tro_ly: "/assistant-workspace",
      kiem_soat_noi_bo: "/audit-workspace",
      nha_thau: "/contractor",
      tu_van: "/consultant",
      viewer: "/viewer",
      pending: "/pending-access",
    };

    for (const [role, route] of Object.entries(expectedRoutes) as Array<
      [Role, string]
    >) {
      expect(ROLE_DEFAULT_SCREENS[role].href).toBe(route);
      if (route in WORKSPACE_DEFINITIONS) {
        expect(WORKSPACE_DEFINITIONS[route as WorkspaceRoute]).toBeDefined();
      } else {
        expect(
          route === "/command-center" ||
            route.startsWith("/command-center?") ||
            route === "/pending-access",
        ).toBe(true);
      }
    }
  });

  it("changes sidebar visibility by role", () => {
    const adminNav = getPermittedNavItems(user("admin")).map(
      (item) => item.href,
    );
    const ceoNav = getPermittedNavItems(user("tong_giam_doc")).map(
      (item) => item.href,
    );
    const executiveNav = getPermittedNavItems(user("pho_tong_giam_doc")).map(
      (item) => item.href,
    );
    const leadNav = getPermittedNavItems(user("to_truong")).map(
      (item) => item.href,
    );
    const financeNav = getPermittedNavItems(user("ke_toan")).map(
      (item) => item.href,
    );
    const financeManagerNav = getPermittedNavItems(
      user("quan_ly_tai_chinh"),
    ).map((item) => item.href);
    const investmentNav = getPermittedNavItems(user("dau_tu_phat_trien")).map(
      (item) => item.href,
    );
    const contractNav = getPermittedNavItems(user("quan_ly_hop_dong")).map(
      (item) => item.href,
    );
    const designNav = getPermittedNavItems(user("thiet_ke")).map(
      (item) => item.href,
    );
    const contractorNav = getPermittedNavItems(user("nha_thau")).map(
      (item) => item.href,
    );
    const viewerNav = getPermittedNavItems(user("viewer")).map(
      (item) => item.href,
    );

    expect(adminNav).toContain("/admin");
    expect(adminNav).toContain("/users");
    expect(adminNav).toContain("/settings");
    expect(ceoNav).toContain("/command-center");
    expect(ceoNav).toContain("/users");
    expect(ceoNav).toContain("/settings");
    expect(executiveNav).toContain("/command-center");
    expect(executiveNav).toContain("/proposals");
    expect(executiveNav).not.toContain("/users");
    expect(leadNav).toContain("/team-workbench");
    expect(leadNav).not.toContain("/legal");
    expect(financeNav).toContain("/finance-workspace");
    expect(financeManagerNav).toContain("/finance-management-workspace");
    expect(financeManagerNav).toContain("/proposals");
    expect(investmentNav).toContain("/investment-workspace");
    expect(contractNav).toContain("/contract-workspace");
    expect(designNav).toContain("/design-workspace");
    expect(contractorNav).toContain("/command-center");
    expect(contractorNav).toContain("/contractor");
    expect(adminNav).toContain("/command-center");
    expect(viewerNav).toContain("/viewer");
    expect(viewerNav).not.toContain("/executive");
    expect(viewerNav).not.toContain("/documents/new");
    expect(viewerNav).not.toContain("/users");
  });

  it("uses distinct navigation labels for command center, leadership and BO settings", () => {
    const adminNav = getPermittedNavItems(user("super_admin"));
    const labelsByHref = new Map(adminNav.map((item) => [item.href, item.label]));
    const labels = [...labelsByHref.values()];

    expect(labelsByHref.get("/command-center")).toBe("Tong quan Truc 1");
    expect(labelsByHref.get("/command-center?view=executive-dashboard")).toBe(
      "Lanh dao",
    );
    expect(labelsByHref.get("/admin")).toBe("Quan tri Chu tich");
    expect(labels).not.toContain("Tong quan");
    expect(labels).not.toContain("Quan tri");
  });

  it("allows scoped grants to reveal matching navigation without static role-wide access", () => {
    const scopedNav = getPermittedNavItems(user("viewer", "scoped-user"), {
      scopedPermissions: ["axis1.view"],
    }).map((item) => item.href);

    expect(scopedNav).toContain("/command-center");
    expect(scopedNav).toContain("/axis-1");
    expect(scopedNav).not.toContain("/settings");
    expect(scopedNav).not.toContain("/project-workbench");
  });

  it("keeps all-scope assignment selection scoped to the current user", () => {
    const assignments: ScopeAssignment[] = [
      {
        id: "current-user-scope",
        userId: "scoped-user",
        roleKey: "giam_doc_du_an",
        permissionKeys: ["project.view"],
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "other-user-scope",
        userId: "other-user",
        roleKey: "admin",
        permissionKeys: ["settings.manage"],
        active: true,
        scopeType: "global",
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(
      selectScopeAssignmentsForUser(
        { id: "scoped-user", role: "viewer" },
        assignments,
      ).map((assignment) => assignment.id),
    ).toEqual(["current-user-scope"]);
  });

  it("blocks unauthorized direct workspace route access", () => {
    expect(canAccessWorkspaceRoute(user("admin"), "/admin")).toBe(true);
    expect(canAccessWorkspaceRoute(user("admin"), "/executive")).toBe(true);
    expect(
      canAccessWorkspaceRoute(user("tong_giam_doc"), "/design-workspace"),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(
        user("tong_giam_doc"),
        "/finance-management-workspace",
      ),
    ).toBe(true);
    expect(canAccessWorkspaceRoute(user("tong_giam_doc"), "/executive")).toBe(
      true,
    );
    expect(
      canAccessWorkspaceRoute(user("pho_tong_giam_doc"), "/executive"),
    ).toBe(true);
    expect(canAccessWorkspaceRoute(user("to_truong"), "/team-workbench")).toBe(
      true,
    );
    expect(canAccessWorkspaceRoute(user("ke_toan"), "/finance-workspace")).toBe(
      true,
    );
    expect(canAccessWorkspaceRoute(user("thiet_ke"), "/design-workspace")).toBe(
      true,
    );
    expect(
      canAccessWorkspaceRoute(
        user("dau_tu_phat_trien"),
        "/investment-workspace",
      ),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(
        user("quan_ly_tai_chinh"),
        "/finance-management-workspace",
      ),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(user("quan_ly_hop_dong"), "/contract-workspace"),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(user("hanh_chinh_nhan_su"), "/hr-workspace"),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(user("qa_qc_chat_luong"), "/quality-workspace"),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(user("an_toan_lao_dong"), "/safety-workspace"),
    ).toBe(true);
    expect(
      canAccessWorkspaceRoute(user("kiem_toan_noi_bo"), "/audit-workspace"),
    ).toBe(true);
    expect(canAccessWorkspaceRoute(user("nha_thau"), "/contractor")).toBe(true);
    expect(canAccessWorkspaceRoute(user("viewer"), "/viewer")).toBe(true);
    expect(canAccessWorkspaceRoute(user("viewer"), "/executive")).toBe(false);

    expect(canAccessWorkspaceRoute(user("viewer"), "/admin")).toBe(false);
    expect(canAccessWorkspaceRoute(user("pending"), "/admin")).toBe(false);
    expect(canAccessWorkspaceRoute(user("nha_thau"), "/executive")).toBe(false);
    expect(canAccessWorkspaceRoute(user("ke_toan"), "/design-workspace")).toBe(
      false,
    );
    expect(
      canAccessWorkspaceRoute(
        user("hanh_chinh_nhan_su"),
        "/finance-management-workspace",
      ),
    ).toBe(false);
  });

  it("defines the executive route as the leadership workspace", () => {
    expect(WORKSPACE_DEFINITIONS["/executive"].title).toBe("Ban lãnh đạo");
    expect(WORKSPACE_DEFINITIONS["/executive"].permissions).toEqual(
      expect.arrayContaining([
        "proposal.view",
        "proposal.approve",
        "decision.approve",
      ]),
    );
  });

  it("limits contractor workspace data to assigned projects, tasks and documents", () => {
    const scoped = applyWorkspaceScope(user("nha_thau", "contractor-01"), {
      projects: [
        {
          id: "project-a",
          code: "A",
          name: "A",
          status: "active",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "project-b",
          code: "B",
          name: "B",
          status: "active",
          createdAt: "",
          updatedAt: "",
        },
      ],
      tasks: [
        {
          id: "task-a",
          projectId: "project-a",
          title: "Assigned",
          assigneeId: "contractor-01",
          status: "todo",
          priority: "high",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "task-b",
          projectId: "project-b",
          title: "Other",
          assigneeId: "other",
          status: "todo",
          priority: "high",
          createdAt: "",
          updatedAt: "",
        },
      ],
      documents: [
        {
          id: "doc-a",
          projectId: "project-a",
          title: "Assigned doc",
          docType: "contractor_submission",
          version: "v1",
          status: "needs_update",
          ownerId: "contractor-01",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "doc-b",
          projectId: "project-b",
          title: "Other doc",
          docType: "internal",
          version: "v1",
          status: "complete",
          ownerId: "other",
          createdAt: "",
          updatedAt: "",
        },
      ],
      legalSteps: [
        {
          id: "legal-a",
          projectId: "project-a",
          stepCode: "land_survey",
          stepName: "Khảo sát quỹ đất",
          status: "blocked",
          createdAt: "",
          updatedAt: "",
        },
      ],
      meetings: [
        {
          id: "meeting-a",
          organizationId: "org-a",
          projectId: "project-a",
          projectIds: ["project-a"],
          axisId: "axis-1",
          departmentId: "project",
          title: "Assigned meeting",
          meetingType: "PROJECT_MEETING",
          visibility: "project",
          participantScope: "project_team",
          status: "COMPLETED",
          meetingDate: "",
          startTime: "",
          participants: [],
          externalParticipants: [],
          attachments: [],
          aiSummary: { status: "DRAFT" },
          decisions: [],
          followUpActions: [],
          relatedApprovals: [],
          relatedTasks: [],
          auditLog: [],
          createdAt: "",
          updatedAt: "",
        },
      ],
      decisions: [
        {
          id: "decision-a",
          meetingId: "meeting-a",
          projectId: "project-a",
          decisionText: "Assigned decision",
          status: "open",
          createdAt: "",
          updatedAt: "",
        },
      ],
      users: [],
      auditLogs: [],
      memberships: [
        {
          id: "membership-a",
          projectId: "project-a",
          userId: "contractor-01",
          role: "nha_thau",
          createdAt: "",
          updatedAt: "",
        },
      ],
    } satisfies WorkspaceScopedData);

    expect(scoped.projects.map((project) => project.id)).toEqual(["project-a"]);
    expect(scoped.tasks.map((task) => task.id)).toEqual(["task-a"]);
    expect(scoped.documents.map((document) => document.id)).toEqual(["doc-a"]);
    expect(scoped.legalSteps).toEqual([]);
  });

  it("filters workspace DTOs by explicit scope assignments before UI render", () => {
    const assignments: ScopeAssignment[] = [
      {
        id: "assignment-a",
        userId: "operator",
        roleKey: "viewer",
        permissionKeys: ["project.view", "task.view", "document.view", "legal.view", "meeting.view"],
        projectId: "project-a",
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const scoped = applyWorkspaceScope(user("admin", "operator"), {
      projects: [
        { id: "project-a", code: "A", name: "A", status: "active", createdAt: "", updatedAt: "" },
        { id: "project-b", code: "B", name: "B", status: "active", createdAt: "", updatedAt: "" },
      ],
      tasks: [
        { id: "task-a", projectId: "project-a", title: "Allowed", status: "todo", priority: "high", createdAt: "", updatedAt: "" },
        { id: "task-b", projectId: "project-b", title: "Denied", status: "todo", priority: "high", createdAt: "", updatedAt: "" },
      ],
      documents: [
        {
          id: "doc-a",
          projectId: "project-a",
          title: "Allowed doc",
          docType: "internal",
          version: "v1",
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "doc-b",
          projectId: "project-b",
          title: "Denied doc",
          docType: "internal",
          version: "v1",
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
      ],
      legalSteps: [
        {
          id: "legal-a",
          projectId: "project-a",
          stepCode: "land_survey",
          stepName: "Allowed legal",
          status: "done",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "legal-b",
          projectId: "project-b",
          stepCode: "planning_analysis",
          stepName: "Denied legal",
          status: "done",
          createdAt: "",
          updatedAt: "",
        },
      ],
      meetings: [
        {
          id: "meeting-a",
          organizationId: "org-a",
          projectId: "project-a",
          projectIds: ["project-a"],
          axisId: "axis-1",
          departmentId: "project",
          title: "Allowed meeting",
          meetingType: "PROJECT_MEETING",
          visibility: "project",
          participantScope: "project_team",
          status: "COMPLETED",
          meetingDate: "",
          startTime: "",
          participants: [],
          externalParticipants: [],
          attachments: [],
          aiSummary: { status: "DRAFT" },
          decisions: [],
          followUpActions: [],
          relatedApprovals: [],
          relatedTasks: [],
          auditLog: [],
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "meeting-b",
          organizationId: "org-a",
          projectId: "project-b",
          projectIds: ["project-b"],
          axisId: "axis-1",
          departmentId: "project",
          title: "Denied meeting",
          meetingType: "PROJECT_MEETING",
          visibility: "project",
          participantScope: "project_team",
          status: "COMPLETED",
          meetingDate: "",
          startTime: "",
          participants: [],
          externalParticipants: [],
          attachments: [],
          aiSummary: { status: "DRAFT" },
          decisions: [],
          followUpActions: [],
          relatedApprovals: [],
          relatedTasks: [],
          auditLog: [],
          createdAt: "",
          updatedAt: "",
        },
      ],
      decisions: [
        { id: "decision-a", projectId: "project-a", decisionText: "Allowed", status: "open", createdAt: "", updatedAt: "" },
        { id: "decision-b", projectId: "project-b", decisionText: "Denied", status: "open", createdAt: "", updatedAt: "" },
      ],
      users: [],
      auditLogs: [],
      memberships: [],
      scopeAssignments: assignments,
    } satisfies WorkspaceScopedData);

    expect(scoped.projects.map((project) => project.id)).toEqual(["project-a"]);
    expect(scoped.tasks.map((task) => task.id)).toEqual(["task-a"]);
    expect(scoped.documents.map((document) => document.id)).toEqual(["doc-a"]);
    expect(scoped.legalSteps.map((step) => step.id)).toEqual(["legal-a"]);
    expect(scoped.meetings.map((meeting) => meeting.id)).toEqual(["meeting-a"]);
    expect(scoped.decisions.map((decision) => decision.id)).toEqual(["decision-a"]);
  });

  it("summarizes active delegation metadata for assistant workspaces", () => {
    const delegations: LeadershipDelegation[] = [
      {
        id: "delegation-a",
        principalUserId: "mock-founder",
        delegateUserId: "assistant",
        actionKeys: ["proposal.create"],
        projectId: "project-a",
        moduleId: "proposal",
        active: true,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "delegation-b",
        principalUserId: "mock-founder",
        delegateUserId: "assistant",
        actionKeys: ["proposal.create", "meeting.create"],
        projectId: "project-b",
        moduleId: "meeting",
        active: true,
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(buildDelegationSummary(delegations)).toEqual({
      activeCount: 2,
      principalUserIds: ["mock-founder"],
      actionKeys: ["proposal.create", "meeting.create"],
    });
  });
});
