import {
  Ban,
  CalendarPlus,
  CheckCircle2,
  Forward,
  PauseCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import React, { type ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { applyApprovalDetailAction } from "@/modules/proposals/actions";
import type {
  ApprovalCenterDetailAction,
  ApprovalCenterDetailActionKey,
  ApprovalCenterDetailData,
} from "@/modules/executive/types";

const actionIcons: Record<ApprovalCenterDetailActionKey, ComponentType<{ className?: string }>> = {
  approve: CheckCircle2,
  ask_meeting: CalendarPlus,
  cancel: Ban,
  forward: Forward,
  hold: PauseCircle,
  reject: XCircle,
  request_change: RotateCcw,
};

function HiddenFields({
  action,
  detail,
}: {
  action: ApprovalCenterDetailAction;
  detail: ApprovalCenterDetailData;
}) {
  return (
    <>
      <input type="hidden" name="sourceType" value={detail.source.sourceType} />
      <input type="hidden" name="sourceId" value={detail.source.sourceId} />
      <input type="hidden" name="approvalAction" value={action.action} />
      {detail.selectedScopeId ? (
        <input type="hidden" name="scopeId" value={detail.selectedScopeId} />
      ) : null}
    </>
  );
}

function TextArea({
  label,
  name,
  required = false,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
        required={required}
      />
    </label>
  );
}

function Confirmation({ label }: { label: string }) {
  return (
    <label className="flex items-start gap-2 text-sm font-medium text-slate-700">
      <input
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700"
        name="confirm"
        required
        type="checkbox"
        value="yes"
      />
      {label}
    </label>
  );
}

function renderFields(action: ApprovalCenterDetailAction) {
  switch (action.action) {
    case "approve":
      return <TextArea label="Ghi chu duyet" name="notes" />;
    case "reject":
      return (
        <>
          <TextArea label="Ly do tu choi" name="reason" required />
          <Confirmation label="Xac nhan tu choi" />
        </>
      );
    case "request_change":
      return <TextArea label="Ly do tra lai" name="reason" required />;
    case "forward":
      return (
        <>
          <label className="block text-sm font-medium text-slate-700">
            Target role
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="targetRole"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Target label
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="targetLabel"
            />
          </label>
          <TextArea label="Ghi chu chuyen cap" name="notes" />
        </>
      );
    case "ask_meeting":
      return (
        <>
          <label className="block text-sm font-medium text-slate-700">
            Loai hop
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="meetingType"
              required
            />
          </label>
          <TextArea label="Agenda du thao" name="agendaDraft" />
        </>
      );
    case "hold":
      return <TextArea label="Ghi chu tam giu" name="notes" />;
    case "cancel":
      return (
        <>
          <TextArea label="Ly do huy approval" name="reason" required />
          <Confirmation label="Xac nhan huy approval" />
        </>
      );
  }
}

export function ApprovalActionPanel({ detail }: { detail: ApprovalCenterDetailData }) {
  const enabledActions = detail.permissions.availableActions.filter(
    (action) => action.enabled,
  );

  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Approval actions"
      className="rounded-lg border bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-950">Approval actions</h2>
      <div className="mt-3 divide-y divide-slate-200">
        {enabledActions.map((action) => {
          const Icon = actionIcons[action.action];

          return (
            <form
              action={applyApprovalDetailAction}
              className="space-y-3 py-4 first:pt-0 last:pb-0"
              key={action.action}
            >
              <HiddenFields action={action} detail={detail} />
              {renderFields(action)}
              <Button
                className={
                  action.destructive
                    ? "border-red-300 text-red-700 hover:bg-red-50"
                    : undefined
                }
                type="submit"
                variant={action.destructive ? "outline" : "default"}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {action.label}
              </Button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
