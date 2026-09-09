# GitHub Repo Guide — Backend Step 8A: Foundational AI Interpretation Layer (OpenRouter)

This is the backend for **GitHub Repo Guide**, built with **Node.js**, **Express.js**, **TypeScript**, **Zod**, **Octokit**, and **OpenRouter API**.

It validates GitHub repository URLs, retrieves repository metadata, recursively analyzes file and folder structures, sequentially extracts text contents from up to 10 important configuration, manifest, and entry-point files, performs deterministic technology/dependency detection, aggregates structured evidence packages, and generates grounded, bounded AI repository interpretations using OpenRouter's OpenAI-compatible API endpoint (`https://openrouter.ai/api/v1/chat/completions`).

---

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher recommended)
- **GitHub Personal Access Token (PAT)**
- **OpenRouter API Key** (`OPENROUTER_API_KEY`)

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
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openrouter/free
```

> [!NOTE]
> Free model availability and rate limits on OpenRouter may vary depending on provider traffic.

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

Validates a public GitHub URL, retrieves repository metadata, file tree structure, text content for up to 10 important files, detects technologies/dependencies, aggregates structured evidence, and returns a grounded AI interpretation.

**Request:**
- **Method**: `POST`
- **Header**: `Content-Type: application/json`
- **Body Body**:
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
    "repository": { ... },
    "structure": { ... },
    "fileContents": { ... },
    "technologies": { ... },
    "evidence": { ... },
    "analysis": {
      "overview": {
        "summary": "React is a JavaScript library for building user interfaces.",
        "purpose": "Provides a component-based model for rendering UI efficiently.",
        "confidence": "high"
      },
      "howItWorks": {
        "description": "Uses a virtual DOM to compute diffs and apply updates.",
        "steps": ["Component declaration", "State mutation", "Reconciliation"],
        "confidence": "high"
      },
      "technologies": [
        {
          "name": "React",
          "role": "Core UI Rendering Framework",
          "confidence": "high",
          "evidence": ["package.json"]
        }
      ],
      "architecture": {
        "style": "Monorepo Component Framework",
        "components": [
          {
            "name": "React Compiler",
            "role": "Optimization & AST analysis",
            "evidence": ["compiler/package.json"]
          }
        ],
        "confidence": "high"
      },
      "entryPoints": [
        {
          "path": "compiler/package.json",
          "description": "Package manifest entry for React Compiler component",
          "confidence": "high"
        }
      ],
      "setup": {
        "steps": ["Install dependencies", "Run build script"],
        "commands": ["yarn install", "yarn build"],
        "confidence": "high"
      },
      "limitations": [
        "Analysis restricted to 10 inspected file contents in evidence package."
      ]
    },
    "health": {
      "score": 95,
      "grade": "A",
      "summary": "Repository health for react evaluated to 95/100 (Grade A).",
      "categories": [
        {
          "name": "Documentation",
          "score": 15,
          "maxScore": 15,
          "status": "strong",
          "evidence": ["README.md detected", "Substantial README content detected"]
        },
        {
          "name": "Project Structure",
          "score": 15,
          "maxScore": 15,
          "status": "strong",
          "evidence": ["Entry point candidates detected", "Source code directory organization detected"]
        }
      ],
      "strengths": ["Documentation: Evaluated as strong", "Project Structure: Evaluated as strong"],
      "improvements": [],
      "limitations": []
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

- **429 Too Many Requests** (`GITHUB_RATE_LIMITED` / `AI_RATE_LIMITED`):
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_RATE_LIMITED",
      "message": "OpenRouter API rate limit reached. Please try again later."
    }
  }
  ```

- **500 Internal Server Error** (`AI_CONFIG_ERROR`):
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_CONFIG_ERROR",
      "message": "OpenRouter API key is missing. Please set OPENROUTER_API_KEY in your environment configuration."
    }
  }
  ```

- **502 Bad Gateway** (`AI_AUTH_ERROR`, `AI_PROVIDER_ERROR`, `INVALID_AI_RESPONSE`):
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_AUTH_ERROR",
      "message": "OpenRouter authentication failed. Please check your OPENROUTER_API_KEY."
    }
  }
  ```

- **504 Gateway Timeout** (`AI_TIMEOUT`):
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_TIMEOUT",
      "message": "OpenRouter API request timed out after 30 seconds."
    }
  }
  ```

---

## 🛡️ Architecture & Constraints

- **OpenRouter AI Provider**: Uses native `fetch()` to call OpenRouter OpenAI-compatible API (`https://openrouter.ai/api/v1/chat/completions`) with a 30-second `AbortController` timeout.
- **AI Evidence Isolation**: AI operates strictly on the bounded `RepositoryEvidencePackage` from Step 7. No extra GitHub network requests or file browsing.
- **Completeness & Truncation Awareness**: AI respects `evidence.completeness` flags and uses "not observed in available evidence" phrasing instead of claiming absence.
- **Zod Validation & Output Bounds**: AI output is strictly parsed, stripped of code fences, and validated against `repositoryAIAnalysisSchema` with length and array item limits.
- **Prompt Injection Defense**: Repository content is treated as untrusted data and cannot override system instructions or leak API tokens/secrets.
- **Sequential Request Queue**: File contents are fetched **strictly sequentially** (up to 10 files, 50 KB/file max, 500 KB total budget max).


