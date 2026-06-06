import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  const tables: Record<"tasks", Row[]> = {
    tasks: [],
  };

  function createQuery(table: "tasks") {
    let rows = [...tables[table]];
    const query = {
      eq(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);

        return query;
      },
      is(column: string, value: unknown) {
        rows = rows.filter((row) => row[column] === value);

        return query;
      },
      order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
        rows = [...rows].sort((left, right) => {
          const leftValue = left[column];
          const rightValue = right[column];

          if (leftValue == null && rightValue == null) {
            return 0;
          }

          if (leftValue == null) {
            return options.nullsFirst ? -1 : 1;
          }

          if (rightValue == null) {
            return options.nullsFirst ? 1 : -1;
          }

          const direction = options.ascending === false ? -1 : 1;

          return String(leftValue).localeCompare(String(rightValue)) * direction;
        });

        return query;
      },
      select() {
        return query;
      },
      then(resolve: (value: { data: Row[]; error: null }) => unknown) {
        return Promise.resolve({ data: rows, error: null }).then(resolve);
      },
    };

    return query;
  }

  return {
    createSupabaseServerClient: vi.fn(async () => ({
      from: (table: "tasks") => createQuery(table),
    })),
    tables,
  };
});

vi.mock("@/lib/auth/supabase-server", () => ({
  createSupabaseServerClient: supabaseMock.createSupabaseServerClient,
  isSupabaseAuthConfigured: () => false,
}));

import { SupabaseTaskRepository } from "@/modules/tasks/services/task-repository";

describe("task repository", () => {
  beforeEach(() => {
    supabaseMock.tables.tasks = [];
    supabaseMock.createSupabaseServerClient.mockClear();
  });

  it("maps Supabase linked entity task fields to camelCase domain fields", async () => {
    supabaseMock.tables.tasks = [
      {
        id: "task-01",
        project_id: "project-a",
        title: "Decision task",
        description: "Created from decision assignment.",
        assignee_id: "legal-manager",
        due_date: "2026-06-05",
        status: "todo",
        priority: "high",
        category: "decision",
        linked_entity_type: "decision",
        linked_entity_id: "decision-01",
        created_by: "leader-01",
        created_at: "2026-05-31T07:00:00.000Z",
        updated_at: "2026-05-31T07:00:00.000Z",
        archived_at: null,
      },
    ];
    const repository = new SupabaseTaskRepository();

    const tasks = await repository.listTasks({ projectId: "project-a" });

    expect(tasks).toEqual([
      expect.objectContaining({
        id: "task-01",
        projectId: "project-a",
        linkedEntityType: "decision",
        linkedEntityId: "decision-01",
        createdBy: "leader-01",
      }),
    ]);
    expect(JSON.stringify(tasks)).not.toMatch(/project_id|linked_entity_type|created_by/);
  });
});
