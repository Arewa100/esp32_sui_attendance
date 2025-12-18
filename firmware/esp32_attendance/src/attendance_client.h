#ifndef ATTENDANCE_CLIENT_H
#define ATTENDANCE_CLIENT_H

#include <Arduino.h>

// Send attendance record to server
bool sendAttendanceRecord(
    const char* serverUrl,
    const String& cardId,
    const String& orgObjectId,
    const String& deviceId,
    int timeout = 10000
);

// Get last HTTP response code
int getLastResponseCode();

// Get last server response
String getLastResponse();

#endif // ATTENDANCE_CLIENT_H








