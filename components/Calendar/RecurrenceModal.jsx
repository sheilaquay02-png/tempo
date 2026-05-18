"use client";

import { useMemo, useState } from "react";
import { WEEKDAY_ORDER, WEEKDAY_LABELS, blankRecurrence, normalizeRecurrence, ordinalWeekdayInfo, recurrenceSummary } from "../../lib/recurrence";

export default function RecurrenceModal({ value, baseDate, onSave, onClose }) {
  const [recurrence, setRecurrence] = useState(() => normalizeRecurrence(value, baseDate) || blankRecurrence(baseDate));
  const monthlyInfo = useMemo(() => ordinalWeekdayInfo(baseDate || new Date()), [baseDate]);

  function patch(next) {
    setRecurrence(r => normalizeRecurrence({ ...r, ...next }, baseDate));
  }

  function toggleWeekday(day) {
    setRecurrence(r => {
      const exists = r.byWeekday.includes(day);
      const next = exists ? r.byWeekday.filter(d => d !== day) : [...r.byWeekday, day];
      return normalizeRecurrence({ ...r, byWeekday: next.length ? next : [day] }, baseDate);
    });
  }

  const ordinalLabel = monthlyInfo.ordinal === -1 ? "last" : ["", "1st", "2nd", "3rd", "4th", "5th"][monthlyInfo.ordinal] || `${monthlyInfo.ordinal}th`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card recurrence-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Custom repeat</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="repeat-row">
          <span>Repeat every</span>
          <input className="input small-number" type="number" min="1" value={recurrence.interval} onChange={e => patch({ interval: Number(e.target.value) || 1 })} />
          <select className="input" value={recurrence.freq} onChange={e => patch({ freq: e.target.value })}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>

        {recurrence.freq === "week" && (
          <div className="repeat-section">
            <label className="field-label">Repeat on</label>
            <div className="weekday-pills">
              {WEEKDAY_ORDER.map(day => (
                <button key={day} type="button" className={`weekday-pill ${recurrence.byWeekday.includes(day) ? "active" : ""}`} onClick={() => toggleWeekday(day)}>{WEEKDAY_LABELS[day]}</button>
              ))}
            </div>
          </div>
        )}

        {recurrence.freq === "month" && (
          <div className="repeat-section">
            <label className="field-label">Monthly repeat pattern</label>
            <label className="radio-row"><input type="radio" checked={recurrence.monthlyMode === "date"} onChange={() => patch({ monthlyMode: "date" })} /> Same date every month</label>
            <label className="radio-row"><input type="radio" checked={recurrence.monthlyMode === "weekday"} onChange={() => patch({ monthlyMode: "weekday" })} /> Same weekday position ({ordinalLabel} {WEEKDAY_LABELS[monthlyInfo.weekday]})</label>
          </div>
        )}

        {recurrence.freq === "year" && <p className="muted">Repeats yearly on the same date.</p>}

        <div className="repeat-section">
          <label className="field-label">Ends</label>
          <label className="radio-row"><input type="radio" checked={recurrence.endType === "never"} onChange={() => patch({ endType: "never", until: null, count: null })} /> Never</label>
          <label className="radio-row"><input type="radio" checked={recurrence.endType === "on"} onChange={() => patch({ endType: "on", until: recurrence.until || new Date().toISOString().slice(0, 10), count: null })} /> On <input className="input inline-date" type="date" disabled={recurrence.endType !== "on"} value={recurrence.until || ""} onChange={e => patch({ until: e.target.value, endType: "on" })} /></label>
          <label className="radio-row"><input type="radio" checked={recurrence.endType === "after"} onChange={() => patch({ endType: "after", count: recurrence.count || 10, until: null })} /> After <input className="input small-number" type="number" min="1" disabled={recurrence.endType !== "after"} value={recurrence.count || 10} onChange={e => patch({ count: Number(e.target.value) || 1, endType: "after" })} /> occurrences</label>
        </div>

        <div className="summary-box">{recurrenceSummary(recurrence, baseDate)}</div>

        <div className="modal-actions">
          <button className="ghost-btn" onClick={() => onSave(null)}>Does not repeat</button>
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={() => onSave(recurrence)}>Done</button>
        </div>
      </div>
    </div>
  );
}
