
# Law Elite Network: Backend Migration Strategy

This document outlines the architectural path for migrating the platform from a Firebase-centric Client SDK approach to a standalone Node.js (Express/NestJS) backend.

## Current State: Phase 1 (Clean Architecture)
The application currently uses a **Clean Architecture** pattern inside `src/lib/api`.
- **Controllers**: Entry points for the UI.
- **Services**: Business logic decoupled from React.
- **Repositories**: Data access layer wrapping Firestore.
- **Types**: Standardized DTOs for all API responses.

## Phase 2: Node.js API Proxy
1. **Server Setup**: Initialize a Node.js server (e.g., using Express).
2. **Auth Verification**: Use `firebase-admin` on the server to verify `Authorization: Bearer <id_token>` headers.
3. **Service Porting**: Copy the logic from `src/lib/api/services` directly into the Node.js project. Since they are "Plain Old JS Objects", they will run with minimal changes.
4. **Repository Refactor**: Update repositories to use `firebase-admin` Firestore SDK instead of the client SDK.

## Phase 3: Database Decoupling
1. **Interface Continuity**: The Repository interfaces remain the same.
2. **SQL/NoSQL Migration**: Implement new versions of the Repositories using Sequelize, Prisma, or Mongoose.
3. **Data Pipe**: Use the `MigrationService` to ETL data from Firestore to the new production database.

## Phase 4: Full Independence
- Remove the `firebase` client dependency from the frontend.
- Switch to standard JWT or Session cookies for authentication.
- Frontend communicates solely via `fetch()` or `axios` to the Node.js endpoints.

## Why this works
Because we have enforced the **Repository Pattern** and **Standardized Controllers**, the UI "doesn't know" it's talking to Firebase. Swapping the backend is as simple as changing the API URL once the server-side port is complete.
