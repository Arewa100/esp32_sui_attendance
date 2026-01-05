#include "rfid_control.h"
#include "config.h"
#include <SPI.h>
#include <MFRC522.h>

// Use static object instead of dynamic allocation to avoid memory leaks
static MFRC522* mfrc522 = nullptr;
static int currentSsPin = -1;
static int currentRstPin = -1;
static bool rfidInitialized = false;

void initRFID(int ssPin, int rstPin) {
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.println("Initializing RFID module...");
    #endif
    
    // Only reinitialize if pins changed or not initialized
    if (mfrc522 == nullptr || currentSsPin != ssPin || currentRstPin != rstPin) {
        // Clean up existing instance if pins changed
        if (mfrc522 != nullptr && (currentSsPin != ssPin || currentRstPin != rstPin)) {
            delete mfrc522;
            mfrc522 = nullptr;
        }
        
        // Create new instance
        mfrc522 = new MFRC522(ssPin, rstPin);
        currentSsPin = ssPin;
        currentRstPin = rstPin;
    }
    
    // Initialize SPI (safe to call multiple times)
    SPI.begin();
    
    mfrc522->PCD_Init();
    
    // Check if RFID module is connected
    if (!mfrc522->PCD_PerformSelfTest()) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("RFID module self-test failed!");
        DEBUG_SERIAL.println("Please check your connections.");
        #endif
        rfidInitialized = false;
        return;
    }
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.println("RFID module initialized");
    DEBUG_SERIAL.print("Firmware Version: 0x");
    DEBUG_SERIAL.println(mfrc522->PCD_ReadRegister(mfrc522->VersionReg), HEX);
    #endif
    
    rfidInitialized = true;
}

bool isRFIDReady() {
    return rfidInitialized && mfrc522 != nullptr;
}

bool isCardPresent() {
    if (!isRFIDReady()) {
        return false;
    }
    return mfrc522->PICC_IsNewCardPresent() && mfrc522->PICC_ReadCardSerial();
}

String getCardId() {
    if (!isRFIDReady() || !isCardPresent()) {
        return "";
    }
    
    // Validate UID size (should be 4, 7, or 10 bytes)
    if (mfrc522->uid.size == 0 || mfrc522->uid.size > 10) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.print("Invalid UID size: ");
        DEBUG_SERIAL.println(mfrc522->uid.size);
        #endif
        return "";
    }
    
    // Pre-allocate String with estimated capacity to reduce fragmentation
    String cardId = "";
    cardId.reserve(mfrc522->uid.size * 2 + 1);  // 2 chars per byte + null terminator
    
    // Read UID bytes
    for (byte i = 0; i < mfrc522->uid.size; i++) {
        // Add leading zero if needed
        if (mfrc522->uid.uidByte[i] < 0x10) {
            cardId += "0";
        }
        // Convert to hex string
        char hexChar[3];
        sprintf(hexChar, "%02X", mfrc522->uid.uidByte[i]);
        cardId += hexChar;
    }
    
    // Already uppercase from sprintf with %X
    
    return cardId;
}

String getRFIDVersion() {
    if (!isRFIDReady()) {
        return "Unknown";
    }
    
    byte version = mfrc522->PCD_ReadRegister(mfrc522->VersionReg);
    char versionStr[6];  // "0x" + 2 hex digits + null terminator
    sprintf(versionStr, "0x%02X", version);
    return String(versionStr);
}

