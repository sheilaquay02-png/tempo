export const tempoLegacyInlineCSS = `
  .editable-chip{position:relative;display:inline-flex;align-items:center;gap:3px;}
  .editable-chip-main{border:0;background:transparent;color:inherit;font:inherit;font-weight:800;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:5px;}
  .chip-mini-action{width:18px;height:18px;border-radius:999px;border:1px solid var(--border);background:var(--bg2);color:var(--text3);font-size:10px;font-weight:900;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;opacity:.65;transition:all .15s;}
  .editable-chip:hover .chip-mini-action{opacity:1;}
  .chip-mini-action:hover{background:var(--accent);border-color:var(--accent);color:white;}
  .editable-memory-row{gap:7px;}
  .task-board-nav{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 14px;}
  .task-period-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;}
  .task-period-card{min-height:420px;background:var(--bg2);border:1.5px solid var(--border);border-radius:22px;box-shadow:var(--shadow-sm);padding:14px;transition:all .18s;}
  .task-period-card.drag-over{border-color:var(--accent);background:var(--bg4);box-shadow:0 12px 32px rgba(255,123,172,.16);transform:translateY(-2px);}
  .task-period-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;}
  .task-period-card-title{border:0;background:transparent;color:var(--text);font-family:var(--font);font-size:15px;font-weight:900;cursor:pointer;padding:0;}
  .task-period-count{font-family:var(--mono);font-size:10px;font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:3px 8px;white-space:nowrap;}
  .task-period-card-sub{font-size:11px;color:var(--text2);font-weight:800;margin-bottom:10px;}
  .task-card-add{width:100%;border:1.5px dashed var(--border);background:var(--bg3);color:var(--accent);border-radius:14px;padding:9px 10px;font-family:var(--font);font-weight:900;cursor:pointer;margin-bottom:10px;}
  .task-card-add:hover{border-color:var(--accent);background:var(--bg4);}
  .task-card-form{margin:0 0 10px;padding:10px;border-radius:16px;}
  .task-period-list{display:flex;flex-direction:column;gap:6px;}
  .task-card-empty{border:1.5px dashed var(--border);border-radius:16px;padding:18px 12px;text-align:center;color:var(--text3);font-size:12px;font-weight:800;background:var(--bg3);}
  .sync-pill{border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:5px;cursor:default;white-space:nowrap;}
  .sync-pill.sync-saving{color:#B07800;background:#FFF4D8;}.sync-pill.sync-saved{color:#2E8B57;background:#EAF7EF;}.sync-pill.sync-failed{color:#D44848;background:#FFF0F0;cursor:pointer;}.sync-pill.sync-offline{color:#A07090;background:var(--bg4);}
  .mobile-menu-sync-btn{display:none;margin-top:8px;width:100%;border:1.5px solid var(--border);background:var(--bg2);color:var(--accent);border-radius:12px;padding:8px 10px;font-family:var(--font);font-size:12px;font-weight:900;cursor:pointer;align-items:center;justify-content:center;gap:6px;}
  .mobile-menu-sync-btn:active{transform:scale(.98);}
  .tempo-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:#4A2840;color:white;border-radius:999px;padding:9px 16px;font-size:12px;font-weight:900;z-index:120;box-shadow:0 12px 32px rgba(0,0,0,.18);animation:toastFade 2.4s ease forwards;}@keyframes toastFade{0%{opacity:0;transform:translate(-50%,8px)}15%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,8px)}}
  .hold-cue{position:absolute;right:8px;bottom:5px;font-size:9px;font-weight:900;color:var(--text3);opacity:.0;background:var(--bg2);border:1px solid var(--border);border-radius:999px;padding:2px 6px;transition:opacity .15s;}.event-block:hover .hold-cue,.event-block.hold-holding .hold-cue,.event-block.hold-dragging .hold-cue{opacity:.92}.event-block.hold-holding{box-shadow:0 0 0 2px var(--accent3),var(--shadow-sm)}.event-block.hold-dragging{opacity:.75;}
  .memory-upload-status{font-size:11px;font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:8px 10px;margin-top:8px;}
  .memory-settings-modal{max-width:820px;width:min(92vw,820px);}.memory-settings-modal .entry-modal-body{max-height:72vh;overflow:auto;}
  .task-card-with-move{border-radius:14px;}.task-card-with-move .task-item{margin-bottom:4px;}.mini-move-btn{border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900;margin:2px 3px 6px 0;cursor:pointer;}.mini-move-btn:hover{background:var(--bg4);color:var(--accent);}
  .xp-breakdown-list{display:flex;flex-direction:column;gap:7px}.xp-breakdown-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--text2);font-weight:800}.xp-breakdown-row strong{color:var(--accent);font-family:var(--mono)}.bloom-collapse{background:var(--bg2);border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow-sm)}.bloom-collapse-head{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;background:var(--bg3);color:var(--text);font-family:var(--font);font-weight:900;padding:12px 14px;cursor:pointer}.bloom-collapse-body{padding:12px;display:flex;flex-direction:column;gap:12px}.bloom-collapse-body>.game-card{box-shadow:none;}
  @media(max-width:768px){.sync-pill{font-size:10px;padding:4px 7px}.topbar .sync-pill{display:none}.mobile-menu-sync-btn{display:flex}.desktop-sync-nav-item{display:none!important}}
  @media(max-width:900px){.task-period-board{grid-template-columns:1fr;}.task-period-card{min-height:260px;}.task-board-nav{position:sticky;top:0;background:var(--bg);z-index:5;padding:8px 0;}}
  .settings-action-row{display:flex;gap:8px;flex-wrap:wrap}.planning-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.planning-rule-grid label{font-size:12px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px;justify-content:space-between}.meal-break-list{display:flex;flex-direction:column;gap:8px}.meal-break-row{display:grid;grid-template-columns:minmax(92px,1fr) 96px auto 96px;align-items:center;gap:8px}.meal-break-row.disabled{opacity:.55}.meal-break-enabled{font-size:12px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px}.meal-time{min-width:0}.meal-dash{font-size:12px;color:var(--text2);font-weight:900}.plan-break-note{font-size:11px;color:var(--text2);font-weight:900;background:var(--bg3);border:1px dashed var(--border);border-radius:12px;padding:8px 10px}.sync-now-btn{font-weight:900}
  @media(max-width:560px){.meal-break-row{grid-template-columns:1fr 1fr auto 1fr}.meal-break-enabled{grid-column:1/-1}.planning-rule-grid{grid-template-columns:1fr}}
  .ritual-modal{max-width:720px;width:min(94vw,720px);}.ritual-modal .modal-body{max-height:72vh;overflow:auto;}.ritual-form-title-row{display:grid;grid-template-columns:74px 1fr;gap:10px;}.ritual-emoji-input{text-align:center;font-size:28px;padding:8px!important;}.modal-row-full{align-items:start!important}.ritual-weekday-picker{justify-content:flex-start;}.ritual-steps-editor{background:var(--bg3);border:1px solid var(--border);border-radius:18px;padding:12px;}.ritual-step-edit-row{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;margin-top:8px;}.ritual-step-edit-row>span{height:28px;width:28px;border-radius:999px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:var(--text3)}.ritual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ritual-card{background:linear-gradient(180deg,var(--bg2),var(--bg3));border:1px solid var(--border);border-left:5px solid var(--ritual-color);border-radius:22px;padding:14px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px}.ritual-complete{border-left-color:#70C8A0}.ritual-skipped{opacity:.68}.ritual-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ritual-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}.ritual-emoji{width:42px;height:42px;border-radius:16px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}.ritual-title-wrap h3{font-size:16px;margin:0 0 2px;color:var(--text);line-height:1.1}.ritual-title-wrap p{font-size:11px;color:var(--text2);font-weight:900;margin:0}.ritual-edit-btn{padding:5px 9px!important;margin:0!important}.ritual-progress-track{height:7px;border-radius:999px;background:var(--border);overflow:hidden}.ritual-progress-track i{display:block;height:100%;border-radius:999px;background:var(--ritual-color);transition:width .2s ease}.ritual-progress-label{font-size:11px;font-weight:900;color:var(--text2)}.ritual-step-list{display:flex;flex-direction:column;gap:6px}.ritual-step{display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:8px 10px;font-size:12px;font-weight:850;color:var(--text);cursor:pointer}.ritual-step input{accent-color:var(--accent)}.ritual-step.checked span{text-decoration:line-through;color:var(--text3)}.ritual-more{font-size:11px;font-weight:900;color:var(--text3);padding-left:4px}.ritual-card-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}.ritual-list-compact{display:flex;flex-direction:column;gap:8px}.ritual-list-row{display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:10px;background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:10px}.ritual-list-emoji{width:42px;height:42px;border-radius:14px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:23px}.ritual-list-row strong{display:block;font-size:13px;color:var(--text)}.ritual-list-row small{display:block;font-size:11px;color:var(--text2);font-weight:850;margin-top:2px}.today-ritual-stack{display:flex;flex-direction:column;gap:10px}.today-ritual-stack .ritual-card{box-shadow:none;border-radius:18px;padding:12px}.today-ritual-stack .ritual-title-wrap h3{font-size:14px}.today-ritual-stack .ritual-emoji{width:34px;height:34px;border-radius:12px;font-size:20px}.today-ritual-stack .ritual-step{padding:7px 8px;font-size:11px}.ritual-section-card{width:min(100%,1080px)}.ritual-template-section{background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(255,247,251,.94))}.ritual-template-head{align-items:flex-start;gap:12px}.ritual-template-head>div:first-child{display:flex;flex-direction:column;gap:3px}.ritual-template-head small{font-size:11px;color:var(--text2);font-weight:850}.ritual-template-filters{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.mini-pill{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;cursor:pointer}.mini-pill.active{background:rgba(255,123,172,.12);border-color:rgba(255,123,172,.45);color:var(--accent)}.ritual-template-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ritual-template-card{background:var(--bg2);border:1px solid var(--border);border-top:4px solid var(--ritual-color);border-radius:20px;padding:14px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px;min-height:260px}.ritual-template-card.template-added{background:linear-gradient(180deg,var(--bg2),rgba(112,200,160,.08))}.ritual-template-top{display:flex;align-items:center;gap:10px}.ritual-template-emoji{width:42px;height:42px;border-radius:16px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}.ritual-template-top h3{font-size:15px;margin:0 0 2px;color:var(--text);line-height:1.12}.ritual-template-top p{font-size:11px;color:var(--text2);font-weight:900;margin:0}.ritual-template-desc{font-size:12px;line-height:1.45;color:var(--text2);font-weight:750}.ritual-template-steps{display:flex;flex-direction:column;gap:5px;background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:9px;margin-top:auto}.ritual-template-steps span{font-size:11px;color:var(--text2);font-weight:850}.template-added-badge{align-self:flex-start;background:rgba(112,200,160,.14);border:1px solid rgba(112,200,160,.35);color:#2f8b62;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:950}.ritual-template-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}@media(max-width:1040px){.ritual-template-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:900px){.ritual-grid,.ritual-template-grid{grid-template-columns:1fr}.ritual-template-head{flex-direction:column}.ritual-template-filters{justify-content:flex-start}}@media(max-width:560px){.ritual-form-title-row{grid-template-columns:58px 1fr}.ritual-list-row{grid-template-columns:38px 1fr}.ritual-list-row button{grid-column:2}.ritual-card-top{flex-direction:column}.ritual-modal .modal-actions{flex-wrap:wrap}.ritual-steps-editor .phase-card-head{align-items:flex-start;flex-direction:column}}
  .habit-modal{max-width:640px;width:min(94vw,640px);}.habit-target-row{display:grid;grid-template-columns:96px 1fr;gap:8px;width:100%;}.habit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.habit-card{background:linear-gradient(180deg,var(--bg2),var(--bg3));border:1px solid var(--border);border-radius:22px;padding:14px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px}.habit-complete{border-color:rgba(112,200,160,.45);background:linear-gradient(180deg,var(--bg2),rgba(112,200,160,.08))}.habit-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.habit-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}.habit-emoji{width:42px;height:42px;border-radius:16px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}.habit-title-wrap h3{font-size:16px;margin:0 0 2px;color:var(--text);line-height:1.1}.habit-title-wrap p{font-size:11px;color:var(--text2);font-weight:900;margin:0}.habit-card-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.habit-check{width:100%;justify-content:flex-start}.today-habit-stack{display:flex;flex-direction:column;gap:10px}.today-habit-stack .habit-card{box-shadow:none;border-radius:18px;padding:12px}.today-habit-stack .habit-title-wrap h3{font-size:14px}.today-habit-stack .habit-emoji{width:34px;height:34px;border-radius:12px;font-size:20px}.habit-week-grid-wrap{display:flex;flex-direction:column;gap:6px;overflow:auto}.habit-week-grid{display:grid;grid-template-columns:minmax(180px,1fr) repeat(7,48px);gap:6px;align-items:center;min-width:560px}.habit-week-grid>*{background:var(--bg3);border:1px solid var(--border);border-radius:12px;min-height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--text2);padding:6px}.habit-week-grid strong{justify-content:flex-start;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.habit-week-grid-head>*{background:transparent;border:0;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;font-size:10px}.habit-week-grid span.done{background:rgba(112,200,160,.14);border-color:rgba(112,200,160,.35);color:#2f8b62}.habit-week-grid span.muted{opacity:.45}@media(max-width:900px){.habit-grid{grid-template-columns:1fr}.habit-target-row{grid-template-columns:82px 1fr}}@media(max-width:560px){.habit-card-top{flex-direction:column}.habit-week-grid{grid-template-columns:minmax(150px,1fr) repeat(7,42px);min-width:500px}.habit-modal .modal-actions{flex-wrap:wrap}}
  .phase-page{height:100%;overflow:auto;padding:22px;display:flex;flex-direction:column;gap:16px;background:var(--bg);}.phase-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;background:linear-gradient(135deg,var(--bg2),var(--bg4));border:1px solid var(--border);border-radius:28px;padding:22px;box-shadow:var(--shadow-sm);}.phase-kicker{font-size:11px;font-weight:900;color:var(--accent);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:4px;}.phase-hero h1{font-size:30px;line-height:1.05;margin:0 0 6px;color:var(--text);}.phase-hero p,.phase-copy{margin:0;color:var(--text2);font-size:13px;font-weight:800;line-height:1.55;}.phase-primary{white-space:nowrap;}.phase-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}.phase-summary-grid button{background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:14px 12px;text-align:left;cursor:pointer;box-shadow:var(--shadow-sm);font-family:var(--font);}.phase-summary-grid strong{display:block;color:var(--accent);font-size:24px;line-height:1;font-weight:900;}.phase-summary-grid span{font-size:11px;font-weight:900;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;}.phase-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}.phase-card{background:var(--bg2);border:1px solid var(--border);border-radius:22px;padding:16px;box-shadow:var(--shadow-sm);}.phase-wide-card{max-width:900px;}.phase-page>.phase-wide-card{width:100%;max-width:none;}.phase-page .ritual-section-card{width:100%;max-width:none;}.phase-page .ritual-grid,.phase-page .habit-grid{grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}.phase-page .ritual-template-grid{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));}.habits-page .phase-card,.rituals-page .phase-card{width:100%;}.habit-week-grid-wrap{width:100%;}.habit-week-grid{grid-template-columns:minmax(260px,1fr) repeat(7,minmax(54px,72px));}.phase-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;}.phase-card-head span{font-size:15px;font-weight:900;color:var(--text);}.phase-card-head button{border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:5px 9px;font-family:var(--font);font-weight:900;font-size:11px;cursor:pointer;}.phase-card-head small{font-size:10px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;}.phase-list-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding:9px 0;font-size:13px;font-weight:850;color:var(--text);}.phase-list-row:first-child{border-top:0;}.phase-list-row small{color:var(--text3);font-weight:900;white-space:nowrap;}.phase-empty{font-size:13px;font-weight:800;color:var(--text2);line-height:1.5;background:var(--bg3);border:1px dashed var(--border);border-radius:16px;padding:14px;}.phase-placeholder-card{opacity:.92;}.phase-bullet-list{display:flex;flex-direction:column;}.coming-soon-page .phase-wide-card{width:min(720px,100%);}@media(max-width:768px){.phase-page{padding:14px 12px 90px;}.phase-hero{align-items:flex-start;flex-direction:column;border-radius:22px;padding:18px;}.phase-hero h1{font-size:24px;}.phase-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.phase-grid-two{grid-template-columns:1fr;}.phase-card{border-radius:18px;padding:14px;}}.reminder-editor{display:flex;flex-direction:column;gap:8px}.reminder-custom-row{margin:0!important;grid-template-columns:auto 1fr!important}.task-progress-mini{display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--text2);font-weight:900;margin:6px 0}.task-progress-track{height:6px;border-radius:999px;background:var(--border);overflow:hidden}.task-progress-track i{display:block;height:100%;border-radius:999px;background:var(--accent)}.task-progress-mini strong{color:var(--accent)}.plan-day-btn{background:linear-gradient(135deg,var(--accent),#B08AE0)!important;color:#fff!important;border-color:transparent!important}.plan-summary{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:12px;font-weight:800;color:var(--text2)}.plan-summary strong{color:var(--accent)}.plan-list{display:flex;flex-direction:column;gap:8px}.plan-row{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:14px;font-weight:800}.plan-row strong{color:var(--accent);white-space:nowrap}.plan-warning{font-size:12px;color:#C07820;font-weight:900;background:#FFF6E6;border:1px solid #FFE2A8;border-radius:14px;padding:10px}.day-plan-modal .modal-body{gap:12px}

  .today-page-v2{gap:18px;}.today-dashboard-hero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr);gap:14px;align-items:stretch;}.today-hero-stack{display:flex;flex-direction:column;gap:12px;min-width:0;}.today-hero-stack .affirmation-daily-card.compact{padding:16px;border-radius:24px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-quote-row blockquote{font-size:15px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-quote-icon{width:42px;height:42px;border-radius:15px;font-size:22px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-card-actions{margin-top:10px;}.today-hero-stack .affirmation-daily-card.compact .affirmation-card-actions .tf-cancel{display:none;}.today-dashboard-hero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr);gap:14px;align-items:stretch;}.today-hero-copy{background:linear-gradient(135deg,var(--bg2),var(--bg4));border:1px solid var(--border);border-radius:28px;padding:24px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;justify-content:center;}.today-hero-copy h1{font-size:34px;line-height:1.03;margin:0 0 6px;color:var(--text);}.today-hero-copy p{font-size:14px;color:var(--text2);font-weight:900;line-height:1.5;margin:0}.today-hero-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}.today-checkin-card{background:var(--bg2);border:1px solid var(--border);border-radius:28px;padding:18px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:10px;}.today-checkin-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.8px}.today-checkin-top button,.today-row-action{border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:5px 9px;font-family:var(--font);font-weight:900;font-size:11px;cursor:pointer}.today-mood-display{display:flex;align-items:center;gap:10px;background:var(--bg4);border:1px solid var(--border);border-radius:18px;padding:12px}.today-mood-display span{font-size:28px}.today-mood-display strong{font-size:16px;color:var(--text)}.today-energy-row{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px dashed var(--border);background:var(--bg3);border-radius:14px;padding:9px 11px;font-size:12px;font-weight:900;color:var(--text2)}.today-energy-row strong{color:var(--accent)}.today-checkin-card p{font-size:12px;font-weight:800;line-height:1.45;color:var(--text2);margin:0}.today-rhythm-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.today-rhythm-strip button{background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:14px 12px;text-align:left;box-shadow:var(--shadow-sm);cursor:pointer;font-family:var(--font);display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center}.today-rhythm-strip button>span{font-size:20px;grid-row:1/3}.today-rhythm-strip strong{font-size:23px;line-height:1;color:var(--accent);font-weight:900}.today-rhythm-strip small{font-size:10px;font-weight:900;color:var(--text3);text-transform:uppercase;letter-spacing:.6px}.today-dashboard-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:14px;align-items:start}.today-main-card,.today-side-card,.today-wide-card{min-width:0}.today-wide-card{grid-column:span 1}.today-task-list,.today-event-list{display:flex;flex-direction:column;gap:8px}.today-task-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:10px}.today-task-check{width:28px;height:28px;border-radius:999px;border:1.5px solid var(--border);background:var(--bg2);color:var(--accent);font-weight:900;cursor:pointer}.today-task-row strong{display:block;font-size:13px;color:var(--text);line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.today-task-row small{display:block;font-size:11px;color:var(--text2);font-weight:900;margin-top:2px}.today-event-row{display:grid;grid-template-columns:70px minmax(0,1fr);gap:10px;align-items:center;background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:10px}.today-event-row time{font-family:var(--mono);font-size:12px;font-weight:900;color:var(--accent);white-space:nowrap}.today-event-row strong{display:block;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.today-event-row small{font-size:11px;color:var(--text3);font-weight:900}.today-dashboard-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.today-dashboard-card-grid .ritual-card,.today-dashboard-card-grid .habit-card{box-shadow:none}.today-bottom-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.75fr);gap:14px}.today-prompt{font-size:16px;line-height:1.5;font-weight:900;color:var(--text);background:var(--bg3);border:1px solid var(--border);border-radius:16px;padding:14px;margin:0}.today-journal-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.today-loop{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:12px}.today-loop span{font-size:11px;font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:6px 9px}.today-loop i{width:14px;height:1px;background:var(--border);display:block}.today-side-card .phase-empty,.today-main-card .phase-empty{min-height:74px;display:flex;align-items:center}@media(min-width:1280px){.today-dashboard-grid{grid-template-columns:1fr 1fr}.today-wide-card{grid-column:span 1}.today-dashboard-card-grid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));}}@media(max-width:980px){.today-dashboard-hero,.today-bottom-grid{grid-template-columns:1fr}.today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.today-dashboard-grid{grid-template-columns:1fr}.today-wide-card{grid-column:auto}}@media(max-width:560px){.today-hero-copy,.today-checkin-card{border-radius:22px;padding:16px}.today-hero-copy h1{font-size:26px}.today-rhythm-strip{grid-template-columns:1fr 1fr}.today-rhythm-strip button{padding:12px 10px}.today-task-row{grid-template-columns:auto minmax(0,1fr)}.today-row-action{grid-column:2;justify-self:start}.today-event-row{grid-template-columns:58px minmax(0,1fr)}.today-journal-actions{flex-direction:column}.today-journal-actions button{width:100%;}}


  /* ── Phase 18: mobile-first polish ─────────────────────────────────────── */
  .mobile-sidebar-scrim{display:none;}
  .mobile-sync-strip{display:none;}
  .ritual-open-checklist{white-space:nowrap;}
  .ritual-focus-overlay{position:fixed;inset:0;z-index:1200;background:rgba(54,32,50,.32);display:flex;align-items:center;justify-content:center;padding:18px;}
  .ritual-focus-sheet{width:min(560px,calc(100vw - 28px));max-height:min(86vh,780px);overflow:auto;background:var(--bg2);border:1.5px solid var(--border);border-top:5px solid var(--ritual-color);border-radius:28px;box-shadow:0 24px 80px rgba(74,40,64,.22);padding:18px;display:flex;flex-direction:column;gap:14px;}
  .ritual-focus-head{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;background:var(--bg2);z-index:2;padding-bottom:8px;border-bottom:1px solid var(--border);}
  .ritual-focus-step-list{gap:9px;}
  .ritual-focus-step-list .ritual-step{padding:12px 13px;border-radius:16px;font-size:14px;min-height:48px;}
  .ritual-focus-actions{display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:var(--bg2);padding-top:10px;border-top:1px solid var(--border);}

  @media(max-width:768px){
    :root{--mobile-nav-h:calc(70px + env(safe-area-inset-bottom));}
    body{overscroll-behavior:none;}
    .app{height:100dvh;padding-bottom:var(--mobile-nav-h);}
    .main{height:100%;}
    .content-area{height:100%;padding-bottom:0;}
    .mobile-sidebar-scrim.open{display:block;position:fixed;inset:0;bottom:var(--mobile-nav-h);z-index:155;background:rgba(54,32,50,.26);border:0;}
    .sidebar{bottom:var(--mobile-nav-h)!important;border-radius:0 22px 0 0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
    .sidebar.closed + .mobile-sidebar-scrim{display:none!important;}
    .sidebar-nav{flex:1;min-height:0;overflow-y:auto;padding-bottom:18px;-webkit-overflow-scrolling:touch;}
    .sidebar-cals{max-height:34vh;overflow-y:auto;-webkit-overflow-scrolling:touch;}

    .mobile-nav{height:var(--mobile-nav-h);padding:7px 6px calc(7px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 -8px 30px rgba(184,111,143,.12);gap:3px;}
    .dark .mobile-nav{background:var(--dark-nav)!important;border-color:rgba(var(--accent-rgb),.34)!important;}
    .mobile-nav-btn{min-width:0;border-radius:16px;font-size:20px;font-weight:900;touch-action:manipulation;}
    .mobile-nav-btn span{font-size:9.5px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .mobile-nav-btn.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent3);}
    .mobile-nav-btn:active{transform:scale(.97);}
    .mobile-sync-strip{display:flex;position:fixed;left:10px;right:10px;bottom:calc(var(--mobile-nav-h) + 8px);z-index:118;justify-content:center;pointer-events:none;}
    .mobile-sync-strip .sync-pill{pointer-events:auto;max-width:calc(100vw - 28px);white-space:normal;justify-content:center;text-align:center;box-shadow:0 10px 28px rgba(184,111,143,.18);}

    .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{height:100%;overflow:auto;-webkit-overflow-scrolling:touch;scroll-padding-bottom:calc(var(--mobile-nav-h) + 24px);}
    .phase-page{padding:12px 12px calc(var(--mobile-nav-h) + 22px)!important;gap:14px;}
    .phase-hero{position:sticky;top:0;z-index:70;border-radius:0 0 22px 22px;margin:-12px -12px 4px;padding:16px 14px;background:var(--bg2);box-shadow:0 1px 0 var(--border), var(--shadow-sm);}
    .phase-hero h1{font-size:23px;}
    .phase-hero p{font-size:12px;}
    .phase-hero .tf-save,.phase-hero .tf-cancel{min-height:44px;width:100%;}
    .phase-card{border-radius:20px;padding:15px;}
    .phase-card-head{align-items:flex-start;gap:8px;}
    .phase-card-head button,.phase-card-head .tf-cancel,.phase-card-head .tf-save{min-height:38px;padding:8px 11px;}

    .today-page-v2{padding-top:12px!important;}
    .today-dashboard-hero,.today-dashboard-grid,.today-bottom-grid,.today-dashboard-card-grid{grid-template-columns:1fr!important;}
    .today-hero-copy{padding:18px;border-radius:24px;}
    .today-hero-copy h1{font-size:27px;}
    .today-hero-actions{display:grid;grid-template-columns:1fr;gap:8px;}
    .today-hero-actions button,.today-journal-actions button{min-height:46px;}
    .today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr));}
    .today-rhythm-strip button{min-height:74px;}
    .today-task-row,.today-event-row,.phase-list-row,.ritual-list-row{min-height:52px;}

    .task-board-nav{top:0!important;padding:10px 0!important;}
    .tasks-page{padding:0 12px calc(var(--mobile-nav-h) + 18px)!important;}
    .tasks-page > .journal-header,.journal-header,.bloom-room-page .journal-header{min-height:58px;}
    .task-item,.task-card-with-move,.today-task-row{touch-action:pan-y;position:relative;}
    .task-item::after,.today-task-row::after{content:"Swipe-friendly";display:none;position:absolute;right:10px;bottom:6px;font-size:9px;font-weight:900;color:var(--text3);}
    .task-item button,.task-card-with-move button,.today-task-row button,.tf-save,.tf-cancel,.tf-delete,.modal-close,.mini-pill,.weekday-btn{min-height:40px;touch-action:manipulation;}

    .calendar-pane{padding:10px 10px calc(var(--mobile-nav-h) + 16px)!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
    .calendar-pane.view-week,.calendar-pane.view-month{padding-bottom:calc(var(--mobile-nav-h) + 16px)!important;}
    .topbar{position:sticky;top:0;z-index:85;background:var(--bg2);box-shadow:0 1px 0 var(--border), var(--shadow-sm);height:auto;min-height:58px;overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .topbar-btn,.view-tab{min-height:40px;}
    .event-block{min-height:36px;border-radius:14px;padding:8px 10px;touch-action:manipulation;}
    .event-resize-handle{opacity:.55;height:12px;}
    .month-day{touch-action:manipulation;}
    .wt-day-header{min-height:48px;touch-action:manipulation;}

    .ritual-grid,.habit-grid,.ritual-template-grid,.affirmation-list-grid{grid-template-columns:1fr!important;}
    .ritual-card,.habit-card{border-radius:22px;padding:15px;}
    .ritual-card-actions,.habit-card-actions{display:grid;grid-template-columns:1fr;gap:8px;}
    .ritual-card-actions button,.habit-card-actions button,.habit-check{width:100%;min-height:46px;}
    .ritual-step{min-height:46px;padding:12px;font-size:13px;}
    .ritual-step input{width:20px;height:20px;}
    .ritual-open-checklist{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);background:var(--bg3);color:var(--accent);border-radius:999px;padding:9px 12px;font:inherit;font-size:12px;font-weight:950;cursor:pointer;}
    .ritual-focus-overlay{align-items:flex-end;padding:0;z-index:1250;}
    .ritual-focus-sheet{width:100vw;max-width:100vw;max-height:calc(100dvh - var(--mobile-nav-h));border-radius:28px 28px 0 0;border-left:0;border-right:0;border-bottom:0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));}
    .ritual-focus-head{margin:-18px -16px 0;padding:16px;background:var(--bg2);}
    .ritual-focus-step-list .ritual-step{font-size:15px;min-height:54px;}
    .ritual-focus-actions{display:grid;grid-template-columns:1fr 1fr;margin:0 -16px -18px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));}

    .habit-week-grid-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px;}
    .habit-week-grid{min-width:0!important;grid-template-columns:minmax(120px,1.5fr) repeat(7,minmax(38px,1fr))!important;gap:5px;}
    .habit-week-grid>*{min-height:42px;padding:6px 4px;}

    .journal-page textarea,.entry-modal textarea,.memory-caption-input,.gratitude-input,.modal-textarea,.checkin-note-input{min-height:48px;line-height:1.5;}
    .entry-modal .modal-actions,.entry-modal .entry-modal-actions,.modal-actions{position:sticky;bottom:0;background:var(--bg2);z-index:60;padding-top:10px;border-top:1px solid var(--border);}

    .undo-btn{bottom:calc(var(--mobile-nav-h) + 18px);}
    .chat-panel{bottom:calc(var(--mobile-nav-h) + 14px)!important;max-height:calc(100dvh - var(--mobile-nav-h) - 32px);}
    .event-copy-bar{bottom:calc(var(--mobile-nav-h) + 12px);}
    .tempo-toast{bottom:calc(var(--mobile-nav-h) + 16px)!important;}
  }

  .notification-pref-emoji{font-size:18px;}.notification-pref-card strong,.notification-schedule-row strong{display:block;color:var(--text);font-size:12px;font-weight:950;}.notification-pref-card small,.notification-schedule-row small{display:block;color:var(--text3);font-size:10px;font-weight:850;margin-top:2px;}
  .notification-schedule-list{display:flex;flex-direction:column;gap:8px;margin-top:10px;}.notification-schedule-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center;gap:8px;border:1px solid var(--border);background:var(--bg2);border-radius:16px;padding:10px 12px;}.notification-day-select{min-width:118px;padding:8px 10px;}
  @media(max-width:560px){.notification-pref-grid{grid-template-columns:1fr}.notification-schedule-row{grid-template-columns:minmax(0,1fr) auto;}.notification-schedule-row .meal-time,.notification-day-select{grid-column:1/-1;width:100%;}}

  .sync-debug-panel{margin-top:12px;border:1px solid rgba(var(--accent-rgb),.16);background:var(--surface-soft);border-radius:20px;padding:12px;display:flex;flex-direction:column;gap:10px;}
  .sync-debug-top{display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text);font-size:12px;font-weight:950;}
  .sync-debug-top span{font-size:10px;color:var(--accent);background:rgba(var(--accent-rgb),.10);border:1px solid rgba(var(--accent-rgb),.16);border-radius:999px;padding:4px 8px;}
  .sync-debug-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
  .sync-debug-grid div{background:var(--surface);border:1px solid rgba(var(--accent-rgb),.13);border-radius:14px;padding:8px 9px;min-width:0;}
  .sync-debug-grid strong{display:block;color:var(--text);font-size:13px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sync-debug-grid span{display:block;color:var(--text3);font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.04em;margin-top:2px;}
  .sync-debug-datasets{display:flex;flex-wrap:wrap;gap:6px;}
  .sync-debug-datasets span{font-size:10px;font-weight:850;color:var(--text2);background:var(--surface);border:1px solid rgba(var(--accent-rgb),.12);border-radius:999px;padding:4px 7px;}
  .sync-conflict-list{display:flex;flex-direction:column;gap:6px;}
  .sync-conflict-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:center;background:var(--surface);border:1px solid rgba(var(--accent-rgb),.12);border-radius:14px;padding:7px 8px;font-size:10px;}
  .sync-conflict-row span{color:var(--accent);font-weight:950;}.sync-conflict-row strong{color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.sync-conflict-row em{font-style:normal;color:var(--text3);font-weight:850;}
  @media(max-width:560px){.sync-debug-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.sync-conflict-row{grid-template-columns:1fr}.sync-conflict-row strong{white-space:normal}}


  /* ── Phase 19: visual rebrand system ─────────────────────────────────────── */
  .app{background:radial-gradient(circle at 14% 0%,rgba(var(--accent-rgb),.10),transparent 30%),linear-gradient(180deg,var(--bg),var(--bg3));}
  .main{background:transparent;}
  .sidebar{background:linear-gradient(180deg,var(--surface),var(--surface-soft));border-right:1px solid rgba(var(--accent-rgb),.16);box-shadow:8px 0 34px rgba(116,78,60,.045);}
  .sidebar-logo{padding:22px 20px;border-bottom:1px solid rgba(var(--accent-rgb),.14);background:linear-gradient(135deg,var(--surface),var(--surface-soft));}
  .sidebar-logo .logo-icon,.login-mascot .mascot-icon{box-shadow:0 10px 24px rgba(var(--accent-rgb),.18);}
  .sidebar-date{background:var(--surface-soft);border-bottom:1px solid rgba(var(--accent-rgb),.12);}
  .sidebar-date .date-big{background:linear-gradient(135deg,var(--accent),#B98277);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .nav-item{border-radius:16px;margin-bottom:4px;font-weight:850;}
  .nav-icon{filter:saturate(.86);opacity:.9;}
  .nav-item:hover{background:rgba(var(--accent-rgb),.08);}
  .nav-item.active{background:linear-gradient(135deg,rgba(var(--accent-rgb),.14),rgba(255,255,255,.72));box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.20);}
  .topbar,.stats-bar{background:linear-gradient(180deg,var(--surface),var(--surface-warm));border-color:rgba(var(--accent-rgb),.14);box-shadow:0 10px 28px rgba(116,78,60,.045);}
  .topbar-btn,.view-tabs,.view-tab.active,.stat,.sync-pill,.sidebar-daily-stats-btn{border-color:rgba(var(--accent-rgb),.16);box-shadow:none;}
  .topbar-btn,.stat,.sync-pill,.view-tabs{background:var(--surface-soft);}
  .topbar-btn:hover,.view-tab.active,.sidebar-daily-stats-btn:hover{background:rgba(var(--accent-rgb),.10);border-color:rgba(var(--accent-rgb),.28);}
  .add-event-btn,.tf-save,.plan-day-btn,.chat-send{background:linear-gradient(135deg,var(--accent),#C99284)!important;box-shadow:0 12px 28px rgba(var(--accent-rgb),.22)!important;}
  .tf-save,.tf-cancel,.topbar-btn,.phase-card-head button,.today-row-action,.mini-pill,.affirmation-favorite-btn,.affirmation-list-actions button,.ritual-open-checklist{border-radius:999px;}
  .tf-cancel{background:var(--surface);border-color:rgba(var(--accent-rgb),.18);}
  .tf-cancel:hover{background:rgba(var(--accent-rgb),.08);color:var(--accent);border-color:rgba(var(--accent-rgb),.28);}

  .phase-page,.soft-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{background:radial-gradient(circle at 0% 0%,rgba(var(--accent-rgb),.075),transparent 30%),linear-gradient(180deg,var(--bg),var(--bg3));}
  .phase-page{gap:20px;}
  .phase-hero,.today-hero-copy,.affirmation-hero{background:linear-gradient(135deg,var(--surface),var(--surface-soft))!important;border:1px solid rgba(var(--accent-rgb),.16)!important;border-radius:32px!important;box-shadow:var(--shadow-sm)!important;}
  .phase-hero h1,.today-hero-copy h1,.affirmation-hero h1{letter-spacing:-.045em;color:var(--text);}
  .phase-hero p,.today-hero-copy p,.affirmation-hero p{color:var(--text2);font-weight:750;}

  .phase-card,.task-period-card,.task-panel.standalone,.tomorrow-reset-card.page-card,.tomorrow-reset-section,.weekly-reset-panel,.stats-card,.daily-quests-card,.badges-card,.game-soft-card,.bloom-collapse,.reflection-hub-card,.checkin-rhythm-card,.tomorrow-reset-rhythm-card,.weekly-reset-rhythm-card,.affirmation-feature-card,.affirmation-list-card,.affirmation-daily-card,.affirmation-rhythm-card,.journal-reflection-hub,.journal-checkin-card,.journal-reset-card,.memory-page-card,.plan-task-picker,.plan-context-card>div,.plan-soft-blocks,.modal,.checkin-modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{background:linear-gradient(180deg,var(--surface),var(--surface-warm))!important;border:1px solid rgba(var(--accent-rgb),.16)!important;border-radius:28px!important;box-shadow:var(--shadow-sm)!important;}
  .phase-card:hover,.ritual-card:hover,.habit-card:hover,.task-period-card:hover,.affirmation-list-card:hover,.memory-page-card:hover:not(.future){box-shadow:var(--shadow)!important;transform:translateY(-1px);}
  .phase-card-head{margin-bottom:14px;}
  .phase-card-head span,.phase-card-head strong,.game-card-title,.panel-title{font-size:15px;font-weight:950;letter-spacing:-.01em;color:var(--text);}
  .phase-card-head small,.game-card-sub{color:var(--text3);font-weight:850;}
  .phase-empty,.task-card-empty,.plan-warning{background:var(--surface-soft)!important;border:1px dashed rgba(var(--accent-rgb),.22)!important;border-radius:20px!important;color:var(--text2)!important;}

  .today-dashboard-hero,.today-dashboard-grid,.today-bottom-grid{gap:16px;}
  .today-hero-copy{padding:28px!important;}
  .today-checkin-card,.today-rhythm-strip button,.today-task-row,.today-event-row,.today-prompt,.today-mood-display,.today-energy-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:22px!important;box-shadow:0 8px 22px rgba(116,78,60,.035);}
  .today-checkin-card{border-radius:30px!important;padding:20px!important;}
  .today-mood-display{background:linear-gradient(135deg,var(--surface-soft),var(--blush-soft))!important;}
  .today-rhythm-strip button{padding:16px 14px;}
  .today-rhythm-strip strong{color:var(--accent);}
  .today-loop span{background:rgba(var(--accent-rgb),.10);border-color:rgba(var(--accent-rgb),.18);}

  .ritual-card,.habit-card,.ritual-template-card{background:linear-gradient(180deg,var(--surface),var(--surface-soft))!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:26px!important;box-shadow:var(--shadow-sm)!important;}
  .ritual-card{border-left:5px solid var(--ritual-color)!important;}
  .ritual-emoji,.habit-emoji,.ritual-template-emoji,.ritual-list-emoji,.checkin-rhythm-current .big-emoji,.affirmation-feature-emoji,.affirmation-quote-icon,.mascot-stage-icon{background:var(--surface-soft)!important;border:1px solid rgba(var(--accent-rgb),.14)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .ritual-step,.ritual-list-row,.habit-week-grid>*,.plan-task-choice,.tomorrow-reset-task,.weekly-reset-input-list input,.weekly-reset-label textarea,.tomorrow-reset-reflection-grid textarea,.checkin-option,.checkin-note-input,.modal-select,.modal-textarea,.tf-input,.tf-select,.tf-duration,.chat-input,.memory-search-input,.gratitude-input{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.16)!important;border-radius:18px!important;box-shadow:none!important;}
  .ritual-step:hover,.plan-task-choice:hover,.checkin-option:hover{border-color:rgba(var(--accent-rgb),.30)!important;background:var(--surface-soft)!important;}
  .ritual-step input,.habit-card input,.plan-task-choice input,.notification-pref-card input{accent-color:var(--accent);}
  .ritual-progress-track,.rhythm-meter-track,.skill-track,.task-progress-track{height:8px!important;background:rgba(var(--accent-rgb),.12)!important;border:1px solid rgba(var(--accent-rgb),.12)!important;border-radius:999px!important;overflow:hidden;}
  .ritual-progress-track i,.rhythm-meter-track i,.skill-fill,.task-progress-track i{background:linear-gradient(90deg,var(--accent),var(--accent2))!important;border-radius:999px;}

  .tasks-page .task-period-board{gap:16px;}
  .task-period-card{padding:18px!important;}
  .task-card-add{background:var(--surface-soft)!important;border-color:rgba(var(--accent-rgb),.20)!important;border-radius:18px!important;}
  .task-item{background:var(--surface);border:1px solid rgba(var(--accent-rgb),.10);border-radius:18px;margin-bottom:7px;padding:12px;}
  .task-item:hover{background:var(--surface-soft);border-color:rgba(var(--accent-rgb),.22);}
  .task-check{border-radius:999px;border-color:rgba(var(--accent-rgb),.22);background:var(--surface-warm);}
  .task-item.done .task-check{background:linear-gradient(135deg,var(--accent),var(--accent2));}
  .task-footer,.panel-header,.task-form{background:var(--surface-soft)!important;border-color:rgba(var(--accent-rgb),.12)!important;}

  .calendar-pane{background:transparent;}
  .day-view,.week-timetable,.month-view,.all-day-strip,.week-all-day-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.14)!important;border-radius:24px;box-shadow:var(--shadow-sm);overflow:hidden;}
  .day-view{padding:14px;}
  .hour-line,.wt-hour-line{background:rgba(var(--accent-rgb),.11)!important;}
  .event-block,.wt-event,.month-event-row,.all-day-chip,.week-all-day-chip{border-radius:14px!important;box-shadow:none!important;}
  .event-block{border-left-width:4px!important;}
  .month-day,.wt-cell,.week-all-day-cell{border-color:rgba(var(--accent-rgb),.10)!important;}
  .today-circle{background:var(--accent)!important;color:white!important;}

  .journal-header{background:linear-gradient(180deg,var(--surface),var(--surface-warm))!important;border-bottom:1px solid rgba(var(--accent-rgb),.14)!important;}
  .journal-title{letter-spacing:-.035em;}
  .mood-stats-bar,.memory-book-section,.journal-entries-section,.memory-search-section,.memory-throwback-section{background:transparent!important;}
  .journal-entry-card,.memory-throwback-card,.memory-bg-choice,.sticker-preview-chip,.sticker-asset-picker-row button{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:22px!important;box-shadow:var(--shadow-sm);}

  .bloom-room-page .game-dashboard{gap:16px;}
  .quest-item,.badge-chip,.weekly-mini-grid div,.tomorrow-reset-mini-grid div,.journal-reflection-tile,.affirmation-stats-grid div,.rhythm-mini-panel,.rhythm-insight-card,.stat-big,.rhythm-chip-row,.rhythm-category-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:18px!important;box-shadow:none!important;}
  .mascot-stage{background:linear-gradient(135deg,var(--surface-soft),var(--blush-soft))!important;border-color:rgba(var(--accent-rgb),.16)!important;border-radius:24px!important;}
  .garden-cell{border-color:rgba(var(--accent-rgb),.12)!important;background:var(--surface-soft)!important;}
  .garden-cell.bud,.garden-cell.bloom,.garden-cell.big,.garden-cell.gold{background:linear-gradient(135deg,var(--blush-soft),var(--surface))!important;}

  .affirmation-feature-card{background:radial-gradient(circle at top left,rgba(var(--accent-rgb),.13),transparent 36%),linear-gradient(180deg,var(--surface),var(--surface-warm))!important;}
  .affirmation-feature-top blockquote,.affirmation-quote-row blockquote{letter-spacing:-.025em;color:var(--text);}
  .affirmation-category,.affirmation-filter-row button,.notification-pref-card,.notification-schedule-row{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:18px!important;}
  .affirmation-category.active,.affirmation-filter-row button.active,.mini-pill.active,.planning-mode-btn.active,.plan-task-choice.selected{background:rgba(var(--accent-rgb),.10)!important;border-color:rgba(var(--accent-rgb),.30)!important;color:var(--accent)!important;}

  .tomorrow-reset-page,.weekly-reset-page{padding:24px 28px 96px;}
  .tomorrow-reset-head,.tomorrow-reset-section-head{gap:14px;}
  .tomorrow-reset-task{grid-template-columns:minmax(0,1fr) minmax(180px,240px);padding:13px 14px;}
  .reset-quick-actions button{background:var(--surface);border:1px solid rgba(var(--accent-rgb),.16);border-radius:999px;color:var(--accent);}
  .weekly-reset-mini-grid div,.tomorrow-reset-summary-row>div{background:var(--surface)!important;border:1px solid rgba(var(--accent-rgb),.15)!important;border-radius:18px!important;}

  .modal-overlay{background:rgba(70,52,45,.22);backdrop-filter:blur(10px);}
  .modal-header,.chat-header{background:linear-gradient(135deg,var(--surface),var(--surface-soft))!important;border-color:rgba(var(--accent-rgb),.12)!important;}
  .modal-footer,.chat-input-row{background:var(--surface-soft)!important;border-color:rgba(var(--accent-rgb),.12)!important;}
  .color-dot,.weekday-btn{box-shadow:0 3px 10px rgba(116,78,60,.06);}

  .dark .phase-card,.dark .task-period-card,.dark .task-panel.standalone,.dark .tomorrow-reset-card.page-card,.dark .tomorrow-reset-section,.dark .weekly-reset-panel,.dark .stats-card,.dark .daily-quests-card,.dark .badges-card,.dark .game-soft-card,.dark .bloom-collapse,.dark .reflection-hub-card,.dark .checkin-rhythm-card,.dark .tomorrow-reset-rhythm-card,.dark .weekly-reset-rhythm-card,.dark .affirmation-feature-card,.dark .affirmation-list-card,.dark .affirmation-daily-card,.dark .affirmation-rhythm-card,.dark .journal-reflection-hub,.dark .journal-checkin-card,.dark .journal-reset-card,.dark .memory-page-card,.dark .plan-task-picker,.dark .modal,.dark .checkin-modal,.dark .entry-modal,.dark .entry-view-modal,.dark .settings-panel,.dark .templates-panel,.dark .search-modal{background:var(--dark-card)!important;border-color:rgba(var(--accent-rgb),.28)!important;box-shadow:0 18px 45px rgba(0,0,0,.34)!important;}
  .dark .topbar,.dark .stats-bar,.dark .sidebar,.dark .journal-header{background:var(--dark-panel)!important;border-color:rgba(var(--accent-rgb),.28)!important;}
  .dark .ritual-step,.dark .habit-week-grid>*,.dark .plan-task-choice,.dark .tomorrow-reset-task,.dark .task-item,.dark .journal-entry-card,.dark .quest-item,.dark .badge-chip,.dark .weekly-mini-grid div,.dark .tomorrow-reset-mini-grid div,.dark .journal-reflection-tile,.dark .affirmation-stats-grid div,.dark .rhythm-mini-panel,.dark .rhythm-insight-card,.dark .stat-big,.dark .rhythm-chip-row,.dark .rhythm-category-row{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.24)!important;}


  /* ── Phase 21 + debug hotfixes ───────────────────────────────────────── */
  .content-area{min-height:0!important;}
  .calendar-pane{min-height:0!important;}
  .calendar-pane.view-day,.calendar-pane.view-week{display:block!important;overflow-y:auto!important;min-height:0!important;height:100%!important;padding-bottom:34px!important;}
  .calendar-pane.view-day .day-view,.calendar-pane.view-week .week-timetable{min-height:max-content!important;overflow:visible!important;}
  .calendar-pane.view-week .wt-grid,.calendar-pane.view-day .day-grid{min-height:calc((var(--calendar-hours, 18))*48px);}
  .calendar-pane.view-month{container-type:inline-size;min-width:0!important;}
  .month-view{grid-template-columns:repeat(7,minmax(0,1fr))!important;min-width:0!important;width:100%!important;}
  .month-day{min-width:0!important;min-height:clamp(82px, 10.4vw, 116px)!important;}
  .month-event-row,.month-event-name{min-width:0!important;}
  .task-panel.resizing ~ *,.calendar-pane.view-month .month-day{transition:none!important;}
  @container (max-width: 900px){.calendar-pane.view-month .month-day{min-height:96px!important;}.calendar-pane.view-month .month-event-row{font-size:9.5px!important;padding-left:3px!important;padding-right:3px!important;}}
  @container (max-width: 760px){.calendar-pane.view-month .month-day{min-height:84px!important;}.calendar-pane.view-month .month-day-num{font-size:13px!important;}.calendar-pane.view-month .month-event-row{font-size:9px!important;}}
  .reset-hero-oneline{max-width:none!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .onboarding-overlay{z-index:260;}
  .onboarding-modal{width:min(920px,calc(100vw - 28px));max-height:90vh;overflow:auto;background:linear-gradient(180deg,var(--surface,var(--bg2)),var(--surface-warm,var(--bg3)));border:1px solid rgba(var(--accent-rgb),.18);border-radius:32px;box-shadow:var(--shadow-lg);padding:22px;}
  .onboarding-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border:1px solid rgba(var(--accent-rgb),.14);background:linear-gradient(135deg,rgba(255,250,252,.94),rgba(255,255,255,.72));border-radius:26px;padding:18px;margin-bottom:14px;}
  .onboarding-hero h2{margin:2px 0 6px;font-size:30px;line-height:1.05;color:var(--text);}
  .onboarding-hero p{margin:0;color:var(--text2);font-size:13px;font-weight:800;line-height:1.45;max-width:620px;}
  .onboarding-section{border:1px solid rgba(var(--accent-rgb),.14);background:rgba(255,255,255,.58);border-radius:24px;padding:14px;margin-top:12px;}
  .onboarding-section-title{font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:10px;}
  .onboarding-choice-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;}
  .onboarding-choice,.onboarding-template{border:1.5px solid var(--border);background:var(--bg2);border-radius:18px;padding:12px;text-align:left;color:var(--text);font:inherit;cursor:pointer;box-shadow:var(--shadow-sm);}
  .onboarding-choice.selected,.onboarding-template.selected{border-color:rgba(var(--accent-rgb),.42);background:rgba(var(--accent-rgb),.10);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.08);}
  .onboarding-choice strong,.onboarding-template strong{display:block;font-size:12px;font-weight:950;line-height:1.25;}
  .onboarding-choice small,.onboarding-template small{display:block;margin-top:4px;font-size:10.5px;color:var(--text2);font-weight:800;line-height:1.3;}
  .onboarding-time-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
  .onboarding-time-grid label{display:flex;flex-direction:column;gap:6px;color:var(--text2);font-size:12px;font-weight:900;}
  .onboarding-template-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;}
  .onboarding-template span{font-size:22px;display:block;margin-bottom:5px;}
  .onboarding-reminder-row{display:flex;gap:10px;flex-wrap:wrap;}
  .onboarding-reminder-row label{border:1px solid var(--border);background:var(--bg2);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900;color:var(--text2);display:flex;align-items:center;gap:7px;}
  .onboarding-reminder-row input{accent-color:var(--accent);}
  .onboarding-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px;}

  @media(max-width:768px){
    .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page{background:linear-gradient(180deg,var(--bg),var(--bg3))!important;}
    .phase-hero{background:var(--surface)!important;border-radius:0 0 24px 24px!important;box-shadow:0 1px 0 rgba(var(--accent-rgb),.12),var(--shadow-sm)!important;}
    .topbar,.stats-bar,.journal-header,.tasks-page>.journal-header,.bloom-room-page .journal-header{background:var(--surface)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
    .phase-card,.ritual-card,.habit-card,.today-checkin-card,.today-rhythm-strip button,.today-task-row,.today-event-row{border-radius:22px!important;}
    .tomorrow-reset-page,.weekly-reset-page{padding:14px 12px calc(var(--mobile-nav-h) + 24px)!important;}
    .reset-hero-oneline{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;}
    .onboarding-modal{width:calc(100vw - 20px);padding:14px;border-radius:24px;max-height:calc(100vh - 28px);}
    .onboarding-hero{border-radius:20px;padding:14px;}.onboarding-hero h2{font-size:24px;}
    .onboarding-choice-grid,.onboarding-template-grid,.onboarding-time-grid{grid-template-columns:1fr;}
    .onboarding-actions{position:sticky;bottom:0;background:linear-gradient(180deg,transparent,var(--surface,var(--bg2)) 32%);padding-top:20px;}
    .tomorrow-reset-task{grid-template-columns:1fr;}
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


/* ── Pre Phase 22 final phone-first layout audit ─────────────────────────── */
.today-top-layout{grid-template-columns:minmax(210px,.72fr) minmax(330px,1.22fr) minmax(280px,.86fr)!important;gap:16px!important;}
.today-hero-copy{min-width:0;}
.today-top3-card{min-width:0;}
.today-top3-card .today-task-row{padding:12px 13px;}
.today-hero-stack{min-width:0;display:flex;flex-direction:column;gap:12px;}
.today-rhythm-strip{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;width:100%!important;max-width:100%!important;}
.today-rhythm-strip button{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
.today-calendar-habits-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px!important;width:100%!important;max-width:100%!important;}
.today-calendar-habits-grid>.phase-card{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
.today-next-card,[data-section="next-gentle-step"]{display:none!important;}
.journal-top-card-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px!important;margin:14px 16px!important;}
.journal-top-card-row>.journal-checkin-card,.journal-top-card-row>.journal-reset-card{min-width:0!important;width:100%!important;}
.bloom-card-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:14px!important;align-items:stretch!important;}
.bloom-card-row>.game-soft-card,.bloom-card-row>.checkin-rhythm-card,.bloom-card-row>.affirmation-rhythm-card,.bloom-card-row>.tomorrow-reset-rhythm-card,.bloom-card-row>.weekly-reset-rhythm-card{min-width:0!important;width:100%!important;height:100%!important;}
.checkin-rhythm-current .big-emoji{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 42px!important;width:42px!important;height:42px!important;font-size:28px!important;line-height:1!important;}
@media(max-width:1180px){.today-top-layout{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;}.today-hero-copy{grid-column:1/-1!important;}.today-hero-stack{grid-column:auto!important;}}
@media(max-width:980px){.today-top-layout{grid-template-columns:1fr!important;}.today-calendar-habits-grid,.bloom-card-row,.journal-top-card-row{grid-template-columns:1fr!important;}.today-rhythm-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}
@media(max-width:768px){
  :root{--mobile-nav-h:calc(74px + env(safe-area-inset-bottom));}
  .mobile-nav{height:var(--mobile-nav-h)!important;min-height:var(--mobile-nav-h)!important;padding:5px 5px calc(6px + env(safe-area-inset-bottom))!important;gap:2px!important;}
  .mobile-nav-btn{height:48px!important;min-height:48px!important;border-radius:14px!important;font-size:17px!important;padding:3px 1px!important;}
  .mobile-nav-btn span{font-size:8.2px!important;letter-spacing:-.02em!important;}
  .phase-page,.tasks-page,.journal-page,.bloom-room-page,.affirmations-page,.tomorrow-reset-page,.weekly-reset-page,.calendar-pane{padding-bottom:calc(var(--mobile-nav-h) + 22px)!important;}
  .today-top-layout{grid-template-columns:1fr!important;gap:10px!important;}
  .today-hero-copy{padding:14px!important;border-radius:22px!important;}
  .today-hero-copy h1{font-size:24px!important;margin-bottom:2px!important;}
  .today-hero-copy p{font-size:12px!important;}
  .today-hero-actions{grid-template-columns:1fr 1fr!important;gap:8px!important;}
  .today-hero-actions button{min-height:42px!important;padding:9px 10px!important;}
  .today-top3-card,.today-checkin-card,.affirmation-daily-card{padding:13px!important;border-radius:20px!important;}
  .today-top3-card .today-task-list{gap:7px!important;}
  .today-top3-card .today-task-row{min-height:44px!important;padding:9px 10px!important;}
  .today-empty-sugar{min-height:118px!important;padding:10px!important;}
  .today-empty-sugar img{width:72px!important;height:72px!important;}
  .today-empty-sugar strong{font-size:12px!important;}
  .today-rhythm-strip{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;}
  .today-rhythm-strip button{min-height:58px!important;padding:8px 3px!important;border-radius:16px!important;}
  .today-rhythm-strip button>span{font-size:16px!important;}
  .today-rhythm-strip strong{font-size:16px!important;line-height:1!important;}
  .today-rhythm-strip small{font-size:8px!important;line-height:1!important;}
  .today-calendar-habits-grid{grid-template-columns:1fr!important;gap:10px!important;}
  .today-side-card,.today-wide-card,.today-journal-card{padding:13px!important;border-radius:20px!important;}

  /* Journal: compact calendar-first phone layout */
  .journal-page{padding:8px 8px calc(var(--mobile-nav-h) + 18px)!important;gap:8px!important;}
  .journal-header{position:sticky!important;top:0!important;z-index:90!important;margin:0 -8px 6px!important;padding:9px 10px!important;min-height:48px!important;border-radius:0 0 18px 18px!important;}
  .journal-title{font-size:15px!important;}
  .journal-streak{font-size:10px!important;padding:5px 7px!important;}
  .journal-today-btn{min-height:34px!important;padding:7px 8px!important;font-size:10px!important;}
  .mood-stats-bar{margin:4px 0 7px!important;padding:7px 8px!important;gap:5px!important;}
  .mood-stat-pill{padding:3px 6px!important;font-size:11px!important;}
  .mood-stats-month{font-size:10px!important;margin-left:auto!important;}
  .journal-top-card-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin:7px 0!important;}
  .journal-checkin-card,.journal-reset-card{padding:9px!important;border-radius:16px!important;min-height:92px!important;}
  .journal-checkin-main,.journal-reset-main{gap:7px!important;align-items:flex-start!important;}
  .journal-checkin-main>span,.journal-reset-main>span{font-size:20px!important;width:28px!important;height:28px!important;flex:0 0 28px!important;}
  .journal-checkin-main strong,.journal-reset-main strong{font-size:11px!important;line-height:1.15!important;}
  .journal-checkin-main p,.journal-reset-main p{font-size:9.5px!important;line-height:1.25!important;margin-top:2px!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
  .journal-checkin-actions{margin-top:6px!important;gap:4px!important;}
  .journal-checkin-actions span{font-size:9px!important;}
  .journal-checkin-actions .journal-today-btn{min-height:30px!important;padding:5px 7px!important;font-size:9px!important;}
  .journal-weekly-reset-card,.journal-reflection-hub,.memory-search-section,.memory-throwback-section,.journal-recent-list-section{display:none!important;}
  .memory-book-section{margin-top:8px!important;padding:10px!important;border-radius:18px!important;}
  .memory-book-head{margin-bottom:7px!important;gap:6px!important;align-items:center!important;}
  .memory-book-title{font-size:14px!important;}
  .memory-book-sub{font-size:9.5px!important;}
  .memory-book-actions{gap:4px!important;}
  .memory-book-actions .journal-today-btn{min-height:32px!important;padding:6px 7px!important;font-size:9.5px!important;}
  .memory-filter-row{display:none!important;}
  .memory-page-grid{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:3px!important;width:100%!important;}
  .memory-page-card{min-width:0!important;min-height:48px!important;aspect-ratio:1/.98!important;border-radius:10px!important;padding:3px!important;box-shadow:none!important;}
  .memory-page-date{font-size:9px!important;top:4px!important;left:5px!important;}
  .memory-page-main{font-size:13px!important;gap:1px!important;}
  .memory-page-main strong{font-size:8px!important;}
  .memory-page-meta{display:none!important;}
  .memory-page-cover{border-radius:9px!important;}
  .memory-page-shade{border-radius:10px!important;}

  /* Bloom: keep paired cards on one row while staying readable */
  .bloom-room-page{padding:8px 8px calc(var(--mobile-nav-h) + 18px)!important;}
  .bloom-card-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-bottom:8px!important;}
  .bloom-card-row .game-soft-card,.bloom-card-row .checkin-rhythm-card,.bloom-card-row .affirmation-rhythm-card,.bloom-card-row .tomorrow-reset-rhythm-card,.bloom-card-row .weekly-reset-rhythm-card{padding:10px!important;border-radius:16px!important;}
  .bloom-card-row .game-card-title{font-size:11px!important;}
  .bloom-card-row .game-card-sub{font-size:8.5px!important;}
  .bloom-card-row .checkin-rhythm-current{gap:7px!important;align-items:flex-start!important;}
  .bloom-card-row .checkin-rhythm-current .big-emoji{width:30px!important;height:30px!important;flex-basis:30px!important;font-size:21px!important;}
  .bloom-card-row .checkin-rhythm-current strong{font-size:10.5px!important;line-height:1.18!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
  .bloom-card-row .checkin-rhythm-current p{font-size:9px!important;line-height:1.25!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
  .bloom-card-row .tomorrow-reset-mini-grid{display:none!important;}
}

/* ── Pre Phase 22 final audit fixes: phone layout, Bloom, Journal, Today ── */
.sidebar-sync-now-btn{
  height:32px!important;min-height:32px!important;padding:0 10px!important;border-radius:10px!important;
  border:1.5px solid var(--border)!important;background:var(--bg3)!important;color:var(--text2)!important;
  font-size:12px!important;font-weight:800!important;box-shadow:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;
}
.sidebar-sync-now-btn:hover{background:var(--bg4)!important;color:var(--accent)!important;border-color:var(--accent3)!important;}
.today-empty-sugar{min-height:142px!important;padding:12px!important;gap:6px!important;}
.today-empty-sugar img{width:82px!important;height:82px!important;object-fit:contain!important;filter:drop-shadow(0 8px 16px rgba(116,78,60,.08))!important;}
.today-empty-sugar strong{font-size:13px!important;line-height:1.35!important;}
.today-journal-only{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;}
.today-journal-card{grid-column:1!important;width:100%!important;}
.journal-top-card-row{width:calc(100% - 32px)!important;max-width:calc(100% - 32px)!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;margin:14px 16px!important;align-items:stretch!important;}
.journal-top-card-row>.journal-checkin-card,.journal-top-card-row>.journal-reset-card{margin:0!important;width:100%!important;min-width:0!important;height:100%!important;min-height:150px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;}
.journal-reset-card{max-width:100%!important;}
.bloom-room-page{display:flex!important;flex-direction:column!important;gap:16px!important;}
.bloom-card-row{gap:16px!important;align-items:stretch!important;margin-bottom:0!important;}
.bloom-card-row>*{min-width:0!important;height:100%!important;}
.bloom-mood-affirmation-row{align-items:stretch!important;}
.bloom-mood-affirmation-row .checkin-rhythm-card,.bloom-mood-affirmation-row .affirmation-rhythm-card{height:100%!important;display:flex!important;flex-direction:column!important;}
.checkin-rhythm-current .big-emoji{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 46px!important;width:46px!important;height:46px!important;font-size:30px!important;line-height:1!important;}
.game-dashboard.streak-only{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important;}
.streak-garden-flat{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important;}
.streak-garden-head{margin:0 0 10px!important;padding:0!important;}
.streak-grid-five{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:12px!important;}
.streak-garden-pill{background:var(--bg2)!important;border:1px solid var(--border)!important;border-radius:18px!important;padding:14px 8px!important;box-shadow:var(--shadow-sm)!important;min-width:0!important;}
.streak-garden-pill span{font-size:20px!important;}
.streak-garden-pill strong{font-size:17px!important;}
.streak-garden-pill small{font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
@media(max-width:980px){
  .today-journal-only{grid-template-columns:1fr!important;}
  .today-journal-card{grid-column:auto!important;}
}
@media(max-width:768px){
  .sidebar-sync-now-btn{width:100%!important;min-height:36px!important;}
  .today-empty-sugar{min-height:108px!important;}
  .today-empty-sugar img{width:56px!important;height:56px!important;}
  .journal-top-card-row{width:calc(100% - 24px)!important;max-width:calc(100% - 24px)!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:10px 12px!important;}
  .journal-top-card-row>.journal-checkin-card,.journal-top-card-row>.journal-reset-card{min-height:110px!important;}
  .memory-search-section,.journal-recent-list-section{display:block!important;}
  .memory-search-section{padding:8px 12px!important;border-bottom:0!important;}
  .memory-search-input{min-height:38px!important;border-radius:14px!important;font-size:12px!important;padding:9px 11px!important;}
  .journal-recent-list-section{padding:2px 12px 10px!important;}
  .journal-recent-list-section .journal-entries-title{font-size:12px!important;margin:6px 0 8px!important;}
  .journal-recent-list-section .journal-entry-card{padding:8px!important;border-radius:14px!important;margin-bottom:7px!important;}
  .journal-recent-list-section .jec-cover,.journal-recent-list-section .jec-emoji{width:38px!important;height:38px!important;}
  .journal-recent-list-section .jec-note,.journal-recent-list-section .jec-gratitude,.journal-recent-list-section .jec-tags{display:none!important;}
  .habits-page .phase-hero{position:relative!important;top:auto!important;z-index:auto!important;background:linear-gradient(135deg,var(--bg2),var(--bg4))!important;}
  .bloom-room-page{gap:10px!important;}
  .bloom-card-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}
  .bloom-card-row .game-soft-card,.bloom-card-row .checkin-rhythm-card,.bloom-card-row .affirmation-rhythm-card,.bloom-card-row .tomorrow-reset-rhythm-card,.bloom-card-row .weekly-reset-rhythm-card{padding:10px!important;border-radius:16px!important;}
  .checkin-rhythm-current .big-emoji{width:30px!important;height:30px!important;flex-basis:30px!important;font-size:21px!important;}
  .streak-grid-five{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;}
  .streak-garden-pill{padding:8px 3px!important;border-radius:12px!important;}
  .streak-garden-pill span{font-size:15px!important;}
  .streak-garden-pill strong{font-size:12px!important;}
  .streak-garden-pill small{font-size:7.5px!important;letter-spacing:-.1px!important;}
}



/* ── Pre Phase 22 final requested cleanup 3 ─────────────────────────────── */
.sidebar-user{margin-top:8px!important;margin-bottom:8px!important;display:block!important;}
.sidebar-sync-under-user{gap:9px!important;margin-top:8px!important;margin-bottom:12px!important;align-items:flex-start!important;}
.sidebar-sync-under-user .sync-pill{margin-top:0!important;}
.sidebar-sync-now-btn{min-height:32px!important;padding:7px 12px!important;border-radius:999px!important;}
.today-top3-card .today-empty-sugar{flex:1!important;min-height:180px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;border:0!important;background:transparent!important;box-shadow:none!important;}
.today-top3-card .today-empty-sugar img{width:96px!important;height:96px!important;object-fit:contain!important;}
.today-top3-card .today-empty-sugar strong{font-size:13px!important;line-height:1.35!important;max-width:280px!important;}
.weekly-reset-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:16px!important;align-items:start!important;}
.weekly-review-panel{grid-column:1 / -1!important;}
.weekly-priority-panel,.weekly-clear-panel{grid-column:auto!important;min-width:0!important;}
.rhythm-type-stats-row,.rhythm-life-category-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:16px!important;align-items:stretch!important;}
.rhythm-type-stats-row>*{height:100%!important;min-width:0!important;}
.rhythm-life-category-row>*{height:100%!important;min-width:0!important;}
.rhythm-category-panel{margin:0!important;}
.rhythm-life-category-row .life-garden-card{margin:0!important;}
.journal-top-card-row{display:none!important;}
@media(max-width:980px){
  .weekly-reset-grid,.rhythm-type-stats-row,.rhythm-life-category-row{grid-template-columns:1fr!important;}
}
@media(max-width:768px){
  .sidebar-user{margin-bottom:10px!important;}
  .sidebar-sync-under-user{gap:10px!important;margin-bottom:14px!important;}
  .today-top3-card .today-empty-sugar{min-height:136px!important;}
  .today-top3-card .today-empty-sugar img{width:74px!important;height:74px!important;}
}


/* ── Pre Phase 22 final cleanup 4: phone/header/sync polish ─────────────── */
.today-top3-card{display:flex!important;flex-direction:column!important;}
.today-top3-card .today-empty-sugar{
  flex:1 1 auto!important;
  min-height:220px!important;
  width:100%!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:10px!important;
  padding:18px 12px!important;
  margin:0!important;
  text-align:center!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
}
.today-top3-card .today-empty-sugar img{
  width:88px!important;
  height:88px!important;
  object-fit:contain!important;
  display:block!important;
  margin:0 auto!important;
  flex:0 0 auto!important;
}
.today-top3-card .today-empty-sugar strong{
  display:block!important;
  max-width:260px!important;
  margin:0 auto!important;
  font-size:13px!important;
  line-height:1.35!important;
  text-align:center!important;
}
.sidebar-sync-under-user{
  display:flex!important;
  flex-direction:column!important;
  gap:14px!important;
  margin-top:10px!important;
  margin-bottom:14px!important;
  align-items:flex-start!important;
}
.sidebar-sync-under-user .sync-pill{
  max-width:calc(100% - 2px)!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.sync-pill span:last-child{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;min-width:0!important;}
.sync-debug-panel.collapsed{padding:10px 12px!important;gap:0!important;}
.sync-debug-panel.collapsed .sync-debug-top{margin:0!important;}
.sync-debug-toggle{width:100%;border:0;background:transparent;font:inherit;cursor:pointer;padding:0;text-align:left;}
.journal-reflection-hub{margin-top:16px!important;}
.tempo-loading-page{min-height:100dvh!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;}
.tempo-loading-card{margin:auto!important;transform:translateY(-3vh)!important;}
@media(max-width:768px){
  .journal-page,.rhythm-stats-page,.weekly-reset-page{background:linear-gradient(180deg,var(--bg),var(--bg3))!important;}
  .journal-page .journal-header,
  .rhythm-stats-page .phase-hero,
  .weekly-reset-page .phase-hero{
    background:var(--surface)!important;
    background-color:var(--surface)!important;
    opacity:1!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
    box-shadow:0 1px 0 rgba(var(--accent-rgb),.14),0 10px 22px rgba(116,78,60,.06)!important;
    z-index:120!important;
    isolation:isolate!important;
  }
  .journal-page .journal-header::before,
  .rhythm-stats-page .phase-hero::before,
  .weekly-reset-page .phase-hero::before{
    content:""!important;
    position:absolute!important;
    inset:0!important;
    background:var(--surface)!important;
    border-radius:inherit!important;
    z-index:-1!important;
  }
  .mobile-sync-strip .sync-pill{
    max-width:180px!important;
    min-height:34px!important;
    padding:7px 10px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  .mobile-sync-strip .sync-pill.sync-pending{max-width:164px!important;}
  .mobile-sync-strip .sync-pill span:last-child{max-width:124px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
  .today-top3-card .today-empty-sugar{min-height:180px!important;gap:8px!important;}
  .today-top3-card .today-empty-sugar img{width:76px!important;height:76px!important;}
  .today-top3-card .today-empty-sugar strong{max-width:230px!important;font-size:12px!important;}
  .tempo-loading-card{transform:translateY(-5vh)!important;}
}


/* ── Pre Phase 22 debug 5: memory modal, mobile journal, sidebar sync, empty tasks ── */
.journal-header{justify-content:space-between!important;align-items:center!important;}
.journal-header-main{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto;}
.journal-header-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
.memory-settings-btn{pointer-events:auto!important;position:relative!important;z-index:3!important;}
.memory-entry-overlay,.memory-settings-overlay{z-index:2600!important;}
.memory-entry-modal .entry-modal-body,.memory-settings-modal .entry-modal-body{overscroll-behavior:contain!important;}
.sidebar-date{padding-bottom:10px!important;}
.sidebar-sync-under-user{gap:12px!important;margin-bottom:6px!important;}
.sidebar-sync-under-user .sync-pill{max-width:calc(100% - 4px)!important;}
.today-top3-card .today-empty-sugar img{width:112px!important;height:112px!important;}
.today-top3-card .today-empty-sugar{min-height:230px!important;}

@media(max-width:768px){
  .journal-header{gap:8px!important;align-items:center!important;}
  .journal-header-main{flex-direction:column!important;align-items:flex-start!important;gap:2px!important;min-width:0!important;}
  .journal-header-actions{gap:6px!important;flex-shrink:0!important;}
  .journal-header-actions .journal-today-btn{min-height:34px!important;padding:7px 8px!important;font-size:10px!important;white-space:nowrap!important;}
  .memory-entry-overlay,.memory-settings-overlay{
    inset:0 0 var(--mobile-nav-h) 0!important;
    padding:8px 8px 10px!important;
    align-items:center!important;
    justify-content:center!important;
    overflow:hidden!important;
  }
  .memory-entry-overlay .entry-modal.memory-entry-modal,
  .memory-settings-overlay .entry-modal.memory-settings-modal{
    width:calc(100vw - 16px)!important;
    max-width:calc(100vw - 16px)!important;
    height:calc(100dvh - var(--mobile-nav-h) - 20px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h) - 20px)!important;
    margin:0!important;
    overflow:hidden!important;
    display:flex!important;
    flex-direction:column!important;
  }
  .memory-entry-modal .entry-modal-header,.memory-settings-modal .entry-modal-header{padding:12px 14px 10px!important;}
  .memory-entry-modal .entry-modal-body,.memory-settings-modal .entry-modal-body{
    flex:1 1 auto!important;
    min-height:0!important;
    overflow-y:auto!important;
    -webkit-overflow-scrolling:touch!important;
    padding-bottom:16px!important;
  }
  .memory-entry-modal .entry-modal-footer,.memory-settings-modal .entry-modal-footer{
    position:sticky!important;
    bottom:0!important;
    z-index:20!important;
    padding:10px 12px calc(12px + env(safe-area-inset-bottom))!important;
    background:var(--surface-soft,var(--bg3))!important;
    border-top:1px solid var(--border)!important;
  }
  .memory-entry-modal .entry-modal-footer{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
  .memory-entry-modal .entry-modal-footer button{width:100%!important;min-height:42px!important;}
  .sidebar-date{padding-bottom:8px!important;}
  .sidebar-sync-under-user{gap:9px!important;margin-bottom:4px!important;}
  .today-top3-card .today-empty-sugar{min-height:190px!important;}
  .today-top3-card .today-empty-sugar img{width:92px!important;height:92px!important;}
}



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

/* ── Current design/debug hotfixes ───────────────────────────────────────── */
.affirmation-daily-card .affirmation-quote-row{display:grid!important;grid-template-columns:minmax(0,1fr) 52px!important;align-items:center!important;justify-content:stretch!important;text-align:left!important;column-gap:14px!important;row-gap:0!important;}
.affirmation-daily-card .affirmation-quote-text{width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-width:0!important;}
.affirmation-daily-card .affirmation-quote-row blockquote{max-width:680px!important;margin:0 auto!important;text-align:center!important;width:100%!important;}
.affirmation-daily-card .affirmation-quote-icon{justify-self:end!important;align-self:center!important;display:grid!important;place-items:center!important;line-height:1!important;}
html.dark body,body.dark{background:var(--dark-page)!important;}
.dark .app,.dark .content-area,.dark .main{background:var(--dark-page)!important;}

.tempo-logo-sticker{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 4px 8px rgba(var(--accent-rgb),.20));}
.dark .sidebar,.dark .sidebar-logo,.dark .sidebar-date,.dark .settings-panel,.dark .settings-header,.dark .settings-body,.dark .settings-section,.dark .mobile-nav,.dark .memory-settings-modal,.dark .entry-modal,.dark .entry-view-modal{background:var(--dark-panel)!important;border-color:rgba(var(--accent-rgb),.30)!important;color:var(--text)!important;}
.dark .theme-swatch-btn,.dark .choice-row,.dark .memory-manager-panel,.dark .manager-group-card,.dark .manager-row,.dark .memory-bg-choice,.dark .sticker-asset-picker-row button,.dark .sticker-preview-chip,.dark .sticker-position-pad,.dark .scrapbook-empty-note,.dark .journal-reflection-tile,.dark .tomorrow-reset-section,.dark .weekly-event-preview span{background:var(--dark-field)!important;border-color:rgba(var(--accent-rgb),.28)!important;color:var(--text)!important;}
.dark .modal-footer,.dark .entry-modal-footer,.dark .chat-input-row{background:var(--dark-nav)!important;border-color:rgba(var(--accent-rgb),.28)!important;}
.dark .mobile-nav{box-shadow:0 -10px 28px rgba(0,0,0,.34)!important;}
.today-top3-card .today-empty-sugar img{width:150px!important;height:150px!important;max-width:52vw!important;max-height:52vw!important;}
.today-top3-card .today-empty-sugar{min-height:250px!important;}
@media(max-width:768px){
  .sidebar-sync-under-user .sync-pill{display:none!important;}
  .today-top3-card .today-empty-sugar img{width:150px!important;height:150px!important;}
  .today-top3-card .today-empty-sugar{min-height:230px!important;}
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
@media(max-width:640px){
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




@media(min-width:761px){
}
@media(max-width:560px){
  .today-top3-card .today-task-row{grid-template-columns:auto minmax(0,1fr) auto!important;align-items:flex-start!important;column-gap:8px!important;}
  .today-top3-card .today-task-row>div{min-width:0!important;grid-column:2!important;}
  .today-top3-card .today-row-action{grid-column:3!important;grid-row:1!important;align-self:start!important;justify-self:end!important;min-height:30px!important;padding:6px 9px!important;font-size:10px!important;margin-top:0!important;}
  .today-top3-card .today-task-check{grid-column:1!important;grid-row:1!important;}
}



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
}







  display:flex!important;
  flex-wrap:nowrap!important;
  gap:8px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  padding:0 12px 10px!important;
  scroll-snap-type:x proximity;
  scrollbar-width:thin!important;
  -webkit-overflow-scrolling:touch!important;
}
  flex:0 0 auto!important;
  white-space:nowrap!important;
  scroll-snap-align:start;
}
@media(min-width:769px){
}


  margin:14px 14px 16px!important;
  padding:15px!important;
}
  padding:5px 14px 16px!important;
  margin:0 0 8px!important;
  gap:9px!important;
}
  display:flex;
  align-items:flex-start;
  gap:8px;
  margin-top:10px;
  padding:9px 11px;
  border:1px solid rgba(var(--accent-rgb),.16);
  border-radius:16px;
  background:rgba(var(--accent-rgb),.07);
  color:var(--text2);
}
  flex:0 0 auto;
  font-size:10px;
  font-family:var(--mono);
  font-weight:950;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--accent);
}
  min-width:0;
  font-size:11px;
  font-weight:850;
  line-height:1.35;
  color:var(--text2);
}
  background:rgba(var(--accent-rgb),.12)!important;
  border-color:rgba(var(--accent-rgb),.28)!important;
}
@media(max-width:760px){
}


  display:flex!important;
  flex-wrap:nowrap!important;
  gap:10px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  padding:14px 16px 12px!important;
  scrollbar-width:thin!important;
  scroll-snap-type:x proximity;
  -webkit-overflow-scrolling:touch!important;
}
  flex:0 0 auto!important;
  white-space:nowrap!important;
  scroll-snap-align:start;
  padding-inline:12px!important;
}
  margin:0 12px 10px;
  padding:11px;
  border:1.5px solid rgba(var(--accent-rgb),.14);
  border-radius:20px;
  background:linear-gradient(135deg,var(--surface),var(--surface-soft));
  display:grid;
  gap:8px;
  max-height:180px;
  overflow-y:auto;
  flex:0 0 auto;
}
  border:1px solid var(--border);
  background:var(--bg2);
  color:var(--text);
  border-radius:14px;
  padding:8px 9px;
  text-align:left;
  cursor:pointer;
  display:grid;
  gap:2px;
}
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  border:1px solid var(--border);
  border-radius:14px;
  background:var(--bg3);
  padding:8px 10px;
}
.settings-section-label.small{font-size:11px;margin-top:12px;}

/* ── Final journal decorator coordinate + scroll fix ────────────────── */
html.tempo-modal-locked, body.tempo-modal-locked{
  overflow:hidden!important;
  overscroll-behavior:none!important;
}
body.tempo-modal-locked{
  touch-action:none!important;
}
.modal-overlay[aria-label="View journal entry"],
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
  position:fixed!important;
  inset:0!important;
  width:100vw!important;
  height:100dvh!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  overflow:hidden!important;
  padding:18px!important;
  box-sizing:border-box!important;
  overscroll-behavior:none!important;
  touch-action:none!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
  position:relative!important;
  width:min(560px,calc(100vw - 24px))!important;
  max-width:min(560px,calc(100vw - 24px))!important;
  height:calc(100dvh - 36px)!important;
  max-height:calc(100dvh - 36px)!important;
  min-height:300px!important;
  display:flex!important;
  flex-direction:column!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
  gap:0!important;
  margin:0 auto!important;
  overflow:hidden!important;
  border:1.5px solid var(--border)!important;
  border-radius:30px!important;
  background-color:var(--bg2)!important;
  background-image:var(--memory-bg-image)!important;
  background-size:cover!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
  box-shadow:0 24px 70px rgba(76,38,58,.22)!important;
  isolation:isolate!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
  height:calc(100dvh - 284px - env(safe-area-inset-bottom,0px))!important;
  max-height:calc(100dvh - 284px - env(safe-area-inset-bottom,0px))!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header{
  position:relative!important;
  z-index:120!important;
  flex:0 0 auto!important;
  grid-column:auto!important;
  grid-row:auto!important;
  border:0!important;
  border-bottom:1px solid var(--border)!important;
  border-radius:30px 30px 0 0!important;
  background:rgba(255,248,251,.88)!important;
  box-shadow:0 8px 20px rgba(80,44,64,.08)!important;
  pointer-events:auto!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header button,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header button{
  pointer-events:auto!important;
  position:relative!important;
  z-index:130!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header .modal-close,
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header .tf-save,
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header .tf-cancel,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header .modal-close,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header .tf-save,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header .tf-cancel{
  display:inline-flex!important;
  visibility:visible!important;
  opacity:1!important;
}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-view-body,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{
  position:relative!important;
  z-index:5!important;
  flex:1 1 auto!important;
  min-height:0!important;
  grid-column:auto!important;
  grid-row:auto!important;
  border:0!important;
  border-radius:0 0 30px 30px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior:contain!important;
  touch-action:pan-y!important;
  padding-bottom:0!important;
  box-shadow:none!important;
}
.entry-view-scroll-content{
  position:relative!important;
  min-height:100%!important;
  overflow:visible!important;
  isolation:isolate!important;
}
.entry-view-scroll-content > :not(.journal-decoration-layer){
  position:relative!important;
  z-index:2!important;
}
.entry-view-scroll-content .journal-decoration-layer,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-scroll-content .journal-decoration-layer{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  z-index:60!important;
  overflow:visible!important;
  pointer-events:none!important;
  border-radius:0 0 30px 30px!important;
  touch-action:none!important;
}
.entry-view-scroll-content .journal-decoration-layer:not(.journal-decoration-editing),
.entry-view-scroll-content .journal-decoration-layer:not(.journal-decoration-editing) .journal-decoration-item{
  pointer-events:none!important;
}
.entry-view-scroll-content .journal-decoration-layer.journal-decoration-editing{
  pointer-events:none!important;
}
.entry-view-scroll-content .journal-decoration-layer.journal-decoration-editing .journal-decoration-item{
  pointer-events:auto!important;
  touch-action:none!important;
}
.entry-view-scroll-content .journal-decoration-layer .journal-decoration-item{
  position:absolute!important;
  box-sizing:border-box!important;
  transform-origin:center center!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card,
.journal-decoration-bottom-sheet.journal-decoration-tool-card{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:max(10px,env(safe-area-inset-bottom,0px))!important;
  transform:translateX(-50%)!important;
  width:min(720px,calc(100vw - 20px))!important;
  max-width:calc(100vw - 20px)!important;
  max-height:252px!important;
  display:block!important;
  grid-column:auto!important;
  grid-row:auto!important;
  align-self:auto!important;
  margin:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  overscroll-behavior:contain!important;
  z-index:1600!important;
  border-radius:28px!important;
  border:1.5px solid rgba(var(--accent-rgb),.22)!important;
  background:rgba(255,248,251,.97)!important;
  backdrop-filter:blur(18px)!important;
  -webkit-backdrop-filter:blur(18px)!important;
  box-shadow:0 -18px 60px rgba(76,38,58,.24)!important;
  padding:8px 14px 14px!important;
  pointer-events:auto!important;
  transition:transform .24s ease,max-height .24s ease!important;
  touch-action:pan-y!important;
}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.collapsed,
.journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed{
  transform:translateX(-50%) translateY(calc(100% - 62px))!important;
  max-height:72px!important;
  overflow:hidden!important;
}
.journal-decoration-sheet-handle{
  touch-action:none!important;
  cursor:grab!important;
}
.journal-decoration-sheet-handle:active{cursor:grabbing!important;}
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-tool-card button,
.modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-sheet-handle,
.journal-decoration-tool-card button,
.journal-decoration-sheet-handle{
  pointer-events:auto!important;
}
@media(max-width:768px){
  .modal-overlay[aria-label="View journal entry"],
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{
    inset:0 0 var(--mobile-nav-h,78px) 0!important;
    height:calc(100dvh - var(--mobile-nav-h,78px))!important;
    padding:8px!important;
    align-items:center!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
    width:calc(100vw - 16px)!important;
    max-width:calc(100vw - 16px)!important;
    height:calc(100dvh - var(--mobile-nav-h,78px) - 16px)!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 16px)!important;
    min-height:280px!important;
    border-radius:24px!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{
    height:calc(100dvh - var(--mobile-nav-h,78px) - 250px - env(safe-area-inset-bottom,0px))!important;
    max-height:calc(100dvh - var(--mobile-nav-h,78px) - 250px - env(safe-area-inset-bottom,0px))!important;
  }
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header{border-radius:24px 24px 0 0!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-view-body,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{border-radius:0 0 24px 24px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .journal-decoration-tool-card,
  .journal-decoration-bottom-sheet.journal-decoration-tool-card{
    left:0!important;
    right:0!important;
    bottom:var(--mobile-nav-h,78px)!important;
    transform:none!important;
    width:100%!important;
    max-width:100%!important;
    max-height:242px!important;
    border-radius:26px 26px 0 0!important;
  }
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.collapsed,
  .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed{
    transform:translateY(calc(100% - 62px))!important;
  }
}




/* Mobile: decorations can be viewed, but decoration editing is desktop-only. */
@media(max-width:768px){
  .decorate-entry-btn,
  .decorate-after-save-overlay,
  .journal-decoration-bottom-sheet,
  .journal-decoration-tool-card{display:none!important;}
}


.entry-view-scroll-content{--journal-decoration-board-w:560px;}
.modal-overlay[aria-label="View journal entry"] .entry-view-modal{width:min(560px,calc(100vw - 24px))!important;max-width:min(560px,calc(100vw - 24px))!important;}
.modal-overlay[aria-label="View journal entry"] .entry-view-scroll-content{min-width:0!important;width:100%!important;box-sizing:border-box!important;}

@media(max-width:768px){
  .modal-overlay[aria-label="View journal entry"],
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"]{align-items:flex-start!important;justify-content:center!important;inset:0 0 var(--mobile-nav-h,78px) 0!important;height:calc(100dvh - var(--mobile-nav-h,78px))!important;padding:calc(env(safe-area-inset-top,0px) + 6px) 7px 8px!important;overflow:hidden!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{width:min(560px,calc(100vw - 14px))!important;max-width:min(560px,calc(100vw - 14px))!important;height:calc(100dvh - var(--mobile-nav-h,78px) - env(safe-area-inset-top,0px) - 14px)!important;max-height:calc(100dvh - var(--mobile-nav-h,78px) - env(safe-area-inset-top,0px) - 14px)!important;min-height:0!important;margin:0 auto!important;border-radius:22px!important;overflow:hidden!important;font-size:12px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating{top:auto!important;left:auto!important;transform:none!important;position:relative!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-modal .entry-modal-header,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-modal-header{padding:11px 13px!important;min-height:58px!important;gap:8px!important;border-radius:22px 22px 0 0!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-modal-date{font-size:14px!important;letter-spacing:.01em!important;line-height:1.15!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-mood{font-size:11px!important;line-height:1.1!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-modal-header .tf-save,
  .modal-overlay[aria-label="View journal entry"] .entry-modal-header .tf-cancel{min-height:32px!important;padding:7px 11px!important;font-size:10px!important;white-space:nowrap!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-modal-header .modal-close{width:32px!important;height:32px!important;min-width:32px!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-body,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{flex:1 1 auto!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;border-radius:0 0 22px 22px!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-view-section{padding:11px 13px!important;min-height:auto!important;}
  .modal-overlay[aria-label="View journal entry"] .entry-section-title{font-size:8.8px!important;letter-spacing:.16em!important;margin-bottom:8px!important;}
  .modal-overlay[aria-label="View journal entry"] .memory-tag-chip,
  .modal-overlay[aria-label="View journal entry"] .activity-chip{font-size:10px!important;padding:6px 10px!important;min-height:30px!important;}
  .modal-overlay[aria-label="View journal entry"] .highlight-view-grid{gap:8px!important;}
  .modal-overlay[aria-label="View journal entry"] .highlight-view-grid>div{padding:9px 10px!important;border-radius:13px!important;}
  .modal-overlay[aria-label="View journal entry"] .highlight-view-grid strong,
  .modal-overlay[aria-label="View journal entry"] .entry-view-note,
  .modal-overlay[aria-label="View journal entry"] .gratitude-view-item{font-size:12px!important;line-height:1.38!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-card{padding:10px!important;border-radius:16px!important;min-height:0!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-main{min-width:78px!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-rank{font-size:26px!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-num{font-size:9px!important;}
  .modal-overlay[aria-label="View journal entry"] .daily-score-lines{font-size:10px!important;gap:6px!important;}
  .modal-overlay[aria-label="View journal entry"] .completed-task-item{padding:10px!important;border-radius:14px!important;}
  .modal-overlay[aria-label="View journal entry"] .completed-task-title{font-size:12px!important;}
  .modal-overlay[aria-label="View journal entry"] .completed-task-meta{font-size:9px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .entry-view-modal.decorating .entry-view-body{padding-bottom:52px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card{left:0!important;right:0!important;bottom:var(--mobile-nav-h,78px)!important;width:100%!important;max-width:100%!important;max-height:248px!important;border-radius:22px 22px 0 0!important;transform:translateY(0)!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card.collapsed,
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-bottom-sheet.journal-decoration-tool-card[data-open="false"]{transform:translateY(calc(100% - 54px))!important;max-height:58px!important;}
  .modal-overlay.journal-decorating-overlay[aria-label="View journal entry"] .journal-decoration-sheet-handle{min-height:48px!important;}
}

`;
