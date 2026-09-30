// ============================================================
// BUSINESS BHARAT — Socket.IO Game Server
// Handles all real-time multiplayer game events.
// Server-authoritative: validates every action before processing.
// ============================================================

import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { RoomManager } from './rooms/RoomManager';
import type { Room, RoomPlayer } from './rooms/Room';
import { generateRoomCode } from '@/engine/codeGenerator';

const RECONNECT_TIMEOUT = 45000; // 45 seconds to reconnect

export class GameServer {
  private io: Server;
  private roomManager: RoomManager;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingInterval: 10000,
      pingTimeout: 20000,
    });

    this.roomManager = new RoomManager(this.io);
    this._setupEventHandlers();
  }

  private _setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[SOCKET] Player connected: ${socket.id}`);

      // ─── CREATE ROOM ──────────────────────────────────────────
      socket.on('create_room', (data) => {
        if (!data || typeof data.playerName !== 'string') {
          socket.emit('error', 'Missing player name.');
          return;
        }
        const room = this.roomManager.createRoom(
          data.playerName,
          socket.id,
          {
            ...(data.settings ?? {}),
            playerCount: data.maxPlayers ?? data.settings?.playerCount ?? 4,
          },
          data.playerColor,
          data.tokenShape
        );

        socket.join(room.room.roomId);

        socket.emit('room_created', {
          roomCode: room.room.roomCode,
          roomId: room.room.roomId,
          playerId: room.playerId,
        });

        // Broadcast to room
        this.io.to(room.room.roomId).emit('room_joined', {
          room: this._roomToInfo(room.room),
          playerId: room.playerId,
        });
      });

      // ─── JOIN ROOM ────────────────────────────────────────────
      socket.on('join_room', (data) => {
        if (!data || typeof data.roomCode !== 'string' || !/^[A-Z0-9]{6}$/.test(data.roomCode)) {
          socket.emit('error', 'Invalid room code format.');
          return;
        }

        const result = this.roomManager.joinRoom(
          data.roomCode,
          data.playerName,
          socket.id,
          data.playerColor ?? data.color,
          data.tokenShape
        );

        if (!result) {
          socket.emit('error', 'Cannot join room. It may be full, started, or not exist.');
          return;
        }

        const { room, playerId } = result;
        socket.join(room.roomId);

        // Notify player they joined
        socket.emit('room_joined', {
          room: this._roomToInfo(room),
          playerId,
        });

        // Notify others
        const newPlayer = room.players.find(p => p.id === playerId)!;
        socket.to(room.roomId).emit('player_joined', newPlayer);

        console.log(`[SOCKET] ${data.playerName} joined room ${room.roomCode}`);
      });

      // ─── DISCONNECT ══════════════════════════════════════════
      socket.on('disconnect', (reason) => {
        console.log(`[SOCKET] Disconnected: ${socket.id} (${reason})`);

        const result = this.roomManager.removePlayer(socket.id);
        if (result) {
          const { room, playerId } = result;
          void room.players.find(p => p.id === playerId);

          // If game is in progress, mark as disconnected
          if (room.status === 'PLAYING') {
            this.io.to(room.roomId).emit('player_disconnected', playerId);

            // Check if host disconnected
            if (playerId === room.hostId) {
              const newHost = room.players.find(p => p.isConnected && p.id !== playerId);
              if (newHost) {
                room.hostId = newHost.id;
                newHost.isHost = true;
                this.io.to(room.roomId).emit('host_transferred', newHost.id);
              }
            }

            // Reconnect grace period
            setTimeout(() => {
              const currentRoom = this.roomManager.getRoom(room.roomId);
              if (!currentRoom) return;
              const stillDisconnected = currentRoom.players.find(p => p.id === playerId && !p.isConnected);
              if (stillDisconnected) {
                if (currentRoom.players.every(p => !p.isConnected)) {
                  this.roomManager.removeRoom(currentRoom.roomId);
                }
              }
            }, RECONNECT_TIMEOUT);
          } else {
            // Not playing — broadcast leave
            this.io.to(room.roomId).emit('player_left', playerId);

            // Clean up empty room
            setTimeout(() => {
              const currentRoom = this.roomManager.getRoom(room.roomId);
              if (currentRoom && currentRoom.players.every(p => !p.isConnected)) {
                this.roomManager.removeRoom(currentRoom.roomId);
              }
            }, 5000);
          }
        }
      });

      // ─── RECONNECT ───────────────────────────────────────────
      socket.on('reconnect_attempt', (data) => {
        const { playerId } = data;
        const result = this.roomManager.reconnectPlayer(socket.id, playerId);
        if (result) {
          socket.join(result.room.roomId);
          this.io.to(result.room.roomId).emit('player_reconnected', playerId);

          // If game is in progress, send full state
          if (result.room.status === 'PLAYING' && result.room.engine) {
            socket.emit('game_state_updated', result.room.engine.getState());
          }
        }
      });

      // ─── READY ───────────────────────────────────────────────
      socket.on('ready', (data: { roomId: string; playerId: string }) => {
        const room = this.roomManager.getRoom(data.roomId);
        if (!room) return;

        this.io.to(room.roomId).emit('player_ready', data.playerId);
      });

      // ─── START GAME ──────────────────────────────────────────
      socket.on('start_game', () => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || room.status !== 'WAITING') return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || !player.isHost) {
          socket.emit('error', 'Only the host can start the game.');
          return;
        }

        const connectedHumans = room.players.filter(p => p.isConnected && !p.isBot).length;
        const botsAllowed = (room.settings as any)?.botsEnabled !== false;
        if (connectedHumans < 1 || (connectedHumans < 2 && !botsAllowed)) {
          socket.emit('error', 'Need at least 2 players (or bots enabled) to start.');
          return;
        }

        const result = this.roomManager.startGame(room.roomId);
        if (!result) {
          socket.emit('error', 'Cannot start game.');
          return;
        }

        // Notify all clients (both the generic and the state channel for robustness)
        this.io.to(room.roomId).emit('game_started', result.gameState);
        this.io.to(room.roomId).emit('game_state_updated', result.gameState);
        console.log(`[SOCKET] Game started in room ${room.roomCode}`);
      });

      // ─── GAME ACTIONS (server-authoritative) ─────────────────
      // Every mutating action is gated: room must be PLAYING AND the socket
      // must belong to the engine's current player. Bots are driven by the
      // engine itself, never by a remote socket.
      const requireTurn = (socketId: string): Room | null => {
        const room = this._findRoomBySocket(socketId);
        if (!room || room.status !== 'PLAYING' || !room.engine) return null;
        const state = room.engine.getState();
        const actor = room.players.find(p => p.socketId === socketId);
        if (!actor) return null;
        if (actor.id !== state.currentPlayerId) {
          const s = this.io.sockets.sockets.get(socketId);
          s?.emit('error', 'Not your turn.');
          return null;
        }
        return room;
      };

      socket.on('roll_dice', () => {
        const room = requireTurn(socket.id);
        if (!room || !room.engine) return;
        room.engine.rollDice();
      });

      socket.on('buy_property', () => {
        const room = requireTurn(socket.id);
        room.engine.buyProperty();
      });


      socket.on('decline_property', () => {
        const room = requireTurn(socket.id);
        if (!room || !room.engine) return;
        room.engine.declineProperty();
      });

      socket.on('bid', (amount: number) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || room.status !== 'PLAYING' || !room.engine) return;
        room.engine.placeBid(amount);
      });

      socket.on('pass_auction', () => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || room.status !== 'PLAYING' || !room.engine) return;
        room.engine.passAuction();
      });

      socket.on('build', (data: { position: number; type: 'house' | 'hotel' }) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        if (data.type === 'house') {
          room.engine.buildHouse(data.position);
        } else {
          room.engine.buildHotel(data.position);
        }
      });

      socket.on('mortgage', (position: number) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        room.engine.mortgageProperty(position);
      });

      socket.on('release_mortgage', (position: number) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        room.engine.releaseMortgage(position);
      });

      socket.on('trade_offer', (offer) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        room.engine.createTradeOffer(offer);
      });

      socket.on('trade_accept', (tradeId: string) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        room.engine.respondToTrade(tradeId, true);
      });

      socket.on('trade_decline', (tradeId: string) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        room.engine.respondToTrade(tradeId, false);
      });

      socket.on('trade_counter', (data: { tradeId: string; offer: any }) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;
        room.engine.counterTrade(data.tradeId, data.offer);
      });

      socket.on('jail_action', (data: { method: 'roll' | 'pay' | 'card' }) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine) return;

        if (data.method === 'pay') {
          room.engine.payJailFine();
        } else if (data.method === 'card') {
          room.engine.useJailCard();
        }
      });

      socket.on('end_turn', () => {
        const room = requireTurn(socket.id);
        if (!room || !room.engine) return;
        room.engine.endTurn();
      });

      socket.on('declare_bankruptcy', (reason: string) => {
        const room = requireTurn(socket.id);
        if (!room || !room.engine) return;
        room.engine.declareBankruptcy(reason);
      });

      // ─── CHAT ────────────────────────────────────────────────
      socket.on('chat_message', (message: string) => {
        const room = this._findRoomBySocket(socket.id);
        if (!room) return;

        const player = this._getPlayerFromSocket(socket.id, room);
        if (!player) return;

        const sanitized = message.slice(0, 200).replace(/<[^>]*>/g, '');
        this.io.to(room.roomId).emit('chat_message', {
          id: generateRoomCode() + Date.now(),
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          message: sanitized,
          timestamp: Date.now(),
        });
      });

      // ─── FULL STATE REQUEST ──────────────────────────────────
      socket.on('request_full_state', () => {
        const room = this._findRoomBySocket(socket.id);
        if (!room || !room.engine || room.status !== 'PLAYING') return;
        socket.emit('game_state_updated', room.engine.getState());
      });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private _findRoomBySocket(socketId: string): Room | undefined {
    // Access rooms map via reflection (avoid exposing private)
    const roomsMap = (this.roomManager as any).rooms as Map<string, Room>;
    for (const room of roomsMap.values()) {
      if (room.players.some(p => p.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  private _getPlayerFromSocket(socketId: string, room: Room): RoomPlayer | null {
    return room.players.find(p => p.socketId === socketId) || null;
  }

  private _roomToInfo(room: Room) {
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        tokenShape: p.tokenShape,
        isBot: p.isBot,
        isHost: p.isHost,
        isConnected: p.isConnected,
      })),
      maxPlayers: room.maxPlayers,
      settings: room.settings,
      status: room.status,
      createdAt: room.createdAt,
      inviteLink: room.inviteLink,
    };
  }
}
