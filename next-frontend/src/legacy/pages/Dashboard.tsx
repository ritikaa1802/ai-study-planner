import { useState, useEffect, useRef } from "react";
import { Theme } from "../types";
import { Card } from "../components/ui/Card";
import { Heatmap } from "../components/dashboard/Heatmap";
import { InsightCard } from "../components/dashboard/InsightCard";
import { XPBar } from "../components/dashboard/XPBar";
import { ProductivityGarden } from "../../components/dashboard/ProductivityGarden";
import { getGreeting, getSarcasticThought } from "../utils/helpers";
import { ICONS } from "../utils/constants";
import { useAuthContext } from "../context/AuthContext";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface DashboardProps {
  C: Theme;
}

const TABS = [
  { id: "overview",    label: "Overview" },
  { id: "consistency", label: "Consistency" },
  { id: "garden",      label: "Garden 🌿" },
];

const SECTIONS = ["overview", "consistency", "garden"];

export function Dashboard({ C }: DashboardProps) {
  const { user } = useAuthContext();
  const [activeSection, setActiveSection] = useState("overview");
  const scrollRef = useRef<HTMLDivElement>(null);
  const streak = user.streak || 0;

  const scrollTo = (id: string) => {
    const el = document.getElementById(`dash-${id}`);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop - 56, behavior: "smooth" });
    }
    setActiveSection(id);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(`dash-${SECTIONS[i]}`);
        if (el && container.scrollTop >= el.offsetTop - 80) {
          setActiveSection(SECTIONS[i]);
          break;
        }
      }
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sticky tab bar */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-3 sm:px-4 md:px-6 lg:px-7" style={{ background: C.card, borderBottom: `1px solid ${C.border}`, zIndex: 10 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => scrollTo(t.id)}
            className="whitespace-nowrap"
            style={{ padding: "12px 18px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeSection === t.id ? 700 : 400, color: activeSection === t.id ? C.accent : C.muted, borderBottom: activeSection === t.id ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: -1, transition: "all 0.15s", letterSpacing: "0.01em" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="dashboard-scroll box-border flex-1 overflow-y-auto p-3 pb-6 sm:p-4 sm:pb-8 md:p-6 md:pb-10 lg:p-7">
        {/* Greeting */}
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>{getGreeting()}, {user.name.split(" ")[0]}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted, fontStyle: "italic" }}>"{getSarcasticThought(user.streak)}"</p>
        </div>

        {/* Overview */}
        <div id="dash-overview" style={{ marginBottom: 32 }}>
          <XPBar C={C} />
        </div>

        {/* Consistency */}
        <div id="dash-consistency" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, borderRadius: 999, background: C.accent }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Consistency</span>
          </div>
          <Card C={C}>
            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3" style={{}}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: C.text }}>Consistency Tracker</h2>
              <span style={{ background: "#e8c87a22", color: "#b08a30", border: "1px solid #e8c87a88", fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>{new Date().getFullYear()}</span>
            </div>
            <Heatmap C={C} />
            <div className="mt-4 flex flex-wrap gap-4 sm:gap-6">
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <Ic d={ICONS.fire} size={16} color={C.orange} />
                <strong style={{ color: C.text }}>{user.streak} day</strong>
                <span style={{ color: C.muted }}>streak</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic d={ICONS.check} size={10} color={C.accent} sw={3} />
                </div>
                <strong style={{ color: C.text }}>0%</strong>
                <span style={{ color: C.muted }}>this month</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Productivity Garden */}
        <div id="dash-garden" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 16, borderRadius: 999, background: C.green }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Productivity Garden</span>
          </div>
          <ProductivityGarden C={C} streak={streak} />
        </div>
      </div>
    </div>
  );
}
