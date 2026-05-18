"use client";

import { asDate, eventIntersectsDay, startOfDay } from "../../lib/recurrence";

const DAY_START = 0;
const DAY_END = 24;
const HOUR_H = 48;

function fmtTime(date) {
  return asDate(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function computeOverlapColumns(events) {
  const sorted = [...events].sort((a, b) => asDate(a.start) - asDate(b.start));
  const groups = [];
  let current = [];
  let groupEnd = 0;
  for (const ev of sorted) {
    const s = asDate(ev.start).getTime();
    const e = asDate(ev.end).getTime();
    if (!current.length || s < groupEnd) {
      current.push(ev);
      groupEnd = Math.max(groupEnd, e);
    } else {
      groups.push(current);
      current = [ev];
      groupEnd = e;
    }
  }
  if (current.length) groups.push(current);
  const output = [];
  for (const group of groups) {
    const cols = [];
    for (const ev of group) {
      const s = asDate(ev.start).getTime();
      const e = asDate(ev.end).getTime();
      let col = cols.findIndex(end => end <= s);
      if (col === -1) { col = cols.length; cols.push(e); }
      else cols[col] = e;
      output.push({ ...ev, _col: col, _totalCols: cols.length });
    }
    const total = Math.max(1, cols.length);
    for (const ev of output.slice(-group.length)) ev._totalCols = total;
  }
  return output;
}

function TimedEvent({ event, categories, onClick }) {
  const start = asDate(event.start);
  const end = asDate(event.end);
  const top = (start.getHours() + start.getMinutes() / 60 - DAY_START) * HOUR_H;
  const height = Math.max(((end - start) / 3600000) * HOUR_H - 3, 26);
  const cat = categories.find(c => c.id === event.category);
  const color = event.color || cat?.color || "#FF7BAC";
  const width = 100 / (event._totalCols || 1);
  const left = (event._col || 0) * width;

  function dragStart(e) {
    if (event.fixed) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/tempo-event", JSON.stringify(event));
  }

  return (
    <div className={`event-block ${event.fixed ? "fixed" : "draggable"}`} draggable={!event.fixed} onDragStart={dragStart} onClick={e => { e.stopPropagation(); onClick(event); }} style={{ top, height, left: `${left}%`, width: `calc(${width}% - 4px)`, borderLeftColor: color, background: `${color}22` }}>
      <strong style={{ color }}>{event.title}</strong>
      <span>{fmtTime(start)} – {fmtTime(end)}</span>
      {event._isOccurrence && <em>↻</em>}
    </div>
  );
}

export default function DayView({ date, events, categories, onEventClick, onGridClick, onReschedule }) {
  const day = startOfDay(date);
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START);
  const dayEvents = events.filter(e => eventIntersectsDay(e, day));
  const allDayEvents = dayEvents.filter(e => e.allDay);
  const timed = computeOverlapColumns(dayEvents.filter(e => !e.allDay));

  function snap(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = ((e.clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const mins = Math.max(0, Math.min(23 * 60 + 45, Math.round(raw / 15) * 15));
    const out = new Date(day);
    out.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return out;
  }

  function handleGridClick(e) {
    if (e.target.closest(".event-block")) return;
    onGridClick(snap(e));
  }

  function handleDrop(e) {
    const raw = e.dataTransfer.getData("application/tempo-event");
    if (!raw) return;
    e.preventDefault();
    const event = JSON.parse(raw);
    const newStart = snap(e);
    const dur = asDate(event.end) - asDate(event.start);
    const newEnd = new Date(newStart.getTime() + dur);
    onReschedule(event, newStart, newEnd);
  }

  return (
    <div className="calendar-view day-view">
      <div className="all-day-row">
        <span className="all-day-label">All day</span>
        <div className="all-day-items">{allDayEvents.map(ev => <button key={ev.id} className="all-day-pill" onClick={() => onEventClick(ev)}>{ev.title}{ev._isOccurrence ? " ↻" : ""}</button>)}</div>
      </div>
      <div className="time-grid" style={{ height: (DAY_END - DAY_START) * HOUR_H }} onClick={handleGridClick} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        {hours.map(h => <div key={h} className="hour-row" style={{ top: (h - DAY_START) * HOUR_H }}><span>{h === 0 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}</span></div>)}
        {timed.map(ev => <TimedEvent key={ev.id} event={ev} categories={categories} onClick={onEventClick} />)}
      </div>
    </div>
  );
}
