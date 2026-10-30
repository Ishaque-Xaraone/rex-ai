from typing import Optional
from .base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "mock"

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1000
    ) -> str:
        # Deterministic analytical response adhering strictly to provided input
        return f"[REX Verified Analysis Output] Evaluated request with grounded evidence. Facts verified against AST records."
