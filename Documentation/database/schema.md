# PostgreSQL Database Schema Specification

All tables use parameterized SQL queries and version-controlled migration scripts.

## Table Definitions

### `projects`
- `id` (VARCHAR(64) PRIMARY KEY): Stable UUID or identifier
- `name` (VARCHAR(255) NOT NULL): Project display name
- `description` (TEXT): Optional project overview
- `repository_url` (TEXT): Upstream git repository if applicable
- `default_branch` (VARCHAR(100)): Main branch identifier
- `root_path` (TEXT): Local storage folder path
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)

### `project_files`
- `id` (VARCHAR(64) PRIMARY KEY)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `relative_path` (TEXT NOT NULL)
- `language` (VARCHAR(50) NOT NULL)
- `size_bytes` (BIGINT NOT NULL DEFAULT 0)
- `line_count` (INTEGER NOT NULL DEFAULT 0)
- `sha256_hash` (CHAR(64) NOT NULL)
- `is_excluded` (BOOLEAN NOT NULL DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)
- UNIQUE CONSTRAINT (`project_id`, `relative_path`)

### `analysis_jobs`
- `id` (VARCHAR(64) PRIMARY KEY)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `status` (VARCHAR(20) NOT NULL): `queued`, `running`, `completed`, `failed`, `partial`
- `progress_percent` (INTEGER NOT NULL DEFAULT 0)
- `current_phase` (VARCHAR(100))
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `error_message` (TEXT)
- `limitations` (JSONB)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)

### `analysis_results`
- `id` (VARCHAR(64) PRIMARY KEY)
- `job_id` (VARCHAR(64) NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `summary` (JSONB NOT NULL)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)

### `symbols`
- `id` (VARCHAR(128) PRIMARY KEY)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `file_id` (VARCHAR(64) NOT NULL REFERENCES project_files(id) ON DELETE CASCADE)
- `name` (VARCHAR(255) NOT NULL)
- `kind` (VARCHAR(50) NOT NULL): `function`, `method`, `class`, `interface`, etc.
- `scope` (VARCHAR(255))
- `signature` (TEXT)
- `return_type` (VARCHAR(255))
- `is_exported` (BOOLEAN NOT NULL DEFAULT FALSE)
- `is_async` (BOOLEAN NOT NULL DEFAULT FALSE)
- `line_reference` (JSONB NOT NULL)
- `documentation` (TEXT)

### `dependencies`
- `id` (VARCHAR(128) PRIMARY KEY)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `analysis_id` (VARCHAR(64) NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE)
- `source_id` (VARCHAR(128) NOT NULL)
- `source_path` (TEXT NOT NULL)
- `target_id` (VARCHAR(128) NOT NULL)
- `target_path` (TEXT NOT NULL)
- `edge_type` (VARCHAR(50) NOT NULL): `import`, `call`, `inheritance`, `type_usage`
- `specifier` (TEXT)
- `is_external` (BOOLEAN NOT NULL DEFAULT FALSE)
- `line_reference` (JSONB)

### `findings`
- `id` (VARCHAR(128) PRIMARY KEY)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `analysis_id` (VARCHAR(64) NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE)
- `rule_id` (VARCHAR(50) NOT NULL)
- `rule_title` (VARCHAR(255) NOT NULL)
- `severity` (VARCHAR(20) NOT NULL): `critical`, `high`, `medium`, `low`, `info`
- `category` (VARCHAR(50) NOT NULL): `security`, `architecture`, `code_quality`, `reverse_engineering`
- `description` (TEXT NOT NULL)
- `evidence` (JSONB NOT NULL)
- `remediation` (TEXT)
- `confidence_score` (NUMERIC(3, 2) NOT NULL DEFAULT 1.0)
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)

### `reports`
- `id` (VARCHAR(64) PRIMARY KEY)
- `analysis_id` (VARCHAR(64) NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE)
- `project_id` (VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE)
- `status` (VARCHAR(20) NOT NULL DEFAULT 'pending')
- `file_path` (TEXT)
- `file_size_bytes` (BIGINT)
- `executive_summary` (TEXT NOT NULL)
- `total_findings` (INTEGER NOT NULL DEFAULT 0)
- `findings_by_severity` (JSONB NOT NULL)
- `generated_at` (TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)
