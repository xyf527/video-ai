# Phase 02 — Persistence Foundation

## 1. 任务说明

本任务用于在各候选自己的 Phase 01 结果上建立最小、可迁移、可测试的持久化基础设施。

Codex 与 Claude 必须接收并执行完全相同的本文件。开始前必须完整阅读：

- `CODEX.md`
- `PHASES.md`
- `BENCHMARK.md`
- `benchmark/tasks/phase-02.md`
- 自己对应的入口文件（`AGENTS.md` 或 `CLAUDE.md`）

各候选必须延续自己的 Phase 01 实现，不得复制另一候选的目录结构或代码。

## 2. Phase 目标

交付以下最小持久化闭环：

- Async SQLAlchemy 2.x。
- MySQL 8.x 运行配置。
- 集中的异步 Engine 与 Session 管理。
- Alembic 初始化与首个 migration。
- `Video` 最小实体。
- `ProcessingTask` 最小实体。
- 简单、具体的 Repository CRUD。
- 可在不连接数据库时继续响应现有 `/api/v1/health`。
- 后端测试、migration、编译检查和前端回归构建通过。

本 Phase 不实现上传、文件存储、Worker 或任何 AI 能力。

## 3. 允许范围

允许创建或修改：

- `backend/` 内数据库配置、SQLAlchemy Model、Session、Repository、Alembic 和测试。
- 当前阶段需要的后端依赖声明与 lock 文件。
- `.env.example` 中安全的数据库配置示例。
- `README.md` 中 Phase 02 启动、迁移和测试说明。
- 为保持 Phase 01 回归通过所需的最小修正。

前端不增加新功能，只允许为保持构建通过做必要修正。

## 4. 明确禁止

不得实现或引入：

- Video 上传 API、文件存储、FFmpeg、音频提取。
- Worker、任务领取循环、后台调度或进度轮询。
- Redis、Celery、RocketMQ、Kafka 或其他 MQ。
- ASR、LLM、Embedding、Milvus、RAG、Chapter、Chat 或 Feedback。
- Docker Compose、Kubernetes、微服务或 Java 服务。
- 通用 `BaseRepository`、DatabaseProvider Factory 或没有第二种实现需求的形式主义接口。
- 应用启动时 `create_all()` 或自动修改表结构。
- Service 层数据库方言判断或散落的原生 SQL。
- 真实数据库密码、API Key、本机绝对路径或生产地址。
- 修改 Benchmark、Judge 或 Hidden Tests。

## 5. 配置与连接要求

- 使用 Pydantic Settings 集中读取 `DATABASE_URL`。
- MySQL URL 使用 SQLAlchemy async driver，例如 `mysql+asyncmy://...`。
- `.env.example` 只能放占位值或明确的本地开发示例，不得包含真实凭证。
- Engine 和 async sessionmaker 必须集中创建和管理。
- 模块 import 时不得主动连接数据库。
- `/api/v1/health` 不得依赖数据库可用性。
- 数据库操作失败时应保留原始异常链或映射为清晰的基础设施异常，不得静默吞掉。
- 业务与 Repository 代码不得根据 MySQL、SQLite 或 PostgreSQL 名称进行分支判断。

测试可以使用隔离的 async SQLite 数据库提高可重复性，但生产/本地运行配置必须真实支持 MySQL async URL。不得为了测试把 SQLite 专属逻辑写进业务代码。

## 6. 数据模型

### 6.1 Video

至少包含：

- `id`
- `title`
- `created_at`
- `updated_at`

### 6.2 ProcessingTask

至少包含：

- `id`
- `video_id`，外键关联 Video
- `status`，默认 `PENDING`
- `current_stage`，允许为空
- `progress`，默认 0，合法范围 0–100
- `error_message`，允许为空
- `created_at`
- `started_at`，允许为空
- `finished_at`，允许为空

要求：

- 表名和字段名清晰稳定。
- 时间字段使用统一策略。
- 不使用 MySQL 专属字段类型完成普通业务字段。
- 不提前加入 Phase 03 才需要的上传、MIME、storage object key 等字段。
- 不提前实现 Worker 状态机。

## 7. Repository 要求

提供当前阶段测试所需的具体 Repository，至少验证：

- 创建 Video。
- 按 ID 查询 Video。
- 创建关联 Video 的 ProcessingTask。
- 查询并更新 ProcessingTask 的状态、阶段和进度。
- 缺失记录返回清晰、稳定的结果。

Repository 接收 AsyncSession 或通过清晰的 session boundary 工作。禁止在 API Controller 中散落 ORM 查询。

## 8. Alembic 要求

- 初始化标准 Alembic 环境。
- metadata 与 SQLAlchemy Model 关联。
- 提供创建 `videos` 和 `processing_tasks` 的首个 revision。
- migration 必须包含可执行的 upgrade 与 downgrade。
- 禁止空 migration。
- 禁止应用启动时替代 Alembic 自动建表。

## 9. API 回归要求

现有 Contract 必须保持：

```http
GET /api/v1/health
```

- 数据库可用或不可用时均应返回 HTTP 200。
- 不新增数据库 Health API，除非仅用于测试且不进入公共 Contract。
- 前端现有 loading、success、error 状态继续工作。

## 10. 自动测试

至少覆盖：

- 无数据库连接时应用可 import，Health 返回 200。
- Async session 可用。
- Video create/get。
- ProcessingTask create/get/update。
- Video 与 ProcessingTask 外键关系。
- progress 边界校验或持久化约束。
- migration upgrade 创建预期表。
- migration downgrade 可回退。

最低验证命令：

```bash
cd backend
pytest
python -m compileall app
alembic upgrade head
alembic downgrade base
alembic upgrade head
```

前端回归：

```bash
cd frontend
npm run build
```

如候选使用其他已提交包管理器，使用对应等价命令。

没有可用 MySQL 环境时，不得声称真实 MySQL migration 已通过；应如实报告 SQLite 自动测试结果和 MySQL 未运行项。

## 11. Judge / Hidden Tests

Judge 将检查：

- 数据库不可用时 Health 是否仍可用。
- import 是否意外连接数据库。
- 并发 AsyncSession 是否相互隔离。
- Repository 是否泄漏 MySQL 方言判断。
- Service / API 是否散落原生 SQL。
- migration 是否与 metadata 一致。
- 外键、默认值、时间字段和 progress 边界。
- downgrade 后是否可以重新 upgrade。
- 是否擅自实现 Phase 03 或 Phase 04。
- 是否修改 Judge / Hidden Tests。

## 12. 固定本地端口

端口仅用于 Benchmark 本地运行，不得硬编码到领域逻辑：

| Candidate Branch | Backend | Frontend |
|---|---:|---:|
| `agent/codex` | 8001 | 5173 |
| `agent/claude` | 8000 | 5174 |

Codex 前端运行时使用：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8001/api/v1 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Claude 前端运行时使用：

```bash
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

后端分别通过 Uvicorn `--port 8001` 或 `--port 8000` 启动。候选必须根据当前 Git branch 选择对应行，不得占用另一候选端口。

## 13. 完成验收标准

以下全部满足才可声明 Phase 02 完成：

1. Phase 01 全部回归通过。
2. Async SQLAlchemy 配置和 session boundary 清晰。
3. 两个最小实体与关系正确。
4. Repository CRUD 自动测试通过。
5. Alembic upgrade/downgrade 可执行。
6. Health 不依赖数据库。
7. 前端生产构建通过。
8. 未实现后续 Phase。
9. 未提交 Secret、依赖目录、构建产物或本机绝对路径。
10. 实际验证和失败均如实汇报。

## 14. 完成汇报格式

最终回复必须使用简体中文并包含：

```markdown
# Phase 02 完成汇报

## 完成状态
- Status: COMPLETED / PARTIAL / FAILED

## Git
- Branch:
- Before Commit:
- After Commit:

## 实现摘要
- 配置与 Session：
- Models：
- Repositories：
- Alembic：

## 数据库验证
- 自动测试数据库：
- MySQL 实测：PASSED / FAILED / NOT RUN
- Migration upgrade/downgrade：

## Agent Self Test
- `实际命令`: PASSED / FAILED / NOT RUN

## 范围与规范检查
- 是否实现后续 Phase：
- 是否新增大型依赖：
- 是否修改 Judge / Hidden Tests：
- 是否存在 CODEX.md 违规：

## 运行时间
- Start:
- End:
- Agent Wall Clock Time:
- 不得根据 Git 时间戳推算。

## 未完成事项与已知问题
- 无 / 逐项列出

## Git 建议
- Commit Message: `feat(phase-02): add persistence foundation`
```

完成后停止，不得进入 Phase 03，不得自行推送远程分支。

## 15. Benchmark 观察重点

- Async SQLAlchemy 和 session 生命周期是否正确。
- Alembic 是否真正可用，而非只有目录。
- Repository 是否简单、具体、可测试。
- 是否错误地让 Health 依赖数据库。
- 是否为了未来数据库切换制造复杂抽象。
- 是否出现 Scope Drift、Overengineering 或 Integrity Violation。
