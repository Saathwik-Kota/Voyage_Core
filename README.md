# VoyageCore: Distributed Polyglot Microservices Engine

**Architect & Author**: Saathwik Kota  

---

## 1. Project Overview

VoyageCore is a high-throughput, distributed microservices platform designed for travel planning, route exploration, inventory allocation, and transaction processing. Engineered with an emphasis on loose coupling, high availability, and domain-driven design (DDD), the system replaces monolithic architectures with purpose-built microservices operating behind an edge API Gateway.

The platform addresses two distinct data access patterns inherent to global travel management:
1. **Relational Transaction Processing (OLTP)**: Strictly consistent account credentials, booking records, payment ledgers, and inventory counters requiring ACID compliance.
2. **Graph-Centric Route Navigation**: Highly connected destination topologies, multi-city route traversal, and transit optimizations requiring low-latency graph traversals.

To resolve these orthogonal access requirements without compromise, VoyageCore implements a dual-database polyglot persistence architecture utilizing PostgreSQL 15 for relational consistency and Neo4j 5 for graph operations.

---

## 2. System Architecture

The platform follows the API Gateway pattern with reverse-proxy edge termination, internal network isolation, centralized authentication, and asynchronous distributed tracing.

### 2.1 Architectural Flow Diagram

```
                              +------------------------------------------+
                              |          Client / Browser Edge           |
                              +--------------------+---------------------+
                                                   | HTTPS (TLSv1.3)
                                                   v
                              +------------------------------------------+
                              |         Nginx Reverse Proxy              |
                              |         Port 80 (Redirect) / 443         |
                              +----------+--------------------+----------+
                                         |                    |
                  Static Assets / UI     |                    | /api/* Route Requests
                                         v                    v
+------------------------------------------+        +------------------------------------------+
|         voyage-admin-dashboard           |        |           voyage-api-gateway             |
|         React 18 + Material-UI           |        |       Express Edge Router (Port 3000)    |
|       SPA Console / Port 80 (Docker)     |        |    JWT Auth / Rate Limit / Jaeger Trace  |
+------------------------------------------+        +---------------------+--------------------+
                                                                          |
                    +-----------------------+----------------------+------+-----------------------+
                    |                       |                      |                              |
                    | :3001                 | :3002                | :3003                        | :3004
                    v                       v                      v                              v
+-----------------------+ +-----------------------+ +-----------------------+ +-----------------------+
|   identity-manager    | |    profile-service    | |    booking-engine     | |  transaction-service  |
| Node.js / Express     | | Node.js / Express     | | Node.js / Express     | | Node.js / Express     |
| JWT Auth / Bcrypt     | | RBAC User Lifecycle   | | Trips, Accommodations | | Stripe & PayPal Core  |
| Tokens & Cryptography | | Account Profiling     | | Itineraries & Transit | | Payment Methods / Log |
+-----------+-----------+ +-----------+-----------+ +-----+-----------+-----+ +-----------+-----------+
            |                         |                   |           |                   |
            +------------+------------+                   |           |                   |
                         |                                |           |                   |
                         v                                v           |                   v
+-------------------------------------------------------------+       | +-----------------------------+
|                      voyage-postgres                        |       | |        voyage-neo4j         |
|              PostgreSQL 15 Relational Store                 |       | |  Neo4j 5 Graph Database     |
|    Users, Travels, Bookings, Payments, Payment Methods      |       | |  Destination Nodes & Routes |
+-------------------------------------------------------------+       | |  CONNECTS_TO Relationships  |
                                                                      | +-----------------------------+
                                                                      +-------------------+
                                                                                          |
+-----------------------------------------------------------------------------------------v-----------+
|                                    Cross-Cutting Infrastructure Services                            |
|                                                                                                     |
|  * HashiCorp Vault (Port 8200): Centralized secret storage, token issuance, and key rotation        |
|  * Jaeger Distributed Tracer (Port 16686 / 6831 UDP): End-to-end distributed span propagation       |
+-----------------------------------------------------------------------------------------------------+
```

### 2.2 Core Microservices Specification

| Service Name | Port | Primary Responsibility | Backing Store |
| :--- | :--- | :--- | :--- |
| **voyage-api-gateway** | 3000 | Ingress proxying, rate limiting, JWT validation, Jaeger span injection | None (Stateless) |
| **identity-manager** | 3001 | User authentication, token issuance, password salting (bcrypt), session tokens | PostgreSQL |
| **profile-service** | 3002 | Identity profile CRUD, role management, access auditing | PostgreSQL |
| **booking-engine** | 3003 | Travel package catalog, accommodations, transport schedules, route graphs | PostgreSQL + Neo4j |
| **transaction-service**| 3004 | Stripe & PayPal processing, transaction state machines, payment configs | PostgreSQL |
| **admin-dashboard** | 3005 (80)| React-based administrative console for catalog and security management | API Gateway |

---

## 3. Polyglot Persistence Strategy

A foundational design principle of VoyageCore is matching storage engines to workload semantics rather than forcing heterogeneous structures into a single database paradigm.

### 3.1 Relational Architecture (PostgreSQL 15)
PostgreSQL handles structured entities where transactional consistency, referential integrity, and ACID guarantees are strictly necessary.

*   **Schema Segregation**: Normalized entity models covering `users`, `travels`, `travel_destinations`, `accommodations`, `transportation`, `activities`, `bookings`, `payment_methods`, and `payments`.
*   **Referential Integrity and Cascades**: Strict foreign key constraints with `ON DELETE CASCADE` across travel itineraries, accommodations, and transit schedules prevent orphaned records upon package deletion.
*   **Indexing Strategy**:
    *   B-tree index on `users(email)` for sub-millisecond authentication lookups.
    *   Compound index on `travels(start_date, end_date)` for temporal range filtering.
    *   Status indexes on `travels(status)` and `payments(status)` for administrative state checks.
    *   Foreign key index on `payments(booking_id)` for transaction ledger lookups.
*   **Audit Automation**: Triggers execute `update_updated_at_column()` across all core tables to enforce immutable audit timestamps.

### 3.2 Graph Architecture (Neo4j 5)
Traditional relational schemas face combinatorial latency when querying multi-hop transit routes due to repeated self-joins on junction tables. VoyageCore delegates transit pathfinding to Neo4j.

*   **Node Schemas**: `(:Destination {id, name, country, city, popularity})`
*   **Relationship Schemas**: `[:CONNECTS_TO {distance_km, travel_time_hours}]`
*   **Graph Traversals**: Cypher queries calculate shortest transit paths, route alternatives, and multi-destination sequencing in $O(k)$ time relative to graph depth, bypassing relational joins entirely:
    ```cypher
    MATCH (source:Destination {name: $origin})-[r:CONNECTS_TO*1..3]->(target:Destination {name: $destination})
    RETURN source.name, target.name, reduce(time = 0, rel in r | time + rel.travel_time_hours) AS totalTime
    ORDER BY totalTime ASC
    LIMIT 5;
    ```

---

## 4. Security & Identity Architecture

### 4.1 Stateless Authentication & RBAC
1.  **Ingress Guarding**: All incoming requests to protected routes pass through the API Gateway, which inspects the `Authorization: Bearer <token>` header.
2.  **Cryptographic Verification**: JWT tokens signed using HMAC-SHA256 with 24-hour expiration windows encode identity attributes (`id`, `email`, `role`).
3.  **Role Enforcement**: Route-level middleware intercepts downstream propagation:
    *   Public: Registration, login, catalog exploration.
    *   Authenticated User: Booking reservations, payment execution.
    *   Admin: User lifecycle management, destination creation, payment gateway credentials.

### 4.2 Edge Hardening & Perimeter Defense
*   **TLS/SSL Termination**: Nginx serves HTTPS using TLSv1.2/1.3 with cryptographic cipher isolation (`HIGH:!aNULL:!MD5`).
*   **Defense-in-Depth Headers**: Enforces HTTP Strict Transport Security (`HSTS`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and Cross-Site Scripting filtering (`X-XSS-Protection`).
*   **Rate Limiting**: Express-rate-limit middleware protects backend microservices against credential-stuffing and distributed denial-of-service (DDoS) vectors (100 requests per 15-minute sliding window per IP).
*   **Internal Network Isolation**: Containers communicate exclusively over a private bridge network (`voyage-network`), preventing direct public Internet exposure of PostgreSQL, Neo4j, Vault, or downstream microservices.

---

## 5. Technology Stack

| Layer | Technologies | Justification |
| :--- | :--- | :--- |
| **Frontend SPA** | React 18, React Router v6, Material-UI (MUI 5), Axios | Component-driven administrative UI with responsive client-side routing. |
| **API Gateway** | Node.js, Express, Axios, Helmet, Express-Rate-Limit | Non-blocking asynchronous reverse-proxy with minimal latency overhead. |
| **Backend Services** | Node.js, Express, Joi, Winston, Jaeger Client | Lightweight, event-driven I/O with unified logging and schema validation. |
| **Primary Database** | PostgreSQL 15 (Alpine), `pg` connection pool | Robust relational transactions, relational triggers, and foreign key cascades. |
| **Graph Database** | Neo4j 5 Community, Neo4j Bolt JavaScript Driver | Native graph traversal for multi-hop transit topologies and travel routes. |
| **Secrets Engine** | HashiCorp Vault 1.15 | Centralized secret vault with access control and environment isolation. |
| **Observability** | Jaeger Tracing 1.51, Winston Structured JSON | Distributed context propagation across microservice RPC boundaries. |
| **Containerization** | Docker, Docker Compose (v2), Multi-stage Dockerfiles | Reproducible container runtimes with health check loops and restart policies. |
| **Orchestration** | Kubernetes 1.28+ (Deployments, Services, ConfigMaps, Secrets)| Scalable cloud-native production spec with rolling update strategies. |
| **CI/CD & DevOps** | GitHub Actions, Jenkins, Ansible, SonarQube Scanner | Continuous static analysis, automated parallel test suites, and remote deployment. |

---

## 6. Directory Structure

```
Microservices_travel_planner/
├── .github/
│   └── workflows/ci-cd.yml           # GitHub Actions automated test & build matrix
├── admin-dashboard/                  # React 18 administrative web application
│   ├── public/                       # Static index HTML and assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookingManager.js     # Travel package & itinerary management
│   │   │   ├── Dashboard.js          # Main navigation layout shell
│   │   │   ├── Login.js              # Authentication view
│   │   │   ├── ProfileManager.js     # User identity & role management
│   │   │   └── TransactionMethods.js # Payment gateway configuration view
│   │   ├── context/AuthContext.js    # React Context provider for JWT auth state
│   │   ├── App.js                    # Client routing tree & protected routes
│   │   └── index.js                  # React DOM bootstrapping
│   ├── Dockerfile                    # Multi-stage production build (Node -> Nginx)
│   └── nginx.conf                    # Nginx SPA fallback routing
├── ansible/                          # Automated infrastructure provisioning
│   ├── inventory/hosts               # Deployment host declarations
│   └── deploy.yml                    # Docker deployment orchestration playbook
├── database/
│   ├── neo4j/init.cypher             # Destination graph nodes & transit constraints
│   └── postgres/init.sql             # Relational schemas, indexes, and triggers
├── kubernetes/
│   └── deployment.yml                # Kubernetes production manifests (Deployments & Services)
├── nginx/
│   ├── nginx.conf                    # Edge reverse proxy & SSL configuration
│   └── ssl/                          # TLS certificates (cert.pem, key.pem)
├── services/
│   ├── api-gateway/                  # Edge Gateway microservice
│   │   └── src/index.js              # Reverse proxy routing, rate limiting, and auth
│   ├── booking-engine/               # Trip & Itinerary microservice
│   │   ├── src/
│   │   │   ├── controllers/booking.controller.js
│   │   │   ├── routes/booking.routes.js
│   │   │   └── index.js              # Service bootstrap & database connections
│   │   └── tests/booking.test.js     # Jest + Supertest test suite
│   ├── identity-manager/             # Authentication & Token microservice
│   │   ├── src/
│   │   │   ├── controllers/identity.controller.js
│   │   │   ├── routes/identity.routes.js
│   │   │   └── index.js              # Service bootstrap & database connections
│   │   └── tests/identity.test.js    # Jest + Supertest test suite
│   ├── profile-service/              # User Profile & RBAC microservice
│   │   ├── src/
│   │   │   ├── controllers/profile.controller.js
│   │   │   ├── routes/profile.routes.js
│   │   │   └── index.js              # Service bootstrap & database connections
│   │   └── tests/profile.test.js     # Jest + Supertest test suite
│   └── transaction-service/          # Payments & Settlements microservice
│       ├── src/
│       │   ├── controllers/transaction.controller.js
│       │   ├── routes/transaction.routes.js
│       │   └── index.js              # Service bootstrap & database connections
│       └── tests/transaction.test.js # Jest + Supertest test suite
├── docker-compose.yml                # Full stack multi-container orchestration spec
├── docker-compose-simple.yml         # Database-only backing services spec
├── Jenkinsfile                       # Parallelized Jenkins CI pipeline
├── sonar-project.properties          # SonarQube code quality configuration
├── start-all.sh                      # Local multi-service start script
├── start-backend.sh                  # Backend services local runner
├── start-frontend.sh                 # React development server runner
├── test-cluster.ps1                  # Automated PowerShell end-to-end smoke test script
├── voyagecore.http                   # VS Code REST Client interactive API collection
└── README.md                         # Technical systems architecture documentation
```

---

## 7. Local Testing & Verification Instructions

### 7.1 Prerequisites
* Docker Engine 24.0+ and Docker Compose v2+
* Node.js 18.x LTS (for running standalone unit test suites locally)
* cURL or PowerShell (for API verification)

### 7.2 Configuration
Initialize the local environment configuration from the template:
```bash
cp .env.example .env
```

Ensure default ports are available on your host system:
* `80`, `443`: Nginx Edge Ingress
* `3000`: API Gateway
* `3001` - `3004`: Downstream Backend Microservices
* `3005`: Admin Console
* `5432`: PostgreSQL
* `7474`, `7687`: Neo4j Browser & Bolt Protocol
* `8200`: HashiCorp Vault
* `16686`: Jaeger Query UI

### 7.3 Bootstrapping the Cluster with Docker Compose
To build all images and start all services in detached mode with active health checks:
```bash
docker compose up -d --build
```

Verify service statuses and health checks:
```bash
docker compose ps
```
All containers should report `Up` or `Up (healthy)`.

### 7.4 Automated Smoke Test Execution
An automated test script is provided in the repository root to verify the entire system in one execution:

```powershell
.\test-cluster.ps1
```

This script automatically verifies:
1. API Gateway health and downstream service discovery resolution.
2. Public catalog accessibility from the Booking Engine.
3. Administrator authentication and JWT generation from the Identity Manager.
4. RBAC-protected profile querying from the Profile Service.
5. Travel package creation and cascading deletion.
6. Payment gateway configuration retrieval from the Transaction Service.
7. Admin Dashboard availability on port 3005.

### 7.5 Manual Endpoint Verification

#### 1. API Gateway Health Verification
```bash
curl -s http://localhost:3000/health | jq .
```
Expected output:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "downstream": {
    "identityManager": "http://identity-manager:3001",
    "profileService": "http://profile-service:3002",
    "bookingEngine": "http://booking-engine:3003",
    "transactionService": "http://transaction-service:3004"
  }
}
```

#### 2. Authentication Flow (Identity Manager)
Authenticate as the seeded administrator:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@travel.com","password":"Admin@123"}' | jq -r .token)

echo "Issued JWT: $TOKEN"
```

#### 3. Accessing Protected Profile Service via API Gateway
```bash
curl -s -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 4. Querying Travel Itineraries (Booking Engine)
```bash
curl -s -X GET http://localhost:3000/api/travels | jq .
```

#### 5. Inspecting Graph Relationships (Neo4j)
Navigate to `http://localhost:7474` in your browser.  
Log in with credentials:
* User: `neo4j`
* Password: `change_me_in_production` (or `Neo4jPass2024!`)

Execute the following Cypher inspection query:
```cypher
MATCH (origin:Destination)-[r:CONNECTS_TO]->(destination:Destination)
RETURN origin.name, destination.name, r.distance_km, r.travel_time_hours;
```

#### 6. Inspecting Distributed Traces (Jaeger)
Navigate to `http://localhost:16686` in your browser to inspect end-to-end trace waterfalls, latencies, and service dependencies across requests routed through `voyage-api-gateway`.

### 7.6 Running Automated Unit & Integration Tests
Each microservice contains independent Jest and Supertest test suites with in-memory execution capabilities.

To run tests across all microservices individually:
```bash
# Identity Manager
cd services/identity-manager && npm test

# Profile Service
cd ../profile-service && npm test

# Booking Engine
cd ../booking-engine && npm test

# Transaction Service
cd ../transaction-service && npm test
```

### 7.7 Teardown
To cleanly stop all containers and remove networks:
```bash
docker compose down
```
To remove persistent storage volumes as well:
```bash
docker compose down -v
```

---

## 8. Engineering Design Highlights

1. **Strict Boundary Encapsulation**: Each microservice maintains complete encapsulation over its internal controllers and route definitions (`controllers/` and `routes/`). No service directly accesses another service's internal state.
2. **Graceful Degradation and Non-Blocking Tracing**: Distributed Jaeger spans are instrumented with asynchronous context handoff, ensuring tracing overhead never blocks client response threads.
3. **High-Availability Ingress Configuration**: Nginx handles SSL termination and reverse proxies both client UI traffic and backend API traffic through explicit upstream declarations, eliminating CORS hurdles in production deployments.
4. **Polyglot Optimization**: Isolating complex transit path queries inside Neo4j preserves PostgreSQL connection pool availability for latency-sensitive financial and user profile operations.
