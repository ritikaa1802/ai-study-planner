import { useState, useEffect, useRef, useCallback } from "react";
import { Theme } from "../types";
import { Card } from "../components/ui/Card";
import { ICONS } from "../utils/constants";
import { formatTime } from "../utils/helpers";
import { useAuthContext } from "../context/AuthContext";
import { apiFetch, getApiBase } from "../utils/api";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface FocusProps { C: Theme; }

const BREAK_PRESETS = [5, 10, 15];
const STORAGE_KEY = "focus_selected_minutes";
const TASK_CONTEXT_KEY = "focus_task_context";

type FocusTaskContext = {
  taskId: number;
  goalId?: number;
  title?: string;
};

export function Focus({ C }: FocusProps) {
  const { user } = useAuthContext();
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [selectedFocusMinutes, setSelectedFocusMinutes] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 25;
  });
  const [selectedBreakMinutes, setSelectedBreakMinutes] = useState(BREAK_PRESETS[0]);
  const [time, setTime] = useState(selectedFocusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [showDoneEarly, setShowDoneEarly] = useState(false);
  const [sessions, setSessions] = useState(0); // starts at 0 for new users
  const [completedMinutesToday, setCompletedMinutesToday] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeFocusDurationRef = useRef(selectedFocusMinutes * 60);
  const activeFocusMinutesRef = useRef(selectedFocusMinutes);
  const activeSubjectRef = useRef("General");
  const activeTaskRef = useRef<FocusTaskContext | null>(null);

  const completeLinkedTask = useCallback(async () => {
    const linkedTask = activeTaskRef.current;
    if (!linkedTask?.taskId) return;

    try {
      await apiFetch(`/api/tasks/${linkedTask.taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
        skipAuthRedirect: true,
      });
    } catch (error) {
      console.error("Failed to mark linked task complete", error);
    }
  }, []);

  const saveStudySession = useCallback(async (sessionSubject: string, durationMinutes: number) => {
    setIsSavingSession(true);
    try {
      await apiFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          subject: sessionSubject,
          duration: Math.max(1, Math.round(durationMinutes)),
        }),
        skipAuthRedirect: true,
      });
    } catch (error) {
      console.error("Failed to save study session", error);
    } finally {
      setIsSavingSession(false);
    }
  }, []);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setTime((t) => Math.max(t - 1, 0));
      }, 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  useEffect(() => {
    if (!running || time !== 0) return;

    setRunning(false);
    if (mode === "focus") {
      setSessions((s) => s + 1);
      setCompletedMinutesToday((m) => m + activeFocusMinutesRef.current);
      void saveStudySession(activeSubjectRef.current, activeFocusMinutesRef.current);
      void completeLinkedTask();
      setShowDoneEarly(false);
      setTime(selectedFocusMinutes * 60);
      activeTaskRef.current = null;
      localStorage.removeItem(TASK_CONTEXT_KEY);
      return;
    }

    setTime(selectedBreakMinutes * 60);
  }, [time, running, mode, selectedFocusMinutes, selectedBreakMinutes, saveStudySession]);

  useEffect(() => {
    const persistPartialSession = () => {
      if (!running || mode !== "focus") return;

      const elapsedSeconds = activeFocusDurationRef.current - time;
      if (elapsedSeconds < 60) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const payload = JSON.stringify({
        subject: activeSubjectRef.current,
        duration: durationMinutes,
      });

      void fetch(`${getApiBase()}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
        keepalive: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistPartialSession();
      }
    };

    window.addEventListener("beforeunload", persistPartialSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", persistPartialSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [running, mode, time]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(selectedFocusMinutes));
  }, [selectedFocusMinutes]);

  useEffect(() => {
    const shouldAutoStart = localStorage.getItem("focus_autostart") === "1";
    if (!shouldAutoStart) return;

    localStorage.removeItem("focus_autostart");
    setMode("focus");
    setTime(selectedFocusMinutes * 60);
    activeFocusDurationRef.current = selectedFocusMinutes * 60;
    activeFocusMinutesRef.current = selectedFocusMinutes;
    const taskContextRaw = localStorage.getItem(TASK_CONTEXT_KEY);
    let linkedTask: FocusTaskContext | null = null;
    if (taskContextRaw) {
      try {
        linkedTask = JSON.parse(taskContextRaw) as FocusTaskContext;
      } catch {
        linkedTask = null;
      }
    }

    activeTaskRef.current = linkedTask;
    activeSubjectRef.current = linkedTask?.title?.trim() || "General";
    setShowDoneEarly(!!linkedTask);
    setRunning(true);
  }, [selectedFocusMinutes]);

  const finishEarly = useCallback(async () => {
    if (!running || mode !== "focus") return;

    const elapsedSeconds = Math.max(0, activeFocusDurationRef.current - time);
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    setRunning(false);
    setSessions((s) => s + 1);
    setCompletedMinutesToday((m) => m + durationMinutes);

    await saveStudySession(activeSubjectRef.current, durationMinutes);
    await completeLinkedTask();

    setShowDoneEarly(false);
    setTime(selectedFocusMinutes * 60);
    activeTaskRef.current = null;
    localStorage.removeItem(TASK_CONTEXT_KEY);
  }, [running, mode, time, selectedFocusMinutes, saveStudySession, completeLinkedTask]);

  const switchMode = (m: "focus" | "break") => {
    setMode(m);
    setRunning(false);
    setShowDoneEarly(false);
    setTime(m === "focus" ? selectedFocusMinutes * 60 : selectedBreakMinutes * 60);
  };

  const { mins, secs } = formatTime(time);
  const currentTotal = mode === "focus" ? selectedFocusMinutes * 60 : selectedBreakMinutes * 60;
  const pct = ((currentTotal - time) / currentTotal) * 100;

  return (
    <div style={{ padding: 28, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {(["focus", "break"] as const).map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            style={{ padding: "9px 28px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: mode === m ? C.accent : C.card, color: mode === m ? "#fff" : C.muted, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 6 }}>
            {m === "break" && <Ic d={ICONS.coffee} size={13} color={mode === m ? "#fff" : C.muted} />}
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {!running && mode === "focus" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Set Duration (mins):</span>
          <input type="number" min={1} max={180} value={selectedFocusMinutes} onChange={(e) => {
            const val = Number(e.target.value);
            if (val > 0) {
              setSelectedFocusMinutes(val);
              setTime(val * 60);
            }
          }} style={{ background: C.inputBg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", width: 60, outline: "none" }} />
        </div>
      )}

      {!running && mode === "break" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Break (mins):</span>
          <div style={{ display: "flex", gap: 8 }}>
            {BREAK_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setSelectedBreakMinutes(preset);
                  setTime(preset * 60);
                }}
                style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${selectedBreakMinutes === preset ? C.accent : C.border}`, background: selectedBreakMinutes === preset ? C.accentBg : C.inputBg, color: selectedBreakMinutes === preset ? C.accent : C.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {preset}
              </button>
            ))}
          </div>
          <input type="number" min={1} max={60} value={selectedBreakMinutes} onChange={(e) => {
            const val = Number(e.target.value);
            if (val > 0) {
              setSelectedBreakMinutes(val);
              setTime(val * 60);
            }
          }} style={{ background: C.inputBg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", width: 60, outline: "none" }} />
        </div>
      )}

      <Card C={C} style={{ width: 460, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0 28px" }}>
          <div style={{ position: "relative", width: 220, height: 220 }}>
            <svg viewBox="0 0 220 220" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="110" cy="110" r="95" fill="none" stroke={C.border} strokeWidth="10" />
              <circle cx="110" cy="110" r="95" fill="none" stroke={mode === "break" ? C.amber : C.accent} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 95}`}
                strokeDashoffset={`${2 * Math.PI * 95 * (1 - pct / 100)}`}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 48, fontWeight: 700, letterSpacing: 2, color: C.text }}>{mins}:{secs}</span>
              <span style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{mode === "focus" ? "Focus Time" : "Break Time"}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, paddingBottom: 8 }}>
          <button onClick={() => {
            if (!running && mode === "focus") {
              activeFocusDurationRef.current = time;
              activeFocusMinutesRef.current = Math.max(1, Math.round(time / 60));
              const taskContextRaw = localStorage.getItem(TASK_CONTEXT_KEY);
              let linkedTask: FocusTaskContext | null = null;
              if (taskContextRaw) {
                try {
                  linkedTask = JSON.parse(taskContextRaw) as FocusTaskContext;
                } catch {
                  linkedTask = null;
                }
              }
              activeTaskRef.current = linkedTask;
              activeSubjectRef.current = linkedTask?.title?.trim() || "General";
              setShowDoneEarly(!!linkedTask);
            }
            setRunning(!running);
          }}
            style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 14, padding: "13px 36px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Ic d={running ? ICONS.pause : ICONS.play} size={16} color="#fff" />{running ? "Pause" : "Start"}
          </button>
          {running && mode === "focus" && showDoneEarly && (
            <button
              onClick={() => { void finishEarly(); }}
              style={{ background: C.accentBar, color: "#fff", border: "none", borderRadius: 14, padding: "13px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Ic d={ICONS.check} size={16} color="#fff" />Done Early
            </button>
          )}
          <button onClick={() => { setRunning(false); setShowDoneEarly(false); setTime(mode === "focus" ? selectedFocusMinutes * 60 : selectedBreakMinutes * 60); }}
            style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 26px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Ic d={ICONS.reset} size={16} color={C.text} />Reset
          </button>
        </div>
        {isSavingSession && <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 }}>Saving session...</div>}
      </Card>

      <div style={{ display: "flex", gap: 14, width: 460 }}>
        {([
          ["Completed Today", sessions],
          ["Total Focus Time", `${Math.floor(completedMinutesToday / 60)}h ${completedMinutesToday % 60}m`],
          ["Day Streak", user.streak],
        ] as [string, string | number][]).map(([l, v]) => (
          <Card key={l} C={C} style={{ flex: 1, textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.statNum }}>{v}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{l}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
