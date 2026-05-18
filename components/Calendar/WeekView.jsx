"use client";

import { addDays, asDate, eventIntersectsDay, startOfDay, weekRange } from "../../lib/recurrence";
import { computeOverlapColumns } from "./DayView";

const DAY_START = 0;
const DAY_END = 24;
const HOUR_H = 48;

function fmtTime(date) {
  return asDate(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function WeekEvent({ event, categories, onClick }) {
  const s = asDate(event.start);
  const e = asDate(event.end);
  const cat = categories.find(c => c.id === event.category);
  const color = event.color || cat?.color || "#FF7BAC";
  const top = (s.getHours() + s.getMinutes() / 60 - DAY_START) * HOUR_H;
  const height = Math.max(((e - s) / 3600000) * HOUR_H - 3, 24);
  const width = 100 / (event._totalCols || 1);
  const left = (event._col || 0) * width;

  function dragStart(ev) {
    if (event.fixed) return;
    ev.dataTransfer.effectAllowed = "move";
    ev.dataTransfer.setData("application/tempo-event", JSON.stringify(event));
  }

  return (
    <div className={`week-event ${event.fixed ? "fixed" : "draggable"}`} draggable={!event.fixed} onDragStart={dragStart} onClick={ev => { ev.stopPropagation(); onClick(event); }} style={{ top, height, left: `${left}%`, width: `calc(${width}% - 4px)`, borderLeftColor: color, background: `${color}22` }}>
      <strong>{event.title}</strong>
      <span>{fmtTime(s)}</span>
      {event._isOccurrence && <em>↻</em>}
    </div>
  );
}

export default function WeekView({ date, events, categories, onEventClick, onGridClick, onReschedule, onDayClick }) {
  const range = weekRange(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(range.start, i));
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START);

  function snap(clientX, clientY, grid) {
    const rect = grid.getBoundingClientRect();
    const left = rect.left + 46;
    const colW = (rect.width - 46) / 7;
    const dayIndex = Math.max(0, Math.min(6, Math.floor((clientX - left) / colW)));
    const raw = ((clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const mins = Math.max(0, Math.min(23 * 60 + 45, Math.round(raw / 15) * 15));
    const out = new Date(days[dayIndex]);
    out.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return out;
  }

  function handleClick(e) {
    if (e.target.closest(".week-event")) return;
    onGridClick(snap(e.clientX, e.clientY, e.currentTarget));
  }

  function handleDrop(e) {
    const raw = e.dataTransfer.getData("application/tempo-event");
    if (!raw) return;
    e.preventDefault();
    const event = JSON.parse(raw);
    const newStart = snap(e.clientX, e.clientY, e.currentTarget);
    const dur = asDate(event.end) - asDate(event.start);
    onReschedule(event, newStart, new Date(newStart.getTime() + dur));
  }

  return (
    <div className="calendar-view week-view">
      <div className="week-header">
        <div />
        {days.map(day => <button key={day.toISOString()} className="week-day-head" onClick={() => onDayClick(day)}><strong>{day.toLocaleDateString("en-US", { weekday: "short" })}</strong><span>{day.getDate()}</span></button>)}
      </div>
      <div className="week-grid" style={{ height: (DAY_END - DAY_START) * HOUR_H }} onClick={handleClick} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <div className="week-time-col">{hours.map(h => <span key={h} style={{ top: (h - DAY_START) * HOUR_H }}>{h === 0 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}</span>)}</div>
        {days.map((day, index) => {
          const dayEvents = events.filter(ev => eventIntersectsDay(ev, day));
          const allDay = dayEvents.filter(ev => ev.allDay);
          const timed = computeOverlapColumns(dayEvents.filter(ev => !ev.allDay));
          return (
            <div key={day.toISOString()} className="week-day-col" style={{ left: `calc(46px + ${index} * ((100% - 46px) / 7))`, width: `calc((100% - 46px) / 7)` }}>
              <div className="week-all-day-stack">{allDay.map(ev => <button key={ev.id} className="week-all-day-pill" onClick={e => { e.stopPropagation(); onEventClick(ev); }}>{ev.title}</button>)}</div>
              {timed.map(ev => <WeekEvent key={ev.id} event={ev} categories={categories} onClick={onEventClick} />)}
            </div>
          );
        })}
        {hours.map(h => <div key={h} className="week-hour-line" style={{ top: (h - DAY_START) * HOUR_H }} />)}
      </div>
    </div>
  );
}
