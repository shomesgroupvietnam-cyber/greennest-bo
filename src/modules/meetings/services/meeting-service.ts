import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";
import type { TaskRepository } from "@/modules/tasks/services/task-repository";
import { taskRepository } from "@/modules/tasks/services/task-repository";
import { createTask } from "@/modules/tasks/services/task-service";
import type {
  Decision,
  DecisionInput,
  DecisionListFilters,
  Meeting,
  MeetingInput,
  MeetingListFilters,
  MeetingUpdateInput
} from "@/modules/meetings/types";
import { decisionInputSchema, meetingInputSchema, meetingUpdateSchema } from "@/modules/meetings/validation";

import { meetingRepository, type MeetingRepository } from "./meeting-repository";

function createId() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

export async function listMeetings(filters: MeetingListFilters = {}, repository: MeetingRepository = meetingRepository) {
  return repository.listMeetings(filters);
}

export async function getMeeting(meetingId: string, repository: MeetingRepository = meetingRepository) {
  return repository.getMeeting(meetingId);
}

export async function createMeeting(
  input: MeetingInput,
  createdBy: string,
  repository: MeetingRepository = meetingRepository,
  projects: ProjectRepository = projectRepository
) {
  const parsedInput = meetingInputSchema.parse(input);
  const project = await projects.getProject(parsedInput.projectId);

  if (!project || project.archivedAt) {
    throw new Error("Dá»± Ã¡n khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ Ä‘Æ°á»£c lÆ°u trá»¯.");
  }

  const timestamp = now();
  const meeting: Meeting = {
    id: createId(),
    projectId: parsedInput.projectId,
    title: parsedInput.title,
    meetingDate: new Date(parsedInput.meetingDate).toISOString(),
    summary: parsedInput.summary,
    createdBy,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return repository.createMeeting(meeting);
}

export async function updateMeeting(
  meetingId: string,
  input: MeetingUpdateInput,
  repository: MeetingRepository = meetingRepository
) {
  const parsedInput = meetingUpdateSchema.parse(input);
  const existingMeeting = await repository.getMeeting(meetingId);

  if (!existingMeeting) {
    throw new Error("KhÃ´ng tÃ¬m tháº¥y cuá»™c há»p.");
  }

  return repository.updateMeeting(meetingId, {
    title: parsedInput.title,
    meetingDate: new Date(parsedInput.meetingDate).toISOString(),
    summary: parsedInput.summary,
    updatedAt: now()
  });
}

export async function listDecisions(filters: DecisionListFilters = {}, repository: MeetingRepository = meetingRepository) {
  return repository.listDecisions(filters);
}

export async function getDecision(decisionId: string, repository: MeetingRepository = meetingRepository) {
  return repository.getDecision(decisionId);
}

export async function createDecision(
  input: DecisionInput,
  repository: MeetingRepository = meetingRepository
) {
  const parsedInput = decisionInputSchema.parse(input);
  const meeting = await repository.getMeeting(parsedInput.meetingId);

  if (!meeting) {
    throw new Error("KhÃ´ng tÃ¬m tháº¥y cuá»™c há»p.");
  }

  const timestamp = now();
  const decision: Decision = {
    id: createId(),
    meetingId: meeting.id,
    projectId: meeting.projectId,
    decisionText: parsedInput.decisionText,
    ownerId: parsedInput.ownerId,
    dueDate: parsedInput.dueDate,
    status: parsedInput.status,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return repository.createDecision(decision);
}

export async function convertDecisionToTask(
  decisionId: string,
  repository: MeetingRepository = meetingRepository,
  tasks: TaskRepository = taskRepository,
  projects: ProjectRepository = projectRepository
) {
  const decision = await repository.getDecision(decisionId);

  if (!decision) {
    throw new Error("KhÃ´ng tÃ¬m tháº¥y quyáº¿t Ä‘á»‹nh/action item.");
  }

  if (decision.taskId) {
    throw new Error("Action item nÃ y Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn thÃ nh cÃ´ng viá»‡c.");
  }

  const meeting = decision.meetingId ? await repository.getMeeting(decision.meetingId) : undefined;
  const task = await createTask(
    {
      projectId: decision.projectId,
      title: decision.decisionText,
      description: [
        "CÃ´ng viá»‡c Ä‘Æ°á»£c táº¡o tá»« quyáº¿t Ä‘á»‹nh/action item cuá»™c há»p.",
        meeting ? `Cuá»™c há»p: ${meeting.title}` : undefined
      ]
        .filter(Boolean)
        .join("\n"),
      assigneeId: decision.ownerId,
      dueDate: decision.dueDate,
      status: "todo",
      priority: "medium",
      category: "meeting"
    },
    tasks,
    projects
  );

  await repository.updateDecision(decision.id, {
    taskId: task.id,
    status: "in_progress",
    updatedAt: now()
  });

  return task;
}
