from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class LineReferenceModel(BaseModel):
    start_line: int = Field(ge=1)
    end_line: int = Field(ge=1)
    start_column: Optional[int] = None
    end_column: Optional[int] = None

class SourceEvidenceModel(BaseModel):
    file_id: str
    file_path: str
    line_reference: LineReferenceModel
    snippet: str
    context_before: Optional[List[str]] = None
    context_after: Optional[List[str]] = None

class CodeSymbolModel(BaseModel):
    id: str
    name: str
    kind: str
    scope: Optional[str] = None
    signature: Optional[str] = None
    is_exported: bool = False
    line_reference: LineReferenceModel

class FindingModel(BaseModel):
    id: str
    rule_id: str
    rule_title: str
    severity: Literal["critical", "high", "medium", "low", "info"]
    category: str
    description: str
    evidence: SourceEvidenceModel
    remediation: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0)

# Request & Response Contracts
class ExplanationRequest(BaseModel):
    finding: FindingModel
    project_context: Optional[str] = None

class ExplanationResponse(BaseModel):
    finding_id: str
    explanation: str
    verified_facts: List[str]
    potential_risks: List[str]
    suggested_fix: str
    is_grounded_in_evidence: bool = True

class ClaimVerificationRequest(BaseModel):
    claim: str
    symbols: List[CodeSymbolModel] = []
    findings: List[FindingModel] = []
    source_snippets: List[str] = []

class ClaimVerificationResponse(BaseModel):
    claim: str
    is_supported: bool
    verdict: Literal["VERIFIED", "REFUTED", "INSUFFICIENT_EVIDENCE"]
    confidence_score: float
    supporting_evidence: List[str]
    reasoning: str

class SummarizationRequest(BaseModel):
    project_name: str
    total_files: int
    findings: List[FindingModel] = []
    primary_language: str = "TypeScript"

class SummarizationResponse(BaseModel):
    project_name: str
    risk_score: int = Field(ge=0, le=100)
    executive_summary: str
    critical_findings_count: int
    top_recommendations: List[str]
