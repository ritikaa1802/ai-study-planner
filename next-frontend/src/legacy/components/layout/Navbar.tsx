import { useState, useEffect } from "react";
import { Theme, Notification } from "../../types";
import { ICONS } from "../../utils/constants";
import { useAuthContext } from "../../context/AuthContext";
import { apiFetch, resolveApiUrl } from "../../utils/api";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

interface HeaderProps {
  C: Theme;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Navbar({ C, onMenuToggle, showMenuButton = false }: HeaderProps) {
  const { user } = useAuthContext();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const normalizeNotifications = (raw: unknown): Notification[] => {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item, index) => {
        const value = item as Partial<Notification>;
        if (typeof value.text !== "string" || !value.text.trim()) {
          return null;
        }

        return {
          id: typeof value.id === "number" ? value.id : index + 1,
          text: value.text.trim(),
          time: typeof value.time === "string" && value.time.trim() ? value.time : "Recently",
          unread: Boolean(value.unread),
        };
      })
      .filter((item): item is Notification => item !== null);
  };

  useEffect(() => {
    setNotifs(normalizeNotifications(user.notifs));
  }, [user.notifs]);

  const unreadCount = notifs.filter((n) => n.unread).length;
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const avatarSrc = user.avatar
    ? (user.avatar.startsWith("data:") ? user.avatar : (user.avatar.startsWith("/") || user.avatar.startsWith("http") ? resolveApiUrl(user.avatar) : ""))
    : "";

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarSrc]);

  const handleMarkAsRead = async () => {
    const updatedNotifs = notifs.map((n) => ({ ...n, unread: false }));
    setNotifs(updatedNotifs);

    try {
      await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({ notifs: updatedNotifs }),
      });
    } catch (error) {
      console.error("Failed to persist notification read state", error);
    }
  };

  return (
    <div
      className="relative flex shrink-0 items-center justify-between gap-2 border-b px-3 py-3 sm:gap-3 sm:px-4 md:px-6 lg:px-7"
      style={{ background: C.card, borderBottomColor: C.border, transition: "background 0.3s" }}
    >
      {/* Left: date */}
      <div className="flex min-w-0 items-center gap-2">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-md border"
            aria-label="Open menu"
            style={{ borderColor: C.border, background: C.inputBg, color: C.text }}
          >
            <Ic d="M3 6h18M3 12h18M3 18h18" size={16} color={C.text} sw={2.2} />
          </button>
        )}
        <Ic d={ICONS.calendar} size={15} color={C.muted} />
        <span className="hidden truncate text-xs font-medium sm:block" style={{ color: C.muted }}>{dateStr}</span>
      </div>

      {/* Right */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-4">
        {/* Bell */}
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setNotifOpen((o) => !o)}>
          <Ic d={ICONS.bell} size={20} color={notifOpen ? C.accent : C.muted} />
          {unreadCount > 0 && (
            <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</div>
          )}
        </div>

        {notifOpen && (
          <div className="absolute right-2 top-[calc(100%+8px)] z-[100] w-[92vw] max-w-[300px] overflow-hidden sm:right-16" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.text }}>Notifications</div>
            {notifs.length === 0 && (
              <div style={{ padding: "14px 16px", fontSize: 13, color: C.muted }}>
                No notifications yet.
              </div>
            )}
            {notifs.map((n) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-start", background: n.unread ? C.accentBg : "transparent" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.unread ? C.accent : "transparent", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: n.unread ? 500 : 400 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
            {notifs.length > 0 && (
              <div onClick={handleMarkAsRead} style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600 }}>Mark all as read</div>
            )}
          </div>
        )}

        {/* Avatar */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block" style={{ textAlign: "right" }}>
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
