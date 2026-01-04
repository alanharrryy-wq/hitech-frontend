import React from 'react';
import { Link } from 'react-router-dom';

type NavItem = { label: string; to: string };
export interface NavProps { extra?: NavItem[] }

export const NavBar: React.FC<NavProps> = ({ extra }) => {
  return (
    <nav style={{padding:8, background:'#0b0f17', display:'flex', gap:12}}>
      <Link to="/" style={{color:'#e5e7eb'}}>Inicio</Link>
      <Link to="/modules" style={{color:'#00f5d4'}}>Módulos</Link>
      {extra?.map((it, i) => (
        <Link key={i} to={it.to} style={{color:'#9cdcfe'}}>{it.label}</Link>
      ))}
    </nav>
  );
};
