import { z } from "zod";

import { DECISION_STATUSES, TASK_PRIORITIES } from "@/constants/statuses";
import {
  MEETING_PARTICIPANT_SCOPES,
  MEETING_STATUSES,
  MEETING_TYPES,
  MEETING_VISIBILITIES
} from "@/modules/meetings/constants";

const decisionStatusKeys = Object.keys(DECISION_STATUSES) as [
  keyof typeof DECISION_STATUSES,
  ...Array<keyof typeof DECISION_STATUSES>
];
const decisionPriorityKeys = Object.keys(TASK_PRIORITIES) as [
  keyof typeof TASK_PRIORITIES,
  ...Array<keyof typeof TASK_PRIORITIES>
];
const decisionSourceTypeKeys = ["independent", "proposal", "approval", "meeting"] as const;
const decisionLinkedRecordTypeKeys = [
  "project",
  "proposal",
  "approval",
  "meeting",
  "task",
  "document",
  "risk",
  "custom"
] as const;
const decisionRelationTypeKeys = ["source", "context", "generated_action", "dependency"] as const;
const meetingTypeKeys = Object.keys(MEETING_TYPES) as [keyof typeof MEETING_TYPES, ...Array<keyof typeof MEETING_TYPES>];
const meetingVisibilityKeys = Object.keys(MEETING_VISIBILITIES) as [
  keyof typeof MEETING_VISIBILITIES,
  ...Array<keyof typeof MEETING_VISIBILITIES>
];
const meetingParticipantScopeKeys = Object.keys(MEETING_PARTICIPANT_SCOPES) as [
  keyof typeof MEETING_PARTICIPANT_SCOPES,
  ...Array<keyof typeof MEETING_PARTICIPANT_SCOPES>
];
const meetingStatusKeys = Object.keys(MEETING_STATUSES) as [keyof typeof MEETING_STATUSES, ...Array<keyof typeof MEETING_STATUSES>];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

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

const dateTimeString = z.string().trim().min(1, "Thời gian họp là bắt buộc.").refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Thời gian họp không hợp lệ."
});

const optionalDateTime = optionalText.refine((value) => !value || !Number.isNaN(Date.parse(value)), {
  message: "Thời gian kết thúc không hợp lệ."
});

const optionalDate = optionalText.refine((value) => !value || !Number.isNaN(Date.parse(value)), {
  message: "Hạn xử lý không hợp lệ."
});

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
    summary: optionalText
  });

function refineMeetingTime<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine((input) => !input.endTime || Date.parse(input.endTime) >= Date.parse(input.meetingDate), {
    message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
    path: ["endTime"]
  });
}

export const meetingInputSchema = refineMeetingTime(meetingBaseSchema);

export const meetingUpdateSchema = refineMeetingTime(meetingBaseSchema.omit({ projectId: true, projectIds: true }));

export const decisionInputSchema = z.object({
  meetingId: z.string().trim().min(1, "Cuộc họp là bắt buộc."),
  decisionText: z.string().trim().min(1, "Nội dung quyết định/action item là bắt buộc."),
  ownerId: optionalText,
  dueDate: optionalDate,
  status: z.enum(decisionStatusKeys)
});

const decisionScopeSchema = z.object({
  organizationId: optionalText,
  projectId: optionalText,
  projectIds: optionalStringArray,
  axisId: optionalText,
  workstreamId: optionalText,
  moduleId: optionalText
});

const decisionLinkedRecordSchema = z.object({
  type: z.enum(decisionLinkedRecordTypeKeys),
  id: z.string().trim().min(1, "Lien ket record thieu id."),
  relationType: z.enum(decisionRelationTypeKeys),
  title: optionalText
});

export const createDecisionRecordInputSchema = decisionScopeSchema
  .extend({
    title: optionalText,
    content: optionalText,
    decisionText: optionalText,
    source: z
      .object({
        type: z.enum(decisionSourceTypeKeys),
        id: optionalText
      })
      .optional(),
    sourceType: z.enum(decisionSourceTypeKeys).optional(),
    sourceId: optionalText,
    linkedRecords: z.array(decisionLinkedRecordSchema).default([]),
    ownerId: optionalText,
    priority: z.enum(decisionPriorityKeys).default("medium"),
    dueDate: optionalDate,
    status: z.enum(decisionStatusKeys).default("open"),
    decidedBy: optionalText,
    scope: decisionScopeSchema.optional()
  })
  .superRefine((input, context) => {
    if (!input.content && !input.decisionText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Noi dung quyet dinh la bat buoc.",
        path: ["decisionText"]
      });
    }
  });
