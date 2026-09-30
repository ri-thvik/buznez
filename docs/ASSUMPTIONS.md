# BUSINESS BHARAT - Assumptions

This document tracks assumptions and simplifications made during the development of Business Bharat, as per the explicit "No Hallucination Rule".

## Milestone 1: Core Board & UI
- **Board Grid Mapping**: We assumed an 11x11 perimeter grid layout mapped precisely to positions 0 through 39, with position 0 at bottom-left and clockwise movement. The interior 9x9 is used for the board center.
- **Bot Behavior**: A placeholder stub is used for the AI. Complete AI rules are deferred to Phase 20.
- **Rent Engine**: Property rent is pre-calculated based on a ~8% base rent rule provided in the prompt and stored statically, rather than dynamically calculated at runtime on the client. Base rent = round(price × 0.08 / 50) × 50. House rents are 2x, 3x, 4x base rent; hotel rent is 6x base rent.
- **GST Calculation**: GST on property purchase is calculated as `round(price × 0.05 / 50) × 50` — 5% tax, rounded to the nearest ₹50.
- **Hotel Cost**: Building a hotel costs `houseCost × 4` (the full upgrade cost).
- **Bankruptcy Liquidation**: Mortgaged properties are sold at 50% of mortgage value; unmortgaged properties are sold at 70% of base price; houses/hotels are sold back at 50% of build cost. All cash is used to pay liabilities first.
- **Action Resolution Timer**: Local game engine adds simulated delays via `setTimeout` to show roll animations before moving the piece, and another delay before landing resolution.
- **Token Movement**: Player movement jumps directly to the target tile rather than animating space-by-space for this initial milestone.
- **Property Colors**: Fictional game colors were used to match standard groupings and the design system given in the prompt.
- **Initial Configuration**: Settings selected in the Lobby are passed to the Game engine via `sessionStorage` since there is no live backend in Milestone 1. For online multiplayer, config is passed via socket.io `create_room` event.
- **Turn Flow**: Landing on unowned property currently ends turn immediately. "Buy/Auction" decisions will be fully built out in Phase 10/14. Currently, the engine simply cycles turns.
- **Net Worth**: We calculate Net Worth dynamically on state change based on `cash + (property base price) + (buildings value)`. Mortgaged states reduce net worth appropriately (when implemented).
- **Starting Cash**: Default starting cash is ₹25,000 per player.
- **Room Codes**: 6-character codes from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes ambiguous chars O/0/I/1/S/5).
- **Server Port**: Backend runs on port 4000; frontend dev server runs on port 3000 (via Vite). `VITE_SERVER_URL` env variable configures the frontend's Socket.IO connection URL.
- **Socket.IO Events**: Client emits events from `ClientToServerEvents` interface; server emits events from `ServerToClientEvents`. Server is authoritative — all game actions are validated and processed server-side, with state pushed to clients via `game_state_updated`.
- **Development Workflow**: Run `npm run dev:full` to start both frontend (port 3000) and backend (port 4000) concurrently. Individual dev servers can be started with `npm run dev` (frontend only) or `npm run dev:server` (backend only).
