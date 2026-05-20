import { describe, expect, it } from "vitest";

import {
  canReadDocumentInScope,
  canReadLegalStepInScope,
  canReadProjectInScope,
  canReadTaskInScope,
  filterDocumentsForScope,
  filterProjectsForScope,
  filterTasksForScope,
  resolveAccessScope
} from "@/lib/permissions/access-scope";
import type { PermissionUser } from "@/lib/permissions/can";
import type { Document } from "@/modules/documents/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import type { ProjectMembership } from "@/modules/users/types";

const projects: Project[] = [
  { id: "project-a", code: "A", name: "Assigned", status: "active", createdAt: "", updatedAt: "" },
  { id: "project-b", code: "B", name: "Unassigned", status: "active", createdAt: "", updatedAt: "" }
];

const tasks: Task[] = [
  {
    id: "task-a",
    projectId: "project-a",
    title: "Assigned task",
    assigneeId: "contractor-01",
    status: "todo",
    priority: "high",
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "task-b",
    projectId: "project-b",
    title: "Unassigned task",
    assigneeId: "other",
    status: "todo",
    priority: "medium",
    createdAt: "",
    updatedAt: ""
  }
];

const documents: Document[] = [
  {
    id: "doc-a",
    projectId: "project-a",
    title: "Assigned doc",
    docType: "contractor_submission",
    version: "v1",
    status: "needs_update",
    ownerId: "contractor-01",
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "doc-b",
    projectId: "project-b",
    title: "Unassigned doc",
    docType: "internal",
    version: "v1",
    status: "complete",
    ownerId: "other",
    createdAt: "",
    updatedAt: ""
  }
];

const memberships: ProjectMembership[] = [
  {
    id: "membership-a",
    projectId: "project-a",
    userId: "contractor-01",
    role: "nha_thau",
    createdAt: "",
    updatedAt: ""
  },
  {
    id: "membership-viewer",
    projectId: "project-b",
    userId: "viewer",
    role: "viewer",
    createdAt: "",
    updatedAt: ""
  }
];

function user(id: string, role: PermissionUser["role"]): PermissionUser {
  return { id, role };
}

describe("access scope filtering", () => {
  it("keeps internal roles on existing full MVP access", () => {
    const scope = resolveAccessScope(user("admin", "admin"), { memberships, tasks, documents });

    expect(scope.kind).toBe("internal_full");
    expect(filterProjectsForScope(projects, scope)).toHaveLength(2);
    expect(filterTasksForScope(tasks, scope)).toHaveLength(2);
    expect(filterDocumentsForScope(documents, scope)).toHaveLength(2);
  });

  it("limits contractors to assigned project, task and document data", () => {
    const scope = resolveAccessScope(user("contractor-01", "nha_thau"), { memberships, tasks, documents });

    expect(scope.kind).toBe("external_limited");
    expect(filterProjectsForScope(projects, scope).map((project) => project.id)).toEqual(["project-a"]);
    expect(filterTasksForScope(tasks, scope).map((task) => task.id)).toEqual(["task-a"]);
    expect(filterDocumentsForScope(documents, scope).map((document) => document.id)).toEqual(["doc-a"]);
    expect(canReadProjectInScope(projects[1], scope)).toBe(false);
    expect(canReadTaskInScope(tasks[1], scope)).toBe(false);
    expect(canReadDocumentInScope(documents[1], scope)).toBe(false);
    expect(canReadLegalStepInScope({ projectId: "project-a" }, scope)).toBe(false);
  });

  it("limits consultants to assigned review task/document scope", () => {
    const consultantTasks = [{ ...tasks[0], assigneeId: "consultant-01" }, tasks[1]];
    const consultantDocuments = [{ ...documents[0], ownerId: "consultant-01" }, documents[1]];
    const scope = resolveAccessScope(user("consultant-01", "tu_van"), {
      memberships: [{ ...memberships[0], userId: "consultant-01", role: "tu_van" }],
      tasks: consultantTasks,
      documents: consultantDocuments
    });

    expect(filterProjectsForScope(projects, scope).map((project) => project.id)).toEqual(["project-a"]);
    expect(filterTasksForScope(consultantTasks, scope).map((task) => task.id)).toEqual(["task-a"]);
    expect(filterDocumentsForScope(consultantDocuments, scope).map((document) => document.id)).toEqual(["doc-a"]);
    expect(canReadLegalStepInScope({ projectId: "project-a" }, scope)).toBe(true);
    expect(canReadLegalStepInScope({ projectId: "project-b" }, scope)).toBe(false);
  });

  it("keeps viewer read-only and scoped to assigned project memberships", () => {
    const scope = resolveAccessScope(user("viewer", "viewer"), { memberships, tasks, documents });

    expect(scope.kind).toBe("read_only_allowed");
    expect(filterProjectsForScope(projects, scope).map((project) => project.id)).toEqual(["project-b"]);
    expect(filterTasksForScope(tasks, scope).map((task) => task.id)).toEqual(["task-b"]);
    expect(filterDocumentsForScope(documents, scope).map((document) => document.id)).toEqual(["doc-b"]);
  });
});
