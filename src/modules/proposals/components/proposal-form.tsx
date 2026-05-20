import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { PROPOSAL_PRIORITIES, PROPOSAL_TYPES } from "@/modules/proposals/types";

type ProposalFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  projects: Project[];
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function ProposalForm({ action, projects }: ProposalFormProps) {
  return (
    <form action={action} className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Tên đề xuất <span className="text-red-600">*</span>
          <input className={fieldClass} name="title" placeholder="VD: Đề xuất phê duyệt hồ sơ thanh toán đợt 1" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Loại đề xuất
          <select className={fieldClass} name="type" defaultValue="general">
            {Object.entries(PROPOSAL_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Dự án liên quan
          <select className={fieldClass} name="projectId" defaultValue="">
            <option value="">Không gắn dự án</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Mức ưu tiên
          <select className={fieldClass} name="priority" defaultValue="normal">
            {Object.entries(PROPOSAL_PRIORITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Giá trị nếu có
          <input className={fieldClass} name="amount" min="0" type="number" placeholder="VD: 500000000" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Hạn xử lý
          <input className={fieldClass} name="dueDate" type="date" />
        </label>
      </div>
      <label className="space-y-2 text-sm font-medium text-slate-700">
        Nội dung tóm tắt
        <textarea className={`${fieldClass} min-h-28`} name="summary" placeholder="Nêu lý do, căn cứ, hồ sơ liên quan và mong muốn phê duyệt." />
      </label>
      <input type="hidden" name="module" value="proposal" />
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Tạo đề xuất</Button>
        <Button asChild variant="outline">
          <Link href="/proposals">Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
