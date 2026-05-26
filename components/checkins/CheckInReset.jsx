"use client";

import { useEffect, useMemo, useState } from "react";
import * as Core from "../../lib/tempo/core";

const {
  TODAY,
  dateKey,
  taskBelongsToPeriod,
  taskScopeOf,
  taskWeekKey,
  taskDayKey,
  taskCompletedDateKey,
  formatTaskDuration,
  formatTaskPeriodLabel,
  formatWithDisplayTimezone,
  weekStart,
  weekDays,
  addDaysSafe,
  eventOccursOnDay,
  normalizeDailyCheckIns,
  DAILY_CHECKIN_MOODS,
  DAILY_CHECKIN_ENERGIES,
  TOMORROW_RESET_TASK_ACTIONS,
  WEEKLY_RESET_TASK_ACTIONS,
} = Core;

// ─── Tomorrow Reset ───────────────────────────────────────────────────────────
export function taskFallsOnDateForReset(task, targetDate = TODAY) {
  if (!task || task.done) return false;
  if (taskBelongsToPeriod(task, "day", targetDate)) return true;
  const targetKey = dateKey(targetDate);
  const scheduledStart = task.scheduledStart ? new Date(task.scheduledStart) : null;
  if (scheduledStart && !Number.isNaN(scheduledStart.getTime()) && dateKey(scheduledStart) === targetKey) return true;
  if (task.scheduled && String(task.scheduled).slice(0, 10) === targetKey) return true;
  if (task.deadline && String(task.deadline).slice(0, 10) === targetKey && taskScopeOf(task) === "day") return true;
  return false;
}

export function TomorrowResetPage({ tasks, latestReset = null, gameStats, onCompleteReset, onBack }) {
  const actionById = useMemo(() => {
    const initial = {};
    tasks.forEach(t => { initial[t.id] = "tomorrow"; });
    return initial;
  }, [tasks]);
  const [actions, setActions] = useState(actionById);
  const [reflection, setReflection] = useState(() => ({
    wentWell: latestReset?.reflection?.wentWell || "",
    difficult: latestReset?.reflection?.difficult || "",
    moveTomorrow: latestReset?.reflection?.moveTomorrow || "",
    tomorrowMainThing: latestReset?.reflection?.tomorrowMainThing || "",
    gratitude: latestReset?.reflection?.gratitude || "",
  }));
  const [showPrevious, setShowPrevious] = useState(Boolean(latestReset));
  useEffect(() => { setActions(actionById); }, [actionById]);
  useEffect(() => {
    if (!latestReset) return;
    setReflection({
      wentWell: latestReset?.reflection?.wentWell || "",
      difficult: latestReset?.reflection?.difficult || "",
      moveTomorrow: latestReset?.reflection?.moveTomorrow || "",
      tomorrowMainThing: latestReset?.reflection?.tomorrowMainThing || "",
      gratitude: latestReset?.reflection?.gratitude || "",
    });
    setShowPrevious(true);
  }, [latestReset?.updatedAt]);
  const setTaskAction = (id, action) => setActions(prev => ({ ...prev, [id]: action }));
  const setAll = action => setActions(Object.fromEntries(tasks.map(t => [t.id, action])));
  const summary = TOMORROW_RESET_TASK_ACTIONS.map(action => ({ ...action, count: tasks.filter(t => actions[t.id] === action.id).length }));
  const hasReflection = Object.values(reflection).some(v => String(v || "").trim());
  const canSave = tasks.length > 0 || hasReflection;
  return (
    <div className="tomorrow-reset-page">
      <div className="tomorrow-reset-card page-card">
        <div className="tomorrow-reset-head">
          <div>
            <div className="phase-kicker">Tomorrow Reset</div>
            <h2>🌙 Close today calmly</h2>
            <p className="reset-hero-oneline">{tasks.length ? `You have ${tasks.length} unfinished task${tasks.length === 1 ? "" : "s"}. Choose what happens to each one, then save your reflection into Journal.` : "No unfinished tasks today. You can still write a quick reflection and set tomorrow’s main thing."}</p>
          </div>
          {onBack && <button className="tf-cancel tomorrow-reset-back" onClick={onBack}>← Back to Today</button>}
        </div>
        {latestReset && showPrevious && (
          <div className="tomorrow-reset-previous">
            <div><strong>Saved today</strong><span>{latestReset.completedAt ? new Date(latestReset.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Earlier"}</span></div>
            <button className="tf-cancel" onClick={() => setShowPrevious(false)}>Edit today’s reset</button>
          </div>
        )}
        {gameStats && <div className="eod-rank-card tomorrow-reset-rhythm">
          <div className="eod-rank-main"><strong>Today’s rhythm</strong><span>{gameStats.quests.filter(q => q.done).length}/{gameStats.quests.length} daily check-ins done</span></div>
          <div className="eod-rank-meta"><span>Small steps still count</span><span>Reset gently</span></div>
          <div className="eod-rank-note">{gameStats.today.rank === "S" ? "Perfect bloom day ✨" : gameStats.today.score >= 70 ? "Strong rhythm today 🌸" : "Gentle reset. Carry what matters into the next plan 🌱"}</div>
        </div>}
        <div className="tomorrow-reset-section">
          <div className="tomorrow-reset-section-head"><strong>Unfinished tasks</strong><div className="reset-quick-actions"><button onClick={() => setAll("tomorrow")}>All tomorrow</button><button onClick={() => setAll("week")}>All this week</button><button onClick={() => setAll("keep")}>Keep all</button></div></div>
          {tasks.length ? (
            <div className="tomorrow-reset-task-list">
              {tasks.map(t => {
                const selectedAction = actions[t.id] || "tomorrow";
                return (
                  <div key={t.id} className="tomorrow-reset-task">
                    <div className="tomorrow-reset-task-main"><strong>{t.title}</strong><span>{formatTaskDuration(t.duration)} · {t.priority || "medium"}</span></div>
                    <select className="modal-select tomorrow-reset-action-select" value={selectedAction} onChange={e => setTaskAction(t.id, e.target.value)}>
                      {TOMORROW_RESET_TASK_ACTIONS.map(action => <option key={action.id} value={action.id}>{action.emoji} {action.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          ) : <div className="phase-empty">Nothing to process. That is a clean close.</div>}
          <div className="tomorrow-reset-summary-row">
            {summary.map(item => <span key={item.id} className={`tomorrow-reset-summary-chip ${item.count ? "active" : ""}`}>{item.emoji} {item.shortLabel}: {item.count}</span>)}
          </div>
        </div>
        <div className="tomorrow-reset-section">
          <div className="tomorrow-reset-section-head"><strong>Reflection</strong><span>Saved into Journal</span></div>
          <div className="tomorrow-reset-reflection-grid">
            <label><span>What went well today?</span><textarea value={reflection.wentWell} onChange={e => setReflection(r => ({ ...r, wentWell: e.target.value }))} placeholder="Small wins, clear moments, anything worth keeping." /></label>
            <label><span>What felt difficult?</span><textarea value={reflection.difficult} onChange={e => setReflection(r => ({ ...r, difficult: e.target.value }))} placeholder="Name the friction without judging it." /></label>
            <label><span>What should move to tomorrow?</span><textarea value={reflection.moveTomorrow} onChange={e => setReflection(r => ({ ...r, moveTomorrow: e.target.value }))} placeholder="Anything your future self should remember." /></label>
            <label><span>Tomorrow’s main thing</span><textarea value={reflection.tomorrowMainThing} onChange={e => setReflection(r => ({ ...r, tomorrowMainThing: e.target.value }))} placeholder="One clear priority for tomorrow." /></label>
            <label className="wide"><span>One gratitude</span><textarea value={reflection.gratitude} onChange={e => setReflection(r => ({ ...r, gratitude: e.target.value }))} placeholder="One thing you are grateful for today." /></label>
          </div>
        </div>
        <div className="tomorrow-reset-footer">
          {onBack && <button className="tf-cancel" onClick={onBack}>Cancel</button>}
          <button className="tf-save" disabled={!canSave} onClick={() => onCompleteReset({ taskActions: actions, reflection })}>Save reset →</button>
        </div>
      </div>
    </div>
  );
}

// Legacy alias kept to avoid breaking older internal references.
export function CarryOverPrompt(props) {
  return <TomorrowResetPage {...props} />;
}


export function WeeklyResetPage({ tasks = [], events = [], habits = [], dailyCheckIns = [], latestReset = null, onCompleteReset }) {
  const currentWeekStartDate = weekStart(TODAY);
  const currentWeekStartKey = dateKey(currentWeekStartDate);
  const currentWeekDays = weekDays(currentWeekStartDate);
  const currentWeekDayKeys = new Set(currentWeekDays.map(d => dateKey(d)));
  const nextWeekStartDate = addDaysSafe(currentWeekStartDate, 7);
  const [priorities, setPriorities] = useState(() => {
    const saved = latestReset?.priorities || [];
    return [saved[0] || "", saved[1] || "", saved[2] || ""];
  });
  const [intention, setIntention] = useState(latestReset?.intention || "");
  const [keyEvents, setKeyEvents] = useState(() => {
    const saved = latestReset?.keyEvents || [];
    return [saved[0] || "", saved[1] || "", saved[2] || ""];
  });
  const [habitFocus, setHabitFocus] = useState(() => new Set(latestReset?.habitFocus || []));
  const [reflection, setReflection] = useState(() => ({
    lastWeek: latestReset?.reflection?.lastWeek || "",
    wins: latestReset?.reflection?.wins || "",
    difficult: latestReset?.reflection?.difficult || "",
    moodEnergy: latestReset?.reflection?.moodEnergy || "",
    nextWeekFocus: latestReset?.reflection?.nextWeekFocus || "",
  }));

  const unfinishedTasks = useMemo(() => tasks.filter(t => {
    if (t.done) return false;
    const scope = taskScopeOf(t);
    if (scope === "week") return taskWeekKey(t) === currentWeekStartKey;
    if (scope === "day") return currentWeekDayKeys.has(taskDayKey(t));
    return false;
  }), [tasks, currentWeekStartKey]);

  const initialActions = useMemo(() => Object.fromEntries(unfinishedTasks.map(t => [t.id, "nextWeek"])), [unfinishedTasks]);
  const [actions, setActions] = useState(initialActions);
  useEffect(() => { setActions(initialActions); }, [initialActions]);
  const setTaskAction = (id, action) => setActions(prev => ({ ...prev, [id]: action }));
  const setAll = action => setActions(Object.fromEntries(unfinishedTasks.map(t => [t.id, action])));

  const weekEvents = useMemo(() => events.filter(e => currentWeekDays.some(day => eventOccursOnDay(e, day))).slice(0, 8), [events, currentWeekStartKey]);
  const weekCheckIns = useMemo(() => normalizeDailyCheckIns(dailyCheckIns).filter(c => currentWeekDayKeys.has(c.date)), [dailyCheckIns, currentWeekStartKey]);
  const moodCounts = DAILY_CHECKIN_MOODS.map(m => ({ ...m, count: weekCheckIns.filter(c => c.mood === m.id).length })).filter(m => m.count > 0).sort((a,b) => b.count - a.count);
  const energyCounts = DAILY_CHECKIN_ENERGIES.map(e => ({ ...e, count: weekCheckIns.filter(c => c.energy === e.id).length })).filter(e => e.count > 0).sort((a,b) => b.count - a.count);
  const topMood = moodCounts[0] || null;
  const topEnergy = energyCounts[0] || null;
  const lowEnergyDays = weekCheckIns.filter(c => c.energy === "low").length;
  const summary = WEEKLY_RESET_TASK_ACTIONS.map(action => ({ ...action, count: unfinishedTasks.filter(t => actions[t.id] === action.id).length }));
  const cleanPriorities = priorities.map(v => v.trim()).filter(Boolean);
  const cleanEvents = keyEvents.map(v => v.trim()).filter(Boolean);
  const hasContent = cleanPriorities.length || intention.trim() || cleanEvents.length || Object.values(reflection).some(v => String(v || "").trim()) || unfinishedTasks.length;
  const toggleHabitFocus = id => setHabitFocus(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const updateListItem = (setter, index, value) => setter(list => list.map((item, i) => i === index ? value : item));

  return (
    <div className="weekly-reset-page soft-page">
      <div className="phase-hero weekly-reset-hero">
        <div>
          <div className="phase-kicker">Weekly Reset</div>
          <h1>🧺 Reset your week calmly</h1>
          <p className="reset-hero-oneline">Review what happened, clear unfinished tasks, choose your priorities, and set the rhythm for next week.</p>
        </div>
        <button className="tf-save" disabled={!hasContent} onClick={() => onCompleteReset({
          weekStart: currentWeekStartKey,
          taskActions: actions,
          priorities: cleanPriorities,
          keyEvents: cleanEvents,
          habitFocus: [...habitFocus],
          intention,
          reflection,
          moodEnergySummary: {
            checkInDays: weekCheckIns.length,
            dominantMood: topMood?.id || null,
            dominantEnergy: topEnergy?.id || null,
            lowEnergyDays,
          },
        })}>Save Weekly Reset →</button>
      </div>

      {latestReset && <div className="tomorrow-reset-previous weekly-reset-saved-note"><div><strong>Saved for this week</strong><span>{latestReset.completedAt ? new Date(latestReset.completedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Earlier"}</span></div><span>{latestReset.priorities?.length || 0} priorities · {latestReset.summary?.movedNextWeek || 0} moved forward</span></div>}

      <div className="weekly-reset-grid">
        <section className="tomorrow-reset-section weekly-reset-panel weekly-review-panel wide">
          <div className="tomorrow-reset-section-head"><strong>1. Review last week</strong><span>{formatTaskPeriodLabel("week", TODAY)}</span></div>
          <div className="weekly-reset-mini-grid">
            <div><strong>{tasks.filter(t => t.done && currentWeekDayKeys.has(taskCompletedDateKey(t))).length}</strong><span>tasks done</span></div>
            <div><strong>{weekEvents.length}</strong><span>events</span></div>
            <div><strong>{weekCheckIns.length}</strong><span>check-ins</span></div>
            <div><strong>{topEnergy ? topEnergy.label : "—"}</strong><span>top energy</span></div>
          </div>
          <div className="weekly-mood-row">
            {topMood ? <span>{topMood.emoji} Mostly {topMood.label}</span> : <span>🌿 No mood trend yet</span>}
            {topEnergy ? <span>{topEnergy.emoji} Mostly {topEnergy.label} energy</span> : <span>⚡ No energy trend yet</span>}
            {lowEnergyDays > 0 && <span>🕊️ {lowEnergyDays} low-energy day{lowEnergyDays === 1 ? "" : "s"}</span>}
          </div>
        </section>

        <section className="tomorrow-reset-section weekly-reset-panel weekly-priority-panel">
          <div className="tomorrow-reset-section-head"><strong>2. Choose weekly priorities</strong><span>Pick up to 3 main focuses</span></div>
          <div className="weekly-reset-input-list">
            {priorities.map((item, index) => <input key={index} className="tf-input" value={item} onChange={e => updateListItem(setPriorities, index, e.target.value)} placeholder={`Priority ${index + 1}`} />)}
          </div>
          <label className="weekly-reset-label"><span>Weekly intention</span><textarea value={intention} onChange={e => setIntention(e.target.value)} placeholder="This week, I want to move with…" /></label>
        </section>

        <section className="tomorrow-reset-section weekly-reset-panel weekly-clear-panel">
          <div className="tomorrow-reset-section-head"><strong>3. Clear unfinished tasks</strong><div className="reset-quick-actions"><button onClick={() => setAll("nextWeek")}>All next week</button><button onClick={() => setAll("keep")}>Keep all</button><button onClick={() => setAll("drop")}>Drop all</button></div></div>
          {unfinishedTasks.length ? <div className="tomorrow-reset-task-list">
            {unfinishedTasks.map(t => <div key={t.id} className="tomorrow-reset-task weekly-reset-task-row">
              <div className="tomorrow-reset-task-main"><strong>{t.title}</strong><span>{formatTaskDuration(t.duration)} · {taskScopeOf(t)} · {t.priority || "medium"}</span></div>
              <select className="modal-select tomorrow-reset-action-select" value={actions[t.id] || "nextWeek"} onChange={e => setTaskAction(t.id, e.target.value)}>
                {WEEKLY_RESET_TASK_ACTIONS.map(action => <option key={action.id} value={action.id}>{action.emoji} {action.label}</option>)}
              </select>
            </div>)}
          </div> : <div className="phase-empty">No unfinished weekly tasks to clear. Clean start 🌱</div>}
          <div className="tomorrow-reset-summary-row">{summary.map(item => <span key={item.id} className={`tomorrow-reset-summary-chip ${item.count ? "active" : ""}`}>{item.emoji} {item.shortLabel}: {item.count}</span>)}</div>
        </section>

        <section className="tomorrow-reset-section weekly-reset-panel">
          <div className="tomorrow-reset-section-head"><strong>4. Plan key events</strong><span>Simple notes for next week</span></div>
          <div className="weekly-reset-input-list">
            {keyEvents.map((item, index) => <input key={index} className="tf-input" value={item} onChange={e => updateListItem(setKeyEvents, index, e.target.value)} placeholder={`Key event or commitment ${index + 1}`} />)}
          </div>
          {weekEvents.length > 0 && <div className="weekly-event-preview">{weekEvents.slice(0, 4).map(e => <span key={e.id}>{formatWithDisplayTimezone(e.start, { weekday: "short" })} · {e.title}</span>)}</div>}
        </section>

        <section className="tomorrow-reset-section weekly-reset-panel">
          <div className="tomorrow-reset-section-head"><strong>5. Reset habit focus</strong><span>Choose habits to watch</span></div>
          {habits.filter(h => !h.archived).length ? <div className="weekly-habit-focus-grid">
            {habits.filter(h => !h.archived).slice(0, 12).map(h => <button key={h.id} className={`weekly-habit-focus ${habitFocus.has(h.id) ? "active" : ""}`} onClick={() => toggleHabitFocus(h.id)}><span>{h.emoji || "🌱"}</span>{h.name}</button>)}
          </div> : <div className="phase-empty">Add habits first, then reset your weekly habit focus here.</div>}
        </section>

        <section className="tomorrow-reset-section weekly-reset-panel wide">
          <div className="tomorrow-reset-section-head"><strong>6. Reflection</strong><span>Saved into Journal</span></div>
          <div className="tomorrow-reset-reflection-grid">
            <label><span>How did last week feel?</span><textarea value={reflection.lastWeek} onChange={e => setReflection(r => ({ ...r, lastWeek: e.target.value }))} placeholder="A quick honest review." /></label>
            <label><span>What went well?</span><textarea value={reflection.wins} onChange={e => setReflection(r => ({ ...r, wins: e.target.value }))} placeholder="Wins, progress, calm moments." /></label>
            <label><span>What felt difficult?</span><textarea value={reflection.difficult} onChange={e => setReflection(r => ({ ...r, difficult: e.target.value }))} placeholder="Where did your rhythm get stretched?" /></label>
            <label><span>Mood / energy notes</span><textarea value={reflection.moodEnergy} onChange={e => setReflection(r => ({ ...r, moodEnergy: e.target.value }))} placeholder="What did your check-ins tell you?" /></label>
            <label className="wide"><span>What is the focus for next week?</span><textarea value={reflection.nextWeekFocus} onChange={e => setReflection(r => ({ ...r, nextWeekFocus: e.target.value }))} placeholder="Name the rhythm you want to build next." /></label>
          </div>
        </section>
      </div>
    </div>
  );
}

export function DailyCheckInModal({ date = TODAY, checkIn, onSave, onClose }) {
  const key = dateKey(date);
  const [mood, setMood] = useState(checkIn?.mood || "");
  const [energy, setEnergy] = useState(checkIn?.energy || "");
  const [note, setNote] = useState(checkIn?.note || "");
  const selectedMood = DAILY_CHECKIN_MOODS.find(m => m.id === mood);
  const selectedEnergy = DAILY_CHECKIN_ENERGIES.find(e => e.id === energy);
  function saveCheckIn() {
    onSave?.({ date: key, mood: mood || null, energy: energy || null, note });
    onClose?.();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Daily check-in">
      <div className="checkin-modal" onClick={e => e.stopPropagation()}>
        <div className="checkin-modal-head">
          <div>
            <div className="phase-kicker">Daily Check-in</div>
            <h2>How are you feeling today?</h2>
            <p>Mood and energy help Tempo shape a calmer plan around your real capacity.</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="checkin-section">
          <div className="checkin-section-title">Mood</div>
          <div className="checkin-option-grid mood-options-grid">
            {DAILY_CHECKIN_MOODS.map(option => (
              <button key={option.id} type="button" className={`checkin-option ${mood === option.id ? "selected" : ""}`} style={{ "--checkin-color": option.color }} onClick={() => setMood(option.id)}>
                <span className="checkin-option-emoji">{option.emoji}</span>
                <strong>{option.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="checkin-section">
          <div className="checkin-section-title">Energy</div>
          <div className="checkin-option-grid energy-options-grid">
            {DAILY_CHECKIN_ENERGIES.map(option => (
              <button key={option.id} type="button" className={`checkin-option energy ${energy === option.id ? "selected" : ""}`} onClick={() => setEnergy(option.id)}>
                <span className="checkin-option-emoji">{option.emoji}</span>
                <div><strong>{option.label}</strong><small>{option.description}</small></div>
              </button>
            ))}
          </div>
        </div>

        <div className="checkin-section">
          <div className="checkin-section-title">Note <span>optional</span></div>
          <textarea className="checkin-note-input" rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Anything affecting your rhythm today?" />
        </div>

        <div className="checkin-preview-card">
          <span>{selectedMood?.emoji || "🌿"}</span>
          <div>
            <strong>{selectedMood ? `Feeling ${selectedMood.label}` : "Mood not set yet"}{selectedEnergy ? ` · ${selectedEnergy.label} energy` : ""}</strong>
            <p>{note.trim() || "A small check-in is enough. You can always edit this later today."}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-save" disabled={!mood && !energy && !note.trim()} onClick={saveCheckIn}>{checkIn ? "Update check-in" : "Save check-in"}</button>
        </div>
      </div>
    </div>
  );
}

