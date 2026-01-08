import React, { Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import { NavBar } from "../components/NavBar";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import Olimpo5 from "../pages/Olimpo5";
import AresPanel from "../pages/AresPanel";

import { extraRoutes, extraNav } from "./register";

const ModulesDashboard = React.lazy(() => import("../pages/ModulesDashboard"));

export function AppRouter() {
  return (
    <HashRouter>
      <NavBar extra={extraNav} />
      <Suspense fallback={<div style={{ padding: 12 }}>Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/modules" element={<ModulesDashboard />} />
          <Route path="/ares" element={<AresPanel />} />
          <Route path="/olimpo5" element={<Olimpo5 />} />

          {extraRoutes.map((r, idx) => (
            <Route key={idx} path={r.path} element={<r.element />} />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
