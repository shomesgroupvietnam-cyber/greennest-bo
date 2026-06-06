import { z } from "zod";

import {
  HISTORY_ARCHIVE_EVENT_TYPES,
  HISTORY_ARCHIVE_MODULES,
  HISTORY_ARCHIVE_SEVERITIES,
  REPORT_TYPES,
  type HistoryArchiveFilters,
  type ReportExportRequest,
} from "@/modules/reports/types";

const reportTypeValues = Object.keys(REPORT_TYPES) as [keyof typeof REPORT_TYPES, ...Array<keyof typeof REPORT_TYPES>];
const historyArchiveEventTypeValues = [...HISTORY_ARCHIVE_EVENT_TYPES] as [
  (typeof HISTORY_ARCHIVE_EVENT_TYPES)[number],
  ...Array<(typeof HISTORY_ARCHIVE_EVENT_TYPES)[number]>
];
const historyArchiveModuleValues = [...HISTORY_ARCHIVE_MODULES] as [
  (typeof HISTORY_ARCHIVE_MODULES)[number],
  ...Array<(typeof HISTORY_ARCHIVE_MODULES)[number]>
];
const historyArchiveSeverityValues = [...HISTORY_ARCHIVE_SEVERITIES] as [
  (typeof HISTORY_ARCHIVE_SEVERITIES)[number],
  ...Array<(typeof HISTORY_ARCHIVE_SEVERITIES)[number]>
];

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function normalizeDateBoundary(value: string, boundary: "start" | "end") {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnlyMatch) {
    const [, yearText, monthText, dayText] = dateOnlyMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    const isValidCalendarDate =
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() + 1 === month &&
      parsedDate.getUTCDate() === day;

    return isValidCalendarDate
      ? `${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}Z`
      : undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

const optionalTrimmedString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional()
);
const optionalDateBoundary = (boundary: "start" | "end") =>
  z.preprocess(
    emptyStringToUndefined,
    z.string()
      .min(1)
      .refine((value) => Boolean(normalizeDateBoundary(value, boundary)), "Invalid date filter.")
      .transform((value) => normalizeDateBoundary(value, boundary)!)
      .optional()
  ).catch(undefined);
const optionalArchiveModule = z.preprocess(
  emptyStringToUndefined,
  z.union([z.literal("all"), z.enum(historyArchiveModuleValues)]).optional(),
).catch(undefined);
const optionalArchiveEventType = z.preprocess(
  emptyStringToUndefined,
  z.union([z.literal("all"), z.enum(historyArchiveEventTypeValues)]).optional(),
).catch(undefined);
const optionalArchiveSeverity = z.preprocess(
  emptyStringToUndefined,
  z.union([z.literal("all"), z.enum(historyArchiveSeverityValues)]).optional(),
).catch(undefined);
const strictOptionalDateBoundary = (boundary: "start" | "end") =>
  z.preprocess(
    emptyStringToUndefined,
    z.string()
      .min(1)
      .refine((value) => Boolean(normalizeDateBoundary(value, boundary)), "Invalid date filter.")
      .transform((value) => normalizeDateBoundary(value, boundary)!)
      .optional()
  );
const strictOptionalArchiveModule = z.preprocess(
  emptyStringToUndefined,
  z.union([z.literal("all"), z.enum(historyArchiveModuleValues)]).optional(),
);
const strictOptionalArchiveEventType = z.preprocess(
  emptyStringToUndefined,
  z.union([z.literal("all"), z.enum(historyArchiveEventTypeValues)]).optional(),
);
const strictOptionalArchiveSeverity = z.preprocess(
  emptyStringToUndefined,
  z.union([z.literal("all"), z.enum(historyArchiveSeverityValues)]).optional(),
);
const strictOptionalLimit = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().min(1).max(500).optional(),
);

export const reportInputSchema = z.object({
  projectId: z.string().trim().min(1, "Vui lòng chọn dự án."),
  reportType: z.enum(reportTypeValues)
});

export const historyArchiveFilterSchema = z.object({
  projectId: optionalTrimmedString,
  module: optionalArchiveModule,
  type: optionalArchiveEventType,
  actorId: optionalTrimmedString,
  status: optionalTrimmedString,
  severity: optionalArchiveSeverity,
  dateFrom: optionalDateBoundary("start"),
  dateTo: optionalDateBoundary("end"),
  query: optionalTrimmedString,
  limit: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(1).max(500).catch(100),
  )
});

export const reportExportFilterSchema = z.object({
  projectId: optionalTrimmedString,
  module: strictOptionalArchiveModule,
  type: strictOptionalArchiveEventType,
  actorId: optionalTrimmedString,
  status: optionalTrimmedString,
  severity: strictOptionalArchiveSeverity,
  dateFrom: strictOptionalDateBoundary("start"),
  dateTo: strictOptionalDateBoundary("end"),
  query: optionalTrimmedString,
  limit: strictOptionalLimit,
});

export const reportExportRequestSchema = z.object({
  target: z.enum(["dashboard", "approval_history", "audit_log"]),
  format: z.enum(["json", "csv"]),
  filters: reportExportFilterSchema.optional(),
  scopeId: optionalTrimmedString,
});

const reportExportBoundarySchema = z.object({
  actorId: optionalTrimmedString,
  dateFrom: strictOptionalDateBoundary("start"),
  dateTo: strictOptionalDateBoundary("end"),
  format: z.preprocess(emptyStringToUndefined, z.enum(["json", "csv"]).default("json")),
  limit: strictOptionalLimit,
  module: strictOptionalArchiveModule,
  projectId: optionalTrimmedString,
  query: optionalTrimmedString,
  scopeId: optionalTrimmedString,
  severity: strictOptionalArchiveSeverity,
  status: optionalTrimmedString,
  target: z.preprocess(
    emptyStringToUndefined,
    z.enum(["dashboard", "approval_history", "audit_log"]).default("approval_history"),
  ),
  type: strictOptionalArchiveEventType,
});
const reportExportBoundaryKeys = new Set(Object.keys(reportExportBoundarySchema.shape));

export function parseReportExportRequest(input: Record<string, unknown>): ReportExportRequest {
  const parsed = reportExportBoundarySchema.parse(input);
  const filters = reportExportFilterSchema.parse({
    actorId: parsed.actorId,
    dateFrom: parsed.dateFrom,
    dateTo: parsed.dateTo,
    limit: parsed.limit,
    module: parsed.module,
    projectId: parsed.projectId,
    query: parsed.query,
    severity: parsed.severity,
    status: parsed.status,
    type: parsed.type,
  }) as HistoryArchiveFilters;

  return {
    filters,
    format: parsed.format,
    scopeId: parsed.scopeId,
    target: parsed.target,
  };
}

export function parseReportExportRequestEntries(
  entries: Iterable<[string, FormDataEntryValue | string]>,
): ReportExportRequest {
  const input: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    if (reportExportBoundaryKeys.has(key) && input[key] === undefined) {
      input[key] = value;
    }
  }

  return parseReportExportRequest(input);
}
