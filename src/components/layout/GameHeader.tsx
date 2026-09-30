// ============================================================
// BUSINESS BHARAT — Game Header
// Compact 60px bar: brand | room + status | controls
// ============================================================

import React, { useState } from 'react';
import {
  Volume2, VolumeX, Maximize2, Minimize2, LogOut,
  Users, Menu,
} from 'lucide-react';

interface GameHeaderProps {
  roomCode: string;
  status: string;
  isOnline: boolean;
  onLeave: () => void;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
}

export function GameHeader({
  roomCode,
  status,
  isOnline,
  onLeave,
  onToggleLeft,
  onToggleRight,
}: GameHeaderProps) {
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  const iconBtn =
    'bb-drawer-toggle inline-flex items-center justify-center w-8 h-8 rounded-lg ' +
    'bg-white/5 hover:bg-white/10 text-text-secondary transition-colors shrink-0';

  return (
    <header className="bb-header">
      {/* ── Left: brand ───────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        {onToggleLeft && (
          <button onClick={onToggleLeft} className={iconBtn} title="Event log / chat">
            <Menu size={15} />
          </button>
        )}
        <div className="w-7 h-7 rounded-lg bg-brand/25 border border-brand/40 flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-brand-bright" style={{ fontSize: 11 }}>BB</span>
        </div>
        <div className="min-w-0">
          <div
            className="font-display font-bold text-text-primary leading-none truncate"
            style={{ fontSize: 13 }}
          >
            BUSINESS BHARAT
          </div>
          <div className="text-text-muted leading-none mt-0.5" style={{ fontSize: 9 }}>
            {isOnline ? 'Online Multiplayer' : 'Local Game'}
          </div>
        </div>
      </div>

      {/* ── Middle: room code + status ─────────────────────── */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
        <span
          className="font-mono font-bold text-gold bg-gold/10 border border-gold/25 rounded-md px-2 py-1 shrink-0"
          style={{ fontSize: 11 }}
        >
          {roomCode}
        </span>
        <span
          className="text-text-secondary truncate"
          style={{ fontSize: 11 }}
          title={status}
        >
          {status}
        </span>
      </div>

      {/* ── Right: controls ───────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setMuted(m => !m)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-colors"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary transition-colors"
          title="Fullscreen"
        >
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <button
          onClick={onLeave}
          className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-danger/15 border border-danger/30 text-danger hover:bg-danger/25 transition-colors"
          title="Leave game"
          style={{ fontSize: 11 }}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Leave</span>
        </button>

        {onToggleRight && (
          <button onClick={onToggleRight} className={iconBtn} title="Players">
            <Users size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
