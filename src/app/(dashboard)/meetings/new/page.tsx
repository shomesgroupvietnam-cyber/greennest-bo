import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageShell } from "@/components/shared/page-shell";
import { UnauthorizedState } from "@/components/shared/unauthorized-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { listScopedProjects } from "@/lib/permissions/scoped-resources";
import { createMeetingAction } from "@/modules/meetings/actions";
import { MeetingForm } from "@/modules/meetings/components/meeting-form";

type NewMeetingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewMeetingPage({ searchParams }: NewMeetingPageProps) {
  const currentUser = await getCurrentUser();
  const params = searchParams ? await searchParams : {};
  const defaultProjectId = readParam(params.projectId);
  const projects = await listScopedProjects(currentUser);

  return (
    <PageShell title="Táº¡o biÃªn báº£n há»p" description="Ghi nháº­n cuá»™c há»p theo dá»± Ã¡n vÃ  chuáº©n bá»‹ action item cÃ³ tráº¡ch nhiá»‡m rÃµ rÃ ng.">
      {!can(currentUser, "meeting.create") ? (
        <UnauthorizedState backHref="/meetings" backLabel="Vá» danh sÃ¡ch há»p" title="Báº¡n khÃ´ng cÃ³ quyá»n táº¡o cuá»™c há»p" />
      ) : projects.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/projects/new">Táº¡o dá»± Ã¡n</Link>
            </Button>
          }
          description="Cuá»™c há»p pháº£i gáº¯n vá»›i má»™t dá»± Ã¡n trong pháº¡m vi cá»§a báº¡n."
          title="Cáº§n cÃ³ dá»± Ã¡n trÆ°á»›c"
        />
      ) : (
        <MeetingForm
          action={createMeetingAction}
          defaultProjectId={defaultProjectId}
          projects={projects}
          submitLabel="Táº¡o biÃªn báº£n há»p"
        />
      )}
    </PageShell>
  );
}
