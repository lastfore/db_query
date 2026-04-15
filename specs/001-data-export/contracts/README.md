# Contracts: Data Export

No API contract changes are required for this feature.

All export functionality is implemented client-side in the browser. The existing backend API endpoints are consumed unchanged:

- `POST /api/v1/dbs/{name}/query` — Execute SQL query (returns QueryResult)
- `POST /api/v1/dbs/{name}/query/natural` — Generate SQL from natural language (returns GeneratedSqlResponse)

No new endpoints, no schema changes, no new request/response models.
