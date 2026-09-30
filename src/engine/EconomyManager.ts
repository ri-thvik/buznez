// ============================================================
// BUSINESS BHARAT — Economy Manager
//
// ALL money flows must go through this module.
// Direct mutation of player.cash is PROHIBITED.
// Every transaction is recorded.
// Amounts are always integers (rupees, never floats).
// ============================================================

import type { GameState, Transaction } from '@/types/game';
import { nanoid } from './utils';

export class EconomyManager {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  // ─── Core primitives ──────────────────────────────────────

  /** Add cash to a player (from bank or transfer). */
  credit(playerId: string, amount: number, description: string): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`[Economy] Invalid credit amount: ${amount}`);
    }
    const player = this._requirePlayer(playerId);
    player.cash += amount;
    this._record({ fromId: 'BANK', toId: playerId, amount, description, type: 'SALARY' });
  }

  /** Deduct cash from a player (to bank or transfer). */
  debit(playerId: string, amount: number, description: string): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`[Economy] Invalid debit amount: ${amount}`);
    }
    const player = this._requirePlayer(playerId);
    if (player.cash < amount) {
      throw new Error(`[Economy] Insufficient funds: ${player.name} has ₹${player.cash}, needs ₹${amount}`);
    }
    player.cash -= amount;
    this._record({ fromId: playerId, toId: 'BANK', amount, description, type: 'SALARY' });
  }

  /** Transfer cash between two players. */
  transfer(fromId: string, toId: string, amount: number, description: string, txType: Transaction['type'] = 'RENT'): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`[Economy] Invalid transfer amount: ${amount}`);
    }
    const from = this._requirePlayer(fromId);
    const to = this._requirePlayer(toId);
    if (from.cash < amount) {
      throw new Error(`[Economy] Insufficient funds: ${from.name} has ₹${from.cash}, needs ₹${amount}`);
    }
    from.cash -= amount;
    to.cash += amount;
    this._record({ fromId, toId, amount, description, type: txType });
  }

  /** Bank pays player (salary, refunds, mortgages, etc.). */
  receiveFromBank(playerId: string, amount: number, description: string, txType: Transaction['type'] = 'SALARY'): void {
    return this.payPlayer(playerId, amount, description, txType);
  }

  /** Player pays bank (taxes, fees, etc.). */
  payBank(playerId: string, amount: number, description: string, txType: Transaction['type'] = 'INCOME_TAX'): void {
    if (!Number.isInteger(amount) || amount <= 0) return;
    const player = this._requirePlayer(playerId);
    if (player.cash < amount) {
      throw new Error(`[Economy] Insufficient funds for bank payment`);
    }
    player.cash -= amount;
    this.state.bank += amount;
    this._record({ fromId: playerId, toId: 'BANK', amount, description, type: txType });
  }

  /** Bank pays player (salary, refunds, etc.). */
  payPlayer(playerId: string, amount: number, description: string, txType: Transaction['type'] = 'SALARY'): void {
    if (!Number.isInteger(amount) || amount <= 0) return;
    const player = this._requirePlayer(playerId);
    player.cash += amount;
    this.state.bank -= amount;
    this._record({ fromId: 'BANK', toId: playerId, amount, description, type: txType });
  }

  /** Round to nearest ₹50 (used for GST and taxes). */
  static roundToNearest50(amount: number): number {
    return Math.round(amount / 50) * 50;
  }

  /** Calculate GST (5%) on an amount, rounded to nearest ₹50. */
  static calculateGST(amount: number): number {
    return EconomyManager.roundToNearest50(Math.round(amount * 0.05));
  }

  // ─── Internal helpers ─────────────────────────────────────

  private _requirePlayer(id: string) {
    const player = this.state.players.find(p => p.id === id);
    if (!player) throw new Error(`[Economy] Player not found: ${id}`);
    return player;
  }

  private _record(tx: Omit<Transaction, 'id' | 'timestamp'>): void {
    this.state.transactions.push({
      id: nanoid(),
      timestamp: Date.now(),
      ...tx,
    });
  }
}
