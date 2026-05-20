import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-lg border border-dashed bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-600">Đường dẫn không còn hợp lệ hoặc bạn không có quyền truy cập nội dung này.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard">Về dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
