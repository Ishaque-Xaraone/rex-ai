from ...schemas.models import SummarizationRequest, SummarizationResponse

class SummarizationService:
    @staticmethod
    async def summarize_audit(request: SummarizationRequest) -> SummarizationResponse:
        critical_count = sum(1 for f in request.findings if f.severity == "critical")
        high_count = sum(1 for f in request.findings if f.severity == "high")
        medium_count = sum(1 for f in request.findings if f.severity == "medium")

        # Deterministic risk score calculation (0 - 100)
        risk_score = min(100, (critical_count * 35) + (high_count * 20) + (medium_count * 10))

        executive_summary = (
            f"Audit Summary for '{request.project_name}': Analyzed {request.total_files} files written primarily in "
            f"{request.primary_language}. Discovered {len(request.findings)} findings ({critical_count} critical, "
            f"{high_count} high, {medium_count} medium). Overall risk score evaluated at {risk_score}/100."
        )

        recommendations = []
        if critical_count > 0:
            recommendations.append("Immediately remediate all dynamic code execution (eval) and hardcoded secret credentials.")
        if high_count > 0:
            recommendations.append("Sanitize inputs passed to system commands and prevent command injection.")
        if not recommendations:
            recommendations.append("Maintain continuous static AST analysis and dependency security scanning in CI/CD pipeline.")

        return SummarizationResponse(
            project_name=request.project_name,
            risk_score=risk_score,
            executive_summary=executive_summary,
            critical_findings_count=critical_count,
            top_recommendations=recommendations,
        )
