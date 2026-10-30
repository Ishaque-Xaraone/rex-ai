# REX AI — Reverse Engineering & Debugging Platform

> **Production-minded MVP foundation for high-assurance static code analysis, AST symbol extraction, dependency graph resolution, and deterministic security auditing.**

---

## 1. Project Overview

REX AI is an engineering-grade platform designed for reverse engineering unfamiliar, proprietary, or legacy codebases. It provides compiler-level AST analysis, extracts cross-file dependency call graphs, detects security anti-patterns (such as dynamic `eval()`, command injection risks, and exposed secrets), and produces verified analysis telemetry.

### Core Philosophy
- **AST Grounded**: Relies on compiler ASTs (TypeScript Compiler API) rather than superficial regex-only parsing.
- **Untrusted Code Execution**: Inspects source files purely as passive data; never evaluates, compiles, or runs uploaded code.
- **Defense in Depth**: Protects the platform with ZIP Slip mitigation, directory traversal checks, archive expansion thresholds, and parameterized database queries.
- **Explain, Don't Hallucinate**: AI integrations explain verified static analysis facts rather than inventing hypothetical code structures.

---

## 2. Monorepo Architecture & Folder Responsibilities

```text
REX AI/
│
├── Frontend/             # Next.js App Router, Tailwind CSS, React Flow, TanStack Query
│   ├── public/           # Static web assets
│   ├── src/
│   │   ├── app/          # App router pages (dashboard, projects, analysis, graphs, reports)
│   │   ├── components/   # UI components, layout, code-viewer, dependency-graph
│   │   ├── features/     # Feature-sliced domain modules
│   │   ├── hooks/        # React hooks
│   │   ├── lib/          # Query providers and utilities
│   │   ├── services/     # Typed API client connecting to Backend
│   │   ├── types/        # Frontend-specific view contracts
│   │   └── styles/       # Tailwind globals and theme variables
│   └── tests/            # Vitest unit and component tests
│
├── Backend/              # Node.js + Express REST API with PostgreSQL integration
│   ├── src/
│   │   ├── server.ts     # HTTP server entry point with graceful shutdown
│   │   ├── app.ts        # Express setup, middleware, security headers, routing
│   │   ├── routes/       # API endpoints (/api/health, /api/projects, /api/analysis)
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Storage, project lifecycle, and analysis execution
│   │   ├── middleware/   # Centralized error handler, Zod validator, Helmet/CORS
│   │   ├── database/     # Connection pool (pg), parameterized queries, migration runner
│   │   └── utils/        # Path traversal guard and ZIP Slip validation
│   ├── migrations/       # Version-controlled SQL migrations (up / down)
│   └── tests/            # Vitest API and security regression tests
│
├── Code-Analyzer/        # Standalone Compiler Analysis Package
│   ├── src/
│   │   ├── core/         # RexCodeAnalyzer, AnalysisPipeline, LanguageAdapter interface
│   │   ├── detector/     # File extension language detector (10+ languages)
│   │   ├── adapters/     # TypeScript compiler AST adapter + extensible stubs
│   │   └── utils/        # File walker with quota enforcement and exclusions
│   └── tests/            # AST extraction tests and security rule verifications
│
├── AI-Service/           # Python FastAPI Service
│   ├── app/
│   │   ├── main.py       # FastAPI application entry point
│   │   ├── api/          # Endpoints: /explain, /verify-claim, /summarize
│   │   ├── schemas/      # Pydantic models matching shared contracts
│   │   ├── providers/    # Provider abstraction (OpenAI, Anthropic, Gemini, Mock)
│   │   └── services/     # Claim verification against AST facts and evidence
│   └── tests/            # Pytest test suite
│
├── Shared/               # Shared TypeScript Contracts & Schemas (@rex/shared)
│   └── src/
│       ├── constants/    # Analysis status, severity levels, security quotas
│       ├── types/        # ProjectMetadata, CodeSymbol, DependencyEdge, Finding
│       └── schemas/      # Zod validation schemas
│
├── Documentation/        # Architecture, API endpoints, schema, and examples
├── scripts/              # Setup, start, and database migration helper scripts
├── package.json          # Root npm workspace definition
├── tsconfig.base.json    # Monorepo TypeScript base configuration
├── docker-compose.yml    # PostgreSQL and multi-service container definitions
├── Dockerfile            # Multi-stage production container build
└── .env.example          # Environment variables template
```

---

## 3. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (Tested on Node v22)
- **npm**: `v10.x`
- **Python**: `3.10+` (for `AI-Service`)
- **PostgreSQL**: `16+` (or use Docker Compose)
- **Docker & Docker Compose**: (Optional, for containerized database and services)

---

## 4. Installation Instructions

### 1. Clone & Enter Workspace
```bash
cd "REX AI"
```

### 2. Install Monorepo NPM Dependencies
Run from the root directory to link npm workspaces (`Shared`, `Code-Analyzer`, `Backend`, `Frontend`):
```bash
npm install
```

### 3. Setup Python AI-Service (Optional for AI features)
```bash
cd AI-Service
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
pip install -r requirements.txt

# On macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt

cd ..
```

---

## 5. Environment Setup

Create `.env` in the root directory by copying the template:
```bash
cp .env.example .env
```

Ensure the database settings in `.env` match your PostgreSQL credentials:
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=rex_ai
```

---

## 6. Database Setup & Migrations

### Start PostgreSQL via Docker (Recommended)
```bash
docker compose up -d postgres
```

### Execute Schema Migrations
Run forward migrations:
```bash
npm run db:migrate
```

To revert the latest migration:
```bash
npm run db:migrate:down
```

*Note: If PostgreSQL is not active during local development, Backend runs in a safe in-memory fallback mode so endpoints remain testable. System health endpoint `/api/health` reports status truthfully.*

---

## 7. Development Commands

Run packages individually or together:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Backend with live reloader on port 4000 |
| `npm run dev:frontend` | Starts Next.js dev server on `http://localhost:3000` |
| `npm run build` | Builds `@rex/shared`, `@rex/code-analyzer`, `Backend`, and `Frontend` |
| `npm run typecheck` | Strict TypeScript validation across all workspaces without emitting |
| `npm run test` | Executes Vitest test suites across all packages |
| `npm run clean` | Removes build directories (`dist/`, `.next/`) |

---

## 8. Current MVP Scope

### Implemented & Working:
- ✅ **Root npm workspace** connecting `Shared`, `Code-Analyzer`, `Backend`, and `Frontend`.
- ✅ **Shared Contracts**: Fully typed models and Zod schemas for jobs, symbols, dependencies, and findings.
- ✅ **Compiler AST Analysis Engine**: Official TypeScript Compiler API AST traversal, symbol extraction, import resolution, and security rule evaluation (`SEC-001` eval, `SEC-002` exec, `SEC-003` secrets, `SEC-004` innerHTML, `QUAL-001` empty catch).
- ✅ **Defensive Ingestion**: ZIP Slip protection, directory traversal checks, file size quotas, and excluded path filters (`node_modules`, `.git`, caches).
- ✅ **Express Backend REST API**: Complete routes for health, project import, file browsing, analysis triggers, dependency graph querying, and audit findings.
- ✅ **Next.js Frontend**: App router pages with Tailwind CSS, React Flow dependency visualization, and source code evidence viewers.
- ✅ **FastAPI AI Service**: Provider abstraction (OpenAI, Anthropic, Gemini, Mock) with grounded claim verification.
- ✅ **PostgreSQL Database Foundation**: Parameterized SQL migrations for projects, project_files, analysis_jobs, symbols, dependencies, findings, and reports.

---

## 9. Known Limitations

- **Language Support**: AST parsing with deep symbol extraction is fully implemented for TypeScript/JavaScript. Python, Java, C#, C++, Go, Rust, PHP, and Ruby adapters currently use regex-pattern based symbol extractors; deep AST grammars for those languages will be added in Phase 2.
- **PDF Report Generation**: `/api/analysis/:id/report` returns comprehensive structured report metadata; binary PDF compilation is scheduled for Phase 2.
- **Tree-sitter**: Tree-sitter native bindings are omitted in this MVP to prevent native build failures on Windows without MSVC C++ toolchains.

---

## 10. Security Notes

1. **Passive Inspection Only**: REX AI does not execute source files.
2. **Path Sanitization**: All file paths are normalized and resolved against designated project roots. Attempts to access parent directories (`..`) are rejected with `SecurityError`.
3. **Archive Quotas**: Archives exceeding `MAX_FILE_COUNT` (1,000) or `MAX_EXPANDED_SIZE_BYTES` (200MB) are rejected to prevent denial-of-service / decompression bombs.
4. **Secret Redaction**: Environment credentials and tokens must never be committed to source repositories.
