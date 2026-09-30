// ============================================================
// BUSINESS BHARAT — Auction Modal
// Shows live auction bid panel.
// ============================================================

import React from 'react';
import { Gavel } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupees } from '@/types/game';
import type { AuctionState, Player } from '@/types/game';
import { BOARD_TILES } from '@/data/boardData';

interface AuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionState;
  gameStatePlayers: Player[];
  localPlayerId?: string;
  onPlaceBid: (amount: number) => void;
  onPass: () => void;
}

export function AuctionModal({
  isOpen,
  onClose,
  auction,
  gameStatePlayers,
  localPlayerId,
  onPlaceBid,
  onPass,
}: AuctionModalProps) {
  if (!auction) return null;
  
  const tile = BOARD_TILES[auction.propertyPosition];
  const currentPlayer = gameStatePlayers.find(p => p.id === localPlayerId);
  const hasPassed = auction.passedPlayerIds.includes(localPlayerId ?? '');
  const canBid = !hasPassed && (currentPlayer?.cash ?? 0) >= auction.currentBid + auction.bidIncrement;
  const nextBid = auction.currentBid + auction.bidIncrement;

  const bidPresets = [
    auction.bidIncrement,
    auction.currentBid + auction.bidIncrement * 2,
    auction.currentBid + auction.bidIncrement * 5,
    currentPlayer ? Math.min(currentPlayer.cash, auction.currentBid + auction.bidIncrement * 10) : 0,
  ].filter(v => v > auction.currentBid);

  // Find current highest bidder name
  const currentBidder = auction.currentBidderId
    ? gameStatePlayers.find(p => p.id === auction.currentBidderId)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Auction" size="md">
      <div className="space-y-4">
        {/* Property */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-base">
          <div
            className="w-10 h-10 rounded flex items-center justify-center font-bold"
            style={{ backgroundColor: tile.groupColor + '30', color: tile.groupColor }}
          >
            {tile.type === 'PROPERTY' ? '🏢' : '❓'}
          </div>
          <div>
            <span className="font-semibold text-text-primary">{tile.name}</span>
            <div className="text-xs text-text-muted">
              {tile.price !== undefined && `${formatRupees(tile.price)} · ${tile.group}`}
            </div>
          </div>
        </div>

        {/* Bid info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted text-xs">Current Bid</span>
            <span className="block text-text-primary font-bold text-lg">{formatRupees(auction.currentBid)}</span>
          </div>
          <div>
            <span className="text-text-muted text-xs">Your Cash</span>
            <span className="block text-text-primary font-bold">{formatRupees(currentPlayer?.cash ?? 0)}</span>
          </div>
          <div>
            <span className="text-text-muted text-xs">Lead Bidder</span>
            <span className="block text-text-secondary">
              {currentBidder ? currentBidder.name : 'No bids yet'}
            </span>
          </div>
          <div>
            <span className="text-text-muted text-xs">Next Minimum</span>
            <span className="block text-text-secondary">{formatRupees(nextBid)}</span>
          </div>
        </div>

        {/* Bid buttons */}
        {!hasPassed && canBid && (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {bidPresets.slice(0, 3).map(amount => (
                <Button
                  key={amount}
                  variant="success"
                  size="sm"
                  onClick={() => onPlaceBid(amount)}
                >
                  {formatRupees(amount)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={nextBid}
                max={currentPlayer?.cash ?? 0}
                placeholder={formatRupees(nextBid)}
                onChange={e => onPlaceBid(Number(e.target.value))}
                className="flex-1 bg-bg-base border border-border-subtle rounded-lg text-text-primary px-3 py-1.5 text-sm outline-none focus:border-brand"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPlaceBid(currentPlayer!.cash)}
              >
                MAX
              </Button>
            </div>
          </div>
        )}

        {hasPassed && (
          <div className="text-xs text-text-muted">You passed. Waiting for others…</div>
        )}

        {!canBid && !hasPassed && (
          <div className="text-xs text-text-muted">
            You cannot afford the next bid ({formatRupees(nextBid)}).
          </div>
        )}

        {/* Pass button */}
        {!hasPassed && (
          <div className="pt-2 border-t border-border-subtle">
            <Button variant="secondary" size="sm" icon={Gavel} fullWidth onClick={onPass}>
              Pass Auction
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
