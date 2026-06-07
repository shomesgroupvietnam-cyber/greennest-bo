import { PageShell } from "@/components/shared/page-shell";
import { canAccessScopedAction } from "@/lib/permissions/access-scope";
import { can } from "@/lib/permissions/can";
import { requireAnyPermission } from "@/lib/permissions/guard";
import { listProjects } from "@/modules/projects/services/project-service";
import { LeadershipDelegationPanel } from "@/modules/settings/components/leadership-delegation-panel";
import { PolicySettingsPanel } from "@/modules/settings/components/policy-settings-panel";
import { ProviderHealthPanel } from "@/modules/settings/components/provider-health-panel";
import { RolePermissionCatalogPanel } from "@/modules/settings/components/role-permission-catalog-panel";
import { ScopeAssignmentPanel } from "@/modules/settings/components/scope-assignment-panel";
import { SourceRegistrySettingsPanel } from "@/modules/settings/components/source-registry-settings-panel";
import { listLeadershipDelegations } from "@/modules/settings/services/leadership-delegation-service";
import { listPolicySettings } from "@/modules/settings/services/policy-settings-service";
import { checkAllProviderHealth } from "@/modules/settings/services/provider-health-service";
import { listRolePermissionCatalog } from "@/modules/settings/services/role-permission-catalog-service";
import {
  listActiveScopeAssignments,
  listScopeAssignments,
} from "@/modules/settings/services/scope-assignment-service";
import { listSourceRegistryEntries } from "@/modules/settings/services/source-registry-settings-service";
import { listUsers } from "@/modules/users/services/user-service";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await requireAnyPermission(["settings.manage", "delegation.manage"], { route: "/settings" });
  const params = searchParams ? await searchParams : {};
  const shouldCheckProviders = readParam(params.checkProviders) === "1";
  const canManageSettings = can(session.user, "settings.manage");
  const canManageDelegationDirect = canManageSettings || can(session.user, "delegation.manage");
  const coreDataPromise = Promise.all([
    listRolePermissionCatalog(),
    listUsers(),
    listProjects({}),
    listLeadershipDelegations(),
    canManageDelegationDirect ? Promise.resolve([]) : listActiveScopeAssignments(),
  ]);
  const settingsDataPromise = canManageSettings
    ? Promise.all([
        listSourceRegistryEntries(),
        checkAllProviderHealth({ runLiveChecks: shouldCheckProviders }),
        listScopeAssignments(),
        listPolicySettings(),
      ])
    : Promise.resolve(null);
  const [[rolePermissionCatalog, users, projects, delegations, activeScopeAssignments], settingsData] = await Promise.all([
    coreDataPromise,
    settingsDataPromise,
  ]);
  const canManageDelegation =
    canManageDelegationDirect ||
    canAccessScopedAction(session.user, "settings.manage", {}, {
      rolePermissionCatalog,
      scopeAssignments: activeScopeAssignments,
    }) ||
    canAccessScopedAction(session.user, "delegation.manage", {}, {
      rolePermissionCatalog,
      scopeAssignments: activeScopeAssignments,
    });
  const entries = settingsData?.[0] ?? [];
  const providerHealth = settingsData?.[1] ?? [];
  const scopeAssignments = settingsData?.[2] ?? [];
  const policySettings = settingsData?.[3];

  return (
    <PageShell title="Cài đặt BO" description="Cấu hình hệ thống, ủy quyền, AI và chính sách quản trị.">
      <div className="space-y-6">
        {canManageDelegation ? (
          <LeadershipDelegationPanel
            delegations={delegations}
            catalog={rolePermissionCatalog}
            projects={projects}
            users={users}
          />
        ) : null}

        {canManageSettings && policySettings ? (
          <>
            <ProviderHealthPanel results={providerHealth} checked={shouldCheckProviders} />
            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Cấu hình AI/Tìm kiếm web</h2>
              <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-950">Nhà cung cấp tìm kiếm</p>
                  <p className="mt-1">{process.env.WEB_SEARCH_PROVIDER || "mock_web"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-950">Nhà cung cấp AI</p>
                  <p className="mt-1">{process.env.AI_PROVIDER || "mock"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-950">Embedding</p>
                  <p className="mt-1">{process.env.AI_EMBEDDING_PROVIDER || "mock"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="font-medium text-slate-950">Nguồn đã đăng ký</p>
                  <p className="mt-1">{entries.filter((entry) => entry.enabled).length} đang bật</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                API key và runtime của provider vẫn cấu hình qua biến môi trường. BO UI quản lý nguồn được phép intake để giữ bước review trước khi đưa vào RAG.
              </p>
            </section>
            <RolePermissionCatalogPanel catalog={rolePermissionCatalog} currentRole={session.user.role} />
            <ScopeAssignmentPanel
              assignments={scopeAssignments}
              catalog={rolePermissionCatalog}
              projects={projects}
              users={users}
            />
            <PolicySettingsPanel catalog={rolePermissionCatalog} settings={policySettings} />
            <SourceRegistrySettingsPanel entries={entries} />
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
