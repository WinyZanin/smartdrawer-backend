#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "JWT.h"  // pode usar lib ArduinoJWT ou implementar HS256 manual

// ===== CONFIGURAÇÃO =====
const char* ssid = "SeuWiFi";
const char* password = "SenhaWiFi";

const char* backendUrl = "http://192.168.0.10:3000/api/v1"; // backend
String deviceId = "device-123";
String jwtSecret = "segredo_do_dispositivo";

// ===== FUNÇÃO GERAR TOKEN =====
String generateJWT() {
  JWT jwt;
  jwt.setHS256Secret(jwtSecret);

  // claims
  jwt.addClaim("sub", deviceId);
  jwt.addClaim("iat", (long)time(nullptr));
  jwt.addClaim("exp", (long)time(nullptr) + 60); // expira em 60s

  return jwt.encode();
}

// ===== FUNÇÃO ENVIAR EVENTO =====
void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String token = generateJWT();

    String url = String(backendUrl) + "/devices/" + deviceId + "/events";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + token);

    // JSON de payload
    StaticJsonDocument<200> doc;
    doc["type"] = "DEVICE_HEARTBEAT";
    JsonObject payload = doc.createNestedObject("payload");
    payload["uptime"] = millis();
    payload["temp"] = 32.5;

    String body;
    serializeJson(doc, body);

    int httpCode = http.POST(body);
    if (httpCode > 0) {
      Serial.printf("Heartbeat enviado, resposta: %d\n", httpCode);
    } else {
      Serial.printf("Erro ao enviar heartbeat: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  }
}

// ===== LOOP =====
void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" conectado!");
}

void loop() {
  sendHeartbeat();
  delay(10000); // manda a cada 10s
}
