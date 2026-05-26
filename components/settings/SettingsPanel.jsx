import { useState } from "react";
import * as Core from "../../lib/tempo/core";
import { normalizeMealBreaks, normalizePlanningRules } from "../../utils/planningUtils";
import { disableTempoPushNotifications } from "../auth/LoginScreen";

const {
  FONT_SIZES,
  THEMES,
  createCategoryId,
  uid,
  normalizeNotificationPreferences,
  normalizeSyncConflictLog,
} = Core;

export function SettingsPanel({ onClose, fontSize, setFontSize, darkMode, setDarkMode, theme, setTheme, workStart, setWorkStart, workEnd, setWorkEnd, mealBreaks, setMealBreaks, planningRules, setPlanningRules, notifs, setNotifs, pushEnabled, setPushEnabled, notificationPreferences, setNotificationPreferences, onEnableClosedPush, timezone, setTimezone, categories, setCategories, user, onSignOut, gameStats, onForceSync, syncStatus, syncDebug, onRestartOnboarding, googleSync, onGoogleConnect, onGoogleDisconnect, onGoogleSyncNow, onGoogleCalendarPatch }) {
  const [catDraft, setCatDraft] = useState({ icon: "✨", label: "", color: "#FF7BAC" });
  const [syncDebugOpen, setSyncDebugOpen] = useState(false);
  const reminderPrefs = normalizeNotificationPreferences(notificationPreferences);
  const updateReminderPrefs = patch => setNotificationPreferences?.(normalizeNotificationPreferences({ ...reminderPrefs, ...patch }));
  const updateReminderNested = (key, patch) => updateReminderPrefs({ [key]: { ...(reminderPrefs[key] || {}), ...patch } });
  const reminderDayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const notificationSupported = typeof window !== "undefined" && "Notification" in window;
  const pushSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && notificationSupported;
  const notificationPermission = notificationSupported ? Notification.permission : "unsupported";
  const googleLastImportMs = googleSync?.lastImportAt ? new Date(googleSync.lastImportAt).getTime() : 0;
  const googleIsStale = Boolean(googleSync?.connected && googleLastImportMs && Date.now() - googleLastImportMs > 24 * 60 * 60 * 1000);
  const googleOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  const googleNeedsReconnect = Boolean(googleSync?.error && /unauthorized|expired|revoked|invalid_grant|not connected/i.test(String(googleSync.error)));
  const googleStatusTone = googleOffline ? "offline" : googleSync?.loading ? "loading" : googleSync?.error ? "failed" : googleNeedsReconnect ? "failed" : googleIsStale ? "stale" : googleSync?.connected ? "connected" : "disconnected";
  const googleStatusLabel = googleOffline ? "Offline" : googleSync?.loading ? "Syncing" : googleSync?.error ? "Needs attention" : googleIsStale ? "Stale" : googleSync?.connected ? "Connected" : "Not connected";
  const debug = syncDebug || {};
  const datasetCounts = debug.datasetCounts || {};
  const recentConflicts = normalizeSyncConflictLog(debug.syncConflictLog || []).slice(0, 5);
  const tombstoneCount = Object.values(debug.deletedRecords || {}).reduce((sum, bucket) => sum + Object.keys(bucket || {}).length, 0);
  async function toggleNotifs() {
    if (!notificationSupported) {
      window.alert("This browser does not support notifications. Tempo can still show reminders while the app is open, but browser alerts cannot be enabled here.");
      return;
    }
    if (!notifs && Notification.permission === "default") await Notification.requestPermission();
    if (!notifs && Notification.permission === "denied") {
      window.alert("Notifications are blocked for this browser. Enable them in browser/site settings, then come back to Tempo.");
      return;
    }
    setNotifs(!notifs);
  }
  async function toggleClosedPush() {
    if (!pushEnabled) {
      if (!pushSupported) {
        window.alert("Closed-app push notifications are not supported on this browser/device. Tempo reminders still work while the app is open.");
        return;
      }
      const ok = await onEnableClosedPush?.();
      if (ok) setPushEnabled(true);
    } else {
      if (!window.confirm("Turn off closed-app push notifications on this device? In-app reminders will stay available.")) return;
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
  function removeCategory(id) {
    if (categories.length <= 1) return;
    const label = categories.find(c => c.id === id)?.label || "this category";
    if (!window.confirm(`Remove ${label}? Existing items keep their category id, but it will no longer appear in category settings.`)) return;
    setCategories(cs => cs.filter(c => c.id !== id));
  }
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

          <div className="settings-section google-calendar-settings">
            <div className="settings-section-label">Google Calendar Sync</div>
            <div className="settings-section-desc">Read-only import: Tempo shows Google events for planning context only. Tempo will not edit, delete, or write events back to Google Calendar.</div>
            <div className={`google-sync-status-row ${googleStatusTone}`}>
              <span className={`google-sync-dot ${googleStatusTone}`} />
              <strong>{googleStatusLabel}</strong>
              {googleSync?.lastImportAt && <small>Last import {new Date(googleSync.lastImportAt).toLocaleString()}</small>}
              {!googleSync?.lastImportAt && googleSync?.connected && <small>No import yet</small>}
              {googleSync?.googleCalendarSync?.importedCount !== undefined && <small>{googleSync.googleCalendarSync.importedCount} events in last import</small>}
              {googleOffline && <small className="google-sync-error">Reconnect to the internet, then retry import.</small>}
              {googleSync?.error && <small className="google-sync-error">{googleSync.error}</small>}
            </div>
            {googleNeedsReconnect && <div className="google-sync-warning">Google access may have expired or been revoked. Reconnect Google Calendar to refresh Tempo’s read-only import.</div>}
            {googleIsStale && !googleSync?.error && <div className="google-sync-warning">Google events may be stale. Retry import to refresh your reference calendar.</div>}
            <div className="settings-action-row google-sync-actions">
              {!googleSync?.connected
                ? <button className="tf-save" onClick={onGoogleConnect} disabled={googleSync?.loading || googleOffline}>Connect Google Calendar</button>
                : <>
                    <button className="tf-save" onClick={onGoogleSyncNow} disabled={googleSync?.loading || googleOffline}>{googleSync?.loading ? "Syncing…" : googleSync?.error ? "Retry import" : "Import Google events"}</button>
                    <button className="tf-cancel" onClick={onGoogleDisconnect} disabled={googleSync?.loading}>Disconnect</button>
                  </>}
            </div>
            {googleSync?.message && <div className="settings-section-desc">{googleSync.message}</div>}
            {googleSync?.connected && (
              <div className="google-calendar-list">
                {(googleSync.calendars || []).length ? googleSync.calendars.map(cal => (
                  <div key={cal.id} className="google-calendar-row">
                    <span className="google-calendar-color" style={{ background: cal.color || "var(--accent)" }} />
                    <div className="google-calendar-meta">
                      <strong>{cal.name || "Untitled Google calendar"}</strong>
                      <small>Read-only reference · {cal.googleCalendarId || "Google calendar"}</small>
                    </div>
                    <label><input type="checkbox" checked={cal.visible !== false} onChange={e => onGoogleCalendarPatch?.(cal.id, { visible: e.target.checked })} /> Show</label>
                    <label><input type="checkbox" checked={cal.syncEnabled !== false} onChange={e => onGoogleCalendarPatch?.(cal.id, { syncEnabled: e.target.checked })} /> Sync</label>
                  </div>
                )) : (
                  <div className="google-calendar-empty-state">
                    <strong>No Google calendars loaded yet</strong>
                    <span>Use Import Google events to fetch your readable calendars. If this stays empty, reconnect Google Calendar.</span>
                    <button type="button" className="tf-save" onClick={onGoogleSyncNow} disabled={googleSync?.loading || googleOffline}>Retry import</button>
                  </div>
                )}
              </div>
            )}
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
            <div className="settings-section-desc">Gentle reminder banners while Tempo is open in this browser.</div>
            <div className={`notification-support-note ${notificationSupported ? "supported" : "unsupported"}`}>{notificationSupported ? `Browser permission: ${notificationPermission}` : "This browser does not support notification permissions."}</div>
            <div className="toggle-row"><span>Off</span><button className={`toggle ${notifs ? "on" : ""}`} onClick={toggleNotifs} disabled={!notificationSupported}><div className="toggle-thumb" /></button><span>On</span></div>
          </div>
          <div className="settings-section">
            <div className="settings-section-label">Closed-app push notifications</div>
            <div className="settings-section-desc">Lets this device receive gentle reminders even when Tempo is closed. Requires browser push support and your VAPID setup.</div>
            <div className={`notification-support-note ${pushSupported ? "supported" : "unsupported"}`}>{pushSupported ? "Supported on this device/browser." : "Not supported on this device/browser. Keep Tempo open for in-app reminders."}</div>
            <div className="toggle-row"><span>Off</span><button className={`toggle ${pushEnabled ? "on" : ""}`} onClick={toggleClosedPush} disabled={!pushEnabled && !pushSupported}><div className="toggle-thumb" /></button><span>On</span></div>
          </div>
          <div className="settings-section">
            <div className="settings-section-label">Reminder categories</div>
            <div className="settings-section-desc">Choose which gentle reminders Tempo can send. Event, task, and habit reminders still follow the individual reminder times you set on each item.</div>
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
