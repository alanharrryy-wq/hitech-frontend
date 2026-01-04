// Modules UI v2 â€” FAB + Panel con controles de Glow/Color global y por card
const storageKey = 'NFModulesUI_v2_prefs';
function savePrefs(p){ localStorage.setItem(storageKey, JSON.stringify(p)); }
function loadPrefs(){
  try{ return JSON.parse(localStorage.getItem(storageKey) || '{}'); }catch(e){ return {}; }
}

const prefs = Object.assign({ glow: 20, accent:'#8A2BE2', cyan:'#00FFFF', perCard:{} }, loadPrefs());

// FAB & Panel
const btn = document.createElement('button'); btn.id='nf-modules-fab'; btn.textContent='Modules';
const panel = document.createElement('div'); panel.id='nf-modules-panel';
panel.innerHTML=`
  <div class="nf-ctrls">
    <span class="nf-chip">Glow</span>
    <input id="nf-glow" type="range" min="0" max="40" step="1" value="${prefs.glow}"/>
    <span class="nf-chip">Accent</span>
    <input id="nf-accent" type="color" value="${prefs.accent}"/>
    <span class="nf-chip">Cyan</span>
    <input id="nf-cyan" type="color" value="${prefs.cyan}"/>
  </div>
  <div class="nf-grid" id="nf-grid"></div>
`;
document.body.appendChild(btn); document.body.appendChild(panel);
btn.addEventListener('click', ()=>{ panel.style.display = (panel.style.display==='none'||!panel.style.display)?'block':'none'; });

function applyGlobals(){
  document.documentElement.style.setProperty('--nf-glow', prefs.glow);
  document.documentElement.style.setProperty('--nf-accent', prefs.accent);
  document.documentElement.style.setProperty('--nf-cyan', prefs.cyan);
}
applyGlobals();

document.addEventListener('input', (e)=>{
  if(e.target && e.target.id==='nf-glow'){ prefs.glow = parseInt(e.target.value||'20',10); applyGlobals(); savePrefs(prefs); }
  if(e.target && e.target.id==='nf-accent'){ prefs.accent = e.target.value; applyGlobals(); savePrefs(prefs); }
  if(e.target && e.target.id==='nf-cyan'){ prefs.cyan = e.target.value; applyGlobals(); savePrefs(prefs); }
});

async function loadConfig(){
  try{
    const res = await fetch('/modules.config.json', {cache:'no-store'});
    const cfg = await res.json();
    const grid = document.getElementById('nf-grid'); grid.innerHTML='';
    const perCard = prefs.perCard || {};
    for(const m of (cfg.modules||[])){
      if(!m.enabled) continue;
      const card = document.createElement('div'); card.className='nf-card';
      const cid = m.id || m.name;
      const customColor = perCard[cid] || m.color || '#8A2BE2';
      card.style.boxShadow = `0 0 ${prefs.glow}px ${customColor}55`;

      const title = document.createElement('div'); title.className='nf-title';
      title.innerHTML = `<span>${m.name}</span>`;
      const colorPick = document.createElement('input'); colorPick.type='color'; colorPick.value = customColor;
      colorPick.title = 'Color por mÃ³dulo';
      colorPick.addEventListener('input', ()=>{ 
        perCard[cid] = colorPick.value; card.style.boxShadow = `0 0 ${prefs.glow}px ${colorPick.value}55`; 
        prefs.perCard = perCard; savePrefs(prefs);
      });
      title.appendChild(colorPick);

      const health = document.createElement('div'); health.className='nf-health'; health.textContent='checking...';
      if(m.healthUrl){
        fetch(m.healthUrl).then(r=> r.ok ? r.json():{}).then(j=>{
          health.textContent = (j.status==='ok'?'online':'fault');
          health.classList.add(j.status==='ok'?'ok':'fail');
        }).catch(_=>{ health.textContent='fault'; health.classList.add('fail'); });
      } else { health.textContent='n/a'; health.classList.add('fail'); }

      const actions = document.createElement('div'); actions.className='nf-actions';
      if(m.type==='web' && m.route){ const a = document.createElement('a'); a.href=m.route; a.textContent='Abrir'; a.target='_blank'; actions.appendChild(a); }

      card.appendChild(title); card.appendChild(health); card.appendChild(actions);
      grid.appendChild(card);
    }
    console.log('[ModulesUI v2] Loaded', cfg.versionCatalog||{});
  }catch(e){ console.warn('[ModulesUI v2] config error', e); }
}
loadConfig();
