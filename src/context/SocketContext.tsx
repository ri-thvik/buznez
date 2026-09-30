// ============================================================
// BUSINESS BHARAT — Socket Context
// Manages socket connection, room state, and game state
// synchronization from the server.
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { getSocket, disconnectSocket, emit, on, off } from '@/utils/socket';
import type { GameState, TradeOffer } from '@/types/game';
import type { RoomInfo, PlayerInfo, GameSettings } from '@/types/socket';

interface SocketContextValue {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  // Room state
  roomInfo: RoomInfo | null;
  localPlayerId: string | null;
  localPlayer: PlayerInfo | null;
  isHost: boolean;
  canStartGame: boolean;
  // Game state
  gameState: GameState | null;
  // Chat
  chatMessages: ChatMessage[];
  localPlayerName: string;
  // Actions
  createRoom: (data: {
    playerName: string;
    playerColor: string;
    tokenShape: string;
    maxPlayers: number;
    settings: Partial<GameSettings>;
  }) => void;
  joinRoom: (data: {
    roomCode: string;
    playerName: string;
    playerColor: string;
    tokenShape: string;
  }) => void;
  leaveRoom: () => void;
  setReady: () => void;
  startGame: () => void;
  // Game actions (emitted to server)
  rollDice: () => void;
  buyProperty: () => void;
  declineProperty: () => void;
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
  endTurn: () => void;
  sendChat: (message: string) => void;
  requestFullState: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

/** Normalised chat message shape used by the in-game chat panel. */
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  message: string;
  timestamp: number;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(
    () => localStorage.getItem('bb-player-id') ?? null
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [localPlayerName, setLocalPlayerName] = useState<string>(
    () => localStorage.getItem('bb-player-name') ?? 'Player'
  );

  const localPlayer = roomInfo
    ? roomInfo.players.find(p => p.id === localPlayerId) ?? null
    : null;

  const isHost = roomInfo ? roomInfo.hostId === localPlayerId : false;
  const canStartGame = roomInfo
    ? roomInfo.status === 'WAITING' &&
      roomInfo.players.length >= 1 &&
      (roomInfo.players.length >= 2 || (roomInfo.settings as any)?.botsEnabled !== false) &&
      roomInfo.players.every(p => p.isConnected)
    : false;

  // Initialize socket connection
  useEffect(() => {
    const s = getSocket();
    setIsConnecting(true);

    s.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', () => {
      setIsConnecting(false);
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('connect_error');
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleRoomCreated = (data: { roomCode: string; roomId: string; playerId: string }) => {
      localStorage.setItem('bb-room-id', data.roomId);
      localStorage.setItem('bb-player-id', data.playerId);
      setLocalPlayerId(data.playerId);
    };

    const handleRoomJoined = (data: { room: RoomInfo; playerId: string }) => {
      localStorage.setItem('bb-room-id', data.room.roomId);
      localStorage.setItem('bb-player-id', data.playerId);
      setLocalPlayerId(data.playerId);
      setRoomInfo(data.room);
    };

    const handlePlayerJoined = (player: PlayerInfo) => {
      setRoomInfo(prev =>
        prev ? {
          ...prev,
          players: [...prev.players, player],
        } : null
      );
    };

    const handlePlayerLeft = (playerId: string) => {
      setRoomInfo(prev =>
        prev ? {
          ...prev,
          players: prev.players.filter(p => p.id !== playerId),
        } : null
      );
    };

    const handlePlayerReady = (playerId: string) => {
      // In a full implementation, we'd track ready state in room info
      console.log('[SOCKET] Player ready:', playerId);
    };

    const handleGameStarted = (gameState: GameState) => {
      setGameState(gameState);
    };

    const handleGameStateUpdated = (state: GameState) => {
      setGameState(state);
    };

    const handleError = (message: string) => {
      console.error('[SOCKET] Server error:', message);
    };

    // Chat is broadcast by the server to everyone in the room.
    const handleChatMessage = (data: ChatMessage) => {
      setChatMessages(prev => {
        // De-dupe: reconnect can replay messages.
        if (prev.some(m => m.id === data.id)) return prev;
        const next = [...prev, data];
        // Keep memory bounded during long sessions.
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    };

    on('chat_message', handleChatMessage);

    on('room_created', handleRoomCreated);
    on('room_joined', handleRoomJoined);
    on('player_joined', handlePlayerJoined);
    on('player_left', handlePlayerLeft);
    on('player_ready', handlePlayerReady);
    on('game_started', handleGameStarted);
    on('game_state_updated', handleGameStateUpdated);
    on('error', handleError);

    return () => {
      off('room_created', handleRoomCreated);
      off('room_joined', handleRoomJoined);
      off('player_joined', handlePlayerJoined);
      off('player_left', handlePlayerLeft);
      off('player_ready', handlePlayerReady);
      off('game_started', handleGameStarted);
      off('game_state_updated', handleGameStateUpdated);
      off('error', handleError);
      off('chat_message', handleChatMessage);
    };
  }, []);

  // Actions
  const createRoom = useCallback((data: {
    playerName: string;
    playerColor: string;
    tokenShape: string;
    maxPlayers: number;
    settings: Partial<GameSettings>;
  }) => {
    localStorage.setItem('bb-player-name', data.playerName);
    setLocalPlayerName(data.playerName);
    emit('create_room', data);
  }, []);

  const joinRoom = useCallback((data: {
    roomCode: string;
    playerName: string;
    playerColor: string;
    tokenShape: string;
  }) => {
    localStorage.setItem('bb-player-name', data.playerName);
    setLocalPlayerName(data.playerName);
    emit('join_room', data);
  }, []);

  const leaveRoom = useCallback(() => {
    emit('leave_room');
    localStorage.removeItem('bb-room-id');
    localStorage.removeItem('bb-player-id');
    setRoomInfo(null);
    setGameState(null);
    setLocalPlayerId(null);
    disconnectSocket();
  }, []);

  const setReady = useCallback(() => {
    emit('ready');
  }, []);

  const startGame = useCallback(() => {
    emit('start_game');
  }, []);

  const rollDice = useCallback(() => emit('roll_dice'), []);
  const buyProperty = useCallback(() => emit('buy_property'), []);
  const declineProperty = useCallback(() => emit('decline_property'), []);
  const placeBid = useCallback((amount: number) => emit('bid', amount), []);
  const passAuction = useCallback(() => emit('pass_auction'), []);
  const buildHouse = useCallback((position: number) => emit('build', { position, type: 'house' }), []);
  const buildHotel = useCallback((position: number) => emit('build', { position, type: 'hotel' }), []);
  const mortgageProperty = useCallback((position: number) => emit('mortgage', position), []);
  const releaseMortgage = useCallback((position: number) => emit('release_mortgage', position), []);
  const createTradeOffer = useCallback(
    (offer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) =>
      emit('trade_offer', offer),
    []
  );
  const respondToTrade = useCallback(
    (tradeId: string, accept: boolean) =>
      emit(accept ? 'trade_accept' : 'trade_decline', tradeId),
    []
  );
  const counterTrade = useCallback(
    (tradeId: string, counterOffer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }) =>
      emit('trade_counter', { tradeId, offer: counterOffer }),
    []
  );
  const payJailFine = useCallback(() => emit('jail_action', { method: 'pay' }), []);
  const useJailCard = useCallback(() => emit('jail_action', { method: 'card' }), []);
  const declareBankruptcy = useCallback((reason: string) => emit('declare_bankruptcy', reason), []);
  const endTurn = useCallback(() => emit('end_turn'), []);
  const sendChat = useCallback((message: string) => emit('chat_message', message), []);
  const requestFullState = useCallback(() => emit('request_full_state'), []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        isConnecting,
        roomInfo,
        localPlayerId,
        localPlayer,
        isHost,
        canStartGame,
        gameState,
        chatMessages,
        localPlayerName,
        createRoom,
        joinRoom,
        leaveRoom,
        setReady,
        startGame,
        rollDice,
        buyProperty,
        declineProperty,
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
        endTurn,
        sendChat,
        requestFullState,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within <SocketProvider>');
  return ctx;
}
