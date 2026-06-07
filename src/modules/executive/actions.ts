"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { createDecisionAssignments } from "@/modules/executive/services/decision-assignment-service";
import { updateDecisionAssignmentLifecycle } from "@/modules/executive/services/decision-assignment-lifecycle-service";
import { createDecisionRecord, updateDecisionRecord } from "@/modules/executive/services/decision-record-service";
import {
  closeExecutiveRiskRecord,
  createExecutiveRiskRecord,
  overrideExecutiveRiskStatus,
  updateExecutiveRiskRecord,
} from "@/modules/executive/services/risk-record-service";
import type {
  CloseExecutiveRiskRecordInput,
  CreateExecutiveRiskRecordInput,
  OverrideExecutiveRiskStatusInput,
  UpdateExecutiveRiskRecordInput,
} from "@/modules/executive/types";
import type {
  CreateDecisionAssignmentsInput,
  CreateDecisionRecordInput,
  DecisionLinkedRecord,
  UpdateDecisionRecordInput
} from "@/modules/meetings/types";
import { createDecisionAssignmentsInputSchema, updateDecisionRecordInputSchema } from "@/modules/meetings/validation";

export type ExecutiveActionFormState = {
  entityId?: string;
  fieldErrors?: Record<string, string[]>;
  fields?: Record<string, string>;
  href?: string;
  message?: string;
  status: "idle" | "success" | "error";
};

const initialSuccess = (
  message: string,
  extra: Pick<ExecutiveActionFormState, "entityId" | "href"> = {},
): ExecutiveActionFormState => ({
  ...extra,
  message,
  status: "success",
});

const actionError = (
  error: unknown,
  fields?: Record<string, string>,
): ExecutiveActionFormState => {
  if (error instanceof ZodError) {
    const flattened = error.flatten();
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened.fieldErrors).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0,
      ),
    );

    return {
      fieldErrors,
      fields,
      message: flattened.formErrors[0] ?? "Du lieu risk/blocker chua hop le.",
      status: "error",
    };
  }

  return {
    fields,
    message: error instanceof Error ? error.message : "Khong the xu ly thao tac.",
    status: "error",
  };
};

function readString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function readArrayField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readOptionalArrayField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();

  return raw ? raw.split(",").map((item) => item.trim()).filter(Boolean) : undefined;
}

function fieldsFromFormData(formData: FormData, keys: string[]) {
  return keys.reduce<Record<string, string>>((result, key) => {
    const value = formData.get(key);

    if (typeof value === "string") {
      result[key] = value;
    }

    return result;
  }, {});
}

function readDelegationSelection(formData: FormData) {
  const raw = readString(formData, "delegationSelection");

  if (!raw) {
    return {};
  }

  const [delegationId, principalUserId] = raw.split("|").map((item) => item.trim());

  if (!delegationId || !principalUserId) {
    throw new Error("Du lieu uy quyen risk/blocker khong hop le.");
  }

  return {
    delegationId,
    onBehalfOf: principalUserId,
  };
}

const riskFormFieldKeys = [
  "riskId",
  "recordType",
  "title",
  "categoryKey",
  "level",
  "reason",
  "description",
  "organizationId",
  "projectId",
  "axisId",
  "workstreamId",
  "moduleId",
  "ownerId",
  "deadline",
  "nextAction",
  "status",
  "sourceType",
  "sourceId",
  "onBehalfOf",
  "delegationId",
  "delegationSelection",
];
const riskOverrideFormFieldKeys = [
  "riskId",
  "statusOverride",
  "reason",
  "onBehalfOf",
  "delegationId",
  "delegationSelection",
];
const riskCloseFormFieldKeys = [
  "riskId",
  "status",
  "reason",
  "onBehalfOf",
  "delegationId",
  "delegationSelection",
];

function formDataToRiskRecordInput(
  formData: FormData,
): CreateExecutiveRiskRecordInput {
  const delegation = readDelegationSelection(formData);

  return {
    axisId: readString(formData, "axisId"),
    categoryKey: readString(formData, "categoryKey"),
    deadline: readString(formData, "deadline"),
    delegationId: readString(formData, "delegationId") ?? delegation.delegationId,
    description: readString(formData, "description"),
    level: readString(formData, "level") as CreateExecutiveRiskRecordInput["level"],
    moduleId: readString(formData, "moduleId"),
    nextAction: readString(formData, "nextAction"),
    onBehalfOf: readString(formData, "onBehalfOf") ?? delegation.onBehalfOf,
    organizationId: readString(formData, "organizationId"),
    ownerId: readString(formData, "ownerId"),
    projectId: readString(formData, "projectId"),
    reason: readString(formData, "reason"),
    recordType: readString(formData, "recordType") as CreateExecutiveRiskRecordInput["recordType"],
    sourceId: readString(formData, "sourceId"),
    sourceType: readString(formData, "sourceType") as CreateExecutiveRiskRecordInput["sourceType"],
    status: readString(formData, "status") as CreateExecutiveRiskRecordInput["status"],
    title: readString(formData, "title"),
    workstreamId: readString(formData, "workstreamId"),
  };
}

function formDataToUpdateRiskRecordInput(
  formData: FormData,
): UpdateExecutiveRiskRecordInput {
  return {
    ...formDataToRiskRecordInput(formData),
    riskId: readString(formData, "riskId") ?? "",
  };
}

function formDataToOverrideRiskStatusInput(
  formData: FormData,
): OverrideExecutiveRiskStatusInput {
  const delegation = readDelegationSelection(formData);

  return {
    delegationId: readString(formData, "delegationId") ?? delegation.delegationId,
    onBehalfOf: readString(formData, "onBehalfOf") ?? delegation.onBehalfOf,
    reason: readString(formData, "reason") ?? "",
    riskId: readString(formData, "riskId") ?? "",
    statusOverride: readString(formData, "statusOverride") as OverrideExecutiveRiskStatusInput["statusOverride"],
  };
}

function formDataToCloseRiskRecordInput(
  formData: FormData,
): CloseExecutiveRiskRecordInput {
  const delegation = readDelegationSelection(formData);

  return {
    delegationId: readString(formData, "delegationId") ?? delegation.delegationId,
    onBehalfOf: readString(formData, "onBehalfOf") ?? delegation.onBehalfOf,
    reason: readString(formData, "reason") ?? "",
    riskId: readString(formData, "riskId") ?? "",
    status: readString(formData, "status") as CloseExecutiveRiskRecordInput["status"],
  };
}

function readLinkedRecords(formData: FormData): DecisionLinkedRecord[] {
  const raw = readString(formData, "linkedRecordsJson");

  if (!raw) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Du lieu linked records khong hop le.");
  }

  return Array.isArray(parsed) ? (parsed as DecisionLinkedRecord[]) : [];
}

function formDataToDecisionRecordInput(formData: FormData): CreateDecisionRecordInput {
  return {
    title: readString(formData, "title"),
    content: readString(formData, "content"),
    decisionText: readString(formData, "decisionText"),
    sourceType: readString(formData, "sourceType") as CreateDecisionRecordInput["sourceType"],
    sourceId: readString(formData, "sourceId"),
    organizationId: readString(formData, "organizationId"),
    projectId: readString(formData, "projectId"),
    projectIds: readArrayField(formData, "projectIds"),
    axisId: readString(formData, "axisId"),
    workstreamId: readString(formData, "workstreamId"),
    moduleId: readString(formData, "moduleId"),
    ownerId: readString(formData, "ownerId"),
    priority: readString(formData, "priority") as CreateDecisionRecordInput["priority"],
    kpi: readString(formData, "kpi"),
    dueDate: readString(formData, "dueDate"),
    status: readString(formData, "status") as CreateDecisionRecordInput["status"],
    decidedBy: readString(formData, "decidedBy"),
    linkedRecords: readLinkedRecords(formData)
  };
}

function formDataToUpdateDecisionRecordInput(formData: FormData): UpdateDecisionRecordInput {
  return updateDecisionRecordInputSchema.parse({
    decisionId: readString(formData, "decisionId"),
    title: readString(formData, "title"),
    content: readString(formData, "content"),
    decisionText: readString(formData, "decisionText"),
    organizationId: readString(formData, "organizationId"),
    projectId: readString(formData, "projectId"),
    projectIds: readOptionalArrayField(formData, "projectIds"),
    axisId: readString(formData, "axisId"),
    workstreamId: readString(formData, "workstreamId"),
    moduleId: readString(formData, "moduleId"),
    ownerId: readString(formData, "ownerId"),
    priority: readString(formData, "priority") as UpdateDecisionRecordInput["priority"],
    kpi: readString(formData, "kpi"),
    dueDate: readString(formData, "dueDate"),
    status: readString(formData, "status") as UpdateDecisionRecordInput["status"],
    reason: readString(formData, "reason"),
    linkedRecords: readString(formData, "linkedRecordsJson") ? readLinkedRecords(formData) : undefined
  });
}

function readAssignments(formData: FormData): CreateDecisionAssignmentsInput["assignments"] {
  const raw = readString(formData, "assignmentsJson");

  if (!raw) {
    const title = readString(formData, "assignmentTitle");

    return title
      ? [
          {
            projectId: readString(formData, "assignmentProjectId"),
            assigneeType:
              (readString(formData, "assignmentAssigneeType") as CreateDecisionAssignmentsInput["assignments"][number]["assigneeType"]) ??
              "project",
            assigneeId: readString(formData, "assignmentAssigneeId"),
            departmentId: readString(formData, "assignmentDepartmentId"),
            title,
            description: readString(formData, "assignmentDescription"),
            kpi: readString(formData, "assignmentKpi"),
            dueDate: readString(formData, "assignmentDueDate"),
            priority: readString(formData, "assignmentPriority") as CreateDecisionAssignmentsInput["assignments"][number]["priority"]
          }
        ]
      : [];
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as CreateDecisionAssignmentsInput["assignments"]) : [];
  } catch {
    throw new Error("Du lieu assignments khong hop le.");
  }
}

function formDataToDecisionAssignmentsInput(formData: FormData): CreateDecisionAssignmentsInput {
  return createDecisionAssignmentsInputSchema.parse({
    decisionId: readString(formData, "decisionId"),
    assignments: readAssignments(formData)
  });
}

function formDataToDecisionAssignmentLifecycleInput(formData: FormData) {
  return {
    assignmentId: readString(formData, "assignmentId") ?? "",
    status: readString(formData, "status") as Parameters<
      typeof updateDecisionAssignmentLifecycle
    >[0]["status"],
    reason: readString(formData, "reason"),
  };
}

function decisionCenterHref(decisionId: string, scopeId?: string) {
  const params = new URLSearchParams({
    view: "executive-decision-log",
    decisionId,
  });

  if (scopeId && scopeId !== "all") {
    params.set("scopeId", scopeId);
  }

  return `/command-center?${params.toString()}`;
}

function revalidateDecisionRecordPaths(decision: {
  meetingId?: string;
  projectId?: string;
  projectIds?: string[];
  sourceId?: string;
  sourceType?: string;
}) {
  revalidatePath("/executive/decision-log");
  revalidatePath("/executive/decisions");
  revalidatePath("/command-center");

  if (
    decision.sourceId &&
    (decision.sourceType === "approval" || decision.sourceType === "proposal")
  ) {
    revalidatePath(`/approvals/proposal/${decision.sourceId}`);
  }

  if (decision.meetingId) {
    revalidatePath(`/meetings/${decision.meetingId}`);
  }

  for (const projectId of [
    ...new Set([decision.projectId, ...(decision.projectIds ?? [])].filter(Boolean)),
  ]) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export async function createDecisionRecordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const decision = await createDecisionRecord(formDataToDecisionRecordInput(formData), currentUser);

  revalidateDecisionRecordPaths(decision);

  return decision;
}

export async function createDecisionAssignmentsAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await createDecisionAssignments(formDataToDecisionAssignmentsInput(formData), currentUser);

  revalidatePath("/tasks");
  revalidatePath("/executive/decision-log");
  revalidatePath("/executive/decisions");
  revalidatePath("/command-center");

  const projectIds = [
    ...new Set([
      ...result.assignments.map((assignment) => assignment.projectId),
      ...result.tasks.map((task) => task.projectId)
    ])
  ];

  for (const projectId of projectIds) {
    revalidatePath(`/projects/${projectId}`);
  }

  return result;
}

export async function updateDecisionRecordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const decision = await updateDecisionRecord(formDataToUpdateDecisionRecordInput(formData), currentUser);

  revalidateDecisionRecordPaths(decision);

  return decision;
}

export async function updateDecisionAssignmentLifecycleAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const result = await updateDecisionAssignmentLifecycle(
    formDataToDecisionAssignmentLifecycleInput(formData),
    currentUser,
  );

  revalidateDecisionRecordPaths(result.decision);
  revalidatePath("/tasks");

  const taskId = result.task?.id ?? result.assignment.taskId;

  if (taskId) {
    revalidatePath(`/tasks/${taskId}`);
  }

  for (const projectId of [
    ...new Set([
      result.assignment.projectId,
      result.task?.projectId,
      result.decision.projectId,
      ...(result.decision.projectIds ?? []),
    ].filter(Boolean)),
  ]) {
    revalidatePath(`/projects/${projectId}`);
  }

  return result;
}

function revalidateRiskRecordPaths(record: { projectId?: string; sourceType?: string }) {
  revalidatePath("/command-center");
  revalidatePath("/executive");

  if (record.sourceType === "decision") {
    revalidatePath("/executive/decision-log");
  }

  if (record.projectId) {
    revalidatePath(`/projects/${record.projectId}`);
  }
}

export async function createExecutiveRiskRecordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const record = await createExecutiveRiskRecord(
    formDataToRiskRecordInput(formData),
    currentUser,
  );

  revalidateRiskRecordPaths(record);

  return record;
}

export async function updateExecutiveRiskRecordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const record = await updateExecutiveRiskRecord(
    formDataToUpdateRiskRecordInput(formData),
    currentUser,
  );

  revalidateRiskRecordPaths(record);

  return record;
}

export async function overrideExecutiveRiskStatusAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const record = await overrideExecutiveRiskStatus(
    formDataToOverrideRiskStatusInput(formData),
    currentUser,
  );

  revalidateRiskRecordPaths(record);

  return record;
}

export async function closeExecutiveRiskRecordAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  const record = await closeExecutiveRiskRecord(
    formDataToCloseRiskRecordInput(formData),
    currentUser,
  );

  revalidateRiskRecordPaths(record);

  return record;
}

export async function createDecisionRecordStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  try {
    const decision = await createDecisionRecordAction(formData);

    return initialSuccess("Da luu decision.", {
      entityId: decision.id,
      href: decisionCenterHref(decision.id, readString(formData, "scopeId")),
    });
  } catch (error) {
    return actionError(error);
  }
}

export async function createExecutiveRiskRecordStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  const fields = fieldsFromFormData(formData, riskFormFieldKeys);

  try {
    await createExecutiveRiskRecordAction(formData);

    return initialSuccess("Da tao risk/blocker.");
  } catch (error) {
    return actionError(error, fields);
  }
}

export async function updateExecutiveRiskRecordStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  const fields = fieldsFromFormData(formData, riskFormFieldKeys);

  try {
    await updateExecutiveRiskRecordAction(formData);

    return initialSuccess("Da cap nhat risk/blocker.");
  } catch (error) {
    return actionError(error, fields);
  }
}

export async function overrideExecutiveRiskStatusStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  const fields = fieldsFromFormData(formData, riskOverrideFormFieldKeys);

  try {
    await overrideExecutiveRiskStatusAction(formData);

    return initialSuccess("Da xac nhan/override trang thai risk.");
  } catch (error) {
    return actionError(error, fields);
  }
}

export async function closeExecutiveRiskRecordStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  const fields = fieldsFromFormData(formData, riskCloseFormFieldKeys);

  try {
    await closeExecutiveRiskRecordAction(formData);

    return initialSuccess("Da dong risk/blocker.");
  } catch (error) {
    return actionError(error, fields);
  }
}

export async function createDecisionAssignmentsStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  try {
    await createDecisionAssignmentsAction(formData);

    return initialSuccess("Da giao viec tu decision.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDecisionRecordStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  try {
    await updateDecisionRecordAction(formData);

    return initialSuccess("Da cap nhat decision.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDecisionAssignmentLifecycleStateAction(
  _previousState: ExecutiveActionFormState,
  formData: FormData,
): Promise<ExecutiveActionFormState> {
  try {
    await updateDecisionAssignmentLifecycleAction(formData);

    return initialSuccess("Da cap nhat trang thai assignment.");
  } catch (error) {
    return actionError(error);
  }
}
