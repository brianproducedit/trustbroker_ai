"""
TrustBroker AI — Workstream A: Authentication & Identity Integrity Tests
Verifies that:
- Production environment rejects dev-user tokens unconditionally.
- Development requires explicit allow_dev_auth_tokens=True to accept dev tokens.
- Arbitrary dev-user suffixes are rejected (only 'client' and 'freelancer' allowed).
- get_optional_current_user does NOT silently downgrade invalid credentials to anonymous.
"""
import pytest
from fastapi import HTTPException
from app.config import settings
from app.utils.security import decode_supabase_jwt, get_current_user, get_optional_current_user


def test_production_rejects_dev_tokens():
    """In production, dev-user tokens must be rejected even if allow_dev_auth_tokens is accidentally True."""
    orig_env = settings.environment
    orig_flag = settings.allow_dev_auth_tokens
    try:
        settings.environment = "production"
        settings.allow_dev_auth_tokens = True
        
        with pytest.raises(HTTPException) as exc_info:
            decode_supabase_jwt("dev-user-client")
        assert exc_info.value.status_code == 401
        assert "disabled in this environment" in exc_info.value.detail

        with pytest.raises(HTTPException) as exc_info:
            decode_supabase_jwt("dev-user-freelancer")
        assert exc_info.value.status_code == 401
    finally:
        settings.environment = orig_env
        settings.allow_dev_auth_tokens = orig_flag


def test_dev_tokens_require_explicit_flag():
    """In development, dev tokens must be rejected if allow_dev_auth_tokens is False."""
    orig_env = settings.environment
    orig_flag = settings.allow_dev_auth_tokens
    try:
        settings.environment = "development"
        settings.allow_dev_auth_tokens = False

        with pytest.raises(HTTPException) as exc_info:
            decode_supabase_jwt("dev-user-client")
        assert exc_info.value.status_code == 401
        assert "disabled in this environment" in exc_info.value.detail
    finally:
        settings.environment = orig_env
        settings.allow_dev_auth_tokens = orig_flag


def test_dev_tokens_accept_only_known_roles():
    """In development with flag enabled, only 'client' and 'freelancer' roles are valid."""
    orig_env = settings.environment
    orig_flag = settings.allow_dev_auth_tokens
    try:
        settings.environment = "development"
        settings.allow_dev_auth_tokens = True

        # Valid client
        client_claims = decode_supabase_jwt("dev-user-client")
        assert client_claims["email"] == "client.demo@trustbroker.ai"
        assert client_claims["user_metadata"]["role"] == "client"

        # Valid freelancer
        freelancer_claims = decode_supabase_jwt("dev-user-freelancer")
        assert freelancer_claims["email"] == "freelancer.demo@trustbroker.ai"
        assert freelancer_claims["user_metadata"]["role"] == "freelancer"

        # Arbitrary suffixes must NOT be mapped to freelancer; must be rejected with 401
        with pytest.raises(HTTPException) as exc_info:
            decode_supabase_jwt("dev-user-admin")
        assert exc_info.value.status_code == 401
        assert "Invalid development token role" in exc_info.value.detail

        with pytest.raises(HTTPException) as exc_info:
            decode_supabase_jwt("dev-user-attacker")
        assert exc_info.value.status_code == 401
    finally:
        settings.environment = orig_env
        settings.allow_dev_auth_tokens = orig_flag


def test_optional_current_user_no_downgrade(session):
    """When an invalid Authorization header is supplied, it must raise 401, not return None."""
    # 1. No Authorization header -> valid anonymous access
    anon_user = get_optional_current_user(authorization=None, session=session)
    assert anon_user is None

    # 2. Invalid Authorization header -> must raise 401 (no silent downgrade)
    with pytest.raises(HTTPException) as exc_info:
        get_optional_current_user(authorization="Bearer invalid.token.here", session=session)
    assert exc_info.value.status_code == 401
