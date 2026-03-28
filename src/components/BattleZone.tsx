import React from 'react';

export const BattleZone = ({ children }: any) => (
  <div className="battle-zone">
    <div className="battle-field-grid" />
    <div className="battle-zone-content">
      {children}
    </div>
  </div>
);
