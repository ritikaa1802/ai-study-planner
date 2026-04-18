import { useEffect, useState } from "react";
import { Theme } from "../types";
import { LoadingSkeleton } from "../components/ai-planner/LoadingSkeleton";
import { Toast } from "../components/ai-planner/Toast";
import { WeekCard } from "../components/ai-planner/WeekCard";
import { PlannerDay, PlannerResponse, PlannerTask, PlannerWeek, Priority } from "../components/ai-planner/types";
import { apiFetch } from "../utils/api";

const MOCK_PLAN: PlannerResponse = {
  goalTitle: "Web Dev in 30 Days",
  duration: "4 weeks",
  weeks: [
    {
      week: 1,
      focusArea: "HTML, CSS, and fundamentals",
      intensity: 60,
      days: [
        {
          day: "Day 1",
          tasks: [
            {
              title: "Semantic HTML deep dive",
              description: "Build a clean landing page layout with semantic tags and accessibility roles.",
              estimatedTime: "90 min",
              priority: "high",
            },
            {
              title: "CSS layout systems",
              description: "Practice Flexbox and Grid by recreating a hero + feature section.",
              estimatedTime: "75 min",
              priority: "medium",
            },
          ],
        },
      ],
    },
    {
      week: 2,
      focusArea: "JavaScript core and DOM",
      intensity: 72,
      days: [
        {
          day: "Day 8",
          tasks: [
            {
              title: "DOM interactions",
              description: "Implement todo interactions with filtering, editing, and keyboard support.",
              estimatedTime: "120 min",
              priority: "high",
            },
            {
              title: "Async and fetch",
              description: "Use fetch with loading/error states and optimistic UI updates.",
              estimatedTime: "70 min",
              priority: "medium",
            },
          ],
        },
      ],
    },
    {
      week: 3,
      focusArea: "React foundations",
      intensity: 84,
      days: [
        {
          day: "Day 15",
          tasks: [
            {
              title: "Component architecture",
              description: "Break a dashboard into reusable components with clean props and boundaries.",
              estimatedTime: "100 min",
              priority: "high",
            },
            {
              title: "State + effects",
              description: "Use hooks to manage async data and avoid stale closures.",
              estimatedTime: "75 min",
              priority: "medium",
            },
          ],
        },
      ],
    },
    {
      week: 4,
      focusArea: "Ship-ready project",
      intensity: 92,
      days: [
        {
          day: "Day 24",
          tasks: [
            {
              title: "Performance and polish",
              description: "Add loading skeletons, memoization, and micro-interactions.",
              estimatedTime: "80 min",
              priority: "high",
            },
            {
              title: "Deployment checklist",
              description: "Prepare env setup, error boundaries, and release notes for launch.",
              estimatedTime: "60 min",
              priority: "low",
            },
          ],
        },
      ],
    },
  ],
};

interface AIPlannerProps {
  C: Theme;
  dark: boolean;
}

const PLAN_STORAGE_KEY = "aiPlanner.lastPlan";
const GOAL_INPUT_STORAGE_KEY = "aiPlanner.goalInput";

function isPriority(value: unknown): value is Priority {
  return value === "high" || value === "medium" || value === "low";
}

function isPlannerTask(value: unknown): value is PlannerTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    typeof task.estimatedTime === "string" &&
    isPriority(task.priority)
  );
}

function isPlannerDay(value: unknown): value is PlannerDay {
  if (!value || typeof value !== "object") return false;
  const day = value as Record<string, unknown>;
  return typeof day.day === "string" && Array.isArray(day.tasks) && day.tasks.every(isPlannerTask);
}

function isPlannerWeek(value: unknown): value is PlannerWeek {
  if (!value || typeof value !== "object") return false;
  const week = value as Record<string, unknown>;
  return (
    typeof week.week === "number" &&
    typeof week.focusArea === "string" &&
    typeof week.intensity === "number" &&
    Array.isArray(week.days) &&
    week.days.every(isPlannerDay)
  );
}

function isPlannerResponse(value: unknown): value is PlannerResponse {
  if (!value || typeof value !== "object") return false;
  const plan = value as Record<string, unknown>;
  return (
    typeof plan.goalTitle === "string" &&
    typeof plan.duration === "string" &&
    Array.isArray(plan.weeks) &&
    plan.weeks.every(isPlannerWeek)
  );
}

async function requestPlan(goal: string): Promise<PlannerResponse> {
  const response = await apiFetch("/api/generate-plan", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });

  if (!response.ok) {
    throw new Error("AI planner service unavailable");
  }

  const payload: unknown = await response.json();

  if (!isPlannerResponse(payload)) {
    throw new Error("API response is not in valid planner format");
  }

  return payload;
}

export function AIPlanner({ C, dark }: AIPlannerProps) {
  const [goalInput, setGoalInput] = useState("");
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [addingToGoals, setAddingToGoals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Added to My Goals successfully.");

  const canGenerate = goalInput.trim().length > 2 && !loading;

  useEffect(() => {
    const savedInput = localStorage.getItem(GOAL_INPUT_STORAGE_KEY);
    if (savedInput) {
      setGoalInput(savedInput);
    }

    const savedPlan = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!savedPlan) return;

    try {
      const parsed: unknown = JSON.parse(savedPlan);
      if (isPlannerResponse(parsed)) {
        setPlan(parsed);
        const initialOpenState: Record<number, boolean> = {};
        parsed.weeks.forEach((w, idx) => {
          initialOpenState[w.week] = idx === 0;
        });
        setOpenWeeks(initialOpenState);
      }
    } catch {
      localStorage.removeItem(PLAN_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(GOAL_INPUT_STORAGE_KEY, goalInput);
  }, [goalInput]);

  useEffect(() => {
    if (!plan) {
      localStorage.removeItem(PLAN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const onGenerate = async () => {
    const trimmedGoal = goalInput.trim();
    if (!trimmedGoal) return;

    setLoading(true);
    setError(null);
    setUsedMock(false);

    try {
      const generated = await requestPlan(trimmedGoal);
      setPlan(generated);
      const initialOpenState: Record<number, boolean> = {};
      generated.weeks.forEach((w, idx) => {
        initialOpenState[w.week] = idx === 0;
      });
      setOpenWeeks(initialOpenState);
    } catch (err) {
      console.error("AI planner error:", err);
      setError(null);
      setUsedMock(true);
      setPlan({ ...MOCK_PLAN, goalTitle: trimmedGoal });
      setOpenWeeks({ 1: true });
    } finally {
      setLoading(false);
    }
  };

  const onAddToGoals = async () => {
    if (!plan) return;
    setAddingToGoals(true);
    setError(null);

    try {
      const goalTitleToSave = goalInput.trim() || plan.goalTitle;
      const goalRes = await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          title: goalTitleToSave,
          type: "BRAIN_GAINS",
        }),
      });

      if (!goalRes.ok) {
        throw new Error("Failed to create goal");
      }

      const createdGoal = await goalRes.json();
      const tasks = plan.weeks.flatMap((week) =>
        week.days.map((day) => {
          const summary = day.tasks
            .map((task) => task.title)
            .join(", ")
            .slice(0, 90);

          return {
            title: `W${week.week} ${day.day}: ${summary}`,
          };
        })
      );

      const taskRes = await apiFetch("/api/tasks/bulk", {
        method: "POST",
        body: JSON.stringify({
          goalId: Number(createdGoal.id),
          tasks,
        }),
      });

      if (!taskRes.ok) {
        throw new Error("Could not add tasks to the new goal");
      }

      const taskResult = await taskRes.json();

      setToastMessage(`Plan added: ${taskResult.createdCount || tasks.length} tasks saved.`);
      setToast(true);
      setTimeout(() => setToast(false), 2200);
    } catch (err) {
      console.error("Add to goals failed:", err);
      setError("Could not add plan to goals right now. Please try again.");
      setToastMessage("Failed to add to goals.");
      setToast(true);
      setTimeout(() => setToast(false), 2200);
    } finally {
      setAddingToGoals(false);
    }
  };

  return (
    <div className={`${dark ? "dark" : ""} h-full overflow-y-auto px-6 py-7 md:px-8`} style={{ color: C.text, background: C.bg }}>
      <div className="mx-auto max-w-6xl space-y-6 animate-in-fade">
        <section className="relative overflow-hidden rounded-3xl p-5 md:p-6" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: dark ? "none" : "0 4px 16px rgba(92,99,128,0.08)" }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: dark ? "linear-gradient(130deg, rgba(139,143,232,0.12), transparent 60%)" : "linear-gradient(130deg, rgba(123,126,200,0.14), transparent 62%)" }} />
          <div className="relative">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: C.accent }}>AI Planner</p>
              <h2 className="mt-2 text-2xl font-bold" style={{ color: C.text }}>Design a realistic study roadmap in seconds</h2>
              <p className="mt-2 text-sm" style={{ color: C.subtext }}>
                Enter a learning goal and generate a structured, week-by-week execution plan.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                placeholder="Enter your goal"
                className="h-11 w-full rounded-xl px-4 text-sm outline-none transition focus:ring-2"
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.inputBg,
                  color: C.text,
                  boxShadow: dark ? "none" : "inset 0 1px 1px rgba(0,0,0,0.02)",
                }}
              />
              <button
                type="button"
                disabled={!canGenerate}
                onClick={onGenerate}
                className="h-11 shrink-0 rounded-xl px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: C.accent }}
              >
                {loading ? "Generating..." : "Generate Plan"}
              </button>
            </div>

            <div className="mt-4 rounded-xl px-4 py-3" style={{ background: dark ? "rgba(92,99,128,0.16)" : "#f8f9ff", border: `1px solid ${C.border}` }}>
              <p className="text-sm font-semibold" style={{ color: C.text }}>What you get from AI Planner:</p>
              <p className="mt-1 text-sm" style={{ color: C.subtext }}>
                Weekly focus areas, daily tasks with priorities, estimated study time, and a clear roadmap you can add directly to your goals.
              </p>
            </div>
          </div>
        </section>

        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ border: `1px solid ${dark ? "rgba(251,191,36,0.3)" : "#f8d68d"}`, background: dark ? "rgba(251,191,36,0.12)" : "#fff8e7", color: dark ? "#fcd34d" : "#9a6b00" }}>
            {error}
          </div>
        )}

        {!loading && plan && (
          <section className="space-y-4 animate-in-up">
            <header className="rounded-3xl p-5 md:p-6" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: dark ? "none" : "0 4px 16px rgba(92,99,128,0.08)" }}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: C.text }}>{plan.goalTitle}</h3>
                  <p className="mt-1 text-sm" style={{ color: C.subtext }}>Duration: {plan.duration}</p>
                </div>
                <button
                  type="button"
                  onClick={onAddToGoals}
                  disabled={addingToGoals}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
                  style={{ border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, opacity: addingToGoals ? 0.6 : 1, cursor: addingToGoals ? "not-allowed" : "pointer" }}
                >
                  {addingToGoals ? "Adding..." : "Add to My Goals"}
                </button>
              </div>
              {usedMock && (
                <p className="mt-3 text-xs font-medium uppercase tracking-wider" style={{ color: C.accent }}>Mock plan fallback active</p>
              )}
            </header>

            <div className="space-y-4">
              {plan.weeks.map((week) => (
                <WeekCard
                  key={week.week}
                  week={week}
                  isOpen={!!openWeeks[week.week]}
                  onToggle={() =>
                    setOpenWeeks((prev) => ({
                      ...prev,
                      [week.week]: !prev[week.week],
                    }))
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Toast show={toast} message={toastMessage} />
    </div>
  );
}
