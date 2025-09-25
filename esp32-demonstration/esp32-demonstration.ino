#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ----------- Config Wi-Fi ----------
const char *ssid = "ALDEIA DA FOLHA_2.4G";
const char *password = "qwertyuiop";

// ---- CONFIGURAÇÕES ----
// Credenciais do dispositivo
const char *device_id = "cmfbwjda30000u1ogpwwjowkw";
const char *device_secret = "secret123";

// Endpoints do servidor
const char *serverUrl = "http://192.168.0.120:3000/api/v1";
const char *healthEndpoint = "/health";
const char *authEndpoint = "/auth/device";
const char *statusEndpoint = "/devices/status";
const String commandsEndpoint = String("/devices/") + device_id + "/next-command";

// JWT armazenado
String jwtToken = "";

// Intervalo de polling (em milissegundos)
const unsigned long POLLING_INTERVAL = 5000; // 5 segundos
unsigned long lastPolling = 0;

void connectWiFi()
{
  WiFi.disconnect(true); // Desconecta e limpa config antiga
  delay(1000);

  int retries = 0;
  Serial.print("Conectando ao WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED && retries < 20)
  {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("Falha na conexão WiFi!");
  }
}

bool checkServerHealth()
{
  HTTPClient http;
  Serial.print("Testando conectividade com servidor...");

  int retries = 0;
  while (retries < 10) {
    if (http.begin(String(serverUrl) + healthEndpoint)) {
      int code = http.GET();
      http.end();

      if (code == 200) {
        Serial.println();
        Serial.println("Servidor está operacional!");
        return true;
      }
    }

    Serial.print(".");
    delay(1000);
    retries++;
  }

  Serial.println();
  Serial.println("Servidor não está respondendo!");
  return false;
}

bool authenticate()
{
  HTTPClient http;
  Serial.println("Iniciando autenticação...");

  if (http.begin(String(serverUrl) + authEndpoint)) {
    http.addHeader("Content-Type", "application/json");

    String payload = String("{\"device_id\":\"") + device_id + "\",\"secret\":\"" + device_secret + "\"}";
    int code = http.POST(payload);

    if (code == 200) {
      String response = http.getString();
      Serial.println("Resposta de autenticação: " + response);

      // Parse simples do JSON para extrair o token
      int start = response.indexOf("\"token\":\"") + 9;
      int end = response.indexOf("\"", start);

      if (start > 8 && end > start) {
        jwtToken = response.substring(start, end);
        Serial.println("Token JWT obtido com sucesso!");
        Serial.println("Token: " + jwtToken.substring(0, 20) + "...");
        http.end();
        return true;
      } else {
        Serial.println("Erro ao extrair token da resposta");
      }
    } else {
      Serial.printf("Erro na autenticação - Código: %d\n", code);
      Serial.println("Resposta: " + http.getString());
    }
    http.end();
  } else {
    Serial.println("Erro ao conectar com endpoint de autenticação");
  }
  return false;
}

void sendStatus()
{
  if (jwtToken == "")
  {
    Serial.println("Sem token, pulando envio de status...");
    return;
  }

  HTTPClient http;
  if (http.begin(String(serverUrl) + statusEndpoint))
  {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + jwtToken);

    String payload = "{\"status\":\"ACTIVE\",\"message\":\"Device operating normally\",\"timestamp\":\"" + String(millis()) + "\"}";
    int code = http.POST(payload);

    if (code == 200)
    {
      Serial.println("Status enviado com sucesso!");
    }
    else if (code == 401 || code == 403)
    {
      Serial.println("Token inválido/expirado. Reautenticando...");
      jwtToken = "";
      authenticate();
    }
    else
    {
      Serial.printf("Erro enviando status: %d\n", code);
      Serial.println("Resposta: " + http.getString());
    }
    http.end();
  }
}

void pollForCommands()
{
  if (jwtToken == "")
  {
    Serial.println("Sem token, pulando polling de comandos...");
    return;
  }

  HTTPClient http;
  String pollUrl = String(serverUrl) + commandsEndpoint;

  if (http.begin(pollUrl))
  {
    http.addHeader("Authorization", "Bearer " + jwtToken);

    int code = http.GET();

    if (code == 200)
    {
      String response = http.getString();
      Serial.println("Comando recebido: " + response);

      // Aqui você pode adicionar lógica para processar o comando
      processCommand(response);
    }
    else if (code == 204)
    {
      Serial.println("Nenhum comando pendente");
    }
    else if (code == 401 || code == 403)
    {
      Serial.println("Token expirado no polling. Reautenticando...");
      jwtToken = "";
      authenticate();
    }
    else
    {
      Serial.printf("Erro no polling: %d\n", code);
      Serial.println("Resposta: " + http.getString());
    }
    http.end();
  }
}

void processCommand(String command)
{
  Serial.println("Processando comando: " + command);

  // Aqui você pode adicionar a lógica para processar os comandos
  // Por exemplo:
  // if (command.indexOf("turn_on") >= 0) {
  //   // Ligar dispositivo
  // } else if (command.indexOf("turn_off") >= 0) {
  //   // Desligar dispositivo
  // }
}

void setup()
{
  Serial.begin(115200);
  delay(2000);

  Serial.println("=== SmartDrawer ESP32 iniciando ===");

  // Passo 1: Conectar ao WiFi
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Falha na conexão WiFi, reiniciando...");
    ESP.restart();
  }

  // Passo 2: Testar conectividade com servidor
  if (!checkServerHealth()) {
    Serial.println("Servidor não está acessível, reiniciando...");
    ESP.restart();
  }

  // Passo 3: Fazer autenticação inicial
  if (!authenticate()) {
    Serial.println("Falha na autenticação inicial, reiniciando...");
    ESP.restart();
  }

  Serial.println("=== Inicialização completa! Iniciando polling ===");
  lastPolling = millis();
}

void loop()
{
  // Verificar se WiFi ainda está conectado
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado! Tentando reconectar...");
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      delay(5000);
      return;
    }
  }

  // Polling de comandos em intervalo definido
  unsigned long currentTime = millis();
  if (currentTime - lastPolling >= POLLING_INTERVAL) {
    Serial.println("--- Iniciando ciclo de polling ---");

    // Primeiro tenta buscar comandos
    pollForCommands();

    // Depois envia status (a cada 3 ciclos de polling para não sobrecarregar)
    //static int statusCounter = 0;
    //statusCounter++;
    //if (statusCounter >= 3) {
    //  sendStatus();
    //  statusCounter = 0;
    //}

    lastPolling = currentTime;
    Serial.println("--- Fim do ciclo de polling ---");
  }

  // Pequeno delay para não sobrecarregar o processador
  delay(100);
}
