"""Create demo users via Supabase Admin API and provision matching o2c.profiles."""

import os
import sys
from pathlib import Path
from typing import Any
import requests
import typer
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "pipeline" / "src"))
from pipeline.db.connection import get_connection

load_dotenv()

ROLES = [
    ("customer", "customer@o2c-demo.com", "Customer Demo User"),
    ("sales_ops", "sales_ops@o2c-demo.com", "Sales Ops Demo User"),
    ("support_agent", "support@o2c-demo.com", "Support Agent Demo User"),
    ("analyst", "analyst@o2c-demo.com", "Analyst Demo User"),
    ("admin", "admin@o2c-demo.com", "Admin Demo User"),
]


def get_existing_auth_users(supabase_url: str, service_key: str) -> dict[str, str]:
    """PURPOSE: Retrieve existing auth users by email mapping to user ID.
    INPUT: supabase_url: str, service_key: str
    RETURNS: dict[str, str] (email -> user_id)
    ERRORS: raises requests.RequestException on network failure
    """
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
    resp = requests.get(f"{supabase_url}/auth/v1/admin/users", headers=headers, timeout=15)
    resp.raise_for_status()
    return {u["email"].lower(): u["id"] for u in resp.json().get("users", [])}


def _provision_user_sql(conn: Any, email: str) -> str:
    """PURPOSE: Insert or fetch user UUID directly from auth.users table.
    INPUT: conn: connection, email: str
    RETURNS: str (UUID)
    ERRORS: raises psycopg2.DatabaseError
    """
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM auth.users WHERE LOWER(email) = LOWER(%s);", (email.lower(),))
        row = cur.fetchone()
        if row:
            return str(row[0])
        import uuid

        user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email.lower()))
        sql = "INSERT INTO auth.users (id, email, created_at) VALUES (%s, %s, now()) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email RETURNING id;"
        cur.execute(sql, (user_id, email.lower()))
        res = cur.fetchone()
    conn.commit()
    return str(res[0]) if res else user_id


def create_or_get_user(supabase_url: str, service_key: str, email: str, password: str, conn: Any = None) -> str:
    """PURPOSE: Create user via Supabase Auth Admin API or fallback to direct SQL if offline.
    INPUT: supabase_url: str, service_key: str, email: str, password: str, conn: Any = None
    RETURNS: str (UUID of user)
    ERRORS: raises requests.RequestException on failure when no db conn
    """
    try:
        existing = get_existing_auth_users(supabase_url, service_key)
        headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
        if email.lower() in existing:
            user_id = existing[email.lower()]
            requests.put(f"{supabase_url}/auth/v1/admin/users/{user_id}", headers=headers, json={"password": password, "email_confirm": True}, timeout=5)
            return user_id
        resp = requests.post(f"{supabase_url}/auth/v1/admin/users", headers=headers, json={"email": email, "password": password, "email_confirm": True}, timeout=5)
        resp.raise_for_status()
        return resp.json()["id"]
    except requests.RequestException:
        if conn is not None:
            return _provision_user_sql(conn, email)
        raise


def upsert_profile(conn: Any, user_id: str, role: str, full_name: str, email: str) -> None:
    """PURPOSE: Upsert profile row into o2c.profiles for user.
    INPUT: conn: connection, user_id: str, role: str, full_name: str, email: str
    RETURNS: None
    ERRORS: raises psycopg2.DatabaseError
    """
    account_id = None
    with conn.cursor() as cur:
        if role == "customer":
            cur.execute("SELECT 1 FROM o2c.account WHERE account_id = 'ACC-000001';")
            if cur.fetchone():
                account_id = "ACC-000001"
        cur.execute(
            """
            INSERT INTO o2c.profiles (id, role, full_name, email, account_id, updated_at)
            VALUES (%s, %s, %s, %s, %s, timezone('utc', now()))
            ON CONFLICT (id) DO UPDATE SET
                role = EXCLUDED.role,
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                account_id = EXCLUDED.account_id,
                updated_at = timezone('utc', now());
            """,
            (user_id, role, full_name, email, account_id),
        )
    conn.commit()


def main(
    email: str | None = None,
    password: str | None = None,
    role: str = "analyst",
    name: str = "Custom User",
) -> None:
    """PURPOSE: CLI entry point to provision all demo users or create custom account.
    INPUT: Optional CLI options for email, password, role, name
    RETURNS: None
    ERRORS: raises ValueError if env missing
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    default_pwd = os.getenv("DEMO_USER_PASSWORD")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

    conn = get_connection()
    try:
        if email and password:
            user_id = create_or_get_user(url, key, email, password, conn)
            upsert_profile(conn, user_id, role, name, email)
            typer.echo(f"  [USER CREATED/UPDATED] email={email} role={role} id={user_id}")
            return

        if not default_pwd:
            raise ValueError("DEMO_USER_PASSWORD must be configured in .env for demo provisioning")

        typer.echo("--> Provisioning default demo users across roles...")
        for r, em, nm in ROLES:
            user_id = create_or_get_user(url, key, em, default_pwd, conn)
            upsert_profile(conn, user_id, r, nm, em)
            typer.echo(f"  [USER] Provisioned: role={r:<14} email={em} id={user_id}")
        typer.echo("--> All demo users provisioned successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    typer.run(main)
