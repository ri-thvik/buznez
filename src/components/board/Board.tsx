// ============================================================
// BUSINESS BHARAT — Board Component
//
// 11×11 CSS grid board.
// - Positions 0–39 on the perimeter (40 tiles exactly).
// - Center (rows 2–10, cols 2–10) is the game area.
// - Tile orientation is set per side (bottom/top/left/right/corner).
// - Board is always square (660×660px, scales with container).
// ============================================================

import React, { useMemo } from 'react';
import { BOARD_TILES } from '@/data/boardData';
import { getGridPosition } from '@/types/game';
import type { GameState, PropertyState, Player, BoardTileData } from '@/types/game';
import { BoardTile } from './BoardTile';
import { BoardCenter } from './BoardCenter';

interface BoardProps {
  gameState: GameState;
  onRollDice: () => void;
  localPlayerId?: string;
  onPropertyClick?: (tile: BoardTileData) => void;
}

export function Board({ gameState, onRollDice, localPlayerId, onPropertyClick }: BoardProps) {
  // Build a map: position → players currently there
  const playersByPosition = useMemo(() => {
    const map = new Map<number, Player[]>();
    gameState.players.forEach(player => {
      if (!player.isActive || player.isBankrupt) return;
      const arr = map.get(player.position) ?? [];
      arr.push(player);
      map.set(player.position, arr);
    });
    return map;
  }, [gameState.players]);

  // Build a map: position → property state
  const propStateByPosition = useMemo(() => {
    const map = new Map<number, PropertyState>();
    gameState.properties.forEach(p => map.set(p.position, p));
    return map;
  }, [gameState.properties]);

  // Build a map: ownerId → Player
  const playerById = useMemo(() => {
    const map = new Map<string, Player>();
    gameState.players.forEach(p => map.set(p.id, p));
    return map;
  }, [gameState.players]);

  return (
    <div className="bb-board" style={{ flexShrink: 0 }}>
      {/* ── 40 perimeter tiles ────────────────────────────── */}
      {BOARD_TILES.map(tile => {
        const { row, col, side } = getGridPosition(tile.position);
        const propState = propStateByPosition.get(tile.position);
        const owner = propState?.ownerId ? playerById.get(propState.ownerId) : undefined;
        const playersHere = playersByPosition.get(tile.position) ?? [];

          return (
            <BoardTile
              key={tile.position}
              tile={tile}
              side={side}
              row={row + 1}   /* CSS grid is 1-indexed */
              col={col + 1}
              propState={propState}
              owner={owner}
              playersHere={playersHere}
              onClick={() => onPropertyClick?.(tile)}
            />
          );
      })}

      {/* ── Center game area ───────────────────────────────── */}
      <BoardCenter
        gameState={gameState}
        onRollDice={onRollDice}
        currentPlayerId={localPlayerId}
      />
    </div>
  );
}
