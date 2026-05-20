import { createClient } from "@supabase/supabase-js";

const requiredRoles = [
  "super_admin",
  "admin",
  "tong_giam_doc",
  "pho_tong_giam_doc",
  "giam_doc_du_an",
  "quan_ly_du_an",
  "to_truong",
  "phap_ly",
  "ke_toan",
  "thiet_ke",
  "ky_thuat",
  "thi_cong",
  "mua_hang",
  "thu_ky_tro_ly",
  "kiem_soat_noi_bo",
  "nha_thau",
  "tu_van",
  "viewer"
];

const requiredPermissions = [
  "project.view",
  "project.create",
  "project.update",
  "project.archive",
  "project.assign_member",
  "task.view",
  "task.create",
  "task.update",
  "task.update_own",
  "task.archive",
  "document.view",
  "document.create",
  "document.update",
  "document.approve",
  "document.archive",
  "legal.view",
  "legal.update",
  "legal.approve",
  "legal.configure_template",
  "meeting.view",
  "meeting.create",
  "meeting.update",
  "decision.create",
  "decision.approve",
  "report.view",
  "report.create",
  "knowledge.view",
  "knowledge.create",
  "knowledge.create_candidate",
  "knowledge.promote",
  "knowledge.review",
  "knowledge.approve",
  "knowledge.manage_source_registry",
  "design.view",
  "design.create",
  "design.update",
  "design.review",
  "design.approve_change",
  "construction.view",
  "construction.update",
  "site_diary.create",
  "quality.update",
  "acceptance.approve",
  "finance.view",
  "finance.create",
  "finance.update",
  "finance.approve",
  "payment.request",
  "payment.approve",
  "user.view",
  "user.invite",
  "user.update_role",
  "settings.manage",
  "audit.view",
  "ai.use",
  "ai.ask",
  "ai.use_rag",
  "ai.view_insight",
  "ai.create_draft",
  "ai.propose_action",
  "ai.confirm_action",
  "ai.configure"
];

const coreTables = [
  "users",
  "projects",
  "tasks",
  "documents",
  "document_versions",
  "legal_steps",
  "meetings",
  "decisions",
  "report_runs",
  "knowledge_items",
  "knowledge_candidates",
  "knowledge_chunks",
  "source_registry_entries",
  "external_search_logs",
  "audit_logs"
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

const errors = [];

function recordError(label, error) {
  errors.push(`${label}: ${error.message}`);
}

async function countTable(tableName) {
  const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true });

  if (error) {
    recordError(`count ${tableName}`, error);
    return null;
  }

  return count ?? 0;
}

async function requireKeys(tableName, keys, label) {
  const { data, error } = await supabase.from(tableName).select("key").in("key", keys);

  if (error) {
    recordError(`read ${label}`, error);
    return;
  }

  const present = new Set((data ?? []).map((row) => row.key));
  const missing = keys.filter((key) => !present.has(key));

  if (missing.length > 0) {
    errors.push(`missing ${label}: ${missing.join(", ")}`);
  }
}

console.log("Checking Supabase staging foundation...");
console.log(`Repository mode should be GREENNEST_REPOSITORY_MODE=${process.env.GREENNEST_REPOSITORY_MODE || "(auto)"}`);

await requireKeys("roles", requiredRoles, "roles");
await requireKeys("permissions", requiredPermissions, "permissions");

const rolePermissionCount = await countTable("role_permissions");

if (rolePermissionCount !== null && rolePermissionCount < requiredRoles.length) {
  errors.push(`role_permissions has ${rolePermissionCount} rows; expected seeded mappings.`);
}

for (const tableName of coreTables) {
  const count = await countTable(tableName);

  if (count !== null) {
    console.log(`${tableName}: ${count}`);
  }
}

const { data: bucket, error: bucketError } = await supabase.storage.getBucket("project-documents");

if (bucketError) {
  console.warn(`Storage bucket project-documents not confirmed: ${bucketError.message}`);
} else {
  console.log(`storage bucket: ${bucket.name}, public=${bucket.public}`);
}

if (errors.length > 0) {
  console.error("Supabase staging smoke check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Supabase staging smoke check passed.");
