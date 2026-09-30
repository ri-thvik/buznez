// ============================================================
// BUSINESS BHARAT — Join Room Page
// Players enter a room code to join an existing room.
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSocket } from '@/context/SocketContext';
import type { TokenShape } from '@/types/game';

const PLAYER_COLORS = ['#39D98A', '#4EA5FF', '#F05252', '#F5B942'];
const TOKEN_LABELS: Record<TokenShape, string> = {
  BRIEFCASE: '💼',
  BUILDING:  '🏢',
  CAR:       '🚗',
  COIN:      '🪙',
};

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { joinRoom } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[1]);
  const [selectedToken, setSelectedToken] = useState<TokenShape>('BUILDING');

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    const name = playerName.trim() || 'Player';
    joinRoom({
      roomCode: roomCode.trim().toUpperCase(),
      playerName: name,
      playerColor: selectedColor,
      tokenShape: selectedToken,
    });
    localStorage.setItem('bb-player-name', name);
    navigate('/lobby/online');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    value = value.slice(0, 6);
    setRoomCode(value);
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
        <h1 className="font-display font-bold text-text-primary text-base">Join Room</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card elevation="panel" header="Enter Room Code">
              <div className="space-y-4">
                <div>
                  <label className="text-text-muted text-xs mb-1 block">Room Code (6 characters)</label>
                  <input
                    value={roomCode}
                    onChange={handleCodeChange}
                    className="w-full bg-bg-base border border-border-subtle rounded-lg text-text-primary font-mono text-2xl text-center py-3 outline-none focus:border-brand tracking-widder"
                    placeholder="BB-______"
                    maxLength={6}
                  />
                  <p className="text-text-muted text-xs mt-1 text-center">
                    Enter the 6-character code shared by the host
                  </p>
                </div>

                <div className="border-t border-border-subtle pt-4">
                  <h3 className="text-text-primary font-semibold text-sm mb-3">Your Identity</h3>
                  <div className="space-y-3">
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
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  icon={Search}
                  fullWidth
                  onClick={handleJoinRoom}
                  disabled={!roomCode}
                >
                  JOIN ROOM
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
