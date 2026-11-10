"""PURPOSE: End-to-end endpoint connectivity matrix testing API routes directly and via Vite proxy.
INPUT: None (calls http://localhost:4000 and http://localhost:5173)
RETURNS: int exit code (0 if all passed, 1 on any failure)
ERRORS: prints failure details and returns 1
"""

import os
import sys

from dotenv import load_dotenv
import requests

load_dotenv()
API_BASE = "http://localhost:4000"
PROXY_BASE = "http://localhost:5173"
PASSWORD = os.getenv("DEMO_USER_PASSWORD")
if not PASSWORD:
    raise ValueError("DEMO_USER_PASSWORD must be configured in .env")

ROLES = ["customer", "sales_ops", "support_agent", "analyst", "admin"]
_SESSIONS: dict[tuple[str, str | None], requests.Session] = {}


def get_session(base_url: str, role: str | None) -> requests.Session:
    """PURPOSE: Retrieve or create authenticated session for role and base url.
    INPUT: base_url: str, role: str | None
    RETURNS: requests.Session
    ERRORS: raises RuntimeError on failed login
    """
    key = (base_url, role)
    if key in _SESSIONS:
        return _SESSIONS[key]
    session = requests.Session()
    if role:
        url = f"{base_url}/api/v1/auth/login"
        email = f"{role}@o2c-demo.com" if role != "support_agent" else "support@o2c-demo.com"
        resp = session.post(url, json={"email": email, "password": PASSWORD}, timeout=10)
        if resp.status_code != 200:
            raise RuntimeError(f"Failed login for {email}: {resp.status_code} {resp.text}")
    _SESSIONS[key] = session
    return session


def call_endpoint(base_url: str, method: str, path: str, session: requests.Session) -> tuple[int, bool]:
    """PURPOSE: Call an endpoint and check standard response envelope {ok, data|error}.
    INPUT: base_url: str, method: str, path: str, session: requests.Session
    RETURNS: tuple[int, bool] (status code, envelope valid)
    ERRORS: catches requests.RequestException, ValueError, or OSError
    """
    url = f"{base_url}{path}"
    try:
        kwargs: dict = {"timeout": 10}
        if method == "POST":
            kwargs["json"] = {"status": "ACKNOWLEDGED", "note": "Smoke check"}
        resp = session.request(method, url, **kwargs)
        body = resp.json()
        envelope_valid = isinstance(body, dict) and "ok" in body
        return resp.status_code, envelope_valid
    except (requests.RequestException, ValueError, OSError):
        return 0, False


def evaluate_endpoint(method: str, path: str, role: str | None, expected: int) -> tuple[bool, str, str]:
    """PURPOSE: Evaluate endpoint directly and via Vite proxy against expected status.
    INPUT: method: str, path: str, role: str | None, expected: int
    RETURNS: tuple[bool, str, str] (success, direct status, proxy status)
    ERRORS: none
    """
    try:
        s_dir = get_session(API_BASE, role)
        code_dir, env_dir = call_endpoint(API_BASE, method, path, s_dir)
        s_pxy = get_session(PROXY_BASE, role)
        code_pxy, env_pxy = call_endpoint(PROXY_BASE, method, path, s_pxy)
        dir_ok = code_dir == expected and env_dir
        pxy_ok = code_pxy == expected and env_pxy
        status_dir = f"{code_dir} ({'env' if env_dir else 'bad'})"
        status_pxy = f"{code_pxy} ({'env' if env_pxy else 'bad'})"
        return (dir_ok and pxy_ok), status_dir, status_pxy
    except (requests.RequestException, ValueError, RuntimeError, OSError) as exc:
        return False, f"ERR: {exc}", "ERR"


def get_test_matrix() -> list[tuple[str, str, str | None, int]]:
    """PURPOSE: Return matrix of endpoints, user roles, and expected HTTP status codes.
    INPUT: None
    RETURNS: list[tuple[str, str, str | None, int]]
    ERRORS: none
    """
    m: list[tuple[str, str, str | None, int]] = [
        ("GET", "/health", None, 200),
        ("GET", "/api/v1/auth/me", None, 401),
        ("GET", "/api/v1/analytics/summary", None, 401),
        ("GET", "/api/v1/exceptions", None, 401),
        ("GET", "/api/v1/admin/users", None, 401),
    ]
    for r in ROLES:
        m.append(("GET", "/api/v1/auth/me", r, 200))
        m.append(("GET", "/api/v1/records/quote", r, 200))
        m.append(("GET", "/api/v1/analytics/summary", r, 403 if r == "customer" else 200))
        m.append(("GET", "/api/v1/analytics/leakage", r, 403 if r in ("customer", "support_agent") else 200))
        m.append(("GET", "/api/v1/exceptions", r, 403 if r in ("customer", "sales_ops") else 200))
        m.append(("GET", "/api/v1/exceptions/evaluation", r, 200 if r in ("analyst", "admin") else 403))
        m.append(("POST", "/api/v1/exceptions/FND-EXC-IL-000001/triage", r, 201 if r in ("support_agent", "analyst", "admin") else 403))
        m.append(("GET", "/api/v1/admin/users", r, 200 if r == "admin" else 403))
        m.append(("GET", "/api/v1/debug/health-deep", r, 200 if r == "admin" else 403))
    return m


def main() -> None:
    """PURPOSE: Run full endpoint smoke test matrix and print formatted results table.
    INPUT: None
    RETURNS: None
    ERRORS: exits with code 1 on failure
    """
    matrix = get_test_matrix()
    print("\n" + "=" * 90)
    print(f"{'METHOD':<7} | {'PATH':<35} | {'ROLE':<13} | {'DIRECT':<12} | {'VIA PROXY':<12} | RESULT")
    print("-" * 90)
    failed = 0
    for method, path, role, expected in matrix:
        ok, s_dir, s_pxy = evaluate_endpoint(method, path, role, expected)
        res_str = "\033[32mPASS\033[0m" if ok else "\033[31mFAIL\033[0m"
        role_label = role or "(anon)"
        print(f"{method:<7} | {path:<35} | {role_label:<13} | {s_dir:<12} | {s_pxy:<12} | {res_str}")
        if not ok:
            failed += 1
    print("=" * 90)
    if failed > 0:
        print(f"\033[31m[-] Smoke test failed: {failed} endpoint checks failed.\033[0m\n")
        sys.exit(1)
    print(f"\033[32m[+] Smoke test passed: all {len(matrix)} endpoint checks succeeded directly and via proxy.\033[0m\n")


if __name__ == "__main__":
    main()
