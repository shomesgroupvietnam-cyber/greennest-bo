import { describe, expect, it } from "vitest";

import { ROLE_DEFAULT_SCREENS, type Role } from "@/constants/roles";
import { resolvePostLoginHref } from "@/lib/auth/post-login-routing";
import type { AppSession } from "@/lib/auth/session";

function sessionFor(role: Role): AppSession {
  return {
    defaultScreen: ROLE_DEFAULT_SCREENS[role],
    isAuthenticated: true,
    isFallback: true,
    mode: "mock",
    permissions: [],
    user: {
      email: `${role}@greennest.vn`,
      fullName: role,
      id: `${role}-user`,
      role,
      status: role === "pending" ? "pending" : "active",
    },
  };
}

describe("auth post-login routing", () => {
  it.each([
    ["giam_doc_du_an", "/project-workbench"],
    ["phap_ly", "/legal-workspace"],
    ["thiet_ke", "/design-workspace"],
    ["ky_thuat", "/technical-workspace"],
    ["thu_ky_tro_ly", "/assistant-workspace"],
    ["viewer", "/viewer"],
  ] as const)(
    "sends %s to its policy default before generic executive access",
    (role, expectedHref) => {
      expect(resolvePostLoginHref("development", sessionFor(role))).toBe(
        expectedHref,
      );
    },
  );

  it.each([
    ["chu_tich", "/command-center"],
    ["super_admin", "/command-center"],
    ["admin", "/command-center"],
    ["tong_giam_doc", "/command-center?view=executive-dashboard"],
    ["pho_tong_giam_doc", "/command-center?view=executive-dashboard"],
  ] as const)("keeps leadership/admin development entry for %s", (role, expectedHref) => {
    expect(resolvePostLoginHref("development", sessionFor(role))).toBe(
      expectedHref,
    );
  });
});
