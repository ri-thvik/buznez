// ============================================================
// BUSINESS BHARAT - Board Tile
//
// Renders a single board tile at its grid position.
// Tile orientation is handled by CSS classes based on `side`.
// Color band always faces INWARD (toward the center).
//
// Bottom row:  normal layout  (color band at top)
// Top row:     rotated 180°   (color band at bottom via inner div)
// Right col:   inner div rotated -90° to fit landscape cell
// Left col:    inner div rotated  90° to fit landscape cell
// Corner tiles: special layout, no rotation
// ============================================================

import React from 'react';
import {
  Star, AlertTriangle, Gift, Building2, Zap,
  Plane, Train, Droplets, Home, Hotel, Lock,
  Coffee, Sunset, Play, HelpCircle,
  type LucideIcon
} from 'lucide-react';
import type { BoardTileData, TileSide, PropertyState, Player } from '@/types/game';
import { formatRupees } from '@/types/game';
// Single source of truth for group colours - never hardcode them here.
import { GROUP_COLORS } from '@/data/boardData';
import { PlayerToken } from './PlayerToken';

// ---- Tile icons by type ---------------------------------------

const TILE_ICONS: Record<string, LucideIcon> = {
  START:          Play,
  CHANCE:         HelpCircle,
  COMMUNITY_CHEST:Gift,
  SURPRISE:       Star,
  INCOME_TAX:     AlertTriangle,
  GST:            AlertTriangle,
  JAIL:           Lock,
  FREE_REST:      Sunset,
  CLUB_HOUSE:     Coffee,
  REST_HOUSE:     Home,
  UTILITY_AIRPORT:Plane,
  UTILITY_RAIL:   Train,
  UTILITY_ELEC:   Zap,
  UTILITY_WATER:  Droplets,
  UTILITY_DEFAULT:Building2,
};

function getUtilityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('airport')) return TILE_ICONS.UTILITY_AIRPORT;
  if (lower.includes('rail'))    return TILE_ICONS.UTILITY_RAIL;
  if (lower.includes('electric')) return TILE_ICONS.UTILITY_ELEC;
  if (lower.includes('water'))   return TILE_ICONS.UTILITY_WATER;
  return TILE_ICONS.UTILITY_DEFAULT;
}

// ---- House/Hotel indicators ------------------------------------

function BuildingIndicators({ houses, hasHotel }: { houses: number; hasHotel: boolean }) {
  if (hasHotel) {
    return (
      <div className="flex gap-0.5 justify-center">
        <Hotel size={8} className="text-gold" />
      </div>
    );
  }
  if (houses === 0) return null;
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: houses }).map((_, i) => (
        <Home key={i} size={7} className="text-success" />
      ))}
    </div>
  );
}

// ---- Shared tile content ---------------------------------------

interface TileContentProps {
  tile: BoardTileData;
  propState?: PropertyState;
  owner?: Player;
  playersHere: Player[];
  isCorner?: boolean;
}

// Long city names must stay readable. Two levers are used together:
//  1. `displayName` inserts an explicit break at a syllable boundary for the
//     handful of names that cannot fit on one line, so the browser never has
//     to break mid-word ("Karimnagar" must not become "Karimmag ar").
//  2. The clamp() floor guarantees a hard 10px minimum at small board sizes.
const NAME_BREAKS: Record<string, [string, string]> = {
  Visakhapatnam: ['Visakha', 'patnam'],
  Vijayawada: ['Vijaya', 'wada'],
  Nizamabad: ['Nizama', 'bad'],
  Karimnagar: ['Karim', 'nagar'],
  Hyderabad: ['Hydera', 'bad'],
  Coimbatore: ['Coimba', 'tore'],
  Bengaluru: ['Benga', 'luru'],
  Ahmedabad: ['Ahmeda', 'bad'],
  Gurugram: ['Guru', 'gram'],
};

function displayName(name: string): string {
  return NAME_BREAKS[name] ? NAME_BREAKS[name].join(' ') : name;
}

function nameFontSize(name: string): string {
  const len = name.length;
  if (len <= 8) return 'var(--bb-tile-name, 11px)';
  if (len <= 11) return 'clamp(10px, calc(var(--bb-tile-name, 11px) * 0.82), 15px)';
  return 'clamp(10px, calc(var(--bb-tile-name, 11px) * 0.72), 15px)';
}

function TileContent({ tile, propState, owner, playersHere, isCorner }: TileContentProps) {
  const iconSize = isCorner ? 20 : 13;

  // --- PROPERTY tile -----------------------------------------
  if (tile.type === 'PROPERTY') {
    const bandColor = (tile.group && GROUP_COLORS[tile.group]) || tile.groupColor || '#3A2A52';
    return (
      <div className="flex flex-col h-full w-full">
        {/* Group colour strip */}
        <div
          className="flex-shrink-0 w-full"
          style={{
            height: 'var(--bb-group-strip, 12px)',
            backgroundColor: bandColor,
          }}
        />
        {/* Content area */}
        <div className="flex flex-col flex-1 items-center justify-center p-0.5 gap-0.5 overflow-hidden">
          {/* Owner dot */}
          {owner && (
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: owner.color }}
            />
          )}
          {/* Buildings */}
          {propState && (
            <BuildingIndicators houses={propState.houses} hasHotel={propState.hasHotel} />
          )}
{/* City name - readable, scales with board, never breaks mid-word */}
          <span
            className="text-text-primary text-center font-bold leading-[1.05] w-full px-0.5"
            style={{
              fontSize: nameFontSize(tile.name),
              whiteSpace: 'pre-line',
              wordBreak: 'keep-all',
              overflowWrap: 'normal',
            }}
          >
            {displayName(tile.name)}
          </span>
          {/* Price */}
          {tile.price && (
            <span
              className="text-gold font-bold leading-none"
              style={{ fontSize: 'var(--bb-tile-price, 10px)' }}
            >
              {formatRupees(tile.price)}
            </span>
          )}
          {/* Mortgage indicator */}
          {propState?.isMortgaged && (
            <span
              className="text-danger font-bold leading-none"
              style={{ fontSize: 'var(--bb-tile-price, 10px)' }}
            >
              MORTGAGED
            </span>
          )}
        </div>
        {/* Player tokens */}
        {playersHere.length > 0 && (
          <div className="flex-shrink-0 flex justify-center pb-0.5">
            <div className="relative flex">
              {playersHere.map((p, i) => (
                <PlayerToken key={p.id} player={p} size={10} stackIndex={i} animate />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- UTILITY tile ------------------------------------------
  if (tile.type === 'UTILITY') {
    const Icon = getUtilityIcon(tile.name);
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-0.5 p-1 overflow-hidden">
        {owner && (
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: owner.color }}
          />
        )}
        <Icon size={iconSize} className="text-info flex-shrink-0" />
        <span
          className="text-text-secondary text-center font-medium leading-tight"
          style={{ fontSize: 'var(--bb-tile-label, 10px)' }}
        >
          {tile.name}
        </span>
        {tile.price && (
          <span style={{ fontSize: 'var(--bb-tile-price, 9px)' }} className="text-gold">
            {formatRupees(tile.price)}
          </span>
        )}
        {playersHere.length > 0 && (
          <div className="relative flex">
            {playersHere.map((p, i) => (
              <PlayerToken key={p.id} player={p} size={10} stackIndex={i} animate />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- CORNER / SPECIAL tiles --------------------------------
  const Icon = TILE_ICONS[tile.type] ?? HelpCircle;

  // START corner
  if (tile.type === 'START') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-0.5 p-1">
        <div className="flex items-center gap-0.5">
          <Play size={isCorner ? 16 : 10} className="text-success" />
        </div>
        <span
          className="text-success font-bold font-display text-center"
          style={{ fontSize: 'clamp(10px, 1.5cqw, 15px)' }}
        >
          START
        </span>
        <span style={{ fontSize: 'clamp(8px, 1.1cqw, 11px)' }} className="text-text-muted text-center leading-tight">
          Collect --1,500
        </span>
        {playersHere.length > 0 && (
          <div className="relative flex mt-0.5">
            {playersHere.map((p, i) => (
              <PlayerToken key={p.id} player={p} size={isCorner ? 16 : 10} stackIndex={i} animate />
            ))}
          </div>
        )}
      </div>
    );
  }

  // JAIL corner
  if (tile.type === 'JAIL') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-0.5 p-1">
        <Lock size={isCorner ? 16 : 10} className="text-danger" />
        <span style={{ fontSize: 'clamp(9px, 1.3cqw, 13px)' }} className="text-danger font-bold">JAIL</span>
        <span style={{ fontSize: 'clamp(7px, 1cqw, 10px)' }} className="text-text-muted text-center">Just Visiting</span>
        {playersHere.length > 0 && (
          <div className="relative flex mt-0.5">
            {playersHere.map((p, i) => (
              <PlayerToken key={p.id} player={p} size={isCorner ? 14 : 9} stackIndex={i} animate />
            ))}
          </div>
        )}
      </div>
    );
  }

  // FREE REST corner
  if (tile.type === 'FREE_REST') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-0.5 p-1">
        <Sunset size={isCorner ? 16 : 10} className="text-info" />
        <span style={{ fontSize: 'clamp(9px, 1.2cqw, 12px)' }} className="text-info font-bold text-center">FREE REST</span>
        {playersHere.length > 0 && (
          <div className="relative flex mt-0.5">
            {playersHere.map((p, i) => (
              <PlayerToken key={p.id} player={p} size={isCorner ? 14 : 9} stackIndex={i} animate />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Generic special tiles (CHANCE, COMMUNITY_CHEST, SURPRISE, INCOME_TAX, GST, CLUB_HOUSE, REST_HOUSE)
  const labelColors: Partial<Record<string, string>> = {
    CHANCE:          'text-brand-bright',
    COMMUNITY_CHEST: 'text-info',
    SURPRISE:        'text-gold',
    INCOME_TAX:      'text-danger',
    GST:             'text-danger',
    CLUB_HOUSE:      'text-success',
    REST_HOUSE:      'text-success',
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center gap-0.5 p-1 overflow-hidden">
      <Icon size={iconSize} className={labelColors[tile.type] ?? 'text-text-secondary'} />
      <span
        className={`font-semibold text-center leading-tight ${labelColors[tile.type] ?? 'text-text-secondary'}`}
        style={{ fontSize: 'var(--bb-tile-label, 10px)' }}
      >
        {tile.name}
      </span>
      {playersHere.length > 0 && (
        <div className="relative flex mt-0.5">
          {playersHere.map((p, i) => (
            <PlayerToken key={p.id} player={p} size={10} stackIndex={i} animate />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Main BoardTile component ----------------------------------

interface BoardTileProps {
  tile: BoardTileData;
  side: TileSide;
  row: number;  // CSS grid row (1-indexed)
  col: number;  // CSS grid column (1-indexed)
  propState?: PropertyState;
  owner?: Player;
  playersHere: Player[];
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function BoardTile({
  tile,
  side,
  row,
  col,
  propState,
  owner,
  playersHere,
  isHighlighted = false,
  onClick,
}: BoardTileProps) {
  const isCorner = side === 'corner';

  return (
    <div
      className={`bb-tile ${isHighlighted ? 'ring-2 ring-gold ring-inset' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        gridRow: row,
        gridColumn: col,
      }}
      data-position={tile.position}
      data-type={tile.type}
      onClick={onClick}
    >
      {/* --- Bottom row: natural layout ------------------------ */}
      {(side === 'bottom' || isCorner) && (
        <TileContent
          tile={tile}
          propState={propState}
          owner={owner}
          playersHere={playersHere}
          isCorner={isCorner}
        />
      )}

      {/* --- Top row: 180° inner rotation --------------------- */}
      {side === 'top' && (
        <div className="bb-tile-inner-top">
          <TileContent
            tile={tile}
            propState={propState}
            owner={owner}
            playersHere={playersHere}
          />
        </div>
      )}

      {/* --- Right col: -90° rotation ------------------------- */}
      {side === 'right' && (
        <div className="bb-tile-inner-right">
          <TileContent
            tile={tile}
            propState={propState}
            owner={owner}
            playersHere={playersHere}
          />
        </div>
      )}

      {/* --- Left col: +90° rotation -------------------------- */}
      {side === 'left' && (
        <div className="bb-tile-inner-left">
          <TileContent
            tile={tile}
            propState={propState}
            owner={owner}
            playersHere={playersHere}
          />
        </div>
      )}
    </div>
  );
}


