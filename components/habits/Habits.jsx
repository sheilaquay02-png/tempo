import { useState } from "react";
import { dateKey, TODAY, uid } from "../../lib/tempo/core";
import { HABIT_CATEGORIES, HABIT_REMINDER_PRESETS, HABIT_TEMPLATES } from "../../constants/tempoConstants";
import { weekDatesFor } from "../../utils/dateUtils";
import {
  habitFromTemplate,
  habitProgress,
  habitReminderPresetId,
  habitRepeatDaysFromFrequency,
  habitRunsOnDate,
  habitStreak,
  normalizeHabit,
  normalizeHabitReminder,
  normalizeHabits,
} from "../../utils/habitUtils";

function HabitReminderEditor({ value, onChange }) {
  const reminder = normalizeHabitReminder(value);
  const presetId = habitReminderPresetId(reminder);
  const setPreset = id => {
    const preset = HABIT_REMINDER_PRESETS.find(p => p.id === id);
    if (id === "none") return onChange({ type: "none", time: "" });
    if (id === "custom") return onChange({ type: "custom", time: reminder.time || "09:00" });
    return onChange({ type: preset?.id || id, time: preset?.time || "09:00" });
  };
  return (
    <div className="reminder-editor">
      <select className="modal-select" value={presetId} onChange={e => setPreset(e.target.value)}>
        {HABIT_REMINDER_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      {presetId === "custom" && <input type="time" className="modal-select" value={reminder.time || "09:00"} onChange={e => onChange({ type: "custom", time: e.target.value })} />}
    </div>
  );
}

function HabitModal({ habit, onClose, onSave, onDelete, onArchive }) {
  const isTemplateDraft = Boolean(habit?._templateDraft);
  const isExistingHabit = Boolean(habit?.id && !isTemplateDraft);
  const initial = habit ? normalizeHabit(habit) : normalizeHabit({ id: "habit-" + uid(), name: "New Habit", emoji: "🌱", category: "personal", frequency: "daily", repeatDays: [0,1,2,3,4,5,6], targetCount: 1, unit: "check-in", reminder: { type: "none", time: "" } });
  const [form, setForm] = useState(initial);
  const days = ["S","M","T","W","T","F","S"];
  const toggleDay = day => setForm(f => {
    const set = new Set(f.repeatDays || []);
    if (set.has(day)) set.delete(day); else set.add(day);
    const next = [...set].sort((a,b) => a-b);
    return { ...f, frequency: "custom", repeatDays: next.length ? next : [day] };
  });
  const setFrequency = frequency => setForm(f => ({ ...f, frequency, repeatDays: habitRepeatDaysFromFrequency(frequency, null) }));
  const saveForm = () => {
    const clean = normalizeHabit(form);
    if (!clean.name.trim()) return;
    onSave(clean);
  };
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Habit editor">
      <div className="modal habit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span style={{ fontWeight: 900 }}>{isTemplateDraft ? "Customize Template" : isExistingHabit ? "Edit Habit" : "Create Habit"}</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="ritual-form-title-row">
            <input className="modal-select ritual-emoji-input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value.slice(0, 4) || "🌱" }))} aria-label="Habit emoji" />
            <input className="modal-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Habit name" />
          </div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{HABIT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select></div>
          <div className="modal-row"><label>Frequency</label><select className="modal-select" value={form.frequency} onChange={e => setFrequency(e.target.value)}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekends">Weekends</option><option value="custom">Custom days</option></select></div>
          <div className="modal-row modal-row-full"><label>Repeat days</label><div className="weekday-picker ritual-weekday-picker">{days.map((d,i) => <button type="button" key={i} className={`weekday-btn ${form.repeatDays?.includes(i) ? "active" : ""}`} onClick={() => toggleDay(i)}>{d}</button>)}</div></div>
          <div className="modal-row"><label>Daily target</label><div className="habit-target-row"><input type="number" min={1} max={20} className="modal-select modal-time" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: Math.max(1, Number(e.target.value) || 1) }))}/><input className="modal-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="check-in" /></div></div>
          <div className="modal-row"><label>Reminder</label><HabitReminderEditor value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} /></div>
        </div>
        <div className="modal-actions">
          {isExistingHabit && <button className="tf-cancel" onClick={() => onArchive(habit, !habit.archived)}>{habit.archived ? "Restore" : "Archive"}</button>}
          {isExistingHabit && <button className="tf-delete" onClick={() => onDelete(habit)}>Delete</button>}
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-save" onClick={saveForm}>Save Habit</button>
        </div>
      </div>
    </div>
  );
}

export function HabitCard({ habit, progress, streak = 0, onToggle, onIncrement, onEdit, compact = false }) {
  const category = HABIT_CATEGORIES.find(c => c.id === habit.category);
  const target = Math.max(1, Number(habit.targetCount || 1));
  return (
    <div className={`habit-card ${progress.completed ? "habit-complete" : ""}`}>
      <div className="habit-card-top">
        <div className="habit-title-wrap"><div className="habit-emoji">{habit.emoji}</div><div><h3>{habit.name}</h3><p>{category?.emoji || "✨"} {category?.label || "Habit"} · {streak} day streak</p></div></div>
        {!compact && <button className="tf-cancel ritual-edit-btn" onClick={() => onEdit(habit)}>Edit</button>}
      </div>
      <div className="ritual-progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
      <div className="ritual-progress-label">{progress.completed ? "Checked off today ✨" : `${progress.count}/${target} ${habit.unit || "done"}`}</div>
      <div className="habit-card-actions">
        {target <= 1 ? <label className={`ritual-step habit-check ${progress.completed ? "checked" : ""}`}><input type="checkbox" checked={progress.completed} onChange={() => onToggle(habit)} /><span>{progress.completed ? "Done for today" : "Check off"}</span></label> : <><button className="tf-cancel" onClick={() => onIncrement(habit, -1)} disabled={progress.count <= 0}>−</button><button className="tf-save" onClick={() => onIncrement(habit, 1)}>＋ Add one</button></>}
      </div>
    </div>
  );
}

function HabitWeeklyGrid({ habits = [], completions = [] }) {
  const days = weekDatesFor(TODAY);
  const active = normalizeHabits(habits).filter(h => !h.archived && !h.deletedAt);
  return (
    <div className="habit-week-grid-wrap">
      <div className="habit-week-grid habit-week-grid-head"><span>Habit</span>{days.map(d => <span key={dateKey(d)}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}</span>)}</div>
      {active.map(h => <div key={h.id} className="habit-week-grid"><strong>{h.emoji} {h.name}</strong>{days.map(d => {
        const runs = habitRunsOnDate(h, d);
        const done = habitProgress(h, completions, d).completed;
        return <span key={dateKey(d)} className={!runs ? "muted" : done ? "done" : ""}>{!runs ? "·" : done ? "✓" : "○"}</span>;
      })}</div>)}
      {!active.length && <div className="phase-empty">No active habits yet.</div>}
    </div>
  );
}

function HabitTemplateLibrary({ habits = [], onUseTemplate, onCustomizeTemplate }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const normalized = normalizeHabits(habits);
  const categories = ["all", ...HABIT_CATEGORIES.map(c => c.id)];
  const filtered = HABIT_TEMPLATES.filter(t => filter === "all" || t.category === filter);
  const hasTemplate = template => normalized.some(h => h.templateId === template.id || String(h.name || "").trim().toLowerCase() === String(template.name || "").trim().toLowerCase());
  return (
    <div className={`phase-card ritual-template-library habit-template-library ${open ? "open" : "collapsed"}`}>
      <div className="phase-card-head ritual-template-head">
        <div><span>Template Library</span><small>Starter habits are tucked away. Expand when you want ideas.</small></div>
        <button className="mini-pill" onClick={() => setOpen(v => !v)}>{open ? "Collapse" : "Expand"}</button>
      </div>
      {open ? <>
        <div className="ritual-template-filters">
          {categories.map(id => {
            const cat = HABIT_CATEGORIES.find(c => c.id === id);
            return <button key={id} className={`mini-pill ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{id === "all" ? "All" : `${cat?.emoji || "✨"} ${cat?.label || id}`}</button>;
          })}
        </div>
        <div className="ritual-template-grid habit-template-grid">
          {filtered.map(template => {
            const cat = HABIT_CATEGORIES.find(c => c.id === template.category);
            const alreadyAdded = hasTemplate(template);
            const reminder = normalizeHabitReminder(template.reminder);
            return (
              <div key={template.id} className={`ritual-template-card habit-template-card ${alreadyAdded ? "template-added" : ""}`} style={{ "--ritual-color": template.color || "var(--accent)" }}>
                <div className="ritual-template-top">
                  <div className="ritual-template-emoji">{template.emoji}</div>
                  <div><h3>{template.name}</h3><p>{cat?.emoji || "✨"} {cat?.label || "Habit"} · {template.frequency === "daily" ? "Daily" : template.frequency === "weekdays" ? "Weekdays" : template.frequency === "weekends" ? "Weekends" : "Custom"}</p></div>
                </div>
                <div className="ritual-template-desc">{template.description}</div>
                <div className="ritual-template-steps">
                  <span>✓ Target: {template.targetCount || 1} {template.unit || "check-in"}</span>
                  <span>✓ Reminder: {reminder.type === "none" ? "No reminder" : reminder.time}</span>
                  <span>✓ Repeat: {template.repeatDays?.length === 7 ? "Every day" : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].filter((_, i) => template.repeatDays?.includes(i)).join(" · ")}</span>
                </div>
                {alreadyAdded && <div className="template-added-badge">Already in your habits</div>}
                <div className="ritual-template-actions">
                  <button className="tf-cancel" onClick={() => onCustomizeTemplate(template)}>Customize</button>
                  <button className="tf-save" onClick={() => onUseTemplate(template)}>{alreadyAdded ? "Add another" : "Use template"}</button>
                </div>
              </div>
            );
          })}
        </div>
      </> : <div className="phase-empty habit-template-collapsed-note">Template Library is collapsed to keep Habits cleaner.</div>}
    </div>
  );
}

export function HabitsPage({ habits = [], completions = [], onAdd, onEdit, onDelete, onArchive, onToggle, onIncrement }) {
  const [modalHabit, setModalHabit] = useState(null);
  const normalized = normalizeHabits(habits);
  const active = normalized.filter(h => !h.archived && !h.deletedAt);
  const archived = normalized.filter(h => h.archived && !h.deletedAt);
  const todayHabits = active.filter(h => habitRunsOnDate(h, TODAY));
  const saveHabit = habit => {
    habit.id && habits.some(h => h.id === habit.id) ? onEdit(habit.id, habit) : onAdd(habit);
    setModalHabit(null);
  };
  const useTemplate = template => onAdd(habitFromTemplate(template, habits));
  const customizeTemplate = template => setModalHabit({ ...habitFromTemplate(template, habits), _templateDraft: true });
  const deleteHabit = habit => { onDelete(habit); setModalHabit(null); };
  return (
    <div className="phase-page habits-page">
      <div className="phase-hero habit-hero">
        <div><div className="phase-kicker">Habits</div><h1>🌱 Build gentle consistency</h1><p>Track small daily check-ins that support your rhythm without making the app feel noisy.</p></div>
        <button className="tf-save phase-primary" onClick={() => setModalHabit({})}>＋ Create Habit</button>
      </div>
      <div className="phase-card phase-wide-card ritual-section-card">
        <div className="phase-card-head"><span>Today’s Habits</span><small>{todayHabits.length} scheduled today</small></div>
        {todayHabits.length ? <div className="habit-grid">{todayHabits.map(h => <HabitCard key={h.id} habit={h} progress={habitProgress(h, completions, TODAY)} streak={habitStreak(h, completions, TODAY)} onToggle={onToggle} onIncrement={onIncrement} onEdit={setModalHabit} />)}</div> : <div className="phase-empty">No habits scheduled today. Create one gentle habit to begin.</div>}
      </div>
      <div className="phase-card phase-wide-card ritual-section-card">
        <div className="phase-card-head"><span>Weekly Grid</span><small>This week</small></div>
        <HabitWeeklyGrid habits={active} completions={completions} />
      </div>
      <div className="phase-card phase-wide-card ritual-section-card">
        <div className="phase-card-head"><span>All Habits</span><small>{active.length} active</small></div>
        {active.length ? <div className="ritual-list-compact">{active.map(h => {
          const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].filter((_, i) => h.repeatDays.includes(i)).join(" · ");
          const reminder = normalizeHabitReminder(h.reminder);
          return <div key={h.id} className="ritual-list-row"><span className="ritual-list-emoji">{h.emoji}</span><div><strong>{h.name}</strong><small>{days || "No repeat days"}{reminder.type !== "none" ? ` · ${reminder.time}` : ""}</small></div><button className="tf-cancel" onClick={() => setModalHabit(h)}>Edit</button></div>;
        })}</div> : <div className="phase-empty">No habits yet.</div>}
      </div>
      <HabitTemplateLibrary habits={normalized} onUseTemplate={useTemplate} onCustomizeTemplate={customizeTemplate} />
      {archived.length > 0 && <div className="phase-card phase-wide-card ritual-section-card"><div className="phase-card-head"><span>Archived</span><small>{archived.length}</small></div><div className="ritual-list-compact">{archived.map(h => <div key={h.id} className="ritual-list-row ritual-archived-row"><span className="ritual-list-emoji">{h.emoji}</span><div><strong>{h.name}</strong><small>Archived</small></div><button className="tf-cancel" onClick={() => onArchive(h, false)}>Restore</button></div>)}</div></div>}
      {modalHabit !== null && <HabitModal habit={modalHabit?.id || modalHabit?._templateDraft ? modalHabit : null} onClose={() => setModalHabit(null)} onSave={saveHabit} onDelete={deleteHabit} onArchive={(habit, archived) => { onArchive(habit, archived); setModalHabit(null); }} />}
    </div>
  );
}
