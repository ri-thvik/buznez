// ============================================================
// BUSINESS BHARAT — Card Definitions
// Chance, Community Chest, Surprise decks
// ============================================================

import type { GameCard } from '@/types/game';

let _cardIdCounter = 0;
const cid = () => `card-${++_cardIdCounter}`;

export const CHANCE_CARDS: GameCard[] = [
  {
    id: cid(),
    type: 'CHANCE',
    text: 'The government credits your account. Collect ₹2,000 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 2000 },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Advance to START. Collect ₹1,500 salary.',
    action: { kind: 'MOVE_TO', targetPosition: 0 },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Your business deal falls through. Pay the Bank ₹1,500.',
    action: { kind: 'PAY_BANK', amount: 1500 },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Tax refund! Collect ₹500 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 500 },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Go directly to Jail. Do not pass START.',
    action: { kind: 'GO_TO_JAIL' },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Board meeting bonus! Collect ₹1,000 from each player.',
    action: { kind: 'COLLECT_FROM_PLAYERS', amount: 1000 },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Infrastructure levy. Pay ₹300 to the Bank.',
    action: { kind: 'PAY_BANK', amount: 300 },
  },
  {
    id: cid(),
    type: 'CHANCE',
    text: 'Get Out of Jail Free. Keep this card.',
    action: { kind: 'GET_OUT_OF_JAIL' },
  },
];

export const COMMUNITY_CHEST_CARDS: GameCard[] = [
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Community dividend. Collect ₹1,000 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 1000 },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Medical emergency. Pay ₹800 to the Bank.',
    action: { kind: 'PAY_BANK', amount: 800 },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Birthday! Collect ₹200 from each player.',
    action: { kind: 'COLLECT_FROM_PLAYERS', amount: 200 },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Advance to START. Collect ₹1,500 salary.',
    action: { kind: 'MOVE_TO', targetPosition: 0 },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'School fees due. Pay ₹600 to the Bank.',
    action: { kind: 'PAY_BANK', amount: 600 },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Insurance payout. Collect ₹1,500 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 1500 },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Go directly to Jail. Do not pass START.',
    action: { kind: 'GO_TO_JAIL' },
  },
  {
    id: cid(),
    type: 'COMMUNITY_CHEST',
    text: 'Festive bonus! Collect ₹500 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 500 },
  },
];

export const SURPRISE_CARDS: GameCard[] = [
  {
    id: cid(),
    type: 'SURPRISE',
    text: 'Lucky investment! Collect ₹2,500 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 2500 },
  },
  {
    id: cid(),
    type: 'SURPRISE',
    text: 'Market crash. Pay ₹1,200 to the Bank.',
    action: { kind: 'PAY_BANK', amount: 1200 },
  },
  {
    id: cid(),
    type: 'SURPRISE',
    text: 'Move forward 3 spaces.',
    action: { kind: 'MOVE_FORWARD', steps: 3 },
  },
  {
    id: cid(),
    type: 'SURPRISE',
    text: 'Surprise audit. Pay ₹400 to the Bank.',
    action: { kind: 'PAY_BANK', amount: 400 },
  },
  {
    id: cid(),
    type: 'SURPRISE',
    text: 'Windfall! Collect ₹1,800 from the Bank.',
    action: { kind: 'COLLECT_FROM_BANK', amount: 1800 },
  },
  {
    id: cid(),
    type: 'SURPRISE',
    text: 'Get Out of Jail Free. Keep this card.',
    action: { kind: 'GET_OUT_OF_JAIL' },
  },
];
