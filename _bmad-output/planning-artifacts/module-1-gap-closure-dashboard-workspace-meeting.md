---
title: "Module 1 Gap Closure - Dashboard Contract, Private Workspace, Meeting Boundary"
status: "decision-ready"
created: "2026-05-30"
scope: "Module 1 - Lanh dao / Truc 1"
purpose: "Close the three blocking gaps before turning Module 1 WBS into implementation stories."
---

# Module 1 Gap Closure - Dashboard Contract, Private Workspace, Meeting Boundary

## 1. Muc Dich

Tai lieu nay dong 3 gap con lai cua Module 1 - Lanh dao trong Truc 1 truoc khi WBS di vao story/dev:

1. Data contract giua Executive Dashboard va cac module nguon.
2. Private Workspace spec du de demo cac role chinh.
3. Boundary giua Meeting Center trong Module 1 va Module 5.

Day la planning/architecture decision artifact. Khong thay the PRD hoac story files.

## 2. Decision Summary

| Gap | Decision |
| --- | --- |
| Dashboard data contract | `ExecutiveDashboardData` tiep tuc la DTO tong hop cua Module 1. Dashboard service chi aggregate tu cac provider service cua Module 2-5, khong doc repository module khac truc tiep. Moi module phai expose feed item da scope-filter, da redaction va co metadata drill-down. |
| Private Workspace | Private workspace la composition theo `operatingRole + scope assignment + permission`, khong hardcode bang role name. Demo baseline gom Chairman, CEO, Project Director, Department Head, Secretary/Assistant, va Viewer/read-only neu can negative demo. |
| Meeting boundary | `src/modules/meetings` / One Meeting Engine la source of truth cho meeting data. Module 1 chi la executive lens/action surface. Module 5 la proposal/approval/request workflow surface. Khong tao hai meeting model hoac hai meeting repository. |

## 3. Gap 1 - Executive Dashboard Data Contract

### 3.1 Source Of Truth

Dashboard Module 1 dung `ExecutiveDashboardData` lam DTO chinh.

Aggregator service:

```text
src/modules/dashboard/services/executive-dashboard-service.ts
```

Nguyen tac:

- Aggregator khong goi repository cua module khac truc tiep.
- Aggregator goi provider service cua tung module.
- Provider service phai tu enforce permission/scope truoc khi tra data.
- UI chi render data da duoc filter/redact tu service layer.
- Finance/sensitive data tra ve state `no_permission`, khong tra amount raw roi an frontend.

### 3.2 Required Provider Services

| Module Nguon | Provider Service De Xuat | Dashboard Responsibility |
| --- | --- | --- |
| Module 2 - Tim kiem & phat trien du an | `src/modules/axis-1/services/opportunity-dashboard-provider.ts` hoac module tuong duong khi Module 2 duoc tao | Opportunity/project formation status, source, stage, health, pre-feasibility flags |
| Module 3 - Phap ly | `src/modules/legal/services/legal-dashboard-provider.ts` | Legal blocker, waiting authority, missing legal docs, legal deadlines |
| Module 4 - Thiet ke/Quy hoach/Ky thuat/BIM | `src/modules/design/services/design-dashboard-provider.ts` | Planning/design package status, technical blockers, design changes, drawing readiness |
| Module 5 - De xuat/Hop/Phe duyet | `src/modules/proposals/services/proposal-dashboard-provider.ts` va `src/modules/meetings/services/meeting-dashboard-provider.ts` | Proposal queue, overdue approvals, meeting snapshot, follow-up actions |
| Shared Decision/Risk/Task | Existing dashboard/executive/task/risk providers | Decisions, assigned actions, risk summary, deadlines |

Neu module path chua ton tai, story dau tien cua module do phai tao provider contract truoc UI.

### 3.3 Normalized Feed Item Contract

Moi provider phai tra ve item co the map vao `ExecutiveDashboardSourceItem`.

Bat buoc:

```ts
type ExecutiveDashboardModuleFeedItem = {
  id: string;
  sourceType:
    | "project"
    | "opportunity"
    | "proposal"
    | "leadership_approval"
    | "executive_action"
    | "meeting"
    | "decision"
    | "risk"
    | "legal_step"
    | "technical_record";
  sourceId: string;
  moduleId: "module-1" | "module-2" | "module-3" | "module-4" | "module-5";
  projectId?: string;
  projectIds?: string[];
  title: string;
  status: string;
  tone: "blue" | "emerald" | "amber" | "purple" | "red" | "slate";
  owner?: string;
  deadline?: string;
  reason?: string;
  scopeLabel?: string;
  permissionState: "allowed" | "read_only" | "denied";
  linkedRecords: Array<{
    id: string;
    type: "project" | "opportunity" | "proposal" | "meeting" | "decision" | "document" | "legal" | "task" | "risk" | "technical_record";
    title: string;
    href?: string;
    permissionState: "allowed" | "read_only" | "denied";
    reason?: string;
  }>;
};
```

Optional theo module:

```ts
type ExecutiveDashboardModuleFeedItemOptional = {
  severity?: "low" | "medium" | "high" | "critical";
  amountLabel?: string;
  financialAccess?: "allowed" | "no_permission";
  progress?: number;
  health?: "green" | "yellow" | "red";
  escalation?: unknown;
  overdue?: unknown;
  availableActions?: Array<{
    id: string;
    label: string;
    actionKey?: string;
    enabled: boolean;
    reason?: string;
  }>;
};
```

### 3.4 Provider Output By Module

| Provider | Required Output |
| --- | --- |
| Module 2 provider | `opportunitiesTotal`, `activeOpportunities`, `redYellowGreen`, `pendingRecommendationItems`, `preFeasibilityRiskItems`, feed items for opportunity/project stage |
| Module 3 provider | `blockedLegalSteps`, `waitingAuthoritySteps`, `missingLegalDocuments`, `legalDeadlineItems`, feed items for legal blocker |
| Module 4 provider | `planningPackageStatus`, `designPackageStatus`, `technicalIssueItems`, `drawingReadinessItems`, feed items for technical/design blocker |
| Module 5 provider | `pendingProposals`, `overdueApprovals`, `highRiskRequests`, `meetingFollowUps`, feed items for approval/proposal/meeting |

### 3.5 Aggregation Rules

- Dashboard KPI chi tinh tu provider output, khong hardcode so lieu trong component.
- Khi provider thieu data, dashboard tra empty state co reason, khong fabricate values.
- `sourceCounts` phai dem theo source da duoc permission-filter.
- Drill-down link chi duoc gan neu user co `permissionState !== "denied"`.
- Finance amount chi hien khi `canViewFinance = true`; neu khong, chi hien label an toan nhu `Can quyen xem tai chinh`.

### 3.6 Story Acceptance For Gap 1

Story dau tien cham Dashboard Module 1 phai include:

- Tao hoac cap nhat provider contract cho Module 2-5.
- Test aggregator khong doc repository module khac truc tiep.
- Test no-permission provider item khong leak sensitive payload.
- Test dashboard KPI thay doi khi provider fixture thay doi.
- Test missing provider -> empty/insufficient data state.

## 4. Gap 2 - Private Workspace Role Composition Spec

### 4.1 Source Of Truth

Private Workspace dung:

```text
src/modules/workspaces/services/executive-private-workspace-service.ts
src/modules/workspaces/types.ts
src/modules/workspaces/private-workspace-variants.ts
```

Variant khong chi dua vao role name. Variant duoc resolve tu:

```text
current user + operatingRole + scope assignment + delegation + permission
```

### 4.2 Demo Baseline Variants

Baseline demo nen co 5 role chinh va 1 negative/read-only role:

1. Chairman / Super Admin.
2. CEO.
3. Project Director.
4. Department Head.
5. Secretary/Assistant.
6. Viewer/read-only, optional nhung nen co cho permission demo.

### 4.3 Section Order By Variant

| Variant | Section Order | Primary Purpose |
| --- | --- | --- |
| Chairman | Portfolio KPI -> Critical Risk -> Overdue/High-Value Approval -> Chairman Decisions -> Strategic Meetings -> Finance Sensitive Summary | Xem toan canh va ra quyet dinh cap cao |
| CEO | Operations KPI -> Approval Queue -> Escalations -> Cross-Project Deadlines -> Risk/Blocker -> Meetings/Follow-ups | Dieu hanh van hanh hang ngay |
| Project Director | Assigned Projects -> Project Health -> Project Blockers -> Deadlines -> Project Approvals -> Meeting Follow-ups -> Tasks | Dieu hanh du an duoc giao |
| Department Head | Department/Workstream Queue -> Specialist Dossiers -> Department Deadlines -> Requests Needing Review -> Blockers -> Meetings | Dieu hanh pham vi phong ban/module |
| Secretary/Assistant | Principal Schedule -> Submission Dossiers -> Meeting Documents -> Support Tasks -> Reminders -> Pending Approvals In Delegated Scope | Ho tro lanh dao trong pham vi uy quyen |
| Viewer | Read-Only Summary -> Allowed Projects -> Allowed Meetings -> Allowed Decisions | Xem, khong mutate |

### 4.4 Widget Requirements

| Widget | Required Fields | Hide/Show Rule |
| --- | --- | --- |
| KPI Strip | label, value, tone, source, reason | Hide finance KPI if no finance permission; show redacted state instead |
| Priority Queue | title, type, severity/priority, owner, deadline, reason, next action | Include only items in scope; no disabled action should leak data |
| Assigned Projects | project/opportunity title, health, phase, owner, next milestone | Show only scoped projects/opportunities |
| Approval Items | request title, amount label/redacted state, policy, deadline, action state | Actions enabled only with action permission |
| Risk Items | risk title, severity, category, owner, deadline, mitigation next step | Critical/high first; color must have text label |
| Decision Items | decision title, decidedBy, decidedAt, status, linked assignments | Show read-only if no decision mutation permission |
| Meeting Items | title, meetingType, date/time, host, follow-up status | Use meeting service source of truth |
| Assistant Support | delegation, principal, allowed actions, schedule, dossiers, reminders | Only when active delegation exists |

### 4.5 Permission Rules

- Chairman khong tu dong full access neu assignment/policy khong cho phep; Super Admin scope co the full neu config quy dinh.
- CEO chi xem scope duoc giao; khong default thay tat ca project neu khong co assignment.
- Project Director chi xem project duoc assign.
- Department Head chi xem module/workstream/department duoc assign.
- Secretary/Assistant chi xem/thao tac trong delegation scope; MVP khong approve thay lanh dao.
- Viewer khong co mutation actions; direct server action van phai fail neu goi truc tiep.

### 4.6 Story Acceptance For Gap 2

Story Private Workspace phai include:

- Fixture/demo cho 5 role chinh.
- Test section ordering theo variant.
- Test permission hide/show cho finance, approval action, decision action, meeting create.
- Test Assistant delegation invalid/expired -> no action, no data leak.
- Test Viewer direct mutation -> denied.

## 5. Gap 3 - Meeting Center Boundary: Module 1 Vs Module 5

### 5.1 Source Of Truth Decision

`src/modules/meetings` / One Meeting Engine la source of truth duy nhat cho:

- meeting entity,
- meeting type,
- participants,
- attachments,
- agenda,
- minutes,
- AI summary draft/approval,
- decisions,
- follow-up actions,
- related approvals/tasks,
- audit log.

Khong tao meeting repository rieng trong Module 1 hoac Module 5.

### 5.2 Boundary Table

| Capability | Module 1 - Lanh Dao | Module 5 - De Xuat/Hop/Phe Duyet | Source Of Truth |
| --- | --- | --- | --- |
| View upcoming/high-risk/strategic meetings | Executive lens, dashboard snapshot, private workspace widget | Proposal/request context only | `meetings` service |
| Create leadership meeting | Allowed for executive users with `meeting.create` in scope | Can create meeting from proposal/request workflow | `meetings` action/service |
| Ask for meeting from approval | Shows as approval action in Module 1 | Owns request/approval workflow that produces meeting intent | `proposals` + `meetings` |
| Meeting list/filter | Executive-filtered view by scope, importance, follow-up risk | Proposal/request-specific list/filter | `meetings` service with context filters |
| Minutes/AI summary | Leadership can review/approve if permission | Meeting context can attach to proposal evidence | `meetings` service |
| Decisions after meeting | Module 1 displays and can create executive decision records | Module 5 links decision to proposal/approval outcome | `executive decision` + `meetings` |
| Follow-up tasks | Module 1 shows accountability and overdue follow-up | Module 5 creates follow-up from approved request/meeting | `tasks` + `meetings` |
| Audit | Module 1 displays executive audit/timeline | Module 5 writes proposal/meeting workflow audit | `audit` + domain services |

### 5.3 Naming Rule

Avoid naming two different surfaces `Meeting Center` without qualifier.

Recommended labels:

- Module 1 surface: **Executive Meeting View** or **Lich hop dieu hanh**.
- Module 5 surface: **Meeting Request & Approval Workflow** or **De xuat hop / Phe duyet hop**.
- Shared route/service: **One Meeting Engine** / `Meeting Center`.

### 5.4 Implementation Boundary

Module 1 may:

- read scoped meetings for executive dashboard/private workspace,
- create leadership meetings if user has permission,
- create decision records from meeting,
- show meeting follow-up status,
- approve AI summary/minutes only if permission allows.

Module 1 must not:

- define a second meeting type enum,
- persist meeting records outside `meetings` repository,
- duplicate proposal/request approval state.

Module 5 may:

- create proposal/request that results in meeting,
- attach meeting to proposal/approval,
- drive ask-for-meeting workflow,
- convert approved meeting outcomes into task/decision links.

Module 5 must not:

- own canonical meeting storage,
- create parallel meeting minutes/audit model,
- bypass meeting permission checks.

### 5.5 Story Acceptance For Gap 3

Meeting-related stories phai include:

- Test one source-of-truth: meeting created from Module 5 is visible in Module 1 executive lens if scope allows.
- Test executive-only meeting is visible in Module 5 only when linked to proposal/request or user has meeting scope.
- Test direct URL to meeting outside scope returns 403/no data.
- Test decision from meeting links to meeting and appears in executive decision view.
- Test follow-up task from meeting links both `meetingId` and `relatedTaskId`.

## 6. Update Needed Before Story Creation

Before converting WBS Module 1 into implementation stories:

1. Add/confirm `ExecutiveDashboardSourceType` supports `opportunity`, `legal_step`, and `technical_record`, or explicitly map them to existing source types with documented loss of specificity.
2. Add provider contracts for Module 2-5 dashboard feeds.
3. Expand private workspace variant config from label/description/priority groups into explicit section order and widget rules.
4. Rename/qualify Meeting surfaces to avoid duplicate "Meeting Center" ownership.
5. Add story tasks for provider tests, workspace variant tests, and meeting source-of-truth tests.

## 7. Recommended Story Split

| Story | Purpose |
| --- | --- |
| M1-Contract-1 | Executive Dashboard Provider Contract for Module 2-5 feeds |
| M1-Workspace-1 | Private Workspace Variant Composition for 5 demo roles |
| M1-Meeting-1 | Meeting Boundary and One Meeting Engine integration for Module 1/5 |

These should be created before or at the start of Module 1 production-depth implementation stories.
