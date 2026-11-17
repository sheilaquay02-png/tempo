import { TempoLogoMark, SyncStatusPill } from "../shared/DisplayComponents";

export function TempoLoadingScreen({ message = null }) {
  return (
    <div className="login-page tempo-loading-page">
      <div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div>
      <div className="login-card tempo-loading-card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div className="login-hero" style={{ marginBottom: message ? 16 : 20 }}>
          <div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon"><TempoLogoMark /></div></div>
          <div className="login-brand"><span className="login-logo-text">Tempo</span></div>
        </div>
        {message && <p style={{ color: "#A07090", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{message}</p>}
        <span className="login-spinner" style={{ width: 28, height: 28, borderWidth: 3, display: "inline-block", margin: "0 auto" }}/>
      </div>
    </div>
  );
}


export function AppModeSwitch({ appMode = "schedule", page = "today", onChange, onNavigate }) {
  const modes = [
    { id: "today", label: "Today", emoji: "🌤️" },
    { id: "calendar", label: "Calendar", emoji: "🗓️" },
    { id: "tasks", label: "Tasks", emoji: "✅" },
    { id: "budget", label: "Budget", emoji: "💳" },
  ];
  return (
    <div className="app-mode-switch" role="tablist" aria-label="Tempo primary navigation">
      {modes.map(mode => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={mode.id === "budget" ? appMode === "budget" : appMode === "schedule" && page === mode.id}
          aria-label={mode.label}
          title={mode.label}
          className={`app-mode-btn ${(mode.id === "budget" ? appMode === "budget" : appMode === "schedule" && page === mode.id) ? "active" : ""}`}
          onClick={() => mode.id === "budget" ? onChange?.("budget") : onNavigate?.(mode.id)}
        >
          <span aria-hidden="true">{mode.emoji}</span><span className="tempo-primary-label">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

export function AppSidebar({
  sidebarOpen,
  todayDate,
  sidebarDateLabel,
  user,
  syncStatus,
  pendingLocalChanges,
  lastSyncedAt,
  onForceSync,
  checkInSummary,
  onOpenCheckIn,
  page,
  appMode = "schedule",
  budgetPage = "home",
  onAppModeChange,
  onNavigate,
  onNavigateBudgetPage,
  onPlanToday,
  onOpenSettings,
  calendars,
  hiddenCals,
  hiddenCalendarSources,
  onAddCalendar,
  onToggleCalendarSource,
  onToggleCalendarVisibility,
  onEditCalendar,
  onRequestRemoveCalendar,
}) {
  const calendarSources = [
    { id: "tempo", label: "Tempo", icon: "T" },
    ...(calendars.some(c => c.source === "google") ? [{ id: "google", label: "Google", icon: "G" }] : []),
  ];
  const budgetNavItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "account", label: "Account", icon: "💳" },
    { id: "transactions", label: "Transactions", icon: "🧾" },
    { id: "budget", label: "Budget", icon: "🪣" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
      <div className="sidebar-logo"><div className="logo-icon"><TempoLogoMark /></div><span>Tempo</span></div>
      <AppModeSwitch appMode={appMode} page={page} onChange={onAppModeChange} onNavigate={onNavigate} />
      <div className="sidebar-date">
        <div className="date-big">{todayDate.getDate()}</div>
        {sidebarDateLabel}
        {user && <div className="sidebar-user">👤 {user.name || user.email}</div>}
        <div className="sidebar-sync-under-user">
          <button type="button" className="sidebar-sync-now-btn" onClick={onForceSync}>↻ Sync now</button>
          <SyncStatusPill syncStatus={syncStatus} onRetry={onForceSync} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} />
        </div>
      </div>
      {appMode === "schedule" && checkInSummary && (
        <div className="mood-bar" onClick={onOpenCheckIn} style={{ cursor: "pointer" }}>
          {checkInSummary.emoji} Feeling {checkInSummary.label}{checkInSummary.energyLabel ? ` · ${checkInSummary.energyLabel} energy` : ""}
        </div>
      )}
      <nav className="sidebar-nav">
        {appMode === "budget" ? (
          <>
            <div className="nav-section-label">Budget</div>
            {budgetNavItems.map(item => (
              <div key={item.id} className={`nav-item ${budgetPage === item.id ? "active" : ""}`} onClick={() => onNavigateBudgetPage?.(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</div>
            ))}
          </>
        ) : appMode === "overall" ? (
          <>
            <div className="nav-section-label">Overall</div>
            <div className="nav-item active"><span className="nav-icon">🌿</span>Overall</div>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Later</div>
            <div className="nav-item muted"><span className="nav-icon">🔎</span>Pattern insights</div>
          </>
        ) : (
          <>
            <div className="nav-section-label">Planning</div>
            <div className="nav-item desktop-hidden-menu-item" onClick={onPlanToday}><span className="nav-icon">✨</span>Plan Today</div>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Personal</div>
            <div className={`nav-item ${page === "rhythm" ? "active" : ""}`} onClick={() => onNavigate("rhythm")}><span className="nav-icon">📊</span>Rhythm Stats</div>
            <div className="nav-item" onClick={onOpenSettings}><span className="nav-icon">⚙️</span>Settings</div>
            <div className="nav-item" onClick={() => onAppModeChange?.("overall")}><span className="nav-icon">🌿</span>Overall (more)</div>
          </>
        )}
      </nav>
      {appMode === "schedule" && (
        <div className="sidebar-cals">
          <div className="cal-label-row">
            <span className="cal-label">My Calendars</span>
            <button type="button" className="cal-add-btn" onClick={onAddCalendar} title="Create calendar">＋</button>
          </div>
          <div className="calendar-source-filter-row" aria-label="Calendar source filters">
            {calendarSources.map(src => {
              const hidden = hiddenCalendarSources.includes(src.id);
              return <button key={src.id} type="button" className={`calendar-source-chip ${hidden ? "source-hidden" : ""}`} onClick={() => onToggleCalendarSource(src.id)} title={hidden ? `Show ${src.label}` : `Hide ${src.label}`}><span>{src.icon}</span>{src.label}</button>;
            })}
          </div>
          {calendars.map(c => {
            const hidden = hiddenCals.includes(c.id);
            return (
              <div key={c.id} className={`cal-item cal-toggleable ${hidden ? "cal-hidden" : ""}`} title={hidden ? "Hidden" : "Visible"}>
                <button type="button" className="cal-visible-btn" onClick={() => onToggleCalendarVisibility(c.id)} title={hidden ? "Show calendar" : "Hide calendar"}>
                  <span className="cal-dot" style={{ background: hidden ? "var(--border)" : c.color }} />
                  <span className="cal-eye">{hidden ? "○" : "●"}</span>
                </button>
                <span className="cal-name" onClick={() => onToggleCalendarVisibility(c.id)}>{c.id === "work" && !c.name ? (user?.email ?? c.name) : c.name}</span>
                <button type="button" className="cal-action-btn" onClick={() => onEditCalendar(c)} title="Rename/edit calendar">✎</button>
                {c.source !== "google" && <button type="button" className="cal-action-btn" onClick={() => onRequestRemoveCalendar(c)} title="Remove calendar">×</button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CalendarTopbar({
  view,
  title,
  showTodayBadge,
  todayEventCount,
  syncStatus,
  pendingLocalChanges,
  lastSyncedAt,
  onToggleSidebar,
  onPrevious,
  onToday,
  onNext,
  onViewChange,
  onForceSync,
  onPlanToday,
  onSearch,
  onTemplates,
  onShortcuts,
}) {
  return (
    <div className="topbar">
      <button className="topbar-btn icon-only desktop-sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>
      <button className="topbar-btn icon-only nav-arrow" onClick={onPrevious} aria-label="Previous">‹</button>
      <button className="topbar-btn today-btn" onClick={onToday}>Today</button>
      <button className="topbar-btn icon-only nav-arrow" onClick={onNext} aria-label="Next">›</button>
      <div className="topbar-date">
        {title}
        {showTodayBadge && <span className="today-badge">{todayEventCount} events</span>}
      </div>
      <div className="view-tabs">
        {["day", "week", "month"].map(v => <button key={v} className={`view-tab ${view === v ? "active" : ""}`} onClick={() => onViewChange(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
      </div>
      <SyncStatusPill syncStatus={syncStatus} onRetry={onForceSync} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} />
      <button className="topbar-btn sync-now-btn" onClick={onForceSync}>↻ Sync</button>
      <button className="topbar-btn plan-day-btn" onClick={onPlanToday}>✨ Plan Today</button>
      <button className="topbar-btn" onClick={onSearch} aria-label="Search" title="Search (/)">🔍</button>
      <button className="topbar-btn" onClick={onTemplates} aria-label="Day templates">🗂 Templates</button>
      <button className="topbar-btn icon-only keyboard-shortcuts-btn" onClick={onShortcuts} aria-label="Keyboard shortcuts">⌨️</button>
    </div>
  );
}

export function MobileBottomNav({
  sidebarOpen,
  page,
  appMode = "schedule",
  budgetPage = "home",
  syncStatus,
  pendingLocalChanges,
  lastSyncedAt,
  onRetrySync,
  onToggleMenu,
  onNavigateToday,
  onNavigateCalendar,
  onNavigateTasks,
  onNavigateBudgetPage,
}) {
  const showSync = (syncStatus?.status && syncStatus.status !== "saved") || pendingLocalChanges > 0;
  const budgetItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "account", label: "Account", icon: "💳" },
    { id: "transactions", label: "Transactions", icon: "🧾" },
    { id: "budget", label: "Budget", icon: "🪣" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];
  return (
    <>
      {showSync && (
        <div className="mobile-sync-strip">
          <SyncStatusPill syncStatus={syncStatus} onRetry={onRetrySync} pendingLocalChanges={pendingLocalChanges} lastSyncedAt={lastSyncedAt} />
        </div>
      )}
      <button type="button" className="tempo-mobile-menu-trigger" aria-label={sidebarOpen ? "Close menu" : "Open menu"} aria-expanded={sidebarOpen} onClick={onToggleMenu}>☰ Menu</button>
      {appMode === "budget" && (
        <nav className="tempo-budget-subnav" aria-label="Budget sections">
          {budgetItems.map(item => (
            <button type="button" key={item.id} className={`tempo-budget-subnav-btn ${budgetPage===item.id?"active":""}`}
              aria-current={budgetPage===item.id?"page":undefined} onClick={() => onNavigateBudgetPage?.(item.id)}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      )}
      <nav className="mobile-nav tempo-primary-mobile-nav" aria-label="Tempo primary navigation">
        <button type="button" aria-current={appMode==="schedule"&&page==="today"?"page":undefined} className={`mobile-nav-btn ${appMode==="schedule"&&page==="today"?"active":""}`} onClick={onNavigateToday}>🌤️<span>Today</span></button>
        <button type="button" aria-current={appMode==="schedule"&&page==="calendar"?"page":undefined} className={`mobile-nav-btn ${appMode==="schedule"&&page==="calendar"?"active":""}`} onClick={onNavigateCalendar}>🗓️<span>Calendar</span></button>
        <button type="button" aria-current={appMode==="schedule"&&page==="tasks"?"page":undefined} className={`mobile-nav-btn ${appMode==="schedule"&&page==="tasks"?"active":""}`} onClick={onNavigateTasks}>✅<span>Tasks</span></button>
        <button type="button" aria-current={appMode==="budget"?"page":undefined} className={`mobile-nav-btn ${appMode==="budget"?"active":""}`} onClick={() => onNavigateBudgetPage?.("home")}>💳<span>Budget</span></button>
      </nav>
    </>
  );
}
