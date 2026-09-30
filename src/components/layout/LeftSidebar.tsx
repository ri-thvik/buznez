// ============================================================
// BUSINESS BHARAT - Left Sidebar
// Room info, chat, event log
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, MessageSquare, ScrollText, X, Send } from 'lucide-react';
import type { GameState } from '@/types/game';
import type { ChatMessage } from '@/context/SocketContext';

interface LeftSidebarProps {
  gameState: GameState | null;
  roomCode?: string;
  isOpen?: boolean;
  onClose?: () => void;
  chatMessages?: ChatMessage[];
  canChat?: boolean;
  onSendChat?: (message: string) => void;
  localPlayerId?: string | null;
}

export function LeftSidebar({
  gameState,
  roomCode = 'BB-LOCAL',
  isOpen = false,
  onClose,
  chatMessages = [],
  canChat = false,
  onSendChat,
  localPlayerId,
}: LeftSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'log'>('log');
  const [chatMessage, setChatMessage] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.events.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = () => {
    const text = chatMessage.trim();
    if (!text || !onSendChat) return;
    onSendChat(text);
    setChatMessage('');
  };

  return (
    <aside
      className={`bb-sidebar bb-sidebar--left ${isOpen ? 'is-open' : ''}`}
    >
      {/* --- Header ----------------------------------------- */}
      <div className="px-3 py-2.5 border-b border-border-subtle flex-shrink-0">
        {/* Room code - brand now lives in the header */}
        <div className="flex items-center gap-2 bg-bg-elevated rounded-lg px-3 py-2">
          <span className="text-text-muted" style={{ fontSize: 10 }}>Room:</span>
          <span className="text-text-secondary font-mono font-semibold flex-1" style={{ fontSize: 11 }}>
            {roomCode}
          </span>
          <button
            onClick={handleCopy}
            className="text-text-muted hover:text-brand-bright transition-colors"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bb-drawer-toggle text-text-muted hover:text-text-primary transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* --- Tabs ------------------------------------------- */}
      <div className="flex border-b border-border-subtle flex-shrink-0">
        {([
          { key: 'log',  label: 'Event Log', icon: ScrollText },
          { key: 'chat', label: 'Chat',       icon: MessageSquare },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'text-brand-bright border-b-2 border-brand-bright'
                : 'text-text-muted hover:text-text-secondary',
            ].join(' ')}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Content ---------------------------------------- */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'log' ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {(!gameState || gameState.events.length === 0) && (
              <p className="text-text-muted text-center" style={{ fontSize: 11, marginTop: 20 }}>
                Game events will appear here.
              </p>
            )}
            {gameState?.events.map(event => {
              const player = gameState.players.find(p => p.id === event.playerId);
              return (
                <div key={event.id} className="flex gap-2 items-start">
                  {player && (
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                  )}
                  <p className="text-text-secondary leading-snug" style={{ fontSize: 10.5 }}>
                    {event.message}
                  </p>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-text-muted text-center" style={{ fontSize: 11, marginTop: 20 }}>
                  {canChat
                    ? 'No messages yet. Say hello!'
                    : 'Chat is available in online multiplayer.'}
                </p>
              )}
              {chatMessages.map(m => {
                const mine = !!localPlayerId && m.playerId === localPlayerId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                  >
                    <span
                      className="font-semibold"
                      style={{ fontSize: 9.5, color: m.playerColor }}
                    >
                      {mine ? 'You' : m.playerName}
                    </span>
                    <p
                      className="px-2 py-1 rounded-lg text-text-secondary"
                      style={{
                        fontSize: 11,
                        background: mine ? 'rgba(124,58,237,0.18)' : '#1A102B',
                        maxWidth: '92%',
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.message}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-border-subtle flex gap-2 flex-shrink-0">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder={canChat ? 'Type a message⬦' : 'Online only'}
                disabled={!canChat}
                className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none disabled:cursor-not-allowed disabled:text-text-muted"
              />
              <button
                onClick={handleSend}
                disabled={!canChat || !chatMessage.trim()}
                className="shrink-0 w-8 flex items-center justify-center rounded-lg bg-brand/25 border border-brand/40 text-brand-bright disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}

