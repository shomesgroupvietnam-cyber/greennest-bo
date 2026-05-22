import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_CANDIDATE_SOURCE_TYPES,
  KNOWLEDGE_MODULES
} from "@/modules/knowledge/types";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function KnowledgeCandidateForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={action} className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        Candidate chỉ là đề xuất tri thức. Nội dung này không được đưa vào RAG cho đến khi được promote thành Knowledge Item,
        review, duyệt và index.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            Tiêu đề candidate <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sourceType">
            Nguồn phát sinh <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue="manual" id="sourceType" name="sourceType" required>
            {Object.entries(KNOWLEDGE_CANDIDATE_SOURCE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="module">
            Module <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue="general" id="module" name="module" required>
            {Object.entries(KNOWLEDGE_MODULES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sourceRefId">
            Mã tham chiếu nguồn
          </label>
          <input className={fieldClass} id="sourceRefId" name="sourceRefId" placeholder="ID chat, meeting, report, document hoặc upload nếu có" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="extractedText">
            Nội dung trích xuất <span className="text-red-600">*</span>
          </label>
          <textarea className={`${fieldClass} min-h-36`} id="extractedText" name="extractedText" required />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="notes">
            Ghi chú
          </label>
          <textarea className={`${fieldClass} min-h-20`} id="notes" name="notes" />
        </div>
      </div>

      <Button type="submit">Tạo Knowledge Candidate</Button>
    </form>
  );
}
