import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import type { RoleWorkspaceData } from "@/modules/workspaces/types";

function itemToneClass(tone?: "default" | "danger" | "warning") {
  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-white text-slate-900";
}

export function UnauthorizedWorkspace({ defaultHref }: { defaultHref: string }) {
  return (
    <PageShell title="Không có quyền truy cập" description="Vai trò hiện tại không được mở không gian làm việc này.">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Hệ thống đã chặn truy cập trực tiếp để tránh hiển thị sai dữ liệu hoặc sai phạm vi công việc.
        </p>
        <Link
          href={defaultHref}
          className="mt-4 inline-flex rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Về màn hình mặc định
        </Link>
      </div>
    </PageShell>
  );
}

export function RoleWorkspaceShell({ data }: { data: RoleWorkspaceData }) {
  return (
    <PageShell title={data.definition.title} description={data.definition.description}>
      {data.definition.futureNote ? (
        <section className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          {data.definition.futureNote}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => {
          const content = (
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{kpi.value}</p>
            </div>
          );

          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className="block hover:opacity-90">
              {content}
            </Link>
          ) : (
            <div key={kpi.label}>{content}</div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Hàng chờ ưu tiên</h2>
            <Link href="/tasks" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              Xem công việc
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.actionItems.length > 0 ? (
              data.actionItems.map((item) => {
                const body = (
                  <div className={`rounded-md border p-3 ${itemToneClass(item.tone)}`}>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs opacity-80">{item.meta}</p>
                  </div>
                );

                return item.href ? (
                  <Link href={item.href} key={`${item.title}-${item.meta}`} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={`${item.title}-${item.meta}`}>{body}</div>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed p-5 text-sm text-slate-500">
                Chưa có việc, hồ sơ hoặc pháp lý cần xử lý trong phạm vi hiện tại.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Phạm vi dữ liệu</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Dự án</dt>
              <dd className="font-semibold text-slate-950">{data.scoped.projects.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Công việc</dt>
              <dd className="font-semibold text-slate-950">{data.scoped.tasks.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Hồ sơ</dt>
              <dd className="font-semibold text-slate-950">{data.scoped.documents.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Pháp lý</dt>
              <dd className="font-semibold text-slate-950">{data.scoped.legalSteps.length}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            Dữ liệu hiển thị dựa trên quyền trung tâm và phạm vi gán trong mock data. Vai trò ngoài công ty chỉ thấy
            task/hồ sơ được gán trực tiếp.
          </div>
        </div>
      </section>
    </PageShell>
  );
}
