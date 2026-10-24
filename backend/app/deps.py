from typing import Generator, Optional
from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session
from app.database import get_session


def get_db() -> Generator[Session, None, None]:
    """Alias dependency for database session."""
    yield from get_session()


async def get_current_user_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract Bearer token from authorization header."""
    if not authorization:
        return None
    parts = authorization.split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None
