"use client";

import { Calendar } from "@/legacy/pages/Calendar";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function CalendarPage() {
  const { C } = useThemeShell();
  return <Calendar C={C} />;
}
