export const PROJECT_DOCUMENTS_BUCKET = "project-documents";

export type ProjectDocumentObjectPathInput = {
  projectId: string;
  documentId: string;
  version: string;
  fileName: string;
};

function sanitizeSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildProjectDocumentObjectPath({ projectId, documentId, version, fileName }: ProjectDocumentObjectPathInput) {
  const cleanVersion = sanitizeSegment(version).replace(/^v/i, "");
  const cleanFileName = sanitizeSegment(fileName);

  return `projects/${projectId}/documents/${documentId}/v${cleanVersion}/${cleanFileName}`;
}

export function assertStorageUploadNotImplemented(): never {
  throw new Error("Supabase Storage upload chưa được triển khai trong Sprint này. Hiện tại chỉ lưu metadata và external URL.");
}
