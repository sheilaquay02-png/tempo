"use client";

import { useState } from "react";
import RecurrenceModal from "./RecurrenceModal";
import { combineDateTime, ensureEventModel, recurrenceSummary, toInputDate, toInputTime } from "../../lib/recurrence";

export function ScopeChooser({ action = "change", onChoose, onCancel, allowSeries = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card scope-card" onClick={e => e.stopPropagation()}>
        <h3>Recurring event {action}</h3>
        <p className="muted">Choose how this should apply.</p>
        <button className="scope-btn" onClick={() => onChoose("single")}>This event only</button>
        <button className="scope-btn" onClick={() => onChoose("following")}>This and following events</button>
        {allowSeries && <button className="scope-btn danger" onClick={() => onChoose("series")}>Entire series</button>}
        <button className="ghost-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function EventModal({ event, calendars, categories, defaultDate, onClose, onSave, onDelete }) {
  const baseStart = event?.start || defaultDate || new Date();
  const baseEnd = event?.end || new Date(new Date(baseStart).getTime() + 60 * 60000);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [scopeAction, setScopeAction] = useState(null);
  const [form, setForm] = useState(() => ({
    id: event?._isOccurrence ? event.id : event?.id,
    title: event?.title || "",
    calendar: event?.calendar || "personal",
    category: event?.category || categories?.[0]?.id || "personal",
    allDay: Boolean(event?.allDay),
    startDate: toInputDate(baseStart),
    startTime: toInputTime(baseStart),
    endDate: toInputDate(baseEnd),
    endTime: toInputTime(baseEnd),
    location: event?.location || "",
    notes: event?.notes || "",
    fixed: Boolean(event?.fixed),
    recurrence: event?.recurrence || null,
    recurrenceExceptions: event?.recurrenceExceptions || { skipped: [], modified: {} },
    source: event?.source || "local",
  }));

  function patch(next) {
    setForm(f => ({ ...f, ...next }));
  }

  function buildEvent() {
    let start;
    let end;
    if (form.allDay) {
      start = combineDateTime(form.startDate, "00:00");
      end = combineDateTime(form.endDate || form.startDate, "00:00");
      if (end <= start) end = new Date(start.getTime() + 86400000);
    } else {
      start = combineDateTime(form.startDate, form.startTime || "09:00");
      end = combineDateTime(form.endDate || form.startDate, form.endTime || "10:00");
      if (end <= start) end = new Date(start.getTime() + 3600000);
    }
    return ensureEventModel({
      ...(event || {}),
      ...form,
      title: form.title.trim() || "Untitled event",
      start,
      end,
      allDay: form.allDay,
      recurrence: form.recurrence,
      recurrenceExceptions: form.recurrenceExceptions,
    });
  }

  function requestSave() {
    const next = buildEvent();
    if (event?._isOccurrence || event?.recurrence) setScopeAction({ type: "save", event: next });
    else onSave(next, "series");
  }

  function requestDelete() {
    if (!event) return onClose();
    if (event?._isOccurrence || event?.recurrence) setScopeAction({ type: "delete", event });
    else onDelete(event, "series");
  }

  function chooseScope(scope) {
    if (!scopeAction) return;
    if (scopeAction.type === "save") onSave(scopeAction.event, scope);
    if (scopeAction.type === "delete") onDelete(scopeAction.event, scope);
    setScopeAction(null);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card event-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{event ? "Edit event" : "Add event"}</h2><button className="icon-btn" onClick={onClose}>✕</button></div>

        <label className="field-label">Title</label>
        <input className="input title-input" value={form.title} onChange={e => patch({ title: e.target.value })} placeholder="Event title" autoFocus />

        <div className="form-grid two">
          <div><label className="field-label">Calendar</label><select className="input" value={form.calendar} onChange={e => patch({ calendar: e.target.value })}>{calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="field-label">Category</label><select className="input" value={form.category} onChange={e => patch({ category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
        </div>

        <label className="toggle-row"><input type="checkbox" checked={form.allDay} onChange={e => patch({ allDay: e.target.checked })} /> All day</label>

        <div className="form-grid two">
          <div><label className="field-label">Start date</label><input className="input" type="date" value={form.startDate} onChange={e => patch({ startDate: e.target.value, endDate: form.endDate || e.target.value })} /></div>
          {!form.allDay && <div><label className="field-label">Start time</label><input className="input" type="time" value={form.startTime} onChange={e => patch({ startTime: e.target.value })} /></div>}
          <div><label className="field-label">End date</label><input className="input" type="date" value={form.endDate} onChange={e => patch({ endDate: e.target.value })} /></div>
          {!form.allDay && <div><label className="field-label">End time</label><input className="input" type="time" value={form.endTime} onChange={e => patch({ endTime: e.target.value })} /></div>}
        </div>

        <div className="repeat-card">
          <div><strong>Repeat</strong><p>{recurrenceSummary(form.recurrence, combineDateTime(form.startDate, form.startTime || "09:00"))}</p></div>
          <button className="mini-btn" onClick={() => setShowRecurrence(true)}>Customise</button>
        </div>

        <label className="field-label">Location</label>
        <input className="input" value={form.location} onChange={e => patch({ location: e.target.value })} placeholder="Optional location" />

        <label className="field-label">Notes</label>
        <textarea className="input textarea" value={form.notes} onChange={e => patch({ notes: e.target.value })} placeholder="Optional notes" />

        <label className="toggle-row"><input type="checkbox" checked={form.fixed} onChange={e => patch({ fixed: e.target.checked })} /> Fixed event / do not drag</label>

        <div className="modal-actions">
          {event && <button className="danger-btn" onClick={requestDelete}>Delete</button>}
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={requestSave}>Save</button>
        </div>

        {showRecurrence && <RecurrenceModal value={form.recurrence} baseDate={combineDateTime(form.startDate, form.startTime || "09:00")} onClose={() => setShowRecurrence(false)} onSave={recurrence => { patch({ recurrence }); setShowRecurrence(false); }} />}
        {scopeAction && <ScopeChooser action={scopeAction.type === "delete" ? "delete" : "change"} onCancel={() => setScopeAction(null)} onChoose={chooseScope} />}
      </div>
    </div>
  );
}
