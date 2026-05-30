# Story 1.5: Seed Data Dieu Hanh Cho Nghiem Thu Module 1

Status: done

Ghi chu hoan tat: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao contract seed/mock du lieu nghiem thu Module 1 dua tren foundation Story 1.1-1.4: role/permission catalog, scope assignments, policy/risk settings va leadership delegation. Pham vi chinh la seed, fixture, staging/local seed SQL, docs va test coverage; khong build them UI workflow moi.

## Story

As a product owner,  
I want co du lieu seed/mock du vai tro, scope, policy va delegation,  
so that Module 1 co the nghiem thu bang nhieu user va nhieu pham vi quyen.

## Tieu Chi Chap Nhan

1. **Mock seed determinist cho nghiem thu Module 1**
   - Given developer chay `npm run seed:demo`
   - When script recreate `.mock-data`
   - Then seed ghi day du du lieu Module 1 can thiet, gom `users.json`, `role-permission-catalog.json`, `scope-assignments.json`, `policy-settings.json`, `leadership-delegations.json` va cac domain data lien quan
   - And co it nhat cac persona nghiem thu voi stable id: Chu tich/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Nguoi xem
   - And cac id user/role phai khop mock session, user repository va role catalog; khong dua vao fallback default cua repository de pass nghiem thu.

2. **Du lieu project/opportunity the hien khac biet theo scope**
   - Given cac persona nghiem thu co role assignment va scope assignment khac nhau
   - When moi user mo workspace/dashboard/proposal context
   - Then data hien thi khac nhau theo organization/project/axis/workstream/module scope
   - And seed co 3-5 project/opportunity dai dien trang thai green/yellow/red hoac metadata risk/status tuong duong duoc service hien co doc duoc
   - And co du lieu tai chinh nhay cam, amount/approval value va finance fields de verify user co `finance.view` thay duoc, user khong co quyen thi bi an/khong tra du lieu tu service.

3. **Policy, risk va delegation co du scenario duong tinh va am tinh**
   - Given seed da load policy/risk/delegation
   - When unit test hoac manual demo chay cac scenario Module 1
   - Then co active approval threshold policy, default risk groups, scoped assignments va active delegation cho Thu ky/Tro ly tao/submit proposal thay lanh dao trong scope
   - And co negative scenarios ro rang: user ngoai scope bi 403/no-permission, viewer khong duoc mutation, Thu ky/Tro ly khong approve/reject/request-change thay lanh dao.

4. **Seed phu hop cac checkpoint nghiem thu Module 1 va cac module sau**
   - Given product owner kiem tra acceptance bang demo data
   - Then seed co it nhat mot approval qua han, mot legal risk, mot missing/blocker document, va du lieu placeholder/mock cho Axis 2/Axis 3 trong Approval Center
   - And co meetings nhieu loai, draft minutes, AI summary draft, follow-up task, decision tracking va sample decision/history de cac story sau co fixture bat dau
   - And cac field them vao phai nam trong schema/type hien co hoac duoc mo rong co chu dich, khong them ad hoc field ma service khong doc.

5. **Supabase/local-staging seed contract ro rang**
   - Given team can demo Supabase/local hoac staging
   - When chay seed SQL theo docs
   - Then database co equivalent baseline demo data cho Module 1 acceptance, hoac docs neu ro phan nao chi ap dung file-backed mock mode
   - And seed demo SQL nam trong `database/seeds` voi ten/order ro rang, duoc document la local/staging only va khong load vao production
   - And neu cham bang Supabase/RLS, giu DB snake_case, id on dinh, policy/RLS defense-in-depth, khong yeu cau Auth users that neu chua document mapping.

6. **Fixture va test coverage verify seed contract**
   - Given test suite chay tren repo
   - When unit/fixture tests load seed outputs hoac fixture constants
   - Then tests verify stable personas, role/permission catalog, scope differences, policy/risk config, delegation on-behalf va approve-block
   - And docs cap nhat cach chay seed, danh sach user demo, file output va cac scenario nghiem thu manual.

## Tasks / Subtasks

- [x] Audit seed/demo hien tai va tao fixture contract cho Module 1
  - [x] Review `scripts/seed-demo.mjs`, `.mock-data/*.json`, repository fallback defaults va mock session mapping hien co.
  - [x] Xac dinh source of truth cho acceptance personas, stable ids, projects/opportunities, policies, risk groups, delegations va scenario markers.
  - [x] Neu can, ADD `tests/fixtures/module-one-acceptance.ts` hoac `.json` de dung chung giua script seed va tests; tranh duplicate literal lon giua script va test.
  - [x] Seed chay lap lai phai determinist/idempotent: cung input tao cung file, khong phu thuoc timestamp random cho fixture can assert.

- [x] Mo rong persona va role/user seed cho acceptance
  - [x] Dam bao co Chu tich/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Nguoi xem voi stable id, display name tieng Viet va role assignment ro rang.
  - [x] Giu cac user smoke hien co neu route/e2e dang phu thuoc, khong doi id bat ngo neu khong cap nhat toan bo references.
  - [x] Align `src/lib/auth/mock-session.ts`, `.mock-data/users.json`, role catalog va docs de user co the dang nhap/test dung persona mong doi.
  - [x] Neu them `chairman-01`/`super_admin`, quyet dinh ro `mock-founder` tiep tuc la admin smoke hay duoc map sang super admin; docs phai noi cach dung.

- [x] Seed role-permission catalog explicit
  - [x] UPDATE `scripts/seed-demo.mjs` de ghi `.mock-data/role-permission-catalog.json` thay vi de `JsonRolePermissionCatalogRepository` fallback.
  - [x] Bao ton separation da fix o Story 1.1: admin/settings role khong mac dinh nhan business approval permissions.
  - [x] Dam bao role `thu_ky_tro_ly` khong co `proposal.approve`, `proposal.reject`, `proposal.request_change`, approval/admin/export-sensitive permissions.
  - [x] Fixture/test assert cac role acceptance co permission toi thieu can dung cho demo va deny-list khong bi leak.

- [x] Seed scope assignments cho tung persona
  - [x] UPDATE `scripts/seed-demo.mjs` de ghi `.mock-data/scope-assignments.json` explicit cho cac persona.
  - [x] Tao global/admin scope cho Chu tich/Super Admin neu phu hop; CEO co executive/company scope; Giam doc du an co project scope; Truong bo phan co workstream/module scope; Thu ky/Tro ly chi co scope can thiet hoac delegation metadata; viewer read-only scope han che.
  - [x] Include organization/project/axis/workstream/module combinations du de verify allow va deny.
  - [x] Tests verify it nhat 2 persona thay data khac nhau va user ngoai scope khong thay record nhay cam.

- [x] Seed policy/risk settings explicit
  - [x] UPDATE `scripts/seed-demo.mjs` de ghi `.mock-data/policy-settings.json`.
  - [x] Include active approval threshold policy voi cac threshold/risk group co y nghia cho proposal demo; giu non-overlap va active-default behavior tu Story 1.3.
  - [x] Include default risk groups, legal-risk example va overdue/escalation-friendly metadata neu schema hien co support.
  - [x] Tests verify resolver doc active policy, threshold route dung approver roles/permissions va khong fallback sai khi file seed ton tai.

- [x] Seed leadership delegation explicit
  - [x] UPDATE `scripts/seed-demo.mjs` de ghi `.mock-data/leadership-delegations.json`.
  - [x] Tao active delegation cho Thu ky/Tro ly submit proposal thay mot lanh dao trong project/module scope cu the.
  - [x] Include inactive/expired/out-of-scope delegation neu huu ich cho negative tests, nhung docs/test can phan biet fixture demo va fixture am tinh.
  - [x] Tests verify `assertDelegatedActionAllowed` pass cho `proposal.create` dung scope va fail cho approve/reject/request-change/on behalf ngoai scope.

- [x] Mo rong project/opportunity va domain data nghiem thu
  - [x] UPDATE seed demo de co 3-5 project/opportunity dai dien green/yellow/red va cac trang thai nghiem thu Module 1.
  - [x] Include sensitive financial data, approval amount, budget/cost fields hoac finance fields ma service hien co su dung.
  - [x] Include at least one overdue approval/proposal, one legal risk, one blocker/missing document, one follow-up task, decision history va meetings nhieu loai.
  - [x] Include Axis 2/Axis 3 placeholder/mock approval data theo schema hien co de Approval Center sau nay co fixture.
  - [x] Khong them field tuy tien vao JSON neu type/repository/service se bo qua; neu can field moi, cap nhat type, repository mapper va tests.

- [x] Them/bo sung Supabase local-staging demo seed
  - [x] ADD `database/seeds/003_module1_acceptance_demo.sql` hoac ten/order tuong duong neu repo da co convention khac.
  - [x] Seed chi ap dung local/staging/demo; khong dua demo data vao production baseline.
  - [x] Neu co bang chua ton tai trong Supabase mode, document gap ro hoac them seed tuong ung sau migration hien co.
  - [x] UPDATE `database/seeds/README.md` voi thu tu chay, muc dich, production exclusion va mapping user/role/demo id.
  - [x] Neu them verification, ADD `database/verification/006_module1_acceptance_seed.sql` hoac tuong duong de assert presence/allow-deny quan trong.

- [x] Them test coverage cho seed contract
  - [x] ADD `tests/unit/module-one-seed-fixtures.test.ts` hoac ten tuong duong.
  - [x] Test `npm run seed:demo` output bang cach load JSON fixtures hoac helper parser; tranh snapshot qua lon.
  - [x] Verify stable personas, required files, role-permission deny-list, scope differences, policy/risk, delegation pass/fail va finance visibility expectations.
  - [x] Neu can, extend dashboard/workspace/proposal unit tests de dung fixture seed thay vi fallback defaults.
  - [x] E2E chi can update neu route/login smoke can cover persona seed; khong bat buoc neu khong doi UI route.

- [x] Cap nhat docs nghiem thu va developer workflow
  - [x] UPDATE `docs/development/README.md` voi danh sach file seed moi, cach chay `npm run seed:demo`, danh sach personas va scenario manual.
  - [x] UPDATE `scripts/README.md` neu co huong dan script seed.
  - [x] Document ro mock/file-backed vs Supabase local-staging seed, va canh bao production exclusion.
  - [x] Ghi chu cac scenario 403/no-permission, finance hidden, submit on behalf va approve-block de QA/product owner co checklist.

- [x] Kiem thu
  - [x] Chay `npm run typecheck`.
  - [x] Chay `npm run lint`.
  - [x] Chay `npm run test`.
  - [x] Neu co route/UI smoke thay doi, chay `npm run test:e2e`.
  - [x] Neu test khong chay duoc vi dependency/env, ghi ro ly do va lenh da thu trong Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Scope assignments are over-constrained and can hide seeded data from acceptance personas [tests/fixtures/module-one-acceptance.json:531]
- [x] [Review][Patch] Chairman/Super Admin global scope omits operational read permissions used by dashboard/workspace filters [tests/fixtures/module-one-acceptance.json:504]
- [x] [Review][Patch] Mock session identity does not fully match seeded acceptance personas [src/lib/auth/mock-session.ts:13]
- [x] [Review][Patch] Supabase demo seed lacks the mock seed's on-behalf proposal fixture [database/seeds/003_module1_acceptance_demo.sql:300]
- [x] [Review][Patch] Supabase meeting seed drops or preserves stale related approval links [database/seeds/003_module1_acceptance_demo.sql:215]
- [x] [Review][Patch] Delegation verification can pass after the positive delegation expires [database/verification/006_module1_acceptance_seed.sql:75]
- [x] [Review][Patch] Story-specific seed tests assert JSON shape but do not exercise generated scope, finance and delegation behavior through services [tests/unit/module-one-seed-fixtures.test.ts:88]
- [x] [Review][Patch] Database seed docs claim policy/risk data is created by `003_module1_acceptance_demo.sql`, but that file does not upsert those tables [database/seeds/README.md:11]
- [x] [Review][Patch] `thu_ky_tro_ly` role included export-classified `report.create` despite the story deny-list [tests/fixtures/module-one-acceptance.json:416]
- [x] [Review][Patch] Supabase admin smoke user was seeded without workspace membership or global scope assignment [database/seeds/003_module1_acceptance_demo.sql:47]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 1 Story 1.5 yeu cau seed/mock du lieu cho vai tro, scope, policy va delegation de nghiem thu Module 1 voi nhieu user va nhieu pham vi quyen. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.5`]
- PRD yeu cau seed Module 1 co 3-5 project/opportunity, green/yellow/red states, legal risk, overdue approval, missing/blocker document, Axis 2/3 placeholder, meetings, draft minutes, AI summary draft, follow-up task, decision tracking/history va finance-sensitive data. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#11.1 Du Lieu Mock/Seed Data`]
- PRD user demo toi thieu: Chu tich/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly, Nguoi xem. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#11.2 User Demo`]
- Module 1 acceptance can verify workspace/private data by permission, Axis tabs placeholders, approval types, permissions/403, finance hidden, assistant delegated scope, audit/history. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#12. Acceptance Criteria`]
- NFR yeu cau multi-org/project/role/assignment va khong hardcode role/approver/threshold/risk group/future module. Seed data nen cung co tinh config-driven, khong tao shortcut role-name trong services/UI. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-007`]

### Hien Trang Code Lien Quan

- `scripts/seed-demo.mjs` hien ghi nhieu file `.mock-data` nhu `users.json`, `project-core.json`, `task-management.json`, `document-center.json`, `document-requirements.json`, `meetings-decisions.json`, `reports.json`, `proposals.json`, `source-registry-settings.json` va knowledge files.
- Script seed hien chua ghi explicit cac file moi tu Story 1.1-1.4: `role-permission-catalog.json`, `scope-assignments.json`, `policy-settings.json`, `leadership-delegations.json`. Cac repository JSON dang fallback default neu file vang mat, nhung Story 1.5 phai tao fixture nghiem thu explicit.
- Seed demo hien co 2 project chinh (`demo-project-riverside`, `demo-project-garden`), chua dat yeu cau PRD 3-5 project/opportunity green/yellow/red.
- `src/lib/auth/mock-session.ts` map mock roles sang fixed user ids. Neu them persona moi, phai cap nhat hoac document mapping de e2e/manual login khong bi lech user.
- `src/modules/settings/services/scope-assignment-repository.ts` fallback hien chi tao global admin assignment cho `mock-founder`. Story nay can seed explicit assignments cho moi persona nghiem thu.
- `src/modules/settings/services/policy-settings-repository.ts` co fallback policy/risk groups. Story nay can seed explicit active config de tests khong phu thuoc fallback.
- `src/modules/settings/services/leadership-delegation-repository.ts` fallback rong. Story nay can seed explicit delegation cho Thu ky/Tro ly.
- `src/modules/workspaces/services/workspace-service.ts` da load active scope assignments, role-permission catalog va active delegations cua delegate de build workspace/delegation metadata.
- `src/modules/dashboard/services/dashboard-service.ts` da filter theo active scope assignments va gate finance bang `finance.view`; seed phai tao data de verify ca duong co quyen va khong co quyen.
- `src/modules/proposals/services/proposal-service.ts` da ho tro `submittedBy`, `onBehalfOf`, `delegationId` va chan delegated approve/reject/request-change; seed/test phai exercise contract nay.
- `database/seeds/001_roles_permissions.sql` la baseline RBAC/policy/risk idempotent cho Supabase. `database/seeds/002_rls_external_isolation_seed.sql` la staging-only external isolation seed, khong phai full Module 1 acceptance seed.

### Rang Buoc Kien Truc

- Giu modular monolith Next.js App Router + TypeScript; domain nam trong `src/modules/*`, cross-cutting auth/permissions/db/audit trong `src/lib/*`, database trong `database/*`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- Internal mutations dung Server Actions + service layer; page/component khong goi repository hoac Supabase truc tiep. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Mock/file-backed mode va Supabase mode phai giu chung service contract; repository adapter map storage sang domain DTO. [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- DB snake_case, domain DTO camelCase, TypeScript date/time dung ISO string. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Exchange Formats`]
- Permission enforce o server/service deny-by-default; RLS la defense-in-depth. Seed/RLS verification khong duoc thay the service-level deny checks. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Proposal/Approval la shared backbone; khong tao approval flow rieng hoac duplicate approval entities cho seed. [Source: `_bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified`]
- Khong nang cap framework, khong scaffold lai app, khong them ORM/tRPC. Story nay nen dung Node `fs/promises` va pattern script hien co.

### Rang Buoc UX/QA

- Day la operational enterprise demo data, khong can landing/marketing UI. Neu docs/manual scenarios them text UI, giu tieng Viet ro rang va tap trung workflow nghiem thu.
- Permission/403: khong render data roi moi an. Manual checklist can verify service/page tra no-permission state truoc khi data nhay cam hien ra. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Permission / 403`]
- Finance-sensitive fields phai co du lieu that trong fixture de reviewer thay duoc su khac biet giua role co `finance.view` va role khong co quyen.
- Status/risk badges trong demo nen co text, khong chi dua vao mau, de phu hop UX spec va accessibility.
- Mobile/e2e khong bat buoc neu chi doi seed, nhung neu story sua UI smoke route thi phai dam bao text khong overlap va state khong vo tren viewport nho.

### Data Contract Goi Y

Acceptance personas nen co stable ids va vai tro ro rang. Ten/id duoi day la goi y, dev co the giu ids hien co neu dang duoc dung rong rai:

```ts
type ModuleOneAcceptancePersona =
  | "chairman-01"
  | "ceo-01"
  | "project-director-01"
  | "department-head-01"
  | "assistant-01"
  | "viewer-01";
```

Required seed outputs in mock mode:

```text
.mock-data/users.json
.mock-data/role-permission-catalog.json
.mock-data/scope-assignments.json
.mock-data/policy-settings.json
.mock-data/leadership-delegations.json
.mock-data/project-core.json
.mock-data/proposals.json
.mock-data/document-center.json
.mock-data/document-requirements.json
.mock-data/meetings-decisions.json
.mock-data/task-management.json
```

Behavior bat buoc:
- Explicit seed file thang fallback repository. Fallback chi la dev convenience, khong la acceptance fixture.
- Scope assignment va delegation la hai contract khac nhau: assignment cap effective role/permission trong scope; delegation cap on-behalf action theo principal/delegate/action/scope.
- Thu ky/Tro ly co the submit on behalf chi khi delegation active, action allowed va scope match; khong duoc approve thay.
- Viewer/read-only user phai co du du lieu de thay dashboard/workspace read state nhung mutation bi chan.
- Finance fields phai test duoc o service DTO/output, khong chi an bang CSS/UI.

### Ngu Canh Story Truoc

- Story 1.1 da tao role/permission catalog va sua separation admin vs business approval. Khi seed role catalog, khong cap business approval permissions rong cho admin/settings roles.
- Story 1.2 da tao scope assignment va server/service-level filtering. Seed phai dung assignments de tao data khac nhau theo user, khong loc bang frontend-only.
- Story 1.3 da tao policy/risk groups va approval threshold resolver. Seed policy phai giu non-overlap thresholds, active default risk group va approver role/permission consistency.
- Story 1.4 da tao leadership delegation, on-behalf proposal metadata va approve-block. Seed phai co fixture verify `proposal.create` delegated pass va approve/reject/request-change delegated fail.
- Previous review findings nhan manh RLS/permission parity: neu Supabase seed/demo co user chi co scoped permission, page/service/RLS phai cung mot contract, khong tao trang vao duoc nhung service bi tu choi vi doc user/catalog khong duoc.

### File Targets

Expected UPDATE:
- `scripts/seed-demo.mjs`
- `docs/development/README.md`
- `scripts/README.md`
- `database/seeds/README.md`
- `.mock-data/*.json` generated by `npm run seed:demo`
- `src/lib/auth/mock-session.ts` neu them persona/login mapping moi
- `tests/e2e/mvp-smoke.spec.ts` chi neu them/cap nhat smoke persona flow

Expected ADD:
- `tests/unit/module-one-seed-fixtures.test.ts`
- `tests/fixtures/module-one-acceptance.ts` hoac `.json` neu can shared fixture
- `database/seeds/003_module1_acceptance_demo.sql` hoac ten/order tuong duong
- `database/verification/006_module1_acceptance_seed.sql` neu them Supabase verification

Avoid unless truly needed:
- Khong sua UI/business workflow ngoai pham vi seed/doc/test.
- Khong rewrite repository/service fallback logic neu explicit seed file da du.
- Khong them approval flow rieng.
- Khong cap permission approve cho Thu ky/Tro ly.
- Khong dua demo data vao production baseline.
- Khong nang cap dependencies hoac scaffold lai project.
- Khong revert cac file dirty khong lien quan trong worktree.

### Latest Tech Notes

- Project `package.json` hien pin Next `^15.3.2`, React `^19.0.0`, `@supabase/supabase-js` `^2.49.4`, Zod `^3.24.4`, Vitest `^3.1.3`, Playwright `^1.52.0`. Story nay khong can nang cap dependency.
- Neu cham Server Actions/docs behavior, dung pattern chinh thuc Next.js App Router cho mutating data va `revalidatePath`/redirect tu action: https://nextjs.org/docs/app/getting-started/mutating-data
- Neu cham Supabase RLS/seed verification, giu policy `using` va `with check` theo docs RLS chinh thuc: https://supabase.com/docs/guides/database/postgres/row-level-security
- Neu them client action state trong UI docs/test phu, React 19 `useActionState` la API hien tai: https://react.dev/reference/react/useActionState
- Zod tiep tuc la boundary validation cho script/service inputs; khong thay bang parser tuy bien neu schema hien co da du: https://zod.dev/

### Testing Guidance

- Unit/fixture tests nen doc JSON va assert shape/semantics, khong snapshot toan bo file seed lon.
- Nen co helper assert required user ids, required seed output files, permission deny-list, scope visibility matrix, policy threshold sanity va delegation pass/fail.
- Chay toi thieu `npm run typecheck`, `npm run lint`, `npm run test`.
- Chay `npm run test:e2e` neu sua mock session, login role mapping, navigation hoac route smoke.
- Neu `npm run seed:demo` sinh ra nhieu file `.mock-data`, Dev Agent Record phai ghi ro file nao la generated output va vi sao commit/keep.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-24: Red test `npm run test -- tests/unit/module-one-seed-fixtures.test.ts` failed because `seed-demo.mjs` did not yet honor temp output dir or generate new contract files.
- 2026-05-24: Green test `npm run test -- tests/unit/module-one-seed-fixtures.test.ts` passed after fixture-driven seed implementation.
- 2026-05-24: Ran `npm run seed:demo` to regenerate `.mock-data`.
- 2026-05-24: Ran `npm run typecheck` - passed.
- 2026-05-24: Ran `npm run lint` - passed.
- 2026-05-24: Ran `npm run test` - first pass exposed missing `task.view` in `mock-founder` smoke scope; fixed fixture and reran, 233/233 passed.
- 2026-05-24: Ran `npm run test:e2e` - first run had one Playwright timeout during cold route compilation; rerun passed 27/27.
- 2026-05-24: Code review patches applied for scope matching, Super Admin global read permissions, mock session identity, SQL on-behalf proposal parity, related approval links, policy/risk SQL upsert, delegation verification and story-specific behavior tests.
- 2026-05-24: Ran `npm run seed:demo` after review fixes to regenerate `.mock-data`.
- 2026-05-24: Ran `npm run test -- tests/unit/module-one-seed-fixtures.test.ts` - 6/6 passed.
- 2026-05-24: Ran `npm run typecheck` - passed.
- 2026-05-24: Ran `npm run lint` - passed.
- 2026-05-24: Ran `npm run test` - 235/235 passed.
- 2026-05-24: Ran `npm run test:e2e` - 27/27 passed.
- 2026-05-24: Added SQL admin smoke workspace membership and global scope assignment after review follow-up.
- 2026-05-24: Reran `npm run test -- tests/unit/module-one-seed-fixtures.test.ts` after final review follow-up - 6/6 passed.

### Completion Notes

- Implemented shared Module 1 acceptance fixture contract in `tests/fixtures/module-one-acceptance.json`.
- Updated `scripts/seed-demo.mjs` to use deterministic base time, support `GREENNEST_MOCK_DATA_DIR`, generate explicit role-permission catalog, scope assignments, policy/risk settings and leadership delegations, and extend domain data for 4 project scenarios, finance-sensitive records, overdue approval, legal/missing document markers, Axis 2/3 placeholders, meetings, draft minutes, AI summary draft, follow-up task and decision tracking.
- Aligned mock session stable IDs for `super_admin`, `to_truong` and `viewer` with seeded acceptance personas while keeping `mock-founder` as admin smoke user.
- Added local/staging SQL demo seed and read-only verification SQL for Module 1 acceptance.
- Updated developer/script/database docs with seed files, persona list, manual scenarios and production exclusion guidance.
- Review fixes resolved all code review patch findings and marked the story done.

### File List

- `scripts/seed-demo.mjs`
- `src/lib/auth/mock-session.ts`
- `tests/fixtures/module-one-acceptance.json`
- `tests/unit/module-one-seed-fixtures.test.ts`
- `database/seeds/003_module1_acceptance_demo.sql`
- `database/migrations/202605240002_add_proposal_delegation_metadata.sql`
- `database/seeds/README.md`
- `database/verification/006_module1_acceptance_seed.sql`
- `database/verification/README.md`
- `docs/development/README.md`
- `scripts/README.md`
- `.mock-data/ai-jobs.json` (generated)
- `.mock-data/document-center.json` (generated)
- `.mock-data/document-requirements.json` (generated)
- `.mock-data/external-search-logs.json` (generated)
- `.mock-data/knowledge-candidates.json` (generated)
- `.mock-data/knowledge-center.json` (generated)
- `.mock-data/knowledge-discovery.json` (generated)
- `.mock-data/leadership-delegations.json` (generated)
- `.mock-data/meetings-decisions.json` (generated)
- `.mock-data/policy-settings.json` (generated)
- `.mock-data/project-core.json` (generated)
- `.mock-data/proposals.json` (generated)
- `.mock-data/reports.json` (generated)
- `.mock-data/role-permission-catalog.json` (generated)
- `.mock-data/scope-assignments.json` (generated)
- `.mock-data/source-registry-settings.json` (generated)
- `.mock-data/task-management.json` (generated)
- `.mock-data/users.json` (generated)

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.0 | Created Story 1.5 seed data implementation guide and acceptance contract. | Codex |
| 2026-05-24 | 1.1 | Implemented deterministic Module 1 acceptance seed, tests, SQL seed/verification and docs. | Codex |
