// ============================================================
// BUSINESS BHARAT — App Routing
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from '@/context/SocketContext';
import { GameProvider } from '@/context/GameContext';
import { HomePage } from '@/pages/HomePage';
import { LobbyPage } from '@/pages/LobbyPage';
import { OnlineLobbyPage } from '@/pages/OnlineLobbyPage';
import { CreateRoomPage } from '@/pages/CreateRoomPage';
import { JoinRoomPage } from '@/pages/JoinRoomPage';
import { GamePage } from '@/pages/GamePage';

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/lobby/online" element={<OnlineLobbyPage />} />
            <Route path="/create" element={<CreateRoomPage />} />
            <Route path="/join" element={<JoinRoomPage />} />
            <Route path="/join/:roomCode" element={<JoinRoomPage />} />
            <Route path="/room/:roomCode" element={<OnlineLobbyPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/game/:roomId" element={<GamePage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
