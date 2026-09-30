// ============================================================
// BUSINESS BHARAT - Right Sidebar
// Player list with stats, incoming trades
// ============================================================

import React from 'react';
import { TrendingUp, Home, ArrowLeftRight, Briefcase, Building2, Car, Coins, X, type LucideIcon } from 'lucide-react';
import type { GameState, Player, TokenShape } from '@/types/game';
import { formatRupees } from '@/types/game';

const TOKEN_ICONS: Record<TokenShape, LucideIcon> = {
  BRIEFCASE: Briefcase,
  BUILDING:  Building2,
  CAR:       Car,
  COIN:      Coins,
};

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  propertyCount: number;
  team?: string | null;
  isConnected?: boolean;
  /** True only for the human looking at this screen. */
  isLocalPlayer: boolean;
}

function PlayerCard({ player, isCurrentTurn, propertyCount, team, isConnected = true, isLocalPlayer }: PlayerCardProps) {
  const TokenIcon = TOKEN_ICONS[player.tokenShape] ?? Briefcase;

  return (
    <div
      className={[
        'rounded-lg px-2.5 py-2 border transition-all relative',
        isCurrentTurn
          ? 'border-brand-bright bg-brand/10 shadow-[0_0_14px_rgba(124,58,237,0.35)]'
          : 'border-border-subtle bg-bg-elevated/50',
        player.isBankrupt ? 'opacity-40' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        {/* Token avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: player.color,
            boxShadow: isCurrentTurn ? `0 0 12px ${player.color}60` : undefined,
          }}
        >
          <TokenIcon size={13} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-text-primary font-semibold truncate" style={{ fontSize: 12 }}>
              {player.name}
            </span>
            {isLocalPlayer ? (
              <span className="text-brand-bright bg-brand/20 px-1 rounded" style={{ fontSize: 8 }}>YOU</span>
            ) : player.isBot ? (
              <span className="text-text-muted bg-bg-base px-1 rounded" style={{ fontSize: 8 }}>BOT</span>
            ) : (
              <span className="text-text-muted bg-bg-base px-1 rounded" style={{ fontSize: 8 }}>HUMAN</span>
            )}
            {team && (
              <span
                className="px-1 rounded font-semibold"
                style={{ fontSize: 8, background: `${team}22`, color: team }}
              >
                {team}
              </span>
            )}
          </div>
          <div className="text-success font-bold leading-tight" style={{ fontSize: 12 }}>
            {formatRupees(player.cash)}
          </div>
        </div>

        {/* Connection dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: isConnected ? '#39D98A' : '#F05252' }}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2.5 mt-1.5">
        <div className="flex items-center gap-1 text-text-muted" style={{ fontSize: 9.5 }}>
          <Home size={9} />
          <span>{propertyCount} prop</span>
        </div>
        <div className="flex items-center gap-1 text-text-muted" style={{ fontSize: 9.5 }}>
          <TrendingUp size={9} />
          <span>Net {formatRupees(player.netWorth)}</span>
        </div>
      </div>

      {/* Active turn badge — only for the local player, since the other
          players' turn state is already shown in the header/action bar. */}
      {isCurrentTurn && isLocalPlayer && !player.isBankrupt && (
        <span
          className="absolute -top-1.5 -right-1 px-1.5 py-0.5 rounded-full bg-brand-bright text-white font-bold shadow-lg"
          style={{ fontSize: 8 }}
        >
          YOUR TURN
        </span>
      )}
    </div>
  );
}

interface RightSidebarProps {
  gameState: GameState | null;
  /** Id of the human viewing this screen; drives the YOU / YOUR TURN badges. */
  localPlayerId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function RightSidebar({ gameState, localPlayerId, isOpen = false, onClose }: RightSidebarProps) {
  if (!gameState) {
    return (
      <aside className={`bb-sidebar bb-sidebar--right ${isOpen ? 'is-open' : ''}`}>
        <p className="text-text-muted text-sm m-auto">No game active.</p>
      </aside>
    );
  }

  const { players, currentPlayerId, pendingTrades } = gameState;

return (
    <aside className={`bb-sidebar bb-sidebar--right ${isOpen ? 'is-open' : ''}`}>
      <div className="p-3 border-b border-border-subtle flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
          Players
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="bb-drawer-toggle text-text-muted hover:text-text-primary transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 space-y-1.5">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayerId}
              propertyCount={player.ownedProperties.length}
              team={(player as any).teamColor ?? null}
              isConnected={(player as any).isConnected !== false}
              isLocalPlayer={player.id === localPlayerId}
            />
          ))}
        </div>

        <div className="p-3 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              Trades
            </h2>
            <ArrowLeftRight size={11} className="text-text-muted" />
            {pendingTrades.length > 0 && (
              <span className="text-xs bg-brand/20 text-brand-bright px-1.5 rounded-full">
                {pendingTrades.length}
              </span>
            )}
          </div>

          {pendingTrades.length === 0 ? (
            <p className="text-text-muted" style={{ fontSize: 10.5 }}>
              No active trades.
            </p>
          ) : (
            <div className="space-y-1.5">
              {pendingTrades.map(trade => {
                const from = players.find(p => p.id === trade.fromPlayerId);
                return (
                  <div
                    key={trade.id}
                    className="rounded-lg p-2 bg-bg-elevated border border-border-subtle"
                  >
                    <p className="text-text-secondary" style={{ fontSize: 10.5 }}>
                      Offer from <strong>{from?.name ?? 'Unknown'}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
