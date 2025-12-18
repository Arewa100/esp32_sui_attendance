# Pre-Deployment Checklist - ESP32 Sui Attendance System

This document provides a comprehensive checklist for deploying the ESP32 Sui Attendance System smart contract.

## Critical Pre-Deployment Steps

### 1. Verify System Owner Address

- **Location**: Automatically set during `init()` to deployer address
- **Impact**: This address receives:
  - All subscription payments (10 SUI per 30 days)
- **Action**: Ensure you deploy from the correct wallet address
- **Status**: VERIFY DEPLOYER ADDRESS IS CORRECT

### 2. Run All Tests

- **Action**: Execute test suite before deployment
- **Command**: 
  ```bash
  cd smart-contract/attendance_system
  sui move test
  ```
- **Expected**: All 6 tests should pass
- **Tests**:
  - [ ] `test_to_register_to_create_organisation`
  - [ ] `test_to_register_student`
  - [ ] `test_to_register_student_and_record_attendance`
  - [ ] `test_subscription_payment`
  - [ ] `test_attendance_without_subscription`
  - [ ] `test_subscription_payment_insufficient`
- **Status**: MANDATORY - DO NOT SKIP

### 3. Build the Contract

- **Action**: Compile the smart contract
- **Command**:
  ```bash
  cd smart-contract/attendance_system
  sui move build
  ```
- **Expected**: Build succeeds with no errors
- **Status**: REQUIRED BEFORE DEPLOYMENT

### 4. Secure UpgradeCap

- **Action**: After deployment, secure the UpgradeCap
- **Recommendations**:
  - Use a multisig wallet (2-of-3 or 3-of-5 recommended)
  - Or use a hardware wallet (Ledger, etc.)
  - Store private keys in secure environment
  - Never store keys in code or version control
- **Impact**: Loss of UpgradeCap = cannot upgrade contract
- **Status**: MUST BE SECURED AFTER DEPLOYMENT

### 5. Prepare Backend Server

- **Action**: Configure backend server environment
- **Required Environment Variables**:
  ```env
  SUI_NETWORK=testnet
  PACKAGE_ID=<from deployment>
  SYSTEM_OBJECT_ID=<from deployment>
  SUI_PRIVATE_KEY=<server wallet private key>
  ```
- **Status**: REQUIRED FOR ATTENDANCE RECORDING

### 6. Prepare ESP32 Firmware

- **Action**: Update firmware configuration
- **Required Settings**:
  ```cpp
  #define SERVER_URL "http://your-server.com/api/attendance"
  #define ORG_OBJECT_ID "0x<organisation_object_id>"
  ```
- **Status**: REQUIRED FOR HARDWARE INTEGRATION

## Deployment Steps

### Testnet Deployment

1. **Switch to testnet**:
   ```bash
   sui client switch --env testnet
   ```

2. **Get testnet SUI** (if needed):
   ```bash
   sui client faucet
   ```

3. **Deploy to testnet**:
   ```bash
   cd smart-contract/attendance_system
   sui client publish --gas-budget 100000000
   ```

4. **Record deployment output**:
   - Package ID
   - AttendanceSystem object ID
   - AdminCap object ID
   - UpgradeCap object ID

### Mainnet Deployment

WARNING: Only deploy to mainnet after thorough testnet testing.

1. **Switch to mainnet**:
   ```bash
   sui client switch --env mainnet
   ```

2. **Verify sufficient balance**:
   ```bash
   sui client balance
   ```

3. **Deploy to mainnet**:
   ```bash
   cd smart-contract/attendance_system
   sui client publish --gas-budget 100000000
   ```

## Post-Deployment Actions

### 1. Update Frontend `.env`

```env
VITE_PACKAGE_ID=0x<package_id_from_deployment>
VITE_SYSTEM_OBJECT_ID=0x<system_object_id_from_deployment>
```

### 2. Update Backend Server `.env`

```env
SUI_NETWORK=testnet
PACKAGE_ID=0x<package_id_from_deployment>
SYSTEM_OBJECT_ID=0x<system_object_id_from_deployment>
SUI_PRIVATE_KEY=<server_wallet_private_key>
PORT=4000
```

### 3. Update ESP32 Firmware

Update `config.h`:
```cpp
#define SERVER_URL "http://<your_server_ip>:4000/api/attendance"
#define ORG_OBJECT_ID "0x<your_org_object_id>"
```

### 4. Create Test Organization

1. Open frontend application
2. Connect wallet
3. Create a test organization
4. Note the organization object ID

### 5. Register Test Student

1. Go to organization dashboard
2. Register a student with test RFID card ID
3. Verify student appears in list

### 6. Pay Subscription

1. Go to subscription page
2. Pay 10 SUI for 30-day subscription
3. Verify subscription is active

### 7. Test Attendance Recording

1. Power on ESP32 with RFID reader
2. Scan test RFID card
3. Verify attendance recorded on-chain
4. Check frontend dashboard for new record

## Security Checklist

- [ ] Deployer address verified (receives subscription payments)
- [ ] UpgradeCap stored securely
- [ ] Server private key stored securely (not in code)
- [ ] No private keys in version control
- [ ] Backend server uses HTTPS in production
- [ ] ESP32 communicates over secure network

## Testing Checklist

- [ ] All 6 unit tests pass
- [ ] Organization creation works
- [ ] Student registration works
- [ ] Subscription payment works
- [ ] Attendance recording works (with active subscription)
- [ ] Attendance fails without subscription (expected)
- [ ] ESP32 successfully sends attendance to server
- [ ] Server successfully records on blockchain
- [ ] Frontend displays attendance records

## Monitoring Checklist

- [ ] Server health endpoint accessible
- [ ] Server logs configured (Winston)
- [ ] Subscription expiry tracking works
- [ ] Attendance events queryable from frontend

## Configuration Reference

### Smart Contract Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Subscription Fee | 10 SUI | 10,000,000,000 MIST |
| Subscription Duration | 30 days | 2,592,000,000 ms |
| Clock Object | `0x6` | Sui standard clock |

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | E_SUBSCRIPTION_EXPIRED | Subscription not active |
| 2 | E_INSUFFICIENT_PAYMENT | Payment less than 10 SUI |
| 3 | E_STUDENT_NOT_FOUND | Student not in organization |
| 4 | E_UNAUTHORIZED | Not organization owner |
| 5 | E_DUPLICATE_CARD_ID | Card ID already registered |

## Deployment Output Template

Save this information after deployment:

```
=== DEPLOYMENT RESULTS ===
Date: ____________________
Network: [ ] Testnet  [ ] Mainnet
Deployer Address: 0x____________________

Package ID: 0x____________________
AttendanceSystem Object ID: 0x____________________
AdminCap Object ID: 0x____________________
UpgradeCap Object ID: 0x____________________

Gas Used: __________ MIST
Transaction Digest: ____________________
```

## Troubleshooting

### Common Issues

1. **Insufficient gas**: Increase `--gas-budget` value
2. **Object not found**: Verify object IDs in `.env` files
3. **Subscription expired**: Pay subscription before recording attendance
4. **Student not found**: Register student before scanning RFID

### Support Resources

- [Sui Move Documentation](https://docs.sui.io/build/move)
- [Sui Developer Portal](https://docs.sui.io/)
- Check server logs: `npm run dev` shows real-time logs
- Frontend console: Browser DevTools for errors


