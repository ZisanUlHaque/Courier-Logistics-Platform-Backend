# Courier and Logistics Management Platform

Production-oriented REST API for managing shipments from creation through delivery. The platform supports customers, couriers, and administrators with role-based access, shipment tracking, hub operations, pricing, payments, email, image uploads, and analytics.

## Capabilities

- Customer registration, email verification, login, password recovery, and profile management
- JWT authentication with access-token and refresh-token endpoints
- Google sign-in support when configured
- Customer shipment creation, updates, cancellation, and ownership-protected queries
- Courier profiles, availability, assigned-shipment views, and delivery status updates
- Admin user status management, courier assignment, and operational dashboard data
- Shipment tracking timelines and courier/admin tracking-event creation
- Delivery pricing calculation
- bKash payment initiation, callback handling, verification, and payment history
- Cloudinary profile-image uploads
- PostgreSQL persistence through Prisma with committed migrations
- Redis and SMTP integrations initialized during application startup

## Technology

- Node.js and TypeScript
- Express 5
- PostgreSQL
- Prisma 7 with the PostgreSQL adapter
- Zod request validation
- JWT and bcryptjs authentication
- Redis, Nodemailer, Cloudinary, Google OAuth, and bKash integrations

## Architecture

```text
Client -> Express routes -> middleware -> controllers -> services -> Prisma -> PostgreSQL
```

The source is organized by module under `src/app/module`. Shared configuration, middleware, libraries, utilities, templates, and generated Prisma code live under `src/app` and `src/generated`.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- Redis
- SMTP credentials for the configured mail provider
- bKash, Cloudinary, or Google credentials only when those integrations are used

## Installation

```bash
git clone <repository-url>
cd "Courier and Logistics Platform"
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Update `.env` before starting the application. Never commit `.env` or real credentials.

## Environment Configuration

### Required for startup

The current server connects to all three services before it starts listening:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `ADMIN_NAME` | Seed administrator name |
| `ADMIN_EMAIL` | Seed administrator email |
| `ADMIN_PASSWORD` | Seed administrator password |
| `TESTER_CUSTOMER_NAME` | Seed customer name |
| `TESTER_CUSTOMER_EMAIL` | Seed customer email |
| `TESTER_CUSTOMER_PASSWORD` | Seed customer password |
| `TESTER_COURIER_NAME` | Seed courier name |
| `TESTER_COURIER_EMAIL` | Seed courier email |
| `TESTER_COURIER_PASSWORD` | Seed courier password |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port |
| `SMTP_USER` | SMTP/Gmail username |
| `SMTP_PASSWORD` | SMTP app password or provider password |

Use strong, unique secrets and credentials in production. The values in `.env.example` are development defaults and must be replaced.

### Application settings

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `5000` | HTTP listen port |
| `BACKEND_URL` | `http://localhost:5000` | Public backend URL |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `BCRYPT_SALT_ROUNDS` | `12` | Password-hashing cost |
| `JWT_ACCESS_EXPIRES_IN` | `1d` | Access-token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh-token lifetime |
| `EMAIL_SENDER` | empty | Sender address used by mail flows |

### Optional integrations

Set the following variables when enabling the related feature:

- Google OAuth: `GOOGLE_CLIENT_ID`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- bKash: `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_CALLBACK_URL`
- Redis authentication: `REDIS_USER`, `REDIS_PASSWORD`

The complete variable list is maintained in [.env.example](.env.example).

## Database Setup

Generate the Prisma client and apply committed migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

For local schema development, use:

```bash
npx prisma migrate dev --name describe-your-change
```

The Prisma schema is split across `prisma/schema`. Migrations are stored in `prisma/migrations`.

## Seed Data

The application runs `runMasterSeeder()` during startup. It creates the configured administrator, tester customer, tester courier, hubs, zones, and representative shipment data when those records do not already exist.

Seed credentials come from `.env`, not hard-coded production values. Use dedicated non-production credentials for local or staging environments, and do not use tester accounts in production.

## Run Commands

```bash
# Development with automatic TypeScript reload
npm run dev

# Type-check and compile to dist/
npm run build

# Run the compiled production server
npm start
```

`npm start` runs `dist/src/server.js`, so `npm run build` must be completed first. The repository does not currently define separate npm scripts for Prisma or seeding; use the `npx prisma ...` commands above.

## API

The API base path is `/api/v1`.

| Area | Base path | Access |
|---|---|---|
| Authentication | `/api/v1/auth` | Public and authenticated flows |
| User profile | `/api/v1/user` | Authenticated users |
| Shipments | `/api/v1/shipments` | Customer, courier, or admin depending on operation |
| Hubs | `/api/v1/hubs` | Admin and courier read access; admin writes |
| Couriers | `/api/v1/couriers` | Courier |
| Tracking | `/api/v1/tracking` | Public timeline; courier/admin event writes |
| Pricing | `/api/v1/pricing` | Public calculation endpoint |
| Administration | `/api/v1/admin` | Admin |
| Payments | `/api/v1/payments` | Customer and admin depending on operation |
| Analytics | `/api/v1/analytics` | Role-specific authenticated endpoints |

Protected endpoints accept an access token in the configured cookie or:

```http
Authorization: Bearer <access-token>
```

The root endpoint can be used for a basic availability check:

```http
GET /
```

The application does not currently expose a dedicated `/health` endpoint. Add an infrastructure health check before deploying to an orchestrated production environment if separate liveness and readiness checks are required.

## Roles

| Role | Responsibility |
|---|---|
| `CUSTOMER` | Own shipments, addresses, payments, and tracking views |
| `COURIER` | Assigned deliveries, availability, location, and status updates |
| `ADMIN` | Users, courier assignment, hubs, operations, payments, and analytics |

Authorization is enforced by the auth middleware and route-level role checks. Customer shipment queries are scoped to the authenticated customer, and courier operations are scoped to assigned work.

## Shipment Lifecycle

```text
PENDING_PAYMENT -> CONFIRMED -> PICKUP_SCHEDULED -> COURIER_ASSIGNED
-> PICKED_UP -> AT_ORIGIN_HUB -> IN_TRANSIT -> AT_DESTINATION_HUB
-> OUT_FOR_DELIVERY -> DELIVERED
```

Exception states include `DELIVERY_FAILED`, `RETURN_INITIATED`, `RETURN_IN_TRANSIT`, `RETURNED`, and `CANCELLED`.

## Production Deployment Checklist

1. Provision PostgreSQL, Redis, and SMTP access for the deployment environment.
2. Set `NODE_ENV=production`, a restricted `FRONTEND_URL`, strong JWT secrets, and non-default seed credentials.
3. Configure only the integrations required by the deployed features.
4. Install dependencies with `npm ci`.
5. Build the application with `npm run build`.
6. Apply migrations with `npx prisma migrate deploy`.
7. Start the service with `npm start`.
8. Confirm the root endpoint, authentication flow, database connectivity, Redis connectivity, and mail transport.
9. Put the service behind HTTPS and a reverse proxy or managed load balancer.
10. Configure process supervision, structured log collection, database backups, secret rotation, and monitoring.

The server currently verifies PostgreSQL, Redis, and SMTP during startup. A failure in any of those checks prevents the HTTP server from starting.

## Security Notes

- Do not commit `.env`, credentials, tokens, or payment secrets.
- Use HTTPS in every non-local environment.
- Restrict `FRONTEND_URL` to the deployed frontend origin; do not use a wildcard CORS policy with credentials.
- Use provider-specific app passwords or secret stores for SMTP and third-party integrations.
- Treat seeded accounts as disposable test fixtures and rotate their credentials outside development.
- Keep Prisma migrations under source control and back up production data before schema changes.

## Project Layout

```text
src/
  app/
    config/       Environment-backed configuration
    lib/          Prisma, Redis, mail, storage, OAuth, and payment clients
    middleware/   Auth, validation, error, and not-found middleware
    module/       Feature modules with routes, controllers, services, and validation
    templates/    EJS email templates
    utils/        Seed, JWT, pagination, and response helpers
  app.ts          Express application and route registration
  server.ts       Dependency startup and HTTP server entry point
prisma/
  schema/         Prisma models and enums
  migrations/     Committed database migrations
```

## License

This project currently uses the ISC license declared in `package.json`.