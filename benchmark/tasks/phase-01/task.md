# Phase 01 — Project Bootstrap

## 1. 任务说明

本任务用于在 `benchmark-v0` 基线上创建 AI Video Knowledge Assistant 的最小可运行前后端工程。

Codex 与 Claude 必须接收并执行完全相同的本文件。开始修改前，必须完整阅读项目根目录中的：

- `CODEX.md`
- `PHASES.md`
- `BENCHMARK.md`
- 自己对应的 Agent 入口文件（`AGENTS.md` 或 `CLAUDE.md`）

如本文件与上述项目级规范冲突，以 `CODEX.md` 和 `BENCHMARK.md` 为准；发现冲突时应停止实现并在汇报中明确指出，不得自行扩大需求。

## 2. Phase 目标

交付一个结构清晰、依赖最小、可在本地独立启动和验证的前后端工程骨架：

- 后端使用 FastAPI，提供版本化健康检查接口。
- 后端使用 Pydantic Settings 管理当前阶段所需配置。
- 前端使用 React、TypeScript、Vite 和 React Router。
- 前端能够调用后端健康检查接口，并向用户显示明确的成功、加载或失败状态。
- 后端测试通过，前端生产构建通过。

本 Phase 只建立 Project Bootstrap，不实现任何视频、数据库、Worker 或 AI 业务能力。

## 3. 允许范围

允许创建或修改与本 Phase 直接相关的内容：

- `backend/` 下的最小 FastAPI 应用、配置、API 路由和测试。
- `frontend/` 下的最小 React + TypeScript + Vite 应用、基础路由、API Client 和页面。
- 后端与前端各自必要的依赖声明、锁文件和工具配置。
- 为本 Phase 的本地启动和验证补充必要的 `README.md` 说明。
- 如现有 `.gitignore` 或 `.env.example` 确有缺项，可做最小补充；不得提交真实 Secret。

目录可以根据实际代码量合理简化。不得为了匹配 `CODEX.md` 中的完整推荐目录而创建没有代码用途的空目录、空接口或占位抽象。

## 4. 明确禁止提前实现

本 Phase 禁止实现或引入：

- MySQL、SQLAlchemy、Alembic、数据库实体、Repository 或数据库连接检查。
- Redis、Celery、任何 MQ、分布式任务系统或后台 Worker。
- Video 上传、文件存储、FFmpeg/PyAV、音频提取或 ProcessingTask。
- ASR、LLM、Embedding、Milvus、VectorStore、RAG、Chapter、Chat、Citation 或 Feedback。
- 登录、JWT、OAuth、RBAC、多租户、支付或会员能力。
- Docker Compose、Kubernetes、微服务拆分或为未来 Java 服务提前搭建额外服务。
- Next.js、Redux、Redux Toolkit、Zustand 或其他当前阶段不需要的状态管理框架。
- 与 Bootstrap 无关的重构、Benchmark 规则修改或后续 Phase 的占位实现。

不得修改或删除：

```text
benchmark/tests/hidden/
benchmark/judge/
```

不得通过弱化、删除或篡改测试来获得通过结果。

## 5. 后端要求

### 5.1 技术要求

- Python 3.x。
- FastAPI。
- Pydantic Settings（使用当前兼容的 settings 包/方式）。
- Uvicorn 作为本地 ASGI Server。
- pytest 作为测试框架。
- 应用代码位于 `backend/`，入口位置和启动命令必须清晰记录。

### 5.2 API Contract

必须提供：

```http
GET /api/v1/health
```

要求：

- 返回 HTTP `200`。
- 返回 JSON，且内容能够明确表达服务处于健康状态。
- 路由必须使用 `/api/v1` 前缀，不得只提供未版本化的 `/health` 作为替代。
- Health 检查不得连接或依赖数据库、Redis、第三方 API、文件存储或任何外部服务。
- 在所有非必要环境变量均缺失时，应用仍能导入、启动并响应 Health 请求。

### 5.3 配置与安全

- 使用 Pydantic Settings 集中读取当前阶段真正需要的配置。
- 可提供安全且适合本地开发的非敏感默认值。
- 不得硬编码 API Key、密码、生产 Host、生产 IP 或本机绝对路径。
- `.env` 不得提交；如需要说明配置，只更新 `.env.example`。
- 不得要求配置未来 Phase 的数据库、LLM、ASR、Milvus 等变量后才能启动。

### 5.4 后端测试

至少编写自动化测试验证：

- `GET /api/v1/health` 返回 HTTP `200`。
- 响应为预期 JSON 健康状态。
- 测试执行不需要数据库或外部服务。

## 6. 前端要求

### 6.1 技术要求

- React。
- TypeScript。
- Vite。
- React Router。
- 使用原生 `fetch` 或轻量 Axios 封装访问 API；二选一即可。
- 应用代码位于 `frontend/`。

### 6.2 最小页面与路由

- 使用 React Router 建立至少一个可访问的基础页面路由。
- 页面应能识别应用是 AI Video Knowledge Assistant，但无需制作完整产品 UI。
- 页面加载后调用 `GET /api/v1/health`。
- UI 必须明确区分加载中、连接成功和连接失败状态。
- 后端地址必须可配置，不得把开发机器的绝对地址或生产地址写死在业务组件中。
- 前端只依赖 HTTP API Contract，不得依赖任何 Python 内部类名或未来基础设施细节。

### 6.3 前端工程要求

- 保持页面和样式最小、清晰、可读，不需要引入 UI Component Framework。
- 不得添加当前阶段不需要的全局状态管理。
- 必须提交所选包管理器对应的锁文件。
- `npm run build` 或 `pnpm build` 必须成功；使用哪个包管理器，应与提交的锁文件保持一致。

## 7. 验收标准

以下条件全部满足才可声明 Phase 01 完成：

1. 后端可使用文档中的命令在本地启动。
2. `GET /api/v1/health` 返回 HTTP `200` 和明确的 JSON 健康状态。
3. 后端在没有数据库、Redis、外部 API 和非必要环境变量的情况下仍能启动。
4. 后端 pytest 测试全部通过，且包含 Health API 的公开测试。
5. 前端可使用文档中的命令在本地启动。
6. 至少一个 React Router 页面可在浏览器访问。
7. 前端实际调用 `/api/v1/health`，能够展示加载、成功与失败状态。
8. 前端生产构建成功。
9. 未提交真实 Secret、生成物、依赖目录或本机绝对路径。
10. 未实现任何后续 Phase 功能，未引入 Redis、MQ、Next.js、数据库或其他无关大型依赖。
11. 实现符合 KISS、高内聚、低耦合和不过度设计原则。
12. 所有实际执行的验证及其结果均在完成汇报中如实列出。

## 8. Agent 自测命令

Agent 应根据自己创建的依赖声明使用等价命令完成安装与验证。以下为最低要求；若实际入口不同，可调整路径，但必须在最终汇报中给出可复制的准确命令。

### 8.1 Backend

```bash
cd backend
pytest
python -m compileall app
```

启动示例：

```bash
cd backend
uvicorn app.main:app --reload
```

启动后验证：

```bash
curl -i http://127.0.0.1:8000/api/v1/health
```

### 8.2 Frontend

使用提交的锁文件对应的包管理器，只选择一组：

```bash
cd frontend
pnpm install
pnpm build
pnpm dev
```

或：

```bash
cd frontend
npm install
npm run build
npm run dev
```

### 8.3 联通验证

同时启动前后端后，使用浏览器访问 Vite 输出的本地地址，确认页面能够从加载状态进入后端连接成功状态。

如果环境限制导致某项命令无法执行，禁止声称其已通过；必须保留错误输出摘要并在最终汇报中说明限制。

## 9. 完成汇报格式

最终回复必须使用简体中文，并严格包含以下内容：

```markdown
# Phase 01 完成汇报

## 完成状态
- Status: COMPLETED / PARTIAL / FAILED

## 实现摘要
- 后端：
- 前端：
- API 联通：

## 修改文件
- `path/to/file`: 修改目的

## API Contract
- `GET /api/v1/health`: 实际状态码与响应示例

## Agent Self Test
- `实际执行的命令`: PASSED / FAILED / NOT RUN
- 结果摘要：

## 范围与规范检查
- 是否实现后续 Phase 内容：否 / 是（说明）
- 是否新增大型依赖：否 / 是（说明原因）
- 是否修改 Judge / Hidden Tests：否 / 是（说明）
- 是否存在 CODEX.md 违规：否 / 是（说明）

## 未完成事项与已知问题
- 无 / 逐项列出

## Git 建议
- 建议 Commit Message: `feat(phase-01): bootstrap project`
```

只汇报真实完成和真实执行的内容。不得把“代码看起来应该能运行”写成“测试已通过”，也不得代替 Benchmark Judge 填写 Token、费用、最终评分或 Judge Hidden Tests 结果。

## 10. Benchmark 观察重点

Judge 将重点观察：

- 项目结构是否清晰且适合后续增量开发。
- Agent 是否主动完成测试、构建和真实联通验证。
- API 版本化与配置外置是否正确。
- 缺少非必要环境变量时是否仍可启动。
- Health 是否错误依赖未来基础设施。
- 是否擅自引入 Redis、MQ、Next.js、数据库或复杂状态管理。
- 是否创建大量空目录、形式主义接口或无必要设计模式。
- 是否出现 Scope Drift、Overengineering 或 Integrity Violation。

本任务结束后停止，不得继续 Phase 02。
