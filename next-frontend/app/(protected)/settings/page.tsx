"use client";

import { Settings } from "@/legacy/pages/Settings";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function SettingsPage() {
  const { C, dark, setDark } = useThemeShell();
  return <Settings C={C} dark={dark} setDark={setDark} />;
}
