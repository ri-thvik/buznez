// ============================================================
// BUSINESS BHARAT — Production notes
// Frontend (Vite static build) and backend (Express+Socket.IO) deploy separately:
//   Frontend env:  VITE_SERVER_URL=wss://<backend-host>  (or VITE_API_URL)
//   Backend env:   PORT=<port>  NODE_ENV=production  FRONTEND_ORIGIN=https://<frontend-host>
// Socket.IO requires a host that supports WebSockets (Node service, NOT static hosting).
// Room state is in-memory; structure allows a Redis adapter later (see RoomManager).
// ============================================================
