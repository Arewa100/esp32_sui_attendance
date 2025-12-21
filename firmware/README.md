# Firmware Directory

This directory contains firmware for ESP32 devices used in the Sui Attendance System.

## Structure

```
firmware/
└── esp32_attendance/
    ├── esp32_attendance.ino              # Main firmware (direct configuration)
    ├── esp32_attendance_with_config.ino  # Main firmware (using config.h)
    ├── config.h                          # Configuration header template
    ├── README.md                         # Detailed setup and usage guide
    └── .gitignore                        # Git ignore rules
```

## Quick Start

1. **Install Arduino IDE** and ESP32 board support
2. **Install required libraries**: MFRC522
3. **Configure** WiFi and server settings
4. **Upload** firmware to ESP32
5. **Test** with an RFID card

See [esp32_attendance/README.md](./esp32_attendance/README.md) for detailed instructions.

## Hardware Setup

- ESP32 development board
- MFRC522 RFID reader module
- RFID cards/tags
- Power supply

## Communication Flow

```
ESP32 Device
    ↓ (Reads RFID Card)
    ↓ (Extracts Card ID)
    ↓ (HTTP POST Request)
Backend Server
    ↓ (Validates & Processes)
    ↓ (Records on Sui Blockchain)
```

## Features

- WiFi connectivity
- RFID card reading
- HTTP communication with backend
- Error handling and logging
- Configurable settings
- Serial debugging

## Security Notes

- Keep WiFi credentials secure
- Use HTTPS in production
- Implement device authentication if needed
- Consider encrypting sensitive data

---

For detailed documentation, see the [esp32_attendance](./esp32_attendance/) folder.









This directory contains firmware for ESP32 devices used in the Sui Attendance System.

## Structure

```
firmware/
└── esp32_attendance/
    ├── esp32_attendance.ino              # Main firmware (direct configuration)
    ├── esp32_attendance_with_config.ino  # Main firmware (using config.h)
    ├── config.h                          # Configuration header template
    ├── README.md                         # Detailed setup and usage guide
    └── .gitignore                        # Git ignore rules
```

## Quick Start

1. **Install Arduino IDE** and ESP32 board support
2. **Install required libraries**: MFRC522
3. **Configure** WiFi and server settings
4. **Upload** firmware to ESP32
5. **Test** with an RFID card

See [esp32_attendance/README.md](./esp32_attendance/README.md) for detailed instructions.

## Hardware Setup

- ESP32 development board
- MFRC522 RFID reader module
- RFID cards/tags
- Power supply

## Communication Flow

```
ESP32 Device
    ↓ (Reads RFID Card)
    ↓ (Extracts Card ID)
    ↓ (HTTP POST Request)
Backend Server
    ↓ (Validates & Processes)
    ↓ (Records on Sui Blockchain)
```

## Features

- WiFi connectivity
- RFID card reading
- HTTP communication with backend
- Error handling and logging
- Configurable settings
- Serial debugging

## Security Notes

- Keep WiFi credentials secure
- Use HTTPS in production
- Implement device authentication if needed
- Consider encrypting sensitive data

---

For detailed documentation, see the [esp32_attendance](./esp32_attendance/) folder.







