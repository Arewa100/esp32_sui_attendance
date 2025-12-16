# Frontend Integration & Hardware Guide

## Overview

This guide provides comprehensive instructions for integrating the ESP32 Sui Attendance System smart contract with frontend applications and ESP32 hardware devices.

**SDK Version**: This guide uses the modern Sui TypeScript SDK (`@mysten/sui` v1.45.2+) and `@mysten/dapp-kit` (v0.19.11+). For the latest SDK documentation, see [https://sdk.mystenlabs.com/typescript](https://sdk.mystenlabs.com/typescript).

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
- Sui Wallet extension installed in browser
- Access to Sui RPC endpoint (testnet/mainnet)
- Published smart contract package ID

### Sui Wallet Integration

#### 1. Install Dependencies

```bash
npm install @mysten/sui @mysten/dapp-kit @tanstack/react-query
# or
yarn add @mysten/sui @mysten/dapp-kit @tanstack/react-query
```

**Note**: The modern Sui TypeScript SDK uses `@mysten/sui` (modular packages) instead of the legacy `@mysten/sui.js`. See [Sui TypeScript SDK Documentation](https://sdk.mystenlabs.com/typescript) for details.

#### 2. Setup Network Configuration

```typescript
// networkConfig.ts
import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
```

#### 3. Setup App with Sui Providers

```typescript
// main.tsx
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networkConfig } from "./networkConfig";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {/* Your app components */}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

#### 4. Connect Wallet in Components

```typescript
// Using @mysten/dapp-kit hooks
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

function MyComponent() {
  const account = useCurrentAccount();
  
  return (
    <div>
      {account ? (
        <div>
          <p>Connected: {account.address}</p>
          <ConnectButton />
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}
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
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { useSuiClient } from '@mysten/dapp-kit';

// Using hook in React component
function EventListener() {
  const client = useSuiClient();
  
  useEffect(() => {
    // Query events (for historical events)
    async function queryEvents() {
      const events = await client.queryEvents({
        query: {
          MoveModule: {
            package: CONFIG.PACKAGE_ID,
            module: 'events', // Your events module name
          },
        },
        limit: 50,
      });
      
      events.data.forEach((event) => {
        if (event.type.includes('OrganisationCreatedEvent')) {
          const parsed = parseOrganisationCreatedEvent(event);
          console.log('New organisation created:', parsed);
          // Update UI
        }
      });
    }
    
    queryEvents();
    
    // Poll for new events (or use websocket subscription if available)
    const interval = setInterval(queryEvents, 5000);
    return () => clearInterval(interval);
  }, [client]);
}

// Parse event data
function parseOrganisationCreatedEvent(event: any) {
  return {
    organisation: event.parsedJson?.organisation,
    name: event.parsedJson?.name,
    owner: event.parsedJson?.owner,
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

**Important**: The modern SDK uses `Transaction` from `@mysten/sui/transactions` (not `TransactionBlock`). See [Sui TypeScript SDK Documentation](https://sdk.mystenlabs.com/typescript) for the latest API.

#### 1. Create Organisation

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

function CreateOrganisationComponent() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  async function createOrganisation(name: string) {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::attendance_system::create_organisation`,
      arguments: [
        tx.object(CONFIG.SYSTEM_OBJECT_ID),
        tx.pure.string(name),
      ],
    });
    
    // Execute transaction
    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Transaction successful:', result.digest);
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
        },
      }
    );
  }
  
  return <button onClick={() => createOrganisation('My Org')}>Create Organisation</button>;
}
```

#### 2. Register Student

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

function RegisterStudentComponent() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  async function registerStudent(
    orgObjectId: string,
    name: string,
    cardId: string,
    department: string
  ) {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::attendance_system::register_student`,
      arguments: [
        tx.object(orgObjectId),
        tx.pure.string(name),
        tx.pure.string(cardId),
        tx.pure.string(department),
      ],
    });
    
    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Student registered:', result.digest);
        },
      }
    );
  }
  
  // Usage in component...
}
```

#### 3. Pay Subscription

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

function PaySubscriptionComponent() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  async function paySubscription(
    orgObjectId: string,
    paymentAmount: bigint // in MIST (10 SUI = 10_000_000_000n)
  ) {
    const tx = new Transaction();
    
    // Split coin for payment
    const [payment] = tx.splitCoins(tx.gas, [paymentAmount]);
    
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::attendance_system::pay_subscription`,
      arguments: [
        tx.object(CONFIG.SYSTEM_OBJECT_ID),
        tx.object(orgObjectId),
        payment,
        tx.object(CONFIG.CLOCK_OBJECT_ID), // Shared Clock object (0x6)
      ],
    });
    
    // Set gas budget
    tx.setGasBudget(100_000_000);
    
    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Subscription paid:', result.digest);
        },
      }
    );
  }
  
  // Usage: paySubscription(orgId, 10_000_000_000n) // 10 SUI
}
```

#### 4. Record Attendance

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

function RecordAttendanceComponent() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  async function recordAttendance(
    orgObjectId: string,
    studentAddress: string
  ) {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::attendance_system::record_attendance`,
      arguments: [
        tx.object(orgObjectId),
        tx.pure.address(studentAddress),
        tx.object(CONFIG.CLOCK_OBJECT_ID), // Shared Clock object (0x6)
      ],
    });
    
    tx.setGasBudget(100_000_000);
    
    signAndExecute(
      {
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      },
      {
        onSuccess: (result) => {
          console.log('Attendance recorded:', result.digest);
        },
      }
    );
  }
  
  // Usage in component...
}
```

### Query Functions

Since Move doesn't support view functions directly, use the Sui RPC to query object data.

#### Get Organisation Data

```typescript
import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';

function useOrganisationData(orgObjectId: string) {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['organisation', orgObjectId],
    queryFn: async () => {
      const object = await client.getObject({
        id: orgObjectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });
      
      return object.data;
    },
  });
}

// Usage in component
function OrganisationComponent({ orgId }: { orgId: string }) {
  const { data: org, isLoading } = useOrganisationData(orgId);
  
  if (isLoading) return <div>Loading...</div>;
  
  const fields = (org?.content as any)?.fields;
  return <div>Name: {fields?.name}</div>;
}
```

#### Get Student by Card ID

```typescript
import { useSuiClient } from '@mysten/dapp-kit';

async function getStudentByCardId(
  client: SuiClient,
  orgObjectId: string,
  cardId: string
) {
  // Query events to find student with matching card_id
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent`,
    },
    limit: 100,
  });
  
  // Find student with matching card_id and organisation
  const studentEvent = events.data.find(
    (e) => 
      e.parsedJson?.card_id === cardId && 
      e.parsedJson?.organisation === orgObjectId
  );
  
  return studentEvent?.parsedJson?.student || null;
}

// React hook version
function useStudentByCardId(orgObjectId: string, cardId: string) {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['student', orgObjectId, cardId],
    queryFn: () => getStudentByCardId(client, orgObjectId, cardId),
    enabled: !!orgObjectId && !!cardId,
  });
}
```

#### Get Subscription Status

```typescript
import { useSuiClient } from '@mysten/dapp-kit';

async function getSubscriptionStatus(
  client: SuiClient,
  orgObjectId: string
) {
  const org = await client.getObject({
    id: orgObjectId,
    options: {
      showContent: true,
    },
  });
  
  if (!org.data?.content || !('fields' in org.data.content)) {
    return {
      isActive: false,
      expiryTimestamp: 0,
      paymentAmount: 0,
    };
  }
  
  const fields = (org.data.content as any).fields;
  const subscription = fields?.subscription;
  
  if (!subscription || !('fields' in subscription)) {
    return {
      isActive: false,
      expiryTimestamp: 0,
      paymentAmount: 0,
    };
  }
  
  const currentTime = Date.now();
  const expiryTimestamp = Number(subscription.fields.expiry_timestamp);
  const isActive = 
    expiryTimestamp > currentTime && 
    subscription.fields.is_active === true;
  
  return {
    isActive,
    expiryTimestamp,
    paymentAmount: Number(subscription.fields.payment_amount),
  };
}

// React hook version
function useSubscriptionStatus(orgObjectId: string) {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['subscription', orgObjectId],
    queryFn: () => getSubscriptionStatus(client, orgObjectId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
```

#### Get Attendance Records

```typescript
import { useSuiClient } from '@mysten/dapp-kit';

async function getAttendanceRecords(
  client: SuiClient,
  orgObjectId: string,
  studentAddress: string
) {
  // Query events for attendance records
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
    limit: 100,
    order: 'descending', // Most recent first
  });
  
  return events.data.map((e) => ({
    record: e.parsedJson?.record,
    timestamp: Number(e.parsedJson?.timestamp || 0),
    student: e.parsedJson?.student,
    organisation: e.parsedJson?.organisation,
  }));
}

// React hook version
function useAttendanceRecords(orgObjectId: string, studentAddress: string) {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['attendance', orgObjectId, studentAddress],
    queryFn: () => getAttendanceRecords(client, orgObjectId, studentAddress),
    enabled: !!orgObjectId && !!studentAddress,
  });
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

### Backend Sui Client Service

```typescript
// suiClient.ts - Backend service for Sui interactions
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Transaction } from "@mysten/sui/transactions";

class SuiService {
  public client: SuiClient;
  public keypair: Ed25519Keypair;
  public address: string;

  constructor() {
    // Initialize client with network
    this.client = new SuiClient({ 
      url: getFullnodeUrl(process.env.SUI_NETWORK || "testnet") 
    });

    // Decode and load server private key
    const parsed = decodeSuiPrivateKey(process.env.SERVER_PRIVATE_KEY!);
    this.keypair = Ed25519Keypair.fromSecretKey(parsed.secretKey);
    this.address = this.keypair.getPublicKey().toSuiAddress();
  }

  async executeTransaction(tx: Transaction) {
    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    if (result.effects?.status?.status !== "success") {
      throw new Error(
        `Transaction failed: ${result.effects?.status?.error || "Unknown error"}`
      );
    }

    return result;
  }

  async getObject(objectId: string) {
    return await this.client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });
  }

  async queryEvents(query: any, limit = 50) {
    return await this.client.queryEvents({
      query,
      limit,
    });
  }
}

export const suiService = new SuiService();
```

### Backend API Endpoint

```typescript
// attendanceService.ts - Business logic for attendance
import { Transaction } from "@mysten/sui/transactions";
import { suiService } from "./suiClient";

const CONFIG = {
  PACKAGE_ID: process.env.PACKAGE_ID!,
  CLOCK_OBJECT_ID: "0x6", // Shared Clock object
};

// Get student address by card ID from events
async function getStudentByCardId(
  orgObjectId: string,
  cardId: string
): Promise<string | null> {
  const events = await suiService.queryEvents({
    query: {
      MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent`,
    },
    limit: 100,
  });

  const studentEvent = events.data.find(
    (e) =>
      e.parsedJson?.card_id === cardId &&
      e.parsedJson?.organisation === orgObjectId
  );

  return studentEvent?.parsedJson?.student || null;
}

// Check subscription status
async function checkSubscriptionActive(orgObjectId: string): Promise<boolean> {
  const org = await suiService.getObject(orgObjectId);
  const fields = (org.data?.content as any)?.fields;
  const subscription = fields?.subscription;

  if (!subscription || !("fields" in subscription)) {
    return false;
  }

  const currentTime = Date.now();
  const expiryTimestamp = Number(subscription.fields.expiry_timestamp);
  return (
    expiryTimestamp > currentTime && subscription.fields.is_active === true
  );
}

// Record attendance on-chain
async function recordAttendance(
  orgObjectId: string,
  studentAddress: string
): Promise<string> {
  const tx = new Transaction();

  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::attendance_system::record_attendance`,
    arguments: [
      tx.object(orgObjectId),
      tx.pure.address(studentAddress),
      tx.object(CONFIG.CLOCK_OBJECT_ID),
    ],
  });

  tx.setGasBudget(100_000_000);

  const result = await suiService.executeTransaction(tx);
  return result.digest;
}

// Express.js API endpoint
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/attendance", async (req, res) => {
  try {
    const { device_id, card_id, org_object_id } = req.body;

    // Validate input
    if (!device_id || !card_id || !org_object_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get student address from card ID
    const studentAddress = await getStudentByCardId(org_object_id, card_id);
    if (!studentAddress) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check subscription
    const isActive = await checkSubscriptionActive(org_object_id);
    if (!isActive) {
      return res.status(403).json({ error: "Subscription expired" });
    }

    // Record attendance
    const txDigest = await recordAttendance(org_object_id, studentAddress);

    res.json({
      success: true,
      transaction: txDigest,
      student: studentAddress,
    });
  } catch (error: any) {
    console.error("Error recording attendance:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
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

- [Sui TypeScript SDK Documentation](https://sdk.mystenlabs.com/typescript) - Official SDK documentation
- [Sui dApp Kit Documentation](https://sdk.mystenlabs.com/dapp-kit) - React hooks and components for Sui
- [Sui Explorer](https://suiexplorer.com/) - Explore transactions and objects
- [Sui Developer Portal](https://docs.sui.io/) - Complete Sui documentation
- [ESP32 Arduino Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/) - Hardware integration

## SDK Migration Notes

If you're migrating from the legacy `@mysten/sui.js` SDK:

1. **Package Name**: `@mysten/sui.js` → `@mysten/sui`
2. **Transaction Class**: `TransactionBlock` → `Transaction`
3. **Client Import**: `@mysten/sui.js/client` → `@mysten/sui/client`
4. **Wallet Integration**: Use `@mysten/dapp-kit` instead of `@mysten/wallet-standard`
5. **Transaction Building**: 
   - `tx.pure(value)` → `tx.pure.string(value)` or `tx.pure.address(value)`
   - `tx.splitCoins()` syntax remains similar
6. **Execution**: Use `useSignAndExecuteTransaction` hook from dapp-kit

For complete migration guide, see the [Sui TypeScript SDK Documentation](https://sdk.mystenlabs.com/typescript).

---

**Note**: This guide uses the modern Sui TypeScript SDK (`@mysten/sui`). The code examples are based on the latest SDK patterns and best practices. Adapt the examples to your specific technology stack and requirements.

