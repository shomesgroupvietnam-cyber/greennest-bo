import { describe, expect, it } from "vitest";

import { ROLE_DEFAULT_SCREENS, type Role } from "@/constants/roles";
import { getPermittedNavItems } from "@/components/layout/app-sidebar";
import { can, type PermissionUser } from "@/lib/permissions/can";

function user(role: Role, id = "mock-founder"): PermissionUser {
  return { id, role };
}

describe("permission behavior", () => {
  it("allows admin to manage users, settings, projects and tasks", () => {
    const admin = user("admin");

    expect(can(admin, "user.invite")).toBe(true);
    expect(can(admin, "user.update_role")).toBe(true);
    expect(can(admin, "settings.manage")).toBe(true);
    expect(can(admin, "project.archive")).toBe(true);
    expect(can(admin, "task.update")).toBe(true);
    expect(can(admin, "document.create")).toBe(true);
    expect(can(admin, "document.update")).toBe(true);
    expect(can(admin, "legal.update")).toBe(true);
    expect(can(admin, "report.create")).toBe(true);
    expect(can(admin, "ai.ask")).toBe(true);
    expect(can(admin, "ai.use_rag")).toBe(true);
    expect(can(admin, "ai.create_draft")).toBe(true);
    expect(can(admin, "ai.propose_action")).toBe(true);
    expect(can(admin, "ai.configure")).toBe(true);
    expect(can(admin, "knowledge.create_candidate")).toBe(true);
    expect(can(admin, "knowledge.promote")).toBe(true);
    expect(can(admin, "knowledge.approve")).toBe(true);
    expect(can(admin, "knowledge.manage_source_registry")).toBe(true);
    expect(ROLE_DEFAULT_SCREENS.admin.href).toBe("/admin");
  });

  it("allows pho_tong_giam_doc oversight but not user/settings management", () => {
    const executive = user("pho_tong_giam_doc");

    expect(can(executive, "project.update")).toBe(true);
    expect(can(executive, "task.update")).toBe(true);
    expect(can(executive, "finance.view")).toBe(true);
    expect(can(executive, "document.view")).toBe(true);
    expect(can(executive, "document.create")).toBe(false);
    expect(can(executive, "legal.approve")).toBe(true);
    expect(can(executive, "legal.update")).toBe(false);
    expect(can(executive, "proposal.view")).toBe(true);
    expect(can(executive, "proposal.approve")).toBe(true);
    expect(can(executive, "proposal.reject")).toBe(true);
    expect(can(executive, "proposal.request_change")).toBe(true);
    expect(can(executive, "report.create")).toBe(true);
    expect(can(executive, "ai.ask")).toBe(true);
    expect(can(executive, "ai.use_rag")).toBe(true);
    expect(can(executive, "ai.propose_action")).toBe(true);
    expect(can(executive, "ai.configure")).toBe(false);
    expect(can(executive, "knowledge.create_candidate")).toBe(true);
    expect(can(executive, "knowledge.promote")).toBe(true);
    expect(can(executive, "knowledge.approve")).toBe(true);
    expect(can(executive, "user.invite")).toBe(false);
    expect(can(executive, "settings.manage")).toBe(false);
    expect(ROLE_DEFAULT_SCREENS.pho_tong_giam_doc.href).toBe(
      "/command-center?view=executive-dashboard",
    );
  });

  it("routes tong_giam_doc to command center with full system permissions", () => {
    const ceo = user("tong_giam_doc");

    expect(ROLE_DEFAULT_SCREENS.tong_giam_doc.href).toBe("/command-center");
    expect(can(ceo, "project.create")).toBe(true);
    expect(can(ceo, "investment.approve")).toBe(true);
    expect(can(ceo, "contract.approve")).toBe(true);
    expect(can(ceo, "hr.approve")).toBe(true);
    expect(can(ceo, "qa.approve")).toBe(true);
    expect(can(ceo, "safety.approve")).toBe(true);
    expect(can(ceo, "settings.manage")).toBe(true);
  });

  it("limits to_truong to assigned task updates and execution modules", () => {
    const lead = user("to_truong", "lead-1");

    expect(can(lead, "task.create")).toBe(true);
    expect(can(lead, "task.update", { assigneeId: "lead-1" })).toBe(true);
    expect(can(lead, "task.update", { assigneeId: "other-user" })).toBe(false);
    expect(can(lead, "document.view")).toBe(true);
    expect(can(lead, "document.create")).toBe(false);
    expect(can(lead, "legal.update")).toBe(false);
    expect(can(lead, "project.create")).toBe(false);
    expect(can(lead, "finance.view")).toBe(false);
    expect(can(lead, "report.view")).toBe(true);
    expect(can(lead, "report.create")).toBe(false);
    expect(can(lead, "knowledge.view")).toBe(true);
    expect(can(lead, "knowledge.create")).toBe(false);
    expect(can(lead, "knowledge.create_candidate")).toBe(false);
    expect(can(lead, "knowledge.promote")).toBe(false);
    expect(can(lead, "ai.ask")).toBe(true);
    expect(can(lead, "ai.use_rag")).toBe(false);
    expect(ROLE_DEFAULT_SCREENS.to_truong.href).toBe("/team-workbench");
  });

  it("gives ke_toan finance access without project mutation authority", () => {
    const accountant = user("ke_toan");

    expect(can(accountant, "finance.view")).toBe(true);
    expect(can(accountant, "finance.update")).toBe(true);
    expect(can(accountant, "payment.approve")).toBe(true);
    expect(can(accountant, "document.view")).toBe(true);
    expect(can(accountant, "document.update")).toBe(false);
    expect(can(accountant, "legal.update")).toBe(false);
    expect(can(accountant, "project.update")).toBe(false);
    expect(can(accountant, "design.update")).toBe(false);
    expect(can(accountant, "report.view")).toBe(true);
    expect(can(accountant, "report.create")).toBe(false);
    expect(can(accountant, "knowledge.approve")).toBe(true);
    expect(can(accountant, "knowledge.create_candidate")).toBe(true);
    expect(can(accountant, "knowledge.promote")).toBe(true);
    expect(ROLE_DEFAULT_SCREENS.ke_toan.href).toBe("/finance-workspace");
  });

  it("adds enterprise governance roles with conservative proposal/domain access", () => {
    const investment = user("dau_tu_phat_trien");
    const financeManager = user("quan_ly_tai_chinh");
    const hr = user("hanh_chinh_nhan_su");
    const qa = user("qa_qc_chat_luong");
    const safety = user("an_toan_lao_dong");
    const internalAudit = user("kiem_toan_noi_bo");
    const contractManager = user("quan_ly_hop_dong");

    expect(can(investment, "investment.create")).toBe(true);
    expect(can(investment, "proposal.create")).toBe(true);
    expect(can(investment, "finance.approve")).toBe(false);
    expect(ROLE_DEFAULT_SCREENS.dau_tu_phat_trien.href).toBe(
      "/investment-workspace",
    );

    expect(can(financeManager, "finance.approve")).toBe(true);
    expect(can(financeManager, "proposal.approve")).toBe(true);
    expect(can(financeManager, "hr.update")).toBe(false);
    expect(ROLE_DEFAULT_SCREENS.quan_ly_tai_chinh.href).toBe(
      "/finance-management-workspace",
    );

    expect(can(hr, "hr.update")).toBe(true);
    expect(can(hr, "proposal.review")).toBe(true);
    expect(can(hr, "finance.view")).toBe(false);

    expect(can(qa, "qa.approve")).toBe(true);
    expect(can(qa, "safety.update")).toBe(false);
    expect(can(safety, "safety.approve")).toBe(true);
    expect(can(safety, "qa.update")).toBe(false);

    expect(can(internalAudit, "internal_audit.review")).toBe(true);
    expect(can(internalAudit, "audit.view")).toBe(true);
    expect(can(internalAudit, "proposal.approve")).toBe(false);

    expect(can(contractManager, "contract.approve")).toBe(true);
    expect(can(contractManager, "proposal.review")).toBe(true);
    expect(can(contractManager, "payment.approve")).toBe(false);
  });

  it("gives thiet_ke design access without finance mutation authority", () => {
    const designer = user("thiet_ke");

    expect(can(designer, "design.view")).toBe(true);
    expect(can(designer, "design.update")).toBe(true);
    expect(can(designer, "document.update")).toBe(true);
    expect(can(designer, "legal.view")).toBe(true);
    expect(can(designer, "legal.update")).toBe(false);
    expect(can(designer, "finance.update")).toBe(false);
    expect(can(designer, "project.archive")).toBe(false);
    expect(can(designer, "report.view")).toBe(true);
    expect(can(designer, "report.create")).toBe(false);
    expect(can(designer, "knowledge.approve")).toBe(true);
    expect(can(designer, "knowledge.create_candidate")).toBe(true);
    expect(can(designer, "knowledge.promote")).toBe(true);
    expect(ROLE_DEFAULT_SCREENS.thiet_ke.href).toBe("/design-workspace");
  });

  it("keeps viewer read-only and hides admin navigation", () => {
    const viewer = user("viewer");
    const navHrefs = getPermittedNavItems(viewer).map((item) => item.href);

    expect(can(viewer, "project.view")).toBe(true);
    expect(can(viewer, "task.view")).toBe(true);
    expect(can(viewer, "document.view")).toBe(true);
    expect(can(viewer, "document.create")).toBe(false);
    expect(can(viewer, "document.update")).toBe(false);
    expect(can(viewer, "legal.view")).toBe(true);
    expect(can(viewer, "legal.update")).toBe(false);
    expect(can(viewer, "project.create")).toBe(false);
    expect(can(viewer, "task.update")).toBe(false);
    expect(can(viewer, "user.update_role")).toBe(false);
    expect(can(viewer, "report.view")).toBe(true);
    expect(can(viewer, "report.create")).toBe(false);
    expect(can(viewer, "knowledge.view")).toBe(true);
    expect(can(viewer, "ai.ask")).toBe(false);
    expect(can(viewer, "ai.confirm_action")).toBe(false);
    expect(can(viewer, "knowledge.create_candidate")).toBe(false);
    expect(can(viewer, "knowledge.promote")).toBe(false);
    expect(can(viewer, "knowledge.approve")).toBe(false);
    expect(navHrefs).toContain("/projects");
    expect(navHrefs).toContain("/tasks");
    expect(navHrefs).toContain("/reports");
    expect(navHrefs).toContain("/knowledge");
    expect(navHrefs).not.toContain("/users");
    expect(navHrefs).not.toContain("/settings");
    expect(ROLE_DEFAULT_SCREENS.viewer.href).toBe("/viewer");
  });

  it("keeps pending users without module permissions or navigation", () => {
    const pending = user("pending");

    expect(can(pending, "project.view")).toBe(false);
    expect(can(pending, "task.view")).toBe(false);
    expect(can(pending, "document.view")).toBe(false);
    expect(can(pending, "project:view")).toBe(false);
    expect(getPermittedNavItems(pending)).toEqual([]);
    expect(ROLE_DEFAULT_SCREENS.pending.href).toBe("/pending-access");
  });

  it("accepts colon-format permission aliases for server-side guards", () => {
    const admin = user("admin");

    expect(can(admin, "project:view")).toBe(true);
    expect(can(admin, "document:approve")).toBe(true);
    expect(can(admin, "unknown:view")).toBe(false);
  });
});
