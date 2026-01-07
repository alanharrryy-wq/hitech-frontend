import React from 'react';
import { sendToDesktop } from "../hitechBridge";
sendToDesktop("cmd:1:ping");

type Props = {
  title: string;
  subtitle?: string;
  accent?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function OlympusCard({
  title,
  subtitle,
  accent = '#02A7CA',
  children,
  footer,
}: Props): JSX.Element {
  return (
    <div
      className="olympus-card"
      style={{
        borderColor: accent,
        boxShadow: `0 0 0 1px ${accent}33`,
      }}
    >
      <div className="olympus-card-body">
        <h3 className="olympus-card-title">{title}</h3>

        {subtitle ? (
          <p className="olympus-card-subtitle">{subtitle}</p>
        ) : null}

        {children}
      </div>

      {footer ? (
        <div className="olympus-card-footer">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
