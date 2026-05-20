import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEFAULT_LEGAL_STEPS } from "@/constants/legal-steps";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/constants/statuses";
import type { Project } from "@/modules/projects/types";
import { MOCK_CURRENT_USER_ID } from "@/modules/tasks/constants";
import type { Task } from "@/modules/tasks/types";

type TaskFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultProjectId?: string;
  projects: Project[];
  submitLabel: string;
  task?: Task;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const phaseOneTaskGuidance = DEFAULT_LEGAL_STEPS.map((step, index) => ({
  ...step,
  dependency: index === 0 ? "Bắt đầu sau khi mở dự án" : `Chỉ bắt đầu khi bước ${index} hoàn tất`
}));

export function TaskForm({ action, defaultProjectId, projects, submitLabel, task }: TaskFormProps) {
  const selectedProjectId = task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "";
  const isCreating = !task;

  return (
    <form action={action} className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        Mỗi công việc phải gắn với một dự án. Deadline và người phụ trách giúp dashboard nhận diện việc quá hạn, sắp đến hạn và việc của tôi.
      </p>

      {isCreating ? (
        <section className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Hướng dẫn thêm công việc Phase 1 theo tiến độ</h2>
              <p className="mt-2 text-sm text-slate-700">
                Tạo mỗi bước nghiệp vụ thành một công việc riêng. Đặt deadline tăng dần theo thứ tự, chọn nhóm công việc{" "}
                <span className="font-medium">Phase 1 - pháp lý đầu tư</span>, và ghi rõ phụ thuộc ở mô tả để đội dự án biết
                việc nào chỉ được mở sau khi bước trước hoàn tất.
              </p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <div className="rounded-md bg-white/80 p-3">
                  <p className="font-medium text-slate-900">Tên công việc</p>
                  <p className="mt-1">Dùng mẫu: 01. Khảo sát quỹ đất.</p>
                </div>
                <div className="rounded-md bg-white/80 p-3">
                  <p className="font-medium text-slate-900">Mô tả</p>
                  <p className="mt-1">Ghi phụ thuộc theo mã bước và điều kiện bàn giao.</p>
                </div>
                <div className="rounded-md bg-white/80 p-3">
                  <p className="font-medium text-slate-900">Deadline</p>
                  <p className="mt-1">Không đặt bước sau sớm hơn bước trước.</p>
                </div>
                <div className="rounded-md bg-white/80 p-3">
                  <p className="font-medium text-slate-900">Trạng thái</p>
                  <p className="mt-1">Bước chưa đủ điều kiện nên để Chưa làm.</p>
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-white">
              <div className="grid grid-cols-[52px_minmax(0,1fr)] border-b px-3 py-2 text-xs font-medium uppercase text-slate-500">
                <span>STT</span>
                <span>Bước nghiệp vụ</span>
              </div>
              <ol className="max-h-96 divide-y overflow-auto">
                {phaseOneTaskGuidance.map((step, index) => (
                  <li className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 px-3 py-2 text-sm" key={step.code}>
                    <span className="font-medium text-slate-500">{index + 1}</span>
                    <span>
                      <span className="block font-medium text-slate-950">{step.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{step.dependency}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            Tên công việc <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={task?.title} id="title" name="title" required />
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
          <label className="text-sm font-medium text-slate-800" htmlFor="assigneeId">
            Người phụ trách
          </label>
          <input className={fieldClass} defaultValue={task?.assigneeId ?? MOCK_CURRENT_USER_ID} id="assigneeId" name="assigneeId" placeholder={MOCK_CURRENT_USER_ID} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="dueDate">
            Deadline
          </label>
          <input className={fieldClass} defaultValue={task?.dueDate} id="dueDate" name="dueDate" type="date" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="category">
            Nhóm công việc
          </label>
          <input className={fieldClass} defaultValue={task?.category} id="category" name="category" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="status">
            Trạng thái <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={task?.status ?? "todo"} id="status" name="status" required>
            {Object.entries(TASK_STATUSES).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="priority">
            Ưu tiên <span className="text-red-600">*</span>
          </label>
          <select className={fieldClass} defaultValue={task?.priority ?? "medium"} id="priority" name="priority" required>
            {Object.entries(TASK_PRIORITIES).map(([priority, label]) => (
              <option key={priority} value={priority}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="description">
            Mô tả
          </label>
          <textarea className={fieldClass} defaultValue={task?.description} id="description" name="description" rows={4} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={projects.length === 0} type="submit">
          {submitLabel}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={task ? `/tasks/${task.id}` : "/tasks"}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
