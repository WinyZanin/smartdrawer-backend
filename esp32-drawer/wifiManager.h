#ifndef WIFIMANAGER_H
#define WIFIMANAGER_H

// Include necessary libraries
#include <WiFi.h>

// Include config file
#include "config.h"

/**
 * Class to manage WiFi connection
 */
class WiFiManager {
public:
  // Constructor
  WiFiManager() {
    // Initialize WiFi status
    connected = false;
  }

  /**
   * Connect to WiFi with retry logic,
   * Try 20 times, 500ms interval until connected
   * @return true if connected, false otherwise
   */
  bool connect() {
    WiFi.disconnect(true);  // Disconnect and clear old config
    delay(1000);

    int retries = 0;
    Serial.print("Connecting to WiFi...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    // Retry connection
    while (!isConnected() && retries < 20) {
      delay(500);
      Serial.print(".");
      retries++;
    }

    // Check if connected
    if (isConnected()) {
      Serial.println();
      Serial.println("WiFi connected!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      connected = true;
      return true;
    } else {
      Serial.println();
      Serial.println("Failed to connect to WiFi!");
      connected = false;
      return false;
    }
  }

  /**
   * Check if WiFi is still connected
   * @return true if connected, false otherwise
   */
  bool isConnected() {
    return (WiFi.status() == WL_CONNECTED);
  }

  /**
   * Reconnect if disconnected
   * @return true if connected or reconnected, false otherwise
   */
  bool reconnectIfNeeded() {
    if (!isConnected()) {
      Serial.println("WiFi disconnected! trying to reconnect...");
      return connect();
    }
    return true;
  }

  /**
   * Get current connection status
   * @return true if connected, false otherwise
   */
  bool getConnectionStatus() {
    return connected;
  }

  /**
   * Get local IP address as string
   * @return IP address or "Not connected" if disconnected
   */
  String getLocalIP() {
    if (isConnected()) {
      return WiFi.localIP().toString();
    }
    return "Not connected";
  }

  /**
   * Get WiFi signal strength in dBm
   * @return int signal strength in dBm or 0 if disconnected
   */
  int getSignalStrength() {
    if (isConnected()) {
      return WiFi.RSSI();
    }
    return 0;
  }

  /**
   * Disconnect WiFi
   */
  void disconnect() {
    WiFi.disconnect(true);
    connected = false;
    Serial.println("WiFi disconnected.");
  }

private:
  bool connected;  // Track connection status
};

#endif
