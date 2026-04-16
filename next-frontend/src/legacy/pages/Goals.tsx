

import { useState } from "react";
import { useGoals } from "../hooks/useGoals";
import { Theme, GoalType } from "../types";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { GuidanceModal } from "../components/ui/GuidanceModal";
import { getGoalProgress } from "../utils/helpers";
import { GOAL_TYPES, GOAL_TYPE_COLORS, ICONS } from "../utils/constants";
import { apiFetch } from "../utils/api";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface GoalsProps {
  C: Theme;
  onNavigateToPomodoro?: (minutes?: number) => void;
}


export function Goals({ C, onNavigateToPomodoro }: GoalsProps) {
  const { goals, addGoal, toggleTask, addTask, deleteTask, deleteGoal, completed, avgProgress } = useGoals();

  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<GoalType | "">("");
  const [newTaskText, setNewTaskText] = useState<Record<number, string>>({});
  const [newTaskMinutes, setNewTaskMinutes] = useState<Record<number, string>>({});
  const [typeOpen, setTypeOpen] = useState(false);
  const [showPomodoroPrompt, setShowPomodoroPrompt] = useState(false);


  /* -------- ADD GOAL FUNCTION -------- */

  async function handleAddGoal() {
    if (!newTitle.trim() || !newType) return;

    const createdGoal = await addGoal(newTitle, newType);

    if (createdGoal && !localStorage.getItem("goal_pomodoro_prompt_seen")) {
      try {
        const sessionRes = await apiFetch("/api/sessions");
        if (sessionRes.ok) {
          const sessions = await sessionRes.json();
          if (Array.isArray(sessions) && sessions.length === 0) {
            setShowPomodoroPrompt(true);
            localStorage.setItem("goal_pomodoro_prompt_seen", "true");
          }
        }
      } catch (error) {
        console.error("Failed to check study sessions", error);
      }
    }

    setNewTitle("");
    setNewType("");
    setShowModal(false);
  }



  /* -------- ADD TASK FUNCTION -------- */

  function handleAddTask(goalId: number) {
    const text = newTaskText[goalId]?.trim();
    const taskMinsRaw = Number(newTaskMinutes[goalId]);
    const taskMinutes = Number.isFinite(taskMinsRaw) && taskMinsRaw > 0 ? Math.round(taskMinsRaw) : undefined;
    if (!text || !taskMinutes) return;

    addTask(goalId, text, taskMinutes);

    setNewTaskText((t) => ({
      ...t,
      [goalId]: "",
    }));
    setNewTaskMinutes((m) => ({
      ...m,
      [goalId]: "",
    }));
  }


  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
        {([
          [`${goals.length}`, "Active Goals", ICONS.goals],
          [`${completed}`, "Completed", ICONS.trend],
          [`${avgProgress}%`, "Avg Progress", ICONS.analytics],
        ] as [string, string, string][]).map(([v, l, icon]) => (
          <Card key={l} C={C} style={{ flex: 1, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: 500 }}>{l}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.text }}>{v}</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic d={icon} size={22} color={C.accent} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
          <Ic d={ICONS.plus} size={16} color="#fff" sw={2.5} /> New Goal
        </button>
      </div>

      {goals.map((goal) => {
        const pct = getGoalProgress(goal);
        const typeColor = GOAL_TYPE_COLORS[goal.type] || { bg: C.accentBg, color: C.accent };
        const typeLabel = GOAL_TYPES.find((t) => t.key === goal.type)?.label || goal.type;
        const isExpanded = expandedId === goal.id;

        return (
          <Card key={goal.id} C={C} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>{goal.title}</h3>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: typeColor.bg, color: typeColor.color, whiteSpace: "nowrap" }}>{typeLabel}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setExpandedId(isExpanded ? null : goal.id)} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {isExpanded ? "Hide Tasks ▲" : "View Tasks ▼"}
                </button>
                <div style={{ width: 1, height: 14, background: C.border }} />
                <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.muted, marginBottom: 6 }}>
              <span>Progress — {goal.tasks.filter((t) => t.done).length}/{goal.tasks.length} tasks</span>
              <span style={{ fontWeight: 600, color: pct === 100 ? C.green : C.text }}>{pct}%</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: C.border, overflow: "hidden", marginBottom: isExpanded ? 16 : 0 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.green : C.accentBar, borderRadius: 999, transition: "width 0.4s ease" }} />
            </div>

            {isExpanded && (
              <div>
                {goal.tasks.length === 0 && <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px", fontStyle: "italic" }}>No tasks yet. Add one below.</p>}
                {goal.tasks.map((task, idx) => (
                  <div key={task.id} onClick={() => toggleTask(goal.id, task.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 6, cursor: "pointer", background: task.done ? C.accentBg : C.bg, border: `1px solid ${task.done ? C.accent + "44" : C.border}`, transition: "all 0.2s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${task.done ? C.accent : C.border}`, background: task.done ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      {task.done && <Ic d={ICONS.check} size={12} color="#fff" sw={3} />}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: task.done ? C.muted : C.text,
                        position: "relative",
                        flex: 1,
                      }}
                    >
                      {idx + 1}. {task.text}

                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          width: task.done ? "100%" : "0%",
                          height: 2,
                          background: C.accent,
                          transform: "translate(-50%, -50%)",
                          transition: "width 0.3s ease",
                          borderRadius: 2,
                        }}
                      />
                    </span>
                    {task.focusMinutes && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentBg, borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>
                        {task.focusMinutes} min
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (task.focusMinutes) {
                          localStorage.setItem("focus_selected_minutes", String(task.focusMinutes));
                        }
                        localStorage.setItem("focus_task_context", JSON.stringify({
                          taskId: task.id,
                          goalId: goal.id,
                          title: task.text,
                        }));
                        localStorage.setItem("focus_autostart", "1");
                        onNavigateToPomodoro?.(task.focusMinutes ?? undefined);
                      }}
                      style={{ background: C.accentBg, border: "none", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 8, padding: "6px 8px" }}
                    >
                      Start Timer
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this task?")) {
                          deleteTask(goal.id, task.id);
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.muted,
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 6,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.red)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                    >
                      <Ic d={ICONS.trash} size={14} color="currentColor" />
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input value={newTaskText[goal.id] || ""} onChange={(e) => setNewTaskText((t) => ({ ...t, [goal.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && handleAddTask(goal.id)}
                    placeholder="Add a new task..." style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: "none" }} />
                  <input value={newTaskMinutes[goal.id] || ""} onChange={(e) => setNewTaskMinutes((m) => ({ ...m, [goal.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && handleAddTask(goal.id)}
                    placeholder="mins" type="number" min={1} max={480} style={{ width: 74, padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: "none" }} />
                  <button disabled={!newTaskText[goal.id]?.trim() || !newTaskMinutes[goal.id]?.trim()} onClick={() => handleAddTask(goal.id)} style={{ background: !newTaskText[goal.id]?.trim() || !newTaskMinutes[goal.id]?.trim() ? C.border : C.accent, color: !newTaskText[goal.id]?.trim() || !newTaskMinutes[goal.id]?.trim() ? C.muted : "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: !newTaskText[goal.id]?.trim() || !newTaskMinutes[goal.id]?.trim() ? "not-allowed" : "pointer" }}>Add</button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} C={C}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>Create New Goal</h3>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Goal Title</label>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. DSA Prep, Learn Spanish..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Goal Type</label>
          <div style={{ position: "relative" }}>
            <div onClick={() => setTypeOpen((o) => !o)} style={{ padding: "10px 14px", borderRadius: 12, border: `1px solid ${typeOpen ? C.accent : C.border}`, background: C.inputBg, color: newType ? C.text : C.muted, fontSize: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{newType ? GOAL_TYPES.find((t) => t.key === newType)?.label : "Select a type..."}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{typeOpen ? "▲" : "▼"}</span>
            </div>
            {typeOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, overflow: "hidden" }}>
                {GOAL_TYPES.map((t) => {
                  const tc = GOAL_TYPE_COLORS[t.key];
                  return (
                    <div key={t.key} onClick={() => { setNewType(t.key); setTypeOpen(false); }}
                      style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, background: newType === t.key ? C.accentBg : "transparent", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: tc.bg, color: tc.color, whiteSpace: "nowrap" }}>{t.label}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{t.desc}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAddGoal} disabled={!newTitle.trim() || !newType}
              style={{ flex: 2, padding: 11, borderRadius: 12, border: "none", background: !newTitle.trim() || !newType ? C.border : C.accent, color: !newTitle.trim() || !newType ? C.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: !newTitle.trim() || !newType ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              Create Goal
            </button>
          </div>
        </Modal>
      )}

      <GuidanceModal
        open={showPomodoroPrompt}
        onClose={() => setShowPomodoroPrompt(false)}
        title="🎯 Goal Created!"
        C={C}
        footer={(
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowPomodoroPrompt(false)}
              style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                setShowPomodoroPrompt(false);
                onNavigateToPomodoro?.();
              }}
              style={{ flex: 1.2, padding: 11, borderRadius: 12, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Start Pomodoro
            </button>
          </div>
        )}
      >
        <p style={{ margin: 0 }}>Track your study time using Pomodoro to unlock accurate analytics and insights.</p>
      </GuidanceModal>
    </div>
  );
} 