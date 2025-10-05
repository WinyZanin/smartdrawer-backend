#ifndef SERVERCONNECTOR_H
#define SERVERCONNECTOR_H

// Include necessary libraries
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Include config file
#include "config.h"
#include "drawerManager.h"

/**
 * Class to manage server connection, authentication, and command polling
 */
class ServerConnector {
public:
  // Constructor
  ServerConnector(DrawerManager* drawerManager) {
    this->jwtToken = "";                  // Initialize JWT token as empty
    this->drawerManager = drawerManager;  // Store pointer to DrawerManager instance
  }

  /**
   * Check server health,
   * try 10 times, 1 second interval until success
   * @return true if server is operational, false otherwise
   */
  bool checkServerHealth() {
    HTTPClient http;
    Serial.print("Testing server connectivity...");

    // Retry logic
    int retries = 0;
    while (retries < 10) {
      if (http.begin(String(serverUrl) + healthEndpoint)) {
        int code = http.GET();
        http.end();

        if (code == 200) {
          Serial.println();
          Serial.println("Server is operational!");
          return true;
        }
      }

      Serial.print(".");
      delay(1000);
      retries++;
    }

    // After retries, failed
    Serial.println();
    Serial.println("Server is not responding!");
    return false;
  }

  /**
   * Authenticate with the server to obtain the JWT token
   * @return true if authentication is successful, false otherwise
   */
  bool authenticate() {
    HTTPClient http;
    Serial.println("Starting authentication...");

    // Connect to authentication endpoint
    if (http.begin(String(serverUrl) + authEndpoint)) {
      http.addHeader("Content-Type", "application/json");

      String payload = String("{\"device_id\":\"") + device_id + "\",\"secret\":\"" + device_jwt_secret + "\"}";
      int code = http.POST(payload);

      // Handle response
      if (code == 200) {
        // Handle response success from server
        String response = http.getString();
        Serial.println("Response from authentication: " + response);

        // Simple JSON parsing to extract the token
        int start = response.indexOf("\"token\":\"") + 9;
        int end = response.indexOf("\"", start);

        // If token found, store it
        if (start > 8 && end > start) {
          jwtToken = response.substring(start, end);
          Serial.println("JWT token obtained successfully!");
          Serial.println("Token: " + jwtToken.substring(0, 20) + "...");
          http.end();
          return true;
        } else {
          Serial.println("Error extracting token from response");
        }
      } else {
        // Handle response error from server
        Serial.printf("Authentication error - Code: %d\n", code);
        Serial.println("Response: " + http.getString());
      }
      http.end();
    } else {
      Serial.println("Error connecting to authentication endpoint");
    }
    return false;
  }

  /**
   * Send the current device status to the server
   * (not used yet)
   */
  void sendStatus() {
    if (jwtToken == "") {
      Serial.println("No token, skipping status send...");
      return;
    }

    HTTPClient http;
    if (http.begin(String(serverUrl) + statusEndpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", "Bearer " + jwtToken);

      String payload = "{\"status\":\"ACTIVE\",\"message\":\"Device operating normally\",\"timestamp\":\"" + String(millis()) + "\"}";
      int code = http.POST(payload);

      if (code == 200) {
        Serial.println("Status sent successfully!");
      } else if (code == 401 || code == 403) {
        Serial.println("Invalid/expired token. Reauthenticating...");
        jwtToken = "";
        authenticate();
      } else {
        Serial.printf("Error sending status: %d\n", code);
        Serial.println("Response: " + http.getString());
      }
      http.end();
    }
  }

  /**
   * Poll for new commands from the server
   * and process them as needed
   * @return true if polling was attempted, false if skipped due to no token
   */
  bool pollForCommands() {
    if (jwtToken == "") {
      Serial.println("No token, skipping command polling...");
      return false;
    }

    // Connect to commands endpoint sending polling request to the server
    HTTPClient http;
    String pollUrl = String(serverUrl) + commandsEndpoint + device_id + "/next-command";

    // Begin connection to the polling URL
    if (http.begin(pollUrl)) {
      http.addHeader("Authorization", "Bearer " + jwtToken);

      int code = http.GET();

      if (code == 200) {
        // Handle response success from server
        String response = http.getString();
        Serial.println("Command received: " + response);

        // Here you can add logic to process the command
        processCommand(response);

        // Send command confirmation back to server
        sendCommandConfirmation(response);
      } else if (code == 204) {
        // No command available
        Serial.println("No pending command");
      } else if (code == 401 || code == 403) {
        // Token expired during polling. Reauthenticating...
        Serial.println("Token expired during polling. Reauthenticating...");
        jwtToken = "";
        authenticate();
        return false;
      } else {
        // Handle other HTTP errors
        Serial.printf("Error during polling: %d\n", code);
        Serial.println("Response: " + http.getString());
        return false;
      }
      http.end();
    }
    return true;
  }

  /**
   * Process the received command JSON
   * Example command: {"action":"open_drawer","drawer":1}
   * @param commandJson - JSON string representing the command
   */
  void processCommand(String commandJson) {
    StaticJsonDocument<256> doc;                                     // reserve 256 bytes for the JSON
    DeserializationError error = deserializeJson(doc, commandJson);  // Parse the JSON
    if (error) {
      Serial.print("Error parsing JSON: ");
      Serial.println(error.c_str());
      return;
    }

    // Extract action and drawer number
    // can add more logic here for different actions or commands
    const char* action = doc["action"];
    int drawer = doc["drawer"];

    // Validate command
    if (!action || drawer == 0) {
      Serial.println("Invalid command: missing action or drawer");
      return;
    }

    // Execute command
    if (strcmp(action, "open_drawer") == 0) {
      drawerManager->openDrawer(drawer);  //send command to DrawerManager
    } else {
      Serial.print("Unknown action: ");
      Serial.println(action);
    }
  }

  /**
   * Send command execution confirmation to the server
   * @param commandId - ID of the command to confirm
   */
  void sendCommandConfirmation(const String command) {
    if (jwtToken == "") {
      Serial.println("No token, skipping command confirmation...");
      return;
    }

    HTTPClient http;
    String confirmUrl = String(serverUrl) + commandsEndpoint + device_id + "/commandconfirm";

    if (http.begin(confirmUrl)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", "Bearer " + jwtToken);

      //String payload = "{\"command\":\"" + command + "\",\"status\":\"executed\",\"timestamp\":\"" + String(millis()) + "\"}";
      int code = http.POST(command);

      if (code == 200) {
        Serial.println("Command confirmation sent successfully!");
      } else if (code == 401 || code == 403) {
        Serial.println("Invalid/expired token. Reauthenticating...");
        jwtToken = "";
        authenticate();
      } else {
        Serial.printf("Error sending command confirmation: %d\n", code);
        Serial.println("Response: " + http.getString());
      }
      http.end();
    }
  }

private:
  String jwtToken;               // Stores the JWT token
  DrawerManager* drawerManager;  // Pointer to DrawerManager instance
};

#endif
