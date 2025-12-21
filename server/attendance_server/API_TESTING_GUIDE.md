# API Testing Guide - ESP32 Sui Attendance System Server

## Base URL

The server runs on **port 4000** by default (configurable via `PORT` env variable).

**Base URL**: `http://localhost:4000` (or `http://<your-server-ip>:4000` for remote access)

---

## All Available Endpoints

### 1. Health Check

**GET** `/health`

Check server status and Sui account info.

**URL**: `http://localhost:4000/health`

**Example Response**:
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

---

### 2. Submit Attendance (ESP32 Device)

**POST** `/api/attendance`

Submit an attendance event from ESP32 device.

**URL**: `http://localhost:4000/api/attendance`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "cardId": "NFC-100",
  "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "deviceId": "ESP32_ATTENDANCE_001"
}
```

**Required Fields**:
- `cardId` (string): RFID card ID read by ESP32
- `orgObjectId` (string): Organisation object ID on Sui
- `deviceId` (string, optional): ESP32 device identifier

**Success Response** (200):
```json
{
  "ok": true,
  "message": "Attendance event received and processing",
  "cardId": "NFC-100",
   "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "receivedAt": "2025-12-16T13:00:00.000Z"
}
```

**Error Response** (400):
```json
{
  "ok": false,
  "error": "cardId is required and must be a string"
}
```

---

### 3. Get All Attendance Events

**GET** `/api/attendance`

Get all attendance events (paginated).

**URL**: `http://localhost:4000/api/attendance?limit=100&offset=0`

**Query Parameters**:
- `limit` (optional, default: 100, max: 1000): Number of events to return
- `offset` (optional, default: 0): Number of events to skip

**Example Response**:
```json
{
  "ok": true,
  "total": 150,
  "limit": 100,
  "offset": 0,
  "events": [
    {
      "cardId": "NFC-100",
      "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
      "deviceId": "ESP32_ATTENDANCE_001",
      "receivedAt": "2025-12-16T13:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Attendance Events for Organisation

**GET** `/api/attendance/:orgObjectId`

Get all attendance events for a specific organisation.

**URL**: `http://localhost:4000/api/attendance/0xb194a44e68b2ef1b9fe9f4c....`

**Example Response**:
```json
{
  "ok": true,
  "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "count": 25,
  "events": [
    {
      "cardId": "NFC-100",
      "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
      "deviceId": "ESP32_ATTENDANCE_001",
      "receivedAt": "2025-12-16T13:00:00.000Z"
    }
  ]
}
```

---

### 5. Get Attendance Events for Specific Card

**GET** `/api/attendance/:orgObjectId/card/:cardId`

Get all attendance events for a specific card ID in an organisation.

**URL**: `http://localhost:4000/api/attendance/0xb194a44e68b2ef1b9fe9f4c..../card/NFC-100`

**Example Response**:
```json
{
  "ok": true,
  "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "cardId": "NFC-100",
  "count": 5,
  "events": [
    {
      "cardId": "NFC-100",
      "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
      "deviceId": "ESP32_ATTENDANCE_001",
      "receivedAt": "2025-12-16T13:00:00.000Z"
    }
  ]
}
```

---

### 6. Get Organisation Details

**GET** `/api/organisations/:orgObjectId`

Get organisation details including subscription status.

**URL**: `http://localhost:4000/api/organisations/0xb194a44e68b2ef1b9fe9f4c....`

**Example Response**:
```json
{
  "ok": true,
  "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "organisation": {
    "name": "Example University",
    "owner": "0x...",
    "subscription": {
      "isActive": true,
      "expiryTimestamp": 1734567890000,
      "paymentAmount": 10000000000
    }
  }
}
```

**Error Response** (404):
```json
{
  "ok": false,
  "error": "Organisation not found: 0xb194a44e68b2ef1b9fe9f4c...."
}
```

---

### 7. Get Organisation Subscription Status

**GET** `/api/organisations/:orgObjectId/subscription`

Get subscription status for an organisation.

**URL**: `http://localhost:4000/api/organisations/0xb194a44e68b2ef1b9fe9f4c..../subscription`

**Example Response**:
```json
{
  "ok": true,
  "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "subscription": {
    "isActive": true,
    "expiryTimestamp": 1734567890000,
    "paymentAmount": 10000000000
  }
}
```

---

### 8. Get Student by Card ID

**GET** `/api/organisations/:orgObjectId/students/:cardId`

Get student information by card ID.

**URL**: `http://localhost:4000/api/organisations/0xb194a44e68b2ef1b9fe9f4c..../students/NFC-100`

**Example Response**:
```json
{
  "ok": true,
  "student": {
    "address": "0x...",
    "name": "John Doe",
    "department": "Computer Science",
    "cardId": "NFC-100",
    "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c...."
  }
}
```

**Error Response** (404):
```json
{
  "ok": false,
  "error": "Student not found for cardId: NFC-100 in organisation: 0xb194a44e68b2ef1b9fe9f4c...."
}
```

---

## Testing Workflow

### Step 1: Check Server Health
```
GET http://localhost:4000/health
```
Verify server is running and has SUI balance.

### Step 2: Check Organisation
```
GET http://localhost:4000/api/organisations/0xb194a44e68b2ef1b9fe9f4c....
```
Verify organisation exists and subscription is active.

### Step 3: Check Student by Card ID
```
GET http://localhost:4000/api/organisations/0xb194a44e68b2ef1b9fe9f4c..../students/NFC-100
```
Verify student is registered with the card ID.

### Step 4: Submit Attendance
```
POST http://localhost:4000/api/attendance
Content-Type: application/json

{
  "cardId": "NFC-100",
  "orgObjectId": "0xb194a44e68b2ef1b9fe9f4c....",
  "deviceId": "ESP32_ATTENDANCE_001"
}
```

### Step 5: Verify Attendance Recorded
```
GET http://localhost:4000/api/attendance/0xb194a44e68b2ef1b9fe9f4c..../card/NFC-100
```
Check that the attendance event was recorded.

---

## Postman Collection Setup

### Environment Variables

Create a Postman environment with:
- `baseUrl`: `http://localhost:4000`
- `orgObjectId`: `0xb194a44e68b2ef1b9fe9f4c....`
- `cardId`: `NFC-100`

### Example URLs Using Variables

- Health: `{{baseUrl}}/health`
- Organisation: `{{baseUrl}}/api/organisations/{{orgObjectId}}`
- Student: `{{baseUrl}}/api/organisations/{{orgObjectId}}/students/{{cardId}}`
- Attendance: `{{baseUrl}}/api/attendance`

---

## Common Issues

### 1. Invalid URI Error
**Problem**: `http:///api/organisations/...` (triple slash)

**Solution**: Make sure you include the base URL:
- ❌ Wrong: `/api/organisations/...`
- ✅ Correct: `http://localhost:4000/api/organisations/...`

### 2. Connection Refused
**Problem**: Cannot connect to server

**Solution**: 
- Verify server is running: `npm run dev` in `server/attendance_server/`
- Check port is correct (default: 4000)
- Verify firewall settings

### 3. Organisation Not Found
**Problem**: 404 error when querying organisation

**Solution**:
- Verify `orgObjectId` is correct (must be a valid Sui object ID)
- Check organisation exists on blockchain
- Verify `SYSTEM_OBJECT_ID` in `.env` is correct

### 4. Student Not Found
**Problem**: 404 error when querying student

**Solution**:
- Verify student is registered on blockchain
- Check `cardId` matches exactly (case-sensitive)
- Verify `orgObjectId` matches the organisation where student was registered

### 5. Subscription Not Active
**Problem**: Attendance submission fails due to inactive subscription

**Solution**:
- Check subscription status: `GET /api/organisations/:orgObjectId/subscription`
- Renew subscription if expired
- Verify `isActive: true` before submitting attendance

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Object IDs must be valid Sui object IDs (0x...)
- Card IDs are case-sensitive
- Server processes attendance asynchronously (responds immediately, processes in background)
- Student cache is rebuilt from blockchain events on each lookup
- Maximum 1000 events stored in-memory (for debugging)

