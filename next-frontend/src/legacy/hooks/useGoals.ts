import { useEffect, useState } from "react";
import { Goal, GoalType } from "../types";
import { apiFetch } from "../utils/api";
import { getGoalProgress } from "../utils/helpers";
import { useAuthContext } from "../context/AuthContext";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lifetimeGoalsCompleted, setLifetimeGoalsCompleted] = useState(0);
  const [lifetimeGoalsMissed, setLifetimeGoalsMissed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuthContext();

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      setError(null);
      const res = await apiFetch("/api/goals", { skipAuthRedirect: true });

      if (!res.ok) {
        let message = "Failed to load goals";
        try {
          const payload = await res.json();
          message = payload?.error || payload?.message || message;
        } catch {
          // Keep fallback message.
        }
        throw new Error(`${message} (status ${res.status})`);
      }

      const data = await res.json();

      const goalsPayload = Array.isArray(data) ? data : data.goals ?? [];
      const lifetimeCompleted = Array.isArray(data) ? 0 : Number(data.lifetimeGoalsCompleted ?? 0);
      const lifetimeMissed = Array.isArray(data) ? 0 : Number(data.lifetimeGoalsMissed ?? 0);

      const mapped = goalsPayload.map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        type: goal.type,
        isImportant: Boolean(goal.isImportant),
        tasks: goal.tasks.map((t: any) => ({
          id: t.id,                // must be backend id
          text: t.title,
          done: t.completed,
          focusMinutes: t.focusMinutes,
        })),
      }));

      setGoals(mapped);
      setLifetimeGoalsCompleted(Number.isFinite(lifetimeCompleted) ? lifetimeCompleted : 0);
      setLifetimeGoalsMissed(Number.isFinite(lifetimeMissed) ? lifetimeMissed : 0);
    } catch (err) {
      console.error("Failed to load goals", err);
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }

  async function addGoal(title: string, type: GoalType) {
    setError(null);

    const res = await apiFetch("/api/goals", {
      method: "POST",
      body: JSON.stringify({ title, type }),
    });

    if (!res.ok) {
      let message = "Failed to create goal";
      try {
        const payload = await res.json();
        message = payload?.error || payload?.message || message;
      } catch {
        // Keep fallback message.
      }
      setError(`${message} (status ${res.status})`);
      return null;
    }

    const newGoal = await res.json();

    setGoals((g) => [
      newGoal && typeof newGoal.id === "number"
        ? {
          id: newGoal.id,
          title: newGoal.title,
          type: newGoal.type,
          isImportant: Boolean(newGoal.isImportant),
          tasks: [],
        }
        : {
          id: Date.now(),
          title,
          type,
          isImportant: false,
          tasks: [],
        },
      ...g,
    ]);

    // Sync with server in case of additional backend-side ordering/filters.
    await fetchGoals();

    return newGoal;
  }

  async function addTask(goalId: number, text: string, focusMinutes?: number) {
    setError(null);
    if (!text.trim()) return;

    const res = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        goalId: Number(goalId),
        title: text.trim(),
        focusMinutes,
      }),
    });

    if (!res.ok) {
      let message = "Failed to add task";
      try {
        const payload = await res.json();
        message = payload?.error || payload?.message || message;
      } catch {
        // Keep fallback message.
      }
      setError(message);
      return;
    }

    const newTask = await res.json();

    setGoals((gs) =>
      gs.map((g) =>
        g.id === goalId
          ? {
            ...g,
            tasks: [
              ...g.tasks,
              {
                id: newTask.id,
                text: newTask.title,
                done: newTask.completed,
                focusMinutes: newTask.focusMinutes,
              },
            ],
          }
          : g
      )
    );
  }


  async function toggleTask(goalId: number, taskId: number) {

    console.log("Toggling task", taskId, "for goal", goalId);

    const goal = goals.find((g) => g.id === goalId);
    const task = goal?.tasks.find((t) => t.id === taskId);
    const wasGoalCompleted = !!goal && getGoalProgress(goal) === 100;
    if (!task) {
      console.log("Task not found in state");
      return;
    }

    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          completed: !task.done,
        }),
      });

      if (!res.ok) {
        let message = "Failed to toggle task";
        try {
          const payload = await res.json();
          message = payload?.error || payload?.message || message;
        } catch {
          // Keep fallback message.
        }
        setError(message);
        console.error("Failed to toggle task", res.status, message);
        return;
      }

      const updated = await res.json();

      console.log("Task updated", updated);

      if (updated.completed === true) {
        refreshUser();
      }

      setGoals((gs) =>
        gs.map((g) =>
          g.id === goalId
            ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId
                ? { ...t, done: updated.completed }
                : t
              ),
            }
            : g
        )
      );
    } catch (error) {
      console.error("Error toggling task", error);
      setError("Error toggling task");
    }
  }

  async function deleteTask(goalId: number, taskId: number) {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let message = "Failed to delete task";
        try {
          const payload = await res.json();
          message = payload?.error || payload?.message || message;
        } catch {
          // Keep fallback message.
        }
        setError(message);
        console.error("Failed to delete task", res.status);
        return;
      }

      setGoals((gs) =>
        gs.map((g) =>
          g.id === goalId
            ? {
                ...g,
                tasks: g.tasks.filter((t) => t.id !== taskId),
              }
            : g
        )
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Error deleting task");
    }
  }

  async function deleteGoal(goalId: number) {
    const res = await apiFetch(`/api/goals/${goalId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let message = "Failed to delete goal";
      try {
        const payload = await res.json();
        message = payload?.error || payload?.message || message;
      } catch {
        // Keep fallback message.
      }
      setError(message);
      return;
    }

    setGoals((gs) => gs.filter((g) => g.id !== goalId));
  }

  async function toggleGoalImportant(goalId: number, isImportant: boolean) {
    setError(null);

    let res = await apiFetch(`/api/goals/${goalId}/important`, {
      method: "PATCH",
      body: JSON.stringify({ isImportant }),
    });

    // Backward-compatible fallback for deployments that only support PATCH /api/goals/:id.
    if (res.status === 404 || res.status === 405) {
      res = await apiFetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify({ isImportant }),
      });
    }

    if (!res.ok) {
      let message = "Failed to update goal importance";
      try {
        const payload = await res.json();
        message = payload?.error || payload?.message || message;
      } catch {
        // Keep fallback message.
      }
      setError(message);
      return;
    }

    setGoals((gs) =>
      gs.map((g) => (g.id === goalId ? { ...g, isImportant } : g))
    );
  }

  const completed = goals.filter((g) => getGoalProgress(g) === 100).length;

  const avgProgress = goals.length
    ? Math.round(
      goals.reduce((a, g) => a + getGoalProgress(g), 0) / goals.length
    )
    : 0;

  return {
    goals,
    loading,
    error,
    addGoal,
    addTask,
    toggleGoalImportant,
    toggleTask,
    deleteTask,
    deleteGoal,
    completed,
    lifetimeGoalsCompleted,
    lifetimeGoalsMissed,
    avgProgress,
    refetchGoals: fetchGoals,
  };
}