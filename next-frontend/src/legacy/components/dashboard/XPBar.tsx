import { Theme } from "../../types";
import { Card } from "../ui/Card";
import { ICONS } from "../../utils/constants";
import { useAuthContext } from "../../context/AuthContext";

interface XPBarProps {
  C: Theme;
}

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function XPBar({ C }: XPBarProps) {
  const { user } = useAuthContext();

  // Each level requires level * 100 XP (Level 1 = 100xp, Level 2 = 200xp …)
  const xpForCurrentLevel = user.level * 100;
  const xpProgress = Math.min((user.xp % xpForCurrentLevel) / xpForCurrentLevel, 1);
  const xpToNext = xpForCurrentLevel - (user.xp % xpForCurrentLevel);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 md:gap-4">
      <Card C={C} style={{ flex: 1, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: 500 }}>Experience</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 10 }}>{user.xp.toLocaleString()} XP</div>
            <div style={{ height: 6, background: C.border, borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${xpProgress * 100}%`, background: C.accentBar, borderRadius: 999, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>{xpToNext} XP to Level {user.level + 1}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 12 }}>
            <Ic d={ICONS.trophy} size={22} color={C.accent} />
          </div>
        </div>
      </Card>

      <Card C={C} style={{ flex: 1, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: 500 }}>Current Level</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.text }}>{user.level}</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={ICONS.trend} size={22} color={C.accent} />
          </div>
        </div>
      </Card>

      <Card C={C} style={{ flex: 1, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, fontWeight: 500 }}>Current Streak</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.text }}>{user.streak}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>days in a row</div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fff3e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={ICONS.fire} size={22} color={C.orange} />
          </div>
        </div>
      </Card>
    </div>
  );
}
