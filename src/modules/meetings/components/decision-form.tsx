import { Button } from "@/components/ui/button";
import { DECISION_STATUSES } from "@/constants/statuses";

type DecisionFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function DecisionForm({ action }: DecisionFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">ThÃªm quyáº¿t Ä‘á»‹nh/action item</h2>
        <p className="mt-1 text-sm text-slate-600">Action item cÃ³ ngÆ°á»i phá»¥ trÃ¡ch vÃ  deadline cÃ³ thá»ƒ chuyá»ƒn thÃ nh cÃ´ng viá»‡c.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="decisionText">
          Ná»™i dung <span className="text-red-600">*</span>
        </label>
        <textarea className={fieldClass} id="decisionText" name="decisionText" required rows={3} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="ownerId">
            NgÆ°á»i phá»¥ trÃ¡ch
          </label>
          <input className={fieldClass} id="ownerId" name="ownerId" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="dueDate">
            Háº¡n xá»­ lÃ½
          </label>
          <input className={fieldClass} id="dueDate" name="dueDate" type="date" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Tráº¡ng thÃ¡i
          </label>
          <select className={fieldClass} defaultValue="open" id="status" name="status">
            {Object.entries(DECISION_STATUSES).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit">ThÃªm action item</Button>
    </form>
  );
}
