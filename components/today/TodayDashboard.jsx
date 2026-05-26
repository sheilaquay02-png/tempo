import * as Core from "../../lib/tempo/core";
import { DailyAffirmationCard } from "../affirmations/Affirmations";
import { HabitCard } from "../habits/Habits";
import {
  habitProgress,
  habitRunsOnDate,
  habitStreak,
  normalizeHabits,
} from "../../utils/habitUtils";

const {
  DEFAULT_AFFIRMATIONS,
  CATEGORIES,
  TODAY,
  DAILY_CHECKIN_MOODS,
  DAILY_CHECKIN_ENERGIES,
  JOURNAL_PROMPTS,
  dateKey,
  taskBelongsToPeriod,
  getEventsOnDay,
  dailyCheckInForDate,
  fmtDate,
  fmt,
} = Core;

export function TodayLitePage({ summary, events = [], tasks = [], journal = {}, dailyCheckIns = [], affirmations = DEFAULT_AFFIRMATIONS, categories = CATEGORIES, habits = [], habitCompletions = [], onOpenCalendar, onOpenTasks, onOpenJournal, onOpenCheckIn, onOpenAffirmations, onFavoriteAffirmation, onOpenHabits, onPlanToday, onTomorrowReset, onToggleHabit, onIncrementHabit, onToggleTask, onEditTask }) {
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
  const checkIn = dailyCheckInForDate(dailyCheckIns, TODAY);
  const mood = checkIn?.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === checkIn.mood) : null;
  const energy = checkIn?.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === checkIn.energy) : null;
  const prompt = JOURNAL_PROMPTS[TODAY.getDate() % JOURNAL_PROMPTS.length];
  const catFor = id => categories.find(c => c.id === id) || categories.find(c => Core.categoryIs?.(id, c.id)) || { label: "Task", icon: "□", color: "var(--accent)" };
  const todayHabitsAll = normalizeHabits(habits).filter(h => habitRunsOnDate(h, TODAY));
  const todayHabits = todayHabitsAll.slice(0, 4);
  const completedHabits = todayHabitsAll.filter(h => habitProgress(h, habitCompletions, TODAY).completed).length;
  const rhythmItems = [
    { label: "Events", value: summary?.events ?? todayEvents.length, action: onOpenCalendar, emoji: "🗓️" },
    { label: "Tasks", value: summary?.tasks ?? todayTasks.length, action: onOpenTasks, emoji: "✅" },
    { label: "Habits", value: `${completedHabits}/${todayHabitsAll.length}`, action: onOpenHabits, emoji: "🌱" },
  ];
  return (
    <div className="phase-page today-page-v2">
      <div className="today-dashboard-hero today-top-layout">
        <div className="today-hero-copy">
          <div className="phase-kicker">Today</div>
          <h1>{greeting} ✨</h1>
          <p>Your daily rhythm, beautifully organized.</p>
          <div className="today-hero-actions">
            <button className="tf-save phase-primary" onClick={onPlanToday}>✨ Plan Today</button>
            <button className="tf-cancel" onClick={onTomorrowReset}>🌙 Tomorrow Reset</button>
          </div>
        </div>

        <section className="phase-card today-main-card today-top3-card">
          <div className="phase-card-head"><span>Top 3 Tasks</span><button onClick={onOpenTasks}>Open tasks</button></div>
          {topTasks.length ? <div className="today-task-list">{topTasks.map((t, idx) => {
            const cat = catFor(t.category);
            return <div key={t.id} className="today-task-row"><button className="today-task-check" onClick={() => onToggleTask?.(t.id)} aria-label={`Mark ${t.title} done`}>□</button><div><strong>{idx + 1}. {t.title}</strong><small><span style={{ color: cat.color }}>{cat.icon || "□"}</span> {cat.label}{t.deadline ? ` · due ${fmtDate(new Date(t.deadline))}` : ""}</small></div><button className="today-row-action" onClick={() => onEditTask?.(t)}>Edit</button></div>;
          })}</div> : <div className="today-empty-sugar"><img src="/empty-tasks.png" alt="All clear, no tasks" /><strong>All clear! No tasks for now. Enjoy the free time 🌸</strong></div>}
        </section>

        <div className="today-hero-stack">
          <DailyAffirmationCard compact affirmations={affirmations} />
          <div className="today-checkin-card">
            <div className="today-checkin-top"><span>Check-in</span><button onClick={onOpenCheckIn}>{checkIn ? "Update" : "Add"}</button></div>
            <div className="today-mood-display">{mood ? <><span>{mood.emoji}</span><strong>Feeling {mood.label}</strong></> : <><span>🌿</span><strong>No check-in yet</strong></>}</div>
            <div className="today-energy-row"><span>Energy</span><strong>{energy ? `${energy.emoji} ${energy.label}` : "Not set"}</strong></div>
            <p>{checkIn?.note ? checkIn.note.slice(0, 90) : "Start with a quick mood and energy check-in, then let Tempo help you shape the day."}</p>
          </div>
        </div>
      </div>

      <div className="today-rhythm-strip">
        {rhythmItems.map(item => <button key={item.label} onClick={item.action}><span>{item.emoji}</span><strong>{item.value}</strong><small>{item.label}</small></button>)}
        <button onClick={onOpenCalendar}><span>🕊️</span><strong>{summary?.freeHours ?? 0}h</strong><small>Free time</small></button>
      </div>

      <div className="today-dashboard-grid today-calendar-habits-grid">
        <section className="phase-card today-side-card">
          <div className="phase-card-head"><span>Calendar</span><button onClick={onOpenCalendar}>Open calendar</button></div>
          {todayEvents.length ? <div className="today-event-list">{todayEvents.map(e => <div key={e.id} className="today-event-row"><time>{e.allDay ? "All day" : fmt(e.start)}</time><div><strong>{e.title}</strong><small>{e.allDay ? "" : `${fmt(e.start)} – ${fmt(e.end)}`}</small></div></div>)}</div> : <div className="phase-empty">No events scheduled yet.</div>}
        </section>

        <section className="phase-card today-wide-card">
          <div className="phase-card-head"><span>Today’s Habits</span><button onClick={onOpenHabits}>Open habits</button></div>
          {todayHabits.length ? <div className="today-habit-stack today-dashboard-card-grid">{todayHabits.map(h => <HabitCard key={h.id} habit={h} progress={habitProgress(h, habitCompletions, TODAY)} streak={habitStreak(h, habitCompletions, TODAY)} onToggle={onToggleHabit} onIncrement={onIncrementHabit} onEdit={onOpenHabits} compact />)}</div> : <div className="phase-empty">No habits scheduled today. Create one in Habits.</div>}
        </section>
      </div>

      <div className="today-bottom-grid today-journal-only">
        <section className="phase-card today-journal-card">
          <div className="phase-card-head"><span>Journal Prompt</span><button onClick={onOpenJournal}>Open Journal</button></div>
          <p className="today-prompt">{prompt}</p>
          <div className="today-journal-actions"><button className="tf-cancel" onClick={onOpenJournal}>📔 Write today’s entry</button><button className="tf-save" onClick={onTomorrowReset}>🌙 Start Tomorrow Reset</button></div>
        </section>
      </div>
    </div>
  );
}
