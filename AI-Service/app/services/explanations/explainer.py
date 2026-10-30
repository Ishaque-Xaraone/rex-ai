from ...schemas.models import ExplanationRequest, ExplanationResponse
from ...providers.factory import get_ai_provider

class ExplanationService:
    @staticmethod
    async def explain_finding(request: ExplanationRequest) -> ExplanationResponse:
        finding = request.finding
        evidence = finding.evidence

        # Verified facts strictly from AST analysis
        verified_facts = [
            f"Rule {finding.rule_id} triggered on file: {evidence.file_path}",
            f"Detected at line range: {evidence.line_reference.start_line}-{evidence.line_reference.end_line}",
            f"Severity assigned by compiler analyzer: {finding.severity}",
        ]

        potential_risks = [
            f"Risk: {finding.description}",
        ]

        suggested_fix = finding.remediation or "Review and replace pattern with safe alternative."

        explanation = (
            f"Static analysis flagged {finding.rule_title} in '{evidence.file_path}' "
            f"at line {evidence.line_reference.start_line}. The AST analyzer identified: '{finding.description}'."
        )

        return ExplanationResponse(
            finding_id=finding.id,
            explanation=explanation,
            verified_facts=verified_facts,
            potential_risks=potential_risks,
            suggested_fix=suggested_fix,
            is_grounded_in_evidence=True,
        )
