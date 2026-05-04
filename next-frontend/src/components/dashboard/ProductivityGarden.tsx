import React, { useMemo } from "react";
import { Theme } from "../../legacy/types";
import { Card } from "../../legacy/components/ui/Card";
import { useAnalytics } from "../../legacy/hooks/useAnalytics";

interface ProductivityGardenProps {
  C: Theme;
  streak: number;
}

type GardenState = "blooming" | "healthy" | "wilting" | "fresh";

function getState(completed: number, missed: number, streak: number): GardenState {
  if (completed + missed === 0) return "fresh";
  const ratio = completed / (completed + missed);
  if (ratio >= 0.8 && streak >= 5) return "blooming";
  if (ratio >= 0.5) return "healthy";
  return "wilting";
}

const STATE_META: Record<GardenState, { label: string; emoji: string; color: string; desc: string }> = {
  blooming:  { label: "Thriving",      emoji: "🌸", color: "#E91E63", desc: "Excellent work! Your consistency is paying off." },
  healthy:   { label: "Healthy",       emoji: "🌱", color: "#388E3C", desc: "Solid progress — keep completing those tasks." },
  wilting:   { label: "Needs Care",    emoji: "💧", color: "#A1887F", desc: "Try finishing more tasks to help your garden recover." },
  fresh:     { label: "Just Planted",  emoji: "🌰", color: "#78909C", desc: "Complete your first tasks to start growing your garden!" },
};

/** 7 × 7 = 49 dot grid. Each dot represents one task (proportionally scaled). */
function GardenGrid({ completed, missed, C }: { completed: number; missed: number; C: Theme }) {
  const total = completed + missed;
  const GRID = 49;

  const completedDots = total === 0 ? 0 : Math.round((completed / total) * GRID);
  const missedDots    = total === 0 ? 0 : Math.min(GRID - completedDots, Math.round((missed / total) * GRID));

  const cells = Array(GRID).fill("empty").map((_, i) => {
    if (i < completedDots)                      return "done";
    if (i < completedDots + missedDots)         return "missed";
    return "empty";
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, margin: "18px 0 14px" }}>
      {cells.map((type, i) => (
        <div
          key={i}
          title={type === "done" ? "Completed" : type === "missed" ? "Missed" : ""}
          style={{
            aspectRatio: "1 / 1",
            borderRadius: 5,
            background:
              type === "done"   ? C.green :
              type === "missed" ? `${C.red}88` :
              C.border,
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  );
}

export function ProductivityGarden({ C, streak }: ProductivityGardenProps) {
  const { data, loading } = useAnalytics();

  const completed = data?.totalTasksDone    ?? 0;
  const total     = data?.totalTasksCreated ?? 0;
  const missed    = Math.max(0, total - completed);
  const rate      = total === 0 ? 0 : Math.round((completed / total) * 100);

  const state = useMemo(() => getState(completed, missed, streak), [completed, missed, streak]);
  const meta  = STATE_META[state];

  return (
    <Card C={C} style={{ padding: "20px 22px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: C.accentBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17,
            }}
          >
            🌿
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Productivity Garden</h3>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Each dot represents one task</p>
          </div>
        </div>

        {/* State badge */}
        <span
          style={{
            fontSize: 11, fontWeight: 700,
            padding: "4px 12px", borderRadius: 20,
            background: `${meta.color}18`,
            color: meta.color,
            border: `1px solid ${meta.color}44`,
            whiteSpace: "nowrap",
          }}
        >
          {meta.emoji} {meta.label}
        </span>
      </div>

      {/* Dot grid */}
      {loading ? (
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
          Loading…
        </div>
      ) : (
        <GardenGrid completed={completed} missed={missed} C={C} />
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: C.green }} />
          <span style={{ fontSize: 11, color: C.muted }}>Completed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: `${C.red}88` }} />
          <span style={{ fontSize: 11, color: C.muted }}>Missed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: C.border }} />
          <span style={{ fontSize: 11, color: C.muted }}>Empty</span>
        </div>
      </div>

      {/* Stat pills */}
      <div
        style={{
          display: "flex", gap: 8, flexWrap: "wrap",
          padding: "12px 14px",
          borderRadius: 12,
          background: C.bg,
          border: `1px solid ${C.border}`,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 80 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.green, lineHeight: 1 }}>{completed}</span>
          <span style={{ fontSize: 11, color: C.muted }}>done</span>
        </div>
        <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 80 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.red, lineHeight: 1 }}>{missed}</span>
          <span style={{ fontSize: 11, color: C.muted }}>missed</span>
        </div>
        <div style={{ width: 1, background: C.border, alignSelf: "stretch" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 80 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{rate}%</span>
          <span style={{ fontSize: 11, color: C.muted }}>rate</span>
        </div>
      </div>

      {/* Motivational message */}
      <p style={{ margin: 0, fontSize: 12, color: meta.color, fontWeight: 600 }}>
        {meta.emoji} {meta.desc}
      </p>
    </Card>
  );
}
