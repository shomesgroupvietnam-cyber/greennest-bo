import { requireAuthenticatedSession } from "@/lib/permissions/guard";
import { CommandCenterDashboard } from "@/modules/command-center/components/command-center-dashboard";
import { getCommandCenterData } from "@/modules/command-center/services/command-center-service";

export const dynamic = "force-dynamic";

type CommandCenterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveInitialView(
  params: Record<string, string | string[] | undefined>,
) {
  const view = params.view;

  return Array.isArray(view) ? view[0] : view;
}

export default async function CommandCenterPage({
  searchParams,
}: CommandCenterPageProps) {
  const session = await requireAuthenticatedSession({ route: "/command-center" });
  const params = searchParams ? await searchParams : {};
  const data = await getCommandCenterData(session.user);

  return (
    <CommandCenterDashboard
      data={data}
      initialView={resolveInitialView(params)}
      user={session.user}
    />
  );
}
