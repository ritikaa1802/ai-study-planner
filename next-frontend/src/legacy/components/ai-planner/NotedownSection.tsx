import React, { useState, useMemo, useEffect } from "react";
import { Theme } from "../../types";
import { apiFetch } from "../../utils/api";

export type NoteTag = "Concept" | "Formula" | "To-do" | "Reminder" | "Other";
export type NoteColor = "yellow" | "green" | "purple" | "pink" | "blue";

export interface StickyNote {
    id: number;
    text: string;
    tag: NoteTag;
    color: NoteColor;
    createdAt: string;
    isPinned: boolean;
}

interface NotedownSectionProps {
    C: Theme;
    dark: boolean;
}

const COLOR_MAP: Record<NoteColor, string> = { yellow: '#eab308', green: '#22c55e', purple: '#8b5cf6', pink: '#ec4899', blue: '#3b82f6' };

const TAGS: NoteTag[] = ["Concept", "Formula", "To-do", "Reminder", "Other"];

export function NotedownSection({ C, dark }: NotedownSectionProps) {
    const [notes, setNotes] = useState<StickyNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isComposing, setIsComposing] = useState(false);
    const [newText, setNewText] = useState("");
    const [newTag, setNewTag] = useState<NoteTag>("Concept");
    const [newColor, setNewColor] = useState<NoteColor>("yellow");
    const [filterTag, setFilterTag] = useState<NoteTag | "All">("All");

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await apiFetch("/api/notes");
                if (res.ok) {
                    const data = await res.json();
                    setNotes(data);
                }
            } catch (err) {
                console.error("Failed to load notes:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotes();
    }, []);

    const saveNote = async () => {
        if (!newText.trim()) return;

        try {
            const res = await apiFetch("/api/notes", {
                method: "POST",
                body: JSON.stringify({
                    text: newText.trim(),
                    tag: newTag,
                    color: newColor,
                    isPinned: false
                })
            });

            if (res.ok) {
                const newNote = await res.json();
                setNotes([newNote, ...notes]);
                setIsComposing(false);
                setNewText("");
                setNewTag("Concept");
                setNewColor("yellow");
            }
        } catch (err) {
            console.error("Failed to save note:", err);
        }
    };

    const deleteNote = async (id: number) => {
        try {
            const res = await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
            if (res.ok) setNotes(notes.filter((n) => n.id !== id));
        } catch (err) {
            console.error("Failed to delete note:", err);
        }
    };

    const togglePin = async (id: number) => {
        const note = notes.find((n) => n.id === id);
        if (!note) return;

        try {
            const res = await apiFetch(`/api/notes/${id}`, {
                method: "PUT",
                body: JSON.stringify({ isPinned: !note.isPinned })
            });
            if (res.ok) {
                const updated = await res.json();
                setNotes(notes.map((n) => (n.id === id ? updated : n)));
            }
        } catch (err) {
            console.error("Failed to update pin state:", err);
        }
    };

    const filteredAndSortedNotes = useMemo(() => {
        const filtered = filterTag === "All" ? notes : notes.filter((n) => n.tag === filterTag);
        // Pinned first, then by date descending (assuming newer is top, which matches state unshift)
        return filtered.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notes, filterTag]);

    const pinnedCount = notes.filter((n) => n.isPinned).length;

    return (
        <section className="mt-8 animate-in-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: C.text }}>
                        Notedown
                    </h2>
                    <p className="mt-1 text-sm font-medium" style={{ color: C.subtext }}>
                        {notes.length} {notes.length === 1 ? "note" : "notes"} · {pinnedCount} pinned
                    </p>
                </div>
                <button
                    onClick={() => setIsComposing(true)}
                    className="h-10 rounded-xl px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                    style={{ background: C.accent }}
                >
                    + Add note
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip label="All" count={notes.length} active={filterTag === "All"} onClick={() => setFilterTag("All")} C={C} dark={dark} />
                {TAGS.map((tag) => (
                    <FilterChip
                        key={tag}
                        label={tag}
                        count={notes.filter((n) => n.tag === tag).length}
                        active={filterTag === tag}
                        onClick={() => setFilterTag(tag)}
                        C={C}
                        dark={dark}
                    />
                ))}
            </div>

            {isComposing && (
                <div
                    className="mb-8 rounded-3xl p-5 md:p-6 animate-in-fade"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}
                >
                    <textarea
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Jot down a quick thought..."
                        className="w-full bg-transparent outline-none resize-none min-h-[100px] text-base"
                        style={{ color: C.text }}
                        autoFocus
                    />
                    <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-t pt-4" style={{ borderColor: C.border }}>
                        <div className="flex flex-wrap items-center gap-4">
                            <select
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value as NoteTag)}
                                className="h-9 rounded-lg px-3 text-sm font-medium outline-none cursor-pointer"
                                style={{ background: C.inputBg, color: C.text, border: `1px solid ${C.border}` }}
                            >
                                {TAGS.map((tag) => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2">
                                {(Object.keys(COLOR_MAP) as NoteColor[]).map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewColor(color)}
                                        className="w-6 h-6 rounded-full transition-transform"
                                        style={{
                                            background: COLOR_MAP[color],
                                            transform: newColor === color ? "scale(1.2)" : "scale(1)",
                                            border: `2px solid ${C.bg}`,
                                            boxShadow: newColor === color ? `0 0 0 2px ${C.text}` : "none",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsComposing(false);
                                    setNewText("");
                                }}
                                className="h-9 px-4 rounded-lg text-sm font-medium transition hover:opacity-80"
                                style={{ color: C.subtext }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveNote}
                                disabled={!newText.trim()}
                                className="h-9 px-4 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                style={{ background: C.text, color: C.bg }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full animate-spin border-4 border-t-transparent" style={{ borderColor: C.border, borderTopColor: C.accent }} />
                </div>
            ) : filteredAndSortedNotes.length === 0 ? (
                <div className="text-center py-12 rounded-3xl" style={{ border: `1px dashed ${C.border}` }}>
                    <p className="text-sm" style={{ color: C.subtext }}>No notes found for this filter.</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                    {filteredAndSortedNotes.map((note) => (
                        <div
                            key={note.id}
                            className="break-inside-avoid w-full rounded-2xl p-5 relative group transition-all"
                            style={{
                                background: C.card,
                                color: C.text,
                                border: `1px solid ${C.border}`,
                                borderTop: `4px solid ${COLOR_MAP[note.color]}`
                            }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span
                                    className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                    style={{
                                        background: dark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)",
                                    }}
                                >
                                    {note.tag}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => togglePin(note.id)}
                                        className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition"
                                        title={note.isPinned ? "Unpin note" : "Pin note"}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill={note.isPinned ? "currentColor" : "none"}
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M2 12h20M12 2v20" />
                                            <path d="M12 2L2 12h20L12 2z" style={{ display: "none" }} />
                                            {/* Drawing a better pin symbol */}
                                            <path d="M16 11V7a4 4 0 00-8 0v4l-2 4h12l-2-4z" />
                                            <line x1="12" y1="15" x2="12" y2="21" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition"
                                        title="Delete note"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                                {note.text}
                            </p>
                            {note.isPinned && (
                                <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/20 shadow-sm backdrop-blur-sm">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                        <path d="M16 11V7a4 4 0 00-8 0v4l-2 4h12l-2-4z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function FilterChip({
    label,
    count,
    active,
    onClick,
    C,
    dark,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
    C: Theme;
    dark: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
            style={{
                background: active ? (dark ? "rgba(255,255,255,0.1)" : C.text) : "transparent",
                color: active ? (dark ? "#fff" : C.bg) : C.subtext,
                border: `1px solid ${active ? "transparent" : C.border}`,
            }}
        >
            <span>{label}</span>
            <span
                className="px-1.5 rounded text-[11px]"
                style={{
                    background: active ? (dark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.2)") : C.inputBg,
                    color: active ? "inherit" : C.subtext,
                }}
            >
                {count}
            </span>
        </button>
    );
}
