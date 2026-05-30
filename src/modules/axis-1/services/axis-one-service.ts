import { axisOneDevelopmentStages } from "@/modules/axis-1/mock-data";
import type {
  AxisOneDashboardSummary,
  AxisOneDevelopmentStage,
} from "@/modules/axis-1/types";

function countMissingDocuments(stages: AxisOneDevelopmentStage[]) {
  return stages.reduce(
    (count, stage) =>
      count +
      stage.requiredDocuments.filter((document) => document.status === "missing")
        .length,
    0,
  );
}

function countOpenTasks(stages: AxisOneDevelopmentStage[]) {
  return stages.reduce(
    (count, stage) =>
      count + stage.tasks.filter((task) => task.status !== "done").length,
    0,
  );
}

export function getAxisOneStages() {
  return axisOneDevelopmentStages;
}

export function getAxisOneStageById(stageId: string) {
  return axisOneDevelopmentStages.find((stage) => stage.id === stageId) ?? null;
}

export function getAxisOneDashboardSummary(): AxisOneDashboardSummary {
  const stages = getAxisOneStages();
  const completedStages = stages.filter(
    (stage) => stage.status === "completed",
  ).length;

  return {
    totalStages: stages.length,
    completedStages,
    completionRate: Math.round(
      stages.reduce((total, stage) => total + stage.progress, 0) / stages.length,
    ),
    missingDocuments: countMissingDocuments(stages),
    openTasks: countOpenTasks(stages),
    blockedStages: stages.filter((stage) => stage.status === "blocked").length,
    highRiskStages: stages.filter((stage) =>
      ["high", "critical"].includes(stage.riskLevel),
    ).length,
  };
}

export function getAxisOneRiskAlerts() {
  return getAxisOneStages()
    .filter((stage) => ["high", "critical"].includes(stage.riskLevel))
    .map((stage) => ({
      id: stage.id,
      stageId: stage.id,
      title: stage.title,
      riskLevel: stage.riskLevel,
      reason:
        stage.status === "blocked"
          ? "Đang có điểm nghẽn cần xử lý trước khi chuyển bước tiếp theo."
          : "Rủi ro cao do phụ thuộc hồ sơ pháp lý/kỹ thuật và mốc phản hồi bên ngoài.",
      deadline: stage.deadline,
      href: `/axis-1/${stage.id}`,
    }));
}

export function getAxisOneMissingDocuments() {
  return getAxisOneStages().flatMap((stage) =>
    stage.requiredDocuments
      .filter((document) => document.status === "missing")
      .map((document) => ({
        ...document,
        stageId: stage.id,
        stageCode: stage.code,
        stageTitle: stage.title,
        href: `/axis-1/${stage.id}`,
      })),
  );
}

export function getAxisOneOpenTasks() {
  return getAxisOneStages().flatMap((stage) =>
    stage.tasks
      .filter((task) => task.status !== "done")
      .map((task) => ({
        ...task,
        stageId: stage.id,
        stageCode: stage.code,
        stageTitle: stage.title,
        href: `/axis-1/${stage.id}`,
      })),
  );
}
