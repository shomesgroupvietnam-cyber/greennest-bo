import type { ManagedSourceRegistryEntry, SourceRegistryEntry } from "@/modules/knowledge/types";

export const SOURCE_REGISTRY: readonly SourceRegistryEntry[] = [
  {
    domain: "chinhphu.vn",
    sourceCategory: "government",
    module: "legal",
    sourceType: "law",
    confidence: "official",
    tags: ["phap-ly", "chinh-phu"]
  },
  {
    domain: "moc.gov.vn",
    sourceCategory: "government",
    module: "construction",
    sourceType: "standard",
    confidence: "official",
    tags: ["xay-dung", "quy-chuan"]
  },
  {
    domain: "monre.gov.vn",
    sourceCategory: "government",
    module: "legal",
    sourceType: "law",
    confidence: "official",
    tags: ["dat-dai", "moi-truong"]
  },
  {
    domain: "greennest.local",
    sourceCategory: "internal",
    module: "documents",
    sourceType: "policy",
    confidence: "internal_approved",
    tags: ["noi-bo"]
  },
  {
    domain: "example.com",
    sourceCategory: "reference",
    module: "general",
    sourceType: "internal_note",
    confidence: "external_reference",
    tags: ["demo"]
  }
] as const;

export function createDefaultManagedSourceRegistry(): ManagedSourceRegistryEntry[] {
  const timestamp = new Date(0).toISOString();

  return SOURCE_REGISTRY.map((entry, index) => ({
    ...entry,
    id: `source-registry-default-${index + 1}`,
    enabled: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    notes: "Default source registry seed."
  }));
}

export function normalizeSourceHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.searchParams.sort();

    if (parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }

    return parsed.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function findSourceRegistryEntryInRegistry(url: string, registry: readonly SourceRegistryEntry[]) {
  const hostname = normalizeSourceHostname(url);

  return registry.find((entry) => hostname === entry.domain || hostname.endsWith(`.${entry.domain}`));
}

export function findSourceRegistryEntry(url: string) {
  return findSourceRegistryEntryInRegistry(url, SOURCE_REGISTRY);
}

export function isAllowedSourceUrlInRegistry(url: string, registry: readonly SourceRegistryEntry[]) {
  return Boolean(findSourceRegistryEntryInRegistry(url, registry));
}

export function isAllowedSourceUrl(url: string) {
  return Boolean(findSourceRegistryEntry(url));
}
