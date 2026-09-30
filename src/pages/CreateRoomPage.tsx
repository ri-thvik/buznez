// ============================================================
// BUSINESS BHARAT — Create Room Page
// Host creates a new online multiplayer game.
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Crown, Bot, IndianRupee,
  Shield, ArrowLeft, ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSocket } from '@/context/SocketContext';
import type { GameSettings, AIDifficulty, TokenShape } from '@/types/game';

const PLAYER_COLORS = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
const TOKEN_LABELS: Record<TokenShape, string> = {
  BRIEFCASE: '💼',
  BUILDING:  '🏢',
  CAR:       '🚗',
  COIN:      '🪙',
};

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

function ToggleRow({ label, value, onChange, icon: Icon }:
  { label: string; value: boolean; onChange: (v: boolean) => void; icon: any }
) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon size={14} className="text-text-muted" />
        <span>{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={[
          'relative w-10 h-5 rounded-full transition-colors',
          value ? 'bg-brand' : 'bg-bg-elevated',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { createRoom } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);
  const [selectedToken, setSelectedToken] = useState<TokenShape>('BRIEFCASE');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  const handleCreateRoom = () => {
    const name = playerName.trim() || 'Host';
    createRoom({
      playerName: name,
      playerColor: selectedColor,
      tokenShape: selectedToken,
      maxPlayers,
      settings,
    });
    localStorage.setItem('bb-player-name', name);
    // LobbyPage will pick up room state from socket
    navigate('/lobby/online');
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
        <h1 className="font-display font-bold text-text-primary text-base">Create Room</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Left: Player setup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <Card elevation="panel" header="Player Setup">
              <div className="space-y-4">
                <div>
                  <label className="text-text-muted text-xs mb-1 block">Display Name</label>
                  <input
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    className="w-full bg-bg-base border border-border-subtle rounded-lg text-text-primary px-3 py-2 text-sm outline-none focus:border-brand"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-text-muted text-xs mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {PLAYER_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={[
                          'w-8 h-8 rounded-full border-2 transition-all',
                          c === selectedColor ? 'border-white shadow-lg' : 'border-border-subtle',
                        ].join(' ')}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-text-muted text-xs mb-2 block">Token</label>
                  <div className="flex gap-2">
                    {Object.entries(TOKEN_LABELS).map(([shape, label]) => {
                      const tokenShape = shape as TokenShape;
                      return (
                        <button
                          key={tokenShape}
                          onClick={() => setSelectedToken(tokenShape)}
                          className={[
                            'w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition-all',
                            selectedToken === tokenShape
                              ? 'border-brand bg-brand/10'
                              : 'border-border-subtle bg-bg-base hover:border-brand/30',
                          ].join(' ')}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-text-muted text-xs mb-1 block">Max Players</label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(n => (
                      <Button
                        key={n}
                        variant={maxPlayers === n ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setMaxPlayers(n)}
                      >
                        {n} Players
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card elevation="panel" header="Game Settings">
              <div className="divide-y divide-border-subtle">
                <ToggleRow
                  label="GST System"
                  value={settings.gstEnabled}
                  onChange={v => setSettings(s => ({ ...s, gstEnabled: v }))}
                  icon={IndianRupee}
                />
                <ToggleRow
                  label="Income Tax"
                  value={settings.incomeTaxEnabled}
                  onChange={v => setSettings(s => ({ ...s, incomeTaxEnabled: v }))}
                  icon={Shield}
                />
                <ToggleRow
                  label="Auctions"
                  value={settings.auctionsEnabled}
                  onChange={v => setSettings(s => ({ ...s, auctionsEnabled: v }))}
                  icon={Crown}
                />
                <ToggleRow
                  label="Trading"
                  value={settings.tradingEnabled}
                  onChange={v => setSettings(s => ({ ...s, tradingEnabled: v }))}
                  icon={ArrowLeftRight}
                />
                <ToggleRow
                  label="Private Room"
                  value={settings.privateRoom}
                  onChange={v => setSettings(s => ({ ...s, privateRoom: v }))}
                  icon={Shield}
                />
              </div>
            </Card>
          </motion.div>

          {/* Right: Bot settings + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            <Card elevation="panel" header={<div className="flex items-center gap-2"><Bot size={14} />Bot Difficulty</div>}>
              <div className="space-y-1.5">
                {(['EASY', 'NORMAL', 'HARD'] as AIDifficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setSettings(s => ({ ...s, botDifficulty: d }))}
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

            {!settings.botsEnabled && (
              <Card elevation="panel" header="Players">
                <p className="text-xs text-text-muted">
                  Without bots, you need {maxPlayers} players to start.
                  Share the room code with friends to join.
                </p>
              </Card>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Button
                variant="gold"
                size="lg"
                icon={Users}
                fullWidth
                onClick={handleCreateRoom}
              >
                CREATE ROOM
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
