/* Call Coach (Nov 14, Jeth) — live English help during client calls.
   The VA shares the call (Meet tab, or the screen with system audio for Zoom / Teams / Telegram desktop).
   The client's voice goes to Deepgram (live captions); when the client stops talking, Claude writes the
   exact line to say (SAY) plus two options (ALT). The VA's own mic is heard with the browser's free speech
   recognition so the coach knows what was already said. Nothing from the call is saved.
   Backend: Supabase edge function `call-coach` (op=access · start · reply). Owner trial: JMBEAST / ADMIN. */
(function(){
  'use strict';
  if (window.__CC__) return; window.__CC__ = 1;
  var TRIAL = /^[A-Z0-9_-]{2,24}$/;         // Nov 14 (Jeth): open to every VA (the server keeps the real list: call_coach_access)
  var FN = (typeof SUPA_URL !== 'undefined' ? SUPA_URL : 'https://rvyrnkjqxnijxydloujk.supabase.co') + '/functions/v1/call-coach';
  var KEY = (typeof SUPA_KEY !== 'undefined') ? SUPA_KEY : '';
  var DG_URL = 'wss://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&punctuate=true&interim_results=true&endpointing=350&utterance_end_ms=1000&vad_events=true';
  var QUICK = ['Sorry, could you say that again, please?', 'Yes, I understand.', 'Give me a second, please.', 'Let me check and send it in the chat right after this call.', 'Thank you, I will get that done.'];

  function sess(){ try { return (typeof JMB_SESS !== 'undefined' && JMB_SESS) || sessionStorage.getItem('jmb_sess') || ''; } catch(e){ return ''; } }
  function sessEmp(){ var t = sess(), i = t.lastIndexOf('.'); if (i < 1) return '';
    try { var b = t.slice(0, i).replace(/-/g,'+').replace(/_/g,'/'); while (b.length % 4) b += '='; var pl = atob(b); return pl.slice(0, pl.lastIndexOf('.')).toUpperCase(); } catch(e){ return ''; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function call(body, signal){
    body.sess = sess();
    return fetch(FN, { method:'POST', signal:signal, headers:{ 'Content-Type':'application/json', apikey:KEY, Authorization:'Bearer ' + KEY }, body:JSON.stringify(body) });
  }

  var S = { on:false, ctx:'', notes:'', turns:[], buf:'', interim:'', ws:null, rec:null, disp:null, sr:null, srOn:false, ka:null,
            abort:null, say:'', alts:[], busy:false, pip:null, deb:null, err:'', listening:false, mic:true };

  /* ── styles ── */
  var CSS = '' +
  'html body #cc-fab{position:relative;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;border:1px solid rgba(91,64,56,.12);background:#FFF1E8;color:#D9601F;cursor:pointer;padding:0;box-shadow:0 1px 2px rgba(91,64,56,.05),0 8px 18px -12px rgba(91,64,56,.25);transition:box-shadow .25s ease,border-color .25s ease,background .25s ease}' +
  'html body #cc-fab:hover{border-color:#FFC8A6;box-shadow:0 12px 24px -12px rgba(242,101,42,.45)}' +
  'html body #cc-fab svg{width:20px;height:20px}' +
  'html body #cc-fab.live{background:#E3F6EC;color:#1E8A5B;border-color:#BFE8D2}' +
  'html body #cc-fab.live::after{content:"";position:absolute;top:2px;right:2px;width:9px;height:9px;border-radius:50%;background:#22a06b;box-shadow:0 0 0 2px #fff}' +
  'html body.jp-night #cc-fab{background:rgba(255,154,90,.14);color:#FFB37E;border-color:rgba(255,255,255,.08)}' +
  '#cc-fab.float{position:fixed;left:18px;bottom:18px;z-index:9998}' +
  '#cc-panel{position:fixed;top:16px;right:16px;bottom:16px;width:min(460px,calc(100vw - 32px));z-index:9999;display:none;flex-direction:column;background:#fffaf6;color:#2a1d16;border-radius:22px;box-shadow:0 24px 60px rgba(60,30,10,.25),0 0 0 1px rgba(242,101,42,.12);font:14px/1.45 Poppins,system-ui,sans-serif;overflow:hidden}' +
  '#cc-panel.open{display:flex}' +
  'body.cc-pip #cc-panel{position:static;display:flex;width:auto;height:100vh;border-radius:0;box-shadow:none}' +
  '.cc-hd{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f3e3d6;background:#fff}' +
  '.cc-hd b{font-size:15px;flex:1}.cc-dot{width:9px;height:9px;border-radius:50%;background:#c9b8ab}.cc-dot.on{background:#22a06b;box-shadow:0 0 0 4px rgba(34,160,107,.15)}' +
  '.cc-st{font-size:11.5px;color:#8a7466;margin-right:4px}' +
  '.cc-ib{border:0;background:#f6ece4;color:#5a4334;border-radius:10px;padding:7px 10px;font:600 12px/1 inherit;cursor:pointer}' +
  '.cc-bd{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px}' +
  '.cc-say{background:#fff;border-radius:18px;padding:16px 18px;box-shadow:0 2px 0 #f3e3d6,0 0 0 1.5px #ffd2b3 inset}' +
  '.cc-say small,.cc-cap small,.cc-sec small{display:block;font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e2601e;margin-bottom:6px}' +
  '.cc-say .t{font-size:24px;line-height:1.35;font-weight:600;color:#1f140e;min-height:64px}' +
  '.cc-say .t.wait{color:#b9a597;font-weight:500;font-size:18px}' +
  '.cc-alts{display:flex;flex-direction:column;gap:8px}' +
  '.cc-alt{border:0;text-align:left;background:#fff3ea;color:#3b2a20;border-radius:14px;padding:10px 13px;font:500 15px/1.4 inherit;cursor:pointer}' +
  '.cc-alt:hover{background:#ffe7d6}' +
  '.cc-cap{background:#f4f0ff;border-radius:14px;padding:11px 13px;font-size:14.5px;color:#3a2f55}.cc-cap small{color:#7a62c9}.cc-cap i{color:#8d81ad}' +
  '.cc-q{display:flex;flex-wrap:wrap;gap:6px}.cc-q button{border:0;background:#eef6f1;color:#1f5a40;border-radius:999px;padding:7px 11px;font:500 12.5px/1.2 inherit;cursor:pointer}' +
  '.cc-row{display:flex;gap:8px}.cc-row input,.cc-sec textarea{flex:1;border:1px solid #ecdccf;border-radius:12px;padding:10px 12px;font:14px/1.4 inherit;background:#fff;color:#2a1d16;outline:none}' +
  '.cc-sec textarea{width:100%;box-sizing:border-box;min-height:64px;resize:vertical}' +
  '.cc-btn{border:0;border-radius:12px;padding:11px 14px;font:700 13.5px/1 inherit;cursor:pointer;background:linear-gradient(135deg,#ff9a5a,#f2652a);color:#fff}' +
  '.cc-btn.sec{background:#f6ece4;color:#5a4334}.cc-btn.red{background:#fde8e6;color:#b4392b}' +
  '.cc-help{font-size:12.5px;color:#7d6658;background:#fff;border-radius:14px;padding:12px 14px;border:1px dashed #f0d9c8}.cc-help ol{margin:6px 0 0 18px;padding:0}' +
  '.cc-err{font-size:12.5px;color:#a33a22;background:#fff0ec;border-radius:12px;padding:9px 12px}' +
  '.cc-log{font-size:12.5px;color:#6d5a4e;max-height:180px;overflow:auto}.cc-log p{margin:0 0 6px}.cc-log b{color:#e2601e}.cc-log b.va{color:#22a06b}' +
  '.cc-ft{padding:12px 16px;border-top:1px solid #f3e3d6;background:#fff;display:flex;gap:8px}';

  function css(doc){ var s = doc.createElement('style'); s.id = 'cc-style'; s.textContent = CSS; doc.head.appendChild(s); }

  /* ── UI ── */
  var fab, panel;
  function build(){
    css(document);
    fab = document.createElement('button'); fab.id = 'cc-fab'; fab.type = 'button';
    fab.title = 'Call Coach: help with English on client calls'; fab.setAttribute('aria-label', 'Call Coach');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"/><path d="M3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/><path d="M18 17v1a3 3 0 0 1-3 3h-3"/></svg>';
    fab.onclick = function(){ panel.classList.toggle('open'); render(); };
    panel = document.createElement('div'); panel.id = 'cc-panel';
    // Nov 14 (Jeth): the button sits in the top bar, just before Messages; floats bottom-left only if the header isn't there
    var msg = document.getElementById('msg-fab');
    if (msg && msg.parentNode) msg.parentNode.insertBefore(fab, msg); else { fab.classList.add('float'); document.body.appendChild(fab); }
    document.body.appendChild(panel);
    render();
  }
  function $(id){ var d = (S.pip && S.pip.document) || document; return d.getElementById(id); }

  function render(){
    if (!panel) return;
    var hd = '<div class="cc-hd"><span class="cc-dot' + (S.listening ? ' on' : '') + '"></span><b>Call Coach</b>' +
      '<span class="cc-st">' + (S.on ? (S.listening ? 'Listening' : 'Not hearing the call') : 'Ready') + '</span>' +
      (('documentPictureInPicture' in window) && !S.pip ? '<button class="cc-ib" data-a="pip">Pop out</button>' : '') +
      (!S.pip ? '<button class="cc-ib" data-a="close">Close</button>' : '') + '</div>';
    var bd = '';
    if (S.err) bd += '<div class="cc-err">' + esc(S.err) + '</div>';
    if (!S.on){
      bd += '<div class="cc-help"><b>Before the call</b><ol>' +
        '<li>Open the call (Google Meet tab, Zoom, Teams, Telegram...). Wear headphones.</li>' +
        '<li>Press <b>Start</b>. Pick the call: for Meet choose the <b>Chrome tab</b> and turn on <b>Share tab audio</b>. For Zoom, Teams or Telegram on the desktop choose <b>Entire screen</b> and turn on <b>Share system audio</b>.</li>' +
        '<li>When the client talks, read the big orange line out loud. Tap an option below it to use that one instead.</li></ol></div>' +
        '<div class="cc-sec"><small>Notes for this call (optional)</small><textarea id="cc-notes" placeholder="Client name, what you finished today, what you need to ask...">' + esc(S.notes) + '</textarea></div>' +
        '<label style="font-size:13px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="cc-mic"' + (S.mic ? ' checked' : '') + '> Also listen to me (my microphone)</label>';
    } else {
      var waiting = !S.say;
      bd += '<div class="cc-say"><small>Say this</small><div class="t' + (waiting ? ' wait' : '') + '" id="cc-say">' +
        (waiting ? (S.busy ? 'Thinking...' : 'When the client talks, your line will appear here.') : esc(S.say)) + '</div></div>' +
        '<div class="cc-alts" id="cc-alts">' + S.alts.map(function(a, i){ return '<button class="cc-alt" data-alt="' + i + '">' + esc(a) + '</button>'; }).join('') + '</div>' +
        '<div class="cc-cap"><small>Client</small><span id="cc-cap">' + capHtml() + '</span></div>' +
        '<div class="cc-q">' + QUICK.map(function(q, i){ return '<button data-q="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '<div class="cc-row"><input id="cc-type" placeholder="Didn\'t catch it? Type what the client said, press Enter"></div>' +
        '<div class="cc-sec"><small>Call so far</small><div class="cc-log" id="cc-log">' + logHtml() + '</div></div>';
    }
    var ft = S.on
      ? '<button class="cc-btn sec" data-a="again">New answer</button><button class="cc-btn red" data-a="stop" style="margin-left:auto">End call</button>'
      : '<button class="cc-btn" data-a="start" style="flex:1">Start</button>';
    panel.innerHTML = hd + '<div class="cc-bd">' + bd + '</div><div class="cc-ft">' + ft + '</div>';
    panel.onclick = onClick;
    var t = $('cc-type'); if (t) t.onkeydown = function(e){ if (e.key === 'Enter' && t.value.trim()){ S.turns.push({ who:'client', text:t.value.trim() }); t.value = ''; ask(); } };
    var n = $('cc-notes'); if (n) n.oninput = function(){ S.notes = n.value; };
    var m = $('cc-mic'); if (m) m.onchange = function(){ S.mic = m.checked; };
    if (fab) fab.classList.toggle('live', S.on);
  }
  function capHtml(){ var last = ''; for (var i = S.turns.length - 1; i >= 0; i--) if (S.turns[i].who === 'client'){ last = S.turns[i].text; break; }
    return S.buf || S.interim ? esc(S.buf) + ' <i>' + esc(S.interim) + '</i>' : (last ? esc(last) : '<i>Waiting for the client to speak...</i>'); }
  function logHtml(){ return S.turns.slice(-12).map(function(t){ return '<p><b class="' + (t.who === 'va' ? 'va' : '') + '">' + (t.who === 'va' ? 'You' : 'Client') + ':</b> ' + esc(t.text) + '</p>'; }).join('') || '<p>Nothing yet.</p>'; }
  function paintLive(){ var c = $('cc-cap'); if (c) c.innerHTML = capHtml(); var l = $('cc-log'); if (l){ l.innerHTML = logHtml(); l.scrollTop = l.scrollHeight; } }
  function paintSay(){
    var t = $('cc-say'); if (t){ t.className = 't' + (S.say ? '' : ' wait'); t.textContent = S.say || (S.busy ? 'Thinking...' : 'When the client talks, your line will appear here.'); }
    var a = $('cc-alts'); if (a) a.innerHTML = S.alts.map(function(x, i){ return '<button class="cc-alt" data-alt="' + i + '">' + esc(x) + '</button>'; }).join('');
  }

  function onClick(e){
    var b = e.target.closest('[data-a],[data-alt],[data-q]'); if (!b) return;
    if (b.dataset.alt != null){ var i = +b.dataset.alt, x = S.alts[i]; S.alts[i] = S.say; S.say = x; paintSay(); return; }
    if (b.dataset.q != null){ S.say = QUICK[+b.dataset.q]; S.alts = []; paintSay(); if (!S.srOn) S.turns.push({ who:'va', text:S.say }); paintLive(); return; }
    var a = b.dataset.a;
    if (a === 'close') panel.classList.remove('open');
    else if (a === 'start') start();
    else if (a === 'stop') stop();
    else if (a === 'again') ask(true);
    else if (a === 'pip') popOut();
  }

  /* ── start / stop ── */
  async function start(){
    S.err = ''; render();
    var disp;
    try {
      disp = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false }, systemAudio:'include', selfBrowserSurface:'exclude', surfaceSwitching:'include' });
    } catch(e){ S.err = 'You did not share the call. Press Start again and pick the call.'; render(); return; }
    var aud = disp.getAudioTracks();
    disp.getVideoTracks().forEach(function(t){ t.stop(); });
    if (!aud.length){ disp.getTracks().forEach(function(t){ t.stop(); }); S.err = 'No sound was shared. Press Start again and turn on "Share tab audio" (or "Share system audio").'; render(); return; }
    S.disp = disp;
    var r, j;
    try { r = await call({ op:'start' }); j = await r.json(); } catch(e){ j = { ok:false, error:'Could not reach Call Coach. Check your internet.' }; }
    if (!j.ok){ stopTracks(); S.err = j.error || 'Could not start.'; render(); return; }
    S.ctx = j.context || ''; S.on = true; S.turns = []; S.say = ''; S.alts = []; S.buf = ''; S.interim = '';
    if (S.notes) S.notes = S.notes.trim();
    aud[0].onended = function(){ if (S.on){ S.listening = false; S.err = 'The call sharing stopped. End the call and start again to keep listening.'; render(); } };
    if (j.token) openDeepgram(j.token, new MediaStream(aud));
    else { S.err = j.dg_error || 'Listening is not available. You can type what the client said.'; }
    if (S.mic) startMic();
    render();
  }
  function stopTracks(){ try { S.disp && S.disp.getTracks().forEach(function(t){ t.stop(); }); } catch(e){} S.disp = null; }
  function stop(){
    S.on = false; S.listening = false;
    try { S.rec && S.rec.state !== 'inactive' && S.rec.stop(); } catch(e){}
    try { if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify({ type:'CloseStream' })); S.ws && S.ws.close(); } catch(e){}
    clearInterval(S.ka); S.ws = null; S.rec = null;
    stopTracks(); stopMic();
    if (S.abort) try { S.abort.abort(); } catch(e){}
    S.turns = []; S.say = ''; S.alts = []; S.buf = ''; S.interim = ''; S.err = '';   // nothing from the call is kept
    render();
  }

  /* ── hearing the client (Deepgram) ── */
  function openDeepgram(token, stream){
    var ws = new WebSocket(DG_URL, ['bearer', token]); S.ws = ws;
    ws.onopen = function(){
      S.listening = true; render();
      var mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      var rec = new MediaRecorder(stream, { mimeType:mime, audioBitsPerSecond:32000 }); S.rec = rec;
      rec.ondataavailable = function(e){ if (e.data && e.data.size && ws.readyState === 1) ws.send(e.data); };
      rec.start(250);
      S.ka = setInterval(function(){ try { ws.readyState === 1 && ws.send(JSON.stringify({ type:'KeepAlive' })); } catch(e){} }, 8000);
    };
    ws.onmessage = function(ev){
      var m; try { m = JSON.parse(ev.data); } catch(e){ return; }
      if (m.type === 'Results'){
        var txt = (((m.channel || {}).alternatives || [])[0] || {}).transcript || '';
        if (m.is_final){ if (txt) S.buf = (S.buf ? S.buf + ' ' : '') + txt; S.interim = ''; if (m.speech_final) soon(); }
        else S.interim = txt;
        paintLive();
      } else if (m.type === 'UtteranceEnd') soon();
    };
    ws.onclose = function(){ S.listening = false; clearInterval(S.ka); if (S.on){ S.err = 'Lost the connection that hears the client. End the call and start again.'; render(); } };
    ws.onerror = function(){ S.listening = false; };
  }
  function soon(){ clearTimeout(S.deb); S.deb = setTimeout(flush, 220); }
  function flush(){
    var t = S.buf.trim(); if (!t) return;
    var words = t.split(/\s+/).length;
    if (words < 3 && !/\?$/.test(t)) return;          // wait for more than "okay" / "mm"
    S.turns.push({ who:'client', text:t }); S.buf = ''; S.interim = ''; paintLive(); ask();
  }

  /* ── hearing the VA (free browser recognition, mic) ── */
  function startMic(){
    var R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return;
    var sr = new R(); sr.lang = 'en-US'; sr.continuous = true; sr.interimResults = false;
    sr.onresult = function(e){ for (var i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal){ var t = e.results[i][0].transcript.trim(); if (t) S.turns.push({ who:'va', text:t }); } paintLive(); };
    sr.onend = function(){ if (S.on && S.srOn) try { sr.start(); } catch(e){} };
    sr.onerror = function(e){ if (e.error === 'not-allowed'){ S.srOn = false; } };
    S.sr = sr; S.srOn = true; try { sr.start(); } catch(e){}
  }
  function stopMic(){ S.srOn = false; try { S.sr && S.sr.stop(); } catch(e){} S.sr = null; }

  /* ── the answer (streams in) ── */
  async function ask(regen){
    if (!S.on) return;
    if (S.abort) try { S.abort.abort(); } catch(e){}
    var ac = new AbortController(); S.abort = ac;
    S.busy = true; S.say = ''; S.alts = []; paintSay();
    try {
      var r = await call({ op:'reply', turns:S.turns.slice(-14), context:S.ctx, notes:S.notes + (regen ? '\n(Give a different answer from before.)' : '') }, ac.signal);
      if (!r.ok || !r.body){ var j = {}; try { j = await r.json(); } catch(e){} S.err = j.error || 'No answer this time. Use a quick phrase.'; S.busy = false; render(); return; }
      var rd = r.body.getReader(), dec = new TextDecoder(), txt = '';
      for (;;){
        var x = await rd.read(); if (x.done) break;
        txt += dec.decode(x.value, { stream:true }); parse(txt); paintSay();
      }
      parse(txt);
    } catch(e){ if (e.name !== 'AbortError'){ S.err = 'No answer this time. Use a quick phrase.'; render(); } }
    if (S.abort === ac){ S.busy = false; S.abort = null; paintSay(); }
  }
  function parse(txt){
    var say = '', alts = [];
    txt.split('\n').forEach(function(l){ l = l.trim();
      if (/^SAY:/i.test(l)) say = l.replace(/^SAY:\s*/i, '');
      else if (/^ALT:/i.test(l)){ var a = l.replace(/^ALT:\s*/i, ''); if (a) alts.push(a); } });
    if (!say && txt && !/^\s*(SAY|ALT)/i.test(txt)) say = txt.trim();
    S.say = say; S.alts = alts.slice(0, 2);
  }

  /* ── pop out over the call (Chrome's always-on-top mini window) ── */
  async function popOut(){
    try {
      var w = await window.documentPictureInPicture.requestWindow({ width:430, height:620 });
      S.pip = w; css(w.document);
      w.document.body.style.margin = '0'; w.document.body.className = 'cc-pip';
      w.document.body.appendChild(panel); render();
      w.addEventListener('pagehide', function(){ S.pip = null; document.body.appendChild(panel); panel.classList.add('open'); render(); });
    } catch(e){ S.err = 'Pop out is not available in this browser.'; render(); }
  }

  /* ── who gets it ── */
  function boot(){
    var emp = sessEmp(); if (!TRIAL.test(emp)) return;   // trial accounts always see it; setup problems show inside the panel
    build();
  }
  window.CallCoach = { state:S, render:function(){ render(); }, open:function(){ if (panel){ panel.classList.add('open'); render(); } } };
  var tries = 0;
  (function wait(){ if (sess()) return boot(); if (++tries < 40) setTimeout(wait, 3000); })();
})();
