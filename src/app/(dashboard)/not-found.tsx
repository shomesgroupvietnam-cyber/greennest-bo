import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <section className="rounded-lg border border-dashed bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-950">Không tìm thấy dữ liệu</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
        Bản ghi có thể đã bị lưu trữ, bị xóa trong dữ liệu mô phỏng hoặc đường dẫn không còn hợp lệ.
      </p>
      <Button asChild className="mt-4" variant="outline">
        <Link href="/dashboard">Về dashboard</Link>
      </Button>
    </section>
  );
}
