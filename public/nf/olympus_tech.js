
// Olympus Tech minimal controls v1.1.0
(function(){
  const LOG_TAG='[NF Olympus Tech]';
  function ready(fn){ document.readyState!='loading'?fn():document.addEventListener('DOMContentLoaded',fn); }
  ready(()=>{
    try{
      // Add FAB
      if(!document.getElementById('nf-olympus-tech-btn')){
        const b=document.createElement('button');
        b.id='nf-olympus-tech-btn'; b.title='Olympus Tech Controls';
        document.body.appendChild(b);
        b.addEventListener('click',()=>{
          const p=document.getElementById('nf-olympus-tech-panel');
          if(p) p.style.display = (p.style.display==='none'||!p.style.display)?'block':'none';
        });
      }
      // Add panel
      if(!document.getElementById('nf-olympus-tech-panel')){
        const p=document.createElement('div'); p.id='nf-olympus-tech-panel';
        p.innerHTML=`<h3>Clean & Neon — Olympus Tech</h3>
          <div class="row"><label>Intensidad</label><input id="nf-intensity" type="range" min="0" max="1" step="0.01" value="0.6"></div>
          <div class="row"><label>Color</label>
            <select id="nf-color">
              <option value="#8A2BE2">Purple</option>
              <option value="#00E5FF">Cyan</option>
              <option value="#59FFA1">Green Neon</option>
            </select>
          </div>
          <div class="row"><label>Overlay</label><input id="nf-overlay" type="range" min="0" max="0.8" step="0.01" value="0.25"></div>
          <div style="font-size:11px;opacity:.65;margin-top:8px">v1.1.0 — Vars globales: --nf-glow-color-main, --nf-glow-intensity, --nf-overlay-alpha</div>`;
        document.body.appendChild(p);
        const root = document.documentElement;
        const i = p.querySelector('#nf-intensity');
        const c = p.querySelector('#nf-color');
        const o = p.querySelector('#nf-overlay');
        const apply = ()=>{
          root.style.setProperty('--nf-glow-intensity', i.value);
          root.style.setProperty('--nf-glow-color-main', c.value);
          root.style.setProperty('--nf-overlay-alpha', o.value);
        };
        i.addEventListener('input', apply);
        c.addEventListener('change', apply);
        o.addEventListener('input', apply);
        apply();
      }
      console.log(LOG_TAG,'Controls loaded.');
    }catch(e){ console.error(LOG_TAG,'Init error', e); }
  });
})();
