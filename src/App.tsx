import React, { useState, useEffect } from 'react';
import { HUD } from './components/HUD';
import { Card } from './components/Card';
import { BattleZone } from './components/BattleZone';
import { useWarGame } from './hooks/useWarGame';
import { FXLayer } from './components/FXLayer';
import { audioManager } from './utils/AudioManager';

const App = () => {
  const [inputRoomId, setInputRoomId] = useState('');
  const { gameState, flip, playerIndex, joinRoom, joinSolo, roomId, isLocalMode, localState } = useWarGame();
  const [showFX, setShowFX] = useState(false);

  useEffect(() => {
    if (gameState?.isWar) {
      setShowFX(true);
      audioManager.playSiren();
      const timer = setTimeout(() => setShowFX(false), 2000);
      return () => clearTimeout(timer);
    } else {
      audioManager.stopSiren();
    }
  }, [gameState?.isWar]);

  if (!roomId) {
    return (
      <div className="command-center join-screen">
        <div className="terminal-overlay">
          <p>&gt; VWAR COMMAND CENTER INITIALIZED.</p>
          <p>&gt; BLITZ OPERATION RECOMMENDED: FIRST COMMANDER TO 35 CARDS WINS.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <div className="join-actions">
              {localState && (
                <button 
                  onClick={() => joinSolo(false)}
                  className="neon-button resume-btn"
                >
                  RESUME LOCAL BATTLE
                </button>
              )}

              <button 
                onClick={() => joinSolo(true, 'blitz')}
                className="neon-button solo-btn"
              >
                NEW BLITZ BATTLE
              </button>

              <button
                onClick={() => joinSolo(true, 'classic')}
                className="neon-button"
              >
                CLASSIC ATTRITION
              </button>
            </div>
            <div className="sector-join">
              <p>&gt; MULTIPLAYER SECTOR LINK:</p>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="SECTOR CODE"
                className="neon-input"
                aria-label="Sector code"
              />
              <button
                onClick={() => joinRoom(inputRoomId)}
                className="neon-button sector-btn"
                disabled={!inputRoomId.trim()}
              >
                JOIN SECTOR
              </button>
            </div>
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
  const isEngagementActive = ['playing', 'game-over', 'incident', 'deployment'].includes(gameState.status);
  const tacticalIntel = gameState.tacticalIntel;
  const cardResult = (slot: 1 | 2): 'winner' | 'loser' | null => {
    if (!gameState.winner || gameState.isWar || !gameState.p1Card || !gameState.p2Card) return null;
    return gameState.winner === slot ? 'winner' : 'loser';
  };

  return (
    <div className={`command-center ${gameState.isWar ? 'emergency-state' : ''}`}>
      <FXLayer trigger={showFX} />
      <HUD
        p1Count={gameState.p1Count}
        p2Count={gameState.p2Count}
        isWar={gameState.isWar}
        tacticalIntel={tacticalIntel}
      />
      {isLocalMode && (
        <div className="local-override-tag">
          <span className="blink">●</span> LOCAL OVERRIDE ACTIVE
        </div>
      )}
      
      <main className="main-display">
        <BattleZone>
          {isEngagementActive ? (
            <div className="cards-container">
              <div className="card-slot">
                <div className="slot-stack">
                  {gameState.history.map((step: any, idx: number) => (
                    step.type === 'war-reinforcements' && (
                      <div key={`p1-war-${idx}`} className="war-pile p1-war-pile">
                        {step.r1.map((_: any, rIdx: number) => (
                          <div key={rIdx} className="holographic-card face-down-war" style={{ 
                            transform: `translateY(${rIdx * 10}px) rotate(${rIdx * 2}deg)`,
                            zIndex: rIdx
                          }} />
                        ))}
                      </div>
                    )
                  ))}
                  {gameState.p1Card ? (
                    <Card
                      value={mapValue(gameState.p1Card.value)}
                      suit={gameState.p1Card.suit}
                      isFaceUp={true}
                      resultState={cardResult(1)}
                    />
                  ) : (
                    <div className="holographic-card" style={{ opacity: gameState.p1Flipped ? 0.6 : 0.2 }}>
                      {gameState.p1Flipped && <div className="scanning-line" />}
                    </div>
                  )}
                </div>
                <p className={`slot-label ${playerIndex === 1 ? 'local-user' : ''}`}>
                  {playerIndex === 1 ? 'COMMANDER YOU' : 'P1 ENEMY'} {gameState.p1Flipped ? '[READY]' : ''}
                </p>
              </div>

              <div className="card-slot">
                <div className="slot-stack">
                  {gameState.history.map((step: any, idx: number) => (
                    step.type === 'war-reinforcements' && (
                      <div key={`p2-war-${idx}`} className="war-pile p2-war-pile">
                        {step.r2.map((_: any, rIdx: number) => (
                          <div key={rIdx} className="holographic-card face-down-war" style={{ 
                            transform: `translateY(${rIdx * 10}px) rotate(${-rIdx * 2}deg)`,
                            zIndex: rIdx
                          }} />
                        ))}
                      </div>
                    )
                  ))}
                  {gameState.p2Card ? (
                    <Card
                      value={mapValue(gameState.p2Card.value)}
                      suit={gameState.p2Card.suit}
                      isFaceUp={true}
                      resultState={cardResult(2)}
                    />
                  ) : (
                    <div className="holographic-card" style={{ opacity: gameState.p2Flipped ? 0.6 : 0.2 }}>
                      {gameState.p2Flipped && <div className="scanning-line" />}
                    </div>
                  )}
                </div>
                <p className={`slot-label ${playerIndex === 2 ? 'local-user' : ''}`}>
                  {playerIndex === 2 ? 'COMMANDER YOU' : (gameState.isSolo ? 'VIRTUAL COMMANDER' : 'P2 ENEMY')} {gameState.p2Flipped ? '[READY]' : ''}
                </p>
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
           className={`neon-button ${['incident', 'deployment'].includes(gameState.status) ? 'solo-btn' : ''}`}
           disabled={!['playing', 'incident', 'deployment'].includes(gameState.status) || isLocalReady}
         >
            {isLocalReady ? 'WAITING FOR SYNC...' : 
             gameState.status === 'incident' ? 'DEPLOY REINFORCEMENTS' : 
             gameState.status === 'deployment' ? 'INITIATE FINAL ENGAGEMENT' :
             'INITIATE ENGAGEMENT (FLIP)'}
         </button>
      </div>

      <div className="terminal-overlay status-log">
        <p>&gt; STATUS: {gameState.status.toUpperCase()}</p>
        {tacticalIntel && (
          <div className="tactical-intel">
            <p>&gt; OPERATION: {tacticalIntel.targetCards ? `${tacticalIntel.modeLabel} / FIRST TO ${tacticalIntel.targetCards}` : 'CLASSIC ATTRITION'}</p>
            <p>&gt; STAKES: {tacticalIntel.potSize} IN POT / {tacticalIntel.possibleSwing} CARD SWING</p>
            {tacticalIntel.incidentChain > 0 && <p>&gt; INCIDENT CHAIN: X{tacticalIntel.incidentChain}</p>}
            {tacticalIntel.isLastStand && <p className="last-stand-alert">&gt; LAST STAND RISK: FINAL CARD MAY DECIDE THE SECTOR</p>}
          </div>
        )}
        {gameState.history.length > 0 && (
          <div className="history-monitor">
            {gameState.status === 'incident' || gameState.status === 'deployment' ? (
              <p className="game-over-alert">&gt; WAR DETECTED! ESCALATION LOG:</p>
            ) : (
              <p>&gt; LAST ENGAGEMENT LOG:</p>
            )}
            {gameState.history.map((step: any, idx: number) => (
              <p key={idx} style={{ paddingLeft: '20px', fontSize: '0.8rem' }}>
                {step.type === 'battle' ? `> BATTLE: P1(${mapValue(step.c1.value)}) vs P2(${mapValue(step.c2.value)})` : `> REINFORCEMENTS: ${step.r1.length} cards deployed.`}
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
