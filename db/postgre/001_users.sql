-- PostgreSQL 本地测试数据（单表）
-- 结构与 backend/tests 中 metadata / NL→SQL 用例里的 public.users 概念对齐：
--   - test_metadata.py: users(id, email) + PK/UNIQUE
--   - test_nl2sql.py sample_metadata: users(id, name, email, …)
--
-- 使用方式见同目录 README.md

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

INSERT INTO public.users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com'),
    ('Carol', 'carol@example.com')
ON CONFLICT (email) DO NOTHING;
