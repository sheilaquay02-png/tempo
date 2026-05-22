"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, parseTimeStr, parseTimeRange, parseDur, parseDateRef, parseDateMention, parseDayWindow, fitFreeSlot, eventFromWindow, cleanTitle, inferCategory, buildGreeting, processMessage, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, CHAT_REPLY_DELAY_MS, EVENT_DRAG_HOLD_MS, CALENDARS, normalizeCalendars, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, dateRangeKeys, hasJournalEntryForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildPersonalLeaderboard, buildRhythmPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, DAILY_CHECKIN_MOODS, DAILY_CHECKIN_ENERGIES, normalizeDailyCheckIn, normalizeDailyCheckIns, dailyCheckInForDate, TOMORROW_RESET_TASK_ACTIONS, normalizeTomorrowReset, normalizeTomorrowResets, tomorrowResetForDate, WEEKLY_RESET_TASK_ACTIONS, normalizeWeeklyReset, normalizeWeeklyResets, weeklyResetForDate, AFFIRMATION_CATEGORIES, DEFAULT_AFFIRMATIONS, DEFAULT_AFFIRMATION_SETTINGS, DEFAULT_NOTIFICATION_PREFERENCES, normalizeAffirmation, normalizeAffirmations, normalizeAffirmationSettings, normalizeNotificationPreferences, normalizeSyncConflictLog, syncDatasetCounts, affirmationCategoryById, affirmationForDate, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_IMAGE_LIMIT_PER_ENTRY, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, mergeTempoData, _displayTimezone, _workStart } = Core;
import { appCSS } from "../styles/tempoStyles";
import { LoginScreen, useAuth, getSupabase, loadFromCloud, saveToCloud, saveToCloudStrict, uploadMemoryImageToStorage, uploadMemoryDataUrlToStorage, deleteMemoryStoragePaths, signMemoryImagePath, allMemoryPhotoStoragePaths, memoryPhotoNeedsStorageMigration, registerTempoPushNotifications, disableTempoPushNotifications } from "./auth/LoginScreen";
import { DayView, WeekView, MonthEventRow } from "./calendar/CalendarViews";
import { SkillStatsCard, WeeklyRecapCard, LifeGardenCard, StreaksCard, PersonalityCard } from "./bloom/BloomRoom";
import { TaskPanel, TaskModal, TasksPage } from "./tasks/Tasks";
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

function EventModal({ event, calendars, categories, onClose, onSave, onDelete, onCopy }) {
  const [form, setForm] = useState({ ...event, allDay: Boolean(event.allDay), reminder: Core.normalizeEventReminder(event.reminder) });
  const cal = calendars.find(c => c.id === form.calendar);
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
    if (!form.title.trim()) return;
    if (form.end <= form.start) return;
    const saved = await onSave({ ...form, title: form.title.trim() });
    if (saved !== false) onClose();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit event">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${form.color || cal?.color || "#FF7BAC"}` }}>
          <input className="modal-title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><label>All day</label><input type="checkbox" checked={form.allDay} onChange={e => updateAllDay(e.target.checked)}/></div>
          <div className="modal-row"><label>Start date</label><input type="date" className="modal-select" value={startDate} onChange={e => updateStartDate(e.target.value)} /></div>
          <div className="modal-row"><label>End date</label><input type="date" className="modal-select" value={endDateForInput} onChange={e => updateEndDate(e.target.value)} /></div>
          {!form.allDay && <div className="modal-row"><label>Start</label><input type="time" className="modal-select modal-time" value={toTimeInputValue(form.start)} onChange={e => setForm(f => ({ ...f, start: applyDateAndTime(toDateInput(f.start), e.target.value) }))} /><label style={{marginLeft:8}}>End</label><input type="time" className="modal-select modal-time" value={toTimeInputValue(form.end)} onChange={e => setForm(f => ({ ...f, end: applyDateAndTime(toDateInput(f.end), e.target.value) }))} /></div>}
          <div className="modal-row"><label>Calendar</label><select className="modal-select" value={form.calendar} onChange={e => setForm(f => ({ ...f, calendar: e.target.value }))}>{calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row modal-col"><label>Recurrence</label><RecurrenceEditor value={form.recurrence} startDate={form.start} onChange={recurrence => setForm(f => ({ ...f, recurrence }))} /></div>
          <div className="modal-row modal-col"><label>Reminder</label><EventReminderEditor value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} /></div>
          <div className="modal-row"><label>Fixed</label><input type="checkbox" checked={form.fixed} onChange={e => setForm(f => ({ ...f, fixed: e.target.checked }))}/><span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 6 }}>Cannot be dragged</span></div>
          <div className="modal-row"><label>Color</label><div className="color-picker">{COLORS.map(c => <button key={c} className={`color-dot ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />)}<button className="color-dot color-reset" onClick={() => setForm(f => ({ ...f, color: null }))}>↺</button></div></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." rows={3} /></div>
        </div>
        <div className="modal-footer"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="modal-delete" onClick={() => { onDelete(event.id); onClose(); }}>🗑️ Delete</button><button className="tf-cancel" onClick={() => { onCopy?.({ ...form, title: form.title.trim() || event.title }); onClose(); }}>📋 Duplicate / Copy</button></div><div style={{ display: "flex", gap: 8 }}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={saveForm}>Save changes</button></div></div>
      </div>
    </div>
  );
}

// ─── Rhythm Stats ─────────────────────────────────────────────────────────────
function pct(done, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round(done / total * 100)));
}

function dateKeySetForLast(days, endDate = TODAY) {
  return new Set(dateRangeKeys(days - 1, 0).map(String));
}

function labelForCheckIn(collection, id) {
  return collection.find(item => item.id === id)?.label || "Not set";
}

function emojiForCheckIn(collection, id) {
  return collection.find(item => item.id === id)?.emoji || "·";
}

function mostFrequentCheckIn(checkIns, key, collection) {
  const counts = new Map();
  checkIns.forEach(item => {
    const value = item?.[key];
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return { id: null, label: "Not enough data", emoji: "·", count: 0 };
  return { id: top[0], label: labelForCheckIn(collection, top[0]), emoji: emojiForCheckIn(collection, top[0]), count: top[1] };
}

function buildRhythmStatsSnapshot({ tasks = [], habits = [], habitCompletions = [], journal = {}, dailyCheckIns = [], tomorrowResets = [], weeklyResets = [], categories = CATEGORIES }) {
  const last7Keys = dateKeySetForLast(7);
  const last14Keys = dateKeySetForLast(14);
  const last30Keys = dateKeySetForLast(30);
  const last7Dates = [...last7Keys].map(k => localDateFromKey(k)).filter(Boolean);
  const last30Dates = [...last30Keys].map(k => localDateFromKey(k)).filter(Boolean);
  const activeHabits = normalizeHabits(habits).filter(h => !h.archived && !h.deletedAt);
  const cleanHabitCompletions = normalizeHabitCompletions(habitCompletions);
  const cleanCheckIns = normalizeDailyCheckIns(dailyCheckIns);
  const cleanTomorrowResets = normalizeTomorrowResets(tomorrowResets);
  const cleanWeeklyResets = normalizeWeeklyResets(weeklyResets);

  const habitScheduled7 = last7Dates.reduce((sum, d) => sum + activeHabits.filter(h => habitRunsOnDate(h, d)).length, 0);
  const habitCompleted7 = last7Dates.reduce((sum, d) => sum + activeHabits.filter(h => habitRunsOnDate(h, d) && habitProgress(h, cleanHabitCompletions, d).completed).length, 0);
  const habitStreaks = activeHabits.map(h => ({ habit: h, streak: habitStreak(h, cleanHabitCompletions, TODAY) })).sort((a, b) => b.streak - a.streak);

  const completedTasks30 = tasks.filter(t => {
    const key = taskCompletedDateKey(t);
    return t.done && key && last30Keys.has(key);
  });
  const plannedTasks30 = tasks.filter(t => {
    const anchor = taskCompletionTargetKey(t) || taskDayKey(t) || taskWeekKey(t) || taskMonthKey(t) || taskCompletedDateKey(t);
    return anchor && last30Keys.has(String(anchor).slice(0, 10));
  });
  const taskCompletionRate30 = pct(completedTasks30.length, plannedTasks30.length || completedTasks30.length);

  const journalKeys30 = Object.keys(journal || {}).filter(k => last30Keys.has(k) && hasJournalEntryForKey(journal, k));
  const checkIns14 = cleanCheckIns.filter(c => last14Keys.has(c.date));
  const checkIns30 = cleanCheckIns.filter(c => last30Keys.has(c.date));
  const topMood = mostFrequentCheckIn(checkIns14, "mood", DAILY_CHECKIN_MOODS);
  const topEnergy = mostFrequentCheckIn(checkIns14, "energy", DAILY_CHECKIN_ENERGIES);

  const weekStartKeyNow = dateKey(weekStart(TODAY));
  const currentWeeklyReset = cleanWeeklyResets.find(r => r.weekStart === weekStartKeyNow);
  const weeklyResets30 = cleanWeeklyResets.filter(r => last30Keys.has(r.weekStart));
  const tomorrowResets30 = cleanTomorrowResets.filter(r => last30Keys.has(r.date));

  const weekdayRows = [0,1,2,3,4,5,6].map(day => {
    const relevantDates = last30Dates.filter(d => d.getDay() === day);
    const keys = new Set(relevantDates.map(dateKey));
    const taskDone = completedTasks30.filter(t => keys.has(taskCompletedDateKey(t))).length;
    const habitDone = cleanHabitCompletions.filter(c => keys.has(c.date) && activeHabits.some(h => h.id === c.habitId && c.count >= Math.max(1, Number(h.targetCount || 1)))).length;
    const journalDone = Object.keys(journal || {}).filter(k => keys.has(k) && hasJournalEntryForKey(journal, k)).length;
    const checkInDone = cleanCheckIns.filter(c => keys.has(c.date)).length;
    const score = taskDone + habitDone + journalDone + checkInDone;
    return { day, label: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day], score, taskDone, habitDone, journalDone, checkInDone };
  }).sort((a, b) => b.score - a.score);
  const mostConsistentDay = weekdayRows[0]?.score ? weekdayRows[0] : null;

  const categoryRows = (categories || CATEGORIES).map(cat => {
    const total = plannedTasks30.filter(t => Core.categoryIs(t.category, cat.id)).length;
    const done = completedTasks30.filter(t => Core.categoryIs(t.category, cat.id)).length;
    return { id: cat.id, label: cat.label || cat.id, icon: cat.icon || "•", done, total, rate: pct(done, total || done) };
  }).filter(row => row.done || row.total).sort((a, b) => b.rate - a.rate || b.done - a.done).slice(0, 6);

  const rhythmMessage = (() => {
    const habitRate = pct(habitCompleted7, habitScheduled7);
    if (habitRate >= 75) return "Your habits are holding a steady rhythm.";
    if (checkIns14.length >= 4 && journalKeys30.length >= 4) return "You are building good self-awareness through check-ins and reflection.";
    if (completedTasks30.length >= 10) return "Your task rhythm is moving. A little more reset time can make it feel lighter.";
    return "A few small check-ins are enough to start seeing your rhythm clearly.";
  })();

  return {
    habitScheduled7,
    habitCompleted7,
    habitRate7: pct(habitCompleted7, habitScheduled7),
    bestHabit: habitStreaks[0] || null,
    completedTasks30: completedTasks30.length,
    plannedTasks30: plannedTasks30.length,
    taskCompletionRate30,
    journalEntries30: journalKeys30.length,
    checkIns30: checkIns30.length,
    topMood,
    topEnergy,
    currentWeeklyReset: Boolean(currentWeeklyReset),
    weeklyResetCount30: weeklyResets30.length,
    tomorrowResetCount30: tomorrowResets30.length,
    mostConsistentDay,
    categoryRows,
    rhythmMessage,
  };
}

function RhythmMeter({ label, value, detail }) {
  return (
    <div className="rhythm-meter">
      <div className="rhythm-meter-top"><strong>{label}</strong><span>{value}%</span></div>
      <div className="rhythm-meter-track"><i style={{ width: `${value}%` }} /></div>
      {detail && <p>{detail}</p>}
    </div>
  );
}

function RhythmStatsPage({ events, tasks, habits = [], habitCompletions = [], journal = {}, dailyCheckIns = [], tomorrowResets = [], weeklyResets = [], categories = CATEGORIES, gameStats }) {
  const stats = buildRhythmStatsSnapshot({ tasks, habits, habitCompletions, journal, dailyCheckIns, tomorrowResets, weeklyResets, categories });
  return (
    <div className="rhythm-stats-page phase-page">
      <div className="phase-hero rhythm-stats-hero">
        <div>
          <div className="phase-kicker">Rhythm Stats</div>
          <h1>📊 Your rhythm at a glance</h1>
          <p>Here’s how your rhythm is building — gently, without judgement.</p>
        </div>
      </div>

      <div className="stats-card rhythm-stats-card rhythm-stats-card-page">
        <div className="rhythm-insight-card">{stats.rhythmMessage}</div>

        <div className="stats-row rhythm-stat-grid">
          <div className="stat-big"><div className="stat-num">{stats.habitRate7}%</div><div className="stat-lbl">Habit consistency</div></div>
          <div className="stat-big"><div className="stat-num">{stats.taskCompletionRate30}%</div><div className="stat-lbl">Task completion</div></div>
          <div className="stat-big"><div className="stat-num">{stats.journalEntries30}</div><div className="stat-lbl">Journal entries</div></div>
        </div>

        <div className="rhythm-stats-split">
          <div className="rhythm-mini-panel">
            <div className="rhythm-section-title">Mood & energy</div>
            <div className="rhythm-chip-row"><span>{stats.topMood.emoji}</span><strong>{stats.topMood.label}</strong><small>Most common mood, 14 days</small></div>
            <div className="rhythm-chip-row"><span>{stats.topEnergy.emoji}</span><strong>{stats.topEnergy.label}</strong><small>Most common energy, 14 days</small></div>
            <p>{stats.checkIns30} check-in{stats.checkIns30 === 1 ? "" : "s"} in the last 30 days.</p>
          </div>
          <div className="rhythm-mini-panel">
            <div className="rhythm-section-title">Resets</div>
            <div className="rhythm-chip-row"><span>{stats.currentWeeklyReset ? "🧺" : "🌱"}</span><strong>{stats.currentWeeklyReset ? "Weekly reset done" : "Weekly reset ready"}</strong><small>This week</small></div>
            <div className="rhythm-chip-row"><span>🌙</span><strong>{stats.tomorrowResetCount30}</strong><small>Tomorrow resets, 30 days</small></div>
            <p>{stats.weeklyResetCount30} weekly reset{stats.weeklyResetCount30 === 1 ? "" : "s"} saved in the last 30 days.</p>
          </div>
        </div>

        <div className="rhythm-stats-split">
          <div className="rhythm-mini-panel">
            <div className="rhythm-section-title">Best habit streak</div>
            {stats.bestHabit ? <div className="rhythm-chip-row"><span>{stats.bestHabit.habit.emoji}</span><strong>{stats.bestHabit.habit.name}</strong><small>{stats.bestHabit.streak} day streak</small></div> : <p>No habit streak yet. Start with one small habit.</p>}
          </div>
          <div className="rhythm-mini-panel">
            <div className="rhythm-section-title">Most consistent day</div>
            {stats.mostConsistentDay ? <div className="rhythm-chip-row"><span>🗓️</span><strong>{stats.mostConsistentDay.label}</strong><small>{stats.mostConsistentDay.score} gentle check-ins</small></div> : <p>Not enough rhythm data yet.</p>}
          </div>
        </div>

        <div className="rhythm-stats-split rhythm-type-stats-row">
          <SkillStatsCard gameStats={gameStats} />
          <PersonalityCard gameStats={gameStats} />
        </div>

        <div className="rhythm-stats-split rhythm-stats-game-grid">
          <WeeklyRecapCard gameStats={gameStats} />
          <StreaksCard gameStats={gameStats} />
        </div>

        <div className="rhythm-stats-split rhythm-life-category-row">
          <LifeGardenCard gameStats={gameStats} />
          <div className="rhythm-stats-section rhythm-category-panel">
            <div className="rhythm-section-title">Completion by category</div>
            {stats.categoryRows.length ? <div className="rhythm-category-list">
              {stats.categoryRows.map(row => (
                <div key={row.id} className="rhythm-category-row">
                  <span>{row.icon} {row.label}</span>
                  <div className="rhythm-category-track"><i style={{ width: `${row.rate}%` }} /></div>
                  <strong>{row.done}/{row.total || row.done}</strong>
                </div>
              ))}
            </div> : <p className="stats-mini-note">No completed task categories yet. This will fill in as you use Tempo.</p>}
          </div>
        </div>

        <div className="stats-mini-note">No judgement here — these numbers are only here to help you understand what rhythm supports you best.</div>
      </div>
    </div>
  );
}

// ─── Tomorrow Reset ───────────────────────────────────────────────────────────
function taskFallsOnDateForReset(task, targetDate = TODAY) {
  if (!task || task.done) return false;
  if (taskBelongsToPeriod(task, "day", targetDate)) return true;
  const targetKey = dateKey(targetDate);
  const scheduledStart = task.scheduledStart ? new Date(task.scheduledStart) : null;
  if (scheduledStart && !Number.isNaN(scheduledStart.getTime()) && dateKey(scheduledStart) === targetKey) return true;
  if (task.scheduled && String(task.scheduled).slice(0, 10) === targetKey) return true;
  if (task.deadline && String(task.deadline).slice(0, 10) === targetKey && taskScopeOf(task) === "day") return true;
  return false;
}

function TomorrowResetPage({ tasks, latestReset = null, gameStats, onCompleteReset, onBack }) {
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
function CarryOverPrompt(props) {
  return <TomorrowResetPage {...props} />;
}


function WeeklyResetPage({ tasks = [], events = [], habits = [], dailyCheckIns = [], latestReset = null, onCompleteReset }) {
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

// ─── Shortcuts Modal ──────────────────────────────────────────────────────────
function ShortcutsModal({ onClose }) {
  const sc = [["D","Day view"],["W","Week view"],["M","Month view"],["J","Journal"],["C","Create event"],["T","Create task"],["A","Open assistant"],["S","Settings"],["/ or ⌘K","Search"],["?","Shortcuts"],["Cmd+Z","Undo"],["Esc","Close / Back"]];
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span style={{ fontWeight: 800 }}>⌨️ Keyboard Shortcuts</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="shortcuts-grid">{sc.map(([k, v]) => <div key={k} className="shortcut-row"><kbd className="kbd">{k}</kbd><span>{v}</span></div>)}</div>
      </div>
    </div>
  );
}

// ─── Scheduling / Meal Break Helpers ─────────────────────────────────────────
const DEFAULT_MEAL_BREAKS = [
  { id: "breakfast", label: "Breakfast", start: "08:00", end: "09:00", enabled: true },
  { id: "lunch", label: "Lunch", start: "12:00", end: "13:00", enabled: true },
  { id: "dinner", label: "Dinner", start: "18:00", end: "19:00", enabled: true },
];

const DEFAULT_PLANNING_RULES = {
  bufferMinutes: 10,
  maxPlanMinutes: 300,
  maxDeepWorkBlocks: 3,
  afterMealBufferMinutes: 15,
};

const PLANNING_MODES = [
  { id: "light", label: "Light Day", emoji: "🕊️", desc: "Fewer tasks, more breathing room.", maxPlanMinutes: 150, maxDeepWorkBlocks: 1, bufferBonus: 10 },
  { id: "normal", label: "Normal Day", emoji: "🌤️", desc: "Balanced plan for a steady day.", maxPlanMinutes: 300, maxDeepWorkBlocks: 3, bufferBonus: 0 },
  { id: "productive", label: "Productive Day", emoji: "⚡", desc: "Use extra energy for important work.", maxPlanMinutes: 420, maxDeepWorkBlocks: 4, bufferBonus: 0 },
];

const DEFAULT_RITUALS = [
  {
    id: "ritual-morning-reset",
    name: "Morning Reset",
    templateId: "morning-reset",
    emoji: "☀️",
    category: "morning",
    steps: [
      { id: "drink-water", text: "Drink water" },
      { id: "check-calendar", text: "Check today’s calendar" },
      { id: "top-3", text: "Choose your top 3 tasks" },
      { id: "intention", text: "Write one simple intention" },
    ],
    estimatedMinutes: 15,
    scheduledTime: "08:30",
    repeatDays: [1,2,3,4,5],
    reminder: { type: "at", minutesBefore: 0 },
    color: "#FFB870",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ritual-night-wind-down",
    name: "Night Wind Down",
    templateId: "night-wind-down",
    emoji: "🌙",
    category: "night",
    steps: [
      { id: "review-day", text: "Review what got done" },
      { id: "move-tasks", text: "Move unfinished tasks" },
      { id: "prepare-tomorrow", text: "Prepare tomorrow’s main thing" },
      { id: "gratitude", text: "Write one gratitude" },
    ],
    estimatedMinutes: 20,
    scheduledTime: "21:30",
    repeatDays: [0,1,2,3,4,5,6],
    reminder: { type: "at", minutesBefore: 0 },
    color: "#B08AE0",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const RITUAL_TEMPLATES = [
  {
    id: "morning-reset",
    name: "Morning Reset",
    emoji: "☀️",
    category: "morning",
    description: "Start the day with water, calendar clarity, and one simple intention.",
    steps: ["Drink water", "Make your space feel tidy", "Check today’s calendar", "Choose your top 3 tasks", "Write one simple intention"],
    estimatedMinutes: 15,
    scheduledTime: "08:30",
    repeatDays: [1,2,3,4,5],
    reminder: { type: "at", minutesBefore: 0 },
    color: "#FFB870",
  },
  {
    id: "night-wind-down",
    name: "Night Wind Down",
    emoji: "🌙",
    category: "night",
    description: "Close the day gently and make tomorrow feel lighter before sleep.",
    steps: ["Review what got done", "Move unfinished tasks", "Prepare tomorrow’s main thing", "Write one gratitude", "Put your phone away"],
    estimatedMinutes: 20,
    scheduledTime: "21:30",
    repeatDays: [0,1,2,3,4,5,6],
    reminder: { type: "at", minutesBefore: 0 },
    color: "#B08AE0",
  },
  {
    id: "sunday-reset",
    name: "Sunday Reset",
    emoji: "🧺",
    category: "reset",
    description: "Reset your space, tasks, and weekly priorities before the new week starts.",
    steps: ["Review last week", "Clear unfinished tasks", "Choose weekly priorities", "Plan key events", "Write a weekly intention"],
    estimatedMinutes: 35,
    scheduledTime: "17:00",
    repeatDays: [0],
    reminder: { type: "minutes", minutesBefore: 30 },
    color: "#FF9F9F",
  },
  {
    id: "workday-start",
    name: "Workday Start",
    emoji: "💼",
    category: "work",
    description: "A calm launch routine for email, priorities, and first action of the workday.",
    steps: ["Check calendar", "Review inbox lightly", "Pick today’s main thing", "Schedule important tasks", "Start the first action"],
    estimatedMinutes: 20,
    scheduledTime: "09:30",
    repeatDays: [1,2,3,4,5],
    reminder: { type: "at", minutesBefore: 0 },
    color: "#7CBAFF",
  },
  {
    id: "study-reset",
    name: "Study Reset",
    emoji: "📚",
    category: "personal",
    description: "Prepare your desk, notes, and plan before a focused study block.",
    steps: ["Clear your desk", "Open the right notes", "Write what you are studying", "Set one target", "Put distractions away"],
    estimatedMinutes: 10,
    scheduledTime: "16:00",
    repeatDays: [1,2,3,4,5],
    reminder: { type: "none", minutesBefore: null },
    color: "#C9A0FF",
  },
  {
    id: "room-reset",
    name: "Room Reset",
    emoji: "🏡",
    category: "home",
    description: "A quick tidy-up ritual to make your room feel clean and peaceful again.",
    steps: ["Make the bed", "Clear visible clutter", "Put clothes away", "Wipe one surface", "Lightly reset the floor"],
    estimatedMinutes: 25,
    scheduledTime: "19:30",
    repeatDays: [2,4,6],
    reminder: { type: "none", minutesBefore: null },
    color: "#70C8A0",
  },
  {
    id: "digital-declutter",
    name: "Digital Declutter",
    emoji: "📱",
    category: "reset",
    description: "Clear digital noise so your phone and laptop feel lighter.",
    steps: ["Clear old notifications", "Close unused tabs", "Delete 5 unnecessary screenshots", "Review downloads", "Archive completed messages"],
    estimatedMinutes: 20,
    scheduledTime: "20:00",
    repeatDays: [3],
    reminder: { type: "none", minutesBefore: null },
    color: "#7EC8C8",
  },
  {
    id: "weekly-planning",
    name: "Weekly Planning",
    emoji: "🗓️",
    category: "work",
    description: "Turn your week into a clear plan before it gets crowded.",
    steps: ["Check major events", "Pick three priorities", "Block important work", "Review deadlines", "Choose one personal reset"],
    estimatedMinutes: 30,
    scheduledTime: "18:00",
    repeatDays: [0],
    reminder: { type: "minutes", minutesBefore: 30 },
    color: "#FF7BAC",
  },
  {
    id: "meal-prep-reset",
    name: "Meal Prep Reset",
    emoji: "🍱",
    category: "wellness",
    description: "Plan simple meals and reduce weekday decision fatigue.",
    steps: ["Check what food you have", "Pick simple meals", "Write a short grocery list", "Prep one easy item", "Clean the prep area"],
    estimatedMinutes: 35,
    scheduledTime: "11:00",
    repeatDays: [0],
    reminder: { type: "none", minutesBefore: null },
    color: "#FFB870",
  },
  {
    id: "clean-desk-reset",
    name: "Clean Desk Reset",
    emoji: "🪷",
    category: "home",
    description: "Reset your workspace so it feels clear before the next task.",
    steps: ["Remove cups and wrappers", "Stack loose papers", "Put tools back", "Wipe the desk", "Open only what you need next"],
    estimatedMinutes: 10,
    scheduledTime: "14:00",
    repeatDays: [1,2,3,4,5],
    reminder: { type: "none", minutesBefore: null },
    color: "#F4A6C7",
  },
];

const RITUAL_CATEGORIES = [
  { id: "morning", label: "Morning", emoji: "☀️" },
  { id: "night", label: "Night", emoji: "🌙" },
  { id: "reset", label: "Reset", emoji: "🧺" },
  { id: "wellness", label: "Wellness", emoji: "🌿" },
  { id: "work", label: "Work", emoji: "💼" },
  { id: "home", label: "Home", emoji: "🏡" },
  { id: "personal", label: "Personal", emoji: "✨" },
];

const RITUAL_REMINDER_PRESETS = [
  { id: "none", label: "No reminder", minutesBefore: null },
  { id: "at", label: "At ritual time", minutesBefore: 0 },
  { id: "5", label: "5 minutes before", minutesBefore: 5 },
  { id: "10", label: "10 minutes before", minutesBefore: 10 },
  { id: "30", label: "30 minutes before", minutesBefore: 30 },
  { id: "custom", label: "Custom", minutesBefore: 15 },
];

const DEFAULT_HABITS = [
  {
    id: "habit-journal",
    name: "Journal",
    emoji: "📓",
    category: "mindset",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "entry",
    reminder: { type: "evening", time: "21:00" },
    archived: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "habit-plan-tomorrow",
    name: "Plan tomorrow",
    emoji: "🌙",
    category: "planning",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "check-in",
    reminder: { type: "evening", time: "20:30" },
    archived: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "habit-tidy-space",
    name: "Tidy space",
    emoji: "🧺",
    category: "home",
    frequency: "weekdays",
    repeatDays: [1,2,3,4,5],
    targetCount: 1,
    unit: "reset",
    reminder: { type: "none", time: "" },
    archived: false,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const HABIT_TEMPLATES = [
  {
    id: "drink-water",
    name: "Drink water",
    emoji: "💧",
    category: "wellness",
    description: "A gentle daily hydration check-in that is easy to keep consistent.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 3,
    unit: "glasses",
    reminder: { type: "morning", time: "09:00" },
  },
  {
    id: "journal",
    name: "Journal",
    emoji: "📓",
    category: "mindset",
    description: "Write a quick reflection so the day feels more intentional.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "entry",
    reminder: { type: "evening", time: "21:00" },
  },
  {
    id: "stretch",
    name: "Stretch",
    emoji: "🧘",
    category: "wellness",
    description: "A light reset for your body between work, study, or errands.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "session",
    reminder: { type: "afternoon", time: "15:00" },
  },
  {
    id: "read-10-minutes",
    name: "Read 10 minutes",
    emoji: "📖",
    category: "learning",
    description: "A small reading habit that feels achievable even on busy days.",
    frequency: "weekdays",
    repeatDays: [1,2,3,4,5],
    targetCount: 1,
    unit: "reading block",
    reminder: { type: "evening", time: "20:30" },
  },
  {
    id: "walk",
    name: "Walk",
    emoji: "🚶",
    category: "wellness",
    description: "A simple movement habit to add air and space into your day.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "walk",
    reminder: { type: "afternoon", time: "17:30" },
  },
  {
    id: "plan-tomorrow",
    name: "Plan tomorrow",
    emoji: "🌙",
    category: "planning",
    description: "Close the day by making tomorrow feel lighter before it starts.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "check-in",
    reminder: { type: "evening", time: "20:30" },
  },
  {
    id: "tidy-room",
    name: "Tidy room",
    emoji: "🧺",
    category: "home",
    description: "A quick space reset so your room feels calmer and cleaner.",
    frequency: "weekdays",
    repeatDays: [1,2,3,4,5],
    targetCount: 1,
    unit: "reset",
    reminder: { type: "none", time: "" },
  },
  {
    id: "gratitude",
    name: "Gratitude",
    emoji: "🌷",
    category: "mindset",
    description: "Write one small thing you appreciated today.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "note",
    reminder: { type: "evening", time: "21:15" },
  },
  {
    id: "sleep-routine",
    name: "Sleep routine",
    emoji: "🛏️",
    category: "wellness",
    description: "A gentle reminder to wind down and protect your rest window.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "wind down",
    reminder: { type: "evening", time: "22:00" },
  },
  {
    id: "no-phone-before-bed",
    name: "No phone before bed",
    emoji: "📵",
    category: "wellness",
    description: "Create a calmer night by putting the phone away before sleep.",
    frequency: "daily",
    repeatDays: [0,1,2,3,4,5,6],
    targetCount: 1,
    unit: "night",
    reminder: { type: "evening", time: "21:45" },
  },
];

const HABIT_CATEGORIES = [
  { id: "mindset", label: "Mindset", emoji: "🌸" },
  { id: "wellness", label: "Wellness", emoji: "🌿" },
  { id: "planning", label: "Planning", emoji: "🗓️" },
  { id: "home", label: "Home", emoji: "🧺" },
  { id: "learning", label: "Learning", emoji: "📚" },
  { id: "personal", label: "Personal", emoji: "✨" },
];

const HABIT_REMINDER_PRESETS = [
  { id: "none", label: "No reminder", time: "" },
  { id: "morning", label: "Morning", time: "09:00" },
  { id: "afternoon", label: "Afternoon", time: "13:00" },
  { id: "evening", label: "Evening", time: "20:00" },
  { id: "custom", label: "Custom time", time: "09:00" },
];

function normalizeRitualReminder(reminder) {
  if (reminder === null) return { type: "none", minutesBefore: null };
  if (typeof reminder === "number") return reminder < 0 ? { type: "none", minutesBefore: null } : { type: "minutes", minutesBefore: reminder };
  if (!reminder) return { type: "at", minutesBefore: 0 };
  const type = reminder.type || reminder.mode || reminder.id || "at";
  if (type === "none") return { type: "none", minutesBefore: null };
  if (type === "at") return { type: "at", minutesBefore: 0 };
  const minutes = Number(reminder.minutesBefore ?? reminder.minutes ?? reminder.offsetMinutes ?? reminder.value ?? 15);
  return { type: type === "custom" ? "custom" : "minutes", minutesBefore: Math.max(0, Number.isFinite(minutes) ? minutes : 15) };
}

function ritualReminderPresetId(reminder) {
  const r = normalizeRitualReminder(reminder);
  if (r.type === "none") return "none";
  if (r.minutesBefore === 0) return "at";
  const match = RITUAL_REMINDER_PRESETS.find(p => p.minutesBefore === r.minutesBefore && !["custom", "none", "at"].includes(p.id));
  return match?.id || "custom";
}

function normalizeRitualStep(step, index = 0) {
  if (typeof step === "string") return { id: `step-${index + 1}`, text: step.trim() || `Step ${index + 1}` };
  return {
    id: String(step?.id || `step-${index + 1}`).trim() || `step-${index + 1}`,
    text: String(step?.text || step?.label || `Step ${index + 1}`).trim() || `Step ${index + 1}`,
  };
}

function normalizeRitual(ritual, index = 0) {
  const now = new Date().toISOString();
  const fallback = DEFAULT_RITUALS[index % DEFAULT_RITUALS.length] || DEFAULT_RITUALS[0];
  const repeatDays = Array.isArray(ritual?.repeatDays) ? ritual.repeatDays.map(Number).filter(d => d >= 0 && d <= 6) : (fallback?.repeatDays || [1,2,3,4,5]);
  const rawSteps = Array.isArray(ritual?.steps) && ritual.steps.length ? ritual.steps : (fallback?.steps || []);
  return {
    id: String(ritual?.id || `ritual-${uid()}`),
    name: String(ritual?.name || fallback?.name || "New Ritual").trim() || "New Ritual",
    templateId: ritual?.templateId ? String(ritual.templateId) : (fallback?.templateId ? String(fallback.templateId) : null),
    emoji: String(ritual?.emoji || fallback?.emoji || "🕯️").trim() || "🕯️",
    category: String(ritual?.category || fallback?.category || "personal"),
    steps: rawSteps.map(normalizeRitualStep),
    estimatedMinutes: Math.max(1, Math.min(360, Number(ritual?.estimatedMinutes || ritual?.duration || fallback?.estimatedMinutes || 15))),
    scheduledTime: validTimeString(ritual?.scheduledTime || ritual?.time || fallback?.scheduledTime || "08:30", "08:30"),
    repeatDays: repeatDays.length ? [...new Set(repeatDays)].sort((a,b) => a-b) : [1,2,3,4,5],
    reminder: normalizeRitualReminder(ritual?.reminder ?? fallback?.reminder),
    color: /^#[0-9a-f]{6}$/i.test(String(ritual?.color || "")) ? ritual.color : (fallback?.color || "#FF7BAC"),
    archived: Boolean(ritual?.archived),
    deletedAt: ritual?.deletedAt || null,
    createdAt: ritual?.createdAt || now,
    updatedAt: ritual?.updatedAt || ritual?.createdAt || now,
  };
}

function ritualNameWithCopySuffix(name, rituals = []) {
  const base = String(name || "New Ritual").trim() || "New Ritual";
  const names = new Set(normalizeRituals(rituals).map(r => String(r.name || "").trim().toLowerCase()).filter(Boolean));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} ${i}`.toLowerCase())) i += 1;
  return `${base} ${i}`;
}

function ritualFromTemplate(template, rituals = []) {
  const now = new Date().toISOString();
  return normalizeRitual({
    id: `ritual-${template.id}-${uid()}`,
    templateId: template.id,
    name: ritualNameWithCopySuffix(template.name, rituals),
    emoji: template.emoji,
    category: template.category,
    steps: (template.steps || []).map((text, i) => ({ id: `step-${i + 1}-${uid()}`, text })),
    estimatedMinutes: template.estimatedMinutes,
    scheduledTime: template.scheduledTime,
    repeatDays: template.repeatDays,
    reminder: template.reminder,
    color: template.color,
    archived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

function normalizeRituals(value) {
  const source = Array.isArray(value) ? value : DEFAULT_RITUALS;
  const seen = new Set();
  return source.map(normalizeRitual).filter(r => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return !r.deletedAt;
  });
}

function normalizeRitualCompletion(completion) {
  const now = new Date().toISOString();
  return {
    id: String(completion?.id || `${completion?.ritualId || "ritual"}:${completion?.date || dateKey(TODAY)}`),
    ritualId: String(completion?.ritualId || ""),
    date: String(completion?.date || dateKey(TODAY)),
    completedSteps: Array.isArray(completion?.completedSteps) ? completion.completedSteps.map(String) : [],
    completedAt: completion?.completedAt || null,
    skippedAt: completion?.skippedAt || null,
    note: String(completion?.note || ""),
    createdAt: completion?.createdAt || now,
    updatedAt: completion?.updatedAt || completion?.createdAt || now,
  };
}

function normalizeRitualCompletions(value) {
  const source = Array.isArray(value) ? value : [];
  const map = new Map();
  source.map(normalizeRitualCompletion).filter(c => c.ritualId && c.date).forEach(c => {
    const prev = map.get(c.id);
    if (!prev || new Date(c.updatedAt || 0) >= new Date(prev.updatedAt || 0)) map.set(c.id, c);
  });
  return [...map.values()];
}

function ritualRunsOnDate(ritual, date = TODAY) {
  if (!ritual || ritual.archived || ritual.deletedAt) return false;
  const repeatDays = Array.isArray(ritual.repeatDays) ? ritual.repeatDays.map(Number) : [];
  return repeatDays.includes(dayStart(date).getDay());
}

function ritualCompletionFor(completions, ritualId, date = TODAY) {
  const key = dateKey(date);
  return (Array.isArray(completions) ? completions : []).find(c => c.ritualId === ritualId && c.date === key) || null;
}

function ritualProgress(ritual, completions, date = TODAY) {
  const completion = ritualCompletionFor(completions, ritual.id, date);
  const total = Math.max(1, ritual.steps?.length || 0);
  const done = completion?.skippedAt ? 0 : (completion?.completedSteps || []).filter(id => ritual.steps.some(s => s.id === id)).length;
  return { completion, done, total, percent: Math.min(100, Math.round(done / total * 100)), completed: Boolean(completion?.completedAt), skipped: Boolean(completion?.skippedAt) };
}

function habitRepeatDaysFromFrequency(frequency, repeatDays) {
  if (Array.isArray(repeatDays) && repeatDays.length) return [...new Set(repeatDays.map(Number).filter(d => d >= 0 && d <= 6))].sort((a,b) => a-b);
  if (frequency === "weekdays") return [1,2,3,4,5];
  if (frequency === "weekends") return [0,6];
  return [0,1,2,3,4,5,6];
}

function normalizeHabitReminder(reminder) {
  if (reminder === null) return { type: "none", time: "" };
  if (typeof reminder === "string") {
    const preset = HABIT_REMINDER_PRESETS.find(p => p.id === reminder);
    if (preset) return { type: preset.id, time: preset.time };
    return /^\d{2}:\d{2}$/.test(reminder) ? { type: "custom", time: reminder } : { type: "none", time: "" };
  }
  if (!reminder) return { type: "none", time: "" };
  const type = reminder.type || reminder.mode || reminder.id || "none";
  if (type === "none") return { type: "none", time: "" };
  const preset = HABIT_REMINDER_PRESETS.find(p => p.id === type);
  return { type: preset ? preset.id : "custom", time: validTimeString(reminder.time || preset?.time || "09:00", preset?.time || "09:00") };
}

function habitReminderPresetId(reminder) {
  const r = normalizeHabitReminder(reminder);
  if (r.type === "none") return "none";
  if (["morning", "afternoon", "evening"].includes(r.type)) return r.type;
  return "custom";
}

function normalizeHabit(habit, index = 0) {
  const now = new Date().toISOString();
  const fallback = DEFAULT_HABITS[index % DEFAULT_HABITS.length] || DEFAULT_HABITS[0];
  const frequency = ["daily", "weekdays", "weekends", "custom"].includes(habit?.frequency) ? habit.frequency : (fallback?.frequency || "daily");
  const repeatDays = habitRepeatDaysFromFrequency(frequency, habit?.repeatDays ?? fallback?.repeatDays);
  const target = Math.max(1, Math.min(20, Number(habit?.targetCount || habit?.target || fallback?.targetCount || 1)));
  return {
    id: String(habit?.id || `habit-${uid()}`),
    name: String(habit?.name || fallback?.name || "New Habit").trim() || "New Habit",
    templateId: habit?.templateId ? String(habit.templateId) : (fallback?.templateId ? String(fallback.templateId) : null),
    emoji: String(habit?.emoji || fallback?.emoji || "🌱").trim() || "🌱",
    category: String(habit?.category || fallback?.category || "personal"),
    frequency,
    repeatDays: repeatDays.length ? repeatDays : [0,1,2,3,4,5,6],
    targetCount: target,
    unit: String(habit?.unit || fallback?.unit || (target > 1 ? "times" : "check-in")).trim() || "check-in",
    reminder: normalizeHabitReminder(habit?.reminder ?? fallback?.reminder),
    archived: Boolean(habit?.archived),
    deletedAt: habit?.deletedAt || null,
    createdAt: habit?.createdAt || now,
    updatedAt: habit?.updatedAt || habit?.createdAt || now,
  };
}

function normalizeHabits(value) {
  const source = Array.isArray(value) ? value : DEFAULT_HABITS;
  const seen = new Set();
  return source.map(normalizeHabit).filter(h => {
    if (!h.id || seen.has(h.id)) return false;
    seen.add(h.id);
    return !h.deletedAt;
  });
}

function habitNameWithCopySuffix(name, habits = []) {
  const base = String(name || "New Habit").trim() || "New Habit";
  const names = new Set(normalizeHabits(habits).map(h => String(h.name || "").trim().toLowerCase()).filter(Boolean));
  if (!names.has(base.toLowerCase())) return base;
  let i = 2;
  while (names.has(`${base} ${i}`.toLowerCase())) i += 1;
  return `${base} ${i}`;
}

function habitFromTemplate(template, habits = []) {
  const now = new Date().toISOString();
  return normalizeHabit({
    id: `habit-${template.id}-${uid()}`,
    templateId: template.id,
    name: habitNameWithCopySuffix(template.name, habits),
    emoji: template.emoji,
    category: template.category,
    frequency: template.frequency,
    repeatDays: template.repeatDays,
    targetCount: template.targetCount,
    unit: template.unit,
    reminder: template.reminder,
    archived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

function normalizeHabitCompletion(completion) {
  const now = new Date().toISOString();
  const count = Math.max(0, Math.min(999, Number(completion?.count || (completion?.completedAt ? 1 : 0)) || 0));
  return {
    id: String(completion?.id || `${completion?.habitId || "habit"}:${completion?.date || dateKey(TODAY)}`),
    habitId: String(completion?.habitId || ""),
    date: String(completion?.date || dateKey(TODAY)),
    count,
    completedAt: completion?.completedAt || (count > 0 ? now : null),
    note: String(completion?.note || ""),
    createdAt: completion?.createdAt || now,
    updatedAt: completion?.updatedAt || completion?.createdAt || now,
  };
}

function normalizeHabitCompletions(value) {
  const source = Array.isArray(value) ? value : [];
  const map = new Map();
  source.map(normalizeHabitCompletion).filter(c => c.habitId && c.date).forEach(c => {
    const prev = map.get(c.id);
    if (!prev || new Date(c.updatedAt || 0) >= new Date(prev.updatedAt || 0)) map.set(c.id, c);
  });
  return [...map.values()];
}

function habitRunsOnDate(habit, date = TODAY) {
  if (!habit || habit.archived || habit.deletedAt) return false;
  const days = Array.isArray(habit.repeatDays) ? habit.repeatDays.map(Number) : [0,1,2,3,4,5,6];
  return days.includes(dayStart(date).getDay());
}

function habitCompletionFor(completions, habitId, date = TODAY) {
  const key = dateKey(date);
  return (Array.isArray(completions) ? completions : []).find(c => c.habitId === habitId && c.date === key) || null;
}

function habitProgress(habit, completions, date = TODAY) {
  const completion = habitCompletionFor(completions, habit.id, date);
  const target = Math.max(1, Number(habit.targetCount || 1));
  const count = Math.max(0, Number(completion?.count || 0));
  const completed = count >= target;
  return { completion, count, target, percent: Math.min(100, Math.round(count / target * 100)), completed };
}

function habitStreak(habit, completions, fromDate = TODAY) {
  const all = normalizeHabitCompletions(completions);
  let streak = 0;
  let cursor = dayStart(fromDate);
  for (let i = 0; i < 370; i++) {
    if (!habitRunsOnDate(habit, cursor)) { cursor = addDaysSafe(cursor, -1); continue; }
    const progress = habitProgress(habit, all, cursor);
    if (!progress.completed) break;
    streak += 1;
    cursor = addDaysSafe(cursor, -1);
  }
  return streak;
}

function weekDatesFor(date = TODAY) {
  return weekDays(weekStart(date));
}

function normalizePlanningRules(value) {
  const source = value && typeof value === "object" ? value : {};
  const clamp = (v, min, max, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fb;
  };
  return {
    bufferMinutes: clamp(source.bufferMinutes, 0, 60, DEFAULT_PLANNING_RULES.bufferMinutes),
    maxPlanMinutes: clamp(source.maxPlanMinutes, 30, 720, DEFAULT_PLANNING_RULES.maxPlanMinutes),
    maxDeepWorkBlocks: clamp(source.maxDeepWorkBlocks, 0, 12, DEFAULT_PLANNING_RULES.maxDeepWorkBlocks),
    afterMealBufferMinutes: clamp(source.afterMealBufferMinutes, 0, 90, DEFAULT_PLANNING_RULES.afterMealBufferMinutes),
  };
}

function normalizePlanningMode(mode) {
  return PLANNING_MODES.some(m => m.id === mode) ? mode : "normal";
}

function planningModeForEnergy(energy) {
  if (energy === "low") return "light";
  if (energy === "high") return "productive";
  return "normal";
}

function planningModeMeta(mode) {
  return PLANNING_MODES.find(m => m.id === normalizePlanningMode(mode)) || PLANNING_MODES[1];
}

function applyPlanningModeToRules(baseRules, mode, energy) {
  const base = normalizePlanningRules(baseRules);
  const meta = planningModeMeta(mode);
  const energyBuffer = energy === "low" ? 10 : 0;
  const energyCapacityTrim = energy === "low" ? 30 : 0;
  const energyCapacityBonus = energy === "high" && meta.id === "productive" ? 30 : 0;
  return normalizePlanningRules({
    ...base,
    bufferMinutes: Math.min(60, base.bufferMinutes + (meta.bufferBonus || 0) + energyBuffer),
    maxPlanMinutes: Math.min(base.maxPlanMinutes, meta.maxPlanMinutes) - energyCapacityTrim + energyCapacityBonus,
    maxDeepWorkBlocks: Math.min(base.maxDeepWorkBlocks, meta.maxDeepWorkBlocks),
  });
}

function normalizeSettingsUpdatedAt(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeDeletedRecords(value) {
  const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const cleanKind = obj => Object.fromEntries(Object.entries(obj || {}).filter(([id, ts]) => id && ts));
  return {
    events: cleanKind(src.events),
    tasks: cleanKind(src.tasks),
    calendars: cleanKind(src.calendars),
    rituals: cleanKind(src.rituals),
    ritualCompletions: cleanKind(src.ritualCompletions),
    habits: cleanKind(src.habits),
    habitCompletions: cleanKind(src.habitCompletions),
    dailyCheckIns: cleanKind(src.dailyCheckIns),
    tomorrowResets: cleanKind(src.tomorrowResets),
    weeklyResets: cleanKind(src.weeklyResets),
    affirmations: cleanKind(src.affirmations),
  };
}

function addDeletedRecords(records, kind, ids, timestamp = new Date().toISOString()) {
  const current = normalizeDeletedRecords(records);
  const next = {
    events: { ...current.events },
    tasks: { ...current.tasks },
    calendars: { ...current.calendars },
    rituals: { ...current.rituals },
    ritualCompletions: { ...current.ritualCompletions },
    habits: { ...current.habits },
    habitCompletions: { ...current.habitCompletions },
    dailyCheckIns: { ...current.dailyCheckIns },
    tomorrowResets: { ...current.tomorrowResets },
    weeklyResets: { ...current.weeklyResets },
    affirmations: { ...current.affirmations },
  };
  const allowed = new Set(Object.keys(next));
  const bucket = allowed.has(kind) ? kind : (kind === "tasks" ? "tasks" : kind === "calendars" ? "calendars" : kind === "rituals" ? "rituals" : kind === "habits" ? "habits" : kind === "affirmations" ? "affirmations" : "events");
  (Array.isArray(ids) ? ids : [ids]).filter(Boolean).forEach(id => { next[bucket][id] = timestamp; });
  return next;
}

function filterActiveRecords(records) {
  return Array.isArray(records) ? records.filter(r => !r?.deletedAt) : [];
}

function validTimeString(value, fallback = "00:00") {
  return /^\d{2}:\d{2}$/.test(String(value || "")) ? value : fallback;
}

function timeStringToMinutes(value) {
  const [h, m] = validTimeString(value).split(":").map(Number);
  return Math.max(0, Math.min(24 * 60, h * 60 + m));
}

function normalizeMealBreaks(value) {
  const source = Array.isArray(value) && value.length ? value : DEFAULT_MEAL_BREAKS;
  const defaults = new Map(DEFAULT_MEAL_BREAKS.map(item => [item.id, item]));
  return source.map((item, index) => {
    const fallback = defaults.get(item?.id) || DEFAULT_MEAL_BREAKS[index] || { id: `meal-${index}`, label: "Meal", start: "12:00", end: "13:00", enabled: true };
    const start = validTimeString(item?.start, fallback.start);
    const end = validTimeString(item?.end, fallback.end);
    return {
      id: item?.id || fallback.id || `meal-${index}`,
      label: item?.label || fallback.label || "Meal",
      start,
      end: timeStringToMinutes(end) > timeStringToMinutes(start) ? end : fallback.end,
      enabled: item?.enabled !== false,
    };
  });
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function DailyStartupModal({ summary, onClose, onPlanDay }) {
  if (!summary) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Today’s plan">
      <div className="modal startup-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><strong>🌤 Today’s Plan</strong><div style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>{fmtDate(TODAY)}</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="startup-grid"><div><strong>{summary.events}</strong><span>events</span></div><div><strong>{summary.tasks}</strong><span>open tasks</span></div><div><strong>{summary.freeHours}h</strong><span>free time</span></div><div><strong>{summary.mainThings}</strong><span>main things</span></div></div>
          <div className="startup-next">{summary.firstEvent ? `First scheduled item: ${summary.firstEvent}` : "No scheduled items yet."}</div>
          <div className="settings-section-desc">Use Plan Today to place the most important tasks into realistic free slots before the day gets noisy.</div>
        </div>
        <div className="modal-footer"><div/><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={onClose}>Later</button><button className="tf-save" onClick={onPlanDay}>Plan Today</button></div></div>
      </div>
    </div>
  );
}

function SettingsPanel({ onClose, fontSize, setFontSize, darkMode, setDarkMode, theme, setTheme, workStart, setWorkStart, workEnd, setWorkEnd, mealBreaks, setMealBreaks, planningRules, setPlanningRules, notifs, setNotifs, pushEnabled, setPushEnabled, notificationPreferences, setNotificationPreferences, onEnableClosedPush, timezone, setTimezone, categories, setCategories, user, onSignOut, gameStats, onForceSync, syncStatus, syncDebug, onRestartOnboarding }) {
  const [catDraft, setCatDraft] = useState({ icon: "✨", label: "", color: "#FF7BAC" });
  const [syncDebugOpen, setSyncDebugOpen] = useState(false);
  const reminderPrefs = normalizeNotificationPreferences(notificationPreferences);
  const updateReminderPrefs = patch => setNotificationPreferences?.(normalizeNotificationPreferences({ ...reminderPrefs, ...patch }));
  const updateReminderNested = (key, patch) => updateReminderPrefs({ [key]: { ...(reminderPrefs[key] || {}), ...patch } });
  const reminderDayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const debug = syncDebug || {};
  const datasetCounts = debug.datasetCounts || {};
  const recentConflicts = normalizeSyncConflictLog(debug.syncConflictLog || []).slice(0, 5);
  const tombstoneCount = Object.values(debug.deletedRecords || {}).reduce((sum, bucket) => sum + Object.keys(bucket || {}).length, 0);
  function toggleNotifs() { if (!notifs && typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); setNotifs(!notifs); }
  async function toggleClosedPush() {
    if (!pushEnabled) {
      const ok = await onEnableClosedPush?.();
      if (ok) setPushEnabled(true);
    } else {
      await disableTempoPushNotifications();
      setPushEnabled(false);
    }
  }
  function addCategory() {
    if (!catDraft.label.trim()) return;
    const id = createCategoryId(catDraft.label);
    setCategories(cs => [...cs, { id: cs.some(c => c.id === id) ? id + "-" + uid() : id, icon: catDraft.icon || "✨", label: catDraft.label.trim(), color: catDraft.color || "#FF7BAC" }]);
    setCatDraft({ icon: "✨", label: "", color: "#FF7BAC" });
  }
  function updateCategory(id, patch) { setCategories(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function removeCategory(id) { if (categories.length <= 1) return; setCategories(cs => cs.filter(c => c.id !== id)); }
  function updateMealBreak(id, patch) {
    setMealBreaks(bs => normalizeMealBreaks(bs).map(b => b.id === id ? normalizeMealBreaks([{ ...b, ...patch }])[0] : b));
  }
  function updatePlanningRules(patch) {
    setPlanningRules(rules => normalizePlanningRules({ ...rules, ...patch }));
  }

  // Common timezones list
  const TIMEZONES = [
    "Pacific/Honolulu","America/Anchorage","America/Los_Angeles","America/Denver",
    "America/Chicago","America/New_York","America/Sao_Paulo","Europe/London",
    "Europe/Paris","Europe/Berlin","Europe/Istanbul","Asia/Dubai","Asia/Kolkata",
    "Asia/Bangkok","Asia/Singapore","Asia/Tokyo","Asia/Seoul","Australia/Sydney",
    "Pacific/Auckland",
  ];
  // Also include the user's detected timezone if not in list
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzList = TIMEZONES.includes(detected) ? TIMEZONES : [detected, ...TIMEZONES];
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title-row"><span>⚙️</span><span className="settings-title">Settings</span></div>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          {/* Account */}
          {user && (
            <div className="settings-section">
              <div className="settings-section-label">Account</div>
              <div className="settings-section-desc">Signed in as <strong>{user.email}</strong></div>
              <div className="settings-action-row">
                <button className="tf-save" onClick={onForceSync}>↻ Force sync now</button>
                <button className="signout-btn" onClick={onSignOut}>Sign out</button>
              </div>
              {syncStatus?.message && <div className="settings-section-desc">Sync status: {syncStatus.message}</div>}
              <div className={`sync-debug-panel ${syncDebugOpen ? "open" : "collapsed"}`}>
                <button type="button" className="sync-debug-top sync-debug-toggle" onClick={() => setSyncDebugOpen(v => !v)} aria-expanded={syncDebugOpen}>
                  <strong>Sync debug</strong>
                  <span>{debug.dataReady ? "Ready" : "Loading"} {syncDebugOpen ? "⌃" : "⌄"}</span>
                </button>
                {syncDebugOpen && (
                  <div className="sync-debug-content">
                    <div className="sync-debug-grid">
                      <div><strong>{debug.pendingLocalChanges || 0}</strong><span>pending edits</span></div>
                      <div><strong>{tombstoneCount}</strong><span>delete records</span></div>
                      <div><strong>{recentConflicts.length}</strong><span>recent conflicts</span></div>
                      <div><strong>{debug.lastSyncedAt ? new Date(debug.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</strong><span>last sync</span></div>
                    </div>
                    <div className="sync-debug-datasets">
                      {Object.entries(datasetCounts).map(([key, value]) => <span key={key}>{key}: {value}</span>)}
                    </div>
                    {recentConflicts.length > 0 && (
                      <div className="sync-conflict-list">
                        {recentConflicts.map(item => (
                          <div key={item.id} className="sync-conflict-row">
                            <span>{item.kind}</span>
                            <strong>{item.recordLabel}</strong>
                            <em>{item.kept === "local" ? "This device kept" : item.kept === "cloud" ? "Cloud kept" : "Latest kept"}</em>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="settings-section-desc">Deleted-item tombstones are kept for 90 days so removed items do not reappear on another device.</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Onboarding */}
          <div className="settings-section">
            <div className="settings-section-label">Onboarding</div>
            <div className="settings-section-desc">Restart the guided setup to choose your rhythm goals, starter habits, day start, wind-down time, and reminder preferences.</div>
            <div className="settings-action-row">
              <button className="tf-save" onClick={onRestartOnboarding}>🌿 Restart onboarding</button>
            </div>
          </div>
          {/* Theme */}
          <div className="settings-section">
            <div className="settings-section-label">Appearance</div>
            <div className="settings-section-desc">Choose a color theme and toggle light / dark mode</div>
            <div className="theme-grid">
              {THEMES.map(t => (
                <button key={t.id} className={`theme-swatch-btn ${theme === t.id ? "active" : ""}`} onClick={() => setTheme(t.id)} title={t.description}>
                  <div className="theme-swatch-dots">
                    {t.swatch.map((c, i) => <span key={i} className="theme-swatch-dot" style={{ background: c }} />)}
                  </div>
                  <span className="theme-swatch-label">{t.label}</span>
                  <span className="theme-swatch-lockline">Available</span>
                  {theme === t.id && <span className="theme-swatch-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="toggle-row" style={{ marginTop: 14 }}><span>☀️ Light</span><button className={`toggle ${darkMode ? "on" : ""}`} onClick={() => setDarkMode(v => !v)}><div className="toggle-thumb" /></button><span>🌙 Dark</span></div>
          </div>
          {/* Font size */}
          <div className="settings-section">
            <div className="settings-section-label">Text Size</div>
            <div className="settings-section-desc">Adjust text size across the app</div>
            <div className="font-size-preview"><span style={{ fontSize: `${FONT_SIZES.find(f => f.id === fontSize)?.scale * 14}px`, fontWeight: 700, color: "var(--accent)" }}>The quick brown fox</span><span style={{ fontSize: `${FONT_SIZES.find(f => f.id === fontSize)?.scale * 11}px`, color: "var(--text2)" }}>9:00 AM – Team standup</span></div>
            <div className="font-size-options">{FONT_SIZES.map(f => <button key={f.id} className={`font-size-btn ${fontSize === f.id ? "active" : ""}`} onClick={() => setFontSize(f.id)}><span className="fsb-label">{f.label}</span><span className="fsb-desc">{f.desc}</span></button>)}</div>
            <div className="font-size-slider-row"><span className="fsr-a">A</span><input type="range" min={0} max={4} step={1} value={FONT_SIZES.findIndex(f => f.id === fontSize)} onChange={e => setFontSize(FONT_SIZES[parseInt(e.target.value)].id)} className="font-slider" /><span className="fsr-A">A</span></div>
          </div>
          {/* Work hours */}
          <div className="settings-section">
            <div className="settings-section-label">Work Hours</div>
            <div className="settings-section-desc">Set your working window</div>
            <div className="work-hours-row">
              <label>Start <input type="number" className="tf-num wh-input" min={0} max={23} value={workStart} onChange={e => setWorkStart(Number(e.target.value))} /> {workStart < 12 ? "am" : workStart === 12 ? "pm" : `${workStart - 12}pm`}</label>
              <label>End <input type="number" className="tf-num wh-input" min={0} max={23} value={workEnd} onChange={e => setWorkEnd(Number(e.target.value))} /> {workEnd < 12 ? "am" : workEnd === 12 ? "pm" : `${workEnd - 12}pm`}</label>
            </div>
          </div>
          {/* Meal breaks */}
          <div className="settings-section">
            <div className="settings-section-label">Meal Breaks</div>
            <div className="settings-section-desc">Plan Today and Schedule Task will never place tasks during these blocked meal windows.</div>
            <div className="meal-break-list">
              {normalizeMealBreaks(mealBreaks).map(b => (
                <div key={b.id} className={`meal-break-row ${b.enabled ? "" : "disabled"}`}>
                  <label className="meal-break-enabled"><input type="checkbox" checked={b.enabled} onChange={e => updateMealBreak(b.id, { enabled: e.target.checked })} /> {b.label}</label>
                  <input type="time" className="tf-input meal-time" value={b.start} onChange={e => updateMealBreak(b.id, { start: e.target.value })}/>
                  <span className="meal-dash">–</span>
                  <input type="time" className="tf-input meal-time" value={b.end} onChange={e => updateMealBreak(b.id, { end: e.target.value })}/>
                </div>
              ))}
            </div>
          </div>
          {/* Timezone */}
          <div className="settings-section">
            <div className="settings-section-label">Timezone</div>
            <div className="settings-section-desc">Choose the timezone used for displaying calendar and schedule times</div>
            <select className="tf-select" value={timezone || detected} onChange={e => setTimezone(e.target.value)}>
              {tzList.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Categories */}
          <div className="settings-section">
            <div className="settings-section-label">Categories</div>
            <div className="settings-section-desc">Add, rename, recolor, or remove event and task categories</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {categories.map(c => (
                <div key={c.id} className="tf-row">
                  <input className="tf-input" style={{width:44,flex:"0 0 44px",textAlign:"center"}} value={c.icon} onChange={e => updateCategory(c.id, { icon: e.target.value })}/>
                  <input className="tf-input" value={c.label} onChange={e => updateCategory(c.id, { label: e.target.value })}/>
                  <input type="color" className="tf-input" style={{width:48,flex:"0 0 48px",padding:4}} value={c.color} onChange={e => updateCategory(c.id, { color: e.target.value })}/>
                  <button className="tf-cancel" onClick={() => removeCategory(c.id)}>Remove</button>
                </div>
              ))}
              <div className="tf-row">
                <input className="tf-input" style={{width:44,flex:"0 0 44px",textAlign:"center"}} value={catDraft.icon} onChange={e => setCatDraft(d => ({ ...d, icon: e.target.value }))}/>
                <input className="tf-input" placeholder="New category" value={catDraft.label} onChange={e => setCatDraft(d => ({ ...d, label: e.target.value }))}/>
                <input type="color" className="tf-input" style={{width:48,flex:"0 0 48px",padding:4}} value={catDraft.color} onChange={e => setCatDraft(d => ({ ...d, color: e.target.value }))}/>
                <button className="tf-save" onClick={addCategory}>Add</button>
              </div>
            </div>
          </div>
          {/* Notifications */}
          <div className="settings-section">
            <div className="settings-section-label">In-app notifications</div>
            <div className="settings-section-desc">Used for reminder alerts while the app is open</div>
            <div className="toggle-row"><span>Off</span><button className={`toggle ${notifs ? "on" : ""}`} onClick={toggleNotifs}><div className="toggle-thumb" /></button><span>On</span></div>
          </div>
          <div className="settings-section">
            <div className="settings-section-label">Closed-app push notifications</div>
            <div className="settings-section-desc">Registers this device for server-sent reminders while Tempo is closed. Requires the push setup files and VAPID keys.</div>
            <div className="toggle-row"><span>Off</span><button className={`toggle ${pushEnabled ? "on" : ""}`} onClick={toggleClosedPush}><div className="toggle-thumb" /></button><span>On</span></div>
          </div>
          <div className="settings-section">
            <div className="settings-section-label">Reminder categories</div>
            <div className="settings-section-desc">Choose which gentle reminders Tempo can send. Event, task, and habit reminders still use the individual times you set on each item.</div>
            <div className="notification-pref-grid">
              {[
                ["events", "🗓️", "Events", "Calendar reminders"],
                ["tasks", "✅", "Tasks", "Task reminders"],
                ["habits", "🌱", "Habits", "Complete from notification"],
              ].map(([key, emoji, label, desc]) => (
                <label key={key} className="notification-pref-card">
                  <input type="checkbox" checked={Boolean(reminderPrefs[key])} onChange={e => updateReminderPrefs({ [key]: e.target.checked })} />
                  <span className="notification-pref-emoji">{emoji}</span>
                  <span><strong>{label}</strong><small>{desc}</small></span>
                </label>
              ))}
            </div>
            <div className="notification-schedule-list">
              <label className="notification-schedule-row"><span><strong>📔 Journal reminder</strong><small>Want to do a quick journal check-in?</small></span><input type="checkbox" checked={reminderPrefs.journal.enabled} onChange={e => updateReminderNested("journal", { enabled: e.target.checked })} /><input type="time" className="tf-input meal-time" value={reminderPrefs.journal.time} onChange={e => updateReminderNested("journal", { time: e.target.value })} /></label>
              <label className="notification-schedule-row"><span><strong>🌙 Tomorrow Reset</strong><small>A gentle reminder to plan tomorrow.</small></span><input type="checkbox" checked={reminderPrefs.tomorrowReset.enabled} onChange={e => updateReminderNested("tomorrowReset", { enabled: e.target.checked })} /><input type="time" className="tf-input meal-time" value={reminderPrefs.tomorrowReset.time} onChange={e => updateReminderNested("tomorrowReset", { time: e.target.value })} /></label>
              <label className="notification-schedule-row"><span><strong>🧺 Weekly Reset</strong><small>Review the week and set your next rhythm.</small></span><input type="checkbox" checked={reminderPrefs.weeklyReset.enabled} onChange={e => updateReminderNested("weeklyReset", { enabled: e.target.checked })} /><select className="tf-select notification-day-select" value={reminderPrefs.weeklyReset.day} onChange={e => updateReminderNested("weeklyReset", { day: Number(e.target.value) })}>{reminderDayLabels.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input type="time" className="tf-input meal-time" value={reminderPrefs.weeklyReset.time} onChange={e => updateReminderNested("weeklyReset", { time: e.target.value })} /></label>
              <label className="notification-schedule-row"><span><strong>💌 Daily affirmation</strong><small>Time for one grounded thought.</small></span><input type="checkbox" checked={reminderPrefs.affirmations.enabled} onChange={e => updateReminderNested("affirmations", { enabled: e.target.checked })} /><input type="time" className="tf-input meal-time" value={reminderPrefs.affirmations.time} onChange={e => updateReminderNested("affirmations", { time: e.target.value })} /></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayEntryModal({ date, entry, onSave, onClose, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, onReorderActivities, userId, imageUrls = {} }) {
  const normalized = normalizeMemoryEntry(entry);
  const originalStoragePaths = useMemo(() => normalized.photos.flatMap(allMemoryPhotoStoragePaths), [entry]);
  const [mood,       setMoodLocal]  = useState(normalized.mood);
  const [activities, setActivities] = useState(normalized.activities);
  const [note,       setNote]       = useState(normalized.note);
  const [gratitude,  setGratitude]  = useState(normalized.gratitude.length ? normalized.gratitude : ["","",""]);
  const [photos,     setPhotos]     = useState(normalized.photos);
  const [coverPhotoId, setCoverPhotoId] = useState(normalized.coverPhotoId);
  const [tags,       setTags]       = useState(normalized.tags);
  const [newTag,     setNewTag]     = useState("");
  const [blocks,     setBlocks]     = useState(normalized.blocks);
  const [backgroundId, setBackgroundId] = useState(normalized.backgroundId || "plain");
  const [highlights, setHighlights] = useState(normalized.highlights);
  const [newActivity, setNewActivity] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const initialSnapshot = useMemo(() => JSON.stringify({
    mood: normalized.mood,
    activities: normalized.activities,
    note: normalized.note,
    gratitude: normalized.gratitude.length ? normalized.gratitude : ["","",""],
    photos: normalized.photos.map(p => ({ id:p.id, caption:p.caption || "", storagePath:p.storagePath || "", thumbStoragePath:p.thumbStoragePath || "" })),
    coverPhotoId: normalized.coverPhotoId,
    tags: normalized.tags,
    blocks: normalized.blocks,
    backgroundId: normalized.backgroundId || "plain",
    highlights: normalized.highlights,
  }), [entry]);
  const prompt = JOURNAL_PROMPTS[date.getDate() % JOURNAL_PROMPTS.length];
  const stickerPacks = Core.MEMORY_STICKER_PACKS || [{ id: "cozy", label: "Cozy", stickers: COZY_STICKER_PACK }];
  const renderStickerPackPicker = (selectedSrc, onPick, { previewOnly = false } = {}) => (
    <div className="sticker-pack-list">
      {stickerPacks.map(pack => (
        <div key={pack.id} className="sticker-pack-section">
          <div className="sticker-pack-title">{pack.label}</div>
          <div className="sticker-asset-picker-row">
            {(pack.stickers || []).map(st => {
              const content = (
                <>
                  <img src={st.src} alt={st.label} onError={e => { e.currentTarget.style.display = "none"; }} />
                  <span className="sticker-choice-label">{st.number || st.label}</span>
                </>
              );
              return previewOnly
                ? <span key={st.id} className="sticker-preview-chip">{content}</span>
                : <button key={st.id} type="button" className={selectedSrc === st.src ? "selected" : ""} title={st.label} onClick={() => onPick(st)}>{content}</button>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
  const visibleActivitiesCatalog = (activitiesCatalog || []).filter(a => !a.archived);
  const groups = [...new Set(visibleActivitiesCatalog.map(a => a.group || "Custom"))];
  const [showActivityManager, setShowActivityManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [dragActivityId, setDragActivityId] = useState(null);
  const availableTags = [...new Set([...(memoryTagsCatalog || MEMORY_TAGS), ...tags].map(memoryTagLabel).filter(Boolean))];
  const currentSnapshot = JSON.stringify({
    mood, activities, note, gratitude,
    photos: photos.map(p => ({ id:p.id, caption:p.caption || "", storagePath:p.storagePath || "", thumbStoragePath:p.thumbStoragePath || "", pending: Boolean(p.pendingFile) })),
    coverPhotoId, tags, blocks, backgroundId, highlights,
  });
  const hasUnsavedChanges = currentSnapshot !== initialSnapshot;
  function requestClose() {
    if (uploading) return;
    if (hasUnsavedChanges && !window.confirm("Discard this memory? You have unsaved changes.")) return;
    onClose();
  }

  function toggleActivity(id) {
    setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  }
  function updateGratitude(i, val) {
    setGratitude(g => { const n=[...g]; n[i]=val; return n; });
  }
  function toggleTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    setTags(t => t.includes(clean) ? t.filter(x => x !== clean) : [...t, clean]);
  }
  function editMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    const next = window.prompt("Rename memory tag", clean);
    if (!next || !next.trim()) return;
    const renamed = memoryTagLabel(next);
    onUpdateMemoryTag?.(clean, renamed);
    setTags(t => [...new Set(t.map(x => x === clean ? renamed : x))]);
  }
  function removeMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    if (!window.confirm(`Remove #${clean} from all memories? This cannot be undone.`)) return;
    onDeleteMemoryTag?.(clean);
    setTags(t => t.filter(x => x !== clean));
  }
  function editActivity(activity) {
    const label = window.prompt("Rename activity", activity.label);
    if (!label || !label.trim()) return;
    const emoji = window.prompt("Emoji", activity.emoji || "✨") || activity.emoji || "✨";
    onUpdateActivity?.(activity.id, { label: label.trim(), emoji: emoji.trim() || "✨" });
  }
  function removeActivity(activity) {
    if (!window.confirm(`Archive ${activity.emoji || ""} ${activity.label}? Old memories will keep their label.`)) return;
    onDeleteActivity?.(activity.id);
    setActivities(a => a.filter(x => x !== activity.id));
  }
  function handleActivityDrop(targetId) {
    if (!dragActivityId || dragActivityId === targetId) return;
    onReorderActivities?.(dragActivityId, targetId);
    setDragActivityId(null);
  }
  async function handlePhotoUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    setUploadStatus("Preparing photos…");
    try {
      const next = await prepareJournalPhotosFromFiles(files, photos.length, setUploadStatus);
      setPhotos(p => {
        const merged = [...p, ...next];
        if (!coverPhotoId && merged[0]) setCoverPhotoId(merged[0].id);
        return merged;
      });
    } catch (err) {
      console.warn("Memory photo selection failed", err);
      setUploadError(err?.message || "Could not add photos. Please try smaller image files.");
    } finally { setUploading(false); setUploadStatus(""); }
  }
  function updatePhotoCaption(id, caption) {
    setPhotos(p => p.map(photo => photo.id === id ? { ...photo, caption } : photo));
  }
  function removePhoto(id) {
    if (!window.confirm("Remove this photo from the memory? The file is deleted after the memory saves successfully.")) return;
    setPhotos(p => p.filter(photo => photo.id !== id));
    setCoverPhotoId(c => c === id ? null : c);
    setBlocks(bs => bs.map(b => b.type === "photoGrid" ? { ...b, photoIds: (b.photoIds || []).filter(pid => pid !== id) } : b));
  }
  function addBlock(type) {
    if (type === "photoGrid") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type, photoIds: photos.slice(0,6).map(p=>p.id), caption:"" }]);
    } else if (type === "sticker") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type, sticker:"🌸", stickerAsset: COZY_STICKER_PACK[0]?.src || null, size:"medium" }]);
    } else if (type === "quote") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type, text:"" }]);
    } else if (type === "divider") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type }]);
    } else {
      setBlocks(bs => [...bs, { id:"b"+uid(), type:"text", text:"" }]);
    }
  }
  function updateBlock(id, patch) { setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function removeBlock(id) { setBlocks(bs => bs.filter(b => b.id !== id)); }
  function moveBlock(id, dir) {
    setBlocks(bs => {
      const idx = bs.findIndex(b => b.id === id), next = [...bs];
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= next.length) return bs;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }
  function updateStickerPosition(blockId, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pointer = e.touches?.[0] || e;
    const x = Math.max(0, Math.min(100, ((pointer.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((pointer.clientY - rect.top) / rect.height) * 100));
    updateBlock(blockId, { x: Math.round(x), y: Math.round(y) });
  }
  async function handleSave() {
    const memoryKey = dateKey(date);
    setUploading(true);
    setUploadError("");
    try {
      const cleanTags = [...new Set(tags.map(memoryTagLabel).filter(Boolean))];
      const uploadedPhotos = [];
      const pendingPhotos = photos.filter(p => p.pendingFile);
      for (const photo of photos) {
        if (photo.pendingFile) {
          const uploadIndex = pendingPhotos.findIndex(p => p.id === photo.id) + 1;
          setUploadStatus(`Uploading ${uploadIndex || 1} of ${pendingPhotos.length || 1} photos…`);
          const uploaded = await uploadMemoryImageToStorage(userId, photo.pendingFile, memoryKey);
          uploadedPhotos.push(sanitizeMemoryPhotoForStorage({
            id: photo.id,
            ...uploaded,
            caption: photo.caption || "",
            name: photo.name || photo.pendingFile?.name || "Memory photo",
            createdAt: photo.createdAt || new Date().toISOString(),
          }));
        } else if (photo.storagePath) {
          uploadedPhotos.push(sanitizeMemoryPhotoForStorage({ ...photo, caption: photo.caption || "" }));
        }
      }
      const cleanBlocks = blocks.map(b => ({ ...b }));
      const finalStoragePaths = new Set(uploadedPhotos.flatMap(allMemoryPhotoStoragePaths));
      const removedPaths = originalStoragePaths.filter(path => !finalStoragePaths.has(path));
      const newlyUploadedPaths = uploadedPhotos
        .filter(p => photos.find(original => original.id === p.id)?.pendingFile)
        .flatMap(allMemoryPhotoStoragePaths);
      try {
        setUploadStatus("Saving memory…");
        await onSave(memoryKey, {
          mood, activities, note, gratitude,
          photos: uploadedPhotos,
          coverPhotoId: coverPhotoId || uploadedPhotos[0]?.id || null,
          tags: cleanTags,
          backgroundId,
          highlights,
          blocks: cleanBlocks,
          updatedAt: new Date().toISOString()
        });
      } catch (saveErr) {
        if (newlyUploadedPaths.length) await deleteMemoryStoragePaths(newlyUploadedPaths);
        throw saveErr;
      }
      if (removedPaths.length) {
        setUploadStatus("Cleaning removed photos…");
        await deleteMemoryStoragePaths(removedPaths);
      }
      setUploadStatus("Memory saved ✓");
      onClose();
    } catch (err) {
      console.warn("Memory save failed", err);
      setUploadError(err?.message || "Could not save memory. Please check your connection and Supabase Storage setup.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="modal-overlay memory-entry-overlay" onClick={requestClose} role="dialog" aria-modal="true" aria-label="Journal entry">
      <div className={`entry-modal memory-entry-modal memory-bg-${backgroundId}`} style={memoryBackgroundStyle(backgroundId)} onClick={e => e.stopPropagation()}>
        <div className="entry-modal-header">
          <div>
            <div className="entry-modal-date">{formatWithDisplayTimezone(date, {weekday:"long",month:"long",day:"numeric"})}</div>
            <div className="entry-modal-sub">Add today’s memory page</div>
          </div>
          <button className="modal-close" onClick={requestClose}>✕</button>
        </div>

        <div className="entry-modal-body">
        <div className="entry-section">
          <div className="entry-section-title">Mood</div>
          <div className="mood-picker-row">
            {JOURNAL_MOODS.map(m => (
              <button key={m.id} className={`mood-pick-btn ${mood===m.id?"selected":""}`}
                style={{"--mc": m.color}} onClick={() => setMoodLocal(m.id)}>
                <span className="mp-emoji">{m.emoji}</span>
                <span className="mp-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Photos</div>
          <label className="memory-upload-box">
            <input type="file" accept="image/*" multiple onChange={e => { handlePhotoUpload(e.target.files); e.target.value=""; }} />
            <span className="memory-upload-icon">📷</span>
            <span>{uploading ? "Working on photos…" : `+ Add photos (${photos.length}/${MEMORY_IMAGE_LIMIT_PER_ENTRY})`}</span>
          </label>
          {(uploadStatus || uploadError) && <div className={uploadError ? "memory-upload-error" : "memory-upload-status"}>{uploadError || uploadStatus}</div>}
          {photos.length > 0 && (
            <div className="memory-photo-editor-grid">
              {photos.map(p => (
                <div key={p.id} className={`memory-photo-editor-card ${coverPhotoId===p.id?"cover":""}`}>
                  <img src={memoryPhotoSrc(p, imageUrls)} alt={p.caption || "Journal memory"} />
                  <div className="memory-photo-tools">
                    <button type="button" onClick={() => setCoverPhotoId(p.id)}>{coverPhotoId===p.id ? "Cover ✓" : "Set cover"}</button>
                    <button type="button" onClick={() => removePhoto(p.id)}>Remove</button>
                  </div>
                  <input className="gratitude-input memory-caption-input" placeholder="Add caption…" value={p.caption || ""} onChange={e => updatePhotoCaption(p.id, e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title section-title-with-action"><span>Memory Tags</span><button type="button" className="mini-manage-btn" onClick={() => setShowTagManager(v => !v)}>{showTagManager ? "Done" : "Manage"}</button></div>
          <div className="memory-tag-row editable-memory-row">
            {availableTags.map(tag => (
              <span key={tag} className={`editable-chip memory-tag-chip ${tags.includes(tag)?"selected":""}`}>
                <button type="button" className="editable-chip-main" onClick={() => toggleTag(tag)}>#{tag}</button>
                <button type="button" className="chip-mini-action" title="Rename tag" onClick={() => editMemoryTag(tag)}>✎</button>
                <button type="button" className="chip-mini-action" title="Remove tag" onClick={() => removeMemoryTag(tag)}>×</button>
              </span>
            ))}
          </div>
          <div className="tf-row" style={{marginTop:10}}>
            <input className="tf-input" placeholder="Add tag…" value={newTag} onChange={e => setNewTag(e.target.value)} />
            <button className="tf-save" onClick={() => { const added = onAddMemoryTag?.(newTag) || memoryTagLabel(newTag); toggleTag(added); setNewTag(""); }}>Add</button>
          </div>
          {showTagManager && (
            <div className="memory-manager-panel">
              <div className="manager-title">Tag Manager</div>
              {availableTags.map(tag => (
                <div key={tag} className="manager-row">
                  <span className="manager-chip">#{tag}</span>
                  <span className="manager-count">{tags.includes(tag) ? "selected" : "available"}</span>
                  <button type="button" onClick={() => editMemoryTag(tag)}>Rename</button>
                  <button type="button" onClick={() => removeMemoryTag(tag)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Page Background</div>
          <div className="memory-background-picker">
            {MEMORY_BACKGROUNDS.map(bg => (
              <button key={bg.id} type="button" className={`memory-bg-choice ${backgroundId===bg.id?"selected":""}`} onClick={() => setBackgroundId(bg.id)}>
                <span className="memory-bg-swatch" style={bg.src ? {backgroundImage:`url(${bg.src})`} : {}} />
                <span>{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="entry-section">
          <div className="entry-section-title section-title-with-action"><span>Activities</span><button type="button" className="mini-manage-btn" onClick={() => setShowActivityManager(v => !v)}>{showActivityManager ? "Done" : "Manage"}</button></div>
          {groups.map(g => (
            <div key={g} className="activity-group">
              <div className="activity-group-label">{g}</div>
              <div className="activity-chips">
                {visibleActivitiesCatalog.filter(a => (a.group || "Custom") === g).map(a => (
                  <span key={a.id} className={`editable-chip activity-chip ${activities.includes(a.id)?"selected":""}`}>
                    <button type="button" className="editable-chip-main" onClick={() => toggleActivity(a.id)}><span>{a.emoji}</span><span>{a.label}</span></button>
                    <button type="button" className="chip-mini-action" title="Rename activity" onClick={() => editActivity(a)}>✎</button>
                    <button type="button" className="chip-mini-action" title="Remove activity" onClick={() => removeActivity(a)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="tf-row" style={{marginTop:10}}>
            <input className="tf-input" placeholder="Add activity…" value={newActivity} onChange={e => setNewActivity(e.target.value)} />
            <button className="tf-save" onClick={() => { if (!newActivity.trim()) return; const added = onAddActivity?.(newActivity.trim()); if (added?.id) setActivities(a => [...new Set([...a, added.id])]); setNewActivity(""); }}>Add</button>
          </div>
          {showActivityManager && (
            <div className="memory-manager-panel activity-manager-panel">
              <div className="manager-title">Activity Manager</div>
              {groups.map(groupName => (
                <div key={groupName} className="manager-group-card">
                  <div className="manager-group-head">{groupName}</div>
                  {visibleActivitiesCatalog.filter(a => (a.group || "Custom") === groupName).map(a => (
                    <div key={a.id} className={`manager-row draggable-manager-row ${dragActivityId===a.id?"dragging":""}`} draggable onDragStart={() => setDragActivityId(a.id)} onDragOver={e => e.preventDefault()} onDrop={() => handleActivityDrop(a.id)} onDragEnd={() => setDragActivityId(null)}>
                      <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                      <span className="manager-chip">{a.emoji} {a.label}</span>
                      <button type="button" onClick={() => editActivity(a)}>Edit</button>
                      <button type="button" onClick={() => removeActivity(a)}>Archive</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Today’s Highlights ✨</div>
          <input className="gratitude-input" placeholder="Best moment…" value={highlights.best || ""} onChange={e => setHighlights(h => ({...h, best:e.target.value}))} />
          <input className="gratitude-input" placeholder="Biggest win…" value={highlights.win || ""} onChange={e => setHighlights(h => ({...h, win:e.target.value}))} />
          <input className="gratitude-input" placeholder="Something I learned…" value={highlights.learned || ""} onChange={e => setHighlights(h => ({...h, learned:e.target.value}))} />
          <input className="gratitude-input" placeholder="One thing I want to remember…" value={highlights.remember || ""} onChange={e => setHighlights(h => ({...h, remember:e.target.value}))} />
        </div>

        <div className="entry-section">
          <div className="entry-section-title">3 Things I'm Grateful For 🌸</div>
          {[0,1,2].map(i => (
            <input key={i} className="gratitude-input" placeholder={`Gratitude ${i+1}…`}
              value={gratitude[i] || ""} onChange={e => updateGratitude(i, e.target.value)} />
          ))}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Journal Entry</div>
          <div className="journal-prompt">💭 {prompt}</div>
          <textarea className="journal-textarea" rows={5} placeholder="Write freely…"
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="entry-section scrapbook-editor-section">
          <div className="entry-section-title">Scrapbook Blocks</div>
          <div className="scrapbook-add-row">
            <button type="button" onClick={() => addBlock("text")}>+ Text</button>
            <button type="button" onClick={() => addBlock("photoGrid")}>+ Photo Grid</button>
            <button type="button" onClick={() => addBlock("sticker")}>+ Sticker</button>
            <button type="button" onClick={() => addBlock("quote")}>+ Quote</button>
            <button type="button" onClick={() => addBlock("divider")}>+ Divider</button>
          </div>
          <div className="scrapbook-block-editor-list">
            {blocks.map((b, idx) => (
              <div key={b.id} className={`scrapbook-block-editor block-${b.type}`}>
                <div className="scrapbook-block-tools">
                  <span>{b.type === "photoGrid" ? "Photo grid" : b.type === "quote" ? "Quote" : b.type === "sticker" ? "Sticker" : b.type === "divider" ? "Divider" : "Text"}</span>
                  <div>
                    <button type="button" disabled={idx===0} onClick={() => moveBlock(b.id,-1)}>↑</button>
                    <button type="button" disabled={idx===blocks.length-1} onClick={() => moveBlock(b.id,1)}>↓</button>
                    <button type="button" onClick={() => removeBlock(b.id)}>Remove</button>
                  </div>
                </div>
                {b.type === "text" && <textarea className="journal-textarea" rows={3} placeholder="Scrapbook note…" value={b.text || ""} onChange={e => updateBlock(b.id,{text:e.target.value})} />}
                {b.type === "quote" && <input className="gratitude-input" placeholder="Quote of the day…" value={b.text || ""} onChange={e => updateBlock(b.id,{text:e.target.value})} />}
                {b.type === "sticker" && <>
                  {renderStickerPackPicker(b.stickerAsset, st => updateBlock(b.id,{ stickerAsset: st.src, sticker: st.label }))}
                  <div className="sticker-picker-row">{SCRAPBOOK_STICKERS.map(st => <button key={st} type="button" className={!b.stickerAsset && b.sticker===st?"selected":""} onClick={() => updateBlock(b.id,{sticker:st, stickerAsset:null})}>{st}</button>)}</div>
                  <div className="sticker-position-pad" onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); updateStickerPosition(b.id, e); }} onPointerMove={e => { if (e.buttons) updateStickerPosition(b.id, e); }}>
                    <span className="sticker-position-help">Drag the sticker into place</span>
                    <span className="sticker-position-preview" style={{ left: `${b.x ?? 50}%`, top: `${b.y ?? 50}%` }}>{b.stickerAsset ? <img src={b.stickerAsset} alt="Sticker"/> : (b.sticker || "🌸")}</span>
                  </div>
                </>}
                {b.type === "photoGrid" && <>
                  <div className="photo-grid-select-row">{photos.map(p => <button key={p.id} type="button" className={(b.photoIds || []).includes(p.id)?"selected":""} onClick={() => { const set = new Set(b.photoIds || []); set.has(p.id) ? set.delete(p.id) : set.add(p.id); updateBlock(b.id,{photoIds:[...set]}); }}><img src={memoryPhotoSrc(p, imageUrls)} alt="" /></button>)}</div>
                  <input className="gratitude-input memory-caption-input" placeholder="Grid caption…" value={b.caption || ""} onChange={e => updateBlock(b.id,{caption:e.target.value})} />
                </>}
                {b.type === "divider" && <div className="scrapbook-divider-preview">✦ ✦ ✦</div>}
              </div>
            ))}
            {blocks.length === 0 && <div className="scrapbook-empty-note">Add blocks to make this page feel like a real scrapbook.</div>}
          </div>
        </div>
        </div>

        <div className="entry-modal-footer">
          <button className="tf-cancel" onClick={requestClose}>Cancel</button>
          <button className="tf-save" onClick={handleSave} disabled={uploading}>{uploading ? "Saving…" : "Save memory ✓"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Page ─────────────────────────────────────────────────────────────
function JournalPage({ journal, setJournal, onSaveMemoryEntry, events, tasks, dailyCheckIns = [], tomorrowResets = [], weeklyResets = [], onOpenCheckIn, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, onReorderActivities, userId, onMemoryStorageMigrated, quickEditDate, onQuickEditHandled }) {
  const [calDate,    setCalDate]    = useState(new Date(TODAY));
  const [editing,    setEditing]    = useState(null); // Date being edited
  const [viewingKey, setViewingKey] = useState(null); // dateKey being read
  const [activeTag,  setActiveTag]  = useState("all"); // Journal tag filter
  const [memorySearch, setMemorySearch] = useState("");
  const [memorySettingsOpen, setMemorySettingsOpen] = useState(false);
  const [memoryImageUrls, setMemoryImageUrls] = useState({});
  const [dragActivityId, setDragActivityId] = useState(null);
  useEffect(() => {
    if (quickEditDate) {
      setEditing(quickEditDate);
      onQuickEditHandled?.();
    }
  }, [quickEditDate]);

  async function saveEntry(key, data) {
    if (onSaveMemoryEntry) return onSaveMemoryEntry(key, data);
    setJournal(j => ({ ...j, [key]: data }));
    return true;
  }

  // Build mood calendar for current month
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const fd = new Date(year, month, 1); const so = (fd.getDay()+6)%7;
  const calDays = [];
  for (let i=0; i<so; i++) calDays.push(null);
  for (let d=1; d<=daysInMonth; d++) calDays.push(new Date(year, month, d));
  while (calDays.length%7!==0) calDays.push(null);

  // Stats for current month
  const monthPrefix = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthEntries = Object.entries(journal).filter(([k]) => k.startsWith(monthPrefix));
  const monthTags = [...new Set(monthEntries.flatMap(([,e]) => normalizeMemoryEntry(e).tags || []))].filter(Boolean).sort();
  const allTagUsage = Object.values(journal || {}).reduce((acc, e) => { normalizeMemoryEntry(e).tags.forEach(t => { acc[t] = (acc[t] || 0) + 1; }); return acc; }, {});
  const allActivitiesUsage = Object.values(journal || {}).reduce((acc, e) => { normalizeMemoryEntry(e).activities.forEach(id => { acc[id] = (acc[id] || 0) + 1; }); return acc; }, {});
  const monthPhotos = monthEntries.reduce((sum, [,e]) => sum + normalizeMemoryEntry(e).photos.length, 0);
  const monthPages = monthEntries.filter(([,e]) => hasJournalEntryForKey({ tmp: e }, "tmp")).length;
  const moodCounts = JOURNAL_MOODS.map(m => ({ ...m, count: monthEntries.filter(([,e]) => e.mood===m.id).length }));
  const todayCheckIn = dailyCheckInForDate(dailyCheckIns, TODAY);
  const todayCheckInMood = todayCheckIn?.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === todayCheckIn.mood) : null;
  const todayCheckInEnergy = todayCheckIn?.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === todayCheckIn.energy) : null;
  const monthCheckIns = normalizeDailyCheckIns(dailyCheckIns).filter(c => String(c.date || "").startsWith(monthPrefix));
  const latestTomorrowReset = tomorrowResetForDate(tomorrowResets, TODAY);
  const monthTomorrowResets = normalizeTomorrowResets(tomorrowResets).filter(r => String(r.date || "").startsWith(monthPrefix));
  const latestWeeklyReset = weeklyResetForDate(weeklyResets, TODAY);
  const monthWeeklyResets = normalizeWeeklyResets(weeklyResets).filter(r => String(r.weekStart || "").startsWith(monthPrefix));
  const query = memorySearch.trim().toLowerCase();
  const memorySearchText = (key, entry) => {
    const mem = normalizeMemoryEntry(entry);
    const moodLabel = JOURNAL_MOODS.find(m => m.id === mem.mood)?.label || "";
    const activityLabels = (mem.activities || []).map(id => activitiesCatalog.find(a => a.id === id)?.label || id);
    const bgLabel = memoryBackgroundById(mem.backgroundId)?.label || "";
    return [
      key,
      moodLabel,
      bgLabel,
      ...activityLabels,
      mem.note,
      ...(mem.gratitude || []),
      ...(mem.tags || []),
      ...Object.values(mem.highlights || {}),
      ...(mem.photos || []).flatMap(p => [p.caption || "", p.name || ""]),
      ...(mem.blocks || []).flatMap(b => [b.text || "", b.caption || "", b.sticker || ""])
    ].join(" ").toLowerCase();
  };
  const memoryMatchesFilters = (key, entry) => {
    if (!hasJournalEntryForKey({ [key]: entry }, key)) return false;
    const mem = normalizeMemoryEntry(entry);
    if (activeTag !== "all" && !(mem.tags || []).includes(activeTag)) return false;
    if (query && !memorySearchText(key, entry).includes(query)) return false;
    return true;
  };
  const memoryFiltersActive = activeTag !== "all" || Boolean(query);
  const searchableEntries = Object.entries(journal)
    .filter(([k,e]) => memoryMatchesFilters(k, e))
    .sort(([a],[b]) => b.localeCompare(a));
  const throwbackKeys = [dateKey(addDaysSafe(TODAY, -7)), dateKey(addMonthsSafe(TODAY, -1)), dateKey(addDaysSafe(TODAY, -365))];
  const throwbacks = [...new Set(throwbackKeys)].map(k => [k, journal[k]]).filter(([,e]) => e && hasJournalEntryForKey({ tmp:e }, "tmp")).slice(0,3);
  const streak = (() => {
    let s=0; const d=new Date(TODAY);
    while(true){ if(!hasJournalEntryForKey(journal, dateKey(d))) break; s++; d.setDate(d.getDate()-1); }
    return s;
  })();

  async function refreshMemoryImage(photo, preferThumb = false) {
    const path = preferThumb ? (photo?.thumbStoragePath || photo?.storagePath) : (photo?.storagePath || photo?.thumbStoragePath);
    if (!path) return;
    try {
      const signed = await signMemoryImagePath(path);
      if (signed.src) setMemoryImageUrls(prev => ({ ...prev, [path]: signed.src }));
    } catch (err) {
      console.warn("Could not refresh Journal image URL", err);
    }
  }


  useEffect(() => {
    if (!userId) return;
    const migrations = [];
    const pathsToSign = new Set();
    Object.entries(journal || {}).forEach(([key, entry]) => {
      const mem = normalizeMemoryEntry(entry);
      mem.photos.forEach(photo => {
        if (memoryPhotoNeedsStorageMigration(photo)) migrations.push({ key, photo });
        else {
          allMemoryPhotoStoragePaths(photo).forEach(path => { if (!memoryImageUrls[path]) pathsToSign.add(path); });
        }
      });
    });
    if (!migrations.length && !pathsToSign.size) return;
    let cancelled = false;
    (async () => {
      const migratedPhotos = {};
      const signedUrls = {};
      for (const item of migrations) {
        try {
          const uploaded = await uploadMemoryDataUrlToStorage(userId, item.photo.src, item.photo.name || "legacy-memory-photo", item.key);
          migratedPhotos[`${item.key}:${item.photo.id}`] = sanitizeMemoryPhotoForStorage({
            id: item.photo.id,
            ...uploaded,
            caption: item.photo.caption || "",
            name: item.photo.name || "legacy-memory-photo",
            createdAt: item.photo.createdAt || new Date().toISOString(),
          });
          allMemoryPhotoStoragePaths(uploaded).forEach(path => pathsToSign.add(path));
        } catch (err) {
          console.warn("Could not migrate Journal photo", err);
        }
      }
      for (const path of pathsToSign) {
        try {
          const signed = await signMemoryImagePath(path);
          if (signed.src) signedUrls[path] = signed.src;
        } catch (err) {
          console.warn("Could not sign Journal photo", err);
        }
      }
      if (cancelled) return;
      if (Object.keys(signedUrls).length) setMemoryImageUrls(prev => ({ ...prev, ...signedUrls }));
      if (Object.keys(migratedPhotos).length) {
        setJournal(prev => {
          let changed = false;
          const next = { ...prev };
          Object.entries(prev || {}).forEach(([key, entry]) => {
            const mem = normalizeMemoryEntry(entry);
            let entryChanged = false;
            const photos = mem.photos.map(photo => {
              const patch = migratedPhotos[`${key}:${photo.id}`];
              if (!patch) return photo;
              changed = true;
              entryChanged = true;
              return patch;
            });
            if (entryChanged) next[key] = { ...entry, photos };
          });
          return changed ? next : prev;
        });
        onMemoryStorageMigrated?.(new Date().toISOString());
      }
    })();
    return () => { cancelled = true; };
  }, [userId, journal, memoryImageUrls, setJournal, onMemoryStorageMigrated]);

  // (viewEntry accessed inline below via journal[viewingKey])

  return (
    <div className="journal-page">
      {/* Header */}
      <div className="journal-header">
        <div className="journal-header-main">
          <div className="journal-title">📔 Journal</div>
          <div className="journal-streak">🔥 {streak} day streak</div>
        </div>
        <div className="journal-header-actions">
          <button type="button" className="tf-cancel journal-today-btn memory-settings-btn" onClick={() => setMemorySettingsOpen(true)}>Memory Settings</button>
          <button type="button" className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
        </div>
      </div>


      {/* Mood stats bar */}
      <div className="mood-stats-bar">
        {moodCounts.map(m => m.count > 0 && (
          <div key={m.id} className="mood-stat-pill" style={{"--mc":m.color}}>
            <span>{m.emoji}</span><span className="mood-stat-count">{m.count}</span>
          </div>
        ))}
        <span className="mood-stats-month">{formatWithDisplayTimezone(calDate, {month:"long",year:"numeric"})}</span>
      </div>


      {latestWeeklyReset && (
        <div className="journal-reset-card journal-weekly-reset-card">
          <div className="journal-reset-main">
            <span>🧺</span>
            <div>
              <strong>Weekly Reset saved</strong>
              <p>{latestWeeklyReset.priorities?.length ? `Next focus: ${latestWeeklyReset.priorities.slice(0, 2).join(" · ")}` : (latestWeeklyReset.intention || "Your weekly intention is saved.")}</p>
            </div>
          </div>
          <div className="journal-checkin-actions">
            <span>{monthWeeklyResets.length} weekly reset{monthWeeklyResets.length === 1 ? "" : "s"} this month</span>
          </div>
        </div>
      )}

      <div className="journal-reflection-hub">
        <div className="journal-reflection-head">
          <div>
            <strong>Reflection Hub</strong>
            <p>Today’s check-in, gratitude, tomorrow intention, and weekly reset in one calm space.</p>
          </div>
          <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>Write today’s journal</button>
        </div>
        <div className="journal-reflection-grid">
          <div className="journal-reflection-tile"><span>Mood</span><strong>{todayCheckInMood ? `${todayCheckInMood.emoji} ${todayCheckInMood.label}` : "Not checked in"}</strong><p>{todayCheckInEnergy ? `${todayCheckInEnergy.emoji} ${todayCheckInEnergy.label} energy` : "Add energy for better planning."}</p></div>
          <div className="journal-reflection-tile"><span>Gratitude</span><strong>{(normalizeMemoryEntry(journal[dateKey(TODAY)] || {}).gratitude || []).filter(Boolean)[0] || latestTomorrowReset?.reflection?.gratitude || "Not written yet"}</strong><p>Captured from Journal or Tomorrow Reset.</p></div>
          <div className="journal-reflection-tile"><span>Tomorrow</span><strong>{latestTomorrowReset?.reflection?.tomorrowMainThing || "No main thing yet"}</strong><p>{latestTomorrowReset ? "Saved from your reset." : "Start Tomorrow Reset to set it."}</p></div>
          <div className="journal-reflection-tile"><span>Week</span><strong>{latestWeeklyReset?.intention || latestWeeklyReset?.priorities?.[0] || "No weekly intention"}</strong><p>{latestWeeklyReset ? "Your weekly rhythm is saved." : "Run Weekly Reset when ready."}</p></div>
        </div>
      </div>

      <div className="memory-search-section">
        <input className="memory-search-input" value={memorySearch} onChange={e=>setMemorySearch(e.target.value)} placeholder="Search memories, tags, gratitude, captions…" />
      </div>

      {throwbacks.length > 0 && (
        <div className="memory-throwback-section">
          <div className="journal-entries-title">Then & Now Throwbacks ✨</div>
          <div className="memory-throwback-row">
            {throwbacks.map(([k,e]) => { const mem = normalizeMemoryEntry(e); const cover = memoryEntryCover(mem); const d = localDateFromKey(k) || new Date(TODAY); return (
              <button key={k} className="memory-throwback-card" onClick={() => setViewingKey(k)}>
                {cover ? <img src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt="Throwback"/> : <span>📔</span>}
                <strong>{formatWithDisplayTimezone(d, {month:"short",day:"numeric"})}</strong>
                <small>{mem.note ? mem.note.slice(0,42) + (mem.note.length>42?"…":"") : "A memory from before"}</small>
              </button>
            );})}
          </div>
        </div>
      )}

      {/* Monthly Journal */}
      <div className="memory-book-section">
        <div className="memory-book-head">
          <div>
            <div className="memory-book-title">{formatWithDisplayTimezone(calDate, {month:"long",year:"numeric"})} Journal</div>
            <div className="memory-book-sub">{monthPages} page{monthPages !== 1 ? "s" : ""} • {monthPhotos} photo{monthPhotos !== 1 ? "s" : ""}</div>
          </div>
          <div className="memory-book-actions">
            <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()-1); setCalDate(d); }}>‹</button>
            <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()+1); setCalDate(d); }}>›</button>
          </div>
        </div>
        <div className="memory-filter-row">
          <button className={`memory-tag-chip ${activeTag === "all" ? "selected" : ""}`} onClick={() => setActiveTag("all")}>All</button>
          {monthTags.map(tag => <button key={tag} className={`memory-tag-chip ${activeTag === tag ? "selected" : ""}`} onClick={() => setActiveTag(tag)}>#{tag}</button>)}
        </div>
        <div className="memory-page-grid">
          {calDays.filter(Boolean).map(day => {
            const key = dateKey(day);
            const rawEntry = journal[key];
            const entry = normalizeMemoryEntry(rawEntry);
            const hasEntry = hasJournalEntryForKey(journal, key);
            const matchesFilters = memoryMatchesFilters(key, rawEntry);
            const filteredOut = memoryFiltersActive && !matchesFilters;
            const moodObj = entry.mood ? JOURNAL_MOODS.find(m=>m.id===entry.mood) : null;
            const cover = memoryEntryCover(entry);
            const completedCount = completedTasksForDateKey(tasks, key).length;
            const score = dailyGameSummary(tasks, journal, events, key);
            const isFuture = day > TODAY;
            return (
              <button key={key} className={`memory-page-card ${hasEntry ? "has-memory" : ""} ${isFuture ? "future" : ""} ${filteredOut ? "filtered-out" : ""} ${memoryFiltersActive && matchesFilters ? "filter-match" : ""}`} style={hasEntry ? memoryBackgroundStyle(entry.backgroundId) : undefined} onClick={() => isFuture ? null : (hasEntry ? setViewingKey(key) : setEditing(day))}>
                {cover && <img className="memory-page-cover" src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt={cover.caption || "Memory cover"} />}
                <div className="memory-page-shade" />
                <div className="memory-page-date">{day.getDate()}</div>
                <div className="memory-page-main">
                  <span>{moodObj?.emoji || (hasEntry ? "📔" : "＋")}</span>
                  {hasEntry && <strong>{score.rank}</strong>}
                </div>
                {hasEntry && <div className="memory-page-meta">{completedCount}✓ {entry.photos.length}📷</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent entries list */}
      <div className="journal-entries-section journal-recent-list-section">
        <div className="journal-entries-title">{memoryFiltersActive ? "Matching Memories" : "Recent Entries"}</div>
        {searchableEntries
          .slice(0,10)
          .map(([key, entry]) => {
            const d = localDateFromKey(key) || new Date(TODAY);
            const mem = normalizeMemoryEntry(entry);
            const moodObj = JOURNAL_MOODS.find(m=>m.id===mem.mood);
            const cover = memoryEntryCover(mem);
            const acts = (mem.activities||[]).map(id=>activitiesCatalog.find(a=>a.id===id)).filter(Boolean);
            const completedCount = completedTasksForDateKey(tasks, key).length;
            return (
              <div key={key} className="journal-entry-card" onClick={() => setViewingKey(key)}>
                <div className="jec-left">
                  {cover ? <img className="jec-cover" src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt={cover.caption || "Memory cover"} /> : (moodObj && <span className="jec-emoji" style={{"--mc":moodObj.color}}>{moodObj.emoji}</span>)}
                </div>
                <div className="jec-body">
                  <div className="jec-date">{formatWithDisplayTimezone(d, {weekday:"short",month:"short",day:"numeric"})}</div>
                  {moodObj && <div className="jec-mood" style={{color:moodObj.color}}>{moodObj.label}</div>}
                  {acts.length>0 && <div className="jec-acts">{acts.slice(0,5).map(a=><span key={a.id}>{a.emoji}</span>)}</div>}
                  {mem.note && <div className="jec-note">{mem.note.slice(0,80)}{mem.note.length>80?"…":""}</div>}
                  {mem.gratitude?.some(g=>g) && <div className="jec-gratitude">🌸 {mem.gratitude.filter(g=>g)[0]}</div>}
                  {mem.tags?.length > 0 && <div className="jec-tags">{mem.tags.slice(0,3).map(t => <span key={t}>#{t}</span>)}</div>}
                  {mem.photos.length > 0 && <div className="jec-gratitude">📷 {mem.photos.length} photo{mem.photos.length !== 1 ? "s" : ""}</div>}
                  {completedCount > 0 && <div className="jec-gratitude">✅ {completedCount} task{completedCount !== 1 ? "s" : ""} completed</div>}
                </div>
                <div className="jec-arrow">›</div>
              </div>
            );
          })}
        {Object.keys(journal).length === 0 && (
          <div className="journal-empty">
            <div className="journal-empty-icon">📔</div>
            <div className="journal-empty-title">No entries yet</div>
            <div className="journal-empty-sub">Tap "+ Add Memory" to create your first page</div>
            <button className="tf-save" style={{marginTop:16}} onClick={() => setEditing(new Date(TODAY))}>Create memory 🌸</button>
          </div>
        )}
      </div>


      {memorySettingsOpen && (
        <div className="modal-overlay memory-settings-overlay" onClick={() => setMemorySettingsOpen(false)} role="dialog" aria-modal="true" aria-label="Memory Settings">
          <div className="entry-modal memory-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="entry-modal-header">
              <div><div className="entry-modal-date">Memory Settings</div><div className="entry-modal-sub">Manage activities, tags, backgrounds, and stickers</div></div>
              <button className="modal-close" onClick={() => setMemorySettingsOpen(false)}>✕</button>
            </div>
            <div className="entry-modal-body">
              <div className="entry-section">
                <div className="entry-section-title">Activities</div>
                {[...new Set((activitiesCatalog || []).map(a => a.group || "Custom"))].map(group => (
                  <div key={group} className="manager-group-card">
                    <div className="manager-group-head">{group}</div>
                    {(activitiesCatalog || []).filter(a => (a.group || "Custom") === group && !a.archived).map(a => (
                      <div key={a.id} className={`manager-row draggable-manager-row ${dragActivityId===a.id?"dragging":""}`} draggable onDragStart={() => setDragActivityId(a.id)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragActivityId && dragActivityId !== a.id) onReorderActivities?.(dragActivityId, a.id); setDragActivityId(null); }} onDragEnd={() => setDragActivityId(null)}>
                        <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                        <span className="manager-chip">{a.emoji} {a.label}</span>
                        <span className="manager-count">{allActivitiesUsage[a.id] || 0} uses</span>
                        <button type="button" onClick={() => { const label = window.prompt("Rename activity", a.label); if (!label?.trim()) return; const emoji = window.prompt("Emoji", a.emoji || "✨") || a.emoji || "✨"; onUpdateActivity?.(a.id, { label: label.trim(), emoji: emoji.trim() || "✨" }); }}>Edit</button>
                        <button type="button" onClick={() => { if (window.confirm(`Archive ${a.emoji || ""} ${a.label}? Old memories will keep their label.`)) onDeleteActivity?.(a.id); }}>Archive</button>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="tf-row" style={{marginTop:10}}><button className="tf-save" onClick={() => { const label = window.prompt("New activity name"); if (!label?.trim()) return; const emoji = window.prompt("Emoji", "✨") || "✨"; const group = window.prompt("Group", "Custom") || "Custom"; onAddActivity?.(label.trim(), group.trim() || "Custom", emoji.trim() || "✨"); }}>+ Add activity</button></div>
              </div>
              <div className="entry-section">
                <div className="entry-section-title">Memory Tags</div>
                {Object.keys(allTagUsage).length === 0 && <div className="scrapbook-empty-note">No tags yet. Add tags while creating a memory.</div>}
                {Object.keys(allTagUsage).sort().map(tag => (
                  <div key={tag} className="manager-row">
                    <span className="manager-chip">#{tag}</span><span className="manager-count">{allTagUsage[tag]} uses</span>
                    <button type="button" onClick={() => { const next = window.prompt("Rename memory tag", tag); if (next?.trim()) onUpdateMemoryTag?.(tag, next.trim()); }}>Rename</button>
                    <button type="button" onClick={() => { const into = window.prompt("Merge into which tag?"); if (into?.trim()) onUpdateMemoryTag?.(tag, into.trim()); }}>Merge</button>
                    <button type="button" onClick={() => { if (window.confirm(`Delete #${tag} from all memories?`)) onDeleteMemoryTag?.(tag); }}>Delete</button>
                  </div>
                ))}
              </div>
              <div className="entry-section"><div className="entry-section-title">Backgrounds</div><div className="memory-background-picker">{MEMORY_BACKGROUNDS.map(bg => <span key={bg.id} className="memory-bg-choice"><span className="memory-bg-swatch" style={bg.src ? {backgroundImage:`url(${bg.src})`} : {}} /> <span>{bg.label}</span></span>)}</div></div>
              <div className="entry-section"><div className="entry-section-title">Stickers</div>{renderStickerPackPicker(null, null, { previewOnly: true })}</div>
            </div>
          </div>
        </div>
      )}

      {/* View entry modal */}
      {viewingKey && journal[viewingKey] && (() => {
        const entry = normalizeMemoryEntry(journal[viewingKey]);
        const d = localDateFromKey(viewingKey) || new Date(TODAY);
        const moodObj = JOURNAL_MOODS.find(m=>m.id===entry.mood);
        const cover = memoryEntryCover(entry);
        const acts = (entry.activities||[]).map(id=>activitiesCatalog.find(a=>a.id===id)).filter(Boolean);
        const completedTasks = completedTasksForDateKey(tasks, viewingKey);
        const dayScore = dailyGameSummary(tasks, journal, events, viewingKey);
        return (
          <div className="modal-overlay" onClick={() => setViewingKey(null)} role="dialog" aria-modal="true" aria-label="View journal entry">
            <div className={`entry-view-modal memory-bg-${entry.backgroundId || "plain"}`} style={memoryBackgroundStyle(entry.backgroundId)} onClick={e=>e.stopPropagation()}>
              <div className="entry-modal-header">
                <div>
                  <div className="entry-modal-date">{formatWithDisplayTimezone(d, {weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
                  {moodObj && <div className="entry-view-mood" style={{color:moodObj.color}}>{moodObj.emoji} {moodObj.label}</div>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="tf-cancel" style={{fontSize:11}} onClick={() => { setEditing(d); setViewingKey(null); }}>Edit Memory</button>
                  <button className="modal-close" onClick={() => setViewingKey(null)}>✕</button>
                </div>
              </div>
              <div className="entry-view-body">
                {cover && <div className="memory-cover-hero"><img src={memoryPhotoSrc(cover, memoryImageUrls)} onError={() => refreshMemoryImage(cover)} alt={cover.caption || "Memory cover"}/>{cover.caption && <div>{cover.caption}</div>}</div>}
                {entry.tags.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Memory Tags</div><div className="memory-tag-row">{entry.tags.map(t => <span key={t} className="memory-tag-chip selected">#{t}</span>)}</div></div>}
                {entry.photos.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Photos</div><div className="memory-photo-view-grid">{entry.photos.map(p => <figure key={p.id} className="memory-photo-view-card"><img src={memoryPhotoSrc(p, memoryImageUrls)} onError={() => refreshMemoryImage(p)} alt={p.caption || "Memory photo"}/>{p.caption && <figcaption>{p.caption}</figcaption>}</figure>)}</div></div>}
                {acts.length>0 && <div className="entry-view-section"><div className="entry-section-title">Activities</div><div className="activity-chips">{acts.map(a=><span key={a.id} className="activity-chip selected">{a.emoji} {a.label}</span>)}</div></div>}
                {Object.values(entry.highlights || {}).some(Boolean) && <div className="entry-view-section"><div className="entry-section-title">Today’s Highlights ✨</div><div className="highlight-view-grid">{entry.highlights.best && <div><span>Best moment</span><strong>{entry.highlights.best}</strong></div>}{entry.highlights.win && <div><span>Biggest win</span><strong>{entry.highlights.win}</strong></div>}{entry.highlights.learned && <div><span>Learned</span><strong>{entry.highlights.learned}</strong></div>}{entry.highlights.remember && <div><span>Remember</span><strong>{entry.highlights.remember}</strong></div>}</div></div>}
                {entry.gratitude?.some(g=>g) && <div className="entry-view-section"><div className="entry-section-title">Gratitude 🌸</div>{entry.gratitude.filter(g=>g).map((g,i)=><div key={i} className="gratitude-view-item">✦ {g}</div>)}</div>}
                {entry.note && <div className="entry-view-section"><div className="entry-section-title">Journal</div><div className="entry-view-note">{entry.note}</div></div>}
                {entry.blocks.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Scrapbook Page 🎀</div><div className="scrapbook-view-list">{entry.blocks.map(b => { const blockPhotos = (b.photoIds || []).map(id => entry.photos.find(p => p.id === id)).filter(Boolean); return <div key={b.id} className={`scrapbook-view-block block-${b.type}`}>{b.type === "text" && <div className="entry-view-note">{b.text}</div>}{b.type === "quote" && <blockquote>{b.text}</blockquote>}{b.type === "sticker" && <div className="scrapbook-sticker-stage"><div className={`scrapbook-sticker-view ${b.stickerAsset ? "asset" : ""}`} style={{ left:`${b.x ?? 50}%`, top:`${b.y ?? 50}%` }}>{b.stickerAsset ? <img src={b.stickerAsset} alt="Sticker"/> : (b.sticker || "🌸")}</div></div>}{b.type === "divider" && <div className="scrapbook-divider-preview">✦ ✦ ✦</div>}{b.type === "photoGrid" && <><div className="memory-photo-view-grid scrapbook-photo-grid">{blockPhotos.map(p => <figure key={p.id} className="memory-photo-view-card"><img src={memoryPhotoSrc(p, memoryImageUrls)} onError={() => refreshMemoryImage(p)} alt={p.caption || "Memory photo"}/>{p.caption && <figcaption>{p.caption}</figcaption>}</figure>)}</div>{b.caption && <div className="scrapbook-grid-caption">{b.caption}</div>}</>}</div>; })}</div></div>}
                <div className="entry-view-section daily-score-section">
                  <div className="entry-section-title">Daily Score 🌸</div>
                  <div className="daily-score-card">
                    <div className="daily-score-main"><span className="daily-score-rank">{dayScore.rank}</span><span className="daily-score-num">{dayScore.score}/100</span></div>
                    <div className="daily-score-lines">
                      <span>✅ {dayScore.completed.length} task{dayScore.completed.length !== 1 ? "s" : ""}</span>
                      <span>🎯 {dayScore.highDone} priority</span>
                      <span>📔 {dayScore.journalDone ? "Journal done" : "No journal"}</span>
                    </div>
                  </div>
                </div>
                {completedTasks.length > 0 && (
                  <div className="entry-view-section completed-tasks-section">
                    <div className="entry-section-title">Completed Tasks ✅</div>
                    <div className="completed-task-list">
                      {completedTasks.map(t => (
                        <div key={t.id} className="completed-task-item">
                          <span className="completed-task-check">✓</span>
                          <div className="completed-task-body">
                            <div className="completed-task-title">{t.title}</div>
                            <div className="completed-task-meta">{formatTaskDuration(t.duration)}{t.priority ? ` • ${PRIORITIES.find(p=>p.id===t.priority)?.label || t.priority}` : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {editing && <DayEntryModal date={editing} entry={journal[dateKey(editing)]} onSave={saveEntry} onClose={() => setEditing(null)} activitiesCatalog={activitiesCatalog} memoryTagsCatalog={memoryTagsCatalog} onAddActivity={onAddActivity} onUpdateActivity={onUpdateActivity} onDeleteActivity={onDeleteActivity} onAddMemoryTag={onAddMemoryTag} onUpdateMemoryTag={onUpdateMemoryTag} onDeleteMemoryTag={onDeleteMemoryTag} onReorderActivities={onReorderActivities} userId={userId} imageUrls={memoryImageUrls} />}
    </div>
  );
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────
function AddEventModal({ onClose, onSave, defaultDate, calendars = CALENDARS, categories = CATEGORIES }) {
  const now = new Date(defaultDate); now.setMinutes(0,0,0);
  const end = new Date(now); end.setHours(end.getHours()+1);
  const [form, setForm] = useState({
    title: "", startDate: toDateInput(defaultDate), endDate: toDateInput(defaultDate), startTime: toTimeInputValue(now), endTime: toTimeInputValue(end), allDay: false,
    calendar: calendars.find(c => c.id === "work")?.id || calendars[0]?.id || "personal", category: "meeting", fixed: false, notes: "", color: null, recurrence: null, reminder: { type: "minutes", minutesBefore: 10 }
  });
  const [err, setErr] = useState("");
  async function handleSave() {
    if (!form.title.trim()) { setErr("Please enter a title."); return; }
    const start = form.allDay ? applyDateAndTime(form.startDate, "00:00") : applyDateAndTime(form.startDate, form.startTime);
    const endBase = form.allDay ? endOfDay(applyDateAndTime(form.endDate, "00:00")) : applyDateAndTime(form.endDate, form.endTime);
    if (endBase <= start) { setErr("End must be after start."); return; }
    const placed = await onSave({ id:"e"+uid(), title:form.title.trim(), start, end:endBase, allDay: form.allDay, calendar:form.calendar, category:form.category, fixed:form.fixed, notes:form.notes, color:form.color, recurrence:form.recurrence, reminder:form.reminder });
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
          {err && <div style={{color:"#C04040",fontSize:12,fontWeight:700}}>⚠️ {err}</div>}
        </div>
        <div className="modal-footer"><div/><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={handleSave}>Save event</button></div></div>
      </div>
    </div>
  );
}


function hourLabel(hour) {
  const h = Math.max(0, Math.min(23, Number(hour) || 0));
  const display = h % 12 || 12;
  return `${display}${h < 12 ? "am" : "pm"}`;
}

function TaskScheduleModal({ task, onClose, onSchedule, workStart = 9, workEnd = 19 }) {
  const [mode, setMode] = useState("today");
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Schedule task">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><strong>📅 Schedule this task</strong><div style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>{task?.title}</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="modal-row"><label>Find slot</label><select className="modal-select" value={mode} onChange={e => setMode(e.target.value)}><option value="today">Today</option><option value="week">This week</option><option value="deadline">Before deadline</option></select></div>
          <div className="settings-section-desc">Tempo will look for slots inside your Work Hours ({hourLabel(workStart)}–{hourLabel(workEnd)}) while respecting meal breaks and planning buffers.</div>
        </div>
        <div className="modal-footer"><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={() => onSchedule(mode)}>Schedule task</button></div>
      </div>
    </div>
  );
}

function DailyPlanModal({ plan, onClose, onApply, onRegenerate, onMoveRemaining, onMoveRemainingToWeek, onSkipLowPriority, mealBreaks = DEFAULT_MEAL_BREAKS, planningRules = DEFAULT_PLANNING_RULES }) {
  const [selectedMode, setSelectedMode] = useState(normalizePlanningMode(plan?.mode));
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => plan?.selectedTaskIds || (plan?.allPlanningTasks || []).map(t => t.id));
  useEffect(() => {
    setSelectedMode(normalizePlanningMode(plan?.mode));
    setSelectedTaskIds(plan?.selectedTaskIds || (plan?.allPlanningTasks || []).map(t => t.id));
  }, [plan?.generatedAt, plan?.mode]);
  if (!plan) return null;
  const modeMeta = planningModeMeta(selectedMode);
  const activeRules = normalizePlanningRules(plan.planningRules || planningRules);
  const remainingTasks = plan.remainingTasks || plan.unscheduled || [];
  const lifestyleBlocks = plan.lifestyleBlocks || [];
  const skippedLowPriority = plan.skippedLowPriority || [];
  const allPlanningTasks = plan.allPlanningTasks || [];
  const excludedByChoice = plan.excludedByChoice || [];
  const selectedCount = selectedTaskIds.length;
  const energyMeta = plan.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === plan.energy) : null;
  const moodMeta = plan.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === plan.mood) : null;
  const regenerateWithSelection = (nextIds = selectedTaskIds, nextMode = selectedMode, extra = {}) => {
    onRegenerate?.(plan, [], nextMode, {
      skipLowPriorityToday: Boolean(extra.skipLowPriorityToday ?? plan.skipLowPriorityToday),
      includedTaskIds: nextIds,
    });
  };
  const handleMode = mode => {
    const nextMode = normalizePlanningMode(mode);
    setSelectedMode(nextMode);
    regenerateWithSelection(selectedTaskIds, nextMode);
  };
  const toggleTaskPlanning = id => {
    const nextIds = selectedTaskIds.includes(id) ? selectedTaskIds.filter(x => x !== id) : [...selectedTaskIds, id];
    setSelectedTaskIds(nextIds);
    regenerateWithSelection(nextIds, selectedMode);
  };
  const selectAllTasks = () => {
    const nextIds = allPlanningTasks.map(t => t.id);
    setSelectedTaskIds(nextIds);
    regenerateWithSelection(nextIds, selectedMode);
  };
  const clearSelectedTasks = () => {
    setSelectedTaskIds([]);
    regenerateWithSelection([], selectedMode);
  };
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Plan today">
      <div className="modal day-plan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><strong>✨ Plan Today</strong><div style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>{fmtDate(plan.date)}</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="plan-summary">Planning <strong>{selectedCount}</strong> of <strong>{allPlanningTasks.length}</strong> open task{allPlanningTasks.length === 1 ? "" : "s"} with <strong>{Math.round(plan.freeMinutes / 60 * 10) / 10}</strong> free hours today.</div>
          <div className="plan-context-card">
            <div><strong>{modeMeta.emoji} {modeMeta.label}</strong><span>{modeMeta.desc}</span></div>
            <div><strong>{energyMeta ? `${energyMeta.emoji} ${energyMeta.label} energy` : "Energy not set"}</strong><span>{moodMeta ? `${moodMeta.emoji} Feeling ${moodMeta.label}` : "Add a check-in for smarter planning"}</span></div>
          </div>
          <div className="planning-mode-grid">
            {PLANNING_MODES.map(mode => <button key={mode.id} className={`planning-mode-btn ${selectedMode === mode.id ? "active" : ""}`} onClick={() => handleMode(mode.id)}><span>{mode.emoji}</span><strong>{mode.label}</strong><small>{mode.desc}</small></button>)}
          </div>
          {allPlanningTasks.length > 0 && <div className="plan-task-picker">
            <div className="plan-task-picker-head"><div><strong>Choose tasks to plan</strong><span>Tick what you want Tempo to schedule today.</span></div><div><button className="mini-move-btn" onClick={selectAllTasks} disabled={selectedCount === allPlanningTasks.length}>All</button><button className="mini-move-btn" onClick={clearSelectedTasks} disabled={selectedCount === 0}>None</button></div></div>
            <div className="plan-task-picker-list">
              {allPlanningTasks.map(task => {
                const checked = selectedTaskIds.includes(task.id);
                return <label key={task.id} className={`plan-task-choice ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={() => toggleTaskPlanning(task.id)} /><span><strong>{task.title}</strong><small>{task.priority || "medium"} priority · {taskDurationToMinutes(task.duration || 30)} min{task.deadline ? ` · due ${task.deadline}` : ""}</small></span></label>;
              })}
            </div>
          </div>}
          <div className="plan-break-note">Protected: {normalizeMealBreaks(mealBreaks).filter(b => b.enabled).map(b => `${b.label} ${b.start}–${b.end}`).join(", ") || "no meal breaks"}{lifestyleBlocks.length ? ` · ${lifestyleBlocks.length} ritual/habit block${lifestyleBlocks.length === 1 ? "" : "s"}` : ""}. Buffer: {activeRules.bufferMinutes} min. Capacity: {activeRules.maxPlanMinutes} min.</div>
          {plan.suggestions.length ? <div className="plan-list">{plan.suggestions.map(item => <div key={item.task.id} className="plan-row"><span>{fmt(item.start)} — {item.task.title}</span><strong>{item.minutes}min</strong></div>)}</div> : <div className="task-card-empty">{selectedCount ? "No suitable free slots found for the selected tasks today." : "Tick at least one task for Tempo to plan today."}</div>}
          {lifestyleBlocks.length > 0 && <div className="plan-soft-blocks"><strong>Soft commitments protected</strong>{lifestyleBlocks.slice(0, 4).map(block => <span key={block.id}>{fmt(block.start)} · {block.title.replace(/^Ritual: |^Habit: /, "")}</span>)}{lifestyleBlocks.length > 4 && <span>+{lifestyleBlocks.length - 4} more</span>}</div>}
          {excludedByChoice.length > 0 && <div className="plan-skip-note">Not planned by choice: {excludedByChoice.map(t => t.title).join(", ")}</div>}
          {remainingTasks.length > 0 && <div className="plan-warning">Could not fit: {remainingTasks.map(t => t.title).join(", ")}</div>}
          {skippedLowPriority.length > 0 && <div className="plan-skip-note">Skipped low-priority today: {skippedLowPriority.map(t => t.title).join(", ")}</div>}
        </div>
        <div className="modal-footer day-plan-footer"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="tf-cancel" onClick={() => regenerateWithSelection(selectedTaskIds, selectedMode)}>Regenerate plan</button><button className="tf-cancel" onClick={() => onSkipLowPriority?.(plan, [], selectedMode, selectedTaskIds)} disabled={Boolean(plan.skipLowPriorityToday)}>Skip low-priority today</button>{remainingTasks.length > 0 && <button className="tf-cancel" onClick={() => onMoveRemaining?.(plan)}>Move remaining to tomorrow</button>}{remainingTasks.length > 0 && <button className="tf-cancel" onClick={() => onMoveRemainingToWeek?.(plan)}>Move remaining to this week</button>}</div><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" disabled={!plan.suggestions.length} onClick={() => onApply(plan)}>Apply plan</button></div></div>
      </div>
    </div>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ events, tasks, categories = CATEGORIES, onClose, onEventClick, onTaskEdit, onNavigate }) {
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
              <div className="search-empty">No results for "{query}"</div>
            )}

            {matchedEvents.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">📅 Events ({matchedEvents.length})</div>
                {matchedEvents.map(e => {
                  const cal = calendars.find(c => c.id === e.calendar);
                  const color = e.color || cal?.color || "#FF7BAC";
                  return (
                    <div key={e.id} className="search-result-row" onClick={() => { onNavigate(e.start); onEventClick(e); onClose(); }}>
                      <div className="search-result-dot" style={{ background: color }} />
                      <div className="search-result-body">
                        <div className="search-result-title">{highlightMatch(e.title, q)}</div>
                        <div className="search-result-meta">
                          {formatWithDisplayTimezone(e.start, { weekday: "short", month: "short", day: "numeric" })} · {fmt(e.start)}–{fmt(e.end)}
                          {e._recurring && <span className="search-recurring-badge">↻ recurring</span>}
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

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ events, tasks, onClose, onUpdateEvents, onUpdateTasks, onAddEvent }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: buildGreeting(events, tasks) }]);
  const [input, setInput]       = useState("");
  const [pending, setPending]   = useState(null);
  const bottomRef = useRef(null);
  // Use refs so send() always reads current events/tasks without needing them in its closure
  const eventsRef = useRef(events);
  const tasksRef  = useRef(tasks);
  const pendingRef = useRef(pending);
  useEffect(() => { eventsRef.current  = events;  }, [events]);
  useEffect(() => { tasksRef.current   = tasks;   }, [tasks]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  function send(ov) {
    const text = (ov ?? input).trim(); if (!text) return;
    setInput(""); setMessages(p => [...p, { role: "user", text }]);
    // CHAT_REPLY_DELAY_MS adds a brief pause to feel natural — purely cosmetic
    setTimeout(() => {
      const { text: rt, newEv, newTk, newP } = processMessage(text, eventsRef.current, tasksRef.current, pendingRef.current);
      setMessages(p => [...p, { role: "assistant", text: rt }]);
      if (newEv && Array.isArray(newEv)) onUpdateEvents(newEv);
      if (newTk) onUpdateTasks(newTk);
      setPending(newP || null);
    }, CHAT_REPLY_DELAY_MS);
  }
  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
  const sugg = ["What's on today?","When am I free?","Show my tasks","How busy am I?","What's next?","Help"];
  return (
    <div className="chat-panel">
      <div className="chat-header"><div className="chat-title-row"><div className="chat-avatar">🌸</div><div><div className="chat-name">Tempo Assistant</div><div className="chat-status">● always here</div></div></div><button className="chat-close" onClick={onClose} aria-label="Close chat">✕</button></div>
      <div className="chat-messages">
        {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.role === "assistant" && <div className="msg-avatar">🌸</div>}<div className="msg-bubble" style={{ whiteSpace: "pre-line" }}>{m.text}</div></div>)}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 2 && <div className="suggestions">{sugg.map((s, i) => <button key={i} className="suggestion-pill" onClick={() => send(s)}>{s}</button>)}</div>}
      <div className="chat-input-row"><textarea className="chat-input" placeholder="Ask about your schedule..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} rows={1} aria-label="Chat input" /><button className="chat-send" onClick={() => send()} disabled={!input.trim()} aria-label="Send message"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button></div>
    </div>
  );
}



function DailyCheckInModal({ date = TODAY, checkIn, onSave, onClose }) {
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


function DailyAffirmationCard({ affirmations = DEFAULT_AFFIRMATIONS, compact = false }) {
  const todayAffirmation = affirmationForDate(affirmations, TODAY);
  if (!todayAffirmation) return null;
  const category = affirmationCategoryById(todayAffirmation.category);
  return (
    <section className={`phase-card affirmation-daily-card ${compact ? "compact" : ""}`}>
      <div className="phase-card-head"><span>Daily Affirmation</span><small>Randomized daily</small></div>
      <div className="affirmation-quote-row">
        <span className="affirmation-quote-icon">{category.emoji}</span>
        <div>
          <blockquote>“{todayAffirmation.text}”</blockquote>
          <small>{category.label} · Today’s gentle reminder</small>
        </div>
      </div>
    </section>
  );
}

function AffirmationEditorModal({ affirmation, onClose, onSave, onDelete }) {
  const initial = affirmation ? normalizeAffirmation(affirmation) : normalizeAffirmation({ id: "affirm-" + uid(), text: "", category: "calm", favorite: false, source: "custom" });
  const [form, setForm] = useState(initial);
  const canDelete = Boolean(affirmation?.id && affirmation?.source === "custom");
  function saveForm() {
    const text = form.text.trim();
    if (!text) return;
    onSave?.({ ...form, text, source: "custom" });
    onClose?.();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Affirmation editor">
      <div className="affirmation-modal" onClick={e => e.stopPropagation()}>
        <div className="checkin-modal-head">
          <div>
            <div className="phase-kicker">Affirmation</div>
            <h2>{affirmation ? "Edit your affirmation" : "Create a custom affirmation"}</h2>
            <p>Keep it grounded, kind, and simple enough to return to daily.</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="checkin-section">
          <div className="checkin-section-title">Text</div>
          <textarea className="checkin-note-input affirmation-textarea" rows={4} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Example: I can move through today calmly and clearly." />
        </div>
        <div className="checkin-section">
          <div className="checkin-section-title">Category</div>
          <div className="affirmation-category-grid">
            {AFFIRMATION_CATEGORIES.map(cat => (
              <button type="button" key={cat.id} className={`affirmation-category ${form.category === cat.id ? "active" : ""}`} onClick={() => setForm(f => ({ ...f, category: cat.id }))}>
                <span>{cat.emoji}</span>{cat.label}
              </button>
            ))}
          </div>
        </div>
        <label className="affirmation-inline-toggle">
          <input type="checkbox" checked={Boolean(form.favorite)} onChange={e => setForm(f => ({ ...f, favorite: e.target.checked }))} />
          <span>Save as favorite</span>
        </label>
        <div className="modal-footer">
          {canDelete && <button className="modal-delete" onClick={() => { onDelete?.(affirmation); onClose?.(); }}>Delete</button>}
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-save" disabled={!form.text.trim()} onClick={saveForm}>{affirmation ? "Save affirmation" : "Create affirmation"}</button>
        </div>
      </div>
    </div>
  );
}

function AffirmationsPage({ affirmations = DEFAULT_AFFIRMATIONS, affirmationSettings = DEFAULT_AFFIRMATION_SETTINGS, onToggleFavorite, onSaveAffirmation, onDeleteAffirmation, onUpdateSettings }) {
  const normalized = normalizeAffirmations(affirmations);
  const settings = normalizeAffirmationSettings(affirmationSettings);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [editing, setEditing] = useState(null);
  const daily = affirmationForDate(normalized, TODAY, shuffleOffset);
  const favorites = normalized.filter(a => a.favorite);
  const custom = normalized.filter(a => a.source === "custom");
  const filtered = normalized.filter(a => selectedCategory === "all" || a.category === selectedCategory);
  const category = daily ? affirmationCategoryById(daily.category) : AFFIRMATION_CATEGORIES[0];
  return (
    <div className="phase-page affirmations-page">
      <div className="affirmation-hero">
        <div>
          <div className="phase-kicker">Affirmations</div>
          <h1>One gentle thought for today</h1>
          <p>Grounded reminders for your daily rhythm. Favorite the ones that help, or write your own.</p>
        </div>
        <button className="tf-save phase-primary" onClick={() => setEditing({ _new: true })}>＋ New affirmation</button>
      </div>

      <section className="affirmation-feature-card">
        <div className="affirmation-feature-top">
          <span className="affirmation-feature-emoji">{category.emoji}</span>
          <div>
            <small>{category.label} · Daily affirmation</small>
            <blockquote>“{daily?.text || "I can move through today calmly and clearly."}”</blockquote>
          </div>
        </div>
        <div className="affirmation-feature-actions">
          <button className={`affirmation-favorite-btn ${daily?.favorite ? "active" : ""}`} onClick={() => daily && onToggleFavorite?.(daily.id)}>{daily?.favorite ? "♥ Favorited" : "♡ Favorite"}</button>
          <button className="tf-cancel" onClick={() => setShuffleOffset(v => v + 1)}>Shuffle</button>
        </div>
      </section>

      <div className="affirmation-grid-main">
        <section className="phase-card affirmation-settings-card">
          <div className="phase-card-head"><span>Reminder</span><small>optional</small></div>
          <p className="phase-copy">Get a soft prompt to read your affirmation. This saves your preference for the notification revamp.</p>
          <div className="affirmation-reminder-row">
            <label className="affirmation-inline-toggle"><input type="checkbox" checked={settings.reminderEnabled} onChange={e => onUpdateSettings?.({ ...settings, reminderEnabled: e.target.checked })} /><span>Daily reminder</span></label>
            <input className="modal-select modal-time" type="time" value={settings.reminderTime} onChange={e => onUpdateSettings?.({ ...settings, reminderTime: e.target.value })} />
          </div>
        </section>
        <section className="phase-card affirmation-settings-card">
          <div className="phase-card-head"><span>Your collection</span><small>{normalized.length} total</small></div>
          <div className="affirmation-stats-grid">
            <div><strong>{favorites.length}</strong><span>favorites</span></div>
            <div><strong>{custom.length}</strong><span>custom</span></div>
            <div><strong>{AFFIRMATION_CATEGORIES.length}</strong><span>categories</span></div>
          </div>
        </section>
      </div>

      <div className="affirmation-filter-row">
        <button className={selectedCategory === "all" ? "active" : ""} onClick={() => setSelectedCategory("all")}>All</button>
        {AFFIRMATION_CATEGORIES.map(cat => <button key={cat.id} className={selectedCategory === cat.id ? "active" : ""} onClick={() => setSelectedCategory(cat.id)}>{cat.emoji} {cat.label}</button>)}
      </div>

      <div className="affirmation-list-grid">
        {filtered.map(item => {
          const cat = affirmationCategoryById(item.category);
          return (
            <article key={item.id} className={`affirmation-list-card ${item.favorite ? "favorite" : ""}`}>
              <div className="affirmation-list-top"><span>{cat.emoji}</span><small>{cat.label}{item.source === "custom" ? " · Custom" : ""}</small></div>
              <p>“{item.text}”</p>
              <div className="affirmation-list-actions">
                <button onClick={() => onToggleFavorite?.(item.id)}>{item.favorite ? "♥" : "♡"}</button>
                {item.source === "custom" && <button onClick={() => setEditing(item)}>Edit</button>}
              </div>
            </article>
          );
        })}
      </div>
      {editing && <AffirmationEditorModal affirmation={editing._new ? null : editing} onClose={() => setEditing(null)} onSave={onSaveAffirmation} onDelete={onDeleteAffirmation} />}
    </div>
  );
}

function SyncStatusPill({ syncStatus, onRetry, pendingLocalChanges = 0, lastSyncedAt = null }) {
  const status = syncStatus?.status || "saved";
  const label = pendingLocalChanges > 0 ? "Unsaved Changes" : (syncStatus?.message || (status === "saving" ? "Saving…" : status === "failed" ? "Sync failed" : status === "offline" ? "Saved on this device only" : "Saved to cloud"));
  const icon = status === "saving" ? "⏳" : status === "failed" ? "⚠️" : status === "offline" ? "📱" : "✓";
  return (
    <button type="button" className={`sync-pill sync-${status} ${pendingLocalChanges > 0 ? "sync-pending" : ""}`} onClick={status === "failed" ? onRetry : undefined} title={status === "failed" ? "Tap to retry cloud sync" : label}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );
}

function TodayLitePage({ summary, events = [], tasks = [], journal = {}, dailyCheckIns = [], affirmations = DEFAULT_AFFIRMATIONS, categories = CATEGORIES, habits = [], habitCompletions = [], onOpenCalendar, onOpenTasks, onOpenJournal, onOpenCheckIn, onOpenAffirmations, onFavoriteAffirmation, onOpenHabits, onPlanToday, onTomorrowReset, onToggleHabit, onIncrementHabit, onToggleTask, onEditTask }) {
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
  const completedHabits = todayHabitsAll.filter(h => habitProgress(h, habitCompletions, TODAY).complete).length;
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

function RitualReminderEditor({ value, onChange }) {
  const reminder = normalizeRitualReminder(value);
  const presetId = ritualReminderPresetId(reminder);
  const setPreset = id => {
    const preset = RITUAL_REMINDER_PRESETS.find(p => p.id === id);
    if (id === "none") return onChange({ type: "none", minutesBefore: null });
    if (id === "at") return onChange({ type: "at", minutesBefore: 0 });
    if (id === "custom") return onChange({ type: "custom", minutesBefore: reminder.minutesBefore ?? 15 });
    return onChange({ type: "minutes", minutesBefore: preset?.minutesBefore ?? 10 });
  };
  return (
    <div className="reminder-editor">
      <select className="modal-select" value={presetId} onChange={e => setPreset(e.target.value)}>
        {RITUAL_REMINDER_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
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

function RitualModal({ ritual, onClose, onSave, onDelete, onArchive }) {
  const isTemplateDraft = Boolean(ritual?._templateDraft);
  const isExistingRitual = Boolean(ritual?.id && !isTemplateDraft);
  const initial = ritual ? normalizeRitual(ritual) : normalizeRitual({ id: "ritual-" + uid(), name: "New Ritual", emoji: "🕯️", category: "personal", steps: [{ id: "step-1", text: "First step" }], scheduledTime: "08:30", repeatDays: [1,2,3,4,5], estimatedMinutes: 15, reminder: { type: "at", minutesBefore: 0 }, color: "#FF7BAC" });
  const [form, setForm] = useState(initial);
  const days = ["S","M","T","W","T","F","S"];
  const updateStep = (id, text) => setForm(f => ({ ...f, steps: f.steps.map(s => s.id === id ? { ...s, text } : s) }));
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { id: "step-" + uid(), text: "" }] }));
  const removeStep = id => setForm(f => ({ ...f, steps: f.steps.length <= 1 ? f.steps : f.steps.filter(s => s.id !== id) }));
  const toggleDay = day => setForm(f => {
    const set = new Set(f.repeatDays || []);
    if (set.has(day)) set.delete(day); else set.add(day);
    const next = [...set].sort((a,b) => a-b);
    return { ...f, repeatDays: next.length ? next : [day] };
  });
  const saveForm = () => {
    const clean = normalizeRitual({ ...form, steps: form.steps.map((s, i) => ({ ...s, text: String(s.text || "").trim() || `Step ${i + 1}` })) });
    if (!clean.name.trim()) return;
    onSave(clean);
  };
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Ritual editor">
      <div className="modal ritual-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span style={{ fontWeight: 900 }}>{isTemplateDraft ? "Customize Template" : isExistingRitual ? "Edit Ritual" : "Create Ritual"}</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="ritual-form-title-row">
            <input className="modal-select ritual-emoji-input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value.slice(0, 4) || "🕯️" }))} aria-label="Ritual emoji" />
            <input className="modal-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ritual name" />
          </div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{RITUAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select></div>
          <div className="modal-row"><label>Time</label><input type="time" className="modal-select" value={form.scheduledTime} onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}/></div>
          <div className="modal-row"><label>Duration</label><input type="number" min={1} max={360} className="modal-select" value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: Math.max(1, Number(e.target.value) || 15) }))}/></div>
          <div className="modal-row"><label>Color</label><input type="color" className="modal-select" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}/></div>
          <div className="modal-row modal-row-full"><label>Repeat days</label><div className="weekday-picker ritual-weekday-picker">{days.map((d,i) => <button type="button" key={i} className={`weekday-btn ${form.repeatDays?.includes(i) ? "active" : ""}`} onClick={() => toggleDay(i)}>{d}</button>)}</div></div>
          <div className="modal-row"><label>Reminder</label><RitualReminderEditor value={form.reminder} onChange={reminder => setForm(f => ({ ...f, reminder }))} /></div>
          <div className="ritual-steps-editor">
            <div className="phase-card-head"><span>Checklist steps</span><button type="button" onClick={addStep}>＋ Add step</button></div>
            {form.steps.map((step, index) => (
              <div key={step.id} className="ritual-step-edit-row">
                <span>{index + 1}</span>
                <input className="modal-input" value={step.text} onChange={e => updateStep(step.id, e.target.value)} placeholder="Step" />
                <button type="button" className="mini-move-btn" onClick={() => removeStep(step.id)} disabled={form.steps.length <= 1}>×</button>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          {isExistingRitual && <button className="tf-cancel" onClick={() => onArchive(ritual, !ritual.archived)}>{ritual.archived ? "Restore" : "Archive"}</button>}
          {isExistingRitual && <button className="tf-delete" onClick={() => onDelete(ritual)}>Delete</button>}
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-save" onClick={saveForm}>Save Ritual</button>
        </div>
      </div>
    </div>
  );
}

function RitualCard({ ritual, completion, progress, onToggleStep, onSkip, onComplete, onEdit, compact = false }) {
  const category = RITUAL_CATEGORIES.find(c => c.id === ritual.category);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const renderChecklist = () => (
    <div className="ritual-step-list ritual-focus-step-list">
      {(ritual.steps || []).map(step => {
        const checked = (completion?.completedSteps || []).includes(step.id);
        return <label key={step.id} className={`ritual-step ${checked ? "checked" : ""}`}><input type="checkbox" checked={checked} disabled={progress.skipped} onChange={() => onToggleStep(ritual, step.id)} /><span>{step.text}</span></label>;
      })}
    </div>
  );
  return (
    <div className={`ritual-card ${progress.completed ? "ritual-complete" : ""} ${progress.skipped ? "ritual-skipped" : ""}`} style={{ "--ritual-color": ritual.color || "var(--accent)" }}>
      <div className="ritual-card-top">
        <div className="ritual-title-wrap"><div className="ritual-emoji">{ritual.emoji}</div><div><h3>{ritual.name}</h3><p>{category?.emoji || "✨"} {category?.label || "Ritual"} · {ritual.scheduledTime} · {ritual.estimatedMinutes} min</p></div></div>
        {!compact && <button className="tf-cancel ritual-edit-btn" onClick={() => onEdit(ritual)}>Edit</button>}
      </div>
      <div className="ritual-progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
      <div className="ritual-progress-label">{progress.skipped ? "Skipped today" : progress.completed ? "Complete for today ✨" : `${progress.done}/${progress.total} steps done`}</div>
      {compact ? (
        <div className="ritual-step-list">
          {(ritual.steps || []).slice(0, 3).map(step => {
            const checked = (completion?.completedSteps || []).includes(step.id);
            return <label key={step.id} className={`ritual-step ${checked ? "checked" : ""}`}><input type="checkbox" checked={checked} disabled={progress.skipped} onChange={() => onToggleStep(ritual, step.id)} /><span>{step.text}</span></label>;
          })}
          {(ritual.steps || []).length > 3 && <button type="button" className="ritual-open-checklist" onClick={() => setChecklistOpen(true)}>Open full checklist · +{ritual.steps.length - 3} more</button>}
        </div>
      ) : renderChecklist()}
      {!compact && <div className="ritual-card-actions"><button className="tf-cancel" onClick={() => onSkip(ritual)}>{progress.skipped ? "Undo skip" : "Skip today"}</button><button className="tf-cancel ritual-open-checklist" onClick={() => setChecklistOpen(true)}>Open checklist</button><button className="tf-save" onClick={() => onComplete(ritual)}>Mark complete</button></div>}
      {checklistOpen && (
        <div className="ritual-focus-overlay" role="dialog" aria-modal="true" aria-label={`${ritual.name} checklist`} onClick={() => setChecklistOpen(false)}>
          <div className="ritual-focus-sheet" onClick={e => e.stopPropagation()} style={{ "--ritual-color": ritual.color || "var(--accent)" }}>
            <div className="ritual-focus-head">
              <div className="ritual-title-wrap"><div className="ritual-emoji">{ritual.emoji}</div><div><h3>{ritual.name}</h3><p>{progress.skipped ? "Skipped today" : progress.completed ? "Complete for today ✨" : `${progress.done}/${progress.total} steps done`}</p></div></div>
              <button className="modal-close" onClick={() => setChecklistOpen(false)}>✕</button>
            </div>
            <div className="ritual-progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
            {renderChecklist()}
            <div className="ritual-focus-actions"><button className="tf-cancel" onClick={() => onSkip(ritual)}>{progress.skipped ? "Undo skip" : "Skip today"}</button><button className="tf-save" onClick={() => { onComplete(ritual); setChecklistOpen(false); }}>Mark complete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function RitualTemplateLibrary({ rituals = [], onUseTemplate, onCustomizeTemplate }) {
  const [filter, setFilter] = useState("all");
  const normalized = normalizeRituals(rituals);
  const categories = ["all", ...RITUAL_CATEGORIES.map(c => c.id)];
  const filtered = RITUAL_TEMPLATES.filter(t => filter === "all" || t.category === filter);
  const hasTemplate = template => normalized.some(r => !r.deletedAt && !r.archived && (r.templateId === template.id || String(r.name || "").trim().toLowerCase() === String(template.name || "").trim().toLowerCase()));
  return (
    <div className="phase-card phase-wide-card ritual-section-card ritual-template-section">
      <div className="phase-card-head ritual-template-head">
        <div><span>Template Library</span><small>Start with a ready-made ritual, then customize it.</small></div>
        <div className="ritual-template-filters">
          {categories.map(id => {
            const cat = RITUAL_CATEGORIES.find(c => c.id === id);
            return <button key={id} className={`mini-pill ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{id === "all" ? "All" : `${cat?.emoji || "✨"} ${cat?.label || id}`}</button>;
          })}
        </div>
      </div>
      <div className="ritual-template-grid">
        {filtered.map(template => {
          const cat = RITUAL_CATEGORIES.find(c => c.id === template.category);
          const alreadyAdded = hasTemplate(template);
          return (
            <div key={template.id} className={`ritual-template-card ${alreadyAdded ? "template-added" : ""}`} style={{ "--ritual-color": template.color || "var(--accent)" }}>
              <div className="ritual-template-top">
                <div className="ritual-template-emoji">{template.emoji}</div>
                <div><h3>{template.name}</h3><p>{cat?.emoji || "✨"} {cat?.label || "Ritual"} · {template.scheduledTime} · {template.estimatedMinutes} min</p></div>
              </div>
              <div className="ritual-template-desc">{template.description}</div>
              <div className="ritual-template-steps">
                {(template.steps || []).slice(0, 3).map(step => <span key={step}>✓ {step}</span>)}
                {(template.steps || []).length > 3 && <span>+{template.steps.length - 3} more steps</span>}
              </div>
              {alreadyAdded && <div className="template-added-badge">Already in your rituals</div>}
              <div className="ritual-template-actions">
                <button className="tf-cancel" onClick={() => onCustomizeTemplate(template)}>Customize</button>
                <button className="tf-save" onClick={() => onUseTemplate(template)}>{alreadyAdded ? "Add another" : "Use template"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RitualsPage({ rituals = [], completions = [], onAdd, onEdit, onDelete, onArchive, onToggleStep, onSkip, onComplete }) {
  const [modalRitual, setModalRitual] = useState(null);
  const normalized = normalizeRituals(rituals);
  const active = normalized.filter(r => !r.archived && !r.deletedAt);
  const archived = normalized.filter(r => r.archived && !r.deletedAt);
  const todayRituals = active.filter(r => ritualRunsOnDate(r, TODAY)).sort((a,b) => String(a.scheduledTime).localeCompare(String(b.scheduledTime)));
  const otherRituals = active.filter(r => !ritualRunsOnDate(r, TODAY)).sort((a,b) => String(a.scheduledTime).localeCompare(String(b.scheduledTime)));
  const saveRitual = ritual => {
    ritual.id && rituals.some(r => r.id === ritual.id) ? onEdit(ritual.id, ritual) : onAdd(ritual);
    setModalRitual(null);
  };
  const useTemplate = template => onAdd(ritualFromTemplate(template, rituals));
  const customizeTemplate = template => setModalRitual({ ...ritualFromTemplate(template, rituals), _templateDraft: true });
  const deleteRitual = ritual => { onDelete(ritual); setModalRitual(null); };
  return (
    <div className="phase-page rituals-page">
      <div className="phase-hero ritual-hero">
        <div><div className="phase-kicker">Rituals</div><h1>🕯️ Build your daily rhythm</h1><p>Create soft repeatable routines for mornings, nights, resets, and weekly planning.</p></div>
        <button className="tf-save phase-primary" onClick={() => setModalRitual({})}>＋ Create Ritual</button>
      </div>
      <div className="phase-card phase-wide-card ritual-section-card">
        <div className="phase-card-head"><span>Today’s Rituals</span><small>{todayRituals.length} scheduled today</small></div>
        {todayRituals.length ? <div className="ritual-grid">{todayRituals.map(r => <RitualCard key={r.id} ritual={r} completion={ritualCompletionFor(completions, r.id, TODAY)} progress={ritualProgress(r, completions, TODAY)} onToggleStep={onToggleStep} onSkip={onSkip} onComplete={onComplete} onEdit={setModalRitual} />)}</div> : <div className="phase-empty">No rituals scheduled today. Create a Morning Reset or Night Wind Down to start gently.</div>}
      </div>
      <div className="phase-card phase-wide-card ritual-section-card">
        <div className="phase-card-head"><span>All Rituals</span><small>{active.length} active</small></div>
        {active.length ? <div className="ritual-list-compact">{[...todayRituals, ...otherRituals].map(r => {
          const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].filter((_, i) => r.repeatDays.includes(i)).join(" · ");
          return <div key={r.id} className="ritual-list-row"><span className="ritual-list-emoji">{r.emoji}</span><div><strong>{r.name}</strong><small>{r.scheduledTime} · {days || "No repeat days"}</small></div><button className="tf-cancel" onClick={() => setModalRitual(r)}>Edit</button></div>;
        })}</div> : <div className="phase-empty">No rituals yet.</div>}
      </div>
      <RitualTemplateLibrary rituals={normalized} onUseTemplate={useTemplate} onCustomizeTemplate={customizeTemplate} />
      {archived.length > 0 && <div className="phase-card phase-wide-card ritual-section-card"><div className="phase-card-head"><span>Archived</span><small>{archived.length}</small></div><div className="ritual-list-compact">{archived.map(r => <div key={r.id} className="ritual-list-row ritual-archived-row"><span className="ritual-list-emoji">{r.emoji}</span><div><strong>{r.name}</strong><small>Archived</small></div><button className="tf-cancel" onClick={() => onArchive(r, false)}>Restore</button></div>)}</div></div>}
      {modalRitual !== null && <RitualModal ritual={modalRitual?._templateDraft ? modalRitual : (modalRitual?.id ? modalRitual : null)} onClose={() => setModalRitual(null)} onSave={saveRitual} onDelete={deleteRitual} onArchive={(ritual, archived) => { onArchive(ritual, archived); setModalRitual(null); }} />}
    </div>
  );
}


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

function HabitCard({ habit, progress, streak = 0, onToggle, onIncrement, onEdit, compact = false }) {
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

function HabitsPage({ habits = [], completions = [], onAdd, onEdit, onDelete, onArchive, onToggle, onIncrement }) {
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

function ComingSoonPage({ icon, title, phase, description, bullets = [] }) {
  return (
    <div className="phase-page coming-soon-page">
      <div className="phase-hero">
        <div>
          <div className="phase-kicker">{phase}</div>
          <h1>{icon} {title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="phase-card phase-wide-card">
        <div className="phase-card-head"><span>Coming in a later build</span><small>Not wired to data yet</small></div>
        <div className="phase-bullet-list">
          {bullets.map(item => <div key={item} className="phase-list-row"><span>{item}</span></div>)}
        </div>
      </div>
    </div>
  );
}


function OnboardingModal({ onClose, onComplete, workStart = 9, workEnd = 19, notificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES }) {
  const [goals, setGoals] = useState(() => new Set(["organized", "plan", "habits"]));
  const [startTime, setStartTime] = useState(`${String(Math.max(0, Math.min(23, Number(workStart) || 9))).padStart(2, "0")}:00`);
  const [windDownTime, setWindDownTime] = useState("21:30");
  const [selectedHabits, setSelectedHabits] = useState(() => new Set(["drink-water", "journal", "plan-tomorrow", "gratitude"]));
  const [reminders, setReminders] = useState(() => ({
    journal: Boolean(notificationPreferences?.journal?.enabled ?? true),
    tomorrowReset: Boolean(notificationPreferences?.tomorrowReset?.enabled ?? true),
    weeklyReset: Boolean(notificationPreferences?.weeklyReset?.enabled ?? true),
  }));

  const goalOptions = [
    ["organized", "Feel more organized", "Bring the day into one calm view."],
    ["routines", "Build better routines", "Use habits and resets to keep your rhythm simple."],
    ["plan", "Plan my day", "Protect calendar time and priorities."],
    ["habits", "Track habits", "Return to small daily check-ins."],
    ["journal", "Journal consistently", "Reflect without overthinking it."],
  ];
  const habitOptions = ["drink-water", "journal", "stretch", "read-10", "plan-tomorrow", "tidy-room", "gratitude"].map(id => HABIT_TEMPLATES.find(t => t.id === id)).filter(Boolean);
  const toggleSet = (setter, value) => setter(prev => { const next = new Set(prev); next.has(value) ? next.delete(value) : next.add(value); return next; });
  const finish = () => onComplete({ goals: [...goals], startTime, windDownTime, habitIds: [...selectedHabits], reminders });

  return (
    <div className="modal-overlay onboarding-overlay" role="dialog" aria-modal="true" aria-label="Tempo onboarding" onClick={onClose}>
      <div className="onboarding-modal" onClick={e => e.stopPropagation()}>
        <div className="onboarding-hero">
          <div><div className="phase-kicker">Onboarding</div><h2>🌿 Set up your daily rhythm</h2><p>Pick a few starting points. Tempo will create a gentle setup you can edit anytime.</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <section className="onboarding-section">
          <div className="onboarding-section-title">What should Tempo help with?</div>
          <div className="onboarding-choice-grid">
            {goalOptions.map(([id, label, desc]) => <button key={id} className={`onboarding-choice ${goals.has(id) ? "selected" : ""}`} onClick={() => toggleSet(setGoals, id)}><strong>{label}</strong><small>{desc}</small></button>)}
          </div>
        </section>

        <section className="onboarding-section onboarding-time-grid">
          <label><span>Start my day around</span><input className="modal-select" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
          <label><span>Wind down around</span><input className="modal-select" type="time" value={windDownTime} onChange={e => setWindDownTime(e.target.value)} /></label>
        </section>

        <section className="onboarding-section">
          <div className="onboarding-section-title">Pick starter habits</div>
          <div className="onboarding-template-grid">
            {habitOptions.map(t => <button key={t.id} className={`onboarding-template ${selectedHabits.has(t.id) ? "selected" : ""}`} onClick={() => toggleSet(setSelectedHabits, t.id)}><span>{t.emoji}</span><strong>{t.name}</strong><small>{t.frequency === "daily" ? "Daily" : t.frequency}</small></button>)}
          </div>
        </section>

        <section className="onboarding-section">
          <div className="onboarding-section-title">Gentle reminders</div>
          <div className="onboarding-reminder-row">
            {[ ["journal", "📓", "Journal"], ["tomorrowReset", "🌙", "Tomorrow Reset"], ["weeklyReset", "🧺", "Weekly Reset"] ].map(([key, emoji, label]) => <label key={key}><input type="checkbox" checked={Boolean(reminders[key])} onChange={e => setReminders(r => ({ ...r, [key]: e.target.checked }))} /><span>{emoji} {label}</span></label>)}
          </div>
        </section>

        <div className="onboarding-actions">
          <button className="tf-cancel" onClick={() => onComplete(null, { skipped: true })}>Skip for now</button>
          <button className="tf-save" onClick={finish}>Create my rhythm →</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  // Use auth user ID when available; fall back to a per-session key stored in sessionStorage
  // so anonymous users on shared devices do not see each other's data.
  const uk = useMemo(() => {
    if (auth.user?.id) return auth.user.id;
    if (typeof sessionStorage !== "undefined") {
      let k = sessionStorage.getItem("tempo_anon_key");
      if (!k) { k = "anon_" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("tempo_anon_key", k); }
      return k;
    }
    return "anon";
  }, [auth.user?.id]);

  const [view, setView]             = useState("day");
  const [viewDate, setViewDate]     = useState(new Date(TODAY));
  const [page, setPage]             = useState("today"); // "today" | "calendar" | "journal" | "tasks" | "habits" | "rhythm"
  const [taskScope, setTaskScope]   = useState("day");
  const [taskPeriodDate, setTaskPeriodDate] = useState(new Date(TODAY));
  const [events, setEvRaw]          = useState(() => reviveEvents(load(`${uk}_ev`, INIT_EVENTS)));
  const [tasks,  setTkRaw]          = useState(() => normalizeTasks(load(`${uk}_tk`, INIT_TASKS)));
  const [chatOpen, setChatOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth > 768));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize,  setFSRaw]       = useState(() => load(`${uk}_fs`, "md"));
  const [darkMode,  setDMRaw]       = useState(() => load(`${uk}_dm`, false));
  const [workStart, setWSRaw]       = useState(() => load(`${uk}_ws`, 9));
  const [workEnd,   setWERaw]       = useState(() => load(`${uk}_we`, 19));
  const [mealBreaks, setMealBreaksRaw] = useState(() => normalizeMealBreaks(load(`${uk}_meal_breaks`, DEFAULT_MEAL_BREAKS)));
  const [planningRules, setPlanningRulesRaw] = useState(() => normalizePlanningRules(load(`${uk}_planning_rules`, DEFAULT_PLANNING_RULES)));
  const [settingsUpdatedAt, setSettingsUpdatedAtRaw] = useState(() => normalizeSettingsUpdatedAt(load(`${uk}_settings_updated_at`, {})));
  const [deletedRecords, setDeletedRecordsRaw] = useState(() => normalizeDeletedRecords(load(`${uk}_deleted_records`, {})));
  const [timezone,   setTzRaw]        = useState(() => load(`${uk}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [theme,     setThRaw]       = useState(() => load(`${uk}_th`, "tempo"));
  const [undoStack, setUndo]        = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedEvent, setCopiedEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scheduleTaskTarget, setScheduleTaskTarget] = useState(null);
  const [dayPlan, setDayPlan] = useState(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [categories, setCatRaw] = useState(() => normalizeCategories(load(`${uk}_categories`, CATEGORIES)));
  const [templates, setTplRaw] = useState(() => load(`${uk}_templates`, DAY_TEMPLATES));
  const [journalActivities, setJournalActivitiesRaw] = useState(() => load(`${uk}_journal_activities`, JOURNAL_ACTIVITIES));
  const [memoryTags, setMemoryTagsRaw] = useState(() => load(`${uk}_memory_tags`, MEMORY_TAGS));
  const [rituals, setRitualsRaw] = useState(() => normalizeRituals(load(`${uk}_rituals`, DEFAULT_RITUALS)));
  const [ritualCompletions, setRitualCompletionsRaw] = useState(() => normalizeRitualCompletions(load(`${uk}_ritual_completions`, [])));
  const [habits, setHabitsRaw] = useState(() => normalizeHabits(load(`${uk}_habits`, DEFAULT_HABITS)));
  const [habitCompletions, setHabitCompletionsRaw] = useState(() => normalizeHabitCompletions(load(`${uk}_habit_completions`, [])));
  const [dailyCheckIns, setDailyCheckInsRaw] = useState(() => normalizeDailyCheckIns(load(`${uk}_daily_checkins`, [])));
  const [tomorrowResets, setTomorrowResetsRaw] = useState(() => normalizeTomorrowResets(load(`${uk}_tomorrow_resets`, [])));
  const [weeklyResets, setWeeklyResetsRaw] = useState(() => normalizeWeeklyResets(load(`${uk}_weekly_resets`, [])));
  const [affirmations, setAffirmationsRaw] = useState(() => normalizeAffirmations(load(`${uk}_affirmations`, DEFAULT_AFFIRMATIONS)));
  const [affirmationSettings, setAffirmationSettingsRaw] = useState(() => normalizeAffirmationSettings(load(`${uk}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)));
  const [notificationPreferences, setNotificationPreferencesRaw] = useState(() => normalizeNotificationPreferences(load(`${uk}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)));
  const [syncConflictLog, setSyncConflictLogRaw] = useState(() => normalizeSyncConflictLog(load(`${uk}_sync_conflict_log`, [])));
  const [dataMigrationVersion, setDataMigrationVersionRaw] = useState(() => Number(load(`${uk}_data_migration_version`, 0)) || 0);
  const [showStats,    setShowStats]    = useState(false);
  const [showShortcuts,setShowShortcuts]= useState(false);
  const [showCarryOver,setShowCarryOver]= useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showStartup, setShowStartup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [notifs, setNfRaw] = useState(() => load(`${uk}_nf`, false));
  const [pushEnabled, setPushEnabledRaw] = useState(() => load(`${uk}_push_enabled`, false));
  const [calendars, setCalendarsRaw] = useState(() => normalizeCalendars(load(`${uk}_calendars`, CALENDARS)));
  const [hiddenCals,    setHiddenCals]    = useState(() => load(`${uk}_hidden_cals`, []));
  const [quickAddDate,  setQuickAddDate]  = useState(null);
  const [quickMemoryDate, setQuickMemoryDate] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ status: "saved", message: "Saved to cloud", lastError: "" });
  const [pendingLocalChanges, setPendingLocalChanges] = useState(() => load(`${uk}_pending_sync_count`, 0));
  const [lastSyncedAt, setLastSyncedAt] = useState(() => load(`${uk}_last_synced_at`, null));
  const cloudQueueRef = useRef(Promise.resolve());
  const lastRealtimeSyncRef = useRef(0);
  const [dataReady,    setDataReady]    = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [journal, setJournalRaw] = useState({}); // populated by useEffect after auth resolves
  const [memoryStorageMigratedAt, setMemoryStorageMigratedAtRaw] = useState(() => load(`${uk}_memory_storage_migrated_at`, null));
  // Real streak: count consecutive days the user has been active
  const [streak, setStreak] = useState(0);
  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) setSidebarOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requestedPage = params.get("page");
    if (["today", "calendar", "tasks", "journal", "habits", "rhythm", "tomorrow-reset", "weekly-reset"].includes(requestedPage)) {
      setPage(requestedPage);
    } else if (requestedPage === "bloom") {
      setPage("rhythm");
    } else if (requestedPage === "affirmations") {
      setPage("today");
    }
  }, []);

  useEffect(() => {
    if (!dataReady || !auth.user?.id) return;
    const key = `${uk}_startup_seen_${dateKey(TODAY)}`;
    if (!load(key, false)) setShowStartup(true);
  }, [dataReady, auth.user?.id, uk]);

  useEffect(() => {
    if (!dataReady || !auth.user?.id) return;
    const completed = load(`${uk}_onboarding_completed`, false);
    const skipped = load(`${uk}_onboarding_skipped`, false);
    const prompted = load(`${uk}_onboarding_prompted`, false);
    const looksBrandNew = normalizeTasks(tasks).filter(t => !t.deletedAt).length === 0 && reviveEvents(events).filter(e => !e.deletedAt).length === 0;
    if (!completed && !skipped && !prompted && looksBrandNew) {
      save(`${uk}_onboarding_prompted`, true);
      setShowOnboarding(true);
    }
  }, [dataReady, auth.user?.id, uk, events.length, tasks.length]);

  // Mobile viewport: keep the app-like layout while allowing zoom for accessibility.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      document.head.appendChild(viewport);
    }
    const previous = viewport.getAttribute("content") || "";
    viewport.setAttribute("content", "width=device-width, initial-scale=1, viewport-fit=cover");
    return () => {
      if (previous) viewport.setAttribute("content", previous);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/tempo-sw.js").catch(err => console.warn("Tempo service worker registration failed", err));
  }, []);

  // Helper: compute, persist, and return the current streak for a given user key
  const computeAndSaveStreak = useCallback((userKey) => {
    const lastActive = load(`${userKey}_last_active`, null);
    const saved      = load(`${userKey}_streak`, 0);
    const today      = dateKey(TODAY);
    const yesterday  = dateKey(new Date(TODAY.getTime() - 86400000));
    let streak;
    if (!lastActive)            { streak = 1; }
    else if (lastActive === today)     { streak = saved; }
    else if (lastActive === yesterday) { streak = saved + 1; }
    else                               { streak = 1; }
    save(`${userKey}_streak`, streak);
    save(`${userKey}_last_active`, today);
    return streak;
  }, []);
  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId) {
      setDataReady(false);
      setLoadedUserId(null);
      setEvRaw([]);
      setTkRaw([]);
      setJournalRaw({});
      setRitualsRaw([]);
      setRitualCompletionsRaw([]);
      setHabitsRaw([]);
      setHabitCompletionsRaw([]);
      setDailyCheckInsRaw([]);
      setTomorrowResetsRaw([]);
      setWeeklyResetsRaw([]);
      setAffirmationsRaw([]);
      setAffirmationSettingsRaw(normalizeAffirmationSettings(DEFAULT_AFFIRMATION_SETTINGS));
      setNotificationPreferencesRaw(normalizeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES));
      setSyncConflictLogRaw([]);
      setDataMigrationVersionRaw(0);
      return;
    }

    let cancelled = false;
    const userKey = userId;

    // Privacy guard: immediately blank the in-memory state before loading the
    // newly signed-in user's own scoped data. This prevents a newly signed-in
    // user from briefly seeing the previous user's calendar/tasks/journal.
    setDataReady(false);
    setLoadedUserId(null);
    setEvRaw([]);
    setTkRaw([]);
    setJournalRaw({});
    setJournalActivitiesRaw(load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES));
    setMemoryTagsRaw(load(`${userKey}_memory_tags`, MEMORY_TAGS));
    setRitualsRaw(normalizeRituals(load(`${userKey}_rituals`, DEFAULT_RITUALS)));
    setRitualCompletionsRaw(normalizeRitualCompletions(load(`${userKey}_ritual_completions`, [])));
    setHabitsRaw(normalizeHabits(load(`${userKey}_habits`, DEFAULT_HABITS)));
    setHabitCompletionsRaw(normalizeHabitCompletions(load(`${userKey}_habit_completions`, [])));
    setDailyCheckInsRaw(normalizeDailyCheckIns(load(`${userKey}_daily_checkins`, [])));
    setTomorrowResetsRaw(normalizeTomorrowResets(load(`${userKey}_tomorrow_resets`, [])));
    setWeeklyResetsRaw(normalizeWeeklyResets(load(`${userKey}_weekly_resets`, [])));
    setAffirmationsRaw(normalizeAffirmations(load(`${userKey}_affirmations`, DEFAULT_AFFIRMATIONS)));
    setAffirmationSettingsRaw(normalizeAffirmationSettings(load(`${userKey}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)));
    setNotificationPreferencesRaw(normalizeNotificationPreferences(load(`${userKey}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)));
    setSyncConflictLogRaw(normalizeSyncConflictLog(load(`${userKey}_sync_conflict_log`, [])));
    setDataMigrationVersionRaw(Number(load(`${userKey}_data_migration_version`, 0)) || 0);

    const applyLoadedData = async ({ loadedEvents, loadedTasks, settings, updatedAt }) => {
      if (cancelled) return;
      const safeEvents = reviveEvents(loadedEvents || []);
      const safeTasks = Core.migrateTaskCategories(Array.isArray(loadedTasks) ? loadedTasks : []);
      const safeSettings = settings || {};

      setEvRaw(safeEvents);
      setTkRaw(safeTasks);

      save(`${userKey}_ev`, safeEvents);
      save(`${userKey}_tk`, safeTasks);
      if (updatedAt) save(`${userKey}_updated_at`, updatedAt);

      const nextSettings = {
        fontSize: safeSettings.fontSize ?? load(`${userKey}_fs`, "md"),
        darkMode: safeSettings.darkMode ?? load(`${userKey}_dm`, false),
        theme: safeSettings.theme ?? load(`${userKey}_th`, "tempo"),
        workStart: safeSettings.workStart ?? load(`${userKey}_ws`, 9),
        workEnd: safeSettings.workEnd ?? load(`${userKey}_we`, 19),
        mealBreaks: normalizeMealBreaks(safeSettings.mealBreaks ?? load(`${userKey}_meal_breaks`, DEFAULT_MEAL_BREAKS)),
        planningRules: normalizePlanningRules(safeSettings.planningRules ?? load(`${userKey}_planning_rules`, DEFAULT_PLANNING_RULES)),
        settingsUpdatedAt: normalizeSettingsUpdatedAt(safeSettings.settingsUpdatedAt ?? load(`${userKey}_settings_updated_at`, {})),
        deletedRecords: normalizeDeletedRecords(safeSettings.deletedRecords ?? load(`${userKey}_deleted_records`, {})),
        calendars: normalizeCalendars(safeSettings.calendars ?? load(`${userKey}_calendars`, CALENDARS)),
        hiddenCals: Array.isArray(safeSettings.hiddenCals) ? safeSettings.hiddenCals : load(`${userKey}_hidden_cals`, []),
        notifs: safeSettings.notifs ?? load(`${userKey}_nf`, false),
        pushEnabled: safeSettings.pushEnabled ?? load(`${userKey}_push_enabled`, false),
        timezone: safeSettings.timezone ?? load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
        categories: normalizeCategories(safeSettings.categories ?? load(`${userKey}_categories`, CATEGORIES)),
        templates: safeSettings.templates ?? load(`${userKey}_templates`, DAY_TEMPLATES),
        journalActivities: safeSettings.journalActivities ?? load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
        memoryTags: safeSettings.memoryTags ?? load(`${userKey}_memory_tags`, MEMORY_TAGS),
        rituals: normalizeRituals(safeSettings.rituals ?? load(`${userKey}_rituals`, DEFAULT_RITUALS)),
        ritualCompletions: normalizeRitualCompletions(safeSettings.ritualCompletions ?? load(`${userKey}_ritual_completions`, [])),
        habits: normalizeHabits(safeSettings.habits ?? load(`${userKey}_habits`, DEFAULT_HABITS)),
        habitCompletions: normalizeHabitCompletions(safeSettings.habitCompletions ?? load(`${userKey}_habit_completions`, [])),
        dailyCheckIns: normalizeDailyCheckIns(safeSettings.dailyCheckIns ?? load(`${userKey}_daily_checkins`, [])),
        tomorrowResets: normalizeTomorrowResets(safeSettings.tomorrowResets ?? load(`${userKey}_tomorrow_resets`, [])),
        weeklyResets: normalizeWeeklyResets(safeSettings.weeklyResets ?? load(`${userKey}_weekly_resets`, [])),
        affirmations: normalizeAffirmations(safeSettings.affirmations ?? load(`${userKey}_affirmations`, DEFAULT_AFFIRMATIONS)),
        affirmationSettings: normalizeAffirmationSettings(safeSettings.affirmationSettings ?? load(`${userKey}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)),
        notificationPreferences: normalizeNotificationPreferences(safeSettings.notificationPreferences ?? load(`${userKey}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)),
        syncConflictLog: normalizeSyncConflictLog(safeSettings.syncConflictLog ?? load(`${userKey}_sync_conflict_log`, [])),
        dataMigrationVersion: Number(safeSettings.dataMigrationVersion ?? load(`${userKey}_data_migration_version`, 0)) || 0,
        memoryStorageMigratedAt: safeSettings.memoryStorageMigratedAt ?? load(`${userKey}_memory_storage_migrated_at`, null),
        journal: await decryptMemoryJournalFromStorage(userId, safeSettings.journal ?? load(`${userKey}_journal`, {})),
      };

      setFSRaw(nextSettings.fontSize);
      setDMRaw(Boolean(nextSettings.darkMode));
      setThRaw(nextSettings.theme);
      setWSRaw(Number(nextSettings.workStart));
      setWERaw(Number(nextSettings.workEnd));
      setMealBreaksRaw(normalizeMealBreaks(nextSettings.mealBreaks));
      setPlanningRulesRaw(normalizePlanningRules(nextSettings.planningRules));
      setSettingsUpdatedAtRaw(normalizeSettingsUpdatedAt(nextSettings.settingsUpdatedAt));
      setDeletedRecordsRaw(normalizeDeletedRecords(nextSettings.deletedRecords));
      setCalendarsRaw(normalizeCalendars(nextSettings.calendars));
      setHiddenCals(Array.isArray(nextSettings.hiddenCals) ? nextSettings.hiddenCals : []);
      setNfRaw(Boolean(nextSettings.notifs));
      setPushEnabledRaw(Boolean(nextSettings.pushEnabled));
      setTzRaw(nextSettings.timezone);
      setCatRaw(normalizeCategories(nextSettings.categories));
      setTplRaw(nextSettings.templates);
      setJournalActivitiesRaw(nextSettings.journalActivities);
      setMemoryTagsRaw(nextSettings.memoryTags || MEMORY_TAGS);
      setRitualsRaw(normalizeRituals(nextSettings.rituals));
      setRitualCompletionsRaw(normalizeRitualCompletions(nextSettings.ritualCompletions));
      setHabitsRaw(normalizeHabits(nextSettings.habits));
      setHabitCompletionsRaw(normalizeHabitCompletions(nextSettings.habitCompletions));
      setDailyCheckInsRaw(normalizeDailyCheckIns(nextSettings.dailyCheckIns));
      setTomorrowResetsRaw(normalizeTomorrowResets(nextSettings.tomorrowResets));
      setWeeklyResetsRaw(normalizeWeeklyResets(nextSettings.weeklyResets));
      setAffirmationsRaw(normalizeAffirmations(nextSettings.affirmations));
      setAffirmationSettingsRaw(normalizeAffirmationSettings(nextSettings.affirmationSettings));
      setNotificationPreferencesRaw(normalizeNotificationPreferences(nextSettings.notificationPreferences));
      setSyncConflictLogRaw(normalizeSyncConflictLog(nextSettings.syncConflictLog));
      setDataMigrationVersionRaw(Number(nextSettings.dataMigrationVersion || 0));
      setMemoryStorageMigratedAtRaw(nextSettings.memoryStorageMigratedAt || null);
      setJournalRaw(nextSettings.journal || {});
      save(`${userKey}_fs`, nextSettings.fontSize);
      save(`${userKey}_dm`, Boolean(nextSettings.darkMode));
      save(`${userKey}_th`, nextSettings.theme);
      save(`${userKey}_ws`, Number(nextSettings.workStart));
      save(`${userKey}_we`, Number(nextSettings.workEnd));
      save(`${userKey}_meal_breaks`, normalizeMealBreaks(nextSettings.mealBreaks));
      save(`${userKey}_nf`, Boolean(nextSettings.notifs));
      save(`${userKey}_push_enabled`, Boolean(nextSettings.pushEnabled));
      save(`${userKey}_tz`, nextSettings.timezone);
      save(`${userKey}_categories`, normalizeCategories(nextSettings.categories));
      save(`${userKey}_templates`, nextSettings.templates);
      save(`${userKey}_journal_activities`, nextSettings.journalActivities);
      save(`${userKey}_memory_tags`, nextSettings.memoryTags || MEMORY_TAGS);
      save(`${userKey}_rituals`, normalizeRituals(nextSettings.rituals));
      save(`${userKey}_ritual_completions`, normalizeRitualCompletions(nextSettings.ritualCompletions));
      save(`${userKey}_habits`, normalizeHabits(nextSettings.habits));
      save(`${userKey}_habit_completions`, normalizeHabitCompletions(nextSettings.habitCompletions));
      save(`${userKey}_daily_checkins`, normalizeDailyCheckIns(nextSettings.dailyCheckIns));
      save(`${userKey}_tomorrow_resets`, normalizeTomorrowResets(nextSettings.tomorrowResets));
      save(`${userKey}_weekly_resets`, normalizeWeeklyResets(nextSettings.weeklyResets));
      save(`${userKey}_affirmations`, normalizeAffirmations(nextSettings.affirmations));
      save(`${userKey}_affirmation_settings`, normalizeAffirmationSettings(nextSettings.affirmationSettings));
      save(`${userKey}_notification_preferences`, normalizeNotificationPreferences(nextSettings.notificationPreferences));
      save(`${userKey}_sync_conflict_log`, normalizeSyncConflictLog(nextSettings.syncConflictLog));
      save(`${userKey}_data_migration_version`, Number(nextSettings.dataMigrationVersion || 0));
      save(`${userKey}_memory_storage_migrated_at`, nextSettings.memoryStorageMigratedAt || null);
      save(`${userKey}_planning_rules`, normalizePlanningRules(nextSettings.planningRules));
      save(`${userKey}_settings_updated_at`, normalizeSettingsUpdatedAt(nextSettings.settingsUpdatedAt));
      save(`${userKey}_deleted_records`, normalizeDeletedRecords(nextSettings.deletedRecords));
      save(`${userKey}_calendars`, normalizeCalendars(nextSettings.calendars));
      save(`${userKey}_hidden_cals`, Array.isArray(nextSettings.hiddenCals) ? nextSettings.hiddenCals : []);
      saveJournalLocal(userKey, userId, nextSettings.journal || {});
      setWorkHoursCtx(Number(nextSettings.workStart), Number(nextSettings.workEnd));
      setStreak(computeAndSaveStreak(userKey));
      setLoadedUserId(userId);
      setDataReady(true);
    };

    const fallbackTimer = setTimeout(async () => {
      if (cancelled) return;
      setSyncStatus({ status: "offline", message: "Offline — saved on this device only", lastError: "Cloud load timed out" });
      const localHasData = hasStoredUserData(userKey);
      await applyLoadedData({
        loadedEvents: localHasData ? reviveEvents(load(`${userKey}_ev`, [])) : [],
        loadedTasks: localHasData ? load(`${userKey}_tk`, []) : [],
        settings: {
          fontSize: load(`${userKey}_fs`, "md"),
          darkMode: load(`${userKey}_dm`, false),
          theme: load(`${userKey}_th`, "tempo"),
          workStart: load(`${userKey}_ws`, 9),
          workEnd: load(`${userKey}_we`, 19),
          mealBreaks: normalizeMealBreaks(load(`${userKey}_meal_breaks`, DEFAULT_MEAL_BREAKS)),
          planningRules: normalizePlanningRules(load(`${userKey}_planning_rules`, DEFAULT_PLANNING_RULES)),
          settingsUpdatedAt: normalizeSettingsUpdatedAt(load(`${userKey}_settings_updated_at`, {})),
          deletedRecords: normalizeDeletedRecords(load(`${userKey}_deleted_records`, {})),
          calendars: normalizeCalendars(load(`${userKey}_calendars`, CALENDARS)),
          hiddenCals: load(`${userKey}_hidden_cals`, []),
          notifs: load(`${userKey}_nf`, false),
          pushEnabled: load(`${userKey}_push_enabled`, false),
          timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
          categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
          templates: load(`${userKey}_templates`, DAY_TEMPLATES),
          journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
          memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
          rituals: normalizeRituals(load(`${userKey}_rituals`, DEFAULT_RITUALS)),
          ritualCompletions: normalizeRitualCompletions(load(`${userKey}_ritual_completions`, [])),
          habits: normalizeHabits(load(`${userKey}_habits`, DEFAULT_HABITS)),
          habitCompletions: normalizeHabitCompletions(load(`${userKey}_habit_completions`, [])),
          dailyCheckIns: normalizeDailyCheckIns(load(`${userKey}_daily_checkins`, [])),
          tomorrowResets: normalizeTomorrowResets(load(`${userKey}_tomorrow_resets`, [])),
          weeklyResets: normalizeWeeklyResets(load(`${userKey}_weekly_resets`, [])),
          affirmations: normalizeAffirmations(load(`${userKey}_affirmations`, DEFAULT_AFFIRMATIONS)),
          affirmationSettings: normalizeAffirmationSettings(load(`${userKey}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)),
          notificationPreferences: normalizeNotificationPreferences(load(`${userKey}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)),
          syncConflictLog: normalizeSyncConflictLog(load(`${userKey}_sync_conflict_log`, [])),
          dataMigrationVersion: Number(load(`${userKey}_data_migration_version`, 0)) || 0,
          memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
          journal: load(`${userKey}_journal`, {}),
        },
        updatedAt: load(`${userKey}_updated_at`, null),
      });
    }, CLOUD_FALLBACK_MS);

    loadFromCloud(userId).then(async cloud => {
      clearTimeout(fallbackTimer);
      if (cancelled) return;

      const localHasData = hasStoredUserData(userKey);
      const localUpdatedAt = load(`${userKey}_updated_at`, null);
      const cloudUpdatedAt = cloud?.updated_at ?? null;
      const localIsNewer =
        localHasData &&
        (!cloudUpdatedAt || (localUpdatedAt && new Date(localUpdatedAt) >= new Date(cloudUpdatedAt)));

      // Authenticated accounts are never hydrated from anonymous/demo keys.
      // Order of trust: this user's cloud row > this user's scoped local row > empty.
      if (cloud && localHasData) {
        const localSnapshot = {
          events: reviveEvents(load(`${userKey}_ev`, [])),
          tasks: load(`${userKey}_tk`, []),
          settings: {
            fontSize: load(`${userKey}_fs`, "md"),
            darkMode: load(`${userKey}_dm`, false),
            theme: load(`${userKey}_th`, "tempo"),
            workStart: load(`${userKey}_ws`, 9),
            workEnd: load(`${userKey}_we`, 19),
            mealBreaks: normalizeMealBreaks(load(`${userKey}_meal_breaks`, DEFAULT_MEAL_BREAKS)),
            planningRules: normalizePlanningRules(load(`${userKey}_planning_rules`, DEFAULT_PLANNING_RULES)),
            settingsUpdatedAt: normalizeSettingsUpdatedAt(load(`${userKey}_settings_updated_at`, {})),
            deletedRecords: normalizeDeletedRecords(load(`${userKey}_deleted_records`, {})),
          calendars: normalizeCalendars(load(`${userKey}_calendars`, CALENDARS)),
          hiddenCals: load(`${userKey}_hidden_cals`, []),
            notifs: load(`${userKey}_nf`, false),
            pushEnabled: load(`${userKey}_push_enabled`, false),
            timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
            categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
            templates: load(`${userKey}_templates`, DAY_TEMPLATES),
            journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
            memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
            rituals: normalizeRituals(load(`${userKey}_rituals`, DEFAULT_RITUALS)),
            ritualCompletions: normalizeRitualCompletions(load(`${userKey}_ritual_completions`, [])),
          habits: normalizeHabits(load(`${userKey}_habits`, DEFAULT_HABITS)),
          habitCompletions: normalizeHabitCompletions(load(`${userKey}_habit_completions`, [])),
          dailyCheckIns: normalizeDailyCheckIns(load(`${userKey}_daily_checkins`, [])),
          tomorrowResets: normalizeTomorrowResets(load(`${userKey}_tomorrow_resets`, [])),
          weeklyResets: normalizeWeeklyResets(load(`${userKey}_weekly_resets`, [])),
          affirmations: normalizeAffirmations(load(`${userKey}_affirmations`, DEFAULT_AFFIRMATIONS)),
          affirmationSettings: normalizeAffirmationSettings(load(`${userKey}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)),
          notificationPreferences: normalizeNotificationPreferences(load(`${userKey}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)),
          syncConflictLog: normalizeSyncConflictLog(load(`${userKey}_sync_conflict_log`, [])),
          dataMigrationVersion: Number(load(`${userKey}_data_migration_version`, 0)) || 0,
            memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
            journal: load(`${userKey}_journal`, {}),
          },
          updated_at: localUpdatedAt,
        };
        const merged = mergeTempoData(cloud, localSnapshot);
        setSyncStatus({ status: "saved", message: "Merged & saved to cloud", lastError: "" });
        await applyLoadedData({ loadedEvents: merged.events, loadedTasks: merged.tasks, settings: merged.settings, updatedAt: new Date().toISOString() });
        queueCloudSave(merged.events, merged.tasks, merged.settings);
      } else if (cloud && !localIsNewer) {
        markCloudSynced();
        setSyncStatus({ status: "saved", message: "Saved to cloud", lastError: "" });
        await applyLoadedData({
          loadedEvents: Array.isArray(cloud.events) ? cloud.events : [],
          loadedTasks: Array.isArray(cloud.tasks) ? cloud.tasks : [],
          settings: cloud.settings || {},
          updatedAt: cloud.updated_at,
        });
      } else if (localHasData) {
        const nextEvents = reviveEvents(load(`${userKey}_ev`, []));
        const nextTasks = load(`${userKey}_tk`, []);
        const nextSettings = {
          fontSize: load(`${userKey}_fs`, "md"),
          darkMode: load(`${userKey}_dm`, false),
          theme: load(`${userKey}_th`, "tempo"),
          workStart: load(`${userKey}_ws`, 9),
          workEnd: load(`${userKey}_we`, 19),
          mealBreaks: normalizeMealBreaks(load(`${userKey}_meal_breaks`, DEFAULT_MEAL_BREAKS)),
          planningRules: normalizePlanningRules(load(`${userKey}_planning_rules`, DEFAULT_PLANNING_RULES)),
          settingsUpdatedAt: normalizeSettingsUpdatedAt(load(`${userKey}_settings_updated_at`, {})),
          deletedRecords: normalizeDeletedRecords(load(`${userKey}_deleted_records`, {})),
          calendars: normalizeCalendars(load(`${userKey}_calendars`, CALENDARS)),
          hiddenCals: load(`${userKey}_hidden_cals`, []),
          notifs: load(`${userKey}_nf`, false),
          pushEnabled: load(`${userKey}_push_enabled`, false),
          timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
          categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
          templates: load(`${userKey}_templates`, DAY_TEMPLATES),
          journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
          memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
          rituals: normalizeRituals(load(`${userKey}_rituals`, DEFAULT_RITUALS)),
          ritualCompletions: normalizeRitualCompletions(load(`${userKey}_ritual_completions`, [])),
          habits: normalizeHabits(load(`${userKey}_habits`, DEFAULT_HABITS)),
          habitCompletions: normalizeHabitCompletions(load(`${userKey}_habit_completions`, [])),
          dailyCheckIns: normalizeDailyCheckIns(load(`${userKey}_daily_checkins`, [])),
          tomorrowResets: normalizeTomorrowResets(load(`${userKey}_tomorrow_resets`, [])),
          weeklyResets: normalizeWeeklyResets(load(`${userKey}_weekly_resets`, [])),
          affirmations: normalizeAffirmations(load(`${userKey}_affirmations`, DEFAULT_AFFIRMATIONS)),
          affirmationSettings: normalizeAffirmationSettings(load(`${userKey}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)),
          notificationPreferences: normalizeNotificationPreferences(load(`${userKey}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)),
          syncConflictLog: normalizeSyncConflictLog(load(`${userKey}_sync_conflict_log`, [])),
          dataMigrationVersion: Number(load(`${userKey}_data_migration_version`, 0)) || 0,
          memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
          journal: load(`${userKey}_journal`, {}),
        };
        await applyLoadedData({ loadedEvents: nextEvents, loadedTasks: nextTasks, settings: nextSettings, updatedAt: localUpdatedAt });
        saveToCloud(userId, nextEvents, nextTasks, { ...nextSettings, journal: await decryptMemoryJournalFromStorage(userId, nextSettings.journal) });
      } else {
        // Brand-new authenticated user: start empty. Do not copy previous in-memory,
        // anonymous, demo, or browser data into this account.
        const blankSettings = {
          fontSize: "md",
          darkMode: false,
          theme: "tempo",
          workStart: 9,
          workEnd: 19,
          mealBreaks: normalizeMealBreaks(DEFAULT_MEAL_BREAKS),
          planningRules: normalizePlanningRules(DEFAULT_PLANNING_RULES),
          settingsUpdatedAt: {},
          deletedRecords: normalizeDeletedRecords({}),
          calendars: normalizeCalendars(CALENDARS),
          hiddenCals: [],
          notifs: false,
          pushEnabled: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          categories: normalizeCategories(CATEGORIES),
          templates: DAY_TEMPLATES,
          journalActivities: JOURNAL_ACTIVITIES,
          memoryTags: MEMORY_TAGS,
          rituals: normalizeRituals(DEFAULT_RITUALS),
          ritualCompletions: [],
          habits: normalizeHabits(DEFAULT_HABITS),
          habitCompletions: [],
          dailyCheckIns: [],
          tomorrowResets: [],
          weeklyResets: [],
          affirmations: normalizeAffirmations(DEFAULT_AFFIRMATIONS),
          affirmationSettings: normalizeAffirmationSettings(DEFAULT_AFFIRMATION_SETTINGS),
          notificationPreferences: normalizeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES),
          syncConflictLog: [],
          dataMigrationVersion: Core.DATA_MIGRATION_VERSION,
          memoryStorageMigratedAt: null,
          journal: {},
        };
        await applyLoadedData({ loadedEvents: [], loadedTasks: [], settings: blankSettings, updatedAt: new Date().toISOString() });
        saveToCloud(userId, [], [], blankSettings);
      }
    }).catch(async () => {
      clearTimeout(fallbackTimer);
      setSyncStatus({ status: "offline", message: "Offline — saved on this device only", lastError: "Cloud load failed" });
      if (cancelled) return;
      const localHasData = hasStoredUserData(userKey);
      await applyLoadedData({
        loadedEvents: localHasData ? reviveEvents(load(`${userKey}_ev`, [])) : [],
        loadedTasks: localHasData ? load(`${userKey}_tk`, []) : [],
        settings: {
          fontSize: load(`${userKey}_fs`, "md"),
          darkMode: load(`${userKey}_dm`, false),
          theme: load(`${userKey}_th`, "tempo"),
          workStart: load(`${userKey}_ws`, 9),
          workEnd: load(`${userKey}_we`, 19),
          mealBreaks: normalizeMealBreaks(load(`${userKey}_meal_breaks`, DEFAULT_MEAL_BREAKS)),
          planningRules: normalizePlanningRules(load(`${userKey}_planning_rules`, DEFAULT_PLANNING_RULES)),
          settingsUpdatedAt: normalizeSettingsUpdatedAt(load(`${userKey}_settings_updated_at`, {})),
          deletedRecords: normalizeDeletedRecords(load(`${userKey}_deleted_records`, {})),
          calendars: normalizeCalendars(load(`${userKey}_calendars`, CALENDARS)),
          hiddenCals: load(`${userKey}_hidden_cals`, []),
          notifs: load(`${userKey}_nf`, false),
          pushEnabled: load(`${userKey}_push_enabled`, false),
          timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
          categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
          templates: load(`${userKey}_templates`, DAY_TEMPLATES),
          journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
          memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
          rituals: normalizeRituals(load(`${userKey}_rituals`, DEFAULT_RITUALS)),
          ritualCompletions: normalizeRitualCompletions(load(`${userKey}_ritual_completions`, [])),
          habits: normalizeHabits(load(`${userKey}_habits`, DEFAULT_HABITS)),
          habitCompletions: normalizeHabitCompletions(load(`${userKey}_habit_completions`, [])),
          dailyCheckIns: normalizeDailyCheckIns(load(`${userKey}_daily_checkins`, [])),
          tomorrowResets: normalizeTomorrowResets(load(`${userKey}_tomorrow_resets`, [])),
          weeklyResets: normalizeWeeklyResets(load(`${userKey}_weekly_resets`, [])),
          affirmations: normalizeAffirmations(load(`${userKey}_affirmations`, DEFAULT_AFFIRMATIONS)),
          affirmationSettings: normalizeAffirmationSettings(load(`${userKey}_affirmation_settings`, DEFAULT_AFFIRMATION_SETTINGS)),
          notificationPreferences: normalizeNotificationPreferences(load(`${userKey}_notification_preferences`, DEFAULT_NOTIFICATION_PREFERENCES)),
          syncConflictLog: normalizeSyncConflictLog(load(`${userKey}_sync_conflict_log`, [])),
          dataMigrationVersion: Number(load(`${userKey}_data_migration_version`, 0)) || 0,
          memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
          journal: load(`${userKey}_journal`, {}),
        },
        updatedAt: load(`${userKey}_updated_at`, null),
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [auth.user?.id]);

  // Helper: save locally + push to cloud — always use passed values to avoid stale closure
  const markUpdated = () => save(`${uk}_updated_at`, new Date().toISOString());
  const touchRecord = (record, patch = {}) => ({ ...record, ...patch, updatedAt: new Date().toISOString() });
  const markPendingLocalChange = () => {
    const next = Number(load(`${uk}_pending_sync_count`, 0)) + 1;
    setPendingLocalChanges(next);
    save(`${uk}_pending_sync_count`, next);
  };
  const markCloudSynced = () => {
    const stamp = new Date().toISOString();
    setPendingLocalChanges(0);
    setLastSyncedAt(stamp);
    save(`${uk}_pending_sync_count`, 0);
    save(`${uk}_last_synced_at`, stamp);
  };

  const currentSettings = (overrides = {}) => ({
    fontSize,
    darkMode,
    theme,
    workStart,
    workEnd,
    mealBreaks: normalizeMealBreaks(mealBreaks),
    planningRules: normalizePlanningRules(planningRules),
    settingsUpdatedAt: normalizeSettingsUpdatedAt(settingsUpdatedAt),
    deletedRecords: Core.pruneDeletedRecords(normalizeDeletedRecords(deletedRecords)),
    calendars: normalizeCalendars(calendars),
    hiddenCals: Array.isArray(hiddenCals) ? hiddenCals : [],
    notifs,
    pushEnabled,
    timezone,
    categories,
    templates,
    journalActivities,
    memoryTags,
    rituals: normalizeRituals(rituals),
    ritualCompletions: normalizeRitualCompletions(ritualCompletions),
    habits: normalizeHabits(habits),
    habitCompletions: normalizeHabitCompletions(habitCompletions),
    dailyCheckIns: normalizeDailyCheckIns(dailyCheckIns),
    tomorrowResets: normalizeTomorrowResets(tomorrowResets),
    weeklyResets: normalizeWeeklyResets(weeklyResets),
    affirmations: normalizeAffirmations(affirmations),
    affirmationSettings: normalizeAffirmationSettings(affirmationSettings),
    notificationPreferences: normalizeNotificationPreferences(notificationPreferences),
    syncConflictLog: normalizeSyncConflictLog(syncConflictLog),
    dataMigrationVersion: Math.max(Number(dataMigrationVersion || 0), Core.DATA_MIGRATION_VERSION),
    memoryStorageMigratedAt,
    journal,
    ...overrides,
  });

  const queueCloudSave = (evs = events, tks = tasks, settings = currentSettings(), options = {}) => {
    if (!auth.user || !dataReady) {
      markPendingLocalChange();
      setSyncStatus({ status: "offline", message: "Offline edits pending", lastError: "Not signed in or cloud not ready" });
      return Promise.resolve(!options.strict);
    }
    const run = async () => {
      setSyncStatus({ status: "saving", message: "Saving…", lastError: "" });
      const ok = await saveToCloud(auth.user.id, evs, tks, settings);
      if (ok) {
        markCloudSynced();
        setSyncStatus({ status: "saved", message: "Saved to cloud", lastError: "" });
        return true;
      }
      markPendingLocalChange();
      setSyncStatus({ status: "failed", message: "Sync failed — tap to retry", lastError: "Cloud save failed" });
      if (options.strict) throw new Error("Cloud save failed. Your Journal change was not finalized.");
      return false;
    };
    const queued = cloudQueueRef.current.then(run, run);
    cloudQueueRef.current = queued.catch(() => {});
    return queued;
  };
  const retryCloudSave = () => queueCloudSave(events, tasks, currentSettings());

  async function forceSyncNow(options = {}) {
    if (!auth.user?.id) {
      setSyncStatus({ status: "offline", message: "Sign in to sync across devices", lastError: "Not signed in" });
      setToast({ text: "Sign in to sync across devices", ts: Date.now() });
      return false;
    }
    setSyncStatus({ status: "saving", message: "Force syncing…", lastError: "" });
    try {
      await cloudQueueRef.current.catch(() => {});
      const cloud = await loadFromCloud(auth.user.id);
      const localUpdatedAt = load(`${uk}_updated_at`, null);
      const cloudUpdatedAt = cloud?.updated_at ?? null;
      const localSnapshot = { events, tasks, settings: currentSettings(), updated_at: localUpdatedAt };
      // Always run the conflict-safe merge so delete tombstones and field-level settings timestamps
      // are respected across desktop, browser, and PWA sessions.
      const merged = cloud ? mergeTempoData(cloud, localSnapshot) : localSnapshot;
      const nextSettings = merged.settings;
      const nextEvents = reviveEvents(merged.events || []);
      const nextTasks = normalizeTasks(merged.tasks || []);
      const normalizedSettings = {
        ...currentSettings(),
        ...(nextSettings || {}),
        categories: normalizeCategories(nextSettings?.categories || categories),
        templates: nextSettings?.templates || templates,
        journalActivities: nextSettings?.journalActivities || journalActivities,
        memoryTags: nextSettings?.memoryTags || memoryTags,
        rituals: normalizeRituals(nextSettings?.rituals || rituals),
        ritualCompletions: normalizeRitualCompletions(nextSettings?.ritualCompletions || ritualCompletions),
        habits: normalizeHabits(nextSettings?.habits || habits),
        habitCompletions: normalizeHabitCompletions(nextSettings?.habitCompletions || habitCompletions),
        dailyCheckIns: normalizeDailyCheckIns(nextSettings?.dailyCheckIns || dailyCheckIns),
        tomorrowResets: normalizeTomorrowResets(nextSettings?.tomorrowResets || tomorrowResets),
        weeklyResets: normalizeWeeklyResets(nextSettings?.weeklyResets || weeklyResets),
        affirmations: normalizeAffirmations(nextSettings?.affirmations || affirmations),
        affirmationSettings: normalizeAffirmationSettings(nextSettings?.affirmationSettings || affirmationSettings),
        notificationPreferences: normalizeNotificationPreferences(nextSettings?.notificationPreferences || notificationPreferences),
        syncConflictLog: normalizeSyncConflictLog(nextSettings?.syncConflictLog || syncConflictLog),
        dataMigrationVersion: Math.max(Number(nextSettings?.dataMigrationVersion || dataMigrationVersion || 0), Core.DATA_MIGRATION_VERSION),
        mealBreaks: normalizeMealBreaks(nextSettings?.mealBreaks || mealBreaks),
        planningRules: normalizePlanningRules(nextSettings?.planningRules || planningRules),
        settingsUpdatedAt: normalizeSettingsUpdatedAt(nextSettings?.settingsUpdatedAt || settingsUpdatedAt),
        deletedRecords: normalizeDeletedRecords(nextSettings?.deletedRecords || deletedRecords),
        calendars: normalizeCalendars(nextSettings?.calendars || calendars),
        hiddenCals: Array.isArray(nextSettings?.hiddenCals) ? nextSettings.hiddenCals : (Array.isArray(hiddenCals) ? hiddenCals : []),
        journal: nextSettings?.journal || journal,
      };

      setEvRaw(nextEvents);
      setTkRaw(nextTasks);
      setFSRaw(normalizedSettings.fontSize || fontSize);
      setDMRaw(Boolean(normalizedSettings.darkMode));
      setThRaw(normalizedSettings.theme || theme);
      setWSRaw(Number(normalizedSettings.workStart ?? workStart));
      setWERaw(Number(normalizedSettings.workEnd ?? workEnd));
      setMealBreaksRaw(normalizedSettings.mealBreaks);
      setPlanningRulesRaw(normalizedSettings.planningRules);
      setSettingsUpdatedAtRaw(normalizedSettings.settingsUpdatedAt);
      setDeletedRecordsRaw(normalizedSettings.deletedRecords);
      setCalendarsRaw(normalizeCalendars(normalizedSettings.calendars));
      setHiddenCals(Array.isArray(normalizedSettings.hiddenCals) ? normalizedSettings.hiddenCals : []);
      setNfRaw(Boolean(normalizedSettings.notifs));
      setPushEnabledRaw(Boolean(normalizedSettings.pushEnabled));
      setTzRaw(normalizedSettings.timezone || timezone);
      setCatRaw(normalizeCategories(normalizedSettings.categories));
      setTplRaw(normalizedSettings.templates);
      setJournalActivitiesRaw(normalizedSettings.journalActivities);
      setMemoryTagsRaw(normalizedSettings.memoryTags || MEMORY_TAGS);
      setRitualsRaw(normalizeRituals(normalizedSettings.rituals));
      setRitualCompletionsRaw(normalizeRitualCompletions(normalizedSettings.ritualCompletions));
      setHabitsRaw(normalizeHabits(normalizedSettings.habits));
      setHabitCompletionsRaw(normalizeHabitCompletions(normalizedSettings.habitCompletions));
      setDailyCheckInsRaw(normalizeDailyCheckIns(normalizedSettings.dailyCheckIns));
      setTomorrowResetsRaw(normalizeTomorrowResets(normalizedSettings.tomorrowResets));
      setWeeklyResetsRaw(normalizeWeeklyResets(normalizedSettings.weeklyResets));
      setAffirmationsRaw(normalizeAffirmations(normalizedSettings.affirmations));
      setAffirmationSettingsRaw(normalizeAffirmationSettings(normalizedSettings.affirmationSettings));
      setNotificationPreferencesRaw(normalizeNotificationPreferences(normalizedSettings.notificationPreferences));
      setSyncConflictLogRaw(normalizeSyncConflictLog(normalizedSettings.syncConflictLog));
      setDataMigrationVersionRaw(Number(normalizedSettings.dataMigrationVersion || 0));
      setMemoryStorageMigratedAtRaw(normalizedSettings.memoryStorageMigratedAt || null);
      setJournalRaw(normalizedSettings.journal || {});
      setWorkHoursCtx(Number(normalizedSettings.workStart ?? workStart), Number(normalizedSettings.workEnd ?? workEnd));

      save(`${uk}_ev`, nextEvents);
      save(`${uk}_tk`, nextTasks);
      save(`${uk}_fs`, normalizedSettings.fontSize);
      save(`${uk}_dm`, normalizedSettings.darkMode);
      save(`${uk}_th`, normalizedSettings.theme);
      save(`${uk}_ws`, normalizedSettings.workStart);
      save(`${uk}_we`, normalizedSettings.workEnd);
      save(`${uk}_meal_breaks`, normalizedSettings.mealBreaks);
      save(`${uk}_planning_rules`, normalizedSettings.planningRules);
      save(`${uk}_settings_updated_at`, normalizedSettings.settingsUpdatedAt);
      save(`${uk}_deleted_records`, normalizedSettings.deletedRecords);
      save(`${uk}_calendars`, normalizeCalendars(normalizedSettings.calendars));
      save(`${uk}_hidden_cals`, Array.isArray(normalizedSettings.hiddenCals) ? normalizedSettings.hiddenCals : []);
      save(`${uk}_nf`, normalizedSettings.notifs);
      save(`${uk}_push_enabled`, Boolean(normalizedSettings.pushEnabled));
      save(`${uk}_tz`, normalizedSettings.timezone);
      save(`${uk}_categories`, normalizedSettings.categories);
      save(`${uk}_templates`, normalizedSettings.templates);
      save(`${uk}_journal_activities`, normalizedSettings.journalActivities);
      save(`${uk}_memory_tags`, normalizedSettings.memoryTags || MEMORY_TAGS);
      save(`${uk}_rituals`, normalizeRituals(normalizedSettings.rituals));
      save(`${uk}_ritual_completions`, normalizeRitualCompletions(normalizedSettings.ritualCompletions));
      save(`${uk}_habits`, normalizeHabits(normalizedSettings.habits));
      save(`${uk}_habit_completions`, normalizeHabitCompletions(normalizedSettings.habitCompletions));
      save(`${uk}_daily_checkins`, normalizeDailyCheckIns(normalizedSettings.dailyCheckIns));
      save(`${uk}_tomorrow_resets`, normalizeTomorrowResets(normalizedSettings.tomorrowResets));
      save(`${uk}_weekly_resets`, normalizeWeeklyResets(normalizedSettings.weeklyResets));
      save(`${uk}_affirmations`, normalizeAffirmations(normalizedSettings.affirmations));
      save(`${uk}_affirmation_settings`, normalizeAffirmationSettings(normalizedSettings.affirmationSettings));
      save(`${uk}_notification_preferences`, normalizeNotificationPreferences(normalizedSettings.notificationPreferences));
      save(`${uk}_sync_conflict_log`, normalizeSyncConflictLog(normalizedSettings.syncConflictLog));
      save(`${uk}_data_migration_version`, Number(normalizedSettings.dataMigrationVersion || 0));
      save(`${uk}_memory_storage_migrated_at`, normalizedSettings.memoryStorageMigratedAt || null);
      saveJournalLocal(uk, auth.user.id, normalizedSettings.journal || {});

      const stampedAt = new Date().toISOString();
      save(`${uk}_updated_at`, stampedAt);
      if (!options.skipCloudSave) {
        const ok = await saveToCloud(auth.user.id, nextEvents, nextTasks, normalizedSettings);
        if (!ok) throw new Error("Cloud save failed after merge");
      }
      markCloudSynced();
      setSyncStatus({ status: "saved", message: options.silent ? "Updated from cloud" : "Force synced just now", lastError: "" });
      if (!options.silent) setToast({ text: "Synced with cloud ✓", ts: Date.now() });
      return true;
    } catch (err) {
      console.warn("Force sync failed", err);
      setSyncStatus({ status: "failed", message: "Force sync failed — tap to retry", lastError: err?.message || "Force sync failed" });
      if (!options.silent) setToast({ text: "Force sync failed. Try again.", ts: Date.now() });
      return false;
    }
  }


  useEffect(() => {
    if (!auth.user?.id || !dataReady) return;
    let cancelled = false;
    let channel = null;
    const pullLatest = (reason = "cloud") => {
      const now = Date.now();
      if (now - lastRealtimeSyncRef.current < 2500) return;
      lastRealtimeSyncRef.current = now;
      forceSyncNow({ silent: true, skipCloudSave: reason === "realtime" }).catch(() => {});
    };

    getSupabase().then(sb => {
      if (cancelled) return;
      channel = sb
        .channel(`tempo-user-data-${auth.user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "user_data", filter: `user_id=eq.${auth.user.id}` }, payload => {
          const cloudUpdatedAt = payload?.new?.updated_at;
          const localUpdatedAt = load(`${uk}_updated_at`, null);
          const cloudTime = cloudUpdatedAt ? new Date(cloudUpdatedAt).getTime() : 0;
          const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
          if (cloudTime && cloudTime <= localTime + 1000) return;
          pullLatest("realtime");
        })
        .subscribe();
    }).catch(() => {});

    const onFocus = () => pullLatest("focus");
    const onOnline = () => pullLatest("online");
    const onVisibility = () => { if (document.visibilityState === "visible") pullLatest("visible"); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      try { channel?.unsubscribe?.(); } catch {}
    };
  }, [auth.user?.id, dataReady, uk]);

  const syncEvents = (evs, tks) => {
    save(`${uk}_ev`, evs);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user && dataReady) {
      queueCloudSave(evs, tks ?? tasks, currentSettings());
    }
  };

  const syncTasks = (tks, evs) => {
    save(`${uk}_tk`, tks);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user && dataReady) {
      queueCloudSave(evs ?? events, tks, currentSettings());
    }
  };

  const setEvents   = v => { const n = reviveEvents(typeof v === "function" ? v(events) : v); setEvRaw(n); syncEvents(n, tasks); };
  const setTasks    = v => { const n = normalizeTasks(typeof v === "function" ? v(tasks)  : v); setTkRaw(n); syncTasks(n, events); };
  const setEventsAndTasks = (nextEvents, nextTasks, settingsOverride = {}) => {
    const evs = reviveEvents(nextEvents);
    const tks = normalizeTasks(nextTasks);
    const nextSettings = currentSettings(settingsOverride);
    setEvRaw(evs);
    setTkRaw(tks);
    save(`${uk}_ev`, evs);
    save(`${uk}_tk`, tks);
    if (settingsOverride.deletedRecords) save(`${uk}_deleted_records`, normalizeDeletedRecords(settingsOverride.deletedRecords));
    if (settingsOverride.settingsUpdatedAt) save(`${uk}_settings_updated_at`, normalizeSettingsUpdatedAt(settingsOverride.settingsUpdatedAt));
    save(`${uk}_updated_at`, new Date().toISOString());
    if (auth.user && dataReady) queueCloudSave(evs, tks, nextSettings);
  };
  useEffect(() => {
    if (!dataReady) return;
    const next = ensureRecurringTasksForPeriod(tasks, taskScope, taskPeriodDate);
    if (next !== tasks) setTasks(next);
  }, [dataReady, taskScope, taskPeriodDate, tasks]);
  const persistSettings = overrides => {
    const touchedAt = new Date().toISOString();
    const touchedKeys = Object.keys(overrides || {}).filter(k => k !== "settingsUpdatedAt");
    const nextSettingsUpdatedAt = normalizeSettingsUpdatedAt({
      ...settingsUpdatedAt,
      ...(overrides?.settingsUpdatedAt || {}),
      ...Object.fromEntries(touchedKeys.map(k => [k, touchedAt])),
    });
    const next = currentSettings({ ...overrides, settingsUpdatedAt: nextSettingsUpdatedAt });
    setSettingsUpdatedAtRaw(nextSettingsUpdatedAt);

    save(`${uk}_fs`, next.fontSize);
    save(`${uk}_dm`, next.darkMode);
    save(`${uk}_th`, next.theme);
    save(`${uk}_ws`, next.workStart);
    save(`${uk}_we`, next.workEnd);
    save(`${uk}_meal_breaks`, normalizeMealBreaks(next.mealBreaks));
    save(`${uk}_planning_rules`, normalizePlanningRules(next.planningRules));
    save(`${uk}_settings_updated_at`, nextSettingsUpdatedAt);
    save(`${uk}_deleted_records`, normalizeDeletedRecords(next.deletedRecords));
    save(`${uk}_calendars`, normalizeCalendars(next.calendars));
    save(`${uk}_hidden_cals`, Array.isArray(next.hiddenCals) ? next.hiddenCals : []);
    save(`${uk}_nf`, next.notifs);
    save(`${uk}_push_enabled`, Boolean(next.pushEnabled));
    save(`${uk}_tz`, next.timezone);
    save(`${uk}_categories`, next.categories);
    save(`${uk}_templates`, next.templates);
    save(`${uk}_journal_activities`, next.journalActivities);
    save(`${uk}_memory_tags`, next.memoryTags || MEMORY_TAGS);
    save(`${uk}_rituals`, normalizeRituals(next.rituals));
    save(`${uk}_ritual_completions`, normalizeRitualCompletions(next.ritualCompletions));
    save(`${uk}_habits`, normalizeHabits(next.habits));
    save(`${uk}_habit_completions`, normalizeHabitCompletions(next.habitCompletions));
    save(`${uk}_daily_checkins`, normalizeDailyCheckIns(next.dailyCheckIns));
    save(`${uk}_tomorrow_resets`, normalizeTomorrowResets(next.tomorrowResets));
    save(`${uk}_weekly_resets`, normalizeWeeklyResets(next.weeklyResets));
    save(`${uk}_affirmations`, normalizeAffirmations(next.affirmations));
    save(`${uk}_affirmation_settings`, normalizeAffirmationSettings(next.affirmationSettings));
    save(`${uk}_notification_preferences`, normalizeNotificationPreferences(next.notificationPreferences));
    save(`${uk}_sync_conflict_log`, normalizeSyncConflictLog(next.syncConflictLog));
    save(`${uk}_data_migration_version`, Number(next.dataMigrationVersion || 0));
    save(`${uk}_memory_storage_migrated_at`, next.memoryStorageMigratedAt || null);
    saveJournalLocal(uk, auth.user?.id, next.journal ?? journal);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user) {
      queueCloudSave(events, tasks, next);
    }
  };


  useEffect(() => {
    if (!auth.user?.id || !dataReady) return;
    const currentVersion = Number(dataMigrationVersion || 0);
    if (currentVersion >= Core.DATA_MIGRATION_VERSION) return;

    const now = new Date().toISOString();
    const nextTasks = Core.migrateTaskCategories(tasks);
    const nextCategories = normalizeCategories(categories);
    const nextDeletedRecords = normalizeDeletedRecords(deletedRecords);
    const nextSettingsUpdatedAt = normalizeSettingsUpdatedAt({
      ...settingsUpdatedAt,
      categories: now,
      deletedRecords: now,
      dataMigrationVersion: now,
    });

    Core.removeLegacyLocalStorageKeys(uk);
    setTkRaw(nextTasks);
    setCatRaw(nextCategories);
    setDeletedRecordsRaw(nextDeletedRecords);
    setSettingsUpdatedAtRaw(nextSettingsUpdatedAt);
    setDataMigrationVersionRaw(Core.DATA_MIGRATION_VERSION);

    save(`${uk}_tk`, nextTasks);
    save(`${uk}_categories`, nextCategories);
    save(`${uk}_deleted_records`, nextDeletedRecords);
    save(`${uk}_settings_updated_at`, nextSettingsUpdatedAt);
    save(`${uk}_data_migration_version`, Core.DATA_MIGRATION_VERSION);
    save(`${uk}_updated_at`, now);

    const nextSettings = currentSettings({
      categories: nextCategories,
      deletedRecords: nextDeletedRecords,
      settingsUpdatedAt: nextSettingsUpdatedAt,
      dataMigrationVersion: Core.DATA_MIGRATION_VERSION,
    });
    queueCloudSave(events, nextTasks, nextSettings);
    setToast({ text: "Tempo data cleaned up for Phase 17 ✓", ts: Date.now() });
  }, [auth.user?.id, dataReady, dataMigrationVersion]);

  useEffect(() => {
    if (!auth.user?.id || !dataReady) return;
    const current = normalizeDeletedRecords(deletedRecords);
    const pruned = Core.pruneDeletedRecords(current);
    if (JSON.stringify(current) === JSON.stringify(pruned)) return;
    const now = new Date().toISOString();
    const nextSettingsUpdatedAt = normalizeSettingsUpdatedAt({ ...settingsUpdatedAt, deletedRecords: now });
    setDeletedRecordsRaw(pruned);
    setSettingsUpdatedAtRaw(nextSettingsUpdatedAt);
    save(`${uk}_deleted_records`, pruned);
    save(`${uk}_settings_updated_at`, nextSettingsUpdatedAt);
    save(`${uk}_updated_at`, now);
    queueCloudSave(events, tasks, currentSettings({ deletedRecords: pruned, settingsUpdatedAt: nextSettingsUpdatedAt }));
  }, [auth.user?.id, dataReady]);

  function completeOnboarding(config, options = {}) {
    const now = new Date().toISOString();
    if (options?.skipped || !config) {
      save(`${uk}_onboarding_skipped`, true);
      save(`${uk}_onboarding_completed_at`, now);
      setShowOnboarding(false);
      setToast({ text: "Onboarding skipped. You can restart it in Settings.", ts: Date.now() });
      return;
    }

    const hourFromTime = (value, fallback) => {
      const match = /^([0-2]\d):([0-5]\d)$/.exec(String(value || ""));
      if (!match) return fallback;
      return Math.max(0, Math.min(23, Number(match[1])));
    };
    const nextWorkStart = hourFromTime(config.startTime, workStart);
    const nextWorkEnd = Math.max(nextWorkStart + 1, hourFromTime(config.windDownTime, workEnd));
    setWSRaw(nextWorkStart);
    setWERaw(Math.min(23, nextWorkEnd));
    setWorkHoursCtx(nextWorkStart, Math.min(23, nextWorkEnd));

    const currentHabits = normalizeHabits(habits);
    const existingHabitKeys = new Set(currentHabits.map(h => `${h.templateId || ""}|${String(h.name || "").trim().toLowerCase()}`));
    let nextHabits = [...currentHabits];
    (config.habitIds || []).forEach(id => {
      const template = HABIT_TEMPLATES.find(t => t.id === id);
      if (!template) return;
      const key = `${template.id}|${String(template.name || "").trim().toLowerCase()}`;
      const nameKey = `|${String(template.name || "").trim().toLowerCase()}`;
      if (existingHabitKeys.has(key) || existingHabitKeys.has(nameKey)) return;
      const habit = habitFromTemplate(template, nextHabits);
      nextHabits.push(habit);
      existingHabitKeys.add(key);
    });

    const nextNotificationPreferences = normalizeNotificationPreferences({
      ...notificationPreferences,
      journal: { ...(notificationPreferences.journal || {}), enabled: Boolean(config.reminders?.journal) },
      tomorrowReset: { ...(notificationPreferences.tomorrowReset || {}), enabled: Boolean(config.reminders?.tomorrowReset) },
      weeklyReset: { ...(notificationPreferences.weeklyReset || {}), enabled: Boolean(config.reminders?.weeklyReset) },
    });

    setHabitsRaw(nextHabits);
    setNotificationPreferencesRaw(nextNotificationPreferences);
    save(`${uk}_habits`, nextHabits);
    save(`${uk}_notification_preferences`, nextNotificationPreferences);
    save(`${uk}_ws`, nextWorkStart);
    save(`${uk}_we`, Math.min(23, nextWorkEnd));
    save(`${uk}_onboarding_completed`, true);
    save(`${uk}_onboarding_completed_at`, now);
    save(`${uk}_onboarding_skipped`, false);
    save(`${uk}_updated_at`, now);
    persistSettings({ workStart: nextWorkStart, workEnd: Math.min(23, nextWorkEnd), habits: nextHabits, notificationPreferences: nextNotificationPreferences });
    setShowOnboarding(false);
    setPage("today");
    setToast({ text: "Tempo onboarding complete ✓", ts: Date.now() });
  }

  function restartOnboarding() {
    save(`${uk}_onboarding_prompted`, true);
    setSettingsOpen(false);
    setShowOnboarding(true);
  }

  const setFontSize = v => {
    setFSRaw(v);
    persistSettings({ fontSize: v });
  };

  const setDarkMode = v => {
    const n = typeof v === "function" ? v(darkMode) : v;
    setDMRaw(n);
    persistSettings({ darkMode: n });
  };

  const setWorkStart = v => {
    const n = Number(v);
    setWSRaw(n);
    setWorkHoursCtx(n, workEnd);
    persistSettings({ workStart: n });
  };

  const setWorkEnd = v => {
    const n = Number(v);
    setWERaw(n);
    setWorkHoursCtx(workStart, n);
    persistSettings({ workEnd: n });
  };


  const setMealBreaks = v => {
    const n = normalizeMealBreaks(typeof v === "function" ? v(mealBreaks) : v);
    setMealBreaksRaw(n);
    persistSettings({ mealBreaks: n });
  };

  const setPlanningRules = v => {
    const n = normalizePlanningRules(typeof v === "function" ? v(planningRules) : v);
    setPlanningRulesRaw(n);
    persistSettings({ planningRules: n });
  };

  // Keep work-hours context in sync whenever they change (via effect, not during render)
  useEffect(() => {
    setWorkHoursCtx(workStart, workEnd);
  }, [workStart, workEnd]);
  // Keep display timezone context in sync whenever timezone changes
  useEffect(() => {
    setDisplayTimezoneCtx(timezone);
  }, [timezone]);


  const setNotifs = v => {
    const n = typeof v === "function" ? v(notifs) : v;
    setNfRaw(n);
    persistSettings({ notifs: n });
  };
  const setPushEnabled = v => {
    const n = typeof v === "function" ? v(pushEnabled) : v;
    setPushEnabledRaw(Boolean(n));
    persistSettings({ pushEnabled: Boolean(n) });
  };
  const setNotificationPreferences = v => {
    const n = normalizeNotificationPreferences(typeof v === "function" ? v(notificationPreferences) : v);
    setNotificationPreferencesRaw(n);
    save(`${uk}_notification_preferences`, n);
    const nextAffirmationSettings = normalizeAffirmationSettings({
      ...affirmationSettings,
      reminderEnabled: Boolean(n.affirmations.enabled),
      reminderTime: n.affirmations.time || DEFAULT_NOTIFICATION_PREFERENCES.affirmations.time,
    });
    setAffirmationSettingsRaw(nextAffirmationSettings);
    save(`${uk}_affirmation_settings`, nextAffirmationSettings);
    persistSettings({ notificationPreferences: n, affirmationSettings: nextAffirmationSettings });
  };
  async function enableClosedPushNotifications() {
    try {
      const result = await registerTempoPushNotifications(auth.user?.id);
      if (!result?.ok) throw new Error(result?.reason || "Push setup failed");
      setToast("Closed-app push notifications enabled ✓");
      return true;
    } catch (err) {
      console.warn("Push notification setup failed", err);
      setToast(err?.message || "Push setup failed. Check VAPID/server setup.");
      return false;
    }
  }

  const setTimezone = v => {
    setTzRaw(v);
    persistSettings({ timezone: v });
  };

  const setCategories = v => {
    const n = normalizeCategories(typeof v === "function" ? v(categories) : v);
    setCatRaw(n);
    save(`${uk}_categories`, n);
    persistSettings({ categories: n });
  };
  const setTemplates = v => {
    const n = typeof v === "function" ? v(templates) : v;
    setTplRaw(n);
    save(`${uk}_templates`, n);
    persistSettings({ templates: n });
  };
  const setJournalActivities = v => {
    const n = typeof v === "function" ? v(journalActivities) : v;
    setJournalActivitiesRaw(n);
    save(`${uk}_journal_activities`, n);
    persistSettings({ journalActivities: n });
  };
  const setMemoryTags = v => {
    const n = [...new Set((typeof v === "function" ? v(memoryTags) : v).map(memoryTagLabel).filter(Boolean))];
    setMemoryTagsRaw(n);
    save(`${uk}_memory_tags`, n);
    persistSettings({ memoryTags: n });
  };
  const setRituals = v => {
    const n = normalizeRituals(typeof v === "function" ? v(rituals) : v);
    setRitualsRaw(n);
    save(`${uk}_rituals`, n);
    persistSettings({ rituals: n });
  };

  const setRitualCompletions = v => {
    const n = normalizeRitualCompletions(typeof v === "function" ? v(ritualCompletions) : v);
    setRitualCompletionsRaw(n);
    save(`${uk}_ritual_completions`, n);
    persistSettings({ ritualCompletions: n });
  };

  function addRitual(ritual) {
    const now = new Date().toISOString();
    const clean = normalizeRitual({ ...ritual, id: ritual.id || "ritual-" + uid(), createdAt: ritual.createdAt || now, updatedAt: now });
    setRituals(list => [...list, clean]);
    setToast({ text: `Created ritual “${clean.name}” ✓`, ts: Date.now() });
  }

  function editRitual(id, patch) {
    const now = new Date().toISOString();
    setRituals(list => list.map(r => r.id === id ? normalizeRitual({ ...r, ...patch, id, updatedAt: now }) : r));
    setToast({ text: "Ritual updated ✓", ts: Date.now() });
  }

  function archiveRitual(ritual, archived = true) {
    if (!ritual?.id) return;
    editRitual(ritual.id, { archived: Boolean(archived) });
    setToast({ text: archived ? "Ritual archived ✓" : "Ritual restored ✓", ts: Date.now() });
  }

  function deleteRitual(ritual) {
    if (!ritual?.id) return;
    if (!window.confirm(`Delete ritual "${ritual.name}"? Past check-ins will stay in your history.`)) return;
    const now = new Date().toISOString();
    const nextDeletedRecords = addDeletedRecords(deletedRecords, "rituals", ritual.id, now);
    setDeletedRecordsRaw(nextDeletedRecords);
    save(`${uk}_deleted_records`, nextDeletedRecords);
    setRitualsRaw(rituals.filter(r => r.id !== ritual.id));
    save(`${uk}_rituals`, rituals.filter(r => r.id !== ritual.id));
    persistSettings({ rituals: rituals.filter(r => r.id !== ritual.id), deletedRecords: nextDeletedRecords });
    setToast({ text: "Ritual deleted ✓", ts: Date.now() });
  }

  function upsertRitualCompletion(ritual, updater) {
    const today = dateKey(TODAY);
    const now = new Date().toISOString();
    setRitualCompletions(list => {
      const cleanList = normalizeRitualCompletions(list);
      const existing = cleanList.find(c => c.ritualId === ritual.id && c.date === today);
      const base = existing || { id: `${ritual.id}:${today}`, ritualId: ritual.id, date: today, completedSteps: [], completedAt: null, skippedAt: null, note: "", createdAt: now, updatedAt: now };
      const next = normalizeRitualCompletion({ ...updater(base), updatedAt: now });
      return existing ? cleanList.map(c => c.id === existing.id ? next : c) : [...cleanList, next];
    });
  }

  function toggleRitualStep(ritual, stepId) {
    upsertRitualCompletion(ritual, current => {
      const set = new Set(current.completedSteps || []);
      if (set.has(stepId)) set.delete(stepId); else set.add(stepId);
      const completedSteps = [...set];
      const allDone = ritual.steps.every(step => completedSteps.includes(step.id));
      return { ...current, completedSteps, skippedAt: null, completedAt: allDone ? (current.completedAt || new Date().toISOString()) : null };
    });
  }

  function skipRitualToday(ritual) {
    upsertRitualCompletion(ritual, current => current.skippedAt ? { ...current, skippedAt: null } : { ...current, skippedAt: new Date().toISOString(), completedAt: null });
  }

  function completeRitualToday(ritual) {
    upsertRitualCompletion(ritual, current => ({ ...current, completedSteps: ritual.steps.map(s => s.id), skippedAt: null, completedAt: current.completedAt || new Date().toISOString() }));
  }


  const setHabits = v => {
    const n = normalizeHabits(typeof v === "function" ? v(habits) : v);
    setHabitsRaw(n);
    save(`${uk}_habits`, n);
    persistSettings({ habits: n });
  };

  const setHabitCompletions = v => {
    const n = normalizeHabitCompletions(typeof v === "function" ? v(habitCompletions) : v);
    setHabitCompletionsRaw(n);
    save(`${uk}_habit_completions`, n);
    persistSettings({ habitCompletions: n });
  };

  const setDailyCheckIns = v => {
    const n = normalizeDailyCheckIns(typeof v === "function" ? v(dailyCheckIns) : v);
    setDailyCheckInsRaw(n);
    save(`${uk}_daily_checkins`, n);
    persistSettings({ dailyCheckIns: n });
  };

  function saveDailyCheckIn(patch) {
    const now = new Date().toISOString();
    const targetDate = patch?.date || dateKey(TODAY);
    setDailyCheckIns(list => {
      const cleanList = normalizeDailyCheckIns(list);
      const existing = cleanList.find(entry => entry.date === targetDate);
      const base = existing || { id: `checkin-${targetDate}`, date: targetDate, mood: null, energy: null, note: "", createdAt: now, updatedAt: now };
      const next = normalizeDailyCheckIn({ ...base, ...patch, id: base.id, date: targetDate, createdAt: base.createdAt || now, updatedAt: now });
      return existing ? cleanList.map(entry => entry.id === existing.id ? next : entry) : [next, ...cleanList];
    });
    setToast({ text: "Daily check-in saved ✓", ts: Date.now() });
  }


  const setTomorrowResets = v => {
    const n = normalizeTomorrowResets(typeof v === "function" ? v(tomorrowResets) : v);
    setTomorrowResetsRaw(n);
    save(`${uk}_tomorrow_resets`, n);
    persistSettings({ tomorrowResets: n });
  };

  function saveTomorrowReset({ taskActions = {}, reflection = {} } = {}) {
    const now = new Date().toISOString();
    const todayKey = dateKey(TODAY);
    const tomorrow = addDaysSafe(TODAY, 1);
    const tomorrowPatch = taskPeriodPatchForScope("day", tomorrow);
    const weekPatch = taskPeriodPatchForScope("week", TODAY);
    const actionIds = new Set(Object.keys(taskActions || {}));
    const unfinished = tasks.filter(t => !t.done && (taskFallsOnDateForReset(t, TODAY) || actionIds.has(t.id)));
    const actionRows = unfinished.map(t => {
      const action = TOMORROW_RESET_TASK_ACTIONS.some(a => a.id === taskActions[t.id]) ? taskActions[t.id] : "tomorrow";
      return { taskId: t.id, taskTitle: t.title, action, duration: taskDurationToMinutes(t), category: t.category };
    });
    const dropIds = new Set(actionRows.filter(row => row.action === "drop").map(row => row.taskId));
    const tomorrowIds = new Set(actionRows.filter(row => row.action === "tomorrow").map(row => row.taskId));
    const weekIds = new Set(actionRows.filter(row => row.action === "week").map(row => row.taskId));
    const keepIds = new Set(actionRows.filter(row => row.action === "keep").map(row => row.taskId));

    pushUndo();
    setTasks(ts => ts
      .filter(t => !dropIds.has(t.id))
      .map(t => {
        if (tomorrowIds.has(t.id)) return touchRecord({ ...t, scope: "day", done: false, completedAt: null, completedDate: null, scheduledEventId: null, scheduledStart: null, scheduledEnd: null, ...tomorrowPatch });
        if (weekIds.has(t.id)) return touchRecord({ ...t, scope: "week", done: false, completedAt: null, completedDate: null, scheduledEventId: null, scheduledStart: null, scheduledEnd: null, ...weekPatch });
        if (keepIds.has(t.id)) {
          const { scheduledEventId, scheduledStart, scheduledEnd, ...rest } = t;
          return touchRecord({ ...rest, done: false, completedAt: null, completedDate: null });
        }
        return t;
      }));

    const resetEntry = normalizeTomorrowReset({
      id: `reset-${todayKey}`,
      date: todayKey,
      completedAt: now,
      taskActions: actionRows,
      reflection,
      createdAt: tomorrowResetForDate(tomorrowResets, todayKey)?.createdAt || now,
      updatedAt: now,
    });
    setTomorrowResets(list => {
      const cleanList = normalizeTomorrowResets(list);
      const existing = cleanList.find(entry => entry.date === todayKey);
      return existing ? cleanList.map(entry => entry.id === existing.id ? resetEntry : entry) : [resetEntry, ...cleanList];
    });

    const nextJournalEntry = normalizeMemoryEntry(journal[todayKey] || {});
    const resetNoteParts = [
      reflection.wentWell ? `What went well: ${reflection.wentWell}` : "",
      reflection.difficult ? `What felt difficult: ${reflection.difficult}` : "",
      reflection.moveTomorrow ? `Move to tomorrow: ${reflection.moveTomorrow}` : "",
      reflection.tomorrowMainThing ? `Tomorrow's main thing: ${reflection.tomorrowMainThing}` : "",
      reflection.gratitude ? `Gratitude: ${reflection.gratitude}` : "",
    ].filter(Boolean);
    if (resetNoteParts.length) {
      setJournal(j => ({
        ...j,
        [todayKey]: sanitizeMemoryEntryForStorage({
          ...nextJournalEntry,
          note: [nextJournalEntry.note, resetNoteParts.join("\n")].filter(Boolean).join("\n\n"),
          gratitude: reflection.gratitude ? [...(nextJournalEntry.gratitude || []), reflection.gratitude].filter(Boolean).slice(-5) : (nextJournalEntry.gratitude || []),
          highlights: { ...(nextJournalEntry.highlights || {}), tomorrowMainThing: reflection.tomorrowMainThing || nextJournalEntry.highlights?.tomorrowMainThing || "" },
          updatedAt: now,
        }),
      }));
    }

    setShowCarryOver(false);
    const movedTomorrow = actionRows.filter(row => row.action === "tomorrow").length;
    const movedWeek = actionRows.filter(row => row.action === "week").length;
    const dropped = actionRows.filter(row => row.action === "drop").length;
    setToast({ text: `Tomorrow Reset saved · ${movedTomorrow} tomorrow · ${movedWeek} this week${dropped ? ` · ${dropped} dropped` : ""} ✓`, ts: Date.now() });
  }


  const setWeeklyResets = v => {
    const n = normalizeWeeklyResets(typeof v === "function" ? v(weeklyResets) : v);
    setWeeklyResetsRaw(n);
    save(`${uk}_weekly_resets`, n);
    persistSettings({ weeklyResets: n });
  };

  function saveWeeklyReset({ weekStart: targetWeekStart, taskActions = {}, priorities = [], keyEvents = [], habitFocus = [], intention = "", reflection = {}, moodEnergySummary = {} } = {}) {
    const now = new Date().toISOString();
    const weekStartKey = targetWeekStart || dateKey(weekStart(TODAY));
    const currentWeekStartDate = localDateFromKey(weekStartKey) || weekStart(TODAY);
    const currentWeekKeys = new Set(weekDays(currentWeekStartDate).map(d => dateKey(d)));
    const nextWeekDate = addDaysSafe(currentWeekStartDate, 7);
    const unfinished = tasks.filter(t => {
      if (t.done) return false;
      const scope = taskScopeOf(t);
      if (scope === "week") return taskWeekKey(t) === weekStartKey;
      if (scope === "day") return currentWeekKeys.has(taskDayKey(t));
      return false;
    });
    const actionRows = unfinished.map(t => {
      const action = WEEKLY_RESET_TASK_ACTIONS.some(a => a.id === taskActions[t.id]) ? taskActions[t.id] : "nextWeek";
      return { taskId: t.id, taskTitle: t.title, action, duration: taskDurationToMinutes(t), category: t.category, scope: taskScopeOf(t) };
    });
    const dropIds = new Set(actionRows.filter(row => row.action === "drop").map(row => row.taskId));
    const nextWeekIds = new Set(actionRows.filter(row => row.action === "nextWeek").map(row => row.taskId));
    const keepIds = new Set(actionRows.filter(row => row.action === "keep").map(row => row.taskId));

    pushUndo();
    setTasks(ts => ts
      .filter(t => !dropIds.has(t.id))
      .map(t => {
        if (nextWeekIds.has(t.id)) {
          const scope = taskScopeOf(t);
          const patch = scope === "week" ? taskPeriodPatchForScope("week", nextWeekDate) : taskPeriodPatchForScope("day", addDaysSafe(taskAnchorDate(t, currentWeekStartDate), 7));
          return touchRecord({ ...t, scope, done: false, completedAt: null, completedDate: null, scheduledEventId: null, scheduledStart: null, scheduledEnd: null, ...patch });
        }
        if (keepIds.has(t.id)) {
          const { scheduledEventId, scheduledStart, scheduledEnd, ...rest } = t;
          return touchRecord({ ...rest, done: false, completedAt: null, completedDate: null });
        }
        return t;
      }));

    const resetEntry = normalizeWeeklyReset({
      id: `weekly-reset-${weekStartKey}`,
      weekStart: weekStartKey,
      completedAt: now,
      taskActions: actionRows,
      priorities,
      keyEvents,
      habitFocus,
      intention,
      reflection,
      moodEnergySummary,
      createdAt: weeklyResetForDate(weeklyResets, currentWeekStartDate)?.createdAt || now,
      updatedAt: now,
    });
    setWeeklyResets(list => {
      const cleanList = normalizeWeeklyResets(list);
      const existing = cleanList.find(entry => entry.weekStart === weekStartKey);
      return existing ? cleanList.map(entry => entry.id === existing.id ? resetEntry : entry) : [resetEntry, ...cleanList];
    });

    const journalKey = weekStartKey;
    const nextJournalEntry = normalizeMemoryEntry(journal[journalKey] || {});
    const resetNoteParts = [
      reflection.lastWeek ? `Weekly review: ${reflection.lastWeek}` : "",
      reflection.wins ? `Wins: ${reflection.wins}` : "",
      reflection.difficult ? `Difficult: ${reflection.difficult}` : "",
      reflection.moodEnergy ? `Mood / energy: ${reflection.moodEnergy}` : "",
      priorities?.length ? `Next priorities: ${priorities.filter(Boolean).join(" · ")}` : "",
      intention ? `Weekly intention: ${intention}` : "",
    ].filter(Boolean);
    if (resetNoteParts.length) {
      setJournal(j => ({
        ...j,
        [journalKey]: sanitizeMemoryEntryForStorage({
          ...nextJournalEntry,
          note: [nextJournalEntry.note, resetNoteParts.join("\n")].filter(Boolean).join("\n\n"),
          tags: [...new Set([...(nextJournalEntry.tags || []), "Weekly Reset"])],
          highlights: { ...(nextJournalEntry.highlights || {}), weeklyIntention: intention || nextJournalEntry.highlights?.weeklyIntention || "" },
          updatedAt: now,
        }),
      }));
    }

    const movedNextWeek = actionRows.filter(row => row.action === "nextWeek").length;
    const dropped = actionRows.filter(row => row.action === "drop").length;
    setToast({ text: `Weekly Reset saved · ${movedNextWeek} moved to next week${dropped ? ` · ${dropped} dropped` : ""} ✓`, ts: Date.now() });
  }


  const setAffirmations = v => {
    const n = normalizeAffirmations(typeof v === "function" ? v(affirmations) : v);
    setAffirmationsRaw(n);
    save(`${uk}_affirmations`, n);
    persistSettings({ affirmations: n });
  };

  const setAffirmationSettings = v => {
    const n = normalizeAffirmationSettings(typeof v === "function" ? v(affirmationSettings) : v);
    setAffirmationSettingsRaw(n);
    save(`${uk}_affirmation_settings`, n);
    const nextNotificationPreferences = normalizeNotificationPreferences({
      ...notificationPreferences,
      affirmations: { enabled: Boolean(n.reminderEnabled), time: n.reminderTime || DEFAULT_NOTIFICATION_PREFERENCES.affirmations.time },
    });
    setNotificationPreferencesRaw(nextNotificationPreferences);
    save(`${uk}_notification_preferences`, nextNotificationPreferences);
    persistSettings({ affirmationSettings: n, notificationPreferences: nextNotificationPreferences });
  };

  function toggleAffirmationFavorite(id) {
    const now = new Date().toISOString();
    setAffirmations(list => normalizeAffirmations(list).map(item => item.id === id ? normalizeAffirmation({ ...item, favorite: !item.favorite, updatedAt: now }) : item));
  }

  function saveAffirmation(affirmation) {
    const now = new Date().toISOString();
    const clean = normalizeAffirmation({ ...affirmation, id: affirmation.id || "affirm-" + uid(), source: "custom", createdAt: affirmation.createdAt || now, updatedAt: now });
    setAffirmations(list => {
      const normalized = normalizeAffirmations(list);
      return normalized.some(item => item.id === clean.id) ? normalized.map(item => item.id === clean.id ? clean : item) : [...normalized, clean];
    });
    setToast({ text: "Affirmation saved ✓", ts: Date.now() });
  }

  function deleteAffirmation(affirmation) {
    if (!affirmation?.id) return;
    const now = new Date().toISOString();
    const nextDeletedRecords = addDeletedRecords(deletedRecords, "affirmations", affirmation.id, now);
    const nextAffirmations = normalizeAffirmations(affirmations).filter(item => item.id !== affirmation.id);
    setDeletedRecordsRaw(nextDeletedRecords);
    save(`${uk}_deleted_records`, nextDeletedRecords);
    setAffirmationsRaw(nextAffirmations);
    save(`${uk}_affirmations`, nextAffirmations);
    persistSettings({ affirmations: nextAffirmations, deletedRecords: nextDeletedRecords });
    setToast({ text: "Affirmation deleted ✓", ts: Date.now() });
  }

  function addHabit(habit) {
    const now = new Date().toISOString();
    const clean = normalizeHabit({ ...habit, id: habit.id || "habit-" + uid(), createdAt: habit.createdAt || now, updatedAt: now });
    setHabits(list => [...list, clean]);
    setToast({ text: `Created habit “${clean.name}” ✓`, ts: Date.now() });
  }

  function editHabit(id, patch) {
    const now = new Date().toISOString();
    setHabits(list => list.map(h => h.id === id ? normalizeHabit({ ...h, ...patch, id, updatedAt: now }) : h));
    setToast({ text: "Habit updated ✓", ts: Date.now() });
  }

  function archiveHabit(habit, archived = true) {
    if (!habit?.id) return;
    editHabit(habit.id, { archived: Boolean(archived) });
    setToast({ text: archived ? "Habit archived ✓" : "Habit restored ✓", ts: Date.now() });
  }

  function deleteHabit(habit) {
    if (!habit?.id) return;
    if (!window.confirm(`Delete habit "${habit.name}"? Past check-ins will stay in your history.`)) return;
    const now = new Date().toISOString();
    const nextDeletedRecords = addDeletedRecords(deletedRecords, "habits", habit.id, now);
    const nextHabits = habits.filter(h => h.id !== habit.id);
    setDeletedRecordsRaw(nextDeletedRecords);
    save(`${uk}_deleted_records`, nextDeletedRecords);
    setHabitsRaw(nextHabits);
    save(`${uk}_habits`, nextHabits);
    persistSettings({ habits: nextHabits, deletedRecords: nextDeletedRecords });
    setToast({ text: "Habit deleted ✓", ts: Date.now() });
  }

  function upsertHabitCompletion(habit, updater, targetDate = TODAY) {
    const key = dateKey(targetDate);
    const now = new Date().toISOString();
    setHabitCompletions(list => {
      const cleanList = normalizeHabitCompletions(list);
      const existing = cleanList.find(c => c.habitId === habit.id && c.date === key);
      const base = existing || { id: `${habit.id}:${key}`, habitId: habit.id, date: key, count: 0, completedAt: null, note: "", createdAt: now, updatedAt: now };
      const next = normalizeHabitCompletion({ ...updater(base), updatedAt: now });
      return existing ? cleanList.map(c => c.id === existing.id ? next : c) : [...cleanList, next];
    });
  }

  function toggleHabitToday(habit) {
    upsertHabitCompletion(habit, current => {
      const target = Math.max(1, Number(habit.targetCount || 1));
      const done = Number(current.count || 0) >= target;
      return { ...current, count: done ? 0 : target, completedAt: done ? null : (current.completedAt || new Date().toISOString()) };
    });
  }

  function incrementHabitToday(habit, delta = 1) {
    upsertHabitCompletion(habit, current => {
      const target = Math.max(1, Number(habit.targetCount || 1));
      const count = Math.max(0, Math.min(999, Number(current.count || 0) + Number(delta || 0)));
      return { ...current, count, completedAt: count >= target ? (current.completedAt || new Date().toISOString()) : null };
    });
  }

  function addJournalActivity(label, group = "Custom", emoji = "✨") {
    const activity = { id: createCategoryId(label) + "-" + uid(), emoji, label, group };
    setJournalActivities(a => [...a, activity]);
    return activity;
  }
  function updateJournalActivity(id, patch = {}) {
    setJournalActivities(a => a.map(x => x.id === id ? { ...x, ...patch, label: patch.label?.trim?.() || x.label } : x));
  }
  function deleteJournalActivity(id) {
    // Archive instead of hard-deleting so older Journal pages keep their historical activity labels.
    setJournalActivities(a => a.map(x => x.id === id ? { ...x, archived: true } : x));
  }
  function reorderJournalActivities(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    setJournalActivities(list => {
      const next = [...list];
      const from = next.findIndex(a => a.id === fromId);
      const to = next.findIndex(a => a.id === toId);
      if (from < 0 || to < 0) return list;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }
  function addMemoryTag(label) {
    const clean = memoryTagLabel(label);
    if (!clean) return null;
    setMemoryTags(t => [...new Set([...t, clean])]);
    return clean;
  }
  function updateMemoryTag(oldTag, newTag) {
    const oldClean = memoryTagLabel(oldTag);
    const newClean = memoryTagLabel(newTag);
    if (!oldClean || !newClean) return;
    setMemoryTags(t => [...new Set(t.map(x => x === oldClean ? newClean : x))]);
    setJournal(j => {
      const next = { ...(j || {}) };
      Object.keys(next).forEach(k => {
        const e = normalizeMemoryEntry(next[k]);
        next[k] = { ...e, tags: [...new Set((e.tags || []).map(x => x === oldClean ? newClean : x))] };
      });
      return next;
    });
  }
  function deleteMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    setMemoryTags(t => t.filter(x => x !== clean));
    setJournal(j => {
      const next = { ...(j || {}) };
      Object.keys(next).forEach(k => {
        const e = normalizeMemoryEntry(next[k]);
        next[k] = { ...e, tags: (e.tags || []).filter(x => x !== clean) };
      });
      return next;
    });
  }

  const markMemoryStorageMigrated = iso => {
    const value = iso || new Date().toISOString();
    setMemoryStorageMigratedAtRaw(value);
    save(`${uk}_memory_storage_migrated_at`, value);
    persistSettings({ memoryStorageMigratedAt: value });
  };

  const persistCalendarConfig = (nextCalendars, nextHiddenCals = hiddenCals, nextEvents = events, extraSettings = {}) => {
    const safeCalendars = normalizeCalendars(nextCalendars);
    const safeHidden = [...new Set((Array.isArray(nextHiddenCals) ? nextHiddenCals : []).filter(id => safeCalendars.some(c => c.id === id)))];
    setCalendarsRaw(safeCalendars);
    setHiddenCals(safeHidden);
    save(`${uk}_calendars`, safeCalendars);
    save(`${uk}_hidden_cals`, safeHidden);
    const patch = { calendars: safeCalendars, hiddenCals: safeHidden, ...extraSettings };
    if (nextEvents !== events) setEventsAndTasks(nextEvents, tasks, patch);
    else persistSettings(patch);
  };

  const toggleCalVisibility = id => {
    const n = hiddenCals.includes(id) ? hiddenCals.filter(c => c !== id) : [...hiddenCals, id];
    persistCalendarConfig(calendars, n);
  };

  const addCalendar = () => {
    const name = window.prompt("New calendar name", "New Calendar");
    if (!name?.trim()) return;
    const color = window.prompt("Calendar color hex", "#FF7BAC") || "#FF7BAC";
    const now = new Date().toISOString();
    const baseId = name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "calendar";
    let id = baseId, i = 2;
    while (calendars.some(c => c.id === id)) id = `${baseId}-${i++}`;
    persistCalendarConfig([...calendars, { id, name: name.trim(), color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#FF7BAC", source: "tempo", account: null, createdAt: now, updatedAt: now }], hiddenCals);
  };

  const editCalendar = cal => {
    const name = window.prompt("Calendar name", cal.name);
    if (name === null) return;
    const color = window.prompt("Calendar color hex", cal.color || "#FF7BAC");
    if (color === null) return;
    const now = new Date().toISOString();
    persistCalendarConfig(calendars.map(c => c.id === cal.id ? { ...c, name: name.trim() || c.name, color: /^#[0-9a-f]{6}$/i.test(color) ? color : c.color, updatedAt: now } : c), hiddenCals);
  };

  const removeCalendar = cal => {
    if (calendars.length <= 1) { setToast({ text: "Keep at least one calendar", ts: Date.now() }); return; }
    if (!window.confirm(`Remove calendar "${cal.name}"? Existing events will move to another calendar.`)) return;
    const timestamp = new Date().toISOString();
    const remaining = calendars.filter(c => c.id !== cal.id);
    const fallback = remaining[0]?.id || "personal";
    const nextEvents = events.map(e => e.calendar === cal.id ? touchRecord(e, { calendar: fallback }) : e);
    const nextHidden = hiddenCals.filter(id => id !== cal.id);
    const nextDeletedRecords = addDeletedRecords(deletedRecords, "calendars", cal.id, timestamp);
    const nextSettingsUpdatedAt = { ...normalizeSettingsUpdatedAt(settingsUpdatedAt), calendars: timestamp, hiddenCals: timestamp, deletedRecords: timestamp };
    setDeletedRecordsRaw(nextDeletedRecords);
    setSettingsUpdatedAtRaw(nextSettingsUpdatedAt);
    save(`${uk}_deleted_records`, nextDeletedRecords);
    save(`${uk}_settings_updated_at`, nextSettingsUpdatedAt);
    persistCalendarConfig(remaining, nextHidden, nextEvents, { deletedRecords: nextDeletedRecords, settingsUpdatedAt: nextSettingsUpdatedAt });
  };
  const setJournal   = v => {
    const n = typeof v === "function" ? v(journal) : v;
    const clean = sanitizeMemoryJournalForStorage(n);
    setJournalRaw(clean);
    saveJournalLocal(uk, auth.user?.id, clean);
    save(`${uk}_updated_at`, new Date().toISOString());
    if (auth.user && dataReady) return queueCloudSave(events, tasks, currentSettings({ journal: clean }));
    markPendingLocalChange();
    setSyncStatus({ status: "offline", message: "Offline edits pending", lastError: "" });
    return Promise.resolve(true);
  };
  const saveMemoryEntry = async (key, data) => {
    const clean = sanitizeMemoryJournalForStorage({ ...(journal || {}), [key]: data });
    if (auth.user && dataReady) {
      await queueCloudSave(events, tasks, currentSettings({ journal: clean }), { strict: true });
      setJournalRaw(clean);
      await saveJournalLocal(uk, auth.user?.id, clean);
      save(`${uk}_updated_at`, new Date().toISOString());
      return true;
    }
    setJournalRaw(clean);
    await saveJournalLocal(uk, auth.user?.id, clean);
    save(`${uk}_updated_at`, new Date().toISOString());
    markPendingLocalChange();
    setSyncStatus({ status: "offline", message: "Offline edits pending", lastError: "Not signed in" });
    return true;
  };
  const setTheme = v => {
    setThRaw(v);
    persistSettings({ theme: v });
  };

  // App modal states for confirmations and recurrence choices.
  const [recurringPrompt, setRecurringPrompt] = useState(null); // { resolve, action }
  const [eventConflictPrompt, setEventConflictPrompt] = useState(null); // { resolve, action, conflicts }
  const [recurringTaskPrompt, setRecurringTaskPrompt] = useState(null); // { resolve, task }
  const [taskReschedulePrompt, setTaskReschedulePrompt] = useState(null); // { resolve, task, defaultDate }

  function chooseRecurrenceScope(action) {
    return new Promise(resolve => {
      setRecurringPrompt({ resolve, action });
    });
  }

  function chooseRecurringTaskAction(task) {
    return new Promise(resolve => {
      setRecurringTaskPrompt({ resolve, task });
    });
  }

  function chooseTaskRescheduleDate(task) {
    return new Promise(resolve => {
      setTaskReschedulePrompt({
        resolve,
        task,
        defaultDate: dateKey(addDaysSafe(taskAnchorDate(task, TODAY), 1)),
      });
    });
  }

  function RecurrenceScopeModal() {
    if (!recurringPrompt) return null;
    const pick = scope => {
      setRecurringPrompt(null);
      recurringPrompt.resolve(scope);
    };
    return (
      <div className="modal-overlay" onClick={() => pick("single")} role="dialog" aria-modal="true" aria-label="Edit recurring event">
        <div className="modal" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span style={{ fontWeight: 800 }}>🔄 {recurringPrompt.action} recurring event</span>
          </div>
          <div className="modal-body" style={{ gap: 8 }}>
            <button className="tf-save" style={{ width: "100%", marginBottom: 0 }} onClick={() => pick("single")}>This event only</button>
            <button className="tf-cancel" style={{ width: "100%", marginBottom: 0 }} onClick={() => pick("following")}>This and following events</button>
            <button className="tf-cancel" style={{ width: "100%", marginBottom: 0 }} onClick={() => pick("all")}>All events in series</button>
          </div>
        </div>
      </div>
    );
  }


  function EventConflictModal() {
    if (!eventConflictPrompt) return null;
    const pick = ok => {
      setEventConflictPrompt(null);
      eventConflictPrompt.resolve(Boolean(ok));
    };
    return (
      <div className="modal-overlay" onClick={() => pick(false)} role="dialog" aria-modal="true" aria-label="Event overlap warning">
        <div className="modal app-choice-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span style={{ fontWeight: 800 }}>⚠️ Event overlap</span>
            <button className="modal-close" onClick={() => pick(false)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="choice-modal-copy">{eventConflictPrompt.action || "This event"} overlaps with:</div>
            <div className="overlap-list">
              {(eventConflictPrompt.conflicts || []).map(e => (
                <div key={e.id} className="overlap-item">
                  <strong>{e.title}</strong>
                  <span>{fmt(e.start)}–{fmt(e.end)}</span>
                </div>
              ))}
            </div>
            <div className="choice-modal-copy">Place it anyway?</div>
          </div>
          <div className="modal-footer">
            <button className="tf-cancel" onClick={() => pick(false)}>Cancel</button>
            <button className="tf-save" onClick={() => pick(true)}>Place anyway</button>
          </div>
        </div>
      </div>
    );
  }

  function RecurringTaskScopeModal() {
    if (!recurringTaskPrompt) return null;
    const task = recurringTaskPrompt.task || {};
    const pick = choice => {
      setRecurringTaskPrompt(null);
      recurringTaskPrompt.resolve(choice);
    };
    return (
      <div className="modal-overlay" onClick={() => pick(null)} role="dialog" aria-modal="true" aria-label="Recurring task options">
        <div className="modal app-choice-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span style={{ fontWeight: 800 }}>🔄 Recurring task</span>
            <button className="modal-close" onClick={() => pick(null)}>✕</button>
          </div>
          <div className="modal-body" style={{ gap: 8 }}>
            <div className="choice-modal-copy"><strong>{task.title}</strong><br/>Choose how to apply this action.</div>
            <button className="choice-row" onClick={() => pick("single")}><strong>This task only</strong><span>Delete or skip only this occurrence.</span></button>
            <button className="choice-row" onClick={() => pick("future")}><strong>This and future tasks</strong><span>Keep earlier tasks and stop the series from here.</span></button>
            <button className="choice-row" onClick={() => pick("series")}><strong>Entire recurring series</strong><span>Remove the root task and generated tasks.</span></button>
            <button className="choice-row" onClick={() => pick("skip")}><strong>Skip this occurrence</strong><span>Hide this occurrence but keep the series going.</span></button>
            <button className="choice-row" onClick={() => pick("reschedule")}><strong>Reschedule this occurrence</strong><span>Move this task to another date.</span></button>
          </div>
        </div>
      </div>
    );
  }

  function TaskRescheduleDateModal() {
    const [draftDate, setDraftDate] = useState(taskReschedulePrompt?.defaultDate || dateKey(TODAY));
    useEffect(() => {
      if (taskReschedulePrompt?.defaultDate) setDraftDate(taskReschedulePrompt.defaultDate);
    }, [taskReschedulePrompt?.defaultDate]);
    if (!taskReschedulePrompt) return null;
    const task = taskReschedulePrompt.task || {};
    const pick = date => {
      setTaskReschedulePrompt(null);
      taskReschedulePrompt.resolve(date);
    };
    return (
      <div className="modal-overlay" onClick={() => pick(null)} role="dialog" aria-modal="true" aria-label="Reschedule recurring task">
        <div className="modal app-choice-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span style={{ fontWeight: 800 }}>📅 Reschedule task</span>
            <button className="modal-close" onClick={() => pick(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div className="choice-modal-copy"><strong>{task.title}</strong><br/>Choose the new date for this occurrence.</div>
            <input type="date" className="modal-select" value={draftDate} onChange={e => setDraftDate(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="tf-cancel" onClick={() => pick(null)}>Cancel</button>
            <button className="tf-save" onClick={() => pick(draftDate)}>Move task</button>
          </div>
        </div>
      </div>
    );
  }

  function pushUndo() { setUndo(s => [...s.slice(-(UNDO_STACK_MAX - 1)), { events, tasks }]); }
  function undo() {
    setUndo(s => {
      if (!s.length) return s;
      const l = s[s.length - 1];
      setEvRaw(l.events); setTkRaw(l.tasks); syncEvents(l.events, l.tasks); return s.slice(0, -1);
    });
  }

  function toggleTask(id) {
    pushUndo();
    setTasks(ts => {
      const task = ts.find(t => t.id === id);
      if (!task) return ts;
      const nextDone = !task.done;
      const completedAt = new Date().toISOString();
      const completedDate = taskCompletionTargetKey(task);
      let updated = ts.map(t => t.id === id ? touchRecord(t, { done: nextDone, completedAt: nextDone ? completedAt : null, completedDate: nextDone ? completedDate : null }) : t);
      if (nextDone) {
        const nextRecurring = createNextRecurringTask(task, ts);
        if (nextRecurring) updated = [...updated, touchRecord(nextRecurring, { createdAt: new Date().toISOString() })];
      }
      return updated;
    });
  }
  function addTask(task)          { pushUndo(); setTasks(ts => [...ts, touchRecord(withTaskPeriod(task, taskPeriodDate), { createdAt: task.createdAt || new Date().toISOString() })]); }
  function eventConflictsFor(candidate, skipId = null) {
    const skipBase = skipId ? getBaseEventId(skipId) : getBaseEventId(candidate.id);
    return expandRecurring(events, dayStart(candidate.start), addDaysSafe(dayStart(candidate.start), 1))
      .filter(e => getBaseEventId(e.id) !== skipBase && eventOccursOnDay(e, candidate.start) && candidate.start < e.end && candidate.end > e.start)
      .slice(0, 4);
  }
  function confirmEventPlacement(candidate, skipId = null, action = "Place event") {
    const conflicts = eventConflictsFor(candidate, skipId);
    if (!conflicts.length) return Promise.resolve(true);
    return new Promise(resolve => {
      setEventConflictPrompt({ resolve, action, conflicts });
    });
  }
  function moveTaskToPeriod(id, scope, anchorDate) {
    pushUndo();
    const periodPatch = taskPeriodPatchForScope(scope, anchorDate);
    setTasks(ts => ts.map(t => t.id === id ? touchRecord({
      ...t,
      scope,
      ...periodPatch,
      completedDate: t.done && scope === "day" ? dateKey(anchorDate) : t.completedDate,
    }) : t));
  }
  async function addEvent(ev, options = {})           { if (!options.skipConflictCheck && !(await confirmEventPlacement(ev, ev.id, "Add event"))) return false; pushUndo(); setEvents(es => [...es, touchRecord(ev, { createdAt: ev.createdAt || new Date().toISOString() })]); return true; }


  function taskCalendarFor(task) {
    return Core.isPersonalCategory(task?.category) ? "personal" : "work";
  }
  function buildTaskEvent(task, start, end, extra = {}) {
    const cat = categories.find(c => c.id === task.category);
    return {
      id: "e" + uid(),
      title: `Task: ${task.title}`,
      start,
      end,
      allDay: false,
      calendar: taskCalendarFor(task),
      category: task.category || "important",
      fixed: false,
      notes: [task.notes || "", `Linked task: ${task.id}`].filter(Boolean).join("\n\n"),
      color: cat?.color || null,
      recurrence: null,
      reminder: { type: "minutes", minutesBefore: 10 },
      linkedTaskId: task.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...extra,
    };
  }
  function lifestylePlanningBlocksForDate(date) {
    const planDate = dayStart(date);
    const blocks = [];
    normalizeHabits(habits)
      .filter(h => habitRunsOnDate(h, planDate) && !habitProgress(h, habitCompletions, planDate).completed)
      .forEach(h => {
        const reminder = normalizeHabitReminder(h.reminder);
        if (reminder.type === "none" || !reminder.time) return;
        const start = dayStart(planDate);
        start.setMinutes(timeStringToMinutes(reminder.time));
        const end = new Date(start.getTime() + 10 * 60000);
        blocks.push({ id: `habit-block-${h.id}-${dateKey(planDate)}`, title: `Habit: ${h.name}`, start, end, allDay: false, calendar: "personal", category: h.category || "personal", fixed: true, planningProtected: true, source: "habit" });
      });
    return blocks.filter(block => block.end > block.start);
  }

  function freeSlotsForDate(date, extraEvents = [], rulesOverride = null) {
    const safeExtraEvents = Array.isArray(extraEvents) ? extraEvents : [];
    // getFreeBlocks returns minute offsets, so convert those offsets back into
    // real Date objects before comparing with the current time or durations.
    const rules = rulesOverride ? normalizePlanningRules(rulesOverride) : normalizePlanningRules(planningRules);
    const startHour = Number(workStart);
    const endHour = Number(workEnd);
    if (!Number.isFinite(startHour) || !Number.isFinite(endHour) || endHour <= startHour) return [];

    const toDateAtMinute = minuteOfDay => {
      const d = dayStart(date);
      d.setMinutes(minuteOfDay);
      return d;
    };

    const mealBlocks = normalizeMealBreaks(mealBreaks)
      .filter(b => b.enabled)
      .map(b => {
        const st = dayStart(date); st.setMinutes(timeStringToMinutes(b.start));
        const en = dayStart(date); en.setMinutes(timeStringToMinutes(b.end) + rules.afterMealBufferMinutes);
        return { id: `meal-${b.id}-${dateKey(date)}`, title: b.label, start: st, end: en, allDay: false, category: "meal-break", calendar: "personal", fixed: true, planningProtected: true };
      })
      .filter(b => b.end > b.start);
    const lifestyleBlocks = lifestylePlanningBlocksForDate(date);
    const rawBooked = expandRecurring([...events, ...safeExtraEvents, ...mealBlocks, ...lifestyleBlocks], dayStart(date), addDaysSafe(dayStart(date), 1))
      .filter(e => eventOccursOnDay(e, date) && !isAllDayEvent(e) && !e.deletedAt);
    const bufferMs = Math.max(0, Number(rules.bufferMinutes || 0)) * 60000;
    const booked = rawBooked.map(e => e.planningProtected ? e : ({
      ...e,
      start: new Date((e.start instanceof Date ? e.start : new Date(e.start)).getTime() - bufferMs),
      end: new Date((e.end instanceof Date ? e.end : new Date(e.end)).getTime() + bufferMs),
    }));
    const now = new Date();
    return getFreeBlocks(booked, date, startHour, endHour)
      .map(b => {
        const blockStart = toDateAtMinute(b.start);
        const blockEnd = toDateAtMinute(b.end);
        const roundedNow = new Date(Math.ceil(now.getTime() / (5 * 60000)) * 5 * 60000);
        const start = sameDay(date, now) && blockStart < roundedNow ? roundedNow : blockStart;
        return { start, end: blockEnd, minutes: Math.max(0, Math.round((blockEnd - start) / 60000)) };
      })
      .filter(b => b.minutes >= 15);
  }

  function openPlanningTasks(date = TODAY) {
    const d = dayStart(date);
    const todayKey = dateKey(d);
    const currentWeekKey = dateKey(weekStart(d));
    const currentMonthKey = monthKey(d);
    const priorityScore = { high: 0, medium: 1, low: 2 };
    const rankTask = t => {
      const deadline = t.deadline ? localDateFromKey(t.deadline) : null;
      const overdue = deadline && dayStart(deadline) < d;
      const dueToday = deadline && dateKey(deadline) === todayKey;
      const dueSoon = deadline && dayStart(deadline) <= addDaysSafe(d, 3);
      const scope = taskScopeOf(t);
      const dayTask = taskBelongsToPeriod(t, "day", d);
      const weekTask = scope === "week" && taskWeekKey(t) === currentWeekKey;
      const monthTask = scope === "month" && taskMonthKey(t) === currentMonthKey;
      return [
        overdue ? 0 : dueToday ? 1 : dayTask ? 2 : dueSoon ? 3 : weekTask && t.priority === "high" ? 4 : weekTask ? 5 : monthTask && (t.priority === "high" || dueSoon) ? 6 : 9,
        priorityScore[t.priority] ?? 1,
        taskDurationToMinutes(t.duration || 30),
        String(t.deadline || "9999-12-31"),
        String(t.title || ""),
      ];
    };
    return tasks
      .filter(t => !t.deletedAt && !t.done && !t.scheduledEventId)
      .filter(t => {
        const deadline = t.deadline ? localDateFromKey(t.deadline) : null;
        const dueWindow = deadline && dayStart(deadline) <= addDaysSafe(d, 3);
        return taskBelongsToPeriod(t, "day", d)
          || (taskScopeOf(t) === "week" && taskWeekKey(t) === currentWeekKey)
          || (taskScopeOf(t) === "month" && taskMonthKey(t) === currentMonthKey && (t.priority === "high" || dueWindow))
          || dueWindow;
      })
      .sort((a, b) => {
        const ar = rankTask(a), br = rankTask(b);
        for (let i = 0; i < ar.length; i++) {
          if (ar[i] < br[i]) return -1;
          if (ar[i] > br[i]) return 1;
        }
        return 0;
      });
  }

  function buildDailyPlan(date = TODAY, lockedSuggestions = [], mode = null, options = {}) {
    const planDate = dayStart(date);
    const checkIn = dailyCheckInForDate(dailyCheckIns, planDate);
    const energy = checkIn?.energy || null;
    const planMode = normalizePlanningMode(mode || planningModeForEnergy(energy));
    const rules = applyPlanningModeToRules(planningRules, planMode, energy);
    const skipLowPriorityToday = Boolean(options.skipLowPriorityToday);
    const locked = (lockedSuggestions || []).map(item => ({ ...item, start: new Date(item.start), end: new Date(item.end) })).filter(item => item?.task?.id && sameDay(item.start, planDate));
    const lockedIds = new Set(locked.map(item => item.task.id));
    const lockedBlocks = locked.map(item => ({ id: `locked-${item.task.id}`, title: item.task.title, start: item.start, end: item.end, allDay: false, calendar: "work", category: item.task.category || "important", fixed: true }));
    const allPlanningTasks = openPlanningTasks(planDate).filter(t => !lockedIds.has(t.id));
    const hasManualSelection = Array.isArray(options.includedTaskIds);
    const selectedTaskIds = hasManualSelection ? options.includedTaskIds.map(String) : allPlanningTasks.map(t => String(t.id));
    const selectedTaskIdSet = new Set(selectedTaskIds);
    const planningPool = allPlanningTasks.filter(t => selectedTaskIdSet.has(String(t.id)));
    const excludedByChoice = hasManualSelection ? allPlanningTasks.filter(t => !selectedTaskIdSet.has(String(t.id))) : [];
    const skippedLowPriority = skipLowPriorityToday ? planningPool.filter(t => t.priority === "low") : [];
    const candidates = skipLowPriorityToday ? planningPool.filter(t => t.priority !== "low") : planningPool;
    let slots = freeSlotsForDate(planDate, lockedBlocks, rules);
    const lifestyleBlocks = lifestylePlanningBlocksForDate(planDate);
    const freeMinutes = slots.reduce((sum, slot) => sum + slot.minutes, 0) + locked.reduce((sum, item) => sum + Math.max(0, Math.round((item.end - item.start) / 60000)), 0);
    const suggestions = [...locked];
    const unscheduled = [];
    let plannedMinutes = locked.reduce((sum, item) => sum + Math.max(0, Math.round((item.end - item.start) / 60000)), 0);
    let deepBlocks = locked.filter(item => Core.categoryIs(item.task.category, "important") || item.task.priority === "high").length;
    for (const task of candidates) {
      const minutes = Math.max(15, taskDurationToMinutes(task.duration || 30));
      const isDeep = Core.categoryIs(task.category, "important") || task.priority === "high";
      if (plannedMinutes + minutes > rules.maxPlanMinutes) { unscheduled.push(task); continue; }
      if (isDeep && rules.maxDeepWorkBlocks > 0 && deepBlocks >= rules.maxDeepWorkBlocks) { unscheduled.push(task); continue; }
      const idx = slots.findIndex(slot => slot.minutes >= minutes);
      if (idx === -1) { unscheduled.push(task); continue; }
      const slot = slots[idx];
      const start = new Date(slot.start);
      const end = new Date(start.getTime() + minutes * 60000);
      suggestions.push({ task, start, end, minutes });
      plannedMinutes += minutes;
      if (isDeep) deepBlocks += 1;
      const nextStart = new Date(end.getTime() + Math.max(0, rules.bufferMinutes) * 60000);
      slots[idx] = { start: nextStart, end: slot.end, minutes: Math.max(0, Math.round((slot.end - nextStart) / 60000)) };
      slots = slots.filter(slot => slot.minutes >= 15);
    }
    const remainingTasks = [...unscheduled, ...skippedLowPriority];
    return {
      date: planDate,
      freeMinutes,
      openCount: allPlanningTasks.length + locked.length,
      selectedCount: planningPool.length + locked.length,
      allPlanningTasks,
      selectedTaskIds,
      excludedByChoice,
      suggestions,
      unscheduled,
      skippedLowPriority,
      remainingTasks,
      lifestyleBlocks,
      planningRules: rules,
      mode: planMode,
      energy,
      mood: checkIn?.mood || null,
      skipLowPriorityToday,
      plannedMinutes,
      generatedAt: Date.now(),
    };
  }

  function applyDayPlan(plan) {
    if (!plan?.suggestions?.length) return;
    pushUndo();
    const additions = plan.suggestions.map(({ task, start, end }) => buildTaskEvent(task, start, end, { source: "day-plan", planningMode: plan.mode || "normal" }));
    const taskToEvent = new Map(additions.map(ev => [ev.linkedTaskId, ev]));
    const nextEvents = [...events, ...additions];
    const nextTasks = tasks.map(t => taskToEvent.has(t.id) ? touchRecord(t, { scheduledEventId: taskToEvent.get(t.id).id, scheduledStart: taskToEvent.get(t.id).start.toISOString(), scheduledEnd: taskToEvent.get(t.id).end.toISOString() }) : t);
    setEventsAndTasks(nextEvents, nextTasks);
    setDayPlan(null);
    setToast({ text: `Plan added ${additions.length} task block${additions.length === 1 ? "" : "s"} ✓`, ts: Date.now() });
  }

  function regenerateDayPlan(plan, lockedSuggestions = [], mode = null, options = {}) {
    setDayPlan(buildDailyPlan(plan?.date || TODAY, lockedSuggestions, mode || plan?.mode, {
      skipLowPriorityToday: Boolean(options.skipLowPriorityToday ?? plan?.skipLowPriorityToday),
      includedTaskIds: Array.isArray(options.includedTaskIds) ? options.includedTaskIds : plan?.selectedTaskIds,
    }));
  }

  function planRemainingTasks(plan) {
    return Array.isArray(plan?.remainingTasks) && plan.remainingTasks.length ? plan.remainingTasks : (plan?.unscheduled || []);
  }

  function movePlanRemainingToTomorrow(plan) {
    const remaining = planRemainingTasks(plan);
    if (!remaining.length) return;
    const tomorrow = addDaysSafe(TODAY, 1);
    const patch = taskPeriodPatchForScope("day", tomorrow);
    const ids = new Set(remaining.map(t => t.id));
    pushUndo();
    setTasks(ts => ts.map(t => ids.has(t.id) ? touchRecord({ ...t, scope: "day", done: false, completedAt: null, completedDate: null, ...patch }) : t));
    setToast({ text: `Moved ${remaining.length} remaining task${remaining.length === 1 ? "" : "s"} to tomorrow ✓`, ts: Date.now() });
    setDayPlan(null);
  }

  function movePlanRemainingToThisWeek(plan) {
    const remaining = planRemainingTasks(plan);
    if (!remaining.length) return;
    const patch = taskPeriodPatchForScope("week", plan?.date || TODAY);
    const ids = new Set(remaining.map(t => t.id));
    pushUndo();
    setTasks(ts => ts.map(t => ids.has(t.id) ? touchRecord({ ...t, scope: "week", done: false, completedAt: null, completedDate: null, ...patch }) : t));
    setToast({ text: `Moved ${remaining.length} remaining task${remaining.length === 1 ? "" : "s"} to this week ✓`, ts: Date.now() });
    setDayPlan(null);
  }

  function skipLowPriorityInDayPlan(plan, lockedSuggestions = [], mode = null, includedTaskIds = null) {
    setDayPlan(buildDailyPlan(plan?.date || TODAY, lockedSuggestions, mode || plan?.mode, {
      skipLowPriorityToday: true,
      includedTaskIds: Array.isArray(includedTaskIds) ? includedTaskIds : plan?.selectedTaskIds,
    }));
  }

  function scheduleTaskIntoCalendar(task, mode = "today") {
    if (!task) return;
    const duration = Math.max(15, taskDurationToMinutes(task.duration || 30));
    const startSearch = dayStart(TODAY);
    const last = mode === "today" ? startSearch : mode === "deadline" && task.deadline ? (localDateFromKey(task.deadline) || startSearch) : addDaysSafe(weekStart(TODAY), 6);
    for (let d = dayStart(startSearch); d <= dayStart(last); d = addDaysSafe(d, 1)) {
      const slot = freeSlotsForDate(d).find(s => s.minutes >= duration);
      if (!slot) continue;
      const start = new Date(slot.start);
      const end = new Date(start.getTime() + duration * 60000);
      const ev = buildTaskEvent(task, start, end, { source: "task-auto-schedule" });
      pushUndo();
      setEventsAndTasks([...events, ev], tasks.map(t => t.id === task.id ? touchRecord(t, { scheduledEventId: ev.id, scheduledStart: ev.start.toISOString(), scheduledEnd: ev.end.toISOString() }) : t));
      setScheduleTaskTarget(null);
      setToast({ text: `Scheduled “${task.title}” at ${fmt(start)} ✓`, ts: Date.now() });
      return true;
    }
    setToast({ text: `No suitable slot found for “${task.title}”`, ts: Date.now() });
    return false;
  }

  function copyEventForPaste(ev) {
    if (!ev) return;
    const clean = stripOccurrenceMeta(ev);
    const sourceStart = clean.start instanceof Date ? clean.start : new Date(clean.start);
    const sourceEnd = clean.end instanceof Date ? clean.end : new Date(clean.end);
    const durationMs = Math.max(15 * 60000, sourceEnd - sourceStart);
    setCopiedEvent({
      title: clean.title || "Untitled Event",
      calendar: clean.calendar || "work",
      category: clean.category || "meeting",
      fixed: Boolean(clean.fixed),
      color: clean.color || null,
      notes: clean.notes || "",
      reminder: Core.normalizeEventReminder(clean.reminder),
      allDay: Boolean(clean.allDay),
      durationMs,
      sourceHour: sourceStart.getHours(),
      sourceMinute: sourceStart.getMinutes(),
    });
  }

  function buildPastedEvent(targetDate, { useSourceTime = false } = {}) {
    if (!copiedEvent || !targetDate) return null;
    let start;
    if (copiedEvent.allDay) {
      start = dayStart(targetDate);
    } else {
      start = cloneDate(targetDate);
      if (useSourceTime) start.setHours(copiedEvent.sourceHour ?? 9, copiedEvent.sourceMinute ?? 0, 0, 0);
    }
    const end = new Date(start.getTime() + (copiedEvent.durationMs || 60 * 60000));
    return {
      id: "e" + uid(),
      title: copiedEvent.title,
      start,
      end,
      allDay: Boolean(copiedEvent.allDay),
      calendar: copiedEvent.calendar,
      category: copiedEvent.category,
      fixed: Boolean(copiedEvent.fixed),
      color: copiedEvent.color || null,
      notes: copiedEvent.notes || "",
      reminder: Core.normalizeEventReminder(copiedEvent.reminder),
      recurrence: null,
      copiedFrom: copiedEvent.title,
    };
  }

  async function pasteCopiedEvent(targetDate, options = {}) {
    const ev = buildPastedEvent(targetDate, options);
    if (!ev) return false;
    if (!(await confirmEventPlacement(ev, ev.id, "Paste event"))) return false;
    await addEvent(ev, { skipConflictCheck: true });
    setToast({ text: `Copied event pasted to ${fmt(ev.start)} ✓`, ts: Date.now() });
    return true;
  }

  async function handleCalendarSlotClick(date, options = {}) {
    if (copiedEvent) {
      await pasteCopiedEvent(date, options);
      return;
    }
    setQuickAddDate(date);
  }

  async function reschedule(id, ns, ne) {
    const baseId = getBaseEventId(id);
    const base = events.find(e => e.id === baseId);
    if (!base) return;
    if (!(await confirmEventPlacement({ ...base, id: baseId, start: ns, end: ne }, baseId, "Move event"))) return;
    const occurrenceDate = String(id).includes("_r_") ? id.split("_r_")[1] : dateKey(base.start);
    const needsScope = isRecurringEvent(base);
    const scope = needsScope ? await chooseRecurrenceScope("Move") : "all";
    pushUndo();
    setEvents(es => {
      const currentBase = es.find(e => e.id === baseId);
      if (!currentBase) return es;
      if (!needsScope || scope === "all") return es.map(e => e.id === baseId ? touchRecord(e, { start: ns, end: ne }) : e);
      if (scope === "following") {
        const [original, following] = createFollowingSeries(currentBase, new Date(occurrenceDate), touchRecord(currentBase, { start: ns, end: ne }));
        return [...es.filter(e => e.id !== baseId), touchRecord(original), touchRecord(following, { createdAt: following.createdAt || new Date().toISOString() })];
      }
      return es.map(e => e.id === baseId ? touchRecord(modifySingleOccurrence(e, new Date(occurrenceDate), { ...currentBase, start: ns, end: ne })) : e);
    });
  }
  async function saveEvent(ev) {
    const baseId = getBaseEventId(ev.id);
    const base = events.find(e => e.id === baseId);
    if (!base) return false;
    if (!(await confirmEventPlacement({ ...stripOccurrenceMeta(ev), id: baseId }, baseId, "Edit event"))) return false;
    const needsScope = isOccurrence(ev) || isRecurringEvent(base);
    const scope = needsScope ? await chooseRecurrenceScope("Edit") : "all";
    const occurrenceDate = ev._occurrenceDate || String(ev.id).split("_r_")[1] || dateKey(ev.start);
    pushUndo();
    setEvents(es => {
      const currentBase = es.find(e => e.id === baseId);
      if (!currentBase) return es;
      if (!needsScope || scope === "all") return es.map(e => e.id === baseId ? touchRecord({ ...stripOccurrenceMeta(ev), id: baseId }) : e);
      if (scope === "following") {
        const [original, following] = createFollowingSeries(currentBase, new Date(occurrenceDate), touchRecord(ev));
        return [...es.filter(e => e.id !== baseId), touchRecord(original), touchRecord(following, { createdAt: following.createdAt || new Date().toISOString() })];
      }
      return es.map(e => e.id === baseId ? touchRecord(modifySingleOccurrence(e, new Date(occurrenceDate), touchRecord(ev))) : e);
    });
    return true;
  }

  function persistDeletedRecords(kind, ids, timestamp = new Date().toISOString()) {
    const nextDeletedRecords = addDeletedRecords(deletedRecords, kind, ids, timestamp);
    const nextSettingsUpdatedAt = { ...normalizeSettingsUpdatedAt(settingsUpdatedAt), deletedRecords: timestamp };
    setDeletedRecordsRaw(nextDeletedRecords);
    setSettingsUpdatedAtRaw(nextSettingsUpdatedAt);
    save(`${uk}_deleted_records`, nextDeletedRecords);
    save(`${uk}_settings_updated_at`, nextSettingsUpdatedAt);
    return { deletedRecords: nextDeletedRecords, settingsUpdatedAt: nextSettingsUpdatedAt };
  }

  function clearTaskScheduleForEvent(nextTasks, removedEvent) {
    const linkedTaskId = removedEvent?.linkedTaskId;
    const removedId = removedEvent?.id;
    if (!linkedTaskId && !removedId) return nextTasks;
    return nextTasks.map(t => {
      if ((linkedTaskId && t.id === linkedTaskId) || (removedId && t.scheduledEventId === removedId)) {
        const { scheduledEventId, scheduledStart, scheduledEnd, ...rest } = t;
        return touchRecord(rest);
      }
      return t;
    });
  }
  async function deleteEvent(id) {
    const baseId = getBaseEventId(id);
    const base = events.find(e => e.id === baseId);
    if (!base) return;
    const occurrenceDate = String(id).includes("_r_") ? id.split("_r_")[1] : dateKey(base.start);
    const needsScope = isRecurringEvent(base);
    const scope = needsScope ? await chooseRecurrenceScope("Delete") : "all";
    pushUndo();
    const timestamp = new Date().toISOString();
    if (!needsScope || scope === "all") {
      const settingsPatch = persistDeletedRecords("events", baseId, timestamp);
      const nextEvents = events.filter(e => e.id !== baseId);
      const nextTasks = clearTaskScheduleForEvent(tasks, base);
      setEventsAndTasks(nextEvents, nextTasks, settingsPatch);
      return;
    }
    if (scope === "following") {
      setEvents(es => {
        const currentBase = es.find(e => e.id === baseId);
        if (!currentBase) return es;
        const rec = normalizeRecurrence(currentBase.recurrence);
        const until = addDaysSafe(dayStart(new Date(occurrenceDate)), -1);
        return es.map(e => e.id === baseId ? touchRecord(e, { recurrence: { ...rec, until: dateKey(until), endMode: "on" } }) : e);
      });
      return;
    }
    setEvents(es => {
      const currentBase = es.find(e => e.id === baseId);
      if (!currentBase) return es;
      return es.map(e => e.id === baseId ? touchRecord(deleteSingleOccurrence(e, new Date(occurrenceDate))) : e);
    });
  }
  function saveTask(task) {
    pushUndo();
    setTasks(ts => {
      const previous = ts.find(t => t.id === task.id);
      let updated = ts.map(t => t.id === task.id ? touchRecord(task) : t);
      const becameDone = Boolean(task.done) && !Boolean(previous?.done);
      if (becameDone) {
        const nextRecurring = createNextRecurringTask(task, updated);
        if (nextRecurring) updated = [...updated, touchRecord(nextRecurring, { createdAt: new Date().toISOString() })];
      }
      return updated;
    });
  }
  function taskAnchorComparable(task) {
    const d = taskAnchorDate(task, TODAY);
    return dayStart(d).getTime();
  }

  async function recurringTaskActionChoice(task) {
    if (!task?.recurrence && !task?.parentTaskId) return "series";
    return chooseRecurringTaskAction(task);
  }

  async function deleteTask(id) {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const isRecurringTask = Boolean(target.recurrence || target.parentTaskId);
    const choice = isRecurringTask ? await recurringTaskActionChoice(target) : "series";
    if (!choice) return;

    if (choice === "reschedule") {
      const rawDate = await chooseTaskRescheduleDate(target);
      const nextDate = localDateFromKey(rawDate);
      if (!nextDate) return;
      pushUndo();
      setTasks(ts => {
        if (target.parentTaskId) {
          const identity = taskPeriodIdentity(target);
          const parent = ts.find(t => t.id === target.parentTaskId);
          const moved = touchRecord(withTaskPeriod({ ...target, id: "t" + uid(), parentTaskId: target.parentTaskId, generatedFromRecurrence: true }, nextDate), { createdAt: new Date().toISOString() });
          return ts
            .map(t => t.id === target.parentTaskId ? touchRecord(t, { skippedTaskPeriods: [...new Set([...(t.skippedTaskPeriods || []), identity])] }) : t)
            .filter(t => t.id !== id)
            .concat(parent ? [moved] : []);
        }
        const periodPatch = taskPeriodPatchForScope(taskScopeOf(target), nextDate);
        return ts.map(t => t.id === id ? touchRecord({ ...t, ...periodPatch }) : t);
      });
      setSelectedTask(null);
      return;
    }

    pushUndo();
    const timestamp = new Date().toISOString();
    const seriesRootId = target.parentTaskId || target.id;
    const targetTime = taskAnchorComparable(target);
    const identity = taskPeriodIdentity(target);

    let idsToDelete = [id];
    let nextTasks = tasks;

    if (isRecurringTask && (choice === "single" || choice === "skip")) {
      nextTasks = tasks.map(t => t.id === seriesRootId ? touchRecord(t, { skippedTaskPeriods: [...new Set([...(t.skippedTaskPeriods || []), identity])] }) : t);
      if (target.parentTaskId) nextTasks = nextTasks.filter(t => t.id !== id);
      idsToDelete = target.parentTaskId ? [id] : [];
    } else if (isRecurringTask && choice === "future") {
      const root = tasks.find(t => t.id === seriesRootId) || target;
      const until = dateKey(addDaysSafe(taskAnchorDate(target, TODAY), -1));
      nextTasks = tasks
        .map(t => t.id === seriesRootId ? touchRecord(t, { recurrence: { ...(normalizeRecurrence(t.recurrence) || {}), until, endMode: "on" } }) : t)
        .filter(t => !(taskSeriesId(t) === seriesRootId && t.id !== seriesRootId && taskAnchorComparable(t) >= targetTime));
      idsToDelete = tasks.filter(t => taskSeriesId(t) === seriesRootId && t.id !== seriesRootId && taskAnchorComparable(t) >= targetTime).map(t => t.id);
      if (root.id !== target.id && target.parentTaskId) idsToDelete.push(target.id);
    } else {
      idsToDelete = isRecurringTask ? tasks.filter(t => t.id === seriesRootId || t.parentTaskId === seriesRootId).map(t => t.id) : [id];
      nextTasks = tasks.filter(t => !idsToDelete.includes(t.id));
    }

    let settingsPatch = idsToDelete.length ? persistDeletedRecords("tasks", idsToDelete, timestamp) : { deletedRecords, settingsUpdatedAt };
    const linkedEventIds = new Set(events.filter(e => idsToDelete.includes(e.linkedTaskId) || (choice === "single" && e.linkedTaskId === id)).map(e => e.id));
    if (linkedEventIds.size) {
      const deletedWithEvents = addDeletedRecords(settingsPatch.deletedRecords, "events", [...linkedEventIds], timestamp);
      settingsPatch = { ...settingsPatch, deletedRecords: deletedWithEvents };
      setDeletedRecordsRaw(deletedWithEvents);
      save(`${uk}_deleted_records`, deletedWithEvents);
    }
    const nextEvents = linkedEventIds.size ? events.filter(e => !linkedEventIds.has(e.id)) : events;
    setEventsAndTasks(nextEvents, nextTasks, settingsPatch);
    setSelectedTask(null);
  }



  function applyTemplate(tpl) {
    pushUndo();
    const base = new Date(viewDate);
    const newEvs = tpl.events.map((te, i) => {
      const st = new Date(base); st.setHours(te.start[0], te.start[1], 0, 0);
      const en = new Date(base); en.setHours(te.end[0],   te.end[1],   0, 0);
      return { id: "e" + uid() + i, title: te.title, start: st, end: en, allDay: Boolean(te.allDay), calendar: te.calendar || (Core.isPersonalCategory(te.category) ? "personal" : "work"), category: Core.normalizeCategoryId(te.category || "meeting", "meeting"), fixed: te.fixed, color: te.color || null, notes: te.notes || "", recurrence: null };
    });
    setEvents(es => [...es.filter(e => !eventOccursOnDay(e, base) || e.fixed), ...newEvs]);
    setShowTemplates(false);
  }
  function saveCurrentDayAsTemplate() {
    const base = new Date(viewDate);
    const dayEvents = visibleEvents.filter(e => eventOccursOnDay(e, base));
    if (!dayEvents.length) return;
    const tpl = {
      id: "tpl" + uid(),
      label: `✨ ${formatWithDisplayTimezone(base, { weekday: "short", month: "short", day: "numeric" })}`,
      events: dayEvents.map(e => ({
        title: e.title,
        start: [e.start.getHours(), e.start.getMinutes()],
        end: [e.end.getHours(), e.end.getMinutes()],
        calendar: e.calendar,
        category: e.category,
        fixed: e.fixed,
        color: e.color || null,
        notes: e.notes || "",
        allDay: Boolean(e.allDay),
      })),
    };
    setTemplates(t => [...t, tpl]);
  }
  function updateTemplate(id, patch) { setTemplates(tpls => tpls.map(t => t.id === id ? { ...t, ...patch } : t)); }
  function deleteTemplate(id) { if (!window.confirm("Delete this day template?")) return; setTemplates(tpls => tpls.filter(t => t.id !== id)); }

  function moveRolloverTasks(ids, scope, anchorDate, label) {
    const patch = taskPeriodPatchForScope(scope, anchorDate);
    pushUndo();
    setTasks(ts => ts.map(t => ids.includes(t.id)
      ? touchRecord({ ...t, scope, done: false, completedAt: null, completedDate: null, ...patch })
      : t));
    setShowCarryOver(false);
    setToast({ text: `Moved ${ids.length} task${ids.length === 1 ? "" : "s"} to ${label} ✓`, ts: Date.now() });
  }
  function handleCarryOver(ids) { moveRolloverTasks(ids, "day", addDaysSafe(TODAY, 1), "tomorrow"); }
  function handleCarryToday(ids) { moveRolloverTasks(ids, "day", TODAY, "today"); }
  function handleCarryWeek(ids) { moveRolloverTasks(ids, "week", TODAY, "this week"); }
  function handleDrop(ids)      { pushUndo(); setTasks(ts => ts.filter(t => !ids.includes(t.id))); setShowCarryOver(false); setToast({ text: `Dropped ${ids.length} task${ids.length === 1 ? "" : "s"} ✓`, ts: Date.now() }); }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (typeof window !== "undefined" && window.innerWidth <= 768) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if (e.key === "Escape") {
        if (showSearch) { setShowSearch(false); return; }
        if (page !== "calendar") { setPage("today"); return; }
        setSelectedEvent(null); setShowStats(false); setShowShortcuts(false); setSettingsOpen(false); setShowTemplates(false); return;
      }
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) { e.preventDefault(); setShowSearch(v => !v); return; }
      if (e.key === "?") { setShowShortcuts(v => !v); return; }
      const k = e.key.toLowerCase();
      if (k === "d" && !e.metaKey && !e.ctrlKey) { setPage("calendar"); setView("day"); }
      else if (k === "w" && !e.metaKey) { setPage("calendar"); setView("week"); }
      else if (k === "m" && !e.metaKey) { setPage("calendar"); setView("month"); }
      else if (k === "j") setPage(p => p === "journal" ? "calendar" : "journal");
      else if (k === "c") { setPage("calendar"); setQuickAddDate(new Date(viewDate)); }
      else if (k === "t") setSelectedTask({ _isNew: true, id: "t" + uid(), title: "", duration: 30, category: "important", scope: taskScope, deadline: "", priority: "medium", notes: "", recurrence: null, reminder: { type: "none", time: "" }, done: false });
      else if (k === "a") setChatOpen(v => !v);
      else if (k === "s") setSettingsOpen(v => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // Include events, tasks, and undo so the undo handler always operates on current state
  }, [view, page, chatOpen, settingsOpen, showShortcuts, showSearch, undoStack, events, tasks, taskScope, viewDate]);

  // Show boot spinner while checking existing session
  if (auth.loading && !auth.user) return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page tempo-loading-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card tempo-loading-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:20}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
    </>
  );

  // Show login screen if not authenticated
  if (!auth.user) return (
    <>
      <style>{loginCSS}</style>
      <LoginScreen auth={auth} />
    </>
  );

  // Show spinner while pulling this exact user's data from cloud/local storage.
  // The loadedUserId guard prevents cross-account data from appearing during user switching.
  if (!dataReady || loadedUserId !== auth.user.id) return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page tempo-loading-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card tempo-loading-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:16}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><p style={{color:"#A07090",fontSize:13,fontWeight:600,marginBottom:20}}>Loading your schedule…</p><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
    </>
  );

  const rangeStart = view === "month" ? new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) : view === "week" ? weekStart(viewDate) : viewDate;
  const rangeEnd = view === "month" ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0) : view === "week" ? addDaysSafe(weekStart(viewDate), 6) : viewDate;
  const expandedEvents  = expandRecurring(events, rangeStart, rangeEnd);
  const viewDayEvents   = expandedEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, viewDate) && !hiddenCals.includes(e.calendar)).map(e => eventSegmentForDay(e, viewDate));
  const visibleEvents   = expandedEvents.filter(e => !hiddenCals.includes(e.calendar));
  // Gamification must be calculated from a stable event window, not the current
  // calendar view. Otherwise XP/levels can change when switching Day/Week/Month
  // because recurring events are expanded differently per view. Hidden
  // calendar filters should also not affect earned XP.
  const gameEvents      = expandRecurring(events, addDaysSafe(TODAY, -120), addDaysSafe(TODAY, 30));
  const gameStats      = calculateGameStats(tasks, journal, gameEvents);
  const openToday     = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY)).length;
  const fontScale     = FONT_SIZES.find(f => f.id === fontSize)?.scale ?? 1;
  const activeTheme   = THEMES.find(t => t.id === theme) ?? THEMES[0];
  const cvars         = (darkMode ? activeTheme.dark : activeTheme.light) + activeTheme.accent;
  const dayFreeMinutes = freeSlotsForDate(TODAY).reduce((sum, slot) => sum + slot.minutes, 0);
  const todayDashboardEvents = expandRecurring(events, dayStart(TODAY), addDaysSafe(dayStart(TODAY), 1))
    .filter(e => !hiddenCals.includes(e.calendar) && eventOccursOnDay(e, TODAY));
  const firstScheduledEvent = todayDashboardEvents
    .filter(e => e.start instanceof Date)
    .sort((a, b) => a.start - b.start)[0];
  const dailyStartupSummary = {
    events: getEventsOnDay(todayDashboardEvents, TODAY).length,
    tasks: tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY)).length,
    freeHours: Math.round(dayFreeMinutes / 60 * 10) / 10,
    mainThings: tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY) && Core.categoryIs(t.category, "main")).length,
    firstEvent: firstScheduledEvent ? `${fmt(firstScheduledEvent.start)} — ${firstScheduledEvent.title}` : null,
  };
  const syncSettingsSnapshot = currentSettings();
  const syncDebug = {
    dataReady,
    pendingLocalChanges,
    lastSyncedAt,
    deletedRecords: normalizeDeletedRecords(syncSettingsSnapshot.deletedRecords),
    syncConflictLog: normalizeSyncConflictLog(syncSettingsSnapshot.syncConflictLog),
    datasetCounts: syncDatasetCounts(events, tasks, syncSettingsSnapshot),
  };
  const memoAppCSS    = appCSS(cvars, fontScale);

  return (
    <>
      <style>{memoAppCSS + `
  .editable-chip{position:relative;display:inline-flex;align-items:center;gap:3px;}
  .editable-chip-main{border:0;background:transparent;color:inherit;font:inherit;font-weight:800;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:5px;}
  .chip-mini-action{width:18px;height:18px;border-radius:999px;border:1px solid var(--border);background:var(--bg2);color:var(--text3);font-size:10px;font-weight:900;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;opacity:.65;transition:all .15s;}
  .editable-chip:hover .chip-mini-action{opacity:1;}
  .chip-mini-action:hover{background:var(--accent);border-color:var(--accent);color:white;}
  .editable-memory-row{gap:7px;}
  .task-board-nav{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 14px;}
  .task-period-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;}
  .task-period-card{min-height:420px;background:var(--bg2);border:1.5px solid var(--border);border-radius:22px;box-shadow:var(--shadow-sm);padding:14px;transition:all .18s;}
  .task-period-card.drag-over{border-color:var(--accent);background:var(--bg4);box-shadow:0 12px 32px rgba(255,123,172,.16);transform:translateY(-2px);}
  .task-period-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;}
  .task-period-card-title{border:0;background:transparent;color:var(--text);font-family:var(--font);font-size:15px;font-weight:900;cursor:pointer;padding:0;}
  .task-period-count{font-family:var(--mono);font-size:10px;font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:3px 8px;white-space:nowrap;}
  .task-period-card-sub{font-size:11px;color:var(--text2);font-weight:800;margin-bottom:10px;}
  .task-card-add{width:100%;border:1.5px dashed var(--border);background:var(--bg3);color:var(--accent);border-radius:14px;padding:9px 10px;font-family:var(--font);font-weight:900;cursor:pointer;margin-bottom:10px;}
  .task-card-add:hover{border-color:var(--accent);background:var(--bg4);}
  .task-card-form{margin:0 0 10px;padding:10px;border-radius:16px;}
  .task-period-list{display:flex;flex-direction:column;gap:6px;}
  .task-card-empty{border:1.5px dashed var(--border);border-radius:16px;padding:18px 12px;text-align:center;color:var(--text3);font-size:12px;font-weight:800;background:var(--bg3);}
  .sync-pill{border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:5px;cursor:default;white-space:nowrap;}
  .sync-pill.sync-saving{color:#B07800;background:#FFF4D8;}.sync-pill.sync-saved{color:#2E8B57;background:#EAF7EF;}.sync-pill.sync-failed{color:#D44848;background:#FFF0F0;cursor:pointer;}.sync-pill.sync-offline{color:#A07090;background:var(--bg4);}
  .mobile-menu-sync-btn{display:none;margin-top:8px;width:100%;border:1.5px solid var(--border);background:var(--bg2);color:var(--accent);border-radius:12px;padding:8px 10px;font-family:var(--font);font-size:12px;font-weight:900;cursor:pointer;align-items:center;justify-content:center;gap:6px;}
  .mobile-menu-sync-btn:active{transform:scale(.98);}
  .tempo-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:#4A2840;color:white;border-radius:999px;padding:9px 16px;font-size:12px;font-weight:900;z-index:120;box-shadow:0 12px 32px rgba(0,0,0,.18);animation:toastFade 2.4s ease forwards;}@keyframes toastFade{0%{opacity:0;transform:translate(-50%,8px)}15%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,8px)}}
  .hold-cue{position:absolute;right:8px;bottom:5px;font-size:9px;font-weight:900;color:var(--text3);opacity:.0;background:var(--bg2);border:1px solid var(--border);border-radius:999px;padding:2px 6px;transition:opacity .15s;}.event-block:hover .hold-cue,.event-block.hold-holding .hold-cue,.event-block.hold-dragging .hold-cue{opacity:.92}.event-block.hold-holding{box-shadow:0 0 0 2px var(--accent3),var(--shadow-sm)}.event-block.hold-dragging{opacity:.75;}
  .memory-upload-status{font-size:11px;font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:8px 10px;margin-top:8px;}
  .memory-settings-modal{max-width:820px;width:min(92vw,820px);}.memory-settings-modal .entry-modal-body{max-height:72vh;overflow:auto;}
  .task-card-with-move{border-radius:14px;}.task-card-with-move .task-item{margin-bottom:4px;}.mini-move-btn{border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900;margin:2px 3px 6px 0;cursor:pointer;}.mini-move-btn:hover{background:var(--bg4);color:var(--accent);}
  .xp-breakdown-list{display:flex;flex-direction:column;gap:7px}.xp-breakdown-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--text2);font-weight:800}.xp-breakdown-row strong{color:var(--accent);font-family:var(--mono)}.bloom-collapse{background:var(--bg2);border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow-sm)}.bloom-collapse-head{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;background:var(--bg3);color:var(--text);font-family:var(--font);font-weight:900;padding:12px 14px;cursor:pointer}.bloom-collapse-body{padding:12px;display:flex;flex-direction:column;gap:12px}.bloom-collapse-body>.game-card{box-shadow:none;}
  @media(max-width:768px){.sync-pill{font-size:10px;padding:4px 7px}.topbar .sync-pill{display:none}.mobile-menu-sync-btn{display:flex}.desktop-sync-nav-item{display:none!important}}
  @media(max-width:900px){.task-period-board{grid-template-columns:1fr;}.task-period-card{min-height:260px;}.task-board-nav{position:sticky;top:0;background:var(--bg);z-index:5;padding:8px 0;}}
  .settings-action-row{display:flex;gap:8px;flex-wrap:wrap}.planning-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.planning-rule-grid label{font-size:12px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px;justify-content:space-between}.meal-break-list{display:flex;flex-direction:column;gap:8px}.meal-break-row{display:grid;grid-template-columns:minmax(92px,1fr) 96px auto 96px;align-items:center;gap:8px}.meal-break-row.disabled{opacity:.55}.meal-break-enabled{font-size:12px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px}.meal-time{min-width:0}.meal-dash{font-size:12px;color:var(--text2);font-weight:900}.plan-break-note{font-size:11px;color:var(--text2);font-weight:900;background:var(--bg3);border:1px dashed var(--border);border-radius:12px;padding:8px 10px}.sync-now-btn{font-weight:900}
  @media(max-width:560px){.meal-break-row{grid-template-columns:1fr 1fr auto 1fr}.meal-break-enabled{grid-column:1/-1}.planning-rule-grid{grid-template-columns:1fr}}
  .ritual-modal{max-width:720px;width:min(94vw,720px);}.ritual-modal .modal-body{max-height:72vh;overflow:auto;}.ritual-form-title-row{display:grid;grid-template-columns:74px 1fr;gap:10px;}.ritual-emoji-input{text-align:center;font-size:28px;padding:8px!important;}.modal-row-full{align-items:start!important}.ritual-weekday-picker{justify-content:flex-start;}.ritual-steps-editor{background:var(--bg3);border:1px solid var(--border);border-radius:18px;padding:12px;}.ritual-step-edit-row{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;margin-top:8px;}.ritual-step-edit-row>span{height:28px;width:28px;border-radius:999px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--text3)}.ritual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ritual-card{background:linear-gradient(180deg,var(--bg2),var(--bg3));border:1px solid var(--border);border-left:5px solid var(--ritual-color);border-radius:22px;padding:14px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px}.ritual-complete{border-left-color:#70C8A0}.ritual-skipped{opacity:.68}.ritual-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ritual-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}.ritual-emoji{width:42px;height:42px;border-radius:16px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}.ritual-title-wrap h3{font-size:16px;margin:0 0 2px;color:var(--text);line-height:1.1}.ritual-title-wrap p{font-size:11px;color:var(--text2);font-weight:900;margin:0}.ritual-edit-btn{padding:5px 9px!important;margin:0!important}.ritual-progress-track{height:7px;border-radius:999px;background:var(--border);overflow:hidden}.ritual-progress-track i{display:block;height:100%;border-radius:999px;background:var(--ritual-color);transition:width .2s ease}.ritual-progress-label{font-size:11px;font-weight:900;color:var(--text2)}.ritual-step-list{display:flex;flex-direction:column;gap:6px}.ritual-step{display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:8px 10px;font-size:12px;font-weight:850;color:var(--text);cursor:pointer}.ritual-step input{accent-color:var(--accent)}.ritual-step.checked span{text-decoration:line-through;color:var(--text3)}.ritual-more{font-size:11px;font-weight:900;color:var(--text3);padding-left:4px}.ritual-card-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}.ritual-list-compact{display:flex;flex-direction:column;gap:8px}.ritual-list-row{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:10px;background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:10px}.ritual-list-emoji{width:42px;height:42px;border-radius:14px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:23px}.ritual-list-row strong{display:block;font-size:13px;color:var(--text)}.ritual-list-row small{display:block;font-size:11px;color:var(--text2);font-weight:850;margin-top:2px}.today-ritual-stack{display:flex;flex-direction:column;gap:10px}.today-ritual-stack .ritual-card{box-shadow:none;border-radius:18px;padding:12px}.today-ritual-stack .ritual-title-wrap h3{font-size:14px}.today-ritual-stack .ritual-emoji{width:34px;height:34px;border-radius:12px;font-size:20px}.today-ritual-stack .ritual-step{padding:7px 8px;font-size:11px}.ritual-section-card{width:min(100%,1080px)}.ritual-template-section{background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(255,247,251,.94))}.ritual-template-head{align-items:flex-start;gap:12px}.ritual-template-head>div:first-child{display:flex;flex-direction:column;gap:3px}.ritual-template-head small{font-size:11px;color:var(--text2);font-weight:850}.ritual-template-filters{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.mini-pill{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;cursor:pointer}.mini-pill.active{background:rgba(255,123,172,.12);border-color:rgba(255,123,172,.45);color:var(--accent)}.ritual-template-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ritual-template-card{background:var(--bg2);border:1px solid var(--border);border-top:4px solid var(--ritual-color);border-radius:20px;padding:14px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px;min-height:260px}.ritual-template-card.template-added{background:linear-gradient(180deg,var(--bg2),rgba(112,200,160,.08))}.ritual-template-top{display:flex;align-items:center;gap:10px}.ritual-template-emoji{width:42px;height:42px;border-radius:16px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}.ritual-template-top h3{font-size:15px;margin:0 0 2px;color:var(--text);line-height:1.12}.ritual-template-top p{font-size:11px;color:var(--text2);font-weight:900;margin:0}.ritual-template-desc{font-size:12px;line-height:1.45;color:var(--text2);font-weight:750}.ritual-template-steps{display:flex;flex-direction:column;gap:5px;background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:9px;margin-top:auto}.ritual-template-steps span{font-size:11px;color:var(--text2);font-weight:850}.template-added-badge{align-self:flex-start;background:rgba(112,200,160,.14);border:1px solid rgba(112,200,160,.35);color:#2f8b62;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:950}.ritual-template-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}@media(max-width:1040px){.ritual-template-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:900px){.ritual-grid,.ritual-template-grid{grid-template-columns:1fr}.ritual-template-head{flex-direction:column}.ritual-template-filters{justify-content:flex-start}}@media(max-width:560px){.ritual-form-title-row{grid-template-columns:58px 1fr}.ritual-list-row{grid-template-columns:38px 1fr}.ritual-list-row button{grid-column:2}.ritual-card-top{flex-direction:column}.ritual-modal .modal-actions{flex-wrap:wrap}.ritual-steps-editor .phase-card-head{align-items:flex-start;flex-direction:column}}
  .habit-modal{max-width:640px;width:min(94vw,640px);}.habit-target-row{display:grid;grid-template-columns:96px 1fr;gap:8px;width:100%;}.habit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.habit-card{background:linear-gradient(180deg,var(--bg2),var(--bg3));border:1px solid var(--border);border-radius:22px;padding:14px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px}.habit-complete{border-color:rgba(112,200,160,.45);background:linear-gradient(180deg,var(--bg2),rgba(112,200,160,.08))}.habit-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.habit-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}.habit-emoji{width:42px;height:42px;border-radius:16px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}.habit-title-wrap h3{font-size:16px;margin:0 0 2px;color:var(--text);line-height:1.1}.habit-title-wrap p{font-size:11px;color:var(--text2);font-weight:900;margin:0}.habit-card-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.habit-check{width:100%;justify-content:flex-start}.today-habit-stack{display:flex;flex-direction:column;gap:10px}.today-habit-stack .habit-card{box-shadow:none;border-radius:18px;padding:12px}.today-habit-stack .habit-title-wrap h3{font-size:14px}.today-habit-stack .habit-emoji{width:34px;height:34px;border-radius:12px;font-size:20px}.habit-week-grid-wrap{display:flex;flex-direction:column;gap:6px;overflow:auto}.habit-week-grid{display:grid;grid-template-columns:minmax(180px,1fr) repeat(7,48px);gap:6px;align-items:center;min-width:560px}.habit-week-grid>*{background:var(--bg3);border:1px solid var(--border);border-radius:12px;min-height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--text2);padding:6px}.habit-week-grid strong{justify-content:flex-start;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.habit-week-grid-head>*{background:transparent;border:0;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;font-size:10px}.habit-week-grid span.done{background:rgba(112,200,160,.14);border-color:rgba(112,200,160,.35);color:#2f8b62}.habit-week-grid span.muted{opacity:.45}@media(max-width:900px){.habit-grid{grid-template-columns:1fr}.habit-target-row{grid-template-columns:82px 1fr}}@media(max-width:560px){.habit-card-top{flex-direction:column}.habit-week-grid{grid-template-columns:minmax(150px,1fr) repeat(7,42px);min-width:500px}.habit-modal .modal-actions{flex-wrap:wrap}}
  .phase-page{height:100%;overflow:auto;padding:22px;display:flex;flex-direction:column;gap:16px;background:var(--bg);}.phase-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,var(--bg2),var(--bg4));border:1px solid var(--border);border-radius:28px;padding:22px;box-shadow:var(--shadow-sm);}.phase-kicker{font-size:11px;font-weight:900;color:var(--accent);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:4px;}.phase-hero h1{font-size:30px;line-height:1.05;margin:0 0 6px;color:var(--text);}.phase-hero p,.phase-copy{margin:0;color:var(--text2);font-size:13px;font-weight:800;line-height:1.55;}.phase-primary{white-space:nowrap;}.phase-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}.phase-summary-grid button{background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:14px 12px;text-align:left;cursor:pointer;box-shadow:var(--shadow-sm);font-family:var(--font);}.phase-summary-grid strong{display:block;color:var(--accent);font-size:24px;line-height:1;font-weight:900;}.phase-summary-grid span{font-size:11px;font-weight:900;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;}.phase-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}.phase-card{background:var(--bg2);border:1px solid var(--border);border-radius:22px;padding:16px;box-shadow:var(--shadow-sm);}.phase-wide-card{max-width:900px;}.phase-page>.phase-wide-card{width:100%;max-width:none;}.phase-page .ritual-section-card{width:100%;max-width:none;}.phase-page .ritual-grid,.phase-page .habit-grid{grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}.phase-page .ritual-template-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}.habits-page .phase-card,.rituals-page .phase-card{width:100%;}.habit-week-grid-wrap{width:100%;}.habit-week-grid{grid-template-columns:minmax(260px,1fr) repeat(7,minmax(54px,72px));}.phase-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;}.phase-card-head span{font-size:15px;font-weight:900;color:var(--text);}.phase-card-head button{border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:5px 9px;font-family:var(--font);font-weight:900;font-size:11px;cursor:pointer;}.phase-card-head small{font-size:10px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;}.phase-list-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding:9px 0;font-size:13px;font-weight:850;color:var(--text);}.phase-list-row:first-child{border-top:0;}.phase-list-row small{color:var(--text3);font-weight:900;white-space:nowrap;}.phase-empty{font-size:13px;font-weight:800;color:var(--text2);line-height:1.5;background:var(--bg3);border:1px dashed var(--border);border-radius:16px;padding:14px;}.phase-placeholder-card{opacity:.92;}.phase-bullet-list{display:flex;flex-direction:column;}.coming-soon-page .phase-wide-card{width:min(720px,100%);}@media(max-width:768px){.phase-page{padding:14px 12px 90px;}.phase-hero{align-items:flex-start;flex-direction:column;border-radius:22px;padding:18px;}.phase-hero h1{font-size:24px;}.phase-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.phase-grid-two{grid-template-columns:1fr;}.phase-card{border-radius:18px;padding:14px;}}.reminder-editor{display:flex;flex-direction:column;gap:8px}.reminder-custom-row{margin:0!important;grid-template-columns:auto 1fr!important}.task-progress-mini{display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--text2);font-weight:900;margin:6px 0}.task-progress-track{height:6px;border-radius:999px;background:var(--border);overflow:hidden}.task-progress-track i{display:block;height:100%;border-radius:999px;background:var(--accent)}.task-progress-mini strong{color:var(--accent)}.plan-day-btn{background:linear-gradient(135deg,var(--accent),#B08AE0)!important;color:#fff!important;border-color:transparent!important}.plan-summary{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:12px;font-weight:800;color:var(--text2)}.plan-summary strong{color:var(--accent)}.plan-list{display:flex;flex-direction:column;gap:8px}.plan-row{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:14px;font-weight:800}.plan-row strong{color:var(--accent);white-space:nowrap}.plan-warning{font-size:12px;color:#C07820;font-weight:900;background:#FFF6E6;border:1px solid #FFE2A8;border-radius:14px;padding:10px}.day-plan-modal .modal-body{gap:12px}

  .today-page-v2{gap:18px;}.today-dashboard-hero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr);gap:14px;align-items:stretch;}.today-hero-stack{display:flex;flex-direction:column;gap:12px;min-width:0;}.today-hero-stack .affirmation-daily-card.compact{padding:16px;border-radius:24px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-quote-row blockquote{font-size:15px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-quote-icon{width:42px;height:42px;border-radius:15px;font-size:22px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-card-actions{margin-top:10px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-card-actions .tf-cancel{display:none;}.today-dashboard-hero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr);gap:14px;align-items:stretch;}.today-hero-copy{background:linear-gradient(135deg,var(--bg2),var(--bg4));border:1px solid var(--border);border-radius:28px;padding:24px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;justify-content:center;}.today-hero-copy h1{font-size:34px;line-height:1.03;margin:0 0 6px;color:var(--text);}.today-hero-copy p{font-size:14px;color:var(--text2);font-weight:900;line-height:1.5;margin:0}.today-hero-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}.today-checkin-card{background:var(--bg2);border:1px solid var(--border);border-radius:28px;padding:18px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px;}.today-checkin-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.8px}.today-checkin-top button,.today-row-action{border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:5px 9px;font-family:var(--font);font-weight:900;font-size:11px;cursor:pointer}.today-mood-display{display:flex;align-items:center;gap:10px;background:var(--bg4);border:1px solid var(--border);border-radius:18px;padding:12px}.today-mood-display span{font-size:28px}.today-mood-display strong{font-size:16px;color:var(--text)}.today-energy-row{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px dashed var(--border);background:var(--bg3);border-radius:14px;padding:9px 11px;font-size:12px;font-weight:900;color:var(--text2)}.today-energy-row strong{color:var(--accent)}.today-checkin-card p{font-size:12px;font-weight:800;line-height:1.45;color:var(--text2);margin:0}.today-rhythm-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.today-rhythm-strip button{background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:14px 12px;text-align:left;box-shadow:var(--shadow-sm);cursor:pointer;font-family:var(--font);display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center}.today-rhythm-strip button>span{font-size:20px;grid-row:1/3}.today-rhythm-strip strong{font-size:23px;line-height:1;color:var(--accent);font-weight:900}.today-rhythm-strip small{font-size:10px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.6px}.today-dashboard-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:14px;align-items:start}.today-main-card,.today-side-card,.today-wide-card{min-width:0}.today-wide-card{grid-column:span 1}.today-task-list,.today-event-list{display:flex;flex-direction:column;gap:8px}.today-task-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:10px}.today-task-check{width:28px;height:28px;border-radius:999px;border:1.5px solid var(--border);background:var(--bg2);color:var(--accent);font-weight:900;cursor:pointer}.today-task-row strong{display:block;font-size:13px;color:var(--text);line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.today-task-row small{display:block;font-size:11px;color:var(--text2);font-weight:900;margin-top:2px}.today-event-row{display:grid;grid-template-columns:70px minmax(0,1fr);gap:10px;align-items:center;background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:10px}.today-event-row time{font-family:var(--mono);font-size:12px;font-weight:900;color:var(--accent);white-space:nowrap}.today-event-row strong{display:block;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.today-event-row small{font-size:11px;color:var(--text3);font-weight:900}.today-dashboard-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.today-dashboard-card-grid .ritual-card,.today-dashboard-card-grid .habit-card{box-shadow:none}.today-bottom-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.75fr);gap:14px}.today-prompt{font-size:16px;line-height:1.5;font-weight:900;color:var(--text);background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:14px;margin:0}.today-journal-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.today-loop{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:12px}.today-loop span{font-size:11px;font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:6px 9px}.today-loop i{width:14px;height:1px;background:var(--border);display:block}.today-side-card .phase-empty,.today-main-card .phase-empty{min-height:74px;display:flex;align-items:center}@media(min-width:1280px){.today-dashboard-grid{grid-template-columns:1fr 1fr}.today-wide-card{grid-column:span 1}.today-dashboard-card-grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));}}@media(max-width:980px){.today-dashboard-hero,.today-bottom-grid{grid-template-columns:1fr}.today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.today-dashboard-grid{grid-template-columns:1fr}.today-wide-card{grid-column:auto}}@media(max-width:560px){.today-hero-copy,.today-checkin-card{border-radius:22px;padding:16px}.today-hero-copy h1{font-size:26px}.today-rhythm-strip{grid-template-columns:1fr 1fr}.today-rhythm-strip button{padding:12px 10px}.today-task-row{grid-template-columns:auto minmax(0,1fr)}.today-row-action{grid-column:2;justify-self:start}.today-event-row{grid-template-columns:58px minmax(0,1fr)}.today-journal-actions{flex-direction:column}.today-journal-actions button{width:100%;}}


  /* ── Phase 18: mobile-first polish ─────────────────────────────────────── */
  .mobile-sidebar-scrim{display:none;}
  .mobile-sync-strip{display:none;}
  .ritual-open-checklist{white-space:nowrap;}
  .ritual-focus-overlay{position:fixed;inset:0;z-index:1200;background:rgba(54,32,50,.32);display:flex;align-items:center;justify-content:center;padding:18px;}
  .ritual-focus-sheet{width:min(560px,calc(100vw - 28px));max-height:min(86vh,780px);overflow:auto;background:var(--bg2);border:1.5px solid var(--border);border-top:5px solid var(--ritual-color);border-radius:28px;box-shadow:0 24px 80px rgba(74,40,64,.22);padding:18px;display:flex;flex-direction:column;gap:14px;}
  .ritual-focus-head{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;background:var(--bg2);z-index:2;padding-bottom:8px;border-bottom:1px solid var(--border);}
  .ritual-focus-step-list{gap:9px;}
  .ritual-focus-step-list .ritual-step{padding:12px 13px;border-radius:16px;font-size:14px;min-height:48px;}
  .ritual-focus-actions{display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:var(--bg2);padding-top:10px;border-top:1px solid var(--border);}

  @media(max-width:768px){
    :root{--mobile-nav-h:calc(70px + env(safe-area-inset-bottom));}
    body{overscroll-behavior:none;}
    .app{height:100dvh;padding-bottom:var(--mobile-nav-h);}
    .main{height:100%;}
    .content-area{height:100%;padding-bottom:0;}
    .mobile-sidebar-scrim.open{display:block;position:fixed;inset:0;bottom:var(--mobile-nav-h);z-index:155;background:rgba(54,32,50,.26);border:0;}
    .sidebar{bottom:var(--mobile-nav-h)!important;border-radius:0 22px 0 0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
    .sidebar.closed + .mobile-sidebar-scrim{display:none!important;}
    .sidebar-nav{flex:1;min-height:0;overflow-y:auto;padding-bottom:18px;-webkit-overflow-scrolling:touch;}
    .sidebar-cals{max-height:34vh;overflow-y:auto;-webkit-overflow-scrolling:touch;}

    .mobile-nav{height:var(--mobile-nav-h);padding:7px 6px calc(7px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 -8px 30px rgba(184,111,143,.12);gap:3px;}
    .dark .mobile-nav{background:rgba(35,19,41,.96);}
    .mobile-nav-btn{min-width:0;border-radius:16px;font-size:20px;font-weight:900;touch-action:manipulation;}
    .mobile-nav-btn span{font-size:9.5px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .mobile-nav-btn.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent3);}
    .mobile-nav-btn:active{transform:scale(.97);}
    .mobile-sync-strip{display:flex;position:fixed;left:10px;right:10px;bottom:calc(var(--mobile-nav-h) + 8px);z-index:118;justify-content:center;pointer-events:none;}
    .mobile-sync-strip .sync-pill{pointer-events:auto;max-width:calc(100vw - 28px);white-space:normal;justify-content:center;text-align:center;box-shadow:0 10px 28px rgba(184,111,143,.18);}

    .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{height:100%;overflow:auto;-webkit-overflow-scrolling:touch;scroll-padding-bottom:calc(var(--mobile-nav-h) + 24px);}
    .phase-page{padding:12px 12px calc(var(--mobile-nav-h) + 22px)!important;gap:14px;}
    .phase-hero{position:sticky;top:0;z-index:70;border-radius:0 0 22px 22px;margin:-12px -12px 4px;padding:16px 14px;background:var(--bg2);box-shadow:0 1px 0 var(--border), var(--shadow-sm);}
    .phase-hero h1{font-size:23px;}
    .phase-hero p{font-size:12px;}
    .phase-hero .tf-save,.phase-hero .tf-cancel{min-height:44px;width:100%;}
    .phase-card{border-radius:20px;padding:15px;}
    .phase-card-head{align-items:flex-start;gap:8px;}
    .phase-card-head button,.phase-card-head .tf-cancel,.phase-card-head .tf-save{min-height:38px;padding:8px 11px;}

    .today-page-v2{padding-top:12px!important;}
    .today-dashboard-hero,.today-dashboard-grid,.today-bottom-grid,.today-dashboard-card-grid{grid-template-columns:1fr!important;}
    .today-hero-copy{padding:18px;border-radius:24px;}
    .today-hero-copy h1{font-size:27px;}
    .today-hero-actions{display:grid;grid-template-columns:1fr;gap:8px;}
    .today-hero-actions button,.today-journal-actions button{min-height:46px;}
    .today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr));}
    .today-rhythm-strip button{min-height:74px;}
    .today-task-row,.today-event-row,.phase-list-row,.ritual-list-row{min-height:52px;}

    .task-board-nav{top:0!important;padding:10px 0!important;}
    .tasks-page{padding:0 12px calc(var(--mobile-nav-h) + 18px)!important;}
    .tasks-page > .journal-header,.journal-header,.bloom-room-page .journal-header{min-height:58px;}
    .task-item,.task-card-with-move,.today-task-row{touch-action:pan-y;position:relative;}
    .task-item::after,.today-task-row::after{content:"Swipe-friendly";display:none;position:absolute;right:10px;bottom:6px;font-size:9px;font-weight:900;color:var(--text3);}
    .task-item button,.task-card-with-move button,.today-task-row button,.tf-save,.tf-cancel,.tf-delete,.modal-close,.mini-pill,.weekday-btn{min-height:40px;touch-action:manipulation;}

    .calendar-pane{padding:10px 10px calc(var(--mobile-nav-h) + 16px)!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
    .calendar-pane.view-week,.calendar-pane.view-month{padding-bottom:calc(var(--mobile-nav-h) + 16px)!important;}
    .topbar{position:sticky;top:0;z-index:85;background:var(--bg2);box-shadow:0 1px 0 var(--border), var(--shadow-sm);height:auto;min-height:58px;overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .topbar-btn,.view-tab{min-height:40px;}
    .event-block{min-height:36px;border-radius:14px;padding:8px 10px;touch-action:manipulation;}
    .event-resize-handle{opacity:.55;height:12px;}
    .month-day{touch-action:manipulation;}
    .wt-day-header{min-height:48px;touch-action:manipulation;}

    .ritual-grid,.habit-grid,.ritual-template-grid,.affirmation-list-grid{grid-template-columns:1fr!important;}
    .ritual-card,.habit-card{border-radius:22px;padding:15px;}
    .ritual-card-actions,.habit-card-actions{display:grid;grid-template-columns:1fr;gap:8px;}
    .ritual-card-actions button,.habit-card-actions button,.habit-check{width:100%;min-height:46px;}
    .ritual-step{min-height:46px;padding:12px;font-size:13px;}
    .ritual-step input{width:20px;height:20px;}
    .ritual-open-checklist{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:9px 12px;font:inherit;font-size:12px;font-weight:950;cursor:pointer;}
    .ritual-focus-overlay{align-items:flex-end;padding:0;z-index:1250;}
    .ritual-focus-sheet{width:100vw;max-width:100vw;max-height:calc(100dvh - var(--mobile-nav-h));border-radius:28px 28px 0 0;border-left:0;border-right:0;border-bottom:0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));}
    .ritual-focus-head{margin:-18px -16px 0;padding:16px;background:var(--bg2);}
    .ritual-focus-step-list .ritual-step{font-size:15px;min-height:54px;}
    .ritual-focus-actions{display:grid;grid-template-columns:1fr 1fr;margin:0 -16px -18px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));}

    .habit-week-grid-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px;}
    .habit-week-grid{min-width:0!important;grid-template-columns:minmax(120px,1.5fr) repeat(7,minmax(38px,1fr))!important;gap:5px;}
    .habit-week-grid>*{min-height:42px;padding:6px 4px;}

    .journal-page textarea,.entry-modal textarea,.memory-caption-input,.gratitude-input,.modal-textarea,.checkin-note-input{min-height:48px;line-height:1.5;}
    .entry-modal .modal-actions,.entry-modal .entry-modal-actions,.modal-actions{position:sticky;bottom:0;background:var(--bg2);z-index:60;padding-top:10px;border-top:1px solid var(--border);}

    .undo-btn{bottom:calc(var(--mobile-nav-h) + 18px);}
    .chat-fab{bottom:calc(var(--mobile-nav-h) + 14px);right:16px;width:52px;height:52px;}
    .chat-panel{bottom:calc(var(--mobile-nav-h) + 14px)!important;max-height:calc(100dvh - var(--mobile-nav-h) - 32px);}
    .event-copy-bar{bottom:calc(var(--mobile-nav-h) + 12px);}
    .tempo-toast{bottom:calc(var(--mobile-nav-h) + 16px)!important;}
  }

  .notification-pref-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px;}
  .notification-pref-card{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:center;gap:9px;border:1px solid var(--border);background:var(--bg3);border-radius:16px;padding:10px 12px;cursor:pointer;}
  .notification-pref-card input,.notification-schedule-row input[type="checkbox"]{accent-color:var(--accent);}
  .notification-pref-emoji{font-size:18px;}.notification-pref-card strong,.notification-schedule-row strong{display:block;color:var(--text);font-size:12px;font-weight:950;}.notification-pref-card small,.notification-schedule-row small{display:block;color:var(--text3);font-size:10px;font-weight:850;margin-top:2px;}
  .notification-schedule-list{display:flex;flex-direction:column;gap:8px;margin-top:10px;}.notification-schedule-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center;gap:8px;border:1px solid var(--border);background:var(--bg2);border-radius:16px;padding:10px 12px;}.notification-day-select{min-width:118px;padding:8px 10px;}
  @media(max-width:560px){.notification-pref-grid{grid-template-columns:1fr}.notification-schedule-row{grid-template-columns:minmax(0,1fr) auto;}.notification-schedule-row .meal-time,.notification-day-select{grid-column:1/-1;width:100%;}}

  .sync-debug-panel{margin-top:12px;border:1px solid rgba(var(--accent-rgb),.16);background:var(--surface-soft);border-radius:20px;padding:12px;display:flex;flex-direction:column;gap:10px;}
  .sync-debug-top{display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text);font-size:12px;font-weight:950;}
  .sync-debug-top span{font-size:10px;color:var(--accent);background:rgba(var(--accent-rgb),.10);border:1px solid rgba(var(--accent-rgb),.16);border-radius:999px;padding:4px 8px;}
  .sync-debug-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
  .sync-debug-grid div{background:var(--surface);border:1px solid rgba(var(--accent-rgb),.13);border-radius:14px;padding:8px 9px;min-width:0;}
  .sync-debug-grid strong{display:block;color:var(--text);font-size:13px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sync-debug-grid span{display:block;color:var(--text3);font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.04em;margin-top:2px;}
  .sync-debug-datasets{display:flex;flex-wrap:wrap;gap:6px;}
  .sync-debug-datasets span{font-size:10px;font-weight:850;color:var(--text2);background:var(--surface);border:1px solid rgba(var(--accent-rgb),.12);border-radius:999px;padding:4px 7px;}
  .sync-conflict-list{display:flex;flex-direction:column;gap:6px;}
  .sync-conflict-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:center;background:var(--surface);border:1px solid rgba(var(--accent-rgb),.12);border-radius:14px;padding:7px 8px;font-size:10px;}
  .sync-conflict-row span{color:var(--accent);font-weight:950;}.sync-conflict-row strong{color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.sync-conflict-row em{font-style:normal;color:var(--text3);font-weight:850;}
  @media(max-width:560px){.sync-debug-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.sync-conflict-row{grid-template-columns:1fr}.sync-conflict-row strong{white-space:normal}}


  /* ── Phase 19: visual rebrand system ─────────────────────────────────────── */
  .app{background:radial-gradient(circle at 14% 0%,rgba(var(--accent-rgb),.10),transparent 30%),linear-gradient(180deg,var(--bg),var(--bg3));}
  .main{background:transparent;}
  .sidebar{background:linear-gradient(180deg,var(--surface),var(--surface-soft));border-right:1px solid rgba(var(--accent-rgb),.16);box-shadow:8px 0 34px rgba(116,78,60,.045);}
  .sidebar-logo{padding:22px 20px;border-bottom:1px solid rgba(var(--accent-rgb),.14);background:linear-gradient(135deg,var(--surface),var(--surface-soft));}
  .sidebar-logo .logo-icon,.login-mascot .mascot-icon{box-shadow:0 10px 24px rgba(var(--accent-rgb),.18);}
  .sidebar-date{background:var(--surface-soft);border-bottom:1px solid rgba(var(--accent-rgb),.12);}
  .sidebar-date .date-big{background:linear-gradient(135deg,var(--accent),#B98277);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .nav-item{border-radius:16px;margin-bottom:4px;font-weight:850;}
  .nav-icon{filter:saturate(.86);opacity:.9;}
  .nav-item:hover{background:rgba(var(--accent-rgb),.08);}
  .nav-item.active{background:linear-gradient(135deg,rgba(var(--accent-rgb),.14),rgba(255,255,255,.72));box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.20);}
  .topbar,.stats-bar{background:linear-gradient(180deg,var(--surface),var(--surface-warm));border-color:rgba(var(--accent-rgb),.14);box-shadow:0 10px 28px rgba(116,78,60,.045);}
  .topbar-btn,.view-tabs,.view-tab.active,.stat,.sync-pill,.sidebar-daily-stats-btn{border-color:rgba(var(--accent-rgb),.16);box-shadow:none;}
  .topbar-btn,.stat,.sync-pill,.view-tabs{background:var(--surface-soft);}
  .topbar-btn:hover,.view-tab.active,.sidebar-daily-stats-btn:hover{background:rgba(var(--accent-rgb),.10);border-color:rgba(var(--accent-rgb),.28);}
  .add-event-btn,.tf-save,.plan-day-btn,.chat-send,.chat-fab{background:linear-gradient(135deg,var(--accent),#C99284)!important;box-shadow:0 12px 28px rgba(var(--accent-rgb),.22)!important;}
  .tf-save,.tf-cancel,.topbar-btn,.phase-card-head button,.today-row-action,.mini-pill,.affirmation-favorite-btn,.affirmation-list-actions button,.ritual-open-checklist{border-radius:999px;}
  .tf-cancel{background:var(--surface);border-color:rgba(var(--accent-rgb),.18);}
  .tf-cancel:hover{background:rgba(var(--accent-rgb),.08);color:var(--accent);border-color:rgba(var(--accent-rgb),.28);}

  .phase-page,.soft-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{background:radial-gradient(circle at 0% 0%,rgba(var(--accent-rgb),.075),transparent 30%),linear-gradient(180deg,var(--bg),var(--bg3));}
  .phase-page{gap:20px;}
  .phase-hero,.today-hero-copy,.affirmation-hero{background:linear-gradient(135deg,var(--surface),var(--surface-soft))!important;border:1px solid rgba(var(--accent-rgb),.16)!important;border-radius:32px!important;box-shadow:var(--shadow-sm)!important;}
  .phase-hero h1,.today-hero-copy h1,.affirmation-hero h1{letter-spacing:-.045em;color:var(--text);}
  .phase-hero p,.today-hero-copy p,.affirmation-hero p{color:var(--text2);font-weight:750;}

  .phase-card,.task-period-card,.task-panel.standalone,.tomorrow-reset-card.page-card,.tomorrow-reset-section,.weekly-reset-panel,.stats-card,.daily-quests-card,.badges-card,.game-soft-card,.bloom-collapse,.reflection-hub-card,.checkin-rhythm-card,.tomorrow-reset-rhythm-card,.weekly-reset-rhythm-card,.affirmation-feature-card,.affirmation-list-card,.affirmation-daily-card,.affirmation-rhythm-card,.journal-reflection-hub,.journal-checkin-card,.journal-reset-card,.memory-page-card,.plan-task-picker,.plan-context-card>div,.plan-soft-blocks,.modal,.checkin-modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{background:linear-gradient(180deg,var(--surface),var(--surface-warm))!important;border:1px solid rgba(var(--accent-rgb),.16)!important;border-radius:28px!important;box-shadow:var(--shadow-sm)!important;}
  .phase-card:hover,.ritual-card:hover,.habit-card:hover,.task-period-card:hover,.affirmation-list-card:hover,.memory-page-card:hover:not(.future){box-shadow:var(--shadow)!important;transform:translateY(-1px);}
  .phase-card-head{margin-bottom:14px;}
  .phase-card-head span,.phase-card-head strong,.game-card-title,.panel-title{font-size:15px;font-weight:950;letter-spacing:-.01em;color:var(--text);}
  .phase-card-head small,.game-card-sub{color:var(--text3);font-weight:850;}
  .phase-empty,.task-card-empty,.plan-warning{background:var(--surface-soft)!important;border:1px dashed rgba(var(--accent-rgb),.22)!important;border-radius:20px!important;color:var(--text2)!important;}

  .today-dashboard-hero,.today-dashboard-grid,.today-bottom-grid{gap:16px;}
  .today-hero-copy{padding:28px!important;}
  .today-checkin-card,.today-rhythm-strip button,.today-task-row,.today-event-row,.today-prompt,.today-mood-display,.today-energy-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:22px!important;box-shadow:0 8px 22px rgba(116,78,60,.035);}
  .today-checkin-card{border-radius:30px!important;padding:20px!important;}
  .today-mood-display{background:linear-gradient(135deg,var(--surface-soft),var(--blush-soft))!important;}
  .today-rhythm-strip button{padding:16px 14px;}
  .today-rhythm-strip strong{color:var(--accent);}
  .today-loop span{background:rgba(var(--accent-rgb),.10);border-color:rgba(var(--accent-rgb),.18);}

  .ritual-card,.habit-card,.ritual-template-card{background:linear-gradient(180deg,var(--surface),var(--surface-soft))!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:26px!important;box-shadow:var(--shadow-sm)!important;}
  .ritual-card{border-left:5px solid var(--ritual-color)!important;}
  .ritual-emoji,.habit-emoji,.ritual-template-emoji,.ritual-list-emoji,.checkin-rhythm-current .big-emoji,.affirmation-feature-emoji,.affirmation-quote-icon,.mascot-stage-icon{background:var(--surface-soft)!important;border:1px solid rgba(var(--accent-rgb),.14)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .ritual-step,.ritual-list-row,.habit-week-grid>*,.plan-task-choice,.tomorrow-reset-task,.weekly-reset-input-list input,.weekly-reset-label textarea,.tomorrow-reset-reflection-grid textarea,.checkin-option,.checkin-note-input,.modal-select,.modal-textarea,.tf-input,.tf-select,.tf-duration,.chat-input,.memory-search-input,.gratitude-input{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.16)!important;border-radius:18px!important;box-shadow:none!important;}
  .ritual-step:hover,.plan-task-choice:hover,.checkin-option:hover{border-color:rgba(var(--accent-rgb),.30)!important;background:var(--surface-soft)!important;}
  .ritual-step input,.habit-card input,.plan-task-choice input,.notification-pref-card input{accent-color:var(--accent);}
  .ritual-progress-track,.rhythm-meter-track,.skill-track,.task-progress-track{height:8px!important;background:rgba(var(--accent-rgb),.12)!important;border:1px solid rgba(var(--accent-rgb),.12)!important;border-radius:999px!important;overflow:hidden;}
  .ritual-progress-track i,.rhythm-meter-track i,.skill-fill,.task-progress-track i{background:linear-gradient(90deg,var(--accent),var(--accent2))!important;border-radius:999px;}

  .tasks-page .task-period-board{gap:16px;}
  .task-period-card{padding:18px!important;}
  .task-card-add{background:var(--surface-soft)!important;border-color:rgba(var(--accent-rgb),.20)!important;border-radius:18px!important;}
  .task-item{background:var(--surface);border:1px solid rgba(var(--accent-rgb),.10);border-radius:18px;margin-bottom:7px;padding:12px;}
  .task-item:hover{background:var(--surface-soft);border-color:rgba(var(--accent-rgb),.22);}
  .task-check{border-radius:999px;border-color:rgba(var(--accent-rgb),.22);background:var(--surface-warm);}
  .task-item.done .task-check{background:linear-gradient(135deg,var(--accent),var(--accent2));}
  .task-footer,.panel-header,.task-form{background:var(--surface-soft)!important;border-color:rgba(var(--accent-rgb),.12)!important;}

  .calendar-pane{background:transparent;}
  .day-view,.week-timetable,.month-view,.all-day-strip,.week-all-day-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.14)!important;border-radius:24px;box-shadow:var(--shadow-sm);overflow:hidden;}
  .day-view{padding:14px;}
  .hour-line,.wt-hour-line{background:rgba(var(--accent-rgb),.11)!important;}
  .event-block,.wt-event,.month-event-row,.all-day-chip,.week-all-day-chip{border-radius:14px!important;box-shadow:none!important;}
  .event-block{border-left-width:4px!important;}
  .month-day,.wt-cell,.week-all-day-cell{border-color:rgba(var(--accent-rgb),.10)!important;}
  .today-circle{background:var(--accent)!important;color:white!important;}

  .journal-header{background:linear-gradient(180deg,var(--surface),var(--surface-warm))!important;border-bottom:1px solid rgba(var(--accent-rgb),.14)!important;}
  .journal-title{letter-spacing:-.035em;}
  .mood-stats-bar,.memory-book-section,.journal-entries-section,.memory-search-section,.memory-throwback-section{background:transparent!important;}
  .journal-entry-card,.memory-throwback-card,.memory-bg-choice,.sticker-preview-chip,.sticker-asset-picker-row button{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:22px!important;box-shadow:var(--shadow-sm);}

  .bloom-room-page .game-dashboard{gap:16px;}
  .quest-item,.badge-chip,.weekly-mini-grid div,.tomorrow-reset-mini-grid div,.journal-reflection-tile,.affirmation-stats-grid div,.rhythm-mini-panel,.rhythm-insight-card,.stat-big,.rhythm-chip-row,.rhythm-category-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:18px!important;box-shadow:none!important;}
  .mascot-stage{background:linear-gradient(135deg,var(--surface-soft),var(--blush-soft))!important;border-color:rgba(var(--accent-rgb),.16)!important;border-radius:24px!important;}
  .garden-cell{border-color:rgba(var(--accent-rgb),.12)!important;background:var(--surface-soft)!important;}
  .garden-cell.bud,.garden-cell.bloom,.garden-cell.big,.garden-cell.gold{background:linear-gradient(135deg,var(--blush-soft),var(--surface))!important;}

  .affirmation-feature-card{background:radial-gradient(circle at top left,rgba(var(--accent-rgb),.13),transparent 36%),linear-gradient(180deg,var(--surface),var(--surface-warm))!important;}
  .affirmation-feature-top blockquote,.affirmation-quote-row blockquote{letter-spacing:-.025em;color:var(--text);}
  .affirmation-category,.affirmation-filter-row button,.notification-pref-card,.notification-schedule-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:18px!important;}
  .affirmation-category.active,.affirmation-filter-row button.active,.mini-pill.active,.planning-mode-btn.active,.plan-task-choice.selected{background:rgba(var(--accent-rgb),.10)!important;border-color:rgba(var(--accent-rgb),.30)!important;color:var(--accent)!important;}

  .tomorrow-reset-page,.weekly-reset-page{padding:24px 28px 96px;}
  .tomorrow-reset-head,.tomorrow-reset-section-head{gap:14px;}
  .tomorrow-reset-task{grid-template-columns:minmax(0,1fr) minmax(180px,240px);padding:13px 14px;}
  .reset-quick-actions button{background:var(--surface);border:1px solid rgba(var(--accent-rgb),.16);border-radius:999px;color:var(--accent);}
  .weekly-reset-mini-grid div,.tomorrow-reset-summary-row>div{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:18px!important;}

  .modal-overlay{background:rgba(70,52,45,.22);backdrop-filter:blur(10px);}
  .modal-header,.chat-header{background:linear-gradient(135deg,var(--surface),var(--surface-soft))!important;border-color:rgba(var(--accent-rgb),.12)!important;}
  .modal-footer,.chat-input-row{background:var(--surface-soft)!important;border-color:rgba(var(--accent-rgb),.12)!important;}
  .color-dot,.weekday-btn{box-shadow:0 3px 10px rgba(116,78,60,.06);}

  .dark .phase-card,.dark .task-period-card,.dark .task-panel.standalone,.dark .tomorrow-reset-card.page-card,.dark .tomorrow-reset-section,.dark .weekly-reset-panel,.dark .stats-card,.dark .daily-quests-card,.dark .badges-card,.dark .game-soft-card,.dark .bloom-collapse,.dark .reflection-hub-card,.dark .checkin-rhythm-card,.dark .tomorrow-reset-rhythm-card,.dark .weekly-reset-rhythm-card,.dark .affirmation-feature-card,.dark .affirmation-list-card,.dark .affirmation-daily-card,.dark .affirmation-rhythm-card,.dark .journal-reflection-hub,.dark .journal-checkin-card,.dark .journal-reset-card,.dark .memory-page-card,.dark .plan-task-picker,.dark .modal,.dark .checkin-modal,.dark .entry-modal,.dark .entry-view-modal,.dark .settings-panel,.dark .templates-panel,.dark .search-modal{background:linear-gradient(180deg,var(--bg2),var(--bg3))!important;border-color:rgba(var(--accent-rgb),.20)!important;}
  .dark .topbar,.dark .stats-bar,.dark .sidebar,.dark .journal-header{background:linear-gradient(180deg,var(--bg2),var(--bg3))!important;}
  .dark .ritual-step,.dark .habit-week-grid>*,.dark .plan-task-choice,.dark .tomorrow-reset-task,.dark .task-item,.dark .journal-entry-card,.dark .quest-item,.dark .badge-chip,.dark .weekly-mini-grid div,.dark .tomorrow-reset-mini-grid div,.dark .journal-reflection-tile,.dark .affirmation-stats-grid div,.dark .rhythm-mini-panel,.dark .rhythm-insight-card,.dark .stat-big,.dark .rhythm-chip-row,.dark .rhythm-category-row{background:var(--bg2)!important;}


  /* ── Phase 21 + debug hotfixes ───────────────────────────────────────── */
  .content-area{min-height:0!important;}
  .calendar-pane{min-height:0!important;}
  .calendar-pane.view-day,.calendar-pane.view-week{display:block!important;overflow-y:auto!important;min-height:0!important;height:100%!important;padding-bottom:28px!important;}
  .calendar-pane.view-day .day-view,.calendar-pane.view-week .week-timetable{min-height:max-content!important;overflow:visible!important;}
  .calendar-pane.view-week .wt-grid,.calendar-pane.view-day .day-grid{min-height:calc((var(--calendar-hours, 18))*48px);}
  .calendar-pane.view-month{container-type:inline-size;min-width:0!important;}
  .month-view{grid-template-columns:repeat(7,minmax(0,1fr))!important;min-width:0!important;width:100%!important;}
  .month-day{min-width:0!important;min-height:clamp(82px, 10.4vw, 116px)!important;}
  .month-event-row,.month-event-name{min-width:0!important;}
  .task-panel.resizing ~ *,.calendar-pane.view-month .month-day{transition:none!important;}
  @container (max-width: 900px){.calendar-pane.view-month .month-day{min-height:96px!important;}.calendar-pane.view-month .month-event-row{font-size:9.5px!important;padding-left:3px!important;padding-right:3px!important;}}
  @container (max-width: 760px){.calendar-pane.view-month .month-day{min-height:84px!important;}.calendar-pane.view-month .month-day-num{font-size:13px!important;}.calendar-pane.view-month .month-event-row{font-size:9px!important;}}
  .reset-hero-oneline{max-width:none!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .onboarding-overlay{z-index:260;}
  .onboarding-modal{width:min(920px,calc(100vw - 28px));max-height:90vh;overflow:auto;background:linear-gradient(180deg,var(--surface,var(--bg2)),var(--surface-warm,var(--bg3)));border:1px solid rgba(var(--accent-rgb),.18);border-radius:32px;box-shadow:var(--shadow-lg);padding:22px;}
  .onboarding-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border:1px solid rgba(var(--accent-rgb),.14);background:linear-gradient(135deg,rgba(255,250,252,.94),rgba(255,255,255,.72));border-radius:26px;padding:18px;margin-bottom:14px;}
  .onboarding-hero h2{margin:2px 0 6px;font-size:30px;line-height:1.05;color:var(--text);}
  .onboarding-hero p{margin:0;color:var(--text2);font-size:13px;font-weight:800;line-height:1.45;max-width:620px;}
  .onboarding-section{border:1px solid rgba(var(--accent-rgb),.14);background:rgba(255,255,255,.58);border-radius:24px;padding:14px;margin-top:12px;}
  .onboarding-section-title{font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:10px;}
  .onboarding-choice-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;}
  .onboarding-choice,.onboarding-template{border:1.5px solid var(--border);background:var(--bg2);border-radius:18px;padding:12px;text-align:left;color:var(--text);font:inherit;cursor:pointer;box-shadow:var(--shadow-sm);}
  .onboarding-choice.selected,.onboarding-template.selected{border-color:rgba(var(--accent-rgb),.42);background:rgba(var(--accent-rgb),.10);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.08);}
  .onboarding-choice strong,.onboarding-template strong{display:block;font-size:12px;font-weight:950;line-height:1.25;}
  .onboarding-choice small,.onboarding-template small{display:block;margin-top:4px;font-size:10.5px;color:var(--text2);font-weight:800;line-height:1.3;}
  .onboarding-time-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
  .onboarding-time-grid label{display:flex;flex-direction:column;gap:6px;color:var(--text2);font-size:12px;font-weight:900;}
  .onboarding-template-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;}
  .onboarding-template span{font-size:22px;display:block;margin-bottom:5px;}
  .onboarding-reminder-row{display:flex;gap:10px;flex-wrap:wrap;}
  .onboarding-reminder-row label{border:1px solid var(--border);background:var(--bg2);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900;color:var(--text2);display:flex;align-items:center;gap:7px;}
  .onboarding-reminder-row input{accent-color:var(--accent);}
  .onboarding-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;}

  @media(max-width:768px){
    .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{background:linear-gradient(180deg,var(--bg),var(--bg3))!important;}
    .phase-hero{background:var(--surface)!important;border-radius:0 0 24px 24px!important;box-shadow:0 1px 0 rgba(var(--accent-rgb),.12),var(--shadow-sm)!important;}
    .topbar,.stats-bar,.journal-header,.tasks-page>.journal-header,.bloom-room-page .journal-header{background:var(--surface)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
    .phase-card,.ritual-card,.habit-card,.today-checkin-card,.today-rhythm-strip button,.today-task-row,.today-event-row{border-radius:22px!important;}
    .tomorrow-reset-page,.weekly-reset-page{padding:14px 12px calc(var(--mobile-nav-h) + 24px)!important;}
    .reset-hero-oneline{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;}
    .onboarding-modal{width:calc(100vw - 20px);padding:14px;border-radius:24px;max-height:calc(100vh - 28px);}
    .onboarding-hero{border-radius:20px;padding:14px;}.onboarding-hero h2{font-size:24px;}
    .onboarding-choice-grid,.onboarding-template-grid,.onboarding-time-grid{grid-template-columns:1fr;}
    .onboarding-actions{position:sticky;bottom:0;background:linear-gradient(180deg,transparent,var(--surface,var(--bg2)) 32%);padding-top:20px;}
    .tomorrow-reset-task{grid-template-columns:1fr;}
  }



/* ── Pre Phase 22 audit fixes ───────────────────────────────────────────── */
.mobile-sidebar-scrim{display:none!important;}
.memory-page-card.has-memory{
  background-image:var(--memory-bg-image,linear-gradient(180deg,var(--surface),var(--surface-warm)))!important;
  background-size:cover!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
}
.memory-page-card.has-memory .memory-page-shade{background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.62));}
.entry-modal.memory-entry-modal,.entry-view-modal{
  background-image:var(--memory-bg-image,linear-gradient(180deg,var(--surface),var(--surface-warm)))!important;
  background-size:cover!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
}
.habit-template-library.collapsed{padding-bottom:14px;}
.habit-template-library.collapsed .phase-empty{margin-top:10px;}
.calendar-pane.view-month{min-width:0!important;overflow:auto!important;}
.month-view{grid-template-columns:repeat(7,minmax(0,1fr))!important;width:100%!important;min-width:0!important;align-content:stretch!important;}
.month-day,.month-event-row,.month-event-name{min-width:0!important;}
.calendar-pane.view-day,.calendar-pane.view-week{overflow-y:auto!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
.day-view,.week-timetable{min-height:max-content!important;touch-action:pan-y;}
.day-grid,.wt-grid{flex:0 0 auto;}
.event-block,.wt-event{touch-action:auto;}
@media(max-width:768px){
  :root{--mobile-nav-h:calc(86px + env(safe-area-inset-bottom));}
  html,body,#__next{height:100%;overflow:hidden!important;}
  .app{height:100dvh!important;min-height:0!important;padding-bottom:0!important;overflow:hidden!important;}
  .main{min-height:0!important;overflow:hidden!important;}
  .content-area{min-height:0!important;overflow:hidden!important;}
  .calendar-pane{height:100%!important;min-height:0!important;overflow-y:auto!important;touch-action:pan-y!important;padding-bottom:calc(var(--mobile-nav-h) + 22px)!important;}
  .calendar-pane.view-day,.calendar-pane.view-week{overflow-y:auto!important;-webkit-overflow-scrolling:touch;}
  .day-view,.week-timetable{padding-bottom:calc(var(--mobile-nav-h) + 28px)!important;min-height:max-content!important;}
  .mobile-nav{display:flex!important;min-height:var(--mobile-nav-h)!important;height:auto!important;padding:8px 8px calc(10px + env(safe-area-inset-bottom))!important;align-items:stretch!important;overflow:visible!important;}
  .mobile-nav-btn{min-height:56px!important;padding:6px 3px!important;border-radius:16px!important;font-size:19px!important;line-height:1!important;}
  .mobile-nav-btn span{font-size:9.5px!important;line-height:1.05!important;margin-top:3px;}
  .mobile-sidebar-scrim.open{display:block!important;position:fixed!important;inset:0!important;background:rgba(55,33,42,.24)!important;z-index:84!important;border:0!important;padding:0!important;}
  .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{height:100%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;padding-bottom:calc(var(--mobile-nav-h) + 22px)!important;}
}


/* ── Pre Phase 22 final phone-first layout audit ─────────────────────────── */
.today-top-layout{grid-template-columns:minmax(210px,.72fr) minmax(330px,1.22fr) minmax(280px,.86fr)!important;gap:16px!important;}
.today-hero-copy{min-width:0;}
.today-top3-card{min-width:0;}
.today-top3-card .today-task-row{padding:12px 13px;}
.today-hero-stack{min-width:0;display:flex;flex-direction:column;gap:12px;}
.today-rhythm-strip{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;width:100%!important;max-width:100%!important;}
.today-rhythm-strip button{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
.today-calendar-habits-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px!important;width:100%!important;max-width:100%!important;}
.today-calendar-habits-grid>.phase-card{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
.today-next-card,[data-section="next-gentle-step"]{display:none!important;}
.journal-top-card-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px!important;margin:14px 16px!important;}
.journal-top-card-row>.journal-checkin-card,.journal-top-card-row>.journal-reset-card{min-width:0!important;width:100%!important;}
.bloom-card-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px!important;align-items:stretch!important;}
.bloom-card-row>.game-soft-card,.bloom-card-row>.checkin-rhythm-card,.bloom-card-row>.affirmation-rhythm-card,.bloom-card-row>.tomorrow-reset-rhythm-card,.bloom-card-row>.weekly-reset-rhythm-card{min-width:0!important;width:100%!important;height:100%!important;}
.checkin-rhythm-current .big-emoji{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 42px!important;width:42px!important;height:42px!important;font-size:28px!important;line-height:1!important;}
@media(max-width:1180px){.today-top-layout{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;}.today-hero-copy{grid-column:1/-1!important;}.today-hero-stack{grid-column:auto!important;}}
@media(max-width:980px){.today-top-layout{grid-template-columns:1fr!important;}.today-calendar-habits-grid,.bloom-card-row,.journal-top-card-row{grid-template-columns:1fr!important;}.today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}
@media(max-width:768px){
  :root{--mobile-nav-h:calc(74px + env(safe-area-inset-bottom));}
  .mobile-nav{height:var(--mobile-nav-h)!important;min-height:var(--mobile-nav-h)!important;padding:5px 5px calc(6px + env(safe-area-inset-bottom))!important;gap:2px!important;}
  .mobile-nav-btn{height:48px!important;min-height:48px!important;border-radius:14px!important;font-size:17px!important;padding:3px 1px!important;}
  .mobile-nav-btn span{font-size:8.2px!important;letter-spacing:-.02em!important;}
  .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page,.calendar-pane{padding-bottom:calc(var(--mobile-nav-h) + 22px)!important;}
  .today-top-layout{grid-template-columns:1fr!important;gap:10px!important;}
  .today-hero-copy{padding:14px!important;border-radius:22px!important;}
  .today-hero-copy h1{font-size:24px!important;margin-bottom:2px!important;}
  .today-hero-copy p{font-size:12px!important;}
  .today-hero-actions{grid-template-columns:1fr 1fr!important;gap:8px!important;}
  .today-hero-actions button{min-height:42px!important;padding:9px 10px!important;}
  .today-top3-card,.today-checkin-card,.affirmation-daily-card{padding:13px!important;border-radius:20px!important;}
  .today-top3-card .today-task-list{gap:7px!important;}
  .today-top3-card .today-task-row{min-height:44px!important;padding:9px 10px!important;}
  .today-empty-sugar{min-height:118px!important;padding:10px!important;}
  .today-empty-sugar img{width:72px!important;height:72px!important;}
  .today-empty-sugar strong{font-size:12px!important;}
  .today-rhythm-strip{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;}
  .today-rhythm-strip button{min-height:58px!important;padding:8px 3px!important;border-radius:16px!important;}
  .today-rhythm-strip button>span{font-size:16px!important;}
  .today-rhythm-strip strong{font-size:16px!important;line-height:1!important;}
  .today-rhythm-strip small{font-size:8px!important;line-height:1!important;}
  .today-calendar-habits-grid{grid-template-columns:1fr!important;gap:10px!important;}
  .today-side-card,.today-wide-card,.today-journal-card{padding:13px!important;border-radius:20px!important;}

  /* Journal: compact calendar-first phone layout */
  .journal-page{padding:8px 8px calc(var(--mobile-nav-h) + 18px)!important;gap:8px!important;}
  .journal-header{position:sticky!important;top:0!important;z-index:90!important;margin:0 -8px 6px!important;padding:9px 10px!important;min-height:48px!important;border-radius:0 0 18px 18px!important;}
  .journal-title{font-size:15px!important;}
  .journal-streak{font-size:10px!important;padding:5px 7px!important;}
  .journal-today-btn{min-height:34px!important;padding:7px 8px!important;font-size:10px!important;}
  .mood-stats-bar{margin:4px 0 7px!important;padding:7px 8px!important;gap:5px!important;}
  .mood-stat-pill{padding:3px 6px!important;font-size:11px!important;}
  .mood-stats-month{font-size:10px!important;margin-left:auto!important;}
  .journal-top-card-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin:7px 0!important;}
  .journal-checkin-card,.journal-reset-card{padding:9px!important;border-radius:16px!important;min-height:92px!important;}
  .journal-checkin-main,.journal-reset-main{gap:7px!important;align-items:flex-start!important;}
  .journal-checkin-main>span,.journal-reset-main>span{font-size:20px!important;width:28px!important;height:28px!important;flex:0 0 28px!important;}
  .journal-checkin-main strong,.journal-reset-main strong{font-size:11px!important;line-height:1.15!important;}
  .journal-checkin-main p,.journal-reset-main p{font-size:9.5px!important;line-height:1.25!important;margin-top:2px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
  .journal-checkin-actions{margin-top:6px!important;gap:4px!important;}
  .journal-checkin-actions span{font-size:9px!important;}
  .journal-checkin-actions .journal-today-btn{min-height:30px!important;padding:5px 7px!important;font-size:9px!important;}
  .journal-weekly-reset-card,.journal-reflection-hub,.memory-search-section,.memory-throwback-section,.journal-recent-list-section{display:none!important;}
  .memory-book-section{margin-top:8px!important;padding:10px!important;border-radius:18px!important;}
  .memory-book-head{margin-bottom:7px!important;gap:6px!important;align-items:center!important;}
  .memory-book-title{font-size:14px!important;}
  .memory-book-sub{font-size:9.5px!important;}
  .memory-book-actions{gap:4px!important;}
  .memory-book-actions .journal-today-btn{min-height:32px!important;padding:6px 7px!important;font-size:9.5px!important;}
  .memory-filter-row{display:none!important;}
  .memory-page-grid{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:3px!important;width:100%!important;}
  .memory-page-card{min-width:0!important;min-height:48px!important;aspect-ratio:1/.98!important;border-radius:10px!important;padding:3px!important;box-shadow:none!important;}
  .memory-page-date{font-size:9px!important;top:4px!important;left:5px!important;}
  .memory-page-main{font-size:13px!important;gap:1px!important;}
  .memory-page-main strong{font-size:8px!important;}
  .memory-page-meta{display:none!important;}
  .memory-page-cover{border-radius:9px!important;}
  .memory-page-shade{border-radius:10px!important;}

  /* Bloom: keep paired cards on one row while staying readable */
  .bloom-room-page{padding:8px 8px calc(var(--mobile-nav-h) + 18px)!important;}
  .bloom-card-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-bottom:8px!important;}
  .bloom-card-row .game-soft-card,.bloom-card-row .checkin-rhythm-card,.bloom-card-row .affirmation-rhythm-card,.bloom-card-row .tomorrow-reset-rhythm-card,.bloom-card-row .weekly-reset-rhythm-card{padding:10px!important;border-radius:16px!important;}
  .bloom-card-row .game-card-title{font-size:11px!important;}
  .bloom-card-row .game-card-sub{font-size:8.5px!important;}
  .bloom-card-row .checkin-rhythm-current{gap:7px!important;align-items:flex-start!important;}
  .bloom-card-row .checkin-rhythm-current .big-emoji{width:30px!important;height:30px!important;flex-basis:30px!important;font-size:21px!important;}
  .bloom-card-row .checkin-rhythm-current strong{font-size:10.5px!important;line-height:1.18!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
  .bloom-card-row .checkin-rhythm-current p{font-size:9px!important;line-height:1.25!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
  .bloom-card-row .tomorrow-reset-mini-grid{display:none!important;}
}

/* ── Pre Phase 22 final audit fixes: phone layout, Bloom, Journal, Today ── */
.sidebar-sync-now-btn{
  height:32px!important;min-height:32px!important;padding:0 10px!important;border-radius:10px!important;
  border:1.5px solid var(--border)!important;background:var(--bg3)!important;color:var(--text2)!important;
  font-size:12px!important;font-weight:800!important;box-shadow:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;
}
.sidebar-sync-now-btn:hover{background:var(--bg4)!important;color:var(--accent)!important;border-color:var(--accent3)!important;}
.today-empty-sugar{min-height:142px!important;padding:12px!important;gap:6px!important;}
.today-empty-sugar img{width:82px!important;height:82px!important;object-fit:contain!important;filter:drop-shadow(0 8px 16px rgba(116,78,60,.08))!important;}
.today-empty-sugar strong{font-size:13px!important;line-height:1.35!important;}
.today-journal-only{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;}
.today-journal-card{grid-column:1!important;width:100%!important;}
.journal-top-card-row{width:calc(100% - 32px)!important;max-width:calc(100% - 32px)!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;margin:14px 16px!important;align-items:stretch!important;}
.journal-top-card-row>.journal-checkin-card,.journal-top-card-row>.journal-reset-card{margin:0!important;width:100%!important;min-width:0!important;height:100%!important;min-height:150px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;}
.journal-reset-card{max-width:100%!important;}
.bloom-room-page{display:flex!important;flex-direction:column!important;gap:16px!important;}
.bloom-card-row{gap:16px!important;align-items:stretch!important;margin-bottom:0!important;}
.bloom-card-row>*{min-width:0!important;height:100%!important;}
.bloom-mood-affirmation-row{align-items:stretch!important;}
.bloom-mood-affirmation-row .checkin-rhythm-card,.bloom-mood-affirmation-row .affirmation-rhythm-card{height:100%!important;display:flex!important;flex-direction:column!important;}
.checkin-rhythm-current .big-emoji{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 46px!important;width:46px!important;height:46px!important;font-size:30px!important;line-height:1!important;}
.game-dashboard.streak-only{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important;}
.streak-garden-flat{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important;}
.streak-garden-head{margin:0 0 10px!important;padding:0!important;}
.streak-grid-five{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px!important;}
.streak-garden-pill{background:var(--bg2)!important;border:1px solid var(--border)!important;border-radius:18px!important;padding:14px 8px!important;box-shadow:var(--shadow-sm)!important;min-width:0!important;}
.streak-garden-pill span{font-size:20px!important;}
.streak-garden-pill strong{font-size:17px!important;}
.streak-garden-pill small{font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
@media(max-width:980px){
  .today-journal-only{grid-template-columns:1fr!important;}
  .today-journal-card{grid-column:auto!important;}
}
@media(max-width:768px){
  .sidebar-sync-now-btn{width:100%!important;min-height:36px!important;}
  .today-empty-sugar{min-height:108px!important;}
  .today-empty-sugar img{width:56px!important;height:56px!important;}
  .journal-top-card-row{width:calc(100% - 24px)!important;max-width:calc(100% - 24px)!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:10px 12px!important;}
  .journal-top-card-row>.journal-checkin-card,.journal-top-card-row>.journal-reset-card{min-height:110px!important;}
  .memory-search-section,.journal-recent-list-section{display:block!important;}
  .memory-search-section{padding:8px 12px!important;border-bottom:0!important;}
  .memory-search-input{min-height:38px!important;border-radius:14px!important;font-size:12px!important;padding:9px 11px!important;}
  .journal-recent-list-section{padding:2px 12px 10px!important;}
  .journal-recent-list-section .journal-entries-title{font-size:12px!important;margin:6px 0 8px!important;}
  .journal-recent-list-section .journal-entry-card{padding:8px!important;border-radius:14px!important;margin-bottom:7px!important;}
  .journal-recent-list-section .jec-cover,.journal-recent-list-section .jec-emoji{width:38px!important;height:38px!important;}
  .journal-recent-list-section .jec-note,.journal-recent-list-section .jec-gratitude,.journal-recent-list-section .jec-tags{display:none!important;}
  .habits-page .phase-hero{position:relative!important;top:auto!important;z-index:auto!important;background:linear-gradient(135deg,var(--bg2),var(--bg4))!important;}
  .bloom-room-page{gap:10px!important;}
  .bloom-card-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
  .bloom-card-row .game-soft-card,.bloom-card-row .checkin-rhythm-card,.bloom-card-row .affirmation-rhythm-card,.bloom-card-row .tomorrow-reset-rhythm-card,.bloom-card-row .weekly-reset-rhythm-card{padding:10px!important;border-radius:16px!important;}
  .checkin-rhythm-current .big-emoji{width:30px!important;height:30px!important;flex-basis:30px!important;font-size:21px!important;}
  .streak-grid-five{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;}
  .streak-garden-pill{padding:8px 3px!important;border-radius:12px!important;}
  .streak-garden-pill span{font-size:15px!important;}
  .streak-garden-pill strong{font-size:12px!important;}
  .streak-garden-pill small{font-size:7.5px!important;letter-spacing:-.1px!important;}
}



/* ── Pre Phase 22 final requested cleanup 3 ─────────────────────────────── */
.sidebar-user{margin-top:8px!important;margin-bottom:8px!important;display:block!important;}
.sidebar-sync-under-user{gap:9px!important;margin-top:8px!important;margin-bottom:12px!important;align-items:flex-start!important;}
.sidebar-sync-under-user .sync-pill{margin-top:0!important;}
.sidebar-sync-now-btn{min-height:32px!important;padding:7px 12px!important;border-radius:999px!important;}
.today-top3-card .today-empty-sugar{flex:1!important;min-height:180px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;border:0!important;background:transparent!important;box-shadow:none!important;}
.today-top3-card .today-empty-sugar img{width:96px!important;height:96px!important;object-fit:contain!important;}
.today-top3-card .today-empty-sugar strong{font-size:13px!important;line-height:1.35!important;max-width:280px!important;}
.weekly-reset-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:16px!important;align-items:start!important;}
.weekly-review-panel{grid-column:1 / -1!important;}
.weekly-priority-panel,.weekly-clear-panel{grid-column:auto!important;min-width:0!important;}
.rhythm-type-stats-row,.rhythm-life-category-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:16px!important;align-items:stretch!important;}
.rhythm-type-stats-row>*{height:100%!important;min-width:0!important;}
.rhythm-life-category-row>*{height:100%!important;min-width:0!important;}
.rhythm-category-panel{margin:0!important;}
.rhythm-life-category-row .life-garden-card{margin:0!important;}
.journal-top-card-row{display:none!important;}
@media(max-width:980px){
  .weekly-reset-grid,.rhythm-type-stats-row,.rhythm-life-category-row{grid-template-columns:1fr!important;}
}
@media(max-width:768px){
  .sidebar-user{margin-bottom:10px!important;}
  .sidebar-sync-under-user{gap:10px!important;margin-bottom:14px!important;}
  .today-top3-card .today-empty-sugar{min-height:136px!important;}
  .today-top3-card .today-empty-sugar img{width:74px!important;height:74px!important;}
}


/* ── Pre Phase 22 final cleanup 4: phone/header/sync polish ─────────────── */
.today-top3-card{display:flex!important;flex-direction:column!important;}
.today-top3-card .today-empty-sugar{
  flex:1 1 auto!important;
  min-height:220px!important;
  width:100%!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:10px!important;
  padding:18px 12px!important;
  margin:0!important;
  text-align:center!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
}
.today-top3-card .today-empty-sugar img{
  width:88px!important;
  height:88px!important;
  object-fit:contain!important;
  display:block!important;
  margin:0 auto!important;
  flex:0 0 auto!important;
}
.today-top3-card .today-empty-sugar strong{
  display:block!important;
  max-width:260px!important;
  margin:0 auto!important;
  font-size:13px!important;
  line-height:1.35!important;
  text-align:center!important;
}
.sidebar-sync-under-user{
  display:flex!important;
  flex-direction:column!important;
  gap:14px!important;
  margin-top:10px!important;
  margin-bottom:14px!important;
  align-items:flex-start!important;
}
.sidebar-sync-under-user .sync-pill{
  max-width:calc(100% - 2px)!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.sync-pill span:last-child{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;min-width:0!important;}
.sync-debug-panel.collapsed{padding:10px 12px!important;gap:0!important;}
.sync-debug-panel.collapsed .sync-debug-top{margin:0!important;}
.sync-debug-toggle{width:100%;border:0;background:transparent;font:inherit;cursor:pointer;padding:0;text-align:left;}
.journal-reflection-hub{margin-top:16px!important;}
.tempo-loading-page{min-height:100dvh!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;}
.tempo-loading-card{margin:auto!important;transform:translateY(-3vh)!important;}
@media(max-width:768px){
  .journal-page,.rhythm-stats-page,.weekly-reset-page{background:linear-gradient(180deg,var(--bg),var(--bg3))!important;}
  .journal-page .journal-header,
  .rhythm-stats-page .phase-hero,
  .weekly-reset-page .phase-hero{
    background:var(--surface)!important;
    background-color:var(--surface)!important;
    opacity:1!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
    box-shadow:0 1px 0 rgba(var(--accent-rgb),.14),0 10px 22px rgba(116,78,60,.06)!important;
    z-index:120!important;
    isolation:isolate!important;
  }
  .journal-page .journal-header::before,
  .rhythm-stats-page .phase-hero::before,
  .weekly-reset-page .phase-hero::before{
    content:""!important;
    position:absolute!important;
    inset:0!important;
    background:var(--surface)!important;
    border-radius:inherit!important;
    z-index:-1!important;
  }
  .mobile-sync-strip .sync-pill{
    max-width:180px!important;
    min-height:34px!important;
    padding:7px 10px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  .mobile-sync-strip .sync-pill.sync-pending{max-width:164px!important;}
  .mobile-sync-strip .sync-pill span:last-child{max-width:124px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
  .today-top3-card .today-empty-sugar{min-height:180px!important;gap:8px!important;}
  .today-top3-card .today-empty-sugar img{width:76px!important;height:76px!important;}
  .today-top3-card .today-empty-sugar strong{max-width:230px!important;font-size:12px!important;}
  .tempo-loading-card{transform:translateY(-5vh)!important;}
}


/* ── Pre Phase 22 debug 5: memory modal, mobile journal, sidebar sync, empty tasks ── */
.journal-header{justify-content:space-between!important;align-items:center!important;}
.journal-header-main{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto;}
.journal-header-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
.memory-settings-btn{pointer-events:auto!important;position:relative!important;z-index:3!important;}
.memory-entry-overlay,.memory-settings-overlay{z-index:2600!important;}
.memory-entry-modal .entry-modal-body,.memory-settings-modal .entry-modal-body{overscroll-behavior:contain!important;}
.sidebar-date{padding-bottom:10px!important;}
.sidebar-sync-under-user{gap:12px!important;margin-bottom:6px!important;}
.sidebar-sync-under-user .sync-pill{max-width:calc(100% - 4px)!important;}
.today-top3-card .today-empty-sugar img{width:112px!important;height:112px!important;}
.today-top3-card .today-empty-sugar{min-height:230px!important;}

@media(max-width:768px){
  .journal-header{gap:8px!important;align-items:center!important;}
  .journal-header-main{flex-direction:column!important;align-items:flex-start!important;gap:2px!important;min-width:0!important;}
  .journal-header-actions{gap:6px!important;flex-shrink:0!important;}
  .journal-header-actions .journal-today-btn{min-height:34px!important;padding:7px 8px!important;font-size:10px!important;white-space:nowrap!important;}
  .memory-entry-overlay,.memory-settings-overlay{
    inset:0 0 var(--mobile-nav-h) 0!important;
    padding:8px 8px 10px!important;
    align-items:center!important;
    justify-content:center!important;
    overflow:hidden!important;
  }
  .memory-entry-overlay .entry-modal.memory-entry-modal,
  .memory-settings-overlay .entry-modal.memory-settings-modal{
    width:calc(100vw - 16px)!important;
    max-width:calc(100vw - 16px)!important;
    height:calc(100dvh - var(--mobile-nav-h) - 20px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h) - 20px)!important;
    margin:0!important;
    overflow:hidden!important;
    display:flex!important;
    flex-direction:column!important;
  }
  .memory-entry-modal .entry-modal-header,.memory-settings-modal .entry-modal-header{padding:12px 14px 10px!important;}
  .memory-entry-modal .entry-modal-body,.memory-settings-modal .entry-modal-body{
    flex:1 1 auto!important;
    min-height:0!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    padding-bottom:16px!important;
  }
  .memory-entry-modal .entry-modal-footer,.memory-settings-modal .entry-modal-footer{
    position:sticky!important;
    bottom:0!important;
    z-index:20!important;
    padding:10px 12px calc(12px + env(safe-area-inset-bottom))!important;
    background:var(--surface-soft,var(--bg3))!important;
    border-top:1px solid var(--border)!important;
  }
  .memory-entry-modal .entry-modal-footer{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
  .memory-entry-modal .entry-modal-footer button{width:100%!important;min-height:42px!important;}
  .sidebar-date{padding-bottom:8px!important;}
  .sidebar-sync-under-user{gap:9px!important;margin-bottom:4px!important;}
  .today-top3-card .today-empty-sugar{min-height:190px!important;}
  .today-top3-card .today-empty-sugar img{width:92px!important;height:92px!important;}
}

`}</style>

      <div className="app">
        <div className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-logo"><div className="logo-icon">🌸</div><span>Tempo</span></div>
          <div className="sidebar-date">
            <div className="date-big">{TODAY.getDate()}</div>
            {formatWithDisplayTimezone(TODAY, { weekday: "long", month: "long", year: "numeric" })}
            {auth.user && <div className="sidebar-user">👤 {auth.user.name || auth.user.email}</div>}
            <div className="sidebar-sync-under-user">
              <button type="button" className="sidebar-sync-now-btn" onClick={forceSyncNow}>↻ Sync now</button>
              <SyncStatusPill syncStatus={syncStatus} onRetry={forceSyncNow} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} />
            </div>
          </div>
          {(() => { const todayCheckIn = dailyCheckInForDate(dailyCheckIns, TODAY); const m = todayCheckIn?.mood ? DAILY_CHECKIN_MOODS.find(x=>x.id===todayCheckIn.mood) : null; const e = todayCheckIn?.energy ? DAILY_CHECKIN_ENERGIES.find(x=>x.id===todayCheckIn.energy) : null; return m ? <div className="mood-bar" onClick={() => { setShowCheckIn(true); closeSidebarOnMobile(); }} style={{cursor:"pointer"}}>{m.emoji} Feeling {m.label}{e ? ` · ${e.label} energy` : ""}</div> : null; })()}
          <nav className="sidebar-nav">
            <div className="nav-section-label">Main</div>
            <div className={`nav-item ${page==="today"?"active":""}`} onClick={() => { setPage("today"); closeSidebarOnMobile(); }}><span className="nav-icon">🌤️</span>Today</div>
            <div className={`nav-item ${page==="calendar"?"active":""}`} onClick={() => { setPage("calendar"); closeSidebarOnMobile(); }}><span className="nav-icon">🗓️</span>Calendar</div>
            <div className={`nav-item ${page==="tasks"?"active":""}`} onClick={() => { setPage("tasks"); closeSidebarOnMobile(); }}><span className="nav-icon">✅</span>Tasks</div>
            <div className="nav-section-label" style={{marginTop:8}}>Planning</div>
            <div className="nav-item desktop-hidden-menu-item" onClick={() => { setDayPlan(buildDailyPlan(TODAY)); closeSidebarOnMobile(); }}><span className="nav-icon">✨</span>Plan Today</div>
            <div className={`nav-item ${page==="tomorrow-reset"?"active":""}`} onClick={() => { setPage("tomorrow-reset"); closeSidebarOnMobile(); }}><span className="nav-icon">🌙</span>Tomorrow Reset</div>
            <div className={`nav-item ${page==="weekly-reset"?"active":""}`} onClick={() => { setPage("weekly-reset"); closeSidebarOnMobile(); }}><span className="nav-icon">🧺</span>Weekly Reset</div>
            <div className="nav-section-label" style={{marginTop:8}}>Personal</div>
            <div className={`nav-item ${page==="habits"?"active":""}`} onClick={() => { setPage("habits"); closeSidebarOnMobile(); }}><span className="nav-icon">🌱</span>Habits</div>
            <div className={`nav-item ${page==="journal"?"active":""}`} onClick={() => { setPage("journal"); closeSidebarOnMobile(); }}><span className="nav-icon">📔</span>Journal</div>
            <div className={`nav-item ${page==="rhythm"?"active":""}`} onClick={() => { setPage("rhythm"); closeSidebarOnMobile(); }}><span className="nav-icon">📊</span>Rhythm Stats</div>
            <div className="nav-item" onClick={() => { setSettingsOpen(true); closeSidebarOnMobile(); }}><span className="nav-icon">⚙️</span>Settings</div>
          </nav>
          <div className="sidebar-cals">
            <div className="cal-label-row">
              <span className="cal-label">My Calendars</span>
              <button type="button" className="cal-add-btn" onClick={addCalendar} title="Create calendar">＋</button>
            </div>
            {calendars.map(c => {
              const hidden = hiddenCals.includes(c.id);
              return (
                <div key={c.id} className={`cal-item cal-toggleable ${hidden ? "cal-hidden" : ""}`} title={hidden ? "Hidden" : "Visible"}>
                  <button type="button" className="cal-visible-btn" onClick={() => toggleCalVisibility(c.id)} title={hidden ? "Show calendar" : "Hide calendar"}>
                    <span className="cal-dot" style={{ background: hidden ? "var(--border)" : c.color }} />
                    <span className="cal-eye">{hidden ? "○" : "●"}</span>
                  </button>
                  <span className="cal-name" onClick={() => toggleCalVisibility(c.id)}>{c.id === "work" && !c.name ? (auth.user?.email ?? c.name) : c.name}</span>
                  <button type="button" className="cal-action-btn" onClick={() => editCalendar(c)} title="Rename/edit calendar">✎</button>
                  <button type="button" className="cal-action-btn" onClick={() => removeCalendar(c)} title="Remove calendar">×</button>
                </div>
              );
            })}
          </div>
        </div>
        <button type="button" className={`mobile-sidebar-scrim ${sidebarOpen ? "open" : ""}`} aria-label="Close menu" onClick={() => setSidebarOpen(false)} />

        <div className="main">
          {page === "today" ? (
            <TodayLitePage summary={dailyStartupSummary} events={todayDashboardEvents} tasks={tasks} journal={journal} dailyCheckIns={dailyCheckIns} affirmations={affirmations} categories={categories} habits={habits} habitCompletions={habitCompletions} onOpenCalendar={() => setPage("calendar")} onOpenTasks={() => setPage("tasks")} onOpenJournal={() => setPage("journal")} onOpenCheckIn={() => setShowCheckIn(true)} onOpenHabits={() => setPage("habits")} onPlanToday={() => setDayPlan(buildDailyPlan(TODAY))} onTomorrowReset={() => setPage("tomorrow-reset")} onToggleHabit={toggleHabitToday} onIncrementHabit={incrementHabitToday} onToggleTask={toggleTask} onEditTask={setSelectedTask} />
          ) : page === "journal" ? (
            <JournalPage journal={journal} setJournal={setJournal} onSaveMemoryEntry={saveMemoryEntry} events={gameEvents} tasks={tasks} dailyCheckIns={dailyCheckIns} tomorrowResets={tomorrowResets} weeklyResets={weeklyResets} onOpenCheckIn={() => setShowCheckIn(true)} activitiesCatalog={journalActivities} memoryTagsCatalog={memoryTags} onAddActivity={addJournalActivity} onUpdateActivity={updateJournalActivity} onDeleteActivity={deleteJournalActivity} onAddMemoryTag={addMemoryTag} onUpdateMemoryTag={updateMemoryTag} onDeleteMemoryTag={deleteMemoryTag} onReorderActivities={reorderJournalActivities} userId={auth.user?.id} onMemoryStorageMigrated={markMemoryStorageMigrated} quickEditDate={quickMemoryDate} onQuickEditHandled={() => setQuickMemoryDate(null)} />
          ) : page === "tasks" ? (
            <TasksPage tasks={tasks} categories={categories} onToggle={toggleTask} onAdd={addTask} onEdit={setSelectedTask} onScheduleTask={setScheduleTaskTarget} scope={taskScope} setScope={setTaskScope} periodDate={taskPeriodDate} setPeriodDate={setTaskPeriodDate} onMoveTaskPeriod={moveTaskToPeriod} gameStats={gameStats} />
          ) : page === "habits" ? (
            <HabitsPage habits={habits} completions={habitCompletions} onAdd={addHabit} onEdit={editHabit} onDelete={deleteHabit} onArchive={archiveHabit} onToggle={toggleHabitToday} onIncrement={incrementHabitToday} />
          ) : page === "rhythm" ? (
            <RhythmStatsPage events={visibleEvents} tasks={tasks} habits={habits} habitCompletions={habitCompletions} journal={journal} dailyCheckIns={dailyCheckIns} tomorrowResets={tomorrowResets} weeklyResets={weeklyResets} categories={categories} gameStats={gameStats} />
          ) : page === "tomorrow-reset" ? (
            <TomorrowResetPage tasks={tasks.filter(t => taskFallsOnDateForReset(t, TODAY))} latestReset={tomorrowResetForDate(tomorrowResets, TODAY)} gameStats={gameStats} onCompleteReset={saveTomorrowReset} onBack={() => setPage("today")} />
          ) : page === "weekly-reset" ? (
            <WeeklyResetPage tasks={tasks} events={visibleEvents} habits={habits} dailyCheckIns={dailyCheckIns} latestReset={weeklyResetForDate(weeklyResets, TODAY)} onCompleteReset={saveWeeklyReset} />
          ) : (<>
          <div className="topbar">
            <button className="topbar-btn icon-only desktop-sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">☰</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => {
              const d = new Date(viewDate);
              if (view === "day")   d.setDate(d.getDate() - 1);
              if (view === "week")  d.setDate(d.getDate() - 7);
              if (view === "month") d.setMonth(d.getMonth() - 1);
              setViewDate(d);
            }} aria-label="Previous">‹</button>
            <button className="topbar-btn today-btn" onClick={() => setViewDate(new Date(TODAY))}>Today</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => {
              const d = new Date(viewDate);
              if (view === "day")   d.setDate(d.getDate() + 1);
              if (view === "week")  d.setDate(d.getDate() + 7);
              if (view === "month") d.setMonth(d.getMonth() + 1);
              setViewDate(d);
            }} aria-label="Next">›</button>
            <div className="topbar-date">
              {view === "day" ? fmtDate(viewDate) : view === "week" ? (() => {
                const mon = new Date(viewDate); mon.setDate(viewDate.getDate() - viewDate.getDay() + 1);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                return `${formatWithDisplayTimezone(mon,{month:"short",day:"numeric"})} – ${formatWithDisplayTimezone(sun,{month:"short",day:"numeric"})}`;
              })() : formatWithDisplayTimezone(viewDate,{month:"long",year:"numeric"})}
              {view === "day" && viewDate.toDateString() === TODAY.toDateString() && <span className="today-badge">{viewDayEvents.length} events</span>}
            </div>
            <div className="view-tabs">
              {["day","week","month"].map(v => <button key={v} className={`view-tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
            </div>
            <SyncStatusPill syncStatus={syncStatus} onRetry={forceSyncNow} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} />
            <button className="topbar-btn sync-now-btn" onClick={forceSyncNow}>↻ Sync</button>
            <button className="topbar-btn plan-day-btn" onClick={() => setDayPlan(buildDailyPlan(TODAY))}>✨ Plan Today</button>
            <button className="topbar-btn" onClick={() => setShowSearch(true)} aria-label="Search" title="Search (/)">🔍</button>
            <button className="topbar-btn" onClick={() => setShowTemplates(true)} aria-label="Day templates">🗂 Templates</button>
            <button className="topbar-btn icon-only keyboard-shortcuts-btn" onClick={() => setShowShortcuts(true)} aria-label="Keyboard shortcuts">⌨️</button>
          </div>

          <div className="stats-bar">
            <div className="stat"><div className="stat-dot" style={{ background: "#B08AE0" }} />Important: {Math.round(viewDayEvents.filter(e => Core.categoryIs(e.category, "important")).reduce((a, e) => a + (e.end - e.start) / 60000, 0) / 60 * 10) / 10}h</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#FF7BAC" }} />{openToday} tasks open</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#70C8A0" }} />Free blocks: {freeBlocks(visibleEvents, viewDate).length}</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#FFB870" }} />🔥 {gameStats.streaks.productive}d streak</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#C9A0FF" }} />Gentle rhythm</div>
          </div>

          <div className="content-area">
            <div className={`calendar-pane view-${view}`}>
              {view === "day" && <DayView events={viewDayEvents} calendars={calendars} categories={categories} onReschedule={reschedule} onEventClick={setSelectedEvent} onDropTask={addEvent} viewDate={viewDate} onGridClick={d => handleCalendarSlotClick(d)} />}
              {view === "week" && <WeekView events={visibleEvents} calendars={calendars} categories={categories} onEventClick={setSelectedEvent} onReschedule={reschedule} viewDate={viewDate} onGridClick={d => handleCalendarSlotClick(d)} onDayClick={d => { setViewDate(d); setView("day"); }} />}
              {view === "month" && (() => {
                const days = monthDays(viewDate);

                // Compute max events in any single day this month for heat map normalisation
                const dayCounts = days.filter(Boolean).map(d =>
                  visibleEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, d)).length
                );
                const maxCount = Math.max(...dayCounts, 1);

                return (
                  <div className="month-view">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="month-header">{d}</div>)}
                    {days.map((day, i) => {
                      const de = day ? visibleEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, day)).map(e => eventSegmentForDay(e, day)) : [];
                      const isT = day && sameDay(day, TODAY);
                      const heat = day ? de.length / maxCount : 0; // 0–1
                      // Heat map: tint the active theme accent colour at low opacity
                      const heatBg = heat > 0.05 ? `rgba(var(--accent-rgb,255,123,172),${(heat * 0.22).toFixed(2)})` : undefined;
                      return (
                        <div key={i} data-month-date={day ? dateKey(day) : ""} className={`month-day ${!day ? "other" : ""} ${isT ? "today-cell" : ""}`}
                          style={heatBg ? { background: heatBg } : {}}
                          onClick={() => { if (!day) return; if (copiedEvent) { pasteCopiedEvent(day, { useSourceTime: true }); return; } setViewDate(day); setView("day"); }}>
                          {day && <div className="month-day-num">{isT ? <span className="today-circle">{day.getDate()}</span> : day.getDate()}</div>}
                          {heat > 0.6 && day && <div className="month-heat-bar" style={{ width: `${Math.round(heat * 100)}%` }} />}
                          <div className="month-day-events">
                            {de.slice(0, 4).map(e => {
                              const cal = calendars.find(c => c.id === e.calendar);
                              const color = e.color || cal?.color || "#FF7BAC";
                              return (
                                <MonthEventRow key={e.id} event={e} color={color} onOpen={setSelectedEvent} onReschedule={reschedule} />
                              );
                            })}
                            {de.length > 4 && <div className="month-more">+{de.length - 4} more</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <TaskPanel tasks={tasks} categories={categories} onToggle={toggleTask} onAdd={addTask} onEdit={setSelectedTask} onScheduleTask={setScheduleTaskTarget} scope={taskScope} setScope={setTaskScope} periodDate={taskPeriodDate} setPeriodDate={setTaskPeriodDate} mobileOpen={mobileTasksOpen} onMobileClose={() => setMobileTasksOpen(false)} />
          </div>
        </>)}
        </div>
      </div>

      {undoStack.length > 0 && <button className="undo-btn" onClick={undo}>↩ Undo <kbd>⌘Z</kbd></button>}
      {copiedEvent && (
        <div className="event-copy-bar">
          <span className="event-copy-icon">📋</span>
          <span className="event-copy-text">Copied: <strong>{copiedEvent.title}</strong>. Click any empty slot to paste multiple times, then Clear when done.</span>
          <button className="event-copy-clear" onClick={() => setCopiedEvent(null)}>Clear</button>
        </div>
      )}

      {showStartup && <DailyStartupModal summary={dailyStartupSummary} onClose={() => { save(`${uk}_startup_seen_${dateKey(TODAY)}`, true); setShowStartup(false); }} onPlanDay={() => { save(`${uk}_startup_seen_${dateKey(TODAY)}`, true); setShowStartup(false); setDayPlan(buildDailyPlan(TODAY)); }} />}
      {showCheckIn && <DailyCheckInModal date={TODAY} checkIn={dailyCheckInForDate(dailyCheckIns, TODAY)} onSave={saveDailyCheckIn} onClose={() => setShowCheckIn(false)} />}
      {showSearch && <SearchModal events={expandedEvents} tasks={tasks} categories={categories} onClose={() => setShowSearch(false)} onEventClick={setSelectedEvent} onTaskEdit={setSelectedTask} onNavigate={d => { setViewDate(new Date(d)); setView("day"); }} />}
      {quickAddDate  && <AddEventModal onClose={() => setQuickAddDate(null)} onSave={async ev => { const placed = await addEvent(ev); if (placed) setQuickAddDate(null); return placed; }} defaultDate={quickAddDate} calendars={calendars} categories={categories} />}
      {selectedEvent && <EventModal event={selectedEvent} calendars={calendars} categories={categories} onClose={() => setSelectedEvent(null)} onSave={saveEvent} onDelete={deleteEvent} onCopy={copyEventForPaste} />}
      {selectedTask && <TaskModal task={selectedTask} categories={categories} onClose={() => setSelectedTask(null)} onSave={task => { selectedTask._isNew ? addTask({ ...task, _isNew: undefined }) : saveTask(task); setSelectedTask(null); }} onDelete={selectedTask._isNew ? null : deleteTask} />}
      <EventConflictModal />
      <RecurringTaskScopeModal />
      <TaskRescheduleDateModal />
      {scheduleTaskTarget && <TaskScheduleModal task={scheduleTaskTarget} workStart={workStart} workEnd={workEnd} onClose={() => setScheduleTaskTarget(null)} onSchedule={(mode) => scheduleTaskIntoCalendar(scheduleTaskTarget, mode)} />}
      {dayPlan && <DailyPlanModal plan={dayPlan} mealBreaks={mealBreaks} planningRules={planningRules} onClose={() => setDayPlan(null)} onApply={applyDayPlan} onRegenerate={regenerateDayPlan} onMoveRemaining={movePlanRemainingToTomorrow} onMoveRemainingToWeek={movePlanRemainingToThisWeek} onSkipLowPriority={skipLowPriorityInDayPlan} />}
      {/* Tomorrow Reset now lives as a full Planning page instead of a popup. */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} onComplete={completeOnboarding} workStart={workStart} workEnd={workEnd} notificationPreferences={notificationPreferences} />}
            {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} workStart={workStart} setWorkStart={setWorkStart} workEnd={workEnd} setWorkEnd={setWorkEnd} mealBreaks={mealBreaks} setMealBreaks={setMealBreaks} planningRules={planningRules} setPlanningRules={setPlanningRules} notifs={notifs} setNotifs={setNotifs} pushEnabled={pushEnabled} setPushEnabled={setPushEnabled} notificationPreferences={notificationPreferences} setNotificationPreferences={setNotificationPreferences} onEnableClosedPush={enableClosedPushNotifications} timezone={timezone} setTimezone={setTimezone} categories={categories} setCategories={setCategories} user={auth.user} onSignOut={auth.signOut} gameStats={gameStats} onForceSync={forceSyncNow} syncStatus={syncStatus} syncDebug={syncDebug} onRestartOnboarding={restartOnboarding} />}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)} role="dialog" aria-modal="true" aria-label="Day templates">
          <div className="templates-panel" onClick={e => e.stopPropagation()}>
            <div className="templates-header"><span className="templates-title">🗂 Day Templates</span><button className="modal-close" onClick={() => setShowTemplates(false)}>✕</button></div>
            <div className="templates-desc">Apply a schedule pattern to the selected day, or save this day as a reusable template.</div>
            <button className="tf-save" style={{width:"100%",marginBottom:10}} onClick={saveCurrentDayAsTemplate}>Save current day as template</button>
            {templates.map(tpl => (
              <div key={tpl.id} className="template-btn" style={{cursor:"default"}}>
                <input className="tf-input" value={tpl.label} onChange={e => updateTemplate(tpl.id, { label: e.target.value })} />
                <div className="tpl-events">{tpl.events.map(e => e.title).join(" · ")}</div>
                <div className="tf-actions" style={{marginTop:8}}>
                  <button className="tf-cancel" onClick={() => deleteTemplate(tpl.id)}>Delete</button>
                  <button className="tf-save" onClick={() => applyTemplate(tpl)}>Apply</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chatOpen && <ChatPanel events={events} tasks={tasks} onClose={() => setChatOpen(false)} onUpdateEvents={setEvents} onUpdateTasks={setTasks} onAddEvent={addEvent} />}
      <RecurrenceScopeModal />

      {/* Mobile bottom nav — visible only on small screens */}
      {((syncStatus?.status && syncStatus.status !== "saved") || pendingLocalChanges > 0) && (
        <div className="mobile-sync-strip"><SyncStatusPill syncStatus={syncStatus} onRetry={forceSyncNow} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} /></div>
      )}

      <div className="mobile-nav" role="navigation" aria-label="Mobile primary navigation">
        <button className={`mobile-nav-btn ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(v => !v)}>☰<span>Menu</span></button>
        <button className={`mobile-nav-btn ${page === "today" ? "active" : ""}`} onClick={() => { setPage("today"); setSidebarOpen(false); }}>🌤️<span>Today</span></button>
        <button className={`mobile-nav-btn ${page === "calendar" ? "active" : ""}`} onClick={() => { setPage("calendar"); setView("day"); setSidebarOpen(false); }}>🗓️<span>Calendar</span></button>
        <button className={`mobile-nav-btn ${page === "tasks" ? "active" : ""}`} onClick={() => { setPage("tasks"); setTaskScope("day"); setSidebarOpen(false); }}>✅<span>Tasks</span></button>
        <button className={`mobile-nav-btn ${page === "journal" ? "active" : ""}`} onClick={() => { setPage("journal"); setSidebarOpen(false); }}>📔<span>Journal</span></button>
        <button className={`mobile-nav-btn ${page === "habits" ? "active" : ""}`} onClick={() => { setPage("habits"); setSidebarOpen(false); }}>🌱<span>Habits</span></button>
      </div>

      {toast && <div className="tempo-toast" onAnimationEnd={() => setToast(null)}>{typeof toast === "string" ? toast : toast.text}</div>}
      <button className="chat-fab" onClick={() => setChatOpen(v => !v)}>{chatOpen ? "✕" : "🌸"}</button>
    </>
  );
}

// ─── CSS (split into login + app for clarity) ─────────────────────────────────
const loginCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inconsolata:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Nunito',sans-serif;background:#FFF0F6;overflow:hidden;}

  /* ── Page & background ─────────────────────────────────────────────────────── */
  .login-page{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    position:relative;overflow:hidden;
    background:linear-gradient(145deg,#FFF0F8 0%,#F5EEFF 45%,#EEF5FF 100%);
  }

  /* ── Blobs ──────────────────────────────────────────────────────────────────── */
  .login-bg-blobs{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
  .blob{position:absolute;border-radius:50%;filter:blur(72px);}
  .blob-1{width:560px;height:560px;background:radial-gradient(circle,#FFB8D4,#FFD6E8);opacity:.40;top:-160px;left:-160px;animation:blobFloat 9s ease-in-out infinite;}
  .blob-2{width:460px;height:460px;background:radial-gradient(circle,#D4AAFF,#C0CCFF);opacity:.35;bottom:-120px;right:-100px;animation:blobFloat 11s ease-in-out infinite reverse;}
  .blob-3{width:340px;height:340px;background:radial-gradient(circle,#A8E8FF,#B8F0E8);opacity:.30;top:38%;left:48%;transform:translate(-50%,-50%);animation:blobFloat 13s ease-in-out infinite 1.5s;}
  .blob-4{width:200px;height:200px;background:radial-gradient(circle,#FFE0A8,#FFD0C0);opacity:.28;top:10%;right:12%;animation:blobFloat 7s ease-in-out infinite 3s;}
  @keyframes blobFloat{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-28px) scale(1.05);}}

  /* ── Floating deco emojis ───────────────────────────────────────────────────── */
  .login-deco{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
  .deco{position:absolute;font-size:22px;animation:decoFloat 6s ease-in-out infinite;user-select:none;opacity:.70;}
  .deco-1{top:8%;  left:6%;  animation-duration:7s;  animation-delay:0s;}
  .deco-2{top:14%; right:8%; animation-duration:5.5s;animation-delay:.8s;font-size:18px;}
  .deco-3{top:72%; left:4%;  animation-duration:8s;  animation-delay:1.2s;}
  .deco-4{top:20%; left:42%; animation-duration:6.5s;animation-delay:2s;  font-size:16px;}
  .deco-5{bottom:18%;right:5%;animation-duration:7.5s;animation-delay:.4s;}
  .deco-6{bottom:10%;left:10%;animation-duration:6s; animation-delay:1.8s;font-size:20px;}
  .deco-7{top:50%; right:3%; animation-duration:9s;  animation-delay:.2s; font-size:16px;}
  .deco-8{bottom:28%;left:46%;animation-duration:5s; animation-delay:2.5s;font-size:18px;}
  @keyframes decoFloat{0%,100%{transform:translateY(0) rotate(0deg);}33%{transform:translateY(-12px) rotate(6deg);}66%{transform:translateY(-6px) rotate(-4deg);}}

  /* ── Card ───────────────────────────────────────────────────────────────────── */
  .login-card{
    position:relative;z-index:1;width:100%;max-width:430px;margin:20px;
    background:rgba(255,255,255,0.82);backdrop-filter:blur(28px) saturate(1.4);
    border:1.5px solid rgba(255,182,214,0.45);
    border-radius:32px;
    padding:32px 30px 28px;
    box-shadow:
      0 32px 80px rgba(255,123,172,0.18),
      0 8px 24px rgba(180,120,200,0.10),
      0 2px 0 rgba(255,255,255,0.90) inset;
    animation:cardPop .5s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes cardPop{from{opacity:0;transform:translateY(24px) scale(.96);}to{opacity:1;transform:none;}}

  /* ── Hero / mascot ──────────────────────────────────────────────────────────── */
  .login-hero{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px;}
  .login-mascot{position:relative;width:76px;height:76px;display:flex;align-items:center;justify-content:center;margin-bottom:2px;}
  .mascot-ring{position:absolute;border-radius:50%;}
  .mascot-ring-outer{inset:0;background:linear-gradient(135deg,#FFD6E8,#E8C8FF,#C8E8FF);opacity:.55;animation:ringPulse 3s ease-in-out infinite;}
  .mascot-ring-inner{inset:8px;background:linear-gradient(135deg,#FFC0D8,#D8B0FF);opacity:.70;animation:ringPulse 3s ease-in-out infinite .6s;}
  @keyframes ringPulse{0%,100%{transform:scale(1);opacity:.55;}50%{transform:scale(1.08);opacity:.80;}}
  .mascot-icon{position:relative;z-index:1;font-size:34px;filter:drop-shadow(0 4px 10px rgba(255,123,172,.45));animation:mascotBounce 2.4s ease-in-out infinite;}
  @keyframes mascotBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
  .login-brand{display:flex;align-items:center;gap:8px;}
  .login-logo-text{font-size:28px;font-weight:900;background:linear-gradient(135deg,#FF7BAC 0%,#C060C8 60%,#8080E0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px;}
  .login-logo-badge{font-size:10px;font-weight:800;background:linear-gradient(135deg,#FFD6E8,#E8C8FF);color:#9060A0;border-radius:20px;padding:3px 8px;border:1px solid rgba(255,182,214,.5);}
  .login-tagline{font-size:13.5px;color:#9070A0;font-weight:700;text-align:center;line-height:1.55;}

  /* ── Feature pills ──────────────────────────────────────────────────────────── */
  .login-pills{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
  .login-pill{
    font-size:11px;font-weight:800;color:#A070B0;
    background:linear-gradient(135deg,rgba(255,214,232,.6),rgba(232,200,255,.6));
    border:1px solid rgba(255,182,214,.5);
    border-radius:20px;padding:5px 11px;
    backdrop-filter:blur(8px);
    white-space:nowrap;
  }

  /* ── Tabs ───────────────────────────────────────────────────────────────────── */
  .login-tabs{display:flex;gap:4px;background:rgba(255,232,240,.8);padding:4px;border-radius:16px;margin-bottom:20px;border:1px solid rgba(255,182,214,.35);}
  .login-tab{flex:1;padding:9px;border-radius:12px;border:none;background:transparent;font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;color:#B090B0;cursor:pointer;transition:all .2s;}
  .login-tab.active{background:white;color:#FF7BAC;box-shadow:0 3px 12px rgba(255,123,172,.22),0 1px 0 rgba(255,255,255,.9) inset;}

  /* ── Form fields ────────────────────────────────────────────────────────────── */
  .login-form{display:flex;flex-direction:column;gap:13px;margin-bottom:14px;}
  .login-field{display:flex;flex-direction:column;gap:5px;}
  .login-field label{font-size:11.5px;font-weight:800;color:#A080B0;display:flex;align-items:center;gap:5px;}
  .field-icon{font-size:13px;}
  .login-field input{
    background:rgba(255,245,250,.9);border:1.5px solid #F0C8DC;
    border-radius:14px;padding:12px 15px;
    font-family:'Nunito',sans-serif;font-size:14px;color:#4A2840;font-weight:600;
    outline:none;transition:border-color .18s,background .18s,box-shadow .18s;
  }
  .login-field input:focus{border-color:#FF7BAC;background:white;box-shadow:0 0 0 4px rgba(255,123,172,.12);}
  .login-field input::placeholder{color:#C8A0BC;}
  .pass-wrap{position:relative;}
  .pass-wrap input{width:100%;padding-right:46px;}
  .pass-toggle{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;line-height:1;opacity:.7;transition:opacity .15s;}
  .pass-toggle:hover{opacity:1;}

  /* ── Error ──────────────────────────────────────────────────────────────────── */
  .login-error{
    background:linear-gradient(135deg,rgba(255,230,235,.9),rgba(255,220,240,.9));
    border:1.5px solid rgba(255,160,180,.6);
    border-radius:12px;padding:10px 14px;
    font-size:12.5px;color:#C04060;font-weight:700;
    display:flex;align-items:center;gap:6px;
  }

  /* ── Submit button ──────────────────────────────────────────────────────────── */
  .login-submit{
    padding:14px;margin-top:2px;
    background:linear-gradient(135deg,#FF7BAC 0%,#FF9EC4 50%,#C880E0 100%);
    background-size:200% 200%;animation:gradShift 4s ease infinite;
    border:none;border-radius:16px;color:white;
    font-family:'Nunito',sans-serif;font-size:14.5px;font-weight:900;
    cursor:pointer;
    box-shadow:0 8px 24px rgba(255,123,172,.45),0 2px 0 rgba(255,255,255,.25) inset;
    transition:transform .18s,box-shadow .18s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  @keyframes gradShift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
  .login-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 30px rgba(255,123,172,.55);}
  .login-submit:active:not(:disabled){transform:translateY(0);}
  .login-submit:disabled{opacity:.6;cursor:not-allowed;animation:none;}
  .submit-arrow{font-size:16px;transition:transform .2s;}
  .login-submit:hover .submit-arrow{transform:translateX(3px);}
  .login-spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
  @keyframes spin{to{transform:rotate(360deg);}}

  /* ── Footer ─────────────────────────────────────────────────────────────────── */
  .login-footer{font-size:11px;color:#C0A0C8;text-align:center;font-weight:700;margin-top:4px;letter-spacing:.2px;}

  /* ── Verify banner ──────────────────────────────────────────────────────────── */
  .login-demo{
    width:100%;padding:10px;background:transparent;
    border:1.5px dashed #F0C8DC;border-radius:12px;
    color:#A07090;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;
    cursor:pointer;transition:all .15s;margin-bottom:14px;
  }
  .login-demo:hover{border-color:#FF7BAC;color:#FF7BAC;background:rgba(255,245,250,.8);}
  .verify-banner{text-align:center;padding:8px 0;}
  .verify-icon{font-size:40px;margin-bottom:12px;animation:mascotBounce 2s ease-in-out infinite;}
  .verify-title{font-size:18px;font-weight:900;color:#4A2840;margin-bottom:8px;}
  .verify-body{font-size:13px;color:#A07090;font-weight:600;line-height:1.65;margin-bottom:20px;}

  /* ── Setup banner (kept for compat) ─────────────────────────────────────────── */
  .setup-banner{background:#FFF8E8;border:1.5px solid #FFD870;border-radius:14px;padding:12px 14px;margin-bottom:18px;font-size:12px;}
  .setup-banner-title{font-weight:800;color:#A06000;margin-bottom:4px;}
  .setup-banner-body{color:#806020;line-height:1.5;}
  .setup-banner-body code{background:#FFE890;padding:1px 5px;border-radius:4px;font-family:'Inconsolata',monospace;}

  /* ── Phase 19 login visual rebrand ───────────────────────────────────────── */
  body{background:#FBF4EC;}
  .login-page{background:radial-gradient(circle at 14% 0%,rgba(217,137,162,.16),transparent 34%),linear-gradient(145deg,#FBF4EC 0%,#FFF9F5 48%,#F7EFE9 100%);}
  .blob-1{background:radial-gradient(circle,#F4CFD8,#F8E7E0);opacity:.34;}
  .blob-2{background:radial-gradient(circle,#EAD8D0,#F2EAF7);opacity:.28;}
  .blob-3{background:radial-gradient(circle,#EAF6EF,#FFF9F5);opacity:.25;}
  .login-card{background:#FFFFFF;border:1px solid rgba(217,137,162,.20);box-shadow:0 30px 80px rgba(116,78,60,.12),0 1px 0 rgba(255,255,255,.9) inset;}
  .mascot-ring-outer{background:linear-gradient(135deg,#F8E7E0,#F4CFD8,#FFF9F5);}
  .mascot-ring-inner{background:linear-gradient(135deg,#EAB4C2,#F8E7E0);}
  .login-logo-text{background:linear-gradient(135deg,#D989A2 0%,#B98277 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .login-logo-badge,.login-pill,.login-tabs{background:#FFF9F5;border-color:rgba(217,137,162,.20);color:#7A5F54;}
  .login-tagline,.login-field label,.login-footer,.verify-body{color:#7A5F54;}
  .login-tab{color:#A88D82;}.login-tab.active{color:#D989A2;box-shadow:0 6px 16px rgba(116,78,60,.08);}
  .login-field input{background:#FFFDFB;border-color:#EEDDD2;color:#46342D;}
  .login-field input:focus{border-color:#D989A2;box-shadow:0 0 0 4px rgba(217,137,162,.14);}
  .login-submit{background:linear-gradient(135deg,#D989A2 0%,#C99284 100%);box-shadow:0 12px 28px rgba(217,137,162,.26);}
  .login-demo{border-color:#EEDDD2;color:#7A5F54;}.login-demo:hover{border-color:#D989A2;color:#D989A2;background:#FFF9F5;}
  .verify-title{color:#46342D;}

/* ── Pre Phase 22 extensive audit + phone optimisation ───────────────────── */
.simplified-rhythm-card .level-track{display:none!important;}
.simplified-rhythm-card .level-xp{font-size:20px;background:transparent!important;border:0!important;box-shadow:none!important;}
.checkin-rhythm-no-icon{padding-left:0!important;}
.checkin-rhythm-no-icon::before,.checkin-rhythm-no-icon>span:empty{display:none!important;content:none!important;}
.sidebar-sync-menu-pill .sync-pill + .sync-pill{display:none!important;}
.phase-card-head,.journal-header,.memory-book-head,.game-card-head{min-width:0;}
.phase-card-head>* , .journal-header>* , .memory-book-head>* , .game-card-head>*{min-width:0;}
.reset-hero-oneline{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mobile-sidebar-scrim,.mobile-sidebar-scrim.open{display:none!important;}
@media(max-width:768px){
  :root{--mobile-nav-h:calc(78px + env(safe-area-inset-bottom));}
  html,body,#__next{height:100%;overflow:hidden!important;touch-action:manipulation;}
  .app{height:100dvh!important;min-height:0!important;overflow:hidden!important;padding-bottom:0!important;}
  .main{height:100%!important;min-height:0!important;overflow:hidden!important;width:100%!important;}
  .content-area{height:100%!important;min-height:0!important;overflow:hidden!important;}
  .mobile-nav{
    display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr));
    position:fixed!important;left:0!important;right:0!important;bottom:0!important;
    height:var(--mobile-nav-h)!important;min-height:var(--mobile-nav-h)!important;
    padding:6px 6px calc(7px + env(safe-area-inset-bottom))!important;
    gap:3px!important;align-items:stretch!important;overflow:visible!important;z-index:900!important;
    background:rgba(255,255,255,.97)!important;border-top:1px solid rgba(var(--accent-rgb),.16)!important;
    box-shadow:0 -10px 28px rgba(80,44,64,.12)!important;
  }
  .dark .mobile-nav{background:rgba(35,19,41,.97)!important;}
  .mobile-nav-btn{
    min-width:0!important;min-height:52px!important;height:52px!important;padding:4px 2px!important;
    border-radius:15px!important;font-size:18px!important;line-height:1!important;gap:3px!important;
    display:flex!important;align-items:center!important;justify-content:center!important;
  }
  .mobile-nav-btn span{font-size:8.8px!important;line-height:1.05!important;margin-top:1px!important;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{
    height:100%!important;max-height:100%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;
    padding-bottom:calc(var(--mobile-nav-h) + 34px)!important;scroll-padding-bottom:calc(var(--mobile-nav-h) + 34px)!important;
    overscroll-behavior-y:contain!important;
  }
  .calendar-pane{height:100%!important;max-height:100%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:calc(var(--mobile-nav-h) + 34px)!important;}
  .calendar-pane.view-day,.calendar-pane.view-week{overflow-y:auto!important;touch-action:pan-y!important;}
  .day-view,.week-timetable{min-height:max-content!important;padding-bottom:calc(var(--mobile-nav-h) + 40px)!important;}
  .calendar-pane.view-month{min-width:0!important;overflow:auto!important;}
  .month-view{width:100%!important;min-width:0!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;}
  .month-day{min-width:0!important;min-height:94px!important;}
  .month-event-row,.month-event-name{min-width:0!important;max-width:100%!important;}
  .modal-overlay{
    z-index:2000!important;align-items:center!important;justify-content:center!important;
    padding:10px!important;overflow:hidden!important;inset:0!important;
  }
  .modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal,.checkin-modal{
    width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;
    max-height:calc(100dvh - 22px)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;
  }
  .entry-modal.memory-entry-modal{height:auto!important;max-height:calc(100dvh - 22px)!important;}
  .entry-modal-body,.modal-body,.settings-body,.templates-body,.search-body{
    min-height:0!important;flex:1 1 auto!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;
    padding-bottom:12px!important;
  }
  .entry-modal-footer,.modal-footer{
    position:sticky!important;bottom:0!important;z-index:25!important;flex-shrink:0!important;
    padding:12px 14px calc(14px + env(safe-area-inset-bottom))!important;
    background:var(--surface-soft,var(--bg3))!important;border-top:1px solid var(--border)!important;
  }
  .entry-modal-footer .tf-save,.entry-modal-footer .tf-cancel,.modal-footer .tf-save,.modal-footer .tf-cancel{min-height:44px!important;}
  .journal-header,.tasks-page>.journal-header,.bloom-room-page .journal-header,.phase-hero{
    position:sticky!important;top:0!important;z-index:80!important;background:var(--surface)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  }
  .journal-header{padding:12px!important;}
  .journal-title{font-size:16px!important;line-height:1.15!important;}
  .journal-streak{white-space:nowrap!important;}
  .today-dashboard-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page{overflow-x:hidden!important;}
  .memory-page-grid,.habit-grid,.today-dashboard-grid,.phase-grid-two{grid-template-columns:1fr!important;}
  .habit-template-library .phase-card-head{align-items:flex-start!important;gap:8px!important;}
  .habit-template-library .phase-card-head button{min-height:40px!important;}
  .reset-hero-oneline{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;}
}


/* ── Pre Phase 22 layout polish requested before Google sync ─────────────── */
.sidebar-sync-under-user{display:flex;flex-direction:column;gap:7px;margin-top:10px;align-items:flex-start;}
.sidebar-sync-now-btn{border:1px solid rgba(var(--accent-rgb),.18);background:var(--surface,rgba(255,255,255,.82));color:var(--accent);border-radius:999px;padding:7px 11px;font:inherit;font-size:11px;font-weight:950;cursor:pointer;box-shadow:var(--shadow-sm);}
.sidebar-sync-under-user .sync-pill{max-width:100%;}
.today-top-layout{grid-template-columns:minmax(240px,.9fr) minmax(280px,1fr) minmax(300px,.92fr)!important;align-items:stretch!important;}
.today-top3-card{display:flex;flex-direction:column;min-height:100%;}
.today-top3-card .today-task-list{flex:1;}
.today-empty-sugar{min-height:190px;border:1px dashed rgba(var(--accent-rgb),.22);background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,248,251,.72));border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:14px;}
.today-empty-sugar img{width:104px;height:104px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(116,78,60,.10));}
.today-empty-sugar strong{display:block;max-width:260px;color:var(--text);font-size:13px;line-height:1.35;}
.today-rhythm-strip{grid-template-columns:repeat(4,minmax(0,1fr))!important;width:100%;}
.today-rhythm-strip button{width:100%;min-width:0;}
.today-calendar-habits-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:start;}
.today-journal-only{grid-template-columns:1fr!important;}
.today-next-card{display:none!important;}
.journal-top-card-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;margin:14px 16px;}
.journal-top-card-row .journal-checkin-card,.journal-top-card-row .journal-reset-card{margin:0!important;height:100%;}
.bloom-card-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch;margin-bottom:14px;}
.bloom-card-row .game-soft-card,.bloom-card-row .checkin-rhythm-card,.bloom-card-row .tomorrow-reset-rhythm-card,.bloom-card-row .weekly-reset-rhythm-card,.bloom-card-row .affirmation-rhythm-card{margin-bottom:0!important;height:100%;}
.checkin-rhythm-no-icon{padding-left:initial!important;}
.checkin-rhythm-no-icon::before,.checkin-rhythm-no-icon>span:empty{display:initial!important;content:normal!important;}
@media(max-width:1180px){
  .today-top-layout{grid-template-columns:1fr 1fr!important;}
  .today-hero-copy{grid-column:1/-1;}
}
@media(max-width:980px){
  .today-top-layout,.today-calendar-habits-grid,.journal-top-card-row,.bloom-card-row{grid-template-columns:1fr!important;}
  .today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
}
@media(max-width:768px){
  .sidebar-sync-under-user{margin-top:9px;}
  .sidebar-sync-under-user .sync-pill{display:none!important;}
  .sidebar-sync-now-btn{width:100%;justify-content:center;min-height:38px;}
  .today-top-layout,.today-calendar-habits-grid,.journal-top-card-row,.bloom-card-row{grid-template-columns:1fr!important;gap:12px!important;}
  .today-empty-sugar{min-height:150px;}
  .today-empty-sugar img{width:86px;height:86px;}
  .today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
  .today-rhythm-strip button{min-height:76px!important;padding:12px 10px!important;}
  .today-rhythm-strip strong{font-size:20px!important;}
  .today-dashboard-grid,.today-bottom-grid{gap:12px!important;}
  .journal-top-card-row{margin:12px!important;}
  .journal-checkin-card,.journal-reset-card{flex-direction:column!important;align-items:flex-start!important;}
  .journal-checkin-actions{width:100%;justify-content:space-between;}
  .bloom-card-row{margin-bottom:12px!important;}
  .bloom-room-page .checkin-rhythm-card{margin-top:0!important;}
}


/* ── Pre Phase 22 debug 6: mobile journal viewer, opaque journal top, empty image scale ── */
.today-top3-card .today-empty-sugar img{
  width:168px!important;
  height:168px!important;
  object-fit:contain!important;
}
.today-top3-card .today-empty-sugar{
  min-height:250px!important;
}
@media(max-width:768px){
  .today-top3-card .today-empty-sugar img{
    width:138px!important;
    height:138px!important;
  }
  .today-top3-card .today-empty-sugar{
    min-height:210px!important;
  }
  .journal-page{
    background:var(--bg)!important;
    isolation:isolate!important;
  }
  .journal-page::before{
    content:""!important;
    position:fixed!important;
    top:0!important;
    left:0!important;
    right:0!important;
    height:calc(env(safe-area-inset-top) + 18px)!important;
    background:var(--bg)!important;
    z-index:78!important;
    pointer-events:none!important;
  }
  .journal-header{
    background:var(--surface,var(--bg2))!important;
    border-bottom:1px solid var(--border)!important;
    box-shadow:0 1px 0 var(--border),0 8px 20px rgba(80,44,64,.06)!important;
  }
  .modal-overlay[aria-label="View journal entry"]{
    align-items:center!important;
    justify-content:center!important;
    padding:10px 10px calc(var(--mobile-nav-h,78px) + 18px)!important;
    overflow:hidden!important;
  }
  .entry-view-modal{
    width:calc(100vw - 20px)!important;
    max-width:calc(100vw - 20px)!important;
    height:auto!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 28px)!important;
    display:flex!important;
    flex-direction:column!important;
    overflow:hidden!important;
  }
  .entry-view-modal .entry-modal-header{
    flex:0 0 auto!important;
  }
  .entry-view-body{
    min-height:0!important;
    flex:1 1 auto!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior:contain!important;
    padding-bottom:18px!important;
  }
}

`;

