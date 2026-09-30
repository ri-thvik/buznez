// ============================================================
// BUSINESS BHARAT — Dice Engine
//
// The SERVER (or local engine) generates dice results.
// The FRONTEND never determines dice values.
// ============================================================

import type { DiceRoll } from '@/types/game';

export class DiceEngine {
  /** Roll two dice. Returns typed result. Server/engine owns this. */
  static roll(): DiceRoll {
    const die1 = DiceEngine._rollOne();
    const die2 = DiceEngine._rollOne();
    return {
      die1,
      die2,
      isDouble: die1 === die2,
      total: die1 + die2,
    };
  }

  private static _rollOne(): number {
    return Math.floor(Math.random() * 6) + 1;
  }
}
