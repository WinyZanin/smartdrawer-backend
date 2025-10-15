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

        // Process the command (confirmation/failure is sent inside processCommand)
        processCommand(response);
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
   * Example command: {"action":"open","drawer":1,"code":"ABC123XYZ"}
   * @param commandJson - JSON string representing the command
   */
  void processCommand(String commandJson) {
    StaticJsonDocument<256> doc;                                     // reserve 256 bytes for the JSON
    DeserializationError error = deserializeJson(doc, commandJson);  // Parse the JSON
    if (error) {
      Serial.print("Error parsing JSON: ");
      Serial.println(error.c_str());

      // If we can't parse, we can't confirm
      return;
    }

    // Extract action, drawer number, and command code
    const char* action = doc["action"];
    int drawer = doc["drawer"] | 0;  // Default to 0 if not present
    const char* code = doc["code"];

    // Validate command has a code (required for tracking)
    if (!code) {
      Serial.println("Invalid command: missing command code");
      return;
    }

    // Validate action
    if (!action) {
      Serial.println("Invalid command: missing action");
      sendCommandFailure(String(code), "Missing action field");
      return;
    }

    Serial.print("Processing command - Code: ");
    Serial.print(code);
    Serial.print(", Action: ");
    Serial.print(action);
    Serial.print(", Drawer: ");
    Serial.println(drawer);

    // Execute command based on action
    bool success = false;
    String errorMsg = "";

    if (strcmp(action, "open") == 0 || strcmp(action, "open_drawer") == 0) {
      if (drawer == 0) {
        errorMsg = "Invalid drawer number (must be >= 1)";
        Serial.println("Error: " + errorMsg);
      } else if (!drawerManager->isValidDrawer(drawer)) {
        errorMsg = "Drawer " + String(drawer) + " does not exist (valid: 1-" + String(sizeof(drawerPins) / sizeof(drawerPins[0])) + ")";
        Serial.println("Error: " + errorMsg);
      } else {
        success = drawerManager->openDrawer(drawer);  // Send command to DrawerManager
        if (!success) {
          errorMsg = "Hardware failure opening drawer " + String(drawer);
          Serial.println("Error: " + errorMsg);
        }
      }
    } else if (strcmp(action, "close") == 0) {
      // Add close logic here if needed
      Serial.println("Close action not yet implemented");
      errorMsg = "Action not implemented: close";
    } else {
      Serial.print("Unknown action: ");
      Serial.println(action);
      errorMsg = "Unknown action: " + String(action);
    }

    // Send confirmation or failure to server
    if (success) {
      sendCommandConfirmation(String(code));
    } else {
      sendCommandFailure(String(code), errorMsg);
    }
  }

  /**
   * Send command execution confirmation to the server
   * Uses the new tracking system with unique command codes
   * @param commandCode - Unique code of the command to confirm as executed
   */
  void sendCommandConfirmation(const String commandCode) {
    if (jwtToken == "") {
      Serial.println("No token, skipping command confirmation...");
      return;
    }

    HTTPClient http;
    // New endpoint: POST /commands/:code/execute
    String confirmUrl = String(serverUrl) + "/commands/" + commandCode + "/execute";

    if (http.begin(confirmUrl)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", "Bearer " + jwtToken);

      // Send POST request (empty body is fine for this endpoint)
      String payload = "{}";
      int code = http.POST(payload);

      if (code == 200) {
        Serial.println("✓ Command marked as EXECUTED on server (code: " + commandCode + ")");
      } else if (code == 401 || code == 403) {
        Serial.println("Invalid/expired token. Reauthenticating...");
        jwtToken = "";
        authenticate();
      } else if (code == 404) {
        Serial.println("✗ Command not found on server (code: " + commandCode + ")");
      } else if (code == 400) {
        Serial.println("✗ Command already processed (code: " + commandCode + ")");
        Serial.println("Response: " + http.getString());
      } else {
        Serial.printf("✗ Error confirming command (HTTP %d): ", code);
        Serial.println(http.getString());
      }
      http.end();
    } else {
      Serial.println("✗ Failed to connect to confirmation endpoint");
    }
  }

  /**
   * Send command failure notification to the server
   * Uses the new tracking system with unique command codes
   * @param commandCode - Unique code of the command that failed
   * @param errorMessage - Description of why the command failed
   */
  void sendCommandFailure(const String commandCode, const String errorMessage) {
    if (jwtToken == "") {
      Serial.println("No token, skipping command failure report...");
      return;
    }

    HTTPClient http;
    // New endpoint: POST /commands/:code/fail
    String failUrl = String(serverUrl) + "/commands/" + commandCode + "/fail";

    if (http.begin(failUrl)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", "Bearer " + jwtToken);

      // Send error message in the body
      String payload = "{\"errorMessage\":\"" + errorMessage + "\"}";
      int code = http.POST(payload);

      if (code == 200) {
        Serial.println("✓ Command marked as FAILED on server (code: " + commandCode + ")");
        Serial.println("  Reason: " + errorMessage);
      } else if (code == 401 || code == 403) {
        Serial.println("Invalid/expired token. Reauthenticating...");
        jwtToken = "";
        authenticate();
      } else if (code == 404) {
        Serial.println("✗ Command not found on server (code: " + commandCode + ")");
      } else if (code == 400) {
        Serial.println("✗ Command already processed (code: " + commandCode + ")");
        Serial.println("Response: " + http.getString());
      } else {
        Serial.printf("✗ Error reporting failure (HTTP %d): ", code);
        Serial.println(http.getString());
      }
      http.end();
    } else {
      Serial.println("✗ Failed to connect to failure endpoint");
    }
  }

private:
  String jwtToken;               // Stores the JWT token
  DrawerManager* drawerManager;  // Pointer to DrawerManager instance
};

#endif
