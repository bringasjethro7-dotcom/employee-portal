/* JMB portal games module (Tetris and friends). Moved out of index.html so browsers cache it; loaded in the same spot. */
(function(){
  var W=10, H=20;
  var COLORS=[null,'#22d3ee','#facc15','#a855f7','#22c55e','#ef4444','#3b82f6','#f97316']; // I O T S Z J L
  // Which unlockable BLOCK DESIGN (render style) is equipped. Costs live in DESIGNS (defined near block()).
  var EQUIPPED='classic';
  function applyTheme(id){
    var want = (id && typeof DESIGNS!=='undefined' && DESIGNS[id]) ? id : 'classic';
    // Rank-locked flagships (e.g. JMB Inferno) only apply once the server wallet confirms ownership,
    // so a spoofed/stale cache can't keep a skin after the rank is lost.
    var blocked = !!(DESIGNS[want] && DESIGNS[want].req && !(typeof _tetWallet!=='undefined' && _tetWallet && _tetWallet.owned && _tetWallet.owned.indexOf(want)>=0));
    EQUIPPED = blocked ? 'classic' : want;
    // Persist ONLY a confirmed choice — never clobber the saved design with the temporary fallback,
    // so a rank-locked skin comes right back once the wallet loads (no reset on refresh/update).
    try{ if(!blocked) localStorage.setItem('tetDesign', want); }catch(e){}
  }
  try{ applyTheme(localStorage.getItem('tetDesign')||'classic'); }catch(e){}
  // Restore the equipped skin ASAP after any reload — fetch the wallet without waiting for the
  // dashboard to open, so a rank-locked design doesn't sit on Classic after an update.
  (function bootWallet(){ try{ if(typeof loadWallet==='function' && typeof eid==='function' && eid()){ loadWallet(); return; } }catch(e){} setTimeout(bootWallet, 2500); })();

  // ══════════ COSMETICS: board background · line-clear FX · sound pack · flair ══════════
  // Cached locally so the look is instant on load; the server is the source of truth for
  // what you actually OWN (see loadCosmetics).
  var COS={ bg:'classic', fx:'spark', sfx:'arcade', frame:'none', title:'rookie' };
  function applyCos(eq){
    if(!eq) return;
    ['bg','fx','sfx','frame','title'].forEach(function(k){ if(eq[k]) COS[k]=eq[k]; });
    try{ localStorage.setItem('tetCos', JSON.stringify(COS)); }catch(e){}
  }
  try{ var _sc=localStorage.getItem('tetCos'); if(_sc) applyCos(JSON.parse(_sc)); }catch(e){}

  // ── Board backgrounds. Painted onto the canvas under the grid, so they work with every skin. ──
  var BOARD_BGS={
    /* ── NIGHTWEB — the Night Suit's home turf. Near-black with the suit's blue/red corner
       glow, one great silver web across the top corner, and a small spider on a thread. All
       static paint (cached like every board), so it costs nothing per frame. */
    nightweb:function(c,w,h){
      var g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#0c0c15'); g.addColorStop(.6,'#08070e'); g.addColorStop(1,'#050408');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      var gb=c.createRadialGradient(0,0,1,0,0,w*0.9); gb.addColorStop(0,'rgba(60,100,255,.11)'); gb.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=gb; c.fillRect(0,0,w,h);
      var gr=c.createRadialGradient(w,h,1,w,h,w*1.0); gr.addColorStop(0,'rgba(225,29,46,.13)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=gr; c.fillRect(0,0,w,h);
      c.save();
      var ox=w, oy=0, R=Math.max(w,h)*0.7;
      c.strokeStyle='rgba(205,215,240,.10)'; c.lineWidth=Math.max(1,w*0.0045);
      for(var i=0;i<=6;i++){ var a=Math.PI/2 + (Math.PI/2)*(i/6);
        c.beginPath(); c.moveTo(ox,oy); c.lineTo(ox+Math.cos(a)*R, oy-Math.sin(a)*R*-1); c.stroke(); }
      for(var r2=0.16;r2<=0.94;r2+=0.156){
        c.beginPath(); c.arc(ox,oy,R*r2,Math.PI/2,Math.PI); c.stroke(); }
      c.strokeStyle='rgba(225,235,255,.16)';
      c.beginPath(); c.arc(ox,oy,R*0.472,Math.PI/2,Math.PI); c.stroke();
      [[0.62,0.30],[0.79,0.55],[0.66,0.72]].forEach(function(p){
        c.fillStyle='rgba(230,238,255,.28)';
        c.beginPath(); c.arc(ox-w*p[0]*0.5, oy+h*p[1]*0.28, Math.max(1,w*0.004),0,6.283); c.fill(); });
      c.strokeStyle='rgba(205,215,240,.14)'; c.lineWidth=Math.max(1,w*0.003);
      c.beginPath(); c.moveTo(w*0.14,0); c.lineTo(w*0.14,h*0.20); c.stroke();
      var sx=w*0.14, sy=h*0.205, ss=Math.max(3,w*0.016);
      c.fillStyle='rgba(225,29,46,.34)';
      c.beginPath(); c.ellipse(sx,sy,ss*0.5,ss*0.8,0,0,7); c.fill();
      c.strokeStyle='rgba(225,29,46,.30)'; c.lineWidth=Math.max(1,ss*0.16); c.lineCap='round';
      [[-0.9,-0.7],[-1.1,0.1],[-0.9,0.9],[0.9,-0.7],[1.1,0.1],[0.9,0.9]].forEach(function(l){
        c.beginPath(); c.moveTo(sx,sy); c.lineTo(sx+l[0]*ss, sy+l[1]*ss); c.stroke(); });
      c.restore(); },
    /* ── LIGHT BOARDS ──
       Every board until now was dark, because most skins glow and glow needs darkness. A light
       board is a different game: the block edges carry the shape instead of the light, so these
       are built with real contrast at the grid lines rather than a pale wash that would leave
       pieces floating. Pair them with the solid skins — Pilipinas, Sticker, Origami, Blueprint —
       rather than with Kiln or Prisma, which are drawn to emit light. */
    paper:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#fffdf7'); g.addColorStop(1,'#f3ece0');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      c.save(); c.strokeStyle='rgba(120,100,70,.10)'; c.lineWidth=1;
      for(var y=0;y<=h;y+=w/10){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(w,y+.5); c.stroke(); }
      c.strokeStyle='rgba(200,60,60,.16)'; c.beginPath(); c.moveTo(w*0.12,0); c.lineTo(w*0.12,h); c.stroke();
      c.restore(); },

    studio:function(c,w,h){ c.fillStyle='#ffffff'; c.fillRect(0,0,w,h);
      var v=c.createRadialGradient(w/2,h*0.32,0,w/2,h*0.32,h*0.9);
      v.addColorStop(0,'rgba(255,255,255,0)'); v.addColorStop(1,'rgba(15,23,42,.13)');
      c.fillStyle=v; c.fillRect(0,0,w,h);
      c.save(); c.strokeStyle='rgba(15,23,42,.07)'; c.lineWidth=1;
      for(var x=0;x<=w;x+=w/10){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,h); c.stroke(); }
      c.restore(); },

    blueprint:function(c,w,h){ c.fillStyle='#eef4fb'; c.fillRect(0,0,w,h);
      c.save(); var u=w/10;
      c.strokeStyle='rgba(37,99,235,.13)'; c.lineWidth=1;
      for(var x=0;x<=w;x+=u/2){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,h); c.stroke(); }
      for(var y=0;y<=h;y+=u/2){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(w,y+.5); c.stroke(); }
      c.strokeStyle='rgba(37,99,235,.28)'; c.lineWidth=1.4;
      for(var x2=0;x2<=w;x2+=u){ c.beginPath(); c.moveTo(x2+.5,0); c.lineTo(x2+.5,h); c.stroke(); }
      for(var y2=0;y2<=h;y2+=u){ c.beginPath(); c.moveTo(0,y2+.5); c.lineTo(w,y2+.5); c.stroke(); }
      c.restore(); },

    linen:function(c,w,h){ c.fillStyle='#f7f4ee'; c.fillRect(0,0,w,h);
      c.save(); c.globalAlpha=.5;
      for(var i=0;i<h;i+=3){ c.fillStyle=(i%6)?'rgba(160,150,132,.07)':'rgba(255,255,255,.5)'; c.fillRect(0,i,w,1.5); }
      for(var j=0;j<w;j+=3){ c.fillStyle=(j%6)?'rgba(160,150,132,.05)':'rgba(255,255,255,.35)'; c.fillRect(j,0,1.5,h); }
      c.restore();
      var vg=c.createLinearGradient(0,0,0,h); vg.addColorStop(0,'rgba(120,110,90,.05)'); vg.addColorStop(1,'rgba(120,110,90,.14)');
      c.fillStyle=vg; c.fillRect(0,0,w,h); },

    sakura:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#fff6f8'); g.addColorStop(.6,'#fdeaf0'); g.addColorStop(1,'#f6dde6');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      c.save();
      for(var i=0;i<26;i++){
        var px=((i*137)%w), py=((i*211)%h), rr2=w*0.012+((i%3)*w*0.006);
        c.globalAlpha=0.12+((i%4)*0.05); c.fillStyle='#e8749b';
        c.beginPath(); c.ellipse(px,py,rr2,rr2*0.62,(i%7)*0.5,0,6.283); c.fill();
      }
      c.restore(); },

    mint:function(c,w,h){ var g=c.createLinearGradient(0,0,w,h);
      g.addColorStop(0,'#f2fbf7'); g.addColorStop(.55,'#e6f6ef'); g.addColorStop(1,'#dcf0e6');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      var gl=c.createRadialGradient(w*0.78,h*0.18,0,w*0.78,h*0.18,w*0.9);
      gl.addColorStop(0,'rgba(255,255,255,.75)'); gl.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=gl; c.fillRect(0,0,w,h);
      c.save(); c.strokeStyle='rgba(15,118,110,.10)'; c.lineWidth=1;
      for(var y=0;y<=h;y+=w/10){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(w,y+.5); c.stroke(); }
      c.restore(); },

    /* Pairs with the Pilipinas skin — the flag as a board rather than as a block. Kept pale so the
       pieces still read; the bands sit at the edges, out of the play column. */
    pilipinas:function(c,w,h){ c.fillStyle='#fdfdfd'; c.fillRect(0,0,w,h);
      var b=c.createLinearGradient(0,0,0,h*0.5); b.addColorStop(0,'rgba(0,56,168,.22)'); b.addColorStop(1,'rgba(0,56,168,0)');
      c.fillStyle=b; c.fillRect(0,0,w,h*0.5);
      var r=c.createLinearGradient(0,h,0,h*0.5); r.addColorStop(0,'rgba(206,17,38,.22)'); r.addColorStop(1,'rgba(206,17,38,0)');
      c.fillStyle=r; c.fillRect(0,h*0.5,w,h*0.5);
      c.save(); c.translate(w*0.5,h*0.5); c.globalAlpha=.12;
      for(var k=0;k<8;k++){ c.rotate(6.283/8);
        c.fillStyle='#F0A500'; c.beginPath(); c.moveTo(0,-w*0.02); c.lineTo(w*(k%2?0.20:0.28),0); c.lineTo(0,w*0.02); c.closePath(); c.fill(); }
      c.globalAlpha=.18; c.fillStyle='#F0A500'; c.beginPath(); c.arc(0,0,w*0.045,0,6.283); c.fill();
      c.restore();
      c.save(); c.strokeStyle='rgba(15,23,42,.07)'; c.lineWidth=1;
      for(var x=0;x<=w;x+=w/10){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,h); c.stroke(); }
      c.restore(); },

    /* ── DARK BOARDS ── */
    carbon:function(c,w,h){ c.fillStyle='#0e1013'; c.fillRect(0,0,w,h);
      c.save(); var u=Math.max(4,w/26);
      for(var y=0;y<h;y+=u){ for(var x=0;x<w;x+=u){
        var on=((Math.floor(x/u)+Math.floor(y/u))%2===0);
        c.fillStyle=on?'rgba(255,255,255,.045)':'rgba(0,0,0,.30)';
        c.fillRect(x,y,u*0.92,u*0.92); } }
      c.restore();
      var sheen=c.createLinearGradient(0,0,w,h);
      sheen.addColorStop(0,'rgba(255,255,255,.06)'); sheen.addColorStop(.5,'rgba(255,255,255,0)');
      c.fillStyle=sheen; c.fillRect(0,0,w,h); },

    sandstorm:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#f6e2b8'); g.addColorStop(.55,'#e3bd82'); g.addColorStop(1,'#b8875a');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      c.save();
      for(var i=0;i<7;i++){
        var yy=h*(i/7), amp=h*0.03;
        var band=c.createLinearGradient(0,yy,w,yy+amp);
        band.addColorStop(0,'rgba(255,255,255,.16)'); band.addColorStop(1,'rgba(150,110,70,.12)');
        c.fillStyle=band; c.fillRect(0,yy,w,amp*1.6);
      }
      c.restore(); },

    arcade:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#120726'); g.addColorStop(1,'#05030d'); c.fillStyle=g; c.fillRect(0,0,w,h);
      var gl=c.createRadialGradient(w/2,h,0,w/2,h,h*0.9);
      gl.addColorStop(0,'rgba(236,72,153,.22)'); gl.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=gl; c.fillRect(0,0,w,h);
      c.save(); c.fillStyle='rgba(0,0,0,.30)';
      for(var y=0;y<h;y+=3) c.fillRect(0,y,w,1);
      c.strokeStyle='rgba(34,211,238,.16)'; c.lineWidth=1;
      for(var x=0;x<=w;x+=w/10){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,h); c.stroke(); }
      c.restore(); },
    classic:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#0b1122'); g.addColorStop(1,'#070b16'); c.fillStyle=g; c.fillRect(0,0,w,h); },
    grid:function(c,w,h){ BOARD_BGS.classic(c,w,h);
      c.save(); c.strokeStyle='rgba(120,150,255,.10)'; c.lineWidth=1;
      for(var x=0;x<=w;x+=w/10){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,h); c.stroke(); }
      for(var y=0;y<=h;y+=w/10){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(w,y+.5); c.stroke(); }
      c.restore(); },
    nebula:function(c,w,h){ var g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#150a2e'); g.addColorStop(.55,'#0d0a24'); g.addColorStop(1,'#06060f');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      [[0.25,0.22,'rgba(168,85,247,.30)'],[0.78,0.45,'rgba(59,130,246,.24)'],[0.42,0.80,'rgba(236,72,153,.18)']].forEach(function(o){
        var rg=c.createRadialGradient(w*o[0],h*o[1],0,w*o[0],h*o[1],w*0.75); rg.addColorStop(0,o[2]); rg.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=rg; c.fillRect(0,0,w,h); });
      c.save(); c.fillStyle='rgba(255,255,255,.55)';
      for(var i=0;i<44;i++){ var sx=((i*97)%w), sy=((i*173)%h), s=(i%3)?1:1.8; c.globalAlpha=(i%4)?.45:.85; c.fillRect(sx,sy,s,s); }
      c.restore(); },
    sunset:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#2b1055'); g.addColorStop(.42,'#7b2d6b'); g.addColorStop(.72,'#c2410c'); g.addColorStop(1,'#1a0d12');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      var sun=c.createRadialGradient(w*.5,h*.62,0,w*.5,h*.62,w*.42);
      sun.addColorStop(0,'rgba(255,196,90,.45)'); sun.addColorStop(1,'rgba(255,120,40,0)');
      c.fillStyle=sun; c.fillRect(0,0,w,h); },
    matrix:function(c,w,h){ c.fillStyle='#020a05'; c.fillRect(0,0,w,h);
      c.save(); c.font=Math.round(w/16)+'px monospace'; c.fillStyle='rgba(34,197,94,.30)';
      for(var col=0;col<10;col++){ var x=col*(w/10)+2, n=6+((col*7)%9);
        for(var r=0;r<n;r++){ c.globalAlpha=0.06+((r*col)%7)*0.035; c.fillText(((col+r)%2)?'1':'0', x, ((col*37+r*44)%h)+12); } }
      c.restore(); },
    ocean:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#0e7490'); g.addColorStop(.4,'#075985'); g.addColorStop(1,'#020e1a');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      c.save(); c.strokeStyle='rgba(255,255,255,.07)'; c.lineWidth=2;
      for(var i=1;i<8;i++){ var yy=h*i/8; c.beginPath(); c.moveTo(0,yy);
        for(var x2=0;x2<=w;x2+=12){ c.lineTo(x2, yy+Math.sin((x2/w)*6.3+i)*5); } c.stroke(); }
      c.restore(); },
    synthwave:function(c,w,h){ var g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#12043a'); g.addColorStop(.5,'#3d0a52'); g.addColorStop(1,'#0a0118');
      c.fillStyle=g; c.fillRect(0,0,w,h);
      var hz=h*0.58;
      var sun=c.createLinearGradient(0,hz-w*.28,0,hz); sun.addColorStop(0,'#fbbf24'); sun.addColorStop(1,'#ec4899');
      c.save(); c.beginPath(); c.arc(w/2,hz,w*.26,Math.PI,0); c.closePath(); c.fillStyle=sun; c.fill(); c.restore();
      c.save(); c.strokeStyle='rgba(236,72,153,.42)'; c.lineWidth=1;
      for(var i=0;i<=10;i++){ var x3=(i/10)*w; c.beginPath(); c.moveTo(w/2+(x3-w/2)*0.15, hz); c.lineTo(x3, h); c.stroke(); }
      for(var j=1;j<=7;j++){ var yy2=hz+Math.pow(j/7,2.1)*(h-hz); c.beginPath(); c.moveTo(0,yy2); c.lineTo(w,yy2); c.stroke(); }
      c.restore(); },
    // EARNED at rating 120 — can't be bought.
    aurora:function(c,w,h){ c.fillStyle='#03060f'; c.fillRect(0,0,w,h);
      [[ '#22d3ee', .18, .30 ],[ '#a855f7', .42, .48 ],[ '#22c55e', .66, .36 ]].forEach(function(o,i){
        var g2=c.createLinearGradient(0,h*o[1]-h*.22,0,h*o[1]+h*.22);
        g2.addColorStop(0,'rgba(0,0,0,0)'); g2.addColorStop(.5,o[0]); g2.addColorStop(1,'rgba(0,0,0,0)');
        c.save(); c.globalAlpha=o[2]; c.fillStyle=g2;
        c.beginPath(); c.moveTo(0,h*o[1]);
        for(var x=0;x<=w;x+=10){ c.lineTo(x, h*o[1]+Math.sin(x/w*5+i*2)*h*.05); }
        c.lineTo(w,h*o[1]+h*.2);
        for(var x2=w;x2>=0;x2-=10){ c.lineTo(x2, h*o[1]+h*.2+Math.sin(x2/w*5+i*2)*h*.05); }
        c.closePath(); c.fill(); c.restore(); });
      c.save(); c.fillStyle='rgba(255,255,255,.6)';
      for(var s=0;s<30;s++){ c.globalAlpha=(s%3)?.35:.8; c.fillRect((s*101)%w,(s*61)%h,1,1); }
      c.restore(); }
  };
  // The board background is static per theme, but was being recomputed (several gradients)
  // on EVERY redraw. Cache it to an offscreen canvas and just blit — big win on the bigger board.
  var _bgCache=null, _bgKey='';
  function drawBoardBg(ctx,cv){
    var key=(COS.bg||'classic')+'@'+cv.width+'x'+cv.height;
    if(_bgKey!==key || !_bgCache){
      try{
        _bgCache=document.createElement('canvas'); _bgCache.width=cv.width; _bgCache.height=cv.height;
        var bx=_bgCache.getContext('2d');
        var f=BOARD_BGS[COS.bg]||BOARD_BGS.classic;
        try{ f(bx,cv.width,cv.height); }catch(e){ BOARD_BGS.classic(bx,cv.width,cv.height); }
        _bgKey=key;
      }catch(_e){ _bgCache=null; var f2=BOARD_BGS[COS.bg]||BOARD_BGS.classic; try{ f2(ctx,cv.width,cv.height); }catch(_){}; return; }
    }
    ctx.drawImage(_bgCache,0,0);
  }
  // ── Line-clear effect packs. Each pushes particles; the renderer in draw() honours
  //    shape / gravity / spin / sway / glow so packs actually feel different. ──
  var FX_PACKS={
    spark:function(push,cv,cs,ry){ var pal=['#ffffff','#fbbf24','#22d3ee','#a855f7','#22c55e'];
      for(var k=0;k<16;k++) push({ x:Math.random()*cv.width, y:ry*cs+cs/2, vx:(Math.random()-.5)*7, vy:(Math.random()-1.2)*6,
        life:1, sz:Math.max(3,cs*0.24), color:pal[(k+ry)%pal.length] }); },
    confetti:function(push,cv,cs,ry){ var pal=['#f87171','#fbbf24','#34d399','#60a5fa','#c084fc','#fb923c'];
      for(var k=0;k<24;k++) push({ x:Math.random()*cv.width, y:ry*cs+cs/2, vx:(Math.random()-.5)*8, vy:(Math.random()-1.4)*7,
        life:1.2, sz:Math.max(4,cs*0.3), color:pal[k%pal.length], rot:Math.random()*6.3, vr:(Math.random()-.5)*.4, g:.42, decay:.022 }); },
    embers:function(push,cv,cs,ry){ var pal=['#fde68a','#fb923c','#f97316','#ef4444','#fbbf24'];
      for(var k=0;k<20;k++) push({ x:Math.random()*cv.width, y:ry*cs+cs/2, vx:(Math.random()-.5)*2.2, vy:-(1+Math.random()*2.6),
        life:1.3, sz:Math.max(2,cs*0.16), color:pal[k%pal.length], shape:'circle', g:-.05, decay:.025, glow:10, sway:6 }); },
    snow:function(push,cv,cs,ry){ var pal=['#ffffff','#e0f2fe','#bae6fd'];
      for(var k=0;k<22;k++) push({ x:Math.random()*cv.width, y:ry*cs+cs/2, vx:(Math.random()-.5)*1.6, vy:(Math.random()*1.2)-.2,
        life:1.5, sz:Math.max(2,cs*0.15), color:pal[k%pal.length], shape:'circle', g:.03, decay:.018, glow:6, sway:4 }); },
    bolts:function(push,cv,cs,ry){ var pal=['#22d3ee','#67e8f9','#ffffff','#3b82f6'];
      for(var k=0;k<14;k++) push({ x:Math.random()*cv.width, y:ry*cs+cs/2, vx:(Math.random()-.5)*3, vy:(Math.random()-1.6)*8,
        life:1, sz:Math.max(4,cs*0.34), color:pal[k%pal.length], shape:'streak', g:.55, decay:.035, glow:12 }); },
    petals:function(push,cv,cs,ry){ var pal=['#fbcfe8','#f9a8d4','#f472b6','#fda4af','#fff1f2'];
      for(var k=0;k<20;k++) push({ x:Math.random()*cv.width, y:ry*cs+cs/2, vx:(Math.random()-.5)*3.4, vy:(Math.random()-.9)*4,
        life:1.4, sz:Math.max(3,cs*0.22), color:pal[k%pal.length], shape:'circle', g:.12, decay:.019, sway:5 }); },
    // EARNED at rating 140.
    galaxy:function(push,cv,cs,ry){ var pal=['#c084fc','#818cf8','#22d3ee','#ffffff','#f0abfc'];
      for(var k=0;k<26;k++){ var a=Math.random()*6.283, sp=1+Math.random()*5;
        push({ x:cv.width/2+(Math.random()-.5)*cv.width*.5, y:ry*cs+cs/2, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp*.7,
          life:1.4, sz:Math.max(2,cs*0.18), color:pal[k%pal.length], shape:'circle', g:.02, decay:.02, glow:14, sway:3 }); } }
  };
  // ── Sound packs. One transform in beep() re-voices every SFX and the music. ──
  var SFX_PACKS={
    arcade:function(f,t,v){ return [f,t,v]; },
    retro: function(f,t,v){ return [f*0.75,'square',v]; },
    soft:  function(f,t,v){ return [f,'sine',v*0.65]; },
    hype:  function(f,t,v){ return [f*1.25,(t==='triangle'?'sawtooth':t),Math.min(0.32,v*1.3)]; }
  };
  // SRS spawn matrices (3x3 for JLSTZ, 4x4 for I, 2x2 for O) — enables wall kicks + T-spins
  var PIECES={
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O:[[2,2],[2,2]],
    T:[[0,3,0],[3,3,3],[0,0,0]],
    S:[[0,4,4],[4,4,0],[0,0,0]],
    Z:[[5,5,0],[0,5,5],[0,0,0]],
    J:[[6,0,0],[6,6,6],[0,0,0]],
    L:[[0,0,7],[7,7,7],[0,0,0]]
  };
  var TYPES=['I','O','T','S','Z','J','L'];
  var NEXT_N=5;   // upcoming pieces shown in the Next queue (standard 3–5)
  var CLEAR_MS=130;   // line-clear highlight duration before rows collapse (spec 150–300ms; kept short for snappy feel)
  var STATES={};
  (function(){ for(var i=0;i<TYPES.length;i++){ var t=TYPES[i]; var s=[PIECES[t]]; for(var k=1;k<4;k++) s.push(rotCW(s[k-1])); STATES[t]=s; } })();
  // SRS wall-kick tables (y already flipped to grid-down)
  var KICK_JLSTZ={ '0>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]], '1>0':[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '1>2':[[0,0],[1,0],[1,1],[0,-2],[1,-2]], '2>1':[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '2>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]], '3>2':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '3>0':[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '0>3':[[0,0],[1,0],[1,-1],[0,2],[1,2]] };
  var KICK_I={ '0>1':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]], '1>0':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
    '1>2':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]], '2>1':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
    '2>3':[[0,0],[2,0],[-1,0],[2,-1],[-1,2]], '3>2':[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
    '3>0':[[0,0],[1,0],[-2,0],[1,2],[-2,-1]], '0>3':[[0,0],[-1,0],[2,0],[-1,-2],[2,1]] };
  function getKicks(type,from,to){ if(type==='O') return [[0,0]]; if(type==='I') return KICK_I[from+'>'+to]||[[0,0]]; return KICK_JLSTZ[from+'>'+to]||[[0,0]]; }
  var lobby=null, chan=null, lobbyReady=false, lobbyQueue=[];
  var M=null; // current match state
  var BOT=null; // training bot state
  // Games are only allowed when idle or with no task running (not while actively tracking)
  // Running the IDLE project on the time tracker is downtime — that's precisely what the
  // games are for. Only a real, billable task blocks play.
  function onIdleTask(){
    try{
      return !!(typeof trkRunning!=='undefined' && trkRunning &&
                typeof isIdleProject==='function' && isIdleProject(trkRunning.project));
    }catch(e){ return false; }
  }
  // The SCHEDULED tournaments (3 PM day bracket, nightly, Grand Final) are company events that
  // land inside people's shifts by design. Nobody should have to stop their timer to take part —
  // and once you're IN a bracket, a mid-tournament check must never lock you out of your own
  // match (the bot round would otherwise eliminate anyone who happens to be clocked in).
  function inScheduledTourney(){
    try{
      if(typeof TB!=='undefined' && TB && (TB.nightly || TB.grand)) return true;   // bracket in progress
      if(typeof TL!=='undefined' && TL && TL.nightly) return true;                 // in the lobby
      if(typeof ntIsLive==='function' && ntIsLive(phtNowParts())) return true;     // the join window is open
    }catch(e){}
    return false;
  }
  function canPlayGame(){
    /* HARD TIMER GATE (Aug 2026, his rule): EVERY Tetris feature — duels, 2v2, 3v3, training,
       solo, everything — requires the task timer to be STOPPED first. Playing must never
       overlap tracked productive hours. The ONLY exemption is the scheduled day/night
       tournament (incl. the grand finals), the sanctioned event where the timer keeps running.
       The old check trusted the status text ("online" passed even with a timer running) —
       this one asks the tracker itself, and a timer running on ANOTHER device counts too. */
    if(inScheduledTourney()) return true;
    /* IDLE / LUNCH / MICROBREAK / NO-TASK IS DOWNTIME — games are exactly what it's for (his rule,
       Aug 2026). Lunch, microbreak and no-task all run under the one "Idle (Internal)" project, so
       a timer on the idle project must NOT block play. Only a REAL, billable task does. */
    var running=false;
    try{ running=(typeof trkRunning!=='undefined') && !!trkRunning; }catch(_g){}
    if(running && !onIdleTask()){
      showToast('⏱️ Stop your task timer first — then play. (Idle / lunch / break time can play.)');
      return false;
    }
    return true;
  }
  window.tetCanPlay=canPlayGame;   // exposed for the isolated 2v2/3v3 lobby modules

  // ── Audio engine (Web Audio beeps) ──
  var TAC=null;
  function ac(){ try{ if(!TAC) TAC=new (window.AudioContext||window.webkitAudioContext)(); if(TAC.state==='suspended') TAC.resume(); if(TAC && !TAC._master){ TAC._master=TAC.createGain(); TAC._master.gain.value=1; TAC._master.connect(TAC.destination); } }catch(e){ TAC=null; } return TAC; }
  function beep(freq,dur,type,vol,delay){ var a=ac(); if(!a) return; try{
    // Sound pack re-voices every note (waveform / pitch / level) before it's scheduled.
    var _p=SFX_PACKS[COS.sfx]||SFX_PACKS.arcade;
    var _v=_p(freq, type||'square', (vol||0.14)); freq=_v[0]; type=_v[1]; vol=_v[2];
    var o=a.createOscillator(), g=a.createGain(); var t=a.currentTime+(delay||0);
    o.type=type||'square'; o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||0.14,t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.12));
    o.connect(g); g.connect(a._master||a.destination); o.start(t); o.stop(t+(dur||0.12)+0.03);
  }catch(e){} }
  // sub-bass thump — a pitched sine that drops fast; gives lock/drop/clear real body (bypasses the pack revoicer)
  function thump(f1,f2,dur,vol,delay){ var a=ac(); if(!a) return; try{
    var o=a.createOscillator(), g=a.createGain(); var t=a.currentTime+(delay||0);
    o.type='sine'; o.frequency.setValueAtTime(f1,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(a._master||a.destination); o.start(t); o.stop(t+dur+0.03);
  }catch(e){} }
  function sfxMove(){ beep(320,0.03,'square',0.05); }
  function sfxRot(){ beep(480,0.045,'square',0.06); }
  function sfxLock(){ beep(150,0.07,'triangle',0.11); thump(150,58,0.11,0.16); }              // satisfying thunk
  function sfxDrop(){ beep(150,0.06,'sawtooth',0.09); thump(200,42,0.16,0.24); }              // punchy slam
  function sfxClear(n){ var base=[0,523,659,784,1046][n]||1046; beep(base,0.12,'triangle',0.18); beep(base*1.5,0.14,'triangle',0.16,0.08);
    if(n>=4){ beep(base*2,0.20,'triangle',0.17,0.16); beep(base*2.5,0.22,'triangle',0.14,0.26); thump(170,44,0.42,0.30,0.02); }   // TETRIS! bright triad + sub boom
    else { thump(120,52,0.16,0.13); } }
  function sfxLevelUp(){ if(!ac()) return; [659,880,1109,1319].forEach(function(f,i){ beep(f,0.13,'triangle',0.18,i*0.07); }); thump(120,60,0.3,0.2,0.02); }
  function sfxAttack(){ beep(700,0.06,'square',0.12); beep(500,0.08,'square',0.1,0.05); }
  function sfxGarbage(){ beep(90,0.16,'sawtooth',0.16); }
  function sfxTick(){ beep(880,0.08,'square',0.14); }
  function sfxGo(){ [523,659,784,1046].forEach(function(f,i){ beep(f,0.14,'triangle',0.18,i*0.09); }); }
  function sfxWin(){ [523,659,784,1046,1318,1046,1318].forEach(function(f,i){ beep(f,0.18,'triangle',0.2,i*0.12); }); }
  function sfxLose(){ [440,392,349,294].forEach(function(f,i){ beep(f,0.22,'sawtooth',0.16,i*0.14); }); }
  function sfxInvite(){ beep(784,0.12,'triangle',0.16); beep(1046,0.14,'triangle',0.16,0.12); }
  /* 👑 THE GRAND FINAL ALARM — a ~7-second announcement, not a blip. Three rising siren
     swells with sub-booms, a four-note royal fanfare, then the full chord held with a
     shimmer cascade and a closing boom. Used ONLY when the Grand Final calls the player. */
  function sfxGrandAlarm(){
    var a=ac(); if(!a) return;
    try{
      var t0=a.currentTime, dst=a.destination;
      function sweep(st,f1,f2,dur,vol){ var o=a.createOscillator(),g=a.createGain();
        o.type='sawtooth'; o.frequency.setValueAtTime(f1,t0+st); o.frequency.exponentialRampToValueAtTime(f2,t0+st+dur);
        g.gain.setValueAtTime(0.0001,t0+st); g.gain.exponentialRampToValueAtTime(vol,t0+st+0.05);
        g.gain.exponentialRampToValueAtTime(0.001,t0+st+dur);
        o.connect(g); g.connect(dst); o.start(t0+st); o.stop(t0+st+dur+0.05); }
      function tone(st,f,dur,vol,type,det){ var o=a.createOscillator(),g=a.createGain();
        o.type=type||'square'; if(det) o.detune.value=det; o.frequency.value=f;
        g.gain.setValueAtTime(0.0001,t0+st); g.gain.exponentialRampToValueAtTime(vol,t0+st+0.03);
        g.gain.exponentialRampToValueAtTime(0.001,t0+st+dur);
        o.connect(g); g.connect(dst); o.start(t0+st); o.stop(t0+st+dur+0.05); }
      function boom(st){ var o=a.createOscillator(),g=a.createGain(); o.type='sine';
        o.frequency.setValueAtTime(150,t0+st); o.frequency.exponentialRampToValueAtTime(40,t0+st+0.5);
        g.gain.setValueAtTime(0.0001,t0+st); g.gain.exponentialRampToValueAtTime(0.7,t0+st+0.02);
        g.gain.exponentialRampToValueAtTime(0.001,t0+st+0.8);
        o.connect(g); g.connect(dst); o.start(t0+st); o.stop(t0+st+0.85); }
      sweep(0.0,220,880,0.7,0.22); boom(0.0);                        // ── the alarm rises…
      sweep(0.9,220,880,0.7,0.24); boom(0.9);
      sweep(1.8,220,1174.7,0.8,0.26); boom(1.8);
      [392,523.3,659.3,784].forEach(function(f,i){                   // ── the royal fanfare
        tone(2.7+i*0.35,f,0.42,0.16,'sawtooth',6); tone(2.7+i*0.35,f/2,0.42,0.12,'square'); });
      [523.3,659.3,784,1046.5].forEach(function(f){ tone(4.6,f,2.3,0.10,'sawtooth',5); });   // ── the arrival
      [1046.5,1318.5,1568,2093].forEach(function(f,i){ tone(4.9+i*0.22,f,0.5,0.09,'triangle'); });
      boom(4.6); boom(6.4);
    }catch(e){}
  }
  // Cute "pop-in" jingle when the Tetris dashboard opens — a bouncy little arpeggio + sparkle.
  function sfxHubOpen(){
    var a=ac(); if(!a) return;
    try{
      [[659,0.00],[988,0.06],[1319,0.12]].forEach(function(n){ beep(n[0],0.12,'triangle',0.15,n[1]); }); // E-B-E bounce up
      beep(1047,0.09,'sine',0.10,0.15);       // little "boop"
      beep(1760,0.09,'sine',0.11,0.24);       // twinkle
      beep(2637,0.12,'sine',0.08,0.30);       // high sparkle tail
    }catch(_){}
  }
  // ── Announcer voice: a synthesized "K-OOOO!" shout on a knockout ──
  // Built entirely in Web Audio (no audio file): a short filtered-noise burst for the hard "K"
  // plosive, then a sustained sawtooth "glottal source" pushed through two band-pass formant
  // filters tuned to the /u/ ("oo") vowel, with vibrato + a shout pitch-contour and a little grit.
  var _koVoice=null, _koVoiceReady=false;
  function _pickKoVoice(){
    try{
      var vs=(window.speechSynthesis&&window.speechSynthesis.getVoices())||[];
      if(!vs.length) return null;
      var en=vs.filter(function(v){ return /^en/i.test(v.lang); });
      // Prefer a punchy US English voice; a male one if we can spot it by name.
      var male=en.filter(function(v){ return /(male|david|daniel|alex|fred|google us english|mark|guy)/i.test(v.name); });
      return male[0] || en.filter(function(v){ return /en[-_]us/i.test(v.lang); })[0] || en[0] || vs[0];
    }catch(_){ return null; }
  }
  // A bright, cute FEMALE voice for the combo hype-woman.
  var _girlVoice=null;
  function _pickGirlVoice(){
    try{
      var vs=(window.speechSynthesis&&window.speechSynthesis.getVoices())||[];
      if(!vs.length) return null;
      var en=vs.filter(function(v){ return /^en/i.test(v.lang); });
      var fem=en.filter(function(v){ return /(female|samantha|victoria|karen|moira|tessa|zira|susan|fiona|serena|allison|ava|zoe|google uk english female|google us english)/i.test(v.name); });
      return fem[0] || en.filter(function(v){ return /en[-_]us/i.test(v.lang); })[0] || en[0] || vs[0];
    }catch(_){ return null; }
  }
  try{ if(window.speechSynthesis){ window.speechSynthesis.onvoiceschanged=function(){ _koVoice=_pickKoVoice(); _girlVoice=_pickGirlVoice(); _koVoiceReady=true; }; _koVoice=_pickKoVoice(); _girlVoice=_pickGirlVoice(); if(_koVoice) _koVoiceReady=true; } }catch(_){}
  // Shared announcer voice — a real voice via the browser speech engine. Pass a voice to override.
  // Spoken voices (KO / win-lose / combo) are DISABLED — sound effects and music remain.
  function voiceKO(){}
  function voiceResult(){}
  // Combo hype-woman — a cute high female voice calling escalating praise as the chain grows.
  var _comboWords=['Nice','Good','Great','Cool','Awesome','Excellent','Amazing','Fantastic','Incredible','Unstoppable','Legendary','Godlike'];
  var _lastComboSpoke=0;
  function voiceCombo(){}   // spoken combo praise disabled
  // Robotic "K-O": a hard "K" click, then two monotone vowel syllables run through a ring
  // modulator (a low square carrier multiplying the signal) → that classic buzzy robot timbre.
  function voiceKOsynth(){
    var a=ac(); if(!a) return;
    try{
      var t0=a.currentTime;
      var out=a.createGain(); out.gain.value=0.95; out.connect(a.destination);
      // "K" plosive — a 55ms noise burst that decays fast
      var len=Math.floor(a.sampleRate*0.055);
      var nb=a.createBuffer(1,len,a.sampleRate), d=nb.getChannelData(0);
      for(var i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2); }
      var ns=a.createBufferSource(); ns.buffer=nb;
      var nf=a.createBiquadFilter(); nf.type='highpass'; nf.frequency.value=1100;
      var ng=a.createGain();
      ng.gain.setValueAtTime(0.0001,t0);
      ng.gain.exponentialRampToValueAtTime(0.8,t0+0.006);
      ng.gain.exponentialRampToValueAtTime(0.0001,t0+0.05);
      ns.connect(nf); nf.connect(ng); ng.connect(out);
      ns.start(t0); ns.stop(t0+0.055);
      // "OOOO" vowel — starts right after the K, ~0.62s, shouted
      var vs=t0+0.045, vd=0.62;
      var env=a.createGain();
      env.gain.setValueAtTime(0.0001,vs);
      env.gain.exponentialRampToValueAtTime(1.0,vs+0.05);
      env.gain.setValueAtTime(1.0,vs+0.40);
      env.gain.exponentialRampToValueAtTime(0.0001,vs+vd);
      // gentle grit via waveshaper
      var shp=a.createWaveShaper(), cur=new Float32Array(1024);
      for(var k=0;k<1024;k++){ var x=k/1024*2-1; cur[k]=Math.tanh(x*2.2); }
      shp.curve=cur; shp.connect(env); env.connect(out);
      function formant(freq,q,g){ var f=a.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q; var gg=a.createGain(); gg.gain.value=g; f.connect(gg); gg.connect(shp); return f; }
      var src=a.createGain();
      var f1=formant(360,7,1.0), f2=formant(780,9,0.55);   // /u/ formants
      src.connect(f1); src.connect(f2);
      var g1=a.createOscillator(), g2=a.createOscillator();
      g1.type='sawtooth'; g2.type='sawtooth'; g2.detune.value=-9;
      [g1,g2].forEach(function(o){
        o.frequency.setValueAtTime(150,vs);
        o.frequency.linearRampToValueAtTime(205,vs+0.13);   // punch up
        o.frequency.setValueAtTime(205,vs+0.40);
        o.frequency.exponentialRampToValueAtTime(120,vs+vd); // fall off at the end
        o.connect(src);
      });
      var vib=a.createOscillator(), vibg=a.createGain();
      vib.frequency.value=6.2; vibg.gain.value=6;
      vib.connect(vibg); vibg.connect(g1.frequency); vibg.connect(g2.frequency);
      g1.start(vs); g2.start(vs); vib.start(vs);
      g1.stop(vs+vd+0.05); g2.stop(vs+vd+0.05); vib.stop(vs+vd+0.05);
    }catch(e){}
  }
  // Combo: rising arpeggio that climbs and gets louder the longer the chain.
  function sfxCombo(n){ n=Math.max(1,n); var notes=Math.min(2+n,7); var base=440+n*55; var vol=Math.min(0.28,0.14+n*0.02);
    for(var i=0;i<notes;i++){ beep(base+i*90, 0.09, 'square', vol, i*0.055); }
    if(n>=5){ beep(base*1.5, 0.2, 'sawtooth', vol*0.7, notes*0.055); } }
  // Time-running-out alarm: pitch + volume rise as seconds tick down (last 10s).
  function sfxUrgent(sec){ if(sec<=0){ beep(1400,0.35,'square',0.32); beep(700,0.4,'square',0.28,0.05); return; }
    var f=520 + (10-sec)*70, v=0.12 + (10-sec)*0.016;
    beep(f,0.12,'square',Math.min(0.3,v)); if(sec<=5) beep(f*1.5,0.1,'square',Math.min(0.24,v),0.06); }
  // ── Background music: an UPBEAT CHIPTUNE (original 8-bit melody) ──
  // Pure NES-style voices: a square-wave pulse lead, a triangle bass, and a light noise
  // hat. Dry (no reverb/delay) for a clean chip sound — and very light on the CPU.
  var musicTimer=null, _musBus=null, _musNoise=null, _musEvents=null, _musPhrase=0, _musStartAt=0, _musIdx=0;
  // Bright, bouncy original loop in C major. [freq, beats].
  var MUSIC=[
    [784,1],[784,1],[880,1],[988,1],[1047,2],[988,1],[880,1],
    [784,1],[659,1],[698,1],[784,1],[659,2],[587,1],[523,1],
    [587,1],[659,1],[698,1],[784,1],[880,2],[988,1],[1047,1],
    [988,1],[880,1],[784,1],[659,1],[698,2],[587,2],
    [523,1],[659,1],[784,1],[1047,1],[988,1],[784,1],[880,2],
    [1047,1],[988,1],[880,1],[784,1],[659,1],[587,1],[523,2]
  ];
  var BEAT=138;   // sprightly tempo
  function musBus(a){
    if(_musBus) return _musBus;
    var bus=a.createGain(); bus.gain.value=0.5; bus.connect(a._master||a.destination);   // dry & simple
    _musBus=bus; return bus;
  }
  // ONE shared noise buffer for every hi-hat — allocating a fresh buffer per hit was the lag.
  function musNoise(a){
    if(_musNoise) return _musNoise;
    var len=Math.floor(a.sampleRate*0.03), nb=a.createBuffer(1,len,a.sampleRate), d=nb.getChannelData(0);
    for(var i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.6); }
    _musNoise=nb; return nb;
  }
  // Pulse-wave lead: a single square osc with a plucky decay — classic chip melody voice.
  function musLead(a,bus,freq,dur,t0,vol){
    var o=a.createOscillator(); o.type='square'; o.frequency.value=freq;
    var g=a.createGain();
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(vol,t0+0.006);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001,vol*0.5),t0+Math.min(dur*0.6,0.14));
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g); g.connect(bus);
    o.start(t0); o.stop(t0+dur+0.02);
  }
  // Triangle bass — the NES sub channel.
  function musBass(a,bus,freq,dur,t0){
    var o=a.createOscillator(); o.type='triangle'; o.frequency.value=freq;
    var g=a.createGain();
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.22,t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g); g.connect(bus);
    o.start(t0); o.stop(t0+dur+0.02);
  }
  function musKick(a,bus,t0){
    var o=a.createOscillator(), g=a.createGain();
    o.frequency.setValueAtTime(150,t0); o.frequency.exponentialRampToValueAtTime(48,t0+0.09);
    g.gain.setValueAtTime(0.42,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.14);
    o.connect(g); g.connect(bus); o.start(t0); o.stop(t0+0.16);
  }
  function musHat(a,bus,t0,accent){
    var ns=a.createBufferSource(); ns.buffer=musNoise(a);
    var f=a.createBiquadFilter(); f.type='highpass'; f.frequency.value=8000;
    var g=a.createGain(); g.gain.value=accent?0.06:0.035;
    ns.connect(f); f.connect(g); g.connect(bus); ns.start(t0); ns.stop(t0+0.03);
  }
  // Build the phrase's note/drum events ONCE (times relative to phrase start).
  function musBuildEvents(){
    if(_musEvents) return;
    var ev=[], t=0;
    MUSIC.forEach(function(n){
      var dur=Math.max(0.08,n[1]*BEAT/1000*0.92);
      ev.push({at:t/1000,k:'lead',f:n[0],d:dur});
      ev.push({at:t/1000,k:'bass',f:n[0]/4,d:Math.max(0.1,n[1]*BEAT/1000*0.9)});   // chip bass under every note
      t+=n[1]*BEAT;
    });
    var step=0;
    for(var tt=0; tt<t; tt+=BEAT){ if(step%2===0) ev.push({at:tt/1000,k:'kick'}); else ev.push({at:tt/1000,k:'hat',acc:false}); step++; }
    ev.sort(function(x,y){ return x.at-y.at; });
    _musEvents=ev; _musPhrase=t/1000;
  }
  function musFire(a,bus,e,when){
    if(e.k==='lead') musLead(a,bus,e.f,e.d,when,0.05);
    else if(e.k==='bass') musBass(a,bus,e.f,e.d,when);
    else if(e.k==='kick') musKick(a,bus,when);
    else musHat(a,bus,when,e.acc);
  }
  // Lookahead scheduler: each tick only creates the handful of nodes due in the next ~0.35s,
  // so node creation is spread out — no per-loop burst, no frame hitch.
  function scheduleMusic(){
    if(!M||M.ended) return; var a=ac(); if(!a) return;
    musBuildEvents(); var bus=musBus(a);
    _musStartAt=a.currentTime+0.08; _musIdx=0;
    musicTimer=setInterval(function(){
      if(!M||M.ended){ stopMusic(); return; }
      var a2=ac(); if(!a2) return;
      var ahead=a2.currentTime+0.35, guard=0;
      while(guard++<128){
        if(_musIdx>=_musEvents.length){ _musStartAt+=_musPhrase; _musIdx=0; }   // loop the phrase
        var e=_musEvents[_musIdx], when=_musStartAt+e.at;
        if(when>ahead) break;
        musFire(a2,bus,e,when); _musIdx++;
      }
    }, 110);
  }
  function startMusic(){ stopMusic(); if(!M) return;
    if(M.mode==='snakehunt'||M.mode==='wolfhunt'||M.mode==='bearhunt'||M.mode==='wizardhunt'||M.mode==='dragonhunt'){ startHuntMusic(M.mode); return; }
    scheduleMusic(); }
  function stopMusic(){ if(musicTimer){ clearInterval(musicTimer); musicTimer=null; }
    if(window._huntNodes){ window._huntNodes.forEach(function(n){ try{ if(n.stop)n.stop(); }catch(e){} try{ if(n.disconnect)n.disconnect(); }catch(e){} }); window._huntNodes=null; } }

  /* ══ THE HUNT SCORE — ominous horror bed for the beast fights ══
     Replaces the normal game music in Snake/Wolf Hunt: a low tectonic drone, a slow
     heartbeat, dissonant minor-second string swells, tritone stabs and unsettling high
     shimmers. The wolf's cut adds a periodic chest-rumbling GROWL and a distant HOWL.
     Pure synthesis; every node registers in _huntNodes so stopMusic() silences it all. */
  function startHuntMusic(kind){ var wolf=(kind==='wolfhunt'||kind===true), bear=(kind==='bearhunt'), wiz=(kind==='wizardhunt'), drg=(kind==='dragonhunt');
    try{
      var a=ac(); if(!a) return;
      window._huntNodes=[];
      function keep(n){ window._huntNodes.push(n); return n; }
      var out=keep(a.createGain()); out.gain.value=.0001; out.connect(a.destination);
      out.gain.setTargetAtTime(.5,a.currentTime,1.5);
      // the drone — two barely-detuned saws over a sub sine, felt more than heard
      [[55,'sawtooth',.045],[55.7,'sawtooth',.04],[27.5,'sine',.09]].forEach(function(d){
        var o=keep(a.createOscillator()), lp=keep(a.createBiquadFilter()), g=keep(a.createGain());
        o.type=d[1]; o.frequency.value=d[0]; lp.type='lowpass'; lp.frequency.value=170;
        g.gain.value=d[2];
        var lfo=keep(a.createOscillator()), lg=keep(a.createGain());
        lfo.frequency.value=.07+Math.random()*.05; lg.gain.value=d[2]*.5;
        lfo.connect(lg); lg.connect(g.gain); lfo.start();
        o.connect(lp); lp.connect(g); g.connect(out); o.start(); });
      function E(g,t,pk,at,dr){ g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(pk,t+at); g.gain.exponentialRampToValueAtTime(.0001,t+dr); }
      function boom(t,pk){ var o=a.createOscillator(),g=a.createGain(); o.type='sine';
        o.frequency.setValueAtTime(70,t); o.frequency.exponentialRampToValueAtTime(32,t+.3);
        E(g,t,pk,.005,.5); o.connect(g); g.connect(out); o.start(t); o.stop(t+.6); }
      function swell(t,f,pk,dur){ [0,1.03].forEach(function(det,i){   // minor-second dissonance
        var o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
        o.type='sawtooth'; o.frequency.value=f*(i?1.0595:1); lp.type='lowpass'; lp.frequency.value=900;
        g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(pk/(1+i),t+dur*.6);
        g.gain.setTargetAtTime(.0001,t+dur*.85,.4);
        o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t+dur+1); }); }
      function stab(t){ [110,155.6].forEach(function(f){               // the tritone — dread itself
        var o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
        o.type='square'; o.frequency.value=f; lp.type='lowpass'; lp.frequency.value=500;
        E(g,t,.09,.01,1.1); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t+1.2); }); }
      function shimmer(t){ [1244,1318].forEach(function(f,i){          // high, wrong, too close together
        var o=a.createOscillator(),g=a.createGain(); o.type='sine'; o.frequency.value=f;
        g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.022,t+1.4);
        g.gain.setTargetAtTime(.0001,t+2.2,.6); o.connect(g); g.connect(out); o.start(t); o.stop(t+3.4); }); }
      var bar=0;
      musicTimer=setInterval(function(){
        if(!M||M.ended){ stopMusic(); return; }
        try{ var t=a.currentTime+.05;
          boom(t,.5); boom(t+.32,.3);                                  // the heartbeat, every 2s
          if(bar%2===0) swell(t+.5, bar%8<4?98:92.5, .05, 2.2);        // shifting semitone = tragic pull
          if(bar%4===3) stab(t+1.1);
          if(bar%6===5) shimmer(t+.3);
          if(wolf && bar%5===4) sfxWolfGrowl(t+.7);
          if(wolf && bar%11===9) sfxWolfHowl(t+.4);
          if(bear && bar%7===6) sfxBearGrunt(t+.6);
          if(wiz && bar%4===3) sfxWizChime(t+.5);
          if(drg && bar%6===5) sfxDrgRoar(t+.4,.4);
          bar++; }catch(_h){}
      },2000);
    }catch(e){}
  }
  // ── WOLF VOICE ──
  function sfxWolfGrowl(when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02);
    var o=a.createOscillator(),lp=a.createBiquadFilter(),g=a.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(58,t); o.frequency.linearRampToValueAtTime(46,t+1.1);
    lp.type='lowpass'; lp.frequency.value=240;
    var trem=a.createOscillator(),tg=a.createGain(); trem.type='sine'; trem.frequency.value=26; tg.gain.value=.06;
    trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t+1.3);
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.14,t+.12); g.gain.exponentialRampToValueAtTime(.0001,t+1.25);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t+1.3); }catch(e){} }
  // ── WIZARD VOICE — glissando casts, glass shatters, eerie chimes ──
  function sfxWizCast(when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02);
    var o=a.createOscillator(),g=a.createGain(); o.type='sine';
    o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(1900,t+.5);
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.12,t+.08); g.gain.exponentialRampToValueAtTime(.0001,t+.6);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+.7); }catch(e){} }
  function sfxWizShatter(vol,when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02); vol=vol||1;
    for(var i=0;i<9;i++){ var o=a.createOscillator(),hp=a.createBiquadFilter(),g=a.createGain();
      o.type='square'; o.frequency.value=1800+i*640; hp.type='highpass'; hp.frequency.value=2200;
      g.gain.setValueAtTime(.05*vol,t+i*.012); g.gain.exponentialRampToValueAtTime(.0001,t+.9);
      o.connect(hp); hp.connect(g); g.connect(a.destination); o.start(t); o.stop(t+1); } }catch(e){} }
  function sfxWizChime(when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02);
    [1244,1318,1660][Math.floor(Math.random()*3)] && (function(f){ var o=a.createOscillator(),g=a.createGain();
      o.type='triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.05,t+.03); g.gain.exponentialRampToValueAtTime(.0001,t+1.8);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+2); })( [1244,1318,1660][Math.floor(Math.random()*3)] ); }catch(e){} }
  function sfxDrgRoar(when,vol){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02); vol=vol||1;
    var o=a.createOscillator(),lp=a.createBiquadFilter(),g=a.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(60,t); o.frequency.linearRampToValueAtTime(110,t+.3); o.frequency.exponentialRampToValueAtTime(38,t+1.8);
    lp.type='lowpass'; lp.frequency.setValueAtTime(400,t); lp.frequency.linearRampToValueAtTime(900,t+.35); lp.frequency.linearRampToValueAtTime(180,t+1.8);
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.36*vol,t+.18); g.gain.exponentialRampToValueAtTime(.0001,t+2);
    var len=a.sampleRate*1.5, buf=a.createBuffer(1,len,a.sampleRate), dd=buf.getChannelData(0);
    for(var i=0;i<len;i++) dd[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.2)*.5;
    var nsrc=a.createBufferSource(); nsrc.buffer=buf;
    var bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=600; bp.Q.value=.6;
    var ng=a.createGain(); ng.gain.value=.18*vol;
    nsrc.connect(bp); bp.connect(ng); ng.connect(a.destination); nsrc.start(t);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t+2.1); }catch(e){} }
  function sfxBearGrunt(when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02);
    var o=a.createOscillator(),lp=a.createBiquadFilter(),g=a.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(44,t); o.frequency.linearRampToValueAtTime(36,t+.8);
    lp.type='lowpass'; lp.frequency.value=160;
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.2,t+.1); g.gain.exponentialRampToValueAtTime(.0001,t+.95);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t+1); }catch(e){} }
  function sfxBearRoar(when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02);
    var o=a.createOscillator(),lp=a.createBiquadFilter(),g=a.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(52,t); o.frequency.linearRampToValueAtTime(88,t+.25); o.frequency.exponentialRampToValueAtTime(40,t+1.5);
    lp.type='lowpass'; lp.frequency.setValueAtTime(300,t); lp.frequency.linearRampToValueAtTime(700,t+.3); lp.frequency.linearRampToValueAtTime(200,t+1.5);
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.34,t+.15); g.gain.exponentialRampToValueAtTime(.0001,t+1.6);
    var len=a.sampleRate*1.2, buf=a.createBuffer(1,len,a.sampleRate), dd=buf.getChannelData(0);
    for(var i=0;i<len;i++) dd[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.4)*.5;
    var nsrc=a.createBufferSource(); nsrc.buffer=buf;
    var bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=420; bp.Q.value=.7;
    var ng=a.createGain(); ng.gain.value=.16;
    nsrc.connect(bp); bp.connect(ng); ng.connect(a.destination); nsrc.start(t);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t+1.7); }catch(e){} }
  function sfxWolfHowl(when){ try{ var a=ac(); var t=(when!=null?when:a.currentTime+.02);
    var o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
    o.type='sine'; lp.type='lowpass'; lp.frequency.value=1400;
    o.frequency.setValueAtTime(310,t);
    o.frequency.exponentialRampToValueAtTime(520,t+.55);               // rise…
    o.frequency.setValueAtTime(520,t+1.1);
    o.frequency.exponentialRampToValueAtTime(300,t+2.1);               // …and the mournful fall
    var vib=a.createOscillator(),vg=a.createGain(); vib.type='sine'; vib.frequency.value=5.5; vg.gain.value=7;
    vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t+2.2);
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.11,t+.4);
    g.gain.setValueAtTime(.11,t+1.2); g.gain.exponentialRampToValueAtTime(.0001,t+2.2);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t+2.3); }catch(e){} }

  function eid(){ try{ return chatEmpId||''; }catch(e){ return ''; } }
  function ename(){ try{ return chatEmpName||''; }catch(e){ return ''; } }
  function el(id){ return document.getElementById(id); }
  function status(t){ var s=el('tet-status'); if(s) s.textContent=t; }

  // seeded RNG (mulberry32) from a string → identical piece bag on both clients
  function hashStr(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  // ── Supabase lobby (invites) ──
  window.tetrisSetupLobby=function(){
    if(lobby || typeof supaClient==='undefined' || !supaClient) return;
    try{
      lobby=supaClient.channel('tetris-lobby',{config:{broadcast:{self:false}}})
        .on('broadcast',{event:'invite'}, function(p){ onInvite(p.payload); })
        .on('broadcast',{event:'accept'}, function(p){ onAccept(p.payload); })
        .on('broadcast',{event:'decline'}, function(p){ onDecline(p.payload); })
        .on('broadcast',{event:'tinvite'}, function(p){ onTInvite(p.payload); })
        .on('broadcast',{event:'tjoin'},   function(p){ onTJoin(p.payload); })
        .on('broadcast',{event:'troster'}, function(p){ onTRoster(p.payload); })
        .on('broadcast',{event:'tstart'},  function(p){ onTStart(p.payload); })
        .on('broadcast',{event:'tspec'},   function(p){ onTSpec(p.payload); })
        .subscribe(function(st){ if(st==='SUBSCRIBED'){ lobbyReady=true; var q=lobbyQueue.slice(); lobbyQueue=[]; q.forEach(function(m){ try{ lobby.send(m); }catch(e){} }); } });
    }catch(e){}
  };
  // Send on the lobby only once it's actually joined; queue otherwise so nothing is lost to a race.
  function lobbySend(event,payload){
    var msg={type:'broadcast',event:event,payload:payload};
    if(lobby && lobbyReady){ try{ lobby.send(msg); }catch(e){} }
    else { lobbyQueue.push(msg); window.tetrisSetupLobby(); }
  }
  var _pendingInvite=null;
  function onInvite(p){
    if(!p || String(p.to)!==String(eid())) return;
    if(M && M.playing) return;                 // already in a game
    _pendingInvite=p;
    el('tet-invite-txt').innerHTML='<b>'+esc(p.fromName||'A teammate')+'</b> challenges you to Tetris!<br>1v1 for bragging rights — good luck!';
    el('tet-invite-pop').style.display='block';
    sfxInvite();
  }
  function onDecline(p){ if(M && M.host && String(p.matchId)===String(M.matchId)){ status('Challenge declined.'); setTimeout(tetrisQuit, 1400); } }
  function onAccept(p){
    if(!M || !M.host || String(p.matchId)!==String(M.matchId)) return;
    M.oppName=p.fromName||M.oppName; startMatch();
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  // ── Invite / accept ──
  window.tetrisInvite=function(){
    if(typeof currentChat==='undefined' || currentChat==='group' || String(currentChat).indexOf('ch:')===0){ showToast('Open a 1-on-1 chat to challenge someone.'); return; }
    var opp=currentChat, oppName=(typeof currentChatName!=='undefined'?currentChatName:opp);
    window.tetrisInviteTo(opp, oppName);
  };
  window.tetrisInviteTo=function(opp, oppName){
    if(!opp || String(opp)===String(eid())){ showToast('Pick a teammate to challenge.'); return; }
    if(typeof supaClient==='undefined' || !supaClient){ showToast('Chat not connected.'); return; }
    if(M && M.playing){ showToast('You are already in a game.'); return; }
    if(!canPlayGame()) return;
    window.tetrisSetupLobby();
    oppName=oppName||opp;
    ac();  // unlock audio on this user gesture
    var matchId=[eid(),opp].sort().join('-')+'-'+Date.now();
    M={ matchId:matchId, host:true, oppId:opp, oppName:oppName, playing:false };
    openOverlay(); status('Waiting for '+esc(oppName)+' to accept…');
    el('tet-opp-label').textContent=oppName;
    var tries=0;
    (function resend(){
      if(!M || M.playing || M.ended) return;
      lobbySend('invite',{matchId:matchId, from:eid(), fromName:ename(), to:opp});
      if(++tries<5) setTimeout(resend, 1500);
    })();
  };
  window.tetrisAcceptInvite=function(){
    var p=_pendingInvite; el('tet-invite-pop').style.display='none'; if(!p) return;
    if(!canPlayGame()) return;
    ac();  // unlock audio on this user gesture
    M={ matchId:p.matchId, host:false, oppId:p.from, oppName:p.fromName||p.from, playing:false };
    openOverlay(); el('tet-opp-label').textContent=M.oppName;
    var tries=0;
    (function resend(){
      if(!M || M.playing) return;
      lobbySend('accept',{matchId:p.matchId, from:eid(), fromName:ename(), to:p.from});
      if(++tries<4) setTimeout(resend, 900);
    })();
    startMatch();
  };
  window.tetrisDeclineInvite=function(){
    var p=_pendingInvite; el('tet-invite-pop').style.display='none'; if(!p) return;
    lobbySend('decline',{matchId:p.matchId, to:p.from});
    _pendingInvite=null;
  };

  function openOverlay(){ var r=el('tet-result'); if(r) r.style.display='none'; el('tet-overlay').style.display='flex'; document.body.classList.add('tet-ingame'); }

  // ── Premium FX (kept off the game's hot path: confetti only runs post-game, big-count only pre-game) ──
  function tetShake(id){ var e=el(id); if(!e) return; e.classList.remove('tet-shake'); void e.offsetWidth; e.classList.add('tet-shake'); setTimeout(function(){ e.classList.remove('tet-shake'); }, 520); }
  function tetBigCount(cb){
    var host=el('tet-bigcount'), num=el('bc-num'); if(!host||!num){ if(cb) cb(); return; }
    var seq=['3','2','1','GO'], i=0; host.style.display='flex';
    (function step(){
      var t=seq[i]; num.textContent=t; num.className='bc-num'+(t==='GO'?' go':'');
      void num.offsetWidth; num.classList.add('bc-anim');
      var ring=host.querySelector('.bc-ring'); if(ring){ ring.style.animation='none'; void ring.offsetWidth; ring.style.animation=''; }
      if(t==='GO'){ try{ sfxUrgent(0); }catch(_){} tetShake('tet-overlay'); } else { try{ sfxTick(); }catch(_){} }
      i++;
      if(i<seq.length){ setTimeout(step, 760); }
      else { setTimeout(function(){ host.style.display='none'; num.classList.remove('bc-anim'); if(cb) cb(); }, 600); }
    })();
  }
  var _confRAF=null;
  function tetConfetti(opts){
    opts=opts||{}; if(M && M.playing && !M.ended) return;   // never compete with the live game loop
    var cv=el('tet-confetti'); if(!cv) return;
    var dpr=Math.min(2, window.devicePixelRatio||1);
    var w=cv.width=Math.floor(innerWidth*dpr), h=cv.height=Math.floor(innerHeight*dpr);
    cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; cv.style.display='block';
    var ctx=cv.getContext('2d'), cols=['#fbbf24','#ff6b1a','#e83d00','#22d3ee','#a855f7','#22c55e','#eef2ff'];
    var N=opts.count||150, P=[];
    for(var i=0;i<N;i++){ P.push({ x:(0.5+(Math.random()-0.5)*0.35)*w, y:(Math.random()*0.35*h)-20*dpr,
      vx:(Math.random()-0.5)*9*dpr, vy:(Math.random()*-4-6)*dpr, g:0.28*dpr, w:(4+Math.random()*5)*dpr, h:(6+Math.random()*9)*dpr,
      rot:Math.random()*6.28, vr:(Math.random()-0.5)*0.4, c:cols[i%cols.length] }); }
    var start=performance.now(), DUR=opts.dur||2600;
    if(_confRAF) cancelAnimationFrame(_confRAF);
    (function frame(t){
      var e0=t-start; ctx.clearRect(0,0,w,h); var alive=false;
      for(var i=0;i<P.length;i++){ var p=P[i]; p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.vx*=0.995;
        var a=e0>DUR-600?Math.max(0,(DUR-e0)/600):1;
        if(p.y<h+40*dpr && a>0){ alive=true; ctx.save(); ctx.globalAlpha=a; ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore(); } }
      if(e0<DUR && alive){ _confRAF=requestAnimationFrame(frame); } else { ctx.clearRect(0,0,w,h); cv.style.display='none'; _confRAF=null; }
    })(performance.now());
  }
  var SOLO_MODES=['sprint','ultra','combo','cheese','overgrow','snakehunt','wolfhunt','bearhunt','wizardhunt','dragonhunt'];
  function isSolo(m){ return SOLO_MODES.indexOf(m)>=0; }
  window.tetrisQuit=function(){
    if(M && M.playing && !M.ended){
  
      if(M.mode==='tourney'){ try{ M.tchan.send({type:'broadcast',event:'tover',payload:{tid:M.matchId,from:eid(),name:ename(),score:M.score||0,place:tourneyAliveIds().length}}); }catch(e){} }
      else if(!isSolo(M.mode)){ try{ chan.send({type:'broadcast',event:'over',payload:{from:eid(),score:M.score||0,forfeit:true}}); }catch(e){} }
    }
    cleanup(); bkCleanup(); el('tet-overlay').style.display='none'; var r=el('tet-result'); if(r) r.style.display='none';
  };
  // Unlimited replay for the SELF-PLAYING modes (Solo challenges, Practice/Ladder, Ranked-vs-CPU):
  // restart the last game immediately from the result screen. Live VS is excluded (needs a re-invite).
  window.tetRematch=function(){
    var L=window._tetLast;
    try{ var _r=el('tet-result'); if(_r) _r.style.display='none'; }catch(e){}
    try{ var _sr=document.getElementById('solo-result'); if(_sr){ _sr.classList.remove('on'); _sr.style.display='none'; } }catch(e){}
    try{ cleanup(); }catch(e){}
    try{ bkCleanup(); }catch(e){}
    if(!L){ try{ el('tet-overlay').style.display='none'; }catch(e){} return; }
    setTimeout(function(){
      try{
        if(L.kind==='solo'){ startSolo(L.mode); }
        else if(L.kind==='ranked'){ window.tetrisTraining(L.level, { name:L.name, rank:L.rank, id:L.id, bypass:true, ranked:true }); }
        else { window.tetrisTraining(L.level||1, { bypass:true }); }
      }catch(e){}
    }, 70);
  };
  function cleanup(){
    stopMusic(); stopAllRepeat(); cancelRender(); clearLockTimer(); try{ showEmoteBar(false); }catch(_e){} try{ tetLiveStop(); }catch(_ls){} try{ tetWatchStopListen(); }catch(_ws){}
    var _me=el('tet-me'); if(_me) _me.classList.remove('tet-danger');
    var _fr=(typeof _meFrame==='function')?_meFrame():null;
    if(_fr){ _fr.classList.remove('danger'); _fr.classList.remove('hit'); _fr.classList.remove('recv'); }
    if(BOT && BOT.loop){ clearInterval(BOT.loop); } BOT=null;
    if(M){ if(M.loop) clearInterval(M.loop); if(M.timer) clearInterval(M.timer); if(M.net) clearInterval(M.net);
      if(M.tchan){ try{ supaClient.removeChannel(M.tchan); }catch(e){} } }
    detachControls();
    if(chan){ try{ supaClient.removeChannel(chan); }catch(e){} chan=null; }
    M=null;
    _ladderNext=0;   // cancel any pending Skill Ladder auto-advance
    document.body.classList.remove('tet-ingame');
  }

  // ── Match (1v1 duel) ──
  function startMatch(){
    el('tet-controls').style.display='block';
    var oc=el('tet-opp-col'); if(oc) oc.style.display='';           // duel shows single opponent board
    var ar=el('tet-arena-col'); if(ar) ar.style.display='none';
    M.mode='duel';
    var seed=hashStr(M.matchId);
    M.rng=mulberry32(seed); M.bag=[]; M.queue=[]; M.grid=empty(); M.score=0; M.lines=0; M.level=1;
    M.oppGrid=empty(); M.oppScore=0; M.oppLines=0; M.oppAlive=true;
    M.playing=true; M.ended=false; M.alive=true; M.pendingGarbage=0;
    M.hold=null; M.canHold=true; M.combo=0; M.b2b=false; M.nextT=null; M.kos=0; M.myKos=0; M.oppKos=0;
    applyRules(true);   // all head-to-head play (duel + bracket) → 2:00 / 5 KOs
    // match realtime channel
    chan=supaClient.channel('tetris-'+M.matchId,{config:{broadcast:{self:false}}})
      .on('broadcast',{event:'state'}, function(p){ if(M) onOppState(p.payload); })
      .on('broadcast',{event:'attack'}, function(p){ if(M && p.payload && String(p.payload.from)!==String(eid())){ M.pendingGarbage=Math.min(PENDING_CAP,M.pendingGarbage+(p.payload.lines||0)); updateIncoming(); try{ boardRecv(); }catch(e){} try{ sfxTick(); }catch(e){} } })
      .on('broadcast',{event:'over'}, function(p){ if(M && p.payload && String(p.payload.from)!==String(eid())) onOppOver(p.payload); })
      .on('broadcast',{event:'ko'}, function(p){ if(M && p.payload && String(p.payload.from)!==String(eid())){ M.oppKos=p.payload.kos||0; if(p.payload.score!=null) M.oppScore=p.payload.score; updateKoDisplay(); if(p.payload.elim) onOppOver(p.payload); } })
      // ── READY handshake: neither side starts its 3-2-1 until BOTH players are in the
      //    channel, so one client's slower reel/countdown can't give the other a head start.
      .on('broadcast',{event:'ready'}, function(p){ if(M && p.payload && String(p.payload.from)!==String(eid())){ if(!M._cdStarted){ try{ chan.send({type:'broadcast',event:'ready',payload:{from:eid()}}); }catch(e){} } M._oppReady=true; beginCountdown(false); } })
      .on('broadcast',{event:'emote'}, function(p){ if(M && p.payload && String(p.payload.from)!==String(eid())) tetPopEmote(p.payload.from, p.payload.em); })
      .subscribe(function(st){ if(st==='SUBSCRIBED') pingReady(); });
    showEmoteBar(true);
    attachControls();
    M._oppReady=false; M._cdStarted=false;
    // Keep announcing readiness until the countdown begins, so a late-subscribing opponent still hears us.
    function pingReady(){ var n=0; (function s(){ if(!M || M._cdStarted) return; try{ chan.send({type:'broadcast',event:'ready',payload:{from:eid()}}); }catch(e){} if(++n<24) setTimeout(s, 650); })(); }
    // Fallback: if the opponent never signals (dropped/closed tab), start solo after 8s — never hang.
    M._readyFallback=setTimeout(function(){ beginCountdown(true); }, 8000);
    function beginCountdown(force){
      if(!M || M._cdStarted) return;
      if(!force && !M._oppReady){ status('Waiting for opponent…'); return; }
      M._cdStarted=true;
      if(M._readyFallback){ clearTimeout(M._readyFallback); M._readyFallback=null; }
      var n=3; status('Starting in '+n+'…'); sfxTick();
      var cd=setInterval(function(){ n--; if(n>0){ status('Starting in '+n+'…'); sfxTick(); } else { clearInterval(cd); go(); } }, 800);
    }
  }
  function go(){
    sfxGo(); startMusic(); spawn(); draw(); updateIncoming(); startRender(); renderHold();
    M.dropMs=700;
    M.loop=setInterval(tick, M.dropMs);
    M.net=setInterval(sendState, 350);
    M.timeLeft=M.dur||180; status(''+fmtT(M.timeLeft));
    M.timer=setInterval(function(){ M.timeLeft--; if(M.timeLeft<=0){ endByTime(); } else { status(''+fmtT(M.timeLeft)); if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000);
  }
  function fmtT(s){ var m=Math.floor(s/60); s=s%60; return m+':'+(s<10?'0':'')+s; }

  function empty(){ var g=[]; for(var y=0;y<H;y++){ g.push(new Array(W).fill(0)); } return g; }
  function nextType(){ if(!M.bag.length){ M.bag=TYPES.slice(); for(var i=M.bag.length-1;i>0;i--){ var j=Math.floor(M.rng()*(i+1)); var t=M.bag[i]; M.bag[i]=M.bag[j]; M.bag[j]=t; } } return M.bag.shift(); }
  function fillQueue(){ if(!M.queue) M.queue=[]; while(M.queue.length<NEXT_N){ M.queue.push(nextType()); } M.nextT=M.queue[0]; }
  function spawnType(t){
    var m=STATES[t][0];
    M.cur={ type:t, rot:0, m:m, x:Math.floor((W-m[0].length)/2), y:0 };
    M.lastRot=false; M.lastKick=0;
    if(collide(M.cur.m,M.cur.x,M.cur.y)){ topOut(); }
  }
  var RATION_PIECES=50;
  function spawn(){
    clearLockTimer(); M._lockResets=0;
    if(M.mode==='ration'){
      if((M.piecesUsed||0) >= RATION_PIECES){ soloEnd('done'); return; }   // budget spent
      M.piecesUsed=(M.piecesUsed||0)+1;
      rationStatus();
    }
    fillQueue();
    var t=M.queue.shift(); fillQueue();
    M.canHold=true;
    spawnType(t);
    renderNext();
  }
  /* Ration HUD. Wasted cells is the number that actually teaches the mode: 50 pieces is
     200 cells and every cell not consumed by a clear is a line you can no longer reach. */
  function rationStatus(){
    if(!M||M.mode!=='ration') return;
    var used=M.piecesUsed||0;                       // this piece is already counted, but NOT yet placed
    var placed=Math.max(0,used-1)*4;                // cells actually on the board
    var lines=M.lines||0;
    var onBoard=placed-lines*10;                    // cells sitting in the stack, not yet cashed in
    /* Deliberately NOT "best possible": cells are never destroyed in Tetris, so that number
       reads 20 until the moment you top out and tells the player nothing. Pace — the score
       this efficiency would finish at — is the number that actually changes as you play. */
    var pace=placed>0 ? Math.min(20, Math.round(lines*(RATION_PIECES*4)/placed)) : 0;
    status('📦 piece '+Math.min(used,RATION_PIECES)+'/'+RATION_PIECES+' · '+lines+' lines · '
          +onBoard+' cells idle · on pace for '+pace);
  }
  // ── Hold piece (Tetris Battle) ──
  function holdPiece(){
    if(!M||!M.alive||!M.canHold) return;   // standard: usable once per placed piece (canHold resets on spawn)
    clearLockTimer(); M._lockResets=0;
    var cur=M.cur.type;
    if(M.hold){ var h=M.hold; M.hold=cur; spawnType(h); }
    else { M.hold=cur; fillQueue(); var t=M.queue.shift(); fillQueue(); spawnType(t); renderNext(); }
    M.canHold=false; renderHold(); sfxRot();
  }
  function renderHold(){
    var cv=el('tet-hold'); if(!cv) return; var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
    if(!M||!M.hold) return; var m=STATES[M.hold][0]; var rows=m.length, cols=m[0].length;
    var cs=Math.min((cv.width-8)/cols,(cv.height-8)/rows,20); var ox=(cv.width-cols*cs)/2, oy=(cv.height-rows*cs)/2;
    for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){ if(m[r][c]){ var color=COLORS[m[r][c]],px=ox+c*cs,py=oy+r*cs,rad=Math.max(2,cs*0.17);
      var g=ctx.createLinearGradient(px,py,px,py+cs); g.addColorStop(0,hexAdj(color,0.42)); g.addColorStop(0.5,color); g.addColorStop(1,hexAdj(color,-0.3));
      rr(ctx,px+1,py+1,cs-2,cs-2,rad); ctx.fillStyle=g; ctx.fill(); } }
  }
  function renderNext(){
    var cv=el('tet-next'); if(!cv||!M||!M.queue||!M.queue.length) return; var ctx=cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    var q=M.queue.slice(0,2), n=q.length;   // show only 2 upcoming: one big box, one small
    var wts=[1.6,0.72].slice(0,n), sw=0, i; for(i=0;i<n;i++) sw+=wts[i];
    var gap=5, avail=cv.height-gap*(n+1), y=gap;
    for(i=0;i<n;i++){
      var bh=avail*(wts[i]/sw), bx=4, bw=cv.width-8;
      // each piece sits in its own box — next is the biggest & brightest, down to the smallest
      ctx.save(); rr(ctx,bx,y,bw,bh,7);
      ctx.fillStyle=(i===0)?'rgba(255,255,255,.07)':'rgba(255,255,255,.028)'; ctx.fill();
      ctx.lineWidth=1; ctx.strokeStyle=(i===0)?'rgba(255,170,110,.55)':'rgba(255,255,255,.12)'; ctx.stroke(); ctx.restore();
      var m=STATES[q[i]][0], rows=m.length, cols=m[0].length;
      var cs=Math.min((bw-10)/cols, (bh-10)/rows, i===0?20:13);
      var ox=bx+(bw-cols*cs)/2, oy=y+(bh-rows*cs)/2;
      for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){ if(m[r][c]){
        var color=COLORS[m[r][c]], px=ox+c*cs, py=oy+r*cs, rad=Math.max(2,cs*0.17);
        var g=ctx.createLinearGradient(px,py,px,py+cs); g.addColorStop(0,hexAdj(color,0.42)); g.addColorStop(0.5,color); g.addColorStop(1,hexAdj(color,-0.3));
        rr(ctx,px+1,py+1,cs-2,cs-2,rad); ctx.fillStyle=g; ctx.fill();
      } }
      y+=bh+gap;
    }
  }
  function updateIncoming(){
    var f=el('tet-incoming-fill'), nu=el('tet-incoming-num'); var n=(M&&M.pendingGarbage)||0;
    if(nu) nu.textContent=n;
    if(f){
      var pct=Math.min(100,(n/12)*100)+'%';
      f.style.height=pct;                      // desktop: the tube is vertical
      f.style.setProperty('--inc', pct);       // mobile: the tube lies flat, CSS reads this for width
    }
    var fr=_meFrame(); if(fr) fr.classList.toggle('danger', n>=4);   // pulse the board red when garbage piles up
  }
  // ── Competitive feedback helpers (my board only) ──
  function _meFrame(){ var c=el('tet-me'); return c ? (c.closest ? c.closest('.arc-frame') : c.parentNode) : null; }
  function boardHit(){ var fr=_meFrame(); if(!fr) return; fr.classList.remove('hit'); void fr.offsetWidth; fr.classList.add('hit'); }
  function boardRecv(){ var fr=_meFrame(); if(!fr) return; fr.classList.remove('recv'); void fr.offsetWidth; fr.classList.add('recv'); }
  function koStamp(){ var e=el('tet-koflash'); if(!e) return; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); try{ voiceKO(); }catch(_){} }
  function attackPop(n){ var e=el('tet-sent'); if(!e||n<=0) return; e.textContent='＋'+n+' SENT'; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
  // ── 🔥 GARBAGE-THROW ANIMATION: molten blocks arc from your board to the target board ──
  var _thFx=[], _thRAF=null;
  function _rrect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function tetThrowGarbage(n, targetEl){
    try{
      var cv=el('tet-throw'); var src=el('tet-me'); if(!cv||!src||n<=0) return;
      var dpr=Math.min(2,window.devicePixelRatio||1);
      var W2=Math.floor(innerWidth*dpr), H2=Math.floor(innerHeight*dpr);
      if(cv.width!==W2||cv.height!==H2){ cv.width=W2; cv.height=H2; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; }
      var sr=src.getBoundingClientRect(); var sx=(sr.left+sr.right)/2*dpr, sy=sr.top*dpr+ (sr.height*0.25)*dpr;
      var tx,ty; if(targetEl&&targetEl.getBoundingClientRect){ var tr=targetEl.getBoundingClientRect(); tx=(tr.left+tr.right)/2*dpr; ty=(tr.top+tr.bottom)/2*dpr; }
      else { tx=W2+70*dpr; ty=sy; }
      var count=Math.min(9, Math.max(1,n)); var now=performance.now();
      for(var i=0;i<count;i++){
        var up=(120+Math.random()*150)*dpr;
        _thFx.push({ t0:now+i*42, dur:400+Math.random()*180,
          sx:sx+(Math.random()-0.5)*36*dpr, sy:sy+(Math.random()-0.5)*30*dpr,
          mx:(sx+tx)/2+(Math.random()-0.5)*90*dpr, my:Math.min(sy,ty)-up,
          tx:tx+(Math.random()-0.5)*46*dpr, ty:ty+(Math.random()-0.5)*46*dpr,
          rot:Math.random()*6.28, vr:(Math.random()-0.5)*7, sz:(13+Math.random()*7)*dpr, dpr:dpr });
      }
      if(!_thRAF) _thRAF=requestAnimationFrame(_thStep);
    }catch(e){}
  }
  function _thStep(ts){
    var cv=el('tet-throw'); if(!cv){ _thRAF=null; return; }
    var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height); var alive=false;
    for(var i=0;i<_thFx.length;i++){ var p=_thFx[i]; var e=(ts-p.t0)/p.dur;
      if(e<0){ alive=true; continue; } if(e>1) continue; alive=true;
      var u=1-e; var x=u*u*p.sx+2*u*e*p.mx+e*e*p.tx; var y=u*u*p.sy+2*u*e*p.my+e*e*p.ty;
      var sc=1-0.28*e; var a=e<0.82?1:Math.max(0,1-(e-0.82)/0.18); var s=p.sz*sc, r=s*0.24;
      ctx.save(); ctx.globalAlpha=a; ctx.translate(x,y); ctx.rotate(p.rot+p.vr*e);
      ctx.shadowColor='rgba(255,120,40,0.9)'; ctx.shadowBlur=15*p.dpr;
      var g=ctx.createLinearGradient(-s/2,-s/2,s/2,s/2); g.addColorStop(0,'#ffe0ad'); g.addColorStop(0.5,'#ff7a1a'); g.addColorStop(1,'#c62b06');
      ctx.fillStyle=g; _rrect(ctx,-s/2,-s/2,s,s,r); ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=a*0.5; ctx.fillStyle='rgba(255,240,210,.7)'; _rrect(ctx,-s/2+2*p.dpr,-s/2+2*p.dpr,s-4*p.dpr,Math.max(1,s*0.16),r*0.5); ctx.fill();
      ctx.restore();
    }
    _thFx=_thFx.filter(function(p){ return (ts-p.t0)/p.dur <= 1; });
    if(alive){ _thRAF=requestAnimationFrame(_thStep); } else { ctx.clearRect(0,0,cv.width,cv.height); _thRAF=null; }
  }
  function collide(m,x,y){ for(var r=0;r<m.length;r++){ for(var c=0;c<m[r].length;c++){ if(!m[r][c]) continue; var gx=x+c, gy=y+r; if(gx<0||gx>=W||gy>=H) return true; if(gy>=0 && M.grid[gy][gx]) return true; } } return false; }
  function rotCW(m){ var R=m.length, C=m[0].length; var o=[]; for(var c=0;c<C;c++){ o.push([]); for(var r=R-1;r>=0;r--){ o[c].push(m[r][c]); } } return o; }
  function merge(){ var m=M.cur.m; for(var r=0;r<m.length;r++){ for(var c=0;c<m[r].length;c++){ if(m[r][c]){ var gy=M.cur.y+r, gx=M.cur.x+c; if(gy>=0&&gy<H&&gx>=0&&gx<W) M.grid[gy][gx]=m[r][c]; } } } }
  function clearLines(){
    var full=[]; for(var y=0;y<H;y++){ if(M.grid[y].every(function(v){return v>0;})) full.push(y); }
    // count cleared rows that contained garbage (value 8) — digging garbage sends only half the attack
    var grb=0; for(var gi=0;gi<full.length;gi++){ if(M.grid[full[gi]].indexOf(8)>=0) grb++; }
    M._grbCleared=grb;
    if(full.length){ M.flash={ys:full.slice(), t0:Date.now()}; spawnParticles(full); ensureFx(); }
    for(var i=full.length-1;i>=0;i--){ M.grid.splice(full[i],1); M.grid.unshift(new Array(W).fill(0)); }
    return full.length;
  }
  // Draw is event-driven (on tick/input); a short rAF loop runs ONLY while a flash or
  // particles are active, so we don't repaint the whole board every frame (that caused lag).
  function startRender(){ if(M) draw(); }
  function cancelRender(){ if(M){ if(M._raf){ cancelAnimationFrame(M._raf); M._raf=null; } M._fx=false; } }
  function ensureFx(){ if(!M||M._fx) return; M._fx=true;
    (function loop(ts){ if(!M){ return; }
      ts = ts||0;
      var fx = M.flash || (M.particles && M.particles.length);
      var inf = ((EQUIPPED==='mossy'||EQUIPPED==='elderwood'||EQUIPPED==='azero'||EQUIPPED==='inferno'||EQUIPPED==='emoji'||EQUIPPED==='prisma'||EQUIPPED==='holo'||EQUIPPED==='abyss'||EQUIPPED==='mirage'||EQUIPPED==='rgbgamer'||EQUIPPED==='matrix'||EQUIPPED==='lavalamp'||EQUIPPED==='kaleido'||EQUIPPED==='ravager'||EQUIPPED==='kintsugi'||EQUIPPED==='kiln'||EQUIPPED==='aquarium'||EQUIPPED==='pilipinas'||EQUIPPED==='nightsuit') && M.playing);          // animated skins keep the fx loop alive
      if(fx){ if(!M._fxTs || ts-M._fxTs>=30){ M._fxTs=ts; draw(); } }   // cap flash/particle redraws at ~30fps (perf)
      else if(inf){ if(!M._infTs || ts-M._infTs>=33){ M._infTs=ts; draw(); } }   // ~30fps glow pulse
      if(fx || inf){ M._raf=requestAnimationFrame(loop); } else { M._fx=false; }
    })(0);
  }
  function spawnParticles(rows){
    var cv=el('tet-me'); if(!cv) return; var cs=cv.width/W; M.particles=M.particles||[];
    var fx=FX_PACKS[COS.fx]||FX_PACKS.spark;
    var push=function(p){ M.particles.push(p); };
    rows.forEach(function(ry){ try{ fx(push,cv,cs,ry); }catch(e){ FX_PACKS.spark(push,cv,cs,ry); } });
    if(M.particles.length>180) M.particles.splice(0, M.particles.length-180);   // cap for perf during clears
  }
  // 💥 Perfect Clear spectacle: full-board flash + confetti burst + screen shake + triumphant sound
  function perfectClearFx(){
    try{
      var cv=el('tet-me'); var cw=cv?cv.width:270, ch=cv?cv.height:540;
      M.flash={ t0:Date.now(), ys:[] }; for(var y=0;y<H;y++) M.flash.ys.push(y);   // whole board flashes white
      M.particles=M.particles||[];
      var pal=['#fbbf24','#22d3ee','#a855f7','#22c55e','#ff6b1a','#ffffff','#f472b6'];
      for(var i=0;i<90;i++){ M.particles.push({ x:cw*(0.2+Math.random()*0.6), y:ch*(0.3+Math.random()*0.5),
        vx:(Math.random()-0.5)*11, vy:(Math.random()*-9-3), life:1.1+Math.random()*0.7, sz:3+Math.random()*4, color:pal[i%pal.length] }); }
      if(M.particles.length>180) M.particles.splice(0, M.particles.length-180);   // cap for perf during clears
      ensureFx();
      try{ tetShake('tet-overlay'); }catch(_s){}
      // triumphant rising arpeggio + boom
      try{ var seq=[523,659,784,1046,1318]; for(var n=0;n<seq.length;n++) beep(seq[n],0.12,'triangle',0.22,n*0.06);
           beep(1568,0.4,'sawtooth',0.2,seq.length*0.06); beep(120,0.5,'sine',0.28,seq.length*0.06); }catch(_a){}
      try{ if(typeof eid==='function') fetch(APPS_SCRIPT_URL+'?action=tetris_pc&employee_id='+encodeURIComponent(eid())+'&_='+Date.now()).catch(function(){}); }catch(_p){}
    }catch(_e){}
  }
  /* Shake scales with the hit: the bigger the garbage dump (i.e. the longer the sender's combo),
     the harder the board rocks. 1–2 rows = nudge · 3–4 = shake · 5–7 = heavy · 8+ = earthquake. */
  function boardShake(n){ var fr=_meFrame(); if(!fr) return;
    var cls=(n>=8)?'gshake-mega':(n>=5)?'gshake-huge':(n>=3)?'gshake-big':'gshake';
    fr.classList.remove('gshake','gshake-big','gshake-huge','gshake-mega'); void fr.offsetWidth; fr.classList.add(cls);
    setTimeout(function(){ if(fr) fr.classList.remove('gshake','gshake-big','gshake-huge','gshake-mega'); }, 760); }
  function addGarbage(n){ if(n<=0) return; sfxGarbage(); boardRecv(); boardShake(n); var prevHole=-1;
    for(var i=0;i<n;i++){
      // If a block already sits on the top row, more garbage would push it off → KO
      // (don't destroy the puzzle row — just knock out; respawn() then clears the garbage).
      if(M.grid[0].some(function(v){ return v>0; })){ topOut(); return; }
      // Jethro: the hole moves EVERY row (never the same column twice in a row) — no free clean
      // column to slide a piece down, so garbage is genuinely hard to dig out.
      var hole=Math.floor(Math.random()*W); if(W>1 && hole===prevHole){ hole=(hole+1+Math.floor(Math.random()*(W-1)))%W; } prevHole=hole;
      var row=new Array(W).fill(8); row[hole]=0;
      M.grid.shift(); M.grid.push(row);
    }
  }
  // Combo garbage by combo count (index = combo-1): combo 1 → 0 (a lone clear sends no combo garbage),
  // combos 2-4 → 1, combos 5-6 → 2 (doubled), combos 7-9 → 3 (tripled), combo 10+ → 5.
  // Bonus garbage from the combo chain, on top of the line-clear attack. Index = combo-1.
  // Combo 1 → 0 · 2-4 → 1 · 5-7 → 2 · 8-10 → 3 · 11+ → 4   (a long, gentle ramp)
  var COMBO_TABLE=[0,0,1,1,1,2,2,2,2,3,3];      // gentler combo-garbage ramp (was up to 4)
  var MAX_SEND=5;                               // hard cap on garbage SENT per placement
  var PENDING_CAP=12;                           // incoming meter can never stack past this
  var DUMP_MAX=4;                               // max garbage rows dumped on you per piece
  function lockPiece(){
    clearLockTimer(); M._lockResets=0;
    merge(); sfxLock();
    var ts=tSpinType();                          // detect T-spin BEFORE the board changes
    // ── Detect completed rows (scan bottom→top), but DON'T remove yet — highlight them first ──
    var full=[]; for(var _y=0;_y<H;_y++){ if(M.grid[_y].every(function(v){return v>0;})) full.push(_y); }
    var _grb=0; for(var _gi=0;_gi<full.length;_gi++){ if(M.grid[full[_gi]].indexOf(8)>=0) _grb++; } M._grbCleared=_grb;
    var c=full.length;
    /* 🌿 Overgrowth scores only REAL lines: a cleared row counts only if it holds no
       vine/garbage cells (value 8) — digging out the forest keeps you alive but pays nothing. */
    /* 🐍 BLIND CLEAR ×2 — clearing lines while a snake is crossing pays double: every
       such line adds one bonus line to the score. Courage is worth points. */
    if((M.mode==='snakehunt'||M.mode==='wolfhunt'||M.mode==='bearhunt'||M.mode==='wizardhunt'||M.mode==='dragonhunt') && c>0){ var _nw=Date.now(), _wolfM=(M.mode==='wolfhunt'), _bearM=(M.mode==='bearhunt'), _wizM=(M.mode==='wizardhunt'), _drgM=(M.mode==='dragonhunt');
      var _blind=(M.snk&&_nw>M.snk.t0&&_nw<M.snk.t0+M.snk.dur)||(M.snk2&&_nw>M.snk2.t0&&_nw<M.snk2.t0+M.snk2.dur)
              ||(M.wolf&&_nw>M.wolf.t0&&_nw<M.wolf.t0+M.wolf.dur)||(M.pack&&_nw>M.pack.t0&&_nw<M.pack.t0+M.pack.dur)
              ||(M.paw&&_nw>M.paw.t0&&_nw<M.paw.t0+M.paw.dur)||(M.roar&&_nw>M.roar.t0&&_nw<M.roar.t0+M.roar.dur);
      if(_blind){ M.blindBonus=(M.blindBonus||0)+c; announce((_bearM?'🐻':(_wolfM?'🐺':'🐍'))+' BLIND CLEAR ×2!','combo'); try{ sfxCombo(5); }catch(_bc){} }
      /* every line WOUNDS the snake (blind clears cut twice as deep). Kill it and the
         hunt is over: no more sweeps, no more vines — free scoring till the clock ends. */
      if(!M.snkDead){
        var _hpWas=M.snkHP, _dmg;
        if(_drgM){ var _base=c*2.0;
          if(M.drgBelly && _nw<M.drgBelly){ _dmg=_base*2.5; announce('⚔ BELLY STRIKE! ×2.5','combo'); try{ sfxCombo(5); }catch(_bs5){} }
          else { _dmg=_base*0.25; if(c>=2) announce('🛡 Her scales turn the blow — wait for the belly!'); } }
        else if(_wizM){ _dmg=(c>=2)? c*1.8 : 0.4;                 // lifespan HALVED per Jethro (was c*0.9 / 0.2) — doubles+ still the real weapon
          if(c===1) announce('🧙 "Weak magic…" — doubles or better wound him'); }
        else { _dmg=c*(_bearM?3.85:(_wolfM?2.0:2.0))*(_blind?2:1); }   // snake lifespan cut to 75% per Jethro (1.5→2.0); wolf and bear unchanged
        if(_wizM){
          // rune DEFUSAL — clearing a rune's row before detonation: +3 bonus damage each
          if(M.runes&&M.runes.length){ var _defused=0;
            for(var _ri=M.runes.length-1;_ri>=0;_ri--){
              if(full.indexOf(M.runes[_ri].y)>=0){ M.runes.splice(_ri,1); _defused++; }
              else { var _below=0; for(var _fj=0;_fj<full.length;_fj++){ if(full[_fj]>M.runes[_ri].y) _below++; } M.runes[_ri].y+=_below; }
            }
            if(_defused){ _dmg+=_defused*3; announce('✨ RUNE DEFUSED ×'+_defused+' — bonus damage!','combo'); try{ sfxCombo(4); }catch(_df){} } }
          // shield absorbs — unless you SHATTER it
          if(M.wizShield && _nw<M.wizShield.until){
            M.wizShield.dmg+=_dmg;
            if(M.wizShield.dmg>=15){ M.wizShield=null; M.wizStun=_nw+3000; M.wizShatter={ t0:_nw, x:M.wizPos.x, y:M.wizPos.y };
              announce('💥 SHIELD SHATTERED — 3s OF ×3 DAMAGE!','tetris');
              try{ sfxWizShatter(1); boardShake(8); }catch(_sh2){} _dmg*=1; }
            else { M.wizShield.hit=_nw; announce('🔮 Absorbed… '+Math.ceil(15-M.wizShield.dmg)+' more to shatter'); _dmg=0; }
          }
          if(M.wizStun && _nw<M.wizStun && _dmg>0){ _dmg*=3; announce('😵 STUNNED — ×3 DAMAGE!','combo'); }
        }
        if(_bearM && M.guard && _nw<M.guard.until){
          var _heavy=(c>=3)||!!ts;                       // Triples, Tetrises and T-spins CRACK the guard
          if(_heavy){ M.guard=null; _dmg*=1.5; announce('💥 GUARD BROKEN! ×1.5!','tetris'); try{ boardShake(8); }catch(_gb){} }
          else { _dmg=0; announce('🛡 GUARDED — only a heavy blow (3+ lines / T-spin) gets through!'); }
        }
        M.snkHP=Math.max(0, M.snkHP - _dmg);                 // tougher beast: ~40 clean lines (or 20 blind) to slay
        // ── HIT FX: the snake takes the blow — flash, sap burst, damage number, wince ──
        M.snkHits=M.snkHits||[];
        M.snkHits.push({ t0:Date.now(), dmg:Math.round(_dmg), blind:_blind });
        try{ boardShake(_blind?2:1); }catch(_bs){}
        try{ var _aH=ac(), _oH=_aH.createOscillator(), _gH=_aH.createGain();       // wet THUD
          _oH.type='sine'; _oH.frequency.setValueAtTime(220,_aH.currentTime);
          _oH.frequency.exponentialRampToValueAtTime(60,_aH.currentTime+.12);
          _gH.gain.setValueAtTime(.35,_aH.currentTime); _gH.gain.exponentialRampToValueAtTime(.0001,_aH.currentTime+.16);
          _oH.connect(_gH); _gH.connect(_aH.destination); _oH.start(); _oH.stop(_aH.currentTime+.2); }catch(_ht){}
        if(M.snkHP<=0){ M.snkDead=true; M.snk=null; M.snk2=null; M.wolf=null; M.pack=null; M.paw=null; M.roar=null; M.guard=null; M.dizzyUntil=0; M.runes=[]; M.wizShield=null; M.wizStun=0; M.hexUntil=0; M.breath=null; M.drgBelly=0;
          M.snkSlayMs=Date.now()-(M._t0||Date.now());          // THE score: how fast you slew it
          if(M.mode==='snakehunt'){ try{ localStorage.setItem('mfWolfUnlocked','1'); }catch(_lu){}
            setTimeout(function(){ try{ showToast('🐺 BEAST LEVEL 2 UNLOCKED — the Wolf awaits in Solo Arcade.'); }catch(_tw){} },2800); }
          else if(M.mode==='wolfhunt'){ try{ localStorage.setItem('mfBearUnlocked','1'); }catch(_lb){}
            setTimeout(function(){ try{ showToast('🐻 BEAST LEVEL 3 UNLOCKED — the Bear stirs in Solo Arcade.'); }catch(_tb){} },2800); }
          else if(M.mode==='wizardhunt'){ try{ localStorage.setItem('mfDragonUnlocked','1'); }catch(_ld){}
            setTimeout(function(){ try{ showToast('🐉 BEAST LEVEL 5 UNLOCKED — THE DRAGON circles Solo Arcade.'); }catch(_td){} },2800); }
          else if(M.mode==='bearhunt'){ try{ localStorage.setItem('mfWizardUnlocked','1'); }catch(_lw){}
            setTimeout(function(){ try{ showToast('🧙 BEAST LEVEL 4 UNLOCKED — the Wizard awaits in Solo Arcade.'); }catch(_tz){} },2800); }
          setTimeout(function(){ if(M&&!M.ended) soloEnd('slain'); },2600);   // savor the kill, then the board
          // ── DEATH FX: convulsion, dissolve, banner — the board remembers this moment ──
          M.snkDeath={ t0:Date.now() };
          announce(_drgM?'💀 THE DRAGON FALLS FROM THE SKY!':(_wizM?'💀 THE WIZARD FALLS!':(_bearM?'💀 THE BEAR IS SLAIN!':(_wolfM?'💀 THE WOLF IS SLAIN!':'💀 THE SNAKE IS SLAIN!'))),'tetris'); try{ sfxWin(); tetConfetti({count:220,dur:3200}); }catch(_sl){}
          try{ var _aD=ac(), _tD=_aD.currentTime;
            var _oD=_aD.createOscillator(), _gD=_aD.createGain();                  // death BOOM
            _oD.type='sine'; _oD.frequency.setValueAtTime(130,_tD); _oD.frequency.exponentialRampToValueAtTime(30,_tD+.7);
            _gD.gain.setValueAtTime(.9,_tD); _gD.gain.exponentialRampToValueAtTime(.0001,_tD+.9);
            _oD.connect(_gD); _gD.connect(_aD.destination); _oD.start(_tD); _oD.stop(_tD+1);
            var _ln=_aD.sampleRate*1.8, _bf=_aD.createBuffer(1,_ln,_aD.sampleRate), _dd=_bf.getChannelData(0);   // dying hiss, falling
            for(var _i2=0;_i2<_ln;_i2++) _dd[_i2]=(Math.random()*2-1)*Math.pow(1-_i2/_ln,1.3);
            var _sr=_aD.createBufferSource(); _sr.buffer=_bf;
            var _bp=_aD.createBiquadFilter(); _bp.type='bandpass'; _bp.Q.value=.9;
            _bp.frequency.setValueAtTime(5600,_tD); _bp.frequency.exponentialRampToValueAtTime(500,_tD+1.7);
            var _gS=_aD.createGain(); _gS.gain.value=.18;
            _sr.connect(_bp); _bp.connect(_gS); _gS.connect(_aD.destination); _sr.start(_tD); }catch(_da){}
          try{ boardShake(8); }catch(_bd){} }
        else if(_hpWas>66&&M.snkHP<=66){ announce(_drgM?'🐉 Scales crack along her flank…':(_wizM?'🧙 His robes smoulder…':(_bearM?'🐻 The bear grunts…':(_wolfM?'🐺 The wolf staggers…':'🐍 The snake weakens…')))); }
        else if(_hpWas>33&&M.snkHP<=33){ announce(_drgM?'🐉 SHE BLEEDS FIRE!':(_wizM?'🧙 HIS MAGIC FALTERS!':(_bearM?'🐻 THE BEAR IS WOUNDED!':(_wolfM?'🐺 THE WOLF IS BLEEDING!':'🐍 THE SNAKE IS WOUNDED!')))); }
        /* DEATH THROES — at 10% the dying snake thrashes and hurls FIVE rows of vines
           in one convulsion. The kill is right there… if you survive the tantrum. */
        else if(_hpWas>10&&M.snkHP<=10&&M.snkHP>0){
          announce(_drgM?'☄️ SHE CALLS THE METEORS!':(_wizM?'🧙 FORBIDDEN INCANTATION!':(_bearM?'🐻 FINAL RAMPAGE!':(_wolfM?'🐺 THE PACK FRENZIES!':'🐍 DEATH THROES!'))),'tspin'); try{ boardShake((_bearM||_wizM||_drgM)?9:5); }catch(_dt){}
          if(_drgM){ setTimeout(function(){ if(M&&!M.ended&&M.alive&&!M.snkDead){ try{
            for(var _mt=0;_mt<3;_mt++){ var _my=3+Math.floor(Math.random()*(H-6)), _mx=Math.floor(Math.random()*(W-1));
              for(var _dy=0;_dy<2;_dy++)for(var _dx=0;_dx<2;_dx++){ if(M.grid[_my+_dy]&&M.grid[_my+_dy][_mx+_dx]>0) M.grid[_my+_dy][_mx+_dx]=8; }
              M.scorchFx.push({x:_mx,y:_my,t0:Date.now()}); }
            addGarbage(2); draw(); }catch(_mtx){} } },600); }
          setTimeout(function(){ if(M&&!M.ended&&M.alive&&!M.snkDead){ addGarbage(5); try{ updateIncoming(); }catch(_ui){} draw(); } },350); }
      } }
    if(M.mode==='overgrow' && c>0){ var _rl=0;
      for(var _fi=0;_fi<full.length;_fi++){ if(M.grid[full[_fi]].indexOf(8)<0) _rl++; }
      M.realLines=(M.realLines||0)+_rl; }
    if(c>0){ var _fys=full.slice(); if(c>=4){ _fys=[]; for(var _af=0;_af<H;_af++) _fys.push(_af); }   // TETRIS → whole-board flash
      M.flash={ys:_fys, t0:Date.now()}; spawnParticles(full); ensureFx(); }
    // Perfect clear = every non-cleared row is already empty (checked BEFORE removal).
    var willEmpty = c>0 && M.grid.every(function(row,ry){ return full.indexOf(ry)>=0 || row.every(function(v){return v===0;}); });
    var _animate = false;   // clears are INSTANT (no freeze) for smooth play; the flash still highlights the rows non-blockingly
    if(c>0 && !_animate){ _removeFull(full); }   // collapse immediately
    if(c>0){
      var sent=0, label='', pts=0;
      if(ts==='full'){
        if(c===1){ pts=800; label='T-Spin Single'; }
        else if(c===2){ pts=1200; label='T-Spin Double'; }
        else { pts=1600; label='T-Spin Triple'; }
        pts*=5; sent=3;   // Jethro: a real T-spin pays 5× points and always sends 3 garbage
      } else if(ts==='mini'){
        if(c===1){ sent=0; pts=200; label='T-Spin Mini Single'; }
        else { sent=1; pts=400; label='T-Spin Mini Double'; }
      } else {
        sent=[0,0,1,1,2][c]||2; pts=[0,100,300,500,800][c]||800;   // Double 1 · Triple 1 · Tetris 2
        label=(c===4?'Tetris':(c===3?'Triple':(c===2?'Double':'Single')));
      }
      // Back-to-back: kept by Tetris and any T-spin line clear (incl. mini). +1 line, +50% points.
      var b2b=!!(ts||c===4);
      if(b2b && M.b2b){ sent+=1; pts=Math.round(pts*1.5); label='B2B '+label; }
      M.b2b=b2b;
      M.combo=(M.combo||0)+1;
      if(M.combo>(M.maxCombo||0)) M.maxCombo=M.combo;
      sent+=COMBO_TABLE[Math.min(M.combo-1, COMBO_TABLE.length-1)];
      if(M._grbCleared>0 && sent>0){ sent=Math.floor(sent/2); }   // digging out garbage = half impact
      var perfect=willEmpty;
      if(perfect){ pts+=(c>=4?4000:2000); label='Perfect Clear'; }
      sent=Math.min(sent, MAX_SEND);   // normal cap
      if(perfect){ sent=15; }          // 💥 Perfect Clear = massive 15-line attack (bypasses the cap)
      var _lvWas=M.level;
      M.score+=pts*M.level; if(M.combo>1){ M.score+=50*(M.combo-1)*M.level; }   /* standard combo bonus: 50 × combo × level */  M.lines+=c; M.level=1+Math.floor(M.lines/10);
      sfxClear(c); if(M.combo>1){ sfxCombo(M.combo); var _cbn=M.combo; setTimeout(function(){ try{ voiceCombo(_cbn); }catch(_vc){} },0); }   // hype-woman, deferred off the clear frame
      if(M.level>_lvWas){ try{ sfxLevelUp(); }catch(_lu){} }   // level-up jingle
      try{ if(c>=4) boardShake(4); else if(ts) boardShake(3); }catch(_bs){}   // Tetris = big shake · T-spin = shake
      if(perfect){ announce('✨ PERFECT CLEAR! ✨','perfect'); perfectClearFx(); }
      else { var _ck=(label.indexOf('B2B')===0)?'b2b':(ts?'tspin':(c===4?'tetris':(M.combo>=3?'combo':'normal'))); announce(label + (M.combo>1?(' · COMBO '+M.combo):''), _ck); }
      // Garbage cancellation: your outgoing cancels incoming first, remainder goes out.
      if(M.pendingGarbage>0 && sent>0){ var cx=Math.min(M.pendingGarbage,sent); M.pendingGarbage-=cx; sent-=cx; updateIncoming(); }
      if(sent>0){ sfxAttack(); sendAttack(sent); }
      // Survival drives its own gravity off the clock, so leave it alone.
      if(M.mode!=='survival' && !(M.hexUntil&&M.hexUntil>Date.now())){
        var _floor=120;
        var ns=Math.max(_floor,700-(M.level-1)*55); if(ns!==M.dropMs){ M.dropMs=ns; clearInterval(M.loop); M.loop=setInterval(tick,M.dropMs); }
      }
    } else {
      M.combo=0;
      // A T-spin with no line clear still scores (and preserves back-to-back), then garbage dumps.
      if(ts){ M.score+=(ts==='mini'?100:400)*M.level; announce(ts==='mini'?'T-Spin Mini':'T-Spin','tspin'); }
      if(M.pendingGarbage>0){ M._respawned=false; var dump=Math.min(M.pendingGarbage,DUMP_MAX); addGarbage(dump); M.pendingGarbage-=dump; updateIncoming(); if(!M.alive || M._respawned){ M._respawned=false; draw(); return; } }
    }
    if(_animate){
      // Keep the highlighted rows on screen for a beat, THEN collapse (gravity) + spawn (spec 150–300ms).
      M.clearing=true; try{ stopAllRepeat(); }catch(_sr){} draw();
      setTimeout(function(){
        if(!M||!M.alive){ if(M) M.clearing=false; return; }
        _removeFull(full); M.flash=null; M.clearing=false; draw(); _afterClear();
      }, CLEAR_MS);
      return;
    }
    _afterClear();
  }
  function _removeFull(full){ for(var i=full.length-1;i>=0;i--){ M.grid.splice(full[i],1); M.grid.unshift(new Array(W).fill(0)); } }
  function _afterClear(){
    statBump('tet-me-score', M.score); statBump('tet-me-lines', M.lines);
    var _lv=el('tet-me-level'); if(_lv) _lv.textContent=M.level;
    if(M.mode==='sprint' && M.lines>=40){ soloEnd('done'); return; }   // Sprint 40 reached
    if(M.mode==='cheese' && garbageRows()===0){ soloEnd('done'); return; }   // Cheese Race: board is dug out
    spawn();
  }
  function announce(txt, kind){ if(!txt) return; var e=el('tet-announce'); if(!e) return; kind=kind||'normal';
    e.className=(kind!=='normal')?('k-'+kind):''; e.textContent=txt; e.style.animation='none'; void e.offsetWidth;
    var big=(kind==='tetris'||kind==='tspin'||kind==='b2b'||kind==='perfect'||kind==='combo');
    e.style.animation=(big?'tetPopBig 1.35s':'tetPop 1.15s')+' ease forwards';
    try{ sfxCallout(kind); }catch(_){}
  }
  function sfxCallout(kind){ try{
    if(kind==='tetris'){ [660,880,1174].forEach(function(f,i){ beep(f,0.12,'square',0.16,i*0.05); }); }
    else if(kind==='tspin'){ [523,784,1046].forEach(function(f,i){ beep(f,0.12,'triangle',0.16,i*0.05); }); }
    else if(kind==='b2b'){ [784,988,1318,1568].forEach(function(f,i){ beep(f,0.11,'square',0.15,i*0.05); }); }
    else if(kind==='perfect'){ [523,659,784,1046,1318,1568].forEach(function(f,i){ beep(f,0.16,'triangle',0.18,i*0.07); }); }
  }catch(e){} }
  // 💥 KO FINISHER — white flash + "KNOCKOUT" stamp + brief hitstop when you eliminate an enemy.
  var _koHit=null;
  function tetKOFinisher(name){ try{
    var ov=el('tet-ko-fin'); if(!ov) return;
    var sub=ov.querySelector('.kf-sub'); if(sub) sub.textContent=name?('☠ '+name+' is out'):'Enemy eliminated';
    ov.classList.remove('show'); void ov.offsetWidth; ov.classList.add('show');
    try{ sfxKO(); }catch(_){}
    // TRUE slow-motion: gravity crawls (~6x slower) with a time-dilation look, then ramps back.
    if(M && M.playing && !M.ended && M.loop && !_koHit){
      _koHit=true; var base=M.dropMs||700;
      clearInterval(M.loop); M.loop=setInterval(tick, Math.max(720, base*6));
      var ovl=el('tet-overlay'); if(ovl) ovl.classList.add('tet-slowmo');
      setTimeout(function(){
        if(M && M.playing && !M.ended){ if(M.loop) clearInterval(M.loop); M.loop=setInterval(tick, M.dropMs||base); }
        if(ovl) ovl.classList.remove('tet-slowmo'); _koHit=null;
      }, 900);
    }
    setTimeout(function(){ if(ov) ov.classList.remove('show'); }, 1200);
  }catch(e){} }
  function sfxKO(){ try{ beep(180,0.16,'square',0.28); beep(90,0.3,'sawtooth',0.24,0.02); beep(1200,0.05,'square',0.12,0.0); }catch(e){} }
  // ── Win-streak milestones (session) — celebrate 3/5/7/10/15/20/30 wins in a row ──
  var _winStreak=0;
  function tetWinStreak(won){
    if(won===true){ _winStreak++; if([3,5,7,10,15,20,30,50].indexOf(_winStreak)>=0) tetStreakBanner(_winStreak); }
    else if(won===false){ _winStreak=0; }
  }
  function tetStreakBanner(n){ try{ var e=el('tet-streak'); if(!e) return; e.textContent='🔥 '+n+' WINS IN A ROW!';
    e.classList.remove('show'); void e.offsetWidth; e.classList.add('show');
    try{ sfxWin(); }catch(_){}
    setTimeout(function(){ if(e) e.classList.remove('show'); }, 2200);
  }catch(e){} }
  // ── in-match taunts / emotes ──
  var EMOTES=['🔥','😎','🧊','😂','💀','👑'];
  var _emoteBarBuilt=false;
  function ensureEmoteBar(){ if(_emoteBarBuilt) return; _emoteBarBuilt=true;
    var bar=el('tet-emote-bar'); if(!bar){ bar=document.createElement('div'); bar.id='tet-emote-bar'; document.body.appendChild(bar); }
    bar.innerHTML=EMOTES.map(function(e,i){ return '<button onclick="tetSendEmote(\''+e+'\')" title="Press '+(i+1)+'" aria-label="emote">'+e+'</button>'; }).join('');
  }
  // keyboard emotes: number keys 1–6 fire an emote during a multiplayer match
  document.addEventListener('keydown', function(e){
    try{ if(!M||!M.playing||isSolo(M.mode)) return;
      if(e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
      var i={'1':0,'2':1,'3':2,'4':3,'5':4,'6':5}[e.key];
      if(i!=null && EMOTES[i]) tetSendEmote(EMOTES[i]);
    }catch(_){}
  });
  function showEmoteBar(on){ ensureEmoteBar(); var bar=el('tet-emote-bar'); if(bar) bar.classList.toggle('on',!!on); }
  window.tetSendEmote=function(em){ try{ if(!M||!M.playing) return;
    tetPopEmote(String(eid()), em);   // pop on my own board too, for feedback
    if(M.mode==='tourney'){ if(M.tchan) M.tchan.send({type:'broadcast',event:'emote',payload:{tid:M.matchId,from:eid(),em:em}}); }
    else if(!isSolo(M.mode) && typeof chan!=='undefined' && chan){ chan.send({type:'broadcast',event:'emote',payload:{from:eid(),em:em}}); }
  }catch(e){} };
  function tetPopEmote(id, em){ try{ if(!em) return;
    var target = (M && M.mode==='tourney') ? ((String(id)===String(eid()))?el('tet-me'):el('tacanvas-'+id))
                                           : ((String(id)===String(eid()))?el('tet-me'):el('tet-opp'));
    var rect = (target && target.getBoundingClientRect) ? target.getBoundingClientRect() : null;
    var x = rect ? (rect.left+rect.right)/2 : (window.innerWidth/2);
    var y = rect ? (rect.top + rect.height*0.26) : (window.innerHeight*0.4);
    var d=document.createElement('div'); d.className='tet-emote-pop'; d.textContent=em; d.style.left=x+'px'; d.style.top=y+'px';
    document.body.appendChild(d); setTimeout(function(){ if(d&&d.parentNode) d.parentNode.removeChild(d); }, 1500);
  }catch(e){} }
  // Fire the finisher when an ENEMY is eliminated (deduped; never for your own ally/self).
  function enemyEliminated(id, name){ try{
    if(!M || (M.mode!=='tourney')) return;
    if(String(id)===String(eid())) return;
    if(M.isTeam && M.teams && M.teams[String(id)]===M.teams[String(eid())]) return;   // ally — no taunt
    M._koShown=M._koShown||{}; if(M._koShown[id]) return; M._koShown[id]=true;
    tetKOFinisher(name);
  }catch(e){} }
  // ── Lock delay (modern feel): a resting piece gets a short grace period; moving/rotating resets it (capped). ──
  var LOCK_MS=500, LOCK_MAX=15;
  function grounded(){ return !!(M && M.cur && collide(M.cur.m, M.cur.x, M.cur.y+1)); }
  function clearLockTimer(){ if(M && M._lockTO){ clearTimeout(M._lockTO); M._lockTO=null; } }
  function armLock(){ if(!M || !M.alive || M._lockTO || !grounded()) return;
    if(M.mode==='ration') return;   // Ration: nothing locks on a timer — only a hard drop places a piece
    M._lockTO=setTimeout(function(){ M._lockTO=null; if(M && M.alive && grounded()){ lockPiece(); draw(); } }, LOCK_MS); }
  function bumpLock(){ if(!M) return;
    if(M.mode==='ration') return;   // see armLock — no timed lock in Ration
    if(!grounded()){ clearLockTimer(); return; }                 // moved off the ledge → let it fall
    if(!M._lockTO){ M._lockResets=0; armLock(); return; }        // just landed → start grace
    if((M._lockResets||0) >= LOCK_MAX){ clearLockTimer(); if(grounded()) lockPiece(); return; }
    M._lockResets=(M._lockResets||0)+1; clearLockTimer(); armLock();   // reset grace
  }
  function tick(){ if(!M||!M.alive||M.clearing) return; if(!collide(M.cur.m,M.cur.x,M.cur.y+1)){ M.cur.y++; clearLockTimer(); } else { armLock(); } draw(); }
  // ── Continuous controls (DAS/ARR): hold to keep moving ──
  var DAS=150, ARR=45, _rep={};
  function doDir(dir){ if(!M||!M.alive||M.clearing) return;
    /* 🐻 DIZZY — for 3s after the bear's roar, left and right are REVERSED. */
    var flip=(M.dizzyUntil && Date.now()<M.dizzyUntil)?-1:1;
    if(dir==='left') move(-1*flip); else if(dir==='right') move(1*flip);
    else if(dir==='down'){ if(!collide(M.cur.m,M.cur.x,M.cur.y+1)){ M.cur.y++; M.score+=1; clearLockTimer(); } else { armLock(); } }
    draw();
  }
  function startRepeat(dir){ if(_rep[dir]||!M||!M.alive) return;
    doDir(dir);
    _rep[dir]={ to:setTimeout(function(){ if(!_rep[dir]) return; _rep[dir].iv=setInterval(function(){ doDir(dir); }, dir==='down'?50:ARR); }, DAS) };
  }
  function stopRepeat(dir){ var r=_rep[dir]; if(!r) return; clearTimeout(r.to); if(r.iv) clearInterval(r.iv); delete _rep[dir]; }
  function stopAllRepeat(){ Object.keys(_rep).forEach(stopRepeat); }
  function onKey(e){
    if(!M||!M.alive) return; var k=e.key;
    if(k==='p'||k==='P'){ if(!e.repeat){ e.preventDefault(); if(typeof tetPauseToggle==='function') tetPauseToggle(); } return; }
    if(M.paused||M.clearing) return;   // swallow gameplay keys while paused/clearing
    if(k==='ArrowLeft'){ if(!_rep.left){ stopRepeat('right'); startRepeat('left'); } }
    else if(k==='ArrowRight'){ if(!_rep.right){ stopRepeat('left'); startRepeat('right'); } }
    else if(k==='ArrowDown'){ if(!_rep.down) startRepeat('down'); }
    else if(k==='ArrowUp'||k==='x'||k==='X'){ if(!e.repeat){ rotate(1); draw(); } }
    else if(k==='z'||k==='Z'||k==='Control'){ if(!e.repeat){ rotate(-1); draw(); } }
    else if(k==='c'||k==='C'){ if(!e.repeat){ holdPiece(); draw(); } }
    else if(k==='Shift'){ if(!e.repeat){ holdPiece(); draw(); } }
    else if(k===' '){ if(!e.repeat){ hardDrop(); } }
    else return;
    e.preventDefault();
  }
  function onKeyUp(e){ var k=e.key;
    if(k==='ArrowLeft') stopRepeat('left'); else if(k==='ArrowRight') stopRepeat('right'); else if(k==='ArrowDown') stopRepeat('down');
  }
  function attachControls(){ document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKeyUp); }
  function detachControls(){ document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); stopAllRepeat(); }
  // Touch/mouse hold on the on-screen buttons
  window.tetHold=function(a,ev){ if(ev){ ev.preventDefault(); } ac(); if(!M||!M.alive||M.clearing) return;
    if(a==='rot'){ rotate(1); draw(); } else if(a==='rotccw'){ rotate(-1); draw(); } else if(a==='hold'||a==='skip'){ holdPiece(); draw(); } else if(a==='drop'){ hardDrop(); } else startRepeat(a);
  };
  // Skip the current piece → jump to the next one. Once every 10 seconds.
  window.tetRelease=function(a){ if(a==='left'||a==='right'||a==='down') stopRepeat(a); };
  window.tetKey=window.tetHold;   // back-compat
  // ── Pause / Restart (solo modes only — never a live match) ──
  var SOLO_MODES=['sprint','ultra','combo','cheese','overgrow','snakehunt','wolfhunt','bearhunt','wizardhunt','dragonhunt','daily'];
  function _isSoloMode(){ return M && SOLO_MODES.indexOf(M.mode)>=0; }
  function _tetPauseNow(){
    if(!M||!M.alive) return; M.paused=true;
    if(M.loop){ clearInterval(M.loop); M.loop=null; }
    if(M.timer){ clearInterval(M.timer); M.timer=null; }
    try{ stopAllRepeat(); }catch(_){}
    try{ if(typeof stopMusic==='function') stopMusic(); }catch(_){}
    var ov=el('tet-pause-ov'); if(ov) ov.style.display='flex';
    var pb=el('tet-pause-btn'); if(pb) pb.textContent='▶';
  }
  function _tetResume(){
    if(!M) return; M.paused=false;
    var ov=el('tet-pause-ov'); if(ov) ov.style.display='none';
    var pb=el('tet-pause-btn'); if(pb) pb.textContent='⏸';
    if(!M.loop) M.loop=setInterval(tick, M.dropMs||700);
    if(!M.timer && M.timeLeft!=null){ M.timer=setInterval(function(){ M.timeLeft--; if(M.timeLeft<=0){ endByTime(); } else { status(''+fmtT(M.timeLeft)); if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000); }
    try{ if(typeof startMusic==='function') startMusic(); }catch(_){}
  }
  window.tetPauseToggle=function(){
    if(!M||!M.alive) return;
    if(!_isSoloMode()){ try{ announce('⏸ Pause is available in solo modes only'); }catch(_){} return; }
    if(M.paused) _tetResume(); else _tetPauseNow();
  };
  window.tetRestartSolo=function(){
    if(!M || !_isSoloMode()) return;
    var mode=M.mode;
    try{ if(M.loop) clearInterval(M.loop); if(M.timer) clearInterval(M.timer); if(M.net) clearInterval(M.net); }catch(_){}
    M.paused=false; M.alive=false;
    var ov=el('tet-pause-ov'); if(ov) ov.style.display='none';
    try{ if(typeof startSolo==='function') startSolo(mode); }catch(e){}
  };
  function move(d){ if(!collide(M.cur.m,M.cur.x+d,M.cur.y)){ M.cur.x+=d; M.lastRot=false; sfxMove(); bumpLock(); } }
  function rotate(dir){
    if(M.cur.type==='O'){ return; }
    var from=M.cur.rot, to=(from+(dir>0?1:3))%4, nm=STATES[M.cur.type][to];
    var kicks=getKicks(M.cur.type, from, to);
    for(var i=0;i<kicks.length;i++){ var kx=kicks[i][0], ky=kicks[i][1];
      if(!collide(nm, M.cur.x+kx, M.cur.y+ky)){ M.cur.rot=to; M.cur.m=nm; M.cur.x+=kx; M.cur.y+=ky; M.lastRot=true; M.lastKick=i; sfxRot(); bumpLock(); return true; }
    }
    return false;
  }
  function hardDrop(){ clearLockTimer(); var _dy0=M.cur.y; while(!collide(M.cur.m,M.cur.x,M.cur.y+1)){ M.cur.y++; M.score+=2; } sfxDrop(); try{ if(M.cur.y-_dy0>=2) boardShake(2); }catch(_hs){} lockPiece(); draw(); }
  // T-spin detection (3-corner rule) — must be a T whose last successful action was a rotation
  function tSpinType(){
    if(M.cur.type!=='T' || !M.lastRot) return null;
    var bx=M.cur.x, by=M.cur.y;
    function occ(cx,cy){ if(cx<0||cx>=W||cy<0||cy>=H) return true; return M.grid[cy] && M.grid[cy][cx]>0; }
    var tl=occ(bx,by), tr=occ(bx+2,by), bl=occ(bx,by+2), br=occ(bx+2,by+2);
    var cnt=(tl?1:0)+(tr?1:0)+(bl?1:0)+(br?1:0);
    if(cnt<3) return null;
    var front; // corners on the side the T points
    if(M.cur.rot===0) front=[tl,tr]; else if(M.cur.rot===1) front=[tr,br]; else if(M.cur.rot===2) front=[bl,br]; else front=[tl,bl];
    return (front[0] && front[1]) ? 'full' : 'mini';
  }

  // Stat tiles: write the number, then flick a CSS class so it pops. The animation is pure transform
  // on the compositor — it never touches the canvas loop, so it cannot cost the game a frame.
  function statBump(id, val){
    var e=el(id); if(!e) return;
    if(String(e.textContent)===String(val)) return;
    e.textContent=val;
    e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump');
  }
  function updateKoDisplay(){
    var a=el('tet-me-ko'); if(a){ statBump('tet-me-ko', (M.myKos||0)); }
    var b=el('tet-opp-ko'); if(b) b.textContent=(M.oppKos||0);
  }
  // ── Per-match rules ──────────────────────────────────────────────────────
  // Head-to-head play (tournament bracket AND 1v1 duels) runs 2:30 with a 5-KO limit.
  // Skill-Ladder bot practice keeps the old 3:00 / 3-KO rules.
  var BK_TIME=120, BK_KOS=5;   // grand-finals ruleset: every versus match is 2:00
  // Build stamp — lets us tell instantly whether a browser is running the current file or a cached one.
  var TET_BUILD='TET-2026.08.17-spectator';
  try{
    var _bs=Math.floor(BK_TIME/60)+':'+(BK_TIME%60<10?'0':'')+(BK_TIME%60);
    console.log('%c'+TET_BUILD+'%c  duel & bracket: '+_bs+' · '+BK_KOS+' KO · combo ['+COMBO_TABLE.join(',')+'] · cap '+MAX_SEND,
      'background:#ff6b1a;color:#fff;font-weight:800;padding:2px 6px;border-radius:4px','color:#9fb0d6');
  }catch(e){}
  try{ var _bt=document.getElementById('tet-build');
       if(_bt) _bt.textContent='· '+TET_BUILD+' · duel '+Math.floor(BK_TIME/60)+':'+(BK_TIME%60<10?'0':'')+(BK_TIME%60)+' / '+BK_KOS+' KO';
  }catch(e){}
  function koMax(){ return (M && M.koLimit) || 3; }
  function setKoMax(n){
    var a=el('tet-me-komax'); if(a) a.textContent=n;
    var b=el('tet-opp-komax'); if(b) b.textContent=n;
  }
  function applyRules(versus){
    M.koLimit = versus ? BK_KOS : 3;
    M.dur     = versus ? BK_TIME : 120;   // tournament royale also 2:00 now
    setKoMax(M.koLimit);
  }
  // KO but not eliminated: clear ONLY the garbage (grey, value 8) — your own placed
  // puzzle blocks stay exactly where they are. Incoming resets to 0.
  // Remove all garbage cells (value 8) from a grid, then let remaining blocks fall (per-column gravity).
  function stripGarbage(grid){
    // Remove the garbage (value 8); the remaining blocks fall straight down and SETTLE at the bottom of
    // their own column (same columns, no floating). Prevents blocks hanging over empty rows after a KO.
    for(var x=0;x<W;x++){
      var stack=[]; for(var y=H-1;y>=0;y--){ var v=grid[y][x]; if(v && v!==8) stack.push(v); }   // collect blocks bottom-up, drop garbage + gaps
      for(var yy=H-1,i=0;yy>=0;yy--){ grid[yy][x]=(i<stack.length)?stack[i++]:0; }
    }
  }
  function respawn(){
    stripGarbage(M.grid);
    M.pendingGarbage=0; M.combo=0; M.b2b=false; M.canHold=true; M.particles=[]; M._respawned=true;
    updateIncoming(); M.alive=true; spawn();
    announce('💥 KO! Garbage cleared · '+(koMax()-(M.kos||0))+' left'); sfxGarbage();
  }
  function topOut(){
    if(!M.alive) return; M.alive=false;
    if(M.mode==='sprint'||M.mode==='ultra'||M.mode==='combo'){ soloEnd('topout'); return; }   // solo run ends on top-out

    if(M.mode==='cheese'||M.mode==='survival'||M.mode==='overgrow'||M.mode==='snakehunt'||M.mode==='wolfhunt'||M.mode==='bearhunt'||M.mode==='wizardhunt'||M.mode==='dragonhunt'){ soloEnd('topout'); return; }
    boardHit(); koStamp();   // shake + KO stamp on my board
    M.kos=(M.kos||0)+1; M.myKos=M.kos; updateKoDisplay();
    var elim=(M.kos>=koMax());
    if(M.mode==='tourney'){
      if(M.players[eid()]) M.players[eid()].kos=M.kos;
      try{ M.tchan.send({type:'broadcast',event:'tko',payload:{tid:M.matchId,from:eid(),name:ename(),kos:M.kos,score:M.score,elim:elim}}); }catch(e){}
      if(elim){ tourneyOnMyDeath(); return; }
      respawn(); return;
    }
    if(M.mode==='training'){
      if(elim){ trainingEnd('userdead'); return; }
      respawn(); return;
    }
    // duel — 3 KOs and you lose the match
    try{ chan.send({type:'broadcast',event:'ko',payload:{from:eid(),kos:M.kos,elim:elim,score:M.score}}); }catch(e){}
    if(elim){ M.ended=true; finish(false, 'topout'); return; }
    respawn(); return;
  }
  function onOppOver(p){ if(!M) return; M.oppAlive=false; if(M.alive && !M.ended){ // opponent died first → I win
      try{ tetKOFinisher(M.oppName); }catch(_){}
      finish(true, 'oppout'); }
  }
  function endByTime(){
    if(M.ended) return;
    sfxUrgent(0);   // final buzzer
    if(M.mode==='tourney'){ tourneyTimeEnd(); return; }
    if(M.mode==='training'){ trainingEnd('time'); return; }
    // Battle rule: fewest KOs wins; tie on KOs → higher score; tie on both → draw.
    var myK=M.myKos||0, opK=M.oppKos||0;
    if(myK<opK) finish(true,'time');
    else if(myK>opK) finish(false,'time');
    else if(M.score>M.oppScore) finish(true,'time');
    else if(M.score<M.oppScore) finish(false,'time');
    else finish(null,'time');
  }
  function finish(iWon, how){
    if(!(M && M.bk)){ try{ tetWinStreak(iWon===true?true:(iWon===false?false:null)); }catch(_ws){} }   // count regular 1v1 duels toward the streak
    window._tetLast=null; try{ var _agv=el('tr-again'); if(_agv) _agv.style.display='none'; }catch(_e){}   // live VS: no instant rematch (needs re-invite)
    // Bracket tournament match → report the result and advance instead of the normal duel wrap-up.
    if(M && M.bk){ if(M._bkDone) return; M._bkDone=true; M.ended=true; M.alive=false; bkReport(iWon, how); return; }
    if(M.ended && how!=='topout') { /* allow override from topout already set */ }
    M.ended=true; M.alive=false; stopMusic();
    if(M.loop) clearInterval(M.loop); if(M.timer) clearInterval(M.timer); if(M.net) clearInterval(M.net);
    detachControls();
    if(iWon===true){
      status('🏆 You win!'); sfxWin(); showDuelResult(true); reportDuel('win');   // recorded to the ranking (no JMB points)
    } else if(iWon===false){
      status('💪 '+esc(M.oppName)+' won this round. Good game!'); sfxLose(); showDuelResult(false);   // winner reports both rows
    } else {
      status('🤝 Draw — good game!'); sfxTick(); showDuelResult(null); reportDuel('draw');
    }
  }
  // Record a finished 1v1 duel to the all-time ranking. Winner reports both players (authoritative);
  // on a draw, the lower employee_id reports — so each match is written exactly once.
  function reportDuel(res){
    if(!M || M.mode==='tourney' || M.mode==='training') return;
    var me=String(eid()), opp=String(M.oppId||''); if(!opp) return;
    var base=APPS_SCRIPT_URL+'?action=game_result&mode=duel&match_id='+encodeURIComponent(M.matchId||'');
    if(res==='win'){
      fetch(base+'&winner_id='+encodeURIComponent(me)+'&winner_name='+encodeURIComponent(ename())+'&winner_score='+(M.score||0)+'&winner_lines='+(M.lines||0)
        +'&loser_id='+encodeURIComponent(opp)+'&loser_name='+encodeURIComponent(M.oppName||'')+'&loser_score='+(M.oppScore||0)+'&loser_lines='+(M.oppLines||0)+'&_='+Date.now()).catch(function(){});
    } else if(res==='draw' && me<opp){
      fetch(base+'&draw=1&p1_id='+encodeURIComponent(me)+'&p1_name='+encodeURIComponent(ename())+'&p1_score='+(M.score||0)+'&p1_lines='+(M.lines||0)
        +'&p2_id='+encodeURIComponent(opp)+'&p2_name='+encodeURIComponent(M.oppName||'')+'&p2_score='+(M.oppScore||0)+'&p2_lines='+(M.oppLines||0)+'&_='+Date.now()).catch(function(){});
    }
  }
  // Post-match result dashboard (duel + training): WIN / LOSE / DRAW with both players' stats.
  function showDuelResult(iWon){
    var e=el('tet-result'); if(!e) return;
    // Everything below is wrapped so a single missing element or null M can never abort
    // the scoreboard — the arena must never freeze without showing a result.
    try{
      var win=(iWon===true), draw=(iWon===null);
      var _set=function(id,txt){ var n=el(id); if(n) n.textContent=txt; };
      _set('tr-emoji', win?'🏆':(draw?'🤝':'💪'));
      var t=el('tr-title'); if(t){ t.textContent = win?'You Win!':(draw?'Draw':'You Lose'); t.style.color = win?'#fbbf24':(draw?'#cdd6f5':'#f87171'); }
      var opp=(M&&M.oppName)||'your opponent';
      _set('tr-sub', win?('You beat '+esc(opp)+'!'):(draw?'Evenly matched — no winner':(esc(opp)+' won this one')));
      _set('tr-points','');   // 1v1 duels are for bragging rights only — no points
      var row=function(name,mine,sc,ln,ko){ return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;background:'+(mine?'rgba(255,107,26,.15)':'#ffffff')+';border:1px solid '+(mine?'rgba(255,107,26,.4)':'rgba(255,255,255,.08)')+';">'+
        '<div style="font-weight:700;font-size:13px;text-align:left;">'+esc(name)+(mine?' <span style="color:#fbbf24;font-size:10px;">(you)</span>':'')+'</div>'+
        '<div style="font-size:11.5px;color:#9fb0d6;white-space:nowrap;">'+sc+' pts · '+ln+' lines · KO '+ko+'/'+koMax()+'</div></div>'; };
      var st=el('tr-stats');
      if(st && M){ st.innerHTML = row(ename(), true, M.score||0, M.lines||0, M.myKos||0) + row(M.oppName||'Opponent', false, M.oppScore||0, M.oppLines||0, M.oppKos||0); }
      e.classList.toggle('tr-win', win);
      if(win){ try{ tetConfetti({count:170,dur:2800}); }catch(_){} }
      try{ voiceResult(win,draw); }catch(_v){}   // announcer: "You win!" / "You lose"
    }catch(_e){}
    e.style.display='flex';   // ALWAYS surface the scoreboard, no matter what happened above
  }
  function awardWin(){
    fetch(APPS_SCRIPT_URL+'?action=game_award&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())+'&match_id='+encodeURIComponent(M.matchId)+'&opponent='+encodeURIComponent(M.oppName||'')+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){
        var msg;
        if(d && d.ok && d.awarded>0){ msg='+50 JMB Points 🎉'; try{ if(typeof loadPoints==='function') loadPoints(); }catch(e){} }
        else if(d && d.ok && d.capped){ msg='Daily points cap reached — still a win!'; }
        else if(d && d.ok && d.already){ msg='🎉'; }
        else { msg='(Could not award points — try later.)'; }
        status('🏆 You win! '+msg); var p=el('tr-points'); if(p) p.textContent=msg;
      }).catch(function(){ status('🏆 You win! (Network issue awarding points.)'); var p=el('tr-points'); if(p) p.textContent='(Network issue awarding points.)'; });
  }
  function awardWin(){
    fetch(APPS_SCRIPT_URL+'?action=game_award&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())+'&match_id='+encodeURIComponent(M.matchId)+'&opponent='+encodeURIComponent(M.oppName||'')+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){
        if(d && d.ok && d.awarded>0){ status('🏆 You win! +50 JMB Points 🎉'); try{ if(typeof loadPoints==='function') loadPoints(); }catch(e){} }
        else if(d && d.ok && d.capped){ status('🏆 You win! (Daily points cap reached — no extra pts, still a win!)'); }
        else if(d && d.ok && d.already){ status('🏆 You win! 🎉'); }
        else { status('🏆 You win! (Could not award points — try later.)'); }
      }).catch(function(){ status('🏆 You win! (Network issue awarding points.)'); });
  }

  // ── Networking: broadcast my board so the opponent can watch ──
  function sendAttack(n){
    if(M.mode==='sprint'||M.mode==='ultra'||M.mode==='cheese'||M.mode==='overgrow'||M.mode==='snakehunt'||M.mode==='wolfhunt'||M.mode==='bearhunt'||M.mode==='wizardhunt'||M.mode==='dragonhunt'||M.mode==='survival'||M.mode==='ration') return;   // solo modes have no opponent
    attackPop(n);   // green "＋N SENT" pop on my board
    if(M.mode==='training'){ if(BOT){ BOT.pending+=n; } tetThrowGarbage(n, el('tet-opp')); return; }
    if(M.mode==='tourney'){
      var others=tourneyAliveIds().filter(function(id){ return id!==eid(); });
      if(M.isTeam && M.teams){ var _mt=M.teams[String(eid())]; others=others.filter(function(id){ return M.teams[String(id)] && M.teams[String(id)]!==_mt; }); }   // 2v2: only bury the enemy team
      if(!others.length || !M.tchan) return;
      var to=others[Math.floor(Math.random()*others.length)];
      tetThrowGarbage(n, el('tacanvas-'+to));   // arc the garbage at that foe's board
      try{ M.tchan.send({type:'broadcast',event:'tattack',payload:{tid:M.matchId,from:eid(),to:to,lines:n}}); }catch(e){}
      return;
    }
    tetThrowGarbage(n, el('tet-opp'));
    try{ chan.send({type:'broadcast',event:'attack',payload:{from:eid(),lines:n}}); }catch(e){}
  }
  function sendState(){
    // `sk` = the block design I have equipped. Everyone watching renders MY board with MY
    // skin, so an unlocked design is something other people actually see — which is the
    // whole point of buying one.
    if(M.mode==='tourney'){ if(!M.tchan) return;
      try{ M.tchan.send({type:'broadcast',event:'tstate',payload:{tid:M.matchId,from:eid(),name:ename(),grid:packGrid(),score:M.score,lines:M.lines,alive:M.alive,sk:EQUIPPED}}); }catch(e){}
      if(M.players&&M.players[eid()]){ M.players[eid()].score=M.score; M.players[eid()].lines=M.lines; }
      return;
    }
    if(!chan) return; try{ chan.send({type:'broadcast',event:'state',payload:{from:eid(),mid:M.matchId,grid:packGrid(),score:M.score,lines:M.lines,alive:M.alive,sk:EQUIPPED}}); }catch(e){}
  }
  function packGrid(){ // include current piece so opponent sees live movement
    var g=M.grid.map(function(r){return r.slice();});
    if(M.cur){ var m=M.cur.m; for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++){ if(m[r][c]){ var gy=M.cur.y+r,gx=M.cur.x+c; if(gy>=0&&gy<H&&gx>=0&&gx<W) g[gy][gx]=m[r][c]; } } }
    return g.map(function(r){ return r.join(''); }).join('|');
  }
  function onOppState(p){ if(!M||!p||String(p.from)===String(eid())) return;
    if(p.mid && M.matchId && String(p.mid)!==String(M.matchId)) return;   // ignore a stray board from another match
    M.oppScore=p.score||0; M.oppLines=p.lines||0; M.oppAlive=p.alive!==false;
    if(p.sk && DESIGNS[p.sk] && p.sk !== M.oppSkin){   // they've got a design on — show it
      M.oppSkin = p.sk;
      showOppSkin(p.sk);
    }
    if(p.grid){ M.oppGrid=p.grid.split('|').map(function(rw){ return rw.split('').map(Number); }); }
    el('tet-opp-score').textContent=M.oppScore; el('tet-opp-lines').textContent=M.oppLines;
    drawOpp();
  }
  // Name the opponent's design under their board, so it's obvious they're wearing one.
  function showOppSkin(id){
    var d = DESIGNS[id];
    var tag = el('tet-opp-skin');
    if(!tag) return;
    if(!d || id === 'classic'){ tag.style.display='none'; return; }
    tag.textContent = '🎨 ' + d.name;
    tag.style.display = 'inline-block';
  }

  // ── Rendering (premium: gradient bevel blocks, glow, ghost piece, clear flash) ──
  function hexAdj(hex,amt){ hex=String(hex).replace('#',''); if(hex.length!==6) return hex;
    var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    function a(c){ return Math.max(0,Math.min(255,Math.round(c+(amt>0?(255-c)*amt:c*amt)))); }
    return 'rgb('+a(r)+','+a(g)+','+a(b)+')'; }
  function rr(ctx,x,y,w,h,r){ if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); return; }
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  // Cheap beveled block — no per-cell gradient/shadow (those tanked performance).
  // ── Unlockable BLOCK DESIGNS (render styles). Costs must match backend TETRIS_THEMES. ──
  // Each .cell(ctx, px, py, cs, color) draws one cell — kept lightweight (no per-cell shadow/gradient).
  var DESIGNS={
    classic:{ name:'Classic', cost:0, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.17);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle=col; c.fill();
      c.fillStyle='rgba(255,255,255,.28)'; c.fillRect(px+3,py+3,cs-6,Math.max(2,cs*0.15));
      c.fillStyle='rgba(0,0,0,.22)'; c.fillRect(px+3,py+cs-Math.max(3,cs*0.18),cs-6,Math.max(2,cs*0.13)); } },
    pixel:{ name:'8-Bit', cost:120, hidden:true, cell:function(c,px,py,cs,col){ var s=Math.max(2,cs*0.18);
      c.fillStyle=col; c.fillRect(px+1,py+1,cs-2,cs-2);
      c.fillStyle=hexAdj(col,0.4); c.fillRect(px+1,py+1,cs-2,s); c.fillRect(px+1,py+1,s,cs-2);
      c.fillStyle=hexAdj(col,-0.4); c.fillRect(px+1,py+cs-1-s,cs-2,s); c.fillRect(px+cs-1-s,py+1,s,cs-2); } },
    outline:{ name:'Outline', cost:150, hidden:true, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.2);
      rr(c,px+2,py+2,cs-4,cs-4,r); c.save(); c.globalAlpha=0.16; c.fillStyle=col; c.fill(); c.restore();
      c.lineWidth=Math.max(2,cs*0.11); c.strokeStyle=col; c.stroke(); } },
    glossy:{ name:'Glossy', cost:200, hidden:true, cell:function(c,px,py,cs,col){ var r=Math.max(3,cs*0.24);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle=col; c.fill();
      c.save(); rr(c,px+3,py+3,cs-6,(cs-6)*0.44,Math.max(2,cs*0.18)); c.fillStyle='rgba(255,255,255,.42)'; c.fill(); c.restore();
      c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(px+3,py+cs-Math.max(3,cs*0.16),cs-6,Math.max(2,cs*0.11)); } },
    metallic:{ name:'Metallic', cost:280, hidden:true, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.16); var h=(cs-3)/3;
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      c.fillStyle=hexAdj(col,0.38); c.fillRect(px,py,cs,h+2);
      c.fillStyle=col; c.fillRect(px,py+h,cs,h+2);
      c.fillStyle=hexAdj(col,-0.32); c.fillRect(px,py+2*h,cs,h+3);
      c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(px+2,py+h-Math.max(1,cs*0.05),cs-4,Math.max(1,cs*0.06)); c.restore(); } },
    gem:{ name:'Gem', cost:400, cell:function(c,px,py,cs,col){ var m=2, a=px+m,b=py+m,w=cs-2*m,cx=px+cs/2,cy=py+cs/2;
      c.fillStyle=col; c.fillRect(a,b,w,w);
      c.fillStyle=hexAdj(col,0.45); c.beginPath(); c.moveTo(a,b); c.lineTo(a+w,b); c.lineTo(cx,cy); c.closePath(); c.fill();
      c.fillStyle=hexAdj(col,0.2);  c.beginPath(); c.moveTo(a,b); c.lineTo(a,b+w); c.lineTo(cx,cy); c.closePath(); c.fill();
      c.fillStyle=hexAdj(col,-0.35);c.beginPath(); c.moveTo(a+w,b); c.lineTo(a+w,b+w); c.lineTo(cx,cy); c.closePath(); c.fill();
      c.fillStyle=hexAdj(col,-0.15);c.beginPath(); c.moveTo(a,b+w); c.lineTo(a+w,b+w); c.lineTo(cx,cy); c.closePath(); c.fill();
      c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(cx-cs*0.06,cy-cs*0.06,cs*0.12,cs*0.12); } },
    neon:{ name:'Neon', cost:500, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.2);
      rr(c,px+2,py+2,cs-4,cs-4,r); c.fillStyle=hexAdj(col,-0.62); c.fill();
      c.lineWidth=Math.max(1.5,cs*0.09); c.strokeStyle=col; c.stroke();
      c.save(); c.globalAlpha=0.5; rr(c,px+cs*0.28,py+cs*0.28,cs*0.44,cs*0.44,cs*0.1); c.fillStyle=col; c.fill(); c.restore(); } },
    // ── Premium creative designs (art / cartoons / nature) ──
    bubble:{ name:'Bubble', cost:600, cell:function(c,px,py,cs,col){ var cx=px+cs/2,cy=py+cs/2,rd=cs*0.47;
      c.beginPath(); c.arc(cx,cy,rd,0,6.2832); c.fillStyle=col; c.fill();
      c.save(); c.globalAlpha=.5; c.beginPath(); c.arc(cx-rd*0.32,cy-rd*0.34,rd*0.34,0,6.2832); c.fillStyle='#fff'; c.fill(); c.restore(); } },
    heart:{ name:'Heart', cost:750, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.2);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle=hexAdj(col,-0.4); c.fill();
      var cx=px+cs/2,cy=py+cs*0.42,rr2=cs*0.16; c.fillStyle=hexAdj(col,0.32);
      c.beginPath(); c.arc(cx-rr2*0.95,cy,rr2,0,6.2832); c.fill();
      c.beginPath(); c.arc(cx+rr2*0.95,cy,rr2,0,6.2832); c.fill();
      c.beginPath(); c.moveTo(cx-rr2*1.85,cy+rr2*0.35); c.lineTo(cx+rr2*1.85,cy+rr2*0.35); c.lineTo(cx,py+cs*0.82); c.closePath(); c.fill(); } },
    star:{ name:'Star', cost:800, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.2);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle=hexAdj(col,-0.4); c.fill();
      _starPath(c,px+cs/2,py+cs*0.52,cs*0.4); c.fillStyle=hexAdj(col,0.4); c.fill(); } },
    flower:{ name:'Flower', cost:900, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.2), cx=px+cs/2,cy=py+cs/2;
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle=hexAdj(col,-0.42); c.fill();
      c.fillStyle=hexAdj(col,0.34);
      for(var i=0;i<5;i++){ var a=-Math.PI/2+i*2*Math.PI/5; c.beginPath(); c.arc(cx+Math.cos(a)*cs*0.21,cy+Math.sin(a)*cs*0.21,cs*0.16,0,6.2832); c.fill(); }
      c.fillStyle='#ffe08a'; c.beginPath(); c.arc(cx,cy,cs*0.13,0,6.2832); c.fill(); } },
    candy:{ name:'Candy', cost:950, cell:function(c,px,py,cs,col){ var r=Math.max(3,cs*0.26);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle=col; c.fill();
      c.save(); rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.clip(); c.strokeStyle=hexAdj(col,0.45); c.lineWidth=cs*0.16;
      c.beginPath(); c.moveTo(px-cs,py+cs*0.2); c.lineTo(px+cs*1.2,py-cs*0.9); c.moveTo(px-cs,py+cs*0.9); c.lineTo(px+cs*1.2,py-cs*0.2); c.stroke(); c.restore();
      c.save(); c.globalAlpha=.4; c.beginPath(); c.arc(px+cs*0.34,py+cs*0.3,cs*0.14,0,6.2832); c.fillStyle='#fff'; c.fill(); c.restore(); } },
    kitty:{ name:'Kitty', cost:1100, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.22);
      rr(c,px+2,py+2,cs-4,cs-4,r); c.fillStyle=col; c.fill();
      c.fillStyle=hexAdj(col,-0.28);
      c.beginPath(); c.moveTo(px+cs*0.2,py+cs*0.28); c.lineTo(px+cs*0.16,py+cs*0.06); c.lineTo(px+cs*0.4,py+cs*0.2); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(px+cs*0.8,py+cs*0.28); c.lineTo(px+cs*0.84,py+cs*0.06); c.lineTo(px+cs*0.6,py+cs*0.2); c.closePath(); c.fill();
      c.fillStyle='#1b1b2b'; c.beginPath(); c.arc(px+cs*0.38,py+cs*0.5,cs*0.07,0,6.2832); c.fill(); c.beginPath(); c.arc(px+cs*0.62,py+cs*0.5,cs*0.07,0,6.2832); c.fill();
      c.fillStyle='#ff8fab'; c.beginPath(); c.moveTo(px+cs*0.46,py+cs*0.62); c.lineTo(px+cs*0.54,py+cs*0.62); c.lineTo(px+cs*0.5,py+cs*0.69); c.closePath(); c.fill(); } },
    galaxy:{ name:'Galaxy', cost:1300, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.2);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.fillStyle='#0e1330'; c.fill();
      c.save(); rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.clip(); c.globalAlpha=.55; c.beginPath(); c.arc(px+cs*0.6,py+cs*0.42,cs*0.4,0,6.2832); c.fillStyle=col; c.fill(); c.restore();
      c.fillStyle='#fff'; c.fillRect(px+cs*0.24,py+cs*0.3,1.5,1.5); c.fillRect(px+cs*0.7,py+cs*0.66,1.5,1.5); c.fillRect(px+cs*0.5,py+cs*0.2,1.2,1.2); c.fillRect(px+cs*0.34,py+cs*0.72,1.2,1.2); } },
    rainbow:{ name:'Rainbow', cost:1600, cell:function(c,px,py,cs,col){ var r=Math.max(2,cs*0.18);
      var rb=['#ff4d4d','#ff9f43','#ffe14d','#5fd35f','#4d9bff','#8a5cff']; var bh=(cs-3)/rb.length;
      c.save(); rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.clip();
      for(var i=0;i<rb.length;i++){ c.fillStyle=rb[i]; c.fillRect(px,py+1.5+i*bh,cs,bh+1); }
      c.globalAlpha=.32; c.fillStyle='#fff'; c.fillRect(px+2,py+3,cs-4,cs*0.16); c.restore(); } },

    // ══════════════ PREMIUM MATERIALS — real textures, themed, out-of-the-box ══════════════
    lava:{ name:'Molten Lava', cost:1800, cell:function(c,px,py,cs,col,glow){ var r=Math.max(2,cs*0.18);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      var g=c.createLinearGradient(px,py,px,py+cs); g.addColorStop(0,'#2b2320'); g.addColorStop(1,'#130e0c'); c.fillStyle=g; c.fillRect(px,py,cs,cs);
      c.lineCap='round'; c.save(); c.shadowColor=col; c.shadowBlur=cs*0.5; c.strokeStyle=_cs2(col,0.45); c.lineWidth=Math.max(1.4,cs*0.10);
      c.beginPath(); c.moveTo(px+cs*0.16,py+cs*0.1); c.lineTo(px+cs*0.42,py+cs*0.5); c.lineTo(px+cs*0.3,py+cs*0.92);
      c.moveTo(px+cs*0.42,py+cs*0.5); c.lineTo(px+cs*0.82,py+cs*0.6); c.lineTo(px+cs*0.92,py+cs*0.94); c.stroke(); c.restore();
      if(cs>=14){ c.fillStyle=_cs2(col,0.1); for(var i=0;i<4;i++){ c.beginPath(); c.arc(px+cs*(0.22+0.19*i),py+cs*((0.2+i*0.27)%1),Math.max(1,cs*0.045),0,6.283); c.fill(); } }
      c.restore(); c.fillStyle='rgba(255,180,120,.10)'; c.fillRect(px+3,py+3,cs-6,Math.max(1,cs*0.10)); } },

    ice:{ name:'Glacier', cost:2000, cell:function(c,px,py,cs,col,glow){ var r=Math.max(3,cs*0.22);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      var g=c.createLinearGradient(px,py,px+cs,py+cs); g.addColorStop(0,_cx(col,'#ffffff',0.72)); g.addColorStop(0.5,_cx(col,'#ffffff',0.4)); g.addColorStop(1,_cx(col,'#8fd7ff',0.28));
      c.fillStyle=g; c.fillRect(px,py,cs,cs);
      c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=Math.max(.8,cs*0.04); c.lineCap='round';
      c.beginPath(); c.moveTo(px+cs*0.5,py+cs*0.14); c.lineTo(px+cs*0.44,py+cs*0.5); c.lineTo(px+cs*0.62,py+cs*0.86);
      c.moveTo(px+cs*0.44,py+cs*0.5); c.lineTo(px+cs*0.16,py+cs*0.58); c.moveTo(px+cs*0.44,py+cs*0.5); c.lineTo(px+cs*0.8,py+cs*0.4); c.stroke();
      c.restore();
      c.save(); rr(c,px+3,py+3,(cs-6)*0.5,(cs-6)*0.34,Math.max(2,cs*0.12)); c.fillStyle='rgba(255,255,255,.5)'; c.fill(); c.restore(); } },

    wood:{ name:'Oak Timber', cost:2200, cell:function(c,px,py,cs,col,glow){ var r=Math.max(2,cs*0.14);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      var base=_cx(col,'#7a4a24',0.55); c.fillStyle=base; c.fillRect(px,py,cs,cs);
      c.strokeStyle=_cs2(base,-0.28); c.lineWidth=Math.max(.8,cs*0.035);
      for(var i=1;i<=4;i++){ var yy=py+cs*i/5; c.beginPath(); for(var q=0;q<=6;q++){ var xx=px+cs*q/6, wy=yy+Math.sin(q*1.3+i)*cs*0.03; q?c.lineTo(xx,wy):c.moveTo(xx,wy); } c.stroke(); }
      if(cs>=14){ c.strokeStyle=_cs2(base,-0.42); c.lineWidth=1; c.beginPath(); c.ellipse(px+cs*0.7,py+cs*0.4,cs*0.09,cs*0.06,0.5,0,6.283); c.stroke(); }
      c.restore(); c.fillStyle='rgba(255,240,220,.10)'; c.fillRect(px+3,py+3,cs-6,Math.max(1,cs*0.08)); } },

    marble:{ name:'Marble', cost:2600, cell:function(c,px,py,cs,col,glow){ var r=Math.max(3,cs*0.2);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      c.fillStyle=_cx(col,'#ffffff',0.68); c.fillRect(px,py,cs,cs);
      c.globalAlpha=0.5; c.strokeStyle=_cx(col,'#2b2b3a',0.5); c.lineWidth=Math.max(.8,cs*0.03); c.lineCap='round';
      c.beginPath(); c.moveTo(px+cs*0.1,py+cs*0.2); c.bezierCurveTo(px+cs*0.4,py+cs*0.1,px+cs*0.5,py+cs*0.7,px+cs*0.9,py+cs*0.55); c.stroke();
      c.lineWidth=Math.max(.6,cs*0.02); c.beginPath(); c.moveTo(px+cs*0.2,py+cs*0.9); c.bezierCurveTo(px+cs*0.45,py+cs*0.6,px+cs*0.55,py+cs*0.45,px+cs*0.75,py+cs*0.15); c.stroke();
      c.globalAlpha=1; c.restore();
      c.save(); rr(c,px+3,py+3,cs-6,(cs-6)*0.4,Math.max(2,cs*0.14)); c.fillStyle='rgba(255,255,255,.3)'; c.fill(); c.restore(); } },

    circuit:{ name:'Circuit', cost:3000, cell:function(c,px,py,cs,col,glow){ var r=Math.max(2,cs*0.16);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      c.fillStyle=_cs2(_cx(col,'#0a3b2e',0.62),-0.08); c.fillRect(px,py,cs,cs);
      var tr=_cs2(col,0.4); c.strokeStyle=tr; c.lineWidth=Math.max(1,cs*0.05); c.lineJoin='round';
      c.beginPath(); c.moveTo(px+cs*0.14,py+cs*0.3); c.lineTo(px+cs*0.5,py+cs*0.3); c.lineTo(px+cs*0.5,py+cs*0.72); c.lineTo(px+cs*0.86,py+cs*0.72);
      c.moveTo(px+cs*0.3,py+cs*0.9); c.lineTo(px+cs*0.3,py+cs*0.55); c.lineTo(px+cs*0.68,py+cs*0.55); c.lineTo(px+cs*0.68,py+cs*0.16); c.stroke();
      if(cs>=14){ c.fillStyle=tr; [[0.86,0.72],[0.68,0.16],[0.3,0.9]].forEach(function(p){ c.beginPath(); c.arc(px+cs*p[0],py+cs*p[1],Math.max(1.4,cs*0.055),0,6.283); c.fill(); }); }
      c.save(); c.shadowColor=col; c.shadowBlur=cs*0.4; c.fillStyle=_cs2(col,0.55); c.beginPath(); c.arc(px+cs*0.5,py+cs*0.3,Math.max(1.6,cs*0.07),0,6.283); c.fill(); c.restore();
      c.restore(); } },

    gold:{ name:'Bullion', cost:3500, cell:function(c,px,py,cs,col,glow){ var r=Math.max(2,cs*0.14); var m=1.5,a=px+m,b=py+m,w=cs-2*m;
      var top=_cs2(col,0.5), lit=_cs2(col,0.22), dk=_cs2(col,-0.42);
      c.fillStyle=dk; rr(c,a,b,w,w,r); c.fill();
      var bev=Math.max(2,w*0.14), ix=a+bev,iy=b+bev,iw=w-2*bev;
      function q4(p,f){ c.beginPath(); c.moveTo(p[0][0],p[0][1]); c.lineTo(p[1][0],p[1][1]); c.lineTo(p[2][0],p[2][1]); c.lineTo(p[3][0],p[3][1]); c.closePath(); c.fillStyle=f; c.fill(); }
      q4([[a,b],[a+w,b],[ix+iw,iy],[ix,iy]], top);
      q4([[a,b],[ix,iy],[ix,iy+iw],[a,b+w]], lit);
      q4([[a+w,b],[a+w,b+w],[ix+iw,iy+iw],[ix+iw,iy]], _cs2(col,-0.26));
      q4([[a,b+w],[a+w,b+w],[ix+iw,iy+iw],[ix,iy+iw]], dk);
      c.save(); rr(c,ix,iy,iw,iw,Math.max(1,w*0.06)); var fg=c.createLinearGradient(ix,iy,ix+iw,iy+iw); fg.addColorStop(0,_cs2(col,0.35)); fg.addColorStop(1,lit); c.fillStyle=fg; c.fill(); c.clip();
      c.globalAlpha=0.5; c.fillStyle='#fff'; c.beginPath(); c.moveTo(ix,iy+iw*0.3); c.lineTo(ix+iw*0.5,iy); c.lineTo(ix+iw*0.72,iy); c.lineTo(ix,iy+iw*0.62); c.closePath(); c.fill(); c.globalAlpha=1; c.restore(); } },

    // Earned, not bought — unlocks at rating 130. See RATING_UNLOCKS.
    aurora:{ name:'Aurora', cost:0, req:130, cell:function(c,px,py,cs,col,glow){ var r=Math.max(3,cs*0.2);
      rr(c,px+1.5,py+1.5,cs-3,cs-3,r); c.save(); c.clip();
      c.fillStyle='#0b1020'; c.fillRect(px,py,cs,cs);
      var bands=[_cs2(col,0.3), _cx(col,'#00e5ff',0.62), _cx(col,'#ff4dd2',0.55), _cx(col,'#7cff6b',0.5)];
      c.globalAlpha=0.55; c.save(); c.translate(px+cs*0.5,py+cs*0.5); c.rotate(-0.6);
      for(var i=0;i<bands.length;i++){ c.fillStyle=bands[i]; c.fillRect(-cs, -cs*0.6+i*cs*0.34, cs*2, cs*0.26); }
      c.restore(); c.globalAlpha=1;
      c.globalAlpha=0.22; c.fillStyle='#fff'; c.fillRect(px+2,py+3,cs-4,Math.max(1,cs*0.12)); c.globalAlpha=1;
      c.restore(); } },

    // ══════════════════ CHOCOLATE ══════════════════
    // A moulded chocolate square. Each cell is a slab: bevelled edges that catch the
    // light from the top-left, a pressed inner panel like a real bar, three embossed
    // pips, and a glossy sheen across the corner.
    //
    // The piece's colour isn't thrown away — it's *folded into* the cocoa, so an I-piece
    // is cool milk chocolate and a Z-piece is a rich ruby-dark. You can still read the
    // board at a glance (which matters, it's a game) but the whole thing looks edible.
    // Not for sale at any price — unlocks at a rating of 100. See RATING_UNLOCKS in the Apps Script.
    //
    // A moulded chocolate-bar square, built the way a real one is: a deep GROOVE around the
    // outside, then four CHAMFERED WALLS rising inward like a truncated pyramid, then a flat
    // glossy PLATEAU on top. The four walls are lit from the top-left — bright top, mid left,
    // dark right, darkest bottom — and that four-way bevel is the whole trick: it's what makes
    // a flat canvas square read as a solid piece of chocolate you could snap off.
    choco:{ name:'Chocolate', cost:0, req:100, cell:function(c,px,py,cs,col,glow){
      var b   = _choc(col);                    // a real chocolate, not a tinted piece colour
      var gap = Math.max(1, cs*0.055);         // the groove between squares
      var x0  = px+gap, y0 = py+gap, w = cs-2*gap;
      var bev = Math.max(1.6, w*0.20);         // how far the chamfer walls slope inward
      var rr2 = Math.max(1, w*0.10);

      // shades: the four walls + the plateau
      var wTop = _cs2(b,  0.30), wLeft = _cs2(b, 0.12),
          wRight = _cs2(b,-0.30), wBot = _cs2(b,-0.46),
          face = b, faceLo = _cs2(b,-0.10);

      // ── the groove (the dark gap you'd snap along)
      c.fillStyle = _cs2(b,-0.62);
      rr(c, px, py, cs, cs, Math.max(1, cs*0.12)); c.fill();

      // ── the four chamfered walls
      var ix = x0+bev, iy = y0+bev, iw = w-2*bev;
      function quad(p1,p2,p3,p4,fill){
        c.beginPath(); c.moveTo(p1[0],p1[1]); c.lineTo(p2[0],p2[1]);
        c.lineTo(p3[0],p3[1]); c.lineTo(p4[0],p4[1]); c.closePath();
        c.fillStyle = fill; c.fill();
      }
      quad([x0,y0],[x0+w,y0],[ix+iw,iy],[ix,iy], wTop);                       // top wall  — catches the light
      quad([x0,y0],[ix,iy],[ix,iy+iw],[x0,y0+w], wLeft);                      // left wall
      quad([x0+w,y0],[x0+w,y0+w],[ix+iw,iy+iw],[ix+iw,iy], wRight);           // right wall — in shadow
      quad([x0,y0+w],[x0+w,y0+w],[ix+iw,iy+iw],[ix,iy+iw], wBot);             // bottom wall — darkest

      // ── the plateau, then whatever confection sits on top of it
      c.save();
      rr(c, ix, iy, iw, iw, rr2);
      var pg = c.createLinearGradient(ix, iy, ix+iw*0.4, iy+iw);
      pg.addColorStop(0, _cs2(face, 0.10));
      pg.addColorStop(1, faceLo);
      c.fillStyle = pg; c.fill();
      c.clip();

      _chocSurface(c, ix, iy, iw, b, _chocTex(col), cs);   // ← the texture

      // the sheen — a soft diagonal band across the top-left
      c.globalAlpha = 0.14; c.fillStyle = '#fff6e8';
      c.beginPath();
      c.moveTo(ix, iy);
      c.lineTo(ix+iw*0.58, iy);
      c.lineTo(ix, iy+iw*0.58);
      c.closePath(); c.fill();
      c.globalAlpha = 1;
      c.restore();

      // crisp lit edge along the top of the plateau — the "snap" line
      c.strokeStyle = 'rgba(255,240,220,.30)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(ix+rr2, iy+0.5); c.lineTo(ix+iw-rr2, iy+0.5); c.stroke();

      // ── freshly tempered: the active piece glows
      if(glow){
        c.save();
        c.shadowColor = 'rgba(255,190,120,.8)'; c.shadowBlur = cs*0.55;
        rr(c, x0, y0, w, w, rr2);
        c.strokeStyle = 'rgba(255,218,175,.6)'; c.lineWidth = 1.4; c.stroke();
        c.restore();
      }
    } },
    // ══════════════ JEWELS — seven gems, one per piece, each square-cut ══════════════
    jewels:{ name:'Jewels', cost:6500, cell:function(c,px,py,cs,col,glow){
      function P(pts,f){ c.beginPath(); for(var i=0;i<pts.length;i++){ i?c.lineTo(pts[i][0],pts[i][1]):c.moveTo(pts[i][0],pts[i][1]); } c.closePath(); c.fillStyle=f; c.fill(); }
      var lc=String(col).toLowerCase(), m=cs*0.07, a=px+m, b=py+m, w=cs-2*m, cx=px+cs/2, cy=py+cs/2;
      var cut=({'#ef4444':'bril','#facc15':'bril','#3b82f6':'cush','#22c55e':'step','#22d3ee':'step','#a855f7':'pyr','#f97316':'cab'})[lc]||'rough';
      if(cut==='bril'){ rr(c,a,b,w,w,cs*0.12); c.save(); c.clip(); c.fillStyle=hexAdj(col,-0.22); c.fillRect(px,py,cs,cs);
        var o=[[a,b],[a+w/2,b],[a+w,b],[a+w,b+w/2],[a+w,b+w],[a+w/2,b+w],[a,b+w],[a,b+w/2]];
        var ir=o.map(function(p){return [cx+(p[0]-cx)*0.44,cy+(p[1]-cy)*0.44];});
        for(var i=0;i<8;i++){ var j=(i+1)%8; P([o[i],o[j],ir[j],ir[i]],hexAdj(col,(i%2)?-0.28:0.32)); }
        P(ir,hexAdj(col,0.5)); c.restore(); c.fillStyle='rgba(255,255,255,.9)'; c.fillRect(cx-cs*0.045,cy-cs*0.045,cs*0.09,cs*0.09);
      } else if(cut==='cush'){ rr(c,a,b,w,w,cs*0.14); c.save(); c.clip(); c.fillStyle=hexAdj(col,-0.16); c.fillRect(px,py,cs,cs);
        var e=[[cx,b],[a+w,cy],[cx,b+w],[a,cy]], k=[[a,b],[a+w,b],[a+w,b+w],[a,b+w]];
        for(var q=0;q<4;q++){ P([k[q],e[q],[cx,cy]],hexAdj(col,0.30)); P([e[q],k[(q+1)%4],[cx,cy]],hexAdj(col,-0.24)); }
        P([[cx,cy-w*0.22],[cx+w*0.22,cy],[cx,cy+w*0.22],[cx-w*0.22,cy]],hexAdj(col,0.5)); c.restore(); c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(cx-cs*0.04,cy-cs*0.04,cs*0.08,cs*0.08);
      } else if(cut==='step'){ rr(c,a,b,w,w,cs*0.1); c.fillStyle=hexAdj(col,-0.16); c.fill();
        rr(c,a+w*0.14,b+w*0.14,w*0.72,w*0.72,cs*0.07); c.fillStyle=hexAdj(col,0.12); c.fill();
        rr(c,a+w*0.28,b+w*0.28,w*0.44,w*0.44,cs*0.05); c.fillStyle=hexAdj(col,0.42); c.fill();
        c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=1; c.beginPath(); c.moveTo(a+w*0.2,b+w*0.14); c.lineTo(a+w*0.8,b+w*0.14); c.stroke();
      } else if(cut==='pyr'){ rr(c,a,b,w,w,cs*0.12); c.save(); c.clip();
        P([[a,b],[a+w,b],[cx,cy]],hexAdj(col,0.42)); P([[a,b],[a,b+w],[cx,cy]],hexAdj(col,0.12));
        P([[a+w,b],[a+w,b+w],[cx,cy]],hexAdj(col,-0.34)); P([[a,b+w],[a+w,b+w],[cx,cy]],hexAdj(col,-0.14)); c.restore();
        c.fillStyle='rgba(255,255,255,.6)'; c.fillRect(cx-cs*0.04,cy-cs*0.04,cs*0.08,cs*0.08);
      } else if(cut==='cab'){ rr(c,a,b,w,w,cs*0.18); c.save(); c.clip();
        var g=c.createRadialGradient(cx-w*0.28,cy-w*0.28,w*0.08,cx,cy,w*0.62); g.addColorStop(0,hexAdj(col,0.55)); g.addColorStop(0.55,col); g.addColorStop(1,hexAdj(col,-0.4));
        c.fillStyle=g; c.fillRect(px,py,cs,cs); c.fillStyle=hexAdj(col,-0.3); c.beginPath(); c.arc(cx+w*0.16,cy+w*0.12,w*0.08,0,6.283); c.fill();
        c.globalAlpha=0.7; c.beginPath(); c.arc(cx-w*0.24,cy-w*0.26,w*0.14,0,6.283); c.fillStyle='#fff'; c.fill(); c.globalAlpha=1; c.restore();
      } else { rr(c,a,b,w,w,cs*0.12); c.fillStyle=hexAdj(col,-0.1); c.fill();
        P([[a,b],[a+w*0.6,b],[a,b+w*0.6]],hexAdj(col,0.16)); P([[a+w,b+w],[a+w*0.4,b+w],[a+w,b+w*0.4]],hexAdj(col,-0.26)); }
    } },
    // ══════════════ EMOJI — a different expressive face per piece ══════════════
    emoji:{ name:'Emoji', cost:5000, cell:function(c,px,py,cs,col,glow){
      var lc=String(col).toLowerCase(), m=cs*0.06, a=px+m, b=py+m, w=cs-2*m, cx=px+cs/2, cy=py+cs/2, D='#20140a';
      var _t=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
      var _ph=Math.abs((Math.round(px)*7+Math.round(py)*13))%2600;
      var blink=(((_t+_ph)%2600)<150);
      rr(c,a,b,w,w,cs*0.16); c.fillStyle=col; c.fill();
      c.fillStyle='rgba(255,255,255,.22)'; c.fillRect(a+3,b+3,w-6,Math.max(2,cs*0.1));
      c.save(); rr(c,a,b,w,w,cs*0.16); c.clip();
      var ex=w*0.16, ey=cy-w*0.08;
      if(lc==='#3b82f6'){ c.fillStyle=D; c.fillRect(cx-w*0.26,ey-w*0.05,w*0.2,w*0.12); c.fillRect(cx+w*0.06,ey-w*0.05,w*0.2,w*0.12); c.fillRect(cx-w*0.08,ey-w*0.01,w*0.16,3); }
      else if(blink){ c.strokeStyle=D; c.lineWidth=Math.max(2,w*0.05); c.lineCap='round'; c.beginPath(); c.moveTo(cx-ex-w*0.05,ey); c.lineTo(cx-ex+w*0.05,ey); c.moveTo(cx+ex-w*0.05,ey); c.lineTo(cx+ex+w*0.05,ey); c.stroke(); }
      else { c.fillStyle=D; c.beginPath(); c.arc(cx-ex,ey,w*0.06,0,6.283); c.fill(); c.beginPath(); c.arc(cx+ex,ey,w*0.06,0,6.283); c.fill(); if(lc==='#a855f7'){ c.fillRect(cx+ex-w*0.06,ey-1,w*0.12,2.4); } }
      c.strokeStyle=D; c.lineWidth=Math.max(2,w*0.06); c.lineCap='round'; c.beginPath();
      if(lc==='#ef4444'){ c.arc(cx,cy+w*0.22,w*0.18,Math.PI*1.15,Math.PI*1.85); }
      else if(lc==='#22d3ee'){ c.arc(cx,cy+w*0.14,w*0.1,0,6.283); }
      else if(lc==='#22c55e'){ c.moveTo(cx-w*0.16,cy+w*0.14); c.quadraticCurveTo(cx,cy+w*0.26,cx+w*0.16,cy+w*0.14); }
      else { c.arc(cx,cy+w*0.08,w*0.17,0.15*Math.PI,0.85*Math.PI); }
      c.stroke(); c.restore();
    } },
    // ══════════════ COSMOS — a different celestial body per piece (square tiles) ══════════════
    cosmos:{ name:'Cosmos', cost:8000, cell:function(c,px,py,cs,col,glow){
      function el(ex,ey,rx,ry,rot,f){ c.save(); c.translate(ex,ey); c.rotate(rot||0); c.beginPath(); c.ellipse(0,0,rx,ry,0,0,6.283); c.fillStyle=f; c.fill(); c.restore(); }
      var m=cs*0.06,a=px+m,b=py+m,w=cs-2*m,cx=px+cs/2,cy=py+cs/2,lc=String(col).toLowerCase();
      function finish(){ c.globalAlpha=0.45; c.strokeStyle=hexAdj(col,0.65); c.lineWidth=w*0.05; c.beginPath(); c.arc(cx,cy,w*0.4,Math.PI*0.98,Math.PI*1.62); c.stroke(); c.globalAlpha=1;
        var sp=c.createRadialGradient(cx-w*0.24,cy-w*0.24,0,cx-w*0.24,cy-w*0.24,w*0.22); sp.addColorStop(0,'rgba(255,255,255,.5)'); sp.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=sp; c.fillRect(a,b,w,w);
        c.globalAlpha=0.32; var td=c.createRadialGradient(cx+w*0.5,cy+w*0.5,w*0.05,cx+w*0.5,cy+w*0.5,w*0.95); td.addColorStop(0,'rgba(4,5,13,0)'); td.addColorStop(1,'#04050d'); c.fillStyle=td; c.fillRect(a-2,b-2,w+4,w+4); c.globalAlpha=1; }
      rr(c,a,b,w,w,cs*0.16); c.save(); c.clip();
      if(lc==='#a855f7'){
        var bgg=c.createRadialGradient(cx,cy,1,cx,cy,w*0.8); bgg.addColorStop(0,'#241653'); bgg.addColorStop(1,'#08061a'); c.fillStyle=bgg; c.fillRect(px,py,cs,cs);
        var sc=['#fff','#ffd9f3','#bcd8ff','#fff','#ffe9b0'];
        [[0.18,0.22],[0.8,0.76],[0.72,0.16],[0.3,0.84],[0.88,0.42],[0.5,0.66],[0.62,0.4]].forEach(function(s,k){ c.globalAlpha=0.85; c.fillStyle=sc[k%5]; c.fillRect(a+w*s[0],b+w*s[1],1.2,1.2); }); c.globalAlpha=1;
        c.save(); c.shadowColor=col; c.shadowBlur=w*0.22; c.globalAlpha=0.6;
        for(var arm=0;arm<3;arm++){ c.save(); c.translate(cx,cy); c.rotate(arm*2.094); c.strokeStyle=hexAdj(col,arm===0?0.5:0.3); c.lineWidth=w*0.05; c.beginPath(); for(var t=0.2;t<3.4;t+=0.22){ var rd=w*0.052*t,xx=Math.cos(t)*rd,yy=Math.sin(t)*rd*0.55; t<0.3?c.moveTo(xx,yy):c.lineTo(xx,yy);} c.stroke(); c.restore(); }
        c.globalAlpha=1; c.save(); c.translate(cx,cy); c.rotate(0.4); c.globalAlpha=0.4; c.strokeStyle='#1a0f30'; c.lineWidth=w*0.03; c.beginPath(); c.ellipse(0,0,w*0.3,w*0.09,0,0,6.283); c.stroke(); c.restore(); c.globalAlpha=1;
        var cg=c.createRadialGradient(cx,cy,1,cx,cy,w*0.26); cg.addColorStop(0,'#fff'); cg.addColorStop(0.35,hexAdj(col,0.6)); cg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=cg; c.beginPath(); c.arc(cx,cy,w*0.28,0,6.283); c.fill(); c.restore(); c.restore(); return;
      }
      var g=c.createRadialGradient(cx-w*0.28,cy-w*0.28,w*0.06,cx,cy,w*0.88); g.addColorStop(0,hexAdj(col,0.5)); g.addColorStop(0.55,hexAdj(col,0.1)); g.addColorStop(0.8,col); g.addColorStop(1,hexAdj(col,-0.45));
      c.fillStyle=g; c.fillRect(px,py,cs,cs);
      if(lc==='#f97316'){ c.globalAlpha=0.55; for(var i=0;i<6;i++){ c.fillStyle=hexAdj(col,(i%2)?-0.34:0.18); c.fillRect(a,b+w*(i*0.17),w,w*0.09); } c.globalAlpha=0.5; for(var k=0;k<5;k++) el(a+w*(0.15+k*0.18),cy-w*0.02,w*0.05,w*0.02,0,hexAdj(col,0.3)); c.globalAlpha=1; el(cx+w*0.14,cy+w*0.12,w*0.15,w*0.1,0.3,hexAdj(col,-0.2)); el(cx+w*0.14,cy+w*0.12,w*0.07,w*0.045,0.3,hexAdj(col,-0.05)); }
      else if(lc==='#ef4444'){ c.globalAlpha=0.5; el(cx-w*0.18,cy+w*0.12,w*0.2,w*0.16,0,hexAdj(col,-0.36)); el(cx+w*0.24,cy-w*0.16,w*0.12,w*0.1,0,hexAdj(col,-0.3)); c.globalAlpha=0.85; c.fillStyle='rgba(255,255,255,.7)'; c.beginPath(); c.arc(cx,b+w*0.06,w*0.26,0.15,Math.PI-0.15); c.fill(); c.globalAlpha=1; }
      else if(lc==='#22c55e'){ c.globalAlpha=0.6; el(cx-w*0.16,cy-w*0.06,w*0.2,w*0.16,0.3,hexAdj(col,-0.34)); el(cx+w*0.26,cy+w*0.22,w*0.16,w*0.12,-0.2,hexAdj(col,-0.34)); c.globalAlpha=0.4; el(cx+w*0.05,cy-w*0.2,w*0.16,w*0.05,-0.3,'#fff'); el(cx-w*0.2,cy+w*0.24,w*0.13,w*0.04,0.2,'#fff'); c.globalAlpha=1; }
      else if(lc==='#3b82f6'){ c.globalAlpha=0.45; for(var j=0;j<4;j++){ c.fillStyle=hexAdj(col,(j%2)?-0.3:0.15); c.fillRect(a,b+w*(0.12+j*0.22),w,w*0.1); } c.globalAlpha=0.9; el(cx+w*0.12,cy+w*0.06,w*0.12,w*0.08,0.4,hexAdj(col,-0.35)); c.globalAlpha=1; }
      else if(lc==='#22d3ee'){ c.globalAlpha=0.35; for(var q=0;q<3;q++){ c.fillStyle=hexAdj(col,0.35); c.fillRect(a,cy-w*0.24+q*w*0.24,w,w*0.05); } c.globalAlpha=1; }
      else if(lc==='#facc15'){ c.globalAlpha=0.5; for(var s2=0;s2<4;s2++){ c.fillStyle=hexAdj(col,(s2%2)?-0.28:0.18); c.fillRect(a,b+w*(0.16+s2*0.2),w,w*0.08);} c.globalAlpha=1; }
      finish();
      if(lc==='#facc15'){ c.save(); c.translate(cx,cy); c.rotate(-0.4);
        c.globalAlpha=0.95; c.strokeStyle=hexAdj(col,0.5); c.lineWidth=w*0.11; c.beginPath(); c.ellipse(0,0,w*0.66,w*0.22,0,0,6.283); c.stroke();
        c.strokeStyle='#0b0d18'; c.lineWidth=w*0.022; c.beginPath(); c.ellipse(0,0,w*0.6,w*0.2,0,0,6.283); c.stroke();
        c.globalAlpha=0.5; c.strokeStyle='#05060f'; c.lineWidth=w*0.05; c.beginPath(); c.ellipse(0,w*0.05,w*0.5,w*0.14,0,0.2,Math.PI-0.2); c.stroke();
        c.restore(); c.globalAlpha=1; }
      c.restore();
      c.fillStyle='rgba(255,255,255,.26)'; c.fillRect(a+3,b+3,w-6,Math.max(2,cs*0.07));
      if(lc==='#22d3ee'){ c.save(); c.shadowColor='#dff6ff'; c.shadowBlur=4; c.fillStyle='#eaffff'; c.beginPath(); c.arc(px+cs*0.83,py+cs*0.19,cs*0.07,0,6.283); c.fill(); c.fillStyle=hexAdj('#22d3ee',0.1); c.beginPath(); c.arc(px+cs*0.85,py+cs*0.21,cs*0.03,0,6.283); c.fill(); c.restore(); }
    } },
    // JMB INFERNO — glowing cracked lava "brix": charred stone plates split by bright molten veins.
    // Orange->RED only. The ONLY animated skin: the molten glow BREATHES (pulse). 8 pre-baked frames
    // per (colour x size x glow) then a plain blit (lag-free). The O piece is the JMB logo, filling the box.
    azero:{ name:'JMB Absolute Zero', cost:0, req:100, cell:(function(){
      // Seven pieces, seven ICE FORMATIONS — you tell them apart by structure, not by shade.
      //   I clear column · J frost fern · Z fracture · L rime needles
      //   T crystal core · S glacier strata · O the JMB tile, frozen
      var FR=8, JMBCOL='#facc15', cache={};
      var FORM={ '#22d3ee':'column','#3b82f6':'fern','#ef4444':'crack','#f97316':'rime','#a855f7':'flake','#22c55e':'strata','#facc15':'jmb' };
      var ICE ={ '#22d3ee':'#a5f3fc','#3b82f6':'#93c5fd','#ef4444':'#bae6fd','#f97316':'#cffafe','#a855f7':'#c7d2fe','#22c55e':'#99f6e4','#facc15':'#e0f2fe' };
      var LOGO=new Image(); try{ LOGO.onload=function(){ cache={}; }; LOGO.src=(typeof JMB_LOGO_SRC!=='undefined'?JMB_LOGO_SRC:''); }catch(e){}
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cs; cv.height=cs; var C=cv.getContext('2d');
        var lc=String(col).toLowerCase(), t=FORM[lc]||'column', IC=ICE[lc]||'#bae6fd';
        var m=cs*0.045,a=m,b=m,w=cs-2*m,cx=cs/2,cy=cs/2;
        var bloom=0.5+0.5*Math.sin(fi/FR*6.283);
        rr(C,a,b,w,w,cs*0.13); C.save(); C.clip();
        var g=C.createLinearGradient(a,b,a+w*0.4,b+w); g.addColorStop(0,'#12304a'); g.addColorStop(1,'#061524');
        C.fillStyle=g; C.fillRect(0,0,cs,cs);
        C.fillStyle='rgba(224,242,254,.07)';
        for(var s=0;s<5;s++){ C.fillRect(a+((s*37)%100)/100*w, b+((s*61)%100)/100*w, Math.max(1,w*0.05), Math.max(1,w*0.05)); }
        C.strokeStyle=IC; C.lineCap='round'; C.lineJoin='round';
        C.save(); C.shadowColor=IC; C.shadowBlur=w*(0.20+0.28*bloom)*(glow?1.5:1);
        var L=C.lineWidth=Math.max(1.2,w*0.075);
        if(t==='column'){
          for(var i=0;i<3;i++){ var x=a+w*(0.28+i*0.22); C.beginPath(); C.moveTo(x,b+w*0.06); C.lineTo(x+w*0.05,b+w*0.5); C.lineTo(x,b+w*0.94); C.stroke(); }
        } else if(t==='fern'){
          C.beginPath(); C.moveTo(a+w*0.12,b+w*0.12); C.lineTo(a+w*0.88,b+w*0.88); C.stroke();
          for(var k=1;k<=4;k++){ var tt=k/5, bx=a+w*(0.12+0.76*tt), by=b+w*(0.12+0.76*tt), ln=w*0.20*(1-Math.abs(tt-0.5));
            C.lineWidth=L*0.6; C.beginPath(); C.moveTo(bx,by); C.lineTo(bx+ln,by-ln); C.moveTo(bx,by); C.lineTo(bx-ln,by+ln); C.stroke(); }
        } else if(t==='crack'){
          C.beginPath(); C.moveTo(a+w*0.5,b+w*0.02); C.lineTo(a+w*0.42,b+w*0.42); C.lineTo(a+w*0.6,b+w*0.6); C.lineTo(a+w*0.5,b+w*0.98);
          C.moveTo(a+w*0.42,b+w*0.42); C.lineTo(a+w*0.04,b+w*0.5); C.moveTo(a+w*0.6,b+w*0.6); C.lineTo(a+w*0.96,b+w*0.7); C.stroke();
        } else if(t==='rime'){
          for(var r=0;r<6;r++){ var xx=a+w*(0.1+r*0.16); C.lineWidth=L*0.7; C.beginPath(); C.moveTo(xx,b+w*0.98); C.lineTo(xx+w*0.03,b+w*(0.30+0.18*((r*13)%5)/5)); C.stroke(); }
        } else if(t==='flake'){
          for(var h=0;h<6;h++){ var ang=h*Math.PI/3, ex=cx+Math.cos(ang)*w*0.40, ey=cy+Math.sin(ang)*w*0.40;
            C.beginPath(); C.moveTo(cx,cy); C.lineTo(ex,ey); C.stroke();
            C.lineWidth=L*0.55; var mx=cx+Math.cos(ang)*w*0.24, my=cy+Math.sin(ang)*w*0.24, pa=ang+Math.PI/2.6;
            C.beginPath(); C.moveTo(mx,my); C.lineTo(mx+Math.cos(pa)*w*0.13,my+Math.sin(pa)*w*0.13);
            C.moveTo(mx,my); C.lineTo(mx-Math.cos(pa)*w*0.13,my-Math.sin(pa)*w*0.13); C.stroke(); C.lineWidth=L; }
        } else if(t==='strata'){
          for(var y2=0;y2<4;y2++){ var yy=b+w*(0.22+y2*0.20); C.lineWidth=L*(1-y2*0.15);
            C.beginPath(); C.moveTo(a+w*0.05,yy); C.bezierCurveTo(a+w*0.35,yy-w*0.05,a+w*0.65,yy+w*0.05,a+w*0.95,yy); C.stroke(); }
        } else {
          C.globalCompositeOperation='lighter';
          var hg=C.createRadialGradient(cx,cy,1,cx,cy,w*0.6);
          hg.addColorStop(0,'rgba(186,230,253,'+(0.42*bloom+0.2)+')'); hg.addColorStop(1,'rgba(56,189,248,0)');
          C.fillStyle=hg; C.fillRect(0,0,cs,cs); C.globalCompositeOperation='source-over';
          if(LOGO.complete && LOGO.naturalWidth){ C.globalAlpha=0.9; C.drawImage(LOGO,17,15,62,66,a,b,w,w); C.globalAlpha=1; }
          else { C.fillStyle='#e0f2fe'; C.font='800 '+(w*0.42)+'px Sora,Inter,system-ui,sans-serif';
                 C.textAlign='center'; C.textBaseline='middle'; C.fillText('JMB',cx,cy); }
        }
        C.restore();
        // frost bloom creeping diagonally across the face
        C.globalCompositeOperation='lighter';
        var fg=C.createLinearGradient(a,b+w,a+w,b);
        var stop=Math.max(0.001,Math.min(0.999,bloom));
        fg.addColorStop(0,'rgba(255,255,255,.16)'); fg.addColorStop(stop,'rgba(224,242,254,.05)'); fg.addColorStop(1,'rgba(255,255,255,0)');
        C.fillStyle=fg; C.fillRect(0,0,cs,cs); C.globalCompositeOperation='source-over';
        C.fillStyle='rgba(255,255,255,.10)'; C.fillRect(a,b,w,Math.max(1.5,w*0.08));
        C.fillStyle='rgba(0,0,0,.30)'; C.fillRect(a,b+w-Math.max(2,w*0.1),w,Math.max(2,w*0.1));
        C.restore();
        C.strokeStyle='rgba(165,243,252,.45)'; C.lineWidth=1; rr(C,a+0.5,b+0.5,w-1,w-1,cs*0.13); C.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/120)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    /* ── CANOPY · regular — Mossy Forest season drop ──
       A stack of overlapping leaves seen from above, built as real 2.5D: each leaf is extruded
       with a darker underside edge before its lit face, the whole cell sits on a soft drop
       shadow, and a dew drop catches the light. Static (no fx loop) — the depth is painted. */
    canopy:{ name:'Canopy', cost:2500, cell:function(c,px,py,cs,col,glow){
      var m=Math.max(1,cs*0.04), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.16);
      var gx=Math.round(px/cs), gy=Math.round(py/cs);
      function h(u,v){ return Math.abs((Math.sin(u*12.9898+v*78.233)*43758.5453)%1); }
      // ground shadow → the cell reads as sitting ABOVE the board
      c.save(); c.globalAlpha=0.35; c.fillStyle='#000';
      rr(c,a+cs*0.05,b+cs*0.07,w,w,r); c.fill(); c.restore();
      rr(c,a,b,w,w,r); c.save(); c.clip();
      var soil=c.createLinearGradient(a,b,a,b+w); soil.addColorStop(0,hexAdj(col,-0.45)); soil.addColorStop(1,hexAdj(col,-0.72));
      c.fillStyle=soil; c.fillRect(a,b,w,w);
      // three overlapping leaves, each extruded (dark underside offset, then lit face + vein)
      for(var L=0;L<3;L++){
        var lx=a+w*(0.28+0.24*L+((h(gx+L,gy)-0.5)*0.1)), ly=b+w*(0.3+0.2*((L*7+gx)%3)/3+((h(gx,gy+L)-0.5)*0.1));
        var lw=w*0.46, lh=w*0.3, ang=-0.7+L*0.75+(h(gx+L,gy+L)-0.5)*0.5;
        c.save(); c.translate(lx,ly); c.rotate(ang);
        // underside (the 3D extrusion)
        c.fillStyle=hexAdj(col,-0.5); c.beginPath(); c.ellipse(w*0.02,w*0.035,lw/2,lh/2,0,0,6.283); c.fill();
        // lit face
        var lg=c.createLinearGradient(-lw/2,0,lw/2,0);
        lg.addColorStop(0,hexAdj(col,0.28-L*0.1)); lg.addColorStop(1,hexAdj(col,-0.12-L*0.08));
        c.fillStyle=lg; c.beginPath(); c.ellipse(0,0,lw/2,lh/2,0,0,6.283); c.fill();
        // centre vein + side veins
        c.strokeStyle=hexAdj(col,0.42); c.lineWidth=Math.max(0.7,cs*0.022);
        c.beginPath(); c.moveTo(-lw/2*0.9,0); c.lineTo(lw/2*0.9,0); c.stroke();
        c.lineWidth=Math.max(0.5,cs*0.014); c.globalAlpha=0.7;
        for(var v2=-2;v2<=2;v2++){ if(!v2) continue; c.beginPath(); c.moveTo(v2*lw*0.16,0); c.lineTo(v2*lw*0.16+lw*0.09,(v2>0?-1:1)*lh*0.3); c.stroke(); }
        c.globalAlpha=1; c.restore();
      }
      // dew drop with specular sparkle
      var dx2=a+w*(0.24+h(gx,gy)*0.5), dy2=b+w*(0.24+h(gy,gx)*0.5);
      c.fillStyle='rgba(255,255,255,.32)'; c.beginPath(); c.arc(dx2,dy2,Math.max(1,cs*0.055),0,6.283); c.fill();
      c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.arc(dx2-cs*0.018,dy2-cs*0.018,Math.max(0.6,cs*0.02),0,6.283); c.fill();
      // top bevel light + bottom bevel dark = extruded block edge
      c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(a,b,w,Math.max(1.5,cs*0.06));
      c.fillStyle='rgba(0,0,0,.30)'; c.fillRect(a,b+w-Math.max(2,cs*0.08),w,Math.max(2,cs*0.08));
      c.restore();
      c.strokeStyle='rgba(255,255,255,.14)'; c.lineWidth=1; rr(c,a+0.5,b+0.5,w-1,w-1,r); c.stroke();
    } },
    /* ── ANACONDA · collector — THE season flagship drop ──
       Real snake skin: rows of overlapping scales over an olive hide with the anaconda's
       dark blotch pattern, tinted by the piece colour. It is BODY-AWARE like Kintsugi:
       wherever two blocks touch, the hide runs continuous across the seam and a pale spine
       ridge bridges the join — a tight stack reads as one snake winding through the board.
       An iridescent sheen breathes across the scales, and rare position-stable cells open
       a living slit-pupil EYE that blinks. */
    elderwood:{ name:'Anaconda', cost:35000, tier:'collector', cell:function(c,px,py,cs,col,glow){
      var m=Math.max(1,cs*0.03), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.10);
      var t=(Date.now()/4200)%1;
      var gx=Math.round(px/cs), gy=Math.round(py/cs);
      function nb(dx,dy){ if(!_RVB) return true;      /* no board = Locker preview: show it joined */
        var X=gx+dx, Y=gy+dy;
        if(X<0||Y<0||Y>=_RVB.g.length||X>=_RVB.w) return false; return !!_RVB.g[Y][X]; }
      function h(u,v){ return Math.abs((Math.sin(u*12.9898+v*78.233)*43758.5453)%1); }
      var up=nb(0,-1), dn=nb(0,1), lf=nb(-1,0), rt=nb(1,0);
      rr(c,a,b,w,w,r);
      // olive hide, side-lit
      var hide=c.createLinearGradient(a,b,a+w*0.3,b+w);
      hide.addColorStop(0,'#5d6b3c'); hide.addColorStop(0.55,'#46512c'); hide.addColorStop(1,'#2c331b');
      c.fillStyle=hide; c.fill();
      c.save(); rr(c,a,b,w,w,r); c.clip();
      // the piece colour breathes through the hide as a faint tint
      var tint=c.createRadialGradient(a+w*0.35,b+w*0.3,0,a+w*0.35,b+w*0.3,w);
      tint.addColorStop(0,col); tint.addColorStop(1,'rgba(0,0,0,0)');
      c.globalAlpha=0.15; c.fillStyle=tint; c.fillRect(a,b,w,w); c.globalAlpha=1;
      // SCALES — overlapping crescent rows, offset half a scale per row like real skin
      var sw=Math.max(3,w/5), sh=sw*0.72;
      c.strokeStyle='rgba(20,28,10,.5)'; c.lineWidth=Math.max(0.7,cs*0.02);
      for(var row=0; row<7; row++){
        var yy=b+row*sh*0.75-sh*0.3, off=(row%2)?sw/2:0;
        for(var col2=-1; col2<6; col2++){
          var xx=a+off+col2*sw;
          c.beginPath(); c.arc(xx+sw/2, yy, sw/2, 0.15*Math.PI, 0.85*Math.PI); c.stroke();
          // scale highlight — light catching each scale's upper edge
          c.globalAlpha=0.16; c.strokeStyle='rgba(214,232,178,.8)';
          c.beginPath(); c.arc(xx+sw/2, yy-1, sw/2*0.85, 0.25*Math.PI, 0.75*Math.PI); c.stroke();
          c.globalAlpha=1; c.strokeStyle='rgba(20,28,10,.5)';
        }
      }
      // ANACONDA BLOTCHES — two position-stable dark ovals with lighter centres
      for(var bl2=0; bl2<2; bl2++){
        var bx2=a+w*(0.22+h(gx+bl2,gy)*0.5), by2=b+w*(0.22+h(gx,gy+bl2)*0.5);
        var brx=w*(0.16+h(gx*3+bl2,gy)*0.08), ba=h(gx,gy*3+bl2)*3;
        c.fillStyle='rgba(28,36,14,.85)'; c.beginPath(); c.ellipse(bx2,by2,brx,brx*0.65,ba,0,6.283); c.fill();
        c.fillStyle='rgba(90,104,52,.5)'; c.beginPath(); c.ellipse(bx2,by2,brx*0.45,brx*0.3,ba,0,6.283); c.fill();
      }
      // IRIDESCENT SHEEN — breathing across the scales
      var bloom=0.5+0.5*Math.sin(t*6.283+h(gx,gy)*2);
      c.globalCompositeOperation='lighter';
      var shn=c.createLinearGradient(a,b+w,a+w,b);
      var stop=Math.max(0.001,Math.min(0.999,bloom));
      shn.addColorStop(0,'rgba(140,180,90,0)'); shn.addColorStop(stop,'rgba(214,232,178,.14)'); shn.addColorStop(1,'rgba(140,180,90,0)');
      c.fillStyle=shn; c.fillRect(a,b,w,w); c.globalCompositeOperation='source-over';
      c.restore();
      // BODY-AWARE SEAMS — hide continues across joins: repaint over the border on joined
      // sides, then bridge with a pale spine ridge so the snake reads continuous
      c.save();
      [[up,a,b,w,2,0],[dn,a,b+w-2,w,2,0],[lf,a,b,2,w,1],[rt,a+w-2,b,2,w,1]].forEach(function(d2){
        if(!d2[0]) return;
        c.fillStyle='#46512c'; c.fillRect(d2[1],d2[2],d2[3],d2[4]);
      });
      var pulse=0.6+0.4*Math.sin(t*6.283+h(gx,gy)*5);
      c.strokeStyle='rgba(214,232,178,'+(0.5*pulse)+')'; c.lineWidth=Math.max(1,cs*0.04); c.lineCap='round';
      if(up){ c.beginPath(); c.moveTo(a+w*0.35,b+1); c.lineTo(a+w*0.65,b+1); c.stroke(); }
      if(dn){ c.beginPath(); c.moveTo(a+w*0.35,b+w-1); c.lineTo(a+w*0.65,b+w-1); c.stroke(); }
      if(lf){ c.beginPath(); c.moveTo(a+1,b+w*0.35); c.lineTo(a+1,b+w*0.65); c.stroke(); }
      if(rt){ c.beginPath(); c.moveTo(a+w-1,b+w*0.35); c.lineTo(a+w-1,b+w*0.65); c.stroke(); }
      // THE EYE — rare cells carry a golden slit-pupil eye that blinks
      if(h(gx*7+3,gy*5+1)>0.85){
        var blink=((Date.now()/700+h(gx,gy)*10)%7)<0.35;   // shut ~5% of the time, per-cell phase
        var ex=a+w/2, ey=b+w/2, er=w*0.16;
        c.save();
        c.fillStyle='rgba(20,26,10,.9)'; c.beginPath(); c.ellipse(ex,ey,er*1.5,er*1.1,0,0,6.283); c.fill();
        if(blink){
          c.strokeStyle='#c9a03a'; c.lineWidth=Math.max(1,cs*0.03);
          c.beginPath(); c.moveTo(ex-er,ey); c.lineTo(ex+er,ey); c.stroke();
        } else {
          var ig=c.createRadialGradient(ex,ey,0,ex,ey,er);
          ig.addColorStop(0,'#e8c93a'); ig.addColorStop(0.75,'#a37a1e'); ig.addColorStop(1,'#5c430a');
          c.fillStyle=ig; c.beginPath(); c.ellipse(ex,ey,er,er*0.8,0,0,6.283); c.fill();
          c.fillStyle='#10130a'; c.beginPath(); c.ellipse(ex,ey,er*0.24,er*0.78,0,0,6.283); c.fill();
          c.fillStyle='rgba(255,255,240,.9)'; c.beginPath(); c.arc(ex-er*0.3,ey-er*0.3,Math.max(0.6,er*0.16),0,6.283); c.fill();
        }
        c.restore();
      }
      // bevel: lit top, dark base (skipped on joined sides so the body stays continuous)
      if(!up){ c.fillStyle='rgba(255,255,255,.09)'; c.fillRect(a,b,w,Math.max(1.5,cs*0.05)); }
      if(!dn){ c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(a,b+w-Math.max(2,cs*0.07),w,Math.max(2,cs*0.07)); }
      c.strokeStyle='rgba(120,140,80,.3)'; c.lineWidth=Math.max(1,cs*0.03);
      rr(c,a,b,w,w,r); c.stroke();
      c.restore();
    } },
    // JMB MOSSY FOREST — Season S2026-09 prize. Seven pieces, seven LIVING FOREST forms —
    // told apart by structure: I vine column · J fern frond · Z gnarled root · L young shoots
    // · T spore mushroom · S moss strata · O the JMB tile, overgrown. Bioluminescent spores
    // BREATHE (8 pre-baked frames per colour × size × glow, then a plain blit — lag-free),
    // and a firefly drifts across the face on the pulse.
    mossy:{ name:'JMB Mossy Forest', cost:0, req:100, cell:(function(){
      var FR=8, cache={};
      var FORM={ '#22d3ee':'vine','#3b82f6':'fern','#ef4444':'root','#f97316':'shoot','#a855f7':'spore','#22c55e':'strata','#facc15':'jmb' };
      // every piece keeps its own hue family, but pulled toward living greens + glow accents
      var MOSS={ '#22d3ee':'#6ee7b7','#3b82f6':'#86efac','#ef4444':'#bef264','#f97316':'#d9f99d','#a855f7':'#a7f3d0','#22c55e':'#4ade80','#facc15':'#fde68a' };
      var LOGO=new Image(); try{ LOGO.onload=function(){ cache={}; }; LOGO.src=(typeof JMB_LOGO_SRC!=='undefined'?JMB_LOGO_SRC:''); }catch(e){}
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cs; cv.height=cs; var C=cv.getContext('2d');
        var lc=String(col).toLowerCase(), t=FORM[lc]||'vine', MC=MOSS[lc]||'#86efac';
        var m=cs*0.045,a=m,b=m,w=cs-2*m,cx=cs/2,cy=cs/2;
        var bloom=0.5+0.5*Math.sin(fi/FR*6.283);
        rr(C,a,b,w,w,cs*0.13); C.save(); C.clip();
        // damp humus base — deep forest floor, mottled
        var g=C.createLinearGradient(a,b,a+w*0.35,b+w); g.addColorStop(0,'#15301c'); g.addColorStop(0.55,'#0c2012'); g.addColorStop(1,'#050f08');
        C.fillStyle=g; C.fillRect(0,0,cs,cs);
        // moss speckle — pseudo-random tufts
        for(var s=0;s<8;s++){ var sx=a+((s*37+13)%100)/100*w, sy=b+((s*61+7)%100)/100*w;
          C.fillStyle='rgba(134,239,172,'+(0.05+((s*29)%4)*0.02)+')';
          C.beginPath(); C.arc(sx,sy,Math.max(1,w*(0.03+((s*17)%3)*0.012)),0,6.283); C.fill(); }
        C.strokeStyle=MC; C.lineCap='round'; C.lineJoin='round';
        C.save(); C.shadowColor=MC; C.shadowBlur=w*(0.18+0.30*bloom)*(glow?1.6:1);
        var L=C.lineWidth=Math.max(1.2,w*0.075);
        if(t==='vine'){
          for(var i=0;i<3;i++){ var x=a+w*(0.26+i*0.24); C.beginPath(); C.moveTo(x,b+w*0.04);
            C.bezierCurveTo(x+w*0.09,b+w*0.3, x-w*0.09,b+w*0.62, x+w*0.03,b+w*0.96); C.stroke();
            C.lineWidth=L*0.55; C.beginPath(); C.arc(x+w*0.06,b+w*(0.25+i*0.2),w*0.055,0,6.283); C.stroke(); C.lineWidth=L; }
        } else if(t==='fern'){
          C.beginPath(); C.moveTo(a+w*0.14,b+w*0.9); C.quadraticCurveTo(a+w*0.4,b+w*0.5,a+w*0.82,b+w*0.14); C.stroke();
          for(var k=1;k<=5;k++){ var tt=k/6, bx=a+w*(0.14+0.62*tt), by=b+w*(0.9-0.7*tt), ln=w*0.22*(1-tt*0.55);
            C.lineWidth=L*0.55; C.beginPath();
            C.moveTo(bx,by); C.quadraticCurveTo(bx+ln*0.5,by-ln*0.1,bx+ln,by-ln*0.55);
            C.moveTo(bx,by); C.quadraticCurveTo(bx-ln*0.2,by+ln*0.4,bx-ln*0.62,by+ln*0.8); C.stroke(); C.lineWidth=L; }
        } else if(t==='root'){
          C.beginPath(); C.moveTo(a+w*0.5,b+w*0.02); C.bezierCurveTo(a+w*0.38,b+w*0.3,a+w*0.62,b+w*0.5,a+w*0.5,b+w*0.98);
          C.moveTo(a+w*0.44,b+w*0.36); C.quadraticCurveTo(a+w*0.2,b+w*0.44,a+w*0.04,b+w*0.4);
          C.moveTo(a+w*0.56,b+w*0.6); C.quadraticCurveTo(a+w*0.8,b+w*0.68,a+w*0.96,b+w*0.78); C.stroke();
        } else if(t==='shoot'){
          for(var r=0;r<5;r++){ var xx=a+w*(0.14+r*0.18), hh=b+w*(0.34+0.16*((r*13)%4)/4);
            C.lineWidth=L*0.7; C.beginPath(); C.moveTo(xx,b+w*0.97); C.quadraticCurveTo(xx+w*0.04,b+w*0.66,xx-w*0.02,hh); C.stroke();
            C.lineWidth=L*0.5; C.beginPath(); C.moveTo(xx-w*0.02,hh); C.quadraticCurveTo(xx+w*0.06,hh-w*0.05,xx+w*0.08,hh-w*0.11); C.stroke(); }
          C.lineWidth=L;
        } else if(t==='spore'){
          // mushroom cap + drifting spores
          C.beginPath(); C.arc(cx,cy+w*0.08,w*0.3,Math.PI,0); C.stroke();
          C.lineWidth=L*0.7; C.beginPath(); C.moveTo(cx-w*0.07,cy+w*0.08); C.lineTo(cx-w*0.05,cy+w*0.4);
          C.moveTo(cx+w*0.07,cy+w*0.08); C.lineTo(cx+w*0.05,cy+w*0.4); C.stroke(); C.lineWidth=L;
          for(var h=0;h<5;h++){ var ang=-0.4-h*0.55, rr2=w*(0.36+0.1*((h*7)%3)/3+0.05*bloom);
            C.globalAlpha=0.45+0.4*bloom; C.beginPath(); C.arc(cx+Math.cos(ang)*rr2,cy+w*0.02+Math.sin(ang)*rr2,w*0.035,0,6.283);
            C.fillStyle=MC; C.fill(); C.globalAlpha=1; }
        } else if(t==='strata'){
          for(var y2=0;y2<4;y2++){ var yy=b+w*(0.2+y2*0.2); C.lineWidth=L*(1-y2*0.14);
            C.beginPath(); C.moveTo(a+w*0.05,yy); C.bezierCurveTo(a+w*0.3,yy+w*0.06,a+w*0.7,yy-w*0.06,a+w*0.95,yy); C.stroke();
            C.lineWidth=L*0.4; C.beginPath(); C.arc(a+w*(0.2+y2*0.2),yy-w*0.03,w*0.03,0,6.283); C.stroke(); }
          C.lineWidth=L;
        } else {
          C.globalCompositeOperation='lighter';
          var hg=C.createRadialGradient(cx,cy,1,cx,cy,w*0.62);
          hg.addColorStop(0,'rgba(190,242,100,'+(0.4*bloom+0.18)+')'); hg.addColorStop(1,'rgba(34,197,94,0)');
          C.fillStyle=hg; C.fillRect(0,0,cs,cs); C.globalCompositeOperation='source-over';
          if(LOGO.complete && LOGO.naturalWidth){ C.globalAlpha=0.92; C.drawImage(LOGO,17,15,62,66,a,b,w,w); C.globalAlpha=1; }
          else { C.fillStyle='#ecfccb'; C.font='800 '+(w*0.42)+'px Sora,Inter,system-ui,sans-serif';
                 C.textAlign='center'; C.textBaseline='middle'; C.fillText('JMB',cx,cy); }
          // ivy creeping over the tile corners
          C.strokeStyle=MC; C.lineWidth=L*0.6;
          C.beginPath(); C.moveTo(a,b+w*0.3); C.quadraticCurveTo(a+w*0.14,b+w*0.14,a+w*0.32,b+w*0.04); C.stroke();
          C.beginPath(); C.moveTo(a+w,b+w*0.72); C.quadraticCurveTo(a+w*0.86,b+w*0.88,a+w*0.68,b+w*0.97); C.stroke();
        }
        C.restore();
        // FIREFLY — one bright mote drifting diagonally with the pulse
        var fx=a+w*(0.15+0.7*(fi/FR)), fy=b+w*(0.75-0.5*(fi/FR));
        C.save(); C.globalCompositeOperation='lighter';
        var fg2=C.createRadialGradient(fx,fy,0,fx,fy,w*0.12);
        fg2.addColorStop(0,'rgba(253,230,138,'+(0.55+0.35*bloom)+')'); fg2.addColorStop(1,'rgba(253,230,138,0)');
        C.fillStyle=fg2; C.fillRect(fx-w*0.12,fy-w*0.12,w*0.24,w*0.24);
        C.fillStyle='rgba(254,249,195,.9)'; C.beginPath(); C.arc(fx,fy,Math.max(0.8,w*0.02),0,6.283); C.fill();
        C.restore();
        // canopy light creeping diagonally across the face (the frost-bloom idea, but sun through leaves)
        C.globalCompositeOperation='lighter';
        var lg=C.createLinearGradient(a,b+w,a+w,b);
        var stop=Math.max(0.001,Math.min(0.999,bloom));
        lg.addColorStop(0,'rgba(190,242,100,.12)'); lg.addColorStop(stop,'rgba(163,230,53,.045)'); lg.addColorStop(1,'rgba(255,255,255,0)');
        C.fillStyle=lg; C.fillRect(0,0,cs,cs); C.globalCompositeOperation='source-over';
        C.fillStyle='rgba(236,252,203,.09)'; C.fillRect(a,b,w,Math.max(1.5,w*0.08));
        C.fillStyle='rgba(0,0,0,.32)'; C.fillRect(a,b+w-Math.max(2,w*0.1),w,Math.max(2,w*0.1));
        C.restore();
        C.strokeStyle='rgba(110,231,183,.4)'; C.lineWidth=1; rr(C,a+0.5,b+0.5,w-1,w-1,cs*0.13); C.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/120)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    inferno:{ name:'JMB Inferno', cost:0, req:104, cell:(function(){
      var FR=8, JMBCOL='#facc15', cache={};
      var FIRE={ '#ef4444':'#ee2f14','#f97316':'#ff7b0e','#facc15':'#ff9612','#22c55e':'#ff5f10','#22d3ee':'#ffab17','#3b82f6':'#ff4a12','#a855f7':'#d8280f' };
      var LOGO=new Image(); try{ LOGO.onload=function(){ cache={}; }; LOGO.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAdNElEQVR42u2deXhcVd3HP79z7r2zZWmaNk1LSfeWQtkKCrUoomz6srSgsqllU0ARBAVE4RUURAVcEBFQFgWEsmhRKotsoiDLy06hLKW0pQ1J26wzyczce895/7h3kil0CZK0qfQ8T54nmcxy5/s957d9f+dcoe9DAA0EpQcSCcZpoz4uVvZA2e3FyjgrDBFI8N85itbSjtglGHnJin1Ui3mks8hrZc9xgBCwfQW1L0MBJv49lXHVbOBIRPZQUE1fP+2/aEj8nS1kxdrHgVuyvrkDaIufomMiPjABpTdyKxz1FYRvisikMtBN/KuU/fw3D1v2I4AqfWFreduI/VVX0VwOdPWFBNnA/wQwFY6zB8r8TJCPxKCHZStD+HAPW2YdtADG2petyLe7iuHdZfjYdc3u9RFj0546S4QbBBlte+2/3gL+Glip+McCoRIZIXCUq0j5hgfix9XaSJD1gK8ynr5GwRzby7LegnefhomBVMbaO3O+OQrIvcuXrpWAHjuecdWtSuQQC37s2bfM9vc/fAHXWvtw1jcHxH5hDXOk1hJmmoynrykD390C/n88XAu+iHwy46pby8yVrM0HaCBMe+osjXy7DPwt44MNDfhKZBtHUeUb7okfs2vYe8CkHHbTSj9WZu+3zPz+i5RCAScMOaArDOeXJnx57K4rPPWkIDvZKMzc4nD73zELlmWeH27fAlnAqpLdr3DUcTH4wRbwB2QoIBShoeDK6SUrU5r9qYyrXhaRhrKYdcsYGFOEtbSJH07OwmoF2IyrDlYiY2JWtoA/sElbqIQa66gvlkwQwJf58NXTNiUJFsVRgJIkNGhPvyRQWVZg2my+CZvvzAmMDXdTylV7xeCbzQV8JZH3Cm30o6SsJLl5jFDAQdS+jljZQwTsZjCRdHSdZAMw1lLrCUpgVTG6+gon+jvcTJaEWGY6KLuDjSa+DGbgjYWOwKKAj9RojhjtsOsQhRJ4vt1wy9sBj7WE+AYqBz8RKr60aZJ29TtKGDEY7b+KZafOwOIo+HitZk6DyydqFSkt5I3FAkklFI3l8VbDH5YGPLAyJB/azYEIXzKezg82Dbdkz7OBRSHsNVxx3BiXmbUaLREhBkGrKIgzxiDWUuEICDzVGnLtkoB7m0IKxlLlRm9oBiERUuHpQXNZJX2vK4TAWPYYpjlxrMsnhikU0BkAImitsYVuTL4QvS7hoZJpQmPAGDIOaBEebwm5cnG0IgAqnIgEu4WAtdv5ooHuwDKtWnHyeJfPjHBw4hlfAt7ku7D5Iu6oBqr/5zgkkaT9r7+luPQNxHNQqQyhsWAMFU5E64MrQ371ps9TrSFJJST04DFLm5yAkrnp8C11CeGEcS5f3NqhyhE6fIstAV+IgPfGTmbIgSdQte9R6JoRUUzX2Ur2oVtp/fMVFF5/ISaigjAMwUYmKB9abl0e8us3iyzrslS6gsimN0ublABHIBdGIeUhoxxOm+gyIaPo8C2BBcdxsH4Bk+vGGzORIYecTPX+c1AVQ9aIGEq/m+4cnQ/cTOvtv6Tw+kuodALxUoRBgBKodoW3uy2Xv+lz07IAE/uNwH7ICFAC1kKnb5lSpTh7ssd+dZq8seRD0Foj1hB2duIMG0HNId+getaJ6KraXuBffJgVc39JkM/TcMQpMH0/rKiIiK5O2v92La23/hx/+RJUZQUoTRiGJBRktPDI6pALXy3yXJuhwo2ipU2xGjY6AU7sZI2Fo8dEs36oK7T5FiWC0hqT6wDtUP2ZOQw96ru4I8f2Av/cAzTe8jPmzb+b3y2yFC0c0wCf2/+TNBx5Oux2YM9zg5Z3aL35Ytr+chUmn0NXDMGEISY2S12B5deLfa5cHBCYyElv7NWw0QgoRTjtvmVcRvGDqR771mk6A4tvwNEaa0JMZ5bUDjMYdsJFpHfas9fEvPYkzX+4iNv/PI/fLYZnfQdHKYTo9ds6PsdsDUccuA9bHX02bL9XDxH5hU+x6urvknvyflQ6hbgeQRDixGbpX6tDzn2lyIJ2Q7UnGzVS2igElJZ3NrAcPNLh/KkeIxKlWQ9KO4S5dlSygtovnk3NYacjbiKqja9aSucNP+JPN17HFQuLPFmMgM9I2AOSAF1W4RvY3vE5aaLisMOPYOjR52C32iZaOdbQNu83rLr2PML2VejKIdgwJLQ2cviB5cJXi9y4LCStwVUbJ1IacAJKJkcLfGeyy/FjXQqhpWDAiROpsKOD1E4zGXHqZSQmT4+ANwHmriv5++UXcOnjTTzYpUFpKlQE/LvttZISEZrAGGYmAk6fPoQDTjoD93OnYdwUCigue5XmX55K7t/3oiorESUEocFVUKGFm98OOG9hkVywcUzSgBLgxCZn67Ti0mkeew7TtBSjypNyHGwhjw2K1BxxJsOOPQ/cKCGXRU/z2s++xcW3/4ObV0OX8qhUYZ+y2RIRnVbjhj6HVFvOOmhXdvzWJTBtz8gsGUPLzT9l1XXngTWoZAYTBBhgqCc80xZy2otFFnYahrgDGyVpT6vzBiqxai9adq/VXDc9wbQqTYtv0QLKdQmz7eghwxl57o3UzP46RjsoG1Kc+1OuPvVoTrz7DR7KeyS0kBLTZ7tc6ppNikUpxdMFh3nPLyN84AZ2SnaT2GEmofbI7LAHqe33oPu5fxCsbESn0og15EJoSCkOGOnwRs7wcoch5cjmQ4CUgX/oVg5X7Jig2hWyAbgCoh3CtjZS02Yw+sd/IbXdjEiEbl7EC2cfyQkXXM0v3jbkHZdKCf9jh1h6TVpZcsrhnpXw7/sfYcqbD9Iw/SNQPQJ35Fiq9vo8hcULKLzxEiqdQgP50JLWMGukQ0cAj68OSWgZkEplvxJQKmp3FC1fm+By0bYJAhuVGJzI2xK2t1P92S8x6vy5yND6qCfm3/P4zbGHcPyfXuBZ61HtgLZmw831fRhRg5MlpYXXjMsdT7+FPPRHdp8wCjVhJ0hXUv3pwzFd7XQ98wiSSKBFCEz02s/WO7g6Kme4KsoX7GAkoLRhIRdavjfF46xJHh2hxVrQSiLHme2g9ujvUffNX2EcDw28c+15fPUrJ/GTV3OYpEdGQsIBCAMtkBKD77rcvbybZ/4yj90TrQydsTehcqnc7TPoiiqyj81HtIPSGmujxPBTwzV1CcV9zWEUtQ3WFZAPLT+Y6vH18S6tvkUElFJYa7HdXYz45mUMPeo7UdeXn+WfZ3+Jz599BQ91O1QnNGLMmq3DfSBd3icJylpSruLFgsOddz/GpBVPMuVT+2G8DOntZpAYPZHOf84DC0prBEsuhBlDNQ0p4d7mMGp7HkwEaIli/G9N8jhtosuqYuxsRbBhiC0Wqf/u9VQfcHwUqbQt56o5BzHnd/fS7CaocmxUwXwfnwdQjDVhR3rlyj4RYSPf0Op6zH3yVbwn/8bH9/40VA4jMWEHkpN3pvOh2yEMQDsoLNkAdh+qqXDg3ubIJ/THKv3AYagAvoW6hDB/RpK0jmLnHpEzMIw462qq9j4KAwTLFnLOEQdx8aOvk0klcEzQ54SnJMRnA4unhFHJyCavyFvyoSXjCI70veavAKMdst0Fjt9+JL+Y+2fSU3dDgNwT99B4/uHYMADp3VuhBQ5+PM+rWUtK8b5W7Lqu4YMxKFAwMDYtVMaJiwJQGpPLkvnoPlTtfVT05EXP8o0DPs3Fj77O0EwCFfYN/NLsbvcjCXL/OofLpiW4fscE1+2Q5IppCWbVOz15R2ij12zIPBlAwoDajMfvXmzky5/dj+LzDwOQ2W1/Kj/1BUwuh2jdk4MklTAxo/BNZGI/cK7UXzF/q9+bNdo49VdegsKiF8i/9BhhroNVPzmGQ5OreHp4kqdXFTdYd9ESvWe7HxXPDh3pcOhIh20rFFjIm+i1O1cpdq32eC1n+HNTyD3NAauLlrSWDZYUtMDq7oBtahJ8qS5P49mzqD3jt3ijxtG94HEk4WGN6QkyQiyr48LhoDBBJUuTN5ZrpifZv06zsmDxFFgRrF9ERLAmxIqiIpWksxjynQVF7lwRrFUY6SlXB5Gwvn+d5rCRLpMzgm+hO4w+VKl4ZhqDtYZUrHYt7rLc3hhwV3NASzGq+et3ifOqLGT+VJ3m0mkeI1KajryPhD7iuNgwQLwkYi2+hRpX+L+2kMOfLPTL7O83AlRshuo84fpdEkytVLT5FlciEsqJCo3FVZBQwq/f9Ln0DR+AlI5IEOm18fsO1xw1ymFqhYrkSmNRoqKStV8g7OoGCzqdRHnJuNRsSCohqWFRl+Xm5T7zm0NyMZnEpqlgoGgsJ45zOXOSiwXyYZyvIFhrEIlmgm+hyoHlecucpwssytme6x00tSAl0B3A8ITwu+kJplcrWnzLu7N4iW0vFmo84f6VId9dUOStLkNCCb61fKxGc1yDyy5VCt9CV1gGfDFPmMvj1tZSt/8RKC9J899upND0DjqVQCVTaxKh4MWs4bplAQ+tiuJ431pGJIQfTPU4eKRDu28x9r2RVCnAGOIKi3KGY58psChnqHSk3yql/VqM0xKZh0oHrtgpwV7DNKvjkHRtI7RRPb6pYDn35QILOiwnjnHZZ5hGgGxoERG0djDFAmGum8TIUdT9z5epn3UcydETASg0LaP5r9fT9Jfr6F66GJ1OoBIpTBjJjmkdmaB/toRcvthnZFq4aFuPselopa7r+gILQ13hmXbDV58t0Ji3VDj9W6bu92qolsg5OgI/2c7jC1s5UQVU3rtRVuIvmdLRqmjNgwe0FSNTpLXGhgFBNkeirp4Rs46n/tATSNSNBsBvfAvrF/EaJkd/t66k6c5raLz9N+TfXopTkUZclzAIsdZS7QqBQFUCvFiPXhv4pXJ3rRclXqe+UKAzgPQAdFMMSDm61I2WD+GMSS6nTHDoCqLl7KxlmZdsvxYohNAVKAohhNkOnEwFIw46jlFHnEpyq3HRjF/6Gtk7r+KFeTfg+z47H3gEVbNOIDFpxyhBW9VI462X03jHlfitLejKKhIaUtqQjGfwukxOqdm32hGuXRpw3itFRCAxQALNgOkBpUSss2j5/GiHC7b1SGvIBevOWi2gHQfTnaM77+N9bDZbH3cOmW2mR8AuX0T7bb9iwbwbmLewhXmdgm+FAysMsydWsNNBRzDkC6eQGD8NgO63XmHZtT8i/+DNpDxQ6UpMEKzzekPbGwxc8JrPNW/5PQ2/AyXYD6gg06MDFy3TaxSXTEswISPkQ94TxomKYvuwowNv3DYM/8oPqdjzcxHwLStpmnsZi2+/inkvr+SODsVS3yGJQcTSbTX1TsisypDPTa5iwuxjqT/ydJL1WwPQ9cTdrPztOXS/8gy6sgJRkf787vKEp+GdvOU7C4r8Y2W4UfThjaIJJxSsLliGJITbdk0yqVIomN5MVXQ06wGGzP4atXPORVfVRpup5l9D+00/5sUFizjtTcUbXQ5Jx5DWkRgPkX6bN9DlK0YmDT8fG7Lb1K2oPOzbDJ19UqQvd2dp+eNPab3lEmxQQKWrojJDvPI8gXfy8IWn8izLGWqT0TUO9BgwRazcKXfE4emZEzwmpCLxPKFB6V6NwGuYwsjv/Z6aQ05GJdLkFz7FOxcdQ+vcX2CKOYYPrWR6jcI3hjdyhs44V5C4RCEI+9crvjMlwc6jMtiuTrL/mk/3sw/gjZqAt/Vk0tP3Ir3zJym88Tz+sjeRVBIVx/odRQhDGJcWFmQNTXEmPdAcDOgK0HFtZlqV4vzJCaZkhI54c4XraCp0iC7kqP7sHIZ/7RJ09TBsMU/LTT+m5ZZLenp5rDFgDWkd2eOnWkOuXxp1P4cW9hquOWaMw8yhUfjaFUYtjaJ6e4xqDjmZ2jnnoiqGYLqzrPrtObTe8UtCJ0XOehT9ABGhUsPyguW814o80RpS7Q6sGRoQAiQu0nX4lv3qHM6ZGDvgEBws4rgEXVm0l2Lyty6mdtYJkdN89WmafnkKhecfQ63FVpccYcYBV4THW0OKBvaojcSTzqA3Cuv1LRprDaajE2/yDtSdehmZuN+o/f5bWPjjb1Bsb8GtqMKGPoGVnirnxW8WuX1FEGXQDAwJA6IJQ1THOWZrl+9N9LBEsqQWIvA72khtPZGpl9zBkD1nAZCbdwWtP/4ytvFNgorqyCta857Kq8Rd1HkDY9JCQ0roDKLHlLzXuWMj2EwqjduyHP/BPyLKIbHDTJLjt2fozM+SffEJupctRqczKGt6ior7DNN4Sni0NUQr6T3gYbASUDoMJ2/g2+M9Thzjkg1iJSoW5P3WNmpm7M22P5tHety20NXO0otO5Nxzf8RNTSFTazM0JEMCG5e2Ze0l8BIR6wS+LNt2FNQ4hqWBx7mv+tx3531sv/J5aj/ySdxR4xm2z+cpLF9E50vPoFMpBIu1loIRZg5VjEwK/1gdYhAcNYg14TA+ZOK8yR6HjXJo83vNkSiN39ZO/eyjmXLhTTiVNbDsFR4+eTYn/fZu5uU9Xs8a5q3waQtgu0pNXVLwzYaJWBfwWmCIJ3T6cOVbPme9WODpNssLoccjTyxg9At3MXmXj6JGTaR2789j8h20PfkwKplARBBr6TLCzlWKiRnFw6vDtSaTm5yAUoFNBH44xePAOk2LH11oBJLC7+hg6+POYvyZl6O0g3n671x59MGcfN/rvK4TVElIUkVgP7oq5O7mqCVlaqWixhWKpjdLXd8oPWdI/Jq5y0POWFDkLyui5CPtQFIMy8Vl/sJm5OFb+ei2k3DGbUfNjP3Q6TSt/5yPcj1QCoUlFwhTKxXbVuoeEvprW2y/EBBtK7KcMcHjcyMdVhaj2LwHlGwnY0+5kDEnnB8V2e75A2d++Uh+sKAdP+mRprcTQgFpR2jz4f7mkAdWhSgRplQoarxID4g3zKyxP6BUWqh2o+fc+U6kOdywLCAbQIUrPRPFAgksvutyT2M3S+++lY831JDebneqdpyJN3wkqx+aF+kNolESZfBTK4T6pOLvq0KcwUKAxA62Ia04Y7xH0fSCIyKYYpGxX7+ArY85G4AlN/2crx5/En9oslQkHfRaOiEM0epJOcLKAtzTFPDgqmhFTMwoahNROTiISXNVVLvpNjCvMeScl32uXeKz2o+2rDryXu221CGRcDVPdiqemv83PlodMvyjn6Ji6q54w0fR+tjdSDzVddzjOjGt+HebYUVJdNrUBKi4+rlNheLAEQ5BTAAimGKe5Fbj2OaiuQCs+v2POOWUs/hzm0NtSgjjbabr7F6IwU1qoakA9zWF/H1lSDaAhrRQ60mUZRdh7vKAc18pcsPSgJUFqHQjOXJDMbyN9wq8nNe8/NDD7F2ZpWq3famYugst/7qLQuNbKC8BNrrWlIan2g2v5iK94YMS8IE1YRs7pZVF2zP7S/9QrkexeTlvXX42QVeW5rmX85VtK2lbVOSBlX60fXQDAJVi/5SGtBaWdFkuXFjkuiWK7asFLcJLHYalOYOrhWo3AqUvlctSrWpVwbDbUIfTJlex5LpLybasIjV6At1vLUQlklEiWNIIDDQVLM5g0oRLNvKHUzxm12uaC2U+wFqCbC7SAyqr8MQgFn61xOcPb/uklLyvXvwSaEUTa8NYkjpaCWtrW99QyTwXWGaPdDhzvIenIG8VJteBDcCpSEPcQu8bqPXgkZaQ014u4vVTJNRvonxgIangJ1MTzKhRtMZRUCkbjRolIjuuiFSzO5tDLllU7BHf308bePmZwe+3VFDaHOgKnDLO5YhRDl1hbwQlSoOADcMeZazagZezhtMXFGkNYr17MJUiFFGnmidw4TYee9VqWv31K05DHHglZ7nw9SLPd4RUOgO7dbSnE8K3TMoovjfJY9dqtUa+8h5Z0kCNC093GM54pUC7D0ndf9fYr7UgJcQlYsu5kxIcNEKv/8tZyOjInFy11Oem5T4gZHT/70wpSaW+sRxS7/KNcS5VGrIbkCVrXHhodcg5rxbJm2iV96cy1q+lCEuU9kPU7eAqYfchUWdDSXZcG2FK4JO1mu0qNQtzhuX5qNTcH63gPRvBA8tWScU5kzyO3drBxo1dawU//tAhLtzWGPD913yMBU/1/+ocsGpoqSB32CiHb4/3gPV/YRP7hY4Arl3mM3dFQMFEvuE/KQeXfEQujM6KnFXvcEKDS50ntAfx8bWy9kzaU5EpvWKJzzXLfFI6KsQNhDYwoJpwaVvqx2o035/sUZ+I9ID1tam4EpWbn203XLHE5/HWkETcaNUXIkqfWzBRu/yO1ZqvjXGYUaPpDnursmsbgYVKHa2WC9/wuW9lQJUjPdueNktJMlLELKOTiv+d5DKjRtPu91ZI17UaMnGryvzmgOuXBSzuMqS09JgBuw7gfROVRbZKKr402mHWCIekgs5w3bPexu83xIXnOwznv17ktayh2pUB36q6UTThUsOWEjihwWXOaCdqW1nPbDRxi3ulAy2+5bbGgNsaA5oLvU23JXus4ibeXGCp8YTZ9Q6Hj3QYmYy0ArOe4lnJ5CQV3NoYcNlin7wZmB6gTUZACaTSZu09azVnjPcYk4rsMawfoJJZWtZtubUx4K9Nvd3PIhHw1a7wmboI+AkZoWsD5qa00qodaCpafr7Y52/NAZm4i25jnRuxUc+KKJmJjsAy3BO+MdbjwBEa36x/NZTASqioJPFWl+VPTQF3NUVnPOxf53BovcOUjJCP32td5qZEaiKe9fevDvn5mz7Lus2A67+bnIBykxTJipZ9hjmcPNZlfLok2K97NZSISKrIRLzRFR1rMyXuNereAPAls1blwIqC5TdLfP7aFOKo/o/vBzUBa0RJgWWYKxzb4HJovUNCIocp9I0IYcPAlzt2C9zVFHLV0iIr8ranIGjYNGOTn5ilyyKXnas1J45xo+TN9A1Y+gB8UkV9SM+2G65a6vNY6egytemPLhsUZ8aVJ00K2He45pjRDpMzim4TxfTrI2JdwHsqmvWLuy03vB2Zmw+S3A0UAUUGya1KyrcmVbvCrHqHL4x0aEgJ3eGGiSgBX4qa3ilY7mgMuL0xYFW8VUnJ4Dq+UjKubhZhOIPo4FZdFtfXJaK4fna9w1bJyNnmzZo+onzGpzU0Fyx/bQ65vdHn7e6+bdbbRCOQjKf+T5BdGGT3DlhTeLHUJ4UD6hwOHuEwNiUULT3Ns55ENn553jK/OWDeOyHLuk2PUGMG38HYFhBreVsynr4+vlnboLxvzLuJGJYQ9hmmOWiEw7hUFAa93R0Bf/fKkHfygxr4nlREQBtr75MKV31FRK62g/zuGe+u9VQ6wti0oER4q8vQ7tv11ooGIwEW+32pSjAxtPp5gTSbwSgREcYmyMYZ8vs5omCQDBMamak6Crwh1j4hpY3gg3yUdzykYqer4sc2E/BN3AuyoDsInlZE3vdGNsObthk2u1lfumwxcAvRvSaRoVBZdPWr9N5HYMudlAZuAVugKyyGU7phhQJ0C3QYay+Vso3sW8aAOV9lLFd3wwrKbuQmQDLj6ueUMMluuZ/YgJkeLCvxw+2ysJqyk4gE6MLwtbInb7mvWP87X7HY07KwitJ5UWW2SfvWLnIVKSXyCbbcU7I/hy/gGsP1ucBcEOMa8q7Ip3SzYZNx1Z1K5MAt9xTuR/CtfSznm08TYdpjYdS7PLQBJOebw621D0sEvr8Fww8GvsU+J745GMiXRUKwFkdb+kdXxjcHGGvvikkIt0RH79vhBvHM/xdFs2+53S9/ol5HrKpyUPSNnesoKkVkZmyiAt7/cZ0ftjg/jMNLZQzX5gJzeBE61gY+63GyPdqAb7jX0+o5a+1HlMiwMiLYQsQaM74HeCzLDfbkrsD8MMZKrcuCbCjKEUAXQ/uKb+zvXUUBZDslVJbtkQvf9fwPU0Zr6N2mrCy0G8sV+OGcLmMfKzPxdn0A92X0hE0ZGIGjjkQ4XER2jn3Ehy5pKNuhacE+D9wWKHNjPs/Sd2PWl/fp62fqMvND2mUXRO0tlj2AaSKy1YcgbA2spRHsyyI8Ghj1QD4InigDW7+fRPb/AQlKuL9Voe0VAAAAAElFTkSuQmCC'; }catch(e){}
      var PAT={ '#ef4444':[[[0.5,0.02],[0.44,0.4],[0.58,0.62],[0.5,0.98]],[[0.44,0.4],[0.04,0.5]],[[0.58,0.62],[0.98,0.7]]],
        '#f97316':[[[0.02,0.32],[0.4,0.42],[0.66,0.3],[0.98,0.4]],[[0.4,0.42],[0.46,0.98]],[[0.66,0.3],[0.7,0.02]]],
        '#22c55e':[[[0.02,0.6],[0.35,0.5],[0.6,0.66],[0.98,0.55]],[[0.35,0.5],[0.4,0.02]],[[0.6,0.66],[0.55,0.98]]],
        '#22d3ee':[[[0.2,0.02],[0.34,0.45],[0.2,0.98]],[[0.34,0.45],[0.82,0.4]],[[0.82,0.4],[0.98,0.75]],[[0.82,0.4],[0.9,0.02]]],
        '#3b82f6':[[[0.02,0.45],[0.5,0.55],[0.98,0.42]],[[0.5,0.55],[0.4,0.02]],[[0.5,0.55],[0.62,0.98]]],
        '#a855f7':[[[0.5,0.02],[0.4,0.35],[0.6,0.55],[0.42,0.8],[0.55,0.98]],[[0.6,0.55],[0.98,0.5]],[[0.4,0.35],[0.02,0.42]]] };
      var NODES={ '#ef4444':[[0.44,0.4],[0.58,0.62]],'#f97316':[[0.4,0.42],[0.66,0.3]],'#22c55e':[[0.35,0.5],[0.6,0.66]],'#22d3ee':[[0.34,0.45],[0.82,0.4]],'#3b82f6':[[0.5,0.55]],'#a855f7':[[0.4,0.35],[0.6,0.55],[0.42,0.8]] };
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cs; cv.height=cs; var C=cv.getContext('2d');
        var m=cs*0.045,a=m,b=m,w=cs-2*m,cx=cs/2,cy=cs/2,lc=String(col).toLowerCase();
        var FC=FIRE[lc]||'#ff6a1a', isJMB=(lc===JMBCOL);
        var pulse=0.6+0.4*(0.5+0.5*Math.sin(fi/FR*6.283));
        rr(C,a,b,w,w,cs*0.13); C.save(); C.clip();
        var sg=C.createLinearGradient(a,b,a+w,b+w); sg.addColorStop(0,'#3a281f'); sg.addColorStop(1,'#130b07'); C.fillStyle=sg; C.fillRect(0,0,cs,cs);
        C.fillStyle='rgba(255,255,255,.05)'; var spk=[[0.2,0.3],[0.72,0.22],[0.5,0.62],[0.82,0.72],[0.3,0.82]]; for(var d=0;d<spk.length;d++){ C.fillRect(a+spk[d][0]*w,b+spk[d][1]*w,Math.max(1,w*0.04),Math.max(1,w*0.04)); }
        C.fillStyle='rgba(255,190,130,.08)'; C.fillRect(a,b,w,Math.max(1.5,w*0.08));
        C.fillStyle='rgba(0,0,0,.32)'; C.fillRect(a,b+w-Math.max(2,w*0.1),w,Math.max(2,w*0.1));
        if(isJMB){
          C.save(); C.globalCompositeOperation='lighter'; var hg=C.createRadialGradient(cx,cy,1,cx,cy,w*0.55); hg.addColorStop(0,'rgba(255,150,50,'+(0.34*pulse)+')'); hg.addColorStop(1,'rgba(255,90,20,0)'); C.fillStyle=hg; C.fillRect(0,0,cs,cs);
          if(LOGO.complete && LOGO.naturalWidth){ C.globalAlpha=0.85+0.15*pulse; C.drawImage(LOGO,17,15,62,66,a,b,w,w); C.globalAlpha=1; } C.restore();
        } else {
          var pat=PAT[lc]||PAT['#ef4444'];
          function sp(pw,st){ C.lineWidth=pw; C.strokeStyle=st; for(var i=0;i<pat.length;i++){ var po=pat[i]; C.beginPath(); for(var j=0;j<po.length;j++){ var x=a+po[j][0]*w,y=b+po[j][1]*w; j?C.lineTo(x,y):C.moveTo(x,y); } C.stroke(); } }
          C.lineCap='round'; C.lineJoin='round';
          sp(Math.max(2,w*0.15),'#090402');
          C.save(); C.shadowColor=FC; C.shadowBlur=w*(0.28+0.32*pulse)*(glow?1.15:1);
          sp(Math.max(1.5,w*0.09),FC);
          sp(Math.max(1,w*0.035),_cx(FC,'#fff2c8',0.62));
          C.restore();
          C.save(); C.shadowColor=FC; C.shadowBlur=w*0.3*pulse; C.fillStyle=_cx(FC,'#fff0c0',0.55); var nd=NODES[lc]||[]; for(var n=0;n<nd.length;n++){ C.beginPath(); C.arc(a+nd[n][0]*w,b+nd[n][1]*w,w*0.05*(0.7+0.5*pulse),0,6.283); C.fill(); } C.restore();
        }
        C.restore(); C.strokeStyle='rgba(0,0,0,.55)'; C.lineWidth=1; rr(C,a+0.5,b+0.5,w-1,w-1,cs*0.13); C.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/110)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    // 💎 PRISMA — collector: premium frosted glass with a live iridescent light-sweep + moving glint.
    prisma:{ name:'Prisma', cost:20000, tier:'collector', ach:true, cell:(function(){
      var FR=30, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m, b=m, w=cs-2*m, r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip();
        // TRANSLUCENT glass body — deliberately low alpha so the BOARD DESIGN shows through the pane.
        c.globalAlpha=0.24;
        var bg=c.createLinearGradient(a,b,a+w,b+w); bg.addColorStop(0,_cx(col,'#ffffff',0.62)); bg.addColorStop(0.5,_cx(col,'#eaf1fb',0.34)); bg.addColorStop(1,_cx(col,'#9fb0c6',0.28));
        c.fillStyle=bg; c.fillRect(a,b,w,w);
        c.globalAlpha=1;
        // frosted sheen across the upper pane — kept light so it doesn't block the view
        c.globalAlpha=0.12; c.fillStyle='#ffffff'; c.fillRect(a,b,w,w*0.46); c.globalAlpha=1;
        c.globalCompositeOperation='screen';
        var sw=t*1.7-0.35; var lg=c.createLinearGradient(a+(sw-0.35)*w,b,a+(sw+0.55)*w,b+w);
        lg.addColorStop(0,'rgba(255,80,170,0)'); lg.addColorStop(0.44,'rgba(120,210,255,0)'); lg.addColorStop(0.5,'rgba(190,150,255,.5)'); lg.addColorStop(0.56,'rgba(130,255,225,.44)'); lg.addColorStop(0.66,'rgba(255,225,150,0)'); lg.addColorStop(1,'rgba(255,80,170,0)');
        c.fillStyle=lg; c.fillRect(a,b,w,w);
        var hue=(t*360)%360; c.globalAlpha=0.1; c.fillStyle='hsl('+hue.toFixed(0)+',95%,66%)'; c.fillRect(a,b,w,w); c.globalAlpha=1;
        c.globalCompositeOperation='source-over';
        var shine=0.5+0.5*Math.sin(t*6.283); c.globalAlpha=0.32+0.42*shine; c.fillStyle='#ffffff';
        c.beginPath(); c.ellipse(a+w*(0.28+0.1*shine),b+w*0.24,w*0.26,w*0.12,-0.6,0,6.283); c.fill(); c.globalAlpha=1;
        c.restore();
        // crisp bright glass rim so the transparent pane still reads as a solid block
        c.strokeStyle='rgba(255,255,255,.82)'; c.lineWidth=Math.max(1,cs*0.055); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        c.globalAlpha=0.3; c.strokeStyle='rgba(20,30,50,.5)'; c.lineWidth=Math.max(1,cs*0.04); c.beginPath(); c.moveTo(a+w*0.22,b+w-1); c.lineTo(a+w-1,b+w-1); c.lineTo(a+w-1,b+w*0.22); c.stroke(); c.globalAlpha=1;
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/60)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    holo:{ name:'Holo Foil', cost:15000, tier:'collector', cell:(function(){
      var FR=36, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m, b=m, w=cs-2*m, r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip();
        // metallic foil base tinted to the piece colour
        var bg=c.createLinearGradient(a,b,a+w,b+w); bg.addColorStop(0,_cx(col,'#ffffff',0.5)); bg.addColorStop(0.5,_cx(col,'#3a3a46',0.2)); bg.addColorStop(1,_cx(col,'#0a0a14',0.4));
        c.fillStyle=bg; c.fillRect(a,b,w,w);
        // holographic rainbow bands (screen blend): a diagonal sweep + a faint counter-band + hue wash
        c.globalCompositeOperation='screen';
        var hue=(t*360)%360, sw=t*2-0.5, s;
        var g=c.createLinearGradient(a+(sw-0.6)*w,b,a+(sw+0.6)*w,b+w);
        for(s=0;s<=6;s++){ g.addColorStop(s/6,'hsla('+((hue+s*60)%360)+',95%,60%,0.32)'); }
        c.fillStyle=g; c.fillRect(a,b,w,w);
        var g2=c.createLinearGradient(a,b+w,a+w,b); for(s=0;s<=6;s++){ g2.addColorStop(s/6,'hsla('+((hue+180+s*55)%360)+',90%,62%,0.16)'); }
        c.fillStyle=g2; c.fillRect(a,b,w,w);
        c.globalAlpha=0.10; c.fillStyle='hsl('+hue.toFixed(0)+',95%,64%)'; c.fillRect(a,b,w,w); c.globalAlpha=1;
        c.globalCompositeOperation='source-over';
        // twinkling diamond sparkles
        c.fillStyle='#ffffff';
        var pts=[[0.28,0.30],[0.70,0.24],[0.55,0.62],[0.36,0.74],[0.80,0.68]];
        for(var p=0;p<pts.length;p++){ var tw=0.5+0.5*Math.sin(t*12.566 + p*1.7); if(tw>0.62){ c.globalAlpha=(tw-0.62)/0.38; var q=w*0.06*tw; var px=a+pts[p][0]*w, py=b+pts[p][1]*w; c.beginPath(); c.moveTo(px-q,py); c.lineTo(px,py-q); c.lineTo(px+q,py); c.lineTo(px,py+q); c.closePath(); c.fill(); } }
        c.globalAlpha=1;
        // top sheen
        c.globalAlpha=0.16; c.fillStyle='#ffffff'; c.fillRect(a,b,w,w*0.4); c.globalAlpha=1;
        c.restore();
        // bright foil rim + dark bottom-right edge
        c.strokeStyle='rgba(255,255,255,.72)'; c.lineWidth=Math.max(1,cs*0.05); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        c.globalAlpha=0.4; c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=Math.max(1,cs*0.04); c.beginPath(); c.moveTo(a+w*0.22,b+w-1); c.lineTo(a+w-1,b+w-1); c.lineTo(a+w-1,b+w*0.22); c.stroke(); c.globalAlpha=1;
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/55)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    abyss:{ name:'Abyss', cost:16000, tier:'collector', cell:(function(){
      var FR=60, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m,b=m,w=cs-2*m,r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip();
        var rg=c.createRadialGradient(a+w*0.5,b+w*0.45,w*0.05,a+w*0.5,b+w*0.5,w*0.75); rg.addColorStop(0,_cx(col,'#0a2c3a',0.42)); rg.addColorStop(1,'#02060b'); c.fillStyle=rg; c.fillRect(a,b,w,w);
        var breathe=0.5+0.5*Math.sin(t*6.283);
        c.globalCompositeOperation='screen';
        var gg=c.createRadialGradient(a+w*0.5,b+w*0.5,0,a+w*0.5,b+w*0.5,w*0.6); gg.addColorStop(0,'rgba(60,220,230,'+(0.10+0.22*breathe)+')'); gg.addColorStop(1,'rgba(60,220,230,0)'); c.fillStyle=gg; c.fillRect(a,b,w,w);
        var motes=[[0.3,0.8,0.9],[0.62,0.6,1.3],[0.45,0.35,0.7],[0.78,0.85,1.1],[0.2,0.5,1.6]];
        c.fillStyle='#bfffff';
        for(var i=0;i<motes.length;i++){ var mo=motes[i]; var yy=((mo[1]-t*mo[2])%1+1)%1; var tw=0.4+0.6*Math.sin(t*6.283*2+i*1.9); c.globalAlpha=Math.max(0,tw)*0.8; var rad=w*0.035*(0.7+0.5*tw); c.beginPath(); c.arc(a+mo[0]*w,b+yy*w,rad,0,6.283); c.fill(); }
        c.globalAlpha=1; c.globalCompositeOperation='source-over';
        c.restore();
        c.strokeStyle='rgba(90,220,230,0.42)'; c.lineWidth=Math.max(1,cs*0.045); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/70)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    mirage:{ name:'Mirage', cost:16000, tier:'collector', cell:(function(){
      var FR=48, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m,b=m,w=cs-2*m,r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip();
        var hz=0.5+0.18*Math.sin(t*6.283);
        var g=c.createLinearGradient(a,b,a,b+w);
        g.addColorStop(0,_cx(col,'#eef2f8',0.7)); g.addColorStop(Math.max(0.02,hz-0.14),_cx(col,'#9aa4b2',0.35)); g.addColorStop(hz,'#20252e'); g.addColorStop(Math.min(0.98,hz+0.06),_cx(col,'#c2ccd8',0.4)); g.addColorStop(1,_cx(col,'#7b8494',0.3));
        c.fillStyle=g; c.fillRect(a,b,w,w);
        c.globalCompositeOperation='screen';
        for(var i=0;i<3;i++){ var yy=((i/3 + t*0.5)%1); var off=Math.sin(t*6.283+i)*w*0.04; c.fillStyle='rgba(255,255,255,0.10)'; c.fillRect(a+off,b+yy*w,w,Math.max(1,w*0.06)); }
        var sw=t*1.8-0.4; var lg=c.createLinearGradient(a+(sw-0.3)*w,b,a+(sw+0.4)*w,b+w); lg.addColorStop(0,'rgba(255,255,255,0)'); lg.addColorStop(0.5,'rgba(255,255,255,0.5)'); lg.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=lg; c.fillRect(a,b,w,w);
        c.globalCompositeOperation='source-over';
        c.restore();
        c.strokeStyle='rgba(255,255,255,0.8)'; c.lineWidth=Math.max(1,cs*0.05); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        c.globalAlpha=0.35; c.strokeStyle='rgba(20,25,35,0.6)'; c.lineWidth=Math.max(1,cs*0.04); c.beginPath(); c.moveTo(a+w*0.2,b+w-1); c.lineTo(a+w-1,b+w-1); c.lineTo(a+w-1,b+w*0.2); c.stroke(); c.globalAlpha=1;
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/70)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    rgbgamer:{ name:'RGB Gamer', cost:25000, tier:'collector', cell:(function(){
      var FR=48, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m,b=m,w=cs-2*m,r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip(); c.fillStyle=_cx(col,'#0b0b12',0.5); c.fillRect(a,b,w,w); c.globalAlpha=0.12; c.fillStyle='#fff'; c.fillRect(a,b,w,w*0.4); c.globalAlpha=1; c.restore();
        var hue=(t*360)%360; var g=c.createLinearGradient(a,b,a+w,b+w); for(var s=0;s<=4;s++){ g.addColorStop(s/4,'hsl('+((hue+s*90)%360)+',95%,58%)'); }
        var lw=Math.max(1.5,cs*0.1); c.strokeStyle=g; c.lineWidth=lw; rr(c,a+lw/2,b+lw/2,w-lw,w-lw,r); c.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/60)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    matrix:{ name:'Matrix', cost:16000, tier:'iconic', cell:(function(){
      var FR=30, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m,b=m,w=cs-2*m,r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip(); c.fillStyle='#020a04'; c.fillRect(a,b,w,w);
        var cols=4, cw=w/cols;
        for(var i=0;i<cols;i++){ var sp=1+(i%2); var head=((t*sp+i*0.37)%1); for(var j=0;j<5;j++){ var yy=head-j*0.17; if(yy<0)yy+=1; var al=(j===0)?1:Math.max(0,0.65-j*0.15); c.fillStyle=(j===0)?'rgba(200,255,200,'+al+')':'rgba(40,230,90,'+al+')'; c.fillRect(a+i*cw+cw*0.22,b+yy*w,cw*0.56,w*0.085); } }
        c.restore(); c.strokeStyle='rgba(40,230,90,0.4)'; c.lineWidth=Math.max(1,cs*0.045); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/45)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    lavalamp:{ name:'Lava Lamp', cost:25000, tier:'collector', cell:(function(){
      var FR=72, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m,b=m,w=cs-2*m,r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip(); c.fillStyle=_cx(col,'#120a1e',0.4); c.fillRect(a,b,w,w); c.globalCompositeOperation='screen';
        var bl=[[1,0],[1,2.1],[2,4.0]];
        for(var i=0;i<bl.length;i++){ var cx=a+w*(0.5+0.28*Math.sin(t*6.283*bl[i][0]+bl[i][1])); var cy=b+w*(0.5+0.3*Math.cos(t*6.283*bl[i][0]+bl[i][1])); var rad=w*(0.3+0.06*Math.sin(t*6.283+i)); var hue=(i*90+t*360)%360; var gg=c.createRadialGradient(cx,cy,0,cx,cy,rad); gg.addColorStop(0,'hsla('+hue+',90%,60%,0.85)'); gg.addColorStop(1,'hsla('+hue+',90%,60%,0)'); c.fillStyle=gg; c.beginPath(); c.arc(cx,cy,rad,0,6.283); c.fill(); }
        c.globalCompositeOperation='source-over'; c.restore(); c.strokeStyle='rgba(255,255,255,0.32)'; c.lineWidth=Math.max(1,cs*0.045); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/90)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },
    kaleido:{ name:'Kaleido', cost:16000, tier:'iconic', cell:(function(){
      var FR=72, cache={};
      function render(col,cs,glow,fi){
        var cv=document.createElement('canvas'); cv.width=cv.height=cs; var c=cv.getContext('2d');
        var m=Math.max(1,cs*0.06), a=m,b=m,w=cs-2*m,r=Math.max(3,cs*0.22); var t=fi/FR;
        rr(c,a,b,w,w,r); c.save(); c.clip(); c.fillStyle='#0a0a12'; c.fillRect(a,b,w,w); c.translate(a+w/2,b+w/2); c.rotate(t*6.283); c.globalCompositeOperation='screen';
        for(var s2=0;s2<6;s2++){ c.save(); c.rotate((6.283/6)*s2); var hue=(s2*60+t*360)%360; c.fillStyle='hsla('+hue+',90%,60%,0.7)'; c.beginPath(); c.moveTo(0,0); c.lineTo(w*0.5,-w*0.13); c.lineTo(w*0.42,w*0.06); c.closePath(); c.fill(); c.restore(); }
        c.globalCompositeOperation='source-over'; c.restore(); c.strokeStyle='rgba(255,255,255,0.4)'; c.lineWidth=Math.max(1,cs*0.045); rr(c,a+0.6,b+0.6,w-1.2,w-1.2,r); c.stroke();
        return cv;
      }
      return function(c,px,py,cs,col,glow){ var s=Math.max(2,Math.round(cs)); var fi=Math.floor(Date.now()/80)%FR; var k=col+'|'+s+'|'+(glow?1:0); var arr=cache[k]||(cache[k]=[]); var t=arr[fi]||(arr[fi]=render(String(col),s,!!glow,fi)); c.drawImage(t,px,py); };
    })() },

    /* ── RAVAGER · collector ──
       The first skin that knows what is NEXT TO IT. Every other design draws a cell in
       isolation; this one reads its neighbours and behaves differently on an edge than in the
       middle of a mass:
         · barbs grow only on sides with NO neighbour, so a landed shape is spiked along its
           silhouette and smooth inside — a stack looks like one welded slab, not a grid of
           spiked squares;
         · where two cells DO touch, the barbs vanish and a magma seam lights across the join.
       That is also why it stays readable at real playing scale: all the detail lives on the
       outline, and the outline is the thing you actually read when deciding where to drop.
       Neighbours come from _RVB, published by the board pass. When it is absent — the next-piece
       and hold panels, the shop preview — every side reads as an edge, which is correct: a piece
       in the air genuinely has no neighbours. */
    /* ── The four material skins. Every other design in the Locker is a light effect;
       these are made of something — paper, ink, water, vinyl. None need board context and
       only Aquarium animates, which is what keeps them cheap. ── */
    sticker:{ name:'Sticker', cost:900, tier:'regular', cell:function(c,px,py,cs,col){
      var m=cs*.07, a=px+m, b=py+m, w=cs-2*m, r=cs*.24;
      var x=Math.round(px/cs), y=Math.round(py/cs);
      function sh(u,v){ return (Math.sin(u*12.9898+v*78.233)*43758.5453)%1; }
      c.save(); c.translate(a+w/2,b+w/2); c.rotate(sh(x,y)*.12); c.translate(-(a+w/2),-(b+w/2));
      c.save(); c.shadowColor='rgba(16,24,40,.22)'; c.shadowBlur=cs*.16; c.shadowOffsetY=cs*.05;
      rr(c,a,b,w,w,r); c.fillStyle='#fff'; c.fill(); c.restore();
      var im=w*.11; rr(c,a+im,b+im,w-2*im,w-2*im,r*.7); c.fillStyle=col; c.fill();
      c.fillStyle='rgba(255,255,255,.30)'; rr(c,a+im,b+im,w-2*im,(w-2*im)*.38,r*.6); c.fill();
      /* The preview cut this corner with the widget's own background colour. On a real board
         that would paint a light patch, so it is punched out instead and shows the board. */
      c.save(); c.globalCompositeOperation='destination-out';
      c.beginPath(); c.moveTo(a+w,b+w-w*.30); c.lineTo(a+w,b+w); c.lineTo(a+w-w*.30,b+w); c.closePath(); c.fill();
      c.restore();
      c.beginPath(); c.moveTo(a+w,b+w-w*.30);
      c.quadraticCurveTo(a+w-w*.10,b+w-w*.10,a+w-w*.30,b+w);
      c.strokeStyle='rgba(16,24,40,.18)'; c.lineWidth=Math.max(1,cs*.03); c.stroke(); c.restore();
    } },

    origami:{ name:'Origami', cost:2400, tier:'premium', cell:function(c,px,py,cs,col){
      var m=cs*.04, a=px+m, b=py+m, w=cs-2*m;
      c.save(); c.shadowColor='rgba(60,45,30,.28)'; c.shadowBlur=cs*.18; c.shadowOffsetY=cs*.06;
      c.fillStyle=col; c.fillRect(a,b,w,w); c.restore();
      var gr=c.createLinearGradient(a,b,a+w,b+w);
      gr.addColorStop(0,'rgba(255,255,255,.34)'); gr.addColorStop(.5,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(0,0,0,.18)');
      c.fillStyle=gr; c.fillRect(a,b,w,w);
      c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=Math.max(1,cs*.03);
      c.beginPath(); c.moveTo(a,b+w); c.lineTo(a+w,b); c.stroke();
      c.strokeStyle='rgba(0,0,0,.16)'; c.beginPath(); c.moveTo(a+w*.5,b); c.lineTo(a+w*.5,b+w); c.stroke();
      c.fillStyle='rgba(0,0,0,.10)'; c.beginPath();
      c.moveTo(a+w,b); c.lineTo(a+w,b+w*.42); c.lineTo(a+w*.58,b); c.closePath(); c.fill();
    } },

    blueprint:{ name:'Blueprint', cost:3200, tier:'premium', cell:function(c,px,py,cs,col){
      var m=cs*.06, a=px+m, b=py+m, w=cs-2*m;
      var x=Math.round(px/cs), y=Math.round(py/cs);
      c.save(); c.globalAlpha=.18; c.fillStyle=col; c.fillRect(a,b,w,w); c.restore();
      c.strokeStyle='rgba(150,215,255,.85)'; c.lineWidth=Math.max(1,cs*.045); c.strokeRect(a,b,w,w);
      c.strokeStyle='rgba(150,215,255,.30)'; c.lineWidth=1;
      for(var i=1;i<3;i++){ c.beginPath();
        c.moveTo(a+w*i/3,b); c.lineTo(a+w*i/3,b+w);
        c.moveTo(a,b+w*i/3); c.lineTo(a+w,b+w*i/3); c.stroke(); }
      c.strokeStyle='rgba(190,235,255,.9)'; c.beginPath();
      c.moveTo(a+w*.16,b+w*.2); c.lineTo(a+w*.84,b+w*.2);
      c.moveTo(a+w*.16,b+w*.2); c.lineTo(a+w*.24,b+w*.14);
      c.moveTo(a+w*.84,b+w*.2); c.lineTo(a+w*.76,b+w*.14); c.stroke();
      /* Part numbers are gated: text too small to read is just noise on the board. */
      if(cs>=22){ c.fillStyle='rgba(190,235,255,.9)';
        c.font='700 '+Math.round(cs*.2)+'px ui-monospace,monospace'; c.textAlign='center';
        c.fillText('T-'+((x*7+y*3)%90+10), a+w/2, b+w*.74); }
    } },

    aquarium:{ name:'Aquarium', cost:12000, tier:'premium', cell:function(c,px,py,cs,col){
      var m=cs*.05, a=px+m, b=py+m, w=cs-2*m, r=cs*.16;
      var x=Math.round(px/cs), y=Math.round(py/cs), t=(Date.now()/4200)%1;
      function sh(u,v){ return (Math.sin(u*12.9898+v*78.233)*43758.5453)%1; }
      c.save(); rr(c,a,b,w,w,r); c.clip();
      var wg=c.createLinearGradient(a,b,a,b+w);
      wg.addColorStop(0,'#0d4a63'); wg.addColorStop(1,'#02202e'); c.fillStyle=wg; c.fillRect(a,b,w,w);
      var ph=t*6.283+sh(x,y)*6, fx=a+w*.5+Math.cos(ph)*w*.22, fy=b+w*.5+Math.sin(ph*1.3)*w*.18;
      c.fillStyle=col; c.beginPath(); c.ellipse(fx,fy,w*.17,w*.11,Math.cos(ph)*.4,0,6.283); c.fill();
      c.beginPath(); c.moveTo(fx-Math.cos(ph)*w*.17,fy);
      c.lineTo(fx-Math.cos(ph)*w*.30,fy-w*.09); c.lineTo(fx-Math.cos(ph)*w*.30,fy+w*.09); c.closePath(); c.fill();
      for(var i=0;i<3;i++){ var bp=((t*1.2+i*.33+sh(x+i,y))%1);
        c.globalAlpha=.5*(1-bp); c.fillStyle='#bfefff';
        c.beginPath(); c.arc(a+w*(.25+.22*i), b+w*(1-bp), Math.max(1,w*.035), 0, 6.283); c.fill();
        c.globalAlpha=1; }
      c.restore();
      c.strokeStyle='rgba(190,235,255,.55)'; c.lineWidth=Math.max(1,cs*.05); rr(c,a,b,w,w,r); c.stroke();
      c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(a+w*.1,b+w*.08,w*.8,w*.10);
    } },

    /* ── KINTSUGI · collector ──
       Black lacquer, and every place two blocks touch is mended in molten gold — the Japanese
       repair that makes the seam the most valuable part of the object. It reads as restraint
       rather than spectacle: the board is almost black until YOU build a connection, and the
       gold only exists because of how well the piece was placed.
       Adjacency comes from _RVB, the same board context Ravager uses. With no context — the
       next-piece panel, the shop preview — a piece has no neighbours and shows unmended, which
       is exactly right for something not yet placed. */
    kintsugi:{ name:'Kintsugi', cost:40000, tier:'collector', cell:function(c,px,py,cs,col,glow){
      var m=Math.max(1,cs*0.03), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.10);
      var t=(Date.now()/6000)%1;
      var gx=Math.round(px/cs), gy=Math.round(py/cs);
      function nb(dx,dy){ if(!_RVB) return true;      /* no board = Locker preview: show it mended */
        var X=gx+dx, Y=gy+dy;
        if(X<0||Y<0||Y>=_RVB.g.length||X>=_RVB.w) return false; return !!_RVB.g[Y][X]; }
      function h(u,v){ return Math.abs((Math.sin(u*12.9898+v*78.233)*43758.5453)%1); }
      rr(c,a,b,w,w,r);
      var lac=c.createLinearGradient(a,b,a+w,b+w);
      lac.addColorStop(0,'#1b1b22'); lac.addColorStop(0.45,'#0c0c11'); lac.addColorStop(1,'#000000');
      c.fillStyle=lac; c.fill();
      c.save(); rr(c,a,b,w,w,r); c.clip();
      var tint=c.createRadialGradient(a+w*0.3,b+w*0.25,0,a+w*0.3,b+w*0.25,w);
      tint.addColorStop(0,col); tint.addColorStop(1,'rgba(0,0,0,0)');
      c.globalAlpha=0.16; c.fillStyle=tint; c.fillRect(a,b,w,w); c.globalAlpha=1; c.restore();
      var pulse=0.75+0.25*Math.sin(t*6.283+h(gx,gy)*6);
      var sides=[[0,-1,nb(0,-1)],[0,1,nb(0,1)],[-1,0,nb(-1,0)],[1,0,nb(1,0)]];
      for(var k=0;k<4;k++){
        var d=sides[k]; if(!d[2]) continue;
        var sx=a+w/2+d[0]*w/2, sy=b+w/2+d[1]*w/2, ex=a+w/2, ey=b+w/2;
        c.save();
        c.strokeStyle='rgba(255,215,120,'+(0.85*pulse)+')';
        c.lineWidth=Math.max(1.2,cs*0.055);
        c.shadowColor='rgba(255,190,80,0.9)'; c.shadowBlur=cs*0.22;
        c.beginPath(); c.moveTo(sx,sy);
        var jx=(h(gx+k,gy)-0.5)*w*0.30, jy=(h(gx,gy+k)-0.5)*w*0.30;
        c.quadraticCurveTo((sx+ex)/2+jx,(sy+ey)/2+jy,ex,ey);
        c.stroke(); c.restore();
      }
      if(sides.some(function(d){ return d[2]; })){
        c.fillStyle='rgba(255,225,150,'+(0.55*pulse)+')';
        c.beginPath(); c.arc(a+w/2,b+w/2,Math.max(1,cs*0.045),0,6.283); c.fill();
      }
      c.strokeStyle='rgba(255,255,255,0.10)'; c.lineWidth=Math.max(1,cs*0.03);
      rr(c,a,b,w,w,r); c.stroke();
    } },

    /* ── KILN · collector ──
       Molten glass that cools where it lands. A block is white-hot as it locks and fades through
       orange to cold over KILN_COOL, so the board becomes a record of HOW the game was played:
       a fast clear looks like a furnace, a slow careful stack looks like cold slag.
       The age comes from _KILN, which diffs the grid rather than hooking the lock routine — a
       skin should not be able to break scoring. Anything with no timestamp (the next-piece
       panel, a fresh board) reads cold, which is the honest default. */
    /* ── PILIPINAS · collector ──
       Three solid blocks in the flag's colours rather than one block trying to be the whole flag:
       white carries the sun and the three stars, blue and red are clean lacquered fields. A piece
       keeps its colour for the entire game — derived from the palette colour it is handed — so the
       board builds into the flag's palette instead of a random spatter.

       White is deliberately the rarest of the three. It is the smaller field on the real flag, and
       it makes the block that carries the sun feel like something worth landing.

       Collector tier because, like Kintsugi, it is adjacency-aware: gold seams appear only where
       two blocks touch, so a tight stack glows along its joins and a messy one does not. */
    nightsuit:{ name:'Night Suit', cost:50000, tier:'collector', cell:function(c,px,py,cs,col,glow){
      /* Glossy symbiote black · silver web filaments · crimson emblem-spider crest on rare
         blocks · breathing red-blue hero iridescence. Role is derived from the CELL position,
         so webs and crests sit stable on the board instead of flickering. */
      var m=Math.max(1,cs*0.03), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.12);
      var gx=Math.round(px/cs), gy=Math.round(py/cs), t=Date.now()/16;
      var hh=((gx*7+gy*13+3)%11), role=(hh===0)?'crest':(hh<5?'web':(hh<7?'shimmer':'plain'));
      rr(c,a,b,w,w,r);
      var g=c.createLinearGradient(a,b,a,b+w);
      g.addColorStop(0,'#23242e'); g.addColorStop(0.35,'#101018'); g.addColorStop(1,'#050508');
      c.fillStyle=g; c.fill();
      c.save(); rr(c,a,b,w,w,r); c.clip();
      var br=0.5+0.5*Math.sin(t/40);
      var g2=c.createLinearGradient(a,b,a+w,b+w);
      g2.addColorStop(0,'rgba(70,110,255,'+(0.10+0.07*br)+')');
      g2.addColorStop(0.5,'rgba(0,0,0,0)');
      g2.addColorStop(1,'rgba(225,29,46,'+(0.10+0.08*(1-br))+')');
      c.fillStyle=g2; c.fillRect(a,b,w,w);
      c.fillStyle='rgba(255,255,255,0.10)'; c.fillRect(a+w*0.08,b+w*0.06,w*0.84,w*0.16);
      if(role==='web'||role==='crest'){
        var sh=0.45+0.3*Math.sin(t/25+gx*0.7+gy*0.9);
        c.strokeStyle='rgba(220,228,245,'+sh+')'; c.lineWidth=Math.max(1,w*0.03);
        [[w,0],[w,w*0.45],[w,w],[w*0.45,w],[0,w]].forEach(function(e){
          c.beginPath(); c.moveTo(a,b); c.lineTo(a+e[0],b+e[1]); c.stroke(); });
        [0.42,0.74].forEach(function(rr2){ c.beginPath(); c.arc(a,b,w*rr2,0,Math.PI/2); c.stroke(); });
      }
      if(role==='crest'){
        var cx=a+w/2, cy=b+w/2, sp=w/2, gl=0.55+0.35*Math.sin(t/18);
        c.shadowColor='rgba(225,29,46,'+gl+')'; c.shadowBlur=w*0.34;
        c.fillStyle='#e11d2e';
        c.beginPath(); c.ellipse(cx,cy-sp*0.34,sp*0.09,sp*0.10,0,0,7); c.fill();
        c.beginPath(); c.ellipse(cx,cy-sp*0.16,sp*0.115,sp*0.13,0,0,7); c.fill();
        c.beginPath(); c.moveTo(cx,cy-sp*0.06);
        c.quadraticCurveTo(cx+sp*0.15,cy+sp*0.24, cx,cy+sp*0.58);
        c.quadraticCurveTo(cx-sp*0.15,cy+sp*0.24, cx,cy-sp*0.06); c.fill();
        c.strokeStyle='#e11d2e'; c.lineWidth=Math.max(1.1,w*0.038); c.lineCap='round'; c.lineJoin='round';
        [[-0.26,0.30,-0.26,0.46,-0.62],[-0.18,0.38,-0.12,0.66,-0.34],[-0.08,0.38,0.10,0.64,0.30],[0.02,0.28,0.30,0.44,0.66]].forEach(function(L){
          [-1,1].forEach(function(sg){
            c.beginPath();
            c.moveTo(cx+sg*sp*0.09, cy+sp*L[0]);
            c.lineTo(cx+sg*sp*L[1], cy+sp*L[2]);
            c.lineTo(cx+sg*sp*L[3], cy+sp*L[4]);
            c.stroke(); }); });
        c.shadowBlur=0;
      }
      if(role==='shimmer'){
        var ph=((t*1.6)%(w*2.6))-w*0.8;
        var g3=c.createLinearGradient(a+ph-w*0.3,b,a+ph+w*0.3,b+w);
        g3.addColorStop(0,'rgba(0,0,0,0)'); g3.addColorStop(0.5,'rgba(255,60,70,0.30)'); g3.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=g3; c.fillRect(a,b,w,w);
      }
      c.restore();
      c.strokeStyle='rgba(150,160,190,0.30)'; c.lineWidth=1; rr(c,a,b,w,w,r); c.stroke();
    }},
    pilipinas:{ name:'Pilipinas', cost:45000, tier:'collector', cell:function(c,px,py,cs,col,glow){
      var m=Math.max(1,cs*0.03), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.12);
      var gx=Math.round(px/cs), gy=Math.round(py/cs);
      var t=(Date.now()/9000)%1;
      /* 7 palette colours over a 7-slot wheel weighted 3 blue · 3 red · 1 white. */
      var WHEEL=['b','r','b','r','w','b','r'];
      var s0=String(col||''), n0=0; for(var i0=0;i0<s0.length;i0++) n0=(n0*31+s0.charCodeAt(i0))|0;
      var k=WHEEL[Math.abs(n0)%7];
      function nb(dx,dy){ if(!_RVB) return false;
        var X=gx+dx, Y=gy+dy;
        if(X<0||Y<0||Y>=_RVB.g.length||X>=_RVB.w) return false; return !!_RVB.g[Y][X]; }
      function h(u,v){ return Math.abs((Math.sin(u*12.9898+v*78.233)*43758.5453)%1); }

      var top = k==='w' ? '#ffffff' : (k==='b' ? '#0b46c8' : '#e0203a');
      var bot = k==='w' ? '#dfe6f3' : (k==='b' ? '#0038A8' : '#CE1126');
      rr(c,a,b,w,w,r);
      var g=c.createLinearGradient(a,b,a+w*0.4,b+w);
      g.addColorStop(0,top); g.addColorStop(1,bot);
      c.fillStyle=g; c.fill();

      c.save(); rr(c,a,b,w,w,r); c.clip();
      var sh=c.createLinearGradient(a,b,a+w,b+w);
      sh.addColorStop(0,'rgba(255,255,255,'+(k==='w'?0.55:0.30)+')');
      sh.addColorStop(0.45,'rgba(255,255,255,0.04)');
      sh.addColorStop(1,'rgba(0,0,0,'+(k==='w'?0.10:0.26)+')');
      c.fillStyle=sh; c.fillRect(a,b,w,w);

      if(k==='w'){
        var cx=a+w/2, cy=b+w/2;
        c.save(); c.translate(cx,cy); c.rotate(t*6.283);
        for(var q=0;q<8;q++){
          var lng=(q%2===0), len=w*(lng?0.30:0.21), wid=w*(lng?0.042:0.030);
          c.rotate(6.283/8);
          var rg=c.createLinearGradient(0,0,len,0);
          rg.addColorStop(0,'#F0A500'); rg.addColorStop(1,'rgba(245,183,0,0.30)');
          c.fillStyle=rg;
          c.beginPath(); c.moveTo(w*0.05,-wid); c.lineTo(len,0); c.lineTo(w*0.05,wid); c.closePath(); c.fill();
        }
        c.restore();
        var sd=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(1.4,w*0.13));
        sd.addColorStop(0,'#FFDE59'); sd.addColorStop(1,'#F0A500');
        c.fillStyle=sd; c.beginPath(); c.arc(cx,cy,Math.max(1.4,w*0.115),0,6.283); c.fill();
        var sr=Math.max(1,w*0.075);
        [[0.17,0.17],[0.83,0.17],[0.50,0.86]].forEach(function(p){
          var sx=a+w*p[0], sy=b+w*p[1];
          c.fillStyle='#F5B700'; c.beginPath();
          for(var z=0;z<10;z++){ var ang=-1.5708+z*0.6283, r2=(z%2?sr*0.42:sr);
            c[z?'lineTo':'moveTo'](sx+Math.cos(ang)*r2, sy+Math.sin(ang)*r2); }
          c.closePath(); c.fill();
        });
      } else {
        var gh=c.createRadialGradient(a+w/2,b+w/2,0,a+w/2,b+w/2,w*0.55);
        gh.addColorStop(0,'rgba(255,255,255,0.14)'); gh.addColorStop(1,'rgba(255,255,255,0)');
        c.fillStyle=gh; c.fillRect(a,b,w,w);
      }
      c.restore();

      var oL=!nb(-1,0), oR=!nb(1,0), oT=!nb(0,-1), oB=!nb(0,1);
      var pulse=0.72+0.28*Math.sin(t*6.283+h(gx,gy)*6);
      var jn=[[!oT,a,b,a+w,b],[!oB,a,b+w,a+w,b+w],[!oL,a,b,a,b+w],[!oR,a+w,b,a+w,b+w]];
      for(var j=0;j<4;j++){
        if(!jn[j][0]) continue;
        c.save();
        c.strokeStyle='rgba(245,183,0,'+(0.85*pulse)+')';
        c.lineWidth=Math.max(1,cs*0.045);
        c.shadowColor='rgba(255,196,40,0.9)'; c.shadowBlur=cs*0.20;
        c.beginPath(); c.moveTo(jn[j][1],jn[j][2]); c.lineTo(jn[j][3],jn[j][4]); c.stroke();
        c.restore();
      }
      c.strokeStyle=(k==='w')?'rgba(15,23,42,0.16)':'rgba(255,255,255,0.18)';
      c.lineWidth=Math.max(1,cs*0.028); rr(c,a,b,w,w,r); c.stroke();
    } },
    kiln:{ name:'Kiln', cost:35000, tier:'collector', cell:function(c,px,py,cs,col,glow){
      var KILN_COOL=30000;
      var m=Math.max(1,cs*0.04), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.14);
      var gx=Math.round(px/cs), gy=Math.round(py/cs);
      /* No board = Locker preview: sweep each cell through the full hot-to-cold range so the
         swatch actually demonstrates what you are buying. */
      var heat=_RVB ? Math.max(0, 1-(_kilnAge(gx,gy)/KILN_COOL))
                    : Math.max(0,Math.min(1, 1-(((Date.now()/2600)+gx*0.17)%1)*1.5));
      if(glow) heat=1;                       // the falling piece is straight out of the furnace
      rr(c,a,b,w,w,r);
      var gr=c.createLinearGradient(a,b,a,b+w);
      if(heat>0.66){ gr.addColorStop(0,'#fffdf3'); gr.addColorStop(0.5,'#ffd27a'); gr.addColorStop(1,'#ff7b18'); }
      else if(heat>0.33){ gr.addColorStop(0,'#ffb347'); gr.addColorStop(0.55,'#e2560d'); gr.addColorStop(1,'#6d1a04'); }
      else { gr.addColorStop(0,'#3a2c24'); gr.addColorStop(0.5,'#1d1512'); gr.addColorStop(1,'#0d0908'); }
      c.fillStyle=gr; c.fill();
      if(heat>0.05){
        c.save(); c.globalCompositeOperation='screen';
        c.shadowColor='rgba(255,150,40,'+heat+')'; c.shadowBlur=cs*0.7*heat;
        rr(c,a,b,w,w,r); c.fillStyle='rgba(255,180,90,'+(0.20*heat)+')'; c.fill(); c.restore();
      }
      /* A touch of the piece colour along the top, so the seven tetrominoes stay tellable apart
         once they have gone cold — a board of identical dark blocks would be unplayable. */
      c.save(); rr(c,a,b,w,w,r); c.clip();
      c.globalAlpha=0.22+0.10*(1-heat); c.fillStyle=col; c.fillRect(a,b,w,w*0.45); c.globalAlpha=1; c.restore();
      c.strokeStyle='rgba(255,220,170,'+(0.14+0.5*heat)+')'; c.lineWidth=Math.max(1,cs*0.04);
      rr(c,a,b,w,w,r); c.stroke();
    } },

    ravager:{ name:'Ravager', cost:30000, tier:'collector', cell:function(c,px,py,cs,col,glow){
      var m=Math.max(1,cs*0.02), a=px+m, b=py+m, w=cs-2*m, r=Math.max(2,cs*0.14);
      var t=(Date.now()/4200)%1;
      var gx=Math.round(px/cs), gy=Math.round(py/cs);
      var pulse=0.5+0.5*Math.sin(t*6.283+(gx+gy)*0.5);
      function nb(dx,dy){
        if(!_RVB) return false;
        var X=gx+dx, Y=gy+dy;
        if(X<0||Y<0||Y>=_RVB.g.length||X>=_RVB.w) return false;
        return !!_RVB.g[Y][X];
      }
      var up=nb(0,-1), dn=nb(0,1), lf=nb(-1,0), rt=nb(1,0);
      var sides=[[0,-1,up],[0,1,dn],[-1,0,lf],[1,0,rt]];

      // barbs — silhouette only
      c.save();
      for(var si=0;si<4;si++){
        var d=sides[si]; if(d[2]) continue;
        var n=3, len=cs*0.26*(0.8+0.2*pulse);
        for(var k=0;k<n;k++){
          var f=(k+0.5)/n;
          var cx=a+(d[0]===0? w*f : (d[0]<0?0:w));
          var cy=b+(d[1]===0? w*f : (d[1]<0?0:w));
          var g=c.createLinearGradient(cx,cy,cx+d[0]*len,cy+d[1]*len);
          g.addColorStop(0,col); g.addColorStop(1,'rgba(255,255,255,0)');
          c.fillStyle=g; c.beginPath();
          var ox=d[1]!==0? w*0.13:0, oy=d[0]!==0? w*0.13:0;
          c.moveTo(cx-ox,cy-oy); c.lineTo(cx+d[0]*len,cy+d[1]*len); c.lineTo(cx+ox,cy+oy); c.closePath(); c.fill();
        }
      }
      c.restore();

      // carbon body
      rr(c,a,b,w,w,r);
      var bg=c.createLinearGradient(a,b,a,b+w);
      bg.addColorStop(0,'#1a1d24'); bg.addColorStop(1,'#08090d');
      c.fillStyle=bg; c.fill();

      // magma seams toward joined neighbours
      c.save(); rr(c,a,b,w,w,r); c.clip();
      for(var sj=0;sj<4;sj++){
        var e=sides[sj]; if(!e[2]) continue;
        var sx=a+w/2+e[0]*w/2, sy=b+w/2+e[1]*w/2;
        var rg=c.createRadialGradient(sx,sy,0,sx,sy,w*0.75);
        rg.addColorStop(0,col);
        rg.addColorStop(0.45,'rgba(255,120,0,'+(0.30+0.35*pulse)+')');
        rg.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=rg; c.fillRect(a,b,w,w);
      }
      c.restore();

      c.strokeStyle='rgba(255,255,255,0.13)'; c.lineWidth=Math.max(1,cs*0.035);
      rr(c,a,b,w,w,r); c.stroke();
      if(glow){ c.save(); c.globalCompositeOperation='screen'; c.shadowColor=col; c.shadowBlur=cs*0.55;
        rr(c,a,b,w,w,r); c.fillStyle='rgba(255,255,255,0.06)'; c.fill(); c.restore(); }
    } }
  };
  // ── THE CHOCOLATE COUNTER ──
  // Seven pieces, seven DIFFERENT confections — not seven shades of brown. Each has its own
  // base colour AND its own surface, so you tell them apart by texture as much as by tone:
  //
  //   I  Dark chocolate   smooth moulded bar        J  Rocky road      craggy chunks
  //   Z  Milk + hazelnut  studded with whole nuts   L  Praline         piped wavy ridges
  //   T  Ruby chocolate   marbled swirl             S  Cookie          biscuit + choc chips
  //   O  White chocolate  pearl-dotted
  //
  // Garbage rows are unsweetened baking chocolate: flat, grey and joyless.
  var CHOCO = {
    '#22d3ee': { b:'#3a2214', t:'bar'    },   // I → Dark chocolate
    '#3b82f6': { b:'#5a4636', t:'rocky'  },   // J → Rocky road
    '#ef4444': { b:'#8a5a2e', t:'nuts'   },   // Z → Milk + hazelnuts
    '#f97316': { b:'#b06a2c', t:'waves'  },   // L → Praline ridges
    '#a855f7': { b:'#b1545e', t:'swirl'  },   // T → Ruby, marbled
    '#22c55e': { b:'#c2a06a', t:'chips'  },   // S → Cookie with chips
    '#facc15': { b:'#efe0c0', t:'pearls' },   // O → White chocolate + pearls
    '#5b6b82': { b:'#4a3f38', t:'bar'    }    // garbage → baking chocolate
  };
  function _choc(col){ var e=CHOCO[String(col).toLowerCase()]; return e ? e.b : '#6b4a2f'; }
  function _chocTex(col){ var e=CHOCO[String(col).toLowerCase()]; return e ? e.t : 'bar'; }

  // ── THE SURFACES ────────────────────────────────────────────────────────────
  // Painted onto the plateau (already clipped by the caller). Every pattern is
  // POSITION-INDEPENDENT — derived from the cell's own box, never from where it sits
  // on the board — so a piece doesn't shimmer or crawl as it falls. Fine detail is
  // skipped below ~14px, where it would only turn to mud on the mini boards.
  function _chocSurface(c, x, y, w, base, tex, cs){
    var fine = cs >= 14;

    if(tex === 'nuts'){                                   // whole hazelnuts pressed in
      var nut = ['#7a4a22','#8f5a2c','#6b3f1d'];
      var pos = [[0.30,0.32,0.19],[0.70,0.40,0.16],[0.46,0.72,0.17]];
      for(var i=0;i<pos.length;i++){
        var nx=x+w*pos[i][0], ny=y+w*pos[i][1], nr=w*pos[i][2];
        c.beginPath(); c.arc(nx, ny+nr*0.18, nr, 0, 6.283);       // the shadow it sits in
        c.fillStyle='rgba(0,0,0,.35)'; c.fill();
        var ng=c.createRadialGradient(nx-nr*0.3, ny-nr*0.35, nr*0.1, nx, ny, nr);
        ng.addColorStop(0, _cs2(nut[i%3], 0.42));
        ng.addColorStop(1, _cs2(nut[i%3], -0.22));
        c.beginPath(); c.arc(nx, ny, nr, 0, 6.283); c.fillStyle=ng; c.fill();
        if(fine){                                                  // the nut's little seam
          c.strokeStyle='rgba(0,0,0,.28)'; c.lineWidth=Math.max(.6, w*0.02);
          c.beginPath(); c.moveTo(nx-nr*0.55, ny); c.lineTo(nx+nr*0.55, ny); c.stroke();
        }
      }
      return;
    }

    if(tex === 'waves'){                                  // piped praline ridges
      var n = 4, bw = w/n;
      for(var k=0;k<n;k++){
        var g=c.createLinearGradient(x+k*bw, y, x+(k+1)*bw, y);
        g.addColorStop(0,   _cs2(base, -0.30));
        g.addColorStop(0.42,_cs2(base,  0.30));           // the crest catches the light
        g.addColorStop(1,   _cs2(base, -0.34));
        c.fillStyle=g; c.fillRect(x+k*bw, y, bw+0.6, w);
      }
      if(fine){                                           // scalloped tops, like piped icing
        c.strokeStyle='rgba(255,240,220,.22)'; c.lineWidth=1;
        c.beginPath();
        for(var q=0;q<=n*4;q++){
          var wx = x + (q/(n*4))*w;
          var wy = y + w*0.14 + Math.sin(q*1.6)*w*0.05;
          q ? c.lineTo(wx,wy) : c.moveTo(wx,wy);
        }
        c.stroke();
      }
      return;
    }

    if(tex === 'chips'){                                  // biscuit + chocolate chips
      c.globalAlpha=.20; c.fillStyle='#8a6a3e';           // crumb
      for(var t=0;t<9;t++){
        var bx=x+((t*29)%100)/100*w, by=y+((t*53)%100)/100*w;
        c.fillRect(bx, by, Math.max(1,w*0.05), Math.max(1,w*0.05));
      }
      c.globalAlpha=1;
      var chip=[[0.28,0.30,0.15],[0.68,0.34,0.12],[0.42,0.68,0.13],[0.76,0.72,0.10]];
      for(var j=0;j<chip.length;j++){
        var chx=x+w*chip[j][0], chy=y+w*chip[j][1], chr=w*chip[j][2];
        c.beginPath(); c.arc(chx, chy, chr, 0, 6.283);
        c.fillStyle='#3d2412'; c.fill();                  // dark chip
        if(fine){
          c.beginPath(); c.arc(chx-chr*0.3, chy-chr*0.3, chr*0.34, 0, 6.283);
          c.fillStyle='rgba(255,255,255,.20)'; c.fill();  // its highlight
        }
      }
      return;
    }

    if(tex === 'pearls'){                                 // white chocolate + sugar pearls
      var g2=c.createLinearGradient(x,y,x,y+w);
      g2.addColorStop(0,'#fbf1dc'); g2.addColorStop(1,'#e2cea6');
      c.fillStyle=g2; c.fillRect(x,y,w,w);
      var r3=Math.max(1, w*0.09);
      for(var a=0;a<2;a++) for(var bq=0;bq<2;bq++){
        var pxx=x+w*(0.30+a*0.40), pyy=y+w*(0.30+bq*0.40);
        c.beginPath(); c.arc(pxx, pyy+r3*0.2, r3, 0, 6.283);
        c.fillStyle='rgba(140,110,70,.30)'; c.fill();     // the pearl's shadow
        var pg2=c.createRadialGradient(pxx-r3*0.35, pyy-r3*0.35, r3*0.1, pxx, pyy, r3);
        pg2.addColorStop(0,'#ffffff'); pg2.addColorStop(1,'#d8c39a');
        c.beginPath(); c.arc(pxx, pyy, r3, 0, 6.283); c.fillStyle=pg2; c.fill();
      }
      return;
    }

    if(tex === 'rocky'){                                  // rocky road — craggy chunks
      var chunk=[[0.10,0.12,0.42,0.34],[0.56,0.08,0.36,0.30],[0.06,0.54,0.34,0.38],[0.48,0.50,0.46,0.42]];
      for(var m2=0;m2<chunk.length;m2++){
        var kx=x+w*chunk[m2][0], ky=y+w*chunk[m2][1], kw=w*chunk[m2][2], kh=w*chunk[m2][3];
        c.beginPath();
        c.moveTo(kx, ky+kh*0.3);
        c.lineTo(kx+kw*0.35, ky);
        c.lineTo(kx+kw, ky+kh*0.22);
        c.lineTo(kx+kw*0.78, ky+kh);
        c.lineTo(kx+kw*0.15, ky+kh*0.85);
        c.closePath();
        c.fillStyle = _cs2(base, (m2%2 ? 0.26 : -0.28));  // alternating light/dark rubble
        c.fill();
        if(fine){
          c.strokeStyle='rgba(0,0,0,.30)'; c.lineWidth=0.8; c.stroke();
        }
      }
      return;
    }

    if(tex === 'swirl'){                                  // ruby chocolate, marbled
      c.save();
      c.lineWidth = w*0.16; c.lineCap='round';
      c.strokeStyle = _cs2(base, 0.34);
      c.beginPath();
      c.moveTo(x+w*0.10, y+w*0.72);
      c.bezierCurveTo(x+w*0.34, y+w*0.18, x+w*0.66, y+w*0.86, x+w*0.92, y+w*0.30);
      c.stroke();
      c.strokeStyle = _cs2(base, -0.30); c.lineWidth = w*0.10;
      c.beginPath();
      c.moveTo(x+w*0.06, y+w*0.36);
      c.bezierCurveTo(x+w*0.38, y+w*0.66, x+w*0.60, y+w*0.16, x+w*0.96, y+w*0.60);
      c.stroke();
      c.restore();
      return;
    }

    // 'bar' — a plain moulded slab. Just cocoa speckle so it isn't flat plastic.
    if(fine){
      c.globalAlpha=0.10; c.fillStyle='#000';
      for(var z=0;z<5;z++){
        c.fillRect(x+((z*37)%100)/100*w, y+((z*61)%100)/100*w, 1, 1);
      }
      c.globalAlpha=1;
    }
  }

  // ── tiny colour helpers used by the chocolate design ──
  function _rgb(h){ h=String(h).replace('#',''); if(h.length===3){ h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; }
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]; }
  function _cx(a, b, t){                       // mix a→b by t (0..1)
    var A=_rgb(a), B=_rgb(b);
    return 'rgb('+Math.round(A[0]+(B[0]-A[0])*t)+','+Math.round(A[1]+(B[1]-A[1])*t)+','+Math.round(A[2]+(B[2]-A[2])*t)+')';
  }
  function _cs2(col, amt){                     // lighten (+) / darken (−) an rgb() or hex
    var m = String(col).match(/-?\d+/g);
    var A = m && m.length>=3 ? [ +m[0], +m[1], +m[2] ] : _rgb(col);
    function f(v){ return Math.max(0, Math.min(255, Math.round(amt>0 ? v+(255-v)*amt : v*(1+amt)))); }
    return 'rgb('+f(A[0])+','+f(A[1])+','+f(A[2])+')';
  }
  function _starPath(c,cx,cy,R){ var r=R*0.46; c.beginPath(); for(var i=0;i<10;i++){ var ang=-Math.PI/2+i*Math.PI/5; var rad=(i%2)?r:R; var xx=cx+rad*Math.cos(ang), yy=cy+rad*Math.sin(ang); if(i===0) c.moveTo(xx,yy); else c.lineTo(xx,yy); } c.closePath(); }
  // ── Retired block designs — pulled from the shop and the game entirely. Deleting the keys
  // removes them from the picker (Object.keys(DESIGNS)); anyone who had one equipped safely
  // falls back to Classic via the ||DESIGNS.classic guards below. ──
  /* RETIRED FROM SALE — NOT CONFISCATED.
     These were DELETED from DESIGNS, which took them away from the people who had already paid
     for them: an owner's board fell back to Classic and the design vanished from the Locker.
     JMB014 is equipped on Gem, bought and paid for, and has been playing on Classic ever since.
     They are now flagged instead. The shop skips them, the renderer still knows how to draw
     them, and an owner keeps what they bought. */
  var RETIRED_DESIGNS = ['pixel','glossy','gem','bubble','star','candy','galaxy','ice','marble','gold','aurora'];
  RETIRED_DESIGNS.forEach(function(_k){ try{ if(DESIGNS[_k]) DESIGNS[_k].retired=true; }catch(_e){} });
  /* The board Ravager reads to find its neighbours. Set for the duration of a board pass and
     cleared afterwards, so panels that draw loose pieces (next, hold, shop preview) fall back
     to "no neighbours" — which is the truth for a piece that isn't on the board yet. */
  var _RVB=null;
  /* WHEN each cell was filled — Kiln's whole idea is that a block cools where it lands, so it
     needs a timestamp per cell. Rather than reach into the lock/clear logic (and risk breaking
     scoring for the sake of a skin), this diffs the grid on each board pass: a cell that was
     empty and now isn't gets stamped. A line clear shifts rows down, so some cells restamp and
     flare briefly — which reads as heat from the clear, and is a happy accident rather than a
     bug worth chasing. */
  var _RVB=null, _KILN={ t:{}, prev:null };
  function _kilnScan(g,w){
    try{
      var now=Date.now(), prev=_KILN.prev, cur=[];
      for(var y=0;y<g.length;y++){
        var row=''; 
        for(var x=0;x<w;x++){
          var v=g[y][x]?1:0; row+=v;
          if(v && (!prev || prev[y].charAt(x)!=='1')) _KILN.t[x+','+y]=now;
          if(!v) delete _KILN.t[x+','+y];
        }
        cur.push(row);
      }
      _KILN.prev=cur;
    }catch(e){}
  }
  function _kilnAge(x,y){ var s=_KILN.t[x+','+y]; return s?(Date.now()-s):999999; }
  function _rvbSet(g,w){ _RVB=(g&&g.length)?{g:g,w:w}:null; if(g&&g.length) _kilnScan(g,w); }
  function block(ctx,x,y,cs,color,glow){ (DESIGNS[EQUIPPED]||DESIGNS.classic).cell(ctx,x*cs,y*cs,cs,color,glow); }
  // Same, but drawn in SOMEONE ELSE'S design — used for the opponent board and for
  // spectating, so a player's unlocked skin is visible to everyone watching them.
  function blockAs(ctx,x,y,cs,color,skin,glow){
    (DESIGNS[skin] || DESIGNS.classic).cell(ctx,x*cs,y*cs,cs,color,glow);
  }
  function ghostCell(ctx,x,y,cs,color){ var px=x*cs,py=y*cs,r=Math.max(2,cs*0.17);
    ctx.save(); rr(ctx,px+1.5,py+1.5,cs-3,cs-3,r); ctx.globalAlpha=0.14; ctx.fillStyle=color; ctx.fill();
    ctx.globalAlpha=0.55; ctx.lineWidth=1.5; ctx.strokeStyle=color; ctx.stroke(); ctx.restore(); }
  // Expose the portal's render/sound primitives to the isolated 3v3 module (window._t3api).
  try{ window._t3api={ block:block, blockAs:(typeof blockAs==='function'?blockAs:block), ghost:ghostCell, COLORS:COLORS,
    eid:(typeof eid==='function'?eid:function(){return '';}), ename:(typeof ename==='function'?ename:function(){return 'Player';}),
    ac:(typeof ac==='function'?ac:function(){}), get supa(){ return (typeof supaClient!=='undefined')?supaClient:null; },
    skin:function(){ return (typeof EQUIPPED!=='undefined')?EQUIPPED:'classic'; },
    coins:function(){ try{ if(typeof _tetCos!=='undefined'&&_tetCos&&_tetCos.coins!=null) return Number(_tetCos.coins)||0; if(typeof _tetWallet!=='undefined'&&_tetWallet&&_tetWallet.coins!=null) return Number(_tetWallet.coins)||0; }catch(e){} return 0; },
    refreshWallet:function(){ try{ if(typeof loadWallet==='function') loadWallet(); if(typeof loadCosmetics==='function') loadCosmetics(); }catch(e){} },
    peers:function(){ try{ var meId=String((typeof eid==='function')?eid():''); return Object.keys((typeof presenceNames!=='undefined'&&presenceNames)||{}).filter(function(id){ return String(id)!==meId && (typeof isUserOnline!=='function'||isUserOnline(id)); }).map(function(id){ return { id:String(id), name:((typeof presenceNames!=='undefined'&&presenceNames&&presenceNames[id])||id), photo:((typeof rkPhoto==='function')?rkPhoto(id):'') }; }); }catch(e){ return []; } },
    sfx:function(n,a){ try{ var T={move:sfxMove,rot:sfxRot,lock:sfxLock,drop:sfxDrop,clear:sfxClear,attack:sfxAttack,garbage:sfxGarbage,go:sfxGo,win:sfxWin,lose:sfxLose,tick:sfxTick}; if(T[n]) T[n](a); }catch(e){} } }; }catch(e){}
  function grid(ctx,cv,cs){ ctx.strokeStyle='rgba(150,175,255,.045)'; ctx.lineWidth=1;
    for(var x=0;x<=W;x++){ ctx.beginPath(); ctx.moveTo(x*cs,0); ctx.lineTo(x*cs,cv.height); ctx.stroke(); }
    for(var y=0;y<=H;y++){ ctx.beginPath(); ctx.moveTo(0,y*cs); ctx.lineTo(cv.width,y*cs); ctx.stroke(); } }
  // Static board layer (bg + grid + settled cells) is cached and rebuilt ONLY when the grid
  // actually changes. So the 60fps line-clear particle loop just blits it instead of re-drawing
  // every settled cell (each with gradients + shadow) on every frame — that was the clear-lag.
  var _brdCache=null, _brdKey='', _brdSig=null;
  function _gridSig(){ var h=0; for(var y=0;y<H;y++){ var row=M.grid[y]; for(var x=0;x<W;x++){ h=(h*31 + (row[x]|0))|0; } } return h; }
  function staticBoard(cv){
    var cs=cv.width/W, key=cv.width+'x'+cv.height+'@'+(COS.bg||'classic')+'@'+EQUIPPED, sig=_gridSig();
    if(_brdCache && _brdKey===key && _brdSig===sig) return _brdCache;
    if(!_brdCache || _brdKey!==key){ _brdCache=document.createElement('canvas'); _brdCache.width=cv.width; _brdCache.height=cv.height; _brdKey=key; }
    var bc=_brdCache.getContext('2d');
    bc.clearRect(0,0,cv.width,cv.height); drawBoardBg(bc,cv); grid(bc,cv,cs);
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){ var v=M.grid[y][x]; if(v){ block(bc,x,y,cs, v===8?'#5b6b82':COLORS[v]); } }
    _brdSig=sig; return _brdCache;
  }
  function draw(){ var cv=el('tet-me'); if(!cv||!M) return; if((EQUIPPED==='mossy'||EQUIPPED==='elderwood'||EQUIPPED==='azero'||EQUIPPED==='inferno'||EQUIPPED==='emoji'||EQUIPPED==='prisma'||EQUIPPED==='holo'||EQUIPPED==='abyss'||EQUIPPED==='mirage'||EQUIPPED==='rgbgamer'||EQUIPPED==='matrix'||EQUIPPED==='lavalamp'||EQUIPPED==='kaleido'||EQUIPPED==='ravager'||EQUIPPED==='kintsugi'||EQUIPPED==='kiln'||EQUIPPED==='aquarium'||EQUIPPED==='pilipinas'||EQUIPPED==='nightsuit')&&M.playing){ ensureFx(); } var ctx=cv.getContext('2d'); var cs=cv.width/W;
    ctx.clearRect(0,0,cv.width,cv.height);
    _rvbSet(M.grid, W);                        // neighbour context for silhouette-aware skins
    try{ ctx.drawImage(staticBoard(cv),0,0); }
    catch(_sb){ drawBoardBg(ctx,cv); grid(ctx,cv,cs); for(var yy=0;yy<H;yy++)for(var xx=0;xx<W;xx++){ var vv=M.grid[yy][xx]; if(vv){ block(ctx,xx,yy,cs, vv===8?((M.mode==='overgrow'||M.mode==='snakehunt')?'#3f8a4b':'#5b6b82'):COLORS[vv]); } } }
    if(M.cur){
      var gy=M.cur.y; while(!collide(M.cur.m,M.cur.x,gy+1)) gy++;
      var m=M.cur.m, r, c;
      if(gy>M.cur.y){ for(r=0;r<m.length;r++)for(c=0;c<m[r].length;c++){ if(m[r][c]) ghostCell(ctx,M.cur.x+c,gy+r,cs,COLORS[m[r][c]]); } }
      for(r=0;r<m.length;r++)for(c=0;c<m[r].length;c++){ if(m[r][c]) block(ctx,M.cur.x+c,M.cur.y+r,cs,COLORS[m[r][c]],true); }
    }
    _rvbSet(null,0);                           // falling piece drawn; panels below get no context
    if(M.flash){ var e=(Date.now()-M.flash.t0)/230; if(e<1){ ctx.save(); ctx.globalAlpha=(1-e)*0.9; ctx.fillStyle='#fff'; M.flash.ys.forEach(function(ry){ ctx.fillRect(0,ry*cs,cv.width,cs); }); ctx.restore(); } else { M.flash=null; } }
    // 🐍 SNAKE HUNT — the serpent crosses the board and its body BLINDS you.
    // Warning phase: the golden eye flashes on the entry edge. Crossing phase: a thick
    // opaque band of scaled hide sweeps over the playfield, head leading.
    if(M.mode==='snakehunt' && (M.snk||M.snk2)) try{ [M.snk,M.snk2].forEach(function(K){ if(!K) return; var now2=Date.now();
      var bandY=K.band*cv.height, thick=K.thick*cv.height;
      if(now2<K.t0){ if(K.baby) return;                     // ── the eye-flash warning (big snakes only) ──
        var wx=(K.dir>0? cs*0.7 : cv.width-cs*0.7);
        var blink2=Math.sin(now2/60)>0?1:0.4;
        ctx.save(); ctx.globalAlpha=blink2;
        ctx.fillStyle='#e8c93a'; ctx.beginPath(); ctx.ellipse(wx,bandY,cs*0.5,cs*0.38,0,0,6.283); ctx.fill();
        ctx.fillStyle='#10130a'; ctx.beginPath(); ctx.ellipse(wx,bandY,cs*0.13,cs*0.34,0,0,6.283); ctx.fill();
        ctx.restore();
      } else {                                              // ── the crossing ──
        var pr=Math.min(1,(now2-K.t0)/K.dur);
        var span=cv.width+thick*3.2;
        var headX=(K.dir>0? -thick*1.6+pr*span : cv.width+thick*1.6-pr*span);
        /* PERFORMANCE: the whole serpent — hide, blotches, scale rows, sheen, head — is
           painted ONCE per sweep into an offscreen sprite; each frame is a single
           drawImage with a gentle bob + tilt. The old painter stroked ~300 scale arcs
           per frame — that was the lag. */
        if(!K.sprite){ try{
          var bodyLen=Math.ceil(cv.width+thick*2.6), sprH=Math.ceil(thick*1.7), headL=Math.ceil(thick*1.1);
          var sc2=document.createElement('canvas'); sc2.width=bodyLen+headL; sc2.height=sprH;
          var X=sc2.getContext('2d'), midY=sprH/2;
          function halfW(x){ var dH=Math.abs(x-bodyLen)/(thick*2.2), w2=thick*0.5*Math.min(1,0.35+dH*0.65);
            return w2*Math.min(1,0.15+x/(cv.width*0.55)); }
          X.beginPath(); var st=Math.max(6,sprH*0.2);
          X.moveTo(0,midY);
          for(var x=0;x<=bodyLen;x+=st) X.lineTo(x,midY-halfW(x));
          for(var xb=bodyLen;xb>=0;xb-=st) X.lineTo(xb,midY+halfW(xb));
          X.closePath();
          var bg3=X.createLinearGradient(0,midY-thick*0.5,0,midY+thick*0.5);
          bg3.addColorStop(0,'#778750'); bg3.addColorStop(0.12,'#6e7d49');
          bg3.addColorStop(0.5,'#556339'); bg3.addColorStop(0.85,'#39452a'); bg3.addColorStop(1,'#232c18');
          X.fillStyle=bg3; X.fill();
          X.save(); X.clip();
          for(var bx3=0;bx3<=bodyLen;bx3+=thick*0.72){
            var seedv=Math.abs(Math.sin(bx3*0.13))*0.3;
            X.fillStyle='#242e17';
            X.beginPath(); X.ellipse(bx3,midY-thick*0.14,thick*(0.19+seedv*0.2),thick*(0.13+seedv*0.1),0.15,0,6.283); X.fill();
            X.fillStyle='#4a5630';
            X.beginPath(); X.ellipse(bx3,midY-thick*0.14,thick*0.08,thick*0.05,0.15,0,6.283); X.fill();
            X.fillStyle='#242e17';
            X.beginPath(); X.ellipse(bx3+thick*0.36,midY+thick*0.2,thick*0.12,thick*0.08,-0.2,0,6.283); X.fill(); }
          X.strokeStyle='rgba(20,26,10,.28)'; X.lineWidth=Math.max(.6,cs*0.03);
          var sw3=Math.max(4,cs*0.5);
          for(var ry3=-3;ry3<=3;ry3++){ for(var sx4=((ry3%2)?sw3/2:0);sx4<=bodyLen;sx4+=sw3){
            X.beginPath(); X.arc(sx4,midY+ry3*thick*0.14,sw3*0.42,0.2*Math.PI,0.8*Math.PI); X.stroke(); } }
          X.fillStyle='rgba(230,245,205,.12)';
          X.fillRect(0,midY-thick*0.42,bodyLen,thick*0.14);
          X.restore();
          X.save(); X.translate(bodyLen,midY);
          var hw=thick*0.62, hl=thick*0.95;
          var hg2=X.createLinearGradient(0,-hw*0.5,0,hw*0.5);
          hg2.addColorStop(0,'#6e7d49'); hg2.addColorStop(0.55,'#556339'); hg2.addColorStop(1,'#2c3620');
          X.fillStyle=hg2;
          X.beginPath();
          X.moveTo(-hl*0.35,-hw*0.42);
          X.bezierCurveTo(hl*0.25,-hw*0.52, hl*0.72,-hw*0.34, hl*0.92,-hw*0.06);
          X.bezierCurveTo(hl*0.98,hw*0.06, hl*0.8,hw*0.3, hl*0.5,hw*0.4);
          X.bezierCurveTo(hl*0.1,hw*0.52, -hl*0.3,hw*0.46, -hl*0.35,hw*0.42);
          X.closePath(); X.fill();
          X.strokeStyle='rgba(20,26,10,.5)'; X.lineWidth=Math.max(.8,cs*0.05);
          X.beginPath(); X.moveTo(-hl*0.2,hw*0.18); X.quadraticCurveTo(hl*0.4,hw*0.3,hl*0.86,hw*0.08); X.stroke();
          X.fillStyle='#242e17';
          X.beginPath(); X.ellipse(hl*0.28,-hw*0.3,hl*0.2,hw*0.09,0.25,0,6.283); X.fill();
          X.fillStyle='#c9a03a'; X.beginPath(); X.ellipse(hl*0.3,-hw*0.28,cs*0.22,cs*0.18,0,0,6.283); X.fill();
          X.fillStyle='#10130a'; X.beginPath(); X.ellipse(hl*0.3,-hw*0.28,cs*0.06,cs*0.16,0,0,6.283); X.fill();
          X.fillStyle='rgba(255,255,240,.9)'; X.beginPath(); X.arc(hl*0.27,-hw*0.32,cs*0.05,0,6.283); X.fill();
          X.fillStyle='#1c2410';
          X.beginPath(); X.arc(hl*0.72,-hw*0.16,cs*0.05,0,6.283); X.fill();
          X.beginPath(); X.arc(hl*0.8,-hw*0.08,cs*0.05,0,6.283); X.fill();
          X.restore();
          K.sprite=sc2; K.sprH=sprH; K.bodyLen=bodyLen; K.headL=headL;
        }catch(_spr){ K.sprite='fail'; } }
        if(K.sprite && K.sprite!=='fail'){
          var bob=Math.sin(pr*7)*thick*0.12, tilt=Math.sin(pr*7+1.2)*0.035;
          ctx.save();
          ctx.translate(headX,bandY+bob); ctx.rotate(tilt*K.dir);
          if(K.dir<0) ctx.scale(-1,1);
          ctx.drawImage(K.sprite, -(K.bodyLen), -K.sprH/2);
          var _lastHit=(M.snkHits&&M.snkHits.length)?M.snkHits[M.snkHits.length-1].t0:0;
          if(_lastHit && now2-_lastHit<260){ ctx.globalAlpha=(260-(now2-_lastHit))/260*.35;
            ctx.globalCompositeOperation='source-atop';
            ctx.fillStyle='#e05545'; ctx.fillRect(-(K.bodyLen),-K.sprH/2,K.bodyLen+K.headL,K.sprH);
            ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; }
          if(Math.sin(pr*26)>0.2){ var hl2=thick*0.95;
            ctx.strokeStyle='#c93a3a'; ctx.lineWidth=Math.max(1,cs*0.07); ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(hl2*0.95,0); ctx.quadraticCurveTo(hl2*1.2,-cs*0.05,hl2*1.32,-cs*0.22);
            ctx.moveTo(hl2*0.95,0); ctx.quadraticCurveTo(hl2*1.2,cs*0.08,hl2*1.3,cs*0.16); ctx.stroke(); }
          ctx.restore();
        }
      } }); }catch(_snx){ try{ ctx.restore(); }catch(_r1){} }
    // 🐺 THE WOLF — eye-glint warning, then a fur-dark POUNCE covering a quadrant of the
    // board with a lunging silhouette, glowing eyes and claw slashes. Howls send THE PACK:
    // three lean shapes sprinting across at once. All cheap fills — no per-frame sprites needed.
    if(M.mode==='wolfhunt') try{
      var nwf=Date.now();
      function quadRect(q){ return { x:(q%2)?cv.width/2:0, y:(q>1)?cv.height/2:0, w:cv.width/2, h:cv.height/2 }; }
      if(M.wolf){ var WF=M.wolf, Q=quadRect(WF.quad);
        if(nwf<WF.t0){                                   // ── the glint ──
          var gAl=Math.sin(nwf/50)>0?1:.35;
          ctx.save(); ctx.globalAlpha=gAl;
          var ex4=Q.x+Q.w*0.5, ey4=Q.y+Q.h*0.42;
          [[-1,0],[1,0]].forEach(function(o2){
            ctx.fillStyle='#fde047'; ctx.beginPath();
            ctx.ellipse(ex4+o2[0]*cs*0.55,ey4,cs*0.3,cs*0.16,o2[0]*0.35,0,6.283); ctx.fill();
            ctx.fillStyle='#1a1208'; ctx.beginPath();
            ctx.ellipse(ex4+o2[0]*cs*0.55,ey4,cs*0.09,cs*0.14,0,0,6.283); ctx.fill(); });
          ctx.restore();
        } else if(nwf<WF.t0+WF.dur){                     // ── the pounce ──
          var pp=(nwf-WF.t0)/WF.dur, lunge=Math.sin(Math.min(1,pp*1.4)*Math.PI);
          ctx.save();
          /* ORGANIC SHADOW-MASS — no hard rectangle. A feathered radial dark blob centred on
             the quadrant, ringed with fur spikes, breathing with the lunge. */
          var qcx=Q.x+Q.w*0.5, qcy=Q.y+Q.h*0.5;
          var rX=Q.w*0.72*(0.8+0.2*lunge), rY=Q.h*0.72*(0.8+0.2*lunge);
          ctx.globalAlpha=Math.min(1,lunge*1.5);
          var fg5=ctx.createRadialGradient(qcx,qcy,0,qcx,qcy,Math.max(rX,rY));
          fg5.addColorStop(0,'rgba(16,18,26,.99)'); fg5.addColorStop(.55,'rgba(20,23,32,.96)');
          fg5.addColorStop(.82,'rgba(20,23,32,.6)'); fg5.addColorStop(1,'rgba(20,23,32,0)');
          ctx.save(); ctx.translate(qcx,qcy); ctx.scale(rX/Math.max(rX,rY), rY/Math.max(rX,rY)); ctx.translate(-qcx,-qcy);
          ctx.fillStyle=fg5;
          ctx.fillRect(qcx-Math.max(rX,rY)*1.05,qcy-Math.max(rX,rY)*1.05,Math.max(rX,rY)*2.1,Math.max(rX,rY)*2.1);
          ctx.restore();
          // ragged FUR RIM — triangular tufts bristling around the mass edge
          ctx.fillStyle='rgba(20,23,32,'+(0.85*Math.min(1,lunge*1.5))+')';
          for(var tf2=0;tf2<22;tf2++){ var ta=tf2/22*6.283, tj=((tf2*37)%7)/7;
            var bxT=qcx+Math.cos(ta)*rX*0.86, byT=qcy+Math.sin(ta)*rY*0.86;
            var txT=qcx+Math.cos(ta+0.06)*rX*(1.0+tj*0.14), tyT=qcy+Math.sin(ta+0.06)*rY*(1.0+tj*0.14);
            var pxT=qcx+Math.cos(ta+0.13)*rX*0.84, pyT=qcy+Math.sin(ta+0.13)*rY*0.84;
            ctx.beginPath(); ctx.moveTo(bxT,byT); ctx.lineTo(txT,tyT); ctx.lineTo(pxT,pyT); ctx.closePath(); ctx.fill(); }
          // fur texture — quick strokes inside the mass
          ctx.strokeStyle='rgba(90,96,116,.3)'; ctx.lineWidth=Math.max(1,cs*0.05); ctx.lineCap='round';
          for(var fu=0;fu<10;fu++){ var fa=((fu*73)%100)/100*6.283, fr2=((fu*37)%100)/100*0.7;
            var fx5=qcx+Math.cos(fa)*rX*fr2, fy5=qcy+Math.sin(fa)*rY*fr2;
            ctx.beginPath(); ctx.moveTo(fx5,fy5); ctx.lineTo(fx5+cs*0.6,fy5+cs*0.25); ctx.stroke(); }
          // the head silhouette lunging in from the quadrant's outer corner
          var hx5=Q.x+Q.w*0.5, hy5=Q.y+Q.h*(0.3+0.14*lunge), hs=Math.min(Q.w,Q.h)*0.42*(0.7+0.3*lunge);
          ctx.fillStyle='#12141c';
          ctx.beginPath();
          ctx.moveTo(hx5-hs*0.55,hy5-hs*0.5);            // left ear
          ctx.lineTo(hx5-hs*0.32,hy5-hs*0.05);
          ctx.lineTo(hx5-hs*0.5,hy5+hs*0.28);
          ctx.lineTo(hx5,hy5+hs*0.62);                   // muzzle tip
          ctx.lineTo(hx5+hs*0.5,hy5+hs*0.28);
          ctx.lineTo(hx5+hs*0.32,hy5-hs*0.05);
          ctx.lineTo(hx5+hs*0.55,hy5-hs*0.5);            // right ear
          ctx.lineTo(hx5+hs*0.22,hy5-hs*0.26);
          ctx.lineTo(hx5-hs*0.22,hy5-hs*0.26);
          ctx.closePath(); ctx.fill();
          // burning eyes + fangs
          [[-1,0],[1,0]].forEach(function(o3){
            ctx.fillStyle='#fde047'; ctx.shadowColor='#fde047'; ctx.shadowBlur=10;
            ctx.beginPath(); ctx.ellipse(hx5+o3[0]*hs*0.2,hy5-hs*0.02,hs*0.09,hs*0.055,o3[0]*0.3,0,6.283); ctx.fill();
            ctx.shadowBlur=0; ctx.fillStyle='#12141c';
            ctx.beginPath(); ctx.ellipse(hx5+o3[0]*hs*0.2,hy5-hs*0.02,hs*0.028,hs*0.05,0,0,6.283); ctx.fill(); });
          ctx.fillStyle='#e8e4da';
          ctx.beginPath(); ctx.moveTo(hx5-hs*0.12,hy5+hs*0.42); ctx.lineTo(hx5-hs*0.07,hy5+hs*0.56); ctx.lineTo(hx5-hs*0.02,hy5+hs*0.42); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(hx5+hs*0.12,hy5+hs*0.42); ctx.lineTo(hx5+hs*0.07,hy5+hs*0.56); ctx.lineTo(hx5+hs*0.02,hy5+hs*0.42); ctx.closePath(); ctx.fill();
          // claw slashes — gradient strokes that fade at both ends (no hard tips)
          for(var cl2=0;cl2<3;cl2++){ var cx5=qcx-rX*0.35+cl2*rX*0.18+lunge*rX*0.24;
            var cgr=ctx.createLinearGradient(cx5,qcy-rY*0.6,cx5+rX*0.24,qcy+rY*0.6);
            cgr.addColorStop(0,'rgba(220,225,235,0)'); cgr.addColorStop(.5,'rgba(220,225,235,.55)'); cgr.addColorStop(1,'rgba(220,225,235,0)');
            ctx.strokeStyle=cgr; ctx.lineWidth=Math.max(1.5,cs*0.09); ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(cx5,qcy-rY*0.6); ctx.lineTo(cx5+rX*0.24,qcy+rY*0.6); ctx.stroke(); }
          ctx.restore();
        } }
      if(M.pack){ var PK=M.pack, pp2=(nwf-PK.t0)/PK.dur;
        if(pp2>0&&pp2<1){ ctx.save();
          PK.rows.forEach(function(rf,ri2){
            var py5=rf*cv.height, ph5=cv.height*0.085;
            var px5=(PK.dirs[ri2]>0? -cv.width*0.35+pp2*cv.width*1.7 : cv.width*1.35-pp2*cv.width*1.7);
            // a soft speed-blurred body: radial ellipse, dense at the head, trailing to nothing
            var grd=ctx.createRadialGradient(px5,py5,0,px5,py5,cv.width*0.26);
            grd.addColorStop(0,'rgba(18,20,28,.96)'); grd.addColorStop(.4,'rgba(18,20,28,.75)'); grd.addColorStop(1,'rgba(18,20,28,0)');
            ctx.save(); ctx.translate(px5,py5); ctx.scale(1,ph5/(cv.width*0.26)); ctx.translate(-px5,-py5);
            ctx.fillStyle=grd; ctx.fillRect(px5-cv.width*0.3,py5-cv.width*0.3,cv.width*0.6,cv.width*0.6);
            ctx.restore();
            // motion streaks behind it
            ctx.strokeStyle='rgba(60,66,84,.4)'; ctx.lineWidth=Math.max(1,cs*0.06); ctx.lineCap='round';
            for(var mk2=0;mk2<3;mk2++){ var sy5=py5+(mk2-1)*ph5*0.3;
              ctx.beginPath(); ctx.moveTo(px5-PK.dirs[ri2]*cv.width*0.08,sy5);
              ctx.lineTo(px5-PK.dirs[ri2]*cv.width*0.24,sy5); ctx.stroke(); }
            ctx.fillStyle='#fde047'; ctx.shadowColor='#fde047'; ctx.shadowBlur=8;
            ctx.beginPath(); ctx.arc(px5+cv.width*0.05*PK.dirs[ri2],py5-ph5*0.14,cs*0.08,0,6.283); ctx.fill();
            ctx.beginPath(); ctx.arc(px5+cv.width*0.05*PK.dirs[ri2],py5+ph5*0.16,cs*0.08,0,6.283); ctx.fill();
            ctx.shadowBlur=0;
          });
          ctx.restore(); } }
    }catch(_wdr){ try{ ctx.restore(); }catch(_r2){} }
    // ═══ 🐉 THE DRAGON — the finale, painted ═══
    //  She wheels across the sky on beating wings: serpentine emerald body, horned head,
    //  ember eyes. Inhale glow → a torrent of FIRE sweeps the columns. After the breath her
    //  golden underbelly pulses — the strike window. Scorches burst where blocks burn. Below
    //  35% the sky itself rains embers.
    if(M.mode==='dragonhunt') try{
      var nd=Date.now(), belly=(M.drgBelly>nd), breathing=(M.breath&&nd>M.breath.t0&&nd<M.breath.t0+M.breath.dur);
      var inhale=(M.breath&&nd<M.breath.t0);
      var enrD=(!M.snkDead&&M.snkHP<=35);
      // burning-sky ambience
      if(!M.snkDead){ ctx.save(); ctx.globalAlpha=enrD?0.16:0.08;
        var sk=ctx.createLinearGradient(0,0,0,cv.height*0.5);
        sk.addColorStop(0,'rgba(249,115,22,.85)'); sk.addColorStop(1,'rgba(120,40,10,0)');
        ctx.fillStyle=sk; ctx.fillRect(0,0,cv.width,cv.height*0.5); ctx.restore();
        if(enrD){ ctx.save();                                        // ember rain
          for(var er=0;er<10;er++){ var ex9=((er*97+nd/14)% (cv.width+20))-10, ey9=((er*61+nd/9)%(cv.height+20))-10;
            ctx.globalAlpha=0.4+0.3*Math.sin(nd/120+er);
            ctx.fillStyle=er%2?'#fb923c':'#fde047';
            ctx.beginPath(); ctx.arc(ex9,ey9,cs*0.07,0,6.283); ctx.fill(); }
          ctx.restore(); } }
      // THE DRAGON
      if(!M.snkDead && M.drg){ var dx9=M.drg.x*cv.width, dy9=cv.height*0.1+Math.sin(nd/600)*cs*0.4;
        var dsc=cs*0.2, fdir=(M.breath?M.breath.dir:M.drg.dir);
        ctx.save(); ctx.translate(dx9,dy9); if(fdir<0) ctx.scale(-1,1);
        var flap=Math.sin(nd/(breathing?90:160));
        // WINGS — great membranes beating
        [[-1,0],[1,0]].forEach(function(wv){ if(wv[0]===1&&true){} });
        ctx.fillStyle='rgba(20,60,35,.92)';
        ctx.beginPath();                                              // far wing
        ctx.moveTo(-dsc*1.5,0);
        ctx.quadraticCurveTo(-dsc*5,-dsc*(5+flap*3), -dsc*8,-dsc*(2.5+flap*4));
        ctx.quadraticCurveTo(-dsc*6.4,-dsc*(0.5+flap*1.4), -dsc*5,dsc*(0.5-flap));
        ctx.quadraticCurveTo(-dsc*3.4,dsc*0.8, -dsc*1.5,dsc*0.5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(10,35,20,.9)'; ctx.lineWidth=Math.max(1,dsc*0.16);
        for(var wb=1;wb<=3;wb++){ ctx.beginPath(); ctx.moveTo(-dsc*1.6,0);
          ctx.lineTo(-dsc*(3+wb*1.6),-dsc*(1+flap*3)*wb*0.45); ctx.stroke(); }
        // BODY — serpentine emerald, plated golden belly
        var bgr=ctx.createLinearGradient(0,-dsc*1.4,0,dsc*1.6);
        bgr.addColorStop(0,'#2e7a44'); bgr.addColorStop(.55,'#175031'); bgr.addColorStop(1,'#0a2413');
        ctx.fillStyle=bgr;
        ctx.beginPath();
        ctx.moveTo(-dsc*7,dsc*0.2);                                    // tail root
        ctx.quadraticCurveTo(-dsc*4,-dsc*1.6,-dsc*1,-dsc*1.2);
        ctx.quadraticCurveTo(dsc*1.6,-dsc*1,dsc*3,-dsc*0.4);           // toward the head
        ctx.quadraticCurveTo(dsc*2.4,dsc*1.1,-dsc*0.5,dsc*1.3);
        ctx.quadraticCurveTo(-dsc*4.4,dsc*1.5,-dsc*7,dsc*0.2);
        ctx.closePath(); ctx.fill();
        // tail whip
        ctx.strokeStyle='#175031'; ctx.lineWidth=dsc*0.8; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(-dsc*7,dsc*0.2);
        ctx.quadraticCurveTo(-dsc*9.4,dsc*(0.4+Math.sin(nd/300)*0.8),-dsc*11,-dsc*(0.4-Math.sin(nd/300)*0.6)); ctx.stroke();
        ctx.strokeStyle='#0f3a20'; ctx.lineWidth=dsc*0.3;
        ctx.beginPath(); ctx.moveTo(-dsc*11,-dsc*(0.4-Math.sin(nd/300)*0.6));
        ctx.lineTo(-dsc*12,-dsc*(0.9-Math.sin(nd/300)*0.6)); ctx.stroke();
        // golden underbelly — PULSES during the strike window
        var bglow=belly?(0.7+0.3*Math.sin(nd/110)):0.35;
        ctx.fillStyle='rgba(232,185,58,'+bglow+')';
        if(belly){ ctx.shadowColor='#fde047'; ctx.shadowBlur=18; }
        ctx.beginPath();
        ctx.moveTo(-dsc*4.4,dsc*1.15); ctx.quadraticCurveTo(-dsc*1,dsc*1.75,dsc*2.2,dsc*0.85);
        ctx.quadraticCurveTo(-dsc*1,dsc*1.15,-dsc*4.4,dsc*1.15); ctx.closePath(); ctx.fill();
        ctx.shadowBlur=0;
        // dorsal spines
        ctx.fillStyle='#0f3a20';
        for(var sp9=0;sp9<5;sp9++){ var sxx=-dsc*(5.4-sp9*1.3), syy=-dsc*(0.8+Math.sin(sp9)*0.3);
          ctx.beginPath(); ctx.moveTo(sxx,syy); ctx.lineTo(sxx+dsc*0.5,syy-dsc*0.9); ctx.lineTo(sxx+dsc*0.9,syy); ctx.closePath(); ctx.fill(); }
        // HEAD — horned, ember-eyed
        ctx.fillStyle='#2e7a44';
        ctx.beginPath();
        ctx.moveTo(dsc*2.6,-dsc*0.9);
        ctx.quadraticCurveTo(dsc*4.4,-dsc*1.2,dsc*5.4,-dsc*0.3);       // snout top
        ctx.lineTo(dsc*5.7,dsc*0.15);                                  // snout tip
        ctx.quadraticCurveTo(dsc*4.4,dsc*0.7,dsc*3,dsc*0.6);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle='#0f3a20'; ctx.lineWidth=Math.max(1,dsc*0.14);
        ctx.beginPath(); ctx.moveTo(dsc*3.2,dsc*0.35); ctx.lineTo(dsc*5.5,dsc*0.05); ctx.stroke();   // jaw
        ctx.fillStyle='#e8e0d0';                                       // horns
        ctx.beginPath(); ctx.moveTo(dsc*3,-dsc*1); ctx.lineTo(dsc*2.4,-dsc*2); ctx.lineTo(dsc*3.5,-dsc*1.1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(dsc*3.7,-dsc*0.95); ctx.lineTo(dsc*3.4,-dsc*1.7); ctx.lineTo(dsc*4.2,-dsc*1); ctx.closePath(); ctx.fill();
        var eg9=inhale?(0.8+0.2*Math.sin(nd/60)):0.9;                  // ember eye — flares on the inhale
        ctx.fillStyle='rgba(251,146,60,'+eg9+')'; ctx.shadowColor='#fb923c'; ctx.shadowBlur=inhale?14:6;
        ctx.beginPath(); ctx.ellipse(dsc*3.9,-dsc*0.55,dsc*0.32,dsc*0.2,0,0,6.283); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#160b04';
        ctx.beginPath(); ctx.ellipse(dsc*3.95,-dsc*0.55,dsc*0.09,dsc*0.18,0,0,6.283); ctx.fill();
        // inhale: fire gathering in the open jaws
        if(inhale){ var ig9=(nd-(M.breath.t0-700))/700;
          ctx.fillStyle='rgba(253,224,71,'+(0.5*ig9)+')'; ctx.shadowColor='#fde047'; ctx.shadowBlur=20*ig9;
          ctx.beginPath(); ctx.arc(dsc*5.2,dsc*0.05,dsc*0.7*ig9,0,6.283); ctx.fill(); ctx.shadowBlur=0; }
        // near wing (in front of the body)
        ctx.fillStyle='rgba(46,122,68,.95)';
        ctx.beginPath();
        ctx.moveTo(-dsc*0.5,0);
        ctx.quadraticCurveTo(-dsc*3.4,-dsc*(4.4+flap*3.4), -dsc*6.4,-dsc*(1.8+flap*4.2));
        ctx.quadraticCurveTo(-dsc*5,-dsc*(0.2+flap*1.2), -dsc*3.6,dsc*(0.7-flap*0.8));
        ctx.quadraticCurveTo(-dsc*2,dsc*1, -dsc*0.5,dsc*0.6);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(15,58,32,.9)'; ctx.lineWidth=Math.max(1,dsc*0.14);
        for(var wb2=1;wb2<=3;wb2++){ ctx.beginPath(); ctx.moveTo(-dsc*0.6,0);
          ctx.lineTo(-dsc*(2.4+wb2*1.3),-dsc*(0.8+flap*3.2)*wb2*0.5); ctx.stroke(); }
        ctx.restore();
        // ── FIREBREATH — a torrent from her jaws to the burning column ──
        if(breathing){ var bp9=(nd-M.breath.t0)/M.breath.dur;
          var col9=Math.min(W-1, Math.floor((M.breath.dir>0? bp9 : 1-bp9)*W));
          var fx9=col9*cs+cs/2, mouthX=dx9+fdir*dsc*5.4, mouthY=dy9+dsc*0.05;
          ctx.save(); ctx.globalCompositeOperation='lighter';
          var seg9=8;
          for(var fs9=0;fs9<seg9;fs9++){ var ft9=fs9/(seg9-1);
            var px9=mouthX+(fx9-mouthX)*ft9+Math.sin(nd/60+fs9*2)*cs*0.3*ft9;
            var py9=mouthY+(cv.height-mouthY)*ft9*ft9*0.96;
            var fr9=cs*(0.35+ft9*0.85)*(0.85+0.15*Math.sin(nd/50+fs9));
            var fg9=ctx.createRadialGradient(px9,py9,0,px9,py9,fr9);
            fg9.addColorStop(0,'rgba(255,246,200,.95)'); fg9.addColorStop(.4,'rgba(251,146,60,.75)'); fg9.addColorStop(1,'rgba(200,60,10,0)');
            ctx.fillStyle=fg9; ctx.fillRect(px9-fr9,py9-fr9,fr9*2,fr9*2); }
          ctx.restore(); }
      }
      // scorch bursts where blocks burned to ember
      if(M.scorchFx&&M.scorchFx.length){ for(var sc9=M.scorchFx.length-1;sc9>=0;sc9--){ var SF=M.scorchFx[sc9], sa9=(nd-SF.t0)/550;
          if(sa9>=1){ M.scorchFx.splice(sc9,1); continue; }
          var bx9=SF.x*cs+cs/2, by9=SF.y*cs+cs/2;
          ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=(1-sa9);
          var sg9=ctx.createRadialGradient(bx9,by9,0,bx9,by9,cs*(0.6+sa9*1.2));
          sg9.addColorStop(0,'rgba(253,224,71,.9)'); sg9.addColorStop(.5,'rgba(251,146,60,.5)'); sg9.addColorStop(1,'rgba(200,60,10,0)');
          ctx.fillStyle=sg9; ctx.fillRect(bx9-cs*2,by9-cs*2,cs*4,cs*4);
          for(var em9=0;em9<5;em9++){ var ea9=em9/5*6.283;
            ctx.fillStyle='#fde047';
            ctx.beginPath(); ctx.arc(bx9+Math.cos(ea9)*cs*1.4*sa9, by9+Math.sin(ea9)*cs*1.4*sa9-sa9*sa9*cs, cs*0.08*(1-sa9),0,6.283); ctx.fill(); }
          ctx.restore(); } }
      // belly-window banner
      if(belly && !M.snkDead){ ctx.save();
        ctx.globalAlpha=0.75+0.25*Math.sin(nd/120);
        ctx.font='900 '+(cs*0.66)+'px Sora,Inter,sans-serif'; ctx.textAlign='center';
        ctx.fillStyle='#fde047'; ctx.shadowColor='#e8b93a'; ctx.shadowBlur=14;
        ctx.fillText('⚔ STRIKE THE BELLY — ×2.5 ⚔', cv.width/2, cs*3.4);
        ctx.restore(); }
    }catch(_dgd){ try{ ctx.restore(); }catch(_r5){} }
    // ═══ 🧙 THE WIZARD — the arcane duel, painted ═══
    //  A hooded figure floats above the stack, teleporting in a swirl of motes between casts.
    //  Runes burn violet on cursed cells with a fuse ring. His mana shield is a humming hex
    //  bubble; shattered, he sprawls with stars. Polymorph flashes the falling piece.
    if(M.mode==='wizardhunt') try{
      var nz=Date.now(), stunned=(M.wizStun>nz), shielded=(M.wizShield&&nz<M.wizShield.until);
      // ── ENTRANCE: a vortex tears open and the duelist assembles from motes ──
      var intro=M.wizIntro?Math.min(1,(nz-M.wizIntro)/2400):1;
      if(intro<1){ ctx.save();
        ctx.fillStyle='rgba(8,2,18,'+(0.7*(1-intro))+')'; ctx.fillRect(0,0,cv.width,cv.height);
        var vx=cv.width/2, vy=cv.height*0.3;
        for(var vr7=0;vr7<3;vr7++){ ctx.strokeStyle='rgba(168,85,247,'+(0.8*(1-intro))+')';
          ctx.lineWidth=Math.max(2,cs*0.12*(1-intro));
          ctx.beginPath(); ctx.arc(vx,vy,(cs*6*(1-intro))+vr7*cs*1.4, nz/300+vr7, nz/300+vr7+4.2); ctx.stroke(); }
        for(var vm7=0;vm7<16;vm7++){ var va7=vm7/16*6.283+nz/400;
          ctx.fillStyle='rgba(196,181,253,'+(0.85*(1-intro))+')';
          ctx.beginPath(); ctx.arc(vx+Math.cos(va7)*cs*7*(1-intro), vy+Math.sin(va7)*cs*5*(1-intro), cs*0.12,0,6.283); ctx.fill(); }
        var ti7=Math.max(0,Math.min(1,(intro-0.25)/0.4))*Math.max(0,Math.min(1,(0.95-intro)/0.2));
        if(ti7>0){ ctx.globalAlpha=ti7; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.shadowColor='#a855f7'; ctx.shadowBlur=26;
          ctx.fillStyle='#ede9fe'; ctx.font='900 '+(cs*1.7)+'px Sora,Inter,serif';
          ctx.fillText('THE WIZARD', vx, cv.height*0.52);
          ctx.shadowBlur=0; ctx.font='800 '+(cs*0.6)+'px Sora,Inter,sans-serif'; ctx.fillStyle='#c4b5fd';
          ctx.fillText('— BEAST LEVEL 4 —', vx, cv.height*0.52+cs*1.5); }
        ctx.restore(); }
      // ambient arcane haze
      if(!M.snkDead){ ctx.save(); ctx.globalAlpha=0.08+0.04*Math.sin(nz/900);
        var az2=ctx.createRadialGradient(cv.width/2,cv.height*0.3,0,cv.width/2,cv.height*0.3,cv.width*0.8);
        az2.addColorStop(0,'rgba(168,85,247,.5)'); az2.addColorStop(1,'rgba(88,28,135,0)');
        ctx.fillStyle=az2; ctx.fillRect(0,0,cv.width,cv.height); ctx.restore(); }
      // ── ARCANE FIELD — faint rune constellations drifting behind the duel ──
      if(!M.snkDead){ ctx.save(); ctx.globalAlpha=0.10;
        ctx.fillStyle='#c4b5fd'; ctx.textAlign='center'; ctx.textBaseline='middle';
        for(var gf7=0;gf7<12;gf7++){ var gseed=gf7*137;
          var gxx=((gseed%97)/97*cv.width + nz/(160+gf7*14)) % (cv.width+40) - 20;
          var gyy=((gseed*7%89)/89*cv.height + Math.sin(nz/2200+gf7)*14);
          ctx.font='700 '+(cs*(0.4+((gseed%5)/10)))+'px serif';
          ctx.save(); ctx.translate(gxx,gyy); ctx.rotate(Math.sin(nz/3000+gf7)*0.4);
          ctx.fillText(['ᚠ','ᛟ','ᚹ','ᚱ','ᛉ','ᛗ','ᛞ'][gf7%7],0,0); ctx.restore(); }
        ctx.restore(); }
      // ── HEX TRAIL — the falling piece smears violet after-images while time is warped ──
      if(M.hexUntil>nz && M.cur){ ctx.save(); ctx.globalCompositeOperation='lighter';
        for(var ht7=1;ht7<=3;ht7++){ ctx.globalAlpha=0.22-ht7*0.055;
          for(var hr7=0;hr7<M.cur.m.length;hr7++)for(var hc7=0;hc7<M.cur.m[hr7].length;hc7++){ if(!M.cur.m[hr7][hc7]) continue;
            ctx.fillStyle='#a855f7';
            ctx.fillRect((M.cur.x+hc7)*cs+2,(M.cur.y+hr7-ht7)*cs+2,cs-4,cs-4); } }
        ctx.restore(); }
      // ── RUNE DETONATION BURSTS — violet explosions where curses land ──
      if(M.runeBursts&&M.runeBursts.length){ for(var rb7=M.runeBursts.length-1;rb7>=0;rb7--){ var RB=M.runeBursts[rb7], ba7=(nz-RB.t0)/650;
          if(ba7>=1){ M.runeBursts.splice(rb7,1); continue; }
          var bx8=RB.x*cs+cs/2, by8=RB.y*cs+cs/2;
          ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=(1-ba7);
          ctx.strokeStyle='#f0abfc'; ctx.lineWidth=Math.max(1.5,cs*0.14*(1-ba7));
          ctx.beginPath(); ctx.arc(bx8,by8,cs*2.2*ba7,0,6.283); ctx.stroke();
          for(var sp7=0;sp7<8;sp7++){ var spa=sp7/8*6.283;
            ctx.fillStyle='#c4b5fd';
            ctx.beginPath(); ctx.arc(bx8+Math.cos(spa)*cs*2.4*ba7, by8+Math.sin(spa)*cs*2.4*ba7, cs*0.11*(1-ba7),0,6.283); ctx.fill(); }
          ctx.restore(); } }
      // ── SHIELD SHATTER — glass fragments exploding off the broken bubble ──
      if(M.wizShatter){ var sh7=(nz-M.wizShatter.t0)/750;
        if(sh7>=1){ M.wizShatter=null; }
        else { var swx=M.wizShatter.x*cv.width, swy=M.wizShatter.y*cv.height;
          ctx.save(); ctx.globalAlpha=(1-sh7);
          for(var fg7=0;fg7<14;fg7++){ var fa7=fg7/14*6.283, fd7=cs*2+sh7*cs*7;
            var fx8=swx+Math.cos(fa7)*fd7, fy8=swy+Math.sin(fa7)*fd7+sh7*sh7*cs*3;
            ctx.save(); ctx.translate(fx8,fy8); ctx.rotate(fa7+sh7*6);
            var fs7=cs*(0.3+((fg7*7)%4)/10);
            var fgr=ctx.createLinearGradient(0,-fs7,0,fs7);
            fgr.addColorStop(0,'rgba(240,171,252,.95)'); fgr.addColorStop(1,'rgba(124,58,237,.3)');
            ctx.fillStyle=fgr;
            ctx.beginPath(); ctx.moveTo(0,-fs7); ctx.lineTo(fs7*0.55,0); ctx.lineTo(0,fs7*0.7); ctx.lineTo(-fs7*0.45,0); ctx.closePath(); ctx.fill();
            ctx.restore(); }
          ctx.restore(); } }
      // ── SPELL BOLTS — comets arcing from the staff orb to their targets ──
      if(M.wizBolts&&M.wizBolts.length){ var wxS=M.wizPos.x*cv.width, wyS=M.wizPos.y*cv.height;
        for(var bl7=M.wizBolts.length-1;bl7>=0;bl7--){ var B7=M.wizBolts[bl7], bp7=(nz-B7.t0)/480;
          if(bp7>=1){ M.wizBolts.splice(bl7,1); continue; } if(bp7<0) continue;
          var tx7=B7.tx*cv.width, ty7=B7.ty*cv.height, mx7=(wxS+tx7)/2+cs*2, my7=Math.min(wyS,ty7)-cs*2.5;
          ctx.save(); ctx.globalCompositeOperation='lighter';
          for(var tr7=0;tr7<6;tr7++){ var tp7=Math.max(0,bp7-tr7*0.05), u7=1-tp7;
            var bx7=u7*u7*wxS+2*u7*tp7*mx7+tp7*tp7*tx7, by7=u7*u7*wyS+2*u7*tp7*my7+tp7*tp7*ty7;
            ctx.globalAlpha=(1-tr7/6)*0.9;
            ctx.fillStyle=B7.col;
            ctx.beginPath(); ctx.arc(bx7,by7,cs*(0.26-tr7*0.035),0,6.283); ctx.fill(); }
          ctx.restore(); } }
      // THE WIZARD himself
      if(!M.snkDead){ var wx=M.wizPos.x*cv.width, wy=M.wizPos.y*cv.height+Math.sin(nz/500)*cs*0.3;
        var blinkA=Math.min(1,(nz-(M.wizPos.blink||0))/350);              // teleport fade-in
        ctx.save(); ctx.globalAlpha=blinkA*(stunned?0.9:1);
        if(blinkA<1){ for(var mo5=0;mo5<8;mo5++){ var ma5=mo5/8*6.283+nz/200;
          ctx.fillStyle='rgba(196,181,253,'+(0.7*(1-blinkA))+')';
          ctx.beginPath(); ctx.arc(wx+Math.cos(ma5)*cs*2*(1-blinkA+0.3), wy+Math.sin(ma5)*cs*2*(1-blinkA+0.3), cs*0.1,0,6.283); ctx.fill(); } }
        var hsc=cs*0.16;
        // SUMMONING CIRCLE — twin counter-rotating rune rings beneath him
        if(!stunned){ ctx.save(); ctx.translate(wx,wy+hsc*10); ctx.scale(1,0.32);
          ctx.strokeStyle='rgba(168,85,247,.5)'; ctx.lineWidth=Math.max(1.5,hsc*0.4);
          ctx.beginPath(); ctx.arc(0,0,hsc*8,0,6.283); ctx.stroke();
          ctx.strokeStyle='rgba(240,171,252,.35)'; ctx.lineWidth=Math.max(1,hsc*0.25);
          ctx.beginPath(); ctx.arc(0,0,hsc*6,0,6.283); ctx.stroke();
          ctx.fillStyle='rgba(196,181,253,.8)'; ctx.font='700 '+(hsc*2.4)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          for(var rg7=0;rg7<6;rg7++){ var rga=rg7/6*6.283+nz/1600;
            ctx.save(); ctx.translate(Math.cos(rga)*hsc*8,Math.sin(rga)*hsc*8); ctx.scale(1,3.1); ctx.rotate(rga+1.57);
            ctx.fillText(['ᚠ','ᛟ','ᚹ','ᚱ','ᛉ','ᛗ'][rg7],0,0); ctx.restore(); }
          ctx.restore(); }
        ctx.translate(wx,wy); if(stunned) ctx.rotate(0.6);
        // robe — hooded, trailing to wisps
        var rg2=ctx.createLinearGradient(0,-hsc*8,0,hsc*9);
        rg2.addColorStop(0,'#4c1d95'); rg2.addColorStop(.55,'#2e1065'); rg2.addColorStop(1,'rgba(30,10,60,0)');
        ctx.fillStyle=rg2;
        ctx.beginPath();
        ctx.moveTo(0,-hsc*8);
        ctx.quadraticCurveTo(-hsc*5,-hsc*5,-hsc*4.4,hsc*2);
        ctx.quadraticCurveTo(-hsc*3,hsc*6,-hsc*1.5,hsc*9);
        ctx.quadraticCurveTo(0,hsc*7,hsc*1.5,hsc*9);
        ctx.quadraticCurveTo(hsc*3,hsc*6,hsc*4.4,hsc*2);
        ctx.quadraticCurveTo(hsc*5,-hsc*5,0,-hsc*8);
        ctx.closePath(); ctx.fill();
        // the hood's void + burning eyes
        ctx.fillStyle='#0c0518';
        ctx.beginPath(); ctx.ellipse(0,-hsc*5,hsc*2.4,hsc*2.8,0,0,6.283); ctx.fill();
        if(!stunned){ var eb=((nz/3000)%1)>0.93?0.15:1;
          ctx.fillStyle='#c4b5fd'; ctx.shadowColor='#a855f7'; ctx.shadowBlur=8;
          ctx.save(); ctx.scale(1,eb);
          ctx.beginPath(); ctx.ellipse(-hsc*0.8,-hsc*5,hsc*0.42,hsc*0.24,0,0,6.283); ctx.fill();
          ctx.beginPath(); ctx.ellipse(hsc*0.8,-hsc*5,hsc*0.42,hsc*0.24,0,0,6.283); ctx.fill();
          ctx.restore(); ctx.shadowBlur=0; }
        else { ctx.strokeStyle='#c4b5fd'; ctx.lineWidth=2;                    // X-eyes when stunned
          [[-hsc*0.8,0],[hsc*0.8,0]].forEach(function(ee){
            ctx.beginPath(); ctx.moveTo(ee[0]-hsc*0.3,-hsc*5.3); ctx.lineTo(ee[0]+hsc*0.3,-hsc*4.7);
            ctx.moveTo(ee[0]+hsc*0.3,-hsc*5.3); ctx.lineTo(ee[0]-hsc*0.3,-hsc*4.7); ctx.stroke(); }); }
        // sleeves + skeletal hands
        ctx.fillStyle='#3b0f7e';
        ctx.beginPath(); ctx.moveTo(-hsc*1.2,-hsc*2.5); ctx.quadraticCurveTo(-hsc*4.6,-hsc*2,-hsc*5.2,hsc*0.5);
        ctx.quadraticCurveTo(-hsc*4,-hsc*0.2,-hsc*2.4,hsc*0.2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hsc*1.2,-hsc*2.5); ctx.quadraticCurveTo(hsc*3.6,-hsc*3.4,hsc*4.2,-hsc*4.6);
        ctx.quadraticCurveTo(hsc*3.2,-hsc*2.6,hsc*2,hsc*0.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#d8cfe8';
        ctx.beginPath(); ctx.arc(-hsc*5.1,hsc*0.4,hsc*0.5,0,6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(hsc*4.2,-hsc*4.7,hsc*0.5,0,6.283); ctx.fill();
        // gold trim on the robe hem
        ctx.strokeStyle='rgba(232,185,58,.55)'; ctx.lineWidth=Math.max(1,hsc*0.24);
        ctx.beginPath(); ctx.moveTo(-hsc*4,hsc*3.2); ctx.quadraticCurveTo(0,hsc*4.6,hsc*4,hsc*3.2); ctx.stroke();
        // staff + orb (the orb charges as his next cast approaches; dropped when stunned)
        var chg=Math.max(0,Math.min(1,1-((M._wcNext-nz)/3000)));
        ctx.save(); if(stunned){ ctx.rotate(1.1); ctx.translate(hsc*2,hsc*4); }
        else if(M._wcLast && nz-M._wcLast<420){ ctx.rotate(-0.38*Math.sin((nz-M._wcLast)/420*Math.PI)); }
        ctx.strokeStyle='#6d28d9'; ctx.lineWidth=Math.max(2,hsc*0.4); ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(hsc*3.4,hsc*3); ctx.lineTo(hsc*4.6,-hsc*6.4); ctx.stroke();
        ctx.fillStyle='rgba(196,181,253,'+(0.35+0.6*chg)+')'; ctx.shadowColor='#c4b5fd'; ctx.shadowBlur=12*chg;
        ctx.beginPath(); ctx.arc(hsc*4.7,-hsc*7,hsc*(0.8+0.35*chg),0,6.283); ctx.fill(); ctx.shadowBlur=0;
        ctx.restore();
        // stun stars
        if(stunned){ for(var st6=0;st6<3;st6++){ var sa6=nz/250+st6*2.09;
          ctx.font='900 '+(hsc*2)+'px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#fde047';
          ctx.fillText('✶', Math.cos(sa6)*hsc*3.4, -hsc*8+Math.sin(sa6)*hsc); } }
        ctx.restore();
        // MANA SHIELD bubble around him
        if(shielded){ var shPct=Math.max(0,1-(M.wizShield.dmg/12));
          ctx.save(); ctx.globalAlpha=0.5+0.2*Math.sin(nz/160);
          ctx.strokeStyle='rgba(168,85,247,'+(0.4+0.5*shPct)+')'; ctx.lineWidth=Math.max(2,cs*0.12);
          ctx.beginPath(); ctx.arc(wx,wy-hsc*2,hsc*11,0,6.283); ctx.stroke();
          // ripple where the last blow was drunk by the shield
          if(M.wizShield.hit && nz-M.wizShield.hit<400){ var rp8=(nz-M.wizShield.hit)/400;
            ctx.globalAlpha=(1-rp8); ctx.strokeStyle='#f0abfc'; ctx.lineWidth=Math.max(1.5,cs*0.1*(1-rp8));
            ctx.beginPath(); ctx.arc(wx,wy-hsc*2,hsc*11*(1+rp8*0.35),0,6.283); ctx.stroke(); }
          for(var hx6=0;hx6<6;hx6++){ var ha6=hx6/6*6.283+nz/1400;         // rotating hex facets
            ctx.strokeStyle='rgba(196,181,253,.35)'; ctx.lineWidth=1.5;
            ctx.beginPath(); ctx.arc(wx,wy-hsc*2,hsc*11,ha6,ha6+0.5); ctx.stroke(); }
          ctx.restore(); } }
      // ARCANE RUNES on the stack — glowing glyphs with a shrinking fuse ring
      if(M.runes&&M.runes.length){ ctx.save();
        M.runes.forEach(function(RU){ var rx7=RU.x*cs+cs/2, ry7=RU.y*cs+cs/2;
          var fuse=Math.max(0,(RU.det-nz)/6000);
          ctx.globalAlpha=0.85;
          ctx.shadowColor='#a855f7'; ctx.shadowBlur=10;
          ctx.fillStyle=fuse<0.25?(Math.sin(nz/70)>0?'#f0abfc':'#a855f7'):'#c4b5fd';
          ctx.font='900 '+(cs*0.78)+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(['ᚠ','ᛟ','ᚹ'][ (RU.x+RU.y)%3 ], rx7, ry7); ctx.shadowBlur=0;
          ctx.strokeStyle='rgba(240,171,252,.9)'; ctx.lineWidth=Math.max(1,cs*0.07);
          ctx.beginPath(); ctx.arc(rx7,ry7,cs*0.44,-1.5708,-1.5708+6.283*fuse); ctx.stroke(); });
        ctx.restore(); }
      // POLYMORPH flash on the falling piece
      if(M.polyFlash && nz-M.polyFlash<450 && M.cur){ var pf=(nz-M.polyFlash)/450;
        ctx.save(); ctx.globalAlpha=(1-pf)*0.9; ctx.globalCompositeOperation='lighter';
        for(var pr7=0;pr7<M.cur.m.length;pr7++)for(var pc7=0;pc7<M.cur.m[pr7].length;pc7++){ if(!M.cur.m[pr7][pc7]) continue;
          var fx7=(M.cur.x+pc7)*cs, fy7=(M.cur.y+pr7)*cs;
          ctx.fillStyle='rgba(196,181,253,.8)'; ctx.fillRect(fx7-2,fy7-2,cs+4,cs+4); }
        ctx.restore(); }
      // GRAVITY HEX indicator + violet time-warp vignette
      if(M.hexUntil>nz){ ctx.save();
        ctx.globalAlpha=0.14+0.08*Math.sin(nz/90);
        var hxg=ctx.createRadialGradient(cv.width/2,cv.height/2,cv.width*0.25,cv.width/2,cv.height/2,cv.width*0.8);
        hxg.addColorStop(0,'rgba(0,0,0,0)'); hxg.addColorStop(1,'rgba(168,85,247,.85)');
        ctx.fillStyle=hxg; ctx.fillRect(0,0,cv.width,cv.height);
        ctx.globalAlpha=0.75;
        ctx.font='900 '+(cs*0.62)+'px Sora,Inter,sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#f0abfc';
        ctx.fillText('⏳ HEXED — FAST FALL', cv.width/2, cv.height-cs*0.8);
        ctx.restore(); }
    }catch(_wzd){ try{ ctx.restore(); }catch(_r4){} }
    // ═══ 🐻 THE BEAR — full boss production ═══
    //  Ambient: two huge amber eyes breathing in the dark + heaving breath-vignette.
    //  Warning: a clawed paw SHADOW swells over the doomed half.
    //  Slam: a furred forearm and five-clawed paw CRASHES down — shockwave, dust,
    //  radiating cracks. Roar: the board becomes the bear's MAW — jaws of teeth clamp
    //  from above and below over a burning throat. Guard: a hulking back rises at the
    //  bottom under a golden shield dome.
    if(M.mode==='bearhunt') try{
      var nb2=Date.now(), br2=0.5+0.5*Math.sin(nb2/1400);
      var inRoar=(M.roar&&nb2>M.roar.t0&&nb2<M.roar.t0+M.roar.dur);
      // ── ambient presence (hidden while roaring — the maw takes over) ──
      if(!M.snkDead && !inRoar){
        ctx.save();
        ctx.globalAlpha=0.10+0.07*br2;                                   // heaving breath at the edges
        var bvg=ctx.createRadialGradient(cv.width/2,cv.height*0.45,cv.width*0.3,cv.width/2,cv.height*0.5,cv.width*0.85);
        bvg.addColorStop(0,'rgba(0,0,0,0)'); bvg.addColorStop(1,'rgba(20,10,4,.9)');
        ctx.fillStyle=bvg; ctx.fillRect(0,0,cv.width,cv.height);
        var blink=((nb2/3400)%1)>0.94?0.12:1;                            // the eyes blink, slowly
        [[0.32,1],[0.68,-1]].forEach(function(ep){
          var ex6=cv.width*ep[0], ey6=cv.height*0.09+br2*3;
          ctx.globalAlpha=(0.22+0.1*br2);
          var eg6=ctx.createRadialGradient(ex6,ey6,0,ex6,ey6,cs*1.4);
          eg6.addColorStop(0,'rgba(255,190,60,.9)'); eg6.addColorStop(.5,'rgba(200,120,20,.35)'); eg6.addColorStop(1,'rgba(200,120,20,0)');
          ctx.fillStyle=eg6; ctx.fillRect(ex6-cs*1.4,ey6-cs*1.4,cs*2.8,cs*2.8);
          ctx.save(); ctx.translate(ex6,ey6); ctx.scale(1,blink);
          ctx.fillStyle='#e8a53a'; ctx.beginPath(); ctx.ellipse(0,0,cs*0.42,cs*0.3,ep[1]*0.15,0,6.283); ctx.fill();
          ctx.fillStyle='#160b04'; ctx.beginPath(); ctx.ellipse(0,0,cs*0.15,cs*0.26,0,0,6.283); ctx.fill();
          ctx.fillStyle='rgba(255,250,235,.9)'; ctx.beginPath(); ctx.arc(-cs*0.12,-cs*0.1,cs*0.07,0,6.283); ctx.fill();
          ctx.restore(); });
        ctx.restore();
      }
      // ── paw: shadow warning → THE SLAM ──
      if(M.paw){ var PW=M.paw, half=PW.side, hx0=half?cv.width/2:0;
        if(nb2<PW.t0){                                                    // the shadow swells
          var wp=(nb2-(PW.t0-500))/500;
          ctx.save(); ctx.globalAlpha=0.5*wp;
          ctx.fillStyle='#000';
          ctx.beginPath(); ctx.ellipse(hx0+cv.width/4, cv.height*0.3, cv.width*0.22*(0.6+0.4*wp), cv.height*0.2*(0.6+0.4*wp),0,0,6.283); ctx.fill();
          for(var cw2=0;cw2<5;cw2++){ ctx.beginPath();
            ctx.ellipse(hx0+cv.width*(0.09+cw2*0.08), cv.height*0.14, cs*0.32*wp, cs*0.5*wp, 0,0,6.283); ctx.fill(); }
          ctx.restore();
        } else {                                                          // THE SLAM
          var sp3=(nb2-PW.t0)/PW.dur;
          var drop=sp3<0.22 ? (sp3/0.22) : 1;                             // crashes in the first 22%
          var lift=sp3>0.75 ? (sp3-0.75)/0.25 : 0;                        // withdraws at the end
          var pawW=cv.width*0.46, pawH=cv.height*0.5;
          var px6=hx0+cv.width*0.02, py6=-pawH+(pawH*0.98)*drop*drop-(pawH*0.7)*lift*lift;
          ctx.save();
          // furred forearm
          var fg6=ctx.createLinearGradient(px6,0,px6+pawW,0);
          fg6.addColorStop(0,'#3a2a18'); fg6.addColorStop(.5,'#57402a'); fg6.addColorStop(1,'#2c1e10');
          ctx.fillStyle=fg6;
          ctx.beginPath();
          ctx.moveTo(px6+pawW*0.16,py6-cv.height);
          ctx.lineTo(px6+pawW*0.84,py6-cv.height);
          ctx.lineTo(px6+pawW*0.94,py6+pawH*0.55);
          ctx.quadraticCurveTo(px6+pawW*0.5,py6+pawH*0.78,px6+pawW*0.06,py6+pawH*0.55);
          ctx.closePath(); ctx.fill();
          // fur strokes down the arm
          ctx.strokeStyle='rgba(20,12,6,.5)'; ctx.lineWidth=Math.max(1,cs*0.08); ctx.lineCap='round';
          for(var fs3=0;fs3<7;fs3++){ var fxx=px6+pawW*(0.18+fs3*0.11);
            ctx.beginPath(); ctx.moveTo(fxx,py6-pawH*0.2); ctx.lineTo(fxx+pawW*0.02,py6+pawH*0.42); ctx.stroke(); }
          ctx.strokeStyle='rgba(140,105,70,.35)'; ctx.lineWidth=Math.max(1,cs*0.04);
          for(var fs4=0;fs4<6;fs4++){ var fx4=px6+pawW*(0.22+fs4*0.11);
            ctx.beginPath(); ctx.moveTo(fx4,py6-pawH*0.1); ctx.lineTo(fx4+pawW*0.015,py6+pawH*0.35); ctx.stroke(); }
          // the great pad + five toes + claws
          var padY=py6+pawH*0.58;
          ctx.fillStyle='#1c1208';
          ctx.beginPath(); ctx.ellipse(px6+pawW*0.5,padY,pawW*0.3,pawH*0.16,0,0,6.283); ctx.fill();
          for(var toe=0;toe<5;toe++){ var tx6=px6+pawW*(0.12+toe*0.19), ty6=padY+pawH*0.15;
            ctx.fillStyle='#241708';
            ctx.beginPath(); ctx.ellipse(tx6,ty6,pawW*0.075,pawH*0.075,0,0,6.283); ctx.fill();
            ctx.fillStyle='#e8e0d0';                                     // the claw
            ctx.beginPath(); ctx.moveTo(tx6-pawW*0.035,ty6+pawH*0.04);
            ctx.quadraticCurveTo(tx6,ty6+pawH*0.2,tx6+pawW*0.012,ty6+pawH*0.05); ctx.closePath(); ctx.fill(); }
          // impact: shockwave + dust + cracks
          if(sp3>0.22 && sp3<0.8){ var imp=(sp3-0.22)/0.58;
            var iy=py6+pawH*0.9;
            ctx.globalAlpha=(1-imp);
            ctx.strokeStyle='rgba(220,200,170,.8)'; ctx.lineWidth=Math.max(2,cs*0.12*(1-imp));
            ctx.beginPath(); ctx.ellipse(px6+pawW*0.5,iy,pawW*0.7*imp+10,cs*0.9*imp+4,0,0,6.283); ctx.stroke();
            if(!PW.debris){ PW.debris=[]; for(var db=0;db<14;db++) PW.debris.push({a:Math.random()*3.14, v:2+Math.random()*4, r:1+Math.random()*3}); }
            PW.debris.forEach(function(dd2){ var dx6=Math.cos(dd2.a)*dd2.v*imp*30, dy6=-Math.abs(Math.sin(dd2.a))*dd2.v*imp*26+imp*imp*40;
              ctx.fillStyle='rgba(160,130,95,'+(0.8*(1-imp))+')';
              ctx.beginPath(); ctx.arc(px6+pawW*0.5+dx6,iy+dy6,dd2.r,0,6.283); ctx.fill(); });
            ctx.strokeStyle='rgba(30,20,10,'+(0.7*(1-imp))+')'; ctx.lineWidth=Math.max(1,cs*0.06);
            for(var ck2=0;ck2<5;ck2++){ var ca2=-0.5+ck2*0.55;
              ctx.beginPath(); ctx.moveTo(px6+pawW*0.5,iy);
              ctx.lineTo(px6+pawW*0.5+Math.cos(ca2)*pawW*0.4*imp, iy+Math.abs(Math.sin(ca2))*cs*2*imp); ctx.stroke(); }
            ctx.globalAlpha=1; }
          ctx.restore();
        } }
      // ── the ROAR: the board becomes the maw ──
      if(inRoar){ var rp3=(nb2-M.roar.t0)/M.roar.dur;
        var clamp2=rp3<0.5? rp3*2 : (1-rp3)*2;                            // teeth close then release
        ctx.save();
        ctx.fillStyle='rgba(8,3,1,'+(0.92*Math.min(1,clamp2*1.6))+')';
        ctx.fillRect(0,0,cv.width,cv.height);
        var tg2=ctx.createRadialGradient(cv.width/2,cv.height/2,0,cv.width/2,cv.height/2,cv.width*0.42);
        tg2.addColorStop(0,'rgba(180,30,10,'+(0.75*clamp2)+')'); tg2.addColorStop(.6,'rgba(90,12,4,'+(0.4*clamp2)+')'); tg2.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=tg2; ctx.fillRect(0,0,cv.width,cv.height);
        var reach=cv.height*0.34*clamp2, nT=7;
        for(var th2=0;th2<nT;th2++){ var txx=cv.width*(th2+0.5)/nT, tw6=cv.width/nT*0.72;
          ctx.fillStyle='#efe6d2';
          ctx.beginPath(); ctx.moveTo(txx-tw6/2,0); ctx.lineTo(txx+tw6/2,0); ctx.lineTo(txx,reach); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(txx-tw6/2,cv.height); ctx.lineTo(txx+tw6/2,cv.height); ctx.lineTo(txx+cv.width*0.03,cv.height-reach*0.85); ctx.closePath(); ctx.fill();
          ctx.strokeStyle='rgba(120,90,50,.5)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(txx-tw6/2,0); ctx.lineTo(txx,reach); ctx.stroke(); }
        ctx.restore(); }
      // ── DIZZY indicator — spinning stars over the board while controls are reversed ──
      if(M.dizzyUntil && nb2<M.dizzyUntil && !inRoar){
        ctx.save(); var dz=(M.dizzyUntil-nb2)/3000;
        ctx.globalAlpha=Math.min(1,dz*2)*0.9;
        for(var st5=0;st5<3;st5++){ var sa5=nb2/300+st5*2.09;
          var sx5=cv.width/2+Math.cos(sa5)*cs*2.2, sy5=cs*2.4+Math.sin(sa5)*cs*0.7;
          ctx.font='900 '+(cs*0.9)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('✶',sx5,sy5); }
        ctx.font='900 '+(cs*0.65)+'px Sora,Inter,sans-serif'; ctx.fillStyle='#fde047';
        ctx.fillText('😵 REVERSED',cv.width/2,cs*3.6);
        ctx.restore(); }
      // ── the GUARD: hunched back + golden shield dome ──
      if(!M.snkDead && M.guard && nb2<M.guard.until && !inRoar){
        var gl2=Math.min(1,(nb2-(M.guard.until-8000))/400)*Math.min(1,(M.guard.until-nb2)/400);
        ctx.save(); ctx.globalAlpha=gl2;
        ctx.fillStyle='rgba(30,20,10,.85)';                               // the hunched back
        ctx.beginPath(); ctx.moveTo(-10,cv.height+4);
        ctx.quadraticCurveTo(cv.width*0.25,cv.height*0.82,cv.width*0.5,cv.height*0.86);
        ctx.quadraticCurveTo(cv.width*0.75,cv.height*0.82,cv.width+10,cv.height+4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle='rgba(90,66,40,.5)'; ctx.lineWidth=Math.max(1,cs*0.06); ctx.lineCap='round';
        for(var bf2=0;bf2<9;bf2++){ var bfx=cv.width*(0.1+bf2*0.1);
          ctx.beginPath(); ctx.moveTo(bfx,cv.height*0.98); ctx.lineTo(bfx+cs*0.2,cv.height*0.86); ctx.stroke(); }
        var shp=0.6+0.4*Math.sin(nb2/300);                                // the dome shimmers
        ctx.strokeStyle='rgba(245,215,110,'+(0.5*shp*gl2)+')'; ctx.lineWidth=Math.max(2,cs*0.1);
        ctx.beginPath(); ctx.arc(cv.width/2,cv.height*1.05,cv.width*0.62,Math.PI*1.12,Math.PI*1.88); ctx.stroke();
        ctx.strokeStyle='rgba(255,236,170,'+(0.3*shp*gl2)+')'; ctx.lineWidth=Math.max(1,cs*0.05);
        ctx.beginPath(); ctx.arc(cv.width/2,cv.height*1.05,cv.width*0.56,Math.PI*1.15,Math.PI*1.85); ctx.stroke();
        ctx.restore(); }
    }catch(_bdr){ try{ ctx.restore(); }catch(_r3){} }
    // 🐍 SNAKE LIFE BAR — pinned to the top of the board, drawn over everything
    if(M.mode==='snakehunt'||M.mode==='wolfhunt'||M.mode==='bearhunt'||M.mode==='wizardhunt'||M.mode==='dragonhunt'){ var hp=Math.max(0,Math.min(100,M.snkHP||0)), dead=!!M.snkDead, _wIc=(M.mode==='dragonhunt'?((M.drgBelly>Date.now())?'⚔':'🐉'):(M.mode==='wizardhunt'?((M.wizShield&&Date.now()<M.wizShield.until)?'🔮':((M.wizStun>Date.now())?'😵':'🧙')):(M.mode==='bearhunt'?((M.guard&&Date.now()<M.guard.until)?'🛡':'🐻'):(M.mode==='wolfhunt'?'🐺':'🐍'))));
      var bw=cv.width-cs*1.2, bx=cs*0.6, byy=cs*0.28, bh=Math.max(5,cs*0.34);
      ctx.save();
      ctx.fillStyle='rgba(3,10,5,.72)';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx-3,byy-3,bw+6,bh+6,bh) : ctx.rect(bx-3,byy-3,bw+6,bh+6); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.10)'; ctx.fillRect(bx,byy,bw,bh);
      if(!dead && hp>0){
        var fg4=ctx.createLinearGradient(bx,0,bx+bw,0);
        if(M.mode==='wizardhunt'){ fg4.addColorStop(0,'#c4b5fd'); fg4.addColorStop(.55,'#a855f7'); fg4.addColorStop(1,'#e05545'); }
        else { fg4.addColorStop(0,'#8fd06a'); fg4.addColorStop(.55,'#e8c93a'); fg4.addColorStop(1,'#e05545'); }
        ctx.save(); ctx.beginPath(); ctx.rect(bx,byy,bw*hp/100,bh); ctx.clip();
        ctx.fillStyle=fg4; ctx.fillRect(bx,byy,bw,bh);
        // scale ticks on the fill
        ctx.fillStyle='rgba(0,0,0,.18)';
        for(var tk3=bx;tk3<bx+bw;tk3+=bh*1.1){ ctx.fillRect(tk3,byy,1.5,bh); }
        ctx.restore();
        // pulse when nearly slain
        if(hp<=25){ ctx.globalAlpha=.35+.35*Math.sin(Date.now()/120);
          ctx.strokeStyle='#ff6b5a'; ctx.lineWidth=2; ctx.strokeRect(bx-3,byy-3,bw+6,bh+6); ctx.globalAlpha=1; }
      }
      ctx.font='800 '+Math.max(9,bh*0.9)+'px Sora,Inter,sans-serif'; ctx.textBaseline='middle';
      ctx.textAlign='left'; ctx.fillStyle='#fff';
      ctx.fillText(_wIc, bx+3, byy+bh/2+0.5);
      ctx.textAlign='right'; ctx.fillStyle=dead?'#ff9c8f':'#eaffe8';
      ctx.fillText(dead?'SLAIN 💀':(Math.round(hp)+'%'), bx+bw-4, byy+bh/2+0.5);
      // ── HIT FX ── every wound: the bar flashes red at the tip, green sap sprays out,
      // and the damage number floats up. The crossing snake winces crimson for a beat.
      if(M.snkHits&&M.snkHits.length){ var nowH=Date.now();
        for(var hi2=M.snkHits.length-1;hi2>=0;hi2--){ var HH=M.snkHits[hi2], age=(nowH-HH.t0)/900;
          if(age>=1){ M.snkHits.splice(hi2,1); continue; }
          var tipX=bx+bw*hp/100, tipY=byy+bh/2;
          if(!HH.parts){ HH.parts=[]; for(var sp3=0;sp3<10;sp3++){ var an3=Math.random()*6.283;
            HH.parts.push({ a:an3, v:1.5+Math.random()*3, r:1+Math.random()*2.2 }); } }
          // red flash across the bar
          if(age<0.25){ ctx.globalAlpha=(0.25-age)*3; ctx.fillStyle='#ff5545'; ctx.fillRect(bx,byy,bw*hp/100+6,bh); ctx.globalAlpha=1; }
          // sap spray
          HH.parts.forEach(function(pp){ var d3=pp.v*age*38;
            ctx.globalAlpha=(1-age)*.9; ctx.fillStyle=(Math.floor(pp.a*7)%3)?'#8fd06a':'#d9f99d';
            ctx.beginPath(); ctx.arc(tipX+Math.cos(pp.a)*d3, tipY+Math.sin(pp.a)*d3+age*age*26, pp.r*(1-age*.5),0,6.283); ctx.fill(); });
          ctx.globalAlpha=1;
          // floating damage number
          var fs2=Math.max(11,cs*(HH.blind?0.85:0.6));
          ctx.font='900 '+fs2+'px Sora,Inter,sans-serif'; ctx.textAlign='center';
          ctx.globalAlpha=Math.min(1,(1-age)*1.6);
          ctx.fillStyle=HH.blind?'#fde047':'#ff8f7a';
          ctx.save(); ctx.translate(tipX, tipY+bh+8+ (1-Math.pow(1-age,2))*(-cs*1.6)); ctx.scale(1+age*.3,1+age*.3);
          ctx.fillText('-'+HH.dmg+(HH.blind?'!!':''),0,0); ctx.restore(); ctx.globalAlpha=1; } }
      // ── DEATH SEQUENCE ── flash → shockwave → the serpent's ghost dissolves into fireflies → banner
      if(M.snkDeath){ var dAge=(Date.now()-M.snkDeath.t0)/2400;
        if(dAge>=1){ M.snkDeath=null; }
        else { var dE=1-Math.pow(1-Math.min(1,dAge*1.4),3);
          if(dAge<0.14){ ctx.globalAlpha=(0.14-dAge)*6; ctx.fillStyle='#eaffe8'; ctx.fillRect(0,0,cv.width,cv.height); ctx.globalAlpha=1; }
          ctx.save();
          var _dw=(M.mode==='wizardhunt');
          ctx.globalAlpha=Math.max(0,1-dAge)*.9;                               // shockwave rings
          ctx.strokeStyle=_dw?'#a855f7':'#8fd06a'; ctx.lineWidth=Math.max(2,8*(1-dAge));
          ctx.beginPath(); ctx.arc(cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*.8*dE,0,6.283); ctx.stroke();
          ctx.lineWidth=Math.max(1,4*(1-dAge)); ctx.strokeStyle=_dw?'#f0abfc':'#d9f99d';
          ctx.beginPath(); ctx.arc(cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*.55*dE,0,6.283); ctx.stroke();
          // the serpent's ghost — a fading S-curve dissolving into rising motes
          if(!M.snkDeath.motes){ M.snkDeath.motes=[]; for(var mo3=0;mo3<46;mo3++){ var u3=mo3/46;
            M.snkDeath.motes.push({ u:u3, ox:(Math.random()-.5)*10, vy:-.4-Math.random()*1.2, ph:Math.random()*6.283, r:1.2+Math.random()*2 }); } }
          ctx.globalAlpha=Math.max(0,.55-dAge*.6);
          ctx.strokeStyle=_dw?'#4c1d95':'#556339'; ctx.lineWidth=cs*1.1*(1-dAge*.6); ctx.lineCap='round';
          ctx.beginPath();
          for(var gx3=0;gx3<=cv.width;gx3+=cs){ var gy3=cv.height*.42+Math.sin(gx3*.02+dAge*3)*cv.height*.1;
            gx3?ctx.lineTo(gx3,gy3):ctx.moveTo(gx3,gy3); }
          ctx.stroke();
          M.snkDeath.motes.forEach(function(mm){ var mx3=mm.u*cv.width+mm.ox*dAge*10;
            var my3=cv.height*.42+Math.sin(mm.u*cv.width*.02+dAge*3)*cv.height*.1+mm.vy*dAge*140;
            ctx.globalAlpha=Math.max(0,(1-dAge))*(.4+.6*Math.abs(Math.sin(dAge*10+mm.ph)));
            ctx.fillStyle=_dw?'#c4b5fd':'#fde68a';
            ctx.beginPath(); ctx.arc(mx3,my3,mm.r*(1-dAge*.4),0,6.283); ctx.fill(); });
          // the banner
          var bA=Math.max(0,Math.min(1,(dAge-.12)/.18))*Math.max(0,Math.min(1,(1-dAge)/.25));
          if(bA>0){ ctx.globalAlpha=bA; ctx.textAlign='center'; ctx.textBaseline='middle';
            var bs3=cs*1.6*(1+ (1-Math.min(1,(dAge-.12)/.18))*.6);
            ctx.font='900 '+bs3+'px Sora,Inter,sans-serif';
            ctx.shadowColor=(M.mode==='wizardhunt')?'#a855f7':'#8fd06a'; ctx.shadowBlur=30;
            ctx.fillStyle='#eaffe8'; ctx.fillText((M.mode==='dragonhunt'?'DRAGON SLAIN':(M.mode==='wizardhunt'?'WIZARD SLAIN':(M.mode==='bearhunt'?'BEAR SLAIN':(M.mode==='wolfhunt'?'WOLF SLAIN':'SNAKE SLAIN')))), cv.width/2, cv.height/2 - cs*1.2);
            ctx.shadowBlur=0; ctx.font='800 '+cs*0.7+'px Sora,Inter,sans-serif'; ctx.fillStyle='#d9f99d';
            ctx.fillText((M.mode==='wizardhunt')?'🧙  the magic dies with him  🧙':'💀  the forest is yours  💀', cv.width/2, cv.height/2 + cs*0.4); }
          ctx.restore(); } }
      ctx.restore(); }

    if(M.particles && M.particles.length){ ctx.save();
      for(var pi=M.particles.length-1;pi>=0;pi--){ var p=M.particles[pi];
        p.x+=p.vx; p.y+=p.vy;
        p.vy += (p.g==null ? 0.45 : p.g);                                  // per-pack gravity (embers float up)
        if(p.sway) p.x += Math.sin(p.life*p.sway)*0.7;                     // drifting packs: snow, petals, embers
        if(p.vr) p.rot=(p.rot||0)+p.vr;                                    // confetti tumble
        p.life -= (p.decay==null ? 0.03 : p.decay);
        if(p.life<=0){ M.particles.splice(pi,1); continue; }
        ctx.globalAlpha=Math.max(0,Math.min(1,p.life));
        ctx.fillStyle=p.color;
        if(p.glow && M.particles.length<=80){ ctx.shadowBlur=p.glow; ctx.shadowColor=p.color; } else { ctx.shadowBlur=0; }   // glow only for small bursts — shadowBlur is very slow
        if(p.shape==='circle'){ ctx.beginPath(); ctx.arc(p.x,p.y,p.sz/2,0,6.283); ctx.fill(); }
        else if(p.shape==='streak'){ ctx.fillRect(p.x, p.y, Math.max(1,p.sz*0.3), p.sz*2.2); }
        else if(p.vr){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot||0); ctx.fillRect(-p.sz/2,-p.sz*0.3,p.sz,p.sz*0.6); ctx.restore(); }
        else ctx.fillRect(p.x,p.y,p.sz,p.sz);
      }
      ctx.shadowBlur=0; ctx.restore();
    }
    // Danger glow — pulse the board red when the stack reaches the top rows (toggled only on change)
    var dg=false; for(var dx=0;dx<W;dx++){ if((M.grid[0]&&M.grid[0][dx])||(M.grid[1]&&M.grid[1][dx])||(M.grid[2]&&M.grid[2][dx])){ dg=true; break; } }
    if(dg!==M._danger){ M._danger=dg; cv.classList.toggle('tet-danger', dg); }
  }
  function drawOpp(){ var cv=el('tet-opp'); if(!cv||!M) return; var ctx=cv.getContext('2d'); var cs=cv.width/W;
    ctx.clearRect(0,0,cv.width,cv.height); grid(ctx,cv,cs);
    // Draw the opponent's board in THEIR equipped design (broadcast as `sk`), not mine.
    var skin = M.oppSkin || 'classic';
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){ var v=(M.oppGrid[y]&&M.oppGrid[y][x])||0;
      if(v){ blockAs(ctx,x,y,cs, v===8?'#5b6b82':(COLORS[v]||'#5b6b82'), skin); } }
  }

  // ════════════════ GROUP TOURNAMENT (simultaneous survival) ════════════════
  var TL=null;   // lobby state {tid, groupKey, groupName, host, hostName, players:{id:name}, started}
  function isGroupMember(groupKey){
    if(groupKey==='group') return true;
    if(String(groupKey).indexOf('ch:')===0){ var cid=groupKey.slice(3);
      try{ return (window._myChannels||[]).some(function(c){ return String(c.id)===String(cid); }); }catch(e){ return false; } }
    return false;
  }
  window.tourneyStart=function(){
    if(typeof currentChat==='undefined' || !(currentChat==='group' || String(currentChat).indexOf('ch:')===0)){ showToast('Open a group chat to start a tournament.'); return; }
    if(typeof supaClient==='undefined' || !supaClient){ showToast('Chat not connected.'); return; }
    if(!canPlayGame()) return;
    window.tetrisSetupLobby(); ac();
    var tid='T-'+eid()+'-'+Date.now();
    var gname=(typeof currentChatName!=='undefined'?currentChatName:'Group');
    TL={ tid:tid, groupKey:currentChat, groupName:gname, host:eid(), hostName:ename(), players:{}, started:false };
    TL.players[eid()]=ename();
    openLobby();
    var tries=0;
    (function resend(){ if(!TL || TL.started) return; lobbySend('tinvite',{tid:tid, groupKey:currentChat, groupName:gname, from:eid(), fromName:ename()}); if(++tries<5) setTimeout(resend,1500); })();
  };
  function onTInvite(p){
    if(!p || String(p.from)===String(eid())) return;
    if(!isGroupMember(p.groupKey)) return;
    if(M && M.playing) return;
    if(TB && !TB.done) return;   // already in a bracket
    if(TL && TL.tid===p.tid) return;   // already showing this lobby
    if(bkIsDay(p.tid)) return;         // ☀️ a peer on old code invited us to a day tournament — ignore it
    TL={ tid:p.tid, groupKey:p.groupKey, groupName:p.groupName, host:p.from, hostName:p.fromName, players:{}, started:false, nightly:!!p.nightly };
    TL.players[p.from]=p.fromName;
    openLobby(); sfxInvite();
  }
  // ── SCHEDULED TOURNAMENT (3 PM day bracket · nightly · Grand Final) ──
  // NO HOST. Nobody "runs" it. Every client builds the bracket itself from the same roster
  // using the tid as the shuffle seed (see beginBracket), so all of them land on an identical
  // draw with no one in charge. Previously every joiner set host=themselves, which is why the
  // lobby showed several HOSTs.
  // You are NOT auto-entered either — opening the lobby just shows you the field. You're in the
  // bracket only if you press Join.
  window.tourneyStartNightly=function(sid){
    if(bkIsDay(sid)) return;                       // ☀️ day tournaments retired — refuse to open a DT- lobby
    if(M && M.playing) return;
    if(TB && !TB.done) return;
    if(typeof supaClient==='undefined' || !supaClient) return;
    window.tetrisSetupLobby(); ac();
    var nm = bkIsGrand(sid) ? '👑 Grand Final' : bkIsDay(sid) ? '☀️ Day Tournament' : '🏆 Nightly Tournament';
    TL={ tid:sid, groupKey:'group', groupName:nm, host:null, hostName:'',
         players:{}, started:false, nightly:true, scheduled:true };
    openLobby();
    // Re-announce our entry for the whole window so every client's roster converges on the
    // same field — that's what keeps the independently-built brackets identical.
    var tries=0;
    (function resend(){ if(!TL || TL.started) return;
      if(TL.players[eid()]) lobbySend('tjoin',{tid:sid, id:eid(), name:ename()});
      if(++tries<32) setTimeout(resend,1400); })();
  };
  // ── ROSTER RECONCILIATION ──
  // Supabase broadcast has no delivery guarantee: a dropped `tjoin` or a late subscriber used to
  // leave two clients with different rosters → different bkShuffle → different pairings (the "day
  // matching" bug). So every client also GOSSIPS the full roster it has heard; on receipt each
  // client unions it in. This heals dropped/late joins so all clients converge on one field.
  var _rosterTs=0;
  function _sendRoster(){
    if(!TL || TL.started) return;
    var now=Date.now(); if(now-_rosterTs < 1100) return; _rosterTs=now;   // throttle to avoid a broadcast storm
    lobbySend('troster',{tid:TL.tid, players:TL.players});
  }
  function onTRoster(p){
    if(!TL || TL.started || !p || p.tid!==TL.tid || !p.players) return;
    var changed=false;
    for(var id in p.players){ if(p.players.hasOwnProperty(id) && !TL.players[id] && !(TL.specs&&TL.specs[id])){ TL.players[id]=p.players[id]; changed=true; } }
    if(changed){ renderLobby(); _sendRoster(); }   // propagate the newly-merged union onward
  }
  function onTJoin(p){ if(!TL || p.tid!==TL.tid) return;
    if(TL.specs && TL.specs[String(p.id)]) return;   // declared spectator — never seed them
    var isNew = !TL.players[p.id];
    TL.players[p.id]=p.name; renderLobby();
    if(isNew) _sendRoster();   // rebroadcast the union so a dropped join can't split the bracket
  }
  window.tourneyJoin=function(){
    if(!TL) return;
    if(!canPlayGame()) return;                 // scheduled events already pass this — timer keeps running
    TL.players[eid()]=ename(); ac();
    var tries=0; (function r(){ if(!TL||TL.started) return; lobbySend('tjoin',{tid:TL.tid, id:eid(), name:ename()}); _sendRoster(); if(++tries<6) setTimeout(r,900); })();
    renderLobby();
  };
  // 📺 SPECTATOR JOIN — you're IN the event (doors, opening reel, every round, the ceremony)
  // but never seeded in the bracket. Built for the big screen: the client simply follows the
  // tournament it can already compute — bracket between rounds, live broadcast during matches.
  window.tourneySpectate=function(){
    if(!TL || TL.started) return;
    TL.spec=true; ac();
    if(!TL.specs) TL.specs={};
    TL.specs[String(eid())]=1;
    delete TL.players[eid()];                 // un-seed myself (hosts are auto-rostered)
    // Tell every client, and keep telling — roster gossip must never union me back in.
    var tries=0; (function r(){ if(!TL||TL.started) return; lobbySend('tspec',{tid:TL.tid, id:eid()}); if(++tries<6) setTimeout(r,900); })();
    renderLobby();
    showToast('📺 You\'re in as spectator — the broadcast starts with the tournament.');
  };
  function onTSpec(p){ if(!TL || !p || p.tid!==TL.tid) return;
    if(!TL.specs) TL.specs={};
    TL.specs[String(p.id)]=1;
    if(TL.players[p.id]){ delete TL.players[p.id]; renderLobby(); }
  }
  window.tourneyLaunch=function(){
    if(!TL) return; if(Object.keys(TL.players).length<2){ showToast('Need at least 2 players.'); return; }
    var seed=TL.tid; TL.started=true;
    var players=Object.keys(TL.players).map(function(id){ return {id:id, name:TL.players[id]}; });
    lobbySend('tstart',{tid:TL.tid, seed:seed, players:players});
    beginBracket(TL.tid, players);
  };
  function onTStart(p){ if(!TL || p.tid!==TL.tid) return; if(!TL.players[eid()] && !TL.spec) return; // neither playing nor spectating
    if(M && M.playing) return;
    TL.started=true; beginBracket(p.tid, p.players);
  }
  window.tourneyLeaveLobby=function(){ TL=null; el('tourney-lobby').style.display='none'; };

  function openLobby(){ el('tourney-lobby').style.display='flex'; renderLobby(); }
  function renderLobby(){
    if(!TL) return;
    el('tl-title').textContent='🏆 Tetris Tournament — '+esc(TL.groupName||'Group');
    var ids=Object.keys(TL.players);
    el('tl-roster').innerHTML=ids.map(function(id){ return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:linear-gradient(150deg,rgba(60,20,10,.55),rgba(18,9,6,.65));border:1px solid rgba(255,170,105,.32);border-radius:10px;font-size:12.5px;color:#ffece0;font-weight:700;">'+
      '<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 7px #22c55e;"></span>'+esc(TL.players[id])+((TL.host && id===TL.host)?' <span style="color:#ffb020;font-size:10px;">HOST</span>':'')+(id===eid()?' <span style="color:#c9905f;font-size:10px;">(you)</span>':'')+'</div>'; }).join('');
    el('tl-count').textContent=ids.length+' player'+(ids.length!==1?'s':'');
    var joined=!!TL.players[eid()];
    var specBtn=el('tl-spec');
    if(specBtn) specBtn.style.display=(joined||TL.spec)?'none':'block';
    if(TL.spec && !joined){
      if(TL.nightly){
        var _gr2=bkIsGrand(TL.tid), _dy2=bkIsDay(TL.tid);
        el('tl-title').textContent=_gr2?'👑 THE GRAND FINAL':_dy2?'☀️ Day Tetris Tournament':'🏆 Nightly Tetris Tournament';
      }
      if(el('tl-join')) el('tl-join').style.display='none';
      var _ln=el('tl-launch');
      if(_ln){ var _hostSpec=(!TL.nightly && TL.host && String(TL.host)===String(eid())); _ln.style.display=_hostSpec?'block':'none'; if(_hostSpec) _ln.textContent='▶ Start ('+Object.keys(TL.players).length+' players)'; }
      if(el('tl-auto')){ el('tl-auto').style.display='block'; el('tl-auto').innerHTML='📺 SPECTATOR — you\'re in the broadcast booth. The show starts with the tournament.'; }
      el('tl-count').textContent=ids.length+' player'+(ids.length!==1?'s':'');
      return;
    }
    if(TL.nightly){
      // Scheduled = no host, no launcher. You either Join, or you don't and it starts without you.
      var _gr = bkIsGrand(TL.tid), _dy = bkIsDay(TL.tid);
      el('tl-title').textContent = _gr ? '👑 THE GRAND FINAL' : _dy ? '☀️ Day Tetris Tournament' : '🏆 Nightly Tetris Tournament';
      el('tl-sub').innerHTML = (_gr
        ? 'The week\'s championship. Knockout bracket → final. 👑1,200 · 🥈600 · 🥉300 JMB Points — and the crown. · '
        : _dy
        ? 'Knockout bracket — shuffled 1v1s → semis → final. Top 3 win JMB Points: 🥇250 · 🥈150 · 🥉100 · '
        : 'Knockout bracket — shuffled 1v1s → semis → final. Top 3 win JMB Points: 🥇250 · 🥈150 · 🥉100 · ')
        + '<span id="tl-count">'+ids.length+' player'+(ids.length!==1?'s':'')+'</span>';
      el('tl-launch').style.display='none';          // never a human launcher — it starts itself
      el('tl-join').style.display = joined?'none':'block';
      el('tl-join').textContent   = '✋ Join now';
      el('tl-auto').style.display = joined?'block':'none';
    } else {
      el('tl-auto').style.display='none';
      el('tl-join').style.display=joined?'none':'block';
      el('tl-launch').style.display=joined?'block':'none';
      el('tl-launch').textContent='▶ Start ('+ids.length+')';
    }
  }

  function beginTourney(tid, seed, players, teams, stake, tnames){
    el('tourney-lobby').style.display='none';
    // arena panel on, single-opponent column off
    el('tet-opp-col').style.display='none';
    el('tet-arena-col').style.display='block';
    var mine=players.filter(function(x){ return x.id===eid(); }).length?ename():ename();
    M={ matchId:tid, mode:'tourney', playing:true, ended:false, alive:true, oppName:'', nightly:bkIsScheduled(tid) };
    M.tchan=supaClient.channel('tourney-'+tid,{config:{broadcast:{self:false}}})
      .on('broadcast',{event:'tstate'}, function(p){ onTState(p.payload); })
      .on('broadcast',{event:'tattack'},function(p){ onTAttack(p.payload); })
      .on('broadcast',{event:'tover'},  function(p){ onTOver(p.payload); })
      .on('broadcast',{event:'tko'},    function(p){ if(p.payload && String(p.payload.from)!==String(eid())) onTKo(p.payload); })
      .on('broadcast',{event:'emote'},  function(p){ if(M && p.payload && p.payload.tid===M.matchId && String(p.payload.from)!==String(eid())) tetPopEmote(p.payload.from, p.payload.em); })
      .subscribe();
    M.kos=0; M.myKos=0;
    // players map
    M.players={};
    players.forEach(function(x){ M.players[x.id]={ name:x.name, score:0, lines:0, alive:true, grid:null, place:0, kos:0 }; });
    if(!M.players[eid()]) M.players[eid()]={ name:ename(), score:0, lines:0, alive:true, grid:null, place:0, kos:0 };
    M.startN=Object.keys(M.players).length;
    if(teams){ M.isTeam=true; M.teams=teams; M.stake=parseInt(stake,10)||0; M.tnames=(tnames&&typeof tnames==='object')?tnames:null; }   // 2v2 team battle uses the same engine, team-aware
    // engine init
    M.rng=mulberry32(hashStr(seed)); M.bag=[]; M.queue=[]; M.grid=empty(); M.score=0; M.lines=0; M.level=1; M.pendingGarbage=0; M.nextT=null;
    M.hold=null; M.canHold=true; M.combo=0; M.b2b=false;
    openOverlay(); el('tet-controls').style.display='block';
    buildArena();
    attachControls();
    status('Get ready…');
    if(M.isTeam){ showTeamIntro(function(){ tetBigCount(function(){ goTourney(); }); }); } else { tetBigCount(function(){ goTourney(); }); }
  }
  function goTourney(){
    sfxGo(); startMusic(); showEmoteBar(true); try{ tetLiveAdvertise(); }catch(_la){} try{ tetWatchListen(M.matchId); }catch(_wl){} spawn(); draw(); updateIncoming(); renderArena(); startRender();
    renderHold(); M.dropMs=700; M.loop=setInterval(tick,M.dropMs); M.net=setInterval(sendState,350);
    M.timeLeft=120; status('2:00 · '+tourneyAliveIds().length+' alive');
    M.timer=setInterval(function(){ M.timeLeft--; if(M.timeLeft<=0){ endByTime(); } else { status(''+fmtT(M.timeLeft)+' · '+tourneyAliveIds().length+' alive'); if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000);
  }
  function tourneyAliveIds(){ if(!M||!M.players) return []; return Object.keys(M.players).filter(function(id){ return M.players[id].alive; }); }
  function onTState(p){ if(!M||M.mode!=='tourney'||!p||p.tid!==M.matchId||String(p.from)===String(eid())) return;
    var pl=M.players[p.from]; if(!pl){ pl=M.players[p.from]={name:p.name,score:0,lines:0,alive:true,grid:null,place:0}; buildArena(); }
    pl.name=p.name||pl.name; pl.score=p.score||0; pl.lines=p.lines||0; pl.alive=p.alive!==false;
    if(p.sk && DESIGNS[p.sk]) pl.skin=p.sk;
    if(p.grid){ pl.grid=p.grid.split('|').map(function(rw){ return rw.split('').map(Number); }); }
    renderArena();
  }
  function onTAttack(p){ if(!M||M.mode!=='tourney'||!p||p.tid!==M.matchId) return;
    if(String(p.to)===String(eid()) && M.alive){ M.pendingGarbage=Math.min(PENDING_CAP,M.pendingGarbage+(p.lines||0)); updateIncoming(); try{ boardRecv(); }catch(e){} try{ sfxTick(); }catch(e){} }
  }
  function onTOver(p){ if(!M||M.mode!=='tourney'||!p||p.tid!==M.matchId) return;
    var pl=M.players[p.from]; if(pl){ pl.alive=false; pl.score=p.score||pl.score; pl.place=p.place||pl.place; }
    enemyEliminated(p.from, (pl&&pl.name)||p.name);
    renderArena(); tourneyCheckEnd();
  }
  // A KO in a tournament — update the player's KO count; only eliminated on their 3rd.
  function onTKo(p){ if(!M||M.mode!=='tourney'||!p||p.tid!==M.matchId) return;
    var pl=M.players[p.from]; if(pl){ pl.kos=p.kos||pl.kos; if(p.score!=null) pl.score=p.score; if(p.elim) pl.alive=false; }
    if(p.elim) enemyEliminated(p.from, (pl&&pl.name)||p.name);
    renderArena(); if(p.elim) tourneyCheckEnd();
  }
  function tourneyOnMyDeath(){
    var me=M.players[eid()]; if(me) me.alive=false;
    var aliveAfter=tourneyAliveIds().length;
    var place=aliveAfter+1; if(me) me.place=place;
    if(M.loop){ clearInterval(M.loop); M.loop=null; }
    detachControls();
    sfxLose();
    try{ M.tchan.send({type:'broadcast',event:'tover',payload:{tid:M.matchId,from:eid(),name:ename(),score:M.score,place:place}}); }catch(e){}
    status('💥 Knocked out — placed #'+place+' of '+M.startN+'. Watching for the winner…');
    renderArena(); tourneyCheckEnd();
  }
  function tourneyCheckEnd(){
    if(!M||M.ended) return;
    if(M.isTeam){ teamCheckEnd(); return; }
    var alive=tourneyAliveIds();
    if(alive.length===2 && !M._featuredFinal){ M._featuredFinal=true; try{ tetLiveAdvertise(); }catch(_ff){} }   // last 2 = the FINAL → feature it
    if(alive.length>1) return;
    M.ended=true; if(M.timer){clearInterval(M.timer);M.timer=null;} if(M.net){clearInterval(M.net);M.net=null;} if(M.loop){clearInterval(M.loop);M.loop=null;}
    var winId=alive[0]||null;
    if(winId && M.players[winId]) M.players[winId].place=1;
    try{ tetWinStreak(winId ? (String(winId)===String(eid())) : null); }catch(_ws){}
    stopMusic(); detachControls();
    if(M.nightly){ if(winId && String(winId)===String(eid())) reportNightlyRanking(); var wn0=(winId&&M.players[winId]&&M.players[winId].name)||''; status(winId&&String(winId)===String(eid())?'🏆 You won the Nightly Tournament!':('🏆 '+esc(wn0)+' won the Nightly Tournament!')); }
    else if(winId && String(winId)===String(eid()) && M.alive){ status('🏆 You are the CHAMPION! 🎉'); sfxWin(); }   // casual play — no JMB Points
    else if(winId){ var wn=(M.players[winId]&&M.players[winId].name)||'A player'; status('🏆 '+esc(wn)+' is the champion! 🎉'); }
    else { status('Tournament over.'); }
    showTourneyResults();
  }
  // Nightly tournament: the CHAMPION reports the authoritative full final ranking → backend pays 250/150/100.
  function reportNightlyRanking(){
    try{
      var rank=finalRanking();
      var arr=rank.map(function(p){ return {employee_id:p.id, full_name:p.name, placement:p.rank, score:p.score, kos:p.kos||0}; });
      fetch(APPS_SCRIPT_URL+'?action=tourney_report&tid='+encodeURIComponent(M.matchId)+'&ranking='+encodeURIComponent(JSON.stringify(arr))+'&_='+Date.now())
        .then(function(){ try{ if(typeof loadPoints==='function') setTimeout(loadPoints, 14*60000); }catch(e){} }).catch(function(){});
    }catch(e){}
  }
  function tourneyTimeEnd(){
    if(M.ended) return;
    if(M.isTeam){ teamTimeEnd(); return; }
    var alive=tourneyAliveIds(); var best=null;
    alive.forEach(function(id){ if(best===null){ best=id; return; }
      var a=M.players[id], b=M.players[best];
      if((a.kos||0)<(b.kos||0) || ((a.kos||0)===(b.kos||0) && a.score>b.score)) best=id; });
    M.ended=true; if(M.timer){clearInterval(M.timer);M.timer=null;} if(M.net){clearInterval(M.net);M.net=null;} if(M.loop){clearInterval(M.loop);M.loop=null;}
    detachControls();
    if(best && M.players[best]) M.players[best].place=1;
    stopMusic();
    if(M.nightly){ if(best && String(best)===String(eid())) reportNightlyRanking(); var wb=(best&&M.players[best]&&M.players[best].name)||''; status(best&&String(best)===String(eid())?'🏆 Time! You won the Nightly Tournament!':('Time! '+esc(wb)+' wins the Nightly Tournament.')); }
    else if(best && String(best)===String(eid()) && M.alive){ status('🏆 Time! Top score — you are the champion! 🎉'); sfxWin(); }   // casual play — no JMB Points
    else if(best){ var wn=(M.players[best]&&M.players[best].name)||'Top scorer'; status('Time! '+esc(wn)+' wins on score.'); sfxLose(); }
    else { status('Time!'); }
    showTourneyResults();
  }
  // ══════════ 2v2 TEAM BATTLE — portal engine, last team standing ══════════
  function teamLabel(t){ return t==='a'?'Amber':(t==='b'?'Red':'—'); }
  // Custom lobby name if the team set one, else the default colour label.
  function teamNm(t){ return (M&&M.tnames&&M.tnames[t]&&String(M.tnames[t]).trim())?String(M.tnames[t]).trim():teamLabel(t); }
  function teamRoster(t){ var out=[]; Object.keys(M.players||{}).forEach(function(id){ if(M.teams && M.teams[String(id)]===t) out.push({id:id, name:(M.players[id].name||id)}); }); return out; }
  function teamTitle(t){ var r=teamRoster(t).map(function(p){ return String(p.id)===String(eid())?'You':p.name; }); return r.length?r.join(' & '):teamLabel(t); }
  // Pre-match teammate VS splash (like the tournament intro) — Amber squad vs Red squad, then countdown.
  function showTeamIntro(cb){
    try{
      var ov=el('tet-team-intro'); if(!ov){ ov=document.createElement('div'); ov.id='tet-team-intro'; document.body.appendChild(ov); }
      function side(t,color,emoji,label){ var r=teamRoster(t); return '<div class="ti-side ti-'+t+'"><div class="ti-team" style="color:'+color+'">'+emoji+' '+label+'</div>'+
        r.map(function(p){ var ph=(typeof rkPhoto==='function')?rkPhoto(p.id):''; var av=ph?('<img src="'+ph+'" alt="">'):('<span>'+esc((p.name||'?').slice(0,1).toUpperCase())+'</span>'); return '<div class="ti-p"><div class="ti-av" style="border-color:'+color+'">'+av+'</div><div class="ti-nm">'+esc(String(p.id)===String(eid())?(p.name+' (you)'):p.name)+'</div></div>'; }).join('')+'</div>'; }
      var pot=(M.stake||0)*Math.max(2,Object.keys(M.players||{}).length);
      ov.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;gap:16px;">'+
        '<div class="ti-wrap">'+side('a','#ffb020','🟡',esc(teamNm('a').toUpperCase()))+'<div class="ti-vs">VS</div>'+side('b','#ef3e2e','🔴',esc(teamNm('b').toUpperCase()))+'</div>'+
        ((M.stake||0)>0?('<div style="font-family:\'Sora\',sans-serif;font-weight:800;font-size:16px;color:#ffcf9e;text-shadow:0 0 16px rgba(255,150,40,.6);">🪙 Pot '+pot+' coins — winners take +'+(M.stake||0)+' each</div>'):'')+
      '</div>';
      ov.classList.add('show'); try{ reelAnthem(); }catch(e){}   // 🎺 the team song
      setTimeout(function(){ ov.classList.remove('show'); if(cb) cb(); }, 2300);
    }catch(e){ if(cb) cb(); }
  }
  function teamAliveCount(t){ var n=0; tourneyAliveIds().forEach(function(id){ if(M.teams[String(id)]===t) n++; }); return n; }
  function teamScore(t){ var n=0; Object.keys(M.players||{}).forEach(function(id){ if(M.teams && M.teams[String(id)]===t) n+=(M.players[id].score||0); }); return n; }
  function teamKO(t){ var n=0; Object.keys(M.players||{}).forEach(function(id){ if(M.teams && M.teams[String(id)]===t) n+=(M.players[id].kos||0); }); return n; }
  function teamCheckEnd(){
    if(!M||M.ended) return;
    var aA=teamAliveCount('a'), aB=teamAliveCount('b');
    if(aA>0 && aB>0) return;                         // both teams still have a player alive
    M.ended=true; if(M.timer){clearInterval(M.timer);M.timer=null;} if(M.net){clearInterval(M.net);M.net=null;} if(M.loop){clearInterval(M.loop);M.loop=null;}
    detachControls(); stopMusic(); try{ showEmoteBar(false); }catch(_e){} try{ tetLiveStop(); }catch(_ls){} try{ tetWatchStopListen(); }catch(_ws){}
    var winT=aA>0?'a':(aB>0?'b':'tie'); var myT=M.teams[String(eid())]; var won=(winT!=='tie'&&winT===myT);
    try{ tetWinStreak(winT==='tie'?null:won); }catch(_ws){}
    if(winT==='tie') status('Draw — both teams down.');
    else status(won?('🏆 '+teamNm(winT)+' — YOU WIN! 🎉'):('🏆 '+teamNm(winT)+' wins.'));
    if(won){ try{ sfxWin(); }catch(e){} } else if(winT!=='tie'){ try{ sfxLose(); }catch(e){} }
    reportTeam2(winT); showTeamResults(winT);
  }
  // Every client posts the full 4-player result; the match_id dedupe keeps just one write.
  function reportTeam2(winT){
    try{
      if(!M||!M.isTeam||!M.players||!M.teams) return;
      var arr=Object.keys(M.players).map(function(id){ var p=M.players[id]; var t=M.teams[String(id)];
        var res=(winT==='tie')?'draw':(t===winT?'win':'loss');
        return {id:String(id), name:p.name||id, score:p.score||0, lines:p.lines||0, res:res}; });
      fetch(APPS_SCRIPT_URL+'?action=t2_result&match_id='+encodeURIComponent(M.matchId||'')+'&stake='+(M.stake||0)+'&players='+encodeURIComponent(JSON.stringify(arr))+'&_='+Date.now())
        .then(function(){ if((M.stake||0)>0){ setTimeout(function(){ try{ if(typeof loadWallet==='function') loadWallet(); }catch(e){} }, 800); } }).catch(function(){});
    }catch(e){}
  }
  function teamTimeEnd(){
    if(M.ended) return;
    M.ended=true; if(M.timer){clearInterval(M.timer);M.timer=null;} if(M.net){clearInterval(M.net);M.net=null;} if(M.loop){clearInterval(M.loop);M.loop=null;}
    detachControls(); stopMusic(); try{ showEmoteBar(false); }catch(_e){} try{ tetLiveStop(); }catch(_ls){} try{ tetWatchStopListen(); }catch(_ws){}
    function tKO(t){ var n=0; Object.keys(M.players).forEach(function(id){ if(M.teams[String(id)]===t) n+=(M.players[id].kos||0); }); return n; }
    function tScore(t){ var n=0; Object.keys(M.players).forEach(function(id){ if(M.teams[String(id)]===t) n+=(M.players[id].score||0); }); return n; }
    var ak=tKO('a'),bk=tKO('b'),as=tScore('a'),bs=tScore('b');
    var winT=(ak!==bk)?(ak<bk?'a':'b'):(as!==bs?(as>bs?'a':'b'):'tie');   // fewer KOs suffered wins, else higher combined score
    var myT=M.teams[String(eid())], won=(winT!=='tie'&&winT===myT);
    try{ tetWinStreak(winT==='tie'?null:won); }catch(_ws){}
    status(winT==='tie'?'⏱ Time! Draw.':('⏱ Time! '+teamNm(winT)+' wins'+(won?' — you win! 🎉':'.')));
    if(won){ try{ sfxWin(); }catch(e){} } else if(winT!=='tie'){ try{ sfxLose(); }catch(e){} }
    reportTeam2(winT); showTeamResults(winT);
  }
  function showTeamResults(winT){
    var lbl=el('tet-arena-label'); if(lbl) lbl.textContent=(winT==='tie'?'⚔ Draw':('🏆 '+teamNm(winT)+' WINS!'));
    // side size → is this a 3v3?
    var _na=0; Object.keys(M.teams||{}).forEach(function(id){ if(M.teams[id]==='a')_na++; });
    var is3=(_na>=3); var reopen=is3?'window.d3Open':'window.d2Open'; var modeLbl=is3?'3v3':'2v2';
    // MVP + overall ranking (by SCORE across both teams)
    var ids=Object.keys(M.players);
    var ranked=ids.map(function(id){ var p=M.players[id]; return {id:id, name:p.name, team:M.teams[String(id)], score:p.score||0, lines:p.lines||0, kos:p.kos||0}; })
                  .sort(function(x,y){ return (y.score-x.score)||(y.kos-x.kos)||(y.lines-x.lines); });
    var mvp=(ranked.length && ranked[0].score>0)?ranked[0]:null;
    function tdot(t){ return '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+tol(t)+';flex:0 0 auto;"></span>'; }
    function tol(t){ return t==='a'?'#ffb020':(t==='b'?'#ef3e2e':'#9fb0d0'); }
    var medals=['🥇','🥈','🥉'];
    var rankRows=ranked.map(function(r,i){
      var me=(String(r.id)===String(eid()));
      var rk=i<3?medals[i]:('<span style="display:inline-block;width:18px;text-align:center;color:#8a97b8;font-weight:800;font-size:12px;">'+(i+1)+'</span>');
      var star=(mvp&&r.id===mvp.id)?' <span style="color:#ffd66b;">⭐</span>':'';
      return '<div style="display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:10px;margin-bottom:5px;background:'+(me?'rgba(255,140,40,.12)':'rgba(255,255,255,.04)')+';border:1px solid '+(me?'rgba(255,140,40,.35)':'rgba(255,255,255,.08)')+';">'+
        '<span style="width:22px;text-align:center;font-size:15px;flex:0 0 auto;">'+rk+'</span>'+
        tdot(r.team)+
        '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800;font-size:12.5px;color:'+(r.team===winT?'#fff':'#d7ddf0')+';">'+esc(r.name)+(me?' <b style="color:#ffb877;">(you)</b>':'')+star+'</span>'+
        '<span style="flex:0 0 auto;text-align:right;font-size:11.5px;color:#aeb8d6;line-height:1.3;"><b style="color:#eef2ff;font-size:13px;">'+r.score.toLocaleString()+'</b><br><span style="font-size:10px;">'+r.lines+'L · '+r.kos+'KO</span></span>'+
      '</div>';
    }).join('');
    function teamSummary(t){
      var win=(winT===t); var coin=''; if((M.stake||0)>0 && winT!=='tie'){ coin=win?('<span style="color:#7bf5a8;font-weight:800;">+'+(M.stake||0)+'🪙</span>'):('<span style="color:#f87171;font-weight:800;">−'+(M.stake||0)+'🪙</span>'); }
      return '<div style="flex:1;min-width:0;border:1px solid '+(win?tol(t):'rgba(255,255,255,.12)')+';'+(win?'box-shadow:0 0 0 2px '+tol(t)+'55;background:'+tol(t)+'14;':'background:rgba(255,255,255,.03);')+'border-radius:12px;padding:9px 11px;">'+
        '<div style="display:flex;align-items:center;gap:6px;color:'+tol(t)+';font-weight:800;font-size:12px;margin-bottom:3px;overflow:hidden;">'+tdot(t)+'<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(teamNm(t))+'</span>'+(win?' <span style="color:#ffd66b;">🏆</span>':'')+'</div>'+
        '<div style="font-size:11.5px;color:#cdd6f5;">'+teamScore(t).toLocaleString()+' pts · '+teamKO(t)+' KO '+coin+'</div>'+
      '</div>';
    }
    var winBanner=(winT==='tie')?'<div style="font-size:20px;font-weight:900;color:#ffd27a;">⚔ IT\'S A DRAW</div>'
      :'<div style="font-size:12px;letter-spacing:2px;color:#ffcf9e;font-weight:800;">'+modeLbl+' RESULT</div><div style="font-size:22px;font-weight:900;color:'+tol(winT)+';text-shadow:0 2px 18px '+tol(winT)+'66;line-height:1.1;margin-top:2px;">🏆 '+esc(teamNm(winT))+' WINS!</div>';
    var host=el('tet-teamres'); if(!host){ host=document.createElement('div'); host.id='tet-teamres'; document.body.appendChild(host); }
    host.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(6,9,18,.82);backdrop-filter:blur(4px);padding:16px;';
    host.innerHTML='<div style="width:400px;max-width:100%;max-height:92vh;overflow:auto;background:linear-gradient(180deg,#141a2e,#0d1120);border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px -20px rgba(0,0,0,.85);padding:20px 18px;">'+
        '<div style="text-align:center;margin-bottom:14px;">'+winBanner+'</div>'+
        (mvp?('<div style="text-align:center;background:linear-gradient(135deg,rgba(255,176,32,.16),rgba(255,90,0,.12));border:1px solid rgba(255,176,32,.4);border-radius:14px;padding:11px;margin-bottom:14px;">'+
          '<div style="font-size:11px;letter-spacing:2px;color:#ffcf9e;font-weight:800;">⭐ MATCH MVP</div>'+
          '<div style="font-size:17px;font-weight:900;color:#fff;margin-top:3px;">'+esc(mvp.name)+'</div>'+
          '<div style="font-size:12px;color:#ffd8a8;margin-top:1px;">'+mvp.score.toLocaleString()+' pts · '+mvp.lines+' lines · '+mvp.kos+' KO · '+esc(teamNm(mvp.team))+'</div>'+
        '</div>'):'')+
        '<div style="display:flex;gap:8px;margin-bottom:14px;">'+teamSummary('a')+teamSummary('b')+'</div>'+
        '<div style="font-size:11px;letter-spacing:1.5px;color:#8a97b8;font-weight:800;margin:0 2px 7px;">FINAL RANKING</div>'+
        rankRows+
        '<div style="display:flex;gap:8px;margin-top:16px;">'+
          '<button onclick="var h=document.getElementById(\'tet-teamres\'); if(h) h.remove(); try{tetrisQuit()}catch(e){}; if('+reopen+') '+reopen+'();" style="flex:1;background:linear-gradient(135deg,#ff7a29,#ff5a00);color:#fff;border:none;border-radius:11px;padding:12px;font-weight:800;font-size:13px;cursor:pointer;">🔁 New '+modeLbl+'</button>'+
          '<button onclick="var h=document.getElementById(\'tet-teamres\'); if(h) h.remove(); try{tetrisQuit()}catch(e){}" style="flex:1;background:rgba(255,255,255,.08);color:#e8eefc;border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:12px;font-weight:700;font-size:13px;cursor:pointer;">Close</button>'+
        '</div>'+
      '</div>';
  }
  // Entry point the 2v2 lobby calls once all sides are set — runs the REAL portal engine.
  window.tetBeginTeam2v2=function(mid,seed,players,stake,tnames){
    try{ if(typeof supaClient==='undefined'||!supaClient) return;
      try{ ac(); }catch(e){}
      var teams={}; (players||[]).forEach(function(p){ teams[String(p.id)]=p.team; });
      beginTourney(String(mid), String(seed), players, teams, parseInt(stake,10)||0, tnames||null);
    }catch(e){}
  };

  // ══════════ 👁 SPECTATOR — watch a live 2v2 / tournament read-only ══════════
  var _liveChan=null, _specChan=null, _specAuto=false, _specAtkT=0, _watchChan=null, _watchListen=null;
  // ── live crowd counter ──
  function tetWatchCount(n){ var e=el('tet-watch-count'); if(!e){ e=document.createElement('div'); e.id='tet-watch-count'; document.body.appendChild(e); }
    if(n>0){ e.textContent='👁 '+n+' watching'; e.classList.add('on'); } else { e.classList.remove('on'); } }
  function tetWatchListen(mid){ try{ tetWatchStopListen(); if(!mid||typeof supaClient==='undefined'||!supaClient) return;
    _watchListen=supaClient.channel('watch-'+String(mid),{config:{presence:{key:'viewer-'+String(eid())}}});   // player watches presence but never tracks, so they aren't counted
    _watchListen.on('presence',{event:'sync'},function(){ try{ var st=_watchListen.presenceState(); tetWatchCount(Object.keys(st).length); }catch(e){} });
    _watchListen.subscribe();
  }catch(e){} }
  function tetWatchStopListen(){ try{ if(_watchListen){ supaClient.removeChannel(_watchListen); _watchListen=null; } }catch(e){} tetWatchCount(0); }
  function _specJoinWatch(mid){ try{ if(_watchChan){ supaClient.removeChannel(_watchChan); _watchChan=null; }
    _watchChan=supaClient.channel('watch-'+String(mid),{config:{presence:{key:String(eid())}}});
    _watchChan.subscribe(function(st){ if(st==='SUBSCRIBED'){ try{ _watchChan.track({at:Date.now()}); }catch(e){} } });
  }catch(e){} }
  function _specLeaveWatch(){ try{ if(_watchChan){ if(_watchChan.untrack) _watchChan.untrack(); supaClient.removeChannel(_watchChan); _watchChan=null; } }catch(e){} }
  var SPEC={ mid:null, players:{}, teams:null, names:{}, mode:'', title:'', snd:false };
  function _liveChanEnsure(){ if(!_liveChan && typeof supaClient!=='undefined' && supaClient){ _liveChan=supaClient.channel('tet-live',{config:{presence:{key:String(eid())}}}); _liveChan.subscribe(); } return _liveChan; }
  function _liveTrack(info){ try{ var c=_liveChanEnsure(); if(c&&c.track) c.track(info); }catch(e){} }
  function tetLiveAdvertise(){ try{ if(!M||!M.matchId) return;
    var nm={}; Object.keys(M.players||{}).forEach(function(id){ nm[id]=(M.players[id].name||id); });
    var title=M.isTeam?((M.tnames&&((M.tnames.a||'').trim()||(M.tnames.b||'').trim()))?(teamNm('a')+' vs '+teamNm('b')):(teamTitle('a')+' vs '+teamTitle('b'))):(Object.keys(M.players||{}).length+' players — free-for-all');
    var _na=0; if(M.teams) Object.keys(M.teams).forEach(function(id){ if(M.teams[id]==='a')_na++; }); var _tmode=M.isTeam?(_na>=3?'3v3':'2v2'):'tourney';
    _liveTrack({ mid:String(M.matchId), mode:_tmode, from:String(eid()), teams:(M.isTeam?M.teams:null), names:nm, title:title,
      featured:!!M._featuredFinal, label:(M._featuredFinal?'🏆 FINAL':''), chan:'tourney-'+String(M.matchId), fmt:'t', at:Date.now() });
  }catch(e){} }
  function tetLiveStop(){ try{ if(_liveChan&&_liveChan.untrack) _liveChan.untrack(); }catch(e){} }
  function _specEnsureUI(){ if(el('tet-spec')) return;
    var d=document.createElement('div'); d.id='tet-spec';
    d.innerHTML='<div class="sp-top"><div class="sp-title">👁 <em>Watch</em> Live</div><button class="sp-x" onclick="tetSpecClose()">✕ Close</button></div>'+
      '<div class="sp-sub" id="tet-spec-sub">Live matches happening right now</div>'+
      '<div id="tet-spec-list"></div>'+
      '<div class="sp-score" id="tet-spec-score"></div>'+
      '<div id="tet-spec-grid"></div>'+
      '<div id="tet-spec-res"></div>';
    document.body.appendChild(d);
    if(!el('tet-ko-banner')){ var kb=document.createElement('div'); kb.id='tet-ko-banner'; kb.innerHTML='<div class="kb1">💥</div><div class="kb2"></div>'; document.body.appendChild(kb); }
  }
  function _liveMatches(){ if(!_liveChan||!_liveChan.presenceState) return []; var st=_liveChan.presenceState(); var byMid={};
    Object.keys(st).forEach(function(key){ var metas=st[key]; if(!metas||!metas.length) return; var m=metas[metas.length-1]; if(!m||!m.mid) return; if(!byMid[m.mid]) byMid[m.mid]=m; });
    return Object.keys(byMid).map(function(k){ return byMid[k]; });
  }
  function _renderLiveList(){ var host=el('tet-spec-list'); if(!host) return; var ms=_liveMatches();
    ms.sort(function(a,b){ return (b.featured?1:0)-(a.featured?1:0); });   // featured final pinned to the top
    if(_specAuto){ var feat=ms.filter(function(m){ return m.featured; })[0]; if(feat){ _specAuto=false; setTimeout(function(){ window.tetSpectate(encodeURIComponent(feat.mid)); }, 250); } }
    if(!ms.length){ host.innerHTML='<div class="lv-empty">No live matches right now.<br>Start a 2v2 or tournament — spectators can watch here! 🎮</div>'; return; }
    host.innerHTML=ms.map(function(m){ var badge=m.featured?(m.label||'🏆 FINAL'):((m.mode==='2v2')?'2v2 DUEL':((m.mode==='3v3')?'3v3 BATTLE':'TOURNAMENT'));
      var rowSt=m.featured?' style="border-color:rgba(255,206,110,.85);background:linear-gradient(150deg,rgba(255,180,60,.16),rgba(40,16,6,.82));box-shadow:0 0 22px -6px rgba(255,160,30,.6);"':'';
      var badgeSt=m.featured?' style="background:linear-gradient(90deg,#ffb020,#ff7a1a);color:#3a2400;"':'';
      return '<div class="lv-row"'+rowSt+'><span class="lv-badge"'+badgeSt+'>'+esc(badge)+'</span><span class="lv-nm">'+esc(m.title||'Live match')+'</span><button class="lv-watch" onclick="tetSpectate(\''+encodeURIComponent(m.mid)+'\')">👁 Watch</button></div>'; }).join('');
  }
  window.tetWatchLive=function(){ _specEnsureUI(); try{ tetCloseRanking(); }catch(e){}
    _specAuto=true;
    var ov=el('tet-spec'); ov.classList.add('on'); var g=el('tet-spec-grid'); g.classList.remove('on'); g.style.display='none'; el('tet-spec-list').style.display='block';
    el('tet-spec-sub').textContent='Live matches happening right now';
    if(!_liveChan){ if(typeof supaClient!=='undefined'&&supaClient){ _liveChan=supaClient.channel('tet-live',{config:{presence:{key:String(eid())}}}); _liveChan.on('presence',{event:'sync'},_renderLiveList); _liveChan.subscribe(function(st){ if(st==='SUBSCRIBED') _renderLiveList(); }); } }
    else { try{ _liveChan.on('presence',{event:'sync'},_renderLiveList); }catch(e){} _renderLiveList(); }
    try{ ac(); }catch(e){}
  };
  window.tetSpectate=function(midEnc){ var mid=decodeURIComponent(midEnc); var meta=null; _liveMatches().forEach(function(m){ if(m.mid===mid) meta=m; });
    _specEnsureUI(); var ov=el('tet-spec'); ov.classList.add('on');
    el('tet-spec-list').style.display='none'; var g=el('tet-spec-grid'); g.classList.add('on'); g.style.display='flex';
    el('tet-spec-sub').textContent=(meta&&meta.title)?('👁 '+((meta.featured&&meta.label)?(meta.label+' — '):'')+meta.title):'Spectating…';
    SPEC={ mid:mid, players:{}, teams:(meta&&meta.teams)||null, names:(meta&&meta.names)||{}, mode:(meta&&meta.mode)||'', title:(meta&&meta.title)||'', snd:true };
    try{ ac(); }catch(e){}   // unlock audio on the Watch tap so we can play the players' SFX
    if(_specChan){ try{ supaClient.removeChannel(_specChan); }catch(e){} _specChan=null; }
    var chan=(meta&&meta.chan)||('tourney-'+mid);   // 2v2/tourney feed OR a bracket match feed
    _specChan=supaClient.channel(chan,{config:{broadcast:{self:false}}})
      .on('broadcast',{event:'tstate'}, function(p){ _specState(p.payload); })
      .on('broadcast',{event:'state'},  function(p){ _specState(p.payload); })
      .on('broadcast',{event:'tattack'},function(p){ _specAtk(); })
      .on('broadcast',{event:'attack'}, function(p){ _specAtk(); })
      .on('broadcast',{event:'tko'},    function(p){ _specKo(p.payload); })
      .on('broadcast',{event:'ko'},     function(p){ _specKo(p.payload); })
      .on('broadcast',{event:'tover'},  function(p){ _specOver(p.payload); })
      .on('broadcast',{event:'over'},   function(p){ _specOver(p.payload); })
      .subscribe();
    _specJoinWatch(mid);   // count me in the crowd so the players see 👁 N watching
    SPEC.ended=false; SPEC._sawLive=false;
    try{ var a=ac(); if(a&&a._master) a._master.gain.value=2.4; }catch(e){}   // crank volume for the TV
    _specStartMusic();      // the game's background music
    _specEnsureLiveEnd();   // detect time-based match end → show final results
    _specScoreRender(); _specRender();
  };
  function _specAtk(){ if(!SPEC.snd) return; var now=Date.now(); if(now-_specAtkT<70) return; _specAtkT=now; try{ sfxAttack(); }catch(e){} }
  function _specState(p){ if(!p||!p.from) return; var pl=SPEC.players[p.from]||(SPEC.players[p.from]={id:p.from});
    var prevL=pl.lines||0, wasAlive=(pl.alive!==false);
    pl.name=(SPEC.names&&SPEC.names[p.from])||p.name||pl.name||p.from; pl.score=p.score||0; pl.lines=p.lines||0; pl.alive=(p.alive!==false);
    pl.skin=(p.sk&&DESIGNS[p.sk])?p.sk:(pl.skin||'classic'); if(p.grid){ pl.grid=p.grid; }
    pl.team=(SPEC.teams&&SPEC.teams[String(p.from)])||pl.team||null;
    if(SPEC.snd && pl.lines>prevL){ try{ sfxClear(Math.min(4,pl.lines-prevL)); }catch(e){} }
    if(wasAlive && pl.alive===false){ _specKnockout(pl); }
    _specRender();
  }
  function _specKo(p){ if(!p||!p.from) return; var pl=SPEC.players[p.from]; if(!pl) return; if(p.score!=null) pl.score=p.score; if(p.elim){ pl.alive=false; _specKnockout(pl); } _specRender(); }
  function _specOver(p){ if(!p||!p.from) return; var pl=SPEC.players[p.from]; if(!pl) return; pl.alive=false; _specKnockout(pl); _specRender(); }
  function _specRender(){ var g=el('tet-spec-grid'); if(!g||!el('tet-spec').classList.contains('on')) return; _specScoreRender(); var ids=Object.keys(SPEC.players);
    if(SPEC.teams){ ids.sort(function(a,b){ return ((SPEC.teams[String(a)]==='a')?0:1)-((SPEC.teams[String(b)]==='a')?0:1); }); }
    g.innerHTML=ids.map(function(id){ var pl=SPEC.players[id]; var team=pl.team||'';
      return '<div class="sp-cell '+team+(pl.alive===false?' dead':'')+'"><canvas id="spcv-'+id+'" width="240" height="480"></canvas><div class="sp-nm">'+esc(pl.name||id)+(pl.alive===false?' · OUT':'')+'</div><div class="sp-sc">'+(pl.score||0).toLocaleString()+' · '+(pl.lines||0)+'L</div></div>'; }).join('');
    ids.forEach(function(id){ var pl=SPEC.players[id]; var cv=el('spcv-'+id); if(!cv) return; var ctx=cv.getContext('2d'); var cs=cv.width/W; ctx.clearRect(0,0,cv.width,cv.height); ctx.fillStyle='#070b16'; ctx.fillRect(0,0,cv.width,cv.height);
      if(pl.grid){ var rows=String(pl.grid).split('|'); for(var y=0;y<H&&y<rows.length;y++){ var row=rows[y]||''; for(var x=0;x<W;x++){ var v=+(row[x]||0); if(v){ blockAs(ctx,x,y,cs,(v===8?'#5b6b82':(COLORS[v]||'#5b6b82')),pl.skin||'classic'); } } } }
    });
  }
  window.tetSpecClose=function(){ if(_specChan){ try{ supaClient.removeChannel(_specChan); }catch(e){} _specChan=null; } _specLeaveWatch();
    _specStopMusic(); try{ var a=ac(); if(a&&a._master) a._master.gain.value=1; }catch(e){}
    var rr=el('tet-spec-res'); if(rr){ rr.classList.remove('on'); rr.innerHTML=''; } var scb=el('tet-spec-score'); if(scb){ scb.classList.remove('on'); scb.innerHTML=''; }
    var ov=el('tet-spec'); if(ov) ov.classList.remove('on'); SPEC={ mid:null, players:{}, teams:null, names:{}, mode:'', title:'', snd:false }; };

  /* ══════ spectator extras: KO counts · KO bomb + animation · BGM · final results (winning shift) ══════ */
  function _specTeamNames(){ var t=String(SPEC.title||''); var m=t.split(/\s+vs\.?\s+/i); return { a:(m[0]||'Team A').trim(), b:(m[1]||'Team B').trim() }; }
  function _specStats(){ var A={ko:0,pts:0,alive:0,tot:0}, B={ko:0,pts:0,alive:0,tot:0};
    Object.keys(SPEC.players).forEach(function(id){ var p=SPEC.players[id]; var tm=p.team; if(tm!=='a'&&tm!=='b') return; var S=(tm==='a')?A:B; S.tot++; S.pts+=(p.score||0); if(p.alive!==false) S.alive++; });
    A.ko=B.tot-B.alive; B.ko=A.tot-A.alive; return {a:A,b:B}; }
  function _specScoreRender(){ var host=el('tet-spec-score'); if(!host) return; if(!SPEC.teams){ host.classList.remove('on'); return; }
    var nm=_specTeamNames(), s=_specStats(); host.classList.add('on');
    var av=s.a.ko*1e7+s.a.pts, bv=s.b.ko*1e7+s.b.pts; var lead=(av>bv)?'a':((bv>av)?'b':'');
    host.innerHTML='<div class="sps a'+(lead==='a'?' lead':'')+'"><span class="snm">☀️ '+esc(nm.a)+'</span><span class="snum"><span class="sv"><b class="k">'+s.a.ko+'</b><i>KO</i></span><span class="sv"><b class="p">'+s.a.pts.toLocaleString()+'</b><i>pts</i></span></span></div>'+
      '<div class="spvs">VS</div>'+
      '<div class="sps b'+(lead==='b'?' lead':'')+'"><span class="snum"><span class="sv"><b class="k">'+s.b.ko+'</b><i>KO</i></span><span class="sv"><b class="p">'+s.b.pts.toLocaleString()+'</b><i>pts</i></span></span><span class="snm">🌙 '+esc(nm.b)+'</span></div>'; }
  function _specBomb(){ var a=ac(); if(!a) return; var t=a.currentTime, dst=a._master||a.destination;
    try{ var o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(170,t); o.frequency.exponentialRampToValueAtTime(38,t+0.5);
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.95,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.85);
      o.connect(g).connect(dst); o.start(t); o.stop(t+0.9); }catch(e){}
    try{ var b=a.createBuffer(1,Math.floor(a.sampleRate*0.5),a.sampleRate),d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.8);
      var s=a.createBufferSource(); s.buffer=b; var f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(1900,t); f.frequency.exponentialRampToValueAtTime(200,t+0.4);
      var ng=a.createGain(); ng.gain.value=0.65; s.connect(f).connect(ng).connect(dst); s.start(t); }catch(e){} }
  function _specKoBanner(name,team){ var kb=el('tet-ko-banner'); if(!kb) return; var t2=kb.querySelector('.kb2'); if(t2) t2.textContent=(name||'Player')+' — KNOCKED OUT'; var k1=kb.querySelector('.kb1'); if(k1) k1.style.color=(team==='a')?'#ffb020':(team==='b')?'#8a97ff':'#ff3b3b'; kb.classList.remove('on'); void kb.offsetWidth; kb.classList.add('on'); }
  function _specKnockout(pl){ if(!pl||pl._ko) return; pl._ko=true; if(SPEC.snd){ try{ sfxKO(); }catch(e){} _specBomb(); } _specKoBanner(pl.name||pl.id, pl.team); _specScoreRender(); setTimeout(_specCheckEnd,140); }
  var _specMusTimer=null;
  function _specStartMusic(){ _specStopMusic(); var a=ac(); if(!a) return; try{ musBuildEvents(); }catch(e){ return; } var bus; try{ bus=musBus(a); }catch(e){ return; } _musStartAt=a.currentTime+0.12; _musIdx=0;
    _specMusTimer=setInterval(function(){ var a2=ac(); if(!a2){ return; } var ahead=a2.currentTime+0.35, guard=0;
      while(guard++<128){ if(_musIdx>=_musEvents.length){ _musStartAt+=_musPhrase; _musIdx=0; } var e=_musEvents[_musIdx], when=_musStartAt+e.at; if(when>ahead) break; try{ musFire(a2,bus,e,when); }catch(_){} _musIdx++; } }, 110); }
  function _specStopMusic(){ if(_specMusTimer){ clearInterval(_specMusTimer); _specMusTimer=null; } }
  function _specCheckEnd(){ if(SPEC.ended||!SPEC.teams) return; var s=_specStats();
    if(s.a.tot>=1 && s.b.tot>=1){ var aW=(s.a.alive===0), bW=(s.b.alive===0); if(aW||bW){ _specResults((aW&&bW)?(s.a.pts>=s.b.pts?'a':'b'):(aW?'b':'a')); } } }
  function _specResults(win){ if(SPEC.ended) return; SPEC.ended=true; _specStopMusic();
    var nm=_specTeamNames(), s=_specStats(); var host=el('tet-spec-res'); if(!host) return;
    var wname=(win==='a')?nm.a:(win==='b')?nm.b:'', wemoji=(win==='a')?'☀️':'🌙', wcol=(win==='a')?'#ffb020':'#8a97ff';
    var best=null; Object.keys(SPEC.players).forEach(function(id){ var p=SPEC.players[id]; if(p&&(!best||(p.score||0)>(best.score||0))) best=p; });
    host.innerHTML='<div class="rw" style="color:'+(win?wcol:'#ff7a29')+'">'+(win?(wemoji+' '+esc(wname)+' SHIFT WINS!'):"IT'S A TIE!")+'</div>'+
      '<div class="rsc"><span style="color:#ffb020">☀️ '+esc(nm.a)+' · '+s.a.ko+' KO · '+s.a.pts.toLocaleString()+' pts</span> &nbsp;—&nbsp; <span style="color:#8a97ff">🌙 '+esc(nm.b)+' · '+s.b.ko+' KO · '+s.b.pts.toLocaleString()+' pts</span></div>'+
      (best&&(best.score||0)>0?('<div class="rmvp">⭐ MVP · '+esc(best.name||best.id)+' — '+(best.score||0).toLocaleString()+' pts · '+(best.lines||0)+' lines</div>'):'')+
      '<button class="rx" onclick="tetSpecClose()">Close</button>';
    host.classList.add('on'); if(SPEC.snd){ try{ sfxWin(); }catch(e){} } _specConfetti(win); }
  function _specConfetti(win){ try{ var cols=(win==='b')?['#8a97ff','#c3caff','#fff']:['#f9b625','#ffd97a','#fff'];
    for(var i=0;i<120;i++){ (function(i){ setTimeout(function(){ var dd=document.createElement('div'); dd.style.cssText='position:fixed;top:-6vh;width:10px;height:16px;border-radius:2px;z-index:2147482800;pointer-events:none;left:'+(Math.random()*100)+'vw;background:'+cols[i%cols.length]+';animation:koConf '+(Math.random()*2+2.5)+'s linear forwards'; document.body.appendChild(dd); setTimeout(function(){dd.remove();},5200); }, i*14); })(i); } }catch(e){} }
  function _specEnsureLiveEnd(){ try{ var c=_liveChanEnsure(); if(c && !c._specEndHook){ c._specEndHook=true; c.on('presence',{event:'sync'}, function(){ if(!SPEC.mid||SPEC.ended) return; var live=_liveMatches().some(function(m){ return m.mid===SPEC.mid; }); if(live){ SPEC._sawLive=true; } else if(SPEC._sawLive){ var s=_specStats(); _specResults((s.a.ko*1e7+s.a.pts)>=(s.b.ko*1e7+s.b.pts)?'a':'b'); } }); } }catch(e){} }

  // Arena: mini-boards of all other players
  function buildArena(){
    var box=el('tet-arena'); if(!box||!M||!M.players) return;
    var _meT=(M.isTeam&&M.teams)?M.teams[String(eid())]:null;
    var ids=Object.keys(M.players).filter(function(id){ return id!==eid(); });
    if(M.isTeam&&M.teams){ ids.sort(function(a,b){ return ((M.teams[String(a)]===_meT)?0:1)-((M.teams[String(b)]===_meT)?0:1); }); }   // your ally first
    box.innerHTML=ids.map(function(id){ var _ally=(M.isTeam&&M.teams)?(M.teams[String(id)]===_meT):false; var _tb=(M.isTeam&&M.teams)?(M.teams[String(id)]==='a'?'#ffb020':(M.teams[String(id)]==='b'?'#ef3e2e':'rgba(255,255,255,.12)')):'rgba(255,255,255,.12)'; var _tt=(M.isTeam&&M.teams)?(_ally?' <span style="color:#7fe0a0;">▲ally</span>':' <span style="color:#ff9a8a;">▼foe</span>'):''; var _cw=_ally?120:64, _chh=_cw*2; return '<div style="text-align:center;" id="tacard-'+id+'">'+
      '<div style="font-size:'+(_ally?11.5:10)+'px;color:#9fb0d6;max-width:'+(_cw+30)+'px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0 auto 3px;">'+esc(M.players[id].name)+_tt+'</div>'+
      '<div style="position:relative;display:inline-block;"><canvas id="tacanvas-'+id+'" width="'+_cw+'" height="'+_chh+'" style="background:#070b16;border:'+(_ally?2:1)+'px solid '+_tb+';border-radius:7px;display:block;"></canvas>'+
      '<div id="tako-'+id+'" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.55);border-radius:7px;align-items:center;justify-content:center;color:#f87171;font-weight:800;font-size:11px;">OUT</div></div>'+
      '<div style="font-size:10px;color:#cdd6f5;margin-top:2px;"><b id="tascore-'+id+'">0</b> · <span style="color:#f87171;" id="tako-n-'+id+'">0</span>/3 KO</div></div>'; }).join('');
    renderArena();
  }
  function renderArena(){
    if(!M||!M.players) return;
    Object.keys(M.players).forEach(function(id){ if(id===eid()) return;
      var pl=M.players[id]; var cv=el('tacanvas-'+id); if(!cv) return; var ctx=cv.getContext('2d'); var cs=cv.width/W;
      ctx.clearRect(0,0,cv.width,cv.height);
      if(pl.grid){ var _sk=pl.skin||'classic'; for(var y=0;y<H;y++)for(var x=0;x<W;x++){ var v=(pl.grid[y]&&pl.grid[y][x])||0; if(v){ blockAs(ctx,x,y,cs,(v===8?'#5b6b82':(COLORS[v]||'#5b6b82')),_sk); } } }
      var sc=el('tascore-'+id); if(sc) sc.textContent=pl.score;
      var kn=el('tako-n-'+id); if(kn) kn.textContent=(pl.kos||0);
      var ko=el('tako-'+id); if(ko) ko.style.display=pl.alive?'none':'flex';   // OUT = eliminated (3 KOs)
    });
  }
  // Full final standings: survivors first (by score), then knocked-out players by how long they lasted.
  function finalRanking(){
    var arr=Object.keys(M.players).map(function(id){ var p=M.players[id]; return {id:id, name:p.name, score:p.score||0, lines:p.lines||0, alive:p.alive, place:p.place||0, kos:p.kos||0}; });
    var alive=arr.filter(function(p){return p.alive;}).sort(function(a,b){ return (a.kos-b.kos) || (b.score-a.score); });
    var dead=arr.filter(function(p){return !p.alive;}).sort(function(a,b){ return (a.place||999)-(b.place||999) || b.score-a.score; });
    var all=alive.concat(dead); all.forEach(function(p,i){ p.rank=i+1; });
    return all;
  }
  function showTourneyResults(){
    var lbl=el('tet-arena-label'); if(lbl) lbl.textContent='🏆 Final Ranking';
    var box=el('tet-arena'); if(!box) return;
    box.style.maxHeight='560px';
    var rank=finalRanking(); var myRank=0; rank.forEach(function(p){ if(p.id===eid()) myRank=p.rank; });
    var NP=bkPrizes((TL&&TL.tid)||(M&&M.matchId)||'');
    box.innerHTML='<div style="width:320px;">'+ rank.map(function(p){
      var medal=p.rank<=3?['🥇','🥈','🥉'][p.rank-1]:(p.rank+'.');
      var mine=p.id===eid();
      var prize = M.nightly ? (p.rank<=3?' <span style="color:#fbbf24;font-size:10px;font-weight:800;">+'+NP[p.rank-1]+' pts</span>':'')
                            : (p.rank===1?' <span style="color:#fbbf24;font-size:10px;font-weight:800;">CHAMPION</span>':'');
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 11px;margin-bottom:6px;border-radius:11px;background:'+(mine?'rgba(255,107,26,.16)':'#ffffff')+';border:1px solid '+(p.rank===1?'rgba(251,191,36,.5)':(mine?'rgba(255,107,26,.4)':'rgba(255,255,255,.08)'))+';">'+
        '<div style="width:30px;text-align:center;font-weight:800;font-size:16px;">'+medal+'</div>'+
        '<div style="flex:1;text-align:left;font-size:13px;font-weight:600;">'+esc(p.name)+(mine?' <span style="color:#fbbf24;font-size:10px;">(you)</span>':'')+prize+'</div>'+
        '<div style="font-size:12px;color:#9fb0d6;">'+p.score+' pts<br><span style="font-size:10px;">'+p.lines+' lines</span></div></div>';
    }).join('')+'</div>';
    if(myRank===1 || (M.nightly && myRank>=1 && myRank<=3)){ try{ tetConfetti({count: myRank===1?200:130, dur: myRank===1?3200:2400}); }catch(_){} }
  }

  // ════════════════ BRACKET TOURNAMENT (shuffle → 1v1 knockout → semis → final) ════════════════
  // Everyone who joined is shuffled with a seed derived from the tournament id, so every client
  // computes the SAME bracket without a server. Each pairing plays the normal 1v1 duel engine
  // (3 KOs = out; on timeout: fewest KOs, then higher score). Winners advance until one is left.
  var TB=null;   // {tid,nightly,names,order,alive,round,roundLabel,pairs,byes,results,out,stats,chan,done}

  function bkKey(r,i){ return 'r'+r+'m'+i; }
  function bkName(id){ return (TB && TB.names && TB.names[id]) || String(id); }
  function bkShuffle(ids, seed){
    var a=ids.slice();
    // Seed from the tid AND the full roster (order-independent), so the draw depends on WHO is in it —
    // not just the date — and can't be guessed from the schedule. Warm-up + two passes kill the old
    // low-entropy pattern. Still fully deterministic: same tid + same roster ⇒ same bracket on every client.
    var mix=String(seed)+'|'+a.slice().sort().join(',')+'|'+a.length;
    var h=hashStr(mix); var r=mulberry32((h^0x9e3779b9)>>>0);
    for(var w=0;w<20;w++) r();                                  // shed the seed's early bias
    for(var pass=0;pass<2;pass++){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } }
    return a;
  }
  function bkRoundName(n){ return n<=2?'FINAL':(n<=4?'SEMI-FINAL':(n<=8?'QUARTER-FINAL':'ROUND OF '+n)); }
  function bkCleanup(){
    spStop(); try{ tetLiveStop(); }catch(_ls){}
    if(TB){ if(TB._cd){ clearInterval(TB._cd); TB._cd=null; }
      if(TB._wd){ clearTimeout(TB._wd); TB._wd=null; }
      if(TB.chan){ try{ supaClient.removeChannel(TB.chan); }catch(e){} TB.chan=null; } }
    TB=null;
  }

  // Is tonight the Grand Final? (Sunday — must match GRAND_DOW in the Apps Script.)
  function bkIsDay(tid){ return String(tid||'').indexOf('DT-')===0; }   // the 3 PM bracket
  // A SCHEDULED tournament — the 3 PM day bracket or the nightly. These pay JMB Points,
  // need no human host, and never require you to stop your timer.
  function bkIsScheduled(tid){ var t=String(tid||''); return t.indexOf('NT-')===0 || t.indexOf('DT-')===0; }
  function bkIsGrand(tid){
    try{
      if(bkIsDay(tid)) return false;                 // the day bracket is never the Grand Final
      var ds=String(tid||'').replace(/^NT-/,'').split('-').map(Number);
      if(ds.length!==3) return false;
      return new Date(Date.UTC(ds[0], ds[1]-1, ds[2])).getUTCDay() === 0;
    }catch(e){ return false; }
  }
  // Must mirror the server's _prizesFor_.
  function bkPrizes(tid){
    if(bkIsDay(tid))   return [250,150,100];
    if(bkIsGrand(tid)) return [1200,600,300];
    return [250,150,100];
  }

  function beginBracket(tid, players){
    var lb=el('tourney-lobby'); if(lb) lb.style.display='none';
    var names={}, ids=[];
    (players||[]).forEach(function(p){ var id=String(p.id); if(ids.indexOf(id)<0){ ids.push(id); names[id]=p.name||id; } });
    ids.sort();                                   // same starting list on every client…
    // "nightly" means SCHEDULED (pays JMB Points) — both the nightly NT- and the 3 PM DT- bracket.
    TB={ tid:tid, nightly:bkIsScheduled(tid), grand:bkIsGrand(tid), names:names,
         order:bkShuffle(ids, tid),               // …then the same seeded shuffle
         alive:[], round:0, roundLabel:'', pairs:[], botId:null, botRes:null,
         results:{}, out:[], stats:{}, done:false };
    TB.alive=TB.order.slice();
    TB.order.forEach(function(id){ TB.stats[id]={score:0,kos:0}; });
    TL=null;                                      // lobby is consumed — the bracket owns the flow now
    try{
      TB.chan=supaClient.channel('bracket-'+tid,{config:{broadcast:{self:false}}})
        .on('broadcast',{event:'bres'}, function(p){ onBkResult(p.payload); })
        .on('broadcast',{event:'bbot'}, function(p){ onBkBot(p.payload); })
        .subscribe();
    }catch(e){}
    openOverlay();
    // The doors have shut. Roll the opening titles.
    showOpeningReel(function(){ bkStartRound(); });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  THE OPENING REEL  — plays once, right after the doors close.
  //
  //  Act 1: title card ("TONIGHT'S TOURNAMENT" / "THE GRAND FINAL")
  //  Act 2: the roster — every player flies in, one by one, with their photo
  //  Act 3: the shuffle — cards blur and scramble
  //  Act 4: the draw — each 1v1 is announced, one at a time, VS-card style
  //
  //  It's the same for everyone: the bracket is derived from the tournament id,
  //  so every client is watching the identical sequence at the same moment.
  // ════════════════════════════════════════════════════════════════════════
  function reelPhoto(id){
    var u = (typeof rkPhoto==='function') ? rkPhoto(id) : '';
    return u;
  }
  // Look up a player's rank/tier/colour + leaderboard row (for the intro + rings).
  function reelInfo(id){
    var row=null; try{ (_tetBoard||[]).forEach(function(r){ if(String(r.employee_id||'').toLowerCase()===String(id||'').toLowerCase()) row=r; }); }catch(e){}
    var stars = row ? (parseInt(row.stars,10)||0) : 0;
    var R = (typeof rankFromStars==='function') ? rankFromStars(stars) : { rank:0, tier:'Rookie', god:false };
    var col = (typeof tierColor==='function') ? tierColor(R.tier) : '#ff8a4a';
    return { row:row, stars:stars, R:R, color:col };
  }
  function reelBadges(info){
    var b=[], row=info.row;
    if(row){
      if(row.crown) b.push('👑 Reigning Champion');
      if((parseInt(row.wins,10)||0)>0) b.push('🏆 '+row.wins+' Cup'+(row.wins>1?'s':''));
      if((parseInt(row.skill_level,10)||0)>=10) b.push('🤖 Grandmaster');
      if((parseInt(row.duel_wins,10)||0)+(parseInt(row.duel_losses,10)||0)>0) b.push('⚔ '+(row.duel_wins||0)+'W–'+(row.duel_losses||0)+'L');
      if((parseInt(row.combo_best,10)||0)>0) b.push('🔥 Combo ×'+row.combo_best);
      if((parseFloat(row.sprint_ms)||0)>0) b.push('⚡ Sprint '+(row.sprint_ms/1000).toFixed(1)+'s');
      if((parseInt(row.solo_stars,10)||0)>0) b.push('★ '+row.solo_stars+' milestones');
    }
    if(!b.length) b.push('🎮 Challenger');
    return b.slice(0,4);
  }
  function reelCard(id, extraCls){
    var name = bkName(id);
    var ph   = reelPhoto(id);
    var ini  = String(name).charAt(0).toUpperCase() || '?';
    var info = reelInfo(id);
    var ringCss = 'box-shadow:0 0 0 3px '+info.color+', 0 0 16px '+info.color+'99;';
    var rk = info.R.rank ? '<div class="reel-rk" style="background:'+info.color+';">'+info.R.rank+(info.R.god?'👑':'')+'</div>' : '';
    return '<div class="reel-card '+(extraCls||'')+'">' +
             '<div class="reel-av" style="'+ringCss+'">'+(ph ? '<img src="'+ph+'" alt="">' : '<span>'+esc(ini)+'</span>')+rk+'</div>' +
             '<div class="reel-nm">'+esc(name)+'</div>' +
           '</div>';
  }
  // Full stats strip for the player intro — the same ten numbers as the hub "Your Stats"
  // board, with rank chips computed against the whole leaderboard.
  function reelStats(id){
    var row=null; try{ (_tetBoard||[]).forEach(function(r){ if(String(r.employee_id||'').toLowerCase()===String(id||'').toLowerCase()) row=r; }); }catch(e){}
    if(!row) return '';
    var B=(_tetBoard||[]);
    function rk(f,asc){ var mv=Number(row[f]||0); if(!mv||!B.length) return 0; var b=0; for(var i=0;i<B.length;i++){ var v=Number(B[i][f]||0); if(!v) continue; if(asc?(v<mv):(v>mv)) b++; } return b+1; }
    function cell(v,l,sub,r){ var chip=(r&&r>0)?('<i class="rst-rk'+(r===1?' g':'')+'">'+(r===1?'🏆 ':'')+'Rank '+r+'</i>'):''; return '<div class="rst">'+chip+'<b>'+v+'</b><span>'+l+'</span>'+(sub?('<small>'+sub+'</small>'):'')+'</div>'; }
    var dW=+row.duel_wins||0, dL=+row.duel_losses||0, dT=dW+dL;
    var t2W=+row.t2_wins||0, t2L=+row.t2_losses||0, t2T=t2W+t2L;
    var o='';
    o+=cell(Number(row.best||0).toLocaleString(),'BEST SCORE','',rk('best'));
    o+=cell(Number(row.total_lines||0).toLocaleString(),'TOTAL LINES','',rk('total_lines'));
    o+=cell(Number(row.solo_stars||0).toLocaleString(),'★ MILESTONES','solo bests',rk('solo_stars'));
    o+=cell(dT?Math.round(dW/dT*100)+'%':'—','DUEL WIN RATE',dT?(dW+'W · '+dL+'L'):'no duels',0);
    o+=cell(t2T?Math.round(t2W/t2T*100)+'%':'—','2V2 WIN RATE',t2T?(t2W+'W · '+t2L+'L'):'no 2v2',0);
    o+=cell(row.sprint_ms?((row.sprint_ms/1000).toFixed(1)+'s'):'—','SPRINT 40','fastest',row.sprint_ms?rk('sprint_ms',true):0);
    o+=cell(row.ultra_score?Number(row.ultra_score).toLocaleString():'—','ULTRA','2:00 best',row.ultra_score?rk('ultra_score'):0);
    o+=cell(row.combo_best?('×'+row.combo_best):'—','BEST COMBO','',row.combo_best?rk('combo_best'):0);
    o+=cell(Number(row.wins||0).toLocaleString(),'CUP WINS','tournaments',rk('wins'));
    o+=cell(row.best_streak?('×'+row.best_streak):'—','WIN STREAK',(row.cur_streak>0?('🔥 '+row.cur_streak+' now'):''),row.best_streak?rk('best_streak'):0);
    return '<div class="reel-stats">'+o+'</div>';
  }
  // A big per-player spotlight card for the pre-shuffle intro.
  function reelSpot(id){
    var name=bkName(id), ph=reelPhoto(id), ini=String(name).charAt(0).toUpperCase()||'?';
    var info=reelInfo(id), mine=(String(id)===String(eid()));
    var badges=reelBadges(info);
    return '<div class="reel-spot'+(mine?' mine':'')+'" style="--rc:'+info.color+';">'+
      '<div class="reel-spot-av">'+(ph?'<img src="'+ph+'" alt="">':'<span>'+esc(ini)+'</span>')+'<i class="rsa-ring"></i><i class="rsa-ring2"></i></div>'+
      '<div class="reel-spot-nm">'+esc(name)+'</div>'+
      '<div class="reel-spot-rk">'+(info.R.rank?('RANK '+info.R.rank+' · '+esc(info.R.tier)+(info.R.god?' 👑':'')):'NEW CHALLENGER')+
        (info.stars?(' · '+Number(info.stars).toLocaleString()+' ★'):'')+'</div>'+
      '<div class="reel-spot-badges">'+badges.map(function(x){return '<span class="rsb">'+esc(x)+'</span>';}).join('')+'</div>'+
      reelStats(id)+
      (mine?'<div class="reel-you">THAT\'S YOU</div>':'')+
    '</div>';
  }

  // ── Cinematic reel audio: an epic driving loop + risers, plus a screen-flash effect ──
  var _reelMusT=null, _reelMusBus=null, _reelStep=0, _reelNoiseBuf=null;
  function _rNoise(a){ if(_reelNoiseBuf) return _reelNoiseBuf; var len=Math.floor(a.sampleRate*0.2), nb=a.createBuffer(1,len,a.sampleRate), d=nb.getChannelData(0); for(var i=0;i<len;i++) d[i]=Math.random()*2-1; _reelNoiseBuf=nb; return nb; }
  function _rKick(a,bus,t){ var o=a.createOscillator(),g=a.createGain(); o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12); g.gain.setValueAtTime(0.75,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.19); o.connect(g); g.connect(bus); o.start(t); o.stop(t+0.21); }
  function _rSnare(a,bus,t){ var ns=a.createBufferSource(); ns.buffer=_rNoise(a); var f=a.createBiquadFilter(); f.type='highpass'; f.frequency.value=1700; var g=a.createGain(); g.gain.setValueAtTime(0.32,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.14); ns.connect(f); f.connect(g); g.connect(bus); ns.start(t); ns.stop(t+0.16); }
  function _rHat(a,bus,t,acc){ var ns=a.createBufferSource(); ns.buffer=_rNoise(a); var f=a.createBiquadFilter(); f.type='highpass'; f.frequency.value=8500; var g=a.createGain(); g.gain.setValueAtTime(acc?0.11:0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.04); ns.connect(f); f.connect(g); g.connect(bus); ns.start(t); ns.stop(t+0.05); }
  function _rBass(a,bus,freq,t,dur){ var o=a.createOscillator(); o.type='sawtooth'; o.frequency.value=freq; var f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=640; var g=a.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.26,t+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+dur); o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.02); }
  function _rLead(a,bus,freq,t,dur){ var o=a.createOscillator(),o2=a.createOscillator(); o.type='square'; o2.type='sawtooth'; o2.detune.value=8; o.frequency.value=freq; o2.frequency.value=freq; var g=a.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.085,t+0.01); g.gain.exponentialRampToValueAtTime(0.001,t+dur); o.connect(g); o2.connect(g); g.connect(bus); o.start(t);o2.start(t); o.stop(t+dur+0.02);o2.stop(t+dur+0.02); }
  function _rChord(a,bus,fs,t,dur){ fs.forEach(function(f){ var o=a.createOscillator(); o.type='sawtooth'; o.detune.value=(Math.random()*9-4.5); o.frequency.value=f; var fl=a.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=1600; var g=a.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.048,t+0.03); g.gain.exponentialRampToValueAtTime(0.001,t+dur); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t+dur+0.03); }); }
  function _rPluck(a,bus,f,t,vol){ var o=a.createOscillator(); o.type='triangle'; o.frequency.value=f; var g=a.createGain(); g.gain.setValueAtTime(vol||0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12); o.connect(g); g.connect(bus); o.start(t); o.stop(t+0.14); }
  /* "CHAMPION'S GATE" — the new tournament theme. E-minor, half-time stomp with plucked
     16th arps, chord stabs on the bar and a snare-roll turnaround every 4th bar. A completely
     different song from the old A-minor sprint. */
  function reelMusStart(){
    reelMusStop(); var a=ac(); if(!a) return;
    var bus=a.createGain(); bus.gain.value=0.52; bus.connect(a.destination); _reelMusBus=bus;
    var BEAT=145;                                        // 16th-note grid, ~103 BPM half-time stomp
    var BARS=[ [82.4,[329.6,392.0,493.9]],               // Em
               [98.0,[392.0,493.9,587.3]],               // G
               [110.0,[440.0,523.3,659.3]],              // Am
               [73.4,[293.7,370.0,440.0]] ];             // D
    var ARP=[0,1,2,1, 0,2,1,2, 0,1,2,0, 1,2,1,2];        // chord-tone walk, one per 16th
    _reelStep=0;
    _reelMusT=setInterval(function(){
      var t=ac(); if(!t){ return; } var now=t.currentTime+0.03, st=_reelStep;
      var bar=BARS[Math.floor(st/16)%BARS.length], p=st%16;
      if(p===0||p===6||p===8||p===10) _rKick(t,bus,now);                 // stomping half-time kick
      if(p===4||p===12) _rSnare(t,bus,now);
      _rHat(t,bus,now, p%4===0);
      if(p===0) _rChord(t,bus,bar[1].concat([bar[1][0]*2]),now,1.7);     // stab rings across the bar
      if(p%2===0) _rBass(t,bus,bar[0],now,BEAT/1000*1.7);
      _rPluck(t,bus, bar[1][ARP[p]]*2, now, p%4===0?0.14:0.09);          // glittering top arp
      if(Math.floor(st/16)%4===3 && p>=12) _rSnare(t,bus,now);           // turnaround roll
      _reelStep++;
    }, BEAT);
  }
  /* Team anthem — the short brass-style fanfare both squads hear on the VS splash. */
  function reelAnthem(){ try{ var a=ac(); if(!a) return; var bus=a.createGain(); bus.gain.value=0.55; bus.connect(a.destination); var t=a.currentTime+0.02;
    [392,523.3,659.3,784].forEach(function(f,i){ _rLead(a,bus,f,t+i*0.15,0.16); _rPluck(a,bus,f*2,t+i*0.15,0.1); });
    _rChord(a,bus,[523.3,659.3,784,1046.5],t+0.66,1.6);
    _rKick(a,bus,t+0.66); _rSnare(a,bus,t+0.82); _rKick(a,bus,t+0.98); _rSnare(a,bus,t+1.14); _rKick(a,bus,t+1.3);
  }catch(e){} }
  function reelMusStop(){ if(_reelMusT){ clearInterval(_reelMusT); _reelMusT=null; } if(_reelMusBus){ try{ var a=ac(); _reelMusBus.gain.setTargetAtTime(0.0001, a.currentTime, 0.12); }catch(e){} _reelMusBus=null; } }
  function reelRiser(ms){ try{ var a=ac(); if(!a) return; var o=a.createOscillator(),g=a.createGain(),t=a.currentTime; o.type='sawtooth'; o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(1600,t+ms/1000); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+ms/1000*0.85); g.gain.exponentialRampToValueAtTime(0.001,t+ms/1000+0.05); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+ms/1000+0.08); }catch(e){} }
  function reelFlash(){ var s=el('tet-reel'); if(!s) return; var f=document.createElement('div'); f.className='reel-flash-el'; s.appendChild(f); setTimeout(function(){ if(f.parentNode) f.parentNode.removeChild(f); }, 460); }

  function showOpeningReel(done){
    var stage = el('tet-reel');
    if(!stage || !TB){ if(done) done(); return; }
    stage.style.display='flex';
    stage.className = 'tet-reel' + (TB.grand ? ' grand' : '');

    var roster = TB.order.slice();
    var grand  = TB.grand;

    // Build the same pairing list bkStartRound will build, so the draw we announce
    // is exactly the draw that gets played.
    var a = roster.slice(), pairs = [], botMan = null;
    while(a.length >= 2) pairs.push([a.shift(), a.shift()]);
    if(a.length === 1) botMan = a[0];

    function set(html, cls){ stage.innerHTML = '<div class="reel-inner punch '+(cls||'')+(grand?' grand':'')+'">'+html+'</div>'; }
    /* one-shot effects — self-removing, transform/opacity only, no game impact */
    function fxRain(n){ try{ var inner=stage.querySelector('.reel-inner'); if(!inner) return; var w=document.createElement('div'); w.className='reel-rain'; var h=''; for(var i2=0;i2<n;i2++){ h+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;animation-duration:'+(0.9+Math.random()*1.4).toFixed(2)+'s;animation-delay:'+(Math.random()*1.1).toFixed(2)+'s"></i>'; } w.innerHTML=h; inner.appendChild(w); }catch(e){} }
    function fxImpact(){ try{ var d=document.createElement('div'); d.className='reel-impactfx'; stage.appendChild(d); setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); },340); }catch(e){} }
    function fxShock(){ try{ var d=document.createElement('div'); d.className='reel-shock'; stage.appendChild(d); setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); },800); }catch(e){} }
    function beat(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

    (async function run(){
      try{
        // Make sure we have rank/achievement data for the intro.
        if(!Array.isArray(_tetBoard) || !_tetBoard.length){
          try{ var _rr = await fetch(APPS_SCRIPT_URL+'?action=tetris_ranking&_='+Date.now()).then(function(r){return r.json();}); if(_rr && _rr.ranking) _tetBoard=_rr.ranking; }catch(e){}
        }
        try{ ac(); reelMusStart(); }catch(e){}   // epic entrance music for the whole reel
        // ── ACT 1 — the title card
        set('<div class="reel-kicker">'+(grand ? 'SUNDAY NIGHT' : 'TONIGHT')+'</div>' +
            '<div class="reel-title">'+(grand ? 'THE GRAND<br><b>FINAL</b>' : 'TETRIS<br><b>TOURNAMENT</b>')+'</div>' +
            '<div class="reel-sub">'+(grand
                ? '👑 1,200 · 🥈 600 · 🥉 300 JMB Points — and the crown'
                : '🥇 250 · 🥈 150 · 🥉 100 JMB Points')+'</div>', 'act-title');
        try{ sfxUrgent(0); }catch(e){}
        await beat(620);                                        // let the title slam land…
        try{ _specBomb(); tetShake('tet-reel'); fxImpact(); fxRain(grand?30:18); }catch(e){}   // …then the BOOM
        await beat(1900);

        // ── ACT 2 — the roster walks in
        set('<div class="reel-kicker">'+roster.length+' PLAYER'+(roster.length!==1?'S':'')+'</div>' +
            '<div class="reel-h2">THE FIELD</div>' +
            '<div class="reel-roster" id="reel-roster"></div>', 'act-roster');
        var host = el('reel-roster');
        for(var i=0;i<roster.length;i++){
          var d = document.createElement('div');
          d.className = 'reel-slot';
          d.innerHTML = reelCard(roster[i]);
          host.appendChild(d);
          // stagger them in; a tick of sound each
          void d.offsetWidth;
          d.classList.add('in');
          try{ sfxTick(); }catch(e){}
          await beat(Math.max(150, 900 - roster.length * 55));   // big field = faster reel
        }
        await beat(700);

        // ── ACT 2.5 — PLAYER INTROS: spotlight each joined player with rank + achievements
        var introMs = grand ? 4600 : (roster.length<=4 ? 3600 : roster.length<=8 ? 2600 : 1800);
        for(var ip=0; ip<roster.length; ip++){
          set('<div class="reel-kicker">'+(grand?'FINALIST ':'PLAYER ')+(ip+1)+' OF '+roster.length+'</div>'+reelSpot(roster[ip]), 'act-spot');
          try{ (roster[ip]===String(eid())) ? sfxWin() : sfxGo(); }catch(e){}
          await beat(introMs);
        }
        await beat(500);

        // ── ACT 3 — THE CYCLONE DRAW. Cards are hurled to random spots faster and faster —
        //    genuinely impossible to track — then the whole field implodes into a golden core.
        set('<div class="reel-h2 shuffling">'+(grand?'THE FINAL DRAW':'DRAWING THE BRACKET')+'<span>.</span><span>.</span><span>.</span></div>' +
            '<div class="reel-cyclone" id="reel-cyc"><i class="reel-vortex"></i><i class="reel-vortex v2"></i><i class="cyc-core"></i>' + roster.map(function(id){ return reelCard(id, 'cy'); }).join('') + '</div>',
            'act-shuffle');
        try{ reelRiser(3000); }catch(e){}
        try{
          var cyc=el('reel-cyc'), cards=cyc?[].slice.call(cyc.querySelectorAll('.reel-card')):[];
          var CW=(cyc?cyc.clientWidth:600)*0.42, CH=(cyc?cyc.clientHeight:300)*0.38;
          function fling(fast){
            cards.forEach(function(c){
              var x=(Math.random()*2-1)*CW, y=(Math.random()*2-1)*CH;
              var r=(Math.random()*2-1)*46, sc2=0.65+Math.random()*0.7;
              c.style.transition='transform '+(fast?0.13:0.26)+'s cubic-bezier(.3,.9,.4,1.35)';
              c.style.transform='translate('+x.toFixed(0)+'px,'+y.toFixed(0)+'px) rotate('+r.toFixed(0)+'deg) scale('+sc2.toFixed(2)+')';
            });
          }
          var _cd=250;
          for(var s=0; s<24; s++){
            fling(s>9);
            try{ beep(240+s*52, 0.045, 'square', 0.12); }catch(_b){}
            if(s%3===0){ try{ tetShake('tet-reel'); }catch(_k){} }
            if(s===12||s===19){ try{ reelFlash(); }catch(_f){} }
            await beat(_cd);
            _cd=Math.max(62,_cd-9);                                        // spin up
          }
          cards.forEach(function(c){ c.style.transition='transform .3s cubic-bezier(.6,-.2,.7,1)'; c.style.transform='translate(0,0) rotate(720deg) scale(.04)'; });
          try{ _specBomb(); sfxWin(); tetShake('tet-reel'); fxImpact(); fxShock(); }catch(_i){}   // implosion detonates
          await beat(430);
        }catch(e){ await beat(2800); }
        await beat(320);

        // ── ACT 4 — the draw; the LAST human match gets a slow-mo cinematic reveal
        var totalMatches = pairs.length + (botMan?1:0);
        for(var pi=0; pi<pairs.length; pi++){
          var A = pairs[pi][0], B = pairs[pi][1];
          var mine = (A === String(eid()) || B === String(eid()));
          var isFinale = (pi === pairs.length-1) && !botMan;
          if(isFinale){
            set('<div class="reel-kicker gold">'+(grand?'THE FINAL':'FEATURE MATCH')+'</div>' +
                '<div class="reel-vs finale'+(mine?' mine':'')+'">' +
                  reelCard(A, 'big left slow') + '<div class="reel-vs-badge slam">VS</div>' + reelCard(B, 'big right slow') +
                '</div>' + (mine ? '<div class="reel-you">THIS IS YOUR MATCH</div>' : ''),
                'act-final');
            try{ reelRiser(1500); }catch(e){}
            await beat(1000);                                                     // slow slide-in
            try{ _specBomb(); sfxWin(); tetShake('tet-reel'); fxImpact(); fxShock(); }catch(e){}   // VS slam — full impact-frame hit
            await beat(2000);                                                     // hold in slow-mo
          } else {
            set('<div class="reel-kicker">MATCH '+(pi+1)+' OF '+totalMatches+'</div>' +
                '<div class="reel-vs'+(mine?' mine':'')+'">' +
                  reelCard(A, 'big left') + '<div class="reel-vs-badge">VS</div>' + reelCard(B, 'big right') +
                '</div>' + (mine ? '<div class="reel-you">THIS IS YOUR MATCH</div>' : ''),
                'act-draw');
            try{ mine ? sfxWin() : sfxGo(); }catch(e){}
            if(mine){ try{ tetShake('tet-reel'); }catch(e){} }
            await beat(1650);
          }
        }
        if(botMan){
          var mineBot = (botMan === String(eid()));
          set('<div class="reel-kicker">ODD ONE OUT</div>' +
              '<div class="reel-vs'+(mineBot?' mine':'')+'">' +
                reelCard(botMan, 'big left') +
                '<div class="reel-vs-badge">VS</div>' +
                '<div class="reel-card big right bot"><div class="reel-av bot">'+BOT_SVG+'</div>' +
                  '<div class="reel-nm">'+esc(bkBot().name)+'</div></div>' +
              '</div>' +
              (mineBot ? '<div class="reel-you">YOU FACE THE MACHINE — Lv 7</div>' : ''),
              'act-draw');
          try{ sfxGo(); }catch(e){}
          await beat(1750);
        }

        // ── curtain up: LET'S GO with a flash + confetti
        try{ reelRiser(900); }catch(e){}
        set('<div class="reel-title go">LET\'S<br><b>GO</b></div>', 'act-go');
        try{ _specBomb(); sfxWin(); fxImpact(); fxShock(); fxRain(24); tetConfetti({count:220,dur:2800}); }catch(e){}
        await beat(1300);
      }catch(err){ /* never let the show block the game */ }
      try{ reelMusStop(); }catch(e){}

      stage.style.display='none';
      stage.innerHTML='';
      if(done) done();
    })();
  }

  function bkStartRound(){
    if(!TB || TB.done) return;
    spStop(); try{ tetLiveStop(); }catch(_ls){}
    if(TB.alive.length<=1){ bkFinish(); return; }
    TB.round++;
    TB.roundLabel=bkRoundName(TB.alive.length);
    TB.pairs=[]; TB.botId=null; TB.botRes=null; TB.results={};
    var a=TB.alive.slice();
    while(a.length>=2){ TB.pairs.push([a.shift(), a.shift()]); }
    if(a.length===1) TB.botId=a[0];               // odd numbers → that player fights a Lv7 bot (no free byes)
    if(TB._wd) clearTimeout(TB._wd);
    TB._wd=setTimeout(bkWatchdog, 275000);        // no match can legitimately run this long
    var me=String(eid()), myIdx=-1;
    TB.pairs.forEach(function(pr,i){ if(pr[0]===me||pr[1]===me) myIdx=i; });
    // 🏆 The FINAL auto-promotes to a featured live watch — a finalist advertises it on tet-live.
    if(TB.roundLabel==='FINAL' && TB.pairs.length===1 && myIdx>=0){
      var fpr=TB.pairs[0]; var _fpk=[String(fpr[0]),String(fpr[1])].sort().join('_'); var fmid='BK-'+TB.tid+'-r'+TB.round+'-'+_fpk;
      var fnm={}; fnm[String(fpr[0])]=bkName(fpr[0]); fnm[String(fpr[1])]=bkName(fpr[1]);
      try{ _liveTrack({ mid:fmid, mode:'tourney', featured:true, label:(TB.grand?'👑 GRAND FINAL':'🏆 FINAL'), chan:'tetris-'+fmid, fmt:'s', teams:null, names:fnm, title:bkName(fpr[0])+' vs '+bkName(fpr[1]), from:me, at:Date.now() }); }catch(_ba){}
    }
    if(myIdx>=0){
      var pr=TB.pairs[myIdx], opp=(pr[0]===me)?pr[1]:pr[0];
      bkRender('Your match — '+TB.roundLabel.toLowerCase()+' vs '+bkName(opp));
      try{ sfxInvite(); }catch(e){}
      setTimeout(function(){ if(TB && !TB.done) bkPlay(myIdx, opp); }, 2200);
    } else if(TB.botId===me){
      bkRender('Uneven bracket — you face '+bkBot().name+' (Lv 7). Beat the bot to advance!');
      try{ sfxInvite(); }catch(e){}
      setTimeout(function(){ if(TB && !TB.done && TB.botId===String(eid())) bkPlayBot(); }, 2600);
    } else {
      var _isSpec=(TB.order.indexOf(me)<0);
      bkRender(TB.alive.indexOf(me)>=0 ? null : (_isSpec ? '📺 SPECTATOR BROADCAST — '+TB.roundLabel+' · following the matches live.' : 'You are out — watching the matches live.'));
      setTimeout(spAuto, _isSpec?1400:3000);
    }
  }
  function bkBot(){ return BOTS[6] || {lv:7, name:'Stacker Sven'}; }   // Level 7 bot

  // The odd player out fights a Lv7 bot instead of getting a free pass. Beat it → advance.
  function bkPlayBot(){
    if(!TB || TB.done) return;
    if(M && M.playing) return;
    spStop(); try{ ac(); }catch(e){}
    bkPanelOff();
    var lv=7, bot=bkBot();
    var oc=el('tet-opp-col'); if(oc) oc.style.display='';
    var arc=el('tet-arena-col'); if(arc) arc.style.display='none';
    var lb=el('tet-opp-label'); if(lb) lb.textContent='🤖 '+bot.name+' · Lv7';
    var id='BK-'+TB.tid+'-r'+TB.round+'-bot';
    M={ matchId:id, mode:'training', playing:true, ended:false, alive:true, oppName:bot.name, botLevel:lv,
        bk:{ tid:TB.tid, round:TB.round, idx:'bot', opp:'BOT' },
        rng:mulberry32(hashStr(id)), bag:[], grid:empty(), score:0, lines:0, level:1, pendingGarbage:0, nextT:null,
        hold:null, canHold:true, combo:0, b2b:false, kos:0, myKos:0, oppKos:0,
        oppGrid:empty(), oppScore:0, oppLines:0, oppAlive:true };
    BOT={ grid:empty(), rng:mulberry32(hashStr(id+'-bot')), bag:[], score:0, lines:0, alive:true, pending:0, combo:0, kos:0,
        level:lv, name:bot.name, mistake:Math.max(0,(10-lv)/13), interval:Math.max(240, 1150-(lv-1)*100) };
    applyRules(true);   // bracket bot match plays by tournament rules — 2:00 / 5 KOs
    openOverlay(); el('tet-controls').style.display='block';
    el('tet-me-score').textContent='0'; el('tet-me-lines').textContent='0';
    el('tet-opp-score').textContent='0'; el('tet-opp-lines').textContent='0';
    attachControls();
    var n=3; status('🤖 '+bot.name+' (Lv7) — starting in '+n+'…'); sfxTick();
    var cd=setInterval(function(){ n--; if(n>0){ status('Starting in '+n+'…'); sfxTick(); } else { clearInterval(cd); goTraining(); } }, 800);
  }
  // Called from trainingEnd when the finished bot match belongs to a bracket round.
  function bkBotDone(win, score){
    var me=String(eid()), bname=bkBot().name;
    status(win ? ('🏆 You beat '+esc(bname)+' — advancing!') : ('🤖 '+esc(bname)+' knocked you out.'));
    try{ win?sfxWin():sfxLose(); }catch(e){}

    // Record it too — the bot match is a real round of the tournament, so its lines
    // must count. solo=1 writes a single row (there's no second human to credit).
    try{
      fetch(APPS_SCRIPT_URL+'?action=game_result&mode=tourney&solo=1'+
        '&match_id='+encodeURIComponent((M&&M.matchId)||'')+
        '&employee_id='+encodeURIComponent(me)+'&full_name='+encodeURIComponent(ename())+
        '&result='+(win?'win':'loss')+
        '&score='+(score||0)+'&lines='+((M&&M.lines)||0)+
        '&opponent='+encodeURIComponent(bname)+
        '&_='+Date.now()).catch(function(){});
    }catch(e){}

    cleanup();
    if(win){ try{ tetConfetti({count:110,dur:1800}); }catch(e){} }
    if(!TB || TB.done) return;
    var p={ tid:TB.tid, round:TB.round, id:me, win:!!win, score:score||0 };
    var n=0;
    (function s(){ if(!TB || TB.done || !TB.chan) return;
      try{ TB.chan.send({type:'broadcast',event:'bbot',payload:p}); }catch(e){}
      if(++n<3) setTimeout(s, 1200); })();
    applyBotResult(p);
    setTimeout(spAuto, 3200);
  }
  function onBkBot(p){ if(!TB || !p || p.tid!==TB.tid) return; applyBotResult(p); }
  function applyBotResult(p){
    if(!TB || TB.done || p.round!==TB.round) return;
    if(TB.botRes!==null) return;                  // first report wins
    if(String(p.id)!==String(TB.botId)) return;
    TB.botRes = p.win ? 'win' : 'lose';
    var id=String(TB.botId);
    if(!TB.stats[id]) TB.stats[id]={score:0,kos:0};
    TB.stats[id].score=Math.max(TB.stats[id].score||0, p.score||0);
    if(TB.botRes==='lose') TB.out.push({ id:id, round:TB.round });
    bkRender();
    bkCheckRound();
    setTimeout(spAuto, 1600);
  }

  function bkPlay(idx, opp){
    if(!TB || TB.done) return;
    spStop();
    bkPanelOff();
    // Key the match channel by the SORTED PAIR OF PLAYER IDS, not the bracket position `idx`.
    // If two clients ever disagree on ordering, `idx=0` meant different pairs on each screen and
    // they'd collide on the same channel → the opponent board teleported/desynced. Identity-keyed,
    // the two real opponents always meet on one channel (and share one seed via hashStr).
    var _pk=[String(eid()), String(opp)].sort().join('_');
    M={ matchId:'BK-'+TB.tid+'-r'+TB.round+'-'+_pk, host:false, oppId:opp, oppName:bkName(opp), playing:false,
        bk:{ tid:TB.tid, round:TB.round, idx:idx, opp:String(opp) } };
    if(TB && TB.roundLabel==='FINAL'){ try{ tetWatchListen(M.matchId); }catch(_wl){} }   // the featured final has a live crowd
    openOverlay();
    var lb=el('tet-opp-label'); if(lb) lb.textContent=M.oppName;
    startMatch();          // reuses the duel engine → same channel + same seed on both sides
  }

  // Called from finish() instead of the normal duel wrap-up.
  function bkReport(iWon, how){
    if(!M || !M.bk) return;
    var me=String(eid()), opp=String(M.bk.opp), idx=M.bk.idx, round=M.bk.round;
    var myS=M.score||0, opS=M.oppScore||0, myK=M.myKos||0, opK=M.oppKos||0;
    var win=iWon;
    // a bracket can't end in a draw — break it deterministically
    if(win===null || win===undefined) win = (myS!==opS) ? (myS>opS) : (me<opp);
    var p={ tid:M.bk.tid, round:round, idx:idx,
            winner: win?me:opp, loser: win?opp:me, s:{}, k:{} };
    p.s[me]=myS; p.s[opp]=opS; p.k[me]=myK; p.k[opp]=opK;
    status(win ? '🏆 You win — advancing!' : '💪 '+esc(bkName(opp))+' advances. Good game!');
    try{ win?sfxWin():sfxLose(); }catch(e){}

    // ── RECORD THE MATCH ──
    // Bracket matches used to vanish: finish() hands off to bkReport and returns, so
    // reportDuel() never ran and nothing was written. Lines, score and KOs from an entire
    // tournament counted for NOTHING — no rating, no coins, no stats.
    // The winner reports both players (authoritative), so each match is written once.
    // mode='tourney' keeps these out of the 1v1 duel-win tallies, but the lines still
    // feed the rating and the coin wallet.
    if(win){
      try{
        fetch(APPS_SCRIPT_URL+'?action=game_result&mode=tourney'+
          '&match_id='+encodeURIComponent(M.matchId||'')+
          '&winner_id='+encodeURIComponent(me)+'&winner_name='+encodeURIComponent(ename())+
          '&winner_score='+myS+'&winner_lines='+(M.lines||0)+
          '&loser_id='+encodeURIComponent(opp)+'&loser_name='+encodeURIComponent(bkName(opp))+
          '&loser_score='+opS+'&loser_lines='+(M.oppLines||0)+
          '&_='+Date.now()).catch(function(){});
      }catch(e){}
    }

    cleanup();                                   // ends the match only — TB survives
    if(win){ try{ tetConfetti({count:110,dur:1800}); }catch(e){} }
    if(!TB || TB.done) return;
    // Only ONE side of a pairing is authoritative (the first name in the pair). The other side waits
    // for that report — so both clients can never record a different winner for the same match.
    var pair=TB.pairs[idx]||[], authority=(String(pair[0])===me);
    if(authority){ bkSend(p); applyBkResult(p); }
    else {
      bkRender('Result sent — waiting for '+esc(bkName(opp))+'…');
      setTimeout(function(){                     // fallback if the authority dropped out
        if(!TB || TB.done || TB.round!==round) return;
        if(TB.results[bkKey(round, idx)]) return;
        bkSend(p); applyBkResult(p);
      }, 7000);
    }
    // Winners hold here until EVERY match in the round has a winner — nobody advances early.
    if(win && TB && !TB.done) bkRender(bkWaitText());
    // Either way: drop into a live feed of a match still in progress.
    setTimeout(spAuto, 3200);
  }
  // Progress text for anyone who is done with their own match and is waiting on the rest of the round.
  // Round progress — pair matches plus the Lv7 bot match, if this round has one.
  function bkProg(){
    if(!TB) return {done:0, tot:0};
    var tot=TB.pairs.length + (TB.botId?1:0);
    var done=Object.keys(TB.results).length + ((TB.botId && TB.botRes!==null)?1:0);
    return {done:done, tot:tot};
  }
  function bkWaitText(){
    if(!TB) return '';
    var g=bkProg();
    if(g.done>=g.tot) return 'All winners decided!';
    var left=g.tot-g.done;
    return 'You advance ✓ — waiting for '+left+' more match'+(left!==1?'es':'')+' ('+g.done+'/'+g.tot+' done)';
  }
  function bkSend(p){
    var n=0;
    (function s(){ if(!TB || TB.done || !TB.chan) return;
      try{ TB.chan.send({type:'broadcast',event:'bres',payload:p}); }catch(e){}
      if(++n<3) setTimeout(s, 1200); })();       // resend so laggy clients converge
  }
  // Last-resort: a player closed the tab mid-match and nobody ever reported. Matches cap at ~3 min,
  // so anything unresolved after 4½ minutes is resolved deterministically to keep the bracket moving.
  function bkWatchdog(){
    if(!TB || TB.done) return;
    var moved=false;
    TB.pairs.forEach(function(pr,i){
      if(TB.results[bkKey(TB.round,i)]) return;
      moved=true;
      applyBkResult({ tid:TB.tid, round:TB.round, idx:i, winner:String(pr[0]), loser:String(pr[1]), s:{}, k:{} });
    });
    if(TB.botId && TB.botRes===null){ moved=true;
      applyBotResult({ tid:TB.tid, round:TB.round, id:TB.botId, win:true, score:0 });   // give them the benefit
    }
    if(moved) bkRender('A player dropped out — bracket advanced.');
  }
  function onBkResult(p){ if(!TB || !p || p.tid!==TB.tid) return; applyBkResult(p); }
  function applyBkResult(p){
    if(!TB || TB.done || p.round!==TB.round) return;
    var k=bkKey(p.round, p.idx);
    if(TB.results[k]) return;                    // first report wins — both players broadcast
    // ── SAFETY: a bracket match must resolve to EXACTLY one of its two players ──
    // If the reported winner id doesn't exactly match a slot (id case/format drift, a stale
    // draw, an empty id, etc.) the render used to mark BOTH players "L" and advance nobody.
    // Coerce winner/loser to the real pair members so there is always one W and one L.
    (function(){
      var pr=TB.pairs[p.idx]||[]; if(pr.length<2) return;
      var a=String(pr[0]), b=String(pr[1]);
      var w=String(p.winner==null?'':p.winner), l=String(p.loser==null?'':p.loser);
      var lc=function(x){ return x.trim().toLowerCase(); };
      var wIsA=(w===a)||(lc(w)===lc(a)), wIsB=(w===b)||(lc(w)===lc(b));
      if(!wIsA && !wIsB){                        // winner id matches neither slot → derive it
        var lIsA=(l===a)||(lc(l)===lc(a)), lIsB=(l===b)||(lc(l)===lc(b));
        if(lIsB) wIsA=true; else if(lIsA) wIsB=true; else wIsA=true;   // last resort: slot A advances
      }
      p.winner = wIsA ? a : b;
      p.loser  = wIsA ? b : a;
    })();
    TB.results[k]={ winner:String(p.winner), loser:String(p.loser) };
    if(SP && SP.idx===p.idx){ spStop(); }              // the match I was watching just ended
    var S=p.s||{}, K=p.k||{};
    Object.keys(S).forEach(function(id){ if(!TB.stats[id]) TB.stats[id]={score:0,kos:0};
      TB.stats[id].score=Math.max(TB.stats[id].score||0, S[id]||0); });
    Object.keys(K).forEach(function(id){ if(!TB.stats[id]) TB.stats[id]={score:0,kos:0};
      TB.stats[id].kos=(TB.stats[id].kos||0)+(K[id]||0); });
    TB.out.push({ id:String(p.loser), round:TB.round });
    bkRender();
    bkCheckRound();
    setTimeout(spAuto, 1600);                         // hop to the next match that's still running
  }
  function bkCheckRound(){
    if(!TB || TB.done) return;
    if(Object.keys(TB.results).length < TB.pairs.length) return;   // matches still running
    if(TB.botId && TB.botRes===null) return;                       // the bot match is still running
    if(TB._wd){ clearTimeout(TB._wd); TB._wd=null; }
    var winners=TB.pairs.map(function(pr,i){ var r=TB.results[bkKey(TB.round,i)]; return r?r.winner:null; })
                        .filter(function(x){ return !!x; });
    if(TB.botId && TB.botRes==='win') winners.push(TB.botId);      // beat the Lv7 bot → advances
    TB.alive=winners.sort(function(a,b){ return TB.order.indexOf(a)-TB.order.indexOf(b); });
    if(TB.alive.length<=1){ setTimeout(bkFinish, 1200); return; }
    var nxt=bkRoundName(TB.alive.length), t=5;
    if(TB._cd) clearInterval(TB._cd);
    bkRender('✅ All winners decided · '+nxt+' starts in '+t+'…');
    TB._cd=setInterval(function(){
      if(!TB || TB.done){ clearInterval(TB._cd); TB._cd=null; return; }
      t--;
      if(t>0){ bkRender('✅ All winners decided · '+nxt+' starts in '+t+'…'); try{ sfxTick(); }catch(e){} }
      else { clearInterval(TB._cd); TB._cd=null; bkStartRound(); }
    }, 1000);
  }
  function bkFinish(){
    if(!TB || TB.done) return;
    spStop(); try{ tetLiveStop(); }catch(_ls){}
    TB.done=true;
    if(TB._cd){ clearInterval(TB._cd); TB._cd=null; }
    if(TB._wd){ clearTimeout(TB._wd); TB._wd=null; }
    var champ=TB.alive[0]||null, me=String(eid());
    var order=[];
    if(champ) order.push({ id:champ, round:9999 });
    TB.out.slice().sort(function(a,b){
      var sa=(TB.stats[a.id]&&TB.stats[a.id].score)||0, sb=(TB.stats[b.id]&&TB.stats[b.id].score)||0;
      return (b.round-a.round) || (sb-sa);        // knocked out later = better placement
    }).forEach(function(o){ if(!champ || o.id!==champ) order.push(o); });
    var final=order.map(function(o,i){ return { employee_id:o.id, full_name:bkName(o.id), placement:i+1,
      score:(TB.stats[o.id]&&TB.stats[o.id].score)||0, kos:(TB.stats[o.id]&&TB.stats[o.id].kos)||0 }; });
    TB.final=final;
    var myRank=0; final.forEach(function(f){ if(String(f.employee_id)===me) myRank=f.placement; });
    // The champion is authoritative: they post the full ranking → backend pays the prizes.
    if(champ && String(champ)===me){
      if(TB.nightly || TB.grand) bkReportRanking(final);   // JMB Points ONLY for nightly / grand — casual "Play" brackets award nothing
    }
    bkShowFinal(final, myRank, champ);
    if(champ) setTimeout(function(){ showCeremony(champ, final); }, 800);   // …and the ceremony
  }

  // ════════════════════════════════════════════════════════════════════════
  //  THE CEREMONY — the champion gets a moment, and everyone watches it.
  // ════════════════════════════════════════════════════════════════════════
  function showCeremony(champ, final){
    var stage = el('tet-ceremony');
    if(!stage || !TB) return;
    var grand = !!TB.grand;
    var mine  = (String(champ) === String(eid()));
    var name  = bkName(champ);
    var ph    = (typeof rkPhoto==='function') ? rkPhoto(champ) : '';
    var row   = final.filter(function(f){ return String(f.employee_id)===String(champ); })[0] || {};
    var rounds= TB.round || 1;
    var second= final[1], third = final[2];

    stage.className = 'tet-cer' + (grand ? ' grand' : '');
    stage.style.display = 'flex';
    stage.innerHTML =
      '<div class="cer-inner">' +
        '<div class="cer-kicker">'+(grand ? 'CHAMPION OF THE WEEK' : 'TONIGHT’S CHAMPION')+'</div>' +
        '<div class="cer-crown">'+(grand ? '👑' : '🏆')+'</div>' +
        '<div class="cer-av">'+(ph ? '<img src="'+ph+'" alt="">' : '<span>'+esc(String(name).charAt(0).toUpperCase())+'</span>')+'</div>' +
        '<div class="cer-name">'+esc(name)+'</div>' +
        (mine ? '<div class="cer-you">THAT’S YOU</div>' : '') +
        '<div class="cer-stats">' +
          '<div><b>'+rounds+'</b><span>rounds won</span></div>' +
          '<div><b>'+(row.score||0)+'</b><span>best score</span></div>' +
          '<div><b>+'+(grand ? '1,200' : '400')+'</b><span>JMB Points</span></div>' +
        '</div>' +
        (second ? '<div class="cer-podium">🥈 '+esc(second.full_name)+
                  (third ? '<span>🥉 '+esc(third.full_name)+'</span>' : '')+'</div>' : '') +
        (grand ? '<div class="cer-note">The crown is theirs until next Sunday.</div>' : '') +
        '<button class="cer-x" onclick="closeCeremony()">Close</button>' +
      '</div>';

    try{ sfxWin(); }catch(e){}
    try{ tetConfetti({ count: grand ? 320 : 200, dur: grand ? 5200 : 3400 }); }catch(e){}
    if(mine){ try{ if(navigator.vibrate) navigator.vibrate([40,60,40,60,140]); }catch(e){} }
  }
  window.closeCeremony = function(){
    var s = el('tet-ceremony');
    if(s){ s.style.display='none'; s.innerHTML=''; }
  };
  function bkReportRanking(arr){
    try{
      fetch(APPS_SCRIPT_URL+'?action=tourney_report&tid='+encodeURIComponent(TB.tid)+'&ranking='+encodeURIComponent(JSON.stringify(arr))+'&_='+Date.now())
        .then(function(){ try{ if(typeof loadPoints==='function') setTimeout(loadPoints, 4000); }catch(e){} })
        .catch(function(){});
    }catch(e){}
  }

  // ── Live spectating: knocked out (or on a bye) → watch any match that's still running ──
  var SP=null;   // {idx, a, b, st:{id:{grid,score,lines,alive,kos}}, chan}
  var EYE_SVG='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var BOT_SVG='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 4h6"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/></svg>';

  function bkImPlaying(){
    if(!TB) return false;
    var me=String(eid()), yes=false;
    TB.pairs.forEach(function(pr,i){ if((pr[0]===me||pr[1]===me) && !TB.results[bkKey(TB.round,i)]) yes=true; });
    if(TB.botId===me && TB.botRes===null) yes=true;   // my Lv7 bot match is still running
    return yes;
  }
  // My outcome in the CURRENT round: 'won' | 'lost' | null (not decided / not paired)
  function bkMyResult(){
    if(!TB) return null;
    var me=String(eid()), out=null;
    Object.keys(TB.results).forEach(function(k){
      var r=TB.results[k];
      if(r.winner===me) out='won'; else if(r.loser===me) out='lost';
    });
    if(TB.botId===me && TB.botRes!==null) out=(TB.botRes==='win'?'won':'lost');
    return out;
  }
  function bkLiveMatches(){
    if(!TB) return [];
    var out=[]; TB.pairs.forEach(function(pr,i){ if(!TB.results[bkKey(TB.round,i)]) out.push(i); });
    return out;
  }
  function spStop(){
    if(SP && SP.chan){ try{ supaClient.removeChannel(SP.chan); }catch(e){} }
    try{ reelMusStop(); }catch(e){}
    SP=null;
  }
  window.tetBkWatch=function(i){ bkWatch(i); };
  window.tetBkBack=function(){ spStop(); bkRender(); };
  function bkWatch(idx){
    if(!TB || TB.done) return;
    if(M && M.playing && !M.ended) return;                  // never while I'm in my own match
    var pr=TB.pairs[idx]; if(!pr) return;
    if(TB.results[bkKey(TB.round, idx)]) return;            // already finished
    spStop();
    // Same identity-keyed channel the two players use (see bkPlay) — so spectating hits the right board.
    var _pk=[String(pr[0]), String(pr[1])].sort().join('_');
    var mid='BK-'+TB.tid+'-r'+TB.round+'-'+_pk;
    SP={ idx:idx, a:String(pr[0]), b:String(pr[1]), st:{} };
    SP.st[SP.a]={ grid:null, score:0, lines:0, alive:true, kos:0, skin:'classic' };
    SP.st[SP.b]={ grid:null, score:0, lines:0, alive:true, kos:0, skin:'classic' };
    try{
      SP.chan=supaClient.channel('tetris-'+mid,{config:{broadcast:{self:false}}})
        .on('broadcast',{event:'state'}, function(p){ spState(p.payload); })
        .on('broadcast',{event:'ko'},    function(p){ spKo(p.payload); })
        .on('broadcast',{event:'over'},  function(p){ spOver(p.payload); })
        .subscribe();
    }catch(e){}
    /* 📺 FULL BROADCAST MODE: arena music at crowd volume — spectators get the show. */
    try{ ac(); reelMusStart(); if(_reelMusBus) _reelMusBus.gain.value=0.9; }catch(e){}
    spRender();
  }
  // Nothing to do but watch → jump into the first live match automatically.
  function spAuto(){
    if(!TB || TB.done || SP || bkImPlaying()) return;
    if(M && M.playing && !M.ended) return;
    var live=bkLiveMatches();
    if(live.length) bkWatch(live[0]);
  }
  /* Rows currently holding garbage (value 8) — the delta between states tells us a hit landed. */
  function _spGRows(g){ if(!g) return 0; var n=0; for(var y=0;y<H;y++){ var row=g[y]; if(!row) continue; for(var x=0;x<W;x++){ if(row[x]===8){ n++; break; } } } return n; }
  function _spSide(from){ return String(from)===String(SP.a)?'a':'b'; }
  /* The spectator FEELS the match: clears ring out, garbage lands with a boom and rocks the
     victim's board (scaled like the players' own combo shake), KOs detonate. */
  function spFx(sideKey, kind, n){
    var st=el('sb-stage-'+sideKey);
    if(kind==='clear'){
      try{ beep(520+Math.min(n,4)*150, 0.09, 'triangle', 0.3); if(n>=4){ beep(1040,0.14,'triangle',0.3); } }catch(e){}
      if(st){ st.classList.remove('clearpop'); void st.offsetWidth; st.classList.add('clearpop'); setTimeout(function(){ st.classList.remove('clearpop'); },340); }
    } else if(kind==='hit'){
      try{ sfxGarbage(); if(n>=4) beep(80,0.3,'sawtooth',0.38); }catch(e){}
      if(st){
        var q=(n>=7)?'q4':(n>=4)?'q3':(n>=2)?'q2':'q1';
        st.classList.remove('q1','q2','q3','q4'); void st.offsetWidth; st.classList.add(q);
        setTimeout(function(){ st.classList.remove('q1','q2','q3','q4'); },780);
        st.classList.remove('hitflash'); void st.offsetWidth; st.classList.add('hitflash');
        setTimeout(function(){ st.classList.remove('hitflash'); },420);
      }
    } else if(kind==='ko'){
      try{ _specBomb(); }catch(e){ try{ beep(70,0.5,'sawtooth',0.4); }catch(_){} }
      if(st){ st.classList.remove('q1','q2','q3','q4'); void st.offsetWidth; st.classList.add('q4'); setTimeout(function(){ st.classList.remove('q4'); },780); }
    }
  }
  function spState(p){
    if(!SP || !p) return;
    var s=SP.st[String(p.from)]; if(!s) return;
    var prevL=s._pl||0, prevG=s._pg||0, hadGrid=!!s.grid;
    s.score=p.score||0; s.lines=p.lines||0; s.alive=(p.alive!==false);
    if(p.sk && DESIGNS[p.sk] && p.sk !== s.skin){   // they're wearing a design — show it
      s.skin = p.sk;
      spRender();                                   // re-label with the design name
    }
    if(p.grid) s.grid=p.grid.split('|').map(function(rw){ return rw.split('').map(Number); });
    var gRows=_spGRows(s.grid);
    if(hadGrid){                                     // no fx on the very first snapshot
      if(s.lines>prevL) spFx(_spSide(p.from),'clear', s.lines-prevL);
      if(gRows>prevG)   spFx(_spSide(p.from),'hit',   gRows-prevG);
    }
    s._pl=s.lines; s._pg=gRows;
    spDraw();
  }
  function spKo(p){
    if(!SP || !p) return;
    var s=SP.st[String(p.from)]; if(!s) return;
    var prevK=s.kos||0;
    s.kos=p.kos||s.kos; if(p.score!=null) s.score=p.score;
    if((s.kos||0)>prevK) spFx(_spSide(p.from),'ko',1);
    spDraw();
  }
  function spOver(p){ if(!SP || !p) return; var s=SP.st[String(p.from)]; if(s){ s.alive=false; spFx(_spSide(p.from),'ko',1); } spDraw(); }
  function spRender(){
    if(!SP || !TB) return;
    var box=bkPanel(); if(!box) return;
    var lbl=el('tet-arena-label'); if(lbl) lbl.textContent='📺 Watching Live';

    // A proper broadcast: both boards at NATIVE resolution (200×400 → 20px cells, up from
    // a 100×200 canvas stretched to ~15px), each under a versus header with the player's
    // photo, name, equipped design and KO pips. The old 320px panel was a status glance;
    // this is meant to be watched.
    function side(id, s2){
      var ph=(typeof rkPhoto==='function')?rkPhoto(id):'';
      var av=ph ? ('<img src="'+ph+'" alt="">')
                : ('<i>'+esc(String(bkName(id)).charAt(0).toUpperCase()||'?')+'</i>');
      var sk=(SP.st[id]&&SP.st[id].skin)||'classic';
      var skName=(sk!=='classic' && DESIGNS[sk]) ? ('<span class="sb-skin">🎨 '+esc(DESIGNS[sk].name)+'</span>') : '';
      var pips='';
      for(var k=0;k<BK_KOS;k++) pips += '<i class="sb-pip" id="sb-pip-'+s2+'-'+k+'"></i>';
      return '<div class="sb-side" id="sb-side-'+s2+'">'+
          '<div class="sb-head">'+
            '<div class="sb-av">'+av+'</div>'+
            '<div class="sb-id">'+
              '<div class="sb-nm">'+esc(bkName(id))+'</div>'+
              '<div class="sb-meta"><b id="sb-sc-'+s2+'">0</b> pts · <span id="sb-ln-'+s2+'">0</span> lines '+skName+'</div>'+
            '</div>'+
          '</div>'+
          '<div class="sb-stage" id="sb-stage-'+s2+'">'+
            '<canvas id="sp-cv-'+s2+'" width="200" height="400"></canvas>'+
            '<div class="sb-out" id="sb-out-'+s2+'">KO</div>'+
          '</div>'+
          '<div class="sb-pips">'+pips+'<span class="sb-kolbl">KO</span></div>'+
        '</div>';
    }

    box.innerHTML =
      '<div class="sb-wrap">'+
        '<div class="sb-live"><i></i> LIVE · '+esc(TB.roundLabel||'MATCH')+'</div>'+
        '<div class="sb-cast">'+
          side(SP.a,'a')+
          '<div class="sb-vs">VS</div>'+
          side(SP.b,'b')+
        '</div>'+
        '<button class="sb-back" onclick="tetBkBack()">← Back to bracket</button>'+
      '</div>';

    status('📺 Watching '+esc(bkName(SP.a))+' vs '+esc(bkName(SP.b)));
    spDraw();
  }

  function spDraw(){
    if(!SP) return;
    [['a',SP.a],['b',SP.b]].forEach(function(pair){
      var s2=pair[0], st=SP.st[pair[1]]; if(!st) return;
      var cv=el('sp-cv-'+s2); if(!cv) return;
      var ctx=cv.getContext('2d'), cs=cv.width/W;
      ctx.clearRect(0,0,cv.width,cv.height);
      grid(ctx,cv,cs);
      // each board in THAT player's equipped design
      var skin = st.skin || 'classic';
      if(st.grid){ for(var y=0;y<H;y++) for(var x=0;x<W;x++){
        var v=(st.grid[y]&&st.grid[y][x])||0;
        if(v){ blockAs(ctx, x, y, cs, (v===8?'#5b6b82':(COLORS[v]||'#5b6b82')), skin); } } }

      var sc=el('sb-sc-'+s2); if(sc) sc.textContent=Number(st.score||0).toLocaleString();
      var ln=el('sb-ln-'+s2); if(ln) ln.textContent=(st.lines||0);
      for(var k=0;k<BK_KOS;k++){
        var pip=el('sb-pip-'+s2+'-'+k);
        if(pip) pip.classList.toggle('on', k < (st.kos||0));
      }
      var out=el('sb-out-'+s2); if(out) out.style.display = st.alive ? 'none' : 'flex';
      var sd=el('sb-side-'+s2); if(sd) sd.classList.toggle('dead', !st.alive);
    });
  }

  // ── Bracket UI (rendered into the arena panel) ──
  function bkPanel(){
    openOverlay();                                 // keep the arena visible between matches
    var oc=el('tet-opp-col'); if(oc) oc.style.display='none';
    var ar=el('tet-arena-col'); if(ar) ar.style.display='block';
    var ctl=el('tet-controls'); if(ctl) ctl.style.display='none';
    // While you're watching (not playing), your own empty board and its rails are just
    // dead weight. Hide them and hand the whole cabinet to the broadcast.
    var body=document.querySelector('#tet-overlay .arc-body');
    if(body) body.classList.add('panel-mode');
    var box=el('tet-arena');
    if(box){ box.style.maxHeight='none'; box.style.maxWidth='none'; }
    return box;
  }
  // Give the cabinet back when a match starts.
  function bkPanelOff(){
    var body=document.querySelector('#tet-overlay .arc-body');
    if(body) body.classList.remove('panel-mode');
    var box=el('tet-arena');
    if(box){ box.style.maxHeight=''; box.style.maxWidth=''; }
  }
  function bkSlot(id, r, me){
    var cls='bk-slot'+(id===me?' me':'');
    if(r) cls+=(r.winner===id?' win':' lose');
    var ph=(typeof rkPhoto==='function')?rkPhoto(id):'';
    var av=ph?('<img src="'+ph+'" alt="">'):('<i>'+esc(String(bkName(id)).charAt(0).toUpperCase()||'?')+'</i>');
    var badge=r?(r.winner===id?'<b>W</b>':'<b class="l">L</b>'):'';
    return '<div class="'+cls+'">'+av+'<span>'+esc(bkName(id))+beastChips(id)+'</span>'+badge+'</div>';
  }
  function bkRender(msg){
    if(!TB) return;
    if(M && M.bk && M.playing && !M.ended) return;   // never repaint over my own live board
    if(SP){ spRender(); return; }                    // I'm watching a match — keep the feed up
    var box=bkPanel(); if(!box) return;
    var lbl=el('tet-arena-label'); if(lbl) lbl.textContent='🏆 Tournament Bracket';
    var me=String(eid());
    var canWatch=!bkImPlaying();
    var g=bkProg(), tot=g.tot, done=g.done;
    if(msg==null && canWatch && tot && done<tot){          // default line for anyone waiting on the round
      var mine=bkMyResult();
      msg = (mine==='won') ? bkWaitText()
          : (mine==='lost') ? 'You are out — watching the matches live.'
          : null;
    }
    var h='<div class="bk-wrap">';
    h+='<div class="bk-round-ttl">'+esc(TB.roundLabel||'Bracket')+' · '+TB.alive.length+' player'+(TB.alive.length!==1?'s':'')+'</div>';
    if(tot) h+='<div class="bk-prog"><div class="bk-prog-bar" style="width:'+Math.round((done/tot)*100)+'%"></div></div>'+
              '<div class="bk-prog-lbl">'+done+' of '+tot+' match'+(tot!==1?'es':'')+' decided</div>';
    TB.pairs.forEach(function(pr,i){
      var r=TB.results[bkKey(TB.round,i)], mine=(pr[0]===me||pr[1]===me);
      var eye=(!r && !mine && canWatch) ? '<button class="bk-eye" onclick="tetBkWatch('+i+')">'+EYE_SVG+' WATCH</button>' : '';
      h+='<div class="bk-match'+(mine?' mine':'')+(mine&&!r?' live':'')+'">'+
         bkSlot(pr[0], r, me)+'<div class="bk-vs">VS</div>'+bkSlot(pr[1], r, me)+eye+'</div>';
    });
    if(TB.botId){
      var bid=TB.botId, mineB=(bid===me), decided=(TB.botRes!==null);
      var pr2=decided ? { winner:(TB.botRes==='win'?bid:'__BOT__') } : null;
      var botCls='bk-slot bot'+(decided ? (TB.botRes==='lose'?' win':' lose') : '');
      var botBadge=decided ? (TB.botRes==='lose'?'<b>W</b>':'<b class="l">L</b>') : '';
      h+='<div class="bk-match bot'+(mineB?' mine':'')+(mineB&&!decided?' live':'')+'">'+
         bkSlot(bid, pr2, me)+'<div class="bk-vs">VS</div>'+
         '<div class="'+botCls+'"><i class="bi">'+BOT_SVG+'</i><span>'+esc(bkBot().name)+' · Lv7</span>'+botBadge+'</div></div>';
    }
    if(msg) h+='<div class="bk-msg">'+esc(msg)+'</div>';
    h+='</div>';
    box.innerHTML=h;
    if(msg) status(msg);
  }
  function bkShowFinal(final, myRank, champ){
    var box=bkPanel(); if(!box) return;
    var lbl=el('tet-arena-label'); if(lbl) lbl.textContent='🏆 Final Ranking';
    var NP=bkPrizes((TB&&TB.tid)||''), me=String(eid());
    box.innerHTML='<div style="width:320px;">'+final.map(function(p){
      var medal=p.placement<=3?['🥇','🥈','🥉'][p.placement-1]:(p.placement+'.');
      var mine=String(p.employee_id)===me;
      var prize = (TB.nightly || TB.grand) ? (p.placement<=3?' <span style="color:#fbbf24;font-size:10px;font-weight:800;">+'+NP[p.placement-1]+' pts</span>':'')
                             : (p.placement===1?' <span style="color:#fbbf24;font-size:10px;font-weight:800;">CHAMPION</span>':'');
      return '<div style="display:flex;align-items:center;gap:10px;padding:9px 11px;margin-bottom:6px;border-radius:11px;background:'+(mine?'rgba(255,107,26,.16)':'#ffffff')+';border:1px solid '+(p.placement===1?'rgba(251,191,36,.5)':(mine?'rgba(255,107,26,.4)':'rgba(255,255,255,.08)'))+';">'+
        '<div style="width:30px;text-align:center;font-weight:800;font-size:16px;">'+medal+'</div>'+
        '<div style="flex:1;text-align:left;font-size:13px;font-weight:600;">'+esc(p.full_name)+(mine?' <span style="color:#fbbf24;font-size:10px;">(you)</span>':'')+prize+'</div>'+
        '<div style="font-size:12px;color:#9fb0d6;">'+p.score+' pts<br><span style="font-size:10px;">KO '+p.kos+'</span></div></div>';
    }).join('')+'</div>';
    var wn=champ?bkName(champ):'';
    if(champ && String(champ)===me){ status('🏆 You are the CHAMPION of the tournament!'); try{ sfxWin(); }catch(e){} }
    else if(champ){ status('🏆 '+esc(wn)+' wins the tournament!'); }
    else { status('Tournament over.'); }
    if(myRank===1 || (TB.nightly && myRank>=1 && myRank<=3)){
      try{ tetConfetti({count: myRank===1?200:130, dur: myRank===1?3200:2400}); }catch(e){}
    }
  }

  // ════════════════ ALL-TIME TETRIS RANKINGS (premium dashboard) ════════════════
  var _infAmb=null, _infBg=null;
  var _infScenes={}, _infSizers={}, _infResizeBound=false;
  /* Season particle. Was a molten ember; now an ice shard with a cold halo. Same sprite size and
     draw path, so the whole scene renderer below is untouched — only the pixels changed. */
  /* ══════════ SEASON BACKDROP — A REAL FOREST ══════════
     Built from scratch as an environment, not a color wash. Three cached painting layers:
       FAR   — misty depth: rows of distant trees fading into haze
       NEAR  — the frame: big bark-textured trunks entering from both sides, branches
               reaching inward, and a full canopy of individually-shaded leaf clusters
               hanging over the top edge
       UNDER — the forest floor: layered fern fronds, grass, glowing mushrooms, rocks
     Each layer is painted ONCE per resize into an offscreen canvas; per frame we only
     composite them (with a slow breathing sway), plus live god-rays, rolling mist,
     blinking fireflies and the odd falling leaf. Same function names and canvas ids as
     every previous season, so all call sites are untouched. */
  function startInfernoScene(cardSel,cvId,modalId){ try{
    if(_infScenes[cvId]) return;
    var card=document.querySelector(cardSel), cv=el(cvId); if(!card||!cv) return;
    var ctx=cv.getContext('2d'), dpr=Math.min(2,window.devicePixelRatio||1);
    var FAR=null, NEAR=null, UNDER=null;
    var SEED=90210; function RND(){ SEED=(SEED*1103515245+12345)>>>0; return (SEED>>>16)/65535; }

    /* one shaded leaf-cluster: dark mass → mid leaves → sunlit crown. The 3 offset blobs are
       what makes it read as a round living clump instead of a flat green circle. */
    function clump(T,x,y,r,tone){
      var dk=['#071c0e','#0a2413','#0d2b18'][tone]||'#0a2413';
      var md=['#123a20','#175031','#1c5c30'][tone]||'#175031';
      var hi=['#2e7a44','#3f8a4b','#4f9e55'][tone]||'#3f8a4b';
      T.fillStyle=dk; T.beginPath(); T.ellipse(x+r*0.14,y+r*0.18,r,r*0.82,0,0,6.283); T.fill();
      T.fillStyle=md; T.beginPath(); T.ellipse(x,y,r*0.85,r*0.68,0,0,6.283); T.fill();
      T.fillStyle=hi; T.beginPath(); T.ellipse(x-r*0.26,y-r*0.26,r*0.44,r*0.34,0,0,6.283); T.fill();
      // a few individual leaves poking out of the clump silhouette
      for(var l=0;l<5;l++){ var la=RND()*6.283, lr=r*(0.8+RND()*0.3);
        T.fillStyle=md; T.save(); T.translate(x+Math.cos(la)*lr,y+Math.sin(la)*lr*0.75); T.rotate(la);
        T.beginPath(); T.ellipse(0,0,r*0.22,r*0.09,0,0,6.283); T.fill(); T.restore(); }
    }
    function trunk(T,x,yTop,yBot,w0,lean){
      // bark: dark column, side shading, fissure strokes, moss on one flank
      var g=T.createLinearGradient(x-w0,0,x+w0,0);
      g.addColorStop(0,'#050d07'); g.addColorStop(0.45,'#14241a'); g.addColorStop(0.75,'#0a150d'); g.addColorStop(1,'#03080a');
      T.fillStyle=g; T.beginPath();
      T.moveTo(x-w0,yBot); T.quadraticCurveTo(x-w0*0.8+lean*0.4,(yTop+yBot)/2, x-w0*0.62+lean,yTop);
      T.lineTo(x+w0*0.62+lean,yTop); T.quadraticCurveTo(x+w0*0.85+lean*0.4,(yTop+yBot)/2, x+w0,yBot); T.closePath(); T.fill();
      T.strokeStyle='rgba(0,0,0,.55)'; T.lineCap='round';
      for(var f=0;f<4;f++){ var fx=x-w0*0.5+f*w0*0.34+lean*0.5;
        T.lineWidth=Math.max(1,w0*0.06); T.beginPath(); T.moveTo(fx,yBot);
        T.bezierCurveTo(fx+w0*0.12,yBot-(yBot-yTop)*0.35, fx-w0*0.1,yBot-(yBot-yTop)*0.7, fx+lean*0.6,yTop); T.stroke(); }
      T.fillStyle='rgba(38,84,45,.55)';
      for(var m=0;m<7;m++){ var my=yBot-(yBot-yTop)*(0.1+m*0.13);
        T.beginPath(); T.ellipse(x-w0*0.55+lean*(1-(my-yTop)/(yBot-yTop))*0.8, my, w0*(0.16+RND()*0.1), w0*0.09, 0.3,0,6.283); T.fill(); }
    }
    function fern(T,x,y,len,ang,col){
      T.strokeStyle=col; T.lineCap='round'; T.lineWidth=Math.max(1,len*0.03);
      T.beginPath(); T.moveTo(x,y); T.quadraticCurveTo(x+Math.cos(ang)*len*0.5,y+Math.sin(ang)*len*0.62,x+Math.cos(ang)*len,y+Math.sin(ang)*len*0.8); T.stroke();
      for(var k2=1;k2<=6;k2++){ var tt2=k2/7,bx=x+Math.cos(ang)*len*tt2*0.94,by=y+Math.sin(ang)*len*tt2*0.78,ln=len*0.2*(1-tt2*0.7);
        T.lineWidth=Math.max(0.7,len*0.016);
        T.beginPath(); T.moveTo(bx,by); T.quadraticCurveTo(bx+ln*0.4,by-ln*0.5,bx+ln*0.8,by-ln*0.9);
        T.moveTo(bx,by); T.quadraticCurveTo(bx-ln*0.35,by-ln*0.42,bx-ln*0.72,by-ln*0.8); T.stroke(); }
    }
    function build(){
      var w=cv.width, h=cv.height; if(w<40||h<40){ FAR=NEAR=UNDER=null; return; }
      SEED=90210;
      /* ── FAR: depth + haze ── */
      FAR=document.createElement('canvas'); FAR.width=w; FAR.height=h;
      var F=FAR.getContext('2d');
      var sky=F.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,'#04150b'); sky.addColorStop(0.45,'#083019'); sky.addColorStop(0.78,'#0a361d'); sky.addColorStop(1,'#051709');
      F.fillStyle=sky; F.fillRect(0,0,w,h);
      for(var row=0;row<4;row++){                                  // rows of distant trees
        var ry=h*(0.42+row*0.15), al=0.16+row*0.14;
        F.globalAlpha=al;
        for(var td=0;td<14;td++){ var tx=((td+RND()*0.6)/14)*w*1.06-w*0.03;
          var th=h*(0.12+RND()*0.1)*(1+row*0.28), tw2=th*0.34;
          F.fillStyle=['#0e3b20','#11482a','#155433','#0d3d22'][row];
          F.beginPath(); F.ellipse(tx,ry-th*0.62,tw2,th*0.62,0,0,6.283); F.fill();     // crown
          F.fillRect(tx-th*0.022,ry-th*0.35,th*0.044,th*0.4); }                        // stem
        // haze band in front of each row
        var hz=F.createLinearGradient(0,ry-h*0.1,0,ry+h*0.04);
        hz.addColorStop(0,'rgba(160,220,190,0)'); hz.addColorStop(0.75,'rgba(160,220,190,'+(0.06+row*0.015)+')'); hz.addColorStop(1,'rgba(160,220,190,0)');
        F.globalAlpha=1; F.fillStyle=hz; F.fillRect(0,ry-h*0.1,w,h*0.14);
      }
      F.globalAlpha=1;
      /* ── NEAR: framing trunks + overhead canopy ── */
      NEAR=document.createElement('canvas'); NEAR.width=w; NEAR.height=h;
      var N=NEAR.getContext('2d');
      trunk(N, w*0.035, -h*0.05, h*1.02, w*0.045, w*0.012);
      trunk(N, w*0.965, -h*0.05, h*1.02, w*0.05, -w*0.014);
      if(w>900*dpr){ trunk(N, w*0.24, -h*0.05, h*0.42, w*0.02, w*0.006); trunk(N, w*0.78, -h*0.05, h*0.36, w*0.018, -w*0.006); }
      // branches reaching inward from the two big trunks
      N.strokeStyle='#0c1810'; N.lineCap='round';
      [[w*0.05,h*0.10,1],[w*0.06,h*0.24,1],[w*0.95,h*0.13,-1],[w*0.94,h*0.30,-1]].forEach(function(br){
        N.lineWidth=w*0.008;
        N.beginPath(); N.moveTo(br[0],br[1]);
        N.quadraticCurveTo(br[0]+br[2]*w*0.09,br[1]-h*0.05, br[0]+br[2]*w*0.17,br[1]-h*0.03); N.stroke();
        clump(N, br[0]+br[2]*w*0.17, br[1]-h*0.03, w*0.03+RND()*w*0.012, 1);
        clump(N, br[0]+br[2]*w*0.10, br[1]-h*0.055, w*0.022+RND()*w*0.01, 0);
      });
      // THE CANOPY — two depths of leaf clusters hanging over the top edge, denser at corners
      for(var cnp=0;cnp<2;cnp++){
        var n2=Math.round(w/(90*dpr))+6;
        for(var i2=0;i2<n2;i2++){
          var cx2=(i2/(n2-1))*w, edge=Math.min(cx2,w-cx2)/w;               // 0 at corners → .5 mid
          var dip=h*(0.055+0.10*(1-edge*1.6>0?1-edge*1.6:0))+RND()*h*0.03+cnp*h*0.02;
          clump(N, cx2, dip*(cnp?0.72:1), (w*0.028+RND()*w*0.02)*(cnp?0.8:1), cnp?2:1);
        }
      }
      // vines dropping from the canopy
      N.strokeStyle='rgba(46,122,68,.7)';
      for(var v4=0;v4<6;v4++){ var vx2=w*(0.1+RND()*0.8), vl2=h*(0.08+RND()*0.13);
        N.lineWidth=Math.max(1,w*0.0016);
        N.beginPath(); N.moveTo(vx2,h*0.04); N.quadraticCurveTo(vx2+w*0.008,h*0.04+vl2*0.5, vx2-w*0.005,h*0.04+vl2); N.stroke();
        N.fillStyle='rgba(46,122,68,.8)';
        N.beginPath(); N.ellipse(vx2-w*0.005,h*0.04+vl2,w*0.006,w*0.003,0.4,0,6.283); N.fill(); }
      /* ── UNDER: the forest floor ── */
      UNDER=document.createElement('canvas'); UNDER.width=w; UNDER.height=h;
      var U=UNDER.getContext('2d');
      var fl=U.createLinearGradient(0,h*0.86,0,h);
      fl.addColorStop(0,'rgba(4,16,8,0)'); fl.addColorStop(0.5,'rgba(4,16,8,.85)'); fl.addColorStop(1,'#030c05');
      U.fillStyle=fl; U.fillRect(0,h*0.86,w,h*0.14);
      for(var g2=0;g2<Math.round(w/(14*dpr));g2++){                      // grass blades
        var gx2=RND()*w, gh2=h*(0.02+RND()*0.035);
        U.strokeStyle='rgba(18,58,32,'+(0.5+RND()*0.4)+')'; U.lineWidth=Math.max(1,w*0.0012); U.lineCap='round';
        U.beginPath(); U.moveTo(gx2,h); U.quadraticCurveTo(gx2+w*0.004,h-gh2*0.6, gx2+(RND()-0.5)*w*0.012,h-gh2); U.stroke(); }
      for(var fr2=0;fr2<Math.round(w/(160*dpr))+4;fr2++){                // fern fronds
        var fx3=RND()*w;
        fern(U,fx3,h*0.995,h*(0.07+RND()*0.06), -Math.PI/2+(RND()-0.5)*1.1, 'rgba(22,74,40,.85)');
        if(RND()<0.5) fern(U,fx3+w*0.012,h*0.995,h*(0.05+RND()*0.04), -Math.PI/2+(RND()-0.5)*1.3, 'rgba(15,54,28,.8)');
      }
      for(var ms2=0;ms2<5;ms2++){                                        // glowing mushrooms
        var mx3=w*(0.06+RND()*0.88), my3=h*(0.965+RND()*0.02), mr=w*0.005+RND()*w*0.004;
        var mg2=U.createRadialGradient(mx3,my3-mr,0,mx3,my3-mr,mr*5);
        mg2.addColorStop(0,'rgba(190,242,140,.5)'); mg2.addColorStop(1,'rgba(190,242,140,0)');
        U.fillStyle=mg2; U.fillRect(mx3-mr*5,my3-mr*6,mr*10,mr*10);
        U.fillStyle='#d9f99d'; U.beginPath(); U.arc(mx3,my3-mr,mr,Math.PI,0); U.fill();
        U.fillStyle='#a3c76a'; U.fillRect(mx3-mr*0.2,my3-mr,mr*0.4,mr);
      }
      for(var rk2=0;rk2<4;rk2++){                                        // mossy rocks
        var rx2=w*(0.1+RND()*0.8), rr3=w*(0.008+RND()*0.01);
        U.fillStyle='#0d1a10'; U.beginPath(); U.ellipse(rx2,h*0.99,rr3,rr3*0.55,0,Math.PI,0); U.fill();
        U.fillStyle='rgba(38,84,45,.7)'; U.beginPath(); U.ellipse(rx2-rr3*0.2,h*0.99-rr3*0.4,rr3*0.5,rr3*0.2,0,0,6.283); U.fill(); }
    }
    function size(){ var r=card.getBoundingClientRect(); cv.width=Math.max(2,Math.round(r.width*dpr)); cv.height=Math.max(2,Math.round(r.height*dpr)); build(); }
    size(); _infSizers[cvId]=size;

    // live particles: fireflies + falling leaves
    var em=[]; function reset(e,init){ e.leaf=Math.random()<0.2;
      e.x=Math.random()*cv.width; e.y=init?Math.random()*cv.height:(e.leaf?cv.height*0.06:cv.height*(0.3+Math.random()*0.65));
      e.r=(e.leaf?(1.6+Math.random()*2.2):(0.9+Math.random()*1.7))*dpr;
      e.vy=(e.leaf?(0.22+Math.random()*0.4):((Math.random()-0.5)*0.15))*dpr;
      e.vx=(Math.random()-0.5)*(e.leaf?0.5:0.18)*dpr;
      e.rot=(Math.random()-0.5)*2; e.life=0; e.max=(e.leaf?420:280)+Math.random()*280;
      e.br=0.35+Math.random()*0.5; e.ph=Math.random()*6.283; return e; }
    var NP=Math.min(44,Math.round(cv.width/(32*dpr))); for(var ip=0;ip<NP;ip++) em.push(reset({},true));
    var t0=performance.now();

    function frame(t){ var m=el(modalId); if(!m||!m.classList.contains('open')){ _infScenes[cvId]=null; if(modalId==='tet-rank-modal'){ try{ stopAzeroAmbience(); }catch(e){} } return; }
      var tt=(t-t0)/1000, w=cv.width, h=cv.height;
      if(!FAR) build(); if(!FAR){ _infScenes[cvId]=requestAnimationFrame(frame); return; }
      ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,w,h);
      ctx.drawImage(FAR,0,0);

      // god-rays through the canopy — living light
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(var a2=0;a2<3;a2++){
        var rx=w*(0.2+a2*0.28)+Math.sin(tt*0.06+a2*2.1)*w*0.04, tilt=w*0.12;
        var ag=ctx.createLinearGradient(rx,0,rx+tilt,h*0.9);
        ag.addColorStop(0,'rgba(214,246,180,'+(0.10+0.035*Math.sin(tt*0.35+a2))+')');
        ag.addColorStop(0.55,'rgba(150,220,140,0.035)'); ag.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=ag;
        ctx.beginPath(); ctx.moveTo(rx-w*0.015,0); ctx.lineTo(rx+w*0.05,0);
        ctx.lineTo(rx+tilt+w*0.09,h*0.9); ctx.lineTo(rx+tilt-w*0.06,h*0.9); ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      // rolling mist between the depth rows
      ctx.save(); ctx.globalCompositeOperation='lighter';
      for(var mI=0;mI<3;mI++){
        var my=h*(0.5+mI*0.17), mx=((tt*(5+mI*3)*dpr)%(w+420*dpr))-210*dpr;
        var mg=ctx.createLinearGradient(mx-230*dpr,0,mx+230*dpr,0);
        mg.addColorStop(0,'rgba(190,235,205,0)'); mg.addColorStop(0.5,'rgba(190,235,205,'+(0.05-mI*0.011)+')'); mg.addColorStop(1,'rgba(190,235,205,0)');
        ctx.fillStyle=mg; ctx.fillRect(mx-230*dpr,my-20*dpr,460*dpr,40*dpr);
      }
      ctx.restore();

      // the framing forest, breathing: canopy sways from its top edge, floor from its base
      var sway=Math.sin(tt*0.22)*0.004;
      ctx.save(); ctx.translate(w/2,0); ctx.rotate(sway); ctx.translate(-w/2,0); ctx.drawImage(NEAR,0,0); ctx.restore();
      ctx.save(); ctx.translate(w/2,h); ctx.rotate(-sway*0.6); ctx.translate(-w/2,-h); ctx.drawImage(UNDER,0,0); ctx.restore();

      // fireflies + falling leaves in front of everything
      for(var k=0;k<em.length;k++){ var e=em[k]; e.life++;
        if(e.leaf){
          e.x+=e.vx+Math.sin(tt*1.4+e.ph)*0.5*dpr; e.y+=e.vy;
          if(e.y>h+30||e.life>e.max){ reset(e,false); continue; }
          var la=Math.max(0,1-e.life/e.max)*e.br;
          ctx.save(); ctx.globalAlpha=la; ctx.translate(e.x,e.y); ctx.rotate(e.rot+tt*e.rot);
          ctx.fillStyle='rgba(74,138,60,.85)';
          ctx.beginPath(); ctx.ellipse(0,0,e.r*2.4,e.r*1.1,0,0,6.283); ctx.fill();
          ctx.strokeStyle='rgba(20,50,25,.85)'; ctx.lineWidth=Math.max(0.6,e.r*0.25);
          ctx.beginPath(); ctx.moveTo(-e.r*2,0); ctx.lineTo(e.r*2,0); ctx.stroke();
          ctx.restore(); continue;
        }
        e.x+=e.vx+Math.sin(tt*0.7+e.ph)*0.13*dpr; e.y+=e.vy+Math.cos(tt*0.6+e.ph)*0.1*dpr;
        if(e.x<-30||e.x>w+30||e.y<-30||e.y>h+30||e.life>e.max){ reset(e,false); continue; }
        var pul=0.3+0.7*Math.max(0,Math.sin(tt*2.1+e.ph));
        var al=Math.max(0,1-e.life/e.max)*e.br*pul; if(al<=0.01) continue;
        ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=al;
        var d=e.r*7, fw2=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,d/2);
        fw2.addColorStop(0,'rgba(253,230,138,.95)'); fw2.addColorStop(0.4,'rgba(190,242,100,.5)'); fw2.addColorStop(1,'rgba(190,242,100,0)');
        ctx.fillStyle=fw2; ctx.fillRect(e.x-d/2,e.y-d/2,d,d);
        ctx.fillStyle='rgba(254,252,232,.95)'; ctx.beginPath(); ctx.arc(e.x,e.y,Math.max(0.7,e.r*0.5),0,6.283); ctx.fill();
        ctx.restore(); }

      // vignette pulls the eye to the clearing where the UI lives
      var vg=ctx.createRadialGradient(w*0.5,h*0.46,Math.min(w,h)*0.3,w*0.5,h*0.52,Math.max(w,h)*0.85);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(1,8,3,.55)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
      _infScenes[cvId]=requestAnimationFrame(frame);
    }
    var _frame=frame; frame=function(t){ try{ _frame(t); }catch(err){ try{ ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }catch(_){} _infScenes[cvId]=requestAnimationFrame(frame); } };
    if(!_infResizeBound){ _infResizeBound=true; window.addEventListener('resize',function(){ for(var k in _infSizers){ if(_infScenes[k]&&_infSizers[k]) try{ _infSizers[k](); }catch(e){} } }); }
    _infScenes[cvId]=requestAnimationFrame(frame);
  }catch(e){} }
  function startInfernoBg(){ startInfernoScene('#tet-rank-modal .rk-card','tet-inf-bg','tet-rank-modal'); }
  function stopInfernoBg(){ stopInfernoScene('tet-inf-bg'); }
  function startInfernoBgShop(){ startInfernoScene('#tet-designs-modal .rk-card','tet-inf-bg-shop','tet-designs-modal'); }
  function stopInfernoBgShop(){ stopInfernoScene('tet-inf-bg-shop'); }
  function startInfernoBgSolo(){ startInfernoScene('#tet-solo-modal .rk-card','tet-inf-bg-solo','tet-solo-modal'); }
  function stopInfernoBgSolo(){ stopInfernoScene('tet-inf-bg-solo'); }
  /* ══════════ ABSOLUTE ZERO — hub soundtrack (ROCK) ══════════
     Replaces the Inferno synthwave loop with a driving rock bed: distorted power chords through
     a waveshaper + speaker-cab filter, four-on-the-floor kit with a real backbeat, a moving bass
     and a lead line that only enters every other cycle so the loop doesn't wear out. Still pure
     synthesis — no audio files, nothing to download, nothing to buzz on laptop speakers.
     Old startInfernoAmbience / stopInfernoAmbience names are aliased at the bottom. */
  function startAzeroAmbience(){ try{ stopAzeroAmbience(); }catch(e){}
    /* ══ MOSSY FOREST — hub soundtrack ══
       Replaces the Absolute Zero rock loop with a sunlit-grove cue: a warm pad breathing under
       a kalimba-style plucked pentatonic melody, a soft shaker pulse, a round wooden bass, and
       the occasional birdsong chirp. Pure synthesis — no files, nothing to download. */
    try{ var a=(typeof ac==='function')?ac():null; if(!a) return;
    var res=function(){ try{ if(a.state!=='running') a.resume(); }catch(e){} }; res();
    try{ document.addEventListener('pointerdown',res,{once:true}); }catch(e){}

    var comp=a.createDynamicsCompressor();
    try{ comp.threshold.value=-16; comp.knee.value=24; comp.ratio.value=3.5; comp.attack.value=.004; comp.release.value=.25; }catch(e){}
    comp.connect(a.destination);
    var out=a.createGain(); out.gain.value=.0001; out.connect(comp);
    out.gain.setTargetAtTime(.3,a.currentTime,1.2);          // sits under the UI, not over it

    // gentle air: a filtered noise bed like wind through leaves
    (function(){ try{ var len=a.sampleRate*2, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0);
      for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*.4;
      var src=a.createBufferSource(); src.buffer=buf; src.loop=true;
      var bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=900; bp.Q.value=.5;
      var g=a.createGain(); g.gain.value=.012;
      var lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=.09; lg.gain.value=.008;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      src.connect(bp); bp.connect(g); g.connect(out); src.start(); }catch(e){} })();

    function env(g,t,pk,at,dr){ g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(pk,t+at); g.gain.exponentialRampToValueAtTime(.0001,t+dr); }
    // kalimba pluck: bright sine + partial with a fast exponential decay and a wooden click
    function pluck(t,f,pk){ pk=pk||.16;
      [[1,1],[3.9,.28],[7.2,.10]].forEach(function(m){ var o=a.createOscillator(),g=a.createGain();
        o.type='sine'; o.frequency.value=f*m[0]; env(g,t,pk*m[1],.004,1.1); o.connect(g); g.connect(out); o.start(t); o.stop(t+1.2); });
      var c=a.createOscillator(),cg=a.createGain(); c.type='triangle'; c.frequency.value=f*2.01;
      env(cg,t,pk*.2,.001,.05); c.connect(cg); cg.connect(out); c.start(t); c.stop(t+.08); }
    // warm pad chord (slow attack, low-passed saws)
    function pad(t,root,dur){ [1,1.1892,1.4983,2].forEach(function(m,i){ var o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
      o.type='sawtooth'; o.frequency.value=root*m; try{ o.detune.value=(i-1.5)*5; }catch(e){}
      lp.type='lowpass'; lp.frequency.value=900;
      g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.028/(1+i*.3),t+dur*.35);
      g.gain.setTargetAtTime(.0001,t+dur*.8,.5);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t+dur+1.4); }); }
    // round wooden bass
    function bass(t,f,dur){ var o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
      o.type='triangle'; o.frequency.value=f; lp.type='lowpass'; lp.frequency.value=300;
      env(g,t,.22,.015,dur); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t+dur+.15); }
    // soft shaker
    function shaker(t,op){ var len=a.sampleRate*.09, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0);
      for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);
      var src=a.createBufferSource(); src.buffer=buf;
      var hp=a.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=5600;
      var g=a.createGain(); g.gain.value=op?.09:.05;
      src.connect(hp); hp.connect(g); g.connect(out); src.start(t); }
    // birdsong: a quick two-note chirp with a pitch swoop, rare and random
    function bird(t){ var base=2100+Math.random()*1400;
      for(var n=0;n<2+Math.floor(Math.random()*2);n++){ var st=t+n*.13+Math.random()*.03;
        var o=a.createOscillator(),g=a.createGain(); o.type='sine';
        o.frequency.setValueAtTime(base*(1+n*.08),st);
        o.frequency.exponentialRampToValueAtTime(base*(1.25+n*.08),st+.05);
        o.frequency.exponentialRampToValueAtTime(base*(0.95+n*.08),st+.11);
        env(g,st,.05,.008,.14); o.connect(g); g.connect(out); o.start(st); o.stop(st+.18); } }

    /* Am7 – Fmaj7 – C – G over a pentatonic kalimba line */
    var R=[110,87.31,65.41,98];
    var PENT=[440,523.25,587.33,659.25,783.99,880];       // A-major-ish pentatonic
    var BPM=88, s16=60/BPM/4, step=0, nextT=a.currentTime+.14;
    function schedStep(st,t){
      var bar=Math.floor(st/16)%4, sb=st%16, root=R[bar], cyc=Math.floor(st/64)%2;
      if(sb===0) pad(t,root,s16*16);
      if(sb%4===0) bass(t,root/2,s16*3.4);
      if(sb%2===0) shaker(t, sb%8===4);
      // the kalimba answers on off-beats, denser every other cycle
      var h=(st*2654435761)>>>0, r=((h>>>8)%1000)/1000;
      if(sb%2===1 && r<(cyc?0.72:0.45)) pluck(t, PENT[(h>>>4)%PENT.length]*(r<.12?2:1), .13+.05*r);
      if(sb===0 && bar===0 && Math.random()<.5) bird(t+s16*(4+Math.random()*8));
    }
    var timer=setInterval(function(){ try{ var now=a.currentTime;
      while(nextT<now+.18){ schedStep(step,nextT); nextT+=s16; step=(step+1)%128; } }catch(e){} },25);
    _infAmb={out:out,nodes:[comp],crk:timer,a:a};
  }catch(e){} }
  function stopAzeroAmbience(){ try{ var A=_infAmb; if(!A) return; _infAmb=null; clearInterval(A.crk); var a=A.a;
    A.out.gain.setTargetAtTime(0.0001,a.currentTime,0.35);
    setTimeout(function(){ A.nodes.forEach(function(n){ try{n.stop();}catch(e){} try{n.disconnect();}catch(e){} }); try{A.out.disconnect();}catch(e){} },700); }catch(e){} }
  // aliases — every existing call site keeps working
  function startInfernoAmbience(){ return startAzeroAmbience(); }
  function stopInfernoAmbience(){ return stopAzeroAmbience(); }
  /* BUTTERFLY BURST — opening any Play tile releases a fast cloud of butterflies from the
     box. Web Animations API, elements self-remove; skipped for reduced-motion users. */
  (function(){
    try{ if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
    document.addEventListener('click',function(ev){
      var btn=ev.target && ev.target.closest ? ev.target.closest('#tet-rank-modal .hub-btn') : null;
      if(!btn) return;
      var r=btn.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
      var N=16+Math.floor(Math.random()*6);
      for(var i=0;i<N;i++){
        var b=document.createElement('s');
        b.className='bfb'+(i%3===1?' au':(i%3===2?' mi':''));
        b.innerHTML='<i></i><i></i>';
        // start somewhere on the tile, not all from one point
        var sx=r.left+Math.random()*r.width, sy=r.top+Math.random()*r.height;
        b.style.left=(sx-11)+'px'; b.style.top=(sy-8)+'px';
        document.body.appendChild(b);
        var ang=Math.random()*Math.PI*2, dist=180+Math.random()*340;
        var dx=Math.cos(ang)*dist, dy=Math.sin(ang)*dist-60-Math.random()*80;   // bias upward
        var mx=dx*0.45+(Math.random()-0.5)*90, my=dy*0.45-40-Math.random()*50;  // arced midpoint
        var rot=(Math.random()-0.5)*160, sc=0.6+Math.random()*0.9;
        var dur=520+Math.random()*420;
        try{
          b.animate([
            { transform:'translate(0,0) rotate(0deg) scale('+(sc*0.5)+')', opacity:1 },
            { transform:'translate('+mx+'px,'+my+'px) rotate('+(rot*0.6)+'deg) scale('+sc+')', opacity:1, offset:0.45 },
            { transform:'translate('+dx+'px,'+dy+'px) rotate('+rot+'deg) scale('+(sc*0.8)+')', opacity:0 }
          ],{ duration:dur, easing:'cubic-bezier(.16,.8,.3,1)' }).onfinish=function(el){ return function(){ try{ el.remove(); }catch(_){} }; }(b);
          setTimeout(function(el){ return function(){ try{ el.remove(); }catch(_){} }; }(b), dur+250);
        }catch(_a){ try{ b.remove(); }catch(_r){} }
      }
    }, true);
  })();
  /* LEAF RUSTLE — brushing over any wooden tile shakes a few leaves off it.
     FIREFLY SPARK — every click inside the dashboard pops a firefly at the cursor. */
  (function(){
    try{ if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; }catch(e){}
    var lastRustle=0;
    document.addEventListener('mouseover',function(ev){
      var tile=ev.target && ev.target.closest ? ev.target.closest('#tet-rank-modal .rk-row, #tet-rank-modal .tstat, #tet-rank-modal .hub-btn, #tet-rank-modal .rk-pod') : null;
      if(!tile) return;
      var now=Date.now(); if(now-lastRustle<450) return; lastRustle=now;   // don't storm on fast sweeps
      var r=tile.getBoundingClientRect();
      for(var i=0;i<3;i++){
        var l=document.createElement('b'); l.className='mf-rustle';
        var sx=r.left+8+Math.random()*(r.width-16);
        l.style.left=sx+'px'; l.style.top=(r.top-2)+'px';
        document.body.appendChild(l);
        var dx=(Math.random()-0.5)*46, dy=26+Math.random()*40, rot=(Math.random()-0.5)*300, dur=650+Math.random()*350;
        try{ l.animate([
            { transform:'translate(0,-4px) rotate(0deg)', opacity:1 },
            { transform:'translate('+dx+'px,'+dy+'px) rotate('+rot+'deg)', opacity:0 }
          ],{ duration:dur, easing:'cubic-bezier(.3,.6,.4,1)' }).onfinish=function(el){ return function(){ try{ el.remove(); }catch(_){} }; }(l);
          setTimeout(function(el){ return function(){ try{ el.remove(); }catch(_){} }; }(l), dur+200);
        }catch(_a){ try{ l.remove(); }catch(_r){} }
      }
    }, true);
    document.addEventListener('click',function(ev){
      var m=el('tet-rank-modal'); if(!m||!m.classList.contains('open')) return;
      if(!(ev.target && ev.target.closest && ev.target.closest('#tet-rank-modal'))) return;
      var sp=document.createElement('b'); sp.className='mf-spark';
      sp.style.left=(ev.clientX-3)+'px'; sp.style.top=(ev.clientY-3)+'px';
      document.body.appendChild(sp);
      var dx=(Math.random()-0.5)*60, dy=-40-Math.random()*50;
      try{ sp.animate([
          { transform:'translate(0,0) scale(.6)', opacity:1 },
          { transform:'translate('+(dx*0.5)+'px,'+(dy*0.5)+'px) scale(1.15)', opacity:1, offset:.4 },
          { transform:'translate('+dx+'px,'+dy+'px) scale(.4)', opacity:0 }
        ],{ duration:700, easing:'cubic-bezier(.2,.7,.3,1)' }).onfinish=function(){ try{ sp.remove(); }catch(_){} };
        setTimeout(function(){ try{ sp.remove(); }catch(_){} },950);
      }catch(_a){ try{ sp.remove(); }catch(_r){} }
    }, true);
  })();
  /* ══ MOSSY FOREST LIVING SYSTEMS ══
     · RANK CEREMONY — on promotion the anaconda strikes and the new rank chip drops
       from its mouth, bounces on the rock and fades.
     · RAIN — rolls in occasionally while the dashboard is open: droplets, a wet sheen
       on the timber, soft thunder (flash + low WebAudio rumble).
     · NIGHT — 6PM–6AM PHT the grove goes dark and the fireflies and mushrooms become
       the light sources. Checked every minute, so night falls while you watch. */
  var _mfRain=null,_mfRainTimer=null,_mfThunderT=null;
  function _mfReduced(){ try{ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
  function mfSnakeCeremony(R){
    if(_mfReduced()) return;
    var snake=document.querySelector('#tet-rank-modal .mf-snake'); if(!snake) return;
    snake.classList.remove('strike'); void snake.offsetWidth; snake.classList.add('strike');
    setTimeout(function(){ try{ snake.classList.remove('strike'); }catch(_){} },1500);
    var r=snake.getBoundingClientRect();
    var hx=r.left+r.width*0.78, hy=r.top+10;                 // roughly the mouth
    setTimeout(function(){
      var chip=document.createElement('b'); chip.className='mf-rankchip';
      chip.textContent='RANK '+R.rank;
      chip.style.left=(hx-38)+'px'; chip.style.top=hy+'px';
      document.body.appendChild(chip);
      try{
        chip.animate([
          { transform:'translateY(0) rotate(-9deg) scale(.6)', opacity:0 },
          { transform:'translateY(10px) rotate(-4deg) scale(1)', opacity:1, offset:.15 },
          { transform:'translateY(64px) rotate(3deg)', offset:.5, easing:'cubic-bezier(.5,0,1,1)' },
          { transform:'translateY(40px) rotate(-2deg)', offset:.66, easing:'cubic-bezier(0,0,.5,1)' },
          { transform:'translateY(64px) rotate(1deg)', offset:.8, easing:'cubic-bezier(.5,0,1,1)' },
          { transform:'translateY(56px) rotate(0deg)', offset:.88 },
          { transform:'translateY(60px)', opacity:1, offset:.94 },
          { transform:'translateY(60px)', opacity:0 }
        ],{ duration:2600, easing:'linear' }).onfinish=function(){ try{ chip.remove(); }catch(_){} };
        setTimeout(function(){ try{ chip.remove(); }catch(_){} },3000);
      }catch(_a){ try{ chip.remove(); }catch(_r){} }
    },420);                                                   // lands as the strike peaks
  }
  function _mfRumble(){
    try{ var a=(typeof ac==='function')?ac():null; if(!a) return;
      var len=a.sampleRate*1.6, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0);
      for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.6);
      var src=a.createBufferSource(); src.buffer=buf;
      var lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=95; lp.Q.value=.7;
      var g=a.createGain(); g.gain.setValueAtTime(.0001,a.currentTime);
      g.gain.linearRampToValueAtTime(.16,a.currentTime+.25);
      g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+1.6);
      src.connect(lp); lp.connect(g); g.connect(a.destination); src.start(); }catch(e){}
  }
  function mfRainStart(){
    if(_mfRain||_mfReduced()) return;
    var card=document.querySelector('#tet-rank-modal .rk-card'); if(!card) return;
    card.classList.add('raining');
    var rain=document.createElement('div'); rain.className='mf-rain';
    var n=44, html='';
    for(var i=0;i<n;i++){
      html+='<i style="left:'+(Math.random()*100)+'%;animation-duration:'+(0.65+Math.random()*0.55)+
        's;animation-delay:-'+(Math.random()*1.2).toFixed(2)+'s;opacity:'+(0.25+Math.random()*0.35).toFixed(2)+';"></i>';
    }
    rain.innerHTML=html; card.appendChild(rain); _mfRain=rain;
    function thunder(){
      if(!_mfRain) return;
      var fl=document.createElement('div'); fl.className='mf-flash'; card.appendChild(fl);
      setTimeout(function(){ try{ fl.remove(); }catch(_){} },700);
      _mfRumble();
      _mfThunderT=setTimeout(thunder, 9000+Math.random()*14000);
    }
    _mfThunderT=setTimeout(thunder, 4000+Math.random()*6000);
    setTimeout(mfRainStop, 45000+Math.random()*35000);       // a shower, not a monsoon
  }
  function mfRainStop(){
    try{ clearTimeout(_mfThunderT); }catch(_){} _mfThunderT=null;
    var card=document.querySelector('#tet-rank-modal .rk-card');
    if(card) card.classList.remove('raining');
    if(_mfRain){ var r=_mfRain; _mfRain=null;
      r.style.transition='opacity 2s'; r.style.opacity='0';
      setTimeout(function(){ try{ r.remove(); }catch(_){} },2100); }
  }
  function mfNightTick(){
    var card=document.querySelector('#tet-rank-modal .rk-card'); if(!card) return;
    var h=new Date(Date.now()+8*3600*1000).getUTCHours();     // PHT wall clock
    card.classList.toggle('mf-night', (h>=18||h<6));
  }
  (function(){
    setInterval(function(){
      var m=el('tet-rank-modal'); if(!m||!m.classList.contains('open')){ mfRainStop(); return; }
      mfNightTick();
      if(!_mfRain && Math.random()<0.10) mfRainStart();       // ~1 shower every 10 open-minutes
    },60000);
    document.addEventListener('click',function(ev){          // first open of a session: maybe rain
      var m=el('tet-rank-modal');
      if(m&&m.classList.contains('open')){ mfNightTick(); }
    },true);
  })();
  /* ── 🎁 THE TREASURY BOX ──
     One spin per PHT day, decided by the SERVER; the wheel only performs the result.
     Segments (60° each, pin at top): 0 🐍SKIN · 1 1000 · 2 500 · 3 100 · 4 50 · 5 nothing. */
  var _tchBusy=false;
  function _tchNextMidnight(){ var now=new Date(Date.now()+8*3600*1000);
    var next=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1)-8*3600*1000;
    var sLeft=Math.max(0,Math.floor((next-Date.now())/1000));
    var h=Math.floor(sLeft/3600), m2=Math.floor((sLeft%3600)/60);
    return h+'h '+m2+'m'; }
  function _tchToday(){ var d=new Date(Date.now()+8*3600*1000);
    return d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'+('0'+d.getUTCDate()).slice(-2); }
  function tetChestPeek(){
    var card=el('tet-chest-card'); if(!card||typeof eid!=='function'||!eid()) return;
    /* Local memory FIRST — if this device already opened today's chest, dim the card
       immediately (covers a stale web-app deployment or a failed network check). The
       server stays the real enforcer either way. */
    try{ if(localStorage.getItem('mfChestDay')===_tchToday()) _tchMarkOpened(); }catch(_lc){}
    fetch(APPS_SCRIPT_URL+'?action=tetris_chest&peek=1&employee_id='+encodeURIComponent(eid())+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){
        if(d&&d.ok&&d.opened){ _tchMarkOpened(); try{ localStorage.setItem('mfChestDay',_tchToday()); }catch(_l2){} }
      }).catch(function(){});
  }
  function _tchMarkOpened(){
    var card=el('tet-chest-card'); if(!card) return;
    card.classList.add('opened');
    var sub=el('tet-chest-sub'), cta=el('tet-chest-cta');
    if(sub) sub.textContent='Opened today — the chest refills in '+_tchNextMidnight();
    if(cta) cta.textContent='DONE';
  }
  window.tetChestClose=function(){ var m=el('tet-chest-modal'); if(m) m.classList.remove('open'); };
  window.tetChestOpen=function(){
    var card=el('tet-chest-card');
    if(_tchBusy||!card||card.classList.contains('opened')) return;
    if(typeof eid!=='function'||!eid()) return;
    _tchBusy=true;
    var m=el('tet-chest-modal'), wheel=el('tch-wheel'), res=el('tch-result'), btn=el('tch-close');
    if(m){ m.classList.add('open'); } if(btn) btn.style.display='none';
    if(res) res.textContent='Spinning…';
    if(wheel){ wheel.style.transition='none'; wheel.style.transform='rotate(0deg)'; void wheel.offsetWidth; }
    fetch(APPS_SCRIPT_URL+'?action=tetris_chest&employee_id='+encodeURIComponent(eid())+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){
        _tchBusy=false;
        if(!d||d.error){ if(res) res.textContent='The chest jammed — try again in a moment.'; if(btn) btn.style.display=''; return; }
        if(d.already){ _tchMarkOpened(); try{ localStorage.setItem('mfChestDay',_tchToday()); }catch(_l3){} if(res) res.textContent='Already opened today — come back after midnight (PHT).'; if(btn) btn.style.display=''; return; }
        var segIdx = d.prize==='jackpot' ? 0
                   : d.prize==='coins' ? (d.amount===1000?1:d.amount===500?2:d.amount===100?3:4)
                   : 5;
        // land the pin mid-segment: pin at top = 0°; segment i centre sits at i*60°
        var target=360*5 + (360 - segIdx*60) + (Math.random()*36-18);
        if(wheel){ wheel.style.transition='transform 4.2s cubic-bezier(.12,.8,.16,1)';
          wheel.style.transform='rotate('+target+'deg)'; }
        try{ sfxTick(); }catch(_t){}
        try{ localStorage.setItem('mfChestDay',_tchToday()); }catch(_l4){}
        setTimeout(function(){
          _tchMarkOpened();
          var msg;
          if(d.prize==='jackpot'){ msg='🐍 <b>JACKPOT!</b><br>The <b>ANACONDA</b> collector skin is yours — check the Locker!';
            try{ tetConfetti({count:300,dur:4200}); sfxWin(); }catch(_c){} }
          else if(d.prize==='coins'){ msg='💰 <b>+'+Number(d.amount).toLocaleString()+' Tetris Coins!</b>'+(d.jackpot_downgraded?'<br><small>(you hit the jackpot — but the Anaconda is already yours, so it paid out in gold)</small>':'');
            try{ tetConfetti({count:d.amount>=500?200:110,dur:2800}); sfxWin(); }catch(_c){}
            try{ loadWallet(); loadCosmetics(); }catch(_w){} }
          else { msg='🍂 Nothing today… the forest keeps its gold.<br><small>Come back tomorrow.</small>';
            try{ sfxLose(); }catch(_c){} }
          if(res) res.innerHTML=msg;
          if(btn) btn.style.display='';
        }, 4400);
      }).catch(function(){ _tchBusy=false; if(res) res.textContent='No connection — the chest stays shut. Try again.'; if(btn) btn.style.display=''; });
  };
  window.tetCloseRanking=function(){ var m=el('tet-rank-modal'); if(m) m.classList.remove('open'); try{ stopInfernoAmbience(); }catch(e){} try{ stopInfernoBg(); }catch(e){} };
  function rkInitial(n){ n=String(n||'?').trim(); return (n.charAt(0)||'?').toUpperCase(); }
  /* 🏆 BEAST TROPHIES — 🐍 slew the Anaconda, 🐺 slew the Wolf. Sourced from the ranking
     rows (server keeps them permanent in Settings), shown beside the name everywhere:
     player card, leaderboard, and tournament brackets — bragging rights that travel. */
  var _BEAST_ICON={ snake:'🐍', wolf:'🐺', bear:'🐻', wizard:'🧙', dragon:'🐉' };
  var _BEAST_TTL ={ snake:'Slew the Anaconda', wolf:'Slew the Wolf', bear:'Slew the Bear', wizard:'Defeated the Wizard', dragon:'SLEW THE DRAGON' };
  function beastsOf(id){ try{
      var k=String(id||'').toLowerCase();
      var rows=(typeof _tetBoard!=='undefined'&&_tetBoard)||[];
      for(var i=0;i<rows.length;i++){ if(String(rows[i].employee_id||'').toLowerCase()===k) return rows[i].beasts||[]; }
    }catch(e){} return []; }
  function beastChips(idOrList, big){
    var list=Array.isArray(idOrList)?idOrList:beastsOf(idOrList);
    if(!list||!list.length) return '';
    return list.map(function(b){ return '<span class="beast-chip'+(big?' big':'')+'" title="'+(_BEAST_TTL[b]||b)+'">'+(_BEAST_ICON[b]||'')+'</span>'; }).join('');
  }
  function rkAvColor(rank){ return rank===1?'linear-gradient(135deg,#ffe08a,#f59e0b)':rank===2?'linear-gradient(135deg,#e6ecf5,#9aa7bd)':'linear-gradient(135deg,#f0b98a,#c77e46)'; }
  function rkRing(rank){ return rank===1?'#f59e0b':rank===2?'#9aa7bd':rank===3?'#c77e46':'rgba(255,255,255,.14)'; }
  function rkPhoto(id){
    if(!id) return '';
    var ep=(typeof employeePhotos!=='undefined')?employeePhotos:{}, pp=(typeof presencePhotos!=='undefined')?presencePhotos:{};
    var u=ep[id]||pp[id]||ep[String(id).toUpperCase()]||pp[String(id).toUpperCase()]||ep[String(id).toLowerCase()]||pp[String(id).toLowerCase()];
    return u||'';
  }
  // ── Tetris profile hub (opened from the Tetris button) ──
  var HUBIC={
    ladder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4.5M9.5 4h5"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/></svg>',
    sprint:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    ultra:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7"/><path d="M12 13V9.5M9.5 2.5h5M18.6 6.4l1.4 1.4"/></svg>',
    duel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4H20v5.5M20 4l-9 9M4 15.5V20h4.5M4 20l9-9M15 15l5 5M9 9 4 4"/></svg>',
    cup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2 2 0 0 0 0 4H7M17 6h2.5a2 2 0 0 1 0 4H17M9.5 20h5M12 14v3"/></svg>',
    design:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
    combo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3-1 4-2 6a5 5 0 1 0 8 3c0-2-1-3-2-4 0 1-.5 2-1.6 2C13 10 14 6 12 3z"/></svg>',
    cheese:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12.5 14 5a5.5 5.5 0 0 1 7 5v9H3z"/><circle cx="8" cy="16" r="1.4"/><circle cx="15" cy="13.5" r="1.4"/><circle cx="17.5" cy="17" r="1"/></svg>',
    survival:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    ration:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.2 12 3.5l9 4.7v7.6L12 20.5 3 15.8z"/><path d="M3 8.2 12 13l9-4.8M12 13v7.5"/></svg>',
    ranked:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6l2.6 5.5 6 .9-4.3 4.3 1 6.1-5.3-2.9-5.3 2.9 1-6.1L3.4 9l6-.9z"/></svg>',
    wolfhunt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l3 4 2-2 3 2 3-2 2 2 3-4-1 8c0 4-3 7-7 7s-7-3-7-7z" fill="rgba(120,120,140,.18)"/><path d="M9.5 12.5l1 1M14.5 12.5l-1 1" stroke="#fde047"/><path d="M12 16.5v1.6M10.6 19.3l1.4-1.2 1.4 1.2"/><path d="M4 6L2.4 3.4M20 6l1.6-2.6"/></svg>',
    dragonhunt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8c3-3 6-4 9-3l3-3 1 4 4 1-3 3c1 3 0 6-3 9-1-3-3-5-6-6-1 2-3 3-5 3 0-2 1-4 3-5-1-3-3-5-6-6z" fill="rgba(226,86,15,.2)"/><circle cx="13.5" cy="7.5" r="1" fill="#fde047" stroke="none"/><path d="M6 18l-2 2M8 20l-1 1" stroke="#f97316"/></svg>',
    wizardhunt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.2 5.5L12 9 9.8 7.5z" fill="rgba(168,85,247,.3)"/><path d="M7 21c1-6 3-9 5-12 2 3 4 6 5 12z" fill="rgba(124,58,237,.18)"/><path d="M6.5 21h11"/><circle cx="12" cy="13.5" r="1" fill="#c4b5fd" stroke="none"/><path d="M4 6l1.2.4L6.4 6 5.6 7z" fill="#c4b5fd" stroke="none"/><path d="M19 9l1 .3 1-.3-.6.9z" fill="#c4b5fd" stroke="none"/></svg>',
    bearhunt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="6.5" r="2.4" fill="rgba(140,110,80,.25)"/><circle cx="16.5" cy="6.5" r="2.4" fill="rgba(140,110,80,.25)"/><path d="M5.5 11c0-3 3-5 6.5-5s6.5 2 6.5 5c0 4-2.6 7-6.5 7S5.5 15 5.5 11z" fill="rgba(140,110,80,.18)"/><path d="M9.8 11.4l.9.9M14.2 11.4l-.9.9" stroke="#fde047"/><path d="M12 14.2v1.2M10.8 16.4l1.2-1 1.2 1"/></svg>',
    overgrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21c0-6 2-10 5-13"/><path d="M9 8C9 5 7 3.4 4 3.3c0 3 1.8 4.8 5 4.7z" fill="rgba(74,222,128,.3)"/><path d="M12 21c0-4.5 1.6-7.6 4-10"/><path d="M16 11c0-2.5 1.7-4 4.4-3.9 0 2.6-1.8 4-4.4 3.9z" fill="rgba(190,242,100,.28)"/><path d="M8 21c1.5-2 3.6-3 6.5-3M3 21h18"/></svg>',
    snakehunt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c3 2 6 2 8-.5S15 12 18 13"/><path d="M18 13c2 .6 3-1 2.6-2.6"/><ellipse cx="19.4" cy="8.6" rx="2.6" ry="1.9" fill="rgba(74,222,128,.3)" transform="rotate(-20 19.4 8.6)"/><circle cx="20" cy="8.2" r=".5" fill="currentColor" stroke="none"/><path d="M22 7.6q1.4-.2 2-1M22 7.6q1.4.4 2 1" stroke-width="1.1"/><path d="M5 15.5l1-1M9 16.5l1 1"/></svg>',
    daily:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4M12 13v4M9.5 15h5"/></svg>'
  };
  var ACHIC={
    first:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="8 6 18 12 8 18"/></svg>',
    century:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    combo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3-1 4-2 6a5 5 0 1 0 8 3c0-2-1-3-2-4 0 1-.5 2-1.6 2C13 10 14 6 12 3z"/></svg>',
    sprint:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    ultra:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7"/><path d="M12 13V9.5M9.5 2.5h5"/></svg>',
    perfect:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/></svg>',
    champion:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2 2 0 0 0 0 4H7M17 6h2.5a2 2 0 0 1 0 4H17M9.5 20h5M12 14v3"/></svg>',
    grandmaster:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l4 4 4-6 4 6 4-4v9H4z"/></svg>'
  };
  function renderBadges(list){
    var host=el('tet-hub-badges'); if(!host) return;
    list=list||[];
    host.innerHTML=list.map(function(a){ var ic=ACHIC[a.id]||ACHIC.first;
      return '<span class="ach'+(a.earned?' on':'')+'" title="'+esc(a.name)+' — '+esc(a.desc)+(a.earned?' ✓':' (locked)')+'">'+ic+esc(a.name)+'</span>';
    }).join('');
  }
  // ── Block-design ownership summary for the profile header ──
  function _tetOwnedList(){
    var w=(typeof _tetWallet!=='undefined'&&_tetWallet&&_tetWallet.owned)?_tetWallet.owned
         :((typeof _tetCos!=='undefined'&&_tetCos&&_tetCos.owned)?_tetCos.owned:null);
    return w||['classic'];
  }
  function _designCatOf(t){ if(!t) return 'regular'; if(t.tier) return t.tier; if(t.req) return 'iconic'; if((t.cost||0)>=5000) return 'premium'; return 'regular'; }
  function designSummaryHTML(){
    var owned=_tetOwnedList();
    var counts={collector:0,iconic:0,premium:0,regular:0}, total=0;
    owned.forEach(function(id){ if(id==='classic') return; var t=(typeof DESIGNS!=='undefined')?DESIGNS[id]:null; if(!t) return;
      var c=_designCatOf(t); if(counts[c]==null) counts[c]=0; counts[c]++; total++; });
    var COLOR={collector:'#f0abfc',iconic:'#fcd34d',premium:'#c084fc',regular:'#93c5fd'};
    var LBL={collector:'Collector',iconic:'Iconic',premium:'Premium',regular:'Regular'};
    var base='display:inline-block;font-size:9.5px;font-weight:800;letter-spacing:.2px;padding:2px 8px;border-radius:20px;border:1px solid;background:rgba(255,255,255,.05);margin:0 4px 4px 0;';
    var chips=['collector','iconic','premium','regular'].filter(function(k){return counts[k]>0;})
      .map(function(k){ return '<span style="'+base+'color:'+COLOR[k]+';border-color:'+COLOR[k]+'55;">'+counts[k]+' '+LBL[k]+'</span>'; }).join('');
    if(!total) chips='<span style="'+base+'color:#8a97b5;border-color:rgba(255,255,255,.15);">None yet — open the Locker</span>';
    return '<span style="font-size:10px;font-weight:800;color:#cdd6f5;margin-right:6px;white-space:nowrap;">🎨 '+total+' design'+(total===1?'':'s')+' obtained</span>'+chips;
  }
  function refreshDesignSummary(){ var e=el('hp-designs'); if(e) e.innerHTML=designSummaryHTML(); }
  function renderHubProfile(me){
    var host=el('tet-hub-profile'); if(!host) return;
    if(me) _hubMe=me; else me=_hubMe;
    host.className='hub-prof';
    var name=(typeof ename==='function')?ename():'', id=(typeof eid==='function')?eid():'';
    var ph=rkPhoto(id);
    var rating=me?(me.rating||0):0, rank=me?me.rank:null, skill=me?(me.skill_level||0):0, wins=me?(me.wins||0):0, best=me?(me.best||0):0;
    // Star rank — the visible ladder. Rating stays as the quiet, precise number behind it.
    var R = rankFromStars(me?(me.stars||0):0);
    // Equipped cosmetic frame wins if you bought one; otherwise your RANK is your ring.
    var fr=(COS.frame&&COS.frame!=='none')?(' fr-'+COS.frame):'';
    var rs=fr?'':ringStyle(R.tier,2);
    var rc=(typeof tierColor==='function')?tierColor(R.tier):'#ff8a4a';
    var ttl=''; if(_tetCos&&_tetCos.titles){ _tetCos.titles.forEach(function(t){ if(t.id===(_tetCos.equipped&&_tetCos.equipped.title)) ttl=t.name; }); }
    // Rank ring: a rotating conic aura + counter-spinning arc + orbiting spark, all tinted to
    // the player's tier colour. Skipped only when a bought cosmetic frame is equipped.
    var avCls='hp-av'+fr+(fr?'':(' av-rank '+tierCls(R.tier)+((R.god||R.rank>=110)?' av-god':(R.tier==='Demi-god'?' av-demigod':(R.rank>=100?' av-elite100':'')))));
    var avSt=rs+(fr?'':('--ring:'+rc+';'));
    var rings=fr?'':'<span class="av-aura"></span><span class="av-arc"></span><span class="av-spark"></span>';
    var center=ph?'<img src="'+ph+'" alt="">':'<span class="av-init">'+rkInitial(name)+'</span>';
    var av='<div class="'+avCls+'" style="'+avSt+'">'+rings+center+'</div>';
    /* Rank 110 is the cap — there is no Rank 111. The last climb is the god bar. */
    var atCap = !R.god && R.rank>=110;
    var nextTier = (R.god||atCap) ? '' : tierName(R.rank+1, false);
    var toNextLbl = R.god ? 'The ceiling. Nobody is above you.'
                  : atCap ? (R.to_next+' ★ to 👑 GOD OF TETRIS — the final ascension')
                  : (R.to_next+' ★ to Rank '+(R.rank+1)+(nextTier!==R.tier?(' · '+nextTier):''));
    host.innerHTML=av+
      '<div class="hp-main">'+
        '<div class="hp-name">'+esc(name||'Player')+((me&&me.beasts&&me.beasts.length)?(' '+beastChips(me.beasts,true)):'')+'</div>'+
        '<div class="hp-tier" style="--tc:'+rc+';"><span class="hpt-star">★</span> Rank '+R.rank+' · <b>'+esc(R.tier)+(R.god?' 👑':'')+'</b></div>'+
        // Career best — shown only when it's ABOVE the live rank, i.e. after a season reset.
        // Reaching Demi-god is a permanent fact; the ladder resetting shouldn't erase it.
        ((R.peak_rank && R.peak_rank>R.rank)
          ? '<div class="hp-peak" title="Your highest rank ever — kept across every season">'+
              '<span>👑 CAREER BEST</span> Rank '+R.peak_rank+' · <b>'+esc(R.peak_tier||'')+'</b></div>'
          : '')+
        '<div class="hp-stars">'+starMeter(R)+'<em>'+esc(toNextLbl)+'</em></div>'+
        '<div id="hp-designs" style="margin-top:7px;line-height:1.55;">'+designSummaryHTML()+'</div>'+
      '</div>'+
      '<div class="hp-coins" onclick="tetOpenDesigns()" title="Spend in the Locker">'+
        '<span class="hpc-icon"><svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tcoinG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a6"/><stop offset="0.5" stop-color="#f7c343"/><stop offset="1" stop-color="#e09a1c"/></linearGradient></defs><circle cx="20" cy="20" r="18" fill="url(#tcoinG)" stroke="#b9791a" stroke-width="2"/><circle cx="20" cy="20" r="13.5" fill="none" stroke="#fff2c6" stroke-width="1.4" opacity="0.65"/><text x="20" y="27.5" text-anchor="middle" font-family="Sora, Inter, sans-serif" font-weight="900" font-size="21" fill="#7a4e00">T</text></svg></span>'+
        '<span class="hpc-main"><b id="tet-hub-coins">'+((typeof _tetCos!=='undefined'&&_tetCos&&_tetCos.coins!=null)?Number(_tetCos.coins).toLocaleString():((typeof _tetWallet!=='undefined'&&_tetWallet&&_tetWallet.coins!=null)?Number(_tetWallet.coins).toLocaleString():'…'))+'</b><small>Tetris Coins</small></span>'+
        '<span class="hpc-cta">Locker →</span>'+
      '</div>'+
      /* THE ANACONDA — a heavy constrictor circling the whole rock. Two layers so it truly
         wraps: .mf-anab paints the coils lying ACROSS the stone face (behind the text),
         .mf-snake paints the loops bulging around the outside edges, the hanging tail and
         the head rising over the top — geometry aligned so each band continues around. */
      '<span class="mf-anab" aria-hidden="true"><svg viewBox="0 0 400 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'+
        '<g class="ana-coils">'+
          /* band 1 — enters at the left edge, sweeps down across the face, exits bottom */
          '<path d="M -12 34 C 60 52, 96 84, 138 172" fill="none" stroke="#3e4a28" stroke-width="30" stroke-linecap="butt"/>'+
          '<path d="M -12 34 C 60 52, 96 84, 138 172" fill="none" stroke="#5d6b3c" stroke-width="24" stroke-linecap="butt"/>'+
          '<path d="M -12 27 C 58 44, 92 74, 130 158" fill="none" stroke="rgba(190,200,140,.30)" stroke-width="4" stroke-linecap="round"/>'+
          '<path d="M -12 45 C 62 62, 100 96, 146 180" fill="none" stroke="rgba(14,18,8,.45)" stroke-width="5" stroke-linecap="round"/>'+
          '<ellipse cx="34" cy="41" rx="10" ry="6.5" fill="#26301a" transform="rotate(14 34 41)"/>'+
          '<ellipse cx="82" cy="62" rx="11" ry="7" fill="#26301a" transform="rotate(30 82 62)"/>'+
          '<ellipse cx="116" cy="104" rx="10" ry="6.5" fill="#26301a" transform="rotate(58 116 104)"/>'+
          '<ellipse cx="34" cy="41" rx="5" ry="3" fill="#4a5630" transform="rotate(14 34 41)"/>'+
          '<ellipse cx="82" cy="62" rx="5.5" ry="3.2" fill="#4a5630" transform="rotate(30 82 62)"/>'+
          /* band 2 — drops from the top edge and rolls off the right edge */
          '<path d="M 238 -12 C 248 52, 298 92, 412 118" fill="none" stroke="#3e4a28" stroke-width="32" stroke-linecap="butt"/>'+
          '<path d="M 238 -12 C 248 52, 298 92, 412 118" fill="none" stroke="#5d6b3c" stroke-width="26" stroke-linecap="butt"/>'+
          '<path d="M 230 -12 C 240 48, 288 84, 402 108" fill="none" stroke="rgba(190,200,140,.30)" stroke-width="4" stroke-linecap="round"/>'+
          '<path d="M 248 -12 C 258 58, 308 102, 414 128" fill="none" stroke="rgba(14,18,8,.45)" stroke-width="5" stroke-linecap="round"/>'+
          '<ellipse cx="244" cy="30" rx="10" ry="7" fill="#26301a" transform="rotate(80 244 30)"/>'+
          '<ellipse cx="272" cy="74" rx="11" ry="7" fill="#26301a" transform="rotate(52 272 74)"/>'+
          '<ellipse cx="330" cy="100" rx="11" ry="7" fill="#26301a" transform="rotate(20 330 100)"/>'+
          '<ellipse cx="378" cy="112" rx="10" ry="6.5" fill="#26301a" transform="rotate(10 378 112)"/>'+
          '<ellipse cx="272" cy="74" rx="5.5" ry="3.2" fill="#4a5630" transform="rotate(52 272 74)"/>'+
          '<ellipse cx="330" cy="100" rx="5.5" ry="3.2" fill="#4a5630" transform="rotate(20 330 100)"/>'+
        '</g>'+
      '</svg></span>'+
      '<span class="mf-snake" aria-hidden="true"><svg viewBox="0 0 448 208" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'+
        /* left wrap — band 1 coming around the outside of the left edge */
        '<path d="M 27 46 C 0 62, -2 98, 28 118" fill="none" stroke="#333d20" stroke-width="30" stroke-linecap="butt"/>'+
        '<path d="M 27 46 C 0 62, -2 98, 28 118" fill="none" stroke="#525f34" stroke-width="24" stroke-linecap="butt"/>'+
        '<path d="M 20 50 C -1 64, -3 94, 22 112" fill="none" stroke="rgba(190,200,140,.25)" stroke-width="4" stroke-linecap="round"/>'+
        '<ellipse cx="9" cy="82" rx="7" ry="10" fill="#232c14"/>'+
        /* bottom wrap + the hanging tail */
        '<path d="M 152 188 C 178 208, 218 208, 244 190" fill="none" stroke="#333d20" stroke-width="28" stroke-linecap="butt"/>'+
        '<path d="M 152 188 C 178 208, 218 208, 244 190" fill="none" stroke="#525f34" stroke-width="22" stroke-linecap="butt"/>'+
        '<ellipse cx="198" cy="199" rx="11" ry="6.5" fill="#232c14"/>'+
        '<g class="ana-tail">'+
          '<path d="M 152 188 C 136 200, 122 206, 106 203" fill="none" stroke="#525f34" stroke-width="13" stroke-linecap="round"/>'+
          '<path d="M 106 203 C 96 201, 88 195, 84 186" fill="none" stroke="#525f34" stroke-width="7" stroke-linecap="round"/>'+
          '<path d="M 84 186 C 81 179, 82 173, 86 168" fill="none" stroke="#4a5630" stroke-width="3.5" stroke-linecap="round"/>'+
        '</g>'+
        /* right wrap climbing toward the head */
        '<path d="M 424 152 C 448 132, 448 102, 420 86" fill="none" stroke="#333d20" stroke-width="30" stroke-linecap="butt"/>'+
        '<path d="M 424 152 C 448 132, 448 102, 420 86" fill="none" stroke="#525f34" stroke-width="24" stroke-linecap="butt"/>'+
        '<ellipse cx="438" cy="120" rx="7" ry="10" fill="#232c14"/>'+
        '<g class="ana-head">'+
          /* neck rising over the top edge */
          '<path d="M 420 86 C 430 58, 420 36, 398 26" fill="none" stroke="#525f34" stroke-width="23" stroke-linecap="round"/>'+
          '<path d="M 412 82 C 422 58, 414 42, 396 32" fill="none" stroke="rgba(190,200,140,.25)" stroke-width="4" stroke-linecap="round"/>'+
          '<ellipse cx="416" cy="60" rx="6" ry="9" fill="#232c14" transform="rotate(-12 416 60)"/>'+
          /* the head: broad, blunt anaconda skull, eyes and nostrils set on TOP */
          '<path d="M 398 12.5 C 380 8.5, 360 10, 348 17 C 342 20.5, 342 27.5, 348 31 C 360 38, 382 39.5, 398 35 C 408 32, 410 16, 398 12.5 z" fill="#5d6b3c"/>'+
          '<path d="M 398 12.5 C 380 8.5, 360 10, 348 17" fill="none" stroke="rgba(190,200,140,.4)" stroke-width="2" stroke-linecap="round"/>'+
          '<path d="M 348 31 C 360 38, 382 39.5, 398 35" fill="none" stroke="rgba(14,18,8,.5)" stroke-width="2.5" stroke-linecap="round"/>'+
          '<path d="M 344 24 L 400 24" fill="none" stroke="rgba(20,26,10,.35)" stroke-width="1.6"/>'+   /* mouth line */
          '<path d="M 393 13 l 8 -4 M 384 12 l 5 -6" stroke="#3e4a28" stroke-width="4" stroke-linecap="round"/>'+ /* eye-stripes */
          '<ellipse cx="391" cy="15.5" rx="3.2" ry="2.8" fill="#c9a03a"/>'+
          '<ellipse cx="391" cy="15.5" rx="1" ry="2.4" fill="#10130a"/>'+
          '<circle cx="390" cy="14.4" r="0.8" fill="rgba(255,255,240,.9)"/>'+
          '<circle cx="352" cy="18" r="1.1" fill="#232c14"/><circle cx="356" cy="15" r="1.1" fill="#232c14"/>'+
          '<path class="snk-tongue" d="M 344 24 q -7 -1 -10 -4.5 M 344 24 q -7 1.4 -10 5" fill="none" stroke="#c93a3a" stroke-width="1.6" stroke-linecap="round"/>'+
        '</g>'+
      '</svg></span>';
    if(me) checkRankUp(R);
    try{ renderHubStats(me); }catch(_){}
  }
  // Compact per-player stats board — all numbers come from the aggregated tetris_ranking row.
  function renderHubStats(me){
    var host=el('tet-hub-stats'); if(!host) return;
    me=me||_hubMe||{};
    var BOARD=(_tetBoard&&_tetBoard.length)?_tetBoard:[];
    function rankOf(field,asc){ var myv=Number(me[field]||0); if(!myv||!BOARD.length) return 0; var better=0; for(var i=0;i<BOARD.length;i++){ var v=Number(BOARD[i][field]||0); if(!v) continue; if(asc?(v<myv):(v>myv)) better++; } return better+1; }
    function card(label,val,sub,accent,rank){
      var rk=(rank&&rank>0)?'<span style="position:absolute;top:8px;right:9px;font-weight:800;font-size:9.5px;letter-spacing:.2px;padding:2px 8px;border-radius:20px;'+(rank===1?'background:linear-gradient(90deg,#ffd54a,#ffb020);color:#5a3d00;':'background:rgba(120,130,150,.14);color:#6b7d90;')+'">'+(rank===1?'🏆 ':'')+'Rank '+rank+'</span>':'';
      return '<div class="tstat" style="position:relative;">'+rk+'<span class="tstat-v"'+(accent?' style="color:'+accent+'"':'')+'>'+val+'</span>'+
             '<span class="tstat-l">'+label+'</span>'+(sub?('<span class="tstat-s">'+sub+'</span>'):'')+'</div>';
    }
    var dW=me.duel_wins||0, dL=me.duel_losses||0, dT=dW+dL, wr=dT?Math.round(dW/dT*100):0;
    var cells='';
    cells+=card('Best Score', Number(me.best||0).toLocaleString(), '', '#fbbf24', rankOf('best',false));
    cells+=card('Total Lines', Number(me.total_lines||0).toLocaleString(), '', '', rankOf('total_lines',false));
    cells+=card('★ Milestones', Number(me.solo_stars||0).toLocaleString(), 'solo bests', '', rankOf('solo_stars',false));
    cells+=card('Duel Win Rate', dT?(wr+'%'):'—', dT?(dW+'W · '+dL+'L'):'no duels yet', dT&&wr>=50?'#7bf5a8':(dT?'#f87171':''));
    var t2W=me.t2_wins||0, t2L=me.t2_losses||0, t2T=t2W+t2L, t2wr=t2T?Math.round(t2W/t2T*100):0;
    cells+=card('2v2 Win Rate', t2T?(t2wr+'%'):'—', t2T?(t2W+'W · '+t2L+'L'):'no 2v2 yet', t2T&&t2wr>=50?'#7bf5a8':(t2T?'#f87171':''));
    cells+=card('Sprint 40', me.sprint_ms?((me.sprint_ms/1000).toFixed(1)+'s'):'—', 'fastest', '', rankOf('sprint_ms',true));
    cells+=card('Ultra', me.ultra_score?Number(me.ultra_score).toLocaleString():'—', '2:00 best', '', rankOf('ultra_score',false));
    cells+=card('Best Combo', me.combo_best?('×'+me.combo_best):'—', '', '', rankOf('combo_best',false));
    cells+=card('Cup Wins', Number(me.wins||0).toLocaleString(), 'tournaments', '', rankOf('wins',false));
    cells+=card('Win Streak', me.best_streak?('×'+me.best_streak):'—', (me.cur_streak>0?('🔥 '+me.cur_streak+' now'):'best run'), me.best_streak>=5?'#ff9d3f':'', rankOf('best_streak',false));
    host.innerHTML='<div class="tstat-wrap"><div class="tstat-head"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21h20" opacity=".7"/><path d="M5 21V11"/><path d="M5 13c-1.6-.2-2.6-1.2-2.8-2.8 1.7-.2 2.7.8 2.8 2.8z" fill="rgba(74,222,128,.3)"/><path d="M12 21V4"/><path d="M12 8C12 5.6 10.4 4.2 8 4.1c0 2.5 1.6 4 4 3.9z" fill="rgba(74,222,128,.3)"/><path d="M12 12c0-2 1.4-3.2 3.6-3.1 0 2.2-1.5 3.3-3.6 3.1z" fill="rgba(190,242,100,.28)" stroke="#bef264"/><path d="M19 21v-8"/><path d="M19 15c-1.5-.1-2.4-1-2.6-2.5 1.6-.2 2.5.7 2.6 2.5z" fill="rgba(190,242,100,.28)" stroke="#bef264"/><circle cx="12" cy="2.6" r="1" fill="#fde68a" stroke="none"/></svg> Your Stats</div><div class="tstat-grid">'+cells+'</div></div>';
  }
  function renderHubPlay(){
    var host=el('tet-hub-play'); if(!host) return;
    function b(ic,label,sub,onclick,full){ return '<button class="hub-btn"'+(full?' style="grid-column:1/-1;"':'')+' onclick="'+onclick+'"><span class="hi">'+ic+'</span><span>'+label+'<small>'+sub+'</small></span></button>'; }
    host.innerHTML=
      b(HUBIC.cup,'3v3 Team Battle','Team up · 3 per side · last team standing',"window.d3Open&&window.d3Open()",true)+
      b(HUBIC.sprint,'Solo Arcade','6 practice modes · beat your records',"tetOpenSolo()")+
      b(HUBIC.ranked,'Ranked Match','Auto-match your rank & skill',"tetHubRanked()")+
      b(HUBIC.duel,'1v1 Duel','Pick a teammate yourself',"tetHubDuel()")+
      b(HUBIC.duel,'2v2 Duel','Team up · last team standing',"window.d2Open&&window.d2Open()")+
      b(HUBIC.cup,'Tournament','Knockout bracket → final',"tetHubGo('tourney')")+
      b(HUBIC.design,'The Locker','Skins, boards, FX & flair',"tetOpenDesigns()");
  }
  window.tetCloseDesigns=function(){ var m=el('tet-designs-modal'); if(m) m.classList.remove('open'); try{ stopInfernoBgShop(); }catch(e){} };
  window.tetOpenDesigns=function(){ var m=el('tet-designs-modal'); if(!m) return; m.classList.add('open'); try{ startInfernoBgShop(); }catch(e){}
    if(typeof loadWallet==='function') loadWallet();
    if(typeof loadCosmetics==='function') loadCosmetics();
    try{ tetCosTab(_cosTab||'blocks'); }catch(_){}
  };
  window.tetCloseSolo=function(){ var m=el('tet-solo-modal'); if(m) m.classList.remove('open'); try{ stopInfernoBgSolo(); }catch(e){} };
  window.tetOpenSolo=function(){ var m=el('tet-solo-modal'); if(!m) return;
    var host=el('tet-solo-grid');
    if(host){
      var wolfOpen=false, bearOpen=false, wizOpen=false, drgOpen=false;
      try{ wolfOpen=localStorage.getItem('mfWolfUnlocked')==='1'; bearOpen=localStorage.getItem('mfBearUnlocked')==='1'; wizOpen=localStorage.getItem('mfWizardUnlocked')==='1'; drgOpen=localStorage.getItem('mfDragonUnlocked')==='1'; }catch(_wu){}
      var modes=[['combo','Combo Rush','Best combo in 1:30'],['sprint','Sprint 40','Fastest 40 lines'],['ultra','Ultra','2-min score attack'],['cheese','Cheese Race','Dig 10 garbage rows fast'],['overgrow','Overgrowth','The forest rises — survive 2:00'],['snakehunt','Snake Hunt','BEAST LV.1 — slay the Anaconda'],
                 ['wolfhunt','Wolf Hunt', wolfOpen?'BEAST LV.2 — the pack hunts at speed':'🔒 Slay the Anaconda to unlock'],
                 ['bearhunt','Bear Hunt', bearOpen?'BEAST LV.3 — sheer force of the forest':'🔒 Slay the Wolf to unlock'],
                 ['wizardhunt','Wizard Hunt', wizOpen?'BEAST LV.4 — magic bends your reality':'🔒 Slay the Bear to unlock'],
                 ['dragonhunt','DRAGON HUNT', drgOpen?'BEAST LV.5 — THE FINALE. Fire falls from above':'🔒 Defeat the Wizard to unlock']];
      host.innerHTML=modes.map(function(x){
        var locked=(x[0]==='wolfhunt'&&!wolfOpen)||(x[0]==='bearhunt'&&!bearOpen)||(x[0]==='wizardhunt'&&!wizOpen)||(x[0]==='dragonhunt'&&!drgOpen);
        return '<button class="solo-card'+(locked?' locked':'')+'" onclick="'+(locked?(x[0]==='dragonhunt'?'tetDrgLocked()':(x[0]==='wizardhunt'?'tetWizLocked()':(x[0]==='bearhunt'?'tetBearLocked()':'tetWolfLocked()'))):('tetSoloGo(\''+x[0]+'\')'))+'"><span class="hi">'+(HUBIC[x[0]]||'')+'</span><span>'+x[1]+'<small>'+x[2]+'</small></span></button>'; }).join('');
      // server-truth unlocks: a recorded slay on the previous level opens the next gate
      [['snakehunt','mfWolfUnlocked',wolfOpen],['wolfhunt','mfBearUnlocked',bearOpen],['bearhunt','mfWizardUnlocked',wizOpen],['wizardhunt','mfDragonUnlocked',drgOpen]].forEach(function(gate){
        if(gate[2]||typeof eid!=='function'||!eid()) return;
        fetch(APPS_SCRIPT_URL+'?action=solo_ranking&mode='+gate[0]+'&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
          var me=String(eid()).toLowerCase();
          if(((d&&d.ranking)||[]).some(function(p){ return String(p.employee_id||'').toLowerCase()===me; })){
            try{ localStorage.setItem(gate[1],'1'); }catch(_ls){}
            try{ if(el('tet-solo-modal')&&el('tet-solo-modal').classList.contains('open')) tetOpenSolo(); }catch(_ro){}
          } }).catch(function(){}); });
    }
    m.classList.add('open'); try{ startInfernoBgSolo(); }catch(e){}
    try{ loadGauntlet(); }catch(_g){}
  };
  // ── Ghost Gauntlet: the team's best solo runs, ranked as ghosts to topple for stars ──
  var _GMODE={ combo:{lbl:'Combo Rush',ic:'👊',unit:function(v){return v+' combo';},dir:'hi'},
               ultra:{lbl:'Ultra',ic:'⏱️',unit:function(v){return Number(v).toLocaleString()+' pts';},dir:'hi'},
               overgrow:{lbl:'Overgrowth',ic:'🌿',unit:function(v){return v+' lines';},dir:'hi'},
               snakehunt:{lbl:'Snake Hunt',ic:'🐍',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'},
               wolfhunt:{lbl:'Wolf Hunt',ic:'🐺',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'},
               bearhunt:{lbl:'Bear Hunt',ic:'🐻',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'},
               wizardhunt:{lbl:'Wizard Hunt',ic:'🧙',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'},
               dragonhunt:{lbl:'Dragon Hunt',ic:'🐉',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'},
               sprint:{lbl:'Sprint 40',ic:'🏁',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'},
               cheese:{lbl:'Cheese Race',ic:'🧀',unit:function(v){return (v/1000).toFixed(1)+'s';},dir:'lo'} };
  function loadGauntlet(){
    var host=el('tet-gauntlet'); if(!host) return;
    host.innerHTML='<div style="text-align:center;color:#9c7a5e;font-size:12px;padding:14px;">Summoning ghosts…</div>';
    fetch(APPS_SCRIPT_URL+'?action=tetris_gauntlet&employee_id='+encodeURIComponent(eid())+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){ renderGauntlet(d); }).catch(function(){ host.innerHTML='<div style="text-align:center;color:#f87171;font-size:12px;padding:12px;">Couldn\'t load the Gauntlet.</div>'; });
  }
  function renderGauntlet(d){
    var host=el('tet-gauntlet'); if(!host) return;
    if(!d||!d.ok){ host.innerHTML='<div style="text-align:center;color:#9c7a5e;font-size:12px;padding:12px;">No ghosts yet — be the first to set records! 🏁</div>'; return; }
    var modes=d.modes||{}; var keys=Object.keys(modes);
    var summary='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 12px;">'+
      '<span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(255,190,60,.14);border:1px solid rgba(255,190,60,.4);color:#ffcf9e;">⭐ '+(d.earned||0)+' banked</span>'+
      '<span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(120,220,160,.12);border:1px solid rgba(120,220,160,.4);color:#8ef0b8;">🎯 '+(d.available||0)+' ghosts up for grabs · +'+(d.available_stars||0)+'★</span>'+
      '<span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#c9b8a8;">💀 '+(d.beaten||0)+' topped</span></div>';
    if(!keys.length){ host.innerHTML=summary+'<div style="text-align:center;color:#9c7a5e;font-size:12px;padding:12px;">No ghosts to chase yet — set some records! 🏁</div>'; return; }
    var order=['combo','ultra','survival','sprint','cheese'];
    var body=order.filter(function(k){return modes[k]&&modes[k].length;}).map(function(k){
      var G=_GMODE[k]||{lbl:k,ic:'👻',unit:function(v){return v;}};
      var rows=modes[k].map(function(g){
        var done=g.done||g.surpassed;
        var star='<span style="font-weight:900;color:'+(done?'#6b7d90':'#ffcf9e')+';white-space:nowrap;font-size:12px;">'+(done?'✓ ':'+')+g.stars+'★</span>';
        return '<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;margin-bottom:5px;border-radius:10px;'+
          (done?'background:linear-gradient(150deg,rgba(30,34,44,.7),rgba(14,16,22,.85));border:1px solid rgba(255,255,255,.07);opacity:.72;'
               :'background:linear-gradient(150deg,rgba(60,18,8,.55),rgba(20,8,6,.7));border:1px solid rgba(255,150,80,.34);')+'">'+
          '<span style="width:22px;text-align:center;">'+(done?'💀':'👻')+'</span>'+
          '<span style="flex:1;min-width:0;font-size:12.5px;font-weight:700;color:'+(done?'#9fb0d6':'#ffece0')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(g.owner)+'</span>'+
          '<span style="font-size:11px;color:#c9905f;white-space:nowrap;">'+G.unit(g.metric)+'</span>'+star+'</div>';
      }).join('');
      return '<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:800;color:#f4c79c;letter-spacing:.04em;margin-bottom:6px;">'+G.ic+' '+G.lbl+'</div>'+rows+'</div>';
    }).join('');
    host.innerHTML=summary+body;
  }
  window.tetSoloGo=function(mode){ tetCloseSolo(); tetHubGo(mode); };
  window.renderHubPlayBack=function(){ renderHubPlay(); };
  // Play is collapsed by default — the hub leads with your rank and the board, not a wall of buttons.
  window.tetTogglePlay=function(){
    var sec=el('tet-play-sec'), body=el('tet-hub-play'); if(!sec||!body) return;
    var nowHidden=body.classList.toggle('sec-hide');
    sec.classList.toggle('closed', nowHidden);
    if(!nowHidden) renderHubPlay();          // always reopen on the mode list, not a sub-view
    try{ sfxRot(); }catch(_){}
  };
  function collapsePlay(){ /* Play is always expanded now — no collapse */
    var body=el('tet-hub-play'); if(body) body.classList.remove('sec-hide');
    try{ renderHubPlay(); }catch(e){}
  }
  window.tetHubGo=function(mode){
    tetCloseRanking();
    if(mode==='daily'){ if(window.tetrisDaily) tetrisDaily(); }
    else if(mode==='combo'){ if(window.tetrisCombo) tetrisCombo(); }
    else if(mode==='sprint'){ if(window.tetrisSprint) tetrisSprint(); }
    else if(mode==='ultra'){ if(window.tetrisUltra) tetrisUltra(); }
    else if(mode==='cheese'){ if(window.tetrisCheese) tetrisCheese(); }
    else if(mode==='survival'){ if(window.tetrisSurvival) tetrisSurvival(); }
    else if(mode==='overgrow'){ if(window.tetrisOvergrow) tetrisOvergrow(); }
    else if(mode==='snakehunt'){ if(window.tetrisSnakehunt) tetrisSnakehunt(); }
    else if(mode==='wolfhunt'){ if(window.tetrisWolfhunt) tetrisWolfhunt(); }
    else if(mode==='bearhunt'){ if(window.tetrisBearhunt) tetrisBearhunt(); }
    else if(mode==='wizardhunt'){ if(window.tetrisWizardhunt) tetrisWizardhunt(); }
    else if(mode==='dragonhunt'){ if(window.tetrisDragonhunt) tetrisDragonhunt(); }
    else if(mode==='ration'){ if(window.tetrisRation) tetrisRation(); }
    else if(mode==='tourney'){ if(window.tourneyStart) tourneyStart(); }
  };
  window.tetHubDuel=function(){
    var host=el('tet-hub-play'); if(!host) return;
    var meId=(typeof eid==='function')?eid():'';
    var ids=[]; try{ ids=Object.keys(presenceNames||{}).filter(function(id){ return String(id)!==String(meId) && (typeof isUserOnline!=='function' || isUserOnline(id)); }); }catch(e){}
    var back='<button class="hub-btn" style="grid-column:1/-1;justify-content:center;" onclick="renderHubPlayBack()"><span>← Back to modes</span></button>';
    if(!ids.length){ host.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#9fb0d6;font-size:12px;padding:14px;">No teammates online right now.</div>'+back; return; }
    host.innerHTML = ids.map(function(id){
      var name=(presenceNames&&presenceNames[id])||id; var ph=rkPhoto(id);
      var av=ph?'<span class="hi" style="padding:0;overflow:hidden;background:#0b1020;"><img src="'+ph+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9px;"></span>':'<span class="hi">'+rkInitial(name)+'</span>';
      var riv=_tetRivals[String(name).toLowerCase()]; var rvt=riv?(' · '+(riv.w>riv.l?'you lead ':(riv.w<riv.l?'you trail ':'even '))+riv.w+'–'+riv.l):'';
      return '<button class="hub-btn" style="grid-column:1/-1;" onclick="tetHubChallenge(\''+encodeURIComponent(id)+'\',\''+encodeURIComponent(name)+'\')">'+av+'<span>'+esc(name)+'<small>Tap to challenge'+rvt+'</small></span></button>';
    }).join('') + back;
  };
  window.tetHubChallenge=function(idEnc,nameEnc){ var id=decodeURIComponent(idEnc), name=decodeURIComponent(nameEnc); tetCloseRanking(); if(window.tetrisInviteTo) tetrisInviteTo(id, name); };

  // ══════════════ RANKED MATCH — find someone at your level ══════════════
  // Small team, so there's no queue: we look at who's online right now and pick the
  // teammate whose RANK is closest to yours. A fair fight beats a fast one.
  var _tetBoard=null;   // last-fetched ranking rows, cached so matchmaking is instant
  function boardRowFor(id){
    if(!_tetBoard) return null; var k=String(id).toLowerCase();
    for(var i=0;i<_tetBoard.length;i++){ if(String(_tetBoard[i].employee_id||'').toLowerCase()===k) return _tetBoard[i]; }
    return null;
  }
  function myStarRank(){ var r=boardRowFor((typeof eid==='function')?eid():''); return rankFromStars(r?(r.stars||0):0).rank; }
  function onlineOpponents(){
    var meId=(typeof eid==='function')?eid():'';
    try{ return Object.keys(presenceNames||{}).filter(function(id){
      return String(id)!==String(meId) && (typeof isUserOnline!=='function' || isUserOnline(id)); }); }catch(e){ return []; }
  }
  var _poolBeaten=[];   // ids of pool opponents already put away — they're done, don't offer them again
  window.tetHubRanked=function(){
    var host=el('tet-hub-play'); if(!host) return;
    var back='<button class="hub-btn" style="grid-column:1/-1;justify-content:center;" onclick="renderHubPlayBack()"><span>← Back to modes</span></button>';
    host.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#9fb0d6;font-size:12.5px;padding:18px;">⚔ Finding an opponent at your level…</div>'+back;
    // Fetch the board AND your conquest list before judging who's worth offering.
    Promise.all([
      fetch(APPS_SCRIPT_URL+'?action=tetris_ranking&_='+Date.now()).then(function(r){return r.json();}).catch(function(){ return null; }),
      fetch(APPS_SCRIPT_URL+'?action=tetris_pool_beaten&employee_id='+encodeURIComponent(eid())+'&_='+Date.now()).then(function(r){return r.json();}).catch(function(){ return null; })
    ]).then(function(res){
      if(res[0] && res[0].ranking) _tetBoard=res[0].ranking;
      if(res[1] && res[1].beaten)  _poolBeaten=res[1].beaten;
      renderRankedMatch();
    });
  };
  function renderRankedMatch(){
    var host=el('tet-hub-play'); if(!host) return;
    var back='<button class="hub-btn" style="grid-column:1/-1;justify-content:center;" onclick="renderHubPlayBack()"><span>← Back to modes</span></button>';
    var myR=myStarRank();
    // Live teammates first — a real opponent always beats a standing one.
    var cands=onlineOpponents().map(function(id){
      var row=boardRowFor(id);
      var R=rankFromStars(row?(row.stars||0):0);
      return { id:id, name:(presenceNames&&presenceNames[id])||id, R:R, row:row,
               gap:Math.abs(R.rank-myR), cpu:false };
    });
    // Then the standing pool. Anyone you've already beaten is SKIPPED — their stars are claimed
    // and there's nothing left to win, so offering them again would just be noise.
    var pool=rankedPool().filter(function(b){ return _poolBeaten.indexOf(b.id)<0; }).map(function(b){
      return { id:b.id, name:b.name, R:{rank:b.rank, tier:b.tier, god:false, stars:0},
               row:{ duel_wins:b.wins, duel_losses:b.losses },
               gap:Math.abs(b.rank-myR), cpu:true, lv:b.lv };
    }).sort(function(a,b){ return a.gap-b.gap; }).slice(0,6);

    cands = cands.concat(pool).sort(function(a,b){
      if(a.gap!==b.gap) return a.gap-b.gap;
      return (a.cpu?1:0)-(b.cpu?1:0);      // dead tie → the human gets it
    });
    var beat=_poolBeaten.length, tot=rankedPool().length;
    var prog='<div style="grid-column:1/-1;font-size:10.5px;color:#8a97b5;text-align:center;margin-bottom:2px;">'+
      '⚔ <b style="color:#fbbf24;">'+beat+'</b> / '+tot+' ranked opponents defeated'+
      (beat>=tot?' — <b style="color:#fde047;">roster cleared 👑</b>':'')+'</div>';
    if(!cands.length){
      host.innerHTML=prog+'<div style="grid-column:1/-1;text-align:center;color:#9fb0d6;font-size:12.5px;padding:16px;line-height:1.6;">'+
        (beat>=tot
          ? 'You have beaten <b>every ranked opponent</b>. Nothing left to conquer here — 👑<br><span style="color:#6b7d90;font-size:11.5px;">Only live duels and tournaments can take you higher now.</span>'
          : 'No opponents online and no unbeaten opponents left near your rank.')+
        '</div>'+back;
      return;
    }

    var best=cands[0];
    var quality = best.gap<=3 ? {t:'PERFECT MATCH', c:'#22c55e'}
                : best.gap<=10 ? {t:'CLOSE MATCH',  c:'#38bdf8'}
                : best.gap<=25 ? {t:'ROUGH MATCH',  c:'#fbbf24'}
                : {t:'MISMATCH', c:'#f87171'};
    var fight=function(c){
      return c.cpu ? ('tetRankedFight(\''+encodeURIComponent(c.id)+'\')')
                   : ('tetHubChallenge(\''+encodeURIComponent(c.id)+'\',\''+encodeURIComponent(c.name)+'\')');
    };
    var ph=best.cpu?null:rkPhoto(best.id);
    var bring=ringStyle(best.R.tier,3);
    var av=ph?'<div class="hp-av" style="'+bring+'"><img src="'+ph+'" alt=""></div>':'<div class="hp-av" style="'+bring+'">'+rkInitial(best.name)+'</div>';
    var wl=best.row?((best.row.duel_wins||0)+'W–'+(best.row.duel_losses||0)+'L'):'no duels yet';
    var live=best.cpu?'':'<span style="color:#22c55e;font-size:9.5px;font-weight:800;"> ● ONLINE NOW</span>';

    var card='<div style="grid-column:1/-1;" class="hub-prof">'+av+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-size:9.5px;font-weight:900;letter-spacing:1px;color:'+quality.c+';">'+quality.t+live+'</div>'+
        '<div class="hp-name">'+esc(best.name)+'</div>'+
        '<div class="hp-stars"><em>Rank '+best.R.rank+' · '+esc(best.R.tier)+' · '+wl+'</em></div>'+
        '<div class="hp-stars"><em style="color:#6b7d90;">You are Rank '+myR+' — '+(best.gap===0?'dead level':(best.gap+' rank'+(best.gap===1?'':'s')+' apart'))+'</em></div>'+
      '</div>'+
      '<div class="hp-rank '+tierCls(best.R.tier)+'"><b>'+best.R.rank+'</b><span>'+esc(best.R.tier)+'</span></div>'+
    '</div>';

    var go='<button class="hub-btn" style="grid-column:1/-1;justify-content:center;background:linear-gradient(135deg,rgba(255,107,26,.28),rgba(232,61,0,.14));border-color:rgba(255,107,26,.6);" '+
      'onclick="'+fight(best)+'">'+
      '<span class="hi">⚔</span><span>Challenge '+esc(best.name)+'<small>'+
      (best.cpu ? ('Ranked match · first win banks +'+poolStars(best.R.rank)+' ★')
                : 'Live duel · winner takes +12 ★')+'</small></span></button>';

    var others=cands.slice(1,8);
    var rest = others.length
      ? '<div style="grid-column:1/-1;font-size:10px;font-weight:800;color:#8a97b5;letter-spacing:.6px;text-transform:uppercase;margin-top:4px;">Other opponents at your level</div>'+
        others.map(function(c){
          var p2=c.cpu?null:rkPhoto(c.id);
          var rr=ringStyle(c.R.tier,2)+'border-radius:9px;';
          var a2=p2?'<span class="hi" style="padding:0;overflow:hidden;background:#0b1020;'+rr+'"><img src="'+p2+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:7px;"></span>'
                   :'<span class="hi" style="'+rr+'">'+rkInitial(c.name)+'</span>';
          return '<button class="hub-btn" style="grid-column:1/-1;" onclick="'+fight(c)+'">'+a2+
            '<span>'+esc(c.name)+(c.cpu?'':' <span style="color:#22c55e;">●</span>')+
            '<small>Rank '+c.R.rank+' · '+esc(c.R.tier)+
            (c.cpu?(' · <b style="color:#fbbf24;">+'+poolStars(c.R.rank)+' ★</b>'):(' · '+(c.gap===0?'dead level':c.gap+' apart')))+
            '</small></span></button>';
        }).join('')
      : '';
    host.innerHTML = prog + card + go + rest + back;
  }

  function _setTetCoins(n){ var v=Number(n||0); var a=el('tet-coins-lbl'); if(a) a.textContent=v.toLocaleString()+' coins'; var b=el('tet-hub-coins'); if(b) b.textContent=v.toLocaleString(); }
  // ── Block designs shop ──
  var _tetWallet=null;
  var _tetAdRAF=null,_tetAdLast=0;
  function drawTetAd(){ var cv=el('tet-ad-cv'); if(!cv||typeof DESIGNS==='undefined') return; var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
    var skins=['mossy','elderwood','mossy','canopy'], pal=[COLORS[5],COLORS[1],COLORS[3],COLORS[4]], n=skins.length, pad=8, gx=8, gy=8;
    var cs=Math.min((cv.width-pad*2-gx*(n-1))/n,(cv.height-pad*2-gy)/2), ox=(cv.width-(n*cs+gx*(n-1)))/2, oy=(cv.height-(2*cs+gy))/2;
    for(var r=0;r<2;r++){ for(var c=0;c<n;c++){ var d=DESIGNS[skins[c]]; if(!d)continue; var col=pal[(c+r*2)%pal.length]; try{ d.cell(ctx, ox+c*(cs+gx), oy+r*(cs+gy), cs, col, true); }catch(e){} } }
  }
  function tetAdTick(t){ var m=el('tet-rank-modal'); if(!m||!m.classList.contains('open')){ _tetAdRAF=null; return; }
    try{ ravAdFrame(); }catch(_ra){}
    try{ dropAdFrame(); }catch(_da){}
    // ads hidden — don't burn a rAF loop painting a canvas nobody can see
    var _ad=el('tet-hub-ad'); if(_ad&&getComputedStyle(_ad).display==='none'){ _tetAdRAF=null; return; }
    if(!_tetAdLast||t-_tetAdLast>=70){ _tetAdLast=t; drawTetAd(); } _tetAdRAF=requestAnimationFrame(tetAdTick); }
  /* The Ravager ad animates the one thing a still image cannot show: a block LOSING its spikes
     when something lands beside it. Two cells drift together, the barbs between them retract,
     and the seam lights. Everything else about the skin is secondary to that. */
  function ravAdFrame(){
    var cv=el('tet-ad-rav'); if(!cv) return;
    var c=cv.getContext('2d'); c.clearRect(0,0,cv.width,cv.height);
    var t=(Date.now()/2600)%1;
    var cs=Math.min(46, cv.height*0.44);
    var close=Math.max(0,Math.min(1,(Math.sin(t*6.283)+1)/2));   // 0 apart → 1 touching
    var gapPx=cs*0.85*(1-close);
    var cy=(cv.height-cs)/2, cx=(cv.width-(cs*2+gapPx))/2;
    var joined=close>0.86;
    function cell(px,py,col,edges){
      var m=cs*0.02, a=px+m, b=py+m, w=cs-2*m, r=cs*0.14;
      var pulse=0.5+0.5*Math.sin(t*12.57);
      [[0,-1,1],[0,1,1],[-1,0,edges.l],[1,0,edges.r]].forEach(function(d){
        if(!d[2]) return;                                   // has a neighbour → no barbs
        var n=3, len=cs*0.26*(0.8+0.2*pulse);
        for(var k=0;k<n;k++){
          var f=(k+0.5)/n;
          var sx=a+(d[0]===0? w*f : (d[0]<0?0:w));
          var sy=b+(d[1]===0? w*f : (d[1]<0?0:w));
          var g=c.createLinearGradient(sx,sy,sx+d[0]*len,sy+d[1]*len);
          g.addColorStop(0,col); g.addColorStop(1,'rgba(255,255,255,0)');
          c.fillStyle=g; c.beginPath();
          var ox=d[1]!==0? w*0.13:0, oy=d[0]!==0? w*0.13:0;
          c.moveTo(sx-ox,sy-oy); c.lineTo(sx+d[0]*len,sy+d[1]*len); c.lineTo(sx+ox,sy+oy); c.closePath(); c.fill();
        }
      });
      rr(c,a,b,w,w,r);
      var bg=c.createLinearGradient(a,b,a,b+w); bg.addColorStop(0,'#1a1d24'); bg.addColorStop(1,'#08090d');
      c.fillStyle=bg; c.fill();
      if(joined){
        c.save(); rr(c,a,b,w,w,r); c.clip();
        var sx2=a+w/2+(edges.l?0:-w/2)+(edges.r?0:w/2);
        var rg=c.createRadialGradient(sx2,b+w/2,0,sx2,b+w/2,w*0.8);
        rg.addColorStop(0,col); rg.addColorStop(0.45,'rgba(255,120,0,'+(0.35+0.35*pulse)+')'); rg.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=rg; c.fillRect(a,b,w,w); c.restore();
      }
      c.strokeStyle='rgba(255,255,255,0.13)'; c.lineWidth=Math.max(1,cs*0.035); rr(c,a,b,w,w,r); c.stroke();
    }
    cell(cx, cy, '#ff8a1e', { l:1, r:joined?0:1 });
    cell(cx+cs+gapPx, cy, '#ff3860', { l:joined?0:1, r:1 });
    c.font='700 10px system-ui,sans-serif'; c.textAlign='center';
    c.fillStyle=joined?'rgba(255,214,170,.95)':'rgba(255,255,255,.5)';
    c.fillText(joined?'seams fuse':'spiked on every open edge', cv.width/2, cv.height-9);
  }
  /* Each mini-board animates the ONE thing that sells its skin: Kintsugi's gold arriving as two
     blocks meet, Kiln cooling from white to dark, Ravager's barbs retracting at a join. All three
     are behaviours, and a still image cannot show any of them. */
  function dropAdFrame(){
    /* One canvas, three blocks — white, blue, red — so the white sun block is visible before
       anyone opens the Locker. The skin derives its colour from the palette value it is handed,
       so we search for a value that lands on each variant rather than guessing three and hoping;
       the previous version fell back to the same colour twice and the ad shipped without the
       white block, which was the only thing it was there to show. */
    var cv=el('ad-pil'); if(!cv||typeof DESIGNS==='undefined') return;
    var d=DESIGNS['pilipinas']; if(!d) return;
    var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle='#05070f'; ctx.fillRect(0,0,cv.width,cv.height);
    function variantOf(col){
      var st=String(col), n=0;
      for(var i=0;i<st.length;i++) n=(n*31+st.charCodeAt(i))|0;
      return ['b','r','b','r','w','b','r'][Math.abs(n)%7];
    }
    if(!dropAdFrame._cols){
      var want=['w','b','r'], found={}, out=[];
      for(var t=0; t<4096 && out.length<3; t++){
        var cand='#'+('00000'+t.toString(16)).slice(-6);
        var v=variantOf(cand);
        if(want.indexOf(v)>=0 && !found[v]){ found[v]=cand; }
        if(found.w&&found.b&&found.r) break;
      }
      dropAdFrame._cols=[found.w,found.b,found.r].filter(Boolean);
    }
    var cols=dropAdFrame._cols;
    if(cols.length<3) return;
    var n2=cols.length, gap=9, cs=Math.min(cv.height-14,(cv.width-14-gap*(n2-1))/n2);
    var ox=(cv.width-(n2*cs+gap*(n2-1)))/2, oy=(cv.height-cs)/2;
    for(var i2=0;i2<n2;i2++){ try{ d.cell(ctx, ox+i2*(cs+gap), oy, cs, cols[i2], true); }catch(e){} }
  }
  function startTetAd(){ if(_tetAdRAF) return; _tetAdLast=0; _tetAdRAF=requestAnimationFrame(tetAdTick); azAdProgress(); }
  /* The unlock ad reads the player's actual rank, so it says "18 ranks to go" instead of a
     generic pitch — and stops advertising something they already own. */
  function azAdProgress(){
    var box=el('az-ad-prog'); if(!box) return;
    var NEED=100;
    try{
      var id=(typeof eid==='function')?eid():''; if(!id) return;
      fetch(APPS_SCRIPT_URL+'?action=tetris_rank&employee_id='+encodeURIComponent(id)+'&_='+Date.now())
        .then(function(r){ return r.json(); }).then(function(d){
          var rk=(d&&(d.rank||d.star_rank))||0;
          if(rk>=NEED){
            box.innerHTML='<span style="color:#7dd3fc;">✓ Unlocked</span> — equip it from the Locker.';
            return;
          }
          var left=NEED-rk, pct=Math.max(2,Math.min(100,Math.round(rk/NEED*100)));
          box.innerHTML='Reach <b style="color:#fff;">Rank '+NEED+'</b> this season to unlock it.'+
            '<div style="margin-top:7px;height:6px;border-radius:99px;background:rgba(2,16,28,.55);overflow:hidden;">'+
              '<i style="display:block;height:100%;width:'+pct+'%;background:linear-gradient(90deg,#38bdf8,#bae6fd);border-radius:99px;"></i></div>'+
            '<div style="margin-top:5px;opacity:.9;">You\'re Rank '+rk+' — <b style="color:#fff;">'+left+'</b> to go.</div>';
        }).catch(function(){});
    }catch(e){}
  }
  var _prevPal=['#22d3ee','#a855f7','#f97316','#22c55e'];   // sample piece colors for previews
  function drawDesignPreview(cv, id){
    if(!cv) return; var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
    var d=DESIGNS[id]||DESIGNS.classic;
    var pal=[COLORS[1],COLORS[2],COLORS[3],COLORS[4],COLORS[5],COLORS[6],COLORS[7]], n=pal.length, gap=Math.max(3,cv.width*0.012);
    var cs=Math.min(cv.height-8,(cv.width-10-gap*(n-1))/n), tot=n*cs+gap*(n-1), ox=(cv.width-tot)/2, oy=(cv.height-cs)/2;
    ctx.save(); ctx.translate(ox,oy);
    for(var i=0;i<n;i++){ try{ d.cell(ctx, i*(cs+gap), 0, cs, pal[i]); }catch(e){} }
    ctx.restore();
  }
  // Animated skins keep their Locker preview moving to entice buyers.
  var ANIMATED_SKINS={mossy:1,elderwood:1,azero:1,inferno:1,emoji:1,prisma:1,holo:1,abyss:1,mirage:1,rgbgamer:1,matrix:1,lavalamp:1,kaleido:1,ravager:1,kintsugi:1,kiln:1,aquarium:1,pilipinas:1,nightsuit:1};
  var _thmPrevRAF=null;
  function _animatePreviews(host){
    if(_thmPrevRAF){ cancelAnimationFrame(_thmPrevRAF); _thmPrevRAF=null; }
    var canvases=[].slice.call(host.querySelectorAll('canvas.thm-prev')).filter(function(cv){ return ANIMATED_SKINS[cv.getAttribute('data-design')]; });
    if(!canvases.length) return;
    var last=0;
    function loop(ts){
      if(!host.offsetParent){ _thmPrevRAF=null; return; }           // Locker/tab hidden → stop
      if(ts-last>=40){ last=ts; canvases.forEach(function(cv){ drawDesignPreview(cv, cv.getAttribute('data-design')); }); }
      _thmPrevRAF=requestAnimationFrame(loop);
    }
    _thmPrevRAF=requestAnimationFrame(loop);
  }
  function renderThemes(w){
    var host=el('tet-hub-themes'); if(!host) return;
    var owned=(w&&w.owned)||['classic'], equipped=(w&&w.equipped)||EQUIPPED;
    // Use the freshest known balance so a stale/empty wallet never wrongly locks every design.
    var coins=(w&&w.coins!=null)?w.coins:((typeof _tetCos!=='undefined'&&_tetCos&&_tetCos.coins!=null)?_tetCos.coins:((_tetWallet&&_tetWallet.coins!=null)?_tetWallet.coins:0));
    var rating=(w&&w.rating!=null)?w.rating:0;
    _setTetCoins(coins);
    /* Hide retired designs from the shop, but keep showing one you already own — otherwise a
       paid-for design silently disappears from the Locker and there is no way to equip it. */
    var ids=Object.keys(DESIGNS).filter(function(id){
      if(DESIGNS[id].hidden) return false;
      if(DESIGNS[id].retired) return owned.indexOf(id)>=0;
      return true;
    });
    // ── categories: Regular (standard coin skins) · Premium (top-tier coin skins) · Iconic (rank-earned flagships) ──
    function catOf(t){ if(t.tier) return t.tier; if(t.req) return 'iconic'; if((t.cost||0)>=5000) return 'premium'; return 'regular'; }
    function cardHTML(id){
      var t=DESIGNS[id]; var own=owned.indexOf(id)>=0, on=(id===equipped); var btn, tag;
      if(t.req){
        tag = '<span class="thm-cost req">Rank '+t.req+'+</span>';
        if(on)        btn='<button class="thm-btn on">Equipped</button>';
        else if(own)  btn='<button class="thm-btn equip" onclick="tetEquipTheme(\''+id+'\')">Equip</button>';
        else          btn='<button class="thm-btn locked" disabled>Rank '+rating+' / '+t.req+'</button>';
      } else {
        tag = (t.cost>0 ? '<span class="thm-cost">'+t.cost+'</span>'
                        : '<span class="thm-cost" style="color:#34d399;">Free</span>');
        if(on)               btn='<button class="thm-btn on">Equipped</button>';
        else if(own)         btn='<button class="thm-btn equip" onclick="tetEquipTheme(\''+id+'\')">Equip</button>';
        else                 btn='<button class="thm-btn unlock'+(coins>=t.cost?'':' short')+'" onclick="tetUnlockTheme(\''+id+'\')">Unlock · '+t.cost+'</button>';   // always clickable — server validates coins (avoids stale-wallet false lock)
      }
      var noteHTML = (t.req && !own) ? '<div class="thm-req">Earned at rating '+t.req+' — can’t be bought.</div>'
                   : (t.ach && !own) ? '<div class="thm-req" style="color:#5ce1e6;">🎯 Free if you hit any: 15 combo · Cheese ≤30s · Sprint ≤75s</div>' : '';
      return '<div class="thm-card'+(on?' equipped':'')+((t.req||t.tier==='iconic')?' elite':'')+(t.tier==='collector'?' collector':'')+'">'+
        '<div class="thm-top"><span class="thm-name">'+t.name+(((t.req||t.tier==='collector'||t.tier==='iconic')&&own)?' 🏆':'')+'</span>'+tag+'</div>'+
        '<canvas class="thm-prev" data-design="'+id+'" width="300" height="38"></canvas>'+btn+
        noteHTML+
        '</div>';
    }
    var groups={ regular:[], premium:[], iconic:[], collector:[] };
    ids.forEach(function(id){ groups[catOf(DESIGNS[id])].push(id); });
    var order=[['regular','Regular'],['premium','Premium'],['iconic','Iconic'],['collector','Collector']];
    host.innerHTML=order.map(function(g){ var arr=groups[g[0]]; if(!arr.length) return '';
      return '<div class="thm-cat thm-cat-'+g[0]+'">'+g[1]+' <span class="thm-cat-n">'+arr.length+'</span></div>'+arr.map(cardHTML).join('');
    }).join('');
    Array.prototype.forEach.call(host.querySelectorAll('canvas.thm-prev'), function(cv){ drawDesignPreview(cv, cv.getAttribute('data-design')); });
    _animatePreviews(host);
    try{ refreshDesignSummary(); }catch(_){}
  }
  window.tetEquipTheme=function(id){
    if(!DESIGNS[id]) return; applyTheme(id);
    if(_tetWallet){ _tetWallet.equipped=id; renderThemes(_tetWallet); }
    try{ sfxRot(); }catch(_){}
    fetch(APPS_SCRIPT_URL+'?action=tetris_equip&employee_id='+encodeURIComponent(eid())+'&theme='+encodeURIComponent(id)+'&_='+Date.now()).catch(function(){});
  };
  window.tetUnlockTheme=function(id){
    if(!DESIGNS[id]) return;
    fetch(APPS_SCRIPT_URL+'?action=tetris_unlock&employee_id='+encodeURIComponent(eid())+'&theme='+encodeURIComponent(id)+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){
        if(d&&d.ok&&d.wallet){ _tetWallet=d.wallet; applyTheme(d.wallet.equipped); renderThemes(d.wallet); try{ sfxWin(); }catch(_){} loadCosmetics(); }
        else if(d&&d.error==='NOT_ENOUGH'){ try{ showToast('Not enough coins — need '+Number(d.need).toLocaleString()+', you have '+Number(d.have).toLocaleString()+'.'); }catch(_){} loadWallet(); }
        else { try{ showToast('Could not unlock — try again.'); }catch(_){} loadWallet(); }
      }).catch(function(){ try{ showToast('Network error.'); }catch(_){} });
  };
  function loadWallet(){
    renderThemes(_tetWallet); try{ refreshDesignSummary(); }catch(_){}
    fetch(APPS_SCRIPT_URL+'?action=tetris_wallet&employee_id='+encodeURIComponent(eid())+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(w){ if(w&&w.ok){ _tetWallet=w; applyTheme(w.equipped); renderThemes(w); try{ refreshDesignSummary(); }catch(_){} } }).catch(function(){});
  }

  // ══════════════ THE LOCKER — boards · effects · sound · flair ══════════════
  // Mirrors the server catalog. Costs here are display-only; the server is authoritative.
  var COS_CAT={
    bg:{
      classic:  {n:'Classic',   c:0,    d:'The original deep-space board'},
      grid:     {n:'Grid',      c:200,  d:'Clean guide lines for precise stacking'},
      nebula:   {n:'Nebula',    c:450,  d:'Purple starfield, drifting deep'},
      sunset:   {n:'Sunset',    c:650,  d:'Warm dusk over a dark horizon'},
      matrix:   {n:'Matrix',    c:850,  d:'Falling green code'},
      ocean:    {n:'Ocean',     c:1050, d:'Deep water and slow currents'},
      synthwave:{n:'Synthwave', c:1500, d:'Retro grid and a chrome sun'},
      paper:    {n:'Paper',     c:900,  d:'Warm ruled paper. Reads like a notebook.'},
      studio:   {n:'Studio',    c:1100, d:'Clean white with a soft vignette.'},
      blueprint:{n:'Blueprint', c:1250, d:'Draughtsman\u2019s grid on pale blue.'},
      linen:    {n:'Linen',     c:1400, d:'Woven off-white, quiet and warm.'},
      mint:     {n:'Mint',      c:1600, d:'Pale green wash with a light bloom.'},
      sakura:   {n:'Sakura',    c:1800, d:'Blossom pink, petals scattered.'},
      carbon:   {n:'Carbon',    c:2000, d:'Woven carbon fibre, dark and technical.'},
      sandstorm:{n:'Sandstorm', c:2200, d:'Desert light in drifting bands.'},
      arcade:   {n:'Arcade',    c:2400, d:'Scanlines and a neon floor glow.'},
      pilipinas:{n:'Pilipinas', c:3000, d:'The flag as a board. Made for the Pilipinas skin.'},
      nightweb: {n:'Nightweb',  c:3000, d:'One great silver web in the dark. Made for the Night Suit skin.'},
      aurora:   {n:'Aurora',    req:120,d:'Northern lights. Earned, not sold.'}
    },
    fx:{
      spark:    {n:'Spark',    c:0,    d:'The classic burst'},
      confetti: {n:'Confetti',  c:250, d:'Tumbling paper, party energy'},
      embers:   {n:'Embers',    c:500, d:'Glowing cinders that float up'},
      snow:     {n:'Snowfall',  c:750, d:'Soft, slow, quiet'},
      bolts:    {n:'Bolts',     c:1100,d:'Electric streaks that snap upward'},
      petals:   {n:'Petals',    c:1400,d:'Cherry blossom drift'},
      galaxy:   {n:'Galaxy',    req:140,d:'A supernova per line. Earned, not sold.'}
    },
    sfx:{
      arcade:{n:'Arcade', c:0,    d:'The default cabinet sound'},
      retro: {n:'Retro',  c:300,  d:'Low, fat 8-bit square waves'},
      soft:  {n:'Soft',   c:600,  d:'Gentle sine tones — easy on the ears'},
      hype:  {n:'Hype',   c:1000, d:'Bright, loud, aggressive'}
    },
    frame:{
      none:    {n:'None',     c:0,    d:'No frame'},
      bronze:  {n:'Bronze',   c:250,  d:'A quiet flex'},
      silver:  {n:'Silver',   c:650,  d:'Cool metallic ring'},
      gold:    {n:'Gold',     c:1300, d:'Unmistakable'},
      neon:    {n:'Neon',     c:1900, d:'Cyan-violet glow'},
      champion:{n:'Champion', champ:true, d:'Only the reigning champion wears this'}
    }
  };
  var COS_DEF={ bg:'classic', fx:'spark', sfx:'arcade', frame:'none', title:'rookie' };
  var _tetCos=null, _cosTab='blocks', _hubMe=null;

  // ══════════════ THE RANK LADDER ══════════════
  // Mirrors the server. STARS come from three places:
  //   SOLO      milestone tiers, banked ONCE per mode: 10/20/35/55/80/110/145/185/230/280 ★.
  //             The gain GROWS each rung (+10 → +50). You're paid for your BEST result ever;
  //             improve it and you collect only the difference. Replaying a score pays nothing.
  //   DUELS     +12 win / -6 loss, capped at +24 per opponent per day (anti-farm).
  //   TOURNEYS  +45 win / +25 podium / +10 played (capped at 45) — Day and Nightly are the same.
  //             (Tournaments before the 2026-07-15 cutoff keep their original stars — ranks frozen.)
  // Ranks 1–100 cost 15 ★; 101–110 cost 150 ★. God of Tetris = 3,000 ★ — unreachable on solo
  // alone (all five modes maxed = 1,400 ★ → Rank 94). The crown requires beating people.
  var RANK_TIERS=[[1,'Tenderfoot'],[10,'Rookie'],[20,'Amateur'],[30,'Contender'],[40,'Challenger'],
                  [50,'Veteran'],[60,'Expert'],[70,'Master'],[80,'Grandmaster'],[90,'Elite'],
                  [100,'Legend'],[106,'Demi-god']];
  function tierName(rank,god){ if(god) return 'God of Tetris';
    var n='Tenderfoot'; for(var i=0;i<RANK_TIERS.length;i++){ if(rank>=RANK_TIERS[i][0]) n=RANK_TIERS[i][1]; } return n; }
  function tierCls(tier){ return 'tr-'+String(tier).toLowerCase().replace(/[^a-z]+/g,''); }
  // Your rank IS your ring. The border round every avatar is coloured by tier — one glance
  // at the board tells you who's dangerous, no medals required.
  var TIER_COLOR={ 'Tenderfoot':'#8a97b5','Rookie':'#94a3b8','Amateur':'#cbd5e1',
                   'Contender':'#22c55e','Challenger':'#4ade80','Veteran':'#38bdf8','Expert':'#22d3ee',
                   'Master':'#a855f7','Grandmaster':'#c084fc','Elite':'#fbbf24','Legend':'#fcd34d',
                   'Demi-god':'#f43f5e','God of Tetris':'#fde047' };
  function tierColor(t){ return TIER_COLOR[t]||'#8a97b5'; }
  // Must match the server: Rank 1 → 1 ★ · Rank 82 → 6 ★ · Rank 110 → 8 ★
  function poolStars(rank){ rank=parseInt(rank,10)||0; return rank<=0 ? 1 : (1+Math.floor(rank/15)); }
  function ringStyle(tier,w){
    var c=tierColor(tier), god=(tier==='God of Tetris');
    return 'border:'+(w||3)+'px solid '+c+';box-shadow:0 0 '+(god?22:14)+'px '+c+(god?'':'aa')+';';
  }
  var RANK_STEP=20, RANK_STEP_HI=200, RANK_HI_AT=2000;   // must match the server (20★/rank, 200★ for 101–110)
  function rankFromStars(stars){
    stars=Math.max(0,parseInt(stars,10)||0);
    var rank,inRank,need,god=false;
    if(stars<RANK_HI_AT){ rank=1+Math.floor(stars/RANK_STEP); inRank=stars%RANK_STEP; need=RANK_STEP; }
    else { var rem=stars-RANK_HI_AT; rank=101+Math.floor(rem/RANK_STEP_HI); inRank=rem%RANK_STEP_HI; need=RANK_STEP_HI;
      if(rank>=110){ rank=110; inRank=RANK_STEP_HI; god=true; } }   // reaching 110 IS God of Tetris — maxed
    return { stars:stars, rank:rank, in_rank:inRank, need:need, god:god,
             tier:tierName(rank,god), to_next: god?0:(need-inRank) };
  }
  // 5-star ranks get literal pips; the 50-star endgame ranks get a bar (50 pips would be absurd).
  function starMeter(r){
    if(r.god) return '<span class="star-god">★ 50/50 · MAXED</span>';
    if(r.need<=5){
      var s='';
      for(var i=0;i<r.need;i++) s+= (i<r.in_rank) ? '<i class="pip on">★</i>' : '<i class="pip">☆</i>';
      return '<span class="star-pips">'+s+'</span>';
    }
    var pct=Math.round(r.in_rank/r.need*100);
    return '<span class="star-bar"><i style="width:'+pct+'%"></i></span><span class="star-num">'+r.in_rank+'/'+r.need+'</span>';
  }

  function cosPreview(kind,id){
    if(kind==='bg')  return '<canvas class="cos-prev" width="210" height="44" data-bg="'+id+'"></canvas>';
    if(kind==='fx')  return '<canvas class="cos-prev" width="210" height="44" data-fx="'+id+'"></canvas>';
    if(kind==='sfx') return '<div class="cos-prev" style="display:flex;align-items:center;justify-content:center;background:#0a0f1c;">'+
      '<button class="cos-btn equip" onclick="tetPreviewSfx(\''+id+'\')">▶ Hear it</button></div>';
    if(kind==='frame'){ var ini=(typeof rkInitial==='function')?rkInitial((typeof ename==='function')?ename():''):'?';
      return '<div class="cos-prev" style="display:flex;align-items:center;justify-content:center;background:#0a0f1c;">'+
        '<span class="hp-av'+(id!=='none'?(' fr-'+id):'')+'" style="width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,107,26,.4);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#1a1a1a;background:linear-gradient(135deg,#2c3a5c,#1a2438);">'+ini+'</span></div>'; }
    return '';
  }
  // Paint the little preview tiles: real board renderers for bg, a mid-flight burst for fx.
  function paintCosPreviews(host){
    Array.prototype.forEach.call(host.querySelectorAll('canvas[data-bg]'), function(cv){
      var f=BOARD_BGS[cv.getAttribute('data-bg')]||BOARD_BGS.classic;
      try{ f(cv.getContext('2d'), cv.width, cv.height); }catch(e){}
    });
    Array.prototype.forEach.call(host.querySelectorAll('canvas[data-fx]'), function(cv){
      var ctx=cv.getContext('2d'); ctx.fillStyle='#080d18'; ctx.fillRect(0,0,cv.width,cv.height);
      var pack=FX_PACKS[cv.getAttribute('data-fx')]||FX_PACKS.spark, ps=[];
      try{ pack(function(p){ ps.push(p); }, {width:cv.width,height:cv.height}, 20, 1); }catch(e){ return; }
      for(var s=0;s<7;s++){ ps.forEach(function(p){          // run the sim forward so the burst is mid-air
        p.x+=p.vx; p.y+=p.vy; p.vy+=(p.g==null?0.45:p.g);
        if(p.sway) p.x+=Math.sin(p.life*p.sway)*0.7;
        if(p.vr) p.rot=(p.rot||0)+p.vr;
        p.life-=(p.decay==null?0.03:p.decay); }); }
      ctx.save();
      ps.forEach(function(p){
        if(p.life<=0) return;
        ctx.globalAlpha=Math.max(0,Math.min(1,p.life)); ctx.fillStyle=p.color;
        ctx.shadowBlur=p.glow||0; if(p.glow) ctx.shadowColor=p.color;
        if(p.shape==='circle'){ ctx.beginPath(); ctx.arc(p.x,p.y,p.sz/2,0,6.283); ctx.fill(); }
        else if(p.shape==='streak'){ ctx.fillRect(p.x,p.y,Math.max(1,p.sz*0.3),p.sz*2.2); }
        else if(p.vr){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot||0); ctx.fillRect(-p.sz/2,-p.sz*0.3,p.sz,p.sz*0.6); ctx.restore(); }
        else ctx.fillRect(p.x,p.y,p.sz,p.sz);
      });
      ctx.shadowBlur=0; ctx.restore();
    });
  }
  window.tetPreviewSfx=function(id){
    var back=COS.sfx; COS.sfx=id;
    try{ ac(); sfxClear(4); setTimeout(function(){ try{ sfxCombo(3); }catch(_){} }, 200); }catch(e){}
    setTimeout(function(){ COS.sfx=(_tetCos&&_tetCos.equipped&&_tetCos.equipped.sfx)||back; }, 640);
  };
  function cosCardsHTML(kind){
    var c=_tetCos, cat=COS_CAT[kind]||{};
    var coins=(c&&c.coins!=null)?c.coins:0, rating=(c&&c.rating)||0;
    var owned=(c&&c.owned&&c.owned[kind])||[COS_DEF[kind]];
    var eq=(c&&c.equipped&&c.equipped[kind])||COS[kind];
    return Object.keys(cat).map(function(id){
      var t=cat[id], own=owned.indexOf(id)>=0, on=(id===eq), btn, tag;
      var eqBtn='<button class="cos-btn equip" onclick="tetCosEquip(\''+kind+'\',\''+id+'\')">Equip</button>';
      var onBtn='<button class="cos-btn on">Equipped</button>';
      if(t.req){                                   // rating-earned — no price will ever unlock it
        tag='<span class="cos-cost req">★ '+t.req+'+</span>';
        btn = on?onBtn : own?eqBtn : '<button class="cos-btn locked" disabled>Rating '+rating+' / '+t.req+'</button>';
      } else if(t.champ){                          // reigning champion only
        tag='<span class="cos-cost req">👑 Champion</span>';
        btn = on?onBtn : own?eqBtn : '<button class="cos-btn locked" disabled>Win the crown</button>';
      } else {
        tag='<span class="cos-cost">'+(t.c?(Number(t.c).toLocaleString()+' coins'):'Free')+'</span>';
        btn = on?onBtn : own?eqBtn
            : (coins>=t.c ? '<button class="cos-btn unlock" onclick="tetCosUnlock(\''+kind+'\',\''+id+'\')">Unlock</button>'
                          : '<button class="cos-btn locked" disabled>Need '+Number(t.c-coins).toLocaleString()+'</button>');
      }
      return '<div class="cos-card'+(on?' equipped':'')+'">'+
        '<div class="cos-name">'+esc(t.n)+'</div><div class="cos-desc">'+esc(t.d)+'</div>'+
        cosPreview(kind,id)+'<div class="cos-row">'+tag+btn+'</div></div>';
    }).join('');
  }
  function titlesHTML(){
    var c=_tetCos, ts=(c&&c.titles)||[], eq=(c&&c.equipped&&c.equipped.title)||'rookie';
    if(!ts.length) return '<span style="font-size:11.5px;color:#6b7d90;">Loading titles…</span>';
    return ts.map(function(t){
      if(!t.earned) return '<span class="hp-title" style="opacity:.42;border-style:dashed;cursor:not-allowed;" title="'+esc(t.desc||'')+'">'+esc(t.name)+'</span>';
      var on=(t.id===eq);
      return '<span class="hp-title" style="cursor:pointer;'+(on?'outline:2px solid rgba(192,132,252,.85);':'')+'" title="'+esc(t.desc||'')+'" onclick="tetCosEquip(\'title\',\''+t.id+'\')">'+(on?'★ ':'')+esc(t.name)+'</span>';
    }).join('');
  }
  function renderCos(kind){
    var host=el('tet-cos-grid'); if(!host) return;
    var coins=(_tetCos&&_tetCos.coins!=null)?_tetCos.coins:0;
    _setTetCoins(coins);
    var hd=function(t){ return '<div style="grid-column:1/-1;font-size:10.5px;font-weight:800;color:#8a97b5;letter-spacing:.6px;text-transform:uppercase;">'+t+'</div>'; };
    if(kind==='flair'){
      host.innerHTML = hd('Avatar frames') + cosCardsHTML('frame') +
        hd('Titles — earned, never sold') +
        '<div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;">'+titlesHTML()+'</div>';
    } else {
      host.innerHTML = cosCardsHTML(kind);
    }
    paintCosPreviews(host);
  }
  window.tetCosTab=function(tab){
    _cosTab=tab;
    Array.prototype.forEach.call(document.querySelectorAll('#tet-cos-tabs .cos-tab'), function(b){
      b.classList.toggle('on', b.getAttribute('data-tab')===tab); });
    var th=el('tet-hub-themes'), cg=el('tet-cos-grid'); if(!th||!cg) return;
    if(tab==='blocks'){ th.style.display='grid'; cg.style.display='none'; loadWallet(); }
    else { th.style.display='none'; cg.style.display='grid'; renderCos(tab); }
  };
  window.tetCosEquip=function(kind,id){
    var o={}; o[kind]=id; applyCos(o);
    if(_tetCos&&_tetCos.equipped){ _tetCos.equipped[kind]=id; }
    renderCos(_cosTab); try{ sfxRot(); }catch(_){}
    if(kind==='bg'||kind==='fx'){ try{ if(M) draw(); }catch(_){} }
    if(kind==='frame'||kind==='title'){ try{ renderHubProfile(_hubMe); }catch(_){} }
    fetch(APPS_SCRIPT_URL+'?action=tetris_cos_equip&employee_id='+encodeURIComponent(eid())
      +'&kind='+encodeURIComponent(kind)+'&id='+encodeURIComponent(id)+'&_='+Date.now()).catch(function(){});
  };
  window.tetCosUnlock=function(kind,id){
    fetch(APPS_SCRIPT_URL+'?action=tetris_cos_unlock&employee_id='+encodeURIComponent(eid())
      +'&kind='+encodeURIComponent(kind)+'&id='+encodeURIComponent(id)+'&_='+Date.now())
      .then(function(r){ return r.json(); }).then(function(d){
        if(d&&d.ok&&d.cos){
          _tetCos=d.cos; applyCos(d.cos.equipped); renderCos(_cosTab);
          try{ sfxWin(); }catch(_){} try{ if(M) draw(); }catch(_){}
          try{ renderHubProfile(_hubMe); }catch(_){}
          loadWallet();   // coins are one shared pool — keep the Blocks tab honest
        }
        else if(d&&d.error==='NOT_ENOUGH'){ try{ showToast('Not enough coins — need '+d.need+', you have '+d.have+'.'); }catch(_){} }
        else { try{ showToast('Could not unlock — try again.'); }catch(_){} }
      }).catch(function(){ try{ showToast('Could not unlock — try again.'); }catch(_){} });
  };
  function loadCosmetics(){
    fetch(APPS_SCRIPT_URL+'?action=tetris_cosmetics&employee_id='+encodeURIComponent(eid())+'&_='+Date.now())
      .then(function(r){ return r.json(); }).then(function(c){
        if(c&&c.ok){ _tetCos=c; applyCos(c.equipped);
          if(_cosTab!=='blocks') renderCos(_cosTab);
          try{ renderHubProfile(_hubMe); }catch(_){}
        }
      }).catch(function(){});
  }
  // Rank-up celebration — fires once, the first time we see a higher rank than last known.
  function checkRankUp(R){
    var prev=null; try{ prev=parseInt(localStorage.getItem('tetStarRank'),10); }catch(e){}
    try{ localStorage.setItem('tetStarRank', String(R.rank)); }catch(e){}
    if(prev==null || isNaN(prev) || R.rank<=prev) return;   // first run, or no promotion → nothing to celebrate
    var t=el('rankup-toast');
    if(!t){ t=document.createElement('div'); t.id='rankup-toast'; document.body.appendChild(t); }
    t.innerHTML='<div class="ru-k">Rank up</div><div class="ru-r">RANK '+R.rank+'</div>'+
                '<div class="ru-t">'+esc(R.tier)+(R.god?' 👑':'')+'</div>';
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    try{ sfxWin(); }catch(_){}
    try{ tetConfetti({count:(R.god?320:180), dur:(R.god?4200:2800)}); }catch(_){}
    try{ mfSnakeCeremony(R); }catch(_){}
  }
  // 👑 Reigning champion showcase on the hub.
  function loadChampShowcase(){
    var host=el('tet-champ-show'); if(!host) return;
    fetch(APPS_SCRIPT_URL+'?action=tetris_champion&_='+Date.now())
      .then(function(r){ return r.json(); }).then(function(d){
        var ch=d&&d.champion; if(!ch||!ch.employee_id){ host.innerHTML=''; return; }
        var mine=(String(ch.employee_id).toLowerCase()===String(eid()).toLowerCase());
        var when=String(ch.won_at||'').split(' ')[0]||'';
        var nm=esc(ch.full_name||ch.employee_id);
        var ph=(typeof rkPhoto==='function')?rkPhoto(ch.employee_id):'';
        var av=ph
          ? '<img src="'+ph+'" alt="" style="width:92px;height:92px;border-radius:50%;object-fit:cover;border:3px solid #ffd54a;box-shadow:0 0 22px rgba(251,191,36,.8);display:block;" onerror="this.style.display=\'none\';">'
          : '<div style="width:92px;height:92px;border-radius:50%;background:#3a2a06;border:3px solid #ffd54a;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:32px;color:#ffd54a;">'+((typeof rkInitial==='function')?rkInitial(ch.full_name||''):'?')+'</div>';
        host.innerHTML=
          '<div style="position:relative;overflow:hidden;border-radius:18px;margin:2px 0 8px;background:linear-gradient(160deg,#4a3608 0%,#2a1e06 46%,#100b04 100%);border:1px solid rgba(251,191,36,.5);box-shadow:0 18px 46px -20px rgba(251,191,36,.7);text-align:center;padding:20px 18px 18px;">'+
            '<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 0%,rgba(251,191,36,.24),transparent 62%);pointer-events:none;"></div>'+
            '<div style="position:relative;z-index:1;">'+
              '<div style="font-size:10.5px;font-weight:800;letter-spacing:1.6px;color:#ffd54a;text-transform:uppercase;margin-bottom:14px;">🏆 Reigning Grand Final Champion</div>'+
              '<div style="position:relative;display:inline-block;margin-bottom:11px;">'+av+'<div style="position:absolute;top:-19px;left:50%;transform:translateX(-50%);font-size:30px;filter:drop-shadow(0 0 10px rgba(251,191,36,.95));">👑</div></div>'+
              '<div style="font-size:21px;font-weight:900;color:#fff;line-height:1.12;text-shadow:0 2px 12px rgba(0,0,0,.45);">'+nm+(mine?' <span style="color:#ffd54a;font-size:13px;">(you)</span>':'')+'</div>'+
              '<div style="font-size:11.5px;color:#e0cf9f;margin-top:7px;line-height:1.45;">Won the grand final'+(when?(' · '+when):'')+'<br>wears the crown until next Sunday</div>'+
              '<div style="display:inline-block;margin-top:14px;font-size:12px;font-weight:900;letter-spacing:.5px;color:#3a2a06;background:linear-gradient(90deg,#ffe27a,#ffb020);padding:8px 22px;border-radius:22px;box-shadow:0 8px 20px -8px rgba(251,191,36,.85);">CHAMPION</div>'+
            '</div>'+
          '</div>';
      }).catch(function(){ host.innerHTML=''; });
  }

  var _tetRivals={};
  function loadRivalries(){
    var host=el('tet-rivals'); if(!host) return;
    var id=(typeof eid==='function')?eid():''; if(!id){ host.innerHTML=''; return; }
    fetch(APPS_SCRIPT_URL+'?action=tetris_rivalries&employee_id='+encodeURIComponent(id)+'&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      if(!d||!d.ok){ host.innerHTML=''; return; }
      var rivals=d.rivalries||[]; _tetRivals={}; rivals.forEach(function(r){ _tetRivals[String(r.name).toLowerCase()]={w:r.w,l:r.l}; });
      if(!rivals.length){ host.innerHTML='<div style="text-align:center;color:#6f9678;font-size:12px;padding:10px;">No duels yet — challenge someone to start a rivalry! ⚔</div>'; return; }
      var top=rivals.slice(0,5);
      host.innerHTML=top.map(function(r){ var lead=(r.w>r.l)?'#7bf5a8':((r.w<r.l)?'#f87171':'#a5d6ae'); var word=(r.w>r.l)?'You lead':((r.w<r.l)?'You trail':'Even');
        return '<div style="display:flex;align-items:center;gap:9px;padding:6px 10px;margin-bottom:5px;border-radius:10px;background:linear-gradient(150deg,rgba(11,37,20,.72),rgba(5,17,9,.86));border:1px solid rgba(134,239,172,.30);">'+
          '<span style="flex:1;min-width:0;font-size:12.5px;font-weight:700;color:#effcef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.name)+'</span>'+
          '<span style="font-size:10.5px;color:'+lead+';font-weight:800;">'+word+'</span>'+
          '<span style="font-size:13px;font-weight:900;color:#c7f0cf;white-space:nowrap;">'+r.w+'–'+r.l+'</span></div>'; }).join('');
    }).catch(function(){ host.innerHTML=''; });
  }
  function _seasonMonthLabel(mk){ try{ var p=String(mk||'').split('-'); var mo=['','January','February','March','April','May','June','July','August','September','October','November','December'][+p[1]]||''; return mo+' '+p[0]; }catch(e){ return mk||''; } }
  function loadSeason(){
    var host=el('tet-season'); if(!host) return;
    fetch(APPS_SCRIPT_URL+'?action=tetris_season&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      if(!d||!d.ok){ host.innerHTML=''; return; }
      var me=(typeof eid==='function')?String(eid()).toLowerCase():'';
      var rows=d.standings||[];
      var champHtml='';
      if(d.champion && d.champion.employee_id){
        var cph=rkPhoto(d.champion.employee_id);
        var cav=cph?('<img src="'+cph+'" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #fde68a;">'):('<span style="width:42px;height:42px;border-radius:50%;background:#0f3a20;display:flex;align-items:center;justify-content:center;font-weight:900;color:#86efac;">'+rkInitial(d.champion.name)+'</span>');
        champHtml='<div style="display:flex;align-items:center;gap:12px;border:1px solid rgba(134,239,172,.5);background:linear-gradient(120deg,rgba(134,239,172,.18),rgba(8,38,20,.6));border-radius:14px;padding:10px 13px;margin-bottom:10px;box-shadow:0 12px 30px -16px rgba(74,200,110,.6);">'+cav+'<div style="flex:1;min-width:0;"><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#a5d6ae;">👑 Reigning Season Champion</div><div style="font-weight:800;color:#effcef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(d.champion.name)+'</div><div style="font-size:10.5px;color:#93c29f;">'+_seasonMonthLabel(d.champion.month)+' · '+(Number(d.champion.points)||0).toLocaleString()+' pts</div></div><div style="font-size:26px;">🏆</div></div>';
      }
      var top=rows.slice(0,5);
      var listHtml=top.map(function(p){ var mine=String(p.employee_id||'').toLowerCase()===me;
        var medal=p.rank<=3?['🥇','🥈','🥉'][p.rank-1]:(p.rank+'.');
        var ph=rkPhoto(p.employee_id); var av=ph?('<img src="'+ph+'" style="width:26px;height:26px;border-radius:7px;object-fit:cover;">'):('<span style="width:26px;height:26px;border-radius:7px;background:#0f3a20;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:#86efac;">'+rkInitial(p.name)+'</span>');
        return '<div style="display:flex;align-items:center;gap:9px;padding:6px 9px;margin-bottom:5px;border-radius:10px;background:'+(mine?'linear-gradient(150deg,rgba(74,222,128,.26),rgba(10,36,20,.88))':'linear-gradient(150deg,rgba(11,37,20,.72),rgba(5,17,9,.86))')+';border:1px solid '+(mine?'rgba(212,250,205,.8)':'rgba(134,239,172,.30)')+';">'+
          '<span style="width:24px;text-align:center;font-weight:900;color:#a5d6ae;">'+medal+'</span>'+av+
          '<span style="flex:1;min-width:0;font-size:12.5px;font-weight:700;color:#effcef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(p.name)+(mine?' <span style="color:#86efac;font-size:10px;">(you)</span>':'')+'</span>'+
          '<span style="font-size:11.5px;color:#c7f0cf;font-weight:800;white-space:nowrap;">'+(Number(p.points)||0).toLocaleString()+' pts</span></div>'; }).join('');
      var myRow=null; for(var i=0;i<rows.length;i++){ if(String(rows[i].employee_id||'').toLowerCase()===me){ myRow=rows[i]; break; } }
      var myHtml=(myRow && myRow.rank>5)?('<div style="text-align:center;font-size:11.5px;color:#93c29f;margin-top:5px;">Your season rank: <b style="color:#c7f0cf;">#'+myRow.rank+'</b> · '+(Number(myRow.points)||0).toLocaleString()+' pts</div>'):'';
      host.innerHTML='<div style="font-size:11px;color:#93c29f;margin:-2px 0 8px;">'+_seasonMonthLabel(d.month)+' · lines + 30 per win · resets monthly</div>'+champHtml+(listHtml||'<div style="text-align:center;color:#6f9678;font-size:12px;padding:10px;">No games this season yet — play to climb! 🎮</div>')+myHtml;
    }).catch(function(){ host.innerHTML=''; });
  }
  /* ══════════════ SEASON TRANSITION FILM — Absolute Zero → Mossy Forest ══════════════
     25 seconds, eight beats, scored. Plays once per season the first time a player opens the
     Tetris dashboard; the seen-flag is keyed to the season id so next season it plays again with
     no code change. window.azReplayIntro() forces a rewatch.

     Two accolades are shown SEPARATELY and deliberately:
       HIGHEST RANK · ALL TIME — the star ladder's #1 across every season
       SEASON CHAMPION         — the points winner of the month that just closed
     Merging them would put the wrong name under the wrong title in front of the whole team.

     Premium pass: 2.39:1 letterbox, film grain, chromatic split on the impact, volumetric rays,
     a depth-sorted tetromino tunnel, per-letter kinetic titles, propagating ice cracks and a
     camera that shakes on the actual scheduled drum hits — picture and sound can't drift.       */
  var AZ_SEASON_ID='S2026-09';
  /* LAUNCH WINDOW — the film plays on EVERY dashboard open until Friday closes, no throttle,
     so nobody on a night shift or a day off misses the season changeover. After the window it
     reverts to once-per-season automatically. AZ_INTRO_UNTIL is a PHT wall-clock cutoff.
     Skip is always available, so anyone in a hurry is one click away from the dashboard. */
  /* LAUNCH WINDOW CLOSED. It ran on every dashboard open so nobody missed the changeover; that
     job is done and a film on every open becomes a toll. Set to a past date, which puts the
     film back to once per season for anyone who has never seen it — and Replay is still there
     for anyone who wants it. To run a window again, set this to a future PHT cutoff. */
  var AZ_INTRO_UNTIL='2026-09-11T23:59:59+08:00';   // Mossy Forest launch week — film plays on every open until this closes
  function azInLaunchWindow(){ try{ return Date.now() < new Date(AZ_INTRO_UNTIL).getTime(); }catch(e){ return false; } }
  function azIntroSeen(){
    try{
      if(azInLaunchWindow()) return false;            // launch week → play on every open
      return localStorage.getItem('az_intro_'+AZ_SEASON_ID)==='1';
    }catch(e){ return true; }
  }
  function azIntroMark(){ try{ localStorage.setItem('az_intro_'+AZ_SEASON_ID,'1'); }catch(e){} }
  window.azReplayIntro=function(){ try{ localStorage.removeItem('az_intro_'+AZ_SEASON_ID); }catch(e){} azPlayIntro(); };

  function azPlayIntro(){
    if(document.getElementById('az-intro')) return;
    var TOP={name:'Jethro Bringas',rank:110,tier:'God of Tetris',stars:3346,best:190127,img:null};
    var CHP={name:'Palena, John Matthew',points:24921,wins:255,lines:17271,img:null};
    var POD=[];
    /* Employee photos are stored as Drive /view SHARE links, which a canvas cannot draw.
       Convert to the thumbnail endpoint and preload. Cross-origin is fine here — we only ever
       draw the image, never read pixels back, so a tainted canvas costs us nothing. */
    var PHOTO={};
    function drivePic(u){ u=String(u||''); if(!u) return '';
      var m=u.match(/[-\w]{25,}/); return m ? ('https://drive.google.com/thumbnail?id='+m[0]+'&sz=w400') : u; }
    function loadPic(url){ if(!url) return null; var im=new Image();
      try{ im.crossOrigin='anonymous'; }catch(e){} im.referrerPolicy='no-referrer'; im.src=url; return im; }
    try{
      fetch(APPS_SCRIPT_URL+'?action=get_all_employees&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
        ((d&&d.employees)||[]).forEach(function(e){
          var u=drivePic(e.photo||e.hero_photo); if(!u) return;
          PHOTO[String(e.employee_id||'').toLowerCase()]=u;
          PHOTO['n:'+String(e.full_name||'').toLowerCase()]=u; });
        if(!TOP.img) TOP.img=loadPic(PHOTO['n:'+String(TOP.name).toLowerCase()]);
        if(!CHP.img) CHP.img=loadPic(PHOTO['n:'+String(CHP.name).toLowerCase()]);
        POD.forEach(function(r){ if(!r.img) r.img=loadPic(PHOTO['n:'+String(r.n).toLowerCase()]); });
      }).catch(function(){});
    }catch(e){}
    try{
      fetch(APPS_SCRIPT_URL+'?action=tetris_ranking&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
        var rows=(d&&d.ranking)||[]; if(!rows.length) return;
        rows.sort(function(x,y){ return (y.star_rank-x.star_rank)||(y.stars-x.stars); });
        var t=rows[0]; TOP={name:t.name,rank:t.star_rank,tier:t.tier||'',stars:t.stars,best:t.best,
        img:loadPic(PHOTO[String(t.employee_id||'').toLowerCase()]||PHOTO['n:'+String(t.name||'').toLowerCase()])};
      }).catch(function(){});
      fetch(APPS_SCRIPT_URL+'?action=tetris_season&month=2026-08&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
        var st=(d&&d.standings)||[]; if(!st.length) return;
        CHP={name:st[0].name,points:st[0].points,wins:st[0].wins,lines:st[0].lines,
          img:loadPic(PHOTO[String(st[0].employee_id||'').toLowerCase()]||PHOTO['n:'+String(st[0].name||'').toLowerCase()])};
        POD=st.slice(0,3).map(function(r){ return {n:r.name,p:r.points,
          img:loadPic(PHOTO[String(r.employee_id||'').toLowerCase()]||PHOTO['n:'+String(r.name||'').toLowerCase()])}; });
      }).catch(function(){});
    }catch(e){}

    var ov=document.createElement('div'); ov.id='az-intro';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;';
    ov.innerHTML='<canvas id="az-cv" style="width:100%;height:100%;display:block;"></canvas>'+
      '<button id="az-skip" style="position:absolute;bottom:30px;right:32px;background:rgba(255,255,255,.08);color:#e5fbe8;'+
      'border:1px solid rgba(134,239,172,.38);border-radius:10px;padding:10px 22px;font:700 13px Inter,system-ui,sans-serif;'+
      'cursor:pointer;letter-spacing:.06em;backdrop-filter:blur(6px);">SKIP →</button>';
    document.body.appendChild(ov);

    var cv=document.getElementById('az-cv'), C=cv.getContext('2d');
    var DPR=Math.min(2,window.devicePixelRatio||1), W=1,H=1;
    var DUR=25000, t0=null, raf=null, done=false, HITS=[], SHK=0, FLASH=0, AC=null;

    /* ══ THE FOREST AWAKENS — an original 25s cinematic ══
       ① a lone firefly lights the dark · ② the swarm reveals the ICE WALL of Absolute Zero
       · ③ THE THAW: green cracks, vines burst through, the wall shatters · ④ all-time #1
       crowned in living laurel vines · ⑤ season champion + podium · ⑥ THE SERPENT crosses
       the frame while every ladder resets · ⑦ the canopy closes: MOSSY FOREST. */

    // scene state (all deterministic; sized on resize)
    var FFs=[], SHARDS=[], VINES=[], WALLB=[];
    var _sd=1337; function SR(){ _sd=(_sd*1103515245+12345)>>>0; return (_sd>>>16)/65535; }
    function size(){ W=cv.clientWidth; H=cv.clientHeight; cv.width=W*DPR; cv.height=H*DPR; seed(); }
    function seed(){
      _sd=1337; FFs=[]; SHARDS=[]; VINES=[]; WALLB=[];
      for(var i=0;i<46;i++) FFs.push({ a:SR()*6.283, r:0.12+SR()*0.5, sp:0.3+SR()*0.7, ph:SR()*6.283, s:1+SR()*2 });
      for(var j=0;j<46;j++) SHARDS.push({ x:0.18+SR()*0.64, y:0.12+SR()*0.6, s:8+SR()*26, vx:(SR()-0.5)*3, vy:-1-SR()*2, va:(SR()-0.5)*0.3, a:SR()*6.283 });
      for(var v=0;v<7;v++) VINES.push({ x:0.24+v*0.087+(SR()-0.5)*0.05, sway:(SR()-0.5)*0.5, d:SR()*0.4, leaves:3+Math.floor(SR()*3) });
      for(var wb=0;wb<12;wb++) WALLB.push({ x:0.26+SR()*0.48, y:0.16+SR()*0.5, s:0.03+SR()*0.05, t:Math.floor(SR()*7) });
    }
    function grain(){ if(grain.cv) return grain.cv; var g=document.createElement('canvas'); g.width=g.height=150;
      var gc=g.getContext('2d'), id=gc.createImageData(150,150);
      for(var i=0;i<id.data.length;i+=4){ var v=Math.floor(Math.random()*255); id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=14; }
      gc.putImageData(id,0,0); grain.cv=g; return g; }

    /* ── the score: heartbeat → thaw impact → kalimba forest → serpent drums → reveal swell ── */
    function introScore(){
      try{
        var a=(typeof ac==='function')?ac():null; if(!a) return null;
        try{ if(a.state!=='running') a.resume(); }catch(e){}
        var out=a.createGain(); out.gain.value=.8;
        var cmp=a.createDynamicsCompressor(); try{ cmp.threshold.value=-13; cmp.ratio.value=4; }catch(e){}
        out.connect(cmp); cmp.connect(a.destination);
        var T0=a.currentTime+.1;
        function E(g,t,pk,at,dr){ g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(pk,t+at); g.gain.exponentialRampToValueAtTime(.0001,t+dr); }
        function boom(t,pk){ var o=a.createOscillator(),g=a.createGain(); o.type='sine';
          o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(34,t+.5);
          E(g,t,pk||.9,.004,.9); o.connect(g); g.connect(out); o.start(t); o.stop(t+1); HITS.push(t); }
        function heart(t){ boom(t,.34); boom(t+.28,.22); }
        function pad(t,root,dur,pk){ [1,1.4983,2,2.9966].forEach(function(m,i){ var o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
          o.type='sawtooth'; o.frequency.value=root*m; lp.type='lowpass'; lp.frequency.value=800+i*160;
          g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime((pk||.05)/(1+i*.5),t+dur*.4); g.gain.setTargetAtTime(.0001,t+dur*.85,.5);
          o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t+dur+1.2); }); }
        function pluck(t,f,pk){ [[1,1],[3.9,.28],[7.1,.1]].forEach(function(m){ var o=a.createOscillator(),g=a.createGain();
          o.type='sine'; o.frequency.value=f*m[0]; E(g,t,(pk||.16)*m[1],.004,1); o.connect(g); g.connect(out); o.start(t); o.stop(t+1.1); }); }
        function shatter(t){ for(var i=0;i<10;i++){ var o=a.createOscillator(),hp=a.createBiquadFilter(),g=a.createGain();
          o.type='square'; o.frequency.value=2400+i*700; hp.type='highpass'; hp.frequency.value=2600;
          E(g,t+i*.012,.05,.002,1.1); o.connect(hp); hp.connect(g); g.connect(out); o.start(t); o.stop(t+1.3); } }
        function hiss(t){ var len=a.sampleRate*.7, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0);
          for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.2);
          var src=a.createBufferSource(); src.buffer=buf;
          var bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=5200; bp.Q.value=.8;
          var g=a.createGain(); g.gain.value=.12; src.connect(bp); bp.connect(g); g.connect(out); src.start(t); }
        function tom(t,f){ var o=a.createOscillator(),g=a.createGain(); o.type='sine';
          o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*.55,t+.16);
          E(g,t,.5,.003,.24); o.connect(g); g.connect(out); o.start(t); o.stop(t+.3); }
        function chime(t,f){ var o=a.createOscillator(),g=a.createGain(); o.type='triangle'; o.frequency.value=f;
          E(g,t,.08,.01,2.2); o.connect(g); g.connect(out); o.start(t); o.stop(t+2.4); }
        // ① lone firefly + heartbeat
        heart(T0+0.6); heart(T0+2.0); pad(T0+0.2,55,6.4,.045);
        // ② the swarm — pulse quickens
        heart(T0+3.3); heart(T0+4.4); heart(T0+5.3); heart(T0+6.1); pad(T0+3.4,65.4,3.4,.06);
        // riser — tension climbs into the thaw
        (function(t){ var len=a.sampleRate*1.6, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0);
          for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*(i/len);
          var src=a.createBufferSource(); src.buffer=buf;
          var bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.2;
          bp.frequency.setValueAtTime(300,t); bp.frequency.exponentialRampToValueAtTime(3800,t+1.55);
          var g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.22,t+1.5); g.gain.setValueAtTime(.0001,t+1.6);
          src.connect(bp); bp.connect(g); g.connect(out); src.start(t); })(T0+5.35);
        // ③ THE THAW — the DOUBLE hit
        boom(T0+6.9,1); boom(T0+7.08,.6); shatter(T0+6.9); FLASH=0;
        pad(T0+7.0,98,3.4,.1);
        // ④⑤ kalimba over warm pads
        var PENT=[440,523.25,587.33,659.25,783.99,880];
        for(var k=0;k<18;k++){ var kt=T0+7.4+k*.52; pluck(kt, PENT[(k*3+1)%6]*((k%5===4)?2:1), .13); }
        pad(T0+10.4,87.3,3.6,.07); pad(T0+14.2,65.4,3.4,.07);
        // ⑥ the serpent — toms + hiss
        hiss(T0+17.7); tom(T0+17.8,150); tom(T0+18.2,130); tom(T0+18.6,110); tom(T0+19.0,95);
        boom(T0+19.4,.7);
        // ⑦ the reveal — sub-drop, swell + chimes, distant thunder under 'Good luck.'
        boom(T0+20.65,1); boom(T0+20.85,.5);
        pad(T0+20.6,110,4.6,.12); pad(T0+20.6,55,4.6,.09);
        (function(t){ var len=a.sampleRate*1.8, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0);
          for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.5);
          var src=a.createBufferSource(); src.buffer=buf;
          var lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=110;
          var g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.14,t+.3); g.gain.exponentialRampToValueAtTime(.0001,t+1.8);
          src.connect(lp); lp.connect(g); g.connect(out); src.start(t); })(T0+23.4);
        chime(T0+21.0,880); chime(T0+21.5,1108.7); chime(T0+22.1,1318.5);
        for(var k2=0;k2<6;k2++) pluck(T0+21.2+k2*.42, PENT[(k2*2+2)%6]*2, .1);
        return {a:a,out:out};
      }catch(e){ return null; }
    }

    function fin(){ if(done) return; done=true; azIntroMark();
      try{ if(AC) AC.out.gain.setTargetAtTime(.0001,AC.a.currentTime,.3); }catch(e){}
      if(raf) cancelAnimationFrame(raf);
      ov.style.transition='opacity .6s'; ov.style.opacity='0';
      setTimeout(function(){ try{ ov.remove(); }catch(e){} try{ startAzeroAmbience(); }catch(e){} },620);
    }
    document.getElementById('az-skip').addEventListener('click',fin);

    function E3(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
    function EO(x){return 1-Math.pow(1-x,3);}
    function seg(ms,a2,b2,fi,fo){ if(ms<a2||ms>b2) return 0; var u=(ms-a2)/(b2-a2);
      var fin2=Math.min(1,u/(fi||.15)), fout=Math.min(1,(1-u)/(fo||.15)); return Math.min(fin2,fout); }
    function mix(p,q,t){ function h(c){return[parseInt(c.substr(1,2),16),parseInt(c.substr(3,2),16),parseInt(c.substr(5,2),16)];}
      var X=h(p),Y=h(q); return 'rgb('+Math.round(X[0]+(Y[0]-X[0])*t)+','+Math.round(X[1]+(Y[1]-X[1])*t)+','+Math.round(X[2]+(Y[2]-X[2])*t)+')'; }
    function TX(str,x,y,sz,col,we,al,tr,glow){ if(al<=0) return; C.save(); C.globalAlpha=al; C.fillStyle=col;
      C.font=(we||800)+' '+sz+'px Sora,Inter,system-ui,sans-serif'; C.textAlign='center'; C.textBaseline='middle';
      if(tr) C.translate(0,tr*(1-al));
      if(glow){ C.shadowColor=col; C.shadowBlur=glow; }
      C.fillText(String(str),x,y); C.restore(); }
    function LTR(str,x,y,sz,col,al,prog,gap,glow,gcol){ if(al<=0) return; str=String(str);
      C.save(); C.font='900 '+sz+'px Sora,Inter,system-ui,sans-serif'; C.textBaseline='middle';
      var ws=str.split('').map(function(ch){ return C.measureText(ch).width+(gap||4); });
      var tot=ws.reduce(function(a2,b2){return a2+b2;},0), sx=x-tot/2;
      for(var i=0;i<str.length;i++){ var la=Math.max(0,Math.min(1,(prog*str.length)-i));
        if(la>0){ C.globalAlpha=al*la; C.fillStyle=col;
          if(glow){ C.shadowColor=gcol||col; C.shadowBlur=glow*la; }
          C.save(); C.translate(sx+ws[i]/2,y+(1-la)*18); C.scale(0.6+0.4*la,0.6+0.4*la);
          C.fillText(str[i],0,0); C.restore(); }
        sx+=ws[i]; }
      C.restore(); }
    function RULE(x,y,w2,al,col){ if(al<=0) return; C.save(); C.globalAlpha=al;
      var g=C.createLinearGradient(x-w2/2,0,x+w2/2,0);
      g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.5,col); g.addColorStop(1,'rgba(0,0,0,0)');
      C.fillStyle=g; C.fillRect(x-w2/2,y,w2,2); C.restore(); }
    function PORTRAIT(img,name,x,y,r,al,ring){ if(al<=0||r<=0) return; C.save(); C.globalAlpha=al;
      C.beginPath(); C.arc(x,y,r,0,6.283); C.strokeStyle=ring; C.lineWidth=3; C.stroke();
      C.save(); C.beginPath(); C.arc(x,y,r-3,0,6.283); C.clip();
      if(img&&img.complete&&img.naturalWidth){ var s2=(r*2-6)/Math.min(img.naturalWidth,img.naturalHeight);
        C.drawImage(img,x-img.naturalWidth*s2/2,y-img.naturalHeight*s2/2,img.naturalWidth*s2,img.naturalHeight*s2); }
      else { C.fillStyle='#123a20'; C.fillRect(x-r,y-r,r*2,r*2); C.fillStyle='#86efac';
        C.font='900 '+(r*.9)+'px Sora,Inter,sans-serif'; C.textAlign='center'; C.textBaseline='middle';
        C.fillText((String(name||'?').trim().charAt(0)||'?').toUpperCase(),x,y+r*.05); }
      C.restore(); C.restore(); }
    function firefly(x,y,s2,al){ if(al<=0) return; C.save(); C.globalCompositeOperation='lighter'; C.globalAlpha=al;
      var g=C.createRadialGradient(x,y,0,x,y,s2*5);
      g.addColorStop(0,'rgba(254,252,232,.95)'); g.addColorStop(.35,'rgba(253,230,138,.55)'); g.addColorStop(1,'rgba(190,242,100,0)');
      C.fillStyle=g; C.fillRect(x-s2*5,y-s2*5,s2*10,s2*10);
      C.fillStyle='#fefce8'; C.beginPath(); C.arc(x,y,s2*.8,0,6.283); C.fill(); C.restore(); }
    function vineGrow(vx,g2,sway){ // one vine drawn bottom→up to growth g2 (0..1), with leaves
      if(g2<=0) return; var x=vx*W, topY=H-(H*.9)*g2;
      C.save(); C.strokeStyle='#3f8a4b'; C.lineWidth=Math.max(2,W*.004); C.lineCap='round';
      C.beginPath(); C.moveTo(x,H+4);
      var segs=14;
      for(var i2=1;i2<=segs*g2;i2++){ var yy=H-(H*.9)*(i2/segs), xx=x+Math.sin(i2*.9+sway*6)*W*.018*(i2/segs+0.3);
        C.lineTo(xx,yy); }
      C.stroke();
      C.fillStyle='#4ade80';
      for(var lv=1;lv<=6;lv++){ var lp=lv/7; if(lp>g2) break;
        var ly=H-(H*.9)*lp, lx=x+Math.sin(lv*7*.9/segs*segs*.13+sway*6)*W*.014;
        C.save(); C.translate(lx,ly); C.rotate((lv%2?0.7:-0.7)+sway*.3);
        C.beginPath(); C.ellipse(W*.012,0,W*.012,W*.005,0,0,6.283); C.fill(); C.restore(); }
      C.restore(); }
    function serpent(prog){ // the great snake crossing the frame, left→right
      if(prog<=0||prog>=1) return;
      var headX=-W*.3+prog*(W*1.6), baseY=H*.56;
      C.save();
      for(var i2=42;i2>=0;i2--){ // tail→head so the head paints on top
        var d=i2*W*.022, x=headX-d, y=baseY+Math.sin((headX-d)*.012+prog*9)*H*.11;
        var wR=Math.max(3,(W*.031)*(1-i2/50));
        C.fillStyle=(i2%6<2)?'#3e4a28':'#5d6b3c';
        C.beginPath(); C.arc(x,y,wR,0,6.283); C.fill();
        if(i2%6===3){ C.fillStyle='#26301a'; C.beginPath(); C.ellipse(x,y-wR*.3,wR*.7,wR*.45,.3,0,6.283); C.fill(); }
        C.fillStyle='rgba(214,232,178,.25)'; C.beginPath(); C.arc(x,y-wR*.45,wR*.4,0,6.283); C.fill();
      }
      var hy=baseY+Math.sin(headX*.012+prog*9)*H*.11;
      C.fillStyle='#5d6b3c'; C.beginPath(); C.ellipse(headX+W*.012,hy,W*.042,W*.026,0,0,6.283); C.fill();
      C.fillStyle='#e8c93a'; C.beginPath(); C.ellipse(headX+W*.02,hy-W*.006,W*.005,W*.004,0,0,6.283); C.fill();
      C.fillStyle='#10130a'; C.beginPath(); C.ellipse(headX+W*.02,hy-W*.006,W*.0015,W*.0035,0,0,6.283); C.fill();
      C.strokeStyle='#c93a3a'; C.lineWidth=Math.max(1,W*.0018); C.lineCap='round';
      var tf=Math.sin(prog*40)>0.4?1:0;
      if(tf){ C.beginPath(); C.moveTo(headX+W*.043,hy); C.lineTo(headX+W*.058,hy-W*.006);
        C.moveTo(headX+W*.043,hy); C.lineTo(headX+W*.058,hy+W*.004); C.stroke(); }
      C.restore(); }
    function clumpF(x,y,r){ // canopy clump for the closing frame
      C.fillStyle='#0a2413'; C.beginPath(); C.ellipse(x+r*.14,y+r*.18,r,r*.82,0,0,6.283); C.fill();
      C.fillStyle='#175031'; C.beginPath(); C.ellipse(x,y,r*.85,r*.68,0,0,6.283); C.fill();
      C.fillStyle='#3f8a4b'; C.beginPath(); C.ellipse(x-r*.26,y-r*.26,r*.44,r*.34,0,0,6.283); C.fill(); }
    function tetSil(x,y,s2,t2,al,col){ // frozen tetromino silhouette in the ice wall
      var SH=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],
              [[0,0],[1,0],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]][t2%7];
      C.save(); C.globalAlpha=al; C.fillStyle=col;
      SH.forEach(function(cxy){ C.fillRect(x+cxy[0]*s2, y+cxy[1]*s2, s2*.92, s2*.92); });
      C.restore(); }

    function draw(ms){
      var t=ms/1000;
      var CX=W/2, CY=H/2;
      SHK*=.86;
      if(AC){ var nw=AC.a.currentTime;
        for(var hi=HITS.length-1;hi>=0;hi--){ var dt=nw-HITS[hi];
          if(dt>=0&&dt<.045){ SHK=Math.min(10,SHK+6); HITS.splice(hi,1); }
          else if(dt>.4) HITS.splice(hi,1); } }
      C.setTransform(DPR,0,0,DPR,0,0); C.clearRect(0,0,W,H);
      C.save();
      // cinematic push-in: the camera creeps forward the whole film, punches on hits
      var push=1+0.05*E3(ms/DUR)+SHK*.0022;
      C.translate(CX+(Math.random()-.5)*SHK,CY+(Math.random()-.5)*SHK);
      C.scale(push,push); C.translate(-CX,-CY);

      var thaw=Math.max(0,Math.min(1,(ms-6800)/1400));       // ice → forest master dial
      var Tw=E3(thaw);

      // backdrop: cold void → deep forest
      var g=C.createRadialGradient(CX,H*1.02,10,CX,H*1.02,H*1.4);
      g.addColorStop(0,mix('#07131f','#0e3d22',Tw)); g.addColorStop(.5,mix('#040b12','#082614',Tw)); g.addColorStop(1,'#010402');
      C.fillStyle=g; C.fillRect(0,0,W,H);

      // ② THE ICE WALL (materialises 3s→6.8s, shatters at thaw)
      var wall=seg(ms,3000,8400,.35,.01)*(1-Math.max(0,Math.min(1,(ms-6900)/500)));
      if(wall>0){
        C.save(); C.globalAlpha=wall*.9;
        var wg=C.createLinearGradient(0,H*.1,0,H*.78);
        wg.addColorStop(0,'rgba(147,197,253,.14)'); wg.addColorStop(.5,'rgba(125,211,252,.30)'); wg.addColorStop(1,'rgba(56,120,190,.16)');
        C.fillStyle=wg; C.fillRect(W*.22,H*.08,W*.56,H*.7);
        C.strokeStyle='rgba(224,242,254,.5)'; C.lineWidth=2; C.strokeRect(W*.22,H*.08,W*.56,H*.7);
        WALLB.forEach(function(wb2){ tetSil(W*wb2.x,H*wb2.y,W*wb2.s*.32,wb2.t,wall*.5,'rgba(186,230,253,.5)'); });
        // green THAW CRACKS climb the wall just before it breaks
        var crk=Math.max(0,Math.min(1,(ms-5800)/1100));
        if(crk>0){ C.strokeStyle='rgba(74,222,128,'+(0.85*crk)+')'; C.lineWidth=2.4; C.shadowColor='#4ade80'; C.shadowBlur=14*crk;
          for(var ck=0;ck<5;ck++){ var cx2=W*(.3+ck*.11);
            C.beginPath(); C.moveTo(cx2,H*.78);
            var steps=Math.ceil(7*crk);
            for(var st2=1;st2<=steps;st2++){ C.lineTo(cx2+Math.sin(st2*2.3+ck)*W*.02, H*.78-(H*.6/7)*st2); }
            C.stroke(); } }
        C.restore();
      }
      // ③ shards fly when the wall breaks
      var burst=Math.max(0,Math.min(1,(ms-6900)/1800));
      if(burst>0&&burst<1){ C.save();
        SHARDS.forEach(function(sh){ var pe=EO(burst);
          var x=W*sh.x+sh.vx*pe*90, y=H*sh.y+sh.vy*pe*50+pe*pe*420;
          C.globalAlpha=(1-burst)*.9; C.save(); C.translate(x,y); C.rotate(sh.a+sh.va*pe*12);
          var sg=C.createLinearGradient(0,-sh.s,0,sh.s); sg.addColorStop(0,'rgba(240,250,255,.9)'); sg.addColorStop(1,'rgba(125,211,252,.3)');
          C.fillStyle=sg; C.beginPath(); C.moveTo(0,-sh.s); C.lineTo(sh.s*.5,0); C.lineTo(0,sh.s*.7); C.lineTo(-sh.s*.45,0); C.closePath(); C.fill(); C.restore(); });
        C.restore(); }
      // SHOCKWAVE RINGS — thaw + reveal, expanding from the heart of the frame
      [[6900,'rgba(190,242,140,'],[20650,'rgba(110,231,160,']].forEach(function(sw2){
        var swp=Math.max(0,Math.min(1,(ms-sw2[0])/900));
        if(swp>0&&swp<1){ C.save(); C.globalAlpha=(1-swp);
          C.strokeStyle=sw2[1]+(0.9*(1-swp))+')'; C.lineWidth=Math.max(2,10*(1-swp));
          C.beginPath(); C.arc(CX,CY,Math.max(W,H)*.75*EO(swp),0,6.283); C.stroke();
          C.lineWidth=Math.max(1,4*(1-swp));
          C.beginPath(); C.arc(CX,CY,Math.max(W,H)*.55*EO(swp),0,6.283); C.stroke(); C.restore(); }
      });
      // vines burst through and keep growing through the mid-film
      var vg2=Math.max(0,Math.min(1,(ms-7000)/2600));
      if(vg2>0){ var fade=ms>17000?Math.max(.25,1-(ms-17000)/4000):1;
        C.save(); C.globalAlpha=.85*fade;
        VINES.forEach(function(v2){ vineGrow(v2.x, Math.min(1,vg2+v2.d*0), Math.sin(t*.8+v2.sway*8)*.5); });
        C.restore(); }

      // god rays after the thaw
      if(Tw>0){ C.save(); C.globalCompositeOperation='lighter'; C.globalAlpha=Tw*.5;
        for(var rr2=0;rr2<3;rr2++){ var rx=W*(.22+rr2*.28)+Math.sin(t*.07+rr2*2)*W*.03;
          var ag=C.createLinearGradient(rx,0,rx+W*.1,H*.9);
          ag.addColorStop(0,'rgba(214,246,180,.12)'); ag.addColorStop(1,'rgba(0,0,0,0)');
          C.fillStyle=ag; C.beginPath(); C.moveTo(rx-W*.012,0); C.lineTo(rx+W*.04,0);
          C.lineTo(rx+W*.14,H*.9); C.lineTo(rx+W*.02,H*.9); C.closePath(); C.fill(); }
        C.restore(); }

      // ① + ② FIREFLIES — one, then the swarm, then ambient
      var one=seg(ms,200,3600,.2,.25);
      if(one>0){ var ox=CX+Math.sin(t*1.1)*W*.06, oy=CY-H*.06+Math.cos(t*.8)*H*.04;
        firefly(ox,oy,3+Math.sin(t*4)*.8,one); }
      var swarm=seg(ms,3000,25000,.18,.05);
      if(swarm>0){ var gather=Math.max(0,Math.min(1,(ms-3000)/2600));
        FFs.forEach(function(f,i2){ if(i2/FFs.length>gather) return;
          var rad=f.r*(0.5+0.5*Math.sin(t*f.sp+f.ph))*Math.min(W,H)*.55;
          var x=CX+Math.cos(f.a+t*f.sp*.5)*rad, y=CY+Math.sin(f.a+t*f.sp*.4)*rad*.7;
          var blink=.3+.7*Math.max(0,Math.sin(t*2+f.ph*3));
          firefly(x,y,f.s,swarm*blink*.8); }); }

      // ── titles & people ──
      // ① cold open
      var a0=seg(ms,600,3400,.3,.25);
      if(a0>0){ TX('J M B   T E T R I S',CX,CY-H*.16,Math.max(15,W*.016),'rgba(224,242,254,.92)',700,a0,10,8);
        TX('something is waking in the dark…',CX,CY-H*.16+34,Math.max(12,W*.012),'rgba(165,205,190,.7)',600,a0,4); }
      // ② the wall
      var a1=seg(ms,3600,6700,.2,.1);
      if(a1>0){ TX('THE SEASON OF',CX,H*.16,Math.max(12,W*.012),'rgba(186,230,253,.9)',800,a1,8);
        LTR('ABSOLUTE ZERO',CX,H*.16+40,Math.max(30,W*.05),'#bde9ff',a1,Math.min(1,(ms-3800)/900),3,36,'rgba(56,189,248,.9)');
        TX('is over.',CX,H*.16+82,Math.max(13,W*.014),'rgba(205,232,250,.85)',600,seg(ms,5200,6700,.3,.1)); }
      if(ms>18600&&ms<19050){} // (kept for readability)
      // ③ thaw title
      var a2=seg(ms,7300,9800,.15,.2);
      if(a2>0){ LTR('THE FOREST BREAKS THROUGH',CX,H*.2,Math.max(19,W*.026),'#d9f99d',a2,Math.min(1,(ms-7400)/900),2,30,'rgba(163,230,53,.9)'); }
      // ④ all-time #1 — laurel VINES draw themselves around the portrait
      var a3=seg(ms,10200,14000,.16,.14);
      if(a3>0){ var pr2=Math.max(46,Math.min(H*.13,W*.05)), py2=CY-Math.max(56,H*.12);
        var lp=Math.min(1,(ms-10400)/1200);
        C.save(); C.globalAlpha=a3; C.strokeStyle='#4ade80'; C.lineWidth=3; C.lineCap='round';
        C.shadowColor='#4ade80'; C.shadowBlur=10;
        C.beginPath(); C.arc(CX,py2,pr2+14,Math.PI*.5,Math.PI*(.5+1.9*lp),false); C.stroke();
        C.fillStyle='#86efac';
        for(var lf2=0;lf2<8;lf2++){ var la2=Math.PI*.5+lf2*(Math.PI*1.9/8); if(lf2/8>lp) break;
          var lx=CX+Math.cos(la2)*(pr2+14), ly=py2+Math.sin(la2)*(pr2+14);
          C.save(); C.translate(lx,ly); C.rotate(la2+1.57);
          C.beginPath(); C.ellipse(8,0,8,3.4,0,0,6.283); C.fill(); C.restore(); }
        C.restore();
        PORTRAIT(TOP.img,TOP.name,CX,py2,pr2*EO(Math.min(1,(ms-10300)/700)),a3,'#a7f3d0');
        TX('HIGHEST RANK · ALL TIME',CX,py2-pr2-40,Math.max(11,W*.0115),'rgba(253,230,138,.95)',800,a3,8);
        LTR(TOP.name,CX,py2+pr2+40,Math.max(24,W*.036),'#f7fee7',a3,Math.min(1,(ms-10500)/900),1,26,'rgba(163,230,53,.8)');
        TX('RANK '+TOP.rank+(TOP.tier?('  ·  '+TOP.tier):''),CX,py2+pr2+76,Math.max(15,W*.02),'#a7f3d0',800,a3,2); }
      // ⑤ champion + podium
      var a4=seg(ms,14200,17400,.16,.16);
      if(a4>0){ var pr3=Math.max(40,Math.min(H*.11,W*.042)), py3=CY-Math.max(70,H*.15);
        PORTRAIT(CHP.img,CHP.name,CX,py3,pr3*EO(Math.min(1,(ms-14300)/600)),a4,'rgba(134,239,172,.9)');
        TX('SEASON CHAMPION',CX,py3-pr3-26,Math.max(11,W*.0115),'rgba(209,250,229,.95)',800,a4,8);
        LTR(CHP.name,CX,py3+pr3+34,Math.max(22,W*.032),'#f0fdf4',a4,Math.min(1,(ms-14400)/800),1,22,'rgba(134,239,172,.7)');
        TX(NF(CHP.points)+' pts · '+NF(CHP.wins)+' wins · '+NF(CHP.lines)+' lines',CX,py3+pr3+68,Math.max(13,W*.016),'#a7f3d0',700,a4);
        if(POD.length){ POD.forEach(function(r2,i2){ var rp=seg(ms,14800+i2*200,17400,.25,.16);
          var y=py3+pr3+Math.max(104,H*.2)+i2*Math.max(34,H*.058);
          PORTRAIT(r2.img,r2.n,CX-Math.max(120,W*.13),y,Math.max(13,H*.028),rp,i2===0?'rgba(253,230,138,.9)':'rgba(134,239,172,.6)');
          C.save(); C.globalAlpha=rp; C.fillStyle=i2===0?'#fef9c3':'rgba(226,252,236,.9)';
          C.font='800 '+Math.max(14,W*.017)+'px Sora,Inter,sans-serif'; C.textAlign='left'; C.textBaseline='middle';
          C.fillText((i2+1)+'.  '+r2.n, CX-Math.max(96,W*.104), y); C.restore();
          TX(NF(r2.p),CX+Math.max(140,W*.15),y,Math.max(14,W*.017),'#a7f3d0',800,rp); }); } }
      // ⑥ THE SERPENT + resets
      var sp2=Math.max(0,Math.min(1,(ms-17600)/3000));
      var a5=seg(ms,17800,20500,.18,.18);
      if(a5>0){ TX('EVERY LADDER RESETS',CX,H*.2,Math.max(13,W*.015),'rgba(187,247,208,.95)',800,a5,8);
        TX('Rank 100+  →  restart at 30        everyone else  →  Rank 1',CX,H*.2+34,Math.max(13,W*.016),'#effcef',700,a5);
        TX('Coins, skins and trophies stay yours.',CX,H*.2+64,Math.max(12,W*.013),'rgba(187,247,208,.8)',600,a5); }
      if(sp2>0&&sp2<1) serpent(sp2);
      // ⑦ the canopy closes + reveal
      var cl=Math.max(0,Math.min(1,(ms-20400)/1400)), Cl=E3(cl);
      if(Cl>0){ C.save();
        var n3=Math.round(W/110)+4;
        for(var i3=0;i3<n3;i3++){ var cx3=(i3/(n3-1))*W, edge=Math.min(cx3,W-cx3)/W;
          var dip=(H*.06+H*.1*(1-Math.min(1,edge*2)))*Cl+Math.sin(t*.8+i3)*3;
          clumpF(cx3,dip,(W*.035+((i3*37)%17))*Cl); }
        for(var i4=0;i4<n3;i4++){ var cx4=((i4+0.5)/(n3-1))*W;
          var dip2=(H*.035)*Cl+Math.sin(t*.7+i4*2)*2;
          clumpF(cx4,H-dip2,(W*.028+((i4*23)%13))*Cl); }
        C.restore(); }
      // firefly BURST behind the title — the swarm detonates outward at the reveal
      var fb=Math.max(0,Math.min(1,(ms-20700)/1600));
      if(fb>0&&fb<1){ var fe=EO(fb);
        FFs.forEach(function(f,i5){ if(i5%2) return;
          var bx=CX+Math.cos(f.a)*fe*Math.min(W,H)*.62*f.r*2, by=CY+Math.sin(f.a)*fe*Math.min(W,H)*.5*f.r*2;
          firefly(bx,by,f.s*1.4,(1-fb)*.9); }); }
      var a6=seg(ms,21000,25000,.2,.02);
      if(a6>0){ TX('A NEW SEASON BEGINS',CX,CY-96,Math.max(11,W*.0115),'rgba(187,247,208,.95)',800,a6,8);
        LTR('MOSSY FOREST',CX,CY-24,Math.max(50,W*.085),'#eaffe8',a6,Math.min(1,(ms-21200)/1100),6,64+Math.sin(t*5)*18,'rgba(74,222,128,.98)');
        RULE(CX,CY+22,Math.max(280,W*.3),a6,'#6ee7a0');
        TX('New flagship block unlocks at Rank 100',CX,CY+56,Math.max(13,W*.016),'rgba(209,250,229,.95)',600,a6);
        var gl2=seg(ms,23400,25000,.3,.05);
        if(gl2>0) TX('Good luck.',CX,CY+110,Math.max(16,W*.021),'#6ee7a0',800,gl2,0,18); }

      // vignette + grain + letterbox + progress
      var vgg=C.createRadialGradient(CX,CY,H*.3,CX,CY,H*.98);
      vgg.addColorStop(0,'rgba(0,0,0,0)'); vgg.addColorStop(1,'rgba(0,0,0,.72)');
      C.fillStyle=vgg; C.fillRect(0,0,W,H);
      C.restore();
      if(ms>6900&&ms<7350) FLASH=1-(ms-6900)/450;
      else if(ms>20650&&ms<21050) FLASH=0.8*(1-(ms-20650)/400);
      else FLASH*=.9;
      if(FLASH>.01){ C.fillStyle='rgba(220,255,225,'+FLASH*.8+')'; C.fillRect(0,0,W,H); }
      try{ var gp=C.createPattern(grain(),'repeat'); if(gp){ C.save(); C.globalAlpha=.5;
        C.translate((t*57)%150-150,(t*83)%150-150); C.fillStyle=gp; C.fillRect(0,0,W+150,H+150); C.restore(); } }catch(e){}
      var barH=Math.max(0,(H-W/2.39)/2);
      if(barH>1){ C.fillStyle='#000'; C.fillRect(0,0,W,barH); C.fillRect(0,H-barH,W,barH); }
      C.fillStyle=mix('#5cc8f5','#4ade80',Tw); C.fillRect(0,H-3,W*(ms/DUR),3);
    }
    function NF(n){ return Number(n||0).toLocaleString(); }

    /* ROBUSTNESS. This runs full-screen in front of the whole dashboard, so a single bad frame
       must never be able to strand someone on a black screen:
         · every frame is wrapped — a throw is logged once and the loop keeps going
         · the canvas is re-measured for the first second, in case layout hadn't settled when
           the overlay was appended (a zero-size canvas draws nothing and looks like a freeze)
         · a watchdog closes the film if it somehow overruns its own duration
       Skip is always available regardless. */
    var _err=0;
    function loop(ts){
      if(!t0)t0=ts;
      var ms=ts-t0;
      if(ms<1000 && (cv.clientWidth!==W || cv.clientHeight!==H)) size();   // late layout
      try{
        if(ms>=DUR){ draw(DUR-1); fin(); return; }
        draw(ms);
      }catch(err){
        if(!_err++){ try{ console.warn('[season film] frame error — continuing:', err); }catch(_){} }
        if(_err>120){ fin(); return; }        // persistently broken → get out of the way
      }
      raf=requestAnimationFrame(loop);
    }
    size(); window.addEventListener('resize',size);
    AC=introScore();
    raf=requestAnimationFrame(loop);
    // hard stop: never hold the screen longer than the film is meant to run
    setTimeout(function(){ if(!done) fin(); }, DUR+2500);
  }

  window.tetOpenRanking=function(){
    var m=el('tet-rank-modal'); if(!m) return;
    renderRankNext(); renderRankBots(); renderHubPlay(); renderHubProfile(null);
    loadCosmetics(); loadChampShowcase(); collapsePlay(); try{ loadSeason(); }catch(_s){} try{ loadRivalries(); }catch(_rv){}
    el('tet-rank-podium').innerHTML='';
    el('tet-rank-body').innerHTML='<div style="text-align:center;color:#6b7d90;padding:30px;">Loading…</div>';
    m.classList.add('open');
    try{ startTetAd(); }catch(_e){}
    try{ startInfernoBg(); }catch(_e){}
    try{ tetChestPeek(); }catch(_e){}
    try{ ac(); sfxHubOpen(); }catch(_){}   // cute pop-in jingle
    // First open of the new season → play the transition film, and let IT start the music
    // when it finishes so the two don't overlap. Every other open starts the track normally.
    if(!azIntroSeen()){ try{ azPlayIntro(); }catch(_ai){ try{ startAzeroAmbience(); }catch(_e){} } }
    else { try{ startAzeroAmbience(); }catch(_e){} }
    fetch(APPS_SCRIPT_URL+'?action=tetris_ranking&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      var rows=(d&&d.ranking)||[];
      _tetBoard=rows;   // cached for Ranked Match
      var me=(typeof eid==='function')?String(eid()).toLowerCase():'';
      var meRow=null;
      rows.forEach(function(p){ if(String(p.employee_id||'').toLowerCase()===me){ meRow=p; if(p.skill_level!=null) _mySkill=p.skill_level; } });
      try{ if(meRow && meRow.cur_streak!=null) _winStreak=Number(meRow.cur_streak)||0; }catch(_ws){}   // continue the persisted streak this session
      renderRankBots(); renderHubProfile(meRow);
      if(!rows.length){ el('tet-rank-body').innerHTML='<div style="text-align:center;color:#6b7d90;padding:26px;">No games recorded yet.<br>Play a 1v1, a tournament, or fight a bot to make the board! 🏆</div>'; return; }
      el('tet-rank-podium').innerHTML='';   // one compact list shows every rank (no big podium eating the rail)
      var rest=rows;
      el('tet-rank-body').innerHTML = rest.length ? rest.map(function(p,i){
        var mine=String(p.employee_id||'').toLowerCase()===me;
        var apg=(p.avg_lines!=null)?p.avg_lines:0;
        var PR=rankFromStars(p.stars||0);
        var bits=[];
        bits.push(Number(PR.stars).toLocaleString()+' ★');
        if(p.wins>0) bits.push(p.wins+' cups');
        if((p.duel_wins||0)+(p.duel_losses||0)>0) bits.push((p.duel_wins||0)+'W–'+(p.duel_losses||0)+'L');
        if(p.combo_best>0) bits.push(p.combo_best+' combo');
        if(p.sprint_ms>0) bits.push('Sprint '+(p.sprint_ms/1000).toFixed(1)+'s');
        if(p.ultra_score>0) bits.push('Ultra '+Number(p.ultra_score).toLocaleString());
        var ph=rkPhoto(p.employee_id);
        var ring2=ringStyle(PR.tier,2)+'border-radius:50%;--ring:'+tierColor(PR.tier)+';';   // the ring IS the rank
        var r2cls='rk-av2 rk-ring'+((PR.god||PR.rank>=110)?' av-god':(PR.tier==='Demi-god'?' av-demigod':(PR.rank>=100?' av-elite100':'')));
        var av2=ph?'<div class="'+r2cls+'" style="padding:0;background:#0b1020;'+ring2+'"><img src="'+ph+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;position:relative;z-index:2;" onerror="this.parentNode.innerHTML=\''+rkInitial(p.name)+'\';this.parentNode.style.background=\'linear-gradient(135deg,#2c3a5c,#1a2438)\';"></div>':'<div class="'+r2cls+'" style="'+ring2+'">'+rkInitial(p.name)+'</div>';
        // The left column is the RANK, not a row number. Position on the board is implied by order.
        var medal=(i<3)?(['🥇','🥈','🥉'][i]+' '):'';
        return '<div class="rk-row rk-slim'+(mine?' me':'')+'" style="animation-delay:'+Math.min(i*24,360)+'ms;">'+
          '<div class="rk-pos" style="color:'+tierColor(PR.tier)+';">'+PR.rank+'</div>'+
          av2+
          '<div style="flex:1;min-width:0;text-align:left;font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+
            medal+(p.crown?'<span class="crown" title="Reigning Grand Final champion">👑</span> ':'')+
            esc(p.name)+beastChips(p.beasts||[])+(mine?' <span style="color:#fbbf24;font-size:9px;">(you)</span>':'')+'</div>'+
          '<div style="font-size:11px;font-weight:800;color:#e0a878;white-space:nowrap;">'+Number(PR.stars).toLocaleString()+'★</div>'+
          '<div class="rk-rank '+tierCls(PR.tier)+'"><span>'+esc(PR.tier)+'</span></div></div>';
      }).join('') : '<div style="text-align:center;color:#6b7d90;padding:8px;font-size:12px;">That\'s everyone so far — climb the ranks! 🎮</div>';
    }).catch(function(){ el('tet-rank-body').innerHTML='<div style="text-align:center;color:#f87171;padding:30px;">Couldn\'t load rankings — try again.</div>'; });
  };

  // ════════════════ TRIVIA CHAMPIONS (avg points/game) ════════════════
  window.trvCloseRanking=function(){ var m=el('trivia-rank-modal'); if(m) m.classList.remove('open'); };
  function trivDayOK(dow){ return dow===0 || dow===1 || dow===3 || dow===5; }   // Sun·Mon·Wed·Fri (match server)
  function renderTrvNext(){
    var nb=el('trv-rank-next'); if(!nb) return;
    var np=phtNowParts(); var nowSec=np.H*3600+np.M*60+np.S, best=1e9;
    for(var add=0; add<=7 && best===1e9; add++){
      if(!trivDayOK((np.dow+add)%7)) continue;
      [2*3600,14*3600].forEach(function(t){ var d=t-nowSec+add*86400; if(d>=0 && d<best) best=d; });
    }
    if(best===1e9){ nb.innerHTML='🧠 Daily Trivia — Mon · Wed · Fri · Sun'; return; }
    var dd=Math.floor(best/86400), hh=Math.floor((best%86400)/3600), mm=Math.floor((best%3600)/60);
    nb.innerHTML='🧠 Next Daily Trivia in '+(dd>0?dd+'d ':'')+(hh>0?hh+'h ':'')+mm+'m — top 3 win 250 / 150 / 100 pts';
  }
  function renderTrvPodium(rows, me){
    var host=el('trv-rank-podium'); if(!host) return;
    var top=rows.slice(0,3); if(!top.length){ host.innerHTML=''; return; }
    var order=[top[1],top[0],top[2]];
    host.innerHTML='<div class="rk-podium">'+order.map(function(p,i){
      if(!p) return '<div class="rk-pod" style="visibility:hidden;"></div>';
      var delay=(i===1?0:(i===0?140:240));
      var first=p.rank===1, mine=String(p.employee_id||'').toLowerCase()===me;
      var md=['🥇','🥈','🥉'][p.rank-1];
      var ph=rkPhoto(p.employee_id);
      var av = ph
        ? '<div class="rk-av" style="overflow:hidden;background:#0b1020;border:3px solid '+rkRing(p.rank)+';padding:0;"><img src="'+ph+'" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.innerHTML=\''+rkInitial(p.name)+'\';this.parentNode.style.background=\''+rkAvColor(p.rank)+'\';"></div>'
        : '<div class="rk-av" style="background:'+rkAvColor(p.rank)+';">'+rkInitial(p.name)+'</div>';
      return '<div class="rk-pod'+(first?' first':'')+(mine?' me':'')+'" style="animation-delay:'+delay+'ms;">'+
        '<div class="rk-md">'+md+'</div>'+ av +
        '<div class="rk-nm">'+esc(p.name)+(mine?' <span style="color:#fbbf24;font-size:9px;">(you)</span>':'')+'</div>'+
        '<div class="rk-rt">'+(p.avg||0)+' <span style="font-weight:600;color:#9fb0d6;font-size:9px;">AVG SCORE</span></div>'+
      '</div>';
    }).join('')+'</div>';
  }
  window.trvOpenRanking=function(){
    var m=el('trivia-rank-modal'); if(!m) return;
    renderTrvNext();
    el('trv-rank-podium').innerHTML='';
    el('trv-rank-body').innerHTML='<div style="text-align:center;color:#6b7d90;padding:30px;">Loading…</div>';
    m.classList.add('open');
    fetch(APPS_SCRIPT_URL+'?action=trivia_ranking&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      var rows=(d&&d.ranking)||[]; var me=(typeof eid==='function')?String(eid()).toLowerCase():'';
      if(!rows.length){ el('trv-rank-body').innerHTML='<div style="text-align:center;color:#6b7d90;padding:26px;">No one has qualified yet.<br>Play at least <b style="color:#c4b5fd;">3</b> Daily Trivia games (2PM &amp; 2AM) to make the board! 🧠</div>'; return; }
      renderTrvPodium(rows, me);
      var rest=rows.slice(3);
      el('trv-rank-body').innerHTML = rest.length ? rest.map(function(p,i){
        var mine=String(p.employee_id||'').toLowerCase()===me;
        var ph=rkPhoto(p.employee_id);
        var av2=ph?'<div class="rk-av2" style="overflow:hidden;padding:0;background:#0b1020;"><img src="'+ph+'" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.innerHTML=\''+rkInitial(p.name)+'\';this.parentNode.style.background=\'linear-gradient(135deg,#2c3a5c,#1a2438)\';"></div>':'<div class="rk-av2">'+rkInitial(p.name)+'</div>';
        return '<div class="rk-row'+(mine?' me':'')+'" style="animation-delay:'+Math.min(i*45,500)+'ms;">'+
          '<div class="rk-pos">'+p.rank+'</div>'+av2+
          '<div style="flex:1;min-width:0;text-align:left;">'+
            '<div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(p.name)+(mine?' <span style="color:#fbbf24;font-size:10px;">(you)</span>':'')+'</div>'+
            '<div style="font-size:10px;color:#9fb0d6;margin-top:2px;">🎮 '+(p.games||0)+' games · '+(p.accuracy||0)+'% correct · best '+(p.best||0)+' · 🏆 '+(p.wins||0)+'W · '+(p.points||0)+' pts</div>'+
          '</div>'+
          '<div style="text-align:right;"><div style="font-size:15px;font-weight:900;color:#c4b5fd;">'+(p.avg||0)+'</div><div style="font-size:8px;color:#7c6da8;text-transform:uppercase;letter-spacing:.05em;">avg score</div></div></div>';
      }).join('') : '<div style="text-align:center;color:#6b7d90;padding:8px;font-size:12px;">That\'s everyone so far! 🎉</div>';
    }).catch(function(){ el('trv-rank-body').innerHTML='<div style="text-align:center;color:#f87171;padding:30px;">Couldn\'t load rankings — try again.</div>'; });
  };

  // ════════════════ TRAINING / SKILL LADDER (vs Bots) ════════════════
  // 10 named bots, Level 1-10. Difficulty scales via drop speed + how often the bot plays a weak move.
  var BOTS=[
    {lv:1, name:'Pixel Pip'},      {lv:2, name:'Blocky Bea'},   {lv:3, name:'Tetra Tim'},
    {lv:4, name:'Cascade Cara'},   {lv:5, name:'Combo Cole'},   {lv:6, name:'Rotor Rhea'},
    {lv:7, name:'Stacker Sven'},   {lv:8, name:'T-Spin Tara'},  {lv:9, name:'Blitz Bruno'},
    {lv:10,name:'Grandmaster Goliath'}
  ];
  var _mySkill=0, _ladderNext=0;
  function collideOn(grid,m,x,y){ for(var r=0;r<m.length;r++)for(var c=0;c<m[r].length;c++){ if(!m[r][c]) continue; var gx=x+c,gy=y+r; if(gx<0||gx>=W||gy>=H) return true; if(gy>=0&&grid[gy][gx]) return true; } return false; }
  // ══════════════ THE RANKED POOL ══════════════
  // 120 standing opponents so Ranked Match always has someone at your exact level, even at
  // 3am when nobody else is online. Each has a fixed rank; their play strength is derived
  // from it, so a Rank 12 opponent really does play like a Rank 12.
  var BOT_FIRST=['James','Michael','Robert','John','David','William','Richard','Joseph','Thomas','Charles',
    'Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Andrew','Kenneth','Joshua',
    'Kevin','Brian','George','Timothy','Ronald','Jason','Edward','Jeffrey','Ryan','Jacob',
    'Mary','Patricia','Jennifer','Linda','Elizabeth','Barbara','Susan','Jessica','Sarah','Karen',
    'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Kimberly','Emily','Donna','Michelle',
    'Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Laura','Sharon','Cynthia','Kathleen',
    'Tyler','Brandon','Justin','Scott','Eric','Stephen','Adam','Nathan','Zachary','Aaron',
    'Austin','Sean','Jordan','Cody','Derek','Travis','Trevor','Blake','Chase','Dustin',
    'Megan','Rachel','Heather','Amber','Brittany','Danielle','Katie','Christina','Vanessa','Erica',
    'Marcus','Tony','Vince','Dean','Wade','Cole','Ross','Grant','Bryce','Reed',
    'Hailey','Sierra','Jenna','Paige','Kelsey','Tara','Monica','Renee','Gina','Alexis',
    'Logan','Hunter','Colton','Garrett','Preston','Spencer','Dalton','Bryan','Curtis','Shane'];
  var BOT_LAST=['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Taylor',
    'Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis',
    'Walker','Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams',
    'Nelson','Hill','Campbell','Mitchell','Roberts','Carter','Phillips','Evans','Turner','Parker',
    'Collins','Edwards','Stewart','Morris','Murphy','Cook','Rogers','Morgan','Peterson','Cooper',
    'Reed','Bailey','Bell','Kelly','Howard','Ward','Cox','Richardson','Wood','Watson',
    'Brooks','Bennett','Gray','James','Price','Myers','Long','Foster','Sanders','Ross',
    'Powell','Sullivan','Russell','Ortiz','Jenkins','Perry','Butler','Barnes','Fisher','Henderson',
    'Coleman','Simmons','Patterson','Jordan','Reynolds','Hamilton','Graham','Wallace','Woods','Cole',
    'West','Owens','Harrison','Fox','Riley','Armstrong','Carpenter','Weaver','Greene','Lawrence',
    'Elliott','Chavez','Sims','Austin','Peters','Kelley','Franklin','Lawson','Fields','Gutierrez',
    'Ryan','Schmidt','Carr','Vasquez','Castillo','Wheeler','Chapman','Oliver','Montgomery','Richards'];
  // Deterministic — the same roster every session, so "Marcus Bell" is always Rank 47.
  function buildRankedPool(){
    var pool=[], rnd=mulberry32(20260713);
    for(var i=0;i<120;i++){
      var first=BOT_FIRST[i % BOT_FIRST.length];
      var last =BOT_LAST[(i*7+3) % BOT_LAST.length];
      // Spread ranks 2..108 across the roster so every band has opponents.
      var rank = 2 + Math.round((i/119) * 106);
      rank = Math.max(1, Math.min(110, rank + Math.floor(rnd()*5) - 2));
      // Rank → play strength (bot level 1-10). Rank 110 ≈ Lv10, Rank 1 ≈ Lv1.
      var lv = Math.max(1, Math.min(10, Math.round(1 + (rank/110)*9)));
      var R  = rankFromStars(0); R.rank=rank; R.tier=tierName(rank,false);
      pool.push({ id:'cpu-'+i, name:first+' '+last, rank:rank, lv:lv, tier:R.tier, cpu:true,
                  wins:Math.floor(rnd()*90)+rank, losses:Math.floor(rnd()*70)+5 });
    }
    return pool.sort(function(a,b){ return a.rank-b.rank; });
  }
  var RANKED_POOL=null;
  function rankedPool(){ if(!RANKED_POOL) RANKED_POOL=buildRankedPool(); return RANKED_POOL; }
  window.tetRankedFight=function(idEnc){
    var id=decodeURIComponent(idEnc);
    var b=null; rankedPool().forEach(function(x){ if(x.id===id) b=x; });
    if(!b) return;
    tetCloseRanking();
    window.tetrisTraining(b.lv, { name:b.name, rank:b.rank, id:b.id, bypass:true, ranked:true });
  };

  window.tetrisTraining=function(level, opts){
    if(M && M.playing) return;
    if(!canPlayGame()) return; ac();
    opts=opts||{};
    level=parseInt(level,10)||1; if(level<1) level=1; if(level>10) level=10;
    // Ranked opponents aren't gated by the practice ladder — they're matched to YOUR rank.
    if(!opts.bypass && level>_mySkill+1){ try{ showToast('Locked — beat Lv'+_mySkill+' first to unlock Lv'+level+'.'); }catch(_){} return; }
    var bot=BOTS[level-1];
    var botName=opts.name || bot.name;
    var oc=el('tet-opp-col'); if(oc) oc.style.display='';
    var arc=el('tet-arena-col'); if(arc) arc.style.display='none';
    el('tet-opp-label').textContent = opts.ranked ? (botName+' · Rank '+opts.rank) : ('🤖 '+botName+' · Lv'+level);
    var id='train-'+Date.now();
    M={ matchId:id, mode:'training', playing:true, ended:false, alive:true, oppName:botName, botLevel:level,
        ranked:!!opts.ranked, _oppRank:opts.rank||0, _oppId:opts.id||'',
        rng:mulberry32(hashStr(id)), bag:[], grid:empty(), score:0, lines:0, level:1, pendingGarbage:0, nextT:null, hold:null, canHold:true, combo:0, b2b:false,
        kos:0, myKos:0, oppKos:0, oppGrid:empty(), oppScore:0, oppLines:0, oppAlive:true };
    BOT={ grid:empty(), rng:mulberry32(hashStr(id+'-bot')), bag:[], score:0, lines:0, alive:true, pending:0, combo:0, kos:0,
        level:level, name:botName, mistake:Math.max(0,(10-level)/13), interval:Math.max(240, 1150-(level-1)*100) };
    openOverlay(); el('tet-controls').style.display='block';
    el('tet-me-score').textContent='0'; el('tet-me-lines').textContent='0'; el('tet-opp-score').textContent='0'; el('tet-opp-lines').textContent='0';
    attachControls();
    var lead = opts.ranked ? botName : ('Lv'+level+' '+botName);
    var n=3; status(lead+' — starting in '+n+'…'); sfxTick();
    var cd=setInterval(function(){ n--; if(n>0){ status('Starting in '+n+'…'); sfxTick(); } else { clearInterval(cd); goTraining(); } }, 800);
  };
  function goTraining(){
    sfxGo(); startMusic(); spawn(); draw(); updateIncoming(); startRender(); renderHold();
    M.dropMs=700; M.loop=setInterval(tick,M.dropMs);
    var lab=' · '+(BOT&&BOT.name?BOT.name:'Bot');
    M.timeLeft=M.dur||120; status(''+fmtT(M.timeLeft)+lab);
    M.timer=setInterval(function(){ M.timeLeft--; if(M.timeLeft<=0){ trainingEnd('time'); } else { status(''+fmtT(M.timeLeft)+lab); if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000);
    BOT.loop=setInterval(botStep, (BOT&&BOT.interval)||900);
  }

  // ════════════════ SOLO CHALLENGES — Sprint 40 & Ultra (2-min) ════════════════
  window.tetrisSprint=function(){ startSolo('sprint'); };
  window.tetrisUltra=function(){ startSolo('ultra'); };
  window.tetrisCombo=function(){ startSolo('combo'); };
  window.tetrisCheese=function(){ startSolo('cheese'); };
  window.tetrisSurvival=function(){ startSolo('survival'); };
  window.tetrisOvergrow=function(){ startSolo('overgrow'); };
  window.tetrisSnakehunt=function(){ startSolo('snakehunt'); };
  window.tetrisWolfhunt=function(){ startSolo('wolfhunt'); };
  window.tetrisBearhunt=function(){ startSolo('bearhunt'); };
  window.tetrisWizardhunt=function(){ startSolo('wizardhunt'); };
  window.tetrisDragonhunt=function(){ startSolo('dragonhunt'); };
  window.tetDrgLocked=function(){ try{ showToast('🔒 The Dragon answers only those who have defeated the Wizard.'); }catch(_t){ alert('Defeat the Wizard first!'); } };
  window.tetWizLocked=function(){ try{ showToast('🔒 The Wizard only duels those who have slain the Bear.'); }catch(_t){ alert('Slay the Bear first!'); } };
  window.tetBearLocked=function(){ try{ showToast('🔒 The Bear only wakes for those who have slain the Wolf.'); }catch(_t){ alert('Slay the Wolf first!'); } };
  window.tetWolfLocked=function(){ try{ showToast('🔒 The Wolf only answers those who have slain the Anaconda.'); }catch(_t){ alert('Slay the Anaconda first!'); } };
  window.tetrisRation=function(){ startSolo('ration'); };
  window.tetrisDaily=function(){ startSolo('daily'); };
  // Today's date key (local — everyone on the team shares PHT). Drives the daily seed + board.
  function _dailyKey(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  var CHEESE_ROWS=10;
  // Cheese Race: seed the bottom of the board with N garbage rows, each with a single hole.
  // Consecutive rows never share the same hole column — that's what forces real digging.
  function seedCheese(n){
    var hole=-1;
    for(var i=0;i<n;i++){
      var h; do{ h=Math.floor(Math.random()*W); } while(h===hole && W>1);
      hole=h;
      var row=new Array(W).fill(8); row[hole]=0;
      M.grid.shift(); M.grid.push(row);
    }
    M.cheeseTotal=n;
  }
  function garbageRows(){ if(!M) return 0; var c=0;
    for(var y=0;y<H;y++){ if(M.grid[y].some(function(v){ return v===8; })) c++; }
    return c; }
  function startSolo(mode){
    if(M && M.playing) return;
    if(!canPlayGame()) return; ac();
    var oc=el('tet-opp-col'); if(oc) oc.style.display='none';
    var arc=el('tet-arena-col'); if(arc) arc.style.display='none';
    // Daily Challenge: seed from the DATE so every player gets the exact same piece sequence
    // today — a fair, shared board. Every other mode stays random per attempt.
    var seedStr=(mode==='daily') ? ('daily-'+_dailyKey()) : (mode+'-'+Date.now());
    var id=(mode==='daily') ? seedStr : (mode+'-'+Date.now());
    M={ matchId:id, mode:mode, playing:true, ended:false, alive:true, oppName:'',
        rng:mulberry32(hashStr(seedStr)), bag:[], grid:empty(), score:0, lines:0, level:1, pendingGarbage:0,
        nextT:null, hold:null, canHold:true, combo:0, b2b:false, maxCombo:0 };
    openOverlay(); el('tet-controls').style.display='block';
    el('tet-me-score').textContent='0'; el('tet-me-lines').textContent='0';
    attachControls();
    var title=soloTitle(mode);
    var n=3; status(title+' — starting in '+n+'…'); sfxTick();
    var cd=setInterval(function(){ n--; if(n>0){ status('Starting in '+n+'…'); sfxTick(); } else { clearInterval(cd); goSolo(mode); } }, 800);
  }
  function soloTitle(mode){
    return mode==='sprint'   ? 'Sprint 40'
         : mode==='combo'    ? '🔥 Combo Rush 1:30'
         : mode==='cheese'   ? '🧀 Cheese Race'
         : mode==='survival' ? '⚡ Survival'
         : mode==='overgrow' ? '🌿 Overgrowth'
         : mode==='snakehunt'? '🐍 Snake Hunt'
         : mode==='wolfhunt' ? '🐺 Wolf Hunt'
         : mode==='bearhunt' ? '🐻 Bear Hunt'
         : mode==='wizardhunt'?'🧙 Wizard Hunt'
         : mode==='dragonhunt'?'🐉 DRAGON HUNT'
         : mode==='ration'   ? '📦 Ration 50'
         : mode==='daily'    ? '🗓️ Daily Challenge'
         : 'Ultra 2:00';
  }
  function goSolo(mode){
    if(mode==='cheese') seedCheese(CHEESE_ROWS);
    sfxGo(); startMusic(); spawn(); draw(); updateIncoming(); startRender(); renderHold();
    M.dropMs=700; M._t0=Date.now();
    /* Ration runs no gravity loop at all. Pieces never fall on their own, so the run costs
       exactly 50 decisions and nothing else — no reflex component, no advantage from a
       faster machine, and no way to farm it by playing longer. */
    if(mode!=='ration') M.loop=setInterval(tick,M.dropMs);
    if(mode==='cheese'){
      status('🧀 0.0s · '+CHEESE_ROWS+' rows to dig');
      M.timer=setInterval(function(){ if(!M||M.ended) return;
        var s=(Date.now()-M._t0)/1000, left=garbageRows();
        status('🧀 '+s.toFixed(1)+'s · '+left+' row'+(left===1?'':'s')+' left'); }, 100);
    } else if(mode==='survival'){
      // Every 5 seconds the gravity gets 30ms faster. Bottoms out at 70ms — pure reflex by then.
      status('⚡ 0:00 · speed 1');
      M.timer=setInterval(function(){ if(!M||M.ended) return;
        var t=Math.floor((Date.now()-M._t0)/1000);
        var ns=Math.max(70, 700 - Math.floor(t/5)*30);
        if(ns!==M.dropMs){ M.dropMs=ns; clearInterval(M.loop); M.loop=setInterval(tick,M.dropMs);
          if(ns>70) announce('⚡ Speed up!'); }
        var spd=1+Math.floor(t/5);
        status('⚡ '+fmtT(t)+' · speed '+spd+' · '+(M.lines||0)+' lines'); }, 1000);
    } else if(mode==='overgrow'){
      /* 🌿 OVERGROWTH — the forest reclaims the board: a vine row every 5 seconds for the
         first minute, then the final minute turns frantic at one every 3. Score = clean lines. */
      M.timeLeft=120; M._vineIvl=5; M._vineIn=5; M.realLines=0; status('🌿 2:00 · 0 lines');
      announce('🌿 The forest is rising!');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); return; }
        M._vineIn--;
        if(M.timeLeft===60){ M._vineIvl=3; M._vineIn=Math.min(M._vineIn,3);
          announce('🌿 THE FINAL MINUTE — THE FOREST SURGES!'); }
        if(M._vineIn<=0){
          addGarbage(1); if(!M||M.ended) return;
          M._vineIn=Math.round(M._vineIvl);   // 5s pulse → 3s in the final minute
          announce('🌿 Vines!');
        }
        if(M&&!M.ended){ status('🌿 '+fmtT(M.timeLeft)+' · '+(M.realLines||0)+' lines · vines in '+M._vineIn+'s');
          if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000);
    } else if(mode==='snakehunt'){
      /* 🐍 SNAKE HUNT — YOU are the hunted. Every 4–5 seconds the anaconda slides across
         the board and its body BLINDS you: a thick band of scales covers the playfield
         while the pieces keep falling. A half-second eye-flash warns you where it will
         cross. 2:00 · score = lines cleared while surviving the snake. */
      M.timeLeft=120; M.snk=null; M.snk2=null; M._snkNext=Date.now()+3000; M.blindBonus=0;
      M.snkHP=100; M.snkDead=false;   // every line you clear wounds the snake — kill it and the hunt ends
      status('🐍 2:00 · 0 lines');
      announce('🐍 The snake is hunting YOU… it HEALS while crossing!');
      function snkHiss(){ try{ var a2=ac(); var len=a2.sampleRate*.5, buf=a2.createBuffer(1,len,a2.sampleRate), d2=buf.getChannelData(0);
        for(var i2=0;i2<len;i2++) d2[i2]=(Math.random()*2-1)*Math.pow(1-i2/len,1.1);
        var src=a2.createBufferSource(); src.buffer=buf;
        var bp=a2.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=5400; bp.Q.value=.8;
        var g2=a2.createGain(); g2.gain.value=.14; src.connect(bp); bp.connect(g2); g2.connect(a2.destination); src.start(); }catch(_h){} }
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); return; }
        status((M.snkDead?'💀 SNAKE SLAIN · ':'🐍 ')+fmtT(M.timeLeft)+' · '+((M.lines||0)+(M.blindBonus||0))+' lines'+(M.snkDead?' · free hunting!':(' · snake '+Math.max(0,Math.round(M.snkHP))+'%')));
        if(M.timeLeft<=10) sfxUrgent(M.timeLeft); }, 1000);
      /* the sweeps run on their own fast clock so the crossings animate smoothly.
         ESCALATION: gaps shrink from ~4.5s to ~2.5s as the clock runs down, crossings
         linger longer — and after 1:00 quick BABY SNAKES dart through between sweeps. */
      M.snkTimer=setInterval(function(){ if(!M||M.ended){ return; }
        var now=Date.now(), late=1-(M.timeLeft/120);          // 0 → 1 over the run
        var hpS=0.45+0.55*Math.max(0,M.snkHP)/100;            // wounded snake = smaller, quicker to pass
        /* REGENERATION — while its body is on your board the snake FEEDS: +1%/s.
           Passivity heals it; you have to wound it faster than it drinks. */
        if(!M.snkDead && M.snkHP>0 && M.snk && now>M.snk.t0 && now<M.snk.t0+M.snk.dur){
          M.snkHP=Math.min(100, M.snkHP+0.12); }
        var enraged=(!M.snkDead && M.snkHP<=50);              // half health → the hunt intensifies
        if(!M.snkDead && !M.snk && now>=M._snkNext){
          M.snk={ t0:now+500, dur:(2100+Math.random()*700+late*800)*hpS,
                  band:0.14+Math.random()*0.55,
                  thick:(0.34+Math.random()*0.16+late*0.06)*hpS,
                  dir:(Math.random()<0.5?1:-1) };
          var gap=4000-late*2000+Math.random()*1000;          // 4–5s early → 2–3s late
          if(enraged) gap*=0.6;                               // …and an enraged snake barely rests
          M._snkNext=now+500+M.snk.dur+gap;
          snkHiss(); try{ boardShake(2); }catch(_b){}
          try{ announce('🐍','combo'); }catch(_a){}
        }
        if(M.snk && now>M.snk.t0+M.snk.dur+400){ M.snk=null;
          // as it slithers off, the snake SPITS a row of green vines onto your board
          if(!M.snkDead && M.alive){ var _sp5=(M.snkHP<=33)?2:1; addGarbage(_sp5);
            if(M&&!M.ended) announce(_sp5>1?'🐍 A FURY OF VINES!':'🐍 It spat vines!'); } }
        // baby snakes: thin, fast, NO warning — the second minute belongs to them
        if((late>0.5||enraged) && !M.snkDead && !M.snk2 && Math.random()<(enraged?0.02:0.012)){
          M.snk2={ t0:now, dur:850+Math.random()*350, band:0.1+Math.random()*0.7,
                   thick:(0.10+Math.random()*0.05)*hpS, dir:(Math.random()<0.5?1:-1), baby:true };
          snkHiss(); }
        if(M.snk2 && now>M.snk2.t0+M.snk2.dur+200){ M.snk2=null; }
      }, 120);
    } else if(mode==='wolfhunt'){
      /* 🐺 WOLF HUNT — Beast Level 2. The wolf doesn't slither: it POUNCES. Quick quadrant
         strikes with only an eye-glint of warning, howls that send THE PACK sprinting
         across three rows at once, and every pounce ends with a BITE that rips holes out
         of your stack. It heals while pouncing, enrages at half health. Slay it — the
         clock is your score. */
      M.timeLeft=120; M.snkHP=100; M.snkDead=false; M.blindBonus=0;
      M.wolf=null; M.pack=null; M._wNext=Date.now()+2500; M._howlAt=Date.now()+15000;
      status('🐺 2:00 · wolf 100%');
      announce('🐺 THE WOLF IS LOOSE — it heals while it pounces!');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); return; }
        status((M.snkDead?'💀 WOLF SLAIN · ':'🐺 ')+fmtT(M.timeLeft)+' · '+((M.lines||0)+(M.blindBonus||0))+' lines'+(M.snkDead?'':(' · wolf '+Math.max(0,Math.round(M.snkHP))+'%')));
        if(M.timeLeft<=10) sfxUrgent(M.timeLeft); }, 1000);
      M.snkTimer=setInterval(function(){ if(!M||M.ended) return;
        var now=Date.now(), enr=(!M.snkDead && M.snkHP<=50);
        // regen while its body is on the board — faster than the snake's
        if(!M.snkDead && M.snkHP>0 && M.wolf && now>M.wolf.t0 && now<M.wolf.t0+M.wolf.dur){
          M.snkHP=Math.min(100, M.snkHP+0.05); }
        if(!M.snkDead && !M.wolf && now>=M._wNext){
          M.wolf={ t0:now+320, dur:750+Math.random()*250, quad:Math.floor(Math.random()*4) };   // 0.32s glint, then the strike
          try{ sfxWolfGrowl(); }catch(_gr){}
          M._wNext=now+320+M.wolf.dur+(4200+Math.random()*1800)*(enr?0.7:1);
          try{ boardShake(2); }catch(_b){}
        }
        if(M.wolf && now>M.wolf.t0+M.wolf.dur+150){
          M.wolf=null;
          // THE BITE — a connected CHUNK torn out of the stack: 2×2 normally (4 blocks,
          // one deep wound), 2×3 when enraged (6 blocks). Falls back to 3 scattered cells
          // if the stack is too thin to hold a chunk.
          if(!M.snkDead && M.alive && !M.clearing){ try{
            var wide=(M.snkHP<=33)?3:2;                       // only a desperate wolf takes the big mouthful
            var anchors=[];
            for(var y=2;y<H-1;y++)for(var x=0;x<=W-wide;x++){
              var fillN=0; for(var dy=0;dy<2;dy++)for(var dx=0;dx<wide;dx++){ if(M.grid[y+dy][x+dx]>0) fillN++; }
              if(fillN>=wide*2-1) anchors.push([y,x]);        // at least all-but-one cells filled
            }
            var ate=0;
            if(anchors.length){
              var an2=anchors[Math.floor(Math.random()*anchors.length)];
              for(var dy2=0;dy2<2;dy2++)for(var dx2=0;dx2<wide;dx2++){
                if(M.grid[an2[0]+dy2][an2[1]+dx2]>0){ M.grid[an2[0]+dy2][an2[1]+dx2]=0; ate++; }
              }
            } else {
              var filled=[]; for(var y2=2;y2<H;y2++)for(var x2=0;x2<W;x2++){ if(M.grid[y2][x2]>0) filled.push([y2,x2]); }
              if(filled.length>4){ for(var b2=0;b2<3&&filled.length;b2++){
                  var pick=filled.splice(Math.floor(Math.random()*filled.length),1)[0];
                  M.grid[pick[0]][pick[1]]=0; ate++; } }
            }
            if(ate){ announce(wide===3?('🐺 RAVENOUS BITE! −'+ate):('🐺 BITE! −'+ate),'tspin');
              try{ boardShake(wide===3?4:3); }catch(_b3){} draw(); }
          }catch(_bt){} }
        }
        if(!M.snkDead && now>=M._howlAt){
          M._howlAt=now+(22000+Math.random()*6000)*(enr?0.7:1);
          announce('🐺 AWOOOO — THE PACK!','combo'); try{ sfxWolfHowl(); }catch(_hw){}
          M.pack={ t0:now, dur:950, rows:[0.15+Math.random()*0.2, 0.42+Math.random()*0.16, 0.68+Math.random()*0.2],
                   dirs:[Math.random()<0.5?1:-1, Math.random()<0.5?1:-1, Math.random()<0.5?1:-1] };
        }
        if(M.pack && now>M.pack.t0+M.pack.dur+200){ M.pack=null; }
      }, 100);
    } else if(mode==='bearhunt'){
      /* 🐻 BEAR HUNT — Beast Level 3. Pure force. PAW SLAMS crash down over half the board
         and the QUAKE shoves your falling piece sideways. ROARS black out the whole board
         for a heartbeat and rattle a garbage row loose. And it GUARDS: 🛡 windows where
         damage is halved — pick your moments. Slay it; the clock is the score. */
      M.timeLeft=120; M.snkHP=100; M.snkDead=false; M.blindBonus=0;
      M.paw=null; M.roar=null; M.guard=null;
      M._pNext=Date.now()+3000; M._rNext=Date.now()+12000; M._gNext=Date.now()+8000;
      status('🐻 2:00 · bear 100%');
      announce('🐻 THE BEAR WAKES — heavy blows crack its guard!');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); return; }
        var gTxt=(M.guard&&Date.now()<M.guard.until)?' · 🛡 GUARDING':'';
        status((M.snkDead?'💀 BEAR SLAIN · ':'🐻 ')+fmtT(M.timeLeft)+' · '+((M.lines||0)+(M.blindBonus||0))+' lines'+(M.snkDead?'':(' · bear '+Math.max(0,Math.round(M.snkHP))+'%'+gTxt)));
        if(M.timeLeft<=10) sfxUrgent(M.timeLeft); }, 1000);
      M.snkTimer=setInterval(function(){ if(!M||M.ended) return;
        var now=Date.now(), enr=(!M.snkDead && M.snkHP<=40);
        // no healing — the mechanics ARE the fight; every wound you land stays landed
        if(!M.snkDead && !M.paw && now>=M._pNext){
          M.paw={ t0:now+500, dur:900, side:(Math.random()<0.5?0:1) };       // shadow grows, then the SLAM
          M._pNext=now+500+900+(4200+Math.random()*1600)*(enr?0.5:1);
          M._slamN=(M._slamN||0)+1;
          try{ sfxBearGrunt(); }catch(_bg){}
        }
        if(M.paw && now>M.paw.t0 && !M.paw.quaked){ M.paw.quaked=true;
          // THE QUAKE — the falling piece is shoved one column toward the slam
          try{ if(M.cur){ var shove=(M.paw.side?1:-1);
            if(!collide(M.cur.m,M.cur.x+shove,M.cur.y)){ M.cur.x+=shove; draw(); } }
            boardShake(7); announce('🐻 SLAM!','tspin');
            // every 3rd slam CRUSHES — the quake shakes a stone row loose under you
            if((M._slamN%3)===0){ setTimeout(function(){ if(M&&!M.ended&&M.alive&&!M.snkDead){ addGarbage(1); announce('🐻 CRUSHED!'); } },400); }
            // every other slam SWATS the hold slot empty
            if((M._slamN%2)===0 && M.hold){ M.hold=null; try{ renderHold(); }catch(_rh){} announce('🐻 SWATTED your hold away!'); } }catch(_qk){}
        }
        if(M.paw && now>M.paw.t0+M.paw.dur+200){ M.paw=null; }
        if(!M.snkDead && !M.roar && now>=M._rNext){
          M.roar={ t0:now, dur:800 };
          M._rNext=now+(19000+Math.random()*6000)*(enr?0.6:1);
          announce('🐻 RRRAAAAGH!','tetris'); try{ sfxBearRoar(); boardShake(9); }catch(_rr){}
          M.dizzyUntil=now+M.roar.dur+3000;                                // the roar leaves you DIZZY
          setTimeout(function(){ if(M&&!M.ended&&!M.snkDead) announce('😵 DIZZY — controls reversed!','tspin'); },900);
          setTimeout(function(){ if(M&&!M.ended&&M.alive&&!M.snkDead){ addGarbage(enr?2:1); } },850);
        }
        if(M.roar && now>M.roar.t0+M.roar.dur+150){ M.roar=null; }
        if(!M.snkDead && (!M.guard||now>M.guard.until) && now>=M._gNext){
          M.guard={ until:now+8000 };
          M._gNext=now+8000+(11000+Math.random()*5000);
          announce('🛡 The bear guards — damage halved!');
        }
      }, 100);
    } else if(mode==='wizardhunt'){
      /* 🧙 WIZARD HUNT — Beast Level 4. He doesn't touch your board; he bends the RULES.
         POLYMORPH transmutes your falling piece mid-air. GRAVITY HEX doubles fall speed.
         ARCANE RUNES burn on your stack — clear their rows to defuse (bonus damage!) or
         they detonate into stone. And his MANA SHIELD absorbs everything: pour 12+ damage
         into it before it fades and it SHATTERS, stunning him — 4 seconds of ×2 damage. */
      M.timeLeft=120; M.snkHP=100; M.snkDead=false; M.blindBonus=0;
      M.runes=[]; M.wizShield=null; M.wizStun=0; M.hexUntil=0; M.wizPos={x:0.5,y:0.12};
      M.wizIntro=Date.now(); M.wizBolts=[];
      M._wcNext=Date.now()+4000; M._wsNext=Date.now()+10000;
      status('🧙 2:00 · wizard 100%');
      announce('🧙 THE WIZARD DUELS YOU — he shrugs off singles. Hit him BIG.');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); return; }
        var sTxt=(M.wizShield&&Date.now()<M.wizShield.until)?(' · 🔮 shield '+Math.max(0,Math.ceil(15-M.wizShield.dmg))):((M.wizStun>Date.now())?' · 😵 STUNNED ×2':'');
        status((M.snkDead?'💀 WIZARD SLAIN · ':'🧙 ')+fmtT(M.timeLeft)+' · '+(M.lines||0)+' lines'+(M.snkDead?'':(' · wizard '+Math.max(0,Math.round(M.snkHP))+'%'+sTxt)));
        if(M.timeLeft<=10) sfxUrgent(M.timeLeft); }, 1000);
      M.snkTimer=setInterval(function(){ if(!M||M.ended) return;
        var now=Date.now(), enr=(!M.snkDead && M.snkHP<=40);
        // he TELEPORTS between casts
        if(!M._wTel||now>M._wTel){ M._wTel=now+2600+Math.random()*2200;
          M.wizPos={ x:0.16+Math.random()*0.68, y:0.08+Math.random()*0.16, blink:now }; }
        // SPELLCAST — polymorph, hex or runes, on one clock
        if(!M.snkDead && M.wizStun<now && now>=M._wcNext){
          M._wcLast=now;
          M._wcNext=now+(3500+Math.random()*2000)*(enr?0.45:1);
          if(enr && Math.random()<0.5){ M._wcNext=now+900; announce('🧙 TWIN CURSE!','tspin'); }
          var spell=Math.random();
          if(spell>=0.78){                                          // 🗿 STONE WAVE — survival pressure
            announce('🗿 STONE WAVE!','tspin');
            try{ sfxWizCast(); M.wizBolts.push({ tx:0.5, ty:0.92, t0:now, col:'#9ca3af' }); }catch(_sw){}
            setTimeout(function(){ if(M&&!M.ended&&M.alive&&!M.snkDead){ addGarbage(2); try{ boardShake(5); }catch(_s5){} } },500);
          }
          else if(spell<0.3 && M.cur){                              // 🔮 POLYMORPH
            try{ var t2=TYPES[Math.floor(Math.random()*TYPES.length)];
              var keep={x:M.cur.x,y:M.cur.y};
              M.cur={ type:t2, rot:0, m:STATES[t2][0], x:keep.x, y:keep.y };
              while(collide(M.cur.m,M.cur.x,M.cur.y)&&M.cur.x>0) M.cur.x--;
              while(collide(M.cur.m,M.cur.x,M.cur.y)&&M.cur.x<W-1) M.cur.x++;
              if(collide(M.cur.m,M.cur.x,M.cur.y)) M.cur.y=Math.max(0,M.cur.y-1);
              M.polyFlash=now; announce('🔮 POLYMORPHED!','tspin'); try{ sfxWizCast(); }catch(_c1){}
              try{ M.wizBolts.push({ tx:(M.cur.x+M.cur.m[0].length/2)/W, ty:(M.cur.y+1)/H, t0:now, col:'#c4b5fd' }); }catch(_b1){}
              draw(); }catch(_pm){}
          } else if(spell<0.55){                                    // ⏳ GRAVITY HEX
            M.hexUntil=now+6000; announce('⏳ GRAVITY HEX — everything falls faster!','tspin');
            try{ M.wizBolts.push({ tx:0.5, ty:0.55, t0:now, col:'#f0abfc' }); }catch(_b2){}
            try{ sfxWizCast(); var oldMs=M.dropMs; M.dropMs=Math.max(90,Math.round(M.dropMs/2));
              clearInterval(M.loop); M.loop=setInterval(tick,M.dropMs);
              setTimeout(function(){ if(M&&!M.ended&&M.loop){ M.dropMs=oldMs; clearInterval(M.loop); M.loop=setInterval(tick,M.dropMs); } },6000); }catch(_hx){}
          } else {                                                  // 🕯 ARCANE RUNES
            try{ var cands=[];
              for(var ry=3;ry<H;ry++)for(var rx=0;rx<W;rx++){ if(M.grid[ry][rx]>0) cands.push([ry,rx]); }
              var nR=Math.min(4,cands.length);
              for(var rn=0;rn<nR;rn++){ var pk2=cands.splice(Math.floor(Math.random()*cands.length),1)[0];
                M.runes.push({ y:pk2[0], x:pk2[1], det:now+5000 });
                try{ M.wizBolts.push({ tx:(pk2[1]+0.5)/W, ty:(pk2[0]+0.5)/H, t0:now+rn*120, col:'#a855f7' }); }catch(_b3){} }
              if(nR){ announce('🕯 ARCANE RUNES — clear their rows or they turn to stone!','tspin'); try{ sfxWizCast(); }catch(_c2){} } }catch(_rn){}
          }
        }
        // rune DETONATION — the cell and a neighbour petrify
        if(M.runes.length){ for(var di2=M.runes.length-1;di2>=0;di2--){ var RU=M.runes[di2];
          if(now>=RU.det){ M.runes.splice(di2,1);
            try{ if(M.grid[RU.y]&&M.grid[RU.y][RU.x]>0) M.grid[RU.y][RU.x]=8;
              var nbs=[[RU.y-1,RU.x],[RU.y,RU.x-1],[RU.y,RU.x+1],[RU.y+1,RU.x]].filter(function(q){ return M.grid[q[0]]&&M.grid[q[0]][q[1]]>0&&M.grid[q[0]][q[1]]!==8; });
              for(var _nb2=0;_nb2<2&&nbs.length;_nb2++){ var nq=nbs.splice(Math.floor(Math.random()*nbs.length),1)[0]; M.grid[nq[0]][nq[1]]=8; }
              announce('🕯 PETRIFIED!','tspin'); try{ boardShake(3); sfxWizShatter(0.5); }catch(_p2){}
              M.runeBursts=M.runeBursts||[]; M.runeBursts.push({ x:RU.x, y:RU.y, t0:now }); draw(); }catch(_dt2){} } } }
        // MANA SHIELD windows
        if(!M.snkDead && M.wizStun<now && !M.wizShield && now>=M._wsNext){
          M.wizShield={ until:now+8000, dmg:0 };
          M._wsNext=now+8000+(8000+Math.random()*4000)*(enr?0.6:1);
          announce('🔮 MANA SHIELD — pour 12 damage in to SHATTER it!');
        }
        if(M.wizShield && now>=M.wizShield.until){ M.wizShield=null; }
        if(M.wizStun && now>=M.wizStun && M.wizStun>0){ /* stun expiry handled by reads */ }
      }, 100);
    } else if(mode==='dragonhunt'){
      /* 🐉 DRAGON HUNT — THE FINALE. She circles above your board in SCALE ARMOR that
         shrugs off 75% of everything… until she breathes. FIREBREATH sweeps the columns,
         scorching the top block of each to ember — and for 5 seconds after, her BELLY
         GLOWS: strike it for ×2.5. WING GUSTS hurl your piece two columns and whip the
         fall speed. TAIL SWEEPS smash two stone rows in. At 10% she calls METEORS.
         Slay her; the clock is your legend. */
      M.timeLeft=120; M.snkHP=100; M.snkDead=false; M.blindBonus=0;
      M.drg={ x:0.5, dir:1 }; M.breath=null; M.drgBelly=0; M.gustUntil=0;
      M._dbNext=Date.now()+7000; M._dgNext=Date.now()+4000; M._dtNext=Date.now()+15000;
      M.drgIntro=Date.now(); M.scorchFx=[];
      status('🐉 2:00 · dragon 100%');
      announce('🐉 THE DRAGON DESCENDS — her armor shrugs off all but the belly-strike!');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); return; }
        var bTxt=(M.drgBelly>Date.now())?' · ⚔ BELLY EXPOSED ×2.5':(M.breath?' · 🔥 FIREBREATH':'');
        status((M.snkDead?'💀 DRAGON SLAIN · ':'🐉 ')+fmtT(M.timeLeft)+' · '+(M.lines||0)+' lines'+(M.snkDead?'':(' · dragon '+Math.max(0,Math.round(M.snkHP))+'%'+bTxt)));
        if(M.timeLeft<=10) sfxUrgent(M.timeLeft); }, 1000);
      M.snkTimer=setInterval(function(){ if(!M||M.ended) return;
        var now=Date.now(), enr=(!M.snkDead && M.snkHP<=35);
        // she wheels across the sky
        if(M.drg){ M.drg.x+=0.004*M.drg.dir*(M.breath?0:1);
          if(M.drg.x>0.86){ M.drg.dir=-1; } if(M.drg.x<0.14){ M.drg.dir=1; } }
        // 🔥 FIREBREATH — sweeps the board, scorching the crown of every column it crosses
        if(!M.snkDead && !M.breath && now>=M._dbNext){
          M.breath={ t0:now+700, dur:2400, dir:(M.drg.x>0.5?-1:1), lastCol:-1 };   // 0.7s inhale
          M._dbNext=now+700+2400+(6500+Math.random()*2500)*(enr?0.5:1);
          announce('🔥 SHE INHALES…','tspin'); try{ sfxDrgRoar(); boardShake(4); }catch(_dr){}
        }
        if(M.breath && now>M.breath.t0 && now<M.breath.t0+M.breath.dur){
          var bp=(now-M.breath.t0)/M.breath.dur;
          var col=Math.min(W-1, Math.floor((M.breath.dir>0? bp : 1-bp)*W));
          if(col!==M.breath.lastCol){ M.breath.lastCol=col;
            try{ for(var sy=0;sy<H;sy++){ if(M.grid[sy][col]>0){
              if(M.grid[sy][col]!==8){ M.grid[sy][col]=8; M.scorchFx.push({x:col,y:sy,t0:now}); } break; } } draw(); }catch(_sc){}
          }
        }
        if(M.breath && now>=M.breath.t0+M.breath.dur){
          M.breath=null; M.drgBelly=now+5000;
          announce('⚔ HER BELLY GLOWS — STRIKE NOW! ×2.5','tetris'); try{ sfxCombo(5); }catch(_bg2){}
        }
        // 💨 WING GUST — hurls the piece two columns and whips gravity
        if(!M.snkDead && !M.breath && now>=M._dgNext){
          M._dgNext=now+(4200+Math.random()*2200)*(enr?0.55:1);
          try{ if(M.cur){ var gd=(Math.random()<0.5?-1:1);
            for(var gs2=0;gs2<2;gs2++){ if(!collide(M.cur.m,M.cur.x+gd,M.cur.y)) M.cur.x+=gd; }
            announce('💨 WING GUST!'); boardShake(3); draw(); }
            M.gustUntil=now+2200;
            var oldMs2=M.dropMs; M.dropMs=Math.max(90,Math.round(M.dropMs*0.55));
            clearInterval(M.loop); M.loop=setInterval(tick,M.dropMs);
            setTimeout(function(){ if(M&&!M.ended&&M.loop){ M.dropMs=oldMs2; clearInterval(M.loop); M.loop=setInterval(tick,M.dropMs); } },2200); }catch(_gu){}
        }
        // 🐲 TAIL SWEEP — two stone rows surge in
        if(!M.snkDead && !M.breath && now>=M._dtNext){
          M._dtNext=now+(14000+Math.random()*5000)*(enr?0.6:1);
          announce('🐲 TAIL SWEEP!','tspin'); try{ boardShake(6); }catch(_ts2){}
          setTimeout(function(){ if(M&&!M.ended&&M.alive&&!M.snkDead){ addGarbage(2); } },400);
        }
      }, 100);
    } else if(mode==='ration'){
      announce('📦 50 pieces · hard drop to place');
      rationStatus();
    } else if(mode==='sprint'){
      status('0.0s · 0/40 lines');
      M.timer=setInterval(function(){ if(!M||M.ended) return; var s=(Date.now()-M._t0)/1000; status(''+s.toFixed(1)+'s · '+Math.min(M.lines,40)+'/40 lines'); }, 100);
    } else if(mode==='combo'){
      M.timeLeft=90; status('🔥 1:30 · best combo 0');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); }
        else { var cur=(M.combo>1?(' · combo '+M.combo):''); status('🔥 '+fmtT(M.timeLeft)+' · best '+(M.maxCombo||0)+cur); if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000);
    } else {
      M.timeLeft=120; status('2:00 · 0 pts');
      M.timer=setInterval(function(){ if(!M||M.ended) return; M.timeLeft--;
        if(M.timeLeft<=0){ soloEnd('time'); }
        else { status(''+fmtT(M.timeLeft)+' · '+M.score+' pts'); if(M.timeLeft<=10) sfxUrgent(M.timeLeft); } }, 1000);
    }
  }
  function soloEnd(how){
    if(!M||M.ended) return; M.ended=true; M.alive=false; M.playing=false;
    clearLockTimer(); if(M.loop) clearInterval(M.loop); if(M.timer) clearInterval(M.timer); if(M.snkTimer) clearInterval(M.snkTimer);
    cancelRender(); stopMusic(); detachControls();
    var mode=M.mode, elapsed=Date.now()-(M._t0||Date.now());
    var timeMode=(mode==='sprint'||mode==='cheese'||mode==='survival');
    if(mode==='snakehunt'||mode==='wolfhunt'||mode==='bearhunt'||mode==='wizardhunt'||mode==='dragonhunt') timeMode=true;
    var win = (mode==='sprint'||mode==='cheese') ? (how==='done')
            : (mode==='survival') ? (elapsed>=60000)      // lasting a full minute counts as a good run
            : (mode==='ration') ? ((M.lines||0)>=9)       // 9+ lines from 50 pieces is a genuinely good run
            : (mode==='overgrow') ? (how==='time')        // outlasting the forest IS the win
            : (mode==='snakehunt'||mode==='wolfhunt'||mode==='bearhunt'||mode==='wizardhunt'||mode==='dragonhunt') ? (!!M.snkDead)
            : (how==='time');
    var soloScore = (mode==='combo') ? (M.maxCombo||0)
                  : (mode==='overgrow') ? (M.realLines||0)
                  : (mode==='snakehunt'||mode==='wolfhunt'||mode==='bearhunt'||mode==='wizardhunt'||mode==='dragonhunt') ? ((M.lines||0)+(M.blindBonus||0))   // kept for the result card
                  : (M.score||0);
    var res={ mode:mode, win:win, time_ms:((mode==='snakehunt'||mode==='wolfhunt'||mode==='bearhunt'||mode==='wizardhunt'||mode==='dragonhunt')?(M.snkSlayMs||elapsed):(timeMode?elapsed:(mode==='combo'?90000:120000))), score:soloScore, lines:M.lines||0, slain:!!M.snkDead };
    if(win){ try{ sfxWin(); }catch(_){} } else { try{ sfxLose(); }catch(_){} }
    window._tetLast={ kind:'solo', mode:mode };   // enable Play again
    showSoloResult(how, res);
    // Daily Challenge posts to its own per-day board (best score for the day is kept server-side).
    if(mode==='daily'){
      fetch(APPS_SCRIPT_URL+'?action=daily_submit&date='+encodeURIComponent(_dailyKey())+'&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())
        +'&score='+res.score+'&lines='+res.lines+'&_='+Date.now()).catch(function(){});
      return;
    }
    // Only record valid finishes.
    var record = (mode==='sprint' && win)
              || (mode==='cheese' && win)
              || (mode==='survival' && how==='topout')
              || (mode==='ration')
              || (mode==='overgrow')                       // every run counts — even the forest's wins
              || ((mode==='snakehunt'||mode==='wolfhunt'||mode==='bearhunt'||mode==='wizardhunt'||mode==='dragonhunt') && win)   // only SLAYS make the board
              || ((mode==='ultra'||mode==='combo') && how==='time');
    if(record){
      fetch(APPS_SCRIPT_URL+'?action=solo_result&mode='+mode+'&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())
        +'&time_ms='+res.time_ms+'&score='+res.score+'&lines='+res.lines+'&_='+Date.now())
        .then(function(r){return r.json();}).then(function(d){
          var g=(d&&d.ghost)||null;
          if(g && g.ghosts && g.ghosts.length){
            try{ tetConfetti({count:120,dur:2400}); }catch(_c){}
            var names=g.ghosts.map(function(x){return esc(x.ghost);});
            var who=names.length===1?names[0]:(names.length+' ghosts');
            try{ showToast('👻 Ghost toppled! You beat '+who+' — +'+g.awarded+'★ banked.'); }catch(_t){}
          }
          try{ loadGauntlet(); }catch(_lg){}   // refresh the ladder after any ranked run
        }).catch(function(){});
    }
  }
  window.soloClose=function(){ var m=el('solo-result'); if(m) m.classList.remove('open'); try{ cleanup(); }catch(_){} var ov=el('tet-overlay'); if(ov) ov.style.display='none'; };
  function showSoloResult(how, r){
    var m=el('solo-result'); if(!m) return;
    el('solo-res-title').textContent = soloTitle(r.mode);
    var hero;
    if(r.mode==='cheese'){
      hero = r.win
        ? '<div style="font-size:12px;color:#9fb0d6;">You dug out '+CHEESE_ROWS+' rows in</div><div style="font-size:44px;font-weight:900;color:#fbbf24;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div><div style="font-size:11.5px;color:#9fb0d6;">'+r.lines+' lines cleared</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">Buried</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+garbageRows()+' garbage rows still standing.</div>';
    } else if(r.mode==='survival'){
      var secs=r.time_ms/1000;
      hero = '<div style="font-size:12px;color:#9fb0d6;">You survived</div><div style="font-size:44px;font-weight:900;color:'+(r.win?'#fbbf24':'#f87171')+';line-height:1.1;">'+fmtT(Math.floor(secs))+'</div><div style="font-size:11.5px;color:#9fb0d6;">reached speed '+(1+Math.floor(secs/5))+' · '+r.lines+' lines</div>';
    } else if(r.mode==='ration'){
      var _w=Math.max(0, 200 - r.lines*10);
      hero = '<div style="font-size:12px;color:#9fb0d6;">Cleared from 50 pieces</div>'
           + '<div style="font-size:44px;font-weight:900;color:'+(r.lines>=14?'#7bf5a8':(r.win?'#fbbf24':'#f87171'))+';line-height:1.1;">'
           + r.lines+'<span style="font-size:20px;"> / 20</span></div>'
           + '<div style="font-size:11.5px;color:#9fb0d6;">'+_w+' of 200 cells wasted'
           + (r.lines>=20?' — a perfect game.':(r.lines>=14?' — excellent efficiency.':''))+'</div>';
    } else if(r.mode==='overgrow'){
      hero = r.win
        ? '<div style="font-size:12px;color:#9fb0d6;">You outlasted the forest — clean lines</div><div style="font-size:44px;font-weight:900;color:#7bf5a8;line-height:1.1;">'+Number(r.score).toLocaleString()+'<span style="font-size:20px;"> lines</span></div><div style="font-size:11.5px;color:#9fb0d6;">2:00 survived 🌿 · vine rows dug out don\'t count — only your own blocks</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">Overgrown</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">The vines took the board — '+Number(r.score).toLocaleString()+' clean lines before it fell.</div>';
    } else if(r.mode==='dragonhunt'){
      hero = r.slain
        ? '<div style="font-size:12px;color:#9fb0d6;">YOU SLEW THE DRAGON in</div><div style="font-size:44px;font-weight:900;color:#fb923c;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div><div style="font-size:11.5px;color:#9fb0d6;">🐉💀 THE BEAST LADDER IS CONQUERED. Your name becomes legend.</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">The dragon still reigns</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+Number(r.score).toLocaleString()+' lines — her scales turn all but the belly-strike after each firebreath.</div>';
    } else if(r.mode==='wizardhunt'){
      hero = r.slain
        ? '<div style="font-size:12px;color:#9fb0d6;">You defeated the WIZARD in</div><div style="font-size:44px;font-weight:900;color:#c4b5fd;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div><div style="font-size:11.5px;color:#9fb0d6;">🧙💀 Beast Level 4 conquered — the magic dies with him</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">The wizard endures</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+Number(r.score).toLocaleString()+' lines — he shrugs off singles. Build doubles+, shatter the shield, punish the ×3 stun.</div>';
    } else if(r.mode==='bearhunt'){
      hero = r.slain
        ? '<div style="font-size:12px;color:#9fb0d6;">You slew the BEAR in</div><div style="font-size:44px;font-weight:900;color:#7bf5a8;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div><div style="font-size:11.5px;color:#9fb0d6;">🐻💀 Beast Level 3 conquered — the forest itself bows</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">The bear still stands</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+Number(r.score).toLocaleString()+' lines of damage — crack its 🛡 guard with Tetrises and T-spins.</div>';
    } else if(r.mode==='wolfhunt'){
      hero = r.slain
        ? '<div style="font-size:12px;color:#9fb0d6;">You slew the WOLF in</div><div style="font-size:44px;font-weight:900;color:#7bf5a8;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div><div style="font-size:11.5px;color:#9fb0d6;">🐺💀 Beast Level 2 conquered — the pack falls silent</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">The wolf still breathes</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+Number(r.score).toLocaleString()+' lines of damage — only a slay makes the board.</div>';
    } else if(r.mode==='snakehunt'){
      hero = r.slain
        ? '<div style="font-size:12px;color:#9fb0d6;">You slew the snake in</div><div style="font-size:44px;font-weight:900;color:#7bf5a8;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div><div style="font-size:11.5px;color:#9fb0d6;">💀 '+Number(r.score).toLocaleString()+' lines of damage — fastest slay tops the board</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">The snake survived</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+Number(r.score).toLocaleString()+' lines of damage — only a SLAY makes the board. Blind clears wound it double.</div>';
    } else if(r.mode==='combo'){
      hero = '<div style="font-size:12px;color:#9fb0d6;">Best combo in 1:30</div><div style="font-size:44px;font-weight:900;color:#fbbf24;line-height:1.1;">'+Number(r.score).toLocaleString()+'<span style="font-size:20px;"> combo</span></div><div style="font-size:11.5px;color:#9fb0d6;">'+r.lines+' lines cleared</div>';
    } else if(r.mode==='sprint'){
      hero = r.win
        ? '<div style="font-size:12px;color:#9fb0d6;">You cleared 40 lines in</div><div style="font-size:44px;font-weight:900;color:#fbbf24;line-height:1.1;">'+(r.time_ms/1000).toFixed(2)+'<span style="font-size:20px;">s</span></div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">Topped out</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+r.lines+'/40 lines — try again!</div>';
    } else {
      hero = r.win
        ? '<div style="font-size:12px;color:#9fb0d6;">Final score</div><div style="font-size:44px;font-weight:900;color:#fbbf24;line-height:1.1;">'+Number(r.score).toLocaleString()+'</div><div style="font-size:11.5px;color:#9fb0d6;">'+r.lines+' lines in 2:00</div>'
        : '<div style="font-size:26px;font-weight:900;color:#f87171;">Topped out</div><div style="font-size:12.5px;color:#9fb0d6;margin-top:5px;">'+Number(r.score).toLocaleString()+' pts before the stack maxed out.</div>';
    }
    el('solo-res-hero').innerHTML=hero;
    el('solo-res-board').innerHTML='<div style="text-align:center;color:#6b7d90;padding:20px;">Loading…</div>';
    m.style.display='';   // clear any inline display:none left by a prior "Play again" so .open can show it
    m.classList.add('open');
    if(r.win){ try{ tetConfetti({count:160,dur:2800}); }catch(_){} }
    try{ voiceResult(!!r.win); }catch(_v){}   // announcer: win / lose
    if(r.mode==='daily'){ loadDailyBoard(); return; }
    loadSoloBoard(r.mode);
  }
  function loadDailyBoard(){
    fetch(APPS_SCRIPT_URL+'?action=daily_board&date='+encodeURIComponent(_dailyKey())+'&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      var rows=(d&&d.ranking)||[]; var me=(typeof eid==='function')?String(eid()).toLowerCase():'';
      var head='<div style="text-align:center;font-size:11px;color:#7d8bab;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Today · same board for everyone</div>';
      if(!rows.length){ el('solo-res-board').innerHTML=head+'<div style="text-align:center;color:#6b7d90;padding:14px;font-size:12px;">No runs yet — you could top today\'s board! 🏆</div>'; return; }
      el('solo-res-board').innerHTML=head+rows.slice(0,10).map(function(p){
        var mine=String(p.employee_id||'').toLowerCase()===me;
        var medal=p.rank<=3?['🥇','🥈','🥉'][p.rank-1]:('<span style="color:#6b7d90;">'+p.rank+'</span>');
        var ph=rkPhoto(p.employee_id);
        var av=ph?'<div class="rk-av2" style="overflow:hidden;padding:0;background:#0b1020;"><img src="'+ph+'" style="width:100%;height:100%;object-fit:cover;object-position:50% 26%;"></div>':'<div class="rk-av2">'+rkInitial(p.name)+'</div>';
        return '<div class="rk-row'+(mine?' me':'')+'"><div class="rk-pos">'+medal+'</div>'+av+'<div style="flex:1;min-width:0;text-align:left;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(p.name)+(mine?' <span style="color:#fbbf24;font-size:10px;">(you)</span>':'')+'</div><div style="font-weight:900;color:#fbbf24;font-size:14px;">'+Number(p.score).toLocaleString()+' pts</div></div>';
      }).join('');
    }).catch(function(){ el('solo-res-board').innerHTML='<div style="text-align:center;color:#f87171;padding:16px;">Couldn\'t load today\'s board.</div>'; });
  }
  function loadSoloBoard(mode){
    fetch(APPS_SCRIPT_URL+'?action=solo_ranking&mode='+mode+'&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      var rows=(d&&d.ranking)||[]; var me=(typeof eid==='function')?String(eid()).toLowerCase():'';
      if(!rows.length){ el('solo-res-board').innerHTML='<div style="text-align:center;color:#6b7d90;padding:16px;font-size:12px;">No runs yet — you could be first! 🏆</div>'; return; }
      el('solo-res-board').innerHTML=rows.slice(0,10).map(function(p){
        var mine=String(p.employee_id||'').toLowerCase()===me;
        var medal=p.rank<=3?['🥇','🥈','🥉'][p.rank-1]:('<span style="color:#6b7d90;">'+p.rank+'</span>');
        var val = (mode==='sprint'||mode==='cheese'||mode==='snakehunt'||mode==='wolfhunt'||mode==='bearhunt'||mode==='wizardhunt'||mode==='dragonhunt') ? ((p.time_ms/1000).toFixed(2)+'s')
                : (mode==='survival') ? fmtT(Math.floor((p.time_ms||0)/1000))
                : (mode==='combo') ? (Number(p.score).toLocaleString()+' combo')
                : (Number(p.score).toLocaleString()+' pts');
        var ph=rkPhoto(p.employee_id);
        var av=ph?'<div class="rk-av2" style="overflow:hidden;padding:0;background:#0b1020;"><img src="'+ph+'" style="width:100%;height:100%;object-fit:cover;object-position:50% 26%;"></div>':'<div class="rk-av2">'+rkInitial(p.name)+'</div>';
        return '<div class="rk-row'+(mine?' me':'')+'"><div class="rk-pos">'+medal+'</div>'+av+'<div style="flex:1;min-width:0;text-align:left;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(p.name)+(mine?' <span style="color:#fbbf24;font-size:10px;">(you)</span>':'')+'</div><div style="font-weight:900;color:#fbbf24;font-size:14px;">'+val+'</div></div>';
      }).join('');
    }).catch(function(){ el('solo-res-board').innerHTML='<div style="text-align:center;color:#f87171;padding:16px;">Couldn\'t load the board.</div>'; });
  }
  function botNextType(){ if(!BOT.bag.length){ BOT.bag=TYPES.slice(); for(var i=BOT.bag.length-1;i>0;i--){ var j=Math.floor(BOT.rng()*(i+1)); var t=BOT.bag[i]; BOT.bag[i]=BOT.bag[j]; BOT.bag[j]=t; } } return BOT.bag.shift(); }
  function botEval(g){
    var heights=new Array(W).fill(0), holes=0;
    for(var x=0;x<W;x++){ var seen=false; for(var y=0;y<H;y++){ if(g[y][x]){ if(!seen){ heights[x]=H-y; seen=true; } } else if(seen){ holes++; } } }
    var agg=0,bump=0,maxh=0,lines=0; for(var i=0;i<W;i++){ agg+=heights[i]; if(heights[i]>maxh)maxh=heights[i]; if(i<W-1) bump+=Math.abs(heights[i]-heights[i+1]); }
    for(var yy=0;yy<H;yy++){ var full=true; for(var xx=0;xx<W;xx++){ if(!g[yy][xx]){ full=false; break; } } if(full) lines++; }
    return -0.51*agg + 0.76*lines - 0.36*holes - 0.18*bump - 0.2*maxh;
  }
  function botBest(type){
    var best=null;
    for(var rot=0;rot<4;rot++){ var m=STATES[type][rot];
      for(var x=-2;x<W;x++){
        if(collideOn(BOT.grid,m,x,0)) continue;
        var y=0; while(!collideOn(BOT.grid,m,x,y+1)) y++;
        var g=BOT.grid.map(function(r){return r.slice();}); var ok=true;
        for(var r=0;r<m.length&&ok;r++){ for(var c=0;c<m[r].length;c++){ if(m[r][c]){ var gy=y+r,gx=x+c; if(gy<0){ ok=false; break; } g[gy][gx]=m[r][c]; } } }
        if(!ok) continue;
        var sc=botEval(g); if(!best||sc>best.score) best={score:sc,x:x,y:y,m:m};
      }
    }
    return best;
  }
  function botClear(){ var n=0; for(var y=H-1;y>=0;y--){ var full=true; for(var x=0;x<W;x++){ if(!BOT.grid[y][x]){ full=false; break; } } if(full){ BOT.grid.splice(y,1); BOT.grid.unshift(new Array(W).fill(0)); n++; y++; } } return n; }
  function botAddGarbage(n){ var prevHole=-1; for(var i=0;i<n;i++){ if(BOT.grid[0].some(function(v){return v>0;})){ BOT.alive=false; return; } var hole=Math.floor(Math.random()*W); if(W>1&&hole===prevHole){ hole=(hole+1+Math.floor(Math.random()*(W-1)))%W; } prevHole=hole; var row=new Array(W).fill(8); row[hole]=0; BOT.grid.shift(); BOT.grid.push(row); } }
  function botRandom(type){ var opts=[];
    for(var rot=0;rot<4;rot++){ var m=STATES[type][rot];
      for(var x=-2;x<W;x++){ if(collideOn(BOT.grid,m,x,0)) continue; var y=0; while(!collideOn(BOT.grid,m,x,y+1)) y++;
        var ok=true; for(var r=0;r<m.length&&ok;r++){ for(var c=0;c<m[r].length;c++){ if(m[r][c] && (y+r)<0){ ok=false; break; } } }
        if(ok) opts.push({x:x,y:y,m:m}); } }
    return opts.length?opts[Math.floor(Math.random()*opts.length)]:null;
  }
  function botStep(){
    if(!M||M.ended||!BOT||!BOT.alive) return;
    if(BOT.pending>0){ var bd=Math.min(BOT.pending,MAX_SEND); botAddGarbage(bd); BOT.pending-=bd; if(!BOT.alive){ botKO(); return; } }
    var type=botNextType();
    // Low-level bots play a weak (random) move sometimes; top bots always play optimally.
    var best=(BOT.mistake && Math.random()<BOT.mistake) ? (botRandom(type)||botBest(type)) : botBest(type);
    if(!best){ botKO(); return; }
    var m=best.m; for(var r=0;r<m.length;r++){ for(var c=0;c<m[r].length;c++){ if(m[r][c]){ var gy=best.y+r,gx=best.x+c; if(gy>=0&&gy<H&&gx>=0&&gx<W) BOT.grid[gy][gx]=m[r][c]; } } }
    var cleared=botClear();
    if(cleared>0){ var sent=[0,0,1,1,2][cleared]||2; BOT.combo=(BOT.combo||0)+1; sent+=COMBO_TABLE[Math.min(BOT.combo-1,COMBO_TABLE.length-1)];
      sent=Math.min(sent, MAX_SEND);
      if(sent>0){ M.pendingGarbage=Math.min(PENDING_CAP,M.pendingGarbage+sent); updateIncoming(); }
      BOT.lines+=cleared; BOT.score+=([0,100,300,500,800][cleared]||0);
    } else BOT.combo=0;
    M.oppGrid=BOT.grid; M.oppScore=BOT.score; M.oppLines=BOT.lines;
    el('tet-opp-score').textContent=BOT.score; el('tet-opp-lines').textContent=BOT.lines; drawOpp();
  }
  // ── Nightly tournament trigger (poll the backend; prompt everyone at 11 PM) ──
  function showNightlyPrompt(sid){
    if(!window._gameAlarmsOn) return;              // Oct 7: tournament popups / sirens are off for good (owner)
    if(bkIsDay(sid)) return;                       // ☀️ DAY TOURNAMENTS RETIRED (Sep 2026) — never prompt for a DT- sid
    if(tourneyDeclined(sid)) return;              // they said no — don't nag
    var e=el('tet-nightly-pop'); if(!e) return;
    e.setAttribute('data-sid', sid);
    // Sunday reads differently — it's the championship.
    try{
      var bl = el('tet-nightly-blurb');
      var _keep = '<div style="margin-top:6px;font-size:11px;color:#22c55e;font-weight:700;">️ Your timer keeps running — no need to stop your task.</div>';
      if(bl) bl.innerHTML = (bkIsGrand(sid)
        ? '👑 <b style="color:#fbbf24;">THE GRAND FINAL</b> — the week\'s championship. Top 3 earn 1,200 · 600 · 300 JMB Points, and the winner wears the crown all week.'
        : bkIsDay(sid)
        ? '☀️ <b style="color:#fbbf24;">Day Tournament</b> — knockout bracket. Top 3 earn JMB Points: 🥇250 · 🥈150 · 🥉100.'
        : 'Tournament time! Knockout bracket — top 3 earn JMB Points: 🥇250 · 🥈150 · 🥉100.') + _keep;
    }catch(_g){}
    e.style.display='block';
    try{ bkIsGrand(sid) ? sfxGrandAlarm() : sfxInvite(); }catch(_){}   // 👑 the Grand Final ANNOUNCES itself
  }
  window.tetNightlyJoin=function(){ var e=el('tet-nightly-pop'); var sid=e?e.getAttribute('data-sid'):''; if(e) e.style.display='none'; if(sid) window.tourneyStartNightly(sid); };
  // DECLINE — you're out for THIS tournament and won't be nagged again about it. Playing is
  // never mandatory; the bracket goes ahead without you.
  var _tourneyDeclined={};
  window.tetNightlyDecline=function(){
    var e=el('tet-nightly-pop'); var sid=e?e.getAttribute('data-sid'):'';
    if(sid) _tourneyDeclined[sid]=true;
    if(e) e.style.display='none';
    if(TL && TL.tid===sid){ TL=null; el('tourney-lobby').style.display='none'; }
    try{ showToast('Sat out this one. You can still jump in from the Tetris button while the doors are open.'); }catch(_){}
  };
  window.tetNightlyDismiss=window.tetNightlyDecline;   // legacy name
  function tourneyDeclined(sid){ return !!_tourneyDeclined[sid]; }
  /* Handler only — the polling is now done ONCE by the combined trigger loop (see get_triggers),
     which calls this with the latest tourney version string. No own fetch anymore. */
  var _tourneyBase=null;
  window._handleTourneyTrigger=function(ver){
    ver=ver||'';
    if(_tourneyBase===null){ _tourneyBase=ver; return; }
    if(ver && ver!==_tourneyBase){ _tourneyBase=ver; var sid=ver.split('|').pop();
      if(bkIsDay(sid) || String(ver).indexOf('|day|')>=0) return;   // ☀️ retired day tournaments ignored
      /* Oct 7 (owner): no automatic tournament popup / siren. The bracket still runs; anyone who wants in
         joins from the Tetris button while the doors are open. */
    }
  };

  // ── Nightly scheduler + tournament FAB ──
  // Start time (PHT): 10:00 PM on Saturday & Sunday, 11:00 PM Monday–Friday.
  // Invite everyone online at the top of that hour → 45s lobby → bracket auto-starts.
  // Tournament timing must use a TRUSTED clock — a player whose computer time is wrong used to
  // join/miss the bracket at the wrong moment. We sync an offset to the Apps Script server time
  // and apply it everywhere the schedule is read, so everyone's window lines up regardless of
  // their device clock.
  function syncTetClock(){
    try{
      var t0=Date.now();
      fetch(APPS_SCRIPT_URL+'?action=server_time&_='+t0).then(function(r){return r.json();}).then(function(x){
        if(x&&x.now){ var t1=Date.now(); window._tetClockOffset=(Number(x.now)+(t1-t0)/2)-t1; }
      }).catch(function(){});
    }catch(e){}
  }
  syncTetClock(); setInterval(syncTetClock, 240000);   // re-sync every 4 min
  function phtNowParts(){ var d=new Date(Date.now()+(window._tetClockOffset||0)+8*3600*1000);
    return { H:d.getUTCHours(), M:d.getUTCMinutes(), S:d.getUTCSeconds(), date:d.toISOString().slice(0,10), dow:d.getUTCDay() }; }
  /* SEP 2026 — daytime tournaments RETIRED (DAY_HOUR=-1 keeps every day-path branch dead
     without ripping out the plumbing). SEP 24 2026 — the nightly tournaments are retired too:
     the ONLY scheduled event is the Sunday Grand Final at 10:00 PM PHT. */
  var DAY_HOUR=-1, DAY_MIN=5;
  // Sunday only — the Grand Final. Must match _tetDayOK_ server-side.
  function tetDayOK(dow){ return dow===0; }
  // The Grand Final runs every Sunday at 10:00 PM PHT (moved from 7:45 PM on Sep 24, 2026).
  function ntHour(dow){ return 22; }   // Sunday 10 PM — the only event
  function ntMin(dateStr){
    // The Grand Final starts on the hour. Kept as a function so the countdown maths is unchanged.
    return 0;
  }
  function daySec(){ return DAY_HOUR*3600 + DAY_MIN*60; }
  // Seconds until the NEXT tournament of ANY kind — skips days with no tournament.
  function ntSecsTo(p){
    var now=p.H*3600+p.M*60+p.S;
    for(var add=0; add<=7; add++){
      var dow=(p.dow+add)%7; if(!tetDayOK(dow)) continue;
      var day=daySec(), night=ntHour(dow)*3600 + ((add===0?ntMin(p.date):0))*60;
      if(add===0){ if(now<day) return day-now; if(now<night) return night-now; continue; }
      return add*86400 - now + day;                                // next tournament day starts with the 1:05 PM bracket
    }
    return 0;
  }
  // Which one is next? Returns 'day' or 'night'.
  function ntNextKind(p){
    var now=p.H*3600+p.M*60+p.S;
    if(tetDayOK(p.dow)){ if(now < daySec()) return 'day'; if(now < ntHour(p.dow)*3600 + ntMin(p.date)*60) return 'night'; }
    return 'day';                                                  // next tournament day opens with the day bracket
  }
  // "LIVE / JOIN" must be advertised ONLY while the doors are actually open — otherwise a late tap
  // spins up a fresh lobby AFTER the bracket was built and spawns a divergent, wrong-opponent draw.
  // Day join window = 60s (13:05:00–13:05:59). Night = the lobby window (60s, or 150s for the Grand Final).
  function ntIsDayLive(p){ return tetDayOK(p.dow) && p.H===DAY_HOUR && p.M===DAY_MIN; }   // exactly the 60s join window
  function ntIsLive(p){
    if(!tetDayOK(p.dow)) return false;
    if(ntIsDayLive(p)) return true;
    var h=ntHour(p.dow), m0=ntMin(p.date);
    if(p.H!==h) return false;
    var elapsed=(p.M-m0)*60 + p.S;                              // seconds since the night start (HH:MM)
    var win = bkIsGrand('NT-'+p.date) ? 150 : 60;              // must match _lobbySecs (Grand Final = 2:30)
    return elapsed>=0 && elapsed<win;
  }
  function ntLiveSid(p){ return ntIsDayLive(p) ? ('DT-'+p.date) : ('NT-'+p.date); }
  var _ntInvitedDate=null;
  window.tetTourneyFabClick=function(){
    /* Oct 13 (Jeth): the pause stops tournaments, their alerts and JMB Points — NOT Tetris. Paused → straight to the Tetris dashboard. */
    if(window.GAMES_PAUSED){ if(typeof tetOpenRanking==='function') tetOpenRanking(); return; }
    var p=phtNowParts();
    if(TB){ openOverlay(); return; }   // a bracket is already running — just re-open it
    var live=ntIsLive(p) || (TL&&TL.nightly) || (M&&M.nightly&&M.playing);
    if(TL&&TL.nightly){ el('tourney-lobby').style.display='flex'; return; }
    if(M&&M.playing){ try{ showToast('You are already in a game.'); }catch(_){} return; }
    if(live){ window.tourneyStartNightly(ntLiveSid(p)); return; }
    // No timer / not live → open the Tetris dashboard (current rankings)
    if(typeof tetOpenRanking==='function') tetOpenRanking();
  };
  setInterval(function(){
    var p=phtNowParts();
    var dash=document.getElementById('dashboard-screen');
    var onDash = !!dash && getComputedStyle(dash).display!=='none';
    var fab=document.getElementById('tet-tourney-fab');
    var toStart=ntSecsTo(p);
    var inMinute=(p.H===ntHour(p.dow) && p.M===ntMin(p.date));
    var _gp=!!window.GAMES_PAUSED;   // tournaments paused → no countdown, no "LIVE", no doors (Tetris itself stays open)
    var live=(!_gp && ntIsLive(p)) || (TL&&TL.nightly) || (TB&&TB.nightly&&!TB.done) || (M&&M.nightly&&M.playing);
    if(fab){
      fab.style.display = onDash ? 'inline-flex' : 'none';
      var lbl=document.getElementById('ttf-label');
      if(live){ fab.classList.add('live'); if(lbl) lbl.innerHTML='Tournament LIVE <span class="ttf-cd">JOIN</span>'; }
      else if(!_gp && toStart<=1800){ fab.classList.remove('live'); var mm=Math.floor(toStart/60), ss=toStart%60; if(lbl) lbl.innerHTML='Tournament <span class="ttf-cd">'+mm+':'+(ss<10?'0':'')+ss+'</span>'; }
      else { fab.classList.remove('live'); if(lbl) lbl.textContent='Tetris'; }   // no timer → just "Tetris"
    }
    // ── DOORS OPEN ── The lobby is the opening window (nightly :00, day :05). When it closes the
    // bracket begins — every client builds it independently, from the clock. No host to wait for.
    // The GRAND FINAL gets a longer 2:30 window so more finalists can make it in.
    var _h = ntHour(p.dow);
    var _nmin = ntMin(p.date);                                               // night start minute (0, or 30 tonight)
    var _tetOK = tetDayOK(p.dow) && !_gp;   // tournaments run Tue · Thu · Sun only (never while paused)
    var _grandNight = _tetOK && (p.H === _h) && bkIsGrand('NT-' + p.date);   // Sunday-night championship
    var _lobbySecs = _grandNight ? 150 : 60;                                 // Grand Final = 2:30 waiting time
    var nightElapsed = (p.H === _h) ? (p.M*60 + p.S - _nmin*60) : -1;         // seconds since the night start (HH:MM)
    var dayElapsed   = (p.H === DAY_HOUR) ? (p.M*60 + p.S - DAY_MIN*60) : -1;
    var nightMinute = _tetOK && nightElapsed >= 0 && nightElapsed < _lobbySecs;
    var dayMinute   = _tetOK && dayElapsed   >= 0 && dayElapsed   < 60;
    var inLobby = nightMinute || dayMinute;
    var doorsShut = _tetOK && ((p.H === _h && nightElapsed >= _lobbySecs && nightElapsed < 300) ||
                    (p.H === DAY_HOUR && dayElapsed >= 60 && p.M < DAY_MIN+5));
    var openSid = dayMinute ? ('DT-'+p.date) : ('NT-'+p.date);
    var _invKey = p.date + (dayMinute ? '-day' : '-night');   // day and night invite separately

    if(inLobby){
      // Auto-invite everyone online once, at the top of the scheduled window.
      // GUARD (Aug 2026): only after the server clock sync has SUCCEEDED (_tetClockOffset set).
      // A device with a wrong clock (hours off) used to fire the Grand Final popup at 5 AM
      // Monday because IT believed it was Sunday night — an unsynced clock now never invites.
      if(_ntInvitedDate!==_invKey && window._tetClockOffset!=null && !(M&&M.playing) && !TL && !TB){ _ntInvitedDate=_invKey; /* Oct 7: no auto-invite popup — see showNightlyPrompt note */ }
      var rem = nightMinute ? Math.max(0, _lobbySecs - nightElapsed) : Math.max(0, 60 - dayElapsed);
      var _remT = (rem>=60) ? (Math.floor(rem/60)+':'+(('0'+(rem%60)).slice(-2))) : (rem+'s');
      var cd=el('tet-nightly-cd'), pop=el('tet-nightly-pop');
      if(cd && pop && pop.style.display==='block'){ cd.textContent = rem>0 ? ('Doors close in '+_remT+' — tap Join!') : 'Doors closing…'; }
      if(TL && TL.nightly && !TL.started){
        var a=el('tl-auto');
        if(a) a.textContent = rem>0
          ? ('Doors close in '+_remT+' · '+Object.keys(TL.players).length+' player'+(Object.keys(TL.players).length!==1?'s':'')+' in')
          : 'Doors closed — starting…';
      }
    }
    if(doorsShut && TL && TL.nightly && !TL.started){
      var pe=el('tet-nightly-pop'); if(pe) pe.style.display='none';
      if(!TL.players[eid()] && !TL.spec){
        // You never joined — the tournament runs without you. Just close the lobby.
        TL=null; el('tourney-lobby').style.display='none';
      } else {
        // SETTLE WINDOW: once doors shut, keep gossiping the roster for a few seconds so any
        // late/dropped join converges on EVERY client before the bracket is drawn. Building the
        // instant doors closed was the race that made two clients disagree on pairings.
        if(!TL._settleFrom) TL._settleFrom=Date.now();
        _sendRoster();
        var _settled=(Date.now()-TL._settleFrom)>=4000;
        var ids=Object.keys(TL.players||{});
        var _al=el('tl-auto'); if(_al) _al.textContent = _settled ? 'Doors closed — starting…' : ('Doors closed — syncing players… '+ids.length+' in');
        if(_settled){
          if(ids.length>=2){
            TL.started=true;
            var pls=ids.map(function(id){return {id:id,name:TL.players[id]};});
            beginBracket(TL.tid, pls);   // every client builds the SAME bracket — no host required
          } else {
            TL=null; el('tourney-lobby').style.display='none';
            try{ showToast('Tournament — not enough players joined.'); }catch(_){}
          }
        }
      }
    }
    if(!inLobby && !doorsShut && p.H!==_h && p.H!==DAY_HOUR){ _ntInvitedDate=null; }
  }, 1000);

  function botKO(){ if(!BOT) return; BOT.kos=(BOT.kos||0)+1; M.oppKos=BOT.kos; updateKoDisplay();
    try{ voiceKO(); }catch(_){}   // announcer shouts on the knockout you landed
    if(BOT.kos>=koMax()){ BOT.alive=false; trainingEnd('botdead'); return; }
    stripGarbage(BOT.grid);   // clear garbage + settle remaining blocks
    BOT.pending=0; BOT.combo=0; BOT.alive=true;
  }
  function trainingEnd(how){
    if(!M||M.ended) return; M.ended=true; M.alive=false; M.playing=false;
    if(how==='time') sfxUrgent(0);
    if(M.loop) clearInterval(M.loop); if(M.timer) clearInterval(M.timer); if(BOT&&BOT.loop) clearInterval(BOT.loop);
    cancelRender(); stopMusic(); detachControls();
    var win = (how==='botdead') ? true : (how==='userdead') ? false : (M.score>=(BOT?BOT.score:0));
    // Bracket bot match (odd player out) → report to the bracket, skip the Skill Ladder entirely.
    if(M.bk){ bkBotDone(win, M.score||0); return; }
    var lv=M.botLevel||0, bname=(BOT&&BOT.name)||'the Bot';
    // ── Ranked pool match ── separate from the Skill Ladder: it doesn't climb levels, and it
    // awards NO stars. Standing opponents are replayable, so paying stars for them would be a
    // free farm. They exist so there's always a fair fight available, not to inflate ranks.
    if(M.ranked){
      window._tetLast={ kind:'ranked', level:M.botLevel, name:bname, rank:M._oppRank, id:M._oppId };
      var rp=el('tr-points'); showDuelResult(!!win);
      var _agr=el('tr-again'); if(_agr) _agr.style.display='block';
      var orank=M._oppRank||0, oid=M._oppId||'', worth=poolStars(orank);
      if(!win){
        if(rp) rp.textContent = bname+' (Rank '+orank+') took that one. A loss here costs you nothing — run it back.';
        return;
      }
      if(rp) rp.textContent='🏆 You beat '+bname+' — Rank '+orank+'. Banking '+worth+' ★…';
      // ONE-TIME CONQUEST: the match_id is keyed to this opponent, so the backend physically
      // cannot record a second win against them. Beating them again is worth nothing.
      fetch(APPS_SCRIPT_URL+'?action=game_result&solo=1&mode=pool'+
            '&match_id='+encodeURIComponent('pool-'+eid()+'-'+oid)+
            '&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())+
            '&result=win&score='+(M.score||0)+'&lines='+(M.lines||0)+
            '&opponent='+encodeURIComponent(bname)+'&opp_rank='+orank+'&_='+Date.now())
        .then(function(r){ return r.json(); }).then(function(d){
          if(oid && _poolBeaten.indexOf(oid)<0) _poolBeaten.push(oid);   // never offer them again
          if(!rp) return;
          if(d && d.already){
            rp.textContent='🏆 You beat '+bname+' (Rank '+orank+') again — but you already claimed their '+worth+' ★. Find someone new.';
          } else if(d && d.ok){
            rp.innerHTML='🏆 First win over <b>'+esc(bname)+'</b> (Rank '+orank+') — <b style="color:#fbbf24;">+'+worth+' ★</b> banked!';
            try{ tetConfetti({count:120,dur:2400}); }catch(_){}
          } else {
            rp.textContent='🏆 You beat '+bname+' (Rank '+orank+').';
          }
        }).catch(function(){ if(rp) rp.textContent='🏆 You beat '+bname+' (Rank '+orank+').'; });
      return;
    }
    if(lv) recordBotGame(win, lv, M.score||0, M.lines||0, bname);   // grade skill + log lines
    // Skill Ladder: on a WIN, climb to the next level automatically until you lose (or clear Lv10).
    if(lv && win && lv<10){
      var nx=lv+1, nb=BOTS[lv];
      status('🏆 Lv'+lv+' cleared! Next up: Lv'+nx+' '+esc(nb.name)+'…'); sfxWin();
      showLevelUp(lv, nx, nb.name);
      _ladderNext=nx;
      setTimeout(function(){
        if(_ladderNext!==nx) return; _ladderNext=0; if(M&&M.playing) return;
        window.tetrisTraining(nx);
        // Safety net: if the next round can't start (e.g. work status flipped off "idle",
        // canPlayGame() bailed), don't leave the arena frozen — show the scoreboard so the
        // player can Play again or exit.
        setTimeout(function(){
          if(M&&M.playing) return;
          window._tetLast={ kind:'training', level:nx };
          showDuelResult(true);
          var _ag=el('tr-again'); if(_ag) _ag.style.display='block';
          var _p=el('tr-points'); if(_p) _p.textContent='🏆 Lv'+lv+' cleared! Next round didn’t start — tap Play again for Lv'+nx+'.';
        }, 500);
      }, 2600);
      return;
    }
    window._tetLast={ kind:'training', level:M.botLevel||1 };
    var p=el('tr-points'); showDuelResult(win?true:false);
    var _agt=el('tr-again'); if(_agt) _agt.style.display='block';
    if(lv){
      if(win){ if(p) p.textContent='🏆 Skill Ladder complete — you beat all 10 bots! You are a Grandmaster.'; }
      else if(p){ p.textContent='Skill Ladder · fell at Lv'+lv+' — best cleared: Lv'+_mySkill; }
    } else if(p){ p.textContent='Training — no points'; }
  }
  function recordBotGame(win, lv, score, lines, bname){
    if(win && lv>_mySkill) _mySkill=lv;
    fetch(APPS_SCRIPT_URL+'?action=bot_result&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())+'&level='+lv+'&won='+(win?1:0)+'&_='+Date.now())
      .then(function(r){return r.json();}).then(function(d){ if(d&&d.skill_level!=null) _mySkill=d.skill_level; }).catch(function(){});
    fetch(APPS_SCRIPT_URL+'?action=game_result&solo=1&mode=bot&match_id='+encodeURIComponent('bot-'+eid()+'-'+Date.now())
      +'&employee_id='+encodeURIComponent(eid())+'&full_name='+encodeURIComponent(ename())
      +'&result='+(win?'win':'loss')+'&score='+(score||0)+'&lines='+(lines||0)+'&opponent='+encodeURIComponent(bname||'Bot')+'&_='+Date.now()).catch(function(){});
  }
  // Brief "Level Up" splash between ladder rounds
  function showLevelUp(from, to, nextName){
    var host=el('tet-bigcount'), num=el('bc-num'); if(!host||!num) return;
    host.style.display='flex'; num.className='bc-num go'; num.textContent='Lv'+to;
    void num.offsetWidth; num.classList.add('bc-anim');
    setTimeout(function(){ host.style.display='none'; num.classList.remove('bc-anim'); }, 1400);
  }
  // ── Skill Ladder UI ──
  window.tetCloseLadder=function(){ var m=el('tet-ladder-modal'); if(m) m.style.display='none'; };
  window.tetLadderFight=function(lv){ tetCloseLadder(); window.tetrisTraining(lv); };
  function buildLadderHTML(compact){
    var DIFF=['Warm-up','Easy','Easy','Fair','Fair','Tough','Tough','Hard','Very hard','Elite'];
    return BOTS.map(function(b){
      var cleared=b.lv<=_mySkill, next=b.lv===_mySkill+1, locked=b.lv>_mySkill+1;
      var badge=cleared?'<span style="color:#34d399;font-size:11px;font-weight:800;">✓ Cleared</span>':(next?'<span style="color:#fbbf24;font-size:11px;font-weight:800;">▶ Play now</span>':'<span style="color:#6b7d90;font-size:11px;">Beat Lv'+(b.lv-1)+' to unlock</span>');
      var tile = locked
        ? '<div style="width:'+(compact?'26':'30')+'px;height:'+(compact?'26':'30')+'px;border-radius:8px;background:#0c1120;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:'+(compact?'12':'13')+'px;color:#4a5670;"></div>'
        : '<div style="width:'+(compact?'26':'30')+'px;height:'+(compact?'26':'30')+'px;border-radius:8px;background:linear-gradient(135deg,#1b2233,#0c1120);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:'+(compact?'12':'13')+'px;color:#fbbf24;">'+b.lv+'</div>';
      var btn = locked
        ? '<button disabled style="background:#161b28;color:#4a5670;border:1px solid rgba(255,255,255,.06);border-radius:9px;padding:7px 13px;font-weight:800;font-size:12px;cursor:not-allowed;">Locked</button>'
        : '<button onclick="tetLadderFight('+b.lv+')" style="background:linear-gradient(135deg,#ff6b1a,#e83d00);color:#fff;border:none;border-radius:9px;padding:7px 13px;font-weight:800;font-size:12px;cursor:pointer;">'+(cleared?'Replay':'Fight')+'</button>';
      return '<div style="display:flex;align-items:center;gap:10px;padding:'+(compact?'7px 10px':'10px 12px')+';margin-bottom:6px;border-radius:11px;opacity:'+(locked?'.6':'1')+';background:'+(next?'rgba(251,191,36,.12)':'#ffffff')+';border:1px solid '+(next?'rgba(251,191,36,.4)':(cleared?'rgba(52,211,153,.3)':'rgba(255,255,255,.08)'))+';">'+
        tile+
        '<div style="flex:1;min-width:0;text-align:left;"><div style="font-size:'+(compact?'12.5':'13.5')+'px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(b.name)+'</div>'+
          '<div style="font-size:10px;color:#9fb0d6;margin-top:1px;">'+DIFF[b.lv-1]+' · '+badge+'</div></div>'+
        btn+'</div>';
    }).join('');
  }
  function renderLadder(){
    el('tet-ladder-sub').innerHTML='Your Skill Grade: <b style="color:#fbbf24;">Lv '+_mySkill+' / 10</b> — beat the next bot to climb. Practice anytime you\'re idle.';
    el('tet-ladder-body').innerHTML=buildLadderHTML(false);
  }
  function renderRankBots(){
    var host=el('tet-rank-bots'); if(!host) return;
    host.innerHTML='<div style="font-size:12px;font-weight:800;color:#a855f7;margin:2px 0 8px;">🤖 Challenge a bot daily — your Skill Grade Lv '+_mySkill+'/10</div>'+buildLadderHTML(true);
  }
  function renderRankNext(){
    var nb=el('tet-rank-next'); if(!nb) return;
    var np=phtNowParts(); var toS=ntSecsTo(np);
    var hh=Math.floor(toS/3600), mm=Math.floor((toS%3600)/60);

    // Which tournament are we counting down to — the 3 PM day bracket or tonight's nightly?
    var kind = ntNextKind(np);
    var nowSec = np.H*3600 + np.M*60 + np.S;
    var _h = ntHour(np.dow);
    // If the nightly is next it's tonight; if we've rolled past it, the next Grand Final check
    // must look at tomorrow's day, not today's.
    var targetDow = (nowSec < _h*3600) ? np.dow : ((np.dow + 1) % 7);
    var grandNext = (kind==='night' && targetDow === 0);   // Sunday night only

    if(ntIsLive(np)){
      nb.innerHTML = ntIsDayLive(np)
        ? '☀️ <b style="color:#fbbf24;">DAY TOURNAMENT LIVE</b> — tap the Tetris button to join!'
        : (bkIsGrand('NT-'+np.date)
            ? '👑 THE GRAND FINAL IS LIVE — tap the Tetris button to join!'
            : '🔴 Tournament LIVE now — tap the Tetris button to join!');
    } else if(kind==='day'){
      nb.innerHTML = '☀️ <b style="color:#fbbf24;">Day Tournament</b> in '+(hh>0?hh+'h ':'')+mm+'m — top 3 win ' +
                     '<b style="color:#fbbf24;">250 / 150 / 100</b> pts ' +
                     '<span style="color:#6b7d90;">(1:05 PM daily)</span>';
    } else if(grandNext){
      nb.innerHTML = '👑 <b style="color:#fbbf24;">GRAND FINAL</b> in '+(hh>0?hh+'h ':'')+mm+'m — the week’s championship. ' +
                     'Top 3 win <b style="color:#fbbf24;">1,200 / 600 / 300</b> pts + the crown ' +
                     '<span style="color:#6b7d90;">(Sunday, 10 PM)</span>';
    } else {
      /* Sep 24 2026: nightlies retired — every scheduled event is now the Sunday Grand Final,
         so this branch reads the same as the one above rather than advertising a dead event. */
      nb.innerHTML = '👑 <b style="color:#fbbf24;">GRAND FINAL</b> in '+(hh>0?hh+'h ':'')+mm+'m — the week’s championship. ' +
                     'Top 3 win <b style="color:#fbbf24;">1,200 / 600 / 300</b> pts + the crown ' +
                     '<span style="color:#6b7d90;">(Sunday, 10 PM)</span>';
    }
  }
  window.tetOpenLadder=function(){
    var m=el('tet-ladder-modal'); if(!m) return;
    renderLadder(); m.style.display='flex';
    // refresh my skill grade from the server
    fetch(APPS_SCRIPT_URL+'?action=tetris_ranking&_='+Date.now()).then(function(r){return r.json();}).then(function(d){
      var me=String(eid()).toLowerCase(); (d&&d.ranking||[]).forEach(function(p){ if(String(p.employee_id||'').toLowerCase()===me && p.skill_level!=null) _mySkill=p.skill_level; });
      if(m.style.display!=='none') renderLadder();
    }).catch(function(){});
  };
})();
