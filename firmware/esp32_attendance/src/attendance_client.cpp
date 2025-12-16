#include "attendance_client.h"
#include <HTTPClient.h>
#include "wifi_control.h"

static int lastResponseCode = 0;
static String lastResponse = "";

bool sendAttendanceRecord(
    const char* serverUrl,
    const String& cardId,
    const String& orgObjectId,
    const String& deviceId,
    int timeout
) {
    // Check WiFi connection
    if (!isWiFiConnected()) {
        Serial.println("WiFi not connected. Cannot send attendance record.");
        lastResponseCode = -1;
        lastResponse = "WiFi not connected";
        return false;
    }
    
    Serial.println("\nSending attendance record to server...");
    Serial.println("Card ID: " + cardId);
    Serial.println("Organisation: " + orgObjectId);
    Serial.println("Device ID: " + deviceId);
    
    HTTPClient http;
    
    // Begin HTTP connection
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(timeout);
    
    // Build JSON payload
    String jsonPayload = "{";
    jsonPayload += "\"cardId\":\"" + cardId + "\",";
    jsonPayload += "\"orgObjectId\":\"" + orgObjectId + "\",";
    jsonPayload += "\"deviceId\":\"" + deviceId + "\"";
    jsonPayload += "}";
    
    Serial.println("Payload: " + jsonPayload);
    
    // Send POST request
    lastResponseCode = http.POST(jsonPayload);
    
    // Process response
    if (lastResponseCode > 0) {
        Serial.print("HTTP Response code: ");
        Serial.println(lastResponseCode);
        
        lastResponse = http.getString();
        Serial.println("Response: " + lastResponse);
        
        // Check if successful
        if (lastResponseCode == 200) {
            Serial.println("Attendance record sent successfully!");
            Serial.println("Server is processing the transaction...");
            http.end();
            return true;
        } else {
            Serial.print("Server returned error code: ");
            Serial.println(lastResponseCode);
            http.end();
            return false;
        }
    } else {
        Serial.print("HTTP Error: ");
        Serial.println(lastResponseCode);
        lastResponse = "Error: " + http.errorToString(lastResponseCode);
        Serial.println(lastResponse);
        http.end();
        return false;
    }
}

int getLastResponseCode() {
    return lastResponseCode;
}

String getLastResponse() {
    return lastResponse;
}

