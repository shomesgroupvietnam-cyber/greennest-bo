## Deferred from: code review of 1-1-role-template-va-permission-catalog-cho-module-1 (2026-05-23)

- Define the missing "chuyen cap" permission action. Reason: deferred to approval-center/approval workflow story because escalation needs workflow state, target approver, audit, and UX semantics before a stable permission key is safe.

## Deferred from: code review of 1-3-policy-co-ban-cho-nguong-duyet-tien-va-nhom-risk (2026-05-23)

- Approval policy metadata is stored on proposal steps but approve/reject/change decisions still use hard-coded permissions. Reason: full enforcement semantics for approver role, required permission, escalation override, and audit belong to approval-center workflow hardening in Story 3.x.
- Axis 1 scoped risk alerts are filtered by alert id instead of stage id. Reason: scoped Axis 1 command-center behavior is outside Story 1.3 policy settings and should be handled with the Axis 1 scope follow-up.
- Role-level Axis 1 access is dropped when no scope assignment exists. Reason: this belongs to Story 1.2 scoped access semantics, where the product needs to decide whether role-level grants remain global fallback or all Axis 1 access must be assignment-backed.

## Deferred from: code review of 3-4-approval-history-version-va-audit (2026-05-29)

- Delegated proposal creation bypasses domain-specific create guards in `createProposal`; delegated creates should either always enforce `assertDomainCreatePermission` or validate delegated domain authority for the proposal type/module.
- Approval action writes can be stale under concurrent approvers because `applyApprovalMutation` applies a precomputed mutation without rechecking expected proposal/current-step state at write time; a later approval workflow hardening pass should add transactional compare-and-set semantics.
