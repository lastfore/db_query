"""Database URL parser utility for detecting database type."""

from urllib.parse import quote, urlparse, urlunparse

from app.models.database import DatabaseType


def detect_database_type(url: str) -> DatabaseType:
    """
    Detect database type from connection URL.

    Args:
        url: Database connection URL (e.g., postgresql://... or mysql://...)

    Returns:
        DatabaseType enum value

    Raises:
        ValueError: If database type cannot be determined or is unsupported
    """
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()

        # Handle common PostgreSQL schemes
        if scheme in ("postgresql", "postgres"):
            return DatabaseType.POSTGRESQL

        # Handle common MySQL schemes
        if scheme in ("mysql", "mysql+pymysql", "mysql+aiomysql"):
            return DatabaseType.MYSQL

        raise ValueError(
            f"Unsupported database type: {scheme}. "
            f"Supported types: postgresql, postgres, mysql"
        )

    except Exception as e:
        raise ValueError(f"Failed to parse database URL: {str(e)}")


def postgresql_url_for_asyncpg(url: str) -> str:
    """Return a DSN suited for asyncpg.

    On Windows, ``localhost`` often resolves to ``::1`` first while PostgreSQL
    listens on ``127.0.0.1`` only, causing connection failures. Rewriting the
    host to ``127.0.0.1`` avoids that without changing the logical URL the user
    stored.
    """
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    if scheme not in ("postgresql", "postgres", "postgresql+asyncpg"):
        return url
    if parsed.hostname not in ("localhost", "::1"):
        return url

    user = quote(parsed.username or "", safe="")
    password = parsed.password
    auth = user
    if password is not None:
        auth += ":" + quote(password, safe="")
    if auth:
        auth += "@"
    port = f":{parsed.port}" if parsed.port else ""
    netloc = f"{auth}127.0.0.1{port}"
    normalized = urlunparse(
        (
            "postgresql",
            netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            parsed.fragment,
        )
    )
    return normalized
