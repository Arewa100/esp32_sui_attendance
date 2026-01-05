#include "attendance_client.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "wifi_control.h"

static int lastResponseCode = 0;
static char lastResponse[HTTP_MAX_RESPONSE_SIZE + 1] = "";  // Fixed-size buffer

bool sendAttendanceRecord(
    const char* serverUrl,
    const String& cardId,
    const String& deviceId,
    const String& orgObjectId,
    int timeout
) {
    // Input validation
    if (cardId.length() == 0 || cardId.length() > MAX_CARD_ID_LENGTH) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("Invalid cardId length");
        #endif
        lastResponseCode = -1;
        strncpy(lastResponse, "Invalid cardId", sizeof(lastResponse) - 1);
        lastResponse[sizeof(lastResponse) - 1] = '\0';
        return false;
    }
    
    if (deviceId.length() == 0 || deviceId.length() > MAX_DEVICE_ID_LENGTH) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("Invalid deviceId length");
        #endif
        lastResponseCode = -1;
        strncpy(lastResponse, "Invalid deviceId", sizeof(lastResponse) - 1);
        lastResponse[sizeof(lastResponse) - 1] = '\0';
        return false;
    }
    
    // Check WiFi connection
    if (!isWiFiConnected()) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("WiFi not connected. Cannot send attendance record.");
        #endif
        lastResponseCode = -1;
        strncpy(lastResponse, "WiFi not connected", sizeof(lastResponse) - 1);
        lastResponse[sizeof(lastResponse) - 1] = '\0';
        return false;
    }
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.println("\nSending attendance record to server...");
    DEBUG_SERIAL.print("Card ID: ");
    DEBUG_SERIAL.println(cardId);
    DEBUG_SERIAL.print("Device ID: ");
    DEBUG_SERIAL.println(deviceId);
    if (orgObjectId.length() > 0) {
        DEBUG_SERIAL.print("Organisation: ");
        DEBUG_SERIAL.print(orgObjectId);
        DEBUG_SERIAL.println(" (optional)");
    }
    #endif
    
    // Build JSON payload using ArduinoJson v7 (uses JsonDocument)
    // JsonDocument in v7 uses dynamic allocation automatically
    JsonDocument doc;
    doc["cardId"] = cardId;
    doc["deviceId"] = deviceId;
    if (orgObjectId.length() > 0) {
        doc["orgObjectId"] = orgObjectId;
    }
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.print("Payload: ");
    DEBUG_SERIAL.println(jsonPayload);
    #endif
    
    // Retry logic with exponential backoff
    for (int attempt = 0; attempt < HTTP_MAX_RETRIES; attempt++) {
        HTTPClient http;
        
        // Begin HTTP connection
        if (!http.begin(serverUrl)) {
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.println("HTTP begin failed");
            #endif
            if (attempt < HTTP_MAX_RETRIES - 1) {
                delay(HTTP_RETRY_DELAY * (1 << attempt));  // Exponential backoff
                continue;
            }
            lastResponseCode = -1;
            strncpy(lastResponse, "HTTP begin failed", sizeof(lastResponse) - 1);
            lastResponse[sizeof(lastResponse) - 1] = '\0';
            return false;
        }
        
        http.addHeader("Content-Type", "application/json");
        http.setTimeout(timeout);
        
        // Send POST request
        lastResponseCode = http.POST(jsonPayload);
        
        // Process response
        if (lastResponseCode > 0) {
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.print("HTTP Response code: ");
            DEBUG_SERIAL.println(lastResponseCode);
            #endif
            
            // Read response with size limit
            WiFiClient* stream = http.getStreamPtr();
            if (stream) {
                String response = stream->readStringUntil('\n');
                if (response.length() > HTTP_MAX_RESPONSE_SIZE) {
                    response = response.substring(0, HTTP_MAX_RESPONSE_SIZE);
                }
                strncpy(lastResponse, response.c_str(), sizeof(lastResponse) - 1);
                lastResponse[sizeof(lastResponse) - 1] = '\0';
            } else {
                strncpy(lastResponse, "No response stream", sizeof(lastResponse) - 1);
                lastResponse[sizeof(lastResponse) - 1] = '\0';
            }
            
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.print("Response: ");
            DEBUG_SERIAL.println(lastResponse);
            #endif
            
            // Check if successful
            if (lastResponseCode == 200) {
                #ifdef DEBUG_MODE
                DEBUG_SERIAL.println("Attendance record sent successfully!");
                DEBUG_SERIAL.println("Server is processing the transaction...");
                #endif
                http.end();
                return true;
            } else {
                #ifdef DEBUG_MODE
                DEBUG_SERIAL.print("Server returned error code: ");
                DEBUG_SERIAL.println(lastResponseCode);
                #endif
                http.end();
                // Retry on server errors (5xx) but not client errors (4xx)
                if (lastResponseCode >= 500 && attempt < HTTP_MAX_RETRIES - 1) {
                    delay(HTTP_RETRY_DELAY * (1 << attempt));
                    continue;
                }
                return false;
            }
        } else {
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.print("HTTP Error: ");
            DEBUG_SERIAL.println(lastResponseCode);
            String errorMsg = "Error: " + String(http.errorToString(lastResponseCode));
            strncpy(lastResponse, errorMsg.c_str(), sizeof(lastResponse) - 1);
            lastResponse[sizeof(lastResponse) - 1] = '\0';
            DEBUG_SERIAL.println(lastResponse);
            #endif
            http.end();
            // Retry on network errors
            if (attempt < HTTP_MAX_RETRIES - 1) {
                delay(HTTP_RETRY_DELAY * (1 << attempt));
                continue;
            }
            return false;
        }
    }
    
    return false;
}

int getLastResponseCode() {
    return lastResponseCode;
}

String getLastResponse() {
    return String(lastResponse);
}

bool sendDeviceHeartbeat(
    const char* serverUrl,
    const String& deviceId,
    int timeout
) {
    // Input validation
    if (deviceId.length() == 0 || deviceId.length() > MAX_DEVICE_ID_LENGTH) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("Invalid deviceId length for heartbeat");
        #endif
        lastResponseCode = -1;
        strncpy(lastResponse, "Invalid deviceId", sizeof(lastResponse) - 1);
        lastResponse[sizeof(lastResponse) - 1] = '\0';
        return false;
    }
    
    // Check WiFi connection
    if (!isWiFiConnected()) {
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.println("WiFi not connected. Cannot send heartbeat.");
        #endif
        lastResponseCode = -1;
        strncpy(lastResponse, "WiFi not connected", sizeof(lastResponse) - 1);
        lastResponse[sizeof(lastResponse) - 1] = '\0';
        return false;
    }
    
    // Construct heartbeat endpoint URL more efficiently
    String baseUrl = String(serverUrl);
    // Remove /api/attendance if present
    int attendancePos = baseUrl.indexOf("/api/attendance");
    if (attendancePos >= 0) {
        baseUrl = baseUrl.substring(0, attendancePos);
    }
    
    // Build heartbeat URL
    String heartbeatUrl = baseUrl + "/api/devices/" + deviceId + "/heartbeat";
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.println("\nSending device heartbeat to server...");
    DEBUG_SERIAL.print("Device ID: ");
    DEBUG_SERIAL.println(deviceId);
    DEBUG_SERIAL.print("URL: ");
    DEBUG_SERIAL.println(heartbeatUrl);
    #endif
    
    // Retry logic with exponential backoff
    for (int attempt = 0; attempt < HTTP_MAX_RETRIES; attempt++) {
        HTTPClient http;
        
        // Begin HTTP connection
        if (!http.begin(heartbeatUrl)) {
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.println("HTTP begin failed for heartbeat");
            #endif
            if (attempt < HTTP_MAX_RETRIES - 1) {
                delay(HTTP_RETRY_DELAY * (1 << attempt));
                continue;
            }
            lastResponseCode = -1;
            strncpy(lastResponse, "HTTP begin failed", sizeof(lastResponse) - 1);
            lastResponse[sizeof(lastResponse) - 1] = '\0';
            return false;
        }
        
        http.addHeader("Content-Type", "application/json");
        http.setTimeout(timeout);
        
        // Build JSON payload using ArduinoJson v7 (uses JsonDocument)
        // JsonDocument in v7 uses dynamic allocation automatically
        JsonDocument doc;
        String jsonPayload;
        serializeJson(doc, jsonPayload);
        
        #ifdef DEBUG_MODE
        DEBUG_SERIAL.print("Payload: ");
        DEBUG_SERIAL.println(jsonPayload);
        #endif
        
        // Send POST request
        lastResponseCode = http.POST(jsonPayload);
        
        // Process response
        if (lastResponseCode > 0) {
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.print("HTTP Response code: ");
            DEBUG_SERIAL.println(lastResponseCode);
            #endif
            
            // Read response with size limit
            WiFiClient* stream = http.getStreamPtr();
            if (stream) {
                String response = stream->readStringUntil('\n');
                if (response.length() > HTTP_MAX_RESPONSE_SIZE) {
                    response = response.substring(0, HTTP_MAX_RESPONSE_SIZE);
                }
                strncpy(lastResponse, response.c_str(), sizeof(lastResponse) - 1);
                lastResponse[sizeof(lastResponse) - 1] = '\0';
            } else {
                strncpy(lastResponse, "No response stream", sizeof(lastResponse) - 1);
                lastResponse[sizeof(lastResponse) - 1] = '\0';
            }
            
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.print("Response: ");
            DEBUG_SERIAL.println(lastResponse);
            #endif
            
            // Check if successful
            if (lastResponseCode == 200) {
                #ifdef DEBUG_MODE
                DEBUG_SERIAL.println("Heartbeat sent successfully!");
                #endif
                http.end();
                return true;
            } else {
                #ifdef DEBUG_MODE
                DEBUG_SERIAL.print("Server returned error code: ");
                DEBUG_SERIAL.println(lastResponseCode);
                #endif
                http.end();
                // Retry on server errors (5xx) but not client errors (4xx)
                if (lastResponseCode >= 500 && attempt < HTTP_MAX_RETRIES - 1) {
                    delay(HTTP_RETRY_DELAY * (1 << attempt));
                    continue;
                }
                return false;
            }
        } else {
            #ifdef DEBUG_MODE
            DEBUG_SERIAL.print("HTTP Error: ");
            DEBUG_SERIAL.println(lastResponseCode);
            String errorMsg = "Error: " + String(http.errorToString(lastResponseCode));
            strncpy(lastResponse, errorMsg.c_str(), sizeof(lastResponse) - 1);
            lastResponse[sizeof(lastResponse) - 1] = '\0';
            DEBUG_SERIAL.println(lastResponse);
            #endif
            http.end();
            // Retry on network errors
            if (attempt < HTTP_MAX_RETRIES - 1) {
                delay(HTTP_RETRY_DELAY * (1 << attempt));
                continue;
            }
            return false;
        }
    }
    
    return false;
}

