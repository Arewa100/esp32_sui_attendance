#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include "config.h"

// ========== GLOBAL OBJECTS ==========
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

// ========== SETUP ==========
void setup() {
  DEBUG_SERIAL.begin(SERIAL_BAUD_RATE);
  delay(1000);
  
  DEBUG_SERIAL.println("\n=================================");
  DEBUG_SERIAL.println("ESP32 Sui Attendance System");
  DEBUG_SERIAL.println("=================================\n");
  
  #ifdef DEBUG_MODE
  DEBUG_SERIAL.println("Debug mode: ENABLED");
  #endif
  
  // Initialize WiFi
  initWiFi();
  
  // Initialize RFID
  initRFID();
  
  // Print configuration
  printConfiguration();
  
  DEBUG_SERIAL.println("\nSystem ready!");
  DEBUG_SERIAL.println("Waiting for RFID card...\n");
}

// ========== MAIN LOOP ==========
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    DEBUG_SERIAL.println("WiFi disconnected. Reconnecting...");
    delay(WIFI_RECONNECT_DELAY);
    initWiFi();
  }
  
  // Check for RFID card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String cardId = getCardId();
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.println("Card detected: " + cardId);
    #endif
    
    // Send attendance record to server
    sendAttendanceRecord(cardId);
    
    // Prevent multiple reads
    delay(CARD_READ_DELAY);
  }
  
  delay(MAIN_LOOP_DELAY);
}

// ========== WIFI INITIALIZATION ==========
void initWiFi() {
  DEBUG_SERIAL.print("Connecting to WiFi: ");
  DEBUG_SERIAL.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    DEBUG_SERIAL.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    DEBUG_SERIAL.println("\nWiFi connected!");
    DEBUG_SERIAL.print("IP Address: ");
    DEBUG_SERIAL.println(WiFi.localIP());
    DEBUG_SERIAL.print("Signal Strength (RSSI): ");
    DEBUG_SERIAL.print(WiFi.RSSI());
    DEBUG_SERIAL.println(" dBm");
  } else {
    DEBUG_SERIAL.println("\nWiFi connection failed!");
    DEBUG_SERIAL.println("Please check your credentials in config.h");
  }
}

// ========== RFID INITIALIZATION ==========
void initRFID() {
  DEBUG_SERIAL.println("Initializing RFID module...");
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Check if RFID module is connected
  if (!mfrc522.PCD_PerformSelfTest()) {
    DEBUG_SERIAL.println("RFID module self-test failed!");
    DEBUG_SERIAL.println("Please check your connections.");
    return;
  }
  
  DEBUG_SERIAL.println("RFID module initialized");
  
  #ifdef DEBUG_MODE
  DEBUG_SERIAL.print("Firmware Version: ");
  DEBUG_SERIAL.println(mfrc522.PCD_ReadRegister(mfrc522.VersionReg), HEX);
  #endif
}

// ========== GET CARD ID ==========
String getCardId() {
  String cardId = "";
  
  // Read UID bytes
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    // Add leading zero if needed
    if (mfrc522.uid.uidByte[i] < 0x10) {
      cardId += "0";
    }
    // Convert to hex string
    cardId += String(mfrc522.uid.uidByte[i], HEX);
  }
  
  // Convert to uppercase
  cardId.toUpperCase();
  
  return cardId;
}

// ========== SEND ATTENDANCE RECORD ==========
void sendAttendanceRecord(String cardId) {
  DEBUG_SERIAL.println("\nSending attendance record to server...");
  
  #ifdef DEBUG_MODE
  DEBUG_SERIAL.println("Card ID: " + cardId);
  DEBUG_SERIAL.println("Organisation: " + String(ORG_OBJECT_ID));
  DEBUG_SERIAL.println("Device ID: " + String(DEVICE_ID));
  #endif
  
  HTTPClient http;
  
  // Begin HTTP connection
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(SERVER_TIMEOUT);
  
  // Build JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"cardId\":\"" + cardId + "\",";
  jsonPayload += "\"orgObjectId\":\"" + String(ORG_OBJECT_ID) + "\",";
  jsonPayload += "\"deviceId\":\"" + String(DEVICE_ID) + "\"";
  jsonPayload += "}";
  
  #ifdef DEBUG_MODE
  DEBUG_SERIAL.println("Payload: " + jsonPayload);
  #endif
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  // Process response
  if (httpResponseCode > 0) {
    DEBUG_SERIAL.print("HTTP Response code: ");
    DEBUG_SERIAL.println(httpResponseCode);
    
    String response = http.getString();
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.println("Response: " + response);
    #endif
    
    // Parse response
    if (httpResponseCode == 200) {
      DEBUG_SERIAL.println("Attendance record sent successfully!");
      DEBUG_SERIAL.println("Server is processing the transaction...");
    } else {
      DEBUG_SERIAL.print("Server returned error code: ");
      DEBUG_SERIAL.println(httpResponseCode);
    }
  } else {
    DEBUG_SERIAL.print("HTTP Error: ");
    DEBUG_SERIAL.println(httpResponseCode);
    DEBUG_SERIAL.println("Error: " + http.errorToString(httpResponseCode));
  }
  
  http.end();
  DEBUG_SERIAL.println();
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Print current configuration (without sensitive data)
 */
void printConfiguration() {
  DEBUG_SERIAL.println("\n--- Configuration ---");
  DEBUG_SERIAL.print("Device ID: ");
  DEBUG_SERIAL.println(DEVICE_ID);
  DEBUG_SERIAL.print("Server URL: ");
  DEBUG_SERIAL.println(SERVER_URL);
  DEBUG_SERIAL.print("Organisation ID: ");
  DEBUG_SERIAL.println(ORG_OBJECT_ID);
  DEBUG_SERIAL.print("MAC Address: ");
  DEBUG_SERIAL.println(WiFi.macAddress());
  DEBUG_SERIAL.println("---------------------");
}

/**
 * Get WiFi signal strength
 */
int getWiFiRSSI() {
  return WiFi.RSSI();
}

/**
 * Check if WiFi is connected
 */
bool isWiFiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

/**
 * Get device MAC address
 */
String getMacAddress() {
  return WiFi.macAddress();
}

