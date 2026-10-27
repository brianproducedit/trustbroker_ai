import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database import get_session
from app.models.user import UserProfile
from app.schemas.marketplace import ListingDetailRead, ListingListResponse
from app.services import marketplace_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.get(
    "",
    response_model=ListingListResponse,
    summary="Browse open contracts available to freelancers",
)
def list_listings(
    category: Optional[str] = Query(None, description="Filter by category, e.g. software, design"),
    min_budget: Optional[Decimal] = Query(None, ge=0, description="Minimum total contract amount in USD"),
    max_budget: Optional[Decimal] = Query(None, ge=0, description="Maximum total contract amount in USD"),
    skill: Optional[str] = Query(None, description="Match required skills, title, or description"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Authenticated freelancer (or any signed-in user) list of open marketplace contracts."""
    _ = current_user
    listings, total = marketplace_service.list_open_listings(
        session=session,
        category=category,
        min_budget=min_budget,
        max_budget=max_budget,
        skill=skill,
        page=page,
        per_page=per_page,
    )
    return ListingListResponse(listings=listings, total=total)


@router.get(
    "/{listing_id}",
    response_model=ListingDetailRead,
    summary="Open listing detail for freelancers",
)
def get_listing(
    listing_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """SOW, budget, and milestones for an open contract. Does not require being a party."""
    return marketplace_service.get_open_listing(session, listing_id, current_user)
