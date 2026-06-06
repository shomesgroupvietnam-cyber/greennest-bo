# Story 5.5: Risk Alert, Overdue Escalation Va Draft Suggestions

Status: done

Ghi chu tao story: Ultimate context engine analysis completed. Story nay hoan tat lop canh bao risk cho Epic 5: official risk qua han phai co overdue/escalation metadata va mock notification theo policy; system/AI risk suggestion phai o dang draft/advisory cho toi khi nguoi co quyen chap nhan. Pham vi co y reuse official risk records cua Story 5.3/5.4, approval escalation/notification pattern cua Story 3.5 va AI action proposal pattern cua Epic 8 code hien co. Khong lam full Risk Center route, khong goi AI provider moi, khong tu dong tao official blocker, khong mo rong BO Settings UI lon neu resolver policy hien co dap ung du.

## Story

As a lanh dao,  
I want risk qua han va goi y risk tu he thong/AI chi xuat hien nhu canh bao draft cho toi khi duoc xac nhan,  
so that canh bao huu ich nhung khong tu tao blocker chinh thuc.

## Acceptance Criteria

1. **Official risk qua han duoc danh dau bang date-only business-day logic**
   - Given official risk/blocker dang active (`open | monitoring | in_progress | blocked`) va co `deadline` truoc ngay hien tai
   - When Executive Dashboard, Common Center, Morning Briefing, Private Workspace hoac Risk Summary load
   - Then risk item co `overdue.isOverdue = true`, `daysOverdue`, `severity`, `reason`, `ownerLabel`, `nextAction` tinh bang `businessDaysBetween`/Asia Ho Chi Minh date-only helpers
   - And terminal risk (`resolved | closed`) khong duoc tinh la overdue active alert.

2. **Escalation target va reminder duoc resolve theo policy neu co**
   - Given overdue risk co severity `high | critical` hoac so ngay qua han dat nguong policy
   - When service build risk alert metadata
   - Then `escalation.required`, `trigger`, `targets`, `policyId/policyLabel`, `thresholdDays` duoc resolve deterministic tu policy/scope/delegation hien co neu policy match
   - And neu khong co policy match, service van hien overdue metadata nhung khong bia `policy_escalation` target.

3. **Risk escalation notification co outbox, dedupe va RLS phu hop risk**
   - Given risk escalation required
   - When dashboard/center service queue reminder
   - Then notification outbox ghi/updated mot mock item voi dedupe key on dinh (`risk:recordId:policyId:trigger` hoac tuong duong), recipients an toan, source scope va audit `risk.escalation_queued` hoac `risk.escalation_updated`
   - And Supabase migration/RLS/type contract cho phep `source_type = risk` ma khong muon `proposal.view`; risk notification chi doc/ghi duoc khi user co `risk.view` trong scope lien quan.

4. **System/AI potential risk chi la draft/advisory**
   - Given he thong/AI detect potential risk tu du lieu user duoc phep xem
   - When tao suggestion
   - Then suggestion duoc luu/tra ve nhu `AiActionProposal` status `proposed` voi action key risk moi, `workflowStatus: DRAFT` neu field nay duoc dung, requiredPermission `risk.create`, citation/scope snapshot an toan
   - And khong co row moi trong `executive_risk_records`, khong tang official blocker/risk KPI, khong ghi audit success cua official risk create.

5. **Accept draft risk tao official risk qua service, permission va audit**
   - Given authorized user co `ai.confirm_action` va `risk.create` trong scope cua proposal
   - When accept risk suggestion
   - Then `acceptAiActionProposal` goi `createExecutiveRiskRecord` voi payload da validate/sanitize, khong goi repository truc tiep
   - And service check project/source/owner/risk group/scope nhu create risk thu cong, ghi audit cua official risk create va audit `ai_action_proposal.accept`
   - And user thieu `risk.create`, thieu project scope, proposal khong o `proposed`, hoac payload thieu field bat buoc bi chan truoc official write.

6. **UI hien thi canh bao/draft suggestion ro rang, khong leak data va khong dua vao mau**
   - Given user co/khong co risk va AI proposal permissions
   - When xem dashboard risk summary, priority queue, morning/common center hoac AI proposal detail
   - Then overdue/escalation badge co text label, target/next action ro rang, unauthorized user khong thay sensitive source data/draft payload
   - And draft risk suggestion co nut accept/reject/decision notes theo pattern AI proposal hien co, khong render nhu official blocker cho toi khi accept thanh cong.

## Tasks / Subtasks

- [x] Mo rong domain contract cho risk alert metadata (AC: 1, 2, 6)
  - [x] UPDATE `src/modules/executive/types/index.ts` va/hoac `src/modules/dashboard/types.ts`:
    - Prefer reuse shape `ApprovalOverdueState` / `ApprovalEscalationState` tren `ExecutiveDashboardSourceItem.overdue/escalation` de UI hien co doc duoc.
    - Neu can ten ro hon, add alias `RiskOverdueState = ApprovalOverdueState` va `RiskEscalationState = ApprovalEscalationState`; khong tao shape UI song song.
    - Add risk-specific helper types only for service input/output, not persisted lifecycle status.
  - [x] UPDATE `ExecutiveRiskSummary` neu can count/summary moi (vi du `overdue`, `escalated`) nhung giu backward compatibility voi consumers hien co.
  - [x] Khong them `draft`, `suggested`, `overdue`, `escalated` vao `ExecutiveRiskRecordStatus`; official lifecycle status van la Story 5.3/5.4 contract.

- [x] Tao risk alert service dung business-day va policy resolver (AC: 1, 2)
  - [x] ADD `src/modules/executive/services/risk-alert-service.ts`.
  - [x] Implement public helpers:
    - `resolveRiskOverdueState({ deadline, now, ownerLabel, policyLabel, thresholdDays })`.
    - `resolveRiskEscalationState({ record, overdue, policy, delegations, scope, notificationId })`.
    - `resolveRiskEscalationPolicyForRecord(record, policies)` hoac tuong duong.
  - [x] Reuse `businessDaysBetween` tu `src/lib/date/business-day.ts`; khong tinh qua han bang millisecond diff/local timezone.
  - [x] Policy resolver phai conservative va deterministic:
    - Chi dung active policy co scope khop record (`organizationId/projectId/axisId/workstreamId/moduleId/recordId`) va co `escalateAfterDays` hoac `escalateOnRiskLevels`.
    - Trong policy hien co, prefer `targetType: "general"` cho risk escalation; neu sau nay co targetType risk rieng thi resolver co the uu tien nhung story nay khong doi UI Settings lon.
    - Sort theo pattern `policy-settings-service` hien co: scope/level match truoc, `priority` ascending sau; khong chon random policy theo thu tu file.
    - Neu khong match policy, return `undefined` policy va khong them `policy_escalation` target.
  - [x] Escalation targets toi thieu gom owner/responsible principal neu co, delegate dang active/scope-match, va policy role target khi policy match.
  - [x] Tests phai cover missing/invalid deadline, due today warning, terminal record ignored, long overdue, risk-policy trigger, critical-overdue trigger, delegation scope filter.

- [x] Queue risk escalation notification va audit an toan (AC: 2, 3)
  - [x] UPDATE `src/lib/notifications/types.ts` add `NotificationOutboxSourceType | "risk"`.
  - [x] UPDATE `src/lib/notifications/notification-service.ts`:
    - Add `queueRiskEscalationNotification` hoac make existing queue helper accept `sourceType: "risk"` without approval-only naming leak.
    - Dedupe key phai on dinh va include source type/id/policy/trigger.
    - `status` phai reflect `queued | updated | acknowledged` nhu approval path; repeated dashboard loads khong tao duplicate.
  - [x] UPDATE `src/lib/notifications/notification-repository.ts` JSON + Supabase mapper type parity.
  - [x] ADD migration tiep theo, vi du `database/migrations/202606020002_extend_notification_outbox_risk_source.sql`:
    - Drop/recreate check constraint de source_type include `risk`.
    - Neu can, add/verify indexes cho `(source_type, source_id, status)`.
  - [x] UPDATE `database/policies/001_mvp_rls.sql` function `current_user_can_access_notification_outbox_item`:
    - `source_type = risk` phai resolve den `executive_risk_records` va require `risk.view` + project/scope read.
    - Non-risk branches giu behavior Story 3.5; khong thay risk bang `proposal.view`.
  - [x] UPDATE/ADD verification SQL, e.g. `database/verification/008_risk_notification_outbox_rls.sql`.
  - [x] Audit values compact/safe: ids, policy id/label, trigger, severity, target summary, daysOverdue, project/module/owner. Khong log raw document body, finance payload, meeting transcript, sourceData day du, AI prompt/output raw.

- [x] Gan overdue/escalation vao dashboard/risk surfaces (AC: 1, 2, 6)
  - [x] UPDATE `src/modules/executive/services/risk-status-service.ts`:
    - `buildExecutiveRiskItemFromRecord` nhan optional alert metadata hoac build qua service wrapper; khong duplicate sanitizer/manual override logic.
    - Overdue source signal co the lam suggestion red/likelihood high, nhung manual override tu Story 5.4 van la effective status neu co.
  - [x] UPDATE `src/modules/dashboard/services/executive-dashboard-service.ts`:
    - Khi load official active risk records, resolve overdue/escalation va queue notification neu required.
    - Risk summary, KPI, priority queue va todayDeadlines dung full active merged list, khong chi capped `items`.
    - Closed/resolved records tiep tuc excluded tu active risk summary nhu Story 5.4.
  - [x] UPDATE consumers neu can: `src/modules/executive/services/executive-common-center-service.ts`, `src/modules/executive/services/executive-morning-briefing-service.ts`, `src/modules/workspaces/services/executive-private-workspace-service.ts`, command center overview components.
  - [x] UI badges/blocks reuse pattern approval overdue/escalation in `executive-priority-queue.tsx`, `executive-morning-briefing.tsx`, `executive-common-center.tsx`; no color-only state.
  - [x] No full Risk Center route unless implementation proves existing surfaces cannot satisfy AC; if route is added, it must stay dense operational and permission-aware.

- [x] Them AI/system risk draft suggestion contract (AC: 4, 6)
  - [x] UPDATE `src/modules/ai/types.ts` add `AiActionProposalKey` value `create_risk_record`.
  - [x] UPDATE `src/modules/ai/services/ai-proposal-presenter.ts` label/normalizer/content items:
    - Label: "De xuat risk/blocker".
    - Content items should show safe title, level, category, deadline, owner, project/source/citation summary; no raw prompt/AI output.
  - [x] Add a typed parser/helper for risk proposal payload, e.g. `parseRiskActionProposalPayload`, with fields matching `createExecutiveRiskRecord` input:
    - `recordType`, `title`, `reason`, `categoryKey`, `level`, `deadline`, `ownerId`, `projectId`, optional `moduleId/sourceType/sourceId/nextAction`.
    - Validation must reject missing title/reason/category/level and invalid date-only deadline.
  - [x] System-created suggestions may come from rule/overdue detection or AI coordinator, but must persist only in `AiActionProposal`/draft DTO, not `executive_risk_records`.
  - [x] UPDATE `src/modules/ai/services/ai-coordinator-service.ts` only if needed:
    - It currently creates generic task/document proposals from `wantsActionProposal`.
    - Add risk proposal path only when job module/intent/resource refs clearly request risk advisory and user has `ai.propose_action`.
    - Required permission for proposal execution must be `risk.create`.
    - Do not store full original prompt beyond existing safe summary behavior.
  - [x] Keep `ai-response-validator` mutation safety; do not weaken `unsafe_mutation_claim` handling.

- [x] Execute accepted risk draft through official risk service (AC: 5)
  - [x] UPDATE `src/modules/ai/services/ai-action-proposal-service.ts`:
    - Extend `AiActionProposalServiceRepositories` with `riskRecords`, `riskGroups/settings`, `scopeAssignments`, `rolePermissionCatalog`, delegation deps and audit/user deps as required by `createExecutiveRiskRecord`.
    - Add `executeCreateRiskRecordProposal`.
    - `normalizeActionKey` must support `create_risk_record`; old aliases remain.
  - [x] The execute path must:
    - Assert project/source scope using existing access-scope helpers or risk service guard.
    - Call `createExecutiveRiskRecord(parsedPayload, user, deps)`; never call `riskRecordRepository.create` directly.
    - Return execution result `{ entityType: "risk", entityId, projectId, status }`.
  - [x] Preserve existing `acceptAiActionProposal` behavior:
    - Requires `ai.confirm_action`.
    - Requires `proposal.requiredPermission` (`risk.create`) before execute.
    - Fails non-`proposed` status.
    - Marks proposal `failed` and writes fail audit if risk service throws.
  - [x] If risk service writes official audit, do not duplicate sensitive payload in `ai_action_proposal.accept`; store compact execution result.

- [x] Server Actions/UI form states for draft accept/reject and risk alerts (AC: 4, 5, 6)
  - [x] Existing `acceptAiActionProposalAction`/`rejectAiActionProposalAction` can be reused. Update revalidation to include executive surfaces when a risk proposal is accepted:
    - `/ai`, `/command-center`, `/executive`, `/projects/${projectId}` if available.
  - [x] If form-state variants are missing for AI proposal detail, add serializable state action so validation/permission errors preserve decision notes and show Vietnamese error.
  - [x] UI must render draft risk suggestion separately from official risk cards; accepted proposal may link to created risk record/source after execution.
  - [x] Unauthorized users must not receive proposal payload then hide it client-side.

- [x] Testing va verification (AC: 1, 2, 3, 4, 5, 6)
  - [x] ADD `tests/unit/risk-alert-service.test.ts`:
    - date-only overdue calculations, invalid/missing deadlines, due today warning, terminal record exclusion.
    - policy match/no-match, priority order, long overdue, risk-policy, critical-overdue.
    - delegation target scope filtering and dedupe of targets.
  - [x] UPDATE `tests/unit/notification-outbox-service.test.ts` for `sourceType: "risk"`, dedupe/update/acknowledged behavior and safe recipient mapping.
  - [x] UPDATE `tests/unit/executive-dashboard-service.test.ts`:
    - official active risk gets overdue/escalation metadata and queues one notification.
    - repeated load does not duplicate notification.
    - closed/resolved risk ignored.
    - unauthorized user cannot serialize risk source data/notification.
  - [x] UPDATE `tests/unit/risk-status-service.test.ts` for overdue source signal and manual override precedence.
  - [x] UPDATE `tests/unit/ai-action-proposal-service.test.ts`:
    - `create_risk_record` proposal stays draft before accept.
    - accept requires `ai.confirm_action` + `risk.create`, calls risk service, writes audit, returns created risk.
    - invalid payload/no scope/non-proposed proposal fails and does not create official risk.
  - [x] UPDATE `tests/unit/ai-coordinator-service.test.ts` and `tests/unit/ai-proposal-presenter.test.ts` if risk suggestions are created/displayed there.
  - [x] UPDATE component tests (`executive-risk-summary.test.tsx`, `command-center-dashboard.test.tsx`, `executive-morning-briefing`/`common-center` tests or AI proposal detail tests) for overdue/escalation labels, draft accept/reject states and permission-hidden controls.
  - [x] UPDATE database/RLS tests (`tests/unit/risk-record-rls-policy.test.ts` or new `risk-notification-outbox-rls-policy.test.ts`) to assert `risk` source uses `risk.view`, not `proposal.view`.
  - [x] Run targeted tests during implementation:
    - `npm run test -- tests/unit/risk-alert-service.test.ts tests/unit/notification-outbox-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/risk-status-service.test.ts tests/unit/ai-action-proposal-service.test.ts`
  - [x] Run required gates before review: `npm run typecheck`, `npm run lint`, `npm run test`.
  - [x] Run `npm run test:e2e` only if implementation adds route/navigation behavior beyond existing component coverage.

### Review Findings

- [x] [Review][Patch] Dashboard official risk records must require `risk.view`; `project.view`/`proposal.view` may still show derived dashboard signals, but must not load/serialize `executive_risk_records`. [src/modules/dashboard/services/executive-dashboard-service.ts:1310]
- [x] [Review][Patch] Risk scope filtering should not allow official risk read access through `project.view`/`proposal.view`; keep the app-layer contract aligned with SQL `risk.view`. [src/modules/executive/services/risk-record-service.ts:624]
- [x] [Review][Patch] Non-overdue high/critical risks can trigger a `risk_policy` escalation and queue a `Risk qua han` notification; escalation/notification should require `overdue.isOverdue` or use non-overdue advisory wording without overdue queue semantics. [src/modules/executive/services/risk-alert-service.ts:280]
- [x] [Review][Patch] Risk Summary renders the red overdue block whenever `item.overdue` exists, so not-overdue items show `Qua han: none`; render only when `overdue.isOverdue`, due-today warning, or escalation is required. [src/modules/dashboard/components/executive-risk-summary.tsx:61]
- [x] [Review][Patch] Risk notification outbox RLS for `project_id is null` bypasses the stricter risk-record read helper; reuse `current_user_can_read_risk_record(...)` in the risk branch. [database/policies/001_mvp_rls.sql:1699]
- [x] [Review][Patch] Notification outbox insert/update policies reuse the read predicate, allowing any scoped viewer to write notification rows; split read/write predicates or route writes through a backend-only path. [database/policies/001_mvp_rls.sql:1725]
- [x] [Review][Patch] Risk escalation audit payload stores `thresholdDays` as `daysOverdue` and omits project/module/owner scope metadata required by AC3. [src/lib/notifications/notification-service.ts:163]
- [x] [Review][Patch] AI risk proposal generation/acceptance uses unscoped `can`/`assertCan` checks, so users with scoped `risk.create` assignments can be blocked before the official risk service checks scope. [src/modules/ai/services/ai-action-proposal-service.ts:89]
- [x] [Review][Patch] Risk proposal parser requires `nextAction` even though Story 5.5 marks it optional; accept valid drafts by defaulting/sanitizing next action before calling the official service. [src/modules/ai/services/ai-action-proposal-service.ts:530]
- [x] [Review][Patch] Accepting the same AI risk proposal concurrently can create duplicate official risks before either request marks the proposal accepted; add an atomic proposed-status claim or idempotency guard. [src/modules/ai/services/ai-action-proposal-service.ts:96]
- [x] [Review][Defer] Override/close RLS can update unrelated risk fields in the same direct SQL update. [database/policies/001_mvp_rls.sql:1650] - deferred, pre-existing from Story 5.4 lifecycle hardening
- [x] [Review][Defer] Direct SQL close policy does not mirror the service-level `risk.close_high` requirement for high/critical/blocker records. [database/policies/001_mvp_rls.sql:1591] - deferred, pre-existing from Story 5.4 lifecycle hardening
- [x] [Review][Defer] Risk update forms can submit sanitized dashboard display text back into official records. [src/modules/executive/components/risk-record-form.tsx:335] - deferred, pre-existing form/data-shape issue from earlier risk stories

## Dev Notes

### Business Context

- Epic 5 Story 5.5 covers overdue risk escalation and draft risk suggestions. It depends on Story 5.3 official risk record creation/update and Story 5.4 override/close/audit lifecycle. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`; `_bmad-output/implementation-artifacts/5-3-tao-va-cap-nhat-risk-blocker-theo-quyen.md`; `_bmad-output/implementation-artifacts/5-4-override-va-dong-risk-blocker-co-audit.md`]
- FR-064: system/AI can create alert/risk suggestion in draft only, not official blocker without confirmation. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-067: red/critical risk appears in Dashboard, Morning Briefing and Risk Center when viewer has permission. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-068: overdue risk reminders/escalation follow policy. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-087/FR-088: AI obeys current user permissions and uses only user-visible data. FR-089/FR-090: AI must not self-approve or create official blockers; AI output stays draft/suggestion until authorized confirmation. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- UX-DR16/UX-DR34 require contextual AI draft suggestions with citation and human confirmation before mutation. [Source: `_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md`; `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]

### Current Code State

- `src/lib/date/business-day.ts` already provides `businessDayIndex`, `businessDaysBetween`, `isBeforeBusinessDay`, `isSameBusinessDay`, `isDueOnOrBeforeBusinessDay` for Asia/Ho_Chi_Minh date-only logic. Use these for risk overdue.
- `src/modules/proposals/services/approval-escalation-service.ts` already has the closest implementation pattern for overdue severity, escalation targets, delegation scope and triggers (`long_overdue`, `risk_policy`, `critical_overdue`). Copy/adapt the pattern into executive risk context; do not mix risk records into proposal approval service.
- `src/lib/notifications/*` already has mock notification outbox, JSON/Supabase repository parity and dedupe/update behavior for approval escalation. Extend it for `risk` source type instead of adding a separate reminder store.
- `database/migrations/202605290003_add_approval_escalation_policy_and_notification_outbox.sql` currently checks source type in `proposal | leadership_approval | executive_action` and RLS gates non-proposal items with `proposal.view`. Story 5.5 must correct this for risk source.
- `src/modules/settings/services/policy-settings-repository.ts` default `approvalThresholds` include `targetType: "general"`, `escalateAfterDays: 3` and `escalateOnRiskLevels`. Use them as current policy source for risk escalation until a dedicated risk escalation policy UI exists.
- `src/modules/executive/services/risk-status-service.ts` already builds sanitized `RiskStatusSuggestion`, maps official risk records via `buildExecutiveRiskItemFromRecord`, and applies Story 5.4 manual override as effective status. Extend this path; do not create an unsanitized alternate mapper.
- `src/modules/dashboard/types.ts` already lets every `ExecutiveDashboardSourceItem` carry `overdue?: ApprovalOverdueState` and `escalation?: ApprovalEscalationState`. Reuse this for risk items so existing priority/common/morning components can render it.
- `src/modules/dashboard/services/executive-dashboard-service.ts` already resolves approval overdue/escalation and queues notifications while building dashboard DTO. Risk handling should follow the same injection/test pattern.
- `src/modules/ai/types.ts` currently supports action keys `create_task`, `request_document_update`, `update_legal_note`, `create_legal_followup_task`, `create_meeting_action_item`; add risk key deliberately.
- `src/modules/ai/services/ai-action-proposal-service.ts` currently accepts proposals by requiring `ai.confirm_action` and `proposal.requiredPermission`, then executes through domain services. Add risk execution through `createExecutiveRiskRecord`, not repository direct.
- `src/modules/ai/services/ai-proposal-presenter.ts` must be updated or `create_risk_record` will normalize to unknown and render generic labels.

### Architecture And Security Constraints

- Keep modular monolith boundaries: executive risk logic in `src/modules/executive`, AI draft lifecycle in `src/modules/ai`, notification/audit/date helpers in `src/lib`, dashboard aggregation in `src/modules/dashboard`. [Source: `_bmad-output/project-context.md`; `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- Internal mutations use Server Actions/service layer. Components/pages do not call repositories/Supabase directly. [Source: `_bmad-output/project-context.md`; `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- DTOs are camelCase; DB rows and migrations are snake_case. JSON repository and Supabase repository must stay contract-equivalent. [Source: `_bmad-output/project-context.md`]
- Permission-aware UI is not security. Enforce `risk.view`, `risk.create`, `ai.propose_action`, `ai.confirm_action` in services/actions and RLS where applicable. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Audit must be compact/safe and Vietnamese-domain-error friendly. Never write raw sensitive source data, raw AI output, raw prompt, finance payload, document body or meeting transcript. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- No new dependencies or major stack changes. Existing stack: Next 15.3.2 App Router, React 19, TypeScript 5.8.3, Tailwind 3.4.17, Zod 3.24.4, Supabase 2.49.4, Vitest and Playwright. [Source: `_bmad-output/project-context.md`; `package.json`]

### Implementation Boundaries

- Do not create official `executive_risk_records` from AI/system detection until a user accepts a draft through the official risk service.
- Do not treat `ai.confirm_action` alone as enough. Accept risk draft requires both `ai.confirm_action` and `risk.create` in scope.
- Do not add draft rows to `executive_risk_records.status`; draft state belongs to `AiActionProposal.status/workflowStatus` or a read-only advisory DTO.
- Do not bypass Story 5.4 terminal guards: closed/resolved risks are not active overdue alerts and cannot be mutated by generic update/override/close paths.
- Do not make dashboard loads create official blockers. Notification outbox reminder is allowed; official risk creation is not.
- Do not weaken `ai-response-validator`; if a provider says it mutated workflow directly, validator should still flag/block that claim.
- Do not store raw prompt in risk proposal payload beyond existing safe summary fields. Existing `createActionProposal` stores prompt slice for generic proposals; risk proposal should avoid expanding that pattern.
- Do not broaden RLS by reusing `proposal.view` for risk notification outbox.

### Project Structure Notes

- Suggested new/updated files:
  - `src/modules/executive/services/risk-alert-service.ts`
  - `src/modules/executive/services/risk-status-service.ts`
  - `src/modules/dashboard/services/executive-dashboard-service.ts`
  - `src/lib/notifications/types.ts`
  - `src/lib/notifications/notification-service.ts`
  - `src/lib/notifications/notification-repository.ts`
  - `src/modules/ai/types.ts`
  - `src/modules/ai/services/ai-action-proposal-service.ts`
  - `src/modules/ai/services/ai-proposal-presenter.ts`
  - `src/modules/ai/services/ai-coordinator-service.ts` only if system/AI suggestion generation is implemented there
  - `database/migrations/202606020002_extend_notification_outbox_risk_source.sql` or next valid timestamp
  - `database/policies/001_mvp_rls.sql`
  - `database/verification/008_risk_notification_outbox_rls.sql` or equivalent
- Existing UI components to reuse/update before adding new ones:
  - `src/modules/dashboard/components/executive-risk-summary.tsx`
  - `src/modules/dashboard/components/executive-priority-queue.tsx`
  - `src/modules/dashboard/components/executive-morning-briefing.tsx`
  - `src/modules/dashboard/components/executive-common-center.tsx`
  - AI proposal detail/action components under `src/modules/ai`.
- Keep tests near existing unit suites under `tests/unit`. Use targeted tests first, then baseline gates from `docs/context/testing.md`.

### Recent Worktree Notes

- Story 5.4 is done in the current workspace and adds official risk override/close fields, permissions `risk.override`, `risk.close`, `risk.close_high`, RLS updates, dashboard/private workspace action surfaces and tests. Build on those files; do not revert them.
- Recent full gates after Story 5.4 passed: `npm run typecheck`, `npm run lint`, `npm run test` (80 files / 519 tests in the latest review pass). Use this as baseline expectation, not as proof for Story 5.5.
- Worktree may be dirty with prior story artifacts. Treat unrelated changes as user/team work.

### References

- `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md`
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`
- `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`
- `_bmad-output/project-context.md`
- `docs/context/permissions-audit.md`
- `docs/context/testing.md`
- `_bmad-output/implementation-artifacts/5-3-tao-va-cap-nhat-risk-blocker-theo-quyen.md`
- `_bmad-output/implementation-artifacts/5-4-override-va-dong-risk-blocker-co-audit.md`
- `src/lib/date/business-day.ts`
- `src/modules/proposals/services/approval-escalation-service.ts`
- `src/lib/notifications/types.ts`
- `src/lib/notifications/notification-service.ts`
- `src/lib/notifications/notification-repository.ts`
- `database/migrations/202605290003_add_approval_escalation_policy_and_notification_outbox.sql`
- `database/policies/001_mvp_rls.sql`
- `src/modules/settings/services/policy-settings-repository.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/services/risk-record-service.ts`
- `src/modules/executive/services/risk-record-repository.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/ai/types.ts`
- `src/modules/ai/services/ai-action-proposal-service.ts`
- `src/modules/ai/services/ai-coordinator-service.ts`
- `src/modules/ai/services/ai-proposal-presenter.ts`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Targeted: `npm run test -- tests/unit/risk-alert-service.test.ts tests/unit/notification-outbox-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/risk-status-service.test.ts tests/unit/ai-action-proposal-service.test.ts tests/unit/ai-coordinator-service.test.ts tests/unit/ai-ux-service.test.tsx tests/unit/risk-record-form.test.tsx tests/unit/risk-record-rls-policy.test.ts` (9 files / 65 tests pass)
- Gate: `npm run typecheck` (pass)
- Gate: `npm run lint` (pass)
- Gate: `npm run test` (81 files / 535 tests pass)
- E2E not run: story did not add new route/navigation behavior beyond existing covered command-center/executive component flows.

### Implementation Plan

- Reuse existing `ApprovalOverdueState` / `ApprovalEscalationState` dashboard contract through risk aliases instead of introducing a parallel UI shape.
- Add an executive risk alert service that uses date-only business-day helpers and deterministic policy/delegation matching.
- Extend notification outbox source typing, SQL constraint/RLS, and queue helper for risk escalation with compact audit payloads.
- Attach overdue/escalation metadata while mapping official risk records into dashboard DTOs so Dashboard, Common Center, Morning Briefing and Private Workspace inherit the same sanitized risk items.
- Add `create_risk_record` draft proposal support and execute accepted drafts only through `createExecutiveRiskRecord`.

### Completion Notes List

- Added risk overdue/escalation resolution with terminal-status exclusion, policy priority/scope matching, delegate/owner/policy targets and stable notification status.
- Dashboard official risk records now carry overdue/escalation metadata, queue one deduped risk notification, include risk deadline items before cap, and keep closed/resolved risks out of active alert summaries.
- AI coordinator/presenter/action-proposal service now supports draft risk suggestions with `requiredPermission: risk.create`, safe risk content fields, parser validation, and official service execution on accept.
- Risk Summary renders overdue/escalation text labels, next action, policy and targets; existing priority/common/morning UI metadata rendering continues to work from the shared DTO.
- Supabase SQL now allows `notification_outbox.source_type = risk` and gates risk-source outbox access through `risk.view` plus risk/project scope checks.

### File List

- `_bmad-output/implementation-artifacts/5-5-risk-alert-overdue-escalation-va-draft-suggestions.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202606020002_extend_notification_outbox_risk_source.sql`
- `database/policies/001_mvp_rls.sql`
- `database/verification/008_risk_notification_outbox_rls.sql`
- `src/lib/notifications/notification-service.ts`
- `src/lib/notifications/types.ts`
- `src/modules/ai/actions.ts`
- `src/modules/ai/services/ai-action-proposal-service.ts`
- `src/modules/ai/services/ai-coordinator-service.ts`
- `src/modules/ai/services/ai-proposal-presenter.ts`
- `src/modules/ai/services/ai-repository.ts`
- `src/modules/ai/types.ts`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/executive/services/risk-alert-service.ts`
- `src/modules/executive/services/risk-record-service.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/executive/types/index.ts`
- `tests/unit/ai-action-proposal-service.test.ts`
- `tests/unit/ai-coordinator-service.test.ts`
- `tests/unit/ai-ux-service.test.tsx`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/notification-outbox-service.test.ts`
- `tests/unit/risk-alert-service.test.ts`
- `tests/unit/risk-record-form.test.tsx`
- `tests/unit/risk-record-rls-policy.test.ts`
- `tests/unit/risk-status-service.test.ts`

### Change Log

- 2026-06-02: Implemented Story 5.5 risk overdue/escalation alerts, risk notification outbox/RLS, draft AI risk proposals, official risk accept path, UI alert labels and tests.
- 2026-06-02: Applied BMAD code review patches for official risk visibility, risk notification RLS writes, escalation audit scope, scoped AI risk create, optional next action parsing and proposal accept idempotency.
