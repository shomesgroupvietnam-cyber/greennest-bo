import { notFound } from "next/navigation";

import { AxisOneStageDetail } from "@/modules/axis-1/components/axis-one-stage-detail";
import { getAxisOneStageById } from "@/modules/axis-1/services/axis-one-service";
import { requirePermission } from "@/lib/permissions/guard";

export const dynamic = "force-dynamic";

type AxisOneStagePageProps = {
  params: Promise<{
    stageId: string;
  }>;
};

export default async function AxisOneStagePage({ params }: AxisOneStagePageProps) {
  const { stageId } = await params;

  await requirePermission("axis1.view", { route: `/axis-1/${stageId}` });

  const stage = getAxisOneStageById(stageId);

  if (!stage) {
    notFound();
  }

  return <AxisOneStageDetail stage={stage} />;
}
