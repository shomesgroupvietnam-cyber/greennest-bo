import { z } from "zod";

import { REPORT_TYPES } from "@/modules/reports/types";

const reportTypeValues = Object.keys(REPORT_TYPES) as [keyof typeof REPORT_TYPES, ...Array<keyof typeof REPORT_TYPES>];

export const reportInputSchema = z.object({
  projectId: z.string().trim().min(1, "Vui lòng chọn dự án."),
  reportType: z.enum(reportTypeValues)
});
