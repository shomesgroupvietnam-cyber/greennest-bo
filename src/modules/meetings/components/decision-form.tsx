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
        <h2 className="text-base font-semibold text-slate-950">Thêm quyết định/action item</h2>
        <p className="mt-1 text-sm text-slate-600">Action item có người phụ trách và deadline có thể chuyển thành công việc.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="decisionText">
          Nội dung <span className="text-red-600">*</span>
        </label>
        <textarea className={fieldClass} id="decisionText" name="decisionText" required rows={3} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="ownerId">
            Người phụ trách
          </label>
          <input className={fieldClass} id="ownerId" name="ownerId" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="dueDate">
            Hạn xử lý
          </label>
          <input className={fieldClass} id="dueDate" name="dueDate" type="date" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Trạng thái
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
      <Button type="submit">Thêm action item</Button>
    </form>
  );
}
