"use client";

import { StudyCircle } from "@/legacy/pages/Settings";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function StudyCirclePage() {
  const { C } = useThemeShell();
  return <StudyCircle C={C} />;
}
