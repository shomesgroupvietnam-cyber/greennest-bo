import { notFound } from "next/navigation";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { AiJobDetail } from "@/modules/ai/components/ai-job-detail";
import { formatAiProjectLabel } from "@/modules/ai/services/ai-proposal-presenter";
import { getAiJobResult } from "@/modules/ai/services/ai-gateway-service";
import { isTechnicalAiDetailAllowed } from "@/modules/ai/services/ai-ux-service";
import { projectRepository } from "@/modules/projects/services/project-repository";

type AiJobPageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function AiJobPage({ params }: AiJobPageProps) {
  const currentUser = await getCurrentUser();
  const { jobId } = await params;

  if (!can(currentUser, "ai.ask")) {
    return (
      <PageShell title="Kết quả Trợ lý AI">
        <UnauthorizedState description="Vai trò hiện tại không có quyền xem kết quả AI." />
      </PageShell>
    );
  }

  const result = await getAiJobResult(jobId);

  if (!result || result.job.requestedBy !== currentUser.id) {
    notFound();
  }

  const project = result.job.projectId ? await projectRepository.getProject(result.job.projectId) : undefined;
  const projectLabel = result.job.projectId ? formatAiProjectLabel(project, result.job.projectId) : undefined;

  return (
    <PageShell title="Kết quả Trợ lý AI" description="Kết quả được lọc theo quyền, phạm vi dự án và nguồn tri thức đã duyệt.">
      <AiJobDetail result={result} projectLabel={projectLabel} showTechnicalDetails={isTechnicalAiDetailAllowed(currentUser)} />
    </PageShell>
  );
}
