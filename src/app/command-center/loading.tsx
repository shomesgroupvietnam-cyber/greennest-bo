import React from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { HistoryArchiveCenterSkeleton } from "@/modules/reports/components/history-archive-center";

export default function CommandCenterLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-5">
        <LoadingState
          description="Đang tải dashboard và lịch sử trong phạm vi hiện tại."
          title="Đang tải Trung Tâm Điều Hành"
        />
        <HistoryArchiveCenterSkeleton />
      </div>
    </main>
  );
}
