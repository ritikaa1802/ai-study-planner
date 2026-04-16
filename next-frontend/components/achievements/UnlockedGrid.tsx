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
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 h-6 w-52 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Unlocked Achievements</h3>
      </div>

      {unlockedAchievements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No achievements unlocked yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {unlockedAchievements.map((achievement) => {
            const category = normalizeCategory(achievement.category);
            const theme = CATEGORY_THEME[category];

            return (
              <article key={achievement.id} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                <span className="absolute right-3 top-3 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  +{achievement.points}
                </span>

                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg" title={achievement.category}>
                  {theme.emoji}
                </div>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{achievement.name}</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{achievement.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${theme.soft} ${theme.text}`}>{achievement.category}</span>
                  <span className="text-slate-500 dark:text-slate-400">Unlocked {formatDate(achievement.unlockedAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Locked-card style example (only used if you decide to render locked items here) */}
      <div className="hidden rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <div className="relative overflow-hidden rounded-md bg-slate-100 p-3 dark:bg-slate-800">
          <div className="absolute inset-0 bg-slate-200/60 dark:bg-slate-900/70" />
          <div className="relative flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Lock className="h-4 w-4" />
            Locked achievement
          </div>
        </div>
      </div>
    </section>
  );
}
