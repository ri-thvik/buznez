// ============================================================
// BUSINESS BHARAT — Room Manager
// In-memory room storage with room code generation.
// Architecture supports Redis-backed storage later.
// ============================================================

import { generateRoomCode } from '@/engine/codeGenerator';
import type { Room, RoomPlayer } from './Room';
import { GameEngine, createInitialGameState } from '@/engine/GameEngine';
import type { GameState, Player, GameSettings } from '@/types/game';
import type { Server } from 'socket.io';

/**
 * Returns `requested` when it is set and not already taken, otherwise the first
 * unused entry of `palette`. Falls back to a deterministic hue once the palette
 * is exhausted, so a late joiner never shares another player's colour.
 */
function pickDistinct(
  requested: string | undefined,
  used: string[],
  palette: string[]
): string {
  if (requested && !used.includes(requested)) return requested;
  const free = palette.find(c => !used.includes(c));
  if (free) return free;
  let hue = 0;
  while (used.includes(`hsl(${hue}, 70%, 55%)`)) hue += 47;
  return `hsl(${hue}, 70%, 55%)`;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private roomCodes: Set<string> = new Set();
  private io: Server;
  private readonly DISCONNECT_TIMEOUT = 60000; // 60 seconds

  constructor(io: Server) {
    this.io = io;
  }

  // ─── Room CRUD ───────────────────────────────────────────────

  createRoom(playerName: string, socketId: string, settings?: Partial<GameSettings>, color?: string, tokenShape?: string): { room: Room; playerId: string } {
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (this.roomCodes.has(roomCode));

    this.roomCodes.add(roomCode);

    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Assign default color/token
    const playerColors = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
    const tokenShapes = ['BRIEFCASE', 'BUILDING', 'CAR', 'COIN', 'BUS', 'FACTORY', 'CROWN', 'DIAMOND', 'ROCKET', 'GLOBE'];

    const room: Room = {
      roomId,
      roomCode,
      hostId: playerId,
      players: [
        {
          id: playerId,
          socketId,
          name: playerName || 'Player',
          color: color || playerColors[0],
          tokenShape: tokenShape || tokenShapes[0],
          isBot: false,
          isHost: true,
          isConnected: true,
          connectedAt: Date.now(),
        },
      ],
      maxPlayers: settings?.playerCount ?? 4,
      settings: settings ?? {},
      status: 'WAITING',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      inviteLink: `${roomCode}`,
      engine: null,
    };

    this.rooms.set(roomId, room);
    this.rooms.set(roomCode, room); // also findable by code

    return { room, playerId };
  }

  joinRoom(roomCode: string, playerName: string, socketId: string, color?: string, tokenShape?: string): { room: Room; playerId: string } | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.status !== 'WAITING') return null;
    if (room.players.length >= room.maxPlayers) return null;

    const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const playerColors = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
    const usedColors = room.players.map(p => p.color);
    const tokenShapes = ['BRIEFCASE', 'BUILDING', 'CAR', 'COIN', 'BUS', 'FACTORY', 'CROWN', 'DIAMOND', 'ROCKET', 'GLOBE'];
    const usedTokens = room.players.map(p => p.tokenShape);

    // Colours and tokens must be visually distinct on a shared board, so the
    // server enforces uniqueness. A client-requested value is only honoured if
    // no one already uses it; otherwise the next free option is assigned.
    const p: RoomPlayer = {
      id: playerId,
      socketId,
      name: playerName || 'Player',
      color: pickDistinct(color, usedColors, playerColors),
      tokenShape: pickDistinct(tokenShape, usedTokens, tokenShapes),
      isBot: false,
      isHost: false,
      isConnected: true,
      connectedAt: Date.now(),
    };

    room.players.push(p);
    room.lastActivity = Date.now();

    return { room, playerId };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.engine) {
        room.engine.destroy();
      }
      this.rooms.delete(room.roomId);
      this.rooms.delete(room.roomCode);
      this.roomCodes.delete(room.roomCode);
    }
  }

  // ─── Player management ───────────────────────────────────────

  removePlayer(socketId: string): { room: Room; playerId: string } | null {
    for (const [key, room] of this.rooms.entries()) {
      if (key !== room.roomId) continue;
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        player.isConnected = false;
        player.connectedAt = Date.now();
        room.lastActivity = Date.now();

        // Schedule cleanup if all disconnected
        setTimeout(() => {
          const updatedRoom = this.rooms.get(room.roomId);
          if (!updatedRoom) return;
          const stillDisconnected = updatedRoom.players.filter(p => !p.isConnected);
          if (stillDisconnected.length === updatedRoom.players.length && updatedRoom.status === 'PLAYING') {
            // All players disconnected — keep room for a while in case host returns
          }
          const allAway = updatedRoom.players.every(p => !p.isConnected);
          if (allAway && updatedRoom.status !== 'PLAYING') {
            this.removeRoom(updatedRoom.roomId);
          } else if (allAway && updatedRoom.status === 'PLAYING') {
            // Give 90s grace period
            setTimeout(() => {
              const r = this.rooms.get(updatedRoom.roomId);
              if (r && r.players.every(p => !p.isConnected) && r.status === 'PLAYING') {
                this.removeRoom(r.roomId);
              }
            }, 90000);
          }
        }, this.DISCONNECT_TIMEOUT);

        return { room, playerId: player.id };
      }
    }
    return null;
  }

  reconnectPlayer(socketId: string, playerId: string): { room: Room; player: RoomPlayer } | null {
    for (const room of this.rooms.values()) {
      if (room.roomId !== room.roomId) continue;
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.socketId = socketId;
        player.isConnected = true;
        room.lastActivity = Date.now();
        return { room, player };
      }
    }
    return null;
  }

  // ─── Game start ──────────────────────────────────────────────

  startGame(roomId: string): { engine: GameEngine; gameState: GameState } | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'WAITING') return null;
    const humans = room.players.filter(p => !p.isBot && p.isConnected);
    const botsAllowed = room.settings.botsEnabled ?? true;
    if (humans.length < 1 || (humans.length < 2 && !botsAllowed)) return null;

    room.status = 'STARTING';

    // Build player list (human players only for now — bots can be added later)
    const enginePlayers: Pick<Player, 'id' | 'name' | 'color' | 'tokenShape' | 'isBot' | 'botDifficulty'>[] =
      room.players
        .filter(p => !p.isBot)
        .map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          tokenShape: p.tokenShape as Player['tokenShape'],
          isBot: false,
          botDifficulty: undefined,
        }));

    // Add bots if enabled and not enough players
    if (room.settings.botsEnabled ?? true) {
      const botNames = ['Arjun', 'Priya', 'Rahul', 'Sneha'];
      const botColors = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
      const botTokens = ['BRIEFCASE', 'BUILDING', 'CAR', 'COIN'];
      const needed = room.maxPlayers - enginePlayers.length;
      for (let i = 0; i < needed; i++) {
        enginePlayers.push({
          id: `bot_${i}`,
          name: botNames[i % botNames.length],
          color: botColors[(enginePlayers.length + i) % botColors.length],
          tokenShape: botTokens[(enginePlayers.length + i) % botTokens.length] as Player['tokenShape'],
          isBot: true,
          botDifficulty: room.settings.botDifficulty || 'NORMAL',
        });
      }
    }

    const gameState = createInitialGameState(enginePlayers, {
       playerCount: room.maxPlayers as 2 | 3 | 4,
      botsEnabled: room.settings.botsEnabled ?? true,
      botDifficulty: room.settings.botDifficulty || 'NORMAL',
      privateRoom: room.settings.privateRoom ?? false,
      gameMode: room.settings.gameMode || 'CLASSIC',
      startingRule: room.settings.startingRule || 'HIGHEST_ROLL',
      gstEnabled: room.settings.gstEnabled ?? true,
      auctionsEnabled: room.settings.auctionsEnabled ?? true,
      tradingEnabled: room.settings.tradingEnabled ?? true,
      incomeTaxEnabled: room.settings.incomeTaxEnabled ?? true,
      startingCash: room.settings.startingCash ?? 25000,
    });

    const engine = new GameEngine(gameState, (state) => {
      // Broadcast updated state to all players in the room
      this.io.to(roomId).emit('game_state_updated', state);
    });

    room.engine = engine;
    room.status = 'PLAYING';
    room.lastActivity = Date.now();

    // Start the game (dice order roll) before returning the snapshot,
    // otherwise clients receive a stale LOBBY snapshot with no meaningful turn.
    engine.startGame();

    return { engine, gameState: engine.getState() };
  }

  // ─── Utility ─────────────────────────────────────────────────

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(r => r.roomId === r.roomId);
  }
}
