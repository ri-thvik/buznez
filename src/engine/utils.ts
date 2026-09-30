// ============================================================
// BUSINESS BHARAT — Shared Engine Utilities
// ============================================================

/** Simple ID generator (no external dependency needed). */
export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/** Shuffle an array in-place using Fisher-Yates. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
