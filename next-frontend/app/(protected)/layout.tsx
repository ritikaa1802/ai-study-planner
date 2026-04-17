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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        setMobileNavOpen(false);
      }
    };

    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, [mounted]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
          className={`${dark ? "dark" : ""} flex h-screen overflow-hidden`}
          style={{
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
            background: C.bg,
            color: C.text,
            transition: "background 0.3s, color 0.3s",
          }}
        >
          <div className="hidden lg:block">
            <Sidebar nav={NAV} page={page} setPage={navigateToPage} dark={dark} setDark={setDark} C={C} onLogout={handleLogout} />
          </div>

          {mobileNavOpen && (
            <button
              className="fixed inset-0 z-30 bg-black/35 lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          <Sidebar
            nav={NAV}
            page={page}
            setPage={navigateToPage}
            dark={dark}
            setDark={setDark}
            C={C}
            onLogout={handleLogout}
            mobile
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ flex: 1 }}>
            <Navbar C={C} onMenuToggle={() => setMobileNavOpen((v) => !v)} />
            <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
          </div>
        </div>
      </ThemeShellProvider>
    </AuthProvider>
  );
}
