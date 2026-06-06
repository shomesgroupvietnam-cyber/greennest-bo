import { PageShell } from "@/components/shared/page-shell";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { AiAskForm } from "@/modules/ai/components/ai-ask-form";
import { AiFutureFeaturePlaceholders } from "@/modules/ai/components/ai-future-feature-placeholders";

export default async function AiAssistantPage() {
  const session = await requirePermission("ai.ask", { route: "/ai" });
  const currentUser = session.user;

  const projects = can(currentUser, "project.view") ? await listScopedProjects(currentUser) : [];

  return (
    <PageShell
      title="Trợ lý AI"
      description="Hỏi nhanh theo vai trò, nhận kết quả có nguồn tham chiếu và chỉ tạo đề xuất khi bạn yêu cầu. AI không tự động thay đổi dữ liệu nghiệp vụ."
    >
      <AiAskForm projects={projects} canUseRag={can(currentUser, "ai.use_rag")} />
      <div className="mt-5">
        <AiFutureFeaturePlaceholders />
      </div>
    </PageShell>
  );
}
