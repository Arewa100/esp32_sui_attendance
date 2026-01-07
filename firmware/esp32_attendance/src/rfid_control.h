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

// Direct card detection (matches card_uid_checker logic)
bool checkCardPresentDirect();

// Direct card ID reading (matches card_uid_checker - reads immediately after detection)
String getCardIdDirect();

#endif // RFID_CONTROL_H












