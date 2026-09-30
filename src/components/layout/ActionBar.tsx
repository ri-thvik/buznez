// ============================================================
// BUSINESS BHARAT — Action Bar
// Shows available actions based on current game phase.
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dices, Home, Hotel, Lock, Unlock,
  ArrowLeftRight, AlertCircle, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatRupees } from '@/types/game';
import type { GameState } from '@/types/game';
import { BOARD_TILES, PROPERTY_GROUPS } from '@/data/boardData';

interface ActionBarProps {
  gameState: GameState;
  localPlayerId?: string;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onDeclineProperty: () => void;
  onEndTurn: () => void;
  onPlaceBid: (amount: number) => void;
  onPassAuction: () => void;
  onBuildHouse: (position: number) => void;
  onBuildHotel: (position: number) => void;
  onMortgage: (position: number) => void;
  onReleaseMortgage: (position: number) => void;
  onTrade: () => void;
  onPayJailFine: () => void;
  onUseJailCard: () => void;
  onDeclareBankruptcy: (reason: string) => void;
}

export function ActionBar({
  gameState,
  localPlayerId,
  onRollDice,
  onBuyProperty,
  onDeclineProperty,
  onEndTurn,
  onPlaceBid,
  onPassAuction,
  onBuildHouse,
  onBuildHotel,
  onMortgage,
  onReleaseMortgage,
  onTrade,
  onPayJailFine,
  onUseJailCard,
  onDeclareBankruptcy,
}: ActionBarProps) {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const isMyTurn = localPlayerId === gameState.currentPlayerId;
  const { phase, settings, pendingPropertyDecision, auction, pendingTrades } = gameState;

  const isMyTurnActive = isMyTurn && !currentPlayer?.isBankrupt;
  const showConstruction = currentPlayer && (phase === 'WAITING_FOR_ROLL' || phase === 'PROPERTY_DECISION' || phase === 'LANDING_RESOLUTION') && isMyTurn;

  // Get buildable properties (complete group, can build)
  const buildableProps = currentPlayer
    ? currentPlayer.ownedProperties.filter(pos => {
        const tile = BOARD_TILES[pos];
        const prop = gameState.properties.find(p => p.position === pos);
        if (!tile || !tile.group || !prop || prop.ownerId !== currentPlayer.id) return false;
        if (prop.hasHotel || prop.isMortgaged) return false;
        // Must own complete group
        const group = PROPERTY_GROUPS[tile.group];
        if (!group) return false;
        const allOwned = group.members.every(m => {
          const p = gameState.properties.find(pp => pp.position === m);
          return p && p.ownerId === currentPlayer.id;
        });
        if (!allOwned) return false;
        // Can build? (uniformity check)
        return prop.houses < 3;
      })
    : [];

  // Get mortgageable properties
  const mortgageableProps = currentPlayer
    ? currentPlayer.ownedProperties.filter(pos => {
        const prop = gameState.properties.find(p => p.position === pos);
        const tile = BOARD_TILES[pos];
        if (!prop || !tile) return false;
        if (!prop.isMortgaged && prop.houses === 0 && !prop.hasHotel) return true;
        return false;
      })
    : [];

  // Get releasable (mortgaged) properties
  const releasableProps = currentPlayer
    ? currentPlayer.ownedProperties.filter(pos => {
        const prop = gameState.properties.find(p => p.position === pos);
        return prop && prop.isMortgaged;
      })
    : [];

  // Pending trades for current player
  const myTrades = pendingTrades.filter(t => t.toPlayerId === currentPlayer?.id);

  return (
    <div className="bb-actionbar__inner">
        <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 flex-wrap bg-bg-panel/80 border border-border-subtle rounded-xl px-3 py-2 shadow-panel w-full"
        >
          {/* Turn header */}
          <div className="flex items-center gap-2 flex-shrink-0 pr-3 border-r border-border-subtle">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: currentPlayer?.color }} />
            <span className={'text-text-primary font-semibold whitespace-nowrap'} style={{ fontSize: 11.5 }}>
              {phase === 'ROLLING_DICE' ? 'Rolling…' :
                 phase === 'MOVING_PLAYER' ? 'Moving…' :
                 phase === 'LANDING_RESOLUTION' ? 'Resolving…' :
                 phase === 'CARD_DRAW' ? 'Card drawn' :
                 phase === 'JAIL_DECISION' ? 'Jail escape' :
                 phase === 'AUCTION' ? 'Auction' :
                 phase === 'PROPERTY_DECISION' ? 'Property available' :
                 phase === 'PAYMENT' ? 'Payment due' :
                 phase === 'GAME_OVER' ? 'Game Over' :
                 phase === 'BANKRUPTCY_RESOLUTION' ? 'Bankruptcy' :
                 isMyTurn ? 'YOUR TURN' : 'Waiting'}
            </span>
            <span
              className={'font-display font-bold whitespace-nowrap'}
              style={{ fontSize: 11, color: currentPlayer?.color }}
            >
              {currentPlayer?.name.toUpperCase() ?? '—'}
            </span>
          </div>

          {/* Phase-specific actions */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Rolling phase */}
            {(phase === 'WAITING_FOR_ROLL' && isMyTurnActive) && (
              <Button
                variant="primary"
                size="md"
                icon={Dices}
                onClick={onRollDice}
              >
                ROLL DICE
              </Button>
            )}

            {/* Property decision */}
            {phase === 'PROPERTY_DECISION' && isMyTurnActive && pendingPropertyDecision && (() => {
              const tile = BOARD_TILES[pendingPropertyDecision.position];
              if (!tile || !tile.price) return null;
              const { total } = (() => {
                const price = tile.price ?? 0;
                const gst = Math.round(price * 0.05 / 50) * 50;
                return { total: price + gst };
              })();
              return [
                <Button
                  key="buy"
                  variant="success"
                  size="sm"
                  icon={Banknote}
                  onClick={onBuyProperty}
                  disabled={currentPlayer!.cash < total}
                >
                  BUY ₹{total}
                </Button>,
                <Button
                  key="decline"
                  variant="secondary"
                  size="sm"
                  onClick={onDeclineProperty}
                >
                  DECLINE
                </Button>,
              ];
            })()}

            {/* Jail decision */}
            {phase === 'JAIL_DECISION' && isMyTurnActive && (() => {
              const canAffordFine = (currentPlayer?.cash ?? 0) >= 500;
              const hasCard = (currentPlayer?.getOutOfJailCards ?? 0) > 0;
              return [
                canAffordFine && (
                  <Button
                    key="pay"
                    variant="secondary"
                    size="sm"
                    icon={Banknote}
                    onClick={onPayJailFine}
                  >
                    PAY ₹500
                  </Button>
                ),
                hasCard && (
                  <Button
                    key="card"
                    variant="secondary"
                    size="sm"
                    icon={Lock}
                    onClick={onUseJailCard}
                  >
                    USE CARD
                  </Button>
                ),
                <Button
                  key="end"
                  variant="ghost"
                  size="sm"
                  onClick={onEndTurn}
                >
                  WAIT (Roll)
                </Button>,
              ];
            })()}

            {/* Auction phase */}
            {phase === 'AUCTION' && auction && (() => {
              const isBidder = !auction.passedPlayerIds.includes(currentPlayer?.id ?? '');
              const nextBid = auction.currentBid + auction.bidIncrement;
              const canBid = isBidder && (currentPlayer?.cash ?? 0) >= nextBid;
              return [
                <div key="auction" className="flex items-center gap-2">
                  <span className="text-text-muted text-xs">
                    Current: {formatRupees(auction.currentBid)}
                  </span>
                  {isMyTurnActive && canBid && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onPlaceBid(nextBid)}
                      >
                        BID +₹{auction.bidIncrement}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onPassAuction}
                      >
                        PASS
                      </Button>
                    </>
                  )}
                </div>
              ];
            })()}

            {/* Construction (only when not in a decision phase) */}
            {showConstruction && buildableProps.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-text-muted text-xs">Build:</span>
                {buildableProps.map(pos => {
                  const tile = BOARD_TILES[pos];
                  const canBuild = (currentPlayer?.cash ?? 0) >= (tile.houseCost ?? 0);
                  return (
                    <Button
                      key={`h-${pos}`}
                      variant="ghost"
                      size="xs"
                      icon={Home}
                      onClick={() => onBuildHouse(pos)}
                      disabled={!canBuild}
                    >
                      {tile.name.slice(0, 8)}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Hotel construction */}
            {showConstruction && currentPlayer && (() => {
              const hotelable = currentPlayer.ownedProperties.filter(pos => {
                const tile = BOARD_TILES[pos];
                const prop = gameState.properties.find(p => p.position === pos);
                if (!tile || !tile.group || !prop || prop.ownerId !== currentPlayer.id || prop.hasHotel) return false;
                const group = PROPERTY_GROUPS[tile.group];
                if (!group) return false;
                const allOwned = group.members.every(m => {
                  const p = gameState.properties.find(pp => pp.position === m);
                  return p && p.ownerId === currentPlayer.id && p.houses === 3 && !p.hasHotel;
                });
                return allOwned;
              });
              return hotelable.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-text-muted text-xs">Hotel:</span>
                  {hotelable.map(pos => {
                    const tile = BOARD_TILES[pos];
                    return (
                      <Button
                        key={`ht-${pos}`}
                        variant="ghost"
                        size="xs"
                        icon={Hotel}
                        onClick={() => onBuildHotel(pos)}
                      >
                        {tile.name.slice(0, 8)}
                      </Button>
                    );
                  })}
                </div>
              ) : null;
            })()}

            {/* Mortgage / Release */}
            {showConstruction && mortgageableProps.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-text-muted text-xs">Mortgage:</span>
                {mortgageableProps.slice(0, 3).map(pos => {
                  const tile = BOARD_TILES[pos];
                  return (
                    <Button
                      key={`m-${pos}`}
                      variant="ghost"
                      size="xs"
                      icon={Lock}
                      onClick={() => onMortgage(pos)}
                    >
                      {tile.name.slice(0, 8)}
                    </Button>
                  );
                })}
              </div>
            )}

            {showConstruction && releasableProps.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-text-muted text-xs">Release:</span>
                {releasableProps.slice(0, 3).map(pos => {
                  const tile = BOARD_TILES[pos];
                  return (
                    <Button
                      key={`r-${pos}`}
                      variant="ghost"
                      size="xs"
                      icon={Unlock}
                      onClick={() => onReleaseMortgage(pos)}
                    >
                      {tile.name.slice(0, 8)}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Trade */}
            {isMyTurnActive && phase === 'WAITING_FOR_ROLL' && settings.tradingEnabled && (
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowLeftRight}
                onClick={onTrade}
              >
                TRADE
              </Button>
            )}

            {/* Incoming trade */}
            {myTrades.length > 0 && (
              <motion.div
                className="flex items-center gap-1 text-xs text-gold"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <AlertCircle size={12} />
                <span>{myTrades.length} trade offer(s)</span>
              </motion.div>
            )}

            {/* Pending trade indicator */}
            {pendingTrades.filter(t => t.fromPlayerId === currentPlayer?.id).length > 0 && (
              <span className="text-text-muted text-xs">
                Offer pending...
              </span>
            )}

            {/* End turn / bankrupcy */}
            {isMyTurnActive && phase === 'WAITING_FOR_ROLL' && !currentPlayer?.isBot && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEndTurn}
              >
                END TURN
              </Button>
            )}

            {phase === 'BANKRUPTCY_RESOLUTION' && isMyTurn && (
              <Button
                variant="danger"
                size="sm"
                icon={AlertCircle}
                onClick={() => onDeclareBankruptcy('Unable to pay debts')}
              >
                DECLARE BANKRUPTCY
              </Button>
            )}

            {/* Not your turn indicator */}
            {!isMyTurn && phase === 'WAITING_FOR_ROLL' && (
              <span className="text-text-muted text-xs">
                Waiting for {currentPlayer?.name}'s turn…
              </span>
            )}
          </div>

          {/* Cash display */}
          {currentPlayer && (phase === 'WAITING_FOR_ROLL' || phase === 'PROPERTY_DECISION') && (
            <div className="flex items-center gap-2 text-xs flex-shrink-0 pl-3 border-l border-border-subtle">
              <span className="text-text-muted">Cash</span>
              <span className="text-success font-bold">{formatRupees(currentPlayer.cash)}</span>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted">Net</span>
              <span className="text-gold font-bold">{formatRupees(currentPlayer.netWorth)}</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
