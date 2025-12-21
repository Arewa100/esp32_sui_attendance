# Source Code Structure

This directory contains the modular source code for the ESP32 Attendance System.

## File Structure

```
src/
├── main.cpp                 # Main entry point (setup/loop)
├── wifi_control.h          # WiFi module header
├── wifi_control.cpp        # WiFi module implementation
├── rfid_control.h          # RFID module header
├── rfid_control.cpp        # RFID module implementation
├── attendance_client.h     # HTTP client header
└── attendance_client.cpp   # HTTP client implementation
```

## Module Descriptions

### wifi_control
Handles WiFi connection management:
- Initialize WiFi connection
- Check connection status
- Get signal strength and device info

### rfid_control
Manages RFID card reading:
- Initialize MFRC522 module
- Detect card presence
- Read card ID

### attendance_client
Handles HTTP communication with backend:
- Send attendance records to server
- Handle responses and errors
- Manage HTTP client state

### main.cpp
Orchestrates all modules:
- Initializes all subsystems
- Main event loop
- Coordinates WiFi, RFID, and HTTP operations

## Usage

This code structure is designed for PlatformIO or Arduino IDE with proper folder structure.

For Arduino IDE:
- Copy all files to your sketch folder
- Ensure config.h is in the same directory or adjust includes

For PlatformIO:
- Place files in `src/` directory
- Place config.h in `include/` directory
- Configure platformio.ini appropriately












