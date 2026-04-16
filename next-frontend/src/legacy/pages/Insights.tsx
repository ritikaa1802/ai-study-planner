import { useState, useEffect, useRef } from "react";
import { Theme } from "../types";
import { Card } from "../components/ui/Card";
import { useAnalytics } from "../hooks/useAnalytics";
import { GuidanceModal } from "../components/ui/GuidanceModal";

function AnimatedLineChart({ data, labels, C }: { data: number[]; labels: string[]; C: Theme }) {
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip] = useState<number | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    setProgress(0);
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1100, 1);
      setProgress(p < 1 ? p * p * (3 - 2 * p) : 1);
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [data]);

  const W = 300, H = 110, PL = 28, PR = 10, PT = 8, PB = 22;
  const maxV = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: PL + (i / (data.length - 1)) * (W - PL - PR),
    y: PT + (1 - v / maxV) * (H - PT - PB),
  }));

  const totalLen = pts.reduce((acc, pt, i) => i === 0 ? 0 : acc + Math.hypot(pt.x - pts[i - 1].x, pt.y - pts[i - 1].y), 0);
  const targetLen = totalLen * progress;
  let drawn = 0;
  const vis: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) { vis.push(pts[0]); continue; }
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (drawn + seg <= targetLen) { vis.push(pts[i]); drawn += seg; }
    else {
      const f = (targetLen - drawn) / seg;
      vis.push({ x: pts[i - 1].x + f * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + f * (pts[i].y - pts[i - 1].y) });
      break;
    }
  }
  const pathD = vis.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div style={{ position: "relative" }}>
      {tooltip != null && (
        <div style={{ position: "absolute", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: C.text, pointerEvents: "none", left: pts[tooltip]?.x - 26, top: pts[tooltip]?.y - 34, zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          {labels[tooltip]}: {data[tooltip]}h
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 2, 4, 6, 8].map((v) => (
          <line key={v} x1={PL} y1={PT + (1 - v / maxV) * (H - PT - PB)} x2={W - PR} y2={PT + (1 - v / maxV) * (H - PT - PB)} stroke={C.border} strokeWidth="1" strokeDasharray="3,3" />
        ))}
        {[0, 2, 4, 6, 8].map((v) => (
          <text key={v} x={PL - 4} y={PT + (1 - v / maxV) * (H - PT - PB) + 3} fontSize="8" fill={C.muted} textAnchor="end">{v}</text>
        ))}
        {vis.length > 1 && <path d={`${pathD} L${vis[vis.length - 1].x},${H - PB} L${pts[0].x},${H - PB} Z`} fill="url(#lg1)" />}
        {pathD && <path d={pathD} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map((p, i) => progress >= i / (pts.length - 1) && (
          <circle key={i} cx={p.x} cy={p.y} r="4.5" fill={C.accent}
            onMouseEnter={() => setTooltip(i)} onMouseLeave={() => setTooltip(null)} style={{ cursor: "pointer" }} />
        ))}
        {labels.map((l, i) => <text key={l} x={pts[i]?.x} y={H - 4} textAnchor="middle" fontSize="9" fill={C.muted}>{l}</text>)}
      </svg>
    </div>
  );
}

function AnimatedBarChart({ data, labels, C }: { data: number[]; labels: string[]; C: Theme }) {
  const [hts, setHts] = useState(data.map(() => 0));
  const [tip, setTip] = useState<number | null>(null);
  const maxH = 90, maxV = Math.max(...data, 1);

  useEffect(() => {
    setHts(data.map(() => 0));
    const timers = data.map((v, i) => setTimeout(() => setHts((prev) => { const n = [...prev]; n[i] = (v / maxV) * maxH; return n; }), i * 80));
    return () => timers.forEach(clearTimeout);
  }, [data]);

  return (
    <div style={{ height: 120, display: "flex", alignItems: "flex-end", gap: 6, paddingBottom: 18, paddingTop: 8, position: "relative" }}>
      {tip != null && (
        <div style={{ position: "absolute", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: C.text, pointerEvents: "none", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          {labels[tip]}: {data[tip]}
        </div>
      )}
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
          onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)}>
          <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: C.accentLight, height: `${hts[i]}px`, transition: "height 0.55s cubic-bezier(0.34,1.56,0.64,1)", minHeight: 2 }} />
          <span style={{ fontSize: 9, color: C.muted }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function AnimatedDonut({ study, skills, C }: { study: number; skills: number; C: Theme }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now(), dur = 1000;
    const go = (now: number) => {
      const p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      setPct(e);
      if (p < 1) frame = requestAnimationFrame(go);
    };
    frame = requestAnimationFrame(go);
    return () => cancelAnimationFrame(frame);
  }, []);
  const r = 44, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, justifyContent: "center" }}>
      <svg viewBox="0 0 120 120" width="160" height="160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth="26" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.sidebar} strokeWidth="26"
          strokeDasharray={`${circ * (skills / 100) * pct} ${circ * (1 - (skills / 100) * pct)}`}
          strokeDashoffset={`${circ * (1 - (study / 100) * pct)}`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accentLight} strokeWidth="26"
          strokeDasharray={`${circ * (study / 100) * pct} ${circ * (1 - (study / 100) * pct)}`}
          strokeDashoffset={`${circ * 0.25}`} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.text }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: C.accentLight }} />Study ({study}%)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.text }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: C.sidebar }} />Skills ({skills}%)
        </div>
      </div>
    </div>
  );
}

function AnimatedHBars({ subjects, C }: { subjects: { n: string; h: number }[]; C: Theme }) {
  const [ws, setWs] = useState(subjects.map(() => 0));
  const maxH = Math.max(...subjects.map((s) => s.h));
  useEffect(() => {
    setWs(subjects.map(() => 0));
    const t = subjects.map((s, i) => setTimeout(() => setWs((p) => { const n = [...p]; n[i] = (s.h / maxH) * 100; return n; }), i * 110));
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div>
      {subjects.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
          <span style={{ width: 92, fontSize: 12, color: C.muted, textAlign: "right", flexShrink: 0 }}>{s.n}</span>
          <div style={{ flex: 1, height: 16, borderRadius: 5, background: C.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${ws[i]}%`, background: C.sidebar, borderRadius: 5, transition: "width 0.65s cubic-bezier(0.34,1.56,0.64,1)" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, width: 18, color: C.text }}>{s.h}</span>
        </div>
      ))}
    </div>
  );
}

interface InsightsProps {
  C: Theme;
  onNavigateToPomodoro?: () => void;
}

export function Insights({ C, onNavigateToPomodoro }: InsightsProps) {
  const { data, loading } = useAnalytics();
  const [ck, setCk] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => { setCk((k) => k + 1); }, [data]);

  if (loading || !data) {
    return <div style={{ padding: "24px 28px", color: C.text }}>Loading insights...</div>;
  }

  const wk = data.wk;
  const tk = data.tk;
  const lb = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const subj = data.subj;
  const totalWeeklyHours = wk.reduce((sum, h) => sum + h, 0);
  const totalWkHrs = totalWeeklyHours.toFixed(1);

  const subjectEffort = subj.reduce((sum, s) => sum + s.h, 0);
  const balanceTotal = totalWeeklyHours + subjectEffort;
  const studyPct = balanceTotal > 0 ? Math.round((totalWeeklyHours / balanceTotal) * 100) : 0;
  const skillsPct = balanceTotal > 0 ? 100 - studyPct : 0;
  const hasSessions = (data.totalStudyHours || 0) > 0;

  const achievements = [
    data.totalTasksDone >= 1,
    data.activeDaysThisWeek >= 3,
    data.completionRate >= 60,
    data.productivity >= 70,
  ].filter(Boolean).length;

  const achievementTags = [
    { label: "Task Starter", unlocked: data.totalTasksDone >= 1 },
    { label: "3-Day Streak", unlocked: data.activeDaysThisWeek >= 3 },
    { label: "60% Completion", unlocked: data.completionRate >= 60 },
    { label: "Productivity 70+", unlocked: data.productivity >= 70 },
  ]
    .filter((t) => t.unlocked)
    // Keep completion logic in metrics, but do not show this tag in the UI.
    .filter((t) => t.label !== "60% Completion")
    .map((t) => t.label);

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {([
          { label: "This Week", value: `${totalWkHrs}h`, subtitle: "Active study time", subtitleColor: C.green },
          { label: "Productivity", value: `${data.productivity}%`, subtitle: "Activity rating", subtitleColor: C.green },
          { label: "Tasks Done", value: `${data.totalTasksDone}`, subtitle: "All-time", subtitleColor: C.muted },
          { label: "Achievements", value: `${achievements}`, subtitle: "Milestones earned", subtitleColor: C.muted, tags: achievementTags },
        ] as { label: string; value: string; subtitle: string; subtitleColor: string; tags?: string[] }[]).map((item) => (
          <Card key={item.label} C={C} style={{ flex: 1, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{item.value}</div>
            <div style={{ fontSize: 12, color: item.subtitleColor, marginTop: 4 }}>{item.subtitle}</div>
            {item.tags && item.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: tag === "Task Starter" ? 12 : 10,
                      fontWeight: 700,
                      fontStyle: tag === "Task Starter" ? "italic" : "normal",
                      color: tag === "Task Starter" ? "#ffffff" : C.accent,
                      background: tag === "Task Starter" ? C.accent : C.accentBg,
                      border: `1px solid ${tag === "Task Starter" ? C.accent : C.border}`,
                      borderRadius: 999,
                      padding: "3px 8px",
                      lineHeight: 1.1,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card C={C} style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Weekly Study Hours</h3>
            <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>Last 7 days</span>
          </div>
          <AnimatedLineChart key={`l-${ck}`} data={wk} labels={lb} C={C} />
        </Card>
        <Card C={C} style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Tasks Completed</h3>
            <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>Weekly</span>
          </div>
          <AnimatedBarChart key={`b-${ck}`} data={tk} labels={lb} C={C} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card C={C} style={{ padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: C.text }}>Study vs Skills Balance</h3>
          <AnimatedDonut key={`d-${ck}`} study={studyPct} skills={skillsPct} C={C} />
        </Card>
        <Card C={C} style={{ padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: C.text }}>Hours by Subject</h3>
          <AnimatedHBars key={`h-${ck}`} subjects={subj} C={C} />
        </Card>
      </div>

      <button
        onClick={() => setShowGuide(true)}
        style={{ position: "fixed", right: 22, bottom: 22, zIndex: 50, border: `1px solid ${C.border}`, background: C.card, color: C.accent, padding: "9px 13px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 22px rgba(15,23,42,0.12)" }}
      >
        📊 See how analytics work
      </button>

      <GuidanceModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        title="How Your Analytics Work"
        C={C}
        footer={(
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowGuide(false)}
              style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowGuide(false);
                onNavigateToPomodoro?.();
              }}
              style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Start Pomodoro
            </button>
          </div>
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>1. Study Hours</div>
            <div>Calculated from your Pomodoro sessions using actual tracked time.</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>2. Daily & Weekly Stats</div>
            <div>Grouped by session date.</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>3. Subject Breakdown</div>
            <div>Based on selected subject before starting session.</div>
          </div>
          <div style={{ border: `1px solid ${C.amber}`, background: `${C.amber}22`, borderRadius: 10, padding: "10px 12px", color: C.text }}>
            If you don't use the timer, analytics may not reflect real study time.
          </div>
          {!hasSessions && (
            <div style={{ fontSize: 12, color: C.muted }}>
              No tracked sessions found yet.
            </div>
          )}
        </div>
      </GuidanceModal>
    </div>
  );
}
