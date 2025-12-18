# Frontend Update Summary - ESP32 Sui Attendance System

## Updates Completed

### 1. **Environment Variables** (`frontend/app/.env`)

Required environment variables:
- `VITE_PACKAGE_ID`: Smart contract package ID (from deployment)
- `VITE_SYSTEM_OBJECT_ID`: AttendanceSystem shared object ID (from deployment)

### 2. **Config Module** (`frontend/app/src/config.ts`)

- Uses `VITE_PACKAGE_ID` and `VITE_SYSTEM_OBJECT_ID` from environment
- `CLOCK_OBJECT_ID` hardcoded to `0x6` (Sui standard clock)
- `contractTarget()` helper builds Move call targets

### 3. **Transaction Builders** (`frontend/app/src/services/transactions.ts`)

- `buildCreateOrganisationTx()`: Creates organization with system object reference
- `buildRegisterStudentTx()`: Registers student to organization
- `buildPaySubscriptionTx()`: Pays subscription with SUI coin split from gas

### 4. **Hooks** (`frontend/app/src/hooks/`)

- `use-attendance-objects.ts`: Fetches organization and student objects
- `use-subscription-status.ts`: Tracks subscription status with time remaining
- `use-attendance-events.ts`: Listens to attendance events
- `use-dashboard-stats.ts`: Aggregates dashboard statistics

### 5. **Pages** (`frontend/app/src/pages/`)

- `CreateOrganisationPage.tsx`: Organization creation form
- `RegisterStudentPage.tsx`: Student registration with card ID
- `OrganisationDashboardPage.tsx`: Main dashboard with attendance tracking
- `SubscriptionPage.tsx`: Subscription payment and status
- `MyOrganisationsPage.tsx`: Lists user's organizations

### 6. **Network Configuration** (`frontend/app/src/networkConfig.ts`)

- Supports devnet, testnet, and mainnet
- Uses `@mysten/dapp-kit` for network switching

## Required Actions

### Update Your `.env` File

Create or update `frontend/app/.env` with deployment values:

```env
# Smart Contract Configuration
VITE_PACKAGE_ID=0x<your_package_id_from_deployment>
VITE_SYSTEM_OBJECT_ID=0x<your_system_object_id_from_deployment>
```

### After Deployment

1. Copy the Package ID from deployment output
2. Find the `AttendanceSystem` object ID in created objects
3. Update `.env` with these values
4. Restart the frontend dev server

## Component Analysis

### Components Using Blockchain Directly:

| Component | Function |
|-----------|----------|
| `CreateOrganisationPage` | Calls `create_organisation` |
| `RegisterStudentPage` | Calls `register_student` |
| `SubscriptionPage` | Calls `pay_subscription` |
| `OrganisationDashboardPage` | Queries organization/students |

### Hooks Using Blockchain:

| Hook | Purpose |
|------|---------|
| `useOrganisationObject` | Fetches single organization |
| `useStudentsByIds` | Fetches multiple students |
| `useSubscriptionStatus` | Checks subscription expiry |
| `useAttendanceEvents` | Queries attendance events |

## Verification Checklist

- [ ] Package ID configured in `.env`
- [ ] System Object ID configured in `.env`
- [ ] Frontend can create organizations
- [ ] Frontend can register students
- [ ] Frontend can pay subscriptions
- [ ] Subscription status displays correctly
- [ ] Student list populates correctly

## Integration with Backend Server

The frontend works with the backend server for:
- **ESP32 attendance recording**: Device sends card ID to server
- **Server calls blockchain**: Records attendance on-chain
- **Frontend displays results**: Queries events and objects

### Server Communication Flow

```
ESP32 Device → POST /api/attendance → Backend Server → Sui Blockchain
                                                    ↓
Frontend Dashboard ← Query Events/Objects ← Sui RPC
```

## Notes

- Clock object (`0x6`) is a shared object always available on Sui
- Subscription status is calculated client-side from expiry timestamp
- Events are the primary way to track attendance history
- Organization owner is checked for student registration authorization

