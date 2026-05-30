import { createHash } from "node:crypto";

import type {
  NotificationOutboxItem,
  NotificationOutboxRecipient,
  NotificationOutboxScope,
  NotificationOutboxSourceType,
} from "@/lib/notifications/types";
import type {
  ApprovalEscalationTrigger,
  ApprovalOverdueSeverity,
} from "@/modules/executive/types";

import {
  notificationRepository,
  type NotificationRepository,
} from "./notification-repository";

export type { NotificationRepository } from "./notification-repository";

type MockNotificationInput = {
  nextAction: string;
  policyId?: string;
  policyLabel?: string;
  reason: string;
  recipients: NotificationOutboxRecipient[];
  severity: Exclude<ApprovalOverdueSeverity, "none" | "warning">;
  scope?: NotificationOutboxScope;
  sourceId: string;
  sourceType: NotificationOutboxSourceType;
  title: string;
  trigger: Exclude<ApprovalEscalationTrigger, "none">;
};

type MockNotificationOptions = {
  now?: Date;
  repository?: NotificationRepository;
};

function dedupeKey(input: MockNotificationInput) {
  return `${input.sourceType}:${input.sourceId}:${input.policyId ?? "no-policy"}:${input.trigger}`;
}

function stableId(key: string) {
  return `mock-notification-${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
}

function sortRecipients(recipients: NotificationOutboxRecipient[]) {
  return [...recipients].sort((left, right) =>
    `${left.kind}:${left.userId ?? ""}:${left.roleKey ?? ""}:${left.delegationId ?? ""}`.localeCompare(
      `${right.kind}:${right.userId ?? ""}:${right.roleKey ?? ""}:${right.delegationId ?? ""}`,
    ),
  );
}

function equivalentNotification(
  left: NotificationOutboxItem,
  right: NotificationOutboxItem,
) {
  return (
    left.title === right.title &&
    left.reason === right.reason &&
    left.nextAction === right.nextAction &&
    left.severity === right.severity &&
    left.trigger === right.trigger &&
    left.policyId === right.policyId &&
    left.policyLabel === right.policyLabel &&
    left.axisId === right.axisId &&
    left.moduleId === right.moduleId &&
    left.organizationId === right.organizationId &&
    left.projectId === right.projectId &&
    left.recordId === right.recordId &&
    left.workstreamId === right.workstreamId &&
    JSON.stringify(sortRecipients(left.recipients)) ===
      JSON.stringify(sortRecipients(right.recipients))
  );
}

export async function ensureMockNotificationOutboxItem(
  input: MockNotificationInput,
  options: MockNotificationOptions = {},
) {
  const repository = options.repository ?? notificationRepository;
  const timestamp = (options.now ?? new Date()).toISOString();
  const key = dedupeKey(input);
  const existing = await repository.getByDedupeKey(key);
  const baseItem: NotificationOutboxItem = {
    channel: "mock",
    createdAt: existing?.createdAt ?? timestamp,
    dedupeKey: key,
    id: existing?.id ?? stableId(key),
    nextAction: input.nextAction,
    policyId: input.policyId,
    policyLabel: input.policyLabel,
    reason: input.reason,
    recipients: sortRecipients(input.recipients),
    ...input.scope,
    severity: input.severity,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    status: existing ? "updated" : "queued",
    title: input.title,
    trigger: input.trigger,
    updatedAt: timestamp,
  };

  if (existing && equivalentNotification(existing, baseItem)) {
    return {
      changed: false,
      changeType: "unchanged" as const,
      item: existing,
      previous: existing,
    };
  }

  const item = await repository.upsert(baseItem);

  return {
    changed: true,
    changeType: existing ? ("updated" as const) : ("created" as const),
    item,
    previous: existing,
  };
}
