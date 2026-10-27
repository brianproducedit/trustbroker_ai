import asyncio
import httpx

SUPABASE_URL = "https://fgdvlrfbpzkaetwwjhxq.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZHZscmZicHprYWV0d3dqaHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjgwMTc5NywiZXhwIjoyMTA4Mzc3Nzk3fQ.FCESWdHN3oEyywX6COmUYDtTivhd5-PGUaMRYuJq33A"

admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"

users = [
    {
        "email": "client.demo@trustbroker.ai",
        "password": "DemoPassword2026!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Elena Rostova",
            "organization": "Acme Global Ventures LLC",
            "role": "client",
            "primary_workspace": "client",
        },
    },
    {
        "email": "freelancer.demo@trustbroker.ai",
        "password": "DemoPassword2026!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Tariro Moyo",
            "organization": "DevStudio Zimbabwe",
            "role": "freelancer",
            "primary_workspace": "freelancer",
            "paypal_payout_email": "freelancer-payout@sandbox.paypal.com",
        },
    },
    {
        "email": "newcomer.demo@trustbroker.ai",
        "password": "DemoPassword2026!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Kuda Nyamuda",
            "organization": "Independent Fullstack",
            "role": "freelancer",
            "primary_workspace": "freelancer",
            "paypal_payout_email": "newcomer-payout@sandbox.paypal.com",
        },
    },
    {
        "email": "elena@acmeglobal.com",
        "password": "DemoPassword2026!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Elena Rostova",
            "organization": "Acme Global Ventures LLC",
            "role": "client",
            "primary_workspace": "client",
        },
    },
    {
        "email": "tariro@devstudio.co.zw",
        "password": "DemoPassword2026!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Tariro Moyo",
            "organization": "DevStudio Zimbabwe",
            "role": "freelancer",
            "primary_workspace": "freelancer",
            "paypal_payout_email": "freelancer-payout@sandbox.paypal.com",
        },
    },
]

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


async def main():
    print("=" * 60)
    print("TrustBroker AI — Supabase Auth User Seeder")
    print(f"Target: {SUPABASE_URL}")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Fetch existing users
        print("\nFetching existing Supabase Auth users...")
        existing_by_email = {}
        try:
            resp = await client.get(f"{admin_url}?page=1&per_page=100", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                raw_users = data.get("users", []) if isinstance(data, dict) else data
                for u in raw_users:
                    em = (u.get("email") or "").strip().lower()
                    if em:
                        existing_by_email[em] = u
                print(f"[OK] Found {len(existing_by_email)} user(s) currently in Supabase Auth:")
                for em, u in existing_by_email.items():
                    print(f"  - {em} (UID: {u.get('id')})")
            else:
                print(f"[WARN] Failed to list users: HTTP {resp.status_code} {resp.text}")
        except Exception as exc:
            print(f"[ERROR] Could not query admin/users: {exc}")

        # 2. Upsert each desired account
        print("\nSeeding accounts with password 'DemoPassword2026!'...")
        for user_data in users:
            email = user_data["email"].strip().lower()
            existing = existing_by_email.get(email)

            if existing:
                uid = existing["id"]
                update_url = f"{admin_url}/{uid}"
                payload = {
                    "password": user_data["password"],
                    "email_confirm": True,
                    "user_metadata": user_data["user_metadata"],
                }
                res = await client.put(update_url, headers=headers, json=payload)
                if res.status_code == 200:
                    print(f"[UPDATED] {email} -> Password set to '{user_data['password']}' (UID: {uid})")
                else:
                    print(f"[FAIL] Update {email}: HTTP {res.status_code} {res.text}")
            else:
                res = await client.post(admin_url, headers=headers, json=user_data)
                if res.status_code in (200, 201):
                    new_uid = res.json().get("id")
                    print(f"[CREATED] {email} -> Created successfully (UID: {new_uid})")
                else:
                    print(f"[FAIL] Create {email}: HTTP {res.status_code} {res.text}")

    print("\n" + "=" * 60)
    print("Supabase Auth Seeding Complete!")
    print("You can now log in with:")
    for u in users:
        print(f"  Email: {u['email']}  |  Password: {u['password']}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
