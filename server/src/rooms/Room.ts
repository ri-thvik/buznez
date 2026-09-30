// ============================================================
// BUSINESS BHARAT — Room Model
// Represents a single game room with players and game state.
// ============================================================

import type { GameEngine } from '@/engine/GameEngine';
import type { GameSettings } from '@/types/game';

export type RoomStatus = 'WAITING' | 'STARTING' | 'PLAYING' | 'FINISHED' | 'CLOSED';

export interface RoomPlayer {
  id: string;          // player ID
  socketId: string;    // current socket ID
  name: string;
  color: string;
  tokenShape: string;
  isBot: boolean;
  isHost: boolean;
  isConnected: boolean;
  connectedAt: number;
}

export interface Room {
  roomId: string;
  roomCode: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  settings: Partial<GameSettings>;
  status: RoomStatus;
  createdAt: number;
  lastActivity: number;
  inviteLink: string;
  engine: GameEngine | null;
}
