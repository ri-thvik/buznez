// ============================================================
// BUSINESS BHARAT ¯¿½ Board Center
//
// Occupies the 9¯¿½9 interior of the 11¯¿½11 board grid.
// Contains: branding, current turn, dice, messages.
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { Dices, RotateCcw } from 'lucide-react';
import type { GameState } from '@/types/game';
import { formatRupees } from '@/types/game';
import { Button } from '@/components/ui/Button';


// ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ 3D Die Face ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

interface DieFaceProps {
  value: number;
  size?: number;
  isRolling?: boolean;
}

function DieFace({ value, size = 52, isRolling = false }: DieFaceProps) {
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[1];
  const dotSize = Math.round(size * 0.14);

  return (
    <motion.div
      className="die-face relative flex-shrink-0"
      style={{ width: size, height: size }}
      animate={
        isRolling
          ? { rotate: [0, 15, -15, 10, -5, 0], scale: [1, 1.05, 0.97, 1.03, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        isRolling
          ? { duration: 0.9, ease: 'easeInOut' }
          : { duration: 0.2 }
      }
    >
      {dots.map(([cx, cy], i) => (
        <div
          key={i}
          className="die-dot absolute"
          style={{
            width: dotSize,
            height: dotSize,
            left: `calc(${cx}% - ${dotSize / 2}px)`,
            top:  `calc(${cy}% - ${dotSize / 2}px)`,
          }}
        />
      ))}
    </motion.div>
  );
}

// ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ Dice pair ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½

// ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ Main Board Center ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½

interface BoardCenterProps {
  gameState: GameState;
  onRollDice: () => void;
  currentPlayerId?: string; // the local human player's ID
}

export function BoardCenter({ gameState, onRollDice, currentPlayerId }: BoardCenterProps) {
  // currentPlayer can legitimately be undefined (players can leave / go
  // bankrupt mid-turn). Everything below is guarded accordingly.
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const isMyTurn = !!currentPlayerId && currentPlayerId === gameState.currentPlayerId;
  const isRolling = gameState.phase === 'ROLLING_DICE' || gameState.phase === 'MOVING_PLAYER';
  const canRoll   = gameState.phase === 'WAITING_FOR_ROLL' && isMyTurn;

  // Dice scale with the board so they never overflow the centre cell.
  const dieSize = gameState.phase === 'GAME_OVER' ? 40 : 52;

  // Values shown while idle; randomised faces only while actually rolling.
  const d1 = isRolling ? Math.ceil(Math.random() * 6) : (gameState.lastRoll?.die1 ?? 1);
  const d2 = isRolling ? Math.ceil(Math.random() * 6) : (gameState.lastRoll?.die2 ?? 1);

  // Compact one-line status. Short by design ¯¿½ rendered inside a
  // max-width badge so it can never stretch the board layout.
  const statusMessage: string | null = (() => {
    const who = currentPlayer?.name ?? 'Player';
    switch (gameState.phase) {
      case 'ROLLING_DICE':       return `${who} is rolling...`;
      case 'MOVING_PLAYER':      return `${who} is moving...`;
      case 'LANDING_RESOLUTION': return 'Resolving tile...';
      case 'CARD_DRAW':          return 'Drawing a card...';
      case 'AUCTION':            return 'Auction in progress...';
      case 'PROPERTY_DECISION':  return 'Property available';
      case 'PAYMENT':            return 'Rent payment due';
      case 'CONSTRUCTION':       return 'Construction&';
      case 'TRADE':              return 'Trade pending';
      case 'JAIL_DECISION':      return 'Choose jail escape';
      case 'GAME_OVER':          return 'Game over';
      default:                   return null;
    }
  })();

return (
    <div
      style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
      className="relative flex flex-col items-center justify-center gap-2.5 p-3 overflow-hidden bg-gradient-to-b from-bg-secondary to-bg-base"
    >
      {/* ¯¿½¯¿½¯¿½¯¿½ Brand ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ */}
      <div className="text-center flex-shrink-0">
        <h1
          className="font-display font-bold gradient-text leading-none"
          style={{ fontSize: 'clamp(13px, 2.6cqw, 24px)', letterSpacing: '0.06em' }}
        >
          BUSINESS BHARAT
        </h1>
        <div className="mt-1.5 h-px bg-border-subtle opacity-60" />
      </div>

      {/* ¯¿½¯¿½¯¿½¯¿½ Current turn ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ */}
      <div className="text-center flex-shrink-0">
        {currentPlayer ? (
          <>
            <div
              className="font-semibold uppercase tracking-widest leading-none"
              style={{ color: currentPlayer.color, fontSize: 'clamp(8px, 1.3cqw, 11px)' }}
            >
              {isRolling ? 'Rolling...' : isMyTurn ? 'Your Turn' : 'Current Turn'}
            </div>
            <div
              className="font-display font-bold text-text-primary mt-0.5 leading-tight"
              style={{ fontSize: 'clamp(12px, 2cqw, 20px)' }}
            >
              {currentPlayer.name.toUpperCase()}
            </div>
            {gameState.lastRoll?.isDouble && gameState.phase === 'WAITING_FOR_ROLL' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-gold font-bold leading-tight"
                style={{ fontSize: 'clamp(8px, 1.3cqw, 12px)' }}
              >
                Double! Roll again.
              </motion.div>
            )}
          </>
        ) : (
          <div className="text-text-muted" style={{ fontSize: 12 }}>
            Waiting for players...
          </div>
        )}
      </div>

      {/* ¯¿½¯¿½¯¿½¯¿½ Dice ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <DieFace value={d1} size={dieSize} isRolling={isRolling} />
          <DieFace value={d2} size={dieSize} isRolling={isRolling} />
        </div>

        <AnimatePresence mode="wait">
          {gameState.lastRoll && !isRolling && (
            <motion.div
              key={gameState.lastRoll.total}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center leading-none"
            >
              <span className="text-text-muted" style={{ fontSize: 11 }}>
                {gameState.lastRoll.die1} + {gameState.lastRoll.die2} ={' '}
              </span>
              <span className="font-bold text-text-primary" style={{ fontSize: 14 }}>
                {gameState.lastRoll.total}
              </span>
              {gameState.lastRoll.isDouble && (
                <span className="ml-1 text-gold font-bold" style={{ fontSize: 11 }}>DOUBLE!</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ¯¿½¯¿½¯¿½¯¿½ Compact status badge (never affects layout) ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="bb-status-badge"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentPlayer?.color ?? '#8B5CF6' }}
            />
            <span className="truncate text-text-secondary">{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ¯¿½¯¿½¯¿½¯¿½ Roll button (human's turn only) ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ */}
      {isMyTurn && gameState.phase !== 'GAME_OVER' && (
        <div className="flex-shrink-0">
          <Button
            variant={canRoll ? 'primary' : 'secondary'}
            size="sm"
            icon={canRoll ? Dices : RotateCcw}
            disabled={!canRoll}
            onClick={onRollDice}
          >
            {canRoll ? 'Roll Dice' : 'Wait...'}
          </Button>
        </div>
      )}

      {/* ¯¿½¯¿½¯¿½¯¿½ Turn number ¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½¯¿½ */}
      <div className="flex-shrink-0 text-text-muted" style={{ fontSize: 9 }}>
        Turn {gameState.turnNumber}
      </div>

      {/* Context panels: fill the centre so there is no empty void */}
      <div className="bb-center-panels">
        <div className="bb-center-panel">
          <div className="bb-center-panel__title">Standings</div>
          <div className="flex flex-col gap-1">
            {[...gameState.players]
              .sort((a, b) => b.netWorth - a.netWorth)
              .slice(0, 4)
              .map(p => (
                <div key={p.id} className="flex items-center gap-1.5" style={{ fontSize: 'clamp(8px, 1.15cqw, 11px)' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate" style={{ color: p.id === gameState.currentPlayerId ? '#F8F7FB' : '#B8AEC9' }}>{p.name}</span>
                  <span className="ml-auto text-gold font-bold whitespace-nowrap">{formatRupees(p.netWorth)}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="bb-center-panel">
          <div className="bb-center-panel__title">Recent</div>
          <div className="flex flex-col gap-0.5">
            {gameState.events.slice(-4).reverse().map(e => (
              <p key={e.id} className="text-text-muted leading-tight" style={{ fontSize: 'clamp(7.5px, 1.05cqw, 10.5px)' }}>{e.message}</p>
            ))}
            {gameState.events.length === 0 && (
              <p className="text-text-muted" style={{ fontSize: 10 }}>No events yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


