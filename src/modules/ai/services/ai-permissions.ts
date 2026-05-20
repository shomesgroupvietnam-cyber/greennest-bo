import { assertCan, can, getRolePermissions, type PermissionAction, type PermissionUser } from "@/lib/permissions/can";
import { resolveAccessScope } from "@/lib/permissions/access-scope";
import type { KnowledgeModule } from "@/modules/knowledge/types";

import type { AiAskInput, AiModule, AiScopeSnapshot } from "../types";

export const AI_MODULE_VIEW_PERMISSIONS: Record<AiModule, PermissionAction | undefined> = {
  project: "project.view",
  tasks: "task.view",
  documents: "document.view",
  legal: "legal.view",
  meetings: "meeting.view",
  reports: "report.view",
  design: "design.view",
  construction: "construction.view",
  finance: "finance.view",
  general: undefined
};

export const AI_TO_KNOWLEDGE_MODULE: Record<AiModule, KnowledgeModule | "all"> = {
  project: "project",
  tasks: "project",
  documents: "documents",
  legal: "legal",
  meetings: "meetings",
  reports: "reports",
  design: "design",
  construction: "construction",
  finance: "finance",
  general: "general"
};

export function assertAiRequestPermissions(user: PermissionUser, input: Pick<AiAskInput, "module" | "useRag">) {
  assertCan(user, "ai.ask");

  const modulePermission = AI_MODULE_VIEW_PERMISSIONS[input.module];

  if (modulePermission) {
    assertCan(user, modulePermission);
  }

  if (input.useRag) {
    assertCan(user, "ai.use_rag");
    assertCan(user, "knowledge.view");
  }
}

export function canProcessAiJob(user: PermissionUser, snapshot: AiScopeSnapshot, useRag: boolean) {
  if (user.id !== snapshot.userId) {
    return false;
  }

  if (!can(user, "ai.ask")) {
    return false;
  }

  const modulePermission = AI_MODULE_VIEW_PERMISSIONS[snapshot.module];

  if (modulePermission && !can(user, modulePermission)) {
    return false;
  }

  if (useRag && (!can(user, "ai.use_rag") || !can(user, "knowledge.view"))) {
    return false;
  }

  return true;
}

export function createAiScopeSnapshot(user: PermissionUser, input: AiAskInput): AiScopeSnapshot {
  const accessScope = resolveAccessScope(user);

  return {
    userId: user.id,
    role: user.role,
    permissions: getRolePermissions(user.role),
    scopeKind: accessScope.kind,
    module: input.module,
    projectId: input.projectId,
    resourceRefs: input.resourceRefs ?? [],
    capturedAt: new Date().toISOString()
  };
}

