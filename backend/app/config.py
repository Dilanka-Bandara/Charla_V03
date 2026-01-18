from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "ChatFlow API"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    database_url: str
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
