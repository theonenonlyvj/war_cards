import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ value, suit, isFaceUp }: any) => (
  <motion.div 
    layoutId={`${value}-${suit}`}
    className="holographic-card"
    animate={{ rotateY: isFaceUp ? 0 : 180 }}
  >
    <div className="scanning-line" />
    {isFaceUp && <span className="card-value">{value}{suit}</span>}
  </motion.div>
);
