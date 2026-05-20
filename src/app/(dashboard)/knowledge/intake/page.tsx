import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { importExternalSourceCandidateAction } from "@/modules/knowledge/actions";
import {
  getFriendlyExternalSearchErrorMessage,
  listExternalSearchLogs,
  runExternalSourceSearch
} from "@/modules/knowledge/services/knowledge-intake-service";
import type { ExternalSourceCandidate } from "@/modules/knowledge/types";
import { listSourceRegistryEntries } from "@/modules/settings/services/source-registry-settings-service";

type KnowledgeIntakePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function CandidateImportForm({ candidate }: { candidate: ExternalSourceCandidate }) {
  return (
    <form action={importExternalSourceCandidateAction}>
      <input type="hidden" name="candidateId" value={candidate.id} />
      <input type="hidden" name="title" value={candidate.title} />
      <input type="hidden" name="url" value={candidate.url} />
      <input type="hidden" name="provider" value={candidate.provider} />
      <input type="hidden" name="publishedAt" value={candidate.publishedAt ?? ""} />
      <input type="hidden" name="retrievedAt" value={candidate.retrievedAt} />
      <input type="hidden" name="snippet" value={candidate.snippet} />
      <input type="hidden" name="sourceType" value={candidate.sourceType} />
      <input type="hidden" name="confidence" value={candidate.confidence} />
      <input type="hidden" name="module" value={candidate.module} />
      <input type="hidden" name="tags" value={candidate.tags.join(",")} />
      <Button type="submit" size="sm">
        Tao candidate
      </Button>
    </form>
  );
}

export default async function KnowledgeIntakePage({ searchParams }: KnowledgeIntakePageProps) {
  const params = searchParams ? await searchParams : {};
  const currentUser = await getCurrentUser();
  const canIntake = can(currentUser, "knowledge.create_candidate") || can(currentUser, "knowledge.review");

  if (!canIntake) {
    return (
      <PageShell title="Khong co quyen intake" description="Ban can quyen tao hoac review Knowledge Center de dung intake.">
        <UnauthorizedState backHref="/knowledge" backLabel="Ve Knowledge Center" title="Ban khong co quyen intake nguon tri thuc" />
      </PageShell>
    );
  }

  const query = readParam(params.query)?.trim() ?? "";
  let searchResult: Awaited<ReturnType<typeof runExternalSourceSearch>> | undefined;
  let searchError: string | undefined;

  if (query) {
    try {
      searchResult = await runExternalSourceSearch({ user: currentUser, query, limit: 6 });
    } catch (error) {
      searchError = getFriendlyExternalSearchErrorMessage(error);
    }
  }
  const logs = await listExternalSearchLogs();
  const registry = await listSourceRegistryEntries();

  return (
    <PageShell
      title="Intake nguon tri thuc"
      description="Tim nguon ben ngoai qua provider duoc cau hinh, chuan hoa thanh ung vien va dua vao hang review thu cong. Ket qua search khong di thang vao RAG."
    >
      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              defaultValue={query}
              name="query"
              placeholder="VD: quy dinh dat dai, quy chuan xay dung, ho so thanh toan..."
              required
            />
            <Button type="submit">
              <Search className="h-4 w-4" aria-hidden="true" />
              Tim nguon
            </Button>
          </form>
          <p className="mt-3 text-sm text-slate-600">
            Local mac dinh dung mock provider; staging/production co the cau hinh Tavily. Nguon import se thanh <strong>Knowledge Candidate</strong> cho review, chua phai Knowledge Item va khong duoc index/RAG cho den khi promote, review va duyet.
          </p>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Source registry</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {registry.map((entry) => (
              <article className="rounded-md border bg-slate-50 p-3 text-sm" key={entry.domain}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-950">{entry.domain}</p>
                  <span className={entry.enabled ? "text-xs font-medium text-emerald-700" : "text-xs font-medium text-slate-500"}>
                    {entry.enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">
                  {entry.module} · {entry.sourceType} · {entry.confidence}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Ung vien tim thay</h2>
          {!searchResult ? <p className="mt-3 text-sm text-slate-600">Nhap tu khoa de chay intake.</p> : null}
          {searchError ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p>{searchError}</p>
            </div>
          ) : null}
          {searchResult ? (
            <div className="mt-4 space-y-3">
              {searchResult.candidates.map((candidate) => (
                <article className="rounded-md border p-4" key={candidate.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-950">{candidate.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{candidate.snippet}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{candidate.module}</span>
                        <span>{candidate.sourceType}</span>
                        <span>{candidate.confidence}</span>
                        <span>{candidate.provider}</span>
                      </div>
                      <a className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-700" href={candidate.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        Mo nguon
                      </a>
                    </div>
                    <CandidateImportForm candidate={candidate} />
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Log search gan day</h2>
            <Button asChild variant="outline">
              <Link href="/knowledge/candidates">Candidate queue</Link>
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Query</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Ket qua</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Thoi gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{log.query}</td>
                    <td className="px-3 py-2 text-slate-600">{log.provider}</td>
                    <td className="px-3 py-2 text-slate-600">{log.resultCount}</td>
                    <td className="px-3 py-2 text-slate-600">{log.userId}</td>
                    <td className="px-3 py-2 text-slate-600">{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
