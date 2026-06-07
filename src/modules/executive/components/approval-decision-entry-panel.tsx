"use client";

import { FileCheck2, Send } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  createDecisionRecordStateAction,
  type ExecutiveActionFormState,
} from "@/modules/executive/actions";
import type { ApprovalDecisionEntryPoint } from "@/modules/executive/types";

const initialActionState: ExecutiveActionFormState = { status: "idle" };

function ActionStatusMessage({ state }: { state: ExecutiveActionFormState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <div
      className={`rounded-md px-3 py-2 text-sm ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
      role={state.status === "error" ? "alert" : "status"}
    >
      <p>{state.message}</p>
      {state.status === "success" && state.href ? (
        <Link
          className="mt-2 inline-flex font-semibold hover:text-emerald-800"
          href={state.href}
        >
          Mo trong Decision Center
        </Link>
      ) : null}
    </div>
  );
}

export function ApprovalDecisionEntryPanel({
  entryPoint,
}: {
  entryPoint?: ApprovalDecisionEntryPoint;
}) {
  const [state, formAction, isPending] = React.useActionState(
    createDecisionRecordStateAction,
    initialActionState,
  );

  if (!entryPoint?.canCreate) {
    return null;
  }

  return (
    <section
      aria-label="Tao quyet dinh chinh thuc"
      className="rounded-lg border bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">
          Tao quyet dinh
        </h2>
      </div>
      <form action={formAction} className="mt-4 space-y-3">
        <input name="sourceType" type="hidden" value={entryPoint.sourceType} />
        <input name="sourceId" type="hidden" value={entryPoint.sourceId} />
        <input name="status" type="hidden" value="open" />
        {entryPoint.projectId ? (
          <input name="projectId" type="hidden" value={entryPoint.projectId} />
        ) : null}
        {entryPoint.selectedScopeId ? (
          <input name="scopeId" type="hidden" value={entryPoint.selectedScopeId} />
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Tieu de quyet dinh
          <input
            className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={entryPoint.titleSuggestion}
            name="title"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Noi dung chi dao
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            name="decisionText"
            required
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Nguoi phu trach
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="ownerId"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Deadline
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="dueDate"
              type="date"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Uu tien
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue="medium"
              name="priority"
            >
              <option value="low">Thap</option>
              <option value="medium">Trung binh</option>
              <option value="high">Cao</option>
              <option value="urgent">Khan cap</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            KPI
            <input
              className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              name="kpi"
            />
          </label>
        </div>
        <Button disabled={isPending} type="submit">
          <Send className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Dang tao" : "Tao quyet dinh"}
        </Button>
        <ActionStatusMessage state={state} />
      </form>
    </section>
  );
}
