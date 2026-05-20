import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { checkAiProviderHealth, getAiProviderFromEnv, MockAiProvider } from "@/modules/ai/services/ai-provider";
import { MockExternalSearchProvider } from "@/modules/knowledge/services/external-search-provider";
import { getFriendlyProviderErrorMessage } from "@/modules/settings/services/provider-health-service";

type ValidationResult = {
  step: string;
  status: "passed" | "failed" | "warning";
  detail: string;
};

const VALIDATION_PREFIX = "staging-validation";
const VALIDATION_USER_EMAIL = "staging.validation@greennest.local";
const VALIDATION_USER_ID = "00000000-0000-4000-8000-00000000a001";
const SOURCE_REGISTRY_ID = `${VALIDATION_PREFIX}-source-registry`;
const SOURCE_REGISTRY_DOMAIN = `${VALIDATION_PREFIX}.greennest.local`;
const KNOWLEDGE_CANDIDATE_ID = "00000000-0000-4000-8000-00000000b001";
const DISCOVERY_TOPIC_ID = `${VALIDATION_PREFIX}-discovery-topic`;
const DISCOVERY_RUN_LOG_ID = `${VALIDATION_PREFIX}-discovery-run-log`;
const DISCOVERY_CANDIDATE_ID = "00000000-0000-4000-8000-00000000b002";
const AI_INTERACTION_ID = "00000000-0000-4000-8000-00000000c001";
const AI_JOB_ID = "00000000-0000-4000-8000-00000000c002";

const results: ValidationResult[] = [];

function pass(step: string, detail: string) {
  results.push({ step, status: "passed", detail });
}

function warn(step: string, detail: string) {
  results.push({ step, status: "warning", detail });
}

function fail(step: string, detail: string) {
  results.push({ step, status: "failed", detail });
}

function requireEnv() {
  const failures: string[] = [];

  if (process.env.GREENNEST_REPOSITORY_MODE !== "supabase") {
    failures.push("GREENNEST_REPOSITORY_MODE must be supabase.");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    failures.push("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    failures.push("SUPABASE_SERVICE_ROLE_KEY is required.");
  }

  if (process.env.ALLOW_STAGING_WRITES !== "true") {
    failures.push("ALLOW_STAGING_WRITES must be true.");
  }

  if (process.env.NODE_ENV === "production") {
    failures.push("NODE_ENV=production is not allowed.");
  }

  if (failures.length > 0) {
    console.error("Refusing to run staging write validation:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

function createSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
  });
}

async function ensureValidationUser(supabase: SupabaseClient) {
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: VALIDATION_USER_ID,
        full_name: "Staging Validation User",
        email: VALIDATION_USER_EMAIL,
        role: "admin",
        status: "active",
        updated_at: timestamp
      },
      { onConflict: "id" }
    )
    .select("id,email")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as { id: string; email: string };
}

async function validateTableAccess(supabase: SupabaseClient) {
  const tables = [
    "users",
    "source_registry_entries",
    "knowledge_candidates",
    "knowledge_discovery_topics",
    "knowledge_discovery_run_logs",
    "ai_interactions",
    "ai_jobs"
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("*", { count: "exact", head: true });

    if (error) {
      fail(`table access: ${table}`, error.message);
    } else {
      pass(`table access: ${table}`, "service role can read table metadata/count.");
    }
  }
}

async function validateSourceRegistry(supabase: SupabaseClient, userId: string) {
  const timestamp = new Date().toISOString();
  const baseEntry = {
    id: SOURCE_REGISTRY_ID,
    domain: SOURCE_REGISTRY_DOMAIN,
    source_category: "internal",
    module: "general",
    source_type: "internal_note",
    confidence: "internal_approved",
    tags: ["staging-validation"],
    enabled: true,
    notes: "Staging validation record. Safe to keep or remove after validation.",
    created_by: userId,
    updated_by: userId,
    updated_at: timestamp
  };

  const { error: upsertError } = await supabase.from("source_registry_entries").upsert(baseEntry, { onConflict: "domain" });

  if (upsertError) {
    fail("source registry: upsert", upsertError.message);
    return;
  }

  const { data: inserted, error: readError } = await supabase
    .from("source_registry_entries")
    .select("id,domain,enabled")
    .eq("domain", SOURCE_REGISTRY_DOMAIN)
    .maybeSingle();

  if (readError || !inserted) {
    fail("source registry: read back", readError?.message ?? "record was not found after upsert.");
    return;
  }

  const { error: disableError } = await supabase.from("source_registry_entries").update({ enabled: false, updated_by: userId }).eq("id", inserted.id);
  const { error: enableError } = await supabase.from("source_registry_entries").update({ enabled: true, updated_by: userId }).eq("id", inserted.id);

  if (disableError || enableError) {
    fail("source registry: disable/enable", disableError?.message ?? enableError?.message ?? "unknown toggle error.");
    return;
  }

  pass("source registry", `insert/read/toggle passed for ${SOURCE_REGISTRY_DOMAIN}.`);
}

async function validateKnowledgeCandidate(supabase: SupabaseClient, userId: string) {
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from("knowledge_candidates").upsert({
    id: KNOWLEDGE_CANDIDATE_ID,
    source_type: "manual",
    source_ref_id: `${VALIDATION_PREFIX}:manual-candidate`,
    module: "general",
    title: "Staging validation Knowledge Candidate",
    extracted_text: "This deterministic candidate validates Supabase Knowledge Candidate persistence.",
    submitted_by: userId,
    status: "pending_review",
    notes: "Staging validation record. Not RAG eligible.",
    updated_at: timestamp
  });

  if (error) {
    fail("knowledge candidate: create", error.message);
    return;
  }

  const { data, error: readError } = await supabase.from("knowledge_candidates").select("id,status").eq("id", KNOWLEDGE_CANDIDATE_ID).single();

  if (readError || data?.status !== "pending_review") {
    fail("knowledge candidate: read back", readError?.message ?? `unexpected status ${data?.status ?? "missing"}.`);
    return;
  }

  pass("knowledge candidate", "pending_review candidate persisted and read back.");
}

async function validateDiscovery(supabase: SupabaseClient, userId: string) {
  const timestamp = new Date().toISOString();
  const provider = new MockExternalSearchProvider({ maxResults: 2 });
  const rawResults = await provider.search({ query: "staging validation", limit: 2 });

  const { error: topicError } = await supabase.from("knowledge_discovery_topics").upsert({
    id: DISCOVERY_TOPIC_ID,
    module: "general",
    query: "staging validation",
    enabled: true,
    frequency: "manual",
    owner_id: userId,
    reviewer_id: userId,
    last_run_at: timestamp,
    last_run_status: "succeeded",
    retry_count: 0,
    max_retries: 1,
    created_by: userId,
    updated_by: userId,
    updated_at: timestamp
  });

  if (topicError) {
    fail("discovery: topic", topicError.message);
    return;
  }

  const { error: candidateError } = await supabase.from("knowledge_candidates").upsert({
    id: DISCOVERY_CANDIDATE_ID,
    source_type: "web_search",
    source_ref_id: rawResults[0]?.url ?? `${VALIDATION_PREFIX}:mock-result`,
    module: "general",
    title: `Staging validation discovery candidate: ${rawResults[0]?.title ?? "mock result"}`,
    extracted_text: rawResults[0]?.snippet ?? "Mock discovery result.",
    submitted_by: userId,
    status: "pending_review",
    notes: "Created by staging AI/Knowledge validation runner. Not RAG eligible.",
    updated_at: timestamp
  });

  if (candidateError) {
    fail("discovery: pending candidate", candidateError.message);
    return;
  }

  const { error: runLogError } = await supabase.from("knowledge_discovery_run_logs").upsert({
    id: DISCOVERY_RUN_LOG_ID,
    topic_id: DISCOVERY_TOPIC_ID,
    run_by: userId,
    query: "staging validation",
    provider: provider.key,
    provider_metadata: provider.metadata,
    status: "succeeded",
    result_count: rawResults.length,
    imported_count: 1,
    skipped_duplicate_count: Math.max(rawResults.length - 1, 0),
    skipped_disallowed_count: 0,
    retry_count: 0,
    max_retries: 1,
    started_at: timestamp,
    finished_at: new Date().toISOString()
  });

  if (runLogError) {
    fail("discovery: run log", runLogError.message);
    return;
  }

  const { data: runLog, error: readRunLogError } = await supabase
    .from("knowledge_discovery_run_logs")
    .select("id,status,imported_count")
    .eq("id", DISCOVERY_RUN_LOG_ID)
    .single();
  const { data: candidate, error: readCandidateError } = await supabase
    .from("knowledge_candidates")
    .select("id,status")
    .eq("id", DISCOVERY_CANDIDATE_ID)
    .single();

  if (readRunLogError || readCandidateError || runLog?.status !== "succeeded" || candidate?.status !== "pending_review") {
    fail("discovery: verify", readRunLogError?.message ?? readCandidateError?.message ?? "run log/candidate verification failed.");
    return;
  }

  pass("discovery", "topic, run log and pending_review discovery candidate verified.");
}

async function validateAi(supabase: SupabaseClient, userId: string) {
  const timestamp = new Date().toISOString();
  const scopeSnapshot = {
    userId,
    role: "admin",
    permissions: ["ai.ask", "ai.use_rag"],
    scopeKind: "internal_full",
    module: "general",
    resourceRefs: [],
    capturedAt: timestamp
  };
  const payload = {
    prompt: "Staging validation AI prompt",
    intent: "staging_validation",
    useRag: false,
    wantsActionProposal: false,
    knowledgeModule: "general"
  };

  const { error: interactionError } = await supabase.from("ai_interactions").upsert({
    id: AI_INTERACTION_ID,
    requested_by: userId,
    module: "general",
    intent: "staging_validation",
    mode: "fast",
    prompt_summary: "Staging validation AI prompt",
    model_provider: "mock",
    model_name: "mock-greennest-coordinator",
    status: "queued",
    scope_snapshot: scopeSnapshot,
    updated_at: timestamp
  });

  if (interactionError) {
    fail("AI: create interaction", interactionError.message);
    warn("AI schema note", "If this mentions public.profiles, align the AI migration FK with public.users or create a profiles compatibility view/table.");
    return;
  }

  const { error: jobError } = await supabase.from("ai_jobs").upsert({
    id: AI_JOB_ID,
    interaction_id: AI_INTERACTION_ID,
    requested_by: userId,
    module: "general",
    intent: "staging_validation",
    mode: "fast",
    priority: "low",
    status: "queued",
    scope_snapshot: scopeSnapshot,
    rate_limit_key: `staging-validation:${userId}`,
    payload,
    updated_at: timestamp
  });

  if (jobError) {
    fail("AI: create job", jobError.message);
    return;
  }

  const providerMode = process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "mock" ? "configured" : "mock";
  const providerResult = await resolveAiProviderResult(providerMode);
  const finishedAt = new Date().toISOString();
  const nextStatus = providerResult.ok ? "succeeded" : "failed";
  const responseText: string = providerResult.ok
    ? providerResult.text ?? "Configured AI provider validation completed."
    : getFriendlyProviderErrorMessage(providerResult.errorCode, providerResult.message);

  const { error: updateInteractionError } = await supabase
    .from("ai_interactions")
    .update({
      status: nextStatus,
      response_text: responseText,
      response_summary: responseText.slice(0, 180),
      model_provider: providerResult.provider,
      model_name: providerResult.model,
      completed_at: finishedAt,
      updated_at: finishedAt
    })
    .eq("id", AI_INTERACTION_ID);
  const { error: updateJobError } = await supabase
    .from("ai_jobs")
    .update({
      status: nextStatus,
      result_summary: providerResult.ok ? "Staging validation AI job completed." : undefined,
      error_code: providerResult.ok ? undefined : providerResult.errorCode ?? "provider_error",
      error_message: providerResult.ok ? undefined : responseText,
      started_at: timestamp,
      finished_at: finishedAt,
      updated_at: finishedAt
    })
    .eq("id", AI_JOB_ID);

  if (updateInteractionError || updateJobError) {
    fail("AI: process/store result", updateInteractionError?.message ?? updateJobError?.message ?? "unknown update error.");
    return;
  }

  const { data: job, error: readJobError } = await supabase.from("ai_jobs").select("id,status,error_message").eq("id", AI_JOB_ID).single();

  if (readJobError || !job || (job.status !== "succeeded" && job.status !== "failed")) {
    fail("AI: verify result", readJobError?.message ?? "job did not reach succeeded/failed.");
    return;
  }

  pass("AI", `interaction/job persisted and processed with ${providerMode} provider path; final status=${job.status}.`);
}

async function resolveAiProviderResult(providerMode: "mock" | "configured") {
  if (providerMode === "mock") {
    const provider = new MockAiProvider();

    return {
      ok: true,
      provider: provider.metadata.provider,
      model: provider.metadata.model,
      text: "Mock AI staging validation response."
    };
  }

  try {
    const health = await checkAiProviderHealth(getAiProviderFromEnv());

    return {
      ok: health.ok,
      provider: health.provider,
      model: health.model,
      text: health.ok ? "Configured AI provider health check passed." : undefined,
      errorCode: health.errorCode,
      message: health.message
    };
  } catch (error) {
    return {
      ok: false,
      provider: process.env.AI_PROVIDER || "unknown",
      model: process.env.AI_CHAT_MODEL || "unknown",
      errorCode: typeof error === "object" && error && "code" in error && typeof error.code === "string" ? error.code : "provider_error",
      message: error instanceof Error ? error.message : "AI provider validation failed."
    };
  }
}

function printSummary() {
  console.log("\nAI/Knowledge Supabase staging validation results:");
  for (const result of results) {
    const icon = result.status === "passed" ? "PASS" : result.status === "warning" ? "WARN" : "FAIL";
    console.log(`[${icon}] ${result.step}: ${result.detail}`);
  }

  const failed = results.filter((result) => result.status === "failed");

  if (failed.length > 0) {
    console.error(`\nValidation failed with ${failed.length} failed step(s).`);
    process.exit(1);
  }

  console.log("\nValidation passed. Staging validation records are deterministic and marked with staging-validation identifiers.");
}

requireEnv();

const supabase = createSupabase();

try {
  const user = await ensureValidationUser(supabase);
  pass("guard", "staging write guards passed.");
  pass("validation user", `using ${user.email}.`);

  await validateTableAccess(supabase);
  await validateSourceRegistry(supabase, user.id);
  await validateKnowledgeCandidate(supabase, user.id);
  await validateDiscovery(supabase, user.id);
  await validateAi(supabase, user.id);
} catch (error) {
  fail("runner", error instanceof Error ? error.message : "Unknown runner failure.");
} finally {
  printSummary();
}
