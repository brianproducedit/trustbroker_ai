import base64
from typing import Any, Dict, Optional
import httpx
from app.config import settings

PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com"
PAYPAL_LIVE_BASE = "https://api-m.paypal.com"


def get_base_url() -> str:
    return PAYPAL_SANDBOX_BASE if settings.paypal_mode == "sandbox" else PAYPAL_LIVE_BASE


async def get_paypal_access_token() -> str:
    """Fetch OAuth2 Bearer token from PayPal Developer API."""
    base_url = get_base_url()
    auth_str = f"{settings.paypal_client_id}:{settings.paypal_client_secret}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {"grant_type": "client_credentials"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(f"{base_url}/v1/oauth2/token", headers=headers, data=data)
        if res.status_code != 200:
            raise Exception(f"Failed to obtain PayPal access token: {res.text}")
        json_data = res.json()
        return json_data["access_token"]


async def create_paypal_order(
    amount: float,
    currency: str = "USD",
    reference_id: Optional[str] = None,
    description: str = "TrustBroker Escrow Staging",
) -> Dict[str, Any]:
    """Create an order with PayPal Orders v2 API with intent=CAPTURE."""
    token = await get_paypal_access_token()
    base_url = get_base_url()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": reference_id or "default",
                "description": description,
                "amount": {
                    "currency_code": currency,
                    "value": f"{amount:.2f}",
                },
            }
        ],
        "application_context": {
            "brand_name": "TrustBroker AI",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
        },
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(f"{base_url}/v2/checkout/orders", headers=headers, json=payload)
        if res.status_code not in (200, 201):
            raise Exception(f"PayPal order creation failed: {res.text}")
        return res.json()


async def capture_paypal_order(order_id: str) -> Dict[str, Any]:
    """Capture payment for an approved PayPal order."""
    token = await get_paypal_access_token()
    base_url = get_base_url()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(
            f"{base_url}/v2/checkout/orders/{order_id}/capture",
            headers=headers,
            json={},
        )
        if res.status_code not in (200, 201):
            raise Exception(f"PayPal capture failed: {res.text}")
        return res.json()
