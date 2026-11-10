"""PURPOSE: System diagnostic doctor CLI verifying environment, database, security, and services.
INPUT: None (reads from environment and local services)
RETURNS: int exit code (0 on success, 1 on core failure)
ERRORS: prints failure hints to stderr
"""

import os
import sys
from pathlib import Path

import psycopg2
import requests
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "pipeline" / "src"))
from pipeline.db.connection import get_connection

load_dotenv()
CORE_ENVS = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"]


def check_env_vars() -> tuple[bool, str]:
    """PURPOSE: Validate required environment variable names are populated.
    INPUT: None
    RETURNS: tuple[bool, str] (status, diagnostic detail)
    ERRORS: none
    """
    missing = [k for k in CORE_ENVS if not os.getenv(k)]
    if missing:
        return False, f"Missing required env vars: {', '.join(missing)}"
    return True, f"All {len(CORE_ENVS)} core env vars configured"


def check_database() -> tuple[bool, str]:
    """PURPOSE: Verify database connectivity, migration versions, and security restrictions.
    INPUT: None
    RETURNS: tuple[bool, str] (status, diagnostic detail)
    ERRORS: catches psycopg2.Error or OSError
    """
    try:
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM o2c.migrations")
            m_count = cur.fetchone()[0]
            cur.execute("SELECT count(*) FROM o2c.quote")
            q_count = cur.fetchone()[0]
            cur.execute("SELECT has_table_privilege('anon', 'o2c.quote', 'SELECT')")
            anon_leak = cur.fetchone()[0]
            if m_count < 12 or q_count < 10000 or anon_leak:
                return False, f"migrations={m_count}/12 quotes={q_count}/10000 anon_read={anon_leak}"
            return True, f"DB reachable (migrations={m_count}, quotes={q_count}, anon_isolated=True)"
    except (psycopg2.Error, OSError) as exc:
        return False, f"DB check failed: {exc}"


def check_http_endpoint(name: str, url: str) -> tuple[bool, str]:
    """PURPOSE: Verify reachability of an HTTP service.
    INPUT: name: str, url: str
    RETURNS: tuple[bool, str] (status, diagnostic detail)
    ERRORS: catches requests.RequestException or OSError
    """
    try:
        resp = requests.get(url, timeout=3)
        if resp.status_code in (200, 304):
            return True, f"{name} is UP at {url} (HTTP {resp.status_code})"
        return False, f"{name} returned HTTP {resp.status_code}"
    except (requests.RequestException, OSError):
        return False, f"{name} is unreachable at {url} (is dev server started?)"


def run_all_checks() -> list[tuple[str, bool, str]]:
    """PURPOSE: Execute the suite of doctor health checks.
    INPUT: None
    RETURNS: list[tuple[str, bool, str]] (check name, pass/fail, message)
    ERRORS: none
    """
    checks = []
    e_pass, e_msg = check_env_vars()
    checks.append(("Environment Variables", e_pass, e_msg))
    d_pass, d_msg = check_database()
    checks.append(("Database & Security", d_pass, d_msg))
    a_pass, a_msg = check_http_endpoint("API Server", "http://localhost:4000/health")
    checks.append(("API Server (:4000)", a_pass, a_msg))
    f_pass, f_msg = check_http_endpoint("Frontend Dev Server", "http://localhost:5173")
    checks.append(("Frontend Server (:5173)", f_pass, f_msg))
    return checks


def main() -> None:
    """PURPOSE: Main entry point for doctor CLI.
    INPUT: None
    RETURNS: None
    ERRORS: sys.exit(1) on failure
    """
    print("\n" + "=" * 65 + "\n   ORDER-TO-CASH SYSTEM DOCTOR HEALTH CHECK\n" + "=" * 65)
    results = run_all_checks()
    core_failed = False
    for name, ok, msg in results:
        status_tag = "\033[32m[PASS]\033[0m" if ok else "\033[31m[FAIL]\033[0m"
        print(f" {status_tag} {name:<26} -> {msg}")
        if not ok and name in ("Environment Variables", "Database & Security"):
            core_failed = True
    print("=" * 65)
    if core_failed:
        print("\033[31m[-] System diagnostics encountered core errors. Fix above hints.\033[0m\n")
        sys.exit(1)
    print("\033[32m[+] Core system diagnostics healthy.\033[0m\n")


if __name__ == "__main__":
    main()
