import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  JsonRiskRecordRepository,
  executiveRiskRecordToRow,
  riskRecordPatchToRow,
  toExecutiveRiskRecord,
} from "@/modules/executive/services/risk-record-repository";
import type { ExecutiveRiskRecord } from "@/modules/executive/types";

let tempDir: string;
let repository: JsonRiskRecordRepository;

const timestamp = "2026-06-01T00:00:00.000Z";

function record(overrides: Partial<ExecutiveRiskRecord> = {}): ExecutiveRiskRecord {
  return {
    categoryKey: "legal",
    createdAt: timestamp,
    createdBy: "leader-01",
    deadline: "2026-06-10",
    id: "risk-01",
    level: "high",
    moduleId: "risk",
    nextAction: "Kiem tra ho so phap ly",
    ownerId: "owner-01",
    ownerName: "Owner One",
    projectId: "project-a",
    reason: "Ho so phap ly dang cham",
    recordType: "risk",
    status: "open",
    title: "Ho so phap ly cham",
    updatedAt: timestamp,
    updatedBy: "leader-01",
    ...overrides,
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-risk-record-repo-"));
  repository = new JsonRiskRecordRepository(path.join(tempDir, "risks.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("risk record repository", () => {
  it("persists, filters, updates and deletes JSON risk records", async () => {
    await repository.createRiskRecord(record({ id: "risk-a", projectId: "project-a" }));
    await repository.createRiskRecord(record({ id: "risk-b", projectId: "project-b", status: "blocked" }));

    expect(await repository.listRiskRecords({ projectId: "project-a" })).toHaveLength(1);
    expect(await repository.listRiskRecords({ status: "blocked" })).toMatchObject([
      { id: "risk-b" },
    ]);

    await repository.updateRiskRecord("risk-a", {
      status: "monitoring",
      title: "Updated risk",
    });

    expect(await repository.getRiskRecord("risk-a")).toMatchObject({
      createdAt: timestamp,
      createdBy: "leader-01",
      status: "monitoring",
      title: "Updated risk",
    });

    await repository.deleteRiskRecord("risk-a");

    expect(await repository.getRiskRecord("risk-a")).toBeUndefined();
  });

  it("excludes terminal risks by default while keeping history available", async () => {
    await repository.createRiskRecord(record({ id: "risk-open", status: "open" }));
    await repository.createRiskRecord(record({
      closedAt: timestamp,
      closedBy: "ceo-01",
      closedReason: "Da go blocker.",
      id: "risk-closed",
      status: "closed",
    }));
    await repository.createRiskRecord(record({
      closedAt: timestamp,
      closedBy: "ceo-01",
      closedReason: "Da xu ly.",
      id: "risk-resolved",
      status: "resolved",
    }));

    expect((await repository.listRiskRecords()).map((item) => item.id)).toEqual([
      "risk-open",
    ]);
    expect((await repository.listRiskRecords({ includeClosed: true })).map((item) => item.id)).toEqual([
      "risk-open",
      "risk-closed",
      "risk-resolved",
    ]);
    expect(await repository.listRiskRecords({ status: "closed" })).toMatchObject([
      { id: "risk-closed" },
    ]);
    expect(await repository.listRiskRecords({ status: "resolved" })).toMatchObject([
      { id: "risk-resolved" },
    ]);
  });

  it("maps Supabase rows with null optional values to undefined domain fields", () => {
    const row = executiveRiskRecordToRow(record({
      delegationId: undefined,
      description: undefined,
      onBehalfOf: undefined,
      organizationId: undefined,
      sourceId: undefined,
      sourceType: undefined,
    }));
    const mapped = toExecutiveRiskRecord(row);

    expect(row).toMatchObject({
      delegation_id: null,
      description: null,
      on_behalf_of: null,
      source_id: null,
    });
    expect(mapped).toMatchObject({
      deadline: "2026-06-10",
      id: "risk-01",
      projectId: "project-a",
    });
    expect(mapped.delegationId).toBeUndefined();
    expect(mapped.description).toBeUndefined();
    expect(mapped.sourceType).toBeUndefined();
  });

  it("maps manual override and terminal close fields through Supabase rows", () => {
    const row = executiveRiskRecordToRow(record({
      closedAt: timestamp,
      closedBy: "ceo-01",
      closedReason: "Da dong blocker.",
      id: "risk-overridden",
      status: "closed",
      statusOverride: "green",
      statusOverrideAt: timestamp,
      statusOverrideBy: "ceo-01",
      statusOverrideReason: "CEO xac nhan da co bien phap kiem soat.",
      statusOverrideSourceStatus: "red",
    }));
    const mapped = toExecutiveRiskRecord(row);

    expect(row).toMatchObject({
      closed_at: timestamp,
      closed_by: "ceo-01",
      closed_reason: "Da dong blocker.",
      status: "closed",
      status_override: "green",
      status_override_at: timestamp,
      status_override_by: "ceo-01",
      status_override_reason: "CEO xac nhan da co bien phap kiem soat.",
      status_override_source_status: "red",
    });
    expect(mapped).toMatchObject({
      closedAt: timestamp,
      closedBy: "ceo-01",
      closedReason: "Da dong blocker.",
      id: "risk-overridden",
      statusOverride: "green",
      statusOverrideSourceStatus: "red",
    });
  });

  it("maps explicit undefined patch fields to null for Supabase rollback", () => {
    const emptyPatch = riskRecordPatchToRow({});
    const rollbackPatch = riskRecordPatchToRow({
      closedAt: undefined,
      closedBy: undefined,
      closedReason: undefined,
      delegationId: undefined,
      description: undefined,
      onBehalfOf: undefined,
      ownerName: undefined,
      projectId: undefined,
      sourceId: undefined,
      sourceType: undefined,
      statusOverride: undefined,
      statusOverrideAt: undefined,
      statusOverrideBy: undefined,
      statusOverrideReason: undefined,
      statusOverrideSourceStatus: undefined,
    });

    expect(emptyPatch).not.toHaveProperty("description");
    expect(rollbackPatch).toMatchObject({
      closed_at: null,
      closed_by: null,
      closed_reason: null,
      delegation_id: null,
      description: null,
      on_behalf_of: null,
      owner_name: null,
      project_id: null,
      source_id: null,
      source_type: null,
      status_override: null,
      status_override_at: null,
      status_override_by: null,
      status_override_reason: null,
      status_override_source_status: null,
    });
  });
});
