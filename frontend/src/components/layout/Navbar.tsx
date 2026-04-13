import { useState, useEffect } from "react";
import { Theme, Notification } from "../../types";
import { ICONS } from "../../utils/constants";
import { useAuthContext } from "../../context/AuthContext";
import { resolveApiUrl } from "../../utils/api";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface HeaderProps {
  C: Theme;
}

export function Navbar({ C }: HeaderProps) {
  const { user } = useAuthContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    if (notifs.length === 0) {
      setNotifs([
        { id: 1, text: `You're on a ${user.streak}-day streak! Keep going!`, time: "Just now", unread: true },
        { id: 2, text: "Welcome to your Study Planner dashboard.", time: "2h ago", unread: user.streak === 0 }
      ]);
    }
  }, [user.streak, notifs.length]);

  const unreadCount = notifs.filter((n) => n.unread).length;
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const avatarSrc = user.avatar && (user.avatar.startsWith("/") || user.avatar.startsWith("http"))
    ? resolveApiUrl(user.avatar)
    : "";

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarSrc]);

  const handleMarkAsRead = () => {
    setNotifs(notifs.map(n => ({ ...n, unread: false })));
  };

  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.3s", position: "relative" }}>
      {/* Left: date */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ic d={ICONS.calendar} size={15} color={C.muted} />
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{dateStr}</span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Bell */}
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setNotifOpen((o) => !o)}>
          <Ic d={ICONS.bell} size={20} color={notifOpen ? C.accent : C.muted} />
          {unreadCount > 0 && (
            <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</div>
          )}
        </div>

        {notifOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 90, width: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.text }}>Notifications</div>
            {notifs.map((n) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-start", background: n.unread ? C.accentBg : "transparent" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.unread ? C.accent : "transparent", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: n.unread ? 500 : 400 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
            <div onClick={handleMarkAsRead} style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600 }}>Mark all as read</div>
          </div>
        )}

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Level {user.level} · {user.xp.toLocaleString()} XP</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, cursor: "pointer", flexShrink: 0, overflow: "hidden" }}>
            {avatarSrc && !avatarLoadError ? (
              <img src={avatarSrc} alt="User avatar" onError={() => setAvatarLoadError(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user.avatar
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
