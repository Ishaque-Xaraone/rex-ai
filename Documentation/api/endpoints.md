# REX AI API Specification

Base URL: `http://localhost:4000/api`

## Core Endpoints

### 1. Health Probe
- **`GET /health`**
- Returns status of database, code analyzer engine, and system uptime.
- Status code: `200 OK` (healthy) or `503 Service Unavailable` (degraded without DB).

### 2. Project Ingestion
- **`POST /projects/import`**
  - Content-Type: `multipart/form-data` with `archive` (.zip file) or `application/json` with metadata.
  - Returns `ProjectImportResponse` with project ID, file counts, and detected language distribution.

- **`GET /projects`**
  - Returns array of all registered projects.

- **`GET /projects/:projectId`**
  - Returns detailed project metadata.

- **`GET /projects/:projectId/files`**
  - Returns indexed project file list with relative paths, language tags, and sha256 checksums.

### 3. Static Analysis Lifecycle
- **`POST /projects/:projectId/analyze`**
  - Triggers asynchronous static analysis run.
  - Returns HTTP 202 Accepted with initialized `AnalysisJob` object.

- **`GET /analysis/:analysisId`**
  - Returns `AnalysisJob` including status (`queued`, `running`, `completed`, `failed`, `partial`), progress percentage, and summary.

- **`GET /analysis/:analysisId/graph`**
  - Returns nodes and edges formatted for React Flow interactive canvas.

- **`GET /analysis/:analysisId/findings`**
  - Query parameter: `?severity=critical|high|medium|low|info`
  - Returns array of detected code findings with line references and source code evidence snippets.

- **`GET /analysis/:analysisId/report`**
  - Returns structured audit report metadata and executive summary.
