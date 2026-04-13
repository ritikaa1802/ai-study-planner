import { PlannerTask } from "./types";
import { PriorityBadge } from "./PriorityBadge";

interface TaskCardProps {
  task: PlannerTask;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</h5>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
      <div className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        Est. {task.estimatedTime}
      </div>
    </div>
  );
}
