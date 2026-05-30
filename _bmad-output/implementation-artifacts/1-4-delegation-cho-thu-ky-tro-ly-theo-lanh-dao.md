# Story 1.4: Delegation Cho Thu Ky/Tro Ly Theo Lanh Dao

Status: done

Ghi chu hoan tat: Da phan tich Epic 1, PRD, architecture, UX, Story 1.3 da done, code hien trang va thong tin ky thuat moi nhat de tao huong dan trien khai day du cho dev agent. Story nay chi xay nen delegation MVP cho Thu ky/Tro ly: cau hinh, validate scope/action, submit proposal thay lanh dao va audit. Khong cho approve thay trong MVP, khong xay full Secretary Workspace, Risk Center CRUD hoac Meeting Engine trong story nay.

## Story

As a lanh dao hoac quan tri duoc uy quyen,  
I want cau hinh Thu ky/Tro ly theo tung lanh dao va pham vi du an/module/action,  
so that Thu ky/Tro ly chi thao tac trong pham vi duoc uy quyen.

## Tieu Chi Chap Nhan

1. **Luu cau hinh delegation theo lanh dao, nguoi duoc uy quyen va scope**
   - Given mot lanh dao hoac quan tri co quyen quan ly delegation
   - When cau hinh delegation cho Thu ky/Tro ly
   - Then he thong luu `principalUserId`, `delegateUserId`, `project/module/action`, thoi han neu co, trang thai active va audit fields
   - And service validate user ton tai, delegate khac principal, action hop le, action khong phai approval/admin nhay cam, scope hop le.

2. **Thu ky/Tro ly duoc tao va submit request thay lanh dao trong scope duoc uy quyen**
   - Given Thu ky/Tro ly co delegation active cho action tao/trinh request
   - When tao va submit proposal trong project/module duoc uy quyen
   - Then proposal ghi ro `submittedBy` la nguoi thao tac thuc te va `onBehalfOf` la lanh dao duoc dai dien
   - And service khong can cap quyen `proposal.create` rong cho role `thu_ky_tro_ly`; delegation chi duoc tinh trong dung context.

3. **Audit log the hien hanh dong thay mat**
   - Given delegation duoc tao/sua/tat hoac proposal duoc submit on-behalf
   - When mutation hoan tat
   - Then audit log ghi actor thuc te, `onBehalfOf`, delegation id, old/new values, action, thoi gian va scope snapshot.

4. **MVP chan approve thay lanh dao bang service-side permission**
   - Given Thu ky/Tro ly co delegation active
   - When co gang approve, reject hoac request-change thay lanh dao
   - Then proposal/approval service chan action va tra thong bao ro: MVP khong cho approve thay lanh dao
   - And UI khong render nut approve thay, nhung direct server action van bi chan neu goi truc tiep.

5. **Delegation metadata san sang cho workspace sau**
   - Given Assistant Workspace hoac Private Workspace can biet pham vi duoc uy quyen
   - When workspace service tai data
   - Then service co the lay active delegations cua user va tra summary/scope metadata cho UI sau nay
   - And story nay khong bat buoc build full Secretary Workspace; Story 2.6 se dung foundation nay.

## Tasks / Subtasks

- [x] Tao domain model delegation trong settings/users boundary
  - [x] Mo rong `src/modules/settings/types.ts` voi `LeadershipDelegation`, `LeadershipDelegationInput`, `LeadershipDelegationMutationResult`, `DelegationActionKey`, `DelegationResolution`, `DelegationAuditValue`.
  - [x] Reuse `ScopeDimension` tu Story 1.2: `organizationId`, `projectId`, `axisId`, `workstreamId`, `moduleId`, `recordId`.
  - [x] Domain toi thieu: `id`, `principalUserId`, `delegateUserId`, `actionKeys`, scope columns, `active`, `startsAt`, `endsAt`, `note`, `createdBy`, `updatedBy`, timestamps.
  - [x] `actionKeys` nen la subset an toan cua `PermissionAction`, nhung phai exclude business approval/admin actions nhu `proposal.approve`, `proposal.reject`, `proposal.request_change`, `finance.approve`, `payment.approve`, `document.approve`, `decision.approve`, `settings.manage`, `user.invite`, `user.update_role`, `audit.view`.
  - [x] Khong bien delegation thanh role assignment; delegation la relation on-behalf theo principal/delegate/action/scope.

- [x] Them permission va guard cho quan ly delegation
  - [x] UPDATE `src/lib/permissions/can.ts` them permission moi `delegation.manage`.
  - [x] Cap nhat `ROLE_PERMISSIONS`/role catalog/seed de leadership va quan tri duoc uy quyen co the cau hinh delegation ma khong nhan business approval permissions neu khong co.
  - [x] UPDATE `database/seeds/001_roles_permissions.sql` idempotent cho `delegation.manage`; khong lam mat delete guard dang go bo business approval permissions khoi role `admin`.
  - [x] Neu `/settings` duoc dung cho delegation panel, them helper route guard nhu `requireAnyPermission(["settings.manage", "delegation.manage"])` hoac pattern tuong duong.
  - [x] Khi user chi co `delegation.manage`, UI settings chi duoc render delegation panel va khong render role catalog, scope assignment, policy settings hoac source registry nhay cam.

- [x] Them validation cho delegation input
  - [x] UPDATE `src/modules/settings/validation.ts` voi Zod schemas: create/update/disable delegation.
  - [x] Validate `principalUserId`, `delegateUserId`, `actionKeys`, scope, `startsAt <= endsAt`, `active`.
  - [x] Validate co it nhat mot scope dimension hoac scopeType/global ro rang neu dev them scopeType; khong cho global rong neu action nhay cam.
  - [x] Validate sync trong schema; lookup user/role/catalog va action safety nam trong service, khong goi repository trong schema.
  - [x] Error message tieng Viet ro, khong chung chung.

- [x] Tao service/repository delegation theo pattern settings hien co
  - [x] ADD `src/modules/settings/services/leadership-delegation-service.ts`.
  - [x] ADD `src/modules/settings/services/leadership-delegation-repository.ts`.
  - [x] JSON repository dung `.mock-data/leadership-delegations.json`; fallback rong hoac seed demo nho neu khong co file.
  - [x] Supabase repository map snake_case sang camelCase qua `toDomain`/`toRow`; khong goi Supabase truc tiep tu page/component.
  - [x] Public functions de xuat: `listLeadershipDelegations`, `listActiveDelegationsForDelegate`, `listActiveDelegationsForPrincipal`, `upsertLeadershipDelegation`, `setLeadershipDelegationActive`, `resolveDelegatedAction`, `assertDelegatedActionAllowed`, `leadershipDelegationAuditValue`.
  - [x] Mutations require `delegation.manage` hoac `settings.manage`; neu actor la principal tu cau hinh cua chinh minh, van phai co `delegation.manage`.
  - [x] `assertDelegatedActionAllowed` phai check actor la delegate, principal dung, action nam trong `actionKeys`, delegation active, thoi gian hop le, scope match theo rule Story 1.2 va action khong thuoc deny-list approval/admin.

- [x] Them Server Actions va audit cho delegation config
  - [x] UPDATE `src/modules/settings/actions.ts` de parse FormData cho create/update/disable delegation.
  - [x] Actions goi service, tao audit qua `createAuditLog`, `revalidatePath("/settings")`, redirect ve `#leadership-delegations`.
  - [x] Audit entity type de xuat: `leadership_delegation`.
  - [x] Audit actions de xuat: `delegation.upsert`, `delegation.enable`, `delegation.disable`.
  - [x] Audit payload gom actor, principal/delegate, actionKeys, scope snapshot, validity window va old/new values.

- [x] Xay UI cau hinh delegation
  - [x] ADD `src/modules/settings/components/leadership-delegation-panel.tsx`.
  - [x] UPDATE `src/app/(dashboard)/settings/page.tsx` de load delegations, users, projects, role/permission catalog va render panel theo permission.
  - [x] UPDATE `src/lib/permissions/navigation.ts` neu can hien "Cai dat" hoac entry delegation cho user co `delegation.manage`; khong mo toan bo settings menu cho user khong co quyen.
  - [x] Form co label tieng Viet, required indicators, inline validation/pending states theo pattern `PolicySubmitButton` neu phu hop.
  - [x] Table hien thi lanh dao, Thu ky/Tro ly, actions duoc uy quyen, scope, hieu luc, active, updatedBy/updatedAt.
  - [x] Action disable/enable can confirmation; khong dung mau de truyen dat trang thai neu khong co text label.
  - [x] Action options phai lay tu permission catalog va filtered bang deny-list; khong hardcode list role/permission trong component.

- [x] Tich hop proposal create/submit on-behalf
  - [x] UPDATE `src/modules/proposals/types.ts`: them `submittedBy?: EntityId`, `onBehalfOf?: EntityId`, `delegationId?: string` vao `Proposal` va input field phu hop.
  - [x] UPDATE `src/modules/proposals/validation.ts` cho `onBehalfOf`/`delegationId` optional.
  - [x] UPDATE `src/modules/proposals/services/proposal-service.ts`:
    - Direct create hien tai tiep tuc hoat dong.
    - Neu input co `onBehalfOf`, service goi `assertDelegatedActionAllowed` voi action `proposal.create`, actor la user hien tai, principal la `onBehalfOf`, scope lay tu `projectId/module/record`.
    - Proposal on-behalf phai set `requestedBy` theo principal business owner, `submittedBy` theo actor thuc te, `onBehalfOf` theo principal va `delegationId`.
    - `submitProposal` phai preserve/ghi decision notes/audit context on-behalf; khong mat metadata khi update status/currentStep.
  - [x] UPDATE `src/modules/proposals/actions.ts` va form create proposal neu can de doc `onBehalfOf`/`delegationId`, chi render option on-behalf khi user co active delegation.
  - [x] Khong cho on-behalf bypass domain create checks ngoai scope; delegate khong co delegation hop le thi van bi `proposal.create` block nhu hien tai.

- [x] Chan approve/reject/request-change thay trong MVP
  - [x] UPDATE `approveProposal`, `rejectProposal`, `requestProposalChange` de khong chap nhan delegated context; neu action form/service input co `onBehalfOf` hoac `delegationId`, throw message tieng Viet ro.
  - [x] Khong them `proposal.approve`, `proposal.reject`, `proposal.request_change` vao role `thu_ky_tro_ly`.
  - [x] Neu dev them helper effective permission tu delegation, helper do phai exclude `BUSINESS_APPROVAL_PERMISSIONS`.
  - [x] UI proposal detail khong render approve thay lanh dao; server action van la authority cuoi cung.

- [x] Tich hop workspace metadata o muc foundation
  - [x] UPDATE `src/modules/workspaces/types.ts` de co optional `delegations` hoac `delegationSummary`.
  - [x] UPDATE `src/modules/workspaces/services/workspace-service.ts` de load active delegations cho current user va tra summary cho `/assistant-workspace`.
  - [x] Khong build full Secretary/Assistant Workspace trong story nay; Story 2.6 se quyet dinh composition lich lanh dao, ho so trinh, tai lieu hop, reminder va pending approval.
  - [x] Khong loc du lieu workspace chi bang frontend; neu dung delegation de filter data, phai lam o service layer.

- [x] Them database migration, RLS va verification cho Supabase mode
  - [x] ADD migration tiep theo, vi du `database/migrations/202605240001_create_leadership_delegations.sql`.
  - [x] Tao bang `leadership_delegations` voi principal/delegate user FK, action_keys text[], scope columns, active, validity window, note, created/updated fields.
  - [x] Check constraints: principal != delegate, action_keys non-empty, starts <= ends.
  - [x] Trigger/constraint validate action keys ton tai trong `permissions` va khong nam trong deny-list approval/admin neu co the lam bang SQL; service van phai enforce lai.
  - [x] RLS: principal/delegate doc duoc delegation cua minh; settings/delegation managers doc/ghi; app/service van check permission truoc RLS.
  - [x] ADD verification SQL, vi du `database/verification/005_leadership_delegations_rls.sql`, kiem tra metadata, RLS policy predicates va insert/update allow/deny smoke neu pattern hien co cho phep.

- [x] Kiem thu
  - [x] ADD `tests/unit/leadership-delegation-service.test.ts` cho create/update/disable, scope match, expired/inactive, invalid users, invalid/approval/admin action deny-list, audit value.
  - [x] UPDATE `tests/unit/settings-actions.test.ts` cho delegation actions va old/new audit.
  - [x] UPDATE `tests/unit/proposal-service.test.ts` cho create/submit on-behalf va chan approve/reject/request-change thay.
  - [x] UPDATE `tests/unit/workspaces.test.ts` hoac `tests/unit/access-scope.test.ts` neu workspace metadata/scope integration thay doi.
  - [x] UPDATE `tests/e2e/mvp-smoke.spec.ts` neu them UI delegation vao `/settings` hoac on-behalf create proposal flow co smoke duoc.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`; neu thay doi route/settings/proposals UI lon, chay `npm run test:e2e`.

### Review Findings

- [x] [Review][Patch] Delegation manager khong co `user.view` bi vo hieu hoa trong Supabase: `/settings` va service can `listUsers()`/`getUser()` de chon va validate principal/delegate, nhung RLS `users` chi cho doc self hoac `user.view`; role `pho_tong_giam_doc` duoc seed `delegation.manage` nhung khong co `user.view`, nen khong the quan ly delegation cho nguoi khac trong Supabase.
- [x] [Review][Patch] Proposal on-behalf UI khong ton trong scope delegation khong gan project cu the: service coi dimension rong la match moi target neu delegation co dimension khac, nhung `/proposals/new` chi coi `projectId="*"` la all-project; delegation module-only hop le se khong thay project nao de chon.
- [x] [Review][Patch] Quyen `delegation.manage` tu scope assignment vao duoc `/settings` nhung khong render/khong mutation duoc: route guard va RLS chap nhan `current_user_has_scope_assignment_permission('delegation.manage')`, trong khi settings page va service chi dung `can(...)`, tao trang settings trong va submit bi tu choi cho cung mot quyen.

## Dev Notes

### Boi Canh Nghiep Vu

- PRD yeu cau Thu ky/Tro ly duoc uy quyen theo tung lanh dao, co the cau hinh pham vi project/module/action neu can. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#7.12. Thư Ký / Trợ Lý`]
- Thu ky/Tro ly duoc tao va submit request thay lanh dao neu lanh dao cho phep, nhung MVP khong cho approve thay lanh dao. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.4`]
- Workspace cua Thu ky/Tro ly chi duoc hien thi du lieu/action duoc lanh dao uy quyen; full workspace se duoc xu ly tiep o Story 2.6. [Source: `_bmad-output/planning-artifacts/epics.md#Story 2.6`]
- Moi thay doi quan trong ve permission/delegation/proposal can audit/history. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-006`]
- Khong hardcode role, approver, nguong tien, risk group hoac module tuong lai. Delegation phai la config/action/scope, khong la if role name trong UI. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-008`]

### Hien Trang Code Lien Quan

- `src/modules/settings/types.ts` da co `ScopeDimension`, `ScopeAssignment`, `PolicyScope`, policy/risk types tu Story 1.2/1.3. Chua co delegation type.
- `src/modules/settings/services/scope-assignment-service.ts` da validate user, role, permissions, project/module scope va co `scopeAssignmentAuditValue`. Delegation nen reuse scope shape nhung khong reuse assignment entity vi delegation co principal/delegate/on-behalf semantics.
- `src/modules/settings/services/policy-settings-service.ts` la pattern gan nhat cho service moi: assert permission, parse Zod, lookup catalog/repository, old/new mutation result, audit value helper.
- `src/modules/settings/actions.ts` da co pattern action -> service -> `createAuditLog` -> `revalidatePath("/settings")` -> redirect anchor.
- `src/app/(dashboard)/settings/page.tsx` hien require `settings.manage` va render provider, role catalog, scope assignment, policy settings, source registry. Neu them `delegation.manage`, can tranh leak cac panel khac cho lanh dao chi co delegation permission.
- `src/lib/permissions/can.ts` hien co `BUSINESS_APPROVAL_PERMISSIONS` va da loai business approval khoi role `admin`. Story 1.4 phai bao ton constraint nay.
- `src/modules/proposals/types.ts` hien `Proposal` chi co `requestedBy`, chua co `submittedBy`, `onBehalfOf`, `delegationId`.
- `src/modules/proposals/services/proposal-service.ts` hien `createProposal` assert `proposal.create`; `submitProposal` assert `proposal.create` va dung policy resolver Story 1.3; `approveProposal` assert `proposal.approve`; `rejectProposal` cho `proposal.reject` hoac `proposal.approve`; `requestProposalChange` require `proposal.request_change`.
- `src/modules/proposals/actions.ts` audit proposal create/submit/approve/reject nhung payload chua co on-behalf context.
- `src/modules/workspaces/services/workspace-service.ts` da load scope assignments, role catalog va filter data server-side. `/assistant-workspace` dang dung chung `RoleWorkspaceShell`, chua co delegation metadata.
- `src/lib/permissions/access-scope.ts` da co `canAccessScopedAction`, `hasAnyScopedActionGrant`, active assignment time-window va scope matching. Delegation scope matching nen song song/reuse logic thay vi viet filter tuy tien.
- `database/migrations/202605230003_create_scope_assignments.sql` va `202605230004_create_policy_settings.sql` la mau gan nhat cho migration/RLS/verification.

### Rang Buoc Kien Truc

- Giu modular monolith: domain module trong `src/modules/*`, cross-cutting auth/permissions/db/audit trong `src/lib/*`, database trong `database/*`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- Internal mutation dung Server Actions + service layer; component/page khong goi repository hoac Supabase truc tiep. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Repository implementation dat trong `services/*-repository.ts`, service orchestration dat trong `services/*-service.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`]
- DB snake_case, domain DTO camelCase. Date/time TypeScript dung ISO string. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Exchange Formats`]
- Permission check o action/service truoc mutation; RLS la defense-in-depth, khong thay the service permission checks. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Proposal/Approval la backbone dung chung; khong tao approval flow rieng cho delegation. [Source: `_bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified`]
- Mock/file-backed va Supabase repositories phai giu cung service contract. [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]

### Rang Buoc UX

- BO Settings/delegation la tool van hanh, giao dien can dense but readable, dung bang/form/list ro rang, khong hero/marketing layout.
- Form can label tieng Viet, required indicator, inline validation, giu input khi loi neu co client state. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`]
- Destructive disable/turn off delegation can confirmation. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy`]
- Permission denied khong duoc render du lieu roi moi an; direct URL can 403 ro rang. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Permission / 403`]
- Secretary/Assistant Workspace chi thay du lieu duoc uy quyen; UI can hien delegation/scope bang text, khong chi bang mau. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles`]

### Data Contract Goi Y

```ts
type DelegationActionKey = PermissionAction;

type LeadershipDelegation = ScopeDimension & {
  id: string;
  principalUserId: string;
  delegateUserId: string;
  actionKeys: DelegationActionKey[];
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  note?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

type DelegationResolution = {
  delegationId: string;
  principalUserId: string;
  delegateUserId: string;
  actionKey: DelegationActionKey;
  scope: ScopeDimension;
};
```

Behavior bat buoc:
- Active delegation la delegation `active=true`, trong validity window, actor la `delegateUserId`, principal dung `principalUserId`, action nam trong `actionKeys`, scope match target.
- Empty scope khong mac dinh thanh full access tru khi service/validation co y dinh global ro rang va action do an toan.
- Delegation khong duoc cap approval/admin/export-sensitive mac dinh. Dung deny-list tu `BUSINESS_APPROVAL_PERMISSIONS` va cac admin permissions nhay cam.
- On-behalf proposal: `requestedBy` nen la principal business owner, `submittedBy` la actor thuc te, `onBehalfOf` la principal, `delegationId` la source config.
- Direct proposal cu: `requestedBy = submittedBy = actor.id`, `onBehalfOf` undefined.

### Ngu Canh Story Truoc

Story 1.3 da done va de lai cac pattern can giu:
- Settings service/repository/actions/test theo contract mock + Supabase parity.
- Policy settings panel da co submit pending state va disable confirmation pattern qua `PolicySubmitButton`.
- Proposal submit da dung `resolveApprovalPolicyForProposal`; Story 1.4 khong duoc pha routing policy nay.
- Admin khong duoc nhan business approval permissions; seed co guard xoa approval permissions khoi role `admin`.
- Review findings Story 1.3 da nhan manh validation khi re-enable, deny-list, RLS read/write va audit old/new; delegation can co test tuong tu cho enable/disable va action deny-list.

### Ngu Canh Git / Worktree

Recent commit `484589a 2205`. Worktree hien dang dirty voi nhieu file do cac story truoc tao/cap nhat, bao gom settings, permissions, proposals, executive, workspaces, meetings, database migrations va tests. Dev agent khong duoc revert thay doi khong phai cua minh; neu cham file dirty, doc current content va preserve thay doi hien co.

### Thong Tin Ky Thuat Moi Nhat

- Repo resolve hien tai: `next@15.5.18`, `react@19.2.6`, `react-dom@19.2.6`, `@supabase/supabase-js@2.105.4`, `zod@3.25.76`. Khong upgrade dependency trong story nay.
- Next.js App Router ho tro Server Actions/Server Functions cho form mutation va `revalidatePath` sau update. Giu pattern action -> service -> audit -> revalidate/redirect. Source: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- React `useActionState` co the dung voi Server Functions khi can pending/error state serializable; story nay co the tiep tuc dung server forms don gian hoac client submit button pattern hien co. Source: https://react.dev/reference/react/useActionState
- Supabase RLS dung policy `using`/`with check`; van phai co app-level permission check truoc mutation. Source: https://supabase.com/docs/guides/database/postgres/row-level-security
- Zod tiep tuc ho tro parse/refine/superRefine; giu schema validation o boundary va lookup async trong service. Source: https://zod.dev/packages/zod

## File Targets

Expected ADD:
- `src/modules/settings/services/leadership-delegation-service.ts`
- `src/modules/settings/services/leadership-delegation-repository.ts`
- `src/modules/settings/components/leadership-delegation-panel.tsx`
- `tests/unit/leadership-delegation-service.test.ts`
- `database/migrations/202605240001_create_leadership_delegations.sql`
- `database/verification/005_leadership_delegations_rls.sql`

Expected UPDATE:
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/app/(dashboard)/settings/page.tsx`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/guard.ts` neu them `requireAnyPermission`
- `src/lib/permissions/navigation.ts`
- `src/modules/proposals/types.ts`
- `src/modules/proposals/validation.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/actions.ts`
- `src/modules/proposals/components/proposal-form.tsx` neu UI on-behalf duoc expose trong create flow
- `src/modules/proposals/components/proposal-detail.tsx` neu can hien submittedBy/onBehalfOf va hide action on-behalf
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `database/seeds/001_roles_permissions.sql`
- `database/verification/README.md`
- `tests/unit/settings-actions.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/workspaces.test.ts` hoac `tests/unit/access-scope.test.ts`
- `tests/e2e/mvp-smoke.spec.ts` neu UI route thay doi

Avoid:
- Khong them business approval permissions vao `thu_ky_tro_ly` de dat AC2.
- Khong cho delegation cap `proposal.approve`, `proposal.reject`, `proposal.request_change` hoac bat ky approval/admin action nhay cam.
- Khong coi delegation nhu scope assignment; scope assignment la RBAC grant, delegation la on-behalf relationship co principal/delegate.
- Khong tao approval flow moi ngoai Proposal/Approval backbone.
- Khong goi repository/Supabase truc tiep tu component/page.
- Khong xay full Secretary Workspace, Meeting Engine, Risk CRUD hay notification escalation trong story nay.
- Khong render role catalog/policy/source registry cho user chi co `delegation.manage`.

## Tham Chieu

- `_bmad-output/planning-artifacts/epics.md#Story 1.4`
- `_bmad-output/planning-artifacts/epics.md#Story 1.5`
- `_bmad-output/planning-artifacts/epics.md#Story 2.6`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#7.12. Thư Ký / Trợ Lý`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-097`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-098`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-099`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-100`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-101`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Permission / 403`
- `_bmad-output/implementation-artifacts/1-3-policy-co-ban-cho-nguong-duyet-tien-va-nhom-risk.md`
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/services/scope-assignment-service.ts`
- `src/modules/settings/services/policy-settings-service.ts`
- `src/app/(dashboard)/settings/page.tsx`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/guard.ts`
- `src/lib/permissions/navigation.ts`
- `src/modules/proposals/types.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/actions.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `src/modules/workspaces/types.ts`
- `database/migrations/202605230003_create_scope_assignments.sql`
- `database/migrations/202605230004_create_policy_settings.sql`
- `database/seeds/001_roles_permissions.sql`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/settings-actions.test.ts`
- `tests/unit/access-scope.test.ts`

## Ghi Chu Kiem Tra

- Checklist pass: story co AC ro, scope duoc gioi han, current code state, file targets, architecture/UX guardrails, previous-story intelligence, data contract, Supabase/RLS direction, test plan va latest tech notes.
- Rui ro chinh: neu implement `delegation.manage` ma relax `/settings` guard khong dung cach, co the lo role/policy/source registry cho lanh dao chi co delegation permission. Bat buoc render theo permission tung panel.
- Rui ro thu hai: neu dev cho delegation add vao `PermissionUser.permissions`, can exclude approval/admin deny-list o helper do, khong chi o UI.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

- Implemented leadership delegation domain, validation, JSON/Supabase repositories, service resolution and audit snapshots.
- Added `delegation.manage`, settings route guard/navigation support, and a settings panel that exposes only delegation controls for delegation-only users.
- Integrated proposal create/submit on-behalf while preserving actor/principal/delegation metadata and blocking delegated approve/reject/request-change in MVP.
- Added assistant/workspace delegation metadata foundation through active delegation loading and summary output.
- Added Supabase migration/RLS/verification for `leadership_delegations` and seed support for `delegation.manage`.
- Verification run: `npm run typecheck`, `npm run lint`, `npm run test` all passed. `npm run test:e2e` passed 26/27 on the last run; `/settings` passed, remaining failure was a Playwright timeout while compiling `/projects/[projectId]` in an existing contractor isolation smoke path, with no failed functional assertion.

### File List

- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/services/leadership-delegation-repository.ts`
- `src/modules/settings/services/leadership-delegation-service.ts`
- `src/modules/settings/components/leadership-delegation-panel.tsx`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/guard.ts`
- `src/lib/permissions/navigation.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/proposals/new/page.tsx`
- `src/app/(dashboard)/proposals/[proposalId]/page.tsx`
- `src/modules/proposals/types.ts`
- `src/modules/proposals/validation.ts`
- `src/modules/proposals/actions.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/components/proposal-form.tsx`
- `src/modules/proposals/components/proposal-detail.tsx`
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `database/seeds/001_roles_permissions.sql`
- `database/migrations/202605240001_create_leadership_delegations.sql`
- `database/verification/005_leadership_delegations_rls.sql`
- `database/verification/README.md`
- `tests/unit/leadership-delegation-service.test.ts`
- `tests/unit/settings-actions.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/workspaces.test.ts`
