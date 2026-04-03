# Server Refactor

This folder is a separate Spring Boot/Maven workspace for the new backend.

Goals:

- keep the original `server/` module intact for comparison
- rebuild multiplayer state flow with clearer boundaries
- make room state, player turns, transport, and persistence separate concerns

Suggested direction for this refactor:

- `controller/` for HTTP endpoints
- `websocket/` for realtime transport only
- `service/` for application logic
- `store/` for in-memory room state storage
- `domain/` for room, player, and board models

We can keep this new server thin at first and grow it intentionally.
