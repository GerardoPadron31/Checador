from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field("HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    database_url: str = Field("sqlite:///./checador.db", env="DATABASE_URL")
    static_faces_dir: str = Field("./app/static/faces", env="STATIC_FACES_DIR")
    dataset_dir: str = Field("../Dataset", env="DATASET_DIR")

    class Config:
        env_file = ".env"

settings = Settings()