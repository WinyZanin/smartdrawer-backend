# 🔐 SmartDrawer Backend

Sistema de gerenciamento inteligente de gavetas controladas por ESP32 com rastreamento persistente de comandos, autenticação JWT e API REST completa.

> 🎓 **Projeto de TCC** - Trabalho de Conclusão de Curso desenvolvido durante o curso de **Sistemas de Informação** da **Universidade do Estado de Mato Grosso (UNEMAT)**.
>
> Este software foi desenvolvido com **propósito acadêmico**, priorizando a aplicação de **boas práticas de engenharia de software** e **padrões de projeto consolidados** pela indústria. O projeto demonstra conceitos de desenvolvimento de sistemas IoT, APIs REST robustas, arquitetura em camadas, integração hardware-software e princípios SOLID.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.3-blue.svg)
![UNEMAT](https://img.shields.io/badge/UNEMAT-TCC-green.svg)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [ESP32 Integration](#-esp32-integration)
- [Database](#-database)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O SmartDrawer Backend é uma API REST robusta que gerencia dispositivos ESP32 conectados a gavetas inteligentes. O sistema permite:

- Controle remoto de múltiplas gavetas por dispositivo
- Rastreamento completo de comandos com códigos únicos
- Autenticação segura via JWT e API Key
- Persistência de dados com Prisma ORM
- Histórico de auditoria completo
- Sistema de polling para ESP32

### Fluxo de Operação

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Cliente   │────────▶│   Backend   │◀────────│    ESP32    │
│  (Web/App)  │  REST   │   API       │  Polling│  + Gavetas  │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │ POST /opendrawer       │                        │
      │───────────────────────▶│                        │
      │                        │ Cria comando PENDING   │
      │                        │ Code: ABC123XYZ        │
      │                        │                        │
      │                        │◀───────────────────────│
      │                        │  GET /next-command     │
      │                        │  (polling)             │
      │                        │────────────────────────▶
      │                        │  {action, drawer, code}│
      │                        │                        │
      │                        │                        │ Executa
      │                        │                        │ fisicamente
      │                        │                        │
      │                        │◀───────────────────────│
      │                        │  POST /commands/:code/ │
      │                        │  execute (confirmação) │
      │                        │                        │
      │                        │ Status: EXECUTED       │
      │                        │                        │
```

## ✨ Características

### Gerenciamento de Dispositivos
- ✅ CRUD completo de dispositivos
- ✅ Status em tempo real (ACTIVE/INACTIVE/ERROR)
- ✅ Configuração de quantidade de gavetas por dispositivo
- ✅ Localização física dos dispositivos
- ✅ Autenticação individual por dispositivo com JWT

### Sistema de Comandos
- ✅ Criação de comandos com códigos únicos (CUID)
- ✅ Rastreamento de status (PENDING → EXECUTED/FAILED)
- ✅ Persistência em banco de dados
- ✅ Histórico completo com timestamps
- ✅ Sistema de polling eficiente para ESP32
- ✅ Confirmação de execução pelo dispositivo
- ✅ Tratamento de erros e falhas

### Segurança
- ✅ Autenticação JWT para dispositivos ESP32
- ✅ API Key para operações CRUD
- ✅ Secrets únicos por dispositivo
- ✅ Tokens com expiração configurável
- ✅ Middleware de autenticação

### Monitoramento
- ✅ Logs estruturados com Winston
- ✅ Middleware Morgan para requisições HTTP
- ✅ Health check endpoint
- ✅ Tracking de último poll e último comando
- ✅ Limpeza automática de comandos antigos

### Documentação
- ✅ Swagger/OpenAPI completo
- ✅ Interface interativa em `/api-docs`
- ✅ Exemplos de requisições
- ✅ Schemas de validação

## 🏗️ Arquitetura

### Estrutura do Projeto

```
smartdrawer-backend/
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   ├── dev.db                     # SQLite database (dev)
│   └── migrations/                # Histórico de migrations
│       ├── 20250909003850_init/
│       ├── 20251003204504_device_status/
│       ├── 20251014222335_add_commands_table/
│       └── 20251014231809_add_drawer_count/
│
├── src/
│   ├── config/
│   │   ├── jwt.ts                 # Configuração JWT
│   │   └── swagger.ts             # Configuração Swagger/OpenAPI
│   │
│   ├── controllers/
│   │   ├── commands/
│   │   │   └── CommandsController.ts
│   │   └── devices/
│   │       ├── DeviceAuthController.ts
│   │       └── DevicesController.ts
│   │
│   ├── services/
│   │   ├── commands/
│   │   │   └── CommandsService.ts
│   │   └── devices/
│   │       ├── DeviceAuthService.ts
│   │       └── DevicesService.ts
│   │
│   ├── repositories/
│   │   ├── commands/
│   │   │   └── CommandsRepository.ts
│   │   └── devices/
│   │       └── DevicesRepository.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── health.routes.ts
│   │   ├── commands/
│   │   │   └── commands.routes.ts
│   │   └── devices/
│   │       └── devices.routes.ts
│   │
│   ├── middleware/
│   │   ├── apiKeyAuth.ts          # API Key authentication
│   │   └── deviceAuth.ts          # JWT authentication
│   │
│   ├── logger/
│   │   ├── logger.ts              # Winston logger
│   │   └── morganMiddleware.ts    # HTTP request logger
│   │
│   ├── db/
│   │   └── prisma.ts              # Prisma client
│   │
│   ├── types/
│   │   └── devices.types.ts       # TypeScript interfaces
│   │
│   ├── container.ts               # Dependency injection
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
│
├── esp32-drawer/                  # Firmware ESP32
│   ├── esp32-drawer.ino           # Main Arduino file
│   ├── config.h                   # Configurações WiFi/Server
│   ├── wifiManager.h              # WiFi connection
│   ├── serverConnector.h          # HTTP communication
│   └── drawerManager.h            # Hardware control
│
├── logs/                          # Application logs
├── .env                           # Environment variables
├── docker-compose.yml             # Docker setup (em desenvolvimento)
├── Dockerfile
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── README.md
```

### Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│           Routes Layer                  │  ← Express routes + Swagger
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Controllers Layer               │  ← HTTP handlers
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Services Layer                 │  ← Business logic
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Repositories Layer               │  ← Data access
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│           Prisma ORM                    │  ← Database abstraction
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       SQLite / MySQL                    │  ← Persistent storage
└─────────────────────────────────────────┘
```

## 🎨 Padrões de Projeto (Design Patterns)

Este projeto implementa diversos padrões de projeto reconhecidos pela comunidade de desenvolvimento de software, demonstrando boas práticas de arquitetura e engenharia de software.

### 1. **Layered Architecture (Arquitetura em Camadas)** 🏗️

O sistema é organizado em camadas bem definidas, cada uma com responsabilidades específicas:

```
Routes → Controllers → Services → Repositories → Database
```

**Implementação:**
- **Routes Layer**: Define endpoints e aplica middlewares
- **Controllers Layer**: Gerencia requisições HTTP e respostas
- **Services Layer**: Contém lógica de negócio
- **Repositories Layer**: Abstrai acesso ao banco de dados
- **Data Layer**: Prisma ORM + Database

**Benefícios:**
- ✅ Separação clara de responsabilidades
- ✅ Facilita manutenção e testes
- ✅ Código mais organizado e escalável
- ✅ Reduz acoplamento entre camadas

**Exemplos no código:**
```typescript
// src/routes/devices/devices.routes.ts
router.get('/', authenticateApiKey, devicesController.getAllDevices);

// src/controllers/devices/DevicesController.ts
async getAllDevices(req, res) {
  const devices = await this.devicesService.getAllDevices();
}

// src/services/devices/DevicesService.ts
async getAllDevices(): Promise<Device[]> {
  return await this.devicesRepository.findAll();
}

// src/repositories/devices/DevicesRepository.ts
async findAll(): Promise<Device[]> {
  return await prisma.device.findMany();
}
```

---

### 2. **Repository Pattern** 📦

Encapsula a lógica de acesso a dados, isolando a camada de negócio dos detalhes de persistência.

**Implementação:**
- `DevicesRepository`: Operações de CRUD para dispositivos
- `CommandsRepository`: Operações de CRUD para comandos

**Benefícios:**
- ✅ Abstração do banco de dados
- ✅ Facilita troca de tecnologia de persistência
- ✅ Centraliza queries e operações de dados
- ✅ Facilita testes unitários (mock repositories)

**Exemplo:**
```typescript
// src/repositories/devices/DevicesRepository.ts
export class DevicesRepository {
  async findAll(): Promise<Device[]> { /* ... */ }
  async findById(id: string): Promise<Device | null> { /* ... */ }
  async create(data: CreateDeviceDto): Promise<Device> { /* ... */ }
  async update(id: string, data: UpdateDeviceDto): Promise<Device> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}
```

---

### 3. **Dependency Injection (Injeção de Dependências)** 💉

As classes recebem suas dependências através do construtor, ao invés de criá-las internamente.

**Implementação:**
```typescript
// src/container.ts - Service Locator Pattern
export const devicesRepository = new DevicesRepository();
export const commandsRepository = new CommandsRepository();
export const commandsService = new CommandsService(commandsRepository);
export const devicesService = new DevicesService(devicesRepository, commandsService);

// src/services/devices/DevicesService.ts
export class DevicesService {
  constructor(
    private devicesRepository: DevicesRepository,
    private commandsService: CommandsService
  ) {}
}
```

**Benefícios:**
- ✅ Baixo acoplamento entre classes
- ✅ Facilita testes (injetar mocks)
- ✅ Maior flexibilidade e reusabilidade
- ✅ Inversão de controle (IoC)

---

### 4. **Singleton Pattern** 🔐

Garante que uma classe tenha apenas uma instância durante toda a execução.

**Implementação:**
```typescript
// src/db/prisma.ts
const prisma = new PrismaClient();
export default prisma;  // Única instância compartilhada

// src/logger/logger.ts
const Logger = winston.createLogger({ /* ... */ });
export default Logger;  // Logger global único

// src/container.ts
export const devicesService = new DevicesService(...);  // Instância única
```

**Benefícios:**
- ✅ Economia de recursos (conexões DB, loggers)
- ✅ Estado consistente em toda aplicação
- ✅ Controle centralizado de instâncias críticas

---

### 5. **Middleware Pattern (Chain of Responsibility)** 🔗

Cadeia de middlewares que processam requisições antes de chegarem aos controllers.

**Implementação:**
```typescript
// src/app.ts
app.use(cors());                    // CORS middleware
app.use(json());                    // Body parser
app.use(morganMiddleware);          // HTTP logger
app.use('/api/v1/devices', devicesRoutes);

// src/routes/devices/devices.routes.ts
router.post('/',
  authenticateApiKey,               // Auth middleware
  devicesController.createDevice    // Handler final
);

// src/middleware/apiKeyAuth.ts
export function authenticateApiKey(req, res, next) {
  if (apiKey === API_KEY) {
    next();  // Passa para próximo middleware/handler
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

**Benefícios:**
- ✅ Separação de concerns (autenticação, logging, parsing)
- ✅ Reutilização de lógica comum
- ✅ Fácil adicionar/remover funcionalidades
- ✅ Código DRY (Don't Repeat Yourself)

---

### 6. **Factory Pattern** 🏭

Cria objetos sem especificar a classe exata (usado pelo Prisma e Logger).

**Implementação:**
```typescript
// src/logger/logger.ts
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/all.log' })
  ]
});

// Logger.child() cria instâncias especializadas
const componentLogger = Logger.child({ component: 'DevicesService' });
```

**Benefícios:**
- ✅ Encapsula lógica de criação complexa
- ✅ Facilita criação de variantes (console, file, etc)
- ✅ Centraliza configuração

---

### 7. **Strategy Pattern** 🎯

Define família de algoritmos e torna-os intercambiáveis (autenticação, validação).

**Implementação:**
```typescript
// Estratégias de autenticação diferentes
// src/middleware/apiKeyAuth.ts - Estratégia API Key
export function authenticateApiKey(req, res, next) { /* ... */ }

// src/middleware/deviceAuth.ts - Estratégia JWT
export function authenticateDeviceJWT(req, res, next) { /* ... */ }

// Aplicadas em rotas diferentes
router.post('/devices', authenticateApiKey, ...);      // CRUD usa API Key
router.get('/next-command', authenticateDeviceJWT, ...); // ESP32 usa JWT
```

**Benefícios:**
- ✅ Múltiplas estratégias de autenticação
- ✅ Fácil adicionar novos métodos
- ✅ Código flexível e extensível

---

### 8. **Adapter Pattern** 🔌

Prisma ORM atua como adaptador entre a aplicação e o banco de dados.

**Implementação:**
```typescript
// Prisma adapta diferentes bancos de dados
datasource db {
  provider = "sqlite"      // Dev: SQLite
  // provider = "mysql"  // Prod: MySQL
  url = env("DATABASE_URL")
}

// Mesma API independente do banco
await prisma.device.findMany();  // Funciona em ambos
```

**Benefícios:**
- ✅ Abstração de diferentes databases
- ✅ Mesmo código para SQLite e MySQL
- ✅ Facilita migração entre bancos

---

### 9. **Observer Pattern (Logging)** 👀

Sistema de logging "observa" eventos na aplicação e registra informações.

**Implementação:**
```typescript
// Logger observa operações e registra eventos
this.logger.info('Device created successfully', { deviceId });
this.logger.error('Failed to create device', { error });
this.logger.debug('Fetching all devices');

// Morgan observa todas as requisições HTTP
app.use(morganMiddleware);  // Loga automaticamente todas as requests
```

**Benefícios:**
- ✅ Monitoramento centralizado
- ✅ Auditoria automática
- ✅ Debug facilitado

---

### 10. **DTO Pattern (Data Transfer Object)** 📋

Objetos simples para transferir dados entre camadas.

**Implementação:**
```typescript
// src/types/devices.types.ts
export interface CreateDeviceDto {
  name: string;
  location?: string;
  status?: string;
  drawerCount?: number;
  secret: string;
}

export interface UpdateDeviceDto {
  name?: string;
  location?: string;
  status?: string;
  drawerCount?: number;
}

// Uso em Services
async createDevice(data: CreateDeviceDto): Promise<Device> {
  return await this.devicesRepository.create(data);
}
```

**Benefícios:**
- ✅ Validação de tipos (TypeScript)
- ✅ Contrato claro entre camadas
- ✅ Documentação implícita
- ✅ Previne erros de tipagem

---

### 11. **State Pattern** 🔄

Comandos possuem estados bem definidos e transições controladas.

**Implementação:**
```typescript
// Estado inicial
status: "PENDING"

// Transições possíveis
PENDING → EXECUTED (sucesso)
PENDING → FAILED (erro)

// Implementado no CommandsService
async executeCommand(code: string) {
  // Valida estado atual
  if (command.status !== 'PENDING') {
    throw new Error('Command already executed');
  }
  // Transição de estado
  await this.commandsRepository.updateStatus(code, 'EXECUTED');
}
```

**Benefícios:**
- ✅ Fluxo de estados bem definido
- ✅ Previne transições inválidas
- ✅ Rastreamento de ciclo de vida

---

### 12. **Facade Pattern** 🎭

Services atuam como fachada simplificada para operações complexas.

**Implementação:**
```typescript
// DevicesService simplifica múltiplas operações
async openDrawer(deviceId: string, drawerNumber: number) {
  // 1. Busca dispositivo
  const device = await this.devicesRepository.findById(deviceId);

  // 2. Valida drawer
  if (drawerNumber > device.drawerCount) throw new Error(...);

  // 3. Cria comando
  const command = await this.commandsService.createCommand({...});

  // 4. Atualiza status do dispositivo
  await this.devicesRepository.updateLastCommand(deviceId);

  return command;  // Interface simples para operação complexa
}
```

**Benefícios:**
- ✅ API simplificada para cliente
- ✅ Esconde complexidade interna
- ✅ Coordena múltiplas operações

---

### 📊 Resumo dos Padrões Implementados

| Padrão | Categoria | Onde está implementado |
|--------|-----------|------------------------|
| **Layered Architecture** | Arquitetural | Estrutura geral do projeto |
| **Repository Pattern** | Estrutural | `repositories/` |
| **Dependency Injection** | Estrutural | `container.ts`, construtores |
| **Singleton** | Criacional | `prisma.ts`, `logger.ts` |
| **Middleware (Chain of Responsibility)** | Comportamental | `middleware/`, Express |
| **Factory** | Criacional | `winston.createLogger()` |
| **Strategy** | Comportamental | Middlewares de autenticação |
| **Adapter** | Estrutural | Prisma ORM |
| **Observer** | Comportamental | Sistema de logging |
| **DTO** | Estrutural | `types/*.types.ts` |
| **State** | Comportamental | Status de comandos |
| **Facade** | Estrutural | Services layer |

### 🎯 Princípios SOLID Aplicados

- **S** - Single Responsibility: Cada classe tem uma responsabilidade única
- **O** - Open/Closed: Extensível via middlewares e strategies
- **L** - Liskov Substitution: Repositories são intercambiáveis
- **I** - Interface Segregation: DTOs específicos por operação
- **D** - Dependency Inversion: Depende de abstrações (interfaces)

---

## 🛠️ Tecnologias

### Backend
- **Node.js** (≥18.0.0) - Runtime JavaScript
- **TypeScript** (5.8.3) - Type safety
- **Express** (5.1.0) - Web framework
- **Prisma ORM** (6.15.0) - Database toolkit
- **SQLite** (dev) / **MySQL** (prod) - Database
- **Winston** (3.17.0) - Logging
- **Morgan** (1.10.1) - HTTP request logger

### Autenticação & Segurança
- **jsonwebtoken** (9.0.2) - JWT tokens
- **API Key** - CRUD operations

### Documentação
- **Swagger/OpenAPI** (3.0.0) - API documentation
- **swagger-jsdoc** (6.2.8) - JSDoc to OpenAPI
- **swagger-ui-express** (5.0.1) - Interactive UI

### DevOps
- **ts-node-dev** - Development server
- **ESLint** + **Prettier** - Code quality
- **Docker** (em desenvolvimento) - Containerization

### ESP32
- **Arduino Framework** - ESP32 programming
- **WiFi** - Network connectivity
- **HTTPClient** - HTTP requests
- **ArduinoJson** (6.x) - JSON parsing

## 📦 Instalação

### Pré-requisitos

```bash
# Node.js (versão 18 ou superior)
node --version  # v18.0.0+

# npm ou yarn
npm --version   # 9.0.0+
```

### Clone o Repositório

```bash
git clone https://github.com/seu-usuario/smartdrawer-backend.git
cd smartdrawer-backend
```

### Instale as Dependências

```bash
npm install
```

### Configure o Banco de Dados

```bash
# Gera o Prisma Client
npx prisma generate

# Aplica as migrations (cria as tabelas)
npx prisma migrate deploy

# Ou em desenvolvimento
npx prisma migrate dev
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env  # ou use seu editor preferido
```

Configurações do `.env`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./prisma/dev.db"
# Produção: DATABASE_URL="mysql://user:password@host:3306/smartdrawer"

# JWT Configuration
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=24h

# API Key para operações CRUD
API_KEY=sk-smartdrawer-2025-prod-secure-key-abc123xyz789

# API URLs
API_URL_DEV=http://localhost:3000
API_URL_PROD=https://api.smartdrawer.app

# Logging
LOG_LEVEL=debug
```

### 2. Criar Dispositivo no Backend

**IMPORTANTE**: Antes de gravar o código no ESP32, você precisa criar o dispositivo no backend para obter o `id`.

#### Passo a Passo:

1. **Defina um secret** para o dispositivo (senha que o ESP32 usará para autenticação)
   - Exemplo: `"meu-secret-super-seguro-123"`
   - Use algo único e seguro para cada dispositivo

2. **Crie o dispositivo** usando uma das opções abaixo

#### Opção 1: Via Swagger UI (Recomendado)

1. Inicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000/api-docs
3. Navegue até a seção **Devices** → **POST /devices**
4. Clique em "Try it out"
5. Preencha o JSON (defina seu próprio `secret`):

```json
{
  "name": "ESP32 Drawer Unit 01",
  "location": "Building A - Floor 2",
  "status": "ACTIVE",
  "drawerCount": 4,
  "secret": "meu-secret-super-seguro-123"
}
```

6. Execute e copie o `id` retornado (ex: `clp123abc456def789`)

#### Opção 2: Via cURL

```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-smartdrawer-2025-prod-secure-key-abc123xyz789" \
  -d '{
    "name": "ESP32 Drawer Unit 01",
    "location": "Building A - Floor 2",
    "status": "ACTIVE",
    "drawerCount": 4,
    "secret": "meu-secret-super-seguro-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clp123abc456def789",  // ← Use este ID no ESP32
    "name": "ESP32 Drawer Unit 01",
    "location": "Building A - Floor 2",
    "status": "ACTIVE",
    "drawerCount": 4,
    "createdAt": "2025-10-14T20:30:00.000Z",
    "updatedAt": "2025-10-14T20:30:00.000Z"
  },
  "message": "Device created successfully"
}
```

> 📝 **Nota**: Guarde o `id` retornado e o `secret` que você definiu - ambos serão usados no ESP32.

> 📖 Para mais detalhes sobre a rota de criação de dispositivos, veja a seção [**Criar Dispositivo**](#criar-dispositivo).

### 3. Configuração do ESP32

Agora edite o arquivo `esp32-drawer/config.h` com os dados do dispositivo criado:

```cpp
// WiFi credentials
const char* ssid = "SEU_WIFI_SSID";
const char* password = "SUA_SENHA_WIFI";

// Device credentials (usar o id e secret do dispositivo criado no backend)
const char* device_id = "clp123abc456def789";           // ← ID retornado na criação
const char* device_jwt_secret = "meu-secret-super-seguro-123";  // ← Secret definido na criação

// Server URL (IP da máquina onde o backend está rodando)
const char* serverUrl = "http://192.168.1.100:3000";

// Drawer pins (GPIO do ESP32, verificar disponibilidade dos pinos)
int drawerPins[] = {13, 12, 14, 27, 26};  // Exemplo de 5 gavetas
const int duration = 500;  // Duração em ms para manter gaveta aberta
```

> ⚠️ **IMPORTANTE**:
> - O `device_id` deve ser EXATAMENTE o `id` retornado ao criar o dispositivo
> - O `device_jwt_secret` deve ser EXATAMENTE o `secret` definido na criação
> - Sem isso, o ESP32 não conseguirá se autenticar no backend

## 🚀 Uso

### Iniciar o Servidor

#### Desenvolvimento
```bash
npm run dev
```

#### Produção
```bash
# Build TypeScript
npm run build

# Start server
npm start
```

### Acessar Swagger UI

Abra no navegador (apenas em desenvolvimento):
```
http://localhost:3000/api-docs
```

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T20:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.smartdrawer.app/api/v1
```

### Autenticação

#### API Key (CRUD Operations)
```http
X-API-Key: sk-smartdrawer-2025-prod-secure-key-abc123xyz789
```

#### JWT Token (ESP32 Devices)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoints Principais

#### 1. Device Management

##### Criar Dispositivo
```http
POST /api/v1/devices
X-API-Key: seu-api-key

{
  "name": "Main Drawer Unit 01",
  "location": "Building A - Floor 2",
  "status": "ACTIVE",
  "drawerCount": 4,
  "secret": "device-secret-123"
}
```

##### Listar Dispositivos
```http
GET /api/v1/devices
X-API-Key: seu-api-key
```

##### Buscar Dispositivo
```http
GET /api/v1/devices/:id
X-API-Key: seu-api-key
```

##### Atualizar Dispositivo
```http
PUT /api/v1/devices/:id
X-API-Key: seu-api-key

{
  "name": "Updated Unit",
  "drawerCount": 6,
  "status": "ACTIVE"
}
```

##### Deletar Dispositivo
```http
DELETE /api/v1/devices/:id
X-API-Key: seu-api-key
```

#### 2. Authentication

##### Login do Dispositivo
```http
POST /api/v1/auth/login

{
  "deviceId": "clp123abc456def789",
  "secret": "device-secret-123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deviceId": "clp123abc456def789"
}
```

#### 3. Command Operations

##### Abrir Gaveta (criar comando)
```http
POST /api/v1/devices/:deviceId/opendrawer/:drawerNumber
X-API-Key: seu-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmd_abc123",
    "code": "clq123xyz789",
    "action": "open",
    "drawer": 1,
    "status": "PENDING",
    "createdAt": "2025-10-14T20:30:00.000Z"
  }
}
```

##### Buscar Próximo Comando (ESP32 Polling)
```http
GET /api/v1/devices/:deviceId/next-command
Authorization: Bearer <jwt-token>
```

**Response (com comando pendente):**
```json
{
  "action": "open",
  "drawer": 1,
  "code": "clq123xyz789"
}
```

**Response (sem comandos):**
```json
{
  "action": "none"
}
```

##### Confirmar Execução (ESP32)
```http
POST /api/v1/commands/:code/execute
Authorization: Bearer <jwt-token>

{
  "deviceId": "clp123abc456def789"
}
```

##### Reportar Falha (ESP32)
```http
POST /api/v1/commands/:code/fail
Authorization: Bearer <jwt-token>

{
  "deviceId": "clp123abc456def789",
  "errorMessage": "Motor jammed"
}
```

##### Listar Comandos
```http
GET /api/v1/commands?status=PENDING&deviceId=clp123
X-API-Key: seu-api-key
```

##### Buscar Comando por Código
```http
GET /api/v1/commands/:code
X-API-Key: seu-api-key
```

##### Limpar Comandos Antigos
```http
DELETE /api/v1/commands/cleanup?days=7
X-API-Key: seu-api-key
```

### Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request (validation error) |
| 401  | Unauthorized (invalid credentials) |
| 404  | Not Found |
| 500  | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Drawer 5 does not exist. This device has 4 drawers (valid: 1-4)"
}
```

## 🔌 ESP32 Integration

### Bibliotecas Necessárias

No Arduino IDE:
- **WiFi** (built-in)
- **HTTPClient** (built-in)
- **ArduinoJson** (versão 6.x)

### Configuração da Placa

1. **Arduino IDE** → Tools → Board → ESP32 Dev Module
2. **Porta COM** → Selecionar porta correta
3. **Upload Speed** → 115200

### Fluxo de Operação do ESP32

```cpp
void setup() {
  // 1. Inicializa WiFi
  wifiManager.connect();

  // 2. Testa conectividade com servidor
  serverConnector.testServerConnection();

  // 3. Autentica e obtém JWT token
  serverConnector.authenticate();

  // 4. Inicializa gavetas
  drawerManager.init();
}

void loop() {
  // 1. Poll para buscar próximo comando (a cada 5 segundos)
  serverConnector.pollForCommands();

  // 2. Se comando recebido, processa
  // 3. Abre gaveta fisicamente
  // 4. Envia confirmação ou falha para backend

  delay(5000);
}
```

### Upload do Firmware para ESP32

**Requisitos:**

1. **Arduino IDE** instalado
2. **Biblioteca ArduinoJson** (versão 6.x)
3. **Placa ESP32** configurada no Arduino IDE

**Passo a passo:**

1. **Instalar ArduinoJson library**
   - Arduino IDE → Sketch → Include Library → Manage Libraries
   - Buscar por "ArduinoJson" e instalar versão 6.x

2. **Configurar placa ESP32**
   - Tools → Board → ESP32 Dev Module
   - Tools → Port → Selecionar porta COM correta
   - Tools → Upload Speed → 115200

3. **Editar `config.h` com credenciais**
   - WiFi SSID e password
   - Device ID e secret (obtidos ao criar dispositivo no backend)
   - URL do servidor backend

4. **Verificar compilação**
   - Arduino IDE → Sketch → Verify/Compile
   - Corrigir erros se houver

5. **Upload para ESP32**
   - Arduino IDE → Sketch → Upload
   - Aguardar conclusão do upload

6. **Monitorar Serial**
   - Tools → Serial Monitor
   - Baud Rate: 115200

### Output Esperado no Serial Monitor

```
=== SmartDrawer ESP32 initialized ===
Connecting to WiFi...
WiFi connected!
IP address: 192.168.1.150
Testing server connectivity...
Server is operational!
Starting authentication...
JWT token obtained successfully!
=== Initialization complete! Starting polling ===

Polling for commands...
No pending commands
Polling for commands...
Command received: open drawer 1 (Code: ABC123XYZ)
Opening drawer 1...
Drawer 1 opened successfully
Command execution confirmed: ABC123XYZ
```

## 🗄️ Database

### Schema

O sistema utiliza 3 tabelas principais:

#### Device
```prisma
model Device {
  id          String        @id @default(cuid())
  name        String
  location    String?
  status      String        @default("INACTIVE")  // ACTIVE, INACTIVE, ERROR
  drawerCount Int           @default(4)           // 1-20 gavetas
  secret      String        @default(cuid())      // Para autenticação
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  deviceStatus DeviceStatus?
  commands    Command[]
}
```

#### Command
```prisma
model Command {
  id           String    @id @default(cuid())
  deviceId     String
  code         String    @unique @default(cuid())  // Código único para tracking
  action       String                              // "open"
  drawer       Int?                                // Número da gaveta
  status       String    @default("PENDING")       // PENDING, EXECUTED, FAILED
  createdAt    DateTime  @default(now())
  executedAt   DateTime?
  failedAt     DateTime?
  errorMessage String?

  device       Device    @relation(fields: [deviceId], references: [id])

  @@index([deviceId, status])
  @@index([code])
}
```

#### DeviceStatus
```prisma
model DeviceStatus {
  id          String   @id @default(cuid())
  deviceId    String   @unique
  lastPoll    DateTime                    // Último polling do ESP32
  lastCommand DateTime                    // Último comando enviado
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  device      Device   @relation(fields: [deviceId], references: [id])
}
```

### Migrations

#### Criar Nova Migration (Development)

```bash
# Após alterar schema.prisma
npx prisma migrate dev --name descricao_da_mudanca
```

#### Aplicar Migrations (Production)

```bash
# NO SERVIDOR DE PRODUÇÃO
npx prisma migrate deploy
npx prisma generate
```

#### Verificar Status das Migrations

```bash
npx prisma migrate status
```

#### Visualizar Dados (Prisma Studio)

```bash
npx prisma studio
```

Abre interface web em `http://localhost:5555`

### Backup e Restore

#### SQLite (Development)

```bash
# Backup
cp prisma/dev.db prisma/dev.db.backup

# Restore
cp prisma/dev.db.backup prisma/dev.db
```

#### MySQL (Production)

```bash
# Backup
mysqldump -h host -u user -p smartdrawer > backup.sql

# Restore
mysql -h host -u user -p smartdrawer < backup.sql
```

## 🚢 Deployment

### Ambiente de Desenvolvimento

```bash
# Clone e instale
git clone <repo>
npm install

# Configure .env
cp .env.example .env
# Edite .env com suas configurações

# Setup database
npx prisma migrate dev
npx prisma generate

# Start
npm run dev
```

### Ambiente de Produção

#### 1. Preparação

```bash
# No servidor
git clone <repo>
cd smartdrawer-backend
npm install --production
```

#### 2. Configuração

```bash
# .env para produção
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://user:pass@host:3306/smartdrawer"
JWT_SECRET=<secret-forte-aqui>
API_KEY=<api-key-forte-aqui>
```

#### 3. Database Setup

```bash
# Aplicar todas as migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

#### 4. Build e Start

```bash
# Compilar TypeScript
npm run build

# Iniciar com PM2 (recomendado)
npm install -g pm2
pm2 start dist/server.js --name smartdrawer-backend

# Ou com npm
npm start
```

#### 5. PM2 Commands

```bash
# Status
pm2 status

# Logs
pm2 logs smartdrawer-backend

# Restart
pm2 restart smartdrawer-backend

# Stop
pm2 stop smartdrawer-backend

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Deploy com Novo Banco de Dados

Quando configurar em um novo ambiente (novo servidor, novo desenvolvedor, etc):

```bash
# 1. Clone e instale
git clone <repo>
npm install

# 2. Configure DATABASE_URL no .env

# 3. Aplica TODAS as migrations (do zero)
npx prisma migrate deploy

# 4. Gera Prisma Client
npx prisma generate

# 5. Start
npm start
```

O Prisma irá:
- Criar a tabela `_prisma_migrations`
- Aplicar todas as migrations na ordem cronológica
- Seu banco fica com a estrutura atualizada

### Update em Produção (com novas migrations)

```bash
# 1. No servidor, pull do código
git pull

# 2. Instalar novas dependências (se houver)
npm install

# 3. Aplicar apenas as migrations novas
npx prisma migrate deploy

# 4. Regenerar Prisma Client
npx prisma generate

# 5. Rebuild (se necessário)
npm run build

# 6. Restart
pm2 restart smartdrawer-backend
```

### Docker (em desenvolvimento)

```bash
# Build
docker build -t smartdrawer-backend .

# Run
docker-compose up -d
```

**Nota:** A configuração Docker ainda está em desenvolvimento.

### Nginx Reverse Proxy (Opcional)

```nginx
server {
    listen 80;
    server_name api.smartdrawer.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔍 Troubleshooting

### Backend Issues

#### Erro: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

#### Erro: "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

#### Erro: "JWT malformed" ou "Invalid token"

1. Verificar se JWT_SECRET no backend e device_jwt_secret no ESP32 são iguais
2. Fazer novo login do dispositivo
3. Verificar se token não expirou (JWT_EXPIRES_IN)

#### Database Migration Error

```bash
# Reset database (CUIDADO: perde dados)
npx prisma migrate reset

# Ou force deploy
npx prisma migrate resolve --applied <migration_name>
npx prisma migrate deploy
```

#### Logs não aparecem

Verificar `LOG_LEVEL` no `.env`:
```env
LOG_LEVEL=debug  # Para desenvolvimento
LOG_LEVEL=info   # Para produção
```

### ESP32 Issues

#### "WiFi connection failed"

1. Verificar SSID e password no `config.h`
2. Verificar se rede é 2.4GHz (ESP32 não suporta 5GHz)
3. Resetar ESP32

#### "Server connection failed"

1. Verificar se backend está rodando
2. Verificar IP/URL do servidor no `config.h`
3. Ping no servidor: `ping 192.168.1.100`
4. Verificar firewall

#### "Authentication failed"

1. Verificar se device_id existe no banco
2. Verificar se device_jwt_secret corresponde ao secret do dispositivo
3. Verificar endpoint `/api/v1/auth/login`

#### "ArduinoJson.h not found"

```
Arduino IDE → Sketch → Include Library → Manage Libraries
Buscar: ArduinoJson
Instalar versão 6.x
```

#### "Drawer not opening"

1. Verificar pinagem no `config.h` (drawerPins)
2. Testar GPIO com código simples
3. Verificar alimentação do circuito
4. Verificar logs: drawer number recebido vs configurado

#### ESP32 não recebe comandos

1. Verificar se status do dispositivo é ACTIVE
2. Verificar se comando foi criado (status PENDING)
3. Monitorar Serial: polling está funcionando?
4. Verificar token JWT válido

### Common Errors

| Error | Causa | Solução |
|-------|-------|---------|
| "Device not found" | ID inválido | Verificar deviceId |
| "Drawer X does not exist" | drawerNumber > drawerCount | Ajustar drawerCount ou drawer number |
| "Unauthorized" | Token/API Key inválido | Re-autenticar |
| "Command already executed" | Tentativa de re-executar | Normal, ignorar |
| "No pending commands" | Nenhum comando na fila | Normal, polling continua |

### Debug Mode

Para habilitar logs detalhados:

**.env:**
```env
LOG_LEVEL=debug
NODE_ENV=development
```

**ESP32 Serial Monitor:**
```
Baud Rate: 115200
```

Todos os logs de HTTP requests, responses, e operações internas serão exibidos.

## 📖 Documentação Adicional

- **Sistema de Comandos**: [COMMAND_TRACKING_SYSTEM.md](./COMMAND_TRACKING_SYSTEM.md)
- **API Swagger**: `/api-docs` (development only)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

### Padrões de Código

- **ESLint + Prettier** configurados
- **TypeScript strict mode**
- **Conventional Commits**

```bash
# Lint
npm run lint

# Build
npm run build
```

## 📝 License

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como **Trabalho de Conclusão de Curso (TCC)** do curso de **Sistemas de Informação** da **Universidade do Estado de Mato Grosso (UNEMAT)**.

### Objetivos Didáticos

O SmartDrawer foi criado com propósito **primariamente didático**, visando:

- 📚 **Aplicar conhecimentos** adquiridos durante o curso de Sistemas de Informação
- 🔧 **Integrar hardware e software** através de sistemas IoT
- 🌐 **Desenvolver APIs REST** seguindo boas práticas de arquitetura
- 🗄️ **Implementar persistência de dados** com ORM moderno
- 🔐 **Trabalhar com autenticação** e segurança em APIs
- 📊 **Documentar sistemas** de forma clara e profissional
- 🧪 **Explorar tecnologias** atuais do mercado (Node.js, TypeScript, Prisma, ESP32)

### Competências Desenvolvidas

- Arquitetura de software em camadas (MVC/Repository Pattern)
- Desenvolvimento de APIs RESTful
- Integração IoT (ESP32 ↔ Backend)
- Gerenciamento de banco de dados e migrations
- Autenticação JWT e API Keys
- Documentação com Swagger/OpenAPI
- Controle de versão com Git
- Deploy e configuração de servidores

## 👤 Autor

- Email: winy_zanin@hotmail.com
- GitHub: [@WinyZanin](https://github.com/WinyZanin)
- Instituição: Universidade do Estado de Mato Grosso (UNEMAT)
- Curso: Sistemas de Informação

## 🙏 Agradecimentos

- **UNEMAT** - Pela formação e infraestrutura
- **Orientador Ivan Pires** - Pelo suporte e orientação durante o desenvolvimento
- Prisma Team - ORM incrível
- Express.js - Framework robusto
- ESP32 Community - Suporte e exemplos

---

**Status do Projeto**: TCC parcialmente concluido

**Tipo**: Trabalho de Conclusão de Curso (TCC)

**Instituição**: UNEMAT - Universidade do Estado de Mato Grosso

**Última Atualização**: 14 de Outubro de 2025

Para dúvidas ou suporte, abra uma [Issue](https://github.com/WinyZanin/smartdrawer-backend/issues) no GitHub.
