"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import type { SourceRegistryEntryInput } from "@/modules/knowledge/types";
import {
  setSourceRegistryEntryEnabled,
  upsertSourceRegistryEntry
} from "@/modules/settings/services/source-registry-settings-service";
import { createAuditLog } from "@/modules/users/services/user-service";

function readTags(formData: FormData) {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formDataToSourceRegistryEntryInput(formData: FormData): SourceRegistryEntryInput {
  return {
    domain: String(formData.get("domain") ?? ""),
    sourceCategory: String(formData.get("sourceCategory") ?? "reference") as SourceRegistryEntryInput["sourceCategory"],
    module: String(formData.get("module") ?? "general") as SourceRegistryEntryInput["module"],
    sourceType: String(formData.get("sourceType") ?? "internal_note") as SourceRegistryEntryInput["sourceType"],
    confidence: String(formData.get("confidence") ?? "unknown") as SourceRegistryEntryInput["confidence"],
    tags: readTags(formData),
    enabled: String(formData.get("enabled") ?? "true") === "true",
    notes: String(formData.get("notes") ?? "").trim() || undefined
  };
}

export async function upsertSourceRegistryEntryAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const entry = await upsertSourceRegistryEntry(formDataToSourceRegistryEntryInput(formData), currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "source_registry_entry",
    entityId: entry.id,
    action: "source_registry.upsert",
    newValue: {
      domain: entry.domain,
      enabled: entry.enabled,
      module: entry.module,
      sourceType: entry.sourceType,
      confidence: entry.confidence
    }
  });

  revalidatePath("/settings");
  revalidatePath("/knowledge/intake");
  redirect("/settings");
}

export async function setSourceRegistryEntryEnabledAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const entryId = String(formData.get("entryId") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";
  const entry = await setSourceRegistryEntryEnabled(entryId, enabled, currentUser);

  await createAuditLog({
    actorId: currentUser.id,
    entityType: "source_registry_entry",
    entityId: entry.id,
    action: enabled ? "source_registry.enable" : "source_registry.disable",
    newValue: { domain: entry.domain, enabled: entry.enabled }
  });

  revalidatePath("/settings");
  revalidatePath("/knowledge/intake");
  redirect("/settings");
}
