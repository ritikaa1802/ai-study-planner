"use client";

import { Resources } from "@/legacy/pages/Settings";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function ResourcesPage() {
  const { C } = useThemeShell();
  return <Resources C={C} />;
}
