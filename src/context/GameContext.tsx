// ============================================================
// BUSINESS BHARAT — Game Context
// Provides GameState and engine actions to all components.
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import type {
  GameState, Player, TradeOffer,
} from '@/types/game';
import { GameEngine, createInitialGameState } from '@/engine/GameEngine';

interface GameContextValue {
  gameState: GameState | null;
  startGame: (players: Pick<Player, 'id' | 'name' | 'color' | 'tokenShape' | 'isBot' | 'botDifficulty'>[]) => void;
  rollDice: () => void;
  buyProperty: () => void;
  declineProperty: () => void;
  endTurn: () => void;
  placeBid: (amount: number) => void;
  passAuction: () => void;
  buildHouse: (position: number) => void;
  buildHotel: (position: number) => void;
  mortgageProperty: (position: number) => void;
  releaseMortgage: (position: number) => void;
  createTradeOffer: (offer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) => void;
  respondToTrade: (tradeId: string, accept: boolean) => void;
  counterTrade: (tradeId: string, counterOffer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) => void;
  payJailFine: () => void;
  useJailCard: () => void;
  declareBankruptcy: (reason: string) => void;
  isMyTurn: (playerId: string) => boolean;
  isLocalPlayerTurn: () => boolean;
  localPlayerId: string | undefined;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | undefined>(undefined);
  const engineRef = useRef<GameEngine | null>(null);
  const autoStartedRef = useRef<string | null>(null);

  const onStateChange = useCallback((newState: GameState) => {
    setGameState({ ...newState });
  }, []);

  const startGame = useCallback(
    (
      players: Pick<Player, 'id' | 'name' | 'color' | 'tokenShape' | 'isBot' | 'botDifficulty'>[]
    ) => {
      const initialState = createInitialGameState(players);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
      autoStartedRef.current = null;
      const engine = new GameEngine(initialState, onStateChange);
      engineRef.current = engine;
      // Local mode: the first non-bot player is the human at this keyboard.
      const human = players.find(p => !p.isBot) ?? players[0];
      setLocalPlayerId(human?.id);
      setGameState(engine.getState());
    },
    [onStateChange]
  );

  const rollDice = useCallback(() => engineRef.current?.rollDice(), []);
  const buyProperty = useCallback(() => engineRef.current?.buyProperty(), []);
  const declineProperty = useCallback(() => engineRef.current?.declineProperty(), []);
  const endTurn = useCallback(() => engineRef.current?.endTurn(), []);
  const placeBid = useCallback((amount: number) => engineRef.current?.placeBid(amount), []);
  const passAuction = useCallback(() => engineRef.current?.passAuction(), []);
  const buildHouse = useCallback((position: number) => engineRef.current?.buildHouse(position), []);
  const buildHotel = useCallback((position: number) => engineRef.current?.buildHotel(position), []);
  const mortgageProperty = useCallback((position: number) => engineRef.current?.mortgageProperty(position), []);
  const releaseMortgage = useCallback((position: number) => engineRef.current?.releaseMortgage(position), []);
  const createTradeOffer = useCallback(
    (offer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) => engineRef.current?.createTradeOffer(offer),
    []
  );
  const respondToTrade = useCallback((tradeId: string, accept: boolean) => engineRef.current?.respondToTrade(tradeId, accept), []);
  const counterTrade = useCallback(
    (tradeId: string, counterOffer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) =>
      engineRef.current?.counterTrade(tradeId, counterOffer),
    []
  );
  const payJailFine = useCallback(() => engineRef.current?.payJailFine(), []);
  const useJailCard = useCallback(() => engineRef.current?.useJailCard(), []);
  const declareBankruptcy = useCallback((reason: string) => {
    engineRef.current?.declareBankruptcy(reason);
  }, []);

  const isMyTurn = useCallback(
    (playerId: string) => gameState?.currentPlayerId === playerId,
    [gameState]
  );

  const isLocalPlayerTurn = useCallback(() => {
    return gameState?.currentPlayerId === localPlayerId;
  }, [gameState, localPlayerId]);

  // Start the game automatically after initial state is set (once per engine instance)
  useEffect(() => {
    if (
      gameState &&
      gameState.phase === 'WAITING_FOR_PLAYERS' &&
      gameState.gameStatus === 'LOBBY' &&
      engineRef.current &&
      autoStartedRef.current !== gameState.gameId
    ) {
      autoStartedRef.current = gameState.gameId;
      engineRef.current?.startGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.gameId, gameState?.phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        startGame,
        rollDice,
        buyProperty,
        declineProperty,
        endTurn,
        placeBid,
        passAuction,
        buildHouse,
        buildHotel,
        mortgageProperty,
        releaseMortgage,
        createTradeOffer,
        respondToTrade,
        counterTrade,
        payJailFine,
        useJailCard,
        declareBankruptcy,
        isMyTurn,
        isLocalPlayerTurn,
        localPlayerId,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within <GameProvider>');
  return ctx;
}
