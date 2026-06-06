import { z } from "zod";

import { DECISION_STATUSES, TASK_PRIORITIES } from "@/constants/statuses";
import {
  MEETING_PARTICIPANT_SCOPES,
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES,
} from "@/modules/meetings/constants";

const decisionStatusKeys = Object.keys(DECISION_STATUSES) as [
  keyof typeof DECISION_STATUSES,
  ...Array<keyof typeof DECISION_STATUSES>,
];
const decisionPriorityKeys = Object.keys(TASK_PRIORITIES) as [
  keyof typeof TASK_PRIORITIES,
  ...Array<keyof typeof TASK_PRIORITIES>,
];
const decisionAssignmentStatusKeys = [
  "assigned",
  "in_progress",
  "done",
  "cancelled",
] as const;
const decisionAssignmentAssigneeTypeKeys = [
  "user",
  "department",
  "project",
] as const;
const decisionSourceTypeKeys = [
  "independent",
  "proposal",
  "approval",
  "meeting",
] as const;
const decisionLinkedRecordTypeKeys = [
  "project",
  "proposal",
  "approval",
  "meeting",
  "task",
  "document",
  "risk",
  "custom",
] as const;
const decisionRelationTypeKeys = [
  "source",
  "context",
  "generated_action",
  "dependency",
] as const;
const meetingRelatedRecordTypeKeys = [
  "proposal",
  "approval",
  "risk",
  "decision",
  "task",
  "document",
  "project",
  "custom",
] as const;
const meetingRelatedRecordRelationTypeKeys = [
  "source",
  "context",
  "generated_action",
  "dependency",
] as const;
const maxRelatedIdsPerType = 50;
const maxRelatedRecordIdLength = 160;
const maxRelatedRecordTitleLength = 200;
const maxMeetingRelatedRecords = 250;
const maxAttachmentNameLength = 200;
const maxAttachmentUrlLength = 500;
const maxMeetingMinutesLength = 20000;
const maxMeetingSummaryLength = 5000;
const maxAiSummaryLength = 12000;
const maxFollowUpTitleLength = 240;
const meetingTypeKeys = Object.keys(MEETING_TYPES) as [
  keyof typeof MEETING_TYPES,
  ...Array<keyof typeof MEETING_TYPES>,
];
const meetingVisibilityKeys = Object.keys(MEETING_VISIBILITIES) as [
  keyof typeof MEETING_VISIBILITIES,
  ...Array<keyof typeof MEETING_VISIBILITIES>,
];
const meetingParticipantScopeKeys = Object.keys(MEETING_PARTICIPANT_SCOPES) as [
  keyof typeof MEETING_PARTICIPANT_SCOPES,
  ...Array<keyof typeof MEETING_PARTICIPANT_SCOPES>,
];
const meetingStatusKeys = Object.keys(MEETING_STATUSES) as [
  keyof typeof MEETING_STATUSES,
  ...Array<keyof typeof MEETING_STATUSES>,
];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

function optionalBoundedText(maxLength: number, message: string) {
  return z
    .string()
    .trim()
    .max(maxLength, message)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();
}

function isHttpUrl(value: string | undefined) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalAttachmentUrl = optionalBoundedText(
  maxAttachmentUrlLength,
  "Attachment URL qua dai.",
).refine(isHttpUrl, "Attachment URL phai la http/https hop le.");

const optionalAttachmentDocumentId = z
  .string()
  .trim()
  .max(maxRelatedRecordIdLength, "Document id qua dai.")
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const optionalRelatedRecordTitle = z
  .string()
  .trim()
  .max(maxRelatedRecordTitleLength, "Tieu de related record qua dai.")
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const relatedRecordIdSchema = z
  .string()
  .trim()
  .min(1, "Related record thieu id.")
  .max(maxRelatedRecordIdLength, "Related record id qua dai.");

function isDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const optionalStringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) {
      return [];
    }

    const values = Array.isArray(value) ? value : value.split(",");

    return values.map((item) => item.trim()).filter(Boolean);
  });

const optionalStringArrayForUpdate = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    const values = Array.isArray(value) ? value : value.split(",");

    return values.map((item) => item.trim()).filter(Boolean);
  });

const optionalRelatedIdArray = optionalStringArray.pipe(
  z
    .array(relatedRecordIdSchema)
    .max(
      maxRelatedIdsPerType,
      `Khong duoc lien ket qua ${maxRelatedIdsPerType} record moi loai.`,
    ),
);

const optionalRelatedIdArrayForUpdate = optionalStringArrayForUpdate.pipe(
  z
    .array(relatedRecordIdSchema)
    .max(
      maxRelatedIdsPerType,
      `Khong duoc lien ket qua ${maxRelatedIdsPerType} record moi loai.`,
    )
    .optional(),
);

const meetingRelatedRecordSchema = z.object({
  type: z.enum(meetingRelatedRecordTypeKeys),
  id: relatedRecordIdSchema,
  relationType: z.enum(meetingRelatedRecordRelationTypeKeys).default("context"),
  title: optionalRelatedRecordTitle,
});

const isoTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function isIsoTimestamp(value: string) {
  return isoTimestampPattern.test(value) && !Number.isNaN(Date.parse(value));
}

const dateTimeString = z
  .string()
  .trim()
  .min(1, "Thời gian họp là bắt buộc.")
  .refine(isIsoTimestamp, {
    message: "Thời gian họp phải là ISO timestamp hợp lệ.",
  });

const optionalDateTime = optionalText.refine(
  (value) => !value || isIsoTimestamp(value),
  {
    message: "Thời gian kết thúc phải là ISO timestamp hợp lệ.",
  },
);

const optionalDate = optionalText.refine(
  (value) => !value || isDateOnly(value),
  {
    message: "Hạn xử lý không hợp lệ.",
  },
);

const meetingBaseSchema = z.object({
  organizationId: optionalText,
  projectId: optionalText,
  projectIds: optionalStringArray,
  axisId: optionalText,
  departmentId: optionalText,
  title: z.string().trim().min(1, "Tiêu đề cuộc họp là bắt buộc."),
  meetingType: z.enum(meetingTypeKeys).default("PROJECT_MEETING"),
  visibility: z.enum(meetingVisibilityKeys).default("project"),
  participantScope: z.enum(meetingParticipantScopeKeys).default("project_team"),
  status: z.enum(meetingStatusKeys).default("SCHEDULED"),
  meetingDate: dateTimeString,
  endTime: optionalDateTime,
  hostId: optionalText,
  participants: optionalStringArray,
  externalParticipants: optionalStringArray,
  roomId: optionalText,
  agenda: optionalText,
  meetingMinutes: optionalText,
  summary: optionalText,
  relatedApprovals: optionalRelatedIdArray,
  relatedTasks: optionalRelatedIdArray,
  relatedDecisions: optionalRelatedIdArray,
  relatedRisks: optionalRelatedIdArray,
  relatedDocuments: optionalRelatedIdArray,
  relatedRecords: z
    .array(meetingRelatedRecordSchema)
    .max(maxMeetingRelatedRecords)
    .default([]),
});

const meetingUpdateSchemaBase = meetingBaseSchema
  .omit({
    organizationId: true,
    projectId: true,
    projectIds: true,
    axisId: true,
    departmentId: true,
    relatedApprovals: true,
    relatedTasks: true,
    relatedDecisions: true,
    relatedRisks: true,
    relatedDocuments: true,
    relatedRecords: true,
  })
  .extend({
    relatedApprovals: optionalRelatedIdArrayForUpdate,
    relatedTasks: optionalRelatedIdArrayForUpdate,
    relatedDecisions: optionalRelatedIdArrayForUpdate,
    relatedRisks: optionalRelatedIdArrayForUpdate,
    relatedDocuments: optionalRelatedIdArrayForUpdate,
    visibleRelatedApprovals: optionalRelatedIdArrayForUpdate,
    visibleRelatedTasks: optionalRelatedIdArrayForUpdate,
    visibleRelatedDecisions: optionalRelatedIdArrayForUpdate,
    visibleRelatedRisks: optionalRelatedIdArrayForUpdate,
    visibleRelatedDocuments: optionalRelatedIdArrayForUpdate,
    relatedRecords: z
      .array(meetingRelatedRecordSchema)
      .max(maxMeetingRelatedRecords)
      .optional(),
  });

function refineMeetingTime<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (input) =>
      !input.endTime ||
      Date.parse(input.endTime) >= Date.parse(input.meetingDate),
    {
      message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
      path: ["endTime"],
    },
  );
}

export const meetingInputSchema = refineMeetingTime(
  meetingBaseSchema,
).superRefine((input, context) => {
  const projectIds = [input.projectId, ...(input.projectIds ?? [])].filter(
    Boolean,
  );

  if (projectIds.length === 0 && !input.organizationId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cuộc họp phải gắn với tổ chức hoặc ít nhất một dự án.",
      path: ["organizationId"],
    });
  }
});

export const meetingUpdateSchema = refineMeetingTime(meetingUpdateSchemaBase);

export const meetingMinutesUpdateInputSchema = z.object({
  meetingMinutes: optionalBoundedText(
    maxMeetingMinutesLength,
    "Meeting minutes qua dai.",
  ),
  summary: optionalBoundedText(
    maxMeetingSummaryLength,
    "Tom tat cuoc hop qua dai.",
  ),
});

export const meetingAttachmentInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ten attachment la bat buoc.")
      .max(maxAttachmentNameLength, "Ten attachment qua dai."),
    url: optionalAttachmentUrl,
    documentId: optionalAttachmentDocumentId,
  })
  .superRefine((input, context) => {
    if (!input.url && !input.documentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Attachment can external URL hoac documentId.",
        path: ["url"],
      });
    }
  });

export const meetingAttachmentRemoveInputSchema = z.object({
  attachmentId: z
    .string()
    .trim()
    .min(1, "Attachment la bat buoc.")
    .max(maxRelatedRecordIdLength, "Attachment id qua dai."),
});

export const meetingAiSummaryDraftInputSchema = z.object({
  content: optionalBoundedText(maxAiSummaryLength, "AI summary qua dai."),
});

export const meetingApprovalInputSchema = z.object({});

export const meetingFollowUpActionInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tieu de follow-up la bat buoc.")
    .max(maxFollowUpTitleLength, "Tieu de follow-up qua dai."),
  ownerId: optionalText,
  dueDate: optionalDate,
  status: z.enum(decisionStatusKeys).default("open"),
  createRelatedTask: z.boolean().optional(),
  taskProjectId: optionalText,
});

export const meetingFollowUpActionStatusInputSchema = z.object({
  status: z.enum(decisionStatusKeys),
});

export const meetingFollowUpTaskInputSchema = z.object({
  taskProjectId: optionalText,
});

export const meetingDecisionTrackingLinkInputSchema = z.object({
  decisionId: z
    .string()
    .trim()
    .min(1, "Decision la bat buoc.")
    .max(maxRelatedRecordIdLength, "Decision id qua dai."),
});

export const decisionInputSchema = z.object({
  meetingId: z.string().trim().min(1, "Cuộc họp là bắt buộc."),
  decisionText: z
    .string()
    .trim()
    .min(1, "Nội dung quyết định/action item là bắt buộc."),
  ownerId: optionalText,
  dueDate: optionalDate,
  status: z.enum(decisionStatusKeys),
});

const decisionScopeSchema = z.object({
  organizationId: optionalText,
  projectId: optionalText,
  projectIds: optionalStringArray,
  axisId: optionalText,
  workstreamId: optionalText,
  moduleId: optionalText,
});

const decisionUpdateScopeSchema = z.object({
  organizationId: optionalText,
  projectId: optionalText,
  projectIds: optionalStringArrayForUpdate,
  axisId: optionalText,
  workstreamId: optionalText,
  moduleId: optionalText,
});

const decisionLinkedRecordSchema = z.object({
  type: z.enum(decisionLinkedRecordTypeKeys),
  id: z.string().trim().min(1, "Lien ket record thieu id."),
  relationType: z.enum(decisionRelationTypeKeys),
  title: optionalText,
});

export const createDecisionRecordInputSchema = decisionScopeSchema
  .extend({
    title: optionalText,
    content: optionalText,
    decisionText: optionalText,
    source: z
      .object({
        type: z.enum(decisionSourceTypeKeys),
        id: optionalText,
      })
      .optional(),
    sourceType: z.enum(decisionSourceTypeKeys).optional(),
    sourceId: optionalText,
    linkedRecords: z.array(decisionLinkedRecordSchema).default([]),
    ownerId: optionalText,
    priority: z.enum(decisionPriorityKeys).default("medium"),
    kpi: optionalText,
    dueDate: optionalDate,
    status: z.enum(decisionStatusKeys).default("open"),
    decidedBy: optionalText,
    scope: decisionScopeSchema.optional(),
  })
  .superRefine((input, context) => {
    if (!input.content && !input.decisionText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Noi dung quyet dinh la bat buoc.",
        path: ["decisionText"],
      });
    }
  });

export const updateDecisionRecordInputSchema = decisionUpdateScopeSchema.extend(
  {
    decisionId: z.string().trim().min(1, "Decision la bat buoc."),
    title: optionalText,
    content: optionalText,
    decisionText: optionalText,
    linkedRecords: z.array(decisionLinkedRecordSchema).optional(),
    ownerId: optionalText,
    priority: z.enum(decisionPriorityKeys).optional(),
    kpi: optionalText,
    dueDate: optionalDate,
    status: z.enum(decisionStatusKeys).optional(),
    reason: optionalText,
    scope: decisionUpdateScopeSchema.optional(),
  },
);

const decisionAssignmentInputSchema = z
  .object({
    projectId: optionalText,
    assigneeType: z.enum(decisionAssignmentAssigneeTypeKeys),
    assigneeId: optionalText,
    departmentId: optionalText,
    title: z.string().trim().min(1, "Tieu de assignment la bat buoc."),
    description: optionalText,
    kpi: optionalText,
    dueDate: optionalDate,
    priority: z.enum(decisionPriorityKeys).default("medium"),
  })
  .superRefine((input, context) => {
    if (input.assigneeType === "user" && !input.assigneeId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nguoi nhan assignment la bat buoc.",
        path: ["assigneeId"],
      });
    }

    if (input.assigneeType === "department" && !input.departmentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phong ban nhan assignment la bat buoc.",
        path: ["departmentId"],
      });
    }
  });

export const createDecisionAssignmentsInputSchema = z.object({
  decisionId: z.string().trim().min(1, "Decision la bat buoc."),
  assignments: z
    .array(decisionAssignmentInputSchema)
    .min(1, "Can it nhat mot assignment."),
});

export const decisionAssignmentStatusSchema = z.enum(
  decisionAssignmentStatusKeys,
);
