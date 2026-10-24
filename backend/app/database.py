from typing import Generator
from sqlmodel import Session, create_engine
from app.config import settings

# PostgreSQL Engine with connection pooling and pre-ping
engine = create_engine(
    settings.sqlalchemy_database_url,
    echo=(settings.environment == "development"),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)



def get_session() -> Generator[Session, None, None]:
    """Dependency that provides an active SQLModel session."""
    with Session(engine) as session:
        yield session
