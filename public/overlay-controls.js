(function(){
  const LS_POS_KEY='mods-fab-pos-v140'; const LS_GLOW_KEY='ui-glow-v140';
  function setBrightness(v){ const c=Math.min(1.5,Math.max(0.6,v)); document.documentElement.style.setProperty('--ui-brightness',String(c)); try{localStorage.setItem(LS_GLOW_KEY,String(c));}catch{} }
  function getBrightness(){ try{ const v=parseFloat(localStorage.getItem(LS_GLOW_KEY)||'1'); if(!isFinite(v)) return 1; return Math.min(1.5,Math.max(0.6,v)); }catch{return 1;} }
  function ensureFab(){
    let fab=document.querySelector('#mods-fab, .mods-fab, [data-mods-fab]');
    if(!fab){ fab=document.createElement('div'); fab.id='mods-fab'; fab.innerHTML='<span class="dot"></span><strong>Mods</strong>'; document.body.appendChild(fab); }
    fab.addEventListener('click',(ev)=>{ try{ if(window.location && window.location.pathname!=='/modules'){ window.history.pushState({},'', '/modules'); window.dispatchEvent(new PopStateEvent('popstate')); } else { window.location.assign('/modules'); } }catch{ window.location.href='/modules'; } });
    let sx=0,sy=0,bx=0,by=0,drag=false;
    const onMove=(e)=>{ if(!drag) return; const x=(e.touches?e.touches[0].clientX:e.clientX); const y=(e.touches?e.touches[0].clientY:e.clientY); const nx=bx+(x-sx); const ny=by+(y-sy); fab.style.right='auto'; fab.style.bottom='auto'; fab.style.left=Math.max(8,nx)+'px'; fab.style.top=Math.max(8,ny)+'px'; };
    const onUp=()=>{ if(!drag) return; drag=false; document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); document.removeEventListener('touchmove',onMove); document.removeEventListener('touchend',onUp); try{ const r=fab.getBoundingClientRect(); localStorage.setItem(LS_POS_KEY, JSON.stringify({x:r.left,y:r.top})); }catch{} fab.style.cursor='grab'; };
    const onDown=(e)=>{ drag=true; fab.style.cursor='grabbing'; sx=(e.touches?e.touches[0].clientX:e.clientX); sy=(e.touches?e.touches[0].clientY:e.clientY); const r=fab.getBoundingClientRect(); bx=r.left; by=r.top; document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp); document.addEventListener('touchmove',onMove,{passive:false}); document.addEventListener('touchend',onUp); e.preventDefault(); e.stopPropagation(); };
    fab.addEventListener('mousedown',onDown); fab.addEventListener('touchstart',onDown,{passive:false});
    try{ const raw=localStorage.getItem(LS_POS_KEY); if(raw){ const p=JSON.parse(raw); fab.style.left=(p.x||24)+'px'; fab.style.top=(p.y||24)+'px'; fab.style.right='auto'; fab.style.bottom='auto'; } }catch{}
    return fab;
  }
  function addGlowSliderIntoOverlay(){
    const containers=Array.from(document.querySelectorAll('.nf-overlay, .olympus-overlay, [data-olympus-overlay], [data-nf-overlay], div[class*="overlay"]'));
    let overlay=containers.find(el=>/clean\s*&\s*neon|olympus/i.test(el.textContent||'')) || containers[0];
    if(!overlay){ overlay=document.createElement('div'); overlay.className='olympus-overlay'; Object.assign(overlay.style,{position:'fixed',right:'24px',bottom:'var(--nf-safe-corner)',zIndex:1000,padding:'14px 16px',border:'1px solid rgba(255,255,255,.15)',borderRadius:'12px',background:'rgba(10,15,20,.6)',backdropFilter:'blur(6px)'}); overlay.innerHTML='<strong style="display:block;margin-bottom:8px;">Clean & Neon — Olympus Tech</strong>'; document.body.appendChild(overlay); }
    if(overlay.querySelector('[data-glow-slider]')) return;
    const wrap=document.createElement('div'); wrap.style.marginTop='8px'; wrap.innerHTML='<label style="display:block;font-size:12px;opacity:.9;margin-bottom:6px;">Glow</label><input data-glow-slider type="range" min="0.6" max="1.5" step="0.01" style="width:100%"/>';
    overlay.appendChild(wrap);
    const slider=wrap.querySelector('input[type="range"]'); const init=getBrightness(); slider.value=String(init); setBrightness(init); slider.addEventListener('input',()=>{ const v=parseFloat(slider.value||'1'); setBrightness(v); });
  }
  function hideAccentCyanToolbar(){
    const nodes=Array.from(document.querySelectorAll('div,section,nav')); const el=nodes.find(n=>{ const t=(n.textContent||'').toLowerCase(); return t.includes('accent') && t.includes('cyan') && n.querySelector('input[type="color"]'); }); if(el){ el.classList.add('accent-cyan-toolbar'); }
  }
  function bootstrap(){ hideAccentCyanToolbar(); ensureFab(); addGlowSliderIntoOverlay(); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bootstrap); } else { bootstrap(); }
})();