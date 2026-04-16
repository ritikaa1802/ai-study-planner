import type { CategoryProgressItem } from "../../types/achievements";
import { CATEGORY_ORDER, CATEGORY_THEME, normalizeCategory } from "../../types/achievements";

type CategoryProgressProps = {
  loading: boolean;
  categoryProgress: CategoryProgressItem[];
};

export function CategoryProgress({ loading, categoryProgress }: CategoryProgressProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />;
  }

  const progressMap = new Map(categoryProgress.map((item) => [item.category, item.progressPercentage]));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Category Progress</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Progress by achievement category.</p>

      <div className="mt-5 space-y-4">
        {CATEGORY_ORDER.map((category) => {
          const value = Math.max(0, Math.min(100, progressMap.get(category) ?? 0));
          const theme = CATEGORY_THEME[normalizeCategory(category)];

          return (
            <div key={category}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className={`font-semibold capitalize ${theme.text}`}>{category}</span>
                <span className="text-slate-500 dark:text-slate-400">{value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={`h-full rounded-full ${theme.accent}`} style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
