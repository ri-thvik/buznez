// ============================================================
// BUSINESS BHARAT — Player Token
// Circular 3D-styled token for each player.
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Building2, Car, Coins, type LucideIcon } from 'lucide-react';
import type { Player, TokenShape } from '@/types/game';

interface PlayerTokenProps {
  player: Player;
  size?: number;
  stackIndex?: number;  // for stacking multiple tokens on same tile
  animate?: boolean;
}

const TOKEN_ICONS: Record<TokenShape, LucideIcon> = {
  BRIEFCASE: Briefcase,
  BUILDING:  Building2,
  CAR:       Car,
  COIN:      Coins,
};

export function PlayerToken({
  player,
  size = 24,
  stackIndex = 0,
  animate = false,
}: PlayerTokenProps) {
  const Icon = TOKEN_ICONS[player.tokenShape];
  const iconSize = Math.max(8, Math.round(size * 0.48));

  const token = (
    <div
      className="player-token flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: player.color,
        // stack offset so multiple tokens don't completely overlap
        transform: `translate(${stackIndex * 5}px, ${stackIndex * -4}px)`,
        zIndex: 10 + stackIndex,
        position: stackIndex > 0 ? 'absolute' : 'relative',
      }}
      title={player.name}
    >
      <Icon size={iconSize} strokeWidth={2.5} color="rgba(0,0,0,0.7)" />
    </div>
  );

  if (!animate) return token;

  return (
    <motion.div
      layout
      layoutId={`token-${player.id}`}
      className="player-token flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: player.color,
        transform: `translate(${stackIndex * 5}px, ${stackIndex * -4}px)`,
        zIndex: 10 + stackIndex,
        position: stackIndex > 0 ? 'absolute' : 'relative',
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 24,
        duration: 0.5,
      }}
      title={player.name}
    >
      <Icon size={iconSize} strokeWidth={2.5} color="rgba(0,0,0,0.7)" />
    </motion.div>
  );
}
