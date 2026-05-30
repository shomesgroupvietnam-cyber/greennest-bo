"use client";

import React, { useEffect, useRef } from "react";
import {
  Clock3,
  ExternalLink,
  History,
  Link2,
  ListChecks,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";

import { safeInternalHref } from "@/modules/dashboard/services/executive-drilldown-source";
import type { ExecutiveDashboardSourceItem } from "@/modules/dashboard/types";

function valueOrFallback(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

function metadataRows(item: ExecutiveDashboardSourceItem) {
  return [
    ["Source type", item.sourceType],
    ["Source ID", item.sourceId],
    ["Scope", valueOrFallback(item.scopeLabel, item.projectId ?? "Khong co scope")],
    ["Project", item.projectId ?? "Khong co trong DTO"],
    ["Status", item.status],
    ["Permission", item.permissionState ?? "read_only"],
    ["Owner", item.owner ?? "Chua gan"],
    ["Deadline", item.deadline ?? "Khong co deadline"],
    ["Reason", item.reason ?? "Khong co reason"],
  ];
}

function DetailSection({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        {icon}
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ExecutiveDrilldownPanel({
  item,
  onClose,
}: {
  item: ExecutiveDashboardSourceItem | null;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }

    const activeElement = document.activeElement;
    returnFocusRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : null;
    closeButtonRef.current?.focus();
  }, [item]);

  if (!item) {
    return null;
  }

  const safeHref = safeInternalHref(item.href);
  const visibleActions =
    item.availableActions?.filter((action) => {
      const actionHref = safeInternalHref(action.href);

      return !(
        action.enabled &&
        (action.id === "open-source" ||
          (action.label === "Mo nguon" && (!safeHref || actionHref === safeHref)))
      );
    }) ?? [];
  const handleClose = () => {
    const returnTarget = returnFocusRef.current;

    onClose();
    window.setTimeout(() => returnTarget?.focus(), 0);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (!focusableElements.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30" role="presentation">
      <aside
        aria-label="Chi tiet nguon dieu hanh"
        aria-modal="true"
        className="flex h-full w-full max-w-none flex-col bg-white shadow-xl sm:ml-auto sm:max-w-2xl"
        onKeyDown={handleKeyDown}
        ref={panelRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Drill-down read-only
            </p>
            <h2 className="mt-1 break-words text-xl font-semibold text-slate-950">
              {item.title}
            </h2>
            {item.deniedReason ? (
              <p className="mt-2 text-sm text-amber-700">{item.deniedReason}</p>
            ) : null}
          </div>
          <button
            aria-label="Dong panel chi tiet"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            onClick={handleClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {metadataRows(item).map(([label, value]) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={label}>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <DetailSection
            icon={<ExternalLink className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            title="Lien ket nguon"
          >
            {safeHref ? (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                href={safeHref}
              >
                Mo nguon
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                {item.deniedReason ??
                  "DTO chua cung cap route an toan, nen panel chi hien metadata read-only va khong tu tao URL tu raw id."}
              </p>
            )}
          </DetailSection>

          <DetailSection
            icon={<Link2 className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            title="Nguon lien quan"
          >
            {item.linkedRecords?.length ? (
              <ul className="space-y-2">
                {item.linkedRecords.map((record) => {
                  const recordHref = safeInternalHref(record.href);
                  const canOpenRecord =
                    record.permissionState === "allowed" && Boolean(recordHref);

                  return (
                    <li
                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                      key={`${record.type}-${record.id}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-950">
                            {record.title}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                            {record.type} - {record.status ?? record.permissionState}
                          </p>
                          {record.reason ? (
                            <p className="mt-2 text-sm text-slate-600">{record.reason}</p>
                          ) : null}
                        </div>
                        {canOpenRecord && recordHref ? (
                          <Link
                            aria-label={`Mo record ${record.title}`}
                            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            href={recordHref}
                          >
                            Mo record
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Chua co linked record trong DTO.
              </p>
            )}
          </DetailSection>

          <DetailSection
            icon={<ListChecks className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            title="Actions theo quyen"
          >
            {visibleActions.length ? (
              <ul className="space-y-2">
                {visibleActions.map((action) => {
                  const actionHref = action.enabled ? safeInternalHref(action.href) : undefined;

                  return (
                    <li
                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                      key={action.id}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-950">
                            {action.label}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                            {action.enabled ? "Enabled" : "Disabled"}
                            {action.actionKey ? ` - ${action.actionKey}` : ""}
                          </p>
                          {action.reason ? (
                            <p className="mt-2 text-sm text-slate-600">{action.reason}</p>
                          ) : null}
                        </div>
                        {actionHref ? (
                          <Link
                            aria-label={`Thuc hien ${action.label}`}
                            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            href={actionHref}
                          >
                            Thuc hien
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                {safeHref
                  ? "Nguon chinh da co link an toan; khong co action bo sung."
                  : "Khong co action kha dung trong scope hien tai."}
              </p>
            )}
          </DetailSection>

          <DetailSection
            icon={<Clock3 className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            title="Timeline"
          >
            {item.timeline?.length ? (
              <ol className="space-y-2">
                {item.timeline.map((timelineItem) => (
                  <li
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    key={timelineItem.id}
                  >
                    <p className="break-words text-sm font-semibold text-slate-950">
                      {timelineItem.label}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                      {[
                        timelineItem.status ? `Status: ${timelineItem.status}` : undefined,
                        timelineItem.actor ? `Actor: ${timelineItem.actor}` : undefined,
                        timelineItem.timestamp,
                      ]
                        .filter(Boolean)
                        .join(" - ") || "No timestamp"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Chua co timeline trong DTO.
              </p>
            )}
          </DetailSection>

          <DetailSection
            icon={<History className="h-4 w-4 text-slate-600" aria-hidden="true" />}
            title="Audit trail"
          >
            {item.auditTrail?.length ? (
              <ul className="space-y-2">
                {item.auditTrail.map((auditItem) => (
                  <li
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    key={auditItem.id}
                  >
                    <p className="break-words text-sm font-semibold text-slate-950">
                      {auditItem.action}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                      {[auditItem.actor, auditItem.timestamp].filter(Boolean).join(" - ") ||
                        "No actor"}
                    </p>
                    {auditItem.reason ? (
                      <p className="mt-2 text-sm text-slate-600">{auditItem.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <p>Chua co audit trail trong DTO.</p>
              </div>
            )}
          </DetailSection>
        </div>
      </aside>
    </div>
  );
}
