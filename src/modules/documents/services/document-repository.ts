import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import { DEFAULT_DOCUMENT_CLASSIFICATION } from "@/modules/documents/constants";
import type { Document, DocumentListFilters, DocumentVersion } from "@/modules/documents/types";

type DocumentStore = {
  documents: Document[];
  documentVersions: DocumentVersion[];
};

const emptyStore: DocumentStore = {
  documents: [],
  documentVersions: []
};

export type DocumentRepository = {
  listDocuments(filters?: DocumentListFilters): Promise<Document[]>;
  getDocument(documentId: string): Promise<Document | undefined>;
  listDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  createDocument(document: Document): Promise<Document>;
  updateDocument(documentId: string, patch: Partial<Document>): Promise<Document>;
};

export class JsonDocumentRepository implements DocumentRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "document-center.json")) {}

  async listDocuments(filters: DocumentListFilters = {}) {
    const store = await this.readStore();

    return store.documents
      .filter((document) => !filters.projectId || filters.projectId === "all" || document.projectId === filters.projectId)
      .filter((document) => !filters.docType || filters.docType === "all" || document.docType === filters.docType)
      .filter(
        (document) =>
          !filters.classification ||
          filters.classification === "all" ||
          document.classification === filters.classification,
      )
      .filter((document) => !filters.status || filters.status === "all" || document.status === filters.status)
      .filter((document) => !filters.ownerId || filters.ownerId === "all" || document.ownerId === filters.ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getDocument(documentId: string) {
    const store = await this.readStore();

    return store.documents.find((document) => document.id === documentId);
  }

  async listDocumentVersions(documentId: string) {
    const store = await this.readStore();
    const versions = store.documentVersions
      .filter((version) => version.documentId === documentId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

    if (versions.length > 0) {
      return versions;
    }

    const document = store.documents.find((item) => item.id === documentId);

    return document ? [documentToVersion(document)] : [];
  }

  async createDocument(document: Document) {
    const store = await this.readStore();
    await this.writeStore({
      documents: [document, ...store.documents],
      documentVersions: [documentToVersion(document), ...store.documentVersions]
    });

    return document;
  }

  async updateDocument(documentId: string, patch: Partial<Document>) {
    const store = await this.readStore();
    const existingDocument = store.documents.find((document) => document.id === documentId);

    if (!existingDocument) {
      throw new Error("Không tìm thấy hồ sơ.");
    }

    const updatedDocument = {
      ...existingDocument,
      ...patch,
      id: existingDocument.id,
      createdAt: existingDocument.createdAt
    };

    const shouldAppendVersion =
      patch.version !== undefined || patch.fileUrl !== undefined || patch.externalUrl !== undefined || patch.status !== undefined;

    await this.writeStore({
      documents: store.documents.map((document) => (document.id === documentId ? updatedDocument : document)),
      documentVersions: shouldAppendVersion ? [documentToVersion(updatedDocument), ...store.documentVersions] : store.documentVersions
    });

    return updatedDocument;
  }

  private async readStore(): Promise<DocumentStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<DocumentStore>;

      return {
        documents: (parsed.documents ?? []).map(normalizeDocument),
        documentVersions: parsed.documentVersions ?? []
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: DocumentStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

function normalizeDocument(document: Document): Document {
  return {
    ...document,
    classification: document.classification ?? DEFAULT_DOCUMENT_CLASSIFICATION,
    approvalStatus: document.approvalStatus ?? (document.status === "complete" ? "approved" : "not_submitted")
  };
}

function documentToVersion(document: Document): DocumentVersion {
  return {
    id: crypto.randomUUID(),
    documentId: document.id,
    version: document.version,
    fileUrl: document.fileUrl,
    externalUrl: document.externalUrl,
    uploadedBy: document.ownerId,
    uploadedAt: document.updatedAt,
    notes: `Trạng thái: ${document.status}; phê duyệt: ${document.approvalStatus}`
  };
}

type DocumentRow = {
  id: string;
  project_id: string;
  title: string;
  doc_type: string;
  classification: Document["classification"] | null;
  file_url: string | null;
  external_url: string | null;
  version: string;
  status: Document["status"];
  owner_id: string | null;
  approval_status: Document["approvalStatus"] | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  approval_notes: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentVersionRow = {
  id: string;
  document_id: string;
  version: string;
  file_url: string | null;
  external_url: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
};

function toDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    docType: row.doc_type,
    classification: row.classification ?? DEFAULT_DOCUMENT_CLASSIFICATION,
    fileUrl: row.file_url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    version: row.version,
    status: row.status,
    ownerId: row.owner_id ?? undefined,
    approvalStatus: row.approval_status ?? (row.status === "complete" ? "approved" : "not_submitted"),
    reviewerId: row.reviewer_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    approvalNotes: row.approval_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toDocumentVersion(row: DocumentVersionRow): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    version: row.version,
    fileUrl: row.file_url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    uploadedBy: row.uploaded_by ?? undefined,
    uploadedAt: row.uploaded_at,
    notes: row.notes ?? undefined
  };
}

function documentToRow(document: Document) {
  return {
    id: document.id,
    project_id: document.projectId,
    title: document.title,
    doc_type: document.docType,
    classification: document.classification ?? DEFAULT_DOCUMENT_CLASSIFICATION,
    file_url: document.fileUrl ?? null,
    external_url: document.externalUrl ?? null,
    version: document.version,
    status: document.status,
    owner_id: document.ownerId ?? null,
    approval_status: document.approvalStatus,
    reviewer_id: document.reviewerId ?? null,
    reviewed_at: document.reviewedAt ?? null,
    approval_notes: document.approvalNotes ?? null,
    created_at: document.createdAt,
    updated_at: document.updatedAt
  };
}

function documentPatchToRow(patch: Partial<Document>) {
  return {
    ...(patch.projectId !== undefined ? { project_id: patch.projectId } : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.docType !== undefined ? { doc_type: patch.docType } : {}),
    ...(patch.classification !== undefined ? { classification: patch.classification } : {}),
    ...(patch.fileUrl !== undefined ? { file_url: patch.fileUrl ?? null } : {}),
    ...(patch.externalUrl !== undefined ? { external_url: patch.externalUrl ?? null } : {}),
    ...(patch.version !== undefined ? { version: patch.version } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.ownerId !== undefined ? { owner_id: patch.ownerId ?? null } : {}),
    ...(patch.approvalStatus !== undefined ? { approval_status: patch.approvalStatus } : {}),
    ...(patch.reviewerId !== undefined ? { reviewer_id: patch.reviewerId ?? null } : {}),
    ...(patch.reviewedAt !== undefined ? { reviewed_at: patch.reviewedAt ?? null } : {}),
    ...(patch.approvalNotes !== undefined ? { approval_notes: patch.approvalNotes ?? null } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {})
  };
}

export class SupabaseDocumentRepository implements DocumentRepository {
  async listDocuments(filters: DocumentListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("documents").select("*").is("archived_at", null);

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.docType && filters.docType !== "all") {
      query = query.eq("doc_type", filters.docType);
    }

    if (filters.classification && filters.classification !== "all") {
      query = query.eq("classification", filters.classification);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.ownerId && filters.ownerId !== "all") {
      query = query.eq("owner_id", filters.ownerId);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DocumentRow[]).map(toDocument);
  }

  async getDocument(documentId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("documents").select("*").eq("id", documentId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toDocument(data as DocumentRow) : undefined;
  }

  async listDocumentVersions(documentId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DocumentVersionRow[]).map(toDocumentVersion);
  }

  async createDocument(document: Document) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("documents").insert(documentToRow(document)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    const createdDocument = toDocument(data as DocumentRow);
    const { data: versionData, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: createdDocument.id,
        version: createdDocument.version,
        file_url: createdDocument.fileUrl ?? null,
        external_url: createdDocument.externalUrl ?? null,
        uploaded_by: createdDocument.ownerId ?? null,
        uploaded_at: createdDocument.createdAt,
        notes: `Trạng thái: ${createdDocument.status}; phê duyệt: ${createdDocument.approvalStatus}`
      })
      .select("id")
      .single();

    if (versionError) {
      throw new Error(versionError.message);
    }

    await supabase.from("documents").update({ current_version_id: (versionData as { id: string }).id }).eq("id", createdDocument.id);

    return createdDocument;
  }

  async updateDocument(documentId: string, patch: Partial<Document>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("documents").update(documentPatchToRow(patch)).eq("id", documentId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    const updatedDocument = toDocument(data as DocumentRow);

    if (patch.version !== undefined || patch.fileUrl !== undefined || patch.externalUrl !== undefined) {
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: updatedDocument.id,
          version: updatedDocument.version,
          file_url: updatedDocument.fileUrl ?? null,
        external_url: updatedDocument.externalUrl ?? null,
        uploaded_by: updatedDocument.ownerId ?? null,
        uploaded_at: updatedDocument.updatedAt,
        notes: `Trạng thái: ${updatedDocument.status}; phê duyệt: ${updatedDocument.approvalStatus}`
      })
        .select("id")
        .single();

      if (versionError) {
        throw new Error(versionError.message);
      }

      await supabase.from("documents").update({ current_version_id: (versionData as { id: string }).id }).eq("id", updatedDocument.id);
    }

    return updatedDocument;
  }
}

export const jsonDocumentRepository = new JsonDocumentRepository();
export const supabaseDocumentRepository = new SupabaseDocumentRepository();
export const documentRepository = selectRepository<DocumentRepository>({
  mock: jsonDocumentRepository,
  supabase: supabaseDocumentRepository
});
