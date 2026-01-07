type DesktopHandler = (type: string, payload: string) => void;

type BridgeState = {
  inited: boolean;
  wired: boolean;
  hitech: any | null;
  pending: string[];
  handler: DesktopHandler | null;
  warnedQueue: boolean;
};

const w: any = window as any;

// Persist across HMR reloads
const state: BridgeState =
  w.__HITECH_BRIDGE_STATE__ ??
  (w.__HITECH_BRIDGE_STATE__ = {
    inited: false,
    wired: false,
    hitech: null,
    pending: [],
    handler: null,
    warnedQueue: false,
  });

export function setDesktopHandler(fn: DesktopHandler) {
  state.handler = fn;
}

export function isDesktopConnected(): boolean {
  return !!(state.hitech && typeof state.hitech.receive === "function");
}

function getWindowHitech(): any | null {
  const obj = w.hitech;
  if (obj && typeof obj.receive === "function") return obj;
  return null;
}

function wireSignals(obj: any) {
  if (state.wired) return;
  state.wired = true;

  if (obj.desktopEvent && typeof obj.desktopEvent.connect === "function") {
    obj.desktopEvent.connect((type: string, payload: string) => {
      console.log("[Bridge RX]", type, payload);
      state.handler?.(type, payload);
    });
    console.log("[Bridge] desktopEvent wired ✅");
  } else {
    console.warn("[Bridge] window.hitech.desktopEvent missing (no signal?)");
  }
}

function markConnected() {
  if (!w.__HITECH_DESKTOP__) {
    w.__HITECH_DESKTOP__ = true;
    console.log("[Bridge] Connected ✅ (bound to window.hitech)");
    window.dispatchEvent(new CustomEvent("hitech:desktop-connected"));
  }
}

function flushPending() {
  if (!state.hitech) return;
  if (!state.pending.length) return;

  const q = state.pending.splice(0, state.pending.length);
  for (const cmd of q) {
    try {
      state.hitech.receive(cmd);
    } catch (e) {
      console.warn("[Bridge] Failed to send queued cmd", cmd, e);
    }
  }
}

function tryBindNow(): boolean {
  const obj = getWindowHitech();
  if (!obj) return false;

  state.hitech = obj;
  wireSignals(obj);
  markConnected();
  flushPending();
  return true;
}

export function initHitechBridge(opts?: { timeoutMs?: number; intervalMs?: number }) {
  if (state.inited) return;
  state.inited = true;

  // Try immediately (many times window.hitech already exists)
  if (tryBindNow()) return;

  // Listen for Desktop autobind event (fired by injected script)
  window.addEventListener(
    "hitech:webchannel-ready",
    () => {
      tryBindNow();
    },
    { once: false }
  );

  // Poll briefly to survive timing/HMR
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const intervalMs = opts?.intervalMs ?? 150;

  const start = Date.now();
  const t = window.setInterval(() => {
    if (tryBindNow()) {
      window.clearInterval(t);
      return;
    }

    if (Date.now() - start > timeoutMs) {
      window.clearInterval(t);
      console.warn("[Bridge] Not in Desktop Shell (no window.hitech)");
    }
  }, intervalMs);
}

export function sendToDesktop(cmd: string) {
  // Try bind first
  if (!state.hitech) {
    tryBindNow();
  }

  if (!state.hitech) {
    // Queue it (don’t spam)
    state.pending.push(cmd);
    if (!state.warnedQueue) {
      state.warnedQueue = true;
      console.warn("[Bridge] Desktop not connected yet. Queued commands…");
    }
    return;
  }

  state.hitech.receive(cmd);
}
