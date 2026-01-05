#include "wifi_control.h"
#include "config.h"
#include <WiFi.h>

bool initWiFi(const char* ssid, const char* password) {
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.print("Connecting to WiFi: ");
    DEBUG_SERIAL.println(ssid);
    #endif
    
    // Disconnect existing connection if any
    if (WiFi.status() == WL_CONNECTED) {
        WiFi.disconnect();
        delay(100);
    }
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    
    // Use waitForConnectResult with timeout for less blocking behavior
    unsigned long startTime = millis();
    wl_status_t status = WiFi.status();
    
    while (status != WL_CONNECTED && (millis() - startTime) < WIFI_CONNECT_TIMEOUT) {
        delay(500);
        status = WiFi.status();
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.print(".");
        #endif
    }
    
    if (status == WL_CONNECTED) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("\nWiFi connected!");
        DEBUG_SERIAL.print("IP Address: ");
        DEBUG_SERIAL.println(WiFi.localIP());
        DEBUG_SERIAL.print("Signal Strength (RSSI): ");
        DEBUG_SERIAL.print(WiFi.RSSI());
        DEBUG_SERIAL.println(" dBm");
        #endif
        return true;
    } else {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("\nWiFi connection failed!");
        DEBUG_SERIAL.println("Please check your credentials.");
        #endif
        return false;
    }
}

bool isWiFiConnected() {
    return WiFi.status() == WL_CONNECTED;
}

int getWiFiRSSI() {
    return WiFi.RSSI();
}

String getMacAddress() {
    return WiFi.macAddress();
}

String getWiFiIP() {
    return WiFi.localIP().toString();
}

