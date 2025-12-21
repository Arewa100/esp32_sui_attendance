#ifndef WIFI_CONTROL_H
#define WIFI_CONTROL_H

#include <Arduino.h>

bool initWiFi(const char* ssid, const char* password);

bool isWiFiConnected();

// Get WiFi signal strength (RSSI)
int getWiFiRSSI();

// Get device MAC address
String getMacAddress();

// Get device IP address
String getWiFiIP();

#endif // WIFI_CONTROL_H












