import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Mod = {
  enabled: boolean;
  id: string;
  name: string;
  type: 'web' | 'desktop' | string;
  route: string;
  color?: string;
  healthUrl?: string;
};

type ModConfig = {
  version: string;
  modules: Mod[];
};

export default function Landing() {
  const [mods, setMods] = useState<Mod[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}modules.config.json`)
      .then(r => r.json())
      .then((cfg: ModConfig) => setMods((cfg.modules || []).filter(m => m.enabled)))
      .catch(() => setMods([]));
  }, []);

  return (
    <div style={{padding:'24px 24px 64px'}}>
      <h1 style={{marginBottom: 12}}>Bienvenido</h1>
      <p style={{opacity:.8, marginBottom: 24}}>Selecciona un módulo para abrir su interfaz.</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16}}>
        {mods.map(m => (
          <div key={m.id} style={{border:'1px solid #2b2b2b', borderRadius:12, padding:16, background:'rgba(255,255,255,0.02)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <strong>{m.name}</strong>
              <span style={{fontSize:12, opacity:.7}}>{m.type.toUpperCase()}</span>
            </div>
            <div style={{height:4, background:m.color || '#00F5D4', borderRadius:2, marginBottom:12}}/>
            {m.type === 'web' && m.route && m.route !== 'n/a' ? (
              <Link to={m.route} style={{textDecoration:'none'}}>
                <button style={{padding:'8px 14px', borderRadius:8, cursor:'pointer'}}>Abrir</button>
              </Link>
            ) : (
              <span style={{fontSize:12, opacity:.7}}>No tiene ruta web</span>
            )}
          </div>
        ))}
      </div>
      <p style={{opacity:.6, marginTop:24, fontSize:12}}>Tip: edita <code>public/modules.config.json</code> para sumar módulos.</p>
    </div>
  );
}
