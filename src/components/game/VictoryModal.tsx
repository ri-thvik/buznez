// ============================================================
// BUSINESS BHARAT — Victory Modal
// Shows the winner and game summary when the game ends.
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, IndianRupee, Home, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupees } from '@/types/game';
import type { GameState, Player } from '@/types/game';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  winner: Player;
  onPlayAgain: () => void;
}

export function VictoryModal({ isOpen, onClose, winner, onPlayAgain }: VictoryModalProps) {
  if (!winner) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game Over" size="lg" closable={false}>
      <div className="text-center space-y-6">
        {/* Trophy animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <Trophy size={64} className="text-gold mx-auto" />
        </motion.div>

        {/* Winner */}
        <div>
          <h2 className="font-display font-bold text-2xl text-text-primary">
            {winner.name.toUpperCase()}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Wins with {formatRupees(winner.netWorth)} net worth
          </p>
        </div>

        {/* Winner stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border-subtle">
          <div>
            <IndianRupee size={16} className="text-text-muted mx-auto mb-1" />
            <div className="text-xs text-text-muted">Cash</div>
            <div className="text-lg font-semibold text-text-primary">{formatRupees(winner.cash)}</div>
          </div>
          <div>
            <Home size={16} className="text-text-muted mx-auto mb-1" />
            <div className="text-xs text-text-muted">Properties</div>
            <div className="text-lg font-semibold text-text-primary">{winner.ownedProperties.length}</div>
          </div>
          <div>
            <TrendingUp size={16} className="text-text-muted mx-auto mb-1" />
            <div className="text-xs text-text-muted">Net Worth</div>
            <div className="text-lg font-semibold text-gold">{formatRupees(winner.netWorth)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="gold" size="lg" icon={RotateCcw} onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Main Menu
          </Button>
        </div>
      </div>
    </Modal>
  );
}
