import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  createScopeAssignment: vi.fn(),
  disableScopeAssignment: vi.fn(),
  getCurrentUser: vi.fn(),
  leadershipDelegationAuditValue: vi.fn((delegation) => delegation),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  policySettingsAuditValue: vi.fn((entity) => entity),
  renameRoleTemplate: vi.fn(),
  revalidatePath: vi.fn(),
  setApprovalThresholdPolicyActive: vi.fn(),
  setLeadershipDelegationActive: vi.fn(),
  setRiskGroupConfigActive: vi.fn(),
  setRoleTemplateActive: vi.fn(),
  updateScopeAssignment: vi.fn(),
  upsertLeadershipDelegation: vi.fn(),
  upsertApprovalThresholdPolicy: vi.fn(),
  upsertRiskGroupConfig: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/modules/settings/services/role-permission-catalog-service", () => ({
  addRoleTemplate: vi.fn(),
  renameRoleTemplate: mocks.renameRoleTemplate,
  setRoleTemplateActive: mocks.setRoleTemplateActive,
  updateRolePermissionMapping: vi.fn(),
}));

vi.mock("@/modules/settings/services/scope-assignment-service", () => ({
  createScopeAssignment: mocks.createScopeAssignment,
  disableScopeAssignment: mocks.disableScopeAssignment,
  scopeAssignmentAuditValue: vi.fn((assignment) => assignment),
  updateScopeAssignment: mocks.updateScopeAssignment,
}));

vi.mock("@/modules/settings/services/policy-settings-service", () => ({
  policySettingsAuditValue: mocks.policySettingsAuditValue,
  setApprovalThresholdPolicyActive: mocks.setApprovalThresholdPolicyActive,
  setRiskGroupConfigActive: mocks.setRiskGroupConfigActive,
  upsertApprovalThresholdPolicy: mocks.upsertApprovalThresholdPolicy,
  upsertRiskGroupConfig: mocks.upsertRiskGroupConfig,
}));

vi.mock("@/modules/settings/services/leadership-delegation-service", () => ({
  leadershipDelegationAuditValue: mocks.leadershipDelegationAuditValue,
  setLeadershipDelegationActive: mocks.setLeadershipDelegationActive,
  upsertLeadershipDelegation: mocks.upsertLeadershipDelegation,
}));

vi.mock("@/modules/users/services/user-service", () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  createScopeAssignmentAction,
  disableScopeAssignmentAction,
  setApprovalThresholdPolicyActiveAction,
  setRiskGroupConfigActiveAction,
  setLeadershipDelegationActiveAction,
  renameRoleTemplateAction,
  setRoleTemplateActiveAction,
  updateScopeAssignmentAction,
  upsertLeadershipDelegationAction,
  upsertApprovalThresholdPolicyAction,
  upsertRiskGroupConfigAction,
} from "@/modules/settings/actions";

function formData(values: Record<string, string | string[]>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        data.append(key, item);
      }
    } else {
      data.set(key, value);
    }
  }

  return data;
}

describe("settings role catalog actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "admin-user", role: "admin" });
  });

  it("audits old and new values when renaming a role", async () => {
    mocks.renameRoleTemplate.mockResolvedValue({
      previousRole: {
        key: "viewer",
        labelVi: "Nguoi xem cu",
        description: "Old description",
      },
      role: {
        key: "viewer",
        labelVi: "Nguoi xem moi",
        description: "New description",
      },
    });

    await expect(
      renameRoleTemplateAction(
        formData({
          roleKey: "viewer",
          labelVi: "Nguoi xem moi",
          description: "New description",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#role-permission-catalog");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-user",
        entityType: "role_template",
        entityId: "viewer",
        action: "role_template.rename",
        oldValue: {
          labelVi: "Nguoi xem cu",
          description: "Old description",
        },
        newValue: {
          labelVi: "Nguoi xem moi",
          description: "New description",
        },
      }),
    );
  });

  it("audits old and new values when changing role active state", async () => {
    mocks.setRoleTemplateActive.mockResolvedValue({
      previousRole: {
        key: "viewer",
        active: true,
      },
      role: {
        key: "viewer",
        active: false,
      },
    });

    await expect(
      setRoleTemplateActiveAction(
        formData({
          roleKey: "viewer",
          active: "false",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#role-permission-catalog");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-user",
        entityType: "role_template",
        entityId: "viewer",
        action: "role_template.disable",
        oldValue: { active: true },
        newValue: { active: false },
      }),
    );
  });

  it("audits new values when creating a scope assignment", async () => {
    mocks.createScopeAssignment.mockResolvedValue({
      assignment: {
        id: "assignment-a",
        userId: "viewer",
        roleKey: "viewer",
        permissionKeys: ["project.view"],
        projectId: "project-a",
        active: true,
        scopeType: "scoped",
      },
    });

    await expect(
      createScopeAssignmentAction(
        formData({
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view"],
          projectId: "project-a",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#scope-assignments");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-user",
        entityType: "scope_assignment",
        entityId: "assignment-a",
        action: "scope_assignment.create",
        newValue: expect.objectContaining({
          userId: "viewer",
          projectId: "project-a",
        }),
      }),
    );
  });

  it("audits old and new values when updating or disabling scope assignment", async () => {
    mocks.updateScopeAssignment.mockResolvedValue({
      previousAssignment: {
        id: "assignment-a",
        userId: "viewer",
        roleKey: "viewer",
        permissionKeys: ["project.view"],
        projectId: "project-a",
        active: true,
        scopeType: "scoped",
      },
      assignment: {
        id: "assignment-a",
        userId: "viewer",
        roleKey: "viewer",
        permissionKeys: ["project.view", "task.view"],
        projectId: "project-b",
        active: true,
        scopeType: "scoped",
      },
    });

    await expect(
      updateScopeAssignmentAction(
        formData({
          assignmentId: "assignment-a",
          userId: "viewer",
          roleKey: "viewer",
          permissionKeys: ["project.view", "task.view"],
          projectId: "project-b",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#scope-assignments");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "scope_assignment",
        entityId: "assignment-a",
        action: "scope_assignment.update",
        oldValue: expect.objectContaining({ projectId: "project-a" }),
        newValue: expect.objectContaining({ projectId: "project-b" }),
      }),
    );

    mocks.disableScopeAssignment.mockResolvedValue({
      previousAssignment: {
        id: "assignment-a",
        active: true,
      },
      assignment: {
        id: "assignment-a",
        active: false,
      },
    });

    await expect(
      disableScopeAssignmentAction(
        formData({
          assignmentId: "assignment-a",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#scope-assignments");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "scope_assignment",
        entityId: "assignment-a",
        action: "scope_assignment.disable",
        oldValue: expect.objectContaining({ active: true }),
        newValue: expect.objectContaining({ active: false }),
      }),
    );
  });

  it("audits old and new values when upserting or disabling approval policy", async () => {
    mocks.upsertApprovalThresholdPolicy.mockResolvedValue({
      previousPolicy: {
        id: "policy-a",
        policyKey: "finance_small",
        amountMax: 50_000_000,
        active: true,
      },
      policy: {
        id: "policy-a",
        policyKey: "finance_small",
        amountMax: 75_000_000,
        active: true,
      },
    });

    await expect(
      upsertApprovalThresholdPolicyAction(
        formData({
          policyId: "policy-a",
          policyKey: "finance_small",
          labelVi: "Finance small",
          targetType: "finance",
          amountMin: "0",
          amountMax: "75000000",
          approvalLevel: "PROJECT_DIRECTOR",
          approverRoleKey: "quan_ly_tai_chinh",
          requiredPermissionKey: "proposal.approve",
          priority: "10",
          projectId: "project-a",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#policy-settings");

    expect(mocks.upsertApprovalThresholdPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "policy-a",
        amountMin: 0,
        amountMax: 75_000_000,
        priority: 10,
        projectId: "project-a",
      }),
      { id: "admin-user", role: "admin" },
    );
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-user",
        entityType: "approval_threshold_policy",
        entityId: "policy-a",
        action: "policy.approval_threshold.upsert",
        oldValue: expect.objectContaining({ amountMax: 50_000_000 }),
        newValue: expect.objectContaining({ amountMax: 75_000_000 }),
      }),
    );

    mocks.setApprovalThresholdPolicyActive.mockResolvedValue({
      previousPolicy: {
        id: "policy-a",
        active: true,
      },
      policy: {
        id: "policy-a",
        active: false,
      },
    });

    await expect(
      setApprovalThresholdPolicyActiveAction(
        formData({
          policyId: "policy-a",
          active: "false",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#policy-settings");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "approval_threshold_policy",
        entityId: "policy-a",
        action: "policy.approval_threshold.disable",
        oldValue: expect.objectContaining({ active: true }),
        newValue: expect.objectContaining({ active: false }),
      }),
    );
  });

  it("audits old and new values when upserting or toggling leadership delegation", async () => {
    mocks.upsertLeadershipDelegation.mockResolvedValue({
      previousDelegation: {
        id: "delegation-a",
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-a",
        moduleId: "proposal",
        active: true,
      },
      delegation: {
        id: "delegation-a",
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-b",
        moduleId: "proposal",
        active: true,
      },
    });

    await expect(
      upsertLeadershipDelegationAction(
        formData({
          delegationId: "delegation-a",
          principalUserId: "mock-founder",
          delegateUserId: "viewer",
          actionKeys: ["proposal.create"],
          projectId: "project-b",
          moduleId: "proposal",
          active: "true",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#leadership-delegations");

    expect(mocks.upsertLeadershipDelegation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "delegation-a",
        principalUserId: "mock-founder",
        delegateUserId: "viewer",
        actionKeys: ["proposal.create"],
        projectId: "project-b",
        moduleId: "proposal",
      }),
      { id: "admin-user", role: "admin" },
    );
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-user",
        entityType: "leadership_delegation",
        entityId: "delegation-a",
        action: "delegation.upsert",
        oldValue: expect.objectContaining({ projectId: "project-a" }),
        newValue: expect.objectContaining({ projectId: "project-b" }),
      }),
    );

    mocks.setLeadershipDelegationActive.mockResolvedValue({
      previousDelegation: {
        id: "delegation-a",
        active: true,
      },
      delegation: {
        id: "delegation-a",
        active: false,
      },
    });

    await expect(
      setLeadershipDelegationActiveAction(
        formData({
          delegationId: "delegation-a",
          active: "false",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#leadership-delegations");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "leadership_delegation",
        entityId: "delegation-a",
        action: "delegation.disable",
        oldValue: expect.objectContaining({ active: true }),
        newValue: expect.objectContaining({ active: false }),
      }),
    );
  });

  it("audits old and new values when upserting or disabling risk group", async () => {
    mocks.upsertRiskGroupConfig.mockResolvedValue({
      previousRiskGroup: {
        id: "risk-a",
        riskKey: "legal",
        labelVi: "Phap ly cu",
        active: true,
      },
      riskGroup: {
        id: "risk-a",
        riskKey: "legal",
        labelVi: "Phap ly moi",
        active: true,
      },
    });

    await expect(
      upsertRiskGroupConfigAction(
        formData({
          riskGroupId: "risk-a",
          riskKey: "legal",
          labelVi: "Phap ly moi",
          defaultSeverity: "high",
          moduleId: "legal",
          sortOrder: "10",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#policy-settings");

    expect(mocks.upsertRiskGroupConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "risk-a",
        riskKey: "legal",
        labelVi: "Phap ly moi",
        sortOrder: 10,
      }),
      { id: "admin-user", role: "admin" },
    );
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-user",
        entityType: "risk_group_config",
        entityId: "risk-a",
        action: "policy.risk_group.upsert",
        oldValue: expect.objectContaining({ labelVi: "Phap ly cu" }),
        newValue: expect.objectContaining({ labelVi: "Phap ly moi" }),
      }),
    );

    mocks.setRiskGroupConfigActive.mockResolvedValue({
      previousRiskGroup: {
        id: "risk-a",
        active: true,
      },
      riskGroup: {
        id: "risk-a",
        active: false,
      },
    });

    await expect(
      setRiskGroupConfigActiveAction(
        formData({
          riskGroupId: "risk-a",
          active: "false",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/settings#policy-settings");

    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "risk_group_config",
        entityId: "risk-a",
        action: "policy.risk_group.disable",
        oldValue: expect.objectContaining({ active: true }),
        newValue: expect.objectContaining({ active: false }),
      }),
    );
  });
});
