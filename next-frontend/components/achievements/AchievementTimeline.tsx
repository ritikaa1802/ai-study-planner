import { Clock3 } from "lucide-react";
import type { UnlockedAchievement } from "../../types/achievements";
import { CATEGORY_THEME, normalizeCategory } from "../../types/achievements";

type AchievementTimelineProps = {
  loading: boolean;
  timeline: UnlockedAchievement[];
};

const getRelativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, now - then);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return `${m} min${m > 1 ? "s" : ""} ago`;
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return `${h} hour${h > 1 ? "s" : ""} ago`;
  }

  const d = Math.floor(diffMs / day);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

export function AchievementTimeline({ loading, timeline }: AchievementTimelineProps) {
  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Achievement Timeline</h3>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No unlock activity yet.
        </div>
      ) : (
        <ol className="relative border-slate-200 pl-4 dark:border-slate-700">
          {timeline.map((item) => {
            const theme = CATEGORY_THEME[normalizeCategory(item.category)];

            return (
              <li key={`${item.id}-${item.unlockedAt}`} className="relative pb-5 last:pb-0">
                <span className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="absolute -left-[9px] top-4 h-[calc(100%-0.25rem)] w-px bg-slate-200 dark:bg-slate-700" />
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${theme.soft} ${theme.text}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getRelativeTime(item.unlockedAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
