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
        Candidate chá»‰ lÃ  Ä‘á» xuáº¥t tri thá»©c. Ná»™i dung nÃ y khÃ´ng Ä‘Æ°á»£c Ä‘Æ°a vÃ o RAG cho Ä‘áº¿n khi Ä‘Æ°á»£c promote thÃ nh Knowledge Item,
        review, duyá»‡t vÃ  index.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            TiÃªu Ä‘á» candidate <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="sourceType">
            Nguá»“n phÃ¡t sinh <span className="text-red-600">*</span>
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
            MÃ£ tham chiáº¿u nguá»“n
          </label>
          <input className={fieldClass} id="sourceRefId" name="sourceRefId" placeholder="ID chat, meeting, report, document hoáº·c upload náº¿u cÃ³" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="extractedText">
            Ná»™i dung trÃ­ch xuáº¥t <span className="text-red-600">*</span>
          </label>
          <textarea className={`${fieldClass} min-h-36`} id="extractedText" name="extractedText" required />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="notes">
            Ghi chÃº
          </label>
          <textarea className={`${fieldClass} min-h-20`} id="notes" name="notes" />
        </div>
      </div>

      <Button type="submit">Táº¡o Knowledge Candidate</Button>
    </form>
  );
}
