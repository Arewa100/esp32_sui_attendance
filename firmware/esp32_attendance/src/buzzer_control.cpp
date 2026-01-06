#include "buzzer_control.h"
#include "config.h"

static int buzzerPin = -1;
static bool buzzerInitialized = false;

void initBuzzer(int pin) {
    buzzerPin = pin;
    pinMode(buzzerPin, OUTPUT);
    digitalWrite(buzzerPin, LOW);  // Ensure buzzer is off initially
    buzzerInitialized = true;
    
    #ifdef DEBUG_MODE
    DEBUG_SERIAL.print("Buzzer initialized on pin ");
    DEBUG_SERIAL.println(pin);
    #endif
}

void beep(int duration) {
    if (!buzzerInitialized || buzzerPin < 0) {
        return;
    }
    
    digitalWrite(buzzerPin, HIGH);
    delay(duration);
    digitalWrite(buzzerPin, LOW);
}

void beepSuccess() {
    if (!buzzerInitialized || buzzerPin < 0) {
        return;
    }
    
    // Beep 3 times with short pauses between
    for (int i = 0; i < 3; i++) {
        beep(150);  // 150ms beep
        if (i < 2) {
            delay(100);  // 100ms pause between beeps
        }
    }
}

