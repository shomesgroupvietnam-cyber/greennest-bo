import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { can, PERMISSIONS } from "@/lib/permissions/can";
import type { PermissionAction } from "@/lib/permissions/can";
import { JsonRolePermissionCatalogRepository } from "@/modules/settings/services/role-permission-catalog-repository";
import {
  addRoleTemplate,
  disableRoleTemplate,
  groupPermissionCatalogByModule,
  listRolePermissionCatalog,
  renameRoleTemplate,
  updateRolePermissionMapping,
} from "@/modules/settings/services/role-permission-catalog-service";

let tempDir: string;
let repository: JsonRolePermissionCatalogRepository;

const settingsManager = { id: "settings-manager", role: "admin" } as const;
const chairman = { id: "chairman-01", role: "chu_tich" } as const;
const chairmanBoDeniedPermissions = [
  "settings.manage",
  "user.view",
  "user.invite",
  "user.update_role",
  "delegation.manage",
  "knowledge.manage_source_registry",
  "ai.configure",
] satisfies PermissionAction[];

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "greennest-role-catalog-"));
  repository = new JsonRolePermissionCatalogRepository(
    path.join(tempDir, "role-permission-catalog.json"),
  );
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("role permission catalog service", () => {
  it("loads default role templates and permission catalog from existing constants", async () => {
    const catalog = await listRolePermissionCatalog(repository);

    expect(catalog.roles.map((role) => role.key)).toEqual(
      expect.arrayContaining([
        "chu_tich",
        "super_admin",
        "admin",
        "tong_giam_doc",
        "giam_doc_du_an",
        "thu_ky_tro_ly",
        "viewer",
      ]),
    );
    expect(catalog.permissions).toHaveLength(PERMISSIONS.length);
    expect(catalog.permissions.find((item) => item.key === "finance.view")).toMatchObject({
      module: "finance",
      sensitive: true,
    });
    expect(catalog.permissions.find((item) => item.key === "report.create")).toMatchObject({
      module: "report",
      actionType: "create",
    });
    expect(catalog.permissions.find((item) => item.key === "report.export")).toMatchObject({
      module: "report",
      actionType: "export",
      sensitive: false,
    });
    expect(catalog.roles.find((role) => role.key === "admin")?.permissionKeys).toContain(
      "report.export",
    );
    expect(catalog.roles.find((role) => role.key === "viewer")?.permissionKeys).not.toContain(
      "report.export",
    );
    expect(catalog.roles.find((role) => role.key === "admin")?.permissionKeys).not.toContain(
      "proposal.approve",
    );
    expect(catalog.roles.find((role) => role.key === "admin")?.permissionKeys).not.toContain(
      "risk.create",
    );
    expect(catalog.roles.find((role) => role.key === "admin")?.permissionKeys).not.toContain(
      "risk.override",
    );
    expect(catalog.roles.find((role) => role.key === "admin")?.permissionKeys).not.toContain(
      "risk.close",
    );
    expect(catalog.roles.find((role) => role.key === "admin")?.permissionKeys).not.toContain(
      "risk.close_high",
    );
    expect(catalog.roles.find((role) => role.key === "chu_tich")?.permissionKeys).toEqual(
      expect.arrayContaining([
        "proposal.approve",
        "finance.view",
        "decision.approve",
        "risk.create",
        "risk.update",
        "risk.override",
        "risk.close",
        "risk.close_high",
      ]),
    );
    expect(catalog.permissions.find((permission) => permission.key === "risk.create")).toMatchObject({
      actionType: "create",
      module: "risk",
      sensitive: false,
    });
    expect(catalog.permissions.find((permission) => permission.key === "risk.update")).toMatchObject({
      actionType: "update",
      module: "risk",
      sensitive: false,
    });
    expect(catalog.permissions.find((permission) => permission.key === "risk.override")).toMatchObject({
      actionType: "update",
      module: "risk",
      sensitive: false,
    });
    expect(catalog.permissions.find((permission) => permission.key === "risk.close")).toMatchObject({
      actionType: "update",
      module: "risk",
      sensitive: true,
    });
    expect(catalog.permissions.find((permission) => permission.key === "risk.close_high")).toMatchObject({
      actionType: "update",
      module: "risk",
      sensitive: true,
    });
    const chairmanPermissions = catalog.roles.find((role) => role.key === "chu_tich")?.permissionKeys ?? [];
    const superAdminPermissions = catalog.roles.find((role) => role.key === "super_admin")?.permissionKeys ?? [];
    for (const permission of chairmanBoDeniedPermissions) {
      expect(chairmanPermissions).not.toContain(permission);
      expect(superAdminPermissions).toContain(permission);
    }
    for (const permission of chairmanPermissions) {
      expect(superAdminPermissions).toContain(permission);
    }
    expect(catalog.roles.find((role) => role.key === "super_admin")?.permissionKeys).toEqual(
      expect.arrayContaining([
        "settings.manage",
        "user.invite",
        "user.update_role",
        "delegation.manage",
        "document.approve",
        "legal.approve",
        "decision.approve",
        "ai.confirm_action",
      ]),
    );
  });

  it("adds, renames and disables role templates without rewriting the stable key", async () => {
    const created = await addRoleTemplate(
      {
        key: "truong_bo_phan",
        labelVi: "Truong bo phan",
        description: "Quan ly mot bo phan nghiep vu",
        scope: "system",
      },
      settingsManager,
      repository,
    );

    expect(created.role).toMatchObject({
      key: "truong_bo_phan",
      labelVi: "Truong bo phan",
      active: true,
    });

    const renamed = await renameRoleTemplate(
      {
        roleKey: "truong_bo_phan",
        labelVi: "Truong bo phan dieu hanh",
        description: "Nhan su quan ly bo phan",
      },
      settingsManager,
      repository,
    );

    expect(renamed.previousRole?.key).toBe("truong_bo_phan");
    expect(renamed.role).toMatchObject({
      key: "truong_bo_phan",
      labelVi: "Truong bo phan dieu hanh",
      description: "Nhan su quan ly bo phan",
    });

    const disabled = await disableRoleTemplate("truong_bo_phan", settingsManager, repository);

    expect(disabled.previousRole?.active).toBe(true);
    expect(disabled.role).toMatchObject({ key: "truong_bo_phan", active: false });
  });

  it("rejects duplicate role keys and unknown permission mapping", async () => {
    await expect(
      addRoleTemplate(
        {
          key: "admin",
          labelVi: "Duplicate admin",
          scope: "system",
        },
        settingsManager,
        repository,
      ),
    ).rejects.toThrow(/ton tai|exist|duplicate/i);

    await expect(
      updateRolePermissionMapping(
        {
          roleKey: "viewer",
          permissionKeys: ["project.view", "unknown.approve" as PermissionAction],
        },
        settingsManager,
        repository,
      ),
    ).rejects.toThrow(/permission/i);
  });

  it("groups permission catalog by module and returns old/new mapping for audit", async () => {
    const catalog = await listRolePermissionCatalog(repository);
    const grouped = groupPermissionCatalogByModule(catalog.permissions);

    expect(grouped.finance.some((permission) => permission.key === "payment.approve")).toBe(true);

    const changed = await updateRolePermissionMapping(
      {
        roleKey: "viewer",
        permissionKeys: ["project.view", "task.view", "document.view"],
      },
      settingsManager,
      repository,
    );

    expect(changed.previousPermissionKeys).toContain("finance.view");
    expect(changed.role.permissionKeys).toEqual(["project.view", "task.view", "document.view"]);
  });

  it("enforces settings.manage for mutations and blocks disabling the current admin role", async () => {
    await expect(
      addRoleTemplate(
        {
          key: "blocked_viewer_role",
          labelVi: "Blocked viewer role",
          scope: "system",
        },
        { id: "viewer", role: "viewer" },
        repository,
      ),
    ).rejects.toThrow(/quyen|permission/i);

    await expect(
      updateRolePermissionMapping(
        {
          roleKey: "viewer",
          permissionKeys: ["project.view"],
        },
        chairman,
        repository,
      ),
    ).rejects.toThrow(/quyen|permission/i);

    await expect(disableRoleTemplate("admin", settingsManager, repository)).rejects.toThrow(
      /phien|current|quan ly/i,
    );
  });

  it("blocks admin from re-granting business approvals or removing its own settings.manage permission", async () => {
    await expect(
      updateRolePermissionMapping(
        {
          roleKey: "admin",
          permissionKeys: ["settings.manage", "user.view", "document.approve"],
        },
        settingsManager,
        repository,
      ),
    ).rejects.toThrow(/duyet|approval|super_admin/i);

    await expect(
      updateRolePermissionMapping(
        {
          roleKey: "admin",
          permissionKeys: ["user.view", "audit.view"],
        },
        settingsManager,
        repository,
      ),
    ).rejects.toThrow(/settings\.manage|quan ly/i);
  });

  it("uses session/catalog permissions and roleActive state in runtime authorization", async () => {
    const created = await addRoleTemplate(
      {
        key: "custom_operator",
        labelVi: "Custom operator",
        scope: "system",
        permissionKeys: ["project.view", "task.view"],
      },
      settingsManager,
      repository,
    );

    const operator = {
      id: "operator",
      role: created.role.key,
      permissions: created.role.permissionKeys,
      permissionsMode: "replace" as const,
    };

    expect(can(operator, "task.view")).toBe(true);
    expect(can(operator, "settings.manage")).toBe(false);
    expect(
      can(
        {
          ...operator,
          roleActive: false,
        },
        "task.view",
      ),
    ).toBe(false);
  });
});
