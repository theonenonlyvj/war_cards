import React, { useState } from 'react';
import { HUD } from './components/HUD';
import { Card } from './components/Card';
import { BattleZone } from './components/BattleZone';

const App = () => {
  // Mock state for now
  const [p1Count, setP1Count] = useState(26);
  const [p2Count, setP2Count] = useState(26);
  const [isWar, setIsWar] = useState(false);

  return (
    <div className="command-center">
      <HUD p1Count={p1Count} p2Count={p2Count} isWar={isWar} />
      
      <main className="main-display">
        <BattleZone>
          {/* Example card */}
          <Card value="A" suit="S" isFaceUp={true} />
        </BattleZone>
      </main>

      <div className="terminal-overlay">
        <p>&gt; INITIALIZING VWAR OS...</p>
        <p>&gt; ESTABLISHING SECURE CONNECTION...</p>
        <p>&gt; READY COMMANDER.</p>
      </div>
    </div>
  );
};

export default App;
