import React from 'react';
import type { TacticalIntel } from '../utils/VWarEngine';

interface HUDProps {
  p1Count: number;
  p2Count: number;
  isWar: boolean;
  tacticalIntel?: TacticalIntel;
}

export const HUD = ({ p1Count, p2Count, isWar, tacticalIntel }: HUDProps) => {
  const total = p1Count + p2Count || 52;
  const p1Ratio = (p1Count / total) * 100;
  const modeText = tacticalIntel?.targetCards
    ? `${tacticalIntel.modeLabel} / FIRST TO ${tacticalIntel.targetCards}`
    : tacticalIntel?.modeLabel || 'CLASSIC';
  
  return (
    <div className={`hud-container ${isWar ? 'emergency' : ''}`}>
      <div className="hud-side p1-side">
        <div className={`deck-count ${p1Count > p2Count ? 'advantage' : ''}`}>
          <span className="label">P1 FORCE:</span> {p1Count}
        </div>
      </div>

      <div className="hud-center">
        <div className="power-balance-container">
          <div className="power-bar p1-bar" style={{ width: `${p1Ratio}%` }} />
          <div className="power-bar p2-bar" style={{ width: `${100 - p1Ratio}%` }} />
        </div>
        <div className="status-monitor">
          {isWar ? 'WAR ESCALATION' : p1Count === p2Count ? 'FORCES EQUAL' : p1Count > p2Count ? 'P1 DOMINANCE' : 'P2 DOMINANCE'}
        </div>
        <div className="mode-monitor">{modeText}</div>
      </div>

      <div className="hud-side p2-side">
        <div className={`deck-count ${p2Count > p1Count ? 'advantage' : ''}`}>
          <span className="label">P2 FORCE:</span> {p2Count}
        </div>
      </div>
    </div>
  );
};
