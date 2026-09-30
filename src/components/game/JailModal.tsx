// ============================================================
// BUSINESS BHARAT — Jail Modal
// Shows jail options when a player is in jail.
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Dice6, Banknote, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupees } from '@/types/game';
import type { Player } from '@/types/game';

const JAIL_FINE = 500;

interface JailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onPayFine: () => void;
  onUseCard: () => void;
  onRollDice: () => void;
  isCurrentPlayer: boolean;
}

export function JailModal({
  isOpen,
  onClose,
  player,
  onPayFine,
  onUseCard,
  onRollDice,
  isCurrentPlayer,
}: JailModalProps) {
  if (!player) return null;

  const canAffordFine = player.cash >= JAIL_FINE;
  const jailCardCount = player.getOutOfJailCards;
  const hasCard = jailCardCount > 0;
  const jailTurnsUsed = 3 - player.jailTurnsRemaining;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🚓 In Jail" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          You've been sent to jail. Choose how to escape:
        </p>

        <div className="space-y-2">
          {/* Pay fine */}
          <motion.div
            whileHover={canAffordFine ? { scale: 1.01 } : {}}
            className="p-3 rounded-xl border border-border-subtle bg-bg-base"
          >
            <div className="flex items-center gap-3">
              <Banknote size={20} className="text-gold" />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">Pay {formatRupees(JAIL_FINE)}</div>
                <div className="text-xs text-text-muted">Get out of jail immediately</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canAffordFine || !isCurrentPlayer}
                onClick={onPayFine}
              >
                Pay
              </Button>
            </div>
          </motion.div>

          {/* Use card */}
          {hasCard && (
            <motion.div
              whileHover={isCurrentPlayer ? { scale: 1.01 } : {}}
              className="p-3 rounded-xl border border-border-subtle bg-bg-base"
            >
              <div className="flex items-center gap-3">
                <Key size={20} className="text-brand-bright" />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">
                    Use Get Out of Jail Free card
                  </div>
                  <div className="text-xs text-text-muted">
                    You have {jailCardCount} card{jailCardCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!isCurrentPlayer}
                  onClick={onUseCard}
                >
                  Use
                </Button>
              </div>
            </motion.div>
          )}

          {/* Roll dice */}
          <motion.div
            whileHover={isCurrentPlayer ? { scale: 1.01 } : {}}
            className="p-3 rounded-xl border border-border-subtle bg-bg-base"
          >
            <div className="flex items-center gap-3">
              <Dice6 size={20} className="text-success" />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">Roll for doubles</div>
                <div className="text-xs text-text-muted">
                  Turn {jailTurnsUsed}/3 — Roll doubles to get out free
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={!isCurrentPlayer}
                onClick={onRollDice}
              >
                Roll
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Info */}
        <div className="text-xs text-text-muted">
          You will automatically serve {player.jailTurnsRemaining} more turn(s) if you don't escape.
        </div>
      </div>
    </Modal>
  );
}
