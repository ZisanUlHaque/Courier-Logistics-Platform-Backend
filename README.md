# 🚚 Courier & Logistics Management Platform

A scalable, production-ready backend for managing the complete lifecycle of courier and logistics operations — from shipment creation to delivery.

## 📋 Overview

This platform enables:
- **Customers** to create shipments, track parcels, and manage deliveries
- **Couriers** to handle assigned deliveries and update delivery progress
- **Administrators** to manage the entire logistics operation

## 🎯 Problem Statement

Courier companies need a reliable backend system to manage parcels through their entire journey: pickup → hub sorting → transit → delivery. This platform provides that foundation with proper role-based access, shipment tracking, and operational management.

## ✨ Features

### Completed (Day 1)
- [x] Professional modular architecture
- [x] PostgreSQL database with Prisma ORM
- [x] Complete database schema (9 models, 10 enums)
- [x] Proper relations, constraints, and indexes
- [x] Soft-delete support
- [x] Seed data with realistic records
- [x] Environment validation
- [x] Express application with security middleware
- [x] Health check endpoint
- [x] Global error handling foundation
- [x] Validation middleware foundation
- [x] Auth middleware foundation
- [x] External service configurations
- [x] Deployment-ready configuration

### Planned (Day 2–5)
- [ ] JWT Authentication (access + refresh tokens)
- [ ] Google OAuth integration
- [ ] Role-based access control (RBAC)
- [ ] User management APIs
- [ ] Shipment CRUD with state machine
- [ ] Courier assignment and delivery workflow
- [ ] Real-time shipment tracking
- [ ] Payment integration (bKash / SSLCommerz / Stripe)
- [ ] Email notifications
- [ ] Image upload (Cloudinary)
- [ ] Redis caching
- [ ] Analytics dashboard
- [ ] Audit logging

## 👥 Roles

| Role | Description |
|------|-------------|
| CUSTOMER | Creates and tracks shipments |
| COURIER | Handles deliveries |
| ADMIN | Full system management |

## 🛠 Technology Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Cache | Redis |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer |
| OAuth | Google OAuth |
| Payment | bKash / SSLCommerz / Stripe |
| Deployment | Render |

## 🏗 Architecture

```
Client → Express Router → Middleware → Controller → Service → Prisma → PostgreSQL
```

Modular architecture with strict separation of concerns.

## 🗄 Database

- **9 Models**: User, RefreshToken, CourierProfile, Shipment, ShipmentAddress, ShipmentItem, Hub, Zone, ShipmentTrackingEvent
- **10 Enums**: UserRole, UserStatus, ShipmentStatus, PaymentStatus, AddressType, VehicleType, AvailabilityStatus, HubStatus, ZoneStatus, PackageType
- **Soft delete** on User, Shipment, Hub
- **Composite indexes** for performance

See [Database Design](docs/database-design.md) for full ERD.

## 🚀 Installation

```bash
# Clone repository
git clone <repo-url>
cd courier-logistics-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values
```

## 🔧 Environment Variables

See `.env.example` for all required and optional variables.

**Required:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` — JWT signing key
- `JWT_REFRESH_SECRET` — Refresh token signing key

## 📦 Prisma Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run seed

# Open Prisma Studio
npm run prisma:studio
```

## 🌱 Seed Data

| Type | Count | Details |
|------|-------|---------|
| Admin | 1 | admin@example.com / Admin@12345 |
| Customers | 3 | rafiq@, fatima@, kamal@ / Customer@123 |
| Couriers | 3 | jamal.courier@, sumon.courier@, rashed.courier@ / Courier@123 |
| Hubs | 3 | DHK-01, BOG-01, CTG-01 |
| Zones | 6 | DHAKA-CENTRAL, BOGURA-CENTRAL, etc. |
| Shipments | 5 | Various statuses with addresses, items, tracking |

## 🔄 API Versioning

All APIs are under `/api/v1`. See [API Plan](docs/api-plan.md) for 30 planned endpoints.

## 💻 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🏥 Health Check

```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "OK",
    "environment": "development",
    "timestamp": "2026-01-18T10:00:00.000Z",
    "database": "connected",
    "uptime": "42s"
  }
}
```

## 📖 Documentation

- [Roles & Permissions](docs/roles-and-permissions.md)
- [Database Design & ERD](docs/database-design.md)
- [API Plan](docs/api-plan.md)