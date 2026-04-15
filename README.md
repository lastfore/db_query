# Database Query Tool

A web-based tool for managing **PostgreSQL and MySQL** connections, browsing schema metadata, and running SQL queries—with optional natural language → SQL generation.

## Project structure

```
db_query/
├── backend/          # FastAPI backend (Python 3.12+)
├── frontend/         # React 18 + TypeScript (Refine / @refinedev/core 5.x, Ant Design)
├── fixtures/         # REST Client test files
│   ├── test.rest
│   └── README.md
├── docs/             # Architecture and feature notes
└── Makefile          # Development commands
```

## Quick start

### Initial setup

```bash
make install
make setup
# Copy backend/.env.example → backend/.env and set NL2SQL_PROVIDER + the matching API key
```

### Run dev servers

`make dev` runs backend and frontend targets in sequence; the backend process does not exit, so **use two terminals** (or run backend in the background yourself):

```bash
# Terminal 1
make dev-backend

# Terminal 2
make dev-frontend
```

Open http://localhost:5173 — API docs at http://localhost:8000/docs.

### Common commands

```bash
make help          # All Makefile targets
make test          # Backend + frontend tests
make lint          # Linters
make format        # Format / fix where applicable
make health        # GET /health (backend must be running)
```

## API testing

### REST Client (VS Code / Cursor)

1. Install [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
2. Open `fixtures/test.rest`
3. Use “Send Request” above each request

See `fixtures/README.md` for details.

## Documentation

- **Repo guide for AI / contributors**: `CLAUDE.md`
- **Architecture and design notes**: `docs/` (start with `docs/ARCHITECTURE_INDEX.md` or `docs/README.md`)
- **Backend (中文)**: `backend/README.md`
