# Attendance System Server

Backend server for the ESP32 Sui Attendance System. This server receives attendance events from ESP32 devices and records them on the Sui blockchain.

## Features

- **Attendance Recording**: Receives RFID card scans from ESP32 devices and records attendance on-chain
- **Student Lookup**: Queries blockchain events to find students by card ID
- **Subscription Validation**: Checks subscription status before recording attendance
- **Event Storage**: Maintains in-memory cache of attendance events (use database in production)
- **Health Monitoring**: Provides health check endpoint with server status

## Prerequisites

- Node.js 18+
- Sui account with SUI for gas fees
- Deployed attendance system smart contract
- Environment variables configured (see `.env.example`)

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Build the project**:
```bash
npm run build
```

4. **Start the server**:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 4000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | No |
| `NETWORK` | Sui network (testnet/mainnet/devnet) | Yes |
| `PACKAGE_ID` | Deployed smart contract package ID | Yes |
| `SYSTEM_OBJECT_ID` | AttendanceSystem object ID | Yes |
| `SERVER_PRIVATE_KEY` | Server's private key for signing transactions | Yes |

## API Endpoints

### Health Check

```
GET /health
```

Returns server status, balance, and cache statistics.

### Record Attendance

```
POST /api/attendance
Content-Type: application/json

{
  "cardId": "RFID123456",
  "orgObjectId": "0x...",
  "deviceId": "ESP32_001" // Optional
}
```

Receives attendance event from ESP32 and processes it asynchronously.

### Get Attendance Events

```
GET /api/attendance?limit=100&offset=0
```

Returns paginated list of attendance events.

### Get Organisation Subscription

```
GET /api/organisations/:orgObjectId/subscription
```

Returns subscription status for an organisation.

### Get Student by Card ID

```
GET /api/organisations/:orgObjectId/students/:cardId
```

Returns student information for a given card ID.

## ESP32 Integration

The ESP32 device should send HTTP POST requests to the `/api/attendance` endpoint:

```cpp
// Example ESP32 code
void sendAttendanceRecord(String cardId, String orgObjectId) {
  HTTPClient http;
  http.begin("http://your-server.com/api/attendance");
  http.addHeader("Content-Type", "application/json");
  
  String jsonPayload = "{";
  jsonPayload += "\"cardId\":\"" + cardId + "\",";
  jsonPayload += "\"orgObjectId\":\"" + orgObjectId + "\",";
  jsonPayload += "\"deviceId\":\"ESP32_001\"";
  jsonPayload += "}";
  
  int httpResponseCode = http.POST(jsonPayload);
  http.end();
}
```

## Architecture

```
ESP32 Device
    ↓ (HTTP POST)
Server API
    ↓ (Query Events)
Sui Blockchain (Student Lookup)
    ↓ (Check Subscription)
Sui Blockchain (Subscription Status)
    ↓ (Record Attendance)
Sui Blockchain (Transaction)
    ↓ (Event Emission)
Frontend/Listeners
```

## Error Handling

The server handles the following error scenarios:

- **Student Not Found**: Card ID not registered in the organisation
- **Subscription Expired**: Organisation subscription is inactive
- **Transaction Failure**: Blockchain transaction errors
- **Invalid Input**: Missing or invalid request parameters

## Production Considerations

1. **Database**: Replace in-memory event storage with a database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Add API key or JWT authentication for ESP32 devices
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Add monitoring and alerting (Prometheus, Grafana)
5. **Logging**: Use structured logging and log aggregation
6. **Caching**: Implement Redis for student cache
7. **Queue System**: Use message queue (RabbitMQ, Redis Queue) for async processing

## License

See LICENSE file for details.

