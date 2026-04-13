import { PlannerWeek } from "./types";
import { TaskCard } from "./TaskCard";

interface WeekCardProps {
  week: PlannerWeek;
  isOpen: boolean;
  onToggle: () => void;
}

export function WeekCard({ week, isOpen, onToggle }: WeekCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">Week {week.week}</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{week.focusArea}</h4>
        </div>

        <div className="flex w-44 items-center gap-3">
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700"
              style={{ width: `${Math.max(8, Math.min(100, week.intensity))}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{week.intensity}%</span>
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-slate-200/80 px-5 py-5 dark:border-slate-800">
            {week.days.map((day) => (
              <section key={day.day} className="animate-in-up">
                <h5 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{day.day}</h5>
                <div className="grid gap-3 md:grid-cols-2">
                  {day.tasks.map((task, index) => (
                    <TaskCard key={`${day.day}-${index}-${task.title}`} task={task} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
