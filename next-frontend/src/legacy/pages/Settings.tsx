import { useState, useEffect, useRef } from "react";
import { Theme } from "../types";
import { Card } from "../components/ui/Card";
import { useResources } from "../hooks/useResources";
import { useStudyCircles } from "../hooks/useStudyCircles";
import { useCircleData } from "../hooks/useCircleData";
import { Modal } from "../components/ui/Modal";
import { ICONS } from "../utils/constants";
import { useAuthContext } from "../context/AuthContext";
import { apiFetch, resolveApiUrl } from "../utils/api";

function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }: { d: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Badge({ type, C }: { type: string; C: Theme }) {
  const map: Record<string, { bg: string; color: string }> = {
    Mathematics: { bg: C.accentBg, color: C.accent },
    Physics: { bg: "#dbeafe", color: "#2563eb" },
    Chemistry: { bg: "#fef3c7", color: "#b45309" },
    History: { bg: "#f0fdf4", color: "#16a34a" },
    "Computer Science": { bg: "#fce7f3", color: "#be185d" },
    Literature: { bg: "#fff7ed", color: "#c2410c" },
  };
  const s = map[type] || { bg: "#f3f4f6", color: "#6b7280" };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{type}</span>;
}

// ── Resources ────────────────────────────────────────────
interface ResourcesProps { C: Theme; }

export function Resources({ C }: ResourcesProps) {
  const { resources, addResource, deleteResource } = useResources();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{ title: string; url: string; file: File | null }>({ title: "", url: "", file: null });

  const im: Record<string, string> = { Documents: ICONS.doc, Videos: ICONS.video, Links: ICONS.link };

  const items = resources.map(r => {
    let type = "Links";
    if (r.fileType?.startsWith("video/") || r.url?.includes("youtube") || r.url?.includes("video")) {
      type = "Videos";
    } else if (r.fileUrl) {
      type = "Documents"; // Catch-all for uploaded images, PDFs, etc.
    }
    return {
      id: r.id,
      title: r.title,
      url: r.url || "http://localhost:5000" + r.fileUrl,
      type,
      subject: r.studyCircle ? r.studyCircle.name : "General",
      ago: new Date(r.uploadedAt).toLocaleDateString()
    };
  });
  const shown = items.filter((i) => (filter === "All" || i.type === filter) && (i.title.toLowerCase().includes(search.toLowerCase()) || i.subject.toLowerCase().includes(search.toLowerCase())));

  const handleAdd = async () => {
    if (!form.title.trim() || (!form.url.trim() && !form.file)) return;
    await addResource({ title: form.title, url: form.url, file: form.file });
    setShowModal(false);
    setForm({ title: "", url: "", file: null });
  };

  return (
    <div className="box-border h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-7">
      <div className="mb-4 flex flex-wrap gap-3 md:gap-4">
        <Card C={C} style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, flex: "1 1 260px" }}>
          <Ic d={ICONS.search} size={18} color={C.muted} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources..."
            style={{ border: "none", outline: "none", fontSize: 14, color: C.text, flex: 1, background: "transparent" }} />
        </Card>
        <button onClick={() => setShowModal(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 12, minHeight: 44, padding: "0 20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <Ic d={ICONS.plus} size={16} /> Add Resource
        </button>
      </div>
      <div className="mb-5 flex flex-wrap gap-2 sm:gap-3">
        {["All", "Documents", "Videos", "Links"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "7px 18px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: filter === f ? C.accent : C.card, color: filter === f ? "#fff" : C.text, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {shown.map((item, i) => (
          <Card key={i} C={C} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic d={im[item.type] || ICONS.doc} size={20} color={C.accent} />
              </div>
              <Badge type={item.subject} C={C} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: C.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{item.ago}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <a href={item.url.startsWith("http") ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", flex: 1 }}>
                <button style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", padding: 0 }}>Open Link</button>
              </a>
              <button onClick={() => deleteResource(item.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, fontSize: 16, padding: "2px 6px", borderRadius: 6, lineHeight: 1 }}>🗑️</button>
            </div>
          </Card>
        ))}
        {shown.length === 0 && <div style={{ color: C.muted, fontSize: 14 }}>No resources found. Add one above!</div>}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} C={C} width={400}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>Add Resource</h3>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Redux Toolkit Docs"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>URL Link (Optional)</label>
          <input disabled={!!form.file} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10, opacity: form.file ? 0.5 : 1 }} />
            
          <div style={{ textAlign: "center", margin: "10px 0 16px", color: C.muted, fontSize: 12, fontWeight: 600 }}>OR</div>

          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Upload File (PDF/Image/Video)</label>
          <input disabled={!!form.url} type="file" accept="image/*,.pdf,video/*" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files ? e.target.files[0] : null }))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 12, border: `1px dashed ${C.border}`, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 18, opacity: form.url ? 0.5 : 1 }} />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAdd} disabled={!form.title.trim() || (!form.url.trim() && !form.file)}
              style={{ flex: 2, padding: 11, borderRadius: 12, border: "none", background: !form.title.trim() || (!form.url.trim() && !form.file) ? C.border : C.accent, color: !form.title.trim() || (!form.url.trim() && !form.file) ? C.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: !form.title.trim() || (!form.url.trim() && !form.file) ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              Submit
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

// ── Study Circle ──────────────────────────────────────────
interface StudyCircleProps { C: Theme; }

export function StudyCircle({ C }: StudyCircleProps) {
  const { circles, createCircle, joinCircle } = useStudyCircles();
  const { user } = useAuthContext();
  const [form, setForm] = useState({ name: "", description: "", inviteCode: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [activeCircleId, setActiveCircleId] = useState<number | null>(null);
  
  useEffect(() => {
    if (circles.length > 0 && !activeCircleId) setActiveCircleId(circles[0].id);
  }, [circles]);

  const activeCircle = circles.find(c => c.id === activeCircleId) || null;
  const [tab, setTab] = useState("Dashboard");

  const { leaderboard, goals, messages, schedules, sendMessage, deleteMessage, addSchedule, refreshAll, fetchGoals } = useCircleData(activeCircleId);

  useEffect(() => {
    if (activeCircleId) refreshAll();
  }, [activeCircleId, refreshAll]);

  const [msgInput, setMsgInput] = useState("");
  const handleSend = () => { if (msgInput.trim()) { sendMessage(msgInput); setMsgInput(""); } };

  const [goalForm, setGoalForm] = useState({ title: "", type: "BRAIN_GAINS" });
  const handleCreateGroupGoal = async () => {
    if (!goalForm.title.trim() || !activeCircleId) return;
    await apiFetch("/api/goals", { method: "POST", body: JSON.stringify({ title: goalForm.title, type: goalForm.type, studyCircleId: activeCircleId }) });
    setGoalForm({ title: "", type: "BRAIN_GAINS" });
    fetchGoals();
  };

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleHours, setScheduleHours] = useState("2");

  useEffect(() => {
    setScheduleTitle("");
    setScheduleHours("2");
  }, [activeCircleId]);

  const scheduleDurationHours = Number(scheduleHours);
  const hasValidDuration = Number.isFinite(scheduleDurationHours) && scheduleDurationHours > 0;
  const canAddSchedule = !!scheduleTitle.trim() && hasValidDuration;

  const handleAddSchedule = async () => {
    if (!canAddSchedule) return;

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + scheduleDurationHours * 60 * 60 * 1000);
    await addSchedule(scheduleTitle.trim(), startTime.toISOString(), endTime.toISOString());
    setScheduleTitle("");
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createCircle(form.name, form.description);
    setShowCreate(false);
    setForm({ ...form, name: "", description: "" });
  };

  const handleJoin = async () => {
    if (!form.inviteCode.trim()) return;
    await joinCircle(form.inviteCode.trim());
    setShowJoin(false);
    setForm({ ...form, inviteCode: "" });
  };

  return (
    <div className="box-border h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        {circles.length === 0 && (
          <div style={{ padding: "12px 16px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, flex: "1 1 280px", color: C.text, fontSize: 14 }}>
            You aren't in any study circles. Create or join one to collaborate with friends!
          </div>
        )}
        {circles.length > 0 && (
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            {circles.map(c => (
              <button key={c.id} onClick={() => { setActiveCircleId(c.id); setTab("Dashboard"); }} style={{ whiteSpace: "nowrap", padding: "8px 16px", background: activeCircleId === c.id ? C.accentBg : C.card, color: activeCircleId === c.id ? C.accent : C.text, border: `1px solid ${activeCircleId === c.id ? C.accent : C.border}`, borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <button onClick={() => setShowJoin(true)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Join Circle</button>
          <button onClick={() => setShowCreate(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 12, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Create Circle</button>
        </div>
      </div>

      {activeCircle && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3" style={{}}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>{activeCircle.name}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Invite Code: <strong>{activeCircle.inviteCode}</strong> · {activeCircle.members.length}/8 Members</p>
            </div>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto border-b pb-4" style={{ borderBottomColor: C.border }}>
            {["Dashboard", "Shared Goals", "Schedule", "Updates"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? C.text : "transparent", color: tab === t ? C.bg : C.muted, padding: "6px 16px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t}</button>
            ))}
          </div>

          {tab === "Dashboard" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-5">
              <Card C={C}>
                <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: C.text }}>Circle Leaderboard 🔥</h3>
                {leaderboard.length === 0 && <span style={{ color: C.muted, fontSize: 13 }}>No study activity yet.</span>}
                {leaderboard.map((lb, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{lb.user.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{lb.user.name} {lb.user.id === user?.id ? "(You)" : ""}</span>
                    </div>
                    <span style={{ fontSize: 14, color: C.accent, fontWeight: 700 }}>{lb.tasksCompleted} Tasks</span>
                  </div>
                ))}
              </Card>
              <Card C={C}>
                <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: C.text }}>Circle Stats</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[[activeCircle.members.length.toString(), "Members"], [(schedules?.length || 0).toString(), "Upcoming Sessions"], [leaderboard.reduce((a, b) => a + b.tasksCompleted, 0).toString(), "Total Tasks"], [(goals?.length || 0).toString(), "Shared Goals"]].map(([v, l]) => (
                    <div key={l} style={{ background: C.inputBg, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.statNum }}>{v}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === "Shared Goals" && (
            <Card C={C}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Group Goals & Milestone Tracking</h3>
              </div>
                <div className="mb-5 flex flex-wrap gap-2" style={{ background: C.inputBg, padding: 12, borderRadius: 12 }}>
                  <input value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="New shared goal title..." style={{ flex: "1 1 220px", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text }} />
                  <button onClick={handleCreateGroupGoal} disabled={!goalForm.title.trim()} style={{ minHeight: 38, background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 600, cursor: goalForm.title.trim() ? "pointer" : "not-allowed", opacity: goalForm.title.trim() ? 1 : 0.5 }}>Create Shared Goal</button>
              </div>
              {goals.length === 0 && <span style={{ color: C.muted, fontSize: 13 }}>No shared goals. Create one above!</span>}
              {goals.map(g => {
                const total = g.tasks?.length || 0;
                const done = g.tasks?.filter((t: any) => t.completed).length || 0;
                const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                return (
                  <div key={g.id} style={{ marginBottom: 16, padding: "14px 16px", border: `1px solid ${C.border}`, borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 15, color: C.text }}>{g.title}</h4>
                      <span style={{ fontSize: 12, color: C.muted }}>Created by {g.user?.name}</span>
                    </div>
                    <div style={{ height: 10, background: C.bg, borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: C.accent }} />
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{pct}% Completed ({done}/{total} tasks)</div>
                  </div>
                );
              })}
            </Card>
          )}

          {tab === "Schedule" && (
            <Card C={C}>
               <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: C.text }}>Shared Timetable</h3>
               <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Coordinate study blocks with your circle.</p>
               {schedules.map((s, i) => (
                 <div key={i} style={{ padding: "12px 14px", borderLeft: `3px solid ${C.accent}`, background: C.inputBg, marginBottom: 10, borderRadius: "0 8px 8px 0" }}>
                   <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.title}</div>
                   <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}</div>
                 </div>
               ))}
               <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, background: C.inputBg, padding: 16, borderRadius: 12 }}>
                 <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Schedule new block:</div>
                 <div className="flex flex-wrap gap-2 sm:gap-3">
                     <input
                       value={scheduleTitle}
                       onChange={(e) => setScheduleTitle(e.target.value)}
                       placeholder="What do you want to schedule?"
                       style={{ flex: "1 1 280px", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
                     />
                     <input
                       value={scheduleHours}
                       onChange={(e) => setScheduleHours(e.target.value)}
                       type="number"
                       min="0.5"
                       step="0.5"
                       placeholder="Hours"
                       style={{ width: 110, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
                     />
                     <button
                       onClick={handleAddSchedule}
                       disabled={!canAddSchedule}
                       style={{ minHeight: 38, background: canAddSchedule ? C.accent : C.border, color: canAddSchedule ? "#fff" : C.muted, border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canAddSchedule ? "pointer" : "not-allowed" }}
                     >
                       + Add Schedule
                     </button>
                 </div>
               </div>
            </Card>
          )}

          {tab === "Updates" && (
            <Card C={C} style={{ height: 400, display: "flex", flexDirection: "column" }}>
               <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: C.text }}>Circle Updates & Resources</h3>
               <div style={{ flex: 1, overflowY: "auto", paddingRight: 10, display: "flex", flexDirection: "column", gap: 16 }}>
                 {messages.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", marginTop: 20 }}>No messages yet. Minimal chat & resources only!</div>}
                 {messages.map((m, i) => (
                   <div key={i} style={{ alignSelf: m.sender.id === user?.id ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                     <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, display: "flex", gap: 6, alignItems: "center", justifyContent: m.sender.id === user?.id ? "flex-end" : "flex-start" }}>
                         {m.sender.name}
                         {m.sender.id === user?.id && <button onClick={() => deleteMessage(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, fontSize: 10, padding: 0 }}>🗑️</button>}
                     </div>
                     <div style={{ padding: "10px 14px", borderRadius: 16, background: m.sender.id === user?.id ? C.accent : C.inputBg, color: m.sender.id === user?.id ? "#fff" : C.text, fontSize: 14 }}>{m.content}</div>
                   </div>
                 ))}
               </div>
               <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                 <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Share an update or resource link..." style={{ flex: "1 1 220px", border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, borderRadius: 20, padding: "10px 16px", outline: "none", fontSize: 14 }} />
                 <button onClick={handleSend} style={{ minHeight: 40, background: C.accent, color: "#fff", border: "none", padding: "0 20px", borderRadius: 20, fontWeight: 600, cursor: "pointer" }}>Send</button>
               </div>
            </Card>
          )}
        </>
      )}

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} C={C} width={400}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>Create Study Circle</h3>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Circle Name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Physics Masters"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleCreate} disabled={!form.name.trim()}
              style={{ flex: 2, padding: 11, borderRadius: 12, border: "none", background: !form.name.trim() ? C.border : C.accent, color: !form.name.trim() ? C.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: !form.name.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              Create
            </button>
          </div>
        </Modal>
      )}

      {showJoin && (
        <Modal onClose={() => setShowJoin(false)} C={C} width={400}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>Join Study Circle</h3>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Invite Code</label>
          <input value={form.inviteCode} onChange={(e) => setForm((f) => ({ ...f, inviteCode: e.target.value }))} placeholder="e.g. 8A3F9B"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowJoin(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleJoin} disabled={!form.inviteCode.trim()}
              style={{ flex: 2, padding: 11, borderRadius: 12, border: "none", background: !form.inviteCode.trim() ? C.border : C.accent, color: !form.inviteCode.trim() ? C.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: !form.inviteCode.trim() ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              Join
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

// ── Settings ─────────────────────────────────────────────
interface SettingsProps { C: Theme; dark: boolean; setDark: (v: boolean) => void; }

function Toggle({ on, onChange, C }: { on: boolean; onChange: (v: boolean) => void; C: Theme }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 46, height: 25, borderRadius: 999, background: on ? C.accent : "#9298b0", position: "relative", cursor: "pointer", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2.5, left: on ? 23 : 2.5, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
    </div>
  );
}

export function Settings({ C, dark, setDark }: SettingsProps) {
  const { user, refreshUser } = useAuthContext();
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const nameParts = (user?.name || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const defaultNotifs = { tasks: true, sessions: true, weekly: false, motivational: true };
  const [notifs, setNotifs] = useState(user?.notifs ? (typeof user.notifs === 'string' ? JSON.parse(user.notifs) : user.notifs) : defaultNotifs);

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith("data:") ? user.avatar : (user.avatar.startsWith("/") || user.avatar.startsWith("http") ? resolveApiUrl(user.avatar) : ""))
    : "";

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarSrc]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setIsUploadingPhoto(true);
    try {
      const response = await apiFetch("/api/users/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile photo");
      }

      await refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), bio, notifs })
      });
      await refreshUser();
    } catch (e) {
      console.error(e);
    }
  };

  const resetPasswordModalState = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
    setIsChangingPassword(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPasswordError(data?.error || data?.message || "Failed to change password.");
        return;
      }

      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setPasswordError("Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="box-border h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-7">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px] md:gap-5" style={{ alignItems: "flex-start" }}>
        <div>
          <Card C={C} style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: C.text }}>Profile</h3>
            <div className="mb-4 flex flex-wrap items-end gap-3 sm:gap-4">
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 700, overflow: "hidden" }}>
                {avatarSrc && !avatarLoadError ? (
                  <img src={avatarSrc} alt="Profile" onError={() => setAvatarLoadError(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  firstName.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                style={{ alignSelf: "flex-end", background: C.accentBg, color: C.accent, border: "none", borderRadius: 10, padding: "7px 16px", fontWeight: 600, cursor: isUploadingPhoto ? "not-allowed" : "pointer", fontSize: 13, opacity: isUploadingPhoto ? 0.7 : 1 }}
              >
                {isUploadingPhoto ? "Uploading..." : "Change Photo"}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: C.muted, display: "block", marginBottom: 5 }}>First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box", outline: "none", background: C.inputBg, color: C.text }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: C.muted, display: "block", marginBottom: 5 }}>Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box", outline: "none", background: C.inputBg, color: C.text }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: C.muted, display: "block", marginBottom: 5 }}>Email</label>
                <input value={user?.email || ""} disabled style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box", outline: "none", background: C.inputBg, color: C.muted, cursor: "not-allowed" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: C.muted, display: "block", marginBottom: 5 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box", resize: "none", height: 68, outline: "none", background: C.inputBg, color: C.text }} />
              </div>
            </div>
            <button onClick={handleSave} style={{ marginTop: 14, background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>Save Changes</button>
          </Card>

          <Card C={C}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ic d={ICONS.bell} size={18} color={C.text} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Notifications</h3>
            </div>
            <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 16px" }}>Manage your notification preferences (Requires Save)</p>
            {([
              ["tasks", "Task Reminders", "Get notified about upcoming tasks"],
              ["sessions", "Study Session Alerts", "Alerts for focus sessions"],
              ["weekly", "Weekly Reports", "Receive weekly progress summaries"],
              ["motivational", "Motivational Messages", "Daily motivation and tips"],
            ] as [keyof typeof notifs, string, string][]).map(([k, t, d]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{t}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{d}</div>
                </div>
                <Toggle on={notifs[k]} onChange={(v) => setNotifs((n: any) => ({ ...n, [k]: v }))} C={C} />
              </div>
            ))}
          </Card>
        </div>

        <div>
          <Card C={C} style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: C.text }}>Appearance</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>Dark Mode</div>
                <div style={{ fontSize: 12, color: C.muted }}>Switch to dark theme</div>
              </div>
              <Toggle on={dark} onChange={setDark} C={C} />
            </div>
          </Card>

          <Card C={C} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Ic d={ICONS.shield} size={16} color={C.text} />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Privacy & Security</h3>
            </div>
            <button onClick={() => setShowChangePassword(true)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 14, cursor: "pointer", marginBottom: 8, color: C.text }}>Change Password</button>
            <button style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, fontSize: 14, cursor: "pointer", marginBottom: 8, color: C.text }}>Export Data</button>
            <button style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, border: "1px solid #fecaca", background: C.inputBg, fontSize: 14, cursor: "pointer", color: C.red }}>Delete Account</button>
          </Card>

          <div style={{ background: C.accentBg, borderRadius: 18, padding: 24 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: C.text }}>StudyFlow Pro</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>Unlock advanced features and unlimited resources</p>
            <button style={{ width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Upgrade Now</button>
          </div>
        </div>
      </div>

      {showChangePassword && (
        <Modal
          onClose={() => {
            setShowChangePassword(false);
            resetPasswordModalState();
          }}
          C={C}
          width={420}
        >
          <h3 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 700, color: C.text }}>Change Password</h3>

          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
          />

          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
          />

          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" }}
          />

          {passwordError && <div style={{ color: C.red, fontSize: 13, marginBottom: 10 }}>{passwordError}</div>}
          {passwordSuccess && <div style={{ color: "#16a34a", fontSize: 13, marginBottom: 10 }}>{passwordSuccess}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setShowChangePassword(false);
                resetPasswordModalState();
              }}
              style={{ flex: 1, padding: 11, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              style={{ flex: 2, padding: 11, borderRadius: 12, border: "none", background: isChangingPassword ? C.border : C.accent, color: isChangingPassword ? C.muted : "#fff", fontSize: 14, fontWeight: 700, cursor: isChangingPassword ? "not-allowed" : "pointer" }}
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
