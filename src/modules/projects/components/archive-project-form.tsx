"use client";

import { Archive } from "lucide-react";

import { Button } from "@/components/ui/button";

type ArchiveProjectFormProps = {
  action: () => void | Promise<void>;
};

export function ArchiveProjectForm({ action }: ArchiveProjectFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Lưu trữ dự án này? Dữ liệu sẽ không bị xóa cứng.")) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="outline">
        <Archive className="h-4 w-4" aria-hidden="true" />
        Lưu trữ
      </Button>
    </form>
  );
}
