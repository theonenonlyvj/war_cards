import React from 'react';

export const HUD = ({ p1Count, p2Count, isWar }: any) => (
  <div className={`hud-container ${isWar ? 'emergency' : ''}`}>
    <div className="p1-deck">CARDS: {p1Count}</div>
    <div className="status-monitor">{isWar ? 'EMERGENCY: WAR DETECTED' : 'SYSTEMS NOMINAL'}</div>
    <div className="p2-deck">CARDS: {p2Count}</div>
  </div>
);
