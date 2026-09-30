// ============================================================
// BUSINESS BHARAT — Online Lobby Page
// Shows room code, waiting for players, and start button for host.
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Crown, Copy, LogOut, Bot, Share2, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSocket } from '@/context/SocketContext';

const TOKEN_LABELS: Record<string, string> = {
  BRIEFCASE: '💼',
  BUILDING:  '🏢',
  CAR:       '🚗',
  COIN:      '🪙',
};

export function OnlineLobbyPage() {
  const navigate = useNavigate();
  const { roomInfo, localPlayerId, isHost, canStartGame, startGame, leaveRoom, isConnected, gameState } = useSocket();

  React.useEffect(() => {
    if (gameState && gameState.gameStatus === 'IN_PROGRESS') {
      navigate(`/game/${roomInfo?.roomCode ?? ''}`);
    }
  }, [gameState, navigate, roomInfo]);

  if (!roomInfo || !localPlayerId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0916' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Connecting to room…</p>
        </div>
      </div>
    );
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomInfo.roomCode);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${roomInfo.roomCode}`;
    navigator.clipboard.writeText(link);
  };

  const handleStartGame = () => {
    startGame();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0D0916' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={LogOut} onClick={leaveRoom}>
            Leave
          </Button>
          <div>
            <h1 className="font-display font-bold text-text-primary text-base">
              Waiting for Players
            </h1>
            <p className="text-text-muted text-xs">
              Share the room code with friends
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'} animate-pulse`} />
          <span className="text-text-muted text-xs">
            {isConnected ? 'Online' : 'Connecting…'}
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Room info */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card elevation="panel">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text-muted text-xs">Room Code</span>
                  <div className="font-mono font-bold text-3xl text-text-primary mt-1">
                    {roomInfo.roomCode}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={Copy} onClick={copyRoomCode}>
                    Copy Code
                  </Button>
                  <Button variant="ghost" size="sm" icon={Share2} onClick={copyInviteLink}>
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Players */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card elevation="panel" header={<div className="flex items-center gap-2"><Users size={14} />Players ({roomInfo.players.length}/{roomInfo.maxPlayers})</div>}>
              <div className="space-y-3">
                {roomInfo.players.map(player => {
                  const token = TOKEN_LABELS[player.tokenShape] || '⭐';
                  const isLocal = player.id === localPlayerId;
                  const isHost = player.isHost;

                  return (
                    <motion.div
                      key={player.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-bg-elevated"
                      style={{ borderLeft: `3px solid ${player.color}` }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: player.color + '30', border: `2px solid ${player.color}` }}
                      >
                        {token}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary font-semibold text-sm">
                            {player.name}
                          </span>
                          {isLocal && <span className="text-text-muted text-xs">(You)</span>}
                          {isHost && <Crown size={12} className="text-gold" />}
                          {player.isBot && <Bot size={12} className="text-brand-bright" />}
                        </div>
                        <div className="text-text-muted text-xs">
                          {player.isBot ? 'Bot Player' : 'Human'}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-success' : 'bg-danger'}`} />
                        <span className="text-text-muted text-xs ml-1">
                          {player.isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Start button (host only) */}
          {isHost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex justify-center"
            >
              <Button
                variant="gold"
                size="lg"
                icon={Play}
                onClick={handleStartGame}
                disabled={!canStartGame}
              >
                {canStartGame ? 'START GAME' : 'Waiting for players to connect…'}
              </Button>
            </motion.div>
          )}

          {!isHost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center"
            >
              <p className="text-text-muted text-sm">
                Waiting for host to start the game…
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
