import { Theme } from "../types";
import { NotedownSection } from "../components/ai-planner/NotedownSection";

interface NotedownProps {
    C: Theme;
    dark: boolean;
}

export function Notedown({ C, dark }: NotedownProps) {
    return (
        <div className={`${dark ? "dark" : ""} h-full overflow-y-auto px-6 py-7 md:px-8`} style={{ color: C.text, background: C.bg }}>
            <div className="mx-auto max-w-6xl space-y-6">
                <NotedownSection C={C} dark={dark} />
            </div>
        </div>
    );
}
