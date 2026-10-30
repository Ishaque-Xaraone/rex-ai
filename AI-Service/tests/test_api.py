import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "capabilities" in data

def test_claim_verification():
    payload = {
        "claim": "The codebase contains a critical dynamic eval vulnerability SEC-001 in config manager",
        "symbols": [
            {
                "id": "sym-1",
                "name": "dangerousEval",
                "kind": "method",
                "line_reference": {"start_line": 26, "end_line": 28}
            }
        ],
        "findings": [
            {
                "id": "fnd-1",
                "rule_id": "SEC-001",
                "rule_title": "Dangerous Dynamic Code Execution (eval/Function)",
                "severity": "critical",
                "category": "security",
                "description": "Detected invocation of eval",
                "evidence": {
                    "file_id": "file-1",
                    "file_path": "src/config-manager.ts",
                    "line_reference": {"start_line": 27, "end_line": 27},
                    "snippet": "return eval(input);"
                },
                "confidence_score": 0.95
            }
        ]
    }
    response = client.post("/api/v1/verify-claim", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_supported"] is True
    assert data["verdict"] == "VERIFIED"
    assert data["confidence_score"] >= 0.9
