#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "JWT.h"

// ===== CONFIGURAÇÃO =====
const char* ssid = "SeuWiFi";
const char* password = "SenhaWiFi";

const char* backendUrl = "http://192.168.0.10:3000/api/v1";
String deviceId = "device-123";
String jwtSecret = "segredo_do_dispositivo";

// ===== PINO DO RELÉ =====
const int RELAY_PIN = 5;

// ===== FUNÇÃO GERAR TOKEN =====
String generateJWT() {
  JWT jwt;
  jwt.setHS256Secret(jwtSecret);
  jwt.addClaim("sub", deviceId);
  jwt.addClaim("iat", (long)time(nullptr));
  jwt.addClaim("exp", (long)time(nullptr) + 60);
  return jwt.encode();
}

// ===== ENVIAR EVENTO DE LOG =====
void sendEvent(String type, String message) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String token = generateJWT();
    String url = String(backendUrl) + "/devices/" + deviceId + "/events";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + token);

    StaticJsonDocument<200> doc;
    doc["type"] = type;
    doc["message"] = message;

    String body;
    serializeJson(doc, body);

    int httpCode = http.POST(body);
    http.end();
    Serial.printf("Evento enviado (%s): %d\n", type.c_str(), httpCode);
  }
}

// ===== POLLING DE COMANDOS =====
void checkCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String token = generateJWT();

    String url = String(backendUrl) + "/devices/" + deviceId + "/next-commands";
    http.begin(url);
    http.addHeader("Authorization", "Bearer " + token);

    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        for (JsonObject cmd : doc.as<JsonArray>()) {
          String type = cmd["type"];
          int drawer = cmd["params"]["drawer"] | -1;

          if (type == "OPEN_DRAWER") {
            digitalWrite(RELAY_PIN, HIGH);  // abre
            delay(2000);
            digitalWrite(RELAY_PIN, LOW);   // desliga
            sendEvent("COMMAND_EXECUTED", "Drawer " + String(drawer) + " aberto");
          }
          else if (type == "LOCK_DRAWER") {
            // poderia acionar outro pino ou lógica inversa
            sendEvent("COMMAND_EXECUTED", "Drawer " + String(drawer) + " trancado");
          }
        }
      }
    }
    http.end();
  }
}

// ===== SETUP E LOOP =====
void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" conectado!");
}

void loop() {
  checkCommands();   // busca comandos
  delay(10000);      // a cada 10s
}
