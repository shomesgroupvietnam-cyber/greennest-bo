import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DOCUMENT_STATUSES } from "@/constants/statuses";
import {
  DEFAULT_DOCUMENT_CLASSIFICATION,
  DEFAULT_DOCUMENT_OWNER_ID,
  DOCUMENT_CLASSIFICATION_LABELS,
  DOCUMENT_TYPES,
} from "@/modules/documents/constants";
import type { Document } from "@/modules/documents/types";
import type { Project } from "@/modules/projects/types";

type DocumentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultProjectId?: string;
  document?: Document;
  projects: Project[];
  submitLabel: string;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function DocumentForm({ action, defaultProjectId, document, projects, submitLabel }: DocumentFormProps) {
  const selectedProjectId = document?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "";

  return (
    <form action={action} className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        Sprint hiện tại hỗ trợ hồ sơ bằng External URL. Tải file lên Supabase Storage đang là placeholder cho sprint sau.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            Tên hồ sơ <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={document?.title} id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="projectId">
            Dự án <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={selectedProjectId} id="projectId" name="projectId" required>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="docType">
            Loại hồ sơ <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={document?.docType ?? "legal_submission"} id="docType" name="docType" required>
            {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="classification">
            Phân loại bảo mật <span className="text-red-600">*</span>
          </label>
          <select
            className={fieldClass}
            defaultValue={document?.classification ?? DEFAULT_DOCUMENT_CLASSIFICATION}
            id="classification"
            name="classification"
            required
          >
            {Object.entries(DOCUMENT_CLASSIFICATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="version">
            Phiên bản <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={document?.version ?? "v1"} id="version" name="version" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Trạng thái <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={document?.status ?? "draft"} id="status" name="status" required>
            {Object.entries(DOCUMENT_STATUSES).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="ownerId">
            Người phụ trách
          </label>
          <input className={fieldClass} defaultValue={document?.ownerId ?? DEFAULT_DOCUMENT_OWNER_ID} id="ownerId" name="ownerId" placeholder={DEFAULT_DOCUMENT_OWNER_ID} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="externalUrl">
            External URL
          </label>
          <input className={fieldClass} defaultValue={document?.externalUrl} id="externalUrl" name="externalUrl" placeholder="https://..." type="url" />
          <p className="text-xs text-slate-500">Dùng cho hồ sơ đang lưu ở Google Drive, OneDrive hoặc nguồn ngoài.</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="fileUploadPlaceholder">
            Tải file lên
          </label>
          <input
            className="w-full cursor-not-allowed rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            disabled
            id="fileUploadPlaceholder"
            type="file"
          />
          <p className="text-xs text-slate-500">Supabase Storage sẽ được triển khai ở sprint sau. Hiện tại dùng External URL.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={projects.length === 0} type="submit">
          {submitLabel}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={document ? `/documents/${document.id}` : "/documents"}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
