import React from "react";
import { ExternalLink, RotateCcw, Search } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { HistoryExportSubmitButton } from "@/modules/reports/components/history-export-submit-button";
import type {
  HistoryArchiveCenterData,
  HistoryArchiveEvent,
  HistoryArchiveFilters,
} from "@/modules/reports/types";

const metadataLabels: Record<string, string> = {
  action: "Action",
  approvalLevel: "Approval level",
  assigneeType: "Assignee type",
  changedFields: "Changed fields",
  documentVersion: "Document version",
  priority: "Priority",
  relationType: "Relation",
  resultCount: "Result count",
  stepOrder: "Step",
  version: "Version",
  versionNumber: "Version",
};

const filterLabels: Partial<Record<keyof HistoryArchiveFilters, string>> = {
  actorId: "Actor",
  dateFrom: "From",
  dateTo: "To",
  limit: "Limit",
  module: "Module",
  projectId: "Project",
  query: "Search",
  severity: "Severity",
  status: "Status",
  type: "Type",
};
const sourceCountLabels: Record<HistoryArchiveEvent["type"], string> = {
  approval: "Approval",
  assignment: "Assignment",
  audit: "Audit",
  decision: "Decision",
  document_version: "Document",
  meeting: "Meeting",
  search: "Search",
};
const defaultHistoryLimit = 100;
const historyFilterFormId = "history-archive-filter-form";

function formatDateTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

function formatDateInput(value?: string) {
  return value?.slice(0, 10) ?? "";
}

function isSafeInternalHref(href?: string) {
  return Boolean(href?.startsWith("/") && !href.startsWith("//"));
}

function safeMetadataEntries(event: HistoryArchiveEvent) {
  return Object.entries(event.source.metadata ?? {}).filter(([key, value]) => {
    return (
      Object.hasOwn(metadataLabels, key) &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean")
    );
  });
}

function buildHref(
  preservedParams: Record<string, string>,
  filters: HistoryArchiveFilters,
  removals: Array<keyof HistoryArchiveFilters> = [],
) {
  const params = new URLSearchParams(preservedParams);
  const removed = new Set(removals);

  for (const [key, value] of Object.entries(filters)) {
    if (removed.has(key as keyof HistoryArchiveFilters)) {
      continue;
    }

    if (
      value === undefined ||
      value === "" ||
      value === "all" ||
      (key === "limit" && Number(value) === defaultHistoryLimit)
    ) {
      continue;
    }

    params.set(key, String(value));
  }

  return `/command-center?${params.toString()}`;
}

function activeFilters(
  filters: HistoryArchiveFilters,
  preservedParams: Record<string, string>,
) {
  return (Object.entries(filters) as Array<[keyof HistoryArchiveFilters, unknown]>)
    .filter(([key, value]) => {
      return (
        value !== undefined &&
        value !== "" &&
        value !== "all" &&
        (key !== "limit" || Number(value) !== defaultHistoryLimit)
      );
    })
    .map(([key, value]) => ({
      href: buildHref(preservedParams, filters, [key]),
      key,
      label: filterLabels[key] ?? key,
      value: String(value),
    }));
}

type SelectOption = {
  label: string;
  value: string;
};
const limitOptions: SelectOption[] = [25, 50, 100, 200, 500].map((value) => ({
  label: `${value}`,
  value: `${value}`,
}));

function FilterSelect({
  includeAll = true,
  label,
  name,
  options,
  value,
}: {
  includeAll?: boolean;
  label: string;
  name: string;
  options: SelectOption[];
  value?: string;
}) {
  const mergedOptions = value && value !== "all" && !options.some((option) => option.value === value)
    ? [{ label: value, value }, ...options]
    : options;

  return (
    <label className="min-w-0 text-xs font-semibold uppercase text-slate-500">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal normal-case text-slate-900"
        defaultValue={value ?? "all"}
        name={name}
      >
        {includeAll ? <option value="all">All</option> : null}
        {mergedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function projectOptions(data: HistoryArchiveCenterData): SelectOption[] {
  return data.filterOptions.projects.map((project) => ({
    label: project.label,
    value: project.id,
  }));
}

function actorOptions(data: HistoryArchiveCenterData): SelectOption[] {
  return data.filterOptions.actors.map((actor) => ({
    label: actor.label,
    value: actor.id,
  }));
}

function statusOptions(data: HistoryArchiveCenterData): SelectOption[] {
  return data.filterOptions.statuses.map((status) => ({
    label: status,
    value: status,
  }));
}

function sourceCountsLabel(data: HistoryArchiveCenterData) {
  return Object.entries(data.archive.sourceCounts)
    .filter(([, count]) => Number(count) > 0)
    .map(
      ([type, count]) =>
        `${sourceCountLabels[type as HistoryArchiveEvent["type"]] ?? type}: ${count}`,
    )
    .join(" · ");
}

function HistoryEventItem({ event }: { event: HistoryArchiveEvent }) {
  const metadata = safeMetadataEntries(event);
  const safeHref = isSafeInternalHref(event.href) ? event.href : undefined;
  const sourceLabel = event.source.sourceLabel ?? event.source.sourceId;
  const actorLabel = event.actorId ?? "System";

  return (
    <li className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {formatDateTime(event.occurredAt)} · {event.module} · {event.type}
          </p>
          <h2 className="mt-1 break-words text-base font-semibold text-slate-950">
            {event.summary}
          </h2>
          <p className="mt-1 break-words text-sm text-slate-600">
            Source: {sourceLabel}
          </p>
          <p className="mt-1 break-words text-sm text-slate-600">
            Actor: {actorLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {event.severity ? (
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              {event.severity}
            </span>
          ) : null}
          {event.status ? (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {event.status}
            </span>
          ) : null}
        </div>
      </div>
      {metadata.length > 0 ? (
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          {metadata.map(([key, value]) => (
            <div className="rounded-md bg-slate-50 px-3 py-2" key={key}>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                {metadataLabels[key]}
              </dt>
              <dd className="mt-1 break-words text-slate-800">{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {safeHref ? (
        <Button asChild className="mt-4" size="sm" variant="outline">
          <Link aria-label={`Mo nguon ${sourceLabel}`} href={safeHref}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open source
          </Link>
        </Button>
      ) : null}
    </li>
  );
}

export function HistoryArchiveCenterSkeleton() {
  return (
    <section aria-label="History Center" className="space-y-5">
      <LoadingState
        description="Dang tai filter, export controls va timeline trong scope hien tai."
        title="Dang tai History & Archive"
      />
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" aria-hidden="true">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))]">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-10 rounded-md bg-slate-100" key={item} />
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(6,minmax(120px,1fr))_auto]">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <div className="h-10 rounded-md bg-slate-100" key={item} />
          ))}
        </div>
      </div>
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={item}>
            <div className="h-3 w-44 rounded bg-slate-100" />
            <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HistoryArchiveCenter({ data }: { data: HistoryArchiveCenterData }) {
  const filters = data.archive.filters;
  const preservedParams = {
    view: "executive-history",
    ...(data.preservedParams ?? {}),
  };
  const chips = activeFilters(filters, preservedParams);
  const clearHref = buildHref(preservedParams, {}, []);
  const countsLabel = sourceCountsLabel(data);
  const exportTargets = data.archive.permissions.exportTargets ?? [];
  const canExport = Boolean(data.archive.permissions.canExport && exportTargets.length > 0);

  if (!data.archive.permissions.canView) {
    return (
      <UnauthorizedState
        backHref="/command-center"
        backLabel="Back to Command Center"
        description="Current permissions do not allow reading the executive history archive."
        title="Khong co quyen xem History & Archive"
      />
    );
  }

  return (
    <section aria-label="History Center" className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Executive operations
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            History & Archive
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {data.archive.total} events · Generated {formatDateTime(data.archive.generatedAt)}
          </p>
          {countsLabel ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {countsLabel}
            </p>
          ) : null}
        </div>
      </div>

      <form
        action="/command-center"
        aria-label="Bo loc lich su"
        className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        id={historyFilterFormId}
        method="get"
        role="search"
      >
        {Object.entries(preservedParams).map(([key, value]) => (
          <input key={key} name={key} type="hidden" value={value} />
        ))}
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(150px,1fr))]">
          <label className="min-w-0 text-xs font-semibold uppercase text-slate-500">
            Search
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal normal-case text-slate-900"
              defaultValue={filters.query ?? ""}
              name="query"
              placeholder="Search event, status, project"
              type="search"
            />
          </label>
          <FilterSelect
            label="Project"
            name="projectId"
            options={projectOptions(data)}
            value={filters.projectId}
          />
          <FilterSelect
            label="Module"
            name="module"
            options={data.filterOptions.modules}
            value={filters.module}
          />
          <FilterSelect
            label="Type"
            name="type"
            options={data.filterOptions.types}
            value={filters.type}
          />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(6,minmax(120px,1fr))_auto]">
          <FilterSelect
            label="Status"
            name="status"
            options={statusOptions(data)}
            value={filters.status}
          />
          <FilterSelect
            label="Severity"
            name="severity"
            options={data.filterOptions.severities}
            value={filters.severity}
          />
          <FilterSelect
            label="Actor"
            name="actorId"
            options={actorOptions(data)}
            value={filters.actorId}
          />
          <label className="min-w-0 text-xs font-semibold uppercase text-slate-500">
            From
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900"
              defaultValue={formatDateInput(filters.dateFrom)}
              name="dateFrom"
              type="date"
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase text-slate-500">
            To
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-900"
              defaultValue={formatDateInput(filters.dateTo)}
              name="dateTo"
              type="date"
            />
          </label>
          <FilterSelect
            includeAll={false}
            label="Limit"
            name="limit"
            options={limitOptions}
            value={String(filters.limit ?? defaultHistoryLimit)}
          />
          <Button className="self-end" type="submit">
            <Search className="h-4 w-4" aria-hidden="true" />
            Apply
          </Button>
        </div>
      </form>

      {chips.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-2">
          {chips.map((chip) => (
            <Link
              className="inline-flex min-w-0 max-w-full flex-wrap items-center break-words rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              href={chip.href}
              key={chip.key}
            >
              <span>{chip.label}: </span>
              <span className="break-all">{chip.value}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {canExport ? (
        <div aria-label="Export current history results" className="flex flex-wrap items-center gap-2">
          {exportTargets.includes("dashboard") ? (
            <HistoryExportSubmitButton
              formId={historyFilterFormId}
              format="json"
              label="Dashboard JSON"
              target="dashboard"
            />
          ) : null}
          {exportTargets.includes("approval_history") ? (
            <HistoryExportSubmitButton
              formId={historyFilterFormId}
              format="csv"
              label="Approvals CSV"
              target="approval_history"
            />
          ) : null}
          {exportTargets.includes("audit_log") ? (
            <HistoryExportSubmitButton
              formId={historyFilterFormId}
              format="csv"
              label="Audit CSV"
              target="audit_log"
            />
          ) : null}
        </div>
      ) : null}

      {data.archive.items.length === 0 ? (
        <EmptyState
          action={
            chips.length > 0 ? (
              <Button asChild variant="outline">
                <Link aria-label="Clear active history filters" href={clearHref}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Clear active filters
                </Link>
              </Button>
            ) : null
          }
          description={
            chips.length > 0
              ? "No event matches the active filters."
              : "No history event is available for the current scope."
          }
          title={chips.length > 0 ? "Khong co ket qua theo filter" : "Khong co du lieu trong scope"}
        />
      ) : (
        <ol aria-label="Lich su dieu hanh" className="space-y-3">
          {data.archive.items.map((event) => (
            <HistoryEventItem event={event} key={event.id} />
          ))}
        </ol>
      )}
    </section>
  );
}
