export function appCSS(cvars, fontScale) { return `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Inconsolata:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{${cvars}--cream:#FBF4EC;--cream-2:#FFF9F5;--surface:#FFFFFF;--surface-warm:#FFFDFB;--surface-soft:#FFF9F5;--blush:#D989A2;--blush-soft:#F8E7E0;--lavender-soft:#F2EAF7;--mint:#B8F0E0;--success-soft:#EAF6EF;--warning-soft:#FFF3DA;--ring:rgba(var(--accent-rgb),.16);--radius:22px;--font:'Nunito',sans-serif;--mono:'Inconsolata',monospace;--shadow-sm:0 10px 28px rgba(116,78,60,.055);--shadow:0 16px 42px rgba(116,78,60,.075);--shadow-md:0 22px 58px rgba(116,78,60,.11);--shadow-lg:0 30px 80px rgba(116,78,60,.14);--fs:${fontScale};}
  .dark{--cream:var(--bg);--cream-2:var(--bg3);--surface:var(--bg2);--surface-warm:var(--bg3);--surface-soft:var(--bg3);--blush-soft:var(--bg4);--lavender-soft:var(--bg4);--success-soft:rgba(112,200,160,.14);--warning-soft:rgba(255,184,112,.14);--dark-page:radial-gradient(circle at 7% 0%,rgba(var(--accent-rgb),.28),transparent 30%),radial-gradient(circle at 100% 12%,rgba(var(--accent-rgb),.16),transparent 34%),linear-gradient(145deg,var(--bg),var(--bg2) 42%,var(--bg3));--dark-panel:radial-gradient(circle at top left,rgba(var(--accent-rgb),.16),transparent 36%),linear-gradient(160deg,var(--bg2),var(--bg3) 70%,var(--bg4));--dark-card:radial-gradient(circle at top left,rgba(var(--accent-rgb),.12),transparent 38%),linear-gradient(150deg,var(--bg2),var(--bg3) 74%,var(--bg4));--dark-field:linear-gradient(145deg,rgba(var(--accent-rgb),.10),rgba(var(--accent-rgb),.03)),var(--bg3);--dark-nav:linear-gradient(180deg,var(--bg3),var(--bg2));--shadow-sm:0 10px 28px rgba(0,0,0,.24);--shadow:0 16px 42px rgba(0,0,0,.31);--shadow-md:0 22px 58px rgba(0,0,0,.40);--shadow-lg:0 30px 80px rgba(0,0,0,.50);}
  body{background:radial-gradient(circle at 8% 0%,rgba(var(--accent-rgb),.10),transparent 30%),linear-gradient(180deg,var(--bg),var(--bg3));color:var(--text);font-family:var(--font);font-size:calc(var(--fs)*14px);overflow:hidden;height:100vh;}
  html.dark body,body.dark{background:var(--dark-page)!important;}
  .app{display:flex;height:100vh;overflow:hidden;}
  .sidebar{width:230px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;transition:width .25s ease;overflow-y:auto;overflow-x:hidden;min-height:0;}
  .sidebar.closed{width:0;}
  .sidebar-logo{padding:20px;border-bottom:1px solid var(--border);font-size:20px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px;}
  .sidebar-logo .logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:16px;}
  .tempo-logo-sticker{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 4px 8px rgba(var(--accent-rgb),.20));}
  .sidebar-logo span{color:var(--accent);}
  .sidebar-date{padding:14px 20px;font-family:var(--mono);font-size:11px;color:var(--text2);border-bottom:1px solid var(--border);background:var(--bg3);}
  .sidebar-date .date-big{font-size:30px;font-weight:900;font-family:var(--font);background:linear-gradient(135deg,var(--accent),#C060A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px;}
  .sidebar-user{margin-top:6px;font-size:10px;color:var(--text3);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .sidebar-daily-stats-btn{margin:8px 0 6px;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--border);background:var(--bg2);color:var(--accent);border-radius:999px;padding:5px 9px;font-family:var(--font);font-size:11px;font-weight:900;cursor:pointer;box-shadow:var(--shadow-sm);}
  .sidebar-daily-stats-btn:hover{background:var(--bg4);border-color:var(--accent3);}
  .sidebar-sync-menu-pill{display:none;margin-top:6px;}
  @media(min-width:769px){.desktop-hidden-menu-item{display:none!important;}}
  /* mood-bar used by journal mood display in sidebar */
  .mood-bar{padding:10px 20px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px;cursor:pointer;}
  .mood-bar:hover{background:var(--bg3);}.sidebar-nav{padding:12px 10px;flex:0 0 auto;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;cursor:pointer;font-size:13px;font-weight:700;color:var(--text2);transition:all .2s;margin-bottom:3px;}
  .nav-item:hover{background:var(--bg3);color:var(--text);}
  .nav-item.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent3);}
  .nav-icon{font-size:16px;width:22px;text-align:center;}
  .sidebar-cals{padding:12px 20px 16px;border-top:1px solid var(--border);flex-shrink:0;}
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
  .day-empty-state{position:absolute;top:50%;left:calc(54px + (100% - 54px)/2);transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none;z-index:3;width:min(320px,calc(100% - 78px));padding:8px;}
  .day-empty-state img{width:170px;height:170px;object-fit:contain;filter:drop-shadow(0 10px 24px rgba(255,123,172,.18));margin-bottom:8px;}
  .empty-state-title{font-size:13px;line-height:1.35;font-weight:900;color:var(--text2);}
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
  .event-resize-handle{position:absolute;left:10px;right:10px;bottom:2px;height:8px;border-radius:8px;cursor:ns-resize;opacity:0;transition:opacity .15s;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);z-index:4;}
  .event-block:hover .event-resize-handle{opacity:.9;}
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
  .wt-hour-row{position:absolute;left:0;right:0;display:flex;height:48px;align-items:flex-start;}
  .wt-hour-label{font-family:var(--mono);font-size:10px;color:var(--text3);padding-right:6px;line-height:1;}
  .wt-time-gutter{width:48px;flex-shrink:0;display:flex;align-items:flex-start;justify-content:flex-end;padding-top:6px;}
  .wt-hour-cell{flex:1;border-left:1px solid var(--border);border-top:1px solid var(--border);height:48px;}
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
  .task-panel.resizing{transition:none;}
  .task-panel.collapsed{width:28px;}
  .task-panel-resize-handle{position:absolute;left:-6px;top:0;width:12px;height:100%;z-index:30;cursor:col-resize;touch-action:none;}
  .task-panel-resize-handle::after{content:"";position:absolute;left:5px;top:12px;bottom:12px;width:2px;border-radius:999px;background:var(--accent);opacity:0;transition:opacity .15s, box-shadow .15s;box-shadow:0 0 0 4px rgba(var(--accent-rgb,255,123,172),.08);}
  .task-panel-resize-handle:hover::after,.task-panel.resizing .task-panel-resize-handle::after{opacity:.7;}
  body.tempo-resizing-task-panel,body.tempo-resizing-task-panel *{cursor:col-resize!important;user-select:none!important;}
  .task-panel-toggle{width:28px;flex-shrink:0;background:var(--bg3);border:none;border-right:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;transition:background .15s, color .15s;padding:0;}
  .task-panel-toggle:hover{background:var(--bg4);color:var(--accent);}
  .task-panel-inner{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
  .panel-header{padding:14px 14px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;flex-shrink:0;background:var(--bg3);}
  .panel-title{font-size:15px;font-weight:900;flex:1;color:var(--text);}
  .urgent-badge{background:#FFE0E0;color:#C04040;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:800;}
  .task-period-nav{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);}
  .period-btn,.period-label{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:10px;font-family:var(--font);font-weight:800;cursor:pointer;box-shadow:var(--shadow);}
  .period-btn{width:28px;height:28px;font-size:16px;line-height:1;}
  .period-label{min-width:150px;padding:7px 12px;font-size:11px;}
  .task-period-hint{font-size:10px;font-weight:800;color:var(--text3);padding:2px 2px 4px;text-align:center;}
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
  .task-empty-state{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px 16px;color:var(--text3);}
  .task-empty-state img{width:150px;height:150px;object-fit:contain;filter:drop-shadow(0 10px 24px rgba(255,123,172,.18));margin-bottom:8px;}
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

  .app-choice-modal .modal-body{display:grid;gap:10px;}
  .choice-modal-copy{font-size:13px;line-height:1.45;color:var(--text2);font-family:var(--font);}
  .choice-row{width:100%;text-align:left;border:1px solid var(--border);border-radius:16px;background:rgba(255,255,255,.72);padding:11px 12px;display:grid;gap:3px;cursor:pointer;font-family:var(--font);color:var(--text);}
  .choice-row:hover{border-color:var(--accent);background:rgba(var(--accent-rgb),.1);box-shadow:0 6px 18px rgba(var(--accent-rgb),.12);}
  .choice-row strong{font-size:13px;}
  .choice-row span{font-size:11px;color:var(--text2);line-height:1.3;}
  .overlap-list{display:grid;gap:8px;max-height:180px;overflow:auto;}
  .overlap-item{border:1px solid var(--border);border-radius:14px;background:var(--bg2);padding:9px 10px;display:grid;gap:3px;font-family:var(--font);}
  .overlap-item strong{font-size:13px;color:var(--text);}
  .overlap-item span{font-size:11px;color:var(--text2);}
  .tf-label{font-size:11px;font-weight:900;color:var(--text2);align-self:center;white-space:nowrap;}
  .task-date-row{align-items:center;}
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
  .stats-card{background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);width:780px;max-width:calc(100vw - 32px);max-height:calc(100vh - 48px);overflow:auto;padding:22px;box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .stats-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .stats-title{font-size:18px;font-weight:900;color:var(--text);}
  .stats-streak{font-size:15px;font-weight:900;color:var(--text2);margin-bottom:14px;line-height:1.45;}
  .stats-row{display:flex;gap:12px;margin-bottom:18px;}
  .stat-big{flex:1;background:var(--bg3);border-radius:16px;padding:14px;text-align:center;border:1px solid var(--border);}
  .stat-num{font-size:25px;font-weight:900;color:var(--accent);}
  .stat-lbl{font-size:10px;color:var(--text3);font-family:var(--mono);font-weight:800;margin-top:3px;text-transform:uppercase;letter-spacing:.3px;}
  .stats-bars{display:flex;flex-direction:column;gap:8px;}
  .stats-bar-row{display:flex;align-items:center;gap:8px;}
  .stats-bar-label{width:80px;font-size:11px;color:var(--text2);font-weight:600;flex-shrink:0;}
  .stats-bar-track{flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;}
  .stats-bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
  .stats-bar-val{width:32px;font-size:10px;font-family:var(--mono);color:var(--text3);text-align:right;flex-shrink:0;}
  .rhythm-stats-card{display:flex;flex-direction:column;gap:14px;}
  .rhythm-stats-note{margin-bottom:0;}
  .rhythm-insight-card{border:1px solid var(--border);background:linear-gradient(135deg,var(--bg4),var(--bg2));border-radius:20px;padding:14px 16px;font-size:14px;font-weight:900;color:var(--text);line-height:1.45;}
  .rhythm-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:0;}
  .rhythm-stats-section{border:1px solid var(--border);background:var(--bg2);border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:10px;}
  .rhythm-section-title{font-size:12px;font-weight:900;color:var(--text);text-transform:uppercase;letter-spacing:.7px;}
  .rhythm-meter{background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:12px;}
  .rhythm-meter-top{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:var(--text);font-weight:900;}
  .rhythm-meter-top span{color:var(--accent);font-family:var(--mono);}
  .rhythm-meter-track{height:8px;border-radius:999px;background:var(--border);overflow:hidden;margin-top:8px;}
  .rhythm-meter-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent2),var(--accent));transition:width .35s ease;}
  .rhythm-meter p,.rhythm-mini-panel p{margin:8px 0 0;color:var(--text2);font-size:12px;font-weight:800;line-height:1.45;}
  .rhythm-stats-split{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .rhythm-mini-panel{border:1px solid var(--border);background:var(--bg3);border-radius:20px;padding:14px;min-width:0;}
  .rhythm-chip-row{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:10px;align-items:center;background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:10px;margin-top:9px;}
  .rhythm-chip-row>span{grid-row:1/3;width:36px;height:36px;border-radius:14px;background:var(--bg4);display:grid;place-items:center;font-size:20px;}
  .rhythm-chip-row strong{font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .rhythm-chip-row small{font-size:11px;color:var(--text3);font-weight:850;margin-top:2px;}
  .rhythm-category-list{display:flex;flex-direction:column;gap:9px;}
  .rhythm-category-row{display:grid;grid-template-columns:150px 1fr 52px;align-items:center;gap:10px;font-size:12px;font-weight:900;color:var(--text2);}
  .rhythm-category-row>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .rhythm-category-row strong{font-family:var(--mono);color:var(--accent);text-align:right;}
  .rhythm-category-track{height:8px;background:var(--bg3);border-radius:999px;overflow:hidden;border:1px solid var(--border);}
  .rhythm-category-track i{display:block;height:100%;background:linear-gradient(90deg,var(--accent2),var(--accent));border-radius:999px;}
  @media(max-width:720px){.stats-card{width:calc(100vw - 20px);padding:16px;border-radius:20px;}.rhythm-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.rhythm-stats-split{grid-template-columns:1fr;}.rhythm-category-row{grid-template-columns:1fr;gap:5px;}.rhythm-category-row strong{text-align:left;}}
  .carryover-card{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);padding:20px;width:360px;max-width:calc(100vw - 32px);box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .carryover-title{font-size:14px;font-weight:800;color:var(--text);margin-bottom:14px;}
  .carryover-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
  .carryover-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text);font-weight:600;cursor:pointer;}
  .carryover-item input{accent-color:var(--accent);}
  .co-dur{margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--text3);}
  .carryover-actions{display:flex;gap:8px;justify-content:flex-end;}
  .tomorrow-reset-card{background:var(--bg2);border-radius:26px;border:1.5px solid var(--border);padding:20px;width:760px;max-width:calc(100vw - 32px);max-height:92vh;overflow:auto;box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .tomorrow-reset-page{padding:22px 28px;max-width:none;margin:0;width:100%;height:100%;overflow:auto;}
  .tomorrow-reset-page .tomorrow-reset-card{width:100%;max-width:none;max-height:none;overflow:visible;box-shadow:var(--shadow-sm);animation:none;}
  .tomorrow-reset-card.page-card{padding:22px;}
  .tomorrow-reset-back{white-space:nowrap;}
  .tomorrow-reset-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;}
  .tomorrow-reset-head h2{margin:2px 0 6px;font-size:26px;line-height:1.05;color:var(--text);}
  .tomorrow-reset-head p{margin:0;color:var(--text2);font-size:13px;line-height:1.45;max-width:560px;}
  .tomorrow-reset-previous{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgba(184,111,143,.18);background:linear-gradient(135deg,rgba(255,250,252,.9),rgba(255,255,255,.72));border-radius:18px;padding:12px;margin-bottom:12px;}
  .tomorrow-reset-previous strong{display:block;color:var(--text);font-size:13px;}.tomorrow-reset-previous span{display:block;color:var(--text3);font-size:11px;font-weight:800;margin-top:2px;}
  .tomorrow-reset-rhythm{margin-bottom:14px;}
  .tomorrow-reset-section{border:1px solid rgba(184,111,143,.16);background:rgba(255,255,255,.62);border-radius:22px;padding:14px;margin-top:14px;}
  .tomorrow-reset-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;color:var(--text2);font-size:12px;font-weight:800;}
  .tomorrow-reset-section-head strong{font-size:14px;color:var(--text);}
  .reset-quick-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;}.reset-quick-actions button{border:1px solid var(--border);background:var(--bg3);border-radius:999px;padding:5px 9px;color:var(--text2);font:inherit;font-size:11px;font-weight:800;cursor:pointer;}.reset-quick-actions button:hover{background:var(--bg4);color:var(--accent);}
  .tomorrow-reset-task-list{display:flex;flex-direction:column;gap:8px;}.tomorrow-reset-task{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:12px;align-items:center;border:1px solid var(--border);background:var(--bg3);border-radius:16px;padding:11px 12px;}.tomorrow-reset-task-main strong{display:block;font-size:13px;color:var(--text);line-height:1.25;}.tomorrow-reset-task-main span{display:block;font-size:11px;color:var(--text3);font-weight:800;margin-top:3px;}.tomorrow-reset-action-select{width:100%;}
  .tomorrow-reset-summary-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}.tomorrow-reset-summary-chip{border:1px solid var(--border);background:var(--bg3);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;color:var(--text3);}.tomorrow-reset-summary-chip.active{background:rgba(255,240,246,.9);color:var(--accent);border-color:rgba(184,111,143,.28);}
  .tomorrow-reset-reflection-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}.tomorrow-reset-reflection-grid label{display:flex;flex-direction:column;gap:6px;}.tomorrow-reset-reflection-grid label.wide{grid-column:1/-1;}.tomorrow-reset-reflection-grid label span{font-size:11px;color:var(--text2);font-weight:900;}.tomorrow-reset-reflection-grid textarea{min-height:74px;resize:vertical;border:1.5px solid var(--border);border-radius:14px;background:var(--bg3);padding:10px 12px;color:var(--text);font:inherit;font-size:12px;line-height:1.45;outline:none;}.tomorrow-reset-reflection-grid textarea:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(184,111,143,.12);}
  .tomorrow-reset-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;}.tomorrow-reset-footer button:disabled{opacity:.45;cursor:not-allowed;}
  .weekly-reset-page{padding:22px 28px;max-width:none;margin:0;width:100%;height:100%;overflow:auto;}
  .weekly-reset-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;}
  .weekly-reset-hero h1{margin:2px 0 6px;font-size:32px;color:var(--text);line-height:1.04;}
  .weekly-reset-hero p{margin:0;color:var(--text2);font-size:14px;line-height:1.45;max-width:620px;}
  .weekly-reset-saved-note{margin-bottom:14px;}
  .weekly-reset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding-bottom:80px;width:100%;}
  .weekly-reset-panel{margin-top:0;}
  .weekly-reset-panel.wide{grid-column:1/-1;}
  .weekly-reset-mini-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
  .weekly-reset-mini-grid div{border:1px solid var(--border);background:var(--bg3);border-radius:16px;padding:12px;text-align:center;}
  .weekly-reset-mini-grid strong{display:block;font-size:20px;color:var(--accent);line-height:1;}
  .weekly-reset-mini-grid span{display:block;margin-top:4px;font-size:10px;color:var(--text3);font-weight:900;text-transform:uppercase;letter-spacing:.03em;}
  .weekly-mood-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}.weekly-mood-row span{border:1px solid var(--border);background:var(--bg3);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;color:var(--text2);}
  .weekly-reset-input-list{display:flex;flex-direction:column;gap:8px;}.weekly-reset-label{display:flex;flex-direction:column;gap:6px;margin-top:10px;}.weekly-reset-label span{font-size:11px;color:var(--text2);font-weight:900;}.weekly-reset-label textarea{min-height:90px;resize:vertical;border:1.5px solid var(--border);border-radius:14px;background:var(--bg3);padding:10px 12px;color:var(--text);font:inherit;font-size:12px;line-height:1.45;outline:none;}.weekly-reset-label textarea:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(184,111,143,.12);}
  .weekly-event-preview{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}.weekly-event-preview span{border:1px solid var(--border);border-radius:999px;background:rgba(255,255,255,.72);padding:6px 9px;font-size:11px;color:var(--text2);font-weight:800;}
  .weekly-habit-focus-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}.weekly-habit-focus{border:1.5px solid var(--border);background:var(--bg3);border-radius:16px;padding:10px;text-align:left;color:var(--text2);font:inherit;font-size:12px;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:8px;}.weekly-habit-focus.active{background:rgba(255,240,246,.95);border-color:rgba(184,111,143,.35);color:var(--accent);box-shadow:0 8px 20px rgba(184,111,143,.10);}.weekly-habit-focus span{font-size:18px;line-height:1;}
  .weekly-reset-rhythm-card{border:1px solid rgba(184,111,143,.18);border-radius:24px;background:linear-gradient(135deg,rgba(255,250,252,.9),rgba(255,255,255,.72));box-shadow:var(--shadow-sm);padding:16px;margin-bottom:14px;}

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

  
  .event-copy-bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:10px;max-width:min(560px,calc(100vw - 32px));padding:10px 12px;background:rgba(255,255,255,.94);border:1.5px solid var(--border);border-radius:18px;box-shadow:0 14px 40px rgba(255,123,172,.22);backdrop-filter:blur(16px);color:var(--text);font-size:13px;font-weight:700;}
  .section-title-with-action{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .mini-manage-btn{border:1.5px solid var(--border);background:var(--bg2);color:var(--accent);border-radius:999px;padding:4px 10px;font-family:var(--font);font-size:10px;font-weight:900;cursor:pointer;}
  .memory-manager-panel{margin-top:12px;border:1.5px solid var(--border);background:rgba(255,255,255,.62);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px;}
  .manager-title{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:900;}
  .manager-group-card{border:1px solid var(--border);background:var(--bg2);border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:6px;}
  .manager-group-head{font-size:12px;font-weight:900;color:var(--text);}
  .manager-row{display:flex;align-items:center;gap:8px;padding:6px;border-radius:10px;background:var(--bg3);}
  .manager-row button{border:1px solid var(--border);background:var(--bg2);border-radius:999px;padding:4px 8px;font-family:var(--font);font-size:10px;font-weight:800;color:var(--text2);cursor:pointer;}
  .manager-chip{font-size:12px;font-weight:800;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .manager-count{font-size:10px;color:var(--text3);font-family:var(--mono);}
  .card-nav-inline{display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .card-nav-inline button{width:24px;height:24px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--accent);font-weight:900;cursor:pointer;}
  .task-board-quick-nav{justify-content:flex-start;gap:8px;}
  .task-mobile-drag-ghost{position:fixed;transform:translate(-50%,-50%);z-index:12000;pointer-events:none;background:var(--bg2);border:2px solid var(--accent);box-shadow:0 14px 40px rgba(255,123,172,.24);border-radius:14px;padding:10px 14px;font-family:var(--font);font-size:13px;font-weight:900;color:var(--text);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .task-period-card.drag-touch-over{border-color:var(--accent);background:var(--bg4);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.10);}

  .event-copy-icon{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(var(--accent-rgb),.12);}
  .event-copy-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .event-copy-clear{border:none;background:var(--bg3);color:var(--text2);border-radius:12px;padding:6px 10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:900;cursor:pointer;}
  .event-copy-clear:hover{background:var(--bg4);color:var(--text);}
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
  .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:var(--bg2);border-top:1.5px solid var(--border);z-index:110;align-items:stretch;}
  .mobile-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:transparent;border:none;color:var(--text2);font-family:var(--font);font-size:18px;cursor:pointer;padding:8px 0;}
  .mobile-nav-btn span{font-size:9px;font-weight:700;color:var(--text3);}
  .mobile-nav-btn:hover{background:var(--bg3);color:var(--accent);}

  /* Mobile hardening: prevent layout/input zoom and keep task board app-like. */
  html,body{max-width:100%;overflow-x:hidden;}
  *{box-sizing:border-box;}

  @media(max-width:768px){
    .sidebar{display:none;}
    .task-panel{display:none;position:fixed;inset:0;top:auto;height:70vh;z-index:150;border-radius:20px 20px 0 0;box-shadow:0 -8px 40px rgba(255,123,172,.2);width:100%!important;flex-direction:column;}
    .task-panel.mobile-open{display:flex;}
    .task-panel-resize-handle{display:none;}
    .task-panel-toggle{display:none;}
    .chat-panel{width:calc(100vw - 32px);right:16px;left:16px;bottom:86px;}
    .chat-fab{bottom:80px;}
    .stats-bar{overflow-x:auto;flex-wrap:nowrap;}
    .topbar-btn:not(.icon-only){display:none;}
    .mobile-nav{display:flex;}
    .content-area{padding-bottom:64px;}
    .desktop-sidebar-toggle{display:none!important;}
    .topbar{gap:6px;padding-left:10px;padding-right:10px;}
    .topbar-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    input,textarea,select{font-size:16px!important;}
    .tasks-page{width:100%;max-width:100vw;overflow-x:hidden;padding:12px 10px 78px!important;}
    .task-period-board{grid-template-columns:1fr!important;gap:10px;width:100%;max-width:100%;overflow:visible;}
    .task-period-card{width:100%;max-width:100%;min-width:0;min-height:auto!important;padding:12px;border-radius:18px;}
    .task-period-card-head,.task-period-card-sub{min-width:0;}
    .task-period-card-sub span{min-width:0;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .task-period-list{width:100%;min-width:0;}
    .task-card-with-move,.task-item{width:100%;max-width:100%;min-width:0;}
    .task-main,.task-title{min-width:0;overflow:hidden;text-overflow:ellipsis;}
    .tf-row{grid-template-columns:1fr!important;display:flex;flex-direction:column;gap:8px;}
    .tf-duration{width:100%;}   
  }
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
  .cal-toggleable{cursor:default;transition:opacity .15s;border-radius:8px;padding:5px 6px;margin:-2px -6px;gap:6px;}
  .cal-toggleable:hover{background:var(--bg3);}
  .cal-hidden{opacity:.45;}
  .cal-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:background .2s;}
  .cal-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;}
  .cal-eye{font-size:10px;color:var(--text3);flex-shrink:0;}
  .cal-add-btn,.cal-action-btn,.cal-visible-btn{border:0;background:transparent;color:var(--text3);font-family:var(--font);font-weight:900;cursor:pointer;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;}
  .cal-add-btn{width:22px;height:22px;background:var(--bg3);border:1px solid var(--border);font-size:14px;}
  .cal-add-btn:hover,.cal-action-btn:hover,.cal-visible-btn:hover{background:var(--bg4);color:var(--accent);}
  .cal-visible-btn{gap:5px;padding:3px 4px;}
  .cal-action-btn{width:20px;height:20px;font-size:13px;opacity:.75;}
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
  .entry-view-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;}
  .entry-view-body::-webkit-scrollbar{width:3px;}
  .entry-view-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
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
  .completed-tasks-section{background:linear-gradient(135deg,var(--bg2),var(--bg3));}
  .completed-task-list{display:flex;flex-direction:column;gap:8px;}
  .completed-task-item{display:flex;align-items:center;gap:10px;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:9px 11px;}
  .completed-task-check{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:12px;font-weight:900;box-shadow:0 4px 10px rgba(var(--accent-rgb),.18);}
  .completed-task-body{min-width:0;display:flex;flex-direction:column;gap:2px;}
  .completed-task-title{font-size:13px;font-weight:800;color:var(--text);line-height:1.25;}
  .completed-task-meta{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);}

  /* Memory Book scrapbook layer */
  .memory-entry-modal{width:720px;max-width:calc(100vw - 32px);}
  .memory-book-section{padding:16px 20px;background:linear-gradient(135deg,var(--bg2),var(--bg3));border-bottom:1px solid var(--border);}
  .memory-book-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}
  .memory-book-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;}
  .memory-book-title{font-size:15px;font-weight:900;color:var(--text);}
  .memory-book-sub{font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:700;margin-top:2px;}
  .memory-filter-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
  .memory-tag-row{display:flex;flex-wrap:wrap;gap:6px;}
  .memory-tag-chip{border:1.5px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:5px 10px;font-size:11px;font-family:var(--font);font-weight:800;cursor:pointer;transition:all .15s;}
  .memory-tag-chip:hover{border-color:var(--accent3);color:var(--accent);}
  .memory-tag-chip.selected{background:var(--bg4);border-color:var(--accent);color:var(--accent);}
  .memory-page-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;}
  .memory-page-card{position:relative;min-height:86px;border:1.5px solid var(--border);background:var(--bg2);border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 6px 18px rgba(var(--accent-rgb),.06);transition:all .16s;font-family:var(--font);}
  .memory-page-card:hover:not(.future){transform:translateY(-2px);border-color:var(--accent3);box-shadow:var(--shadow);}
  .memory-page-card.future{opacity:.35;cursor:default;}
  .memory-page-card.filtered-out{opacity:.28;filter:saturate(.45);box-shadow:none;}
  .memory-page-card.filter-match{border-color:var(--accent);box-shadow:0 8px 24px rgba(var(--accent-rgb),.12);}
  .memory-page-card.has-memory{background:linear-gradient(135deg,var(--bg4),var(--bg2));}
  .memory-page-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .memory-page-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.34));opacity:0;}
  .memory-page-cover + .memory-page-shade{opacity:1;}
  .memory-page-date{position:absolute;top:7px;left:8px;z-index:2;font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text3);background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.65);border-radius:999px;padding:2px 6px;}
  .dark .memory-page-date{background:rgba(35,19,41,.78);}
  .memory-page-main{position:absolute;left:8px;right:8px;top:31px;z-index:2;display:flex;align-items:center;justify-content:center;gap:5px;font-size:20px;font-weight:900;color:var(--text);}
  .memory-page-cover ~ .memory-page-main,.memory-page-cover ~ .memory-page-meta{color:white;text-shadow:0 1px 4px rgba(0,0,0,.34);}
  .memory-page-main strong{font-size:10px;font-family:var(--mono);background:rgba(255,255,255,.76);color:var(--accent);border-radius:999px;padding:2px 6px;text-shadow:none;}
  .memory-page-meta{position:absolute;left:8px;right:8px;bottom:7px;z-index:2;font-size:9px;font-family:var(--mono);font-weight:900;color:var(--text3);text-align:center;}
  .jec-cover{width:38px;height:38px;border-radius:12px;object-fit:cover;border:1.5px solid var(--border);box-shadow:0 4px 12px rgba(var(--accent-rgb),.12);}
  .jec-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;}
  .jec-tags span{font-size:10px;font-family:var(--mono);font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:2px 6px;}
  .memory-upload-box{display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px dashed var(--accent3);background:var(--bg3);border-radius:16px;padding:14px 12px;font-size:13px;font-weight:900;color:var(--accent);cursor:pointer;transition:all .15s;}
  .memory-upload-box:hover{background:var(--bg4);transform:translateY(-1px);}
  .memory-upload-box input{display:none;}
  .memory-upload-error{margin-top:8px;font-size:11px;font-weight:800;color:#E05D7F;background:rgba(255,123,172,.10);border:1px solid var(--border);border-radius:14px;padding:8px 10px;}
  .memory-upload-icon{font-size:20px;}
  .memory-photo-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;}
  .memory-photo-editor-card{background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:8px;overflow:hidden;}
  .memory-photo-editor-card.cover{border-color:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.12);}
  .memory-photo-editor-card img{width:100%;height:145px;object-fit:cover;border-radius:12px;display:block;background:var(--bg4);}
  .memory-photo-tools{display:flex;gap:6px;margin:7px 0;}
  .memory-photo-tools button,.scrapbook-add-row button,.scrapbook-block-tools button,.sticker-picker-row button,.photo-grid-select-row button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:10px;padding:5px 8px;font-size:10px;font-family:var(--font);font-weight:800;cursor:pointer;}
  .memory-photo-tools button:hover,.scrapbook-add-row button:hover,.scrapbook-block-tools button:hover{border-color:var(--accent3);color:var(--accent);}
  .memory-caption-input{margin-bottom:0;font-size:11px;padding:7px 9px;}
  .memory-cover-hero{position:relative;margin:0;border-bottom:1px solid var(--border);background:var(--bg3);}
  .memory-cover-hero img{width:100%;max-height:260px;object-fit:cover;display:block;}
  .memory-cover-hero div{position:absolute;left:14px;right:14px;bottom:12px;background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.65);border-radius:14px;padding:8px 10px;font-size:12px;font-weight:800;color:var(--text);backdrop-filter:blur(8px);}
  .dark .memory-cover-hero div{background:rgba(35,19,41,.78);}
  .memory-photo-view-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}
  .memory-photo-view-card{margin:0;background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:7px;}
  .memory-photo-view-card img{width:100%;height:150px;object-fit:cover;border-radius:12px;display:block;}
  .memory-photo-view-card figcaption{font-size:11px;color:var(--text2);font-weight:800;text-align:center;margin-top:6px;line-height:1.35;}
  .highlight-view-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
  .highlight-view-grid div{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:9px;}
  .highlight-view-grid span{display:block;font-size:9px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:900;margin-bottom:4px;}
  .highlight-view-grid strong{font-size:12px;color:var(--text);line-height:1.4;}
  .scrapbook-editor-section{background:linear-gradient(135deg,var(--bg2),var(--bg3));}
  .scrapbook-add-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
  .scrapbook-block-editor-list{display:flex;flex-direction:column;gap:10px;}
  .scrapbook-block-editor{border:1.5px solid var(--border);background:var(--bg2);border-radius:16px;padding:10px;}
  .scrapbook-block-tools{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
  .scrapbook-block-tools span{font-size:10px;font-family:var(--mono);font-weight:900;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);}
  .scrapbook-block-tools div{display:flex;gap:5px;}
  .sticker-picker-row{display:flex;flex-wrap:wrap;gap:6px;}
  .sticker-picker-row button{font-size:18px;padding:6px 8px;}
  .sticker-picker-row button.selected{border-color:var(--accent);background:var(--bg4);}
  .photo-grid-select-row{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:8px;}
  .photo-grid-select-row button{padding:2px;border-radius:10px;opacity:.45;}
  .photo-grid-select-row button.selected{opacity:1;border-color:var(--accent);background:var(--bg4);}
  .photo-grid-select-row img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block;}
  .scrapbook-empty-note{font-size:12px;color:var(--text3);font-weight:700;text-align:center;border:1.5px dashed var(--border);border-radius:14px;padding:13px;background:var(--bg3);}
  .scrapbook-view-list{display:flex;flex-direction:column;gap:10px;}
  .scrapbook-view-block{background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:12px;}
  .scrapbook-view-block blockquote{margin:0;font-size:15px;line-height:1.55;color:var(--text);font-weight:800;font-style:italic;border-left:3px solid var(--accent);padding-left:12px;}
  .scrapbook-sticker-view{text-align:center;font-size:42px;line-height:1.1;filter:drop-shadow(0 5px 12px rgba(var(--accent-rgb),.18));}
  .scrapbook-divider-preview{text-align:center;font-size:14px;color:var(--accent);font-family:var(--mono);font-weight:900;letter-spacing:6px;padding:6px 0;}
  .scrapbook-photo-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .scrapbook-grid-caption{text-align:center;font-size:12px;font-weight:800;color:var(--text2);margin-top:8px;}

  .bloom-room-page{height:100%;overflow:auto;padding:20px;background:var(--bg);}
  .bloom-room-page .checkin-rhythm-card{margin-top:16px;}
  .bloom-room-page .game-dashboard{padding:0;}
  .bloom-room-subtitle{font-size:12px;font-weight:700;color:var(--text3);margin-top:4px;}

  /* ── Cozy game layer ─────────────────────────────────────────────────────── */
  .level-card{margin:10px 12px 8px;background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1.5px solid var(--border);border-radius:16px;padding:12px;box-shadow:0 8px 24px rgba(var(--accent-rgb),.08);}
  .level-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
  .level-label{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:800;}
  .level-title{font-size:14px;font-weight:900;color:var(--text);line-height:1.2;}
  .level-xp{font-size:10px;font-family:var(--mono);font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:3px 7px;white-space:nowrap;}
  .level-track{height:9px;background:var(--bg4);border-radius:999px;border:1px solid var(--border);overflow:hidden;}
  .level-track.mini{height:7px;margin-top:10px;}
  .level-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;box-shadow:0 0 14px rgba(var(--accent-rgb),.24);transition:width .25s ease;}
  .level-meta{display:flex;justify-content:space-between;gap:8px;margin-top:7px;font-size:10px;color:var(--text3);font-family:var(--mono);font-weight:700;}
  .game-dashboard{display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:12px;padding:0 20px 12px;background:var(--bg);}
  .game-dashboard.compact{max-width:980px;margin:0 auto 12px;padding:0;grid-template-columns:repeat(2,minmax(220px,1fr));}
  .daily-quests-card,.badges-card,.game-soft-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:18px;padding:13px 14px;box-shadow:var(--shadow);min-width:0;}
  .game-stack{display:flex;flex-direction:column;gap:12px;min-width:0;}
  .game-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;}
  .game-card-title{font-size:13px;font-weight:900;color:var(--text);}
  .game-card-sub{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);}
  .score-pill{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:4px 8px;white-space:nowrap;}
  .quest-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
  .quest-item{display:flex;align-items:center;gap:9px;border:1.5px solid var(--border);background:var(--bg3);border-radius:14px;padding:8px 9px;min-width:0;}
  .quest-item.done{background:linear-gradient(135deg,var(--bg4),var(--bg3));border-color:var(--accent3);}
  .quest-icon{width:24px;height:24px;border-radius:9px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--accent);flex-shrink:0;}
  .quest-item.done .quest-icon{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-color:transparent;}
  .quest-body{min-width:0;flex:1;}
  .quest-title{font-size:12px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .quest-desc{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .quest-xp{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--accent);white-space:nowrap;}
  .badge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
  .badge-chip{display:flex;align-items:center;gap:7px;border:1.5px solid var(--border);background:var(--bg3);border-radius:14px;padding:8px;min-width:0;opacity:.48;}
  .badge-chip.unlocked{opacity:1;background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .badge-icon{width:22px;height:22px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
  .badge-name{font-size:11px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mascot-stage{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--bg4),var(--bg3));border:1px solid var(--border);border-radius:16px;padding:11px;}
  .mascot-stage-icon{width:48px;height:48px;border-radius:18px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 20px rgba(var(--accent-rgb),.12);animation:mascotBounce 2.8s ease-in-out infinite;}
  .mascot-stage.glowing .mascot-stage-icon{box-shadow:0 0 24px rgba(var(--accent-rgb),.32);}
  .mascot-stage-body{min-width:0;}
  .mascot-stage-name{font-size:14px;font-weight:900;color:var(--text);margin-bottom:3px;}
  .mascot-stage-note{font-size:11px;line-height:1.35;color:var(--text2);font-weight:700;}
  .skill-list{display:flex;flex-direction:column;gap:8px;}
  .skill-row{display:flex;flex-direction:column;gap:5px;}
  .skill-main{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:900;color:var(--text);}
  .skill-icon{width:22px;height:22px;border-radius:8px;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:12px;}
  .skill-name{flex:1;min-width:0;}
  .skill-level{font-family:var(--mono);font-size:10px;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:2px 6px;}
  .skill-track{height:6px;background:var(--bg4);border:1px solid var(--border);border-radius:999px;overflow:hidden;}
  .skill-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;}
  .weekly-label,.garden-label{font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:800;margin-bottom:8px;}
  .weekly-mini-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;}
  .weekly-mini-grid div{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:8px 6px;text-align:center;display:flex;flex-direction:column;gap:2px;}
  .weekly-mini-grid strong{font-size:14px;color:var(--text);font-weight:900;}
  .weekly-mini-grid span{font-size:9px;color:var(--text3);font-family:var(--mono);font-weight:800;}
  .weekly-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;}
  .weekly-dot{height:8px;border-radius:999px;background:var(--bg4);border:1px solid var(--border);}
  .weekly-dot.rank-s{background:linear-gradient(90deg,#FFD76B,#FFB870);}
  .weekly-dot.rank-a{background:linear-gradient(90deg,var(--accent),var(--accent2));}
  .weekly-dot.rank-b{background:#B8F0E0;}
  .weekly-dot.rank-c{background:#FFD6A8;}
  .weekly-dot.rank-d{background:var(--bg4);}
  .theme-unlock-list{display:flex;flex-wrap:wrap;gap:6px;}
  .theme-unlock-pill{display:flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:999px;padding:5px 8px;font-size:10px;font-family:var(--mono);font-weight:900;}
  .theme-unlock-pill.unlocked{background:var(--bg4);color:var(--accent);}
  .theme-unlock-pill.locked{background:var(--bg3);color:var(--text3);opacity:.65;}
  .theme-swatch-btn.locked{opacity:.58;cursor:not-allowed;filter:saturate(.55);}
  .theme-swatch-lockline{font-size:8px;color:var(--text3);font-family:var(--mono);font-weight:800;margin-top:1px;line-height:1.15;text-align:center;}
  .theme-swatch-lock{position:absolute;top:6px;right:6px;font-size:12px;}
  .garden-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;}
  .garden-dow span{text-align:center;font-size:9px;color:var(--text3);font-family:var(--mono);font-weight:900;}
  .garden-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
  .garden-cell{position:relative;min-height:32px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .garden-cell.blank{background:transparent;border-color:transparent;}
  .garden-cell.future{opacity:.35;}
  .garden-cell.sprout{background:linear-gradient(135deg,var(--bg3),var(--bg4));}
  .garden-cell.bud,.garden-cell.bloom,.garden-cell.big,.garden-cell.gold{background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .garden-cell.gold{box-shadow:0 0 0 1px rgba(var(--accent-rgb),.10),0 8px 18px rgba(var(--accent-rgb),.10);}
  .garden-bloom{font-size:15px;line-height:1;}
  .garden-day{position:absolute;right:4px;bottom:2px;font-size:8px;font-family:var(--mono);font-weight:900;color:var(--text3);}
  .daily-score-section{background:linear-gradient(135deg,var(--bg3),var(--bg2));}
  .daily-score-card{display:flex;align-items:center;gap:14px;background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:12px;}
  .daily-score-main{min-width:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg4);border:1px solid var(--border);border-radius:14px;padding:8px;}
  .daily-score-rank{font-size:24px;font-weight:900;color:var(--accent);line-height:1;}
  .daily-score-num{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text3);margin-top:3px;}
  .daily-score-lines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px;font-size:11px;font-weight:800;color:var(--text2);flex:1;}
  .mission-list,.combo-list,.boss-list,.leaderboard-list{display:flex;flex-direction:column;gap:7px;}
  .mission-item,.boss-item{background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:8px 9px;}
  .mission-item.done{background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .mission-top,.boss-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;font-weight:900;color:var(--text);margin-bottom:6px;}
  .mission-top span,.boss-top span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .mission-top strong,.boss-top strong{font-size:10px;font-family:var(--mono);color:var(--accent);white-space:nowrap;}
  .mission-track,.boss-track{height:6px;background:var(--bg4);border:1px solid var(--border);border-radius:999px;overflow:hidden;}
  .mission-fill,.boss-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;}
  .mission-reward,.boss-meta{font-size:9px;font-family:var(--mono);font-weight:800;color:var(--text3);margin-top:5px;}
  .combo-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
  .combo-chip{display:flex;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:8px;opacity:.52;min-width:0;}
  .combo-chip.done{opacity:1;background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .combo-chip>span{width:22px;height:22px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent);font-weight:900;}
  .combo-chip strong{display:block;font-size:10px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .combo-chip small{display:block;font-size:8.5px;font-family:var(--mono);font-weight:800;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .streak-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}
  .streak-pill{display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:8px 4px;text-align:center;}
  .streak-pill span{font-size:14px;}.streak-pill strong{font-size:14px;font-weight:900;color:var(--accent);}.streak-pill small{font-size:8.5px;font-family:var(--mono);font-weight:800;color:var(--text3);}
  .personality-main{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--bg4),var(--bg3));border:1px solid var(--border);border-radius:16px;padding:12px;}
  .personality-main>span{width:44px;height:44px;border-radius:16px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:25px;flex-shrink:0;}
  .personality-main strong{display:block;font-size:14px;font-weight:900;color:var(--text);margin-bottom:3px;}.personality-main p{font-size:11px;line-height:1.35;color:var(--text2);font-weight:700;margin:0;}
  .leaderboard-row{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:13px;padding:8px;font-size:10px;font-family:var(--mono);font-weight:800;color:var(--text3);}
  .leaderboard-row strong{font-size:11px;font-family:var(--font);font-weight:900;color:var(--text);}.leader-place{color:var(--accent);font-weight:900;}
  .empty-game-note{font-size:11px;line-height:1.45;color:var(--text2);font-weight:700;background:var(--bg3);border:1.5px dashed var(--border);border-radius:14px;padding:12px;text-align:center;}
  .eod-rank-card{background:linear-gradient(135deg,var(--bg4),var(--bg2));border:1.5px solid var(--border);border-radius:16px;padding:12px;margin-bottom:12px;}
  .eod-rank-main{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}.eod-rank-main strong{font-size:22px;color:var(--accent);font-weight:900;}.eod-rank-main span{font-size:11px;font-family:var(--mono);font-weight:900;color:var(--text3);}
  .eod-rank-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px;}.eod-rank-meta span{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text2);background:var(--bg3);border:1px solid var(--border);border-radius:999px;padding:4px 7px;}
  .eod-rank-note{font-size:12px;font-weight:800;color:var(--text);}

  @media(max-width:1280px){.game-dashboard{grid-template-columns:repeat(2,minmax(220px,1fr));}.quest-list{grid-template-columns:1fr;}}
  @media(max-width:1080px){.game-dashboard,.game-dashboard.compact{grid-template-columns:1fr;}.weekly-mini-grid{grid-template-columns:repeat(2,1fr);}}

  @media(max-width:768px){
    .combo-list{grid-template-columns:1fr;}
    .streak-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .leaderboard-row{grid-template-columns:auto 1fr auto;font-size:9px;}
    .leaderboard-row span:last-child{grid-column:2 / -1;}
    .mission-top,.boss-top{align-items:flex-start;}
    .eod-rank-main{align-items:flex-start;flex-direction:column;gap:3px;}
  }




  /* ── Bloom Room mobile optimisation ─────────────────────────────────────── */
  @media(max-width:768px){
    .bloom-room-page{
      height:calc(100dvh - 60px);
      padding:12px 10px calc(84px + env(safe-area-inset-bottom));
      overflow-y:auto;
      -webkit-overflow-scrolling:touch;
      background:var(--bg);
    }
    .bloom-room-page .journal-header{
      position:sticky;
      top:0;
      z-index:8;
      margin:-12px -10px 10px;
      padding:12px 12px 10px;
      background:rgba(255,255,255,.82);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
      border-bottom:1px solid var(--border);
      align-items:center;
    }
    .dark .bloom-room-page .journal-header{background:rgba(35,19,41,.82);}
    .bloom-room-page .journal-title{font-size:17px;line-height:1.15;}
    .bloom-room-subtitle{font-size:10.5px;margin-top:2px;}
    .bloom-room-page .journal-streak{font-size:10px;padding:4px 8px;white-space:nowrap;}
    .bloom-room-page .game-dashboard{
      display:flex;
      flex-direction:column;
      gap:10px;
      padding:0;
      background:transparent;
    }
    .bloom-room-page .daily-quests-card,
    .bloom-room-page .badges-card,
    .bloom-room-page .game-soft-card{
      border-radius:16px;
      padding:11px 10px;
      box-shadow:0 8px 22px rgba(var(--accent-rgb),.08);
    }
    .bloom-room-page .game-card-head{gap:8px;margin-bottom:8px;align-items:flex-start;}
    .bloom-room-page .game-card-title{font-size:12.5px;line-height:1.2;}
    .bloom-room-page .game-card-sub,
    .bloom-room-page .score-pill{font-size:9px;padding:3px 7px;}
    .bloom-room-page .mascot-stage{gap:10px;padding:10px;border-radius:15px;}
    .bloom-room-page .mascot-stage-icon{width:42px;height:42px;border-radius:15px;font-size:24px;}
    .bloom-room-page .mascot-stage-name{font-size:13px;}
    .bloom-room-page .mascot-stage-note{font-size:10.5px;line-height:1.35;}
    .bloom-room-page .quest-list{grid-template-columns:1fr;gap:6px;}
    .bloom-room-page .quest-item{padding:7px 8px;gap:7px;border-radius:13px;}
    .bloom-room-page .quest-icon{width:22px;height:22px;border-radius:8px;font-size:11px;}
    .bloom-room-page .quest-title{font-size:11.5px;white-space:normal;line-height:1.2;}
    .bloom-room-page .quest-desc{font-size:9.5px;white-space:normal;line-height:1.25;}
    .bloom-room-page .quest-xp{font-size:9px;}
    .bloom-room-page .skill-list{gap:7px;}
    .bloom-room-page .skill-main{gap:6px;font-size:11.5px;}
    .bloom-room-page .skill-icon{width:20px;height:20px;border-radius:7px;font-size:11px;}
    .bloom-room-page .skill-level{font-size:9px;padding:2px 5px;}
    .bloom-room-page .weekly-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}
    .bloom-room-page .weekly-mini-grid div{padding:7px 6px;border-radius:11px;}
    .bloom-room-page .weekly-mini-grid strong{font-size:13px;}
    .bloom-room-page .weekly-mini-grid span{font-size:8.5px;}
    .bloom-room-page .weekly-bars{gap:4px;}
    .bloom-room-page .weekly-dot{height:7px;}
    .bloom-room-page .garden-label,
    .bloom-room-page .weekly-label{font-size:10px;margin-bottom:7px;}
    .bloom-room-page .garden-dow{gap:3px;}
    .bloom-room-page .garden-grid{gap:3px;}
    .bloom-room-page .garden-cell{min-height:29px;border-radius:9px;}
    .bloom-room-page .garden-bloom{font-size:14px;}
    .bloom-room-page .garden-day{font-size:7.5px;right:3px;bottom:2px;}
    .bloom-room-page .badge-grid{grid-template-columns:1fr;gap:6px;}
    .bloom-room-page .badge-chip{padding:7px;border-radius:13px;}
    .bloom-room-page .badge-icon{width:21px;height:21px;font-size:12px;}
    .bloom-room-page .badge-name{font-size:10.5px;}
    .bloom-room-page .game-stack{gap:10px;}
    .bloom-room-page .theme-unlock-list{gap:5px;}
    .bloom-room-page .theme-unlock-pill{font-size:9px;padding:4px 7px;}
  }
  @media(max-width:390px){
    .bloom-room-page{padding-left:8px;padding-right:8px;}
    .bloom-room-page .journal-header{margin-left:-8px;margin-right:-8px;}
    .bloom-room-page .garden-cell{min-height:26px;border-radius:8px;}
    .bloom-room-page .garden-bloom{font-size:13px;}
    .bloom-room-page .game-card-head{flex-wrap:wrap;}
  }

  /* ── Feature wiring additions (keeps existing aesthetic) ─────────────────── */
  .all-day-strip{display:flex;align-items:flex-start;gap:8px;background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;padding:8px 10px;margin-bottom:8px;}
  .all-day-label,.all-day-mini-label{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;}
  .all-day-list{display:flex;gap:6px;flex-wrap:wrap;min-width:0;}
  .all-day-chip,.week-all-day-chip{border:1px solid var(--border);border-radius:10px;padding:4px 8px;font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--bg3);}
  .week-all-day-row{display:grid;grid-template-columns:48px repeat(7,1fr);border-bottom:1px solid var(--border);background:var(--bg2);min-height:34px;}
  .week-all-day-cell{min-width:0;border-left:1px solid var(--border);padding:4px;display:flex;gap:3px;flex-direction:column;}
  .week-all-day-chip{width:100%;text-align:left;padding:3px 6px;font-size:10px;}
  .startup-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
  .startup-grid>div{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:12px;text-align:center;}
  .startup-grid strong{display:block;font-size:20px;color:var(--accent);font-weight:900;}
  .startup-grid span{font-size:10px;color:var(--text3);font-family:var(--mono);font-weight:700;text-transform:uppercase;}
  .startup-next{background:var(--bg4);border:1px solid var(--accent3);border-radius:12px;padding:10px 12px;color:var(--text2);font-size:13px;font-weight:800;}
  .plan-context-card{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 10px;}
  .plan-context-card>div{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:11px 12px;display:flex;flex-direction:column;gap:3px;}
  .plan-context-card strong{font-size:13px;color:var(--text);font-weight:900;}
  .plan-context-card span{font-size:11px;color:var(--text2);font-weight:700;}
  .planning-mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0;}
  .planning-mode-btn{border:1.5px solid var(--border);background:var(--bg2);border-radius:14px;padding:10px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;cursor:pointer;color:var(--text);font-family:var(--font);}
  .planning-mode-btn span{font-size:17px;}
  .planning-mode-btn strong{font-size:12px;font-weight:900;}
  .planning-mode-btn small{font-size:10px;color:var(--text2);font-weight:700;line-height:1.25;}
  .planning-mode-btn.active{border-color:var(--accent);background:var(--accent2);box-shadow:0 8px 18px rgba(255,123,172,.12);}

  .plan-task-picker{background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:11px 12px;margin:10px 0;display:flex;flex-direction:column;gap:10px;}
  .plan-task-picker-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
  .plan-task-picker-head>div:first-child{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .plan-task-picker-head strong{font-size:13px;font-weight:900;color:var(--text);}
  .plan-task-picker-head span{font-size:11px;font-weight:700;color:var(--text2);}
  .plan-task-picker-head>div:last-child{display:flex;gap:6px;flex-shrink:0;}
  .plan-task-picker-list{display:grid;gap:7px;max-height:210px;overflow:auto;padding-right:2px;}
  .plan-task-choice{display:flex;align-items:center;gap:9px;border:1px solid var(--border);background:var(--bg3);border-radius:13px;padding:9px 10px;cursor:pointer;color:var(--text);}
  .plan-task-choice.selected{border-color:var(--accent3);background:var(--bg4);}
  .plan-task-choice input{width:16px;height:16px;accent-color:var(--accent);flex-shrink:0;}
  .plan-task-choice span{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .plan-task-choice strong{font-size:12px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .plan-task-choice small{font-size:10px;font-weight:800;color:var(--text2);}
  .plan-soft-blocks{display:flex;flex-direction:column;gap:4px;margin-top:8px;background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:10px 12px;color:var(--text2);}
  .plan-soft-blocks strong{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.7px;color:var(--text3);}
  .plan-soft-blocks span{font-size:12px;font-weight:800;color:var(--text2);}
  .plan-skip-note{background:var(--bg4);border:1px dashed var(--accent3);border-radius:14px;padding:10px 12px;color:var(--text2);font-size:12px;font-weight:800;margin-top:8px;}
  .plan-row.locked{box-shadow:inset 0 0 0 1.5px var(--accent3);background:var(--bg4);}
  .day-plan-footer{gap:10px;align-items:flex-start;}
  .carryover-actions-wrap{flex-wrap:wrap;}
  .carryover-actions-wrap button:disabled,.day-plan-footer button:disabled{opacity:.45;cursor:not-allowed;}
  .recurrence-editor{width:100%;display:flex;flex-direction:column;gap:8px;}
  .recurrence-custom{display:flex;flex-direction:column;gap:6px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:8px;}
  .weekday-picker{display:flex;gap:5px;flex-wrap:wrap;}
  .weekday-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg2);color:var(--text2);font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer;}
  .weekday-btn.active{background:var(--accent);border-color:var(--accent);color:white;}
  .tasks-page{height:100%;overflow:auto;padding:20px;}
  .tasks-page .task-period-board{margin-top:16px;}
  .task-panel.standalone{display:flex;position:relative;width:100%;height:auto;max-width:880px;border-radius:20px;margin:0 auto;border:1.5px solid var(--border);box-shadow:var(--shadow);}
  .task-panel.standalone .task-panel-inner{width:100%;}
  .task-panel.standalone .task-list{max-height:none;}
  @media(max-width:768px){
    body{overflow:hidden;}
    .main{margin-left:0;width:100%;min-width:0;}
    .app{padding-bottom:60px;}
    .modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;max-height:calc(100vh - 96px)!important;overflow-y:auto;}
    .startup-grid{grid-template-columns:repeat(2,1fr);}
    .plan-context-card,.planning-mode-grid{grid-template-columns:1fr;}
    .plan-task-picker-head{flex-direction:column;align-items:stretch;}
    .plan-task-picker-head>div:last-child{justify-content:flex-end;}
    .plan-task-picker-list{max-height:180px;}
    .modal-overlay,.settings-overlay{padding:10px;align-items:center!important;}
    .week-timetable,.day-view,.month-view{min-width:0;}
    .task-panel:not(.standalone){display:none!important;}
    .task-panel:not(.standalone).mobile-open{display:flex!important;}
    .tasks-page{padding:14px 12px 74px;}
    .task-panel.standalone{height:auto;min-height:calc(100vh - 170px);}
    .sidebar{display:flex!important;position:fixed;top:0;bottom:60px;left:0;width:230px!important;z-index:160;box-shadow:8px 0 40px rgba(255,123,172,.18);transform:translateX(0);transition:transform .25s ease,width .25s ease;}
    .sidebar.closed{width:230px!important;transform:translateX(-105%);}
    .sidebar-logo{padding:16px 20px;}
    .sidebar-nav{overflow-y:auto;}
    .desktop-sidebar-toggle{display:none!important;}
    .tasks-page{overflow-x:hidden!important;}
    .task-period-board{grid-template-columns:1fr!important;}
    .task-period-card{min-width:0!important;width:100%!important;}
  }


  /* ── Mobile cleanup + TimeTree-style month view ─────────────────────────── */
  .stats-mini-note{font-size:11px;color:var(--text3);font-family:var(--mono);background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:8px 10px;margin-top:10px;line-height:1.35;}
  @media(max-width:768px){
    .keyboard-shortcuts-btn{display:none!important;}
    .calendar-pane.view-month{padding:0!important;background:var(--bg2);overflow-y:auto;}
    .calendar-pane.view-month .month-view{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:none!important;background:var(--bg2);min-width:0;width:100%;}
    .calendar-pane.view-month .month-header{position:sticky;top:0;z-index:6;background:var(--bg2);border:none!important;border-bottom:1px solid rgba(255,123,172,.16)!important;padding:9px 0 7px;text-align:center;font-size:10px;letter-spacing:.5px;color:var(--text3);}
    .calendar-pane.view-month .month-day{min-height:118px;padding:6px 3px 5px;border:none!important;border-bottom:1px solid rgba(255,123,172,.12)!important;background:var(--bg2)!important;border-radius:0!important;gap:3px;overflow:hidden;}
    .calendar-pane.view-month .month-day:hover{background:var(--bg2)!important;}
    .calendar-pane.view-month .month-day.other{opacity:.35;pointer-events:none;background:var(--bg)!important;}
    .calendar-pane.view-month .month-day.today-cell{background:rgba(var(--accent-rgb),.06)!important;}
    .calendar-pane.view-month .month-day-num{text-align:center;min-height:25px;margin:0 0 2px;font-size:15px;font-family:var(--font);font-weight:700;color:var(--text2);}
    .calendar-pane.view-month .today-circle{width:28px;height:28px;border-radius:50%;background:var(--text);color:var(--bg2);font-size:14px;box-shadow:0 4px 12px rgba(74,40,64,.16);}
    .calendar-pane.view-month .month-heat-bar{display:none!important;}
    .calendar-pane.view-month .month-day-events{gap:3px;min-height:0;overflow:hidden;}
    .calendar-pane.view-month .month-event-row{display:flex;justify-content:center;text-align:center;border-left:0!important;border-radius:4px!important;padding:2px 3px;min-height:17px;font-size:10px;line-height:1.15;font-weight:900;box-shadow:none;}
    .calendar-pane.view-month .month-event-time{display:none!important;}
    .calendar-pane.view-month .month-event-name{width:100%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .calendar-pane.view-month .month-more{text-align:center;font-size:9px;padding:1px 0;color:var(--text3);}
    .calendar-pane.view-month + .task-panel{display:none!important;}
  }

  @media(max-width:768px){
    .journal-page{padding-bottom:70px;}
    .journal-header{padding:12px 12px 10px;gap:8px;position:sticky;top:0;z-index:12;background:rgba(255,255,255,.84);backdrop-filter:blur(14px);}
    .dark .journal-header{background:rgba(35,19,41,.84);}
    .journal-title{font-size:16px;}
    .journal-streak{font-size:10px;padding:4px 7px;}
    .journal-today-btn{font-size:10.5px;padding:6px 9px;}
    .mood-stats-bar{padding:8px 12px;}
    .memory-book-section,.journal-entries-section{padding:12px;}
    .memory-book-head{align-items:flex-start;}
    .memory-book-actions{gap:5px;flex-wrap:wrap;justify-content:flex-end;}
    .memory-book-title{font-size:14px;}
    .memory-book-sub{font-size:10px;}
    .memory-filter-row{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px;}
    .memory-tag-chip{font-size:10px;padding:4px 8px;white-space:nowrap;}
    .memory-page-grid{gap:4px;}
    .memory-page-card{min-height:68px;border-radius:12px;}
    .memory-page-date{top:5px;left:5px;font-size:8px;padding:1px 5px;}
    .memory-page-main{top:26px;font-size:16px;}
    .memory-page-main strong{font-size:8px;padding:1px 5px;}
    .memory-page-meta{font-size:7.5px;bottom:5px;}
    .journal-entry-card{padding:11px;border-radius:14px;gap:9px;}
    .jec-left{width:34px;}
    .jec-cover{width:34px;height:34px;border-radius:10px;}
    .entry-modal.memory-entry-modal{width:calc(100vw - 20px)!important;max-height:calc(100dvh - 84px)!important;}
    .memory-photo-editor-grid,.memory-photo-view-grid,.highlight-view-grid{grid-template-columns:1fr;}
    .memory-photo-editor-card img,.memory-photo-view-card img{height:170px;}
    .photo-grid-select-row{grid-template-columns:repeat(4,1fr);}
    .scrapbook-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .scrapbook-block-tools{align-items:flex-start;flex-direction:column;}
    .scrapbook-block-tools div{flex-wrap:wrap;}
    .memory-cover-hero img{max-height:220px;}
  }


  /* ── Memory Book Phase 4/5: backgrounds, sticker packs, lock, search, export ── */
  .memory-entry-modal,.entry-view-modal{background-size:cover;background-position:center;background-repeat:no-repeat;}
  .memory-bg-choice{display:flex;align-items:center;gap:7px;padding:7px 9px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.6);color:var(--text2);font-family:var(--font);font-size:11px;font-weight:900;cursor:pointer;}
  .memory-bg-choice.selected{border-color:var(--accent);background:rgba(var(--accent-rgb),.12);color:var(--accent);box-shadow:0 4px 14px rgba(var(--accent-rgb),.12);}
  .memory-background-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
  .memory-bg-swatch{width:28px;height:28px;border-radius:10px;border:1px solid var(--border);background:linear-gradient(135deg,var(--bg3),var(--bg4));background-size:cover;background-position:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.55);flex:0 0 auto;}
  .sticker-asset-picker-row{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:8px 0;}
  .sticker-asset-picker-row button{height:54px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.65);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:5px;}
  .sticker-asset-picker-row button.selected{border-color:var(--accent);background:rgba(var(--accent-rgb),.12);box-shadow:0 6px 18px rgba(var(--accent-rgb),.14);}
  .sticker-asset-picker-row img{max-width:100%;max-height:100%;object-fit:contain;display:block;}
  .sticker-pack-list{display:grid;gap:10px;margin:8px 0;}
  .sticker-pack-section{display:grid;gap:6px;}
  .sticker-pack-title{font-size:11px;font-weight:900;color:var(--text2);letter-spacing:.02em;text-transform:uppercase;}
  .sticker-preview-chip{height:54px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.65);display:flex;align-items:center;justify-content:center;padding:5px;position:relative;}
  .sticker-asset-picker-row button,.sticker-preview-chip{position:relative;overflow:hidden;}
  .sticker-choice-label{position:absolute;right:5px;bottom:4px;min-width:16px;height:16px;border-radius:999px;background:rgba(255,255,255,.86);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:var(--text2);line-height:1;}
  .scrapbook-sticker-view.asset{font-size:0;display:flex;justify-content:center;}
  .scrapbook-sticker-view.asset img{width:min(140px,45vw);height:auto;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(74,40,64,.12));}
  .memory-search-section,.memory-throwback-section{padding:12px 16px;border-bottom:1px solid var(--border);}
  .memory-search-input{width:100%;border:1px solid var(--border);border-radius:18px;padding:11px 14px;background:var(--bg2);color:var(--text);font-family:var(--font);font-size:13px;font-weight:700;outline:none;}
  .memory-search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.12);}
  .memory-throwback-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}
  .memory-throwback-card{border:1px solid var(--border);border-radius:18px;background:var(--bg2);padding:10px;text-align:left;display:grid;gap:6px;color:var(--text);font-family:var(--font);cursor:pointer;box-shadow:0 8px 20px rgba(74,40,64,.06);}
  .memory-throwback-card img{width:100%;height:74px;object-fit:cover;border-radius:14px;display:block;}
  .memory-throwback-card span{height:74px;border-radius:14px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:28px;}
  .memory-throwback-card strong{font-size:12px;color:var(--accent);}
  .memory-throwback-card small{font-size:11px;color:var(--text2);line-height:1.3;}
  @media(max-width:768px){
    .memory-background-picker{grid-template-columns:repeat(2,minmax(0,1fr));}
    .sticker-asset-picker-row{grid-template-columns:repeat(4,1fr);}
    .memory-throwback-row{grid-template-columns:1fr;}
    .memory-throwback-card{grid-template-columns:58px 1fr;align-items:center;}
    .memory-throwback-card img,.memory-throwback-card span{width:58px;height:58px;grid-row:span 2;}
    .memory-search-section,.memory-throwback-section{padding:10px 12px;}
    .journal-header-actions{gap:6px;}
  }


  @media(max-width:768px){
    .event-copy-bar{bottom:78px;left:10px;right:10px;transform:none;max-width:none;border-radius:16px;font-size:12px;padding:9px 10px;}
    .event-copy-text{white-space:normal;line-height:1.25;}
  }

  /* ── Final UI polish ─────────────────────────────────────────────────────── */
  .event-block,.wt-event,.month-event-row{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;}
  .tempo-dragging,.tempo-dragging *{user-select:none!important;-webkit-user-select:none!important;-webkit-touch-callout:none!important;}
  .event-block{border-left-width:3px!important;border-left-style:solid!important;box-shadow:none!important;}
  .event-title{color:inherit!important;text-shadow:none!important;}
  .event-block::before{display:none!important;}
  .bloom-collapse .bloom-collapse-body{display:flex;flex-direction:column;gap:12px;}
  .bloom-collapse .bloom-collapse-head{cursor:default;}
  .bloom-collapse .bloom-collapse-mark{display:none;}
  .xp-breakdown-card{display:none!important;}

  @media(max-width:768px){
    .bloom-collapse:not(.open) .bloom-collapse-body{display:none;}
    .bloom-collapse .bloom-collapse-head{cursor:pointer;}
    .bloom-collapse .bloom-collapse-mark{display:inline;}
    .settings-overlay{align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;overscroll-behavior:contain;padding:10px!important;-webkit-overflow-scrolling:touch;}
    .settings-panel{height:calc(100dvh - 20px)!important;max-height:calc(100dvh - 20px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .settings-body{flex:1!important;max-height:none!important;overflow-y:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
  }


  /* ── Mobile sticky opaque page headers ───────────────────────────────────── */
  @media(max-width:768px){
    /* Keep every page header pinned while scrolling on mobile. Use solid surfaces
       so content never shows through underneath the header. */
    .topbar{
      position:sticky!important;
      top:0!important;
      z-index:80!important;
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:var(--shadow)!important;
    }
    .stats-bar{
      position:sticky!important;
      top:58px!important;
      z-index:70!important;
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
    .journal-header,
    .bloom-room-page .journal-header{
      position:sticky!important;
      top:0!important;
      z-index:90!important;
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:0 1px 0 var(--border), var(--shadow-sm)!important;
    }
    .dark .journal-header,
    .dark .bloom-room-page .journal-header{
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
    .task-board-nav{
      position:sticky!important;
      top:0!important;
      z-index:75!important;
      background:var(--bg)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:0 1px 0 var(--border)!important;
    }
    .settings-header,
    .modal-header,
    .entry-modal-header{
      position:sticky!important;
      top:0!important;
      z-index:95!important;
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:0 1px 0 var(--border)!important;
    }
    .settings-panel,
    .modal,
    .entry-modal:not(.memory-entry-modal),
    .templates-panel,
    .search-modal{
      background:var(--bg2)!important;
    }
    .entry-modal.memory-entry-modal,
    .entry-view-modal{
      background-size:cover!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
    }
    .calendar-pane.view-month .month-header,
    .wt-header{
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
  }


  /* ── Final interaction polish: activity reorder + positioned stickers ───── */
  .draggable-manager-row{cursor:grab;user-select:none;}
  .draggable-manager-row.dragging{opacity:.55;border-color:var(--accent);background:var(--bg4);}
  .drag-handle{font-family:var(--mono);font-weight:900;color:var(--text3);padding:0 4px;cursor:grab;letter-spacing:-2px;}
  .sticker-position-pad{height:180px;border:1.5px dashed var(--border);border-radius:18px;background:rgba(255,255,255,.45);position:relative;overflow:hidden;touch-action:none;margin-top:10px;cursor:crosshair;}
  .sticker-position-help{position:absolute;left:10px;top:8px;font-size:10px;font-weight:900;color:var(--text3);background:rgba(255,255,255,.75);border:1px solid var(--border);border-radius:999px;padding:3px 8px;}
  .sticker-position-preview{position:absolute;transform:translate(-50%,-50%);font-size:44px;filter:drop-shadow(0 8px 14px rgba(74,40,64,.15));} 
  .sticker-position-preview img{width:92px;max-height:92px;object-fit:contain;display:block;}
  .scrapbook-sticker-stage{position:relative;height:210px;border-radius:20px;background:rgba(255,255,255,.28);overflow:hidden;}
  .scrapbook-sticker-stage .scrapbook-sticker-view{position:absolute;transform:translate(-50%,-50%);font-size:52px;margin:0;}
  .scrapbook-sticker-stage .scrapbook-sticker-view.asset img{width:min(150px,46vw);}
  @media(max-width:768px){.sticker-position-pad{height:150px}.scrapbook-sticker-stage{height:170px}.sticker-position-preview img{width:76px}.scrapbook-sticker-stage .scrapbook-sticker-view.asset img{width:min(120px,44vw)}}


  /* Mobile standalone page headers: extend to phone edges and stay fully opaque */
  @media(max-width:768px){
    .sidebar-sync-menu-pill{display:block;}
    .tasks-page{padding:0 12px calc(74px + env(safe-area-inset-bottom))!important;background:var(--bg)!important;}
    .tasks-page > .journal-header{
      margin:0 -12px 18px!important;
      width:calc(100% + 24px)!important;
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:0 1px 0 var(--border), var(--shadow-sm)!important;
    }
    .bloom-room-page{padding-top:0!important;background:var(--bg)!important;}
    .bloom-room-page .journal-header{
      margin:0 -10px 18px!important;
      width:calc(100% + 20px)!important;
      background:var(--bg2)!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      box-shadow:0 1px 0 var(--border), var(--shadow-sm)!important;
    }
    .dark .tasks-page > .journal-header,
    .dark .bloom-room-page .journal-header{background:var(--bg2)!important;}
  }


  /* ── Phase 9: mood and energy check-in ─────────────────────────────── */
  .checkin-modal{
    width:min(680px,calc(100vw - 28px));
    max-height:min(88vh,820px);
    overflow:auto;
    background:var(--bg2);
    border:1px solid var(--border);
    border-radius:28px;
    box-shadow:var(--shadow-lg);
    padding:22px;
  }
  .checkin-modal-head{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:16px;
    margin-bottom:18px;
  }
  .checkin-modal-head h2{margin:4px 0 6px;font-size:28px;line-height:1.05;letter-spacing:-.04em;color:var(--text);}
  .checkin-modal-head p{margin:0;color:var(--text2);font-size:14px;line-height:1.45;max-width:520px;}
  .checkin-section{margin-top:18px;}
  .checkin-section-title{font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.12em;color:var(--text2);margin-bottom:10px;display:flex;gap:8px;align-items:center;}
  .checkin-section-title span{font-size:11px;text-transform:none;letter-spacing:0;color:var(--text3);font-weight:800;}
  .checkin-option-grid{display:grid;gap:10px;}
  .mood-options-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .energy-options-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .checkin-option{
    border:1.5px solid var(--border);
    background:rgba(255,255,255,.7);
    border-radius:20px;
    min-height:92px;
    padding:14px 12px;
    display:flex;
    flex-direction:column;
    align-items:flex-start;
    justify-content:center;
    gap:8px;
    text-align:left;
    cursor:pointer;
    color:var(--text);
    transition:transform .16s ease,border-color .16s ease,background .16s ease,box-shadow .16s ease;
  }
  .checkin-option:hover{transform:translateY(-1px);border-color:rgba(184,111,143,.38);box-shadow:var(--shadow-sm);}
  .checkin-option.selected{
    border-color:var(--checkin-color,var(--accent));
    background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(255,247,250,.86));
    box-shadow:0 12px 28px rgba(184,111,143,.16);
  }
  .checkin-option.energy{min-height:104px;}
  .checkin-option.energy.selected{border-color:var(--accent);}
  .checkin-option-emoji{font-size:24px;line-height:1;}
  .checkin-option strong{font-size:14px;font-weight:950;}
  .checkin-option small{display:block;margin-top:3px;font-size:11px;line-height:1.3;color:var(--text3);font-weight:800;}
  .checkin-note-input{
    width:100%;
    border:1.5px solid var(--border);
    border-radius:20px;
    background:rgba(255,255,255,.72);
    color:var(--text);
    padding:14px 16px;
    resize:vertical;
    outline:none;
    font:inherit;
    line-height:1.45;
  }
  .checkin-note-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(184,111,143,.12);}
  .checkin-preview-card{
    margin-top:18px;
    border:1px solid rgba(184,111,143,.20);
    border-radius:22px;
    padding:14px;
    background:linear-gradient(135deg,rgba(255,248,251,.9),rgba(255,255,255,.72));
    display:flex;
    gap:12px;
    align-items:flex-start;
  }
  .checkin-preview-card>span{font-size:26px;}
  .checkin-preview-card strong{display:block;font-size:14px;color:var(--text);}
  .checkin-preview-card p{margin:4px 0 0;color:var(--text2);font-size:13px;line-height:1.4;}

  .journal-reflection-hub{margin:0 14px 14px;border:1.5px solid rgba(184,111,143,.18);background:linear-gradient(135deg,rgba(255,250,252,.96),rgba(255,255,255,.76));border-radius:24px;padding:16px;box-shadow:var(--shadow-sm);}
  .journal-reflection-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px;}
  .journal-reflection-head strong{display:block;color:var(--text);font-size:15px;}.journal-reflection-head p{margin:4px 0 0;color:var(--text2);font-size:12px;line-height:1.35;}
  .journal-reflection-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}
  .journal-reflection-tile{border:1px solid var(--border);background:rgba(255,255,255,.68);border-radius:16px;padding:11px;min-height:82px;}
  .journal-reflection-tile span{display:block;font-size:11px;color:var(--text3);font-weight:900;text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px;}
  .journal-reflection-tile strong{display:block;color:var(--text);font-size:13px;line-height:1.3;}.journal-reflection-tile p{margin:4px 0 0;color:var(--text2);font-size:11px;line-height:1.35;}
  .journal-checkin-card{
    margin:14px 16px;
    border:1px solid rgba(184,111,143,.18);
    border-radius:22px;
    background:linear-gradient(135deg,rgba(255,250,252,.88),rgba(255,255,255,.70));
    box-shadow:var(--shadow-sm);
    padding:14px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
  }
  .journal-checkin-main{display:flex;align-items:center;gap:12px;min-width:0;}
  .journal-checkin-main>span{font-size:28px;line-height:1;}
  .journal-checkin-main strong{display:block;color:var(--text);font-size:14px;}
  .journal-checkin-main p{margin:3px 0 0;color:var(--text2);font-size:12px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
  .journal-checkin-actions{display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .journal-checkin-actions>span{font-size:11px;color:var(--text3);font-weight:900;white-space:nowrap;}
  .journal-reset-card{margin:0 16px 14px;border:1px solid rgba(184,111,143,.18);border-radius:22px;background:linear-gradient(135deg,rgba(255,250,252,.88),rgba(255,255,255,.70));box-shadow:var(--shadow-sm);padding:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;}
  .journal-reset-main{display:flex;align-items:center;gap:12px;min-width:0;}.journal-reset-main>span{font-size:28px;line-height:1;}.journal-reset-main strong{display:block;color:var(--text);font-size:14px;}.journal-reset-main p{margin:3px 0 0;color:var(--text2);font-size:12px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}


  .checkin-rhythm-card{
    border:1px solid rgba(184,111,143,.18);
    border-radius:24px;
    background:linear-gradient(135deg,rgba(255,250,252,.9),rgba(255,255,255,.72));
    box-shadow:var(--shadow-sm);
    padding:16px;
    margin-bottom:14px;
  }
  .checkin-rhythm-current{display:flex;align-items:center;gap:12px;margin-top:12px;}
  .checkin-rhythm-current .big-emoji{font-size:32px;line-height:1;width:46px;height:46px;border-radius:16px;background:rgba(255,255,255,.72);display:grid;place-items:center;border:1px solid var(--border);}
  .checkin-rhythm-current strong{display:block;font-size:15px;color:var(--text);}
  .checkin-rhythm-current p{margin:3px 0 0;color:var(--text2);font-size:12px;line-height:1.35;}
  .checkin-rhythm-trail{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
  .checkin-rhythm-dot{width:34px;height:34px;border-radius:999px;display:grid;place-items:center;border:1px solid var(--border);background:rgba(255,255,255,.72);font-size:16px;}
  .checkin-rhythm-dot.empty{color:var(--text3);font-size:13px;font-weight:900;}
  .tomorrow-reset-rhythm-card{border:1px solid rgba(184,111,143,.18);border-radius:24px;background:linear-gradient(135deg,rgba(255,250,252,.9),rgba(255,255,255,.72));box-shadow:var(--shadow-sm);padding:16px;margin-bottom:14px;}
  .tomorrow-reset-mini-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px;}.tomorrow-reset-mini-grid div{border:1px solid var(--border);background:rgba(255,255,255,.68);border-radius:14px;padding:10px;text-align:center;}.tomorrow-reset-mini-grid strong{display:block;font-size:18px;color:var(--accent);}.tomorrow-reset-mini-grid span{display:block;margin-top:2px;font-size:10px;color:var(--text3);font-weight:900;text-transform:uppercase;letter-spacing:.03em;}
  .reflection-hub-card{border:1px solid rgba(184,111,143,.18);border-radius:24px;background:linear-gradient(135deg,rgba(255,250,252,.94),rgba(255,255,255,.76));box-shadow:var(--shadow-sm);padding:16px;margin-bottom:14px;}
  .reflection-hub-mini-grid strong{font-size:19px;}
  .reflection-hub-note{margin-top:14px;}


  .affirmations-page{padding:22px 28px 96px;max-width:none;margin:0;width:100%;height:100%;overflow:auto;}
  .affirmation-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;border:1.5px solid rgba(184,111,143,.18);background:linear-gradient(135deg,rgba(255,250,252,.96),rgba(255,255,255,.74));box-shadow:var(--shadow-sm);border-radius:28px;padding:22px;margin-bottom:16px;}
  .affirmation-hero h1{margin:3px 0 6px;font-size:32px;color:var(--text);line-height:1.04;}
  .affirmation-hero p{margin:0;color:var(--text2);font-size:14px;line-height:1.45;max-width:620px;font-weight:750;}
  .affirmation-feature-card{border:1.5px solid rgba(184,111,143,.20);background:radial-gradient(circle at top left,rgba(255,240,246,.92),rgba(255,255,255,.78));border-radius:30px;padding:22px;box-shadow:var(--shadow);margin-bottom:16px;}
  .affirmation-feature-top{display:flex;align-items:flex-start;gap:16px;}
  .affirmation-feature-emoji,.affirmation-quote-icon{width:52px;height:52px;border-radius:18px;background:rgba(255,255,255,.78);border:1px solid var(--border);display:grid;place-items:center;font-size:28px;flex-shrink:0;}
  .affirmation-feature-top small,.affirmation-quote-row small{display:block;color:var(--text3);font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;}
  .affirmation-feature-top blockquote,.affirmation-quote-row blockquote{margin:0;color:var(--text);font-size:25px;line-height:1.22;font-weight:950;letter-spacing:-.02em;}
  .affirmation-feature-actions,.affirmation-card-actions,.affirmation-list-actions,.affirmation-reminder-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;}
  .affirmation-favorite-btn{border:1.5px solid var(--border);background:rgba(255,255,255,.72);border-radius:999px;color:var(--accent);padding:8px 12px;font:inherit;font-size:12px;font-weight:950;cursor:pointer;}
  .affirmation-favorite-btn.active{background:linear-gradient(135deg,var(--accent),#B08AE0);color:#fff;border-color:transparent;box-shadow:0 10px 24px rgba(184,111,143,.20);}
  .affirmation-grid-main{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
  .affirmation-settings-card{min-height:142px;}
  .affirmation-stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px;}
  .affirmation-stats-grid div{border:1px solid var(--border);background:var(--bg3);border-radius:16px;padding:12px;text-align:center;}
  .affirmation-stats-grid strong{display:block;color:var(--accent);font-size:22px;line-height:1;}.affirmation-stats-grid span{display:block;margin-top:4px;color:var(--text3);font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.04em;}
  .affirmation-filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}.affirmation-filter-row button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:8px 12px;font:inherit;font-size:12px;font-weight:950;cursor:pointer;}.affirmation-filter-row button.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 8px 18px rgba(184,111,143,.18);}
  .affirmation-list-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;}.affirmation-list-card{border:1.5px solid var(--border);background:rgba(255,255,255,.70);border-radius:22px;padding:15px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px;min-height:158px;}.affirmation-list-card.favorite{border-color:rgba(184,111,143,.38);background:linear-gradient(135deg,rgba(255,250,252,.96),rgba(255,255,255,.78));}
  .affirmation-list-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}.affirmation-list-top span{font-size:24px;}.affirmation-list-top small{color:var(--text3);font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.04em;text-align:right;}.affirmation-list-card p{margin:0;color:var(--text);font-size:15px;font-weight:900;line-height:1.35;flex:1;}.affirmation-list-actions{margin-top:auto;justify-content:flex-end;}.affirmation-list-actions button{border:1px solid var(--border);background:var(--bg3);border-radius:999px;color:var(--accent);padding:6px 10px;font:inherit;font-size:12px;font-weight:950;cursor:pointer;}
  .affirmation-category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;}.affirmation-category{border:1.5px solid var(--border);background:rgba(255,255,255,.72);border-radius:16px;padding:10px 12px;text-align:left;color:var(--text2);font:inherit;font-size:12px;font-weight:950;cursor:pointer;display:flex;align-items:center;gap:8px;}.affirmation-category.active{border-color:rgba(184,111,143,.42);background:rgba(255,240,246,.90);color:var(--accent);box-shadow:0 8px 20px rgba(184,111,143,.12);}.affirmation-category span{font-size:18px;}
  .affirmation-inline-toggle{display:flex;align-items:center;gap:8px;color:var(--text2);font-size:12px;font-weight:950;}.affirmation-inline-toggle input{accent-color:var(--accent);}.affirmation-textarea{min-height:116px;}.affirmation-modal{width:560px;max-width:calc(100vw - 32px);max-height:90vh;overflow:auto;border:1.5px solid var(--border);border-radius:28px;background:var(--bg2);box-shadow:0 24px 64px rgba(255,123,172,.18);padding:20px;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .affirmation-daily-card{background:linear-gradient(135deg,rgba(255,250,252,.96),rgba(255,255,255,.76));}.affirmation-quote-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:14px;row-gap:0;}.affirmation-quote-row .affirmation-quote-text{min-width:0;display:flex;align-items:center;justify-content:center;text-align:center;}.affirmation-quote-row .affirmation-quote-text blockquote{width:100%;margin:0;text-align:center;}.affirmation-quote-row blockquote{font-size:18px;}.affirmation-card-actions{margin-top:14px;}.affirmation-card-actions .tf-cancel{padding:8px 12px;font-size:12px;}
  .affirmation-rhythm-card{border:1px solid rgba(184,111,143,.18);border-radius:24px;background:linear-gradient(135deg,rgba(255,250,252,.9),rgba(255,255,255,.72));box-shadow:var(--shadow-sm);padding:16px;margin-bottom:14px;}


  .dark .checkin-modal,
  .dark .checkin-note-input,
  .dark .checkin-option,
  .dark .checkin-preview-card,
  .dark .journal-reflection-hub,
  .dark .journal-checkin-card,
  .dark .journal-reset-card,
  .dark .checkin-rhythm-card,
  .dark .reflection-hub-card,
  .dark .tomorrow-reset-rhythm-card,
  .dark .weekly-reset-rhythm-card,
  .dark .affirmation-feature-card,
  .dark .affirmation-list-card,
  .dark .affirmation-modal,
  .dark .affirmation-rhythm-card,
  .dark .affirmation-daily-card,
  .dark .checkin-rhythm-current .big-emoji,
  .dark .checkin-rhythm-dot{background:var(--dark-card);border-color:rgba(var(--accent-rgb),.26);}

  @media(max-width:768px){
    .affirmations-page{padding:16px 12px 88px;}
    .affirmation-hero{flex-direction:column;border-radius:24px;padding:18px;}
    .affirmation-hero .tf-save{width:100%;}
    .affirmation-hero h1{font-size:25px;}
    .affirmation-feature-card{border-radius:24px;padding:18px;}
    .affirmation-feature-top{flex-direction:column;}
    .affirmation-feature-top blockquote{font-size:21px;}
    .affirmation-grid-main{grid-template-columns:1fr;}
    .affirmation-stats-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
    .affirmation-list-grid{grid-template-columns:1fr;}
    .affirmation-modal{width:100vw;max-height:92vh;border-radius:26px 26px 0 0;margin-top:auto;}
    .checkin-modal{width:100vw;max-height:92vh;border-radius:26px 26px 0 0;padding:18px;margin-top:auto;}
    .checkin-modal-head h2{font-size:24px;}
    .mood-options-grid,.energy-options-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .checkin-option{min-height:82px;}
    .journal-reflection-hub{margin:0 14px 14px;border:1.5px solid rgba(184,111,143,.18);background:linear-gradient(135deg,rgba(255,250,252,.96),rgba(255,255,255,.76));border-radius:24px;padding:16px;box-shadow:var(--shadow-sm);}
  .journal-reflection-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px;}
  .journal-reflection-head strong{display:block;color:var(--text);font-size:15px;}.journal-reflection-head p{margin:4px 0 0;color:var(--text2);font-size:12px;line-height:1.35;}
  .journal-reflection-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}
  .journal-reflection-tile{border:1px solid var(--border);background:rgba(255,255,255,.68);border-radius:16px;padding:11px;min-height:82px;}
  .journal-reflection-tile span{display:block;font-size:11px;color:var(--text3);font-weight:900;text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px;}
  .journal-reflection-tile strong{display:block;color:var(--text);font-size:13px;line-height:1.3;}.journal-reflection-tile p{margin:4px 0 0;color:var(--text2);font-size:11px;line-height:1.35;}
  .journal-checkin-card{align-items:flex-start;flex-direction:column;margin-left:12px;margin-right:12px;}
    .journal-checkin-actions{width:100%;justify-content:space-between;}
    .journal-checkin-actions .tf-save{padding-inline:14px;}
    .journal-reset-card{align-items:flex-start;flex-direction:column;margin-left:12px;margin-right:12px;}
    .tomorrow-reset-card{width:100vw;max-width:100vw;border-radius:26px 26px 0 0;max-height:92vh;margin-top:auto;}
    .tomorrow-reset-page{padding:16px 12px 88px;}
    .tomorrow-reset-page .tomorrow-reset-card{width:100%;max-width:none;border-radius:24px;max-height:none;margin-top:0;}
    .tomorrow-reset-head{flex-direction:column;}
    .tomorrow-reset-back{width:100%;}
    .tomorrow-reset-task{grid-template-columns:1fr;}
    .tomorrow-reset-reflection-grid{grid-template-columns:1fr;}
    .tomorrow-reset-section-head{align-items:flex-start;flex-direction:column;}
    .tomorrow-reset-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .weekly-reset-page{padding:16px 12px 88px;}
    .weekly-reset-hero{flex-direction:column;}
    .weekly-reset-hero .tf-save{width:100%;}
    .weekly-reset-grid{grid-template-columns:1fr;}
    .weekly-reset-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .weekly-habit-focus-grid{grid-template-columns:1fr;}

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

/* ── Pre Phase 22 simplification: Rhythm page, no Bloom/Affirmations pages ── */
.rhythm-stats-page{height:100%;overflow:auto;padding:18px clamp(18px,3vw,34px) 34px;gap:16px;}
.rhythm-stats-hero{position:relative;display:flex;align-items:center;justify-content:space-between;min-height:auto;margin:0;}
.rhythm-stats-card-page{width:100%!important;max-width:none!important;max-height:none!important;overflow:visible!important;padding:18px!important;}
.rhythm-stats-card-page .game-soft-card,.rhythm-stats-card-page .streaks-card,.rhythm-stats-card-page .life-garden-card,.rhythm-stats-card-page .weekly-recap-card,.rhythm-stats-card-page .skills-card{box-shadow:none!important;margin:0!important;}
.rhythm-stats-game-section{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;gap:10px!important;}
.rhythm-stats-game-grid{align-items:stretch;}
.rhythm-stats-game-grid>.game-soft-card,.rhythm-stats-game-grid>.streaks-card{height:100%;}
.rhythm-stats-page .streak-grid-five{grid-template-columns:repeat(5,minmax(0,1fr));}
.rhythm-stats-page .life-garden-card{width:100%;}
.affirmation-daily-card .phase-card-head small{font-size:10px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;}
.affirmation-daily-card .affirmation-card-actions{display:none!important;}
@media(max-width:900px){.rhythm-stats-page{padding:12px 12px calc(var(--mobile-nav-h,78px) + 28px)!important;}.rhythm-stats-hero{position:sticky!important;top:0!important;z-index:70;background:var(--surface)!important;}.rhythm-stats-card-page{padding:14px!important;border-radius:22px!important;}.rhythm-stats-game-grid{grid-template-columns:1fr!important;}.rhythm-stats-page .streak-grid-five{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important;}.rhythm-stats-page .streak-pill{padding:8px 4px!important;}.rhythm-stats-page .streak-pill strong{font-size:14px!important;}.rhythm-stats-page .streak-pill small{font-size:8px!important;}}


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

/* ── Pre Phase 22 debug 8: journal mobile header should scroll normally ── */
@media(max-width:768px){
  .journal-page > .journal-header{
    position:relative!important;
    top:auto!important;
    z-index:2!important;
    background:var(--surface)!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
    box-shadow:0 1px 0 var(--border)!important;
  }
}


/* ── Current design/debug hotfixes: stickers, floral contrast, dark surfaces ── */
.tempo-logo-sticker{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 4px 8px rgba(var(--accent-rgb),.20));}
.sidebar-logo .logo-icon{overflow:hidden;}
.dark .app,.dark .content,.dark .main-content{background:var(--dark-page)!important;color:var(--text)!important;}
.dark .sidebar,.dark .mobile-nav,.dark .settings-panel,.dark .settings-modal,.dark .settings-card,.dark .modal,.dark .modal-card,.dark .entry-view-modal,.dark .journal-entry-card,.dark .phase-card,.dark .task-panel,.dark .task-card,.dark .calendar-panel,.dark .calendar-card,.dark .journal-page,.dark .today-card,.dark .memory-panel,.dark .chat-window{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.28)!important;color:var(--text)!important;box-shadow:0 18px 45px rgba(0,0,0,.34)!important;}
.dark input,.dark textarea,.dark select,.dark .modal-input,.dark .modal-select,.dark .settings-input,.dark .journal-input,.dark .chat-input,.dark .tf-input,.dark .theme-swatch-btn,.dark .habit-row,.dark .journal-reflection-tile{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.30)!important;color:var(--text)!important;}
.dark .modal-footer,.dark .entry-modal-footer,.dark .chat-input-row{background:var(--dark-nav)!important;border-color:rgba(var(--accent-rgb),.26)!important;}

.affirmation-daily-card .affirmation-quote-row{display:grid!important;grid-template-columns:minmax(0,1fr) 52px!important;align-items:center!important;justify-content:stretch!important;text-align:left!important;column-gap:12px!important;row-gap:0!important;}
.affirmation-daily-card .affirmation-quote-text{width:100%!important;max-width:680px!important;display:flex!important;justify-content:center!important;align-items:center!important;min-width:0!important;text-align:center!important;}
.affirmation-daily-card .affirmation-quote-row blockquote{max-width:680px!important;margin:0 auto!important;text-align:center!important;width:100%!important;}
.affirmation-daily-card .affirmation-quote-icon{justify-self:end!important;align-self:center!important;display:grid!important;place-items:center!important;line-height:1!important;}
.today-top3-card .today-empty-sugar img{width:150px!important;height:150px!important;max-width:52vw!important;max-height:52vw!important;}
.today-top3-card .today-empty-sugar{min-height:250px!important;}
@media(max-width:768px){.sidebar-sync-under-user .sync-pill{display:none!important;}.today-top3-card .today-empty-sugar{min-height:230px!important;}}


/* ── Journal scrapbook canvas rework ───────────────────────────────────── */
.scrapbook-title-row{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;margin-bottom:12px!important;}
.scrapbook-title-row small{font-family:var(--font);font-size:11px;line-height:1.35;color:var(--text3);font-weight:800;text-transform:none;letter-spacing:0;text-align:right;max-width:330px;}
.scrapbook-toolbar{margin-bottom:12px!important;}
.scrapbook-toolbar button{background:linear-gradient(135deg,var(--bg2),var(--bg4))!important;border-color:var(--accent3)!important;color:var(--accent)!important;padding:8px 10px!important;border-radius:999px!important;box-shadow:0 5px 14px rgba(var(--accent-rgb),.08)!important;}
.scrapbook-canvas-shell{background:linear-gradient(135deg,rgba(var(--accent-rgb),.08),rgba(255,255,255,.36));border:1.5px solid var(--border);border-radius:24px;padding:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.65),0 12px 32px rgba(var(--accent-rgb),.08);}
.scrapbook-canvas,.scrapbook-view-canvas{position:relative;width:100%;height:min(720px,92vw);min-height:540px;border:1.5px solid rgba(var(--accent-rgb),.20);border-radius:20px;overflow:hidden;background-color:var(--bg2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);touch-action:none;}
.scrapbook-view-canvas{height:min(620px,120vw);min-height:460px;margin-top:8px;touch-action:auto;}
.scrapbook-canvas-empty{position:absolute;inset:14px;display:flex;align-items:center;justify-content:center;text-align:center;border:1.5px dashed rgba(var(--accent-rgb),.28);border-radius:18px;background:rgba(255,255,255,.42);color:var(--text3);font-size:12px;font-weight:900;line-height:1.45;padding:18px;}
.scrapbook-canvas-item,.scrapbook-view-item{position:absolute;box-sizing:border-box;border-radius:16px;transform-origin:center center;}
.scrapbook-canvas-item{border:1.5px solid rgba(255,255,255,.72);box-shadow:0 12px 28px rgba(95,55,78,.12);cursor:default;transition:box-shadow .12s,border-color .12s;}
.scrapbook-canvas-item.selected{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(var(--accent-rgb),.16),0 16px 36px rgba(95,55,78,.16)!important;}
.scrapbook-canvas-item.scrapbook-text,.scrapbook-view-item.scrapbook-text{background:rgba(255,255,255,.78);border-color:rgba(var(--accent-rgb),.12);}
.scrapbook-canvas-item.scrapbook-tape,.scrapbook-view-item.scrapbook-tape{background:linear-gradient(135deg,rgba(255,228,236,.96),rgba(255,244,220,.92));border:1px solid rgba(202,122,154,.24);box-shadow:0 10px 25px rgba(118,76,92,.12);}
.scrapbook-canvas-item.scrapbook-tape:before,.scrapbook-view-item.scrapbook-tape:before{content:"";position:absolute;left:50%;top:-9px;width:48px;height:18px;transform:translateX(-50%) rotate(-2deg);border-radius:6px;background:rgba(255,255,255,.58);border:1px solid rgba(202,122,154,.16);box-shadow:0 4px 10px rgba(118,76,92,.08);pointer-events:none;}
.scrapbook-canvas-item.scrapbook-divider,.scrapbook-view-item.scrapbook-divider{display:flex;align-items:center;justify-content:center;background:transparent!important;border-color:transparent!important;box-shadow:none!important;}
.scrapbook-canvas-item.scrapbook-sticker,.scrapbook-view-item.scrapbook-sticker{background:transparent!important;border-color:transparent!important;box-shadow:none!important;}
.scrapbook-canvas-textarea{width:100%;height:100%;resize:none;border:0;background:transparent;outline:0;padding:16px 14px 12px;font-family:var(--font);font-size:13px;line-height:1.45;font-weight:800;color:var(--text);text-align:center;overflow:auto;}
.scrapbook-tape .scrapbook-canvas-textarea{padding:20px 14px 12px;font-weight:900;color:#7d405d;}
.scrapbook-divider-input{width:100%;height:100%;border:0;background:transparent;outline:0;text-align:center;font-family:var(--mono);font-size:18px;letter-spacing:6px;color:var(--accent);font-weight:900;padding:0 8px;}
.scrapbook-canvas-sticker,.scrapbook-view-sticker{width:100%;height:100%;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 10px 18px rgba(74,40,64,.14));}
.scrapbook-canvas-sticker img,.scrapbook-view-sticker img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;}
.scrapbook-canvas-sticker span,.scrapbook-view-sticker span{font-size:clamp(28px,9vw,78px);line-height:1;}
.scrapbook-drag-handle{position:absolute;left:6px;top:6px;z-index:5;border:1px solid rgba(var(--accent-rgb),.18);background:rgba(255,255,255,.74);color:var(--accent);border-radius:999px;font-family:var(--mono);font-size:11px;font-weight:900;line-height:1;padding:4px 6px;cursor:grab;touch-action:none;box-shadow:0 4px 10px rgba(74,40,64,.08);}
.scrapbook-drag-handle:active{cursor:grabbing;}
.scrapbook-resize-handle{position:absolute;right:5px;bottom:5px;z-index:6;width:17px;height:17px;border-radius:6px;background:linear-gradient(135deg,var(--accent3),var(--accent));box-shadow:0 4px 10px rgba(var(--accent-rgb),.20);cursor:nwse-resize;touch-action:none;}
.scrapbook-resize-handle:after{content:"";position:absolute;right:4px;bottom:4px;width:7px;height:7px;border-right:2px solid rgba(255,255,255,.88);border-bottom:2px solid rgba(255,255,255,.88);}
.scrapbook-view-text{width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;white-space:pre-wrap;overflow:hidden;padding:14px;font-size:13px;line-height:1.45;font-weight:800;color:var(--text);}
.scrapbook-view-item.scrapbook-tape .scrapbook-view-text{color:#7d405d;font-weight:900;}
.scrapbook-view-divider{width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:var(--mono);font-size:18px;letter-spacing:6px;color:var(--accent);font-weight:900;}
.scrapbook-selected-panel{margin-top:12px;border:1.5px solid var(--border);border-radius:18px;background:linear-gradient(135deg,var(--bg2),var(--bg3));padding:12px;box-shadow:0 10px 25px rgba(var(--accent-rgb),.06);}
.scrapbook-selected-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
.scrapbook-selected-head strong{font-size:12px;color:var(--text);font-weight:900;}
.scrapbook-selected-head div{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}
.scrapbook-selected-head button,.scrapbook-sticker-controls button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:10px;padding:5px 8px;font-size:10px;font-family:var(--font);font-weight:900;cursor:pointer;}
.scrapbook-selected-head button:hover,.scrapbook-sticker-controls button:hover{border-color:var(--accent3);color:var(--accent);}
.scrapbook-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;}
.scrapbook-control-grid label{display:grid;grid-template-columns:54px 1fr;align-items:center;gap:8px;font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;}
.scrapbook-control-grid input[type="range"]{width:100%;accent-color:var(--accent);}
.scrapbook-sticker-controls{margin-top:12px;display:flex;flex-direction:column;gap:10px;}
.scrapbook-canvas-item.selected.scrapbook-sticker,.scrapbook-canvas-item.selected.scrapbook-divider{border-color:var(--accent)!important;box-shadow:0 0 0 3px rgba(var(--accent-rgb),.16),0 16px 36px rgba(95,55,78,.16)!important;background:rgba(255,255,255,.08)!important;}

.dark .scrapbook-canvas-shell{background:linear-gradient(135deg,rgba(var(--accent-rgb),.16),rgba(15,11,20,.48));border-color:rgba(var(--accent-rgb),.26);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px rgba(0,0,0,.24);}
.dark .scrapbook-canvas,.dark .scrapbook-view-canvas{background-color:var(--dark-field);border-color:rgba(var(--accent-rgb),.30);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);}
.dark .scrapbook-canvas-empty{background:rgba(255,255,255,.06);border-color:rgba(var(--accent-rgb),.30);}
.dark .scrapbook-canvas-item.scrapbook-text,.dark .scrapbook-view-item.scrapbook-text{background:rgba(44,28,52,.86);border-color:rgba(var(--accent-rgb),.24);}
.dark .scrapbook-canvas-item.scrapbook-tape,.dark .scrapbook-view-item.scrapbook-tape{background:linear-gradient(135deg,rgba(108,48,82,.92),rgba(72,42,58,.88));border-color:rgba(var(--accent-rgb),.30);}
.dark .scrapbook-tape .scrapbook-canvas-textarea,.dark .scrapbook-view-item.scrapbook-tape .scrapbook-view-text{color:#ffd6e3;}
.dark .scrapbook-drag-handle{background:rgba(31,21,39,.86);border-color:rgba(var(--accent-rgb),.28);}
.dark .scrapbook-selected-panel{background:linear-gradient(135deg,var(--dark-card),var(--dark-field));border-color:rgba(var(--accent-rgb),.26);}
@media(max-width:768px){
  .scrapbook-title-row{flex-direction:column!important;gap:4px!important;}
  .scrapbook-title-row small{text-align:left;max-width:none;}
  .scrapbook-canvas,.scrapbook-view-canvas{height:520px;min-height:520px;border-radius:18px;}
  .scrapbook-canvas-shell{padding:8px;border-radius:20px;}
  .scrapbook-control-grid{grid-template-columns:1fr;}
  .scrapbook-selected-head{flex-direction:column;}
  .scrapbook-selected-head div{justify-content:flex-start;}
  .scrapbook-drag-handle{font-size:10px;padding:4px 6px;}
  .scrapbook-canvas-textarea{font-size:12px;padding:18px 11px 10px;}
}

/* ── Scrapbook canvas resizing + compact sticker browser ─────────────── */
.scrapbook-page-size-panel{display:grid;gap:10px;margin:0 0 12px;padding:10px;border:1.5px solid var(--border);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.54),rgba(var(--accent-rgb),.06));}
.scrapbook-size-presets{display:flex;gap:7px;flex-wrap:wrap;align-items:center;justify-content:flex-start;}
.scrapbook-size-presets button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:6px 9px;font-size:10px;font-family:var(--font);font-weight:900;cursor:pointer;}
.scrapbook-size-presets button:hover{border-color:var(--accent3);color:var(--accent);background:rgba(var(--accent-rgb),.08);}
.scrapbook-size-sliders{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;}
.scrapbook-size-sliders label{display:grid;grid-template-columns:48px 1fr 54px;align-items:center;gap:8px;font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;}
.scrapbook-size-sliders input[type="range"]{width:100%;accent-color:var(--accent);}
.scrapbook-size-sliders span{font-family:var(--mono);font-size:10px;color:var(--text2);text-align:right;}
.scrapbook-canvas-shell{position:relative!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;overflow:visible!important;}
.scrapbook-canvas,.scrapbook-view-canvas{width:min(100%,var(--scrapbook-canvas-width,840px))!important;height:auto!important;min-height:0!important;max-height:none!important;margin-left:auto!important;margin-right:auto!important;}
.scrapbook-view-canvas{margin-top:8px!important;}
.scrapbook-page-resize-handle{position:absolute;right:4px;bottom:4px;z-index:15;width:24px;height:24px;border-radius:9px;background:linear-gradient(135deg,var(--accent3),var(--accent));box-shadow:0 8px 18px rgba(var(--accent-rgb),.24);cursor:nwse-resize;touch-action:none;}
.scrapbook-page-resize-handle:after{content:"";position:absolute;right:6px;bottom:6px;width:10px;height:10px;border-right:2px solid rgba(255,255,255,.92);border-bottom:2px solid rgba(255,255,255,.92);}
.scrapbook-view-text{display:block!important;width:100%;height:100%;box-sizing:border-box;text-align:center;white-space:pre-wrap;overflow:hidden;padding:16px 14px 12px!important;font-family:var(--font);font-size:13px!important;line-height:1.45!important;font-weight:800;color:var(--text);}
.scrapbook-view-item.scrapbook-tape .scrapbook-view-text{padding:20px 14px 12px!important;font-weight:900!important;color:#7d405d!important;}
.scrapbook-tape .scrapbook-canvas-textarea{font-family:var(--font)!important;font-size:13px!important;line-height:1.45!important;text-align:center!important;}
.sticker-pack-browser{display:grid;gap:10px;margin:8px 0;}
.sticker-pack-tabs{display:flex;gap:8px;align-items:center;overflow-x:auto;padding:7px;border:1.5px solid var(--border);border-radius:22px;background:rgba(255,255,255,.58);box-shadow:inset 0 1px 0 rgba(255,255,255,.55);scrollbar-width:thin;}
.sticker-pack-tabs button{position:relative;min-width:66px;height:60px;border:1px solid transparent;background:transparent;border-radius:18px;display:grid;place-items:center;gap:2px;padding:5px;cursor:pointer;color:var(--text3);font-family:var(--font);font-weight:900;}
.sticker-pack-tabs button.active{background:rgba(var(--accent-rgb),.12);border-color:rgba(var(--accent-rgb),.18);box-shadow:0 6px 18px rgba(var(--accent-rgb),.10);color:var(--accent);}
.sticker-pack-tabs img{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(74,40,64,.10));}
.sticker-pack-tabs span{font-size:24px;line-height:1;}
.sticker-pack-tabs small{font-size:9px;line-height:1;text-transform:uppercase;letter-spacing:.04em;max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sticker-pack-active-title{text-align:center;font-size:12px;font-weight:900;color:var(--text2);letter-spacing:.08em;text-transform:uppercase;margin-top:2px;}
.sticker-asset-picker-row.compact{grid-template-columns:repeat(auto-fill,minmax(74px,1fr))!important;gap:10px;max-height:290px;overflow-y:auto;padding:2px 2px 6px;margin:0;}
.sticker-asset-picker-row.compact button,.sticker-asset-picker-row.compact .sticker-preview-chip{height:74px;border-radius:18px;background:rgba(255,255,255,.72);}
.sticker-asset-picker-row.compact img{max-width:92%;max-height:92%;filter:drop-shadow(0 6px 12px rgba(74,40,64,.10));}
.dark .scrapbook-page-size-panel{background:linear-gradient(135deg,rgba(var(--accent-rgb),.14),rgba(255,255,255,.04));border-color:rgba(var(--accent-rgb),.24);}
.dark .sticker-pack-tabs{background:rgba(255,255,255,.06);border-color:rgba(var(--accent-rgb),.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.06);}
.dark .sticker-asset-picker-row.compact button,.dark .sticker-asset-picker-row.compact .sticker-preview-chip{background:rgba(255,255,255,.07);border-color:rgba(var(--accent-rgb),.18);}
.dark .scrapbook-view-item.scrapbook-tape .scrapbook-view-text{color:#ffd6e3!important;}
@media(max-width:768px){
  .scrapbook-page-size-panel{padding:9px;border-radius:16px;}
  .scrapbook-size-sliders{grid-template-columns:1fr;}
  .scrapbook-size-presets button{font-size:9px;padding:6px 8px;}
  .scrapbook-canvas,.scrapbook-view-canvas{width:100%!important;height:auto!important;min-height:0!important;border-radius:18px;}
  .sticker-pack-tabs{border-radius:18px;padding:6px;}
  .sticker-pack-tabs button{min-width:58px;height:54px;border-radius:15px;}
  .sticker-pack-tabs img{width:30px;height:30px;}
  .sticker-pack-tabs small{font-size:8px;max-width:50px;}
  .sticker-asset-picker-row.compact{grid-template-columns:repeat(4,minmax(0,1fr))!important;max-height:250px;}
  .sticker-asset-picker-row.compact button,.sticker-asset-picker-row.compact .sticker-preview-chip{height:64px;border-radius:15px;}
}


/* ── Scrapbook text fit + sticker flip controls ─────────────────────── */
.scrapbook-canvas-textarea,
.scrapbook-view-text{
  box-sizing:border-box!important;
  font-size:var(--scrapbook-text-size,13px)!important;
  line-height:var(--scrapbook-text-line,1.34)!important;
  overflow:hidden!important;
  overflow-wrap:anywhere!important;
  word-break:break-word!important;
  hyphens:auto;
}
.scrapbook-canvas-textarea{
  padding:18px 22px 16px!important;
  display:block!important;
  min-width:0!important;
  min-height:0!important;
  scrollbar-width:none;
}
.scrapbook-canvas-textarea::-webkit-scrollbar{display:none;}
.scrapbook-tape .scrapbook-canvas-textarea,
.scrapbook-view-item.scrapbook-tape .scrapbook-view-text{
  padding:22px 24px 18px!important;
}
.scrapbook-view-text{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  text-align:center!important;
  white-space:pre-wrap!important;
}
.scrapbook-canvas-item.scrapbook-text,
.scrapbook-canvas-item.scrapbook-tape,
.scrapbook-view-item.scrapbook-text,
.scrapbook-view-item.scrapbook-tape{
  overflow:visible!important;
}
.scrapbook-canvas-item .scrapbook-drag-handle,
.scrapbook-canvas-item .scrapbook-resize-handle{
  opacity:0;
  pointer-events:none;
  transition:opacity .12s ease, transform .12s ease;
}
.scrapbook-canvas-item.selected .scrapbook-drag-handle,
.scrapbook-canvas-item.selected .scrapbook-resize-handle,
.scrapbook-canvas-item:hover .scrapbook-drag-handle,
.scrapbook-canvas-item:hover .scrapbook-resize-handle{
  opacity:1;
  pointer-events:auto;
}
.scrapbook-flip-row{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  padding:8px;
  border:1.5px solid var(--border);
  border-radius:16px;
  background:rgba(255,255,255,.46);
}
.scrapbook-flip-row button{
  flex:1 1 130px;
  border-radius:999px!important;
  padding:8px 10px!important;
}
.scrapbook-flip-row button.active{
  border-color:rgba(var(--accent-rgb),.32)!important;
  background:rgba(var(--accent-rgb),.14)!important;
  color:var(--accent)!important;
  box-shadow:0 6px 16px rgba(var(--accent-rgb),.10)!important;
}
.scrapbook-canvas-sticker,
.scrapbook-view-sticker{
  transform-origin:center center;
  transition:transform .14s ease;
}
.dark .scrapbook-flip-row{
  background:rgba(255,255,255,.06);
  border-color:rgba(var(--accent-rgb),.24);
}
@media(max-width:768px){
  .scrapbook-canvas-textarea{padding:16px 20px 14px!important;}
  .scrapbook-tape .scrapbook-canvas-textarea,
  .scrapbook-view-item.scrapbook-tape .scrapbook-view-text{padding:20px 22px 16px!important;}
  .scrapbook-flip-row button{flex-basis:100%;}
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


/* ── Phase 24A/B Tempo Assistant ─────────────────────────────────────── */
.tempo-assistant-panel{width:min(430px,calc(100vw - 32px))!important;height:min(680px,calc(100dvh - 112px))!important;border-radius:28px!important;background:linear-gradient(180deg,var(--surface),var(--surface-warm))!important;box-shadow:0 28px 80px rgba(var(--accent-rgb),.22)!important;overflow:hidden!important;}
.assistant-header{padding:15px 16px!important;background:linear-gradient(135deg,var(--surface),var(--surface-soft))!important;}
.assistant-context-card{margin:12px 12px 0;padding:12px;border:1.5px solid rgba(var(--accent-rgb),.14);border-radius:22px;background:radial-gradient(circle at top left,rgba(var(--accent-rgb),.11),transparent 45%),linear-gradient(135deg,var(--bg2),var(--bg3));box-shadow:0 12px 28px rgba(var(--accent-rgb),.08);}
.assistant-context-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
.assistant-context-top strong{display:block;font-size:16px;font-weight:950;color:var(--text);letter-spacing:-.02em;}
.assistant-kicker{display:block;font-family:var(--mono);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:2px;}
.assistant-context-top button{border:1px solid rgba(var(--accent-rgb),.20);background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:950;cursor:pointer;box-shadow:0 8px 18px rgba(var(--accent-rgb),.18);white-space:nowrap;}
.assistant-context-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
.assistant-context-grid button{min-width:0;border:1px solid rgba(var(--accent-rgb),.13);background:rgba(255,255,255,.62);border-radius:16px;padding:9px 6px;text-align:center;cursor:pointer;color:var(--text);}
.assistant-context-grid strong{display:block;font-size:15px;font-weight:950;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.assistant-context-grid span{display:block;font-size:10px;font-weight:950;color:var(--text2);margin-top:3px;}
.assistant-context-grid small{display:block;font-size:8.5px;font-weight:800;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.assistant-insights{display:grid;gap:3px;margin-top:10px;padding:9px 10px;border-radius:14px;background:rgba(255,255,255,.46);border:1px dashed rgba(var(--accent-rgb),.17);}
.assistant-insights span{font-size:11px;font-weight:800;color:var(--text2);line-height:1.35;}
.assistant-action-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;}
.assistant-action-row button,.assistant-prompt-bank button{border:1px solid var(--border);background:var(--surface);color:var(--text2);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer;}
.assistant-action-row button:hover,.assistant-prompt-bank button:hover{border-color:var(--accent3);color:var(--accent);background:var(--bg4);}
.assistant-prompt-bank{display:flex;gap:7px;overflow-x:auto;padding:10px 12px 8px;background:transparent;flex:0 0 auto;scrollbar-width:none;}
.assistant-prompt-bank::-webkit-scrollbar{display:none;}
.assistant-prompt-bank button{flex:0 0 auto;background:var(--bg2);}
.assistant-messages{padding-top:8px!important;background:linear-gradient(180deg,transparent,var(--bg))!important;}
.tempo-assistant-panel .msg-bubble{font-size:calc(var(--fs)*12.6px)!important;max-width:84%!important;}
.dark .tempo-assistant-panel,.dark .assistant-context-card{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.26)!important;}
.dark .assistant-context-grid button,.dark .assistant-insights,.dark .assistant-action-row button,.dark .assistant-prompt-bank button{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;color:var(--text)!important;}
@media(max-width:760px){.tempo-assistant-panel{left:10px!important;right:10px!important;width:calc(100vw - 20px)!important;bottom:calc(var(--mobile-nav-h) + 12px)!important;height:min(720px,calc(100dvh - var(--mobile-nav-h) - 28px))!important;border-radius:24px!important}.assistant-context-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.assistant-context-top{align-items:center}.assistant-context-top button{padding:8px 11px}.assistant-prompt-bank{padding-top:8px}.tempo-assistant-panel .msg-bubble{max-width:88%!important;}}


/* ── Phase 24 assistant polish ─────────────────────────────────────────── */
.assistant-context-card.collapsed{padding-bottom:12px!important;}
.assistant-context-controls{display:flex;align-items:center;gap:7px;flex:0 0 auto;}
.assistant-context-controls button{white-space:nowrap;}
.assistant-context-toggle{background:var(--surface)!important;color:var(--accent)!important;border-color:rgba(var(--accent-rgb),.22)!important;box-shadow:none!important;}
.assistant-context-compact{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px;}
.assistant-context-compact span{border:1px solid rgba(var(--accent-rgb),.14);background:rgba(255,255,255,.58);color:var(--text2);border-radius:999px;padding:5px 8px;font-size:10.5px;font-weight:900;}
@media(min-width:761px){
  .assistant-prompt-bank{flex-wrap:wrap!important;overflow:visible!important;scrollbar-width:auto!important;padding:10px 12px 6px!important;max-height:none!important;}
  .assistant-prompt-bank button{flex:0 0 auto!important;}
}
@media(max-width:560px){
  .today-top3-card .today-task-row{grid-template-columns:auto minmax(0,1fr) auto!important;align-items:flex-start!important;column-gap:8px!important;}
  .today-top3-card .today-task-row>div{min-width:0!important;grid-column:2!important;}
  .today-top3-card .today-row-action{grid-column:3!important;grid-row:1!important;align-self:start!important;justify-self:end!important;min-height:30px!important;padding:6px 9px!important;font-size:10px!important;margin-top:0!important;}
  .today-top3-card .today-task-check{grid-column:1!important;grid-row:1!important;}
}
.dark .assistant-context-compact span{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;color:var(--text)!important;}



/* ── Phase 24C-lite Assistant guided creation + compact mobile calendar list ── */
.assistant-create-chip{background:linear-gradient(135deg,var(--accent),var(--accent2))!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 18px rgba(var(--accent-rgb),.16)!important;}
.assistant-builder-card{margin:0 12px 10px;padding:12px;border:1.5px solid rgba(var(--accent-rgb),.16);border-radius:22px;background:linear-gradient(135deg,var(--surface),var(--surface-soft));box-shadow:0 14px 34px rgba(var(--accent-rgb),.10);display:grid;gap:10px;flex:0 0 auto;max-height:260px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.assistant-builder-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.assistant-builder-head span{display:block;font-family:var(--mono);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);}
.assistant-builder-head strong{display:block;font-size:14px;font-weight:950;color:var(--text);line-height:1.15;}
.assistant-builder-head button{width:26px;height:26px;border-radius:9px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);font-weight:950;cursor:pointer;}
.assistant-builder-field{display:grid;gap:5px;}
.assistant-builder-field span,.assistant-builder-question>span,.assistant-builder-row label span{font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);}
.assistant-builder-field input,.assistant-builder-field select,.assistant-builder-row select{width:100%;border:1.5px solid var(--border);background:var(--bg2);color:var(--text);border-radius:14px;padding:9px 11px;font-family:var(--font);font-size:12px;font-weight:850;outline:none;}
.assistant-builder-field input:focus,.assistant-builder-field select:focus,.assistant-builder-row select:focus{border-color:var(--accent3);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.10);}
.assistant-builder-field.compact{grid-template-columns:auto 1fr;align-items:center;gap:8px;}
.assistant-builder-question{display:grid;gap:6px;}
.assistant-builder-question>div{display:flex;gap:6px;flex-wrap:wrap;}
.assistant-builder-question button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:7px 9px;font-size:11px;font-weight:900;cursor:pointer;}
.assistant-builder-question button.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(var(--accent-rgb),.14);}
.assistant-builder-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.assistant-builder-row label{display:grid;gap:5px;min-width:0;}
.assistant-builder-submit{width:100%;border:0;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-radius:16px;padding:10px 12px;font-size:12px;font-weight:950;cursor:pointer;box-shadow:0 10px 22px rgba(var(--accent-rgb),.18);}
.dark .assistant-builder-card{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.26)!important;}
.dark .assistant-builder-field input,.dark .assistant-builder-field select,.dark .assistant-builder-row select,.dark .assistant-builder-question button,.dark .assistant-builder-head button{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;color:var(--text)!important;}
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
  .assistant-builder-card{max-height:34dvh;margin-bottom:8px!important;}
  .assistant-builder-row{grid-template-columns:1fr;}
}

/* ── Conversational assistant creation flow ───────────────────────────── */
.assistant-flow-card{margin:0 12px 10px;padding:12px;border:1.5px solid rgba(var(--accent-rgb),.16);border-radius:22px;background:linear-gradient(135deg,var(--surface),var(--surface-soft));box-shadow:0 14px 34px rgba(var(--accent-rgb),.10);display:grid;gap:9px;flex:0 0 auto;max-height:230px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.assistant-flow-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.assistant-flow-head span{display:block;font-family:var(--mono);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:3px;}
.assistant-flow-head strong{display:block;font-size:13px;font-weight:950;color:var(--text);line-height:1.28;white-space:pre-line;}
.assistant-flow-head button{width:26px;height:26px;border-radius:9px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);font-weight:950;cursor:pointer;flex:0 0 auto;}
.assistant-flow-options{display:flex;gap:6px;flex-wrap:wrap;}
.assistant-flow-options button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer;}
.assistant-flow-options button:hover{border-color:var(--accent3);color:var(--accent);background:var(--bg4);}
.assistant-flow-hint{font-size:10.5px;font-weight:800;color:var(--text3);}
.dark .assistant-flow-card{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.26)!important;}
.dark .assistant-flow-options button,.dark .assistant-flow-head button{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;color:var(--text)!important;}
@media(max-width:760px){.assistant-flow-card{max-height:30dvh;margin-bottom:8px!important;}.assistant-flow-options{flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;}.assistant-flow-options::-webkit-scrollbar{display:none;}.assistant-flow-options button{flex:0 0 auto;}}


/* ── Phase 24C AI assistant endpoint UI ───────────────────────────────── */
.assistant-thinking .msg-bubble{min-width:54px;display:flex;align-items:center;justify-content:center;}
.assistant-typing-dots{display:inline-flex;align-items:center;gap:4px;height:18px;}
.assistant-typing-dots i{width:6px;height:6px;border-radius:999px;background:var(--accent);opacity:.38;animation:tempoTypingDots 1.1s infinite ease-in-out;}
.assistant-typing-dots i:nth-child(2){animation-delay:.16s;}
.assistant-typing-dots i:nth-child(3){animation-delay:.32s;}
@keyframes tempoTypingDots{0%,80%,100%{transform:translateY(0);opacity:.32;}40%{transform:translateY(-4px);opacity:1;}}
.chat-send:disabled{opacity:.48;cursor:not-allowed;filter:saturate(.7);}

`; }
