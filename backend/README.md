# GitHub Repo Guide — Backend Foundation & GitHub API Integration

This is the backend for **GitHub Repo Guide**, built with **Node.js**, **Express.js**, **TypeScript**, **Zod**, and **Octokit**.

It fetches real repository metadata from GitHub's REST API, cleans and transforms the data, and returns a structured response to the client.

> [!NOTE]
> Repository file analysis, repository tree inspection, technology detection, README parsing, and AI integration have **NOT** been implemented yet. This step focuses exclusively on GitHub REST API integration and repository metadata retrieval.

---

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher recommended)
- **GitHub Personal Access Token (PAT)**

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

Set your environment variables in `.env`:

```env
PORT=5000
GITHUB_TOKEN=your_github_personal_access_token_here
```

> [!IMPORTANT]
> Never commit your `.env` file or expose your `GITHUB_TOKEN` in git repositories or client-side code. `.env` is included in `.gitignore`.

---

## 🏃 Running the Backend

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Production Start

```bash
npm start
```

---

## 📡 API Reference

### 1. Health Check (`GET /api/health`)

Verifies backend server availability.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "github-repo-guide"
}
```

---

### 2. Repository Analyze (`POST /api/analyze`)

Validates a public GitHub URL and retrieves real repository metadata from the GitHub REST API.

**Request:**
- **Method**: `POST`
- **Header**: `Content-Type: application/json`
- **Body**:
```json
{
  "url": "https://github.com/facebook/react"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "repository": {
      "id": 10270250,
      "name": "react",
      "fullName": "facebook/react",
      "owner": "facebook",
      "description": "The library for web and native user interfaces.",
      "url": "https://github.com/facebook/react",
      "cloneUrl": "https://github.com/facebook/react.git",
      "isPrivate": false,
      "isFork": false,
      "language": "JavaScript",
      "stars": 228000,
      "forks": 46000,
      "watchers": 228000,
      "openIssues": 1200,
      "defaultBranch": "main",
      "topics": ["declarative", "frontend", "javascript", "library", "react", "ui"],
      "license": "MIT",
      "createdAt": "2013-05-24T16:15:54Z",
      "updatedAt": "2026-09-05T20:00:00Z",
      "pushedAt": "2026-09-05T21:00:00Z",
      "archived": false,
      "disabled": false,
      "size": 412345
    }
  }
}
```

**Error Responses:**

- **400 Bad Request** (`INVALID_GITHUB_URL`, `INVALID_REQUEST_BODY`, `MISSING_REQUEST_BODY`):
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_GITHUB_URL",
      "message": "Please provide a valid GitHub repository URL (e.g. https://github.com/facebook/react)."
    }
  }
  ```

- **404 Not Found** (`REPOSITORY_NOT_FOUND`):
  ```json
  {
    "success": false,
    "error": {
      "code": "REPOSITORY_NOT_FOUND",
      "message": "The GitHub repository could not be found."
    }
  }
  ```

- **429 Too Many Requests** (`GITHUB_RATE_LIMITED`):
  ```json
  {
    "success": false,
    "error": {
      "code": "GITHUB_RATE_LIMITED",
      "message": "GitHub API rate limit reached. Please try again later."
    }
  }
  ```

- **500 Internal Server Error** (`GITHUB_CONFIG_ERROR`):
  ```json
  {
    "success": false,
    "error": {
      "code": "GITHUB_CONFIG_ERROR",
      "message": "GitHub API authentication failed or token is invalid."
    }
  }
  ```

---

## 🧪 Postman Test Suite

| Test Case | Method | URL | Body (JSON) | Expected Status | Expected Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. React Repo** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://github.com/facebook/react"}` | `200 OK` | `success: true` |
| **2. VS Code Repo** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://github.com/microsoft/vscode"}` | `200 OK` | `success: true` |
| **3. Nonexistent Repo** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://github.com/nonexistent-owner-xyz/nonexistent-repo-xyz"}` | `404 Not Found` | `REPOSITORY_NOT_FOUND` |
| **4. Invalid URL** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://google.com"}` | `400 Bad Request` | `INVALID_GITHUB_URL` |
| **5. Health Endpoint** | `GET` | `http://localhost:5000/api/health` | *(None)* | `200 OK` | `status: "ok"` |

---

## 📁 Architecture

```
backend/
├── src/
│   ├── controllers/
│   │   ├── analyze.controller.ts # Validates input and delegates to GitHub service
│   │   └── health.controller.ts  # GET /api/health controller
│   ├── middleware/
│   │   └── error.middleware.ts   # Centralized error handler
│   ├── routes/
│   │   ├── analyze.route.ts      # Route for POST /api/analyze
│   │   └── health.route.ts       # Route for GET /api/health
│   ├── services/
│   │   └── github.service.ts     # Communicates with GitHub API via Octokit
│   ├── types/
│   │   └── repository.types.ts   # Repository metadata interfaces
│   ├── utils/
│   │   └── github-url.ts         # GitHub URL validation and parser
│   ├── app.ts                    # Express application configuration
│   └── server.ts                 # HTTP server entry point
├── .env                          # Local environment variables
├── .env.example                  # Environment template
├── package.json
└── tsconfig.json
```
