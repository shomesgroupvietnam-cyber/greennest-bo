import { describe, expect, it } from "vitest";

import {
  canAccessScopedAction,
  canReadDecisionInScope,
  canReadDocumentInScope,
  canReadLegalStepInScope,
  canReadProposalInScope,
  canReadProjectInScope,
  canReadTaskInScope,
  filterDecisionsForScope,
  filterDocumentsForScope,
  filterProposalsForScope,
  filterProjectsForScope,
  filterTasksForScope,
  resolveAccessScope,
} from "@/lib/permissions/access-scope";
import type { PermissionUser } from "@/lib/permissions/can";
import type { Document } from "@/modules/documents/types";
import type { Decision } from "@/modules/meetings/types";
import type { Project } from "@/modules/projects/types";
import type { Proposal } from "@/modules/proposals/types";
import type { ScopeAssignment } from "@/modules/settings/types";
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

const proposals: Proposal[] = [
  {
    id: "proposal-a",
    code: "DX-A",
    title: "Assigned proposal",
    type: "general",
    projectId: "project-a",
    module: "proposal",
    requestedBy: "requester",
    status: "in_review",
    priority: "high",
    aiReviewStatus: "not_checked",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "proposal-b",
    code: "DX-B",
    title: "Unassigned proposal",
    type: "general",
    projectId: "project-b",
    module: "proposal",
    requestedBy: "requester",
    status: "in_review",
    priority: "high",
    aiReviewStatus: "not_checked",
    createdAt: "",
    updatedAt: "",
  },
];

const decisions: Decision[] = [
  {
    id: "decision-a",
    projectId: "project-a",
    decisionText: "Approve project A",
    status: "open",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "decision-b",
    projectId: "project-b",
    decisionText: "Approve project B",
    status: "open",
    createdAt: "",
    updatedAt: "",
  },
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

  it("keeps full-access roles unrestricted when assignment mode is not required", () => {
    const scope = resolveAccessScope(user("admin", "admin"), {
      memberships,
      tasks,
      documents,
      requireScopeAssignments: false,
      scopeAssignments: [],
    });

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

  it("evaluates action permission and target scope from explicit assignments", () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-project-a",
        userId: "operator",
        roleKey: "giam_doc_du_an",
        permissionKeys: ["project.view", "task.view"],
        projectId: "project-a",
        moduleId: "module-1",
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(
      canAccessScopedAction(user("operator", "viewer"), "project.view", { projectId: "project-a", moduleId: "module-1" }, {
        scopeAssignments,
      }),
    ).toBe(true);
    expect(
      canAccessScopedAction(user("operator", "viewer"), "project.view", { projectId: "project-b", moduleId: "module-1" }, {
        scopeAssignments,
      }),
    ).toBe(false);
    expect(
      canAccessScopedAction(user("operator", "viewer"), "finance.view", { projectId: "project-a", moduleId: "module-1" }, {
        scopeAssignments,
      }),
    ).toBe(false);
  });

  it("supports controlled wildcards and ignores inactive or expired assignments", () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-wildcard-legal",
        userId: "operator",
        roleKey: "phap_ly",
        permissionKeys: ["legal.view"],
        projectId: "*",
        moduleId: "legal",
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "assignment-inactive",
        userId: "operator",
        roleKey: "admin",
        permissionKeys: ["settings.manage"],
        scopeType: "global",
        active: false,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "assignment-expired",
        userId: "operator",
        roleKey: "admin",
        permissionKeys: ["audit.view"],
        scopeType: "global",
        active: true,
        endsAt: "2026-01-01T00:00:00.000Z",
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(
      canAccessScopedAction(user("operator", "viewer"), "legal.view", { projectId: "project-b", moduleId: "legal" }, {
        now: new Date("2026-05-23T00:00:00.000Z"),
        scopeAssignments,
      }),
    ).toBe(true);
    expect(
      canAccessScopedAction(user("operator", "viewer"), "legal.view", { projectId: "project-b", moduleId: "finance" }, {
        now: new Date("2026-05-23T00:00:00.000Z"),
        scopeAssignments,
      }),
    ).toBe(false);
    expect(
      canAccessScopedAction(user("operator", "viewer"), "settings.manage", {}, {
        scopeAssignments,
      }),
    ).toBe(false);
    expect(
      canAccessScopedAction(user("operator", "viewer"), "audit.view", {}, {
        now: new Date("2026-05-23T00:00:00.000Z"),
        scopeAssignments,
      }),
    ).toBe(false);
  });

  it("filters projects by active scoped assignments when they are present", () => {
    const scope = resolveAccessScope(user("operator", "admin"), {
      memberships,
      tasks,
      documents,
      scopeAssignments: [
        {
          id: "assignment-project-a",
          userId: "operator",
          roleKey: "viewer",
          permissionKeys: ["project.view", "task.view", "document.view"],
          projectId: "project-a",
          active: true,
          scopeType: "scoped",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    expect(filterProjectsForScope(projects, scope).map((project) => project.id)).toEqual(["project-a"]);
    expect(filterTasksForScope(tasks, scope).map((task) => task.id)).toEqual(["task-a"]);
    expect(filterDocumentsForScope(documents, scope).map((document) => document.id)).toEqual(["doc-a"]);
  });

  it("denies internal users when assignment mode is explicit and no assignment matches", () => {
    const scope = resolveAccessScope(user("admin", "admin"), {
      memberships,
      tasks,
      documents,
      scopeAssignments: [],
    });

    expect(filterProjectsForScope(projects, scope)).toEqual([]);
    expect(filterTasksForScope(tasks, scope)).toEqual([]);
    expect(filterDocumentsForScope(documents, scope)).toEqual([]);
  });

  it("requires assignment permissions to be allowed by the selected role catalog", () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-viewer-settings",
        userId: "operator",
        roleKey: "viewer",
        permissionKeys: ["settings.manage"],
        scopeType: "global",
        active: true,
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(
      canAccessScopedAction(user("operator", "viewer"), "settings.manage", {}, {
        rolePermissionCatalog: {
          roles: [
            {
              key: "viewer",
              labelVi: "Viewer",
              scope: "system",
              active: true,
              permissionKeys: ["project.view"],
            },
          ],
          permissions: [],
          assignments: [],
        },
        scopeAssignments,
      }),
    ).toBe(false);
  });

  it("does not treat global assignments with dimensions as system-wide", () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-invalid-global",
        userId: "operator",
        roleKey: "viewer",
        permissionKeys: ["project.view"],
        projectId: "project-a",
        scopeType: "global",
        active: true,
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(
      canAccessScopedAction(user("operator", "viewer"), "project.view", { projectId: "project-a" }, {
        scopeAssignments,
      }),
    ).toBe(false);
  });

  it("matches axis aliases and workstream/module scope dimensions", () => {
    const scopeAssignments: ScopeAssignment[] = [
      {
        id: "assignment-axis-legal",
        userId: "operator",
        roleKey: "phap_ly",
        permissionKeys: ["legal.view"],
        axisId: "axis-1",
        workstreamId: "legal",
        moduleId: "legal",
        active: true,
        scopeType: "scoped",
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(
      canAccessScopedAction(
        user("operator", "viewer"),
        "legal.view",
        { axisId: "project_management", workstreamId: "legal", moduleId: "legal" },
        { scopeAssignments },
      ),
    ).toBe(true);
  });

  it("filters proposals by scoped proposal.view assignments without static role permission", () => {
    const scope = resolveAccessScope(user("operator", "pending"), {
      scopeAssignments: [
        {
          id: "assignment-proposal-a",
          userId: "operator",
          roleKey: "dau_tu_phat_trien",
          permissionKeys: ["project.view", "proposal.view"],
          projectId: "project-a",
          active: true,
          scopeType: "scoped",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    expect(filterProposalsForScope(proposals, scope).map((proposal) => proposal.id)).toEqual([
      "proposal-a",
    ]);
    expect(canReadProposalInScope(proposals[0], scope)).toBe(true);
    expect(canReadProposalInScope(proposals[1], scope)).toBe(false);
  });

  it("filters decisions by scoped decision.approve assignments", () => {
    const scope = resolveAccessScope(user("operator", "pending"), {
      scopeAssignments: [
        {
          id: "assignment-decision-a",
          userId: "operator",
          roleKey: "tong_giam_doc",
          permissionKeys: ["decision.approve"],
          projectId: "project-a",
          active: true,
          scopeType: "scoped",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    expect(filterDecisionsForScope(decisions, scope).map((decision) => decision.id)).toEqual([
      "decision-a",
    ]);
  });

  it("supports multi-project and organization-only decision scopes without global leaks", () => {
    const multiProjectDecision: Decision = {
      id: "decision-multi",
      projectIds: ["project-a", "project-b"],
      decisionText: "Portfolio instruction for assigned projects",
      status: "open",
      createdAt: "",
      updatedAt: "",
    };
    const organizationDecision: Decision = {
      id: "decision-org",
      organizationId: "org-green-nest",
      axisId: "axis-1",
      workstreamId: "decision",
      moduleId: "meeting",
      decisionText: "Organization-level instruction",
      status: "open",
      createdAt: "",
      updatedAt: "",
    };
    const viewerScope = resolveAccessScope(user("viewer", "viewer"), { memberships, tasks, documents });
    const contractorScope = resolveAccessScope(user("contractor-01", "nha_thau"), { memberships, tasks, documents });

    expect(canReadDecisionInScope(multiProjectDecision, viewerScope)).toBe(true);
    expect(canReadDecisionInScope(organizationDecision, viewerScope)).toBe(false);
    expect(canReadDecisionInScope(organizationDecision, contractorScope)).toBe(false);

    const orgAssignmentScope = resolveAccessScope(user("operator", "pending"), {
      scopeAssignments: [
        {
          id: "assignment-decision-org",
          userId: "operator",
          roleKey: "tong_giam_doc",
          permissionKeys: ["decision.approve"],
          organizationId: "org-green-nest",
          workstreamId: "decision",
          moduleId: "meeting",
          active: true,
          scopeType: "scoped",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    expect(canReadDecisionInScope(organizationDecision, orgAssignmentScope)).toBe(true);
    expect(
      canReadDecisionInScope(
        { ...organizationDecision, id: "decision-other-org", organizationId: "org-other" },
        orgAssignmentScope,
      ),
    ).toBe(false);
  });
});
