# Device Management Implementation Summary

## Overview

This document summarizes the implementation of device management and heartbeat tracking for the ESP32 Sui Attendance System. The system now allows organisations to register devices and track their health status without requiring organisation IDs to be hardcoded in firmware.

## Problem Solved

**Before**: ESP32 firmware required `orgObjectId` to be hardcoded in `config.h`, making it difficult for end users who purchase hardware devices.

**After**: 
- Devices are registered to organisations by device ID
- Firmware only needs `deviceId` (no orgObjectId required)
- Server automatically resolves organisation from device ID
- Device heartbeat tracking enables health monitoring

## Implementation Components

### 1. Smart Contract Changes

**New Files**:
- `sources/device.move`: Device management module

**Modified Files**:
- `sources/types.move`: 
  - Added `device_ids` and `device_heartbeats` to `AttendanceOrganisation`
  - Added `device_to_org` global registry to `AttendanceSystem` to prevent duplicate device IDs
  - Added getter/setter functions for device registry
- `sources/organisation.move`: Updated `create_attendance_organisation` to include device fields
- `sources/events.move`: Added device events (`DeviceRegisteredEvent`, `DeviceUnregisteredEvent`, `DeviceHeartbeatEvent`)
- `sources/constants.move`: Added `e_device_already_registered()` error constant (error code 7)
- `sources/attendance_system.move`: 
  - Added device management entry points
  - Updated `init()` to initialize global device registry table

**New Functions**:
- `register_device(system, org, device_id, ctx)`: Register device to organisation
  - **Global Validation**: Checks global `device_to_org` registry to prevent duplicate device IDs across organisations
  - **Error Code**: Returns error code 7 (`e_device_already_registered`) if device belongs to another organisation
- `unregister_device(system, org, device_id, ctx)`: Remove device from organisation (also removes from global registry)
- `update_device_heartbeat(system, org, device_id, timestamp, ctx)`: Update heartbeat timestamp
- `is_device_registered(system, org, device_id, ctx)`: Check device registration
- `get_device_heartbeat(system, org, device_id, ctx)`: Get heartbeat timestamp

**Global Device Registry**:
- Added `device_to_org: Table<String, address>` to `AttendanceSystem` struct
- Maps deviceId -> orgObjectId to ensure each device can only belong to one organisation
- Updated on device registration/unregistration

### 2. Server Changes

**New Files**:
- `src/services/deviceService.ts`: Device lookup service
- `src/services/heartbeatService.ts`: Heartbeat processing service
- `src/routes/devices.ts`: Device API routes

**Modified Files**:
- `src/services/attendanceService.ts`: Updated to support deviceId-based lookup
- `src/models/attendanceEvent.ts`: Made `orgObjectId` optional
- `src/routes/attendance.ts`: Updated validation (orgObjectId optional if deviceId provided)
- `src/index.ts`: Added devices route

**New Endpoints**:
- `POST /api/devices/:deviceId/heartbeat`: Update device heartbeat
- `GET /api/devices/:deviceId/organisation`: Get organisation for device

**Updated Endpoints**:
- `POST /api/attendance`: Now accepts deviceId only (orgObjectId optional)

### 3. Firmware Changes

**Modified Files**:
- `src/attendance_client.h`: Made orgObjectId optional, added heartbeat function
- `src/attendance_client.cpp`: Updated payload format, added heartbeat implementation
- `src/main.cpp`: Added periodic heartbeat task (every hour)
- `include/config.h.example`: Made ORG_OBJECT_ID optional

**Changes**:
- Attendance payload: `orgObjectId` now optional
- Heartbeat: Devices send heartbeat every hour automatically
- Configuration: `ORG_OBJECT_ID` no longer required in config.h

### 4. Documentation

**New Files**:
- `docs/DEVICE_MANAGEMENT.md`: Comprehensive device management documentation
- `docs/DEVICE_MANAGEMENT_IMPLEMENTATION.md`: This file

**Modified Files**:
- `docs/UPCOMING_FEATURES.md`: Added note about future battery/metrics extension
- `server/attendance_server/Attendance_System_API.postman_collection.json`: Added device endpoints

## Key Features

1. **Device Registration**: Organisations can register devices via smart contract
2. **Duplicate Prevention**: Global registry prevents same device ID from being registered to multiple organisations
3. **Automatic Organisation Resolution**: Server resolves org from deviceId for attendance
4. **Device Validation**: System ensures device belongs to organisation before recording attendance
5. **Heartbeat Tracking**: Devices send periodic heartbeats (every hour)
6. **Health Monitoring**: Frontend can query device health based on last heartbeat
7. **Backward Compatibility**: Old firmware (with orgObjectId) still works

## Flow Diagrams

### Device Registration Flow
```
Organisation Owner → register_device(deviceId) → Smart Contract
→ Check global device_to_org registry
→ If device exists in different org: FAIL with e_device_already_registered
→ If device doesn't exist or belongs to same org: Register device
→ Add to global device_to_org registry
→ DeviceRegisteredEvent emitted
→ Server caches deviceId → orgObjectId mapping
```

### Attendance Recording Flow (New)
```
ESP32 Device → POST /api/attendance {cardId, deviceId}
→ Server: getOrgByDeviceId(deviceId)
→ Server: Validate device belongs to org
→ Server: getStudentByCardId(orgObjectId, cardId)
→ Server: Validate student belongs to same org
→ Server: record_attendance(orgObjectId, studentAddress)
→ Smart Contract: Record attendance
```

### Heartbeat Flow
```
ESP32 Device (every hour) → POST /api/devices/:deviceId/heartbeat
→ Server: getOrgByDeviceId(deviceId)
→ Server: update_device_heartbeat(orgObjectId, deviceId, timestamp)
→ Smart Contract: Update heartbeat timestamp
→ DeviceHeartbeatEvent emitted
```

## Migration Steps

1. **Deploy Updated Smart Contract**
   ```bash
   cd smart-contract/attendance_system
   sui move build
   sui client publish --gas-budget 100000000
   ```

2. **Update Environment Variables**
   - Update `PACKAGE_ID` in server `.env` if contract was redeployed

3. **Deploy Updated Server**
   ```bash
   cd server/attendance_server
   npm install  # If new dependencies
   npm run build
   npm start
   ```

4. **Register Existing Devices**
   - For each device, call `register_device()` via frontend or SDK
   - Example:
     ```typescript
     tx.moveCall({
       target: `${packageId}::attendance_system::register_device`,
       arguments: [systemObjectId, orgObjectId, "ESP32_ATTENDANCE_001"],
     });
     ```

5. **Update Firmware (Optional but Recommended)**
   - Remove `ORG_OBJECT_ID` from `config.h` (or comment it out)
   - Upload new firmware with heartbeat support
   - Device will work with just `DEVICE_ID`

## Testing

### Test Device Registration
1. Register a device to an organisation
2. Verify `DeviceRegisteredEvent` is emitted
3. Query device organisation: `GET /api/devices/:deviceId/organisation`

### Test Attendance with Device ID
1. Send attendance with only `deviceId` (no `orgObjectId`)
2. Verify server resolves organisation correctly
3. Verify attendance is recorded

### Test Heartbeat
1. Wait for automatic heartbeat (or trigger manually)
2. Verify `DeviceHeartbeatEvent` is emitted
3. Query device heartbeat from organisation object

### Test Device Validation
1. Register a device to Organisation A
2. Try to register the same device to Organisation B
3. Verify transaction fails with error code 7 (`e_device_already_registered`)
4. Frontend should display: "Device ID not available - device already registered to another organisation"
5. Try recording attendance with device not registered to organisation
6. Verify request fails with appropriate error

## Future Enhancements

The structure is designed to be extensible for:
- Battery level tracking
- Connectivity status
- Device metrics (uptime, error counts, etc.)
- Device grouping and management
- Alert system for offline devices

See `docs/UPCOMING_FEATURES.md` for planned enhancements.

## Notes

- Core attendance logic remains unchanged
- Backward compatibility maintained (old firmware still works)
- Device lookup uses event queries (may be slow for large systems - consider indexing)
- Heartbeat interval is configurable in firmware (default: 1 hour)
- Device health threshold is configurable in frontend (recommended: 2 hours)

