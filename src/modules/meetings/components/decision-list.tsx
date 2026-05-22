import { CheckSquare } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { convertDecisionToTaskAction } from "@/modules/meetings/actions";
import type { Decision } from "@/modules/meetings/types";

import { DecisionStatusBadge } from "./decision-status-badge";

type DecisionListProps = {
  canConvertToTask?: boolean;
  decisions: Decision[];
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
}

export function DecisionList({ canConvertToTask = true, decisions }: DecisionListProps) {
  if (decisions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-5 text-sm text-slate-600">
        Chưa có quyết định hoặc action item nào được ghi nhận cho cuộc họp này.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border bg-white">
      {decisions.map((decision) => {
        const convertAction = convertDecisionToTaskAction.bind(null, decision.id);

        return (
          <div className="flex flex-wrap items-start justify-between gap-3 p-4" key={decision.id}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-950">{decision.decisionText}</p>
              <p className="mt-1 text-xs text-slate-500">
                Phụ trách: {decision.ownerId ?? "-"} · Hạn: {formatDate(decision.dueDate)}
              </p>
              {decision.taskId ? (
                <Link className="mt-2 inline-flex text-xs font-medium text-emerald-700 hover:text-emerald-800" href={`/tasks/${decision.taskId}`}>
                  Đã chuyển thành công việc
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <DecisionStatusBadge status={decision.status} />
              {canConvertToTask && !decision.taskId ? (
                <form action={convertAction}>
                  <Button size="sm" type="submit" variant="outline">
                    <CheckSquare className="h-4 w-4" aria-hidden="true" />
                    Tạo task
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
