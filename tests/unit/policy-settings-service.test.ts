import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { JsonRolePermissionCatalogRepository } from "@/modules/settings/services/role-permission-catalog-repository";
import {
  JsonPolicySettingsRepository,
  createDefaultPolicySettings,
} from "@/modules/settings/services/policy-settings-repository";
import {
  listActiveRiskGroups,
  policySettingsAuditValue,
  resolveApprovalPolicyForProposal,
  setApprovalThresholdPolicyActive,
  setRiskGroupConfigActive,
  upsertApprovalThresholdPolicy,
  upsertRiskGroupConfig,
} from "@/modules/settings/services/policy-settings-service";

let tempDir: string;
let repository: JsonPolicySettingsRepository;
let catalogRepository: JsonRolePermissionCatalogRepository;

const settingsManager: PermissionUser = { id: "mock-founder", role: "admin" };
const chairman: PermissionUser = { id: "chairman-01", role: "chu_tich" };
const viewer: PermissionUser = { id: "viewer-user", role: "viewer" };

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-policy-settings-"));
  repository = new JsonPolicySettingsRepository(path.join(tempDir, "policy-settings.json"));
  catalogRepository = new JsonRolePermissionCatalogRepository(path.join(tempDir, "role-permission-catalog.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("policy settings service", () => {
  it("creates, updates, disables and resolves approval threshold policies", async () => {
    const created = await upsertApprovalThresholdPolicy(
      {
        policyKey: "finance_small_payment",
        labelVi: "Thanh toan nho",
        targetType: "finance",
        amountMin: 0,
        amountMax: 50_000_000,
        approvalLevel: "DEPARTMENT_HEAD",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 10,
        escalateAfterDays: 2,
        projectId: "project-a",
      },
      settingsManager,
      { repository, catalogRepository },
    );

    expect(created.policy).toMatchObject({
      policyKey: "finance_small_payment",
      targetType: "finance",
      currency: "VND",
      active: true,
      createdBy: settingsManager.id,
      updatedBy: settingsManager.id,
      projectId: "project-a",
    });

    const updated = await upsertApprovalThresholdPolicy(
      {
        id: created.policy.id,
        policyKey: "finance_small_payment",
        labelVi: "Thanh toan nho cap nhat",
        targetType: "finance",
        amountMin: 0,
        amountMax: 75_000_000,
        approvalLevel: "PROJECT_DIRECTOR",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 10,
        escalateAfterDays: 4,
        projectId: "project-a",
      },
      settingsManager,
      { repository, catalogRepository },
    );

    expect(updated.previousPolicy?.amountMax).toBe(50_000_000);
    expect(updated.policy).toMatchObject({
      id: created.policy.id,
      labelVi: "Thanh toan nho cap nhat",
      amountMax: 75_000_000,
      approvalLevel: "PROJECT_DIRECTOR",
    });

    const resolved = await resolveApprovalPolicyForProposal(
      {
        targetType: "finance",
        amount: 60_000_000,
        scope: { projectId: "project-a" },
      },
      repository,
    );

    expect(resolved).toMatchObject({
      approverRole: "quan_ly_tai_chinh",
      requiredPermission: "proposal.approve",
      thresholdPolicyId: created.policy.id,
      thresholdLabel: "Thanh toan nho cap nhat",
      escalateAfterDays: 4,
    });

    const disabled = await setApprovalThresholdPolicyActive(created.policy.id, false, settingsManager, {
      repository,
    });

    expect(disabled.previousPolicy?.active).toBe(true);
    expect(disabled.policy.active).toBe(false);
  });

  it("defaults and persists policy escalation day thresholds", async () => {
    const defaults = createDefaultPolicySettings().approvalThresholds;

    expect(defaults.every((policy) => policy.escalateAfterDays === 3)).toBe(true);

    const created = await upsertApprovalThresholdPolicy(
      {
        policyKey: "contract_escalation_days",
        labelVi: "Hop dong qua han",
        targetType: "contract",
        amountMin: 0,
        approvalLevel: "PROJECT_DIRECTOR",
        approverRoleKey: "quan_ly_hop_dong",
        requiredPermissionKey: "proposal.approve",
        priority: 7,
        escalateAfterDays: 5,
      },
      settingsManager,
      { repository, catalogRepository },
    );
    const listed = await repository.listSettings();

    expect(created.policy.escalateAfterDays).toBe(5);
    expect(
      listed.approvalThresholds.find(
        (policy) => policy.id === created.policy.id,
      )?.escalateAfterDays,
    ).toBe(5);
    expect(policySettingsAuditValue(created.policy)).toMatchObject({
      escalateAfterDays: 5,
    });
  });

  it("uses fallback risk groups and prevents disabling all default risk groups", async () => {
    const fallbackRiskGroups = await listActiveRiskGroups(repository);

    expect(fallbackRiskGroups.map((group) => group.riskKey)).toEqual(
      expect.arrayContaining([
        "legal",
        "planning_technical",
        "approval",
        "schedule",
        "finance",
        "missing_document",
        "system_permission",
        "operation",
      ]),
    );

    const created = await upsertRiskGroupConfig(
      {
        riskKey: "community_relation",
        labelVi: "Quan he cong dong",
        defaultSeverity: "medium",
        moduleId: "legal",
        sortOrder: 90,
      },
      settingsManager,
      { repository },
    );

    expect(created.riskGroup).toMatchObject({
      riskKey: "community_relation",
      active: true,
      isDefault: false,
    });

    const defaults = createDefaultPolicySettings().riskGroups;

    for (const group of defaults.slice(1)) {
      await setRiskGroupConfigActive(group.id, false, settingsManager, { repository });
    }

    await expect(
      setRiskGroupConfigActive(defaults[0].id, false, settingsManager, { repository }),
    ).rejects.toThrow(/default|mac dinh|risk/i);

    await expect(
      upsertRiskGroupConfig(
        {
          id: defaults[0].id,
          riskKey: defaults[0].riskKey,
          labelVi: defaults[0].labelVi,
          defaultSeverity: defaults[0].defaultSeverity,
          moduleId: defaults[0].moduleId,
          sortOrder: defaults[0].sortOrder,
          active: false,
        },
        settingsManager,
        { repository },
      ),
    ).rejects.toThrow(/default|mac dinh|risk/i);
  });

  it("rejects duplicate active ranges when priority does not resolve order", async () => {
    await upsertApprovalThresholdPolicy(
      {
        policyKey: "finance_range_a",
        labelVi: "Range A",
        targetType: "finance",
        amountMin: 0,
        amountMax: 100_000_000,
        approvalLevel: "DEPARTMENT_HEAD",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 20,
      },
      settingsManager,
      { repository, catalogRepository },
    );

    await expect(
      upsertApprovalThresholdPolicy(
        {
          policyKey: "finance_range_b",
          labelVi: "Range B",
          targetType: "finance",
          amountMin: 50_000_000,
          amountMax: 150_000_000,
          approvalLevel: "PROJECT_DIRECTOR",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "proposal.approve",
          priority: 20,
        },
        settingsManager,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/range|overlap|trung/i);
  });

  it("rejects re-enabled duplicate ranges and duplicate policy keys", async () => {
    const first = await upsertApprovalThresholdPolicy(
      {
        policyKey: "finance_range_a",
        labelVi: "Range A",
        targetType: "finance",
        amountMin: 0,
        amountMax: 100_000_000,
        approvalLevel: "DEPARTMENT_HEAD",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 20,
      },
      settingsManager,
      { repository, catalogRepository },
    );

    const inactiveOverlap = await upsertApprovalThresholdPolicy(
      {
        policyKey: "finance_range_b",
        labelVi: "Range B",
        targetType: "finance",
        amountMin: 50_000_000,
        amountMax: 150_000_000,
        approvalLevel: "PROJECT_DIRECTOR",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 20,
        active: false,
      },
      settingsManager,
      { repository, catalogRepository },
    );

    await expect(
      setApprovalThresholdPolicyActive(inactiveOverlap.policy.id, true, settingsManager, {
        repository,
      }),
    ).rejects.toThrow(/range|overlap|trung/i);

    await expect(
      upsertApprovalThresholdPolicy(
        {
          id: inactiveOverlap.policy.id,
          policyKey: first.policy.policyKey,
          labelVi: "Range B renamed",
          targetType: "finance",
          amountMin: 150_000_001,
          approvalLevel: "PROJECT_DIRECTOR",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "proposal.approve",
          priority: 30,
        },
        settingsManager,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/policy key/i);
  });

  it("prevents disabling every approval policy", async () => {
    const defaults = createDefaultPolicySettings().approvalThresholds;

    for (const policy of defaults.slice(1)) {
      await setApprovalThresholdPolicyActive(policy.id, false, settingsManager, {
        repository,
      });
    }

    await expect(
      setApprovalThresholdPolicyActive(defaults[0].id, false, settingsManager, {
        repository,
      }),
    ).rejects.toThrow(/approval policy/i);

    await expect(
      upsertApprovalThresholdPolicy(
        {
          id: defaults[0].id,
          policyKey: defaults[0].policyKey,
          labelVi: defaults[0].labelVi,
          targetType: defaults[0].targetType,
          amountMin: defaults[0].amountMin,
          amountMax: defaults[0].amountMax,
          approvalLevel: defaults[0].approvalLevel,
          approverRoleKey: defaults[0].approverRoleKey,
          requiredPermissionKey: defaults[0].requiredPermissionKey,
          priority: defaults[0].priority,
          active: false,
        },
        settingsManager,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/approval policy/i);
  });

  it("preserves disabled records when upsert omits active state", async () => {
    const policy = await upsertApprovalThresholdPolicy(
      {
        policyKey: "finance_paused",
        labelVi: "Paused policy",
        targetType: "finance",
        amountMin: 150_000_001,
        approvalLevel: "PROJECT_DIRECTOR",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 30,
        active: false,
      },
      settingsManager,
      { repository, catalogRepository },
    );

    const updatedPolicy = await upsertApprovalThresholdPolicy(
      {
        id: policy.policy.id,
        policyKey: "finance_paused",
        labelVi: "Paused policy renamed",
        targetType: "finance",
        amountMin: 150_000_001,
        approvalLevel: "PROJECT_DIRECTOR",
        approverRoleKey: "quan_ly_tai_chinh",
        requiredPermissionKey: "proposal.approve",
        priority: 30,
      },
      settingsManager,
      { repository, catalogRepository },
    );

    expect(updatedPolicy.policy.active).toBe(false);

    const riskGroup = await upsertRiskGroupConfig(
      {
        riskKey: "paused_risk",
        labelVi: "Paused risk",
        defaultSeverity: "medium",
        sortOrder: 90,
        active: false,
      },
      settingsManager,
      { repository },
    );

    const updatedRiskGroup = await upsertRiskGroupConfig(
      {
        id: riskGroup.riskGroup.id,
        riskKey: "paused_risk",
        labelVi: "Paused risk renamed",
        defaultSeverity: "medium",
        sortOrder: 90,
      },
      settingsManager,
      { repository },
    );

    expect(updatedRiskGroup.riskGroup.active).toBe(false);
  });

  it("rejects missing settings permission and invalid role or permission keys", async () => {
    await expect(
      upsertApprovalThresholdPolicy(
        {
          policyKey: "finance_invalid_actor",
          labelVi: "Invalid actor",
          targetType: "finance",
          amountMin: 0,
          approvalLevel: "DEPARTMENT_HEAD",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "proposal.approve",
        },
        viewer,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/quyen|permission/i);

    await expect(
      upsertApprovalThresholdPolicy(
        {
          policyKey: "finance_chairman_bo_denied",
          labelVi: "Chairman cannot manage BO policy",
          targetType: "finance",
          amountMin: 0,
          approvalLevel: "DEPARTMENT_HEAD",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "proposal.approve",
        },
        chairman,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/quyen|permission/i);

    await expect(
      upsertApprovalThresholdPolicy(
        {
          policyKey: "finance_invalid_role",
          labelVi: "Invalid role",
          targetType: "finance",
          amountMin: 0,
          approvalLevel: "DEPARTMENT_HEAD",
          approverRoleKey: "missing_role",
          requiredPermissionKey: "proposal.approve",
        },
        settingsManager,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/role/i);

    await expect(
      upsertApprovalThresholdPolicy(
        {
          policyKey: "finance_invalid_permission",
          labelVi: "Invalid permission",
          targetType: "finance",
          amountMin: 0,
          approvalLevel: "DEPARTMENT_HEAD",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "unknown.permission" as never,
        },
        settingsManager,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow(/permission/i);

    await expect(
      upsertApprovalThresholdPolicy(
        {
          policyKey: "finance_invalid_escalation",
          labelVi: "Invalid escalation",
          targetType: "finance",
          amountMin: 0,
          approvalLevel: "DEPARTMENT_HEAD",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "proposal.approve",
          escalateOnRiskLevels: ["medium"] as never,
        },
        settingsManager,
        { repository, catalogRepository },
      ),
    ).rejects.toThrow();
  });

  it("returns traceable audit values for policy mutations", async () => {
    const result = await upsertApprovalThresholdPolicy(
      {
        policyKey: "investment_high_value",
        labelVi: "Dau tu gia tri lon",
        targetType: "investment",
        amountMin: 2_000_000_000,
        approvalLevel: "CHAIRMAN",
        approverRoleKey: "chu_tich",
        requiredPermissionKey: "proposal.approve",
        priority: 1,
        organizationId: "org-green-nest",
      },
      settingsManager,
      { repository, catalogRepository },
    );

    expect(policySettingsAuditValue(result.policy)).toMatchObject({
      id: result.policy.id,
      policyKey: "investment_high_value",
      labelVi: "Dau tu gia tri lon",
      targetType: "investment",
      amountMin: 2_000_000_000,
      approvalLevel: "CHAIRMAN",
      approverRoleKey: "chu_tich",
      requiredPermissionKey: "proposal.approve",
      active: true,
      organizationId: "org-green-nest",
    });
  });
});
