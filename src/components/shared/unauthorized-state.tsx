import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

type UnauthorizedStateProps = {
  backHref?: string;
  backLabel?: string;
  description?: string;
  title?: string;
};

export function UnauthorizedState({
  backHref = "/dashboard",
  backLabel = "Về dashboard",
  description = "Vai trò hiện tại không có quyền thực hiện thao tác này. Nếu cần truy cập, hãy liên hệ quản trị hệ thống để điều chỉnh vai trò hoặc quyền dự án.",
  title = "Bạn không có quyền truy cập"
}: UnauthorizedStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p>
      <Button asChild className="mt-4" variant="outline">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
