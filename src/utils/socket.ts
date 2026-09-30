// ============================================================
// BUSINESS BHARAT — Socket.IO Client
// Provides a typed Socket.IO client connection to the game server.
// ============================================================

import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types/socket';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

let socket: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Connected to server');
      const savedPlayerId = localStorage.getItem('bb-player-id');
      const savedRoomId = localStorage.getItem('bb-room-id');
      if (savedPlayerId && savedRoomId) {
        (socket as Socket<any, any>).emit('reconnect_attempt', { roomId: savedRoomId, playerId: savedPlayerId });
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[SOCKET] Disconnected:', reason);
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[SOCKET] Connection error:', err.message);
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emit<K extends keyof ClientToServerEvents>(
  event: K,
  ...args: Parameters<ClientToServerEvents[K]>
): void {
  const s = getSocket();
  (s.emit as any)(event, ...args);
}

export function on<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): void {
  const s = getSocket();
  (s.on as any)(event, handler);
}

export function off<K extends keyof ServerToClientEvents>(
  event: K,
  handler?: ServerToClientEvents[K]
): void {
  const s = getSocket();
  (s.off as any)(event, handler);
}
