import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiFetch } from "../utils/api";

interface User {
  id?: number;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  avatar: string;
  bio?: string;
  notifs?: any;
}

interface AuthContextValue {
  user: User;
  dark: boolean;
  setDark: (v: boolean) => void;
  refreshUser: () => Promise<void>;
  authError?: string;
}

const defaultUser: User = {
  id: 0,
  name: "New Student",
  email: "",
  level: 1,
  xp: 0,
  streak: 0,
  avatar: "N",
};

const AuthContext = createContext<AuthContextValue>({
  user: defaultUser,
  dark: false,
  setDark: () => { },
  refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User>(defaultUser);
  const [authError, setAuthError] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUser = async () => {
    try {
      setAuthError(undefined);

      // Check if token exists
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        console.warn("No token found in localStorage");
        return;
      }

      const [profileRes, activityRes] = await Promise.all([
        apiFetch(`/api/users/profile`, { skipAuthRedirect: true }),
        apiFetch(`/api/activity`, { skipAuthRedirect: true })
      ]);

      const profileData = await profileRes.json();
      const activityData = await activityRes.json();

      if (!profileRes.ok) {
        const errorMsg = (profileData as any)?.message || (profileData as any)?.reason || (profileData as any)?.error || "Authentication failed";
        console.error("[Auth] Profile fetch failed:", profileRes.status, errorMsg);
        setAuthError(`Token validation failed: ${errorMsg}`);
        return;
      }

      if (!activityRes.ok) {
        console.warn("[Auth] Activity fetch failed:", activityRes.status);
        // Don't fail auth if activity fetch fails - it's non-critical
      }

      const avatarValue = typeof profileData.avatar === "string" && profileData.avatar.trim()
        ? profileData.avatar
        : (profileData.name ? profileData.name.charAt(0).toUpperCase() : "S");

      setUser({
        id: profileData.id || 0,
        name: profileData.name || "Student",
        email: profileData.email || "",
        level: profileData.level ?? 1,
        xp: profileData.xp ?? 0,
        streak: (activityData as any)?.currentStreak || 0,
        avatar: avatarValue,
        bio: profileData.bio,
        notifs: profileData.notifs,
      });
    } catch (err) {
      console.error("[Auth] Error fetching user data:", err);
      setAuthError(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dark, setDark, refreshUser: fetchUser, authError }}>
      {isInitialized && authError && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "#ef444488",
          color: "#dc2626",
          padding: "12px 16px",
          fontSize: "14px",
          zIndex: 9999,
          textAlign: "center",
          backdropFilter: "blur(2px)",
          fontWeight: 600
        }}>
          ⚠️ {authError} - Try logging out and back in
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
