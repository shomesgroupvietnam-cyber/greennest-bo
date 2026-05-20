import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PROJECT_STATUSES } from "@/constants/statuses";
import type { Project } from "@/modules/projects/types";

type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  project?: Project;
  submitLabel: string;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function ProjectForm({ action, project, submitLabel }: ProjectFormProps) {
  return (
    <form action={action} className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        Các trường có dấu * là bắt buộc. Nếu bỏ trống mã dự án, hệ thống sẽ tự sinh mã duy nhất.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="name">
            Tên dự án <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={project?.name} id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="code">
            Mã dự án
          </label>
          <input className={fieldClass} defaultValue={project?.code} id="code" name="code" placeholder="Tự sinh nếu bỏ trống" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="location">
            Địa điểm
          </label>
          <input className={fieldClass} defaultValue={project?.location} id="location" name="location" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="area">
            Diện tích
          </label>
          <input className={fieldClass} defaultValue={project?.area} id="area" min="0" name="area" placeholder="m2" step="0.01" type="number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="projectType">
            Loại hình
          </label>
          <input className={fieldClass} defaultValue={project?.projectType} id="projectType" name="projectType" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="investor">
            Chủ đầu tư
          </label>
          <input className={fieldClass} defaultValue={project?.investor} id="investor" name="investor" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="ownerName">
            Người phụ trách
          </label>
          <input className={fieldClass} defaultValue={project?.ownerName} id="ownerName" name="ownerName" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Trạng thái <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={project?.status ?? "planning"} id="status" name="status" required>
            {Object.entries(PROJECT_STATUSES)
              .filter(([status]) => status !== "archived" || project?.status === "archived")
              .map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button asChild type="button" variant="outline">
          <Link href={project ? `/projects/${project.id}` : "/projects"}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
