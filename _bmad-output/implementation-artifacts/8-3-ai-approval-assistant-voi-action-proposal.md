# Story 8.3: AI Approval Assistant Voi Action Proposal

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a nguoi duyet,  
I want AI Approval Assistant tom tat request va de xuat cau hoi/rui ro o dang advisory,  
so that toi xu ly approval nhanh hon nhung van tu quyet dinh.

## Acceptance Criteria

1. Given approval detail trong scope, when nguoi dung mo AI Approval Assistant, then AI tom tat request, policy, attachments/linked sources, rui ro va missing information voi citation hop le.
2. Given AI de xuat return/request changes hoac ask for meeting, when hien thi proposal, then proposal co preview record bi anh huong, field/action se thay doi, permission can co va nut xac nhan ro.
3. Given nguoi dung khong xac nhan proposal, when dong AI panel hoac reject proposal, then khong co mutation nao xay ra tren approval.
4. Given nguoi dung xac nhan proposal, when action duoc thuc thi, then he thong re-check domain permission, goi service action tuong ung va ghi audit.

## Tasks / Subtasks

- [x] Xac nhan implementation hien co truoc khi sua (AC: 1, 2, 3, 4)
  - [x] Doc `src/modules/ai/README.md`, `src/modules/ai/types.ts`, `services/ai-gateway-service.ts`, `ai-worker-service.ts`, `ai-coordinator-service.ts`, `ai-response-validator.ts`, `ai-action-proposal-service.ts`, `ai-proposal-presenter.ts`, `ai-ux-service.ts`.
  - [x] Doc approval backbone: `src/modules/proposals/types.ts`, `validation.ts`, `actions.ts`, `services/proposal-service.ts`, `services/approval-center-service.ts`, `services/proposal-repository.ts`.
  - [x] Doc approval UI: `src/modules/executive/components/approval-request-detail.tsx`, `approval-action-panel.tsx`, `src/modules/executive/types/index.ts`.
  - [x] Doc tests hien co: `tests/unit/ai-action-proposal-service.test.ts`, `ai-coordinator-service.test.ts`, `ai-response-validator.test.ts`, `ai-ux-service.test.tsx`, `proposal-actions.test.ts`, `proposal-service.test.ts`, `approval-center-detail-service.test.ts`, `approval-request-detail.test.tsx`.
  - [x] Khong tao approval flow, AI gateway, repository, chatbot hoac route song song.

- [x] Tao approval-specific AI assistant service/DTO (AC: 1, 2, 3)
  - [x] Them thin adapter trong `src/modules/ai/services`, vi day la AI boundary hien huu; ten de xuat: `ai-approval-assistant-service.ts`.
  - [x] Adapter phai nhan `ApprovalCenterDetailData` da duoc `getApprovalCenterDetailData` tao sau khi filter permission/scope; khong nhan raw `ProposalDetail` truc tiep tu component.
  - [x] Build source context tu cac field da sanitize: `requestSummary`, `policy`, `overdue`, `escalation`, `linkedSources` co `state: "linked"`, va `history` chi khi `permissions.canViewAudit` true.
  - [x] Khong dua amount/finance payload vao prompt/DTO khi `requestSummary.financialAccess !== "allowed"`.
  - [x] Khong dua linked source `state: "no_permission"` vao prompt, citation, proposal payload, history hoac UI.
  - [x] DTO toi thieu: `status` (`draft` | `insufficient_context` | `unavailable`), `summaryText`, `riskNotes`, `missingInformation`, `suggestedQuestions`, `citations`, `generatedFrom`, `updatedAt`, optional `interactionId`, `jobId`, `actionProposals`.
  - [x] Neu approval khong con actionable (`approved`, `rejected`, `cancelled`, final status) thi assistant van co the tom tat read-only neu du citation, nhung khong tao action proposal.

- [x] Chay assistant qua AI Gateway voi citation map da duoc app phe duyet (AC: 1)
  - [x] Reuse `askAi`/`processAiJob` va `AiAskInput` thay vi goi provider tu component. Module co the dung `general` de tranh them AI module moi, nhung adapter phai tu enforce `proposal.view`/scope truoc khi goi.
  - [x] `resourceRefs` phai lay tu citation map da loc: proposal id, linked project/document/meeting/legal/task/decision neu state linked; khong tin resource id tu client.
  - [x] Prompt phai yeu cau AI chi dung approval context da loc, noi ro thieu du lieu neu citation/context khong du, va khong tuyen bo da approve/reject/return/tao meeting.
  - [x] Provider citations phai intersect voi app-approved citation map giong pattern Story 8.2; provider citation la/ngoai scope -> `insufficient_context`, khong render.
  - [x] `wantsActionProposal` chi true khi user co `ai.propose_action` va approval detail co enabled action tu `permissions.availableActions`.
  - [x] Khong dung web search hoac source chua approve cho approval assistant.

- [x] Hoan thien approval action proposal lifecycle (AC: 2, 3, 4)
  - [x] Mo rong `AiActionProposalKey` va presenter/service de support approval-specific actions trong scope story nay: `approval_request_change` va `approval_ask_meeting`.
  - [x] Proposal payload phai co preview ro: `proposalId`, `sourceType: "proposal"`, `approvalAction` (`request_change` hoac `ask_meeting`), `currentStatus`, `nextStatus`, `reason` hoac `agendaDraft`/`meetingType`, `requiredPermission`, `affectedFields`, `sourceCitationIds`.
  - [x] `approval_request_change` phai co reason du de pass `proposalApprovalActionSchema`; `approval_ask_meeting` phai co `meetingType` hoac `agendaDraft`.
  - [x] Accept path phai goi `acceptAiActionProposal` hoac service tuong duong, re-check `ai.confirm_action`, re-check `proposal.request_change`/`proposal.approve` va scope, roi goi `applyProposalApprovalAction` trong `proposal-service.ts`; khong goi `applyApprovalDetailAction` neu action do redirect/FormData-only.
  - [x] Reject path chi update AI proposal status `rejected` va audit `ai_action_proposal.reject`; khong goi proposal service.
  - [x] Neu proposal khong con `proposed`, proposal da duoc xu ly boi request khac, approval status da doi, step khong con hop le, hoac user mat quyen, accept phai fail an toan va khong mutate approval.
  - [x] Audit phai co safe summary: action key, proposal id, previous/new proposal status/step status, decision id/version neu thuc thi; khong ghi raw prompt, raw AI text dai, raw finance data hoac hidden source ids.
  - [x] Revalidate sau accept: `/command-center`, `/executive`, `/approvals/proposal/{id}`, `/proposals/{id}`, `/ai`, job detail neu co, va project route neu execution result co projectId.

- [x] Them AI Approval Assistant panel trong approval detail UI (AC: 1, 2, 3)
  - [x] Cap nhat `ApprovalCenterDetailData` hoac page composition de dua `aiAssistant` vao `ApprovalRequestDetail` ma khong lam component fetch provider.
  - [x] Tao component compact trong `src/modules/ai/components` hoac `src/modules/executive/components`; dat gan approval detail/action panel, khong tao landing page hay chatbot chung.
  - [x] UI phai co label draft/goi y, generated timestamp, citations gan voi tung nhan dinh, insufficient/unavailable state, va action proposal preview.
  - [x] Preview proposal phai hien record bi anh huong, action se thuc thi, field/payload chinh, permission can co, citation nguon va nut `Xac nhan...` ro rang; reject proposal khong doi business record.
  - [x] Neu user khong co `ai.propose_action` hoac domain action disabled, panel chi hien tom tat/cau hoi/rui ro advisory, khong hien confirm mutation controls.
  - [x] UI khong phu thuoc mau don thuan, giu text label, khong de text tieng Viet tran card/button tren mobile.

- [x] Giu permission, scope, audit va finance redaction (AC: 1, 2, 3, 4)
  - [x] Direct URL/out-of-scope approval detail phai tiep tuc tra `undefined`/403 va khong tao AI request.
  - [x] Scoped user chi thay citation/linked source trong assignment/scope hien tai; external/viewer/read-only khong duoc thay hidden data roi moi an o UI.
  - [x] Secretary/assistant delegation khong duoc approve/reject/request-change thay lanh dao trong MVP; giu guard `assertNoDelegatedApprovalContext` cua proposal service.
  - [x] Finance-sensitive approvals phai giu `amountLabel` undefined khi user khong co `finance.view`; AI prompt, answer, citation, proposal payload va audit khong duoc lo amount do.
  - [x] History/audit chi vao AI context khi `canViewAudit` true; neu false thi khong dua raw audit events, oldValue/newValue vao prompt.

- [x] Test va validation (AC: 1, 2, 3, 4)
  - [x] Unit test `ai-approval-assistant-service.test.ts`: draft summary voi app citation, insufficient context khi thieu citation, unavailable khi provider fail, reject provider citation ngoai map, finance/audit/source redaction.
  - [x] Unit test proposal lifecycle trong `ai-action-proposal-service.test.ts`: accept `approval_request_change` goi `applyProposalApprovalAction`, reject khong mutate, unauthorized/mat quyen/old status/concurrent claim fail an toan, audit safe.
  - [x] Unit/component test UI: `approval-request-detail.test.tsx` hoac `ai-approval-assistant-panel.test.tsx` cho draft label, citation rendering, proposal preview, no action controls khi user thieu quyen, insufficient state.
  - [x] Server action test neu cap nhat `src/modules/ai/actions.ts`: revalidate dung approval/project/AI routes va redirect dung noi sau accept/reject.
  - [x] Regression tests lien quan: approval detail out-of-scope, finance redaction, audit hidden, proposal action validations.
  - [x] Targeted command khi lap trinh: `npm run test -- tests/unit/ai-approval-assistant-service.test.ts tests/unit/ai-action-proposal-service.test.ts tests/unit/approval-request-detail.test.tsx tests/unit/proposal-actions.test.ts tests/unit/approval-center-detail-service.test.ts`.
  - [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`.

### Review Findings

- [x] [Review][Patch] HIGH: AI approval confirm path khong rehydrate selected scope truoc domain mutation [`src/modules/ai/actions.ts:34`]
- [x] [Review][Patch] HIGH: Unauthorized accept co the claim/mark failed approval proposal truoc khi domain permission fail [`src/modules/ai/services/ai-action-proposal-service.ts:100`]
- [x] [Review][Patch] HIGH: AI approval proposal stale check chi so currentStatus, khong so currentStep/version [`src/modules/ai/services/ai-action-proposal-service.ts:395`]
- [x] [Review][Patch] HIGH: AI Approval Assistant provider context co the vuot app-approved citation map [`src/modules/ai/services/ai-coordinator-service.ts:101`]
- [x] [Review][Patch] HIGH: Approval action payload co the execute proposalId khac targetEntityId [`src/modules/ai/services/ai-action-proposal-service.ts:557`]
- [x] [Review][Patch] MEDIUM: Scoped approval proposal visibility dung raw `can()` thay vi enabled scoped action [`src/modules/ai/services/ai-approval-assistant-service.ts:640`]
- [x] [Review][Patch] HIGH: Approval detail route disables provider/action-proposal path, so AI suggestions have no production UI path [`src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx:91`]
- [x] [Review][Patch] MEDIUM: AI proposal confirm/reject form drops selected scopeId from returnTo [`src/modules/ai/components/ai-approval-assistant-panel.tsx:98`]

## Dev Notes

### Current State

- Story 8.1 da hoan thanh AI Gateway/Coordinator/Worker/Prompt/Validator/Repository/Knowledge RAG va harden citation/action-proposal safety.
- Story 8.2 da them `src/modules/ai/services/executive-ai-summary-service.ts`, `ExecutiveAiSummary` DTO, provider/citation intersection, placeholder/insufficient/unavailable states va action proposal projection advisory-only.
- `ApprovalRequestDetail` hien render request summary, linked sources, policy, overdue/escalation, history/audit va `ApprovalActionPanel`.
- `getApprovalCenterDetailData` la source DTO dung cho approval detail; service nay da enforce `canViewApprovalCenter`, `canReadProposalInScope`, selected scope, linked source redaction, finance redaction, audit visibility va action availability.
- `applyApprovalDetailAction` trong `src/modules/proposals/actions.ts` parse FormData, goi `applyProposalApprovalAction`, ghi audit, revalidate `/command-center`, `/proposals`, `/approvals/proposal/{id}` va redirect.
- `applyProposalApprovalAction` trong `proposal-service.ts` support `approve`, `reject`, `request_change`, `forward`, `ask_meeting`, `hold`, `cancel`, tao `ProposalDecision.version`, step transition va generated meeting-request link.
- `AiActionProposalService` hien support task/document/legal/meeting action item/risk. Chua co support approval request-change/ask-meeting; story nay phai them co kiem soat.

### Previous Story Intelligence

- Story 8.2 review da phat hien cac loi can tranh lai: provider request khong bind vao selected scope/source citations, provider citations duoc accept ma khong intersect app-approved source map, deterministic fallback bi gan nham `draft`, va provider failure bi collapse thanh `insufficient_context`.
- Story 8.1 review da phat hien hidden `projectId` co the ro vao proposal payload, citation requirement qua heuristic, raw prompt/intent co the vao proposal title/payload, va negated risk wording co the tao risk proposal sai. Story 8.3 phai co regression cho cac mau loi nay trong approval context.

### Architecture Guardrails

- Internal flow bat buoc: approval detail loader/service -> sanitized approval context -> `askAi`/worker -> cited answer -> optional `AiActionProposal` -> human confirmation -> `applyProposalApprovalAction`.
- AI output la draft/goi y/proposed. Khong tu approve, reject, return, forward, hold, cancel hoac tao meeting-request cho den khi user xac nhan.
- Permission-aware UI khong phai security. Confirm path phai re-check `ai.confirm_action`, domain permission (`proposal.request_change` hoac permission step/action phu hop) va scope tai service/action.
- Khong them Redux/Zustand, ORM, tRPC, provider SDK moi, database layer moi hoac AI route rieng neu co the reuse boundary hien huu.
- Khong hardcode role/approver/threshold/policy trong AI prompt hoac UI. Lay tu `ApprovalCenterDetailData.policy`, `permissions.availableActions` va proposal service.
- Neu them persistence field cho AI action proposals hoac proposal repository, update JSON repository, Supabase repository/row mapping, migration/RLS/policies/seeds va tests cung luc. Prefer khong doi DB neu existing JSON payload du dap ung.

### Suggested File Map

- Likely new: `src/modules/ai/services/ai-approval-assistant-service.ts`.
- Likely AI type updates: `src/modules/ai/types.ts`, `services/ai-action-proposal-service.ts`, `services/ai-proposal-presenter.ts`, `components/ai-proposal-detail.tsx`, `components/ai-job-detail.tsx`, maybe `actions.ts`.
- Likely approval detail updates: `src/modules/executive/types/index.ts`, `src/modules/executive/components/approval-request-detail.tsx`, `approval-action-panel.tsx` only if layout/action placement needs coordination.
- Likely proposal service reuse: `src/modules/proposals/services/proposal-service.ts`, `src/modules/proposals/validation.ts`, `src/modules/proposals/actions.ts` should remain canonical; avoid duplicate mutation logic.
- Tests to extend/add: `tests/unit/ai-approval-assistant-service.test.ts`, `ai-action-proposal-service.test.ts`, `ai-ux-service.test.tsx`, `approval-request-detail.test.tsx`, `approval-center-detail-service.test.ts`, `proposal-actions.test.ts`.

### Data Contract Guidance

- `AiActionProposal.actionKey` may be extended with:
  - `approval_request_change` -> maps to `ProposalApprovalActionInput` `{ action: "request_change", reason }`; required permission should be `proposal.request_change`.
  - `approval_ask_meeting` -> maps to `{ action: "ask_meeting", meetingType?, agendaDraft? }`; required permission should match enabled approval action/step permission, normally `proposal.approve` unless architecture decides otherwise.
- Proposal payload must be business-safe and previewable. Do not store raw provider answer, raw prompt, raw hidden source, raw audit values, or finance amount hidden by permission.
- `targetEntityType` should be `"proposal"` and `targetEntityId` should be the proposal id for approval actions.
- If user confirms after approval status changes, service must reload current proposal detail and fail if action is no longer enabled.
- Rejecting an AI action proposal is not equivalent to rejecting the approval request.

### UX Requirements

- Panel should feel like an operational review aid inside approval detail: compact, scannable, near request context/actions.
- Required states: draft/goi y, insufficient context, unavailable, proposed action, accepted/rejected/failed proposal status.
- Required visible content: citation/source list, policy/permission signal, missing information, risk/caution notes, suggested questions, action proposal preview.
- Button labels must be explicit, for example `Xac nhan tra lai approval` or `Xac nhan yeu cau hop`; avoid generic `Apply`.
- Reject proposal button should say it rejects the AI proposal, not the approval request.

### Anti-Patterns To Avoid

- Do not call AI provider from `ApprovalRequestDetail` or any client component.
- Do not call `applyProposalApprovalAction` while generating summary/proposal.
- Do not create a second approval action service or duplicate proposal status machine.
- Do not trust model-generated citations or model-selected action payload without validating against app-approved citations and Zod/domain service.
- Do not show finance amount, hidden linked source ids, raw audit old/new values, raw prompt or technical JSON to non-admin users.
- Do not broaden AI coordinator access just because the user can view the approval page.

### Latest Technical Information

- No web research is required. Use repo-local docs, `package.json`, Story 8.1/8.2 implementation and current source.
- Package baseline remains Next.js 15.3.2, React 19, TypeScript 5.8.3, Vitest 3.1.3, Playwright 1.52.0, lucide-react 0.511.0.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-8-executive-ai-advisory.md` - Story 8.3]
- [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-085, FR-087, FR-088, FR-089, FR-090, NFR-005, NFR-009, NFR-010]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md` - UX-DR16, UX-DR23, UX-DR34]
- [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- [Source: `_bmad-output/implementation-artifacts/8-1-ai-gateway-voi-permission-context-va-citation.md`]
- [Source: `_bmad-output/implementation-artifacts/8-2-executive-ai-summary-draft-trong-workspace.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `src/modules/ai/README.md`]
- [Source: `src/modules/ai/services/executive-ai-summary-service.ts`]
- [Source: `src/modules/ai/services/ai-action-proposal-service.ts`]
- [Source: `src/modules/proposals/services/approval-center-service.ts`]
- [Source: `src/modules/proposals/services/proposal-service.ts`]
- [Source: `src/modules/proposals/actions.ts`]
- [Source: `src/modules/executive/components/approval-request-detail.tsx`]
- [Source: `src/modules/executive/components/approval-action-panel.tsx`]
- [Source: `tests/unit/approval-center-detail-service.test.ts`]
- [Source: `tests/unit/ai-action-proposal-service.test.ts`]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- 2026-06-04T11:16:20+07:00 - Story 8.3 created as ready-for-dev from Epic 8 backlog after Story 8.2 done.
- 2026-06-04T11:22:10+07:00 - Dev workflow started; sprint status moved to in-progress.
- 2026-06-04T11:25:00+07:00 - Existing AI/approval/source/test boundaries reviewed; implementation will reuse sanitized approval detail DTO and proposal service.
- 2026-06-04T11:42:00+07:00 - Implemented approval assistant DTO/service, approval action proposal lifecycle, compact panel, approval detail composition, and embedded accept/reject revalidation.
- 2026-06-04T11:50:00+07:00 - Targeted tests, typecheck, lint, and full unit suite passed; initial E2E exposed approval detail latency from synchronous provider rendering.
- 2026-06-04T12:03:54+07:00 - Route adjusted to render sanitized local advisory draft while provider/gateway proposal path remains service-backed; final typecheck, lint, full unit, and E2E passed.

### Implementation Plan

- Build approval assistant adapter from sanitized `ApprovalCenterDetailData`.
- Extend AI action proposal support for approval request-change and ask-meeting with safe preview payloads.
- Render contextual assistant panel in approval detail.
- Add targeted service/action/component regressions before final validation.

### Completion Notes List

- Added sanitized AI Approval Assistant adapter/DTO for approval detail, including app-approved citation intersection, finance/source redaction, provider failure states, and local advisory draft fallback for fast server render.
- Added approval-specific AI action proposal keys for request-change and ask-meeting, with accept/reject lifecycle through `applyProposalApprovalAction`, permission/scope re-checks, stale-status failure, safe audit summaries, and route revalidation.
- Added compact AI Approval Assistant panel on approval detail with draft/insufficient/unavailable states, citations, action proposal preview, explicit confirm buttons, and no mutation when rejected or advisory-only.
- Validation passed: `npm run typecheck`, `npm run lint`, `npm run test` (96 files, 694 tests), and `npm run test:e2e` (65 tests).

### File List

- `_bmad-output/implementation-artifacts/8-3-ai-approval-assistant-voi-action-proposal.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`
- `src/modules/ai/actions.ts`
- `src/modules/ai/components/ai-approval-assistant-panel.tsx`
- `src/modules/ai/services/ai-approval-assistant-service.ts`
- `src/modules/ai/services/ai-action-proposal-service.ts`
- `src/modules/ai/services/ai-coordinator-service.ts`
- `src/modules/ai/services/ai-proposal-presenter.ts`
- `src/modules/ai/types.ts`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/executive/types/index.ts`
- `tests/unit/ai-actions.test.ts`
- `tests/unit/ai-approval-assistant-panel.test.tsx`
- `tests/unit/ai-approval-assistant-service.test.ts`
- `tests/unit/ai-action-proposal-service.test.ts`
- `tests/unit/approval-request-detail.test.tsx`

## Change Log

- 2026-06-04: Created Story 8.3 implementation context and marked ready for dev.
- 2026-06-04: Started development for Story 8.3.
- 2026-06-04: Implemented AI Approval Assistant, approval action proposals, approval detail UI integration, tests, and moved story to review.
