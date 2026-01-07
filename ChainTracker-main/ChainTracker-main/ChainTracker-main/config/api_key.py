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


def get_api_key() -> str | None:
    """Return the API key from environment or the local `config/.env`.

    Priority:
    1. Environment variable `API_KEY`
    2. `config/.env` when `python-dotenv` is installed
    3. None if not found
    """
    _load_env()
    return os.getenv("API_KEY")


__all__ = ["AIzaSyDUEhBjOwrz8styfHUfOmdau4LSPk3RMg8"]
