"use client";

import { Focus } from "@/legacy/pages/Focus";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function PomodoroPage() {
  const { C } = useThemeShell();
  return <Focus C={C} />;
}
