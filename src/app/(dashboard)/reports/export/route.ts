import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { exportReportData } from "@/modules/reports/services/report-export-service";
import { parseReportExportRequestEntries } from "@/modules/reports/validation";

class InvalidExportRequestError extends Error {}

const forbiddenExportMessages = new Set([
  "Ban khong co quyen xuat audit log.",
  "Ban khong co quyen xuat du lieu.",
  "Scope xuat du lieu khong hop le hoac khong thuoc nguoi dung.",
]);

function hasRequiredDownloadParams(searchParams: URLSearchParams) {
  return Boolean(searchParams.get("target")?.trim() && searchParams.get("format")?.trim());
}

function statusForError(error: unknown) {
  if (error instanceof InvalidExportRequestError || error instanceof ZodError) {
    return 400;
  }

  if (error instanceof Error && forbiddenExportMessages.has(error.message)) {
    return 403;
  }

  return 500;
}

function safeMessageForStatus(status: number) {
  if (status === 403) {
    return "Ban khong co quyen xuat du lieu.";
  }

  if (status === 400) {
    return "Khong the xuat du lieu voi yeu cau hien tai.";
  }

  return "Khong the xuat du lieu luc nay.";
}

const privateNoStoreHeaders = {
  "cache-control": "no-store, private",
  "pragma": "no-cache",
  "x-content-type-options": "nosniff",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    if (!hasRequiredDownloadParams(url.searchParams)) {
      throw new InvalidExportRequestError("Missing export target or format.");
    }

    const exportRequest = parseReportExportRequestEntries(url.searchParams.entries());
    const currentUser = await getCurrentUser();
    const result = await exportReportData(currentUser, exportRequest);

    return new Response(result.content, {
      headers: {
        ...privateNoStoreHeaders,
        "content-disposition": `attachment; filename="${result.filename}"`,
        "content-type": result.mimeType,
      },
    });
  } catch (error) {
    const status = statusForError(error);

    return new Response(safeMessageForStatus(status), {
      headers: {
        ...privateNoStoreHeaders,
        "content-type": "text/plain; charset=utf-8",
      },
      status,
    });
  }
}
