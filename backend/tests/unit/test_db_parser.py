"""Tests for database URL helpers."""

from app.utils.db_parser import detect_database_type, postgresql_url_for_asyncpg
from app.models.database import DatabaseType


def test_detect_database_type_postgresql():
    assert detect_database_type("postgresql://u:p@h/db") == DatabaseType.POSTGRESQL
    assert detect_database_type("postgres://u:p@h/db") == DatabaseType.POSTGRESQL


def test_postgresql_url_for_asyncpg_rewrites_localhost():
    u = "postgresql://postgres:secret@localhost:5432/mydb"
    assert postgresql_url_for_asyncpg(u) == "postgresql://postgres:secret@127.0.0.1:5432/mydb"


def test_postgresql_url_for_asyncpg_rewrites_ipv6_loopback():
    u = "postgresql://user:pass@[::1]:5432/db"
    assert postgresql_url_for_asyncpg(u) == "postgresql://user:pass@127.0.0.1:5432/db"


def test_postgresql_url_for_asyncpg_preserves_other_hosts():
    u = "postgresql://u:p@db.example.com:5432/db"
    assert postgresql_url_for_asyncpg(u) is u


def test_postgresql_url_for_asyncpg_leaves_mysql():
    u = "mysql://u:p@localhost:3306/db"
    assert postgresql_url_for_asyncpg(u) is u
