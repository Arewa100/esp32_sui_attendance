# Contract Improvements Summary

## Overview

This document outlines the improvements made to the ESP32 Sui Attendance System smart contract.

## Key Improvements

### 1. **Shared Object Architecture**

- Made `AttendanceSystem` a shared object so anyone can create organisations
- Anyone can sign and execute the `create_organisation` transaction
- Enables permissionless organisation creation

### 2. **On-Chain Clock Integration**

- Uses Sui's shared Clock object (`0x6`) for timestamps
- `record_attendance()` generates timestamps automatically from on-chain Clock
- Ensures tamper-proof, trustable timestamps
- Standard Sui pattern that works in production

Example usage:
```typescript
const CLOCK_OBJECT_ID = "0x6"; // Standard Sui Clock

const txb = new Transaction();
txb.moveCall({
  target: `${PACKAGE_ID}::attendance_system::record_attendance`,
  arguments: [
    tx.object(orgObjectId),
    tx.pure.address(studentAddress),
    tx.object(CLOCK_OBJECT_ID), // Clock provides timestamp automatically
  ]
});
```

### 3. **Access Control**

- `register_student()` requires organization owner authorization
- Only organization owners can register students to their organisations
- Prevents unauthorized modifications

### 4. **Student Validation**

- `record_attendance()` validates student belongs to the organization
- Added `card_id_to_student` mapping table for efficient lookups
- Prevents recording attendance for non-existent students

### 5. **Duplicate Prevention**

- Card ID uniqueness enforced at registration
- `get_student_by_card_id()` function for RFID lookups
- Ensures each card ID maps to exactly one student per organization

### 6. **Subscription System**

- 10 SUI for 30 days of service
- Payments routed to system owner (deployer address)
- Subscription status checked before recording attendance
- Automatic expiry tracking

### 7. **Constants & Error Codes**

```move
const SUBSCRIPTION_FEE: u64 = 10000000000; // 10 SUI
const SUBSCRIPTION_DURATION_MS: u64 = 2592000000; // 30 days

const E_SUBSCRIPTION_EXPIRED = 1;
const E_INSUFFICIENT_PAYMENT = 2;
const E_STUDENT_NOT_FOUND = 3;
const E_UNAUTHORIZED = 4;
const E_DUPLICATE_CARD_ID = 5;
```

### 8. **Helper Functions**

- `get_student_by_card_id()` - Lookup student by RFID card_id
- `is_student_registered()` - Check if student exists
- `get_org_owner()` - Get organization owner address
- `get_system_owner()` - Get system owner address
- `check_subscription_active()` - Check subscription status
- `get_subscription_status()` - Get full subscription details

## Function Signatures

### `create_organisation()`
```move
public fun create_organisation(
    system: &mut AttendanceSystem,  // Shared object
    name: String,
    ctx: &mut TxContext
)
```

### `register_student()`
```move
public fun register_student(
    org: &mut AttendanceOrganisation,
    name: String,
    card_id: String,
    department: String,
    ctx: &mut TxContext
)
```
- Only organization owner can call
- Checks for duplicate card_id

### `pay_subscription()`
```move
public entry fun pay_subscription(
    system: &AttendanceSystem,
    org: &mut AttendanceOrganisation,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```
- Requires system object for payment routing
- Payment goes to system owner

### `record_attendance()`
```move
public fun record_attendance(
    org: &mut AttendanceOrganisation,
    student_address: address,
    clock: &Clock,
    ctx: &mut TxContext
)
```
- Validates subscription is active
- Validates student belongs to organization
- Uses on-chain Clock for timestamp

## Production Features

1. **Clock object** - Standard Sui shared object, always available at `0x6`
2. **Subscription model** - Enforces payment before attendance recording
3. **Access control** - Role-based permissions for sensitive operations
4. **Payment routing** - Subscription fees go to system owner
5. **Event emission** - All operations emit events for frontend integration

## Backend Integration

Your Node.js backend should:

1. Pass `AttendanceSystem` object to `pay_subscription`
2. Use `get_student_by_card_id()` for RFID card lookups
3. Pass Clock object (`0x6`) in attendance recording transactions

```typescript
// Example: Record attendance from ESP32 card scan
const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::attendance_system::record_attendance`,
  arguments: [
    tx.object(orgObjectId),
    tx.pure.address(studentAddress),
    tx.object("0x6"), // Clock shared object
  ]
});

tx.setGasBudget(100_000_000);
const result = await suiService.executeTransaction(tx);
```
