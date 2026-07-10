import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  value: number | string;
  suit: string;
  isFaceUp: boolean;
  resultState?: 'winner' | 'loser' | null;
}

export const Card = ({ value, suit, isFaceUp, resultState = null }: CardProps) => (
  <motion.div 
    layoutId={`${value}-${suit}`}
    className={`holographic-card ${resultState ? `card-${resultState}` : ''}`}
    animate={{ rotateY: isFaceUp ? 0 : 180 }}
    aria-label={isFaceUp ? `${value} ${suit}` : 'Face down card'}
  >
    <div className="scanning-line" />
    {isFaceUp && (
      <div className="card-value">
        {value}
        <span className="card-symbol" dangerouslySetInnerHTML={{ __html: suit }} />
      </div>
    )}
  </motion.div>
);
