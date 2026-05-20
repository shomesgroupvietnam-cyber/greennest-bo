export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div>
        <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="h-28 animate-pulse rounded-lg border bg-white" key={index} />
        ))}
      </div>
    </section>
  );
}
