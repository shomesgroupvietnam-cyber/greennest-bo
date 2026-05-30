import type {
  ApprovalEscalationTarget,
  ApprovalEscalationTrigger,
  ApprovalOverdueSeverity,
} from "@/modules/executive/types";
import type { PolicyScope } from "@/modules/settings/types";

export type NotificationChannel = "mock";

export type NotificationOutboxStatus =
  | "queued"
  | "updated"
  | "acknowledged";

export type NotificationOutboxSourceType =
  | "proposal"
  | "leadership_approval"
  | "executive_action";

export type NotificationOutboxRecipient = Pick<
  ApprovalEscalationTarget,
  "delegationId" | "kind" | "label" | "roleKey" | "userId"
>;

export type NotificationOutboxScope = Pick<
  PolicyScope,
  "axisId" | "moduleId" | "organizationId" | "projectId" | "recordId" | "workstreamId"
>;

export type NotificationOutboxItem = NotificationOutboxScope & {
  id: string;
  dedupeKey: string;
  channel: NotificationChannel;
  sourceType: NotificationOutboxSourceType;
  sourceId: string;
  title: string;
  reason: string;
  nextAction: string;
  severity: Exclude<ApprovalOverdueSeverity, "none" | "warning">;
  trigger: Exclude<ApprovalEscalationTrigger, "none">;
  status: NotificationOutboxStatus;
  policyId?: string;
  policyLabel?: string;
  recipients: NotificationOutboxRecipient[];
  createdAt: string;
  updatedAt: string;
};
