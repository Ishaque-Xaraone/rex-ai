# REX AI System Architecture Overview

## 1. System Mission & Scope
REX AI is a high-assurance static code analysis, reverse engineering, and debugging platform. It empowers software architects, security researchers, and developers to reverse engineer unfamiliar or complex codebases, visualize dependency call hierarchies, and identify security vulnerabilities deterministically.

## 2. High-Level Modular Topology

```
                       ┌────────────────────────────┐
                       │   Frontend (Next.js 14)    │
                       │ React Flow, TanStack Query │
                       └─────────────┬──────────────┘
                                     │ REST / HTTP
                                     ▼
                       ┌────────────────────────────┐
                       │   Backend (Express + TS)   │
                       │  Zod Validation & Storage  │
                       └──────┬───────────────┬─────┘
                              │               │
                 Internal API │               │ SQL (pg driver)
                              ▼               ▼
         ┌─────────────────────────┐     ┌────────────────────────┐
         │ @rex/code-analyzer      │     │ PostgreSQL 16          │
         │ Compiler AST Pipeline   │     │ Normalized Tables      │
         └─────────────────────────┘     └────────────────────────┘
                              │
                 HTTP REST    ▼
         ┌─────────────────────────┐
         │ AI-Service (FastAPI)    │
         │ Grounded Verification   │
         └─────────────────────────┘
```

## 3. Package Responsibilities

### `@rex/shared`
Provides the foundational single source of truth for TypeScript types, Zod schemas, and runtime constants used across Frontend, Backend, and Code-Analyzer.
- Strict enums for analysis status: `queued`, `running`, `completed`, `failed`, and `partial`.
- Severity classification: `critical`, `high`, `medium`, `low`, and `info`.
- Normalized contracts for symbols, dependency edges, line references, and security findings.

### `@rex/code-analyzer`
Compiler-driven analysis engine:
- Language Detector: Extension-based identification for 10+ languages.
- TypeScript AST Adapter: Leverages the official TypeScript Compiler API to construct ASTs, traverse syntax nodes, extract exported and scoped symbols, resolve imports/requires, and evaluate security anti-patterns.
- Language Adapter Interface: Extensible abstraction allowing incremental support for other language ecosystems (Python, Java, C#, C++, Go, Rust, PHP, Ruby).
- Safe File Walker: Enforces path containment, excludes `node_modules` / `.git` / caches, and bounds archive expansion size.

### `@rex/backend`
Node.js + Express REST API:
- Multi-part archive ingestion with ZIP Slip defense and quota enforcement.
- Parameterized database access using `pg`.
- Migration runner for up/down database schema versioning.
- Fallback in-memory cache to ensure developer onboarding works smoothly even before PostgreSQL is provisioned.

### `@rex/frontend`
Next.js App Router application:
- Interactive React Flow dependency graphs (`@xyflow/react`).
- Audit report visualizations and findings tables with source code line references.
- Tailored dark-mode UI with Tailwind CSS.

### `AI-Service`
Python FastAPI service:
- Explains verified findings without hallucination.
- Verifies hypotheses and claims against concrete AST facts.
- Provider abstraction for OpenAI, Anthropic, Gemini, or deterministic local stubs.
