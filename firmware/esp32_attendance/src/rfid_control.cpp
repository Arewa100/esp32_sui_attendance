#include "rfid_control.h"
#include <SPI.h>
#include <MFRC522.h>

static MFRC522* mfrc522 = nullptr;
static bool rfidInitialized = false;

void initRFID(int ssPin, int rstPin) {
    Serial.println("Initializing RFID module...");
    
    // Create MFRC522 instance if not already created
    if (mfrc522 == nullptr) {
        mfrc522 = new MFRC522(ssPin, rstPin);
    }
    
    SPI.begin();
    mfrc522->PCD_Init();
    
    // Check if RFID module is connected
    if (!mfrc522->PCD_PerformSelfTest()) {
        Serial.println("RFID module self-test failed!");
        Serial.println("Please check your connections.");
        rfidInitialized = false;
        return;
    }
    
    Serial.println("RFID module initialized");
    Serial.print("Firmware Version: 0x");
    Serial.println(mfrc522->PCD_ReadRegister(mfrc522->VersionReg), HEX);
    
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
    
    String cardId = "";
    
    // Read UID bytes
    for (byte i = 0; i < mfrc522->uid.size; i++) {
        // Add leading zero if needed
        if (mfrc522->uid.uidByte[i] < 0x10) {
            cardId += "0";
        }
        // Convert to hex string
        cardId += String(mfrc522->uid.uidByte[i], HEX);
    }
    
    // Convert to uppercase
    cardId.toUpperCase();
    
    return cardId;
}

String getRFIDVersion() {
    if (!isRFIDReady()) {
        return "Unknown";
    }
    
    byte version = mfrc522->PCD_ReadRegister(mfrc522->VersionReg);
    String versionStr = "0x";
    if (version < 0x10) {
        versionStr += "0";
    }
    versionStr += String(version, HEX);
    return versionStr;
}

