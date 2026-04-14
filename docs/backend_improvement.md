# 规格说明：自然语言 → SQL 模型提供商切换（OpenAI → Kimi / DeepSeek）

## 1. 背景与现状

### 1.1 功能位置

- **服务实现**：`backend/app/services/nl2sql.py` 中的 `NaturalLanguageToSQLService`
- **HTTP 接口**：`POST /api/v1/dbs/{name}/query/natural`（`backend/app/api/v1/queries.py`）
- **配置**：`backend/app/config.py` 中 `openai_api_key`（必填），`.env` / `.env.example` 文档说明

### 1.2 当前行为

- 使用官方 `openai` Python SDK（`AsyncOpenAI`），调用 **Chat Completions** 接口
- 固定模型：`gpt-4o-mini`
- 入参为 `messages`（system + user），与元数据拼装的 schema 上下文、PostgreSQL/MySQL 方言规则与现有业务一致
- 出参解析：取 `choices[0].message.content`，并剥离可能的 Markdown 代码块
- 对外 API 契约不变：`GeneratedSqlResponse`（`sql`、`explanation` 等）保持 camelCase JSON

### 1.3 动机

希望在**不削弱**「中英自然语言 + 元数据上下文 + 仅 SELECT + LIMIT」等约束的前提下，将底层 LLM 从 **OpenAI** 切换为 **Kimi（Moonshot）** 或 **DeepSeek**，以便使用国内 API、定价或合规策略。

---

## 2. 目标（Goals）

| ID | 目标 | 说明 |
|----|------|------|
| G1 | 支持 Kimi 与 DeepSeek | 可通过配置选择其一作为 NL→SQL 的后端，无需改前端 |
| G2 | 保持接口与行为一致 | `generate_sql(...)` 的输入/输出语义、错误对外表现与现网一致（在模型能力允许范围内） |
| G3 | OpenAI 兼容调用路径 | Kimi、DeepSeek 均提供与 OpenAI 兼容的 HTTP API；优先复用 `AsyncOpenAI` + `base_url`，减少重复实现 |
| G4 | 配置清晰、可运维 | API Key、base URL、模型名、可选超时与重试可通过环境变量配置，并有 `.env.example` 说明 |
| G5 | 可测试 | 单元测试继续 mock 同一 client 层或抽象接口，不因换厂商而破坏测试结构 |

---

## 3. 非目标（Non-Goals）

- 不要求同时向多个厂商**并发**请求或做自动 failover（可作为后续迭代）
- 不要求改变 SQL 校验、执行、历史记录等业务流程
- 不要求前端新增「选择模型厂商」UI（首期可由环境变量决定）

---

## 4. 功能需求（Functional Requirements）

### 4.1 提供商枚举与选择

- 引入配置项（名称可调整，以下为建议）：
  - `NL2SQL_PROVIDER`：`openai` | `moonshot` | `deepseek`（默认可设为 `openai` 以保持向后兼容，或项目决定默认改为 `deepseek`/`moonshot` 需在迁移说明中写明）
- 当 `NL2SQL_PROVIDER` 为 `moonshot` 或 `deepseek` 时：
  - 使用对应 **base_url** 与 **api_key**（可与 OpenAI 字段分离，见 §5）

### 4.2 调用语义

- 仍使用 **Chat Completions** 形态：`messages`、`temperature`（建议保持 `0.1`）、`max_tokens`（建议保持或与配置项对齐）
- **System / User 提示词**：与当前 `_build_prompt` 逻辑一致，不随厂商改变业务规则（除非后续单独做 prompt A/B）

### 4.3 响应处理

- 与现实现一致：strip、去除 Markdown 中 `sql` 代码围栏包裹、异常时记录日志并抛出可被 API 层转换为 HTTP 错误的异常
- 若某厂商返回空 `content`，应视为失败并给出明确错误信息（与 OpenAI 行为对齐）

### 4.4 密钥与启动

- 仅当启用 NL→SQL 且对应 provider 被选中时，要求该 provider 的 API Key 非空；避免未使用 NL→SQL 时强制填写所有厂商 Key（若当前应用启动即实例化 service，需评估懒加载或可选依赖）

---

## 5. 配置需求（Configuration）

建议在 `Settings` 中扩展（具体命名以实现为准）：

| 变量 | 用途 | 示例 / 备注 |
|------|------|-------------|
| `NL2SQL_PROVIDER` | 选择厂商 | `openai` / `moonshot` / `deepseek` |
| `OPENAI_API_KEY` | OpenAI | 现有字段保留 |
| `OPENAI_BASE_URL` | 可选 | 默认官方；代理或 Azure 等场景 |
| `MOONSHOT_API_KEY` | Kimi（Moonshot） | 从 Moonshot 控制台获取 |
| `MOONSHOT_BASE_URL` | 可选 | 默认 `https://api.moonshot.cn/v1`（以官方文档为准） |
| `MOONSHOT_MODEL` | 模型 id | 如 `moonshot-v1-8k` 等（以官方当前模型列表为准） |
| `DEEPSEEK_API_KEY` | DeepSeek | 从 DeepSeek 开放平台获取 |
| `DEEPSEEK_BASE_URL` | 可选 | 默认 `https://api.deepseek.com/v1`（以官方文档为准） |
| `DEEPSEEK_MODEL` | 模型 id | 如 `deepseek-chat`（以官方为准） |
| `NL2SQL_TIMEOUT_SECONDS` | 可选 | 统一 LLM 请求超时，避免挂死 |

**说明**：Moonshot / DeepSeek 的默认 base URL 与模型名以实现时**官方文档**为准；本 spec 只约束「可配置、可切换」，不绑定具体模型版本号。

---

## 6. 技术方案要点（Technical Approach）

### 6.1 SDK 复用

- 继续使用 `AsyncOpenAI`，在初始化时传入：
  - `api_key` = 当前 provider 的 key
  - `base_url` = 当前 provider 的 base URL  
- Moonshot 与 DeepSeek 均支持该模式（与 OpenAI 客户端兼容）。

### 6.2 结构建议（可选）

- **方案 A（最小改动）**：在 `NaturalLanguageToSQLService.__init__` 中根据 `NL2SQL_PROVIDER` 分支设置 `client` 与 `model`
- **方案 B（更清晰）**：抽取 `LLMClientFactory` 或 `NL2SQLConfig`，便于单测与后续扩展

首期推荐 **方案 A**，除非单测或依赖注入已难以维护。

### 6.3 依赖

- `pyproject.toml` 中 `openai` 依赖可保留（作为统一 HTTP 客户端）；无需为 Kimi/DeepSeek 单独引入新包，除非后续需要非兼容 API。

---

## 7. 文档与运维

- 更新 `backend/.env.example`：列出各 provider 变量及获取 Key 的文档链接（不写入真实密钥）
- 更新 `CLAUDE.md` / README 中与 `OPENAI_API_KEY` 强绑定的描述，改为「NL→SQL 所需的大模型配置」
- API 文档字符串（如 `queries.py` 中 docstring）将「OpenAI」改为「配置的 LLM 提供商」或列举可选厂商

---

## 8. 测试与验收标准（Acceptance Criteria）

1. **单元测试**：`backend/tests/unit/test_nl2sql.py` 在切换 mock 的 `base_url`/client 后仍通过；或改为 mock 工厂方法，使三个 provider 路径可被覆盖。
2. **集成测试**：`test_api_queries.py` 中 NL 接口仍通过（继续 patch `nl2sql_service.generate_sql` 即可，无需真实 Key）。
3. **手工验收**（需有效 Key）：
   - `NL2SQL_PROVIDER=moonshot`：中文/英文 prompt 均能返回可执行 SELECT（在测试库上）
   - `NL2SQL_PROVIDER=deepseek`：同上
   - `NL2SQL_PROVIDER=openai`：回归现有行为
4. **错误处理**：错误 API Key 或网络失败时，返回与现网一致的错误类别（4xx/5xx 与错误体结构由现有 `queries.py` 行为定义，不随意变更）

---

## 9. 风险与依赖

| 风险 | 缓解 |
|------|------|
| 不同模型对「仅输出 SQL、无解释」遵循度不同 | 保留后处理与 prompt 约束；必要时增加一步「仅提取首条 SQL」的后处理（另立变更） |
| 各厂商速率限制、超时不同 | 可配置 timeout；日志中记录 provider 与 model |
| 默认模型下线或更名 | 模型名全部走配置，不写死在代码中（除合理默认值） |

---

## 10. 里程碑建议

1. **M1**：配置模型 + 工厂/分支初始化 + `.env.example` + 文档
2. **M2**：单测调整 + 三种 provider 手工冒烟
3. **M3**（可选）：前端或管理端展示当前 provider（只读）

---

## 11. 附录：参考端点（实现时以官方为准）

- **Moonshot（Kimi）**：OpenAI 兼容 API，通常 base为 `https://api.moonshot.cn/v1`
- **DeepSeek**：OpenAI 兼容 API，通常 base 为 `https://api.deepseek.com/v1`

实现前应在各自开放平台确认：认证方式、模型列表、是否支持 `stream`、以及与本项目相同的 `chat.completions` 路径。
