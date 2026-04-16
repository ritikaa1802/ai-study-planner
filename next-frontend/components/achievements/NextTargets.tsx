import { Target } from "lucide-react";
import type { NextClosestAchievement } from "../../types/achievements";
import { CATEGORY_THEME, normalizeCategory } from "../../types/achievements";

type NextTargetsProps = {
  loading: boolean;
  targets: NextClosestAchievement[];
};

export function NextTargets({ loading, targets }: NextTargetsProps) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Next Targets</h3>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Closest achievements to unlock.</p>

      <div className="mt-4 space-y-3">
        {targets.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            All visible achievements unlocked. Nice work.
          </div>
        )}

        {targets.map((target) => {
          const theme = CATEGORY_THEME[normalizeCategory(target.category)];
          const progress = Math.max(0, Math.min(100, target.progressPercentage));

          return (
            <article
              key={target.key}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40"
              style={{ borderLeftWidth: 4 }}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{target.name}</p>
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{target.category}</p>
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {target.currentValue}/{target.threshold}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={`h-full rounded-full ${theme.accent}`} style={{ width: `${progress}%` }} />
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{target.remainingLabel}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
