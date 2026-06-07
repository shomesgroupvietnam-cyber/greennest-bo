import React from "react";

import type { DecisionHistoryEvent, DecisionVersionField, DecisionVersionValue } from "@/modules/meetings/types";

type DecisionHistoryTimelineProps = {
  events: DecisionHistoryEvent[];
};

const hiddenValueFields = new Set<DecisionVersionField>(["decisionText", "linkedRecords"]);

function formatTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function formatValue(field: DecisionVersionField, value: unknown) {
  if (hiddenValueFields.has(field)) {
    return "[noi dung da an]";
  }

  if (value === undefined || value === null || value === "") {
    return "trong";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return "[metadata]";
  }

  return String(value);
}

function fieldChangeSummary(
  field: DecisionVersionField,
  previousValue: DecisionVersionValue | undefined,
  newValue: DecisionVersionValue | undefined
) {
  return `${field}: ${formatValue(field, previousValue?.[field])} -> ${formatValue(field, newValue?.[field])}`;
}

export function DecisionHistoryTimeline({ events }: DecisionHistoryTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có lịch sử thay đổi.</p>;
  }

  const sortedEvents = [...events].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <ol className="space-y-3">
      {sortedEvents.map((event) => (
        <li key={event.id} className="border-l-2 border-slate-200 pl-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium text-slate-900">
              {event.type === "version" ? `Version ${event.versionNumber}` : event.action}
            </span>
            <span className="text-slate-500">{formatTime(event.createdAt)}</span>
            {event.actorId ? <span className="text-slate-500">Actor: {event.actorId}</span> : null}
          </div>

          {event.type === "version" ? (
            <div className="mt-1 space-y-1 text-sm text-slate-600">
              {event.reason ? <p>Lý do: {event.reason}</p> : null}
              <div className="space-y-1">
                {event.changedFields.map((field) => (
                  <p key={field}>{fieldChangeSummary(field, event.previousValue, event.newValue)}</p>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-600">{event.summary ?? event.changedFields?.join(", ")}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
