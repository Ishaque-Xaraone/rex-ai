# Sample Analysis Walkthrough

## 1. Import Codebase Archive
Submit an archive via curl or the web interface:

```bash
curl -X POST http://localhost:4000/api/projects/import \
  -F "archive=@sample-repo.zip" \
  -F "name=PaymentGateway"
```

Response:
```json
{
  "success": true,
  "data": {
    "projectId": "8b51d6c8-118b-4ad0-b2be-2b36a100fb2a",
    "name": "PaymentGateway",
    "importedFilesCount": 24,
    "totalSizeBytes": 142080,
    "detectedLanguages": [
      { "language": "typescript", "fileCount": 20, "percentage": 83 },
      { "language": "javascript", "fileCount": 4, "percentage": 17 }
    ],
    "importedAt": "2026-10-28T08:00:00.000Z"
  }
}
```

## 2. Trigger AST Analysis Pipeline
```bash
curl -X POST http://localhost:4000/api/projects/8b51d6c8-118b-4ad0-b2be-2b36a100fb2a/analyze
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "c76f5784-5f50-48e0-bb1b-1c5c6bcecf43",
    "projectId": "8b51d6c8-118b-4ad0-b2be-2b36a100fb2a",
    "status": "running",
    "progressPercent": 10,
    "currentPhase": "Initializing static analysis pipeline",
    "startedAt": "2026-10-28T08:00:05.000Z"
  }
}
```

## 3. Retrieve Findings & Source Evidence
```bash
curl http://localhost:4000/api/analysis/c76f5784-5f50-48e0-bb1b-1c5c6bcecf43/findings?severity=critical
```
