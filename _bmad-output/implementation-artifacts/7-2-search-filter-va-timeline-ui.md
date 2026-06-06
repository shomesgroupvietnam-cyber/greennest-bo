# Story 7.2: Search, Filter Và Timeline UI

Status: done

Generated: 2026-06-03

Requirements Covered: FR-082, UX-DR15, UX-DR25, UX-DR27, UX-DR29, UX-DR30

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a người dùng được quyền,
I want search/filter history theo project, module, actor, type, status và thời gian,
so that tôi tìm nhanh thay đổi điều hành cần kiểm tra.

## Acceptance Criteria

1. **Search dùng dữ liệu đã lọc quyền**
   - Given History Center có event timeline từ Story 7.1
   - When người dùng search theo tên/mã project, approval, hồ sơ/document, owner/actor hoặc mã record
   - Then danh sách lọc đúng từ service/server layer, active filters hiển thị rõ và không render event ngoài quyền rồi mới ẩn ở client.

2. **Filter theo URL và không mất context**
   - Given người dùng lọc theo `type`, `status`, `severity`, `module`, `scope/project`, `actor`, `dateFrom/dateTo` và `limit`
   - When filter thay đổi
   - Then timeline cập nhật bằng URL query state, preserve `view=executive-history` và `scopeId` nếu đang ở Command Center, đồng thời giữ visible context như search text, selected filters, total và source counts.

3. **Timeline hiển thị event an toàn và có thứ tự**
   - Given service trả `HistoryArchiveData.items`
   - When timeline render
   - Then mỗi event hiển thị type/module, summary, actor, timestamp, status/severity badge có chữ, safe source label và safe link nếu có `href`; raw audit payload, decision body, proposal amount, meeting minutes/AI text, document URL và provider metadata không xuất hiện trong DOM.

4. **Mobile compact list và focus order hợp lý**
   - Given mobile viewport
   - When History Center render
   - Then filter controls wrap/stack gọn, event hiển thị dạng compact list, DOM order theo thứ tự thời gian service trả, keyboard focus đi từ filter -> active filter chips -> timeline event/link, không có horizontal page overflow bất thường.

5. **Basic empty/no-access states**
   - Given user không có dữ liệu trong scope hoặc filter không có kết quả
   - When History Center render
   - Then UI phân biệt "không có dữ liệu trong scope" và "không có kết quả theo filter" ở mức cơ bản; no-access không lộ event count/title/source bị cấm. Loading/error/unauthorized hardening sâu thuộc Story 7.4.

6. **Không làm export hoặc persistence song song**
   - Given Story 7.3 xử lý export theo permission và audit
   - When Story 7.2 hoàn thành
   - Then không thêm download/export action, không tạo bảng history/archive mới, không copy dữ liệu timeline sang store riêng và không thay đổi behavior stored report snapshot hiện có.

## Tasks / Subtasks

- [x] Chốt route/view contract cho History Center (AC: 1, 2, 5)
  - [x] Tạo canonical route `src/app/executive/history/page.tsx`.
  - [x] Vì các route `src/app/executive/*` hiện redirect sang Command Center, implement `/executive/history` theo cùng pattern: update `src/app/executive/_lib/render-executive-page.tsx` map `"/executive/history"` -> `"executive-history"` và redirect preserve query. Không render standalone page ngoài shell nếu chưa có quyết định kiến trúc rõ.
  - [x] Nếu dùng Command Center view, update `src/lib/permissions/navigation-policy.ts` để `executive-history` là executive command-center view hợp lệ và vẫn guard qua `requireWorkspaceRoute("/executive")`.
  - [x] Update `src/modules/command-center/services/command-center-service.ts` axes/menu để thêm "History & Archive" dưới nhóm lãnh đạo khi user có quyền xem history theo service permission. Không chỉ thêm link nếu view chưa render được.
  - [x] Update `src/modules/command-center/components/command-center-dashboard.tsx` `knownExecutiveViewKeys` và `CommandCenterExecutivePanel` để render History Center cho `activeView === "executive-history"`.
  - [x] Nếu dev chọn route dashboard khác như `/reports/history`, phải vẫn giữ `/executive/history` redirect an toàn và ghi rõ trong Completion Notes; không để hai History UI lệch nhau.

- [x] Parse và truyền filter từ route/server vào service (AC: 1, 2)
  - [x] Trong `src/app/command-center/page.tsx`, khi `requestedView === "executive-history"`, đọc các search params: `query`, `projectId`, `module`, `type`, `actorId`, `status`, `severity`, `dateFrom`, `dateTo`, `limit`, `scopeId`.
  - [x] Dùng `historyArchiveFilterSchema` hoặc helper mới từ `src/modules/reports/validation.ts` để normalize filter trước khi gọi service. Không tự parse date bằng string ad hoc trong component.
  - [x] Preserve `scopeId` và `view` khi submit filter form hoặc clear chip. Các link clear filter phải giữ những params còn lại thay vì reset toàn bộ Command Center context.
  - [x] Invalid filter input phải được normalize/ignore an toàn hoặc render basic validation message; không throw raw Zod/server error ra UI.

- [x] Mở rộng filter contract cho `severity` và search theo project/owner nếu cần (AC: 1, 2)
  - [x] Story 7.1 đã có `HistoryArchiveEvent.severity?` nhưng chưa có `HistoryArchiveFilters.severity` hay schema filter. Nếu UI có severity select, update `src/modules/reports/types.ts`, `src/modules/reports/validation.ts`, `src/modules/reports/services/history-archive-service.ts` và tests để filter `severity` ở service trước `limit`.
  - [x] Search không được chỉ filter client-side trên `data.items.slice(limit)` vì sẽ sai total/source counts và bỏ sót event. Nếu cần search theo project name/code, load scoped projects server-side và đưa project labels vào service hay wrapper DTO một cách permission-safe.
  - [x] Search theo owner/actor có thể match `actorId` và actor labels chỉ khi labels được lấy an toàn. Không gọi `listUsers()` rộng để lộ danh sách người dùng nếu user không có quyền phù hợp; nếu cần label, derive từ actor ids đã xuất hiện trong visible events hoặc gate bằng permission hiện có như `user.view`.
  - [x] Search by approval/document/record code phải dựa vào `event.source.sourceId`, `event.source.sourceLabel`, `event.id` và safe summary từ service; không fetch raw proposal/document detail từ component để enrich search.

- [x] Tạo Reports UI components cho History Center (AC: 1, 2, 3, 4, 5)
  - [x] Thêm component chính `src/modules/reports/components/history-archive-center.tsx`.
  - [x] Có thể split sibling components: `history-filter-bar.tsx`, `history-active-filters.tsx`, `history-timeline.tsx`, `history-event-item.tsx` nếu giảm complexity thật.
  - [x] Component nhận DTO đã lọc quyền, ví dụ `HistoryArchiveData` và optional filter options an toàn. React component không import repository, Supabase client hoặc gọi service trực tiếp.
  - [x] Filter form dùng GET/URL query state, input search, select cho project/module/type/status/severity/actor, date inputs cho `dateFrom/dateTo`, limit select nếu cần. Dùng icon lucide phù hợp như `Search`, `Filter`, `X`, `Calendar`, `Clock`, `History`, `ExternalLink`.
  - [x] Active filter chips hiển thị text label và có clear link/button accessible name rõ. Clear all không xóa `view` hoặc `scopeId`.
  - [x] Timeline dùng semantic `<ol aria-label="Lịch sử điều hành">` và `<li>` theo order service trả. Link nguồn chỉ render khi `event.href` có internal href an toàn.
  - [x] Empty state dùng `src/components/shared/empty-state.tsx`; no-access/basic denied state dùng `src/components/shared/unauthorized-state.tsx` hoặc state tương đương, không chứa source title/count bị cấm.
  - [x] UI phải dense/operational, không hero/marketing, không nested cards, không thêm thư viện UI mới.

- [x] Wire Command Center data nếu dùng view `executive-history` (AC: 1, 2, 5)
  - [x] Update `src/modules/command-center/types.ts` để thêm DTO như `historyArchiveCenter: HistoryArchiveCenterData | null` hoặc `historyArchive: HistoryArchiveData | null`.
  - [x] Update `getCommandCenterData` để load history only khi view/request context cần hoặc khi user được phép. Không fetch broad audit/history data cho mọi command-center render nếu không cần.
  - [x] Nếu tạo wrapper service như `getHistoryArchiveCenterData`, đặt trong `src/modules/reports/services` và để wrapper gọi `getHistoryArchiveData`, `listScopedProjects` hoặc safe filter-option loaders.
  - [x] `historyArchiveCenter.permissions.canView === false` phải render no-access/empty state, không throw và không fetch raw source loaders không cần thiết.
  - [x] Do not add a new permission key like `history.view` unless absolutely required; if added, update `can.ts`, role fixtures, navigation policy, seeds/RLS and tests together.

- [x] Timeline presentation and redaction safeguards (AC: 3, 4)
  - [x] Format date with `Intl.DateTimeFormat("vi-VN")`; invalid date should show a safe fallback like `-`, not throw.
  - [x] Render module/type/status/severity badges with text labels. Color may support meaning but cannot be the only status signal.
  - [x] Do not display `source.metadata` wholesale. Only render allowlisted safe metadata keys already sanitized by service, such as version, changedFields, approvalLevel or resultCount.
  - [x] Keep `href` usage defensive: event link must be internal path starting with `/`; if service returns no href, show read-only source label.
  - [x] Mobile layout must fit 360/390px widths; avoid fixed min-width tables for core timeline.

- [x] Tests for service filter/search additions (AC: 1, 2, 3, 6)
  - [x] Extend `tests/unit/history-archive-service.test.ts` for `severity` filter if the field is added.
  - [x] Add/extend tests proving project-name/code search is service-side or wrapper-side and does not leak hidden project/event labels.
  - [x] Add test that search/filter counts remain pre-limit (`total` and `sourceCounts` reflect all filtered events before `limit`) if service logic changes.
  - [x] Keep existing no-leak assertions from Story 7.1 green: no proposal amount, raw decision body, meeting minutes/AI text, document URLs, raw audit `oldValue/newValue`, other user's search query.

- [x] Component and route/view tests (AC: 1, 2, 3, 4, 5)
  - [x] Add `tests/unit/history-archive-center.test.tsx` for rendering search form, active filters, clear links, timeline items, empty state and no-access/basic denied state.
  - [x] Test timeline DOM order with Testing Library `getAllByRole("listitem")` and assert newest/expected event appears first without relying on visual CSS order.
  - [x] Test sanitized DOM: sentinel strings for raw audit payload, amount, document URL, minutes and provider metadata must not be present.
  - [x] If Command Center integration changes, update `tests/unit/command-center-page.test.tsx`, `tests/unit/command-center-service.test.ts` and `tests/unit/command-center-dashboard.test.tsx` for `executive-history`.
  - [x] If route/nav is touched, add or update focused e2e smoke for `/executive/history` redirect and `/command-center?view=executive-history` mobile fit. Full History/export state QA remains Story 7.4.

- [x] Verification (AC: 1-6)
  - [x] Run targeted tests for history service and history component.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run test`.
  - [x] Run targeted e2e only if route/navigation/responsive behavior is changed in this implementation.

### Review Findings

- [x] [Review][Patch] History sidebar switch renders false no-access instead of loading archive DTO [src/modules/command-center/components/command-center-dashboard.tsx:542]
- [x] [Review][Patch] Selected command-center scopeId is preserved in URL but not applied to history archive data [src/app/command-center/page.tsx:106]
- [x] [Review][Patch] Invalid history URL filters can throw server-side Zod errors [src/modules/reports/services/history-archive-service.ts:1107]
- [x] [Review][Patch] Task-linked assignment events can leak assignment title/status through project fallback [src/modules/reports/services/history-archive-service.ts:612]
- [x] [Review][Patch] Search query does not match visible actor identifiers [src/modules/reports/services/history-archive-service.ts:947]
- [x] [Review][Patch] Timeline event rows do not display actor information [src/modules/reports/components/history-archive-center.tsx:178]
- [x] [Review][Patch] Limit filter is parsed but not rendered, preserved, or clearable in UI [src/modules/reports/components/history-archive-center.tsx:70]
- [x] [Review][Patch] Source counts are computed but not visible in the History Center header [src/modules/reports/components/history-archive-center.tsx:254]
- [x] [Review][Patch] Document version summaries expose raw version notes in timeline text [src/modules/reports/services/history-archive-service.ts:748]

## Dev Notes

### Bối cảnh nghiệp vụ

- Epic 7 yêu cầu người có quyền tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission; dữ liệu nhạy cảm/export quan trọng phải được kiểm soát và audit. [Source: `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md`]
- Story 7.2 cover FR-082: History & Archive Center cần hỗ trợ tìm kiếm, filter, export và timeline theo quyền. Phạm vi Story 7.2 chỉ search/filter/timeline UI; export nằm ở Story 7.3. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`; `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md`]
- UX yêu cầu search by project/approval/document/owner/record code, filter by status/severity/project/owner/deadline/module/scope/time, active filters visible/clearable, và mobile list compact. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`; `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]

### Current Code State (Read Before Editing)

- Story 7.1 đã tạo History Archive service trong `src/modules/reports/services/history-archive-service.ts`, types trong `src/modules/reports/types.ts`, schema trong `src/modules/reports/validation.ts` và tests trong `tests/unit/history-archive-service.test.ts`. UI/export chưa được thêm. [Source: `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`]
- `HistoryArchiveData` hiện có `generatedAt`, `filters`, `permissions`, `sourceCounts`, `total`, `items`; event có `id`, `type`, `module`, `actorId`, `occurredAt`, `scope`, `summary`, `status`, `source`, `severity?`, `href?`. [Source: `src/modules/reports/types.ts`]
- `historyArchiveFilterSchema` hiện support `projectId`, `module`, `type`, `actorId`, `status`, `dateFrom`, `dateTo`, `query`, `limit`; chưa support `severity`. [Source: `src/modules/reports/validation.ts`]
- `getHistoryArchiveData` already filters by project/module/type/actor/status/date/query and applies `limit` after filtering. Query currently matches event id, summary, status, source id/label/type; project name/owner label support may need safe extension. [Source: `src/modules/reports/services/history-archive-service.ts`]
- Service already enforces permission snapshot, scoped source loading, audit no-leak, own-user search log filtering, safe metadata and pre-limit total/sourceCounts after review patches. Do not weaken those gates while adding UI/search. [Source: `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`; `tests/unit/history-archive-service.test.ts`]
- `src/app/executive/_lib/render-executive-page.tsx` maps current `/executive/*` routes to `/command-center?view=...`; `/executive/history` does not exist yet. [Source: `src/app/executive/_lib/render-executive-page.tsx`]
- `src/app/command-center/page.tsx` parses view-specific filters only for `executive-decision-log` today. If History becomes a Command Center view, add history-specific parsing there instead of reading query in a client component. [Source: `src/app/command-center/page.tsx`]
- `src/lib/permissions/navigation-policy.ts` has fixed `executiveCommandCenterViews`; `executive-history` must be added if used as a Command Center view. [Source: `src/lib/permissions/navigation-policy.ts`]
- `src/modules/command-center/components/command-center-dashboard.tsx` has `knownExecutiveViewKeys` and view branches for existing executive panels; History view must be added there if integrated into Command Center. [Source: `src/modules/command-center/components/command-center-dashboard.tsx`]
- Shared UI components available now are minimal: `src/components/shared/page-shell.tsx`, `empty-state.tsx`, `unauthorized-state.tsx`; shadcn-like UI currently has `src/components/ui/button.tsx` only. Build simple form controls with Tailwind and existing patterns. [Source: `src/components/shared`; `src/components/ui`]

### Architecture Guardrails

- Required flow: route/server loader -> auth/permission/scope -> Reports service DTO -> UI. Components must not import repositories, call Supabase, or refetch raw source records client-side. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`; `_bmad-output/project-context.md`]
- Permission and scope filtering must happen before UI render. Never render unauthorized data and hide later. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Use URL query state/local component state only. Do not add global store, new router abstraction, event bus, cache layer or dependency. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`; `package.json`]
- `src/modules/reports` owns History/Archive aggregate surface; keep stored report snapshots unchanged. [Source: `src/modules/reports/README.md`; `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`]
- No new table like `history_events`, `archive_events`, `audit_timeline`; History Center remains live aggregate from existing modules. [Source: `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`]

### UX Guardrails

- First screen is the usable History Center, not a landing page. Keep the page dense, scannable and operational.
- Desktop should prioritize filter toolbar, active filter strip, summary counts and timeline/list. Mobile should stack filters and compact events.
- Active filters must be visible and clearable. Use labels understandable in Vietnamese, and preserve Command Center context in clear links.
- Timeline/audit trail must be readable in DOM order and not depend on color alone. [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`; `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- Do not use oversized hero text, decorative gradients/orbs, nested cards or marketing copy. Cards only for meaningful event/list groupings and keep radius <= 8px unless existing class pattern already differs.
- Text must wrap cleanly at 360/390px mobile widths; long ids/source labels should use `break-words` or truncation with accessible full label where appropriate.

### Previous Story Intelligence

- Story 7.1 established safe service DTO and review fixes. Reuse `getHistoryArchiveData`; do not rebuild aggregation inside the UI. [Source: `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`]
- Story 4.4 integrated a new executive center by preserving `/executive/*` redirect aliases and rendering actual UI in Command Center. Use the same route/view discipline for `/executive/history`. [Source: `_bmad-output/implementation-artifacts/4-4-decision-assignment-center-ui.md`]
- Story 4.3 and `DecisionHistoryTimeline` sanitize decision version values, hiding raw `decisionText`/linked records. Follow the same redaction mindset for global history timeline. [Source: `_bmad-output/implementation-artifacts/4-3-version-history-khi-sua-decision-quan-trong.md`; `src/modules/executive/components/decision-history-timeline.tsx`]
- Story 6.4/6.6 meeting history rules prohibit raw meeting minutes, transcript, prompt or AI output in timeline DTO/DOM. [Source: `_bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md`; `_bmad-output/implementation-artifacts/6-6-decision-tracking-sau-hop.md`]

### Suggested UI DTO

If the UI needs options beyond `HistoryArchiveData`, prefer a small wrapper DTO in Reports:

```ts
export type HistoryArchiveCenterData = {
  archive: HistoryArchiveData;
  filterOptions: {
    projects: Array<{ id: string; label: string }>;
    modules: Array<{ value: HistoryArchiveModule; label: string }>;
    types: Array<{ value: HistoryArchiveEventType; label: string }>;
    statuses: string[];
    severities: Array<{ value: "info" | "warning" | "critical"; label: string }>;
    actors: Array<{ id: string; label: string }>;
  };
};
```

Notes:

- `projects` must come from `listScopedProjects(currentUser)` or already-visible service context only.
- `actors` should be derived from visible event actorIds unless user has a safe permission to resolve display names.
- Keep this DTO serializable and permission-safe. Do not include raw source entities.

### File Targets

Expected NEW:

- `src/app/executive/history/page.tsx`
- `src/modules/reports/components/history-archive-center.tsx`
- `tests/unit/history-archive-center.test.tsx`

Possible NEW:

- `src/modules/reports/components/history-filter-bar.tsx`
- `src/modules/reports/components/history-active-filters.tsx`
- `src/modules/reports/components/history-timeline.tsx`
- `src/modules/reports/services/history-archive-center-service.ts` if wrapper DTO/filter options are needed

Expected UPDATE:

- `src/app/executive/_lib/render-executive-page.tsx`
- `src/app/command-center/page.tsx` if using `executive-history`
- `src/lib/permissions/navigation-policy.ts` if using `executive-history`
- `src/modules/command-center/services/command-center-service.ts` if using Command Center
- `src/modules/command-center/types.ts` if adding History DTO to Command Center data
- `src/modules/command-center/components/command-center-dashboard.tsx` if rendering in Command Center
- `src/modules/reports/types.ts` only if adding `severity` filter or wrapper types
- `src/modules/reports/validation.ts` only if adding `severity`/filter parsing helpers
- `src/modules/reports/services/history-archive-service.ts` only for service-side `severity`, project label, or owner/actor search
- `tests/unit/history-archive-service.test.ts`
- Command Center tests if the view is integrated there

Avoid:

- No export/download button or file generation in Story 7.2.
- No new history persistence or report snapshot changes.
- No client-side data fetching from repositories/Supabase.
- No broad rewrite of `CommandCenterDashboard`; add the view branch/component narrowly.
- No new dependency, table library, command palette library or date library.

### Testing Guidance

Targeted during implementation:

```bash
npm run test -- tests/unit/history-archive-service.test.ts tests/unit/history-archive-center.test.tsx
```

If Command Center integration is implemented:

```bash
npm run test -- tests/unit/command-center-page.test.tsx tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx
```

Before marking done:

```bash
npm run typecheck
npm run lint
npm run test
```

Run targeted e2e only when route/navigation/responsive behavior changes. Story 7.4 will own full History/export state and acceptance QA coverage.

### References

- `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md` - Story 7.2 requirements, AC, files/modules and dependencies.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-082 and permission/service filtering NFRs.
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` - service DTO boundary, URL query state, UI states and no global store.
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` - route/module/shared component boundaries.
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md` - Activity Timeline/Audit Trail pattern.
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md` - search/filter/active filter and state patterns.
- `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md` - mobile compact list, DOM order and responsive breakpoints.
- `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md` - service contract, review fixes and no-leak constraints.
- `src/modules/reports/types.ts` - current `HistoryArchiveData` and event contracts.
- `src/modules/reports/validation.ts` - current filter schema.
- `src/modules/reports/services/history-archive-service.ts` - aggregate service and filter logic.
- `tests/unit/history-archive-service.test.ts` - service no-leak/order/filter regression tests.
- `src/app/executive/_lib/render-executive-page.tsx` - current executive route redirect pattern.
- `src/app/command-center/page.tsx` - current view-specific query parsing and guard behavior.
- `src/modules/command-center/components/command-center-dashboard.tsx` - command-center view rendering branches.
- `src/components/shared/empty-state.tsx` and `src/components/shared/unauthorized-state.tsx` - existing shared states.

### Latest Tech Notes

- No web research required. Story 7.2 uses internal contracts and current dependencies from `package.json`: Next.js 15.3.2, React 19, TypeScript 5.8.3, Supabase JS 2.49.4, lucide-react 0.511.0, Vitest 3.1.3.
- Do not upgrade libraries or add search/timeline UI packages.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/navigation-policy.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/executive-history-route.test.ts`
- `npm run test -- tests/unit/history-archive-service.test.ts tests/unit/history-archive-center.test.tsx tests/unit/command-center-page.test.tsx tests/unit/navigation-policy.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/executive-history-route.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `$env:SKIP_E2E_SEED='1'; npm run test:e2e`
- `npm run build`

### Completion Notes List

- Added canonical `/executive/history` route that follows the existing executive redirect pattern into `/command-center?view=executive-history`, preserving existing query params.
- Added `executive-history` to command-center navigation policy, menu axes, page filter parsing, DTO loading and dashboard rendering.
- Extended History Archive filters with `severity`, added severity assignment for service events, and expanded service-side search with scoped project labels before limit slicing.
- Added `getHistoryArchiveCenterData` wrapper for permission-safe filter options and preserved Command Center params.
- Built `HistoryArchiveCenter` UI with GET URL filters, active filter chips, semantic timeline, safe internal links, allowlisted metadata rendering, empty/no-access states and responsive e2e coverage.
- Kept Story 7.2 scope clean: no export/download actions, no new history persistence table and no client repository/Supabase fetching.

### File List

- `src/app/executive/history/page.tsx`
- `src/app/executive/_lib/render-executive-page.tsx`
- `src/app/command-center/page.tsx`
- `src/lib/permissions/navigation-policy.ts`
- `src/components/shared/unauthorized-state.tsx`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/reports/types.ts`
- `src/modules/reports/validation.ts`
- `src/modules/reports/services/history-archive-service.ts`
- `src/modules/reports/services/history-archive-center-service.ts`
- `src/modules/reports/components/history-archive-center.tsx`
- `tests/unit/navigation-policy.test.ts`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/command-center-page.test.tsx`
- `tests/unit/executive-history-route.test.ts`
- `tests/unit/history-archive-service.test.ts`
- `tests/unit/history-archive-center.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-06-03 | 1.1 | Implemented Story 7.2 History Center route, URL filters, server-side severity/project search, timeline UI and regression coverage. | Codex |
| 2026-06-03 | 1.0 | Created Story 7.2 implementation guide for permission-safe History Center search/filter/timeline UI. | Codex |

## Checklist Validation Notes

- Reinvention prevention: story explicitly reuses `getHistoryArchiveData` and Story 7.1 DTO/tests instead of rebuilding aggregate history in UI.
- Wrong-source prevention: component cannot fetch repositories/Supabase or raw source details; service/wrapper DTO remains authority.
- Route prevention: story accounts for current `/executive/*` redirect-to-Command-Center pattern and avoids a standalone shell mismatch.
- Permission prevention: search/filter must happen before render and no unauthorized data may appear in DOM.
- Scope prevention: `severity` and project/owner search are called out as service/wrapper additions, not fake client-only controls.
- Regression prevention: export, persistence and stored report snapshots are explicitly out of scope.
- UX prevention: active filters, clear behavior, mobile compact list and timeline DOM order are testable requirements.
- No unresolved clarification required before `dev-story`.
