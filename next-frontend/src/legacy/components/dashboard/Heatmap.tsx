import { useState, useEffect } from "react";
import { Theme } from "../../types";
import { getDotColor } from "../../utils/helpers";
import { apiFetch } from "../../utils/api";
import { useAuthContext } from "../../context/AuthContext";

export function Heatmap({ C }: { C: Theme }) {
  const { dark } = useAuthContext();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  const [dots, setDots] = useState<{ w: number; d: number; v: number }[]>(() =>
    Array.from({ length: 53 * 7 }, (_, i) => ({
      w: Math.floor(i / 7),
      d: i % 7,
      v: 0,
    }))
  );

  const [monthPositions, setMonthPositions] = useState<{ name: string; week: number }[]>([]);
  const [gridLimits, setGridLimits] = useState<{ startDay: number; endDay: number }>({ startDay: 0, endDay: 6 });

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    const startDow = startDate.getDay();
    const firstDateOfGrid = new Date(startDate);
    firstDateOfGrid.setDate(startDate.getDate() - startDow);

    const endDow = today.getDay();
    setGridLimits({ startDay: startDow, endDay: endDow });

    apiFetch("/api/activity")
      .then((r) => r.json())
      .then((res) => {
        const data = res.activity;
        if (!Array.isArray(data) || data.length === 0) return;

        const lookup: Record<string, number> = {};
        const monthPos: { name: string; week: number }[] = [];
        const seenMonths = new Set();

        data.forEach(({ date, count }: { date: string; count: number }) => {
          const d = new Date(date);
          const dateAtMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const diffDays = Math.floor((dateAtMidnight.getTime() - firstDateOfGrid.getTime()) / 86400000);
          if (diffDays < 0 || diffDays >= 53 * 7) return;

          const w = Math.floor(diffDays / 7);
          const row = diffDays % 7;
          lookup[`${w}-${row}`] = count;
        });

        // 3. Dynamic Month Headers - Robust Detection
        // Iterate through all days in our grid and mark the START of each month
        for (let w = 0; w < 53; w++) {
          for (let d = 0; d < 7; d++) {
            const dateObj = new Date(firstDateOfGrid);
            dateObj.setDate(dateObj.getDate() + (w * 7 + d));
            
            // Is this day in our visible 365-day range?
            const outOfRange = (w === 0 && d < startDow) || (w === 52 && d > endDow);
            if (outOfRange) continue;

            const monthName = months[dateObj.getMonth()];
            if (!seenMonths.has(monthName)) {
              monthPos.push({ name: monthName, week: w });
              seenMonths.add(monthName);
            }
          }
        }
        
        setMonthPositions(monthPos);
        setDots((prev) =>
          prev.map((dot) => ({ ...dot, v: lookup[`${dot.w}-${dot.d}`] ?? 0 }))
        );
      })
      .catch(() => { });
  }, []);

  return (
    <div style={{ userSelect: "none", padding: "10px 0" }}>
      {/* Optimized Header Heading - Precise 36px Padding */}
      <div style={{ display: "flex", paddingLeft: 36, marginBottom: 10, position: "relative", height: 16 }}>
        {monthPositions.map((m) => (
          <div
            key={`${m.name}-${m.week}`}
            style={{
              position: "absolute",
              left: 36 + m.week * 16,
              fontSize: 10,
              fontWeight: 700,
              color: C.subtext, // Increased visibility
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            {m.name}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {/* Adjusted Labels offset (width 24 + paddingRight 4 = 28) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingRight: 4, textAlign: "right" }}>
          {dayLabels.map((d, i) => (
            <div
              key={i}
              style={{
                height: 13,
                width: 24,
                fontSize: 10,
                color: C.muted,
                lineHeight: "13px",
                fontWeight: 500
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* The Grid - Precise gap: 3 + dot: 13 = 16 column width */}
        <div style={{ display: "flex", gap: 3, flex: 1, overflow: "hidden" }}>
          {Array.from({ length: 53 }).map((_, w) => (
            <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {Array.from({ length: 7 }).map((_, d) => {
                const dot = dots.find((x) => x.w === w && x.d === d);
                const outOfRange = (w === 0 && d < gridLimits.startDay) || (w === 52 && d > gridLimits.endDay);

                return (
                  <div
                    key={d}
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      background: outOfRange ? "transparent" : getDotColor(dot?.v || 0, C),
                      opacity: outOfRange ? 0 : 1,
                      pointerEvents: outOfRange ? "none" : "auto",
                      transition: "background 0.2s ease-in-out",
                      cursor: "pointer"
                    }}
                    title={!outOfRange ? (dot?.v ? `${dot.v} items completed` : "No activity") : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 14 }}>
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>Less</span>
        {[0, 1, 3, 5, 8, 12].map((v, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: getDotColor(v, C) }} />
        ))}
        <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>More</span>
      </div>
    </div>
  );
}










