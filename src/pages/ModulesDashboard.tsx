import React, {useEffect, useRef, useState} from 'react';
import {loadRegistry, ModuleDef} from '../modules.registry';
import {OlympusCard} from '../components/OlympusCard';
import '../styles/olympus.css';

type HealthState = 'checking' | 'online' | 'offline' | 'unknown';

type HealthRecord = {
  state: HealthState;
  detail?: string;
  httpStatus?: number;
  checkedAt?: number;
};

const HEALTH_TIMEOUT_MS = 2000;
const MAX_CONCURRENCY = 2;
const healthCache = new Map<string, HealthRecord>();

function cacheKey(m: ModuleDef) {
  return `${m.id}|${m.statusUrl ?? ''}`;
}

function looksOk(body: string) {
  return body.includes('ok') || body.includes('OK') || body.includes('Ok') || body.includes('"status":"ok"');
}

async function pingOnce(url: string, timeoutMs: number): Promise<{ record: HealthRecord; timedOut?: boolean; isSameOrigin: boolean }> {
  const origin = new URL(url, window.location.href).origin;
  const isSameOrigin = origin === window.location.origin;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store', signal: controller.signal });
    const checkedAt = Date.now();
    if (!res.ok) {
      return { record: { state: 'offline', detail: `HTTP ${res.status}`, httpStatus: res.status, checkedAt }, isSameOrigin };
    }
    let body = '';
    try { body = await res.text(); } catch { body = ''; }
    if (body && !looksOk(body)) {
      return { record: { state: 'offline', detail: 'response not ok', httpStatus: res.status, checkedAt }, isSameOrigin };
    }
    return { record: { state: 'online', detail: `HTTP ${res.status}`, httpStatus: res.status, checkedAt }, isSameOrigin };
  } catch (err) {
    const checkedAt = Date.now();
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError') {
      return {
        record: { state: isSameOrigin ? 'offline' : 'unknown', detail: 'timeout', checkedAt },
        timedOut: true,
        isSameOrigin,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    const isCorsLike = /Failed to fetch|CORS|NetworkError|cross-origin|blocked/i.test(message);
    if (!isSameOrigin && isCorsLike) {
      return { record: { state: 'unknown', detail: message || 'cors/blocked', checkedAt }, isSameOrigin };
    }
    if (!isSameOrigin) {
      return { record: { state: 'unknown', detail: message || 'unknown error', checkedAt }, isSameOrigin };
    }
    return { record: { state: 'offline', detail: message || 'network error', checkedAt }, isSameOrigin };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkStatus(url: string, timeoutMs: number): Promise<HealthRecord> {
  const first = await pingOnce(url, timeoutMs);
  if (first.timedOut && first.isSameOrigin) {
    const second = await pingOnce(url, timeoutMs);
    return second.record;
  }
  return first.record;
}

function formatTime(ts?: number) {
  return ts ? new Date(ts).toLocaleTimeString() : '—';
}

function badgeTitle(record?: HealthRecord) {
  const time = formatTime(record?.checkedAt);
  const reason = record?.detail ?? (record?.state === 'checking' ? 'checking' : '—');
  return `Last check: ${time}
Reason: ${reason}`;
}

export default function ModulesDashboard(){
  const [mods, setMods] = useState<ModuleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Record<string, HealthRecord>>({});
  const [checkNonce, setCheckNonce] = useState(0);
  const runIdRef = useRef(0);
  const modulesConfigUrl = `${import.meta.env.BASE_URL}modules.config.json`;

  useEffect(()=>{
    let active = true;
    setLoading(true);
    setError(null);
    loadRegistry({ strict: true })
      .then((list) => {
        if (!active) return;
        setMods(list);
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

  useEffect(() => {
    if (!mods.length) { setHealth({}); return; }
    runIdRef.current += 1;
    const runId = runIdRef.current;
    let active = true;
    const queue: ModuleDef[] = [];
    const next: Record<string, HealthRecord> = {};

    for (const m of mods) {
      const key = cacheKey(m);
      if (!m.statusUrl) {
        const record = { state: 'unknown', detail: 'no statusUrl', checkedAt: Date.now() } as HealthRecord;
        next[m.id] = record;
        healthCache.set(key, record);
        continue;
      }
      const cached = healthCache.get(key);
      if (cached) {
        next[m.id] = cached;
        continue;
      }
      next[m.id] = { state: 'checking' };
      queue.push(m);
    }

    setHealth(next);
    if (!queue.length) return () => { active = false; };

    let i = 0;
    const workers = Array.from({ length: MAX_CONCURRENCY }, async () => {
      while (i < queue.length) {
        const m = queue[i++];
        if (!m.statusUrl) continue;
        const record = await checkStatus(m.statusUrl, HEALTH_TIMEOUT_MS);
        if (!active || runIdRef.current !== runId) return;
        healthCache.set(cacheKey(m), record);
        setHealth((prev) => ({ ...prev, [m.id]: record }));
      }
    });

    Promise.all(workers).catch(() => {});
    return () => { active = false; };
  }, [mods, checkNonce]);

  const handleRecheck = () => {
    healthCache.clear();
    setCheckNonce((n) => n + 1);
  };

  return (
    <div style={{padding:'24px'}}>
      <div style={{maxWidth:1200, margin:'0 auto'}}>
        <h1 style={{margin:'10px 0 6px'}}>Módulos - Sharon Olympus</h1>
        <p style={{opacity:.75, margin:'0 0 12px'}}>Panel de módulos activos y su estado actual.</p>
        <div style={{display:'flex', gap:12, margin:'0 0 16px'}}>
          <button type="button" className="btn" onClick={handleRecheck}>Re-check statuses</button>
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
          <div className="olympus-panel neon">
            <div className="grid">
              {mods.map(m => {
                const record = health[m.id];
                const state = record?.state ?? 'unknown';
                const badgeClass = state === 'online'
                  ? 'badge ok'
                  : state === 'offline'
                    ? 'badge err'
                    : state === 'checking'
                      ? 'badge checking'
                      : 'badge unknown';
                const badgeText = state === 'checking' ? 'checking...' : state;
                return (
                  <OlympusCard key={m.id} title={m.name} subtitle={m.type.toUpperCase()} accent={m.accent} description={m.description}>
                    <div className="card-actions">
                      <span className={badgeClass} title={badgeTitle(record)}>{badgeText}</span>
                      {m.route && <a className="btn" href={m.route}>Abrir</a>}
                    </div>
                  </OlympusCard>
                );
              })}
            </div>
          </div>
        )}

        <p style={{opacity:.7, marginTop:12}}>Tip: edita <code>public/modules.config.json</code> para sumar módulos.</p>
      </div>
    </div>
  );
}
