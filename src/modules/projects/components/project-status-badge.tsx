import { PROJECT_STATUSES, type ProjectStatus } from "@/constants/statuses";
import { cn } from "@/lib/utils";

const statusClasses: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  archived: "bg-zinc-100 text-zinc-600"
};

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", statusClasses[status])}>
      {PROJECT_STATUSES[status]}
    </span>
  );
}
