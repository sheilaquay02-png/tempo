"use client";

import { useEffect, useRef, useState } from "react";
import * as Core from "../../lib/tempo/core";
import { normalizeSpendingPlan } from "../../utils/miniTempoFinance";
import { SpendingPlanEditor, EventSpendingDetails } from "./EventSpendingPanel";
import {
  CALENDAR_COLOR_PRESETS,
  EVENT_TEMPLATES,
  calendarEventReadOnly,
  calendarEventSource,
  calendarSourceIcon,
  calendarSourceLabel,
  cleanCalendarColor,
} from "../../lib/tempo/client/calendarPresentation";

const {
  CALENDARS,
  CATEGORIES,
  TODAY,
  addDaysSafe,
  applyDateAndTime,
  cloneDate,
  dateKey,
  dayStart,
  endOfDay,
  fmt,
  formatWithDisplayTimezone,
  normalizeRecurrence,
  toDateInput,
  toTimeInputValue,
  uid,
} = Core;

function RecurrenceEditor({ value, onChange, startDate }) {
  const rec = normalizeRecurrence(value);
  const freq = rec?.frequency || "";
  const byWeekdays = rec?.byWeekdays || [startDate?.getDay?.() ?? TODAY.getDay()];
  const setFreq = frequency => onChange(frequency ? { ...(rec || {}), frequency, interval: rec?.interval || 1, endMode: rec?.endMode || "never" } : null);
  const setRec = patch => onChange({ ...(rec || { frequency: "daily", interval: 1, endMode: "never" }), ...patch });
  const days = ["S","M","T","W","T","F","S"];
  return (
    <div className="recurrence-editor">
      <select className="modal-select" value={freq} onChange={e => setFreq(e.target.value)}>
        <option value="">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="weekdays">Every weekday</option>
        <option value="monthly">Monthly</option>
      </select>
      {freq && (
        <div className="recurrence-custom">
          <div className="modal-row"><label>Every</label><input type="number" min={1} className="modal-select modal-time" value={rec?.interval || 1} onChange={e => setRec({ interval: Math.max(1, Number(e.target.value) || 1) })}/><span style={{fontSize:12,color:"var(--text2)"}}>{freq === "monthly" ? "month(s)" : freq === "weekly" ? "week(s)" : "day(s)"}</span></div>
          {freq === "weekly" && (
            <div className="weekday-picker">
              {days.map((d,i) => <button key={i} className={`weekday-btn ${byWeekdays.includes(i) ? "active" : ""}`} onClick={() => {
                const next = byWeekdays.includes(i) ? byWeekdays.filter(x => x !== i) : [...byWeekdays, i].sort();
                setRec({ byWeekdays: next.length ? next : [i] });
              }}>{d}</button>)}
            </div>
          )}
          {freq === "monthly" && <div className="modal-row"><label>Day of month</label><input type="number" min={1} max={31} className="modal-select modal-time" value={rec?.byMonthDay || startDate?.getDate?.() || TODAY.getDate()} onChange={e => setRec({ byMonthDay: Math.max(1, Math.min(31, Number(e.target.value) || 1)) })}/></div>}
          <div className="modal-row"><label>Ends</label><select className="modal-select" value={rec?.endMode || (rec?.until ? "on" : rec?.count ? "after" : "never")} onChange={e => setRec({ endMode: e.target.value, until: e.target.value === "on" ? (rec?.until || dateKey(addDaysSafe(startDate || TODAY, 30))) : undefined, count: e.target.value === "after" ? (rec?.count || 10) : undefined })}><option value="never">Never</option><option value="on">On date</option><option value="after">After count</option></select></div>
          {(rec?.endMode === "on" || rec?.until) && <div className="modal-row"><label>Until</label><input type="date" className="modal-select" value={rec?.until || rec?.endDate || ""} onChange={e => setRec({ until: e.target.value, endMode: "on" })}/></div>}
          {(rec?.endMode === "after" || rec?.count) && <div className="modal-row"><label>Count</label><input type="number" min={1} className="modal-select modal-time" value={rec?.count || 10} onChange={e => setRec({ count: Math.max(1, Number(e.target.value) || 1), endMode: "after" })}/></div>}
        </div>
      )}
    </div>
  );
}


function EventReminderEditor({ value, onChange }) {
  const reminder = Core.normalizeEventReminder(value);
  const presetId = Core.eventReminderPresetId(reminder);
  const setPreset = id => {
    const preset = Core.EVENT_REMINDER_PRESETS.find(p => p.id === id);
    if (id === "none") return onChange({ type: "none", minutesBefore: null });
    if (id === "at") return onChange({ type: "at", minutesBefore: 0 });
    if (id === "custom") return onChange({ type: "custom", minutesBefore: reminder.minutesBefore ?? 15 });
    return onChange({ type: "minutes", minutesBefore: preset?.minutesBefore ?? 10 });
  };
  return (
    <div className="reminder-editor">
      <select className="modal-select" value={presetId} onChange={e => setPreset(e.target.value)}>
        {Core.EVENT_REMINDER_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
      {presetId === "custom" && (
        <div className="modal-row reminder-custom-row">
          <input type="number" min={0} className="modal-select modal-time" value={reminder.minutesBefore ?? 15} onChange={e => onChange({ type: "custom", minutesBefore: Math.max(0, Number(e.target.value) || 0) })} />
          <span style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>minutes before</span>
        </div>
      )}
    </div>
  );
}

export function EventModal({ event, calendars, categories, onClose, onSave, onDelete, onCopy, onDuplicate, budgetLedgers = [], budgetBuckets = [], budgetTransactions = [], onRecordExpense, onLinkTransaction, onUnlinkTransaction }) {
  const [form, setForm] = useState({ ...event, allDay: Boolean(event.allDay), reminder: Core.normalizeEventReminder(event.reminder) });
  const cal = calendars.find(c => c.id === form.calendar);
  const source = calendarEventSource(form, cal);
  const isReferenceEvent = calendarEventReadOnly(form);
  const COLORS = ["#FF7BAC","#B08AE0","#7CBAFF","#70C8A0","#FFB870","#FF9F9F","#C9A0FF","#7EC8C8"];
  const startDate = toDateInput(form.start);
  const endDateForInput = form.allDay ? dateKey(addDaysSafe(form.end, -1)) : toDateInput(form.end);
  function updateStartDate(v) {
    const oldStart = form.start;
    const dur = form.end - form.start;
    const st = form.allDay ? applyDateAndTime(v, "00:00") : applyDateAndTime(v, toTimeInputValue(oldStart));
    const en = form.allDay ? endOfDay(st) : new Date(st.getTime() + dur);
    setForm(f => ({ ...f, start: st, end: en }));
  }
  function updateEndDate(v) {
    const en = form.allDay ? endOfDay(applyDateAndTime(v, "00:00")) : applyDateAndTime(v, toTimeInputValue(form.end));
    setForm(f => ({ ...f, end: en }));
  }
  function updateAllDay(checked) {
    if (checked) {
      const st = dayStart(form.start);
      const en = endOfDay(form.end);
      setForm(f => ({ ...f, allDay: true, start: st, end: en }));
    } else {
      const st = cloneDate(form.start); st.setHours(9,0,0,0);
      const en = cloneDate(form.start); en.setHours(10,0,0,0);
      setForm(f => ({ ...f, allDay: false, start: st, end: en }));
    }
  }
  async function saveForm() {
    if (isReferenceEvent) return;
    if (!form.title.trim()) return;
    if (form.end <= form.start) return;
    const saved = await onSave({ ...form, title: form.title.trim() });
    if (saved !== false) onClose();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit event">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${form.color || cal?.color || "#FF7BAC"}` }}>
          <input className="modal-title-input" value={form.title} disabled={isReferenceEvent} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className={`event-source-notice event-source-${source}`}><span>{calendarSourceIcon(source)}</span><strong>{calendarSourceLabel(source)} event</strong>{isReferenceEvent && <em>Reference only inside Tempo</em>}</div>
          <div className="modal-row"><label>All day</label><input type="checkbox" disabled={isReferenceEvent} checked={form.allDay} onChange={e => updateAllDay(e.target.checked)}/></div>
          <div className="modal-row"><label>Start date</label><input type="date" className="modal-select" disabled={isReferenceEvent} value={startDate} onChange={e => updateStartDate(e.target.value)} /></div>
          <div className="modal-row"><label>End date</label><input type="date" className="modal-select" disabled={isReferenceEvent} value={endDateForInput} onChange={e => updateEndDate(e.target.value)} /></div>
          {!form.allDay && <div className="modal-row"><label>Start</label><input type="time" className="modal-select modal-time" disabled={isReferenceEvent} value={toTimeInputValue(form.start)} onChange={e => setForm(f => ({ ...f, start: applyDateAndTime(toDateInput(f.start), e.target.value) }))} /><label style={{marginLeft:8}}>End</label><input type="time" className="modal-select modal-time" disabled={isReferenceEvent} value={toTimeInputValue(form.end)} onChange={e => setForm(f => ({ ...f, end: applyDateAndTime(toDateInput(f.end), e.target.value) }))} /></div>}
          <div className="modal-row"><label>Calendar</label><select className="modal-select" disabled={isReferenceEvent} value={form.calendar} onChange={e => setForm(f => ({ ...f, calendar: e.target.value }))}>{calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" disabled={isReferenceEvent} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          {!isReferenceEvent ? <div className="modal-row modal-col"><label>Recurrence</label><RecurrenceEditor value={form.recurrence} startDate={form.start} onChange={recurrence => setForm(f => ({ ...f, recurrence }))} /></div> : <div className="modal-row"><label>Recurrence</label><span className="reference-field">Managed by {calendarSourceLabel(source)}</span></div>}
          {!isReferenceEvent ? <div className="modal-row modal-col"><label>Reminder</label><EventReminderEditor value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} /></div> : <div className="modal-row"><label>Reminder</label><span className="reference-field">Managed by {calendarSourceLabel(source)}</span></div>}
          <div className="modal-row"><label>Fixed</label><input type="checkbox" disabled={isReferenceEvent} checked={form.fixed} onChange={e => setForm(f => ({ ...f, fixed: e.target.checked }))}/><span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 6 }}>Cannot be dragged</span></div>
          <div className="modal-row"><label>Color</label><div className="color-picker">{COLORS.map(c => <button key={c} disabled={isReferenceEvent} className={`color-dot ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />)}<button className="color-dot color-reset" disabled={isReferenceEvent} onClick={() => setForm(f => ({ ...f, color: null }))}>↺</button></div></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" disabled={isReferenceEvent} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." rows={3} /></div>
          {!isReferenceEvent && <SpendingPlanEditor value={form.spendingPlan} ledgers={budgetLedgers} buckets={budgetBuckets} onChange={plan=>setForm(f=>({...f,spendingPlan:normalizeSpendingPlan(plan)}))} />}
          <EventSpendingDetails event={form} transactions={budgetTransactions} ledgers={budgetLedgers} buckets={budgetBuckets} onRecordExpense={()=>onRecordExpense?.(event)} onLink={onLinkTransaction} onUnlink={onUnlinkTransaction}/>
        </div>
        <div className="modal-footer"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{!isReferenceEvent && <button className="modal-delete" onClick={() => { onDelete(event.id); onClose(); }}>🗑️ Delete</button>}<button className="tf-cancel" onClick={() => { onDuplicate?.(form); onClose(); }}>⧉ Duplicate</button>{!isReferenceEvent && <button className="tf-cancel" onClick={() => { onCopy?.({ ...form, title: form.title.trim() || event.title }); onClose(); }}>📋 Copy to paste</button>}</div><div style={{ display: "flex", gap: 8 }}><button className="tf-cancel" onClick={onClose}>{isReferenceEvent ? "Close" : "Cancel"}</button>{!isReferenceEvent && <button className="tf-save" onClick={saveForm}>Save changes</button>}</div></div>
      </div>
    </div>
  );
}



// ─── Add Event Modal ──────────────────────────────────────────────────────────
export function AddEventModal({ onClose, onSave, defaultDate, calendars = CALENDARS, categories = CATEGORIES, budgetLedgers = [], budgetBuckets = [] }) {
  const now = new Date(defaultDate); now.setMinutes(0,0,0);
  const end = new Date(now); end.setHours(end.getHours()+1);
  const [form, setForm] = useState({
    title: "", startDate: toDateInput(defaultDate), endDate: toDateInput(defaultDate), startTime: toTimeInputValue(now), endTime: toTimeInputValue(end), allDay: false,
    calendar: calendars.find(c => c.id === "work")?.id || calendars[0]?.id || "personal", category: "meeting", fixed: false, notes: "", color: null, recurrence: null, spendingPlan: null, reminder: { type: "minutes", minutesBefore: 10 }
  });
  const [err, setErr] = useState("");
  function applyEventTemplate(template) {
    const start = applyDateAndTime(form.startDate, form.startTime);
    const end = new Date(start.getTime() + Number(template.minutes || 60) * 60000);
    setForm(f => ({
      ...f,
      title: template.title,
      category: template.category || f.category,
      color: template.color || f.color,
      notes: template.notes || "",
      fixed: Boolean(template.fixed),
      allDay: false,
      endDate: toDateInput(end),
      endTime: toTimeInputValue(end),
    }));
  }
  async function handleSave() {
    if (!form.title.trim()) { setErr("Please enter a title."); return; }
    const start = form.allDay ? applyDateAndTime(form.startDate, "00:00") : applyDateAndTime(form.startDate, form.startTime);
    const endBase = form.allDay ? endOfDay(applyDateAndTime(form.endDate, "00:00")) : applyDateAndTime(form.endDate, form.endTime);
    if (endBase <= start) { setErr("End must be after start."); return; }
    const placed = await onSave({ id:"e"+uid(), title:form.title.trim(), start, end:endBase, allDay: form.allDay, calendar:form.calendar, category:form.category, fixed:form.fixed, notes:form.notes, color:form.color, recurrence:form.recurrence, reminder:form.reminder, spendingPlan:normalizeSpendingPlan(form.spendingPlan) });
    if (placed !== false) onClose();
  }
  const COLORS=["#FF7BAC","#B08AE0","#7CBAFF","#70C8A0","#FFB870","#FF9F9F","#C9A0FF","#7EC8C8"];
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add event">
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{borderLeft:`4px solid ${form.color||"var(--accent)"}`}}>
          <input className="modal-title-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event title" autoFocus />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="event-template-strip">
            <span>Templates</span>
            <div>
              {EVENT_TEMPLATES.map(template => <button key={template.id} type="button" onClick={() => applyEventTemplate(template)}><b>{template.emoji}</b>{template.label}</button>)}
            </div>
          </div>
          <div className="modal-row"><label>All day</label><input type="checkbox" checked={form.allDay} onChange={e=>setForm(f=>({...f,allDay:e.target.checked}))}/></div>
          <div className="modal-row"><label>Start date</label><input type="date" className="modal-select" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value,endDate:f.endDate < e.target.value ? e.target.value : f.endDate}))}/></div>
          <div className="modal-row"><label>End date</label><input type="date" className="modal-select" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></div>
          {!form.allDay && <><div className="modal-row"><label>Start</label><input type="time" className="modal-select modal-time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></div><div className="modal-row"><label>End</label><input type="time" className="modal-select modal-time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div></>}
          <div className="modal-row"><label>Calendar</label><select className="modal-select" value={form.calendar} onChange={e=>setForm(f=>({...f,calendar:e.target.value}))}>{calendars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row modal-col"><label>Recurrence</label><RecurrenceEditor value={form.recurrence} startDate={applyDateAndTime(form.startDate, form.startTime)} onChange={recurrence=>setForm(f=>({...f,recurrence}))}/></div>
          <div className="modal-row modal-col"><label>Reminder</label><EventReminderEditor value={form.reminder} onChange={reminder=>setForm(f=>({...f,reminder}))}/></div>
          <div className="modal-row"><label>Fixed</label><input type="checkbox" checked={form.fixed} onChange={e=>setForm(f=>({...f,fixed:e.target.checked}))}/><span style={{fontSize:11,color:"var(--text2)",marginLeft:6}}>Cannot be dragged</span></div>
          <div className="modal-row"><label>Color</label><div className="color-picker">{COLORS.map(c=><button key={c} className={`color-dot ${form.color===c?"selected":""}`} style={{background:c}} onClick={()=>setForm(f=>({...f,color:c}))}/> )}<button className="color-dot color-reset" onClick={()=>setForm(f=>({...f,color:null}))}>↺</button></div></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Add notes..." rows={2}/></div>
          <SpendingPlanEditor value={form.spendingPlan} ledgers={budgetLedgers} buckets={budgetBuckets} onChange={plan=>setForm(f=>({...f,spendingPlan:normalizeSpendingPlan(plan)}))} />
          {err && <div style={{color:"#C04040",fontSize:12,fontWeight:700}}>⚠️ {err}</div>}
        </div>
        <div className="modal-footer"><div/><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={handleSave}>Save event</button></div></div>
      </div>
    </div>
  );
}




// ─── Search Modal ─────────────────────────────────────────────────────────────
export function SearchModal({ events, tasks, calendars = CALENDARS, categories = CATEGORIES, onClose, onEventClick, onTaskEdit, onNavigate }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();
  const matchedEvents = q.length < 2 ? [] : events
    .filter(e => e.title.toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q))
    .sort((a, b) => a.start - b.start)
    .slice(0, 20);
  const matchedTasks = q.length < 2 ? [] : tasks
    .filter(t => t.title.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q))
    .slice(0, 10);

  function handleKey(e) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="modal-overlay search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search events, tasks, notes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          {query && <button className="search-clear" onClick={() => setQuery("")}>✕</button>}
        </div>

        {q.length >= 2 && (
          <div className="search-results">
            {matchedEvents.length === 0 && matchedTasks.length === 0 && (
              <div className="search-empty">No results for “{query}”</div>
            )}

            {matchedEvents.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">📅 Events ({matchedEvents.length})</div>
                {matchedEvents.map(e => {
                  const cal = calendars.find(c => c.id === e.calendar);
                  const color = e.color || cal?.color || "#FF7BAC";
                  const source = calendarEventSource(e, cal);
                  return (
                    <div key={e.id} className={`search-result-row event-source-${source}`} onClick={() => { onNavigate(e.start); onEventClick(e); onClose(); }}>
                      <div className="search-result-dot" style={{ background: color }} />
                      <div className="search-result-body">
                        <div className="search-result-title">{highlightMatch(e.title, q)}</div>
                        <div className="search-result-meta">
                          {formatWithDisplayTimezone(e.start, { weekday: "short", month: "short", day: "numeric" })} · {fmt(e.start)}–{fmt(e.end)}
                          <span className="search-recurring-badge">{calendarSourceLabel(source)}</span>{e._recurring && <span className="search-recurring-badge">↻ recurring</span>}
                        </div>
                        {e.notes && <div className="search-result-notes">{highlightMatch(e.notes.slice(0, 80), q)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {matchedTasks.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">✅ Tasks ({matchedTasks.length})</div>
                {matchedTasks.map(t => {
                  const cat = categories.find(c => c.id === t.category);
                  return (
                    <div key={t.id} className={`search-result-row ${t.done ? "search-done" : ""}`} onClick={() => { onTaskEdit(t); onClose(); }}>
                      <div className="search-result-dot" style={{ background: cat?.color || "#FF7BAC" }} />
                      <div className="search-result-body">
                        <div className="search-result-title">{highlightMatch(t.title, q)}</div>
                        <div className="search-result-meta">
                          {cat?.icon} {cat?.label} · {t.duration}min · {t.scope}
                          {t.done && <span className="search-done-badge">✓ done</span>}
                        </div>
                        {t.notes && <div className="search-result-notes">{highlightMatch(t.notes.slice(0, 80), q)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {q.length < 2 && (
          <div className="search-hint">Type at least 2 characters to search across all events and tasks</div>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}



export function CalendarEditModal({ mode = "edit", calendar, calendars = [], onClose, onSave, onDelete }) {
  const isNew = mode === "add" || !calendar?.id;
  const isDeleteMode = mode === "delete";
  const isGoogle = calendar?.source === "google";
  const initialColor = cleanCalendarColor(calendar?.color || "#FF7BAC");
  const [name, setName] = useState(calendar?.name || "New Calendar");
  const [color, setColor] = useState(initialColor);
  const [confirmDelete, setConfirmDelete] = useState(isDeleteMode);

  const canDelete = !isNew && !isGoogle && calendars.length > 1;
  const title = isNew ? "Create Calendar" : isDeleteMode ? "Remove Calendar" : "Edit Calendar";

  function submit() {
    const cleanName = name.trim();
    if (!isGoogle && !cleanName) return;
    onSave?.({
      ...(calendar || {}),
      name: isGoogle ? (calendar?.name || "Google Calendar") : cleanName,
      color: cleanCalendarColor(color),
      source: calendar?.source || "tempo",
    });
  }

  return (
    <div className="modal-overlay calendar-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="calendar-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="calendar-editor-preview">
          <span className="calendar-editor-dot" style={{ background: color }} />
          <div>
            <strong>{isGoogle ? (calendar?.name || "Google Calendar") : (name.trim() || "New Calendar")}</strong>
            <small>{isGoogle ? "Google Calendar reference calendar" : "Tempo calendar"}</small>
          </div>
        </div>

        <div className="modal-row">
          <label>Calendar name</label>
          <input
            className="modal-input"
            value={name}
            disabled={isGoogle}
            onChange={e => setName(e.target.value)}
            placeholder="Calendar name"
          />
        </div>
        {isGoogle && <div className="settings-section-desc">Google calendar names are managed in Google Calendar. You can still change the display color inside Tempo.</div>}

        <div className="modal-row calendar-color-row">
          <label>Color</label>
          <div className="calendar-color-picker">
            <div className="calendar-color-presets">
              {CALENDAR_COLOR_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  className={`calendar-color-swatch ${cleanCalendarColor(color) === preset ? "selected" : ""}`}
                  style={{ background: preset }}
                  aria-label={`Choose ${preset}`}
                  onClick={() => setColor(preset)}
                />
              ))}
            </div>
            <label className="calendar-native-color">
              <span>Custom color</span>
              <input type="color" value={cleanCalendarColor(color)} onChange={e => setColor(e.target.value)} />
            </label>
          </div>
        </div>

        {confirmDelete && canDelete && (
          <div className="calendar-delete-confirm">
            <strong>Remove “{calendar?.name}”?</strong>
            <span>Existing events will move to another calendar.</span>
            <button className="tf-delete" onClick={() => onDelete?.(calendar)}>Yes, remove calendar</button>
          </div>
        )}

        <div className="modal-footer">
          {canDelete && !confirmDelete && <button className="tf-delete" onClick={() => setConfirmDelete(true)}>Remove</button>}
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          {!confirmDelete && <button className="tf-save" onClick={submit}>{isNew ? "Create Calendar" : "Save Calendar"}</button>}
        </div>
      </div>
    </div>
  );
}


