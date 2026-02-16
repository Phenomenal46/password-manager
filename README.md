# 🔐 VaultX Password Manager

> **Zero-Knowledge Vault** — Full-stack password manager with client-side AES-256-GCM encryption and JWT authentication. Server stores only encrypted data, demonstrating zero-trust security architecture in practice.

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| 🔒 **Client-Side Encryption** | AES-256-GCM encryption in the browser for maximum security |
| 🎫 **JWT Authentication** | Secure HTTP-only cookies for stateless authentication |
| 🔑 **Password Management** | Add, edit, delete, copy, and generate strong passwords |
| ⚡ **Fast UI Feedback** | Toast notifications for all user actions |
| 📱 **Responsive Design** | Works seamlessly on desktop and mobile devices |
| 🔐 **Zero-Knowledge Architecture** | Server stores only encrypted data; decryption happens client-side |

---

## 🛠️ Tech Stack

### Frontend
```
React 18 + Vite ⚡ | Tailwind CSS 🎨 | Fetch API 🌐
```

### Backend
```
Node.js + Express 🚀 | MongoDB 🗄️ | JWT + Middleware Auth 🔐
```

### Security & Cryptography
```
Web Crypto API | AES-GCM | bcryptjs for password hashing
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
- ✅ Client-side encryption ensures the server never handles plaintext data
- ✅ HTTP-only cookies prevent XSS attacks on auth tokens
- ✅ Separated concerns: API layer, crypto utilities, page components
- ✅ RESTful API design with proper status codes and error messages

---

## 🚀 Quick Start

1. **Install dependencies**
   - Server: `cd server` then `npm install`
   - Client: `cd client` then `npm install`

2. **Create env files**
   - Server: `server/.env`
     - `MONGO_URI=mongodb://127.0.0.1:27017/password_manager`
     - `JWT_SECRET=your_long_secret_key_here_min_32_chars`
     - `PORT=5000`
     - `CLIENT_ORIGIN=http://localhost:5173`
     - `NODE_ENV=development`
   - Client: `client/.env`
     - `VITE_API_URL=http://localhost:5000`

3. **Run locally**
   - Server: `npm run dev`
   - Client: `npm run dev`
   - Open `http://localhost:5173` in your browser

---

## 📁 Project Structure Overview

```
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── api/           # API service layer (authApi, vaultApi)
│   │   ├── crypto/        # AES-GCM encryption utilities
│   │   ├── pages/         # Login & Vault pages
│   │   └── App.jsx        # Main component
│   └── vite.config.js
│
└── server/                 # Node.js + Express Backend
    ├── src/
    │   ├── controllers/    # Route handlers (auth, vault logic)
    │   ├── middleware/     # Auth verification middleware
    │   ├── models/         # MongoDB schemas (User, VaultItem)
    │   ├── routes/         # API endpoints
    │   └── index.js        # Server entry point
    └── package.json
```

---

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
