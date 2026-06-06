import React from "react";

type LoadingStateProps = {
  description?: string;
  title: string;
};

export function LoadingState({ description, title }: LoadingStateProps) {
  return (
    <div
      aria-label={title}
      aria-live="polite"
      className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center"
      role="status"
    >
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{description}</p>
      ) : null}
      <div className="mx-auto mt-5 grid max-w-xl gap-2" aria-hidden="true">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}
