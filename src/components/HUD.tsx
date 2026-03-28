import React from 'react';

interface HUDProps {
  p1Count: number;
  p2Count: number;
  isWar: boolean;
}

export const HUD = ({ p1Count, p2Count, isWar }: HUDProps) => (
  <div className={`hud-container ${isWar ? 'emergency' : ''}`}>
    <div className="p1-deck">CARDS: {p1Count}</div>
    <div className="status-monitor">{isWar ? 'EMERGENCY: WAR DETECTED' : 'SYSTEMS NOMINAL'}</div>
    <div className="p2-deck">CARDS: {p2Count}</div>
  </div>
);
