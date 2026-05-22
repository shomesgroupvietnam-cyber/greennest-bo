import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-lg border bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase text-red-600">
          403 Forbidden
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">
          Bạn không có quyền truy cập
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Module hoặc dữ liệu này không thuộc phạm vi quyền được cấp. Hệ thống
          đã ghi nhận lượt truy cập bị từ chối để phục vụ kiểm soát nội bộ.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          href="/dashboard"
        >
          Về vùng làm việc chung
        </Link>
      </section>
    </main>
  );
}
