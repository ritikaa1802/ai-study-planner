import { Star, Trophy } from "lucide-react";

type LevelBadgeProps = {
  loading: boolean;
  userLevel: 1 | 2 | 3;
  totalPoints: number;
  totalUnlockedCount: number;
};

const getLevelProgress = (points: number) => {
  if (points < 100) {
    return { progress: Math.min(100, Math.round((points / 100) * 100)), current: points, target: 100, label: `${100 - points} pts to Level 2` };
  }

  if (points < 300) {
    return {
      progress: Math.min(100, Math.round(((points - 100) / 200) * 100)),
      current: points - 100,
      target: 200,
      label: `${300 - points} pts to Level 3`,
    };
  }

  return { progress: 100, current: 300, target: 300, label: "Max level" };
};

export function LevelBadge({ loading, userLevel, totalPoints, totalUnlockedCount }: LevelBadgeProps) {
  if (loading) {
    return <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />;
  }

  const { progress, label } = getLevelProgress(totalPoints);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profile Level</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Level {userLevel}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{totalPoints} total points</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Trophy className="h-4 w-4" />
          {totalUnlockedCount} unlocked
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />XP Progress</span>
          <span>{label}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
