import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { OlympusCard } from '../components/OlympusCard';
import { loadRegistry, ModuleDef } from '../modules.registry';

type Reachability = 'checking' | 'online' | 'offline';
type LogLevel = 'INFO' | 'WARN' | 'ERROR';

type ActivityEvent = {
  id: string;
  ts: number; // epoch ms
  level: LogLevel;
  title: string;
  detail: string;
};


function fmtTime(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function levelBadgeClass(l: LogLevel): string {
  if (l === 'INFO') return 'log-badge info';
  if (l === 'WARN') return 'log-badge warn';
  return 'log-badge err';
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mkEvent(level?: LogLevel): ActivityEvent {
  const now = Date.now();
  const lvl: LogLevel = level ?? pick(['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'] as LogLevel[]);

  const titles: Record<LogLevel, string[]> = {
    INFO: ['Heartbeat OK', 'Sync completed', 'Cache warmed', 'Module ping', 'UI tick'],
    WARN: ['Latency spike', 'Retry scheduled', 'Degraded mode', 'Slow endpoint'],
    ERROR: ['Backend unreachable', 'Auth failed', 'Timeout error', 'Unexpected response'],
  };

  const details: Record<LogLevel, string[]> = {
    INFO: [
      'All systems nominal.',
      'Background refresh succeeded.',
      'No anomalies detected.',
      'Status map updated.',
    ],
    WARN: [
      'Response time above threshold.',
      'Will re-check in next cycle.',
      'Falling back to cached status.',
      'One module is slow to respond.',
    ],
    ERROR: [
      'Request failed. Marking offline.',
      'Endpoint did not respond in time.',
      'Network error while fetching health.',
      'Service returned a non-OK status.',
    ],
  };

  return {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    ts: now,
    level: lvl,
    title: pick(titles[lvl]),
    detail: pick(details[lvl]),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function ping(url: string | undefined, timeoutMs: number = 2300): Promise<'online' | 'offline'> {
  if (!url) return 'offline';

  // Mock support (fast + deterministic for demos)
  if (url === 'mock:ok') return 'online';
  if (url === 'mock:err') return 'offline';

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // cache-bust to avoid stale results
    const sep = url.includes('?') ? '&' : '?';
    const finalUrl = url + sep + 't=' + Date.now().toString();

    const res = await fetch(finalUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'cache-control': 'no-cache' },
    });

    // treat any 2xx as online
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  } finally {
    clearTimeout(t);
  }
}

function statusLabel(s: Reachability): string {
  if (s === 'online') return 'Online';
  if (s === 'offline') return 'Offline';
  return 'Checking…';
}

function statusClass(s: Reachability): string {
  if (s === 'online') return 'badge ok';
  if (s === 'offline') return 'badge err';
  return 'badge wait';
}

export default function ModulesDashboard(): JSX.Element {
  const [mods, setMods] = useState<ModuleDef[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>(() => {
  // start with a few entries
  return [mkEvent('INFO'), mkEvent('INFO'), mkEvent('WARN')].reverse();
});
const [paused, setPaused] = useState<boolean>(false);

const activityTimerRef = useRef<number | null>(null);
const activityWrapRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<Record<string, Reachability>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const refreshTimerRef = useRef<number | null>(null);

  const enabledMods = useMemo(() => mods.filter((m) => (m as any).enabled !== false), [mods]);

  async function refreshStatuses(currentMods: ModuleDef[]): Promise<void> {
    if (!currentMods.length) return;

    // set all to checking first (instant feedback)
    const checking: Record<string, Reachability> = {};
    for (const m of currentMods) checking[m.id] = 'checking';
    setStatus(checking);

    // run in parallel
    const pairs = await Promise.all(
      currentMods.map(async (m) => {
        const s = await ping((m as any).statusUrl || (m as any).healthUrl, 2300);
        return [m.id, s] as const;
      })
    );

    const next: Record<string, Reachability> = {};
    for (const [id, s] of pairs) next[id] = s;
    setStatus(next);
    setLastCheck(Date.now());
  }

  useEffect(() => {
    let alive = true;

    async function boot(): Promise<void> {
      setLoading(true);
      try {
        const list = await loadRegistry();
        if (!alive) return;
        setMods(list || []);
        // first refresh
        await refreshStatuses(list || []);
      } catch {
        if (!alive) return;
        setMods([]);
        setStatus({});
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    boot();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    // auto-refresh every 5 seconds after modules are loaded
    if (!enabledMods.length) return;

    if (refreshTimerRef.current !== null) {
      window.clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    refreshTimerRef.current = window.setInterval(() => {
      refreshStatuses(enabledMods);
    }, 5000);

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
    // enabledMods changes only when registry changes (memo), safe dependency
  }, [enabledMods]);

  const lastCheckText = useMemo(() => {
    if (!lastCheck) return '—';
    const d = new Date(lastCheck);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }, [lastCheck]);

  return (
    <div className="olympus-page">
      <div className="olympus-header">
        <div>
          <h1 className="olympus-title">Modules</h1>
          <p className="olympus-subtitle">
            Dashboard interno (mock-friendly). Estados refrescan cada 5s. Último check: <b>{lastCheckText}</b>
          </p>
        </div>

        <div className="olympus-actions">
          <button
            className="btn"
            onClick={async () => {
              // tiny UX: show quick feedback
              setLoading(true);
              await sleep(120);
              await refreshStatuses(enabledMods);
              setLoading(false);
            }}
          >
            Refresh now
          </button>
        </div>
      </div>

      {loading && (
        <div className="olympus-loading">
          <span className="badge wait">Loading…</span>
        </div>
      )}

      <div className="olympus-grid">
        {enabledMods.map((m) => {
          const s = status[m.id] || 'checking';
          const desc = (m as any).description || '';
          const route = (m as any).route || '/modules';
          const demoUrl = (m as any).demoUrl || '';
          const url = (m as any).url || '';

          return (
            <OlympusCard
              key={m.id}
              title={m.name}
              subtitle={desc}
              accent={(m as any).color || (m as any).accent || '#02A7CA'}
              footer={
                <div className="card-footer">
                  <Link className="btn" to={route}>
                    Abrir
                  </Link>

                  {demoUrl ? (
                    <a className="btn ghost" href={demoUrl} target="_blank" rel="noreferrer">
                      Demo
                    </a>
                  ) : null}

                  {url ? (
                    <a className="btn ghost" href={url} target="_blank" rel="noreferrer">
                      URL
                    </a>
                  ) : null}
                </div>
              }
            />
          );
        })}
      </div>
<div className="live-panel">
  <div className="live-head">
    <div>
      <div className="live-title">Live Activity</div>
      <div className="live-sub">Mock events. No real data. Updates ~every 1.2s.</div>
    </div>

    <div className="live-actions">
      <button className="btn ghost" onClick={() => setPaused((p) => !p)}>
        {paused ? 'Resume' : 'Pause'}
      </button>

      <button className="btn ghost" onClick={() => setActivity([])}>
        Clear
      </button>

      <button
        className="btn"
        onClick={() => setActivity((prev) => [mkEvent('ERROR'), ...prev].slice(0, 18))}
        title="Inject a red event to test visual severity"
      >
        Inject Error
      </button>
    </div>
  </div>

  <div className="live-body" ref={activityWrapRef}>
    {activity.length === 0 ? (
      <div className="live-empty">No events. (Clear + silence vibes)</div>
    ) : (
      activity.map((e) => (
        <div key={e.id} className="live-row">
          <span className={levelBadgeClass(e.level)}>{e.level}</span>
          <span className="live-time">{fmtTime(e.ts)}</span>
          <span className="live-main">
            <b>{e.title}</b>
            <span className="live-detail">{e.detail}</span>
          </span>
        </div>
      ))
    )}
  </div>
</div>

      {/* Minimal CSS fallback (in case olympus.css doesn't define these helpers) */}
      <style>{`
      .live-panel{
  margin-top: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.04);
  border-radius: 16px;
  overflow: hidden;
}

.live-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 14px;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.14);
}

.live-title{
  font-weight: 700;
  letter-spacing: .2px;
}

.live-sub{
  margin-top: 4px;
  opacity: .75;
  font-size: 12px;
}

.live-actions{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content:flex-end;
}

.live-body{
  padding: 10px 12px;
  max-height: 260px;
  overflow:auto;
}

.live-row{
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.03);
  margin-bottom: 8px;
}

.live-row:hover{
  background: rgba(255,255,255,.05);
  border-color: rgba(255,255,255,.10);
}

.log-badge{
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.10);
  min-width: 56px;
  text-align:center;
}

.log-badge.info{
  background: rgba(2,167,202,.10);
  border-color: rgba(2,167,202,.30);
  color: rgba(190,245,255,.95);
}

.log-badge.warn{
  background: rgba(255,200,80,.10);
  border-color: rgba(255,200,80,.35);
  color: rgba(255,235,190,.95);
}

.log-badge.err{
  background: rgba(255,90,120,.10);
  border-color: rgba(255,90,120,.35);
  color: rgba(255,190,200,.95);
}

.live-time{
  font-variant-numeric: tabular-nums;
  opacity: .70;
  min-width: 72px;
}

.live-main{
  display:flex;
  flex-direction:column;
  gap: 2px;
}

.live-detail{
  opacity: .75;
  font-size: 12px;
}

.live-empty{
  padding: 18px;
  opacity: .75;
}

        .olympus-page { padding: 16px; }
        .olympus-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom: 14px; }
        .olympus-title { margin:0; font-size: 22px; }
        .olympus-subtitle { margin:6px 0 0; opacity: .85; }
        .olympus-actions { display:flex; gap:10px; }
        .olympus-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
        .olympus-loading { margin: 10px 0 12px; }

        .badge { display:inline-flex; align-items:center; gap:6px; padding: 4px 10px; border-radius: 999px; font-size: 12px; border: 1px solid rgba(255,255,255,.12); }
        .badge.ok { background: rgba(40, 220, 140, .12); color: rgba(160, 255, 220, .95); border-color: rgba(40, 220, 140, .35); }
        .badge.err { background: rgba(255, 90, 120, .10); color: rgba(255, 190, 200, .95); border-color: rgba(255, 90, 120, .35); }
        .badge.wait { background: rgba(2, 167, 202, .10); color: rgba(190, 245, 255, .95); border-color: rgba(2, 167, 202, .35); }

        .card-footer { display:flex; gap:8px; flex-wrap: wrap; }
        .btn { cursor:pointer; user-select:none; border-radius: 10px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.06); color: inherit; text-decoration:none; display:inline-flex; align-items:center; }
        .btn:hover { background: rgba(255,255,255,.10); border-color: rgba(255,255,255,.16); }
        .btn.ghost { background: transparent; }
      `}</style>
    </div>
  );
}
