import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Olimpo5 from './pages/Olimpo5';
import { extraNav, extraRoutes } from './routes/register';
import './styles/overlay-fix.css';

import { initHitechBridge, setDesktopHandler, sendToDesktop } from "./hitechBridge";

setDesktopHandler((type, payload) => {
  console.log("[DesktopEvent]", type, payload);
});

initHitechBridge();

window.addEventListener("hitech:desktop-connected", () => {
  console.log("✅ Desktop connected (front)");
  sendToDesktop("cmd:1:ping");
}, { once: true });

const ModulesDashboard = React.lazy(() => import('./pages/ModulesDashboard'));
const isPagesDeploy =
  import.meta.env.MODE === 'production' && (import.meta.env as any).PAGES_DEPLOY === 'true';

function RouterShell() {
  const Router = isPagesDeploy ? HashRouter : BrowserRouter;
  return (
    <Router>
      <NavBar extra={extraNav} />
      <Suspense fallback={<div style={{ padding: 12 }}>Cargando.</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/modules" element={<ModulesDashboard />} />
          {extraRoutes.map((r, idx) => (
            <Route key={idx} path={r.path} element={<r.element />} />
          ))}
          <Route path="/olimpo5" element={<Olimpo5 />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

const rootEl = document.getElementById('root')!;
const ww: any = window as any;
if (!ww.__REACT_ROOT__) ww.__REACT_ROOT__ = ReactDOM.createRoot(rootEl);
ww.__REACT_ROOT__.render(
  <React.StrictMode>
    <RouterShell />
  </React.StrictMode>
);


