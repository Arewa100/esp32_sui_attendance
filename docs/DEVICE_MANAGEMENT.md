# Device Management System

## Overview

The device management system allows organisations to register ESP32 attendance devices and track their health status. Devices no longer need to have organisation IDs hardcoded - the system automatically resolves the organisation from the device ID.

## Features

- **Device Registration**: Organisations can register devices by device ID
- **Global Device Registry**: Prevents duplicate device IDs across different organisations (each device can only belong to one organisation)
- **Automatic Organisation Resolution**: Server resolves organisation from device ID for attendance recording
- **Device Heartbeat Tracking**: Devices send periodic heartbeats to track if they're alive
- **Health Monitoring**: Frontend can query device health status based on last heartbeat

## Architecture

### Smart Contract

**Device Storage**:
- `AttendanceSystem` maintains a global registry:
  - `device_to_org`: Table mapping deviceId -> orgObjectId (ensures each device belongs to only one organisation)
- Each `AttendanceOrganisation` maintains:
  - `device_ids`: Vector of registered device ID strings (local list for this organisation)
  - `device_heartbeats`: Table mapping deviceId -> last heartbeat timestamp (ms)

**Functions**:
- `register_device(system, org, device_id, ctx)`: Register a device to an organisation
  - **Validation**: Checks global registry to ensure device is not already registered to another organisation
  - **Error**: Returns `e_device_already_registered` (error code 7) if device belongs to a different organisation
- `unregister_device(system, org, device_id, ctx)`: Remove a device from an organisation (also removes from global registry)
- `update_device_heartbeat(system, org, device_id, timestamp, ctx)`: Update device heartbeat timestamp
- `is_device_registered(system, org, device_id, ctx)`: Check if device is registered to this organisation
- `get_device_heartbeat(system, org, device_id, ctx)`: Get device heartbeat timestamp

**Events**:
- `DeviceRegisteredEvent`: Emitted when a device is registered
- `DeviceUnregisteredEvent`: Emitted when a device is unregistered
- `DeviceHeartbeatEvent`: Emitted when a device heartbeat is updated

### Server

**Device Lookup**:
- `getOrgByDeviceId(deviceId)`: Queries `DeviceRegisteredEvent` to find which organisation owns a device
- Results are cached for performance

**Attendance Flow**:
1. Receive attendance event with `cardId` and `deviceId` (orgObjectId optional)
2. Lookup organisation from `deviceId` using `getOrgByDeviceId()`
3. Validate device belongs to organisation
4. Lookup student from `cardId` within that organisation
5. Validate student and device belong to same organisation
6. Record attendance

**Heartbeat Processing**:
- `POST /api/devices/:deviceId/heartbeat`: Receives heartbeat from device
- Updates heartbeat timestamp on blockchain via `update_device_heartbeat()`

### Firmware

**Changes**:
- `orgObjectId` is now optional in attendance payload
- Server resolves organisation from `deviceId`
- Added periodic heartbeat task (sends every hour)
- `ORG_OBJECT_ID` in config.h is now optional (for backward compatibility only)

**Heartbeat**:
- Devices send heartbeat every hour to `/api/devices/:deviceId/heartbeat`
- Heartbeat includes deviceId and optional timestamp
- Server updates on-chain heartbeat timestamp

## API Endpoints

### Device Heartbeat

**POST** `/api/devices/:deviceId/heartbeat`

Update device heartbeat timestamp.

**Request Body** (optional):
```json
{
  "timestamp": 1234567890000  // Optional, milliseconds since epoch. Defaults to current time.
}
```

**Response**:
```json
{
  "ok": true,
  "message": "Heartbeat updated successfully",
  "deviceId": "ESP32_ATTENDANCE_001",
  "timestamp": 1234567890000,
  "transactionDigest": "0xabc123..."
}
```

### Get Organisation by Device

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

### Attendance (Updated)

**POST** `/api/attendance`

Record attendance. `orgObjectId` is now optional if `deviceId` is provided.

**Request Body**:
```json
{
  "cardId": "A1B2C3D4",
  "deviceId": "ESP32_ATTENDANCE_001",  // Required if orgObjectId not provided
  "orgObjectId": "0x789abc123def456"   // Optional, server resolves from deviceId
}
```

## Usage Examples

### Registering a Device

From frontend or via SDK:
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${packageId}::attendance_system::register_device`,
  arguments: [
    tx.object(systemObjectId), // Must be mutable (&mut)
    tx.object(orgObjectId),    // Must be mutable (&mut)
    tx.pure.string("ESP32_ATTENDANCE_001"),
  ],
});
await signAndExecute(tx);
```

**Error Handling**:
- If device is already registered to another organisation, the transaction will fail with error code 7 (`e_device_already_registered`)
- Frontend should check for this error and display: "Device ID not available - this device is already registered to another organisation"

### Recording Attendance (New Flow)

**Firmware sends** (orgObjectId not required):
```json
{
  "cardId": "A1B2C3D4",
  "deviceId": "ESP32_ATTENDANCE_001"
}
```

**Server automatically**:
1. Resolves orgObjectId from deviceId
2. Validates device belongs to organisation
3. Looks up student from cardId in that organisation
4. Records attendance

### Heartbeat (Automatic)

Firmware automatically sends heartbeat every hour:
```
POST /api/devices/ESP32_ATTENDANCE_001/heartbeat
```

No request body needed (timestamp defaults to current time).

## Device Health Status

Frontend can determine device health by:
1. Querying `DeviceHeartbeatEvent` to get last heartbeat timestamp
2. Comparing with current time
3. Device is "alive" if heartbeat within last 2 hours (configurable threshold)
4. Device is "dead" if heartbeat older than threshold

Example query:
```typescript
const events = await suiClient.queryEvents({
  MoveEventType: `${packageId}::events::DeviceHeartbeatEvent`,
  filter: { device_id: "ESP32_ATTENDANCE_001" }
});
const lastHeartbeat = events.data[0]?.parsedJson?.timestamp;
const isAlive = Date.now() - lastHeartbeat < 2 * 60 * 60 * 1000; // 2 hours
```

## Migration Guide

### For Existing Deployments

1. **Update Smart Contract**: Deploy updated contract with device management
2. **Update Server**: Deploy updated server code
3. **Register Existing Devices**: For each device, call `register_device()` with the device ID
4. **Update Firmware** (optional): Remove `ORG_OBJECT_ID` from config.h (device will work without it)
5. **Deploy Firmware**: Upload new firmware with heartbeat support

### Backward Compatibility

- Old firmware (with orgObjectId) still works
- Server accepts both orgObjectId and deviceId
- If both provided, server validates they match
- If only deviceId provided, server resolves organisation

## Duplicate Prevention

The system prevents the same device ID from being registered to multiple organisations:
- **Global Registry**: `AttendanceSystem.device_to_org` maintains deviceId → orgObjectId mapping
- **Registration Check**: Before registering, system checks if device belongs to another organisation
- **Error Handling**: Registration fails with error code 7 (`e_device_already_registered`)
- **Frontend Display**: Show "Device ID not available" when device is already registered

See [Device Duplicate Prevention](./DEVICE_DUPLICATE_PREVENTION.md) for detailed documentation.

## Future Enhancements

- Battery level tracking (structure designed to be extensible)
- Connectivity status monitoring
- Device metrics dashboard
- Alert system for offline devices
- Device grouping and management UI

