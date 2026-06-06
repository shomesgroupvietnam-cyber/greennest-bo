import { createHash } from "node:crypto";

import type { PermissionUser } from "@/lib/permissions/can";
import type {
  NotificationOutboxItem,
  NotificationOutboxRecipient,
  NotificationOutboxScope,
  NotificationOutboxSourceType,
} from "@/lib/notifications/types";
import type {
  ApprovalEscalationState,
  ApprovalEscalationTarget,
  ApprovalEscalationTrigger,
  ApprovalOverdueState,
  ApprovalOverdueSeverity,
} from "@/modules/executive/types";
import { createAuditLog } from "@/modules/users/services/user-service";
import type { AuditLog } from "@/modules/users/types";

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

type RiskEscalationNotificationSource = {
  ownerId?: string;
  ownerLabel?: string;
  scope?: NotificationOutboxScope;
  sourceId: string;
  title: string;
};

type RiskEscalationNotificationOptions = {
  auditWriter?: (input: Omit<AuditLog, "id" | "createdAt">) => Promise<AuditLog>;
  notificationRepository?: NotificationRepository;
  now?: Date;
};

type RiskEscalationNotificationResult = {
  auditLog?: AuditLog;
  escalation: ApprovalEscalationState;
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

function riskNotificationSeverity(overdue: ApprovalOverdueState) {
  return overdue.severity === "critical" ? "critical" : "overdue";
}

function targetSummary(target: ApprovalEscalationTarget | NotificationOutboxRecipient) {
  return {
    delegationId: target.delegationId,
    kind: target.kind,
    label: target.label,
    roleKey: target.roleKey,
    userId: target.userId,
  };
}

function riskNotificationAuditValue(
  item: NotificationOutboxItem,
  escalation?: ApprovalEscalationState,
  overdue?: ApprovalOverdueState,
  source?: RiskEscalationNotificationSource,
) {
  return {
    axisId: item.axisId,
    daysOverdue: overdue?.daysOverdue,
    moduleId: item.moduleId,
    notificationId: item.id,
    organizationId: item.organizationId,
    ownerId: source?.ownerId,
    ownerLabel: source?.ownerLabel,
    policyId: item.policyId,
    policyLabel: item.policyLabel,
    projectId: item.projectId,
    recordId: item.recordId,
    reason: item.reason,
    severity: item.severity,
    status: item.status,
    targetCount: item.recipients.length,
    targets: item.recipients.map(targetSummary),
    thresholdDays: escalation?.thresholdDays,
    trigger: item.trigger,
  };
}

export async function queueRiskEscalationNotification(
  input: {
    escalation: ApprovalEscalationState;
    overdue: ApprovalOverdueState;
    source: RiskEscalationNotificationSource;
    user: PermissionUser;
  },
  options: RiskEscalationNotificationOptions = {},
): Promise<RiskEscalationNotificationResult> {
  const trigger = input.escalation.trigger;

  if (!input.escalation.required || trigger === "none") {
    return { escalation: input.escalation };
  }

  const result = await ensureMockNotificationOutboxItem(
    {
      nextAction: input.overdue.nextAction,
      policyId: input.escalation.policyId,
      policyLabel: input.escalation.policyLabel,
      reason: input.escalation.reason ?? input.overdue.reason,
      recipients: input.escalation.targets.map(targetSummary),
      scope: input.source.scope,
      severity: riskNotificationSeverity(input.overdue),
      sourceId: input.source.sourceId,
      sourceType: "risk",
      title: `Risk qua han: ${input.source.sourceId} - ${input.source.title}`,
      trigger,
    },
    {
      repository: options.notificationRepository,
      now: options.now,
    },
  );
  let auditLog: AuditLog | undefined;

  if (result.changed) {
    const auditWriter = options.auditWriter ?? createAuditLog;

    auditLog = await auditWriter({
      actorId: input.user.id,
      action:
        result.changeType === "created"
          ? "risk.escalation_queued"
          : "risk.escalation_updated",
      entityId: input.source.sourceId,
      entityType: "risk",
      oldValue: result.previous
        ? riskNotificationAuditValue(
            result.previous,
            input.escalation,
            input.overdue,
            input.source,
          )
        : undefined,
      newValue: riskNotificationAuditValue(
        result.item,
        input.escalation,
        input.overdue,
        input.source,
      ),
    });
  }

  return {
    auditLog,
    escalation: {
      ...input.escalation,
      notificationId: result.item.id,
      status: result.item.status,
    },
  };
}
