import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { PermissionAction } from "@/lib/permissions/can";
import type {
  ApprovalAuthorityLevel,
  ApprovalTargetType,
  ApprovalThresholdPolicy,
  PolicySettings,
  RiskGroupConfig,
  RiskSeverity,
} from "@/modules/settings/types";

type PolicySettingsStore = Partial<PolicySettings>;

export type PolicySettingsRepository = {
  listSettings(): Promise<PolicySettings>;
  getApprovalThresholdPolicy(policyId: string): Promise<ApprovalThresholdPolicy | undefined>;
  upsertApprovalThresholdPolicy(policy: ApprovalThresholdPolicy): Promise<ApprovalThresholdPolicy>;
  setApprovalThresholdPolicyActive(
    policyId: string,
    active: boolean,
    updatedBy: string,
    updatedAt: string,
  ): Promise<ApprovalThresholdPolicy>;
  getRiskGroupConfig(riskGroupId: string): Promise<RiskGroupConfig | undefined>;
  upsertRiskGroupConfig(riskGroup: RiskGroupConfig): Promise<RiskGroupConfig>;
  setRiskGroupConfigActive(
    riskGroupId: string,
    active: boolean,
    updatedBy: string,
    updatedAt: string,
  ): Promise<RiskGroupConfig>;
};

function now() {
  return new Date().toISOString();
}

function defaultTimestamps() {
  const timestamp = now();

  return {
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: "system",
    updatedBy: "system",
  };
}

export function createDefaultPolicySettings(): PolicySettings {
  const timestamps = defaultTimestamps();

  return {
    approvalThresholds: [
      {
        id: "policy-approval-under-20m",
        policyKey: "approval_under_20m",
        labelVi: "Duoi 20 trieu",
        targetType: "general",
        amountMin: 0,
        amountMax: 19_999_999.99,
        currency: "VND",
        approvalLevel: "DEPARTMENT_HEAD",
        approverRoleKey: "dau_tu_phat_trien",
        requiredPermissionKey: "proposal.review",
        escalateAfterDays: 3,
        escalateOnRiskLevels: ["high", "critical"],
        active: true,
        priority: 100,
        ...timestamps,
      },
      {
        id: "policy-approval-20m-200m",
        policyKey: "approval_20m_200m",
        labelVi: "20 trieu den 200 trieu",
        targetType: "general",
        amountMin: 20_000_000,
        amountMax: 199_999_999.99,
        currency: "VND",
        approvalLevel: "PROJECT_DIRECTOR",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        escalateAfterDays: 3,
        escalateOnRiskLevels: ["high", "critical"],
        active: true,
        priority: 110,
        ...timestamps,
      },
      {
        id: "policy-approval-200m-2b",
        policyKey: "approval_200m_2b",
        labelVi: "200 trieu den 2 ty",
        targetType: "general",
        amountMin: 200_000_000,
        amountMax: 1_999_999_999.99,
        currency: "VND",
        approvalLevel: "CEO",
        approverRoleKey: "tong_giam_doc",
        requiredPermissionKey: "proposal.approve",
        escalateAfterDays: 3,
        escalateOnRiskLevels: ["critical"],
        active: true,
        priority: 120,
        ...timestamps,
      },
      {
        id: "policy-approval-over-2b",
        policyKey: "approval_over_2b",
        labelVi: "Tren 2 ty hoac quyet dinh chien luoc",
        targetType: "general",
        amountMin: 2_000_000_000,
        currency: "VND",
        approvalLevel: "CHAIRMAN",
        approverRoleKey: "super_admin",
        requiredPermissionKey: "proposal.approve",
        escalateAfterDays: 3,
        escalateOnRiskLevels: ["high", "critical"],
        active: true,
        priority: 130,
        ...timestamps,
      },
    ],
    riskGroups: [
      {
        id: "risk-group-legal",
        riskKey: "legal",
        labelVi: "Phap ly",
        description: "Rui ro phap ly, ho so dat, chap thuan va tranh chap.",
        defaultSeverity: "high",
        moduleId: "legal",
        sortOrder: 10,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-planning-technical",
        riskKey: "planning_technical",
        labelVi: "Quy hoach / ky thuat",
        description: "Rui ro quy hoach, thiet ke, ky thuat va dieu kien trien khai.",
        defaultSeverity: "medium",
        moduleId: "project",
        sortOrder: 20,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-approval",
        riskKey: "approval",
        labelVi: "Approval",
        description: "Rui ro cham hoac vuot nguong phe duyet.",
        defaultSeverity: "medium",
        moduleId: "proposal",
        sortOrder: 30,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-schedule",
        riskKey: "schedule",
        labelVi: "Tien do",
        description: "Rui ro cham moc cong viec, ho so hoac thi cong.",
        defaultSeverity: "medium",
        moduleId: "task",
        sortOrder: 40,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-finance",
        riskKey: "finance",
        labelVi: "Tai chinh",
        description: "Rui ro dong tien, ngan sach, thanh toan hoac vuot chi phi.",
        defaultSeverity: "high",
        moduleId: "finance",
        sortOrder: 50,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-missing-document",
        riskKey: "missing_document",
        labelVi: "Ho so thieu",
        description: "Rui ro thieu ho so, tai lieu hoac bang chung bat buoc.",
        defaultSeverity: "medium",
        moduleId: "document",
        sortOrder: 60,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-system-permission",
        riskKey: "system_permission",
        labelVi: "He thong / phan quyen",
        description: "Rui ro cau hinh he thong, phan quyen hoac audit.",
        defaultSeverity: "medium",
        moduleId: "settings",
        sortOrder: 70,
        isDefault: true,
        active: true,
        ...timestamps,
      },
      {
        id: "risk-group-operation",
        riskKey: "operation",
        labelVi: "Van hanh / phoi hop",
        description: "Rui ro phoi hop, nguoi phu trach, quy trinh va handoff.",
        defaultSeverity: "low",
        moduleId: "project",
        sortOrder: 80,
        isDefault: true,
        active: true,
        ...timestamps,
      },
    ],
  };
}

function normalizeApprovalPolicy(policy: ApprovalThresholdPolicy): ApprovalThresholdPolicy {
  return {
    ...policy,
    currency: "VND",
    amountMin: policy.amountMin ?? 0,
    escalateAfterDays: policy.escalateAfterDays ?? 3,
    escalateOnRiskLevels: policy.escalateOnRiskLevels ?? [],
    active: policy.active ?? true,
    priority: policy.priority ?? 100,
  };
}

function normalizeRiskGroup(riskGroup: RiskGroupConfig): RiskGroupConfig {
  return {
    ...riskGroup,
    sortOrder: riskGroup.sortOrder ?? 100,
    isDefault: riskGroup.isDefault ?? false,
    active: riskGroup.active ?? true,
  };
}

function mergeById<T extends { id: string }>(defaults: T[], stored: T[] | undefined) {
  if (!stored) {
    return defaults;
  }

  const itemsById = new Map(defaults.map((item) => [item.id, item]));

  for (const item of stored) {
    itemsById.set(item.id, {
      ...itemsById.get(item.id),
      ...item,
    });
  }

  return [...itemsById.values()];
}

function normalizeStore(store: PolicySettingsStore): PolicySettings {
  const defaults = createDefaultPolicySettings();

  return {
    approvalThresholds: mergeById(defaults.approvalThresholds, store.approvalThresholds).map(normalizeApprovalPolicy),
    riskGroups: mergeById(defaults.riskGroups, store.riskGroups).map(normalizeRiskGroup),
  };
}

function sortSettings(settings: PolicySettings): PolicySettings {
  return {
    approvalThresholds: [...settings.approvalThresholds].sort(
      (a, b) =>
        a.priority - b.priority ||
        a.targetType.localeCompare(b.targetType) ||
        (a.amountMin ?? 0) - (b.amountMin ?? 0) ||
        a.policyKey.localeCompare(b.policyKey),
    ),
    riskGroups: [...settings.riskGroups].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.riskKey.localeCompare(b.riskKey),
    ),
  };
}

export class JsonPolicySettingsRepository implements PolicySettingsRepository {
  constructor(
    private readonly filePath = path.join(process.cwd(), ".mock-data", "policy-settings.json"),
  ) {}

  async listSettings() {
    return sortSettings(await this.readStore());
  }

  async getApprovalThresholdPolicy(policyId: string) {
    const settings = await this.readStore();

    return settings.approvalThresholds.find((policy) => policy.id === policyId);
  }

  async upsertApprovalThresholdPolicy(policy: ApprovalThresholdPolicy) {
    const settings = await this.readStore();
    const normalizedPolicy = normalizeApprovalPolicy(policy);
    const exists = settings.approvalThresholds.some((item) => item.id === policy.id);

    await this.writeStore({
      ...settings,
      approvalThresholds: exists
        ? settings.approvalThresholds.map((item) => (item.id === policy.id ? normalizedPolicy : item))
        : [normalizedPolicy, ...settings.approvalThresholds],
    });

    return normalizedPolicy;
  }

  async setApprovalThresholdPolicyActive(policyId: string, active: boolean, updatedBy: string, updatedAt: string) {
    const existing = await this.getApprovalThresholdPolicy(policyId);

    if (!existing) {
      throw new Error("Khong tim thay approval policy.");
    }

    return this.upsertApprovalThresholdPolicy({
      ...existing,
      active,
      updatedBy,
      updatedAt,
    });
  }

  async getRiskGroupConfig(riskGroupId: string) {
    const settings = await this.readStore();

    return settings.riskGroups.find((riskGroup) => riskGroup.id === riskGroupId);
  }

  async upsertRiskGroupConfig(riskGroup: RiskGroupConfig) {
    const settings = await this.readStore();
    const normalizedRiskGroup = normalizeRiskGroup(riskGroup);
    const exists = settings.riskGroups.some((item) => item.id === riskGroup.id);

    await this.writeStore({
      ...settings,
      riskGroups: exists
        ? settings.riskGroups.map((item) => (item.id === riskGroup.id ? normalizedRiskGroup : item))
        : [normalizedRiskGroup, ...settings.riskGroups],
    });

    return normalizedRiskGroup;
  }

  async setRiskGroupConfigActive(riskGroupId: string, active: boolean, updatedBy: string, updatedAt: string) {
    const existing = await this.getRiskGroupConfig(riskGroupId);

    if (!existing) {
      throw new Error("Khong tim thay nhom risk.");
    }

    return this.upsertRiskGroupConfig({
      ...existing,
      active,
      updatedBy,
      updatedAt,
    });
  }

  private async readStore(): Promise<PolicySettings> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as PolicySettingsStore;

      return normalizeStore(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return normalizeStore({});
      }

      throw error;
    }
  }

  private async writeStore(store: PolicySettings) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(sortSettings(store), null, 2)}\n`, "utf8");
  }
}

type ApprovalThresholdPolicyRow = {
  id: string;
  policy_key: string;
  label_vi: string;
  target_type: ApprovalTargetType;
  amount_min: number | null;
  amount_max: number | null;
  currency: "VND";
  approval_level: ApprovalAuthorityLevel;
  approver_role_key: string;
  required_permission_key: PermissionAction;
  escalate_after_days: number | null;
  escalate_on_risk_levels: RiskSeverity[] | null;
  organization_id: string | null;
  project_id: string | null;
  axis_id: string | null;
  workstream_id: string | null;
  module_id: string | null;
  record_id: string | null;
  is_active: boolean;
  priority: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type RiskGroupConfigRow = {
  id: string;
  risk_key: string;
  label_vi: string;
  description: string | null;
  default_severity: RiskSeverity;
  module_id: string | null;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function toApprovalPolicy(row: ApprovalThresholdPolicyRow): ApprovalThresholdPolicy {
  return normalizeApprovalPolicy({
    id: row.id,
    policyKey: row.policy_key,
    labelVi: row.label_vi,
    targetType: row.target_type,
    amountMin: row.amount_min ?? undefined,
    amountMax: row.amount_max ?? undefined,
    currency: row.currency,
    approvalLevel: row.approval_level,
    approverRoleKey: row.approver_role_key,
    requiredPermissionKey: row.required_permission_key,
    escalateAfterDays: row.escalate_after_days ?? undefined,
    escalateOnRiskLevels: row.escalate_on_risk_levels ?? [],
    organizationId: row.organization_id ?? undefined,
    projectId: row.project_id ?? undefined,
    axisId: row.axis_id ?? undefined,
    workstreamId: row.workstream_id ?? undefined,
    moduleId: row.module_id ?? undefined,
    recordId: row.record_id ?? undefined,
    active: row.is_active,
    priority: row.priority,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toApprovalPolicyRow(policy: ApprovalThresholdPolicy) {
  return {
    id: policy.id,
    policy_key: policy.policyKey,
    label_vi: policy.labelVi,
    target_type: policy.targetType,
    amount_min: policy.amountMin ?? 0,
    amount_max: policy.amountMax ?? null,
    currency: policy.currency,
    approval_level: policy.approvalLevel,
    approver_role_key: policy.approverRoleKey,
    required_permission_key: policy.requiredPermissionKey,
    escalate_after_days: policy.escalateAfterDays ?? 3,
    escalate_on_risk_levels: policy.escalateOnRiskLevels ?? [],
    organization_id: policy.organizationId ?? null,
    project_id: policy.projectId ?? null,
    axis_id: policy.axisId ?? null,
    workstream_id: policy.workstreamId ?? null,
    module_id: policy.moduleId ?? null,
    record_id: policy.recordId ?? null,
    is_active: policy.active,
    priority: policy.priority,
    created_by: policy.createdBy ?? null,
    updated_by: policy.updatedBy ?? null,
    created_at: policy.createdAt,
    updated_at: policy.updatedAt,
  };
}

function toRiskGroup(row: RiskGroupConfigRow): RiskGroupConfig {
  return normalizeRiskGroup({
    id: row.id,
    riskKey: row.risk_key,
    labelVi: row.label_vi,
    description: row.description ?? undefined,
    defaultSeverity: row.default_severity,
    moduleId: row.module_id ?? undefined,
    sortOrder: row.sort_order,
    isDefault: row.is_default,
    active: row.is_active,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toRiskGroupRow(riskGroup: RiskGroupConfig) {
  return {
    id: riskGroup.id,
    risk_key: riskGroup.riskKey,
    label_vi: riskGroup.labelVi,
    description: riskGroup.description ?? null,
    default_severity: riskGroup.defaultSeverity,
    module_id: riskGroup.moduleId ?? null,
    sort_order: riskGroup.sortOrder,
    is_default: riskGroup.isDefault,
    is_active: riskGroup.active,
    created_by: riskGroup.createdBy ?? null,
    updated_by: riskGroup.updatedBy ?? null,
    created_at: riskGroup.createdAt,
    updated_at: riskGroup.updatedAt,
  };
}

export class SupabasePolicySettingsRepository implements PolicySettingsRepository {
  async listSettings() {
    const supabase = await createSupabaseServerClient();
    const [approvalResult, riskGroupResult] = await Promise.all([
      supabase.from("approval_threshold_policies").select("*").order("priority", { ascending: true }),
      supabase.from("risk_group_configs").select("*").order("sort_order", { ascending: true }),
    ]);

    if (approvalResult.error) {
      throw new Error(approvalResult.error.message);
    }

    if (riskGroupResult.error) {
      throw new Error(riskGroupResult.error.message);
    }

    const approvalThresholds = ((approvalResult.data ?? []) as ApprovalThresholdPolicyRow[]).map(toApprovalPolicy);
    const riskGroups = ((riskGroupResult.data ?? []) as RiskGroupConfigRow[]).map(toRiskGroup);

    return sortSettings(
      approvalThresholds.length > 0 || riskGroups.length > 0
        ? normalizeStore({ approvalThresholds, riskGroups })
        : createDefaultPolicySettings(),
    );
  }

  async getApprovalThresholdPolicy(policyId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("approval_threshold_policies")
      .select("*")
      .eq("id", policyId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toApprovalPolicy(data as ApprovalThresholdPolicyRow) : undefined;
  }

  async upsertApprovalThresholdPolicy(policy: ApprovalThresholdPolicy) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("approval_threshold_policies")
      .upsert(toApprovalPolicyRow(normalizeApprovalPolicy(policy)), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toApprovalPolicy(data as ApprovalThresholdPolicyRow);
  }

  async setApprovalThresholdPolicyActive(policyId: string, active: boolean, updatedBy: string, updatedAt: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("approval_threshold_policies")
      .update({ is_active: active, updated_by: updatedBy, updated_at: updatedAt })
      .eq("id", policyId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toApprovalPolicy(data as ApprovalThresholdPolicyRow);
  }

  async getRiskGroupConfig(riskGroupId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("risk_group_configs")
      .select("*")
      .eq("id", riskGroupId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toRiskGroup(data as RiskGroupConfigRow) : undefined;
  }

  async upsertRiskGroupConfig(riskGroup: RiskGroupConfig) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("risk_group_configs")
      .upsert(toRiskGroupRow(normalizeRiskGroup(riskGroup)), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toRiskGroup(data as RiskGroupConfigRow);
  }

  async setRiskGroupConfigActive(riskGroupId: string, active: boolean, updatedBy: string, updatedAt: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("risk_group_configs")
      .update({ is_active: active, updated_by: updatedBy, updated_at: updatedAt })
      .eq("id", riskGroupId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toRiskGroup(data as RiskGroupConfigRow);
  }
}

export const jsonPolicySettingsRepository = new JsonPolicySettingsRepository();
export const supabasePolicySettingsRepository = new SupabasePolicySettingsRepository();
export const policySettingsRepository = selectRepository<PolicySettingsRepository>({
  mock: jsonPolicySettingsRepository,
  supabase: supabasePolicySettingsRepository,
});
