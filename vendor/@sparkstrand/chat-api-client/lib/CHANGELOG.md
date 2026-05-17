# Changelog

All notable changes to `@sparkstrand/chat-api-client` will be documented in this file.

## [0.0.4] - 2024-05-01

###  Added
- Implemented automatic reconnection using the existing `sparkstrand_token` cookie with fallback to client token.
- Introduced `reconnect()` method in the `ChatFrontendClient` class with promise-based timeout handling.
- Added connection status tracking with states: `'connected'`, `'disconnected'`, `'connecting'`, `'reconnecting'`.
- Enhanced the React hooks to expose real-time connection status.

### Fixed
- Resolved socket reconnection failures after network interruptions.
- Ensured `connectGuest()` sets cookies before attempting connection.
- Improved disconnect handler to support reconnection on recoverable errors.
- Fixed an issue where status changes for one user incorrectly affected all users in a room.
- Updated `handleUserStatusChanged` and `handleUserOnline` to correctly scope updates using user IDs.
- Corrected `ROOM_SWITCHED` event handling to support both:
  - Object payload: `{ roomId: "123" }`
  - Raw string: `"123"`

### Updated
- Improved logging for status change events and error traces.
- Extended `IUser` interface to include `currentRoomId` for better TypeScript support.

### Benefits
- Improved reliability during connection drops.
- More accurate user status handling within rooms.
- Cleaner dev experience with proper types and debugging insight.


## [0.0.3] - 2024-04-29

### Added

- Added support for room switching functionality.

## [0.0.2] - 2024-04-25

### Fixed

- Fixed issues with socket connection and authentication.

## [0.0.1] - 2024-04-21

### Added

- Initial release of the `@sparkstrand/chat-api-client` SDK.
- **Browser Client** (`frontend`): SocketClient for React apps with guest authentication via `connectGuest`.
- **Server Client** (`backend`): SocketClient for Node.js with serverToken authentication.
- **React Hook** (`hooks`): `useSocket` for managing socket state in React.
- **Types** (`types`): Shared TypeScript types for `SocketEvent`, `IMessage`, `IRoom`, `IUser`, etc.
- Supports real-time chat features: messaging, room management, typing indicators, and user status updates.
- Guest authentication flow with `/guests/initiate` and `/guests/connect` endpoints.
- Built with tsup for CommonJS and ESM outputs.
- Monorepo structure under `chat-api-client/lib` with  frontend, backend, hooks, and types.

### Changed

- N/A (initial release).

### Fixed

- N/A (initial release).
