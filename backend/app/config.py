from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Server & Environment
    environment: str = "development"
    allow_dev_auth_tokens: bool = False
    seed_demo_data: bool = Field(default=False, validation_alias="SEED_DEMO_DATA")
    port: int = 8000
    frontend_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,https://trustbroker-ai-frontend.onrender.com,https://trustbroker-ai-frontend-bx9a.onrender.com"
    cors_allowed_origin_regex: Optional[str] = Field(default=None, validation_alias="CORS_ALLOWED_ORIGIN_REGEX")

    # Database (PostgreSQL direct URI)
    database_url: str = "postgresql://postgres:postgres@localhost:5432/trustbroker_ai"


    # Supabase Auth & Storage
    supabase_url: str = "https://fgdvlrfbpzkaetwwjhxq.supabase.co"
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # PayPal Sandbox & Orders API
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_mode: str = "sandbox"
    paypal_webhook_id: str = ""

    # AI Engine Configuration (Groq → OpenRouter → DeepSeek → Deterministic Fallback)
    ai_provider: str = "auto"
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemma-4-27b-it:free"
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"



    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_dev_auth_allowed(self) -> bool:
        """Development auth bypass is strictly disabled in production even if flag is True."""
        if self.environment.lower() == "production":
            return False
        return self.allow_dev_auth_tokens

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url



settings = Settings()
