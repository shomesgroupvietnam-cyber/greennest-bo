import type { PermissionUser } from "@/lib/permissions/can";
import { ensureMockNotificationOutboxItem } from "@/lib/notifications/notification-service";
import type { NotificationRepository } from "@/lib/notifications/notification-repository";
import type {
  NotificationOutboxItem,
  NotificationOutboxRecipient,
  NotificationOutboxScope,
  NotificationOutboxSourceType,
} from "@/lib/notifications/types";
import type {
  ApprovalEscalationState,
  ApprovalEscalationTarget,
  ApprovalOverdueState,
} from "@/modules/executive/types";
import type { AuditLog } from "@/modules/users/types";
import { createAuditLog } from "@/modules/users/services/user-service";

type AuditWriter = (input: Omit<AuditLog, "id" | "createdAt">) => Promise<AuditLog>;

export type ApprovalEscalationNotificationSource = {
  code?: string;
  scope?: NotificationOutboxScope;
  sourceId: string;
  sourceType: NotificationOutboxSourceType;
  title: string;
};

export type ApprovalEscalationNotificationOptions = {
  auditWriter?: AuditWriter;
  notificationRepository?: NotificationRepository;
  now?: Date;
};

export type ApprovalEscalationNotificationResult = {
  auditLog?: AuditLog;
  escalation: ApprovalEscalationState;
};

let escalationSideEffectQueue: Promise<unknown> = Promise.resolve();

function runEscalationSideEffect<T>(operation: () => Promise<T>) {
  const result = escalationSideEffectQueue.then(operation, operation);

  escalationSideEffectQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

function notificationSeverity(overdue: ApprovalOverdueState) {
  return overdue.severity === "critical" ? "critical" : "overdue";
}

function notificationTitleFor(source: ApprovalEscalationNotificationSource) {
  return `Approval qua han: ${source.code ?? source.sourceId} - ${source.title}`;
}

function auditActionPrefix(sourceType: NotificationOutboxSourceType) {
  return sourceType === "proposal" ? "proposal" : "approval";
}

function auditEntityType(sourceType: NotificationOutboxSourceType) {
  return sourceType === "proposal" ? "proposal" : "approval";
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

function notificationAuditValue(
  item: NotificationOutboxItem,
  escalation?: ApprovalEscalationState,
) {
  return {
    notificationId: item.id,
    policyId: item.policyId,
    policyLabel: item.policyLabel,
    reason: item.reason,
    severity: item.severity,
    status: item.status,
    targetCount: item.recipients.length,
    targets: item.recipients.map(targetSummary),
    thresholdDays: escalation?.thresholdDays,
    trigger: item.trigger,
  };
}

export async function queueApprovalEscalationNotification(
  input: {
    escalation: ApprovalEscalationState;
    overdue: ApprovalOverdueState;
    source: ApprovalEscalationNotificationSource;
    user: PermissionUser;
  },
  options: ApprovalEscalationNotificationOptions = {},
): Promise<ApprovalEscalationNotificationResult> {
  const trigger = input.escalation.trigger;

  if (!input.escalation.required || trigger === "none") {
    return { escalation: input.escalation };
  }

  return runEscalationSideEffect(async () => {
    const result = await ensureMockNotificationOutboxItem(
      {
        nextAction: input.overdue.nextAction,
        policyId: input.escalation.policyId,
        policyLabel: input.escalation.policyLabel,
        reason: input.escalation.reason ?? input.overdue.reason,
        recipients: input.escalation.targets.map(targetSummary),
        scope: input.source.scope,
        severity: notificationSeverity(input.overdue),
        sourceId: input.source.sourceId,
        sourceType: input.source.sourceType,
        title: notificationTitleFor(input.source),
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
      const actionPrefix = auditActionPrefix(input.source.sourceType);

      auditLog = await auditWriter({
        actorId: input.user.id,
        action:
          result.changeType === "created"
            ? `${actionPrefix}.escalation_queued`
            : `${actionPrefix}.escalation_updated`,
        entityId: input.source.sourceId,
        entityType: auditEntityType(input.source.sourceType),
        oldValue: result.previous
          ? notificationAuditValue(result.previous, input.escalation)
          : undefined,
        newValue: notificationAuditValue(result.item, input.escalation),
      });
    }

    return {
      auditLog,
      escalation: {
        ...input.escalation,
        notificationId: result.item.id,
        status: result.item.status,
      } satisfies ApprovalEscalationState,
    };
  });
}
