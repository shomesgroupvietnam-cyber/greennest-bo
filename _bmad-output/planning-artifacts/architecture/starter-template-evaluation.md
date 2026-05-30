# Starter Template Evaluation

## Primary Technology Domain

Full-stack enterprise web application trên Next.js App Router + TypeScript modular monolith. Dự án hiện là brownfield repo đã có cấu trúc Next.js, Tailwind, shadcn/ui, Supabase-ready auth/database, service/repository boundary và test stack.

## Starter Options Considered

**Next.js create-next-app**
Phù hợp nhất cho nền tảng App Router, TypeScript, Tailwind, ESLint và alias. Đây là baseline tương thích với repo hiện tại, nhưng không nên scaffold lại vì dự án đã tồn tại.

**Supabase with-supabase template**
Phù hợp cho dự án mới cần cookie-based auth, TypeScript và Tailwind với Supabase. Repo hiện tại đã có Supabase abstraction, migrations, RLS assets và staging validation assets, nên chỉ dùng làm tham chiếu, không thay thế cấu trúc hiện có.

**shadcn/ui CLI**
Phù hợp để bổ sung component vào existing project. Repo đã có `components.json`, style `new-york`, RSC, TSX, Tailwind config và alias. Tiếp tục dùng shadcn CLI để thêm component foundation khi cần.

**Create T3 App**
Có giá trị cho greenfield app cần tRPC/Prisma/Drizzle/NextAuth. Không chọn vì repo đã định hướng Supabase, Server Actions/service layer và không cần tRPC.

**Turborepo**
Có giá trị khi tách monorepo nhiều app/package. Không chọn cho giai đoạn này vì architecture đã chốt modular monolith, chưa có nhu cầu monorepo.

## Selected Starter: Existing Next.js App Router Brownfield Baseline

**Rationale for Selection:**
Không scaffold lại. Tiếp tục trên repo hiện tại là lựa chọn đúng vì nền tảng đã khớp với yêu cầu: Next.js App Router, TypeScript strict, Tailwind/shadcn-ready UI, Supabase-ready persistence, RBAC/permission helpers, module boundaries, Vitest, Playwright và Vercel deployment direction.

**Initialization Command:**

```bash
# Không áp dụng cho repo hiện tại.
# Nếu tạo greenfield repo tương đương từ đầu, baseline tham chiếu là:
pnpm create next-app [project-name]
pnpm dlx shadcn@latest init
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript strict, React, Next.js App Router, Node-based full-stack runtime.

**Styling Solution:**
Tailwind CSS, shadcn/ui, Radix primitives, lucide-react, CSS variables và component alias.

**Build Tooling:**
Next.js build/dev pipeline, ESLint, TypeScript compiler checks, Vercel-compatible deployment.

**Testing Framework:**
Vitest cho unit tests, Testing Library cho component behavior, Playwright cho e2e smoke tests.

**Code Organization:**
Giữ modular monolith: `src/modules/*` cho domain modules; `src/lib/*` cho auth, permissions, db, storage, audit; `src/components/*` cho shared UI/layout; `database/*` cho schema, migrations, policies, seeds, verification.

**Development Experience:**
Dùng scripts hiện có: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`. Feature mới phải giữ mock/file-backed mode và Supabase-ready repository boundary trừ khi story chốt production-only.

**Note:** Không tạo implementation story để initialize project. Story đầu tiên sau architecture nên tập trung vào hardening/expanding architecture trên repo hiện có.
