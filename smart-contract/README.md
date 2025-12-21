# ESP32 Sui Attendance System - Smart Contract

A decentralized attendance tracking system built on Sui blockchain, designed for educational institutions to manage student attendance using RFID card technology and ESP32 hardware.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contract Structure](#smart-contract-structure)
- [Installation & Setup](#installation--setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Events](#events)
- [Access Control](#access-control)
- [Subscription Model](#subscription-model)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

## Overview

The ESP32 Sui Attendance System is a blockchain-based solution that enables educational institutions to:
- Create and manage organizations
- Register students with unique RFID card IDs
- Record attendance with tamper-proof timestamps
- Enforce subscription-based access control
- Maintain immutable attendance records on-chain

The system uses Sui's Move language for smart contract development, ensuring type safety, resource management, and secure execution.

## Features

### Core Functionality
- **Organization Management**: Create and manage attendance organizations
- **Student Registration**: Register students with unique card IDs and department information
- **Attendance Recording**: Record attendance with on-chain timestamps (prevents manipulation)
- **Subscription System**: Pay-per-use model requiring 10 SUI for 30 days of service
- **Access Control**: Role-based permissions (organization owners, system owner)
- **Event Emission**: Comprehensive event system for frontend integration

### Technical Features
- **Modular Architecture**: Clean separation of concerns across multiple modules
- **Type Safety**: Leverages Move's type system for compile-time guarantees
- **Resource Management**: Proper handling of Sui objects and resources
- **Test Coverage**: Comprehensive unit tests for all functionality
- **On-Chain Clock**: Uses Sui's Clock object for tamper-proof timestamps

## Architecture

### Module Structure

The smart contract is organized into the following modules:

```
attendance_system/
├── attendance_system.move    # Main orchestration module
├── types.move                # Centralized type definitions
├── constants.move            # Constants and error codes
├── events.move               # Event definitions and emitters
├── organisation.move         # Organization management logic
├── student.move              # Student registration and management
├── attendance.move           # Attendance recording logic
└── subscription.move         # Subscription payment and validation
```

### Data Flow

```
User → Frontend → Sui Wallet → Smart Contract → On-Chain Storage
                                              ↓
                                         Event Emission
                                              ↓
                                         Frontend Listener
```

### Key Components

1. **AttendanceSystem**: Main system object tracking all organizations
2. **AttendanceOrganisation**: Organization-specific data and students
3. **Student**: Individual student records with card IDs
4. **AttendanceRecord**: Immutable attendance entries with timestamps
5. **Subscription**: Subscription status and expiry information
6. **AdminCap**: Administrative capability (currently unused, reserved for future features)

## Smart Contract Structure

### Main Module: `attendance_system.move`

The main orchestration module that provides high-level entry points:

```move
module attendance_system::attendance_system {
    // Initialization
    fun init(ctx: &mut TxContext)
    
    // Organization Management
    public fun create_organisation(...)
    public fun get_number_of_organisation_created(...)
    public fun get_org_owner(...)
    
    // Student Management
    public fun register_student(...)
    public fun get_number_student_created(...)
    public fun get_student_by_card_id(...)
    public fun is_student_registered(...)
    
    // Attendance Recording
    public fun record_attendance(...)
    public fun get_attendance_records_for_student(...)
    public fun get_number_attendance_records(...)
    
    // Subscription Management
    public entry fun pay_subscription(...)
    public fun check_subscription_active(...)
    public fun get_subscription_status(...)
}
```

### Supporting Modules

- **types.move**: Defines all structs and provides getter/setter functions
- **constants.move**: Centralizes subscription fees, durations, and error codes
- **events.move**: Defines events and provides emission helpers
- **organisation.move**: Handles organization creation and management
- **student.move**: Manages student registration and lookups
- **attendance.move**: Records attendance with subscription validation
- **subscription.move**: Handles subscription payments and status checks

## Installation & Setup

### Prerequisites

- [Sui CLI](https://docs.sui.io/build/install) (latest version)
- Rust and Cargo (for Move toolchain)
- Git

### Setup Steps

1. **Clone the repository** (if not already done):
```bash
git clone <repository-url>
cd esp32_sui_attendance/smart-contract/attendance_system
```

2. **Verify Sui installation**:
```bash
sui --version
```

3. **Build the smart contract**:
```bash
sui move build
```

4. **Run tests**:
```bash
sui move test
```

### Project Structure

```
attendance_system/
├── Move.toml              # Package configuration
├── Move.lock              # Dependency lock file
├── sources/               # Move source files
│   ├── attendance_system.move
│   ├── types.move
│   ├── constants.move
│   ├── events.move
│   ├── organisation.move
│   ├── student.move
│   ├── attendance.move
│   └── subscription.move
└── tests/                 # Unit tests
    └── attendance_system_tests.move
```

## Testing

### Running Tests

Run all tests:
```bash
sui move test
```

Run specific test:
```bash
sui move test --filter test_to_register_to_create_organisation
```

### Test Coverage

The test suite includes:

1. **test_to_register_to_create_organisation**: Verifies organization creation
2. **test_to_register_student**: Tests student registration
3. **test_to_register_student_and_record_attendance**: End-to-end attendance flow
4. **test_subscription_payment**: Validates subscription payment and status
5. **test_attendance_without_subscription**: Ensures subscription requirement is enforced
6. **test_subscription_payment_insufficient**: Validates minimum payment requirement

See [TEST_COVERAGE.md](./TEST_COVERAGE.md) for detailed coverage information.

## Deployment

### Local Development

1. **Start local Sui network**:
```bash
sui-test-validator
```

2. **In another terminal, deploy**:
```bash
sui client publish --gas-budget 100000000
```

3. **Note the published package ID** from the output

### Testnet Deployment

1. **Set active environment to testnet**:
```bash
sui client switch --env testnet
```

2. **Get testnet SUI** (if needed):
```bash
sui client faucet
```

3. **Deploy to testnet**:
```bash
sui client publish --gas-budget 100000000
```

### Mainnet Deployment

⚠️ **Warning**: Only deploy to mainnet after thorough testing and security audits.

1. **Set active environment to mainnet**:
```bash
sui client switch --env mainnet
```

2. **Deploy**:
```bash
sui client publish --gas-budget 100000000
```

### Post-Deployment

After deployment, you'll receive:
- **Package ID**: Unique identifier for your package
- **Published Modules**: List of module IDs
- **Upgrade Capability**: Object ID for future upgrades

Save these IDs for frontend integration.

## Usage Guide

### 1. Initialize the System

The system is automatically initialized on deployment. The deployer receives:
- `AttendanceSystem` object
- `AdminCap` object (for future administrative functions)

### 2. Create an Organization

```move
let response = attendance_system::create_organisation(
    &mut system,
    b"University of Sui".to_string(),
    ctx
);
```

**Access Control**: Anyone can create an organization (public function)

**Result**: 
- New `AttendanceOrganisation` object transferred to creator
- `OrganisationCreatedEvent` emitted

### 3. Register Students

```move
let response = attendance_system::register_student(
    &mut org,
    b"John Doe".to_string(),
    b"RFID123456".to_string(),
    b"Computer Science".to_string(),
    ctx
);
```

**Access Control**: Only organization owner can register students

**Requirements**:
- Unique card ID (duplicate check enforced)
- Valid name and department

**Result**:
- New `Student` object transferred to organization owner
- `StudentRegisteredEvent` emitted

### 4. Pay Subscription

```move
attendance_system::pay_subscription(
    &system,
    &mut org,
    payment_coin,
    &clock,
    ctx
);
```

**Requirements**:
- Minimum payment: 10 SUI (10,000,000,000 MIST)
- Valid `Clock` object reference

**Result**:
- Subscription extended by 30 days from current time (or expiry if still active)
- Payment transferred to system owner
- `SubscriptionRenewedEvent` emitted

### 5. Record Attendance

```move
let response = attendance_system::record_attendance(
    &mut org,
    student_address,
    &clock,
    ctx
);
```

**Requirements**:
- Active subscription (checked via on-chain clock)
- Valid student address (must be registered in organization)
- Valid `Clock` object reference

**Result**:
- New `AttendanceRecord` object created with on-chain timestamp
- Record transferred to organization owner
- `AttendanceRecordedEvent` emitted

### Query Functions

```move
// Get subscription status
let (is_active, expiry, payment) = attendance_system::get_subscription_status(&org, &clock);

// Check if subscription is active
let active = attendance_system::check_subscription_active(&org, &clock);

// Get student by card ID
let student_opt = attendance_system::get_student_by_card_id(&org, card_id);

// Get attendance records for student
let records = attendance_system::get_attendance_records_for_student(&org, student_addr);

// Get number of attendance records
let count = attendance_system::get_number_attendance_records(&org, student_addr);
```

## Events

The contract emits the following events for frontend integration:

### OrganisationCreatedEvent
```move
struct OrganisationCreatedEvent {
    organisation: address,
    name: String,
    owner: address,
}
```

### StudentRegisteredEvent
```move
struct StudentRegisteredEvent {
    student: address,
    name: String,
    department: String,
    card_id: String,
    organisation: address,
}
```

### AttendanceRecordedEvent
```move
struct AttendanceRecordedEvent {
    record: address,
    student: address,
    timestamp: u64,
    organisation: address,
}
```

### SubscriptionRenewedEvent
```move
struct SubscriptionRenewedEvent {
    organisation: address,
    expiry_timestamp: u64,
    payment_amount: u64,
}
```

### Event Listening

Frontend applications should listen to these events to update UI in real-time. See the [Frontend Integration Guide](../frontend/README.md) for implementation details.

## Access Control

### Public Functions (Anyone can call)
- `create_organisation`: Anyone can create an organization
- `pay_subscription`: Anyone can pay subscription for any organization
- `get_*` query functions: Public read access

### Restricted Functions
- `register_student`: Only organization owner
- `record_attendance`: Requires active subscription (anyone with org object can call, but subscription must be active)

### System Owner
- Receives subscription payments
- Currently no additional privileges (AdminCap reserved for future features)

### Subscription Requirement

**Critical**: Before accessing attendance recording features, organizations must:
1. Pay subscription fee (10 SUI)
2. Maintain active subscription status

Attendance recording will fail if subscription is expired or inactive.

## Subscription Model

### Pricing
- **Fee**: 10 SUI per subscription period
- **Duration**: 30 days (2,592,000,000 milliseconds)
- **Payment**: Transferred to system owner

### Subscription Logic
- **First Payment**: Starts 30-day period from current time
- **Renewal Before Expiry**: Extends from current expiry date
- **Renewal After Expiry**: Starts new 30-day period from current time
- **Minimum Payment**: 10 SUI (transaction fails if less)

### Subscription Status
- Checked on every attendance recording
- Uses on-chain `Clock` object for accurate timestamp comparison
- Cannot be manipulated by users

## Security Considerations

### Implemented Security Features

1. **On-Chain Clock**: Prevents timestamp manipulation
2. **Access Control**: Role-based permissions
3. **Duplicate Prevention**: Card ID uniqueness enforced
4. **Subscription Enforcement**: Hard requirement for attendance recording
5. **Type Safety**: Move's type system prevents common vulnerabilities
6. **Resource Safety**: Sui's ownership model prevents double-spending

### Best Practices

- Always validate subscription status before recording attendance
- Use on-chain Clock object (never trust client timestamps)
- Verify student registration before recording attendance
- Monitor events for real-time updates
- Implement proper error handling in frontend

### Known Limitations

- No rate limiting on organization creation
- No maximum limit on students per organization
- AdminCap currently unused (reserved for future features)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure all tests pass: `sui move test`
6. Submit a pull request

### Code Style

- Follow Move naming conventions
- Add comments for public functions
- Keep modules focused and cohesive
- Maintain test coverage

## License

See [LICENSE](../../LICENSE) file for details.

## Related Documentation

- [Test Coverage](./TEST_COVERAGE.md)
- [Frontend Integration Guide](../frontend/README.md)
- [Hardware Integration Guide](../../firmware/README.md)
- [Sui Move Documentation](https://docs.sui.io/build/move)
- [Sui Developer Portal](https://docs.sui.io/)

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review Sui Move documentation

---

**Built with Sui Move**






A decentralized attendance tracking system built on Sui blockchain, designed for educational institutions to manage student attendance using RFID card technology and ESP32 hardware.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contract Structure](#smart-contract-structure)
- [Installation & Setup](#installation--setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Events](#events)
- [Access Control](#access-control)
- [Subscription Model](#subscription-model)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

## Overview

The ESP32 Sui Attendance System is a blockchain-based solution that enables educational institutions to:
- Create and manage organizations
- Register students with unique RFID card IDs
- Record attendance with tamper-proof timestamps
- Enforce subscription-based access control
- Maintain immutable attendance records on-chain

The system uses Sui's Move language for smart contract development, ensuring type safety, resource management, and secure execution.

## Features

### Core Functionality
- **Organization Management**: Create and manage attendance organizations
- **Student Registration**: Register students with unique card IDs and department information
- **Attendance Recording**: Record attendance with on-chain timestamps (prevents manipulation)
- **Subscription System**: Pay-per-use model requiring 10 SUI for 30 days of service
- **Access Control**: Role-based permissions (organization owners, system owner)
- **Event Emission**: Comprehensive event system for frontend integration

### Technical Features
- **Modular Architecture**: Clean separation of concerns across multiple modules
- **Type Safety**: Leverages Move's type system for compile-time guarantees
- **Resource Management**: Proper handling of Sui objects and resources
- **Test Coverage**: Comprehensive unit tests for all functionality
- **On-Chain Clock**: Uses Sui's Clock object for tamper-proof timestamps

## Architecture

### Module Structure

The smart contract is organized into the following modules:

```
attendance_system/
├── attendance_system.move    # Main orchestration module
├── types.move                # Centralized type definitions
├── constants.move            # Constants and error codes
├── events.move               # Event definitions and emitters
├── organisation.move         # Organization management logic
├── student.move              # Student registration and management
├── attendance.move           # Attendance recording logic
└── subscription.move         # Subscription payment and validation
```

### Data Flow

```
User → Frontend → Sui Wallet → Smart Contract → On-Chain Storage
                                              ↓
                                         Event Emission
                                              ↓
                                         Frontend Listener
```

### Key Components

1. **AttendanceSystem**: Main system object tracking all organizations
2. **AttendanceOrganisation**: Organization-specific data and students
3. **Student**: Individual student records with card IDs
4. **AttendanceRecord**: Immutable attendance entries with timestamps
5. **Subscription**: Subscription status and expiry information
6. **AdminCap**: Administrative capability (currently unused, reserved for future features)

## Smart Contract Structure

### Main Module: `attendance_system.move`

The main orchestration module that provides high-level entry points:

```move
module attendance_system::attendance_system {
    // Initialization
    fun init(ctx: &mut TxContext)
    
    // Organization Management
    public fun create_organisation(...)
    public fun get_number_of_organisation_created(...)
    public fun get_org_owner(...)
    
    // Student Management
    public fun register_student(...)
    public fun get_number_student_created(...)
    public fun get_student_by_card_id(...)
    public fun is_student_registered(...)
    
    // Attendance Recording
    public fun record_attendance(...)
    public fun get_attendance_records_for_student(...)
    public fun get_number_attendance_records(...)
    
    // Subscription Management
    public entry fun pay_subscription(...)
    public fun check_subscription_active(...)
    public fun get_subscription_status(...)
}
```

### Supporting Modules

- **types.move**: Defines all structs and provides getter/setter functions
- **constants.move**: Centralizes subscription fees, durations, and error codes
- **events.move**: Defines events and provides emission helpers
- **organisation.move**: Handles organization creation and management
- **student.move**: Manages student registration and lookups
- **attendance.move**: Records attendance with subscription validation
- **subscription.move**: Handles subscription payments and status checks

## Installation & Setup

### Prerequisites

- [Sui CLI](https://docs.sui.io/build/install) (latest version)
- Rust and Cargo (for Move toolchain)
- Git

### Setup Steps

1. **Clone the repository** (if not already done):
```bash
git clone <repository-url>
cd esp32_sui_attendance/smart-contract/attendance_system
```

2. **Verify Sui installation**:
```bash
sui --version
```

3. **Build the smart contract**:
```bash
sui move build
```

4. **Run tests**:
```bash
sui move test
```

### Project Structure

```
attendance_system/
├── Move.toml              # Package configuration
├── Move.lock              # Dependency lock file
├── sources/               # Move source files
│   ├── attendance_system.move
│   ├── types.move
│   ├── constants.move
│   ├── events.move
│   ├── organisation.move
│   ├── student.move
│   ├── attendance.move
│   └── subscription.move
└── tests/                 # Unit tests
    └── attendance_system_tests.move
```

## Testing

### Running Tests

Run all tests:
```bash
sui move test
```

Run specific test:
```bash
sui move test --filter test_to_register_to_create_organisation
```

### Test Coverage

The test suite includes:

1. **test_to_register_to_create_organisation**: Verifies organization creation
2. **test_to_register_student**: Tests student registration
3. **test_to_register_student_and_record_attendance**: End-to-end attendance flow
4. **test_subscription_payment**: Validates subscription payment and status
5. **test_attendance_without_subscription**: Ensures subscription requirement is enforced
6. **test_subscription_payment_insufficient**: Validates minimum payment requirement

See [TEST_COVERAGE.md](./TEST_COVERAGE.md) for detailed coverage information.

## Deployment

### Local Development

1. **Start local Sui network**:
```bash
sui-test-validator
```

2. **In another terminal, deploy**:
```bash
sui client publish --gas-budget 100000000
```

3. **Note the published package ID** from the output

### Testnet Deployment

1. **Set active environment to testnet**:
```bash
sui client switch --env testnet
```

2. **Get testnet SUI** (if needed):
```bash
sui client faucet
```

3. **Deploy to testnet**:
```bash
sui client publish --gas-budget 100000000
```

### Mainnet Deployment

⚠️ **Warning**: Only deploy to mainnet after thorough testing and security audits.

1. **Set active environment to mainnet**:
```bash
sui client switch --env mainnet
```

2. **Deploy**:
```bash
sui client publish --gas-budget 100000000
```

### Post-Deployment

After deployment, you'll receive:
- **Package ID**: Unique identifier for your package
- **Published Modules**: List of module IDs
- **Upgrade Capability**: Object ID for future upgrades

Save these IDs for frontend integration.

## Usage Guide

### 1. Initialize the System

The system is automatically initialized on deployment. The deployer receives:
- `AttendanceSystem` object
- `AdminCap` object (for future administrative functions)

### 2. Create an Organization

```move
let response = attendance_system::create_organisation(
    &mut system,
    b"University of Sui".to_string(),
    ctx
);
```

**Access Control**: Anyone can create an organization (public function)

**Result**: 
- New `AttendanceOrganisation` object transferred to creator
- `OrganisationCreatedEvent` emitted

### 3. Register Students

```move
let response = attendance_system::register_student(
    &mut org,
    b"John Doe".to_string(),
    b"RFID123456".to_string(),
    b"Computer Science".to_string(),
    ctx
);
```

**Access Control**: Only organization owner can register students

**Requirements**:
- Unique card ID (duplicate check enforced)
- Valid name and department

**Result**:
- New `Student` object transferred to organization owner
- `StudentRegisteredEvent` emitted

### 4. Pay Subscription

```move
attendance_system::pay_subscription(
    &system,
    &mut org,
    payment_coin,
    &clock,
    ctx
);
```

**Requirements**:
- Minimum payment: 10 SUI (10,000,000,000 MIST)
- Valid `Clock` object reference

**Result**:
- Subscription extended by 30 days from current time (or expiry if still active)
- Payment transferred to system owner
- `SubscriptionRenewedEvent` emitted

### 5. Record Attendance

```move
let response = attendance_system::record_attendance(
    &mut org,
    student_address,
    &clock,
    ctx
);
```

**Requirements**:
- Active subscription (checked via on-chain clock)
- Valid student address (must be registered in organization)
- Valid `Clock` object reference

**Result**:
- New `AttendanceRecord` object created with on-chain timestamp
- Record transferred to organization owner
- `AttendanceRecordedEvent` emitted

### Query Functions

```move
// Get subscription status
let (is_active, expiry, payment) = attendance_system::get_subscription_status(&org, &clock);

// Check if subscription is active
let active = attendance_system::check_subscription_active(&org, &clock);

// Get student by card ID
let student_opt = attendance_system::get_student_by_card_id(&org, card_id);

// Get attendance records for student
let records = attendance_system::get_attendance_records_for_student(&org, student_addr);

// Get number of attendance records
let count = attendance_system::get_number_attendance_records(&org, student_addr);
```

## Events

The contract emits the following events for frontend integration:

### OrganisationCreatedEvent
```move
struct OrganisationCreatedEvent {
    organisation: address,
    name: String,
    owner: address,
}
```

### StudentRegisteredEvent
```move
struct StudentRegisteredEvent {
    student: address,
    name: String,
    department: String,
    card_id: String,
    organisation: address,
}
```

### AttendanceRecordedEvent
```move
struct AttendanceRecordedEvent {
    record: address,
    student: address,
    timestamp: u64,
    organisation: address,
}
```

### SubscriptionRenewedEvent
```move
struct SubscriptionRenewedEvent {
    organisation: address,
    expiry_timestamp: u64,
    payment_amount: u64,
}
```

### Event Listening

Frontend applications should listen to these events to update UI in real-time. See the [Frontend Integration Guide](../frontend/README.md) for implementation details.

## Access Control

### Public Functions (Anyone can call)
- `create_organisation`: Anyone can create an organization
- `pay_subscription`: Anyone can pay subscription for any organization
- `get_*` query functions: Public read access

### Restricted Functions
- `register_student`: Only organization owner
- `record_attendance`: Requires active subscription (anyone with org object can call, but subscription must be active)

### System Owner
- Receives subscription payments
- Currently no additional privileges (AdminCap reserved for future features)

### Subscription Requirement

**Critical**: Before accessing attendance recording features, organizations must:
1. Pay subscription fee (10 SUI)
2. Maintain active subscription status

Attendance recording will fail if subscription is expired or inactive.

## Subscription Model

### Pricing
- **Fee**: 10 SUI per subscription period
- **Duration**: 30 days (2,592,000,000 milliseconds)
- **Payment**: Transferred to system owner

### Subscription Logic
- **First Payment**: Starts 30-day period from current time
- **Renewal Before Expiry**: Extends from current expiry date
- **Renewal After Expiry**: Starts new 30-day period from current time
- **Minimum Payment**: 10 SUI (transaction fails if less)

### Subscription Status
- Checked on every attendance recording
- Uses on-chain `Clock` object for accurate timestamp comparison
- Cannot be manipulated by users

## Security Considerations

### Implemented Security Features

1. **On-Chain Clock**: Prevents timestamp manipulation
2. **Access Control**: Role-based permissions
3. **Duplicate Prevention**: Card ID uniqueness enforced
4. **Subscription Enforcement**: Hard requirement for attendance recording
5. **Type Safety**: Move's type system prevents common vulnerabilities
6. **Resource Safety**: Sui's ownership model prevents double-spending

### Best Practices

- Always validate subscription status before recording attendance
- Use on-chain Clock object (never trust client timestamps)
- Verify student registration before recording attendance
- Monitor events for real-time updates
- Implement proper error handling in frontend

### Known Limitations

- No rate limiting on organization creation
- No maximum limit on students per organization
- AdminCap currently unused (reserved for future features)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure all tests pass: `sui move test`
6. Submit a pull request

### Code Style

- Follow Move naming conventions
- Add comments for public functions
- Keep modules focused and cohesive
- Maintain test coverage

## License

See [LICENSE](../../LICENSE) file for details.

## Related Documentation

- [Test Coverage](./TEST_COVERAGE.md)
- [Frontend Integration Guide](../frontend/README.md)
- [Hardware Integration Guide](../../firmware/README.md)
- [Sui Move Documentation](https://docs.sui.io/build/move)
- [Sui Developer Portal](https://docs.sui.io/)

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review Sui Move documentation

---

**Built with Sui Move**




