# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Database Query Tool** - A full-stack web application for managing PostgreSQL and MySQL database connections, exploring metadata, and executing SQL queries with natural language support.

- **Backend**: FastAPI (Python 3.12+) with async support
- **Frontend**: React 18 with TypeScript, using Refine framework
- **Metadata Storage**: SQLite (~/.db_query/db_query.db) for connection configurations
- **Target Databases**: PostgreSQL and MySQL (via configurable adapters)
- **Design System**: MotherDuck design (Sunbeam Yellow #FFDE00, uppercase labels, 2px black borders)

## Architecture Overview

### Backend Architecture (FastAPI + Python)

```
backend/
├── app/
│   ├── main.py                 # FastAPI app initialization, CORS, router registration
│   ├── config.py               # Settings with Pydantic (loads .env)
│   ├── database.py             # SQLite session management & init_db()
│   ├── adapters/               # Database-specific connection adapters
│   │   ├── base.py             # Abstract BaseAdapter class
│   │   ├── postgresql.py       # PostgreSQL adapter (asyncpg)
│   │   ├── mysql.py            # MySQL adapter (aiomysql)
│   │   └── registry.py         # Adapter factory by database type
│   ├── models/
│   │   ├── database.py         # SQLModel for DatabaseConnection table
│   │   ├── query.py            # QueryHistory model, QuerySource enum
│   │   ├── metadata.py         # Column, Table, Database metadata models
│   │   └── schemas.py          # Pydantic schemas with camelCase aliases
│   ├── api/v1/
│   │   ├── databases.py        # Endpoints for managing connections (CRUD)
│   │   └── queries.py          # Endpoints for executing queries & NL→SQL
│   └── services/
│       ├── connection_factory.py      # Create connections via adapters
│       ├── database_service.py        # CRUD for DatabaseConnection
│       ├── db_connection.py           # Connection pool management
│       ├── query.py                   # Query execution & history
│       ├── query_wrapper.py           # Wraps execution with service dispatch
│       ├── metadata.py                # Extract table/column metadata
│       ├── nl2sql.py                  # Natural language → SQL (OpenAI)
│       ├── mysql_*.py                 # MySQL-specific query/metadata services
│       ├── sql_validator.py           # Validates SQL before execution
│       └── utils/db_parser.py         # Parse connection strings
├── alembic/                    # Database schema migrations
└── tests/                      # Pytest test files

Key files:
- app/main.py:          Entry point, CORS configuration
- app/config.py:        Settings (OPENAI_API_KEY required in .env)
- app/database.py:      Session management (SQLite for metadata)
- app/services/:        Core business logic (query execution, metadata extraction)
```

**Data Flow:**
1. Client sends SQL query → FastAPI endpoint receives request
2. Query validation & execution via appropriate adapter (PostgreSQL/MySQL)
3. Result columns & rows extracted, formatted with camelCase aliases
4. Query logged to SQLite history table
5. JSON response returned to frontend

**Database Adapters:**
- Detect database type from connection URL (postgresql://, mysql://)
- Each adapter handles dialect-specific queries (metadata extraction, execution)
- Connection pooling per database type (configurable pool size)
- Metadata cached for 24 hours (configurable via config)

### Frontend Architecture (React + TypeScript)

```
frontend/
├── src/
│   ├── main.tsx                # React entry point, Refine setup
│   ├── App.tsx                 # Main app layout component
│   ├── pages/
│   │   ├── Home.tsx            # Query execution page (3-column layout)
│   │   ├── databases/
│   │   │   ├── list.tsx        # Database connection list
│   │   │   ├── create.tsx       # Add new connection form
│   │   │   └── show.tsx         # View/edit connection details
│   │   └── queries/
│   │       └── execute.tsx      # Query execution (handled in Home.tsx)
│   ├── components/
│   │   ├── DatabaseSidebar.tsx          # Left sidebar - connection selector
│   │   ├── MetadataTree.tsx             # Tree view - tables/columns
│   │   ├── SqlEditor.tsx                # Monaco editor for SQL
│   │   ├── NaturalLanguageInput.tsx     # TextArea + GENERATE SQL button
│   │   └── ResultTable.tsx              # Results display with export buttons
│   ├── services/
│   │   ├── api.ts              # Axios instance & API base URL
│   │   └── databaseProvider.ts  # Database-related API calls
│   ├── types/
│   │   ├── database.ts         # DatabaseConnection, DatabaseMetadata types
│   │   ├── metadata.ts         # Table, Column, Metadata types
│   │   └── query.ts            # QueryResult, QueryHistory types
│   └── vite-env.d.ts           # Vite environment variable types

Key components:
- Home.tsx:                    Main page with tabs (MANUAL SQL / NATURAL LANGUAGE)
- DatabaseSidebar.tsx:         Connection selector & status
- MetadataTree.tsx:            Tables, views, columns browser
- SqlEditor.tsx:               Monaco editor (syntax highlighting, themes)
- NaturalLanguageInput.tsx:    Multi-line prompt input with GENERATE SQL button
- ResultTable.tsx:             Paginated results with CSV/JSON export
```

**Refine Framework Integration:**
- Uses Refine as headless React admin framework
- Ant Design components for UI (Tabs, Modal, Alert, Table, etc.)
- React Router for navigation (databases list → database show → query execute)
- API integration via SimpleRest data provider (automatic CRUD mappings)
- Tailwind CSS for styling with custom MotherDuck design tokens

## Development Workflow

### Initial Setup

```bash
# Install all dependencies
make install

# Run database migrations & setup
make setup
# Then edit backend/.env and add OPENAI_API_KEY

# Start both servers
make dev
```

Open http://localhost:5173 in browser

### Common Commands

**Makefile targets** (all defined in root Makefile):

```bash
# Server management
make dev                   # Start both backend & frontend
make dev-backend          # Backend only (http://localhost:8000)
make dev-frontend         # Frontend only (http://localhost:5173)

# Testing
make test                 # Run all tests
make test-backend         # pytest on backend/
make test-backend-coverage # With coverage report (htmlcov/)
make test-frontend        # Vitest on frontend

# Code quality
make lint                 # Lint both backend & frontend
make format               # Auto-format code
make check                # Lint + test (quick validation)
make ci                   # Install + lint + test (full CI)

# Backend specific
make backend-shell        # IPython REPL with app context
make backend-check        # mypy + ruff checks

# Frontend specific
make frontend-build       # Production build
make frontend-preview     # Preview production build

# Database management
make db-upgrade           # Apply pending migrations
make db-migrate MESSAGE="description"  # Create new migration
make db-downgrade REVISION=previous    # Rollback migration
make db-history           # Show migration history
make db-current           # Show current schema revision
make clean-db             # Delete SQLite metadata database (WARNING!)

# Utilities
make health               # Check if backend is running
make docs                 # Open API docs (http://localhost:8000/docs)
make clean                # Clean build artifacts
make update-backend       # Upgrade Python dependencies
make update-frontend      # Upgrade npm dependencies
```

### Backend Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_queries.py -v

# Run with coverage
pytest --cov=app --cov-report=html

# Run async tests with pytest-asyncio
pytest tests/test_async.py -v
```

### Frontend Testing

```bash
# Run Vitest
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### Code Style

**Backend (Python):**
- Ruff for linting (100 char line length)
- mypy for type checking (strict mode)
- Target: Python 3.12

```bash
make lint-backend       # Run ruff check
make format-backend     # Auto-format with ruff
make backend-check      # mypy + ruff
```

**Frontend (TypeScript):**
- ESLint with TypeScript support
- TypeScript strict mode (tsconfig.json)
- Tailwind CSS for styling

```bash
make lint-frontend      # ESLint check
make format-frontend    # ESLint --fix
```

## Important Concepts & Patterns

### API Conventions

**camelCase Aliases:**
All Pydantic schemas use `alias` for camelCase in JSON while keeping snake_case in Python:

```python
class QueryResult(BaseModel):
    row_count: int = Field(..., alias="rowCount")
    execution_time_ms: int = Field(..., alias="executionTimeMs")
    sql: str
```

**Response Format:** API always returns camelCase keys:
```json
{
  "columns": [{"name": "id", "dataType": "integer"}],
  "rows": [{"id": 1}],
  "rowCount": 1,
  "executionTimeMs": 45,
  "sql": "SELECT * FROM table"
}
```

### Database Connections

**Connection URL Format:**
- PostgreSQL: `postgresql://user:password@host:5432/dbname`
- MySQL: `mysql://user:password@host:3306/dbname`

**Adapter System:**
- Database type auto-detected from URL scheme
- Adapters implement `BaseAdapter` with async methods
- Connection pooling managed per database type
- Adapters: PostgreSQL (asyncpg), MySQL (aiomysql)

### Query Execution Flow

1. **Validation**: SQL validated (SELECT only, no dangerous operations)
2. **Execution**: Routed to appropriate adapter based on database type
3. **Metadata Extraction**: Column names & types from result set
4. **History Logging**: Query logged to SQLite with execution time & row count
5. **Response**: QueryResult formatted with camelCase aliases

### Natural Language to SQL

**Service:** `app/services/nl2sql.py`
- Uses OpenAI API (GPT model, requires OPENAI_API_KEY in .env)
- Takes user prompt + database metadata + schema context
- Returns generated SQL + explanation
- Cached metadata reduces API calls

**Endpoint:** `POST /api/v1/dbs/{database}/query/natural`
```json
{
  "prompt": "Show me all customers from 2024"
}
```

**Response:**
```json
{
  "sql": "SELECT * FROM customers WHERE year(created_at) = 2024",
  "explanation": "Query generated from: ..."
}
```

### Metadata Caching

- Database schema cached in memory for 24 hours
- Cache invalidation: automatic after expiration or manual via API
- Cache key: `{database_name}:{database_type}`
- Reduces API calls to target database for repeated metadata extraction

### Frontend State Management

**React Hooks:**
- `useState` for local component state
- `useEffect` for data fetching & side effects
- `useCallback` for event handlers
- Refine's built-in data hooks (useList, useShow, useCreate, etc.)

**API Calls:**
- Axios with Refine's SimpleRest provider
- Base URL from .env.local: `VITE_API_URL` (default: http://localhost:8000)
- Automatic error handling & loading states

## Key Files by Purpose

### Adding New Query Features

**Files to modify:**
1. `backend/app/services/query.py` - Add query execution logic
2. `backend/app/api/v1/queries.py` - Add endpoint
3. `backend/app/models/schemas.py` - Add request/response schemas
4. `frontend/src/services/api.ts` - Add API call
5. `frontend/src/pages/Home.tsx` - Add UI for feature

### Modifying Database Support

**Files to modify:**
1. `backend/app/adapters/` - Create new adapter (e.g., `sqlite.py`)
2. `backend/app/adapters/registry.py` - Register adapter in factory
3. `backend/app/services/metadata.py` - Add metadata extraction for new DB
4. `backend/app/services/mysql_*.py` - Add query execution for new DB
5. `backend/app/utils/db_parser.py` - Parse connection URLs for new DB

### Modifying API Contracts

**Always update both:**
1. `backend/app/models/schemas.py` - Pydantic schema (includes camelCase aliases)
2. `frontend/src/types/*.ts` - TypeScript type definitions (match Pydantic models)

## Configuration

### Backend Environment (.env)

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
LOG_LEVEL=INFO
CORS_ORIGINS=*
QUERY_DEFAULT_LIMIT=1000
QUERY_HISTORY_RETENTION=50
DB_POOL_MIN_SIZE=1
DB_POOL_MAX_SIZE=5
DB_POOL_COMMAND_TIMEOUT=60
METADATA_CACHE_HOURS=24
DB_QUERY_DATA_DIR=~/.db_query
```

### Frontend Environment (.env.local)

```bash
# Optional (default: http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

## Database Schema (SQLite Metadata)

**Table: database_connection**
- `name` (PK): Connection identifier
- `url`: Database connection string
- `db_type`: 'postgresql' or 'mysql'
- `description`: User notes
- `created_at`, `updated_at`, `last_connected_at`: Timestamps
- `status`: 'connected', 'error', or 'unknown'

**Table: query_history**
- `id` (PK): Auto-increment
- `database_name` (FK): References database_connection.name
- `sql_text`: The executed SQL
- `executed_at`: Execution timestamp
- `execution_time_ms`: Duration in milliseconds
- `row_count`: Rows returned
- `success`: Boolean (successful vs error)
- `error_message`: If failed, error details
- `query_source`: 'manual' or 'natural_language'

## Testing Strategy

### Backend Tests
- `tests/test_queries.py` - Query execution with different database types
- `tests/test_databases.py` - Connection management CRUD
- `tests/test_metadata.py` - Schema extraction from different DBs
- Use fixtures for test databases (typically SQLite in-memory)

### Frontend Tests
- `src/**/*.test.tsx` - Component unit tests with React Testing Library
- `src/**/*.spec.tsx` - Integration tests with Vitest
- Mock API calls with axios mock adapter

## Known Limitations & Gotchas

1. **NL→SQL Costs**: OpenAI API calls have usage costs; metadata extraction via database queries is free.
2. **Query Limits**: Default result limit is 1000 rows (configurable). Larger results may timeout.
3. **Export Size**: CSV/JSON exports happen entirely in browser memory; very large result sets may crash.
4. **Connection Pool**: Multiple simultaneous queries from different connections may exhaust pool (max 5 by default).
5. **Metadata Cache**: Schema changes in target database aren't reflected until cache expires (24 hours).
6. **SQL Validation**: Only SELECT queries supported; other operations blocked server-side.
7. **Browser CORS**: Frontend must be served from origin matching backend CORS setting.

## Design System

**MotherDuck Design Tokens:**
- Primary Color: Sunbeam Yellow (#FFDE00)
- Border: 2px solid black (#000000)
- Background: White (#FFFFFF) for cards
- Page Background: Beige (#F4EFEA)
- Typography: Uppercase labels, bold (700), letter spacing 0.04em
- Layout: 3-column (sidebar, metadata tree, editor+results)

Apply consistently when adding UI features.

## Performance Notes

1. **Metadata Caching**: Reduces redundant database queries; 24-hour TTL.
2. **Connection Pooling**: Async connection reuse prevents exhaustion.
3. **Query Timeout**: 60-second limit on execution (configurable).
4. **Frontend Bundling**: Vite with React, Refine, Ant Design (~1.07MB gzipped).
5. **API Response Size**: Large result sets streamed in single response (consider pagination for 10k+ rows).

## Deployment Considerations

- **Backend**: uvicorn with gunicorn for production
- **Frontend**: Static build output served via nginx/CDN
- **SQLite Database**: Stored in `~/.db_query/db_query.db`; ensure persistent volume
- **Environment**: Backend requires OPENAI_API_KEY in production
- **CORS**: Set CORS_ORIGINS to frontend domain in production
- **Connection Credentials**: Stored in SQLite (consider encryption at rest)
