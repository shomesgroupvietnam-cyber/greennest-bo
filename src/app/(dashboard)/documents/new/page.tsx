import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { createDocumentAction } from "@/modules/documents/actions";
import { DocumentForm } from "@/modules/documents/components/document-form";

type NewDocumentPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const currentUser = await getCurrentUser();
  const canCreateDocument = can(currentUser, "document.create");
  const params = searchParams ? await searchParams : {};
  const defaultProjectId = readParam(params.projectId);
  const projects = await listScopedProjects(currentUser);

  return (
    <PageShell title="Tạo hồ sơ" description="Mỗi hồ sơ phải gắn với một dự án và có external URL nếu không đánh dấu là thiếu.">
      {!canCreateDocument ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">Bạn không có quyền tạo hồ sơ</h2>
          <p className="mt-2 text-sm text-slate-600">Vai trò hiện tại chỉ được xem tài liệu hoặc không có quyền Document Center.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/documents">Quay lại danh sách</Link>
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">Cần có dự án trước</h2>
          <p className="mt-2 text-sm text-slate-600">Tạo dự án trước khi thêm hồ sơ.</p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Tạo dự án</Link>
          </Button>
        </div>
      ) : (
        <DocumentForm
          action={createDocumentAction}
          defaultProjectId={defaultProjectId}
          projects={projects}
          submitLabel="Tạo hồ sơ"
        />
      )}
    </PageShell>
  );
}
