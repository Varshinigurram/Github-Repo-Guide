# GitHub Repo Guide — Backend Step 6: Technology & Dependency Analysis

This is the backend for **GitHub Repo Guide**, built with **Node.js**, **Express.js**, **TypeScript**, **Zod**, and **Octokit**.

It validates GitHub repository URLs, retrieves repository metadata, recursively analyzes file and folder structures, sequentially extracts text contents from up to 10 important configuration, manifest, and entry-point files, and performs deterministic technology and dependency detection.

> [!NOTE]
> AI/LLM integration, architecture explanation, health score generation, database storage, and frontend UI have **NOT** been implemented yet. Step 6 technology analysis runs 100% deterministically on existing evidence without external AI calls.

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

Validates a public GitHub URL and retrieves real repository metadata, file tree structure, decoded text content for up to 10 important files sequentially, and analyzes technology/dependency evidence.

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
      "topics": ["declarative", "frontend", "javascript", "react", "ui"],
      "license": "MIT",
      "createdAt": "2013-05-24T16:15:54Z",
      "updatedAt": "2026-09-05T20:00:00Z",
      "pushedAt": "2026-09-05T21:00:00Z",
      "archived": false,
      "disabled": false,
      "size": 412345
    },
    "structure": {
      "totalFiles": 7213,
      "returnedFiles": 500,
      "totalDirectories": 641,
      "returnedDirectories": 300,
      "truncated": false,
      "responseLimited": true,
      "files": [...],
      "directories": [...],
      "importantFiles": ["README.md", "package.json", "..."]
    },
    "fileContents": {
      "files": [
        {
          "path": "README.md",
          "size": 1420,
          "content": "# React\nReact is a JavaScript library...",
          "truncated": false,
          "fetched": true
        },
        {
          "path": "package.json",
          "size": 750,
          "content": "{\n  \"name\": \"react\",\n  \"private\": true\n}",
          "truncated": false,
          "fetched": true
        }
      ],
      "fetchedFiles": 8,
      "skippedFiles": 2,
      "truncatedFiles": 0,
      "totalContentBytes": 18450,
      "contentLimited": false
    },
    "technologies": {
      "languages": [
        { "name": "JavaScript", "category": "language", "confidence": "high", "evidence": ["github_metadata", "repository_files"] },
        { "name": "TypeScript", "category": "language", "confidence": "high", "evidence": ["repository_files"] }
      ],
      "frameworks": [
        { "name": "React", "category": "frontend-framework", "confidence": "high", "evidence": ["package.json"] }
      ],
      "runtimes": [
        { "name": "Node.js", "category": "runtime", "confidence": "high", "evidence": ["package.json"] }
      ],
      "packageManagers": [
        { "name": "Yarn", "category": "package-manager", "confidence": "high", "evidence": ["yarn.lock"] }
      ],
      "databases": [],
      "buildTools": [
        { "name": "Rollup", "category": "build-tool", "confidence": "high", "evidence": ["package.json"] }
      ],
      "testingTools": [
        { "name": "Jest", "category": "testing-tool", "confidence": "high", "evidence": ["package.json"] }
      ],
      "styling": [],
      "containerization": [],
      "dependencies": [
        { "name": "loose-envify", "version": "^1.1.0", "source": "package.json", "category": "production" }
      ]
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

---

## 🛡️ Rate Limit & Content Bounding Architecture

- **Sequential Request Queue**: File contents are fetched **strictly sequentially** (one active API request at a time) to prevent GitHub secondary rate limits and concurrency spikes.
- **Maximum Files Fetched**: Up to 10 files (`MAX_FILES_TO_FETCH = 10`).
- **Per-File Content Limit**: 50 KB hard byte limit (`MAX_FILE_CONTENT_BYTES = 50 * 1024`).
- **Total Content Budget**: 500 KB hard byte limit (`MAX_TOTAL_CONTENT_BYTES = 500 * 1024`).
- **Server Stability**: GitHub rate limit errors (403/429) return controlled HTTP 429 JSON responses without terminating or crashing the Node/Express server.

---

## 🧪 Postman Test Suite

| Test Case | Method | URL | Body (JSON) | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. React Repo** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://github.com/facebook/react"}` | `200 OK` |
| **2. VS Code Repo** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://github.com/microsoft/vscode"}` | `200 OK` |
| **3. Nonexistent Repo** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://github.com/nonexistent-owner-xyz999/nonexistent-repo-xyz999"}` | `404 Not Found` |
| **4. Invalid URL** | `POST` | `http://localhost:5000/api/analyze` | `{"url": "https://google.com"}` | `400 Bad Request` |
| **5. Health Endpoint** | `GET` | `http://localhost:5000/api/health` | *(None)* | `200 OK` |
