<div align="center">

# ⚡ BetterUptime

### A distributed website uptime monitoring system built with Redis Streams, PostgreSQL & Turborepo

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-black?logo=bun&logoColor=white)](https://bun.sh/)
[![Redis](https://img.shields.io/badge/Redis-Streams-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo&logoColor=white)](https://turborepo.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000?logo=next.js&logoColor=white)](https://nextjs.org/)

</div>

---

## 📖 Overview

**BetterUptime** is a real-time website uptime monitoring platform that tracks the health, status, and response times of registered websites. It uses a **distributed, event-driven architecture** powered by **Redis Streams** for decoupled communication between services, ensuring scalability and fault-tolerance.

Users register websites via the **REST API**, and the system periodically pings those websites from monitoring workers, recording latency, status (`UP` / `Down`), and region data — all stored in **PostgreSQL** via **Prisma ORM**.

---

## 🏗️ System Architecture

<div align="center">

![System Design](apps/structure.jpg)

</div>

The system follows an **event-driven, microservice-like architecture** built as a Turborepo monorepo. Here is a high-level overview of the data flow:

```
┌──────────────┐       ┌──────────────────────────────────────────────────────────┐
│   Frontend   │       │                     Redis Streams                       │
│   (Next.js)  │       │                                                          │
└──────┬───────┘       │  ┌─────────────────────┐    ┌─────────────────────────┐  │
       │               │  │ betterstack:website  │    │    betterstack:db       │  │
       │ HTTP          │  │  (website URLs queue) │───▶│ (monitoring results)   │  │
       ▼               │  └──────────▲───────────┘    └───────────┬────────────┘  │
┌──────────────┐       │             │                            │               │
│   REST API   │       └─────────────┼────────────────────────────┼───────────────┘
│  (Express)   │──── reads websites  │                            │
│  Port 3000   │     from DB &       │                            │
│              │     publishes       │         ┌──────────────────▼─────────────┐
└──────┬───────┘                     │         │         DB Pusher              │
       │                             │         │    (Consumer → PostgreSQL)     │
       │                             │         │  Reads results from stream     │
       ▼                             │         │  & batch-inserts into Ticks    │
┌──────────────┐              ┌──────┴───────┐ └──────────────┬────────────────┘
│  PostgreSQL  │◀─────────────│  Publisher   │                │
│   (Prisma)   │              │  (Scheduler) │                │
│              │◀─────────────┤ Runs every   │                │
│  - Users     │              │ 3 minutes    │                │
│  - Websites  │              └──────────────┘                │
│  - Ticks     │                                              │
│  - Regions   │◀─────────────────────────────────────────────┘
└──────────────┘
                     ┌──────────────────────────────┐
                     │     Consumer (Worker)         │
                     │  - Reads from Redis Stream    │
                     │    (consumer group: "india")  │
                     │  - Pings each website (HTTP)  │
                     │  - Measures response time     │
                     │  - Publishes result to        │
                     │    betterstack:db stream      │
                     └──────────────────────────────┘
```

### Data Flow

1. **User** registers and adds websites via the **REST API**.
2. **Publisher** (runs every 3 minutes) reads all websites from PostgreSQL and pushes their URLs into the `betterstack:website` **Redis Stream**.
3. **Consumer Worker(s)** read from the stream using a **Redis Consumer Group** (`india`), enabling horizontal scaling of workers.
4. Each consumer **pings the website** via HTTP, measures **response time** and determines **status** (`UP` / `Down`).
5. Results are pushed to the `betterstack:db` Redis Stream.
6. **DB Pusher** reads from `betterstack:db` and **batch-inserts** monitoring ticks into PostgreSQL.
7. The **Frontend** (Next.js) and API allow users to view website status and historical tick data.

---

## 📂 Project Structure

This is a **Turborepo monorepo** with the following apps and packages:

```
betteruptime/
├── apps/
│   ├── api/               # Express REST API (auth, website CRUD, status)
│   ├── publisher/         # Scheduler that publishes website URLs to Redis Stream
│   ├── consumer/          # Worker that pings websites & records results
│   │   ├── index.ts       # Stream consumer (pings websites)
│   │   └── dbpusher.ts    # Reads results from stream & writes to PostgreSQL
│   ├── web/               # Next.js frontend application
│   └── tests/             # End-to-end tests (Bun test runner)
│
├── packages/
│   ├── db/                # Prisma ORM client & schema (shared database layer)
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── ui/                # Shared React UI components
│   ├── eslint-config/     # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
│
├── turbo.json             # Turborepo pipeline configuration
└── package.json           # Root workspace config (Bun)
```

---

## 🧩 Apps & Services

### 🔌 API (`apps/api`)

The REST API built with **Express 5** that handles authentication and website management.

| Endpoint                    | Method | Auth | Description                                            |
| --------------------------- | ------ | ---- | ------------------------------------------------------ |
| `/users/signup`             | `POST` | ❌   | Register a new user (username, password, email, phone) |
| `/users/signin`             | `POST` | ❌   | Sign in and receive a JWT token                        |
| `/users/status/:websiteUrl` | `GET`  | ✅   | Get latest tick status for a specific website          |
| `/website/create`           | `POST` | ✅   | Register a new website for monitoring                  |
| `/test`                     | `GET`  | ❌   | Health check endpoint                                  |

**Key features:**

- JWT-based authentication
- Zod request body validation
- bcrypt password hashing
- CORS enabled

---

### 📡 Publisher (`apps/publisher`)

A **scheduler service** that runs every **3 minutes** and:

1. Reads all registered websites from PostgreSQL.
2. Clears the `betterstack:website` Redis Stream.
3. Re-creates the consumer group.
4. Pushes all website URLs and IDs into the stream using a **Redis pipeline** for efficiency.

---

### ⚙️ Consumer (`apps/consumer`)

The **monitoring worker** that does the actual website health checking:

#### `index.ts` — Stream Consumer

- Joins the **`india` consumer group** on the `betterstack:website` stream.
- Reads website URLs in batches of 10 (with 5s blocking).
- **Pings each URL** via HTTP GET request.
- Measures **response time** in milliseconds.
- Determines status: `UP` (HTTP < 400) or `Down` (HTTP ≥ 400 or timeout).
- Pushes results (website_id, region_id, status, response time) to the `betterstack:db` stream.
- Acknowledges processed messages via `XACK`.

#### `dbpusher.ts` — Database Writer

- Reads monitoring results from the `betterstack:db` stream.
- **Batch-inserts** ticks into PostgreSQL via `prisma.ticks.createMany()`.
- Runs every **3 minutes** to periodically flush results to the database.

---

### 🖥️ Web (`apps/web`)

A **Next.js** frontend application (scaffolded, ready for dashboard UI development).

---

### 🧪 Tests (`apps/tests`)

End-to-end tests using the **Bun test runner**:

- ✅ Website creation (with and without URL)
- ✅ User signup (with and without required fields)
- ✅ Status endpoint (with and without JWT)

---

## 🗄️ Database Schema

The PostgreSQL database is managed via **Prisma ORM** with the following models:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│     User     │      │   Website    │      │    Region    │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ id (uuid)    │──┐   │ id (uuid)    │   ┌──│ id (uuid)    │
│ username     │  │   │ url (unique) │   │  │ country      │
│ password     │  └──▶│ user_id (FK) │   │  └──────────────┘
│ mail?        │      │ createdAt    │   │
│ number?      │      └──────┬───────┘   │
└──────────────┘             │           │
                             ▼           │
                      ┌──────────────┐   │
                      │    Ticks     │   │
                      ├──────────────┤   │
                      │ id (uuid)    │   │
                      │ responseTime │   │
                      │ status (enum)│   │
                      │ website_id ──┼───┘
                      │ region_id  ──┼───┘
                      │ createdAt    │
                      └──────────────┘

              Status Enum: UP | Down | Unknown
```

---

## 🛠️ Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| **Monorepo**       | Turborepo                            |
| **Runtime**        | Bun                                  |
| **Language**       | TypeScript 5.9                       |
| **API Framework**  | Express 5                            |
| **Frontend**       | Next.js (React)                      |
| **Database**       | PostgreSQL                           |
| **ORM**            | Prisma (with `@prisma/adapter-pg`)   |
| **Message Broker** | Redis Streams (with Consumer Groups) |
| **Authentication** | JWT + bcrypt                         |
| **Validation**     | Zod                                  |
| **Testing**        | Bun Test Runner                      |
| **UI Components**  | Shared `@repo/ui` package            |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.3+)
- [Redis](https://redis.io/) (v7+ with Streams support)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- [Node.js](https://nodejs.org/) (v18+)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/betteruptime.git
cd betteruptime
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root (or in each app directory as needed):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/betteruptime"
jwt_secret="your-super-secret-key"
```

### 4. Run Database Migrations

```bash
cd packages/db
bunx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
bunx prisma generate
```

### 6. Start Redis

```bash
redis-server
```

### 7. Start All Services

From the root of the monorepo:

```bash
# Start all apps in development mode
bun run dev
```

Or start each service individually:

```bash
# Terminal 1 — API Server
cd apps/api && bun run dev

# Terminal 2 — Publisher (scheduler)
cd apps/publisher && bun index.ts

# Terminal 3 — Consumer (monitoring worker)
cd apps/consumer && bun index.ts

# Terminal 4 — DB Pusher
cd apps/consumer && bun dbpusher.ts

# Terminal 5 — Frontend
cd apps/web && bun run dev
```

---

## 🧪 Running Tests

```bash
cd apps/tests
bun test
```

> **Note:** Make sure the API server is running on `localhost:3000` before executing tests.

---

## 🔑 Why Redis Streams?

This project uses **Redis Streams** with **Consumer Groups** instead of simple pub/sub or direct HTTP calls for several key reasons:

| Feature                     | Benefit                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| **Consumer Groups**         | Multiple workers can process the same stream without duplicating work — enables horizontal scaling |
| **Message Acknowledgement** | `XACK` ensures at-least-once delivery — no monitoring ticks are lost                               |
| **Backpressure Handling**   | `BLOCK` and `COUNT` parameters allow workers to process at their own pace                          |
| **Decoupled Architecture**  | Publisher, Consumer, and DB Pusher are completely independent services                             |
| **Pipeline Batching**       | Redis pipelines are used for efficient bulk writes to streams                                      |

---

## 🗺️ Roadmap

- [ ] Dashboard UI with real-time charts and uptime history
- [ ] Multi-region monitoring (deploy consumers in multiple regions)
- [ ] Alerting system (email / SMS / webhook notifications on downtime)
- [ ] Configurable check intervals per website
- [ ] SSL certificate expiry monitoring
- [ ] Status page generation (public status pages for users)
- [ ] WebSocket-based real-time status updates in the frontend

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ using TypeScript, Redis Streams & Turborepo**

</div>
