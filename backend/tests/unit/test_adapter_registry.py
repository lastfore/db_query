"""Adapter registry behavior."""

from app.adapters.base import ConnectionConfig
from app.adapters.registry import DatabaseAdapterRegistry
from app.models.database import DatabaseType


def test_create_adapter_each_call_is_fresh_instance():
    """Probes must not reuse get_adapter cache; same name + different URL needs new config."""
    reg = DatabaseAdapterRegistry()
    a1 = reg.create_adapter(
        DatabaseType.POSTGRESQL,
        ConnectionConfig(url="postgresql://h1:5432/db", name="same"),
    )
    a2 = reg.create_adapter(
        DatabaseType.POSTGRESQL,
        ConnectionConfig(url="postgresql://h2:5432/db", name="same"),
    )
    assert a1 is not a2
    assert a1.config.url == "postgresql://h1:5432/db"
    assert a2.config.url == "postgresql://h2:5432/db"


def test_get_adapter_caches_by_name():
    reg = DatabaseAdapterRegistry()
    cfg = ConnectionConfig(url="postgresql://h/db", name="saved_conn")
    x = reg.get_adapter(DatabaseType.POSTGRESQL, cfg)
    y = reg.get_adapter(DatabaseType.POSTGRESQL, cfg)
    assert x is y
