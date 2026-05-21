"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, parseTimeStr, parseTimeRange, parseDur, parseDateRef, parseDateMention, parseDayWindow, fitFreeSlot, eventFromWindow, cleanTitle, inferCategory, buildGreeting, processMessage, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, CHAT_REPLY_DELAY_MS, EVENT_DRAG_HOLD_MS, CALENDARS, normalizeCalendars, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, dateRangeKeys, hasJournalEntryForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildPersonalLeaderboard, buildRhythmPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_IMAGE_LIMIT_PER_ENTRY, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, mergeTempoData, _displayTimezone, _workStart } = Core;
import { appCSS } from "../styles/tempoStyles";
import { LoginScreen, useAuth, getSupabase, loadFromCloud, saveToCloud, saveToCloudStrict, uploadMemoryImageToStorage, uploadMemoryDataUrlToStorage, deleteMemoryStoragePaths, signMemoryImagePath, allMemoryPhotoStoragePaths, memoryPhotoNeedsStorageMigration, registerTempoPushNotifications, disableTempoPushNotifications } from "./auth/LoginScreen";
import { DayView, WeekView, MonthEventRow } from "./calendar/CalendarViews";
import { LevelBar, BloomRoomPage } from "./bloom/BloomRoom";
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

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ events, tasks, streak, gameStats, onClose }) {
  const td = getEventsOnDay(events, TODAY); const todayTasks = tasks.filter(t => taskBelongsToPeriod(t, "day", TODAY)); const dn = todayTasks.filter(t => t.done).length, tot = todayTasks.length;
  const catMins = id => td.filter(e => Core.categoryIs(e.category, id)).reduce((a, e) => a + (e.end - e.start) / 60000, 0);
  const bars = [
    { label: "Important", mins: catMins("important"),    color: "#B08AE0" },
    { label: "Meetings",  mins: catMins("meeting"), color: "#FF7BAC" },
    { label: "Light Task",     mins: catMins("light"),   color: "#A0C8E0" },
    { label: "Personal",  mins: catMins("personal") + catMins("wellness"), color: "#70C8A0" },
  ];
  const mx = Math.max(...bars.map(b => b.mins), 1);
  const gs = gameStats || calculateGameStats(tasks, {}, events);
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Daily summary">
      <div className="stats-card" onClick={e => e.stopPropagation()}>
        <div className="stats-header"><span className="stats-title">📊 Rhythm Summary</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="stats-streak">🔥 {gs.streaks?.productive ?? streak} day rhythm streak · Level {gs.level} {gs.title}</div>
        <div className="stats-row">
          <div className="stat-big"><div className="stat-num">{dn}/{tot}</div><div className="stat-lbl">Tasks done</div></div>
          <div className="stat-big"><div className="stat-num">{gs.today.rank}</div><div className="stat-lbl">Daily rank</div></div>
          <div className="stat-big"><div className="stat-num">{gs.today.score}</div><div className="stat-lbl">Tempo score</div></div>
        </div>
        <div className="stats-row">
          <div className="stat-big"><div className="stat-num">{Math.round(catMins("important") / 60 * 10) / 10}h</div><div className="stat-lbl">Important time</div></div>
          <div className="stat-big"><div className="stat-num">{td.length}</div><div className="stat-lbl">Events</div></div>
          <div className="stat-big"><div className="stat-num">{gs.unlockedBadges.length}</div><div className="stat-lbl">Badges</div></div>
        </div>
        <div className="stats-mini-note">A quick snapshot of today. Deeper game progress now lives in 🌸 Bloom Room.</div>
      </div>
    </div>
  );
}

// ─── Carry Over ───────────────────────────────────────────────────────────────
function CarryOverPrompt({ tasks, gameStats, onMoveToday, onMoveTomorrow, onMoveWeek, onDrop, onDismiss }) {
  const [sel, setSel] = useState(tasks.map(t => t.id));
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectedCount = sel.length;
  return (
    <div className="modal-overlay" onClick={onDismiss} role="dialog" aria-modal="true" aria-label="Tomorrow Reset">
      <div className="carryover-card" onClick={e => e.stopPropagation()}>
        <div className="carryover-title">🌙 Tomorrow Reset</div>
        <div className="settings-section-desc">You have {tasks.length} unfinished task{tasks.length === 1 ? "" : "s"}. Move selected tasks forward or drop the noise.</div>
        {gameStats && <div className="eod-rank-card">
          <div className="eod-rank-main"><strong>{gameStats.today.rank} Rank</strong><span>{gameStats.today.score}/100 Tempo Score</span></div>
          <div className="eod-rank-meta"><span>+{gameStats.quests.filter(q => q.done).reduce((sum,q)=>sum+q.xp,0)} quest XP</span><span>{gameStats.unlockedBadges?.length || 0} badges unlocked</span></div>
          <div className="eod-rank-note">{gameStats.today.rank === "S" ? "Perfect bloom day ✨" : gameStats.today.score >= 70 ? "Strong rhythm today 🌸" : "Gentle reset. Carry what matters into the next plan 🌱"}</div>
        </div>}
        <div className="carryover-list">{tasks.map(t => <label key={t.id} className="carryover-item"><input type="checkbox" checked={sel.includes(t.id)} onChange={() => toggle(t.id)} /><span>{t.title}</span><span className="co-dur">{formatTaskDuration(t.duration)}</span></label>)}</div>
        <div className="carryover-actions carryover-actions-wrap">
          <button className="tf-cancel" disabled={!selectedCount} onClick={() => onDrop(sel)}>Drop selected</button>
          <button className="tf-cancel" disabled={!selectedCount} onClick={() => onMoveWeek(sel)}>Move to this week</button>
          <button className="tf-cancel" disabled={!selectedCount} onClick={() => onMoveToday(sel)}>Move to today</button>
          <button className="tf-save" disabled={!selectedCount} onClick={() => onMoveTomorrow(sel)}>Move to tomorrow →</button>
        </div>
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

function normalizeSettingsUpdatedAt(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeDeletedRecords(value) {
  const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const cleanKind = obj => Object.fromEntries(Object.entries(obj || {}).filter(([id, ts]) => id && ts));
  return { events: cleanKind(src.events), tasks: cleanKind(src.tasks), calendars: cleanKind(src.calendars), rituals: cleanKind(src.rituals), habits: cleanKind(src.habits) };
}

function addDeletedRecords(records, kind, ids, timestamp = new Date().toISOString()) {
  const current = normalizeDeletedRecords(records);
  const next = { events: { ...current.events }, tasks: { ...current.tasks }, calendars: { ...current.calendars }, rituals: { ...current.rituals }, habits: { ...current.habits } };
  const bucket = kind === "tasks" ? "tasks" : kind === "calendars" ? "calendars" : kind === "rituals" ? "rituals" : kind === "habits" ? "habits" : "events";
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

function SettingsPanel({ onClose, fontSize, setFontSize, darkMode, setDarkMode, theme, setTheme, workStart, setWorkStart, workEnd, setWorkEnd, mealBreaks, setMealBreaks, planningRules, setPlanningRules, notifs, setNotifs, pushEnabled, setPushEnabled, onEnableClosedPush, timezone, setTimezone, categories, setCategories, user, onSignOut, gameStats, onForceSync, syncStatus }) {
  const [catDraft, setCatDraft] = useState({ icon: "✨", label: "", color: "#FF7BAC" });
  const themeUnlockMap = new Map((gameStats?.themeUnlocks || THEMES.map(t => ({ id: t.id, unlocked: true, reason: "Unlocked" }))).map(t => [t.id, t]));
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
            </div>
          )}
          {/* Theme */}
          <div className="settings-section">
            <div className="settings-section-label">Appearance</div>
            <div className="settings-section-desc">Choose a color theme and toggle light / dark mode</div>
            <div className="theme-grid">
              {THEMES.map(t => {
                const unlock = themeUnlockMap.get(t.id) || { unlocked: true, reason: "Unlocked" };
                const locked = !unlock.unlocked && theme !== t.id;
                return (
                  <button key={t.id} disabled={locked} className={`theme-swatch-btn ${theme === t.id ? "active" : ""} ${locked ? "locked" : ""}`} onClick={() => !locked && setTheme(t.id)} title={locked ? unlock.reason : t.description}>
                    <div className="theme-swatch-dots">
                      {t.swatch.map((c, i) => <span key={i} className="theme-swatch-dot" style={{ background: c }} />)}
                    </div>
                    <span className="theme-swatch-label">{t.label}</span>
                    <span className="theme-swatch-lockline">{locked ? unlock.reason : "Unlocked"}</span>
                    {locked ? <span className="theme-swatch-lock">🔒</span> : theme === t.id && <span className="theme-swatch-check">✓</span>}
                  </button>
                );
              })}
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
    <div className="modal-overlay" onClick={requestClose} role="dialog" aria-modal="true" aria-label="Journal entry">
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
function JournalPage({ journal, setJournal, onSaveMemoryEntry, events, tasks, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, onReorderActivities, userId, onMemoryStorageMigrated, quickEditDate, onQuickEditHandled }) {
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
        <div className="journal-title">📔 Journal</div>
        <div className="journal-streak">🔥 {streak} day streak</div>
        <button className="tf-cancel journal-today-btn" onClick={() => setMemorySettingsOpen(true)}>Memory Settings</button>
        <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
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
              <button key={key} className={`memory-page-card ${hasEntry ? "has-memory" : ""} ${isFuture ? "future" : ""} ${filteredOut ? "filtered-out" : ""} ${memoryFiltersActive && matchesFilters ? "filter-match" : ""}`} onClick={() => isFuture ? null : (hasEntry ? setViewingKey(key) : setEditing(day))}>
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
      <div className="journal-entries-section">
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
        <div className="modal-overlay" onClick={() => setMemorySettingsOpen(false)} role="dialog" aria-modal="true" aria-label="Memory Settings">
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

function DailyPlanModal({ plan, onClose, onApply, onRegenerate, onMoveRemaining, mealBreaks = DEFAULT_MEAL_BREAKS, planningRules = DEFAULT_PLANNING_RULES }) {
  const [lockedIds, setLockedIds] = useState([]);
  useEffect(() => { setLockedIds([]); }, [plan?.generatedAt]);
  if (!plan) return null;
  const toggleLock = id => setLockedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const lockedSuggestions = (plan.suggestions || []).filter(item => lockedIds.includes(item.task.id));
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Plan today">
      <div className="modal day-plan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div><strong>✨ Plan Today</strong><div style={{fontSize:12,color:"var(--text2)",fontWeight:800}}>{fmtDate(plan.date)}</div></div><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="plan-summary">You have <strong>{plan.openCount}</strong> open tasks and <strong>{Math.round(plan.freeMinutes / 60 * 10) / 10}</strong> free hours today.</div>
          <div className="plan-break-note">Meal breaks protected: {normalizeMealBreaks(mealBreaks).filter(b => b.enabled).map(b => `${b.label} ${b.start}–${b.end}`).join(", ") || "none"}. Buffer: {normalizePlanningRules(planningRules).bufferMinutes} min. Capacity: {normalizePlanningRules(planningRules).maxPlanMinutes} min.</div>
          {plan.suggestions.length ? <div className="plan-list">{plan.suggestions.map(item => {
            const locked = lockedIds.includes(item.task.id);
            return <div key={item.task.id} className={`plan-row ${locked ? "locked" : ""}`}><span>{fmt(item.start)} — {item.task.title}</span><strong>{item.minutes}min</strong><button className="mini-move-btn" onClick={() => toggleLock(item.task.id)}>{locked ? "🔒 Locked" : "Lock"}</button></div>;
          })}</div> : <div className="task-card-empty">No suitable free slots found today.</div>}
          {plan.unscheduled.length > 0 && <div className="plan-warning">Could not fit: {plan.unscheduled.map(t => t.title).join(", ")}</div>}
        </div>
        <div className="modal-footer day-plan-footer"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="tf-cancel" onClick={() => onRegenerate?.(plan, lockedSuggestions)}>Regenerate plan</button>{plan.unscheduled.length > 0 && <button className="tf-cancel" onClick={() => onMoveRemaining?.(plan)}>Move remaining to tomorrow</button>}</div><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" disabled={!plan.suggestions.length} onClick={() => onApply(plan)}>Apply plan</button></div></div>
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


function SyncStatusPill({ syncStatus, onRetry, pendingLocalChanges = 0, lastSyncedAt = null }) {
  const status = syncStatus?.status || "saved";
  const lastSyncedLabel = lastSyncedAt ? ` · Last synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "";
  const label = pendingLocalChanges > 0 ? `Offline edits pending · ${pendingLocalChanges} change${pendingLocalChanges === 1 ? "" : "s"} waiting${lastSyncedLabel}` : (syncStatus?.message || (status === "saving" ? "Saving…" : status === "failed" ? "Sync failed" : status === "offline" ? "Saved on this device only" : "Saved to cloud"));
  const icon = status === "saving" ? "⏳" : status === "failed" ? "⚠️" : status === "offline" ? "📱" : "✓";
  return (
    <button type="button" className={`sync-pill sync-${status}`} onClick={status === "failed" ? onRetry : undefined} title={status === "failed" ? "Tap to retry cloud sync" : label}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );
}

function TodayLitePage({ summary, events = [], tasks = [], journal = {}, categories = CATEGORIES, rituals = [], ritualCompletions = [], habits = [], habitCompletions = [], onOpenCalendar, onOpenTasks, onOpenJournal, onOpenRituals, onOpenHabits, onPlanToday, onTomorrowReset, onToggleRitualStep, onSkipRitual, onCompleteRitual, onToggleHabit, onIncrementHabit }) {
  const todayKey = dateKey(TODAY);
  const todayTasks = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY));
  const topTasks = [...todayTasks].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 1) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 1)).slice(0, 3);
  const todayEvents = getEventsOnDay(events, TODAY).sort((a, b) => a.start - b.start).slice(0, 4);
  const moodEntry = journal?.[todayKey];
  const mood = moodEntry?.mood ? JOURNAL_MOODS.find(m => m.id === moodEntry.mood) : null;
  const catLabel = id => categories.find(c => c.id === id)?.label || "Task";
  const todayRituals = normalizeRituals(rituals).filter(r => ritualRunsOnDate(r, TODAY)).sort((a,b) => String(a.scheduledTime).localeCompare(String(b.scheduledTime))).slice(0, 3);
  const todayHabits = normalizeHabits(habits).filter(h => habitRunsOnDate(h, TODAY)).slice(0, 4);
  return (
    <div className="phase-page today-lite-page">
      <div className="phase-hero">
        <div>
          <div className="phase-kicker">Today</div>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} ✨</h1>
          <p>Your daily rhythm, beautifully organized.</p>
        </div>
        <button className="tf-save phase-primary" onClick={onPlanToday}>✨ Plan Today</button>
      </div>
      <div className="phase-summary-grid">
        <button onClick={onOpenCalendar}><strong>{summary?.events ?? 0}</strong><span>events</span></button>
        <button onClick={onOpenTasks}><strong>{summary?.tasks ?? todayTasks.length}</strong><span>open tasks</span></button>
        <button onClick={onOpenCalendar}><strong>{summary?.freeHours ?? 0}h</strong><span>free time</span></button>
        <button onClick={onOpenTasks}><strong>{summary?.mainThings ?? 0}</strong><span>main things</span></button>
      </div>
      <div className="phase-grid-two">
        <section className="phase-card">
          <div className="phase-card-head"><span>Top 3</span><button onClick={onOpenTasks}>Open tasks</button></div>
          {topTasks.length ? topTasks.map(t => <div key={t.id} className="phase-list-row"><span>□ {t.title}</span><small>{catLabel(t.category)}</small></div>) : <div className="phase-empty">No open day tasks yet 🌿</div>}
        </section>
        <section className="phase-card">
          <div className="phase-card-head"><span>Calendar</span><button onClick={onOpenCalendar}>Open calendar</button></div>
          {todayEvents.length ? todayEvents.map(e => <div key={e.id} className="phase-list-row"><span>{fmt(e.start)} — {e.title}</span><small>{e.allDay ? "All day" : `${fmt(e.end)}`}</small></div>) : <div className="phase-empty">No events scheduled yet.</div>}
        </section>
        <section className="phase-card">
          <div className="phase-card-head"><span>Rituals</span><button onClick={onOpenRituals}>Open rituals</button></div>
          {todayRituals.length ? <div className="today-ritual-stack">{todayRituals.map(r => <RitualCard key={r.id} ritual={r} completion={ritualCompletionFor(ritualCompletions, r.id, TODAY)} progress={ritualProgress(r, ritualCompletions, TODAY)} onToggleStep={onToggleRitualStep} onSkip={onSkipRitual} onComplete={onCompleteRitual} onEdit={onOpenRituals} compact />)}</div> : <div className="phase-empty">No rituals scheduled today. Create one in Rituals.</div>}
        </section>
        <section className="phase-card">
          <div className="phase-card-head"><span>Habits</span><button onClick={onOpenHabits}>Open habits</button></div>
          {todayHabits.length ? <div className="today-habit-stack">{todayHabits.map(h => <HabitCard key={h.id} habit={h} progress={habitProgress(h, habitCompletions, TODAY)} streak={habitStreak(h, habitCompletions, TODAY)} onToggle={onToggleHabit} onIncrement={onIncrementHabit} onEdit={onOpenHabits} compact />)}</div> : <div className="phase-empty">No habits scheduled today. Create one in Habits.</div>}
        </section>
      </div>
      <div className="phase-card phase-wide-card">
        <div className="phase-card-head"><span>Check-in</span><button onClick={onOpenJournal}>{mood ? `${mood.emoji} ${mood.label}` : "Open Journal"}</button></div>
        <p className="phase-copy">Use Journal / Bloom Room to track how the day feels. Mood and energy check-ins will become a deeper Today feature in a later phase.</p>
        <button className="tf-cancel" onClick={onTomorrowReset}>🌙 Tomorrow Reset</button>
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
  return (
    <div className={`ritual-card ${progress.completed ? "ritual-complete" : ""} ${progress.skipped ? "ritual-skipped" : ""}`} style={{ "--ritual-color": ritual.color || "var(--accent)" }}>
      <div className="ritual-card-top">
        <div className="ritual-title-wrap"><div className="ritual-emoji">{ritual.emoji}</div><div><h3>{ritual.name}</h3><p>{category?.emoji || "✨"} {category?.label || "Ritual"} · {ritual.scheduledTime} · {ritual.estimatedMinutes} min</p></div></div>
        {!compact && <button className="tf-cancel ritual-edit-btn" onClick={() => onEdit(ritual)}>Edit</button>}
      </div>
      <div className="ritual-progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
      <div className="ritual-progress-label">{progress.skipped ? "Skipped today" : progress.completed ? "Complete for today ✨" : `${progress.done}/${progress.total} steps done`}</div>
      <div className="ritual-step-list">
        {(compact ? ritual.steps.slice(0, 3) : ritual.steps).map(step => {
          const checked = (completion?.completedSteps || []).includes(step.id);
          return <label key={step.id} className={`ritual-step ${checked ? "checked" : ""}`}><input type="checkbox" checked={checked} disabled={progress.skipped} onChange={() => onToggleStep(ritual, step.id)} /><span>{step.text}</span></label>;
        })}
        {compact && ritual.steps.length > 3 && <div className="ritual-more">+{ritual.steps.length - 3} more steps</div>}
      </div>
      {!compact && <div className="ritual-card-actions"><button className="tf-cancel" onClick={() => onSkip(ritual)}>{progress.skipped ? "Undo skip" : "Skip today"}</button><button className="tf-save" onClick={() => onComplete(ritual)}>Mark complete</button></div>}
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
  const normalized = normalizeHabits(habits);
  const categories = ["all", ...HABIT_CATEGORIES.map(c => c.id)];
  const filtered = HABIT_TEMPLATES.filter(t => filter === "all" || t.category === filter);
  const hasTemplate = template => normalized.some(h => !h.deletedAt && !h.archived && (h.templateId === template.id || String(h.name || "").trim().toLowerCase() === String(template.name || "").trim().toLowerCase()));
  return (
    <div className="phase-card phase-wide-card ritual-section-card ritual-template-section habit-template-section">
      <div className="phase-card-head ritual-template-head">
        <div><span>Template Library</span><small>Pick starter habits, then customize them to fit your rhythm.</small></div>
        <div className="ritual-template-filters">
          {categories.map(id => {
            const cat = HABIT_CATEGORIES.find(c => c.id === id);
            return <button key={id} className={`mini-pill ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{id === "all" ? "All" : `${cat?.emoji || "✨"} ${cat?.label || id}`}</button>;
          })}
        </div>
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
  const [page, setPage]             = useState("today"); // "today" | "calendar" | "journal" | "tasks" | "bloom" | "rituals" | "habits" | "affirmations"
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
  const [showStats,    setShowStats]    = useState(false);
  const [showShortcuts,setShowShortcuts]= useState(false);
  const [showCarryOver,setShowCarryOver]= useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showStartup, setShowStartup] = useState(false);
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
    if (["today", "calendar", "tasks", "journal", "bloom", "rituals", "habits", "affirmations", "weekly-reset"].includes(requestedPage)) {
      setPage(requestedPage);
    }
  }, []);

  useEffect(() => {
    if (!dataReady || !auth.user?.id) return;
    const key = `${uk}_startup_seen_${dateKey(TODAY)}`;
    if (!load(key, false)) setShowStartup(true);
  }, [dataReady, auth.user?.id, uk]);

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

    const applyLoadedData = async ({ loadedEvents, loadedTasks, settings, updatedAt }) => {
      if (cancelled) return;
      const safeEvents = reviveEvents(loadedEvents || []);
      const safeTasks = normalizeTasks(Array.isArray(loadedTasks) ? loadedTasks : []);
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
    deletedRecords: normalizeDeletedRecords(deletedRecords),
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
    save(`${uk}_memory_storage_migrated_at`, next.memoryStorageMigratedAt || null);
    saveJournalLocal(uk, auth.user?.id, next.journal ?? journal);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user) {
      queueCloudSave(events, tasks, next);
    }
  };

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
  function freeSlotsForDate(date, extraEvents = []) {
    const safeExtraEvents = Array.isArray(extraEvents) ? extraEvents : [];
    // getFreeBlocks returns minute offsets, so convert those offsets back into
    // real Date objects before comparing with the current time or durations.
    const rules = normalizePlanningRules(planningRules);
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
    const rawBooked = expandRecurring([...events, ...safeExtraEvents, ...mealBlocks], dayStart(date), addDaysSafe(dayStart(date), 1))
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
  function buildDailyPlan(date = TODAY, lockedSuggestions = []) {
    const planDate = dayStart(date);
    const locked = (lockedSuggestions || []).map(item => ({ ...item, start: new Date(item.start), end: new Date(item.end) })).filter(item => item?.task?.id && sameDay(item.start, planDate));
    const lockedIds = new Set(locked.map(item => item.task.id));
    const lockedBlocks = locked.map(item => ({ id: `locked-${item.task.id}`, title: item.task.title, start: item.start, end: item.end, allDay: false, calendar: "work", category: item.task.category || "important", fixed: true }));
    const candidates = openPlanningTasks(planDate).filter(t => !lockedIds.has(t.id));
    let slots = freeSlotsForDate(planDate, lockedBlocks);
    const freeMinutes = slots.reduce((sum, slot) => sum + slot.minutes, 0) + locked.reduce((sum, item) => sum + Math.max(0, Math.round((item.end - item.start) / 60000)), 0);
    const suggestions = [...locked];
    const unscheduled = [];
    const rules = normalizePlanningRules(planningRules);
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
    return { date: planDate, freeMinutes, openCount: candidates.length + locked.length, suggestions, unscheduled, planningRules: rules, plannedMinutes, generatedAt: Date.now() };
  }
  function applyDayPlan(plan) {
    if (!plan?.suggestions?.length) return;
    pushUndo();
    const additions = plan.suggestions.map(({ task, start, end }) => buildTaskEvent(task, start, end, { source: "day-plan" }));
    const taskToEvent = new Map(additions.map(ev => [ev.linkedTaskId, ev]));
    const nextEvents = [...events, ...additions];
    const nextTasks = tasks.map(t => taskToEvent.has(t.id) ? touchRecord(t, { scheduledEventId: taskToEvent.get(t.id).id, scheduledStart: taskToEvent.get(t.id).start.toISOString(), scheduledEnd: taskToEvent.get(t.id).end.toISOString() }) : t);
    setEventsAndTasks(nextEvents, nextTasks);
    setDayPlan(null);
    setToast({ text: `Plan added ${additions.length} task block${additions.length === 1 ? "" : "s"} ✓`, ts: Date.now() });
  }
  function regenerateDayPlan(plan, lockedSuggestions = []) {
    setDayPlan(buildDailyPlan(plan?.date || TODAY, lockedSuggestions));
  }
  function movePlanRemainingToTomorrow(plan) {
    const unscheduled = plan?.unscheduled || [];
    if (!unscheduled.length) return;
    const tomorrow = addDaysSafe(TODAY, 1);
    const patch = taskPeriodPatchForScope("day", tomorrow);
    const ids = new Set(unscheduled.map(t => t.id));
    pushUndo();
    setTasks(ts => ts.map(t => ids.has(t.id) ? touchRecord({ ...t, scope: "day", done: false, completedAt: null, completedDate: null, ...patch }) : t));
    setToast({ text: `Moved ${unscheduled.length} remaining task${unscheduled.length === 1 ? "" : "s"} to tomorrow ✓`, ts: Date.now() });
    setDayPlan(null);
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
      <div className="login-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:20}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
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
      <div className="login-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:16}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><p style={{color:"#A07090",fontSize:13,fontWeight:600,marginBottom:20}}>Loading your schedule…</p><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
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
  const firstScheduledEvent = visibleEvents
    .filter(e => e.start instanceof Date && eventOccursOnDay(e, TODAY))
    .sort((a, b) => a.start - b.start)[0];
  const dailyStartupSummary = {
    events: getEventsOnDay(visibleEvents, TODAY).length,
    tasks: tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY)).length,
    freeHours: Math.round(dayFreeMinutes / 60 * 10) / 10,
    mainThings: tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY) && Core.categoryIs(t.category, "main")).length,
    firstEvent: firstScheduledEvent ? `${fmt(firstScheduledEvent.start)} — ${firstScheduledEvent.title}` : null,
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
  .phase-page{height:100%;overflow:auto;padding:22px;display:flex;flex-direction:column;gap:16px;background:var(--bg);}.phase-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,var(--bg2),var(--bg4));border:1px solid var(--border);border-radius:28px;padding:22px;box-shadow:var(--shadow-sm);}.phase-kicker{font-size:11px;font-weight:900;color:var(--accent);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:4px;}.phase-hero h1{font-size:30px;line-height:1.05;margin:0 0 6px;color:var(--text);}.phase-hero p,.phase-copy{margin:0;color:var(--text2);font-size:13px;font-weight:800;line-height:1.55;}.phase-primary{white-space:nowrap;}.phase-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}.phase-summary-grid button{background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:14px 12px;text-align:left;cursor:pointer;box-shadow:var(--shadow-sm);font-family:var(--font);}.phase-summary-grid strong{display:block;color:var(--accent);font-size:24px;line-height:1;font-weight:900;}.phase-summary-grid span{font-size:11px;font-weight:900;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;}.phase-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}.phase-card{background:var(--bg2);border:1px solid var(--border);border-radius:22px;padding:16px;box-shadow:var(--shadow-sm);}.phase-wide-card{max-width:900px;}.phase-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;}.phase-card-head span{font-size:15px;font-weight:900;color:var(--text);}.phase-card-head button{border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:5px 9px;font-family:var(--font);font-weight:900;font-size:11px;cursor:pointer;}.phase-card-head small{font-size:10px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;}.phase-list-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding:9px 0;font-size:13px;font-weight:850;color:var(--text);}.phase-list-row:first-child{border-top:0;}.phase-list-row small{color:var(--text3);font-weight:900;white-space:nowrap;}.phase-empty{font-size:13px;font-weight:800;color:var(--text2);line-height:1.5;background:var(--bg3);border:1px dashed var(--border);border-radius:16px;padding:14px;}.phase-placeholder-card{opacity:.92;}.phase-bullet-list{display:flex;flex-direction:column;}.coming-soon-page .phase-wide-card{width:min(720px,100%);}@media(max-width:768px){.phase-page{padding:14px 12px 90px;}.phase-hero{align-items:flex-start;flex-direction:column;border-radius:22px;padding:18px;}.phase-hero h1{font-size:24px;}.phase-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.phase-grid-two{grid-template-columns:1fr;}.phase-card{border-radius:18px;padding:14px;}}.reminder-editor{display:flex;flex-direction:column;gap:8px}.reminder-custom-row{margin:0!important;grid-template-columns:auto 1fr!important}.task-progress-mini{display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--text2);font-weight:900;margin:6px 0}.task-progress-track{height:6px;border-radius:999px;background:var(--border);overflow:hidden}.task-progress-track i{display:block;height:100%;border-radius:999px;background:var(--accent)}.task-progress-mini strong{color:var(--accent)}.plan-day-btn{background:linear-gradient(135deg,var(--accent),#B08AE0)!important;color:#fff!important;border-color:transparent!important}.plan-summary{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:12px;font-weight:800;color:var(--text2)}.plan-summary strong{color:var(--accent)}.plan-list{display:flex;flex-direction:column;gap:8px}.plan-row{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:14px;font-weight:800}.plan-row strong{color:var(--accent);white-space:nowrap}.plan-warning{font-size:12px;color:#C07820;font-weight:900;background:#FFF6E6;border:1px solid #FFE2A8;border-radius:14px;padding:10px}.day-plan-modal .modal-body{gap:12px}
`}</style>

      <div className="app">
        <div className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-logo"><div className="logo-icon">🌸</div><span>Tempo</span></div>
          <div className="sidebar-date">
            <div className="date-big">{TODAY.getDate()}</div>
            {formatWithDisplayTimezone(TODAY, { weekday: "long", month: "long", year: "numeric" })}
            {auth.user && <div className="sidebar-user">👤 {auth.user.name || auth.user.email}</div>}
            <button type="button" className="sidebar-daily-stats-btn" onClick={() => { setShowStats(true); closeSidebarOnMobile(); }}>📊 Rhythm Stats</button>
            <div className="sidebar-sync-menu-pill">
              <SyncStatusPill syncStatus={syncStatus} onRetry={forceSyncNow} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} />
            </div>
            <button type="button" className="mobile-menu-sync-btn" onClick={forceSyncNow}>↻ Sync now</button>
          </div>
          {(() => { const todayMood = journal[dateKey(TODAY)]; const m = todayMood?.mood ? JOURNAL_MOODS.find(x=>x.id===todayMood.mood) : null; return m ? <div className="mood-bar" onClick={() => { setPage("journal"); closeSidebarOnMobile(); }} style={{cursor:"pointer"}}>{m.emoji} Feeling {m.label}</div> : null; })()}
          <LevelBar gameStats={gameStats} />
          <nav className="sidebar-nav">
            <div className="nav-section-label">Main</div>
            <div className={`nav-item ${page==="today"?"active":""}`} onClick={() => { setPage("today"); closeSidebarOnMobile(); }}><span className="nav-icon">🌤️</span>Today</div>
            <div className={`nav-item ${page==="calendar"?"active":""}`} onClick={() => { setPage("calendar"); closeSidebarOnMobile(); }}><span className="nav-icon">🗓️</span>Calendar</div>
            <div className={`nav-item ${page==="tasks"?"active":""}`} onClick={() => { setPage("tasks"); closeSidebarOnMobile(); }}><span className="nav-icon">✅</span>Tasks</div>
            <div className={`nav-item ${page==="rituals"?"active":""}`} onClick={() => { setPage("rituals"); closeSidebarOnMobile(); }}><span className="nav-icon">🕯️</span>Rituals</div>
            <div className={`nav-item ${page==="habits"?"active":""}`} onClick={() => { setPage("habits"); closeSidebarOnMobile(); }}><span className="nav-icon">🌱</span>Habits</div>
            <div className={`nav-item ${page==="journal"?"active":""}`} onClick={() => { setPage("journal"); closeSidebarOnMobile(); }}><span className="nav-icon">📔</span>Journal</div>
            <div className="nav-section-label" style={{marginTop:8}}>Planning</div>
            <div className="nav-item desktop-hidden-menu-item" onClick={() => { setDayPlan(buildDailyPlan(TODAY)); closeSidebarOnMobile(); }}><span className="nav-icon">✨</span>Plan Today</div>
            <div className="nav-item" onClick={() => { setShowCarryOver(true); closeSidebarOnMobile(); }}><span className="nav-icon">🌙</span>Tomorrow Reset</div>
            <div className={`nav-item ${page==="weekly-reset"?"active":""}`} onClick={() => { setPage("weekly-reset"); closeSidebarOnMobile(); }}><span className="nav-icon">🧺</span>Weekly Reset</div>
            <div className="nav-section-label" style={{marginTop:8}}>Personal</div>
            <div className={`nav-item ${page==="bloom"?"active":""}`} onClick={() => { setPage("bloom"); closeSidebarOnMobile(); }}><span className="nav-icon">🌸</span>Bloom Room</div>
            <div className={`nav-item ${page==="affirmations"?"active":""}`} onClick={() => { setPage("affirmations"); closeSidebarOnMobile(); }}><span className="nav-icon">💌</span>Affirmations</div>
            <div className="nav-item" onClick={() => { setShowStats(true); closeSidebarOnMobile(); }}><span className="nav-icon">📊</span>Rhythm Stats</div>
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

        <div className="main">
          {page === "today" ? (
            <TodayLitePage summary={dailyStartupSummary} events={visibleEvents} tasks={tasks} journal={journal} categories={categories} rituals={rituals} ritualCompletions={ritualCompletions} habits={habits} habitCompletions={habitCompletions} onOpenCalendar={() => setPage("calendar")} onOpenTasks={() => setPage("tasks")} onOpenJournal={() => setPage("journal")} onOpenRituals={() => setPage("rituals")} onOpenHabits={() => setPage("habits")} onPlanToday={() => setDayPlan(buildDailyPlan(TODAY))} onTomorrowReset={() => setShowCarryOver(true)} onToggleRitualStep={toggleRitualStep} onSkipRitual={skipRitualToday} onCompleteRitual={completeRitualToday} onToggleHabit={toggleHabitToday} onIncrementHabit={incrementHabitToday} />
          ) : page === "journal" ? (
            <JournalPage journal={journal} setJournal={setJournal} onSaveMemoryEntry={saveMemoryEntry} events={gameEvents} tasks={tasks} activitiesCatalog={journalActivities} memoryTagsCatalog={memoryTags} onAddActivity={addJournalActivity} onUpdateActivity={updateJournalActivity} onDeleteActivity={deleteJournalActivity} onAddMemoryTag={addMemoryTag} onUpdateMemoryTag={updateMemoryTag} onDeleteMemoryTag={deleteMemoryTag} onReorderActivities={reorderJournalActivities} userId={auth.user?.id} onMemoryStorageMigrated={markMemoryStorageMigrated} quickEditDate={quickMemoryDate} onQuickEditHandled={() => setQuickMemoryDate(null)} />
          ) : page === "tasks" ? (
            <TasksPage tasks={tasks} categories={categories} onToggle={toggleTask} onAdd={addTask} onEdit={setSelectedTask} onScheduleTask={setScheduleTaskTarget} scope={taskScope} setScope={setTaskScope} periodDate={taskPeriodDate} setPeriodDate={setTaskPeriodDate} onMoveTaskPeriod={moveTaskToPeriod} gameStats={gameStats} />
          ) : page === "bloom" ? (
            <BloomRoomPage gameStats={gameStats} />
          ) : page === "rituals" ? (
            <RitualsPage rituals={rituals} completions={ritualCompletions} onAdd={addRitual} onEdit={editRitual} onDelete={deleteRitual} onArchive={archiveRitual} onToggleStep={toggleRitualStep} onSkip={skipRitualToday} onComplete={completeRitualToday} />
          ) : page === "habits" ? (
            <HabitsPage habits={habits} completions={habitCompletions} onAdd={addHabit} onEdit={editHabit} onDelete={deleteHabit} onArchive={archiveHabit} onToggle={toggleHabitToday} onIncrement={incrementHabitToday} />
          ) : page === "affirmations" ? (
            <ComingSoonPage icon="💌" title="Affirmations" phase="Later phase" description="A soft daily affirmation card for Bloom Room, Today, and future rituals." bullets={["Daily affirmation", "Favorites", "Custom affirmations", "Optional reminder"]} />
          ) : page === "weekly-reset" ? (
            <ComingSoonPage icon="🧺" title="Weekly Reset" phase="Later phase" description="A guided weekly planning ritual to review the past week and prepare the next one calmly." bullets={["Review last week", "Choose weekly priorities", "Plan key events", "Write a weekly intention"]} />
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
            <div className="stat"><div className="stat-dot" style={{ background: "#C9A0FF" }} />Lvl {gameStats.level} · {gameStats.today.rank} Rank</div>
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
      {showSearch && <SearchModal events={expandedEvents} tasks={tasks} categories={categories} onClose={() => setShowSearch(false)} onEventClick={setSelectedEvent} onTaskEdit={setSelectedTask} onNavigate={d => { setViewDate(new Date(d)); setView("day"); }} />}
      {quickAddDate  && <AddEventModal onClose={() => setQuickAddDate(null)} onSave={async ev => { const placed = await addEvent(ev); if (placed) setQuickAddDate(null); return placed; }} defaultDate={quickAddDate} calendars={calendars} categories={categories} />}
      {selectedEvent && <EventModal event={selectedEvent} calendars={calendars} categories={categories} onClose={() => setSelectedEvent(null)} onSave={saveEvent} onDelete={deleteEvent} onCopy={copyEventForPaste} />}
      {selectedTask && <TaskModal task={selectedTask} categories={categories} onClose={() => setSelectedTask(null)} onSave={task => { selectedTask._isNew ? addTask({ ...task, _isNew: undefined }) : saveTask(task); setSelectedTask(null); }} onDelete={selectedTask._isNew ? null : deleteTask} />}
      <EventConflictModal />
      <RecurringTaskScopeModal />
      <TaskRescheduleDateModal />
      {scheduleTaskTarget && <TaskScheduleModal task={scheduleTaskTarget} workStart={workStart} workEnd={workEnd} onClose={() => setScheduleTaskTarget(null)} onSchedule={(mode) => scheduleTaskIntoCalendar(scheduleTaskTarget, mode)} />}
      {dayPlan && <DailyPlanModal plan={dayPlan} mealBreaks={mealBreaks} planningRules={planningRules} onClose={() => setDayPlan(null)} onApply={applyDayPlan} onRegenerate={regenerateDayPlan} onMoveRemaining={movePlanRemainingToTomorrow} />}
      {showStats  && <StatsCard events={visibleEvents} tasks={tasks} streak={streak} gameStats={gameStats} onClose={() => setShowStats(false)} />}
      {/* End of day carry-over: only surface after work hours to avoid mid-day false positives */}
      {showCarryOver && <CarryOverPrompt tasks={tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY))} gameStats={gameStats} onMoveToday={handleCarryToday} onMoveTomorrow={handleCarryOver} onMoveWeek={handleCarryWeek} onDrop={handleDrop} onDismiss={() => setShowCarryOver(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} workStart={workStart} setWorkStart={setWorkStart} workEnd={workEnd} setWorkEnd={setWorkEnd} mealBreaks={mealBreaks} setMealBreaks={setMealBreaks} planningRules={planningRules} setPlanningRules={setPlanningRules} notifs={notifs} setNotifs={setNotifs} pushEnabled={pushEnabled} setPushEnabled={setPushEnabled} onEnableClosedPush={enableClosedPushNotifications} timezone={timezone} setTimezone={setTimezone} categories={categories} setCategories={setCategories} user={auth.user} onSignOut={auth.signOut} gameStats={gameStats} onForceSync={forceSyncNow} syncStatus={syncStatus} />}
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
      <div className="mobile-nav">
        <button className="mobile-nav-btn" onClick={() => setSidebarOpen(v => !v)}>☰<span>Menu</span></button>
        <button className="mobile-nav-btn" onClick={() => setPage("today")}>🌤️<span>Today</span></button>
        <button className="mobile-nav-btn" onClick={() => { setPage("calendar"); setView("day"); }}>🗓️<span>Calendar</span></button>
        <button className="mobile-nav-btn" onClick={() => { setPage("tasks"); setTaskScope("day"); }}>✅<span>Tasks</span></button>
        <button className="mobile-nav-btn" onClick={() => setPage("journal")}>📔<span>Journal</span></button>
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
`;

