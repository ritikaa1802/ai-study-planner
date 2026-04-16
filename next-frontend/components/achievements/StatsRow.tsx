import { CheckSquare2, Clock3, Flame, Focus, Goal } from "lucide-react";
import type { AchievementStats } from "../../types/achievements";

type StatsRowProps = {
  loading: boolean;
  stats?: AchievementStats;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export function StatsRow({ loading, stats }: StatsRowProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        ))}
      </section>
    );
  }

  const safeStats = stats ?? {
    totalTasksDone: 0,
    currentStreak: 0,
    totalFocusSessions: 0,
    goalsCompleted: 0,
    totalStudyMinutes: 0,
  };

  const items = [
    { label: "Tasks Done", value: `${safeStats.totalTasksDone}`, icon: CheckSquare2 },
    { label: "Current Streak", value: `${safeStats.currentStreak}`, icon: Flame },
    { label: "Focus Sessions", value: `${safeStats.totalFocusSessions}`, icon: Focus },
    { label: "Goals Completed", value: `${safeStats.goalsCompleted}`, icon: Goal },
    { label: "Study Minutes", value: formatMinutes(safeStats.totalStudyMinutes), icon: Clock3 },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
          </div>
        );
      })}
    </section>
  );
}
