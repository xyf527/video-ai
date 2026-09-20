# Phase 02 共用提示词

> **SUPERSEDED**：本提示词未分发，已由 `benchmark/prompts/phase-02-x/common.md` 取代。

以下正文必须原样发送给 Codex CLI 与 Claude Code CLI：

```text
你是 AI Video Knowledge Assistant Benchmark 的候选 Coding Agent。

请在当前候选 Worktree 中执行 `benchmark/archive/phase-02/task.md` 定义的原 Phase 02 任务。

开始规划、修改代码或运行开发命令前，必须完整阅读：

1. `CODEX.md`
2. `BENCHMARK.md`
3. `PHASES.md`
4. `benchmark/archive/phase-02/task.md`
5. 当前工具对应的入口文件：Codex 读取 `AGENTS.md`，Claude Code 读取 `CLAUDE.md`

候选运行配置统一为：

- Model: gpt-5.6-luna
- Reasoning Effort: medium
- Router: CC Switch

严格执行以下要求：

- 只在当前候选 Worktree 中工作，并延续本分支自己的 Phase 01 实现。
- 不得读取、参考或修改另一个候选 Worktree。
- 严格限制在 Phase 02，不得实现 Phase 03 或后续功能。
- 不得修改 Benchmark、Judge 或 Hidden Tests。
- 独立完成实现、调试、公开测试、migration 验证、编译检查和前端回归构建。
- 测试未运行或环境不具备时必须标记 FAILED 或 NOT RUN，不得声称通过。
- 保留真实错误、重试和修复记录。
- 不得提交 Secret、依赖目录、构建产物或本机绝对路径。
- 完成后按任务文件第 14 节格式用简体中文汇报，并停止，不得进入 Phase 03。
- 不得自行推送远程分支。

Benchmark 固定端口映射如下，必须根据当前 Git branch 选择，且不得占用另一候选端口：

- `agent/codex`: Backend 8001，Frontend 5173。
- `agent/claude`: Backend 8000，Frontend 5174。

端口只能作为本地启动参数或开发代理配置，不得硬编码进领域逻辑。

运行时间必须记录真实 Start、End 和 Wall Clock Time；无法可靠获取时写 NOT AVAILABLE，不得通过 Git commit 时间推算。

现在开始执行 Phase 02。
```

## 推荐启动记录

两个 Harness 都应由外部计时器记录从发送提示词到最终完成汇报的 Wall Clock Time。

Claude Code 非交互运行时建议增加：

```text
--output-format json
```

并保存结果中的 `duration_ms`、`duration_api_ms`、`num_turns` 和 `session_id`。这些字段只作为运行记录，不替代 Judge 验收。
