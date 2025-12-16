/*
 * ESP32 Sui Attendance System
 * 
 * This firmware reads RFID cards and sends attendance data to the backend server
 * which records it on the Sui blockchain.
 * 
 * Hardware Requirements:
 * - ESP32 development board
 * - MFRC522 RFID reader module
 * - Power supply
 * 
 * Connections:
 * - MFRC522 SDA (SS) -> GPIO 5
 * - MFRC522 SCK -> GPIO 18
 * - MFRC522 MOSI -> GPIO 23
 * - MFRC522 MISO -> GPIO 19
 * - MFRC522 RST -> GPIO 4
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// ========== CONFIGURATION ==========
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoint
const char* serverUrl = "http://your-server.com/api/attendance";

// Organisation Object ID (from Sui blockchain)
const String ORG_OBJECT_ID = "0xYOUR_ORG_OBJECT_ID";

// Device identifier (unique for each ESP32)
const String DEVICE_ID = "ESP32_ATTENDANCE_001";

// RFID module pins
#define SS_PIN 5
#define RST_PIN 4

// ========== GLOBAL OBJECTS ==========
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=================================");
  Serial.println("ESP32 Sui Attendance System");
  Serial.println("=================================\n");
  
  // Initialize WiFi
  initWiFi();
  
  // Initialize RFID
  initRFID();
  
  Serial.println("\nSystem ready!");
  Serial.println("Waiting for RFID card...\n");
}

// ========== MAIN LOOP ==========
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    initWiFi();
  }
  
  // Check for RFID card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String cardId = getCardId();
    Serial.println("Card detected: " + cardId);
    
    // Send attendance record to server
    sendAttendanceRecord(cardId);
    
    // Prevent multiple reads
    delay(2000);
  }
  
  delay(100);
}

// ========== WIFI INITIALIZATION ==========
void initWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed!");
    Serial.println("Please check your credentials and try again.");
  }
}

// ========== RFID INITIALIZATION ==========
void initRFID() {
  Serial.println("Initializing RFID module...");
  
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Check if RFID module is connected
  if (!mfrc522.PCD_PerformSelfTest()) {
    Serial.println("RFID module self-test failed!");
    Serial.println("Please check your connections.");
    return;
  }
  
  Serial.println("RFID module initialized");
  Serial.print("Firmware Version: ");
  Serial.println(mfrc522.PCD_ReadRegister(mfrc522.VersionReg), HEX);
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
  Serial.println("\nSending attendance record to server...");
  Serial.println("Card ID: " + cardId);
  Serial.println("Organisation: " + ORG_OBJECT_ID);
  Serial.println("Device ID: " + DEVICE_ID);
  
  HTTPClient http;
  
  // Begin HTTP connection
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Build JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"cardId\":\"" + cardId + "\",";
  jsonPayload += "\"orgObjectId\":\"" + ORG_OBJECT_ID + "\",";
  jsonPayload += "\"deviceId\":\"" + DEVICE_ID + "\"";
  jsonPayload += "}";
  
  Serial.println("Payload: " + jsonPayload);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  // Process response
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    
    String response = http.getString();
    Serial.println("Response: " + response);
    
    // Parse response (optional)
    if (httpResponseCode == 200) {
      Serial.println("Attendance record sent successfully!");
      Serial.println("Server is processing the transaction...");
    } else {
      Serial.print("Server returned error code: ");
      Serial.println(httpResponseCode);
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
    Serial.println("Error: " + http.errorToString(httpResponseCode));
  }
  
  http.end();
  Serial.println();
}

// ========== UTILITY FUNCTIONS ==========

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

