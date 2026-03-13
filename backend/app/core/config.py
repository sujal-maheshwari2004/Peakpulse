from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── OpenAI ────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    USE_LLM:        bool = True

    # ── App ───────────────────────────────────────────────
    ENVIRONMENT:    str = "development"
    CORS_ORIGIN:    str = "http://localhost:5173"

    # ── Ping (UptimeRobot keepalive) ──────────────────────
    GRAPH_VERSION:  str = "1.0"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()