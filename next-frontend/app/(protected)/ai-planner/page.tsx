"use client";

import { AIPlanner } from "@/legacy/pages/AIPlanner";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function AIPlannerPage() {
  const { C, dark } = useThemeShell();
  return <AIPlanner C={C} dark={dark} />;
}
