# PostgreSQL 测试库说明

本目录提供**一张表**的建表与示例数据，便于在 **Database Query Tool** 里连接 PostgreSQL 做联调（元数据拉取、手写 SQL、自然语言生成 SQL 等）。表设计参考了 `backend/tests/unit/test_metadata.py`、`backend/tests/unit/test_nl2sql.py` 中出现的 `public.users` 形态（主键 `id`、业务字段 `name`、唯一 `email`）。

## 添加连接前：升级本地元数据库（SQLite）

应用在 `~/.db_query/db_query.db`（或 `DB_QUERY_DATA_DIR`）里用 SQLite 保存连接配置。若后端日志出现 **`no such column: databaseconnections.db_type`**，说明元数据库 schema 偏旧，与当前代码不一致。

在 **`backend/`** 目录执行（与仓库根目录 `make db-upgrade` 等价）：

```bash
uv run python -m alembic upgrade head
```

迁移会补上 `databaseconnections.db_type` 等变更。执行后**重启** uvicorn，再在侧边栏添加 PostgreSQL 连接。

若从未用过 Alembic、且 `alembic upgrade` 与「表已存在」冲突，可备份后删除元数据库文件再执行一次 `make setup`，或查阅 `backend/alembic/versions/` 中的迁移手工执行 SQL。

## 数据库与连接

1. 本仓库**不**自动创建 PostgreSQL 实例；需本机已安装并启动 PostgreSQL，或使用 Docker 等自行提供服务。
2. 先创建空库（名称自定，示例为 `db_query_dev`）：

   ```sql
   CREATE DATABASE db_query_dev;
   ```

3. 执行初始化脚本（按你的主机、端口、用户替换连接参数）：

   ```bash
   psql -h localhost -p 5432 -U postgres -d db_query_dev -f 001_users.sql
   ```

4. 在本应用侧边栏「Add Database」中添加连接，URL 示例：

   ```text
   postgresql://postgres:你的密码@localhost:5432/db_query_dev
   ```

   若本机添加连接时报 **Connection test failed**（Windows 上常见），可把 `localhost` 改成 **`127.0.0.1`**；后端也会自动把 `localhost` / `[::1]` 规范为 `127.0.0.1` 再连库。

   保存后点击刷新元数据，应能看到 **public.users** 及列 **id / name / email**。

## 表：public.users

| 列名 | 类型                 | 说明 |
|--------|----------------------|------|
| id     | `integer` (SERIAL)   | 主键，自增 |
| name   | `varchar(100)`       | 用户显示名，非空 |
| email  | `varchar(255)`       | 邮箱，非空且唯一 |

示例行：Alice / Bob / Carol三条记录，可用于 `SELECT * FROM public.users LIMIT 100` 等查询。

## 与测试用例的对应关系

- `test_metadata.py` 里对 `extract_postgres_metadata` 的 mock 使用 `public.users`、`public.orders` 等；本目录仅落地 **users** 单表，列集为测试里 **users** 常见字段的超集（含 `name`，与 `test_nl2sql.py` 的 sample元数据一致）。
- 单元测试本身仍使用 mock，不依赖本目录；本目录仅供**人工 / 集成**验证。

## 文件

| 文件 | 说明 |
|------|------|
| `001_users.sql` | 建表 + 种子数据 |
| `README.md` | 本说明 |
