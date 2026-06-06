import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PermissionUser } from "@/lib/permissions/can";
import { JsonRiskRecordRepository } from "@/modules/executive/services/risk-record-repository";
import {
  closeExecutiveRiskRecord,
  createExecutiveRiskRecord,
  overrideExecutiveRiskStatus,
  riskRecordAuditValue,
  updateExecutiveRiskRecord,
} from "@/modules/executive/services/risk-record-service";
import type {
  CreateExecutiveRiskRecordInput,
  ExecutiveRiskRecord,
} from "@/modules/executive/types";
import { createDefaultRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-repository";
import type { LeadershipDelegation, ScopeAssignment } from "@/modules/settings/types";
import type { AuditLog, ProjectMembership, User } from "@/modules/users/types";

let tempDir: string;
let repository: JsonRiskRecordRepository;
let audits: Array<Omit<AuditLog, "id" | "createdAt">>;

const timestamp = "2026-06-01T00:00:00.000Z";
const rolePermissionCatalog = createDefaultRolePermissionCatalog();

const users: User[] = [
  {
    createdAt: timestamp,
    email: "owner@example.test",
    fullName: "Owner One",
    id: "owner-01",
    role: "quan_ly_du_an",
    status: "active",
    updatedAt: timestamp,
  },
  {
    createdAt: timestamp,
    email: "ceo@example.test",
    fullName: "CEO",
    id: "ceo-01",
    role: "tong_giam_doc",
    status: "active",
    updatedAt: timestamp,
  },
];

const memberships: ProjectMembership[] = [
  {
    createdAt: timestamp,
    id: "membership-owner-project-a",
    projectId: "project-a",
    role: "pm",
    updatedAt: timestamp,
    userId: "owner-01",
  },
  {
    createdAt: timestamp,
    id: "membership-owner-project-b",
    projectId: "project-b",
    role: "pm",
    updatedAt: timestamp,
    userId: "owner-01",
  },
];

const userRepository = {
  getUser: async (userId: string) => users.find((user) => user.id === userId),
  listProjectMemberships: async () => memberships,
};

const projectRepository = {
  getProject: async (projectId: string) => {
    if (projectId === "project-archived") {
      return {
        archivedAt: timestamp,
        code: "ARCHIVED",
        createdAt: timestamp,
        id: projectId,
        name: "Archived Project",
        status: "archived" as const,
        updatedAt: timestamp,
      };
    }

    if (projectId === "project-a" || projectId === "project-b") {
      return {
        code: projectId.toUpperCase(),
        createdAt: timestamp,
        id: projectId,
        name: projectId,
        status: "active" as const,
        updatedAt: timestamp,
      };
    }

    return undefined;
  },
};

const baseInput: CreateExecutiveRiskRecordInput = {
  categoryKey: "legal",
  deadline: "2026-06-10",
  level: "high",
  moduleId: "risk",
  nextAction: "Kiem tra va chot nguoi xu ly",
  ownerId: "owner-01",
  projectId: "project-a",
  reason: "Ho so phap ly dang cham",
  recordType: "risk",
  status: "open",
  title: "Ho so phap ly cham",
};

function dependencies(overrides: {
  delegations?: LeadershipDelegation[];
  scopeAssignments?: ScopeAssignment[];
  auditWriter?: (input: Omit<AuditLog, "id" | "createdAt">) => Promise<unknown>;
} = {}) {
  return {
    auditWriter: overrides.auditWriter ?? (async (input: Omit<AuditLog, "id" | "createdAt">) => {
      audits.push(input);
    }),
    delegations: overrides.delegations,
    idGenerator: () => "risk-created-01",
    now: () => timestamp,
    projectRepository,
    repository,
    riskGroups: [{ active: true, riskKey: "legal" }],
    rolePermissionCatalog,
    scopeAssignments: overrides.scopeAssignments ?? [],
    userRepository,
  };
}

function storedRecord(overrides: Partial<ExecutiveRiskRecord> = {}): ExecutiveRiskRecord {
  return {
    categoryKey: "legal",
    createdAt: timestamp,
    createdBy: "leader-01",
    deadline: "2026-06-10",
    id: "risk-existing-01",
    level: "high",
    moduleId: "risk",
    nextAction: "Follow up",
    ownerId: "owner-01",
    ownerName: "Owner One",
    projectId: "project-a",
    reason: "Existing reason",
    recordType: "risk",
    status: "open",
    title: "Existing risk",
    updatedAt: timestamp,
    updatedBy: "leader-01",
    ...overrides,
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-risk-record-service-"));
  repository = new JsonRiskRecordRepository(path.join(tempDir, "risks.json"));
  audits = [];
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("risk record service", () => {
  it("creates an official risk record with direct risk.create permission and audit", async () => {
    const created = await createExecutiveRiskRecord(
      baseInput,
      { id: "ceo-01", role: "tong_giam_doc" },
      dependencies(),
    );

    expect(created).toMatchObject({
      createdBy: "ceo-01",
      id: "risk-created-01",
      ownerName: "Owner One",
      projectId: "project-a",
      updatedBy: "ceo-01",
    });
    expect(await repository.getRiskRecord(created.id)).toMatchObject({
      title: "Ho so phap ly cham",
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: "risk.created",
      actorId: "ceo-01",
      entityType: "risk",
    });
  });

  it("blocks missing permission and archived projects before writing", async () => {
    await expect(
      createExecutiveRiskRecord(
        baseInput,
        { id: "admin-01", role: "admin" },
        dependencies(),
      ),
    ).rejects.toThrow(/quyen/i);

    await expect(
      createExecutiveRiskRecord(
        { ...baseInput, projectId: "project-archived" },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies(),
      ),
    ).rejects.toThrow(/luu tru|archived|ton tai/i);

    expect(await repository.listRiskRecords()).toEqual([]);
    expect(audits).toEqual([]);
  });

  it("requires the owner to have project membership or a scoped grant", async () => {
    await expect(
      createExecutiveRiskRecord(
        { ...baseInput, ownerId: "ceo-01" },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies(),
      ),
    ).rejects.toThrow(/nguoi phu trach|pham vi/i);

    expect(await repository.listRiskRecords()).toEqual([]);
    expect(audits).toEqual([]);
  });

  it("allows secretary assistant delegated create and update without broad role permission", async () => {
    const delegation: LeadershipDelegation = {
      actionKeys: ["risk.create", "risk.update"],
      active: true,
      createdAt: timestamp,
      delegateUserId: "assistant-01",
      id: "delegation-risk",
      moduleId: "risk",
      principalUserId: "ceo-01",
      projectId: "project-a",
      startsAt: "2026-05-01T00:00:00.000Z",
      updatedAt: timestamp,
    };
    const assistant: PermissionUser = { id: "assistant-01", role: "thu_ky_tro_ly" };
    const created = await createExecutiveRiskRecord(
      {
        ...baseInput,
        delegationId: "delegation-risk",
        onBehalfOf: "ceo-01",
      },
      assistant,
      dependencies({ delegations: [delegation] }),
    );

    expect(created).toMatchObject({
      createdBy: "assistant-01",
      delegationId: "delegation-risk",
      onBehalfOf: "ceo-01",
    });

    const updated = await updateExecutiveRiskRecord(
      {
        riskId: created.id,
        status: "monitoring",
        title: "Cap nhat risk uy quyen",
        delegationId: "delegation-risk",
        onBehalfOf: "ceo-01",
      },
      assistant,
      dependencies({ delegations: [delegation] }),
    );

    expect(updated).toMatchObject({
      title: "Cap nhat risk uy quyen",
      updatedBy: "assistant-01",
      delegationId: "delegation-risk",
    });
    expect(audits.map((audit) => audit.action)).toEqual([
      "risk.created",
      "risk.updated",
    ]);
  });

  it("checks update permission in both current and next scope", async () => {
    await repository.createRiskRecord(storedRecord());
    const scopedActor = { id: "scoped-01", role: "pending" };
    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        createdAt: timestamp,
        id: "assignment-risk-a",
        permissionKeys: ["project.view", "risk.view", "risk.update"],
        projectId: "project-a",
        roleKey: "quan_ly_du_an",
        scopeType: "scoped",
        updatedAt: timestamp,
        userId: "scoped-01",
      },
    ];

    await expect(
      updateExecutiveRiskRecord(
        {
          projectId: "project-b",
          riskId: "risk-existing-01",
        },
        scopedActor,
        dependencies({ scopeAssignments }),
      ),
    ).rejects.toThrow(/quyen/i);

    expect(await repository.getRiskRecord("risk-existing-01")).toMatchObject({
      projectId: "project-a",
    });
  });

  it("rejects closed status and keeps audit payload compact and safe", async () => {
    await expect(
      createExecutiveRiskRecord(
        { ...baseInput, status: "closed" as never },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies(),
      ),
    ).rejects.toThrow();

    const created = await createExecutiveRiskRecord(
      {
        ...baseInput,
        nextAction: "Khong ghi so tien 700000000 VND vao audit",
        reason: "Dang chan thanh toan 900000000 VND",
        title: "Risk 800000000 VND",
      },
      { id: "ceo-01", role: "tong_giam_doc" },
      dependencies(),
    );
    const auditValue = riskRecordAuditValue(created);

    expect(JSON.stringify(auditValue)).not.toContain("700000000");
    expect(JSON.stringify(auditValue)).not.toContain("800000000");
    expect(JSON.stringify(auditValue)).not.toContain("900000000");
    expect(JSON.stringify(auditValue)).not.toContain("VND");
  });

  it("rolls back created record when audit write fails", async () => {
    await expect(
      createExecutiveRiskRecord(
        baseInput,
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies({
          auditWriter: async () => {
            throw new Error("audit failed");
          },
        }),
      ),
    ).rejects.toThrow(/audit failed/i);

    expect(await repository.listRiskRecords()).toEqual([]);
  });

  it("overrides suggested red/yellow/green status with reason and audit", async () => {
    await repository.createRiskRecord(storedRecord({
      categoryKey: "legal",
      level: "high",
      status: "blocked",
    }));

    const overridden = await overrideExecutiveRiskStatus(
      {
        reason: "CEO da xac nhan co bien phap kiem soat va theo doi rieng.",
        riskId: "risk-existing-01",
        statusOverride: "yellow",
      },
      { id: "ceo-01", role: "tong_giam_doc" },
      dependencies(),
    );

    expect(overridden).toMatchObject({
      status: "blocked",
      statusOverride: "yellow",
      statusOverrideBy: "ceo-01",
      statusOverrideReason: "CEO da xac nhan co bien phap kiem soat va theo doi rieng.",
      statusOverrideSourceStatus: "red",
      updatedBy: "ceo-01",
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: "risk.status_overridden",
      actorId: "ceo-01",
      entityId: "risk-existing-01",
      entityType: "risk",
    });
  });

  it("does not allow generic risk.update to override or close records", async () => {
    await repository.createRiskRecord(storedRecord());
    const updateOnlyActor: PermissionUser = {
      id: "update-only-01",
      permissions: ["risk.update"],
      permissionsMode: "replace",
      role: "tong_giam_doc",
    };

    await expect(
      overrideExecutiveRiskStatus(
        {
          reason: "Muon doi mau risk.",
          riskId: "risk-existing-01",
          statusOverride: "green",
        },
        updateOnlyActor,
        dependencies(),
      ),
    ).rejects.toThrow(/quyen/i);
    await expect(
      closeExecutiveRiskRecord(
        {
          reason: "Muon dong risk.",
          riskId: "risk-existing-01",
          status: "resolved",
        },
        updateOnlyActor,
        dependencies(),
      ),
    ).rejects.toThrow(/quyen/i);
    const unchanged = await repository.getRiskRecord("risk-existing-01");

    expect(unchanged).toMatchObject({
      status: "open",
    });
    expect(unchanged?.statusOverride).toBeUndefined();
    expect(audits).toEqual([]);
  });

  it("closes low and medium records with risk.close and writes terminal audit", async () => {
    await repository.createRiskRecord(storedRecord({
      level: "medium",
      recordType: "risk",
      status: "monitoring",
    }));

    const closed = await closeExecutiveRiskRecord(
      {
        reason: "Da co owner va ke hoach xu ly, khong con blocker tren dashboard.",
        riskId: "risk-existing-01",
        status: "resolved",
      },
      {
        id: "closer-01",
        permissions: ["risk.close"],
        permissionsMode: "replace",
        role: "tong_giam_doc",
      },
      dependencies(),
    );

    expect(closed).toMatchObject({
      closedAt: timestamp,
      closedBy: "closer-01",
      closedReason: "Da co owner va ke hoach xu ly, khong con blocker tren dashboard.",
      status: "resolved",
      updatedBy: "closer-01",
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action: "risk.closed",
      actorId: "closer-01",
      entityType: "risk",
    });
  });

  it("requires high-close policy for blocker records regardless of level", async () => {
    await repository.createRiskRecord(storedRecord({
      level: "medium",
      recordType: "blocker",
      status: "monitoring",
    }));

    await expect(
      closeExecutiveRiskRecord(
        {
          reason: "Risk.close don thuan khong duoc dong blocker.",
          riskId: "risk-existing-01",
          status: "resolved",
        },
        {
          id: "closer-01",
          permissions: ["risk.close"],
          permissionsMode: "replace",
          role: "admin",
        },
        dependencies(),
      ),
    ).rejects.toThrow(/risk\.close_high|leader/i);

    expect(await repository.getRiskRecord("risk-existing-01")).toMatchObject({
      status: "monitoring",
    });
    expect(audits).toEqual([]);

    const closed = await closeExecutiveRiskRecord(
      {
        reason: "CEO la responsible leader va co risk.close trong pham vi nay.",
        riskId: "risk-existing-01",
        status: "resolved",
      },
      {
        id: "ceo-01",
        permissions: ["risk.close"],
        permissionsMode: "replace",
        role: "tong_giam_doc",
      },
      dependencies(),
    );

    expect(closed).toMatchObject({
      closedBy: "ceo-01",
      status: "resolved",
    });
    expect(audits.map((audit) => audit.action)).toEqual(["risk.closed"]);
  });

  it("requires close_high or responsible leadership authority for high and critical records", async () => {
    await repository.createRiskRecord(storedRecord({
      level: "critical",
      status: "blocked",
    }));

    await expect(
      closeExecutiveRiskRecord(
        {
          reason: "Admin khong duoc dong critical risk.",
          riskId: "risk-existing-01",
          status: "closed",
        },
        {
          id: "admin-close-01",
          permissions: ["risk.close"],
          permissionsMode: "replace",
          role: "admin",
        },
        dependencies(),
      ),
    ).rejects.toThrow(/risk\.close_high|quyen|leader/i);

    await expect(
      closeExecutiveRiskRecord(
        {
          reason: "OwnerId don thuan khong duoc dong critical risk.",
          riskId: "risk-existing-01",
          status: "closed",
        },
        {
          id: "owner-01",
          permissions: ["risk.close"],
          permissionsMode: "replace",
          role: "admin",
        },
        dependencies(),
      ),
    ).rejects.toThrow(/risk\.close_high|quyen|leader/i);

    const closed = await closeExecutiveRiskRecord(
      {
        reason: "CEO phe duyet dong critical blocker sau khi da co bien phap.",
        riskId: "risk-existing-01",
        status: "closed",
      },
      {
        id: "ceo-01",
        permissions: ["risk.close_high"],
        permissionsMode: "replace",
        role: "tong_giam_doc",
      },
      dependencies(),
    );

    expect(closed).toMatchObject({
      closedBy: "ceo-01",
      status: "closed",
    });
    expect(audits.map((audit) => audit.action)).toEqual(["risk.closed"]);
  });

  it("allows a scoped responsible leader with risk.close to close high risk", async () => {
    await repository.createRiskRecord(storedRecord({
      level: "high",
      status: "blocked",
    }));
    const scopeAssignments: ScopeAssignment[] = [
      {
        active: true,
        createdAt: timestamp,
        id: "assignment-risk-director",
        permissionKeys: ["risk.close"],
        projectId: "project-a",
        roleKey: "giam_doc_du_an",
        scopeType: "scoped",
        updatedAt: timestamp,
        userId: "director-01",
      },
    ];

    const closed = await closeExecutiveRiskRecord(
      {
        reason: "Giam doc du an trong scope dong high risk bang risk.close.",
        riskId: "risk-existing-01",
        status: "closed",
      },
      {
        id: "director-01",
        role: "giam_doc_du_an",
      },
      dependencies({ scopeAssignments }),
    );

    expect(closed).toMatchObject({
      closedBy: "director-01",
      status: "closed",
    });
    expect(audits.map((audit) => audit.action)).toEqual(["risk.closed"]);
  });

  it("blocks update, override and repeated close after a record is terminal", async () => {
    await repository.createRiskRecord(storedRecord({
      closedAt: timestamp,
      closedBy: "ceo-01",
      closedReason: "Da dong.",
      status: "closed",
    }));

    await expect(
      updateExecutiveRiskRecord(
        {
          nextAction: "Khong duoc sua record da dong.",
          riskId: "risk-existing-01",
        },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies(),
      ),
    ).rejects.toThrow(/dong|terminal|closed|resolved/i);
    await expect(
      overrideExecutiveRiskStatus(
        {
          reason: "Khong duoc override record da dong.",
          riskId: "risk-existing-01",
          statusOverride: "green",
        },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies(),
      ),
    ).rejects.toThrow(/dong|terminal|closed|resolved/i);
    await expect(
      closeExecutiveRiskRecord(
        {
          reason: "Dong lai record da dong.",
          riskId: "risk-existing-01",
          status: "resolved",
        },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies(),
      ),
    ).rejects.toThrow(/dong|terminal|closed|resolved/i);
    expect(audits).toEqual([]);
  });

  it("rolls back manual override fields when audit write fails", async () => {
    await repository.createRiskRecord(storedRecord());

    await expect(
      overrideExecutiveRiskStatus(
        {
          reason: "Override se bi rollback neu audit loi.",
          riskId: "risk-existing-01",
          statusOverride: "green",
        },
        { id: "ceo-01", role: "tong_giam_doc" },
        dependencies({
          auditWriter: async () => {
            throw new Error("audit failed");
          },
        }),
      ),
    ).rejects.toThrow(/audit failed/i);

    const restored = await repository.getRiskRecord("risk-existing-01");

    expect(restored).toMatchObject({
      updatedBy: "leader-01",
    });
    expect(restored?.statusOverride).toBeUndefined();
    expect(restored?.statusOverrideReason).toBeUndefined();
  });
});
