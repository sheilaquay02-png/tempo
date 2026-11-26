"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, EVENT_DRAG_HOLD_MS, CALENDARS, normalizeCalendars, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, hasJournalEntryForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildPersonalLeaderboard, buildRhythmPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, DAILY_CHECKIN_MOODS, DAILY_CHECKIN_ENERGIES, normalizeDailyCheckIn, normalizeDailyCheckIns, dailyCheckInForDate, TOMORROW_RESET_TASK_ACTIONS, normalizeTomorrowReset, normalizeTomorrowResets, tomorrowResetForDate, WEEKLY_RESET_TASK_ACTIONS, normalizeWeeklyReset, normalizeWeeklyResets, weeklyResetForDate, AFFIRMATION_CATEGORIES, DEFAULT_AFFIRMATIONS, DEFAULT_AFFIRMATION_SETTINGS, DEFAULT_NOTIFICATION_PREFERENCES, normalizeAffirmation, normalizeAffirmations, normalizeAffirmationSettings, normalizeNotificationPreferences, normalizeSyncConflictLog, syncDatasetCounts, affirmationCategoryById, affirmationForDate, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_IMAGE_LIMIT_PER_ENTRY, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, buildJournalPhotoCleanupQueue, markJournalPhotoCleanupAttempt, mergeTempoData, _displayTimezone, _workStart } = Core;
import { appCSS } from "../styles/tempoStyles";
import { tempoLegacyInlineCSS } from "../styles/tempoLegacyInlineStyles";
import { tempoMobileFooterPopupSafetyCSS } from "../styles/tempoMobileFooterPopupSafety";
import { DailyStartupModal } from "./shared/DisplayComponents";
import { AppSidebar, CalendarTopbar, MobileBottomNav, TempoLoadingScreen } from "./layout/AppShell";
import { BudgetApp, OverallPage } from "./budget/BudgetApp";
import { DailyCheckInModal, taskFallsOnDateForReset } from "./checkins/CheckInReset";
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
import { LoginScreen, useAuth, getSupabase, loadFromCloud, saveToCloud, saveToCloudStrict, uploadMemoryImageToStorage, uploadMemoryDataUrlToStorage, deleteMemoryStoragePaths, deleteMemoryStoragePathsDetailed, signMemoryImagePath, allMemoryPhotoStoragePaths, memoryPhotoNeedsStorageMigration } from "./auth/LoginScreen";
import { DayView, WeekView, MonthEventRow } from "./calendar/CalendarViews";
import { EventModal, AddEventModal, SearchModal, CalendarEditModal } from "./calendar/CalendarModals";
import { TaskScheduleModal, DailyPlanModal } from "./planning/PlanningModals";
import { SettingsPanel } from "./settings/SettingsPanel";
import { TodayLitePage } from "./today/TodayDashboard";
import { SkillStatsCard, WeeklyRecapCard, LifeGardenCard, StreaksCard, PersonalityCard } from "./bloom/BloomRoom";
import { TaskPanel, TaskModal, TasksPage } from "./tasks/Tasks";
import { calendarEventSource, calendarSourceLabel, cleanCalendarColor, isImportedGoogleEvent, isImportedGoogleCalendar } from "../lib/tempo/client/calendarPresentation";
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

function RhythmStatsPage({ tasks = [], categories = CATEGORIES }) {
  const stats = buildRhythmStatsSnapshot({ tasks, categories });
  return (
    <div className="rhythm-stats-page phase-page">
      <div className="phase-hero rhythm-stats-hero">
        <div>
          <div className="phase-kicker">Rhythm Stats</div>
          <h1>📊 Your tasks at a glance</h1>
          <p>A simple look at your task completion, without extra tracking.</p>
        </div>
      </div>
      <div className="stats-card rhythm-stats-card rhythm-stats-card-page">
        <div className="stats-row rhythm-stat-grid">
          <div className="stat-big"><div className="stat-num">{stats.taskCompletionRate30}%</div><div className="stat-lbl">Task completion (30 days)</div></div>
          <div className="stat-big"><div className="stat-num">{stats.completedTasks30}</div><div className="stat-lbl">Completed tasks (30 days)</div></div>
          <div className="stat-big"><div className="stat-num">{stats.plannedTasks30}</div><div className="stat-lbl">Planned tasks (30 days)</div></div>
        </div>
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
          </div> : <p className="stats-mini-note">Your task statistics will appear as you complete tasks.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Tomorrow Reset / Check-ins moved to components/checkins/CheckInReset.jsx ───────────

// ─── Shortcuts Modal ──────────────────────────────────────────────────────────
function ShortcutsModal({ onClose }) {
  const sc = [["D","Day view"],["W","Week view"],["M","Month view"],["C","Create event"],["T","Create task"],["S","Settings"],["/ or ⌘K","Search"],["?","Shortcuts"],["Cmd+Z","Undo"],["Esc","Close / Back"]];
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

function OnboardingModal({ onClose, onComplete, workStart = 9, workEnd = 19 }) {
  const [startTime, setStartTime] = useState(`${String(Math.max(0, Math.min(23, Number(workStart) || 9))).padStart(2, "0")}:00`);
  const [windDownTime, setWindDownTime] = useState(`${String(Math.max(0, Math.min(23, Number(workEnd) || 19))).padStart(2, "0")}:00`);
  return (
    <div className="modal-overlay onboarding-overlay" role="dialog" aria-modal="true" aria-label="Tempo onboarding" onClick={onClose}>
      <div className="onboarding-modal" onClick={e => e.stopPropagation()}>
        <div className="onboarding-hero">
          <div><div className="phase-kicker">Onboarding</div><h2>🌸 Set up your day</h2><p>Choose your preferred planning hours. You can change these in Settings.</p></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <section className="onboarding-section onboarding-time-grid">
          <label><span>Start my day around</span><input className="modal-select" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
          <label><span>Finish my day around</span><input className="modal-select" type="time" value={windDownTime} onChange={e => setWindDownTime(e.target.value)} /></label>
        </section>
        <div className="onboarding-actions">
          <button className="tf-cancel" onClick={() => onComplete(null, { skipped: true })}>Skip for now</button>
          <button className="tf-save" onClick={() => onComplete({ startTime, windDownTime, habitIds: [], reminders: {} })}>Save preferences →</button>
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
  const [page, setPage]             = useState("today"); // "today" | "calendar" | "tasks" | "rhythm"
  const [appMode, setAppModeRaw]    = useState(() => load(`${uk}_app_mode`, "schedule"));
  const [budgetPage, setBudgetPage] = useState("home");
  const [taskScope, setTaskScope]   = useState("day");
  const [taskPeriodDate, setTaskPeriodDate] = useState(new Date(TODAY));
  const [events, setEvRaw]          = useState(() => reviveEvents(load(`${uk}_ev`, INIT_EVENTS)));
  // Old Google imports stay in saved data but are left out of every view and plan.
  const tempoEvents = useMemo(() => events.filter(e => !isImportedGoogleEvent(e)), [events]);
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
  const tempoCalendars = useMemo(() => calendars.filter(c => !isImportedGoogleCalendar(c)), [calendars]);
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
    if (["today", "calendar", "tasks", "rhythm"].includes(requestedPage)) {
      setPage(requestedPage);
    } else if (requestedPage && !["affirmations", "bloom"].includes(requestedPage)) {
      setPage("today");
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

  // Closed-app push reminders were removed. Browsers that enabled them still have
  // the old Tempo service worker and push subscription installed, so remove both.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(
      registrations
        .filter(reg => [reg.active, reg.waiting, reg.installing].some(worker => worker?.scriptURL?.endsWith("/tempo-sw.js")))
        .map(async reg => {
          try { await (await reg.pushManager?.getSubscription?.())?.unsubscribe?.(); } catch {}
          return reg.unregister();
        })
    )).catch(() => {});
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
  const setBudgetTransactions = value => { const next = normalizeBudgetTransactions(typeof value === "function" ? value(budgetTransactions) : value); setBudgetTransactionsRaw(next); persistBudgetSettings({ budgetTransactions: next }); };


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
          notes: "Habit reminder shown only inside Tempo.",
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
        return {
          ...c,
          name: String(cal.name || "").trim() || c.name,
          color: cleanCalendarColor(cal.color || c.color),
          updatedAt: now,
        };
      }), hiddenCals);
    }
    setCalendarEditor(null);
  };

  const removeCalendar = cal => {
    if (tempoCalendars.length <= 1) { setToast({ text: "Keep at least one calendar", ts: Date.now() }); return; }
    const timestamp = new Date().toISOString();
    const remaining = calendars.filter(c => c.id !== cal.id);
    const fallback = remaining.find(c => !isImportedGoogleCalendar(c))?.id || "personal";
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
    return expandRecurring(tempoEvents, dayStart(candidate.start), addDaysSafe(dayStart(candidate.start), 1))
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
    const rawBooked = expandRecurring([...tempoEvents, ...safeExtraEvents, ...mealBlocks, ...lifestyleBlocks], dayStart(date), addDaysSafe(dayStart(date), 1))
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
  const calendarDisplayEvents = tempoEvents.filter(eventSourceVisible);
  const expandedEvents  = expandRecurring(calendarDisplayEvents, rangeStart, rangeEnd);
  const viewDayEvents   = expandedEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, viewDate) && !hiddenCals.includes(e.calendar)).map(e => eventSegmentForDay(e, viewDate));
  const visibleEvents   = expandedEvents.filter(e => !hiddenCals.includes(e.calendar));
  // Gamification must be calculated from a stable event window, not the current
  // calendar view. Otherwise XP/levels can change when switching Day/Week/Month
  // because recurring events are expanded differently per view. Hidden
  // calendar filters should also not affect earned XP.
  const gameEvents      = expandRecurring(tempoEvents, addDaysSafe(TODAY, -120), addDaysSafe(TODAY, 30));
  const gameStats      = calculateGameStats(tasks, journal, gameEvents);
  const openToday     = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY)).length;
  const fontScale     = FONT_SIZES.find(f => f.id === fontSize)?.scale ?? 1;
  const activeTheme   = THEMES.find(t => t.id === theme) ?? THEMES[0];
  const cvars         = (darkMode ? activeTheme.dark : activeTheme.light) + activeTheme.accent;
  const todayFreeSlots = freeSlotsForDate(TODAY, [], null, { clampToNow: false });
  const dayFreeMinutes = todayFreeSlots.reduce((sum, slot) => sum + slot.minutes, 0);
  const todayDashboardEvents = expandRecurring(tempoEvents.filter(eventSourceVisible), dayStart(TODAY), addDaysSafe(dayStart(TODAY), 1))
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
  const memoAppCSS    = appCSS(cvars, fontScale) + tempoLegacyInlineCSS + tempoMobileFooterPopupSafetyCSS;
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
    setPage(["today", "calendar", "tasks", "rhythm"].includes(nextPage) ? nextPage : "today");
    closeSidebarOnMobile();
  }

  function navigateFromMobileNav(nextPage) {
    setAppMode("schedule");
    setPage(["today", "calendar", "tasks", "rhythm"].includes(nextPage) ? nextPage : "today");
    setSidebarOpen(false);
  }

  function navigateBudgetPage(nextPage) {
    const safePage = ["home", "account", "transactions", "budget", "settings"].includes(nextPage) ? nextPage : "home";
    if (appMode !== "budget") {
      setAppModeRaw("budget");
      persistBudgetSettings({ appMode: "budget" });
    }
    setBudgetPage(safePage);
    closeSidebarOnMobile();
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
      <style>{memoAppCSS}</style>

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
          budgetPage={budgetPage}
          onAppModeChange={setAppMode}
          onNavigate={navigateFromSidebar}
          onNavigateBudgetPage={navigateBudgetPage}
          onPlanToday={() => { setDayPlan(buildDailyPlan(TODAY)); closeSidebarOnMobile(); }}
          onOpenSettings={() => { setSettingsOpen(true); closeSidebarOnMobile(); }}
          calendars={tempoCalendars}
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
            <BudgetApp activePage={budgetPage} profile={budgetProfile} accounts={budgetAccounts} ledgers={budgetLedgers} buckets={budgetBuckets} transactions={budgetTransactions} onProfileChange={setBudgetProfile} onAccountsChange={setBudgetAccounts} onLedgersChange={setBudgetLedgers} onBucketsChange={setBudgetBuckets} onTransactionsChange={setBudgetTransactions} />
          ) : appMode === "overall" ? (
            <OverallPage budgetSummary={budgetSummary} rhythmSummary={overallRhythmSummary} />
          ) : page === "today" ? (
            <TodayLitePage summary={dailyStartupSummary} events={todayDashboardEvents} tasks={tasks} dailyCheckIns={dailyCheckIns} affirmations={affirmations} categories={categories} onOpenCalendar={() => setPage("calendar")} onOpenTasks={() => setPage("tasks")} onOpenCheckIn={() => setShowCheckIn(true)} onPlanToday={() => setDayPlan(buildDailyPlan(TODAY))} onToggleTask={toggleTask} onEditTask={setSelectedTask} />
          ) : page === "tasks" ? (
            <TasksPage tasks={tasks} categories={categories} onToggle={toggleTask} onAdd={addTask} onEdit={setSelectedTask} onScheduleTask={setScheduleTaskTarget} scope={taskScope} setScope={setTaskScope} periodDate={taskPeriodDate} setPeriodDate={setTaskPeriodDate} onMoveTaskPeriod={moveTaskToPeriod} gameStats={gameStats} />
          ) : page === "rhythm" ? (
            <RhythmStatsPage tasks={tasks} categories={categories} />
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
              {view === "day" && <DayView events={viewDayEvents} calendars={tempoCalendars} categories={categories} onReschedule={reschedule} onEventClick={setSelectedEvent} onDropTask={addEvent} viewDate={viewDate} onGridClick={d => handleCalendarSlotClick(d)} />}
              {view === "week" && <WeekView events={visibleEvents} calendars={tempoCalendars} categories={categories} onEventClick={setSelectedEvent} onReschedule={reschedule} viewDate={viewDate} onGridClick={d => handleCalendarSlotClick(d)} onDayClick={d => { setViewDate(d); setView("day"); }} />}
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
      {showSearch && <SearchModal events={visibleEvents} tasks={tasks} calendars={tempoCalendars} categories={categories} onClose={() => setShowSearch(false)} onEventClick={setSelectedEvent} onTaskEdit={setSelectedTask} onNavigate={d => { setViewDate(new Date(d)); setView("day"); }} />}
      {quickAddDate  && <AddEventModal onClose={() => setQuickAddDate(null)} onSave={async ev => { const placed = await addEvent(ev); if (placed) setQuickAddDate(null); return placed; }} defaultDate={quickAddDate} calendars={tempoCalendars} categories={categories} />}
      {selectedEvent && <EventModal event={selectedEvent} calendars={tempoCalendars} categories={categories} onClose={() => setSelectedEvent(null)} onSave={saveEvent} onDelete={deleteEvent} onCopy={copyEventForPaste} onDuplicate={duplicateEvent} />}
      {calendarEditor && <CalendarEditModal mode={calendarEditor.mode} calendar={calendarEditor.calendar} calendars={tempoCalendars} onClose={() => setCalendarEditor(null)} onSave={saveCalendarFromModal} onDelete={removeCalendar} />}
      {selectedTask && <TaskModal task={selectedTask} categories={categories} onClose={() => setSelectedTask(null)} onSave={task => { selectedTask._isNew ? addTask({ ...task, _isNew: undefined }) : saveTask(task); setSelectedTask(null); }} onDelete={selectedTask._isNew ? null : deleteTask} />}
      <EventConflictModal />
      <RecurringTaskScopeModal />
      <TaskRescheduleDateModal />
      {scheduleTaskTarget && <TaskScheduleModal task={scheduleTaskTarget} workStart={workStart} workEnd={workEnd} onClose={() => setScheduleTaskTarget(null)} onSchedule={(mode) => scheduleTaskIntoCalendar(scheduleTaskTarget, mode)} />}
      {dayPlan && <DailyPlanModal plan={dayPlan} mealBreaks={mealBreaks} planningRules={planningRules} onClose={() => setDayPlan(null)} onApply={applyDayPlan} onRegenerate={regenerateDayPlan} onMoveRemaining={movePlanRemainingToTomorrow} onMoveRemainingToWeek={movePlanRemainingToThisWeek} onSkipLowPriority={skipLowPriorityInDayPlan} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} onComplete={completeOnboarding} workStart={workStart} workEnd={workEnd} />}
            {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} workStart={workStart} setWorkStart={setWorkStart} workEnd={workEnd} setWorkEnd={setWorkEnd} mealBreaks={mealBreaks} setMealBreaks={setMealBreaks} planningRules={planningRules} setPlanningRules={setPlanningRules} timezone={timezone} setTimezone={setTimezone} categories={categories} setCategories={setCategories} user={auth.user} onSignOut={auth.signOut} gameStats={gameStats} onForceSync={forceSyncNow} syncStatus={syncStatus} syncDebug={syncDebug} onRestartOnboarding={restartOnboarding} />}
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
        budgetPage={budgetPage}
        syncStatus={syncStatus}
        pendingLocalChanges={pendingLocalChanges}
        lastSyncedAt={lastSyncedAt}
        onRetrySync={forceSyncNow}
        onToggleMenu={() => setSidebarOpen(v => !v)}
        onNavigateToday={() => navigateFromMobileNav("today")}
        onNavigateCalendar={() => { navigateFromMobileNav("calendar"); setView("day"); }}
        onNavigateTasks={() => { navigateFromMobileNav("tasks"); setTaskScope("day"); }}
        onNavigateBudgetPage={navigateBudgetPage}
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
@keyframes pulseDot{0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.25);opacity:1}}
@media(max-width:768px){
  :root{--safe-bottom:env(safe-area-inset-bottom,0px);--safe-top:env(safe-area-inset-top,0px);}
  .mobile-nav,.bottom-nav{padding-bottom:max(8px,var(--safe-bottom))!important;}
  .modal,.checkin-modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{max-height:calc(100dvh - max(16px,var(--safe-top)) - max(16px,var(--safe-bottom)))!important;}
  .settings-overlay,.modal-overlay,.checkin-overlay,.templates-overlay,.search-overlay{padding-top:max(8px,var(--safe-top))!important;padding-bottom:max(8px,var(--safe-bottom))!important;}
}


`;

