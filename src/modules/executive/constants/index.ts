import type { Role } from "@/constants/roles";
import type {
  ExecutiveAccessLevel,
  ExecutiveAccessPolicy,
  ExecutivePageKey,
} from "@/modules/executive/types";

const accessPolicies: Record<ExecutiveAccessLevel, ExecutiveAccessPolicy> = {
  owner: {
    level: "owner",
    label: "Owner",
    operatingRole: "CHAIRMAN",
    scopeType: "global",
    canView: true,
    canViewGlobalDashboard: true,
    canViewProjectDashboard: true,
    canViewDepartmentSummary: true,
    canCreatePlan: true,
    canApprovePlan: true,
    canCreateDirective: true,
    canCreateMeetingAction: true,
    canApproveProposal: true,
    canViewAudit: true,
    canUseAiPanel: true,
    approvalLevels: ["CHAIRMAN"],
  },
  founder: {
    level: "founder",
    label: "Founder/TGD",
    operatingRole: "CEO",
    scopeType: "global",
    canView: true,
    canViewGlobalDashboard: true,
    canViewProjectDashboard: true,
    canViewDepartmentSummary: true,
    canCreatePlan: true,
    canApprovePlan: true,
    canCreateDirective: true,
    canCreateMeetingAction: true,
    canApproveProposal: true,
    canViewAudit: true,
    canUseAiPanel: true,
    approvalLevels: ["PROJECT_DIRECTOR", "CEO"],
  },
  admin: {
    level: "admin",
    label: "Admin",
    operatingRole: "CHAIRMAN",
    scopeType: "global",
    canView: true,
    canViewGlobalDashboard: true,
    canViewProjectDashboard: true,
    canViewDepartmentSummary: true,
    canCreatePlan: true,
    canApprovePlan: true,
    canCreateDirective: true,
    canCreateMeetingAction: true,
    canApproveProposal: true,
    canViewAudit: true,
    canUseAiPanel: true,
    approvalLevels: ["CHAIRMAN"],
  },
  leader: {
    level: "leader",
    label: "Lanh dao",
    operatingRole: "CEO",
    scopeType: "portfolio",
    canView: true,
    canViewGlobalDashboard: true,
    canViewProjectDashboard: true,
    canViewDepartmentSummary: true,
    canCreatePlan: true,
    canApprovePlan: true,
    canCreateDirective: true,
    canCreateMeetingAction: true,
    canApproveProposal: true,
    canViewAudit: true,
    canUseAiPanel: true,
    approvalLevels: ["PROJECT_DIRECTOR", "CEO"],
  },
  project_director: {
    level: "project_director",
    label: "Giam doc du an",
    operatingRole: "PROJECT_DIRECTOR",
    scopeType: "project",
    canView: true,
    canViewGlobalDashboard: false,
    canViewProjectDashboard: true,
    canViewDepartmentSummary: false,
    canCreatePlan: false,
    canApprovePlan: false,
    canCreateDirective: true,
    canCreateMeetingAction: true,
    canApproveProposal: true,
    canViewAudit: true,
    canUseAiPanel: false,
    approvalLevels: ["PROJECT_DIRECTOR"],
  },
  department_head: {
    level: "department_head",
    label: "Truong bo phan",
    operatingRole: "DEPARTMENT_HEAD",
    scopeType: "department",
    canView: true,
    canViewGlobalDashboard: false,
    canViewProjectDashboard: false,
    canViewDepartmentSummary: true,
    canCreatePlan: false,
    canApprovePlan: false,
    canCreateDirective: false,
    canCreateMeetingAction: true,
    canApproveProposal: true,
    canViewAudit: false,
    canUseAiPanel: false,
    approvalLevels: ["DEPARTMENT_HEAD"],
  },
  viewer: {
    level: "viewer",
    label: "Chi xem",
    operatingRole: "STAFF",
    scopeType: "task",
    canView: true,
    canViewGlobalDashboard: false,
    canViewProjectDashboard: false,
    canViewDepartmentSummary: false,
    canCreatePlan: false,
    canApprovePlan: false,
    canCreateDirective: false,
    canCreateMeetingAction: false,
    canApproveProposal: false,
    canViewAudit: true,
    canUseAiPanel: false,
    approvalLevels: [],
  },
};

export const EXECUTIVE_ACCESS_BY_ROLE: Partial<
  Record<Role, ExecutiveAccessLevel>
> = {
  super_admin: "owner",
  tong_giam_doc: "founder",
  admin: "admin",
  pho_tong_giam_doc: "leader",
  giam_doc_du_an: "project_director",
  dau_tu_phat_trien: "department_head",
  quan_ly_tai_chinh: "department_head",
  quan_ly_hop_dong: "department_head",
  phap_ly: "department_head",
  thiet_ke: "department_head",
  ky_thuat: "department_head",
  thi_cong: "department_head",
  qa_qc_chat_luong: "department_head",
  an_toan_lao_dong: "department_head",
};

export const EXECUTIVE_ROUTE_ROLES = Object.keys(
  EXECUTIVE_ACCESS_BY_ROLE,
) as Role[];

export function resolveExecutiveAccess(
  role: string,
): ExecutiveAccessPolicy | null {
  const level = EXECUTIVE_ACCESS_BY_ROLE[role as Role];

  return level ? accessPolicies[level] : null;
}

export function canAccessExecutiveModule(role: string) {
  return Boolean(resolveExecutiveAccess(role)?.canView);
}

export const EXECUTIVE_PAGE_NAV_ITEMS: Array<{
  key: ExecutivePageKey;
  label: string;
  href: string;
}> = [
  { key: "dashboard", label: "Dashboard lanh dao", href: "/executive" },
  {
    key: "investment-plans",
    label: "Ke hoach dau tu",
    href: "/executive/investment-plans",
  },
  {
    key: "leadership-team",
    label: "Danh sach lanh dao",
    href: "/executive/leadership-team",
  },
  {
    key: "directives",
    label: "Chi dao dieu hanh",
    href: "/executive/directives",
  },
  {
    key: "meetings",
    label: "Hop lanh dao",
    href: "/executive/meetings",
  },
  {
    key: "approvals",
    label: "Phe duyet",
    href: "/executive/approvals",
  },
  {
    key: "decision-log",
    label: "Nhat ky quyet dinh",
    href: "/executive/decision-log",
  },
];
