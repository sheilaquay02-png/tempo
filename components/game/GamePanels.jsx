"use client";

// Small in-game versions of Today, Tasks and Calendar, shown over the room/town so you stay in the game.
// Like the rest of the game they only READ your data; ticking or adding a task uses the app's own actions.
import { useEffect, useRef, useState } from "react";
import * as Core from "../../lib/tempo/core";
import { TASK_REWARD, STREAK_MAX_BONUS, streakInfo } from "../../lib/game/economy";
import { STORE_CATEGORIES, storeCategory } from "../../lib/game/furniture";

const { TODAY, taskCompletedDateKey, localDateFromKey, taskBelongsToPeriod, expandRecurring, eventOccursOnDay, dayStart, addDaysSafe, sameDay, fmt, fmtDate } = Core;

const TITLES = { today: "🌤️ Today", tasks: "✅ Tasks", calendar: "🗓️ Calendar", store: "🛍️ General Store", storage: "🧺 Your storage", petshop: "🐾 Pet Shop", pets: "🎀 Dress up the dogs", library: "📚 Library · your done diary", townhall: "🏛️ Town Hall · daily streak", bank: "🏦 Blossom Bank" };
const FULL = { today: "Open Today", tasks: "Open all tasks", calendar: "Open full calendar", bank: "Open Budget" };

export function GamePanel({ kind, tasks = [], calendarEvents = [], onToggleTask, onAddTask, onOpenPage, onClose, blossoms = 0, storeItems = [], owned = {}, onBuy, storage = {}, furniture = {}, onPlace, accessories = [], dogs = [], pets = {}, canChange = false, onBuyAccessory, onWear, game = null, names = {} }) {
  const ref = useRef(null);
  // Escape closes the panel (not the game); focus moves into the panel for keyboard users.
  useEffect(() => {
    ref.current?.focus();
    const onKey = e => { if (e.key === "Escape") { e.stopPropagation(); onClose?.(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const todayTasks = tasks.filter(t => taskBelongsToPeriod(t, "day", TODAY));
  const eventsOn = day => expandRecurring(calendarEvents, dayStart(day), addDaysSafe(dayStart(day), 1))
    .filter(e => eventOccursOnDay(e, day))
    .sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || a.start - b.start);

  return (
    <div className="cozy-panel-backdrop" onClick={onClose}>
      <section className="cozy-panel" role="dialog" aria-label={TITLES[kind]} tabIndex={-1} ref={ref} onClick={e => e.stopPropagation()}>
        <header className="cozy-panel-head">
          <strong>{TITLES[kind]}</strong>
          <button className="cozy-panel-x" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="cozy-panel-body">
          {kind === "today" && <TodayBody todayTasks={todayTasks} events={eventsOn(TODAY)} onToggleTask={onToggleTask} />}
          {kind === "tasks" && <TasksBody todayTasks={todayTasks} onToggleTask={onToggleTask} onAddTask={onAddTask} />}
          {kind === "calendar" && <CalendarBody eventsOn={eventsOn} />}
          {kind === "store" && <StoreBody items={storeItems} blossoms={blossoms} owned={owned} onBuy={onBuy} />}
          {kind === "storage" && <StorageBody storage={storage} furniture={furniture} onPlace={onPlace} />}
          {kind === "petshop" && <PetShopBody items={accessories} blossoms={blossoms} owned={owned} canBuy={canChange} onBuy={onBuyAccessory} />}
          {kind === "pets" && <PetsBody items={accessories} dogs={dogs} owned={owned} pets={pets} canChange={canChange} onWear={onWear} />}
          {kind === "library" && <LibraryBody tasks={tasks} />}
          {kind === "townhall" && <TownHallBody game={game} />}
          {kind === "bank" && <BankBody game={game} names={names} />}
        </div>
        {FULL[kind] && <footer className="cozy-panel-foot">
          <button onClick={() => (kind === "bank" ? onOpenPage?.("budget", "home") : onOpenPage?.(kind))}>{FULL[kind]} ↗</button>
        </footer>}
      </section>
    </div>
  );
}

// General Store: buy furniture with blossoms; it arrives in your storage.
function StoreBody({ items, blossoms, owned, onBuy }) {
  // shelves of the General Store; only sections that have something for sale show up
  const cats = STORE_CATEGORIES.filter(([key]) => items.some(i => storeCategory(i) === key));
  const [cat, setCat] = useState(cats[0]?.[0]);
  const shown = items.filter(i => storeCategory(i) === cat);
  return (
    <>
      <p className="cozy-wallet">You have <strong>🌸 {blossoms}</strong> · earn {TASK_REWARD} for every task you finish</p>
      <div className="cozy-dog-tabs cozy-store-tabs" role="tablist" aria-label="Store sections">
        {cats.map(([key, label]) => <button key={key} role="tab" aria-selected={cat === key} onClick={() => setCat(key)}>{label}</button>)}
      </div>
      <div className="cozy-shop" role="tabpanel">
        {shown.map(item => (
          <div key={item.id} className="cozy-shop-item">
            {/* plain <img>: pixel art must not be re-encoded or smoothed by next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/game/room/${item.src}`} alt="" loading="lazy" />
            <strong>{item.name}</strong>
            <small>{owned[item.id] ? `You've bought ${owned[item.id]}` : "\u00a0"}</small>
            <button onClick={() => onBuy?.(item)} disabled={blossoms < item.price} aria-label={`Buy ${item.name} for ${item.price} blossoms`}>🌸 {item.price}</button>
          </div>
        ))}
      </div>
    </>
  );
}

// Pet Shop: head accessories for the dogs. Owning one lets any dog wear it.
function PetShopBody({ items, blossoms, owned, canBuy, onBuy }) {
  return (
    <>
      <p className="cozy-wallet">You have <strong>🌸 {blossoms}</strong> · wear them via the food bowls at home</p>
      <div className="cozy-shop">
        {items.map(item => (
          <div key={item.id} className="cozy-shop-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/game/accessories/${item.id}/front.png`} alt="" loading="lazy" />
            <strong>{item.name}</strong>
            {owned[item.id] ? <small>Owned ✓</small> : <small>{"\u00a0"}</small>}
            {owned[item.id] ? <button disabled>Owned</button>
              : <button onClick={() => onBuy?.(item)} disabled={!canBuy || blossoms < item.price} aria-label={`Buy ${item.name} for ${item.price} blossoms`}>🌸 {item.price}</button>}
          </div>
        ))}
      </div>
    </>
  );
}

// Pet bowl menu: choose a dog, then what it wears.
function PetsBody({ items, dogs, owned, pets, canChange, onWear }) {
  const [dog, setDog] = useState(dogs[0]?.key);
  const mine = items.filter(i => owned[i.id]);
  const wearing = pets[dog] || null;
  return (
    <>
      <div className="cozy-dog-tabs" role="tablist" aria-label="Choose a dog">
        {dogs.map(d => <button key={d.key} role="tab" aria-selected={dog === d.key} onClick={() => setDog(d.key)}>{d.name}{pets[d.key] ? " 🎀" : ""}</button>)}
      </div>
      {!mine.length ? <p className="cozy-empty">No accessories yet. Buy some at the Pet Shop in Tempo Town 🐾</p> : (
        <div className="cozy-shop">
          <div className={`cozy-shop-item ${!wearing ? "cozy-wearing" : ""}`}>
            <div className="cozy-none" aria-hidden="true">✕</div>
            <strong>Nothing</strong><small>{"\u00a0"}</small>
            <button onClick={() => onWear?.(dog, null)} disabled={!canChange || !wearing}>{wearing ? "Take off" : "Wearing"}</button>
          </div>
          {mine.map(item => (
            <div key={item.id} className={`cozy-shop-item ${wearing === item.id ? "cozy-wearing" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/game/accessories/${item.id}/front.png`} alt="" loading="lazy" />
              <strong>{item.name}</strong><small>{"\u00a0"}</small>
              <button onClick={() => onWear?.(dog, item.id)} disabled={!canChange || wearing === item.id}>{wearing === item.id ? "Wearing" : "Put on"}</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Storage: pieces you own that aren't in the room right now.
function StorageBody({ storage, furniture, onPlace }) {
  const ids = Object.keys(storage);
  if (!ids.length) return <p className="cozy-empty">Storage is empty. Buy more at the General Store in Tempo Town 🛍️</p>;
  return (
    <div className="cozy-shop">
      {ids.map(id => (
        <div key={id} className="cozy-shop-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/game/room/${furniture[id].src}`} alt="" loading="lazy" />
          <strong>{furniture[id].name}</strong>
          <small>{storage[id] > 1 ? `×${storage[id]}` : "\u00a0"}</small>
          <button onClick={() => onPlace?.(id)}>Place</button>
        </div>
      ))}
    </div>
  );
}

// Library: every task you finished in the last 30 days, newest day first.
function LibraryBody({ tasks }) {
  const days = new Map();
  for (const t of tasks) {
    const key = taskCompletedDateKey(t); if (!key) continue;
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(t);
  }
  const since = Date.now() - 30 * 86400000;
  const list = [...days.entries()].filter(([k]) => (localDateFromKey(k)?.getTime() ?? 0) >= since).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const total = list.reduce((n, [, ts]) => n + ts.length, 0);
  if (!list.length) return <p className="cozy-empty">Your diary is empty for now. Every task you finish is written here 📖</p>;
  return (
    <>
      <p className="cozy-wallet"><strong>{total}</strong> tasks finished in the last 30 days</p>
      {list.map(([k, ts]) => (
        <div key={k}>
          <h3>{fmtDate(localDateFromKey(k))} <small>({ts.length})</small></h3>
          <ul className="cozy-diary">{ts.map(t => <li key={t.id}>✓ {t.title}</li>)}</ul>
        </div>
      ))}
    </>
  );
}

// Town Hall: your daily streak — finish at least one task a day to keep it going.
function TownHallBody({ game }) {
  const s = streakInfo(game || {});
  return (
    <>
      <div className="cozy-streak-head">
        <span className="cozy-streak-big">🔥 {s.current}</span>
        <span>{s.current === 1 ? "day" : "days"} in a row{s.doneToday ? " · today's done ✓" : s.current ? " · finish a task today to keep it" : ""}</span>
      </div>
      <p className="cozy-wallet">Best streak: <strong>{s.best}</strong> {s.best === 1 ? "day" : "days"}</p>
      <h3>Last 4 weeks</h3>
      <div className="cozy-streak-grid" role="img" aria-label={`${s.recent.filter(d => d.done).length} of the last 28 days had a finished task`}>
        {s.recent.map(d => <span key={d.key} className={d.done ? "on" : ""} title={d.key} />)}
      </div>
      <h3>Streak bonus</h3>
      <p className="cozy-empty">From the 2nd day in a row, your first task each day earns extra 🌸: 2 on day 2, 3 on day 3… up to {STREAK_MAX_BONUS} a day. {s.doneToday ? "Tomorrow" : "Today"}&rsquo;s first task: <strong>+{TASK_REWARD + s.nextBonus} 🌸</strong>.</p>
    </>
  );
}

// Blossom Bank: where your blossoms came from and what you spent them on (recent records).
function BankBody({ game, names }) {
  const earned = Object.entries(game?.earned || {});
  const sum = test => earned.filter(([k]) => test(k)).reduce((n, [, v]) => n + v, 0);
  const fromStreak = sum(k => k.startsWith("day@")), fromFocus = sum(k => k.startsWith("focus@"));
  const fromTasks = sum(k => !k.startsWith("day@") && !k.startsWith("focus@"));
  const spent = Object.entries(game?.spent || {}).map(([k, v]) => {
    const [id, stamp] = k.split("#"), t = parseInt(stamp.slice(0, -2), 36);
    return { k, name: names[id] || id.replace(/_/g, " "), price: v, when: Number.isFinite(t) ? new Date(t) : null };
  }).sort((a, b) => (b.when?.getTime() || 0) - (a.when?.getTime() || 0)).slice(0, 12); // newest first
  return (
    <>
      <div className="cozy-streak-head"><span className="cozy-streak-big">🌸 {game?.blossoms || 0}</span><span>in your account</span></div>
      <h3>Recently earned</h3>
      <ul className="cozy-bank">
        <li><span>✅ Finishing tasks</span><strong>{fromTasks}</strong></li>
        <li><span>☕ Café focus sessions</span><strong>{fromFocus}</strong></li>
        <li><span>🔥 Streak bonuses</span><strong>{fromStreak}</strong></li>
      </ul>
      <h3>Recent purchases</h3>
      {spent.length ? <ul className="cozy-bank">{spent.map(p => <li key={p.k}><span>{p.name}{p.when ? <small> · {fmtDate(p.when)}</small> : null}</span><strong>−{p.price}</strong></li>)}</ul>
        : <p className="cozy-empty">Nothing bought yet. The General Store and Pet Shop are just around the corner 🛍️</p>}
    </>
  );
}

function TaskRow({ t, onToggleTask }) {
  return (
    <label className={`cozy-task ${t.done ? "done" : ""}`}>
      <input type="checkbox" checked={Boolean(t.done)} onChange={() => onToggleTask?.(t.id)} aria-label={t.done ? `Undo ${t.title}` : `Complete ${t.title}`} />
      <span>{t.title}</span>
    </label>
  );
}

function EventRow({ e }) {
  return (
    <div className="cozy-event">
      <time>{e.allDay ? "All day" : fmt(e.start)}</time>
      <span>{e.title}</span>
    </div>
  );
}

function TodayBody({ todayTasks, events, onToggleTask }) {
  const open = todayTasks.filter(t => !t.done);
  const done = todayTasks.length - open.length;
  const hour = new Date().getHours();
  const later = events.filter(e => e.allDay || e.end > new Date());
  return (
    <>
      <p className="cozy-panel-greet">Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"} ✨ <small>{fmtDate(TODAY)}</small></p>
      <div className="cozy-stats">
        <div><strong>{open.length}</strong><small>tasks left</small></div>
        <div><strong>{done}</strong><small>done</small></div>
        <div><strong>{later.length}</strong><small>events ahead</small></div>
      </div>
      <h3>Top tasks</h3>
      {open.length ? open.slice(0, 3).map(t => <TaskRow key={t.id} t={t} onToggleTask={onToggleTask} />)
        : <p className="cozy-empty">{done ? "All done for today 🎉" : "Nothing due today 🌸"}</p>}
      <h3>Coming up</h3>
      {later.length ? later.slice(0, 4).map(e => <EventRow key={e.id} e={e} />) : <p className="cozy-empty">No more events today.</p>}
    </>
  );
}

function TasksBody({ todayTasks, onToggleTask, onAddTask }) {
  const [draft, setDraft] = useState("");
  const open = todayTasks.filter(t => !t.done), done = todayTasks.filter(t => t.done);
  const add = e => { e.preventDefault(); const title = draft.trim(); if (!title) return; onAddTask?.(title); setDraft(""); };
  return (
    <>
      <form className="cozy-add" onSubmit={add}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a task for today" aria-label="New task for today" />
        <button type="submit" disabled={!draft.trim()}>Add</button>
      </form>
      <h3>Today <small>({done.length}/{todayTasks.length} done)</small></h3>
      {open.length ? open.map(t => <TaskRow key={t.id} t={t} onToggleTask={onToggleTask} />) : <p className="cozy-empty">{done.length ? "All done 🎉" : "Nothing due today 🌸"}</p>}
      {done.length > 0 && <><h3>Done</h3>{done.map(t => <TaskRow key={t.id} t={t} onToggleTask={onToggleTask} />)}</>}
    </>
  );
}

function CalendarBody({ eventsOn }) {
  const [day, setDay] = useState(() => dayStart(TODAY));
  const events = eventsOn(day);
  const isToday = sameDay(day, TODAY);
  return (
    <>
      <div className="cozy-daynav">
        <button onClick={() => setDay(d => addDaysSafe(d, -1))} aria-label="Previous day">‹</button>
        <strong>{isToday ? "Today" : fmtDate(day)}</strong>
        <button onClick={() => setDay(d => addDaysSafe(d, 1))} aria-label="Next day">›</button>
      </div>
      {!isToday && <button className="cozy-linkish" onClick={() => setDay(dayStart(TODAY))}>Back to today</button>}
      {events.length ? events.map(e => <EventRow key={e.id + String(e.start)} e={e} />) : <p className="cozy-empty">Nothing scheduled{isToday ? " today" : ""}. Enjoy the open space 🌸</p>}
    </>
  );
}

export const PANEL_CSS = `
.cozy-panel-backdrop{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:12px;background:rgba(43,35,54,.45);}
.cozy-full .cozy-panel-backdrop{position:fixed;z-index:2100;}
.cozy-panel{width:min(440px,100%);max-height:min(82vh,640px);display:flex;flex-direction:column;background:#FFF8FB;color:#3B2A40;
  border:3px solid #E9A9C1;border-radius:18px;box-shadow:0 6px 0 #D9467F33,0 12px 30px rgba(0,0,0,.35);outline:none;overflow:hidden;}
.cozy-panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px 10px 16px;background:#FBE3EC;border-bottom:2px dashed #E9A9C1;}
.cozy-panel-head strong{font-size:16px;}
.cozy-panel-x{border:0;background:#fff;border-radius:999px;width:34px;height:34px;font-size:15px;cursor:pointer;color:#B0436E;box-shadow:0 1px 4px rgba(0,0,0,.12);}
.cozy-panel-body{padding:10px 16px 6px;overflow-y:auto;display:grid;gap:6px;}
.cozy-panel-body h3{margin:8px 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#B0436E;}
.cozy-panel-body h3 small{text-transform:none;letter-spacing:0;color:#7A6A80;font-weight:600;}
.cozy-panel-greet{margin:0;font-weight:800;font-size:17px;}
.cozy-panel-greet small{display:block;font-weight:600;font-size:12px;color:#7A6A80;}
.cozy-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.cozy-stats div{background:#fff;border:2px solid #F4D3DF;border-radius:12px;padding:6px;text-align:center;}
.cozy-stats strong{display:block;font-size:20px;color:#CB416B;line-height:1.1;}
.cozy-stats small{font-size:11px;color:#7A6A80;}
.cozy-task{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #F4D3DF;border-radius:12px;padding:8px 10px;cursor:pointer;min-height:44px;}
.cozy-task input{width:20px;height:20px;accent-color:#CB416B;flex-shrink:0;}
.cozy-task.done span{text-decoration:line-through;opacity:.55;}
.cozy-event{display:flex;gap:10px;align-items:baseline;background:#fff;border:2px solid #E3D6F2;border-radius:12px;padding:8px 10px;}
.cozy-event time{font-size:12px;font-weight:800;color:#7B5BB5;white-space:nowrap;min-width:58px;}
.cozy-empty{margin:2px 0;color:#7A6A80;font-size:14px;}
.cozy-diary{list-style:none;margin:0 0 4px;padding:0;display:grid;gap:2px;font-size:14px;}
.cozy-streak-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
.cozy-streak-big{font-size:30px;font-weight:900;color:#CB416B;}
.cozy-streak-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;max-width:280px;}
.cozy-streak-grid span{aspect-ratio:1;border-radius:6px;background:#F7E3EA;}
.cozy-streak-grid span.on{background:#E8749B;}
.cozy-streak-grid span:last-child{outline:2px solid #CB416B;outline-offset:1px;}
.cozy-bank{list-style:none;margin:0 0 4px;padding:0;display:grid;gap:4px;font-size:14px;}
.cozy-bank li{display:flex;justify-content:space-between;gap:10px;}
.cozy-bank small{color:#7A6A80;}
.cozy-add{display:flex;gap:6px;}
.cozy-add input{flex:1;min-width:0;border:2px solid #F4D3DF;border-radius:12px;padding:9px 10px;font:inherit;font-size:15px;background:#fff;color:inherit;}
.cozy-add button,.cozy-daynav button{border:0;border-radius:12px;padding:0 14px;min-height:42px;background:#CB416B;color:#fff;font:inherit;font-weight:800;cursor:pointer;}
.cozy-add button:disabled{opacity:.45;cursor:default;}
.cozy-daynav{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.cozy-daynav button{font-size:20px;min-width:44px;}
.cozy-linkish{justify-self:center;border:0;background:none;color:#CB416B;font:inherit;font-weight:700;cursor:pointer;text-decoration:underline;}
.cozy-panel-foot{padding:8px 16px 12px;display:flex;justify-content:flex-end;}
.cozy-wallet{margin:0 0 4px;font-size:14px;color:#7A6A80;}
.cozy-wallet strong{color:#CB416B;}
.cozy-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;padding-bottom:6px;}
.cozy-shop-item{display:grid;justify-items:center;gap:3px;background:#fff;border:2px solid #F4D3DF;border-radius:14px;padding:8px 6px;text-align:center;}
.cozy-shop-item img{width:72px;height:72px;object-fit:contain;image-rendering:pixelated;}
.cozy-shop-item strong{font-size:13px;line-height:1.2;}
.cozy-shop-item small{font-size:11px;color:#7A6A80;min-height:14px;}
.cozy-shop-item button{border:0;border-radius:999px;padding:6px 12px;min-height:36px;background:#CB416B;color:#fff;font:inherit;font-weight:800;cursor:pointer;}
.cozy-shop-item button:disabled{background:#E9C4D2;cursor:default;}
.cozy-dog-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;}
.cozy-dog-tabs button{border:2px solid #F4D3DF;background:#fff;color:#B0436E;border-radius:999px;padding:6px 12px;min-height:38px;font:inherit;font-weight:800;cursor:pointer;}
.cozy-dog-tabs button[aria-selected="true"]{background:#CB416B;border-color:#CB416B;color:#fff;}
/* phones: the store's many sections become one row you swipe sideways */
@media (max-width:600px){.cozy-store-tabs{flex:none;min-height:44px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px;}.cozy-store-tabs::-webkit-scrollbar{display:none;}.cozy-store-tabs button{flex-shrink:0;}}
.cozy-wearing{border-color:#CB416B;box-shadow:0 0 0 2px #FBE3EC;}
.cozy-none{width:72px;height:72px;display:grid;place-items:center;font-size:28px;color:#C9A8B6;}
.cozy-panel-foot button{border:2px solid #E9A9C1;background:#fff;color:#B0436E;border-radius:999px;padding:7px 14px;font:inherit;font-weight:800;cursor:pointer;}
/* Mini Tempo: the panel covers the whole Mini window rather than the small room picture */
.cozy-compact .cozy-panel-backdrop{position:fixed;z-index:2100;padding:8px;}
.cozy-compact .cozy-panel{max-height:calc(100vh - 16px);border-width:2px;}
`;
