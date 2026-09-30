// ============================================================
// BUSINESS BHARAT — Exact 40-Position Board Data
// All rent values are pre-calculated. Do NOT recalculate in React.
// ============================================================

// ─── Property group colours (single source of truth) ───────
// Import GROUP_COLORS everywhere instead of hardcoding colours.

export const GROUP_COLORS: Record<string, string> = {
  BROWN: '#8B5E3C',
  LIGHT_BLUE: '#38BDF8',
  PURPLE: '#8B5CF6',
  ORANGE: '#F97316',
  RED: '#EF4444',
  YELLOW: '#FACC15',
  GREEN: '#22C55E',
};

// Base rent ≈ 8% of price, rounded to nearest ₹50.
// House rents: 2×, 3×, 4× base rent.
// Hotel rent: 6× base rent.
// Mortgage value: 50% of purchase price.
// ============================================================

import type { BoardTileData } from '@/types/game';

export const BOARD_TILES: BoardTileData[] = [
  // ─────────────────────────────────────────────────────────
  // BOTTOM ROW: positions 0–10 (left → right)
  // ─────────────────────────────────────────────────────────

  {
    position: 0,
    name: 'START',
    type: 'START',
    description: 'Collect ₹1,500 salary each time you pass',
  },
  {
    position: 1,
    name: 'Warangal',
    type: 'PROPERTY',
    group: 'BROWN',
    groupColor: '#8B5E3C',
    price: 2000,
    baseRent: 150,
    houseRent: [300, 450, 600],
    hotelRent: 900,
    houseCost: 500,
    mortgageValue: 1000,
  },
  {
    position: 2,
    name: 'Chance',
    type: 'CHANCE',
    description: 'Draw a Chance card',
  },
  {
    position: 3,
    name: 'Nizamabad',
    type: 'PROPERTY',
    group: 'BROWN',
    groupColor: '#8B5E3C',
    price: 2200,
    baseRent: 200,
    houseRent: [400, 600, 800],
    hotelRent: 1200,
    houseCost: 500,
    mortgageValue: 1100,
  },
  {
    position: 4,
    name: 'Income Tax',
    type: 'INCOME_TAX',
    description: '₹50 × properties owned (max ₹500)',
  },
  {
    position: 5,
    name: 'Karimnagar',
    type: 'PROPERTY',
    group: 'BROWN',
    groupColor: '#8B5E3C',
    price: 2400,
    baseRent: 200,
    houseRent: [400, 600, 800],
    hotelRent: 1200,
    houseCost: 500,
    mortgageValue: 1200,
  },
  {
    position: 6,
    name: 'Hyderabad Airport',
    type: 'UTILITY',
    description: 'Airport utility — rent based on dice roll',
    price: 5000,
    mortgageValue: 2500,
  },
  {
    position: 7,
    name: 'Vijayawada',
    type: 'PROPERTY',
    group: 'LIGHT_BLUE',
    groupColor: '#38BDF8',
    price: 3000,
    baseRent: 250,
    houseRent: [500, 750, 1000],
    hotelRent: 1500,
    houseCost: 600,
    mortgageValue: 1500,
  },
  {
    position: 8,
    name: 'Community Chest',
    type: 'COMMUNITY_CHEST',
    description: 'Draw a Community Chest card',
  },
  {
    position: 9,
    name: 'Visakhapatnam',
    type: 'PROPERTY',
    group: 'LIGHT_BLUE',
    groupColor: '#38BDF8',
    price: 3200,
    baseRent: 250,
    houseRent: [500, 750, 1000],
    hotelRent: 1500,
    houseCost: 600,
    mortgageValue: 1600,
  },
  {
    position: 10,
    name: 'JAIL',
    type: 'JAIL',
    description: 'Just Visiting / In Jail',
  },

  // ─────────────────────────────────────────────────────────
  // RIGHT COL: positions 11–19 (bottom → top)
  // ─────────────────────────────────────────────────────────

  {
    position: 11,
    name: 'Coimbatore',
    type: 'PROPERTY',
    group: 'LIGHT_BLUE',
    groupColor: '#38BDF8',
    price: 3400,
    baseRent: 250,
    houseRent: [500, 750, 1000],
    hotelRent: 1500,
    houseCost: 600,
    mortgageValue: 1700,
  },
  {
    position: 12,
    name: 'Railway Corporation',
    type: 'UTILITY',
    description: 'Rail utility — rent based on railways owned',
    price: 5000,
    mortgageValue: 2500,
  },
  {
    position: 13,
    name: 'Jaipur',
    type: 'PROPERTY',
    group: 'PURPLE',
    groupColor: '#8B5CF6',
    price: 4000,
    baseRent: 300,
    houseRent: [600, 900, 1200],
    hotelRent: 1800,
    houseCost: 700,
    mortgageValue: 2000,
  },
  {
    position: 14,
    name: 'Surprise',
    type: 'SURPRISE',
    description: 'Draw a Surprise card',
  },
  {
    position: 15,
    name: 'Lucknow',
    type: 'PROPERTY',
    group: 'PURPLE',
    groupColor: '#8B5CF6',
    price: 4200,
    baseRent: 350,
    houseRent: [700, 1050, 1400],
    hotelRent: 2100,
    houseCost: 700,
    mortgageValue: 2100,
  },
  {
    position: 16,
    name: 'Electricity Company',
    type: 'UTILITY',
    description: 'Power utility — rent based on dice roll',
    price: 5000,
    mortgageValue: 2500,
  },
  {
    position: 17,
    name: 'Surat',
    type: 'PROPERTY',
    group: 'PURPLE',
    groupColor: '#8B5CF6',
    price: 4400,
    baseRent: 350,
    houseRent: [700, 1050, 1400],
    hotelRent: 2100,
    houseCost: 700,
    mortgageValue: 2200,
  },
  {
    position: 18,
    name: 'GST',
    type: 'GST',
    description: '₹50/house · ₹100/hotel · max ₹500',
  },
  {
    position: 19,
    name: 'Nagpur',
    type: 'PROPERTY',
    group: 'ORANGE',
    groupColor: '#F97316',
    price: 5000,
    baseRent: 400,
    houseRent: [800, 1200, 1600],
    hotelRent: 2400,
    houseCost: 800,
    mortgageValue: 2500,
  },

  // ─────────────────────────────────────────────────────────
  // TOP ROW: positions 20–30 (right → left)
  // ─────────────────────────────────────────────────────────

  {
    position: 20,
    name: 'FREE REST',
    type: 'FREE_REST',
    description: 'Safe spot — no action required',
  },
  {
    position: 21,
    name: 'Indore',
    type: 'PROPERTY',
    group: 'ORANGE',
    groupColor: '#F97316',
    price: 5200,
    baseRent: 400,
    houseRent: [800, 1200, 1600],
    hotelRent: 2400,
    houseCost: 800,
    mortgageValue: 2600,
  },
  {
    position: 22,
    name: 'Chance',
    type: 'CHANCE',
    description: 'Draw a Chance card',
  },
  {
    position: 23,
    name: 'Kochi',
    type: 'PROPERTY',
    group: 'ORANGE',
    groupColor: '#F97316',
    price: 5400,
    baseRent: 450,
    houseRent: [900, 1350, 1800],
    hotelRent: 2700,
    houseCost: 800,
    mortgageValue: 2700,
  },
  {
    position: 24,
    name: 'Airport Authority',
    type: 'UTILITY',
    description: 'Airport authority utility',
    price: 5000,
    mortgageValue: 2500,
  },
  {
    position: 25,
    name: 'Ahmedabad',
    type: 'PROPERTY',
    group: 'RED',
    groupColor: '#EF4444',
    price: 6000,
    baseRent: 500,
    houseRent: [1000, 1500, 2000],
    hotelRent: 3000,
    houseCost: 900,
    mortgageValue: 3000,
  },
  {
    position: 26,
    name: 'Kolkata',
    type: 'PROPERTY',
    group: 'RED',
    groupColor: '#EF4444',
    price: 6300,
    baseRent: 500,
    houseRent: [1000, 1500, 2000],
    hotelRent: 3000,
    houseCost: 900,
    mortgageValue: 3150,
  },
  {
    position: 27,
    name: 'Community Chest',
    type: 'COMMUNITY_CHEST',
    description: 'Draw a Community Chest card',
  },
  {
    position: 28,
    name: 'Pune',
    type: 'PROPERTY',
    group: 'RED',
    groupColor: '#EF4444',
    price: 6500,
    baseRent: 500,
    houseRent: [1000, 1500, 2000],
    hotelRent: 3000,
    houseCost: 900,
    mortgageValue: 3250,
  },
  {
    position: 29,
    name: 'Club House',
    type: 'CLUB_HOUSE',
    description: 'Pay ₹100 to every other active player',
  },
  {
    position: 30,
    name: 'Chennai',
    type: 'PROPERTY',
    group: 'YELLOW',
    groupColor: '#FACC15',
    price: 7000,
    baseRent: 550,
    houseRent: [1100, 1650, 2200],
    hotelRent: 3300,
    houseCost: 1000,
    mortgageValue: 3500,
  },

  // ─────────────────────────────────────────────────────────
  // LEFT COL: positions 31–39 (top → bottom)
  // ─────────────────────────────────────────────────────────

  {
    position: 31,
    name: 'Hyderabad',
    type: 'PROPERTY',
    group: 'YELLOW',
    groupColor: '#FACC15',
    price: 7500,
    baseRent: 600,
    houseRent: [1200, 1800, 2400],
    hotelRent: 3600,
    houseCost: 1000,
    mortgageValue: 3750,
  },
  {
    position: 32,
    name: 'Bengaluru',
    type: 'PROPERTY',
    group: 'YELLOW',
    groupColor: '#FACC15',
    price: 8000,
    baseRent: 650,
    houseRent: [1300, 1950, 2600],
    hotelRent: 3900,
    houseCost: 1000,
    mortgageValue: 4000,
  },
  {
    position: 33,
    name: 'Income Tax',
    type: 'INCOME_TAX',
    description: '₹50 × properties owned (max ₹500)',
  },
  {
    position: 34,
    name: 'Delhi',
    type: 'PROPERTY',
    group: 'GREEN',
    groupColor: '#22C55E',
    price: 9000,
    baseRent: 700,
    houseRent: [1400, 2100, 2800],
    hotelRent: 4200,
    houseCost: 1200,
    mortgageValue: 4500,
  },
  {
    position: 35,
    name: 'Water Company',
    type: 'UTILITY',
    description: 'Water utility — rent based on dice roll',
    price: 5000,
    mortgageValue: 2500,
  },
  {
    position: 36,
    name: 'Surprise',
    type: 'SURPRISE',
    description: 'Draw a Surprise card',
  },
  {
    position: 37,
    name: 'Gurugram',
    type: 'PROPERTY',
    group: 'GREEN',
    groupColor: '#22C55E',
    price: 9500,
    baseRent: 750,
    houseRent: [1500, 2250, 3000],
    hotelRent: 4500,
    houseCost: 1200,
    mortgageValue: 4750,
  },
  {
    position: 38,
    name: 'Mumbai',
    type: 'PROPERTY',
    group: 'GREEN',
    groupColor: '#22C55E',
    price: 10000,
    baseRent: 800,
    houseRent: [1600, 2400, 3200],
    hotelRent: 4800,
    houseCost: 1200,
    mortgageValue: 5000,
  },
  {
    position: 39,
    name: 'Rest House',
    type: 'REST_HOUSE',
    description: 'Receive ₹100 from every other active player',
  },
];

// Verify count at module level (dev-only guard)
if (BOARD_TILES.length !== 40) {
  throw new Error(
    `[boardData] Expected 40 board tiles, found ${BOARD_TILES.length}. ` +
    `Do NOT create position 40.`
  );
}

// ─── Group definitions ────────────────────────────────────────

export const PROPERTY_GROUPS: Record<string, { color: string; houseCost: number; members: number[] }> = {
  BROWN:      { color: '#8B5E3C', houseCost: 500,  members: [1, 3, 5] },
  LIGHT_BLUE: { color: '#38BDF8', houseCost: 600,  members: [7, 9, 11] },
  PURPLE:     { color: '#8B5CF6', houseCost: 700,  members: [13, 15, 17] },
  ORANGE:     { color: '#F97316', houseCost: 800,  members: [19, 21, 23] },
  RED:        { color: '#EF4444', houseCost: 900,  members: [25, 26, 28] },
  YELLOW:     { color: '#FACC15', houseCost: 1000, members: [30, 31, 32] },
  GREEN:      { color: '#22C55E', houseCost: 1200, members: [34, 37, 38] },
};

// Utility positions — for quick lookup
export const UTILITY_POSITIONS = [6, 12, 16, 24, 35];

// Special tile positions — for quick lookup
export const SPECIAL_POSITIONS = {
  START:          0,
  JAIL:           10,
  FREE_REST:      20,
  CLUB_HOUSE:     29,
  GST:            18,
  REST_HOUSE:     39,
};
