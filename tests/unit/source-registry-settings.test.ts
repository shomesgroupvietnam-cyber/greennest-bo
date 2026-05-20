import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAllowedSourceUrlInRegistry } from "@/modules/knowledge/services/source-registry";
import { JsonSourceRegistrySettingsRepository } from "@/modules/settings/services/source-registry-settings-repository";
import {
  listActiveSourceRegistryEntries,
  listSourceRegistryEntries,
  setSourceRegistryEntryEnabled,
  upsertSourceRegistryEntry
} from "@/modules/settings/services/source-registry-settings-service";

let tempDir: string;
let repository: JsonSourceRegistrySettingsRepository;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-source-registry-"));
  repository = new JsonSourceRegistrySettingsRepository(path.join(tempDir, "source-registry-settings.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("source registry settings", () => {
  it("loads default source registry entries for BO settings", async () => {
    const entries = await listSourceRegistryEntries(repository);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.domain === "chinhphu.vn" && entry.enabled)).toBe(true);
  });

  it("allows settings manager to add and disable a source", async () => {
    const admin = { id: "super-admin", role: "super_admin" } as const;
    const entry = await upsertSourceRegistryEntry(
      {
        domain: "https://www.example-gov.vn/path",
        sourceCategory: "government",
        module: "legal",
        sourceType: "law",
        confidence: "official",
        tags: ["phap-ly"],
        notes: "Nguon test."
      },
      admin,
      repository
    );

    expect(entry.domain).toBe("example-gov.vn");
    expect(entry.enabled).toBe(true);
    expect(isAllowedSourceUrlInRegistry("https://sub.example-gov.vn/demo", await listActiveSourceRegistryEntries(repository))).toBe(true);

    await setSourceRegistryEntryEnabled(entry.id, false, admin, repository);

    expect(isAllowedSourceUrlInRegistry("https://example-gov.vn/demo", await listActiveSourceRegistryEntries(repository))).toBe(false);
  });

  it("blocks users without settings/source registry permission", async () => {
    await expect(
      upsertSourceRegistryEntry(
        {
          domain: "blocked.vn",
          sourceCategory: "reference",
          module: "general",
          sourceType: "internal_note",
          confidence: "external_reference",
          tags: []
        },
        { id: "viewer", role: "viewer" },
        repository
      )
    ).rejects.toThrow(/source registry/);
  });
});
