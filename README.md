# 🔐 VaultX Password Manager

> **Zero-Knowledge Vault** — Full-stack password manager with client-side AES-256-GCM encryption and JWT authentication. Server stores only encrypted data, demonstrating zero-trust security architecture in practice.

---

## ✨ Key Features

| Feature | Details |
| --- | --- |
| 🔒 **Client-Side Encryption** | AES-256-GCM encryption in the browser; the backend stores encrypted vault payloads rather than plaintext credentials |
| 🎫 **JWT Authentication** | JWT-based authentication stored in HTTP-only cookies with credentialed CORS support |
| 🛡️ **Request Validation** | Zod schemas validate authentication payloads, vault payloads, and pagination query parameters at the API boundary |
| 🔑 **Password Management** | Add, edit, delete, copy, and generate strong passwords |
| 📄 **Cursor-Based Pagination** | Vault retrieval uses cursor-based pagination with bounded page sizes and a `nextCursor` response |
| 🚦 **Authentication Rate Limiting** | Signup/login endpoints are rate-limited to reduce repeated authentication attempts |
| ⚡ **Centralized Error Handling** | Unexpected application errors are routed through a shared Express error-handling middleware |
| 🧪 **API Test Coverage** | Authentication, vault CRUD, pagination, and validation paths are exercised with automated API tests |
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

### Security & Cryptography
```
Web Crypto API | AES-GCM | bcrypt | Zod | express-rate-limit | Supertest | MongoDB Memory Server
```

---


## 📋 Project Highlights

### 🎯 What I Learned
- **Full-stack development** from database to UI
- **End-to-end encryption** implementation with Web Crypto API
- **Secure authentication** patterns using JWT & HTTP-only cookies
- **API design** best practices with proper error handling
- **State management** in React for complex data flows
- **Security fundamentals** - encryption, secure cookie handling, CORS

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
---

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

---

## 📁 Project Structure Overview


---
```md

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




## 🔐 Security Features Explained

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



## 📚 Learning Resources Used

- Web Crypto API Documentation
- Express.js Security Best Practices
- MongoDB & Mongoose Patterns
- React Hooks & State Management
- JWT Authentication Architecture

---


<div align="center">

**[⬆ back to top](#-vaultx-password-manager)**

</div>
