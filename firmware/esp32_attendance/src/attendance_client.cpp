#include "attendance_client.h"
#include <HTTPClient.h>
#include "wifi_control.h"

static int lastResponseCode = 0;
static String lastResponse = "";

bool sendAttendanceRecord(
    const char* serverUrl,
    const String& cardId,
    const String& deviceId,
    const String& orgObjectId,
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
    Serial.println("Device ID: " + deviceId);
    if (orgObjectId.length() > 0) {
        Serial.println("Organisation: " + orgObjectId + " (optional)");
    }
    
    HTTPClient http;
    
    // Begin HTTP connection
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(timeout);
    
    // Build JSON payload (orgObjectId is optional, server can resolve from deviceId)
    String jsonPayload = "{";
    jsonPayload += "\"cardId\":\"" + cardId + "\",";
    jsonPayload += "\"deviceId\":\"" + deviceId + "\"";
    if (orgObjectId.length() > 0) {
        jsonPayload += ",\"orgObjectId\":\"" + orgObjectId + "\"";  // Optional, for backward compatibility
    }
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

bool sendDeviceHeartbeat(
    const char* serverUrl,
    const String& deviceId,
    int timeout
) {
    // Check WiFi connection
    if (!isWiFiConnected()) {
        Serial.println("WiFi not connected. Cannot send heartbeat.");
        lastResponseCode = -1;
        lastResponse = "WiFi not connected";
        return false;
    }
    
    // Extract base URL and construct heartbeat endpoint
    String baseUrl = String(serverUrl);
    // Remove /api/attendance if present, then add /api/devices/:deviceId/heartbeat
    baseUrl.replace("/api/attendance", "");
    String heartbeatUrl = baseUrl + "/api/devices/" + deviceId + "/heartbeat";
    
    Serial.println("\nSending device heartbeat to server...");
    Serial.println("Device ID: " + deviceId);
    Serial.println("URL: " + heartbeatUrl);
    
    HTTPClient http;
    
    // Begin HTTP connection
    http.begin(heartbeatUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(timeout);
    
    // Build JSON payload (optional timestamp, server will use current time if not provided)
    String jsonPayload = "{}";
    
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
            Serial.println("Heartbeat sent successfully!");
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

