import React from 'react';
import { Link } from 'react-router-dom';

export default function Home(){
  return (
    <div style={{padding:24}}>
      <h2>Bienvenido</h2>
      <p>Este es el Home base. Ve a <Link to="/modules">/modules</Link> para ver el panel de módulos.</p>
    </div>
  );
}
