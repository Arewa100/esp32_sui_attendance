# Device Duplicate Prevention

## Overview

The system prevents the same device ID from being registered to multiple organisations. This ensures device ownership is unique and prevents conflicts.

## Implementation

### Global Device Registry

A global device registry is maintained in the `AttendanceSystem` object:
- **Field**: `device_to_org: table::Table<String, address>`
- **Purpose**: Maps deviceId → orgObjectId to prevent duplicates
- **Scope**: System-wide (shared object)

### Registration Flow

When `register_device()` is called:

1. **Check Global Registry**: Query `device_to_org` table
   - If device exists and belongs to a different organisation → **FAIL** with `e_device_already_registered` (error code 7)
   - If device exists and belongs to the same organisation → **SUCCESS** (idempotent operation)
   - If device doesn't exist → **CONTINUE**

2. **Register Device**: Add to:
   - Organisation's `device_ids` vector (local list)
   - Global `device_to_org` registry

3. **Emit Event**: `DeviceRegisteredEvent`

### Unregistration Flow

When `unregister_device()` is called:

1. **Verify Ownership**: Check `device_to_org` to ensure device belongs to this organisation
2. **Remove from Global Registry**: Remove entry from `device_to_org` table
3. **Remove from Organisation**: Remove from organisation's `device_ids` and `device_heartbeats`
4. **Emit Event**: `DeviceUnregisteredEvent`

## Error Handling

### Error Code 7: Device Already Registered

**Trigger**: Attempting to register a device ID that is already registered to a different organisation

**Smart Contract Error**:
```move
assert!(existing_org == org_address, constants::e_device_already_registered());
```

**Frontend Display**: 
- Error message: "Device ID not available. This device is already registered to another organisation."
- Suggested action: Use a different device ID or contact the device owner

## Example Scenarios

### Scenario 1: Valid Registration
```
Org A attempts to register "ESP32_001"
→ Device not in global registry
→ Registration succeeds
→ device_to_org["ESP32_001"] = OrgA
```

### Scenario 2: Duplicate Prevention
```
Org A has registered "ESP32_001"
Org B attempts to register "ESP32_001"
→ Device found in global registry (belongs to Org A)
→ Registration fails with e_device_already_registered
→ Frontend shows: "Device ID not available"
```

### Scenario 3: Idempotent Re-registration
```
Org A has registered "ESP32_001"
Org A attempts to register "ESP32_001" again
→ Device found in global registry (belongs to Org A)
→ Registration succeeds (returns success message)
→ No state changes (already registered)
```

### Scenario 4: Transfer Device
```
Org A has registered "ESP32_001"
Org A unregisters "ESP32_001"
→ Device removed from global registry
→ Org B can now register "ESP32_001"
→ Registration succeeds
```

## Frontend Integration

### Registering a Device

```typescript
try {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::attendance_system::register_device`,
    arguments: [
      tx.object(systemObjectId),
      tx.object(orgObjectId),
      tx.pure.string(deviceId),
    ],
  });
  
  const result = await signAndExecute(tx);
  // Success: Device registered
} catch (error: any) {
  if (error.code === 7 || error.message?.includes('device_already_registered')) {
    // Error code 7: Device already registered to another organisation
    showError("Device ID not available. This device is already registered to another organisation.");
  } else {
    showError(`Failed to register device: ${error.message}`);
  }
}
```

### Checking Device Availability (Before Registration)

The frontend can check device availability by:
1. Querying `DeviceRegisteredEvent` to see if device is registered
2. Displaying appropriate UI (e.g., disable register button if already registered)

Example:
```typescript
async function isDeviceAvailable(deviceId: string): Promise<boolean> {
  const events = await suiClient.queryEvents({
    MoveEventType: `${packageId}::events::DeviceRegisteredEvent`,
    filter: { device_id: deviceId }
  });
  
  // Device is available if no registration events found
  return events.data.length === 0;
}
```

## Benefits

1. **Prevents Conflicts**: Ensures one device belongs to one organisation at a time
2. **Data Integrity**: Maintains consistent device ownership state
3. **Clear Error Messages**: Frontend can provide user-friendly error messages
4. **Transfer Support**: Devices can be unregistered and re-registered to different organisations

## Notes

- The global registry is stored in the shared `AttendanceSystem` object
- All organisations access the same registry (enforced uniqueness)
- Device IDs are case-sensitive strings
- Unregistering a device frees it up for registration by other organisations

