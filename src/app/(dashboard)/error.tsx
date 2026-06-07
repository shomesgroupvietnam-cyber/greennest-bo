"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const isPermissionError = error.message.toLowerCase().includes("quyền") || error.message.toLowerCase().includes("permission");

  return (
    <section className="rounded-lg border border-dashed bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-950">
        {isPermissionError ? "Bạn không có quyền thực hiện thao tác này" : "Không thể tải màn hình"}
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
        {isPermissionError
          ? "Hệ thống đã chặn thao tác theo phân quyền hiện tại. Hãy quay lại hoặc liên hệ quản trị hệ thống nếu cần thay đổi quyền."
          : "Đã có lỗi khi xử lý dữ liệu. Bạn có thể thử tải lại màn hình."}
      </p>
      <Button className="mt-4" onClick={reset} type="button">
        Thử lại
      </Button>
    </section>
  );
}
