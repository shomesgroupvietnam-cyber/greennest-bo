"use client";

import React from "react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";

type CommandCenterErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CommandCenterError({ reset }: CommandCenterErrorProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ErrorState
        action={
          <>
            <Button onClick={reset} type="button">
              Thử lại
            </Button>
          </>
        }
        backHref="/command-center"
        backLabel="Về Trung Tâm Điều Hành"
        description="Có lỗi tạm thời khi tải dữ liệu điều hành. Thử lại hoặc quay về Trung Tâm Điều Hành."
        title="Không thể tải Trung Tâm Điều Hành"
      />
    </main>
  );
}
