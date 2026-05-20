import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { REPORT_TYPES } from "@/modules/reports/types";

type ReportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  projects: Project[];
  defaultProjectId?: string;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function ReportForm({ action, projects, defaultProjectId }: ReportFormProps) {
  return (
    <form action={action} className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="projectId">
            Dự án <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={defaultProjectId ?? projects[0]?.id ?? ""} id="projectId" name="projectId" required>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="reportType">
            Loại báo cáo <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue="weekly_project_summary" id="reportType" name="reportType" required>
            {Object.entries(REPORT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        Báo cáo được tạo thành snapshot tại thời điểm bấm tạo. Sau đó dữ liệu task/hồ sơ/pháp lý thay đổi sẽ không tự sửa báo cáo cũ.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={projects.length === 0} type="submit">
          Tạo báo cáo
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/reports">Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
