# Aurora Core

Aurora Core is the central backend service of the Aurora Project. It provides a unified REST API that abstracts and mediates interactions with an [OpenStack](https://www.openstack.org/) infrastructure, covering the following services:

| OpenStack Service | Type |
|---|---|
| **Keystone** | Identity & Authentication |
| **Nova** | Compute |
| **Neutron** | Networking |
| **Glance** | Image |
| **Cinder** | Block Storage |
| **Swift** | Object Storage |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Docker](#docker)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)
10. [Development](#development)
11. [Logging](#logging)

---

## Overview

Aurora Core sits between client applications and a live OpenStack deployment. Instead of requiring clients to speak directly to each individual OpenStack endpoint, Aurora Core:

- Authenticates against Keystone and manages the service catalog.
- Forwards compute, network, image, storage, and object-storage requests to the correct OpenStack endpoint.
- Publishes and consumes events via **RabbitMQ** to keep endpoint information up-to-date across the Aurora ecosystem.
- Registers itself with the **Aurora Service Manager** on startup so the **Aurora Gateway** can route traffic to it.

---

## Architecture

```
                   ┌─────────────────────────────────────────────┐
                   │              Aurora Gateway                  │
                   └───────────────────┬─────────────────────────┘
                                       │ HTTP /core/api/…
                   ┌───────────────────▼─────────────────────────┐
                   │              Aurora Core  (this service)     │
                   │                                             │
                   │  ┌──────────┐  ┌────────────────────────┐  │
                   │  │ Identity │  │ Nova / Neutron / Glance │  │
                   │  │ Router   │  │ Cinder / Swift Routers  │  │
                   │  └────┬─────┘  └───────────┬────────────┘  │
                   │       │                     │               │
                   │  ┌────▼─────────────────────▼────────────┐  │
                   │  │          OpenStack Services            │  │
                   │  │  (IdentityService, NovaService, …)    │  │
                   │  └───────────────────────────────────────┘  │
                   └──────────────┬──────────────────────────────┘
                                  │ HTTP
                   ┌──────────────▼──────────────────────────────┐
                   │         OpenStack Infrastructure             │
                   │   Keystone  Nova  Neutron  Glance  Cinder   │
                   └─────────────────────────────────────────────┘
```

**Messaging (RabbitMQ):** Aurora Core connects to a RabbitMQ broker and listens for `registerPublisher` events. When authentication succeeds and a new service catalog is received, update events are emitted internally so every service instance refreshes its endpoints automatically.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 6.x |
| npm | 3.x |
| RabbitMQ | 3.x |
| OpenStack | Any (Keystone v2.0 fully supported) |
| Redis *(optional)* | Any |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/yoplait2/aurora-core.git
cd aurora-core

# Install dependencies
npm install

# Build TypeScript sources
npm run build
```

---

## Configuration

Aurora Core is configured entirely through environment variables. Copy one of the provided environment files and edit the values to match your setup:

```bash
cp .env.ci .env
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | ✔ | — | HTTP port the service listens on (e.g. `3002`) |
| `LOG_LEVEL` | ✔ | — | Logging verbosity: `trace`, `debug`, `info`, `warn`, `crit`, or `error` |
| `SERVICE_NAME` | ✔ | — | Name used when registering with the Service Manager (e.g. `core`) |
| `GATEWAY_ROUTING_PATH` | ✔ | — | URL prefix registered in the gateway (e.g. `/core`) |
| `SERVICE_API_PATH` | ✔ | — | Base path of this service's API (e.g. `/api`) |
| `SERVICE_MANAGER_HOST` | ✔ | — | Hostname of the Aurora Service Manager |
| `SERVICE_MANAGER_PORT` | ✔ | — | Port of the Aurora Service Manager |
| `KEYSTONE_API_HOST` | ✔ | — | Hostname or IP of the Keystone (Identity) endpoint |
| `KEYSTONE_API_PORT` | ✔ | `5000` | Port of the Keystone API |
| `KEYSTONE_API_PATH` | ✔ | — | Path prefix of the Keystone API (e.g. `/v2.0`) |
| `KEYSTONE_API_VERSION` | ✔ | — | Keystone API version (e.g. `2.0`) |
| `RABBIT_HOST` | ✔ | — | RabbitMQ hostname |
| `RABBIT_PORT` | ✔ | `5672` | RabbitMQ AMQP port |
| `RABBIT_USER` | ✔ | — | RabbitMQ username |
| `RABBIT_PASS` | ✔ | — | RabbitMQ password |
| `TOPOLOGY_FILE_PATH` | ✔ | — | Path to the RabbitMQ topology JSON file (e.g. `./topology.json`) |
| `REDIS_HOST` | | `127.0.0.1` | Redis hostname |
| `REDIS_PORT` | | `6379` | Redis port |

A ready-to-use example file for CI is provided in `.env.ci`.

---

## Running the Application

### Development (watch mode)

Compiles TypeScript and restarts the server automatically on file changes:

```bash
npm run dev
```

### Start (after building)

```bash
npm run build
npm start
```

### CI environment

```bash
npm run build
npm run ci
```

### Production environment

```bash
npm run build
npm run prod
```

---

## Docker

A `Dockerfile` and `docker-compose.yml` are provided for containerised deployments.

### Build and run with Docker Compose

The Compose file starts the full Aurora stack: Gateway, Service Manager, Core, Redis, and RabbitMQ.

```bash
docker-compose up --build
```

Individual service ports:

| Service | Host Port |
|---|---|
| aurora-gateway | 3000 |
| aurora-manager | 3001 |
| aurora-core | 3002 |
| redis | 6379 |
| rabbitmq | 5672 / 15672 |

### Build the image manually

```bash
docker build -t aurora-core .
```

---

## API Reference

All endpoints are mounted under the `SERVICE_API_PATH` prefix (default `/api`).

### Identity (Keystone) — `/api/identity`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List supported OpenStack API versions |
| `POST` | `/tokens` | Authenticate and obtain a token. Requires credentials in the request body (`username`, `password`, `tenant?`, `domain?`). |
| `DELETE` | `/tokens` | Invalidate / log out the current token. Requires credentials in the request body. |
| `GET` | `/extensions` | List Keystone API extensions |
| `GET` | `/tenants` | List tenants for the authenticated user. Requires `X-Auth-Token` header. |
| `GET` | `/service-catalog` | Return the cached OpenStack service catalog |
| `GET` | `/logout` | Log out the current session |

#### Authentication request body

```json
{
  "username": "admin",
  "password": "secret",
  "tenant": "myproject",
  "domain": "Default"
}
```

---

### Nova (Compute) — `/api/nova`

| Method | Path | Description |
|---|---|---|
| `POST` | `/vm` | Create a virtual machine |
| `*` | `/*` | Proxy any other Nova API request to the OpenStack endpoint |

Proxy requests require the following headers:

| Header | Description |
|---|---|
| `endpoint-id` | ID of the Nova endpoint from the service catalog |
| `tenant-id` | OpenStack tenant/project ID |

---

### Neutron (Networking) — `/api/neutron`

All requests are proxied to the Neutron endpoint. Requires `endpoint-id` and `tenant-id` headers.

---

### Glance (Image) — `/api/glance`

All requests are proxied to the Glance endpoint. Requires `endpoint-id` and `tenant-id` headers.

---

### Cinder (Block Storage) — `/api/cinder`

All requests are proxied to the Cinder endpoint. Requires `endpoint-id` and `tenant-id` headers.

---

### Swift (Object Storage) — `/api/swift`

All requests are proxied to the Swift endpoint. Requires `endpoint-id` and `tenant-id` headers.

---

### Error responses

All errors follow a standard envelope:

```json
{
  "error": {
    "code": 404,
    "title": "Not Found",
    "message": "The requested resource was not found."
  }
}
```

| HTTP Status | Error class | Meaning |
|---|---|---|
| 400 | `InvalidJsonError` | Malformed JSON body |
| 401 | `NotAuthenticatedError` | Missing or invalid credentials |
| 404 | `ResourceNotFoundError` | Resource or URL does not exist |
| 405 | `MethodNotAllowedError` | HTTP method not allowed on this route |
| 500 | `InternalError` | Unexpected server error |
| 501 | `NotImplementedError` | Feature not yet implemented |

---

## Project Structure

```
aurora-core/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── identity/        # Keystone routes & controller
│   │   │   ├── nova/            # Nova routes & controller
│   │   │   ├── neutron/         # Neutron routes & controller
│   │   │   ├── glance/          # Glance routes & controller
│   │   │   ├── cinder/          # Cinder routes & controller
│   │   │   └── swift/           # Swift routes & controller
│   │   └── api-router-factory.ts  # Assembles all routers
│   ├── services/
│   │   ├── openstack-service.ts   # Base HTTP client for OpenStack
│   │   ├── openstack-api-model.ts # Base service model (endpoint management)
│   │   ├── identity.ts            # Keystone (Identity) service
│   │   ├── nova-service.ts        # Nova (Compute) service
│   │   ├── neutron-service.ts     # Neutron (Networking) service
│   │   ├── glance-service.ts      # Glance (Image) service
│   │   ├── cinder-service.ts      # Cinder (Block Storage) service
│   │   └── swift-service.ts       # Swift (Object Storage) service
│   ├── common/
│   │   ├── rest/                  # Base REST classes (controller, router, errors)
│   │   ├── logging/               # Winston logger factory
│   │   ├── rabbit-client.ts       # RabbitMQ subscriber client
│   │   ├── event-emitter.ts       # Internal event bus
│   │   └── types.ts               # Shared TypeScript interfaces
│   ├── config/
│   │   ├── app-config.ts          # Reads and validates environment variables
│   │   └── amqp-topology.ts       # RabbitMQ topology loader
│   ├── utils/
│   │   ├── authentication-utils.ts
│   │   ├── service-utils.ts       # HTTP request helper & service registration
│   │   └── router-utils.ts        # Express middleware helpers
│   ├── app.ts                     # Application entry point
│   └── express-app-factory.ts     # Creates and configures the Express app
├── spec/                          # Jasmine test specs
├── topology.json                  # RabbitMQ exchange/queue topology
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── tslint.json
├── .env.ci                        # Example environment file for CI
└── package.json
```

---

## Development

### Build

```bash
npm run build        # Compile TypeScript once
npm run dev          # Compile and watch for changes (with nodemon)
```

### Lint

```bash
npm run lint
```

Linting uses [TSLint](https://palantir.github.io/tslint/) with the rules defined in `tslint.json`.

### Test

```bash
npm test
```

Tests are written with [Jasmine](https://jasmine.github.io/) and live in the `spec/` directory.

---

## Logging

Aurora Core uses [Winston](https://github.com/winstonjs/winston) with the following custom log levels (most to least verbose):

| Level | Use |
|---|---|
| `trace` | Very detailed tracing |
| `debug` | Diagnostic messages |
| `info` | General operational messages |
| `warn` | Non-critical warnings |
| `crit` | Critical conditions |
| `error` | Error conditions |

Logs are written to both the console and to `logs/aurora.log` (rotated every 1,000 bytes, keeping up to 5 files as configured in `app/common/logging/logger-factory.ts`). Set the desired level with the `LOG_LEVEL` environment variable.

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).
