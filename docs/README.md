# Documentation

This folder holds design and architecture notes for the Database Query Tool. It is **not** a second copy of backend setup instructions—use the repository root `README.md` and `backend/README.md` for install and run steps.

## Where to start

| Topic | File |
|--------|------|
| Documentation index (architecture redesign) | [`ARCHITECTURE_INDEX.md`](./ARCHITECTURE_INDEX.md) |
| Executive summary | [`ARCHITECTURE_SUMMARY.md`](./ARCHITECTURE_SUMMARY.md) |
| Full redesign spec | [`ARCHITECTURE_REDESIGN.md`](./ARCHITECTURE_REDESIGN.md) |
| MySQL-related notes | [`MYSQL_SUPPORT.md`](./MYSQL_SUPPORT.md) |
| Export / data export work | [`EXPORT_IMPROVEMENT.md`](./EXPORT_IMPROVEMENT.md) |
| Quick reference | [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) |

## Environment configuration

Natural language → SQL uses `NL2SQL_PROVIDER` (`openai`, `moonshot`, or `deepseek`) and the matching API key. See `backend/.env.example` and root `CLAUDE.md` for the full list of settings (including optional query limits, pool size, and metadata cache TTL).
