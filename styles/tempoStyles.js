export function appCSS(cvars, fontScale) { return `
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
  .task-panel.collapsed{width:28px;}
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
    .task-panel-toggle{display:none;}
    .chat-panel{width:calc(100vw - 32px);right:16px;left:16px;bottom:86px;}
    .chat-fab{bottom:80px;}
    .stats-bar{overflow-x:auto;flex-wrap:nowrap;}
    .pomo-widget{right:16px;bottom:140px;}
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
  .cal-toggleable{cursor:pointer;transition:opacity .15s;border-radius:8px;padding:5px 6px;margin:-2px -6px;gap:8px;}
  .cal-toggleable:hover{background:var(--bg3);}
  .cal-hidden{opacity:.45;}
  .cal-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:background .2s;}
  .cal-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600;color:var(--text2);}
  .cal-eye{font-size:10px;color:var(--text3);flex-shrink:0;}
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
  .recurrence-editor{width:100%;display:flex;flex-direction:column;gap:8px;}
  .recurrence-custom{display:flex;flex-direction:column;gap:6px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:8px;}
  .weekday-picker{display:flex;gap:5px;flex-wrap:wrap;}
  .weekday-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg2);color:var(--text2);font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer;}
  .weekday-btn.active{background:var(--accent);border-color:var(--accent);color:white;}
  .tasks-page{height:100%;overflow:auto;padding:20px;}
  .task-panel.standalone{display:flex;position:relative;width:100%;height:auto;max-width:880px;border-radius:20px;margin:0 auto;border:1.5px solid var(--border);box-shadow:var(--shadow);}
  .task-panel.standalone .task-panel-inner{width:100%;}
  .task-panel.standalone .task-list{max-height:none;}
  @media(max-width:768px){
    body{overflow:hidden;}
    .main{margin-left:0;width:100%;min-width:0;}
    .app{padding-bottom:60px;}
    .modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;max-height:calc(100vh - 96px)!important;overflow-y:auto;}
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

`; }
