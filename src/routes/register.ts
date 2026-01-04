// routes/register.ts — v1.3.1
// Agrega landing (/) y módulo /ares. Ajusta la Nav si tu layout lo usa.
import React from 'react';
import Landing from '../pages/Landing';
import AresPanel from '../pages/AresPanel';

export type RouteDef = { path: string; element: React.ComponentType };
export const extraRoutes: RouteDef[] = [];
export const extraNav: {label: string; to: string}[] = [];

extraRoutes.push({ path: '/', element: Landing });
extraNav.push({ label: 'Inicio', to: '/' });

extraRoutes.push({ path: '/ares', element: AresPanel });
extraNav.push({ label: 'Ares Panel', to: '/ares' });
