import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { createKnowledgeItemAction } from "@/modules/knowledge/actions";
import { KnowledgeForm } from "@/modules/knowledge/components/knowledge-form";

export default async function NewKnowledgePage() {
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "knowledge.create")) {
    return (
      <PageShell title="Không có quyền thêm nguồn" description="Vai trò hiện tại không được nhập nguồn tri thức mới.">
        <UnauthorizedState backHref="/knowledge" backLabel="Về Knowledge Center" title="Bạn không có quyền thêm nguồn tri thức" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Thêm nguồn tri thức" description="Nhập nguồn pháp lý, thiết kế, thi công, tài chính, hồ sơ hoặc báo cáo để đưa vào quy trình review.">
      <Button asChild variant="ghost">
        <Link href="/knowledge">Knowledge Center</Link>
      </Button>
      <KnowledgeForm action={createKnowledgeItemAction} submitLabel="Thêm nguồn tri thức" />
    </PageShell>
  );
}
