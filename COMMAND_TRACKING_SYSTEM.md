# Sistema de Rastreamento de Comandos - SmartDrawer

## 📋 Visão Geral

Este documento descreve o novo sistema de rastreamento de comandos implementado no projeto SmartDrawer, que substitui o antigo sistema de fila em memória por uma solução persistente baseada em banco de dados com códigos únicos para cada comando.

## 🎯 Objetivos

- ✅ **Persistência**: Comandos sobrevivem a reinicializações do servidor
- ✅ **Rastreamento**: Cada comando possui código único para verificação de status
- ✅ **Auditoria**: Histórico completo de comandos executados, pendentes e falhos
- ✅ **Confiabilidade**: Sistema de confirmação de execução do ESP32
- ✅ **Debugabilidade**: Logs detalhados e timestamps de cada etapa

## 🏗️ Arquitetura

### Backend (Node.js/TypeScript)

```
┌─────────────────────┐
│   CommandsRoutes    │  ← API REST Endpoints
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ CommandsController  │  ← HTTP Request Handler
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  CommandsService    │  ← Business Logic & Validation
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ CommandsRepository  │  ← Database Access Layer
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Prisma ORM        │  ← Database Abstraction
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   SQLite/Postgres   │  ← Persistent Storage
└─────────────────────┘
```

### ESP32 (C++/Arduino)

```
┌─────────────────────┐
│   Main Loop         │
└──────────┬──────────┘
           │ (polling)
┌──────────▼──────────┐
│  ServerConnector    │  ← HTTP Communication
└──────────┬──────────┘
           │
           ├─→ pollForCommands()      (GET next command)
           ├─→ processCommand()       (Execute locally)
           ├─→ sendConfirmation()     (POST success)
           └─→ sendFailure()          (POST error)
```

## 📊 Modelo de Dados

### Command Model (Prisma Schema)

```prisma
model Command {
  id            String    @id @default(cuid())
  deviceId      String
  device        Device    @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  code          String    @unique @default(cuid())
  action        String
  drawer        Int?
  status        String    @default("PENDING")
  createdAt     DateTime  @default(now())
  executedAt    DateTime?
  failedAt      DateTime?
  errorMessage  String?
}
```

### Status Flow

```
PENDING → EXECUTED (success)
   └──→ FAILED (error)
```

## 🔌 API Endpoints

### 1. **GET /api/v1/devices/:id/next-command**
**Autenticação**: JWT (dispositivo)
**Descrição**: ESP32 faz polling para buscar próximo comando pendente

**Response (200)**:
```json
{
  "action": "open",
  "drawer": 1,
  "code": "ABC123XYZ"
}
```

**Response (204)**: Sem comandos pendentes

---

### 2. **POST /api/v1/commands/:code/execute**
**Autenticação**: JWT (dispositivo)
**Descrição**: ESP32 confirma execução bem-sucedida

**Response (200)**:
```json
{
  "message": "Command marked as executed successfully",
  "command": {
    "id": "...",
    "code": "ABC123XYZ",
    "status": "EXECUTED",
    "executedAt": "2025-10-14T..."
  }
}
```

---

### 3. **POST /api/v1/commands/:code/fail**
**Autenticação**: JWT (dispositivo)
**Descrição**: ESP32 reporta falha na execução

**Request Body**:
```json
{
  "errorMessage": "Failed to open drawer 3"
}
```

**Response (200)**:
```json
{
  "message": "Command marked as failed",
  "command": {
    "id": "...",
    "code": "ABC123XYZ",
    "status": "FAILED",
    "failedAt": "2025-10-14T...",
    "errorMessage": "Failed to open drawer 3"
  }
}
```

---

### 4. **GET /api/v1/commands/:code**
**Autenticação**: API Key
**Descrição**: Verificar status de um comando específico

**Response (200)**:
```json
{
  "id": "cm2hxyz...",
  "code": "ABC123XYZ",
  "deviceId": "device-001",
  "action": "OPEN",
  "drawer": 1,
  "status": "EXECUTED",
  "createdAt": "2025-10-14T10:00:00Z",
  "executedAt": "2025-10-14T10:00:05Z",
  "failedAt": null,
  "errorMessage": null
}
```

---

### 5. **GET /api/v1/commands/device/:deviceId**
**Autenticação**: API Key
**Descrição**: Listar todos os comandos de um dispositivo

**Query Params**: `?status=PENDING|EXECUTED|FAILED` (opcional)

**Response (200)**:
```json
{
  "deviceId": "device-001",
  "status": "all",
  "count": 15,
  "commands": [
    {
      "id": "cm2h...",
      "code": "ABC123",
      "action": "OPEN",
      "drawer": 1,
      "status": "EXECUTED",
      "createdAt": "...",
      "executedAt": "..."
    }
  ]
}
```

---

### 6. **GET /api/v1/commands/stats** ou **GET /api/v1/commands/stats/:deviceId**
**Autenticação**: API Key
**Descrição**: Estatísticas de comandos

**Response (200)**:
```json
{
  "deviceId": "all",
  "statistics": {
    "pending": 3,
    "executed": 42,
    "failed": 2,
    "total": 47
  }
}
```

## 🔄 Fluxo Completo de Execução

### 1. **Criação do Comando** (Backend)
```javascript
// Via API ou internamente
const command = await commandsService.createCommand({
  deviceId: "device-001",
  action: "OPEN",
  drawer: 1
});
// Gera código único: "cm2hxyz..."
// Status inicial: PENDING
```

### 2. **Polling** (ESP32 → Backend)
```cpp
// ESP32 faz GET a cada 5 segundos
GET /api/v1/devices/device-001/next-command
Authorization: Bearer <JWT>

// Resposta:
{
  "action": "open",
  "drawer": 1,
  "code": "cm2hxyz..."
}
```

### 3. **Processamento** (ESP32)
```cpp
// ESP32 recebe e processa comando
void processCommand(String commandJson) {
  // Parse JSON
  const char* action = doc["action"];
  int drawer = doc["drawer"];
  const char* code = doc["code"];

  // Executa ação
  bool success = drawerManager->openDrawer(drawer);

  // Confirma resultado
  if (success) {
    sendCommandConfirmation(code);
  } else {
    sendCommandFailure(code, "Drawer motor error");
  }
}
```

### 4. **Confirmação** (ESP32 → Backend)

**Sucesso**:
```cpp
POST /api/v1/commands/cm2hxyz.../execute
Authorization: Bearer <JWT>
Body: {}

// Backend atualiza:
// - status: EXECUTED
// - executedAt: now()
```

**Falha**:
```cpp
POST /api/v1/commands/cm2hxyz.../fail
Authorization: Bearer <JWT>
Body: { "errorMessage": "Motor stuck" }

// Backend atualiza:
// - status: FAILED
// - failedAt: now()
// - errorMessage: "Motor stuck"
```

## 🛠️ Implementação no ESP32

### Mudanças no serverConnector.h

#### 1. **processCommand()** - Atualizado
```cpp
// ANTES: Não tinha código de rastreamento
void processCommand(String commandJson) {
  const char* action = doc["action"];
  int drawer = doc["drawer"];
  drawerManager->openDrawer(drawer);
}

// DEPOIS: Com código e tratamento de erros
void processCommand(String commandJson) {
  const char* action = doc["action"];
  int drawer = doc["drawer"];
  const char* code = doc["code"];  // ← NOVO!

  bool success = drawerManager->openDrawer(drawer);

  if (success) {
    sendCommandConfirmation(code);  // ← NOVO!
  } else {
    sendCommandFailure(code, "Error");  // ← NOVO!
  }
}
```

#### 2. **sendCommandConfirmation()** - Novo Endpoint
```cpp
// ANTES: /devices/:id/commandconfirm
// DEPOIS: /commands/:code/execute
void sendCommandConfirmation(const String commandCode) {
  String url = serverUrl + "/api/v1/commands/" + commandCode + "/execute";
  http.POST("{}");
  // Status HTTP 200 = sucesso
}
```

#### 3. **sendCommandFailure()** - Nova Função
```cpp
// COMPLETAMENTE NOVO!
void sendCommandFailure(const String commandCode, const String errorMsg) {
  String url = serverUrl + "/api/v1/commands/" + commandCode + "/fail";
  String payload = "{\"errorMessage\":\"" + errorMsg + "\"}";
  http.POST(payload);
}
```

## 📝 Logs e Debugging

### Backend Logs
```
INFO: Command created successfully
  commandId: cm2hxyz...
  code: ABC123XYZ
  deviceId: device-001
  action: OPEN

INFO: Command marked as executed
  code: ABC123XYZ
  deviceId: device-001
```

### ESP32 Serial Monitor
```
--- Starting polling cycle ---
Command received: {"action":"open","drawer":1,"code":"ABC123XYZ"}
Processing command - Code: ABC123XYZ, Action: open, Drawer: 1
Opening drawer: 1, pin: 13
✓ Command marked as EXECUTED on server (code: ABC123XYZ)
--- End of polling cycle ---
```

## 🧪 Testando o Sistema

### 1. Criar comando via API
```bash
# Obter API Key
curl -X POST http://localhost:3000/api/v1/devices \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Device",
    "location": "Lab",
    "secret": "device-secret"
  }'

# Criar comando
curl -X POST http://localhost:3000/api/v1/devices/device-id/queue-command \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "open",
    "drawer": 1
  }'

# Resposta: { "code": "ABC123XYZ" }
```

### 2. ESP32 faz polling
```
GET /api/v1/devices/device-id/next-command
→ Recebe: {"action":"open","drawer":1,"code":"ABC123XYZ"}
```

### 3. Verificar status
```bash
curl http://localhost:3000/api/v1/commands/ABC123XYZ \
  -H "X-API-Key: your-api-key"

# Resposta mostra status atualizado
```

### 4. Ver estatísticas
```bash
curl http://localhost:3000/api/v1/commands/stats/device-id \
  -H "X-API-Key: your-api-key"
```

## 🔒 Segurança

- **JWT Authentication**: ESP32 deve autenticar antes de polling
- **API Key**: Endpoints de gerenciamento requerem API Key
- **Validation**: Todos os inputs são validados no backend
- **Rate Limiting**: Considerar implementar para produção

## 🚀 Melhorias Futuras

1. **Webhooks**: Notificar sistemas externos quando comando muda status
2. **Retry Logic**: Retentar comandos falhados automaticamente
3. **Priority Queue**: Comandos urgentes na frente
4. **Batch Operations**: Enviar múltiplos comandos de uma vez
5. **Analytics**: Dashboard com métricas de execução
6. **Command Timeout**: Auto-fail comandos que não executam em X tempo

## 📚 Referências

- **Prisma Schema**: `prisma/schema.prisma`
- **Backend Routes**: `src/routes/commands/commands.routes.ts`
- **ESP32 Code**: `esp32-drawer/serverConnector.h`
- **Swagger Docs**: `http://localhost:3000/api-docs` (dev only)

---

**Desenvolvido para o projeto SmartDrawer**
Última atualização: Outubro 2025
