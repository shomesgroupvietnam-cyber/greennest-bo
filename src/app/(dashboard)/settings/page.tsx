import { PageShell } from "@/components/shared/page-shell";
import { requirePermission } from "@/lib/permissions/guard";
import { ProviderHealthPanel } from "@/modules/settings/components/provider-health-panel";
import { SourceRegistrySettingsPanel } from "@/modules/settings/components/source-registry-settings-panel";
import { checkAllProviderHealth } from "@/modules/settings/services/provider-health-service";
import { listSourceRegistryEntries } from "@/modules/settings/services/source-registry-settings-service";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requirePermission("settings.manage", { route: "/settings" });
  const params = searchParams ? await searchParams : {};
  const shouldCheckProviders = readParam(params.checkProviders) === "1";
  const [entries, providerHealth] = await Promise.all([
    listSourceRegistryEntries(),
    checkAllProviderHealth({ runLiveChecks: shouldCheckProviders }),
  ]);

  return (
    <PageShell title="Cài đặt BO" description="Cấu hình hệ thống, nguồn tri thức, AI và chính sách quản trị.">
      <div className="space-y-6">
          <ProviderHealthPanel results={providerHealth} checked={shouldCheckProviders} />
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Cấu hình AI/Web Search</h2>
            <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-950">Provider search</p>
                <p className="mt-1">{process.env.WEB_SEARCH_PROVIDER || "mock_web"}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-950">Provider AI</p>
                <p className="mt-1">{process.env.AI_PROVIDER || "mock"}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-950">Embedding</p>
                <p className="mt-1">{process.env.AI_EMBEDDING_PROVIDER || "mock"}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-950">Registry entries</p>
                <p className="mt-1">{entries.filter((entry) => entry.enabled).length} enabled</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              API key và provider runtime vẫn đặt qua environment variables. BO UI hiện quản lý nguồn được phép intake để bảo toàn review gate trước khi vào RAG.
            </p>
          </section>
        <SourceRegistrySettingsPanel entries={entries} />
      </div>
    </PageShell>
  );
}
