import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Olimpo5 from './pages/Olimpo5';
import { extraNav, extraRoutes } from './routes/register';
import './styles/overlay-fix.css';

const ModulesDashboard = React.lazy(() => import('./pages/ModulesDashboard'));

const isPagesDeploy = import.meta.env.MODE === 'production' && import.meta.env.PAGES_DEPLOY === 'true';

function RouterShell(){
  const Router = isPagesDeploy ? HashRouter : BrowserRouter; // HashRouter avoids GitHub Pages SPA refresh 404s.
  return (
    <Router>
      <NavBar extra={extraNav}/>
      <Suspense fallback={<div style={{padding:12}}>Cargando.</div>}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/modules" element={<ModulesDashboard/>} />
          {extraRoutes.map((r, idx) => (
            <Route key={idx} path={r.path} element={<r.element/>} />
          ))}
          <Route path="*" element={<NotFound/>} />
          <Route path="/olimpo5" element={<Olimpo5/>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterShell />
  </React.StrictMode>
);

