// ============================================================
// BUSINESS BHARAT — Card Modal
// Shows a drawn Chance, Community Chest, or Surprise card.
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  X, Sparkles, IndianRupee,
  Ban, Users, MapPin, ArrowRight, Key, TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupees } from '@/types/game';
import type { GameCard } from '@/types/game';

const CARD_ICONS: Record<string, any> = {
  COLLECT_FROM_BANK: IndianRupee,
  PAY_BANK: TrendingDown,
  COLLECT_FROM_PLAYERS: Users,
  PAY_PLAYERS: Users,
  MOVE_TO: MapPin,
  MOVE_FORWARD: ArrowRight,
  GO_TO_JAIL: Ban,
  GET_OUT_OF_JAIL: Key,
};

const ACTION_LABELS: Record<string, string> = {
  COLLECT_FROM_BANK: 'Collect from Bank',
  PAY_BANK: 'Pay to Bank',
  COLLECT_FROM_PLAYERS: 'Collect from Players',
  PAY_PLAYERS: 'Pay to Players',
  MOVE_TO: 'Move to Tile',
  MOVE_FORWARD: 'Move Forward',
  GO_TO_JAIL: 'Go to Jail',
  GET_OUT_OF_JAIL: 'Get Out of Jail Free',
};

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: GameCard | null;
  onContinue: () => void;
}

export function CardModal({ isOpen, onClose, card, onContinue }: CardModalProps) {
  if (!card) return null;

  const ActionIcon = CARD_ICONS[card.action.kind] ?? Sparkles;
  const amountStr = card.action.amount
    ? formatRupees(Math.abs(card.action.amount))
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Card Drawn" size="md" closable={false}>
      <div className="text-center space-y-4">
        <motion.div
          initial={{ rotateY: -90 }}
          animate={{ rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex justify-center"
        >
          <ActionIcon size={48} className="text-gold" />
        </motion.div>

        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-text-primary">
            {card.type.replace('_', ' ')}
          </h3>

          <p className="text-sm text-text-secondary leading-relaxed">
            {card.text}
          </p>

          {card.action.kind && (
            <div className="mt-3 p-3 rounded-xl bg-bg-base border border-border-subtle">
              <div className="flex items-center justify-center gap-2">
                <ActionIcon size={16} className="text-brand-bright" />
                <span className="text-sm font-semibold text-text-primary">
                  {ACTION_LABELS[card.action.kind] ?? card.action.kind}
                </span>
                {amountStr && <span className="text-sm text-text-secondary">{amountStr}</span>}
              </div>
            </div>
          )}
        </div>

        <Button variant="primary" size="lg" icon={X} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
