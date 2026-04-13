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

  const fetchUser = async () => {
    try {
      const [profileRes, activityRes] = await Promise.all([
        apiFetch(`/api/users/profile`),
        apiFetch(`/api/activity`)
      ]);

      const profileData = await profileRes.json();
      const activityData = await activityRes.json();

      if (profileRes.ok && activityRes.ok) {
        const avatarValue = typeof profileData.avatar === "string" && profileData.avatar.trim()
          ? profileData.avatar
          : (profileData.name ? profileData.name.charAt(0).toUpperCase() : "S");

        setUser({
          id: profileData.id || 0,
          name: profileData.name || "Student",
          email: profileData.email || "",
          level: 1, // gamification default
          xp: 0,    // gamification default
          streak: activityData.currentStreak || 0,
          avatar: avatarValue,
          bio: profileData.bio,
          notifs: profileData.notifs,
        });
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dark, setDark, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
