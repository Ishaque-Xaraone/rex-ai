from fastapi import APIRouter, HTTPException
from ..schemas.models import (
    ExplanationRequest,
    ExplanationResponse,
    ClaimVerificationRequest,
    ClaimVerificationResponse,
    SummarizationRequest,
    SummarizationResponse,
)
from ..services.explanations.explainer import ExplanationService
from ..services.claim_verification.verifier import ClaimVerificationService
from ..services.summarization.summarizer import SummarizationService

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "rex-ai-service",
        "version": "0.1.0",
        "capabilities": ["explanations", "claim_verification", "summarization"],
    }

@router.post("/explain", response_model=ExplanationResponse)
async def explain_finding(request: ExplanationRequest):
    try:
        return await ExplanationService.explain_finding(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-claim", response_model=ClaimVerificationResponse)
async def verify_claim(request: ClaimVerificationRequest):
    try:
        return await ClaimVerificationService.verify_claim(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize", response_model=SummarizationResponse)
async def summarize(request: SummarizationRequest):
    try:
        return await SummarizationService.summarize_audit(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
