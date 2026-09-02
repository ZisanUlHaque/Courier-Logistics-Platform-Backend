# Courier and Logistics Management Platform

## 1. Project Overview

The Courier and Logistics Management Platform is a REST API for managing parcel delivery from shipment creation through final delivery. It supports customers who send parcels, couriers who complete deliveries, and administrators who operate the logistics network.

## 2. Problem Statement

Courier operations need one reliable system for recording shipments, assigning deliveries, tracking parcel movement, and managing hubs and delivery zones. The platform must provide clear ownership, role-based permissions, and a traceable shipment history.

## 3. Goals

- Allow customers to create, view, cancel, and track their own shipments.
- Allow couriers to see assigned shipments and update delivery progress.
- Allow administrators to manage users, couriers, hubs, zones, assignments, and shipment operations.
- Keep a complete tracking history for every shipment.
- Enforce authentication, authorization, validation, and consistent API responses.
- Use PostgreSQL and Prisma as the source of truth for persistent data.

## 4. Roles and Permissions

### CUSTOMER

- Register and sign in.
- View and update their own profile.
- Create shipments and provide pickup and delivery addresses.
- View their own shipments and shipment details.
- Track their own shipments by tracking number.
- Cancel an eligible shipment before pickup.
- View tracking events for their own shipments.

Customers must not view or modify other customers' data, assign couriers, manage hubs, manage zones, or change shipment tracking status directly.

### COURIER

- Sign in and view their own profile.
- View shipments assigned to them.
- Accept or reject an eligible assignment according to the delivery workflow.
- Update the status of assigned shipments.
- Add a tracking event for an assigned shipment.
- Update availability and current location.
- View the pickup and delivery information required for assigned work.

Couriers must not access unrelated customer shipments, manage users, assign other couriers, or administer hubs and zones.

### ADMIN

- View and manage all users.
- Activate, suspend, or soft-delete users where permitted.
- Create and manage courier profiles.
- Create, update, deactivate, and list hubs and zones.
- View and manage all shipments.
- Assign and reassign couriers.
- Update shipment status when an operational correction is required.
- View all tracking events and operational summaries.

Administrators must not permanently delete records that are required for shipment history or auditability.

## 5. API Plan

All endpoints use the `/api/v1` prefix. Protected endpoints require an access token in the `Authorization: Bearer <token>` header or the configured access-token cookie. Refresh-token rotation and a `RefreshToken` database model are explicitly out of scope.

### Authentication and Profile

1. `POST /auth/register` - Register a customer.
2. `POST /auth/login` - Authenticate a user and issue an access token.
3. `GET /auth/me` - Return the authenticated user's profile.
4. `PATCH /users/me` - Update the authenticated user's profile.
5. `POST /auth/logout` - Clear the access-token cookie when cookie authentication is used.

### Customer Shipment Operations

6. `POST /shipments` - Create a shipment.
7. `GET /shipments` - List the authenticated customer's shipments.
8. `GET /shipments/:id` - Get one owned shipment.
9. `PATCH /shipments/:id` - Update an eligible shipment before pickup.
10. `DELETE /shipments/:id` - Soft-delete or cancel an eligible shipment.
11. `GET /shipments/track/:trackingNumber` - View shipment tracking.
12. `GET /shipments/:id/events` - View tracking events for an owned shipment.

### Courier Operations

13. `GET /couriers/me` - View the authenticated courier profile.
14. `PATCH /couriers/me` - Update courier profile details.
15. `PATCH /couriers/me/availability` - Update courier availability.
16. `PATCH /couriers/me/location` - Update the current courier location.
17. `GET /couriers/me/shipments` - List assigned shipments.
18. `GET /couriers/me/shipments/:id` - View an assigned shipment.
19. `POST /couriers/me/shipments/:id/accept` - Accept an assignment.
20. `POST /couriers/me/shipments/:id/reject` - Reject an assignment when allowed.
21. `PATCH /couriers/me/shipments/:id/status` - Update delivery status.
22. `POST /couriers/me/shipments/:id/events` - Add a tracking event.

### Administration

23. `GET /admin/users` - List and filter users.
24. `GET /admin/users/:id` - View a user.
25. `PATCH /admin/users/:id/status` - Activate or suspend a user.
26. `DELETE /admin/users/:id` - Soft-delete a user.
27. `GET /admin/couriers` - List courier profiles.
28. `POST /admin/couriers` - Create a courier profile for an existing user.
29. `PATCH /admin/couriers/:id` - Update a courier profile.
30. `GET /admin/shipments` - List and filter all shipments.
31. `GET /admin/shipments/:id` - View any shipment.
32. `PATCH /admin/shipments/:id/assign` - Assign or reassign a courier.
33. `PATCH /admin/shipments/:id/status` - Correct or advance shipment status.
34. `POST /admin/shipments/:id/events` - Add an operational tracking event.
35. `GET /admin/hubs` - List hubs.
36. `POST /admin/hubs` - Create a hub.
37. `PATCH /admin/hubs/:id` - Update or deactivate a hub.
38. `GET /admin/zones` - List delivery zones.
39. `POST /admin/zones` - Create a zone.
40. `PATCH /admin/zones/:id` - Update or deactivate a zone.
41. `GET /admin/dashboard` - Return operational summary metrics.

## 6. Core Data Model

The initial database contains these eight models:

- `User` - Customer, courier, and administrator accounts.
- `CourierProfile` - Vehicle, availability, and location data for a courier.
- `Shipment` - The parcel delivery record and its current lifecycle state.
- `ShipmentAddress` - Pickup and delivery addresses belonging to a shipment.
- `ShipmentItem` - Items contained in a shipment.
- `ShipmentTrackingEvent` - Immutable shipment status history.
- `Hub` - Origin, destination, and current logistics facilities.
- `Zone` - Supported delivery areas.

### Relationships

- One `User` may have one `CourierProfile`.
- One customer `User` may own many `Shipment` records.
- One courier `User` may be assigned many `Shipment` records.
- One `Shipment` has many `ShipmentAddress`, `ShipmentItem`, and `ShipmentTrackingEvent` records.
- A `Shipment` may reference an origin hub, destination hub, current hub, and assigned courier.
- Hubs may be referenced by many shipments in each of those three roles.

### Data Rules

- User email, hub code, zone code, and shipment tracking number are unique.
- Customer ownership is enforced on customer-facing shipment queries.
- Shipment tracking numbers are generated by the server.
- Shipment status changes must follow the delivery lifecycle and create a tracking event.
- User, shipment, and hub deletion uses soft deletion where historical references must remain valid.
- Foreign-key relationships use the deletion behavior defined in the Prisma schema.

## 7. Shipment Lifecycle

The supported statuses are:

`PENDING_PAYMENT` -> `CONFIRMED` -> `PICKUP_SCHEDULED` -> `COURIER_ASSIGNED` -> `PICKED_UP` -> `AT_ORIGIN_HUB` -> `IN_TRANSIT` -> `AT_DESTINATION_HUB` -> `OUT_FOR_DELIVERY` -> `DELIVERED`

Alternative terminal or exception states include `DELIVERY_FAILED`, `RETURN_INITIATED`, `RETURN_IN_TRANSIT`, `RETURNED`, and `CANCELLED`.

## 8. Technical Requirements

- Runtime: Node.js.
- Language: TypeScript with strict type checking.
- Framework: Express.js.
- Database: PostgreSQL.
- ORM: Prisma.
- Validation: Zod.
- Authentication: JWT access tokens and bcrypt password hashing.
- API format: JSON with a consistent success, message, data, and error structure.
- Architecture: routes -> middleware -> controllers -> services -> Prisma.
- Include CORS, cookie parsing, request validation, authentication middleware, not-found handling, and global error handling.
- Provide a health check endpoint and environment-based configuration.

## 9. Database and Development Deliverables

- Prisma schema split into maintainable model and enum files.
- Initial Prisma migration committed to `prisma/migrations`.
- Development seed data for one admin, customers, couriers, hubs, zones, and representative shipments.
- Prisma client generation documented in the README.
- `.env.example` documenting required database, JWT, and application settings.
- A build command that completes without TypeScript errors.

## 10. Explicit Scope Decisions

- Only three roles are supported: `CUSTOMER`, `COURIER`, and `ADMIN`.
- `RefreshToken` is not implemented and is not part of the required database model. Authentication uses access tokens only for this project scope.
- Payment gateways, Google OAuth, Redis, email, file uploads, real-time sockets, and analytics are future extensions rather than Day 1 dependencies.
- No patient, doctor, super-admin, gender, or legacy healthcare entities belong in this project.

## 11. Acceptance Criteria

- The project installs and builds successfully with the documented commands.
- Prisma validates the schema and migrations apply to a PostgreSQL database.
- Seed data can be loaded without manual SQL edits.
- Each protected endpoint enforces the permissions defined for its role.
- Customers cannot access other customers' shipments.
- Couriers can only update shipments assigned to them.
- Administrators can manage operational resources.
- Shipment status updates preserve a complete tracking history.
- Invalid input returns a structured validation error, and unknown routes return a structured not-found error.
