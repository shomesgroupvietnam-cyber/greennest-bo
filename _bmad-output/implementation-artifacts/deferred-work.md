## Deferred from: code review of 1-1-role-template-va-permission-catalog-cho-module-1 (2026-05-23)

- Define the missing "chuyen cap" permission action. Reason: deferred to approval-center/approval workflow story because escalation needs workflow state, target approver, audit, and UX semantics before a stable permission key is safe.

## Deferred from: code review of 1-3-policy-co-ban-cho-nguong-duyet-tien-va-nhom-risk (2026-05-23)

- Approval policy metadata is stored on proposal steps but approve/reject/change decisions still use hard-coded permissions. Reason: full enforcement semantics for approver role, required permission, escalation override, and audit belong to approval-center workflow hardening in Story 3.x.
- Axis 1 scoped risk alerts are filtered by alert id instead of stage id. Reason: scoped Axis 1 command-center behavior is outside Story 1.3 policy settings and should be handled with the Axis 1 scope follow-up.
- Role-level Axis 1 access is dropped when no scope assignment exists. Reason: this belongs to Story 1.2 scoped access semantics, where the product needs to decide whether role-level grants remain global fallback or all Axis 1 access must be assignment-backed.

## Deferred from: code review of 3-4-approval-history-version-va-audit (2026-05-29)

- Delegated proposal creation bypasses domain-specific create guards in `createProposal`; delegated creates should either always enforce `assertDomainCreatePermission` or validate delegated domain authority for the proposal type/module.
- Approval action writes can be stale under concurrent approvers because `applyApprovalMutation` applies a precomputed mutation without rechecking expected proposal/current-step state at write time; a later approval workflow hardening pass should add transactional compare-and-set semantics.

## Deferred from: code review of 5-5-risk-alert-overdue-escalation-va-draft-suggestions (2026-06-02)

- Override/close RLS can update unrelated risk fields in the same direct SQL update. Reason: deferred as pre-existing Story 5.4 lifecycle hardening, not caused by Story 5.5 risk alert/draft suggestion work.
- Direct SQL close policy does not mirror the service-level `risk.close_high` requirement for high/critical/blocker records. Reason: deferred as pre-existing Story 5.4 lifecycle hardening.
- Risk update forms can submit sanitized dashboard display text back into official records. Reason: deferred as pre-existing form/data-shape issue from earlier risk record stories.

## Deferred from: code review of 6-2-meeting-list-filters-va-executive-visibility (2026-06-02)

- Decision scope immutability was removed in JSON updates at `src/modules/meetings/services/meeting-repository.ts:193`. Reason: real diff risk, but outside Story 6.2 meeting-list/filter scope in the current dirty worktree.

## Deferred from: code review of 6-3-tao-va-sua-meeting-voi-related-records (2026-06-03)

- Supabase decision schema/RPC additions in `meeting-repository.ts` need matching prior migrations. Reason: the risk is real, but it comes from prior decision-assignment/version-history work outside Story 6.3 related-record creation/editing scope.
- Existing executive risk scope helper does not grant non-assignment organization-level risk visibility without project ownership. Reason: pre-existing executive risk scope behavior; fix in a dedicated risk-scope hardening story so meeting related-record picker can reuse the corrected helper consistently.

## Deferred from: code review of 6-4-minutes-attachments-va-ai-summary-draft (2026-06-03)

- Client-controlled related `__visible` fields can remove out-of-scope related records in `src/modules/meetings/actions.ts:329`. Reason: real risk from Story 6.3 related-record edit semantics; fix in a dedicated related-record removal hardening pass.
- Supabase decision project filter interpolates raw `.or()` input in `src/modules/meetings/services/meeting-repository.ts:1002`. Reason: pre-existing decision list filter hardening outside Story 6.4 minutes/attachments/AI scope.
- Approval actions have no content/version precondition for concurrent edits in `src/modules/meetings/services/meeting-service.ts:580`. Reason: requires broader optimistic-locking/compare-and-set design for meeting approval actions.
- Decision-to-task conversion is not atomic under concurrent submits in `src/modules/meetings/services/meeting-service.ts:837`. Reason: pre-existing follow-up/task conversion hardening owned by later follow-up action work.

## Deferred from: code review of 6-6-decision-tracking-sau-hop (2026-06-03)

- Partial meeting update actions can wipe omitted mutable fields in `src/modules/meetings/actions.ts:501`. Reason: pre-existing meeting edit action shape from earlier meeting stories, not introduced by decision tracking.
- Related-record removal still depends on client-controlled `__visible` metadata in `src/modules/meetings/services/meeting-service.ts:170`. Reason: previously deferred Story 6.3 related-record removal hardening, still outside Story 6.6.
- Attachment input accepts both `documentId` and external `url` in `src/modules/meetings/validation.ts:353`. Reason: pre-existing Story 6.4 attachment-source semantics issue.
- Follow-up task creation can race and orphan duplicate tasks in `src/modules/meetings/services/meeting-service.ts:1041`. Reason: pre-existing Story 6.5 follow-up task concurrency issue.
- Meeting minutes/AI approval flows lack content-version preconditions for concurrent edits in `src/modules/meetings/services/meeting-service.ts:864`. Reason: broader optimistic-locking design already outside this story.
- Generic meeting action error state can expose raw service/repository exception messages in `src/modules/meetings/actions.ts:176`. Reason: pre-existing cross-action error normalization hardening.

## Deferred from: code review of 7-4-history-export-states-va-qa-nghiem-thu (2026-06-04)

- Forbidden E2E helper accepts HTTP 200 for Next dev authInterrupts forbidden UI in `tests/e2e/mvp-smoke.spec.ts:63`. Reason: framework dev-mode limitation; current smoke still asserts 403 UI and no data leakage, but production/status-level verification should be revisited separately.
- Risk-region smoke assertions were broadened to a generic `/risk/i` matcher in `tests/e2e/mvp-smoke.spec.ts:371`. Reason: pre-existing e2e brittleness from earlier dirty-worktree changes, outside Story 7.4 state/export fixes.

## Deferred from: code review of 8-4-ai-meeting-summary-va-future-ai-placeholders (2026-06-04)

- Follow-up server actions rely on page-level ready-status gating for meeting status in `src/modules/meetings/actions.ts:1063`. Reason: pre-existing follow-up workflow hardening from Story 6.5, not caused by AI Meeting Summary / future AI placeholder work.
- Generic risk action proposals can execute without source citation validation in `src/modules/ai/services/ai-action-proposal-service.ts:371`. Reason: shared AI proposal hardening outside the meeting-specific proposal path added in Story 8.4.
- Rejecting AI proposals is not protected by the same atomic claim pattern as accept in `src/modules/ai/services/ai-action-proposal-service.ts:179`. Reason: pre-existing shared proposal lifecycle race, should be fixed across all proposal types together.
- AI proposal accept path does not enforce `workflowStatus` before executing shared proposal types in `src/modules/ai/services/ai-action-proposal-service.ts:105`. Reason: pre-existing shared proposal lifecycle hardening, broader than Story 8.4.

## Deferred from: code review of 2-11-dashboard-tong-quan-alignment-theo-yeu-cau-1-1 (2026-06-06)

- Non-Dashboard test assertion rewrites are present in `tests/unit/command-center-dashboard.test.tsx` around role workspace, Morning Briefing, Common Center, and Approval Center assertions. Reason: this looks like existing localization/dirty-worktree churn outside Dashboard Tổng Quan AC1-5; keep Story 2.11 review focused on dashboard behavior.
