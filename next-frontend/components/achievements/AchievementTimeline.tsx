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
      <section className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/25">
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-violet-100 dark:bg-violet-900/40" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-violet-100 dark:bg-violet-900/40" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/25">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-violet-700 dark:text-violet-300" />
        <h3 className="text-base font-semibold text-violet-950 dark:text-violet-100">Stone Trail</h3>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-lg border border-dashed border-violet-300 px-3 py-5 text-sm text-violet-700 dark:border-violet-700/50 dark:text-violet-300">
          No unlock activity yet.
        </div>
      ) : (
        <ol className="relative pl-5">
          <span className="absolute left-[5px] top-1 h-[calc(100%-0.75rem)] w-[3px] rounded-full bg-gradient-to-b from-violet-300 via-indigo-300 to-violet-300 dark:from-violet-700 dark:via-indigo-700 dark:to-violet-700" />
          {timeline.map((item) => {
            const theme = CATEGORY_THEME[normalizeCategory(item.category)];

            return (
              <li key={`${item.id}-${item.unlockedAt}`} className="relative pb-5 last:pb-0">
                <span className="absolute -left-1 top-2 h-3.5 w-3.5 rounded-full border-2 border-violet-200 bg-violet-500 dark:border-violet-900 dark:bg-violet-400" />
                <div className="rounded-2xl border border-violet-300/70 bg-gradient-to-br from-violet-100/90 via-indigo-100/90 to-violet-50 px-3 py-2 shadow-[0_8px_20px_rgba(76,29,149,0.10)] dark:border-violet-800/70 dark:from-violet-900/70 dark:via-indigo-900/60 dark:to-violet-950/65">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">{item.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${theme.soft} ${theme.text}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-violet-700 dark:text-violet-300">{getRelativeTime(item.unlockedAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
