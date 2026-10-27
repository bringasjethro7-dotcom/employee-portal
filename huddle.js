/* ═══ DAILY HUDDLE (Oct 27, 2026) — shared by the admin console (owner) and the portal (the day's presenter) ═══
   One report per shift of the last business day (Monday = Fri–Sun): team / project / person hours, how each person
   made them (tasks + tool outputs), the per-minute activity graph with the tool lane, and the questions the tools
   raised. Owner: notes per question, re-pick the presenter, settings. Presenter: read-only + "Start presenting".
   Backend: huddle_state / huddle_report / huddle_pick / huddle_note / huddle_cfg_set / huddle_my (build 2026-10-27b).
   27e/f: the HUDDLE SHOW — the huddle itself runs on one screen in a fixed order with a clock per part and a line to say
   on every slide (show()); goals / "did we do it?" / check-ins / team notes save through huddle_save (backend 27e). */
(function(){
"use strict";
if(window.JMBHuddle) return;
var HD = window.JMBHuddle = { v:"2026-10-27f" };
var DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var DOWL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var PCOL=["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6","#ef4444","#84cc16","#f97316"];
var CAT={ w:["#16a34a","Typing / mouse in the portal"], a:["#38bdf8","Computer in use (other apps)"], i:["#f59e0b","Idle — no input"], h:["#dc2626","Key held down"], n:["#cbd5e1","No signal"] };
var TOOLC={ r:["#f97316","Reddit Central"], a:["#8b5cf6","ALTR Studio"], c:["#0d9488","Client Hub"] };
var SEV={ 3:["High","#dc2626"], 2:["Check","#ea580c"], 1:["Note","#64748b"] };
var STATUS={ open:"Open", asked:"Asked", explained:"Explained", follow:"Follow up", dismissed:"Not an issue" };
var ALPHA="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/* ── helpers ── */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function $(sel, root){ return (root||document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
function r1(x){ return Math.round((Number(x)||0)*10)/10; }
function fh(h){ return r1(h).toFixed(1).replace(/\.0$/,"")+" h"; }
function phNow(){ var t=new Date(Date.now()+8*3600000); return { d:t.toISOString().slice(0,10), h:t.getUTCHours(), m:t.getUTCMinutes(), hm:t.toISOString().slice(11,16) }; }
function addD(d,n){ var t=new Date(d+"T12:00:00Z"); t.setUTCDate(t.getUTCDate()+n); return t.toISOString().slice(0,10); }
function dow(d){ return new Date(d+"T12:00:00Z").getUTCDay(); }
function dayLbl(d){ return DOW[dow(d)]+" "+MON[parseInt(d.slice(5,7),10)-1]+" "+parseInt(d.slice(8,10),10); }
function dayLong(d){ return DOWL[dow(d)]+", "+MON[parseInt(d.slice(5,7),10)-1]+" "+parseInt(d.slice(8,10),10); }
function t12(hm){ var p=String(hm||"").split(":"), h=parseInt(p[0],10)||0; return ((h%12)||12)+":"+(p[1]||"00")+" "+(h<12?"AM":"PM"); }
function hmOf(ms){ var t=new Date(ms+8*3600000), h=t.getUTCHours(), m=t.getUTCMinutes(); return ((h%12)||12)+":"+("0"+m).slice(-2)+" "+(h<12?"AM":"PM"); }
function huddleDateFor(shift){ var n=phNow(); return (shift==="night" && n.h<12) ? addD(n.d,-1) : n.d; }
function datesOf(H){ return dow(H)===1 ? [addD(H,-3),addD(H,-2),addD(H,-1)] : [addD(H,-1)]; }
function initials(n){ n=String(n||"").trim(); if(n.indexOf(",")>=0){ var a=n.split(","), l=(a[0]||"").trim(), f=(a[1]||"").trim(); return (((f||l||"?")[0])+((l||"")[0]||"")).toUpperCase(); } var p=n.split(/\s+/).filter(Boolean); return ((p[0]||"?")[0]+((p[1]||"")[0]||"")).toUpperCase(); }
function first(n){ n=String(n||"").trim(); if(n.indexOf(",")>=0) n=(n.split(",")[1]||"").trim(); return n.split(/\s+/)[0]||n; }
function shortName(n){ n=String(n||"").trim(); if(n.indexOf(",")>=0){ var p=n.split(","); return (p[1]||"").trim().split(/\s+/)[0]+" "+(p[0]||"").trim().charAt(0)+"."; } return n; }
function avatar(id, name, size){ size=size||36; var ini=esc(initials(name));
  return '<span class="hd-av" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*0.38)+'px"><span>'+ini+'</span><img alt="" src="headshots/'+esc(id)+'.jpg" onload="this.style.opacity=1" onerror="this.remove()"></span>'; }
function pctBar(p, col){ p=Math.max(0,Math.min(100,Number(p)||0)); return '<span class="hd-pb"><i style="width:'+p+'%;background:'+(col||"var(--hd-o)")+'"></i></span>'; }

/* ── API ── */
var S={ api:"", mode:"owner", el:null, H:"", shift:"morning", state:null, reps:{}, day:"all", tab:"overview", loading:false, err:"", sess:null, item:null, me:null, openFlag:null };
function qs(o){ return Object.keys(o).filter(function(k){ return o[k]!=null && o[k]!==""; }).map(function(k){ return encodeURIComponent(k)+"="+encodeURIComponent(o[k]); }).join("&"); }
function tok(){ try{ return S.sess ? (S.sess()||"") : ""; }catch(e){ return ""; } }
function get(o){ var t=tok(); if(t && !o.sess) o.sess=t; o._=Date.now(); return fetch(S.api+"?"+qs(o)).then(function(r){ return r.json(); }); }
function post(o){ var t=tok(); if(t && !o.sess) o.sess=t; return fetch(S.api, { method:"POST", body:JSON.stringify(o) }).then(function(r){ return r.json(); }); }

/* ── CSS ── */
function css(){
  if(document.getElementById("hd-css")) return;
  var st=document.createElement("style"); st.id="hd-css";
  st.textContent=[
  ".hd{--hd-o:#ea580c;--hd-o2:#f97316;--hd-p:#7c3aed;--hd-tx:#0f172a;--hd-t2:#475569;--hd-t3:#64748b;--hd-ln:rgba(148,163,184,.28);--hd-bg:#fff;--hd-bg2:#f8fafc;--hd-r:16px;color:var(--hd-tx);font-size:14px;line-height:1.5;font-family:inherit}",
  ".hd *{box-sizing:border-box}",
  ".hd-top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:2px 0 14px}",
  ".hd-kick{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--hd-o)}",
  ".hd-h1{margin:2px 0 0;font-size:24px;font-weight:800;letter-spacing:-.02em}",
  ".hd-sub{font-size:13px;color:var(--hd-t2)}",
  ".hd-ctl{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
  ".hd-seg{display:inline-flex;background:var(--hd-bg2);border:1px solid var(--hd-ln);border-radius:12px;padding:3px}",
  ".hd-seg button{border:0;background:none;font:inherit;font-size:13px;font-weight:700;color:var(--hd-t2);padding:6px 12px;border-radius:9px;cursor:pointer}",
  ".hd-seg button.on{background:#fff;color:var(--hd-tx);box-shadow:0 1px 3px rgba(15,23,42,.12)}",
  ".hd-btn{border:1px solid var(--hd-ln);background:#fff;color:var(--hd-tx);font:inherit;font-size:13px;font-weight:700;padding:7px 12px;border-radius:10px;cursor:pointer;white-space:nowrap}",
  ".hd-btn:hover{border-color:rgba(234,88,12,.45)}",
  ".hd-btn.pri{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border-color:transparent;box-shadow:0 6px 16px -6px rgba(234,88,12,.6)}",
  ".hd-btn.sm{padding:4px 9px;font-size:12px;border-radius:8px}",
  ".hd-btn[disabled]{opacity:.5;cursor:default}",
  ".hd-date{display:inline-flex;align-items:center;gap:4px}",
  ".hd-date input{font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--hd-ln);border-radius:10px;background:#fff;color:var(--hd-tx)}",
  ".hd-card{background:var(--hd-bg);border:1px solid var(--hd-ln);border-radius:var(--hd-r);padding:16px;box-shadow:0 1px 2px rgba(15,23,42,.04)}",
  ".hd-grid{display:grid;gap:12px}",
  ".hd-pres{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:linear-gradient(120deg,#fff7ed,#fdf2f8 60%,#f5f3ff);border:1px solid rgba(234,88,12,.18)}",
  ".hd-pres .who{flex:1;min-width:220px}",
  ".hd-pres .nm{font-size:18px;font-weight:800;letter-spacing:-.01em}",
  ".hd-av{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#fed7aa,#fbcfe8);color:#9a3412;font-weight:800;flex:none;overflow:hidden}",
  ".hd-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .2s}",
  ".hd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0}",
  ".hd-kpi{background:#fff;border:1px solid var(--hd-ln);border-radius:14px;padding:12px 14px}",
  ".hd-kpi .l{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--hd-t3)}",
  ".hd-kpi .v{font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-top:2px}",
  ".hd-kpi .s{font-size:12px;color:var(--hd-t2)}",
  ".hd-kpi.big{background:linear-gradient(135deg,#0f172a,#312e81);color:#fff;border:0}",
  ".hd-kpi.big .l,.hd-kpi.big .s{color:rgba(255,255,255,.72)}",
  ".hd-up{color:#16a34a;font-weight:700}.hd-dn{color:#dc2626;font-weight:700}",
  ".hd-tabs{display:flex;gap:6px;border-bottom:1px solid var(--hd-ln);margin:16px 0 12px;overflow:auto}",
  ".hd-tabs button{border:0;background:none;font:inherit;font-size:14px;font-weight:700;color:var(--hd-t3);padding:9px 12px;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap}",
  ".hd-tabs button.on{color:var(--hd-tx);border-color:var(--hd-o)}",
  ".hd-cnt{display:inline-block;min-width:18px;padding:0 6px;margin-left:5px;border-radius:9px;background:#fee2e2;color:#b91c1c;font-size:11px;line-height:18px;text-align:center}",
  ".hd-days{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0}",
  ".hd-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--hd-ln);background:#fff;border-radius:999px;padding:4px 11px;font-size:12px;font-weight:700;color:var(--hd-t2);cursor:pointer}",
  ".hd-chip.on{background:#0f172a;color:#fff;border-color:#0f172a}",
  ".hd-pj{display:grid;grid-template-columns:minmax(120px,190px) 1fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px dashed var(--hd-ln)}",
  ".hd-pj:last-child{border-bottom:0}",
  ".hd-bar{height:12px;border-radius:7px;background:var(--hd-bg2);overflow:hidden}.hd-bar i{display:block;height:100%;border-radius:7px}",
  ".hd-pb{display:inline-block;vertical-align:middle;width:54px;height:6px;border-radius:4px;background:var(--hd-bg2);overflow:hidden;margin-left:6px}.hd-pb i{display:block;height:100%}",
  ".hd-tasks{margin:4px 0 0 0;font-size:12.5px;color:var(--hd-t2)}",
  ".hd-tbl{width:100%;border-collapse:collapse;font-size:13px}",
  ".hd-tbl th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--hd-t3);text-align:left;font-weight:700;padding:6px 6px;border-bottom:1px solid var(--hd-ln)}",
  ".hd-tbl td{padding:7px 6px;border-bottom:1px solid rgba(148,163,184,.14);vertical-align:top}",
  ".hd-tbl td.n,.hd-tbl th.n{text-align:right;white-space:nowrap}",
  ".hd-people{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px}",
  "@media(max-width:720px){.hd-people{grid-template-columns:1fr}.hd-pj{grid-template-columns:1fr auto}.hd-pj .hd-bar{grid-column:1/-1;order:3}}",
  ".hd-ph{display:flex;align-items:center;gap:12px}",
  ".hd-ph .nm{font-weight:800;font-size:15px}",
  ".hd-ph .mt{font-size:12px;color:var(--hd-t3)}",
  ".hd-ph .hrs{margin-left:auto;text-align:right}.hd-ph .hrs b{font-size:22px;letter-spacing:-.02em}",
  ".hd-stats{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--hd-t2);margin:10px 0 2px}",
  ".hd-stats b{color:var(--hd-tx)}",
  ".hd-g{position:relative;margin:10px 0 2px;user-select:none}",
  ".hd-g svg{display:block;width:100%;height:46px;border-radius:8px;background:repeating-linear-gradient(135deg,#f8fafc 0 6px,#f1f5f9 6px 12px)}",
  ".hd-g .tk{position:relative;height:14px;font-size:10px;color:var(--hd-t3)}.hd-g .tk span{position:absolute;transform:translateX(-50%);white-space:nowrap}",
  ".hd-g .tip{position:absolute;top:-4px;transform:translate(-50%,-100%);background:#0f172a;color:#fff;font-size:11.5px;padding:6px 9px;border-radius:8px;white-space:nowrap;pointer-events:none;z-index:5;box-shadow:0 8px 20px -8px rgba(0,0,0,.5);display:none}",
  ".hd-g .cur{position:absolute;top:0;width:1px;height:46px;background:#0f172a;opacity:.5;pointer-events:none;display:none}",
  ".hd-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--hd-t2);margin:6px 0 0}",
  ".hd-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}",
  ".hd-q{border:1px solid var(--hd-ln);border-left:4px solid #64748b;border-radius:12px;padding:11px 13px;background:#fff;margin:0 0 9px}",
  ".hd-q .t{font-weight:800}.hd-q .d{font-size:12.5px;color:var(--hd-t2);margin-top:2px}",
  ".hd-q .ask{margin-top:8px;padding:8px 11px;border-radius:9px;background:#fff7ed;color:#7c2d12;font-size:13px}",
  ".hd-q .ask b{color:#c2410c}",
  ".hd-q.st-explained,.hd-q.st-dismissed{opacity:.6}",
  ".hd-sev{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:6px;color:#fff;margin-right:6px;vertical-align:1px}",
  ".hd-qa{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center}",
  ".hd-qa .hd-btn.on{background:#0f172a;color:#fff;border-color:#0f172a}",
  ".hd-qa textarea{flex:1 1 100%;min-height:36px;font:inherit;font-size:13px;padding:7px 9px;border:1px solid var(--hd-ln);border-radius:9px;resize:vertical}",
  ".hd-st{font-size:11px;font-weight:800;color:var(--hd-t3);text-transform:uppercase;letter-spacing:.05em}",
  ".hd-win{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px dashed var(--hd-ln)}.hd-win:last-child{border-bottom:0}",
  ".hd-win .ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#fde68a,#fdba74);font-weight:900;color:#9a3412;flex:none}",
  ".hd-empty{padding:30px;text-align:center;color:var(--hd-t3)}",
  ".hd-err{padding:12px 14px;border-radius:12px;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;margin:10px 0}",
  ".hd-menu{position:absolute;z-index:40;background:#fff;border:1px solid var(--hd-ln);border-radius:12px;box-shadow:0 18px 40px -12px rgba(15,23,42,.35);padding:6px;min-width:260px;max-height:320px;overflow:auto}",
  ".hd-menu button{display:flex;width:100%;align-items:center;gap:10px;border:0;background:none;font:inherit;font-size:13px;text-align:left;padding:7px 8px;border-radius:8px;cursor:pointer}",
  ".hd-menu button:hover{background:var(--hd-bg2)}",
  ".hd-dot{width:8px;height:8px;border-radius:50%;background:#cbd5e1;flex:none}.hd-dot.on{background:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.18)}",
  ".hd-trend{display:flex;align-items:flex-end;gap:3px;height:34px}.hd-trend i{flex:1;min-width:5px;border-radius:3px 3px 0 0;background:rgba(255,255,255,.35)}.hd-trend i.cur{background:#fdba74}",
  ".hd-set{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:8px}",
  ".hd-set label{display:block;font-size:12px;font-weight:700;color:var(--hd-t2);margin-bottom:4px}",
  ".hd-set input{width:100%;font:inherit;font-size:13px;padding:7px 9px;border:1px solid var(--hd-ln);border-radius:9px}",
  /* presentation */
  ".hd-show{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(1200px 700px at 10% -10%,#312e81 0,transparent 60%),radial-gradient(900px 600px at 110% 110%,#7c2d12 0,transparent 55%),#0b1020;color:#fff;font-family:inherit;display:flex;flex-direction:column}",
  ".hd-show .bar{height:4px;background:rgba(255,255,255,.12)}.hd-show .bar i{display:block;height:100%;background:linear-gradient(90deg,#f97316,#ec4899,#8b5cf6);transition:width .35s}",
  ".hd-show .hdr{display:flex;align-items:center;gap:12px;padding:14px 22px;font-size:13px;color:rgba(255,255,255,.7)}",
  ".hd-show .hdr img{width:26px;height:26px;border-radius:7px}",
  ".hd-show .hdr .x{margin-left:auto;display:flex;gap:8px}",
  ".hd-show .hdr button{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:13px;font-weight:700;padding:6px 12px;border-radius:9px;cursor:pointer}",
  ".hd-show .stage{flex:1;overflow:auto;padding:10px 6vw 30px;display:flex;flex-direction:column}",
  ".hd-show .stage>.sl{margin:auto 0}",
  ".hd-show .sl{animation:hdIn .45s cubic-bezier(.2,.8,.2,1)}",
  "@keyframes hdIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}",
  ".hd-show .k{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#fdba74}",
  ".hd-show h2{font-size:clamp(30px,4.6vw,60px);line-height:1.05;margin:8px 0 10px;letter-spacing:-.03em}",
  ".hd-show .lead{font-size:clamp(16px,1.6vw,22px);color:rgba(255,255,255,.78)}",
  ".hd-show .num{font-size:clamp(70px,11vw,150px);font-weight:900;letter-spacing:-.05em;line-height:1;background:linear-gradient(90deg,#fff,#fdba74);-webkit-background-clip:text;background-clip:text;color:transparent}",
  ".hd-show .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-top:26px}",
  ".hd-show .tile{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px 18px}",
  ".hd-show .tile .l{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:700}",
  ".hd-show .tile .v{font-size:34px;font-weight:800;letter-spacing:-.02em;margin-top:4px}",
  ".hd-show .pjr{display:grid;grid-template-columns:minmax(140px,240px) 1fr 90px;gap:16px;align-items:center;margin:12px 0;font-size:18px}",
  ".hd-show .pjr .b{height:22px;border-radius:12px;background:rgba(255,255,255,.08);overflow:hidden}.hd-show .pjr .b i{display:block;height:100%;border-radius:12px;animation:hdGrow .9s cubic-bezier(.2,.8,.2,1)}",
  "@keyframes hdGrow{from{width:0!important}}",
  ".hd-show .pjr .h{text-align:right;font-weight:800}",
  ".hd-show .who{display:flex;align-items:center;gap:18px}",
  ".hd-show .who .hd-av{box-shadow:0 0 0 4px rgba(255,255,255,.12)}",
  ".hd-show .two{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;margin-top:22px}",
  "@media(max-width:900px){.hd-show .two{grid-template-columns:1fr}}",
  ".hd-show table{width:100%;border-collapse:collapse;font-size:16px}.hd-show td,.hd-show th{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.1);text-align:left}.hd-show th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55)}",
  ".hd-show td.n,.hd-show th.n{text-align:right}",
  ".hd-show .hd-g svg{height:70px;background:rgba(255,255,255,.05)}.hd-show .hd-g .tk{color:rgba(255,255,255,.55)}.hd-show .hd-g .cur{background:#fff;height:70px}",
  ".hd-show .hd-legend{color:rgba(255,255,255,.7)}",
  ".hd-show .q{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-left:5px solid #f97316;border-radius:14px;padding:12px 16px;margin:0 0 10px;font-size:17px}",
  ".hd-show .q .t{font-weight:800}.hd-show .q .a{color:#fed7aa;margin-top:4px}",
  ".hd-show .q.done{opacity:.45}",
  ".hd-show .q .acts{margin-top:8px;display:flex;gap:6px}.hd-show .q .acts button{font-size:12px;padding:4px 9px}",
  ".hd-show .wins .w{display:flex;gap:16px;align-items:center;margin:14px 0;font-size:20px}",
  ".hd-show .wins .w .ic{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#fde68a,#fb923c);color:#7c2d12;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}",
  ".hd-show .nav{display:flex;justify-content:space-between;align-items:center;padding:12px 22px;color:rgba(255,255,255,.6);font-size:13px}",
  ".hd-show .nav button{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-weight:700;padding:9px 16px;border-radius:11px;cursor:pointer}",
  /* portal banner + overlay */
  ".hd-ban{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-radius:16px;padding:12px 16px;margin:0 0 14px;background:linear-gradient(120deg,#fff7ed,#fdf2f8 55%,#f5f3ff);border:1px solid rgba(234,88,12,.22);color:#0f172a;font-size:14px}",
  ".hd-ban.me{background:linear-gradient(120deg,#ea580c,#db2777 60%,#7c3aed);color:#fff;border:0;box-shadow:0 14px 30px -14px rgba(219,39,119,.7)}",
  ".hd-ban .t{font-weight:800}.hd-ban .s{font-size:12.5px;opacity:.85}",
  ".hd-ban .hd-btn{margin-left:auto}",
  ".hd-ban.me .hd-btn{background:#fff;color:#c2410c;border:0}",
  ".hd-ov{position:fixed;inset:0;z-index:2147482000;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:flex-start;overflow:auto;padding:24px 12px}",
  ".hd-ov .box{width:min(1180px,100%);background:#f8fafc;border-radius:22px;padding:18px 20px 26px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5)}",
  "body.hd-noscroll{overflow:hidden}",
  /* Reddit removals highlight (Oct 27) */
  ".hd-rm{background:linear-gradient(135deg,#fff 0%,#fff6fa 55%,#f6f3ff 100%);border:1px solid rgba(236,72,153,.25)}",
  ".hd-rm .top{display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap}",
  ".hd-rm .big b{display:block;font-size:44px;line-height:1;font-weight:900;letter-spacing:-.03em}.hd-rm .big span{display:block;font-size:12.5px;font-weight:700;color:var(--hd-t2);margin-top:5px}.hd-rm .big small{display:block;font-size:11.5px;color:var(--hd-t3);margin-top:2px}",
  ".hd-rm .cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:12px}.hd-rm h4{margin:0 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--hd-t3)}",
  ".hd-rr{display:grid;grid-template-columns:minmax(150px,1.3fr) 2fr 42px;gap:8px;align-items:center;padding:5px 0;border-bottom:1px dashed var(--hd-ln);font-size:12.5px}.hd-rr:last-child{border-bottom:0}.hd-rr .nm{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hd-rr .nm small{display:block;font-weight:600;color:var(--hd-t3);font-size:10.5px;white-space:normal;line-height:1.3}.hd-rr b{text-align:right}",
  ".hd-show .hd-rr{border-color:rgba(255,255,255,.12);font-size:16px}.hd-show .hd-rr .nm small{color:rgba(255,255,255,.55);font-size:12px}.hd-show .hd-rm-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px;margin-top:22px}.hd-show h4{margin:0 0 8px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6)}"
  ].join("\n");
  document.head.appendChild(st);
}

/* ── multi-day merge (Monday covers Fri–Sun) ── */
function merge(list){
  list=list.filter(function(r){ return r && r.ok; });
  if(!list.length) return null;
  if(list.length===1){ var r0=list[0]; r0.people.forEach(function(p){ p.days=[{ date:r0.date, strip:p.strip, entries:p.entries, hours:p.hours, flags_at:flagBands(r0.flags,p.id) }]; }); r0.flags.forEach(function(f){ f.date=r0.date; }); r0.wins.forEach(function(w){ w.date=r0.date; }); r0.dates=[r0.date]; return r0; }
  var out={ ok:true, dates:list.map(function(r){ return r.date; }), shift:list[0].shift, multi:true, viewer:list[0].viewer, huddle:list[list.length-1].huddle, people:[], projects:[], flags:[], wins:[], team:{} };
  var T={ hours:0, lunch_h:0, pending_h:0, manual_h:0, usual_h:0, flags:0, high:0, engW:0, eng:0, toolW:0, tool:0 }, ppl={}, pj={};
  list.forEach(function(r){
    var t=r.team; T.hours+=t.hours; T.lunch_h+=t.lunch_h; T.pending_h+=t.pending_h; T.manual_h+=t.manual_h; T.usual_h+=t.usual_h||0; T.flags+=t.flags; T.high+=t.high;
    if(t.eng_pct!=null){ T.eng+=t.eng_pct*t.hours; T.engW+=t.hours; } if(t.tool_pct!=null){ T.tool+=t.tool_pct*t.hours; T.toolW+=t.hours; }
    r.people.forEach(function(p){
      var P=ppl[p.id]; if(!P){ P=ppl[p.id]=JSON.parse(JSON.stringify(p)); P.hours=0; P.flags=0; P.days=[]; P.tasks=[]; P._t={}; P.manual_h=0; P.lunch_h=0; P.pending_h=0; P._e=0; P._ew=0; P._a=0; P._aw=0; }
      P.hours+=p.hours; P.flags+=p.flags; P.manual_h+=p.manual_h; P.lunch_h+=p.lunch_h; P.pending_h+=p.pending_h;
      if(p.eng_pct!=null){ P._e+=p.eng_pct*p.hours; P._ew+=p.hours; } if(p.act_pct!=null){ P._a+=p.act_pct*p.hours; P._aw+=p.hours; }
      P.days.push({ date:r.date, strip:p.strip, entries:p.entries, hours:p.hours, time_in:p.time_in, time_out:p.time_out, flags_at:flagBands(r.flags,p.id) });
      p.tasks.forEach(function(t){ var k=t.project+"|"+t.task, X=P._t[k]; if(!X){ X=P._t[k]={ project:t.project, task:t.task, hours:0, volume:0, base_qph:t.base_qph, team_qph:t.team_qph, tool:t.tool }; P.tasks.push(X); } X.hours+=t.hours; X.volume+=t.volume; });
    });
    r.projects.forEach(function(x){ var P=pj[x.project]; if(!P){ P=pj[x.project]={ project:x.project, hours:0, people:{}, tasks:{}, act:0, actW:0, eng:0, engW:0, norm_pct:x.norm_pct }; }
      P.hours+=x.hours; x.people.forEach(function(id){ P.people[id]=1; }); if(x.act_pct!=null){ P.act+=x.act_pct*x.hours; P.actW+=x.hours; } if(x.eng_pct!=null){ P.eng+=x.eng_pct*x.hours; P.engW+=x.hours; }
      x.tasks.forEach(function(t){ var X=P.tasks[t.task]=P.tasks[t.task]||{ task:t.task, hours:0, volume:0, vas:0 }; X.hours+=t.hours; X.volume+=t.volume; X.vas=Math.max(X.vas,t.vas); }); });
    r.flags.forEach(function(f){ f.date=r.date; out.flags.push(f); });
    r.wins.forEach(function(w){ w.date=r.date; out.wins.push(w); });
  });
  Object.keys(ppl).forEach(function(k){ var P=ppl[k]; P.tasks.forEach(function(t){ t.hours=Math.round(t.hours*100)/100; t.qph=(t.hours>0&&t.volume>0)?r1(t.volume/t.hours):0; }); P.tasks.sort(function(a,b){ return b.hours-a.hours; });
    P.eng_pct=P._ew?Math.round(P._e/P._ew):null; P.act_pct=P._aw?Math.round(P._a/P._aw):null; P.strip=null; P.entries=[]; P.hours=Math.round(P.hours*100)/100; out.people.push(P); });
  out.people.sort(function(a,b){ return b.hours-a.hours; });
  out.projects=Object.keys(pj).map(function(k){ var P=pj[k]; return { project:P.project, hours:Math.round(P.hours*100)/100, vas:Object.keys(P.people).length, people:Object.keys(P.people), act_pct:P.actW?Math.round(P.act/P.actW):null, eng_pct:P.engW?Math.round(P.eng/P.engW):null, norm_pct:P.norm_pct,
    tasks:Object.keys(P.tasks).map(function(t){ var X=P.tasks[t]; return { task:X.task, hours:Math.round(X.hours*100)/100, volume:r1(X.volume), qph:X.hours>0&&X.volume>0?r1(X.volume/X.hours):0, vas:X.vas }; }).sort(function(a,b){ return b.hours-a.hours; }) }; }).sort(function(a,b){ return b.hours-a.hours; });
  out.flags.sort(function(a,b){ return (b.sev-a.sev) || String(a.name).localeCompare(String(b.name)); });
  /* Reddit removals: the days added up (Oct 27) */
  var RM=null; list.forEach(function(r){ var x=r.removals; if(!x || !x.t) return; if(!RM) RM={ date:'', t:[0,0,0,0,0], model:{}, method:{}, base:{}, shift:{}, va:{} };
    for(var i=0;i<5;i++) RM.t[i]+=x.t[i]||0; ['model','method','base','shift','va'].forEach(function(k){ Object.keys(x[k]||{}).forEach(function(n){ var a=RM[k][n]||(RM[k][n]=[0,0,0,0,0]); for(var i=0;i<5;i++) a[i]+=x[k][n][i]||0; }); }); });
  out.removals=RM;
  /* 27e: the huddle show — goals / talk / who's here are the same in every day of one huddle; "did we do it?" is the first day's */
  var rv=list.filter(function(r){ return r.review && r.review.length; })[0]; if(rv){ out.review=rv.review; out.review_of=rv.review_of; }
  var lr=list[list.length-1]; out.goals=lr.goals||[]; out.talk=lr.talk||{}; out.here=lr.here||[]; if(list[0].removals_prev) out.removals_prev=list[0].removals_prev;
  out.team={ hours:Math.round(T.hours*100)/100, vas:out.people.length, avg_h:out.people.length?r1(T.hours/out.people.length):0, lunch_h:T.lunch_h, pending_h:T.pending_h, manual_h:Math.round(T.manual_h*100)/100, usual_h:T.usual_h,
    eng_pct:T.engW?Math.round(T.eng/T.engW):null, tool_pct:T.toolW?Math.round(T.tool/T.toolW):null, flags:T.flags, high:T.high, trend:list[list.length-1].team.trend, perday:list.map(function(r){ return { date:r.date, hours:r.team.hours, vas:r.team.vas }; }) };
  return out;
}
function flagBands(flags, id){ return (flags||[]).filter(function(f){ return f.emp===id && f.at && f.at[0]; }).map(function(f){ return { a:f.at[0], b:f.at[1], sev:f.sev }; }); }

/* ── activity graph ── */
var GR=[];
function runs(str){ var out=[], i=0, n=str.length; while(i<n){ var c=str.charAt(i), j=i+1; while(j<n && str.charAt(j)===c) j++; out.push([i,j-i,c]); i=j; } return out; }
function graph(day, person, big){
  var st=day && day.strip; if(!st || !st.s) return '<div class="hd-sub" style="margin:8px 0">No activity graph for this shift'+(person.manual_h>0?" — the hours were added without the timer":"")+'.</div>';
  var n=st.s.length, W=1000, Hh=46, pc={}, pi=0, ents={};
  (day.entries||[]).forEach(function(e){ ents[e.ix]=e; if(e.idle||e.manual) return; if(pc[e.project]==null) pc[e.project]=PCOL[(pi++)%PCOL.length]; });
  var svg=[];
  runs(st.ent).forEach(function(r){ if(r[2]==="."||r[2]==="~") return; var e=ents[ALPHA.indexOf(r[2])]; var col=e?(pc[e.project]||"#94a3b8"):"#94a3b8"; svg.push('<rect x="'+(r[0]/n*W)+'" y="0" width="'+(r[1]/n*W)+'" height="8" fill="'+col+'"/>'); });
  runs(st.s).forEach(function(r){ if(r[2]===".") return; var c=CAT[r[2]]; svg.push('<rect x="'+(r[0]/n*W)+'" y="11" width="'+(r[1]/n*W+0.3)+'" height="22" fill="'+(c?c[0]:"#cbd5e1")+'"/>'); });
  runs(st.tool).forEach(function(r){ if(r[2]===".") return; var c=TOOLC[r[2]]; svg.push('<rect x="'+(r[0]/n*W)+'" y="36" width="'+(r[1]/n*W)+'" height="8" rx="1" fill="'+(c?c[0]:"#64748b")+'" opacity=".85"/>'); });
  (day.flags_at||[]).forEach(function(b){ var x0=(b.a-st.t0)/60000/n*W, x1=(b.b-st.t0)/60000/n*W; if(x1<=0||x0>=W) return; svg.push('<rect x="'+Math.max(0,x0)+'" y="0" width="'+Math.max(2,x1-x0)+'" height="'+Hh+'" fill="'+(b.sev>=3?"#dc2626":"#ea580c")+'" opacity=".16"/><rect x="'+Math.max(0,x0)+'" y="0" width="'+Math.max(2,x1-x0)+'" height="'+Hh+'" fill="none" stroke="'+(b.sev>=3?"#dc2626":"#ea580c")+'" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>'); });
  var ticks=[], t0=st.t0, t1=st.t0+n*60000, h0=Math.ceil((t0+8*3600000)/3600000)*3600000-8*3600000, span=(t1-t0)/3600000, step=span>10?2:1;
  for(var t=h0;t<t1;t+=3600000*step){ var hh=new Date(t+8*3600000).getUTCHours(); ticks.push('<span style="left:'+((t-t0)/(t1-t0)*100)+'%">'+(((hh%12)||12)+(hh<12?"a":"p"))+'</span>'); }
  var id=GR.length; GR.push({ st:st, ents:ents, pc:pc });
  return '<div class="hd-g" data-g="'+id+'"><svg viewBox="0 0 '+W+' '+Hh+'" preserveAspectRatio="none">'+svg.join("")+'</svg><div class="cur"></div><div class="tip"></div><div class="tk">'+ticks.join("")+'</div></div>';
}
function legend(){ return '<div class="hd-legend">'+["w","a","i","h","n"].map(function(k){ return '<span><i style="background:'+CAT[k][0]+'"></i>'+CAT[k][1]+'</span>'; }).join("")+'<span><i style="background:'+TOOLC.r[0]+'"></i>Tool lane (bottom)</span><span><i style="background:#6366f1"></i>Timer / project (top)</span></div>'; }
function bindGraphs(root){
  $$(".hd-g", root).forEach(function(g){
    if(g._b) return; g._b=1; var G=GR[+g.getAttribute("data-g")]; if(!G) return; var tip=$(".tip",g), cur=$(".cur",g), svg=$("svg",g);
    function mv(ev){ var rc=svg.getBoundingClientRect(), x=((ev.touches?ev.touches[0].clientX:ev.clientX)-rc.left), f=Math.max(0,Math.min(0.9999,x/rc.width)), i=Math.floor(f*G.st.s.length);
      var c=G.st.s.charAt(i), tl=G.st.tool.charAt(i), e=G.ents[ALPHA.indexOf(G.st.ent.charAt(i))];
      var txt='<b>'+hmOf(G.st.t0+i*60000)+'</b> · '+(c==="."?"timer off":esc(CAT[c]?CAT[c][1]:c))+(e?' · '+esc(e.task||e.project):"")+(tl!=="."?' · '+esc((TOOLC[tl]||[0,"tool"])[1])+" active":"");
      tip.innerHTML=txt; tip.style.display="block"; tip.style.left=(f*100)+"%"; cur.style.display="block"; cur.style.left=(f*100)+"%"; }
    function out(){ tip.style.display="none"; cur.style.display="none"; }
    g.addEventListener("mousemove", mv); g.addEventListener("mouseleave", out); g.addEventListener("touchstart", mv, { passive:true }); g.addEventListener("touchend", function(){ setTimeout(out,1200); });
  });
}

/* ── report pieces ── */
function kpis(R){
  var t=R.team, vs=(t.usual_h>0)?Math.round((t.hours-t.usual_h)/t.usual_h*100):null;
  var tr=(t.trend||[]).slice(-14), mx=Math.max.apply(null, tr.map(function(x){ return x.hours; }).concat([1]));
  var spark=tr.length?'<div class="hd-trend" title="Last 14 days, this shift">'+tr.map(function(x){ return '<i class="'+(R.dates.indexOf(x.date)>=0?"cur":"")+'" style="height:'+Math.max(6,x.hours/mx*100)+'%" title="'+esc(dayLbl(x.date)+": "+fh(x.hours)+" · "+x.vas+" VAs")+'"></i>'; }).join("")+'</div>':"";
  return '<div class="hd-kpis">'+
    '<div class="hd-kpi big"><div class="l">Team hours</div><div class="v" data-count="'+t.hours+'">'+fh(t.hours)+'</div><div class="s">'+(vs!=null?('<span>'+(vs>=0?"+":"")+vs+'% vs these VAs\' usual</span>'):"")+'</div>'+spark+'</div>'+
    '<div class="hd-kpi"><div class="l">VAs on shift</div><div class="v">'+t.vas+'</div><div class="s">avg '+fh(t.avg_h)+' each</div></div>'+
    '<div class="hd-kpi"><div class="l">Active</div><div class="v">'+(t.eng_pct!=null?t.eng_pct+"%":"—")+'</div><div class="s">of the time the timer ran</div></div>'+
    '<div class="hd-kpi"><div class="l">Seen by the tools</div><div class="v">'+(t.tool_pct!=null?t.tool_pct+"%":"—")+'</div><div class="s">tool work the tools saw</div></div>'+
    '<div class="hd-kpi"><div class="l">Check-ins</div><div class="v">'+t.flags+'</div><div class="s">'+(t.high?'<span class="hd-dn">'+t.high+' high</span> · ':"")+(t.manual_h>0?fh(t.manual_h)+' added without timer':'from the tools')+'</div></div>'+
  '</div>';
}
function projectsView(R){
  if(!R.projects.length) return '<div class="hd-empty">No project hours on this shift.</div>';
  var mx=Math.max.apply(null, R.projects.map(function(p){ return p.hours; }).concat([1]));
  return '<div class="hd-card">'+R.projects.map(function(p,i){
    var tasks=p.tasks.map(function(t){ return esc(t.task)+' <b>'+fh(t.hours)+'</b>'+(t.volume>0?' · '+r1(t.volume)+' out ('+t.qph+'/h)':''); }).join(" &nbsp;·&nbsp; ");
    var who=p.people.map(function(id){ var x=R.people.filter(function(q){ return q.id===id; })[0]; return x?esc(x.first):esc(id); }).join(", ");
    return '<div class="hd-pj"><div><div style="font-weight:800">'+esc(p.project)+'</div><div class="hd-sub" style="font-size:12px">'+p.vas+' VA'+(p.vas===1?"":"s")+' · '+who+'</div></div>'+
      '<div><div class="hd-bar"><i style="width:'+(p.hours/mx*100)+'%;background:'+PCOL[i%PCOL.length]+'"></i></div><div class="hd-tasks">'+tasks+'</div></div>'+
      '<div style="text-align:right"><div style="font-weight:800;font-size:16px">'+fh(p.hours)+'</div><div class="hd-sub" style="font-size:11.5px">'+(p.eng_pct!=null?"engaged "+p.eng_pct+"%":"")+'</div></div></div>';
  }).join("")+'</div>';
}
function taskTable(p){
  if(!p.tasks.length) return "";
  return '<table class="hd-tbl" style="margin-top:8px"><tr><th>How the hours were made</th><th class="n">Hours</th><th class="n">Output</th><th class="n">Rate</th></tr>'+p.tasks.map(function(t){
    var rate=t.qph?t.qph+'/h':(t.volume>0?"":"—"), vs="";
    if(t.qph && t.base_qph){ var d=Math.round((t.qph-t.base_qph)/t.base_qph*100); vs=' <span class="'+(d>=0?"hd-up":"hd-dn")+'" title="vs usual '+t.base_qph+'/h">'+(d>=0?"+":"")+d+'%</span>'; }
    return '<tr><td><b>'+esc(t.task)+'</b><div class="hd-sub" style="font-size:11.5px">'+esc(t.project)+(t.tool?' · '+esc({reddit:"Reddit Central",altr:"ALTR Studio",clients:"Client Hub"}[t.tool]||t.tool):'')+'</div></td><td class="n">'+fh(t.hours)+'</td><td class="n">'+(t.volume>0?r1(t.volume):'<span class="hd-sub">—</span>')+'</td><td class="n">'+rate+vs+'</td></tr>'; }).join("")+'</table>';
}
function personCard(R, p){
  var days=p.days||[], fl=R.flags.filter(function(f){ return f.emp===p.id; });
  var times=days.length===1?((days[0].time_in||p.time_in)?'In '+esc(days[0].time_in||p.time_in)+(p.time_out?' · Out '+esc(p.time_out):' · no time-out'):'No time-in'):(days.length+' days');
  var usual=(p.usual_h!=null && !R.multi)?'<div class="hd-sub" style="font-size:11.5px">usual '+fh(p.usual_h)+'</div>':"";
  var stats='<div class="hd-stats"><span>Engaged <b>'+(p.eng_pct!=null?p.eng_pct+"%":"—")+'</b>'+(p.eng_pct!=null?pctBar(p.eng_pct,p.eng_pct>=85?"#16a34a":(p.eng_pct>=65?"#f59e0b":"#dc2626")):"")+'</span>'+
    '<span>Computer activity <b>'+(p.act_pct!=null?p.act_pct+"%":"—")+'</b></span>'+
    (p.tool&&p.tool.length?p.tool.map(function(t){ return '<span>'+esc(t.name)+' <b>'+t.pct+'%</b></span>'; }).join(""):"")+
    (p.first_start&&!R.multi?'<span>First timer <b>'+esc(p.first_start)+'</b></span>':"")+(p.manual_h>0?'<span>Added w/o timer <b>'+fh(p.manual_h)+'</b></span>':"")+(p.pending_h>0?'<span>Appeal <b>'+fh(p.pending_h)+'</b></span>':"")+'</div>';
  var graphs=days.map(function(d){ return (days.length>1?'<div class="hd-st" style="margin-top:10px">'+esc(dayLbl(d.date))+' · '+fh(d.hours)+'</div>':"")+graph(d, p); }).join("");
  var qs=fl.length?'<div style="margin-top:10px">'+fl.map(function(f){ return '<div class="hd-sub" style="font-size:12.5px;margin:3px 0"><span class="hd-sev" style="background:'+SEV[f.sev][1]+'">'+SEV[f.sev][0]+'</span>'+esc(f.title)+(f.status&&f.status!=="open"?' <span class="hd-st">· '+esc(STATUS[f.status]||f.status)+'</span>':"")+'</div>'; }).join("")+'</div>':"";
  return '<div class="hd-card" id="hd-p-'+esc(p.id)+'"><div class="hd-ph">'+avatar(p.id,p.name,42)+'<div><div class="nm">'+esc(p.name)+'</div><div class="mt">'+esc(p.id)+' · '+times+'</div></div><div class="hrs"><b>'+fh(p.hours)+'</b>'+usual+'</div></div>'+stats+graphs+taskTable(p)+qs+'</div>';
}
function peopleView(R){ if(!R.people.length) return '<div class="hd-empty">Nobody tracked time on this shift.</div>'; GR=GR||[]; return legend()+'<div class="hd-people" style="margin-top:10px">'+R.people.map(function(p){ return personCard(R,p); }).join("")+'</div>'; }
function flagCard(R, f, i){
  var owner=S.mode==="owner", st=f.status||"open";
  var acts=owner?'<div class="hd-qa">'+["asked","explained","follow","dismissed"].map(function(k){ return '<button class="hd-btn sm'+(st===k?" on":"")+'" data-fs="'+k+'" data-fi="'+i+'">'+STATUS[k]+'</button>'; }).join("")+(st!=="open"?'<button class="hd-btn sm" data-fs="open" data-fi="'+i+'">Reopen</button>':"")+
    '<textarea placeholder="What did they say? (only you see this)" data-fn="'+i+'">'+esc(f.note||"")+'</textarea></div>':(st!=="open"?'<div class="hd-st" style="margin-top:6px">'+esc(STATUS[st]||st)+'</div>':"");
  return '<div class="hd-q st-'+esc(st)+'" style="border-left-color:'+SEV[f.sev][1]+'"><div class="t"><span class="hd-sev" style="background:'+SEV[f.sev][1]+'">'+SEV[f.sev][0]+'</span>'+esc(f.name)+' — '+esc(f.title)+(R.multi?' <span class="hd-sub">· '+esc(dayLbl(f.date))+'</span>':"")+'</div><div class="d">'+esc(f.detail)+'</div><div class="ask"><b>Ask:</b> '+esc(f.q)+'</div>'+acts+'</div>';
}
function flagsView(R){
  if(!R.flags.length) return '<div class="hd-card hd-empty">Nothing looks off — no check-ins for this shift.</div>';
  return R.flags.map(function(f,i){ return flagCard(R,f,i); }).join("");
}
function winsView(R){
  if(!R.wins.length) return '<div class="hd-card hd-empty">No standouts this time.</div>';
  return '<div class="hd-card">'+R.wins.map(function(w){ return '<div class="hd-win"><div class="ic">'+(w.kind==="pace"?"1":(w.kind==="focus"?"A":"OK"))+'</div><div><div style="font-weight:800">'+esc(w.title)+(w.first?' — '+esc(w.first):"")+(R.multi?' <span class="hd-sub">· '+esc(dayLbl(w.date))+'</span>':"")+'</div><div class="hd-sub">'+esc(w.detail)+'</div></div></div>'; }).join("")+'</div>';
}

/* ── Reddit removals: the day's removal rate by model, method, shift (Oct 27) ── */
function rmRate(a){ var c=a[1]+a[2]+a[3]; return c?Math.round((a[2]+a[3])/c*100):null; }
function rmCol(pc){ return pc==null?"#94a3b8":(pc>=50?"#ef4444":(pc>=25?"#f59e0b":"#10b981")); }
function rmList(o){
  var L=Object.keys(o||{}).map(function(k){ return { k:k, a:o[k], pc:rmRate(o[k]) }; }).sort(function(x,y){ return (y.a[0]-x.a[0]) || (x.k<y.k?-1:1); });
  if(!L.length) return '<div class="hd-sub" style="font-size:12px">No posts.</div>';
  return L.map(function(x){ var a=x.a, c=a[1]+a[2]+a[3];
    return '<div class="hd-rr"><div class="nm" title="'+esc(x.k)+'">'+esc(x.k)+'<small>'+a[0]+' post'+(a[0]===1?'':'s')+(c?' · '+(a[2]+a[3])+' removed':'')+(a[4]?' · '+a[4]+' not checked':'')+'</small></div><div class="hd-bar" style="height:8px"><i style="width:'+(x.pc||0)+'%;background:'+rmCol(x.pc)+'"></i></div><b style="color:'+rmCol(x.pc)+'">'+(x.pc==null?'—':x.pc+'%')+'</b></div>'; }).join('');
}
/* one model however it was typed: "Arya/Kaia", "Arya & Kaia" and "kaia + arya" are the same pair (Oct 27) */
function rmParts(v){ return String(v||"").split(/\s*(?:[\/⁄∕\\|&+,;]|\s(?:and|x)\s)\s*/i).map(function(x){ return x.replace(/\s+/g," ").trim(); }).filter(Boolean); }
function rmModels(o){
  var g={}, out={};
  Object.keys(o||{}).forEach(function(k){ var p=rmParts(k), key=p.map(function(x){ return x.toLowerCase(); }).sort().join("|")||String(k).toLowerCase(), a=o[k]||[];
    var G=g[key]||(g[key]={ a:[0,0,0,0,0], lab:"", n:-1 }); for(var i=0;i<5;i++) G.a[i]+=Number(a[i])||0;
    if((Number(a[0])||0)>G.n){ G.n=Number(a[0])||0; G.lab=p.length>1?p.join(" & "):String(k); } });
  Object.keys(g).forEach(function(key){ var G=g[key], l=G.lab; if(out[l]) l=l+" "; out[l]=G.a; });
  return out;
}
function rmShiftCol(X, h){ return Object.keys(X.shift||{}).length>1 ? '<div>'+h+rmList(X.shift)+'</div>' : ''; }
function rmCard(R){
  var X=R.removals; if(!X || !X.t || !X.t[0]) return '';
  var a=X.t, pc=rmRate(a), c=a[1]+a[2]+a[3], bases=Object.keys(X.base||{});
  return '<div class="hd-card hd-rm" style="margin-bottom:12px"><div class="hd-kick" style="color:#db2777">Reddit · daily removal rate'+(R.multi?' · '+R.dates.length+' days':'')+'</div>'+
    '<div class="top" style="margin-top:6px"><div class="big"><b style="color:'+rmCol(pc)+'">'+(pc==null?'—':pc+'%')+'</b><span>'+(c?(a[2]+a[3])+' of '+c+' checked posts removed':'no checked posts yet')+'</span><small>'+a[0]+' posted · '+a[1]+' stayed up · '+a[2]+' by mods · '+a[3]+' spam filter'+(a[4]?' · '+a[4]+' not checked':'')+' · morning + night shift</small></div></div>'+
    '<div class="cols"><div><h4>By model</h4>'+rmList(rmModels(X.model))+'</div><div><h4>By method</h4>'+rmList(X.method)+'</div>'+rmShiftCol(X,'<h4>By shift (who posted)</h4>')+(bases.length>1?'<div><h4>By base</h4>'+rmList(X.base)+'</div>':'')+'</div></div>';
}

/* ── the board (owner tab + presenter overlay share it) ── */
function report(){ var L=(S.state&&S.state.dates||datesOf(S.H)).map(function(d){ return S.reps[d+"|"+S.shift]; }); if(S.day!=="all") L=[S.reps[S.day+"|"+S.shift]]; if(L.some(function(x){ return !x; })) return null; return merge(JSON.parse(JSON.stringify(L))); }
function render(){
  if(!S.el) return; GR=[];
  var R=report(), sh=S.state&&S.state.shifts?S.state.shifts[S.shift]:(S.item||null), dates=(S.state&&S.state.dates)||(S.item&&S.item.dates)||datesOf(S.H);
  var owner=S.mode==="owner";
  var head='<div class="hd-top"><div><div class="hd-kick">Daily Huddle</div><div class="hd-h1">'+(S.shift==="night"?"Night":"Morning")+' huddle · '+esc(dayLbl(S.H))+'</div><div class="hd-sub">Covers '+esc(dates.length>1?dayLbl(dates[0])+" – "+dayLbl(dates[dates.length-1]):dayLong(dates[0]))+' · '+(S.shift==="night"?"night":"morning")+' shift'+(R&&R.built_at?' · data as of '+esc(String(R.built_at).slice(11)):"")+'</div></div>'+
    '<div class="hd-ctl">'+(owner?'<span class="hd-date"><button class="hd-btn sm" data-a="prev" title="Previous huddle">‹</button><input type="date" value="'+esc(S.H)+'" data-a="date"><button class="hd-btn sm" data-a="next" title="Next huddle">›</button></span>'+
      '<span class="hd-seg"><button class="'+(S.shift==="morning"?"on":"")+'" data-a="shift" data-v="morning">Morning</button><button class="'+(S.shift==="night"?"on":"")+'" data-a="shift" data-v="night">Night</button></span>'+
      '<button class="hd-btn sm" data-a="refresh">Refresh</button><button class="hd-btn sm" data-a="settings">Settings</button>':
      '<button class="hd-btn sm" data-a="close">Close</button>')+
    '<button class="hd-btn pri" data-a="present"'+(R?"":" disabled")+'>Start the huddle</button></div></div>';
  var pres="";
  if(sh){
    var cfg=(S.state&&S.state.cfg)||{}; var at=sh.at||((cfg[S.shift]||{}).at);
    pres='<div class="hd-card hd-pres">'+(sh.presenter?avatar(sh.presenter, sh.presenter_name, 48):'<span class="hd-av" style="width:48px;height:48px;font-size:18px"><span>?</span></span>')+
      '<div class="who"><div class="hd-kick" style="color:#9a3412">Presenter'+(at?' · huddle at '+esc(t12(at)):"")+'</div><div class="nm">'+(sh.presenter?esc(sh.presenter_name):"Not picked yet")+'</div><div class="hd-sub">'+
      (sh.presenter?(sh.how==="auto"?"Picked automatically":(sh.how==="re-pick"?"Re-picked":"Chosen"))+(sh.picked_at?" at "+esc(String(sh.picked_at).slice(11,16)):"")+" · notified in the portal":(S.state&&S.state.is_day===false?"No huddle on weekends — the Monday huddle covers Friday to Sunday.":"Picked automatically at "+esc(t12(sh.pick||(cfg[S.shift]||{}).pick))+" from the people of this shift who are timed in."))+'</div></div>'+
      (owner?'<button class="hd-btn" data-a="repick">'+(sh.presenter?"Re-pick":"Pick now")+'</button><button class="hd-btn" data-a="choose">Choose…</button>':"")+'</div>';
  }
  var days=dates.length>1?'<div class="hd-days"><span class="hd-chip'+(S.day==="all"?" on":"")+'" data-a="day" data-v="all">All '+dates.length+' days</span>'+dates.map(function(d){ return '<span class="hd-chip'+(S.day===d?" on":"")+'" data-a="day" data-v="'+d+'">'+esc(dayLbl(d))+'</span>'; }).join("")+'</div>':"";
  var body="";
  if(S.err) body='<div class="hd-err">'+esc(S.err)+'</div>';
  else if(!R) body='<div class="hd-card" style="margin-top:12px"><div class="hd-empty">Loading…</div></div>';
  else {
    var fc=R.flags.filter(function(f){ return (f.status||"open")==="open"||f.status==="asked"||f.status==="follow"; }).length;
    var tabs='<div class="hd-tabs">'+[["overview","Overview"],["people","People"],["questions","Check-ins"+(fc?'<span class="hd-cnt">'+fc+'</span>':"")],["wins","Wins"]].map(function(t){ return '<button class="'+(S.tab===t[0]?"on":"")+'" data-a="tab" data-v="'+t[0]+'">'+t[1]+'</button>'; }).join("")+'</div>';
    var inner="";
    if(S.tab==="overview") inner=rmCard(R)+'<div class="hd-st" style="margin:4px 0 8px">Hours by project</div>'+projectsView(R)+
        (R.flags.length?'<div class="hd-st" style="margin:16px 0 8px">Top check-ins</div>'+R.flags.slice(0,3).map(function(f,i){ return flagCard(R,f,i); }).join("")+(R.flags.length>3?'<button class="hd-btn sm" data-a="tab" data-v="questions">See all '+R.flags.length+'</button>':""):"")+
        (R.wins.length?'<div class="hd-st" style="margin:16px 0 8px">Wins</div>'+winsView(R):"");
    else if(S.tab==="people") inner=peopleView(R);
    else if(S.tab==="questions") inner=flagsView(R);
    else inner=winsView(R);
    body=kpis(R)+tabs+inner;
  }
  S.el.innerHTML='<div class="hd">'+head+pres+days+body+'</div>';
  S._R=R; bindGraphs(S.el); countUp(S.el);
}
function countUp(root){ $$("[data-count]", root).forEach(function(el){ var v=Number(el.getAttribute("data-count"))||0, t0=performance.now(), d=700, key=S.H+"|"+S.shift+"|"+S.day+"|"+v; if(S._counted===key){ return; } S._counted=key;
  function f(t){ var k=Math.min(1,(t-t0)/d), e=1-Math.pow(1-k,3); el.textContent=fh(v*e); if(k<1) requestAnimationFrame(f); } requestAnimationFrame(f); }); }

/* ── loading ── */
function load(fresh){
  S.err=""; var H=S.H, sh=S.shift, tag=H+"|"+sh+"|"+Date.now(); S._tag=tag;
  var stateP=S.mode==="owner" ? get({ action:"huddle_state", date:H }).then(function(st){ if(S._tag!==tag) return; if(!st||!st.ok){ throw new Error((st&&(st.message||st.error))||"Could not load the huddle."); } S.state=st; render(); return st; })
                              : Promise.resolve(null);
  render();
  return stateP.then(function(){
    var dates=(S.state&&S.state.dates)||(S.item&&S.item.dates)||datesOf(H);
    return Promise.all(dates.map(function(d){ var k=d+"|"+sh; if(S.reps[k] && !fresh) return S.reps[k];
      return get({ action:"huddle_report", date:d, shift:sh, fresh:fresh?"1":"" }).then(function(r){ if(!r || !r.ok) throw new Error((r&&(r.message||r.error))||"Could not build the report."); S.reps[k]=r; return r; }); }));
  }).then(function(){ if(S._tag===tag) render(); }).catch(function(e){ if(S._tag!==tag) return; S.err=String(e&&e.message||e); if(/UNAUTHORIZED/.test(S.err)) S.err="Only the owner and today's presenter can open this report."; else if(/MISSING_PARAMS|UNKNOWN_ACTION|Unknown action/i.test(S.err)) S.err="The Daily Huddle needs the new backend (build 2026-10-27b). Deploy it as a new version in Apps Script, then press Refresh."; render(); });
}

/* ── events ── */
function onClick(ev){
  var b=ev.target.closest && ev.target.closest("[data-a],[data-fs]"); if(!b || !S.el.contains(b)) return;
  if(b.hasAttribute("data-fs")){ var i=+b.getAttribute("data-fi"), st=b.getAttribute("data-fs"), f=S._R.flags[i]; if(!f) return; var ta=$('[data-fn="'+i+'"]', S.el); saveNote(f, st, ta?ta.value:(f.note||"")); return; }
  var a=b.getAttribute("data-a"), v=b.getAttribute("data-v");
  if(a==="shift"){ S.shift=v; S.day="all"; load(); }
  else if(a==="tab"){ S.tab=v; render(); }
  else if(a==="day"){ S.day=v; render(); }
  else if(a==="prev"||a==="next"){ var d=addD(S.H, a==="prev"?-1:1), g=0; while((dow(d)===0||dow(d)===6) && g++<3) d=addD(d, a==="prev"?-1:1); S.H=d; S.day="all"; load(); }
  else if(a==="refresh"){ S.reps={}; load(true); }
  else if(a==="present"){ show(); }
  else if(a==="close"){ closeOverlay(); }
  else if(a==="repick"){ pick(""); }
  else if(a==="choose"){ chooseMenu(b); }
  else if(a==="settings"){ settings(); }
}
function onChange(ev){ var t=ev.target; if(t.getAttribute && t.getAttribute("data-a")==="date" && t.value){ S.H=t.value; S.day="all"; load(); } }
function onBlur(ev){ var t=ev.target; if(!t.getAttribute || !t.hasAttribute("data-fn")) return; var i=+t.getAttribute("data-fn"), f=S._R&&S._R.flags[i]; if(!f) return; if(String(t.value||"")===String(f.note||"")) return; saveNote(f, (f.status&&f.status!=="open")?f.status:"asked", t.value); }
function saveNote(f, st, note){
  var H=(f.date && S.reps[f.date+"|"+S.shift] && S.reps[f.date+"|"+S.shift].huddle && S.reps[f.date+"|"+S.shift].huddle.huddle_date) || S.H;
  Object.keys(S.reps).forEach(function(k){ (S.reps[k].flags||[]).forEach(function(x){ if(x.id===f.id){ x.status=st; x.note=note; } }); });
  render();
  post({ action:"huddle_note", date:H, shift:S.shift, flag_id:f.id, status:st, note:note||"" }).then(function(r){ if(!r||!r.ok) toast("Couldn't save that note — "+((r&&(r.message||r.error))||"try again")); }).catch(function(){ toast("Couldn't save that note — check the connection."); });
}
function pick(emp){
  var shObj=S.state.shifts[S.shift]; toast(emp?"Choosing…":"Picking…");
  post({ action:"huddle_pick", date:S.H, shift:S.shift, employee_id:emp||"" }).then(function(r){ if(!r||!r.ok){ toast((r&&(r.message||r.error))||"Couldn't pick."); return; } var c=shObj.candidates; S.state.shifts[S.shift]=r.shift; if(!r.shift.candidates) S.state.shifts[S.shift].candidates=c; S.state.shifts[S.shift].notes=shObj.notes; render(); toast(r.shift.presenter_name?("Presenter: "+r.shift.presenter_name):"Cleared"); })
    .catch(function(){ toast("Couldn't reach the server."); });
}
function chooseMenu(btn){
  var old=$(".hd-menu"); if(old){ old.remove(); return; }
  var C=(S.state.shifts[S.shift].candidates||[]); var m=document.createElement("div"); m.className="hd-menu";
  m.innerHTML=(C.length?C.map(function(c){ return '<button data-c="'+esc(c.id)+'"><span class="hd-dot'+(c.here?" on":"")+'"></span>'+avatar(c.id,c.name,26)+'<span style="flex:1"><b>'+esc(c.name)+'</b><br><span class="hd-sub" style="font-size:11.5px">'+fh(c.hours)+' on the shift · '+(c.here?"timed in today":"not timed in")+(c.last?' · last presented '+esc(dayLbl(c.last)):' · never presented')+'</span></span></button>'; }).join(""):'<div class="hd-empty" style="padding:14px">Nobody from this shift yet.</div>')+
    '<button data-c="NONE" style="color:#b91c1c">Clear the presenter</button>';
  document.body.appendChild(m); var rc=btn.getBoundingClientRect(); m.style.top=(window.scrollY+rc.bottom+6)+"px"; m.style.left=Math.max(8, Math.min(window.scrollX+rc.left, window.scrollX+document.documentElement.clientWidth-m.offsetWidth-8))+"px";
  m.addEventListener("click", function(e){ var x=e.target.closest("[data-c]"); if(!x) return; m.remove(); pick(x.getAttribute("data-c")); });
  setTimeout(function(){ document.addEventListener("click", function cl(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener("click", cl); } }); }, 0);
}
function settings(){
  var c=(S.state&&S.state.cfg)||{}; var box=document.createElement("div"); box.className="hd-ov"; box.innerHTML='<div class="box hd" style="max-width:620px"><div class="hd-top"><div><div class="hd-kick">Daily Huddle</div><div class="hd-h1">Settings</div><div class="hd-sub">When the presenter is picked and when the huddle starts (PH time).</div></div></div>'+
    '<div class="hd-set"><div><label>Morning — pick at</label><input type="time" id="hds-mp" value="'+esc(c.morning&&c.morning.pick)+'"></div><div><label>Morning — huddle at</label><input type="time" id="hds-ma" value="'+esc(c.morning&&c.morning.at)+'"></div>'+
    '<div><label>Night — pick at</label><input type="time" id="hds-np" value="'+esc(c.night&&c.night.pick)+'"></div><div><label>Night — huddle at</label><input type="time" id="hds-na" value="'+esc(c.night&&c.night.at)+'"></div>'+
    '<div><label>Least hours on the shift to present</label><input type="number" step="0.5" min="0" max="8" id="hds-mh" value="'+esc(c.min_hours)+'"></div><div><label>Never pick (IDs, comma-separated)</label><input id="hds-ex" value="'+esc((c.exclude||[]).join(", "))+'"></div></div>'+
    '<label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:700;font-size:13px"><input type="checkbox" id="hds-au"'+(c.auto!==false?" checked":"")+'> Pick the presenter automatically</label>'+
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="hd-btn" data-x="cancel">Cancel</button><button class="hd-btn pri" data-x="save">Save</button></div></div>';
  document.body.appendChild(box);
  box.addEventListener("click", function(e){ var x=e.target.closest("[data-x]"); if(e.target===box || (x && x.getAttribute("data-x")==="cancel")){ box.remove(); return; } if(!x) return;
    var cfg={ morning:{ pick:$("#hds-mp").value, at:$("#hds-ma").value }, night:{ pick:$("#hds-np").value, at:$("#hds-na").value }, min_hours:$("#hds-mh").value, exclude:$("#hds-ex").value.split(/[\s,]+/).filter(Boolean), auto:$("#hds-au").checked };
    x.disabled=true; post({ action:"huddle_cfg_set", cfg:cfg }).then(function(r){ if(!r||!r.ok){ x.disabled=false; toast((r&&(r.message||r.error))||"Couldn't save."); return; } S.state.cfg=r.cfg; box.remove(); render(); toast("Saved"); }).catch(function(){ x.disabled=false; toast("Couldn't reach the server."); }); });
}
function toast(m){ var t=document.getElementById("hd-toast"); if(!t){ t=document.createElement("div"); t.id="hd-toast"; t.style.cssText="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;font-weight:600;z-index:2147483600;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);transition:opacity .25s"; document.body.appendChild(t); } t.textContent=m; t.style.opacity="1"; clearTimeout(t._h); t._h=setTimeout(function(){ t.style.opacity="0"; }, 2600); }

/* ══ HUDDLE SHOW (27e, Oct 27) — the daily huddle on one screen (office TV), the same order every day ══
   "Understandable for the VAs … more creative and consistent … pulled out every day … 10 to 15 minutes a day to discuss,
   to brainstorm, to plan, to strategize." Fixed run of show, each part with its own clock: Welcome · Did we do it? · Wins ·
   The numbers · Reddit removals · Check-ins · The plan · Wrap-up. Every slide carries a line for the presenter to say.
   Goals, check-ins and the team's notes are saved as the huddle goes (huddle_save) and the next huddle of the shift opens
   with "Did we do it?" — measurable goals are already judged from that shift's data. */
var SEGS=[
  { k:"open",     n:"Welcome",         c:"#f97316", s:30  },
  { k:"review",   n:"Did we do it?",   c:"#34d399", s:90  },
  { k:"wins",     n:"Wins",            c:"#fbbf24", s:90  },
  { k:"numbers",  n:"The numbers",     c:"#38bdf8", s:120 },
  { k:"reddit",   n:"Reddit removals", c:"#f472b6", s:180 },
  { k:"checkins", n:"Check-ins",       c:"#fb7185", s:150 },
  { k:"plan",     n:"The plan",        c:"#a78bfa", s:150 },
  { k:"close",    n:"Wrap-up",         c:"#f97316", s:30  }
];
var GOALK={ timer:"Timer on the whole shift", posts:"Check every post before End of Day", focus:"No idle stretches" };
function hx(h, a){ h=String(h||"#f97316").replace("#",""); if(h.length===3) h=h.split("").map(function(c){ return c+c; }).join(""); var n=parseInt(h,16); return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"; }
function clk(sec){ sec=Math.max(0,Math.round(sec)); return Math.floor(sec/60)+":"+("0"+(sec%60)).slice(-2); }
function night(){ return S.shift==="night"; }
function lastLbl(R){ return R.multi ? "Friday to Sunday" : (night() ? "last night" : "yesterday"); }
function nowLbl(){ return night() ? "tonight" : "today"; }
function lc1(t){ t=String(t||""); return t.charAt(0).toLowerCase()+t.slice(1); }
function plural(n, one, many){ return n+" "+(n===1?one:(many||one+"s")); }
function ckList(R){ return (R.flags||[]).filter(function(f){ return f.status!=="dismissed"; }); }
function stripName(q, first){ q=String(q||""); return q.indexOf(first+", ")===0 ? q.charAt(first.length+2).toUpperCase()+q.slice(first.length+3) : q; }
function plainWin(w){ var d=String(w.detail||""); if(w.kind==="pace") return d.replace(/\/h/g," per hour").replace(" — shift average "," · the shift averaged ");
  if(w.kind==="focus") return d.replace(/^(\d+)% of timed minutes active over (.+)$/, "Active $1% of the timer over $2"); if(w.kind==="clean") return "Nothing to check — clean shift"; return d; }
function shiftPeople(R){
  var m={}, out=[]; (R.here||[]).forEach(function(p){ m[p.id]={ id:p.id, name:p.name, first:p.first, here:true }; });
  (R.people||[]).forEach(function(p){ if(m[p.id]) return; m[p.id]={ id:p.id, name:p.name, first:p.first, here:false }; });
  Object.keys(m).forEach(function(k){ out.push(m[k]); });
  out.sort(function(a,b){ return (b.here-a.here) || String(a.first).localeCompare(String(b.first)); });
  return out;
}
/* goal ideas for one person, from their own last shift */
function goalIdeas(R, id){
  var F=(R.flags||[]).filter(function(f){ return f.emp===id && f.status!=="dismissed"; }), out=[], seen={};
  function add(k, t, x){ if(seen[k]) return; seen[k]=1; var o={ k:k, t:t }; if(x) for(var z in x) o[z]=x[z]; out.push(o); }
  function has(L){ return F.some(function(f){ return L.indexOf(f.type)>=0; }); }
  var va=R.removals&&R.removals.va&&R.removals.va[id];
  if(has(["untimed","no_timeout","no_timein","manual"])) add("timer", GOALK.timer);
  if(va && va[4]>0) add("posts", GOALK.posts);
  if(has(["idle","tool_gap","held"])) add("focus", GOALK.focus);
  var P=(R.people||[]).filter(function(p){ return p.id===id; })[0], T=P&&(P.tasks||[]).filter(function(t){ return t.qph>0 && t.hours>=1; })[0];
  if(T){ var n=Math.max(1, Math.ceil(T.qph*1.1)); add("pace", n+" per hour on "+T.task, { task:T.task, n:n }); }
  if(va && va[0] && !va[4]) add("posts", GOALK.posts);
  add("timer", GOALK.timer); add("focus", GOALK.focus);
  return out.slice(0,2);
}
/* what to talk about on the Reddit slide */
function rdPrompts(X){
  var a=X.t, chk=a[1]+a[2]+a[3], out=[];
  if(a[4]>0 && a[4]>=0.3*a[0]) out.push(a[4]+" posts never got checked, so we can't tell if they stayed up. What will help us check every post before End of Day?");
  function rated(o){ return Object.keys(o||{}).map(function(k){ var v=o[k], c=v[1]+v[2]+v[3]; return { k:k, c:c, pc:c?Math.round((v[2]+v[3])/c*100):null }; }).filter(function(x){ return x.c>=3; }).sort(function(x,y){ return y.pc-x.pc; }); }
  var M=rated(X.method); if(M.length>=2 && M[0].pc-M[M.length-1].pc>=20) out.push(M[0].k+" lost "+M[0].pc+"% of its checked posts, "+M[M.length-1].k+" "+M[M.length-1].pc+"%. What are we doing differently on "+M[M.length-1].k+"?");
  var MO=rated(rmModels(X.model)); if(MO.length && MO[0].pc>=50 && out.length<2) out.push(MO[0].k+"'s posts got removed "+MO[0].pc+"% of the time. Which subreddits, titles or post styles should we change?");
  if(!out.length) out.push(chk?"What's one thing we can try "+nowLbl()+" to keep more posts up?":"Let's make sure every post gets checked before End of Day "+nowLbl()+".");
  return out.slice(0,2);
}

/* ── state ── */
var SH=null;
function showList(R){
  var L=[];
  SEGS.forEach(function(g){
    if(g.k==="review" && !(R.review && R.review.length)) return;
    if(g.k==="reddit" && !(R.removals && R.removals.t && R.removals.t[0])) return;
    if(g.k==="checkins"){ var F=ckList(R); if(!F.length) return; var n=Math.ceil(F.length/2); for(var p=0;p<n;p++) L.push({ g:g, p:p, n:n }); return; }
    L.push({ g:g, p:0, n:1 });
  });
  return L;
}
function segsIn(L){ var o=[]; L.forEach(function(x){ if(o.indexOf(x.g)<0) o.push(x.g); }); return o; }
function planSec(L){ return segsIn(L).reduce(function(s,g){ return s+g.s; },0); }
function spentOn(k){ var t=(SH.spent[k]||0); if(SH.cur===k) t+=(Date.now()-SH.enter)/1000; return t; }

/* ── slide builders: each returns { h:html, say:"what the presenter says" } ── */
function sHead(g, title, sub, extra){
  var part=segsIn(SH.L).filter(function(x){ return x.k!=="open" && x.k!=="close"; }).indexOf(g)+1;
  return '<div class="hds-kick" style="color:'+g.c+'">'+(part>0?"Part "+part+" · ":"")+esc(g.n)+(extra?' · '+extra:"")+'</div><h1 class="hds-h1">'+title+'</h1>'+(sub?'<div class="hds-sub">'+sub+'</div>':"");
}
function bOpen(R, it){
  var pres=(S.state&&S.state.shifts&&S.state.shifts[S.shift])||S.item||{}, ppl=shiftPeople(R), mins=Math.round(planSec(SH.L)/60);
  var ag=segsIn(SH.L).filter(function(g){ return g.k!=="open" && g.k!=="close"; }).map(function(g,i){ return '<div class="hds-ag"><span class="n" style="background:'+hx(g.c,.18)+';color:'+g.c+'">0'+(i+1)+'</span><b>'+esc(g.n)+'</b><span class="t">'+clk(g.s)+'</span></div>'; }).join("");
  var h='<div class="hds-cols" style="grid-template-columns:1.25fr 1fr">'+
    '<div><div class="hds-kick" style="color:'+it.g.c+'">'+(night()?"Night":"Morning")+' huddle · '+esc(dayLong(S.H))+'</div>'+
      '<h1 class="hds-h1 xl">Good '+(night()?"evening":"morning")+', team.</h1>'+
      '<div class="hds-sub">About '+mins+' minutes. We look back at '+esc(lastLbl(R))+', then plan '+nowLbl()+'.</div>'+
      '<div class="hds-agenda">'+ag+'</div></div>'+
    '<div class="hds-card glow" style="align-self:start">'+(pres.presenter?'<div class="hds-who">'+avatar(pres.presenter, pres.presenter_name, 120)+'<div><div class="hds-lbl">Presented by</div><div class="hds-big">'+esc(pres.presenter_first||first(pres.presenter_name))+'</div><div class="hds-dim">'+esc(pres.presenter_name)+'</div></div></div>':'<div class="hds-lbl">Presenter</div><div class="hds-big">Not picked yet</div>')+
      '<div class="hds-lbl" style="margin-top:34px">On the '+(night()?"night":"morning")+' shift · '+ppl.length+'</div><div class="hds-faces">'+ppl.map(function(p){ return '<div class="f'+(p.here?"":" off")+'">'+avatar(p.id,p.name,74)+'<span>'+esc(p.first)+'</span></div>'; }).join("")+'</div></div></div>';
  return { h:h, say:"Good "+(night()?"evening":"morning")+", everyone! This is our "+(night()?"night":"morning")+" huddle — about "+mins+" minutes. We'll "+(R.review&&R.review.length?"check our goals from last time, ":"")+"celebrate our wins, go through the numbers"+(R.removals&&R.removals.t&&R.removals.t[0]?" and Reddit removals":"")+", do quick check-ins, and set "+nowLbl()+"'s goals." };
}
function rvState(x){ var d=x.done||(x.auto==="yes"?"yes":(x.auto==="no"?"no":(x.auto==="na"?"na":""))); return d; }
var RVL={ yes:["Done","#34d399"], partly:["Partly","#fbbf24"], no:["Not yet","#fb7185"], na:["Didn't apply","#94a3b8"], "":["Your call","#a78bfa"] };
function bReview(R, it){
  var L=R.review||[], ok=L.filter(function(x){ return rvState(x)==="yes"; }).length, cnt=L.filter(function(x){ return rvState(x)!=="na"; }).length;
  var pc=cnt?Math.round(ok/cnt*100):0, C=2*Math.PI*88;
  var ring='<div class="hds-ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,.1)"/><circle cx="100" cy="100" r="88" stroke="'+it.g.c+'" stroke-dasharray="'+(C*pc/100)+' '+C+'" class="arc"/></svg><div><b>'+ok+'<small>/'+cnt+'</small></b><span>goals done</span></div></div>';
  var cards=L.map(function(x){ var st=rvState(x), lb=RVL[st]||RVL[""];
    return '<div class="hds-card rv"><div class="hds-who sm">'+avatar(x.emp,x.name,64)+'<div style="flex:1;min-width:0"><div class="nm">'+esc(x.first)+'</div><div class="gl">“'+esc(x.t)+'”</div></div><span class="hds-chip" style="background:'+hx(lb[1],.18)+';color:'+lb[1]+'">'+lb[0]+'</span></div>'+
      (x.why?'<div class="why">From the data: '+esc(x.why)+'</div>':'<div class="why">The team decides this one.</div>')+
      '<div class="hds-btns">'+["yes","partly","no"].map(function(v){ return '<button data-rv="'+esc(x.emp)+'" data-v="'+v+'" class="'+(x.done===v?"on":"")+'">'+RVL[v][0]+'</button>'; }).join("")+'</div></div>'; }).join("");
  var miss=L.filter(function(x){ return rvState(x)==="no"; })[0];
  return { h:'<div class="hds-cols" style="grid-template-columns:420px 1fr;align-items:start"><div>'+sHead(it.g, "Did we do it?", "Last huddle each of us set one goal for the shift. Green means the system already saw it in the data.")+ring+'</div><div class="hds-grid2">'+cards+'</div></div>',
    say:"Let's start with last time's goals. "+(cnt?ok+" of "+cnt+" got done. ":"")+(miss?miss.first+", yours was “"+miss.t+"” — what got in the way, and what will you do differently?":"Go around quickly: read each goal and ask, did we do it?") };
}
function bWins(R, it){
  var W=[];
  (R.wins||[]).forEach(function(w){ if(w.kind==="clean") return; W.push({ ids:[w.emp], names:[w.first||first(w.name)], t:w.title, d:plainWin(w) }); });
  var cl=(R.wins||[]).filter(function(w){ return w.kind==="clean"; })[0];
  if(cl){ var ids=(R.people||[]).filter(function(p){ return p.flags===0 && p.hours>=6; }); if(ids.length) W.push({ ids:ids.map(function(p){ return p.id; }), names:ids.map(function(p){ return p.first; }), t:"Clean shift", d:"Nothing to check — timer, tools and output all lined up" }); }
  var gd=(R.review||[]).filter(function(x){ return rvState(x)==="yes"; }); if(gd.length) W.push({ ids:gd.map(function(x){ return x.emp; }), names:gd.map(function(x){ return x.first; }), t:"Kept their word", d:"Did the goal they set at the last huddle" });
  var va=(R.removals&&R.removals.va)||{}, pc=Object.keys(va).filter(function(id){ return va[id][0]>0 && !va[id][4]; }), pn=pc.map(function(id){ var p=(R.people||[]).filter(function(q){ return q.id===id; })[0]; return p?p.first:id; });
  if(pc.length) W.push({ ids:pc, names:pn, t:"Checked every post", d:"Every Reddit post they made was checked before going home" });
  var conf=""; for(var i=0;i<26;i++){ conf+='<i style="left:'+((i*37)%100)+'%;background:'+PCOL[i%PCOL.length]+';animation-delay:'+((i%9)*0.18)+'s;animation-duration:'+(2.4+(i%5)*0.35)+'s"></i>'; }
  var full={}; (R.people||[]).forEach(function(p){ full[p.id]=p.name; }); (R.here||[]).forEach(function(p){ if(!full[p.id]) full[p.id]=p.name; });
  var cards=W.length?W.slice(0,6).map(function(w,i){ return '<div class="hds-card win" style="animation-delay:'+(0.12*i)+'s"><div class="faces">'+w.ids.slice(0,4).map(function(id,j){ return avatar(id, full[id]||w.names[j]||id, 92); }).join("")+'</div><div class="lbl" style="color:'+it.g.c+'">'+esc(w.t)+'</div><div class="nm">'+esc(w.names.join(", "))+'</div><div class="dt">'+esc(w.d)+'</div></div>'; }).join("")
    :'<div class="hds-card" style="grid-column:1/-1;text-align:center;padding:60px"><div class="hds-big">No standouts in the data this time.</div><div class="hds-dim" style="margin-top:10px;font-size:26px">Who wants to shout out a teammate?</div></div>';
  return { h:'<div class="hds-conf">'+conf+'</div>'+sHead(it.g, "Shout-outs", "The best of "+esc(lastLbl(R))+".")+'<div class="hds-wins">'+cards+'</div>',
    say:W.length?"Let's hear it for "+W[0].names.join(" and ")+" — "+lc1(W[0].t)+"! "+(W.length>1?"And "+W.slice(1).map(function(w){ return w.names.join(" and ")+" ("+lc1(w.t)+")"; }).join(", ")+".":""):"No standouts in the numbers this time — who wants to give a shout-out to a teammate?" };
}
function bNumbers(R, it){
  var t=R.team, vs=(t.usual_h>0)?Math.round((t.hours-t.usual_h)/t.usual_h*100):null;
  var vsT=vs==null?"":(Math.abs(vs)<3?"about the same as our usual":(vs>0?vs+"% more than our usual":Math.abs(vs)+"% less than our usual"));
  var mx=Math.max.apply(null,(R.projects||[]).map(function(p){ return p.hours; }).concat([1]));
  var pj=(R.projects||[]).slice(0,5).map(function(p,i){ var tk=p.tasks.filter(function(x){ return x.volume>0; }).slice(0,3).map(function(x){ return '<span><b>'+r1(x.volume)+'</b> '+esc(x.task)+'</span>'; }).join("");
    return '<div class="hds-pj"><div class="hd"><b>'+esc(p.project)+'</b><span>'+plural(p.vas,"person","people")+'</span><em>'+fh(p.hours)+'</em></div><div class="bar"><i style="width:'+(p.hours/mx*100)+'%;background:'+PCOL[i%PCOL.length]+'"></i></div>'+(tk?'<div class="tk">'+tk+'</div>':"")+'</div>'; }).join("");
  var tr=(t.trend||[]).slice(-14), tm=Math.max.apply(null,tr.map(function(x){ return x.hours; }).concat([1]));
  var spark=tr.length?'<div class="hds-lbl" style="margin-top:30px">Our last 2 weeks</div><div class="hds-trend">'+tr.map(function(x){ var on=(R.dates||[]).indexOf(x.date)>=0; return '<div><i class="'+(on?"on":"")+'" style="height:'+Math.max(6,x.hours/tm*100)+'%;'+(on?"background:"+it.g.c:"")+'"></i><span>'+esc(DOW[dow(x.date)].charAt(0))+'</span></div>'; }).join("")+'</div>':"";
  var tiles='<div class="hds-tiles">'+
    '<div class="hds-card"><div class="v">'+(t.eng_pct!=null?t.eng_pct+"%":"—")+'</div><div class="l">Active</div><div class="s">of the time the timer ran</div></div>'+
    '<div class="hds-card"><div class="v">'+(t.tool_pct!=null?t.tool_pct+"%":"—")+'</div><div class="l">Seen by the tools</div><div class="s">of our time on tool work</div></div>'+
    '<div class="hds-card"><div class="v">'+t.vas+'</div><div class="l">On the shift</div><div class="s">about '+fh(t.avg_h)+' each</div></div></div>';
  var top=(R.projects||[])[0];
  return { h:'<div class="hds-cols" style="grid-template-columns:1fr 1.05fr;align-items:start"><div>'+sHead(it.g, 'Together we worked <span class="hds-num" style="color:'+it.g.c+'" data-cnt="'+t.hours+'">'+fh(t.hours)+'</span>', esc(lastLbl(R).charAt(0).toUpperCase()+lastLbl(R).slice(1))+(vsT?" — "+vsT+".":"."))+tiles+spark+'</div>'+
      '<div class="hds-card"><div class="hds-lbl">Where our time went</div>'+pj+'</div></div>',
    say:"Here's "+lastLbl(R)+" in numbers: we worked "+fh(t.hours).replace(" h"," hours")+" together"+(vsT?", "+vsT:"")+"."+(top?" "+top.project+" took most of it — "+fh(top.hours).replace(" h"," hours")+" across "+plural(top.vas,"person","people")+".":"")+(t.eng_pct!=null?" We were active "+t.eng_pct+"% of the time the timer ran.":"") };
}
function bReddit(R, it){
  var X=R.removals, a=X.t, chk=a[1]+a[2]+a[3], pc=rmRate(a), P=R.removals_prev, ppc=P&&P.t?rmRate(P.t):null;
  var tens=pc==null?null:Math.round(pc/10);
  var title=chk?'<span style="color:'+rmCol(pc)+'">'+pc+'%</span> of the posts we checked came down':"No posts were checked yet";
  var sub=chk?(a[2]+a[3])+" of "+chk+" checked posts were removed — about "+tens+" in 10."+(a[4]?" "+plural(a[4],"post")+" "+(a[4]===1?"was":"were")+" never checked.":" Every post was checked."):plural(a[0],"post")+" went up — none were checked.";
  var segs=[[a[1],"#34d399","Stayed up"],[a[2],"#fb923c","Removed by mods"],[a[3],"#ef4444","Spam filter"],[a[4],"rgba(255,255,255,.18)","Not checked"]];
  var bar='<div class="hds-stack">'+segs.map(function(s){ return s[0]?'<i style="flex:'+s[0]+';background:'+s[1]+'"></i>':""; }).join("")+'</div><div class="hds-leg">'+segs.map(function(s){ return '<span><i style="background:'+s[1]+'"></i><b>'+s[0]+'</b> '+s[2]+'</span>'; }).join("")+'</div>';
  var vsd=(ppc!=null && pc!=null)?'<div class="hds-vs">The day before: <b>'+ppc+'%</b> · '+(pc===ppc?"no change":(pc<ppc?'<span style="color:#34d399">'+(ppc-pc)+' points better</span>':'<span style="color:#fb7185">'+(pc-ppc)+' points worse</span>'))+'</div>':"";
  var lists='<div class="hds-rl"><div><h4>By model</h4>'+rmList(rmModels(X.model))+'</div><div><h4>By method</h4>'+rmList(X.method)+'</div></div>';
  var shf=Object.keys(X.shift||{}).length>1?'<div class="hds-card" style="margin-top:18px;padding:20px 26px"><h4 style="margin:0 0 6px;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55)">By shift (who posted)</h4>'+rmList(X.shift)+'</div>':"";
  var pr=rdPrompts(X);
  var talk='<div class="hds-card talk"><div class="hds-lbl" style="color:'+it.g.c+'">Talk it out</div>'+pr.map(function(q){ return '<div class="q">'+esc(q)+'</div>'; }).join("")+
    '<div class="hds-lbl" style="margin-top:18px">What we\'ll try '+nowLbl()+'</div><textarea data-talk="reddit" placeholder="Type the team\'s ideas here…">'+esc((R.talk&&R.talk.reddit)||"")+'</textarea></div>';
  return { h:'<div class="hds-cols" style="grid-template-columns:1.35fr 1fr;align-items:start"><div>'+sHead(it.g, title, esc(sub))+bar+vsd+lists+'</div><div>'+talk+shf+'</div></div>',
    say:"Now our main focus — Reddit removals. "+(chk?pc+"% of the posts we checked got removed, about "+tens+" in 10. ":"")+(a[4]?a[4]+" posts were never checked. ":"")+"Let's talk: "+pr[0] };
}
function bChecks(R, it){
  var F=ckList(R), page=F.slice(it.p*2, it.p*2+2);
  var cards=page.map(function(f){ var i=R.flags.indexOf(f), P=(R.people||[]).filter(function(p){ return p.id===f.emp; })[0], st=f.status||"open";
    var day=P&&(P.days||[]).filter(function(d){ return d.date===f.date; })[0], g=(f.at && day && day.strip)?'<div class="gr">'+graph(day, P)+'</div>':"";
    var lab={ explained:["We talked about it","#34d399"], follow:["Follow up later","#fbbf24"], asked:["Asked","#38bdf8"] }[st];
    return '<div class="hds-card ck'+(st==="explained"?" done":"")+'"><div class="hds-who sm">'+avatar(f.emp,f.name,78)+'<div style="flex:1;min-width:0"><div class="nm">'+esc(f.first||first(f.name))+(R.multi?' <span class="hds-dim" style="font-size:20px">· '+esc(dayLbl(f.date))+'</span>':"")+'</div><div class="tt">'+esc(f.title)+'</div></div>'+
      (lab?'<span class="hds-chip" style="background:'+hx(lab[1],.18)+';color:'+lab[1]+'">'+lab[0]+'</span>':"")+
      '<div class="hds-btns" style="margin-top:0"><button data-ck="'+i+'" data-v="explained" class="'+(st==="explained"?"on":"")+'">We talked about it</button><button data-ck="'+i+'" data-v="follow" class="'+(st==="follow"?"on":"")+'">Follow up later</button></div></div>'+
      '<div class="ask"><b>Ask '+esc(f.first||first(f.name))+':</b> '+esc(stripName(f.q, f.first||first(f.name)))+'</div>'+g+'</div>'; }).join("");
  var f0=page[0];
  return { h:sHead(it.g, "Check-ins", "Quick questions from the tools. No blame — we just want the story so we can fix it together.", it.n>1?(it.p+1)+" of "+it.n:"")+'<div class="hds-cks">'+cards+'</div>',
    say:f0?(f0.first||first(f0.name))+", "+stripName(f0.q, f0.first||first(f0.name)).charAt(0).toLowerCase()+stripName(f0.q, f0.first||first(f0.name)).slice(1):"" };
}
function bPlan(R, it){
  var ppl=shiftPeople(R), G={}; (R.goals||[]).forEach(function(g){ G[g.emp]=g; });
  var rows=ppl.map(function(p){ var g=G[p.id], ideas=goalIdeas(R, p.id);
    return '<div class="hds-goal'+(g?" set":"")+'"><div class="who">'+avatar(p.id,p.name,48)+'<div><div class="nm">'+esc(p.first)+'</div>'+(p.here?"":'<div class="hds-dim" style="font-size:15px">not timed in yet</div>')+'</div></div>'+
      '<div class="in"><input data-goal="'+esc(p.id)+'" data-kind="'+esc(g?g.k:"custom")+'" data-task="'+esc(g&&g.task||"")+'" data-n="'+esc(g&&g.n||"")+'" value="'+esc(g?g.t:"")+'" placeholder="One goal for '+nowLbl()+'…" maxlength="200">'+
      '<div class="ideas">'+ideas.map(function(x){ return '<button data-idea="'+esc(p.id)+'" data-k="'+esc(x.k)+'" data-t="'+esc(x.t)+'" data-task="'+esc(x.task||"")+'" data-n="'+esc(x.n||"")+'">'+esc(x.t)+'</button>'; }).join("")+'</div></div></div>'; }).join("");
  var n=(R.goals||[]).length;
  return { h:'<div class="hds-cols" style="grid-template-columns:1fr 2.5fr;gap:44px;align-items:start"><div>'+sHead(it.g, (night()?"Tonight's":"Today's")+" plan", "One goal each — something we can check at the next huddle. Tap an idea or type your own.")+
      '<div class="hds-card" style="margin-top:26px"><div class="hds-lbl">Goals set</div><div class="hds-big" data-gc>'+n+' <span class="hds-dim">/ '+ppl.length+'</span></div></div>'+
      '<div class="hds-card talk" style="margin-top:18px"><div class="hds-lbl" style="color:'+it.g.c+'">Team focus '+nowLbl()+'</div><textarea data-talk="plan" placeholder="What\'s our one team focus '+nowLbl()+'?">'+esc((R.talk&&R.talk.plan)||"")+'</textarea></div></div>'+
      '<div class="hds-goals">'+rows+'</div></div>',
    say:"Let's set "+nowLbl()+"'s goals. Go around — one goal each, something we can check at the next huddle. Tap an idea or say your own." };
}
function bClose(R, it){
  var ppl=shiftPeople(R), n=(R.goals||[]).length, F=ckList(R), talked=F.filter(function(f){ return f.status==="explained"||f.status==="follow"; }).length, used=(Date.now()-SH.t0)/1000;
  var focus=(R.talk&&R.talk.plan)||"";
  return { h:'<div style="text-align:center;padding-top:40px">'+'<div class="hds-kick" style="color:'+it.g.c+'">Wrap-up</div><h1 class="hds-h1 xl">That\'s our huddle.</h1><div class="hds-sub" style="margin:0 auto">Let\'s have a great '+(night()?"night":"shift")+'!</div>'+
      '<div class="hds-tiles" style="max-width:1300px;margin:50px auto 0"><div class="hds-card"><div class="v">'+n+'<small>/'+ppl.length+'</small></div><div class="l">Goals set</div></div><div class="hds-card"><div class="v">'+talked+'<small>/'+F.length+'</small></div><div class="l">Check-ins covered</div></div><div class="hds-card"><div class="v">'+clk(used)+'</div><div class="l">Huddle time</div></div></div>'+
      (focus?'<div class="hds-card glow" style="max-width:1300px;margin:30px auto 0;text-align:left"><div class="hds-lbl">Team focus '+nowLbl()+'</div><div class="hds-big" style="font-size:40px;margin-top:6px">'+esc(focus)+'</div></div>':"")+
      '<div class="hds-dim" style="margin-top:34px;font-size:26px">Next huddle starts with: did we do it?</div></div>',
    say:"Thanks, team! Remember your goal — we'll check it at the next huddle. Let's go!" };
}
var BUILD={ open:bOpen, review:bReview, wins:bWins, numbers:bNumbers, reddit:bReddit, checkins:bChecks, plan:bPlan, close:bClose };

/* ── the show ── */
function showCss(){
  if(document.getElementById("hds-css")) return; var st=document.createElement("style"); st.id="hds-css";
  st.textContent=[
  ".hds{position:fixed;inset:0;z-index:2147483000;background:#05070f;overflow:hidden;color:#fff;font-family:inherit}",
  ".hds *{box-sizing:border-box}",
  ".hds-st{position:absolute;left:50%;top:50%;width:1920px;height:1080px;overflow:hidden;background:#0a0e1c;transform-origin:center center}",
  ".hds-bl{position:absolute;border-radius:50%;filter:blur(120px);opacity:.55;transition:background 1s}",
  ".hds-bl.a{width:900px;height:900px;left:-260px;top:-380px;animation:hdsDrift 18s ease-in-out infinite alternate}",
  ".hds-bl.b{width:800px;height:800px;right:-260px;bottom:-420px;animation:hdsDrift 22s ease-in-out infinite alternate-reverse}",
  "@keyframes hdsDrift{from{transform:translate(0,0) scale(1)}to{transform:translate(120px,80px) scale(1.12)}}",
  ".hds-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}",
  ".hds-top{position:absolute;left:0;right:0;top:0;height:112px;display:flex;align-items:center;gap:22px;padding:0 64px;z-index:2}",
  ".hds-top img{width:44px;height:44px;border-radius:12px}",
  ".hds-top .tt{font-size:22px;font-weight:800;letter-spacing:-.01em;white-space:nowrap}.hds-top .tt span{display:block;font-size:15px;font-weight:600;color:rgba(255,255,255,.55)}",
  ".hds-rail{display:flex;gap:8px;margin-left:auto}",
  ".hds-rail div{position:relative;padding:9px 16px;border-radius:999px;font-size:15px;font-weight:700;color:rgba(255,255,255,.5);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);overflow:hidden;white-space:nowrap}",
  ".hds-rail div.on{color:#0a0e1c}.hds-rail div.done{color:rgba(255,255,255,.8)}",
  ".hds-rail div i{position:absolute;left:0;bottom:0;height:3px}",
  ".hds-body{position:absolute;left:0;right:0;top:120px;bottom:132px;padding:18px 110px 0;z-index:2}",
  ".hds-sl{height:100%;animation:hdsIn .55s cubic-bezier(.2,.8,.2,1)}",
  "@keyframes hdsIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}",
  ".hds-ghost{position:absolute;right:90px;top:96px;font-size:320px;font-weight:900;letter-spacing:-.06em;line-height:1;color:rgba(255,255,255,.04);z-index:1;pointer-events:none}",
  ".hds-kick{font-size:20px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}",
  ".hds-h1{font-size:76px;line-height:1.02;letter-spacing:-.035em;font-weight:900;margin:10px 0 14px}",
  ".hds-h1.xl{font-size:110px}",
  ".hds-sub{font-size:28px;line-height:1.35;color:rgba(255,255,255,.72);max-width:1200px}",
  ".hds-num{font-variant-numeric:tabular-nums}",
  ".hds-cols{display:grid;gap:56px;height:100%}",
  ".hds-card{background:rgba(16,21,38,.82);border:1px solid rgba(255,255,255,.1);border-radius:26px;padding:26px 30px;backdrop-filter:blur(6px)}",
  ".hds b,.hds em,.hds strong,.hds h1,.hds h4{color:inherit}",
  ".hds-card.glow{background:linear-gradient(140deg,rgba(30,36,60,.9),rgba(16,21,38,.85));box-shadow:0 30px 80px -40px rgba(0,0,0,.8)}",
  ".hds-lbl{font-size:16px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55)}",
  ".hds-big{font-size:48px;font-weight:900;letter-spacing:-.02em;line-height:1.1}",
  ".hds-dim{color:rgba(255,255,255,.55);font-weight:600}",
  ".hds-who{display:flex;align-items:center;gap:22px}.hds-who.sm{gap:16px}",
  ".hds .hd-av{background:linear-gradient(135deg,#fdba74,#f472b6);color:#431407;box-shadow:0 0 0 4px rgba(255,255,255,.08)}",
  ".hds-faces{display:flex;flex-wrap:wrap;gap:18px 14px;margin-top:16px}.hds-faces .f{display:flex;flex-direction:column;align-items:center;gap:6px;width:92px;font-size:17px;font-weight:700}.hds-faces .f.off{opacity:.45}",
  ".hds-agenda{margin-top:40px;display:grid;gap:12px;max-width:820px}",
  ".hds-ag{display:flex;align-items:center;gap:18px;font-size:30px;padding:14px 20px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}",
  ".hds-ag .n{font-size:20px;font-weight:900;padding:6px 12px;border-radius:12px}.hds-ag .t{margin-left:auto;color:rgba(255,255,255,.5);font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}",
  ".hds-chip{font-size:18px;font-weight:800;padding:8px 14px;border-radius:999px;white-space:nowrap}",
  ".hds-btns{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}",
  ".hds-btns button,.hds-nav button{font:inherit;font-size:18px;font-weight:700;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:11px 18px;cursor:pointer}",
  ".hds-btns button:hover,.hds-nav button:hover{background:rgba(255,255,255,.16)}",
  ".hds-btns button.on{background:#fff;color:#0a0e1c;border-color:#fff}",
  ".hds-ring{position:relative;width:300px;height:300px;margin-top:40px}.hds-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.hds-ring circle{fill:none;stroke-width:16;stroke-linecap:round}.hds-ring .arc{animation:hdsArc 1.2s cubic-bezier(.2,.8,.2,1)}",
  "@keyframes hdsArc{from{stroke-dasharray:0 999}}",
  ".hds-ring>div{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.hds-ring b{font-size:96px;font-weight:900;letter-spacing:-.04em;line-height:1}.hds-ring b small{font-size:44px;color:rgba(255,255,255,.5)}.hds-ring span{font-size:20px;color:rgba(255,255,255,.6);font-weight:700}",
  ".hds-grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-content:start;max-height:800px;overflow:auto;padding-right:6px}",
  ".hds-card.rv .nm{font-size:28px;font-weight:900}.hds-card.rv .gl{font-size:22px;color:rgba(255,255,255,.8);margin-top:2px}.hds-card.rv .why{font-size:18px;color:rgba(255,255,255,.55);margin-top:12px}",
  ".hds-conf{position:absolute;inset:-120px 0 0;pointer-events:none;overflow:hidden;z-index:0}.hds-conf i{position:absolute;top:-20px;width:12px;height:22px;border-radius:3px;opacity:.85;animation:hdsFall linear 1 both}",
  "@keyframes hdsFall{0%{transform:translateY(-40px) rotate(0)}100%{transform:translateY(1100px) rotate(540deg);opacity:0}}",
  ".hds-wins{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:34px}",
  ".hds-card.win{animation:hdsPop .6s cubic-bezier(.2,1.4,.4,1) both;padding:30px}.hds-card.win .faces{display:flex}.hds-card.win .faces .hd-av{margin-right:-18px}",
  "@keyframes hdsPop{from{opacity:0;transform:scale(.85) translateY(20px)}to{opacity:1;transform:none}}",
  ".hds-card.win .lbl{font-size:18px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;margin-top:20px}.hds-card.win .nm{font-size:40px;font-weight:900;letter-spacing:-.02em;margin-top:4px;line-height:1.1}.hds-card.win .dt{font-size:21px;color:rgba(255,255,255,.7);margin-top:8px}",
  ".hds-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px}.hds-tiles .v{font-size:64px;font-weight:900;letter-spacing:-.03em;line-height:1}.hds-tiles .v small{font-size:34px;color:rgba(255,255,255,.5)}.hds-tiles .l{font-size:20px;font-weight:800;margin-top:8px}.hds-tiles .s{font-size:17px;color:rgba(255,255,255,.55)}",
  ".hds-trend{display:flex;gap:8px;align-items:flex-end;height:120px;margin-top:12px}.hds-trend div{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}.hds-trend i{width:100%;border-radius:8px 8px 3px 3px;background:rgba(255,255,255,.18);animation:hdsUp .9s cubic-bezier(.2,.8,.2,1) both}.hds-trend span{font-size:14px;color:rgba(255,255,255,.45);font-weight:700}",
  "@keyframes hdsUp{from{height:0}}",
  ".hds-pj{padding:16px 0;border-bottom:1px solid rgba(255,255,255,.08)}.hds-pj:last-child{border-bottom:0}.hds-pj .hd{display:flex;align-items:baseline;gap:14px;font-size:26px}.hds-pj .hd span{font-size:18px;color:rgba(255,255,255,.55)}.hds-pj .hd em{margin-left:auto;font-style:normal;font-weight:900;color:#fff}.hds-pj .hd b{color:#fff}",
  ".hds-pj .bar{height:16px;border-radius:10px;background:rgba(255,255,255,.07);margin-top:10px;overflow:hidden}.hds-pj .bar i{display:block;height:100%;border-radius:10px;animation:hdGrow 1s cubic-bezier(.2,.8,.2,1)}",
  ".hds-pj .tk{display:flex;gap:22px;flex-wrap:wrap;margin-top:9px;font-size:18px;color:rgba(255,255,255,.7)}.hds-pj .tk b{color:#fff}",
  ".hds-stack{display:flex;height:34px;border-radius:12px;overflow:hidden;margin-top:30px;background:rgba(255,255,255,.06)}.hds-stack i{display:block;animation:hdsW 1s cubic-bezier(.2,.8,.2,1)}",
  "@keyframes hdsW{from{flex:0}}",
  ".hds-leg{display:flex;gap:26px;flex-wrap:wrap;margin-top:12px;font-size:19px;color:rgba(255,255,255,.75)}.hds-leg i{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:8px;vertical-align:-1px}.hds-leg b{color:#fff;margin-right:4px}",
  ".hds-vs{margin-top:16px;font-size:21px;color:rgba(255,255,255,.7)}",
  ".hds-rl{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:30px;margin-top:26px}.hds-rl h4{margin:0 0 8px;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55)}",
  ".hds .hd-rr{grid-template-columns:minmax(170px,1.2fr) 1.6fr 64px;font-size:21px;border-color:rgba(255,255,255,.1);padding:8px 0}.hds .hd-rr .nm small{color:rgba(255,255,255,.5);font-size:15px}.hds .hd-bar{background:rgba(255,255,255,.08)}",
  ".hds-card.talk .q{font-size:23px;line-height:1.35;margin-top:14px;padding-left:18px;border-left:4px solid rgba(255,255,255,.25)}",
  ".hds-card.talk textarea{min-height:120px}",
  ".hds textarea,.hds input{width:100%;font:inherit;font-size:22px;color:#fff;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:13px 16px;outline:none}",
  ".hds textarea{min-height:150px;resize:none;margin-top:8px}.hds textarea:focus,.hds input:focus{border-color:rgba(255,255,255,.55);background:rgba(0,0,0,.35)}",
  ".hds-cks{display:grid;gap:18px;margin-top:26px}",
  ".hds-card.ck{padding:22px 28px}.hds-card.ck.done{opacity:.55}.hds-card.ck .nm{font-size:30px;font-weight:900}.hds-card.ck .tt{font-size:22px;color:rgba(255,255,255,.75)}",
  ".hds-card.ck .ask{font-size:25px;line-height:1.35;margin-top:14px;padding:14px 18px;border-radius:14px;background:rgba(251,113,133,.12);color:#ffe4e6}.hds-card.ck .ask b{color:#fda4af}",
  ".hds-card.ck .gr{margin-top:12px}.hds .hd-g svg{height:56px;background:rgba(255,255,255,.05)}.hds .hd-g .tk{color:rgba(255,255,255,.5);font-size:13px;height:18px}.hds .hd-g .cur{background:#fff;height:56px}.hds .hd-g .tip{font-size:15px}",
  ".hds-goals{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start;max-height:810px;overflow:auto;padding-right:6px}",
  ".hds-goal{display:grid;grid-template-columns:118px 1fr;gap:12px;align-items:start;padding:14px 16px;border-radius:20px;background:rgba(16,21,38,.82);border:1px solid rgba(255,255,255,.09)}",
  ".hds-goal.set{border-color:rgba(167,139,250,.6);background:rgba(167,139,250,.1)}",
  ".hds-goal .who{display:flex;flex-direction:column;align-items:flex-start;gap:6px}.hds-goal .nm{font-size:22px;font-weight:900;line-height:1.1}",
  ".hds-goal input{font-size:19px;padding:10px 13px}",
  ".hds-goal .ideas{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.hds-goal .ideas button{font:inherit;font-size:14.5px;font-weight:700;color:rgba(255,255,255,.85);background:rgba(255,255,255,.07);border:1px dashed rgba(255,255,255,.25);border-radius:999px;padding:6px 12px;cursor:pointer}",
  ".hds-goal .ideas button:hover{background:rgba(167,139,250,.25);border-style:solid}",
  ".hds-foot{position:absolute;left:0;right:0;bottom:0;height:128px;display:flex;align-items:center;gap:30px;padding:0 64px;z-index:3;background:linear-gradient(0deg,rgba(5,7,15,.9),rgba(5,7,15,0))}",
  ".hds-say{flex:1;font-size:22px;line-height:1.35;color:rgba(255,255,255,.85);display:flex;gap:14px;align-items:flex-start;max-height:92px;overflow:hidden}",
  ".hds-say b{flex:none;font-size:15px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:6px 11px;border-radius:9px;margin-top:2px}",
  ".hds-clock{text-align:right;min-width:210px}.hds-clock .s{font-size:46px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}.hds-clock .s.over{color:#fbbf24}.hds-clock .t{font-size:16px;color:rgba(255,255,255,.55);font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums}",
  ".hds-clock .b{height:5px;border-radius:4px;background:rgba(255,255,255,.12);margin-top:8px;overflow:hidden}.hds-clock .b i{display:block;height:100%;transition:width 1s linear}",
  ".hds-nav{display:flex;gap:10px}",
  ".hds-x{position:absolute;top:30px;right:22px;z-index:4;display:none}"
  ].join("\n");
  document.head.appendChild(st);
}
function hsave(o){ o.action="huddle_save"; o.huddle=S.H; o.shift=S.shift;
  return post(o).then(function(r){ if(!r||!r.ok){ toast("Couldn't save — "+((r&&(r.message||r.error))||"try again")); return null; } return r; }).catch(function(){ toast("Couldn't save — check the connection."); return null; }); }
/* keep every loaded report in step with what the huddle changed */
function eachRep(fn){ var D=(S.state&&S.state.dates)||(S.item&&S.item.dates)||datesOf(S.H); Object.keys(S.reps).forEach(function(k){ var p=k.split("|"); if(p[1]===S.shift && D.indexOf(p[0])>=0) fn(S.reps[k]); }); fn(SH.R); }
function show(){
  var R=S._R; if(!R) return; showCss();
  R=JSON.parse(JSON.stringify(R));
  SH={ R:R, L:null, i:0, t0:Date.now(), spent:{}, cur:"", enter:Date.now(), tick:null };
  SH.L=showList(R);
  var o=document.createElement("div"); o.className="hds"; o.innerHTML='<div class="hds-st"><div class="hds-bl a"></div><div class="hds-bl b"></div><div class="hds-grid"></div><div class="hds-ghost"></div><div class="hds-top"></div><div class="hds-body"></div><div class="hds-foot"></div></div>';
  document.body.appendChild(o); document.body.classList.add("hd-noscroll"); SH.el=o; SH.st=$(".hds-st",o);
  function fit(){ var k=Math.min(window.innerWidth/1920, window.innerHeight/1080); SH.st.style.transform="translate(-50%,-50%) scale("+k+")"; }
  fit(); window.addEventListener("resize", fit); SH.fit=fit;
  function draw(){
    var it=SH.L[SH.i], g=it.g;
    if(SH.cur!==g.k){ if(SH.cur) SH.spent[SH.cur]=(SH.spent[SH.cur]||0)+(Date.now()-SH.enter)/1000; SH.cur=g.k; SH.enter=Date.now(); }
    GR=[]; var b=BUILD[g.k](SH.R, it);
    $(".hds-bl.a",o).style.background=g.c; $(".hds-bl.b",o).style.background=g.k==="open"||g.k==="close"?"#7c3aed":"#4338ca";
    var segs=segsIn(SH.L), idx=segs.filter(function(x){ return x.k!=="open"&&x.k!=="close"; }).indexOf(g);
    $(".hds-ghost",o).textContent=idx>=0?("0"+(idx+1)):"";
    $(".hds-top",o).innerHTML='<img src="logo-aura.svg" alt=""><div class="tt">'+(night()?"Night":"Morning")+' Huddle<span>'+esc(dayLong(S.H))+'</span></div><div class="hds-rail">'+segs.map(function(x){ var on=x===g, done=segs.indexOf(x)<segs.indexOf(g); return '<div class="'+(on?"on":(done?"done":""))+'" style="'+(on?"background:"+x.c+";border-color:"+x.c:"")+'" data-seg="'+x.k+'">'+esc(x.n)+'<i style="background:'+(on?"rgba(0,0,0,.35)":x.c)+';width:'+(done?100:0)+'%"></i></div>'; }).join("")+'</div>';
    $(".hds-body",o).innerHTML='<div class="hds-sl">'+b.h+'</div>';
    $(".hds-foot",o).innerHTML='<div class="hds-say"><b style="background:'+hx(g.c,.2)+';color:'+g.c+'">Say</b><span>'+esc(b.say||"")+'</span></div><div class="hds-clock"><div class="s"></div><div class="t"></div><div class="b"><i style="background:'+g.c+'"></i></div></div><div class="hds-nav"><button data-n="prev"'+(SH.i?"":" disabled")+'>Back</button><button data-n="next">'+(SH.i<SH.L.length-1?"Next":"Finish")+'</button><button data-n="full">Full screen</button><button data-n="exit">Exit</button></div>';
    bindGraphs(o); $$("[data-goal]",o).forEach(function(x){ x._sent=x.value; });
    $$("[data-cnt]", o).forEach(function(el){ var v=Number(el.getAttribute("data-cnt"))||0, t0=performance.now(); (function f(t){ var k=Math.min(1,(t-t0)/1100), e=1-Math.pow(1-k,3); el.textContent=fh(v*e).replace(" h"," hours"); if(k<1) requestAnimationFrame(f); })(t0); });
    tick();
  }
  function tick(){
    if(!SH) return; var it=SH.L[SH.i], g=it.g, used=spentOn(g.k), left=g.s-used, tot=(Date.now()-SH.t0)/1000, plan=planSec(SH.L);
    var s=$(".hds-clock .s",o), t=$(".hds-clock .t",o), b=$(".hds-clock .b i",o); if(!s) return;
    s.textContent=left>=0?clk(left):"+"+clk(-left); s.className="s"+(left<0?" over":""); t.textContent=(left>=0?"left for "+g.n.toLowerCase():"over on "+g.n.toLowerCase())+" · "+clk(tot)+" / "+clk(plan);
    b.style.width=Math.min(100, used/g.s*100)+"%";
    var on=$(".hds-rail .on i",o); if(on) on.style.width=Math.min(100, used/g.s*100)+"%";
  }
  SH.tick=setInterval(tick, 1000);
  function go(d){ var n=SH.i+d; if(n<0) return; if(n>=SH.L.length){ exit(); return; } SH.i=n; draw(); }
  function exit(){ clearInterval(SH.tick); window.removeEventListener("resize", SH.fit); document.removeEventListener("keydown", key); o.remove(); document.body.classList.remove("hd-noscroll"); try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} SH=null; render(); }
  function typing(){ var a=document.activeElement; return a && (a.tagName==="INPUT"||a.tagName==="TEXTAREA") && o.contains(a); }
  function key(e){ if(typing()){ if(e.key==="Escape") document.activeElement.blur(); return; }
    if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){ e.preventDefault(); go(1); } else if(e.key==="ArrowLeft"||e.key==="PageUp"){ e.preventDefault(); go(-1); } else if(e.key==="Escape") exit(); else if(e.key==="f"||e.key==="F"){ try{ if(!document.fullscreenElement) o.requestFullscreen(); else document.exitFullscreen(); }catch(_){} } }
  function setGoal(emp, text, kind, task, n){
    text=String(text||"").trim(); var gl={ emp:emp, t:text, k:kind||"custom", task:task||"", n:n||"" };
    eachRep(function(r){ r.goals=(r.goals||[]).filter(function(x){ return x.emp!==emp; }); if(text){ var p=shiftPeople(SH.R).filter(function(q){ return q.id===emp; })[0]||{}; gl.name=p.name; gl.first=p.first; r.goals.push(JSON.parse(JSON.stringify(gl))); } });
    var row=$('[data-goal="'+emp+'"]',o); if(row){ row.closest(".hds-goal").classList.toggle("set", !!text); } var gc=$("[data-gc]",o); if(gc) gc.innerHTML=(SH.R.goals||[]).length+' <span class="hds-dim">/ '+shiftPeople(SH.R).length+'</span>';
    hsave({ op:"goal", emp:emp, text:text, kind:kind||"custom", task:task||"", n:n||"" }).then(function(r){ if(r) toast(text?"Goal saved":"Goal cleared"); });
  }
  o.addEventListener("click", function(e){
    var nb=e.target.closest("[data-n]"); if(nb){ var a=nb.getAttribute("data-n"); if(a==="next") go(1); else if(a==="prev") go(-1); else if(a==="exit") exit(); else if(a==="full"){ try{ if(!document.fullscreenElement) o.requestFullscreen(); else document.exitFullscreen(); }catch(_){} } return; }
    var sg=e.target.closest("[data-seg]"); if(sg){ var k=sg.getAttribute("data-seg"); for(var j=0;j<SH.L.length;j++){ if(SH.L[j].g.k===k){ SH.i=j; draw(); break; } } return; }
    var rv=e.target.closest("[data-rv]"); if(rv){ var emp=rv.getAttribute("data-rv"), v=rv.getAttribute("data-v"), x=(SH.R.review||[]).filter(function(q){ return q.emp===emp; })[0]; if(!x) return; var nv=(x.done===v)?"":v;
      eachRep(function(r){ (r.review||[]).forEach(function(q){ if(q.emp===emp) q.done=nv; }); }); draw(); hsave({ op:"review", of:x.of, emp:emp, done:nv }); return; }
    var ck=e.target.closest("[data-ck]"); if(ck){ var f=SH.R.flags[+ck.getAttribute("data-ck")]; if(!f) return; var st=ck.getAttribute("data-v"); if(f.status===st) st="open";
      eachRep(function(r){ (r.flags||[]).forEach(function(q){ if(q.id===f.id) q.status=st; }); }); draw(); hsave({ op:"check", flag_id:f.id, status:st }); return; }
    var id=e.target.closest("[data-idea]"); if(id){ var em=id.getAttribute("data-idea"), inp=$('[data-goal="'+em+'"]',o); if(inp){ inp.value=id.getAttribute("data-t"); inp.setAttribute("data-kind", id.getAttribute("data-k")); inp.setAttribute("data-task", id.getAttribute("data-task")||""); inp.setAttribute("data-n", id.getAttribute("data-n")||""); inp._sent=inp.value; }
      setGoal(em, id.getAttribute("data-t"), id.getAttribute("data-k"), id.getAttribute("data-task"), id.getAttribute("data-n")); return; }
  });
  o.addEventListener("input", function(e){ var t=e.target; if(t.hasAttribute && t.hasAttribute("data-goal")){ var chosen=$$('[data-idea="'+t.getAttribute("data-goal")+'"]',o).filter(function(b){ return b.getAttribute("data-t")===t.value; })[0]; if(!chosen){ t.setAttribute("data-kind","custom"); t.setAttribute("data-task",""); t.setAttribute("data-n",""); } } });
  function commit(t){
    if(t.hasAttribute("data-goal")){ if(t._sent===t.value) return; t._sent=t.value; setGoal(t.getAttribute("data-goal"), t.value, t.getAttribute("data-kind"), t.getAttribute("data-task"), t.getAttribute("data-n")); }
    else if(t.hasAttribute("data-talk")){ var sg=t.getAttribute("data-talk"), v=String(t.value||"").trim(); if(((SH.R.talk||{})[sg]||"")===v) return; eachRep(function(r){ r.talk=r.talk||{}; r.talk[sg]=v; }); hsave({ op:"talk", seg:sg, text:v }).then(function(r){ if(r) toast("Saved"); }); }
  }
  o.addEventListener("focusout", function(e){ var t=e.target; if(t.hasAttribute && (t.hasAttribute("data-goal")||t.hasAttribute("data-talk"))) commit(t); });
  o.addEventListener("keydown", function(e){ var t=e.target; if(e.key==="Enter" && t.hasAttribute && t.hasAttribute("data-goal")){ e.preventDefault(); commit(t); var all=$$("[data-goal]",o), nx=all[all.indexOf(t)+1]; if(nx) nx.focus(); else t.blur(); } });
  document.addEventListener("keydown", key);
  draw();
}

/* ── public: owner tab (admin console) ── */
HD.mountOwner=function(el, o){
  css(); o=o||{}; S.api=o.api; S.sess=o.sess||null; S.mode="owner"; S.el=(typeof el==="string")?$(el):el; S.reps={};
  var n=phNow(); S.shift=(n.h>=5 && n.h<15)?"morning":"night"; S.H=huddleDateFor(S.shift);
  if(!(dow(S.H)>=1 && dow(S.H)<=5)){ var d=S.H, g=0; while(!(dow(d)>=1&&dow(d)<=5) && g++<3) d=addD(d,-1); S.H=d; }
  if(!S.el._hd){ S.el._hd=1; S.el.addEventListener("click", onClick); S.el.addEventListener("change", onChange); S.el.addEventListener("focusout", onBlur); }
  load();
};
HD.refresh=function(){ if(S.el && S.mode==="owner") load(); };

/* ── public: presenter overlay (portal) ── */
var OV=null;
function closeOverlay(){ if(OV){ OV.remove(); OV=null; document.body.classList.remove("hd-noscroll"); } }
HD.openPresenter=function(item, o){
  css(); o=o||{}; S.api=o.api||S.api; S.sess=o.sess||S.sess; S.mode="presenter"; S.item=item; S.state=null; S.shift=item.shift; S.H=item.huddle_date; S.reps={}; S.day="all"; S.tab="overview";
  closeOverlay(); OV=document.createElement("div"); OV.className="hd-ov"; OV.innerHTML='<div class="box"></div>'; document.body.appendChild(OV); document.body.classList.add("hd-noscroll");
  S.el=$(".box", OV); S.el.addEventListener("click", onClick); OV.addEventListener("click", function(e){ if(e.target===OV) closeOverlay(); });
  load();
};

/* ── public: portal banner ── */
var B={ api:"", me:null, items:[], timer:null, last:0 };
function banner(){
  var host=document.getElementById("tab-overview"); if(!host) return; var el=document.getElementById("hd-banner");
  var n=phNow(), show=B.items.filter(function(it){ if(!it.presenter) return false; var end=it.at.split(":"), endMin=(parseInt(end[0],10)||0)*60+(parseInt(end[1],10)||0)+120, nowMin=n.h*60+n.m; var dayOk=(it.huddle_date===n.d)||(it.shift==="night" && it.huddle_date===addD(n.d,-1)); if(it.shift==="night" && it.huddle_date===addD(n.d,-1)) nowMin+=1440; return dayOk && nowMin<=endMin; });
  if(!show.length){ if(el) el.remove(); return; }
  var it=show.filter(function(x){ return x.me; })[0]||show[0];
  if(!el){ el=document.createElement("div"); el.id="hd-banner"; host.insertBefore(el, host.firstChild); el.addEventListener("click", function(e){ var b=e.target.closest("[data-hb]"); if(!b) return; var x=B.items.filter(function(y){ return y.shift===b.getAttribute("data-hb"); })[0]; if(x) HD.openPresenter(x, { api:B.api }); }); }
  css();
  var cov=it.dates.length>1?dayLbl(it.dates[0])+" – "+dayLbl(it.dates[it.dates.length-1]):dayLbl(it.dates[0]);
  el.className="hd-ban"+(it.me?" me":"");
  el.innerHTML=it.me?avatar(it.presenter,it.presenter_name,40)+'<div><div class="t">You\'re presenting the '+esc(it.shift)+' huddle at '+esc(t12(it.at))+'</div><div class="s">Covering '+esc(cov)+'. Open it on the office screen and press Start the huddle — every slide shows what to say.</div></div><button class="hd-btn" data-hb="'+esc(it.shift)+'">Open the huddle</button>'
    :avatar(it.presenter,it.presenter_name,34)+'<div><div class="t">'+(it.shift==="night"?"Night":"Morning")+' huddle at '+esc(t12(it.at))+' · '+esc(it.presenter_first||it.presenter_name)+' presents</div><div class="s">Covering '+esc(cov)+'. We start with: did we do it? Bring your goal for the shift.</div></div>';
  if(it.me && /#huddle/.test(location.hash||"") && !B.opened){ B.opened=1; HD.openPresenter(it, { api:B.api }); }
}
function poll(){
  if(!B.me) return; B.last=Date.now();
  get({ action:"huddle_my", employee_id:B.me.employee_id }).then(function(r){ if(!r||!r.ok) return; var before=B.items.map(function(x){ return x.shift+x.presenter; }).join(); B.items=r.items||[];
    if(before && before!==B.items.map(function(x){ return x.shift+x.presenter; }).join()){ var mine=B.items.filter(function(x){ return x.me; })[0]; if(mine){ try{ (window.showToast||toast)("You're presenting the "+mine.shift+" huddle — open the report from your dashboard."); }catch(e){} } }
    banner(); schedule(); }).catch(function(){ schedule(true); });
}
function schedule(err){
  clearTimeout(B.timer); var n=phNow(), nowMin=n.h*60+n.m, wait=null;
  B.items.forEach(function(it){ var p=it.pick.split(":"), a=it.at.split(":"), pm=(+p[0])*60+(+p[1]), am=(+a[0])*60+(+a[1]), nm=nowMin; if(it.shift==="night" && it.huddle_date===addD(n.d,-1)) nm+=1440;
    if(!it.presenter && nm<pm) wait=Math.min(wait==null?1e9:wait, (pm-nm)*60000+45000);
    else if(!it.presenter && nm<=am+90) wait=Math.min(wait==null?1e9:wait, 5*60000);
    else if(it.presenter && nm<=am+120) wait=Math.min(wait==null?1e9:wait, 15*60000); });
  if(wait==null) wait=err?10*60000:45*60000;
  B.timer=setTimeout(poll, Math.max(30000, Math.min(wait, 3*3600000)));
}
HD.bootPortal=function(o){
  B.api=o.api; B.me=o.me; S.api=S.api||o.api; poll();
  document.addEventListener("visibilitychange", function(){ if(!document.hidden && Date.now()-B.last>5*60000) poll(); });
  setInterval(banner, 60000);
};
HD._t={ merge:merge, showList:showList, show:show, css:css, S:S, B:B, render:render, banner:banner, BUILD:BUILD };
})();
