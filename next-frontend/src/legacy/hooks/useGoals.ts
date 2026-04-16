import { useEffect, useState } from "react";
import { Goal, GoalType } from "../types";
import { apiFetch } from "../utils/api";
import { getGoalProgress } from "../utils/helpers";
import { useAuthContext } from "../context/AuthContext";

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [deletedCompletedToday, setDeletedCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuthContext();

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const res = await apiFetch("/api/goals");
      const data = await res.json();

      const goalsPayload = Array.isArray(data) ? data : data.goals ?? [];
      const retainedCompleted = Array.isArray(data) ? 0 : Number(data.deletedCompletedGoalsToday ?? 0);

      const mapped = goalsPayload.map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        type: goal.type,
        tasks: goal.tasks.map((t: any) => ({
          id: t.id,                // must be backend id
          text: t.title,
          done: t.completed,
          focusMinutes: t.focusMinutes,
        })),
      }));

      setGoals(mapped);
      setDeletedCompletedToday(Number.isFinite(retainedCompleted) ? retainedCompleted : 0);
    } catch (err) {
      console.error("Failed to load goals", err);
    } finally {
      setLoading(false);
    }
  }

  async function addGoal(title: string, type: GoalType) {
    const res = await apiFetch("/api/goals", {
      method: "POST",
      body: JSON.stringify({ title, type }),
    });

    if (!res.ok) return null;

    const newGoal = await res.json();

    setGoals((g) => [
      ...g,
      {
        id: newGoal.id,
        title: newGoal.title,
        type: newGoal.type,
        tasks: [],
      },
    ]);

    return newGoal;
  }

  async function addTask(goalId: number, text: string, focusMinutes?: number) {
    if (!text.trim()) return;

    const res = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        goalId: Number(goalId),
        title: text.trim(),
        focusMinutes,
      }),
    });

    if (!res.ok) return;

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
        console.error("Failed to toggle task", res.status, await res.text());
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
    }
  }

  async function deleteTask(goalId: number, taskId: number) {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
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
    }
  }

  async function deleteGoal(goalId: number) {
    const deletedGoal = goals.find((g) => g.id === goalId);
    const wasCompleted = !!deletedGoal && getGoalProgress(deletedGoal) === 100;

    const res = await apiFetch(`/api/goals/${goalId}`, {
      method: "DELETE",
    });

    if (!res.ok) return;

    setGoals((gs) => gs.filter((g) => g.id !== goalId));
    if (wasCompleted) {
      setDeletedCompletedToday((c) => c + 1);
    }
  }

  const completed = goals.filter((g) => getGoalProgress(g) === 100).length + deletedCompletedToday;

  const avgProgress = goals.length
    ? Math.round(
      goals.reduce((a, g) => a + getGoalProgress(g), 0) / goals.length
    )
    : 0;

  return {
    goals,
    loading,
    addGoal,
    addTask,
    toggleTask,
    deleteTask,
    deleteGoal,
    completed,
    avgProgress,
  };
}