"use client";

import { createContext, useContext } from "react";
import { Theme } from "@/legacy/types";

interface ThemeShellContextValue {
  C: Theme;
  dark: boolean;
  setDark: (value: boolean) => void;
}

const ThemeShellContext = createContext<ThemeShellContextValue | null>(null);

export function ThemeShellProvider({ value, children }: { value: ThemeShellContextValue; children: React.ReactNode }) {
  return <ThemeShellContext.Provider value={value}>{children}</ThemeShellContext.Provider>;
}

export function useThemeShell() {
  const ctx = useContext(ThemeShellContext);
  if (!ctx) {
    throw new Error("useThemeShell must be used within ThemeShellProvider");
  }
  return ctx;
}
