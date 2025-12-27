#include <Arduino.h>
#include "config.h" 
#include "wifi_control.h"
#include "rfid_control.h"
#include "attendance_client.h"

unsigned long lastCardRead = 0;
const unsigned long CARD_READ_COOLDOWN = 2000; // 2 seconds between reads

unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 5000; // Check WiFi every 5 seconds

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 3600000; // 1 hour in milliseconds (3600000 ms)
void printConfiguration();
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
    if (!initWiFi(WIFI_SSID, WIFI_PASSWORD)) {
        DEBUG_SERIAL.println("WiFi initialization failed. System will retry in loop.");
    }
    
    // Initialize RFID
    initRFID(RFID_SS_PIN, RFID_RST_PIN);
    printConfiguration();
    
    DEBUG_SERIAL.println("\nSystem ready!");
    DEBUG_SERIAL.println("Waiting for RFID card...\n");
}

// ========== MAIN LOOP ==========
void loop() {
    unsigned long now = millis();
    
    // Check WiFi connection periodically
    if (now - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
        if (!isWiFiConnected()) {
            DEBUG_SERIAL.println("WiFi disconnected. Reconnecting...");
            initWiFi(WIFI_SSID, WIFI_PASSWORD);
        }
        lastWiFiCheck = now;
    }
    
    // Check for RFID card (with cooldown to prevent multiple reads)
    if (now - lastCardRead >= CARD_READ_COOLDOWN) {
        if (isCardPresent()) {
            String cardId = getCardId();
            
            if (cardId.length() > 0) {
                #ifdef DEBUG_MODE
                DEBUG_SERIAL.println("Card detected: " + cardId);
                #endif
                
                // Send attendance record to server (orgObjectId is optional, server resolves from deviceId)
                #ifdef ORG_OBJECT_ID
                bool success = sendAttendanceRecord(
                    SERVER_URL,
                    cardId,
                    String(DEVICE_ID),
                    String(ORG_OBJECT_ID),  // Optional, for backward compatibility
                    SERVER_TIMEOUT
                );
                #else
                bool success = sendAttendanceRecord(
                    SERVER_URL,
                    cardId,
                    String(DEVICE_ID),
                    "",  // orgObjectId not provided, server will resolve from deviceId
                    SERVER_TIMEOUT
                );
                #endif
                
                if (success) {
                    DEBUG_SERIAL.println("Attendance processed successfully!");
                } else {
                    DEBUG_SERIAL.println("Failed to process attendance. Check server logs.");
                }
                
                lastCardRead = now;
            }
        }
    }
    
    // Send heartbeat every hour
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("Sending device heartbeat...");
        #endif
        
        bool heartbeatSuccess = sendDeviceHeartbeat(
            SERVER_URL,
            String(DEVICE_ID),
            SERVER_TIMEOUT
        );
        
        if (heartbeatSuccess) {
            DEBUG_SERIAL.println("Heartbeat sent successfully!");
        } else {
            DEBUG_SERIAL.println("Failed to send heartbeat. Will retry on next interval.");
        }
        
        lastHeartbeat = now;
    }
    
    delay(MAIN_LOOP_DELAY);
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
    #ifdef ORG_OBJECT_ID
    DEBUG_SERIAL.print("Organisation ID: ");
    DEBUG_SERIAL.print(ORG_OBJECT_ID);
    DEBUG_SERIAL.println(" (optional - server resolves from deviceId)");
    #endif
    DEBUG_SERIAL.print("MAC Address: ");
    DEBUG_SERIAL.println(getMacAddress());
    DEBUG_SERIAL.print("RFID Version: ");
    DEBUG_SERIAL.println(getRFIDVersion());
    DEBUG_SERIAL.print("Heartbeat Interval: ");
    DEBUG_SERIAL.print(HEARTBEAT_INTERVAL / 1000 / 60);
    DEBUG_SERIAL.println(" minutes");
    DEBUG_SERIAL.println("---------------------");
}

