# ESP32 RFID Card UID Checker

Simple utility firmware to read and display RFID card UIDs using ESP32 and MFRC522 module.

## Purpose

This tool helps you:
- **Check card UIDs** before registering students in the attendance system
- **Verify card functionality** and connections
- **Get the exact card ID** format used by the main attendance firmware

## Hardware Requirements

- **ESP32 Development Board** (ESP32-WROOM-32 or compatible)
- **MFRC522 RFID Reader Module**
- **RFID Cards/Tags** (Mifare Classic 1K or compatible)
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

**Important:** Use 3.3V, NOT 5V for the MFRC522 module!

## Installation

### Option 1: PlatformIO (Recommended)

1. Install [PlatformIO IDE](https://platformio.org/install/ide?install=vscode) (VS Code extension)
2. Open this folder (`card_uid_checker`) in VS Code
3. Click **Upload** button in PlatformIO toolbar
4. Open Serial Monitor (115200 baud)

### Option 2: Arduino IDE

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Install ESP32 board support:
   - Go to **File → Preferences**
   - Add URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to **Tools → Board → Boards Manager**
   - Search for "ESP32" and install "esp32 by Espressif Systems"
3. Install **MFRC522** library:
   - Go to **Sketch → Include Library → Manage Libraries**
   - Search for "MFRC522" and install
4. Open `card_uid_checker.ino` in Arduino IDE
5. Select **Tools → Board → ESP32 Dev Module**
6. Select your COM port
7. Click **Upload**
8. Open Serial Monitor (115200 baud)

## Usage

1. **Upload the firmware** to your ESP32
2. **Open Serial Monitor** (115200 baud)
3. **Place an RFID card** on the reader
4. **Read the UID** displayed in Serial Monitor

## Output Format

The tool displays the card UID in multiple formats:

```
--- Card Detected ---
UID Size: 4 bytes
UID (Hex with spaces): A1 B2 C3 D4
UID (Continuous HEX): A1B2C3D4
UID (Decimal): 161 178 195 212
---
Use this UID when registering students:
Card ID: A1B2C3D4
```

**Important:** The main attendance firmware uses the **"Continuous HEX"** format (e.g., `A1B2C3D4`). Use this exact format when registering students.

## Features

- ✅ **Simple and focused** - Only reads UID, no WiFi or server communication
- ✅ **Multiple formats** - Shows UID in hex, decimal, and continuous formats
- ✅ **Error detection** - Checks if RFID module is connected properly
- ✅ **Cooldown protection** - Prevents multiple reads of the same card
- ✅ **Clear output** - Easy to read and copy card IDs

## Troubleshooting

### RFID Module Not Detected

**Problem:** "RFID module self-test failed!"

**Solutions:**
- Check all connections are secure
- Verify MFRC522 is powered with **3.3V** (not 5V)
- Ensure SPI pins are correct (SCK=18, MOSI=23, MISO=19)
- Try a different RFID card
- Check if MFRC522 module is working (test with another device)

### No Card Detected

**Problem:** Card placed but no output

**Solutions:**
- Ensure card is close enough to reader (within 5cm)
- Try a different RFID card
- Check Serial Monitor is open and set to 115200 baud
- Wait 2 seconds between card reads (cooldown period)

### Serial Monitor Shows Nothing

**Problem:** No output in Serial Monitor

**Solutions:**
- Check Serial Monitor baud rate is set to **115200**
- Verify ESP32 is connected and selected in Arduino IDE
- Try unplugging and replugging USB cable
- Check if correct COM port is selected

## Card ID Format

The main attendance system expects card IDs in **uppercase hexadecimal format** without spaces:

- ✅ **Correct:** `A1B2C3D4`
- ❌ **Wrong:** `a1b2c3d4` (lowercase)
- ❌ **Wrong:** `A1 B2 C3 D4` (with spaces)
- ❌ **Wrong:** `A1-B2-C3-D4` (with dashes)

## Integration with Main System

When you register a student in the attendance system, use the **"Card ID"** value shown by this tool (the continuous HEX format).

Example:
- This tool shows: `Card ID: A1B2C3D4`
- Register student with: `cardId = "A1B2C3D4"`

## Notes

- **Card UID is read-only** - The UID is hardcoded by the manufacturer and cannot be changed
- **Different card types** - Cards can have 4, 7, or 10-byte UIDs
- **Unique per card** - Each card has a unique UID (though some cards can be cloned)

## License

See main project LICENSE file.

---

**Built for ESP32 Sui Attendance System**

