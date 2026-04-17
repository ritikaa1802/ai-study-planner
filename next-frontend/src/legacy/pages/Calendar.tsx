import { useState } from "react";
import { Theme, CalendarEvent, EventTag } from "../types";
import { useCalendar } from "../hooks/useCalendar";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ICONS } from "../utils/constants";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Badge({ type, C }: { type: string; C: Theme }) {
  const map: Record<string, { bg: string; color: string }> = {
    exam: { bg: "#fee2e2", color: "#ef4444" },
    study: { bg: "#dbeafe", color: "#2563eb" },
    deadline: { bg: "#fef3c7", color: "#b45309" },
    presentation: { bg: "#dcfce7", color: "#16a34a" },
  };
  const s = map[type] || { bg: "#f3f4f6", color: "#6b7280" };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{type}</span>;
}

interface CalendarProps { C: Theme; }

const evBg: Record<EventTag, string> = { exam: "#fee2e2", study: "#dbeafe", deadline: "#fef3c7", presentation: "#dcfce7" };
const evCl: Record<EventTag, string> = { exam: "#ef4444", study: "#2563eb", deadline: "#b45309", presentation: "#16a34a" };
const tagLabels: Record<EventTag, string> = { exam: "Exam", study: "Study", deadline: "Deadline", presentation: "Presentation" };

export function Calendar({ C }: CalendarProps) {
  const today = new Date();
  const [{ month, year }, setCur] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const [sel, setSel] = useState(isCurrentMonth ? today.getDate() : 1);
  const [showModal, setShowModal] = useState(false);
  const { events, addEvent: addEventApi, deleteEvent: deleteEventApi } = useCalendar();

  const [form, setForm] = useState({ title: "", tag: "study" as EventTag, time: "09:00 AM", day: isCurrentMonth ? today.getDate() : 1 });
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: 42 }, (_, i) => { const d = i - startDay + 1; return d > 0 && d <= daysInMonth ? d : null; });
  
  const allEvents = Object.keys(events).flatMap((day) => events[Number(day)]);
  const upcoming = allEvents.filter((ev) => (ev as any).day >= (isCurrentMonth ? today.getDate() : 1)).sort((a, b) => (a as any).day - (b as any).day);

  const prevMonth = () => setCur(c => c.month === 0 ? { month: 11, year: c.year - 1 } : { month: c.month - 1, year: c.year });
  const nextMonth = () => setCur(c => c.month === 11 ? { month: 0, year: c.year + 1 } : { month: c.month + 1, year: c.year });
  const goToday = () => { setCur({ month: today.getMonth(), year: today.getFullYear() }); setSel(today.getDate()); };

  const addEvent = async () => {
    if (!form.title.trim()) return;
    const d = Number(form.day);
    await addEventApi({ title: form.title.trim(), tag: form.tag, time: form.time, date: `Feb ${d}`, day: d });
    setShowModal(false);
  };

  const deleteEvent = async (day: number, id: number) => {
    await deleteEventApi(id);
  };

  return (
    <div className="box-border h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:gap-5">
        <Card C={C} style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>{new Date(year, month).toLocaleString('default', { month: 'long' })} {year}</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={prevMonth} style={{ border: `1px solid ${C.border}`, background: C.inputBg, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: C.text }}>‹</button>
              <button onClick={goToday} style={{ border: `1px solid ${C.border}`, background: C.inputBg, borderRadius: 8, padding: "4px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.text }}>Today</button>
              <button onClick={nextMonth} style={{ border: `1px solid ${C.border}`, background: C.inputBg, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: C.text }}>›</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
            {days.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: C.muted, paddingBottom: 8 }}>{d}</div>)}
            {cells.map((day, i) => (
              <div key={i} onClick={() => day && setSel(day)}
                style={{ minHeight: 68, borderRadius: 12, padding: 7, background: day === sel ? C.accent : C.bg, cursor: day ? "pointer" : "default", border: `1px solid ${day === sel ? C.accent : C.border}`, opacity: day ? 1 : 0 }}>
                {day && <>
                  <span style={{ fontSize: 13, fontWeight: day === sel ? 700 : 400, color: day === sel ? "#fff" : C.text }}>{day}</span>
                  {(events[day] || []).map((ev, j) => (
                    <div key={j} style={{ fontSize: 9, borderRadius: 4, padding: "1px 4px", marginTop: 3, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", background: evBg[ev.tag], color: evCl[ev.tag] }}>{ev.title}</div>
                  ))}
                </>}
              </div>
            ))}
          </div>
        </Card>

        <div className="w-full xl:w-[285px] xl:flex-shrink-0">
          <button onClick={() => { setForm({ title: "", tag: "study", time: "09:00 AM", day: sel || 23 }); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "11px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 18, boxSizing: "border-box" }}>
            <Ic d={ICONS.plus} size={16} color="#fff" sw={2.5} /> Add Event
          </button>

          {sel && (events[sel] || []).length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.accent }}>{new Date(year, month).toLocaleString('default', { month: 'short' })} {sel}</h3>
              {(events[sel] || []).map((ev) => (
                <Card key={ev.id} C={C} style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1, marginRight: 8 }}>{ev.title}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge type={ev.tag} C={C} />
                      <span onClick={() => deleteEvent(sel, ev.id)} style={{ cursor: "pointer", color: C.muted, fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>{ev.time}</div>
                </Card>
              ))}
              <div style={{ borderBottom: `1px solid ${C.border}`, margin: "14px 0" }} />
            </>
          )}

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.text }}>Upcoming Events</h3>
          {upcoming.length === 0
            ? <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>No upcoming events.</p>
            : upcoming.map((ev) => (
              <Card key={ev.id} C={C} style={{ marginBottom: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1, marginRight: 8 }}>{ev.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Badge type={ev.tag} C={C} />
                    <span onClick={() => deleteEvent(ev.day, ev.id)} style={{ cursor: "pointer", color: C.muted, fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{ev.time} · {ev.date}</div>
              </Card>
            ))
          }
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} C={C} width={400}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>Add New Event</h3>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Event Title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Physics Exam..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Date ({new Date(year, month).toLocaleString('default', { month: 'short' })})</label>
              <input type="number" min={1} max={daysInMonth} value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Time</label>
              <input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="09:00 AM"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 8 }}>Event Type</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
            {(Object.entries(tagLabels) as [EventTag, string][]).map(([key, label]) => (
              <div key={key} onClick={() => setForm((f) => ({ ...f, tag: key }))}
                style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, background: form.tag === key ? evBg[key] : C.bg, color: form.tag === key ? evCl[key] : C.muted, border: `2px solid ${form.tag === key ? evCl[key] + "55" : C.border}`, transition: "all 0.15s" }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={addEvent} disabled={!form.title.trim()}
              style={{ flex: 2, padding: 11, borderRadius: 12, border: "none", background: !form.title.trim() ? C.border : C.accent, color: !form.title.trim() ? C.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: !form.title.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              Add Event
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
