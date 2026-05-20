import { Activity, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ProviderHealthCheckResult } from "@/modules/settings/services/provider-health-service";

export function ProviderHealthPanel({ results, checked }: { results: ProviderHealthCheckResult[]; checked: boolean }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Activity className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            Provider health-check
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Kiểm tra nhanh AI provider, embedding provider và Web Search provider bằng cấu hình môi trường hiện tại. Kết quả chỉ hiển thị trạng thái, không hiển thị API key.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings?checkProviders=1">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Kiểm tra provider
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {results.map((result) => (
          <article className="rounded-md border bg-slate-50 p-4 text-sm" key={result.key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">{result.label}</h3>
                <p className="mt-1 text-slate-600">{result.provider}</p>
                {result.model ? <p className="mt-1 text-xs text-slate-500">Model: {result.model}</p> : null}
              </div>
              <span className={getStatusClassName(result.status)}>{getStatusLabel(result.status)}</span>
            </div>
            <p className="mt-3 leading-6 text-slate-700">{result.message}</p>
            {result.errorCode ? <p className="mt-2 text-xs text-slate-500">Mã lỗi: {result.errorCode}</p> : null}
            <p className="mt-2 text-xs text-slate-500">
              {checked && result.checkedAt
                ? `Lần kiểm tra: ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(result.checkedAt))}`
                : "Chưa có kết quả kiểm tra live."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getStatusLabel(status: ProviderHealthCheckResult["status"]) {
  if (status === "ok") {
    return "Sẵn sàng";
  }

  if (status === "warning") {
    return "Cần chú ý";
  }

  if (status === "error") {
    return "Lỗi";
  }

  return "Chưa kiểm tra";
}

function getStatusClassName(status: ProviderHealthCheckResult["status"]) {
  if (status === "ok") {
    return "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "warning") {
    return "rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200";
  }

  if (status === "error") {
    return "rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200";
  }

  return "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200";
}
