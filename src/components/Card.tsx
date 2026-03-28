import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  value: number | string;
  suit: string;
  isFaceUp: boolean;
}

export const Card = ({ value, suit, isFaceUp }: CardProps) => (
  <motion.div 
    layoutId={`${value}-${suit}`}
    className="holographic-card"
    animate={{ rotateY: isFaceUp ? 0 : 180 }}
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
