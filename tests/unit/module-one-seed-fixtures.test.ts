import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import { getMockCurrentUser } from "@/lib/auth/mock-session";
import { getRolePermissions } from "@/lib/permissions/can";
import { getDashboardData } from "@/modules/dashboard/services/dashboard-service";
import { JsonDocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { JsonDocumentRepository } from "@/modules/documents/services/document-repository";
import { JsonLegalRepository } from "@/modules/legal/services/legal-repository";
import { JsonProjectRepository } from "@/modules/projects/services/project-repository";
import { JsonLeadershipDelegationRepository } from "@/modules/settings/services/leadership-delegation-repository";
import {
  assertDelegatedActionAllowed,
} from "@/modules/settings/services/leadership-delegation-service";
import type {
  RolePermissionCatalog,
  ScopeAssignment,
} from "@/modules/settings/types";
import { JsonTaskRepository } from "@/modules/tasks/services/task-repository";

import acceptanceFixture from "../fixtures/module-one-acceptance.json";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();
const createdTempDirs: string[] = [];
const chairmanBoDeniedPermissions = [
  "settings.manage",
  "user.view",
  "user.invite",
  "user.update_role",
  "delegation.manage",
] as const;

type JsonRecord = Record<string, unknown>;

async function createTempOutputDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "greennest-module-one-seed-"));
  createdTempDirs.push(dir);
  return dir;
}

async function runSeedDemo(outputDir: string) {
  await execFileAsync(process.execPath, ["scripts/seed-demo.mjs"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      GREENNEST_MOCK_DATA_DIR: outputDir,
    },
  });
}

async function readJson<T = JsonRecord>(outputDir: string, fileName: string): Promise<T> {
  const raw = await readFile(path.join(outputDir, fileName), "utf8");
  return JSON.parse(raw) as T;
}

async function readGeneratedAccessContract(outputDir: string) {
  const catalog = await readJson<Omit<RolePermissionCatalog, "assignments">>(
    outputDir,
    "role-permission-catalog.json",
  );
  const scopes = await readJson<{ assignments: ScopeAssignment[] }>(
    outputDir,
    "scope-assignments.json",
  );

  return {
    rolePermissionCatalog: {
      ...catalog,
      assignments: [],
    } satisfies RolePermissionCatalog,
    scopeAssignments: scopes.assignments,
  };
}

function generatedDashboardRepositories(outputDir: string) {
  return {
    projects: new JsonProjectRepository(path.join(outputDir, "project-core.json")),
    tasks: new JsonTaskRepository(path.join(outputDir, "task-management.json")),
    documents: new JsonDocumentRepository(path.join(outputDir, "document-center.json")),
    requirements: new JsonDocumentRequirementRepository(path.join(outputDir, "document-requirements.json")),
    legal: new JsonLegalRepository(path.join(outputDir, "project-core.json")),
  };
}

function readonlyCatalogRepository(rolePermissionCatalog: RolePermissionCatalog) {
  return {
    listCatalog: async () => rolePermissionCatalog,
    getRole: async (roleKey: string) =>
      rolePermissionCatalog.roles.find((role) => role.key === roleKey),
    upsertRole: async () => {
      throw new Error("Readonly test catalog.");
    },
    setRoleActive: async () => {
      throw new Error("Readonly test catalog.");
    },
    replaceRolePermissions: async () => {
      throw new Error("Readonly test catalog.");
    },
  };
}

afterEach(async () => {
  await Promise.all(createdTempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("Module 1 acceptance seed contract", () => {
  it("generates all required deterministic mock-data files", async () => {
    const firstOutput = await createTempOutputDir();
    const secondOutput = await createTempOutputDir();

    await runSeedDemo(firstOutput);
    await runSeedDemo(secondOutput);

    for (const fileName of acceptanceFixture.requiredSeedFiles) {
      const first = await readFile(path.join(firstOutput, fileName), "utf8");
      const second = await readFile(path.join(secondOutput, fileName), "utf8");

      expect(first, `${fileName} should be deterministic`).toBe(second);
    }
  });

  it("aligns acceptance personas across users.json, mock session mapping and role catalog", async () => {
    const outputDir = await createTempOutputDir();
    await runSeedDemo(outputDir);

    const usersStore = await readJson<{
      users: Array<{ id: string; fullName: string; email: string; role: string }>;
    }>(outputDir, "users.json");
    const catalog = await readJson<{
      roles: Array<{ key: string; permissionKeys: string[] }>;
    }>(outputDir, "role-permission-catalog.json");
    const usersById = new Map(usersStore.users.map((user) => [user.id, user]));
    const rolesByKey = new Map(catalog.roles.map((role) => [role.key, role]));

    for (const persona of acceptanceFixture.personas.filter((item) => item.acceptancePersona)) {
      expect(usersById.get(persona.id)).toMatchObject({
        id: persona.id,
        email: persona.email,
        role: persona.role,
      });
      expect(rolesByKey.has(persona.role)).toBe(true);
    }

    expect(usersById.get("chairman-01")).toMatchObject({
      id: "chairman-01",
      email: "chairman@greennest.vn",
      role: "chu_tich",
    });
    expect(usersById.get("super-admin-01")).toMatchObject({
      id: "super-admin-01",
      email: "super.admin@greennest.vn",
      role: "super_admin",
    });
    const chairmanPermissions = rolesByKey.get("chu_tich")?.permissionKeys ?? [];
    const superAdminPermissions = rolesByKey.get("super_admin")?.permissionKeys ?? [];

    expect(chairmanPermissions).toEqual(
      expect.arrayContaining(["proposal.approve", "finance.view", "decision.approve"]),
    );
    for (const permission of chairmanBoDeniedPermissions) {
      expect(chairmanPermissions).not.toContain(permission);
      expect(superAdminPermissions).toContain(permission);
    }
    for (const permission of chairmanPermissions) {
      expect(superAdminPermissions).toContain(permission);
    }
    expect(superAdminPermissions).toEqual(
      expect.arrayContaining([
        "settings.manage",
        "user.invite",
        "user.update_role",
        "delegation.manage",
        "document.approve",
        "legal.approve",
        "decision.approve",
        "ai.confirm_action",
      ]),
    );

    expect(getMockCurrentUser("chu_tich").id).toBe("chairman-01");
    expect(getMockCurrentUser("chu_tich").email).toBe("chairman@greennest.vn");
    expect(getMockCurrentUser("super_admin").id).toBe("super-admin-01");
    expect(getMockCurrentUser("super_admin").email).toBe("super.admin@greennest.vn");
    expect(getMockCurrentUser("tong_giam_doc").id).toBe("ceo-01");
    expect(getMockCurrentUser("giam_doc_du_an").id).toBe("project-director-01");
    expect(getMockCurrentUser("to_truong").id).toBe("department-head-01");
    expect(getMockCurrentUser("to_truong").email).toBe("department.head@greennest.vn");
    expect(getMockCurrentUser("thu_ky_tro_ly").id).toBe("assistant-01");
    expect(getMockCurrentUser("viewer").id).toBe("viewer-01");
  });

  it("writes explicit role, scope, policy and delegation fixtures for positive and negative scenarios", async () => {
    const outputDir = await createTempOutputDir();
    await runSeedDemo(outputDir);

    const catalog = await readJson<{
      roles: Array<{ key: string; permissionKeys: string[] }>;
      permissions: Array<{ key: string; sensitive?: boolean; actionType: string }>;
    }>(outputDir, "role-permission-catalog.json");
    const scopes = await readJson<{
      assignments: Array<{ userId: string; projectId?: string; permissionKeys: string[]; active: boolean }>;
    }>(outputDir, "scope-assignments.json");
    const policies = await readJson<{
      approvalThresholds: Array<{
        policyKey: string;
        targetType: string;
        amountMin?: number;
        amountMax?: number;
        active: boolean;
        approvalLevel: string;
        approverRoleKey: string;
        requiredPermissionKey: string;
      }>;
      riskGroups: Array<{ riskKey: string; active: boolean; defaultSeverity: string }>;
    }>(outputDir, "policy-settings.json");
    const delegations = await readJson<{
      delegations: Array<{
        id: string;
        delegateUserId: string;
        principalUserId: string;
        projectId?: string;
        actionKeys: string[];
        active: boolean;
        endsAt?: string;
      }>;
    }>(outputDir, "leadership-delegations.json");

    const rolesByKey = new Map(catalog.roles.map((role) => [role.key, role]));
    const adminPermissions = rolesByKey.get("admin")?.permissionKeys ?? [];
    const chairmanPermissions = rolesByKey.get("chu_tich")?.permissionKeys ?? [];
    const superAdminPermissions = rolesByKey.get("super_admin")?.permissionKeys ?? [];

    for (const permission of ["proposal.approve", "proposal.reject", "proposal.request_change"] as const) {
      expect(adminPermissions).not.toContain(permission);
    }
    expect(chairmanPermissions).toEqual(
      expect.arrayContaining(["proposal.approve", "proposal.reject", "proposal.request_change", "finance.view"]),
    );
    for (const permission of chairmanBoDeniedPermissions) {
      expect(chairmanPermissions).not.toContain(permission);
      expect(superAdminPermissions).toContain(permission);
    }
    for (const permission of getRolePermissions("chu_tich")) {
      expect(chairmanPermissions).toContain(permission);
      expect(superAdminPermissions).toContain(permission);
    }
    expect(rolesByKey.get("thu_ky_tro_ly")?.permissionKeys).not.toEqual(
      expect.arrayContaining([
        "proposal.approve",
        "proposal.reject",
        "proposal.request_change",
        "finance.view",
        "report.create",
      ]),
    );
    expect(catalog.permissions.find((permission) => permission.key === "finance.view")).toMatchObject({
      sensitive: true,
      actionType: "view",
    });

    expect(scopes.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: "chairman-01", active: true }),
        expect.objectContaining({ userId: "super-admin-01", active: true }),
        expect.objectContaining({ userId: "project-director-01", projectId: "demo-project-riverside" }),
        expect.objectContaining({ userId: "department-head-01", projectId: "demo-project-garden" }),
      ]),
    );
    const scopesByUser = new Map(scopes.assignments.map((scope) => [scope.userId, scope]));
    expect(scopesByUser.get("chairman-01")).toMatchObject({
      roleKey: "chu_tich",
      scopeType: "global",
      active: true,
    });
    expect(scopesByUser.get("chairman-01")?.permissionKeys).toEqual(getRolePermissions("chu_tich"));
    expect(scopesByUser.get("super-admin-01")).toMatchObject({
      roleKey: "super_admin",
      scopeType: "global",
      active: true,
    });
    expect(scopesByUser.get("super-admin-01")?.permissionKeys).toEqual(getRolePermissions("super_admin"));
    expect(scopes.assignments.find((scope) => scope.userId === "assistant-01")?.permissionKeys).not.toContain(
      "finance.view",
    );

    const generalPolicies = policies.approvalThresholds
      .filter((policy) => policy.targetType === "general" && policy.active)
      .sort((a, b) => (a.amountMin ?? 0) - (b.amountMin ?? 0));
    for (let index = 1; index < generalPolicies.length; index += 1) {
      expect(generalPolicies[index - 1].amountMax ?? Number.POSITIVE_INFINITY).toBeLessThan(
        generalPolicies[index].amountMin ?? 0,
      );
    }
    expect(generalPolicies.map((policy) => policy.requiredPermissionKey)).toEqual(
      expect.arrayContaining(["proposal.review", "proposal.approve"]),
    );
    const chairmanPolicy = generalPolicies.find((policy) => policy.approvalLevel === "CHAIRMAN");
    expect(chairmanPolicy).toMatchObject({
      policyKey: "approval_over_2b",
      approverRoleKey: "chu_tich",
      requiredPermissionKey: "proposal.approve",
    });
    expect(generalPolicies).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          approvalLevel: "CHAIRMAN",
          approverRoleKey: "super_admin",
        }),
      ]),
    );
    expect(policies.riskGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ riskKey: "legal", defaultSeverity: "high", active: true }),
        expect.objectContaining({ riskKey: "missing_document", active: true }),
      ]),
    );

    const activeDelegation = delegations.delegations.find(
      (delegation) => delegation.id === "delegation-assistant-ceo-riverside-proposal-create",
    );
    expect(activeDelegation).toMatchObject({
      principalUserId: "ceo-01",
      delegateUserId: "assistant-01",
      projectId: "demo-project-riverside",
      actionKeys: ["proposal.create"],
      active: true,
    });
    expect(delegations.delegations.flatMap((delegation) => delegation.actionKeys)).not.toEqual(
      expect.arrayContaining(["proposal.approve", "proposal.reject", "proposal.request_change"]),
    );
    expect(
      delegations.delegations.some(
        (delegation) => delegation.delegateUserId === "assistant-01" && delegation.endsAt === "2026-03-31T23:59:59.000Z",
      ),
    ).toBe(true);
  });

  it("contains Module 1 demo domain data for scope, finance, risk, meetings and future axes", async () => {
    const outputDir = await createTempOutputDir();
    await runSeedDemo(outputDir);

    const projectCore = await readJson<{
      projects: Array<{ id: string; status: string }>;
      legalSteps: Array<{ status: string; notes?: string }>;
    }>(outputDir, "project-core.json");
    const documents = await readJson<{
      documents: Array<{ id: string; docType: string; status: string; approvalStatus?: string; classification?: string }>;
    }>(outputDir, "document-center.json");
    const tasks = await readJson<{
      tasks: Array<{ id: string; projectId: string; status: string; dueDate?: string; category?: string }>;
    }>(outputDir, "task-management.json");
    const meetings = await readJson<{
      meetings: Array<{
        meetingType?: string;
        meetingMinutes?: string;
        aiSummary?: { status: string; content?: string };
        followUpActions?: unknown[];
        decisions?: unknown[];
      }>;
      decisions: Array<{ taskId?: string; status: string }>;
    }>(outputDir, "meetings-decisions.json");
    const proposals = await readJson<{
      proposals: Array<{
        id: string;
        type: string;
        module: string;
        amount?: number;
        dueDate?: string;
        status: string;
        onBehalfOf?: string;
      }>;
      steps: Array<{ proposalId: string; status: string }>;
    }>(outputDir, "proposals.json");

    expect(projectCore.projects).toHaveLength(4);
    expect(projectCore.projects.map((project) => project.status)).toEqual(
      expect.arrayContaining(["active", "planning", "paused"]),
    );
    expect(projectCore.legalSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "blocked" }),
        expect.objectContaining({ status: "waiting_authority" }),
      ]),
    );

    expect(tasks.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "demo-task-overdue-legal", status: "blocked" }),
        expect.objectContaining({ id: "demo-task-follow-up-riverside", status: "todo" }),
      ]),
    );
    expect(documents.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "missing" }),
        expect.objectContaining({ docType: "legal_submission", approvalStatus: "rejected" }),
        expect.objectContaining({ classification: "CONFIDENTIAL" }),
      ]),
    );

    expect(proposals.proposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "proposal-demo-investment-01", amount: expect.any(Number) }),
        expect.objectContaining({ id: "proposal-demo-overdue-approval", status: "in_review" }),
        expect.objectContaining({ id: "proposal-axis-2-placeholder", module: "axis-2" }),
        expect.objectContaining({ id: "proposal-axis-3-placeholder", module: "axis-3" }),
        expect.objectContaining({ id: "proposal-demo-on-behalf-ceo", onBehalfOf: "ceo-01" }),
      ]),
    );
    expect(proposals.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ proposalId: "proposal-demo-overdue-approval", status: "in_review" }),
      ]),
    );

    expect(new Set(meetings.meetings.map((meeting) => meeting.meetingType)).size).toBeGreaterThanOrEqual(2);
    expect(meetings.meetings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aiSummary: expect.objectContaining({ status: "DRAFT" }),
          meetingMinutes: expect.any(String),
        }),
      ]),
    );
    expect(meetings.meetings.some((meeting) => (meeting.followUpActions ?? []).length > 0)).toBe(true);
    expect(meetings.meetings.some((meeting) => (meeting.decisions ?? []).length > 0)).toBe(true);
    expect(meetings.decisions).toEqual(
      expect.arrayContaining([expect.objectContaining({ taskId: "demo-task-follow-up-riverside" })]),
    );
  });

  it("exercises generated scope and finance visibility through dashboard services", async () => {
    const outputDir = await createTempOutputDir();
    await runSeedDemo(outputDir);
    const accessContract = await readGeneratedAccessContract(outputDir);
    const commonOptions = {
      today: new Date("2026-05-24T00:00:00.000Z"),
      repositories: generatedDashboardRepositories(outputDir),
      ...accessContract,
    };

    const chairman = await getDashboardData(
      { id: "chairman-01", role: "chu_tich" },
      commonOptions,
    );
    const superAdmin = await getDashboardData(
      { id: "super-admin-01", role: "super_admin" },
      commonOptions,
    );
    const director = await getDashboardData(
      { id: "project-director-01", role: "giam_doc_du_an" },
      commonOptions,
    );
    const departmentHead = await getDashboardData(
      { id: "department-head-01", role: "to_truong" },
      commonOptions,
    );
    const assistant = await getDashboardData(
      { id: "assistant-01", role: "thu_ky_tro_ly" },
      commonOptions,
    );

    expect(chairman.summary.totalProjects).toBe(4);
    expect(chairman.permissions.canViewFinance).toBe(true);
    expect(chairman.overdueTasks.map((task) => task.id)).toContain("demo-task-overdue-legal");
    expect(superAdmin.summary.totalProjects).toBe(4);
    expect(superAdmin.permissions.canViewFinance).toBe(true);

    expect(director.projects.map((project) => project.id)).toEqual(["demo-project-riverside"]);
    expect(director.permissions.canViewFinance).toBe(true);

    expect(departmentHead.projects.map((project) => project.id)).toEqual(["demo-project-garden"]);
    expect(departmentHead.permissions.canViewFinance).toBe(false);

    expect(assistant.projects.map((project) => project.id)).toEqual(["demo-project-riverside"]);
    expect(assistant.permissions.canViewFinance).toBe(false);
  });

  it("exercises generated delegation allow and approval-block behavior", async () => {
    const outputDir = await createTempOutputDir();
    await runSeedDemo(outputDir);
    const { rolePermissionCatalog } = await readGeneratedAccessContract(outputDir);
    const delegationRepository = new JsonLeadershipDelegationRepository(
      path.join(outputDir, "leadership-delegations.json"),
    );
    const catalogRepository = readonlyCatalogRepository(rolePermissionCatalog);
    const assistant = { id: "assistant-01", role: "thu_ky_tro_ly" };
    const now = new Date("2026-05-24T00:00:00.000Z");

    await expect(
      assertDelegatedActionAllowed(
        {
          actor: assistant,
          principalUserId: "ceo-01",
          actionKey: "proposal.create",
          scope: {
            projectId: "demo-project-riverside",
            moduleId: "proposal",
          },
        },
        { repository: delegationRepository, catalogRepository, now },
      ),
    ).resolves.toMatchObject({
      delegationId: "delegation-assistant-ceo-riverside-proposal-create",
      principalUserId: "ceo-01",
      delegateUserId: "assistant-01",
    });

    await expect(
      assertDelegatedActionAllowed(
        {
          actor: assistant,
          principalUserId: "ceo-01",
          actionKey: "proposal.create",
          scope: {
            projectId: "demo-project-garden",
            moduleId: "proposal",
          },
        },
        { repository: delegationRepository, catalogRepository, now },
      ),
    ).rejects.toThrow();

    await expect(
      assertDelegatedActionAllowed(
        {
          actor: assistant,
          principalUserId: "ceo-01",
          actionKey: "proposal.approve",
          scope: {
            projectId: "demo-project-riverside",
            moduleId: "proposal",
          },
        },
        { repository: delegationRepository, catalogRepository, now },
      ),
    ).rejects.toThrow();
  });
});
