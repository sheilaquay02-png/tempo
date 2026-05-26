"use client";

import * as Core from "../../lib/tempo/core";

const {
  TODAY,
  fmtDate,
  DEFAULT_AFFIRMATIONS,
  affirmationForDate,
  affirmationCategoryById,
} = Core;

export function TempoLogoMark() {
  return <>🌸</>;
}


export function DailyStartupModal({ summary, onClose, onPlanDay }) {
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


export function DailyAffirmationCard({ affirmations = DEFAULT_AFFIRMATIONS, compact = false }) {
  const todayAffirmation = affirmationForDate(affirmations, TODAY);
  if (!todayAffirmation) return null;
  const category = affirmationCategoryById(todayAffirmation.category);
  return (
    <section className={`phase-card affirmation-daily-card ${compact ? "compact" : ""}`}>
      <div className="phase-card-head"><span>Daily Affirmation</span><small>Randomized daily</small></div>
      <div className="affirmation-quote-row">
        <div className="affirmation-quote-text">
          <blockquote>“{todayAffirmation.text}”</blockquote>
        </div>
        <span className="affirmation-quote-icon">{category.emoji}</span>
      </div>
    </section>
  );
}


export function SyncStatusPill({ syncStatus, onRetry, pendingLocalChanges = 0, lastSyncedAt = null }) {
  const status = syncStatus?.status || "saved";
  const lastSyncedLabel = lastSyncedAt ? ` · Last synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "";
  const label = pendingLocalChanges > 0
    ? `Unsaved Changes · ${pendingLocalChanges}${lastSyncedLabel}`
    : (syncStatus?.message || (status === "saving" ? "Saving…" : status === "failed" ? "Sync failed" : status === "offline" ? "Saved on this device only" : "Saved to cloud"));
  const icon = status === "saving" ? "⏳" : status === "failed" ? "⚠️" : status === "offline" ? "📱" : "✓";
  return (
    <button type="button" className={`sync-pill sync-${status}`} onClick={status === "failed" ? onRetry : undefined} title={status === "failed" ? "Tap to retry cloud sync" : label}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );
}


export function ComingSoonPage({ icon, title, phase, description, bullets = [] }) {
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

