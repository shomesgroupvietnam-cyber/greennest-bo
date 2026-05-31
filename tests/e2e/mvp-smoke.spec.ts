import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/login",
  "/admin",
  "/executive",
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
      await expect(page.locator("body")).not.toContainText("Dashboard Tong Quan");
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
    test.setTimeout(30000);

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

    expect(response?.status()).toBe(403);
    await expect(page.locator("body")).toContainText("403 Forbidden");
    await expect(page.locator("body")).not.toContainText("Executive Command Center");
  });

  test("direct approval center view is forbidden before data render", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-approvals");

    expect(response?.status()).toBe(403);
    await expect(page.locator("body")).toContainText("403 Forbidden");
    await expect(page.locator("body")).not.toContainText("DX-FINANCE-MOCK02");
  });

  test("viewer can open private workspace as read-only", async ({ page }) => {
    await useMockRole(page, "viewer");

    const response = await page.goto("/command-center?view=executive-private-workspace", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Private Workspace" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Du an duoc xem" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Read-only summary" })).toBeVisible();
    await expect(page.getByText("Read-only: khong co mutation action trong workspace nay.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("viewer direct top-level command center redirects to read-only workspace", async ({ page }) => {
    await useMockRole(page, "viewer");

    await page.goto("/command-center", { waitUntil: "domcontentloaded" });

    await page.waitForURL("**/viewer");
    await expect(page.locator("body")).not.toContainText("Tong quan Truc 1");
    await expect(page.locator("body")).not.toContainText("Dashboard Tong Quan");
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
    await expect(page.locator("body")).not.toContainText("Dashboard Tong Quan");
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

    await page.getByRole("link", { name: "Tong quan Truc 1" }).click();
    await page.waitForURL("**/command-center?view=axis1-search-development");
    await expect(
      page.getByRole("link", { name: /Quay lai Ban du an/i }),
    ).toHaveAttribute("href", "/project-workbench");
    await expect(page.locator("body")).not.toContainText("Application error");

    await page.goto("/command-center", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/command-center?view=axis1-search-development");
  });

  test("leadership executive dashboard renders DTO sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Dashboard Tong Quan" })).toBeVisible();
    await expect(page.getByRole("region", { name: "KPI Strip" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Priority Queue" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Risk Summary" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Deadline hom nay" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Quyet dinh moi" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership executive dashboard drill-down supports metadata and keyboard close", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const trigger = page.getByRole("button", { name: /^Xem chi tiet/ }).first();
    await trigger.focus();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Chi tiet nguon dieu hanh" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Nguon lien quan")).toBeVisible();
    await expect(dialog.getByText("Timeline")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("leadership executive dashboard has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Dashboard Tong Quan" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Priority Queue" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Risk Summary" })).toBeVisible();
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

    await expect(page.getByRole("heading", { name: "Approval Center" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Truc 1/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "Approval queue Truc 1" })).toBeVisible();

    const axisTwoTab = page.getByRole("tab", { name: /Truc 2/ });
    await axisTwoTab.click();

    await expect(axisTwoTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Placeholder MVP", { exact: true })).toBeVisible();
    await expect(page.getByText(/Chua co flow chi tiet cho Truc 2/)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership can drill from approval center to actionable approval detail", async ({ page }) => {
    test.setTimeout(30000);

    await useMockRole(page, "chu_tich");

    await page.goto("/command-center?view=executive-approvals", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /^Mo chi tiet/ }).first().click();

    await expect(page).toHaveURL(/\/approvals\/proposal\//, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Approval Detail" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Request summary" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Policy" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Linked sources" })).toBeVisible();
    await expect(page.getByRole("region", { name: "History and audit" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Approval actions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Duyet approval" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tu choi" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("approval detail action panel fits mobile viewport", async ({ page }) => {
    await useMockRole(page, "chu_tich");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/approvals/proposal/proposal-demo-overdue-approval", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("region", { name: "Approval actions" })).toBeVisible();
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

    await expect(page.getByText("Ban khong co quyen xem approval nay")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("DX-OVERDUE-DEMO");
    await expect(page.locator("body")).not.toContainText("9999000000");
  });

  test("leadership morning briefing renders scoped summary sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-morning-briefing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Morning Briefing" })).toBeVisible();
    await expect(page.getByRole("region", { name: "AI Summary draft" })).toBeVisible();
    await expect(page.getByRole("region", { name: "KPI hom nay" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Top risk" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Approval qua han" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Du an do vang xanh" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership morning briefing has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-morning-briefing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Morning Briefing" })).toBeVisible();
    await expect(page.getByRole("region", { name: "AI Summary draft" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Top risk" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("leadership executive common center renders scoped sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-common-center", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Executive Common Center" })).toBeVisible();
    await expect(page.getByRole("region", { name: "KPI chung" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Priority area" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Thong bao moi" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Quyet dinh moi" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Lich hop va su kien" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Risk tong" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership executive common center has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-common-center", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Executive Common Center" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Priority area" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Thong bao moi" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("leadership private workspace renders scoped sections", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");

    await page.goto("/command-center?view=executive-private-workspace", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Private Workspace" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Priority area" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Assigned portfolio" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Assistant support" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("leadership private workspace has mobile compact layout", async ({ page }) => {
    await useMockRole(page, "tong_giam_doc");
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/command-center?view=executive-private-workspace", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Private Workspace" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Priority area" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Assigned portfolio" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");

    const hasBasicHorizontalFit = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 8,
    );

    expect(hasBasicHorizontalFit).toBe(true);
  });

  test("executive workspace views fit responsive QA viewports", async ({ page }) => {
    test.setTimeout(30000);
    await useMockRole(page, "tong_giam_doc");

    const views = [
      {
        heading: "Dashboard Tong Quan",
        region: "Priority Queue",
        url: "/command-center?view=executive-dashboard",
      },
      {
        heading: "Morning Briefing",
        region: "Top risk",
        url: "/command-center?view=executive-morning-briefing",
      },
      {
        heading: "Executive Common Center",
        region: "Priority area",
        url: "/command-center?view=executive-common-center",
      },
      {
        heading: "Approval Center",
        region: "Approval queue Truc 1",
        url: "/command-center?view=executive-approvals",
      },
      {
        heading: "Private Workspace",
        region: "Priority area",
        url: "/command-center?view=executive-private-workspace",
      },
    ];
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
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

      await expect(page.getByRole("heading", { name: "Approval Detail" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Request summary" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Policy" })).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");

      const hasBasicHorizontalFit = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 8,
      );

      expect(hasBasicHorizontalFit).toBe(true);
    }
  });
});
