import {
  Ban,
  CheckCircle2,
  Coins,
  Plus,
  Save,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

import {
  setApprovalThresholdPolicyActiveAction,
  setRiskGroupConfigActiveAction,
  upsertApprovalThresholdPolicyAction,
  upsertRiskGroupConfigAction,
} from "@/modules/settings/actions";
import { PolicySubmitButton } from "@/modules/settings/components/policy-submit-button";
import type {
  ApprovalAuthorityLevel,
  ApprovalTargetType,
  ApprovalThresholdPolicy,
  PermissionCatalogItem,
  PolicySettings,
  RiskGroupConfig,
  RiskSeverity,
  RolePermissionCatalog,
} from "@/modules/settings/types";

const targetTypeLabels = {
  proposal: "De xuat",
  finance: "Tai chinh",
  investment: "Dau tu",
  contract: "Hop dong",
  general: "Mac dinh",
} satisfies Record<ApprovalTargetType, string>;

const approvalLevelLabels = {
  DEPARTMENT_HEAD: "Truong bo phan",
  PROJECT_DIRECTOR: "Giam doc du an",
  CEO: "Tong giam doc",
  CHAIRMAN: "Chu tich",
} satisfies Record<ApprovalAuthorityLevel, string>;

const severityLabels = {
  low: "Thap",
  medium: "Trung binh",
  high: "Cao",
  critical: "Nghiem trong",
} satisfies Record<RiskSeverity, string>;

const riskSeverityOptions = Object.keys(severityLabels) as RiskSeverity[];
const escalationRiskSeverityOptions = ["high", "critical"] satisfies RiskSeverity[];
const approvalLevels = Object.keys(approvalLevelLabels) as ApprovalAuthorityLevel[];
const targetTypes = Object.keys(targetTypeLabels) as ApprovalTargetType[];

function badgeClassName(tone: "green" | "slate" | "amber" | "red" | "blue" | "purple") {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-cyan-50 text-cyan-800 ring-cyan-200",
    purple: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  };

  return `rounded-full px-2 py-1 text-xs font-medium ring-1 ${tones[tone]}`;
}

function severityTone(severity: RiskSeverity) {
  if (severity === "critical") {
    return "red";
  }

  if (severity === "high") {
    return "amber";
  }

  if (severity === "medium") {
    return "blue";
  }

  return "green";
}

function roleLabel(catalog: RolePermissionCatalog, roleKey: string) {
  return catalog.roles.find((role) => role.key === roleKey)?.labelVi ?? roleKey;
}

function permissionLabel(permissions: PermissionCatalogItem[], permissionKey: string) {
  return permissions.find((permission) => permission.key === permissionKey)?.labelVi ?? permissionKey;
}

function moduleOptions(permissions: PermissionCatalogItem[]) {
  return Array.from(new Set(["project", "settings", ...permissions.map((permission) => permission.module)])).sort();
}

function moduleLabel(module: string) {
  const labels: Record<string, string> = {
    axis1: "Truc 1",
    project: "Du an",
    task: "Cong viec",
    document: "Ho so",
    legal: "Phap ly",
    meeting: "Hop/Quyet dinh",
    finance: "Tai chinh",
    proposal: "De xuat",
    investment: "Dau tu",
    contract: "Hop dong",
    settings: "Cai dat",
    audit: "Audit",
    ai: "AI",
  };

  return labels[module] ?? module;
}

function formatAmount(value: number | undefined) {
  if (value === undefined) {
    return "Khong gioi han";
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

function amountRange(policy: ApprovalThresholdPolicy) {
  return `${formatAmount(policy.amountMin ?? 0)} - ${formatAmount(policy.amountMax)}`;
}

function scopeSummary(policy: ApprovalThresholdPolicy) {
  const parts = [
    policy.organizationId ? `To chuc ${policy.organizationId}` : undefined,
    policy.projectId ? `Du an ${policy.projectId}` : undefined,
    policy.axisId ? `Truc ${policy.axisId}` : undefined,
    policy.workstreamId ? `Luong viec ${policy.workstreamId}` : undefined,
    policy.moduleId ? `Module ${policy.moduleId}` : undefined,
    policy.recordId ? `Ban ghi ${policy.recordId}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Toan cuc";
}

function ScopeFields({ policy }: { policy?: ApprovalThresholdPolicy }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>To chuc</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="organizationId"
          defaultValue={policy?.organizationId}
          placeholder="org-green-nest"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Du an</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="projectId"
          defaultValue={policy?.projectId}
          placeholder="project-riverside"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Truc</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="axisId"
          defaultValue={policy?.axisId}
          placeholder="project_management"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Luong viec</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="workstreamId"
          defaultValue={policy?.workstreamId}
          placeholder="legal_review"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Module</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="moduleId"
          defaultValue={policy?.moduleId}
          placeholder="proposal"
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Ban ghi</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="recordId"
          defaultValue={policy?.recordId}
          placeholder="record id"
        />
      </label>
    </div>
  );
}

function ApprovalPolicyFields({
  catalog,
  policy,
}: {
  catalog: RolePermissionCatalog;
  policy?: ApprovalThresholdPolicy;
}) {
  const selectedRiskLevels = new Set(policy?.escalateOnRiskLevels ?? []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Ma policy *</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="policyKey"
            defaultValue={policy?.policyKey}
            placeholder="finance_small_payment"
            required
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Ten hien thi *</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="labelVi"
            defaultValue={policy?.labelVi}
            placeholder="Thanh toan nho"
            required
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Loai doi tuong *</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="targetType"
            defaultValue={policy?.targetType ?? "proposal"}
          >
            {targetTypes.map((targetType) => (
              <option key={targetType} value={targetType}>
                {targetTypeLabels[targetType]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Thu tu uu tien</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="priority"
            type="number"
            min={0}
            step={1}
            defaultValue={policy?.priority ?? 100}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Nang cap sau (ngay)</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="escalateAfterDays"
            type="number"
            min={1}
            max={30}
            step={1}
            defaultValue={policy?.escalateAfterDays ?? 3}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>So tien tu</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="amountMin"
            type="number"
            min={0}
            step={1000}
            defaultValue={policy?.amountMin ?? 0}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>So tien den</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="amountMax"
            type="number"
            min={0}
            step={1000}
            defaultValue={policy?.amountMax}
            placeholder="De trong neu khong co tran"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Cap duyet *</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="approvalLevel"
            defaultValue={policy?.approvalLevel ?? "DEPARTMENT_HEAD"}
          >
            {approvalLevels.map((approvalLevel) => (
              <option key={approvalLevel} value={approvalLevel}>
                {approvalLevelLabels[approvalLevel]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Role duyet *</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="approverRoleKey"
            defaultValue={policy?.approverRoleKey ?? ""}
            required
          >
            <option value="">Chon role</option>
            {catalog.roles
              .filter((role) => role.active || role.key === policy?.approverRoleKey)
              .map((role) => (
                <option key={role.key} value={role.key}>
                  {role.labelVi}
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Quyen bat buoc *</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="requiredPermissionKey"
            defaultValue={policy?.requiredPermissionKey ?? "proposal.review"}
            required
          >
            {catalog.permissions.map((permission) => (
              <option key={permission.key} value={permission.key}>
                {permission.labelVi} ({permission.key})
              </option>
            ))}
          </select>
        </label>
        <fieldset className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
          <legend>Nang cap khi risk</legend>
          <div className="flex flex-wrap gap-3">
            {escalationRiskSeverityOptions.map((riskLevel) => (
              <label className="inline-flex items-center gap-2 text-sm text-slate-700" key={riskLevel}>
                <input
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  type="checkbox"
                  name="escalateOnRiskLevels"
                  value={riskLevel}
                  defaultChecked={selectedRiskLevels.has(riskLevel)}
                />
                <span>{severityLabels[riskLevel]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <ScopeFields policy={policy} />
    </div>
  );
}

function RiskGroupFields({
  modules,
  riskGroup,
}: {
  modules: string[];
  riskGroup?: RiskGroupConfig;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Ma nhom risk *</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="riskKey"
          defaultValue={riskGroup?.riskKey}
          placeholder="legal"
          required
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Ten hien thi *</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="labelVi"
          defaultValue={riskGroup?.labelVi}
          placeholder="Phap ly"
          required
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Muc do mac dinh *</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="defaultSeverity"
          defaultValue={riskGroup?.defaultSeverity ?? "medium"}
        >
          {riskSeverityOptions.map((severity) => (
            <option key={severity} value={severity}>
              {severityLabels[severity]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Module</span>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="moduleId"
          defaultValue={riskGroup?.moduleId ?? ""}
        >
          <option value="">Khong chon</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {moduleLabel(module)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Thu tu sap xep</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="sortOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={riskGroup?.sortOrder ?? 100}
        />
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-5">
        <span>Mo ta</span>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          name="description"
          defaultValue={riskGroup?.description}
          placeholder="Pham vi su dung cua nhom risk"
        />
      </label>
    </div>
  );
}

export function PolicySettingsPanel({
  catalog,
  settings,
}: {
  catalog: RolePermissionCatalog;
  settings: PolicySettings;
}) {
  const modules = moduleOptions(catalog.permissions);
  const activePolicies = settings.approvalThresholds.filter((policy) => policy.active).length;
  const activeRiskGroups = settings.riskGroups.filter((riskGroup) => riskGroup.active).length;

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm" id="policy-settings">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Coins className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            Chinh sach co ban
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="rounded-md bg-slate-50 px-3 py-2">
            {activePolicies}/{settings.approvalThresholds.length} nguong dang bat
          </span>
          <span className="rounded-md bg-slate-50 px-3 py-2">
            {activeRiskGroups}/{settings.riskGroups.length} nhom risk dang bat
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Nguong duyet tien</h3>
        </div>

        <form action={upsertApprovalThresholdPolicyAction} className="mt-4 space-y-4">
          <ApprovalPolicyFields catalog={catalog} />
          <PolicySubmitButton pendingChildren="Dang them chinh sach..." size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Them policy
          </PolicySubmitButton>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Chinh sach</th>
                <th className="px-3 py-2">Khoang tien</th>
                <th className="px-3 py-2">Cap duyet</th>
                <th className="px-3 py-2">Nguoi duyet</th>
                <th className="px-3 py-2">Pham vi</th>
                <th className="px-3 py-2">Trang thai</th>
                <th className="px-3 py-2">Cap nhat</th>
                <th className="px-3 py-2">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.approvalThresholds.map((policy) => (
                <tr className={policy.active ? "align-top" : "align-top bg-slate-50/70"} key={policy.id}>
                  <td className="min-w-60 px-3 py-3">
                    <p className="font-semibold text-slate-950">{policy.labelVi}</p>
                    <p className="mt-1 text-xs text-slate-500">{policy.policyKey}</p>
                    <span className={badgeClassName("blue")}>{targetTypeLabels[policy.targetType]}</span>
                  </td>
                  <td className="min-w-52 px-3 py-3 text-slate-700">
                    <p>{amountRange(policy)}</p>
                    <p className="mt-1 text-xs text-slate-500">Uu tien {policy.priority}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={badgeClassName("purple")}>{approvalLevelLabels[policy.approvalLevel]}</span>
                  </td>
                  <td className="min-w-60 px-3 py-3 text-slate-700">
                    <p className="font-medium text-slate-900">{roleLabel(catalog, policy.approverRoleKey)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {permissionLabel(catalog.permissions, policy.requiredPermissionKey)}
                    </p>
                  </td>
                  <td className="min-w-64 px-3 py-3 text-slate-700">{scopeSummary(policy)}</td>
                  <td className="px-3 py-3">
                    <span className={badgeClassName(policy.active ? "green" : "slate")}>
                      {policy.active ? "Dang bat" : "Da tat"}
                    </span>
                  </td>
                  <td className="min-w-44 px-3 py-3 text-slate-600">
                    <p>{policy.updatedBy ?? "-"}</p>
                    <p className="text-xs text-slate-500">{policy.updatedAt}</p>
                  </td>
                  <td className="min-w-[28rem] px-3 py-3">
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        Chinh sua
                      </summary>
                      <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                        <form action={upsertApprovalThresholdPolicyAction} className="space-y-4">
                          <input type="hidden" name="policyId" value={policy.id} />
                          <input type="hidden" name="active" value={String(policy.active)} />
                          <ApprovalPolicyFields catalog={catalog} policy={policy} />
                          <PolicySubmitButton pendingChildren="Dang luu chinh sach..." size="sm">
                            <Save className="h-4 w-4" aria-hidden="true" />
                            Luu policy
                          </PolicySubmitButton>
                        </form>
                        <details className="border-t border-rose-100 pt-3">
                          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                            <Ban className="h-4 w-4" aria-hidden="true" />
                            {policy.active ? "Vo hieu hoa" : "Bat lai"}
                          </summary>
                          <form action={setApprovalThresholdPolicyActiveAction} className="mt-3">
                            <input type="hidden" name="policyId" value={policy.id} />
                            <input type="hidden" name="active" value={policy.active ? "false" : "true"} />
                            <PolicySubmitButton
                              disabled={policy.active && activePolicies <= 1}
                              pendingChildren={policy.active ? "Dang tat..." : "Dang bat..."}
                              size="sm"
                              variant="outline"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Xac nhan
                            </PolicySubmitButton>
                            {policy.active && activePolicies <= 1 ? (
                              <p className="mt-2 text-xs text-rose-700">
                                Khong the tat chinh sach active cuoi cung.
                              </p>
                            ) : null}
                          </form>
                        </details>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-slate-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Nhom risk</h3>
        </div>

        <form action={upsertRiskGroupConfigAction} className="mt-4 space-y-4">
          <RiskGroupFields modules={modules} />
          <PolicySubmitButton pendingChildren="Dang them nhom risk..." size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Them nhom risk
          </PolicySubmitButton>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Nhom risk</th>
                <th className="px-3 py-2">Muc do</th>
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2">Thu tu</th>
                <th className="px-3 py-2">Trang thai</th>
                <th className="px-3 py-2">Cap nhat</th>
                <th className="px-3 py-2">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.riskGroups.map((riskGroup) => (
                <tr className={riskGroup.active ? "align-top" : "align-top bg-slate-50/70"} key={riskGroup.id}>
                  <td className="min-w-72 px-3 py-3">
                    <p className="font-semibold text-slate-950">{riskGroup.labelVi}</p>
                    <p className="mt-1 text-xs text-slate-500">{riskGroup.riskKey}</p>
                    {riskGroup.description ? (
                      <p className="mt-2 max-w-md text-slate-600">{riskGroup.description}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <span className={badgeClassName(severityTone(riskGroup.defaultSeverity))}>
                      {severityLabels[riskGroup.defaultSeverity]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {riskGroup.moduleId ? moduleLabel(riskGroup.moduleId) : "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{riskGroup.sortOrder}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={badgeClassName(riskGroup.active ? "green" : "slate")}>
                        {riskGroup.active ? "Dang bat" : "Da tat"}
                      </span>
                      {riskGroup.isDefault ? <span className={badgeClassName("amber")}>Mac dinh</span> : null}
                    </div>
                  </td>
                  <td className="min-w-44 px-3 py-3 text-slate-600">
                    <p>{riskGroup.updatedBy ?? "-"}</p>
                    <p className="text-xs text-slate-500">{riskGroup.updatedAt}</p>
                  </td>
                  <td className="min-w-[28rem] px-3 py-3">
                    <details>
                      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        Chinh sua
                      </summary>
                      <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                        <form action={upsertRiskGroupConfigAction} className="space-y-4">
                          <input type="hidden" name="riskGroupId" value={riskGroup.id} />
                          <input type="hidden" name="active" value={String(riskGroup.active)} />
                          <input type="hidden" name="isDefault" value={String(riskGroup.isDefault)} />
                          <RiskGroupFields modules={modules} riskGroup={riskGroup} />
                          <PolicySubmitButton pendingChildren="Dang luu nhom risk..." size="sm">
                            <Save className="h-4 w-4" aria-hidden="true" />
                            Luu nhom risk
                          </PolicySubmitButton>
                        </form>
                        <details className="border-t border-rose-100 pt-3">
                          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                            <Ban className="h-4 w-4" aria-hidden="true" />
                            {riskGroup.active ? "Vo hieu hoa" : "Bat lai"}
                          </summary>
                          <form action={setRiskGroupConfigActiveAction} className="mt-3">
                            <input type="hidden" name="riskGroupId" value={riskGroup.id} />
                            <input type="hidden" name="active" value={riskGroup.active ? "false" : "true"} />
                            <PolicySubmitButton
                              pendingChildren={riskGroup.active ? "Dang tat..." : "Dang bat..."}
                              size="sm"
                              variant="outline"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Xac nhan
                            </PolicySubmitButton>
                          </form>
                        </details>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
