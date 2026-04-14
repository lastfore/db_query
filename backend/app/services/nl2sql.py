"""Natural language to SQL via an OpenAI-compatible Chat Completions API."""

from __future__ import annotations

import logging

from openai import AsyncOpenAI

from app.config import NL2SQLProvider, settings
from app.models.database import DatabaseType

logger = logging.getLogger(__name__)


class NaturalLanguageToSQLService:
    """Convert natural language to SQL using a configured LLM provider (OpenAI, Moonshot, DeepSeek)."""

    def __init__(self, client: AsyncOpenAI | None = None) -> None:
        self.provider: NL2SQLProvider = settings.nl2sql_provider
        self.model = self._model_for_provider()
        self._injected_client = client
        self._client: AsyncOpenAI | None = None

    def _model_for_provider(self) -> str:
        if self.provider == "openai":
            return settings.openai_model
        if self.provider == "moonshot":
            return settings.moonshot_model
        return settings.deepseek_model

    def _credentials(self) -> tuple[str, str | None]:
        if self.provider == "openai":
            return (settings.openai_api_key, settings.openai_base_url)
        if self.provider == "moonshot":
            return (settings.moonshot_api_key, settings.moonshot_base_url)
        return (settings.deepseek_api_key, settings.deepseek_base_url)

    @property
    def client(self) -> AsyncOpenAI:
        if self._injected_client is not None:
            return self._injected_client
        if self._client is None:
            self._client = self._build_client()
        return self._client

    def _build_client(self) -> AsyncOpenAI:
        key, base_url = self._credentials()
        trimmed = (key or "").strip()
        if not trimmed:
            raise ValueError(
                "NL→SQL is configured for provider "
                f"'{self.provider}' but the matching API key is empty "
                "(set OPENAI_API_KEY, MOONSHOT_API_KEY, or DEEPSEEK_API_KEY)."
            )
        kwargs: dict = {"api_key": trimmed}
        if base_url:
            kwargs["base_url"] = base_url.rstrip("/")
        if settings.nl2sql_timeout_seconds is not None:
            kwargs["timeout"] = settings.nl2sql_timeout_seconds
        return AsyncOpenAI(**kwargs)

    def _build_prompt(
        self, user_prompt: str, metadata: dict, db_type: DatabaseType = DatabaseType.POSTGRESQL
    ) -> list[dict[str, str]]:
        """Build chat messages with database metadata context."""
        schema_context = []
        for table in metadata.get("tables", []):
            columns_info = []
            for col in table.get("columns", []):
                col_desc = f"  - {col['name']} ({col['dataType']})"
                if col.get("primaryKey"):
                    col_desc += " PRIMARY KEY"
                if not col.get("nullable", True):
                    col_desc += " NOT NULL"
                if col.get("unique"):
                    col_desc += " UNIQUE"
                columns_info.append(col_desc)

            row_count = table.get("rowCount", "unknown")
            table_info = f"Table: {table['schemaName']}.{table['name']} ({row_count} rows)\n"
            table_info += "\n".join(columns_info)
            schema_context.append(table_info)

        for view in metadata.get("views", []):
            columns_info = [f"  - {col['name']} ({col['dataType']})" for col in view.get("columns", [])]
            view_info = f"View: {view['schemaName']}.{view['name']}\n"
            view_info += "\n".join(columns_info)
            schema_context.append(view_info)

        schema_text = "\n\n".join(schema_context)

        if db_type == DatabaseType.MYSQL:
            db_name = "MySQL"
            syntax_rules = """3. Use backticks for identifiers (e.g., `table_name`, `column_name`)
4. Return valid MySQL syntax
5. Use MySQL LIMIT syntax (LIMIT n)
6. Be aware of MySQL-specific features like AUTO_INCREMENT"""
        else:
            db_name = "PostgreSQL"
            syntax_rules = """3. Use proper schema qualification (schema.table)
4. Return valid PostgreSQL syntax
5. Use double quotes for identifiers if needed"""

        system_message = f"""You are an expert SQL query generator for {db_name} databases.

Database Schema:
{schema_text}

Rules:
1. Generate ONLY SELECT queries (no INSERT/UPDATE/DELETE/DROP)
2. Always include LIMIT clause (max 1000 rows)
{syntax_rules}
7. Handle both English and Chinese natural language
8. Be concise - return just the SQL query

Output format:
Return ONLY the SQL query, nothing else. No explanations, no markdown, just the SQL."""

        return [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt},
        ]

    async def generate_sql(
        self, user_prompt: str, metadata: dict, db_type: DatabaseType = DatabaseType.POSTGRESQL
    ) -> dict[str, str]:
        """Convert natural language to SQL query."""
        try:
            messages = self._build_prompt(user_prompt, metadata, db_type)

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,
                max_tokens=settings.nl2sql_max_tokens,
            )

            raw = response.choices[0].message.content
            if raw is None or not str(raw).strip():
                raise ValueError("LLM returned empty content")

            generated_sql = str(raw).strip()

            if generated_sql.startswith("```sql"):
                generated_sql = generated_sql.replace("```sql", "").replace("```", "").strip()
            elif generated_sql.startswith("```"):
                generated_sql = generated_sql.replace("```", "").strip()

            explanation = f"Generated SQL from: {user_prompt}"

            logger.info(
                "Generated SQL (provider=%s, model=%s) for prompt: %s...",
                self.provider,
                self.model,
                user_prompt[:50],
            )

            return {"sql": generated_sql, "explanation": explanation}

        except Exception as e:
            logger.error("Failed to generate SQL (provider=%s): %s", self.provider, str(e))
            raise Exception(f"Failed to generate SQL: {str(e)}") from e


nl2sql_service = NaturalLanguageToSQLService()
