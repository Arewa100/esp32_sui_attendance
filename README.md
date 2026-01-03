# ESP32 Sui Attendance System

<div align="center">

![Sui Blockchain](https://img.shields.io/badge/Built%20on-Sui%20Blockchain-6fbcf0?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCAxMkwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDEyTDEwLjkxIDguMjZMMTIgMloiIGZpbGw9IiM2ZmJjZjAiLz4KPC9zdmc+)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Move](https://img.shields.io/badge/Move-00D4AA?style=for-the-badge)

**A decentralized attendance tracking system using ESP32 RFID readers and Sui blockchain**

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## Overview

The ESP32 Sui Attendance System is a complete blockchain-based solution for educational institutions to manage student attendance. It combines hardware (ESP32 + RFID readers), backend services, and a React frontend with Sui blockchain smart contracts to provide:

- **Immutable attendance records** stored on-chain
- **Real-time attendance tracking** via RFID card scanning
- **Multi-organisation support** with subscription-based access control
- **Tamper-proof timestamps** using Sui's on-chain Clock
- **One check-in per day** enforcement at the smart contract level

### Why Sui Blockchain?

- **High Performance**: Fast transaction finality and low latency
- **Low Costs**: Efficient gas model for frequent attendance recordings
- **Type Safety**: Move language ensures secure smart contract execution
- **Shared Objects**: Enables multi-user access patterns for organisations
- **On-Chain Clock**: Prevents timestamp manipulation

---

## Features

### Core Functionality

- ✅ **Organisation Management**: Create and manage multiple attendance organisations
- ✅ **Student Registration**: Register students with unique RFID card IDs
- ✅ **Device Management**: Register and track ESP32 devices with device IDs
- ✅ **Device Health Monitoring**: Real-time online/offline status via heartbeat tracking
- ✅ **Real-time Attendance**: Instant recording via ESP32 RFID readers (device ID auto-resolves organisation)
- ✅ **One Check-in Per Day**: Prevents duplicate daily check-ins (enforced on-chain)
- ✅ **Subscription System**: Pay-per-use model (10 SUI for 30 days)
- ✅ **Access Control**: Role-based permissions (organisation owners, system owner)
- ✅ **Event System**: Comprehensive blockchain events for frontend integration
- ✅ **Dashboard Analytics**: Real-time statistics and attendance history

### Technical Highlights

- **Blockchain Security**: All records immutably stored on Sui
- **Real-time Processing**: ESP32 → Server → Blockchain pipeline
- **Modern Frontend**: React + TypeScript + Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Wallet Integration**: Sui wallet connection via dapp-kit
- **Event-Driven Architecture**: Efficient data fetching via blockchain events

---

## Architecture

### System Components

```
┌─────────────────┐
│   ESP32 Device  │  Reads RFID card, sends HTTP POST
│  (RFID Reader)  │
└────────┬────────┘
         │
         │ HTTP POST /api/attendance
         │ { cardId, deviceId } (orgObjectId optional)
         │ + Heartbeat: POST /api/devices/:deviceId/heartbeat (hourly)
         ▼
┌─────────────────┐
│  Backend Server  │  Validates, maps cardId → student address,
│  (Node.js/TS)    │  checks subscription, records on-chain
└────────┬────────┘
         │
         │ Sui SDK Transaction
         │ record_attendance()
         ▼
┌─────────────────┐
│  Sui Blockchain │  Smart contract stores attendance record,
│  (Move Contract) │  emits events, manages subscriptions
└────────┬────────┘
         │
        │ Event Queries
        │ (StudentRegisteredEvent,
        │  AttendanceRecordedEvent,
        │  DeviceHeartbeatEvent)
        ▼
┌─────────────────┐
│  React Frontend  │  Displays dashboard, statistics,
│  (dapp-kit)     │  organisation management
└─────────────────┘
```

### Data Flow

1. **ESP32 Device** reads RFID card and extracts card ID
2. **Backend Server** receives attendance event via HTTP POST
3. **Server** queries blockchain events to map `cardId` → `studentAddress`
4. **Server** validates organisation subscription status
5. **Server** builds and signs Sui transaction to call `record_attendance()`
6. **Smart Contract** validates access, checks one-per-day rule, creates attendance record
7. **Smart Contract** emits `AttendanceRecordedEvent` on-chain
8. **Frontend** queries events to display real-time statistics and history

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Sui CLI** (for smart contract deployment)
- **Arduino IDE** (for ESP32 firmware)
- **Sui Wallet** browser extension
- **ESP32** development board + **MFRC522** RFID reader module

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arewa100/esp32_sui_attendance.git
   cd esp32_sui_attendance
   ```

2. **Deploy Smart Contract**
   ```bash
   cd smart-contract/attendance_system
   sui move build
   sui move test
   sui client publish --gas-budget 100000000
   ```
   Save the `Package ID` and `System Object ID` for environment variables.

3. **Setup Backend Server**
   ```bash
   cd server/attendance_server
   npm install
   cp .env.example .env
   # Edit .env with your PACKAGE_ID, SYSTEM_OBJECT_ID, and SERVER_PRIVATE_KEY
   npm run dev
   ```

4. **Setup Frontend**
   ```bash
   cd frontend/app
   npm install
   cp .env.example .env
   # Edit .env with your VITE_PACKAGE_ID and VITE_SYSTEM_OBJECT_ID
   npm run dev
   ```

5. **Upload ESP32 Firmware**
   - Open `firmware/esp32_attendance/esp32_attendance.ino` in Arduino IDE
   - Install ESP32 board support and MFRC522 library
   - Configure WiFi credentials and server URL
   - Upload to ESP32 device

### Environment Variables

**Backend** (`server/attendance_server/.env`):
```env
PORT=4000
NETWORK=testnet
PACKAGE_ID=0x...
SYSTEM_OBJECT_ID=0x...
SERVER_PRIVATE_KEY=suiprivkey1...
```

**Frontend** (`frontend/app/.env`):
```env
VITE_PACKAGE_ID=0x...
VITE_SYSTEM_OBJECT_ID=0x...
```

---

## Project Structure

```
esp32_sui_attendance/
├── smart-contract/          # Sui Move smart contracts
│   └── attendance_system/
│       ├── sources/          # Move modules
│       │   ├── attendance_system.move
│       │   ├── attendance.move
│       │   ├── organisation.move
│       │   ├── student.move
│       │   ├── subscription.move
│       │   ├── types.move
│       │   ├── events.move
│       │   └── constants.move
│       ├── tests/            # Move unit tests
│       └── README.md         # Detailed smart contract docs
│
├── server/                   # Node.js backend server
│   └── attendance_server/
│       ├── src/
│       │   ├── index.ts      # Express server setup
│       │   ├── routes/       # API routes
│       │   ├── services/     # Business logic
│       │   └── config/       # Configuration
│       └── README.md         # Server documentation
│
├── frontend/                 # React frontend application
│   └── app/
│       ├── src/
│       │   ├── pages/        # React pages
│       │   ├── components/  # UI components
│       │   ├── hooks/        # Custom React hooks
│       │   └── services/    # API services
│       └── README.md         # Frontend documentation
│
├── firmware/                 # ESP32 firmware
│   └── esp32_attendance/
│       ├── esp32_attendance.ino
│       └── README.md         # Firmware setup guide
│
├── UPCOMING_FEATURES.md      # Planned features
├── DEPLOYMENT_CHECKLIST.md   # Deployment guide
└── README.md                 # This file
```

---

## Documentation

### Component-Specific Documentation

- **[Smart Contract README](./smart-contract/README.md)**: Complete Move contract documentation, API reference, testing guide
- **[Server README](./server/attendance_server/README.md)**: Backend architecture, API endpoints, configuration
- **[Firmware README](./firmware/README.md)**: ESP32 setup, hardware configuration, communication protocol
- **[Frontend README](./frontend/app/README.md)**: React app structure, hooks, components

### Additional Resources

- **[Wallet Integration Guide](./frontend/app/docs/WALLET_INTEGRATION_COMPLETE_GUIDE.md)**: Complete guide for integrating Slush wallet with Sui dapp-kit, including mobile fixes and routing solutions
- **[Device Management](./docs/DEVICE_MANAGEMENT.md)**: Device registration, heartbeat tracking, and health monitoring
- **[Device Management Implementation](./docs/DEVICE_MANAGEMENT_IMPLEMENTATION.md)**: Implementation details and migration guide
- **[Device Duplicate Prevention](./docs/DEVICE_DUPLICATE_PREVENTION.md)**: How the system prevents duplicate device IDs across organisations
- **[Upcoming Features](./docs/UPCOMING_FEATURES.md)**: Planned improvements and roadmap
- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)**: Step-by-step deployment guide
- **[Sui Documentation](https://docs.sui.io/)**: Official Sui blockchain docs
- **[Move Language Guide](https://docs.sui.io/build/move)**: Move programming language reference

---

## Tech Stack

### Blockchain
- **Sui Blockchain**: High-performance Layer 1 blockchain
- **Move Language**: Type-safe smart contract language
- **Sui TypeScript SDK**: Client library for blockchain interactions

### Backend
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe JavaScript
- **Express**: Web framework
- **Winston**: Logging library

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **@mysten/dapp-kit**: Sui wallet integration
- **React Query**: Data fetching and caching

### Hardware
- **ESP32**: Microcontroller with WiFi
- **MFRC522**: RFID reader module
- **Arduino IDE**: Development environment

---

## Security Features

- **Access Control**: Role-based permissions (organisation owner, system owner)
- **On-Chain Clock**: Tamper-proof timestamps prevent manipulation
- **One Check-in Per Day**: Enforced at smart contract level
- **Subscription Validation**: Prevents unauthorised attendance recording
- **Shared Objects**: Secure multi-user access patterns
- **Type Safety**: Move language prevents common vulnerabilities

---

## Testing

### Smart Contract Tests
```bash
cd smart-contract/attendance_system
sui move test
```

### Backend API Tests
```bash
cd server/attendance_server
npm test
```

### Frontend Tests
```bash
cd frontend/app
npm test
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Move**: Follow Sui Move naming conventions
- **TypeScript**: Use ESLint and Prettier configurations
- **React**: Follow React best practices and hooks rules
- **Commits**: Use conventional commit messages

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- **TechMasterEvent** for recognizing key contributors to innovative tech projects
- **Sui Foundation** for the excellent blockchain infrastructure
- **Mysten Labs** for the Sui SDK and developer tools
- **ESP32 Community** for hardware support and libraries

---

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Arewa100/esp32_sui_attendance/issues)
- **Documentation**: Check component-specific README files
- **Sui Discord**: Join the Sui developer community

---

<div align="center">

**Built with ❤️ on Sui Blockchain**

[Star this repo](https://github.com/Arewa100/esp32_sui_attendance) • [Read the docs](./smart-contract/README.md) • [Report issues](https://github.com/Arewa100/esp32_sui_attendance/issues)

</div>

