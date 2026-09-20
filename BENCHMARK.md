# BENCHMARK.md

# AI Video Knowledge Assistant — Coding Agent Benchmark

## 1. Benchmark 目的

本 Benchmark 用于比较两套真实 Coding Agent 工作流：

- Codex CLI + GPT-5.6 Luna（medium）
- Claude Code CLI + GPT-5.6 Luna（medium）

主要比较 Coding Agent Harness 的工程执行能力，而不是比较底层模型能力。

两边必须尽可能保持：
- 相同模型
- 相同 Provider
- 相同项目基线
- 相同任务文本
- 相同硬件
- 相同测试
- 相同人工干预规则

ChatGPT Work 主控同样使用 GPT-5.6 Sol（medium），只作为需求文档编写者、测试设计者、Judge、Code Review 辅助与结果分析者，不得直接替任一候选 Agent 修改候选实现代码。主控会话的运行记录不得计入任何候选结果。

## 2. 候选配置

### Candidate A — Codex

```text
Harness: Codex CLI
Model: gpt-5.6-luna
Reasoning Effort: medium
Router: CC Switch
CC Switch Profile: 独立 Codex 配置
Worktree: video-ai-codex
Branch: agent/codex
Backend Port: 8001
Frontend Port: 5173
```

### Candidate B — Claude

```text
Harness: Claude Code CLI
Model: gpt-5.6-luna
Reasoning Effort: medium
Router: CC Switch
CC Switch Profile: 独立 Claude 配置
Worktree: video-ai-claude
Branch: agent/claude
Backend Port: 8000
Frontend Port: 5174
```

正式 Benchmark 中两边不得使用不同模型。

## 3. Repository 结构

```text
~/Code/
├── video-ai/          # main / benchmark baseline
├── video-ai-codex/    # agent/codex
└── video-ai-claude/   # agent/claude
```

基线仓库包含：

```text
CODEX.md
AGENTS.md
CLAUDE.md
BENCHMARK.md
PHASES.md
benchmark/
```

两个 Worktree 必须从同一个 Tag 开始，例如：

```bash
git tag benchmark-v0
```

## 4. 公平性原则

### 4.1 相同任务

每个 Phase 使用完全相同的任务文件：

```text
benchmark/tasks/phase-XX/task.md
```

禁止针对某一个 Agent 临时增加额外说明。

如果任务本身存在歧义：
1. 暂停两边该 Phase。
2. 修改公共 Task。
3. 两边都从 Phase 开始前 Commit 重跑。

### 4.2 相同起点

Phase 01 两边必须从完全相同的 `benchmark-v0` 开始。

Phase 02 以后，两边分别在自己的前一 Phase 结果上继续开发，用来测试前期架构决策如何影响后续开发。

### 4.3 禁止交叉污染

禁止：
- 把 Codex 的代码给 Claude 参考
- 把 Claude 的代码给 Codex 参考
- 告诉某一边另一边的解决方案
- 把 Judge 的具体修复实现直接发给候选 Agent

允许：
- 将相同的测试失败日志返回给对应 Agent
- 将相同等级的人工提示返回给对应 Agent

## 5. 人工干预等级

### Level 0 — 无人工干预
Agent 自主阅读、实现、运行命令、Debug、测试。

### Level 1 — 回答 Agent 主动提问
只回答无法从 Repository / CODEX.md / Task 中获得的信息，不主动给方案。

### Level 2 — 提供失败信息
可以提供 pytest 输出、build 输出、stack trace、HTTP 错误、人工测试失败现象。

### Level 3 — 指出问题位置
例如：“问题与 ProcessingTask 重试逻辑有关。”

### Level 4 — 提供修复方案
例如：“请给 current_stage 增加持久化并从失败 Stage 恢复。”

## 6. Agent 最大重试规则

每个 Phase：
- Initial Attempt：1 次
- Self Fix Round：最多 3 次

流程：

```text
Agent 初次实现
→ Agent 自己运行测试
→ Judge Tests
→ 失败
→ 返回失败输出（Level 2）
→ Agent Fix #1
→ Judge Tests
→ ...
```

连续 3 轮仍无法通过：

```text
Phase = FAILED / PARTIAL
```

不允许无限提示直到通过。

## 7. 测试分层

### 7.1 Agent Self Test
候选 Agent 自己负责运行：
- pytest
- frontend build
- migration check
- lint/type check（项目配置后）
- 自己认为必要的测试

重点记录 Agent 是否主动测试。

### 7.2 Public Automated Tests
任务中明确告诉 Agent 的测试要求。

### 7.3 Judge / Hidden Tests
由 GPT-5.6 Sol / Pro 辅助设计，候选 Agent 开发时不得读取 `benchmark/tests/hidden/`。

Hidden Tests 验证：
- 边界情况
- 错误处理
- 数据一致性
- 是否真正遵守接口
- 是否通过修改公开测试“作弊”

### 7.4 Manual Acceptance Test
由人工按照固定 Checklist 执行，必须在 Phase 开始前定义。

### 7.5 Subjective Review
单独评分：
- 可读性
- 简洁程度
- 架构合理性
- 是否过度设计
- Developer Experience

## 8. Judge Tests 保护

候选 Agent 禁止修改：

```text
benchmark/tests/hidden/phase-XX/
benchmark/judge/phase-XX/
```

若修改则记录 `Integrity Violation` 并扣分。

## 9. Token 与费用参考

主要使用 CC Switch Usage Statistics。

分别过滤：

```text
App = Codex
App = Claude
```

如 CC Switch 能稳定提供，则记录：
- Requests
- Input Tokens
- Output Tokens
- Cache Read Tokens
- Cache Creation Tokens（如有）
- Cache Hit Rate
- Estimated Cost
- Average Latency

这些数据仅供参考，不作为精确账单，也不进入评分。原因包括：不同 Harness 的缓存口径、上下文统计方式和 CC Switch 估算方式可能不同，Estimated Cost 也不等同于官方账单。缺失某项统计时记录 `NOT AVAILABLE`，不得自行推算或补造数据。

## 10. CC Switch 配置隔离

Codex 与 Claude 使用独立的 CC Switch 配置或应用路由，例如：

```text
GPT-5.6-Luna-Codex
GPT-5.6-Luna-Claude
```

用途：
- 核对两个 Harness 是否实际路由到 `gpt-5.6-luna`
- 确认两边 reasoning effort 均为 `medium`
- 分开查看 CC Switch 的请求和用量参考
- 避免候选统计混在同一应用记录中

## 11. 统计解释边界

- 不计算或比较 `Actual Cost` 与 `Normalized Cost`。
- 不把 CC Switch Estimated Cost 描述为官方账单。
- 不因 Token、缓存或费用字段缺失而扣分。
- 效率比较优先使用 Wall Clock Time、重试次数、人工干预和任务完成质量。
- 若未来获得可核验的官方账单，可作为独立附录补充，不追溯改变既有评分。

## 12. ChatGPT Work 主控运行不计入 Candidate

ChatGPT Work 主控执行的文档、测试、Judge、Review 和结果分析，不计入 Codex 或 Claude Candidate 的用量与运行时间。

## 13. 时间记录

每个 Phase 记录：

### Agent Wall Clock Time
从发送 Task 到 Agent 宣布完成，包括思考、编码、命令、测试、自修复。

### Human Attention Time
人工实际盯着、操作、回复、修正 Agent 的时间。

## 14. Git 记录规则

每个 Phase 完成后分别 Commit：

```text
feat(phase-01): bootstrap project
feat(phase-02): persistence foundation
...
```

记录：
- before_commit
- after_commit

便于 Phase-by-Phase Diff。

## 15. 禁止无关修改

候选 Agent 每个 Phase 只能修改与当前任务相关的内容。

明显无关重构记录为：
- Scope Drift
- Overengineering

## 16. 评分体系（100 分）

- Functional Correctness：35
- Architecture & CODEX Compliance：15
- Robustness：10
- Code Quality：10
- Scope Discipline：5
- Debug & Self-Recovery：10
- Execution Efficiency：5
- Developer Experience：10

建议权重来源：

```text
客观测试 / 可量化指标：60%
GPT-5.6 Judge Review：20%
人工体验：20%
```

## 17. 每个 Phase 结果模板

```markdown
# Phase XX Result

## Candidate
Codex / Claude

## Git
Before:
After:

## Model
gpt-5.6-luna

## Reasoning Effort
medium

## Router
CC Switch

## Agent Runtime
00:00:00

## Human Attention
00:00:00

## Usage Reference（可选、非权威）
- Input:
- Output:
- Cache Read:
- Cache Creation:
- Total:
- Estimated Cost:
- Source: CC Switch / NOT AVAILABLE

## Agent Self Test
- Commands:
- Result:

## Judge Automated Tests
- Passed:
- Failed:

## Manual Tests
- Passed:
- Failed:

## Intervention
- Level 0:
- Level 1:
- Level 2:
- Level 3:
- Level 4:

## Architecture Violations
None / ...

## Overengineering
None / ...

## Score
- Functional:
- Architecture:
- Robustness:
- Code Quality:
- Scope:
- Debug:
- Execution Efficiency:
- DX:

## Notes
...
```

## 18. Long Session 与 Fresh Session

### Long Session
建议 Phase 01-05 尽量使用同一个 CLI Session，观察上下文积累后是否退化。

### Fresh Session
从指定 Phase 开启全新 Session，只依赖 Repository、CODEX.md、AGENTS.md / CLAUDE.md 和当前 Task，测试上下文恢复能力。

## 19. Benchmark 最终结论边界

允许得出：

> 在本项目、相同 GPT-5.6 Luna（medium）、相同 CC Switch 路由条件、相同任务和相同环境下，Codex CLI 与 Claude Code CLI 两套工作流的表现差异。

不允许直接推广成：
- Codex 永远优于 Claude Code
- Claude Code 永远优于 Codex
- GPT-5.6 Luna 模型本身优于/弱于其他模型

## 20. 最终输出

项目完成后生成：

```text
benchmark/results/final-comparison.md
```

至少包含：
- Phase-by-Phase 得分
- Token / Cache / Estimated Cost 参考（仅在 CC Switch 可稳定提供时展示）
- 总运行时间
- 总人工时间
- 干预次数
- Debug 成功率
- Build/Test 成功率
- 架构问题
- 最终代码量
- 最终功能完成率
- 个人使用体验

## 21. 最重要原则

失败也保留。

真实的：
- 错误
- 重试
- 错误架构
- 幻觉
- 测试失败
- 人工干预

本身就是 Benchmark 结果和视频素材。
