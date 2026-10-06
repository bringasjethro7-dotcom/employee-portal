/* ═══════════════════════════════════════════════════════════════════════════════
   JMB FEED — shared module (Oct 6, 2026)
   One file, three hosts: the portal (index.html), JMB Chat (m.html) and the admin console
   (admin.html, admin mode). Facebook-style: admin posts; everyone reacts, comments, replies;
   images, files, video embeds, polls, quizzes; "must read / must do / quiz" posts that gate the
   time tracker until done — only for the people the post is addressed to.

   Reads: straight from Supabase with the anon key (RLS select-only) + realtime.
   Writes: through the Portal API (a VA's own PIN; the admin password for posting).

   Usage:
     JMBFeed.init({ api, supaUrl, supaKey, me:{employee_id, full_name, pin, client, start_date, career_level, photo},
                    admin:false, pass:()=>adminPassword, mount:'#tab-feed', host:'portal', onBadge:(unread, pending)=>{} });
     JMBFeed.pending()        → posts that still need my action (gate list)
     JMBFeed.allowWork()      → Promise<bool>: true = may start the tracker; false = overlay shown
     JMBFeed.open(postId)     → scroll to / expand a post
   ═══════════════════════════════════════════════════════════════════════════════ */
(function(){
  var C={ api:'', supaUrl:'', supaKey:'', me:null, admin:false, pass:null, mount:null, host:'portal', onBadge:null, headshots:'headshots/', logo:'' };
  var S={ posts:[], mine:{ acks:{}, votes:{}, rx:{} }, comments:{}, open:{}, teams:null, people:null, loaded:false, lastSeen:0, rt:null, poll:null, mounted:false, filter:'all', names:{} };
  var EMOJI=['👍','❤️','🎉','😂','😮','🙏'];
  var $=function(sel, root){ return (root||document).querySelector(sel); };
  var $$=function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };
  function E(x){ return String(x==null?'':x).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function toast(m){ try{ if(typeof window.showToast==='function') return window.showToast(m); }catch(e){} try{ if(typeof window.toast==='function') return window.toast(m); }catch(e){} var t=$('#jf-toast'); if(!t){ t=document.createElement('div'); t.id='jf-toast'; document.body.appendChild(t); } t.textContent=m; t.classList.add('on'); clearTimeout(t._t); t._t=setTimeout(function(){ t.classList.remove('on'); },2600); }
  function me(){ return C.me||{}; }
  function myId(){ return String(me().employee_id||'').toUpperCase(); }
  function ago(iso){ var ms=Date.parse(iso||'')||0; if(!ms) return ''; var m=Math.round((Date.now()-ms)/60000); if(m<1) return 'just now'; if(m<60) return m+'m'; var h=Math.round(m/60); if(h<24) return h+'h'; var d=Math.round(h/24); if(d<7) return d+'d'; return new Date(ms).toLocaleDateString('en-PH',{ month:'short', day:'numeric' }); }
  function when(iso){ var ms=Date.parse(iso||'')||0; return ms?new Date(ms).toLocaleString('en-PH',{ timeZone:'Asia/Manila', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }):''; }
  function initials(n){ return String(n||'?').replace(/[^A-Za-z\s]/g,' ').trim().split(/\s+/).slice(0,2).map(function(w){ return w.charAt(0).toUpperCase(); }).join('')||'?'; }
  function face(id, name, cls){ var e=String(id||'').toUpperCase(); if(e==='ADMIN'||!/^JMB\d{3}$/.test(e)) return '<span class="jf-av '+(cls||'')+'" style="background:linear-gradient(135deg,#ff6b1a,#a855f7)">'+(C.logo?'<img src="'+E(C.logo)+'" alt="">':E(initials(name)))+'</span>'; return '<img class="jf-av '+(cls||'')+'" src="'+E(C.headshots+e+'.jpg')+'" alt="" onerror="this.outerHTML=\'<span class=&quot;jf-av '+(cls||'')+'&quot;>'+E(initials(name))+'</span>\'">'; }
  function isLeadMe(){ var m=String(me().career_level||me().cl||'').match(/\d+/); var r=m?parseInt(m[0],10):0; return r===7||r===8||r===9; }
  function targeted(p){ var a=p.audience||{ type:'all' }; var t=String(a.type||'all'); if(C.admin) return true; if(t==='all') return true;
    if(t==='people') return (a.ids||[]).map(function(x){ return String(x).toUpperCase(); }).indexOf(myId())>=0;
    if(t==='teams'){ if(Array.isArray(a.ids) && a.ids.length) return a.ids.map(function(x){ return String(x).toUpperCase(); }).indexOf(myId())>=0;   // resolved to people when the post was saved
      var c=String(me().client||me().project||'').trim().toLowerCase(); return (a.teams||[]).some(function(x){ x=String(x).trim().toLowerCase(); return x===c || (x==='leads'&&isLeadMe()); }); }
    return true; }
  function audLabel(p){ var a=p.audience||{}; var t=String(a.type||'all'); if(t==='teams') return (a.teams||[]).join(', ')||'Teams'; if(t==='people'){ var ids=a.ids||[]; var nm=ids.map(function(id){ return S.names[String(id).toUpperCase()]||id; }); return nm.length<=3?nm.join(', '):(nm.slice(0,2).join(', ')+' +'+(nm.length-2)); } return 'Everyone'; }
  function reqLabel(r){ return { ack:'Must read', react:'React to confirm', done:'Must do', quiz:'Quiz required' }[r]||''; }
  function myAck(p){ return S.mine.acks[p.id]||null; }
  function doneByMe(p){ var a=myAck(p); return !!(a && a.passed!==false); }
  function needsMe(p){ return p.required && p.required!=='none' && p.required_open!==false && targeted(p) && !doneByMe(p) && afterMyStart(p); }
  function afterMyStart(p){ var sd=String(me().start_date||'').slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(sd)) return true; return String(p.created_at||'').slice(0,10)>=sd; }
  function unreadCount(){ var seen=S.lastSeen; return S.posts.filter(function(p){ return (Date.parse(p.created_at)||0)>seen; }).length; }
  function badge(){ try{ if(C.onBadge) C.onBadge(unreadCount(), pending().length); }catch(e){} }
  function pending(){ return S.posts.filter(needsMe); }

  /* ── transport ───────────────────────────────────────────────────────────── */
  function sb(path){ return fetch(C.supaUrl+'/rest/v1/'+path, { headers:{ apikey:C.supaKey, Authorization:'Bearer '+C.supaKey }, cache:'no-store' }).then(function(r){ if(!r.ok) throw new Error('supabase '+r.status); return r.json(); }); }
  async function post(body, tries){
    tries=tries==null?2:tries;
    var b=Object.assign({}, body);
    if(C.admin){ b.pass=(typeof C.pass==='function')?C.pass():C.pass; } else { b.employee_id=myId(); b.pin=me().pin||me()._pin||''; }
    try{ var r=await fetch(C.api, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify(b) }); var t=await r.text(); var d=JSON.parse(t);
      if(d && d.error==='BUSY' && tries>0){ await new Promise(function(res){ setTimeout(res, 1200); }); return post(body, tries-1); } return d; }
    catch(e){ if(tries>0){ await new Promise(function(res){ setTimeout(res, 900); }); return post(body, tries-1); } return { error:'NETWORK' }; }
  }
  async function loadPosts(){
    var rows=await sb('feed_posts?status=eq.live&order=pinned.desc,created_at.desc&limit=60&select=*');
    S.posts=rows||[];
    if(!C.admin && myId()){
      var q='employee_id=eq.'+encodeURIComponent(myId());
      var acks=await sb('feed_acks?'+q+'&select=post_id,kind,passed,score,attempts,at').catch(function(){ return []; });
      var votes=await sb('feed_votes?'+q+'&select=post_id,option').catch(function(){ return []; });
      var rx=await sb('feed_reactions?'+q+'&select=target_id,emoji').catch(function(){ return []; });
      S.mine.acks={}; acks.forEach(function(a){ S.mine.acks[a.post_id]=a; });
      S.mine.votes={}; votes.forEach(function(v){ S.mine.votes[v.post_id]=v.option; });
      S.mine.rx={}; rx.forEach(function(r){ S.mine.rx[r.target_id]=r.emoji; });
    }
    S.loaded=true; badge();
  }
  async function loadComments(pid){ var rows=await sb('feed_comments?post_id=eq.'+encodeURIComponent(pid)+'&status=eq.live&order=created_at.asc&select=*').catch(function(){ return []; }); S.comments[pid]=rows; return rows; }
  async function loadWho(target){ return sb('feed_reactions?target_id=eq.'+encodeURIComponent(target)+'&select=name,emoji,employee_id').catch(function(){ return []; }); }
  async function loadVotes(pid){ return sb('feed_votes?post_id=eq.'+encodeURIComponent(pid)+'&select=employee_id,name,option').catch(function(){ return []; }); }

  /* ── rendering ───────────────────────────────────────────────────────────── */
  function rich(t){ var s=E(t); s=s.replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>'); s=s.replace(/(https?:\/\/[^\s<]+)/g,function(u){ var clean=u.replace(/[.,;:!?)]+$/,''); var tail=u.slice(clean.length); return '<a href="'+clean+'" target="_blank" rel="noopener">'+clean.replace(/^https?:\/\//,'').slice(0,60)+(clean.length>68?'…':'')+'</a>'+tail; }); return s.replace(/\n/g,'<br>'); }
  /* Scene films on internals tell us when they were watched to the end (postMessage from the iframe). */
  function wkey(url){ return 'jf_w_'+String(url||'').replace(/[?#].*$/,''); }
  function watched(url){ try{ return !!localStorage.getItem(wkey(url)); }catch(e){ return false; } }
  if(window.addEventListener) window.addEventListener('message', function(ev){
    var d=ev&&ev.data; if(!d || !d.jmbFilm) return;
    var box=null; $$('.jf-vid[data-film] iframe').forEach(function(f){ if(f.contentWindow===ev.source) box=f.parentNode; });
    if(!box) return;
    var url=box.getAttribute('data-film');
    if(d.jmbFilm==='ended'){ try{ localStorage.setItem(wkey(url), new Date().toISOString()); }catch(e){} if(!box.querySelector('.jf-watched')){ var b=document.createElement('span'); b.className='jf-watched'; b.textContent='✓ Watched to the end'; box.appendChild(b); } }
  });
  function embed(url){
    url=String(url||'').trim(); if(!url) return '';
    var m;
    if((m=url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/))) return '<div class="jf-vid"><iframe src="https://www.youtube.com/embed/'+m[1]+'?rel=0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    if((m=url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]{10,})/))) return '<div class="jf-vid"><iframe src="https://drive.google.com/file/d/'+m[1]+'/preview" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    if((m=url.match(/loom\.com\/(?:share|embed)\/([A-Za-z0-9]{10,})/))) return '<div class="jf-vid"><iframe src="https://www.loom.com/embed/'+m[1]+'" allow="fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    if((m=url.match(/vimeo\.com\/(\d{6,})/))) return '<div class="jf-vid"><iframe src="https://player.vimeo.com/video/'+m[1]+'" allow="fullscreen" allowfullscreen loading="lazy"></iframe></div>';
    if(/^https?:\/\/(internals\.jmbvirtuals\.com|portal\.jmbvirtuals\.com)\//.test(url)) return '<div class="jf-vid tall" data-film="'+E(url)+'"><iframe src="'+E(url)+'" allow="fullscreen" allowfullscreen loading="lazy"></iframe><a class="jf-open" href="'+E(url)+'" target="_blank" rel="noopener">Open full screen ↗</a>'+(watched(url)?'<span class="jf-watched">✓ Watched to the end</span>':'')+'</div>';
    if(/\.(mp4|webm|mov)(\?|$)/i.test(url)) return '<div class="jf-vid"><video src="'+E(url)+'" controls playsinline preload="metadata"></video></div>';
    return '<a class="jf-link" href="'+E(url)+'" target="_blank" rel="noopener">🔗 '+E(url.replace(/^https?:\/\//,'').slice(0,80))+'</a>';
  }
  function mediaHtml(p){
    var imgs=(p.media||[]).filter(function(m){ return m.type==='image'; }), files=(p.media||[]).filter(function(m){ return m.type!=='image'; }), h='';
    if(imgs.length) h+='<div class="jf-grid n'+Math.min(imgs.length,4)+'">'+imgs.slice(0,4).map(function(m,i){ return '<a class="jf-img" href="'+E(m.url)+'" onclick="return JMBFeed._zoom(this.href)"><img src="'+E(m.url)+'" alt="" loading="lazy">'+(i===3&&imgs.length>4?'<span class="jf-more">+'+(imgs.length-4)+'</span>':'')+'</a>'; }).join('')+'</div>';
    if(files.length) h+='<div class="jf-files">'+files.map(function(m){ var ext=(String(m.name||m.url).split('.').pop()||'').toLowerCase().slice(0,4); return '<a class="jf-file" href="'+E(m.url)+'" target="_blank" rel="noopener"><span class="jf-ext">'+E(ext||'file')+'</span><span class="jf-fn">'+E(m.name||'Attachment')+'</span>'+(m.size?'<span class="jf-fs">'+(m.size>1048576?(m.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(m.size/1024))+' KB')+'</span>':'')+'</a>'; }).join('')+'</div>';
    return h;
  }
  function pollHtml(p){
    var poll=p.poll; if(!poll) return '';
    var mine=S.mine.votes[p.id], voted=mine!==undefined && mine!==null, total=(p.counts&&p.counts.votes)||0, res=S.open['votes:'+p.id];
    var h='<div class="jf-poll"><div class="jf-pq">📊 '+E(poll.q)+'</div>';
    if(voted || C.admin || res){
      var counts={}; (res||[]).forEach(function(v){ (Array.isArray(v.option)?v.option:[v.option]).forEach(function(o){ counts[o]=(counts[o]||0)+1; }); });
      var n=(res||[]).length||total||0;
      h+=poll.options.map(function(o,i){ var c=counts[i]||0; var pct=n?Math.round(c*100/n):0; var isMine=voted && (Array.isArray(mine)?mine.indexOf(i)>=0:mine===i); return '<div class="jf-po res'+(isMine?' mine':'')+'"><span class="jf-bar" style="width:'+pct+'%"></span><span class="jf-pot">'+E(o)+(isMine?' ✓':'')+'</span><span class="jf-pop">'+pct+'%'+(res?' · '+c:'')+'</span></div>'; }).join('');
      h+='<div class="jf-pn">'+n+' vote'+(n===1?'':'s')+(res?'':' · <a onclick="JMBFeed._votes(\''+p.id+'\')">see who voted</a>')+(voted&&!C.admin?' · <a onclick="JMBFeed._revote(\''+p.id+'\')">change my vote</a>':'')+'</div>';
    } else {
      h+=poll.options.map(function(o,i){ return '<button type="button" class="jf-po" onclick="JMBFeed._vote(\''+p.id+'\','+i+',this)">'+(poll.multi?'<span class="jf-cb"></span>':'')+E(o)+'</button>'; }).join('');
      if(poll.multi) h+='<button type="button" class="jf-btn pri sm" onclick="JMBFeed._voteMulti(\''+p.id+'\',this)">Submit my picks</button>';
      h+='<div class="jf-pn">'+total+' vote'+(total===1?'':'s')+'</div>';
    }
    return h+'</div>';
  }
  function actionHtml(p){
    if(C.admin) return '';
    if(!p.required || p.required==='none' || !targeted(p)) return '';
    var a=myAck(p), closed=p.required_open===false;
    if(a && a.passed!==false) return '<div class="jf-done">✓ '+({ ack:'You read this', react:'You reacted', done:'Marked as done', quiz:'Quiz passed'+(a.score!=null?' · '+a.score+'%':'') }[a.kind]||'Done')+' · '+when(a.at)+'</div>';
    if(closed) return '<div class="jf-done muted">This item is closed — no action needed any more.</div>';
    if(p.required==='quiz') return '<button type="button" class="jf-btn req" onclick="JMBFeed._quiz(\''+p.id+'\')">📝 Take the quiz'+(a&&a.attempts?' (attempt '+(a.attempts+1)+')':'')+'</button><div class="jf-req-note">You need to pass before your tracker can start.'+(p.quiz&&p.quiz.pass_pct?' Pass mark '+p.quiz.pass_pct+'%.':'')+'</div>';
    if(p.required==='react') return '<div class="jf-req-note">👆 React to this post to confirm you saw it.</div>';
    if(p.required==='done') return '<button type="button" class="jf-btn req" onclick="JMBFeed._ack(\''+p.id+'\',\'done\',this)">✓ Mark as done</button>';
    return '<button type="button" class="jf-btn req" onclick="JMBFeed._ack(\''+p.id+'\',\'ack\',this)">✓ I’ve read this</button>';
  }
  function rxHtml(p){
    var counts=(p.counts&&p.counts.reactions)||{}, mine=S.mine.rx[p.id]||'', total=0; Object.keys(counts).forEach(function(k){ total+=counts[k]; });
    var top=EMOJI.filter(function(e){ return counts[e]; }).sort(function(a,b){ return counts[b]-counts[a]; }).slice(0,3);
    return '<div class="jf-rxbar"><div class="jf-rxsum" onclick="JMBFeed._who(\''+p.id+'\',\''+p.id+'\')">'+(total?top.map(function(e){ return '<span>'+e+'</span>'; }).join('')+'<b>'+total+'</b>':'<span class="muted">Be the first to react</span>')+'</div>'+
      '<div class="jf-rxpick">'+EMOJI.map(function(e){ return '<button type="button" class="jf-rx'+(mine===e?' on':'')+'" onclick="JMBFeed._react(\''+p.id+'\',\''+p.id+'\',\''+e+'\')" title="'+e+'">'+e+(counts[e]?'<i>'+counts[e]+'</i>':'')+'</button>'; }).join('')+'</div></div>';
  }
  function commentsHtml(p){
    var list=S.comments[p.id], n=(p.counts&&p.counts.comments)||0, open=!!S.open['c:'+p.id];
    var h='<div class="jf-cwrap">';
    h+='<button type="button" class="jf-ctog" onclick="JMBFeed._toggleComments(\''+p.id+'\')">💬 '+(n?n+' comment'+(n===1?'':'s'):'Comment')+(open?' ▴':' ▾')+'</button>';
    if(open){
      h+='<div class="jf-clist">';
      if(!list) h+='<div class="jf-cload">Loading…</div>';
      else { var tops=list.filter(function(c){ return !c.parent_id; }), byParent={}; list.forEach(function(c){ if(c.parent_id){ (byParent[c.parent_id]=byParent[c.parent_id]||[]).push(c); } });
        if(!tops.length) h+='<div class="jf-cload">No comments yet — say something.</div>';
        h+=tops.map(function(c){ return cHtml(p,c,false)+((byParent[c.id]||[]).map(function(r){ return cHtml(p,r,true); }).join('')); }).join(''); }
      h+='</div>'+composerHtml(p, null);
    }
    return h+'</div>';
  }
  function cHtml(p,c,isReply){
    var mine=S.mine.rx[c.id]||'', own=String(c.employee_id).toUpperCase()===myId();
    return '<div class="jf-c'+(isReply?' reply':'')+'" id="jfc-'+E(c.id)+'">'+face(c.employee_id,c.name,'sm')+'<div class="jf-cb2"><div class="jf-cbub"><b>'+E(c.name||c.employee_id)+(String(c.employee_id).toUpperCase()==='ADMIN'?' <span class="jf-adm">Admin</span>':'')+'</b><div>'+rich(c.body)+'</div></div>'+
      '<div class="jf-cmeta"><span>'+ago(c.created_at)+'</span><a onclick="JMBFeed._react(\''+p.id+'\',\''+c.id+'\',\'👍\')" class="'+(mine?'on':'')+'">'+(mine?mine+' Liked':'Like')+'</a>'+(isReply?'':'<a onclick="JMBFeed._replyTo(\''+p.id+'\',\''+c.id+'\',\''+E(c.name).replace(/'/g,'')+'\')">Reply</a>')+((own||C.admin)?'<a onclick="JMBFeed._delComment(\''+c.id+'\',\''+p.id+'\')">Delete</a>':'')+'</div></div></div>';
  }
  function composerHtml(p, parent){
    return '<div class="jf-compose" data-post="'+E(p.id)+'">'+face(myId(), me().full_name, 'sm')+'<div class="jf-cin"><input type="hidden" class="jf-parent" value="'+E(parent||'')+'"><textarea rows="1" placeholder="Write a comment…" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();JMBFeed._send(this)}" oninput="this.style.height=\'auto\';this.style.height=Math.min(140,this.scrollHeight)+\'px\'"></textarea><div class="jf-replying" style="display:none"></div></div><button type="button" class="jf-sendc" onclick="JMBFeed._send(this.previousElementSibling.querySelector(\'textarea\'))" title="Send">➤</button></div>';
  }
  function adminBar(p){
    if(!C.admin) return '';
    var st=S.open['stats:'+p.id];
    var h='<div class="jf-admbar"><button type="button" class="jf-btn sm" onclick="JMBFeed._stats(\''+p.id+'\')">👥 '+(st?(st.done_count+'/'+st.targets.length+' done'):'Who’s done?')+'</button>';
    h+='<button type="button" class="jf-btn sm" onclick="JMBFeed._edit(\''+p.id+'\')">✏️ Edit</button>';
    h+='<button type="button" class="jf-btn sm" onclick="JMBFeed._toggle(\''+p.id+'\',\'pinned\','+(p.pinned?0:1)+')">'+(p.pinned?'📌 Unpin':'📌 Pin')+'</button>';
    if(p.required&&p.required!=='none') h+='<button type="button" class="jf-btn sm" onclick="JMBFeed._toggle(\''+p.id+'\',\'required_open\','+(p.required_open===false?1:0)+')">'+(p.required_open===false?'🔓 Reopen requirement':'🔒 Close requirement')+'</button>';
    if(p.required&&p.required!=='none'&&p.required_open!==false) h+='<button type="button" class="jf-btn sm" onclick="JMBFeed._remind(\''+p.id+'\')">⏰ Remind the rest</button>';
    h+='<button type="button" class="jf-btn sm danger" onclick="JMBFeed._del(\''+p.id+'\')">🗑 Delete</button></div>';
    if(st){ h+='<div class="jf-stats"><div><b>Done ('+st.done_count+')</b> '+(st.acks.filter(function(a){ return a.passed!==false; }).map(function(a){ return E(a.name||a.employee_id)+(a.kind==='quiz'&&a.score!=null?' <i>'+a.score+'%</i>':''); }).join(', ')||'<span class="muted">nobody yet</span>')+'</div>';
      h+='<div><b>Still waiting ('+st.missing.length+')</b> '+(st.missing.map(function(m){ return E(m.name); }).join(', ')||'<span class="muted">everyone is done 🎉</span>')+'</div>';
      var failed=st.acks.filter(function(a){ return a.kind==='quiz'&&a.passed===false; }); if(failed.length) h+='<div><b>Quiz not passed yet</b> '+failed.map(function(a){ return E(a.name)+' <i>'+a.score+'% · '+a.attempts+' try'+(a.attempts===1?'':'s')+'</i>'; }).join(', ')+'</div>';
      h+='</div>'; }
    return h;
  }
  function postHtml(p){
    var need=needsMe(p), req=p.required&&p.required!=='none';
    return '<article class="jf-post'+(p.pinned?' pinned':'')+(need?' need':'')+'" id="jfp-'+E(p.id)+'">'+
      '<header class="jf-ph">'+face('ADMIN','JMB Virtuals','')+'<div class="jf-pm"><div class="jf-pn2">'+E(p.author||'JMB Virtuals')+' <span class="jf-adm">Admin</span></div><div class="jf-pt"><span title="'+E(when(p.created_at))+'">'+ago(p.created_at)+'</span> · <span class="jf-aud">'+(String((p.audience||{}).type||'all')==='all'?'🌐':'👥')+' '+E(audLabel(p))+'</span></div></div>'+
      (p.pinned?'<span class="jf-chip pin">📌 Pinned</span>':'')+(req?'<span class="jf-chip req'+(p.required_open===false?' off':'')+'">'+E(reqLabel(p.required))+(p.required_open===false?' · closed':'')+'</span>':'')+'</header>'+
      (p.title?'<h3 class="jf-title">'+E(p.title)+'</h3>':'')+
      (p.body?'<div class="jf-body">'+rich(p.body)+'</div>':'')+
      mediaHtml(p)+embed(p.video_url)+pollHtml(p)+
      (p.quiz&&!C.admin?'':(p.quiz?'<div class="jf-quizinfo">📝 Quiz · '+(p.quiz.n||(p.quiz.questions||[]).length)+' questions · pass '+(p.quiz.pass_pct||80)+'%</div>':''))+
      '<div class="jf-act">'+actionHtml(p)+'</div>'+
      rxHtml(p)+commentsHtml(p)+adminBar(p)+'</article>';
  }
  function render(){
    var root=C.mount&&$(C.mount); if(!root) return;
    var list=S.posts.slice();
    if(S.filter==='todo') list=list.filter(needsMe); else if(S.filter==='mine') list=list.filter(targeted);
    var head='<div class="jf-head"><div class="jf-tabs"><button type="button" class="'+(S.filter==='all'?'on':'')+'" onclick="JMBFeed._filter(\'all\')">All posts</button>'+(C.admin?'':'<button type="button" class="'+(S.filter==='todo'?'on':'')+'" onclick="JMBFeed._filter(\'todo\')">Needs me'+(pending().length?' <i>'+pending().length+'</i>':'')+'</button>')+'</div>'+(C.admin?'<button type="button" class="jf-btn pri" onclick="JMBFeed._compose()">✚ New post</button>':'<button type="button" class="jf-btn sm" onclick="JMBFeed.refresh(true)" title="Refresh">↻</button>')+'</div>';
    var body=!S.loaded?'<div class="jf-empty">Loading the feed…</div>':(list.length?list.map(postHtml).join(''):'<div class="jf-empty">'+(S.filter==='todo'?'Nothing needs you right now. ✨':'No posts yet.')+'</div>');
    /* Three regions. A refresh (poll, realtime, tab switch) rewrites the head and the list ONLY — an open composer
       is never touched, so a post being written can't vanish mid-sentence (it did, Oct 7). */
    if(!root.querySelector('#jf-head') || !root.querySelector('#jf-list') || !root.querySelector('#jf-composer')){ root.innerHTML='<div class="jf"><div id="jf-head"></div><div id="jf-composer"></div><div id="jf-list"></div></div>'; }
    root.querySelector('#jf-head').innerHTML=head; root.querySelector('#jf-list').innerHTML=body;
    S.lastSeen=Date.now(); try{ localStorage.setItem('jf_seen_'+myId(), String(S.lastSeen)); }catch(e){} badge();
  }
  function rerender(pid){ var p=S.posts.filter(function(x){ return x.id===pid; })[0]; var el=pid&&$('#jfp-'+CSS.escape(pid)); if(!p||!el){ return render(); } var tmp=document.createElement('div'); tmp.innerHTML=postHtml(p); el.replaceWith(tmp.firstElementChild); badge(); }

  /* ── actions (public under JMBFeed._*) ────────────────────────────────────── */
  var A={};
  A._filter=function(f){ S.filter=f; render(); };
  A._toggleComments=async function(pid){ S.open['c:'+pid]=!S.open['c:'+pid]; rerender(pid); if(S.open['c:'+pid]&&!S.comments[pid]){ await loadComments(pid); rerender(pid); } };
  A._replyTo=function(pid, cid, name){ var box=$('#jfp-'+CSS.escape(pid)+' .jf-compose'); if(!box) return; box.querySelector('.jf-parent').value=cid; var r=box.querySelector('.jf-replying'); r.style.display=''; r.innerHTML='Replying to <b>'+E(name)+'</b> · <a onclick="JMBFeed._replyTo(\''+pid+'\',\'\',\'\')">cancel</a>'; if(!cid){ r.style.display='none'; } var ta=box.querySelector('textarea'); ta.focus(); };
  A._send=async function(ta){ var box=ta.closest('.jf-compose'), pid=box.getAttribute('data-post'), parent=box.querySelector('.jf-parent').value||null, text=(ta.value||'').trim(); if(!text) return; ta.disabled=true;
    var d=await post({ action:'feed_comment', post_id:pid, parent_id:parent, body:text }); ta.disabled=false;
    if(d&&d.ok){ ta.value=''; ta.style.height='auto'; (S.comments[pid]=S.comments[pid]||[]).push(d.comment); var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(p){ p.counts=p.counts||{}; p.counts.comments=(p.counts.comments||0)+1; } rerender(pid); }
    else toast(d&&d.error==='AUTH_FAILED'?'Sign in again to comment.':'Could not send — '+((d&&d.error)||'network')); };
  A._delComment=async function(cid, pid){ if(!confirm('Delete this comment?')) return; var d=await post({ action:'feed_comment_delete', id:cid }); if(d&&d.ok){ S.comments[pid]=(S.comments[pid]||[]).filter(function(c){ return c.id!==cid && c.parent_id!==cid; }); var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(p&&p.counts) p.counts.comments=Math.max(0,(p.counts.comments||1)-1); rerender(pid); } else toast('Could not delete'); };
  A._react=async function(pid, target, emoji){ var cur=S.mine.rx[target]||''; var next=(cur===emoji)?'':emoji; S.mine.rx[target]=next; var p=S.posts.filter(function(x){ return x.id===pid; })[0];
    if(p && target===pid){ p.counts=p.counts||{}; var c=p.counts.reactions=p.counts.reactions||{}; if(cur) c[cur]=Math.max(0,(c[cur]||1)-1); if(next) c[next]=(c[next]||0)+1; Object.keys(c).forEach(function(k){ if(!c[k]) delete c[k]; }); }
    rerender(pid); var d=await post({ action:'feed_react', post_id:pid, target_id:target, emoji:next }); if(!(d&&d.ok)){ toast('Reaction not saved'); return; } if(d.ack){ S.mine.acks[pid]=d.ack; rerender(pid); } };
  A._who=async function(pid, target){ var rows=await loadWho(target); if(!rows.length){ toast('No reactions yet'); return; } modal('<div class="jf-mt">Reactions</div>'+rows.map(function(r){ return '<div class="jf-wrow">'+face(r.employee_id,r.name,'sm')+'<span>'+E(r.name||r.employee_id)+'</span><b>'+r.emoji+'</b></div>'; }).join('')); };
  A._ack=async function(pid, kind, btn){ if(btn){ btn.disabled=true; btn.textContent='Saving…'; } var d=await post({ action:'feed_ack', post_id:pid, kind:kind }); if(d&&d.ok){ S.mine.acks[pid]=d.ack; var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(p){ p.counts=p.counts||{}; p.counts.acks=(p.counts.acks||0)+1; } rerender(pid); toast(kind==='done'?'Marked as done ✓':'Thanks — noted ✓'); afterGate(); } else { if(btn){ btn.disabled=false; btn.textContent=kind==='done'?'✓ Mark as done':'✓ I’ve read this'; } toast('Could not save — '+((d&&d.error)||'network')); } };
  A._vote=async function(pid, i, btn){ var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(!p) return; if(p.poll.multi){ btn.classList.toggle('sel'); return; } $$('#jfp-'+CSS.escape(pid)+' .jf-po').forEach(function(b){ b.disabled=true; });
    var d=await post({ action:'feed_vote', post_id:pid, option:i }); if(d&&d.ok){ S.mine.votes[pid]=i; p.counts=p.counts||{}; p.counts.votes=(p.counts.votes||0)+1; S.open['votes:'+pid]=await loadVotes(pid); rerender(pid); } else { toast('Vote not saved'); rerender(pid); } };
  A._voteMulti=async function(pid, btn){ var picks=$$('#jfp-'+CSS.escape(pid)+' .jf-po.sel').map(function(b){ return Array.prototype.indexOf.call(b.parentNode.querySelectorAll('.jf-po'), b); }); if(!picks.length){ toast('Pick at least one'); return; } btn.disabled=true; var d=await post({ action:'feed_vote', post_id:pid, option:picks }); var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(d&&d.ok){ S.mine.votes[pid]=picks; if(p){ p.counts=p.counts||{}; p.counts.votes=(p.counts.votes||0)+1; } S.open['votes:'+pid]=await loadVotes(pid); rerender(pid); } else { btn.disabled=false; toast('Vote not saved'); } };
  A._revote=function(pid){ delete S.mine.votes[pid]; delete S.open['votes:'+pid]; rerender(pid); };
  A._votes=async function(pid){ S.open['votes:'+pid]=await loadVotes(pid); rerender(pid); };
  A._zoom=function(src){ modal('<img class="jf-zoom" src="'+E(src)+'" alt="">', true); return false; };
  A._quiz=function(pid){ var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(!p||!p.quiz) return; var qs=p.quiz.questions||[];
    modal('<div class="jf-mt">📝 '+E(p.title||'Quiz')+'</div><div class="jf-qsub">'+qs.length+' questions · pass mark '+(p.quiz.pass_pct||80)+'% · you can retake it</div><form id="jf-qf" onsubmit="return JMBFeed._quizSend(\''+pid+'\',this)">'+qs.map(function(q,i){ return '<div class="jf-q" id="jfq-'+i+'"><div class="jf-qq">'+(i+1)+'. '+E(q.q)+'</div>'+q.options.map(function(o,j){ return '<label class="jf-qo"><input type="radio" name="q'+i+'" value="'+j+'" required><span>'+E(o)+'</span></label>'; }).join('')+'</div>'; }).join('')+'<button type="submit" class="jf-btn pri w">Submit answers</button></form>'); };
  A._quizSend=async function(pid, form){ var qs=(S.posts.filter(function(x){ return x.id===pid; })[0]||{}).quiz; var answers=[]; for(var i=0;i<(qs.questions||[]).length;i++){ var v=form.querySelector('input[name="q'+i+'"]:checked'); answers.push(v?parseInt(v.value,10):-1); }
    var btn=form.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Checking…';
    var d=await post({ action:'feed_quiz_submit', post_id:pid, answers:answers }); btn.disabled=false; btn.textContent='Submit answers';
    if(!(d&&d.ok)){ toast('Could not submit — '+((d&&d.error)||'network')); return false; }
    $$('.jf-q', form).forEach(function(el,i){ el.classList.remove('ok','bad'); el.classList.add(d.wrong.indexOf(i)>=0?'bad':'ok'); });
    var res=$('#jf-qres')||document.createElement('div'); res.id='jf-qres'; res.className='jf-qres '+(d.passed?'ok':'bad'); res.innerHTML=d.passed?'🎉 <b>Passed — '+d.score+'%</b> ('+d.right+' of '+d.total+'). You can start your tracker.':'❌ <b>'+d.score+'%</b> ('+d.right+' of '+d.total+') — pass mark is '+d.pass_pct+'%. The questions marked red were wrong; fix them and submit again.'; form.insertBefore(res, form.firstChild);
    if(d.passed){ S.mine.acks[pid]={ post_id:pid, kind:'quiz', passed:true, score:d.score, attempts:d.attempts, at:new Date().toISOString() }; var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(p){ p.counts=p.counts||{}; p.counts.acks=(p.counts.acks||0)+1; } rerender(pid); setTimeout(closeModal, 1800); afterGate(); }
    else { S.mine.acks[pid]={ post_id:pid, kind:'quiz', passed:false, score:d.score, attempts:d.attempts }; rerender(pid); }
    return false; };
  /* admin */
  A._stats=async function(pid){ var d=await post({ action:'feed_stats', post_id:pid }); if(d&&d.ok){ S.open['stats:'+pid]=d; rerender(pid); } else toast('Could not load — '+((d&&d.error)||'network')); };
  A._remind=async function(pid){ if(!confirm('Send a reminder notification to everyone who has not done this yet?')) return; var d=await post({ action:'feed_remind', post_id:pid }); toast(d&&d.ok?('Reminder sent to '+d.count+' '+(d.count===1?'person':'people')):'Could not send'); };
  A._toggle=async function(pid, k, v){ var b={ action:'feed_post_toggle', id:pid }; b[k]=!!v; var d=await post(b); if(d&&d.ok){ var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(p) p[k]=!!v; if(k==='pinned') await A.refresh(true); else rerender(pid); } else toast('Could not update'); };
  A._del=async function(pid){ if(!confirm('Delete this post for everyone?')) return; var d=await post({ action:'feed_post_delete', id:pid }); if(d&&d.ok){ S.posts=S.posts.filter(function(x){ return x.id!==pid; }); render(); toast('Deleted'); } else toast('Could not delete'); };
  A._compose=function(p){ composer(p||null); };
  A._edit=function(pid){ var p=S.posts.filter(function(x){ return x.id===pid; })[0]; if(p) composer(p); };

  /* ── admin composer ───────────────────────────────────────────────────────── */
  var D={ media:[], quiz:[], pollOpts:['',''], people:[], teams:[] };
  function DK(){ return 'jf_draft_'+(C.host||'x'); }
  function draftSave(){ try{ var box=$('#jf-composer'); if(!box||!box.firstElementChild) return; var d={ id:D.id||'', title:($('#jfc-title')||{}).value||'', body:($('#jfc-body')||{}).value||'', video:($('#jfc-video')||{}).value||'', aud:($('#jfc-aud')||{}).value||'all', teams:$$('#jfc-teams input:checked').map(function(i){ return i.value; }), people:$$('#jfc-people input:checked').map(function(i){ return i.value; }), req:($('#jfc-req')||{}).value||'none', media:D.media.filter(function(m){ return m.url; }), pollq:($('#jfc-pollq')||{}).value||'', pollOpts:D.pollOpts, pollMulti:!!($('#jfc-pollmulti')||{}).checked, quiz:D.quiz, pass:($('#jfc-pass')||{}).value||'', pin:!!($('#jfc-pin')||{}).checked, notify:!!($('#jfc-notify')||{}).checked, at:Date.now() }; if(!d.title && !d.body && !d.media.length && !d.quiz.length) { localStorage.removeItem(DK()); return; } localStorage.setItem(DK(), JSON.stringify(d)); }catch(e){} }
  function draftLoad(){ try{ var d=JSON.parse(localStorage.getItem(DK())||'null'); if(d && (Date.now()-(d.at||0))<7*86400000) return d; }catch(e){} return null; }
  function draftClear(){ try{ localStorage.removeItem(DK()); }catch(e){} }
  var _draftT=null; function draftArm(){ var box=$('#jf-composer'); if(!box||box._armed) return; box._armed=true; box.addEventListener('input', function(){ clearTimeout(_draftT); _draftT=setTimeout(draftSave, 400); }); box.addEventListener('change', function(){ clearTimeout(_draftT); _draftT=setTimeout(draftSave, 200); }); }
  async function composer(p){
    var box=$('#jf-composer'); if(!box) return;
    if(box.firstElementChild && !p){ box.scrollIntoView({ behavior:'smooth', block:'start' }); return; }   // already open — don't rebuild over a draft
    var dr=(!p)?draftLoad():null;
    if(dr && !p){ p=null; }
    if(!S.teams){ var t=await post({ action:'feed_teams' }); if(t&&t.ok){ S.teams=t.teams; S.people=t.people; t.people.forEach(function(x){ S.names[x.id]=x.name; }); } else { S.teams=[]; S.people=[]; } }
    D={ media:p?(p.media||[]).slice():[], quiz:p&&p.quiz?(p.quiz.questions||[]).map(function(q){ return { q:q.q, options:q.options.slice(), a:0 }; }):[], pollOpts:p&&p.poll?p.poll.options.slice():['',''], people:p&&p.audience&&p.audience.type==='people'&&p.audience.ids?p.audience.ids.slice():[], teams:p&&p.audience&&p.audience.teams?p.audience.teams.slice():[], id:p?p.id:'' };
    var aud=p&&p.audience?String(p.audience.type||'all'):'all';
    if(dr){ D.media=dr.media||[]; D.quiz=dr.quiz||[]; D.pollOpts=(dr.pollOpts&&dr.pollOpts.length)?dr.pollOpts:['','']; D.people=dr.people||[]; D.teams=dr.teams||[]; D.id=dr.id||''; aud=dr.aud||'all'; p={ title:dr.title, body:dr.body, video_url:dr.video, required:dr.req, pinned:dr.pin, poll:dr.pollq?{ q:dr.pollq, multi:dr.pollMulti }:null, quiz:D.quiz.length?{ pass_pct:parseInt(dr.pass,10)||80 }:null, _draft:true, _notify:dr.notify }; }
    box.innerHTML='<div class="jf-cmp"><div class="jf-cmph"><b>'+(p&&!p._draft?'Edit post':'New post')+'</b><button type="button" class="jf-x" onclick="JMBFeed._cancelCompose()" title="Close (keeps the draft)">✕</button></div>'+
      (p&&p._draft?'<div class="jf-draft">📝 Draft restored from earlier — <a onclick="JMBFeed._discardDraft()">discard it</a></div>':'')+
      '<input id="jfc-title" class="jf-in" placeholder="Title (e.g. New Reddit SOP — effective Oct 7)" value="'+E(p?p.title:'')+'">'+
      '<textarea id="jfc-body" class="jf-in" rows="5" placeholder="Write the post… Links become clickable, **bold** works, blank lines make paragraphs.">'+E(p?p.body:'')+'</textarea>'+
      '<div class="jf-row"><label class="jf-lab">Who is this for?</label><div class="jf-seg"><button type="button" class="'+(aud==='all'?'on':'')+'" onclick="JMBFeed._aud(\'all\',this)">🌐 Everyone</button><button type="button" class="'+(aud==='teams'?'on':'')+'" onclick="JMBFeed._aud(\'teams\',this)">👥 Teams</button><button type="button" class="'+(aud==='people'?'on':'')+'" onclick="JMBFeed._aud(\'people\',this)">🙋 Specific people</button></div><input type="hidden" id="jfc-aud" value="'+aud+'"></div>'+
      '<div id="jfc-teams" class="jf-chips" style="'+(aud==='teams'?'':'display:none')+'">'+((S.teams||[]).length?(S.teams||[]).map(function(t){ return '<label class="jf-chip2'+(D.teams.indexOf(t.name)>=0?' on':'')+'" title="'+E((t.members||[]).join(', '))+'"><input type="checkbox" value="'+E(t.name)+'" '+(D.teams.indexOf(t.name)>=0?'checked':'')+' onchange="this.parentNode.classList.toggle(\'on\',this.checked)">'+E(t.name)+' <i>'+t.count+'</i></label>'; }).join(''):'<span class="jf-hint">No teams found yet — teams come from the projects people log hours on. <a onclick="JMBFeed._teamsRefresh()">Refresh</a></span>')+'<div class="jf-hint" style="width:100%">Teams = the projects people logged hours on in the last 60 days (+ the client column). Hover a chip to see who is in it. <a onclick="JMBFeed._teamsRefresh()">Refresh teams</a></div></div>'+
      '<div id="jfc-people" class="jf-chips" style="'+(aud==='people'?'':'display:none')+'">'+(S.people||[]).map(function(x){ return '<label class="jf-chip2'+(D.people.indexOf(x.id)>=0?' on':'')+'"><input type="checkbox" value="'+E(x.id)+'" '+(D.people.indexOf(x.id)>=0?'checked':'')+' onchange="this.parentNode.classList.toggle(\'on\',this.checked)">'+E(x.name)+'</label>'; }).join('')+'</div>'+
      '<div class="jf-row"><label class="jf-lab">What must they do?</label><select id="jfc-req" class="jf-in" onchange="JMBFeed._reqChange(this.value)"><option value="none"'+(!p||p.required==='none'?' selected':'')+'>Nothing — just an update</option><option value="ack"'+(p&&p.required==='ack'?' selected':'')+'>Read it and tap “I’ve read this”</option><option value="react"'+(p&&p.required==='react'?' selected':'')+'>React to confirm they saw it</option><option value="done"'+(p&&p.required==='done'?' selected':'')+'>Do something and tap “Mark as done”</option><option value="quiz"'+(p&&p.required==='quiz'?' selected':'')+'>Pass a quiz</option></select><div class="jf-hint">Required items block the time tracker for the people addressed until done. Everyone else just sees the post.</div></div>'+
      '<div class="jf-row"><label class="jf-lab">Attachments</label><div class="jf-attach"><label class="jf-btn sm">🖼 Photos<input type="file" accept="image/*" multiple style="display:none" onchange="JMBFeed._files(this,\'image\')"></label><label class="jf-btn sm">📎 Files<input type="file" multiple style="display:none" onchange="JMBFeed._files(this,\'file\')"></label><input id="jfc-video" class="jf-in" placeholder="Video link — YouTube, Google Drive, Loom, or a Huddle page on internals.jmbvirtuals.com" value="'+E(p?p.video_url:'')+'"></div><div id="jfc-media" class="jf-mlist"></div></div>'+
      '<div class="jf-row"><label class="jf-lab">Poll <small>(optional)</small></label><input id="jfc-pollq" class="jf-in" placeholder="Question (leave blank for no poll)" value="'+E(p&&p.poll?p.poll.q:'')+'"><div id="jfc-polls"></div><label class="jf-ck"><input type="checkbox" id="jfc-pollmulti" '+(p&&p.poll&&p.poll.multi?'checked':'')+'> Allow more than one pick</label></div>'+
      '<div class="jf-row" id="jfc-quizrow" style="'+(p&&p.required==='quiz'?'':'display:none')+'"><label class="jf-lab">Quiz</label><div id="jfc-quiz"></div><div style="display:flex;gap:8px;align-items:center;margin-top:6px"><button type="button" class="jf-btn sm" onclick="JMBFeed._qAdd()">＋ Add question</button><label class="jf-ck">Pass mark <input id="jfc-pass" type="number" min="1" max="100" value="'+(p&&p.quiz&&p.quiz.pass_pct?p.quiz.pass_pct:80)+'" style="width:64px"> %</label></div>'+(p&&p.quiz?'<div class="jf-hint">Editing a saved quiz: set the correct answer again for each question (answer keys are never sent to the browser).</div>':'')+'</div>'+
      '<div class="jf-row jf-opts"><label class="jf-ck"><input type="checkbox" id="jfc-pin" '+(p&&p.pinned?'checked':'')+'> 📌 Pin to top</label><label class="jf-ck"><input type="checkbox" id="jfc-notify" '+((p&&!p._draft)?'':((p&&p._draft&&p._notify===false)?'':'checked'))+'> 🔔 Notify '+((p&&!p._draft)?'again':'everyone addressed')+'</label></div>'+
      '<div class="jf-row" style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="jf-btn" onclick="JMBFeed._cancelCompose()">Cancel</button><button type="button" class="jf-btn pri" id="jfc-save" onclick="JMBFeed._save()">'+(p?'Save changes':'Post')+'</button></div></div>';
    paintMedia(); paintPoll(); paintQuiz(); draftArm(); box.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  A._teamsRefresh=async function(){ var t=await post({ action:'feed_teams', fresh:true }); if(t&&t.ok){ S.teams=t.teams; S.people=t.people; var el=$('#jfc-teams'); if(el){ var picked=$$('#jfc-teams input:checked').map(function(i){ return i.value; }); D.teams=picked; var html=(S.teams||[]).map(function(x){ return '<label class="jf-chip2'+(picked.indexOf(x.name)>=0?' on':'')+'" title="'+E((x.members||[]).join(', '))+'"><input type="checkbox" value="'+E(x.name)+'" '+(picked.indexOf(x.name)>=0?'checked':'')+' onchange="this.parentNode.classList.toggle(\'on\',this.checked)">'+E(x.name)+' <i>'+x.count+'</i></label>'; }).join(''); el.innerHTML=html+'<div class="jf-hint" style="width:100%">'+(S.teams.length?S.teams.length+' teams':'No teams found')+' · from the last 60 days of tracked hours. <a onclick="JMBFeed._teamsRefresh()">Refresh teams</a></div>'; } toast(t.teams.length+' teams found'); } else toast('Could not load teams'); };
  A._discardDraft=function(){ draftClear(); var b=$('#jf-composer'); if(b) b.innerHTML=''; composer(null); };
  function paintMedia(){ var el=$('#jfc-media'); if(!el) return; el.innerHTML=D.media.map(function(m,i){ return '<div class="jf-mi">'+(m.type==='image'?'<img src="'+E(m.url)+'" alt="">':'<span class="jf-ext">'+E((m.name||'').split('.').pop().slice(0,4)||'file')+'</span>')+'<span class="jf-mn">'+E(m.name||'')+'</span>'+(m.uploading?'<span class="jf-up">uploading…</span>':'')+'<a onclick="JMBFeed._rmMedia('+i+')">✕</a></div>'; }).join(''); }
  function paintPoll(){ var el=$('#jfc-polls'); if(!el) return; el.innerHTML=D.pollOpts.map(function(o,i){ return '<div class="jf-pol"><input class="jf-in" placeholder="Option '+(i+1)+'" value="'+E(o)+'" oninput="JMBFeed._pollOpt('+i+',this.value)">'+(D.pollOpts.length>2?'<a onclick="JMBFeed._pollRm('+i+')">✕</a>':'')+'</div>'; }).join('')+(D.pollOpts.length<10?'<button type="button" class="jf-btn sm" onclick="JMBFeed._pollAdd()">＋ Option</button>':''); }
  function paintQuiz(){ var el=$('#jfc-quiz'); if(!el) return; el.innerHTML=D.quiz.map(function(q,i){ return '<div class="jf-qe"><div class="jf-qeh"><b>Q'+(i+1)+'</b><a onclick="JMBFeed._qRm('+i+')">✕ remove</a></div><input class="jf-in" placeholder="Question" value="'+E(q.q)+'" oninput="JMBFeed._qSet('+i+',\'q\',this.value)">'+q.options.map(function(o,j){ return '<div class="jf-qoe"><input type="radio" name="jfqa'+i+'" '+(q.a===j?'checked':'')+' onchange="JMBFeed._qSet('+i+',\'a\','+j+')" title="Correct answer"><input class="jf-in" placeholder="Option '+(j+1)+'" value="'+E(o)+'" oninput="JMBFeed._qOpt('+i+','+j+',this.value)">'+(q.options.length>2?'<a onclick="JMBFeed._qOptRm('+i+','+j+')">✕</a>':'')+'</div>'; }).join('')+(q.options.length<6?'<button type="button" class="jf-btn sm" onclick="JMBFeed._qOptAdd('+i+')">＋ Option</button>':'')+'<div class="jf-hint">Tick the circle next to the correct answer.</div></div>'; }).join('')||'<div class="jf-hint">No questions yet.</div>'; }
  A._aud=function(t,btn){ $('#jfc-aud').value=t; $$('.jf-seg button', btn.parentNode).forEach(function(b){ b.classList.toggle('on', b===btn); }); $('#jfc-teams').style.display=t==='teams'?'':'none'; $('#jfc-people').style.display=t==='people'?'':'none'; };
  A._reqChange=function(v){ $('#jfc-quizrow').style.display=v==='quiz'?'':'none'; if(v==='quiz'&&!D.quiz.length){ D.quiz.push({ q:'', options:['',''], a:0 }); paintQuiz(); } };
  A._rmMedia=function(i){ D.media.splice(i,1); paintMedia(); };
  A._pollOpt=function(i,v){ D.pollOpts[i]=v; }; A._pollAdd=function(){ D.pollOpts.push(''); paintPoll(); }; A._pollRm=function(i){ D.pollOpts.splice(i,1); paintPoll(); };
  A._qAdd=function(){ D.quiz.push({ q:'', options:['',''], a:0 }); paintQuiz(); }; A._qRm=function(i){ D.quiz.splice(i,1); paintQuiz(); }; A._qSet=function(i,k,v){ D.quiz[i][k]=v; }; A._qOpt=function(i,j,v){ D.quiz[i].options[j]=v; }; A._qOptAdd=function(i){ D.quiz[i].options.push(''); paintQuiz(); }; A._qOptRm=function(i,j){ D.quiz[i].options.splice(j,1); if(D.quiz[i].a>=D.quiz[i].options.length) D.quiz[i].a=0; paintQuiz(); };
  A._cancelCompose=function(){ draftSave(); var b=$('#jf-composer'); if(b) b.innerHTML=''; if(draftLoad()) toast('Draft kept — ✚ New post brings it back'); };
  A._files=async function(input, type){ var files=Array.prototype.slice.call(input.files||[]); input.value=''; for(var i=0;i<files.length;i++){ var f=files[i]; var item={ type:type, name:f.name, size:f.size, url:'', uploading:true }; D.media.push(item); paintMedia();
      try{ var blob=f; if(type==='image'){ blob=await shrink(f); } if(blob.size>25*1048576) throw new Error('over 25 MB'); var safe=f.name.replace(/[^A-Za-z0-9._-]+/g,'_').slice(-80); var path='posts/'+Date.now()+'-'+Math.random().toString(36).slice(2,6)+'-'+safe;
        var r=await fetch(C.supaUrl+'/storage/v1/object/feedmedia/'+path, { method:'POST', headers:{ apikey:C.supaKey, Authorization:'Bearer '+C.supaKey, 'Content-Type':blob.type||f.type||'application/octet-stream', 'x-upsert':'false' }, body:blob });
        if(!r.ok) throw new Error('upload '+r.status); item.url=C.supaUrl+'/storage/v1/object/public/feedmedia/'+path; item.size=blob.size; item.uploading=false; }
      catch(e){ D.media=D.media.filter(function(m){ return m!==item; }); toast('Upload failed: '+e.message+' — run FEED_setup.sql if the bucket is missing'); }
      paintMedia(); } };
  function shrink(file){ return new Promise(function(res){ try{ var img=new Image(); var u=URL.createObjectURL(file); img.onload=function(){ var W=img.naturalWidth, H=img.naturalHeight, M=1600, s=Math.min(1, M/Math.max(W,H)); if(s>=1 && file.size<1.5*1048576){ URL.revokeObjectURL(u); return res(file); } var c=document.createElement('canvas'); c.width=Math.round(W*s); c.height=Math.round(H*s); c.getContext('2d').drawImage(img,0,0,c.width,c.height); c.toBlob(function(b){ URL.revokeObjectURL(u); res(b||file); }, 'image/jpeg', .86); }; img.onerror=function(){ res(file); }; img.src=u; }catch(e){ res(file); } }); }
  A._save=async function(){
    var btn=$('#jfc-save'); if(D.media.some(function(m){ return m.uploading; })){ toast('Wait for the uploads to finish'); return; }
    var aud={ type:$('#jfc-aud').value }; if(aud.type==='teams'){ aud.teams=$$('#jfc-teams input:checked').map(function(i){ return i.value; }); if(!aud.teams.length){ toast('Pick at least one team'); return; } } if(aud.type==='people'){ aud.ids=$$('#jfc-people input:checked').map(function(i){ return i.value; }); if(!aud.ids.length){ toast('Pick at least one person'); return; } }
    var req=$('#jfc-req').value, b={ action:'feed_post_save', id:D.id||undefined, title:$('#jfc-title').value.trim(), body:$('#jfc-body').value.trim(), media:D.media.filter(function(m){ return m.url; }), video_url:$('#jfc-video').value.trim(), audience:aud, required:req, pinned:$('#jfc-pin').checked, notify:$('#jfc-notify').checked, renotify:$('#jfc-notify').checked };
    if(!b.title && !b.body){ toast('Write something first'); return; }
    var pq=$('#jfc-pollq').value.trim(), opts=D.pollOpts.map(function(o){ return String(o||'').trim(); }).filter(Boolean); if(pq && opts.length>=2) b.poll={ q:pq, options:opts, multi:$('#jfc-pollmulti').checked }; else if(!pq) b.poll_clear=true;
    if(req==='quiz' || D.quiz.length){ var qs=D.quiz.filter(function(q){ return q.q.trim() && q.options.filter(function(o){ return o.trim(); }).length>=2; }); if(req==='quiz' && !qs.length){ toast('Add at least one quiz question with 2+ options'); return; } if(qs.length) b.quiz={ questions:qs.map(function(q){ return { q:q.q.trim(), options:q.options.map(function(o){ return o.trim(); }).filter(Boolean) }; }), answers:qs.map(function(q){ return q.a; }), pass_pct:parseInt($('#jfc-pass').value,10)||80 }; }
    btn.disabled=true; btn.textContent='Posting…';
    var d=await post(b); btn.disabled=false; btn.textContent=D.id?'Save changes':'Post';
    if(d&&d.ok){ draftClear(); var b0=$('#jf-composer'); if(b0) b0.innerHTML=''; await A.refresh(true); toast(D.id?'Saved':('Posted to '+d.targets+' '+(d.targets===1?'person':'people')+(d.notified&&d.notified.ok?' · notified':''))); }
    else toast(d&&d.error==='NO_ONE_IN_THOSE_TEAMS'?'Nobody is in the teams you ticked — pick another team or specific people.':('Could not post — '+((d&&d.error)||'network'))); };

  /* ── gate: "Before you start" ─────────────────────────────────────────────── */
  function gateOverlay(list){
    var el=$('#jf-gate'); if(!el){ el=document.createElement('div'); el.id='jf-gate'; document.body.appendChild(el); }
    el.innerHTML='<div class="jf-gbox"><div class="jf-gh"><div><div class="jf-gt">Before you start</div><div class="jf-gs">'+list.length+' post'+(list.length===1?'':'s')+' need'+(list.length===1?'s':'')+' your action first. It only takes a minute.</div></div><button type="button" class="jf-x" onclick="JMBFeed._gateClose()">✕</button></div><div class="jf-glist">'+list.map(function(p){ return '<div class="jf-gi"><div><b>'+E(p.title||'(untitled)')+'</b><div class="jf-gm">'+E(reqLabel(p.required))+' · '+ago(p.created_at)+'</div></div><button type="button" class="jf-btn pri sm" onclick="JMBFeed._gateOpen(\''+p.id+'\')">Open</button></div>'; }).join('')+'</div></div>';
    el.style.display='flex';
  }
  function afterGate(){ var left=pending(); var el=$('#jf-gate'); if(el && el.style.display!=='none'){ if(!left.length){ el.style.display='none'; toast('All done — you can start your tracker now. 🎉'); } else gateOverlay(left); } badge(); }
  A._gateClose=function(){ var el=$('#jf-gate'); if(el) el.style.display='none'; };
  A._gateOpen=function(pid){ A._gateClose(); A.open(pid); };
  A.open=function(pid){ try{ if(typeof C.show==='function') C.show(); }catch(e){} S.filter='all'; render(); var el=$('#jfp-'+CSS.escape(pid)); if(el){ el.scrollIntoView({ behavior:'smooth', block:'start' }); el.classList.add('flash'); setTimeout(function(){ el.classList.remove('flash'); }, 2500); } };
  A.pending=pending;
  A.allowWork=async function(){ if(C.admin) return true; if(!S.loaded){ try{ await loadPosts(); }catch(e){ return true; } } var list=pending(); if(!list.length) return true; toast('📣 '+list.length+' post'+(list.length===1?'':'s')+' need your action before you can start.'); gateOverlay(list); return false; };

  /* ── modal + styles + boot ────────────────────────────────────────────────── */
  function modal(html, bare){ var m=$('#jf-modal'); if(!m){ m=document.createElement('div'); m.id='jf-modal'; m.onclick=function(e){ if(e.target===m) closeModal(); }; document.body.appendChild(m); } m.innerHTML='<div class="jf-mbox'+(bare?' bare':'')+'">'+(bare?'':'<button type="button" class="jf-x abs" onclick="JMBFeed._close()">✕</button>')+html+'</div>'; m.style.display='flex'; }
  function closeModal(){ var m=$('#jf-modal'); if(m) m.style.display='none'; } A._close=closeModal;
  function realtime(){
    try{ var lib=window.supabase||window.Supabase; if(!lib||!lib.createClient||S.rt) return; var cl=lib.createClient(C.supaUrl, C.supaKey);
      S.rt=cl.channel('jmb-feed').on('postgres_changes',{ event:'*', schema:'public', table:'feed_posts' },function(){ A.refresh(false); })
        .on('postgres_changes',{ event:'INSERT', schema:'public', table:'feed_comments' },function(pl){ var c=pl.new; if(!c) return; if(S.comments[c.post_id] && !S.comments[c.post_id].some(function(x){ return x.id===c.id; })) S.comments[c.post_id].push(c); var p=S.posts.filter(function(x){ return x.id===c.post_id; })[0]; if(p && String(c.employee_id).toUpperCase()!==myId()){ p.counts=p.counts||{}; p.counts.comments=(p.counts.comments||0)+1; rerender(p.id); } })
        .on('postgres_changes',{ event:'*', schema:'public', table:'feed_reactions' },function(pl){ var r=pl.new||pl.old; if(r && String(r.employee_id).toUpperCase()!==myId()) A.refresh(false); }).subscribe(); }catch(e){}
  }
  var _rfT=0;
  A.refresh=async function(force){ if(!force && Date.now()-_rfT<4000) return; _rfT=Date.now(); try{ var openC=Object.keys(S.open).filter(function(k){ return k.indexOf('c:')===0 && S.open[k]; }); await loadPosts(); render(); openC.forEach(function(k){ var pid=k.slice(2); loadComments(pid).then(function(){ rerender(pid); }); }); }catch(e){ if(!S.loaded){ var root=C.mount&&$(C.mount); if(root) root.innerHTML='<div class="jf"><div class="jf-empty">The feed is not set up yet (run FEED_setup.sql in Supabase) or is unreachable.<br><small>'+E(e.message)+'</small></div></div>'; } } };
  A.init=function(cfg){ Object.assign(C, cfg||{}); if(S.mounted){ render(); return A.refresh(true); } S.mounted=true; try{ S.lastSeen=parseInt(localStorage.getItem('jf_seen_'+myId()),10)||0; }catch(e){} injectCss(); render(); A.refresh(true).then(realtime); if(!S.poll) S.poll=setInterval(function(){ if(!document.hidden) A.refresh(false); }, 90*1000); document.addEventListener('visibilitychange', function(){ if(!document.hidden) A.refresh(false); }); return Promise.resolve(); };
  A.unread=unreadCount; A.state=S;
  function injectCss(){ if($('#jf-css')) return; var st=document.createElement('style'); st.id='jf-css'; st.textContent=CSS_TEXT; document.head.appendChild(st); }
  var CSS_TEXT='.jf{--jo:#ff6b1a;--jo2:#f1560f;--jv:#7c3aed;--ink:#0f172a;--ink2:#475569;--ink3:#8a93a3;--line:rgba(15,23,42,.09);--card:#fff;max-width:760px;margin:0 auto;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}'+
  '.jf *{box-sizing:border-box}.jf a{color:var(--jv);text-decoration:none;cursor:pointer}.jf .muted{color:var(--ink3)}'+
  '.jf-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px}.jf-tabs{display:flex;gap:6px}.jf-tabs button{border:1px solid var(--line);background:var(--card);color:var(--ink2);border-radius:999px;padding:8px 14px;font:700 13px Inter,sans-serif;cursor:pointer}.jf-tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink)}.jf-tabs button i{font-style:normal;background:#f43f5e;color:#fff;border-radius:9px;padding:0 6px;margin-left:4px;font-size:11px}'+
  '.jf-btn{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:10px 14px;font:800 13.5px Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px}.jf-btn.pri{background:linear-gradient(135deg,var(--jo),var(--jo2));color:#fff;border-color:transparent;box-shadow:0 10px 22px -12px rgba(241,86,15,.8)}.jf-btn.sm{padding:7px 11px;font-size:12.5px;border-radius:10px}.jf-btn.w{width:100%;justify-content:center}.jf-btn.danger{color:#be123c}.jf-btn.req{background:#0f172a;color:#fff;border-color:#0f172a;padding:12px 18px;font-size:14px}.jf-btn:disabled{opacity:.55}'+
  '.jf-post{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 16px 10px;margin-bottom:14px;box-shadow:0 12px 34px -28px rgba(15,23,42,.45)}.jf-post.need{border-color:rgba(241,86,15,.45);box-shadow:0 0 0 3px rgba(241,86,15,.08)}.jf-post.flash{animation:jfflash 1.2s ease 2}@keyframes jfflash{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)}50%{box-shadow:0 0 0 6px rgba(124,58,237,.25)}}'+
  '.jf-ph{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}.jf-av{width:42px;height:42px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#ff6b1a,#8b5cf6);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex:none;overflow:hidden}.jf-av img{width:100%;height:100%;object-fit:cover}.jf-av.sm{width:30px;height:30px;font-size:11px}.jf-pm{flex:1;min-width:0}.jf-pn2{font-weight:800;font-size:14.5px}.jf-adm{display:inline-block;background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 6px;font-size:10.5px;font-weight:800;vertical-align:1px;margin-left:4px}.jf-pt{font-size:12px;color:var(--ink3)}'+
  '.jf-chip{border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800}.jf-chip.pin{background:#fffbeb;color:#b45309}.jf-chip.req{background:#fff1f2;color:#be123c}.jf-chip.req.off{background:#f1f5f9;color:#64748b}'+
  '.jf-title{font-size:18px;font-weight:800;margin:4px 0 6px;line-height:1.25}.jf-body{font-size:15px;line-height:1.55;color:#1e293b;white-space:normal;word-break:break-word;margin-bottom:10px}'+
  '.jf-grid{display:grid;gap:4px;border-radius:12px;overflow:hidden;margin-bottom:10px}.jf-grid.n1{grid-template-columns:1fr}.jf-grid.n2{grid-template-columns:1fr 1fr}.jf-grid.n3,.jf-grid.n4{grid-template-columns:1fr 1fr}.jf-img{display:block;position:relative;background:#f1f5f9;aspect-ratio:4/3}.jf-grid.n1 .jf-img{aspect-ratio:auto;max-height:520px}.jf-img img{width:100%;height:100%;object-fit:cover;display:block}.jf-grid.n1 .jf-img img{object-fit:contain;max-height:520px}.jf-more{position:absolute;inset:0;background:rgba(15,23,42,.5);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800}'+
  '.jf-files{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.jf-file{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:9px 12px;color:var(--ink)}.jf-ext{background:#0f172a;color:#fff;border-radius:7px;padding:3px 7px;font-size:10.5px;font-weight:800;text-transform:uppercase;flex:none}.jf-fn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;font-size:13.5px}.jf-fs{color:var(--ink3);font-size:12px}'+
  '.jf-vid{position:relative;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:16/9;margin-bottom:10px}.jf-vid.tall{aspect-ratio:4/3;background:#fff;border:1px solid var(--line)}.jf-vid iframe,.jf-vid video{position:absolute;inset:0;width:100%;height:100%;border:0}.jf-watched{position:absolute;left:10px;top:10px;background:#16a34a;color:#fff;font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:999px;box-shadow:0 4px 14px -6px rgba(0,0,0,.5);pointer-events:none}.jf-open{position:absolute;right:8px;bottom:8px;background:#0f172a;color:#fff;border-radius:8px;padding:5px 9px;font-size:11.5px;font-weight:800}.jf-link{display:block;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:10px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
  '.jf-poll{border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;background:#fbfbfd}.jf-pq{font-weight:800;margin-bottom:8px}.jf-po{position:relative;display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:1px solid var(--line);background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:6px;font:600 14px Inter,sans-serif;cursor:pointer;overflow:hidden}.jf-po.sel{border-color:var(--jv);background:#f5f3ff}.jf-cb{width:16px;height:16px;border:2px solid var(--ink3);border-radius:5px;flex:none}.jf-po.sel .jf-cb{background:var(--jv);border-color:var(--jv)}.jf-po.res{cursor:default}.jf-po.res.mine{border-color:var(--jv)}.jf-bar{position:absolute;left:0;top:0;bottom:0;background:#ede9fe;z-index:0}.jf-pot,.jf-pop{position:relative;z-index:1}.jf-pot{flex:1}.jf-pop{font-weight:800;color:var(--jv)}.jf-pn{font-size:12px;color:var(--ink3);margin-top:4px}'+
  '.jf-quizinfo{font-size:12.5px;color:var(--ink2);background:#f8fafc;border-radius:10px;padding:8px 10px;margin-bottom:10px}.jf-act{margin:4px 0 8px}.jf-done{display:inline-block;background:#ecfdf5;color:#047857;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px}.jf-done.muted{background:#f1f5f9;color:#64748b}.jf-req-note{font-size:12.5px;color:#be123c;font-weight:700;margin-top:6px}'+
  '.jf-rxbar{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--line);padding-top:8px;flex-wrap:wrap}.jf-rxsum{display:flex;align-items:center;gap:2px;font-size:14px;cursor:pointer;color:var(--ink2)}.jf-rxsum b{margin-left:6px;font-size:13px}.jf-rxpick{display:flex;gap:2px}.jf-rx{border:none;background:none;font-size:20px;padding:4px 6px;border-radius:10px;cursor:pointer;line-height:1;position:relative;transition:transform .12s}.jf-rx:hover{transform:scale(1.25)}.jf-rx.on{background:#fff1e9;box-shadow:inset 0 0 0 2px rgba(241,86,15,.5)}.jf-rx i{position:absolute;right:-2px;top:-4px;font-style:normal;font-size:10px;font-weight:800;background:#0f172a;color:#fff;border-radius:8px;padding:0 4px}'+
  '.jf-cwrap{border-top:1px solid var(--line);margin-top:8px;padding-top:6px}.jf-ctog{border:none;background:none;color:var(--ink2);font:700 13px Inter,sans-serif;cursor:pointer;padding:6px 0}.jf-clist{margin:6px 0}.jf-cload{color:var(--ink3);font-size:13px;padding:6px 0}.jf-c{display:flex;gap:8px;margin:8px 0}.jf-c.reply{margin-left:38px}.jf-cb2{flex:1;min-width:0}.jf-cbub{background:#f1f5f9;border-radius:14px;padding:8px 12px;font-size:14px;line-height:1.45;display:inline-block;max-width:100%;word-break:break-word}.jf-cbub b{display:block;font-size:12.5px;margin-bottom:1px}.jf-cmeta{display:flex;gap:12px;font-size:12px;color:var(--ink3);padding:3px 10px}.jf-cmeta a{font-weight:700;color:var(--ink3)}.jf-cmeta a.on{color:var(--jo2)}'+
  '.jf-compose{display:flex;gap:8px;align-items:flex-end;margin-top:8px}.jf-cin{flex:1;background:#f1f5f9;border-radius:16px;padding:6px 12px}.jf-cin textarea{width:100%;border:none;background:none;resize:none;font:14px/1.4 Inter,sans-serif;outline:none;padding:4px 0;max-height:140px}.jf-replying{font-size:11.5px;color:var(--ink3);padding-bottom:4px}.jf-sendc{border:none;background:var(--jo2);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:15px;flex:none}'+
  '.jf-admbar{display:flex;gap:6px;flex-wrap:wrap;border-top:1px dashed var(--line);margin-top:8px;padding-top:8px}.jf-stats{font-size:12.5px;color:var(--ink2);background:#f8fafc;border-radius:10px;padding:8px 10px;margin-top:8px;line-height:1.6}.jf-stats i{font-style:normal;color:var(--ink3)}'+
  '.jf-empty{text-align:center;color:var(--ink3);padding:36px 12px;font-size:14px}.jf-draft{background:#fffbeb;color:#92400e;border:1px solid #fcd34d;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:700;margin-bottom:10px}.jf-draft a{color:#b45309;text-decoration:underline}'+
  '.jf-cmp{background:var(--card);border:1px solid rgba(124,58,237,.3);border-radius:18px;padding:16px;margin-bottom:14px;box-shadow:0 20px 50px -30px rgba(124,58,237,.5)}.jf-cmph{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:16px}.jf-x{border:none;background:#f1f5f9;width:30px;height:30px;border-radius:50%;cursor:pointer;font-weight:800}.jf-x.abs{position:absolute;right:10px;top:10px;z-index:2}.jf-in{width:100%;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font:14px Inter,sans-serif;background:#fbfbfd;margin-bottom:8px;outline:none}.jf-in:focus{border-color:var(--jv)}textarea.jf-in{resize:vertical;min-height:90px}.jf-row{margin-bottom:10px}.jf-lab{display:block;font-size:12px;font-weight:800;color:var(--ink2);margin-bottom:6px;letter-spacing:.02em}.jf-hint{font-size:12px;color:var(--ink3);margin-top:4px}.jf-seg{display:flex;gap:6px;flex-wrap:wrap}.jf-seg button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 12px;font:700 12.5px Inter,sans-serif;cursor:pointer}.jf-seg button.on{background:#0f172a;color:#fff;border-color:#0f172a}'+
  '.jf-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.jf-chip2{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:700;cursor:pointer;background:#fff}.jf-chip2 input{margin:0;accent-color:#7c3aed}.jf-chip2.on{background:#f5f3ff;border-color:rgba(124,58,237,.5)}.jf-chip2 i{font-style:normal;color:var(--ink3)}'+
  '.jf-attach{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.jf-attach .jf-in{flex:1;min-width:220px;margin:0}.jf-mlist{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.jf-mi{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:10px;padding:5px 8px;font-size:12px;max-width:260px}.jf-mi img{width:36px;height:36px;object-fit:cover;border-radius:6px}.jf-mn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}.jf-up{color:#b45309;font-weight:700}.jf-mi a{color:#be123c;font-weight:800}'+
  '.jf-pol{display:flex;gap:6px;align-items:center}.jf-pol .jf-in{margin-bottom:6px}.jf-pol a{color:#be123c;font-weight:800}.jf-ck{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;margin-right:14px}.jf-ck input[type=number]{border:1px solid var(--line);border-radius:8px;padding:5px 8px;font:inherit}.jf-opts{display:flex;flex-wrap:wrap;gap:6px}'+
  '.jf-qe{border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px;background:#fbfbfd}.jf-qeh{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}.jf-qeh a{color:#be123c;font-weight:700;font-size:12px}.jf-qoe{display:flex;gap:6px;align-items:center}.jf-qoe .jf-in{margin-bottom:6px}.jf-qoe input[type=radio]{accent-color:#047857;width:18px;height:18px;margin:0 0 6px}.jf-qoe a{color:#be123c;font-weight:800;margin-bottom:6px}'+
  '#jf-modal{position:fixed;inset:0;z-index:9960;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:16px}.jf-mbox{position:relative;background:#fff;color:#0f172a;border-radius:18px;padding:22px 18px 18px;width:100%;max-width:520px;max-height:90vh;overflow:auto;font-family:Inter,system-ui,sans-serif}.jf-mbox.bare{background:transparent;padding:0;max-width:96vw;text-align:center}.jf-zoom{max-width:96vw;max-height:90vh;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,.6)}.jf-mt{font-size:18px;font-weight:800;margin-bottom:4px;padding-right:30px}.jf-qsub{font-size:12.5px;color:#64748b;margin-bottom:12px}.jf-wrow{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(15,23,42,.06);font-size:14px}.jf-wrow span{flex:1}'+
  '.jf-q{border:1px solid rgba(15,23,42,.09);border-radius:12px;padding:10px 12px;margin-bottom:10px}.jf-q.ok{border-color:#34d399;background:#f0fdf4}.jf-q.bad{border-color:#fb7185;background:#fff1f2}.jf-qq{font-weight:800;margin-bottom:6px;font-size:14px}.jf-qo{display:flex;align-items:center;gap:8px;padding:6px 4px;font-size:14px;cursor:pointer}.jf-qo input{accent-color:#7c3aed;width:18px;height:18px;margin:0}.jf-qres{border-radius:12px;padding:12px;margin-bottom:12px;font-size:14px}.jf-qres.ok{background:#ecfdf5;color:#047857}.jf-qres.bad{background:#fff1f2;color:#be123c}'+
  '#jf-gate{position:fixed;inset:0;z-index:9955;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px}.jf-gbox{background:#fff;color:#0f172a;border-radius:20px;padding:20px 18px;width:100%;max-width:460px;box-shadow:0 30px 80px -30px rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif}.jf-gh{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}.jf-gt{font-size:20px;font-weight:800}.jf-gs{font-size:13px;color:#475569;margin-top:2px}.jf-glist{display:flex;flex-direction:column;gap:8px}.jf-gi{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(15,23,42,.09);border-radius:12px;padding:10px 12px}.jf-gm{font-size:12px;color:#be123c;font-weight:700;margin-top:2px}'+
  '#jf-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#0f172a;color:#fff;border-radius:999px;padding:10px 16px;font:700 13px Inter,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s;z-index:9970;max-width:90vw;text-align:center}#jf-toast.on{opacity:1}'+
  '@media (max-width:640px){.jf-post{padding:12px 12px 8px;border-radius:14px}.jf-title{font-size:16.5px}.jf-body{font-size:14.5px}.jf-rx{font-size:18px;padding:4px 4px}.jf-c.reply{margin-left:28px}.jf-opts{flex-direction:column}}';
  window.JMBFeed=A;
})();
