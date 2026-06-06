import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("executive risk record RLS parity", () => {
  it("defines table constraints, indexes and update trigger", async () => {
    const sql = await readFile(
      "database/migrations/202606010001_create_executive_risk_records.sql",
      "utf8",
    );
    const extensionSql = await readFile(
      "database/migrations/202606020001_extend_executive_risk_records_close_override.sql",
      "utf8",
    );

    expect(sql).toContain("create table if not exists public.executive_risk_records");
    expect(sql).toContain("record_type in ('risk', 'blocker')");
    expect(sql).toContain("level in ('low', 'medium', 'high', 'critical')");
    expect(sql).toContain("status in ('open', 'monitoring', 'in_progress', 'blocked')");
    expect(extensionSql).toContain("status_override");
    expect(extensionSql).toContain("status_override_reason");
    expect(extensionSql).toContain("executive_risk_records_status_override_audit_check");
    expect(extensionSql).toContain("status_override_by is not null");
    expect(extensionSql).toContain("closed_reason");
    expect(extensionSql).toContain("'closed', 'resolved'");
    expect(extensionSql).toContain("idx_executive_risk_records_active");
    expect(sql).toContain("idx_executive_risk_records_project");
    expect(sql).toContain("idx_executive_risk_records_status");
    expect(sql).toContain("idx_executive_risk_records_owner");
    expect(sql).toContain("set_executive_risk_records_updated_at");
    expect(sql).toContain("alter table public.executive_risk_records enable row level security");
  });

  it("requires risk.view/risk.create/risk.update and current actor checks in policy asset", async () => {
    const sql = await readFile("database/policies/001_mvp_rls.sql", "utf8");

    expect(sql).toContain("current_user_can_read_risk_record");
    expect(sql).toContain("current_user_can_write_risk_record");
    expect(sql).toContain("public.current_user_has_permission('risk.view')");
    expect(sql).toContain("public.current_user_can_write_risk_record('risk.create', project_id)");
    expect(sql).toContain("public.current_user_can_write_risk_record('risk.update', project_id)");
    expect(sql).toContain("public.current_user_can_write_risk_record('risk.override', project_id)");
    expect(sql).toContain("public.current_user_can_write_risk_record('risk.close', project_id)");
    expect(sql).toContain("public.current_user_can_write_risk_record('risk.close_high', project_id)");
    expect(sql).toContain("created_by = public.current_app_user_id()");
    expect(sql).toContain("updated_by = public.current_app_user_id()");
    expect(sql).toContain("guard_executive_risk_record_lifecycle_permissions");
    expect(sql).toContain("new.status_override is distinct from old.status_override");
    expect(sql).toContain("not public.current_user_can_write_risk_record('risk.override', new.project_id)");
  });

  it("adds smoke verification for risk table, policies and permissions", async () => {
    const sql = await readFile(
      "database/verification/007_executive_risk_records_rls.sql",
      "utf8",
    );

    expect(sql).toContain("executive_risk_records");
    expect(sql).toContain("executive risk records readable by scoped risk users");
    expect(sql).toContain("executive risk records creatable by scoped risk users");
    expect(sql).toContain("executive risk records updatable by scoped risk users");
    expect(sql).toContain("'risk.create', 'risk.update', 'risk.override', 'risk.close', 'risk.close_high'");
    expect(sql).toContain("executive_risk_records_status_override_audit_check");
    expect(sql).toContain("guard_executive_risk_record_lifecycle_permissions");
  });

  it("extends notification outbox RLS so risk source uses risk.view instead of proposal.view", async () => {
    const migration = await readFile(
      "database/migrations/202606020002_extend_notification_outbox_risk_source.sql",
      "utf8",
    );
    const policySql = await readFile("database/policies/001_mvp_rls.sql", "utf8");
    const verification = await readFile(
      "database/verification/008_risk_notification_outbox_rls.sql",
      "utf8",
    );

    expect(migration).toContain("source_type in ('proposal', 'leadership_approval', 'executive_action', 'risk')");
    expect(policySql).toContain("when item_source_type = 'risk' then exists");
    expect(policySql).toContain("from public.executive_risk_records risk_record");
    expect(policySql).toContain("public.current_user_has_permission('risk.view')");
    expect(policySql).not.toContain("item_source_type = 'risk' then public.current_user_has_permission('proposal.view')");
    expect(policySql).toContain("current_user_can_write_notification_outbox_item");
    expect(policySql).toContain("public.current_user_can_write_risk_record('risk.update', risk_record.project_id)");
    expect(policySql).toContain("with check (public.current_user_can_write_notification_outbox_item(source_type, source_id, project_id))");
    expect(verification).toContain("risk notification outbox readable by scoped risk users");
    expect(verification).toContain("risk.view");
  });
});
