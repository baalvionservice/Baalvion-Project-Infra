# SkillMatch Pro: System Architecture

This document provides a high-level overview of the system architecture for the SkillMatch Pro platform. It is designed to guide the development process, ensuring a scalable, secure, and maintainable application.

## 1. Architecture Overview

SkillMatch Pro is a full-stack web application built on a modern, serverless-oriented stack designed for global scale and real-time user experiences.

-   **Frontend:** A Next.js (App Router) application using React, TypeScript, and Tailwind CSS for a fast, server-rendered user interface. This single client layer serves the Public Site, Candidate Dashboard, Company Dashboard, and Admin Panel, rendering components and layouts based on user role.
-   **Backend & Database:** The backend is powered by Firebase, leveraging its integrated suite of services:
    -   **Firebase Authentication:** For user management (including social providers) and secure, token-based (JWT) access control.
    -   **Firestore:** A NoSQL, document-based database for all application data, providing real-time updates and massive scalability.
    -   **Cloud Storage for Firebase:** For storing candidate submission files (e.g., ZIP archives, PDFs, design files).
    -   **Genkit / Cloud Functions:** For server-side logic, including AI-powered evaluations, background jobs (e.g., ranking recalculation, notifications), and third-party integrations (e.g., GitHub, Stripe).
-   **Real-time System:** Firestore's real-time listeners are used for live updates on dashboards, leaderboards, and submission statuses without needing a separate WebSocket layer.
-   **Background Jobs:** A queueing system (like BullMQ running on a Cloud Run instance or Cloud Tasks) is used for asynchronous processing, such as sending emails, processing large uploads, and generating analytics reports.
-   **Infrastructure & Hosting:** The Next.js application is hosted on a modern cloud provider like Vercel or Firebase App Hosting for optimal performance and CI/CD. The entire backend runs on the scalable, managed infrastructure of Firebase and Google Cloud. A CDN (like Cloudflare or the one integrated with the hosting provider) is used for global asset delivery.

## 2. Frontend Architecture (Client Layer)

-   **Framework:** Next.js 14+ with the App Router, React 18 (Server Components), and TypeScript.
-   **Styling:** Tailwind CSS with shadcn/ui for a consistent and professional design system.
-   **Core Pages/Routes:**
    -   `/`: Public landing page.
    -   `/login`, `/signup`: Authentication pages.
    -   `/(app)/candidate/dashboard`: Candidate's main dashboard.
    -   `/(app)/company/dashboard`: Company's main dashboard.
    -   `/(app)/admin/dashboard`: Admin panel for platform oversight.
    -   Other role-specific routes are nested under `/(app)/[role]/...`.
-   **State Management:**
    -   **React Server Components:** Used by default for data fetching, reducing client-side JavaScript.
    -   **React `useState` / `useEffect`:** For local component state in Client Components.
    -   **React Context (`src/contexts/auth-context.tsx`):** For managing the global authentication state.

## 3. Backend Architecture (API & Core Services)

Instead of a traditional, separate backend server, SkillMatch Pro uses a more integrated approach that leverages the full power of the Next.js and Firebase stack. This reduces complexity, improves development velocity, and is inherently scalable. The logical services (Auth, User, Task, etc.) are implemented as modules within this architecture.

### 3.1. API Structure (Server Actions & Client-Side SDK)

The API follows a pattern similar to Command Query Responsibility Segregation (CQRS), where read and write operations use different paths. This optimizes for performance and scalability.

#### **Data Mutations (Writes): Next.js Server Actions**

All create, update, and delete (CUD) operations are handled by **Next.js Server Actions**. These are functions defined on the server (using the `'use server';` directive) that can be called securely and directly from client-side React components.

-   **Type-Safe RPC:** This provides a seamless, type-safe Remote Procedure Call (RPC) experience, eliminating the need to manually create and manage REST or GraphQL API endpoints, controllers, and routes.
-   **Security:** Server Actions run on the server, ensuring that business logic and sensitive operations are not exposed to the client. They have access to the authenticated user's session for permission checks.
-   **Example:** A `createTask(data)` Server Action contains the logic to validate input, check user permissions, and write a new document to the `tasks` collection in Firestore.

#### **Data Fetching (Reads): Firebase Client SDK with Security Rules**

All read operations are performed directly on the client using the **Firebase Client SDK**, primarily through custom React hooks (`useCollection`, `useDocument`) that wrap Firestore's real-time listeners (`onSnapshot`).

-   **Real-Time Data:** This approach provides live, real-time data on the frontend without needing WebSockets or polling, which is ideal for dashboards and collaborative features.
-   **Server-Side Security:** Security is not compromised because **Firestore Security Rules** provide robust, server-side authorization. These rules ensure users can only access the data they are permitted to see, based on their role, company membership, and ownership. This is a fundamental concept of the Firebase security model.

#### **Authentication: Firebase Authentication SDK**

User identity management (signup, login, logout, session management) is handled entirely by the Firebase Authentication client-side SDK. A React Context (`AuthContext`) makes the user's session state (including JWT for server-side validation in Server Actions) available throughout the application.

#### **Mapping Traditional REST to the SkillMatch Pro Architecture**

The following table shows how traditional REST API endpoints map to this modern, integrated architecture:

| **Traditional REST Endpoint**             | **SkillMatch Pro Implementation**                                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/signup`                       | `signup(details)` function in `AuthContext`.                                                                                                                                                                                                                                                                                |
| `POST /auth/login`                        | `login(credentials)` function in `AuthContext`.                                                                                                                                                                                                                                                                             |
| `POST /auth/refresh`                      | Handled automatically by the Firebase SDK.                                                                                                                                                                                                                                                                                  |
| `POST /auth/logout`                       | `logout()` function in `AuthContext`.                                                                                                                                                                                                                                                                                       |
| `GET /users/me`                           | The `user` object from the `useAuth()` hook.                                                                                                                                                                                                                                                                                |
| `PUT /users/:id`                          | An `updateUserProfile(userId, data)` Server Action.                                                                                                                                                                                                                                                                         |
| `DELETE /users/:id`                       | A `deactivateUser(userId)` Server Action.                                                                                                                                                                                                                                                                                   |
| `GET /companies/:companyId/members`       | A `useCollection()` hook on the `memberships` collection, filtered by `companyId`.                                                                                                                                                                                                                                          |
| `POST /companies/:companyId/members`      | An `inviteMember(companyId, email, role)` Server Action that creates a new document in the `memberships` collection.                                                                                                                                                                                                          |
| `PUT /companies/:companyId/members/:userId` | An `updateMemberRole(membershipId, newRole)` Server Action that updates a document in the `memberships` collection.                                                                                                                                                                                                         |
| `DELETE /companies/:companyId/members/:userId` | A `removeMember(membershipId)` Server Action that deletes a document from the `memberships` collection.                                                                                                                                                                                                                   |
| `POST /tasks`                             | A `createTask(data)` Server Action.                                                                                                                                                                                                                                                                                         |
| `GET /tasks`                              | A `useCollection()` hook on the `tasks` collection, with filters applied via Firestore queries. Security rules enforce visibility.                                                                                                                                                                                            |
| `GET /tasks/:taskId`                      | A `useDocument()` hook to fetch a single document from the `tasks` collection.                                                                                                                                                                                                                                              |
| `PUT /tasks/:taskId`                      | An `updateTask(taskId, data)` Server Action.                                                                                                                                                                                                                                                                                |
| `DELETE /tasks/:taskId`                   | A `deleteTask(taskId)` Server Action (likely a soft delete by updating the `status` field).                                                                                                                                                                                                                                 |
| `POST /tasks/:taskId/resources`           | A `createTaskResource(taskId, data)` Server Action that adds data to a `/tasks/{taskId}/resources` sub-collection.                                                                                                                                                                                                         |
| `GET /tasks/:taskId/resources`            | A `useCollection()` hook on the `/tasks/{taskId}/resources` sub-collection.                                                                                                                                                                                                                                                 |
| `DELETE /tasks/:taskId/resources/:resourceId`| A `deleteTaskResource(resourceId)` Server Action that deletes a resource from the sub-collection.                                                                                                                                                                                                                         |
| `POST /tasks/:taskId/submissions`         | A `createSubmission(taskId, data)` Server Action. Checks deadlines and creates a new document in the `submissions` collection.                                                                                                                                                                                               |
| `GET /users/me/submissions`               | A `useCollection()` hook on the `submissions` collection, filtered by `userId`.                                                                                                                                                                                                                                             |
| `GET /submissions/:submissionId`          | A `useDocument()` hook to fetch a single submission. Security rules restrict access to the owner and task's company.                                                                                                                                                                                                        |
| `GET /tasks/:taskId/submissions`          | A `useCollection()` hook on the `submissions` collection, filtered by `taskId`. Security rules restrict access.                                                                                                                                                                                                             |
| `PUT /submissions/:submissionId`          | An `updateSubmission(submissionId, data)` Server Action. Checks for ownership and permissions before updating.                                                                                                                                                                                                               |
| `DELETE /submissions/:submissionId`       | A `deleteSubmission(submissionId)` Server Action. Checks for ownership and permissions before deleting.                                                                                                                                                                                                                     |
| `POST /submissions/:id/evaluate`          | An `evaluateSubmission(submissionId, data)` Server Action. Creates a document in the `evaluations` collection and triggers a background job to update the candidate's aggregated `ranking` and `averageScore` on their `User` profile.                                                                                       |
| `GET /submissions/:id/score`              | A `useDocument()` hook on the `/evaluations/{evaluationId}` document, linked from the submission. Security rules restrict access.                                                                                                                                                                                          |
| `GET /leaderboard/global`                 | A `useCollection()` hook on the `users` collection, ordered by `candidatePerformance.ranking` or `candidatePerformance.averageScore` and limited. This is highly performant due to the denormalized data on the `User` object.                                                                                               |
| `POST /ranking/recalculate`               | An `adminRecalculateAllRankings()` Server Action, restricted to admins. This triggers a batch process (e.g., via Cloud Tasks) that iterates through all users and re-calculates their performance metrics. This is for maintenance and is not part of the real-time flow.                                                           |


This structure provides a clean, secure, and highly performant architecture that is well-suited for a modern, real-time SaaS platform.

### 3.2. Data Flow Example: Candidate Submission

1.  **Submission:** A candidate submits a task via the frontend. The form calls a **Server Action** named `createSubmission`.
2.  **Server Action Logic:**
    -   The `createSubmission` action validates the user's identity and input.
    -   It uploads the submission file to **Cloud Storage for Firebase**.
    -   It creates a new document in the `submissions` collection in **Firestore** with the file path, `taskId`, and `userId`.
3.  **Real-time Update:** The company user's dashboard, which is listening to changes in the `submissions` collection via the `useCollection` hook, automatically and instantly receives the new submission without any need for polling.
4.  **Background Job:** The creation of the submission document triggers a **Cloud Function** that adds a job to a queue (e.g., Cloud Tasks) for asynchronous AI evaluation.
5.  **Evaluation & Ranking:** Once the AI or a human evaluator scores the submission, another Server Action updates the `evaluations` collection. This, in turn, can trigger another background job to recalculate the candidate's position on the leaderboard.

### 3.3. Evolution to Microservices

This architecture begins as a well-structured monolith, which is ideal for rapid development. The logical separation is clear:
-   **Auth Service:** Logic handled by Firebase Auth and related server actions.
-   **User/Company Service:** Logic for profile management within Server Actions.
-   **Task/Submission/Evaluation Service:** Core business logic encapsulated in their respective Server Actions.

As the platform scales, these logical services can be extracted into independent microservices (e.g., separate Cloud Functions or Cloud Run services) without a complete rewrite. The Next.js frontend would then call these microservices via an API Gateway instead of calling Server Actions directly. The database schema and core concepts remain the same.

## 4. Database Design (Firestore)

-   **Database:** Firestore (NoSQL, document-based).
-   **Reasoning:** Its serverless nature, real-time capabilities, and powerful security model are perfect for a highly interactive platform like SkillMatch Pro. It scales automatically to handle millions of users. While PostgreSQL is excellent for relational data, Firestore's flexible schema is better suited for the diverse and evolving data structures of user profiles, tasks, and submissions. Redis is not required initially, as Firestore provides its own caching, but could be added later for specific hot-path data.

### 4.1. Core Collections

-   `/users/{userId}`: Stores all user profiles (candidates, company members, admins).
-   `/companies/{companyId}`: Stores company profiles and tenant-specific information.
-   `/memberships/{membershipId}`: Stores the many-to-many relationship between users and companies, defining roles within a company.
-   `/tasks/{taskId}`: Contains all tasks created by companies.
-   `/submissions/{submissionId}`: All candidate submissions for tasks.
-   `/evaluations/{evaluationId}`: Stores evaluation feedback and scores for submissions.

### 4.2. Entity Relationships

Relationships are managed via stored IDs in documents, representing foreign keys.

`
  Company (1) --< (M) User (via Membership) // A company has multiple users (employees)
  Company (1) --< (M) Task                  // A company creates multiple tasks
  User (1)    --< (M) Submission              // A candidate makes multiple submissions
  Task (1)    --< (M) Submission              // A task receives multiple submissions
  Submission (1) -- (1) Evaluation             // Each submission gets one evaluation
`

### 4.3. Data Integrity

Data integrity and constraints are enforced primarily through **Firestore Security Rules**. This is a critical component of the architecture.
-   **Example:** A `Task` can only be created by a user whose `auth.uid` is a member of the task's `companyId` with an 'owner' or 'admin' role.
-   **Example:** A `Submission` can only be read by the candidate who submitted it or by a user belonging to the company that owns the task.

## 5. Role-Based Access Control (RBAC)

-   **Primary Enforcement: Firestore Security Rules**
    -   This is the most critical layer of security, securing data at its source. Rules are written in a `firestore.rules` file and deployed to Firebase.
    -   **Example Rule:** `allow read: if request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/memberships/$(request.auth.uid)_$(resource.data.companyId)).data.role in ['owner', 'admin'];`
-   **Client-Side UI Control:** The frontend uses the authenticated user's role (from the `AuthContext`) to conditionally render UI elements (e.g., an "Admin Panel" link is only shown to admins).
-   **Server-Side Logic (Server Actions):** Every Server Action re-validates the user's role and permissions before executing an operation, providing a second layer of defense.

## 6. Lifecycle States

The system uses status fields to manage the lifecycle of key entities.

-   **Task Lifecycle:** `Draft` → `Published` → `Closed` → `Archived`. Transitions are handled by Server Actions or automated background jobs (e.g., closing a task after its deadline).
-   **Submission Lifecycle:** `Assigned` → `In-Progress` → `Pending` (awaiting review) → `In-Review` → `Evaluated` → (`Shortlisted` / `Rejected`). These states are updated based on user actions and drive the application workflow.

## 7. Scalability & DevOps

-   **Scalability:** The architecture is serverless by design. Vercel/Firebase App Hosting, Cloud Functions, and Firestore scale automatically with demand. Horizontal scaling is the default behavior. The use of background job queues ensures that long-running processes like AI evaluation do not block the main application thread.
-   **DevOps:**
    -   **Containerization:** While the core is serverless, any future standalone services (e.g., a dedicated analytics processor) would be containerized using Docker and orchestrated with Kubernetes or managed services like Cloud Run.
    -   **CI/CD:** A CI/CD pipeline (e.g., GitHub Actions) is used to automate testing, linting, and deployment to staging and production environments on Vercel/Firebase.
