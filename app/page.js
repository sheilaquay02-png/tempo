/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useState, useRef, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_START = 0, DAY_END = 24, HOUR_H = 48;

const CALENDARS = [
  { id: "personal", name: "Personal", color: "#FF7BAC", account: "john@gmail.com" },
  { id: "work",     name: "Work",     color: "#B08AE0", account: "john@company.com" },
];

const CATEGORIES = [
  { id: "deep",     label: "Deep Work", color: "#B08AE0", icon: "🔮" },
  { id: "admin",    label: "Admin",     color: "#A0C8E0", icon: "📋" },
  { id: "meeting",  label: "Meeting",   color: "#FF7BAC", icon: "💬" },
  { id: "personal", label: "Personal",  color: "#70C8A0", icon: "🌿" },
  { id: "health",   label: "Health",    color: "#FFB870", icon: "🌸" },
];

const PRIORITIES = [
  { id: "high",   label: "High",   color: "#FF6B8A", icon: "🔴" },
  { id: "medium", label: "Medium", color: "#FFB347", icon: "🟡" },
  { id: "low",    label: "Low",    color: "#7EC8A0", icon: "🟢" },
];

const FONT_SIZES = [
  { id: "xs", label: "XS", desc: "Extra small", scale: 0.78 },
  { id: "sm", label: "S",  desc: "Small",       scale: 0.88 },
  { id: "md", label: "M",  desc: "Medium",      scale: 1.00 },
  { id: "lg", label: "L",  desc: "Large",       scale: 1.14 },
  { id: "xl", label: "XL", desc: "Extra large", scale: 1.28 },
];

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "tempo",
    label: "Tempo",
    description: "Pink & Purple",
    swatch: ["#FF7BAC", "#B08AE0", "#FFF5F7"],
    light: "--bg:#FFF5F7;--bg2:#FFFFFF;--bg3:#FFF0F4;--bg4:#FFE4EC;--border:#FFD6E4;--text:#4A2840;--text2:#7A4060;--text3:#A07090;",
    dark:  "--bg:#1A0F1E;--bg2:#231329;--bg3:#2D1A35;--bg4:#3D2445;--border:#4D2A5D;--text:#F5E8F8;--text2:#C090D0;--text3:#805890;",
    accent: "--accent:#FF7BAC;--accent2:#FF9EC4;--accent3:#FFBAD4;",
  },
  {
    id: "pink-white",
    label: "Pink/White",
    description: "Pastel & Soft",
    swatch: ["#F4A7C3", "#F9C8DA", "#FFFFFF"],
    light: "--bg:#FFFFFF;--bg2:#FFFFFF;--bg3:#FFF6F9;--bg4:#FDEAF2;--border:#F9D0E3;--text:#3D1A2C;--text2:#7A4060;--text3:#B07090;",
    dark:  "--bg:#1E0F18;--bg2:#2A1522;--bg3:#361B2C;--bg4:#44223A;--border:#5C2E4E;--text:#FAE8F2;--text2:#E8A8C8;--text3:#A06080;",
    accent: "--accent:#F4A7C3;--accent2:#F9C8DA;--accent3:#FDE0EC;",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Teal & Blue",
    swatch: ["#20B2AA", "#5F9EA0", "#E0FFFF"],
    light: "--bg:#F0FAFA;--bg2:#FFFFFF;--bg3:#E6F7F7;--bg4:#CCF0EE;--border:#99DDD9;--text:#0D3535;--text2:#2A6060;--text3:#4A8888;",
    dark:  "--bg:#071820;--bg2:#0D2530;--bg3:#123040;--bg4:#1A3E50;--border:#1E5060;--text:#E0FFFF;--text2:#80D8D0;--text3:#409090;",
    accent: "--accent:#20B2AA;--accent2:#40C8C0;--accent3:#80DDD8;",
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Coral & Orange",
    swatch: ["#FF7050", "#FF9040", "#FFF8F0"],
    light: "--bg:#FFF8F0;--bg2:#FFFFFF;--bg3:#FFF2E6;--bg4:#FFE4CC;--border:#FFCCA0;--text:#3A1800;--text2:#7A3A10;--text3:#A05A30;",
    dark:  "--bg:#1E0E00;--bg2:#2A1400;--bg3:#381C00;--bg4:#4A2600;--border:#603200;--text:#FFF0E0;--text2:#FFA060;--text3:#C06030;",
    accent: "--accent:#FF7050;--accent2:#FF9040;--accent3:#FFBA80;",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Green & Earthy",
    swatch: ["#2E8B57", "#8FBC8F", "#F5F9F0"],
    light: "--bg:#F5F9F0;--bg2:#FFFFFF;--bg3:#EAF4E4;--bg4:#D4EAC8;--border:#A8D898;--text:#0D2810;--text2:#2A5530;--text3:#4A7850;",
    dark:  "--bg:#071208;--bg2:#0D1E10;--bg3:#122818;--bg4:#183520;--border:#1E4428;--text:#E8F5E0;--text2:#80C890;--text3:#408850;",
    accent: "--accent:#2E8B57;--accent2:#50A870;--accent3:#90CC90;",
  },
  {
    id: "mono",
    label: "Mono",
    description: "Minimal Grayscale",
    swatch: ["#36454F", "#708090", "#F8F8F8"],
    light: "--bg:#F8F8F8;--bg2:#FFFFFF;--bg3:#F0F0F0;--bg4:#E4E4E4;--border:#CCCCCC;--text:#1A1A1A;--text2:#555555;--text3:#888888;",
    dark:  "--bg:#0A0A0A;--bg2:#141414;--bg3:#1E1E1E;--bg4:#282828;--border:#383838;--text:#F0F0F0;--text2:#AAAAAA;--text3:#666666;",
    accent: "--accent:#36454F;--accent2:#708090;--accent3:#A0B0B8;",
  },
];

const DAY_TEMPLATES = [
  { id: "deep", label: "🔮 Deep Work Day", events: [
    { title: "Morning Focus",   start: [9,0],  end: [11,0], category: "deep",     fixed: false },
    { title: "Lunch",           start: [12,0], end: [13,0], category: "personal", fixed: true  },
    { title: "Afternoon Focus", start: [13,0], end: [15,0], category: "deep",     fixed: false },
    { title: "Review & Plan",   start: [16,0], end: [17,0], category: "admin",    fixed: false },
  ]},
  { id: "meetings", label: "💬 Meeting Heavy", events: [
    { title: "Team Standup", start: [9,0],  end: [9,30],  category: "meeting",  fixed: true  },
    { title: "1-on-1s",      start: [10,0], end: [11,0],  category: "meeting",  fixed: false },
    { title: "Lunch",        start: [12,0], end: [13,0],  category: "personal", fixed: true  },
    { title: "Project Sync", start: [14,0], end: [15,0],  category: "meeting",  fixed: false },
    { title: "Wrap-up",      start: [17,0], end: [17,30], category: "admin",    fixed: false },
  ]},
  { id: "light", label: "🌿 Light Day", events: [
    { title: "Morning Emails", start: [9,0],  end: [9,30], category: "admin",    fixed: false },
    { title: "Lunch",          start: [12,0], end: [13,0], category: "personal", fixed: true  },
    { title: "Gym",            start: [17,0], end: [18,0], category: "health",   fixed: false },
  ]},
];

const TODAY = new Date(); TODAY.setHours(0,0,0,0); // always real today

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt      = d => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
const fmtDate  = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const sameDay  = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDay   = d => {
  if (sameDay(d, TODAY)) return "today";
  const t = new Date(TODAY); t.setDate(t.getDate() + 1);
  if (sameDay(d, t)) return "tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};
const minsToTime = m => {
  const h = Math.floor(m / 60), mn = m % 60, ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return mn === 0 ? `${hd}${ap}` : `${hd}:${mn.toString().padStart(2, "0")}${ap}`;
};
const getEventsOnDay  = (evs, d) => evs.filter(e => sameDay(e.start, d)).sort((a, b) => a.start - b.start);
const getFreeBlocks   = (evs, d, ws = 9, we = 19) => {
  const de = getEventsOnDay(evs, d); const bl = []; let cur = ws * 60; const em = we * 60;
  for (const e of de) {
    const es = e.start.getHours() * 60 + e.start.getMinutes(), ee = e.end.getHours() * 60 + e.end.getMinutes();
    if (es > cur) bl.push({ start: cur, end: es });
    cur = Math.max(cur, ee);
  }
  if (cur < em) bl.push({ start: cur, end: em });
  return bl.filter(b => b.end - b.start >= 15);
};
const totalMins   = (evs, d) => getEventsOnDay(evs, d).reduce((a, e) => a + (e.end - e.start) / 60000, 0);
const hasConflict = (evs, ev) => evs.filter(e => e.id !== ev.id && sameDay(e.start, ev.start)).some(e => ev.start < e.end && ev.end > e.start);

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
let _workStart = 9, _workEnd = 19;
const setWorkHoursCtx = (ws, we) => { _workStart = ws; _workEnd = we; };
const freeBlocks = (evs, d) => getFreeBlocks(evs, d, _workStart, _workEnd);

// ─── Persistence ─────────────────────────────────────────────────────────────
const SER  = (_, v) => v instanceof Date ? { __d: v.toISOString() } : v;
const DES  = (_, v) => v && v.__d ? new Date(v.__d) : v;
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v, SER)); } catch {} };
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r, DES) : fb; } catch { return fb; } };

// Guarantee event dates are always real Date objects regardless of source
// (localStorage JSON, Supabase JSONB, or in-memory — all can drift to strings)
const reviveEvents = evs => evs.map(e => ({
  ...e,
  start: e.start instanceof Date ? e.start : new Date(e.start?.__d ?? e.start),
  end:   e.end   instanceof Date ? e.end   : new Date(e.end?.__d   ?? e.end),
}));

// ─── Recurring event expansion ────────────────────────────────────────────────
// Given the stored base events, expand recurring ones into a window of ±60 days
function expandRecurring(baseEvents, windowDays = 60) {
  const result = [];
  const winStart = new Date(TODAY); winStart.setDate(winStart.getDate() - windowDays);
  const winEnd   = new Date(TODAY); winEnd.setDate(winEnd.getDate() + windowDays);

  for (const ev of baseEvents) {
    result.push(ev); // always include the original
    if (!ev.recurrence) continue;
    const dur = ev.end - ev.start; // ms

    // Generate occurrences within the window
    const cursor = new Date(ev.start);
    // Step to first occurrence on or after winStart
    while (cursor < winStart) {
      if (ev.recurrence === "daily")    cursor.setDate(cursor.getDate() + 1);
      else if (ev.recurrence === "weekly")   cursor.setDate(cursor.getDate() + 7);
      else if (ev.recurrence === "weekdays") {
        do { cursor.setDate(cursor.getDate() + 1); } while (cursor.getDay() === 0 || cursor.getDay() === 6);
      }
      else if (ev.recurrence === "monthly")  cursor.setMonth(cursor.getMonth() + 1);
      else break;
    }

    let safety = 0;
    while (cursor <= winEnd && safety++ < 500) {
      // Skip the original date itself
      if (!sameDay(cursor, ev.start)) {
        const start = new Date(cursor);
        const end   = new Date(cursor.getTime() + dur);
        result.push({
          ...ev,
          id:    ev.id + "_r_" + dateKey(cursor),
          start,
          end,
          _recurring: true, // mark as generated — not stored
        });
      }
      // Advance
      if (ev.recurrence === "daily")    cursor.setDate(cursor.getDate() + 1);
      else if (ev.recurrence === "weekly")   cursor.setDate(cursor.getDate() + 7);
      else if (ev.recurrence === "weekdays") {
        do { cursor.setDate(cursor.getDate() + 1); } while (cursor.getDay() === 0 || cursor.getDay() === 6);
      }
      else if (ev.recurrence === "monthly")  cursor.setMonth(cursor.getMonth() + 1);
      else break;
    }
  }
  return result;
}


const dateKey = d => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};

// ─── Seed data ────────────────────────────────────────────────────────────────
// Seed events — relative to real today so demo data is always current
const _t = (h, m, offsetDays = 0) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(h, m, 0, 0); return d; };
const INIT_EVENTS = [
  { id:"e1", title:"Team Standup",    start:_t(9,0),   end:_t(9,30),  calendar:"work",     category:"meeting",  fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e2", title:"Deep Work",       start:_t(10,0),  end:_t(12,0),  calendar:"work",     category:"deep",     fixed:false, color:null, notes:"Focus on top priority",recurrence:null   },
  { id:"e3", title:"Lunch",           start:_t(12,0),  end:_t(13,0),  calendar:"personal", category:"personal", fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e4", title:"Client Call",     start:_t(14,0),  end:_t(15,0),  calendar:"work",     category:"meeting",  fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e5", title:"Review & Admin",  start:_t(15,15), end:_t(16,15), calendar:"work",     category:"admin",    fixed:false, color:null, notes:"",                   recurrence:null    },
  { id:"e6", title:"Gym",             start:_t(18,0),  end:_t(19,0),  calendar:"personal", category:"health",   fixed:false, color:null, notes:"",                   recurrence:"daily" },
  { id:"e7", title:"Weekly Planning", start:_t(9,0,1), end:_t(10,0,1),calendar:"work",     category:"deep",     fixed:false, color:null, notes:"",                   recurrence:"weekly"},
];

const _deadline = (daysFromNow) => { const d = new Date(); d.setDate(d.getDate() + daysFromNow); return dateKey(d); };
const INIT_TASKS = [
  { id:"t1", title:"Prepare Q3 budget slides", duration:90,  category:"deep",  scope:"week",  done:false, deadline:_deadline(2),  priority:"high",   notes:"Slides 1-12",   scheduled:null },
  { id:"t2", title:"Reply to vendor emails",   duration:30,  category:"admin", scope:"day",   done:false, deadline:null,          priority:"medium", notes:"",              scheduled:null },
  { id:"t3", title:"Read product brief",       duration:45,  category:"deep",  scope:"day",   done:false, deadline:null,          priority:"medium", notes:"Section 3 & 4", scheduled:null },
  { id:"t4", title:"Book flights for offsite", duration:20,  category:"admin", scope:"week",  done:true,  deadline:null,          priority:"low",    notes:"",              scheduled:null },
  { id:"t5", title:"Performance review",       duration:120, category:"deep",  scope:"month", done:false, deadline:_deadline(14), priority:"high",   notes:"Cover Q1+Q2",   scheduled:null },
];

// ─── NLP helpers ──────────────────────────────────────────────────────────────
function parseTimeStr(s, contextHint) {
  // contextHint: "am" | "pm" | null — used when no meridiem is explicit
  s = s.trim().toLowerCase().replace(/\./g, ":"); // normalise 1.30pm → 1:30pm
  if (s === "noon")     return { h: 12, m: 0 };
  if (s === "midnight") return { h: 0,  m: 0 };
  const mt = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!mt) return null;
  let h = parseInt(mt[1]); const mn = parseInt(mt[2] || "0");
  let mer = mt[3] || contextHint || null;
  // Infer meridiem: hours 1-6 with no marker are almost always PM in scheduling context
  if (!mer) {
    if (h >= 1 && h <= 6)  mer = "pm";
    else if (h >= 7 && h <= 11) mer = "am";
    // 12 stays as noon (pm)
  }
  if (mer === "pm" && h !== 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return { h, m: mn };
}
// Parse a time range string like "1.30pm to 3pm" or "13:30-15:00"
function parseTimeRange(s) {
  const norm = s.trim().toLowerCase().replace(/\./g, ":");
  const rangeRe = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|–|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
  const m = norm.match(rangeRe);
  if (!m) return null;
  // Determine end meridiem first so we can infer start meridiem
  const endMer = (m[2].match(/am|pm/i) || [])[0] || null;
  const startMer = (m[1].match(/am|pm/i) || [])[0] || null;
  const end   = parseTimeStr(m[2], endMer);
  const start = parseTimeStr(m[1], startMer || endMer); // inherit end's meridiem if start has none
  if (!start || !end) return null;
  return { start, end };
}
function parseDur(s) {
  s = s.trim().toLowerCase();
  const hm = s.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?/), mm = s.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  let t = 0;
  if (hm) t += parseFloat(hm[1]) * 60;
  if (mm) t += parseInt(mm[1]);
  return t > 0 ? Math.round(t) : null;
}
function parseDateRef(s, base) {
  s = s.trim().toLowerCase();
  const d = new Date(base);
  if (s === "today") return d;
  if (s === "tomorrow") { d.setDate(d.getDate() + 1); return d; }
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const idx = days.indexOf(s);
  if (idx !== -1) { const cur = d.getDay(); let diff = idx - cur; if (diff <= 0) diff += 7; d.setDate(d.getDate() + diff); return d; }
  return null;
}
function buildGreeting(events, tasks) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const te = getEventsOnDay(events, TODAY);
  const ot = tasks.filter(t => !t.done && t.scope === "day");
  const fb = freeBlocks(events, TODAY)[0];
  const bs = fb ? ` First free: ${minsToTime(fb.start)}–${minsToTime(fb.end)}.` : "";
  return `${g} ✨ ${te.length} event${te.length !== 1 ? "s" : ""} and ${ot.length} open task${ot.length !== 1 ? "s" : ""} today.${bs} What do you need?`;
}

function processMessage(input, events, tasks, pending) {
  const raw = input.trim(), msg = raw.toLowerCase();
  let text = "", newEv = null, newTk = null, newP = null;

  if (pending) {
    const yes = /^(yes|yeah|yep|sure|ok|okay|do it|confirm|go ahead|yup|absolutely|please|sounds good)/.test(msg);
    const no  = /^(no|nope|cancel|stop|don't|nevermind|actually)/.test(msg);
    if (yes) {
      if      (pending.type === "add_event")     { newEv = [...events, pending.event]; text = `Done! 🎉 Added "${pending.event.title}" on ${fmtDay(pending.event.start)} at ${fmt(pending.event.start)}.`; }
      else if (pending.type === "add_task")      { newTk = [...tasks, pending.task];   text = `Added! ✅ "${pending.task.title}" is in your ${pending.task.scope} list.`; }
      else if (pending.type === "delete_event")  { newEv = events.filter(e => e.id !== pending.eventId); text = `Removed "${pending.title}" 🗑️`; }
      else if (pending.type === "complete_task") { newTk = tasks.map(t => t.id === pending.taskId ? { ...t, done: true } : t); text = `Done! "${pending.title}" marked complete ✅`; }
      else if (pending.type === "reschedule")    { newEv = events.map(e => e.id === pending.eventId ? { ...e, start: pending.newStart, end: pending.newEnd } : e); text = `Rescheduled! "${pending.title}" → ${fmt(pending.newStart)}.`; }
      else if (pending.type === "clear_day")     { newEv = events.filter(e => !sameDay(e.start, pending.date) || e.fixed); text = `Cleared ${fmtDay(pending.date)}.`; }
      return { text, newEv, newTk, newP: null };
    }
    if (no) return { text: "No problem! 😊 Nothing changed.", newEv: null, newTk: null, newP: null };
  }

  if (/^(hi|hello|hey|good morning|good afternoon|howdy|yo)\b/.test(msg))
    return { text: buildGreeting(events, tasks), newEv, newTk, newP };

  if (/\b(help|what can you do|commands)\b/.test(msg))
    return { text: `Here's what I can do 🌸\n\n📅 "What's on today?" / "Show my week"\n⏰ "What's next?" / "When am I free?"\n➕ "Add gym at 7pm for 1 hour"\n✅ "Add task: review slides 45 mins"\n🔄 "Move standup to 10am"\n🗑️ "Delete gym"\n✔️ "Mark vendor emails done"\n📊 "How busy am I?" / "Any deadlines?"`, newEv, newTk, newP };

  if (/\b(what('s| is) (on|happening) today|show (me )?today|today('s)? (schedule|events|plan)|my day)\b/.test(msg) || msg === "today") {
    const evs = getEventsOnDay(events, TODAY); const ot = tasks.filter(t => !t.done && t.scope === "day");
    text = evs.length === 0 ? "Nothing today! 🎉" : `📅 Today:\n\n${evs.map(e => `• ${fmt(e.start)}–${fmt(e.end)}: ${e.title}${hasConflict(events, e) ? " ⚠️" : ""}`).join("\n")}${ot.length ? `\n\n📋 Tasks:\n${ot.map(t => `• ${t.title} (${t.duration}min)`).join("\n")}` : ""}`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(tomorrow|what('s| is) (on )?tomorrow)\b/.test(msg)) {
    const tom = new Date(TODAY); tom.setDate(TODAY.getDate() + 1);
    const evs = getEventsOnDay(events, tom);
    text = evs.length === 0 ? "Nothing tomorrow yet!" : `📅 Tomorrow:\n\n${evs.map(e => `• ${fmt(e.start)}–${fmt(e.end)}: ${e.title}`).join("\n")}`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(this week|show week)\b/.test(msg)) {
    const mon = new Date(TODAY); mon.setDate(TODAY.getDate() - TODAY.getDay() + 1);
    const lines = [];
    for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); const evs = getEventsOnDay(events, d); if (evs.length) lines.push(`${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${evs.length} event${evs.length !== 1 ? "s" : ""}`); }
    text = lines.length ? `🗓️ This week:\n\n${lines.join("\n")}` : "Nothing this week!";
    return { text, newEv, newTk, newP };
  }

  if (/\b(what('s| is) next|next (event|meeting|thing)|upcoming)\b/.test(msg)) {
    const now = new Date(); const up = events.filter(e => e.start > now).sort((a, b) => a.start - b.start);
    if (!up.length) text = "No more events today! 🎉";
    else { const e = up[0]; const diff = Math.round((e.start - now) / 60000); text = `Next: "${e.title}" ${diff < 60 ? `in ${diff}min` : `in ${Math.round(diff / 60)}h`} at ${fmt(e.start)}.`; }
    return { text, newEv, newTk, newP };
  }

  if (/\b(free (time|block|slot)|when am i free|available)\b/.test(msg)) {
    let td = TODAY; const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    const bl = freeBlocks(events, td);
    text = bl.length ? `Free on ${fmtDay(td)}:\n\n${bl.map(b => `• ${minsToTime(b.start)}–${minsToTime(b.end)} (${b.end - b.start}min)`).join("\n")}` : `No free blocks on ${fmtDay(td)}! 😅`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(how busy|capacity|overloaded)\b/.test(msg)) {
    let td = TODAY; const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    const tm = totalMins(events, td); const workHours = _workEnd - _workStart; const pct = Math.round(tm / (workHours * 60) * 100);
    text = `${fmtDay(td).charAt(0).toUpperCase() + fmtDay(td).slice(1)}: ${pct > 80 ? "Very busy 😅" : pct > 50 ? "Moderately busy" : "Fairly open 😊"}\n• Scheduled: ${Math.round(tm / 60 * 10) / 10}h (${pct}% of work day)\n• Free blocks: ${freeBlocks(events, td).length} remaining`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(show (me )?(my )?tasks?|list tasks?|pending|open tasks?)\b/.test(msg)) {
    const sm = msg.match(/\b(today|day|week|month)\b/); const sc = sm ? (sm[1] === "today" ? "day" : sm[1]) : null;
    const ft = tasks.filter(t => !t.done && (sc ? t.scope === sc : true));
    text = ft.length ? `📋 Tasks${sc ? ` — this ${sc}` : ""}:\n\n${ft.map(t => `${PRIORITIES.find(p => p.id === t.priority)?.icon || "•"} ${t.title} (${t.duration}min${t.deadline ? `, due ${t.deadline.slice(5)}` : ""}) [${t.scope}]`).join("\n")}` : `No open tasks${sc ? ` for this ${sc}` : ""}! 🎉`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(mark|complete|finish|done|tick off)\b.{0,40}(task|it)\b/i.test(raw) || /\b(i('ve| have) (finished?|completed?|done))\b/.test(msg)) {
    const kw = raw.replace(/mark|complete|finish|done|tick off|task|i've|i have|finished?|completed?/gi, "").trim();
    const tk = kw.length > 2 ? tasks.find(t => t.title.toLowerCase().includes(kw.toLowerCase())) : null;
    if (!tk) text = "Which task? Give me the name!";
    else if (tk.done) text = `"${tk.title}" is already done! 🎉`;
    else { newP = { type: "complete_task", taskId: tk.id, title: tk.title }; text = `Mark "${tk.title}" as done? ✅`; }
    return { text, newEv, newTk, newP };
  }

  if (/\b(deadline|due (soon|today|this week)|overdue)\b/.test(msg)) {
    const soon = new Date(TODAY); soon.setDate(soon.getDate() + 3);
    const ur = tasks.filter(t => !t.done && t.deadline && new Date(t.deadline) <= soon);
    text = ur.length ? `⚠️ Upcoming deadlines:\n\n${ur.map(t => `• "${t.title}" — due ${t.deadline}`).join("\n")}` : "No urgent deadlines in 3 days! 🎉";
    return { text, newEv, newTk, newP };
  }

  if (/\b(how am i doing|am i on track|progress|productivity)\b/.test(msg)) {
    const dn = tasks.filter(t => t.done).length, tot = tasks.length, pct = tot > 0 ? Math.round(dn / tot * 100) : 0;
    const qs = ["Keep going! 💪", "You're crushing it! 🌟", "Stay focused! ✨", "Amazing progress! 🎉"];
    text = `${qs[Math.floor(Math.random() * qs.length)]}\n\n📊 ${dn}/${tot} tasks done (${pct}%)\n📅 ${getEventsOnDay(events, TODAY).length} events today\n🕐 ${freeBlocks(events, TODAY).length} free blocks left`;
    return { text, newEv, newTk, newP };
  }

  if (/^(thanks?|thank you|thx|cheers|great|perfect|awesome)\b/.test(msg)) {
    const rs = ["Happy to help! 🌸", "Anytime! ✨", "Of course! 💕", "You're welcome! 🎀"];
    text = rs[Math.floor(Math.random() * rs.length)];
    return { text, newEv, newTk, newP };
  }

  // Add event — try "X to Y" / "X - Y" range first, then single time + duration
  const aem = raw.match(/\b(add|schedule|create|put|book|set up)\b(.{3,80}?)\b(at|@|from)\s+([\d:.]+\s*(?:am|pm)?(?:\s*(?:to|-|\u2013|until)\s*[\d:.]+\s*(?:am|pm)?)?)/i);
  if (aem) {
    let title = aem[2].replace(/\b(a |an |me |for |event |meeting |session |block )\b/gi, "").trim();
    title = title.charAt(0).toUpperCase() + title.slice(1);
    const timeStr = aem[4];
    let td = new Date(TODAY);
    const dm = raw.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dm) { const r = parseDateRef(dm[1].toLowerCase(), TODAY); if (r) td = r; }
    let cat = "meeting";
    if (/gym|workout|run|yoga|exercise/i.test(raw)) cat = "health";
    else if (/focus|deep|report|write|code|study/i.test(raw)) cat = "deep";
    else if (/lunch|dinner|breakfast|coffee|eat/i.test(raw)) cat = "personal";
    else if (/email|admin|review|check/i.test(raw)) cat = "admin";
    // Try explicit range "1:30pm to 3pm"
    const range = parseTimeRange(timeStr);
    if (range) {
      const st = new Date(td); st.setHours(range.start.h, range.start.m, 0, 0);
      const en = new Date(td); en.setHours(range.end.h,   range.end.m,   0, 0);
      const dur = Math.round((en - st) / 60000);
      const ev = { id: "e" + uid(), title, start: st, end: en, calendar: cat === "personal" || cat === "health" ? "personal" : "work", category: cat, fixed: false, color: null, notes: "", recurrence: null };
      newP = { type: "add_event", event: ev };
      text = `Add "${title}" on ${fmtDay(st)} at ${fmt(st)}\u2013${fmt(en)} (${dur}min)?${hasConflict(events, ev) ? " \u26a0\ufe0f Overlaps existing event." : ""}`;
    } else {
      // Single time + optional duration
      const pt = parseTimeStr(timeStr.split(/\s+/)[0]);
      let dur = 60;
      const dr = raw.match(/(\d+(?:\.\d+)?)\s*(h(?:our)?s?|min(?:ute)?s?)/i);
      if (dr) { const d = parseDur(dr[0]); if (d) dur = d; }
      if (!pt) {
        text = `Couldn't parse the time. Try: "add ${title} at 3pm for 1 hour" or "add ${title} at 1:30pm to 3pm".`;
      } else {
        const st = new Date(td); st.setHours(pt.h, pt.m, 0, 0);
        const en = new Date(st.getTime() + dur * 60000);
        const ev = { id: "e" + uid(), title, start: st, end: en, calendar: cat === "personal" || cat === "health" ? "personal" : "work", category: cat, fixed: false, color: null, notes: "", recurrence: null };
        newP = { type: "add_event", event: ev };
        text = `Add "${title}" on ${fmtDay(st)} at ${fmt(st)}\u2013${fmt(en)} (${dur}min)?${hasConflict(events, ev) ? " \u26a0\ufe0f Overlaps existing event." : ""}`;
      }
    }
    return { text, newEv, newTk, newP };
  }

  // Add task
  const atm = raw.match(/\b(add|create|new|remind me to|i need to)\b\s*(?:task[:\s]*)?(.{3,80}?)(?:\s*[,\s]\s*(\d+)\s*(min(?:ute)?s?|h(?:our)?s?))?(?:\s*(today|this week|this month))?$/i);
  if (atm && !/\bat\s+\d/.test(msg)) {
    let title = atm[2].trim(); title = title.charAt(0).toUpperCase() + title.slice(1).replace(/[.!?]$/, "");
    let dur = 30;
    if (atm[3] && atm[4]) { const d = parseDur(atm[3] + " " + atm[4]); if (d) dur = d; }
    const sw = atm[5]?.toLowerCase(); const sc = sw === "this week" ? "week" : sw === "this month" ? "month" : "day";
    let cat = "admin";
    if (/gym|workout|health/i.test(title)) cat = "health";
    else if (/write|research|report|build|code|study|plan|design|prepare/i.test(title)) cat = "deep";
    const tk = { id: "t" + uid(), title, duration: dur, category: cat, scope: sc, done: false, deadline: null, priority: "medium", notes: "", scheduled: null };
    newP = { type: "add_task", task: tk };
    text = `Add task "${title}" (${dur}min, ${sc})?`;
    return { text, newEv, newTk, newP };
  }

  // Delete event
  if (/\b(delete|remove|cancel)\b.{0,40}/i.test(raw)) {
    const kw = raw.replace(/delete|remove|cancel/gi, "").trim();
    const ev = kw.length > 1 ? events.find(e => e.title.toLowerCase().includes(kw.toLowerCase())) : null;
    if (!ev) text = "Which event to remove?";
    else { newP = { type: "delete_event", eventId: ev.id, title: ev.title }; text = `Delete "${ev.title}" on ${fmtDay(ev.start)}?`; }
    return { text, newEv, newTk, newP };
  }

  // Reschedule
  const rem = raw.match(/\b(move|reschedule|push|shift|change)\b.{0,40}?\b(to|at)\s+([\d:.]+\s*(?:am|pm)?)/i);
  if (rem) {
    const kw = raw.replace(/move|reschedule|push|shift|change|to|at|[\d:.]+\s*(?:am|pm)?/gi, "").trim();
    const ev = events.find(e => e.title.toLowerCase().includes(kw.toLowerCase()));
    const nt = parseTimeStr(rem[3]);
    let td = ev ? new Date(ev.start) : new Date(TODAY);
    const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    if (!ev) text = "Couldn't find that event.";
    else if (!nt) text = `What time for "${ev.title}"?`;
    else {
      const dur = (ev.end - ev.start) / 60000;
      const ns = new Date(td); ns.setHours(nt.h, nt.m, 0, 0);
      const ne = new Date(ns.getTime() + dur * 60000);
      newP = { type: "reschedule", eventId: ev.id, title: ev.title, newStart: ns, newEnd: ne };
      text = `Move "${ev.title}" to ${fmt(ns)}–${fmt(ne)} on ${fmtDay(ns)}?`;
    }
    return { text, newEv, newTk, newP };
  }

  // Time query
  if (/\b(what time|when) (is|does|starts?|am i|do i have)\b.{0,40}/i.test(raw)) {
    const kw = raw.replace(/what time|when|is|does|starts?|am i|do i have/gi, "").trim();
    const ev = kw.length > 1 ? events.find(e => e.title.toLowerCase().includes(kw.toLowerCase())) : null;
    text = ev ? `"${ev.title}" is on ${fmtDay(ev.start)} at ${fmt(ev.start)}–${fmt(ev.end)}.${ev.fixed ? " 🔒" : ""}` : "Couldn't find that event.";
    return { text, newEv, newTk, newP };
  }

  const fbs = ["Not sure 🤔 Type 'help' to see what I can do!", "Didn't catch that 😊 Try 'What's on today?'", "Type 'help' for all commands 🌸"];
  text = fbs[Math.floor(Math.random() * fbs.length)];
  return { text, newEv, newTk, newP };
}

// ─── Pomodoro hook ────────────────────────────────────────────────────────────
function usePomodoro() {
  const [state, setState] = useState({ active: false, mode: "work", remaining: 25 * 60, cycles: 0, taskId: null });
  const iv = useRef(null);
  const start  = id => setState({ active: true, mode: "work", remaining: 25 * 60, cycles: 0, taskId: id });
  const pause  = ()  => setState(s => ({ ...s, active: false }));
  const resume = ()  => setState(s => ({ ...s, active: true }));
  const stop   = ()  => setState({ active: false, mode: "work", remaining: 25 * 60, cycles: 0, taskId: null });
  useEffect(() => {
    if (state.active) {
      iv.current = setInterval(() => setState(s => {
        if (s.remaining <= 1) {
          const nc = s.mode === "work" ? s.cycles + 1 : s.cycles, nm = s.mode === "work" ? "break" : "work", nr = nm === "work" ? 25 * 60 : 5 * 60;
          if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(nm === "break" ? "Break time! 🌸" : "Back to work! 💪");
          return { ...s, mode: nm, remaining: nr, cycles: nc };
        }
        return { ...s, remaining: s.remaining - 1 };
      }), 1000);
    } else clearInterval(iv.current);
    return () => clearInterval(iv.current);
  }, [state.active]);
  return { state, start, pause, resume, stop };
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
/*
  SUPABASE SETUP INSTRUCTIONS
  ════════════════════════════
  1. Go to https://supabase.com → New project (free)
  2. Copy your Project URL and anon/public key
  3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
  4. In Supabase dashboard → Authentication → enable Email provider
  5. In SQL Editor run:

    create table public.user_data (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users not null unique,
      events jsonb default '[]',
      tasks jsonb default '[]',
      settings jsonb default '{}',
      updated_at timestamptz default now()
    );
    alter table public.user_data enable row level security;
    create policy "Users can only access their own data"
      on public.user_data for all
      using (auth.uid() = user_id);

  6. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables
  7. Supabase JS loads via CDN automatically — no npm install needed
  ════════════════════════════
*/

// ── Supabase client ───────────────────────────────────────────────────────────
// Keys are read from environment variables (set in Vercel dashboard).
// For local dev, create a .env file in your project root:
//   VITE_SUPABASE_URL=https://zyrxfrmkvqwtxffzgvtj.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGci...
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "https://zyrxfrmkvqwtxffzgvtj.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5cnhmcm1rdnF3dHhmZnpndnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5ODUwMDgsImV4cCI6MjA5NDU2MTAwOH0.rn6TDqi-Vvw7pK6sX_TfAe6jpCqv6U6na2wlgB1XTVE";

// Dynamically load Supabase via CDN so no npm install is needed
let supabase = null;
async function getSupabase() {
  if (supabase) return supabase;
  try {
    if (!window.supabase) {
      await new Promise((res) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        s.onload = res; s.onerror = res; // always resolve — never hang
        document.head.appendChild(s);
        setTimeout(res, 5000); // hard 5s timeout in case CDN is slow
      });
    }
    if (!window.supabase) throw new Error("CDN unavailable");
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.__supabaseLib = supabase;
    return supabase;
  } catch (e) {
    console.warn("Supabase unavailable, running offline:", e);
    throw e; // callers catch this and fall back to localStorage
  }
}

async function saveToCloud(userId, events, tasks, settings) {
  try {
    const sb = await getSupabase();
    await sb.from("user_data").upsert({
      user_id: userId,
      events:   JSON.parse(JSON.stringify(events,  SER)),
      tasks:    JSON.parse(JSON.stringify(tasks,   SER)),
      settings: JSON.parse(JSON.stringify(settings,SER)),
      updated_at: new Date().toISOString(),
    });
  } catch (e) { console.warn("Cloud save failed, using local:", e); }
}

async function loadFromCloud(userId) {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.from("user_data").select("*").eq("user_id", userId).single();
    if (error || !data) return null;
    return {
      events:   JSON.parse(JSON.stringify(data.events   ?? []), DES),
      tasks:    JSON.parse(JSON.stringify(data.tasks    ?? []), DES),
      settings: data.settings ?? {},
    };
  } catch (e) { console.warn("Cloud load failed, using local:", e); return null; }
}

// ── Auth hook (real Supabase) ─────────────────────────────────────────────────
function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true on boot while session is checked
  const [error,   setError]   = useState("");

  // On mount: restore existing session
  useEffect(() => {
    let sub = null;
    getSupabase().then(sb => {
      // Wire up listener first to avoid race condition
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        if (session?.user) setUser({ id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name ?? session.user.email.split("@")[0] });
        else setUser(null);
        setLoading(false);
      });
      sub = subscription;
      // Then check existing session
      sb.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setUser({ id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name ?? session.user.email.split("@")[0] });
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => {
      // Supabase CDN failed (e.g. running offline) — show login screen anyway
      setLoading(false);
    });
    return () => sub?.unsubscribe();
  }, []);

  async function signIn(email, password) {
    setLoading(true); setError("");
    try {
      const sb = await getSupabase();
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } catch (e) { setError("Connection error — check your internet."); }
    setLoading(false);
  }

  async function signUp(email, password, name) {
    setLoading(true); setError("");
    try {
      const sb = await getSupabase();
      const { error: err } = await sb.auth.signUp({ email, password, options: { data: { name } } });
      if (err) setError(err.message);
      else setError("__verify__"); // signal to show verify-email message
    } catch (e) { setError("Connection error — check your internet."); }
    setLoading(false);
  }

  async function signOut() {
    const sb = await getSupabase();
    await sb.auth.signOut();
    setUser(null);
  }

  return { user, loading, error, setError, signIn, signUp, signOut };
}

function LoginScreen({ auth }) {
  const [mode, setMode]         = useState("login"); // "login" | "signup"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPass, setShowPass] = useState(false);

  const showVerify = auth.error === "__verify__";

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === "login") auth.signIn(email, password);
    else auth.signUp(email, password, name);
  }

  return (
    <div className="login-page">
      {/* Animated background blobs */}
      <div className="login-bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      {/* Floating decorative elements */}
      <div className="login-deco" aria-hidden="true">
        <span className="deco deco-1">🌸</span>
        <span className="deco deco-2">✨</span>
        <span className="deco deco-3">🌷</span>
        <span className="deco deco-4">💫</span>
        <span className="deco deco-5">🌿</span>
        <span className="deco deco-6">🎀</span>
        <span className="deco deco-7">⭐</span>
        <span className="deco deco-8">🌼</span>
      </div>

      <div className="login-card">
        {/* Mascot / hero area */}
        <div className="login-hero">
          <div className="login-mascot">
            <div className="mascot-ring mascot-ring-outer" />
            <div className="mascot-ring mascot-ring-inner" />
            <div className="mascot-icon">🌸</div>
          </div>
          <div className="login-brand">
            <span className="login-logo-text">Tempo</span>
            <span className="login-logo-badge">✦ beta</span>
          </div>
          <p className="login-tagline">Your calm, focused day<br/>starts right here ✨</p>
        </div>

        {/* Cute feature pills */}
        <div className="login-pills">
          <span className="login-pill">📅 Smart scheduling</span>
          <span className="login-pill">🔮 Focus mode</span>
          <span className="login-pill">🌿 Task tracking</span>
        </div>

        {showVerify ? (
          <div className="verify-banner">
            <div className="verify-icon">📬</div>
            <div className="verify-title">Check your inbox!</div>
            <div className="verify-body">We sent a magic link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in 🌸</div>
            <button className="login-demo" onClick={() => { auth.setError(""); setMode("login"); }}>← Back to sign in</button>
          </div>
        ) : (
          <>
            <div className="login-tabs">
              <button className={`login-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); auth.setError(""); }}>Sign in</button>
              <button className={`login-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); auth.setError(""); }}>Create account</button>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="login-field">
                  <label><span className="field-icon">👤</span> Your name</label>
                  <input type="text" placeholder="e.g. Alex" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </div>
              )}
              <div className="login-field">
                <label><span className="field-icon">✉️</span> Email</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="login-field">
                <label><span className="field-icon">🔑</span> Password</label>
                <div className="pass-wrap">
                  <input type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide password" : "Show password"}>{showPass ? "🙈" : "👁️"}</button>
                </div>
              </div>
              {auth.error && auth.error !== "__verify__" && (
                <div className="login-error">🌷 {auth.error}</div>
              )}
              <button type="submit" className="login-submit" disabled={auth.loading}>
                {auth.loading
                  ? <><span className="login-spinner" /><span>Just a moment…</span></>
                  : mode === "login"
                    ? <><span>Welcome back</span><span className="submit-arrow">→</span></>
                    : <><span>Start your journey</span><span className="submit-arrow">🌸</span></>}
              </button>
            </form>
          </>
        )}

        <p className="login-footer">🔒 Private by design · No ads, ever · Made with 💕</p>
      </div>
    </div>
  );
}

// ─── Overlap layout algorithm ─────────────────────────────────────────────────
// Returns a map of eventId -> { col, totalCols } for side-by-side rendering
function computeColumns(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const cols = {}; // id -> col index
  const colEnds = []; // tracks end time of last event in each column

  for (const ev of sorted) {
    const startMs = ev.start.getTime(), endMs = ev.end.getTime();
    // Find first free column
    let col = colEnds.findIndex(end => end <= startMs);
    if (col === -1) { col = colEnds.length; colEnds.push(endMs); }
    else colEnds[col] = endMs;
    cols[ev.id] = col;
  }

  // Compute totalCols for each overlapping group
  const totalCols = {};
  for (const ev of sorted) {
    const col = cols[ev.id];
    // Find all events that overlap with this one
    const overlapping = sorted.filter(other =>
      other.id !== ev.id && other.start < ev.end && other.end > ev.start
    );
    const maxCol = Math.max(col, ...overlapping.map(o => cols[o.id]));
    totalCols[ev.id] = maxCol + 1;
  }
  return events.map(ev => ({ ...ev, _col: cols[ev.id] ?? 0, _totalCols: totalCols[ev.id] ?? 1 }));
}

// ─── Event Block (drag-to-reschedule) ────────────────────────────────────────
function EventBlock({ event, calendars, categories, onReschedule, onClick }) {
  const cal  = calendars.find(c => c.id === event.calendar);
  const cat  = categories.find(c => c.id === event.category);
  const sh   = event.start.getHours() + event.start.getMinutes() / 60;
  const eh   = event.end.getHours()   + event.end.getMinutes()   / 60;
  const top  = (sh - DAY_START) * HOUR_H;
  const height = Math.max((eh - sh) * HOUR_H - 2, 22);
  const color  = event.color || cal?.color || "#FF7BAC";
  const draggable = !event.fixed;
  const ref = useRef(null);

  // Column layout for overlapping events
  const col = event._col ?? 0;
  const totalCols = event._totalCols ?? 1;
  const widthPct = 100 / totalCols;
  const leftPct  = col * widthPct;
  // Slight inset between columns
  const colStyle = totalCols > 1
    ? { left: `${leftPct}%`, width: `calc(${widthPct}% - 3px)`, right: "auto" }
    : {};

  function onMouseDown(e) {
    if (!draggable || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const sy = e.clientY, ot = top, dur = (event.end - event.start) / 60000;
    const ghost = document.createElement("div");
    ghost.style.cssText = `position:fixed;width:${ref.current.offsetWidth}px;height:${height}px;background:${color}40;border:2px dashed ${color};border-radius:12px;pointer-events:none;z-index:9999;left:${ref.current.getBoundingClientRect().left}px;top:${ref.current.getBoundingClientRect().top}px;display:flex;align-items:center;padding:8px 12px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:${color};`;
    ghost.textContent = event.title; document.body.appendChild(ghost);
    const tip = document.createElement("div");
    tip.style.cssText = `position:fixed;background:#4A2840;color:white;padding:4px 10px;border-radius:8px;font-family:'Inconsolata',monospace;font-size:12px;font-weight:600;z-index:10000;pointer-events:none;`;
    document.body.appendChild(tip);
    function mv(me) {
      const dy = me.clientY - sy, nt = ot + dy;
      ghost.style.top = `${ref.current.getBoundingClientRect().top - (top - nt)}px`;
      const rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, em = sm + dur;
      const f12 = (h, m) => { const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h; return m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`; };
      tip.textContent = `${f12(Math.floor(sm/60), sm%60)} – ${f12(Math.floor(em/60), em%60)}`;
      tip.style.left = `${me.clientX + 12}px`; tip.style.top = `${me.clientY - 10}px`;
    }
    function up(ue) {
      document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up);
      ghost.remove(); tip.remove();
      const dy = ue.clientY - sy, nt = ot + dy, rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, cm = Math.max(DAY_START * 60, Math.min(sm, (DAY_END - 1) * 60));
      const ns = new Date(event.start); ns.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
      const ne = new Date(ns.getTime() + dur * 60000);
      if (ns.getTime() !== event.start.getTime()) onReschedule(event.id, ns, ne);
    }
    document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
  }

  // Touch support for mobile drag
  function onTouchStart(e) {
    if (!draggable) return;
    const touch = e.touches[0];
    const sy = touch.clientY, ot = top, dur = (event.end - event.start) / 60000;
    function mv(te) {
      te.preventDefault();
      const t = te.touches[0], dy = t.clientY - sy, nt = ot + dy;
      const rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, cm = Math.max(DAY_START * 60, Math.min(sm, (DAY_END - 1) * 60));
      ref.current.style.transform = `translateY(${dy}px)`;
      ref.current.style.opacity   = "0.8";
      ref.current.style.zIndex    = "20";
      ref.current._newMins = cm;
    }
    function up() {
      document.removeEventListener("touchmove", mv); document.removeEventListener("touchend", up);
      ref.current.style.transform = ""; ref.current.style.opacity = ""; ref.current.style.zIndex = "";
      const cm = ref.current._newMins;
      if (cm !== undefined) {
        const ns = new Date(event.start); ns.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
        const ne = new Date(ns.getTime() + dur * 60000);
        if (ns.getTime() !== event.start.getTime()) onReschedule(event.id, ns, ne);
        delete ref.current._newMins;
      }
    }
    document.addEventListener("touchmove", mv, { passive: false });
    document.addEventListener("touchend", up);
  }

  return (
    <div ref={ref}
      className={`event-block ${draggable ? "draggable" : "fixed-event"}`}
      style={{ top, height, borderLeft: `3px solid ${color}`, background: `${color}18`, cursor: draggable ? "grab" : "default", ...colStyle }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={() => onClick(event)}
      title={event.fixed ? "Fixed · Click to edit" : "Drag to reschedule · Click to edit"}>
      {event.fixed && <span className="fixed-badge">🔒</span>}
      {draggable && <span className="drag-handle">⠿</span>}
      {height <= 38 ? (
        <div className="event-inline">
          <div className="event-title" style={{ color }}>{event.title}</div>
          <div className="event-time">{fmt(event.start)} – {fmt(event.end)}</div>
        </div>
      ) : (
        <>
          <div className="event-title" style={{ color }}>{event.title}</div>
          <div className="event-time">{fmt(event.start)} – {fmt(event.end)}</div>
          {height > 56 && cat && <div className="event-cat" style={{ color }}>{cat.icon} {cat.label}</div>}
        </>
      )}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ events, calendars, categories, onReschedule, onEventClick, onDropTask, viewDate, onGridClick }) {
  const hours = []; for (let h = DAY_START; h < DAY_END; h++) hours.push(h);
  const now = new Date(); const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_H;
  const gridH = (DAY_END - DAY_START) * HOUR_H;
  const conflicts = events.filter(e => hasConflict(events, e));
  const scrollRef = useRef(null);
  const gridRef   = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null); // { top, label } while dragging over grid

  useEffect(() => {
    let el = scrollRef.current?.parentElement;
    while (el && !el.classList?.contains("calendar-pane")) el = el.parentElement;
    const scrollTo = Math.max(nowTop - 120, 8 * HOUR_H - 120);
    (el || document.querySelector(".calendar-pane"))?.scrollTo({ top: scrollTo, behavior: "smooth" });
  }, []);

  function snapToGrid(clientY) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const rawMins = ((clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const snapped = Math.round(rawMins / 15) * 15;
    const clamped = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
    const top = ((clamped / 60) - DAY_START) * HOUR_H;
    const h = Math.floor(clamped / 60), m = clamped % 60;
    const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`;
    return { top, mins: clamped, label };
  }

  function onDragOver(e) {
    if (!e.dataTransfer.types.includes("application/tempo-task")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const snap = snapToGrid(e.clientY);
    if (snap) setDropIndicator(snap);
  }

  function onDragLeave(e) {
    // Only clear if leaving the grid itself, not a child element
    if (!gridRef.current?.contains(e.relatedTarget)) setDropIndicator(null);
  }

  function onDrop(e) {
    e.preventDefault();
    setDropIndicator(null);
    const raw = e.dataTransfer.getData("application/tempo-task");
    if (!raw) return;
    const task = JSON.parse(raw);
    const snap = snapToGrid(e.clientY);
    if (!snap) return;
    const start = new Date(viewDate);
    start.setHours(Math.floor(snap.mins / 60), snap.mins % 60, 0, 0);
    const end = new Date(start.getTime() + task.duration * 60000);
    const cal = task.category === "personal" || task.category === "health" ? "personal" : "work";
    onDropTask({
      id: "e" + uid(),
      title: task.title,
      start, end,
      calendar: cal,
      category: task.category,
      fixed: false,
      color: task.color,
      notes: `From task: ${task.title}`,
      recurrence: null,
      fromTaskId: task.id,
    });
  }

  function handleGridClick(e) {
    // Ignore clicks on event blocks
    if (e.target.closest(".event-block")) return;
    const snap = snapToGrid(e.clientY);
    if (!snap) return;
    const clickDate = new Date(viewDate);
    clickDate.setHours(Math.floor(snap.mins / 60), snap.mins % 60, 0, 0);
    onGridClick(clickDate);
  }

  return (
    <div className="day-view" ref={scrollRef}>
      <div className="drag-hint">⠿ Drag events to reschedule · Click empty slot to add event · Drag tasks from panel</div>
      {conflicts.length > 0 && <div className="conflict-banner">⚠️ {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} — overlapping events</div>}
      <div className="day-grid" ref={gridRef} style={{ height: gridH }}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={handleGridClick}>
        {hours.map(h => {
          const label = h === 0 ? "12am" : h === 12 ? "12pm" : h === 24 ? "12am" : h > 12 ? `${h - 12}pm` : `${h}am`;
          return <div key={h} className="hour-row" style={{ top: (h - DAY_START) * HOUR_H }}><span className="hour-label">{label}</span><div className="hour-line" /></div>;
        })}
        {nowTop > 0 && nowTop < gridH && <div className="now-line" style={{ top: nowTop }}><div className="now-dot" /><div className="now-track" /></div>}
        {/* Drop indicator line */}
        {dropIndicator && (
          <div className="drop-indicator" style={{ top: dropIndicator.top }}>
            <div className="drop-indicator-dot" />
            <div className="drop-indicator-line" />
            <span className="drop-indicator-label">{dropIndicator.label}</span>
          </div>
        )}
        <div className="events-layer">{computeColumns(events).map(e => <EventBlock key={e.id} event={e} calendars={calendars} categories={categories} onReschedule={onReschedule} onClick={onEventClick} />)}</div>
      </div>
    </div>
  );
}

// ─── Week View (full timetable, like TimeTree) ────────────────────────────────
function WeekView({ events, calendars, categories, onEventClick, viewDate, onDayClick }) {
  // Monday of the viewed week
  const mon = new Date(viewDate);
  const dow = mon.getDay(); // 0=Sun
  mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));

  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); days.push(d); }

  const hours = []; for (let h = DAY_START; h < DAY_END; h++) hours.push(h);
  const now = new Date();
  const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_H;
  const gridH = (DAY_END - DAY_START) * HOUR_H;

  const scrollRef = useRef(null);
  useEffect(() => {
    let el = scrollRef.current?.parentElement;
    while (el && !el.classList?.contains("calendar-pane")) el = el.parentElement;
    const scrollTo = Math.max(nowTop - 120, 8 * HOUR_H - 120);
    (el || document.querySelector(".calendar-pane"))?.scrollTo({ top: scrollTo, behavior: "smooth" });
  }, []);

  return (
    <div className="week-timetable" ref={scrollRef}>
      {/* Header row */}
      <div className="wt-header">
        <div className="wt-time-gutter" />
        {days.map((day, i) => {
          const isT = day.toDateString() === TODAY.toDateString();
          return (
            <div key={i} className={`wt-day-header ${isT ? "wt-today" : ""}`} onClick={() => onDayClick(day)}>
              <span className="wt-day-name">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className={`wt-day-num ${isT ? "wt-today-num" : ""}`}>{day.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Timetable grid */}
      <div className="wt-grid" style={{ height: gridH + 32 }}>
        {/* Hour labels + horizontal lines */}
        {hours.map(h => {
          const label = h === 0 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h-12}pm` : `${h}am`;
          return (
            <div key={h} className="wt-hour-row" style={{ top: (h - DAY_START) * HOUR_H }}>
              <div className="wt-time-gutter"><span className="wt-hour-label">{label}</span></div>
              {days.map((_, i) => <div key={i} className="wt-hour-cell" />)}
            </div>
          );
        })}

        {/* Now line */}
        {nowTop > 0 && nowTop < gridH && (
          <div className="wt-now-line" style={{ top: nowTop }}>
            <div className="wt-time-gutter"><div className="now-dot" /></div>
            {days.map((_, i) => <div key={i} className="wt-now-track-cell" />)}
          </div>
        )}

        {/* Events per column */}
        {days.map((day, di) => {
          const de = events.filter(e => e.start instanceof Date && e.start.toDateString() === day.toDateString())
            .sort((a, b) => a.start - b.start);
          return de.map(ev => {
            const cal = calendars.find(c => c.id === ev.calendar);
            const cat = categories.find(c => c.id === ev.category);
            const color = ev.color || cal?.color || "#FF7BAC";
            const sh = ev.start.getHours() + ev.start.getMinutes() / 60;
            const eh = ev.end.getHours() + ev.end.getMinutes() / 60;
            const top = (sh - DAY_START) * HOUR_H;
            const height = Math.max((eh - sh) * HOUR_H - 2, 22);
            // left offset: time gutter (48px) + column index * (1/7 of remaining)
            return (
              <div key={ev.id} className="wt-event" onClick={() => onEventClick(ev)}
                style={{ top, height, color,
                  background: `${color}18`,
                  borderLeft: `3px solid ${color}`,
                  left: `calc(48px + ${di} * ((100% - 48px) / 7) + 2px)`,
                  width: `calc((100% - 48px) / 7 - 5px)`,
                }}>
                <div className="wt-event-title">{ev.title}</div>
                {height > 30 && <div className="wt-event-time">{ev.start.getHours()}:{String(ev.start.getMinutes()).padStart(2,"0")} - {ev.end.getHours()}:{String(ev.end.getMinutes()).padStart(2,"0")}</div>}
                {height > 52 && cat && <div className="wt-event-cat">{cat.icon}</div>}
                {ev.fixed && <span className="fixed-badge">🔒</span>}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onStartPomodoro, categories }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categories.find(c => c.id === task.category);
  const pri = PRIORITIES.find(p => p.id === task.priority);
  const color = cat?.color || "var(--accent)";

  function onDragStart(e) {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/tempo-task", JSON.stringify({
      id: task.id, title: task.title, duration: task.duration,
      category: task.category, color: cat?.color || null,
    }));
    // Ghost image
    const ghost = document.createElement("div");
    ghost.style.cssText = `position:fixed;top:-200px;left:0;padding:7px 12px;border-radius:10px;background:${cat?.color || "#FF7BAC"}20;border-left:3px solid ${cat?.color || "#FF7BAC"};font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:${cat?.color || "#FF7BAC"};white-space:nowrap;`;
    ghost.textContent = `${task.title} (${task.duration}min)`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 14);
    setTimeout(() => ghost.remove(), 0);
  }

  return (
    <div className={`task-item ${task.done ? "done" : ""}`} data-priority={task.priority}
      draggable={!task.done} onDragStart={!task.done ? onDragStart : undefined}>
      {!task.done && <span className="task-drag-handle" title="Drag to schedule">⠿</span>}
      <div className="task-check" onClick={() => onToggle(task.id)}>{task.done ? "✓" : ""}</div>
      <div className="task-body" onClick={() => setExpanded(v => !v)}>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span style={{ color: cat?.color }}>{cat?.icon} {cat?.label}</span>
          <span>{task.duration}min</span>
          {pri && <span style={{ color: pri.color }}>{pri.icon} {pri.label}</span>}
          {task.deadline && <span className="deadline">due {task.deadline.slice(5)}</span>}
          {task.notes && <span title={task.notes}>📝</span>}
        </div>
        {expanded && task.notes && <div className="task-notes">{task.notes}</div>}
      </div>
      {!task.done && <button className="pomo-btn" onClick={() => onStartPomodoro(task.id)} title="Start Pomodoro">⏱</button>}
    </div>
  );
}

// ─── Task Panel ───────────────────────────────────────────────────────────────
function TaskPanel({ tasks, categories, onToggle, onAdd, onStartPomodoro, scope, setScope }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ title: "", duration: 30, category: "deep", scope: "day", deadline: "", priority: "medium", notes: "" });
  const filtered = tasks.filter(t => t.scope === scope);
  const urgent   = tasks.filter(t => !t.done && t.deadline && new Date(t.deadline) <= new Date(TODAY.getTime() + 3 * 86400000));
  function handleAdd() {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: "t" + uid(), done: false, scheduled: null });
    setForm({ title: "", duration: 30, category: "deep", scope: "day", deadline: "", priority: "medium", notes: "" });
    setAdding(false);
  }
  return (
    <div className={`task-panel ${collapsed ? "collapsed" : ""}`}>
      {/* Collapse toggle tab — always visible on the left edge */}
      <button className="task-panel-toggle" onClick={() => setCollapsed(v => !v)} title={collapsed ? "Expand tasks" : "Collapse tasks"}>
        {collapsed ? "‹" : "›"}
      </button>

      {/* Everything below is hidden when collapsed */}
      <div className="task-panel-inner">
        <div className="panel-header">
          <span className="panel-title">Tasks</span>
          {urgent.length > 0 && <span className="urgent-badge">⚠️ {urgent.length}</span>}
          <div className="scope-tabs">{["day","week","month"].map(s => <button key={s} className={`scope-tab ${scope === s ? "active" : ""}`} onClick={() => setScope(s)}>{s}</button>)}</div>
          <button className="add-btn" onClick={() => setAdding(v => !v)}>+</button>
        </div>
      {adding && (
        <div className="task-form">
          <input className="tf-input" placeholder="Task name..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className="tf-row">
            <select className="tf-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
            <select className="tf-select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}><option value="day">Today</option><option value="week">This week</option><option value="month">This month</option></select>
          </div>
          <div className="tf-row">
            <select className="tf-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select>
            <input type="date" className="tf-input tf-date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div className="tf-row">
            <div className="tf-duration"><span>⏱</span><input type="number" className="tf-num" value={form.duration} min={5} step={5} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 30 }))}/><span>min</span></div>
          </div>
          <textarea className="tf-input tf-notes" placeholder="Notes (optional)..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="tf-actions"><button className="tf-cancel" onClick={() => setAdding(false)}>Cancel</button><button className="tf-save" onClick={handleAdd}>Add task</button></div>
        </div>
      )}
      <div className="task-list">
        {filtered.length === 0 && <div className="empty-state">No {scope} tasks yet</div>}
        {[...filtered].sort((a, b) => ({high:0,medium:1,low:2}[a.priority]??1) - ({high:0,medium:1,low:2}[b.priority]??1)).map(t => <TaskItem key={t.id} task={t} onToggle={onToggle} onStartPomodoro={onStartPomodoro} categories={categories} />)}
      </div>
      <div className="task-footer"><span>{filtered.filter(t => !t.done).length} remaining</span><span>{filtered.filter(t => t.done).length} done ✅</span></div>
      </div>{/* end task-panel-inner */}
    </div>
  );
}

// ─── Event Modal ──────────────────────────────────────────────────────────────
function EventModal({ event, calendars, categories, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...event });
  const cal = calendars.find(c => c.id === form.calendar);
  const COLORS = ["#FF7BAC","#B08AE0","#7CBAFF","#70C8A0","#FFB870","#FF9F9F","#C9A0FF","#7EC8C8"];
  // Helpers to convert Date <-> "HH:MM" string for <input type="time">
  const toTimeInput = d => d instanceof Date ? `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}` : "";
  const applyTime   = (base, str) => { const [h, m] = str.split(":").map(Number); const d = new Date(base); d.setHours(h, m, 0, 0); return d; };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${form.color || cal?.color || "#FF7BAC"}` }}>
          <input className="modal-title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <label>Start</label>
            <input type="time" className="modal-select modal-time" value={toTimeInput(form.start)} onChange={e => setForm(f => ({ ...f, start: applyTime(f.start, e.target.value) }))} />
            <label style={{marginLeft:8}}>End</label>
            <input type="time" className="modal-select modal-time" value={toTimeInput(form.end)} onChange={e => setForm(f => ({ ...f, end: applyTime(f.end, e.target.value) }))} />
          </div>
          <div className="modal-row"><label>Calendar</label><select className="modal-select" value={form.calendar} onChange={e => setForm(f => ({ ...f, calendar: e.target.value }))}>{calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row"><label>Recurrence</label><select className="modal-select" value={form.recurrence || ""} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value || null }))}><option value="">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="weekdays">Weekdays</option><option value="monthly">Monthly</option></select></div>
          <div className="modal-row"><label>Fixed</label><input type="checkbox" checked={form.fixed} onChange={e => setForm(f => ({ ...f, fixed: e.target.checked }))}/><span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 6 }}>Cannot be dragged</span></div>
          <div className="modal-row"><label>Color</label><div className="color-picker">{COLORS.map(c => <button key={c} className={`color-dot ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />)}<button className="color-dot color-reset" onClick={() => setForm(f => ({ ...f, color: null }))}>↺</button></div></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." rows={3} /></div>
        </div>
        <div className="modal-footer"><button className="modal-delete" onClick={() => { onDelete(event.id); onClose(); }}>🗑️ Delete</button><div style={{ display: "flex", gap: 8 }}><button className="tf-cancel" onClick={onClose}>Cancel</button><button className="tf-save" onClick={() => { onSave({ ...form }); onClose(); }}>Save changes</button></div></div>
      </div>
    </div>
  );
}

// ─── Pomodoro Widget ──────────────────────────────────────────────────────────
function PomodoroWidget({ state, tasks, onPause, onResume, onStop }) {
  const task  = tasks.find(t => t.id === state.taskId);
  const m     = Math.floor(state.remaining / 60).toString().padStart(2, "0");
  const s     = (state.remaining % 60).toString().padStart(2, "0");
  const total = state.mode === "work" ? 25 * 60 : 5 * 60;
  const pct   = (1 - state.remaining / total) * 100;
  const r = 34; const circ = 2 * Math.PI * r;
  return (
    <div className="pomo-widget">
      <div className="pomo-header"><span className="pomo-mode">{state.mode === "work" ? "🔮 Focus" : "🌸 Break"}</span><span className="pomo-cycles">#{state.cycles + 1}</span><button className="pomo-stop" onClick={onStop}>✕</button></div>
      {task && <div className="pomo-task">{task.title}</div>}
      <div className="pomo-ring-wrap">
        <svg className="pomo-ring" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={state.mode === "work" ? "var(--accent)" : "#B8F0E0"} strokeWidth="6" strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - pct / 100)}`} strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="pomo-time">{m}:{s}</div>
      </div>
      <div className="pomo-controls">{state.active ? <button className="pomo-btn-ctrl" onClick={onPause}>⏸ Pause</button> : <button className="pomo-btn-ctrl" onClick={onResume}>▶ Resume</button>}</div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ events, tasks, streak, onClose }) {
  const td = getEventsOnDay(events, TODAY); const dn = tasks.filter(t => t.done).length, tot = tasks.length;
  const catMins = id => td.filter(e => e.category === id).reduce((a, e) => a + (e.end - e.start) / 60000, 0);
  const bars = [
    { label: "Deep Work", mins: catMins("deep"),    color: "#B08AE0" },
    { label: "Meetings",  mins: catMins("meeting"), color: "#FF7BAC" },
    { label: "Admin",     mins: catMins("admin"),   color: "#A0C8E0" },
    { label: "Personal",  mins: catMins("personal") + catMins("health"), color: "#70C8A0" },
  ];
  const mx = Math.max(...bars.map(b => b.mins), 1);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stats-card" onClick={e => e.stopPropagation()}>
        <div className="stats-header"><span className="stats-title">📊 Daily Summary</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="stats-streak">🔥 {streak} day streak</div>
        <div className="stats-row">
          <div className="stat-big"><div className="stat-num">{dn}/{tot}</div><div className="stat-lbl">Tasks done</div></div>
          <div className="stat-big"><div className="stat-num">{Math.round(catMins("deep") / 60 * 10) / 10}h</div><div className="stat-lbl">Focus time</div></div>
          <div className="stat-big"><div className="stat-num">{td.length}</div><div className="stat-lbl">Events</div></div>
        </div>
        <div className="stats-bars">{bars.map(b => <div key={b.label} className="stats-bar-row"><span className="stats-bar-label">{b.label}</span><div className="stats-bar-track"><div className="stats-bar-fill" style={{ width: `${(b.mins / mx) * 100}%`, background: b.color }} /></div><span className="stats-bar-val">{Math.round(b.mins)}m</span></div>)}</div>
      </div>
    </div>
  );
}

// ─── Carry Over ───────────────────────────────────────────────────────────────
function CarryOverPrompt({ tasks, onCarry, onDrop, onDismiss }) {
  const [sel, setSel] = useState(tasks.map(t => t.id));
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="carryover-card" onClick={e => e.stopPropagation()}>
        <div className="carryover-title">🌙 End of day — uncompleted tasks:</div>
        <div className="carryover-list">{tasks.map(t => <label key={t.id} className="carryover-item"><input type="checkbox" checked={sel.includes(t.id)} onChange={() => toggle(t.id)} /><span>{t.title}</span><span className="co-dur">{t.duration}min</span></label>)}</div>
        <div className="carryover-actions"><button className="tf-cancel" onClick={() => onDrop(sel)}>Drop selected</button><button className="tf-save" onClick={() => onCarry(sel)}>Push to tomorrow →</button></div>
      </div>
    </div>
  );
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────
function FocusMode({ tasks, events, pomodoro, onStartPomodoro, onPause, onResume, onStop, onExit }) {
  const now  = new Date(); const next = events.filter(e => e.start > now).sort((a, b) => a.start - b.start)[0];
  const open = tasks.filter(t => !t.done && t.scope === "day");
  return (
    <div className="focus-overlay">
      <button className="focus-exit" onClick={onExit}>✕ Exit Focus Mode</button>
      <div className="focus-content">
        <div className="focus-logo">🌸 Tempo</div>
        <div className="focus-date">{fmtDate(TODAY)}</div>
        {pomodoro.active ? (
          <PomodoroWidget state={pomodoro} tasks={tasks} onPause={onPause} onResume={onResume} onStop={onStop} />
        ) : (
          <div className="focus-idle">
            <div className="focus-idle-msg">Ready to focus? 🔮</div>
            {next && <div className="focus-next">Next: {next.title} at {fmt(next.start)}</div>}
          </div>
        )}
        <div className="focus-tasks">
          <div className="focus-tasks-title">Today's tasks</div>
          {open.slice(0, 5).map(t => (
            <div key={t.id} className="focus-task-row">
              <span className="focus-task-name">{t.title}</span>
              <span className="focus-task-dur">{t.duration}min</span>
              <button className="focus-start-btn" onClick={() => onStartPomodoro(t.id)}>▶</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shortcuts Modal ──────────────────────────────────────────────────────────
function ShortcutsModal({ onClose }) {
  const sc = [["D","Day view"],["W","Week view"],["M","Month view"],["J","Journal"],["F","Focus mode"],["C","Open chat"],["S","Settings"],["/ or ⌘K","Search"],["?","Shortcuts"],["Cmd+Z","Undo"],["Esc","Close / Back"]];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span style={{ fontWeight: 800 }}>⌨️ Keyboard Shortcuts</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="shortcuts-grid">{sc.map(([k, v]) => <div key={k} className="shortcut-row"><kbd className="kbd">{k}</kbd><span>{v}</span></div>)}</div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose, fontSize, setFontSize, darkMode, setDarkMode, theme, setTheme, workStart, setWorkStart, workEnd, setWorkEnd, notifs, setNotifs, timezone, setTimezone, user, onSignOut }) {
  function toggleNotifs() { if (!notifs && typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); setNotifs(!notifs); }

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
              <button className="signout-btn" onClick={onSignOut}>Sign out</button>
            </div>
          )}
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
          {/* Timezone */}
          <div className="settings-section">
            <div className="settings-section-label">Time Zone</div>
            <div className="settings-section-desc">Times display correctly when travelling</div>
            <select className="tf-select" value={timezone} onChange={e => setTimezone(e.target.value)} style={{width:"100%"}}>
              {tzList.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g," ")}</option>)}
            </select>
            <div style={{fontSize:10,color:"var(--text3)",marginTop:6,fontFamily:"var(--mono)"}}>
              Detected: {detected}
            </div>
          </div>
          {/* Notifications */}
          <div className="settings-section">
            <div className="settings-section-label">Notifications</div>
            <div className="settings-section-desc">Get reminded 10 min before events</div>
            <div className="toggle-row"><span>Off</span><button className={`toggle ${notifs ? "on" : ""}`} onClick={toggleNotifs}><div className="toggle-thumb" /></button><span>On</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Constants ────────────────────────────────────────────────────────
const JOURNAL_MOODS = [
  { id:"rad",    emoji:"😁", label:"Rad",    color:"#4CAF82" },
  { id:"good",   emoji:"😊", label:"Good",   color:"#7CB9E8" },
  { id:"meh",    emoji:"😐", label:"Meh",    color:"#FFD700" },
  { id:"bad",    emoji:"😔", label:"Bad",    color:"#FF8C69" },
  { id:"awful",  emoji:"😢", label:"Awful",  color:"#C97FC9" },
];
const JOURNAL_ACTIVITIES = [
  { id:"family",    emoji:"👨‍👩‍👧", label:"Family",    group:"Social"   },
  { id:"friends",   emoji:"👯",   label:"Friends",   group:"Social"   },
  { id:"date",      emoji:"💑",   label:"Date",      group:"Social"   },
  { id:"work",      emoji:"💼",   label:"Work",      group:"Social"   },
  { id:"reading",   emoji:"📚",   label:"Reading",   group:"Hobbies"  },
  { id:"gaming",    emoji:"🎮",   label:"Gaming",    group:"Hobbies"  },
  { id:"movies",    emoji:"🎬",   label:"Movies",    group:"Hobbies"  },
  { id:"music",     emoji:"🎵",   label:"Music",     group:"Hobbies"  },
  { id:"sport",     emoji:"🏃",   label:"Sport",     group:"Hobbies"  },
  { id:"cooking",   emoji:"🍳",   label:"Cooking",   group:"Hobbies"  },
  { id:"sleep",     emoji:"😴",   label:"Good sleep",group:"Health"   },
  { id:"gym",       emoji:"💪",   label:"Gym",       group:"Health"   },
  { id:"outdoors",  emoji:"🌿",   label:"Outdoors",  group:"Health"   },
  { id:"meditation",emoji:"🧘",   label:"Meditation",group:"Health"   },
  { id:"shopping",  emoji:"🛍️",   label:"Shopping",  group:"Other"    },
  { id:"travel",    emoji:"✈️",   label:"Travel",    group:"Other"    },
  { id:"food",      emoji:"🍜",   label:"Good food", group:"Other"    },
  { id:"relax",     emoji:"🛁",   label:"Relax",     group:"Other"    },
];
const JOURNAL_PROMPTS = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "What challenged you today and how did you handle it?",
  "What's one thing you'd do differently?",
  "What are you looking forward to tomorrow?",
  "Describe your day in three words.",
  "Who made a positive impact on your day?",
  "What did you learn today?",
  "What did you do for yourself today?",
  "What moment do you want to remember from today?",
];
// ─── Daily Entry Modal ────────────────────────────────────────────────────────
function DayEntryModal({ date, entry, onSave, onClose }) {
  const [mood,       setMoodLocal]  = useState(entry?.mood || null);
  const [activities, setActivities] = useState(entry?.activities || []);
  const [note,       setNote]       = useState(entry?.note || "");
  const [gratitude,  setGratitude]  = useState(entry?.gratitude || ["","",""]);
  const prompt = JOURNAL_PROMPTS[date.getDate() % JOURNAL_PROMPTS.length];
  const groups = [...new Set(JOURNAL_ACTIVITIES.map(a => a.group))];
  function toggleActivity(id) {
    setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  }
  function updateGratitude(i, val) {
    setGratitude(g => { const n=[...g]; n[i]=val; return n; });
  }
  function handleSave() {
    onSave(dateKey(date), { mood, activities, note, gratitude, updatedAt: new Date().toISOString() });
    onClose();
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="entry-modal" onClick={e => e.stopPropagation()}>
        <div className="entry-modal-header">
          <div>
            <div className="entry-modal-date">{date.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            <div className="entry-modal-sub">How was your day?</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="entry-modal-body">
        {/* Mood selector */}
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

        {/* Activities */}
        <div className="entry-section">
          <div className="entry-section-title">Activities</div>
          {groups.map(g => (
            <div key={g} className="activity-group">
              <div className="activity-group-label">{g}</div>
              <div className="activity-chips">
                {JOURNAL_ACTIVITIES.filter(a => a.group === g).map(a => (
                  <button key={a.id} className={`activity-chip ${activities.includes(a.id)?"selected":""}`}
                    onClick={() => toggleActivity(a.id)}>
                    <span>{a.emoji}</span><span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Gratitude */}
        <div className="entry-section">
          <div className="entry-section-title">3 Things I'm Grateful For 🌸</div>
          {[0,1,2].map(i => (
            <input key={i} className="gratitude-input" placeholder={`Gratitude ${i+1}…`}
              value={gratitude[i]} onChange={e => updateGratitude(i, e.target.value)} />
          ))}
        </div>

        {/* Journal note */}
        <div className="entry-section">
          <div className="entry-section-title">Journal Entry</div>
          <div className="journal-prompt">💭 {prompt}</div>
          <textarea className="journal-textarea" rows={5} placeholder="Write freely…"
            value={note} onChange={e => setNote(e.target.value)} />
        </div>
        </div>{/* end entry-modal-body */}

        <div className="entry-modal-footer">
          <button className="tf-cancel" onClick={onClose}>Cancel</button>
          <button className="tf-save" onClick={handleSave}>Save entry ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Page ─────────────────────────────────────────────────────────────
function JournalPage({ journal, setJournal, events, tasks }) {
  const [calDate,    setCalDate]    = useState(new Date(TODAY));
  const [editing,    setEditing]    = useState(null); // Date being edited
  const [viewingKey, setViewingKey] = useState(null); // dateKey being read

  function saveEntry(key, data) { setJournal(j => ({ ...j, [key]: data })); }

  // Build mood calendar for current month
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const fd = new Date(year, month, 1); const so = (fd.getDay()+6)%7;
  const calDays = [];
  for (let i=0; i<so; i++) calDays.push(null);
  for (let d=1; d<=daysInMonth; d++) calDays.push(new Date(year, month, d));
  while (calDays.length%7!==0) calDays.push(null);

  // Stats for current month
  const monthEntries = Object.entries(journal).filter(([k]) => k.startsWith(`${year}-${String(month+1).padStart(2,"0")}`));
  const moodCounts = JOURNAL_MOODS.map(m => ({ ...m, count: monthEntries.filter(([,e]) => e.mood===m.id).length }));
  const streak = (() => {
    let s=0; const d=new Date(TODAY);
    while(true){ if(!journal[dateKey(d)]?.mood) break; s++; d.setDate(d.getDate()-1); }
    return s;
  })();

  // (viewEntry accessed inline below via journal[viewingKey])

  return (
    <div className="journal-page">
      {/* Header */}
      <div className="journal-header">
        <div className="journal-title">📔 Journal</div>
        <div className="journal-streak">🔥 {streak} day streak</div>
        <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Today's entry</button>
      </div>

      {/* Mood stats bar */}
      <div className="mood-stats-bar">
        {moodCounts.map(m => m.count > 0 && (
          <div key={m.id} className="mood-stat-pill" style={{"--mc":m.color}}>
            <span>{m.emoji}</span><span className="mood-stat-count">{m.count}</span>
          </div>
        ))}
        <span className="mood-stats-month">{calDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
      </div>

      {/* Mood Calendar */}
      <div className="journal-cal-section">
        <div className="journal-cal-nav">
          <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()-1); setCalDate(d); }}>‹</button>
          <span className="journal-cal-month">{calDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
          <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()+1); setCalDate(d); }}>›</button>
        </div>
        <div className="journal-cal-grid">
          {["M","T","W","T","F","S","S"].map((d,i) => <div key={i} className="jcal-dow">{d}</div>)}
          {calDays.map((day, i) => {
            if (!day) return <div key={i} className="jcal-empty"/>;
            const key = dateKey(day);
            const entry = journal[key];
            const moodObj = entry?.mood ? JOURNAL_MOODS.find(m=>m.id===entry.mood) : null;
            const isT = day.toDateString()===TODAY.toDateString();
            const isFuture = day > TODAY;
            return (
              <button key={i} className={`jcal-day ${isT?"jcal-today":""} ${isFuture?"jcal-future":""}`}
                onClick={() => isFuture ? null : (entry ? setViewingKey(key) : setEditing(day))}>
                {moodObj
                  ? <span className="jcal-emoji" style={{"--mc":moodObj.color}}>{moodObj.emoji}</span>
                  : <span className={`jcal-dot ${isT?"jcal-today-dot":""}`}/>
                }
                <span className="jcal-num">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent entries list */}
      <div className="journal-entries-section">
        <div className="journal-entries-title">Recent Entries</div>
        {Object.entries(journal)
          .filter(([,e]) => e.mood || e.note)
          .sort(([a],[b]) => b.localeCompare(a))
          .slice(0,10)
          .map(([key, entry]) => {
            const d = new Date(key);
            const moodObj = JOURNAL_MOODS.find(m=>m.id===entry.mood);
            const acts = (entry.activities||[]).map(id=>JOURNAL_ACTIVITIES.find(a=>a.id===id)).filter(Boolean);
            return (
              <div key={key} className="journal-entry-card" onClick={() => setViewingKey(key)}>
                <div className="jec-left">
                  {moodObj && <span className="jec-emoji" style={{"--mc":moodObj.color}}>{moodObj.emoji}</span>}
                </div>
                <div className="jec-body">
                  <div className="jec-date">{d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                  {moodObj && <div className="jec-mood" style={{color:moodObj.color}}>{moodObj.label}</div>}
                  {acts.length>0 && <div className="jec-acts">{acts.slice(0,5).map(a=><span key={a.id}>{a.emoji}</span>)}</div>}
                  {entry.note && <div className="jec-note">{entry.note.slice(0,80)}{entry.note.length>80?"…":""}</div>}
                  {entry.gratitude?.some(g=>g) && <div className="jec-gratitude">🌸 {entry.gratitude.filter(g=>g)[0]}</div>}
                </div>
                <div className="jec-arrow">›</div>
              </div>
            );
          })}
        {Object.keys(journal).length === 0 && (
          <div className="journal-empty">
            <div className="journal-empty-icon">📔</div>
            <div className="journal-empty-title">No entries yet</div>
            <div className="journal-empty-sub">Tap "+ Today's entry" to start your journal</div>
            <button className="tf-save" style={{marginTop:16}} onClick={() => setEditing(new Date(TODAY))}>Start journaling 🌸</button>
          </div>
        )}
      </div>

      {/* View entry modal */}
      {viewingKey && journal[viewingKey] && (() => {
        const entry = journal[viewingKey];
        const d = new Date(viewingKey);
        const moodObj = JOURNAL_MOODS.find(m=>m.id===entry.mood);
        const acts = (entry.activities||[]).map(id=>JOURNAL_ACTIVITIES.find(a=>a.id===id)).filter(Boolean);
        return (
          <div className="modal-overlay" onClick={() => setViewingKey(null)}>
            <div className="entry-view-modal" onClick={e=>e.stopPropagation()}>
              <div className="entry-modal-header">
                <div>
                  <div className="entry-modal-date">{d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
                  {moodObj && <div className="entry-view-mood" style={{color:moodObj.color}}>{moodObj.emoji} {moodObj.label}</div>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="tf-cancel" style={{fontSize:11}} onClick={() => { setEditing(d); setViewingKey(null); }}>Edit</button>
                  <button className="modal-close" onClick={() => setViewingKey(null)}>✕</button>
                </div>
              </div>
              {acts.length>0 && <div className="entry-view-section"><div className="entry-section-title">Activities</div><div className="activity-chips">{acts.map(a=><span key={a.id} className="activity-chip selected">{a.emoji} {a.label}</span>)}</div></div>}
              {entry.gratitude?.some(g=>g) && <div className="entry-view-section"><div className="entry-section-title">Gratitude 🌸</div>{entry.gratitude.filter(g=>g).map((g,i)=><div key={i} className="gratitude-view-item">✦ {g}</div>)}</div>}
              {entry.note && <div className="entry-view-section"><div className="entry-section-title">Journal</div><div className="entry-view-note">{entry.note}</div></div>}
            </div>
          </div>
        );
      })()}

      {editing && <DayEntryModal date={editing} entry={journal[dateKey(editing)]} onSave={saveEntry} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ─── Google Calendar Import Modal ─────────────────────────────────────────────
function GcalModal({ onClose, onImport, viewDate }) {
  const [step, setStep]         = useState("info"); // "info" | "paste" | "preview"
  const [icsText, setIcsText]   = useState("");
  const [parsed,  setParsed]    = useState([]);
  const [error,   setError]     = useState("");
  const [selected, setSelected] = useState([]);

  // Parse a .ics file text into event objects
  function parseICS(text) {
    const events = [];
    const blocks = text.split("BEGIN:VEVENT");
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      const get = key => {
        const m = block.match(new RegExp(`${key}[^:]*:([^\\r\\n]+)`));
        return m ? m[1].trim() : null;
      };
      const parseICSDate = s => {
        if (!s) return null;
        // Handle TZID format: DTSTART;TZID=...:20260517T090000
        const clean = s.replace(/.*:/, "");
        const y=clean.slice(0,4),mo=clean.slice(4,6),d=clean.slice(6,8);
        const h=clean.slice(9,11)||"00",mi=clean.slice(11,13)||"00";
        return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`);
      };
      const summary = get("SUMMARY") || "Imported Event";
      const startRaw = block.match(/DTSTART[^:]*:([^\r\n]+)/)?.[1]?.trim();
      const endRaw   = block.match(/DTEND[^:]*:([^\r\n]+)/)?.[1]?.trim();
      if (!startRaw) continue;
      const start = parseICSDate(startRaw);
      const end   = endRaw ? parseICSDate(endRaw) : new Date(start.getTime() + 3600000);
      if (!start || isNaN(start)) continue;
      events.push({
        id: "gcal-" + uid(),
        title: summary,
        start, end,
        calendar: "work",
        category: "meeting",
        fixed: false,
        color: "#4285F4",
        notes: get("DESCRIPTION") || get("LOCATION") || "",
        recurrence: null,
        source: "google",
      });
    }
    return events;
  }

  function handlePaste() {
    setError("");
    if (!icsText.trim()) { setError("Please paste your calendar data first."); return; }
    const evs = parseICS(icsText);
    if (!evs.length) { setError("No events found. Make sure you copied the full .ics content."); return; }
    setParsed(evs);
    setSelected(evs.map(e => e.id));
    setStep("preview");
  }

  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal gcal-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{borderLeft:"4px solid #4285F4"}}>
          <span style={{fontWeight:800,fontSize:16}}>📅 Connect Google Calendar</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === "info" && (
          <div className="modal-body">
            <div className="gcal-step">
              <div className="gcal-step-title">How to import from Google Calendar</div>
              <div className="gcal-steps-list">
                <div className="gcal-step-row"><span className="gcal-step-num">1</span><span>Go to <strong>calendar.google.com</strong></span></div>
                <div className="gcal-step-row"><span className="gcal-step-num">2</span><span>Click the <strong>⚙️ Settings</strong> gear → Settings</span></div>
                <div className="gcal-step-row"><span className="gcal-step-num">3</span><span>Click your calendar on the left → <strong>Export calendar</strong></span></div>
                <div className="gcal-step-row"><span className="gcal-step-num">4</span><span>Open the downloaded <strong>.ics file</strong> in a text editor (Notepad / TextEdit)</span></div>
                <div className="gcal-step-row"><span className="gcal-step-num">5</span><span>Select all (<kbd>Ctrl+A</kbd>) → Copy (<kbd>Ctrl+C</kbd>)</span></div>
                <div className="gcal-step-row"><span className="gcal-step-num">6</span><span>Come back here and paste it below</span></div>
              </div>
              <div className="gcal-note">💡 Your data stays private — it's processed in your browser and never sent anywhere except your own Supabase.</div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
              <button className="tf-save" onClick={() => setStep("paste")}>Next → Paste data</button>
            </div>
          </div>
        )}

        {step === "paste" && (
          <div className="modal-body">
            <div className="gcal-step-title">Paste your .ics calendar data</div>
            <textarea className="gcal-paste-area" rows={10}
              placeholder="Paste the contents of your .ics file here (starts with BEGIN:VCALENDAR)…"
              value={icsText} onChange={e => setIcsText(e.target.value)} autoFocus />
            {error && <div className="login-error" style={{marginTop:8}}>⚠️ {error}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
              <button className="tf-cancel" onClick={() => setStep("info")}>← Back</button>
              <button className="tf-save" onClick={handlePaste}>Parse events →</button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="modal-body">
            <div className="gcal-step-title">{parsed.length} events found — select which to import</div>
            <div className="gcal-preview-list">
              {parsed.slice(0, 50).map(ev => (
                <label key={ev.id} className="gcal-preview-row">
                  <input type="checkbox" checked={selected.includes(ev.id)} onChange={() => toggleSelect(ev.id)} />
                  <div className="gcal-preview-info">
                    <span className="gcal-preview-title">{ev.title}</span>
                    <span className="gcal-preview-time">
                      {ev.start.toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {fmt(ev.start)} – {fmt(ev.end)}
                    </span>
                  </div>
                </label>
              ))}
              {parsed.length > 50 && <div style={{fontSize:11,color:"var(--text3)",padding:"6px 0"}}>Showing first 50 of {parsed.length} events</div>}
            </div>
            <div className="gcal-select-row">
              <button className="tf-cancel" style={{fontSize:11}} onClick={() => setSelected(parsed.map(e=>e.id))}>Select all</button>
              <button className="tf-cancel" style={{fontSize:11}} onClick={() => setSelected([])}>None</button>
              <span style={{flex:1}}/>
              <button className="tf-cancel" onClick={() => setStep("paste")}>← Back</button>
              <button className="tf-save" onClick={() => onImport(parsed.filter(e => selected.includes(e.id)))}>
                Import {selected.length} event{selected.length !== 1 ? "s" : ""} ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────
function AddEventModal({ onClose, onSave, defaultDate }) {
  const toDateStr = d => dateKey(d);
  const toTimeStr = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  const now = new Date(defaultDate); now.setMinutes(0,0,0);
  const end = new Date(now); end.setHours(end.getHours()+1);
  const [form, setForm] = useState({
    title: "", date: toDateStr(defaultDate), startTime: toTimeStr(now), endTime: toTimeStr(end),
    calendar: "work", category: "meeting", fixed: false, notes: "", color: null, recurrence: null
  });
  const [err, setErr] = useState("");
  function handleSave() {
    if (!form.title.trim()) { setErr("Please enter a title."); return; }
    const [sh,sm] = form.startTime.split(":").map(Number);
    const [eh,em] = form.endTime.split(":").map(Number);
    const start = new Date(form.date); start.setHours(sh,sm,0,0);
    const end   = new Date(form.date); end.setHours(eh,em,0,0);
    if (end <= start) { setErr("End time must be after start time."); return; }
    onSave({ id:"e"+uid(), title:form.title.trim(), start, end, calendar:form.calendar, category:form.category, fixed:form.fixed, notes:form.notes, color:form.color, recurrence:form.recurrence });
    onClose();
  }
  const COLORS=["#FF7BAC","#B08AE0","#7CBAFF","#70C8A0","#FFB870","#FF9F9F","#C9A0FF","#7EC8C8"];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{borderLeft:`4px solid ${form.color||"var(--accent)"}`}}>
          <input className="modal-title-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event title" autoFocus />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><label>Date</label><input type="date" className="modal-select" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          <div className="modal-row"><label>Start</label><input type="time" className="modal-select modal-time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></div>
          <div className="modal-row"><label>End</label><input type="time" className="modal-select modal-time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div>
          <div className="modal-row"><label>Calendar</label><select className="modal-select" value={form.calendar} onChange={e=>setForm(f=>({...f,calendar:e.target.value}))}>{CALENDARS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row"><label>Recurrence</label><select className="modal-select" value={form.recurrence||""} onChange={e=>setForm(f=>({...f,recurrence:e.target.value||null}))}><option value="">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="weekdays">Weekdays</option><option value="monthly">Monthly</option></select></div>
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

// ─── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ events, tasks, onClose, onEventClick, onTaskEdit, onNavigate }) {
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
    <div className="modal-overlay search-overlay" onClick={onClose}>
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
                  const cal = CALENDARS.find(c => c.id === e.calendar);
                  const color = e.color || cal?.color || "#FF7BAC";
                  return (
                    <div key={e.id} className="search-result-row" onClick={() => { onNavigate(e.start); onEventClick(e); onClose(); }}>
                      <div className="search-result-dot" style={{ background: color }} />
                      <div className="search-result-body">
                        <div className="search-result-title">{highlightMatch(e.title, q)}</div>
                        <div className="search-result-meta">
                          {e.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {fmt(e.start)}–{fmt(e.end)}
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
                  const cat = CATEGORIES.find(c => c.id === t.category);
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
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  function send(ov) {
    const text = (ov ?? input).trim(); if (!text) return;
    setInput(""); setMessages(p => [...p, { role: "user", text }]);
    setTimeout(() => {
      const { text: rt, newEv, newTk, newP } = processMessage(text, events, tasks, pending);
      setMessages(p => [...p, { role: "assistant", text: rt }]);
      // newEv can be a full replacement array (delete/reschedule) or a single new event to add
      if (newEv) {
        if (Array.isArray(newEv) && newEv !== events) onUpdateEvents(newEv);
      }
      if (newTk) onUpdateTasks(newTk);
      // If pending was add_event and confirmed, newEv is the updated array — already handled above
      setPending(newP || null);
    }, 280);
  }
  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
  const sugg = ["What's on today?","When am I free?","Show my tasks","How busy am I?","What's next?","Help"];
  return (
    <div className="chat-panel">
      <div className="chat-header"><div className="chat-title-row"><div className="chat-avatar">🌸</div><div><div className="chat-name">Tempo Assistant</div><div className="chat-status">● always here</div></div></div><button className="chat-close" onClick={onClose}>✕</button></div>
      <div className="chat-messages">
        {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.role === "assistant" && <div className="msg-avatar">🌸</div>}<div className="msg-bubble" style={{ whiteSpace: "pre-line" }}>{m.text}</div></div>)}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 2 && <div className="suggestions">{sugg.map((s, i) => <button key={i} className="suggestion-pill" onClick={() => send(s)}>{s}</button>)}</div>}
      <div className="chat-input-row"><textarea className="chat-input" placeholder="Ask about your schedule..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} rows={1} /><button className="chat-send" onClick={() => send()} disabled={!input.trim()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button></div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();
  const uk = auth.user?.id ?? "anon";

  const [view, setView]             = useState("day");
  const [viewDate, setViewDate]     = useState(new Date(TODAY));
  const [page, setPage]             = useState("calendar"); // "calendar" | "journal"
  const [taskScope, setTaskScope]   = useState("day");
  const [events, setEvRaw]          = useState(() => reviveEvents(load(`${uk}_ev`, INIT_EVENTS)));
  const [tasks,  setTkRaw]          = useState(() => load(`${uk}_tk`, INIT_TASKS));
  const [chatOpen, setChatOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize,  setFSRaw]       = useState(() => load(`${uk}_fs`, "md"));
  const [darkMode,  setDMRaw]       = useState(() => load(`${uk}_dm`, false));
  const [workStart, setWSRaw]       = useState(() => load(`${uk}_ws`, 9));
  const [workEnd,   setWERaw]       = useState(() => load(`${uk}_we`, 19));
  const [timezone,   setTzRaw]        = useState(() => load(`${uk}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [theme,     setThRaw]       = useState(() => load(`${uk}_th`, "tempo"));
  const [undoStack, setUndo]        = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showStats,    setShowStats]    = useState(false);
  const [showShortcuts,setShowShortcuts]= useState(false);
  const [showCarryOver,setShowCarryOver]= useState(false);
  const [showAddEvent,  setShowAddEvent]  = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [hiddenCals,    setHiddenCals]    = useState(() => load(`${uk}_hidden_cals`, []));
  const [quickAddDate,  setQuickAddDate]  = useState(null);
  const [focusMode,    setFocusMode]    = useState(false);
  const [dataReady,    setDataReady]    = useState(false);
  const [journal, setJournalRaw] = useState({}); // populated by useEffect after auth resolves
  // Real streak: count consecutive days the user has been active
  const [streak, setStreak] = useState(0);
  const pomodoro = usePomodoro();

  // When user logs in: try to pull their data from Supabase, fall back to localStorage
  useEffect(() => {
    if (!auth.user) { setDataReady(false); return; }
    setDataReady(false);
    // Safety timeout — if cloud load hangs (CDN blocked, network issue), fall back after 4s
    const fallbackTimer = setTimeout(() => {
      setEvRaw(reviveEvents(load(`${uk}_ev`, null) ?? INIT_EVENTS));
      setTkRaw(load(`${uk}_tk`, null) ?? INIT_TASKS);
      setFSRaw(load(`${uk}_fs`, "md"));
      setDMRaw(load(`${uk}_dm`, false));
      setThRaw(load(`${uk}_th`, "tempo"));
      setJournalRaw(load(`${uk}_journal`, {}));
      const _la2 = load(`${uk}_last_active`, null), _ss2 = load(`${uk}_streak`, 0);
      const _td2 = dateKey(TODAY), _yd2 = dateKey(new Date(TODAY.getTime() - 86400000));
      if (!_la2) { save(`${uk}_last_active`, _td2); save(`${uk}_streak`, 1); setStreak(1); }
      else if (_la2 === _td2) setStreak(_ss2);
      else if (_la2 === _yd2) { const s = _ss2 + 1; save(`${uk}_streak`, s); save(`${uk}_last_active`, _td2); setStreak(s); }
      else { save(`${uk}_streak`, 1); save(`${uk}_last_active`, _td2); setStreak(1); }
      setDataReady(true);
    }, 4000);
    // Helper: load user data, always prefer localStorage over demo seed data
    const localEv = load(`${uk}_ev`, null);
    const localTk = load(`${uk}_tk`, null);
    loadFromCloud(auth.user.id).then(cloud => {
      clearTimeout(fallbackTimer);
      if (cloud && cloud.events.length) {
        // Cloud has real data — use it and sync to localStorage
        setEvRaw(reviveEvents(cloud.events));
        save(`${uk}_ev`, cloud.events);
        setTkRaw(cloud.tasks.length ? cloud.tasks : (localTk ?? INIT_TASKS));
        save(`${uk}_tk`, cloud.tasks.length ? cloud.tasks : (localTk ?? INIT_TASKS));
        if (cloud.settings?.fontSize) setFSRaw(cloud.settings.fontSize);
        if (cloud.settings?.darkMode !== undefined) setDMRaw(cloud.settings.darkMode);
        if (cloud.settings?.theme) setThRaw(cloud.settings.theme);
      } else if (localEv) {
        // No cloud data yet but localStorage has real data — use local and push to cloud
        setEvRaw(reviveEvents(localEv));
        setTkRaw(localTk ?? INIT_TASKS);
        if (auth.user) saveToCloud(auth.user.id, localEv, localTk ?? INIT_TASKS, {});
      } else {
        // Brand new user — start with demo seed data
        setEvRaw(reviveEvents(INIT_EVENTS));
        setTkRaw(INIT_TASKS);
        setFSRaw(load(`${uk}_fs`, "md"));
        setDMRaw(load(`${uk}_dm`, false));
        setThRaw(load(`${uk}_th`, "tempo"));
      }
      // Journal always loads from localStorage (per-device, private by design)
      setJournalRaw(load(`${uk}_journal`, {}));
      // Compute streak with correct user key
      const _la = load(`${uk}_last_active`, null), _ss = load(`${uk}_streak`, 0);
      const _td = dateKey(TODAY), _yd = dateKey(new Date(TODAY.getTime() - 86400000));
      if (!_la) { save(`${uk}_last_active`, _td); save(`${uk}_streak`, 1); setStreak(1); }
      else if (_la === _td) setStreak(_ss);
      else if (_la === _yd) { const s = _ss + 1; save(`${uk}_streak`, s); save(`${uk}_last_active`, _td); setStreak(s); }
      else { save(`${uk}_streak`, 1); save(`${uk}_last_active`, _td); setStreak(1); }
      setDataReady(true);
    }).catch(() => {
      clearTimeout(fallbackTimer);
      setEvRaw(reviveEvents(load(`${uk}_ev`, null) ?? INIT_EVENTS));
      setTkRaw(load(`${uk}_tk`, null) ?? INIT_TASKS);
      setFSRaw(load(`${uk}_fs`, "md"));
      setDMRaw(load(`${uk}_dm`, false));
      setThRaw(load(`${uk}_th`, "tempo"));
      setJournalRaw(load(`${uk}_journal`, {}));
      const _la3 = load(`${uk}_last_active`, null), _ss3 = load(`${uk}_streak`, 0);
      const _td3 = dateKey(TODAY), _yd3 = dateKey(new Date(TODAY.getTime() - 86400000));
      if (!_la3) { save(`${uk}_last_active`, _td3); save(`${uk}_streak`, 1); setStreak(1); }
      else if (_la3 === _td3) setStreak(_ss3);
      else if (_la3 === _yd3) { const s = _ss3 + 1; save(`${uk}_streak`, s); save(`${uk}_last_active`, _td3); setStreak(s); }
      else { save(`${uk}_streak`, 1); save(`${uk}_last_active`, _td3); setStreak(1); }
      setDataReady(true);
    });
    return () => clearTimeout(fallbackTimer);
  }, [auth.user?.id]);

  // Helper: save locally + push to cloud — always use passed values to avoid stale closure
  const syncEvents = (evs, tks) => {
    save(`${uk}_ev`, evs);
    if (auth.user) saveToCloud(auth.user.id, evs, tks ?? tasks, { fontSize, darkMode, theme });
  };
  const syncTasks = (tks, evs) => {
    save(`${uk}_tk`, tks);
    if (auth.user) saveToCloud(auth.user.id, evs ?? events, tks, { fontSize, darkMode, theme });
  };

  const setEvents   = v => { const n = reviveEvents(typeof v === "function" ? v(events) : v); setEvRaw(n); syncEvents(n, tasks); };
  const setTasks    = v => { const n = typeof v === "function" ? v(tasks)  : v; setTkRaw(n); syncTasks(n, events); };
  const setFontSize = v => { setFSRaw(v); save(`${uk}_fs`, v); if (auth.user) saveToCloud(auth.user.id, events, tasks, { fontSize: v, darkMode }); };
  const setDarkMode = v => { const n = typeof v === "function" ? v(darkMode) : v; setDMRaw(n); save(`${uk}_dm`, n); if (auth.user) saveToCloud(auth.user.id, events, tasks, { fontSize, darkMode: n }); };
  const setWorkStart = v => { setWSRaw(v); save(`${uk}_ws`, v); setWorkHoursCtx(v, workEnd); };
  const setWorkEnd   = v => { setWERaw(v); save(`${uk}_we`, v); setWorkHoursCtx(workStart, v); };
  // Keep context in sync on every render (cheap, ensures no stale values)
  setWorkHoursCtx(workStart, workEnd);
  const setNotifs    = v => { setNfRaw(v); save(`${uk}_nf`, v); };
  const setTimezone  = v => { setTzRaw(v); save(`${uk}_tz`, v); };
  const toggleCalVisibility = id => {
    const n = hiddenCals.includes(id) ? hiddenCals.filter(c => c !== id) : [...hiddenCals, id];
    setHiddenCals(n); save(`${uk}_hidden_cals`, n);
  };
  const setJournal   = v => { const n = typeof v === "function" ? v(journal) : v; setJournalRaw(n); save(`${uk}_journal`, n); };
  const setTheme     = v => { setThRaw(v); save(`${uk}_th`, v); if (auth.user) saveToCloud(auth.user.id, events, tasks, { fontSize, darkMode, theme: v }); };

  function pushUndo() { setUndo(s => [...s.slice(-19), { events, tasks }]); }
  function undo() {
    setUndo(s => {
      if (!s.length) return s;
      const l = s[s.length - 1];
      setEvRaw(l.events); setTkRaw(l.tasks); syncEvents(l.events, l.tasks); return s.slice(0, -1);
    });
  }

  function toggleTask(id)         { pushUndo(); setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function addTask(task)          { pushUndo(); setTasks(ts => [...ts, task]); }
  function addEvent(ev)           { pushUndo(); setEvents(es => [...es, ev]); }
  function reschedule(id, ns, ne) {
    // Strip _r_ suffix to find the base event if user drags a recurring instance
    const baseId = id.includes("_r_") ? id.split("_r_")[0] : id;
    pushUndo(); setEvents(ev => ev.map(e => e.id === baseId ? { ...e, start: ns, end: ne } : e));
  }
  function saveEvent(ev) {
    const baseId = ev.id.includes("_r_") ? ev.id.split("_r_")[0] : ev.id;
    pushUndo(); setEvents(es => es.map(e => e.id === baseId ? { ...ev, id: baseId } : e));
  }
  function deleteEvent(id) {
    const baseId = id.includes("_r_") ? id.split("_r_")[0] : id;
    pushUndo(); setEvents(es => es.filter(e => e.id !== baseId));
  }

  function applyTemplate(tpl) {
    pushUndo();
    const base = new Date(viewDate);
    const newEvs = tpl.events.map((te, i) => {
      const st = new Date(base); st.setHours(te.start[0], te.start[1], 0, 0);
      const en = new Date(base); en.setHours(te.end[0],   te.end[1],   0, 0);
      return { id: "e" + uid() + i, title: te.title, start: st, end: en, calendar: te.category === "personal" || te.category === "health" ? "personal" : "work", category: te.category, fixed: te.fixed, color: null, notes: "", recurrence: null };
    });
    setEvents(es => [...es.filter(e => !sameDay(e.start, base) || e.fixed), ...newEvs]);
    setShowTemplates(false);
  }
  function handleCarryOver(ids) { setTasks(ts => ts.map(t => ids.includes(t.id) ? { ...t, scope: "day", done: false } : t)); setShowCarryOver(false); }
  function handleDrop(ids)      { setTasks(ts => ts.filter(t => !ids.includes(t.id))); setShowCarryOver(false); }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if (e.key === "Escape") {
        if (showSearch) { setShowSearch(false); return; }
        if (page === "journal") { setPage("calendar"); return; }
        setSelectedEvent(null); setShowStats(false); setShowShortcuts(false); setSettingsOpen(false); setShowTemplates(false); setFocusMode(false); return;
      }
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) { e.preventDefault(); setShowSearch(v => !v); return; }
      if (e.key === "?") { setShowShortcuts(v => !v); return; }
      const k = e.key.toLowerCase();
      if (k === "d" && !e.metaKey && !e.ctrlKey) { setPage("calendar"); setView("day"); }
      else if (k === "w" && !e.metaKey) { setPage("calendar"); setView("week"); }
      else if (k === "m" && !e.metaKey) { setPage("calendar"); setView("month"); }
      else if (k === "j") setPage(p => p === "journal" ? "calendar" : "journal");
      else if (k === "f") setFocusMode(v => !v);
      else if (k === "c") setChatOpen(v => !v);
      else if (k === "s") setSettingsOpen(v => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, page, focusMode, chatOpen, settingsOpen, showShortcuts, undoStack]);

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

  // Show spinner while pulling data from cloud
  if (!dataReady) return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:16}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><p style={{color:"#A07090",fontSize:13,fontWeight:600,marginBottom:20}}>Loading your schedule…</p><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
    </>
  );

  const expandedEvents  = expandRecurring(events);
  const viewDayEvents   = expandedEvents.filter(e => e.start instanceof Date && e.start.toDateString() === viewDate.toDateString() && !hiddenCals.includes(e.calendar));
  const visibleEvents   = expandedEvents.filter(e => !hiddenCals.includes(e.calendar));
  const openToday     = tasks.filter(t => !t.done && t.scope === "day").length;
  const fontScale     = FONT_SIZES.find(f => f.id === fontSize)?.scale ?? 1;
  const activeTheme   = THEMES.find(t => t.id === theme) ?? THEMES[0];
  const cvars         = (darkMode ? activeTheme.dark : activeTheme.light) + activeTheme.accent;

  return (
    <>
      <style>{appCSS(cvars, fontScale)}</style>

      {focusMode && <FocusMode tasks={tasks} events={events} pomodoro={pomodoro.state} onStartPomodoro={pomodoro.start} onPause={pomodoro.pause} onResume={pomodoro.resume} onStop={pomodoro.stop} onExit={() => setFocusMode(false)} />}

      <div className="app">
        <div className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-logo"><div className="logo-icon">🌸</div><span>Tempo</span></div>
          <div className="sidebar-date">
            <div className="date-big">{TODAY.getDate()}</div>
            {TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", year: "numeric" })}
            {auth.user && <div className="sidebar-user">👤 {auth.user.name || auth.user.email}</div>}
          </div>
          {(() => { const todayMood = journal[dateKey(TODAY)]; const m = todayMood?.mood ? JOURNAL_MOODS.find(x=>x.id===todayMood.mood) : null; return m ? <div className="mood-bar" onClick={() => setPage("journal")} style={{cursor:"pointer"}}>{m.emoji} Feeling {m.label}</div> : null; })()}
          <nav className="sidebar-nav">
            <div className="nav-section-label">Calendar</div>
            {[{id:"day",icon:"☀️",label:"Day"},{id:"week",icon:"🗓️",label:"Week"},{id:"month",icon:"🌙",label:"Month"}].map(n => (
              <div key={n.id} className={`nav-item ${page==="calendar" && view === n.id ? "active" : ""}`} onClick={() => { setPage("calendar"); setView(n.id); }}><span className="nav-icon">{n.icon}</span>{n.label}</div>
            ))}
            <div className="nav-section-label" style={{marginTop:8}}>Me</div>
            <div className={`nav-item ${page==="journal"?"active":""}`} onClick={() => setPage("journal")}><span className="nav-icon">📔</span>Journal</div>
            <div className="nav-item" onClick={() => setFocusMode(true)}><span className="nav-icon">🎯</span>Focus Mode</div>
            <div className="nav-item" onClick={() => setShowStats(true)}><span className="nav-icon">📊</span>Daily Stats</div>
            <div className="nav-item" onClick={() => setShowCarryOver(true)}><span className="nav-icon">🌙</span>End of Day</div>
          </nav>
          <div className="sidebar-cals">
            <div className="cal-label-row">
              <span className="cal-label">Calendars</span>
            </div>
            {CALENDARS.map(c => {
              const hidden = hiddenCals.includes(c.id);
              return (
                <div key={c.id} className={`cal-item cal-toggleable ${hidden ? "cal-hidden" : ""}`}
                  onClick={() => toggleCalVisibility(c.id)} title={hidden ? "Click to show" : "Click to hide"}>
                  <span className="cal-dot" style={{ background: hidden ? "var(--border)" : c.color }} />
                  <span className="cal-name">{c.id === "work" ? (auth.user?.email ?? c.account) : c.name}</span>
                  <span className="cal-eye">{hidden ? "○" : "●"}</span>
                </div>
              );
            })}
            <button className="gcal-connect-btn" onClick={() => setShowGcalModal(true)}>
              <span>📅</span> Connect Google Calendar
            </button>
          </div>
        </div>

        <div className="main">
          {page === "journal" ? (
            <JournalPage journal={journal} setJournal={setJournal} events={events} tasks={tasks} uk={uk} />
          ) : (<>
          <div className="topbar">
            <button className="topbar-btn icon-only" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => {
              const d = new Date(viewDate);
              if (view === "day")   d.setDate(d.getDate() - 1);
              if (view === "week")  d.setDate(d.getDate() - 7);
              if (view === "month") d.setMonth(d.getMonth() - 1);
              setViewDate(d);
            }}>‹</button>
            <button className="topbar-btn today-btn" onClick={() => setViewDate(new Date(TODAY))}>Today</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => {
              const d = new Date(viewDate);
              if (view === "day")   d.setDate(d.getDate() + 1);
              if (view === "week")  d.setDate(d.getDate() + 7);
              if (view === "month") d.setMonth(d.getMonth() + 1);
              setViewDate(d);
            }}>›</button>
            <div className="topbar-date">
              {view === "day" ? fmtDate(viewDate) : view === "week" ? (() => {
                const mon = new Date(viewDate); mon.setDate(viewDate.getDate() - viewDate.getDay() + 1);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                return `${mon.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${sun.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
              })() : viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
              {view === "day" && viewDate.toDateString() === TODAY.toDateString() && <span className="today-badge">{viewDayEvents.length} events</span>}
            </div>
            <div className="view-tabs">
              {["day","week","month"].map(v => <button key={v} className={`view-tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
            </div>
            <button className="topbar-btn add-event-btn" onClick={() => setShowAddEvent(true)}>+ Event</button>
            <button className="topbar-btn" onClick={() => setShowSearch(true)} title="Search (/)">🔍</button>
            <button className="topbar-btn" onClick={() => setShowTemplates(true)}>🗂 Templates</button>
            <button className="topbar-btn icon-only" onClick={() => setShowShortcuts(true)}>⌨️</button>
            <button className="topbar-btn icon-only" onClick={() => setSettingsOpen(true)}>⚙️</button>
          </div>

          <div className="stats-bar">
            <div className="stat"><div className="stat-dot" style={{ background: "#B08AE0" }} />Focus: {Math.round(viewDayEvents.filter(e => e.category === "deep").reduce((a, e) => a + (e.end - e.start) / 60000, 0) / 60 * 10) / 10}h</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#FF7BAC" }} />{openToday} tasks open</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#70C8A0" }} />Free blocks: {freeBlocks(visibleEvents, viewDate).length}</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#FFB870" }} />🔥 {streak}d streak</div>
          </div>

          <div className="content-area">
            <div className={`calendar-pane view-${view}`}>
              {view === "day" && <DayView events={viewDayEvents} calendars={CALENDARS} categories={CATEGORIES} onReschedule={reschedule} onEventClick={setSelectedEvent} onDropTask={addEvent} viewDate={viewDate} onGridClick={d => setQuickAddDate(d)} />}
              {view === "week" && <WeekView events={visibleEvents} calendars={CALENDARS} categories={CATEGORIES} onEventClick={setSelectedEvent} viewDate={viewDate} onDayClick={d => { setViewDate(d); setView("day"); }} />}
              {view === "month" && (() => {
                const year = viewDate.getFullYear(), month = viewDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const fd = new Date(year, month, 1); const so = (fd.getDay() + 6) % 7; const days = [];
                for (let i = 0; i < so; i++) days.push(null);
                for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
                while (days.length % 7 !== 0) days.push(null);

                // Compute max events in any single day this month for heat map normalisation
                const dayCounts = days.filter(Boolean).map(d =>
                  visibleEvents.filter(e => e.start instanceof Date && sameDay(e.start, d)).length
                );
                const maxCount = Math.max(...dayCounts, 1);

                return (
                  <div className="month-view">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="month-header">{d}</div>)}
                    {days.map((day, i) => {
                      const de = day ? visibleEvents.filter(e => e.start instanceof Date && sameDay(e.start, day)) : [];
                      const isT = day && sameDay(day, TODAY);
                      const heat = day ? de.length / maxCount : 0; // 0–1
                      // Heat map: tint the active theme accent colour at low opacity
                      const heatBg = heat > 0.05 ? `rgba(var(--accent-rgb,255,123,172),${(heat * 0.22).toFixed(2)})` : undefined;
                      return (
                        <div key={i} className={`month-day ${!day ? "other" : ""} ${isT ? "today-cell" : ""}`}
                          style={heatBg ? { background: heatBg } : {}}
                          onClick={() => { if (day) { setViewDate(day); setView("day"); } }}>
                          {day && <div className="month-day-num">{isT ? <span className="today-circle">{day.getDate()}</span> : day.getDate()}</div>}
                          {heat > 0.6 && day && <div className="month-heat-bar" style={{ width: `${Math.round(heat * 100)}%` }} />}
                          <div className="month-day-events">
                            {de.slice(0, 4).map(e => {
                              const cal = CALENDARS.find(c => c.id === e.calendar);
                              const color = e.color || cal?.color || "#FF7BAC";
                              return (
                                <div key={e.id} className="month-event-row" style={{ background: `${color}20`, borderLeft: `2px solid ${color}`, color: "var(--text)" }}
                                  onClick={ev => { ev.stopPropagation(); setSelectedEvent(e); }}>
                                  <span className="month-event-time">{e.start.getHours()}:{String(e.start.getMinutes()).padStart(2,"0")}</span>
                                  <span className="month-event-name">{e.title}</span>
                                </div>
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
            <TaskPanel tasks={tasks} categories={CATEGORIES} onToggle={toggleTask} onAdd={addTask} onStartPomodoro={pomodoro.start} scope={taskScope} setScope={setTaskScope} />
          </div>
        </>)}
        </div>
      </div>

      {pomodoro.state.active && <PomodoroWidget state={pomodoro.state} tasks={tasks} onPause={pomodoro.pause} onResume={pomodoro.resume} onStop={pomodoro.stop} />}
      {undoStack.length > 0 && <button className="undo-btn" onClick={undo}>↩ Undo <kbd>⌘Z</kbd></button>}

      {showSearch && <SearchModal events={expandedEvents} tasks={tasks} onClose={() => setShowSearch(false)} onEventClick={setSelectedEvent} onTaskEdit={setSelectedEvent} onNavigate={d => { setViewDate(new Date(d)); setView("day"); }} />}
      {showGcalModal && <GcalModal onClose={() => setShowGcalModal(false)} onImport={evs => { evs.forEach(ev => addEvent(ev)); setShowGcalModal(false); }} viewDate={viewDate} />}
      {quickAddDate  && <AddEventModal onClose={() => setQuickAddDate(null)} onSave={ev => { addEvent(ev); setQuickAddDate(null); }} defaultDate={quickAddDate} />}
      {showAddEvent  && <AddEventModal onClose={() => setShowAddEvent(false)} onSave={addEvent} defaultDate={viewDate} />}
      {selectedEvent && <EventModal event={selectedEvent} calendars={CALENDARS} categories={CATEGORIES} onClose={() => setSelectedEvent(null)} onSave={saveEvent} onDelete={deleteEvent} />}
      {showStats  && <StatsCard events={events} tasks={tasks} streak={streak} onClose={() => setShowStats(false)} />}
      {showCarryOver && <CarryOverPrompt tasks={tasks.filter(t => !t.done && t.scope === "day")} onCarry={handleCarryOver} onDrop={handleDrop} onDismiss={() => setShowCarryOver(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} workStart={workStart} setWorkStart={setWorkStart} workEnd={workEnd} setWorkEnd={setWorkEnd} notifs={notifs} setNotifs={setNotifs} timezone={timezone} setTimezone={setTimezone} user={auth.user} onSignOut={auth.signOut} />}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="templates-panel" onClick={e => e.stopPropagation()}>
            <div className="templates-header"><span className="templates-title">🗂 Day Templates</span><button className="modal-close" onClick={() => setShowTemplates(false)}>✕</button></div>
            <div className="templates-desc">Apply a schedule pattern to today. Flexible events will be replaced.</div>
            {DAY_TEMPLATES.map(tpl => (
              <button key={tpl.id} className="template-btn" onClick={() => applyTemplate(tpl)}>
                {tpl.label}
                <div className="tpl-events">{tpl.events.map(e => e.title).join(" · ")}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {chatOpen && <ChatPanel events={events} tasks={tasks} onClose={() => setChatOpen(false)} onUpdateEvents={setEvents} onUpdateTasks={setTasks} onAddEvent={addEvent} />}

      {/* Mobile bottom nav — visible only on small screens */}
      <div className="mobile-nav">
        <button className="mobile-nav-btn" onClick={() => { setPage("calendar"); setView("day"); }}>☀️<span>Day</span></button>
        <button className="mobile-nav-btn" onClick={() => { setPage("calendar"); setView("week"); }}>🗓️<span>Week</span></button>
        <button className="mobile-nav-btn" onClick={() => setPage("journal")}>📔<span>Journal</span></button>
        <button className="mobile-nav-btn" onClick={() => { setTaskScope("day"); document.querySelector(".task-panel")?.classList.toggle("mobile-open"); }}>✅<span>Tasks</span></button>
        <button className="mobile-nav-btn" onClick={() => setSettingsOpen(true)}>⚙️<span>More</span></button>
      </div>

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

function appCSS(cvars, fontScale) { return `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Inconsolata:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{${cvars}--mint:#B8F0E0;--radius:16px;--font:'Nunito',sans-serif;--mono:'Inconsolata',monospace;--shadow:0 2px 16px rgba(0,0,0,0.08);--shadow-md:0 4px 24px rgba(0,0,0,0.12);--fs:${fontScale};--accent-rgb:255,123,172;}
  body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:calc(var(--fs)*14px);overflow:hidden;height:100vh;}
  .app{display:flex;height:100vh;overflow:hidden;}
  .sidebar{width:230px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;transition:width .25s ease;overflow:hidden;}
  .sidebar.closed{width:0;}
  .sidebar-logo{padding:20px;border-bottom:1px solid var(--border);font-size:20px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px;}
  .sidebar-logo .logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:16px;}
  .sidebar-logo span{color:var(--accent);}
  .sidebar-date{padding:14px 20px;font-family:var(--mono);font-size:11px;color:var(--text2);border-bottom:1px solid var(--border);background:var(--bg3);}
  .sidebar-date .date-big{font-size:30px;font-weight:900;font-family:var(--font);background:linear-gradient(135deg,var(--accent),#C060A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px;}
  .sidebar-user{margin-top:6px;font-size:10px;color:var(--text3);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  /* mood-bar used by journal mood display in sidebar */
  .mood-bar{padding:10px 20px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px;cursor:pointer;}
  .mood-bar:hover{background:var(--bg3);}.sidebar-nav{padding:12px 10px;flex:1;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;cursor:pointer;font-size:13px;font-weight:700;color:var(--text2);transition:all .2s;margin-bottom:3px;}
  .nav-item:hover{background:var(--bg3);color:var(--text);}
  .nav-item.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent3);}
  .nav-icon{font-size:16px;width:22px;text-align:center;}
  .sidebar-cals{padding:12px 20px 16px;border-top:1px solid var(--border);}
  .cal-label{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);margin-bottom:10px;}
  .cal-item{display:flex;align-items:center;font-size:12px;color:var(--text2);margin-bottom:8px;font-weight:600;}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
  .topbar{height:58px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:7px;background:var(--bg2);flex-shrink:0;box-shadow:var(--shadow);}
  .topbar-btn{height:34px;padding:0 10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg3);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-family:var(--font);gap:5px;transition:all .15s;white-space:nowrap;flex-shrink:0;}
  .topbar-btn:hover{background:var(--bg4);color:var(--accent);border-color:var(--accent3);}
  .topbar-btn.icon-only{width:34px;padding:0;}
  .topbar-date{font-size:14px;font-weight:800;flex:1;color:var(--text);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .add-event-btn{background:linear-gradient(135deg,var(--accent),var(--accent2))!important;color:white!important;border-color:var(--accent)!important;font-weight:800!important;}
  .nav-arrow{font-size:18px;font-weight:900;color:var(--text2);}
  .today-btn{font-size:12px;font-weight:800;padding:0 12px;}
  .today-badge{color:var(--accent);font-weight:700;font-size:11px;margin-left:6px;background:var(--bg4);padding:2px 7px;border-radius:20px;}
  .view-tabs{display:flex;gap:3px;background:var(--bg3);padding:3px;border-radius:12px;border:1px solid var(--border);}
  .view-tab{padding:5px 12px;border-radius:9px;border:none;background:transparent;color:var(--text2);font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;}
  .view-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);}
  .stats-bar{display:flex;gap:8px;padding:8px 16px;border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0;overflow-x:auto;}
  .stat{font-size:11px;font-family:var(--mono);color:var(--text2);display:flex;align-items:center;gap:6px;background:var(--bg3);padding:5px 10px;border-radius:20px;border:1px solid var(--border);white-space:nowrap;}
  .stat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  .content-area{flex:1;display:flex;overflow:hidden;}
  .calendar-pane{flex:1;overflow-y:auto;padding:16px 20px;min-width:0;display:flex;flex-direction:column;}
  .calendar-pane.view-month,.calendar-pane.view-week{padding:0;}
  .calendar-pane::-webkit-scrollbar{width:4px;}
  .calendar-pane::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .day-view{position:relative;}
  .drag-hint{font-size:calc(var(--fs)*10px);color:var(--text3);font-family:var(--mono);padding:0 0 10px 54px;}
  .conflict-banner{background:#FFF0F0;border:1px solid #FFB0B0;border-radius:10px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#C04040;font-weight:700;}
  .day-grid{position:relative;}
  .hour-row{position:absolute;left:0;right:0;display:flex;align-items:flex-start;pointer-events:none;}
  .hour-label{width:46px;font-family:var(--mono);font-size:10px;color:var(--text3);flex-shrink:0;margin-top:-6px;text-align:right;padding-right:8px;line-height:1;}
  .hour-line{flex:1;height:1px;background:var(--border);}
  .drop-indicator{position:absolute;left:0;right:0;display:flex;align-items:center;z-index:15;pointer-events:none;}
  .drop-indicator-dot{width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-left:38px;}
  .drop-indicator-line{flex:1;height:2px;background:var(--accent);opacity:.8;}
  .drop-indicator-label{font-size:10px;font-family:var(--mono);color:var(--accent);font-weight:700;margin-left:6px;background:var(--bg2);padding:1px 5px;border-radius:4px;border:1px solid var(--accent3);flex-shrink:0;}
  .task-drag-handle{cursor:grab;font-size:13px;color:var(--text3);padding:0 4px 0 0;flex-shrink:0;opacity:.5;transition:opacity .15s;}
  .task-item:hover .task-drag-handle{opacity:1;color:var(--accent);}
  .task-item[draggable="true"]{cursor:grab;}
  .task-item[draggable="true"]:active{opacity:.7;}
  .now-line{position:absolute;left:0;right:0;display:flex;align-items:center;z-index:10;pointer-events:none;}
  .now-dot{width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0;box-shadow:0 0 0 3px rgba(255,123,172,.25);}
  .now-track{flex:1;height:1.5px;background:var(--accent);opacity:.6;}
  .events-layer{position:absolute;left:54px;right:0;top:0;}
  .event-block{position:absolute;left:0;right:4px;padding:6px 10px;border-radius:12px;transition:transform .15s,box-shadow .15s;box-shadow:var(--shadow);user-select:none;display:flex;flex-direction:column;justify-content:center;overflow:hidden;}
  .event-block.draggable:hover{transform:translateX(2px) scale(1.01);box-shadow:var(--shadow-md);z-index:20;}
  .event-block.draggable:active{cursor:grabbing!important;opacity:.85;}
  .drag-handle{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--text3);opacity:0;transition:opacity .15s;pointer-events:none;}
  .event-block.draggable:hover .drag-handle{opacity:1;}
  .fixed-badge{position:absolute;right:6px;top:5px;font-size:9px;opacity:.6;}
  .event-title{font-size:calc(var(--fs)*12.5px);font-weight:800;line-height:1.25;word-break:break-word;overflow-wrap:break-word;}
  .event-inline{display:flex;align-items:center;gap:6px;overflow:hidden;}
  .event-inline .event-title{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .event-inline .event-time{flex-shrink:0;margin-top:0;white-space:nowrap;}
  .event-time{font-size:calc(var(--fs)*10.5px);font-family:var(--mono);color:var(--text2);margin-top:2px;font-weight:600;}
  .event-cat{font-size:calc(var(--fs)*10px);margin-top:3px;font-weight:700;}
  /* ── Week Timetable ── */
  .week-timetable{display:flex;flex-direction:column;min-width:0;}
  .wt-header{display:flex;border-bottom:1.5px solid var(--border);background:var(--bg2);position:sticky;top:0;z-index:10;}
  .wt-time-gutter{width:48px;flex-shrink:0;}
  .wt-day-header{flex:1;text-align:center;padding:8px 4px;cursor:pointer;border-left:1px solid var(--border);transition:background .15s;}
  .wt-day-header:hover{background:var(--bg3);}
  .wt-day-header.wt-today{background:var(--bg4);}
  .wt-day-name{display:block;font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700;}
  .wt-day-num{display:block;font-size:20px;font-weight:900;color:var(--text2);margin-top:2px;}
  .wt-day-header.wt-today .wt-day-num{color:var(--accent);}
  .wt-today-num{color:var(--accent)!important;}
  .wt-grid{position:relative;display:block;}
  .wt-hour-row{position:absolute;left:0;right:0;display:flex;height:${HOUR_H}px;align-items:flex-start;}
  .wt-hour-label{font-family:var(--mono);font-size:10px;color:var(--text3);padding-right:6px;line-height:1;}
  .wt-time-gutter{width:48px;flex-shrink:0;display:flex;align-items:flex-start;justify-content:flex-end;padding-top:6px;}
  .wt-hour-cell{flex:1;border-left:1px solid var(--border);border-top:1px solid var(--border);height:${HOUR_H}px;}
  .wt-now-line{position:absolute;left:0;right:0;display:flex;align-items:center;z-index:8;pointer-events:none;}
  .wt-now-track-cell{flex:1;height:1.5px;background:var(--accent);opacity:.7;}
  .wt-event{position:absolute;border-radius:6px;padding:3px 6px;cursor:pointer;overflow:hidden;transition:opacity .15s;z-index:5;}
  .wt-event:hover{opacity:.85;z-index:9;}
  .wt-event-title{font-size:11px;font-weight:800;line-height:1.25;word-break:break-word;}
  .wt-event-time{font-size:10px;font-family:var(--mono);color:var(--text2);margin-top:1px;}
  .wt-event-cat{font-size:10px;margin-top:1px;}
  /* ── Month View ── */
  .month-view{display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid var(--border);border-left:1px solid var(--border);flex:1;}
  .month-header{background:var(--bg3);padding:8px;text-align:center;font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-weight:700;border-right:1px solid var(--border);border-bottom:1px solid var(--border);}
  .month-day{background:var(--bg2);min-height:110px;padding:6px;cursor:pointer;border-right:1px solid var(--border);border-bottom:1px solid var(--border);transition:background .1s;display:flex;flex-direction:column;gap:2px;}
  .month-day:hover{background:var(--bg3);}
  .month-day.other{opacity:.35;pointer-events:none;}
  .month-day.today-cell{background:var(--bg3);}
  .month-day-num{font-size:12px;font-family:var(--mono);color:var(--text2);font-weight:700;margin-bottom:3px;min-height:20px;}
  .today-circle{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--accent);color:white;font-size:11px;font-weight:800;}
  .month-day-events{display:flex;flex-direction:column;gap:2px;flex:1;min-height:0;}
  .month-event-row{display:flex;align-items:center;gap:4px;padding:2px 5px;border-radius:4px;font-size:10px;font-weight:700;overflow:hidden;white-space:nowrap;cursor:pointer;transition:opacity .15s;}
  .month-event-row:hover{opacity:.75;}
  .month-event-time{font-family:var(--mono);font-size:9px;color:var(--text3);flex-shrink:0;}
  .month-event-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .month-more{font-size:10px;color:var(--accent);font-family:var(--mono);font-weight:700;padding:1px 4px;}
  .task-panel{width:295px;border-left:1px solid var(--border);background:var(--bg2);display:flex;flex-direction:row;flex-shrink:0;overflow:hidden;transition:width .25s ease;position:relative;}
  .task-panel.collapsed{width:28px;}
  .task-panel-toggle{width:28px;flex-shrink:0;background:var(--bg3);border:none;border-right:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;transition:background .15s, color .15s;padding:0;}
  .task-panel-toggle:hover{background:var(--bg4);color:var(--accent);}
  .task-panel-inner{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
  .panel-header{padding:14px 14px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;flex-shrink:0;background:var(--bg3);}
  .panel-title{font-size:15px;font-weight:900;flex:1;color:var(--text);}
  .urgent-badge{background:#FFE0E0;color:#C04040;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:800;}
  .scope-tabs{display:flex;gap:2px;background:var(--bg4);padding:2px;border-radius:8px;}
  .scope-tab{padding:3px 9px;border-radius:6px;border:none;background:transparent;font-family:var(--font);font-size:10px;font-weight:800;color:var(--text3);cursor:pointer;text-transform:capitalize;transition:all .15s;}
  .scope-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);}
  .add-btn{width:28px;height:28px;border-radius:8px;border:1.5px solid var(--accent3);background:var(--bg4);color:var(--accent);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;transition:all .15s;}
  .add-btn:hover{background:var(--accent);color:white;border-color:var(--accent);}
  .task-form{padding:12px 14px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px;background:var(--bg3);}
  .tf-input{width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-family:var(--font);font-size:13px;color:var(--text);outline:none;font-weight:600;}
  .tf-input:focus{border-color:var(--accent3);}
  .tf-notes{resize:none;font-size:12px;}
  .tf-row{display:flex;gap:6px;}
  .tf-select{flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;cursor:pointer;font-weight:600;}
  .tf-duration{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;font-weight:600;}
  .tf-num{width:44px;background:transparent;border:none;font-family:var(--mono);font-size:13px;color:var(--text);outline:none;text-align:center;}
  .tf-date{font-size:12px;flex:1;}
  .tf-actions{display:flex;gap:6px;justify-content:flex-end;}
  .tf-cancel{padding:7px 14px;background:transparent;border:1.5px solid var(--border);border-radius:10px;color:var(--text2);font-family:var(--font);font-size:12px;cursor:pointer;font-weight:700;}
  .tf-save{padding:7px 16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:10px;color:white;font-family:var(--font);font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(255,123,172,.35);}
  .task-list{flex:1;overflow-y:auto;padding:8px;}
  .task-list::-webkit-scrollbar{width:3px;}
  .task-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .empty-state{padding:28px 16px;text-align:center;color:var(--text3);font-size:12px;font-weight:700;}
  .empty-state::before{content:"🌸";display:block;font-size:24px;margin-bottom:8px;}
  .task-item{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:12px;transition:all .15s;margin-bottom:3px;border:1.5px solid transparent;}
  .task-item:hover{background:var(--bg3);border-color:var(--border);}
  .task-item.done{opacity:.45;}
  .task-check{width:19px;height:19px;border-radius:6px;border:2px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;margin-top:1px;background:transparent;transition:all .15s;cursor:pointer;}
  .task-item:not(.done):hover .task-check{border-color:var(--accent3);}
  .task-item.done .task-check{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:var(--accent);}
  .task-body{flex:1;min-width:0;cursor:pointer;}
  .task-title{font-size:calc(var(--fs)*13px);font-weight:700;line-height:1.3;margin-bottom:4px;color:var(--text);}
  .task-item.done .task-title{text-decoration:line-through;}
  .task-meta{display:flex;gap:8px;font-size:calc(var(--fs)*10px);font-family:var(--mono);color:var(--text3);flex-wrap:wrap;}
  .deadline{color:var(--accent)!important;font-weight:700;}
  .task-notes{margin-top:6px;font-size:11px;color:var(--text2);background:var(--bg3);border-radius:8px;padding:6px 10px;line-height:1.4;}
  .pomo-btn{width:26px;height:26px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg3);color:var(--accent);font-size:13px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s;}
  .pomo-btn:hover{background:var(--accent);color:white;}
  .task-footer{padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;background:var(--bg3);font-size:11px;font-family:var(--mono);color:var(--text3);font-weight:600;}
  .chat-panel{position:fixed;bottom:86px;right:24px;width:360px;height:520px;background:var(--bg2);border:1.5px solid var(--border);border-radius:20px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(255,123,172,.2);z-index:100;animation:slideUp .22s cubic-bezier(.34,1.56,.64,1);overflow:hidden;}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  .chat-header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:linear-gradient(135deg,#FFF0F6,#FFF8FC);}
  .chat-title-row{display:flex;align-items:center;gap:10px;}
  .chat-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:16px;}
  .chat-name{font-size:13px;font-weight:800;color:var(--text);}
  .chat-status{font-size:10px;font-family:var(--mono);color:#50C090;font-weight:600;}
  .chat-close{background:var(--bg4);border:1px solid var(--border);color:var(--text2);font-size:12px;cursor:pointer;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;}
  .chat-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg);}
  .chat-messages::-webkit-scrollbar{width:3px;}
  .chat-msg{display:flex;gap:8px;align-items:flex-start;}
  .chat-msg.user{flex-direction:row-reverse;}
  .msg-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:13px;}
  .msg-bubble{max-width:80%;padding:10px 14px;border-radius:16px;font-size:calc(var(--fs)*13px);line-height:1.55;font-weight:600;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-bottom-left-radius:4px;}
  .chat-msg.user .msg-bubble{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border:none;border-bottom-right-radius:4px;border-bottom-left-radius:16px;}
  .suggestions{padding:0 12px 10px;display:flex;flex-wrap:wrap;gap:6px;background:var(--bg);}
  .suggestion-pill{padding:6px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text2);font-family:var(--font);font-size:11px;cursor:pointer;transition:all .15s;font-weight:700;}
  .suggestion-pill:hover{border-color:var(--accent3);color:var(--accent);background:var(--bg4);}
  .chat-input-row{padding:10px 12px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end;flex-shrink:0;background:var(--bg2);}
  .chat-input{flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:9px 14px;font-family:var(--font);font-size:13px;color:var(--text);outline:none;resize:none;min-height:40px;max-height:100px;line-height:1.4;font-weight:600;}
  .chat-input:focus{border-color:var(--accent3);}
  .chat-input::placeholder{color:var(--text3);}
  .chat-send{width:40px;height:40px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;box-shadow:0 4px 12px rgba(255,123,172,.4);}
  .chat-send:hover:not(:disabled){transform:scale(1.05);}
  .chat-send:disabled{opacity:.4;cursor:not-allowed;transform:none;}
  .chat-fab{position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;font-size:22px;cursor:pointer;box-shadow:0 8px 28px rgba(255,123,172,.45);z-index:100;display:flex;align-items:center;justify-content:center;transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .15s;}
  .chat-fab:hover{transform:scale(1.1);}
  .modal-overlay{position:fixed;inset:0;background:rgba(74,40,64,.25);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease;}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  .modal{width:420px;max-width:calc(100vw - 32px);background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(255,123,172,.18);overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  @keyframes popIn{from{opacity:0;transform:scale(.93) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);}}
  .modal-header{padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#FFF0F6,#FFF8FC);}
  .modal-title-input{flex:1;font-size:16px;font-weight:800;color:var(--text);background:transparent;border:none;outline:none;font-family:var(--font);}
  .modal-close{background:var(--bg4);border:1px solid var(--border);color:var(--text2);font-size:12px;cursor:pointer;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .modal-close:hover{background:var(--accent);color:white;}
  .modal-body{padding:16px 20px;display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto;}
  .modal-row{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--text2);}
  .modal-col{flex-direction:column;align-items:flex-start;}
  .modal-row label{width:80px;flex-shrink:0;font-size:12px;}
  .modal-select{flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;cursor:pointer;font-weight:600;}
  .modal-textarea{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;resize:none;font-weight:600;line-height:1.5;}
  .modal-time{font-family:var(--mono);font-size:13px;padding:5px 8px;min-width:0;flex:1;color:var(--text);}
  .color-picker{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
  .color-dot{width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all .15s;}
  .color-dot:hover{transform:scale(1.15);}
  .color-dot.selected{border-color:var(--text);transform:scale(1.1);}
  .color-reset{background:var(--bg3);font-size:12px;display:flex;align-items:center;justify-content:center;color:var(--text2);}
  .modal-footer{padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--bg3);}
  .modal-delete{background:transparent;border:1.5px solid #FFB0B0;color:#C04040;border-radius:10px;padding:7px 14px;font-family:var(--font);font-size:12px;cursor:pointer;font-weight:700;}
  .modal-delete:hover{background:#FFF0F0;}
  .pomo-widget{position:fixed;bottom:86px;right:390px;background:var(--bg2);border:1.5px solid var(--border);border-radius:20px;padding:16px;box-shadow:var(--shadow-md);width:190px;animation:slideUp .22s cubic-bezier(.34,1.56,.64,1);}
  .pomo-header{display:flex;align-items:center;margin-bottom:8px;}
  .pomo-mode{font-size:13px;font-weight:800;flex:1;color:var(--accent);}
  .pomo-cycles{font-size:11px;font-family:var(--mono);color:var(--text3);margin-right:8px;}
  .pomo-stop{background:var(--bg4);border:1px solid var(--border);color:var(--text2);width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;}
  .pomo-task{font-size:11px;color:var(--text2);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:10px;}
  .pomo-ring-wrap{position:relative;width:80px;height:80px;margin:0 auto 10px;}
  .pomo-ring{width:80px;height:80px;}
  .pomo-time{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;font-family:var(--mono);color:var(--text);}
  .pomo-controls{display:flex;justify-content:center;}
  .pomo-btn-ctrl{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;border-radius:20px;padding:6px 18px;font-family:var(--font);font-size:12px;font-weight:800;cursor:pointer;}
  .stats-card{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);width:380px;max-width:calc(100vw - 32px);padding:20px;box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .stats-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .stats-title{font-size:16px;font-weight:900;color:var(--text);}
  .stats-streak{font-size:20px;font-weight:800;color:var(--accent);margin-bottom:16px;}
  .stats-row{display:flex;gap:12px;margin-bottom:20px;}
  .stat-big{flex:1;background:var(--bg3);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);}
  .stat-num{font-size:22px;font-weight:900;color:var(--accent);}
  .stat-lbl{font-size:10px;color:var(--text3);font-family:var(--mono);font-weight:600;margin-top:2px;}
  .stats-bars{display:flex;flex-direction:column;gap:8px;}
  .stats-bar-row{display:flex;align-items:center;gap:8px;}
  .stats-bar-label{width:80px;font-size:11px;color:var(--text2);font-weight:600;flex-shrink:0;}
  .stats-bar-track{flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;}
  .stats-bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
  .stats-bar-val{width:32px;font-size:10px;font-family:var(--mono);color:var(--text3);text-align:right;flex-shrink:0;}
  .carryover-card{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);padding:20px;width:360px;max-width:calc(100vw - 32px);box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .carryover-title{font-size:14px;font-weight:800;color:var(--text);margin-bottom:14px;}
  .carryover-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
  .carryover-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text);font-weight:600;cursor:pointer;}
  .carryover-item input{accent-color:var(--accent);}
  .co-dur{margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--text3);}
  .carryover-actions{display:flex;gap:8px;justify-content:flex-end;}
  .focus-overlay{position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn .3s ease;background:var(--bg);}
  .focus-exit{position:absolute;top:20px;right:20px;background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;padding:8px 16px;font-family:var(--font);font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;}
  .focus-content{display:flex;flex-direction:column;align-items:center;gap:20px;max-width:400px;width:100%;padding:20px;}
  .focus-logo{font-size:32px;font-weight:900;color:var(--accent);}
  .focus-date{font-size:14px;color:var(--text2);font-family:var(--mono);}
  .focus-idle{text-align:center;}
  .focus-idle-msg{font-size:22px;font-weight:800;color:var(--text);margin-bottom:8px;}
  .focus-next{font-size:13px;color:var(--text2);font-family:var(--mono);}
  .focus-tasks{width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:16px;}
  .focus-tasks-title{font-size:12px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;}
  .focus-task-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;}
  .focus-task-row:last-child{border-bottom:none;}
  .focus-task-name{flex:1;font-weight:700;color:var(--text);}
  .focus-task-dur{font-size:11px;font-family:var(--mono);color:var(--text3);}
  .focus-start-btn{width:28px;height:28px;border-radius:8px;background:var(--accent);border:none;color:white;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
  .shortcuts-modal{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);width:340px;max-width:calc(100vw - 32px);overflow:hidden;box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .shortcuts-grid{padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .shortcut-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2);font-weight:600;}
  .kbd{background:var(--bg4);border:1.5px solid var(--border);border-radius:6px;padding:2px 7px;font-family:var(--mono);font-size:11px;color:var(--text);font-weight:700;}
  .settings-overlay{position:fixed;inset:0;background:rgba(74,40,64,.18);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease;}
  .settings-panel{width:420px;max-width:calc(100vw - 32px);background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(255,123,172,.18);overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .settings-header{padding:20px 22px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#FFF0F6,#FFF8FC);}
  .settings-title-row{display:flex;align-items:center;gap:10px;}
  .settings-title{font-size:16px;font-weight:900;color:var(--text);}
  .settings-close{width:28px;height:28px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg4);color:var(--text2);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
  .settings-close:hover{background:var(--accent);color:white;}
  .settings-body{padding:16px;display:flex;flex-direction:column;gap:4px;max-height:70vh;overflow-y:auto;}
  .settings-section{padding:16px;border-radius:16px;background:var(--bg3);border:1.5px solid var(--border);margin-bottom:8px;}
  .settings-section-label{font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px;}
  .settings-section-desc{font-size:11px;color:var(--text2);margin-bottom:14px;font-weight:600;line-height:1.4;}
  .toggle-row{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:var(--text2);}
  .toggle{width:44px;height:24px;border-radius:12px;background:var(--border);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
  .toggle.on{background:var(--accent);}
  .toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:white;transition:transform .2s;box-shadow:0 2px 4px rgba(0,0,0,.2);}
  .toggle.on .toggle-thumb{transform:translateX(20px);}
  .work-hours-row{display:flex;gap:20px;}
  .work-hours-row label{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);font-weight:600;}
  .wh-input{width:40px!important;}
  .signout-btn{padding:8px 16px;background:transparent;border:1.5px solid #FFB0B0;border-radius:10px;color:#C04040;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;}
  .signout-btn:hover{background:#FFF0F0;}
  .font-size-preview{background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px;display:flex;flex-direction:column;gap:5px;min-height:60px;justify-content:center;}
  .font-size-options{display:flex;gap:6px;margin-bottom:14px;}
  .font-size-btn{flex:1;padding:10px 6px;border-radius:12px;border:2px solid var(--border);background:var(--bg2);cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:var(--font);}
  .font-size-btn:hover{border-color:var(--accent3);background:var(--bg4);}
  .font-size-btn.active{border-color:var(--accent);background:var(--bg4);}
  .fsb-label{font-size:15px;font-weight:900;color:var(--text);}
  .font-size-btn.active .fsb-label{color:var(--accent);}
  .fsb-desc{font-size:9px;color:var(--text3);font-weight:700;white-space:nowrap;}
  .font-size-slider-row{display:flex;align-items:center;gap:10px;}
  .fsr-a{font-size:11px;color:var(--text3);font-weight:700;font-family:var(--mono);}
  .fsr-A{font-size:18px;color:var(--text2);font-weight:700;font-family:var(--mono);}
  .font-slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:4px;outline:none;cursor:pointer;background:linear-gradient(to right,var(--accent) 0%,var(--accent3) 100%);}
  .font-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:white;border:2.5px solid var(--accent);cursor:pointer;}
  /* ── Month heat map ─────────────────────────────────────────────────────────── */
  .month-heat-bar{position:absolute;bottom:0;left:0;height:3px;background:var(--accent);opacity:0.5;border-radius:0 0 0 0;pointer-events:none;}
  .month-day{position:relative;}

  /* ── Search modal ───────────────────────────────────────────────────────────── */
  .search-overlay{align-items:flex-start!important;padding-top:80px;}
  .search-modal{width:580px;max-width:calc(100vw - 32px);background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;animation:popIn .18s cubic-bezier(.34,1.56,.64,1);}
  .search-input-row{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border);}
  .search-icon{font-size:18px;flex-shrink:0;}
  .search-input{flex:1;background:transparent;border:none;outline:none;font-family:var(--font);font-size:16px;font-weight:700;color:var(--text);}
  .search-input::placeholder{color:var(--text3);}
  .search-clear{background:var(--bg4);border:1px solid var(--border);border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);font-size:11px;}
  .search-results{max-height:480px;overflow-y:auto;}
  .search-results::-webkit-scrollbar{width:3px;}
  .search-results::-webkit-scrollbar-thumb{background:var(--border);}
  .search-section{padding:8px 0;}
  .search-section-title{padding:6px 20px;font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-weight:700;background:var(--bg3);}
  .search-result-row{display:flex;align-items:flex-start;gap:12px;padding:12px 20px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--border);}
  .search-result-row:hover{background:var(--bg3);}
  .search-result-row:last-child{border-bottom:none;}
  .search-result-row.search-done{opacity:.5;}
  .search-result-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .search-result-body{flex:1;min-width:0;}
  .search-result-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;}
  .search-result-meta{font-size:11px;font-family:var(--mono);color:var(--text3);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .search-result-notes{font-size:11px;color:var(--text2);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .search-highlight{background:var(--accent3);color:var(--text);border-radius:2px;padding:0 1px;}
  .search-recurring-badge,.search-done-badge{background:var(--bg4);border-radius:20px;padding:1px 7px;font-size:10px;color:var(--text3);}
  .search-empty{padding:24px 20px;text-align:center;color:var(--text3);font-size:13px;}
  .search-hint{padding:20px;text-align:center;color:var(--text3);font-size:12px;font-family:var(--mono);}

  .undo-btn{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:#4A2840;color:white;border:none;border-radius:20px;padding:8px 20px;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(74,40,64,.3);z-index:99;display:flex;align-items:center;gap:8px;animation:slideUp .2s ease;white-space:nowrap;}
  .undo-btn:hover{background:#6A3860;transform:translateX(-50%) scale(1.03);}
  .undo-btn kbd{background:rgba(255,255,255,.15);padding:1px 6px;border-radius:4px;font-family:var(--mono);font-size:10px;}
  .templates-panel{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);padding:20px;width:340px;max-width:calc(100vw - 32px);box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .templates-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .templates-title{font-size:15px;font-weight:900;color:var(--text);}
  .templates-desc{font-size:12px;color:var(--text2);margin-bottom:16px;}
  .template-btn{width:100%;padding:14px;border-radius:14px;border:1.5px solid var(--border);background:var(--bg3);text-align:left;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;transition:all .15s;}
  .template-btn:hover{border-color:var(--accent3);background:var(--bg4);}
  .tpl-events{font-size:10px;color:var(--text3);margin-top:4px;font-family:var(--mono);}
  @media(max-width:768px){
    .sidebar{display:none;}
    .task-panel{display:none;position:fixed;inset:0;top:auto;height:70vh;z-index:150;border-radius:20px 20px 0 0;box-shadow:0 -8px 40px rgba(255,123,172,.2);width:100%!important;flex-direction:column;}
    .task-panel.mobile-open{display:flex;}
    .task-panel-toggle{display:none;}
    .chat-panel{width:calc(100vw - 32px);right:16px;left:16px;bottom:86px;}
    .chat-fab{bottom:80px;}
    .stats-bar{overflow-x:auto;flex-wrap:nowrap;}
    .pomo-widget{right:16px;bottom:140px;}
    .topbar-btn:not(.icon-only){display:none;}
    .mobile-nav{display:flex;}
    .content-area{padding-bottom:64px;}
  }
  .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:var(--bg2);border-top:1.5px solid var(--border);z-index:110;align-items:stretch;}
  .mobile-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:transparent;border:none;color:var(--text2);font-family:var(--font);font-size:18px;cursor:pointer;padding:8px 0;}
  .mobile-nav-btn span{font-size:9px;font-weight:700;color:var(--text3);}
  .mobile-nav-btn:hover{background:var(--bg3);color:var(--accent);}

  /* ── Theme picker ─────────────────────────────────────────────────────────── */
  .theme-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
  .theme-swatch-btn{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px 8px;border-radius:14px;border:2px solid var(--border);background:var(--bg2);cursor:pointer;transition:all .18s;font-family:var(--font);}
  .theme-swatch-btn:hover{border-color:var(--accent3);background:var(--bg4);transform:translateY(-1px);}
  .theme-swatch-btn.active{border-color:var(--accent);background:var(--bg4);box-shadow:0 0 0 3px var(--accent3);}
  .theme-swatch-dots{display:flex;gap:3px;}
  .theme-swatch-dot{width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(0,0,0,.08);flex-shrink:0;}
  .theme-swatch-label{font-size:10px;font-weight:800;color:var(--text2);text-align:center;white-space:nowrap;}
  .theme-swatch-btn.active .theme-swatch-label{color:var(--accent);}
  .theme-swatch-check{position:absolute;top:5px;right:7px;font-size:10px;font-weight:900;color:var(--accent);}

  /* ── Improved nav active state ────────────────────────────────────────────── */
  .nav-item.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent3);border-left:3px solid var(--accent);padding-left:11px;}
  .view-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);border-bottom:2px solid var(--accent);}
  .scope-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);border-bottom:2px solid var(--accent);}

  /* ── Event block text legibility overlay ─────────────────────────────────── */
  .event-block::before{content:"";position:absolute;inset:0;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.06) 100%);pointer-events:none;}
  .event-title{position:relative;z-index:1;text-shadow:0 1px 2px rgba(0,0,0,0.10);}
  .event-time{position:relative;z-index:1;}
  .event-cat{position:relative;z-index:1;}

  /* ── High-priority task highlight ────────────────────────────────────────── */
  .task-item[data-priority="high"]:not(.done){border-color:rgba(255,107,138,0.30);background:rgba(255,107,138,0.04);}
  .task-item[data-priority="high"]:not(.done):hover{background:rgba(255,107,138,0.09);border-color:rgba(255,107,138,0.50);}
  .task-check{min-width:22px;min-height:22px;width:22px;height:22px;border-radius:7px;padding:0;}

  /* ── Conflict banner dark-mode safe ──────────────────────────────────────── */
  .conflict-banner{background:rgba(255,100,100,0.12);border:1px solid rgba(255,100,100,0.35);border-radius:10px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#E05050;font-weight:700;}

  /* ── Topbar date event count pill ────────────────────────────────────────── */
  .topbar-date span{color:var(--text2);font-weight:700;font-size:11px;margin-left:6px;background:var(--bg4);padding:2px 8px;border-radius:20px;border:1px solid var(--border);}

  /* ── Calendar sidebar toggles ── */
  .cal-label-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
  .cal-toggleable{cursor:pointer;transition:opacity .15s;border-radius:8px;padding:5px 6px;margin:-2px -6px;gap:8px;}
  .cal-toggleable:hover{background:var(--bg3);}
  .cal-hidden{opacity:.45;}
  .cal-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:background .2s;}
  .cal-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600;color:var(--text2);}
  .cal-eye{font-size:10px;color:var(--text3);flex-shrink:0;}
  .gcal-connect-btn{width:100%;margin-top:10px;padding:8px 10px;background:var(--bg3);border:1.5px dashed var(--border);border-radius:10px;font-family:var(--font);font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;}
  .gcal-connect-btn:hover{border-color:#4285F4;color:#4285F4;background:var(--bg4);}
  /* ── Google Calendar modal ── */
  .gcal-modal{width:520px;}
  .gcal-step-title{font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px;}
  .gcal-steps-list{display:flex;flex-direction:column;gap:8px;margin-bottom:14px;}
  .gcal-step-row{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--text2);font-weight:600;line-height:1.4;}
  .gcal-step-num{min-width:22px;height:22px;border-radius:50%;background:var(--accent);color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
  .gcal-note{background:var(--bg3);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--text3);font-weight:600;line-height:1.5;}
  .gcal-paste-area{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:10px 12px;font-family:var(--mono);font-size:11px;color:var(--text);resize:vertical;min-height:160px;outline:none;}
  .gcal-paste-area:focus{border-color:var(--accent3);}
  .gcal-preview-list{max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:12px;}
  .gcal-preview-list::-webkit-scrollbar{width:3px;}
  .gcal-preview-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--bg3);cursor:pointer;transition:background .1s;}
  .gcal-preview-row:hover{background:var(--bg4);}
  .gcal-preview-row input{accent-color:#4285F4;flex-shrink:0;}
  .gcal-preview-info{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .gcal-preview-title{font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .gcal-preview-time{font-size:10px;font-family:var(--mono);color:var(--text3);font-weight:600;}
  .gcal-select-row{display:flex;gap:6px;align-items:center;}
  .nav-section-label{font-size:9px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-weight:700;padding:4px 14px 2px;}

  /* ── Journal Page ────────────────────────────────────────────────────────── */
  .journal-page{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:0;background:var(--bg);}
  .journal-page::-webkit-scrollbar{width:4px;}
  .journal-page::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .journal-header{display:flex;align-items:center;gap:12px;padding:16px 20px 12px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;}
  .journal-title{font-size:18px;font-weight:900;color:var(--text);flex:1;}
  .journal-streak{font-size:13px;font-weight:700;color:var(--accent);background:var(--bg4);padding:4px 10px;border-radius:20px;}
  .journal-today-btn{font-size:12px;padding:7px 14px;white-space:nowrap;}
  .mood-stats-bar{display:flex;align-items:center;gap:8px;padding:10px 20px;background:var(--bg2);border-bottom:1px solid var(--border);overflow-x:auto;flex-shrink:0;}
  .mood-stat-pill{display:flex;align-items:center;gap:4px;background:var(--bg3);border:1.5px solid var(--border);border-radius:20px;padding:4px 10px;font-size:13px;flex-shrink:0;}
  .mood-stat-count{font-size:11px;font-weight:800;color:var(--text2);font-family:var(--mono);}
  .mood-stats-month{margin-left:auto;font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:600;flex-shrink:0;}

  /* Mood Calendar */
  .journal-cal-section{padding:16px 20px;background:var(--bg2);border-bottom:1px solid var(--border);}
  .journal-cal-nav{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
  .journal-cal-month{font-size:14px;font-weight:800;color:var(--text);flex:1;text-align:center;}
  .journal-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
  .jcal-dow{text-align:center;font-size:9px;font-family:var(--mono);text-transform:uppercase;color:var(--text3);font-weight:700;padding:4px 0;}
  .jcal-empty{aspect-ratio:1;}
  .jcal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:12px;border:none;background:var(--bg3);cursor:pointer;transition:all .15s;padding:2px;}
  .jcal-day:hover:not(.jcal-future){background:var(--bg4);transform:scale(1.05);}
  .jcal-today{background:var(--bg4);box-shadow:0 0 0 2px var(--accent);}
  .jcal-future{opacity:.3;cursor:default;}
  .jcal-emoji{font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.15));}
  .jcal-dot{width:8px;height:8px;border-radius:50%;background:var(--border);}
  .jcal-today-dot{background:var(--accent);opacity:.6;}
  .jcal-num{font-size:9px;font-family:var(--mono);color:var(--text3);font-weight:700;line-height:1;}

  /* Entry list */
  .journal-entries-section{padding:16px 20px;display:flex;flex-direction:column;gap:10px;}
  .journal-entries-title{font-size:13px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-family:var(--mono);margin-bottom:4px;}
  .journal-entry-card{display:flex;align-items:flex-start;gap:12px;background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:14px;cursor:pointer;transition:all .15s;}
  .journal-entry-card:hover{background:var(--bg3);border-color:var(--accent3);transform:translateY(-1px);box-shadow:var(--shadow);}
  .jec-left{flex-shrink:0;width:36px;text-align:center;}
  .jec-emoji{font-size:28px;line-height:1;}
  .jec-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
  .jec-date{font-size:11px;font-family:var(--mono);color:var(--text3);font-weight:600;}
  .jec-mood{font-size:12px;font-weight:800;}
  .jec-acts{font-size:16px;display:flex;gap:4px;flex-wrap:wrap;}
  .jec-note{font-size:12px;color:var(--text2);line-height:1.4;font-weight:600;}
  .jec-gratitude{font-size:11px;color:var(--text3);font-style:italic;font-weight:600;}
  .jec-arrow{color:var(--text3);font-size:18px;font-weight:700;align-self:center;}
  .journal-empty{display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center;gap:8px;}
  .journal-empty-icon{font-size:48px;}
  .journal-empty-title{font-size:16px;font-weight:800;color:var(--text);}
  .journal-empty-sub{font-size:13px;color:var(--text3);font-weight:600;}

  /* Entry modal */
  .entry-modal{width:500px;max-width:calc(100vw - 32px);max-height:88vh;background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .entry-view-modal{width:480px;max-width:calc(100vw - 32px);max-height:88vh;background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .entry-modal-header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 20px 14px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,var(--bg3),var(--bg2));flex-shrink:0;}
  .entry-modal-date{font-size:16px;font-weight:800;color:var(--text);}
  .entry-modal-sub{font-size:12px;color:var(--text3);font-weight:600;margin-top:2px;}
  .entry-view-mood{font-size:15px;font-weight:800;margin-top:4px;}
  .entry-modal-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;}
  .entry-modal-body::-webkit-scrollbar{width:3px;}
  .entry-modal-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .entry-modal .entry-section,.entry-view-modal .entry-view-section{padding:14px 20px;border-bottom:1px solid var(--border);}
  .entry-section-title{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.2px;color:var(--text3);font-weight:700;margin-bottom:10px;}
  .entry-modal-footer{padding:14px 20px;display:flex;justify-content:flex-end;gap:8px;background:var(--bg3);border-top:1px solid var(--border);flex-shrink:0;}

  /* Mood picker */
  .mood-picker-row{display:flex;gap:8px;justify-content:space-between;}
  .mood-pick-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;border-radius:14px;border:2px solid var(--border);background:var(--bg3);cursor:pointer;transition:all .18s;font-family:var(--font);}
  .mood-pick-btn:hover{border-color:var(--mc,var(--accent));transform:translateY(-2px);}
  .mood-pick-btn.selected{border-color:var(--mc,var(--accent));background:var(--bg4);box-shadow:0 0 0 3px rgba(128,128,128,0.18);outline:2px solid var(--mc,var(--accent));outline-offset:1px;}
  .mp-emoji{font-size:26px;line-height:1;}
  .mp-label{font-size:10px;font-weight:800;color:var(--text2);}

  /* Activities */
  .activity-group{margin-bottom:10px;}
  .activity-group-label{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700;margin-bottom:6px;}
  .activity-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .activity-chip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg3);cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;color:var(--text2);transition:all .15s;}
  .activity-chip:hover{border-color:var(--accent3);color:var(--accent);}
  .activity-chip.selected{background:var(--bg4);border-color:var(--accent);color:var(--accent);}

  /* Gratitude + journal */
  .gratitude-input{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-family:var(--font);font-size:13px;color:var(--text);font-weight:600;outline:none;margin-bottom:7px;display:block;}
  .gratitude-input:focus{border-color:var(--accent3);}
  .gratitude-view-item{font-size:13px;color:var(--text);font-weight:600;padding:5px 0;border-bottom:1px solid var(--border);}
  .journal-prompt{font-size:12px;color:var(--accent);font-weight:700;font-style:italic;margin-bottom:8px;padding:8px 12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--accent);}
  .journal-textarea{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;padding:10px 14px;font-family:var(--font);font-size:13px;color:var(--text);font-weight:600;outline:none;resize:none;line-height:1.6;}
  .journal-textarea:focus{border-color:var(--accent3);}
  .entry-view-note{font-size:13px;color:var(--text);line-height:1.7;font-weight:600;white-space:pre-wrap;}
`; }