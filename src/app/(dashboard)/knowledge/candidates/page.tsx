import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { createKnowledgeCandidateAction } from "@/modules/knowledge/actions";
import { KnowledgeCandidateForm } from "@/modules/knowledge/components/knowledge-candidate-form";
import { KnowledgeCandidateListTable } from "@/modules/knowledge/components/knowledge-candidate-list-table";
import { listKnowledgeCandidates } from "@/modules/knowledge/services/knowledge-candidate-service";
import {
  KNOWLEDGE_CANDIDATE_SOURCE_TYPES,
  KNOWLEDGE_CANDIDATE_STATUSES,
  KNOWLEDGE_MODULES,
  type KnowledgeCandidateSourceType,
  type KnowledgeCandidateStatus,
  type KnowledgeModule
} from "@/modules/knowledge/types";

type KnowledgeCandidatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function KnowledgeCandidatesPage({ searchParams }: KnowledgeCandidatesPageProps) {
  const params = searchParams ? await searchParams : {};
  const currentUser = await getCurrentUser();

  if (!can(currentUser, "knowledge.view")) {
    return (
      <PageShell title="KhÃ´ng cÃ³ quyá»n truy cáº­p" description="Báº¡n cáº§n quyá»n xem Knowledge Center Ä‘á»ƒ má»Ÿ candidate queue.">
        <UnauthorizedState backHref="/dashboard" backLabel="Vá» dashboard" title="Báº¡n khÃ´ng cÃ³ quyá»n xem Knowledge Candidate" />
      </PageShell>
    );
  }

  const selectedModule = (readParam(params.module) ?? "all") as KnowledgeModule | "all";
  const sourceType = (readParam(params.sourceType) ?? "all") as KnowledgeCandidateSourceType | "all";
  const status = (readParam(params.status) ?? "all") as KnowledgeCandidateStatus | "all";
  const query = readParam(params.query) ?? "";
  const candidates = await listKnowledgeCandidates({ module: selectedModule, sourceType, status, query });
  const canCreateCandidate = can(currentUser, "knowledge.create_candidate");

  return (
    <PageShell
      title="Knowledge Candidate"
      description="HÃ ng Ä‘á»£i nguá»“n/insight tá»« chat, AI output, search, upload, meeting, report vÃ  document. Candidate khÃ´ng Ä‘Æ°á»£c Ä‘Æ°a vÃ o RAG tá»± Ä‘á»™ng."
    >
      <Button asChild variant="ghost">
        <Link href="/knowledge">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Knowledge Center
        </Link>
      </Button>

      <form className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm lg:grid-cols-[minmax(180px,1fr)_180px_170px_minmax(180px,1fr)_auto]">
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={selectedModule} name="module">
          <option value="all">Táº¥t cáº£ module</option>
          {Object.entries(KNOWLEDGE_MODULES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={sourceType} name="sourceType">
          <option value="all">Táº¥t cáº£ nguá»“n</option>
          {Object.entries(KNOWLEDGE_CANDIDATE_SOURCE_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" defaultValue={status} name="status">
          <option value="all">Táº¥t cáº£ tráº¡ng thÃ¡i</option>
          {Object.entries(KNOWLEDGE_CANDIDATE_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={query}
          name="query"
          placeholder="TÃ¬m tiÃªu Ä‘á», ná»™i dung..."
        />
        <Button type="submit" variant="secondary">
          Lá»c
        </Button>
      </form>

      <KnowledgeCandidateListTable candidates={candidates} />

      {canCreateCandidate ? <KnowledgeCandidateForm action={createKnowledgeCandidateAction} /> : null}
    </PageShell>
  );
}
