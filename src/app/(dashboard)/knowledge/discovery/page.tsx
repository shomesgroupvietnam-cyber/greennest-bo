import { Play, Plus } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import {
  createKnowledgeDiscoveryTopicAction,
  runKnowledgeDiscoveryTopicNowAction,
  updateKnowledgeDiscoveryTopicAction
} from "@/modules/knowledge/actions";
import {
  listKnowledgeDiscoveryRunLogs,
  listKnowledgeDiscoveryTopics
} from "@/modules/knowledge/services/knowledge-discovery-service";
import { getFriendlyExternalSearchErrorMessage } from "@/modules/knowledge/services/knowledge-intake-service";
import {
  KNOWLEDGE_DISCOVERY_FREQUENCIES,
  KNOWLEDGE_DISCOVERY_RUN_STATUSES,
  KNOWLEDGE_MODULES,
  type KnowledgeDiscoveryTopic
} from "@/modules/knowledge/types";

function formatDate(value?: string) {
  if (!value) {
    return "Chua chay";
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function DiscoveryTopicForm({ topic }: { topic?: KnowledgeDiscoveryTopic }) {
  const action = topic ? updateKnowledgeDiscoveryTopicAction.bind(null, topic.id) : createKnowledgeDiscoveryTopicAction;

  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[160px_minmax(220px,1fr)_140px_160px_160px_120px_110px_auto]">
      <select
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        defaultValue={topic?.module ?? "legal"}
        name="module"
      >
        {Object.entries(KNOWLEDGE_MODULES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        defaultValue={topic?.query ?? ""}
        name="query"
        placeholder="VD: quy dinh dat dai du an nha o"
        required
      />
      <select
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        defaultValue={topic?.frequency ?? "manual"}
        name="frequency"
      >
        {Object.entries(KNOWLEDGE_DISCOVERY_FREQUENCIES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={topic?.ownerId ?? ""} name="ownerId" placeholder="Owner ID" />
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        defaultValue={topic?.reviewerId ?? ""}
        name="reviewerId"
        placeholder="Reviewer ID"
      />
      <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
        <input defaultChecked={topic?.enabled ?? true} name="enabled" type="checkbox" />
        Bat
      </label>
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        defaultValue={topic?.maxRetries ?? 3}
        min={0}
        max={10}
        name="maxRetries"
        type="number"
        aria-label="Max retries"
      />
      <Button type="submit" size="sm">
        {topic ? "Luu" : "Tao topic"}
      </Button>
    </form>
  );
}

export default async function KnowledgeDiscoveryPage() {
  const currentUser = await getCurrentUser();
  const canManageDiscovery = can(currentUser, "settings.manage") || can(currentUser, "knowledge.manage_source_registry");

  if (!canManageDiscovery) {
    return (
      <PageShell title="Khong co quyen discovery" description="Ban can quyen quan ly source registry de quan ly discovery topic.">
        <UnauthorizedState backHref="/knowledge" backLabel="Ve Knowledge Center" title="Ban khong co quyen quan ly discovery topic" />
      </PageShell>
    );
  }

  const [topics, runLogs] = await Promise.all([listKnowledgeDiscoveryTopics(), listKnowledgeDiscoveryRunLogs()]);

  return (
    <PageShell
      title="Discovery topic"
      description="Cau hinh chu de tim nguon dinh ky cho Knowledge Center. Sprint nay chi co Run Now thu cong, chua co cron."
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tao discovery topic
          </div>
          <DiscoveryTopicForm />
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Topic dang quan ly</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/knowledge/intake">Intake thu cong</Link>
            </Button>
          </div>
          {topics.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-sm text-slate-600">Chua co discovery topic. Tao topic dau tien de chay Run Now.</div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <article className="space-y-3 rounded-lg border bg-white p-4 shadow-sm" key={topic.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{topic.query}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {topic.module} · {KNOWLEDGE_DISCOVERY_FREQUENCIES[topic.frequency]} ·{" "}
                        {topic.enabled ? "Dang bat" : "Dang tat"} · {KNOWLEDGE_DISCOVERY_RUN_STATUSES[topic.lastRunStatus]}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Lan chay gan nhat: {formatDate(topic.lastRunAt)}</p>
                      {topic.lastRunStatus === "failed" ? (
                        <p className="mt-1 text-xs text-red-600">
                          Retry {topic.retryCount}/{topic.maxRetries}
                          {topic.nextRetryAt ? ` · Lan retry tiep theo: ${formatDate(topic.nextRetryAt)}` : ""}{" "}
                          {topic.errorMessage ? ` · ${getFriendlyExternalSearchErrorMessage({ message: topic.errorMessage, code: topic.errorCode })}` : ""}
                        </p>
                      ) : null}
                      {topic.lockedAt ? <p className="mt-1 text-xs text-amber-600">Dang lock boi {topic.lockedBy ?? "scheduler"} tu {formatDate(topic.lockedAt)}</p> : null}
                    </div>
                    <form action={runKnowledgeDiscoveryTopicNowAction.bind(null, topic.id)}>
                      <Button type="submit" size="sm" disabled={!topic.enabled}>
                        <Play className="h-4 w-4" aria-hidden="true" />
                        Run Now
                      </Button>
                    </form>
                  </div>
                  <DiscoveryTopicForm topic={topic} />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Discovery run log</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Query</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ket qua</th>
                  <th className="px-3 py-2">Import</th>
                  <th className="px-3 py-2">Duplicate</th>
                  <th className="px-3 py-2">Disallowed</th>
                  <th className="px-3 py-2">Thoi gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runLogs.slice(0, 12).map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{log.query}</td>
                    <td className="px-3 py-2 text-slate-600">{log.provider}</td>
                    <td className="px-3 py-2 text-slate-600">{KNOWLEDGE_DISCOVERY_RUN_STATUSES[log.status]}</td>
                    <td className="px-3 py-2 text-slate-600">{log.resultCount}</td>
                    <td className="px-3 py-2 text-slate-600">{log.importedCount}</td>
                    <td className="px-3 py-2 text-slate-600">{log.skippedDuplicateCount}</td>
                    <td className="px-3 py-2 text-slate-600">{log.skippedDisallowedCount}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(log.finishedAt)}</td>
                  </tr>
                ))}
                {runLogs.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                      Chua co run log.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
