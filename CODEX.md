# CODEX.md

# AI Video Knowledge Assistant — Project Development Rules

> 本文件是本项目的长期开发规范与架构约束。  
> Codex 在执行任何代码修改前，必须先阅读本文件，并以本文件为最高项目级约束之一。
>
> 本项目当前目标是：**构建一个私人使用的 AI 视频知识理解与问答系统**。  
> 第一阶段重点验证“视频 → 转写 → 章节 → RAG → 问答 → 原文时间戳引用”这一核心闭环，而不是提前建设复杂的企业级基础设施。

---

## 1. 项目定位

### 1.1 核心目标

系统接收用户有权处理的视频内容，自动完成：

1. 视频上传与管理
2. 音频提取
3. ASR 自动语音识别
4. 带时间戳的逐段转写
5. 自动章节识别
6. 章节摘要
7. 主题与关键词提取
8. 文本 Chunk
9. Embedding
10. Milvus 向量索引
11. RAG 检索
12. AI 问答
13. 原文依据引用
14. 时间戳定位
15. 用户反馈
16. 问答记录
17. 后台任务进度展示

典型用户问题：

> “41:50 人形机器人这一部分，博主的看法是什么？请详细总结，并给出原文依据。”

理想回答必须包含：

- 对该章节内容的总结
- 关键观点
- 原始转写依据
- 对应时间戳
- 必要时提供相关外部信息，但必须明确区分“原视频内容”和“外部来源”

---

## 2. 项目明确不做的事情

V1 不实现以下内容：

- 用户注册
- 短信验证码
- OAuth 登录
- 第三方登录
- JWT Refresh Token 体系
- 支付
- 会员套餐
- 电商能力
- 股票推荐
- 个股预测
- 买入/卖出建议
- 仓位建议
- 目标价预测
- 微服务拆分
- Kubernetes
- RocketMQ
- Kafka
- Seata
- 复杂 RBAC
- 多租户
- Redis 缓存体系
- Celery
- 分布式任务调度
- 自动爬取所有网站
- 自动下载任意 URL
- 提前实现尚未出现的扩展需求

原则：

> 当前只解决当前真实存在的问题。

禁止为了“以后可能用到”而提前过度设计。

---

# 3. 当前技术栈

## 3.1 前端

- React
- TypeScript
- Vite
- React Router
- Axios / Fetch 封装

V1 不使用：

- Next.js
- Redux
- Redux Toolkit
- 多套状态管理框架

优先使用：

- React Hooks
- Context（仅在确有必要时）

只有当状态复杂度真实增加时，才考虑引入 Zustand 等轻量状态管理方案。

---

## 3.2 后端

- Python 3.x
- FastAPI
- Pydantic
- SQLAlchemy 2.x
- Alembic
- Uvicorn

后端采用：

> **模块化单体（Modular Monolith）**

V1 不拆微服务。

---

## 3.3 关系数据库

当前：

- MySQL 8.x

ORM：

- SQLAlchemy 2.x

Migration：

- Alembic

### 数据库可替换原则

未来可能迁移：

- PostgreSQL
- 其他 SQL 数据库

目标：

> 大部分常规业务代码不感知具体数据库。

数据库连接通过配置：

```yaml
database:
  url: mysql+asyncmy://user:password@mysql:3306/video_ai
```

未来允许切换：

```yaml
database:
  url: postgresql+asyncpg://user:password@postgres:5432/video_ai
```

要求：

- 业务层禁止判断当前数据库类型
- 业务层禁止出现 MySQL 专属逻辑
- 尽量使用 SQLAlchemy 通用能力
- 原生 SQL 必须集中管理
- 禁止在 Service 中到处直接执行原生 SQL
- 使用数据库特有能力时必须隔离到 Repository / Adapter 层
- 所有数据库结构变化必须通过 Alembic migration
- 禁止应用启动时自动修改生产表结构

注意：

> 不承诺所有数据库都能真正“一行配置无损切换”。  
> 目标是降低迁移成本，而不是制造不现实的抽象。

---

# 4. 向量数据库

当前：

- Milvus

抽象：

```text
VectorStore
    └── MilvusVectorStore
```

未来可替换：

- pgvector
- Qdrant
- Redis Vector
- Elasticsearch
- 其他向量数据库

严格要求：

- `ChatService` 不允许直接调用 pymilvus
- `ChapterService` 不允许直接调用 pymilvus
- `RAG` 上层逻辑只依赖 `VectorStore` 抽象
- Milvus SDK 只能存在于基础设施实现层

---

# 5. LLM Provider 架构

默认 Provider：

- OpenAI

未来计划支持：

- SiliconFlow
- DeepSeek
- Qwen
- GLM
- OpenAI Compatible API
- 其他兼容服务

架构思想参考：

```text
LLMProvider (ABC)
        │
        ├── BaseOpenAICompatibleProvider
        │       ├── OpenAIProvider
        │       ├── SiliconFlowProvider
        │       ├── DeepSeekProvider
        │       ├── QwenProvider
        │       └── GlmProvider
        │
        └── OtherProtocolProvider
```

配置示例：

```yaml
llm:
  provider: openai

  openai:
    base_url: ${OPENAI_BASE_URL}
    api_key: ${OPENAI_API_KEY}
    model: ${OPENAI_MODEL}

  siliconflow:
    base_url: ${SILICONFLOW_BASE_URL}
    api_key: ${SILICONFLOW_API_KEY}
    model: ${SILICONFLOW_MODEL}
```

调用方只能：

```python
provider = llm_factory.get_provider()
result = provider.chat(...)
```

禁止：

```python
if provider == "openai":
    ...
elif provider == "deepseek":
    ...
```

这种判断散落在业务层。

---

# 6. LLM Provider 统一能力

所有 LLM Provider 必须尽可能统一以下能力：

- chat
- structured output
- streaming（需要时）
- model name
- provider name
- token usage
- latency
- error mapping

统一记录：

- provider
- model
- prompt_tokens
- completion_tokens
- total_tokens
- latency_ms
- trace_id

Token 与调用耗时统计不得由每个业务 Service 重复实现。

应由统一 Wrapper / Middleware / Decorator / Client 层完成。

---

# 7. Embedding Provider

默认：

```text
Provider:
SiliconFlow

Model:
BAAI/bge-m3

Dimension:
1024
```

抽象：

```text
EmbeddingProvider
    ├── SiliconFlowEmbeddingProvider
    ├── OpenAIEmbeddingProvider
    ├── ZhipuEmbeddingProvider
    └── LocalEmbeddingProvider
```

配置：

```yaml
embedding:
  provider: siliconflow
  model: BAAI/bge-m3
  dimensions: 1024
```

数据库 / Metadata 必须记录：

- embedding_provider
- embedding_model
- embedding_dimension
- embedding_version

重要：

> 更换 Embedding 模型后，旧向量通常需要重新生成。

不得假设不同 Embedding 模型的向量可以直接混用。

---

# 8. Reranker

V1 默认：

```text
SiliconFlow
BAAI/bge-reranker-v2-m3
```

抽象：

```text
Reranker
    └── SiliconFlowReranker
```

RAG 不允许与具体 Reranker SDK 强耦合。

---

# 9. ASR 架构

ASR = Automatic Speech Recognition。

职责：

> 将音频转换为带时间戳的文字。

系统必须支持多 Provider A/B Test。

计划实现：

```text
TranscriptionProvider
    ├── FasterWhisperProvider
    ├── ParaformerProvider
    ├── SenseVoiceProvider
    └── WhisperXProvider
```

默认 Provider 暂定：

```yaml
asr:
  provider: faster_whisper
```

但最终默认值必须根据真实视频测试结果决定。

---

# 10. ASR Provider 统一输出

任何 ASR Provider 的原始结果都必须转换为统一内部结构。

例如：

```json
{
  "provider": "faster_whisper",
  "model": "small",
  "language": "zh",
  "duration": 3124.3,
  "segments": [
    {
      "start": 2510.2,
      "end": 2518.7,
      "text": "最近 Trump 提出来的 TACO 这个说法……"
    }
  ]
}
```

统一模型：

```text
TranscriptionResult

provider
model
language
duration

segments[]
    start
    end
    text

words[] optional
    start
    end
    text
```

严格要求：

- Chapter 模块不认识 Whisper 原始格式
- RAG 模块不认识 Paraformer 原始格式
- UI 不认识 SenseVoice 原始格式
- 所有 Provider 输出统一 `TranscriptionResult`

---

# 11. ASR 测试要求

必须允许使用同一段真实视频对以下 Provider 做 A/B Test：

- faster-whisper
- Paraformer
- SenseVoice
- WhisperX

重点测试：

- 普通中文识别准确率
- 中英文夹杂
- 专有名词
- Trump
- TACO
- Optimus
- Tesla
- YouTube
- NVIDIA
- Powell
- OpenAI
- DeepSeek
- 美联储
- 科创50
- 人形机器人
- 时间戳准确度
- CPU 耗时
- 内存占用

禁止仅凭主观印象决定最终 Provider。

---

# 12. ASR Lazy Load

禁止程序启动时同时加载所有 ASR 模型。

要求：

> 根据当前配置 Lazy Load 当前 Provider。

模型文件可以同时存在磁盘。

运行时只加载当前正在使用的模型。

---

# 13. Content Source 抽象

V1 只实现：

```text
ContentSource
    └── LocalFileSource
```

未来可扩展：

```text
ContentSource
    ├── LocalFileSource
    ├── BilibiliSource
    ├── DouyinSource
    ├── YouTubeSource
    ├── BaiduNetdiskSource
    ├── AudioSource
    └── TextSource
```

要求：

- 后续处理流水线不能知道内容来自哪个平台
- 不允许在业务代码中到处判断 URL 平台
- 每个平台单独 Adapter
- 禁止实现“任意 URL 直接 wget”
- 禁止自动访问不受信任 URL
- URL 导入必须有明确的支持平台白名单
- 设计时考虑 SSRF 风险

---

# 14. Storage 抽象

V1：

- LocalStorage

未来：

- MinIO
- S3
- 其他对象存储

抽象：

```text
StorageProvider
    ├── LocalStorageProvider
    ├── MinIOStorageProvider
    └── S3StorageProvider
```

数据库保存：

- storage provider
- object key
- relative path

禁止将开发机器绝对路径写入核心业务数据：

```text
/home/xxx/videos/xxx.mp4
```

---

# 15. 视频处理 Pipeline

标准主流程：

```text
UPLOAD / INGEST
        ↓
EXTRACT_AUDIO
        ↓
TRANSCRIBE
        ↓
CHAPTER
        ↓
CHUNK
        ↓
EMBED
        ↓
SUMMARIZE
        ↓
READY
```

每一步必须：

- 有清晰输入
- 有清晰输出
- 可记录状态
- 可记录耗时
- 可单独失败
- 尽量可单独重试

禁止写成一个无法拆分的超大方法：

```python
process_everything(video)
```

---

# 16. 异步任务设计

V1 不使用：

- Redis Queue
- Celery
- RocketMQ
- Kafka

采用：

> **MySQL Task Table + 独立 Python Worker 进程**

运行方式：

```bash
uvicorn app.main:app
```

和：

```bash
python -m app.worker
```

FastAPI：

- 接收请求
- 保存视频
- 创建任务
- 立即返回

Worker：

- 从 MySQL 获取待处理任务
- 处理 Pipeline
- 更新进度
- 记录错误
- 完成任务

---

# 17. 异步任务返回体验

用户上传成功后立即返回：

```json
{
  "message": "上传成功，系统正在后台处理",
  "task_id": 123
}
```

页面允许查看：

```text
解析中 72%
```

---

# 18. ProcessingTask 状态模型

建议状态：

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

同时记录：

```text
current_stage
```

Stage：

```text
INGEST
EXTRACT_AUDIO
TRANSCRIBE
CHAPTER
CHUNK
EMBED
SUMMARIZE
READY
```

任务必须记录：

- id
- video_id
- status
- current_stage
- progress
- error_message
- created_at
- started_at
- finished_at

---

# 19. 进度设计

禁止纯随机假进度。

可以使用阶段权重：

```text
上传                 0-5%
提取音频             5-10%
ASR                 10-65%
章节                65-75%
Chunk               75-80%
Embedding           80-92%
摘要                92-98%
完成                100%
```

ASR 阶段优先根据：

```text
已识别音频时间 / 总音频时间
```

计算真实进度。

---

# 20. 任务幂等与恢复

V1 必须考虑：

- 服务重启
- LLM API 失败
- Embedding 失败
- Milvus 失败
- ASR 失败

例如：

```text
TRANSCRIBE = COMPLETED
CHAPTER = FAILED
```

用户重试时：

> 不应该重新执行已经完成的 ASR。

每个 Pipeline Stage 应尽量可重复执行或检测已有结果。

---

# 21. 核心领域模型

V1 优先围绕以下领域对象设计：

```text
Video
Source
Transcript
TranscriptSegment
Chapter
Topic
Keyword
Chunk
ProcessingTask
Conversation
Message
Feedback
RagTrace
```

禁止为同一概念创造多个混乱命名。

例如：

- Transcript
- Subtitle
- VideoText
- RawText

不得同时表示同一种领域概念。

---

# 22. Transcript 原始数据原则

严格区分：

```text
Original Transcript
≠
AI Summary
```

要求：

- 原始 ASR 转写必须保留
- AI 摘要不能覆盖原始转写
- AI 修改不能污染 Original Transcript
- 摘要可以重新生成
- 原始转写必须可追溯

---

# 23. 人工修订原则

AI 生成内容未来允许人工修订。

例如：

```text
ai_generated_title
manual_title
```

展示优先：

```text
manual_title ?? ai_generated_title
```

但必须保留 AI 原始结果，便于：

- A/B Test
- 模型评估
- Prompt 优化
- 错误追踪

---

# 24. Chapter

Chapter 至少包含：

- id
- video_id
- title
- start_time
- end_time
- summary
- order
- topic relations

前端允许用户：

- 查看章节
- 查看摘要
- 查看对应转写
- 从章节上下文进入 AI 问答

---

# 25. Topic 与 Keyword

必须区分：

```text
Topic
```

和：

```text
Keyword
```

例如：

```text
Topic:
人形机器人

Keywords:
Optimus
Tesla
具身智能
机器人
```

Topic 应有稳定 ID。

后续用于跨视频查询：

> “最近一个月所有涉及人形机器人的内容。”

---

# 26. RAG 架构

禁止设计一个超大 `RagService` 承担所有逻辑。

拆分：

```text
Query Understanding
        ↓
Retriever
        ↓
Reranker
        ↓
Context Builder
        ↓
Answer Generator
        ↓
Citation Builder
```

至少保留以下抽象边界：

```text
Retriever
Reranker
ContextBuilder
AnswerGenerator
CitationBuilder
```

但禁止为了形式主义给每个简单类都创建多层 Factory。

---

# 27. RAG Query Scope

统一定义查询范围：

```text
CHAPTER
VIDEO
TOPIC
GLOBAL
EXTERNAL
```

示例：

用户从：

```text
41:50 人形机器人
```

进入聊天：

```text
scope = CHAPTER
chapter_id = xxx
```

用户问：

> “最近一个月博主怎么讨论黄金？”

可能使用：

```text
scope = TOPIC
```

或：

```text
scope = GLOBAL
```

禁止通过 Prompt 字符串猜测当前查询范围。

---

# 28. Chunk 策略

Chunk 必须可配置、可版本化。

未来可能实验：

- 固定字符数
- 固定 token
- 按 TranscriptSegment
- 按章节
- 语义切分
- Sliding Window
- Chapter-aware Chunk

必须记录：

```text
chunk_strategy
chunk_version
```

避免未来无法判断某条向量由什么策略生成。

---

# 29. 搜索能力

V1 优先：

- Dense Vector Search

后续允许扩展：

- Keyword Search
- Full Text Search
- Metadata Filter
- Hybrid Search
- Rerank

例如：

> “Optimus”

这种精确专有名词，未来允许关键词检索参与，而不是完全依赖向量检索。

---

# 30. Citation / Provenance

这是本项目最重要的核心能力之一。

任何来自原视频的结论必须能够追踪：

```text
Answer
 ↓
Chunk
 ↓
TranscriptSegment
 ↓
Chapter
 ↓
Video
 ↓
Source
```

回答中的引用至少包含：

- 原文片段
- start timestamp
- 必要时 end timestamp
- video_id
- chapter_id

例如：

```text
[42:16]
“……”
```

---

# 31. 外部来源

必须区分：

```text
Primary Source
```

和：

```text
External Source
```

例如：

Primary：

- 原始博主视频

External：

- 官方网站
- 新闻媒体
- X
- YouTube
- 其他公开来源

禁止 AI 把外部新闻写成：

> “博主认为……”

必须明确来源类型。

---

# 32. Prompt 管理

禁止 Prompt 散落在业务代码。

目录建议：

```text
prompts/
├── chapter/
├── summary/
├── qa/
├── topic/
└── external_source/
```

Prompt 必须：

- 集中管理
- 可版本化
- 可测试
- 支持替换

记录：

```text
prompt_name
prompt_version
```

---

# 33. 财经内容安全边界

本系统定位：

> 内容整理、总结、检索和知识问答。

禁止生成：

- 个股推荐
- 买入建议
- 卖出建议
- 仓位建议
- 目标价
- 具体交易策略
- 代替用户进行投资决策

系统可以：

- 总结宏观观点
- 总结指数观点
- 总结黄金、美债、汇率等内容
- 总结国际关系
- 总结产业趋势
- 引用原视频
- 引用公开外部来源

必须区分：

```text
内容摘要
```

与：

```text
系统自主投资建议
```

后者不属于产品目标。

---

# 34. 内容权限

当前 V1：

```text
PRIVATE
```

未来可能：

```text
MEMBER_ONLY
PUBLIC
```

建议 Content Access Policy：

```text
PRIVATE
MEMBER_ONLY
PUBLIC
```

当前不做完整用户系统。

但禁止把：

```text
current_user = "固定用户名"
```

硬编码进核心业务。

---

# 35. Feedback

V1 必做反馈功能。

回答支持：

```text
有帮助
无帮助
```

错误分类至少预留：

```text
TRANSCRIPTION_ERROR
SUMMARY_ERROR
CITATION_ERROR
TIMESTAMP_ERROR
RETRIEVAL_ERROR
ANSWER_ERROR
OTHER
```

Feedback 必须尽可能关联：

- video_id
- chapter_id
- conversation_id
- message_id
- rag_trace_id
- feedback_type
- user_comment

---

# 36. RAG Trace

RAG 问答尽可能记录：

- 用户问题
- scope
- retrieved chunk ids
- retrieval scores
- rerank scores
- final context chunk ids
- llm provider
- llm model
- embedding provider
- embedding model
- prompt version
- chunk strategy
- answer
- latency

目的：

> 以后用户反馈“回答不对”时，可以复现 AI 当时为什么这么回答。

---

# 37. API 规范

API 从第一天版本化：

```text
/api/v1/...
```

例如：

```text
/api/v1/videos
/api/v1/videos/{id}
/api/v1/videos/{id}/chapters
/api/v1/tasks
/api/v1/tasks/{id}
/api/v1/chat
/api/v1/conversations
/api/v1/feedback
```

前端只依赖：

> API Contract

前端不得依赖：

- SQLAlchemy
- Milvus
- faster-whisper
- Worker 内部状态实现
- Python 内部类名

---

# 38. 为未来 Java 接管业务层预留边界

当前：

```text
React
  ↓
FastAPI
```

未来允许演化：

```text
React
  ↓
Spring Boot
  ↓
Python AI Service
      ├── ASR
      ├── RAG
      ├── Embedding
      └── LLM
```

因此从 V1 开始：

- API DTO 必须稳定
- AI 核心逻辑不写在 Controller
- HTTP 层与 Domain 层分离
- ASR / RAG / Embedding / LLM 有清晰服务边界
- 不让前端依赖 Python 细节

未来是否引入 Java，必须由真实业务复杂度决定。

禁止为了未来可能使用 Java 而提前增加额外服务。

---

# 39. 推荐目录结构

建议：

```text
project-root/
├── CODEX.md
├── README.md
├── docker-compose.yml
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── videos/
│   │   │   ├── chapters/
│   │   │   ├── chat/
│   │   │   ├── tasks/
│   │   │   └── feedback/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── domain/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── ai/
│   │   │   ├── llm/
│   │   │   ├── embedding/
│   │   │   ├── reranker/
│   │   │   └── prompts/
│   │   ├── transcription/
│   │   │   ├── providers/
│   │   │   ├── models/
│   │   │   └── service.py
│   │   ├── rag/
│   │   │   ├── retriever/
│   │   │   ├── reranker/
│   │   │   ├── context/
│   │   │   ├── answer/
│   │   │   └── citation/
│   │   ├── storage/
│   │   ├── vector_store/
│   │   ├── content_source/
│   │   ├── tasks/
│   │   ├── worker/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   └── ...
│
└── data/
    ├── videos/
    ├── audio/
    └── temp/
```

允许根据代码量合理简化。

禁止仅为了与该目录完全一致而制造空文件夹和空抽象。

---

# 40. Configuration

所有环境相关信息外置。

例如：

```yaml
database:
  url: ${DATABASE_URL}

llm:
  provider: ${LLM_PROVIDER:openai}

embedding:
  provider: ${EMBEDDING_PROVIDER:siliconflow}

asr:
  provider: ${ASR_PROVIDER:faster_whisper}

vector_store:
  provider: ${VECTOR_STORE_PROVIDER:milvus}

storage:
  provider: ${STORAGE_PROVIDER:local}
```

禁止硬编码：

- API Key
- 数据库密码
- 模型地址
- Host
- 生产 IP
- 文件绝对路径

---

# 41. Secret

Secrets 必须通过：

- `.env`
- 环境变量
- Secret Manager（未来）

管理。

`.env` 不允许提交 Git。

必须提供：

```text
.env.example
```

但不得包含真实密钥。

---

# 42. 日志与可观察性

V1 不要求：

- Prometheus
- Grafana
- ELK

但必须有结构化日志。

关键日志字段：

- trace_id
- task_id
- video_id
- stage
- provider
- model
- latency_ms

至少记录：

- 视频处理耗时
- ASR 耗时
- LLM 耗时
- Embedding 耗时
- Milvus 检索耗时
- Rerank 耗时
- Pipeline 失败阶段
- 异常堆栈

禁止依赖大量临时 `print()` 调试。

---

# 43. Error Handling

定义统一错误体系。

至少区分：

- Validation Error
- Storage Error
- ASR Error
- LLM Error
- Embedding Error
- Vector Store Error
- RAG Error
- Task Error
- External Source Error

API 不得直接把完整内部异常堆栈返回浏览器。

完整异常写日志。

客户端获得：

- 稳定 error code
- 可理解 message
- trace_id

---

# 44. Testing

后端至少使用：

- pytest

每次修改相关代码必须执行对应测试。

核心模块优先覆盖：

- Provider Factory
- ASR result normalization
- Pipeline state
- Task retry
- Chapter parsing
- RAG scope
- Citation mapping
- Feedback
- API contract

---

# 45. Golden Sample

项目必须准备至少一份固定测试素材：

```text
5-10 分钟真实视频
```

用于回归测试：

- ASR
- 中英文混合
- 时间戳
- Chapter
- Chunk
- Retrieval
- Rerank
- QA

固定测试问题必须长期保留。

目的：

> 防止代码测试全部通过，但 AI 实际回答质量下降。

---

# 46. Frontend Build Validation

前端修改后至少执行：

```bash
pnpm build
```

如果使用 npm：

```bash
npm run build
```

Codex 不允许只修改代码而不验证构建。

---

# 47. Backend Validation

后端修改后根据任务执行：

```bash
pytest
```

必要时：

```bash
python -m compileall app
```

数据库结构变化必须检查 Alembic migration。

---

# 48. Docker

V1 部署：

- Docker Compose
- M710q

应用代码不得依赖 Docker Compose 才能运行。

本地开发：

```text
Python / Node
```

Docker：

```text
Container
```

未来服务器部署：

```text
Container
```

必须尽量运行同一套应用代码。

## 48.1 固定部署环境

本项目的长期部署目标固定为用户的 M710q 小服务器：

```text
Host: 192.168.2.2
Network: 通过网线与开发用 Mac 直连
Deployment: Docker Compose 优先
Database: M710q 上的 MySQL 8.x
MySQL 8 host port: 3307
```

注意：服务器的 `3306` 当前是 MySQL 5.7，不能作为本项目要求的 MySQL 8 实例；本项目应通过环境变量连接 `192.168.2.2:3307`，不得把 IP、端口、账号或密码硬编码进业务代码。

每个涉及新基础设施、系统包、模型运行时或服务器部署的 Phase，必须在任务开始前：

1. 只读盘点 M710q 当前能力。
2. 明确列出缺失组件、用途、版本、资源与端口需求。
3. 提前告知用户并获得确认后再安装或部署。
4. 不得干扰服务器上已有容器、端口和数据。
5. Secret 只能通过未提交的环境变量或服务器 Secret 配置提供。

截至 2026-09-20 的只读盘点：Docker、Python 3.12 与 FFmpeg 已存在；Node.js、MySQL/MariaDB 主机客户端和 Milvus 尚未发现。该盘点会随服务器状态变化，正式使用前必须重新核验。

---

# 49. 性能原则

当前使用场景：

- 私人使用
- 低并发
- 一周少量视频
- 不要求实时 ASR

因此：

- 不为不存在的 QPS 提前优化
- 不为 ASR 跑 1-2 小时而自动引入复杂分布式架构
- 优先正确性、可追溯性和可恢复性

如果一个 1 小时视频 CPU 后台处理数小时，只要不阻塞 Web 请求，V1 可以接受。

---

# 50. 编码原则

始终遵循：

- KISS
- 高内聚
- 低耦合
- 单一职责
- 明确边界
- 优先可读性
- 优先已有模式
- 不做无必要抽象

禁止：

- 为每个类创建接口
- 为简单逻辑使用复杂设计模式
- 巨型 Service
- 巨型 Controller
- 循环依赖
- 跨模块随意调用内部实现
- 重复 Provider 判断
- 重复配置解析
- Prompt 散落
- SQL 散落
- SDK 调用散落

---

# 51. 哪些地方值得抽象

优先抽象真正可能变化的基础设施：

```text
ContentSource
StorageProvider
TranscriptionProvider
LLMProvider
EmbeddingProvider
VectorStore
Reranker
TaskExecutor
```

不要求：

```text
VideoServiceInterface
VideoServiceImpl
ChapterServiceInterface
ChapterServiceImpl
```

这种没有实际多实现需求的形式主义抽象。

---

# 52. Codex 工作方式

Codex 每次接到任务时必须：

### 开始前

1. 阅读 `CODEX.md`
2. 阅读任务涉及的现有代码
3. 确认当前实现方式
4. 优先沿用项目现有模式
5. 不允许凭空猜测已有类、方法、数据库字段

### 开发前

如果任务影响：

- 架构
- 数据库
- Provider
- 公共 API
- Pipeline

必须先输出简短实施方案，再修改代码。

---

# 53. Codex 任务粒度

禁止：

> “一次性把整个系统全部做完。”

大型任务必须拆分。

建议单次任务规模：

> 一个熟练工程师约 30-90 分钟能完成的独立开发任务。

例如：

```text
阶段1：
初始化 FastAPI 项目和配置

阶段2：
完成 Video + Upload

阶段3：
完成 ProcessingTask + Worker

阶段4：
完成 FFmpeg 音频提取

阶段5：
完成 ASR Provider 抽象

阶段6：
接入 faster-whisper

阶段7：
接入其他 ASR Provider

阶段8：
Transcript 持久化

阶段9：
Chapter

阶段10：
Embedding + Milvus

阶段11：
RAG

阶段12：
问答 + Citation

阶段13：
Feedback

阶段14：
前端完整串联
```

每阶段完成后先验证，再进入下一阶段。

---

# 54. Codex 修改约束

Codex 不允许：

- 未经要求大规模重构
- 修改与当前任务无关的模块
- 擅自更换框架
- 擅自增加 Redis
- 擅自增加 MQ
- 擅自改数据库
- 擅自改目录架构
- 擅自引入新状态管理框架
- 擅自引入微服务
- 擅自添加鉴权系统
- 擅自实现支付
- 擅自增加复杂设计模式

需要新增大型依赖时：

> 必须先说明为什么现有依赖不能解决问题。

---

# 55. Codex 完成任务后的要求

每次完成开发必须：

1. 运行对应测试
2. 运行构建或编译检查
3. 修复自己引入的问题
4. 检查是否违反 `CODEX.md`
5. 输出修改文件列表
6. 简述每个文件修改目的
7. 说明执行了哪些验证
8. 说明验证结果
9. 明确列出未完成事项
10. 不得声称未执行的测试“已通过”

---

# 56. Definition of Done

一个任务完成至少满足：

```text
功能实现
+
边界正确
+
测试通过
+
构建通过
+
错误处理存在
+
日志合理
+
没有无关重构
+
没有违反 CODEX.md
```

---

# 57. V1 开发优先级

## P0：必须完成

- React 基础 UI
- 视频上传
- Video 管理
- ProcessingTask
- Worker
- 音频提取
- faster-whisper
- Transcript
- Chapter
- Chapter Summary
- Chunk
- BGE-M3
- Milvus
- Retrieval
- Reranker
- LLM QA
- Citation
- 时间戳
- Feedback
- 任务进度

## P1：应该完成

- ASR Provider 抽象
- Paraformer
- SenseVoice
- WhisperX
- LLM Provider Factory
- Embedding Provider
- ASR Benchmark
- RAG Trace
- Topic
- Keyword

## P2：后续再做

- URL Source
- Bilibili
- YouTube
- Douyin
- MinIO
- PostgreSQL
- Hybrid Search
- 外部新闻检索
- 历史观点变化
- 用户体系
- 会员访问控制
- Spring Boot 业务层

---

# 58. 第一阶段验收目标

第一阶段产品必须能够完成：

```text
上传一个视频
        ↓
立即返回“系统正在后台处理”
        ↓
查看真实解析进度
        ↓
ASR 转写
        ↓
自动章节
        ↓
章节摘要
        ↓
向量索引
        ↓
进入某章节提问
        ↓
AI 回答
        ↓
返回对应原文
        ↓
返回准确时间戳
```

示例：

```text
41:50 人形机器人

用户：
“这一部分对 Optimus 的看法是什么？
详细总结，并给出原文。”

系统：
- 详细总结
- 关键观点
- 原始 Transcript 引用
- [42:16]
- [44:31]
```

这个闭环完成前，不优先实现其他高级功能。

---

# 59. 最终原则

本项目的核心竞争力不是：

> “调用一个大模型 API。”

而是：

```text
可靠的视频处理
+
准确的时间戳转写
+
结构化章节
+
可追溯的 RAG
+
准确引用
+
Provider 可替换
+
真实用户反馈闭环
```

技术设计必须始终服务于这个核心目标。

当“简单方案”和“理论上更完美但复杂的方案”都能解决当前需求时：

> 优先简单方案。
