"use client";

import { Notedown } from "@/legacy/pages/Notedown";
import { useThemeShell } from "@/next/ThemeShellContext";

export default function NotedownPage() {
    const { C, dark } = useThemeShell();
    return <Notedown C={C} dark={dark} />;
}
