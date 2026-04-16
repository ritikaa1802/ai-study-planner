"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider } from "@/legacy/context/AuthContext";
import { Sidebar } from "@/legacy/components/layout/Sidebar";
import { Navbar } from "@/legacy/components/layout/Navbar";
import { LIGHT, DARK, NAV } from "@/legacy/utils/constants";
import { PageKey } from "@/legacy/types";
import { ThemeShellProvider } from "@/next/ThemeShellContext";

const PATH_TO_PAGE: Record<string, PageKey> = {
  "/dashboard": "Dashboard",
  "/goals": "Goals",
  "/calendar": "Calendar",
  "/pomodoro": "Focus Mode",
  "/analytics": "Analytics",
  "/ai-planner": "AI Planner",
  "/resources": "Resources",
  "/study-circle": "Study Circle",
  "/settings": "Settings",
};

const PAGE_TO_PATH: Record<PageKey, string> = {
  "Dashboard": "/dashboard",
  "Goals": "/goals",
  "Calendar": "/calendar",
  "Focus Mode": "/pomodoro",
  "Analytics": "/analytics",
  "AI Planner": "/ai-planner",
  "Resources": "/resources",
  "Study Circle": "/study-circle",
  "Settings": "/settings",
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(!!localStorage.getItem("token"));
    const savedDark = localStorage.getItem("dark_mode");
    if (savedDark === "1") setDark(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("dark_mode", dark ? "1" : "0");
  }, [mounted, dark]);

  useEffect(() => {
    if (!mounted) return;
    if (!authed) {
      router.replace("/login");
      return;
    }

    const onStorage = () => {
      if (!localStorage.getItem("token")) {
        setAuthed(false);
        router.replace("/login");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted, authed, router]);

  const C = dark ? DARK : LIGHT;
  const page = PATH_TO_PAGE[pathname] || "Dashboard";

  const navigateToPage = (p: string) => {
    const target = PAGE_TO_PATH[p as PageKey];
    if (target) router.push(target);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
    router.replace("/login");
  };

  const providerKey = useMemo(() => (mounted ? localStorage.getItem("token") ?? "guest" : "guest"), [mounted, authed]);

  if (!mounted || !authed) return null;

  return (
    <AuthProvider key={providerKey}>
      <ThemeShellProvider value={{ C, dark, setDark }}>
        <div
          className={dark ? "dark" : ""}
          style={{
            display: "flex",
            height: "100vh",
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
            background: C.bg,
            color: C.text,
            overflow: "hidden",
            transition: "background 0.3s, color 0.3s",
          }}
        >
          <Sidebar nav={NAV} page={page} setPage={navigateToPage} dark={dark} setDark={setDark} C={C} onLogout={handleLogout} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Navbar C={C} />
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>{children}</div>
          </div>
        </div>
      </ThemeShellProvider>
    </AuthProvider>
  );
}
