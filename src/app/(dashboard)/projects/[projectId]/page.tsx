import { ArrowLeft, BarChart3, CalendarDays, ClipboardList, FileText, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import {
  getScopedProject,
  listScopedDocuments,
  listScopedDecisions,
  listScopedLegalSteps,
  listScopedMeetings,
  listScopedTasks
} from "@/lib/permissions/scoped-resources";
import { DOCUMENT_TYPES } from "@/modules/documents/constants";
import { DocumentStatusBadge } from "@/modules/documents/components/document-badges";
import { DocumentReadinessPanel } from "@/modules/documents/components/document-readiness-panel";
import { calculateProjectDocumentReadiness, listDocumentRequirements } from "@/modules/documents/services/document-readiness-service";
import { LegalStatusBadge } from "@/modules/legal/components/legal-status-badge";
import { archiveProjectAction } from "@/modules/projects/actions";
import { ArchiveProjectForm } from "@/modules/projects/components/archive-project-form";
import { ProjectStatusBadge } from "@/modules/projects/components/project-status-badge";
import { getProject } from "@/modules/projects/services/project-service";
import { TaskPriorityBadge, TaskStatusBadge } from "@/modules/tasks/components/task-badges";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDueDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(new Date(value));
}

function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES[value as keyof typeof DOCUMENT_TYPES] ?? value;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const currentUser = await getCurrentUser();
  const rawProject = await getProject(projectId);

  if (!rawProject) {
    notFound();
  }

  const project = await getScopedProject(currentUser, projectId);

  if (!project) {
    return (
      <PageShell title="Không có quyền truy cập" description="Dự án này không nằm trong phạm vi được giao của bạn.">
        <UnauthorizedState backHref="/projects" backLabel="Về danh sách dự án" title="Bạn không có quyền xem dự án này" />
      </PageShell>
    );
  }

  const [legalSteps, projectTasks, projectDocuments, projectMeetings, projectDecisions, documentRequirements] = await Promise.all([
    listScopedLegalSteps(currentUser, { projectId: project.id }),
    listScopedTasks(currentUser, { projectId: project.id }),
    listScopedDocuments(currentUser, { projectId: project.id }),
    listScopedMeetings(currentUser, { projectId: project.id }),
    listScopedDecisions(currentUser, { projectId: project.id }),
    can(currentUser, "document.view") ? listDocumentRequirements() : Promise.resolve([])
  ]);
  const canCreateTask = can(currentUser, "task.create");
  const canCreateDocument = can(currentUser, "document.create");
  const canCreateMeeting = can(currentUser, "meeting.create");
  const canCreateReport = can(currentUser, "report.create");
  const canViewReport = can(currentUser, "report.view");
  const canUpdateLegal = can(currentUser, "legal.update");
  const canUpdateProject = can(currentUser, "project.update", { id: project.id });
  const canArchiveProject = can(currentUser, "project.archive", { id: project.id });
  const archiveAction = archiveProjectAction.bind(null, project.id);
  const attentionDocuments = projectDocuments.filter(
    (document) => document.status === "missing" || document.status === "needs_update"
  );
  const blockedLegalSteps = legalSteps.filter((step) => step.status === "blocked");
  const waitingLegalSteps = legalSteps.filter((step) => step.status === "waiting_authority");
  const doneLegalSteps = legalSteps.filter((step) => step.status === "done");
  const documentReadiness = calculateProjectDocumentReadiness({
    project,
    requirements: documentRequirements,
    documents: projectDocuments,
    legalSteps
  });

  return (
    <PageShell title={project.name} description={`${project.code} · Hồ sơ dự án trung tâm`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Danh sách dự án
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {canCreateTask ? (
            <Button asChild variant="outline">
              <Link href={`/tasks/new?projectId=${project.id}`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tạo công việc
              </Link>
            </Button>
          ) : null}
          {canViewReport ? (
            <Button asChild variant="outline">
              <Link href={`/reports?projectId=${project.id}`}>
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Báo cáo
              </Link>
            </Button>
          ) : null}
          {canCreateReport ? (
            <Button asChild variant="outline">
              <Link href={`/reports/new?projectId=${project.id}`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tạo báo cáo
              </Link>
            </Button>
          ) : null}
          {canUpdateProject ? (
            <Button asChild variant="outline">
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Sửa dự án
              </Link>
            </Button>
          ) : null}
          {!project.archivedAt && canArchiveProject ? <ArchiveProjectForm action={archiveAction} /> : null}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-6">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Trạng thái</p>
          <div className="mt-2">
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Công việc</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{projectTasks.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Hồ sơ</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{projectDocuments.length}</p>
          {attentionDocuments.length > 0 ? (
            <p className="mt-1 text-xs font-medium text-amber-700">{attentionDocuments.length} cần xử lý</p>
          ) : null}
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Checklist pháp lý</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{doneLegalSteps.length}/{legalSteps.length}</p>
          {blockedLegalSteps.length > 0 ? (
            <p className="mt-1 text-xs font-medium text-red-700">{blockedLegalSteps.length} bị vướng</p>
          ) : null}
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Cập nhật gần nhất</p>
          <p className="mt-2 text-sm font-medium text-slate-950">{formatDate(project.updatedAt)}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Tổng quan</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Địa điểm</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{project.location ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Diện tích</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">
                  {project.area ? `${project.area.toLocaleString("vi-VN")} m2` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Loại hình</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{project.projectType ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Chủ đầu tư</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{project.investor ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Người phụ trách</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{project.ownerName ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Ngày tạo</dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">{formatDate(project.createdAt)}</dd>
              </div>
              {project.archivedAt ? (
                <div>
                  <dt className="text-sm text-slate-500">Ngày lưu trữ</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-950">{formatDate(project.archivedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {can(currentUser, "document.view") ? (
            <DocumentReadinessPanel canCreateDocument={canCreateDocument} compact readiness={documentReadiness} />
          ) : null}

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Công việc dự án</h2>
                <p className="mt-1 text-sm text-slate-600">Danh sách công việc đang gắn với dự án này.</p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/tasks?projectId=${project.id}`}>
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Xem tất cả
                </Link>
              </Button>
            </div>

            {projectTasks.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed p-4">
                <p className="text-sm font-medium text-slate-900">Chưa có công việc</p>
                <p className="mt-1 text-sm text-slate-500">Tạo công việc đầu tiên cho dự án này.</p>
                {canCreateTask ? (
                  <Button asChild className="mt-3" size="sm">
                    <Link href={`/tasks/new?projectId=${project.id}`}>Tạo công việc</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {projectTasks.slice(0, 5).map((task) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={task.id}>
                    <div>
                      <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/tasks/${task.id}`}>
                        {task.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        Deadline: {formatDueDate(task.dueDate)} · Phụ trách: {task.assigneeId ?? "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Hồ sơ dự án</h2>
                <p className="mt-1 text-sm text-slate-600">Tài liệu, phiên bản và trạng thái hồ sơ gắn với dự án này.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canCreateDocument ? (
                  <Button asChild variant="outline">
                    <Link href={`/documents/new?projectId=${project.id}`}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Tạo hồ sơ
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href={`/documents?projectId=${project.id}`}>
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Xem tất cả
                  </Link>
                </Button>
              </div>
            </div>

            {projectDocuments.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed p-4">
                <p className="text-sm font-medium text-slate-900">Chưa có hồ sơ</p>
                <p className="mt-1 text-sm text-slate-500">Thêm external URL hoặc đánh dấu hồ sơ còn thiếu cho dự án.</p>
                {canCreateDocument ? (
                  <Button asChild className="mt-3" size="sm">
                    <Link href={`/documents/new?projectId=${project.id}`}>Tạo hồ sơ</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {projectDocuments.slice(0, 5).map((document) => {
                  const requiresAttention = document.status === "missing" || document.status === "needs_update";

                  return (
                    <div
                      className={
                        requiresAttention
                          ? "flex flex-wrap items-center justify-between gap-3 bg-amber-50/50 px-3 py-3"
                          : "flex flex-wrap items-center justify-between gap-3 py-3"
                      }
                      key={document.id}
                    >
                      <div>
                        <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/documents/${document.id}`}>
                          {document.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {documentTypeLabel(document.docType)} · Phiên bản {document.version} · Phụ trách: {document.ownerId ?? "-"}
                        </p>
                        {requiresAttention ? <p className="mt-1 text-xs font-medium text-amber-700">Cần xử lý</p> : null}
                      </div>
                      <DocumentStatusBadge status={document.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Há»p vÃ  quyáº¿t Ä‘á»‹nh</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {projectMeetings.length} cuá»™c há»p, {projectDecisions.filter((decision) => decision.status !== "done").length} action item chÆ°a xong.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canCreateMeeting ? (
                  <Button asChild variant="outline">
                    <Link href={`/meetings/new?projectId=${project.id}`}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Táº¡o biÃªn báº£n
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href={`/meetings?projectId=${project.id}`}>
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Xem táº¥t cáº£
                  </Link>
                </Button>
              </div>
            </div>
            {projectMeetings.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-slate-600">
                ChÆ°a cÃ³ biÃªn báº£n há»p nÃ o cho dá»± Ã¡n nÃ y.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {projectMeetings.slice(0, 4).map((meeting) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={meeting.id}>
                    <div>
                      <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href={`/meetings/${meeting.id}`}>
                        {meeting.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(meeting.meetingDate)}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {projectDecisions.filter((decision) => decision.meetingId === meeting.id && decision.status !== "done").length} action item
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Pháp lý dự án</h2>
              <p className="mt-1 text-sm text-slate-600">
                {doneLegalSteps.length}/{legalSteps.length} bước hoàn thành, {blockedLegalSteps.length} bị vướng,{" "}
                {waitingLegalSteps.length} chờ cơ quan.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/legal?projectId=${project.id}`}>{canUpdateLegal ? "Cập nhật" : "Xem checklist"}</Link>
            </Button>
          </div>
          <ol className="mt-4 space-y-3">
            {legalSteps.map((step, index) => (
              <li className="flex gap-3" key={step.id}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-950">{step.stepName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <LegalStatusBadge status={step.status} />
                    {step.assigneeId ? <span className="text-xs text-slate-500">Phụ trách: {step.assigneeId}</span> : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </PageShell>
  );
}
