#ifndef RFID_CONTROL_H
#define RFID_CONTROL_H

#include <Arduino.h>

void initRFID(int ssPin, int rstPin);
bool isRFIDReady();

bool isCardPresent();

// Read card and get card ID
String getCardId();

// Get RFID module firmware version
String getRFIDVersion();

#endif // RFID_CONTROL_H









