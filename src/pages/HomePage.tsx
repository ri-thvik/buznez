// ============================================================
// BUSINESS BHARAT — Home Page (Landing)
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, User, Users, Swords,
  Bell, Settings, UserCircle2, IndianRupee, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Animated floating rupee symbol in background
function FloatingSymbol({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute select-none pointer-events-none font-display font-bold text-brand/10"
      style={{ left: `${x}%`, top: `${y}%`, fontSize: size }}
      animate={{ y: [0, -20, 0], opacity: [0.05, 0.15, 0.05] }}
      transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      ₹
    </motion.div>
  );
}

const BG_SYMBOLS = [
  { x: 5,  y: 15, delay: 0,   size: 48 },
  { x: 90, y: 10, delay: 1.5, size: 32 },
  { x: 15, y: 75, delay: 0.8, size: 60 },
  { x: 80, y: 70, delay: 2.2, size: 40 },
  { x: 50, y: 5,  delay: 3.1, size: 28 },
  { x: 35, y: 88, delay: 1.2, size: 52 },
  { x: 70, y: 40, delay: 2.8, size: 36 },
];

export function HomePage() {
  const navigate = useNavigate();

  const handleSinglePlayer = () => {
    navigate('/lobby?mode=single');
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0D0916 0%, #120D1D 50%, #0D0916 100%)' }}
    >
      {/* Background decorative elements */}
      {BG_SYMBOLS.map((s, i) => (
        <FloatingSymbol key={i} {...s} />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#8B5CF6 1px, transparent 1px), linear-gradient(90deg, #8B5CF6 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
            <IndianRupee size={16} className="text-brand-bright" />
          </div>
          <span className="font-display font-bold text-text-secondary" style={{ fontSize: 13 }}>
            BUSINESS BHARAT
          </span>
        </div>

        <nav className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors">
            <Bell size={16} />
          </button>
          <button className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors">
            <Settings size={16} />
          </button>
          <button className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors">
            <UserCircle2 size={16} />
          </button>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        {/* Logo / Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Decorative top badge */}
          <div className="inline-flex items-center gap-2 bg-brand/15 border border-brand/30 rounded-full px-4 py-1 mb-6">
            <IndianRupee size={12} className="text-gold" />
            <span className="text-text-secondary font-medium" style={{ fontSize: 11 }}>
              India's Original Business Strategy Game
            </span>
          </div>

          <h1
            className="font-display font-bold gradient-text leading-none"
            style={{ fontSize: 'clamp(56px, 10vw, 96px)', letterSpacing: '0.02em' }}
          >
            BUSINESS
          </h1>
          <h1
            className="font-display font-bold gradient-text leading-none"
            style={{ fontSize: 'clamp(56px, 10vw, 96px)', letterSpacing: '0.02em' }}
          >
            BHARAT
          </h1>

          <motion.p
            className="text-text-secondary mt-4 font-display font-medium tracking-widest"
            style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            BUILD · TRADE · RULE THE ECONOMY
          </motion.p>
        </motion.div>

        {/* ── CTA Buttons ─────────────────────────────────────── */}
          <motion.div
            className="flex flex-col items-center gap-3 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Primary: Play Now (quickest path to local game) */}
            <Button
              variant="primary"
              size="xl"
              icon={Play}
              fullWidth
              onClick={handleSinglePlayer}
            >
              PLAY NOW
            </Button>

            <div className="w-full grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="md"
                icon={User}
                fullWidth
                onClick={handleSinglePlayer}
              >
                Single Player
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon={Users}
                fullWidth
                onClick={() => navigate('/create')}
              >
                Create Room
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon={Search}
                fullWidth
                onClick={() => navigate('/join')}
              >
                Join Game
              </Button>

              <Button
                variant="secondary"
                size="md"
                icon={Swords}
                fullWidth
                comingSoon
              >
                Team Battle
              </Button>
            </div>
          </motion.div>

        {/* ── Feature highlights ─────────────────────────────── */}
        <motion.div
          className="flex gap-6 flex-wrap justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {[
            { label: '40 Indian Cities',    sub: 'Authentic board', soon: false },
            { label: 'GST System',          sub: 'Real tax mechanics', soon: false },
            { label: 'AI Opponents',        sub: 'Easy / Normal / Hard', soon: false },
            { label: 'Online Multiplayer',  sub: 'Socket.IO rooms live', soon: false },
          ].map(f => (
            <div key={f.label} className="text-center">
              <div className={`font-display font-semibold ${f.soon ? 'text-text-muted' : 'text-text-primary'}`}
                style={{ fontSize: 12 }}
              >
                {f.label}
                {f.soon && <span className="badge-soon ml-1">Soon</span>}
              </div>
              <div className="text-text-muted" style={{ fontSize: 10 }}>{f.sub}</div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 text-center pb-6">
        <p className="text-text-muted" style={{ fontSize: 10 }}>
          Business Bharat — An original Indian board game. Fictional gameplay values only.
        </p>
      </footer>
    </div>
  );
}
