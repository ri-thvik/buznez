// ============================================================
// BUSINESS BHARAT — Buy Decision Modal (true fixed overlay)
// Rendered ONLY for the PROPERTY_DECISION phase. Never resizes board.
// ============================================================

import React from 'react';
import { formatRupees } from '@/types/game';
import type { BoardTileData, Player } from '@/types/game';
import { EconomyManager } from '@/engine/EconomyManager';
import { GROUP_COLORS } from '@/data/boardData';

interface BuyDecisionModalProps {
  tile: BoardTileData;
  currentPlayer: Player | undefined;
  isMyDecision: boolean;
  onBuy: () => void;
  onDecline: () => void;
}

export function BuyDecisionModal({ tile, currentPlayer, isMyDecision, onBuy, onDecline }: BuyDecisionModalProps) {
  if (!tile || tile.price == null) return null;
  const gst = EconomyManager.calculateGST(tile.price);
  const total = tile.price + gst;
  const canAfford = (currentPlayer?.cash ?? 0) >= total;
  // Single source of truth for group colours.
  const groupColor = (tile.group && GROUP_COLORS[tile.group]) || tile.groupColor || '#7C3AED';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 90, background: 'rgba(5,3,12,0.72)',
      }}
    >
      <div
        style={{
          width: 'calc(100vw - 32px)', maxWidth: 560,
          maxHeight: '80vh', overflowY: 'auto',
          background: '#1A102B',
          border: '1px solid #3A2A52', borderRadius: 16,
          padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#8B5CF6', fontWeight: 700 }}>
          PROPERTY AVAILABLE
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F8F7FB', marginTop: 4 }}>
          {(tile.name ?? '').toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          {tile.group && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${groupColor}30`, color: groupColor }}>
              {tile.group.replace('_', ' ')} GROUP
            </span>
          )}
          <span style={{ fontSize: 18, fontWeight: 800, color: '#F4C95D' }}>
            {formatRupees(tile.price)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 12, color: '#B8AEC9' }}>
          <div>BASE RENT<br /><strong style={{ color: '#F8F7FB' }}>{tile.baseRent != null ? formatRupees(tile.baseRent) : '—'}</strong></div>
          <div>GST (5%)<br /><strong style={{ color: '#F8F7FB' }}>{formatRupees(gst)}</strong></div>
          <div>HOUSE RENT<br /><strong style={{ color: '#F8F7FB' }}>{tile.houseRent ? tile.houseRent.map(formatRupees).join(' / ') : '—'}</strong></div>
          <div>HOTEL RENT<br /><strong style={{ color: '#F8F7FB' }}>{tile.hotelRent != null ? formatRupees(tile.hotelRent) : '—'}</strong></div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#B8AEC9' }}>
          Total payable: <strong style={{ color: '#F8F7FB' }}>{formatRupees(total)}</strong>
          {!canAfford && isMyDecision && (
            <span style={{ color: '#F05252' }}> — insufficient funds, declining will trigger auction.</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onDecline}
            disabled={!isMyDecision}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid #3A2A52', background: 'transparent', color: '#B8AEC9', fontWeight: 700, cursor: isMyDecision ? 'pointer' : 'not-allowed', opacity: isMyDecision ? 1 : 0.5 }}
          >
            DECLINE
          </button>
          <button
            onClick={onBuy}
            disabled={!isMyDecision || !canAfford}
            style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#FF9933,#F4C95D)', color: '#1A102B', fontWeight: 800, cursor: isMyDecision && canAfford ? 'pointer' : 'not-allowed', opacity: isMyDecision && canAfford ? 1 : 0.5 }}
          >
            BUY {formatRupees(total)}
          </button>
        </div>
        {!isMyDecision && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#7F7590', textAlign: 'center' }}>
            Waiting for {currentPlayer?.name ?? 'current player'} to decide…
          </div>
        )}
      </div>
    </div>
  );
}
