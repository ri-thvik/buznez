// ============================================================
// BUSINESS BHARAT — Room Code Generator
// 6-character codes using unambiguous alphabet.
// Alphabet excludes: O, 0, I, 1, S, 5
// ============================================================

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ2346789';
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Validate room code format. */
export function validateRoomCode(code: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ2346789]{6}$/.test(code);
}
