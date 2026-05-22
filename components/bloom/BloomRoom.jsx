import * as Core from "../../lib/tempo/core";

// Rhythm Stats cards only. Bloom Room was removed from navigation, so this file now
// keeps the reusable stat cards without the old standalone Bloom Room page.

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

export function CheckInRhythmCard({ dailyCheckIns = [] }) {
  const today = Core.dailyCheckInForDate(dailyCheckIns, Core.TODAY);
  const mood = today?.mood ? Core.DAILY_CHECKIN_MOODS.find(m => m.id === today.mood) : null;
  const energy = today?.energy ? Core.DAILY_CHECKIN_ENERGIES.find(e => e.id === today.energy) : null;
  const recent = Core.normalizeDailyCheckIns(dailyCheckIns).slice(0, 7);
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

export function AffirmationRhythmCard({ affirmations = Core.DEFAULT_AFFIRMATIONS }) {
  const daily = Core.affirmationForDate(affirmations, Core.TODAY);
  const all = Core.normalizeAffirmations(affirmations);
  const favorites = all.filter(a => a.favorite).length;
  const custom = all.filter(a => a.source === "custom").length;
  const category = daily ? Core.affirmationCategoryById(daily.category) : null;
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
