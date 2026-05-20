import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { AiAskForm } from "@/modules/ai/components/ai-ask-form";

export default async function AiAssistantPage() {
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "ai.ask")) {
    return (
      <PageShell title="Trợ lý AI">
        <UnauthorizedState description="Vai trò hiện tại không có quyền gửi câu hỏi AI." />
      </PageShell>
    );
  }

  const projects = can(currentUser, "project.view") ? await listScopedProjects(currentUser) : [];

  return (
    <PageShell
      title="Trợ lý AI"
      description="Hỏi nhanh theo vai trò, nhận kết quả có nguồn tham chiếu và chỉ tạo đề xuất khi bạn yêu cầu. AI không tự động thay đổi dữ liệu nghiệp vụ."
    >
      <AiAskForm projects={projects} canUseRag={can(currentUser, "ai.use_rag")} />
    </PageShell>
  );
}
