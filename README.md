# GitHub Repo Guide

**Understand unfamiliar GitHub repositories through structured analysis and evidence-grounded AI.**

GitHub Repo Guide is a full-stack web application that accepts a public GitHub repository URL and returns a structured explanation of its purpose, technologies, project structure, important files, architecture, setup guidance, and repository health. It also provides a repository question-and-answer workflow.

<p align="center">
  <a href="https://github-repo-guide.vercel.app/"><strong>Open the Live Application</strong></a> ·
  <a href="https://github.com/Varshinigurram/Github-Repo-Guide"><strong>View Source Code</strong></a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Live Deployment](#live-deployment)
- [Run Locally](#run-locally)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Analysis Results](#analysis-results)
- [Security and Reliability](#security-and-reliability)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)
- [Development Commands](#development-commands)
- [Project Status](#project-status)
- [Contributing](#contributing)

---

## Overview

Exploring an unfamiliar codebase can require manually reading its folders, dependency manifests, configuration files, entry points, and documentation. GitHub Repo Guide brings these signals together in one workspace and combines deterministic analysis with AI-generated explanations.

The application is designed to explain what the collected repository evidence suggests. Because analysis is bounded, it also communicates limitations instead of assuming that every file or behavior has been inspected.

## Features

- **Repository overview:** Submit a public GitHub URL and receive a structured summary of the repository and its purpose.
- **Project structure explorer:** Explore the available file tree and important files.
- **Technology detection:** Identify technologies and dependencies from available evidence using deterministic rules.
- **Evidence metrics:** View inspected-file information and evidence completeness.
- **Architecture view:** Explore an architecture interpretation based on collected repository evidence.
- **API explorer:** Display API information detected and returned by the analysis workflow.
- **Repository health:** Review the application's configured health score, grade, category results, strengths, improvements, and limitations.
- **Setup guidance:** See suggested setup steps and commands based on available repository evidence.
- **AI interpretation:** Use OpenRouter to generate structured repository explanations from a bounded evidence package.
- **Repository Q&A:** Ask questions about a repository through the `POST /api/ask` endpoint.
- **Error handling:** The frontend API client handles structured backend errors and provides loading, success, and error states.
- **Workspace navigation:** Navigate between the main sections of the analysis result.

## How It Works

1. The user submits a public GitHub repository URL through the frontend.
2. The backend validates the request with Zod.
3. Octokit retrieves repository metadata and the recursive file tree from GitHub.
4. The backend identifies important configuration, manifest, documentation, and entry-point candidates.
5. Selected file contents are fetched sequentially within configured limits.
6. Deterministic rules detect technologies, dependencies, and other repository signals.
7. The collected information is aggregated into a structured evidence package.
8. The AI layer sends the bounded evidence to a configured model through OpenRouter.
9. AI output is parsed and validated against the expected Zod schema.
10. The API returns structured results that the frontend displays in its analysis workspace.

## Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| Frontend | React 19, TypeScript | Component-based user interface |
| Development and build | Vite | Local development and production bundling |
| Styling | Tailwind CSS v4 | UI styling |
| UI primitives | Radix UI Slot, reusable UI components | Composable interface elements |
| Icons | Lucide React | Interface icons |
| Backend runtime | Node.js | Server-side runtime |
| Backend framework | Express.js | REST API and middleware |
| Backend language | TypeScript | Typed backend implementation |
| Validation | Zod | Request and AI output validation |
| GitHub integration | Octokit | Repository metadata, tree, and file access |
| AI integration | OpenRouter API | AI interpretation and repository Q&A |
| HTTP requests | Native `fetch()` | OpenRouter API requests |
| Local configuration | dotenv | Loading local backend environment variables |
| Development runner | tsx | Running backend TypeScript in development |
| Hosting | Vercel | Frontend and backend hosting |

## Architecture

```text
┌────────────────────────────┐
│ React Frontend (Vite/TS)    │
└──────────────┬─────────────┘
               │ HTTP / JSON
               ▼
┌────────────────────────────┐
│ Express Backend (Node/TS)  │
│ Request validation (Zod)   │
└──────────────┬─────────────┘
               ▼
┌────────────────────────────┐
│ GitHub API via Octokit      │
│ Metadata + recursive tree  │
│ + selected file contents   │
└──────────────┬─────────────┘
               ▼
┌────────────────────────────┐
│ Deterministic analysis     │
│ + evidence aggregation     │
└──────────────┬─────────────┘
               │ bounded evidence
               ▼
┌────────────────────────────┐
│ OpenRouter AI layer        │
│ Interpretation / Q&A       │
└──────────────┬─────────────┘
               │ validated response
               ▼
┌────────────────────────────┐
│ Structured API result      │
│ rendered by the frontend   │
└────────────────────────────┘
```

### Frontend

The frontend is a React single-page application. Its centralized API client calls the backend and its components display the repository input, loading and error states, overview, setup guide, project structure, technologies, evidence metrics, health, architecture, API information, and repository Q&A interface.

### Backend

The backend is an Express application written in TypeScript. Its responsibilities include request validation, GitHub API integration, recursive file-tree analysis, bounded file extraction, deterministic technology detection, evidence aggregation, AI interpretation, repository Q&A, health assessment, and structured error handling.

`backend/src/app.ts` exports the Express application. `backend/src/server.ts` starts the local development server.

### Evidence-first AI

The AI layer operates on the collected `RepositoryEvidencePackage`; it does not independently browse the repository or make extra GitHub requests during interpretation. Generated output is validated against the configured Zod schema and output limits. Schema validation improves structure and consistency but does not guarantee factual correctness.

## Repository Structure

The repository is organized as a frontend/backend monorepo:

```text
Github-Repo-Guide/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── repository/
│   │   │   └── workspace/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── ...
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── vercel.json
└── README.md
```

This is a high-level map of the main directories; files may change as development continues.

## Live Deployment

- **Frontend:** [github-repo-guide.vercel.app](https://github-repo-guide.vercel.app/)
- **Source repository:** [Varshinigurram/Github-Repo-Guide](https://github.com/Varshinigurram/Github-Repo-Guide)
- **Backend health endpoint:** [github-repo-guide-backend.vercel.app/api/health](https://github-repo-guide-backend.vercel.app/api/health)

The backend health endpoint has returned:

```json
{
  "status": "ok",
  "service": "github-repo-guide"
}
```

This confirms that the health endpoint responded successfully when tested. The full production workflow should also be tested by analyzing a repository and using repository Q&A through the deployed frontend.

## Run Locally

### Prerequisites

- Node.js 18 or newer recommended.
- npm 9 or newer recommended.
- Git.
- A GitHub Personal Access Token for authenticated GitHub API requests.
- An OpenRouter API key for AI-powered features.

### 1. Clone the repository

```bash
git clone https://github.com/Varshinigurram/Github-Repo-Guide.git
cd Github-Repo-Guide
```

### 2. Install and start the backend

```bash
cd backend
npm install
```

Create `backend/.env` by copying the template.

**Windows Command Prompt**
```cmd
copy .env.example .env
```

**Windows PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS/Linux**
```bash
cp .env.example .env
```

Configure the environment variables described below, then start the backend:

```bash
npm run dev
```

The documented local example uses port `5000`. Test the health endpoint at `http://localhost:5000/api/health`.

### 3. Install and start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` with:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Keep both frontend and backend development servers running while testing the application.

## Environment Variables

### Backend: `backend/.env`

| Variable | Required | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | Required for authenticated GitHub API access | GitHub Personal Access Token |
| `OPENROUTER_API_KEY` | Required for AI features | OpenRouter API authentication |
| `OPENROUTER_MODEL` | Optional if a default is configured | Selects the AI model |
| `PORT` | Local configuration | Port used by the local server |
| `CORS_ORIGIN` | Optional | Permitted browser origin; current Express setup defaults to `*` if unset |

Example:

```dotenv
PORT=5000
GITHUB_TOKEN=your_github_token
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=your_supported_openrouter_model
CORS_ORIGIN=http://localhost:5173
```

Use a model identifier supported by OpenRouter and your current configuration. Free-model availability and provider limits can change.

### Frontend: `frontend/.env.local`

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

For the deployed frontend, the configured base URL should be:

```dotenv
VITE_API_BASE_URL=https://github-repo-guide-backend.vercel.app
```

The frontend API client uses `http://localhost:5000` as its development fallback. In production it falls back to relative URLs if no base URL is set, so set `VITE_API_BASE_URL` to the backend's production URL when frontend and backend are deployed separately.

**Security:** Vite variables prefixed with `VITE_` are exposed to browser code. Only put public configuration, such as the backend URL, in them. Never put `GITHUB_TOKEN` or `OPENROUTER_API_KEY` in frontend environment variables. Do not commit `.env`, `.env.local`, or other files containing secrets.

## API Reference

The backend currently exposes three routes.

### `GET /api/health`

Checks whether the backend health endpoint is responding.

```bash
curl http://localhost:5000/api/health
```

**Success — `200 OK`:**

```json
{
  "status": "ok",
  "service": "github-repo-guide"
}
```

A successful health check confirms endpoint availability, but does not independently verify GitHub or OpenRouter integration.

### `POST /api/analyze`

Analyzes a public GitHub repository and returns structured repository information, evidence, AI interpretation, and a health assessment.

**Headers**
```http
Content-Type: application/json
Accept: application/json
```

**Request body**
```json
{
  "url": "https://github.com/facebook/react"
}
```

**Success response:** `200 OK`. The response contains a `success` flag and a `data` object. Depending on the repository and collected evidence, `data` includes:

- `repository` — repository metadata.
- `structure` — file and directory structure and important-file information.
- `fileContents` — contents of selected inspected files.
- `technologies` — detected technologies and dependencies.
- `evidence` — structured evidence and completeness information.
- `analysis` — overview, how-it-works explanation, technologies, architecture interpretation, entry points, setup guidance, and limitations.
- `architecture` — architecture data used by the frontend.
- `api` — API information used by the API explorer.
- `health` — score, grade, category results, strengths, improvements, and limitations.

Exact fields depend on the repository and the implementation's response schema. The backend's TypeScript types and schemas are the authoritative response contract.

### `POST /api/ask`

Answers a question about a public GitHub repository using the repository evidence workflow.

**Request body**
```json
{
  "url": "https://github.com/facebook/react",
  "question": "What are the main parts of this repository and how do they work together?"
}
```

**Headers**
```http
Content-Type: application/json
Accept: application/json
```

The frontend sends both `url` and `question`. Refer to the backend's Q&A response types and validation schema for the exact response fields.

### Error responses

Errors use a structure similar to:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "A human-readable explanation of the error."
  }
}
```

| HTTP status | Error code(s) | Meaning |
|---|---|---|
| `400` | `INVALID_GITHUB_URL` | Invalid or unsupported repository URL |
| `400` | `INVALID_REQUEST_BODY` | Request body does not match the expected format |
| `400` | `MISSING_REQUEST_BODY` | Required body is missing |
| `404` | `REPOSITORY_NOT_FOUND` | Repository could not be found or accessed |
| `429` | `GITHUB_RATE_LIMITED` | GitHub rate limit reached |
| `429` | `AI_RATE_LIMITED` | OpenRouter/provider rate limit reached |
| `500` | `AI_CONFIG_ERROR` | Required AI configuration is missing |
| `502` | `AI_AUTH_ERROR` | OpenRouter authentication failed |
| `502` | `AI_PROVIDER_ERROR` | AI provider request failed |
| `502` | `INVALID_AI_RESPONSE` | AI response could not be used as valid output |
| `504` | `AI_TIMEOUT` | AI request exceeded the configured 30-second timeout |

The exact error returned depends on the failure path. Investigate the error code and server logs without exposing secret values.

## Analysis Results

### AI interpretation

The analysis can include:

- **Overview:** Summary and purpose of the repository.
- **How it works:** Description and important workflow steps.
- **Technologies:** Identified technologies, roles, confidence, and supporting file paths.
- **Architecture:** Interpreted architectural style and relevant components.
- **Entry points:** Important paths and descriptions.
- **Setup guidance:** Suggested steps and commands based on available evidence.
- **Limitations:** Evidence gaps that affect the analysis.

### Repository health

The health assessment can include an overall score and grade, category-level scores, supporting evidence, strengths, improvement suggestions, and limitations.

The score reflects the application's configured checks. It is not a formal security audit, a guarantee of code quality, or a substitute for reviewing the repository.

## Security and Reliability

- **Keep credentials server-side.** GitHub and OpenRouter credentials belong in backend environment variables.
- **Validate requests.** Zod schemas help reject malformed input.
- **Treat repository files as untrusted.** External files may contain misleading text or prompt-injection attempts.
- **Bound file inspection.** The documented workflow fetches selected files sequentially, with a maximum of 10 files, up to 50 KB per file, and a 500 KB aggregate content budget.
- **Respect incomplete evidence.** An uninspected file should not automatically be treated as proof that a feature does not exist.
- **Bound AI requests.** The OpenRouter request uses an `AbortController` timeout of 30 seconds.
- **Validate AI output.** Generated content is parsed and checked against the configured Zod schema and output limits.
- **Handle provider failures.** GitHub and OpenRouter authentication, availability, and rate limits may affect requests.
- **Configure CORS deliberately.** In production, set the permitted frontend origin to the actual deployment origin when supported by the current configuration.

These measures reduce risk; they do not guarantee immunity from all security issues or make every AI-generated statement correct.

## Limitations

- **Bounded file inspection:** Up to 10 selected file contents are inspected per analysis, subject to per-file and total size limits.
- **Potentially incomplete trees:** Large GitHub repositories may have truncated tree responses, which can limit analysis.
- **Evidence-dependent explanations:** AI conclusions are limited by the metadata and file contents supplied to the model.
- **External service dependencies:** GitHub and OpenRouter availability, authentication, and rate limits can affect requests.
- **Generated setup guidance:** Suggested commands should be verified against the repository's own documentation.
- **Limited health assessment scope:** The score is based on the application's configured criteria, not a comprehensive security or code-quality evaluation.
- **AI correctness:** Schema validation checks output structure, not the factual correctness of every conclusion.

## Troubleshooting

### The backend root URL displays `Cannot GET /`

The backend does not need to serve a page at `/`. Test the health endpoint instead:

`https://github-repo-guide-backend.vercel.app/api/health`

### The frontend cannot reach the backend

1. Confirm `VITE_API_BASE_URL` points to the backend URL without an extra `/api` suffix.
2. Confirm the backend health endpoint responds.
3. Redeploy the frontend after changing the variable; Vite variables are included in the frontend build.
4. Inspect the browser Network tab for the actual request URL and response.
5. Verify the backend CORS configuration permits the deployed frontend origin.

### GitHub API errors

- Verify the repository URL and that the repository is publicly accessible.
- Confirm `GITHUB_TOKEN` is configured in the backend environment.
- Check whether GitHub returned a rate-limit error.
- Never share the token in screenshots, issues, or logs.

### OpenRouter errors

- Confirm `OPENROUTER_API_KEY` is configured in the backend.
- Verify the model identifier is supported and available.
- Check provider availability and rate limits.
- For repeated timeouts, investigate provider latency and request behavior.
- Never share the actual API key while debugging.

### Deployment does not reflect environment changes

The frontend and backend are separate Vercel projects. Update the environment variable in the correct project and redeploy that project for the change to take effect.

## Development Commands

### Backend

Run from `backend/`:

| Command | Purpose |
|---|---|
| `npm install` | Install backend dependencies |
| `npm run dev` | Start the TypeScript development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start the compiled local server |

### Frontend

Run from `frontend/`:

| Command | Purpose |
|---|---|
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

Run relevant build commands and test the affected workflow before submitting changes.

## Project Status

GitHub Repo Guide is an actively developed full-stack project. The repository contains:

- A React/TypeScript frontend.
- An Express/TypeScript backend.
- GitHub repository metadata and recursive tree retrieval.
- Bounded selected-file extraction.
- Deterministic technology/dependency detection.
- Structured repository evidence.
- OpenRouter-powered repository interpretation.
- Repository health assessment.
- A repository Q&A endpoint.
- Frontend views for overview, structure, technologies, evidence, health, architecture, API exploration, setup guidance, and Q&A.
- Separate Vercel frontend and backend deployments.

The backend health endpoint has been verified to respond successfully. Repository analysis and Q&A should also be tested end-to-end after deployment changes before claiming that the entire production workflow is verified.

Potential future improvements include broader automated test coverage, improved handling of large repositories, clearer evidence citations, expanded deterministic detection, caching, and more resilient external-service error handling. These are possible improvements, not claims that they are already implemented.

## Contributing

Suggestions and contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the relevant build and lint commands.
5. Test the affected workflow.
6. Open a pull request describing the change and how it was verified.

Do not commit credentials, local environment files, or other secrets.

---

<p align="center">Built to make unfamiliar codebases easier to explore.</p>
