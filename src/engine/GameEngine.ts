// ============================================================
// BUSINESS BHARAT — Game Engine (Local mode)
//
// Server-authoritative game engine. The frontend ONLY dispatches
// actions; this engine owns all state, money, and validation.
// Multiplayer-ready: replace the local action dispatcher with
// Socket.IO event handlers for online mode.
// ============================================================

import type {
  GameState, Player, PropertyState, BoardTileData, GameSettings,
  TradeOffer, GameCard, DiceRoll, GameEvent,
  AIDifficulty,
} from '@/types/game';
import { BOARD_TILES, PROPERTY_GROUPS, SPECIAL_POSITIONS } from '@/data/boardData';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, SURPRISE_CARDS } from '@/data/cards';
import { DiceEngine } from './DiceEngine';
import { EconomyManager } from './EconomyManager';
import { nanoid, shuffle } from './utils';
import { formatRupees } from '@/types/game';

const STARTING_CASH = 25000;
const PASS_START_SALARY = 1500;
const JAIL_FINE = 500;
const GST_RATE = 0.05;
const MORTGAGE_INTEREST_RATE = 0.10;
const AUCTION_INCREMENT = 500;
const AUCTION_DURATION = 10; // seconds
const MAX_GST_TILE = 500;
const MAX_INCOME_TAX = 500;

// Rent multiplier for utilities based on dice roll
const UTILITY_RENT_MULTIPLIER = 4;

export const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  botsEnabled: true,
  botDifficulty: 'NORMAL',
  privateRoom: false,
  gameMode: 'CLASSIC',
  startingRule: 'HIGHEST_ROLL',
  gstEnabled: true,
  incomeTaxEnabled: true,
  auctionsEnabled: true,
  tradingEnabled: true,
  startingCash: STARTING_CASH,
};

// ─── Factory ─────────────────────────────────────────────────

export function createInitialGameState(
  players: Pick<Player, 'id' | 'name' | 'color' | 'tokenShape' | 'isBot' | 'botDifficulty'>[],
  settings: Partial<GameSettings> = {}
): GameState {
  const mergedSettings: GameSettings = { ...DEFAULT_SETTINGS, ...settings };

  const initialPlayers: Player[] = players.map(p => ({
    ...p,
    cash: STARTING_CASH,
    position: 0,
    isInJail: false,
    jailTurnsRemaining: 0,
    consecutiveDoubles: 0,
    ownedProperties: [],
    isBankrupt: false,
    isActive: true,
    netWorth: STARTING_CASH,
    getOutOfJailCards: 0,
    teamId: undefined,
  }));

  const initialProperties: PropertyState[] = BOARD_TILES
    .filter(t => t.type === 'PROPERTY' || t.type === 'UTILITY')
    .map(t => ({
      position: t.position,
      ownerId: null,
      houses: 0,
      hasHotel: false,
      isMortgaged: false,
    }));

  return {
    gameId: nanoid(),
    players: initialPlayers,
    currentPlayerId: initialPlayers[0].id,
    phase: 'WAITING_FOR_PLAYERS',
    board: BOARD_TILES,
    properties: initialProperties,
    bank: 1_000_000,
    dice: null,
    lastRoll: null,
    turnNumber: 0,
    auction: null,
    activeTrade: null,
    pendingTrades: [],
    cards: {
      chance: shuffle([...CHANCE_CARDS]),
      communityChest: shuffle([...COMMUNITY_CHEST_CARDS]),
      surprise: shuffle([...SURPRISE_CARDS]),
    },
    playerCards: {},
    pendingPropertyDecision: null,
    movementPath: [],
    currentMoveStep: 0,
    moneyAnimations: [],
    winner: null,
    gameStatus: 'LOBBY',
    settings: mergedSettings,
    transactions: [],
    events: [],
  };
}

// ─── Rent Calculation ──────────────────────────────────────────

export class RentManager {
  /** Calculate rent for a property given the current game state. */
  static calculateRent(
    tile: BoardTileData,
    propState: PropertyState,
    gameState: GameState,
    lastRoll: DiceRoll | null
  ): number {
    if (tile.type === 'UTILITY') {
      const owner = gameState.players.find(p => p.id === propState.ownerId);
      if (!owner) return 0;

      const utilitiesOwned = owner.ownedProperties.filter(
        pos => {
          const t = BOARD_TILES[pos];
          return t?.type === 'UTILITY';
        }
      ).length;

      // Assumption: utility rent = dice roll × 4 × number of utilities owned.
      // Documented in docs/ASSUMPTIONS.md
      const roll = lastRoll?.total ?? 7;
      return roll * UTILITY_RENT_MULTIPLIER * utilitiesOwned;
    }

    if (tile.type !== 'PROPERTY') return 0;

    const owner = gameState.players.find(p => p.id === propState.ownerId);
    if (!owner) return 0;

    // Mortgaged property → no rent
    if (propState.isMortgaged) return 0;

    // Hotel rent
    if (propState.hasHotel && tile.hotelRent) {
      return tile.hotelRent;
    }

    // House rents
    if (propState.houses > 0 && tile.houseRent) {
      const idx = Math.min(propState.houses - 1, 2);
      return tile.houseRent[idx];
    }

    // Base rent
    if (!tile.baseRent) return 0;

    // Check if owner has complete color group
    let rent = tile.baseRent;
    if (tile.group && RentManager.hasCompleteGroup(owner, tile.group, gameState)) {
      rent = rent * 2; // double base rent on unimproved properties with complete group
    }

    return rent;
  }

  static hasCompleteGroup(player: Player, group: string, gameState: GameState): boolean {
    const groupDef = PROPERTY_GROUPS[group];
    if (!groupDef) return false;
    return groupDef.members.every(pos => {
      const prop = gameState.properties.find(p => p.position === pos);
      return prop && prop.ownerId === player.id;
    });
  }
}

// ─── GST Calculation ──────────────────────────────────────────

export class GSTManager {
  /** Calculate GST (5%) on an amount, rounded to nearest ₹50. Always to BANK. */
  static calculate(amount: number): number {
    return EconomyManager.roundToNearest50(Math.round(amount * GST_RATE));
  }

  /** Total cost including GST: amount + GST. Returns { total, gst }. */
  static withGST(amount: number): { total: number; gst: number } {
    const gst = GSTManager.calculate(amount);
    return { total: amount + gst, gst };
  }
}

// ─── Main Engine ───────────────────────────────────────────────

export class GameEngine {
  private state: GameState;
  private economy: EconomyManager;
  private onStateChange: (state: GameState) => void;
  private moveTimer: ReturnType<typeof setTimeout> | null = null;
  private aiTimer: ReturnType<typeof setTimeout> | null = null;
  private auctionTimer: ReturnType<typeof setTimeout> | null = null;
  // Guards against awarding the START salary twice for one move (e.g. a
  // Chance card that moves the player onto START, which then resolves as a
  // landing). Reset at the start of every movement.
  private startSalaryPaidThisMove = false;
  // True once dice have been rolled during the CURRENT turn. Cleared when
  // play passes to another player, so a stale lastRoll.isDouble from a
  // previous turn can never grant a free extra roll.
  private rolledThisTurn = false;

  constructor(state: GameState, onStateChange: (s: GameState) => void) {
    this.state = state;
    this.economy = new EconomyManager(state);
    this.onStateChange = onStateChange;
  }

  getState(): GameState {
    return { ...this.state };
  }

  // Awards the START salary at most once per movement, so a Chance card
  // that moves the player onto START cannot pay twice (once for the move,
  // once for the landing).
  private _grantStartSalary(player: Player, reason: string): boolean {
    if (this.startSalaryPaidThisMove) return false;
    this.startSalaryPaidThisMove = true;
    this.economy.payPlayer(player.id, PASS_START_SALARY, reason, 'START_BONUS');
    this._addMoneyAnimation(player, PASS_START_SALARY, 'gain');
    return true;
  }

  startGame(): void {
    // Idempotent: re-entering startGame mid-game must not restart it.
    if (this.state.gameStatus === 'IN_PROGRESS' && this.state.turnNumber > 0) return;

    this.state.gameStatus = 'IN_PROGRESS';
    this.startSalaryPaidThisMove = false;

    // ROLL_12: everyone starts on START and waits for a double six
    if (this.state.settings.startingRule === 'ROLL_12') {
      this.state.phase = 'WAITING_FOR_ROLL';
      this.state.players.forEach(p => { p.position = 0; });
      this._addEvent(null, 'Roll a double six (12) to begin moving!', 'SYSTEM');
      this._emit();
      return;
    }
// HIGHEST_ROLL: all players roll, highest total starts
    this.state.phase = 'ROLLING_DICE';
    this._emit();

    // Simulate all players rolling
    const rolls = this.state.players.map(p => ({
      playerId: p.id,
      roll: DiceEngine.roll(),
    }));

    const highest = rolls.reduce((best, r) => (r.roll.total > best.roll.total ? r : best));



    // Set turn order based on roll (highest first)
    const sorted = rolls
      .slice()
      .sort((a, b) => b.roll.total - a.roll.total)
      .map(r => r.playerId);

    // Reorder players array
    this.state.players = sorted
      .map(id => this.state.players.find(p => p.id === id)!)
      .concat(this.state.players.filter(p => !sorted.includes(p.id)));

    this.state.currentPlayerId = highest.playerId;
    this.state.turnNumber = 1;
    this.state.phase = 'WAITING_FOR_ROLL';

    rolls.forEach(r => {
      const p = this.state.players.find(pl => pl.id === r.playerId);
      if (p) {
        this._addEvent(p.id, `${p.name} rolled ${r.roll.die1}+${r.roll.die2}=${r.roll.total}`, 'MOVE');
      }
    });
    this._addEvent(highest.playerId, `${this._currentPlayer().name} goes first!`, 'SYSTEM');

    this._emit();
    // Start AI loop
    this._processTurnStart();
  }

  _processTurnStart(): void {
    const player = this._currentPlayer();

    // Handle jail
    if (player.isInJail) {
      this._handleJailTurn(player);
      return;
    }

    // AI turn
    if (player.isBot) {
      const delay = this._getAiDelay(player.botDifficulty);
      this.aiTimer = setTimeout(() => this._aiTakeTurn(), delay);
      return;
    }
  }

  /**
   * When the current player is a bot and the phase requires a decision,
   * automatically trigger the AI to make a move.
   * Called after state changes that set a decision phase.
   */
  private _triggerAiIfNeeded(): void {
    const player = this._currentPlayer();
    if (!player.isBot) return;

    const phase = this.state.phase;

    if (phase === 'PROPERTY_DECISION' && this.state.pendingPropertyDecision) {
      const delay = this._getAiDelay(player.botDifficulty) + 300;
      this.aiTimer = setTimeout(() => {
        if (this.state.phase === 'PROPERTY_DECISION') {
          this.buyProperty();
        }
      }, delay);
    }

    if (phase === 'JAIL_DECISION') {
      const delay = this._getAiDelay(player.botDifficulty);
      this.aiTimer = setTimeout(() => this._aiJailDecision(player), delay);
    }
  }

  private _getAiDelay(difficulty?: AIDifficulty): number {
    switch (difficulty) {
      case 'EASY':   return 800;
      case 'HARD':   return 1600;
      default:      return 1200;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // DICE & MOVEMENT
  // ════════════════════════════════════════════════════════════════

  rollDice(): void {
    if (this.state.phase !== 'WAITING_FOR_ROLL') return;

    const player = this._currentPlayer();
    if (player.isBot) return; // bots handle their own rolling

    this._doRoll();
  }

  private _doRoll(): void {
    // New movement: allow the START salary to be granted once again.
    this.startSalaryPaidThisMove = false;
    this.state.phase = 'ROLLING_DICE';
    const roll = DiceEngine.roll();
    this.state.dice = roll;
    this.state.lastRoll = roll;
    this.rolledThisTurn = true;
    this._emit();
    setTimeout(() => this._resolveRoll(roll), 1200);
  }
  private _resolveRoll(roll: DiceRoll): void {
    const player = this._currentPlayer();
    if (roll.isDouble) {
      player.consecutiveDoubles++;
      if (player.consecutiveDoubles >= 3) {
        this._addEvent(player.id, `${player.name} rolled three doubles — sent to JAIL!`, 'JAIL');
        this._sendToJail(player, true);
        this._endTurn();
        return;
      }
    } else {
      player.consecutiveDoubles = 0;
    }

    // Build movement path (tile by tile)
    const path: number[] = [];
    let pos = player.position;
    for (let i = 0; i < roll.total; i++) {
      pos = (pos + 1) % 40;
      path.push(pos);
    }

    // Check if passing START
    if (player.position !== 0 && pos < player.position) {
      // Wrapped around
      this._grantStartSalary(player, 'Passed START salary');
      this._addEvent(player.id, `${player.name} passed START — collected ${this._fmt(PASS_START_SALARY)}`, 'MOVE');
    }

    this.state.movementPath = path;
    this.state.currentMoveStep = 0;
    this.state.phase = 'MOVING_PLAYER';
    this._emit();

    // Animate movement tile by tile
    let step = 0;
    const animateStep = () => {
      step++;
      this.state.currentMoveStep = step;
      if (step < path.length) {
        player.position = path[step - 1];
      }
      this._emit();

      if (step < path.length) {
        this.moveTimer = setTimeout(animateStep, 220);
      } else {
        // Landed — resolve
        player.position = path[path.length - 1];
        this._emit();
        setTimeout(() => this._resolveLanding(player), 300);
      }
    };
    animateStep();
  }

  // ════════════════════════════════════════════════════════════════
  // LANDING RESOLUTION
  // ════════════════════════════════════════════════════════════════

  private _resolveLanding(player: Player): void {
    const tile = BOARD_TILES[player.position];
    this.state.phase = 'LANDING_RESOLUTION';
    this._addEvent(player.id, `${player.name} landed on ${tile.name}`, 'MOVE');
    this._emit();

    setTimeout(() => this._processLanding(player, tile), 400);
  }

  private _processLanding(player: Player, tile: BoardTileData): void {
    switch (tile.type) {
      case 'START':
        this._grantStartSalary(player, 'Land on START');
        this._addEvent(player.id, `${player.name} collected ${this._fmt(PASS_START_SALARY)} for landing on START`, 'MOVE');
        this._endTurn();
        break;

      case 'PROPERTY':
      case 'UTILITY':
        this._handlePropertyLanding(player, tile);
        break;

      case 'CHANCE':
      case 'COMMUNITY_CHEST':
      case 'SURPRISE':
        this._drawAndResolveCard(player, tile.type);
        break;

      case 'INCOME_TAX':
        this._handleIncomeTax(player);
        break;

      case 'GST':
        this._handleGSTTile(player);
        break;

      case 'JAIL':
        // Just visiting
        this._addEvent(null, `${player.name} is just visiting JAIL.`, 'JAIL');
        this._endTurn();
        break;

      case 'FREE_REST':
        this._addEvent(null, `${player.name} is resting.`, 'SYSTEM');
        this._endTurn();
        break;

      case 'CLUB_HOUSE':
        this._handleClubHouse(player);
        break;

      case 'REST_HOUSE':
        this._handleRestHouse(player);
        break;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // PROPERTY PURCHASE & RENT
  // ════════════════════════════════════════════════════════════════

  private _handlePropertyLanding(player: Player, tile: BoardTileData): void {
    const propState = this.state.properties.find(p => p.position === tile.position);
    if (!propState) { this._endTurn(); return; }

    if (!propState.ownerId) {
      // Unowned — offer to buy
      if (this.state.settings.auctionsEnabled === false) {
        // No auctions — just offer to buy
        this.state.pendingPropertyDecision = { position: tile.position };
        this.state.phase = 'PROPERTY_DECISION';
      } else {
        // Check if player can afford — if yes, offer buy; if no, start auction
        const cost = GSTManager.withGST(tile.price ?? 0);
        if (player.cash >= cost.total) {
          this.state.pendingPropertyDecision = { position: tile.position };
          this.state.phase = 'PROPERTY_DECISION';
        } else {
          this._addEvent(null, `${player.name} cannot afford ${tile.name}. Starting auction.`, 'SYSTEM');
          this._startAuction(tile.position, player.id);
        }
      }
      this._emit();
      this._triggerAiIfNeeded();
      return;
    }

    if (propState.ownerId === player.id) {
      // Own it — no action
      this._endTurn();
      return;
    }

    if (propState.isMortgaged) {
      this._addEvent(null, `${tile.name} is mortgaged — no rent.`, 'SYSTEM');
      this._endTurn();
      return;
    }

    // Pay rent
    const rent = RentManager.calculateRent(
      tile, propState, this.state, this.state.lastRoll
    );
    if (rent > 0) {
      this._processRentPayment(player, propState.ownerId, rent, tile.name);
    }
    this._endTurn();
  }

  buyProperty(): void {
    if (this.state.phase !== 'PROPERTY_DECISION' || !this.state.pendingPropertyDecision) return;

    const player = this._currentPlayer();
    const position = this.state.pendingPropertyDecision.position;
    const tile = BOARD_TILES[position];
    const propState = this.state.properties.find(p => p.position === position);
    if (!propState || !tile.price) { this._endTurn(); return; }

    const { total, gst } = GSTManager.withGST(tile.price);

    if (player.cash < total) {
      this._addEvent(player.id, `${player.name} cannot afford ${tile.name} (₹${total}). Going to auction.`, 'SYSTEM');
      this.state.pendingPropertyDecision = null;
      this._startAuction(position, player.id);
      return;
    }

    // Process purchase
    this.economy.payBank(player.id, total,
      `Purchased ${tile.name} (₹${tile.price} + ₹${gst} GST)`, 'PROPERTY_PURCHASE'
    );

    // payBank already moved the full total (price + GST) out of the player's cash.
    propState.ownerId = player.id;
    player.ownedProperties.push(position);
    // Add GST to bank
    this.state.bank += gst;

    this._addMoneyAnimation(player, -total, '.loss');
    this._addEvent(player.id, `${player.name} purchased ${tile.name} for ₹${total} (₹${tile.price} + ₹${gst} GST)`, 'PURCHASE');
    this._emit();

    this.state.pendingPropertyDecision = null;

    // Check for complete group bonus
    if (tile.group && RentManager.hasCompleteGroup(player, tile.group, this.state)) {
      this._addEvent(player.id, `${player.name} completed the ${tile.group} group! Unimproved rent doubled.`, 'PURCHASE');
    }

    setTimeout(() => this._endTurn(), 500);
  }

  declineProperty(): void {
    if (this.state.phase !== 'PROPERTY_DECISION' || !this.state.pendingPropertyDecision) return;

    const position = this.state.pendingPropertyDecision.position;
    const tile = BOARD_TILES[position];
    const player = this._currentPlayer();

    this._addEvent(null, `${player.name} declined to buy ${tile.name}. Starting auction.`, 'SYSTEM');
    this.state.pendingPropertyDecision = null;
    this._startAuction(position, player.id);
    this._emit();
  }

  // ════════════════════════════════════════════════════════════════
  // RENT PAYMENT
  // ════════════════════════════════════════════════════════════════

  private _processRentPayment(payer: Player, ownerId: string, rent: number, propertyName: string): void {
    const owner = this.state.players.find(p => p.id === ownerId);
    if (!owner) return;

    if (payer.cash < rent) {
      // Payer can't afford — bankruptcy flow
      this._handleRentBankruptcy(payer, ownerId, rent, propertyName);
      return;
    }

    this.economy.transfer(payer.id, owner.id, rent, `Rent for ${propertyName}`, 'RENT');
    this._addMoneyAnimation(payer, -rent, 'loss');
    this._addMoneyAnimation(owner, rent, 'gain');
    this._addEvent(payer.id, `${payer.name} paid ${owner.name} ${this._fmt(rent)} rent for ${propertyName}`, 'RENT');
    this._emit();
  }

  private _handleRentBankruptcy(payer: Player, ownerId: string, rent: number, propertyName: string): void {
    this._addEvent(null, `${payer.name} cannot afford rent (${this._fmt(rent)}) and must declare bankruptcy!`, 'SYSTEM');
    this.state.phase = 'BANKRUPTCY_RESOLUTION';
    // Transfer all possible and mark bankrupt
    this._declareBankruptcy(payer.id, ownerId, rent, propertyName);
  }

  // ════════════════════════════════════════════════════════════════
  // TAXES
  // ════════════════════════════════════════════════════════════════

  private _handleIncomeTax(player: Player): void {
    const propCount = player.ownedProperties.length;
    const tax = Math.min(propCount * 50, MAX_INCOME_TAX);

    if (tax > 0) {
      if (player.cash < tax) {
        this._declareBankruptcy(player.id, null, tax, 'Income Tax');
        return;
      }
      this.economy.payBank(player.id, tax, `Income Tax (${propCount} properties × ₹50)`, 'INCOME_TAX');
      this._addMoneyAnimation(player, -tax, 'loss');
      this._addEvent(player.id, `${player.name} paid Income Tax ₹${tax}`, 'TAX');
    } else {
      this._addEvent(null, `${player.name} owes no income tax.`, 'SYSTEM');
    }

    this._emit();
    this._endTurn();
  }

  private _handleGSTTile(player: Player): void {
    const ownedProps = this.state.properties.filter(p => p.ownerId === player.id);
    let gstAmount = 0;
    ownedProps.forEach(p => {
      if (p.hasHotel) gstAmount += 100;
      else gstAmount += p.houses * 50;
    });
    gstAmount = Math.min(gstAmount, MAX_GST_TILE);

    if (gstAmount > 0) {
      if (player.cash < gstAmount) {
        this._declareBankruptcy(player.id, null, gstAmount, 'GST');
        return;
      }
      this.economy.payBank(player.id, gstAmount, `GST tile payment`, 'GST');
      this._addMoneyAnimation(player, -gstAmount, 'loss');
      this._addEvent(player.id, `${player.name} paid GST ₹${gstAmount}`, 'TAX');
    } else {
      this._addEvent(null, `${player.name} owes no GST.`, 'SYSTEM');
    }

    this._emit();
    this._endTurn();
  }

  // ════════════════════════════════════════════════════════════════
  // CLUB HOUSE & REST HOUSE
  // ════════════════════════════════════════════════════════════════

  private _handleClubHouse(player: Player): void {
    const others = this.state.players.filter(p => p.id !== player.id && p.isActive && !p.isBankrupt);

    others.forEach(other => {
      try {
        this.economy.transfer(player.id, other.id, 100, `Club House to ${other.name}`);
        this._addMoneyAnimation(player, -100, 'loss');
        this._addMoneyAnimation(other, 100, 'gain');
      } catch {
        // skip if can't pay
      }
    });

    this._addEvent(player.id, `${player.name} landed on Club House — paid ₹100 to each player`, 'CARD');
    this._emit();
    this._endTurn();
  }

  private _handleRestHouse(player: Player): void {
     const others = this.state.players.filter(p => p.id !== player.id && p.isActive && !p.isBankrupt);

    others.forEach(other => {
      try {
        this.economy.transfer(other.id, player.id, 100, `Rest House from ${other.name}`);
        this._addMoneyAnimation(other, -100, 'loss');
        this._addMoneyAnimation(player, 100, 'gain');
      } catch {
        // skip if opponent can't pay
      }
    });

    this._addEvent(player.id, `${player.name} landed on Rest House — received ₹100 from each player`, 'CARD');
    this._emit();
    this._endTurn();
  }

  // ════════════════════════════════════════════════════════════════
  // CONSTRUCTION
  // ════════════════════════════════════════════════════════════════

  buildHouse(position: number): void {
    const player = this._currentPlayer();
    const tile = BOARD_TILES[position];
    if (!tile || tile.type !== 'PROPERTY' || !tile.group) return;

    const propState = this.state.properties.find(p => p.position === position);
    if (!propState || propState.ownerId !== player.id) return;

    // Must own complete group
    if (!RentManager.hasCompleteGroup(player, tile.group, this.state)) {
      this._addEvent(player.id, 'Cannot build: you must own the complete colour group.', 'SYSTEM');
      this._emit();
      return;
    }

    // Must build uniformly
    const groupMembers = PROPERTY_GROUPS[tile.group].members;
    const groupProps = groupMembers.map(pos => this.state.properties.find(p => p.position === pos)!);

    // Find minimum houses across group
    const minHouses = Math.min(...groupProps.map(p => p.houses));
    const diff = propState.houses - minHouses;

    if (diff > 1 || (propState.hasHotel && groupProps.some(p => p.houses < 3))) {
      // Uneven or hotel on non-maxed property
      this._addEvent(player.id, 'Cannot build: must build uniformly across the group.', 'SYSTEM');
      this._emit();
      return;
    }

    // Can't build hotel if someone has a hotel already and this isn't max houses
    if (propState.hasHotel) {
      this._addEvent(player.id, 'Cannot build: property already has a hotel.', 'SYSTEM');
      this._emit();
      return;
    }

    const houseCost = tile.houseCost ?? 500;
    const { total, gst } = GSTManager.withGST(houseCost);

    if (player.cash < total) {
      this._addEvent(player.id, `Cannot build: need ${this._fmt(total)} but have ${this._fmt(player.cash)}.`, 'SYSTEM');
      this._emit();
      return;
    }

    // Build
    this.economy.payBank(player.id, total, `Built house on ${tile.name} (₹${houseCost} + ₹${gst} GST)`, 'CONSTRUCTION');
    this.state.bank += gst;
    propState.houses++;
    this._addMoneyAnimation(player, -total, 'loss');
    this._addEvent(player.id, `${player.name} built a house on ${tile.name} for ₹${total}`, 'PURCHASE');
    this._emit();
  }

  buildHotel(position: number): void {
    const player = this._currentPlayer();
    const tile = BOARD_TILES[position];
    if (!tile || tile.type !== 'PROPERTY' || !tile.group) return;

    const propState = this.state.properties.find(p => p.position === position);
    if (!propState || propState.ownerId !== player.id || propState.hasHotel) return;

    if (!RentManager.hasCompleteGroup(player, tile.group, this.state)) {
      this._addEvent(player.id, 'Cannot build hotel: must own the complete colour group.', 'SYSTEM');
      this._emit();
      return;
    }

    // Must have 3 houses on every property in the group
    const groupMembers = PROPERTY_GROUPS[tile.group].members;
    const groupProps = groupMembers.map(pos => this.state.properties.find(p => p.position === pos)!);
    const allHaveThree = groupProps.every(p => p.houses === 3 && !p.hasHotel);

    if (!allHaveThree) {
      this._addEvent(player.id, 'Cannot build hotel: all properties in the group must have 3 houses.', 'SYSTEM');
      this._emit();
      return;
    }

    // Remove 3 houses from this property, add hotel
    const houseCost = tile.houseCost ?? 500;
    const hotelCost = houseCost * 3; // hotel cost = 3 × house cost (documented assumption in ASSUMPTIONS.md)
    const { total, gst } = GSTManager.withGST(hotelCost);

    if (player.cash < total) {
      this._addEvent(player.id, `Cannot build hotel: need ${this._fmt(total)} but have ${this._fmt(player.cash)}.`, 'SYSTEM');
      this._emit();
      return;
    }

    this.economy.payBank(player.id, total, `Built hotel on ${tile.name} (₹${hotelCost} + ₹${gst} GST)`, 'HOTEL');
    this.state.bank += gst;
    propState.houses = 0;
    propState.hasHotel = true;
    this._addMoneyAnimation(player, -total, 'loss');
    this._addEvent(player.id, `${player.name} built a hotel on ${tile.name} for ₹${total}`, 'PURCHASE');
    this._emit();
  }

  // ════════════════════════════════════════════════════════════════
  // MORTGAGE
  // ════════════════════════════════════════════════════════════════

  mortgageProperty(position: number): void {
    const player = this._currentPlayer();
    const propState = this.state.properties.find(p => p.position === position);
    if (!propState || propState.ownerId !== player.id || propState.isMortgaged) return;

    const tile = BOARD_TILES[position];
    if (!tile) return;

    // Cannot mortgage if has buildings/hotel
    if (propState.houses > 0 || propState.hasHotel) {
      this._addEvent(player.id, 'Cannot mortgage: sell buildings first.', 'SYSTEM');
      this._emit();
      return;
    }

    const mortgageValue = tile.mortgageValue ?? Math.round((tile.price ?? 0) / 2);
    this.economy.receiveFromBank(player.id, mortgageValue, `Mortgaged ${tile.name}`, 'MORTGAGE');
    propState.isMortgaged = true;
    this._addMoneyAnimation(player, mortgageValue, 'gain');
    this._addEvent(player.id, `${player.name} mortgaged ${tile.name} for ${this._fmt(mortgageValue)}`, 'SYSTEM');
    this._emit();
  }

  releaseMortgage(position: number): void {
    const player = this._currentPlayer();
    const propState = this.state.properties.find(p => p.position === position);
    if (!propState || propState.ownerId !== player.id || !propState.isMortgaged) return;

    const tile = BOARD_TILES[position];
    if (!tile) return;

    const mortgageValue = tile.mortgageValue ?? Math.round((tile.price ?? 0) / 2);
    const interest = EconomyManager.roundToNearest50(mortgageValue * MORTGAGE_INTEREST_RATE);
    const releaseCost = mortgageValue + interest;

    if (player.cash < releaseCost) {
      this._addEvent(player.id, `Cannot release mortgage: need ${this._fmt(releaseCost)} but have ${this._fmt(player.cash)}.`, 'SYSTEM');
      this._emit();
      return;
    }

    this.economy.payBank(player.id, releaseCost, `Released mortgage on ${tile.name} (₹${mortgageValue} + ₹${interest} interest)`, 'MORTGAGE_RELEASE');
    propState.isMortgaged = false;
    this._addMoneyAnimation(player, -releaseCost, 'loss');
    this._addEvent(player.id, `${player.name} released mortgage on ${tile.name} for ${this._fmt(releaseCost)}`, 'SYSTEM');
    this._emit();
  }

  // ════════════════════════════════════════════════════════════════
  // TRADING
  // ════════════════════════════════════════════════════════════════

  createTradeOffer(offer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }): void {
    if (!this.state.settings.tradingEnabled) {
      this._addEvent(null, 'Trading is disabled in this game.', 'SYSTEM');
      this._emit();
      return;
    }

    const player = this._currentPlayer();
    if (offer.fromPlayerId !== player.id) {
      this._addEvent(null, 'Only the current player can initiate a trade.', 'SYSTEM');
      this._emit();
      return;
    }

    // Validate ownership and cash
    const allProps = offer.offeredProperties.concat(offer.requestedProperties);
    for (const pos of allProps) {
      const prop = this.state.properties.find(p => p.position === pos);
      if (!prop) continue;
      if (prop.ownerId !== player.id && prop.ownerId !== offer.toPlayerId) {
        this._addEvent(null, 'One or more properties are not owned by the involved players.', 'SYSTEM');
        this._emit();
        return;
      }
    }

    const trade: TradeOffer = {
      ...offer,
      id: nanoid(),
      status: 'PENDING',
    };

    this.state.pendingTrades = [
      ...this.state.pendingTrades.filter(t => t.toPlayerId !== offer.toPlayerId),
      trade,
    ];
    this._addEvent(player.id, `${player.name} offered a trade to ${this._playerName(offer.toPlayerId)}`, 'SYSTEM');
    this._emit();
  }

  respondToTrade(tradeId: string, accept: boolean): void {
    const trade = this.state.pendingTrades.find(t => t.id === tradeId);
    if (!trade) return;

    const responder = this._currentPlayer();
    if (trade.toPlayerId !== responder.id) {
      this._addEvent(null, 'Only the recipient can respond to this trade.', 'SYSTEM');
      this._emit();
      return;
    }

    if (accept) {
      this._executeTrade(trade);
    } else {
      trade.status = 'DECLINED';
      this._addEvent(null, `${responder.name} declined the trade.`, 'SYSTEM');
    }

    this.state.pendingTrades = this.state.pendingTrades.filter(t => t.id !== tradeId);
    this._emit();
  }

  counterTrade(tradeId: string, counterOffer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string }): void {
    const trade = this.state.pendingTrades.find(t => t.id === tradeId);
    if (!trade) return;

    const responder = this._currentPlayer();
    if (trade.toPlayerId !== responder.id) {
      this._addEvent(null, 'Only the recipient can counter this trade.', 'SYSTEM');
      this._emit();
      return;
    }

    // Remove original, add counter
    this.state.pendingTrades = this.state.pendingTrades.filter(t => t.id !== tradeId);
    const counter: TradeOffer = {
      ...counterOffer,
      id: nanoid(),
      status: 'PENDING',
      counteredFromId: responder.id,
    };
    this.state.pendingTrades = [...this.state.pendingTrades, counter];
      this._addEvent(responder.id, `${responder.name} sent a counter offer.`, 'SYSTEM');
    this._emit();
  }

  private _executeTrade(trade: TradeOffer): void {
    const from = this._requirePlayer(trade.fromPlayerId);
    const to = this._requirePlayer(trade.toPlayerId);

    // Transfer offered properties from from → to
    for (const pos of trade.offeredProperties) {
      const prop = this.state.properties.find(p => p.position === pos);
      if (prop) prop.ownerId = trade.toPlayerId;
    }
    from.ownedProperties = from.ownedProperties.filter(p => !trade.offeredProperties.includes(p));
    to.ownedProperties = [...to.ownedProperties, ...trade.offeredProperties];

    // Transfer requested properties from to → from
    for (const pos of trade.requestedProperties) {
      const prop = this.state.properties.find(p => p.position === pos);
      if (prop) prop.ownerId = trade.fromPlayerId;
    }
    to.ownedProperties = to.ownedProperties.filter(p => !trade.requestedProperties.includes(p));
    from.ownedProperties = [...from.ownedProperties, ...trade.requestedProperties];

    // Transfer cash
    if (trade.offeredCash > 0) {
      this.economy.transfer(from.id, to.id, trade.offeredCash, `Trade with ${to.name}`, 'TRADE');
      this._addMoneyAnimation(from, -trade.offeredCash, 'loss');
      this._addMoneyAnimation(to, trade.offeredCash, 'gain');
    }
    if (trade.requestedCash > 0) {
      this.economy.transfer(to.id, from.id, trade.requestedCash, `Trade with ${from.name}`, 'TRADE');
      this._addMoneyAnimation(to, -trade.requestedCash, 'loss');
      this._addMoneyAnimation(from, trade.requestedCash, 'gain');
    }

    this._addEvent(null, `Trade completed: ${from.name} ↔ ${to.name}`, 'SYSTEM');
    this._emit();
  }

  // ════════════════════════════════════════════════════════════════
  // AUCTION
  // ════════════════════════════════════════════════════════════════

  private _startAuction(position: number, auctioneerId: string): void {
    const tile = BOARD_TILES[position];
    const startingPrice = tile.price ?? 5000;

    this.state.auction = {
      isActive: true,
      propertyPosition: position,
      startingPrice,
      currentBid: startingPrice,
      currentBidderId: null,
      timeRemaining: AUCTION_DURATION,
      passedPlayerIds: [],
      bidIncrement: AUCTION_INCREMENT,
      auctioneerId,
    };
    this.state.phase = 'AUCTION';
    this._addEvent(null, `Auction started for ${tile.name} (starting: ${this._fmt(startingPrice)})`, 'SYSTEM');
    this._emit();

    this._runAuction();
  }

  private _runAuction(): void {
    const auction = this.state.auction;
    if (!auction || !auction.isActive) return;

    // Decrement timer
    auction.timeRemaining--;
    this._emit();

    if (auction.timeRemaining <= 0 || auction.passedPlayerIds.length >= this._activeNonBankruptPlayers().length) {
      this._endAuction();
      return;
    }

    // AI bidders
    const active = this._activeNonBankruptPlayers();
    const aiBidders = active.filter(p => p.isBot && !auction.passedPlayerIds.includes(p.id) && p.id !== auction.currentBidderId);

    if (aiBidders.length > 0 && auction.currentBidderId !== null) {
      // AI considers bidding
      const ai = aiBidders[0];
      const tile = BOARD_TILES[auction.propertyPosition];
      const canAfford = ai.cash >= auction.currentBid + auction.bidIncrement;

      if (canAfford && this._aiShouldBid(ai, tile, auction.currentBid + auction.bidIncrement)) {
        auction.currentBid += auction.bidIncrement;
        auction.currentBidderId = ai.id;
          this._addEvent(null, `${ai.name} bids ${this._fmt(auction.currentBid)}`, 'SYSTEM');
        this._emit();
      } else {
        auction.passedPlayerIds.push(ai.id);
        this._addEvent(null, `${ai.name} passes.`, 'SYSTEM');
      }
    }

    this.auctionTimer = setTimeout(() => this._runAuction(), 1000);
  }

  private _endAuction(): void {
    const auction = this.state.auction;
    if (!auction) return;

    this.state.auction = null;
    this.state.phase = 'PAYMENT';

    if (auction.currentBidderId && auction.currentBid > 0 && auction.currentBidderId !== auction.auctioneerId) {
      // Only sell if there's a bidder other than the auctioneer
      const winner = this._requirePlayer(auction.currentBidderId);
      const tile = BOARD_TILES[auction.propertyPosition];
      const propState = this.state.properties.find(p => p.position === auction.propertyPosition);
      if (!propState || !tile.price) {
        this._endTurn();
        return;
      }

      if (winner.cash < auction.currentBid) {
        this._declareBankruptcy(winner.id, null, auction.currentBid, 'Auction');
        return;
      }

      const { gst } = GSTManager.withGST(auction.currentBid);
      this.economy.payBank(winner.id, auction.currentBid, `Won auction for ${tile.name}`, 'AUCTION');
      this.state.bank += gst;
      propState.ownerId = winner.id;
      winner.ownedProperties.push(auction.propertyPosition);
      this._addMoneyAnimation(winner, -auction.currentBid, 'loss');
      this._addEvent(null, `${winner.name} won auction for ${tile.name} at ${this._fmt(auction.currentBid)}`, 'PURCHASE');
      this._emit();
      setTimeout(() => this._endTurn(), 600);
    } else {
      // No bids — property goes back to bank (no owner)
      this._addEvent(null, `No bidders. ${BOARD_TILES[auction.propertyPosition].name} remains unsold.`, 'SYSTEM');
      this._emit();
      this._endTurn();
    }
  }

  placeBid(amount: number): void {
    const auction = this.state.auction;
    if (!auction || !auction.isActive) return;

    const player = this._currentPlayer();
    if (auction.passedPlayerIds.includes(player.id)) return;

    const newBid = Math.max(amount, auction.currentBid + auction.bidIncrement);
    if (newBid < auction.currentBid + auction.bidIncrement) return;

    if (player.cash < newBid) {
      this._addEvent(player.id, `Cannot bid: need ${this._fmt(newBid)} but have ${this._fmt(player.cash)}.`, 'SYSTEM');
      this._emit();
      return;
    }

    auction.currentBid = newBid;
    auction.currentBidderId = player.id;
    this._addEvent(null, `${player.name} bids ${this._fmt(newBid)}`, 'SYSTEM');
    this._emit();
  }

  passAuction(): void {
    const auction = this.state.auction;
    if (!auction || !auction.isActive) return;

    const player = this._currentPlayer();
    if (auction.passedPlayerIds.includes(player.id)) return;

    auction.passedPlayerIds.push(player.id);
    this._addEvent(null, `${player.name} passes.`, 'SYSTEM');
    this._emit();
  }

  // ════════════════════════════════════════════════════════════════
  // JAIL
  // ════════════════════════════════════════════════════════════════

  private _sendToJail(player: Player, isThreeDoubles = false): void {
    player.isInJail = true;
    player.jailTurnsRemaining = 3;
    player.position = SPECIAL_POSITIONS.JAIL;
    player.consecutiveDoubles = 0;
    this._addEvent(player.id, `${player.name} is now IN JAIL${isThreeDoubles ? ' (three doubles)' : ''}`, 'JAIL');
  }

   private _handleJailTurn(player: Player): void {
    if (this.state.phase !== 'WAITING_FOR_ROLL') return;

    if (player.isBot) {
      const delay = this._getAiDelay(player.botDifficulty);
      this.aiTimer = setTimeout(() => this._aiJailDecision(player), delay);
      return;
    }
    // Human player decides in UI (jail modal)
    this.state.phase = 'JAIL_DECISION';
    this._emit();
    this._triggerAiIfNeeded();
  }

  payJailFine(): void {
    const player = this._currentPlayer();
    if (!player.isInJail) return;
    if (this.state.phase !== 'JAIL_DECISION') return;

    if (player.cash < JAIL_FINE) {
      this._addEvent(player.id, `Cannot pay jail fine: need ${this._fmt(JAIL_FINE)} but have ${this._fmt(player.cash)}.`, 'SYSTEM');
      this._emit();
      return;
    }

    this.economy.payBank(player.id, JAIL_FINE, 'Jail release fine', 'JAIL_FINE');
    player.isInJail = false;
    player.jailTurnsRemaining = 0;
    this._addMoneyAnimation(player, -JAIL_FINE, 'loss');
    this._addEvent(player.id, `${player.name} paid ₹${JAIL_FINE} to get out of jail.`, 'JAIL');
    this._emit();
    this._endTurn();
  }

  useJailCard(): void {
    const player = this._currentPlayer();
    if (!player.isInJail || player.getOutOfJailCards <= 0) return;
    if (this.state.phase !== 'JAIL_DECISION') return;

    player.getOutOfJailCards--;
    player.isInJail = false;
    player.jailTurnsRemaining = 0;
    this._addEvent(player.id, `${player.name} used a Get Out of Jail Free card.`, 'JAIL');
    this._emit();
    this._endTurn();
  }

  // ════════════════════════════════════════════════════════════════
  // CARDS
  // ════════════════════════════════════════════════════════════════

  private _drawAndResolveCard(player: Player, cardType: 'CHANCE' | 'COMMUNITY_CHEST' | 'SURPRISE'): void {
    this.state.phase = 'CARD_DRAW';
    this._emit();

    let deck: GameCard[];
    if (cardType === 'CHANCE') {
      deck = this.state.cards.chance;
    } else if (cardType === 'COMMUNITY_CHEST') {
      deck = this.state.cards.communityChest;
    } else {
      deck = this.state.cards.surprise;
    }

    if (deck.length === 0) {
      // Reshuffle
      const all = cardType === 'CHANCE' ? CHANCE_CARDS :
                  cardType === 'COMMUNITY_CHEST' ? COMMUNITY_CHEST_CARDS : SURPRISE_CARDS;
      deck.push(...shuffle([...all]));
    }

    const card = deck.shift()!;
    this._addEvent(player.id, `${player.name} drew: "${card.text}"`, 'CARD');
    this._emit();

    setTimeout(() => this._resolveCard(player, card), 1500);
  }

  private _resolveCard(player: Player, card: GameCard): void {
    const action = card.action;

    switch (action.kind) {
      case 'COLLECT_FROM_BANK':
        if (action.amount && action.amount > 0) {
          this.economy.payPlayer(player.id, action.amount, card.text, 'CARD');
          this._addMoneyAnimation(player, action.amount, 'gain');
          this._addEvent(player.id, `${player.name} collected ${this._fmt(action.amount)}`, 'CARD');
        }
        this._endTurn();
        break;

      case 'PAY_BANK':
        if (action.amount && action.amount > 0) {
          if (player.cash < action.amount) {
            this._declareBankruptcy(player.id, null, action.amount, card.text);
          } else {
            this.economy.payBank(player.id, action.amount, card.text, 'CARD');
            this._addMoneyAnimation(player, -action.amount, 'loss');
            this._addEvent(player.id, `${player.name} paid ${this._fmt(action.amount)}`, 'CARD');
          }
        }
        this._endTurn();
        break;

      case 'COLLECT_FROM_PLAYERS':
        {
          const amt = action.amount;
          if (amt && amt > 0) {
            const others = this.state.players.filter(p => p.id !== player.id && !p.isBankrupt);
            others.forEach(other => {
              try {
                this.economy.transfer(other.id, player.id, amt, card.text, 'CARD');
                this._addMoneyAnimation(other, -amt, 'loss');
                this._addMoneyAnimation(player, amt, 'gain');
              } catch { /* skip */ }
            });
            this._addEvent(player.id, `${player.name} collected ${this._fmt(amt)} from each player`, 'CARD');
          }
          this._endTurn();
        }
        break;

      case 'PAY_PLAYERS':
        {
          const amt = action.amount;
          if (amt && amt > 0) {
            const others = this.state.players.filter(p => p.id !== player.id && !p.isBankrupt);
            others.forEach(other => {
              try {
                this.economy.transfer(player.id, other.id, amt, card.text, 'CARD');
                this._addMoneyAnimation(player, -amt, 'loss');
                this._addMoneyAnimation(other, amt, 'gain');
              } catch { /* skip */ }
            });
            this._addEvent(player.id, `${player.name} paid ${this._fmt(amt)} to each player`, 'CARD');
          }
          this._endTurn();
        }
        break;

      case 'MOVE_TO':
        if (action.targetPosition !== undefined) {
          const oldPos = player.position;
          player.position = action.targetPosition;
          if (action.targetPosition === 0 && oldPos !== 0) {
            this._grantStartSalary(player, 'Advanced to START');

            this._addEvent(player.id, `${player.name} collected ${this._fmt(PASS_START_SALARY)} for reaching START`, 'CARD');
          }
           this._addEvent(player.id, `${player.name} moved to ${BOARD_TILES[action.targetPosition!].name}`, 'MOVE');
           this._emit();
           setTimeout(() => this._resolveLanding(player), 500);
        } else {
          this._endTurn();
        }
        break;

      case 'MOVE_FORWARD':
        if (action.steps && action.steps > 0) {
          const oldPos = player.position;
          const newPos = (player.position + action.steps) % 40;
          if (newPos < oldPos && newPos !== 0) {
            this._grantStartSalary(player, 'Passed START');

            this._addEvent(player.id, `${player.name} passed START — collected ${this._fmt(PASS_START_SALARY)}`, 'MOVE');
          }
          player.position = newPos;
           this._addEvent(player.id, `${player.name} moved forward ${action.steps} to ${BOARD_TILES[newPos].name}`, 'MOVE');
           this._emit();
           setTimeout(() => this._resolveLanding(player), 500);
        } else {
          this._endTurn();
        }
        break;

      case 'GO_TO_JAIL':
        this._sendToJail(player, false);
        this._emit();
        this._endTurn();
        break;

      case 'GET_OUT_OF_JAIL':
        player.getOutOfJailCards++;
        this._addEvent(player.id, `${player.name} received a Get Out of Jail Free card.`, 'CARD');
        this._emit();
        this._endTurn();
        break;

      default:
        this._endTurn();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // BANKRUPTCY & VICTORY
  // ════════════════════════════════════════════════════════════════

  private _declareBankruptcy(playerId: string, toPlayerId: string | null, debt: number, reason: string): void {
    const player = this._requirePlayer(playerId);

    // Liquidate mortgaged/owned properties to settle debts
    // Assumption: properties are sold back to bank at mortgage value when bankrupt.
    // Documented in docs/ASSUMPTIONS.md
    let recovered = 0;
    const propsToSell = player.ownedProperties.slice();
    for (const pos of propsToSell) {
      const prop = this.state.properties.find(p => p.position === pos);
      const tile = BOARD_TILES[pos];
      if (!prop || !tile) continue;

      // Sell houses/hotels first (at half price)
      if (prop.hasHotel && tile.houseCost) {
        const hotelValue = Math.round((tile.houseCost * 3) / 2); // sell at half price
        recovered += hotelValue;
        prop.hasHotel = false;
      } else if (prop.houses > 0 && tile.houseCost) {
        const houseValue = Math.round((tile.houseCost / 2) * prop.houses);
        recovered += houseValue;
        prop.houses = 0;
      }

      // Sell property itself at mortgage value
      const mortgageValue = tile.mortgageValue ?? Math.round((tile.price ?? 0) / 2);
      recovered += mortgageValue;

      prop.ownerId = null;
      prop.houses = 0;
      prop.hasHotel = false;
      prop.isMortgaged = false;
    }
    player.ownedProperties = [];

    // Add recovered money
    player.cash += recovered;

    const totalRecovery = player.cash;
    const remainingDebt = debt - totalRecovery;

    if (remainingDebt > 0 && toPlayerId) {
      // Transfer remaining to creditor (if they can take it)
      const creditor = this.state.players.find(p => p.id === toPlayerId);
      if (creditor) {
        const forgiven = Math.min(remainingDebt, player.cash);
        if (forgiven > 0) {
          this.economy.transfer(player.id, creditor.id, forgiven, `Bankruptcy settlement`, 'RENT');
          player.cash -= forgiven;
        }
      }
    }

    player.isBankrupt = true;
    player.isActive = false;
    player.cash = 0;

    this._addEvent(null, `💥 ${player.name} has gone BANKRUPT! (${reason})`, 'SYSTEM');
    this._emit();

    // Check victory
    const active = this._activeNonBankruptPlayers();
    if (active.length <= 1) {
      this._declareWinner();
      return;
    }

    // Continue game — auction off bankrupt player's properties
    this._endTurn();
  }

  private _declareWinner(): void {
    this.state.phase = 'GAME_OVER';
    this.state.gameStatus = 'FINISHED';

    const active = this._activeNonBankruptPlayers();
    if (active.length === 1) {
      this.state.winner = active[0];
      this._addEvent(null, `🏆 ${active[0].name} is the BUSINESS CHAMPION!`, 'WIN');
    } else if (active.length === 0) {
      // Everyone bankrupt — pick highest net worth
      const winner = this.state.players.reduce((best, p) => (p.netWorth > best.netWorth ? p : best));
      this.state.winner = winner;
      this._addEvent(null, `🏆 ${winner.name} wins with highest net worth!`, 'WIN');
    } else if (this.state.settings.gameMode === 'TEAM') {
      // Team victory — highest combined net worth
      this._resolveTeamVictory();
    }

    this._emit();
  }

  private _resolveTeamVictory(): void {
    if (!this.state.winner) {
      // Find teams and sum net worth
      const teamNets: Record<string, { total: number; members: Player[] }> = {};
      this.state.players.forEach(p => {
        const teamId = p.teamId || p.id;
        if (!teamNets[teamId]) teamNets[teamId] = { total: 0, members: [] };
        teamNets[teamId].total += p.netWorth;
        teamNets[teamId].members.push(p);
      });
      const bestTeam = Object.values(teamNets).reduce((best, t) => (t.total > best.total ? t : best));
      this.state.winner = bestTeam.members[0];
      this._addEvent(null, `🏆 Team ${bestTeam.members.map(m => m.name).join(' & ')} wins!`, 'WIN');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // TURN MANAGEMENT
  // ════════════════════════════════════════════════════════════════

  _endTurn(): void {
    const player = this._currentPlayer();

    // A double only grants another roll if THIS turn actually produced it.
    // `lastRoll` deliberately survives across turns (it drives utility rent
    // and the dice display), so a turn that ends WITHOUT rolling — a card
    // that moves the player, jail payment, tax, landing on START — would
    // otherwise inherit the previous turn's isDouble and roll again for free.
    const roll = this.rolledThisTurn ? this.state.lastRoll : null;

    // Clear movement state
    this.state.movementPath = [];
    this.state.currentMoveStep = 0;
    this.state.dice = null;
    this.state.pendingPropertyDecision = null;
    this.state.activeTrade = null;

    // Clear money animations
    this.state.moneyAnimations = [];

    if (roll?.isDouble && !player.isInJail && !player.isBankrupt) {
      // Player rolls again — the same turn continues, so keep the flag set.
      this.state.phase = 'WAITING_FOR_ROLL';
      this._addEvent(null, `${player.name} rolled doubles — roll again!`, 'SYSTEM');
    } else {
      this._advanceTurn();
    }
    this._emit();
    this._processTurnStart();
  }

  private _advanceTurn(): void {
    const active = this._activeNonBankruptPlayers();
    const currentIndex = active.findIndex(p => p.id === this.state.currentPlayerId);
    if (currentIndex === -1) {
      this.state.currentPlayerId = active[0].id;
    } else {
       this.state.currentPlayerId = active[(currentIndex + 1) % active.length].id;
    }
    this.state.turnNumber++;
    this.state.phase = 'WAITING_FOR_ROLL';
    this._currentPlayer().consecutiveDoubles = 0;
    this.rolledThisTurn = false;
  }

  // ════════════════════════════════════════════════════════════════
  // PUBLIC API — exposed to UI / context
  // ════════════════════════════════════════════════════════════════

  /** End the current player's turn manually (when no action pending). */
  endTurn(): void {
    if (this.state.phase === 'WAITING_FOR_ROLL' ||
        this.state.phase === 'PROPERTY_DECISION' ||
        this.state.phase === 'LANDING_RESOLUTION') {
      this._endTurn();
    }
  }

  /** Player declares bankruptcy when they cannot pay a debt. */
  declareBankruptcy(reason: string): void {
    const player = this._currentPlayer();
    if (player.isBot || player.isBankrupt) return;
    this._declareBankruptcy(player.id, null, player.cash, reason);
  }

  // ════════════════════════════════════════════════════════════════
  // AI — bot decision making
  // ════════════════════════════════════════════════════════════════

  private _aiTakeTurn(): void {
    const player = this._currentPlayer();
    if (!player.isBot || this.state.phase !== 'WAITING_FOR_ROLL') return;

    // Roll the dice for the bot
    this._doRoll();
  }

  private _aiJailDecision(player: Player): void {
    if (this.state.phase !== 'JAIL_DECISION') return;

    const canAffordFine = player.cash >= JAIL_FINE;

    if (player.getOutOfJailCards > 0) {
      this.useJailCard();
    } else if (canAffordFine && player.botDifficulty !== 'EASY') {
      this.payJailFine();
    } else if (player.botDifficulty === 'EASY') {
      // Try to roll out
      this.state.phase = 'WAITING_FOR_ROLL';
      this._emit();
      // Will roll on next turn
      this._endTurn();
    } else {
      this.payJailFine();
    }
  }

  private _aiShouldBuyProperty(player: Player, tile: BoardTileData): boolean {
    const { total } = GSTManager.withGST(tile.price ?? 0);
    if (player.cash < total) return false;

    const difficulty = player.botDifficulty;

    // Always buy if very cheap relative to cash
    if (tile.price && total < player.cash * 0.15) return true;

    // CONSERVATIVE: only buy complete groups
    if (difficulty === 'EASY') {
      return true; // buy everything
    }

    if (difficulty === 'HARD') {
      // Check if it completes a group
      if (tile.group) {
        const group = PROPERTY_GROUPS[tile.group];
        const ownedInGroup = group.members.filter(pos => {
          const prop = this.state.properties.find(p => p.position === pos);
          return prop?.ownerId === player.id;
        });
        if (ownedInGroup.length === group.members.length - 1) {
          return true; // completes the group
        }
      }
      // Only buy if cash is sufficient after purchase
      return total < player.cash * 0.3;
    }

    // NORMAL: buy to complete groups, otherwise if affordable
    if (tile.group) {
      const group = PROPERTY_GROUPS[tile.group];
      const ownedInGroup = group.members.filter(pos => {
        const prop = this.state.properties.find(p => p.position === pos);
        return prop?.ownerId === player.id;
      });
      if (ownedInGroup.length === group.members.length - 1) {
        return true; // completes the group
      }
    }
    return total < player.cash * 0.25;
  }

  private _aiShouldBid(player: Player, tile: BoardTileData, bidAmount: number): boolean {
    if (player.cash < bidAmount) return false;

    const difficulty = player.botDifficulty;

    if (difficulty === 'EASY') {
      // Bid up to 50% of cash if it completes a group
      if (tile.group) {
        const group = PROPERTY_GROUPS[tile.group];
        const ownedInGroup = group.members.filter(pos => {
          const prop = this.state.properties.find(p => p.position === pos);
          return prop?.ownerId === player.id;
        });
        if (ownedInGroup.length === group.members.length - 1) {
          return bidAmount < player.cash * 0.5;
        }
      }
      return bidAmount < player.cash * 0.3;
    }

    if (difficulty === 'HARD') {
      if (tile.group) {
        const group = PROPERTY_GROUPS[tile.group];
        const ownedInGroup = group.members.filter(pos => {
          const prop = this.state.properties.find(p => p.position === pos);
          return prop?.ownerId === player.id;
        });
        if (ownedInGroup.length === group.members.length - 1) {
          return bidAmount < player.cash * 0.7;
        }
      }
      // Don't overbid
      const fairValue = tile.price ?? 5000;
      return bidAmount < fairValue * 1.2 && bidAmount < player.cash * 0.5;
    }

    // NORMAL
    return bidAmount < (tile.price ?? 5000) * 0.8 && bidAmount < player.cash * 0.4;
  }

  private _aiShouldBuild(player: Player, tile: BoardTileData): boolean {
    const propState = this.state.properties.find(p => p.position === tile.position);
    if (!propState || propState.ownerId !== player.id) return false;
    if (tile.houseCost === undefined) return false;

    const { total } = GSTManager.withGST(tile.houseCost);

    // Need at least 2x house cost to build
    if (player.cash < total * 2) return false;

    // HARD: build if profitable
    if (player.botDifficulty === 'HARD') {
      const rentIncrease = (tile.houseRent?.[0] ?? 0) - (tile.baseRent ?? 0);
      return total < player.cash * 0.3 && rentIncrease > 0;
    }

    return total < player.cash * 0.4;
  }

  private _aiTradeDecision(player: Player): void {
    // Simple AI trading: offer a property to a player who needs it to complete a group
    if (!this.state.settings.tradingEnabled) return;

    const target = this.state.players.find(p => p.id !== player.id && !p.isBankrupt && !p.isBot);
    if (!target) return;

    // Find a property the target might want
    for (const pos of player.ownedProperties) {
      const tile = BOARD_TILES[pos];
      if (!tile.group) continue;

      const group = PROPERTY_GROUPS[tile.group];
      const targetOwnedInGroup = group.members.filter(p => {
        const prop = this.state.properties.find(pr => pr.position === p);
        return prop?.ownerId === target.id;
      });

      if (targetOwnedInGroup.length > 0) {
        // Offer this property
        const offer: Omit<TradeOffer, 'id' | 'status'> & { toPlayerId: string } = {
          fromPlayerId: player.id,
          toPlayerId: target.id,
          offeredCash: 0,
          offeredProperties: [pos],
          requestedCash: 0,
          requestedProperties: [],
        };
        this.createTradeOffer(offer);
        return;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // AI property decision (called when landing on unowned property)
  // ════════════════════════════════════════════════════════════════

  aiDecideProperty(position: number): void {
    const player = this._currentPlayer();
    if (!player.isBot) return;
    const tile = BOARD_TILES[position];
    if (!tile) return;

    if (this._aiShouldBuyProperty(player, tile)) {
      this.buyProperty();
    } else {
      if (this.state.settings.auctionsEnabled) {
        this.declineProperty();
      } else {
        this._endTurn();
      }
    }
  }

  aiDecideAuctionBid(): void {
    const player = this._currentPlayer();
    if (!player.isBot) return;
    const auction = this.state.auction;
    if (!auction || !auction.isActive) return;

    const tile = BOARD_TILES[auction.propertyPosition];
    const bidAmount = auction.currentBid + auction.bidIncrement;

    if (this._aiShouldBid(player, tile, bidAmount)) {
      this.placeBid(bidAmount);
    } else {
      this.passAuction();
    }
  }

  aiDecideConstruction(position: number, buildHotel: boolean): void {
    const player = this._currentPlayer();
    if (!player.isBot) return;
    const tile = BOARD_TILES[position];
    if (!tile) return;

    if (this._aiShouldBuild(player, tile)) {
      if (buildHotel) {
        this.buildHotel(position);
      } else {
        this.buildHouse(position);
      }
    }
  }

  aiEndTurn(): void {
    const player = this._currentPlayer();
    if (!player.isBot) return;

    // AI might build houses before ending turn
    if (this.state.phase === 'WAITING_FOR_ROLL') {
      this._endTurn();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ════════════════════════════════════════════════════════════════

  private _requirePlayer(id: string): Player {
    const player = this.state.players.find(p => p.id === id);
    if (!player) throw new Error(`[GameEngine] Player not found: ${id}`);
    return player;
  }

  private _currentPlayer(): Player {
    const player = this.state.players.find(p => p.id === this.state.currentPlayerId);
    if (!player) throw new Error('[GameEngine] Current player not found');
    return player;
  }

  private _activeNonBankruptPlayers(): Player[] {
    return this.state.players.filter(p => p.isActive && !p.isBankrupt);
  }

  private _playerName(id: string): string {
    return this.state.players.find(p => p.id === id)?.name ?? 'Unknown';
  }

  _fmt(amount: number): string {
    return formatRupees(amount);
  }

  private _addMoneyAnimation(player: Player, amount: number, className: string): void {
    this.state.moneyAnimations.push({
      id: nanoid(),
      from: { x: 0, y: 0 },
      to: { x: 0, y: 0 },
      amount: Math.abs(amount),
      type: amount > 0 ? 'gain' : 'loss',
      description: className,
    });
  }

  private _addEvent(playerId: string | null, message: string, type: GameEvent['type']): void {
    this.state.events.push({
      id: nanoid(),
      timestamp: Date.now(),
      playerId: playerId ?? undefined,
      message,
      type,
    });
    if (this.state.events.length > 200) {
      this.state.events = this.state.events.slice(-150);
    }
  }

  _recalcNetWorth(): void {
    this.state.players.forEach(player => {
      const propValue = player.ownedProperties.reduce((acc, pos) => {
        const tile = BOARD_TILES[pos];
        const propState = this.state.properties.find(p => p.position === pos);
        if (!tile || !propState) return acc;
        const baseValue = tile.price ?? 0;
        const buildingValue = propState
          ? (propState.houses * (tile.houseCost ?? 0)) + (propState.hasHotel ? (tile.houseCost ?? 0) * 3 : 0)
          : 0;
        const netValue = propState?.isMortgaged ? Math.round(baseValue * 0.5) : baseValue;
        return acc + netValue + buildingValue;
      }, 0);
      player.netWorth = player.cash + propValue;
    });
  }

  private _emit(): void {
    this._recalcNetWorth();
    this.onStateChange({ ...this.state });
  }

  // ════════════════════════════════════════════════════════════════
  // PUBLIC — for multiplayer mode
  // ════════════════════════════════════════════════════════════════

  /** Expose state for external consumption. */
  public getEngineState(): GameState {
    return this.state;
  }

  /** Cleanup timers. */
  destroy(): void {
    if (this.moveTimer) clearTimeout(this.moveTimer);
    if (this.auctionTimer) clearTimeout(this.auctionTimer);
    if (this.aiTimer) clearTimeout(this.aiTimer);
  }
}
