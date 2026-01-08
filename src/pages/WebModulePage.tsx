import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadRegistry, ModuleDef } from '../modules.registry';

type Reachability = 'checking' | 'online' | 'offline';

function toAbsUrl(input: string | undefined | null): string | null {
  if (!input) return null;

  // Already absolute (http/https)
  if (/^https?:\/\//i.test(input)) return input;

  // Base path aware for GitHub Pages Project Pages (e.g. /hitech-frontend/)
  const base = import.meta.env.BASE_URL || '/';

  // If someone accidentally puts leading slash, treat it as root-relative and still base it correctly.
  const cleaned = input.startsWith('/') ? input.slice(1) : input;

  // Ensure base ends with /
  const baseNormalized = base.endsWith('/') ? base : `${base}/`;

  return `${baseNormalized}${cleaned}`;
}

async function checkReachable(url: string, timeoutMs = 2500): Promise<'online' | 'offline'> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Using no-cors makes this usable against localhost backends without CORS enabled.
    // We treat "fetch resolved" as online; offline/blocked will throw.
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
    return 'online';
  } catch {
    return 'offline';
  } finally {
    clearTimeout(timeout);
  }
}

export default function WebModulePage() {
  const location = useLocation();

  // Hooks MUST be unconditional and always in same order
  const [mod, setMod] = useState<ModuleDef | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reachability, setReachability] = useState<Reachability>('checking');
  const [forcePanel, setForcePanel] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);

    loadRegistry().then((list) => {
      if (!active) return;
      const found = list.find((m) => m.route === location.pathname) || null;
      setMod(found);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    if (!mod?.url) {
      setReachability('offline');
      return () => {
        active = false;
      };
    }

    setReachability('checking');
    checkReachable(mod.url).then((status) => {
      if (active) setReachability(status);
    });

    return () => {
      active = false;
    };
  }, [mod?.url]);

  // ----- Render (returns AFTER hooks) -----

  if (!loaded) {
    return <div style={{ padding: 24 }}>Loading module...</div>;
  }

  if (!mod) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Module not found</h2>
        <p>
          No module matches route <code>{location.pathname}</code>.
        </p>
      </div>
    );
  }

  const statusMeta: Record<Reachability, { label: string; color: string; bg: string; border: string }> = {
    checking: {
      label: 'checking',
      color: '#b45309',
      bg: 'rgba(180,83,9,0.12)',
      border: '1px solid rgba(180,83,9,0.35)',
    },
    online: {
      label: 'online',
      color: '#15803d',
      bg: 'rgba(21,128,61,0.12)',
      border: '1px solid rgba(21,128,61,0.35)',
    },
    offline: {
      label: 'offline',
      color: '#b91c1c',
      bg: 'rgba(185,28,28,0.12)',
      border: '1px solid rgba(185,28,28,0.35)',
    },
  };

  const status = statusMeta[reachability];

  const localUrl = toAbsUrl(mod.url);     // remains absolute if http(s)
  const demoUrl = toAbsUrl(mod.demoUrl);  // base-path aware for GH Pages

  // DEMO-FIRST embed URL decision (no hooks):
  // - If local backend is online, embed mod.url
  // - Otherwise, embed mod.demoUrl (if present)
  // - If renderMode is 'tab', do not embed
  const embedUrl =
    (mod.renderMode !== 'tab' && localUrl && reachability === 'online')
      ? localUrl
      : (mod.renderMode !== 'tab' && demoUrl)
        ? demoUrl
        : null;

  const showPanel = !embedUrl || mod.renderMode === 'tab' || forcePanel;

  const panelStyle: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.18)',
    borderRadius: 12,
    padding: 20,
    background: 'rgba(0,0,0,0.02)',
  };

  const actionLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid rgba(0,0,0,0.2)',
    textDecoration: 'none',
    color: '#0f70c0',
  };

  const actionButtonStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid rgba(0,0,0,0.2)',
    background: 'transparent',
    cursor: 'pointer',
  };

  if (showPanel) {
    return (
      <div style={{ padding: 24 }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{mod.name}</h2>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                fontSize: 12,
                color: status.color,
                background: status.bg,
                border: status.border,
              }}
            >
              {status.label}
            </span>
          </div>

          {mod.description ? <p style={{ margin: '10px 0 0', opacity: 0.8 }}>{mod.description}</p> : null}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {localUrl ? (
              <a href={localUrl} target="_blank" rel="noreferrer" style={actionLinkStyle}>
                Open local
              </a>
            ) : null}
            {demoUrl ? (
              <a href={demoUrl} target="_blank" rel="noreferrer" style={actionLinkStyle}>
                Open demo
              </a>
            ) : null}
            {embedUrl && forcePanel ? (
              <button type="button" onClick={() => setForcePanel(false)} style={actionButtonStyle}>
                View embedded
              </button>
            ) : null}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>Run locally: RUN_Local.ps1</div>
        </div>
      </div>
    );
  }

  // Embedded iframe view
  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 8px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>{mod.name}</h2>
        {embedUrl ? (
          <a href={embedUrl} target="_blank" rel="noreferrer" style={actionLinkStyle}>
            Open in new tab
          </a>
        ) : null}
        <button type="button" onClick={() => setForcePanel(true)} style={actionButtonStyle}>
          View panel
        </button>
      </div>

      <div style={{ padding: '0 12px 8px', fontSize: 12, opacity: 0.7 }}>
        If the site blocks iframes (CSP/X-Frame-Options), use Open in new tab.
      </div>

      <div style={{ height: 'calc(100vh - 160px)' }}>
        <iframe
          title={mod.name}
          src={embedUrl || ''}
          style={{ width: '100%', height: '100%', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 8 }}
        />
      </div>
    </div>
  );
}
