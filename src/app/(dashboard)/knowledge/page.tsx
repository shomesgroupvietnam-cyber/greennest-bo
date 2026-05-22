import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/guard";
import { KnowledgeListTable } from "@/modules/knowledge/components/knowledge-list-table";
import { listKnowledgeItems } from "@/modules/knowledge/services/knowledge-service";
import {
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_MODULES,
  KNOWLEDGE_SOURCE_TYPES,
  KNOWLEDGE_STATUSES,
  type KnowledgeConfidence,
  type KnowledgeModule,
  type KnowledgeSourceType,
  type KnowledgeStatus
} from "@/modules/knowledge/types";

type KnowledgePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function KnowledgePage({ searchParams }: KnowledgePageProps) {
  const params = searchParams ? await searchParams : {};
  const session = await requirePermission("knowledge.view", { route: "/knowledge" });
  const currentUser = session.user;

  const selectedModule = (readParam(params.module) ?? "all") as KnowledgeModule | "all";
  const sourceType = (readParam(params.sourceType) ?? "all") as KnowledgeSourceType | "all";
  const status = (readParam(params.status) ?? "all") as KnowledgeStatus | "all";
  const confidence = (readParam(params.confidence) ?? "all") as KnowledgeConfidence | "all";
  const query = readParam(params.query) ?? "";
  const items = await listKnowledgeItems({ module: selectedModule, sourceType, status, confidence, query });
  const canCreate = can(currentUser, "knowledge.create");
  const canReview = can(currentUser, "knowledge.review");
  const canManageDiscovery = can(currentUser, "settings.manage") || can(currentUser, "knowledge.manage_source_registry");

  return (
    <PageShell
      title="Knowledge Center"
      description="Quản trị nguồn tri thức đã nhập, trạng thái review, hiệu lực và điều kiện đưa vào RAG tương lai."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="grid flex-1 gap-3 rounded-lg border bg-white p-4 shadow-sm xl:grid-cols-[minmax(180px,1fr)_180px_170px_180px_minmax(180px,1fr)_auto]">
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={selectedModule} name="module">
            <option value="all">Tất cả module</option>
            {Object.entries(KNOWLEDGE_MODULES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={sourceType} name="sourceType">
            <option value="all">Tất cả loại nguồn</option>
            {Object.entries(KNOWLEDGE_SOURCE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={status} name="status">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(KNOWLEDGE_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={confidence} name="confidence">
            <option value="all">Tất cả độ tin cậy</option>
            {Object.entries(KNOWLEDGE_CONFIDENCE_LEVELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={query}
            name="query"
            placeholder="Tìm tên, tóm tắt, tag..."
          />
          <Button type="submit" variant="secondary">
            Lọc
          </Button>
        </form>
        {canCreate || canReview ? (
          <Button asChild variant="outline">
            <Link href="/knowledge/intake">
              <Search className="h-4 w-4" aria-hidden="true" />
              Intake
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/knowledge/candidates">Candidate</Link>
        </Button>
        {canManageDiscovery ? (
          <Button asChild variant="outline">
            <Link href="/knowledge/discovery">Discovery</Link>
          </Button>
        ) : null}
        {canCreate ? (
          <Button asChild>
            <Link href="/knowledge/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm nguồn
            </Link>
          </Button>
        ) : null}
      </div>

      <KnowledgeListTable canCreate={canCreate} canReview={canReview} items={items} />
    </PageShell>
  );
}
