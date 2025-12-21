# Changelog: Shared Object Architecture Update

## Summary

Updated `AttendanceOrganisation` from an owned object to a shared object to enable server-side transaction signing while maintaining full access control.

## Date
December 2024

## Changes Made

### 1. Object Type Change
- **File**: `sources/types.move`
- **Change**: `AttendanceOrganisation` struct changed from `has key, store` to `has key` only
- **Impact**: Object is now shared instead of owned, allowing any signer to use it in transactions

### 2. Object Creation Update
- **File**: `sources/organisation.move`
- **Change**: `create_organisation` now uses `public_share_object()` instead of `public_transfer()`
- **Impact**: New organizations are created as shared objects

### 3. Access Control Helpers
- **File**: `sources/types.move`
- **Change**: Added two helper functions:
  - `verify_owner(org, caller)`: Checks if caller is organization owner
  - `verify_owner_or_system(org, system, caller)`: Checks if caller is organization owner OR system owner
- **Impact**: Centralized access control logic

### 4. Function Signature Updates
All functions that need access control now require `system: &AttendanceSystem` parameter:

- **attendance.move**:
  - `record_attendance()`: Now requires `system` parameter, allows owner or system owner
  - `get_attendance_records_for_student()`: Now requires `system` and `ctx` parameters, access controlled
  - `get_number_attendance_records()`: Now requires `system` and `ctx` parameters, access controlled

- **student.move**:
  - `get_number_students()`: Now requires `system` and `ctx` parameters, access controlled
  - `get_student_by_card_id()`: Now requires `system` and `ctx` parameters, access controlled
  - `is_student_registered()`: Now requires `system` and `ctx` parameters, access controlled

- **subscription.move**:
  - `check_subscription_active()`: Now requires `system` and `ctx` parameters, access controlled
  - `get_subscription_status()`: Now requires `system` and `ctx` parameters, access controlled

- **attendance_system.move**:
  - All wrapper functions updated to pass `system` parameter to sub-modules

## Access Control Rules

### Organization Owner Only
- `register_student()`: Only organization owner can register students
- `pay_subscription()`: Only organization owner can pay subscriptions (but system owner signs transaction)

### Organization Owner OR System Owner
- `record_attendance()`: Can be called by owner or system owner (server)
- All view functions: Can be accessed by owner or system owner (server)
- Subscription check functions: Can be called by owner or system owner (server)

## Benefits

1. **Server-Side Transaction Signing**: System owner (server) can sign all attendance recording transactions
2. **Reduced User Friction**: Organization owners don't need to sign every transaction
3. **Maintained Security**: Full access control still enforced - only creators can manage their organizations
4. **Monitoring Capability**: System owner can view all organizations for monitoring and operations

## No Breaking Changes

- Subscription fee: Still 10 SUI
- Subscription duration: Still 30 days
- All business logic: Unchanged
- Only transaction signing model changed

## Migration Notes

**For Frontend Developers**:
- All view functions now require `system: &AttendanceSystem` parameter
- All view functions now require `ctx: &mut TxContext` parameter
- Update function calls to include these parameters

**For Server Developers**:
- Server can now sign transactions using system owner's private key
- Server can call `record_attendance()` without organization owner's signature
- Server can view all organization data for monitoring

**For Organization Owners**:
- No changes to user experience
- Still have full control over their organization
- Server handles transaction signing automatically

## Testing

All existing tests should continue to work, but may need updates to:
- Pass `system` parameter to functions
- Pass `ctx` parameter to view functions
- Use shared object ID instead of owned object ID

## Files Modified

1. `sources/types.move` - Changed struct definition, added access control helpers
2. `sources/organisation.move` - Changed object creation to shared
3. `sources/attendance.move` - Added access control, updated signatures
4. `sources/student.move` - Added access control, updated signatures
5. `sources/subscription.move` - Added access control, updated signatures
6. `sources/attendance_system.move` - Updated wrapper functions

