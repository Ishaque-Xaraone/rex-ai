# Static Analysis Pipeline Execution Model

## Pipeline Stages

```
   ┌───────────────────────┐
   │ 1. Archive Ingestion  │ ──► Verify ZIP Slip, bounds & path safety
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 2. File Discovery     │ ──► Exclude node_modules, build output, binaries
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 3. Language Detection │ ──► Map extensions to registered language adapters
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 4. AST Traversal      │ ──► Construct syntax tree via Compiler API
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 5. Symbol Extraction  │ ──► Extract functions, classes, methods, scopes
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 6. Dependency Graph   │ ──► Resolve module imports, requires & calls
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 7. Rule Evaluation    │ ──► Evaluate security & code quality checks
   └──────────┬────────────┘
              ▼
   ┌───────────────────────┐
   │ 8. Evidence & Summary │ ──► Aggregate normalized AnalysisResult
   └───────────────────────┘
```

## Security & Reliability Guardrails
1. **Unchecked Code Execution**: Source code is strictly parsed as static AST structures and never executed.
2. **Decompression Bomb Protection**: Expanded size is checked continuously against `MAX_EXPANDED_ARCHIVE_BYTES` (default 200MB).
3. **Partial vs Failed Status**: If some files encounter unsupported syntax or missing adapters, the job status is flagged as `partial` with detailed limitation entries, rather than returning a false success or complete failure.
