// ============================================================
// BUSINESS BHARAT — Property Modal
// Shows full property details when a property is clicked.
// ============================================================

import React from 'react';
import { Home, Hotel, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatRupees } from '@/types/game';
import type { BoardTileData, PropertyState } from '@/types/game';
import { PROPERTY_GROUPS } from '@/data/boardData';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tile: BoardTileData | null;
  propState: PropertyState | null;
  ownerName?: string;
  ownerColor?: string;
  isOwner: boolean;
  canBuildHouse: boolean;
  canBuildHotel: boolean;
  isMortgaged: boolean;
  onBuildHouse: () => void;
  onBuildHotel: () => void;
  onReleaseMortgage: () => void;
}

export function PropertyModal({
  isOpen,
  onClose,
  tile,
  propState,
  ownerName,
  ownerColor,
  isOwner,
  canBuildHouse,
  canBuildHotel,
  isMortgaged,
  onBuildHouse,
  onBuildHotel,
  onReleaseMortgage,
}: PropertyModalProps) {
  if (!isOpen || !tile || !propState) return null;
  if (!tile.group || !tile.price) return null;

  const group = PROPERTY_GROUPS[tile.group];
  const houseIcon = (count: number) => {
    const icons = [];
    for (let i = 0; i < count; i++) {
      icons.push(<Home key={i} size={16} className="text-gold" />);
    }
    for (let i = count; i < 3; i++) {
      icons.push(<Home key={i} size={16} className="text-text-muted/30" />);
    }
    return icons;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tile.name} size="sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: `${tile.groupColor}30`, color: tile.groupColor }}
            >
              {tile.group}
            </span>
          </div>
          {propState.ownerId && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ownerColor }} />
              <span className="text-sm text-text-secondary">{ownerName || 'Unknown'}</span>
            </div>
          )}
        </div>

        {/* Price & Rent */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-muted text-xs">Purchase Price</span>
            <span className="block text-text-primary font-semibold">{formatRupees(tile.price)}</span>
          </div>
          <div>
            <span className="text-text-muted text-xs">Base Rent</span>
            <span className="block text-text-primary font-semibold">{formatRupees(tile.baseRent ?? 0)}</span>
          </div>
          <div>
            <span className="text-text-muted text-xs">Rent with 1 House</span>
            <span className="block text-text-secondary">{formatRupees(tile.houseRent?.[0] ?? 0)}</span>
          </div>
          <div>
            <span className="text-text-muted text-xs">Rent with Hotel</span>
            <span className="block text-text-secondary">{formatRupees(tile.hotelRent ?? 0)}</span>
          </div>
        </div>

        {/* House construction */}
        {group && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Houses</span>
              <div className="flex gap-1">{houseIcon(propState.houses)}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Hotel</span>
              <span>{propState.hasHotel ? <Hotel size={16} className="text-gold" /> : <Hotel size={16} className="text-text-muted/30" />}</span>
            </div>
            <div className="text-xs text-text-muted">
              House cost: {formatRupees(group.houseCost)} · Mortgage: {formatRupees(tile.mortgageValue ?? 0)}
            </div>
          </div>
        )}

        {/* Mortgage status */}
        {isMortgaged && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Lock size={12} />
            <span>Property is mortgaged. No rent can be collected.</span>
          </div>
        )}

        {/* Actions */}
        {isOwner && !isMortgaged && group && (
          <div className="flex gap-2 pt-2 border-t border-border-subtle">
            {canBuildHouse && (
              <Button variant="ghost" size="sm" icon={Home} onClick={onBuildHouse}>
                Build House
              </Button>
            )}
            {canBuildHotel && (
              <Button variant="ghost" size="sm" icon={Hotel} onClick={onBuildHotel}>
                Build Hotel
              </Button>
            )}
          </div>
        )}

        {isOwner && isMortgaged && (
          <div className="pt-2 border-t border-border-subtle">
            <Button variant="ghost" size="sm" icon={Unlock} onClick={onReleaseMortgage}>
              Release Mortgage ({formatRupees(Math.ceil((tile.price ?? 0) / 2 * 1.1))})
            </Button>
          </div>
        )}

        {!isOwner && !propState.ownerId && (
          <div className="pt-2 border-t border-border-subtle text-xs text-text-muted">
            Not owned. Land here during your turn to buy.
          </div>
        )}
      </div>
    </Modal>
  );
}
