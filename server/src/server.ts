// ============================================================
// BUSINESS BHARAT — Server Entry Point
// Bootstraps Express + HTTP + Socket.IO server.
// ============================================================

import http from 'http';
import express from 'express';
import cors from 'cors';
import { GameServer } from './GameServer';

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || true;
const IS_DEV = process.env.NODE_ENV !== 'production';

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN === true ? true : FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

if (!IS_DEV) {
  app.use(express.static('dist'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/rooms/:code', (_req, res) => {
  res.json({ exists: false });
});

const server = http.createServer(app);
void new GameServer(server);

server.listen(PORT, () => {
  console.log(`[SERVER] Business Bharat game server running on port ${PORT}`);
  console.log(`[SERVER] Socket.IO ready for connections`);
});

process.on('SIGTERM', () => {
  console.log('[SERVER] Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
