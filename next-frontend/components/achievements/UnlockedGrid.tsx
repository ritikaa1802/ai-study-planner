import { Gift, Lock } from "lucide-react";
import type { UnlockedAchievement } from "../../types/achievements";
import { CATEGORY_THEME, normalizeCategory } from "../../types/achievements";

type UnlockedGridProps = {
  loading: boolean;
  unlockedAchievements: UnlockedAchievement[];
};

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function UnlockedGrid({ loading, unlockedAchievements }: UnlockedGridProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/25">
        <div className="mb-4 h-6 w-56 animate-pulse rounded bg-violet-100 dark:bg-violet-900/40" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[1.75rem] bg-violet-100 dark:bg-violet-900/40" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-200/70 bg-violet-50/70 p-5 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/25">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-4 w-4 text-violet-700 dark:text-violet-300" />
        <h3 className="text-base font-semibold text-violet-950 dark:text-violet-100">Unlocked Achievements Path</h3>
      </div>

      {unlockedAchievements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-violet-300 px-4 py-8 text-center text-sm text-violet-700 dark:border-violet-700/50 dark:text-violet-300">
          No achievements unlocked yet.
        </div>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute left-1/2 top-2 hidden h-[calc(100%-1rem)] w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-300 via-indigo-300 to-violet-300 md:block dark:from-violet-700 dark:via-indigo-700 dark:to-violet-700" />

          <div className="space-y-5">
            {unlockedAchievements.map((achievement, index) => {
            const category = normalizeCategory(achievement.category);
            const theme = CATEGORY_THEME[category];
            const rightAligned = index % 2 === 1;

            return (
              <div key={achievement.id} className={`relative flex justify-center ${rightAligned ? "md:justify-end" : "md:justify-start"}`}>
                <span className="absolute left-1/2 top-1/2 z-10 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-200 bg-violet-500 md:block dark:border-violet-900 dark:bg-violet-400" />
                <article className="w-full md:w-[88%] rounded-[1.75rem] border border-violet-300/70 bg-gradient-to-br from-violet-100/90 via-indigo-100/90 to-violet-50 p-4 shadow-[0_10px_30px_rgba(76,29,149,0.10)] dark:border-violet-800/70 dark:from-violet-900/70 dark:via-indigo-900/60 dark:to-violet-950/65">
                  <span className="absolute right-3 top-3 rounded-full bg-violet-200 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-800/70 dark:text-violet-100">
                    +{achievement.points}
                  </span>

                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-lg shadow-sm dark:bg-violet-950/70" title={achievement.category}>
                    {theme.emoji}
                  </div>

                  <h4 className="pr-14 text-sm font-semibold text-violet-950 dark:text-violet-100">{achievement.name}</h4>
                  <p className="mt-1 text-xs text-violet-800/90 dark:text-violet-200/90">{achievement.description}</p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${theme.soft} ${theme.text}`}>{achievement.category}</span>
                    <span className="text-violet-700 dark:text-violet-300">Unlocked {formatDate(achievement.unlockedAt)}</span>
                  </div>
                </article>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Locked-card style example (only used if you decide to render locked items here) */}
      <div className="hidden rounded-lg border border-dashed border-violet-300 p-4 dark:border-violet-700/50">
        <div className="relative overflow-hidden rounded-md bg-violet-100 p-3 dark:bg-violet-900/40">
          <div className="absolute inset-0 bg-violet-200/60 dark:bg-violet-950/70" />
          <div className="relative flex items-center justify-center gap-2 text-sm text-violet-700 dark:text-violet-300">
            <Lock className="h-4 w-4" />
            Locked achievement
          </div>
        </div>
      </div>
    </section>
  );
}
