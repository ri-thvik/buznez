// ============================================================
// BUSINESS BHARAT — Game Page
// Full game layout: Left Sidebar + Board + Right Sidebar
// Integrates with both local engine and Socket.IO multiplayer.
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { createDefaultPlayers } from '@/utils/createDefaultPlayers';
import { useSocket } from '@/context/SocketContext';
import { Board } from '@/components/board/Board';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { ActionBar } from '@/components/layout/ActionBar';
import { GameHeader } from '@/components/layout/GameHeader';
import type { GameState } from '@/types/game';
import { PropertyModal } from '@/components/game/PropertyModal';
import { BuyDecisionModal } from '@/components/game/BuyDecisionModal';
import { AuctionModal } from '@/components/game/AuctionModal';
import { TradeModal } from '@/components/game/TradeModal';
import { JailModal } from '@/components/game/JailModal';
import { CardModal } from '@/components/game/CardModal';
import { VictoryModal } from '@/components/game/VictoryModal';
import { BankruptcyModal } from '@/components/game/BankruptcyModal';
import type { PropertyState, BoardTileData } from '@/types/game';
import type { TradeOffer } from '@/types/game';

export function GamePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const {
    gameState: localGameState,
    startGame,
    rollDice: localRollDice,
    buyProperty: localBuy,
    declineProperty: localDecline,
    endTurn: localEndTurn,
    placeBid: localBid,
    passAuction: localPass,
    buildHouse: localBuildHouse,
    buildHotel: localBuildHotel,
    mortgageProperty: localMortgage,
    releaseMortgage: localRelease,
    createTradeOffer: localTrade,
    respondToTrade: localRespondTrade,
    payJailFine: localPayJail,
    useJailCard: localUseJail,
    declareBankruptcy: localBankrupt,
    localPlayerId: localEnginePlayerId,
  } = useGame();
  const socket = useSocket();

  const isOnlineMode = !!params.roomId;
  const socketGameState = socket.gameState;
  const currentGameState = isOnlineMode ? socketGameState : localGameState;
  const localPlayerId: string | undefined = isOnlineMode
    ? socket.localPlayerId ?? undefined
    : localEnginePlayerId;

  // Room code drives the header/sidebar label. The online route is
  // /game/:roomId, so prefer the socket room code and fall back to the
  // route param, then to a local-mode label.
  const roomCode = isOnlineMode
    ? (socket.roomInfo?.roomCode ?? params.roomId ?? 'ONLINE')
    : 'BB-LOCAL';

  // Modal states
  const [propertyModal, setPropertyModal] = useState<{
    open: boolean;
    tile: BoardTileData | null;
    prop: PropertyState | null;
  }>({ open: false, tile: null, prop: null });
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [jailModalOpen, setJailModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [victoryModalOpen, setVictoryModalOpen] = useState(false);
  const [bankruptcyModalOpen, setBankruptcyModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [activeTrade, setActiveTrade] = useState<TradeOffer | null>(null);

  // Initialize game (local mode only)
  useEffect(() => {
    if (currentGameState || isOnlineMode) return;

    const raw = sessionStorage.getItem('bb-game-config');
    let config: any = null;
    if (raw) {
      try {
        config = JSON.parse(raw);
      } catch {
        config = null;
      }
    }

    if (config?.slots?.length) {
      const players = config.slots.map((slot: any) => ({
        id: crypto.randomUUID?.() ?? String(Math.random()),
        name: slot.name,
        color: slot.color,
        tokenShape: slot.token,
        isBot: slot.isBot,
        botDifficulty: slot.isBot ? (config.settings.botDifficulty as 'EASY' | 'NORMAL' | 'HARD') : undefined,
      }));
      startGame(players);
    } else {
      const players = createDefaultPlayers('Player 1', 3);
      startGame(players);
    }
  }, [currentGameState, isOnlineMode, startGame]);

  // Redirect if no game after timeout
  useEffect(() => {
    if (currentGameState || isOnlineMode) return;
    const timeout = setTimeout(() => {
      navigate('/lobby');
    }, 3000);
    return () => clearTimeout(timeout);
  }, [currentGameState, isOnlineMode, navigate]);

  // Check for modals based on game state
  useEffect(() => {
    if (currentGameState) {
      if (currentGameState.phase === 'JAIL_DECISION') setJailModalOpen(true);
      if (currentGameState.winner) setVictoryModalOpen(true);
      if (currentGameState.auction?.isActive) setAuctionModalOpen(true);
      if (currentGameState.activeTrade) {
        setActiveTrade(currentGameState.activeTrade);
        setTradeModalOpen(true);
      }
    }
  }, [currentGameState, isOnlineMode]);

  // Game actions — local mode drives the in-browser engine, online mode emits socket events
  const handleRollDice = () => {
    if (isOnlineMode) socket.rollDice();
    else localRollDice();
  };

  const handlePropertyClick = (tile: BoardTileData) => {
    if (tile.type !== 'PROPERTY' || !tile.price) return;
    if (!currentGameState) return;
    const prop = currentGameState.properties.find(p => p.position === tile.position);
    if (!prop) return;
    setPropertyModal({ open: true, tile, prop });
  };

  const currentPlayer = currentGameState
    ? currentGameState.players.find(p => p.id === currentGameState.currentPlayerId)
    : undefined;

  const handleBuildHouse = (position: number) => {
    if (isOnlineMode) socket.buildHouse(position);
    else localBuildHouse(position);
  };

  const handleBuildHotel = (position: number) => {
    if (isOnlineMode) socket.buildHotel(position);
    else localBuildHotel(position);
  };

  const handleMortgage = (position: number) => {
    if (isOnlineMode) socket.mortgageProperty(position);
    else localMortgage(position);
  };

  const handleReleaseMortgage = (position: number) => {
    if (isOnlineMode) socket.releaseMortgage(position);
    else localRelease(position);
  };

  const handleCardContinue = () => {
    setCardModalOpen(false);
    setActiveCard(null);
  };

  const handleTradeClose = () => {
    setTradeModalOpen(false);
    setActiveTrade(null);
  };

  const actions = {
    onRollDice: handleRollDice,
    onBuyProperty: () => { if (isOnlineMode) socket.buyProperty(); else localBuy(); },
    onDeclineProperty: () => { if (isOnlineMode) socket.declineProperty(); else localDecline(); },
    onEndTurn: () => { if (isOnlineMode) socket.endTurn(); else localEndTurn(); },
    onPlaceBid: (amount: number) => { if (isOnlineMode) socket.placeBid(amount); else localBid(amount); },
    onPassAuction: () => { if (isOnlineMode) socket.passAuction(); else localPass(); },
    onBuildHouse: handleBuildHouse,
    onBuildHotel: handleBuildHotel,
    onMortgage: handleMortgage,
    onReleaseMortgage: handleReleaseMortgage,
    onTrade: () => setTradeModalOpen(true),
    onPayJailFine: () => { if (isOnlineMode) socket.payJailFine(); else localPayJail(); },
    onUseJailCard: () => { if (isOnlineMode) socket.useJailCard(); else localUseJail(); },
    onDeclareBankruptcy: (reason: string) => {
      if (isOnlineMode) socket.declareBankruptcy(reason);
      else localBankrupt(reason);
    },
  };

  // Dev/test hook: mirror the authoritative server state onto window so
  // automated multi-browser tests can assert cross-client sync. Declared
  // before the early return below so hook order stays stable.
  useEffect(() => {
    if (import.meta.env.DEV) (window as any).__BB_STATE__ = currentGameState;
  }, [currentGameState]);

  if (!currentGameState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0916' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Initialising game…</p>
        </div>
      </div>
    );
  }

  const state = currentGameState;

  const notMortgaged = (pos: number) => {
    const p = state.properties.find(pp => pp.position === pos);
    return !!p && !p.isMortgaged && p.ownerId === localPlayerId;
  };
  const hasHouses3 = (pos: number) => {
    const p = state.properties.find(pp => pp.position === pos);
    return !!p && p.houses >= 3 && !p.hasHotel && p.ownerId === localPlayerId;
  };
  const isMortgagedProp = (pos: number) => {
    return state.properties.find(pp => pp.position === pos)?.isMortgaged ?? false;
  };

  /**
   * Every phase maps to a short human label so there is never a blank or
   * oversized empty status area. Unknown phases fall back to the raw value.
   */
  const phaseLabel = (gs: GameState): string => {
    const cp = gs.players.find(p => p.id === gs.currentPlayerId);
    const who = cp ? cp.name : 'Nobody';
    switch (gs.phase) {
      case 'WAITING_FOR_PLAYERS':  return 'Waiting for players';
      case 'WAITING_FOR_ROLL':      return `${who} — roll dice`;
      case 'ROLLING_DICE':          return `${who} is rolling…`;
      case 'MOVING_PLAYER':         return `${who} is moving…`;
      case 'LANDING_RESOLUTION':    return 'Resolving tile…';
      case 'PROPERTY_DECISION':     return 'Property available';
      case 'AUCTION':               return 'Auction in progress';
      case 'PAYMENT':               return 'Rent payment due';
      case 'CONSTRUCTION':          return 'Construction';
      case 'TRADE':                 return 'Trade pending';
      case 'CARD_DRAW':             return 'Card drawn';
      case 'JAIL_DECISION':         return 'Jail — choose escape';
      case 'BANKRUPTCY_RESOLUTION': return 'Bankruptcy resolution';
      case 'GAME_OVER':             return 'Game over';
      default:                      return String(gs.phase);
    }
  };

  return (
    <div className="bb-app">
      {/* ── HEADER ────────────────────────────────────────── */}
      <GameHeader
        roomCode={roomCode}
        status={phaseLabel(state)}
        isOnline={isOnlineMode}
        onLeave={() => navigate('/')}
        onToggleLeft={() => setLeftOpen(v => !v)}
        onToggleRight={() => setRightOpen(v => !v)}
      />

      <div className="bb-app__middle">
        {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
        <LeftSidebar
          gameState={state}
          roomCode={roomCode}
          isOpen={leftOpen}
          onClose={() => setLeftOpen(false)}
          chatMessages={isOnlineMode ? socket.chatMessages : []}
          canChat={isOnlineMode}
          onSendChat={isOnlineMode ? socket.sendChat : undefined}
          localPlayerId={localPlayerId ?? null}
        />

        {/* ── BOARD (centre) ───────────────────────────────── */}
        <div className="bb-board-stage">
          <Board
            gameState={state}
            onRollDice={handleRollDice}
            localPlayerId={localPlayerId}
            onPropertyClick={handlePropertyClick}
          />
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────── */}
        <RightSidebar gameState={state} localPlayerId={localPlayerId} isOpen={rightOpen} onClose={() => setRightOpen(false)} />
      </div>

      {/* ── CONTEXT ACTION BAR ────────────────────────────── */}
      <div className="bb-actionbar">
        <ActionBar {...actions} gameState={state} localPlayerId={localPlayerId} />
      </div>

      {leftOpen && <div className="bb-scrim lg:hidden" onClick={() => setLeftOpen(false)} />}
      {rightOpen && <div className="bb-scrim lg:hidden" onClick={() => setRightOpen(false)} />}

      {/* ── Modals ────────────────────────────────────────── */}
      {propertyModal.open && propertyModal.tile && propertyModal.prop && (
        <PropertyModal
          isOpen={true}
          onClose={() => setPropertyModal({ open: false, tile: null, prop: null })}
          tile={propertyModal.tile!}
          propState={propertyModal.prop!}
          ownerName={
            propertyModal.prop!.ownerId
              ? state.players.find(p => p.id === propertyModal.prop!.ownerId)?.name
              : undefined
          }
          ownerColor={
            propertyModal.prop!.ownerId
              ? state.players.find(p => p.id === propertyModal.prop!.ownerId)?.color
              : undefined
          }
          isOwner={!!localPlayerId && propertyModal.prop!.ownerId === localPlayerId}
          canBuildHouse={notMortgaged(propertyModal.tile!.position)}
          canBuildHotel={hasHouses3(propertyModal.tile!.position)}
          isMortgaged={isMortgagedProp(propertyModal.tile!.position)}
          onBuildHouse={() => { handleBuildHouse(propertyModal.tile!.position); setPropertyModal({ open: false, tile: null, prop: null }); }}
          onBuildHotel={() => { handleBuildHotel(propertyModal.tile!.position); setPropertyModal({ open: false, tile: null, prop: null }); }}
          onReleaseMortgage={() => { handleReleaseMortgage(propertyModal.tile!.position); setPropertyModal({ open: false, tile: null, prop: null }); }}
        />
      )}

      {/* ── BUY / DECLINE decision (fixed overlay, phase-driven) ── */}
      {state.phase === 'PROPERTY_DECISION' && state.pendingPropertyDecision && (() => {
        const decisionTile = state.board.find(t => t.position === state.pendingPropertyDecision!.position);
        if (!decisionTile) return null;
        return (
          <BuyDecisionModal
            tile={decisionTile}
            currentPlayer={currentPlayer}
            isMyDecision={!isOnlineMode || localPlayerId === state.currentPlayerId}
            onBuy={() => actions.onBuyProperty()}
            onDecline={() => actions.onDeclineProperty()}
          />
        );
      })()}

      {auctionModalOpen && state.auction?.isActive && (
        <AuctionModal
          isOpen={true}
          onClose={() => setAuctionModalOpen(false)}
          auction={state.auction}
          gameStatePlayers={state.players}
          localPlayerId={localPlayerId}
          onPlaceBid={(amount) => { actions.onPlaceBid(amount); }}
          onPass={() => { actions.onPassAuction(); }}
        />
      )}

      <TradeModal
        isOpen={tradeModalOpen}
        onClose={handleTradeClose}
        gameState={state}
        localPlayerId={localPlayerId}
        trade={activeTrade}
        onProposeTrade={(offer) => { if (isOnlineMode) socket.createTradeOffer(offer); else localTrade(offer); handleTradeClose(); }}
        onAcceptTrade={(id) => { if (isOnlineMode) socket.respondToTrade(id, true); else localRespondTrade(id, true); handleTradeClose(); }}
        onDeclineTrade={(id) => { if (isOnlineMode) socket.respondToTrade(id, false); else localRespondTrade(id, false); handleTradeClose(); }}
      />

      {jailModalOpen && currentPlayer && (
      <JailModal
        isOpen={true}
        onClose={() => setJailModalOpen(false)}
        player={currentPlayer}
        onPayFine={() => { actions.onPayJailFine(); setJailModalOpen(false); }}
        onUseCard={() => { actions.onUseJailCard(); setJailModalOpen(false); }}
        onRollDice={handleRollDice}
        isCurrentPlayer={localPlayerId === state.currentPlayerId}
      />
      )}

      <CardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        card={activeCard}
        onContinue={handleCardContinue}
      />

      {victoryModalOpen && state.winner && (
      <VictoryModal
        isOpen={true}
        onClose={() => setVictoryModalOpen(false)}
        gameState={state}
        winner={state.winner}
        onPlayAgain={() => navigate('/')}
      />
      )}

      {bankruptcyModalOpen && currentPlayer && (
      <BankruptcyModal
        isOpen={true}
        onClose={() => setBankruptcyModalOpen(false)}
        player={currentPlayer}
        gameState={state}
        onDeclareBankruptcy={(reason) => { actions.onDeclareBankruptcy(reason); setBankruptcyModalOpen(false); }}
      />
      )}
    </div>
  );
}
