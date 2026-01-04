import Olimpo5 from '../pages/Olimpo5';
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import Home from '../pages/Home';
const ModulesDashboard = React.lazy(() => import('../pages/ModulesDashboard'));
import NotFound from '../pages/NotFound';
import { extraRoutes, extraNav } from './register';

export function AppRouter(){
  return (
    <BrowserRouter>
      <NavBar extra={extraNav}/>
      <Suspense fallback={<div style={{padding:12}}>Cargando…</div>}>
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
    </BrowserRouter>
  );
}


