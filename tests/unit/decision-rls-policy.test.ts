import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const decisionPolicyFiles = [
  "database/migrations/202605300001_extend_decision_records.sql",
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
});
