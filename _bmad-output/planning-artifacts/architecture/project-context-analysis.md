# Project Context Analysis

## Requirements Overview

**Functional Requirements:**
Dự án tập trung vào Module 1 - Lãnh đạo trong Trục 1, nhưng phải nằm trong kiến trúc mở cho 5 module Trục 1: Lãnh đạo, Tìm kiếm & phát triển dự án, Pháp lý, Thiết kế - Quy hoạch - Kỹ thuật - BIM, và Đề xuất - Họp - Phê duyệt nội bộ.

Các nhóm chức năng chính gồm executive dashboard, morning briefing, common center, private workspace, approval center, decision & assignment center, risk & alert center, one meeting engine, history/archive, executive AI center, BO settings tối thiểu và secretary/assistant workspace. Kiến trúc phải hỗ trợ drill-down từ KPI/risk/approval tới dữ liệu nguồn, xử lý approval/decision/audit, và giữ 12 bước pháp lý cũ như checklist/workflow bên trong 5 module thay vì 12 menu độc lập.

**Non-Functional Requirements:**
Các NFR chi phối kiến trúc gồm permission enforcement ở server/service layer, deny-by-default RBAC theo role + scope + action, 403 cho truy cập trực tiếp không hợp lệ, audit log cho mutation quan trọng, dữ liệu executive được filter trước khi trả UI, AI chạy trong permission context, meeting visibility theo RBAC/project/org/participant scope, và UI hỗ trợ multi-organization, multi-project, multi-role, multi-assignment.

**Scale & Complexity:**
- Primary domain: full-stack enterprise operational/project governance web application.
- Complexity level: enterprise.
- Estimated architectural components: 16-20 gồm app shell/workspaces, command center, executive, projects, axis-1, legal, documents, tasks, proposals/approvals, meetings/decisions, risks/alerts, dashboards/reports, permissions/auth, audit, AI/knowledge, repository/storage adapters.

## Technical Constraints & Dependencies

Nền kỹ thuật đã chốt là Next.js App Router + TypeScript modular monolith, Tailwind CSS + shadcn/ui + Radix + lucide-react, Zod, React Hook Form, Vitest, Testing Library, Playwright, Vercel + Supabase. Service/repository boundary phải giữ ổn định để chuyển giữa mock/file-backed mode và Supabase mode.

Kiến trúc hiện tại ưu tiên modular monolith, không tách microservices. Proposal/Internal Approval là workflow backbone dùng chung. AI dùng một Coordinator ban đầu, module AI chỉ là mode/retriever/tooling dưới Coordinator. Supabase RLS, Storage thật, proposal Supabase repository validation và configurable approval routing vẫn là gap/hardening.

## Cross-Cutting Concerns Identified

- Permission, scope filtering và 403 phải nhất quán trên route, server action, service, repository/RLS.
- Audit/history/versioning áp dụng cho approval, decision, risk, meeting, export, permission và AI-confirmed mutations.
- Proposal/approval phải là backbone dùng chung, không để mỗi module tự tạo approval flow riêng.
- Meeting phải dùng one meeting engine với nhiều meeting type, visibility và linkage tới project/axis/module/risk/task/decision/approval.
- Dashboard/KPI/risk/readiness phải derive từ structured records, không hardcode ở UI.
- UX phải role-first, dense but readable, Vietnamese-first, responsive, WCAG 2.1 AA, không dùng dashboard chung cho mọi vai trò.
- AI phải có citation, chỉ đọc dữ liệu được phép, action proposal cần human confirmation và domain permission re-check.
- Data model phải project-centric nhưng vẫn cho phép proposal/meeting/decision cấp tổ chức hoặc liên dự án.
- Kiến trúc phải không khóa cứng đúng 5 module vĩnh viễn, nhưng MVP chỉ expose 5 module Trục 1.
