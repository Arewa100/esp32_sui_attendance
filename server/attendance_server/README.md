# ESP32 Sui Attendance System Server – Off-Chain Gateway

A Node.js + TypeScript backend that receives attendance events from ESP32 devices, updates the ESP32 Sui Attendance System Move contracts, and exposes monitoring APIs for operations and integration.

## Overview

This server acts as an off-chain gateway between hardware attendance devices and the on-chain ESP32 Sui Attendance System smart contract infrastructure.

**ESP32 devices send simple JSON over HTTP.**

The server validates events, looks up students by RFID card ID from blockchain events, checks subscription status, and calls Move entry points such as `record_attendance` using the Sui TypeScript SDK.

**Note**: Hardware concerns (RFID reading, Wi-Fi) run on ESP32 firmware.

This service centralizes:

- Card ID → Student address mapping (via blockchain event queries)
- Subscription validation before recording attendance
- On-chain transaction building and signing
- Health checks and basic observability

## Architecture

### High-Level Flow

**ESP32 Attendance Device**

Reads RFID card and sends:

```json
{
  "cardId": "A1B2C3D4",
  "orgObjectId": "0x789abc123def456",
  "deviceId": "ESP32_ATTENDANCE_001"
}
```

to `POST /api/attendance`.

**Attendance System Server (this repo)**

Parses `AttendanceEvent`, validates it, and uses `attendanceService.processAttendanceEvent()` to:

1. Resolve the student address for `cardId` via `getStudentByCardId()` (queries `StudentRegisteredEvent` from blockchain).
2. Check subscription status via `checkSubscriptionActive()`.
3. Call `recordAttendance()` → Move `attendance_system::record_attendance(org, student, clock, ctx)`.

**ESP32 Sui Attendance System Move Package (on Sui)**

Maintains canonical attendance state:
- Student registrations with unique card IDs
- Attendance records with on-chain timestamps (from Sui Clock)
- Organisation subscription status and expiry
- Emits events like `StudentRegisteredEvent`, `AttendanceRecordedEvent`, and `SubscriptionRenewedEvent` used for off-chain monitoring and frontend integration.

## Components

### Express HTTP API (`src/index.ts`)

Mounts `/api/attendance`, `/api/organisations`, and `/api/devices` routes.

Provides `/health` endpoint with Sui balance and status.

Adds CORS, JSON parsing, and centralized error handling.

### Sui Client Service (`src/services/suiClient.ts`)

Wraps `SuiClient`, `Ed25519Keypair`, and gas balance checks.

Provides:
- `executeTransaction(tx: Transaction)`
- `getObject(objectId: string)`
- `queryEvents(query, limit, cursor)`
- `checkBalance()`

### Attendance Service (`src/services/attendanceService.ts`)

Maintains an in-memory student cache: `Map<string, { address: string; orgObjectId: string }>` mapping `cardId:orgObjectId` → student address.

Implements:
- `getStudentByCardId(orgObjectId, cardId)` – Queries blockchain events to find student
- `checkSubscriptionActive(orgObjectId)` – Validates subscription before recording
- `getSubscriptionStatus(orgObjectId)` – Returns subscription details
- `recordAttendance(orgObjectId, studentAddress)` – Calls Move `record_attendance`
- `processAttendanceEvent(event)` – Orchestrates the full flow (resolves org from deviceId if needed)
- `clearStudentCache()` / `getCacheStats()`

### Device Service (`src/services/deviceService.ts`)

Manages device-to-organisation mappings and device lookups.

Implements:
- `getOrgByDeviceId(deviceId)` – Queries blockchain events to find organisation for a device
- `registerDevice(orgObjectId, deviceId)` – Registers a device to an organisation
- `unregisterDevice(orgObjectId, deviceId)` – Unregisters a device from an organisation

### Heartbeat Service (`src/services/heartbeatService.ts`)

Handles device heartbeat processing and updates on-chain heartbeat timestamps.

Implements:
- `processDeviceHeartbeat(deviceId, timestamp?)` – Processes heartbeat, updates on-chain timestamp

### Routing Layer

- `src/routes/attendance.ts` – `/api/attendance` for ingesting and querying attendance events.
- `src/routes/organisations.ts` – `/api/organisations` for subscription status and student lookups.
- `src/routes/devices.ts` – `/api/devices` for device heartbeat and device-to-organisation lookups.

### Config, Logging, Middleware

- `src/config/env.ts` – Loads and validates `.env` config.
- `src/utils/logger.ts` – Winston logger with levels (error, warn, info, http, debug).
- `src/middleware/errorHandler.ts` – `notFoundHandler` and centralized error handling.

## Project Structure

```
attendance_server/
├── package.json
├── tsconfig.json
├── .env
├── .env.example
├── Dockerfile
├── logs/
│   ├── combined.log
│   └── error.log
└── src/
    ├── index.ts
    ├── config/
    │   └── env.ts
    ├── routes/
    │   ├── attendance.ts
    │   ├── organisations.ts
    │   └── devices.ts
    ├── services/
    │   ├── suiClient.ts
    │   ├── attendanceService.ts
    │   ├── deviceService.ts
    │   └── heartbeatService.ts
    ├── models/
    │   └── attendanceEvent.ts
    ├── middleware/
    │   └── errorHandler.ts
    └── utils/
        └── logger.ts
```

## Key Features

### Gateway Between ESP32 and Sui

Receives minimal JSON events from hardware (`cardId`, `orgObjectId`, optional `deviceId`).

Uses Sui TS SDK to call ESP32 Sui Attendance System Move entry points:

- `attendance_system::record_attendance(org, student, clock, ctx)`

### Student Lookup via Blockchain Events

Maps `cardId` to student address by querying `StudentRegisteredEvent` from the blockchain.

Caches results in-memory for performance, with on-chain events as the source of truth.

### Subscription Validation

Checks organisation subscription status before recording attendance.

Ensures only active subscriptions can record attendance (enforced on-chain as well).

### Observability & Reliability

`/health` endpoint returns:

- Server status
- Network (testnet/mainnet/devnet)
- Gateway Sui address
- SUI balance (for gas)
- Cache statistics
- Timestamp

Winston-based logging with log levels and HTTP request logs.

Graceful shutdown on `SIGTERM`/`SIGINT`, and process handlers for unhandled rejections and uncaught exceptions.

## API

### Health

**GET** `/health`

Returns basic status and Sui account info:

```json
{
  "ok": true,
  "service": "attendance-system-server",
  "version": "1.0.0",
  "network": "testnet",
  "serverAddress": "0x...",
  "balance": "1.2345 SUI",
  "cache": {
    "studentCacheSize": 5,
    "cachedCardIds": ["org1:card1", "org1:card2"]
  },
  "timestamp": "2025-12-16T13:00:00.000Z"
}
```

### Attendance Events

**POST** `/api/attendance`

Ingests an attendance event from hardware.

Expected JSON body:

```json
{
  "cardId": "A1B2C3D4",
  "deviceId": "ESP32_ATTENDANCE_001",
  "orgObjectId": "0x789abc123def456"
}
```

- `cardId` – string, required. RFID card ID read by ESP32.
- `deviceId` – string, optional but recommended. ESP32 device identifier. If provided, server resolves organisation from device ID.
- `orgObjectId` – string, optional. Organisation object ID on Sui. If not provided, server resolves from `deviceId`.

Server behaviour:

1. Validates payload.
2. Constructs an `AttendanceEvent` object, stamping `receivedAt`.
3. Resolves student address via `getStudentByCardId(orgObjectId, cardId)` (queries blockchain events).
4. Checks subscription status via `checkSubscriptionActive(orgObjectId)`.
5. Calls `recordAttendance(orgObjectId, studentAddress)` → Move `record_attendance`.
6. Stores `AttendanceEvent` in an in-memory list (for debug and optional UI).
7. Responds immediately (processing is async):

```json
{
  "ok": true,
  "message": "Attendance event received and processing",
  "cardId": "A1B2C3D4",
  "orgObjectId": "0x789abc123def456",
  "receivedAt": "2025-12-16T13:00:00.000Z"
}
```

**GET** `/api/attendance`

Returns paginated events.

Query params:
- `limit` (default 100, max 1000)
- `offset` (default 0)

**GET** `/api/attendance/:orgObjectId`

Returns all events for a specific organisation.

**GET** `/api/attendance/:orgObjectId/card/:cardId`

Returns all events for a specific card ID in an organisation.

### Organisations

**GET** `/api/organisations/:orgObjectId`

Returns organisation details including subscription status.

**GET** `/api/organisations/:orgObjectId/subscription`

Returns subscription status:

```json
{
  "ok": true,
  "orgObjectId": "0x789abc123def456",
  "subscription": {
    "isActive": true,
    "expiryTimestamp": 1734567890000,
    "paymentAmount": 10000000000
  }
}
```

**GET** `/api/organisations/:orgObjectId/students/:cardId`

Returns student information for a given card ID:

```json
{
  "ok": true,
  "student": {
    "address": "0x...",
    "name": "John Doe",
    "department": "Computer Science",
    "cardId": "A1B2C3D4",
    "orgObjectId": "0x789abc123def456"
  }
}
```

### Device Management

**POST** `/api/devices/:deviceId/heartbeat`

Update device heartbeat timestamp. Devices send heartbeats periodically (typically every hour) to indicate they're alive.

**Request Body** (optional):
```json
{
  "timestamp": 1734567890000  // Optional, milliseconds since epoch. Defaults to current time.
}
```

**Response**:
```json
{
  "ok": true,
  "message": "Heartbeat updated successfully",
  "deviceId": "ESP32_ATTENDANCE_001",
  "timestamp": 1734567890000,
  "transactionDigest": "0xabc123..."
}
```

**GET** `/api/devices/:deviceId/organisation`

Get the organisation that owns a device.

**Response**:
```json
{
  "ok": true,
  "deviceId": "ESP32_ATTENDANCE_001",
  "orgObjectId": "0x789abc123def456"
}
```

**GET** `/api/devices/:deviceId/heartbeat`

Get the last heartbeat timestamp for a device.

**Response**:
```json
{
  "ok": true,
  "deviceId": "ESP32_ATTENDANCE_001",
  "lastHeartbeat": 1734567890000
}
```

**Note**: Device management endpoints require devices to be registered to organisations. See [Device Management Documentation](../../docs/DEVICE_MANAGEMENT.md) for details.

## Configuration (.env)

Example:

```env
PORT=4000
NODE_ENV=development
PACKAGE_ID=0x...              # ESP32 Sui Attendance System Move package ID
SYSTEM_OBJECT_ID=0x...        # AttendanceSystem object ID
SERVER_PRIVATE_KEY=suiprivkey1...  # Server's private key for signing
NETWORK=testnet
LOG_LEVEL=info
```

`src/config/env.ts` validates that `PACKAGE_ID`, `SYSTEM_OBJECT_ID`, and `SERVER_PRIVATE_KEY` are present.

- Accepts either bech32 `suiprivkey...` or 64-char hex for the private key.
- Ensures `NETWORK` is one of `testnet`, `mainnet`, `devnet`.
- Parses and validates `PORT` range.

## Running Locally

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

The server will:

1. Decode the Sui private key and initialize `SuiClient`.
2. Check SUI balance and log a warning if it's low.
3. Verify the `AttendanceSystem` object exists.
4. Start listening on `http://localhost:4000`.

Update your ESP32 firmware:

```cpp
const char* serverUrl = "http://<server-ip>:4000/api/attendance";
```

(Replace `<server-ip>` with your laptop/server LAN IP.)

### Production

```bash
npm run build
npm start
```

Run behind a process manager (PM2, systemd, Docker, etc.) and a reverse proxy (Nginx, Caddy) if exposed publicly.

## Relationship to ESP32 Sui Attendance System Move Package

This server is the off-chain counterpart to the ESP32 Sui Attendance System smart contract suite described in the on-chain README.

- Reads `AttendanceOrganisation` data (including subscription status) via `suiService.getObject()`.
- Queries `StudentRegisteredEvent` to map card IDs to student addresses.
- Calls core attendance module entry points:
  - `record_attendance` – Creates `AttendanceRecord` with on-chain timestamp from Sui Clock, emits `AttendanceRecordedEvent`.
- Validates subscription status before recording (also enforced on-chain).
- On-chain timestamps come from Sui's Clock object, not from ESP32, which keeps the on-chain truth self-consistent even if device clocks are off.

## Security & Best Practices

**Key management**: `SERVER_PRIVATE_KEY` must be stored securely (prefer environment secrets, not committed files).

**Gas monitoring**: `/health` and startup logs highlight when the server account is low on SUI.

**Access control**: Hardware devices should be restricted by network (e.g. private VPN or firewall) or by API key if exposed to the internet.

**Resilience**: Student cache is rebuilt from blockchain events on each lookup (with in-memory caching for performance).

**Event storage**: In-memory events list is for debugging; for long-term analytics, plug in a DB (e.g. Postgres) while keeping the Map as a cache.

**Subscription enforcement**: Server validates subscription before submitting transaction, but on-chain contract also enforces this, providing double protection.

## Support & Future Work

- Add persistent DB for `AttendanceEvent` history and device metadata.
- Extend API for organisation dashboards (reading Sui events and server logs).
- Harden auth between ESP32 devices and gateway (HMAC, device API keys, or mTLS).
- Implement rate limiting per device/organisation.
- Add webhook support for real-time notifications.
- Support batch attendance recording for multiple students.

For contract details, see `smart-contract/README.md`.

For firmware integration, see `firmware/esp32_attendance/README.md`.
