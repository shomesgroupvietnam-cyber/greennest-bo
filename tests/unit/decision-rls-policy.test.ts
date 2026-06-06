import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const decisionPolicyFiles = [
  "database/migrations/202605300001_extend_decision_records.sql",
  "database/policies/001_mvp_rls.sql",
];

const decisionAssignmentPolicyFiles = [
  "database/migrations/202605310001_create_decision_assignments.sql",
  "database/policies/001_mvp_rls.sql",
];

const decisionVersionPolicyFiles = [
  "database/migrations/202605310002_create_decision_versions.sql",
  "database/policies/001_mvp_rls.sql",
];

describe("decision record RLS parity", () => {
  it.each(decisionPolicyFiles)(
    "requires write-specific decision scope checks in %s",
    async (filePath) => {
      const sql = await readFile(filePath, "utf8");

      expect(sql).toContain("current_user_can_write_decision_scope");
      expect(sql).toContain("not exists (\n          select 1\n          from scoped_projects");
      expect(sql).toContain("where not public.current_user_can_read_project(project_id)");
      expect(sql).toContain("when decision_source_type in ('proposal', 'approval') then");
      expect(sql).toContain("public.current_user_has_permission('proposal.view')");
      expect(sql).toContain(
        "and public.current_user_can_write_decision_scope(project_id, project_ids, source_type, source_id)",
      );
    },
  );

  it.each(decisionAssignmentPolicyFiles)(
    "enforces decision assignment scope and task-create checks in %s",
    async (filePath) => {
      const sql = await readFile(filePath, "utf8");

      expect(sql).toContain("decision_assignments");
      expect(sql).toContain("alter table public.decision_assignments enable row level security");
      expect(sql).toContain("current_user_can_access_decision_scope");
      expect(sql).toContain("current_user_can_write_decision_scope");
      expect(sql).toContain("public.current_user_has_permission('task.create')");
      expect(sql).toContain("public.current_user_has_permission('decision.create')");
      expect(sql).toContain("created_by = public.current_app_user_id()");
      expect(sql).toContain("current_user_can_read_project(decision_assignments.project_id)");
      expect(sql).toContain("decision_assignments.project_id = decision_record.project_id");
      expect(sql).toContain("task_id is not null");
      expect(sql).not.toContain("task_id is null");
      expect(sql).toContain("task_record.linked_entity_type = 'decision'");
      expect(sql).toContain("task_record.linked_entity_id = decision_assignments.decision_id");
      expect(sql).toContain("array[decision_assignments.project_id]");
      expect(sql).toContain("decision assignments rollback deletable by creators");
      expect(sql).toContain("decision assignment tasks rollback deletable by creators");
    },
  );

  it("prevents decision assignment relinking in the migration", async () => {
    const sql = await readFile("database/migrations/202605310001_create_decision_assignments.sql", "utf8");

    expect(sql).toContain("task_id uuid not null");
    expect(sql).toContain("prevent_decision_assignment_relink");
    expect(sql).toContain("new.decision_id is distinct from old.decision_id");
    expect(sql).toContain("new.task_id is distinct from old.task_id");
    expect(sql).toContain("new.project_id is distinct from old.project_id");
    expect(sql).toContain("new.created_by is distinct from old.created_by");
  });

  it.each(decisionVersionPolicyFiles)(
    "enforces decision version scope and immutability in %s",
    async (filePath) => {
      const sql = await readFile(filePath, "utf8");

      expect(sql).toContain("decision_versions");
      expect(sql).toContain("alter table public.decision_versions enable row level security");
      expect(sql).toContain("decision versions readable by scoped decision users");
      expect(sql).toContain("current_user_can_access_decision_scope");
      expect(sql).toContain("decision versions insertable by scoped decision writers");
      expect(sql).toContain("current_user_can_write_decision_scope");
      expect(sql).toContain("created_by = public.current_app_user_id()");
      if (filePath.includes("migrations")) {
        expect(sql).toContain("unique (decision_id, version_number)");
        expect(sql).toContain("idx_decision_versions_decision");
        expect(sql).toContain("update_decision_with_version_and_audit");
        expect(sql).toContain("security invoker");
      }
      expect(sql).not.toContain("decision versions updatable");
      expect(sql).not.toContain("decision versions deletable");
    },
  );
});
