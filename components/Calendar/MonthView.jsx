"use client";

import { addDays, asDate, eventIntersectsDay, monthRange, startOfDay } from "../../lib/recurrence";

export default function MonthView({ date, events, categories, onEventClick, onDayClick, onReschedule }) {
  const range = monthRange(date);
  const days = Array.from({ length: 42 }, (_, i) => addDays(range.start, i));
  const shownMonth = asDate(date).getMonth();

  function handleDrop(e, day) {
    const raw = e.dataTransfer.getData("application/tempo-event");
    if (!raw) return;
    e.preventDefault();
    const event = JSON.parse(raw);
    const s = asDate(event.start);
    const newStart = startOfDay(day);
    newStart.setHours(s.getHours(), s.getMinutes(), 0, 0);
    const dur = asDate(event.end) - asDate(event.start);
    const newEnd = event.allDay ? addDays(startOfDay(day), Math.max(1, Math.round(dur / 86400000))) : new Date(newStart.getTime() + dur);
    onReschedule(event, newStart, newEnd);
  }

  return (
    <div className="month-view">
      <div className="month-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <span key={d}>{d}</span>)}</div>
      <div className="month-grid">
        {days.map(day => {
          const dayEvents = events.filter(ev => eventIntersectsDay(ev, day)).sort((a, b) => asDate(a.start) - asDate(b.start));
          return (
            <div key={day.toISOString()} className={`month-day ${day.getMonth() !== shownMonth ? "muted-day" : ""}`} onClick={() => onDayClick(day)} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, day)}>
              <div className="month-day-number">{day.getDate()}</div>
              <div className="month-events">
                {dayEvents.slice(0, 4).map(ev => {
                  const cat = categories.find(c => c.id === ev.category);
                  const color = ev.color || cat?.color || "#FF7BAC";
                  return <button key={ev.id} draggable={!ev.fixed} onDragStart={e => e.dataTransfer.setData("application/tempo-event", JSON.stringify(ev))} className="month-event-row" style={{ borderLeftColor: color, background: `${color}22` }} onClick={e => { e.stopPropagation(); onEventClick(ev); }}>{ev.allDay ? "全天" : asDate(ev.start).toLocaleTimeString("en-US", { hour: "numeric" })} {ev.title}</button>;
                })}
                {dayEvents.length > 4 && <button className="more-events">+{dayEvents.length - 4} more</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
