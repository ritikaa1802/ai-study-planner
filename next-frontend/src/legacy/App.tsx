import { useState, useEffect } from "react";
import { PageKey } from "./types";
import { LIGHT, DARK, NAV } from "./utils/constants";
import { AuthProvider } from "./context/AuthContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Navbar } from "./components/layout/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Goals } from "./pages/Goals";
import { Calendar } from "./pages/Calendar";
import { Focus } from "./pages/Focus";
import { Insights } from "./pages/Insights";
import { Resources, StudyCircle, Settings } from "./pages/Settings";
import { AuthPage } from "./pages/Login";
import { ResetPasswordPage } from "./pages/ResetPassword";
import { AIPlanner } from "./pages/AIPlanner";

const PAGE_TO_PATH: Record<PageKey, string> = {
  "Dashboard": "/dashboard",
  "Goals": "/goals",
  "Calendar": "/calendar",
  "Focus Mode": "/pomodoro",
  "Analytics": "/analytics",
  "Achievements": "/achievements",
  "AI Planner": "/ai-planner",
  "Resources": "/resources",
  "Study Circle": "/study-circle",
  "Settings": "/settings",
};

const PATH_TO_PAGE: Record<string, PageKey> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/goals": "Goals",
  "/calendar": "Calendar",
  "/pomodoro": "Focus Mode",
  "/analytics": "Analytics",
  "/achievements": "Achievements",
  "/ai-planner": "AI Planner",
  "/resources": "Resources",
  "/study-circle": "Study Circle",
  "/settings": "Settings",
};

export default function App() {
  // If the URL contains ?token=... show the reset password page
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("token")) {
    return <ResetPasswordPage />;
  }

  const [page, setPage] = useState<PageKey>(() => PATH_TO_PAGE[window.location.pathname] || "Dashboard");
  const [dark, setDark] = useState(false);
  // Derive auth state from localStorage token — cleared on logout
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("token"));
  const C = dark ? DARK : LIGHT;

  const handleLogin = () => {
    setPage("Dashboard");
    window.history.replaceState({}, "", PAGE_TO_PATH["Dashboard"]);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
    setPage("Dashboard");
    window.history.replaceState({}, "", "/");
  };

  const navigateToPage = (nextPage: PageKey) => {
    setPage(nextPage);
    const nextPath = PAGE_TO_PATH[nextPage];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  // Listen for token removal from other tabs / 401 handler
  useEffect(() => {
    const onStorage = () => {
      if (!localStorage.getItem("token")) setAuthed(false);
    };
    const onPopState = () => {
      const nextPage = PATH_TO_PAGE[window.location.pathname] || "Dashboard";
      setPage(nextPage);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (!authed) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case "Dashboard": return <Dashboard C={C} />;
      case "Goals": return <Goals C={C} onNavigateToPomodoro={() => navigateToPage("Focus Mode")} />;
      case "Calendar": return <Calendar C={C} />;
      case "Focus Mode": return <Focus C={C} />;
      case "Analytics": return <Insights C={C} onNavigateToPomodoro={() => navigateToPage("Focus Mode")} />;
      case "AI Planner": return <AIPlanner C={C} dark={dark} />;
      case "Resources": return <Resources C={C} />;
      case "Study Circle": return <StudyCircle C={C} />;
      case "Settings": return <Settings C={C} dark={dark} setDark={setDark} />;
      default: return <Dashboard C={C} />;
    }
  };

  return (
    <AuthProvider key={localStorage.getItem("token") ?? "guest"}>
      <div style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        background: C.bg,
        color: C.text,
        overflow: "hidden",
        transition: "background 0.3s, color 0.3s",
      }}>
        <Sidebar nav={NAV} page={page} setPage={(p) => navigateToPage(p as PageKey)} dark={dark} setDark={setDark} C={C} onLogout={handleLogout} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Navbar C={C} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            {renderPage()}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

