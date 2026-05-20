import Link from "next/link";

import { Button } from "@/components/ui/button";
import { REPORT_TYPES, type ReportRun } from "@/modules/reports/types";

type ReportDetailProps = {
  report: ReportRun;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function shortDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

export function ReportDetail({ report }: ReportDetailProps) {
  const snapshot = report.snapshot;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{REPORT_TYPES[report.reportType]}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{report.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Snapshot: {formatDate(report.generatedAt)} · Người tạo: {report.generatedBy}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button asChild variant="outline">
              <Link href={`/projects/${report.projectId}`}>Mở dự án</Link>
            </Button>
            <Button variant="outline" type="button">
              Xuất PDF/DOCX sau
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Việc quá hạn</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{snapshot.summary.overdueTasks}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Hồ sơ thiếu/cần cập nhật</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {snapshot.summary.missingDocuments + snapshot.summary.needsUpdateDocuments + snapshot.summary.rejectedDocuments}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sẵn sàng hồ sơ</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{snapshot.summary.documentReadinessRatio}%</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pháp lý vướng/chờ</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {snapshot.summary.blockedLegalSteps + snapshot.summary.waitingAuthorityLegalSteps}
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Tóm tắt dự án</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Mã dự án</dt>
            <dd className="mt-1 text-sm font-medium text-slate-950">{snapshot.project.code}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Tên dự án</dt>
            <dd className="mt-1 text-sm font-medium text-slate-950">{snapshot.project.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Loại hình</dt>
            <dd className="mt-1 text-sm font-medium text-slate-950">{snapshot.project.projectType ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Trạng thái</dt>
            <dd className="mt-1 text-sm font-medium text-slate-950">{snapshot.project.status}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Việc quá hạn / sắp đến hạn</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {[...snapshot.tasks.overdue, ...snapshot.tasks.upcoming].slice(0, 8).map((task) => (
              <div className="py-3" key={task.id}>
                <p className="text-sm font-medium text-slate-950">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Hạn: {shortDate(task.dueDate)} · Trạng thái: {task.status} · Phụ trách: {task.assigneeId ?? "-"}
                </p>
              </div>
            ))}
            {snapshot.tasks.overdue.length + snapshot.tasks.upcoming.length === 0 ? (
              <p className="py-3 text-sm text-slate-600">Không có việc quá hạn hoặc sắp đến hạn trong snapshot.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Hồ sơ cần xử lý</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {snapshot.documents.rejectedOrNeedsUpdateRecords.slice(0, 8).map((document) => (
              <div className="py-3" key={document.id}>
                <p className="text-sm font-medium text-slate-950">{document.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Loại: {document.docType} · Phiên bản: {document.version} · Trạng thái: {document.status}/{document.approvalStatus ?? "-"}
                </p>
              </div>
            ))}
            {snapshot.documents.rejectedOrNeedsUpdateRecords.length === 0 ? (
              <p className="py-3 text-sm text-slate-600">Không có hồ sơ thiếu, cần cập nhật hoặc bị yêu cầu cập nhật.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Pháp lý vướng/chờ cơ quan</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {[...snapshot.legal.blocked, ...snapshot.legal.waitingAuthority].slice(0, 8).map((step) => (
              <div className="py-3" key={step.id}>
                <p className="text-sm font-medium text-slate-950">{step.stepName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Trạng thái: {step.status} · Hạn: {shortDate(step.dueDate)} · Phụ trách: {step.assigneeId ?? "-"}
                </p>
              </div>
            ))}
            {snapshot.legal.blocked.length + snapshot.legal.waitingAuthority.length === 0 ? (
              <p className="py-3 text-sm text-slate-600">Không có bước pháp lý vướng/chờ cơ quan.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Cuộc họp và action item</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {snapshot.meetings.slice(0, 6).map((meeting) => (
              <div className="py-3" key={meeting.id}>
                <p className="text-sm font-medium text-slate-950">{meeting.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(meeting.meetingDate)} · {meeting.decisions.filter((decision) => decision.status !== "done").length} action item chưa xong
                </p>
              </div>
            ))}
            {snapshot.meetings.length === 0 ? <p className="py-3 text-sm text-slate-600">Chưa có cuộc họp trong snapshot.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-dashed bg-white p-5 text-sm text-slate-600">
        Export PDF/DOCX chưa triển khai trong Reporting Lite. Trang này được thiết kế để in trình duyệt bằng lệnh Print.
      </section>
    </div>
  );
}
