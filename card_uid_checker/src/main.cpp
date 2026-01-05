/*
 * ESP32 RFID Card UID Checker
 * 
 * Simple utility to read and display RFID card UIDs
 * Useful for checking card IDs before registering students
 * 
 * Hardware:
 * - ESP32 Development Board
 * - MFRC522 RFID Reader Module
 * 
 * Connections:
 * - MFRC522 SDA (SS) -> GPIO 5
 * - MFRC522 SCK -> GPIO 18
 * - MFRC522 MOSI -> GPIO 23
 * - MFRC522 MISO -> GPIO 19
 * - MFRC522 RST -> GPIO 4
 * - MFRC522 3.3V -> 3.3V
 * - MFRC522 GND -> GND
 */

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>

// Pin definitions (matching main firmware)
#define SS_PIN 5
#define RST_PIN 4

// Create MFRC522 instance
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Timing
unsigned long lastCardRead = 0;
const unsigned long CARD_READ_COOLDOWN = 2000; // 2 seconds between reads

/**
 * Display card UID in multiple formats
 */
void displayCardUID() {
    Serial.println("\n--- Card Detected ---");
    
    // Validate UID size
    if (mfrc522.uid.size == 0 || mfrc522.uid.size > 10) {
        Serial.print("ERROR: Invalid UID size: ");
        Serial.println(mfrc522.uid.size);
        return;
    }
    
    // Display UID in different formats
    Serial.print("UID Size: ");
    Serial.print(mfrc522.uid.size);
    Serial.println(" bytes");
    
    // Format 1: Hex with spaces (e.g., "A1 B2 C3 D4")
    Serial.print("UID (Hex with spaces): ");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (i > 0) Serial.print(" ");
        if (mfrc522.uid.uidByte[i] < 0x10) Serial.print("0");
        Serial.print(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println();
    
    // Format 2: Continuous hex uppercase (e.g., "A1B2C3D4") - This is what the main firmware uses
    Serial.print("UID (Continuous HEX): ");
    String cardId = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) cardId += "0";
        char hexChar[3];
        sprintf(hexChar, "%02X", mfrc522.uid.uidByte[i]);
        cardId += hexChar;
    }
    Serial.println(cardId);
    
    // Format 3: Decimal (for reference)
    Serial.print("UID (Decimal): ");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (i > 0) Serial.print(" ");
        Serial.print(mfrc522.uid.uidByte[i], DEC);
    }
    Serial.println();
    
    Serial.println("---");
    Serial.println("Use this UID when registering students:");
    Serial.print("Card ID: ");
    Serial.println(cardId);
    Serial.println("\nPlace another card to read its UID...\n");
}

void setup() {
    // Initialize Serial communication
    Serial.begin(115200);
    while (!Serial) {
        ; // Wait for serial port to connect (needed for some boards)
    }
    delay(1000);
    
    Serial.println("\n=================================");
    Serial.println("ESP32 RFID Card UID Checker");
    Serial.println("=================================\n");
    
    // Initialize SPI
    SPI.begin();
    
    // Initialize MFRC522
    mfrc522.PCD_Init();
    
    // Check if RFID module is connected
    if (!mfrc522.PCD_PerformSelfTest()) {
        Serial.println("ERROR: RFID module self-test failed!");
        Serial.println("Please check your connections:");
        Serial.println("  - SDA (SS) -> GPIO 5");
        Serial.println("  - SCK -> GPIO 18");
        Serial.println("  - MOSI -> GPIO 23");
        Serial.println("  - MISO -> GPIO 19");
        Serial.println("  - RST -> GPIO 4");
        Serial.println("  - 3.3V -> 3.3V");
        Serial.println("  - GND -> GND");
        Serial.println("\nSystem halted. Please fix connections and restart.");
        while (1) {
            delay(1000); // Halt execution
        }
    }
    
    // Display module info
    Serial.println("RFID module initialized successfully!");
    Serial.print("Firmware Version: 0x");
    byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
    if (version < 0x10) Serial.print("0");
    Serial.println(version, HEX);
    Serial.println();
    
    Serial.println("Ready! Place an RFID card on the reader...");
    Serial.println("(Card UID will be displayed when detected)");
    Serial.println("=================================\n");
    Serial.println("Tips:");
    Serial.println("  - Hold card within 5cm of reader");
    Serial.println("  - Keep card steady for 1-2 seconds");
    Serial.println("  - Try different angles if card isn't detected");
    Serial.println();
}

void loop() {
    unsigned long now = millis();
    
    // Check for new card (with cooldown to prevent multiple reads)
    if ((unsigned long)(now - lastCardRead) >= CARD_READ_COOLDOWN) {
        // Look for new cards - check multiple times for better detection
        bool cardPresent = false;
        for (int i = 0; i < 3; i++) {
            if (mfrc522.PICC_IsNewCardPresent()) {
                cardPresent = true;
                break;
            }
            delay(10); // Small delay between checks
        }
        
        if (cardPresent) {
            // Card detected - try to read it
            if (mfrc522.PICC_ReadCardSerial()) {
                // Successfully read card - display UID
                displayCardUID();
                
                // Halt card communication
                mfrc522.PICC_HaltA();
                mfrc522.PCD_StopCrypto1();
                
                lastCardRead = now;
            } else {
                // Card present but couldn't read - might need to be closer
                Serial.println("Card detected but couldn't read. Try moving card closer or hold it steady.");
                delay(200);
            }
        }
    }
    
    delay(50); // Small delay to prevent excessive CPU usage
}

