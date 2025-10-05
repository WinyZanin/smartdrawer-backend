/**
 * SmartDrawer ESP32 Client
 */

// Bibliotecas necessárias
#include <WiFi.h>
#include <HTTPClient.h>

// Include config file and classes
#include "config.h"
#include "wifiManager.h"
#include "serverConnector.h"
#include "drawerManager.h"

// Initialize classes
WiFiManager wifiManager;
DrawerManager drawerManager;
ServerConnector serverConnector(&drawerManager);

// Polling interval in milliseconds
const unsigned long POLLING_INTERVAL = 5000;  // 5000 = 5 seconds
unsigned long lastPolling = 0;

int errorCount = 0;  // Count consecutive errors

void setup() {
  // Drawers pins setup, pin configuration in config.h
  drawerManager.setupDrawers();

  // Initialize Serial for debugging
  Serial.begin(115200);
  delay(2000);

  Serial.println("=== SmartDrawer ESP32 initialized ===");

  // Step 1: Connect to WiFi
  if (!wifiManager.connect())  // Try to connect to WiFi
  {
    Serial.println("Failed to connect to WiFi, restarting...");
    ESP.restart();
  }

  // Step 2: Test server connectivity
  if (!serverConnector.checkServerHealth()) {
    Serial.println("Server is not reachable, restarting...");
    ESP.restart();
  }

  // Step 3: Perform initial authentication
  if (!serverConnector.authenticate()) {
    Serial.println("Failed initial authentication, restarting...");
    ESP.restart();
  }

  Serial.println("=== Initialization complete! Starting polling ===");
  lastPolling = millis();
}

void loop() {
  // Check if WiFi is still connected, try to reconnect if disconnected
  if (!wifiManager.reconnectIfNeeded()) {
    delay(5000);
    return;
  }

  // Polling for commands at defined interval
  unsigned long currentTime = millis();
  if (currentTime - lastPolling >= POLLING_INTERVAL) {
    Serial.println("--- Starting polling cycle ---");

    // First try to fetch commands
    bool commandsFetched = serverConnector.pollForCommands();

    // error counter, if there are 3 consecutive errors, restart the ESP32
    if (!commandsFetched) {
      errorCount++;
      Serial.printf("Error count: %d\n", errorCount);
      if (errorCount >= 3) {
        Serial.println("Too many consecutive errors, restarting...");
        ESP.restart();
      }
    } else {
      errorCount = 0;  // reset error count on success
    }

    // Then send status (every 3 polling cycles to avoid overload) (not used yet)
    // static int statusCounter = 0;
    // statusCounter++;
    // if (statusCounter >= 3) {
    //  sendStatus();
    //  statusCounter = 0;
    //}

    lastPolling = currentTime;
    Serial.println("--- End of polling cycle ---");
  }

  // Small delay to avoid overloading the processor
  delay(100);
}
