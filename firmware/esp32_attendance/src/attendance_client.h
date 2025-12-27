#ifndef ATTENDANCE_CLIENT_H
#define ATTENDANCE_CLIENT_H

#include <Arduino.h>

// Send attendance record to server
// orgObjectId is now optional (can be resolved from deviceId on server)
bool sendAttendanceRecord(
    const char* serverUrl,
    const String& cardId,
    const String& deviceId,
    const String& orgObjectId = "",  // Optional, for backward compatibility
    int timeout = 10000
);

// Send device heartbeat to server
bool sendDeviceHeartbeat(
    const char* serverUrl,
    const String& deviceId,
    int timeout = 10000
);

// Get last HTTP response code
int getLastResponseCode();

// Get last server response
String getLastResponse();

#endif // ATTENDANCE_CLIENT_H












