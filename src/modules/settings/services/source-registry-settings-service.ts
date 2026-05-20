import { can, type PermissionUser } from "@/lib/permissions/can";
import { normalizeSourceHostname } from "@/modules/knowledge/services/source-registry";
import type { ManagedSourceRegistryEntry, SourceRegistryEntryInput } from "@/modules/knowledge/types";
import { sourceRegistryEntryInputSchema } from "@/modules/settings/validation";

import {
  sourceRegistrySettingsRepository,
  type SourceRegistrySettingsRepository
} from "./source-registry-settings-repository";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

function assertManageSourceRegistry(user: PermissionUser) {
  if (!can(user, "settings.manage") && !can(user, "knowledge.manage_source_registry")) {
    throw new Error("Ban khong co quyen quan ly source registry.");
  }
}

function normalizeDomain(domain: string) {
  const asUrl = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;
  const hostname = normalizeSourceHostname(asUrl);

  if (!hostname || !hostname.includes(".")) {
    throw new Error("Domain source registry khong hop le.");
  }

  return hostname;
}

export async function listSourceRegistryEntries(repository: SourceRegistrySettingsRepository = sourceRegistrySettingsRepository) {
  return repository.listEntries();
}

export async function listActiveSourceRegistryEntries(repository: SourceRegistrySettingsRepository = sourceRegistrySettingsRepository) {
  const entries = await repository.listEntries();

  return entries.filter((entry) => entry.enabled);
}

export async function upsertSourceRegistryEntry(
  input: SourceRegistryEntryInput,
  user: PermissionUser,
  repository: SourceRegistrySettingsRepository = sourceRegistrySettingsRepository
) {
  assertManageSourceRegistry(user);
  const parsed = sourceRegistryEntryInputSchema.parse(input);
  const timestamp = now();
  const existing = (await repository.listEntries()).find((entry) => entry.domain === parsed.domain);
  const entry: ManagedSourceRegistryEntry = {
    ...parsed,
    domain: normalizeDomain(parsed.domain),
    id: existing?.id ?? createId("source-registry"),
    enabled: parsed.enabled,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdBy: existing?.createdBy ?? user.id,
    updatedBy: user.id
  };

  return repository.upsertEntry(entry);
}

export async function setSourceRegistryEntryEnabled(
  entryId: string,
  enabled: boolean,
  user: PermissionUser,
  repository: SourceRegistrySettingsRepository = sourceRegistrySettingsRepository
) {
  assertManageSourceRegistry(user);

  return repository.setEntryEnabled(entryId, enabled, user.id, now());
}
