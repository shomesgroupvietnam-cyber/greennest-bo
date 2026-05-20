import { describe, expect, it } from "vitest";

import { ROLE_DEFAULT_SCREENS, type Role } from "@/constants/roles";
import { getPermittedNavItems } from "@/lib/permissions/navigation";
import type { PermissionUser } from "@/lib/permissions/can";
import { canAccessWorkspaceRoute, WORKSPACE_DEFINITIONS, type WorkspaceRoute } from "@/modules/workspaces/config";
import { applyWorkspaceScope } from "@/modules/workspaces/services/workspace-service";
import type { WorkspaceScopedData } from "@/modules/workspaces/types";

function user(role: Role, id = `${role}-user`): PermissionUser {
  return { id, role };
}

describe("role workspaces", () => {
  it("maps every role to a concrete workspace route", () => {
    const expectedRoutes: Record<Role, WorkspaceRoute> = {
      super_admin: "/admin",
      admin: "/admin",
      tong_giam_doc: "/executive",
      pho_tong_giam_doc: "/executive",
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
      kiem_soat_noi_bo: "/admin",
      nha_thau: "/contractor",
      tu_van: "/consultant",
      viewer: "/viewer"
    };

    for (const [role, route] of Object.entries(expectedRoutes) as Array<[Role, WorkspaceRoute]>) {
      expect(ROLE_DEFAULT_SCREENS[role].href).toBe(route);
      expect(WORKSPACE_DEFINITIONS[route]).toBeDefined();
    }
  });

  it("changes sidebar visibility by role", () => {
    const adminNav = getPermittedNavItems(user("admin")).map((item) => item.href);
    const executiveNav = getPermittedNavItems(user("pho_tong_giam_doc")).map((item) => item.href);
    const leadNav = getPermittedNavItems(user("to_truong")).map((item) => item.href);
    const financeNav = getPermittedNavItems(user("ke_toan")).map((item) => item.href);
    const financeManagerNav = getPermittedNavItems(user("quan_ly_tai_chinh")).map((item) => item.href);
    const investmentNav = getPermittedNavItems(user("dau_tu_phat_trien")).map((item) => item.href);
    const contractNav = getPermittedNavItems(user("quan_ly_hop_dong")).map((item) => item.href);
    const designNav = getPermittedNavItems(user("thiet_ke")).map((item) => item.href);
    const contractorNav = getPermittedNavItems(user("nha_thau")).map((item) => item.href);
    const viewerNav = getPermittedNavItems(user("viewer")).map((item) => item.href);

    expect(adminNav).toContain("/admin");
    expect(adminNav).toContain("/users");
    expect(adminNav).toContain("/settings");
    expect(executiveNav).toContain("/executive");
    expect(executiveNav).not.toContain("/users");
    expect(leadNav).toContain("/team-workbench");
    expect(leadNav).not.toContain("/legal");
    expect(financeNav).toContain("/finance-workspace");
    expect(financeManagerNav).toContain("/finance-management-workspace");
    expect(financeManagerNav).toContain("/proposals");
    expect(investmentNav).toContain("/investment-workspace");
    expect(contractNav).toContain("/contract-workspace");
    expect(designNav).toContain("/design-workspace");
    expect(contractorNav).toEqual(["/contractor"]);
    expect(viewerNav).toContain("/viewer");
    expect(viewerNav).not.toContain("/documents/new");
    expect(viewerNav).not.toContain("/users");
  });

  it("blocks unauthorized direct workspace route access", () => {
    expect(canAccessWorkspaceRoute(user("admin"), "/admin")).toBe(true);
    expect(canAccessWorkspaceRoute(user("pho_tong_giam_doc"), "/executive")).toBe(true);
    expect(canAccessWorkspaceRoute(user("to_truong"), "/team-workbench")).toBe(true);
    expect(canAccessWorkspaceRoute(user("ke_toan"), "/finance-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("thiet_ke"), "/design-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("dau_tu_phat_trien"), "/investment-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("quan_ly_tai_chinh"), "/finance-management-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("quan_ly_hop_dong"), "/contract-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("hanh_chinh_nhan_su"), "/hr-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("qa_qc_chat_luong"), "/quality-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("an_toan_lao_dong"), "/safety-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("kiem_toan_noi_bo"), "/audit-workspace")).toBe(true);
    expect(canAccessWorkspaceRoute(user("nha_thau"), "/contractor")).toBe(true);
    expect(canAccessWorkspaceRoute(user("viewer"), "/viewer")).toBe(true);

    expect(canAccessWorkspaceRoute(user("viewer"), "/admin")).toBe(false);
    expect(canAccessWorkspaceRoute(user("nha_thau"), "/executive")).toBe(false);
    expect(canAccessWorkspaceRoute(user("ke_toan"), "/design-workspace")).toBe(false);
    expect(canAccessWorkspaceRoute(user("hanh_chinh_nhan_su"), "/finance-management-workspace")).toBe(false);
  });

  it("limits contractor workspace data to assigned projects, tasks and documents", () => {
    const scoped = applyWorkspaceScope(user("nha_thau", "contractor-01"), {
      projects: [
        { id: "project-a", code: "A", name: "A", status: "active", createdAt: "", updatedAt: "" },
        { id: "project-b", code: "B", name: "B", status: "active", createdAt: "", updatedAt: "" }
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
          updatedAt: ""
        },
        {
          id: "task-b",
          projectId: "project-b",
          title: "Other",
          assigneeId: "other",
          status: "todo",
          priority: "high",
          createdAt: "",
          updatedAt: ""
        }
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
          updatedAt: ""
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
          updatedAt: ""
        }
      ],
      legalSteps: [
        {
          id: "legal-a",
          projectId: "project-a",
          stepCode: "land_survey",
          stepName: "Khảo sát quỹ đất",
          status: "blocked",
          createdAt: "",
          updatedAt: ""
        }
      ],
      meetings: [
        {
          id: "meeting-a",
          projectId: "project-a",
          title: "Assigned meeting",
          meetingDate: "",
          createdAt: "",
          updatedAt: ""
        }
      ],
      decisions: [
        {
          id: "decision-a",
          meetingId: "meeting-a",
          projectId: "project-a",
          decisionText: "Assigned decision",
          status: "open",
          createdAt: "",
          updatedAt: ""
        }
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
          updatedAt: ""
        }
      ]
    } satisfies WorkspaceScopedData);

    expect(scoped.projects.map((project) => project.id)).toEqual(["project-a"]);
    expect(scoped.tasks.map((task) => task.id)).toEqual(["task-a"]);
    expect(scoped.documents.map((document) => document.id)).toEqual(["doc-a"]);
    expect(scoped.legalSteps).toEqual([]);
  });
});
