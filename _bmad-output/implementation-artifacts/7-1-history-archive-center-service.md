# Story 7.1: History & Archive Center Service

Status: done

Generated: 2026-06-03

Requirements Covered: FR-080, FR-081, NFR-001, NFR-004, NFR-006

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a lãnh đạo hoặc người kiểm soát được quyền,
I want xem lịch sử điều hành từ nhiều loại record,
so that tôi truy vết được decision, approval, assignment, meeting và audit.

## Acceptance Criteria

1. Given user context và scope hợp lệ, when History & Archive service tải timeline, then DTO gồm event từ decision, approval, assignment, meeting, audit log, document version và search history nếu nguồn dữ liệu hiện có cho phép.
2. Given user không có quyền xem audit hoặc record cụ thể, when service tạo timeline, then event ngoài quyền bị loại bỏ trước khi trả UI và serialized DTO không chứa title, summary, amount, raw audit payload, minutes, transcript, AI output hoặc document URL của record bị cấm.
3. Given dữ liệu đến từ nhiều module, when timeline được sắp xếp, then mỗi event có `id`, `type`, `module`, `actorId`, `occurredAt`, `scope`, `summary`, `status`, `source`, `severity?` và `href?` nhất quán, sort ổn định theo thời gian giảm dần.
4. Given user có quyền xem record nhưng không có `audit.view`, when service build timeline, then user vẫn thấy summary/version/history được phép từ record đó nhưng không thấy raw audit event, `oldValue`, `newValue` hoặc `auditAction`.
5. Given user có `audit.view`, when audit log được đưa vào timeline, then audit event chỉ xuất hiện nếu `entityType/entityId` thuộc tập record người dùng đã được phép đọc hoặc thuộc audit/admin domain được phép, và payload luôn được sanitize thành safe summary.
6. Given History Center là live operating timeline, when implementation hoàn thành, then không tạo model/persistence song song cho decision, approval, assignment, meeting, document version hoặc audit log; service aggregate từ các repository/service contract hiện có với dependency injection để test.
7. Given mock/file-backed hoặc Supabase-ready mode, when service chạy với dữ liệu hiện có, then JSON/Supabase contracts vẫn tương thích; nếu phát hiện thiếu mapper thật sự thì migration phải additive và kèm RLS/test parity.

## Tasks / Subtasks

- [x] Chốt contract DTO và filter cho History & Archive (AC: 1, 3, 6)
  - [x] Mở rộng `src/modules/reports/types.ts` hoặc tạo file sibling trong `src/modules/reports` cho các type như `HistoryArchiveEvent`, `HistoryArchiveScope`, `HistoryArchiveSource`, `HistoryArchiveFilters`, `HistoryArchiveData`.
  - [x] Thêm schema filter trong `src/modules/reports/validation.ts`: `projectId`, `module`, `type`, `actorId`, `status`, `dateFrom`, `dateTo`, `query`, `limit`. Story 7.1 chỉ cần service filter cơ bản; UI search/filter nâng cao thuộc Story 7.2.
  - [x] Dùng machine keys lowercase ổn định: `decision`, `approval`, `assignment`, `meeting`, `audit`, `document_version`, `search`.
  - [x] `href` chỉ được set khi source record đọc được; nếu không có quyền, event phải bị loại bỏ thay vì trả href rỗng kèm title.
  - [x] `scope` tối thiểu gồm `organizationId?`, `projectId?`, `projectIds?`, `axisId?`, `workstreamId?`, `moduleId?`, `recordId`.

- [x] Tạo service aggregate live timeline (AC: 1, 2, 3, 6)
  - [x] Thêm service mới, ví dụ `src/modules/reports/services/history-archive-service.ts`.
  - [x] Input nhận `PermissionUser`, `HistoryArchiveFilters`, dependencies injectable và optional `now`.
  - [x] Dùng `listScopedProposals`, `listScopedDecisions`, `listScopedMeetings`, `listScopedTasks`, `listScopedDocuments`, `listScopedExecutiveRiskRecords` nếu đưa risk vào history. Không gọi repository raw từ component/page.
  - [x] Với approvals: lấy proposal visible qua `listScopedProposals`; nếu cần decision/step history thì dùng `proposalRepository.getProposalDetail` theo từng proposal visible, hoặc reuse logic từ `getApprovalCenterDetailData` mà không đưa raw finance amount cho user thiếu quyền.
  - [x] Với decisions/assignments: dùng `listScopedDecisions`, `meetingRepository.listDecisionAssignments`, `meetingRepository.listDecisionVersions`, `listScopedTasks`. Reuse sanitize pattern từ `meeting-decision-tracking-service` và `decision-assignment-center-service`.
  - [x] Với meetings: dùng `listScopedMeetings`; đưa event tạo/cập nhật, minutes approval, AI summary approval, follow-up/decision tracking audit summaries nếu có trong `meeting.auditLog`, nhưng không serialize raw minutes, transcript hoặc AI text.
  - [x] Với document versions: dùng `listScopedDocuments` rồi `listDocumentVersions(document.id)`; event chỉ chứa version, uploadedBy, uploadedAt, notes safe và document metadata đã được phép. Không expose `fileUrl`/`externalUrl` trong History DTO trừ khi một story export/download riêng cho phép.
  - [x] Với search history nếu có: dùng `listExternalSearchLogs` từ Knowledge module chỉ khi user có quyền knowledge intake/review phù hợp hoặc log thuộc chính user; không tạo persistence mới trong Story 7.1.

- [x] Permission, scope và no-leak gate trước serialization (AC: 2, 4, 5)
  - [x] `canViewAudit` phải dùng `can(user, "audit.view")` hoặc scoped grant nếu service tự resolve scope assignments; user thiếu `audit.view` không được gọi `listAuditLogs` trừ khi cần test dependency đã được chặn.
  - [x] Audit logs chỉ được map sau khi đã có tập id visible: proposal ids, decision ids, meeting ids, task/assignment ids, document ids, report ids, risk ids nếu có.
  - [x] Không return audit event cho `entityType` không map được sang visible source. Nếu cần audit admin/system, chỉ cho user có `audit.view` cộng với quyền admin phù hợp (`user.view`, `settings.manage`) và không dùng cho assignment/external roles.
  - [x] Sanitize `oldValue`/`newValue`: chỉ giữ safe keys như `status`, `previousStatus`, `nextStatus`, `changedFields`, `versionNumber`, `reasonProvided`, `scope`, `count`, `summary`. Không giữ raw object.
  - [x] Finance-sensitive approval fields phải theo redaction hiện có trong Approval Center; user thiếu `finance.view` không được thấy amount trong summary hoặc serialized DTO.
  - [x] Direct service call với user ngoài scope phải trả `items: []` hoặc domain error không lộ record tùy contract đã chọn; không throw raw repository/Supabase errors ra UI layer.

- [x] Event normalization và sorting ổn định (AC: 3)
  - [x] Tạo mapper nhỏ cho từng source: approval decision/step/link, proposal audit, official decision version/audit, decision assignment, meeting audit/meeting state, document version, external search log.
  - [x] Deduplicate bằng key ổn định như `${type}:${sourceType}:${sourceId}:${occurredAt}:${action}` hoặc id gốc nếu có.
  - [x] Sort `occurredAt desc`, tie-break bằng `type` rank và `id` để test deterministic.
  - [x] Limit áp dụng sau permission filtering, không trước filtering.
  - [x] `summary` phải ngắn gọn và tiếng Việt; truncate text dài, không chứa raw body nhạy cảm.

- [x] Giữ module boundary và không tạo flow song song (AC: 6, 7)
  - [x] `src/modules/reports` sở hữu History/Archive aggregate DTO vì module này đã là reporting surface; không đổi stored snapshot report behavior hiện có.
  - [x] Không tạo bảng `history_events`, `archive_events`, `audit_timeline` hoặc copy data nếu chỉ aggregate từ nguồn hiện có.
  - [x] Không sửa `/reports` snapshot pages trừ khi cần import type; UI History Center thuộc Story 7.2.
  - [x] Không thêm permission mới như `history.view` hoặc `export.data` trong Story 7.1. Nếu dev phát hiện bắt buộc phải thêm permission, phải cập nhật `can.ts`, role catalog, seeds/fixtures, navigation, RLS và tests cùng lúc và ghi rõ trong Completion Notes.
  - [x] Không triển khai export file/payload trong Story 7.1. Export theo permission và audit thuộc Story 7.3.

- [x] Optional integration với audit workspace phải an toàn (AC: 2, 5)
  - [x] `src/modules/workspaces/services/workspace-service.ts` hiện load raw `listAuditLogs()` khi `audit.view`. Nếu Story 7.1 cần hiển thị/count History trong audit workspace, dùng history service sanitized DTO hoặc chỉ count sau filtering.
  - [x] Không thay `WorkspaceRoutePage` thành History UI đầy đủ trong story này; chỉ tạo contract để Story 7.2 gắn UI.

- [x] Tests bắt buộc (AC: 1-7)
  - [x] Thêm `tests/unit/history-archive-service.test.ts` cho aggregate từ proposal decision/history, official decision version, decision assignment, meeting audit, document version và optional search log.
  - [x] Test permission filtering: out-of-scope proposal/decision/meeting/document/task không xuất hiện và serialized DTO không chứa hidden title/body.
  - [x] Test user thiếu `audit.view`: service không gọi audit loader, không có event `type: "audit"`, không có `oldValue/newValue/auditAction`.
  - [x] Test user có `audit.view`: audit logs chỉ map cho visible entity ids, audit entity khác bị loại.
  - [x] Test finance redaction: approval amount/raw finance payload không xuất hiện khi user thiếu `finance.view`.
  - [x] Test document version redaction: `fileUrl`/`externalUrl` không xuất hiện trong History DTO.
  - [x] Test ordering/dedup/limit sau permission filtering.
  - [x] Run targeted: `npm run test -- tests/unit/history-archive-service.test.ts tests/unit/report-service.test.ts tests/unit/access-scope.test.ts`.
  - [x] Run static/full baseline before marking complete: `npm run typecheck`, `npm run lint`, `npm run test`.

### Review Findings

- [x] [Review][Patch] High - Permission snapshot ignores scoped grant semantics before loading history sources [src/modules/reports/services/history-archive-service.ts:94]
- [x] [Review][Patch] High - Decision and assignment history can leak records through broad decision gates and raw assignment loading [src/modules/reports/services/history-archive-service.ts:107]
- [x] [Review][Patch] High - Search history loads all logs and lets candidate creators review other users' queries [src/modules/reports/services/history-archive-service.ts:96]
- [x] [Review][Patch] High - Audit summary allowlist can expose free-text payload content [src/modules/reports/services/history-archive-service.ts:650]
- [x] [Review][Patch] Medium - Project filtering drops otherwise visible audit events because audit scopes omit project ids [src/modules/reports/services/history-archive-service.ts:679]
- [x] [Review][Patch] Medium - Date and blank-string filters are normalized as raw strings and compared lexicographically [src/modules/reports/validation.ts:15]
- [x] [Review][Patch] Medium - Approval step and link history requested by the story is not mapped [src/modules/reports/services/history-archive-service.ts:833]
- [x] [Review][Patch] Medium - One proposal detail loader failure rejects the whole History Archive response [src/modules/reports/services/history-archive-service.ts:817]
- [x] [Review][Patch] Low - Total and source counts are computed after applying the limit [src/modules/reports/services/history-archive-service.ts:980]
- [x] [Review][Patch] Low - History metadata type allows undefined values that are not JSON/Supabase-safe [src/modules/reports/types.ts:73]

## Dev Notes

### Bối cảnh nghiệp vụ

- Epic 7 yêu cầu người có quyền tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission. Story 7.1 chỉ tạo service timeline, chưa làm UI search/filter/export. [Source: `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md`]
- PRD FR-080/FR-081 yêu cầu History & Archive Center hiển thị lịch sử decision, approval, giao việc, họp, audit log, phiên bản hồ sơ và lịch sử tìm kiếm nếu có. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- PRD NFR-001/NFR-004 yêu cầu mọi dữ liệu executive được filter ở server/service layer trước khi trả UI và người không có quyền không thấy dữ liệu cụ thể. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- NFR-006 yêu cầu approval, decision, risk/blocker, meeting approval, export, override trạng thái và cập nhật permission phải ghi audit log. Story 7.1 đọc/sanitize audit, không thay thế write-audit của từng module. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]

### Current Code State (Read Before Editing)

- `src/modules/reports` hiện là Reporting Lite cho stored snapshots: `ReportRun`, `ReportSnapshot`, `generateReport`, `JsonReportRepository`, `SupabaseReportRepository`. Không làm vỡ behavior "detail pages read stored snapshot, not recompute live data". [Source: `src/modules/reports/README.md`; `src/modules/reports/services/report-service.ts`]
- `src/modules/reports/actions.ts` có `generateReportAction`, check `report.create`, `getScopedProject`, tạo audit `report.create`. Đây là export/report snapshot path, không phải History Center. [Source: `src/modules/reports/actions.ts`]
- `src/lib/permissions/scoped-resources.ts` đã có `listScopedProjects`, `listScopedTasks`, `listScopedDocuments`, `listScopedProposals`, `listScopedMeetings`, `listScopedDecisions`, `listScopedExecutiveRiskRecords`. History service phải dùng các helper này hoặc cùng access-scope logic trước khi build DTO. [Source: `src/lib/permissions/scoped-resources.ts`]
- `src/modules/users/services/user-service.ts` có `createAuditLog` và `listAuditLogs`; `AuditLog` chỉ có `actorId`, `entityType`, `entityId`, `action`, `oldValue`, `newValue`, `createdAt`. Raw `listAuditLogs` không tự lọc scope theo entity nguồn. [Source: `src/modules/users/services/user-service.ts`; `src/modules/users/types.ts`]
- `src/modules/workspaces/services/workspace-service.ts` hiện load `listAuditLogs()` khi user có audit permission, sau đó chỉ lọc coarse-grained theo assignment/internal role. Không dùng payload raw này làm History Center DTO. [Source: `src/modules/workspaces/services/workspace-service.ts`]
- `src/modules/proposals/services/approval-center-service.ts` đã có pattern `canViewAuditForRecord`, `resolveProposalAuditLogs`, `buildHistory` và chỉ include audit events khi `audit.view` pass. Reuse hoặc copy logic có chủ đích, không regress final approval detail no-leak. [Source: `src/modules/proposals/services/approval-center-service.ts`]
- `src/modules/meetings/services/meeting-decision-tracking-service.ts` đã sanitize `DecisionVersion` và audit summary, không serialize raw `decisionText` vào meeting tracking DTO. History service phải giữ cùng chuẩn. [Source: `src/modules/meetings/services/meeting-decision-tracking-service.ts`]
- `src/modules/executive/services/decision-assignment-center-service.ts` đã aggregate decisions, assignments, versions, tasks và audit summaries với guarded links. Nếu cần code reuse, ưu tiên extract helper nhỏ thay vì tạo implementation lệch. [Source: `src/modules/executive/services/decision-assignment-center-service.ts`]
- `src/modules/documents/services/document-service.ts` có `listDocumentVersions(documentId)` và `src/modules/documents/types.ts` có `DocumentVersion`. Document version event phải đọc qua scoped document trước. [Source: `src/modules/documents/services/document-service.ts`; `src/modules/documents/types.ts`]
- `src/modules/knowledge/services/knowledge-intake-service.ts` có `listExternalSearchLogs`, nhưng log này là external discovery/intake, không authoritative RAG source. Chỉ include "search history" nếu permission phù hợp và summary không nhạy cảm. [Source: `src/modules/knowledge/services/knowledge-intake-service.ts`; `src/modules/knowledge/types.ts`]

### Suggested Data Contract

```ts
export type HistoryArchiveEventType =
  | "approval"
  | "assignment"
  | "audit"
  | "decision"
  | "document_version"
  | "meeting"
  | "search";

export type HistoryArchiveScope = {
  organizationId?: string;
  projectId?: string;
  projectIds?: string[];
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  recordId: string;
};

export type HistoryArchiveSource = {
  entityType: string;
  entityId: string;
  title?: string;
  href?: string;
  relationType?: "source" | "context" | "version" | "audit";
};

export type HistoryArchiveEvent = {
  id: string;
  type: HistoryArchiveEventType;
  module: string;
  action: string;
  actorId?: string;
  occurredAt: string;
  scope: HistoryArchiveScope;
  source: HistoryArchiveSource;
  summary: string;
  status?: string;
  previousStatus?: string;
  nextStatus?: string;
  changedFields?: string[];
  severity?: "info" | "warning" | "danger";
};

export type HistoryArchiveData = {
  generatedAt: string;
  filters: HistoryArchiveFilters;
  permissions: {
    canViewAudit: boolean;
    canViewHistory: boolean;
  };
  items: HistoryArchiveEvent[];
};
```

Implementation notes:

- Không include `oldValue`, `newValue`, raw `decisionText`, proposal amount, raw minutes, transcript, AI text, document URL hoặc provider metadata đầy đủ.
- Nếu source title cần redaction, dùng label trung tính như `Record bị giới hạn quyền` và tốt hơn là loại event trước khi trả DTO.
- `module` nên là stable key như `proposals`, `meetings`, `decisions`, `documents`, `knowledge`, `reports`, `executive`.

### Architecture Compliance

- Flow chuẩn: route/server loader -> auth/permission/scope -> service DTO -> UI. Story 7.1 chỉ cần service/tests; UI Story 7.2 sẽ consume DTO. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Dữ liệu nhạy cảm phải filter ở service/server layer, không render rồi ẩn. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Domain DTO camelCase; DB/repository snake_case chỉ nằm trong adapter. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Không thêm library, global store, event bus hoặc cache layer mới. Stack hiện tại: Next.js 15.3.2, React 19, TypeScript 5.8.3, Supabase JS 2.49.4, Vitest 3.1.3. [Source: `_bmad-output/project-context.md`; `package.json`]

### Previous Story Intelligence

- Story 3.4: approval detail đã có permission-aware history/audit timeline. Bài học chính: audit chỉ load sau khi detail permission/scope và `audit.view` pass; final approval detail read-only không được mở lại action. [Source: `_bmad-output/implementation-artifacts/3-4-approval-history-version-va-audit.md`]
- Story 4.3: decision update/version history phải sanitize previous/new values, không dump raw instruction body hoặc payload nhạy cảm vào timeline. [Source: `_bmad-output/implementation-artifacts/4-3-version-history-khi-sua-decision-quan-trong.md`]
- Story 6.4: meeting minutes/AI summary audit không chứa raw minutes, transcript, prompt hoặc AI output; attachment documentId phải scoped trước khi render. [Source: `_bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md`]
- Story 6.6: meeting decision tracking đã loại raw decision body khỏi DTO, thêm hidden-task neutral state, due-soon/overdue local business date và deep link vào Decision Center. Reuse các nguyên tắc này cho timeline toàn cục. [Source: `_bmad-output/implementation-artifacts/6-6-decision-tracking-sau-hop.md`]

### File Targets

Expected NEW:

- `src/modules/reports/services/history-archive-service.ts`
- `tests/unit/history-archive-service.test.ts`

Expected UPDATE:

- `src/modules/reports/types.ts`
- `src/modules/reports/validation.ts`
- `src/modules/reports/README.md`
- `src/modules/reports/services/report-service.ts` only if shared report/history helpers are required; do not mix stored snapshot generation with live history aggregation.
- `src/modules/workspaces/services/workspace-service.ts` only if exposing sanitized history count/data to `/audit-workspace` is required by implementation.

Avoid unless truly needed:

- No route/page/component for full History UI in Story 7.1.
- No export actions, CSV/PDF/DOCX, download links or export audit workflow in Story 7.1.
- No new tables for aggregate history.
- No direct Supabase calls from service if existing repository/service helpers exist.
- No broad rewrites of `approval-center-service`, `decision-assignment-center-service`, `meeting-decision-tracking-service` unless extracting a small sanitizer/helper removes meaningful duplication.

### UX Guardrails For Future Consumer

- DTO should support Activity Timeline/Audit Trail: actor, action, timestamp, previous/new state, comment/summary, attachment/source where safe. [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- Empty state must distinguish no data in scope vs filtered out, but this story only needs service metadata to let UI do that in Story 7.2. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- Timeline/audit must be readable in DOM order and not depend on color alone. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]

### Latest Tech Notes

- No web research required for this story. It uses internal service/repository contracts and current package versions from `package.json`.
- Do not upgrade Next/React/TypeScript/Supabase or add timeline/search/export libraries.

### Testing Guidance

Recommended targeted validation during implementation:

```bash
npm run test -- tests/unit/history-archive-service.test.ts tests/unit/report-service.test.ts tests/unit/access-scope.test.ts
```

Before marking done:

```bash
npm run typecheck
npm run lint
npm run test
```

Run `npm run test:e2e` only if dev chooses to touch route-visible workspace/UI behavior in addition to the service contract.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/history-archive-service.test.ts` - RED confirmed missing service before implementation; GREEN after implementation, 3 tests passed.
- `npm run test -- tests/unit/history-archive-service.test.ts` - passed after review patches, 7 tests.
- `npm run typecheck` - passed.
- `npm run test -- tests/unit/history-archive-service.test.ts tests/unit/report-service.test.ts tests/unit/access-scope.test.ts` - passed after review patches, 29 tests.
- `npm run lint` - passed.
- `npm run test` - passed after review patches, 87 test files / 629 tests.

### Completion Notes List

- Added History & Archive DTO/filter contract in Reports with stable event type keys, scope/source metadata and post-permission filtering support.
- Implemented live aggregate History Archive service using existing scoped resources/repositories for proposals, decisions, assignments, meetings, document versions, audit logs and external search logs; no new persistence or parallel history table added.
- Added no-leak gates for missing `audit.view`, visible-entity audit filtering, safe audit summary mapping, finance/document URL/decision body/meeting minutes/AI text redaction, deterministic sorting, dedupe and post-filter limit.
- Applied code-review fixes for scoped permission grants, assignment/task no-leak filtering, own-user search log loading, audit project scope, date normalization, approval step/link events, proposal detail partial failures, pre-limit totals and JSON-safe metadata.
- UI/routes/export were intentionally not added; Story 7.2/7.3 remain the consumer/export stories.

### File List

- `src/modules/reports/types.ts`
- `src/modules/reports/validation.ts`
- `src/modules/reports/services/history-archive-service.ts`
- `src/modules/knowledge/services/knowledge-intake-service.ts`
- `src/modules/knowledge/services/external-search-log-repository.ts`
- `src/modules/reports/README.md`
- `tests/unit/history-archive-service.test.ts`
- `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-06-03 | 1.2 | Applied code review fixes for scoped/no-leak history permissions, search log filtering, filter normalization and regression tests. | Codex |
| 2026-06-03 | 1.1 | Implemented History & Archive Center service contract, sanitized aggregate timeline and tests. | Codex |
| 2026-06-03 | 1.0 | Created Story 7.1 implementation guide for History & Archive Center service. | Codex |

## Checklist Validation Notes

- Reinvention prevention: story explicitly reuses scoped resource helpers, Proposal/Approval history, official Decision/Assignment/Version contracts, Meeting Engine audit, DocumentVersion and ExternalSearchLog.
- Wrong-file prevention: story keeps aggregate service in `src/modules/reports` and does not move UI/export into this story.
- Permission prevention: story requires record-readable filtering before serialization and separately gates raw audit with `audit.view`.
- Regression prevention: stored report snapshots remain unchanged; existing per-module history/audit flows remain source of truth.
- Data-safety prevention: story bans raw finance, minutes, transcript, AI output, decision body, document URL and audit JSON payload from History DTO.
- No unresolved clarification required before `dev-story`.
