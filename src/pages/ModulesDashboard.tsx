import React, {useEffect, useState} from 'react';
import {loadRegistry, ModuleDef} from '../modules.registry';
import {OlympusCard} from '../components/OlympusCard';
import '../styles/olympus.css';

async function ping(url?: string | null): Promise<'ok'|'err'|'na'> {
  if(!url) return 'na';
  if(url.startsWith('mock:')){
    const v = url.slice(5).toLowerCase();
    return v==='ok'?'ok':v==='err'?'err':'na';
  }
  try{
    const res = await fetch(url, {method:'GET'});
    if(!res.ok) return 'err';
    const t = await res.text();
    const ok = t.includes('ok') || t.includes('OK') || t.includes('Ok') || t.includes('"status":"ok"');
    return ok ? 'ok' : 'err';
  }catch{ return 'err'; }
}

export default function ModulesDashboard(){
  const [mods, setMods] = useState<ModuleDef[]>([]);
  const [status, setStatus] = useState<Record<string, 'ok'|'err'|'na'>>({});
  useEffect(()=>{ loadRegistry().then(setMods); }, []);
  useEffect(()=>{
    (async ()=>{
      const s: Record<string, 'ok'|'err'|'na'> = {};
      for(const m of mods){ s[m.id] = await ping(m.statusUrl); }
      setStatus(s);
    })();
  }, [mods]);

  return (
    <div style={{padding:'24px'}}>
      <h1 style={{margin:'10px 0'}}>Módulos — Sharon Olympus</h1>
      <div className="olympus-panel neon">
        <div className="grid">
          {mods.map(m => (
            <OlympusCard key={m.id} title={m.name} subtitle={m.type.toUpperCase()} accent={m.accent}>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <span className={'badge ' + (status[m.id]==='ok'?'ok':status[m.id]==='err'?'err':'') }>
                  {status[m.id]==='ok'?'online':status[m.id]==='err'?'fault':'n/a'}
                </span>
                {m.route && <a className="btn" href={m.route}>Abrir</a>}
              </div>
            </OlympusCard>
          ))}
        </div>
      </div>
      <p style={{opacity:.7, marginTop:12}}>Tip: edita <code>public/modules.config.json</code> para sumar módulos.</p>
    </div>
  );
}
