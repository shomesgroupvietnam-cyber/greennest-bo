# Story 8.4: AI Meeting Summary Va Future AI Placeholders

Status: done

Requirements Covered: FR-076, FR-085, FR-086, FR-087, FR-088, FR-089, FR-090, NFR-009, NFR-010, UX-DR16, UX-DR34

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a meeting host hoac lanh dao,  
I want AI Meeting Summary la draft va cac AI nang cao duoc hien thi nhu placeholder/mock khi chua trien khai,  
so that MVP minh bach pham vi AI va khong tao ky vong sai.

## Acceptance Criteria

1. Given meeting co transcript hoac minutes trong scope, when AI tao meeting summary, then summary o trang thai draft/goi y, co citation neu dung internal records, va can authorized approver xac nhan truoc khi tro thanh chinh thuc.
2. Given nguoi dung mo Executive AI Center, when xem AI Risk Analysis, AI KPI Analysis, AI Executive Copilot hoac AI Project Prediction, then he thong hien placeholder/mock/future enhancement label ro rang.
3. Given AI output de xuat tao task/risk/decision, when user muon ap dung, then output di qua action proposal preview va human confirmation, khong direct mutate domain table.

## Tasks / Subtasks

- [x] Xac nhan implementation hien co truoc khi sua (AC: 1, 2, 3)
  - [x] Doc `src/modules/ai/README.md`, `src/modules/ai/types.ts`, `services/ai-gateway-service.ts`, `ai-worker-service.ts`, `ai-coordinator-service.ts`, `ai-response-validator.ts`, `ai-action-proposal-service.ts`, `ai-proposal-presenter.ts`, `ai-ux-service.ts`.
  - [x] Doc AI adapters da co: `src/modules/ai/services/executive-ai-summary-service.ts`, `src/modules/ai/services/ai-approval-assistant-service.ts`.
  - [x] Doc meeting flow: `src/modules/meetings/types.ts`, `validation.ts`, `actions.ts`, `services/meeting-service.ts`, repository adapters, `src/app/(dashboard)/meetings/[meetingId]/page.tsx`, `components/meeting-detail-panels.tsx`.
  - [x] Doc Executive AI Center target hien co: `src/app/(dashboard)/ai/page.tsx`, `src/modules/ai/components/ai-ask-form.tsx`, va neu can `src/modules/workspaces/components/executive-private-workspace.tsx`.
  - [x] Doc tests lien quan: `tests/unit/meeting-service.test.ts`, `meeting-actions.test.ts`, `meeting-detail-panels.test.tsx`, `executive-ai-summary-service.test.ts`, `ai-approval-assistant-service.test.ts`, `ai-action-proposal-service.test.ts`, `ai-actions.test.ts`.
  - [x] Khong tao AI gateway, provider, repository, chatbot, database layer hoac route song song khi co the reuse boundary hien huu.

- [x] Tao meeting-specific AI summary service/DTO (AC: 1, 3)
  - [x] Them thin adapter trong `src/modules/ai/services`, ten de xuat `ai-meeting-summary-service.ts`; day la AI boundary hien huu, khong dat provider logic trong React component.
  - [x] Adapter chi nhan meeting/context da duoc scope-filter boi `getScopedMeeting` va cac scoped loaders hien co; khong nhan raw meeting/repository data tu client.
  - [x] Build source context tu du lieu da sanitize: meeting title, agenda, meetingMinutes, transcript neu co trong contract hien huu, existing `aiSummary`, visible related records, visible attachment metadata, visible decisions/follow-ups.
  - [x] Khong dua hidden related record ids, hidden attachment/document titles, out-of-scope project/task/risk/decision data, raw finance payload, hoac raw audit event vao prompt/citation/proposal payload.
  - [x] DTO toi thieu: `status` (`draft` | `placeholder` | `insufficient_context` | `unavailable`), `text`, `updatedAt`/`generatedAt`, `citations`, `generatedFrom`, optional `interactionId`, `jobId`, va optional `actionProposals`.
  - [x] Provider-disabled/local fallback phai la `placeholder` hoac read-only existing draft, khong gan nham thanh provider-backed `draft`.
  - [x] Neu khong co minutes/transcript/source citation hop le, tra `insufficient_context`; neu provider/gateway fail, tra `unavailable`; khong bia summary suy doan.

- [x] Chay AI Meeting Summary qua Gateway voi app-approved citation map (AC: 1, 3)
  - [x] Reuse `askAi`/worker/coordinator va dependency injection pattern cua Story 8.2/8.3; khong goi provider truc tiep.
  - [x] `resourceRefs` phai lay tu citation map app da approve: meeting id, project ids neu scoped, visible related document/task/proposal/risk/decision, visible attachment/document refs neu co quyen.
  - [x] Provider citations phai intersect voi app-approved citation map. Neu provider tra citation ngoai map hoac khong co citation can thiet thi khong render nhu draft hop le.
  - [x] Prompt phai noi ro AI summary la draft/goi y, khong phai official minutes, khong auto publish, khong auto tao task/risk/decision, va phai noi thieu du lieu khi context khong du.
  - [x] `wantsActionProposal` chi true khi user ro rang yeu cau de xuat hanh dong va co `ai.propose_action` cung domain permission/scope tuong ung; page load mac dinh khong tu tao proposal.
  - [x] Khong dung web search, external source, hoac source chua approve cho meeting summary.

- [x] Wire meeting detail generate flow ma khong bypass approval (AC: 1)
  - [x] Them Server Action trong `src/modules/meetings/actions.ts`, ten de xuat `generateMeetingAiSummaryDraftAction(meetingId, options?)`.
  - [x] Action phai `getCurrentUser` -> `getScopedMeeting` -> re-check `meeting.update` va AI permission (`ai.ask` hoac `ai.create_draft` theo permission catalog hien co) truoc khi tao/persist draft.
  - [x] Neu AI adapter tra `draft`, persist bang `updateMeetingAiSummaryDraft` de existing `Meeting.aiSummary.status` van la `DRAFT`; khong goi `approveMeetingAiSummary`.
  - [x] Neu adapter tra `placeholder`, `insufficient_context`, hoac `unavailable`, khong overwrite approved summary va khong ghi partial invalid draft.
  - [x] Hien citations tren meeting AI summary panel khi summary dung internal records. Prefer lay tu AI DTO/job display layer de tranh DB schema change; neu persist citation metadata vao `MeetingAiSummary`, update types, validation, JSON repo, Supabase mapping, migration/RLS va tests cung luc.
  - [x] Revalidate meeting detail route, project route neu co, `/ai`, va AI job/detail route neu co job/proposal.
  - [x] Audit chi ghi safe summary: actor, meeting id, source citation ids hop le, status transition, job/interaction id neu co; khong log raw minutes/transcript/prompt/provider output.

- [x] Cap nhat meeting AI summary UI (AC: 1, 3)
  - [x] Extend `MeetingAiSummaryPanel` hoac tao component AI panel gan meeting detail; component nhan DTO tu server/page, khong fetch provider tren client.
  - [x] UI phai hien label `Ban nhap AI`/`Goi y AI`, generated timestamp, citations, insufficient/unavailable/placeholder state, va approve action rieng biet.
  - [x] Approve button chi hien khi user co permission hien huu (`meeting.update` hoac permission duoc service yeu cau) va summary dang `DRAFT`; approved state phai ro rang la da duoc nguoi co quyen xac nhan.
  - [x] Read-only user van xem duoc allowed summary/citations nhung khong thay generate/approve/confirm mutation controls.
  - [x] Text tieng Viet tren mobile khong tran button/card; khong dung mau sac lam dau hieu duy nhat cho draft/approved/unavailable state.

- [x] Them future AI placeholders trong Executive AI Center (AC: 2)
  - [x] Treat `/ai` la Executive AI Center MVP neu khong co route chuyen biet; cap nhat `src/app/(dashboard)/ai/page.tsx` va component trong `src/modules/ai/components`.
  - [x] Hien bon feature: `AI Risk Analysis`, `AI KPI Analysis`, `AI Executive Copilot`, `AI Project Prediction` voi label ro `Future enhancement`, `Mock`, hoac `Chua trien khai trong MVP`.
  - [x] Placeholder khong duoc co CTA/submit/action tao ky vong rang feature dang production-ready.
  - [x] Neu co panel `AiExecutiveCopilotPanel` trong workspace/executive UI, giu no o trang thai placeholder/future label; khong bien thanh real copilot trong story nay.
  - [x] Dat danh sach feature trong mot constant/component nho thay vi scattered hardcode trong nhieu file.

- [x] Giu action proposal preview + human confirmation cho task/risk/decision (AC: 3)
  - [x] AI summary co the de xuat hanh dong nhung phai tao `AiActionProposal` `proposed`/`DRAFT` only; khong goi `createTask`, risk service, decision/meeting service trong generation path.
  - [x] Reuse keys hien co neu du: `create_task`, `create_risk_record`, `create_meeting_action_item`. Neu can official decision key moi, phai extend `AiActionProposalKey`, service executor, presenter/UI, validation, scope checks va tests.
  - [x] Proposal payload phai co `targetEntityType: "meeting"`, `targetEntityId`, `meetingId`, `requiredPermission`, `affectedFields`, `sourceCitationIds`, preview text, va stale guard tu current meeting state (`updatedAt`, `aiSummary.status`, hoac version neu co).
  - [x] Accept path phai re-check `ai.confirm_action`, required domain permission, meeting scope, proposal status `proposed`, stale meeting state, va citation/source validity truoc khi mutate.
  - [x] Reject path chi update AI proposal status/audit; khong mutate meeting/task/risk/decision.
  - [x] Contextual proposal form can preserve `returnTo` ve `/meetings/{meetingId}` va selected scope; khong drop scopeId nhu loi review Story 8.3.

- [x] Giu permission, scope, audit va privacy (AC: 1, 2, 3)
  - [x] Direct URL/out-of-scope meeting khong duoc tao AI request hay citation.
  - [x] Meeting visibility enforced server/service-side truoc prompt, citation, serialization va mutation; UI hide khong duoc xem la security.
  - [x] AI chi doc/summarize/suggest tu records user hien tai co the view; khong lay hidden attachments/related records roi moi an o UI.
  - [x] AI khong auto approve, auto decide, auto create official blocker, auto publish official minutes, hoac auto tao task/risk/decision.
  - [x] Meeting organization-only/multi-project phai duoc handle; khong assume `projectId` duy nhat neu DTO co `projectIds`.
  - [x] Safe audit: khong raw transcript/minutes/raw AI output, khong hidden ids, khong finance data ngoai scope.

- [x] Test va validation (AC: 1, 2, 3)
  - [x] Them `tests/unit/ai-meeting-summary-service.test.ts`: provider success + app-approved citations, insufficient khi thieu minutes/transcript/citation, reject provider citation ngoai map, provider failure unavailable, hidden related/attachment redaction, no proposals unless requested + permission.
  - [x] Extend `tests/unit/meeting-actions.test.ts`: generate action requires scoped meeting, AI permission + `meeting.update`, persists `DRAFT` qua `updateMeetingAiSummaryDraft`, khong approve, khong partial write khi provider fail.
  - [x] Extend `tests/unit/meeting-detail-panels.test.tsx`: draft label, citations, generate state, approve separation, read-only no controls, placeholder/insufficient/unavailable copy.
  - [x] Extend `tests/unit/ai-action-proposal-service.test.ts` neu them/doi meeting-specific proposal execution/stale guard/returnTo.
  - [x] Them/extend route/component test cho future placeholders trong `/ai` hoac Executive AI Center.
  - [x] Targeted command khi lap trinh: `npm run test -- tests/unit/ai-meeting-summary-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-detail-panels.test.tsx tests/unit/ai-action-proposal-service.test.ts`.
  - [x] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`.

### Review Findings

- [x] [Review][Patch] Meeting proposal detail drops `returnTo` and selected scope [`src/modules/ai/components/ai-proposal-detail.tsx:72`]
- [x] [Review][Patch] Meeting action proposal accept does not fully enforce stale state and citation/source validity [`src/modules/ai/services/ai-action-proposal-service.ts:342`]
- [x] [Review][Patch] Provider-backed meeting summary generation omits scoped related records, decisions and follow-up context [`src/modules/meetings/actions.ts:986`]
- [x] [Review][Patch] AI proposal detail can expose meeting proposal payloads without target meeting scope check [`src/app/(dashboard)/ai/proposals/[proposalId]/page.tsx:19`]
- [x] [Review][Patch] Executive Copilot panel still exposes an Ask CTA instead of an MVP/future placeholder [`src/modules/executive/components/executive-leadership-dashboard.tsx:724`]
- [x] [Review][Patch] Meeting summary citation map includes all `projectIds` without per-project scope filtering [`src/modules/ai/services/ai-meeting-summary-service.ts:179`]
- [x] [Review][Defer] Follow-up server actions rely on page-level ready-status gating for meeting status [`src/modules/meetings/actions.ts:1063`] — deferred, pre-existing
- [x] [Review][Defer] Generic risk action proposals can execute without source citation validation [`src/modules/ai/services/ai-action-proposal-service.ts:371`] — deferred, pre-existing
- [x] [Review][Defer] Rejecting AI proposals is not protected by the same atomic claim pattern as accept [`src/modules/ai/services/ai-action-proposal-service.ts:179`] — deferred, pre-existing
- [x] [Review][Defer] AI proposal accept path does not enforce `workflowStatus` before executing shared proposal types [`src/modules/ai/services/ai-action-proposal-service.ts:105`] — deferred, pre-existing

## Dev Notes

### Current State

- Story 8.1 da hoan thanh AI Gateway/Coordinator/Worker/Prompt/Validator/Provider abstraction, citation contract, AI repositories, va proposed-only `AiActionProposal` backbone.
- Story 8.2 da them `ExecutiveAiSummary` DTO va `buildExecutiveAiSummaryDraft` voi provider/citation intersection, `placeholder`, `insufficient_context`, `unavailable`, va advisory proposal safety.
- Story 8.3 da them `AiApprovalAssistant` va approval action proposal lifecycle; review patches da fix selected-scope rehydration, unauthorized accept preflight, stale status/step/version checks, provider-context citation map, target proposal id match, route provider/action path, va scoped `returnTo`.
- Story 6.4 da them meeting minutes/attachments/AI summary draft approval: `MeetingAiSummary`, `updateMeetingAiSummaryDraft`, `approveMeetingAiSummary`, `updateMeetingAiSummaryDraftAction`, `approveMeetingAiSummaryAction`, va `MeetingAiSummaryPanel`.
- Meeting AI summary hien tai la manual editable draft/approval panel. Chua co meeting-specific AI adapter, provider-backed cited draft generation, hoac action proposal preview gan meeting detail.
- `/ai` hien la Tro ly AI/Executive AI Center MVP entry voi ask form va presets; chua co placeholder ro cho advanced AI Risk/KPI/Copilot/Prediction.
- `AiActionProposalService` da support `create_task`, `create_risk_record`, va `create_meeting_action_item`. `create_meeting_action_item` hien execute legacy meeting decision/action item flow; dung lai neu phu hop, hoac mo rong co tests neu official decision contract khac.

### Previous Story Intelligence

- Tranh lap lai loi Story 8.2: provider request phai bind vao source/citation scope; provider citations phai intersect app-approved map; deterministic fallback khong duoc label `draft`; provider failure phai la `unavailable`.
- Tranh lap lai loi Story 8.3: accept/reject contextual form phai preserve selected scope/returnTo; confirm path phai preflight permission truoc khi claim proposal; stale checks can current status/step/version/state; target id trong payload phai match proposal target.
- Tu Story 6.4: AI draft update reset approved metadata khi content thay doi va audit safe summary; keep approved summary official only after explicit approve action.

### Architecture Guardrails

- Internal AI flow bat buoc: scoped loader/service -> sanitized source context -> `askAi`/worker/coordinator -> cited answer -> optional `AiActionProposal` -> human confirmation -> domain service.
- Components/routes khong goi provider hoac repository truc tiep. Business logic nam trong service/action layer, testable bang dependency injection.
- AI Meeting Summary la draft/goi y cho den khi authorized approver xac nhan. Khong publish official minutes, approval, decision, risk, blocker, task hoac audit conclusion tu AI output.
- Permission server/service la bat buoc truoc write va serialization; UI hiding chi la UX.
- Khong them new state manager, ORM, AI SDK/provider SDK, database layer, global store, hoac external dependency moi.
- Neu doi persisted meeting summary contract, update ca JSON repository, Supabase repository/row mapping, migrations/policies/seeds va tests; prefer DTO/job citation display neu dap ung AC ma khong can schema change.

### Data Contract Guidance

- `MeetingAiSummary` hien co thuoc meetings domain: `status`, `content?`, `approvedBy?`, `approvedAt?`. Story nay nen giu official approval semantics do, chi persist provider result nhu `DRAFT`.
- `AiMeetingSummary` nen nam trong AI module va co UI-safe citations/action proposals. Field names nen gan pattern `ExecutiveAiSummary`/`AiApprovalAssistant` de component/test de reuse.
- Citation items can include `id`, `label`, `sourceType`, `sourceId`, optional `href`, optional `excerpt` da redact. Khong include raw transcript/minutes dai trong citation.
- Generated source metadata nen noi ro `meeting`, `minutes`, `transcript`, `attachments`, `related_records` ma khong reveal hidden ids.

### UX Requirements

- Meeting detail phai lam ro khac biet giua `Tao ban nhap AI`, `Luu ban nhap`, va `Duyet thanh chinh thuc`.
- Placeholder advanced AI features phai quiet/operational, khong marketing hero, khong decorative landing page.
- Draft/suggestion/proposed state phai co text label, khong chi mau sac. Buttons can co icon tu `lucide-react` neu component hien co dung lucide.
- Proposal preview phai hien record bi anh huong, action se thuc thi, permission can co, citation nguon va confirm/reject controls ro rang.

### Out Of Scope

- Real speech-to-text/transcript ingestion.
- Fully automated meeting minutes publishing.
- Production AI Risk Analysis, AI KPI Analysis, Executive Copilot, Project Prediction.
- Direct AI mutation vao task/risk/decision/meeting domain records.
- New AI provider integration, new chat surface, hoac new DB/persistence layer neu existing AI backbone du dung.

### References

- PRD: `_bmad-output/planning-artifacts/prd/requirements.md` (`FR-076`, `FR-085`-`FR-090`, `NFR-009`, `NFR-010`).
- UX requirements: `_bmad-output/planning-artifacts/ux/requirements.md` (`UX-DR16`, `UX-DR34`).
- Epic: `_bmad-output/planning-artifacts/epics/epic-8-executive-ai-advisory.md`.
- Architecture: `_bmad-output/planning-artifacts/architecture.md`.
- Context packs: `docs/context/meetings.md`, `docs/context/permissions-audit.md`, `docs/context/tasks.md`, `docs/context/testing.md`.
- Prior stories: `_bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md`, `8-2-executive-ai-summary-draft-trong-workspace.md`, `8-3-ai-approval-assistant-voi-action-proposal.md`.

### Latest Technical Information

- No external web research was needed for this internal product story.
- Use project stack from `_bmad-output/project-context.md`: Next.js 15.3.2, React 19, TypeScript 5.8, Tailwind 3.4, Zod 3.24, Supabase JS 2.49, Vitest 3.1, Playwright 1.52.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/ai-meeting-summary-service.test.ts tests/unit/ai-action-proposal-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-detail-panels.test.tsx tests/unit/ai-ux-service.test.tsx tests/unit/ai-proposal-page.test.tsx tests/unit/ai-future-placeholders.test.tsx` - passed, 7 files / 79 tests.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm run test` - passed, 100 files / 720 tests.

### Completion Notes

- Added meeting-scoped AI summary adapter that builds only from server-scoped meeting context, validates provider citations against the app-approved citation map, returns explicit draft/placeholder/insufficient/unavailable statuses, and never labels local fallback as provider-backed draft.
- Wired meeting detail generation through a Server Action that re-checks meeting scope, `meeting.update`, and AI permissions, persists only valid draft output via the existing draft path, and keeps official approval as a separate human action.
- Extended the meeting summary panel with AI draft/generation state, citations, proposal preview links, and read-only handling without client-side provider calls.
- Added `/ai` future placeholders for AI Risk Analysis, AI KPI Analysis, AI Executive Copilot, and AI Project Prediction with clear MVP/future labels and no production-ready CTA.
- Reused proposed-only AI action proposal flow for meeting action-item suggestions; generation stores preview/proposal metadata and does not mutate task/risk/decision/meeting domain records directly. Placeholder reload keeps reusable proposal previews visible after draft persistence/revalidate. Accept now re-checks meeting scope, proposal target type, source citations for AI-summary proposals, and current AI summary status before creating the decision/action item.
- Applied code-review patches for scoped `returnTo`, meeting proposal page scope checks, strict meeting proposal stale/citation validation, scoped project citation filtering, provider context enrichment, and Executive Copilot future-placeholder behavior.

### File List

- `_bmad-output/implementation-artifacts/8-4-ai-meeting-summary-va-future-ai-placeholders.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(dashboard)/ai/page.tsx`
- `src/app/(dashboard)/ai/proposals/[proposalId]/page.tsx`
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx`
- `src/modules/ai/components/ai-future-feature-placeholders.tsx`
- `src/modules/ai/components/ai-proposal-detail.tsx`
- `src/modules/ai/services/ai-action-proposal-service.ts`
- `src/modules/ai/services/ai-meeting-summary-service.ts`
- `src/modules/ai/types.ts`
- `src/modules/executive/components/executive-leadership-dashboard.tsx`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/components/meeting-detail-panels.tsx`
- `tests/unit/ai-action-proposal-service.test.ts`
- `tests/unit/ai-future-placeholders.test.tsx`
- `tests/unit/ai-meeting-summary-service.test.ts`
- `tests/unit/ai-proposal-page.test.tsx`
- `tests/unit/ai-ux-service.test.tsx`
- `tests/unit/meeting-actions.test.ts`
- `tests/unit/meeting-detail-panels.test.tsx`

## Change Log

- 2026-06-04: Story created from Epic 8 backlog with prior-story context and implementation guardrails.
- 2026-06-04: Implemented AI meeting summary draft generation, scoped citations, proposal preview, and future AI placeholders.
- 2026-06-04: Applied code-review patches, added regression coverage, and marked story done after typecheck, lint, and full unit validation.
