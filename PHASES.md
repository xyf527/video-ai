# PHASES.md

# AI Video Knowledge Assistant — Development Phases & Test Plan

> 所有 Phase 均遵循 `CODEX.md` 和 `BENCHMARK.md`。
>
> 每个 Phase 的 Candidate Task 必须在 Codex 与 Claude 两边完全一致。

---

# Phase 00 — Benchmark Baseline

## 目标
建立完全一致的实验起点，不实现业务代码。

## 内容
- Git repository
- `benchmark-v0` Tag
- `CODEX.md`
- `AGENTS.md`
- `CLAUDE.md`
- `BENCHMARK.md`
- `PHASES.md`
- `.gitignore`
- `.env.example`
- 基础 README
- 两个 Git Worktree

## 自动检查
```bash
git status
git tag --list benchmark-v0
git worktree list
```

验证：
- Codex / Claude Worktree HEAD 完全相同
- 两边工作区 clean
- Task 文档一致

## 人工测试
- 确认两个目录基线文件一致
- 确认两个分支不同
- 确认 Codex 与 Claude 的 CC Switch 应用记录可以分开识别
- 确认模型都是 `gpt-5.6-luna`
- 确认 reasoning effort 都是 `medium`
- 确认两边均通过 CC Switch 路由且候选统计相互隔离

---

# Phase 01 — Project Bootstrap

## 目标
创建最小可运行前后端工程。

## Backend
- FastAPI
- Pydantic Settings
- `/api/v1/health`
- pytest

## Frontend
- React
- TypeScript
- Vite
- 基础 Router
- 最小 API 联通

## 自动测试
Backend：
```bash
pytest
```

必须验证：
```text
GET /api/v1/health → HTTP 200
```

Frontend：
```bash
npm run build
```

或：
```bash
pnpm build
```

## Hidden Tests
- 缺失非必要环境变量时应用仍能启动
- API 前缀必须为 `/api/v1`
- health 不应该依赖数据库

## 人工测试
1. 启动 FastAPI。
2. 打开 `/api/v1/health`。
3. 启动 React。
4. 浏览器打开页面。
5. 确认前端可以访问后端。

## Benchmark 重点
- 项目结构
- 是否过度设计
- 是否擅自加入 Redis/MQ/Next.js 等

---

# Phase 02 — Persistence Foundation

## 目标
建立 MySQL + SQLAlchemy + Alembic 基础设施。

## 内容
- Async SQLAlchemy
- MySQL
- Session 管理
- Repository 基础约定
- Alembic
- Video 最小实体
- ProcessingTask 最小实体

## 自动测试
```bash
pytest
alembic upgrade head
```

验证：
- Session 可用
- 基本 CRUD
- migration 可执行

## Hidden Tests
- 数据库不可用时错误合理
- Service 不包含数据库方言判断
- MySQL 专属 SQL 不泄漏到业务层

## 人工测试
- MySQL 中确认表存在
- 创建 Video 后查询数据库
- 检查 Alembic revision
- 检查字段命名和时间字段

## Benchmark 重点
- ORM 使用
- PostgreSQL 可迁移性
- 是否重复造 DatabaseProvider

---

# Phase 03 — Video Upload & Local Storage

## 目标
支持视频文件上传和本地存储。

## 内容
- Video Upload API
- LocalStorageProvider
- Video metadata
- 文件大小
- MIME / extension
- storage object key
- 视频列表

## 自动测试
- 上传合法 MP4
- Video 记录创建
- 文件写入 storage
- API 返回 video_id

## Hidden Tests
- 0-byte 文件
- 不支持格式
- 中文文件名
- 文件名空格
- 重复文件名
- 非法文件名
- storage 写失败

## 人工测试
上传真实 MP4：
- 页面提示上传成功
- MySQL 有 Video
- 磁盘文件存在
- 数据库没有硬编码开发机器绝对路径

## Benchmark 重点
- Storage 抽象
- 错误处理
- Controller 是否过重

---

# Phase 04 — ProcessingTask & Background Worker

## 目标
实现“上传成功立即返回，后台慢慢处理”。

## 内容
- MySQL Task Queue
- 独立 Python Worker
- PENDING / PROCESSING / COMPLETED / FAILED
- current_stage
- progress
- error
- Task API

## 自动测试
验证：
- 创建任务
- Worker 获取任务
- 状态迁移
- progress 更新
- 完成
- 失败记录
- 同一任务不会被重复领取

## Hidden Tests
- Worker 中途异常
- Worker 重启
- 两 Worker 竞争同一任务
- FAILED 重试
- Web 请求不能等待长任务完成

## 人工测试
1. 上传视频。
2. 接口应快速返回。
3. 页面显示后台处理中。
4. 刷新页面。
5. Task 仍然存在。
6. 停止并重启 Worker。
7. 检查任务数据仍在。

## Benchmark 重点
- 异步设计
- 并发领取
- 可恢复性
- 是否擅自引入 Celery/Redis

---

# Phase 05 — Media Extraction

## 目标
从视频提取适合 ASR 的音频。

## 内容
- FFmpeg / PyAV
- Media service
- duration
- audio output
- Pipeline Stage: EXTRACT_AUDIO

## 自动测试
- 合法 MP4 → 音频
- duration 可读取
- 失败状态正确
- 完成后进入下一阶段

## Hidden Tests
- 无音轨视频
- 损坏视频
- FFmpeg 不存在
- 中文/空格路径
- FFmpeg 返回非 0

## 人工测试
用真实视频确认：
- 音频可播放
- 时长正确
- 文件大小合理
- 原视频未被破坏

## Benchmark 重点
- 外部命令调用
- subprocess 安全
- 错误解析
- 临时文件管理

---

# Phase 06 — ASR Provider Architecture

## 目标
建立统一 ASR 接口。

## 内容
```text
TranscriptionProvider
TranscriptionResult
TranscriptSegment
ASRFactory
```

预留：
- faster-whisper
- Paraformer
- SenseVoice
- WhisperX

## 自动测试
使用 Fake Provider 验证：
- Factory
- Provider selection
- Normalization
- Segment ordering
- timestamp validation

## Hidden Tests
- start > end
- 负 timestamp
- 空 segment
- Provider 异常
- 非法 provider 配置

## 人工测试
代码 Review：
- 业务层不得 import 具体 ASR SDK
- Chapter/RAG 不认识底层 Provider 格式

## Benchmark 重点
- 抽象质量
- 是否过度工厂化
- 配置切换是否干净

---

# Phase 07 — ASR Implementations & A/B Benchmark

## 目标
接入：
- faster-whisper
- Paraformer
- SenseVoice
- WhisperX

## 功能要求
每个 Provider：
- Lazy Load
- 输出统一 TranscriptionResult
- 记录 provider/model
- 提供 timestamp
- 映射统一错误

## Golden Sample
准备 5-10 分钟真实财经视频，包含：
- 普通中文
- Trump
- TACO
- Optimus
- Tesla
- YouTube
- NVIDIA
- Powell
- OpenAI
- 美联储
- 科创50
- 人形机器人

## 自动测试
- Provider contract tests
- Factory switch
- Lazy Load
- 输出格式
- timestamp 单调

## 人工测试
四个 Provider 对同一 Golden Sample 分别运行。

记录：

| Provider | 耗时 | 内存 | 中文错误 | 英文词错误 | 时间戳 | 综合 |
|---|---:|---:|---:|---:|---:|---:|

至少人工抽查 20 个片段。

## Benchmark 重点
Agent 不负责主观决定哪个 ASR 最好，最终默认值根据真实测试数据人工决定。

---

# Phase 08 — Transcript Persistence & Chapters

## 目标
持久化 ASR 结果并自动划分章节。

## 内容
- Transcript
- TranscriptSegment
- Chapter
- Chapter LLM Prompt
- start/end
- title
- summary
- keyword/topic 基础结构

## 自动测试
- Transcript persistence
- Segment ordering
- Chapter 范围
- 章节合法性
- LLM structured output parsing

## Hidden Tests
- LLM 返回非法 JSON
- 章节越界
- 重复章节
- Transcript 很短
- Transcript 为空

## 人工测试
真实视频：
- 查看完整 Transcript
- 随机抽 10 个 timestamp 对照原视频
- 检查章节标题和起止
- 检查原始 Transcript 没有被 LLM 改写

## Benchmark 重点
- 结构化输出
- 数据校验
- 原始数据保护

---

# Phase 09 — Chunking, Embedding & Milvus

## 目标
建立可检索知识索引。

## 内容
- Chunk
- chunk_strategy
- chunk_version
- EmbeddingProvider
- SiliconFlow BGE-M3
- VectorStore
- MilvusVectorStore

## 自动测试
- Chunk 生成
- Metadata 完整
- Embedding dimension 校验
- Milvus insert
- Milvus search
- delete/reindex

## Hidden Tests
- Embedding API 失败
- dimension 不匹配
- Milvus 不可用
- 重复索引
- Chunk 修改后重新索引

## 人工测试
输入：
```text
Optimus
黄金
美债
人形机器人
```

检查 Top K 是否来自正确章节。

## Benchmark 重点
- VectorStore 抽象
- Provider 隔离
- Metadata
- 重建索引能力

---

# Phase 10 — Retrieval & Reranking

## 目标
形成：

```text
Query
→ Scope
→ Retriever
→ Reranker
→ Context
```

## 内容
- CHAPTER
- VIDEO
- TOPIC
- GLOBAL
- BGE reranker
- Retrieval Trace

## 自动测试
- Scope filter
- Top K
- Rerank order
- metadata filtering
- empty retrieval

## Hidden Tests
- CHAPTER scope 不得检索其他章节
- VIDEO scope 不得串视频
- Exact keyword 场景
- 无相关内容

## 人工测试
固定问题：
```text
“41:50 人形机器人这部分提到了哪些核心内容？”
```

检查 Retrieval Chunk 是否来自正确章节。

## Benchmark 重点
RAG 检索可靠性。

---

# Phase 11 — AI QA & Citation

## 目标
跑通：
```text
Question
→ RAG
→ Answer
→ Original Evidence
→ Timestamp
```

## 内容
- AnswerGenerator
- CitationBuilder
- Conversation
- Message

## 自动测试
- Answer schema
- citations 存在
- citation → chunk → transcript 可追溯
- timestamp 映射
- insufficient context behavior

## Hidden Tests
- 引用不存在 Chunk
- 没证据时禁止伪造引用
- scope 越界
- timestamp 越界

## 人工测试
真实问题：
```text
“人形机器人这部分博主怎么看？
详细总结并给出原文。”
```

检查：
- 总结是否符合原文
- 原文是否真实存在
- timestamp 是否正确
- 是否幻觉
- 是否把外部信息混成博主观点

## Benchmark 重点
项目核心闭环，该 Phase 应高权重。

---

# Phase 12 — Feedback & RAG Trace

## 目标
让真实反馈可以用于优化。

## 内容
- Feedback
- RAG Trace
- feedback type
- message relation
- retrieved chunks
- rerank scores
- model/prompt/version metadata

## 自动测试
- 创建 feedback
- 关联 message
- trace 可查询
- trace 数据完整

## Hidden Tests
- message 不存在
- 重复反馈
- 空评论
- 失败回答 Trace

## 人工测试
对一条回答提交：
```text
👎 Citation Error
```

后台应能看到：
- 用户问题
- AI 回答
- 检索 Chunk
- 引用
- Provider
- Prompt version

## Benchmark 重点
- 可观察性
- Debug 能力
- 数据关系

---

# Phase 13 — React Product UI

## 目标
组成真正可使用产品。

## 页面
- Video List
- Upload
- Task Progress
- Video Detail
- Chapter List
- Chapter Detail
- Chat
- Feedback

## 自动测试
最低：
```bash
npm run build
```

可增加关键组件测试。

## Hidden / Judge Tests
- API 失败 UI
- Loading
- Empty State
- FAILED Task
- 进度刷新
- 中文长文本
- timestamp 显示

## 人工测试
完整流程：
```text
上传
→ 查看进度
→ 查看章节
→ 点击章节
→ 提问
→ 查看引用
→ 提交反馈
```

检查：
- 无明显 UI 卡死
- 刷新后任务仍在
- 错误信息可理解
- Chat 可正常使用

## Benchmark 重点
跨前后端能力与 API Contract。

---

# Phase 14 — Full E2E & Recovery

## 目标
使用 40-60 分钟真实视频做端到端验收。

## E2E
```text
Upload
→ Extract Audio
→ ASR
→ Transcript
→ Chapter
→ Chunk
→ Embed
→ Milvus
→ RAG
→ QA
→ Citation
→ Feedback
```

## 自动测试
```bash
pytest
npm run build
alembic upgrade head
```

## 故障注入
Judge 人为制造：
1. LLM API 暂时失败
2. Milvus 暂时不可用
3. Worker 中途重启
4. Chapter 阶段失败

要求：
- 已完成 ASR 不重新执行
- 失败 Stage 可以重试
- Task 不丢失
- 错误可定位

## 人工测试
完整使用至少 30 分钟，记录：
- Bug
- 卡顿
- 数据错误
- AI 错误
- 用户体验问题

## Benchmark 重点
工程完整性、恢复能力、长链路 Debug。

---

# Phase 15 — Change Request: URL Content Source

## 目标
故意加入未来需求，验证早期架构扩展性。

新需求：
> 在不破坏 LocalFileSource 的前提下，为 URL Source 导入预留并实现安全的标准入口。

当前不要求破解或下载 Bilibili / Douyin。

至少实现：
- URLContentSource 路径
- Supported Source validation
- Safe URL validation
- Source metadata
- Pipeline 不感知来源类型

## 自动测试
- Local Upload 全部回归通过
- URL Source contract
- unsupported URL
- invalid URL
- pipeline receives normalized content

## Hidden Tests
- localhost
- 127.0.0.1
- private IP
- malformed URL
- unsupported scheme
- LocalFileSource regression

## 人工测试
Review：
- 是否重写整个 Pipeline
- Local Upload 是否继续可用
- 新 Source 是否只影响合理边界

## Benchmark 重点
验证“高内聚、低耦合”是否真实有效。

---

# Phase 16 — Change Request: Database Portability

## 目标
验证 MySQL → PostgreSQL 的迁移友好度。

不要求无条件完成所有 PostgreSQL 生产迁移。

## 任务
- 审查 MySQL-specific coupling
- 修复不必要的数据库绑定
- 保持 MySQL 正常
- 增加 PostgreSQL 配置入口
- 环境允许时增加最小 PostgreSQL smoke test

## 自动测试
MySQL：
```bash
pytest
alembic upgrade head
```

Judge 静态检查：
- Service 无 MySQL 方言判断
- 原生 SQL 集中
- 字段尽可能使用通用类型

如果提供 PostgreSQL：
- Migration smoke test
- 最小 CRUD smoke test

## 人工测试
检查：
- 是否为了可迁移性建立无意义抽象
- 是否真正减少 DB-specific coupling

## Benchmark 重点
测试“可扩展性”和“不过度设计”的平衡。

---

# Phase 17 — Fresh Session Maintenance Task

## 目标
两边全部开启全新 CLI Session，不提供旧对话。

只依赖：
- Repository
- CODEX.md
- AGENTS.md / CLAUDE.md
- 当前 Task

维护需求示例：

> TranscriptSegment timestamp 内部从 float seconds 统一改成 integer milliseconds，同时 API 暂时保持兼容。

## 自动测试
- migration
- serialization
- old API compatibility
- citation
- chapter
- RAG
- frontend build

## Hidden Tests
- 漏改文件
- 单位混用
- 老数据
- API regression

## 人工测试
随机查看：
- Transcript
- Chapter
- Citation

确认时间仍正确。

## Benchmark 重点
- Repository 理解
- 多文件修改
- Fresh Session 上下文恢复
- Regression 控制

---

# Phase 18 — Final Review

## 目标
不增加新功能。

候选 Agent 分别执行：
- 自审
- 测试
- 无关代码清理
- 技术债说明
- README 更新

不得大规模架构重写。

## 自动测试
全量：
```bash
pytest
npm run build
alembic upgrade head
```

以及所有 E2E / Judge Tests。

## 人工测试
两边使用：
- 相同视频
- 相同问题
- 相同浏览器操作

比较：
- 完成度
- 稳定性
- UI
- RAG
- Citation
- Worker
- Error Recovery

## 最终统计
- Token / Input / Output / Cache / Estimated Cost 参考（可选，以 CC Switch 可用数据为准，不作为官方账单或评分依据）
- Agent Runtime
- Human Attention
- Level 2/3/4 干预
- 自动测试通过率
- Hidden Test 通过率
- Phase 得分
- 最终总分

输出：
```text
benchmark/results/final-comparison.md
```

---

# Phase 分组

## 第一幕：从零搭骨架
```text
00 Baseline
01 Bootstrap
02 Persistence
03 Upload
```

## 第二幕：后台视频处理
```text
04 Worker
05 Media
06 ASR Architecture
07 ASR Implementations
08 Transcript / Chapter
```

## 第三幕：AI Knowledge
```text
09 Embedding / Milvus
10 Retrieval / Rerank
11 QA / Citation
12 Feedback / Trace
```

## 第四幕：变成产品
```text
13 React UI
14 Full E2E
```

## 第五幕：故意改需求
```text
15 URL Source
16 Database Portability
17 Fresh Session Maintenance
```

## 第六幕：结算
```text
18 Final Review
```

后期 Change Request 专门验证：

> Agent 前面写出来的“可扩展架构”在真正需求变化时到底有没有价值。
