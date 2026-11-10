"""Database connection utilities using psycopg2."""

import os
import urllib.parse

import psycopg2
from dotenv import load_dotenv
from psycopg2.extensions import connection as PgConnection

load_dotenv()


def get_connection(database_url: str | None = None) -> PgConnection:
    """PURPOSE: Open a psycopg2 connection from DATABASE_URL with safe parsing.
    INPUT: database_url: str | None (optional override)
    RETURNS: psycopg2.extensions.connection
    ERRORS: raises ValueError if no URL, psycopg2.OperationalError on failure
    """
    url = database_url or os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL environment variable is not set")
    p = urllib.parse.urlparse(url)
    user = urllib.parse.unquote(p.username or "")
    pwd = urllib.parse.unquote(p.password or "")
    host = p.hostname or "localhost"
    port = p.port or 5432
    dbname = p.path.lstrip("/") or "postgres"
    return psycopg2.connect(dbname=dbname, user=user, password=pwd, host=host, port=port)
