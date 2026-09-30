// ============================================================
// BUSINESS BHARAT — Bankruptcy Modal
// Shows when a player is going bankrupt.
// ============================================================

import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BOARD_TILES } from '@/data/boardData';
import { formatRupees } from '@/types/game';
import type { Player, GameState, PropertyState } from '@/types/game';

interface BankruptcyModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  gameState: GameState;
  onDeclareBankruptcy: (reason: string) => void;
}

const BANKRUPTCY_REASONS = [
  'Unable to pay rent',
  'Unable to pay taxes',
  'Unable to pay jail fine',
  'Unable to pay mortgage interest',
] as const;

export function BankruptcyModal({
  isOpen,
  onClose,
  player,
  gameState,
  onDeclareBankruptcy,
}: BankruptcyModalProps) {
  if (!player) return null;

  const propStates = player.ownedProperties.map(pos =>
    gameState.properties.find(p => p.position === pos)
  ).filter(Boolean) as PropertyState[];

  const liquidationValue = propStates.reduce((total, prop) => {
    const tile = BOARD_TILES[prop.position];
    if (prop.isMortgaged) {
      return total + (Math.round((tile.price ?? 0) / 2) * 0.85);
    }
    if (prop.hasHotel) {
      const groupCost = BOARD_TILES.find(t => t.group === tile.group)?.houseCost ?? 0;
      return total + Math.round(groupCost * 2 * 0.5);
    }
    return total + Math.round((tile.price ?? 0) * 0.7) + (prop.houses * (tile.houseCost ?? 0) * 0.5);
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bankruptcy"
      size="md"
      closable={false}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle size={24} />
          <h3 className="font-bold text-lg">
            {player.name} is Bankrupt!
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Cash on hand</span>
            <span className="text-text-primary">{formatRupees(player.cash)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Est. liquidation value</span>
            <span className="text-gold">{formatRupees(Math.round(liquidationValue))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Properties to liquidate</span>
            <span className="text-text-primary">{player.ownedProperties.length}</span>
          </div>
        </div>

        <p className="text-sm text-text-secondary">
          You cannot afford your debts. All properties will be liquidated
          and transferred to creditors. Choose a reason below:
        </p>

        <div className="space-y-2">
          {BANKRUPTCY_REASONS.map(reason => (
            <Button
              key={reason}
              variant="ghost"
              size="sm"
              fullWidth
              icon={TrendingDown}
              onClick={() => onDeclareBankruptcy(reason)}
            >
              {reason}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
