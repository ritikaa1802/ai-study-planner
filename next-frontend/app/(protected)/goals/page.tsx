"use client";

import { useRouter } from "next/navigation";
import { Goals } from "@/legacy/pages/Goals";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function GoalsPage() {
  const { C } = useThemeShell();
  const router = useRouter();
  return <Goals C={C} onNavigateToPomodoro={() => router.push("/pomodoro")} />;
}
