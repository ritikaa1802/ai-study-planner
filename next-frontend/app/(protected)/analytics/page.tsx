"use client";

import { useRouter } from "next/navigation";
import { Insights } from "@/legacy/pages/Insights";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function AnalyticsPage() {
  const { C } = useThemeShell();
  const router = useRouter();
  return <Insights C={C} onNavigateToPomodoro={() => router.push("/pomodoro")} />;
}
