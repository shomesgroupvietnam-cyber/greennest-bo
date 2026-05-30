import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Project } from "@/modules/projects/types";
import { PROPOSAL_PRIORITIES, PROPOSAL_TYPES } from "@/modules/proposals/types";
import type { LeadershipDelegation } from "@/modules/settings/types";

type ProposalFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  canCreateDirect?: boolean;
  delegations?: LeadershipDelegation[];
  projects: Project[];
};

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function delegationScopeLabel(delegation: LeadershipDelegation, projects: Project[]) {
  const projectLabel = delegation.projectId
    ? delegation.projectId === "*"
      ? "tat ca project"
      : projects.find((project) => project.id === delegation.projectId)?.name ?? delegation.projectId
    : "khong gan project";

  return [
    `thay ${delegation.principalUserId}`,
    projectLabel,
    delegation.moduleId ? `module ${delegation.moduleId}` : undefined,
  ].filter(Boolean).join(" / ");
}

export function ProposalForm({
  action,
  canCreateDirect = true,
  delegations = [],
  projects,
}: ProposalFormProps) {
  const canCreateOnBehalf = delegations.length > 0;

  return (
    <form action={action} className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Ten de xuat <span className="text-red-600">*</span>
          <input className={fieldClass} name="title" placeholder="VD: De xuat phe duyet ho so thanh toan dot 1" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Loai de xuat
          <select className={fieldClass} name="type" defaultValue="general">
            {Object.entries(PROPOSAL_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Du an lien quan
          <select className={fieldClass} name="projectId" defaultValue="">
            <option value="">Khong gan du an</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} - {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Muc uu tien
          <select className={fieldClass} name="priority" defaultValue="normal">
            {Object.entries(PROPOSAL_PRIORITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Gia tri neu co
          <input className={fieldClass} name="amount" min="0" type="number" placeholder="VD: 500000000" />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Han xu ly
          <input className={fieldClass} name="dueDate" type="date" />
        </label>
        {canCreateOnBehalf ? (
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Tao thay lanh dao
            <select
              className={fieldClass}
              name="onBehalfOf"
              defaultValue={canCreateDirect ? "" : delegations[0]?.principalUserId}
              required={!canCreateDirect}
            >
              {canCreateDirect ? <option value="">Tao voi quyen cua toi</option> : null}
              {delegations.map((delegation) => (
                <option key={delegation.id} value={delegation.principalUserId}>
                  {delegationScopeLabel(delegation, projects)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <label className="space-y-2 text-sm font-medium text-slate-700">
        Noi dung tom tat
        <textarea className={`${fieldClass} min-h-28`} name="summary" placeholder="Neu ly do, can cu, ho so lien quan va mong muon phe duyet." />
      </label>
      <input type="hidden" name="module" value="proposal" />
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Tao de xuat</Button>
        <Button asChild variant="outline">
          <Link href="/proposals">Huy</Link>
        </Button>
      </div>
    </form>
  );
}
