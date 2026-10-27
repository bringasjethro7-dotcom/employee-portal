/* ═══ DAILY HUDDLE (Oct 27, 2026) — shared by the admin console (owner) and the portal (the day's presenter) ═══
   One report per shift of the last business day (Monday = Fri–Sun): team / project / person hours, how each person
   made them (tasks + tool outputs), the per-minute activity graph with the tool lane, and the questions the tools
   raised. Owner: notes per question, re-pick the presenter, settings. Presenter: read-only + "Start presenting".
   Backend: huddle_state / huddle_report / huddle_pick / huddle_note / huddle_cfg_set / huddle_my (build 2026-10-27b). */
(function(){
"use strict";
if(window.JMBHuddle) return;
var HD = window.JMBHuddle = { v:"2026-10-27b" };
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
function initials(n){ n=String(n||"").replace(/,/g," ").trim(); var p=n.split(/\s+/).filter(Boolean); if(String(n).indexOf(",")<0) return ((p[0]||"?")[0]+((p[1]||"")[0]||"")).toUpperCase(); return ((p[1]||p[0]||"?")[0]+(p[0]||"")[0]).toUpperCase(); }
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
  ".hd-show .stage{flex:1;overflow:auto;padding:10px 6vw 30px;display:flex;flex-direction:column;justify-content:center}",
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
  "body.hd-noscroll{overflow:hidden}"
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
    '<div class="hd-kpi"><div class="l">Engaged</div><div class="v">'+(t.eng_pct!=null?t.eng_pct+"%":"—")+'</div><div class="s">timed minutes with activity or tool work</div></div>'+
    '<div class="hd-kpi"><div class="l">Tool matched</div><div class="v">'+(t.tool_pct!=null?t.tool_pct+"%":"—")+'</div><div class="s">tool work while the timer ran</div></div>'+
    '<div class="hd-kpi"><div class="l">Questions</div><div class="v">'+t.flags+'</div><div class="s">'+(t.high?'<span class="hd-dn">'+t.high+' high</span> · ':"")+(t.manual_h>0?fh(t.manual_h)+' added without timer':'from the tools')+'</div></div>'+
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
  if(!R.flags.length) return '<div class="hd-card hd-empty">Nothing looks off — no questions from the tools for this shift.</div>';
  return R.flags.map(function(f,i){ return flagCard(R,f,i); }).join("");
}
function winsView(R){
  if(!R.wins.length) return '<div class="hd-card hd-empty">No standouts this time.</div>';
  return '<div class="hd-card">'+R.wins.map(function(w){ return '<div class="hd-win"><div class="ic">'+(w.kind==="pace"?"1":(w.kind==="focus"?"A":"OK"))+'</div><div><div style="font-weight:800">'+esc(w.title)+(w.first?' — '+esc(w.first):"")+(R.multi?' <span class="hd-sub">· '+esc(dayLbl(w.date))+'</span>':"")+'</div><div class="hd-sub">'+esc(w.detail)+'</div></div></div>'; }).join("")+'</div>';
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
    '<button class="hd-btn pri" data-a="present"'+(R?"":" disabled")+'>Start presenting</button></div></div>';
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
    var tabs='<div class="hd-tabs">'+[["overview","Overview"],["people","People"],["questions","Questions"+(fc?'<span class="hd-cnt">'+fc+'</span>':"")],["wins","Wins"]].map(function(t){ return '<button class="'+(S.tab===t[0]?"on":"")+'" data-a="tab" data-v="'+t[0]+'">'+t[1]+'</button>'; }).join("")+'</div>';
    var inner="";
    if(S.tab==="overview") inner='<div class="hd-st" style="margin:4px 0 8px">Hours by project</div>'+projectsView(R)+
        (R.flags.length?'<div class="hd-st" style="margin:16px 0 8px">Top questions</div>'+R.flags.slice(0,3).map(function(f,i){ return flagCard(R,f,i); }).join("")+(R.flags.length>3?'<button class="hd-btn sm" data-a="tab" data-v="questions">See all '+R.flags.length+'</button>':""):"")+
        (R.wins.length?'<div class="hd-st" style="margin:16px 0 8px">Wins</div>'+winsView(R):"");
    else if(S.tab==="people") inner=peopleView(R);
    else if(S.tab==="questions") inner=flagsView(R);
    else inner=winsView(R);
    body=kpis(R)+tabs+inner;
  }
  S.el.innerHTML='<div class="hd">'+head+pres+days+body+'</div>';
  S._R=R; bindGraphs(S.el); countUp(S.el);
}
function countUp(root){ $$("[data-count]", root).forEach(function(el){ var v=Number(el.getAttribute("data-count"))||0, t0=performance.now(), d=700; if(el._c) return; el._c=1;
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
  }).then(function(){ if(S._tag===tag) render(); }).catch(function(e){ if(S._tag!==tag) return; S.err=String(e&&e.message||e); if(/UNAUTHORIZED/.test(S.err)) S.err="Only the owner and today's presenter can open this report."; render(); });
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
  else if(a==="present"){ present(); }
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

/* ── presentation mode ── */
function slides(R){
  var L=[], sh=S.shift==="night"?"Night":"Morning", pres=(S.state&&S.state.shifts&&S.state.shifts[S.shift])||S.item||{}, dates=R.dates;
  var cover=dates.length>1?dayLbl(dates[0])+" – "+dayLbl(dates[dates.length-1]):dayLong(dates[0]);
  L.push('<div class="k">'+sh+' huddle · '+esc(dayLong(S.H))+'</div><h2>How did the '+sh.toLowerCase()+' shift go?</h2><div class="lead">Covering '+esc(cover)+'</div>'+(pres.presenter?'<div class="who" style="margin-top:34px">'+avatar(pres.presenter, pres.presenter_name, 76)+'<div><div class="k" style="color:rgba(255,255,255,.6)">Presented by</div><div style="font-size:30px;font-weight:800">'+esc(pres.presenter_name)+'</div></div></div>':""));
  var t=R.team, vs=(t.usual_h>0)?Math.round((t.hours-t.usual_h)/t.usual_h*100):null;
  L.push('<div class="k">The numbers</div><div class="num" data-cnt="'+t.hours+'">'+fh(t.hours)+'</div><div class="lead">tracked by '+t.vas+' VA'+(t.vas===1?"":"s")+(vs!=null?' · '+(vs>=0?"+":"")+vs+'% vs their usual':"")+'</div>'+
    '<div class="row"><div class="tile"><div class="l">Average per VA</div><div class="v">'+fh(t.avg_h)+'</div></div><div class="tile"><div class="l">Engaged</div><div class="v">'+(t.eng_pct!=null?t.eng_pct+"%":"—")+'</div></div><div class="tile"><div class="l">Tool matched</div><div class="v">'+(t.tool_pct!=null?t.tool_pct+"%":"—")+'</div></div><div class="tile"><div class="l">Questions</div><div class="v">'+t.flags+'</div></div></div>'+
    (t.perday?'<div class="row">'+t.perday.map(function(x){ return '<div class="tile"><div class="l">'+esc(dayLbl(x.date))+'</div><div class="v">'+fh(x.hours)+'</div><div style="color:rgba(255,255,255,.6)">'+x.vas+' VAs</div></div>'; }).join("")+'</div>':""));
  if(R.projects.length){ var mx=Math.max.apply(null,R.projects.map(function(p){ return p.hours; }).concat([1]));
    L.push('<div class="k">Where the hours went</div><h2>By project</h2>'+R.projects.map(function(p,i){ return '<div class="pjr"><div><b>'+esc(p.project)+'</b><div style="font-size:13px;color:rgba(255,255,255,.6)">'+p.vas+' VA'+(p.vas===1?"":"s")+' · '+p.tasks.slice(0,3).map(function(x){ return esc(x.task)+(x.volume>0?" ("+r1(x.volume)+")":""); }).join(", ")+'</div></div><div class="b"><i style="width:'+(p.hours/mx*100)+'%;background:'+PCOL[i%PCOL.length]+'"></i></div><div class="h">'+fh(p.hours)+'</div></div>'; }).join("")); }
  R.people.forEach(function(p){
    var fl=R.flags.filter(function(f){ return f.emp===p.id; });
    var tbl='<table><tr><th>Task</th><th class="n">Hours</th><th class="n">Output</th><th class="n">Rate</th></tr>'+p.tasks.map(function(x){ return '<tr><td>'+esc(x.task)+'</td><td class="n">'+fh(x.hours)+'</td><td class="n">'+(x.volume>0?r1(x.volume):"—")+'</td><td class="n">'+(x.qph?x.qph+"/h":"—")+'</td></tr>'; }).join("")+'</table>';
    var gr=(p.days||[]).map(function(d){ return ((p.days.length>1)?'<div class="k" style="margin-top:12px;color:rgba(255,255,255,.6)">'+esc(dayLbl(d.date))+'</div>':"")+graph(d,p); }).join("")+legend();
    var qs=fl.length?fl.map(function(f){ var idx=R.flags.indexOf(f), done=(f.status==="explained"||f.status==="dismissed");
        return '<div class="q'+(done?" done":"")+'"><div class="t">'+esc(f.title)+'</div><div class="a">Ask '+esc(p.first)+': '+esc(String(f.q).indexOf(p.first+", ")===0?String(f.q).slice(p.first.length+2):String(f.q))+'</div>'+(S.mode==="owner"?'<div class="acts"><button data-sfs="explained" data-sfi="'+idx+'">Explained</button><button data-sfs="follow" data-sfi="'+idx+'">Follow up</button><button data-sfs="dismissed" data-sfi="'+idx+'">Not an issue</button></div>':"")+'</div>'; }).join("")
      :'<div class="q" style="border-left-color:#16a34a"><div class="t">Nothing to ask — clean shift.</div></div>';
    L.push('<div class="who">'+avatar(p.id,p.name,64)+'<div><div class="k">'+esc(p.id)+((p.days||[]).length===1&&p.time_in?' · in '+esc(p.time_in)+(p.time_out?' · out '+esc(p.time_out):""):"")+'</div><div style="font-size:clamp(26px,3.2vw,42px);font-weight:800;letter-spacing:-.02em">'+esc(p.name)+'</div></div><div style="margin-left:auto;text-align:right"><div style="font-size:48px;font-weight:900;letter-spacing:-.03em">'+fh(p.hours)+'</div><div style="color:rgba(255,255,255,.6)">engaged '+(p.eng_pct!=null?p.eng_pct+"%":"—")+'</div></div></div>'+
      gr+'<div class="two"><div>'+tbl+'</div><div>'+qs+'</div></div>');
  });
  var open=R.flags.filter(function(f){ return f.status!=="explained" && f.status!=="dismissed"; });
  if(open.length) L.push('<div class="k">Before we close</div><h2>Open questions</h2>'+open.slice(0,8).map(function(f){ return '<div class="q"><div class="t">'+esc(f.name)+' — '+esc(f.title)+'</div><div class="a">'+esc(f.q)+'</div></div>'; }).join("")+(open.length>8?'<div class="lead">+'+(open.length-8)+' more in the report</div>':""));
  if(R.wins.length) L.push('<div class="k">Shout-outs</div><h2>Wins</h2><div class="wins">'+R.wins.map(function(w){ return '<div class="w"><div class="ic">'+(w.kind==="pace"?"1":(w.kind==="focus"?"A":"OK"))+'</div><div><b>'+esc(w.title)+(w.first?" — "+esc(w.first):"")+'</b><div style="color:rgba(255,255,255,.65);font-size:16px">'+esc(w.detail)+'</div></div></div>'; }).join("")+'</div>');
  L.push('<div class="k">That\'s the huddle</div><h2>Let\'s have a great shift.</h2><div class="lead">Questions answered today are saved with the report.</div>');
  return L;
}
function present(){
  var R=S._R; if(!R) return; var L=slides(R), i=0;
  var o=document.createElement("div"); o.className="hd-show"; document.body.appendChild(o); document.body.classList.add("hd-noscroll");
  function draw(){ GR=[]; o.innerHTML='<div class="bar"><i style="width:'+((i+1)/L.length*100)+'%"></i></div><div class="hdr"><img src="logo-aura.svg" alt="">Daily Huddle · '+(S.shift==="night"?"Night":"Morning")+'<div class="x"><button data-p="full">Full screen</button><button data-p="exit">Exit</button></div></div><div class="stage"><div class="sl">'+L[i]+'</div></div><div class="nav"><button data-p="prev"'+(i?"":" disabled")+'>Back</button><span>'+(i+1)+' / '+L.length+' · arrow keys to move</span><button data-p="next">'+(i<L.length-1?"Next":"Finish")+'</button></div>';
    bindGraphs(o); $$("[data-cnt]", o).forEach(function(el){ var v=Number(el.getAttribute("data-cnt"))||0, t0=performance.now(); (function f(t){ var k=Math.min(1,(t-t0)/900), e=1-Math.pow(1-k,3); el.textContent=fh(v*e); if(k<1) requestAnimationFrame(f); })(t0); }); }
  function go(d){ i=Math.max(0, Math.min(L.length-1, i+d)); draw(); }
  function exit(){ document.removeEventListener("keydown", key); o.remove(); document.body.classList.remove("hd-noscroll"); try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} render(); }
  function key(e){ if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){ e.preventDefault(); if(i<L.length-1) go(1); else exit(); } else if(e.key==="ArrowLeft"||e.key==="PageUp"){ e.preventDefault(); go(-1); } else if(e.key==="Escape") exit(); }
  o.addEventListener("click", function(e){ var b=e.target.closest("[data-p],[data-sfs]"); if(!b) return;
    if(b.hasAttribute("data-sfs")){ var f=R.flags[+b.getAttribute("data-sfi")]; if(f){ saveNote(f, b.getAttribute("data-sfs"), f.note||""); f.status=b.getAttribute("data-sfs"); L=slides(R); draw(); } return; }
    var a=b.getAttribute("data-p"); if(a==="next"){ if(i<L.length-1) go(1); else exit(); } else if(a==="prev") go(-1); else if(a==="exit") exit(); else if(a==="full"){ try{ if(!document.fullscreenElement) o.requestFullscreen(); else document.exitFullscreen(); }catch(_){} } });
  document.addEventListener("keydown", key); draw();
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
  el.innerHTML=it.me?avatar(it.presenter,it.presenter_name,40)+'<div><div class="t">You\'re presenting the '+esc(it.shift)+' huddle at '+esc(t12(it.at))+'</div><div class="s">Walk the team through '+esc(cov)+': hours, projects, each person\'s work and the questions from the tools.</div></div><button class="hd-btn" data-hb="'+esc(it.shift)+'">Open the report</button>'
    :avatar(it.presenter,it.presenter_name,34)+'<div><div class="t">'+(it.shift==="night"?"Night":"Morning")+' huddle at '+esc(t12(it.at))+' · '+esc(it.presenter_first||it.presenter_name)+' presents</div><div class="s">Covering '+esc(cov)+' — be ready to talk about your hours and any questions.</div></div>';
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
HD._t={ merge:merge, slides:slides, S:S, B:B, render:render, banner:banner };
})();
