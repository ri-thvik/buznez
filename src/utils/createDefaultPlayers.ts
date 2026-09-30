// ============================================================
// BUSINESS BHARAT — Default Players Factory
// ============================================================

import { nanoid } from '@/engine/utils';
import type { Player } from '@/types/game';

const BOT_NAMES = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Meera', 'Rohan'];
const PLAYER_COLORS = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
const TOKEN_SHAPES = ['BRIEFCASE', 'BUILDING', 'CAR', 'COIN'] as const;

export function createDefaultPlayers(
  humanName: string,
  botCount: number
): Pick<Player, 'id' | 'name' | 'color' | 'tokenShape' | 'isBot' | 'botDifficulty'>[] {
  const players: Pick<Player, 'id' | 'name' | 'color' | 'tokenShape' | 'isBot' | 'botDifficulty'>[] = [
    {
      id: nanoid(),
      name: humanName,
      color: PLAYER_COLORS[0],
      tokenShape: TOKEN_SHAPES[0],
      isBot: false,
      botDifficulty: undefined,
    },
  ];

  const usedNames = new Set<string>();
  usedNames.add(humanName);

  for (let i = 0; i < botCount; i++) {
    let botName = BOT_NAMES[i % BOT_NAMES.length];
    while (usedNames.has(botName)) botName = botName + '_2';
    usedNames.add(botName);

    players.push({
      id: nanoid(),
      name: botName,
      color: PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length],
      tokenShape: TOKEN_SHAPES[(i + 1) % TOKEN_SHAPES.length],
      isBot: true,
      botDifficulty: 'NORMAL',
    });
  }

  return players;
}