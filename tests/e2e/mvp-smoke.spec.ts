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
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
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
  test("contractor sees only assigned global records and cannot open unassigned details", async ({ page }) => {
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
