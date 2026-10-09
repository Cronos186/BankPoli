# BankPoli — API REST de transferencias interbancarias

Implementación de la tercera entrega del proyecto de **Arquitectura de Software**: el servicio REST de
transferencias interbancarias del escenario académico *BankPoli*, construido con **Node.js + TypeScript + NestJS**
y aplicando el patrón **_Legacy Wrapper_** seleccionado en la Entrega 2.

El núcleo transaccional existente se representa mediante **rutinas almacenadas de PostgreSQL** (`legacy.fn_*`),
que la API consume **únicamente** a través de una capa de adaptación (`LegacyAdapterService`). Los canales digitales
(App móvil / portal web) consumen endpoints REST sobre HTTP/HTTPS con representaciones JSON, sin conocer las tablas,
los procedimientos ni la tecnología del sistema heredado.

| | |
|---|---|
| **Estilo arquitectónico** | SOA con exposición REST (HTTP/HTTPS + JSON) |
| **Patrón principal** | Legacy Wrapper (complementado con Decoupled Contract y Service Façade) |
| **Stack** | Node.js 20+ · TypeScript 5.9 · NestJS 11 · PostgreSQL 16 · JWT · OpenAPI 3.x / Swagger UI |
| **Pruebas** | 40 unitarias (Jest) + 24 de integración (Jest + Supertest) |
| **Documentación** | Swagger UI en `http://localhost:3000/api/docs` |

---

## 1. Arquitectura implementada

```
                 ┌──────────────────────────────┐
                 │  Canales digitales           │
                 │  App móvil  ·  Portal web    │
                 └───────────────┬──────────────┘
                                 │ HTTPS + JSON (Bearer JWT)
   ┌─────────────────────────────▼──────────────────────────────┐
   │ NIVEL 2 · ACCESO A LA API (Gateway/Controllers)            │
   │ Rutas · JwtAuthGuard · RolesGuard · ValidationPipe ·       │
   │ HttpExceptionFilter                                        │
   └─────────────────────────────┬──────────────────────────────┘
                                 │
   ┌─────────────────────────────▼──────────────────────────────┐
   │ NIVEL 3 · SERVICIOS DE APLICACIÓN                          │
   │ AuthService · CuentasService · TransferenciasService       │
   │ (orquestación de la lógica de negocio + DTO de contrato)   │
   └─────────────────────────────┬──────────────────────────────┘
                                 │
   ┌─────────────────────────────▼──────────────────────────────┐
   │ NIVEL 4 · INTEGRACIÓN (LEGACY WRAPPER)                     │
   │ LegacyAdapterService  →  LegacyCoreClient (puerto)         │
   │ Traducción DTO ⇄ estructuras legacy · códigos de rechazo   │
   └─────────────────────────────┬──────────────────────────────┘
                                 │ SELECT * FROM legacy.fn_*()  (solo rutinas)
   ┌─────────────────────────────▼──────────────────────────────┐
   │ NIVEL 5 · PERSISTENCIA / CORE TRANSACCIONAL (legacy)       │
   │ PostgreSQL: legacy.usuarios · cuentas · transferencias ·   │
   │ movimientos  +  rutinas almacenadas fn_*                   │
   └────────────────────────────────────────────────────────────┘
```

### 1.1. Flujo de una transferencia (síncrono)

1. `POST /api/v1/transferencias` llega con el token JWT.
2. `JwtAuthGuard` valida firma, vigencia, emisor y audiencia; `RolesGuard` verifica el rol.
3. `ValidationPipe` valida el DTO `CrearTransferenciaDto` (whitelist: rechaza campos no declarados).
4. `TransferenciasService` verifica la cuenta de origen, su estado y su saldo disponible.
5. Verifica la cuenta de destino.
6. `LegacyAdapterService` traduce el monto y los datos al formato del core y ejecuta la rutina
   `legacy.fn_procesar_transferencia`, que debita, acredita, registra la transferencia y los movimientos
   **de forma atómica**.
7. El adaptador relee la transferencia registrada y la traduce al modelo de dominio.
8. `RespuestaTransferenciaDto` se devuelve al consumidor con HTTP 201.

### 1.2. Cómo se materializa el patrón Legacy Wrapper

| Responsabilidad del patrón | Implementación |
|---|---|
| **Encapsular** el sistema heredado | Solo `PostgresLegacyCoreClient` y `LegacyAdapterService` conocen las rutinas `legacy.fn_*` y la nomenclatura del core (`num_cta`, `sal_cta`, `cta_org`, …). |
| **Traducir** entre modelos | El adaptador convierte montos numéricos a texto con dos decimales (`250000` → `"250000.00"`), fechas a ISO 8601 y estructuras abreviadas a entidades de dominio (`Cuenta`, `Usuario`, `Transferencia`). |
| **Aislar fallos** | Los códigos de rechazo del core (`SALDO_INSUFICIENTE`, `CUENTA_ORIGEN_INACTIVA`, …) se convierten en errores HTTP semánticos con un `codigo` de negocio. Los fallos técnicos se traducen a `503 NUCLEO_NO_DISPONIBLE` sin exponer detalles. |
| **Permitir evolución independiente** | Si el core cambia sus tablas o rutinas, el cambio se absorbe en la capa de adaptación (o en una nueva implementación del puerto `LegacyCoreClient`) sin tocar controladores, servicios ni consumidores. |

> **Facilidad para la demostración:** el puerto `LegacyCoreClient` tiene dos implementaciones:
> `PostgresLegacyCoreClient` (núcleo legacy simulado en PostgreSQL) e `InMemoryLegacyCoreClient`
> (mismo comportamiento y mismos códigos de rechazo, sin base de datos). Esto permite ejecutar y probar
> la API completa sin Docker, con el mismo contrato hacia los consumidores.

---

## 2. Estructura del proyecto

```
src/
├── main.ts                          # Arranque: configuración transversal y listen
├── app.module.ts                    # Módulo raíz: guards y filtro globales
├── app.setup.ts                     # Prefijo /api, versionado v1, Swagger, Helmet, CORS, ValidationPipe
├── app.controller.ts                # GET /api/v1/health (público)
├── auth/                            # Servicio de autenticación
│   ├── auth.controller.ts           # POST /auth/login (público) · GET /auth/perfil
│   ├── auth.service.ts              # Validación de credenciales + emisión de JWT
│   ├── auth.module.ts
│   ├── guards/jwt-auth.guard.ts     # Guard global (política por defecto: denegar)
│   ├── guards/roles.guard.ts        # Autorización por roles
│   ├── strategies/jwt.strategy.ts   # Validación del token (firma, exp, iss, aud)
│   ├── entities/usuario.entity.ts   # Modelo de dominio + enum de roles
│   ├── dto/                         # login.dto.ts · login-response.dto.ts
│   └── interfaces/                  # Payload JWT y usuario autenticado
├── cuentas/                         # Consulta de cuentas y saldos
│   ├── cuentas.controller.ts        # GET /cuentas/{numero}/saldo
│   ├── cuentas.service.ts
│   ├── entities/cuenta.entity.ts
│   └── dto/                         # consulta-saldo.dto.ts · saldo-response.dto.ts
├── transferencias/                  # Caso de estudio
│   ├── transferencias.controller.ts # POST /transferencias · GET /transferencias · GET /{id}
│   ├── transferencias.service.ts    # Orquestación de la operación
│   ├── legacy-adapter.service.ts    # ★ LEGACY WRAPPER (traducción e integración)
│   ├── dto/                         # crear-transferencia.dto.ts · respuesta-transferencia.dto.ts
│   └── entities/transferencia.entity.ts
├── legacy/                          # Frontera con el sistema heredado
│   ├── legacy-core.client.ts        # Puerto (clase abstracta) + estructuras crudas legacy
│   ├── postgres-legacy-core.client.ts  # Invoca las rutinas almacenadas
│   ├── in-memory-legacy-core.client.ts # Núcleo simulado en memoria
│   ├── legacy-errors.ts             # Errores de negocio e infraestructura
│   ├── legacy-seed.data.ts          # Datos de prueba (espejo de db/init/03-seed.sql)
│   └── legacy.module.ts             # Módulo global que publica el wrapper
├── common/
│   ├── filters/http-exception.filter.ts   # Protección de errores internos
│   ├── decorators/                        # @Public · @Roles · @UsuarioActual
│   └── dto/error-response.dto.ts          # Documentación del contrato de error
└── config/
    ├── configuration.ts             # Configuración tipada desde variables de entorno
    └── configuration.fixture.ts     # Configuración para pruebas

db/init/         01-schema.sql · 02-legacy-routines.sql · 03-seed.sql
postman/         BankPoli-API.postman_collection.json
test/            app.e2e-spec.ts (24 pruebas de integración) · jest-e2e.json · jest-setup.ts
docker-compose.yml
```

---

## 3. Puesta en marcha

### Requisitos
- Node.js 20 o superior
- Docker (opcional, solo para el núcleo transaccional en PostgreSQL)

### 3.1. Ejecución inmediata (núcleo en memoria, sin Docker)

```bash
npm install
cp .env.example .env        # en Windows: Copy-Item .env.example .env
npm run start:dev
```

- API: <http://localhost:3000/api/v1>
- Catálogo de contratos (Swagger UI): <http://localhost:3000/api/docs>

### 3.2. Levantar la base de datos en desarrollo (núcleo legacy en PostgreSQL)

Requisito: Docker Desktop en ejecución (`docker info` debe responder).

**Paso 1 — Levantar el contenedor.** El comando crea el contenedor `bankpoli-postgres`
(PostgreSQL 16) en el puerto **5433** del host y ejecuta automáticamente los scripts
`db/init/*.sql` en orden (esquema → rutinas almacenadas → datos de prueba):

```bash
npm run db:up          # equivale a: docker compose up -d
npm run db:logs        # opcional: seguir la inicialización y los logs del motor
```

Verificar que el contenedor quedó saludable:

```bash
docker ps --filter name=bankpoli-postgres
# bankpoli-postgres | Up (healthy) | 0.0.0.0:5433->5432/tcp
```

**Paso 2 — Verificar que el núcleo quedó inicializado** (tablas, rutinas y usuarios):

```bash
# Rutinas almacenadas del core legacy
docker exec bankpoli-postgres psql -U bankpoli -d bankpoli -c "\df legacy.*"

# Tablas y saldos iniciales
docker exec bankpoli-postgres psql -U bankpoli -d bankpoli -c "SELECT num_cta, tit_cta, sal_cta, est_cta FROM legacy.cuentas ORDER BY num_cta;"
```

**Paso 3 — Apuntar la API al núcleo PostgreSQL.** En `.env`:

```dotenv
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USER=bankpoli
DB_PASSWORD=bankpoli
DB_NAME=bankpoli
DB_SCHEMA=legacy
DB_SSL=false
```

**Paso 4 — Ejecutar la API:**

```bash
npm run start:dev
```

El log debe indicar `Conectado al nucleo transaccional simulado en localhost:5433/bankpoli (esquema legacy)`.
El recurso `GET /api/v1/health` responde `"motorNucleo": "postgres"`.

**Ciclo de vida de la base de datos en desarrollo**

| Necesidad | Comando |
|---|---|
| Levantar (conserva los datos del volumen) | `npm run db:up` |
| Detener (conserva los datos) | `npm run db:down` |
| Recrear desde cero (borra el volumen y re-ejecuta `db/init/*.sql`) | `npm run db:reset` |
| Ver logs del motor | `npm run db:logs` |

> Los scripts de `db/init/` **solo se ejecutan cuando el volumen se crea por primera vez**.
> Si la base ya existía y se modificó algún script, hay que recrear el volumen (`npm run db:reset`)
> o aplicar el script manualmente:
>
> ```bash
> # Opción A: con psql instalado localmente
> psql "postgresql://bankpoli:bankpoli@localhost:5433/bankpoli" -f db/init/02-legacy-routines.sql
>
> # Opción B: usando el cliente del propio contenedor
> docker exec -i bankpoli-postgres psql -U bankpoli -d bankpoli < db/init/02-legacy-routines.sql
> ```
>
> Si no hay Docker disponible, la API puede ejecutarse con `DB_DRIVER=memory`: expone el mismo
> contrato y los mismos códigos de rechazo, con un núcleo simulado en memoria.

### 3.3. Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | API en modo desarrollo con recarga automática |
| `npm run build` | Compila TypeScript a JavaScript en `dist/` (artefacto de producción) |
| `npm run start:prod` | Ejecuta `node dist/main` (requiere `npm run build` previo) |
| `npm run lint` / `npm run format` | ESLint (con Prettier) y formateo |
| `npm test` | 40 pruebas unitarias |
| `npm run test:cov` | Pruebas con cobertura |
| `npm run test:e2e` | 24 pruebas de integración de los endpoints (autocontenidas) |
| `npm run db:up` / `db:down` / `db:reset` / `db:logs` | Gestión del núcleo legacy en PostgreSQL |

### 3.4. Compilación y despliegue en producción

**Paso 1 — Instalar dependencias exactas del lockfile** (incluye las de desarrollo necesarias para compilar):

```bash
npm ci
```

**Paso 2 — Compilar** el proyecto. La salida queda en `dist/` (`dist/main.js` es el punto de entrada):

```bash
npm run build
```

**Paso 3 — Ejecutar el artefacto compilado** en modo producción:

```bash
# Linux / macOS
NODE_ENV=production node dist/main.js

# Windows PowerShell
$env:NODE_ENV='production'; node dist/main.js

# Alternativa equivalente (script npm)
npm run start:prod      # con NODE_ENV=production definido en el entorno
```

Con `NODE_ENV=production` la aplicación **exige `JWT_SECRET`**: si falta, no arranca y el motivo aparece
en el log (`ERROR [ExceptionHandler] Error: JWT_SECRET es obligatorio cuando NODE_ENV=production.`),
evitando desplegar con un secreto de desarrollo.

**Variables obligatorias/recomendadas en producción**

| Variable | Valor recomendado |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Secreto aleatorio de 32+ caracteres (gestor de secretos, nunca en el repositorio) |
| `PORT` | Puerto interno donde escucha la API (p. ej. `3000`) |
| `CORS_ORIGINS` | Orígenes reales de los canales digitales (`https://app.bankpoli...`), no `*` |
| `DB_DRIVER` | `postgres` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Datos de la instancia PostgreSQL productiva |
| `DB_SSL` | `true` en proveedores gestionados (RDS, Cloud SQL, Supabase…) |
| `DB_POOL_MAX` | Ajustar según el límite de conexiones del servidor |

Consideraciones de despliegue:

- **No se versiona `.env`.** En producción las variables se inyectan con el orquestador o el gestor de
  secretos (Docker/Kubernetes, variables del servicio, PM2 `ecosystem`, etc.). La configuración se lee
  en tiempo de arranque, por lo que **no** hay que recompilar para cambiarla.
- **Base de datos productiva:** aplicar una única vez los scripts `01-schema.sql` y `02-legacy-routines.sql`
  sobre la instancia (`psql -f`, o el cliente del proveedor). `03-seed.sql` contiene **datos de prueba**:
  no debe aplicarse en producción (en un escenario real ese núcleo ya está en operación).
- **TLS:** la aplicación escucha HTTP; HTTPS/TLS se termina en el proxy inverso (Nginx, ALB, ingress),
  que además puede aplicar la política CSP que la app desactiva solo para Swagger UI.
- **Verificación posterior al despliegue:** `GET /api/v1/health` (público) y `GET /api/docs` para el
  catálogo de contratos.
- **Reducción del artefacto (opcional):** compilar en CI, copiar `dist/`, `package.json`,
  `package-lock.json`, `.env.example` y ejecutar `npm ci --omit=dev` en el servidor.
- **Solo archivos de runtime:** `dist/`, `package*.json`, `.env.example` y, si se aplican manualmente,
  `db/init/*.sql`. El código fuente (`src/`) y las pruebas (`test/`) no son necesarios en producción.

Ejemplo de imagen Docker multietapa (opcional, no incluida en el repositorio):

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
# Las variables (JWT_SECRET, DB_*) se inyectan en tiempo de ejecución
CMD ["node", "dist/main.js"]
```

```bash
docker build -t bankpoli-api:1.0.0 .
docker run -d --name bankpoli-api -p 3000:3000 \
  -e JWT_SECRET="secreto-real-de-produccion" \
  -e DB_DRIVER=postgres -e DB_HOST=host-base-datos -e DB_PORT=5432 \
  -e DB_NAME=bankpoli -e DB_USER=bankpoli -e DB_PASSWORD="clave-real" -e DB_SSL=true \
  bankpoli-api:1.0.0
```

Opcionalmente con un gestor de procesos en el servidor:

```bash
npm install -g pm2
NODE_ENV=production pm2 start dist/main.js --name bankpoli-api
```

### 3.5. Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | En `production` exige `JWT_SECRET` |
| `PORT` | `3000` | Puerto HTTP de la API |
| `CORS_ORIGINS` | `*` | Orígenes permitidos, separados por coma |
| `JWT_SECRET` | — | Secreto de firma (obligatorio en producción) |
| `JWT_EXPIRES_IN_SECONDS` | `3600` | Vigencia del token en segundos |
| `JWT_ISSUER` / `JWT_AUDIENCE` | `bankpoli-api` / `bankpoli-canales-digitales` | Emisor y audiencia validados en cada token |
| `DB_DRIVER` | `postgres` | `postgres` (Docker) o `memory` (sin base de datos) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `5433` / `bankpoli` / `bankpoli` / `bankpoli` | Conexión al núcleo legacy |
| `DB_SCHEMA` | `legacy` | Esquema donde residen las tablas y rutinas del core |
| `DB_SSL` / `DB_POOL_MAX` | `false` / `10` | Seguridad de conexión y tamaño del pool |

---

## 4. Núcleo transaccional heredado (PostgreSQL)

### 4.1. Tablas (`db/init/01-schema.sql`)

| Tabla | Contenido |
|---|---|
| `legacy.usuarios` | Usuarios, rol (`CLIENTE`, `CAJERO`, `ADMINISTRADOR`), hash bcrypt y estado |
| `legacy.cuentas` | Cuentas con saldo `numeric(18,2)`, tipo, moneda y estado (`ACTIVA`, `INACTIVA`, `BLOQUEADA`) |
| `legacy.transferencias` | Transferencias con estado, código de error y marcas de tiempo |
| `legacy.movimientos` | Movimientos contables (débito/crédito) generados por cada transferencia |

### 4.2. Rutinas almacenadas (`db/init/02-legacy-routines.sql`)

| Rutina | Propósito |
|---|---|
| `legacy.fn_consultar_cuenta(num_cta)` | Devuelve la cuenta o cero filas si no existe |
| `legacy.fn_autenticar_usuario(log_usr)` | Devuelve el usuario con el hash administrado por el core |
| `legacy.fn_procesar_transferencia(org, dst, valor, concepto)` | **Rutina transaccional**: valida, debita, acredita, registra la transferencia y los movimientos; bloquea ambas cuentas con `FOR UPDATE` para evitar condiciones de carrera. Devuelve `PROCESADA` o `RECHAZADA` + `cod_err` |
| `legacy.fn_consultar_transferencia(id_trf)` | Consulta una transferencia |
| `legacy.fn_listar_transferencias(num_cta, limite)` | Lista transferencias, filtradas por cuenta |

> La API **solo** invoca estas rutinas (`SELECT * FROM legacy.fn_*(...)`); no ejecuta SQL sobre las tablas.
> Los rechazos de negocio se devuelven como una fila con código de error, no como excepción de base de datos;
> un fallo técnico revierte la transacción completa (atomicidad de PostgreSQL).

---

## 5. Contrato de la API

Prefijo global `/api`, versionado por URI (`v1`). Todas las respuestas son JSON.

| Método | Endpoint | Rol requerido | Respuesta |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | público | `200` token JWT |
| `GET` | `/api/v1/auth/perfil` | autenticado | `200` datos del usuario |
| `GET` | `/api/v1/cuentas/{numero}/saldo` | CLIENTE · CAJERO · ADMINISTRADOR | `200` saldo y estado |
| `POST` | `/api/v1/transferencias` | CLIENTE · CAJERO | `201` transferencia creada |
| `GET` | `/api/v1/transferencias` | CLIENTE (solo su cuenta) · CAJERO · ADMINISTRADOR | `200` listado |
| `GET` | `/api/v1/transferencias/{id}` | CLIENTE (solo si participa) · CAJERO · ADMINISTRADOR | `200` transferencia |
| `GET` | `/api/v1/health` | público | `200` estado del servicio |
| `GET` | `/api/docs` · `/api/docs-json` | público | OpenAPI 3.x + Swagger UI |

### 5.1. Ejemplo completo

```bash
# 1. Login -> token
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"cliente1","contrasena":"Cliente123*"}'

# 2. Consulta de saldo
curl -s http://localhost:3000/api/v1/cuentas/1000123456/saldo \
  -H "Authorization: Bearer $TOKEN"

# 3. Transferencia interbancaria
curl -s -X POST http://localhost:3000/api/v1/transferencias \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"cuentaOrigen":"1000123456","cuentaDestino":"2000654321","monto":250000,"concepto":"Transferencia interbancaria"}'
```

```json
{
  "id": "642072be-ff6c-45d3-b7dd-1e65fd568c44",
  "cuentaOrigen": "1000123456",
  "cuentaDestino": "2000654321",
  "monto": 300000,
  "concepto": "Transferencia interbancaria",
  "estado": "PROCESADA",
  "mensaje": "Transferencia procesada correctamente.",
  "fechaCreacion": "2026-10-01T01:49:10.995Z",
  "fechaProceso": "2026-10-01T01:49:10.995Z",
  "codigoError": null
}
```

### 5.2. Usuarios y cuentas de prueba

| Usuario | Contraseña | Rol | Cuenta principal |
|---|---|---|---|
| `cliente1` | `Cliente123*` | CLIENTE | `1000123456` |
| `cliente2` | `Cliente123*` | CLIENTE | `2000654321` |
| `cajero1` | `Cajero123*` | CAJERO | — |
| `admin1` | `Admin123*` | ADMINISTRADOR | — |
| `inactivo1` | `Cliente123*` | CLIENTE (inactivo) | — |

| Cuenta | Titular | Saldo inicial | Estado |
|---|---|---|---|
| `1000123456` | Ana Maria Cliente | 2.500.000,00 | ACTIVA |
| `1000987654` | Ana Maria Cliente | 800.000,00 | ACTIVA |
| `2000654321` | Carlos Destino | 150.000,00 | ACTIVA |
| `3000111222` | Beatriz Inactiva | 100.000,00 | INACTIVA |
| `4000123456` | Diego Sin Saldo | 1.000,00 | ACTIVA |

### 5.3. Respuestas de error

| Código | `codigo` | Situación |
|---|---|---|
| `400` | `MISMA_CUENTA` · `MONTO_INVALIDO` | Cuentas iguales o monto inválido |
| `400` | — | Error de validación del DTO (mensaje en arreglo) o campo no declarado |
| `401` | `CREDENCIALES_INVALIDAS` | Usuario inexistente, contraseña incorrecta o usuario inactivo |
| `401` | — | Token ausente, malformado o expirado |
| `403` | — | Rol sin permisos o cliente consultando una operación ajena |
| `404` | `CUENTA_NO_ENCONTRADA` · `TRANSFERENCIA_NO_ENCONTRADA` | Recurso inexistente |
| `409` | `SALDO_INSUFICIENTE` | Saldo insuficiente en la cuenta de origen |
| `422` | `CUENTA_INACTIVA` | Cuenta de origen o destino no activa |
| `500` | `ERROR_INTERNO` | Fallo no controlado (mensaje genérico, sin detalles internos) |
| `503` | `NUCLEO_NO_DISPONIBLE` | El núcleo transaccional no responde |

```json
{
  "statusCode": 409,
  "message": "Saldo insuficiente: disponible 1000.00, solicitado 900000.00.",
  "error": "Conflict",
  "codigo": "SALDO_INSUFICIENTE",
  "path": "/api/v1/transferencias",
  "timestamp": "2026-10-01T01:49:11.532Z"
}
```

---

## 6. Seguridad implementada

| Mecanismo | Implementación |
|---|---|
| Transporte | HTTPS/TLS en el despliegue (el proxy inverso termina TLS); en desarrollo, HTTP local |
| Autenticación | JWT HS256 firmado con `JWT_SECRET`, validando firma, expiración, emisor y audiencia |
| Política por defecto | `JwtAuthGuard` global: todo recurso exige token salvo `@Public()` |
| Autorización | `@Roles(...)` + `RolesGuard` global con los roles CLIENTE, CAJERO y ADMINISTRADOR |
| Control de acceso a datos | Un CLIENTE solo consulta transferencias de su cuenta principal (`403` en caso contrario) |
| Validación de entradas | DTO con `class-validator` + `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) |
| Credenciales | Hash bcrypt almacenado y verificado en el núcleo; la contraseña nunca se registra ni se devuelve |
| Mensajes de autenticación | Un único error para usuario inexistente, contraseña errónea o usuario inactivo (evita enumeración de usuarios) |
| Protección de errores | `HttpExceptionFilter` global: los fallos no controlados se convierten en `500` genérico y se registran solo en el servidor |
| Cabeceras HTTP | `helmet` (CSP desactivada únicamente por los recursos en línea de Swagger UI) |
| CORS | Orígenes explícitos configurables (`CORS_ORIGINS`) |

---

## 7. Pruebas

```bash
npm test          # 40 pruebas unitarias
npm run test:e2e  # 24 pruebas de integración de los endpoints
npm run test:cov  # cobertura
```

- **Unitarias:** adaptador Legacy Wrapper (traducción y mapeo de códigos de rechazo), servicio de
  autenticación (token verificable, credenciales inválidas, usuario inactivo), servicio de cuentas,
  servicio de transferencias (saldos, validaciones y reglas de autorización) y filtro global de excepciones
  (verifica que los detalles internos no se filtren).
- **Integración (e2e):** flujo completo sobre la aplicación Nest real — autenticación, autorización por roles,
  validación de DTO, consulta de cuentas, creación y consulta de transferencias, códigos `400/401/403/404/409/422`,
  publicación de OpenAPI y Swagger UI. Se ejecutan con `DB_DRIVER=memory`, por lo que **no requieren base de datos**.

Ambas suites se ejecutan sin PostgreSQL. La validación contra PostgreSQL se realizó levantando el contenedor
(`npm run db:up`) y verificando la ejecución de las rutinas almacenadas y el flujo completo de la API con
`DB_DRIVER=postgres`.

### 7.1. Pruebas manuales con Postman

Se incluye la colección [`postman/BankPoli-API.postman_collection.json`](postman/BankPoli-API.postman_collection.json)
con scripts que guardan automáticamente el token y el identificador de la transferencia:

1. Ejecutar la carpeta **01 - Autenticación** (guarda `token`).
2. Ejecutar **03 - Transferencias** (guarda `idTransferencia`).

La propia descripción de la colección incluye, como guía de uso:

- cómo **levantar la base de datos en desarrollo** (núcleo PostgreSQL con `npm run db:up`, verificación del
  contenedor y de las rutinas, configuración de `DB_DRIVER` y ciclo `db:down` / `db:reset`);
- cómo **compilar y ejecutar la API para producción** (`npm ci`, `npm run build`,
  `NODE_ENV=production node dist/main.js`) y qué variables exigir;
- el orden de ejecución de las carpetas y las credenciales de prueba.

---

## 8. Trazabilidad con la Entrega 2

| Problemática (Entrega 1) | Decisión arquitectónica (Entrega 2) | Implementación (Entrega 3) |
|---|---|---|
| Acoplamiento punto a punto | Servicios REST con contratos definidos | Controladores + DTO + OpenAPI 3.x |
| Dependencia del core legacy | Patrón **Legacy Wrapper** | `legacy/legacy-core.client.ts` + `transferencias/legacy-adapter.service.ts` |
| Exposición de detalles internos | `LegacyAdapterService` | Traducción de estructuras `num_cta`/`sal_cta` → entidades de dominio; errores de negocio con código |
| Dificultad para descubrir servicios | OpenAPI 3.x / Swagger UI | `/api/docs` y `/api/docs-json` generados desde controladores y DTO |
| Integraciones heterogéneas | HTTP/HTTPS + JSON | Versionado por URI (`/api/v1`), respuestas JSON uniformes |
| Riesgo de acceso no controlado | JWT + Guards + roles | `JwtAuthGuard`, `RolesGuard`, roles CLIENTE/CAJERO/ADMINISTRADOR |
| Dificultad para incorporar consumidores | Servicios reutilizables | App móvil y portal web consumen los mismos endpoints sin lógica financiera propia |
| Errores que exponen infraestructura | Filtro global de excepciones | `HttpExceptionFilter` con mensaje genérico y registro interno |

---

## 9. Decisiones de diseño y limitaciones

**Decisiones relevantes**

1. **El core se invoca solo mediante rutinas almacenadas.** La lógica transaccional permanece en el sistema
   heredado, tal como está hoy; la API no reimplementa el movimiento de saldos.
2. **Se relee la transferencia después de procesarla**, para responder con los datos realmente almacenados
   (fechas y estado) en lugar de datos construidos en memoria.
3. **Los rechazos de negocio no generan registro** en `legacy.transferencias`: las validaciones se realizan
   antes de escribir, de modo que una operación rechazada no altera los saldos ni deja rastros parciales.
   *(Mejora futura: registrar el intento rechazado con fines de auditoría.)*
4. **`forbidNonWhitelisted`**: enviar campos no declarados en el DTO produce `400`. Es una decisión deliberada
   de contrato estricto (Decoupled Contract).
5. **El monto viaja como número en el contrato REST** y como texto con dos decimales hacia el core; la conversión
   es responsabilidad exclusiva del adaptador.
6. **`DB_DRIVER=memory`** existe únicamente para demostración y pruebas automatizadas; reproduce los mismos
   códigos de rechazo que las rutinas de PostgreSQL.

**Limitaciones del alcance académico**

- No se procesa dinero real ni existe conexión con un sistema bancario productivo.
- No hay notificaciones asíncronas (correo/SMS) ni compensación entre entidades financieras externas.
- No se incluye refresh token, revocación de sesiones ni rotación de secretos.
- No hay migraciones versionadas para la base de datos: el esquema se crea con los scripts de inicialización.
- TLS no se configura dentro de la aplicación (se delega al proxy inverso, como indica la Entrega 2).

---

## 10. Referencias

- Bank for International Settlements. (2020). *Enabling open finance through APIs*.
- Bank for International Settlements. (2026). *Project Aperta*.
- Boar, C., Claessens, S., Kosse, A., Leckow, R., & Rice, T. (2021). Interoperability between payment systems across borders. *BIS Bulletin*, (49).
- Erl, T. (2009). *SOA Design Patterns*. Prentice Hall.
- Richardson, L., & Ruby, S. (2007). *RESTful Web Services*. O'Reilly Media.
