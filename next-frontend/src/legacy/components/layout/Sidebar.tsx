import { Theme, NavItem } from "../../types";
import { ICONS, LIGHT } from "../../utils/constants";
import Link from "next/link";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 46, height: 25, borderRadius: 999, background: on ? LIGHT.accent : "#9298b0", position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2.5, left: on ? 23 : 2.5, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
    </div>
  );
}

interface SidebarProps {
  nav: NavItem[];
  page: string;
  setPage: (p: string) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  C: Theme;
  onLogout?: () => void;
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ nav, page, setPage, dark, setDark, C, onLogout, mobile = false, open = false, onClose }: SidebarProps) {
  return (
    <div
      className={mobile ? "fixed inset-y-0 left-0 z-40 w-64 lg:hidden" : "w-[222px]"}
      style={{
        background: C.sidebar,
        display: "flex",
        flexDirection: "column",
        padding: "16px 10px",
        flexShrink: 0,
        transition: "background 0.3s, transform 0.25s ease",
        transform: mobile ? (open ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff", fontWeight: 700, fontSize: 17, padding: "4px 10px 20px", letterSpacing: "-0.3px" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic d={ICONS.star} size={17} color="#fff" sw={2} />
        </div>
        StudyFlow
        {mobile && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              marginLeft: "auto",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              width: 30,
              height: 30,
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Nav items */}
      {nav.map((n) => {
        const active = page === n.key;
        return (
          <Link
            key={n.key}
            href={n.href || "#"}
            onClick={() => setPage(n.key)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: active ? C.sidebarActive : "transparent", color: active ? C.sidebarActiveText : C.sidebarText, cursor: "pointer", fontSize: 13.5, fontWeight: active ? 600 : 400, marginBottom: 1, transition: "all 0.15s", textDecoration: "none" }}
          >
            <Ic d={n.icon} size={16} color={active ? "#fff" : "rgba(255,255,255,0.55)"} />
            {n.key}
          </Link>
        );
      })}

      {/* Dark mode + Logout */}
      <div style={{ marginTop: "auto", padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Ic d={dark ? ICONS.moon : ICONS.sun} size={14} color="rgba(255,255,255,0.6)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{dark ? "Dark mode" : "Light mode"}</span>
          </div>
          <Toggle on={dark} onChange={setDark} />
        </div>
        {onLogout && (
          <button onClick={onLogout} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: "0.02em" }}>
            <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={13} color="rgba(255,255,255,0.65)" />
            Log out
          </button>
        )}
      </div>
    </div>
  );
}
