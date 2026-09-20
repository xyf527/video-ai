# Phase 02-X 共用提示词

以下正文必须原样发送给 Codex CLI 与 Claude Code CLI。两边不得增删任何候选专属实现提示。

```text
你是 AI Video Knowledge Assistant Benchmark 的候选 Coding Agent。

请在当前候选 Worktree 中执行 `benchmark/tasks/phase-02-x/task.md` 定义的 Phase 02-X 任务。

任务文件已由项目总控预先分发，位置如下：

- Codex：`/Users/xyf/PycharmProjects/video-ai-codex/benchmark/tasks/phase-02-x/task.md`
- Claude：`/Users/xyf/PycharmProjects/video-ai-claude/benchmark/tasks/phase-02-x/task.md`
- 统一相对路径：`benchmark/tasks/phase-02-x/task.md`
- 预期 SHA-256：`657107db576e56e47ecf6a5c7a7269d7a4e773d7`

开始前必须确认当前 Worktree 中该文件存在且 SHA-256 与预期一致。不一致时立即停止并报告，不得根据旧 Phase 文档猜测实现。

本次任务合并 Persistence Foundation、Local Video Upload、LocalStorage 和最小前端联通，但明确不包含 Worker、FFmpeg 或任何 AI 能力。

开始规划、修改代码或运行开发命令前，必须完整阅读：

1. `CODEX.md`
2. `BENCHMARK.md`
3. `PHASES.md`
4. `benchmark/tasks/phase-02-x/task.md`
5. 当前工具对应的入口文件：Codex 读取 `AGENTS.md`，Claude Code 读取 `CLAUDE.md`

候选运行配置统一为：

- Model: gpt-5.6-luna
- Reasoning Effort: medium
- Router: CC Switch

执行规则：

- 只在当前候选 Worktree 中工作，并延续本分支自己的 Phase 01 实现。
- 不得读取、参考、复制或修改另一个候选 Worktree。
- 修改前先检查当前 Git branch、HEAD 和工作区状态，并在汇报中记录。
- 先输出简短实施方案，再开始修改，因为本任务影响数据库、公共 API 和 Storage 边界。
- 严格执行 `benchmark/tasks/phase-02-x/task.md` 中的 API Contract、数据模型、失败补偿、测试和范围限制。
- 不得实现 Worker、任务领取循环、FFmpeg、媒体处理、ASR、RAG 或其他后续 Phase。
- 不得修改 Benchmark、Judge 或 Hidden Tests。
- 不得弱化、删除或篡改测试。
- 独立完成实现、调试、后端测试、Alembic upgrade/downgrade、编译检查、前端生产构建和可执行的真实联通验证。
- 没有 MySQL 环境时可以完成隔离数据库自动测试，但必须将 MySQL 实测标记为 NOT RUN。
- 任何测试未运行或失败都必须如实记录，不得写成通过。
- 保留真实错误、重试和修复过程。
- 不得提交 Secret、依赖目录、构建产物、本机绝对路径或测试上传文件。
- 完成后严格按任务文件第 16 节格式使用简体中文汇报。
- 完成 Phase 02-X 后立即停止，不得开始 Phase 04，也不得自行推送远程分支。

Benchmark 固定端口映射如下，必须根据当前 Git branch 选择，且不得占用另一候选端口：

- `agent/codex`: Backend 8001，Frontend 5173。
- `agent/claude`: Backend 8000，Frontend 5174。

端口只能作为本地运行参数或开发代理配置，不得硬编码进领域逻辑。

请记录真实的任务 Start、End 和 Wall Clock Time。无法可靠获得时写 NOT AVAILABLE，不得通过 Git 提交时间推算。

现在开始执行 Phase 02-X。
```

## 外部运行记录要求

项目总控应从发送上述提示词开始计时，到候选输出最终完成汇报为止。

Claude Code 非交互执行时建议启用：

```text
--output-format json
```

保存最终结果中的：

- `duration_ms`
- `duration_api_ms`
- `num_turns`
- `session_id`

Codex CLI 同样应保存完整会话输出、开始时间和结束时间。两边都不得把安装依赖或测试时间排除在 Agent Wall Clock Time 之外。
