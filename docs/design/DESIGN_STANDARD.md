# Design Standard

## 1. Purpose

This document defines the finalized product design standard for GreenNest BuildFlow.

The root `design.md` remains an MVP snapshot. This file should guide future UI and UX work.

## 2. Product Design Direction

GreenNest BuildFlow is an operational business application, not a marketing website.

The UI should feel:

- Clear.
- Dense but organized.
- Professional.
- Vietnamese-first.
- Built for repeated daily use.
- Role-aware.
- Decision-support oriented.

Avoid:

- Landing-page layouts inside the app.
- Decorative hero sections.
- Overly large cards.
- One-size-fits-all dashboards.
- Generic AI chat as the only AI interface.

## 3. Role-first UX

Every user should land on a workspace matching their role.

Canonical source:

- `blueprint/13-role-workspaces.md`

Examples:

- Admin: users, settings, audit, role management.
- Tổng giám đốc/Phó tổng giám đốc: portfolio health, blockers, decisions.
- PM/Giám đốc dự án: project workbench and delivery risks.
- Tổ trưởng: team tasks and package execution.
- Kế toán: finance/payment readiness.
- Thiết kế: design packages and drawing issues.
- Pháp lý: legal checklist and legal documents.
- Nhà thầu: assigned tasks/documents/packages only.
- Viewer: read-only summaries.

## 4. Navigation Standard

Navigation must be permission-aware.

Rules:

- Do not show modules the user cannot access.
- Do not show mutation actions the user cannot perform.
- Direct URL access must still be guarded.
- External users should not see internal portfolio navigation.

Navigation should use:

- Sidebar on desktop.
- Mobile navigation/drawer on smaller screens.
- Clear module labels in Vietnamese.
- Role workspace link near the top.

## 5. Page Pattern

Standard operational page:

```text
Page title + short context
Primary action if permitted
Filters/search
Main table/list
Empty/loading/error/unauthorized states
```

Standard detail page:

```text
Header summary
Status badges
Primary actions if permitted
Related records
Audit/activity if available
Linked documents/tasks/decisions
```

## 6. Dashboard Standard

Dashboards must be data-driven.

Rules:

- No hardcoded metrics in UI components.
- Metrics come from services/repositories.
- Every KPI should link to filtered source data where practical.
- Dashboard must respect role and scope.
- External roles get limited dashboard views.

## 7. AI UX Standard

AI should appear inside modules as contextual actions.

Canonical AI/RAG/MCP rules live in `blueprint/14-ai-assistant-strategy.md`. This section only defines UX expectations.

Examples:

- Legal: `AI kiểm tra hồ sơ`, `AI tóm tắt văn bản`, `AI gợi ý bước tiếp theo`.
- Documents: `AI kiểm tra hồ sơ thiếu`, `AI so khớp yêu cầu`.
- Meetings: `AI tóm tắt biên bản`, `AI trích action items`.
- Reports: `AI draft báo cáo`.
- Design: `AI kiểm tra chỉ tiêu`.
- Construction: `AI gợi ý checklist nghiệm thu`.

AI output must show:

- Source/citation.
- Confidence or caveat for sensitive domains.
- Clear action proposal if mutation is possible.
- Human confirmation before data changes.

### AI and Knowledge Promotion UX

AI, search and upload experiences must make the difference between working context and governed knowledge visible.

`Submit as Knowledge Candidate`:

- Use on AI outputs, search results, uploads, document records or meeting notes that may become reusable knowledge.
- Present it as a secondary action, not as approval.
- Open a short metadata form for module, source type, tags, jurisdiction/effective date where relevant and notes.
- Confirm that the item will enter review and is not yet authoritative.

`Promote to Knowledge`:

- Show only to users with Knowledge review/promotion permission.
- Display source provenance, retrieved/uploaded date, summary, confidence and module mapping before promotion.
- Require reviewer confirmation that the source is relevant enough to enter Knowledge Center review.
- Move promoted items into review/pending state, not directly into authoritative RAG.

`AI answer with citations`:

- Show citations close to the answer, with clear labels for internal records and approved Knowledge Center items.
- Label review-mode candidate citations as unapproved and never mix them with authoritative citations.
- Show when the answer is limited by permissions, missing data or outdated sources.
- For legal, finance, design and construction quality content, citations are required.

`Human-confirmed AI action`:

- AI may draft or propose an action, but the UI must show a preview before mutation.
- The preview should list affected records, proposed field changes and required permission.
- The confirm button must be explicit, such as `Xac nhan tao cong viec` or `Xac nhan cap nhat trang thai`.
- If the user lacks permission, show a friendly denial and do not show the final mutation button.
- The review screen must show proposal status: `proposed`, `accepted`, `rejected`, `executed`, `failed` or `expired`.
- Rejecting a proposal should ask for an optional reason and must clearly say no business record will be changed.
- Accepting a proposal should show the domain action that will run, such as creating a task or requesting a document update.
- If execution fails, show the failure reason and keep the original proposal visible for audit.
- External users should see only proposals within their assigned scope.

## 8. Status and Badge Rules

Use badges for:

- Project status.
- Task status.
- Document status.
- Approval status.
- Legal status.
- Report type/status.

Badges must include text, not only color.

Color meaning:

- Green: complete/approved/healthy.
- Yellow: in progress/waiting.
- Red: blocked/rejected/overdue/risk.
- Gray: not started/archived/neutral.

## 9. Form Rules

Forms must:

- Use Vietnamese labels.
- Show required fields clearly.
- Validate before submission where possible.
- Show inline validation errors.
- Preserve user input when validation fails where practical.
- Explain permission denial in friendly language.

## 10. Table/List Rules

Operational lists should include:

- Search if records can grow.
- Filters for status/project/owner where relevant.
- Sort or grouped status where useful.
- Empty state with next action if permitted.
- Row actions hidden if user lacks permission.

## 11. External User UX

Contractors/consultants must see a limited portal experience.

Rules:

- No internal dashboard.
- No global project portfolio.
- No finance/legal internal data.
- Only assigned records.
- Clear upload/submission requirements.
- Clear rejection/needs-update reasons.

## 12. Responsive Standard

Desktop is the primary working surface.

Mobile must support:

- Review dashboard/workspace.
- Update task.
- Check document/legal status.
- Open assigned items.
- Contractor quick updates.

Avoid mobile layouts that require wide tables without alternatives.
