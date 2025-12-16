# Frontend Integration & Hardware Guide

## Overview

This guide provides comprehensive instructions for integrating the ESP32 Sui Attendance System smart contract with frontend applications and ESP32 hardware devices.

## Table of Contents

- [Frontend Integration](#frontend-integration)
  - [Prerequisites](#prerequisites)
  - [Sui Wallet Integration](#sui-wallet-integration)
  - [Event Listening](#event-listening)
  - [Transaction Building](#transaction-building)
  - [Query Functions](#query-functions)
- [Hardware Integration](#hardware-integration)
  - [ESP32 Setup](#esp32-setup)
  - [RFID Card Reading](#rfid-card-reading)
  - [Device ID Mapping](#device-id-mapping)
  - [Transaction Submission](#transaction-submission)
- [Complete Integration Example](#complete-integration-example)
- [Troubleshooting](#troubleshooting)

## Frontend Integration

### Prerequisites

- Node.js 18+ and npm/yarn
- Sui Wallet Standard compatible wallet (Sui Wallet, Ethos Wallet, etc.)
- Access to Sui RPC endpoint (testnet/mainnet)
- Published smart contract package ID

### Sui Wallet Integration

#### 1. Install Dependencies

```bash
npm install @mysten/sui.js @mysten/wallet-standard
# or
yarn add @mysten/sui.js @mysten/wallet-standard
```

#### 2. Connect Wallet

```typescript
import { getWallets, Wallet } from '@mysten/wallet-standard';

// Get available wallets
const wallets = getWallets();
const suiWallet = wallets.find(wallet => wallet.name === 'Sui Wallet');

if (!suiWallet) {
  throw new Error('Sui Wallet not found');
}

// Connect to wallet
await suiWallet.features['standard:connect'].connect();
const accounts = await suiWallet.features['standard:connect'].getAccounts();
const currentAccount = accounts[0];
```

#### 3. Get Package and Object IDs

After deployment, you'll need:
- **Package ID**: The published package identifier
- **AttendanceSystem Object ID**: The system object ID from deployment
- **Clock Object ID**: The shared Clock object ID (0x6 on mainnet/testnet)

```typescript
// Example: Store these in your config
const CONFIG = {
  PACKAGE_ID: '0x...', // Your package ID
  SYSTEM_OBJECT_ID: '0x...', // AttendanceSystem object ID
  CLOCK_OBJECT_ID: '0x6', // Sui Clock object (shared)
  NETWORK: 'testnet' // or 'mainnet'
};
```

### Event Listening

The smart contract emits events for all major operations. Listen to these events to update your UI in real-time.

#### Setup Event Listener

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl(CONFIG.NETWORK) });

// Listen for OrganisationCreatedEvent
async function listenForOrganisationCreated() {
  const unsubscribe = await client.subscribeEvent({
    filter: {
      Package: CONFIG.PACKAGE_ID,
    },
    onMessage: (event) => {
      if (event.type.includes('OrganisationCreatedEvent')) {
        const parsed = parseOrganisationCreatedEvent(event);
        console.log('New organisation created:', parsed);
        // Update UI
      }
    },
  });
  
  return unsubscribe;
}

// Parse event data
function parseOrganisationCreatedEvent(event: any) {
  return {
    organisation: event.parsedJson.organisation,
    name: event.parsedJson.name,
    owner: event.parsedJson.owner,
    timestamp: event.timestampMs,
  };
}
```

#### All Event Types

```typescript
// OrganisationCreatedEvent
{
  organisation: string; // address
  name: string;
  owner: string; // address
}

// StudentRegisteredEvent
{
  student: string; // address
  name: string;
  department: string;
  card_id: string;
  organisation: string; // address
}

// AttendanceRecordedEvent
{
  record: string; // address
  student: string; // address
  timestamp: number; // u64 (milliseconds)
  organisation: string; // address
}

// SubscriptionRenewedEvent
{
  organisation: string; // address
  expiry_timestamp: number; // u64 (milliseconds)
  payment_amount: number; // u64 (MIST)
}
```

### Transaction Building

#### 1. Create Organisation

```typescript
import { TransactionBlock } from '@mysten/sui.js/transactions';

async function createOrganisation(name: string) {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::attendance_system::create_organisation`,
    arguments: [
      tx.object(CONFIG.SYSTEM_OBJECT_ID),
      tx.pure(name),
    ],
  });
  
  const result = await suiWallet.features['standard:signAndExecuteTransaction'].signAndExecuteTransaction({
    transaction: tx,
    account: currentAccount,
  });
  
  return result;
}
```

#### 2. Register Student

```typescript
async function registerStudent(
  orgObjectId: string,
  name: string,
  cardId: string,
  department: string
) {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::attendance_system::register_student`,
    arguments: [
      tx.object(orgObjectId),
      tx.pure(name),
      tx.pure(cardId),
      tx.pure(department),
    ],
  });
  
  const result = await suiWallet.features['standard:signAndExecuteTransaction'].signAndExecuteTransaction({
    transaction: tx,
    account: currentAccount,
  });
  
  return result;
}
```

#### 3. Pay Subscription

```typescript
async function paySubscription(
  orgObjectId: string,
  paymentAmount: number // in MIST (10 SUI = 10,000,000,000 MIST)
) {
  const tx = new TransactionBlock();
  
  // Split coin for payment
  const [payment] = tx.splitCoins(tx.gas, [paymentAmount]);
  
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::attendance_system::pay_subscription`,
    arguments: [
      tx.object(CONFIG.SYSTEM_OBJECT_ID),
      tx.object(orgObjectId),
      payment,
      tx.object(CONFIG.CLOCK_OBJECT_ID), // Shared Clock object
    ],
  });
  
  const result = await suiWallet.features['standard:signAndExecuteTransaction'].signAndExecuteTransaction({
    transaction: tx,
    account: currentAccount,
  });
  
  return result;
}
```

#### 4. Record Attendance

```typescript
async function recordAttendance(
  orgObjectId: string,
  studentAddress: string
) {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::attendance_system::record_attendance`,
    arguments: [
      tx.object(orgObjectId),
      tx.pure(studentAddress),
      tx.object(CONFIG.CLOCK_OBJECT_ID), // Shared Clock object
    ],
  });
  
  const result = await suiWallet.features['standard:signAndExecuteTransaction'].signAndExecuteTransaction({
    transaction: tx,
    account: currentAccount,
  });
  
  return result;
}
```

### Query Functions

Since Move doesn't support view functions directly, use the Sui RPC to query object data.

#### Get Organisation Data

```typescript
async function getOrganisationData(orgObjectId: string) {
  const object = await client.getObject({
    id: orgObjectId,
    options: {
      showContent: true,
      showType: true,
    },
  });
  
  return object.data?.content;
}
```

#### Get Student by Card ID

```typescript
async function getStudentByCardId(orgObjectId: string, cardId: string) {
  // This requires calling the on-chain function via a transaction
  // or maintaining an off-chain index from events
  
  // Option 1: Query events to build index
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent`,
    },
  });
  
  // Find student with matching card_id
  const studentEvent = events.data.find(
    (e) => e.parsedJson?.card_id === cardId && e.parsedJson?.organisation === orgObjectId
  );
  
  return studentEvent?.parsedJson?.student;
}
```

#### Get Subscription Status

```typescript
async function getSubscriptionStatus(orgObjectId: string) {
  // Query organisation object to get subscription data
  const org = await getOrganisationData(orgObjectId);
  
  if (!org || !('fields' in org)) {
    return null;
  }
  
  const subscription = (org.fields as any).subscription;
  
  if (!subscription || !('fields' in subscription)) {
    return {
      isActive: false,
      expiryTimestamp: 0,
      paymentAmount: 0,
    };
  }
  
  const currentTime = Date.now();
  const expiryTimestamp = parseInt(subscription.fields.expiry_timestamp);
  const isActive = expiryTimestamp > currentTime && subscription.fields.is_active;
  
  return {
    isActive,
    expiryTimestamp,
    paymentAmount: parseInt(subscription.fields.payment_amount),
  };
}
```

#### Get Attendance Records

```typescript
async function getAttendanceRecords(orgObjectId: string, studentAddress: string) {
  // Query organisation object to get records_by_student table
  const org = await getOrganisationData(orgObjectId);
  
  if (!org || !('fields' in org)) {
    return [];
  }
  
  // The records_by_student is a Table, which requires special handling
  // You may need to maintain an off-chain index from AttendanceRecordedEvent
  
  // Option: Query events
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent`,
    },
    filter: {
      And: [
        { MoveEventField: { path: '/student', value: studentAddress } },
        { MoveEventField: { path: '/organisation', value: orgObjectId } },
      ],
    },
  });
  
  return events.data.map((e) => ({
    record: e.parsedJson?.record,
    timestamp: parseInt(e.parsedJson?.timestamp || '0'),
    student: e.parsedJson?.student,
  }));
}
```

## Hardware Integration

### ESP32 Setup

#### 1. Hardware Requirements

- ESP32 development board
- RFID reader module (RC522 or similar)
- Power supply
- Connection wires

#### 2. Software Setup

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// WiFi credentials
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Server endpoint (your backend that submits to Sui)
const char* serverUrl = "http://your-server.com/api/attendance";

// RFID setup
#define SS_PIN 5
#define RST_PIN 4
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Device configuration
const String DEVICE_ID = "ESP32_001"; // Unique device identifier
const String ORG_OBJECT_ID = "0x..."; // Your organisation object ID
```

#### 3. RFID Card Reading

```cpp
void setup() {
  Serial.begin(115200);
  
  // Initialize WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  
  // Initialize RFID
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("RFID reader initialized");
}

void loop() {
  // Check for RFID card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String cardId = getCardId();
    Serial.println("Card detected: " + cardId);
    
    // Send to server
    sendAttendanceRecord(cardId);
    
    delay(2000); // Prevent multiple reads
  }
}

String getCardId() {
  String cardId = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) cardId += "0";
    cardId += String(mfrc522.uid.uidByte[i], HEX);
  }
  return cardId;
}
```

#### 4. Transaction Submission

The ESP32 should send attendance data to a backend server, which then submits the transaction to Sui. This is because:
- ESP32 has limited resources
- Wallet signing requires private keys (never store on device)
- Backend can handle transaction building and signing

```cpp
void sendAttendanceRecord(String cardId) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + DEVICE_ID + "\",";
  jsonPayload += "\"card_id\":\"" + cardId + "\",";
  jsonPayload += "\"org_object_id\":\"" + ORG_OBJECT_ID + "\",";
  jsonPayload += "\"timestamp\":" + String(millis()) + "";
  jsonPayload += "}";
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error: " + String(httpResponseCode));
  }
  
  http.end();
}
```

### Device ID Mapping

Map ESP32 devices to student card IDs in your backend:

```typescript
// Backend mapping (example)
const deviceToStudentMap: Record<string, string> = {
  'ESP32_001': 'student_address_1',
  'ESP32_002': 'student_address_2',
  // ...
};

// When ESP32 sends card_id, look up student address
async function processAttendanceRecord(deviceId: string, cardId: string, orgObjectId: string) {
  // 1. Get student address from card_id
  const studentAddress = await getStudentByCardId(orgObjectId, cardId);
  
  if (!studentAddress) {
    throw new Error('Student not found for card ID: ' + cardId);
  }
  
  // 2. Check subscription status
  const subscription = await getSubscriptionStatus(orgObjectId);
  if (!subscription.isActive) {
    throw new Error('Subscription expired. Please renew.');
  }
  
  // 3. Submit transaction to Sui
  const result = await recordAttendance(orgObjectId, studentAddress);
  
  return result;
}
```

## Complete Integration Example

### Backend API Endpoint

```typescript
// Express.js example
import express from 'express';
import { recordAttendance, getStudentByCardId } from './sui-client';

const app = express();
app.use(express.json());

app.post('/api/attendance', async (req, res) => {
  try {
    const { device_id, card_id, org_object_id } = req.body;
    
    // Validate input
    if (!device_id || !card_id || !org_object_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get student address from card ID
    const studentAddress = await getStudentByCardId(org_object_id, card_id);
    if (!studentAddress) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check subscription
    const subscription = await getSubscriptionStatus(org_object_id);
    if (!subscription.isActive) {
      return res.status(403).json({ error: 'Subscription expired' });
    }
    
    // Record attendance
    const result = await recordAttendance(org_object_id, studentAddress);
    
    res.json({
      success: true,
      transaction: result.digest,
      student: studentAddress,
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Troubleshooting

### Common Issues

#### 1. Wallet Connection Failed
- **Solution**: Ensure Sui Wallet extension is installed and unlocked
- Check browser console for errors

#### 2. Transaction Failed: Subscription Expired
- **Solution**: Check subscription status before recording attendance
- Prompt user to renew subscription if expired

#### 3. Student Not Found
- **Solution**: Verify card ID mapping
- Check that student is registered in the organisation

#### 4. ESP32 Cannot Connect to Server
- **Solution**: Verify WiFi credentials
- Check server is running and accessible
- Verify firewall settings

#### 5. Clock Object Not Found
- **Solution**: Use the correct Clock object ID (0x6 for shared Clock)
- Ensure Clock object is shared on the network

### Debug Tips

1. **Enable verbose logging** in Sui client
2. **Monitor events** to track all operations
3. **Check transaction digests** on Sui Explorer
4. **Validate object IDs** before transactions
5. **Test with small amounts** first (testnet)

## Additional Resources

- [Sui TypeScript SDK Documentation](https://docs.sui.io/build/typescript-sdk)
- [Sui Wallet Standard](https://github.com/wallet-standard/wallet-standard)
- [Sui Explorer](https://suiexplorer.com/)
- [ESP32 Arduino Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)

---

**Note**: This guide provides a foundation for integration. Adapt the code examples to your specific technology stack and requirements.

