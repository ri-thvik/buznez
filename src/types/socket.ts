// ============================================================
// BUSINESS BHARAT — Socket.IO Event Types
// Shared between client and server for type safety.
// ============================================================

export interface PlayerInfo {
  id: string;
  name: string;
  color: string;
  tokenShape: string;
  isBot: boolean;
  isHost: boolean;
  isConnected: boolean;
}

// ─── Room ────────────────────────────────────────────────────

export interface RoomInfo {
  roomId: string;
  roomCode: string;
  hostId: string;
  players: PlayerInfo[];
  maxPlayers: number;
  settings: GameSettings;
  status: 'WAITING' | 'STARTING' | 'PLAYING' | 'FINISHED' | 'CLOSED';
  createdAt: number;
  inviteLink: string;
}

export interface GameSettings {
  playerCount: number;
  botsEnabled: boolean;
  botDifficulty: 'EASY' | 'NORMAL' | 'HARD';
  privateRoom: boolean;
  gameMode: 'CLASSIC' | 'TEAM';
  startingRule: 'ROLL_12' | 'HIGHEST_ROLL';
  gstEnabled: boolean;
  incomeTaxEnabled: boolean;
  auctionsEnabled: boolean;
  tradingEnabled: boolean;
  startingCash: number;
}

// ─── Socket Events: Client → Server ──────────────────────────

export interface ServerToClientEvents {
  room_created: (data: { roomCode: string; roomId: string; playerId: string }) => void;
  room_joined: (data: { room: RoomInfo; playerId: string }) => void;
  player_joined: (player: PlayerInfo) => void;
  player_left: (playerId: string) => void;
  player_ready: (playerId: string) => void;
  game_started: (gameState: any) => void;
  dice_rolled: (data: { dice: any; movementPath: number[] }) => void;
  player_moved: (data: { playerId: string; position: number }) => void;
  landing_resolved: (data: { events: any[] }) => void;
  property_available: (data: { position: number; price: number; gst: number; total: number }) => void;
  property_purchased: (data: { playerId: string; position: number; total: number }) => void;
  auction_started: (data: any) => void;
  auction_updated: (data: any) => void;
  auction_finished: (data: { winnerId: string | null; position: number; finalBid: number }) => void;
  rent_paid: (data: { fromId: string; toId: string; amount: number; propertyName: string }) => void;
  tax_paid: (data: { playerId: string; amount: number; type: string }) => void;
  construction_completed: (data: { playerId: string; position: number; buildType: 'house' | 'hotel'; cost: number }) => void;
  trade_received: (data: { trade: any }) => void;
  trade_completed: (data: { trade: any }) => void;
  trade_declined: (data: { tradeId: string; byPlayerId: string }) => void;
  card_drawn: (data: { playerId: string; card: any }) => void;
  jail_updated: (data: { playerId: string; isInJail: boolean; method: string }) => void;
  game_state_updated: (gameState: any) => void;
  player_disconnected: (playerId: string) => void;
  player_reconnected: (playerId: string) => void;
  host_transferred: (newHostId: string) => void;
  chat_message: (message: any) => void;
  game_over: (data: { winnerId: string; winner: any; players: any[] }) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string; playerColor: string; tokenShape: string; maxPlayers: number; settings: Partial<GameSettings> }) => void;
  join_room: (data: { roomCode: string; playerName: string; playerColor: string; tokenShape: string }) => void;
  leave_room: () => void;
  ready: () => void;
  start_game: () => void;
  roll_dice: () => void;
  buy_property: () => void;
  decline_property: () => void;
  bid: (amount: number) => void;
  pass_auction: () => void;
  build: (data: { position: number; type: 'house' | 'hotel' }) => void;
  mortgage: (position: number) => void;
  release_mortgage: (position: number) => void;
  trade_offer: (offer: any) => void;
  trade_accept: (tradeId: string) => void;
  trade_decline: (tradeId: string) => void;
  trade_counter: (data: { tradeId: string; offer: any }) => void;
  jail_action: (data: { method: 'roll' | 'pay' | 'card' }) => void;
  end_turn: () => void;
  declare_bankruptcy: (reason: string) => void;
  chat_message: (message: string) => void;
  request_full_state: () => void;
  reconnect_attempt: (data: { roomId: string; playerId: string }) => void;
}
