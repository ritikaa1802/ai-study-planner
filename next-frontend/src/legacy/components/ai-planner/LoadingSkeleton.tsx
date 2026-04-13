export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-1/4 rounded-lg bg-slate-200 dark:bg-slate-800" />

      {[1, 2, 3].map((week) => (
        <div key={week} className="glass-card p-5">
          <div className="mb-3 h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mb-4 h-6 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mb-5 h-2.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
