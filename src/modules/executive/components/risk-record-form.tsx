"use client";

import React from "react";
import { CheckCircle2, LockKeyhole, Plus, RefreshCcw, Save } from "lucide-react";

import {
  closeExecutiveRiskRecordStateAction,
  createExecutiveRiskRecordStateAction,
  overrideExecutiveRiskStatusStateAction,
  updateExecutiveRiskRecordStateAction,
  type ExecutiveActionFormState,
} from "@/modules/executive/actions";
import type {
  ExecutiveRiskItem,
  ExecutiveRiskMutationOptions,
} from "@/modules/dashboard/types";

const initialActionState: ExecutiveActionFormState = {
  status: "idle",
};

const recordTypeOptions = [
  { label: "Rủi ro", value: "risk" },
  { label: "Vướng mắc", value: "blocker" },
];

const levelOptions = [
  { label: "Thap", value: "low" },
  { label: "Trung binh", value: "medium" },
  { label: "Cao", value: "high" },
  { label: "Nghiem trong", value: "critical" },
];

const statusOptions = [
  { label: "Mo", value: "open" },
  { label: "Theo doi", value: "monitoring" },
  { label: "Đang xử lý", value: "in_progress" },
  { label: "Bi chan", value: "blocked" },
];
const overrideStatusOptions = [
  { label: "Xanh", value: "green" },
  { label: "Vang", value: "yellow" },
  { label: "Do", value: "red" },
];
const terminalStatusOptions = [
  { label: "Closed", value: "closed" },
  { label: "Resolved", value: "resolved" },
];

function fieldValue(
  state: ExecutiveActionFormState,
  key: string,
  fallback = "",
) {
  return state.fields?.[key] ?? fallback;
}

function FieldError({
  name,
  state,
}: {
  name: string;
  state: ExecutiveActionFormState;
}) {
  const errors = state.fieldErrors?.[name];

  if (!errors?.length) {
    return null;
  }

  return (
    <p className="text-xs font-medium text-red-700" id={`risk-${name}-error`}>
      {errors[0]}
    </p>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-medium text-slate-700">
      {children} <span className="text-red-600">*</span>
    </span>
  );
}

function ActionStatus({ state }: { state: ExecutiveActionFormState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <p
      className={`rounded-md px-3 py-2 text-sm font-medium ${
        state.status === "success"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-red-50 text-red-800"
      }`}
    >
      {state.message}
    </p>
  );
}

export function RiskRecordForm({
  mode,
  options,
  record,
}: {
  mode: "create" | "update" | "override" | "close";
  options: ExecutiveRiskMutationOptions;
  record?: ExecutiveRiskItem;
}) {
  const [state, formAction, isPending] = React.useActionState(
    mode === "create"
      ? createExecutiveRiskRecordStateAction
      : mode === "update"
        ? updateExecutiveRiskRecordStateAction
        : mode === "override"
          ? overrideExecutiveRiskStatusStateAction
          : closeExecutiveRiskRecordStateAction,
    initialActionState,
  );
  const delegationActionKey =
    mode === "create"
      ? "risk.create"
      : mode === "update"
        ? "risk.update"
        : mode === "override"
          ? "risk.override"
          : "risk.close";
  const delegationOptions = options.delegations.filter((delegation) =>
    delegation.actionKeys.includes(delegationActionKey),
  );
  const defaultProjectId = record?.projectId ?? options.projects[0]?.id ?? "";
  const defaultCategoryKey =
    record?.categoryKey ?? options.categories[0]?.id ?? "";
  const defaultOwnerId = record?.ownerId ?? record?.owner ?? options.owners[0]?.id ?? "";

  if (mode === "override" || mode === "close") {
    return (
      <form action={formAction} className="space-y-3">
        <div className="flex items-center gap-2">
          {mode === "override" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          ) : (
            <LockKeyhole className="h-4 w-4 text-slate-700" aria-hidden="true" />
          )}
          <h3 className="text-sm font-semibold text-slate-950">
            {mode === "override" ? "Xác nhận/điều chỉnh trạng thái" : "Đóng rủi ro/vướng mắc"}
          </h3>
        </div>

        <ActionStatus state={state} />

        <input
          name="riskId"
          type="hidden"
          value={fieldValue(state, "riskId", record?.sourceId ?? "")}
        />

        {mode === "override" ? (
          <>
            <label className="space-y-1 text-sm">
              <RequiredLabel>Trạng thái xác nhận</RequiredLabel>
              <select
                aria-describedby="risk-statusOverride-error"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                defaultValue={fieldValue(
                  state,
                  "statusOverride",
                  record?.statusSuggestion.status ?? "yellow",
                )}
                disabled={isPending}
                name="statusOverride"
              >
                {overrideStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError name="statusOverride" state={state} />
            </label>
            <label className="space-y-1 text-sm">
              <RequiredLabel>Lý do điều chỉnh</RequiredLabel>
              <textarea
                aria-describedby="risk-reason-error"
                className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
                defaultValue={fieldValue(state, "reason", "")}
                disabled={isPending}
                name="reason"
              />
              <FieldError name="reason" state={state} />
            </label>
          </>
        ) : (
          <>
            <label className="space-y-1 text-sm">
              <RequiredLabel>Trạng thái đóng</RequiredLabel>
              <select
                aria-describedby="risk-status-error"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                defaultValue={fieldValue(state, "status", "closed")}
                disabled={isPending}
                name="status"
              >
                {terminalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError name="status" state={state} />
            </label>
            <label className="space-y-1 text-sm">
              <RequiredLabel>Lý do đóng</RequiredLabel>
              <textarea
                aria-describedby="risk-reason-error"
                className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
                defaultValue={fieldValue(state, "reason", "")}
                disabled={isPending}
                name="reason"
              />
              <FieldError name="reason" state={state} />
            </label>
          </>
        )}

        {delegationOptions.length ? (
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Uy quyen on-behalf</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "delegationSelection", "")}
              disabled={isPending}
              name="delegationSelection"
            >
              <option value="">Thao tac truc tiep</option>
              {delegationOptions.map((delegation) => (
                <option
                  key={delegation.delegationId}
                  value={`${delegation.delegationId}|${delegation.principalUserId}`}
                >
                  {delegation.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-white py-3">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isPending
              ? "Đang lưu"
              : mode === "override"
                ? "Xac nhan trang thai"
                : "Đóng rủi ro/vướng mắc"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center gap-2">
        {mode === "create" ? (
          <Plus className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        ) : (
          <RefreshCcw className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        )}
        <h3 className="text-sm font-semibold text-slate-950">
          {mode === "create" ? "Tạo rủi ro/vướng mắc" : "Cập nhật rủi ro/vướng mắc"}
        </h3>
      </div>

      <ActionStatus state={state} />

      {mode === "update" ? (
        <input
          name="riskId"
          type="hidden"
          value={fieldValue(state, "riskId", record?.sourceId ?? "")}
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <RequiredLabel>Loai ban ghi</RequiredLabel>
          <select
            aria-describedby="risk-recordType-error"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={fieldValue(state, "recordType", "risk")}
            disabled={isPending}
            name="recordType"
          >
            {recordTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="recordType" state={state} />
        </label>

        <label className="space-y-1 text-sm">
          <RequiredLabel>Muc do</RequiredLabel>
          <select
            aria-describedby="risk-level-error"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={fieldValue(state, "level", record?.severity ?? "medium")}
            disabled={isPending}
            name="level"
          >
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="level" state={state} />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <RequiredLabel>Tiêu đề</RequiredLabel>
        <input
          aria-describedby="risk-title-error"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          defaultValue={fieldValue(state, "title", record?.title ?? "")}
          disabled={isPending}
          name="title"
        />
        <FieldError name="title" state={state} />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <RequiredLabel>Nhóm rủi ro</RequiredLabel>
          {options.categories.length ? (
            <select
              aria-describedby="risk-categoryKey-error"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "categoryKey", defaultCategoryKey)}
              disabled={isPending}
              name="categoryKey"
            >
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-describedby="risk-categoryKey-error"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "categoryKey", defaultCategoryKey)}
              disabled={isPending}
              name="categoryKey"
            />
          )}
          <FieldError name="categoryKey" state={state} />
        </label>

        <label className="space-y-1 text-sm">
          <RequiredLabel>Trạng thái</RequiredLabel>
          <select
            aria-describedby="risk-status-error"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={fieldValue(state, "status", record?.status ?? "open")}
            disabled={isPending}
            name="status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="status" state={state} />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <RequiredLabel>Lý do / mô tả</RequiredLabel>
        <textarea
          aria-describedby="risk-reason-error"
          className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2"
          defaultValue={fieldValue(state, "reason", record?.reason ?? "")}
          disabled={isPending}
          name="reason"
        />
        <FieldError name="reason" state={state} />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <RequiredLabel>Dự án / module liên quan</RequiredLabel>
          {options.projects.length ? (
            <select
              aria-describedby="risk-projectId-error"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "projectId", defaultProjectId)}
              disabled={isPending}
              name="projectId"
            >
              {options.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-describedby="risk-projectId-error"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "projectId", defaultProjectId)}
              disabled={isPending}
              name="projectId"
            />
          )}
          <FieldError name="projectId" state={state} />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Module</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={fieldValue(state, "moduleId", record?.moduleId ?? "risk")}
            disabled={isPending}
            name="moduleId"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <RequiredLabel>Người phụ trách</RequiredLabel>
          {options.owners.length ? (
            <select
              aria-describedby="risk-ownerId-error"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "ownerId", defaultOwnerId)}
              disabled={isPending}
              name="ownerId"
            >
              {options.owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-describedby="risk-ownerId-error"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              defaultValue={fieldValue(state, "ownerId", defaultOwnerId)}
              disabled={isPending}
              name="ownerId"
              placeholder="user-id"
            />
          )}
          <FieldError name="ownerId" state={state} />
        </label>

        <label className="space-y-1 text-sm">
          <RequiredLabel>Hạn xử lý</RequiredLabel>
          <input
            aria-describedby="risk-deadline-error"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={fieldValue(state, "deadline", record?.deadline ?? "")}
            disabled={isPending}
            name="deadline"
            type="date"
          />
          <FieldError name="deadline" state={state} />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <RequiredLabel>Hanh dong tiep theo</RequiredLabel>
        <input
          aria-describedby="risk-nextAction-error"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          defaultValue={fieldValue(state, "nextAction", record?.nextAction ?? "")}
          disabled={isPending}
          name="nextAction"
        />
        <FieldError name="nextAction" state={state} />
      </label>

      {delegationOptions.length ? (
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Uy quyen on-behalf</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={fieldValue(state, "delegationSelection", "")}
            disabled={isPending}
            name="delegationSelection"
          >
            <option value="">Thao tac truc tiep</option>
            {delegationOptions.map((delegation) => (
              <option
                key={delegation.delegationId}
                value={`${delegation.delegationId}|${delegation.principalUserId}`}
              >
                {delegation.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-white py-3">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isPending
            ? "Đang lưu"
            : mode === "create"
              ? "Tạo rủi ro/vướng mắc"
              : "Cập nhật rủi ro/vướng mắc"}
        </button>
      </div>
    </form>
  );
}
