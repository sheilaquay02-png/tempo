"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, parseTimeStr, parseTimeRange, parseDur, parseDateRef, parseDateMention, parseDayWindow, fitFreeSlot, eventFromWindow, cleanTitle, inferCategory, buildGreeting, processMessage, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, CHAT_REPLY_DELAY_MS, EVENT_DRAG_HOLD_MS, CALENDARS, normalizeCalendars, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, hasJournalEntryForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildPersonalLeaderboard, buildRhythmPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, DAILY_CHECKIN_MOODS, DAILY_CHECKIN_ENERGIES, normalizeDailyCheckIn, normalizeDailyCheckIns, dailyCheckInForDate, TOMORROW_RESET_TASK_ACTIONS, normalizeTomorrowReset, normalizeTomorrowResets, tomorrowResetForDate, WEEKLY_RESET_TASK_ACTIONS, normalizeWeeklyReset, normalizeWeeklyResets, weeklyResetForDate, AFFIRMATION_CATEGORIES, DEFAULT_AFFIRMATIONS, DEFAULT_AFFIRMATION_SETTINGS, DEFAULT_NOTIFICATION_PREFERENCES, normalizeAffirmation, normalizeAffirmations, normalizeAffirmationSettings, normalizeNotificationPreferences, normalizeSyncConflictLog, syncDatasetCounts, affirmationCategoryById, affirmationForDate, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_IMAGE_LIMIT_PER_ENTRY, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, buildJournalPhotoCleanupQueue, markJournalPhotoCleanupAttempt, mergeTempoData, _displayTimezone, _workStart } = Core;
import { appCSS } from "../styles/tempoStyles";
import { DailyStartupModal } from "./shared/DisplayComponents";
import { AppSidebar, CalendarTopbar, MobileBottomNav, TempoLoadingScreen } from "./layout/AppShell";
import { BudgetApp, OverallPage } from "./budget/BudgetApp";
import { HabitsPage } from "./habits/Habits";
import { DailyCheckInModal, TomorrowResetPage, WeeklyResetPage, taskFallsOnDateForReset } from "./checkins/CheckInReset";
import {
  DEFAULT_MEAL_BREAKS,
  DEFAULT_PLANNING_RULES,
  DEFAULT_RITUALS,
  DEFAULT_HABITS,
  HABIT_TEMPLATES,
} from "../constants/tempoConstants";
import { pct } from "../utils/budgetUtils";
import {
  habitFromTemplate,
  habitProgress,
  habitRunsOnDate,
  habitStreak,
  normalizeHabit,
  normalizeHabitCompletion,
  normalizeHabitCompletions,
  normalizeHabitReminder,
  normalizeHabits,
} from "../utils/habitUtils";
import {
  dateKeySetForLast,
  timeStringToMinutes,
} from "../utils/dateUtils";
import {
  applyPlanningModeToRules,
  normalizeMealBreaks,
  normalizePlanningMode,
  normalizePlanningRules,
  planningModeForEnergy,
} from "../utils/planningUtils";
import {
  normalizeRitualCompletions,
  normalizeRituals,
} from "../utils/ritualUtils";
import {
  addDeletedRecords,
  normalizeDeletedRecords,
  normalizeSettingsUpdatedAt,
} from "../utils/deletedRecordsUtils";
import { LoginScreen, useAuth, getSupabase, loadFromCloud, saveToCloud, saveToCloudStrict, uploadMemoryImageToStorage, uploadMemoryDataUrlToStorage, deleteMemoryStoragePaths, deleteMemoryStoragePathsDetailed, signMemoryImagePath, allMemoryPhotoStoragePaths, memoryPhotoNeedsStorageMigration, registerTempoPushNotifications } from "./auth/LoginScreen";
import { DayView, WeekView, MonthEventRow } from "./calendar/CalendarViews";
import { EventModal, AddEventModal, SearchModal, CalendarEditModal } from "./calendar/CalendarModals";
import { TaskScheduleModal, DailyPlanModal } from "./planning/PlanningModals";
import { SettingsPanel } from "./settings/SettingsPanel";
import { JournalPage } from "./journal/Journal";
import { TodayLitePage } from "./today/TodayDashboard";
import { SkillStatsCard, WeeklyRecapCard, LifeGardenCard, StreaksCard, PersonalityCard } from "./bloom/BloomRoom";
import { TaskPanel, TaskModal, TasksPage } from "./tasks/Tasks";
import { calendarEventSource, calendarSourceLabel, cleanCalendarColor } from "../lib/tempo/client/calendarPresentation";
import { countImportedGoogleEvents, deriveGoogleCalendarPayloadState, formatGoogleImportToast, googleCalendarRequest as requestGoogleCalendar, googleDisconnectWarning } from "../lib/tempo/client/googleCalendarClient";
import { enableClosedPushNotificationsForUser } from "../lib/tempo/client/pushNotifications";
import { useTempoUserKey } from "../hooks/useTempoPersistence";
import { useTempoCloudSync, useTempoRealtimeSync } from "../hooks/useTempoCloudSync";
import {
  DEFAULT_BONUS_ALLOCATION_RULES,
  DEFAULT_BUDGET_ACCOUNTS,
  DEFAULT_BUDGET_BUCKETS,
  DEFAULT_BUDGET_LEDGERS,
  DEFAULT_BUDGET_PROFILE,
  DEFAULT_BUDGET_TRANSACTIONS,
} from "../constants/budgetConstants";
import {
  calculateBudgetSummary,
  normalizeBonusAllocationRules,
  normalizeBudgetAccounts,
  normalizeBudgetBuckets,
  normalizeBudgetLedgers,
  normalizeBudgetProfile,
  normalizeBudgetTransactions,
} from "../utils/budgetPlanUtils";

// ─── Rhythm Stats ─────────────────────────────────────────────────────────────
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

// ─── Tomorrow Reset / Check-ins moved to components/checkins/CheckInReset.jsx ───────────

// ─── Shortcuts Modal ──────────────────────────────────────────────────────────
function ShortcutsModal({ onClose }) {
  const sc = [["D","Day view"],["W","Week view"],["M","Month view"],["J","Journal"],["C","Create event"],["T","Create task"],["S","Settings"],["/ or ⌘K","Search"],["?","Shortcuts"],["Cmd+Z","Undo"],["Esc","Close / Back"]];
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span style={{ fontWeight: 800 }}>⌨️ Keyboard Shortcuts</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="shortcuts-grid">{sc.map(([k, v]) => <div key={k} className="shortcut-row"><kbd className="kbd">{k}</kbd><span>{v}</span></div>)}</div>
      </div>
    </div>
  );
}

// ─── Scheduling / meal-break, ritual, and deleted-record helpers moved to utils. ──────────

// ─── Settings Panel ───────────────────────────────────────────────────────────




// Ritual UI was removed from visible product surfaces; legacy ritual data normalizers remain for sync compatibility.

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


// ─── Removed legacy local helper panel from product UI. ─────────────────────


export default function App() {
  const auth = useAuth();
  // Use auth user ID when available; fall back to a persistent anonymous key so
  // unsigned-in users do not lose their local Tempo data after closing the browser.
  const uk = useTempoUserKey(auth.user?.id);

  const [view, setView]             = useState("day");
  const [viewDate, setViewDate]     = useState(new Date(TODAY));
  const [page, setPage]             = useState("today"); // "today" | "calendar" | "journal" | "tasks" | "habits" | "rhythm"
  const [appMode, setAppModeRaw]    = useState(() => load(`${uk}_app_mode`, "schedule"));
  const [taskScope, setTaskScope]   = useState("day");
  const [taskPeriodDate, setTaskPeriodDate] = useState(new Date(TODAY));
  const [events, setEvRaw]          = useState(() => reviveEvents(load(`${uk}_ev`, INIT_EVENTS)));
  const [tasks,  setTkRaw]          = useState(() => normalizeTasks(load(`${uk}_tk`, INIT_TASKS)));
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth > 768));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize,  setFSRaw]       = useState(() => load(`${uk}_fs`, "md"));
  const [darkMode,  setDMRaw]       = useState(() => load(`${uk}_dm`, false));
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", Boolean(darkMode));
    document.body?.classList.toggle("dark", Boolean(darkMode));
    return () => {
      document.documentElement.classList.remove("dark");
      document.body?.classList.remove("dark");
    };
  }, [darkMode]);
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
  const [calendarEditor, setCalendarEditor] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message) => {
    const text = typeof message === "string" ? message : message?.text;
    if (!text) return;
    setToast({ text, ts: Date.now() });
  }, []);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scheduleTaskTarget, setScheduleTaskTarget] = useState(null);
  const [dayPlan, setDayPlan] = useState(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
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
  const [budgetProfile, setBudgetProfileRaw] = useState(() => normalizeBudgetProfile(load(`${uk}_budget_profile`, DEFAULT_BUDGET_PROFILE)));
  const [budgetAccounts, setBudgetAccountsRaw] = useState(() => normalizeBudgetAccounts(load(`${uk}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)));
  const [budgetLedgers, setBudgetLedgersRaw] = useState(() => normalizeBudgetLedgers(load(`${uk}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)));
  const [budgetBuckets, setBudgetBucketsRaw] = useState(() => normalizeBudgetBuckets(load(`${uk}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)));
  const [budgetTransactions, setBudgetTransactionsRaw] = useState(() => normalizeBudgetTransactions(load(`${uk}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)));
  const [bonusAllocationRules, setBonusAllocationRulesRaw] = useState(() => normalizeBonusAllocationRules(load(`${uk}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)));
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
  const [hiddenCalendarSources, setHiddenCalendarSources] = useState(() => load(`${uk}_hidden_calendar_sources`, ["habit"]));
  const [quickAddDate,  setQuickAddDate]  = useState(null);
  const [quickMemoryDate, setQuickMemoryDate] = useState(null);
  const [dataReady,    setDataReady]    = useState(false);
  const {
    syncStatus,
    setSyncStatus,
    pendingLocalChanges,
    lastSyncedAt,
    cloudQueueRef,
    cloudHydrationRef,
    markPendingLocalChange,
    markCloudSynced,
    queueCloudSave,
  } = useTempoCloudSync({ authUser: auth.user, userKey: uk, dataReady });
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [googleSync, setGoogleSync] = useState({ connected: false, calendars: [], loading: false, message: "", error: "", lastImportAt: null, googleCalendarSync: null });
  const [journal, setJournalRaw] = useState({}); // populated by useEffect after auth resolves
  const [memoryStorageMigratedAt, setMemoryStorageMigratedAtRaw] = useState(() => load(`${uk}_memory_storage_migrated_at`, null));
  const [memoryPhotoCleanupQueue, setMemoryPhotoCleanupQueueRaw] = useState(() => load(`${uk}_memory_photo_cleanup_queue`, []));
  const memoryPhotoCleanupRunningRef = useRef(false);
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
    if (params.get("google") === "connected") {
      setSettingsOpen(true);
      setToast({ text: "Google Calendar connected ✓", ts: Date.now() });
    } else if (params.get("google") === "error") {
      setSettingsOpen(true);
      setToast({ text: `Google Calendar setup failed: ${params.get("reason") || "unknown error"}`, ts: Date.now() });
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
    if (typeof window === "undefined") return;
    const update = () => setIsMobileViewport(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
      setBudgetProfileRaw(normalizeBudgetProfile(DEFAULT_BUDGET_PROFILE));
      setBudgetAccountsRaw(normalizeBudgetAccounts(DEFAULT_BUDGET_ACCOUNTS));
      setBudgetLedgersRaw(normalizeBudgetLedgers(DEFAULT_BUDGET_LEDGERS));
      setBudgetBucketsRaw(normalizeBudgetBuckets(DEFAULT_BUDGET_BUCKETS));
      setBudgetTransactionsRaw(normalizeBudgetTransactions(DEFAULT_BUDGET_TRANSACTIONS));
      setBonusAllocationRulesRaw(normalizeBonusAllocationRules(DEFAULT_BONUS_ALLOCATION_RULES));
      return;
    }

    let cancelled = false;
    cloudHydrationRef.current = { usingFallback: false, cloudResolved: false };
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
    setMemoryPhotoCleanupQueueRaw(load(`${userKey}_memory_photo_cleanup_queue`, []));
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
    setAppModeRaw(load(`${userKey}_app_mode`, "schedule"));
    setBudgetProfileRaw(normalizeBudgetProfile(load(`${userKey}_budget_profile`, DEFAULT_BUDGET_PROFILE)));
    setBudgetAccountsRaw(normalizeBudgetAccounts(load(`${userKey}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)));
    setBudgetLedgersRaw(normalizeBudgetLedgers(load(`${userKey}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)));
    setBudgetBucketsRaw(normalizeBudgetBuckets(load(`${userKey}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)));
    setBudgetTransactionsRaw(normalizeBudgetTransactions(load(`${userKey}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)));
    setBonusAllocationRulesRaw(normalizeBonusAllocationRules(load(`${userKey}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)));

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
        hiddenCalendarSources: Array.isArray(safeSettings.hiddenCalendarSources) ? safeSettings.hiddenCalendarSources : load(`${userKey}_hidden_calendar_sources`, ["habit"]),
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
        appMode: safeSettings.appMode ?? load(`${userKey}_app_mode`, "schedule"),
        budgetProfile: normalizeBudgetProfile(safeSettings.budgetProfile ?? load(`${userKey}_budget_profile`, DEFAULT_BUDGET_PROFILE)),
        budgetAccounts: normalizeBudgetAccounts(safeSettings.budgetAccounts ?? load(`${userKey}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)),
        budgetLedgers: normalizeBudgetLedgers(safeSettings.budgetLedgers ?? load(`${userKey}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)),
        budgetBuckets: normalizeBudgetBuckets(safeSettings.budgetBuckets ?? load(`${userKey}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)),
        budgetTransactions: normalizeBudgetTransactions(safeSettings.budgetTransactions ?? load(`${userKey}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)),
        bonusAllocationRules: normalizeBonusAllocationRules(safeSettings.bonusAllocationRules ?? load(`${userKey}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)),
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
      setHiddenCalendarSources(Array.isArray(nextSettings.hiddenCalendarSources) ? nextSettings.hiddenCalendarSources : ["habit"]);
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
      setAppModeRaw(["schedule", "budget", "overall"].includes(nextSettings.appMode) ? nextSettings.appMode : "schedule");
      setBudgetProfileRaw(normalizeBudgetProfile(nextSettings.budgetProfile));
      setBudgetAccountsRaw(normalizeBudgetAccounts(nextSettings.budgetAccounts));
      setBudgetLedgersRaw(normalizeBudgetLedgers(nextSettings.budgetLedgers));
      setBudgetBucketsRaw(normalizeBudgetBuckets(nextSettings.budgetBuckets));
      setBudgetTransactionsRaw(normalizeBudgetTransactions(nextSettings.budgetTransactions));
      setBonusAllocationRulesRaw(normalizeBonusAllocationRules(nextSettings.bonusAllocationRules));
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
      save(`${userKey}_app_mode`, ["schedule", "budget", "overall"].includes(nextSettings.appMode) ? nextSettings.appMode : "schedule");
      save(`${userKey}_budget_profile`, normalizeBudgetProfile(nextSettings.budgetProfile));
      save(`${userKey}_budget_accounts`, normalizeBudgetAccounts(nextSettings.budgetAccounts));
      save(`${userKey}_budget_ledgers`, normalizeBudgetLedgers(nextSettings.budgetLedgers));
      save(`${userKey}_budget_buckets`, normalizeBudgetBuckets(nextSettings.budgetBuckets));
      save(`${userKey}_budget_transactions`, normalizeBudgetTransactions(nextSettings.budgetTransactions));
      save(`${userKey}_bonus_allocation_rules`, normalizeBonusAllocationRules(nextSettings.bonusAllocationRules));
      save(`${userKey}_data_migration_version`, Number(nextSettings.dataMigrationVersion || 0));
      save(`${userKey}_memory_storage_migrated_at`, nextSettings.memoryStorageMigratedAt || null);
      save(`${userKey}_planning_rules`, normalizePlanningRules(nextSettings.planningRules));
      save(`${userKey}_settings_updated_at`, normalizeSettingsUpdatedAt(nextSettings.settingsUpdatedAt));
      save(`${userKey}_deleted_records`, normalizeDeletedRecords(nextSettings.deletedRecords));
      save(`${userKey}_calendars`, normalizeCalendars(nextSettings.calendars));
      save(`${userKey}_hidden_cals`, Array.isArray(nextSettings.hiddenCals) ? nextSettings.hiddenCals : []);
      save(`${userKey}_hidden_calendar_sources`, Array.isArray(nextSettings.hiddenCalendarSources) ? nextSettings.hiddenCalendarSources : ["habit"]);
      saveJournalLocal(userKey, userId, nextSettings.journal || {});
      setWorkHoursCtx(Number(nextSettings.workStart), Number(nextSettings.workEnd));
      setStreak(computeAndSaveStreak(userKey));
      setLoadedUserId(userId);
      setDataReady(true);
    };

    const fallbackTimer = setTimeout(async () => {
      if (cancelled) return;
      cloudHydrationRef.current = { usingFallback: true, cloudResolved: false };
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
          hiddenCalendarSources: load(`${userKey}_hidden_calendar_sources`, ["habit"]),
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
          appMode: load(`${userKey}_app_mode`, "schedule"),
          budgetProfile: normalizeBudgetProfile(load(`${userKey}_budget_profile`, DEFAULT_BUDGET_PROFILE)),
          budgetAccounts: normalizeBudgetAccounts(load(`${userKey}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)),
          budgetLedgers: normalizeBudgetLedgers(load(`${userKey}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)),
          budgetBuckets: normalizeBudgetBuckets(load(`${userKey}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)),
          budgetTransactions: normalizeBudgetTransactions(load(`${userKey}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)),
          bonusAllocationRules: normalizeBonusAllocationRules(load(`${userKey}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)),
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
      cloudHydrationRef.current.cloudResolved = true;

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
          hiddenCalendarSources: load(`${userKey}_hidden_calendar_sources`, ["habit"]),
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
          appMode: load(`${userKey}_app_mode`, "schedule"),
          budgetProfile: normalizeBudgetProfile(load(`${userKey}_budget_profile`, DEFAULT_BUDGET_PROFILE)),
          budgetAccounts: normalizeBudgetAccounts(load(`${userKey}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)),
          budgetLedgers: normalizeBudgetLedgers(load(`${userKey}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)),
          budgetBuckets: normalizeBudgetBuckets(load(`${userKey}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)),
          budgetTransactions: normalizeBudgetTransactions(load(`${userKey}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)),
          bonusAllocationRules: normalizeBonusAllocationRules(load(`${userKey}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)),
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
          hiddenCalendarSources: load(`${userKey}_hidden_calendar_sources`, ["habit"]),
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
          appMode: load(`${userKey}_app_mode`, "schedule"),
          budgetProfile: normalizeBudgetProfile(load(`${userKey}_budget_profile`, DEFAULT_BUDGET_PROFILE)),
          budgetAccounts: normalizeBudgetAccounts(load(`${userKey}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)),
          budgetLedgers: normalizeBudgetLedgers(load(`${userKey}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)),
          budgetBuckets: normalizeBudgetBuckets(load(`${userKey}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)),
          budgetTransactions: normalizeBudgetTransactions(load(`${userKey}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)),
          bonusAllocationRules: normalizeBonusAllocationRules(load(`${userKey}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)),
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
          appMode: "schedule",
          budgetProfile: normalizeBudgetProfile(DEFAULT_BUDGET_PROFILE),
          budgetAccounts: normalizeBudgetAccounts(DEFAULT_BUDGET_ACCOUNTS),
          budgetLedgers: normalizeBudgetLedgers(DEFAULT_BUDGET_LEDGERS),
          budgetBuckets: normalizeBudgetBuckets(DEFAULT_BUDGET_BUCKETS),
          budgetTransactions: normalizeBudgetTransactions(DEFAULT_BUDGET_TRANSACTIONS),
          bonusAllocationRules: normalizeBonusAllocationRules(DEFAULT_BONUS_ALLOCATION_RULES),
          dataMigrationVersion: Core.DATA_MIGRATION_VERSION,
          memoryStorageMigratedAt: null,
          journal: {},
        };
        await applyLoadedData({ loadedEvents: [], loadedTasks: [], settings: blankSettings, updatedAt: new Date().toISOString() });
        saveToCloud(userId, [], [], blankSettings);
      }
    }).catch(async () => {
      clearTimeout(fallbackTimer);
      cloudHydrationRef.current = { usingFallback: true, cloudResolved: true };
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
          hiddenCalendarSources: load(`${userKey}_hidden_calendar_sources`, ["habit"]),
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
          appMode: load(`${userKey}_app_mode`, "schedule"),
          budgetProfile: normalizeBudgetProfile(load(`${userKey}_budget_profile`, DEFAULT_BUDGET_PROFILE)),
          budgetAccounts: normalizeBudgetAccounts(load(`${userKey}_budget_accounts`, DEFAULT_BUDGET_ACCOUNTS)),
          budgetLedgers: normalizeBudgetLedgers(load(`${userKey}_budget_ledgers`, DEFAULT_BUDGET_LEDGERS)),
          budgetBuckets: normalizeBudgetBuckets(load(`${userKey}_budget_buckets`, DEFAULT_BUDGET_BUCKETS)),
          budgetTransactions: normalizeBudgetTransactions(load(`${userKey}_budget_transactions`, DEFAULT_BUDGET_TRANSACTIONS)),
          bonusAllocationRules: normalizeBonusAllocationRules(load(`${userKey}_bonus_allocation_rules`, DEFAULT_BONUS_ALLOCATION_RULES)),
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
    hiddenCalendarSources: Array.isArray(hiddenCalendarSources) ? hiddenCalendarSources : [],
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
    appMode: ["schedule", "budget", "overall"].includes(appMode) ? appMode : "schedule",
    budgetProfile: normalizeBudgetProfile(budgetProfile),
    budgetAccounts: normalizeBudgetAccounts(budgetAccounts),
    budgetLedgers: normalizeBudgetLedgers(budgetLedgers),
    budgetBuckets: normalizeBudgetBuckets(budgetBuckets),
    budgetTransactions: normalizeBudgetTransactions(budgetTransactions),
    bonusAllocationRules: normalizeBonusAllocationRules(bonusAllocationRules),
    dataMigrationVersion: Math.max(Number(dataMigrationVersion || 0), Core.DATA_MIGRATION_VERSION),
    memoryStorageMigratedAt,
    journal,
    ...overrides,
  });

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
        appMode: ["schedule", "budget", "overall"].includes(nextSettings?.appMode) ? nextSettings.appMode : (["schedule", "budget", "overall"].includes(appMode) ? appMode : "schedule"),
        budgetProfile: normalizeBudgetProfile(nextSettings?.budgetProfile || budgetProfile),
        budgetAccounts: normalizeBudgetAccounts(nextSettings?.budgetAccounts || budgetAccounts),
        budgetLedgers: normalizeBudgetLedgers(nextSettings?.budgetLedgers || budgetLedgers),
        budgetBuckets: normalizeBudgetBuckets(nextSettings?.budgetBuckets || budgetBuckets),
        budgetTransactions: normalizeBudgetTransactions(nextSettings?.budgetTransactions || budgetTransactions),
        bonusAllocationRules: normalizeBonusAllocationRules(nextSettings?.bonusAllocationRules || bonusAllocationRules),
        dataMigrationVersion: Math.max(Number(nextSettings?.dataMigrationVersion || dataMigrationVersion || 0), Core.DATA_MIGRATION_VERSION),
        mealBreaks: normalizeMealBreaks(nextSettings?.mealBreaks || mealBreaks),
        planningRules: normalizePlanningRules(nextSettings?.planningRules || planningRules),
        settingsUpdatedAt: normalizeSettingsUpdatedAt(nextSettings?.settingsUpdatedAt || settingsUpdatedAt),
        deletedRecords: normalizeDeletedRecords(nextSettings?.deletedRecords || deletedRecords),
        calendars: normalizeCalendars(nextSettings?.calendars || calendars),
        hiddenCals: Array.isArray(nextSettings?.hiddenCals) ? nextSettings.hiddenCals : (Array.isArray(hiddenCals) ? hiddenCals : []),
        hiddenCalendarSources: Array.isArray(nextSettings?.hiddenCalendarSources) ? nextSettings.hiddenCalendarSources : (Array.isArray(hiddenCalendarSources) ? hiddenCalendarSources : []),
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
      setHiddenCalendarSources(Array.isArray(normalizedSettings.hiddenCalendarSources) ? normalizedSettings.hiddenCalendarSources : ["habit"]);
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
      setAppModeRaw(["schedule", "budget", "overall"].includes(normalizedSettings.appMode) ? normalizedSettings.appMode : "schedule");
      setBudgetProfileRaw(normalizeBudgetProfile(normalizedSettings.budgetProfile));
      setBudgetAccountsRaw(normalizeBudgetAccounts(normalizedSettings.budgetAccounts));
      setBudgetLedgersRaw(normalizeBudgetLedgers(normalizedSettings.budgetLedgers));
      setBudgetBucketsRaw(normalizeBudgetBuckets(normalizedSettings.budgetBuckets));
      setBudgetTransactionsRaw(normalizeBudgetTransactions(normalizedSettings.budgetTransactions));
      setBonusAllocationRulesRaw(normalizeBonusAllocationRules(normalizedSettings.bonusAllocationRules));
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
      save(`${uk}_hidden_calendar_sources`, Array.isArray(normalizedSettings.hiddenCalendarSources) ? normalizedSettings.hiddenCalendarSources : ["habit"]);
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
      save(`${uk}_app_mode`, ["schedule", "budget", "overall"].includes(normalizedSettings.appMode) ? normalizedSettings.appMode : "schedule");
      save(`${uk}_budget_profile`, normalizeBudgetProfile(normalizedSettings.budgetProfile));
      save(`${uk}_budget_accounts`, normalizeBudgetAccounts(normalizedSettings.budgetAccounts));
      save(`${uk}_budget_ledgers`, normalizeBudgetLedgers(normalizedSettings.budgetLedgers));
      save(`${uk}_budget_buckets`, normalizeBudgetBuckets(normalizedSettings.budgetBuckets));
      save(`${uk}_budget_transactions`, normalizeBudgetTransactions(normalizedSettings.budgetTransactions));
      save(`${uk}_bonus_allocation_rules`, normalizeBonusAllocationRules(normalizedSettings.bonusAllocationRules));
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


  useTempoRealtimeSync({ userId: auth.user?.id, userKey: uk, dataReady, forceSyncNow });

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
    save(`${uk}_hidden_calendar_sources`, Array.isArray(next.hiddenCalendarSources) ? next.hiddenCalendarSources : ["habit"]);
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
    save(`${uk}_app_mode`, ["schedule", "budget", "overall"].includes(next.appMode) ? next.appMode : "schedule");
    save(`${uk}_budget_profile`, normalizeBudgetProfile(next.budgetProfile));
    save(`${uk}_budget_accounts`, normalizeBudgetAccounts(next.budgetAccounts));
    save(`${uk}_budget_ledgers`, normalizeBudgetLedgers(next.budgetLedgers));
    save(`${uk}_budget_buckets`, normalizeBudgetBuckets(next.budgetBuckets));
    save(`${uk}_budget_transactions`, normalizeBudgetTransactions(next.budgetTransactions));
    save(`${uk}_bonus_allocation_rules`, normalizeBonusAllocationRules(next.bonusAllocationRules));
    save(`${uk}_data_migration_version`, Number(next.dataMigrationVersion || 0));
    save(`${uk}_memory_storage_migrated_at`, next.memoryStorageMigratedAt || null);
    saveJournalLocal(uk, auth.user?.id, next.journal ?? journal);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user) {
      queueCloudSave(events, tasks, next);
    }
  };

  const persistBudgetSettings = overrides => {
    const next = currentSettings(overrides);
    save(`${uk}_app_mode`, ["schedule", "budget", "overall"].includes(next.appMode) ? next.appMode : "schedule");
    save(`${uk}_budget_profile`, normalizeBudgetProfile(next.budgetProfile));
    save(`${uk}_budget_accounts`, normalizeBudgetAccounts(next.budgetAccounts));
    save(`${uk}_budget_ledgers`, normalizeBudgetLedgers(next.budgetLedgers));
    save(`${uk}_budget_buckets`, normalizeBudgetBuckets(next.budgetBuckets));
    save(`${uk}_budget_transactions`, normalizeBudgetTransactions(next.budgetTransactions));
    save(`${uk}_bonus_allocation_rules`, normalizeBonusAllocationRules(next.bonusAllocationRules));
    save(`${uk}_updated_at`, new Date().toISOString());
    if (auth.user && dataReady) queueCloudSave(events, tasks, next);
    else markPendingLocalChange();
  };

  const setAppMode = mode => {
    const next = ["schedule", "budget", "overall"].includes(mode) ? mode : "schedule";
    setAppModeRaw(next);
    persistBudgetSettings({ appMode: next });
    closeSidebarOnMobile();
  };
  const setBudgetProfile = value => { const next = normalizeBudgetProfile(typeof value === "function" ? value(budgetProfile) : value); setBudgetProfileRaw(next); persistBudgetSettings({ budgetProfile: next }); };
  const setBudgetAccounts = value => { const next = normalizeBudgetAccounts(typeof value === "function" ? value(budgetAccounts) : value); setBudgetAccountsRaw(next); persistBudgetSettings({ budgetAccounts: next }); };
  const setBudgetLedgers = value => { const next = normalizeBudgetLedgers(typeof value === "function" ? value(budgetLedgers) : value); setBudgetLedgersRaw(next); persistBudgetSettings({ budgetLedgers: next }); };
  const setBudgetBuckets = value => { const next = normalizeBudgetBuckets(typeof value === "function" ? value(budgetBuckets) : value); setBudgetBucketsRaw(next); persistBudgetSettings({ budgetBuckets: next }); };


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

  useEffect(() => {
    if (!auth.user?.id || !dataReady) return;
    refreshGoogleCalendarStatus({ silent: true });
    // Google status should refresh only after auth/data readiness changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id, dataReady]);


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
    return enableClosedPushNotificationsForUser({
      userId: auth.user?.id,
      registerTempoPushNotifications,
      showToast,
      logger: console,
    });
  }

  function applyGoogleCalendarPayload(payload = {}) {
    const derived = deriveGoogleCalendarPayloadState(payload, { calendars, prevGoogleSync: googleSync });
    if (derived.shouldUpdateCalendars) {
      setCalendarsRaw(derived.nextCalendars);
      save(`${uk}_calendars`, derived.nextCalendars);
    }
    if (derived.hiddenCals) {
      setHiddenCals(derived.hiddenCals);
      save(`${uk}_hidden_cals`, derived.hiddenCals);
    }
    if (derived.events) {
      setEvRaw(derived.events);
      save(`${uk}_ev`, derived.events);
      markUpdated();
    }
    setGoogleSync(derived.googleSync);
  }

  const googleCalendarRequest = (path, options = {}) => requestGoogleCalendar(getSupabase, path, options);

  async function refreshGoogleCalendarStatus({ silent = false } = {}) {
    if (!auth.user?.id) return;
    if (!silent) setGoogleSync(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await googleCalendarRequest("status");
      applyGoogleCalendarPayload(data);
      setGoogleSync(prev => ({ ...prev, connected: Boolean(data.connected), loading: false, message: data.connected ? "Google Calendar is ready." : "Connect Google Calendar to import events.", error: "" }));
    } catch (err) {
      console.warn("Google Calendar status failed", err);
      setGoogleSync(prev => ({ ...prev, loading: false, error: err.message || "Could not check Google Calendar status" }));
    }
  }

  async function connectGoogleCalendar() {
    if (!auth.user?.id) {
      showToast("Sign in before connecting Google Calendar.");
      return;
    }
    try {
      const returnTo = `${window.location.pathname || "/"}?page=calendar`;
      const data = await googleCalendarRequest(`auth/start?returnTo=${encodeURIComponent(returnTo)}`, { method: "POST" });
      if (!data?.url) throw new Error("Could not start Google Calendar connection.");
      window.location.href = data.url;
    } catch (err) {
      console.warn("Google Calendar connect failed", err);
      showToast(err.message || "Could not start Google Calendar connection.");
    }
  }

  async function importGoogleCalendarNow() {
    if (!auth.user?.id) return;
    setGoogleSync(prev => ({ ...prev, loading: true, error: "", message: "Importing Google Calendar…" }));
    try {
      const data = await googleCalendarRequest("sync", {
        method: "POST",
        body: JSON.stringify({}),
      });
      applyGoogleCalendarPayload(data);
      setToast({ text: formatGoogleImportToast(data), ts: Date.now() });
    } catch (err) {
      console.warn("Google Calendar import failed", err);
      setGoogleSync(prev => ({ ...prev, loading: false, error: err.message || "Google import failed", message: "" }));
      showToast(err.message || "Google import failed");
    }
  }

  async function disconnectGoogleCalendar() {
    if (!auth.user?.id) return;
    const importedCount = countImportedGoogleEvents(events);
    const warning = googleDisconnectWarning(importedCount);
    if (!window.confirm(warning)) return;
    setGoogleSync(prev => ({ ...prev, loading: true, error: "", message: "Disconnecting Google Calendar…" }));
    try {
      const data = await googleCalendarRequest("disconnect", {
        method: "POST",
        body: JSON.stringify({}),
      });
      applyGoogleCalendarPayload({ ...data, connected: false, calendars: data.settings?.calendars || [], hiddenCals: data.settings?.hiddenCals || [], events: data.events || [] });
      setGoogleSync({ connected: false, calendars: [], loading: false, message: "Google Calendar disconnected.", error: "", lastImportAt: null, googleCalendarSync: null });
      showToast("Google Calendar disconnected ✓");
    } catch (err) {
      console.warn("Google Calendar disconnect failed", err);
      setGoogleSync(prev => ({ ...prev, loading: false, error: err.message || "Disconnect failed", message: "" }));
    }
  }

  async function updateGoogleCalendarPreference(calendarId, patch) {
    if (!auth.user?.id) return;
    setGoogleSync(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const data = await googleCalendarRequest("calendars", {
        method: "POST",
        body: JSON.stringify({ calendarId, patch }),
      });
      applyGoogleCalendarPayload(data);
      setGoogleSync(prev => ({ ...prev, loading: false, message: "Google calendar preference updated.", error: "" }));
    } catch (err) {
      console.warn("Google calendar preference failed", err);
      setGoogleSync(prev => ({ ...prev, loading: false, error: err.message || "Could not update Google calendar preference" }));
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
  // Ritual mutation handlers removed: rituals are legacy sync data only.

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

  const calendarSourceVisible = source => !hiddenCalendarSources.includes(source);
  const toggleCalendarSource = source => {
    const next = hiddenCalendarSources.includes(source)
      ? hiddenCalendarSources.filter(item => item !== source)
      : [...hiddenCalendarSources, source];
    setHiddenCalendarSources(next);
    save(`${uk}_hidden_calendar_sources`, next);
    persistSettings({ hiddenCalendarSources: next });
  };

  function habitReminderEventsForRange(startDate, endDate) {
    if (!calendarSourceVisible("habit")) return [];
    const start = dayStart(startDate);
    const end = dayStart(endDate);
    const out = [];
    const activeHabits = normalizeHabits(habits).filter(h => !h.archived && !h.deletedAt);
    for (let cursor = new Date(start); cursor <= end; cursor = addDaysSafe(cursor, 1)) {
      activeHabits.forEach(habit => {
        if (!habitRunsOnDate(habit, cursor)) return;
        const reminder = normalizeHabitReminder(habit.reminder);
        if (reminder.type === "none" || !reminder.time) return;
        const st = dayStart(cursor);
        st.setMinutes(timeStringToMinutes(reminder.time));
        const en = new Date(st.getTime() + 10 * 60000);
        out.push({
          id: `habit-reminder-${habit.id}-${dateKey(cursor)}`,
          title: `Habit: ${habit.name}`,
          start: st,
          end: en,
          allDay: false,
          calendar: "personal",
          category: habit.category || "personal",
          fixed: true,
          readOnly: true,
          source: "habit",
          color: habit.color || null,
          notes: "Habit reminder shown only inside Tempo. It is not synced to Google Calendar.",
          habitId: habit.id,
        });
      });
    }
    return out;
  }

  const addCalendar = () => {
    setCalendarEditor({ mode: "add", calendar: { name: "New Calendar", color: "#FF7BAC", source: "tempo", account: null } });
  };

  const editCalendar = cal => {
    setCalendarEditor({ mode: "edit", calendar: cal });
  };

  const requestRemoveCalendar = cal => {
    if (cal.source === "google") {
      setToast({ text: "Google calendars can be hidden or managed in Settings", ts: Date.now() });
      return;
    }
    setCalendarEditor({ mode: "delete", calendar: cal });
  };

  const saveCalendarFromModal = cal => {
    const now = new Date().toISOString();
    if (!cal?.id) {
      const name = String(cal?.name || "New Calendar").trim() || "New Calendar";
      const baseId = name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "calendar";
      let id = baseId, i = 2;
      while (calendars.some(c => c.id === id)) id = `${baseId}-${i++}`;
      persistCalendarConfig([...calendars, { id, name, color: cleanCalendarColor(cal?.color), source: "tempo", account: null, readOnly: false, visible: true, syncEnabled: true, createdAt: now, updatedAt: now }], hiddenCals);
    } else {
      persistCalendarConfig(calendars.map(c => {
        if (c.id !== cal.id) return c;
        const isGoogle = c.source === "google";
        return {
          ...c,
          name: isGoogle ? c.name : (String(cal.name || "").trim() || c.name),
          color: cleanCalendarColor(cal.color || c.color),
          updatedAt: now,
        };
      }), hiddenCals);
    }
    setCalendarEditor(null);
  };

  const removeCalendar = cal => {
    if (cal.source === "google") { setToast({ text: "Google calendars can be hidden or managed in Settings", ts: Date.now() }); return; }
    if (calendars.length <= 1) { setToast({ text: "Keep at least one calendar", ts: Date.now() }); return; }
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
    setCalendarEditor(null);
  };
  const saveMemoryPhotoCleanupQueue = useCallback((queue) => {
    const clean = buildJournalPhotoCleanupQueue([], (Array.isArray(queue) ? queue.map(item => item?.path || item) : []));
    const byPath = new Map(clean.map(item => [item.path, item]));
    (Array.isArray(queue) ? queue : []).forEach(item => {
      if (item?.path && byPath.has(item.path)) byPath.set(item.path, { ...byPath.get(item.path), ...item });
    });
    const next = [...byPath.values()].slice(-200);
    setMemoryPhotoCleanupQueueRaw(next);
    save(`${uk}_memory_photo_cleanup_queue`, next);
    return next;
  }, [uk]);

  const enqueueMemoryPhotoCleanup = useCallback((paths = [], reason = "orphaned") => {
    const cleanPaths = [...new Set((Array.isArray(paths) ? paths : []).filter(Boolean))];
    if (!cleanPaths.length) return;
    setMemoryPhotoCleanupQueueRaw(current => {
      const next = buildJournalPhotoCleanupQueue(current, cleanPaths, reason);
      save(`${uk}_memory_photo_cleanup_queue`, next);
      return next;
    });
  }, [uk]);

  useEffect(() => {
    if (!auth.user?.id || !dataReady || memoryPhotoCleanupRunningRef.current) return;
    const retryAfterMs = 10 * 60 * 1000;
    const nowMs = Date.now();
    const fullQueue = (Array.isArray(memoryPhotoCleanupQueue) ? memoryPhotoCleanupQueue : []).filter(item => item?.path);
    const queue = fullQueue.filter(item => {
      const last = item.lastTriedAt ? new Date(item.lastTriedAt).getTime() : 0;
      return !last || !Number.isFinite(last) || (nowMs - last) >= retryAfterMs;
    });
    if (!queue.length) return;
    memoryPhotoCleanupRunningRef.current = true;
    let cancelled = false;
    (async () => {
      const attempted = queue.map(item => item.path);
      const result = await deleteMemoryStoragePathsDetailed(attempted);
      if (cancelled) return;
      const next = markJournalPhotoCleanupAttempt(fullQueue, attempted, result.deletedPaths || []);
      saveMemoryPhotoCleanupQueue(next);
      if (result.ok && attempted.length) showToast("Cleaned up old Journal photos ✓");
    })().catch(err => console.warn("Journal photo cleanup retry failed", err)).finally(() => {
      memoryPhotoCleanupRunningRef.current = false;
    });
    return () => { cancelled = true; };
  }, [auth.user?.id, dataReady, memoryPhotoCleanupQueue, saveMemoryPhotoCleanupQueue, showToast]);

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
    setJournalRaw(clean);
    await saveJournalLocal(uk, auth.user?.id, clean);
    save(`${uk}_updated_at`, new Date().toISOString());
    if (auth.user && dataReady) {
      const ok = await queueCloudSave(events, tasks, currentSettings({ journal: clean }));
      if (!ok) setSyncStatus({ status: "failed", message: "Journal saved locally — sync pending", lastError: "Cloud save failed" });
      return true;
    }
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

  function freeSlotsForDate(date, extraEvents = [], rulesOverride = null, options = {}) {
    const safeExtraEvents = Array.isArray(extraEvents) ? extraEvents : [];
    const clampToNow = options?.clampToNow !== false;
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
        const start = clampToNow && sameDay(date, now) && blockStart < roundedNow ? roundedNow : blockStart;
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

  async function duplicateEvent(ev) {
    if (!ev) return false;
    const clean = stripOccurrenceMeta(ev);
    const start = clean.start instanceof Date ? new Date(clean.start) : new Date(clean.start);
    const end = clean.end instanceof Date ? new Date(clean.end) : new Date(clean.end);
    const duplicated = {
      ...clean,
      id: "e" + uid(),
      title: `${String(clean.title || "Untitled Event").replace(/\s+copy$/i, "")} copy`,
      start,
      end,
      source: "tempo",
      readOnly: false,
      googleEventId: null,
      googleCalendarId: null,
      googleHtmlLink: null,
      googleUpdatedAt: null,
      recurrence: null,
      copiedFrom: clean.id || clean.title || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!(await confirmEventPlacement(duplicated, duplicated.id, "Duplicate event"))) return false;
    await addEvent(duplicated, { skipConflictCheck: true });
    setToast({ text: `Duplicated “${clean.title || "event"}” ✓`, ts: Date.now() });
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
      else if (k === "s") setSettingsOpen(v => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // Include events, tasks, and undo so the undo handler always operates on current state
  }, [view, page, settingsOpen, showShortcuts, showSearch, undoStack, events, tasks, taskScope, viewDate]);

  // Show boot spinner while checking existing session
  if (auth.loading && !auth.user) return (
    <>
      <style>{loginCSS}</style>
      <TempoLoadingScreen />
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
      <TempoLoadingScreen message="Loading your schedule…" />
    </>
  );

  const rangeStart = view === "month" ? new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) : view === "week" ? weekStart(viewDate) : viewDate;
  const rangeEnd = view === "month" ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0) : view === "week" ? addDaysSafe(weekStart(viewDate), 6) : viewDate;
  const sourceForEvent = event => calendarEventSource(event, calendars.find(c => c.id === event.calendar));
  const eventSourceVisible = event => calendarSourceVisible(sourceForEvent(event));
  const habitReminderEvents = habitReminderEventsForRange(rangeStart, rangeEnd);
  const calendarDisplayEvents = [...events.filter(eventSourceVisible), ...habitReminderEvents];
  const expandedEvents  = expandRecurring(calendarDisplayEvents, rangeStart, rangeEnd);
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
  const todayFreeSlots = freeSlotsForDate(TODAY, [], null, { clampToNow: false });
  const dayFreeMinutes = todayFreeSlots.reduce((sum, slot) => sum + slot.minutes, 0);
  const todayDashboardEvents = expandRecurring([...events.filter(eventSourceVisible), ...habitReminderEventsForRange(TODAY, TODAY)], dayStart(TODAY), addDaysSafe(dayStart(TODAY), 1))
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
  const sidebarTodayCheckIn = dailyCheckInForDate(dailyCheckIns, TODAY);
  const sidebarMood = sidebarTodayCheckIn?.mood ? DAILY_CHECKIN_MOODS.find(x => x.id === sidebarTodayCheckIn.mood) : null;
  const sidebarEnergy = sidebarTodayCheckIn?.energy ? DAILY_CHECKIN_ENERGIES.find(x => x.id === sidebarTodayCheckIn.energy) : null;
  const sidebarCheckInSummary = sidebarMood ? {
    emoji: sidebarMood.emoji,
    label: sidebarMood.label,
    energyLabel: sidebarEnergy?.label || "",
  } : null;
  const calendarTopbarTitle = view === "day" ? fmtDate(viewDate) : view === "week" ? (() => {
    const mon = new Date(viewDate);
    mon.setDate(viewDate.getDate() - viewDate.getDay() + 1);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `${formatWithDisplayTimezone(mon, { month: "short", day: "numeric" })} – ${formatWithDisplayTimezone(sun, { month: "short", day: "numeric" })}`;
  })() : formatWithDisplayTimezone(viewDate, { month: "long", year: "numeric" });
  const budgetSummary = calculateBudgetSummary({
    profile: budgetProfile,
    accounts: budgetAccounts,
    ledgers: budgetLedgers,
    buckets: budgetBuckets,
    transactions: budgetTransactions,
  });
  const overallRhythmSummary = buildRhythmStatsSnapshot({ tasks, habits, habitCompletions, journal, dailyCheckIns, tomorrowResets, weeklyResets, categories });

  function navigateFromSidebar(nextPage) {
    setAppMode("schedule");
    setPage(nextPage);
    closeSidebarOnMobile();
  }

  function navigateFromMobileNav(nextPage) {
    setAppMode("schedule");
    setPage(nextPage);
    setSidebarOpen(false);
  }

  function shiftCalendarRange(direction) {
    const d = new Date(viewDate);
    if (view === "day") d.setDate(d.getDate() + direction);
    if (view === "week") d.setDate(d.getDate() + direction * 7);
    if (view === "month") d.setMonth(d.getMonth() + direction);
    setViewDate(d);
  }

  const goToPreviousCalendarRange = () => shiftCalendarRange(-1);
  const goToNextCalendarRange = () => shiftCalendarRange(1);

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
    .dark .mobile-nav{background:var(--dark-nav)!important;border-color:rgba(var(--accent-rgb),.34)!important;}
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
  .add-event-btn,.tf-save,.plan-day-btn,.chat-send{background:linear-gradient(135deg,var(--accent),#C99284)!important;box-shadow:0 12px 28px rgba(var(--accent-rgb),.22)!important;}
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

  .dark .phase-card,.dark .task-period-card,.dark .task-panel.standalone,.dark .tomorrow-reset-card.page-card,.dark .tomorrow-reset-section,.dark .weekly-reset-panel,.dark .stats-card,.dark .daily-quests-card,.dark .badges-card,.dark .game-soft-card,.dark .bloom-collapse,.dark .reflection-hub-card,.dark .checkin-rhythm-card,.dark .tomorrow-reset-rhythm-card,.dark .weekly-reset-rhythm-card,.dark .affirmation-feature-card,.dark .affirmation-list-card,.dark .affirmation-daily-card,.dark .affirmation-rhythm-card,.dark .journal-reflection-hub,.dark .journal-checkin-card,.dark .journal-reset-card,.dark .memory-page-card,.dark .plan-task-picker,.dark .modal,.dark .checkin-modal,.dark .entry-modal,.dark .entry-view-modal,.dark .settings-panel,.dark .templates-panel,.dark .search-modal{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.28)!important;box-shadow:0 18px 45px rgba(0,0,0,.34)!important;}
  .dark .topbar,.dark .stats-bar,.dark .sidebar,.dark .journal-header{background:var(--dark-panel)!important;border-color:rgba(var(--accent-rgb),.28)!important;}
  .dark .ritual-step,.dark .habit-week-grid>*,.dark .plan-task-choice,.dark .tomorrow-reset-task,.dark .task-item,.dark .journal-entry-card,.dark .quest-item,.dark .badge-chip,.dark .weekly-mini-grid div,.dark .tomorrow-reset-mini-grid div,.dark .journal-reflection-tile,.dark .affirmation-stats-grid div,.dark .rhythm-mini-panel,.dark .rhythm-insight-card,.dark .stat-big,.dark .rhythm-chip-row,.dark .rhythm-category-row{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;}


  /* ── Phase 21 + debug hotfixes ───────────────────────────────────────── */
  .content-area{min-height:0!important;}
  .calendar-pane{min-height:0!important;}
  .calendar-pane.view-day,.calendar-pane.view-week{display:block!important;overflow-y:auto!important;min-height:0!important;height:100%!important;padding-bottom:34px!important;}
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



/* ── Mobile journal viewer spacing: keep equal top/bottom breathing room ── */
@media(max-width:768px){
  .modal-overlay[aria-label="View journal entry"]{
    position:fixed!important;
    inset:0 0 var(--mobile-nav-h,78px) 0!important;
    height:auto!important;
    min-height:0!important;
    padding:10px!important;
    align-items:center!important;
    justify-content:center!important;
    overflow:hidden!important;
    box-sizing:border-box!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal{
    width:calc(100vw - 20px)!important;
    max-width:calc(100vw - 20px)!important;
    height:calc(100dvh - var(--mobile-nav-h,78px) - 20px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 20px)!important;
    margin:0 auto!important;
    display:flex!important;
    flex-direction:column!important;
    overflow:hidden!important;
    box-sizing:border-box!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header{
    flex:0 0 auto!important;
    position:sticky!important;
    top:0!important;
    z-index:20!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-body{
    flex:1 1 auto!important;
    min-height:0!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    overscroll-behavior:contain!important;
    padding-bottom:18px!important;
  }
}

/* ── Current design/debug hotfixes ───────────────────────────────────────── */
.affirmation-daily-card .affirmation-quote-row{display:grid!important;grid-template-columns:minmax(0,1fr) 52px!important;align-items:center!important;justify-content:stretch!important;text-align:left!important;column-gap:14px!important;row-gap:0!important;}
.affirmation-daily-card .affirmation-quote-text{width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-width:0!important;}
.affirmation-daily-card .affirmation-quote-row blockquote{max-width:680px!important;margin:0 auto!important;text-align:center!important;width:100%!important;}
.affirmation-daily-card .affirmation-quote-icon{justify-self:end!important;align-self:center!important;display:grid!important;place-items:center!important;line-height:1!important;}
html.dark body,body.dark{background:var(--dark-page)!important;}
.dark .app,.dark .content-area,.dark .main{background:var(--dark-page)!important;}

.tempo-logo-sticker{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 4px 8px rgba(var(--accent-rgb),.20));}
.dark .sidebar,.dark .sidebar-logo,.dark .sidebar-date,.dark .settings-panel,.dark .settings-header,.dark .settings-body,.dark .settings-section,.dark .mobile-nav,.dark .memory-settings-modal,.dark .entry-modal,.dark .entry-view-modal{background:var(--dark-panel)!important;border-color:rgba(var(--accent-rgb),.30)!important;color:var(--text)!important;}
.dark .theme-swatch-btn,.dark .choice-row,.dark .memory-manager-panel,.dark .manager-group-card,.dark .manager-row,.dark .memory-bg-choice,.dark .sticker-asset-picker-row button,.dark .sticker-preview-chip,.dark .sticker-position-pad,.dark .scrapbook-empty-note,.dark .journal-reflection-tile,.dark .tomorrow-reset-section,.dark .weekly-event-preview span{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.28)!important;color:var(--text)!important;}
.dark .modal-footer,.dark .entry-modal-footer,.dark .chat-input-row{background:var(--dark-nav)!important;border-color:rgba(var(--accent-rgb),.28)!important;}
.dark .mobile-nav{box-shadow:0 -10px 28px rgba(0,0,0,.34)!important;}
.today-top3-card .today-empty-sugar img{width:150px!important;height:150px!important;max-width:52vw!important;max-height:52vw!important;}
.today-top3-card .today-empty-sugar{min-height:250px!important;}
@media(max-width:768px){
  .sidebar-sync-under-user .sync-pill{display:none!important;}
  .today-top3-card .today-empty-sugar img{width:150px!important;height:150px!important;}
  .today-top3-card .today-empty-sugar{min-height:230px!important;}
}

/* ── Logo + scrapbook photo support ───────────────────────────────────── */
.tempo-logo-emoji{display:inline;line-height:1;filter:none;}
.scrapbook-toolbar button:disabled{
  opacity:.48!important;
  cursor:not-allowed!important;
  filter:saturate(.65);
}
.scrapbook-canvas-item.scrapbook-photo,
.scrapbook-view-item.scrapbook-photo{
  background:rgba(255,255,255,.38);
  border-color:rgba(255,255,255,.76);
  box-shadow:0 12px 26px rgba(75,45,62,.16);
  overflow:hidden;
}
.scrapbook-canvas-photo,
.scrapbook-view-photo{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  border-radius:14px;
  background:rgba(255,255,255,.54);
}
.scrapbook-canvas-photo img,
.scrapbook-view-photo img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  pointer-events:none;
}
.scrapbook-photo-placeholder{
  display:grid;
  place-items:center;
  width:100%;
  height:100%;
  padding:10px;
  text-align:center;
  font-size:12px;
  font-weight:900;
  color:var(--text3);
  background:repeating-linear-gradient(135deg,rgba(var(--accent-rgb),.08) 0 8px,rgba(255,255,255,.42) 8px 16px);
}
.scrapbook-photo-controls{
  margin-top:12px;
  display:grid;
  gap:9px;
}
.scrapbook-photo-picker-title{
  font-size:10px;
  font-family:var(--mono);
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--text3);
}
.scrapbook-photo-picker{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(76px,1fr));
  gap:9px;
  max-height:220px;
  overflow-y:auto;
  padding:2px 2px 6px;
}
.scrapbook-photo-picker button{
  height:76px;
  border:1.5px solid var(--border);
  border-radius:16px;
  background:rgba(255,255,255,.70);
  padding:4px;
  cursor:pointer;
  overflow:hidden;
  box-shadow:0 6px 14px rgba(var(--accent-rgb),.06);
}
.scrapbook-photo-picker button.selected{
  border-color:var(--accent)!important;
  box-shadow:0 0 0 3px rgba(var(--accent-rgb),.14),0 8px 18px rgba(var(--accent-rgb),.10);
}
.scrapbook-photo-picker img{
  width:100%;
  height:100%;
  object-fit:cover;
  border-radius:12px;
  display:block;
}
.dark .scrapbook-canvas-item.scrapbook-photo,
.dark .scrapbook-view-item.scrapbook-photo{
  background:rgba(44,28,52,.66);
  border-color:rgba(var(--accent-rgb),.26);
}
.dark .scrapbook-canvas-photo,
.dark .scrapbook-view-photo{
  background:rgba(255,255,255,.06);
}
.dark .scrapbook-photo-picker button{
  background:var(--dark-field);
  border-color:rgba(var(--accent-rgb),.28);
}


/* Revert logo treatment after sticker-logo experiment */
.sidebar-logo .logo-icon{
  width:32px!important;
  height:32px!important;
  border-radius:10px!important;
  background:linear-gradient(135deg,var(--accent),var(--accent2))!important;
  border:0!important;
  padding:0!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:16px!important;
  line-height:1!important;
  overflow:visible!important;
}
.login-mascot .mascot-icon{
  width:auto!important;
  height:auto!important;
  border-radius:0!important;
  background:transparent!important;
  border:0!important;
  padding:0!important;
  display:block!important;
  place-items:initial!important;
  overflow:visible!important;
  font-size:34px!important;
  line-height:1!important;
}
.tempo-logo-emoji{display:inline!important;width:auto!important;height:auto!important;background:transparent!important;border:0!important;filter:none!important;transform:none!important;}


/* ── Google Calendar sync settings ─────────────────────────────────────── */
.google-calendar-settings{position:relative;}
.google-sync-status-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 12px;padding:10px 12px;border:1px solid var(--border);border-radius:16px;background:var(--bg3);}
.google-sync-dot{width:10px;height:10px;border-radius:999px;background:var(--text3);box-shadow:0 0 0 4px rgba(var(--accent-rgb),.08);}
.google-sync-dot.connected{background:#70C8A0;}
.google-sync-dot.disconnected{background:#D989A2;}
.google-sync-status-row strong{font-size:13px;color:var(--text);font-weight:900;}
.google-sync-status-row small{font-size:11px;color:var(--text3);font-weight:800;}
.google-sync-error{color:#B94D6A!important;}
.google-sync-actions{gap:8px;flex-wrap:wrap;}
.google-calendar-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
.google-calendar-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);background:rgba(255,255,255,.54);border-radius:16px;}
.google-calendar-color{width:13px;height:13px;border-radius:999px;box-shadow:0 0 0 3px rgba(var(--accent-rgb),.08);}
.google-calendar-meta{min-width:0;}
.google-calendar-meta strong{display:block;font-size:13px;color:var(--text);font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.google-calendar-meta small{display:block;font-size:10px;color:var(--text3);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;}
.google-calendar-row label{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2);font-weight:900;white-space:nowrap;}
.google-calendar-row input{accent-color:var(--accent);}
.dark .google-sync-status-row,.dark .google-calendar-row{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.28)!important;}
@media(max-width:640px){
  .google-calendar-row{grid-template-columns:auto minmax(0,1fr);align-items:flex-start;}
  .google-calendar-row label{grid-column:2;}
  .google-sync-actions button{width:100%;}
}


/* ── Calendar editor modal + color selector ────────────────────────────── */
.calendar-editor-overlay{z-index:2200!important;}
.calendar-editor-modal{
  width:min(440px,calc(100vw - 32px));
  max-height:90vh;
  overflow:auto;
  border:1.5px solid var(--border);
  border-radius:28px;
  background:linear-gradient(180deg,var(--surface),var(--surface-warm));
  box-shadow:0 26px 70px rgba(var(--accent-rgb),.18);
  padding:18px;
}
.calendar-editor-preview{
  display:flex;
  align-items:center;
  gap:12px;
  padding:12px;
  border:1px solid var(--border);
  border-radius:18px;
  background:var(--bg3);
  margin:10px 0 14px;
}
.calendar-editor-dot{
  width:28px;
  height:28px;
  border-radius:10px;
  box-shadow:0 0 0 4px rgba(var(--accent-rgb),.08),0 8px 18px rgba(0,0,0,.08);
  flex:0 0 auto;
}
.calendar-editor-preview strong{
  display:block;
  color:var(--text);
  font-size:15px;
  font-weight:950;
  line-height:1.15;
}
.calendar-editor-preview small{
  display:block;
  color:var(--text3);
  font-size:11px;
  font-weight:850;
  margin-top:3px;
}
.calendar-color-row{align-items:flex-start!important;}
.calendar-color-picker{
  display:flex;
  flex-direction:column;
  gap:12px;
  width:100%;
}
.calendar-color-presets{
  display:grid;
  grid-template-columns:repeat(6,minmax(0,1fr));
  gap:8px;
}
.calendar-color-swatch{
  width:100%;
  aspect-ratio:1;
  min-height:34px;
  border:2px solid rgba(255,255,255,.76);
  border-radius:13px;
  cursor:pointer;
  box-shadow:0 7px 16px rgba(0,0,0,.08);
  position:relative;
}
.calendar-color-swatch.selected{
  outline:3px solid rgba(var(--accent-rgb),.22);
  border-color:var(--accent);
}
.calendar-color-swatch.selected:after{
  content:"✓";
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  color:#fff;
  font-weight:950;
  text-shadow:0 1px 5px rgba(0,0,0,.35);
}
.calendar-native-color{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:10px 12px;
  border:1px solid var(--border);
  border-radius:16px;
  background:var(--bg3);
  color:var(--text2);
  font-size:12px;
  font-weight:900;
}
.calendar-native-color input{
  width:46px;
  height:34px;
  padding:0;
  border:0;
  background:transparent;
  cursor:pointer;
}
.calendar-delete-confirm{
  display:grid;
  gap:7px;
  margin-top:14px;
  padding:12px;
  border:1.5px solid rgba(185,77,106,.26);
  border-radius:18px;
  background:rgba(185,77,106,.08);
}
.calendar-delete-confirm strong{font-size:13px;color:var(--text);font-weight:950;}
.calendar-delete-confirm span{font-size:12px;color:var(--text2);font-weight:800;}
.dark .calendar-editor-modal{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.28)!important;}
.dark .calendar-editor-preview,.dark .calendar-native-color{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;}
@media(max-width:560px){
  .calendar-editor-modal{width:calc(100vw - 22px);padding:14px;border-radius:24px;}
  .calendar-color-presets{grid-template-columns:repeat(4,minmax(0,1fr));}
}


/* ── Phase 23: calendar polish ────────────────────────────────────────── */
.calendar-source-filter-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 10px;padding:0 2px;}
.calendar-source-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:6px 8px;font-size:10px;font-weight:900;cursor:pointer;}
.calendar-source-chip span{width:16px;height:16px;border-radius:999px;display:grid;place-items:center;background:rgba(var(--accent-rgb),.12);color:var(--accent);font-size:10px;}
.calendar-source-chip.source-hidden{opacity:.48;text-decoration:line-through;background:transparent;}
.event-source-notice{display:flex;align-items:center;gap:8px;padding:9px 11px;border:1px solid var(--border);border-radius:16px;background:var(--bg3);font-size:12px;color:var(--text2);font-weight:850;}
.event-source-notice>span,.event-source-label>span,.wt-event-source>span{width:18px;height:18px;border-radius:999px;display:grid;place-items:center;background:rgba(var(--accent-rgb),.14);color:var(--accent);font-size:10px;font-weight:950;}
.event-source-notice strong{color:var(--text);font-weight:950;}.event-source-notice em{font-style:normal;color:var(--text3);margin-left:auto;font-size:11px;}
.reference-field{font-size:12px;font-weight:850;color:var(--text3);}
.event-source-label,.wt-event-source{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:950;color:var(--text3);margin-top:3px;}
.event-block.event-source-google,.wt-event.event-source-google,.month-event-row.event-source-google{border-style:solid;border-top:1px solid rgba(66,133,244,.22)!important;border-right:1px solid rgba(66,133,244,.22)!important;border-bottom:1px solid rgba(66,133,244,.22)!important;}
.event-block.event-source-google{background:linear-gradient(135deg,rgba(66,133,244,.10),rgba(255,255,255,.16))!important;}
.wt-event.event-source-google{background:linear-gradient(135deg,rgba(66,133,244,.10),rgba(255,255,255,.13))!important;}
.event-block.event-source-habit,.wt-event.event-source-habit,.month-event-row.event-source-habit{border-style:dashed!important;opacity:.92;}
.reference-event{cursor:pointer!important;}
.event-resize-handle{position:absolute;left:10px;right:10px;bottom:2px;height:8px;border-radius:99px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.82),transparent);opacity:.0;cursor:ns-resize;}
.event-block:hover .event-resize-handle,.wt-event:hover .event-resize-handle{opacity:.9;}
.wt-resize-handle{left:6px;right:6px;height:7px;}
.polished-all-day-list{display:flex;gap:7px;flex-wrap:wrap;align-items:center;}
.all-day-label b{font-size:10px;padding:2px 6px;border-radius:999px;background:var(--bg4);color:var(--accent);margin-left:4px;}
.all-day-chip{display:inline-flex!important;align-items:center;gap:7px;max-width:100%;}
.all-day-chip-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.all-day-source-pill,.week-all-day-chip em{font-style:normal;font-size:9px;font-weight:950;line-height:1;border-radius:999px;padding:3px 6px;background:rgba(255,255,255,.58);color:inherit;opacity:.88;}
.week-all-day-cell{min-height:34px;padding:4px;display:flex;flex-direction:column;gap:4px;}
.week-all-day-cell.has-all-day{background:rgba(var(--accent-rgb),.035);}
.week-all-day-chip{display:flex!important;align-items:center;justify-content:space-between;gap:4px;min-height:24px;border-radius:10px;padding:4px 6px;font-size:10px;font-weight:900;text-align:left;}
.week-all-day-chip span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.week-all-day-more{border:1px dashed var(--border);background:var(--bg3);color:var(--text3);border-radius:10px;padding:4px 6px;font-size:10px;font-weight:900;cursor:pointer;text-align:left;}
.month-event-row{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:4px;}
.month-event-source{width:15px;height:15px;border-radius:999px;display:grid;place-items:center;background:rgba(var(--accent-rgb),.12);color:var(--accent);font-size:8px;font-weight:950;}
.event-template-strip{display:grid;gap:8px;padding:10px;border:1px solid var(--border);background:var(--bg3);border-radius:18px;}
.event-template-strip>span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:950;color:var(--text3);}
.event-template-strip>div{display:flex;gap:7px;flex-wrap:wrap;}
.event-template-strip button{border:1px solid var(--border);background:var(--surface);color:var(--text2);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
.event-template-strip button:hover{border-color:var(--accent3);background:var(--bg4);color:var(--accent);}
.dark .calendar-source-chip,.dark .event-source-notice,.dark .event-template-strip,.dark .week-all-day-more{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;}
.dark .event-template-strip button{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.22)!important;}
@media(max-width:760px){.calendar-source-filter-row{gap:5px}.calendar-source-chip{font-size:9px;padding:5px 7px}.event-template-strip>div{display:grid;grid-template-columns:1fr 1fr}.event-template-strip button{justify-content:center}.week-all-day-chip em,.all-day-source-pill{display:none}}




@media(min-width:761px){
}
@media(max-width:560px){
  .today-top3-card .today-task-row{grid-template-columns:auto minmax(0,1fr) auto!important;align-items:flex-start!important;column-gap:8px!important;}
  .today-top3-card .today-task-row>div{min-width:0!important;grid-column:2!important;}
  .today-top3-card .today-row-action{grid-column:3!important;grid-row:1!important;align-self:start!important;justify-self:end!important;min-height:30px!important;padding:6px 9px!important;font-size:10px!important;margin-top:0!important;}
  .today-top3-card .today-task-check{grid-column:1!important;grid-row:1!important;}
}



@media(max-width:768px){
  .sidebar{overflow:hidden!important;}
  .sidebar-nav{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:12px!important;}
  .sidebar-cals{flex:0 0 auto!important;max-height:clamp(96px,18dvh,142px)!important;min-height:76px!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:8px 12px 10px!important;border-top:1px solid var(--border)!important;}
  .sidebar-cals .cal-label-row{position:sticky;top:0;z-index:2;background:var(--bg2);padding:2px 0 6px;margin-bottom:4px!important;}
  .sidebar-cals .cal-label{font-size:9px!important;margin-bottom:0!important;}
  .sidebar-cals .cal-item{margin-bottom:4px!important;font-size:11px!important;min-height:24px!important;}
  .sidebar-cals .cal-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sidebar-cals .cal-action-btn,.sidebar-cals .cal-visible-btn{transform:scale(.9);transform-origin:center;}
  .dark .sidebar-cals .cal-label-row{background:var(--dark-panel)!important;}
}







  display:flex!important;
  flex-wrap:nowrap!important;
  gap:8px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  padding:0 12px 10px!important;
  scroll-snap-type:x proximity;
  scrollbar-width:thin!important;
  -webkit-overflow-scrolling:touch!important;
}
  flex:0 0 auto!important;
  white-space:nowrap!important;
  scroll-snap-align:start;
}
@media(min-width:769px){
}


  margin:14px 14px 16px!important;
  padding:15px!important;
}
  padding:5px 14px 16px!important;
  margin:0 0 8px!important;
  gap:9px!important;
}
  display:flex;
  align-items:flex-start;
  gap:8px;
  margin-top:10px;
  padding:9px 11px;
  border:1px solid rgba(var(--accent-rgb),.16);
  border-radius:16px;
  background:rgba(var(--accent-rgb),.07);
  color:var(--text2);
}
  flex:0 0 auto;
  font-size:10px;
  font-family:var(--mono);
  font-weight:950;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--accent);
}
  min-width:0;
  font-size:11px;
  font-weight:850;
  line-height:1.35;
  color:var(--text2);
}
  background:rgba(var(--accent-rgb),.12)!important;
  border-color:rgba(var(--accent-rgb),.28)!important;
}
@media(max-width:760px){
}


  display:flex!important;
  flex-wrap:nowrap!important;
  gap:10px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  padding:14px 16px 12px!important;
  scrollbar-width:thin!important;
  scroll-snap-type:x proximity;
  -webkit-overflow-scrolling:touch!important;
}
  flex:0 0 auto!important;
  white-space:nowrap!important;
  scroll-snap-align:start;
  padding-inline:12px!important;
}
  margin:0 12px 10px;
  padding:11px;
  border:1.5px solid rgba(var(--accent-rgb),.14);
  border-radius:20px;
  background:linear-gradient(135deg,var(--surface),var(--surface-soft));
  display:grid;
  gap:8px;
  max-height:180px;
  overflow-y:auto;
  flex:0 0 auto;
}
  border:1px solid var(--border);
  background:var(--bg2);
  color:var(--text);
  border-radius:14px;
  padding:8px 9px;
  text-align:left;
  cursor:pointer;
  display:grid;
  gap:2px;
}
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  border:1px solid var(--border);
  border-radius:14px;
  background:var(--bg3);
  padding:8px 10px;
}
.settings-section-label.small{font-size:11px;margin-top:12px;}

/* ── Final journal decorator coordinate + scroll fix ────────────────── */
html.tempo-modal-locked, body.tempo-modal-locked{
  overflow:hidden!important;
  overscroll-behavior:none!important;
}
body.tempo-modal-locked{
  touch-action:none!important;
}
.modal-overlay[aria-label="View journal entry"],
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
  position:fixed!important;
  inset:0!important;
  width:100vw!important;
  height:100dvh!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  overflow:hidden!important;
  padding:18px!important;
  box-sizing:border-box!important;
  overscroll-behavior:none!important;
  touch-action:none!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
  position:relative!important;
  width:min(560px,calc(100vw - 24px))!important;
  max-width:min(560px,calc(100vw - 24px))!important;
  height:calc(100dvh - 36px)!important;
  max-height:calc(100dvh - 36px)!important;
  min-height:300px!important;
  display:flex!important;
  flex-direction:column!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
  gap:0!important;
  margin:0 auto!important;
  overflow:hidden!important;
  border:1.5px solid var(--border)!important;
  border-radius:30px!important;
  background-color:var(--bg2)!important;
  background-image:var(--memory-bg-image)!important;
  background-size:cover!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
  box-shadow:0 24px 70px rgba(76,38,58,.22)!important;
  isolation:isolate!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
  height:calc(100dvh - 284px - env(safe-area-inset-bottom,0px))!important;
  max-height:calc(100dvh - 284px - env(safe-area-inset-bottom,0px))!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header{
  position:relative!important;
  z-index:120!important;
  flex:0 0 auto!important;
  grid-column:auto!important;
  grid-row:auto!important;
  border:0!important;
  border-bottom:1px solid var(--border)!important;
  border-radius:30px 30px 0 0!important;
  background:rgba(255,248,251,.88)!important;
  box-shadow:0 8px 20px rgba(80,44,64,.08)!important;
  pointer-events:auto!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header button,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header button{
  pointer-events:auto!important;
  position:relative!important;
  z-index:130!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header .modal-close,
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header .tf-save,
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header .tf-cancel,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header .modal-close,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header .tf-save,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header .tf-cancel{
  display:inline-flex!important;
  visibility:visible!important;
  opacity:1!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-view-body,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{
  position:relative!important;
  z-index:5!important;
  flex:1 1 auto!important;
  min-height:0!important;
  grid-column:auto!important;
  grid-row:auto!important;
  border:0!important;
  border-radius:0 0 30px 30px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior:contain!important;
  touch-action:pan-y!important;
  padding-bottom:0!important;
  box-shadow:none!important;
}
.entry-view-scroll-content{
  position:relative!important;
  min-height:100%!important;
  overflow:visible!important;
  isolation:isolate!important;
}
.entry-view-scroll-content > :not(.journal-decoration-layer){
  position:relative!important;
  z-index:2!important;
}
.entry-view-scroll-content .journal-decoration-layer,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-scroll-content .journal-decoration-layer{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  z-index:60!important;
  overflow:visible!important;
  pointer-events:none!important;
  border-radius:0 0 30px 30px!important;
  touch-action:none!important;
}
.entry-view-scroll-content .journal-decoration-layer:not(.journal-decoration-editing),
.entry-view-scroll-content .journal-decoration-layer:not(.journal-decoration-editing) .journal-decoration-item{
  pointer-events:none!important;
}
.entry-view-scroll-content .journal-decoration-layer.journal-decoration-editing{
  pointer-events:none!important;
}
.entry-view-scroll-content .journal-decoration-layer.journal-decoration-editing .journal-decoration-item{
  pointer-events:auto!important;
  touch-action:none!important;
}
.entry-view-scroll-content .journal-decoration-layer .journal-decoration-item{
  position:absolute!important;
  box-sizing:border-box!important;
  transform-origin:center center!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card,
.journal-decoration-bottom-sheet.journal-decoration-tool-card{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:max(10px,env(safe-area-inset-bottom,0px))!important;
  transform:translateX(-50%)!important;
  width:min(720px,calc(100vw - 20px))!important;
  max-width:calc(100vw - 20px)!important;
  max-height:252px!important;
  display:block!important;
  grid-column:auto!important;
  grid-row:auto!important;
  align-self:auto!important;
  margin:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  overscroll-behavior:contain!important;
  z-index:1600!important;
  border-radius:28px!important;
  border:1.5px solid rgba(var(--accent-rgb),.22)!important;
  background:rgba(255,248,251,.97)!important;
  backdrop-filter:blur(18px)!important;
  -webkit-backdrop-filter:blur(18px)!important;
  box-shadow:0 -18px 60px rgba(76,38,58,.24)!important;
  padding:8px 14px 14px!important;
  pointer-events:auto!important;
  transition:transform .24s ease,max-height .24s ease!important;
  touch-action:pan-y!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.collapsed,
.journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed{
  transform:translateX(-50%) translateY(calc(100% - 62px))!important;
  max-height:72px!important;
  overflow:hidden!important;
}
.journal-decoration-sheet-handle{
  touch-action:none!important;
  cursor:grab!important;
}
.journal-decoration-sheet-handle:active{cursor:grabbing!important;}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-tool-card button,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-sheet-handle,
.journal-decoration-tool-card button,
.journal-decoration-sheet-handle{
  pointer-events:auto!important;
}
@media(max-width:768px){
  .modal-overlay[aria-label="View journal entry"],
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
    inset:0 0 var(--mobile-nav-h,78px) 0!important;
    height:calc(100dvh - var(--mobile-nav-h,78px))!important;
    padding:8px!important;
    align-items:center!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
    width:calc(100vw - 16px)!important;
    max-width:calc(100vw - 16px)!important;
    height:calc(100dvh - var(--mobile-nav-h,78px) - 16px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 16px)!important;
    min-height:280px!important;
    border-radius:24px!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
    height:calc(100dvh - var(--mobile-nav-h,78px) - 250px - env(safe-area-inset-bottom,0px))!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 250px - env(safe-area-inset-bottom,0px))!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header{border-radius:24px 24px 0 0!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-view-body,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{border-radius:0 0 24px 24px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card,
  .journal-decoration-bottom-sheet.journal-decoration-tool-card{
    left:0!important;
    right:0!important;
    bottom:var(--mobile-nav-h,78px)!important;
    transform:none!important;
    width:100%!important;
    max-width:100%!important;
    max-height:242px!important;
    border-radius:26px 26px 0 0!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.collapsed,
  .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed{
    transform:translateY(calc(100% - 62px))!important;
  }
}




/* Mobile: decorations can be viewed, but decoration editing is desktop-only. */
@media(max-width:768px){
  .decorate-entry-btn,
  .decorate-after-save-overlay,
  .journal-decoration-bottom-sheet,
  .journal-decoration-tool-card{display:none!important;}
}


.entry-view-scroll-content{--journal-decoration-board-w:560px;}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal{width:min(560px,calc(100vw - 24px))!important;max-width:min(560px,calc(100vw - 24px))!important;}
.modal-overlay[aria-label="View journal entry"] .entry-view-scroll-content{min-width:0!important;width:100%!important;box-sizing:border-box!important;}

@media(max-width:768px){
  .modal-overlay[aria-label="View journal entry"],
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{align-items:flex-start!important;justify-content:center!important;inset:0 0 var(--mobile-nav-h,78px) 0!important;height:calc(100dvh - var(--mobile-nav-h,78px))!important;padding:calc(env(safe-area-inset-top,0px) + 6px) 7px 8px!important;overflow:hidden!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{width:min(560px,calc(100vw - 14px))!important;max-width:min(560px,calc(100vw - 14px))!important;height:calc(100dvh - var(--mobile-nav-h,78px) - env(safe-area-inset-top,0px) - 14px)!important;max-height:calc(100dvh - var(--mobile-nav-h,78px) - env(safe-area-inset-top,0px) - 14px)!important;min-height:0!important;margin:0 auto!important;border-radius:22px!important;overflow:hidden!important;font-size:12px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{top:auto!important;left:auto!important;transform:none!important;position:relative!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header{padding:11px 13px!important;min-height:58px!important;gap:8px!important;border-radius:22px 22px 0 0!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-modal-date{font-size:14px!important;letter-spacing:.01em!important;line-height:1.15!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-mood{font-size:11px!important;line-height:1.1!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-modal-header .tf-save,
  .modal-overlay[aria-label="View journal entry"] .entry-modal-header .tf-cancel{min-height:32px!important;padding:7px 11px!important;font-size:10px!important;white-space:nowrap!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-modal-header .modal-close{width:32px!important;height:32px!important;min-width:32px!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-body,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{flex:1 1 auto!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;border-radius:0 0 22px 22px!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-section{padding:11px 13px!important;min-height:auto!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-section-title{font-size:8.8px!important;letter-spacing:.16em!important;margin-bottom:8px!important;}
  .modal-overlay[aria-label="View journal entry"] .memory-tag-chip,
  .modal-overlay[aria-label="View journal entry"] .activity-chip{font-size:10px!important;padding:6px 10px!important;min-height:30px!important;}
  .modal-overlay[aria-label="View journal entry"] .highlight-view-grid{gap:8px!important;}
  .modal-overlay[aria-label="View journal entry"] .highlight-view-grid>div{padding:9px 10px!important;border-radius:13px!important;}
  .modal-overlay[aria-label="View journal entry"] .highlight-view-grid strong,
  .modal-overlay[aria-label="View journal entry"] .entry-view-note,
  .modal-overlay[aria-label="View journal entry"] .gratitude-view-item{font-size:12px!important;line-height:1.38!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-card{padding:10px!important;border-radius:16px!important;min-height:0!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-main{min-width:78px!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-rank{font-size:26px!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-num{font-size:9px!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-lines{font-size:10px!important;gap:6px!important;}
  .modal-overlay[aria-label="View journal entry"] .completed-task-item{padding:10px!important;border-radius:14px!important;}
  .modal-overlay[aria-label="View journal entry"] .completed-task-title{font-size:12px!important;}
  .modal-overlay[aria-label="View journal entry"] .completed-task-meta{font-size:9px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{padding-bottom:52px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card{left:0!important;right:0!important;bottom:var(--mobile-nav-h,78px)!important;width:100%!important;max-width:100%!important;max-height:248px!important;border-radius:22px 22px 0 0!important;transform:translateY(0)!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card[data-open="false"]{transform:translateY(calc(100% - 54px))!important;max-height:58px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-sheet-handle{min-height:48px!important;}
}

`}</style>

      <div className="app">
        <AppSidebar
          sidebarOpen={sidebarOpen}
          todayDate={TODAY}
          sidebarDateLabel={formatWithDisplayTimezone(TODAY, { weekday: "long", month: "long", year: "numeric" })}
          user={auth.user}
          syncStatus={syncStatus}
          pendingLocalChanges={pendingLocalChanges}
          lastSyncedAt={lastSyncedAt}
          onForceSync={forceSyncNow}
          checkInSummary={sidebarCheckInSummary}
          onOpenCheckIn={() => { setShowCheckIn(true); closeSidebarOnMobile(); }}
          page={page}
          appMode={appMode}
          onAppModeChange={setAppMode}
          onNavigate={navigateFromSidebar}
          onPlanToday={() => { setDayPlan(buildDailyPlan(TODAY)); closeSidebarOnMobile(); }}
          onOpenSettings={() => { setSettingsOpen(true); closeSidebarOnMobile(); }}
          calendars={calendars}
          hiddenCals={hiddenCals}
          hiddenCalendarSources={hiddenCalendarSources}
          onAddCalendar={addCalendar}
          onToggleCalendarSource={toggleCalendarSource}
          onToggleCalendarVisibility={toggleCalVisibility}
          onEditCalendar={editCalendar}
          onRequestRemoveCalendar={requestRemoveCalendar}
        />
        <button type="button" className={`mobile-sidebar-scrim ${sidebarOpen ? "open" : ""}`} aria-label="Close menu" onClick={() => setSidebarOpen(false)} />

        <div className="main">
          {appMode === "budget" ? (
            <BudgetApp profile={budgetProfile} accounts={budgetAccounts} ledgers={budgetLedgers} buckets={budgetBuckets} transactions={budgetTransactions} onProfileChange={setBudgetProfile} onAccountsChange={setBudgetAccounts} onLedgersChange={setBudgetLedgers} onBucketsChange={setBudgetBuckets} />
          ) : appMode === "overall" ? (
            <OverallPage budgetSummary={budgetSummary} rhythmSummary={overallRhythmSummary} />
          ) : page === "today" ? (
            <TodayLitePage summary={dailyStartupSummary} events={todayDashboardEvents} tasks={tasks} journal={journal} dailyCheckIns={dailyCheckIns} affirmations={affirmations} categories={categories} habits={habits} habitCompletions={habitCompletions} onOpenCalendar={() => setPage("calendar")} onOpenTasks={() => setPage("tasks")} onOpenJournal={() => setPage("journal")} onOpenCheckIn={() => setShowCheckIn(true)} onOpenHabits={() => setPage("habits")} onPlanToday={() => setDayPlan(buildDailyPlan(TODAY))} onTomorrowReset={() => setPage("tomorrow-reset")} onToggleHabit={toggleHabitToday} onIncrementHabit={incrementHabitToday} onToggleTask={toggleTask} onEditTask={setSelectedTask} />
          ) : page === "journal" ? (
            <JournalPage journal={journal} setJournal={setJournal} onSaveMemoryEntry={saveMemoryEntry} events={gameEvents} tasks={tasks} dailyCheckIns={dailyCheckIns} tomorrowResets={tomorrowResets} weeklyResets={weeklyResets} onOpenCheckIn={() => setShowCheckIn(true)} activitiesCatalog={journalActivities} memoryTagsCatalog={memoryTags} onAddActivity={addJournalActivity} onUpdateActivity={updateJournalActivity} onDeleteActivity={deleteJournalActivity} onAddMemoryTag={addMemoryTag} onUpdateMemoryTag={updateMemoryTag} onDeleteMemoryTag={deleteMemoryTag} onReorderActivities={reorderJournalActivities} userId={auth.user?.id} onMemoryStorageMigrated={markMemoryStorageMigrated} quickEditDate={quickMemoryDate} onQuickEditHandled={() => setQuickMemoryDate(null)} onQueuePhotoCleanup={enqueueMemoryPhotoCleanup} allowDecorationEditing={!isMobileViewport} />
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
          <CalendarTopbar
            view={view}
            title={calendarTopbarTitle}
            showTodayBadge={view === "day" && viewDate.toDateString() === TODAY.toDateString()}
            todayEventCount={viewDayEvents.length}
            syncStatus={syncStatus}
            pendingLocalChanges={pendingLocalChanges}
            lastSyncedAt={lastSyncedAt}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            onPrevious={goToPreviousCalendarRange}
            onToday={() => setViewDate(new Date(TODAY))}
            onNext={goToNextCalendarRange}
            onViewChange={setView}
            onForceSync={forceSyncNow}
            onPlanToday={() => setDayPlan(buildDailyPlan(TODAY))}
            onSearch={() => setShowSearch(true)}
            onTemplates={() => setShowTemplates(true)}
            onShortcuts={() => setShowShortcuts(true)}
          />

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
      {showSearch && <SearchModal events={visibleEvents} tasks={tasks} calendars={calendars} categories={categories} onClose={() => setShowSearch(false)} onEventClick={setSelectedEvent} onTaskEdit={setSelectedTask} onNavigate={d => { setViewDate(new Date(d)); setView("day"); }} />}
      {quickAddDate  && <AddEventModal onClose={() => setQuickAddDate(null)} onSave={async ev => { const placed = await addEvent(ev); if (placed) setQuickAddDate(null); return placed; }} defaultDate={quickAddDate} calendars={calendars} categories={categories} />}
      {selectedEvent && <EventModal event={selectedEvent} calendars={calendars} categories={categories} onClose={() => setSelectedEvent(null)} onSave={saveEvent} onDelete={deleteEvent} onCopy={copyEventForPaste} onDuplicate={duplicateEvent} />}
      {calendarEditor && <CalendarEditModal mode={calendarEditor.mode} calendar={calendarEditor.calendar} calendars={calendars} onClose={() => setCalendarEditor(null)} onSave={saveCalendarFromModal} onDelete={removeCalendar} />}
      {selectedTask && <TaskModal task={selectedTask} categories={categories} onClose={() => setSelectedTask(null)} onSave={task => { selectedTask._isNew ? addTask({ ...task, _isNew: undefined }) : saveTask(task); setSelectedTask(null); }} onDelete={selectedTask._isNew ? null : deleteTask} />}
      <EventConflictModal />
      <RecurringTaskScopeModal />
      <TaskRescheduleDateModal />
      {scheduleTaskTarget && <TaskScheduleModal task={scheduleTaskTarget} workStart={workStart} workEnd={workEnd} onClose={() => setScheduleTaskTarget(null)} onSchedule={(mode) => scheduleTaskIntoCalendar(scheduleTaskTarget, mode)} />}
      {dayPlan && <DailyPlanModal plan={dayPlan} mealBreaks={mealBreaks} planningRules={planningRules} onClose={() => setDayPlan(null)} onApply={applyDayPlan} onRegenerate={regenerateDayPlan} onMoveRemaining={movePlanRemainingToTomorrow} onMoveRemainingToWeek={movePlanRemainingToThisWeek} onSkipLowPriority={skipLowPriorityInDayPlan} />}
      {/* Tomorrow Reset now lives as a full Planning page instead of a popup. */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} onComplete={completeOnboarding} workStart={workStart} workEnd={workEnd} notificationPreferences={notificationPreferences} />}
            {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} workStart={workStart} setWorkStart={setWorkStart} workEnd={workEnd} setWorkEnd={setWorkEnd} mealBreaks={mealBreaks} setMealBreaks={setMealBreaks} planningRules={planningRules} setPlanningRules={setPlanningRules} notifs={notifs} setNotifs={setNotifs} pushEnabled={pushEnabled} setPushEnabled={setPushEnabled} notificationPreferences={notificationPreferences} setNotificationPreferences={setNotificationPreferences} onEnableClosedPush={enableClosedPushNotifications} timezone={timezone} setTimezone={setTimezone} categories={categories} setCategories={setCategories} user={auth.user} onSignOut={auth.signOut} gameStats={gameStats} onForceSync={forceSyncNow} syncStatus={syncStatus} syncDebug={syncDebug} onRestartOnboarding={restartOnboarding} googleSync={googleSync} onGoogleConnect={connectGoogleCalendar} onGoogleDisconnect={disconnectGoogleCalendar} onGoogleSyncNow={importGoogleCalendarNow} onGoogleCalendarPatch={updateGoogleCalendarPreference} />}
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

      <RecurrenceScopeModal />

      <MobileBottomNav
        sidebarOpen={sidebarOpen}
        page={page}
        appMode={appMode}
        syncStatus={syncStatus}
        pendingLocalChanges={pendingLocalChanges}
        lastSyncedAt={lastSyncedAt}
        onRetrySync={forceSyncNow}
        onToggleMenu={() => setSidebarOpen(v => !v)}
        onNavigateToday={() => navigateFromMobileNav("today")}
        onNavigateCalendar={() => { navigateFromMobileNav("calendar"); setView("day"); }}
        onNavigateTasks={() => { navigateFromMobileNav("tasks"); setTaskScope("day"); }}
        onNavigateJournal={() => navigateFromMobileNav("journal")}
        onNavigateHabits={() => navigateFromMobileNav("habits")}
        onNavigateBudget={() => setAppMode("budget")}
        onNavigateOverall={() => setAppMode("overall")}
      />

      {toast && <div className="tempo-toast" onAnimationEnd={() => setToast(null)}>{typeof toast === "string" ? toast : toast.text}</div>}
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
  .dark .mobile-nav{background:var(--dark-nav)!important;border-color:rgba(var(--accent-rgb),.34)!important;}
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
    position:fixed!important;
    inset:0 0 var(--mobile-nav-h,78px) 0!important;
    align-items:center!important;
    justify-content:center!important;
    padding:10px!important;
    overflow:hidden!important;
    box-sizing:border-box!important;
  }
  .entry-view-modal{
    width:calc(100vw - 20px)!important;
    max-width:calc(100vw - 20px)!important;
    height:calc(100dvh - var(--mobile-nav-h,78px) - 20px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 20px)!important;
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

/* ── Journal freeform decorations ───────────────────────────────────── */
.memory-entry-overlay,.modal-overlay[aria-label="View journal entry"]{overflow:visible!important;}
.entry-modal.memory-entry-modal,.entry-view-modal{position:relative!important;overflow:visible!important;isolation:isolate;}
.entry-modal.memory-entry-modal .entry-modal-header,.entry-modal.memory-entry-modal .entry-modal-body,.entry-modal.memory-entry-modal .entry-modal-footer,.entry-view-modal .entry-modal-header,.entry-view-modal .entry-view-body{position:relative;z-index:8;}
.entry-modal.memory-entry-modal .entry-modal-body,.entry-view-modal .entry-view-body{z-index:2;}
.journal-decoration-layer{position:absolute!important;inset:0!important;z-index:6!important;pointer-events:none!important;overflow:visible!important;border-radius:inherit;touch-action:none;}
.journal-decoration-layer .journal-decoration-item{position:absolute!important;box-sizing:border-box!important;pointer-events:auto!important;transform-origin:center center!important;}
.journal-view-decoration-layer .journal-decoration-item{pointer-events:none!important;}
.journal-view-decoration-layer.journal-decoration-editing{z-index:18!important;pointer-events:none!important;}
.journal-view-decoration-layer.journal-decoration-editing .journal-decoration-item{pointer-events:auto!important;}
.entry-view-modal.decorating .entry-modal-header,.entry-view-modal.decorating .entry-view-body{z-index:8;}
.journal-decoration-editor-panel{position:relative;z-index:30;margin:0 20px 12px;padding:12px;border:1px dashed rgba(var(--accent-rgb),.30);border-radius:18px;background:rgba(255,255,255,.86);box-shadow:0 16px 34px rgba(80,44,64,.14);backdrop-filter:blur(10px);}
.journal-decoration-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}
.journal-decoration-editor-head strong{display:block;color:var(--text);font-size:14px;}
.journal-decoration-editor-head span{display:block;color:var(--text2);font-size:12px;font-weight:800;margin-top:2px;}
.journal-decoration-editor-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
.decorate-entry-btn{box-shadow:0 8px 20px rgba(var(--accent-rgb),.18)!important;}
.decorate-after-save-overlay{z-index:999!important;background:rgba(44,28,38,.18)!important;backdrop-filter:blur(8px);}
.decorate-after-save-card{width:min(92vw,380px);background:var(--bg2);border:1px solid var(--border);border-radius:26px;padding:22px;box-shadow:0 24px 80px rgba(80,44,64,.24);text-align:center;color:var(--text);}
.decorate-after-save-icon{font-size:34px;margin-bottom:8px;}
.decorate-after-save-card strong{display:block;font-size:20px;margin-bottom:6px;}
.decorate-after-save-card p{margin:0 0 16px;color:var(--text2);font-size:13px;font-weight:800;line-height:1.5;}
.decorate-after-save-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.dark .journal-decoration-editor-panel,.dark .decorate-after-save-card{background:rgba(31,24,30,.94);border-color:rgba(var(--accent-rgb),.28);}
.journal-decoration-item.scrapbook-tape{background:linear-gradient(135deg,rgba(255,228,236,.96),rgba(255,244,220,.92))!important;border:1px solid rgba(202,122,154,.24)!important;box-shadow:0 12px 28px rgba(118,76,92,.16)!important;overflow:visible!important;}
.journal-decoration-item.scrapbook-tape:before{content:"";position:absolute;left:50%;top:-9px;width:48px;height:18px;transform:translateX(-50%) rotate(-2deg);border-radius:6px;background:rgba(255,255,255,.58);border:1px solid rgba(202,122,154,.16);box-shadow:0 4px 10px rgba(118,76,92,.08);pointer-events:none;}
.journal-decoration-item.scrapbook-sticker{background:transparent!important;border-color:transparent!important;box-shadow:none!important;overflow:visible!important;}
.journal-decoration-toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px!important;}
.journal-decoration-note{margin-top:10px;padding:9px 11px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.50);color:var(--text2);font-size:12px;font-weight:800;}
.journal-decoration-selected-panel{position:relative;z-index:12;}
.journal-view-decoration-layer .scrapbook-view-text{background:linear-gradient(135deg,rgba(255,228,236,.96),rgba(255,244,220,.92));border:1px solid rgba(202,122,154,.24);border-radius:16px;box-shadow:0 12px 28px rgba(118,76,92,.12);}
.dark .journal-decoration-note{background:rgba(255,255,255,.06);border-color:rgba(var(--accent-rgb),.24);}
.dark .journal-decoration-item.scrapbook-tape,.dark .journal-view-decoration-layer .scrapbook-view-text{background:linear-gradient(135deg,rgba(108,48,82,.92),rgba(72,42,58,.88))!important;border-color:rgba(var(--accent-rgb),.30)!important;color:#ffd6e3!important;}

/* Decorator stability: only the journal card scrolls, actions stay clickable */
.modal-overlay[aria-label="View journal entry"]{position:fixed!important;inset:0!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;padding:18px!important;overscroll-behavior:contain!important;}
.entry-view-modal{max-height:calc(100dvh - 36px)!important;overflow:hidden!important;border-radius:30px!important;isolation:isolate!important;}
.entry-view-modal .entry-modal-header{flex:0 0 auto!important;position:relative!important;z-index:70!important;pointer-events:auto!important;}
.entry-view-modal .entry-view-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;}
.entry-view-modal.decorating{max-height:calc(100dvh - 36px)!important;overflow:hidden!important;}
.entry-view-modal.decorating .entry-modal-header .modal-close,.entry-view-modal.decorating .entry-modal-header .tf-save,.entry-view-modal.decorating .entry-modal-header .tf-cancel{display:inline-flex!important;position:relative!important;z-index:75!important;pointer-events:auto!important;}
.entry-view-modal.decorating .journal-decoration-layer{pointer-events:none!important;}
.entry-view-modal.decorating .journal-decoration-layer .journal-decoration-item{pointer-events:auto!important;}
.entry-view-modal.decorating .journal-decoration-tool-card{position:relative!important;z-index:80!important;pointer-events:auto!important;overflow:auto!important;overscroll-behavior:contain!important;}
.entry-view-modal.decorating .journal-decoration-editor-actions button,.journal-decoration-tool-card button{pointer-events:auto!important;}
.decor-history-btn:disabled{opacity:.45!important;cursor:not-allowed!important;}

@media(max-width:768px){
  .entry-modal.memory-entry-modal{overflow:visible!important;}
  .entry-view-modal{overflow:hidden!important;}
  .journal-decoration-layer .journal-decoration-item{min-width:42px;min-height:42px;}
  .journal-decoration-toolbar button{flex:1 1 120px;}
  .journal-decoration-editor-panel{margin:0 10px 10px;padding:10px;}
  .journal-decoration-editor-head{flex-direction:column;}
  .journal-decoration-editor-actions{width:100%;justify-content:space-between;}
  .journal-decoration-editor-actions button{flex:1;}
}


/* ── Final decorator interaction correction: true card anchoring + real bottom sheet ── */
body.tempo-modal-locked{touch-action:auto!important;}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
  position:fixed!important;
  inset:0!important;
  width:100vw!important;
  height:100dvh!important;
  display:flex!important;
  align-items:flex-start!important;
  justify-content:center!important;
  overflow:hidden!important;
  padding:6px 10px 0!important;
  box-sizing:border-box!important;
  overscroll-behavior:none!important;
  touch-action:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
  width:min(560px,calc(100vw - 20px))!important;
  max-width:min(560px,calc(100vw - 20px))!important;
  height:calc(100dvh - 12px)!important;
  max-height:calc(100dvh - 12px)!important;
  margin:0 auto!important;
  align-self:flex-start!important;
  overflow:hidden!important;
  display:flex!important;
  flex-direction:column!important;
  border-radius:30px!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{
  position:relative!important;
  flex:1 1 auto!important;
  min-height:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  touch-action:pan-y!important;
  overscroll-behavior:contain!important;
  -webkit-overflow-scrolling:touch!important;
  padding-bottom:285px!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-scroll-content{
  position:relative!important;
  min-height:100%!important;
  overflow:visible!important;
  isolation:isolate!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-scroll-content .journal-decoration-layer{
  position:absolute!important;
  left:0!important;
  top:0!important;
  right:0!important;
  bottom:auto!important;
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  z-index:60!important;
  overflow:visible!important;
  pointer-events:none!important;
  touch-action:none!important;
  border-radius:0 0 30px 30px!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-scroll-content .journal-decoration-layer.journal-decoration-editing .journal-decoration-item{
  pointer-events:auto!important;
  touch-action:none!important;
  user-select:none!important;
  -webkit-user-select:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:max(10px,env(safe-area-inset-bottom,0px))!important;
  transform:translateX(-50%) translateY(0)!important;
  width:min(720px,calc(100vw - 20px))!important;
  max-width:calc(100vw - 20px)!important;
  max-height:min(286px,48dvh)!important;
  overflow:hidden!important;
  z-index:2000!important;
  border-radius:28px!important;
  background:rgba(255,248,251,.98)!important;
  border:1.5px solid rgba(var(--accent-rgb),.22)!important;
  box-shadow:0 -18px 60px rgba(76,38,58,.24)!important;
  backdrop-filter:blur(18px)!important;
  -webkit-backdrop-filter:blur(18px)!important;
  padding:8px 14px 14px!important;
  pointer-events:auto!important;
  touch-action:pan-y!important;
  transition:transform .22s ease,max-height .22s ease!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card.collapsed{
  transform:translateX(-50%) translateY(calc(100% - 54px))!important;
  max-height:64px!important;
}
.journal-decoration-sheet-handle{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  flex-direction:column!important;
  width:100%!important;
  padding:0 0 8px!important;
  margin:0!important;
  cursor:grab!important;
  touch-action:none!important;
  user-select:none!important;
  -webkit-user-select:none!important;
}
.journal-decoration-sheet-content{
  max-height:214px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  overscroll-behavior:contain!important;
  touch-action:pan-y!important;
  padding-bottom:8px!important;
}
.journal-decoration-bottom-sheet.collapsed .journal-decoration-sheet-content{display:none!important;}
@media(max-width:768px){
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
    inset:0 0 var(--mobile-nav-h,78px) 0!important;
    height:calc(100dvh - var(--mobile-nav-h,78px))!important;
    padding:4px 8px 0!important;
    align-items:flex-start!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
    width:calc(100vw - 16px)!important;
    max-width:calc(100vw - 16px)!important;
    height:calc(100dvh - var(--mobile-nav-h,78px) - 8px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 8px)!important;
    border-radius:24px!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{padding-bottom:270px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card{
    left:8px!important;
    right:8px!important;
    bottom:calc(var(--mobile-nav-h,78px) + env(safe-area-inset-bottom,0px))!important;
    width:auto!important;
    max-width:none!important;
    transform:translateY(0)!important;
    max-height:min(268px,46dvh)!important;
    border-radius:26px 26px 0 0!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card.collapsed{
    transform:translateY(calc(100% - 54px))!important;
    max-height:64px!important;
  }
  .journal-decoration-sheet-content{max-height:202px!important;}
}


/* ── REAL decorator viewport + sheet override ───────────────────────── */
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
  position:fixed!important;
  inset:0!important;
  width:100vw!important;
  height:100dvh!important;
  display:block!important;
  overflow:hidden!important;
  padding:0!important;
  margin:0!important;
  overscroll-behavior:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
  position:fixed!important;
  top:4px!important;
  left:50%!important;
  transform:translateX(-50%)!important;
  margin:0!important;
  width:min(560px,calc(100vw - 18px))!important;
  max-width:min(560px,calc(100vw - 18px))!important;
  height:calc(100dvh - 8px)!important;
  max-height:calc(100dvh - 8px)!important;
  min-height:0!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
  border-radius:28px!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{
  flex:1 1 auto!important;
  min-height:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  padding-bottom:72px!important;
  overscroll-behavior:contain!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-scroll-content{
  position:relative!important;
  min-height:100%!important;
  overflow:visible!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-scroll-content .journal-decoration-layer{
  position:absolute!important;
  left:0!important;
  top:0!important;
  right:auto!important;
  bottom:auto!important;
  min-width:100%!important;
  min-height:100%!important;
  overflow:visible!important;
  z-index:70!important;
  pointer-events:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-scroll-content .journal-decoration-layer.journal-decoration-editing .journal-decoration-item{
  pointer-events:auto!important;
  touch-action:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:max(8px,env(safe-area-inset-bottom,0px))!important;
  width:min(720px,calc(100vw - 20px))!important;
  max-width:calc(100vw - 20px)!important;
  margin:0!important;
  transform:translateX(-50%) translateY(0)!important;
  max-height:min(300px,48dvh)!important;
  overflow:hidden!important;
  z-index:5000!important;
  pointer-events:auto!important;
  touch-action:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card[data-open="false"]{
  transform:translateX(-50%) translateY(calc(100% - 46px))!important;
  max-height:54px!important;
  overflow:hidden!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed .journal-decoration-sheet-content,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card[data-open="false"] .journal-decoration-sheet-content{
  display:none!important;
  height:0!important;
  max-height:0!important;
  overflow:hidden!important;
  visibility:hidden!important;
  pointer-events:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-sheet-handle{
  min-height:42px!important;
  padding:4px 0 8px!important;
  cursor:grab!important;
  touch-action:none!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-sheet-content{
  max-height:238px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  touch-action:pan-y!important;
}
@media(max-width:768px){
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
    inset:0 0 var(--mobile-nav-h,78px) 0!important;
    height:calc(100dvh - var(--mobile-nav-h,78px))!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
    top:0!important;
    width:calc(100vw - 12px)!important;
    max-width:calc(100vw - 12px)!important;
    height:calc(100dvh - var(--mobile-nav-h,78px) - 2px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 2px)!important;
    border-radius:22px!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card{
    left:6px!important;
    right:6px!important;
    bottom:calc(var(--mobile-nav-h,78px) + env(safe-area-inset-bottom,0px))!important;
    width:auto!important;
    max-width:none!important;
    transform:translateY(0)!important;
    border-radius:24px 24px 0 0!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card[data-open="false"]{
    transform:translateY(calc(100% - 46px))!important;
  }
}


/* ── Phase 51-70 conservative UX hardening ─────────────────────────────── */
.google-sync-status-row.loading .google-sync-dot{background:#D8A74D;animation:pulseDot 1.1s ease-in-out infinite;}
.google-sync-status-row.stale .google-sync-dot{background:#D8A74D;}
.google-sync-status-row.failed .google-sync-dot,.google-sync-status-row.offline .google-sync-dot{background:#B94D6A;}
.google-sync-warning,.google-calendar-empty-state,.notification-support-note{margin-top:8px;padding:10px 12px;border-radius:16px;border:1px solid rgba(var(--accent-rgb),.16);background:rgba(var(--accent-rgb),.06);color:var(--text2);font-size:12px;font-weight:800;line-height:1.35;}
.google-calendar-empty-state{display:flex;flex-direction:column;gap:8px;align-items:flex-start;}
.google-calendar-empty-state strong{color:var(--text);font-size:13px;font-weight:950;}
.google-calendar-empty-state span{color:var(--text3);font-size:11px;font-weight:800;}
.notification-support-note.unsupported{border-color:rgba(185,77,106,.22);background:rgba(185,77,106,.08);color:#B94D6A;}
.notification-support-note.supported{border-color:rgba(112,200,160,.24);background:rgba(112,200,160,.10);}
@keyframes pulseDot{0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.25);opacity:1}}
@media(max-width:768px){
  :root{--safe-bottom:env(safe-area-inset-bottom,0px);--safe-top:env(safe-area-inset-top,0px);}
  .mobile-nav,.bottom-nav{padding-bottom:max(8px,var(--safe-bottom))!important;}
  .modal,.checkin-modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{max-height:calc(100dvh - max(16px,var(--safe-top)) - max(16px,var(--safe-bottom)))!important;}
  .settings-overlay,.modal-overlay,.checkin-overlay,.templates-overlay,.search-overlay{padding-top:max(8px,var(--safe-top))!important;padding-bottom:max(8px,var(--safe-bottom))!important;}
}


`;

