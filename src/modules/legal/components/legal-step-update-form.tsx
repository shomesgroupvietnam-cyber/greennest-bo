import { Button } from "@/components/ui/button";
import { LEGAL_STATUSES } from "@/constants/statuses";
import type { Document } from "@/modules/documents/types";
import type { LegalStep } from "@/modules/legal/types";

type LegalStepUpdateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  documents: Document[];
  step: LegalStep;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function LegalStepUpdateForm({ action, documents, step }: LegalStepUpdateFormProps) {
  const relatedDocumentIds = new Set(step.relatedDocumentIds ?? []);

  return (
    <form action={action} className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor={`status-${step.id}`}>
          Trạng thái <span className="text-red-600">*</span>
        </label>
        <select className={fieldClass} defaultValue={step.status} id={`status-${step.id}`} name="status" required>
          {Object.entries(LEGAL_STATUSES).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor={`assignee-${step.id}`}>
          Người phụ trách
        </label>
        <input className={fieldClass} defaultValue={step.assigneeId} id={`assignee-${step.id}`} name="assigneeId" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor={`dueDate-${step.id}`}>
          Deadline
        </label>
        <input className={fieldClass} defaultValue={step.dueDate} id={`dueDate-${step.id}`} name="dueDate" type="date" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor={`completedDate-${step.id}`}>
          Ngày hoàn thành
        </label>
        <input
          className={fieldClass}
          defaultValue={step.completedDate}
          id={`completedDate-${step.id}`}
          name="completedDate"
          type="date"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-slate-800" htmlFor={`relatedDocumentIds-${step.id}`}>
          Hồ sơ liên quan
        </label>
        <select
          className={fieldClass}
          defaultValue={[...relatedDocumentIds]}
          id={`relatedDocumentIds-${step.id}`}
          multiple
          name="relatedDocumentIds"
          size={Math.min(Math.max(documents.length, 3), 6)}
        >
          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.title} - {document.version}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">Giữ Ctrl hoặc Cmd để chọn nhiều hồ sơ.</p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-slate-800" htmlFor={`notes-${step.id}`}>
          Ghi chú
        </label>
        <textarea className={fieldClass} defaultValue={step.notes} id={`notes-${step.id}`} name="notes" rows={3} />
        <p className="text-xs text-slate-500">Bắt buộc khi trạng thái là Bị vướng.</p>
      </div>

      <div className="md:col-span-2">
        <Button type="submit">Lưu bước pháp lý</Button>
      </div>
    </form>
  );
}

