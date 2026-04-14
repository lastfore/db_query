# db-query-backend

数据库查询工具的后端 API（FastAPI）。

## 环境要求

- Python **3.12+**
- 推荐使用 [uv](https://github.com/astral-sh/uv) 管理依赖

## 安装

在项目根目录的 `backend/` 下执行：

```bash
uv sync --extra dev
```

## 本地运行

```bash
uv run python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

在部分 Windows 环境下，`uv run uvicorn` 可能报 `uv trampoline failed to canonicalize script path`，使用上面的 `python -m uvicorn` 形式可避免。

启动后可通过 `http://localhost:8000/docs` 查看 OpenAPI 文档，`GET /health` 用于健康检查。

## 技术栈概要

- FastAPI、Uvicorn
- SQLModel、SQLGlot
- 异步数据库：asyncpg（PostgreSQL）、aiomysql / PyMySQL（MySQL）
- 可选：OpenAI 相关能力（见 `pyproject.toml` 依赖）

## 开发

- 代码检查：`ruff`、`mypy`（具体命令可参考仓库根目录 `Makefile` 中的 `backend-check` 等目标）
- 测试：`pytest`（`tests/`）
