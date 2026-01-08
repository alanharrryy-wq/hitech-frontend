import React from 'react';
import '../styles/olympus.css';

type Props = { title: string; subtitle?: string; children?: React.ReactNode; accent?: string; };

export const OlympusCard: React.FC<Props> = ({title, subtitle, children, accent}) => {
  return (
    <div className="card" style={{borderColor: accent ?? '#334', boxShadow: `0 0 14px ${accent ?? '#223'}55`}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>{title}</h3>
        {subtitle && <span className="badge">{subtitle}</span>}
      </div>
      <div style={{marginTop:10}}>{children}</div>
    </div>
  );
};
