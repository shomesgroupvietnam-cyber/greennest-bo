import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import type { PermissionUser } from "@/lib/permissions/can";
import type { Project, ProjectListFilters } from "@/modules/projects/types";
import {
  HISTORY_ARCHIVE_EVENT_TYPES,
  HISTORY_ARCHIVE_MODULES,
  HISTORY_ARCHIVE_SEVERITIES,
  type HistoryArchiveCenterData,
  type HistoryArchiveEntityOption,
  type HistoryArchiveEventType,
  type HistoryArchiveFilters,
  type HistoryArchiveModule,
  type HistoryArchiveSelectOption,
  type HistoryArchiveSeverity,
} from "@/modules/reports/types";
import {
  getHistoryArchiveData,
  type HistoryArchiveServiceDependencies,
} from "@/modules/reports/services/history-archive-service";

export type HistoryArchiveCenterServiceOptions =
  HistoryArchiveServiceDependencies & {
    preservedParams?: Record<string, string>;
  };

const moduleLabels: Record<HistoryArchiveModule, string> = {
  approvals: "Approvals",
  audit: "Audit",
  decisions: "Decisions",
  documents: "Documents",
  knowledge: "Knowledge",
  meetings: "Meetings",
  reports: "Reports",
};

const typeLabels: Record<HistoryArchiveEventType, string> = {
  approval: "Approval",
  assignment: "Assignment",
  audit: "Audit",
  decision: "Decision",
  document_version: "Document version",
  meeting: "Meeting",
  search: "Search",
};

const severityLabels: Record<HistoryArchiveSeverity, string> = {
  critical: "Critical",
  info: "Info",
  warning: "Warning",
};

function selectOption<TValue extends string>(
  value: TValue,
  label: string,
): HistoryArchiveSelectOption<TValue> {
  return { label, value };
}

function sortByLabel<TOption extends { label: string }>(options: TOption[]) {
  return [...options].sort((left, right) =>
    left.label.localeCompare(right.label, "vi"),
  );
}

async function loadOrEmpty<T>(loader: () => Promise<T[]>) {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function projectLabel(project: Project) {
  return [project.code, project.name].filter(Boolean).join(" - ");
}

function entityOptions(values: Array<string | undefined>): HistoryArchiveEntityOption[] {
  const ids = [...new Set(values.filter((value): value is string => Boolean(value)))];

  return ids.sort((left, right) => left.localeCompare(right, "vi")).map((id) => ({
    id,
    label: id,
  }));
}

export async function getHistoryArchiveCenterData(
  user: PermissionUser,
  filters: HistoryArchiveFilters = {},
  options: HistoryArchiveCenterServiceOptions = {},
): Promise<HistoryArchiveCenterData> {
  const archive = await getHistoryArchiveData(user, filters, options);
  const projectLoader =
    options.projectLoader ??
    ((projectUser: PermissionUser, projectFilters?: ProjectListFilters) =>
      listScopedProjects(projectUser, projectFilters));
  const projects = archive.permissions.canView
    ? await loadOrEmpty(() => projectLoader(user))
    : [];

  return {
    archive,
    filterOptions: {
      actors: entityOptions(archive.items.map((item) => item.actorId)),
      modules: HISTORY_ARCHIVE_MODULES.map((module) =>
        selectOption(module, moduleLabels[module]),
      ),
      projects: sortByLabel(
        projects.map((project) => ({
          id: project.id,
          label: projectLabel(project),
        })),
      ),
      severities: HISTORY_ARCHIVE_SEVERITIES.map((severity) =>
        selectOption(severity, severityLabels[severity]),
      ),
      statuses: [
        ...new Set(archive.items.map((item) => item.status).filter((value): value is string => Boolean(value))),
      ].sort((left, right) => left.localeCompare(right, "vi")),
      types: HISTORY_ARCHIVE_EVENT_TYPES.map((type) =>
        selectOption(type, typeLabels[type]),
      ),
    },
    preservedParams: options.preservedParams,
  };
}
