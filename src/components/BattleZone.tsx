import React from 'react';

interface BattleZoneProps {
  children: React.ReactNode;
}

export const BattleZone = ({ children }: BattleZoneProps) => (
  <div className="battle-zone">
    <div className="battle-field-grid" />
    <div className="battle-zone-content">
      {children}
    </div>
  </div>
);
