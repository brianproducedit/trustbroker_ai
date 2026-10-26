import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://fgdvlrfbpzkaetwwjhxq.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZHZscmZicHprYWV0d3dqaHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjgwMTc5NywiZXhwIjoyMTA4Mzc3Nzk3fQ.FCESWdHN3oEyywX6COmUYDtTivhd5-PGUaMRYuJq33A"

admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"

users = [
    {
        "email": "elena@acmeglobal.com",
        "password": "password123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Elena Rostova",
            "organization": "Acme Global Ventures LLC",
            "role": "client",
        },
    },
    {
        "email": "tariro@devstudio.co.zw",
        "password": "password123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Tariro Moyo",
            "organization": "DevStudio Zimbabwe",
            "role": "freelancer",
        },
    },
]

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

print("Registering users in Supabase Auth...")
for user_data in users:
    body = json.dumps(user_data).encode("utf-8")
    req = urllib.request.Request(admin_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            email = user_data["email"]
            uid = data.get("id")
            print(f"[OK] Created {email} -> UID: {uid}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"[ERROR] {user_data['email']} -> HTTP {e.code}: {err_msg}")
