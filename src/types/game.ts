// ============================================================
// BUSINESS BHARAT — Core Game Types
// ============================================================

// ─── Enums ──────────────────────────────────────────────────

export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'CHANCE'
  | 'COMMUNITY_CHEST'
  | 'SURPRISE'
  | 'INCOME_TAX'
  | 'GST'
  | 'JAIL'
  | 'FREE_REST'
  | 'CLUB_HOUSE'
  | 'REST_HOUSE'
  | 'UTILITY';

export type PropertyGroup =
  | 'BROWN'
  | 'LIGHT_BLUE'
  | 'PURPLE'
  | 'ORANGE'
  | 'RED'
  | 'YELLOW'
  | 'GREEN';

export type GamePhase =
  | 'WAITING_FOR_PLAYERS'
  | 'GAME_START'
  | 'WAITING_FOR_ROLL'
  | 'ROLLING_DICE'
  | 'MOVING_PLAYER'
  | 'LANDING_RESOLUTION'
  | 'PROPERTY_DECISION'
  | 'AUCTION'
  | 'PAYMENT'
  | 'CARD_DRAW'
  | 'CONSTRUCTION'
  | 'TRADE'
  | 'JAIL_DECISION'
  | 'BANKRUPTCY_RESOLUTION'
  | 'END_TURN'
  | 'GAME_OVER';

export type GameMode =
  | 'SINGLE_PLAYER'
  | 'VS_BOTS'
  | 'TWO_PLAYER'
  | 'THREE_PLAYER'
  | 'FOUR_PLAYER'
  | 'ONLINE'
  | 'TEAM_2V2';

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export type TokenShape = 'BRIEFCASE' | 'BUILDING' | 'CAR' | 'COIN';

export type TileSide = 'bottom' | 'right' | 'top' | 'left' | 'corner';

// ─── Board Tile Data ─────────────────────────────────────────

export interface BoardTileData {
  position: number;
  name: string;
  type: TileType;
  description?: string;

  // Property-specific
  group?: PropertyGroup;
  groupColor?: string;
  price?: number;
  baseRent?: number;
  houseRent?: [number, number, number]; // 1 house, 2 houses, 3 houses
  hotelRent?: number;
  houseCost?: number;
  mortgageValue?: number;
}

// ─── Player ─────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  color: string;
  tokenShape: TokenShape;
  isBot: boolean;
  botDifficulty?: AIDifficulty;
  cash: number;           // Integer rupees only
  position: number;       // 0–39
  isInJail: boolean;
  jailTurnsRemaining: number;
  consecutiveDoubles: number;
  ownedProperties: number[]; // array of board positions
  isBankrupt: boolean;
  isActive: boolean;
  netWorth: number;       // calculated field
  getOutOfJailCards: number;
  teamId?: string;        // for 2v2 team mode
}

// ─── Property State ──────────────────────────────────────────

export interface PropertyState {
  position: number;
  ownerId: string | null;  // player ID or null (bank)
  houses: number;          // 0–3
  hasHotel: boolean;
  isMortgaged: boolean;
}

// ─── Dice ────────────────────────────────────────────────────

export interface DiceRoll {
  die1: number;
  die2: number;
  isDouble: boolean;
  total: number;
}

// ─── Auction ─────────────────────────────────────────────────

export interface AuctionState {
  isActive: boolean;
  propertyPosition: number;
  startingPrice: number;
  currentBid: number;
  currentBidderId: string | null;
  timeRemaining: number;  // seconds
  passedPlayerIds: string[];
  bidIncrement: number;
  auctioneerId: string | null;  // player who triggered the auction
}

// ─── Trade ───────────────────────────────────────────────────

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offeredCash: number;
  offeredProperties: number[];  // board positions
  requestedCash: number;
  requestedProperties: number[];
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COUNTERED';
  counteredFromId?: string;  // when countered, who originated the counter
}

// ─── Cards ───────────────────────────────────────────────────

export interface GameCard {
  id: string;
  type: 'CHANCE' | 'COMMUNITY_CHEST' | 'SURPRISE';
  text: string;
  action: CardAction;
}

export interface CardAction {
  kind:
    | 'COLLECT_FROM_BANK'
    | 'PAY_BANK'
    | 'COLLECT_FROM_PLAYERS'
    | 'PAY_PLAYERS'
    | 'MOVE_TO'
    | 'MOVE_FORWARD'
    | 'GO_TO_JAIL'
    | 'GET_OUT_OF_JAIL';
  amount?: number;
  targetPosition?: number;
  steps?: number;
}

// ─── Transaction Log ─────────────────────────────────────────

export interface Transaction {
  id: string;
  timestamp: number;
  type:
    | 'SALARY'
    | 'START_BONUS'
    | 'PROPERTY_PURCHASE'
    | 'PROPERTY_SALE'
    | 'RENT'
    | 'INCOME_TAX'
    | 'GST'
    | 'CLUB_HOUSE'
    | 'REST_HOUSE'
    | 'CARD'
    | 'MORTGAGE'
    | 'MORTGAGE_RELEASE'
    | 'CONSTRUCTION'
    | 'HOTEL'
    | 'AUCTION'
    | 'TRADE'
    | 'JAIL_FINE';
  fromId: string;      // player ID or 'BANK'
  toId: string;        // player ID or 'BANK'
  amount: number;      // rupees (integer)
  description: string;
}

// ─── Game Settings ───────────────────────────────────────────

export interface GameSettings {
  playerCount: 2 | 3 | 4;
  botsEnabled: boolean;
  botDifficulty: AIDifficulty;
  privateRoom: boolean;
  gameMode: 'CLASSIC' | 'TEAM';
  startingRule: 'ROLL_12' | 'HIGHEST_ROLL';
  gstEnabled: boolean;
  incomeTaxEnabled: boolean;
  auctionsEnabled: boolean;
  tradingEnabled: boolean;
  startingCash: number;
  gameTimer?: number | null;
}

// ─── Event Log ───────────────────────────────────────────────

export interface GameEvent {
  id: string;
  timestamp: number;
  playerId?: string;
  message: string;
  type: 'MOVE' | 'PURCHASE' | 'RENT' | 'TAX' | 'CARD' | 'SYSTEM' | 'JAIL' | 'WIN';
}

// ─── Central Game State ──────────────────────────────────────

export interface GameState {
  gameId: string;
  players: Player[];
  currentPlayerId: string;
  phase: GamePhase;
  board: BoardTileData[];
  properties: PropertyState[];
  bank: number;
  dice: DiceRoll | null;
  lastRoll: DiceRoll | null;
  turnNumber: number;
  auction: AuctionState | null;
  activeTrade: TradeOffer | null;
  pendingTrades: TradeOffer[];
  cards: {
    chance: GameCard[];
    communityChest: GameCard[];
    surprise: GameCard[];
  };
  // Cards held by players (position in array = playerId, value = card count)
  playerCards: Record<string, GameCard[]>;
  // Pending property decision (buy/decline) after landing on unowned property
  pendingPropertyDecision: { position: number } | null;
  // Current movement path (for token animation tile-by-tile)
  movementPath: number[];
  // Movement step index (current position in path)
  currentMoveStep: number;
  // Floating money animations
  moneyAnimations: MoneyAnimation[];
  winner: Player | null;
  gameStatus: 'LOBBY' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
  settings: GameSettings;
  transactions: Transaction[];
  events: GameEvent[];
}

export interface MoneyAnimation {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  amount: number;
  type: 'gain' | 'loss';
  description: string;
}

// ─── Utility Types ───────────────────────────────────────────

export interface GridPosition {
  row: number;   // 0-indexed (0 = top row)
  col: number;   // 0-indexed (0 = left col)
  side: TileSide;
}

/** Indian number format: 25000 → "25,000", 125000 → "1,25,000" */
export function formatRupees(amount: number): string {
  const str = amount.toString();
  if (str.length <= 3) return `₹${str}`;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${formatted},${last3}`;
}

/** Get CSS grid position (1-indexed) for a board position (0–39) */
export function getGridPosition(position: number): GridPosition {
  if (position <= 10) {
    // Bottom row: col = position, row = 10
    const side: TileSide = (position === 0 || position === 10) ? 'corner' : 'bottom';
    return { row: 10, col: position, side };
  } else if (position <= 19) {
    // Right col: row decreases from 9 to 1
    return { row: 20 - position, col: 10, side: 'right' };
  } else if (position <= 30) {
    // Top row: col decreases from 10 to 0
    const side: TileSide = (position === 20 || position === 30) ? 'corner' : 'top';
    return { row: 0, col: 30 - position, side };
  } else {
    // Left col: row increases from 1 to 9
    return { row: position - 30, col: 0, side: 'left' };
  }
}
