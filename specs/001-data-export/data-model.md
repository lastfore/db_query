# Data Model: Data Export

**Feature**: 001-data-export | **Date**: 2026-04-15

## Overview

No new persistent data entities are introduced. The export feature operates entirely on in-memory data already present in the frontend after query execution. No database schema changes, no migrations, no new backend models.

## Existing Entities (Referenced, Not Modified)

### QueryResult (Frontend: `types/query.ts`)

The primary data structure consumed by the export feature.

| Field | Type | Description |
|-------|------|-------------|
| columns | QueryColumn[] | Column metadata (name, dataType) |
| rows | Record<string, any>[] | Array of row objects (column name → value) |
| rowCount | number | Number of rows returned |
| executionTimeMs | number | Query duration in milliseconds |
| sql | string | The executed SQL statement |

### QueryColumn (Frontend: `types/query.ts`)

| Field | Type | Description |
|-------|------|-------------|
| name | string | Column name |
| dataType | string | Column data type (e.g., "integer", "character varying") |

## Transient State (Frontend Only)

### Export Context

Held in React component state (Home.tsx), not persisted.

| State | Type | Purpose |
|-------|------|---------|
| isNlGenerated | boolean | Tracks whether current SQL was generated from natural language input. Used to conditionally show AI export suggestion. Set `true` on NL generation, reset `false` on manual SQL edit. |
| showExportSuggestion | boolean | Controls visibility of the AI export suggestion component. Set `true` when NL-generated query returns results, `false` when dismissed or new query starts. |

## Data Transformations

### CSV Export Transform

```
Input:  QueryResult { columns, rows }
Output: UTF-8 text file with BOM

Rules:
- Header row: column names joined by commas
- Data rows: values joined by commas
- NULL values → empty field (no text between delimiters)
- Strings containing commas, quotes, or newlines → wrapped in double quotes
- Double quotes within values → escaped as ""
- BOM (\uFEFF) prepended for Excel compatibility
```

### JSON Export Transform

```
Input:  QueryResult { columns, rows }
Output: UTF-8 JSON file

Rules:
- Output: JSON array of objects
- Keys: column names from QueryResult.columns
- NULL values → JSON null (not string "null", not omitted)
- Numbers, booleans: preserved as native JSON types
- Strings: properly escaped per JSON spec
- Pretty-printed with 2-space indentation
```

## Filename Convention

```
Pattern: {databaseName}_{YYYYMMDD}_{HHMMSS}.{ext}
Example: my_postgres_20260415_143022.csv
Example: my_postgres_20260415_143022.json
```

Components:
- `databaseName`: Active database connection name (from sidebar selection)
- Timestamp: Local time at export moment
- Extension: `.csv` or `.json` per selected format
