"""PURPOSE: Verify customer row scoping isolation and 10k quote pagination integrity.
INPUT: None
RETURNS: None
ERRORS: raises AssertionError on isolation breach or pagination defect
"""

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()
API_BASE = "http://localhost:4000/api/v1"
PASSWORD = os.getenv("DEMO_USER_PASSWORD")
if not PASSWORD:
    raise ValueError("DEMO_USER_PASSWORD must be configured in .env")


def get_auth_session(email: str) -> tuple[requests.Session, dict]:
    """PURPOSE: Authenticate user and return session with profile metadata.
    INPUT: email: str
    RETURNS: tuple[requests.Session, dict]
    ERRORS: raises RuntimeError on auth failure
    """
    s = requests.Session()
    r = s.post(f"{API_BASE}/auth/login", json={"email": email, "password": PASSWORD}, timeout=10)
    if r.status_code != 200:
        raise RuntimeError(f"Login failed for {email}: {r.status_code} {r.text}")
    profile = r.json()["data"]["profile"]
    return s, profile


def verify_customer_scoping() -> None:
    """PURPOSE: Verify customer role is strictly scoped to their assigned account_id.
    INPUT: None
    RETURNS: None
    ERRORS: raises AssertionError on scoping leakage
    """
    print("\n--> [1/2] Verifying Customer Tenant Scoping Isolation...")
    s_cust, prof = get_auth_session("customer@o2c-demo.com")
    acc_id = prof.get("account_id")
    assert acc_id is not None, "Customer has no assigned account_id"
    print(f"  Customer profile account_id: {acc_id}")

    # List quotes
    r = s_cust.get(f"{API_BASE}/records/quote?limit=50")
    assert r.status_code == 200
    quotes = r.json()["data"]["items"]
    assert len(quotes) > 0, "No quotes found for customer"
    for q in quotes:
        assert q["account_id"] == acc_id, f"Scoping leak! Found quote with {q['account_id']}"
    print(f"  Verified {len(quotes)} quotes strictly belong to {acc_id}.")

    # Try accessing another account's quote
    s_admin, _ = get_auth_session("admin@o2c-demo.com")
    r_admin = s_admin.get(f"{API_BASE}/records/quote?limit=100")
    other_quote = next(q for q in r_admin.json()["data"]["items"] if q["account_id"] != acc_id)
    print(f"  Testing cross-tenant access to foreign quote: {other_quote['quote_id']} ({other_quote['account_id']})")

    r_cross = s_cust.get(f"{API_BASE}/records/quote/{other_quote['quote_id']}")
    assert r_cross.status_code in (400, 403), f"Cross-tenant access allowed: {r_cross.status_code}"
    print("  Cross-tenant access successfully blocked with HTTP 400/403 Forbidden.")


def verify_quote_pagination() -> None:
    """PURPOSE: Paginate through all 10,000 quotes via cursor and assert uniqueness.
    INPUT: None
    RETURNS: None
    ERRORS: raises AssertionError on count mismatch or duplicate IDs
    """
    print("\n--> [2/2] Verifying Complete 10,000 Quote Cursor Pagination...")
    s_admin, _ = get_auth_session("admin@o2c-demo.com")
    cursor = None
    all_ids: set[str] = set()
    total_fetched = 0
    pages = 0

    while True:
        url = f"{API_BASE}/records/quote?limit=100"
        if cursor:
            url += f"&cursor={cursor}"
        r = s_admin.get(url, timeout=15)
        assert r.status_code == 200
        data = r.json()["data"]
        items = data["items"]
        if not items:
            break
        for item in items:
            qid = item["quote_id"]
            assert qid not in all_ids, f"Duplicate quote_id encountered: {qid}"
            all_ids.add(qid)
        total_fetched += len(items)
        cursor = data.get("next_cursor")
        pages += 1
        if not cursor:
            break

    print(f"  Fetched {total_fetched} total records across {pages} pages.")
    print(f"  Unique quote IDs count: {len(all_ids)}")
    assert len(all_ids) == 10000, f"Expected 10,000 quotes, found {len(all_ids)}"
    print("  Cursor pagination verified 10,000 unique quotes without duplication.")


def main() -> None:
    """PURPOSE: Run scoping and pagination verification suite.
    INPUT: None
    RETURNS: None
    ERRORS: None
    """
    verify_customer_scoping()
    verify_quote_pagination()
    print("\n[+] Verification SUCCESS: Customer scoping & 10k pagination fully verified.\n")


if __name__ == "__main__":
    main()
