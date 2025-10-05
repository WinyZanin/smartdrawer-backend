#ifndef DRAWERMANAGER_H
#define DRAWERMANAGER_H

#include <Arduino.h>
#include "config.h"

/**
 * Class to manage drawer operations
 */
class DrawerManager {
public:
  DrawerManager() {}

  /**
   * Configures the drawer pins
   */
  void setupDrawers() {
    for (int i = 0; i < sizeof(drawerPins) / sizeof(drawerPins[0]); i++) {
      pinMode(drawerPins[i], OUTPUT);
      digitalWrite(drawerPins[i], HIGH);  // Initially closed
    }
  }

  /**
   * Checks if the drawer number is valid
   * @param drawerNumber - Drawer number (1-based)
   * @return true if valid, false otherwise
   */
  bool isValidDrawer(int drawerNumber) {
    return (drawerNumber >= 1 && drawerNumber <= (int)(sizeof(drawerPins) / sizeof(drawerPins[0])));
  }

  /**
   * Opens the specified drawer
   * @param drawerIndex - Drawer index (1-based)
   * @return true if the operation was successful, false otherwise
   */
  bool openDrawer(int drawerIndex) {
    if (drawerIndex < 1 || drawerIndex > (int)(sizeof(drawerPins) / sizeof(drawerPins[0]))) {
      Serial.print("Invalid drawer: ");
      Serial.println(drawerIndex);
      return false;
    }
    int pin = drawerPins[drawerIndex - 1];  // Drawer 1 = index 0
    Serial.printf("Opening drawer: %d, pin: %d\n", drawerIndex, pin);
    digitalWrite(pin, LOW);  // LOW = open
    delay(duration);
    digitalWrite(pin, HIGH);  // Close after duration
    return true;
  }
};

#endif
