import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OlympusCard } from '../components/OlympusCard';

type Mod = {
  enabled: boolean;
  id: string;
  name: string;
  type: 'web' | 'desktop' | string;
  route: string;
  color?: string;
  description?: string;
  healthUrl?: string;
};

type ModConfig = {
  version: string;
  modules: Mod[];
};

export default function Landing() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`${import.meta.env.BASE_URL}modules.config.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((cfg: ModConfig) => {
        if (!active) return;
        setMods((cfg.modules || []).filter(m => m.enabled));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setMods([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const modulesConfigUrl = `${import.meta.env.BASE_URL}modules.config.json`;

  return (
    <div style={{padding:'24px 24px 64px'}}>
      <div style={{maxWidth:1200, margin:'0 auto'}}>
        <h1 style={{marginBottom: 8}}>Bienvenido</h1>
        <p style={{opacity:.8, marginBottom: 12}}>Selecciona un módulo para abrir su interfaz.</p>
        <div style={{display:'flex', gap:12, margin:'0 0 20px'}}>
          <Link to="/modules" className="btn">Ver módulos</Link>
        </div>

        {loading && (
          <p style={{opacity:.8, marginBottom: 12}}>Cargando módulos...</p>
        )}

        {error && (
          <div style={{border:'1px solid #2b2b2b', borderRadius:12, padding:12, background:'rgba(255,255,255,0.02)', marginBottom:16}}>
            <div style={{fontWeight:600, marginBottom:6}}>
              No se pudo cargar modules.config.json. Verifica la ruta, GitHub Pages base-path, o si estás en local corre RUN_Local.ps1.
            </div>
            <details>
              <summary style={{cursor:'pointer'}}>Detalles</summary>
              <div style={{fontSize:12, opacity:.7, marginTop:6}}>{error}</div>
            </details>
          </div>
        )}

        {!loading && !error && mods.length === 0 && (
          <div style={{border:'1px solid #2b2b2b', borderRadius:12, padding:12, background:'rgba(255,255,255,0.02)', marginBottom:16}}>
            <div style={{marginBottom:8}}>No hay módulos habilitados.</div>
            <a className="btn" href={modulesConfigUrl}>Editar modules.config.json</a>
          </div>
        )}

        {!loading && !error && mods.length > 0 && (
          <div className="grid">
            {mods.map(m => (
              <OlympusCard key={m.id} title={m.name} subtitle={m.type.toUpperCase()} accent={m.color} description={m.description}>
                <div className="card-actions">
                  {m.type === 'web' && m.route && m.route !== 'n/a' ? (
                    <Link to={m.route} className="btn">Abrir</Link>
                  ) : (
                    <span className="card-muted">No tiene ruta web</span>
                  )}
                </div>
              </OlympusCard>
            ))}
          </div>
        )}

        <p style={{opacity:.6, marginTop:24, fontSize:12}}>Tip: edita <code>public/modules.config.json</code> para sumar módulos.</p>
      </div>
    </div>
  );
}
