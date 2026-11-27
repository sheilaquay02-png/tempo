import * as Core from "../../lib/tempo/core";
import { DailyAffirmationCard } from "../affirmations/Affirmations";

const {
  DEFAULT_AFFIRMATIONS,
  CATEGORIES,
  TODAY,
  dateKey,
  taskBelongsToPeriod,
  getEventsOnDay,
  fmtDate,
  fmt,
} = Core;

// The Today view focuses on the tools people use each day: tasks, calendar and affirmations.
// Legacy check-ins and productivity history remain stored but are no longer surfaced here.
export function TodayLitePage({
  summary,
  events = [],
  tasks = [],
  affirmations = DEFAULT_AFFIRMATIONS,
  categories = CATEGORIES,
  onOpenCalendar,
  onOpenTasks,
  onPlanToday,
  onToggleTask,
  onEditTask,
  onOpenRoom,
}) {
  const todayKey = dateKey(TODAY);
  const nowHour = new Date().getHours();
  const greeting = nowHour < 12 ? "Good morning" : nowHour < 18 ? "Good afternoon" : "Good evening";
  const todayTasks = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY));
  const taskRank = t => {
    const priority = { high: 0, medium: 1, low: 2 }[t.priority] ?? 1;
    const mainBoost = Core.categoryIs?.(t.category, "main") ? -1 : 0;
    const dueToday = t.deadline && dateKey(new Date(t.deadline)) === todayKey ? -1 : 0;
    return priority + mainBoost + dueToday;
  };
  const topTasks = [...todayTasks].sort((a, b) => taskRank(a) - taskRank(b)).slice(0, 3);
  const todayEvents = getEventsOnDay(events, TODAY).sort((a, b) => a.start - b.start).slice(0, 5);
  const catFor = id => categories.find(c => c.id === id) || categories.find(c => Core.categoryIs?.(id, c.id)) || { label: "Task", icon: "□", color: "var(--accent)" };
  const summaryItems = [
    { label: "Events", value: summary?.events ?? todayEvents.length, action: onOpenCalendar, emoji: "🗓️" },
    { label: "Tasks", value: summary?.tasks ?? todayTasks.length, action: onOpenTasks, emoji: "✅" },
    { label: "Free time", value: `${summary?.freeHours ?? 0}h`, action: onOpenCalendar, emoji: "🕊️" },
  ];

  return (
    <div className="phase-page today-page-v2">
      <div className="today-dashboard-hero today-top-layout">
        <div className="today-hero-copy">
          <div className="phase-kicker">Today</div>
          <h1>{greeting} ✨</h1>
          <p>Your day, simply organized.</p>
          <div className="today-hero-actions">
            <button className="tf-save phase-primary" onClick={onPlanToday}>✨ Plan Today</button>
          </div>
        </div>

        <section className="phase-card today-main-card today-top3-card">
          <div className="phase-card-head"><span>Top 3 Tasks</span><button onClick={onOpenTasks}>Open tasks</button></div>
          {topTasks.length ? <div className="today-task-list">{topTasks.map((t, idx) => {
            const cat = catFor(t.category);
            return <div key={t.id} className="today-task-row"><button className="today-task-check" onClick={() => onToggleTask?.(t.id)} aria-label={`Mark ${t.title} done`}>□</button><div><strong>{idx + 1}. {t.title}</strong><small><span style={{ color: cat.color }}>{cat.icon || "□"}</span> {cat.label}{t.deadline ? ` · due ${fmtDate(new Date(t.deadline))}` : ""}</small></div><button className="today-row-action" onClick={() => onEditTask?.(t)}>Edit</button></div>;
          })}</div> : <div className="today-empty-sugar"><img src="/empty-tasks.png" alt="No tasks due today" /><strong>All clear! Enjoy a little breathing room 🌸</strong></div>}
        </section>

        <div className="today-hero-stack">
          <DailyAffirmationCard compact affirmations={affirmations} />
          {onOpenRoom && <button type="button" className="tf-save phase-primary today-room-btn" style={{ width: "100%", minHeight: 48, justifyContent: "center" }} onClick={onOpenRoom}>🏠 Visit my room</button>}
        </div>
      </div>

      <div className="today-rhythm-strip">
        {summaryItems.map(item => <button key={item.label} onClick={item.action}><span>{item.emoji}</span><strong>{item.value}</strong><small>{item.label}</small></button>)}
      </div>

      <div className="today-dashboard-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <section className="phase-card today-wide-card">
          <div className="phase-card-head"><span>Today’s Calendar</span><button onClick={onOpenCalendar}>Open calendar</button></div>
          {todayEvents.length ? <div className="today-event-list">{todayEvents.map(e => <div key={e.id} className="today-event-row"><time>{e.allDay ? "All day" : fmt(e.start)}</time><div><strong>{e.title}</strong><small>{e.allDay ? "" : `${fmt(e.start)} – ${fmt(e.end)}`}</small></div></div>)}</div> : <div className="phase-empty">Nothing scheduled yet. Enjoy the open space.</div>}
        </section>
      </div>
    </div>
  );
}
