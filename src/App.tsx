import React, { useState, useEffect } from 'react';
import { HUD } from './components/HUD';
import { Card } from './components/Card';
import { BattleZone } from './components/BattleZone';
import { useWarGame } from './hooks/useWarGame';
import { FXLayer } from './components/FXLayer';

const App = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState('');
  const { gameState, flip, playerIndex } = useWarGame(roomId || '');
  const [showFX, setShowFX] = useState(false);

  useEffect(() => {
    if (gameState?.isWar) {
      setShowFX(true);
      const timer = setTimeout(() => setShowFX(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.isWar]);

  if (!roomId) {
    return (
      <div className="command-center join-screen">
        <div className="terminal-overlay">
          <p>&gt; VWAR COMMAND CENTER INITIALIZED.</p>
          <p>&gt; ENTER SECTOR CODE TO JOIN BATTLE:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <input 
              type="text" 
              value={inputRoomId} 
              onChange={(e) => setInputRoomId(e.target.value)}
              placeholder="SECTOR CODE"
              className="neon-input"
            />
            <button 
              onClick={() => setRoomId(inputRoomId)}
              className="neon-button"
              disabled={!inputRoomId.trim()}
            >
              JOIN SECTOR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="command-center">
        <div className="terminal-overlay">
          <p>&gt; INITIALIZING VWAR OS...</p>
          <p>&gt; ESTABLISHING SECURE CONNECTION...</p>
          <p>&gt; WAITING FOR BATTLE NETWORK TO RESPOND...</p>
        </div>
      </div>
    );
  }

  const mapValue = (v: number) => {
    if (v <= 10) return v.toString();
    if (v === 11) return 'J';
    if (v === 12) return 'Q';
    if (v === 13) return 'K';
    if (v === 14) return 'A';
    return v.toString();
  };

  const isLocalReady = playerIndex === 1 ? gameState.p1Flipped : gameState.p2Flipped;

  return (
    <div className="command-center">
      <FXLayer trigger={showFX} />
      <HUD p1Count={gameState.p1Count} p2Count={gameState.p2Count} isWar={gameState.isWar} />
      
      <main className="main-display">
        <BattleZone>
          {gameState.status === 'playing' || gameState.status === 'game-over' ? (
            <div className="cards-container">
              <div className="card-slot">
                {gameState.p1Card ? (
                  <Card value={mapValue(gameState.p1Card)} suit="&spades;" isFaceUp={true} />
                ) : (
                  <div className="holographic-card" style={{ opacity: gameState.p1Flipped ? 0.6 : 0.2 }}>
                    {gameState.p1Flipped && <div className="scanning-line" />}
                  </div>
                )}
                <p className="slot-label">P1 {gameState.p1Flipped ? '[READY]' : ''}</p>
              </div>

              <div className="card-slot">
                {gameState.p2Card ? (
                  <Card value={mapValue(gameState.p2Card)} suit="&hearts;" isFaceUp={true} />
                ) : (
                  <div className="holographic-card" style={{ opacity: gameState.p2Flipped ? 0.6 : 0.2 }}>
                    {gameState.p2Flipped && <div className="scanning-line" />}
                  </div>
                )}
                <p className="slot-label">P2 {gameState.p2Flipped ? '[READY]' : ''}</p>
              </div>
            </div>
          ) : (
            <div className="terminal-overlay">
               <p>&gt; WAITING FOR SECOND PLAYER TO JOIN...</p>
            </div>
          )}
        </BattleZone>
      </main>

      <div className="controls">
         <button 
           onClick={flip} 
           className="neon-button" 
           disabled={gameState.status !== 'playing' || isLocalReady}
         >
            {isLocalReady ? 'WAITING FOR SYNC...' : 'INITIATE ENGAGEMENT (FLIP)'}
         </button>
      </div>

      <div className="terminal-overlay status-log">
        <p>&gt; STATUS: {gameState.status.toUpperCase()}</p>
        {gameState.history.length > 1 && (
          <div className="history-monitor">
            <p>&gt; WAR DETECTED! ESCALATION LOG:</p>
            {gameState.history.map((step: any, idx: number) => (
              <p key={idx} style={{ paddingLeft: '20px', fontSize: '0.8rem' }}>
                {step.type === 'battle' ? `> BATTLE: P1(${mapValue(step.c1)}) vs P2(${mapValue(step.c2)})` : `> REINFORCEMENTS: ${step.r1.length} cards deployed.`}
              </p>
            ))}
          </div>
        )}
        {gameState.winner && <p>&gt; LAST ROUND WINNER: PLAYER {gameState.winner}</p>}
        {gameState.status === 'game-over' && (
           <p className="game-over-alert">&gt; FINAL VICTORY: PLAYER {gameState.p1Count > 0 ? '1' : '2'}</p>
        )}
        <p>&gt; READY COMMANDER.</p>
      </div>
    </div>
  );
};

export default App;
