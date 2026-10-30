from ...schemas.models import ClaimVerificationRequest, ClaimVerificationResponse

class ClaimVerificationService:
    @staticmethod
    async def verify_claim(request: ClaimVerificationRequest) -> ClaimVerificationResponse:
        claim_lower = request.claim.lower()
        supporting_evidence = []

        # 1. Match claim against verified findings
        matched_finding = None
        for finding in request.findings:
            if (
                finding.rule_id.lower() in claim_lower
                or finding.rule_title.lower() in claim_lower
                or finding.category.lower() in claim_lower
            ):
                matched_finding = finding
                supporting_evidence.append(
                    f"Verified finding {finding.rule_id} ({finding.severity}): {finding.description} in {finding.evidence.file_path}"
                )

        # 2. Match claim against symbols
        for symbol in request.symbols:
            if symbol.name.lower() in claim_lower:
                supporting_evidence.append(
                    f"AST symbol confirmed: {symbol.kind} '{symbol.name}' exists at lines {symbol.line_reference.start_line}-{symbol.line_reference.end_line}"
                )

        if matched_finding:
            return ClaimVerificationResponse(
                claim=request.claim,
                is_supported=True,
                verdict="VERIFIED",
                confidence_score=matched_finding.confidence_score,
                supporting_evidence=supporting_evidence,
                reasoning=f"The claim is directly confirmed by compiler finding {matched_finding.rule_id} with verified source code snippet.",
            )

        if supporting_evidence:
            return ClaimVerificationResponse(
                claim=request.claim,
                is_supported=False,
                verdict="INSUFFICIENT_EVIDENCE",
                confidence_score=0.4,
                supporting_evidence=supporting_evidence,
                reasoning="The symbol exists in the AST, but no corresponding vulnerability finding confirms the full claim.",
            )

        return ClaimVerificationResponse(
            claim=request.claim,
            is_supported=False,
            verdict="REFUTED",
            confidence_score=0.85,
            supporting_evidence=[],
            reasoning="No evidence, AST symbol, or rule execution in the verified codebase supports this claim.",
        )
