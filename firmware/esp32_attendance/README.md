# ESP32 Sui Attendance System - Firmware

Firmware for ESP32 devices to read RFID cards and send attendance data to the backend server.

## Table of Contents

- [Hardware Requirements](#hardware-requirements)
- [Wiring Diagram](#wiring-diagram)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Hardware Requirements

- **ESP32 Development Board** (ESP32-WROOM-32 or compatible)
- **MFRC522 RFID Reader Module**
- **RFID Cards/Tags** (Mifare Classic 1K or compatible)
- **Power Supply** (5V USB or external power)
- **Jumper Wires** for connections

## Wiring Diagram

Connect the MFRC522 to ESP32 as follows:

| MFRC522 Pin | ESP32 Pin | Description |
|-------------|-----------|-------------|
| SDA (SS)    | GPIO 5    | SPI Chip Select |
| SCK         | GPIO 18   | SPI Clock |
| MOSI        | GPIO 23   | SPI Master Out Slave In |
| MISO        | GPIO 19   | SPI Master In Slave Out |
| RST         | GPIO 4    | Reset Pin |
| 3.3V        | 3.3V      | Power |
| GND         | GND       | Ground |

**Note**: You can change the pin assignments in the code if needed.

## Project Structure

```
firmware/esp32_attendance/
├── src/                      # Source code (modular)
│   ├── main.cpp             # Main entry point
│   ├── wifi_control.h       # WiFi module header
│   ├── wifi_control.cpp     # WiFi module implementation
│   ├── rfid_control.h       # RFID module header
│   ├── rfid_control.cpp     # RFID module implementation
│   ├── attendance_client.h  # HTTP client header
│   └── attendance_client.cpp # HTTP client implementation
├── include/                  # Header files and config
│   ├── config.h             # Configuration (create from example)
│   └── config.h.example     # Configuration template
├── platformio.ini           # PlatformIO configuration
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## Installation

### Option 1: PlatformIO (Recommended)

1. Install [PlatformIO IDE](https://platformio.org/install/ide?install=vscode) (VS Code extension)
2. Open the `firmware/esp32_attendance` folder in VS Code
3. Copy `include/config.h.example` to `include/config.h`
4. Update configuration in `include/config.h`
5. Click **Upload** button in PlatformIO

### Option 2: Arduino IDE

1. Install [Arduino IDE](https://www.arduino.cc/en/software) (version 1.8.19 or later)
2. Install ESP32 board support:
   - Go to **File → Preferences**
   - Add URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to **Tools → Board → Boards Manager**
   - Search for "ESP32" and install "esp32 by Espressif Systems"
3. Install **MFRC522** library:
   - Go to **Sketch → Include Library → Manage Libraries**
   - Search for "MFRC522" and install
4. Copy all files from `src/` to a new Arduino sketch folder
5. Copy `include/config.h.example` to your sketch folder as `config.h`
6. Update configuration in `config.h`
7. Adjust `#include "../include/config.h"` to `#include "config.h"` in `main.cpp`
8. Upload to ESP32

## Configuration

1. Copy `include/config.h.example` to `include/config.h`
2. Update values in `include/config.h`:

```cpp
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define SERVER_URL "http://your-server.com/api/attendance"
#define DEVICE_ID "ESP32_ATTENDANCE_001"
#define HEARTBEAT_INTERVAL 3600000  // 1 hour in milliseconds
#define RFID_SS_PIN 5
#define RFID_RST_PIN 4
```

**Important**: Never commit `config.h` to version control (it's in `.gitignore`)

### Configuration Values

| Parameter | Description | Example | Required |
|-----------|-------------|---------|----------|
| `WIFI_SSID` | Your WiFi network name | "MyWiFi" | Yes |
| `WIFI_PASSWORD` | Your WiFi password | "mypassword123" | Yes |
| `SERVER_URL` | Backend server URL | "http://192.168.1.100:4000/api/attendance" | Yes |
| `DEVICE_ID` | Unique device identifier (must be registered to organisation) | "ESP32_ATTENDANCE_001" | Yes |
| `HEARTBEAT_INTERVAL` | Device heartbeat interval in milliseconds | 3600000 (1 hour) | No (default: 1 hour) |
| `ORG_OBJECT_ID` | Sui organisation object ID (optional, backward compatibility only) | "0x789abc123def456" | No |

### Device Registration

**Before using the device, it must be registered to your organisation:**

1. Register the device via the frontend dashboard or smart contract
2. Use the same `DEVICE_ID` in your firmware configuration
3. The server will automatically resolve the organisation from the device ID
4. `ORG_OBJECT_ID` is no longer required in firmware (kept for backward compatibility only)

## Usage

### Basic Operation

1. **Register Device First**: Register your device ID to your organisation via the frontend dashboard
2. Power on the ESP32
3. Open Serial Monitor (115200 baud)
4. Wait for WiFi connection
5. Device will automatically send heartbeat every hour (configurable via `HEARTBEAT_INTERVAL`)
6. Place RFID card on reader
7. Check Serial Monitor for status

### Serial Monitor Output

```
=================================
ESP32 Sui Attendance System
=================================

Connecting to WiFi: MyWiFi
..........
WiFi connected!
IP Address: 192.168.1.50
Signal Strength (RSSI): -45 dBm

Initializing RFID module...
RFID module initialized
Firmware Version: 92

System ready!
Waiting for RFID card...

Card detected: A1B2C3D4
Sending attendance record to server...
Card ID: A1B2C3D4
Device ID: ESP32_ATTENDANCE_001
Payload: {"cardId":"A1B2C3D4","deviceId":"ESP32_ATTENDANCE_001"}
HTTP Response code: 200
Response: {"ok":true,"message":"Attendance event received and processing","cardId":"A1B2C3D4","receivedAt":"2025-12-16T13:30:45.123Z"}
Attendance record sent successfully!
Server is processing the transaction...

Sending device heartbeat...
Device ID: ESP32_ATTENDANCE_001
HTTP Response code: 200
Response: {"ok":true,"message":"Heartbeat updated successfully","deviceId":"ESP32_ATTENDANCE_001","timestamp":1734567890000}
Heartbeat sent successfully!
```

**Note**: Heartbeats are sent automatically every hour (configurable via `HEARTBEAT_INTERVAL`). This allows the system to track device health and display online/offline status.
```

## Troubleshooting

### WiFi Connection Issues

**Problem**: ESP32 cannot connect to WiFi

**Solutions**:
- Verify SSID and password are correct
- Check WiFi signal strength (should be > -70 dBm)
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Try restarting the ESP32

### RFID Reader Not Working

**Problem**: No card detected

**Solutions**:
- Verify all connections are secure
- Check if MFRC522 is powered (3.3V, not 5V)
- Ensure SPI pins are correct
- Try a different RFID card
- Check Serial Monitor for initialization errors

### Server Connection Failed

**Problem**: HTTP request fails

**Solutions**:
- Verify server URL is correct and accessible
- Check if server is running
- Ensure ESP32 and server are on same network
- Check firewall settings
- Verify server endpoint is `/api/attendance`

### Card ID Format Issues

**Problem**: Card ID doesn't match registered student

**Solutions**:
- Ensure card ID format matches what's registered (uppercase hex)
- Check Serial Monitor for actual card ID
- Verify card is registered in the organisation
- Try registering the card again

## API Reference

### Attendance Endpoint

**Endpoint**: `POST /api/attendance`

**Headers**:
```
Content-Type: application/json
```

**Payload**:
```json
{
  "cardId": "A1B2C3D4",
  "deviceId": "ESP32_ATTENDANCE_001"
}
```

**Note**: `orgObjectId` is no longer required. The server automatically resolves the organisation from `deviceId`.

**Response** (Success):
```json
{
  "ok": true,
  "message": "Attendance event received and processing",
  "cardId": "A1B2C3D4",
  "receivedAt": "2025-12-16T13:30:45.123Z"
}
```

**Response** (Error):
```json
{
  "ok": false,
  "error": "cardId is required and must be a string"
}
```

### Device Heartbeat Endpoint

**Endpoint**: `POST /api/devices/:deviceId/heartbeat`

**Description**: Automatically called by firmware every hour (configurable) to update device health status.

**Headers**:
```
Content-Type: application/json
```

**Payload** (optional):
```json
{
  "timestamp": 1734567890000  // Optional, milliseconds since epoch. Defaults to server time.
}
```

**Response** (Success):
```json
{
  "ok": true,
  "message": "Heartbeat updated successfully",
  "deviceId": "ESP32_ATTENDANCE_001",
  "timestamp": 1734567890000,
  "transactionDigest": "0xabc123..."
}
```

**Device Health Status**:
- The system tracks device health based on heartbeat timestamps
- Devices are considered "Online" if last heartbeat was within the last 2 hours
- Devices are considered "Offline" if no heartbeat received for more than 2 hours
- Heartbeat status is visible in the frontend dashboard under "Devices" tab

## Security Considerations

1. **WiFi Credentials**: Keep WiFi password secure
2. **Server URL**: Use HTTPS in production
3. **Device ID**: Use unique identifiers for each device
4. **Card Security**: RFID cards can be cloned - implement additional security if needed
5. **Network**: Use secure WiFi network (WPA2/WPA3)

## Module Architecture

The firmware is organized into separate modules for better maintainability:

- **wifi_control**: WiFi connection management
- **rfid_control**: RFID card reading functionality
- **attendance_client**: HTTP communication with backend server (attendance records and heartbeats)
- **main.cpp**: Orchestrates all modules, handles periodic heartbeat sending

Each module has a `.h` header file and `.cpp` implementation file, following separation of concerns principles.

### Device Heartbeat

The firmware automatically sends device heartbeats to track device health:

- **Frequency**: Every hour by default (configurable via `HEARTBEAT_INTERVAL`)
- **Purpose**: Allows the system to monitor device status (online/offline)
- **Implementation**: Periodic task in `main.cpp` loop
- **Endpoint**: `POST /api/devices/:deviceId/heartbeat`
- **No user action required**: Completely automatic after device registration

## Customization

### Change RFID Pins

Edit the pin definitions:
```cpp
#define SS_PIN 5   // Change to your desired GPIO
#define RST_PIN 4  // Change to your desired GPIO
```

### Add LED Indicators

```cpp
#define LED_PIN 2  // Built-in LED on most ESP32 boards

void setup() {
  pinMode(LED_PIN, OUTPUT);
  // ... rest of setup
}

void loop() {
  if (mfrc522.PICC_IsNewCardPresent()) {
    digitalWrite(LED_PIN, HIGH);  // Turn on LED
    // ... process card
    delay(500);
    digitalWrite(LED_PIN, LOW);   // Turn off LED
  }
}
```

### Add Buzzer Feedback

```cpp
#define BUZZER_PIN 25

void beep(int duration = 100) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  if (mfrc522.PICC_IsNewCardPresent()) {
    beep(200);  // Short beep on card detection
    // ... process card
  }
}
```

## License

See LICENSE file for details.

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review server logs for error messages
- Verify card is registered in the organisation
- Ensure organisation has active subscription

---

**Built for ESP32 Sui Attendance System**

