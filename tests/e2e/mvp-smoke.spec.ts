import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/login",
  "/admin",
  "/executive",
  "/executive/decisions",
  "/executive/history",
  "/project-workbench",
  "/team-workbench",
  "/legal-workspace",
  "/finance-workspace",
  "/design-workspace",
  "/technical-workspace",
  "/construction-workspace",
  "/assistant-workspace",
  "/contractor",
  "/consultant",
  "/viewer",
  "/dashboard",
  "/projects",
  "/projects/new",
  "/tasks",
  "/tasks/new",
  "/documents",
  "/documents/new",
  "/legal",
  "/users",
  "/settings"
];

test.describe("MVP route smoke", () => {
  for (const route of routes) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(page.locator("body")).toContainText("GreenNest BuildFlow");
      await expect(page.locator("body")).not.toContainText("Cannot find module");
    });
  }

  test("core pages render on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of ["/dashboard", "/projects", "/tasks", "/documents", "/legal", "/users"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toContainText("GreenNest BuildFlow");
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });
});

async function useMockRole(page: Page, role: string) {
  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "greennest_mock_role",
      value: role,
      url: "http://localhost:3100"
    }
  ]);
}

async function expectForbiddenResponse(page: Page, responseStatus?: number) {
  expect([200, 403]).toContain(responseStatus);
  await expect(page.locator("body")).toContainText("403 Forbidden");
}

test.describe("External role isolation", () => {
  for (const { role, route } of [
    { role: "nha_thau", route: "/contractor" },
    { role: "tu_van", route: "/consultant" },
  ]) {
    test(`${role} login enters external workspace`, async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/login?entry=1&next=development");
      await page.waitForLoadState("networkidle");
      await page.locator('select[name="mockRole"]').selectOption(role);
      await page.locator('button[type="submit"]').click();

      await page.waitForURL(`**${route}`);
      expect(page.url()).toContain(route);
      expect(page.url()).not.toContain("/command-center");
      expect(page.url()).not.toContain("/dashboard");
    });

    test(`${role} direct command center redirects to external workspace`, async ({ page }) => {
      await useMockRole(page, role);

      await page.goto("/command-center", { waitUntil: "domcontentloaded" });

      await page.waitForURL(`**${route}`);
      await expect(page.locator("body")).not.toContainText("Tong quan Truc 1");
      await expect(page.locator("body")).not.toContainText("Dashboard T?ng Quan");
      await expect(page.locator("body")).not.toContainText("Ban lanh dao");
    });
  }

  test("contractor sees only assigned global records and cannot open unassigned details", async ({ page }) => {
    test.setTimeout(30000);

    await useMockRole(page, "nha_thau");

    await page.goto("/projects");
    await expect(page.locator("body")).toContainText("GreenNest Riverside");
    await expect(page.locator("body")).not.toContainText("GreenNest Garden");

    await page.goto("/tasks");
    await expect(page.locator("body")).toContainText("Cập nhật tiến độ gói thi công hàng rào");
    await expect(page.locator("body")).not.toContainText("Khảo sát hiện trạng khu đất");

    await page.goto("/documents");
    await expect(page.locator("body")).toContainText("Biện pháp thi công hàng rào");
    await expect(page.locator("body")).not.toContainText("Bản vẽ thiết kế cơ sở");

    await page.goto("/projects/demo-project-garden");
    await expect(page.locator("body")).toContainText("Bạn không có quyền xem dự án này");

    await page.goto("/tasks/demo-task-team");
    await expect(page.locator("body")).toContainText("Bạn không có quyền xem công việc này");

    await page.goto("/documents/demo-project-riverside-doc-basic-design");
    await expect(page.locator("body")).toContainText("Bạn không có quyền xem hồ sơ này");
  });

  test("consultant sees only assigned review scope and cannot open contractor document", async ({ page }) => {
    await useMockRole(page, "tu_van");

    await page.goto("/tasks");
    await expect(page.locator("body")).toContainText("Review bản vẽ hạ tầng kỹ thuật");
    await expect(page.locator("body")).not.toContainText("Cập nhật tiến độ gói thi công hàng rào");

    await page.goto("/documents");
    await expect(page.locator("body")).toContainText("Phiếu review hạ tầng kỹ thuật");
    await expect(page.locator("body")).not.toContainText("Biện pháp thi công hàng rào");

    await page.goto("/documents/demo-project-riverside-doc-contractor-method");
    await expect(page.locator("body")).toContainText("Bạn không có quyền xem hồ sơ này");
  });
});

test.describe("Permission-aware workspace entry", () => {
  test("chairman login enters command center without BO navigation", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login?entry=1&next=development");
    await page.waitForLoadState("networkidle");
    await page.locator('select[name="mockRole"]').selectOption("chu_tich");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/command-center");
    expect(page.url()).toContain("/command-center");
    expect(page.url()).not.toContain("/admin");
    await expect(page.getByRole("heading", { name: /Nguyen Thanh Binh/ })).toBeVisible();
    await expect(page.getByText("Chu tich")).toBeVisible();
    await expect(page.getByRole("button", { name: /T.ng quan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /C.i/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Quan tri|BO Settings|Nguoi dung/i })).toHaveCount(0);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href="/command-center"]').first()).toBeVisible();
    await expect(page.locator('a[href="/command-center?view=executive-dashboard"]').first()).toBeVisible();
    await expect(page.locator('a[href="/admin"]')).toHaveCount(0);
    await expect(page.locator('a[href="/settings"]')).toHaveCount(0);
    await expect(page.locator('a[href="/users"]')).toHaveCount(0);

    for (const route of ["/admin", "/settings", "/users"]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBe(403);
      await expect(page.locator("body"), route).not.toContainText(
        /Khong gian quan tri|Cai dat BO|Danh sach nguoi dung|Role Permission Catalog|Quan tri he thong|Nguoi dung|BO Settings/i,
      );
    }
  });

  test("super admin enters command center and keeps BO navigation", async ({ page }) => {
    test.setTimeout(60000);

    await page.context().clearCookies();
    await page.goto("/login?entry=1&next=development");
    await page.waitForLoadState("networkidle");
    await page.locator('select[name="mockRole"]').selectOption("super_admin");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/command-center");
    expect(page.url()).toContain("/command-center");
    await expect(page.getByRole("heading", { name: /Tran Quan Tri He Thong/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /C.i/i })).toBeVisible();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href="/command-center"]').first()).toBeVisible();
    await expect(page.locator('a[href="/command-center?view=executive-dashboard"]').first()).toBeVisible();
    await expect(page.locator('a[href="/admin"]').first()).toBeVisible();
    await expect(page.locator('a[href="/settings"]').first()).toBeVisible();
    await expect(page.locator('a[href="/users"]').first()).toBeVisible();

    for (const route of ["/admin", "/settings", "/users"]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBe(200);
    }
  });

  test("leadership login enters Module 1 leadership workspace view", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login?entry=1&next=development");
    await page.waitForLoadState("networkidle");
    await page.locator('select[name="mockRole"]').selectOption("tong_giam_doc");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/command-center?view=executive-dashboard");
    expect(page.url()).toContain("view=executive-dashboard");
  });

  test("direct executive command center view is forbidden before data render", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-dashboard");

    await expectForbiddenResponse(page, response?.status());
    await expect(page.locator("body")).not.toContainText("Executive Command Center");
  });

  test("direct approval center view is forbidden before data render", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-approvals");

    await expectForbiddenResponse(page, response?.status());
    await expect(page.locator("body")).not.toContainText("DX-FINANCE-MOCK02");
  });

  test("direct decision assignment center view is forbidden before data render", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-decision-log");

    await expectForbiddenResponse(page, response?.status());
    await expect(page.locator("body")).not.toContainText("Trung T?m Quy?t ??nh V? Giao Vi?c");
  });

  test("direct history archive view is forbidden before data render", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-history");

    await expectForbiddenResponse(page, response?.status());
    await expect(page.locator("body")).not.toContainText("L?ch S? V? L?u Tr?");
  });

  test("history export route blocks viewer without leaking details", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.request.get(
      "/reports/export?target=approval_history&format=csv&query=RAW_EXPORT_SENTINEL",
    );
    const body = await response.text();

    expect(response.status()).toBe(403);
    expect(response.headers()["cache-control"]).toBe("no-store, private");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(body).toBe("Ban khong co quyen xuat du lieu.");
    expect(body).not.toContain("RAW_EXPORT_SENTINEL");
  });

  test("leadership can export approval history with safe download headers", async ({ page }) => {
    await useMockRole(page, "chu_tich");

    const response = await page.request.get(
      "/reports/export?target=approval_history&format=csv&limit=25",
    );
    const body = await response.text();

    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("no-store, private");
    expect(response.headers()["pragma"]).toBe("no-cache");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["content-disposition"]).toContain("attachment;");
    expect(body).not.toContain("raw-old-secret");
    expect(body).not.toContain("999999999");
    expect(body).not.toContain("RAW_EXPORT_SENTINEL");
  });

  test("viewer can open private workspace as read-only", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-private-workspace", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /Kh.ng Gian L.m Vi.c C. Nh.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /D. .n .*c xem/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /T.m t.t ch. xem|Read-only summary/i })).toBeVisible();
    await expect(page.getByText(/Ch. xem:.*kh.ng c. thao t.c|Read-only: khong co mutation action/i)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("viewer direct top-level command center redirects to read-only workspace", async ({ page }) => {
    await useMockRole(page, "viewer");

    await page.goto("/command-center", { waitUntil: "domcontentloaded" });

    await page.waitForURL("**/viewer");
    await expect(page.locator("body")).not.toContainText("Tong quan Truc 1");
    await expect(page.locator("body")).not.toContainText("Dashboard T?ng Quan");
    await expect(page.locator("body")).not.toContainText("Executive Command Center");
  });

  test("assistant without active scope uses assistant workspace and cannot open command center", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login?entry=1&next=development");
    await page.waitForLoadState("networkidle");
    await page.locator('select[name="mockRole"]').selectOption("thu_ky_tro_ly");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/assistant-workspace");
    expect(page.url()).toContain("/assistant-workspace");

    await page.goto("/command-center", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/assistant-workspace");
    await expect(page.locator("body")).not.toContainText("Tong quan Truc 1");
    await expect(page.locator("body")).not.toContainText("Dashboard T?ng Quan");
  });

  for (const { role, route } of [
    { role: "phap_ly", route: "/legal-workspace" },
    { role: "thiet_ke", route: "/design-workspace" },
    { role: "ky_thuat", route: "/technical-workspace" },
  ]) {
    test(`${role} development login enters specialist workspace`, async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/login?entry=1&next=development");
      await page.waitForLoadState("networkidle");
      await page.locator('select[name="mockRole"]').selectOption(role);
      await page.locator('button[type="submit"]').click();

      await page.waitForURL(`**${route}`);
      expect(page.url()).toContain(route);
      expect(page.url()).not.toContain("/command-center");
    });
  }

  test("project director enters project workbench and Command Center opens Axis 1 overview", async ({ page }) => {
    test.setTimeout(30000);

    await page.context().clearCookies();
    await page.goto("/login?entry=1&next=development");
    await page.waitForLoadState("networkidle");
    await page.locator('select[name="mockRole"]').selectOption("giam_doc_du_an");
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/project-workbench");
    expect(page.url()).toContain("/project-workbench");

    await page.getByRole("link", { name: /T.ng quan Tr.c 1/ }).click();
    await page.waitForURL("**/command-center?view=axis1-search-development");
    await expect(
      page.getByRole("link", { name: /Quay l.i B.n d. .n|Quay lai Ban du an/i }),
    ).toHaveAttribute("href", "/project-workbench");
    await expect(page.locator("body")).not.toContainText("Application error");

    await page.goto("/command-center", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/command-center?view=axis1-search-development");
  });

  test("leadership executive dashboard renders DTO sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Dashboard.*Quan/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /D.i KPI/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Vi.c .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /r.i ro/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /H.n x. l. h.m nay/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Quy.t .{1,2}nh m.i/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership executive dashboard drill-down supports metadata and keyboard close", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const trigger = page.getByRole("button", { name: /^Xem chi/ }).first();
    await trigger.focus();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Ngu.n li.n quan/)).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /D.ng th.i gian|Timeline/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("leadership executive dashboard has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Dashboard.*Quan/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Vi.c .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /r.i ro/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("leadership approval center renders axis tabs and placeholders", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-approvals", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Trung T.m Ph. Duy.t/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Tr.c 1/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /H.ng ch. ph. duy.t Tr.c 1/ })).toBeVisible();

    const axisTwoTab = page.getByRole("tab", { name: /Tr.c 2/ });
    await axisTwoTab.click();

    await expect(axisTwoTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/M.n gi. ch. MVP/)).toBeVisible();
    await expect(page.getByText(/Ch.a c. lu.ng chi ti.t cho Tr.c 2/)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership can drill from approval center to actionable approval detail", async ({ page }) => {
    test.setTimeout(30000);

    await useMockRole(page, "chu_tich");

    await page.goto("/command-center?view=executive-approvals", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /^M. chi/ }).first().click();

    await expect(page).toHaveURL(/\/approvals\/proposal\//, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Chi Ti.t Ph. Duy.t/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /T.m t.t y.u c.u/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Ch.nh s.ch/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Ngu.n li.n quan/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /L.ch s. v. ki.m to.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /H.nh ..ng ph. duy.t/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Duyet approval" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tu choi", exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("approval detail action panel fits mobile viewport", async ({ page }) => {
    await useMockRole(page, "chu_tich");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/approvals/proposal/proposal-demo-overdue-approval", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("region", { name: /H.nh ..ng ph. duy.t/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Duyet approval" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Huy approval" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("approval detail blocks unauthorized direct access without leaking record data", async ({ page }) => {
    await useMockRole(page, "viewer");

    await page.goto("/approvals/proposal/proposal-demo-overdue-approval", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1, name: /kh.ng c. quy.n xem ph. duy.t/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("DX-OVERDUE-DEMO");
    await expect(page.locator("body")).not.toContainText("9999000000");
  });

  test("leadership morning briefing renders scoped summary sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-morning-briefing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /B.n T.m T.t .{1,2}u Ng.y/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /B.n t.m t.t AI nh.p/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /KPI h.m nay/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /R.i ro .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Ph. duy.t qu. h.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /D. .n/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership morning briefing has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-morning-briefing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /B.n T.m T.t .{1,2}u Ng.y/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /B.n t.m t.t AI nh.p/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /R.i ro .u ti.n/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("leadership executive common center renders scoped sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-common-center", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Trung T.m .i.u H.nh Chung/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /KPI chung/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Khu v.c .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Th.ng b.o m.i/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Quy.t .{1,2}nh m.i/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /L.ch h.p v. s. ki.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /R.i ro t.ng/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership executive common center has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-common-center", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Trung T.m .i.u H.nh Chung/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Khu v.c .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Th.ng b.o m.i/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("leadership private workspace renders scoped sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-private-workspace", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Kh.ng Gian L.m Vi.c C. Nh.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Ti.n .*. v. resource v.n h.nh/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Khu v.c .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Danh m.c .*.c giao/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /H. tr. tr. l./ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership private workspace has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-private-workspace", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Kh.ng Gian L.m Vi.c C. Nh.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Ti.n .*. v. resource v.n h.nh/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Khu v.c .u ti.n/ })).toBeVisible();
    await expect(page.getByRole("region", { name: /Danh m.c .*.c giao/ })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("meeting detail renders decision tracking with command center deep links on mobile", async ({ page }) => {
    await useMockRole(page, "chu_tich");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/meetings/demo-meeting-riverside-weekly", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Decision tracking/i })).toBeVisible();
    await expect(
      page.locator(
        'a[href*="view=executive-decision-log"][href*="demo-decision-riverside-legal"]',
      ).first(),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("executive workspace views fit responsive QA viewports", async ({ page }) => {
    test.setTimeout(90000);
    await useMockRole(page, "tong_giam_doc");

    const views = [
      {
        heading: /Dashboard.*Quan/,
        region: /Vi.c .u ti.n/,
        url: "/command-center?view=executive-dashboard",
      },
      {
        heading: /B.n T.m T.t .{1,2}u Ng.y/,
        region: /R.i ro .u ti.n/,
        url: "/command-center?view=executive-morning-briefing",
      },
      {
        heading: /Trung T.m .i.u H.nh Chung/,
        region: /Khu v.c .u ti.n/,
        url: "/command-center?view=executive-common-center",
      },
      {
        heading: /Trung T.m Ph. Duy.t/,
        region: /H.ng ch. ph. duy.t Tr.c 1/,
        url: "/command-center?view=executive-approvals",
      },
      {
        heading: /Trung T.m Quy.t .{1,2}nh V. Giao Vi.c/,
        region: /Danh s.ch quy.t .{1,2}nh/,
        url: "/command-center?view=executive-decision-log",
      },
      {
        heading: /L.ch S. V. L.u Tr./,
        region: /L.ch S. V. L.u Tr./,
        url: "/command-center?view=executive-history",
      },
      {
        heading: /Kh.ng Gian L.m Vi.c C. Nh.n/,
        region: /Khu v.c .u ti.n/,
        url: "/command-center?view=executive-private-workspace",
      },
    ];
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
      { width: 1440, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const view of views) {
        await page.goto(view.url, { waitUntil: "domcontentloaded" });

        await expect(page.getByRole("heading", { name: view.heading })).toBeVisible();
        await expect(page.getByRole("region", { name: view.region })).toBeVisible();
        await expect(page.locator("body")).not.toContainText("Application error");

        const hasBasicHorizontalFit = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 8,
        );

        expect(hasBasicHorizontalFit).toBe(true);
      }
    }
  });

  test("approval detail fits responsive QA viewports", async ({ page }) => {
    test.setTimeout(45000);
    await useMockRole(page, "tong_giam_doc");

    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/approvals/proposal/proposal-demo-overdue-approval", { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { name: /Chi Ti.t Ph. Duy.t/ })).toBeVisible();
      await expect(page.getByRole("region", { name: /T.m t.t y.u c.u/ })).toBeVisible();
      await expect(page.getByRole("region", { name: /Ch.nh s.ch/ })).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");

      const hasBasicHorizontalFit = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 8,
      );

      expect(hasBasicHorizontalFit).toBe(true);
    }
  });
});
