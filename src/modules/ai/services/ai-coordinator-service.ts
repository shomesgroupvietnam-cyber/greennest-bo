import type { PermissionAction, PermissionUser } from "@/lib/permissions/can";
import { can } from "@/lib/permissions/can";
import {
  filterDecisionsForScope,
  filterDocumentsForScope,
  filterLegalStepsForScope,
  filterMeetingsForScope,
  filterProjectsForScope,
  filterTasksForScope,
  resolveAccessScope
} from "@/lib/permissions/access-scope";
import type { DocumentRepository } from "@/modules/documents/services/document-repository";
import { documentRepository } from "@/modules/documents/services/document-repository";
import type { DocumentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { documentRequirementRepository } from "@/modules/documents/services/document-requirement-repository";
import { calculateProjectDocumentReadiness } from "@/modules/documents/services/document-readiness-service";
import type { LegalRepository } from "@/modules/legal/services/legal-repository";
import { legalRepository } from "@/modules/legal/services/legal-repository";
import type { MeetingRepository } from "@/modules/meetings/services/meeting-repository";
import { meetingRepository } from "@/modules/meetings/services/meeting-repository";
import {
  buildKnowledgeRetrievalContext,
  retrieveKnowledgeChunks
} from "@/modules/knowledge/services/knowledge-indexing-service";
import type { KnowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";
import { knowledgeIndexRepository } from "@/modules/knowledge/services/knowledge-index-repository";
import type { ProjectRepository } from "@/modules/projects/services/project-repository";
import { projectRepository } from "@/modules/projects/services/project-repository";
import type { ReportRepository } from "@/modules/reports/services/report-repository";
import { reportRepository } from "@/modules/reports/services/report-repository";
import type { TaskRepository } from "@/modules/tasks/services/task-repository";
import { taskRepository } from "@/modules/tasks/services/task-repository";
import type { UserRepository } from "@/modules/users/services/user-repository";
import { userRepository } from "@/modules/users/services/user-repository";

import type { AiActionProposal, AiCitation, AiJob, AiModule, AiUsageMetadata } from "../types";
import { getAiProviderFromEnv, type AiProvider, type AiProviderMetadata } from "./ai-provider";
import { buildAiPromptPackage, type AiPromptPackage } from "./ai-prompt-builder";

export type AiCoordinatorRepositories = {
  projects?: ProjectRepository;
  tasks?: TaskRepository;
  documents?: DocumentRepository;
  requirements?: DocumentRequirementRepository;
  legal?: LegalRepository;
  meetings?: MeetingRepository;
  reports?: ReportRepository;
  users?: UserRepository;
  knowledgeIndex?: KnowledgeIndexRepository;
};

export type AiContextBlock = {
  key: string;
  title: string;
  module: AiModule;
  content: string;
  recordCount: number;
};

export type AiCoordinatorCitationDraft = Omit<AiCitation, "id" | "interactionId" | "jobId" | "createdAt">;
export type AiActionProposalDraft = Omit<
  AiActionProposal,
  "id" | "interactionId" | "jobId" | "requestedBy" | "createdAt" | "updatedAt"
>;

export type AiRoutingPlan = {
  intent: string;
  primaryModule: AiModule;
  supportingModules: AiModule[];
  toolKeys: string[];
};

export type AiCoordinatorResult = {
  routingPlan: AiRoutingPlan;
  contextBlocks: AiContextBlock[];
  ragContext: string;
  citations: AiCoordinatorCitationDraft[];
  actionProposals: AiActionProposalDraft[];
  responseText: string;
  providerMetadata: AiProviderMetadata;
  promptPackage: AiPromptPackage;
  usage?: AiUsageMetadata;
  usedLength: number;
  maxLength: number;
  truncated: boolean;
};

type ScopeDataset = Awaited<ReturnType<typeof loadScopeDataset>>;

const DEFAULT_CONTEXT_BUDGET = 5000;

export async function runAiCoordinator(
  job: AiJob,
  user: PermissionUser,
  repositories: AiCoordinatorRepositories = {},
  options: { maxLength?: number; provider?: AiProvider } = {}
): Promise<AiCoordinatorResult> {
  const repos = resolveCoordinatorRepositories(repositories);
  const scopeDataset = buildUserScopeDataset(await loadScopeDataset(repos), user);
  const routingPlan = classifyIntentAndRoute(job);
  const approvalAssistant = job.intent === "AI Approval Assistant";
  const toolResults = approvalAssistant
    ? []
    : await Promise.all([
        getProjectContext({ job, user, repositories: repos, scopeDataset }),
        getTaskContext({ job, user, repositories: repos, scopeDataset }),
        getDocumentReadinessContext({ job, user, repositories: repos, scopeDataset }),
        getLegalStatusContext({ job, user, repositories: repos, scopeDataset }),
        getMeetingDecisionContext({ job, user, repositories: repos, scopeDataset }),
        getReportSnapshotContext({ job, user, repositories: repos, scopeDataset }),
        retrieveKnowledgeContext({ job, user, repositories: repos })
      ]);
  const contextBlocks = approvalAssistant ? [] : toolResults.flatMap((result) => result.blocks);
  const promptJob = sanitizeJobForScope(job, scopeDataset);
  const citations = approvalAssistant
    ? approvalAssistantCitations(promptJob)
    : toolResults.flatMap((result) => result.citations);
  const ragContext = approvalAssistant ? "" : toolResults.find((result) => result.key === "knowledge")?.content ?? "";
  const actionProposals = createActionProposal(job, user, scopeDataset);
  const promptPackage = buildAiPromptPackage({
    job: promptJob,
    routingPlan,
    contextBlocks,
    ragContext,
    citations,
    maxContextChars: options.maxLength ?? DEFAULT_CONTEXT_BUDGET
  });
  const provider = options.provider ?? getAiProviderFromEnv();
  const providerResult = await provider.generateAnswer({
    job: promptJob,
    routingPlan,
    contextBlocks: promptPackage.contextBlocks,
    ragContext: promptPackage.ragContext,
    citations,
    actionProposalCount: actionProposals.length,
    truncated: promptPackage.truncated,
    promptPackage
  });

  return {
    routingPlan,
    contextBlocks: promptPackage.contextBlocks,
    ragContext: promptPackage.ragContext,
    citations,
    actionProposals,
    responseText: providerResult.text,
    providerMetadata: providerResult.metadata,
    promptPackage,
    usage: providerResult.usage,
    usedLength: promptPackage.usedContextChars,
    maxLength: promptPackage.maxContextChars,
    truncated: promptPackage.truncated
  };
}

export function classifyIntentAndRoute(job: Pick<AiJob, "module" | "intent" | "payload">): AiRoutingPlan {
  const text = `${job.module} ${job.intent} ${job.payload.prompt}`.toLowerCase();
  const supportingModules = new Set<AiModule>();

  if (job.module === "project" || includesAny(text, ["risk", "rui ro", "blocked", "chan", "tong hop", "summary"])) {
    ["tasks", "documents", "legal", "meetings", "reports"].forEach((module) => supportingModules.add(module as AiModule));
  }

  if (job.module === "tasks" || includesAny(text, ["task", "cong viec", "qua han", "deadline", "action"])) {
    ["project", "tasks", "meetings"].forEach((module) => supportingModules.add(module as AiModule));
  }

  if (job.module === "documents" || includesAny(text, ["ho so", "document", "missing", "thieu", "cap nhat"])) {
    ["project", "documents", "legal"].forEach((module) => supportingModules.add(module as AiModule));
  }

  if (job.module === "legal" || includesAny(text, ["phap ly", "legal", "blocked", "authority", "co quan"])) {
    ["project", "legal", "documents", "meetings"].forEach((module) => supportingModules.add(module as AiModule));
  }

  if (job.module === "meetings" || includesAny(text, ["hop", "meeting", "decision", "quyet dinh"])) {
    ["project", "meetings", "tasks"].forEach((module) => supportingModules.add(module as AiModule));
  }

  if (job.module === "reports" || includesAny(text, ["bao cao", "report", "weekly", "tuan"])) {
    ["project", "reports", "tasks", "documents", "legal", "meetings"].forEach((module) => supportingModules.add(module as AiModule));
  }

  supportingModules.delete(job.module);

  return {
    intent: job.intent,
    primaryModule: job.module,
    supportingModules: [...supportingModules],
    toolKeys: ["project", "tasks", "documents", "legal", "meetings", "reports", "knowledge"]
  };
}

export async function getProjectContext(input: CoordinatorToolInput) {
  if (!can(input.user, "project.view")) {
    return emptyToolResult("project");
  }

  const projects = filterByProjectId(filterProjectsForScope(input.scopeDataset.projects, input.scopeDataset.scope), input.job.projectId);
  const visibleProjects = projects.slice(0, 5);

  return {
    key: "project",
    content: visibleProjects.map((project) => `${project.code} - ${project.name}: ${project.status}`).join("\n"),
    blocks:
      visibleProjects.length > 0
        ? [
            {
              key: "project",
              title: "Du an trong scope",
              module: "project" as const,
              content: visibleProjects
                .map((project) =>
                  [
                    `${project.code} - ${project.name}`,
                    `Trang thai: ${project.status}`,
                    project.location ? `Vi tri: ${project.location}` : undefined,
                    project.projectType ? `Loai du an: ${project.projectType}` : undefined
                  ]
                    .filter(Boolean)
                    .join(" | ")
                )
                .join("\n"),
              recordCount: visibleProjects.length
            }
          ]
        : [],
    citations: visibleProjects.map((project) => internalCitation("project", project.id, `${project.code} - ${project.name}`, project.id))
  };
}

export async function getTaskContext(input: CoordinatorToolInput) {
  if (!can(input.user, "task.view")) {
    return emptyToolResult("tasks");
  }

  const tasks = filterByProjectId(filterTasksForScope(input.scopeDataset.tasks, input.scopeDataset.scope), input.job.projectId);
  const overdue = tasks.filter((task) => task.dueDate && task.status !== "done" && task.dueDate < todayString());
  const upcoming = tasks.filter((task) => task.dueDate && task.status !== "done" && task.dueDate >= todayString()).slice(0, 5);
  const importantTasks = [
    ...new Map(
      [...overdue, ...upcoming, ...tasks.filter((task) => task.priority === "high" || task.priority === "urgent")].map((task) => [
        task.id,
        task
      ])
    ).values()
  ].slice(0, 8);

  return {
    key: "tasks",
    content: importantTasks.map((task) => `${task.title} (${task.status}, ${task.priority})`).join("\n"),
    blocks:
      tasks.length > 0
        ? [
            {
              key: "tasks",
              title: "Cong viec lien quan",
              module: "tasks" as const,
              content: [
                `Tong so cong viec trong scope: ${tasks.length}`,
                `Qua han: ${overdue.length}`,
                `Sap den han: ${upcoming.length}`,
                ...importantTasks.map((task) => `- ${task.title} | ${task.status} | ${task.priority} | ${task.dueDate ?? "chua co han"}`)
              ].join("\n"),
              recordCount: tasks.length
            }
          ]
        : [],
    citations: importantTasks.map((task) => internalCitation("task", task.id, task.title, task.projectId))
  };
}

export async function getDocumentReadinessContext(input: CoordinatorToolInput) {
  if (!can(input.user, "document.view")) {
    return emptyToolResult("documents");
  }

  const projects = filterByProjectId(filterProjectsForScope(input.scopeDataset.projects, input.scopeDataset.scope), input.job.projectId);
  const documents = filterByProjectId(filterDocumentsForScope(input.scopeDataset.documents, input.scopeDataset.scope), input.job.projectId);
  const legalSteps = filterByProjectId(filterLegalStepsForScope(input.scopeDataset.legalSteps, input.scopeDataset.scope), input.job.projectId);
  const readinessItems = projects.slice(0, 4).map((project) =>
    calculateProjectDocumentReadiness({
      project,
      requirements: input.scopeDataset.requirements,
      documents: documents.filter((document) => document.projectId === project.id),
      legalSteps: legalSteps.filter((step) => step.projectId === project.id)
    })
  );

  return {
    key: "documents",
    content: readinessItems.map((item) => `${item.projectId}: ${item.completionRatio}%`).join("\n"),
    blocks:
      readinessItems.length > 0
        ? [
            {
              key: "documents",
              title: "San sang ho so",
              module: "documents" as const,
              content: [
                ...readinessItems.map(
                  (item) =>
                    `${item.projectId}: ${item.completionRatio}% | thieu ${item.missingRequirements.length} | can cap nhat ${item.needsUpdateRequirements.length}`
                ),
                ...documents
                  .filter((document) => document.status === "missing" || document.status === "needs_update" || document.approvalStatus === "rejected")
                  .slice(0, 8)
                  .map((document) => `- ${document.title} | ${document.docType} | ${document.status} | ${document.approvalStatus ?? "no_approval"}`)
              ].join("\n"),
              recordCount: readinessItems.length
            }
          ]
        : [],
    citations: documents
      .slice(0, 8)
      .map((document) => internalCitation("document", document.id, `${document.title} v${document.version}`, document.projectId))
  };
}

export async function getLegalStatusContext(input: CoordinatorToolInput) {
  if (!can(input.user, "legal.view")) {
    return emptyToolResult("legal");
  }

  const legalSteps = filterByProjectId(filterLegalStepsForScope(input.scopeDataset.legalSteps, input.scopeDataset.scope), input.job.projectId);
  const highlightedSteps = legalSteps
    .filter((step) => step.status === "blocked" || step.status === "waiting_authority")
    .slice(0, 8);

  return {
    key: "legal",
    content: highlightedSteps.map((step) => `${step.stepName}: ${step.status}`).join("\n"),
    blocks:
      legalSteps.length > 0
        ? [
            {
              key: "legal",
              title: "Tinh trang phap ly",
              module: "legal" as const,
              content: [
                `Tong buoc phap ly trong scope: ${legalSteps.length}`,
                `Blocked: ${legalSteps.filter((step) => step.status === "blocked").length}`,
                `Cho co quan: ${legalSteps.filter((step) => step.status === "waiting_authority").length}`,
                ...highlightedSteps.map((step) => `- ${step.stepName} | ${step.status} | ${step.dueDate ?? "chua co han"}`)
              ].join("\n"),
              recordCount: legalSteps.length
            }
          ]
        : [],
    citations: highlightedSteps.map((step) => internalCitation("legal_step", step.id, step.stepName, step.projectId))
  };
}

export async function getMeetingDecisionContext(input: CoordinatorToolInput) {
  if (!can(input.user, "meeting.view")) {
    return emptyToolResult("meetings");
  }

  const meetings = filterByProjectId(filterMeetingsForScope(input.scopeDataset.meetings, input.scopeDataset.scope), input.job.projectId);
  const decisions = filterByProjectId(filterDecisionsForScope(input.scopeDataset.decisions, input.scopeDataset.scope), input.job.projectId);
  const pendingDecisions = decisions.filter((decision) => decision.status !== "done" && decision.status !== "cancelled").slice(0, 8);

  return {
    key: "meetings",
    content: pendingDecisions.map((decision) => decision.decisionText).join("\n"),
    blocks:
      meetings.length > 0 || decisions.length > 0
        ? [
            {
              key: "meetings",
              title: "Hop va quyet dinh",
              module: "meetings" as const,
              content: [
                `Cuoc hop trong scope: ${meetings.length}`,
                `Quyet dinh/action item dang mo: ${pendingDecisions.length}`,
                ...pendingDecisions.map((decision) => `- ${decision.decisionText} | ${decision.status} | ${decision.dueDate ?? "chua co han"}`)
              ].join("\n"),
              recordCount: meetings.length + decisions.length
            }
          ]
        : [],
    citations: [
      ...meetings.slice(0, 4).map((meeting) => internalCitation("meeting", meeting.id, meeting.title, meeting.projectId)),
      ...pendingDecisions.map((decision) => internalCitation("decision", decision.id, decision.decisionText.slice(0, 80), decision.projectId))
    ]
  };
}

export async function getReportSnapshotContext(input: CoordinatorToolInput) {
  if (!can(input.user, "report.view")) {
    return emptyToolResult("reports");
  }

  const visibleProjectIds = new Set(filterProjectsForScope(input.scopeDataset.projects, input.scopeDataset.scope).map((project) => project.id));
  const reports = input.scopeDataset.reports
    .filter((report) => visibleProjectIds.has(report.projectId))
    .filter((report) => !input.job.projectId || report.projectId === input.job.projectId)
    .slice(0, 5);

  return {
    key: "reports",
    content: reports.map((report) => report.title).join("\n"),
    blocks:
      reports.length > 0
        ? [
            {
              key: "reports",
              title: "Bao cao gan day",
              module: "reports" as const,
              content: reports
                .map(
                  (report) =>
                    `${report.title} | qua han ${report.snapshot.summary.overdueTasks} | ho so thieu ${report.snapshot.summary.missingDocuments} | phap ly blocked ${report.snapshot.summary.blockedLegalSteps}`
                )
                .join("\n"),
              recordCount: reports.length
            }
          ]
        : [],
    citations: reports.map((report) => internalCitation("report", report.id, report.title, report.projectId))
  };
}

export async function retrieveKnowledgeContext(input: CoordinatorKnowledgeToolInput) {
  if (!input.job.payload.useRag || !can(input.user, "ai.use_rag") || !can(input.user, "knowledge.view")) {
    return emptyToolResult("knowledge");
  }

  const retrievalResults = await retrieveKnowledgeChunks(
    {
      user: input.user,
      module: input.job.payload.knowledgeModule,
      query: input.job.payload.prompt,
      topK: 5,
      retrievalMode: "deterministic"
    },
    input.repositories.knowledgeIndex
  );
  const context = buildKnowledgeRetrievalContext(retrievalResults, { maxLength: 2400 });

  return {
    key: "knowledge",
    content: context.contextText,
    blocks:
      context.selectedChunks.length > 0
        ? [
            {
              key: "knowledge",
              title: "Tri thuc da duyet",
              module: input.job.module,
              content: context.contextText,
              recordCount: context.selectedChunks.length
            }
          ]
        : [],
    citations: context.selectedChunks.map<AiCoordinatorCitationDraft>((result) => ({
      citationType: "knowledge_chunk",
      entityType: "knowledge_chunk",
      entityId: result.chunk.id,
      knowledgeItemId: result.citation.knowledgeItemId,
      knowledgeChunkId: result.chunk.id,
      title: result.citation.knowledgeTitle,
      sourceUrl: result.citation.sourceUrl,
      module: result.citation.module,
      projectId: input.job.projectId,
      accessLevel: result.chunk.accessLevel
    }))
  };
}

export function createActionProposal(job: AiJob, user: PermissionUser, scopeDataset: ScopeDataset): AiActionProposalDraft[] {
  if (!job.payload.wantsActionProposal || !can(user, "ai.propose_action")) {
    return [];
  }

  if (job.intent === "AI Approval Assistant") {
    return [];
  }

  const safeProjectId = resolveVisibleProjectId(job.projectId, scopeDataset);

  if (job.projectId && !safeProjectId) {
    return [];
  }

  const advisoryText = `${job.module} ${job.intent} ${job.payload.prompt.slice(0, 1000)}`.toLowerCase();

  if (
    Boolean(safeProjectId) &&
    (job.module === "project" || job.module === "general") &&
    shouldCreateRiskProposal(advisoryText)
  ) {
    return [
      {
        projectId: safeProjectId,
        module: job.module,
        actionKey: "create_risk_record",
        targetEntityType: "risk",
        proposedPayload: {
          recordType: "risk",
          title: "De xuat risk tu AI",
          reason: "AI de xuat canh bao risk tu context nguoi dung duoc phep xem.",
          categoryKey: "operation",
          level: "medium",
          deadline: todayString(),
          ownerId: user.id,
          projectId: safeProjectId,
          nextAction: "Người có quyền cần xem lại nguồn trích dẫn và xác nhận trước khi tạo rủi ro chính thức.",
        },
        rationale: "Coordinator chi tao draft risk suggestion, khong ghi vao executive_risk_records.",
        requiredPermission: "risk.create",
        status: "proposed",
        workflowStatus: "DRAFT",
      },
    ];
  }

  const requiredPermission: PermissionAction = job.module === "documents" ? "document.update" : "task.create";
  const actionKey = job.module === "documents" ? "request_document_update" : "create_task";

  return [
    {
      projectId: safeProjectId,
      module: job.module,
      actionKey,
      targetEntityType: actionKey === "request_document_update" ? "document" : "task",
      proposedPayload: {
        title: "De xuat tu AI",
        description: "De xuat tu AI dua tren context da loc quyen. Can nguoi dung review citation va xac nhan truoc khi ghi du lieu.",
        projectId: safeProjectId,
        status: "todo",
        priority: "medium",
        category: "ai_proposal",
        requestedStatus: "needs_update"
      },
      rationale: "Coordinator chi lap ke hoach de xuat, khong ghi vao module nghiep vu.",
      requiredPermission,
      status: "proposed"
    }
  ];
}

function resolveCoordinatorRepositories(repositories: AiCoordinatorRepositories): Required<AiCoordinatorRepositories> {
  return {
    projects: repositories.projects ?? projectRepository,
    tasks: repositories.tasks ?? taskRepository,
    documents: repositories.documents ?? documentRepository,
    requirements: repositories.requirements ?? documentRequirementRepository,
    legal: repositories.legal ?? legalRepository,
    meetings: repositories.meetings ?? meetingRepository,
    reports: repositories.reports ?? reportRepository,
    users: repositories.users ?? userRepository,
    knowledgeIndex: repositories.knowledgeIndex ?? knowledgeIndexRepository
  };
}

async function loadScopeDataset(repositories: Required<AiCoordinatorRepositories>) {
  const [projects, tasks, documents, requirements, legalSteps, meetings, decisions, reports, memberships] = await Promise.all([
    repositories.projects.listProjects(),
    repositories.tasks.listTasks(),
    repositories.documents.listDocuments(),
    repositories.requirements.listRequirements(),
    repositories.legal.listLegalSteps(),
    repositories.meetings.listMeetings(),
    repositories.meetings.listDecisions(),
    repositories.reports.listReports(),
    repositories.users.listProjectMemberships()
  ]);
  const scope = resolveAccessScope(
    { id: "", role: "viewer" },
    {
      memberships,
      tasks,
      documents
    }
  );

  return { projects, tasks, documents, requirements, legalSteps, meetings, decisions, reports, memberships, scope };
}

type CoordinatorToolInput = {
  job: AiJob;
  user: PermissionUser;
  repositories: Required<AiCoordinatorRepositories>;
  scopeDataset: ScopeDataset;
};

type CoordinatorKnowledgeToolInput = {
  job: AiJob;
  user: PermissionUser;
  repositories: Required<AiCoordinatorRepositories>;
};

function buildUserScopeDataset(dataset: ScopeDataset, user: PermissionUser): ScopeDataset {
  return {
    ...dataset,
    scope: resolveAccessScope(user, {
      memberships: dataset.memberships,
      tasks: dataset.tasks,
      documents: dataset.documents
    })
  };
}

function emptyToolResult(key: string) {
  return {
    key,
    content: "",
    blocks: [],
    citations: []
  };
}

function approvalAssistantCitations(job: AiJob): AiCoordinatorCitationDraft[] {
  return job.scopeSnapshot.resourceRefs.map((ref) =>
    internalCitation(
      ref.entityType,
      ref.entityId,
      `${ref.entityType} ${ref.entityId}`,
      ref.entityType === "project" ? ref.entityId : job.projectId
    )
  );
}

function internalCitation(entityType: string, entityId: string, title: string, projectId?: string): AiCoordinatorCitationDraft {
  return {
    citationType: "internal_record",
    entityType,
    entityId,
    title,
    module: entityTypeToAiModule(entityType),
    projectId
  };
}

function entityTypeToAiModule(entityType: string): AiModule {
  if (entityType === "task") {
    return "tasks";
  }

  if (entityType === "document") {
    return "documents";
  }

  if (entityType === "legal_step") {
    return "legal";
  }

  if (entityType === "meeting" || entityType === "decision") {
    return "meetings";
  }

  if (entityType === "report") {
    return "reports";
  }

  return "project";
}

function filterByProjectId<T extends { projectId?: string; id?: string }>(items: T[], projectId?: string) {
  if (!projectId) {
    return items;
  }

  return items.filter((item) => item.projectId === projectId || item.id === projectId);
}

function resolveVisibleProjectId(projectId: string | undefined, scopeDataset: ScopeDataset) {
  if (!projectId) {
    return undefined;
  }

  return filterProjectsForScope(scopeDataset.projects, scopeDataset.scope).some((project) => project.id === projectId) ? projectId : undefined;
}

function sanitizeJobForScope(job: AiJob, scopeDataset: ScopeDataset): AiJob {
  if (!job.projectId || resolveVisibleProjectId(job.projectId, scopeDataset)) {
    return job;
  }

  return {
    ...job,
    projectId: undefined,
    scopeSnapshot: {
      ...job.scopeSnapshot,
      projectId: undefined
    }
  };
}

function shouldCreateRiskProposal(text: string) {
  if (
    includesAny(text, [
      "no risk",
      "not a risk",
      "not risk",
      "not blocked",
      "not a blocker",
      "khong co risk",
      "không có risk",
      "khong co rui ro",
      "không có rủi ro",
      "khong co blocker",
      "không có blocker",
      "khong bi blocked",
      "không bị blocked"
    ])
  ) {
    return false;
  }

  const hasRiskTerm = includesAny(text, ["risk", "rui ro", "rủi ro", "blocker", "blocked", "canh bao", "cảnh báo"]);
  const hasActionIntent = includesAny(text, ["de xuat", "đề xuất", "tao", "tạo", "canh bao", "cảnh báo", "draft", "lap", "lập"]);

  return hasRiskTerm && hasActionIntent;
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export async function prepareCoordinatorScopeDataset(
  user: PermissionUser,
  repositories: AiCoordinatorRepositories = {}
): Promise<ScopeDataset> {
  return buildUserScopeDataset(await loadScopeDataset(resolveCoordinatorRepositories(repositories)), user);
}
