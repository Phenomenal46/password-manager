# 🔐 VaultX Password Manager

> **A full-stack password manager built with React, Node.js, Express, and MongoDB, designed around clear client/server boundaries, secure authentication, validated APIs, scalable vault retrieval, automated testing, and maintainable backend architecture.**

---

## ✨ Key Features

| Feature | Details |
| --- | --- |
| 🔒 **Client-Side Encryption** | AES-256-GCM encryption is performed in the browser; the backend stores encrypted vault payloads rather than plaintext credentials |
| 🎫 **JWT Authentication** | JWT-based authentication stored in HTTP-only cookies with credentialed CORS support |
| 🛡️ **Request Validation** | Zod schemas validate authentication payloads, vault payloads, and pagination query parameters at the API boundary |
| 🔑 **Password Management** | Add, edit, delete, copy, and generate strong passwords |
| 📄 **Cursor-Based Pagination** | Vault retrieval uses cursor-based pagination with bounded page sizes and a `nextCursor` response |
| 🚦 **Authentication Rate Limiting** | Signup/login endpoints are rate-limited to reduce repeated authentication attempts |
| ⚡ **Centralized Error Handling** | Shared Express error middleware keeps unexpected failures consistent and avoids exposing internal server details |
| 🧪 **Automated API Testing** | Authentication, vault CRUD, pagination, validation, and invalid-cursor flows are covered with automated tests |
| 🔄 **Continuous Integration** | GitHub Actions runs the backend test suite on pushes to `main` and pull requests |
| 📱 **Responsive Design** | Works seamlessly on desktop and mobile devices |
| 🔐 **Zero-Knowledge Architecture** | Encryption/decryption responsibilities remain on the client while the server manages authenticated storage and access control |

---

## 🛠️ Tech Stack

### Frontend
```
React 18 + Vite ⚡ | Tailwind CSS 🎨 | Fetch API 🌐
```

### Backend
```
Node.js + Express 5 🚀 | MongoDB + Mongoose 🗄️ | JWT + HTTP-only Cookies 🔐
```

### Platform, Security & Testing
```
Web Crypto API | AES-GCM | bcrypt | Zod | express-rate-limit | Supertest | MongoDB Memory Server
```

---


## 📋 Project Highlights

### 🎯 Engineering Highlights
- **Full-stack architecture** — separated frontend, API, business logic, persistence, and client-side cryptography concerns
- **API engineering** — designed REST-style endpoints with authentication, validation, pagination, ownership checks, and consistent error handling
- **Scalable data access** — implemented cursor-based pagination with bounded page sizes instead of loading the entire vault at once
- **Maintainable backend structure** — separated Express application setup from database connection and server startup
- **Testing & reliability** — added API-level tests with Supertest and an isolated in-memory MongoDB environment
- **Production-oriented workflow** — added GitHub Actions CI so backend tests run automatically on pushes and pull requests

### 🏗️ Architecture Decisions

- ✅ **Client-side encryption** keeps plaintext vault contents outside the server's storage layer.
- ✅ **JWTs in HTTP-only cookies** keep authentication tokens inaccessible to client-side JavaScript.
- ✅ **Validation at the API boundary** uses Zod before controller logic executes, reducing invalid-input handling inside business logic.
- ✅ **Cursor-based pagination** is used for vault reads instead of offset pagination, allowing the API to fetch bounded result sets using a stable `_id` cursor.
- ✅ **Limit + 1 pagination strategy** lets the server determine whether another page exists without requiring a separate count query.
- ✅ **User-scoped database queries** ensure vault mutations are constrained by both the item id and the authenticated `userId`.
- ✅ **Separation of `app.js` and `index.js`** keeps Express application configuration independent from database connection and server startup concerns, making the application easier to test.
- ✅ **Centralized error middleware** provides a single place to normalize unexpected server errors and avoid leaking internal details to clients.
- ✅ **Authentication rate limiting** is applied at the route layer to reduce repeated signup/login attempts.
- ✅ **Automated API tests with an in-memory MongoDB** allow database-backed request flows to be tested without depending on a persistent development database.
- ✅ **REST-style route organization** separates authentication and vault resources into dedicated route/controller modules.
- ✅ **Automated CI validation** ensures backend tests are executed automatically for pushes to `main` and pull requests, reducing the chance of merging regressions.
---


### 🧩 System Design Overview

The application follows a layered full-stack architecture where each layer has a clear responsibility.

```
┌──────────────────────────────┐
│          React Client        │
│  UI · State · API Services   │
│  Client-side Encryption      │
└──────────────┬───────────────┘
               │ HTTPS / Cookies
               ▼
┌──────────────────────────────┐
│       Express API Layer      │
│                              │
│ Routes                       │
│   ↓                          │
│ Auth Middleware              │
│   ↓                          │
│ Validation Middleware        │
│   ↓                          │
│ Controllers                  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      MongoDB / Mongoose      │
│                              │
│ Users                        │
│ Vault Items                  │
└──────────────────────────────┘

```

## 🚀 Quick Start

1. **Install dependencies**
   - Server: `cd server` then `npm install`
   - Client: `cd client` then `npm install`

2. **Create env files**
    - Copy `server/.env.example` to `server/.env` and replace `JWT_SECRET` with a long random secret.
    - Copy `client/.env.example` to `client/.env`.

3. **Run locally**
   - Server: `npm run dev`
   - Client: `npm run dev`
   - Open `http://localhost:5173` in your browser

4. **Run backend tests**

   ```bash
   cd server
   npm test

---

## 📁 Project Structure Overview

```text

├── client/                         # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                   # API service layer
│   │   ├── crypto/                # Client-side AES-GCM utilities
│   │   ├── pages/                 # Landing, Login & Vault pages
│   │   └── App.jsx                # Main application component
│   ├── package.json
│   └── vite.config.js
│
├── server/                         # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/           # Authentication & vault request handlers
│   │   ├── middleware/             # Auth, validation & centralized errors
│   │   ├── models/                # Mongoose models
│   │   ├── routes/                # Auth & vault API routes
│   │   ├── schemas/               # Zod request-validation schemas
│   │   ├── app.js                 # Express application configuration
│   │   └── index.js               # MongoDB connection + server startup
│   └── package.json
│
└── .github/
    └── workflows/                 # CI / automated workflow configuration
```




## 🔐 Security & Data Handling

### End-to-End Encryption
```
User Data → Client-Side AES-256-GCM Encryption → Server Stores Encrypted Only
                                          ↓
                              Only Browser Can Decrypt
```

### Authentication Flow
```
Login → Backend Verifies Credentials → JWT Created → HTTP-Only Cookie Set → Secure!
```

---

## 🧪 Testing & Reliability

The backend includes automated API-level tests using **Node's test runner, Supertest, and MongoDB Memory Server**.

The test suite covers flows around:

- Authentication
- Vault item CRUD operations
- Cursor-based pagination
- Request validation
- Invalid cursor handling
- Database-backed API behavior

Tests use an in-memory MongoDB instance so request flows can be exercised without relying on the developer's local MongoDB database.

The server startup path is also separated from the Express application configuration, allowing the application to be imported independently during testing.


## ⚖️ Engineering Trade-offs

A few design decisions were made deliberately rather than using the simplest possible implementation:

| Decision | Reasoning |
| --- | --- |
| **Cursor pagination instead of offset pagination** | Keeps vault reads bounded and avoids increasingly large offsets as the dataset grows |
| **Client-side vault encryption** | Keeps plaintext credential contents outside the server's persistence layer |
| **Zod middleware** | Keeps input validation separate from controller logic and provides a reusable validation boundary |
| **`app.js` / `index.js` separation** | Makes application configuration independently testable and keeps infrastructure startup concerns isolated |
| **In-memory MongoDB for tests** | Makes API tests reproducible without requiring a persistent local database |
| **Route-level rate limiting** | Protects authentication entry points without coupling rate-limit logic to controller implementation |




<div align="center">

**[⬆ back to top](#-vaultx-password-manager)**

</div>
