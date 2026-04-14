"""Add db_type to databaseconnections.

Revision ID: 002
Revises: 001
Create Date: 2026-04-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "databaseconnections",
        sa.Column(
            "db_type",
            sa.String(length=20),
            nullable=False,
            server_default="postgresql",
        ),
    )


def downgrade() -> None:
    with op.batch_alter_table("databaseconnections") as batch_op:
        batch_op.drop_column("db_type")
