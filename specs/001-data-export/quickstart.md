# Quickstart: Data Export Feature

## Prerequisites

```bash
make install   # Install all dependencies
make setup     # Run migrations (if not already done)
```

## Development

```bash
make dev       # Start backend (port 8000) + frontend (port 5173)
```

Open http://localhost:5173 in browser.

## Testing the Feature

### P1: Manual Export (CSV / JSON)

1. Add a database connection (PostgreSQL or MySQL)
2. Select the database from the sidebar
3. Write and execute a SQL query (e.g., `SELECT * FROM users LIMIT 10`)
4. Verify "EXPORT CSV" and "EXPORT JSON" buttons appear in the results area
5. Click "EXPORT CSV" → verify downloaded file:
   - Has UTF-8 BOM (open in hex editor: first 3 bytes are `EF BB BF`)
   - Column headers match result table
   - NULL values are empty fields (not "NULL" string)
   - Special characters properly escaped
6. Click "EXPORT JSON" → verify downloaded file:
   - Valid JSON (parseable by `JSON.parse()` or `jq .`)
   - NULL values are `null` (not `"null"` or omitted)
   - Array of objects with column names as keys
7. Execute a query returning 0 rows → verify export buttons are disabled/hidden with a message

### P2: Execute & Export

1. In the **Manual SQL** tab, write a valid query
2. Click the "EXECUTE & EXPORT" dropdown button
3. Select "Export as CSV" or "Export as JSON"
4. Verify: query executes AND file downloads in one action
5. Test with an invalid query → verify error message, no file download
6. Switch to **Natural Language** tab → verify "EXECUTE & EXPORT" button is NOT visible

### P3: AI Assistant Export Suggestion

1. Switch to the **Natural Language** tab
2. Enter a prompt (e.g., "Show all users created this year")
3. Click "GENERATE SQL" → SQL populates in the editor
4. Execute the generated query
5. Verify: a suggestion message appears: "Need to export these query results to CSV or JSON?"
6. Click CSV or JSON action button → file downloads
7. Verify: suggestion does NOT appear for queries that return 0 rows
8. Verify: suggestion does NOT appear when executing manually typed SQL (not NL-generated)

## Running Tests

```bash
make test-frontend     # Run all Vitest tests
```

## Quality Gates

```bash
make lint              # Lint check (ESLint + Ruff)
make check             # Lint + test
make frontend-build    # Verify production build succeeds + bundle size
```
