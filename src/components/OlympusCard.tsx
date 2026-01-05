import React from 'react';
import '../styles/olympus.css';

type Props = {
  title: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  accent?: string;
};

export const OlympusCard: React.FC<Props> = ({title, subtitle, description, children, accent}) => {
  return (
    <div className="card" style={{borderColor: accent ?? '#334', boxShadow: `0 0 14px ${accent ?? '#223'}55`}}>
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
        {subtitle && <span className="badge">{subtitle}</span>}
      </div>
      {description && <p className="card-desc" title={description}>{description}</p>}
      {children && <div className="card-body">{children}</div>}
    </div>
  );
};
