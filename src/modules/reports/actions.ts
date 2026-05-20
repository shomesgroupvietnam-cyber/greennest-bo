"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { assertCan } from "@/lib/permissions/can";
import { getScopedProject } from "@/lib/permissions/scoped-resources";
import { generateReport } from "@/modules/reports/services/report-service";
import type { ReportInput } from "@/modules/reports/types";
import { createAuditLog } from "@/modules/users/services/user-service";

export async function generateReportAction(formData: FormData) {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "report.create");
  const input: ReportInput = {
    projectId: String(formData.get("projectId") ?? ""),
    reportType: String(formData.get("reportType") ?? "weekly_project_summary") as ReportInput["reportType"]
  };

  if (!(await getScopedProject(currentUser, input.projectId))) {
    throw new Error("Bạn không có quyền tạo báo cáo cho dự án này.");
  }

  const report = await generateReport(input, currentUser.id);
  await createAuditLog({
    actorId: currentUser.id,
    entityType: "report",
    entityId: report.id,
    action: "report.create",
    newValue: { projectId: report.projectId, reportType: report.reportType, title: report.title }
  });

  revalidatePath("/reports");
  revalidatePath(`/projects/${report.projectId}`);
  redirect(`/reports/${report.id}`);
}
