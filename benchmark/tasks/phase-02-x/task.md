# Phase 02-X — Persistence & Local Video Ingestion

## 1. 任务说明

本任务合并原开发计划中的：

- Phase 02 — Persistence Foundation
- Phase 03 — Video Upload & Local Storage
- 为验收上述能力所需的最小前端联通

目标是交付一个真实可用但范围受控的垂直闭环：

```text
选择本地视频
→ 上传 API
→ LocalStorage 安全落盘
→ Video + PENDING ProcessingTask 持久化
→ API 返回 video_id / task_id
→ 前端显示上传结果与视频列表
```

本任务不包含 Phase 04 Worker，不执行任何媒体或 AI 处理。

Codex 与 Claude 必须接收完全相同的本文件，并在各自 Phase 01 分支上独立实现。开始前必须完整阅读：

1. `CODEX.md`
2. `BENCHMARK.md`
3. `PHASES.md`
4. `benchmark/tasks/phase-02-x/task.md`
5. 当前工具对应入口文件：Codex 读取 `AGENTS.md`，Claude Code 读取 `CLAUDE.md`

若发现公共任务存在实质歧义，应停止并提问，不得自行扩大范围。

## 2. 任务规模边界

本任务专为 `gpt-5.6-luna / medium` 设计，预期完成一个中等规模的全栈垂直切片。

必须完成：

- Async SQLAlchemy 2.x 与 MySQL 8.x 配置。
- Alembic migration。
- Video 与 ProcessingTask 模型。
- 具体 Repository。
- LocalStorageProvider。
- 视频上传、列表和详情 API。
- 上传时创建 PENDING ProcessingTask。
- 最小上传与列表 UI。
- 自动测试、migration 验证、前端构建与真实联通验证。

明确不做：

- Worker、任务领取、重试和状态机执行。
- FFmpeg、媒体探测、时长读取和音频提取。
- ASR、LLM、Embedding、Milvus、RAG、Chapter、Chat、Citation、Feedback。
- URL 导入、云存储、MinIO、S3。
- 用户系统、权限、Docker Compose 或微服务。

完成本任务后必须停止，不得继续 Phase 04。

## 3. 允许修改范围

允许修改：

- `backend/` 中配置、数据库、Model、Repository、Storage、Service、API、Alembic 和测试。
- `frontend/` 中最小上传页、视频列表、API Client、类型与样式。
- 当前阶段必要的依赖声明和 lock 文件。
- `.env.example`、`.gitignore` 和 `README.md` 的最小必要更新。

不得为了匹配完整推荐目录而创建没有实际用途的空目录、空接口或占位实现。

## 4. 配置要求

### 4.1 Database

- 使用 Pydantic Settings 集中读取 `DATABASE_URL`。
- 运行配置必须支持 `mysql+asyncmy://...`。
- Engine 与 `async_sessionmaker` 集中管理。
- import 应用时不得主动连接数据库。
- `GET /api/v1/health` 不得依赖数据库可用性。
- 禁止在应用启动时执行 `create_all()`。
- 所有结构变化必须通过 Alembic。
- 业务代码不得判断当前数据库方言。

自动测试可以使用隔离的 async SQLite，提高可重复性；不得把 SQLite 专属分支写进业务代码。没有真实 MySQL 环境时必须将 MySQL 实测标记为 `NOT RUN`。

### 4.2 Local Storage

- 使用 `STORAGE_ROOT` 配置存储根目录。
- 默认值只能是安全的项目相对路径，例如 `data/videos`。
- 数据库只保存：
  - `storage_provider`
  - `storage_key`
- 不得把 `/Users/...`、`/home/...` 等本机绝对路径保存到业务数据。
- 存储目录不可写时返回清晰错误，且不得留下错误的数据库记录。

### 4.3 Upload

- 使用可配置的 `MAX_UPLOAD_BYTES`，提供合理本地默认值。
- 至少允许：`.mp4`、`.mov`、`.mkv`、`.webm`。
- 扩展名和 Content-Type 都必须经过明确校验，但不得把浏览器 Content-Type 当作唯一可信依据。
- 禁止一次性把大文件全部读入内存，应分块写入。

## 5. 数据模型

### 5.1 Video

至少包含：

- `id`
- `title`
- `original_filename`
- `content_type`
- `size_bytes`
- `storage_provider`
- `storage_key`
- `created_at`
- `updated_at`

要求：

- `storage_key` 在当前 Storage Provider 范围内唯一。
- 原始文件名仅作展示，不直接作为磁盘目标路径。
- `title` 可以从文件名安全派生，也允许 API 显式提供。

### 5.2 ProcessingTask

至少包含：

- `id`
- `video_id`，外键关联 Video
- `status`，默认 `PENDING`
- `current_stage`，上传完成后为 `INGEST`
- `progress`，默认值处于上传阶段合理范围，必须限制在 0–100
- `error_message`，允许为空
- `created_at`
- `started_at`，允许为空
- `finished_at`，允许为空

本阶段只创建初始任务记录，不实现任务领取、执行、重试或后续 Stage 转换。

### 5.3 通用要求

- 使用 SQLAlchemy 2.x typed declarative 风格。
- 时间字段采用统一策略。
- 普通业务字段避免 MySQL 专属类型。
- relationship 与外键行为清晰。
- API Schema 与 ORM Model 分离。

## 6. Repository 与 Service 边界

至少提供具体的：

- `VideoRepository`
- `ProcessingTaskRepository`

禁止创建没有复用价值的通用 BaseRepository。

上传编排应位于 Service，而不是把以下逻辑堆在 Controller：

- 输入校验
- Storage 写入
- Video 创建
- ProcessingTask 创建
- 失败补偿

### 一致性要求

- Storage 写失败：不得创建 Video 或 ProcessingTask。
- 数据库提交失败：应尽力删除本次新写入文件。
- 成功响应前，文件和两条数据库记录必须处于一致状态。
- 删除补偿失败需要记录清晰日志，不得覆盖原始异常。

不要求实现分布式事务或复杂 Saga。

## 7. Storage 抽象

实现：

```text
StorageProvider
└── LocalStorageProvider
```

抽象只需要覆盖当前真实用途，例如：

- 分块保存上传内容
- 删除对象，用于失败补偿
- 必要时检查对象是否存在

不得提前实现 MinIO、S3 或复杂 Factory。

安全要求：

- 使用不可预测的唯一 object key，例如 UUID。
- 防止 `../`、绝对路径和路径穿越。
- 中文、空格、重复文件名不得影响安全落盘。
- 0-byte 文件必须拒绝。
- 不支持扩展名或明显不合法 Content-Type 必须拒绝。
- 超出大小限制时停止写入并清理部分文件。

## 8. API Contract

### 8.1 Health 回归

```http
GET /api/v1/health
```

- 保持 Phase 01 Contract。
- 数据库或 Storage 不可用时仍返回 HTTP 200。

### 8.2 上传视频

```http
POST /api/v1/videos
Content-Type: multipart/form-data
```

字段：

- `file`：必填视频文件。
- `title`：可选字符串。

成功：HTTP `201`。

响应至少包含：

```json
{
  "message": "上传成功，系统正在后台处理",
  "video_id": 1,
  "task_id": 1
}
```

本阶段的“后台处理”仅表示已创建 PENDING 任务；没有 Worker 消费它。

错误至少区分：

- 空文件：400
- 不支持格式：415
- 超出大小限制：413
- Storage / Database 内部失败：稳定 5xx message，不向客户端泄露堆栈或绝对路径

### 8.3 视频列表

```http
GET /api/v1/videos
```

- 默认按创建时间倒序。
- 返回稳定 JSON Schema。
- V1 私人低并发场景可以使用简单分页，至少支持 `limit` 与 `offset`，并设置合理上限。

### 8.4 视频详情

```http
GET /api/v1/videos/{video_id}
```

- 存在时返回 Video Metadata 与当前 ProcessingTask 摘要。
- 不存在返回 404。
- 不返回磁盘绝对路径。

本阶段不提供原始视频下载或播放 API。

## 9. Alembic 要求

- 初始化标准 Alembic 环境。
- Alembic metadata 正确加载所有 Model。
- 首个 revision 创建 `videos` 与 `processing_tasks`。
- upgrade 与 downgrade 都必须可执行。
- migration 与当前 metadata 一致。
- 禁止空 migration。
- 禁止用应用启动时建表代替 migration。

## 10. 最小前端要求

在现有 React 页面中增加最小可用能力：

- 选择本地视频。
- 可选填写标题。
- 点击上传。
- 显示上传中状态。
- 显示成功结果中的 `video_id` 与 `task_id`。
- 显示可理解的失败信息。
- 展示视频列表。
- 上传成功后刷新列表。
- 保留 Phase 01 后端连接状态。

要求：

- 继续使用 React Hooks，不引入 Redux、Zustand 或 UI Framework。
- API Base URL 可配置。
- 不实现进度轮询、播放器、章节或 Chat。
- 中文文件名和长文件名不能让页面明显崩坏。

## 11. 自动测试要求

### 11.1 Backend

至少覆盖：

- Health 在数据库不可用时仍返回 200。
- AsyncSession 与 Repository CRUD。
- Video 与 ProcessingTask 关系和初始值。
- Alembic upgrade 创建预期表。
- Alembic downgrade 后可再次 upgrade。
- 合法 MP4 上传成功并创建文件、Video、ProcessingTask。
- 自定义 title 与默认 title。
- 视频列表顺序、分页边界和详情 404。
- 0-byte 文件。
- 不支持扩展名。
- 中文、空格和重复文件名。
- `../` 风格恶意文件名。
- 超过大小限制后的部分文件清理。
- Storage 写失败时数据库无脏记录。
- 数据库失败时文件补偿删除。

### 11.2 Frontend

最低必须通过：

```bash
npm run build
```

如果候选已有轻量测试设施，可增加上传成功和失败状态测试；不得仅为本任务引入大型前端测试框架。

### 11.3 最低验证命令

```bash
cd backend
pytest
python -m compileall app
alembic upgrade head
alembic downgrade base
alembic upgrade head
```

```bash
cd frontend
npm run build
```

MySQL 环境可用时必须额外在 MySQL 8.x 上执行 migration smoke test。环境不可用时如实写 `NOT RUN`，不得假装通过。

## 12. Judge / Hidden Tests

Judge 将重点验证：

- 应用 import 和 Health 是否意外连接数据库。
- AsyncSession 生命周期和并发隔离。
- migration 与 metadata 是否一致。
- 业务层是否出现数据库方言判断或散落原生 SQL。
- 上传接口是否一次性读取整个大文件。
- Unicode、空格、重复名称、路径穿越和超限清理。
- Storage 与数据库失败时的一致性补偿。
- 数据库中是否保存本机绝对路径。
- 前端是否真实调用上传和列表 API。
- 是否提前实现 Worker 或媒体处理。
- 是否修改 Judge / Hidden Tests。

## 13. 人工验收

Judge 将在相同环境分别执行：

1. 启动数据库并执行 migration。
2. 启动后端。
3. 启动前端。
4. 通过浏览器上传同一份小型 MP4。
5. 确认立即获得 `video_id` 与 `task_id`。
6. 确认页面列表出现新视频。
7. 检查数据库 Video 与 PENDING ProcessingTask。
8. 检查 LocalStorage 文件存在且文件内容一致。
9. 上传同名文件，确认不会覆盖。
10. 关闭数据库后确认 Health 仍返回 200。

## 14. 固定本地端口

端口仅作为 Benchmark 本地运行参数，不得写死在领域逻辑：

| Candidate Branch | Backend | Frontend |
|---|---:|---:|
| `agent/codex` | 8001 | 5173 |
| `agent/claude` | 8000 | 5174 |

Codex 前端：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8001/api/v1 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Claude 前端：

```bash
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

后端分别使用 Uvicorn `--port 8001` 或 `--port 8000`。

## 15. 完成标准

以下全部满足才可声明完成：

1. Phase 01 回归通过。
2. 数据库配置、Session、Model、Repository 和 Alembic 可用。
3. LocalStorageProvider 安全落盘。
4. 上传成功时文件、Video、ProcessingTask 一致。
5. 失败场景不会遗留明显脏数据或部分文件。
6. 列表和详情 API 符合 Contract。
7. 最小前端上传与列表闭环可用。
8. 自动测试、编译检查和前端构建通过。
9. 未实现 Worker、媒体处理或 AI 能力。
10. 未提交 Secret、依赖目录、构建产物或本机绝对路径。
11. 未修改 Benchmark、Judge 或 Hidden Tests。
12. 实际执行结果如实汇报。

## 16. 完成汇报格式

最终回复必须使用简体中文并包含：

```markdown
# Phase 02-X 完成汇报

## 完成状态
- Status: COMPLETED / PARTIAL / FAILED

## Git
- Branch:
- Before Commit:
- After Commit:

## 实现摘要
- Database / Session：
- Models / Migration：
- Repository / Service：
- LocalStorage：
- API：
- Frontend：

## API Contract
- POST /api/v1/videos：
- GET /api/v1/videos：
- GET /api/v1/videos/{id}：

## Agent Self Test
- `实际执行的命令`: PASSED / FAILED / NOT RUN

## 数据库与文件验证
- 自动测试数据库：
- MySQL 8 实测：PASSED / FAILED / NOT RUN
- Alembic upgrade/downgrade：
- 文件与数据库一致性：

## 范围与规范检查
- 是否实现 Worker 或媒体处理：
- 是否新增大型依赖：
- 是否修改 Judge / Hidden Tests：
- 是否存在 CODEX.md 违规：

## 运行时间
- Start:
- End:
- Agent Wall Clock Time:
- 不得根据 Git 提交时间推算。

## 未完成事项与已知问题
- 无 / 逐项列出

## Git 建议
- Commit Message: `feat(phase-02x): add persistence and local video ingestion`
```

完成后停止。不得开始 Worker，不得自行推送远程分支。

## 17. Benchmark 观察重点

- Luna 是否能在中等任务中保持范围纪律。
- 全栈 Contract 是否一致。
- 数据库与文件双写失败时是否正确补偿。
- Storage 抽象是否足够但不过度。
- 测试是否覆盖真实边界而不是只测 Happy Path。
- 是否主动完成 migration、构建和浏览器联通验证。
- 是否出现 Scope Drift、Overengineering 或 Integrity Violation。
