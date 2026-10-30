from .base import BaseAIProvider
from .mock_provider import MockAIProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider
from .gemini_provider import GeminiProvider
from ..config.settings import settings

def get_ai_provider() -> BaseAIProvider:
    provider = settings.default_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        return OpenAIProvider()
    elif provider == "anthropic" and settings.anthropic_api_key:
        return AnthropicProvider()
    elif provider == "gemini" and settings.gemini_api_key:
        return GeminiProvider()

    # Default to deterministic mock provider for zero-friction local development & test
    return MockAIProvider()
