// ============================================================
// BUSINESS BHARAT — Trade Modal
// Propose or respond to a trade between players.
// ============================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupees } from '@/types/game';
import type { GameState, TradeOffer } from '@/types/game';
import { BOARD_TILES } from '@/data/boardData';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  localPlayerId?: string;
  trade?: TradeOffer | null;
  onProposeTrade: (offer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) => void;
  onAcceptTrade: (tradeId: string) => void;
  onDeclineTrade: (tradeId: string) => void;
}

const CASH_STEP = 500;

export function TradeModal({
  isOpen,
  onClose,
  gameState,
  localPlayerId,
  trade,
  onProposeTrade,
  onAcceptTrade,
  onDeclineTrade,
}: TradeModalProps) {
  const [offeredCash, setOfferedCash] = useState(0);
  const [requestedCash, setRequestedCash] = useState(0);
  const [selectedOfferedProps, setSelectedOfferedProps] = useState<number[]>([]);
  const [selectedRequestedProps, setSelectedRequestedProps] = useState<number[]>([]);
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');

  if (!localPlayerId) return null;

  const localPlayer = gameState.players.find(p => p.id === localPlayerId);
  if (!localPlayer) return null;

  const tradablePlayers = gameState.players.filter(
    p => p.id !== localPlayerId && !p.isBankrupt
  );

  const handlePropose = () => {
    if (!targetPlayerId) return;
    onProposeTrade({
      fromPlayerId: localPlayerId!,
      toPlayerId: targetPlayerId,
      offeredCash,
      requestedCash,
      offeredProperties: selectedOfferedProps,
      requestedProperties: selectedRequestedProps,
    });
    handleClose();
  };

  const handleClose = () => {
    setOfferedCash(0);
    setRequestedCash(0);
    setSelectedOfferedProps([]);
    setSelectedRequestedProps([]);
    setTargetPlayerId('');
    onClose();
  };

  const toggleProp = (pos: number, list: number[], setter: (v: number[]) => void) => {
    if (list.includes(pos)) {
      setter(list.filter(p => p !== pos));
    } else {
      setter([...list, pos]);
    }
  };

  // If there's an active trade offer to respond to
  const isResponseMode = !!trade;


  const offerOfferedCash = trade?.offeredCash ?? offeredCash;
  const offerRequestedCash = trade?.requestedCash ?? requestedCash;
  const offerTargetPlayer = trade?.toPlayerId ?? targetPlayerId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isResponseMode ? 'Trade Offer' : 'Propose Trade'}
      size="lg"
    >
      <div className="space-y-4">
        {/* Trade layout: You → Target */}
        <div className="grid grid-cols-2 gap-6">
          {/* Your side */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              {localPlayer?.name || 'You'} {localPlayerId === gameState.currentPlayerId && '(Your Turn)'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted">Offered Cash</label>
                <div className="flex items-center gap-1 mt-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Minus}
                    onClick={() => setOfferedCash(Math.max(0, offeredCash - CASH_STEP))}
                    disabled={isResponseMode}
                  />
                  <span className="text-sm text-text-primary font-mono">{formatRupees(offerOfferedCash)}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Plus}
                    onClick={() => setOfferedCash(offeredCash + CASH_STEP)}
                    disabled={isResponseMode || (localPlayer?.cash ?? 0) <= offerOfferedCash + CASH_STEP}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted">Offered Properties</label>
                <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                  {(localPlayer?.ownedProperties ?? []).map(pos => {
                    const tile = BOARD_TILES[pos];
                    const isSelected = selectedOfferedProps.includes(pos);
                    return (
                      <motion.button
                        key={pos}
                        layout
                        onClick={() => !isResponseMode && toggleProp(pos, selectedOfferedProps, setSelectedOfferedProps)}
                        disabled={isResponseMode}
                        className={[
                          'px-1.5 py-0.5 rounded text-xs',
                          isSelected ? 'bg-brand/30 border border-brand' : 'bg-bg-base border border-border-subtle',
                        ].join(' ')}
                      >
                        {tile?.name ?? pos}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Target side */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              {isResponseMode
                ? (gameState.players.find(p => p.id === offerTargetPlayer)?.name ?? 'Unknown')
                : (tradablePlayers.length > 0
                  ? tradablePlayers.map(p => p.name).join(', ')
                  : 'No players available')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-muted">Requested Cash</label>
                <div className="flex items-center gap-1 mt-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Minus}
                    onClick={() => setRequestedCash(Math.max(0, requestedCash - CASH_STEP))}
                    disabled={isResponseMode}
                  />
                  <span className="text-sm text-text-primary font-mono">{formatRupees(offerRequestedCash)}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Plus}
                    onClick={() => setRequestedCash(requestedCash + CASH_STEP)}
                    disabled={isResponseMode || (localPlayer?.cash ?? 0) <= requestedCash + CASH_STEP}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted">Requested Properties</label>
                <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                  {isResponseMode ? (
                    (offerTargetPlayer ? gameState.players.find(p => p.id === offerTargetPlayer)?.ownedProperties ?? [] : []).map(pos => {
                      const tile = BOARD_TILES[pos];
                      return (
                        <span
                          key={pos}
                          className="px-1.5 py-0.5 rounded text-xs bg-bg-base border border-border-subtle"
                        >
                          {tile?.name ?? pos}
                        </span>
                      );
                    })
                  ) : (
                    <select
                      value={targetPlayerId}
                      onChange={e => setTargetPlayerId(e.target.value)}
                      className="w-full bg-bg-base border border-border-subtle rounded-lg text-text-primary px-2 py-1 text-sm outline-none"
                      disabled={isResponseMode}
                    >
                      <option value="">Select player</option>
                      {tradablePlayers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response mode: accept/decline buttons */}
        {isResponseMode && trade && (
          <div className="flex gap-2 pt-3 border-t border-border-subtle">
            <Button variant="success" size="md" fullWidth icon={Check} onClick={() => { onAcceptTrade(trade.id); handleClose(); }}>
              Accept Offer
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={() => { onDeclineTrade(trade.id); handleClose(); }}>
              Decline
            </Button>
          </div>
        )}

        {/* Propose mode: send button */}
        {!isResponseMode && (
          <div className="pt-3 border-t border-border-subtle">
            <Button
              variant="gold"
              size="md"
              icon={ArrowLeftRight}
              fullWidth
              onClick={handlePropose}
              disabled={!targetPlayerId}
            >
              Send Trade Offer
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
