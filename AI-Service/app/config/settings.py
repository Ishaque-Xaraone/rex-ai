import os
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "REX AI Service"
    env: str = os.getenv("ENV", "development")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:4000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ]
    default_provider: str = os.getenv("DEFAULT_PROVIDER", "mock")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    anthropic_api_key: str | None = os.getenv("ANTHROPIC_API_KEY")
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY")

settings = Settings()
