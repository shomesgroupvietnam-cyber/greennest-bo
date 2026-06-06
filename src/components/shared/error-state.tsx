import type { ReactNode } from "react";
import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
  description: string;
  rawErrorForLogging?: unknown;
  title: string;
};

export function ErrorState({
  action,
  backHref,
  backLabel = "Quay lai",
  description,
  title,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-red-200 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p>
      {action || backHref ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {action}
          {backHref ? (
            <Button asChild variant="outline">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
