import base64
from typing import Any, Dict, Optional
import httpx
from app.config import settings

PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com"
PAYPAL_LIVE_BASE = "https://api-m.paypal.com"


def get_base_url() -> str:
    return PAYPAL_SANDBOX_BASE if settings.paypal_mode.lower() == "sandbox" else PAYPAL_LIVE_BASE


async def get_paypal_access_token() -> str:
    """Fetch OAuth2 Bearer token from PayPal Developer API."""
    base_url = get_base_url()
    auth_str = f"{settings.paypal_client_id.strip()}:{settings.paypal_client_secret.strip()}"
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
    description: str = "TrustBroker milestone funding",
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an order with PayPal Orders v2 API with intent=CAPTURE."""
    token = await get_paypal_access_token()
    base_url = get_base_url()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if request_id:
        headers["PayPal-Request-Id"] = request_id

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
            "landing_page": "LOGIN",
            "user_action": "PAY_NOW",
        },
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(f"{base_url}/v2/checkout/orders", headers=headers, json=payload)
        if res.status_code not in (200, 201):
            raise Exception(f"PayPal order creation failed: {res.text}")
        return res.json()


async def get_paypal_order(order_id: str) -> Dict[str, Any]:
    """Fetch details for a PayPal order via GET /v2/checkout/orders/{order_id}."""
    token = await get_paypal_access_token()
    base_url = get_base_url()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(f"{base_url}/v2/checkout/orders/{order_id}", headers=headers)
        if res.status_code != 200:
            raise Exception(f"Failed to fetch PayPal order {order_id}: {res.text}")
        return res.json()


async def create_payout(
    *,
    amount: float,
    currency: str,
    receiver_email: str,
    request_id: str,
    note: str = "TrustBroker milestone payout",
) -> Dict[str, Any]:
    """Send funds from the platform PayPal balance to the freelancer via Payouts API."""
    token = await get_paypal_access_token()
    base_url = get_base_url()
    payload = {
        "sender_batch_header": {
            "sender_batch_id": request_id,
            "email_subject": "You have a payout from TrustBroker AI",
            "email_message": note,
        },
        "items": [
            {
                "recipient_type": "EMAIL",
                "amount": {"value": f"{amount:.2f}", "currency": currency},
                "receiver": receiver_email,
                "sender_item_id": request_id,
                "note": note,
            }
        ],
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "PayPal-Request-Id": request_id,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.post(f"{base_url}/v1/payments/payouts", headers=headers, json=payload)
        if res.status_code not in (200, 201):
            raise Exception(f"PayPal payout failed: {res.text}")
        return res.json()


async def get_payout_batch(batch_id: str) -> Dict[str, Any]:
    """Fetch the current PayPal status for a previously created payout batch."""
    base_url = get_base_url()
    async with httpx.AsyncClient(timeout=20.0) as client:
        token = await get_paypal_access_token()
        headers = {"Authorization": f"******", "Content-Type": "application/json"}
        res = await client.get(f"{base_url}/v1/payments/payouts/{batch_id}", headers=headers)
        if res.status_code == 401:
            token = await get_paypal_access_token()
            headers["Authorization"] = f"******"
            res = await client.get(f"{base_url}/v1/payments/payouts/{batch_id}", headers=headers)
        if res.status_code != 200:
            raise Exception(f"Failed to fetch PayPal payout batch {batch_id}: {res.text}")
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


async def verify_webhook_signature(
    headers: Dict[str, str],
    webhook_payload: Dict[str, Any],
) -> bool:
    """Verify PayPal webhook transmission signature against PayPal API."""
    if not settings.paypal_webhook_id:
        if settings.environment.lower() == "production":
            return False  # Strict fail-closed in production
        return False  # Fail closed by default

    auth_algo = headers.get("paypal-auth-algo") or headers.get("PAYPAL-AUTH-ALGO")
    cert_url = headers.get("paypal-cert-url") or headers.get("PAYPAL-CERT-URL")
    transmission_id = headers.get("paypal-transmission-id") or headers.get("PAYPAL-TRANSMISSION-ID")
    transmission_sig = headers.get("paypal-transmission-sig") or headers.get("PAYPAL-TRANSMISSION-SIG")
    transmission_time = headers.get("paypal-transmission-time") or headers.get("PAYPAL-TRANSMISSION-TIME")

    if not all([auth_algo, cert_url, transmission_id, transmission_sig, transmission_time]):
        return False

    token = await get_paypal_access_token()
    base_url = get_base_url()
    verify_payload = {
        "auth_algo": auth_algo,
        "cert_url": cert_url,
        "transmission_id": transmission_id,
        "transmission_sig": transmission_sig,
        "transmission_time": transmission_time,
        "webhook_id": settings.paypal_webhook_id,
        "webhook_event": webhook_payload,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            f"{base_url}/v1/notifications/verify-webhook-signature",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=verify_payload,
        )
        if res.status_code == 200:
            return res.json().get("verification_status") == "SUCCESS"
        return False
