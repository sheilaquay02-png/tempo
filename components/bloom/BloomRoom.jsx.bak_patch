import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as Core from "../../lib/tempo/core";
const { makeRecurringTaskOccurrence, taskOccurrenceFallsInPeriod, ensureRecurringTasksForPeriod, stepRecurringDate, weeksBetween, shouldEmitOccurrence, applyOccurrenceExceptions, deleteSingleOccurrence, modifySingleOccurrence, createFollowingSeries, createNextRecurringTask, expandRecurring, parseTimeStr, parseTimeRange, parseDur, parseDateRef, parseDateMention, parseDayWindow, fitFreeSlot, eventFromWindow, cleanTitle, inferCategory, buildGreeting, processMessage, deriveMemoryCryptoKey, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, saveJournalLocal, loadJournalLocal, readFileAsDataUrl, prepareJournalPhotosFromFiles, DAY_START, RECURRENCE_WINDOW_DAYS, RECURRENCE_SAFETY_LIMIT, UNDO_STACK_MAX, CLOUD_FALLBACK_MS, CHAT_REPLY_DELAY_MS, EVENT_DRAG_HOLD_MS, CALENDARS, CATEGORIES, PRIORITIES, normalizeCategories, FONT_SIZES, THEMES, DAY_TEMPLATES, TODAY, DEFAULT_TIMEZONE, setDisplayTimezoneCtx, formatWithDisplayTimezone, fmt, fmtDate, sameDay, fmtDay, minsToTime, dateKey, cloneDate, addDaysSafe, addMonthsSafe, dayStart, getEventsOnDay, weekStart, weekDays, monthDays, getFreeBlocks, totalMins, hasConflict, endOfDay, eventOccursOnDay, isAllDayEvent, isMultiDayEvent, isAllDayOrMulti, eventSegmentForDay, toDateInput, toTimeInputValue, applyDateAndTime, taskDurationToMinutes, splitTaskDuration, formatTaskDuration, localDateFromKey, localDateFromMonthKey, monthKey, taskScopeOf, taskAnchorDate, taskDayKey, taskWeekKey, taskMonthKey, taskPeriodPatchForScope, withTaskPeriod, normalizeTasks, taskBelongsToPeriod, shiftTaskPeriodDate, formatTaskPeriodLabel, taskCompletionTargetKey, taskHasCompletionStamp, taskCompletedDateKey, taskSeriesId, taskPeriodIdentity, taskSkippedPeriods, taskSamePeriod, taskExistsForPeriod, completedTasksForDateKey, LEVEL_TITLES, XP_PER_LEVEL, taskXPValue, dateRangeKeys, hasJournalEntryForKey, allDayTasksForKey, dailyGameSummary, productiveKeysFromData, plannedTomorrowKeysFromData, countBackwardStreak, buildDailyQuests, buildWeeklyRecap, buildWeeklyMissions, buildCombos, buildPersonalLeaderboard, buildRhythmPersonality, buildBadges, skillRank, buildSkillStats, MASCOT_STAGES, buildMascotProgression, THEME_UNLOCK_RULES, buildThemeUnlocksForStats, buildMonthlyLifeGarden, calculateGameStats, createCategoryId, isRecurringEvent, uid, setWorkHoursCtx, freeBlocks, SER, DES, save, load, reviveEvents, normalizeRecurrence, recurrenceDateKey, recurrenceEndDate, recurrenceSkippedDates, occurrenceId, getBaseEventId, isOccurrence, stripOccurrenceMeta, _t, INIT_EVENTS, _deadline, INIT_TASKS, hasStoredUserData, loadStoredEventsOrSeed, loadStoredTasksOrSeed, JOURNAL_MOODS, JOURNAL_ACTIVITIES, JOURNAL_PROMPTS, DAILY_CHECKIN_MOODS, DAILY_CHECKIN_ENERGIES, normalizeDailyCheckIns, dailyCheckInForDate, normalizeTomorrowResets, tomorrowResetForDate, normalizeWeeklyResets, weeklyResetForDate, WEEKLY_RESET_TASK_ACTIONS, DEFAULT_AFFIRMATIONS, normalizeAffirmations, affirmationCategoryById, affirmationForDate, MEMORY_TAGS, SCRAPBOOK_STICKERS, MEMORY_ASSET_BASE, MEMORY_BACKGROUNDS, COZY_STICKER_PACK, memoryBackgroundById, memoryBackgroundStyle, normalizeMemoryEntry, sanitizeMemoryPhotoForStorage, sanitizeMemoryEntryForStorage, sanitizeMemoryJournalForStorage, normalizeMemoryJournalForState, isEncryptedMemoryJournal, memoryPhotoSrc, memoryEntryCover, memoryTagLabel, _displayTimezone, _workStart } = Core;

// ─── Gamification UI ──────────────────────────────────────────────────────────
export function LevelBar({ gameStats }) {
  if (!gameStats) return null;
  const rhythmDays = gameStats?.streaks?.productive ?? 0;
  return (
    <div className="level-card simplified-rhythm-card">
      <div className="level-topline">
        <div>
          <div className="level-label">Consistency</div>
          <div className="level-title">{rhythmDays ? `${rhythmDays} day rhythm` : "Start gently"}</div>
        </div>
        <div className="level-xp">🌿</div>
      </div>
      <div className="level-meta"><span>Calm consistency</span><span>No pressure</span></div>
    </div>
  );
}

export function MascotProgressCard({ gameStats }) {
  if (!gameStats?.mascot) return null;
  const m = gameStats.mascot;
  return (
    <div className="mascot-progress-card game-soft-card">
      <div className="game-card-head">
        <span className="game-card-title">Mascot Progress</span>
        <span className="game-card-sub">{m.nextName === "Max Stage" ? "max glow" : `${m.toNext} lvl to next`}</span>
      </div>
      <div className={`mascot-stage ${m.mood}`}>
        <div className="mascot-stage-icon">{m.emoji}</div>
        <div className="mascot-stage-body">
          <div className="mascot-stage-name">{m.name}</div>
          <div className="mascot-stage-note">{m.note}<br/><span>{m.reaction}</span></div>
        </div>
      </div>
      <div className="level-track mini"><div className="level-fill" style={{ width: `${m.stagePct}%` }} /></div>
    </div>
  );
}

export function DailyQuestsCard({ gameStats }) {
  if (!gameStats) return null;
  const done = gameStats.quests.filter(q => q.done).length;
  return (
    <div className="daily-quests-card">
      <div className="game-card-head">
        <div><span className="game-card-title">Daily Checkpoints</span><span className="game-card-sub"> {done}/{gameStats.quests.length} done</span></div>
        <span className="score-pill">{done}/{gameStats.quests.length} today</span>
      </div>
      <div className="quest-list">
        {gameStats.quests.map(q => (
          <div key={q.id} className={`quest-item ${q.done ? "done" : ""}`}>
            <span className="quest-icon">{q.done ? "✓" : q.icon}</span>
            <div className="quest-body"><div className="quest-title">{q.title}</div><div className="quest-desc">{q.desc}</div></div>
            <span className="quest-xp">{q.done ? "Done" : "Open"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkillStatsCard({ gameStats }) {
  if (!gameStats?.skills) return null;
  return (
    <div className="skills-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Gentle Stats</span><span className="game-card-sub">gentle growth</span></div>
      <div className="skill-list">
        {gameStats.skills.filter(s => s.id !== "focus").map(s => (
          <div key={s.id} className="skill-row" title={s.desc}>
            <div className="skill-main"><span className="skill-icon">{s.icon}</span><span className="skill-name">{s.label}</span><span className="skill-level">Lv {s.level}</span></div>
            <div className="skill-track"><div className="skill-fill" style={{ width: `${s.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyRecapCard({ gameStats }) {
  if (!gameStats?.weekly) return null;
  const w = gameStats.weekly;
  return (
    <div className="weekly-recap-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Weekly Recap</span><span className="score-pill">{w.rank} · {w.avgScore}</span></div>
      <div className="weekly-label">{w.label}</div>
      <div className="weekly-mini-grid">
        <div><strong>{w.tasksDone}</strong><span>tasks done</span></div>
        <div><strong>{w.journalDays}</strong><span>journal days</span></div>
        <div><strong>{w.daily?.filter?.(d => d.score > 0).length || 0}</strong><span>active days</span></div>
        <div><strong>{w.bestDayLabel}</strong><span>best day</span></div>
      </div>
      <div className="weekly-bars">
        {w.daily.map(d => <span key={d.key} className={`weekly-dot rank-${d.rank.toLowerCase()}`} title={`${d.key}: ${d.score}`} />)}
      </div>
    </div>
  );
}


export function LifeGardenCard({ gameStats }) {
  if (!gameStats?.lifeGarden) return null;
  const g = gameStats.lifeGarden;
  return (
    <div className="life-garden-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Monthly Life Garden</span><span className="game-card-sub">{g.activeDays} active · {g.goldenDays} gold</span></div>
      <div className="garden-label">{g.label}</div>
      <div className="garden-dow">{["M","T","W","T","F","S","S"].map((d,i)=><span key={i}>{d}</span>)}</div>
      <div className="garden-grid">
        {g.cells.map((c, i) => c ? (
          <div key={c.key} className={`garden-cell ${c.className}`} title={`${c.key} · ${c.rank} Rank · ${c.score}/100`}>
            <span className="garden-bloom">{c.bloom}</span><span className="garden-day">{c.day}</span>
          </div>
        ) : <div key={`empty-${i}`} className="garden-cell blank" />)}
      </div>
    </div>
  );
}




export function StreaksCard({ gameStats }) {
  if (!gameStats?.streaks) return null;
  const rows = [
    ["🌿", "Rhythm", gameStats.streaks.productive],
    ["✅", "Tasks", gameStats.streaks.tasks],
    ["📔", "Journal", gameStats.streaks.journal],
    ["🌙", "Reset", gameStats.streaks.review],
    ["🗓️", "Plan", gameStats.streaks.planning],
  ];
  return (
    <section className="streaks-card streak-garden-flat" aria-label="Streak Garden">
      <div className="game-card-head streak-garden-head"><span className="game-card-title">Streak Garden</span><span className="game-card-sub">gentle consistency</span></div>
      <div className="streak-grid streak-grid-five">
        {rows.map(([icon, label, val]) => <div key={label} className="streak-pill streak-garden-pill"><span>{icon}</span><strong>{val}d</strong><small>{label}</small></div>)}
      </div>
    </section>
  );
}

export function PersonalityCard({ gameStats }) {
  if (!gameStats?.personality) return null;
  const p = gameStats.personality;
  return (
    <div className="personality-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Rhythm Type</span><span className="game-card-sub">your style</span></div>
      <div className="personality-main"><span>{p.icon}</span><div><strong>{p.type}</strong><p>{p.desc}</p></div></div>
    </div>
  );
}


export function GameDashboard({ gameStats, compact = false }) {
  if (!gameStats) return null;
  return (
    <div className={`game-dashboard simplified streak-only ${compact ? "compact" : ""}`}>
      <StreaksCard gameStats={gameStats} />
    </div>
  );
}


export function CheckInRhythmCard({ dailyCheckIns = [] }) {
  const today = dailyCheckInForDate(dailyCheckIns, TODAY);
  const mood = today?.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === today.mood) : null;
  const energy = today?.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === today.energy) : null;
  const recent = normalizeDailyCheckIns(dailyCheckIns).slice(0, 7);
  return (
    <div className="checkin-rhythm-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Mood & Energy</span><span className="game-card-sub">daily context</span></div>
      <div className="checkin-rhythm-current">
        <span className="big-emoji">{mood?.emoji || "🌿"}</span>
        <div>
          <strong>{mood ? `Feeling ${mood.label}` : "No check-in yet"}</strong>
          <p>{energy ? `${energy.emoji} ${energy.label} energy` : "Energy not set"}{today?.note ? ` · ${today.note.slice(0, 90)}` : ""}</p>
        </div>
      </div>
      {!recent.length && <div className="empty-game-note">Your mood and energy trail will appear after your first check-in 🌱</div>}
    </div>
  );
}



export function AffirmationRhythmCard({ affirmations = DEFAULT_AFFIRMATIONS }) {
  const daily = affirmationForDate(affirmations, TODAY);
  const all = normalizeAffirmations(affirmations);
  const favorites = all.filter(a => a.favorite).length;
  const custom = all.filter(a => a.source === "custom").length;
  const category = daily ? affirmationCategoryById(daily.category) : null;
  return (
    <div className="affirmation-rhythm-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Daily Affirmation</span><span className="game-card-sub">soft reminder</span></div>
      <div className="checkin-rhythm-current">
        <span className="big-emoji">{category?.emoji || "💌"}</span>
        <div>
          <strong>{daily ? `“${daily.text}”` : "No affirmation yet"}</strong>
          <p>{daily ? `${category?.label || "Calm"} · ${favorites} favorite${favorites === 1 ? "" : "s"} · ${custom} custom` : "Create a gentle reminder to return to each day."}</p>
        </div>
      </div>
    </div>
  );
}


export function TomorrowResetRhythmCard({ tomorrowResets = [] }) {
  const todayReset = tomorrowResetForDate(tomorrowResets, TODAY);
  const recent = normalizeTomorrowResets(tomorrowResets).slice(0, 5);
  const totals = recent.reduce((acc, reset) => {
    acc.tomorrow += Number(reset.summary?.movedTomorrow || 0);
    acc.week += Number(reset.summary?.movedWeek || 0);
    acc.kept += Number(reset.summary?.kept || 0);
    acc.dropped += Number(reset.summary?.dropped || 0);
    return acc;
  }, { tomorrow: 0, week: 0, kept: 0, dropped: 0 });
  return (
    <div className="tomorrow-reset-rhythm-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Tomorrow Reset</span><span className="game-card-sub">evening close</span></div>
      <div className="checkin-rhythm-current">
        <span className="big-emoji">🌙</span>
        <div>
          <strong>{todayReset ? "Today has been reset" : "No reset saved today"}</strong>
          <p>{todayReset?.reflection?.tomorrowMainThing ? `Tomorrow’s main thing: ${todayReset.reflection.tomorrowMainThing}` : "Process unfinished tasks and write a quick reflection before tomorrow."}</p>
        </div>
      </div>
      {recent.length ? (
        <div className="tomorrow-reset-mini-grid">
          <div><strong>{recent.length}</strong><span>recent resets</span></div>
          <div><strong>{totals.tomorrow}</strong><span>moved tomorrow</span></div>
          <div><strong>{totals.week}</strong><span>moved this week</span></div>
          <div><strong>{totals.dropped}</strong><span>dropped</span></div>
        </div>
      ) : <div className="empty-game-note">Your evening reset trail will appear here after your first Tomorrow Reset 🌱</div>}
    </div>
  );
}


function WeeklyResetRhythmCard({ weeklyResets = [] }) {
  const current = weeklyResetForDate(weeklyResets, TODAY);
  const recent = normalizeWeeklyResets(weeklyResets).slice(0, 6);
  const totals = recent.reduce((acc, reset) => {
    acc.moved += reset.summary?.movedNextWeek || 0;
    acc.dropped += reset.summary?.dropped || 0;
    acc.priorities += reset.priorities?.length || 0;
    return acc;
  }, { moved: 0, dropped: 0, priorities: 0 });
  return (
    <div className="weekly-reset-rhythm-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Weekly Reset</span><span className="game-card-sub">weekly rhythm</span></div>
      <div className="checkin-rhythm-current">
        <span className="big-emoji">🧺</span>
        <div>
          <strong>{current ? "This week has been reset" : "No Weekly Reset yet"}</strong>
          <p>{current?.priorities?.length ? `Focus: ${current.priorities.slice(0, 2).join(" · ")}` : "Review your week, choose priorities, and prepare the next rhythm."}</p>
        </div>
      </div>
      {recent.length ? (
        <div className="tomorrow-reset-mini-grid weekly-reset-mini-grid">
          <div><strong>{recent.length}</strong><span>weekly resets</span></div>
          <div><strong>{totals.priorities}</strong><span>priorities</span></div>
          <div><strong>{totals.moved}</strong><span>moved forward</span></div>
          <div><strong>{totals.dropped}</strong><span>dropped</span></div>
        </div>
      ) : <div className="empty-game-note">Your Weekly Reset trail will appear here after your first reset 🌱</div>}
    </div>
  );
}


function ReflectionHubCard({ journal = {}, dailyCheckIns = [], tomorrowResets = [], weeklyResets = [] }) {
  const todayKey = dateKey(TODAY);
  const todayEntry = normalizeMemoryEntry(journal?.[todayKey] || {});
  const todayCheckIn = dailyCheckInForDate(dailyCheckIns, TODAY);
  const mood = todayCheckIn?.mood ? DAILY_CHECKIN_MOODS.find(m => m.id === todayCheckIn.mood) : null;
  const energy = todayCheckIn?.energy ? DAILY_CHECKIN_ENERGIES.find(e => e.id === todayCheckIn.energy) : null;
  const todayReset = tomorrowResetForDate(tomorrowResets, TODAY);
  const weekly = weeklyResetForDate(weeklyResets, TODAY);
  const gratitude = (todayEntry.gratitude || []).filter(Boolean)[0] || todayReset?.reflection?.gratitude || "";
  const journalDays = Object.entries(journal || {}).filter(([key, entry]) => key && hasJournalEntryForKey({ [key]: entry }, key)).length;
  return (
    <div className="reflection-hub-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Reflection Hub</span><span className="game-card-sub">journal + reset context</span></div>
      <div className="tomorrow-reset-mini-grid reflection-hub-mini-grid">
        <div><strong>{mood?.emoji || "🌿"}</strong><span>{mood ? mood.label : "Mood"}</span></div>
        <div><strong>{energy?.emoji || "⚡"}</strong><span>{energy ? `${energy.label} energy` : "Energy"}</span></div>
        <div><strong>{journalDays}</strong><span>journal days</span></div>
        <div><strong>{weekly ? "✓" : "—"}</strong><span>weekly reset</span></div>
      </div>
      <div className="checkin-rhythm-current reflection-hub-note">
        <span className="big-emoji">📔</span>
        <div>
          <strong>{todayReset?.reflection?.tomorrowMainThing ? `Tomorrow: ${todayReset.reflection.tomorrowMainThing}` : "A softer place to reflect"}</strong>
          <p>{gratitude ? `Gratitude: ${gratitude}` : todayEntry.note ? todayEntry.note.slice(0, 110) : "Your gratitude, daily reflection, tomorrow intention, and weekly reset will build here."}</p>
        </div>
      </div>
    </div>
  );
}

export function BloomRoomPage({ gameStats, journal = {}, dailyCheckIns = [], tomorrowResets = [], weeklyResets = [], affirmations = DEFAULT_AFFIRMATIONS }) {
  return (
    <div className="bloom-room-page">
      <div className="journal-header">
        <div>
          <div className="journal-title">🌸 Bloom Room</div>
          <div className="bloom-room-subtitle">Your soft rhythm progress space</div>
        </div>
        <div className="journal-streak">{gameStats?.streaks?.productive ?? 0} day rhythm</div>
      </div>
      <ReflectionHubCard journal={journal} dailyCheckIns={dailyCheckIns} tomorrowResets={tomorrowResets} weeklyResets={weeklyResets} />
      <div className="bloom-card-row bloom-mood-affirmation-row">
        <CheckInRhythmCard dailyCheckIns={dailyCheckIns} />
        <AffirmationRhythmCard affirmations={affirmations} />
      </div>
      <div className="bloom-card-row bloom-reset-row">
        <TomorrowResetRhythmCard tomorrowResets={tomorrowResets} />
        <WeeklyResetRhythmCard weeklyResets={weeklyResets} />
      </div>
      <GameDashboard gameStats={gameStats} />
    </div>
  );
}


export function BloomCollapse({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  function toggle() {
    if (typeof window !== "undefined" && window.innerWidth <= 768) setOpen(v => !v);
  }
  return (
    <div className={`bloom-collapse ${open ? "open" : ""}`}>
      <button className="bloom-collapse-head" onClick={toggle} aria-expanded={open}>
        <span>{title}</span><span className="bloom-collapse-mark">{open ? "−" : "+"}</span>
      </button>
      <div className="bloom-collapse-body">{children}</div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
