import { beforeEach, describe, expect, it, vi } from "vitest";

import ExecutiveHistoryRoute from "@/app/executive/history/page";
import { requireWorkspaceRoute } from "@/lib/permissions/guard";

const headerValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => headerValues.get(key) ?? null,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
}));

vi.mock("@/lib/permissions/guard", () => ({
  requireWorkspaceRoute: vi.fn(async () => ({
    user: { id: "ceo-01", role: "tong_giam_doc" },
  })),
}));

describe("Executive history route", () => {
  beforeEach(() => {
    headerValues.clear();
    vi.clearAllMocks();
  });

  it("redirects to the command-center history view while preserving filters", async () => {
    headerValues.set("x-greennest-pathname", "/executive/history");
    headerValues.set("x-greennest-search", "?scopeId=scope-a&query=DX-001");

    await expect(ExecutiveHistoryRoute()).rejects.toThrow(
      "NEXT_REDIRECT:/command-center?scopeId=scope-a&query=DX-001&view=executive-history",
    );
    expect(requireWorkspaceRoute).toHaveBeenCalledWith("/executive");
  });
});
