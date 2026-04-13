"use client";

import { Dashboard } from "@/legacy/pages/Dashboard";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function DashboardPage() {
  const { C } = useThemeShell();
  return <Dashboard C={C} />;
}
