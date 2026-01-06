#ifndef BUZZER_CONTROL_H
#define BUZZER_CONTROL_H

#include <Arduino.h>

// Initialize buzzer
void initBuzzer(int pin);

// Single beep
void beep(int duration = 100);

// Success beep pattern (3 beeps)
void beepSuccess();

#endif // BUZZER_CONTROL_H

