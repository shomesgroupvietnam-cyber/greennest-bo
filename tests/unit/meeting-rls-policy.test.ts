import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const meetingPolicyFiles = [
  "database/migrations/202606020003_harden_meeting_scope_rls.sql",
  "database/policies/001_mvp_rls.sql",
];
const relatedRecordsMigration = "database/migrations/202606030001_add_meeting_related_records.sql";

function extractFunction(sql: string, name: string) {
  const match = new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`).exec(sql);

  expect(match, `Missing SQL function ${name}`).not.toBeNull();

  return match?.[0] ?? "";
}

describe("meeting RLS policy parity", () => {
  it.each(meetingPolicyFiles)("mirrors scoped project_ids and organization-only meeting policy in %s", async (filePath) => {
    const sql = await readFile(filePath, "utf8");
    const accessScope = extractFunction(sql, "current_user_can_access_meeting_scope");
    const createScope = extractFunction(sql, "current_user_can_create_meeting_scope");

    expect(sql).toContain("current_user_can_access_meeting_scope");
    expect(sql).toContain("current_user_can_create_meeting_scope");
    expect(sql).toContain("current_user_has_matching_scope_assignment");
    expect(sql).toContain("from public.access_scope_assignments asa");
    expect(sql).toContain("permission_key = any(asa.permission_keys)");
    expect(sql).toContain(
      "public.current_user_can_access_meeting_scope(id, project_id, project_ids, host_id, participants, organization_id, axis_id, department_id)",
    );
    expect(sql).toContain(
      "public.current_user_can_create_meeting_scope(project_id, project_ids, host_id, organization_id, axis_id, department_id)",
    );

    expect(accessScope).toContain("from unnest(");
    expect(accessScope).toContain("coalesce(meeting_project_ids, '{}'::uuid[])");
    expect(accessScope).toContain("public.current_user_has_matching_scope_assignment(");
    expect(accessScope).toContain("and not public.current_user_uses_assignment_scope()");
    expect(accessScope).not.toContain("select\n    public.current_user_has_internal_permission('meeting.view')\n    or");

    expect(createScope).toContain("from public.projects project_record");
    expect(createScope).toContain("project_record.id = project_id");
    expect(createScope).toContain("public.current_user_has_matching_scope_assignment(");
    expect(createScope).toContain("and not public.current_user_uses_assignment_scope()");
    expect(createScope).not.toContain("or public.current_user_has_internal_permission('meeting.create')");
  });

  it("adds related_records as metadata without widening meeting RLS scope", async () => {
    const migration = await readFile(relatedRecordsMigration, "utf8");
    const policySql = await Promise.all(meetingPolicyFiles.map((filePath) => readFile(filePath, "utf8")));

    expect(migration).toContain("add column if not exists related_records jsonb not null default '[]'::jsonb");
    expect(migration).toContain("using gin(related_records)");
    expect(migration).not.toContain("create policy");
    expect(migration).not.toContain("current_user_can_access_meeting_scope");

    for (const sql of policySql) {
      const accessScope = extractFunction(sql, "current_user_can_access_meeting_scope");

      expect(accessScope).not.toContain("related_records");
      expect(sql).toContain(
        "public.current_user_can_access_meeting_scope(id, project_id, project_ids, host_id, participants, organization_id, axis_id, department_id)",
      );
    }
  });
});
