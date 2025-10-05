/**
 * Project configurations
 */

#ifndef CONFIG_H
#define CONFIG_H

// Include necessary libraries
#include <Arduino.h>

// ----------- Config Wi-Fi -----------
const char *ssid = "ssid";
const char *password = "password";

/** Drawer pin definitions
 * example:
 * Drawer 1 -> GPIO 32
 * Drawer 2 -> GPIO 33
 * Drawer 3 -> GPIO 26
 * Drawer 4 -> GPIO 27
 */
const int drawerPins[] = { 32, 33, 26, 27 };
#define duration 500  // time in milliseconds to open/close drawer

// Device credentials
const char *device_id = "cmfbwjda30000u1ogpwwjowkw";
const char *device_jwt_secret = "secret123";

// Server endpoints
const char *serverUrl = "http://192.168.0.120:3000/api/v1";
const char *healthEndpoint = "/health";
const char *authEndpoint = "/auth/device";
const char *statusEndpoint = "/devices/status"; // not used yet
const char *commandsEndpoint = "/devices/";

#endif
