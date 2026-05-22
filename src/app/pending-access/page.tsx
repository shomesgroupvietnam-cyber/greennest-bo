import { redirect } from "next/navigation";

import { LogoutForm } from "@/components/layout/logout-form";
import { getCurrentSession } from "@/lib/auth/session";

export default async function PendingAccessPage() {
  const session = await getCurrentSession();

  if (!session.isAuthenticated) {
    redirect("/login?entry=1");
  }

  if (session.user.status === "active" && session.user.role !== "pending") {
    redirect(session.defaultScreen.href);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              GreenNest BuildFlow
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Chờ cấp quyền
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Tài khoản đã đăng nhập nhưng chưa được Admin cấp quyền truy cập.
              Theo mô hình phân quyền mới, người dùng mặc định không nhìn thấy
              module nào cho đến khi được gán vai trò, workspace hoặc dự án phù
              hợp.
            </p>
          </div>
          <LogoutForm />
        </div>

        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="font-semibold text-slate-950">Email</dt>
            <dd className="mt-1 text-slate-600">{session.user.email || "-"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="font-semibold text-slate-950">Vai trò</dt>
            <dd className="mt-1 text-slate-600">{session.user.role}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="font-semibold text-slate-950">Trạng thái</dt>
            <dd className="mt-1 text-slate-600">{session.user.status}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
