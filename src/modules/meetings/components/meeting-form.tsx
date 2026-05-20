import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Meeting } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";

type MeetingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultProjectId?: string;
  meeting?: Meeting;
  projects: Project[];
  submitLabel: string;
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function toDateTimeInput(value?: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

export function MeetingForm({ action, defaultProjectId, meeting, projects, submitLabel }: MeetingFormProps) {
  const selectedProjectId = meeting?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "";

  return (
    <form action={action} className="space-y-6 rounded-lg border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="title">
            TiÃªu Ä‘á» cuá»™c há»p <span className="text-red-600">*</span>
          </label>
          <input className={fieldClass} defaultValue={meeting?.title} id="title" name="title" required />
        </div>

        {!meeting ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="projectId">
              Dá»± Ã¡n <span className="text-red-600">*</span>
            </label>
            <select className={fieldClass} defaultValue={selectedProjectId} id="projectId" name="projectId" required>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="meetingDate">
            Thá»i gian há»p <span className="text-red-600">*</span>
          </label>
          <input
            className={fieldClass}
            defaultValue={toDateTimeInput(meeting?.meetingDate)}
            id="meetingDate"
            name="meetingDate"
            required
            type="datetime-local"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="summary">
            Tá»‘m táº¯t/biÃªn báº£n
          </label>
          <textarea className={fieldClass} defaultValue={meeting?.summary} id="summary" name="summary" rows={8} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={projects.length === 0} type="submit">
          {submitLabel}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href={meeting ? `/meetings/${meeting.id}` : "/meetings"}>Há»§y</Link>
        </Button>
      </div>
    </form>
  );
}
