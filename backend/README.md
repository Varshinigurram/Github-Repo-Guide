# GitHub Repo Guide — Backend Foundation

This is the backend foundation for **GitHub Repo Guide**, built with **Node.js**, **Express.js**, and **TypeScript**.

It provides a clean, modular foundation with environment configuration, CORS handling, centralized error management, and a health check API endpoint.

---

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher recommended)

---

## 🚀 Getting Started

### 1. Install Dependencies

In the `backend` directory, run:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` folder by copying `.env.example`:

```bash
cp .env.example .env
```

Or manually create `.env` with:

```env
PORT=5000
```

---

## 🏃 Running the Backend

### Development Mode

Runs the backend with live auto-reloading whenever you change code:

```bash
npm run dev
```

### Production Build

Compiles TypeScript to JavaScript in the `dist/` directory:

```bash
npm run build
```

### Production Start

Runs the compiled JavaScript build:

```bash
npm start
```

---

## 🧪 Testing the Health Endpoint

### Primary Method: Postman

1. Open **Postman**.
2. Select **GET** method from the dropdown.
3. Enter the URL: `http://localhost:5000/api/health`
4. Click **Send**.
5. Expected Response Status: `200 OK`
6. Expected Response Body:
   ```json
   {
     "status": "ok",
     "service": "github-repo-guide"
   }
   ```

### Alternative 1: Browser

Open your browser and navigate to:
[http://localhost:5000/api/health](http://localhost:5000/api/health)

### Alternative 2: cURL / Terminal

```bash
curl http://localhost:5000/api/health
```

---

## 📁 Project Architecture

```
backend/
├── src/
│   ├── controllers/
│   │   └── health.controller.ts  # Handles health check request logic
│   ├── middleware/
│   │   └── error.middleware.ts   # Centralized error & 404 handling
│   ├── routes/
│   │   └── health.route.ts       # Defines /api/health endpoint route
│   ├── app.ts                    # Express app configuration & middleware
│   └── server.ts                 # HTTP server entry point & port listener
├── .env                          # Local environment variables (git-ignored)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore file
├── package.json                  # NPM packages & scripts
├── README.md                     # Documentation
└── tsconfig.json                 # TypeScript compiler configuration
```
