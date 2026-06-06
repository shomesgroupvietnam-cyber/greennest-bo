import React, { type ReactNode } from "react";
import { Filter, RotateCcw, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES,
} from "@/modules/meetings/constants";
import {
  buildActiveMeetingFilters,
  type ActiveMeetingFilter,
  type MeetingListFilterOptions,
  type MeetingListFilterState,
} from "@/modules/meetings/services/meeting-list-filter-service";

type MeetingListFiltersProps = {
  activeFilters?: ActiveMeetingFilter[];
  filters: MeetingListFilterState;
  options: MeetingListFilterOptions;
};

const fieldClassName =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function FilterSelect({
  children,
  label,
  name,
  value,
}: {
  children: ReactNode;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="min-w-0 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select aria-label={label} className={fieldClassName} defaultValue={value} id={name} name={name}>
        {children}
      </select>
    </label>
  );
}

export function MeetingListFilters({
  activeFilters,
  filters,
  options,
}: MeetingListFiltersProps) {
  const resolvedActiveFilters = activeFilters ?? buildActiveMeetingFilters(filters, options);

  return (
    <section aria-label="Bo loc meeting" className="space-y-3">
      <form className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <FilterSelect label="Du an" name="projectId" value={filters.projectId}>
          <option value="all">Tat ca du an</option>
          {options.projects.map((project) => (
            <option key={project.value} value={project.value}>
              {project.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Loai hop" name="meetingType" value={filters.meetingType}>
          <option value="all">Tat ca loai hop</option>
          {Object.entries(MEETING_TYPES).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Trang thai" name="status" value={filters.status}>
          <option value="all">Tat ca trang thai</option>
          {Object.entries(MEETING_STATUSES).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Visibility" name="visibility" value={filters.visibility}>
          <option value="all">Tat ca visibility</option>
          {Object.entries(MEETING_VISIBILITIES).map(([visibility, label]) => (
            <option key={visibility} value={visibility}>
              {label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="To chuc" name="organizationId" value={filters.organizationId}>
          <option value="all">Tat ca to chuc</option>
          {options.organizations.map((organization) => (
            <option key={organization.value} value={organization.value}>
              {organization.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Truc" name="axisId" value={filters.axisId}>
          <option value="all">Tat ca truc</option>
          {options.axes.map((axis) => (
            <option key={axis.value} value={axis.value}>
              {axis.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Phong ban" name="departmentId" value={filters.departmentId}>
          <option value="all">Tat ca phong ban</option>
          {options.departments.map((department) => (
            <option key={department.value} value={department.value}>
              {department.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Nguoi tham gia" name="participantId" value={filters.participantId}>
          <option value="all">Tat ca nguoi tham gia</option>
          {options.participants.map((participant) => (
            <option key={participant.value} value={participant.value}>
              {participant.label}
            </option>
          ))}
        </FilterSelect>

        <label className="min-w-0 text-sm font-medium text-slate-700">
          <span>Tu ngay</span>
          <input
            aria-label="Tu ngay"
            className={fieldClassName}
            defaultValue={filters.dateFrom}
            name="dateFrom"
            type="date"
          />
        </label>

        <label className="min-w-0 text-sm font-medium text-slate-700">
          <span>Den ngay</span>
          <input
            aria-label="Den ngay"
            className={fieldClassName}
            defaultValue={filters.dateTo}
            name="dateTo"
            type="date"
          />
        </label>

        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-5">
          <Button type="submit" variant="secondary">
            <Filter aria-hidden="true" className="h-4 w-4" />
            Loc
          </Button>
          <Button asChild variant="ghost">
            <Link aria-label="Dat lai bo loc" href="/meetings">
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Dat lai
            </Link>
          </Button>
        </div>
      </form>

      {resolvedActiveFilters.length > 0 ? (
        <div aria-label="Bo loc dang ap dung" className="flex flex-wrap gap-2">
          {resolvedActiveFilters.map((filter) => (
            <Link
              aria-label={`Bo loc ${filter.label}: ${filter.valueLabel}`}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
              href={filter.href}
              key={`${filter.key}-${filter.valueLabel}`}
            >
              <span>
                {filter.label}: {filter.valueLabel}
              </span>
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
