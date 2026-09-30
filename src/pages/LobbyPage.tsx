// ============================================================
// BUSINESS BHARAT — Lobby Page
// Three-column: room info / players / settings
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, ArrowLeft, Bot, Users, Lock, 
  IndianRupee, Gavel, ArrowLeftRight, Crown,
  type LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { GameSettings, AIDifficulty, TokenShape } from '@/types/game';

// ─── Player slot ─────────────────────────────────────────────

const PLAYER_COLORS = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
const TOKEN_SHAPES: TokenShape[] = ['BRIEFCASE', 'BUILDING', 'CAR', 'COIN'];
const TOKEN_LABELS: Record<TokenShape, string> = {
  BRIEFCASE: '💼',
  BUILDING:  '🏢',
  CAR:       '🚗',
  COIN:      '🪙',
};

interface PlayerSlot {
  index: number;
  name: string;
  isBot: boolean;
  color: string;
  token: TokenShape;
}

function PlayerSlotCard({ slot, onChange }: { slot: PlayerSlot; onChange: (s: PlayerSlot) => void }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-bg-elevated"
      style={{ borderLeftColor: slot.color, borderLeftWidth: 3 }}
    >
      {/* Token emoji */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: slot.color + '30', border: `2px solid ${slot.color}` }}
      >
        {TOKEN_LABELS[slot.token]}
      </div>

      <div className="flex-1 min-w-0">
        {slot.index === 0 ? (
          <input
            value={slot.name}
            onChange={e => onChange({ ...slot, name: e.target.value })}
            className="bg-transparent text-text-primary font-semibold text-sm outline-none border-b border-border-subtle w-full"
            maxLength={20}
            placeholder="Your name"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-semibold text-sm">{slot.name}</span>
            <Bot size={12} className="text-brand-bright" />
          </div>
        )}
        <div className="text-text-muted text-xs mt-0.5">
          {slot.isBot ? 'Bot Player' : 'You'}
        </div>
      </div>

      {/* Token selector */}
      <select
        value={slot.token}
        onChange={e => onChange({ ...slot, token: e.target.value as TokenShape })}
        className="bg-bg-panel border border-border-subtle rounded-lg text-xs text-text-secondary px-2 py-1 outline-none cursor-pointer"
      >
        {TOKEN_SHAPES.map(t => (
          <option key={t} value={t}>{TOKEN_LABELS[t]} {t.charAt(0) + t.slice(1).toLowerCase()}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────

function ToggleRow({ label, value, onChange, icon: Icon, soon = false }:
  { label: string; value: boolean; onChange: (v: boolean) => void; icon: LucideIcon; soon?: boolean }
) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon size={14} className="text-text-muted" />
        <span>{label}</span>
        {soon && <span className="badge-soon">Soon</span>}
      </div>
      <button
        onClick={() => !soon && onChange(!value)}
        disabled={soon}
        className={[
          'relative w-10 h-5 rounded-full transition-colors',
          value && !soon ? 'bg-brand' : 'bg-bg-elevated',
          soon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
            value && !soon ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

// ─── Main Lobby ───────────────────────────────────────────────

const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  botsEnabled: true,
  botDifficulty: 'NORMAL',
  privateRoom: false,
  gameMode: 'CLASSIC',
  startingRule: 'HIGHEST_ROLL',
  gstEnabled: true,
  incomeTaxEnabled: true,
  auctionsEnabled: true,
  tradingEnabled: true,
  startingCash: 25000,
};

function buildDefaultSlots(playerCount: number, botsEnabled: boolean): PlayerSlot[] {
  const slots: PlayerSlot[] = [
    { index: 0, name: 'You', isBot: false, color: PLAYER_COLORS[0], token: 'BRIEFCASE' },
  ];
  for (let i = 1; i < playerCount; i++) {
    slots.push({
      index: i,
      name: `Bot ${i}`,
      isBot: botsEnabled,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      token: TOKEN_SHAPES[i % TOKEN_SHAPES.length],
    });
  }
  return slots;
}

export function LobbyPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [slots, setSlots] = useState<PlayerSlot[]>(() =>
    buildDefaultSlots(DEFAULT_SETTINGS.playerCount, DEFAULT_SETTINGS.botsEnabled)
  );

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    if (key === 'playerCount' || key === 'botsEnabled') {
      const pc = key === 'playerCount' ? (value as number) : settings.playerCount;
      const bots = key === 'botsEnabled' ? (value as boolean) : settings.botsEnabled;
      setSlots(buildDefaultSlots(pc as number, bots as boolean));
    }
  };

  const updateSlot = (updated: PlayerSlot) => {
    setSlots(s => s.map(sl => sl.index === updated.index ? updated : sl));
  };

  const handleStartGame = () => {
    // Pass config via sessionStorage for simplicity (no backend yet)
    const config = { settings, slots };
    sessionStorage.setItem('bb-game-config', JSON.stringify(config));
    navigate('/game');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0D0916' }}
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border-subtle">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/')}>
          Back
        </Button>
        <div>
          <h1 className="font-display font-bold text-text-primary text-base">Game Lobby</h1>
          <p className="text-text-muted text-xs">Configure your game before starting</p>
        </div>
      </header>

      {/* Three-column layout */}
      <main className="flex-1 grid gap-4 p-6 overflow-auto"
        style={{ gridTemplateColumns: '1fr 1.2fr 1fr', maxWidth: 1100, margin: '0 auto', width: '100%' }}
      >
        {/* ── LEFT: Room info ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <Card elevation="panel" header="Room Information">
            <div className="space-y-3">
              <div>
                <label className="text-text-muted text-xs mb-1 block">Room Code</label>
                <div className="font-mono font-bold text-text-primary bg-bg-base rounded-lg px-3 py-2 text-sm">
                  BB-LOCAL
                </div>
              </div>
              <div>
                <label className="text-text-muted text-xs mb-1 block">Mode</label>
                <div className="text-text-secondary text-sm">Local — Human vs AI Bots</div>
              </div>

              <div className="pt-2 border-t border-border-subtle">
                <p className="text-text-muted text-xs">
                  Online multiplayer is live — use Create Room / Join Game from the home screen for real Socket.IO rooms.
                </p>
              </div>
            </div>
          </Card>

          <Card elevation="panel" header={<div className="flex items-center gap-2"><Crown size={13} />Starting Rules</div>}>
            <div className="space-y-2">
              {(['HIGHEST_ROLL', 'ROLL_12'] as const).map(rule => (
                <button
                  key={rule}
                  onClick={() => updateSetting('startingRule', rule)}
                  className={[
                    'w-full text-left p-2.5 rounded-lg border text-sm transition-colors',
                    settings.startingRule === rule
                      ? 'border-brand bg-brand/10 text-text-primary'
                      : 'border-border-subtle text-text-secondary hover:border-brand/40',
                  ].join(' ')}
                >
                  {rule === 'HIGHEST_ROLL' ? '🎲 Highest Roll goes first' : '🎯 Roll 12 to start'}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── CENTER: Players ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <Card elevation="panel" header={<div className="flex items-center gap-2"><Users size={13} />Players ({settings.playerCount})</div>}>
            {/* Player count selector */}
            <div className="flex gap-2 mb-4">
              {([2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  onClick={() => updateSetting('playerCount', n)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                    settings.playerCount === n
                      ? 'bg-brand border-brand text-white'
                      : 'border-border-subtle text-text-secondary hover:border-brand/40',
                  ].join(' ')}
                >
                  {n}P
                </button>
              ))}
            </div>

            {/* Player slots */}
            <div className="space-y-2">
              {slots.map(slot => (
                <PlayerSlotCard key={slot.index} slot={slot} onChange={updateSlot} />
              ))}
            </div>
          </Card>

          <Button
            variant="gold"
            size="lg"
            icon={Play}
            fullWidth
            onClick={handleStartGame}
          >
            START GAME
          </Button>
        </motion.div>

        {/* ── RIGHT: Settings ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <Card elevation="panel" header="Game Settings">
            <div className="divide-y divide-border-subtle">
              <ToggleRow
                label="Bots"
                value={settings.botsEnabled}
                onChange={v => updateSetting('botsEnabled', v)}
                icon={Bot}
              />
              <ToggleRow
                label="Private Room"
                value={settings.privateRoom}
                onChange={v => updateSetting('privateRoom', v)}
                icon={Lock}
                soon
              />
              <ToggleRow
                label="GST System"
                value={settings.gstEnabled}
                onChange={v => updateSetting('gstEnabled', v)}
                icon={IndianRupee}
              />
              <ToggleRow
                label="Auctions"
                value={settings.auctionsEnabled}
                onChange={v => updateSetting('auctionsEnabled', v)}
                icon={Gavel}
              />
              <ToggleRow
                label="Trading"
                value={settings.tradingEnabled}
                onChange={v => updateSetting('tradingEnabled', v)}
                icon={ArrowLeftRight}
              />
            </div>
          </Card>

          <Card elevation="panel" header="Bot Difficulty">
            <div className="space-y-1.5">
              {(['EASY', 'NORMAL', 'HARD'] as AIDifficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => updateSetting('botDifficulty', d)}
                  className={[
                    'w-full text-left p-2.5 rounded-lg border text-sm transition-colors',
                    settings.botDifficulty === d
                      ? 'border-brand bg-brand/10 text-text-primary'
                      : 'border-border-subtle text-text-secondary hover:border-brand/40',
                  ].join(' ')}
                >
                  <span className="font-semibold">{d}</span>
                  <span className="text-text-muted text-xs ml-2">
                    {d === 'EASY' ? 'Buys everything, random decisions' :
                     d === 'NORMAL' ? 'Balanced strategy' :
                     'Strategic, trades wisely'}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card elevation="panel" header="Game Mode">
            <div className="space-y-1.5">
              {([
                { key: 'CLASSIC', label: 'Classic', desc: 'Last player standing wins', soon: false },
                { key: 'TEAM',    label: '2v2 Team', desc: 'Coming Soon', soon: true },
              ] as const).map(m => (
                <button
                  key={m.key}
                  disabled={m.soon}
                  onClick={() => !m.soon && updateSetting('gameMode', m.key)}
                  className={[
                    'w-full text-left p-2.5 rounded-lg border text-sm transition-colors',
                    settings.gameMode === m.key && !m.soon
                      ? 'border-brand bg-brand/10 text-text-primary'
                      : 'border-border-subtle text-text-secondary',
                    m.soon ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand/40',
                  ].join(' ')}
                >
                  <span className="font-semibold">{m.label}</span>
                  {m.soon && <span className="badge-soon ml-2">Soon</span>}
                  <span className="text-text-muted text-xs block">{m.desc}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
