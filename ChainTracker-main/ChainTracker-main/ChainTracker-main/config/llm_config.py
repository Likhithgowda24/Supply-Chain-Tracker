from pathlib import Path
import os

try:
    from dotenv import load_dotenv
    _DOTENV_AVAILABLE = True
except Exception:
    _DOTENV_AVAILABLE = False


def _load_env():
    # Load local config/.env if python-dotenv is installed.
    env_path = Path(__file__).parent / ".env"
    if _DOTENV_AVAILABLE and env_path.exists():
        load_dotenv(dotenv_path=env_path)


def get_llm_model() -> str:
    """Return the LLM model name to use.

    Priority:
    1. Environment variable `LLM_MODEL`
    2. Environment variable `MODEL`
    3. Default to `gemini:2.5-pro`
    """
    _load_env()
    return os.getenv("LLM_MODEL") or os.getenv("MODEL") or "gemini:2.5-pro"


__all__ = ["get_llm_model"]
