// Town Hall milestones: badges, each with a one-off blossom gift (Tempo_Achievement_Badges_50, rules
// from its badge_rules_and_gifts.csv; goals, pets, Study Buddy and money badges left out on request).
// A badge is noted in `earned` as "badge@<id>" (worth its gift), so it syncs between devices like any
// reward and can never be paid twice. Progress is read from your tasks, events and the game's records.
// Pictures: public/game/badges/<id>.png (192×192).
import { streakInfo } from "./economy.js";
import { taskCompletedDateKey } from "../tempo/core.js";

export const BADGE_GROUPS = [["tasks", "Tasks"], ["streaks", "Streaks"], ["cafe", "Café"], ["shopping", "Shopping"], ["planning", "Planning"], ["wellness", "Wellness"], ["meta", "Big ones"]];

// stat: which number counts; goal: how much of it you need
export const BADGES = [
  { id: "first_step", group: "tasks", name: "First Step", desc: "Finish your first task", stat: "tasks", goal: 1, gift: 5 },
  { id: "getting_going", group: "tasks", name: "10 Tasks", desc: "Finish 10 tasks", stat: "tasks", goal: 10, gift: 10 },
  { id: "in_full_bloom", group: "tasks", name: "50 Tasks", desc: "Finish 50 tasks", stat: "tasks", goal: 50, gift: 20 },
  { id: "hundred_club", group: "tasks", name: "100 Tasks", desc: "Finish 100 tasks", stat: "tasks", goal: 100, gift: 30 },
  { id: "busy_bee", group: "tasks", name: "250 Tasks", desc: "Finish 250 tasks", stat: "tasks", goal: 250, gift: 45 },
  { id: "task_royalty", group: "tasks", name: "500 Tasks", desc: "Finish 500 tasks", stat: "tasks", goal: 500, gift: 60 },
  { id: "daily_achiever", group: "tasks", name: "Daily Achiever", desc: "Finish 5 tasks in one day", stat: "bestTaskDay", goal: 5, gift: 8 },
  { id: "productive_day", group: "tasks", name: "Productive Day", desc: "3 tasks and a café focus session on the same day", stat: "productiveDays", goal: 1, gift: 12 },
  { id: "progress_maker", group: "tasks", name: "Progress Maker", desc: "Finish 10+ tasks in each of 4 different weeks", stat: "busyWeeks", goal: 4, gift: 25 },
  { id: "warming_up", group: "streaks", name: "3-Day Streak", desc: "A 3-day streak", stat: "streak", goal: 3, gift: 6 },
  { id: "5_day_streak", group: "streaks", name: "5-Day Streak", desc: "A 5-day streak", stat: "streak", goal: 5, gift: 10 },
  { id: "a_whole_week", group: "streaks", name: "7-Day Streak", desc: "A 7-day streak", stat: "streak", goal: 7, gift: 15 },
  { id: "two_weeks_strong", group: "streaks", name: "14-Day Streak", desc: "A 14-day streak", stat: "streak", goal: 14, gift: 24 },
  { id: "21_day_streak", group: "streaks", name: "21-Day Streak", desc: "A 21-day streak", stat: "streak", goal: 21, gift: 32 },
  { id: "month_of_momentum", group: "streaks", name: "30-Day Streak", desc: "A 30-day streak", stat: "streak", goal: 30, gift: 45 },
  { id: "60_day_streak", group: "streaks", name: "60-Day Streak", desc: "A 60-day streak", stat: "streak", goal: 60, gift: 70 },
  { id: "100_day_streak", group: "streaks", name: "100-Day Streak", desc: "A 100-day streak", stat: "streak", goal: 100, gift: 100 },
  { id: "streak_master", group: "streaks", name: "Streak Master", desc: "A 365-day streak", stat: "streak", goal: 365, gift: 200 },
  { id: "cafe_regular", group: "cafe", name: "Café Regular", desc: "Finish a café focus session", stat: "focus", goal: 1, gift: 5 },
  { id: "deep_focus", group: "cafe", name: "Deep Focus", desc: "Finish 10 café focus sessions", stat: "focus", goal: 10, gift: 15 },
  { id: "25_focus_sessions", group: "cafe", name: "25 Focus Sessions", desc: "Finish 25 café focus sessions", stat: "focus", goal: 25, gift: 25 },
  { id: "focus_master", group: "cafe", name: "Focus Master", desc: "Finish 50 café focus sessions", stat: "focus", goal: 50, gift: 45 },
  { id: "focus_zone", group: "cafe", name: "Focus Zone", desc: "3 café focus sessions in one day", stat: "bestFocusDay", goal: 3, gift: 12 },
  { id: "flow_state", group: "cafe", name: "Flow State", desc: "120 minutes of café focus in one day", stat: "bestFocusMinutes", goal: 120, gift: 20 },
  { id: "first_purchase", group: "shopping", name: "First Purchase", desc: "Buy something in town", stat: "bought", goal: 1, gift: 5 },
  { id: "home_maker", group: "shopping", name: "Home Maker", desc: "Buy 10 things", stat: "bought", goal: 10, gift: 15 },
  { id: "shopaholic", group: "shopping", name: "Shopaholic", desc: "Buy 25 things", stat: "bought", goal: 25, gift: 25 },
  { id: "planner_pro", group: "planning", name: "Planner Pro", desc: "Have 20 events in your calendar", stat: "events", goal: 20, gift: 15 },
  { id: "consistent_planner", group: "planning", name: "Consistent Planner", desc: "Add or change tasks or events on 7 different days", stat: "planningDays", goal: 7, gift: 15 },
  { id: "self_care_day", group: "wellness", name: "Self-Care Day", desc: "Finish a Wellness task", stat: "wellness", goal: 1, gift: 5 },
  { id: "wellness_starter", group: "wellness", name: "Wellness Starter", desc: "Finish 5 Wellness tasks", stat: "wellness", goal: 5, gift: 10 },
  { id: "active_day", group: "wellness", name: "Active Day", desc: "Finish an exercise task (walk, gym, yoga, run…)", stat: "exercise", goal: 1, gift: 5 },
  { id: "fitness_day", group: "wellness", name: "Fitness Day", desc: "Finish 10 exercise tasks", stat: "exercise", goal: 10, gift: 15 },
  { id: "time_off", group: "wellness", name: "Time Off", desc: "Have a holiday, day off or rest event in your calendar", stat: "timeOff", goal: 1, gift: 5 },
  { id: "milestone_champ", group: "meta", name: "Milestone Champ", desc: "Earn 20 other badges", stat: "badges", goal: 20, gift: 40 },
  { id: "tempo_master", group: "meta", name: "Tempo Master", desc: "Earn every other badge", stat: "badges", goal: 35, gift: 100 },
];
const PREFIX = "badge@";
export const badgeImage = id => `/game/badges/${id}.png`;

// words that make a task count as exercise, and an event as time off
const EXERCISE = /\b(walk|walking|run|running|jog|gym|workout|work out|exercise|yoga|pilates|stretch|stretching|swim|swimming|bike|cycling|cycle|hike|hiking|dance|dancing|training|lift|lifting|sport|tennis|badminton|football|basketball|steps)\b/i;
const TIME_OFF = /\b(holiday|holidays|vacation|day off|days off|time off|rest day|pto|staycation|annual leave|on leave|getaway|retreat)\b/i;

const localDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const weekOf = key => { const [y, m, d] = key.split("-").map(Number); const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); return localDay(dt); };
const maxOf = map => Math.max(0, ...Object.values(map));

// café sessions: "focus@<start time>[~<minutes>]" in earned (sessions before minutes were noted count as 25)
function focusSessions(earned) {
  return Object.keys(earned).filter(k => k.startsWith("focus@") && earned[k] > 0).map(k => {
    const [stamp, mins] = k.slice(6).split("~"), t = new Date(stamp);
    return { day: Number.isNaN(t.getTime()) ? null : localDay(t), mins: Number(mins) || 25 };
  });
}

// the numbers badges are measured against
export function badgeStats(game, tasks = [], events = []) {
  const earned = game?.earned || {};
  const done = tasks.filter(t => t && t.done);
  const perDay = {}, perWeek = {};
  for (const t of done) { const k = taskCompletedDateKey(t); if (!k) continue; perDay[k] = (perDay[k] || 0) + 1; const w = weekOf(k); perWeek[w] = (perWeek[w] || 0) + 1; }
  const sessions = focusSessions(earned), focusPerDay = {}, minutesPerDay = {};
  for (const s of sessions) if (s.day) { focusPerDay[s.day] = (focusPerDay[s.day] || 0) + 1; minutesPerDay[s.day] = (minutesPerDay[s.day] || 0) + s.mins; }
  const planning = new Set();
  for (const r of [...tasks, ...events]) for (const v of [r?.createdAt, r?.updatedAt]) { const t = v ? new Date(v) : null; if (t && !Number.isNaN(t.getTime())) planning.add(localDay(t)); }
  const now = Date.now();
  return {
    tasks: done.length,
    bestTaskDay: maxOf(perDay),
    productiveDays: Object.keys(perDay).filter(d => perDay[d] >= 3 && focusPerDay[d] >= 1).length,
    busyWeeks: Object.values(perWeek).filter(n => n >= 10).length,
    streak: streakInfo(game || {}).best,
    focus: sessions.length,
    bestFocusDay: maxOf(focusPerDay),
    bestFocusMinutes: maxOf(minutesPerDay),
    bought: Object.values(game?.owned || {}).reduce((n, v) => n + (Number(v) || 0), 0),
    events: events.filter(e => e && !e.isOccurrence).length,
    planningDays: planning.size,
    wellness: done.filter(t => String(t.category || "").toLowerCase() === "wellness").length,
    exercise: done.filter(t => EXERCISE.test(String(t.title || ""))).length,
    timeOff: events.filter(e => e && TIME_OFF.test(String(e.title || "")) && new Date(e.end || e.start).getTime() < now).length,
  };
}

export const hasBadge = (game, id) => `${PREFIX}${id}` in (game?.earned || {});

// every badge with whether you have it and how far along you are; the two "Big ones" count the others
export function badgeProgress(game, tasks, events) {
  const stats = badgeStats(game, tasks, events);
  const list = BADGES.map(b => ({ ...b, have: hasBadge(game, b.id), value: 0, reached: false }));
  for (const b of list) if (b.stat !== "badges") { b.reached = stats[b.stat] >= b.goal; b.value = Math.min(stats[b.stat], b.goal); }
  const others = list.filter(b => b.stat !== "badges" && (b.have || b.reached)).length;
  for (const b of list) if (b.stat === "badges") { b.reached = others >= b.goal; b.value = Math.min(others, b.goal); }
  return list;
}

// badges reached but not yet given
export const newBadges = (game, tasks, events) => badgeProgress(game, tasks, events).filter(b => b.reached && !b.have);

// give badges (and their gifts): each only once
export function awardBadges(game, badges) {
  const earned = { ...(game.earned || {}) };
  let blossoms = game.blossoms || 0;
  for (const b of badges) {
    if (`${PREFIX}${b.id}` in earned) continue;
    earned[`${PREFIX}${b.id}`] = b.gift; blossoms += b.gift;
  }
  return { ...game, blossoms, earned };
}
