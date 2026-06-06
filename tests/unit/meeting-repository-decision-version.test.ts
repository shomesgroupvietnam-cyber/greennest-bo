import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  const tables: Record<"decision_versions", Row[]> = {
    decision_versions: []
  };
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

  function createQuery(table: "decision_versions") {
    let rows = [...tables[table]];
    let insertPayload: Row | undefined;
    let deleteMode = false;
    const query = {
      eq(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);

        return query;
      },
      in(column: string, values: unknown[]) {
        if (deleteMode) {
          tables[table] = tables[table].filter((row) => !values.includes(row[column]));
          rows = [];
        }

        return query;
      },
      order(column: string, options: { ascending?: boolean } = {}) {
        rows = [...rows].sort((left, right) => {
          const direction = options.ascending === false ? -1 : 1;

          return String(left[column]).localeCompare(String(right[column])) * direction;
        });

        return query;
      },
      insert(payload: Row) {
        insertPayload = payload;
        tables[table] = [payload, ...tables[table]];
        rows = [payload];

        return query;
      },
      delete() {
        deleteMode = true;

        return query;
      },
      select() {
        return query;
      },
      single() {
        return Promise.resolve({ data: insertPayload ?? rows[0], error: null });
      },
      then(resolve: (value: { data: Row[]; error: null }) => unknown) {
        return Promise.resolve({ data: rows, error: null }).then(resolve);
      }
    };

    return query;
  }

  return {
    createSupabaseServerClient: vi.fn(async () => ({
      from: (table: "decision_versions") => createQuery(table),
      rpc: (name: string, args: Record<string, unknown>) => {
        rpcCalls.push({ name, args });

        return Promise.resolve({
          data: {
            id: args.p_decision_id,
            title: "Updated decision",
            organization_id: "org-green-nest",
            meeting_id: null,
            project_id: "10000000-0000-4000-8000-000000000001",
            project_ids: ["10000000-0000-4000-8000-000000000001"],
            axis_id: null,
            workstream_id: null,
            module_id: null,
            decision_text: "Updated body",
            source_type: "independent",
            source_id: null,
            linked_records: [],
            owner_id: null,
            priority: "medium",
            kpi: null,
            due_date: "2026-06-10",
            status: "open",
            task_id: null,
            created_by: "20000000-0000-4000-8000-000000000001",
            decided_by: "20000000-0000-4000-8000-000000000001",
            decided_at: "2026-05-31T08:00:00.000Z",
            created_at: "2026-05-31T08:00:00.000Z",
            updated_at: "2026-05-31T09:00:00.000Z"
          },
          error: null
        });
      }
    })),
    tables,
    rpcCalls
  };
});

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: supabaseMock.createSupabaseServerClient,
  isSupabaseAuthConfigured: () => false
}));

import { SupabaseMeetingRepository } from "@/modules/meetings/services/meeting-repository";

describe("meeting repository decision versions", () => {
  beforeEach(() => {
    supabaseMock.tables.decision_versions = [];
    supabaseMock.rpcCalls.length = 0;
    supabaseMock.createSupabaseServerClient.mockClear();
  });

  it("maps Supabase decision version rows to camelCase domain fields", async () => {
    supabaseMock.tables.decision_versions = [
      {
        id: "version-01",
        decision_id: "decision-01",
        version_number: 2,
        changed_fields: ["dueDate"],
        previous_value: { dueDate: "2026-06-01" },
        new_value: { dueDate: "2026-06-10" },
        reason: "Gia han.",
        created_by: "leader-01",
        created_at: "2026-05-31T08:00:00.000Z",
        updated_at: "2026-05-31T08:00:00.000Z"
      }
    ];
    const repository = new SupabaseMeetingRepository();

    const versions = await repository.listDecisionVersions("decision-01");

    expect(versions).toEqual([
      expect.objectContaining({
        id: "version-01",
        decisionId: "decision-01",
        versionNumber: 2,
        changedFields: ["dueDate"],
        previousValue: { dueDate: "2026-06-01" },
        newValue: { dueDate: "2026-06-10" },
        reason: "Gia han.",
        createdBy: "leader-01"
      })
    ]);
    expect(JSON.stringify(versions)).not.toMatch(/decision_id|version_number|created_by/);
  });

  it("maps created decision versions to snake_case before insert", async () => {
    const repository = new SupabaseMeetingRepository();

    await repository.createDecisionVersion({
      id: "version-02",
      decisionId: "decision-01",
      versionNumber: 3,
      changedFields: ["ownerId"],
      previousValue: { ownerId: "leader-01" },
      newValue: { ownerId: "legal-manager" },
      reason: undefined,
      createdBy: "leader-01",
      createdAt: "2026-05-31T09:00:00.000Z",
      updatedAt: "2026-05-31T09:00:00.000Z"
    });

    expect(supabaseMock.tables.decision_versions[0]).toMatchObject({
      id: "version-02",
      decision_id: "decision-01",
      version_number: 3,
      changed_fields: ["ownerId"],
      previous_value: { ownerId: "leader-01" },
      new_value: { ownerId: "legal-manager" },
      reason: null,
      created_by: "leader-01"
    });
  });

  it("calls the transactional Supabase RPC with snake_case decision, version, and audit payloads", async () => {
    const repository = new SupabaseMeetingRepository();

    const updated = await repository.updateDecisionWithVersionAndAudit({
      decisionId: "30000000-0000-4000-8000-000000000001",
      patch: {
        dueDate: "2026-06-10",
        updatedAt: "2026-05-31T09:00:00.000Z"
      },
      version: {
        id: "40000000-0000-4000-8000-000000000001",
        decisionId: "30000000-0000-4000-8000-000000000001",
        versionNumber: 1,
        changedFields: ["dueDate"],
        previousValue: { dueDate: "2026-06-01" },
        newValue: { dueDate: "2026-06-10" },
        reason: "Gia han.",
        createdBy: "20000000-0000-4000-8000-000000000001",
        createdAt: "2026-05-31T09:00:00.000Z",
        updatedAt: "2026-05-31T09:00:00.000Z"
      },
      auditLog: {
        actorId: "20000000-0000-4000-8000-000000000001",
        entityType: "decision",
        entityId: "30000000-0000-4000-8000-000000000001",
        action: "decision.updated",
        oldValue: { dueDate: "2026-06-01" },
        newValue: { dueDate: "2026-06-10" }
      }
    });

    expect(updated).toMatchObject({
      id: "30000000-0000-4000-8000-000000000001",
      dueDate: "2026-06-10",
      updatedAt: "2026-05-31T09:00:00.000Z"
    });
    expect(supabaseMock.rpcCalls).toEqual([
      {
        name: "update_decision_with_version_and_audit",
        args: {
          p_decision_id: "30000000-0000-4000-8000-000000000001",
          p_decision_patch: {
            due_date: "2026-06-10",
            updated_at: "2026-05-31T09:00:00.000Z"
          },
          p_decision_version: {
            id: "40000000-0000-4000-8000-000000000001",
            decision_id: "30000000-0000-4000-8000-000000000001",
            version_number: 1,
            changed_fields: ["dueDate"],
            previous_value: { dueDate: "2026-06-01" },
            new_value: { dueDate: "2026-06-10" },
            reason: "Gia han.",
            created_by: "20000000-0000-4000-8000-000000000001",
            created_at: "2026-05-31T09:00:00.000Z",
            updated_at: "2026-05-31T09:00:00.000Z"
          },
          p_audit_log: {
            actor_id: "20000000-0000-4000-8000-000000000001",
            entity_type: "decision",
            entity_id: "30000000-0000-4000-8000-000000000001",
            action: "decision.updated",
            old_value: { dueDate: "2026-06-01" },
            new_value: { dueDate: "2026-06-10" }
          }
        }
      }
    ]);
  });
});
